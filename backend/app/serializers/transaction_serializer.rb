class TransactionSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :id, :date, :amount, :description, :status, :created_at
  
  attribute :formatted_date do |object|
    object.date&.strftime('%Y-%m-%d')
  end

  attribute :formatted_amount do |object|
    object.amount&.to_f
  end

  belongs_to :category
end
