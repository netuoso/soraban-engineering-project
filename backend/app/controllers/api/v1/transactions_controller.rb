require 'digest'

class Api::V1::TransactionsController < Api::V1::BaseController
  before_action :set_transaction, only: [:show, :update, :destroy, :categorize]

  def index
    # Create cache key based on current filters and user's transaction updates
    cache_key = "user_#{current_user.id}_transactions_#{cache_key_suffix}"
    
    # Cache for 1 minute for frequently accessed data
    cached_result = Rails.cache.fetch(cache_key, expires_in: 1.minute) do
      # Get basic transaction data with minimal includes
      @transactions = current_user.transactions
                                .includes(:category, :user_status)
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

  def show
    render json: @transaction
  end

  def create
    @transaction = current_user.transactions.build(transaction_params)
    if @transaction.save
      # Invalidate cache after creating transaction
      invalidate_transaction_cache
      render json: @transaction, status: :created
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def update
    if @transaction.update(transaction_params)
      # Invalidate cache after updating transaction
      invalidate_transaction_cache
      render json: @transaction
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @transaction.destroy
    # Invalidate cache after destroying transaction
    invalidate_transaction_cache
    head :no_content
  end

  def invalid
    @transactions = current_user.transactions.where(status: 'invalid')
    render json: @transactions
  end

  def categorize
    if @transaction.update(category_id: params[:category_id])
      # Invalidate cache after categorizing transaction
      invalidate_transaction_cache
      render json: @transaction
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def bulk_delete
    @transactions = current_user.transactions.where(id: params[:ids])
    deleted_count = @transactions.count
    @transactions.destroy_all
    
    # Explicitly invalidate cache after bulk delete
    invalidate_transaction_cache
    
    Rails.logger.info "Bulk deleted #{deleted_count} transactions for user #{current_user.id}"
    head :no_content
  end

  def bulk_update
    @transactions = current_user.transactions.where(id: params[:ids])
    
    # Use individual updates to trigger model callbacks for anomaly handling
    updated_count = 0
    @transactions.find_each do |transaction|
      update_params = {}
      update_params[:status] = params[:status] if params[:status].present?
      update_params[:category_id] = params[:category_id] if params[:category_id].present?
      update_params[:status_id] = params[:status_id] if params[:status_id].present?
      
      if transaction.update(update_params)
        updated_count += 1
      end
    end
    
    if updated_count > 0
      # Explicitly invalidate cache after bulk update
      invalidate_transaction_cache
      
      Rails.logger.info "Bulk updated #{updated_count} transactions for user #{current_user.id}"
      head :no_content
    else
      render json: { error: 'Failed to update transactions' }, status: :unprocessable_entity
    end
  end

  private

  def invalidate_transaction_cache
    Rails.cache.delete_matched("user_#{current_user.id}_transactions_*")
    Rails.cache.delete_matched("user_#{current_user.id}_category_totals_*")
    Rails.logger.debug "Invalidated transaction and category totals cache for user #{current_user.id}"
  end

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
        status_name: transaction.user_status&.name,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      },
      relationships: {}.tap do |rels|
        if transaction.category
          rels[:category] = {
            data: {
              id: transaction.category.id.to_s,
              type: 'category'
            }
          }
        end
        if transaction.user_status
          rels[:status] = {
            data: {
              id: transaction.user_status.id.to_s,
              type: 'status'
            }
          }
        end
      end
    }
  end

  def apply_filters
    # Log the filter parameters for debugging
    Rails.logger.info "Transaction filter params: status=#{params[:status]}, status_id=#{params[:status_id]}"
    
    if params[:status].present?
      @transactions = @transactions.where(status: params[:status])
    end

    if params[:status_id].present?
      @transactions = @transactions.where(status_id: params[:status_id])
    end

    # Handle special anomaly filtering
    if params[:exclude_anomalies] == 'true'
      # Show only invalid transactions that DON'T have anomaly notes
      @transactions = @transactions.where(status: 'invalid')
                                 .where("notes IS NULL OR notes NOT LIKE '%[ANOMALY:%'")
    elsif params[:has_anomalies] == 'true'
      # Show only transactions that have anomaly notes
      @transactions = @transactions.where("notes LIKE '%[ANOMALY:%'")
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

  def set_transaction
    @transaction = current_user.transactions.find(params[:id])
  end

  def transaction_params
    params.require(:transaction).permit(:date, :amount, :description, :category_id, :status_id, :notes)
  end
end
