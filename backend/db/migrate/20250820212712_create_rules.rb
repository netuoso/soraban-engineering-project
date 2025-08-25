class CreateRules < ActiveRecord::Migration[7.1]
  def change
    create_table :rules do |t|
      t.string :name
      t.string :pattern
      t.references :category, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
