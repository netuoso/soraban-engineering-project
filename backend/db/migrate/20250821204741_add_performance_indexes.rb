class AddPerformanceIndexes < ActiveRecord::Migration[7.1]
  def change
    # Add composite indexes for common query patterns
    add_index :transactions, [:user_id, :date], name: 'index_transactions_on_user_id_and_date'
    add_index :transactions, [:user_id, :status], name: 'index_transactions_on_user_id_and_status' 
    add_index :transactions, [:user_id, :category_id], name: 'index_transactions_on_user_id_and_category_id'
    add_index :transactions, [:user_id, :updated_at], name: 'index_transactions_on_user_id_and_updated_at'
    
    # Add regular index for text search on description (simpler approach)
    add_index :transactions, :description, name: 'index_transactions_on_description'
    
    # Add indexes for categories
    add_index :categories, [:user_id, :name], name: 'index_categories_on_user_id_and_name'
    
    # Add indexes for rules
    add_index :rules, [:user_id, :condition_type], name: 'index_rules_on_user_id_and_condition_type'
  end
end
