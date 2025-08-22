require 'csv'

class BulkTransactionImportJob < ApplicationJob
  queue_as :bulk_import
  
  CHUNK_SIZE = 5000          # Larger chunks for bulk operations
  ANOMALY_DETECTION_SIZE = 10000  # Even larger chunks for anomaly detection
  
  def perform(temp_file_path, user_id, session_id)
    user = User.find(user_id)
    
    # Find bulk import record
    bulk_import = user.bulk_imports.find_by(session_id: session_id)
    unless bulk_import
      Rails.logger.error "Bulk import session not found: #{session_id}"
      return
    end
    
    begin
      bulk_import.mark_started!
      
      # Read CSV file
      unless File.exist?(temp_file_path)
        raise "Temporary file not found: #{temp_file_path}"
      end
      
      csv_content = File.read(temp_file_path)
      csv_rows = CSV.parse(csv_content, headers: true)
      total_rows = csv_rows.count
      
      # Update total count
      bulk_import.update!(total_rows: total_rows)
      
      # Initialize progress tracking
      update_progress(session_id, bulk_import, 0, "Parsing CSV data...")
      
      update_progress(session_id, bulk_import, 5, "Preparing categories...")
      
      # Bulk create categories
      category_lookup = prepare_categories(user, csv_rows)
      
      update_progress(session_id, bulk_import, 10, "Processing transactions...")
      
      # Process in large chunks with true bulk insert
      all_transaction_ids = []
      processed_count = 0
      
      csv_rows.each_slice(CHUNK_SIZE).with_index do |chunk, chunk_index|
        transaction_ids = process_transaction_chunk(user, chunk, category_lookup)
        all_transaction_ids.concat(transaction_ids)
        
        processed_count += chunk.size
        progress = 10 + (processed_count.to_f / total_rows * 70).round(1)
        
        bulk_import.update_progress!(
          processed: processed_count,
          imported: all_transaction_ids.size
        )
        
        update_progress(session_id, bulk_import, progress, "Processed #{processed_count}/#{total_rows} transactions")
        
        # Garbage collection every 10 chunks
        GC.start if chunk_index % 10 == 0
      end
      
      update_progress(session_id, bulk_import, 80, "Running anomaly detection...")
      
      # Run anomaly detection in larger chunks
      all_transaction_ids.each_slice(ANOMALY_DETECTION_SIZE).with_index do |chunk_ids, chunk_index|
        BulkAnomalyDetectionJob.perform_later(user.id, chunk_ids, session_id)
      end
      
      update_progress(session_id, bulk_import, 90, "Finalizing import...")
      
      # Update final counts and complete
      bulk_import.update!(imported_count: all_transaction_ids.size)
      bulk_import.mark_completed!
      
      update_progress(session_id, bulk_import, 100, "Import completed successfully!")
      
      # Broadcast completion
      broadcast_progress(session_id, {
        session_id: session_id,
        status: 'completed',
        percentage: 100,
        processed: total_rows,
        total: total_rows,
        imported: all_transaction_ids.size,
        errors: 0,
        message: "Import completed successfully!"
      })
      
    rescue StandardError => e
      Rails.logger.error "Bulk import error: #{e.message}\n#{e.backtrace.join("\n")}"
      bulk_import.mark_failed!(e.message)
      
      broadcast_progress(session_id, {
        session_id: session_id,
        status: 'failed',
        percentage: 0,
        message: "Import failed: #{e.message}"
      })
    ensure
      # Cleanup temporary file
      File.delete(temp_file_path) if File.exist?(temp_file_path)
    end
  end
  
  private
  
  def prepare_categories(user, csv_rows)
    category_names = csv_rows.map { |row| row['category']&.strip }.compact.uniq
    existing_categories = user.categories.where(name: category_names).index_by(&:name)
    
    # Bulk create missing categories
    missing_categories = category_names - existing_categories.keys
    if missing_categories.any?
      category_records = missing_categories.map do |name|
        Category.new(name: name, user: user, created_at: Time.current, updated_at: Time.current)
      end
      
      # True bulk insert without callbacks
      Category.create!(category_records.map(&:attributes))
      
      # Refresh lookup
      new_categories = user.categories.where(name: missing_categories).index_by(&:name)
      existing_categories.merge!(new_categories)
    end
    
    existing_categories
  end
  
  def process_transaction_chunk(user, chunk, category_lookup)
    # Prepare transaction records for bulk insert
    transaction_records = []
    now = Time.current
    
    chunk.each do |row|
      category = nil
      if row['category'].present?
        category = category_lookup[row['category'].strip]
      end
      
      transaction_records << {
        user_id: user.id,
        date: parse_date(row['date']),
        amount: row['amount'].to_f,
        description: row['description'],
        category_id: category&.id,
        status: 'valid', # Will be updated by anomaly detection
        created_at: now,
        updated_at: now
      }
    end
    
    # Single bulk insert
    result = Transaction.insert_all(transaction_records, returning: [:id])
    result.rows.flatten
  end
  
  def update_progress(session_id, bulk_import, progress, message)
    # Update database record
    bulk_import.reload
    
    # Broadcast to frontend via ActionCable
    broadcast_progress(session_id, {
      session_id: session_id,
      status: bulk_import.status,
      percentage: progress,
      processed: bulk_import.processed_rows,
      total: bulk_import.total_rows,
      imported: bulk_import.imported_count,
      errors: bulk_import.error_count,
      message: message
    })
  end
  
  def broadcast_progress(session_id, data)
    ActionCable.server.broadcast("import_progress_#{session_id}", data)
  end
  
  def parse_date(date_string)
    return nil if date_string.blank?
    
    begin
      DateTime.strptime(date_string, '%m/%d/%Y %H:%M:%S')
    rescue ArgumentError
      begin
        Date.strptime(date_string, '%m/%d/%Y').to_datetime.beginning_of_day
      rescue ArgumentError
        nil
      end
    end
  end
end
