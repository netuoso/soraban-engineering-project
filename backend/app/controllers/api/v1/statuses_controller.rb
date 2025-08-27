class Api::V1::StatusesController < Api::V1::BaseController
  before_action :set_status, only: [:show, :update, :destroy]

  def index
    @statuses = current_user.statuses.order(:name)
    render json: serialize_statuses_light(@statuses)
  end

  def show
    render json: serialize_status_light(@status)
  end

  def create
    @status = current_user.statuses.build(status_params)
    if @status.save
      render json: serialize_status_light(@status), status: :created
    else
      render json: @status.errors, status: :unprocessable_entity
    end
  end

  def update
    if @status.update(status_params)
      render json: serialize_status_light(@status)
    else
      render json: @status.errors, status: :unprocessable_entity
    end
  end

  def destroy
    @status.destroy
    head :no_content
  end

  private

  def set_status
    @status = current_user.statuses.find(params[:id])
  end

  def status_params
    params.require(:status).permit(:name)
  end

  # Lightweight serialization for statuses - avoids loading all transactions
  def serialize_statuses_light(statuses)
    {
      data: statuses.map do |status|
        {
          id: status.id.to_s,
          type: "status",
          attributes: {
            name: status.name
          }
        }
      end
    }
  end

  def serialize_status_light(status)
    {
      data: {
        id: status.id.to_s,
        type: "status",
        attributes: {
          name: status.name
        }
      }
    }
  end
end
