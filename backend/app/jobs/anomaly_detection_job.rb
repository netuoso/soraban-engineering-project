class AnomalyDetectionJob < ApplicationJob
  queue_as :default

  # For single transaction anomaly detection
  def perform(transaction_id)
    transaction = Transaction.find_by(id: transaction_id)
    return unless transaction&.user

    # Clear existing anomaly flags
    transaction.clear_anomaly_flags

    # Run anomaly detection using the service
    anomalies = AnomalyDetectionService.detect_anomalies(transaction.user, [transaction])
    
    # Apply anomaly flags
    anomalies.each do |anomaly|
      if anomaly[:transaction] == transaction
        transaction.add_anomaly_flag(anomaly[:type], anomaly[:details])
      end
    end

    # Update status based on anomalies and validation rules
    transaction.send(:set_final_status)
    
    # Skip anomaly detection callback when saving to prevent infinite loop
    transaction.skip_anomaly_detection = true
    transaction.save!(validate: false)
  end

  # For bulk anomaly detection (used during CSV imports)
  def self.perform_bulk(user_id, transaction_ids)
    user = User.find_by(id: user_id)
    return unless user

    transactions = user.transactions.where(id: transaction_ids)
    return if transactions.empty?

    # Clear existing anomaly flags for all transactions
    transactions.each(&:clear_anomaly_flags)

    # Run bulk anomaly detection
    AnomalyDetectionService.detect_bulk_anomalies(user, transactions)

    # Update statuses and save
    transactions.each do |transaction|
      transaction.send(:set_final_status)
      transaction.skip_anomaly_detection = true
      transaction.save!(validate: false)
    end
  end
end
