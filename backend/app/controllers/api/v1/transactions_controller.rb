class Api::V1::TransactionsController < Api::V1::BaseController
  before_action :set_transaction, only: [:show, :update, :destroy, :categorize]

  def index
    @transactions = current_user.transactions
    render json: @transactions
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

  private

  def set_transaction
    @transaction = current_user.transactions.find(params[:id])
  end

  def transaction_params
    params.require(:transaction).permit(:date, :amount, :description, :category_id)
  end
end
