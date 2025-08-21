class Api::V1::SummariesController < ApplicationController
  before_action :authenticate_user!

  def category_totals
    category_sums = current_user.transactions
      .joins(:category)
      .group('categories.name')
      .sum(:amount)

    render json: {
      data: category_sums.map { |category, total| 
        { 
          category: category,
          total: total
        }
      }
    }
  end
end
