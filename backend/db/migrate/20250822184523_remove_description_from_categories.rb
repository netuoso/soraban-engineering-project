class RemoveDescriptionFromCategories < ActiveRecord::Migration[7.1]
  def change
    remove_column :categories, :description, :string
  end
end
