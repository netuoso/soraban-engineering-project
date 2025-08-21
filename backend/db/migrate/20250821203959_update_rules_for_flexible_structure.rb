class UpdateRulesForFlexibleStructure < ActiveRecord::Migration[7.1]
  def change
    # Remove old columns
    remove_column :rules, :name, :string
    remove_column :rules, :pattern, :string
    
    # Add new flexible columns
    add_column :rules, :condition_type, :string, null: false
    add_column :rules, :condition_value, :string, null: false
    add_column :rules, :action_type, :string, null: false
    add_column :rules, :action_value, :string
    
    # Make category_id nullable since we might set status instead
    change_column_null :rules, :category_id, true
  end
end
