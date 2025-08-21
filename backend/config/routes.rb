Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      resources :transactions do
        collection do
          post :upload
          get :invalid
          delete :bulk_delete
          put :bulk_update
        end
        member do
          patch :categorize
        end
      end
      
      resources :categories
      resources :rules
      
      get 'summaries/category_totals', to: 'summaries#category_totals'
    end
  end

  devise_for :users,
             path: '',
             path_names: {
               sign_in: 'users/sign_in',
               sign_out: 'users/sign_out',
               registration: 'users'
             },
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
