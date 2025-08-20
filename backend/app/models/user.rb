class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  has_many :categories, dependent: :destroy
  has_many :transactions, dependent: :destroy
  has_many :rules, dependent: :destroy

  def jwt_payload
    { 
      'id' => id,
      'email' => email,
      'exp' => 1.day.from_now.to_i
    }
  end
end
