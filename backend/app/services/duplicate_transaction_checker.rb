class DuplicateTransactionChecker
  def self.is_duplicate?(transaction, user)
    # Check for transactions with same amount, date, and description within a small time window
    existing = user.transactions
                  .where(amount: transaction.amount)
                  .where(description: transaction.description)
                  .where('date BETWEEN ? AND ?', 
                        transaction.date.beginning_of_day,
                        transaction.date.end_of_day)
                  .where.not(id: transaction.id)
                  .exists?
    
    transaction.status = 'invalid' if existing
    existing
  end
end
