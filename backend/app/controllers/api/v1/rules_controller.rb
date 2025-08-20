class Api::V1::RulesController < Api::V1::BaseController
  before_action :set_rule, only: [:show, :update, :destroy]

  def index
    @rules = current_user.rules
    render json: @rules
  end

  def show
    render json: @rule
  end

  def create
    @rule = current_user.rules.build(rule_params)
    if @rule.save
      render json: @rule, status: :created
    else
      render json: @rule.errors, status: :unprocessable_entity
    end
  end

  def update
    if @rule.update(rule_params)
      render json: @rule
    else
      render json: @rule.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @rule.destroy
    head :no_content
  end

  private

  def set_rule
    @rule = current_user.rules.find(params[:id])
  end

  def rule_params
    params.require(:rule).permit(:name, :pattern, :category_id)
  end
end
