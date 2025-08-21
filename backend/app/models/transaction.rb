class Transaction < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :status, inclusion: { in: %w[valid invalid] }

  before_validation :apply_rules
  before_validation :set_status

  private

  def apply_rules
    return if errors.any? || !description.present? || !amount.present? # Skip if validation failed or missing required data
    RuleApplicationService.apply_rules(self)
  end

  def set_status
    self.status = if category.nil? || description.blank?
                    'invalid'
                  else
                    'valid'
                  end
  end
end
