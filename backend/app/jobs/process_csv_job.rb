class ProcessCsvJob < ApplicationJob
  queue_as :default
  require 'csv'

  BATCH_SIZE = 1000 # Process 1000 transactions at a time

  def perform(csv_data, user_id)
    user = User.find(user_id)
    
    # First pass: collect unique categories and create them in bulk
    csv_rows = CSV.parse(csv_data, headers: true)
    total_rows = csv_rows.count
    
    # Pre-process categories
    category_names = csv_rows.map { |row| row['category']&.strip }.compact.uniq
    existing_categories = user.categories.where(name: category_names).index_by(&:name)
    
    # Create missing categories in bulk
    missing_categories = category_names - existing_categories.keys
    if missing_categories.any?
      new_categories = missing_categories.map do |name|
        user.categories.build(name: name)
      end
      Category.import(new_categories)
      
      # Update our category lookup hash with the newly created categories
      new_categories_lookup = user.categories.where(name: missing_categories).index_by(&:name)
      existing_categories.merge!(new_categories_lookup)
    end

    # Pre-load rules for uncategorized transactions
    rules = user.rules.includes(:category)

    # Process transactions in batches
    transactions_to_import = []
    csv_rows.each_slice(BATCH_SIZE).with_index do |batch, batch_index|
      batch.each do |row|
        category = nil
        status = 'valid'
        
        if row['category'].present?
          category_name = row['category'].strip
          category = existing_categories[category_name]
        elsif row['description'].present? || row['amount'].present?
          # Apply rules to uncategorized transactions
          matching_rule = find_matching_rule(rules, row['description'], row['amount'].to_f)
          if matching_rule
            if matching_rule.action_type == 'set_category'
              category = matching_rule.category
            elsif matching_rule.action_type == 'set_status'
              status = matching_rule.action_value
            end
          end
        end

        # Build transaction without saving
        transaction = user.transactions.build(
          date: parse_date(row['date']),
          amount: row['amount'],
          description: row['description'],
          category: category,
          status: determine_status(row['description'], category, row['amount'], status)
        )

        transactions_to_import << transaction
      end

      # Import the batch
      Transaction.import(
        transactions_to_import,
        validate: false # Skip validation as we've handled it in determine_status
      )
      transactions_to_import = [] # Clear the array for the next batch

      # Report progress
      progress = ((batch_index + 1) * BATCH_SIZE * 100.0 / total_rows).round(2)
      logger.info "Processed #{(batch_index + 1) * BATCH_SIZE} of #{total_rows} transactions (#{progress}%)"
    end
  end

  private

  def find_matching_rule(rules, description, amount)
    rules.find do |rule|
      case rule.condition_type
      when 'description_contains'
        description&.downcase&.include?(rule.condition_value.downcase)
      when 'amount_greater_than'
        amount > rule.condition_value.to_f
      when 'amount_less_than'
        amount < rule.condition_value.to_f
      else
        false
      end
    end
  end

  def determine_status(description, category, amount, rule_status = 'valid')
    if description.blank? || category.nil?
      'invalid'
    elsif amount.to_f.abs >= 5000
      'invalid'  # Flag large transactions
    else
      rule_status # Use status from rule if applied
    end
  end

  def parse_date(date_string)
    return nil if date_string.blank?

    begin
      # Parse the specific format from CSV: "MM/DD/YYYY HH:MM:SS" (already in UTC)
      DateTime.strptime(date_string, '%m/%d/%Y %H:%M:%S')
    rescue ArgumentError
      begin
        # Fallback: try to parse as date only and set to midnight
        Date.strptime(date_string, '%m/%d/%Y').to_datetime.beginning_of_day
      rescue ArgumentError
        nil
      end
    end
  end
end
