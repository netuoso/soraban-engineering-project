class Api::V1::CategoriesController < Api::V1::BaseController
  before_action :set_category, only: [:show, :update, :destroy]

  def index
    @categories = current_user.categories.order(:name)
    render json: serialize_categories_light(@categories)
  end

  def show
    render json: serialize_category_light(@category)
  end

  def create
    @category = current_user.categories.build(category_params)
    if @category.save
      render json: serialize_category_light(@category), status: :created
    else
      render json: @category.errors, status: :unprocessable_entity
    end
  end

  def update
    if @category.update(category_params)
      render json: serialize_category_light(@category)
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

  # Lightweight serialization for categories - avoids loading all transactions
  def serialize_categories_light(categories)
    {
      data: categories.map do |category|
        {
          id: category.id.to_s,
          type: "category",
          attributes: {
            name: category.name,
            description: category.description&.truncate(200)
          }
        }
      end
    }
  end

  def serialize_category_light(category)
    {
      data: {
        id: category.id.to_s,
        type: "category",
        attributes: {
          name: category.name,
          description: category.description&.truncate(200)
        }
      }
    }
  end
end
