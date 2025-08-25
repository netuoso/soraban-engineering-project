class AddBulkImportOptimizations < ActiveRecord::Migration[7.1]
  def change
    # Add indexes for bulk import performance
    add_index :transactions, [:user_id, :date, :amount, :description], 
              name: 'index_transactions_for_duplicate_detection'
    
    # Composite index for anomaly detection queries
    add_index :transactions, [:user_id, :created_at], 
              name: 'index_transactions_for_historical_analysis'
    
    # Add import tracking table
    create_table :bulk_imports do |t|
      t.references :user, null: false, foreign_key: true
      t.string :session_id, null: false, index: { unique: true }
      t.string :status, default: 'pending'
      t.integer :total_rows, default: 0
      t.integer :processed_rows, default: 0
      t.integer :imported_count, default: 0
      t.integer :error_count, default: 0
      t.text :error_details
      t.datetime :started_at
      t.datetime :completed_at
      t.timestamps
    end
    
    # Add counter cache for user transactions
    add_column :users, :transactions_count, :integer, default: 0
    
    # Backfill counter cache
    User.find_each do |user|
      User.update_counters(user.id, transactions_count: user.transactions.count)
    end
  end
  
  def down
    remove_index :transactions, name: 'index_transactions_for_duplicate_detection'
    remove_index :transactions, name: 'index_transactions_for_historical_analysis'
    drop_table :bulk_imports
    remove_column :users, :transactions_count
  end
end
