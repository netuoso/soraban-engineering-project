class Api::V1::RulesController < Api::V1::BaseController
  before_action :set_rule, only: [:show, :update, :destroy]

  def index
    @rules = current_user.rules.includes(:category)
    render json: RuleSerializer.new(@rules, { include: [:category] })
  end

  def show
    render json: RuleSerializer.new(@rule, { include: [:category] })
  end

  def create
    @rule = current_user.rules.build(rule_params)
    if @rule.save
      render json: RuleSerializer.new(@rule, { include: [:category] }), status: :created
    else
      render json: @rule.errors, status: :unprocessable_entity
    end
  end

  def update
    if @rule.update(rule_params)
      render json: RuleSerializer.new(@rule, { include: [:category] })
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
    params.require(:rule).permit(:condition_type, :condition_value, :action_type, :action_value, :category_id)
  end
end
