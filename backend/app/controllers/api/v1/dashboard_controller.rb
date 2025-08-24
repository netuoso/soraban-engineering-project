class Api::V1::DashboardController < Api::V1::BaseController
  def summary
    # Get dashboard stats with optimized queries
    
    # Count transactions with anomaly notes (specific issues detected by system)
    anomaly_count = current_user.transactions.where(
      "notes LIKE '%[ANOMALY:%'"
    ).count
    
    # Count flagged transactions that DON'T have anomalies (manually flagged or rule-based)
    flagged_count = current_user.transactions
                                .where(status: 'invalid')
                                .where("notes IS NULL OR notes NOT LIKE '%[ANOMALY:%'")
                                .count
    
    stats = {
      uncategorized_count: current_user.transactions.where(category_id: nil).count,
      flagged_count: flagged_count,
      anomaly_count: anomaly_count,
      total_transactions: current_user.transactions.count,
      recent_import_count: current_user.bulk_imports.where(
        'created_at > ?', 7.days.ago
      ).sum(:imported_count)
    }

    render json: { data: stats }
  end

  def uncategorized_transactions
    transactions = current_user.transactions
                              .where(category_id: nil)
                              .includes(:category)
                              .order(date: :desc)
                              .limit(5)

    # Use lightweight manual serialization instead of heavy serializer
    render json: { 
      data: transactions.map { |t| serialize_transaction_light(t) }
    }
  end

  def flagged_transactions
    # Show transactions that are invalid but DON'T have system-detected anomalies
    # These are manually flagged or flagged by rules, not by anomaly detection
    transactions = current_user.transactions
                              .where(status: 'invalid')
                              .where("notes IS NULL OR notes NOT LIKE '%[ANOMALY:%'")
                              .includes(:category)
                              .order(date: :desc)
                              .limit(5)

    # Use lightweight manual serialization instead of heavy serializer
    render json: { 
      data: transactions.map { |t| serialize_transaction_light(t) }
    }
  end

  def anomaly_transactions
    transactions = current_user.transactions
                              .where("notes LIKE '%[ANOMALY:%'")
                              .includes(:category)
                              .order(date: :desc)
                              .limit(5)

    # Use lightweight manual serialization instead of heavy serializer
    render json: { 
      data: transactions.map { |t| serialize_transaction_light(t) }
    }
  end

  private

  def serialize_transaction_light(transaction)
    {
      id: transaction.id.to_s,
      type: 'transaction',
      attributes: {
        date: transaction.date,
        amount: transaction.amount.to_f,
        formatted_amount: transaction.amount.to_f,
        description: transaction.description,
        status: transaction.status,
        notes: transaction.notes&.truncate(200), # Truncate long notes
        category_name: transaction.category&.name,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      }
    }
  end
end
