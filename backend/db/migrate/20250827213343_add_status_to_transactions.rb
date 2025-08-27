class AddStatusToTransactions < ActiveRecord::Migration[7.1]
  def change
    add_reference :transactions, :status, null: true, foreign_key: true
  end
end
