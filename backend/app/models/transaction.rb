class Transaction < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :status, inclusion: { in: %w[valid invalid] }

  before_validation :set_status
  after_validation :check_duplicates
  after_validation :check_large_amount

  private

  def set_status
    self.status = if category.nil? || description.blank?
                    'invalid'
                  else
                    'valid'
                  end
  end

  def check_duplicates
    return if errors.any? # Skip if validation failed
    DuplicateTransactionChecker.is_duplicate?(self, user)
  end

  def check_large_amount
    return if errors.any? # Skip if validation failed
    if amount.present? && amount.abs >= 5000
      self.status = 'invalid'
    end
  end
end
