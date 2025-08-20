class UserSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :id, :email, :created_at

  # Add any relationships if needed
  # has_many :transactions
  # has_many :categories
end
