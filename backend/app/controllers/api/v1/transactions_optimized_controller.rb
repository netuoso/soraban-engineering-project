require 'digest'

class Api::V1::TransactionsOptimizedController < Api::V1::BaseController
  # Remove before_action since we only have index and summary actions

  def index
    # Create cache key based on current filters and user's transaction updates
    cache_key = "user_#{current_user.id}_transactions_#{cache_key_suffix}"
    
    # Cache for 1 minute for frequently accessed data
    cached_result = Rails.cache.fetch(cache_key, expires_in: 1.minute) do
      # Get basic transaction data with minimal includes
      @transactions = current_user.transactions
                                .includes(:category)
                                .order(date: :desc)
                                .page(params[:page] || 1)
                                .per(params[:per_page] || 20)

      # Apply filters
      apply_filters

      # Serialize data
      {
        data: @transactions.map { |t| serialize_transaction_light(t) },
        meta: {
          total_pages: @transactions.total_pages,
          total_count: @transactions.total_count,
          current_page: @transactions.current_page
        }
      }
    end

    # Set cache headers
    expires_in 30.seconds, public: false
    render json: cached_result
  end

  def categories_summary
    # Cache categories summary for performance
    cache_key = "user_#{current_user.id}_categories_summary_#{current_user.categories.maximum(:updated_at)&.to_i}"
    
    cached_result = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      # Get categories with transaction counts efficiently
      categories_with_counts = current_user.categories
                                         .left_joins(:transactions)
                                         .group('categories.id')
                                         .select(
                                           'categories.id, categories.name, categories.description, 
                                            categories.created_at, categories.updated_at,
                                            COUNT(transactions.id) as transaction_count'
                                         )

      # Manual serialization for performance
      categories_with_counts.map do |category|
        {
          id: category.id,
          type: 'category',
          attributes: {
            name: category.name,
            description: category.description,
            transaction_count: category.transaction_count.to_i
          }
        }
      end
    end

    # Set cache headers
    expires_in 2.minutes, public: false
    render json: { data: cached_result }
  end

  def category_totals
    # Cache category totals for performance
    cache_key = "user_#{current_user.id}_category_totals_optimized_#{current_user.transactions.maximum(:updated_at)&.to_i}"
    
    cached_totals = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      current_user.transactions
                  .joins(:category)
                  .group('categories.name')
                  .sum(:amount)
                  .map { |name, amount| { category: name, total: amount } }
    end

    # Set cache headers
    expires_in 2.minutes, public: false
    render json: { data: cached_totals }
  end

  private

  def cache_key_suffix
    # Create a cache key that changes when filters change or data is updated
    filter_hash = Digest::MD5.hexdigest(params.to_unsafe_h.to_s)
    last_updated = current_user.transactions.maximum(:updated_at)&.to_i || 0
    "#{filter_hash}_#{last_updated}"
  end

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
        notes: transaction.notes,
        formatted_datetime: transaction.date.iso8601,
        category_name: transaction.category&.name,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      },
      relationships: transaction.category ? {
        category: {
          data: {
            id: transaction.category.id.to_s,
            type: 'category'
          }
        }
      } : {}
    }
  end

  def apply_filters
    if params[:status].present?
      @transactions = @transactions.where(status: params[:status])
    end

    if params.key?(:category)
      if params[:category] == ''
        @transactions = @transactions.where(category_id: nil)
      elsif params[:category].present?
        @transactions = @transactions.joins(:category).where('categories.name = ?', params[:category])
      end
    end

    if params[:start_date].present?
      @transactions = @transactions.where('date >= ?', params[:start_date])
    end

    if params[:end_date].present?
      @transactions = @transactions.where('date <= ?', params[:end_date])
    end

    if params[:search].present?
      @transactions = @transactions.where('description ILIKE ?', "%#{params[:search]}%")
    end
  end
end