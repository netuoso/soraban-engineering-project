class RuleApplicationService
  def self.apply_rules(transaction, rules = nil)
    return if transaction.category.present? # Skip if category is already set
    
    # Use provided rules or fetch them from the transaction's user
    rules ||= transaction.user.rules.includes(:category)
    
    # Find the first matching rule
    matching_rule = find_matching_rule(rules, transaction)
    
    # Apply the rule if found
    if matching_rule
      if matching_rule.action_type == 'set_category'
        transaction.category = matching_rule.category
      elsif matching_rule.action_type == 'set_status'
        transaction.status = matching_rule.action_value
      end
    end
  end
  
  private
  
  def self.find_matching_rule(rules, transaction)
    rules.find do |rule|
      case rule.condition_type
      when 'description_contains'
        transaction.description&.downcase&.include?(rule.condition_value.downcase)
      when 'amount_greater_than'
        transaction.amount > rule.condition_value.to_f
      when 'amount_less_than'
        transaction.amount < rule.condition_value.to_f
      else
        false
      end
    end
  end
end
