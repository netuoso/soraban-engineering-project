class CacheHeadersMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, response = @app.call(env)
    
    # Add caching headers for API endpoints
    if env['PATH_INFO'].start_with?('/api/')
      # Set different cache times based on endpoint
      case env['PATH_INFO']
      when %r{/api/v1/categories}
        headers['Cache-Control'] = 'private, max-age=300' # 5 minutes for categories
      when %r{/api/v1/summaries}
        headers['Cache-Control'] = 'private, max-age=120' # 2 minutes for summaries
      when %r{/api/v1/transactions}
        headers['Cache-Control'] = 'private, max-age=60' # 1 minute for transactions
      else
        headers['Cache-Control'] = 'private, max-age=30' # 30 seconds default
      end
      
      headers['ETag'] = Digest::MD5.hexdigest(response.body.join) if response.respond_to?(:body)
    end
    
    [status, headers, response]
  end
end
