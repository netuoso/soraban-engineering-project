class Api::V1::SummariesController < ApplicationController
  before_action :authenticate_user!

  def category_totals
    # Cache the category totals query for 5 minutes to reduce database load
    cache_key = "user_#{current_user.id}_category_totals_#{current_user.transactions.maximum(:updated_at)&.to_i}"
    
    category_sums = Rails.cache.fetch(cache_key, expires_in: 5.minutes) do
      current_user.transactions
        .joins(:category)
        .group('categories.name')
        .sum(:amount)
    end

    # Set cache headers to allow browser caching for 2 minutes
    expires_in 2.minutes, public: false

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
