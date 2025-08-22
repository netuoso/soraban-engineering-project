Rails.application.routes.draw do
  # API routes
  namespace :api do
    namespace :v1 do
      # Optimized endpoints for performance
      get 'transactions/optimized', to: 'transactions_optimized#index'
      get 'transactions/categories_summary', to: 'transactions_optimized#categories_summary'
      get 'transactions/category_totals', to: 'transactions_optimized#category_totals'
      get 'categories/optimized', to: 'categories_optimized#index'
      
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
      
      # Bulk import routes
      resources :bulk_imports, only: [:create, :index] do
        member do
          get :progress
          patch :cancel
        end
      end
      
      # Dashboard routes
      get 'dashboard/summary', to: 'dashboard#summary'
      get 'dashboard/uncategorized_transactions', to: 'dashboard#uncategorized_transactions'
      get 'dashboard/flagged_transactions', to: 'dashboard#flagged_transactions'
      get 'dashboard/anomaly_transactions', to: 'dashboard#anomaly_transactions'
      
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

  # Mount ActionCable
  mount ActionCable.server => '/cable'

  # Sidekiq Web UI
  require 'sidekiq/web'
  authenticate :user do
    mount Sidekiq::Web => '/sidekiq'
  end

  # Health check endpoint
  get "up" => "rails/health#show", as: :rails_health_check
end
