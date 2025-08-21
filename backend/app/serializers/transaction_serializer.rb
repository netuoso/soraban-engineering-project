class TransactionSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :id, :date, :amount, :description, :status, :notes, :created_at
  
  attribute :formatted_date do |object|
    object.date&.strftime('%Y-%m-%d')
  end

  attribute :formatted_amount do |object|
    object.amount&.to_f
  end

  attribute :category_name do |object|
    object.category&.name
  end

  belongs_to :category

  # Don't transform keys to camelCase since our frontend expects snake_case
  # set_key_transform :camel_lower
end
