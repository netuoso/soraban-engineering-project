class HealthController < ApplicationController
  # Health check endpoint for monitoring and Docker health checks
  def show
    # Check database connectivity
    begin
      ActiveRecord::Base.connection.execute('SELECT 1')
      database_status = 'healthy'
    rescue => e
      database_status = 'unhealthy'
    end
    
    # Check Redis connectivity
    begin
      Rails.cache.read('health_check')
      redis_status = 'healthy'
    rescue => e
      redis_status = 'unhealthy'
    end
    
    # Overall status
    overall_status = (database_status == 'healthy' && redis_status == 'healthy') ? 'healthy' : 'unhealthy'
    
    status_code = overall_status == 'healthy' ? 200 : 503
    
    render json: {
      status: overall_status,
      timestamp: Time.current.iso8601,
      services: {
        database: database_status,
        redis: redis_status
      },
      version: Rails.version
    }, status: status_code
  end
end
