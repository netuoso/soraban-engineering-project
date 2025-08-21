class Api::V1::TransactionsController < Api::V1::BaseController
  before_action :set_transaction, only: [:show, :update, :destroy, :categorize]

  def index
    @transactions = current_user.transactions
                              .includes(:category)
                              .order(date: :desc)
                              .page(params[:page])
                              .per(params[:per_page] || 20)

    if params[:status].present?
      @transactions = @transactions.where(status: params[:status])
    end

    if params[:category].present?
      @transactions = @transactions.joins(:category).where('categories.name = ?', params[:category])
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

    render json: TransactionSerializer.new(@transactions, {
      include: [:category],
      meta: {
        total_pages: @transactions.total_pages,
        total_count: @transactions.total_count,
        current_page: @transactions.current_page
      }
    })
  end

  def show
    render json: @transaction
  end

  def create
    @transaction = current_user.transactions.build(transaction_params)
    if @transaction.save
      render json: @transaction, status: :created
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def update
    if @transaction.update(transaction_params)
      render json: @transaction
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @transaction.destroy
    head :no_content
  end

  def upload
    if params[:file].present?
      csv_data = params[:file].read
      ProcessCsvJob.perform_later(csv_data, current_user.id)
      render json: { message: 'File upload started. Transactions will be processed in the background.' }
    else
      render json: { error: 'No file provided' }, status: :unprocessable_entity
    end
  end

  def invalid
    @transactions = current_user.transactions.where(status: 'invalid')
    render json: @transactions
  end

  def categorize
    if @transaction.update(category_id: params[:category_id])
      render json: @transaction
    else
      render json: @transaction.errors, status: :unprocessable_entity
    end
  end

  def bulk_delete
    @transactions = current_user.transactions.where(id: params[:ids])
    @transactions.destroy_all
    head :no_content
  end

  def bulk_update
    @transactions = current_user.transactions.where(id: params[:ids])
    update_params = {}
    update_params[:status] = params[:status] if params[:status].present?
    update_params[:category_id] = params[:category_id] if params[:category_id].present?
    
    if @transactions.update_all(update_params)
      head :no_content
    else
      render json: { error: 'Failed to update transactions' }, status: :unprocessable_entity
    end
  end

  private

  def set_transaction
    @transaction = current_user.transactions.find(params[:id])
  end

  def transaction_params
    params.require(:transaction).permit(:date, :amount, :description, :category_id, :notes)
  end
end
