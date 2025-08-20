Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      resources :transactions do
        collection do
          post :upload
          get :invalid
        end
        member do
          patch :categorize
        end
      end
      
      resources :categories
      resources :rules
    end
  end

  devise_for :users,
             controllers: {
               sessions: 'users/sessions',
               registrations: 'users/registrations'
             },
             defaults: { format: :json }

  # Sidekiq Web UI
  require 'sidekiq/web'
  authenticate :user do
    mount Sidekiq::Web => '/sidekiq'
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check
end
