# Quick test script to verify multiple rule application
# Run with: rails runner test_multiple_rules.rb

# Find or create a test user
user = User.first
unless user
  puts "No users found. Please create a user first."
  exit
end

# Create test categories
food_category = user.categories.find_or_create_by(name: "Food")
high_value_category = user.categories.find_or_create_by(name: "High Value")

# Create test rules
rule1 = user.rules.find_or_create_by(
  condition_type: "description_contains",
  condition_value: "restaurant",
  action_type: "set_category",
  category: food_category,
  order: 1
)

rule2 = user.rules.find_or_create_by(
  condition_type: "amount_greater_than", 
  condition_value: "100",
  action_type: "set_status",
  action_value: "high_value",
  order: 2
)

# Create a test transaction that should match both rules
transaction = user.transactions.build(
  description: "Fancy restaurant dinner",
  amount: 150.00,
  date: Time.current
)

puts "Before applying rules:"
puts "  Description: #{transaction.description}"
puts "  Amount: #{transaction.amount}"
puts "  Category: #{transaction.category&.name || 'None'}"
puts "  Status: #{transaction.status || 'None'}"

# This will trigger rule application via the before_validation callback
transaction.save!

puts "\nAfter applying rules:"
puts "  Category: #{transaction.category&.name || 'None'}"
puts "  Status: #{transaction.status}"

puts "\nExpected results:"
puts "  Category should be: Food (from rule 1)"
puts "  Status should be: high_value (from rule 2)"

# Clean up
transaction.destroy
puts "\nTest transaction cleaned up."
