class RuleSerializer
  include JSONAPI::Serializer
  
  attributes :condition_type, :condition_value, :action_type, :action_value
  
  belongs_to :category
  
  attribute :category_name do |rule|
    rule.category&.name
  end
end
