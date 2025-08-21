class AnomalyDetectionService
  def self.detect_anomalies(user, transactions)
    new(user, transactions).detect_anomalies
  end

  def self.detect_bulk_anomalies(user, transactions)
    new(user, transactions).detect_bulk_anomalies
  end

  def initialize(user, transactions)
    @user = user
    @transactions = Array(transactions)
    @anomalies = []
  end

  def detect_anomalies
    detect_amount_anomalies
    detect_duplicates
    detect_incomplete_metadata
    @anomalies
  end

  # Optimized version for bulk operations (CSV import)
  def detect_bulk_anomalies
    detect_bulk_amount_anomalies
    detect_bulk_duplicates
    detect_bulk_incomplete_metadata
    
    # Apply anomaly flags to each transaction
    @transactions.each do |transaction|
      transaction_anomalies = @anomalies.select { |a| a[:transaction] == transaction }
      transaction_anomalies.each do |anomaly|
        transaction.add_anomaly_flag(anomaly[:type], anomaly[:details])
      end
    end
    
    @anomalies
  end

  private

  def detect_amount_anomalies
    return if @transactions.empty?

    # Get historical data for comparison
    historical_amounts = @user.transactions
                              .where.not(id: @transactions.map(&:id))
                              .limit(100)
                              .pluck(:amount)
                              .map(&:abs)
    
    return if historical_amounts.size < 10 # Need sufficient historical data

    # Calculate statistics from historical data
    mean = historical_amounts.sum / historical_amounts.size.to_f
    variance = historical_amounts.sum { |x| (x - mean) ** 2 } / historical_amounts.size.to_f
    std_dev = Math.sqrt(variance)

    # Check each transaction against historical patterns
    @transactions.each do |transaction|
      next unless transaction.amount.present?
      
      amount = transaction.amount.abs
      if (amount - mean).abs > 2 * std_dev && std_dev > 0
        @anomalies << {
          transaction: transaction,
          type: :unusual_amount,
          details: "Amount significantly different from usual patterns (#{amount} vs avg #{mean.round(2)})"
        }
      end
    end
  end

  def detect_bulk_amount_anomalies
    return if @transactions.empty?

    # For bulk operations, we'll use both historical data and the current batch
    all_amounts = (@user.transactions.limit(100).pluck(:amount) + @transactions.map(&:amount))
                    .compact
                    .map(&:abs)
    
    return if all_amounts.size < 10

    # Calculate statistics
    mean = all_amounts.sum / all_amounts.size.to_f
    variance = all_amounts.sum { |x| (x - mean) ** 2 } / all_amounts.size.to_f
    std_dev = Math.sqrt(variance)

    # Mark transactions as anomalous if they're more than 2 standard deviations from the mean
    @transactions.each do |transaction|
      next unless transaction.amount.present?
      
      amount = transaction.amount.abs
      if (amount - mean).abs > 2 * std_dev && std_dev > 0
        @anomalies << {
          transaction: transaction,
          type: :unusual_amount,
          details: "Amount significantly different from usual patterns (#{amount} vs avg #{mean.round(2)})"
        }
      end
    end
  end

  def detect_duplicates
    # Group current transactions by date, amount, and description
    @transactions.group_by { |t| [t.date&.to_date, t.amount, t.description&.downcase] }
                .select { |_, group| group.size > 1 }
                .each do |_, group|
      group.each do |transaction|
        @anomalies << {
          transaction: transaction,
          type: :potential_duplicate,
          details: "Duplicate transaction found in the same batch"
        }
      end
    end

    # Also check against existing transactions in the database
    @transactions.each do |transaction|
      next unless transaction.date.present? && transaction.amount.present? && transaction.description.present?
      
      existing_similar = @user.transactions
                              .where.not(id: transaction.id)
                              .where(date: transaction.date.beginning_of_day..transaction.date.end_of_day)
                              .where(amount: transaction.amount)
                              .where('LOWER(description) = ?', transaction.description.downcase)
      
      if existing_similar.exists?
        @anomalies << {
          transaction: transaction,
          type: :potential_duplicate,
          details: "Similar transaction found in database on the same date"
        }
      end
    end
  end

  def detect_bulk_duplicates
    # More efficient duplicate detection for bulk operations
    
    # 1. Check for duplicates within the current batch
    transaction_groups = @transactions.group_by { |t| [t.date&.to_date, t.amount, t.description&.downcase] }
    
    transaction_groups.select { |_, group| group.size > 1 }.each do |_, group|
      group.each do |transaction|
        @anomalies << {
          transaction: transaction,
          type: :potential_duplicate,
          details: "Duplicate transaction found in the same import batch"
        }
      end
    end

    # 2. Check against existing transactions (batch query for efficiency)
    return if @transactions.empty?

    date_range = @transactions.map(&:date).compact
    return if date_range.empty?

    min_date = date_range.min.beginning_of_day
    max_date = date_range.max.end_of_day

    # Get all existing transactions in the date range
    existing_transactions = @user.transactions
                                 .where(date: min_date..max_date)
                                 .select(:id, :date, :amount, :description)

    # Create a lookup hash for quick comparison
    existing_lookup = existing_transactions.group_by { |t| [t.date.to_date, t.amount, t.description&.downcase] }

    @transactions.each do |transaction|
      next unless transaction.date.present? && transaction.amount.present? && transaction.description.present?
      
      key = [transaction.date.to_date, transaction.amount, transaction.description.downcase]
      if existing_lookup[key]&.any?
        @anomalies << {
          transaction: transaction,
          type: :potential_duplicate,
          details: "Similar transaction found in database on the same date"
        }
      end
    end
  end

  def detect_incomplete_metadata
    @transactions.each do |transaction|
      missing_fields = []
      
      missing_fields << 'description' if transaction.description.blank?
      missing_fields << 'category' if transaction.category.nil?
      
      if missing_fields.any?
        @anomalies << {
          transaction: transaction,
          type: :incomplete_metadata,
          details: "Missing required fields: #{missing_fields.join(', ')}"
        }
      end
    end
  end

  def detect_bulk_incomplete_metadata
    # Same logic as regular detection - no optimization needed
    detect_incomplete_metadata
  end
end
