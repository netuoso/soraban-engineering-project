class Api::V1::CategoriesOptimizedController < Api::V1::BaseController
  before_action :set_category, only: [:show, :update, :destroy]

  def index
    # Get categories with transaction counts in a single query
    @categories = current_user.categories
                             .left_joins(:transactions)
                             .group('categories.id')
                             .select(
                               'categories.id, categories.name, categories.description, 
                                categories.created_at, categories.updated_at,
                                COUNT(transactions.id) as transaction_count'
                             )

    # Manual serialization for performance
    categories_data = @categories.map do |category|
      {
        id: category.id.to_s,
        type: 'category',
        attributes: {
          name: category.name,
          description: category.description,
          transaction_count: category.transaction_count.to_i,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      }
    end

    render json: { data: categories_data }
  end

  def show
    render json: CategoryLightSerializer.new(@category)
  end

  def create
    @category = current_user.categories.build(category_params)
    if @category.save
      render json: CategoryLightSerializer.new(@category), status: :created
    else
      render json: @category.errors, status: :unprocessable_entity
    end
  end

  def update
    if @category.update(category_params)
      render json: CategoryLightSerializer.new(@category)
    else
      render json: @category.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @category.destroy
    head :no_content
  end

  private

  def set_category
    @category = current_user.categories.find(params[:id])
  end

  def category_params
    params.require(:category).permit(:name, :description)
  end
end
