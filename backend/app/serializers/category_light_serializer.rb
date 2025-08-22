class CategoryLightSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :name, :description

  # Remove transaction_count computation to avoid N+1 queries
  # Count will be provided separately when needed
end
