require 'jwt'

module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private

    def find_verified_user
      # Try to find user from token in query params or headers
      token = request.params[:token] || request.headers['Authorization']&.sub('Bearer ', '')
      
      if token.present?
        begin
          # Decode JWT token
          decoded_token = JWT.decode(token, Rails.application.credentials.devise_jwt_secret_key, true, { algorithm: 'HS256' })
          user_data = decoded_token[0]
          
          # Check if token is not in denylist
          jti = user_data['jti']
          if jti && !JwtDenylist.exists?(jti: jti)
            user = User.find(user_data['sub'] || user_data['user_id'] || user_data['id'])
            return user if user
          end
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound => e
          Rails.logger.warn "WebSocket authentication failed: #{e.message}"
        end
      end
      
      # For development, allow connection without authentication
      if Rails.env.development?
        Rails.logger.warn "WebSocket connection without authentication in development mode"
        return User.first
      end
      
      reject_unauthorized_connection
    end
  end
end
