class Rule < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :condition_type, presence: true
  validates :condition_value, presence: true
  validates :action_type, presence: true
  validates :order, presence: true, numericality: { greater_than_or_equal_to: 0 }
  
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
  
  # Scopes for ordering and filtering
  scope :ordered, -> { order(:order, :created_at) }
  scope :category_rules, -> { where(action_type: 'set_category') }
  scope :status_rules, -> { where(action_type: 'set_status') }
  
  # Set default order before validation on create
  before_validation :set_default_order, on: :create
  
  private
  
  def set_default_order
    return if order.present?
    
    # Set order to be the next highest for this user
    max_order = user.rules.maximum(:order) || 0
    self.order = max_order + 1
  end
end
