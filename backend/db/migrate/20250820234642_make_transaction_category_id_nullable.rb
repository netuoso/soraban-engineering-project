class MakeTransactionCategoryIdNullable < ActiveRecord::Migration[7.1]
  def change
    change_column_null :transactions, :category_id, true
  end
end
