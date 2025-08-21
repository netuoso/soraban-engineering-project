class Rule < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :condition_type, presence: true
  validates :condition_value, presence: true
  validates :action_type, presence: true
  
  validates :condition_type, inclusion: { 
    in: %w[description_contains amount_greater_than amount_less_than] 
  }
  validates :action_type, inclusion: { 
    in: %w[set_category set_status] 
  }
  
  # Validate that category_id is present when action_type is set_category
  validates :category_id, presence: true, if: -> { action_type == 'set_category' }
  # Validate that action_value is present when action_type is set_status
  validates :action_value, presence: true, if: -> { action_type == 'set_status' }
end
