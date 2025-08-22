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

    render json: TransactionSerializer.new(transactions, {
      include: [:category]
    })
  end

  def flagged_transactions
    transactions = current_user.transactions
                              .where(status: 'invalid')
                              .includes(:category)
                              .order(date: :desc)
                              .limit(5)

    render json: TransactionSerializer.new(transactions, {
      include: [:category]
    })
  end

  def anomaly_transactions
    transactions = current_user.transactions
                              .where("notes LIKE '%[ANOMALY:%'")
                              .includes(:category)
                              .order(date: :desc)
                              .limit(5)

    render json: TransactionSerializer.new(transactions, {
      include: [:category]
    })
  end
end
