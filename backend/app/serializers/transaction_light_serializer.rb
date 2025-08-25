class TransactionLightSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :date, :amount, :description, :status, :notes, :created_at, :updated_at
  
  belongs_to :category, serializer: CategoryLightSerializer

  attribute :formatted_amount do |object|
    object.amount.to_f
  end

  attribute :formatted_datetime do |object|
    object.date.iso8601
  end

  attribute :category_name do |object|
    object.category&.name
  end
end
