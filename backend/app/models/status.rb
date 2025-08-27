class Status < ApplicationRecord
  belongs_to :user
  has_many :transactions, foreign_key: 'status_id'

  validates :name, presence: true
  validates :name, uniqueness: { scope: :user_id }
end
