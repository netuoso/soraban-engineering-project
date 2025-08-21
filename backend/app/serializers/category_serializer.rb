class CategorySerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :name, :description, :created_at, :updated_at
  has_many :transactions

  attribute :transaction_count do |object|
    object.transactions.count
  end
end
