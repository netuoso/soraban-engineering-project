class AddOrderToRules < ActiveRecord::Migration[7.1]
  def change
    add_column :rules, :order, :integer, default: 0, null: false
    add_index :rules, [:user_id, :order]
  end
end
