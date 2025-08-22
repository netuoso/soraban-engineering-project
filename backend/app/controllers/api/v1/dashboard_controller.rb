class Api::V1::DashboardController < Api::V1::BaseController
  def summary
    # Get dashboard stats with optimized queries
    stats = {
      uncategorized_count: current_user.transactions.where(category_id: nil).count,
      flagged_count: current_user.transactions.where(status: 'invalid').count,
      total_transactions: current_user.transactions.count,
      recent_import_count: current_user.bulk_imports.where(
        'created_at > ?', 7.days.ago
      ).sum(:imported_count)
    }

    # Count anomalies efficiently using database query instead of fetching all records
    anomaly_count = current_user.transactions.where(
      "notes LIKE '%[ANOMALY:%'"
    ).count

    stats[:anomaly_count] = anomaly_count

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
    transactions = current_user.transactions
                              .where(status: 'invalid')
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
