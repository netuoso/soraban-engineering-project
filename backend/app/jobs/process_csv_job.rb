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
    # Add flexible date parsing based on common formats
    Date.parse(date_string)
  rescue Date::Error
    nil
  end
end
