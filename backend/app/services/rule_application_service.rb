class RuleApplicationService
  def self.apply_rules(transaction, rules = nil)
    # Use provided rules or fetch them from the transaction's user (ordered by priority)
    rules ||= transaction.user.rules.includes(:category).ordered
    
    # Find all matching rules instead of just the first one
    matching_rules = find_matching_rules(rules, transaction)
    
    # Apply all matching rules in order
    # Category rules are applied first (first match wins for category)
    # Status rules are applied last (last match wins for status)
    category_applied = false
    
    matching_rules.each do |rule|
      case rule.action_type
      when 'set_category'
        # Only apply the first matching category rule
        unless category_applied
          apply_category_rule(transaction, rule)
          category_applied = true
        end
      when 'set_status'
        # Apply all status rules (last one wins)
        apply_status_rule(transaction, rule)
      end
    end
  end
  
  private
  
  def self.find_matching_rules(rules, transaction)
    rules.select do |rule|
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
  
  def self.apply_category_rule(transaction, rule)
    # Only set category if it's not already set (preserve user manual assignments)
    transaction.category = rule.category if transaction.category.blank?
  end
  
  def self.apply_status_rule(transaction, rule)
    # Status can be overridden by rules (last matching rule wins for status)
    transaction.status = rule.action_value
  end
end
