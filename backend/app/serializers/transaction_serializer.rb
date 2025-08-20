class TransactionSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :id, :date, :amount, :description, :status, :notes, :created_at
  
  attribute :formatted_date do |object|
    object.date&.strftime('%Y-%m-%d')
  end

  attribute :formatted_amount do |object|
    object.amount&.to_f
  end

  belongs_to :category, if: Proc.new { |record| record.category.present? }

  attribute :category do |object|
    if object.category
      {
        id: object.category.id,
        name: object.category.name
      }
    end
  end
end
