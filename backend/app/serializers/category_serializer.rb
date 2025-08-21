class CategorySerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :name, :description, :created_at, :updated_at
  has_many :transactions

  attribute :transaction_count do |object, params|
    # Use preloaded transaction_counts if available, otherwise fall back to DB query
    if params && params[:transaction_counts]
      params[:transaction_counts][object.id] || 0
    else
      object.transactions.count
    end
  end
end
