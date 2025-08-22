class BulkAnomalyDetectionJob < ApplicationJob
  queue_as :anomaly_detection
  
  def perform(user_id, transaction_ids, import_session_id = nil)
    user = User.find_by(id: user_id)
    return unless user
    
    # Load transactions in a single query with associations
    transactions = user.transactions.includes(:category).where(id: transaction_ids)
    return if transactions.empty?
    
    # Run optimized bulk anomaly detection
    anomalies = detect_bulk_anomalies_optimized(user, transactions)
    
    # Apply anomaly flags in batches to avoid long transactions
    apply_anomaly_flags_bulk(transactions, anomalies)
    
    # Update progress if this is part of an import
    if import_session_id
      update_import_progress(import_session_id, transaction_ids.size)
    end
  end
  
  private
  
  def detect_bulk_anomalies_optimized(user, transactions)
    anomalies = []
    
    # Pre-load historical data for amount anomaly detection
    historical_amounts = user.transactions
                             .where.not(id: transactions.map(&:id))
                             .limit(1000)
                             .pluck(:amount)
                             .map(&:abs)
    
    if historical_amounts.size >= 10
      mean = historical_amounts.sum / historical_amounts.size.to_f
      variance = historical_amounts.sum { |x| (x - mean) ** 2 } / historical_amounts.size.to_f
      std_dev = Math.sqrt(variance)
      
      # Detect amount anomalies
      if std_dev > 0
        transactions.each do |transaction|
          next unless transaction.amount.present?
          
          amount = transaction.amount.abs
          if (amount - mean).abs > 2 * std_dev
            anomalies << {
              transaction_id: transaction.id,
              type: 'amount_anomaly',
              details: "Amount significantly different from usual patterns (#{amount} vs avg #{mean.round(2)})"
            }
          end
        end
      end
    end
    
    # Detect duplicates more efficiently
    duplicate_anomalies = detect_duplicates_bulk(user, transactions)
    anomalies.concat(duplicate_anomalies)
    
    # Detect incomplete metadata
    transactions.each do |transaction|
      missing_fields = []
      missing_fields << 'description' if transaction.description.blank?
      missing_fields << 'category' if transaction.category.nil?
      
      if missing_fields.any?
        anomalies << {
          transaction_id: transaction.id,
          type: 'incomplete_metadata',
          details: "Missing required fields: #{missing_fields.join(', ')}"
        }
      end
    end
    
    anomalies
  end
  
  def detect_duplicates_bulk(user, transactions)
    anomalies = []
    
    # Group by potential duplicate criteria
    transaction_groups = transactions.group_by do |t|
      [t.date&.to_date, t.amount, t.description&.downcase]
    end
    
    # Mark duplicates within the batch
    transaction_groups.select { |_, group| group.size > 1 }.each do |_, group|
      group.each do |transaction|
        anomalies << {
          transaction_id: transaction.id,
          type: 'duplicate',
          details: "Duplicate transaction found in import batch"
        }
      end
    end
    
    # Check against existing transactions (optimized query)
    unless transactions.empty?
      date_range = transactions.map(&:date).compact
      if date_range.any?
        min_date = date_range.min.beginning_of_day
        max_date = date_range.max.end_of_day
        
        # Single query to find all potential duplicates
        existing_duplicates = user.transactions
                                  .where(date: min_date..max_date)
                                  .where.not(id: transactions.map(&:id))
                                  .select(:id, :date, :amount, :description)
        
        # Create lookup hash
        existing_lookup = existing_duplicates.group_by do |t|
          [t.date.to_date, t.amount, t.description&.downcase]
        end
        
        transactions.each do |transaction|
          next unless transaction.date.present? && transaction.amount.present? && transaction.description.present?
          
          key = [transaction.date.to_date, transaction.amount, transaction.description.downcase]
          if existing_lookup[key]&.any?
            anomalies << {
              transaction_id: transaction.id,
              type: 'duplicate',
              details: "Similar transaction found in database"
            }
          end
        end
      end
    end
    
    anomalies
  end
  
  def apply_anomaly_flags_bulk(transactions, anomalies)
    # Group anomalies by transaction
    anomalies_by_transaction = anomalies.group_by { |a| a[:transaction_id] }
    
    # Prepare bulk updates
    updates = []
    
    transactions.each do |transaction|
      transaction_anomalies = anomalies_by_transaction[transaction.id] || []
      
      if transaction_anomalies.any?
        # Build notes with all anomalies
        notes_parts = transaction_anomalies.map do |anomaly|
          "[ANOMALY:#{anomaly[:type]}] #{anomaly[:details]}"
        end
        
        notes = notes_parts.join("\n")
        status = 'invalid'
      else
        notes = nil
        status = transaction.category.nil? || transaction.description.blank? ? 'invalid' : 'valid'
      end
      
      updates << {
        id: transaction.id,
        notes: notes,
        status: status,
        updated_at: Time.current
      }
    end
    
    # Batch update all transactions
    unless updates.empty?
      # Use upsert_all for efficient bulk updates
      Transaction.upsert_all(updates, unique_by: :id)
    end
  end
  
  def update_import_progress(session_id, processed_count)
    # Update anomaly detection progress
    current_progress = Rails.cache.read("import_progress_#{session_id}")
    if current_progress && current_progress[:progress] < 95
      new_progress = [current_progress[:progress] + 1, 95].min
      
      Rails.cache.write("import_progress_#{session_id}", {
        progress: new_progress,
        message: "Processing anomaly detection...",
        updated_at: Time.current
      }, expires_in: 1.hour)
      
      ActionCable.server.broadcast(
        "import_progress_#{session_id}",
        {
          progress: new_progress,
          message: "Processing anomaly detection..."
        }
      )
    end
  end
end
