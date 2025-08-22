# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.1].define(version: 2025_08_22_001500) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_trgm"
  enable_extension "plpgsql"

  create_table "bulk_imports", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "session_id", null: false
    t.string "status", default: "pending"
    t.integer "total_rows", default: 0
    t.integer "processed_rows", default: 0
    t.integer "imported_count", default: 0
    t.integer "error_count", default: 0
    t.text "error_details"
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["session_id"], name: "index_bulk_imports_on_session_id", unique: true
    t.index ["user_id"], name: "index_bulk_imports_on_user_id"
  end

  create_table "categories", force: :cascade do |t|
    t.string "name"
    t.string "description"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "name"], name: "index_categories_on_user_id_and_name"
    t.index ["user_id"], name: "index_categories_on_user_id"
  end

  create_table "jwt_denylists", force: :cascade do |t|
    t.string "jti"
    t.datetime "exp"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["jti"], name: "index_jwt_denylists_on_jti"
  end

  create_table "rules", force: :cascade do |t|
    t.bigint "category_id"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "condition_type", null: false
    t.string "condition_value", null: false
    t.string "action_type", null: false
    t.string "action_value"
    t.index ["category_id"], name: "index_rules_on_category_id"
    t.index ["user_id", "condition_type"], name: "index_rules_on_user_id_and_condition_type"
    t.index ["user_id"], name: "index_rules_on_user_id"
  end

  create_table "transactions", force: :cascade do |t|
    t.datetime "date"
    t.decimal "amount"
    t.string "description"
    t.string "status"
    t.bigint "category_id"
    t.bigint "user_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "notes"
    t.index ["category_id"], name: "index_transactions_on_category_id"
    t.index ["description"], name: "index_transactions_on_description"
    t.index ["user_id", "category_id"], name: "index_transactions_on_user_id_and_category_id"
    t.index ["user_id", "created_at"], name: "index_transactions_for_historical_analysis"
    t.index ["user_id", "date", "amount", "description"], name: "index_transactions_for_duplicate_detection"
    t.index ["user_id", "date"], name: "index_transactions_on_user_id_and_date"
    t.index ["user_id", "status"], name: "index_transactions_on_user_id_and_status"
    t.index ["user_id", "updated_at"], name: "index_transactions_on_user_id_and_updated_at"
    t.index ["user_id"], name: "index_transactions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "transactions_count", default: 0
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "bulk_imports", "users"
  add_foreign_key "categories", "users"
  add_foreign_key "rules", "categories"
  add_foreign_key "rules", "users"
  add_foreign_key "transactions", "categories"
  add_foreign_key "transactions", "users"
end
