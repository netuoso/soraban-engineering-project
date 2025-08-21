class ProcessCsvJob < ApplicationJob
  queue_as :default
  require 'csv'

  def perform(csv_data, user_id)
    user = User.find(user_id)
    
    CSV.parse(csv_data, headers: true) do |row|
      transaction = user.transactions.build(
        date: parse_date(row['date']),
        amount: row['amount'],
        description: row['description']
      )

      # Check for existing rules to auto-categorize
      if transaction.description.present?
        rule = user.rules.find_by("? ~* pattern", transaction.description)
        transaction.category = rule.category if rule
      end

      # Set status based on validation rules
      transaction.status = if transaction.description.blank? || transaction.category.nil?
                           'invalid'
                         elsif transaction.amount.abs >= 5000
                           'invalid'  # Flag large transactions
                         else
                           'valid'
                         end

      transaction.save
    end
  end

  private

  def parse_date(date_string)
    return nil if date_string.blank?

    # Try to parse date with time, assuming UTC
    begin
      # First try to parse as UTC datetime
      datetime = Time.parse(date_string).utc
      return datetime
    rescue ArgumentError
      # If time parsing fails, try date only and set time to midnight UTC
      begin
        date = Date.parse(date_string)
        return date.to_time.utc.beginning_of_day
      rescue Date::Error
        return nil
      end
    end
  end
end
