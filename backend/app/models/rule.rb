class Rule < ApplicationRecord
  belongs_to :category
  belongs_to :user

  validates :name, presence: true
  validates :pattern, presence: true
  validates :name, uniqueness: { scope: :user_id }
end
