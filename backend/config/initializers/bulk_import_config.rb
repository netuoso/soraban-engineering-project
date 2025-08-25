# config/initializers/bulk_import_config.rb

Rails.application.configure do
  # Bulk import configuration
  config.bulk_import = ActiveSupport::OrderedOptions.new
  
  # Chunk sizes for different operations
  config.bulk_import.transaction_chunk_size = 5000
  config.bulk_import.anomaly_detection_chunk_size = 1000
  
  # Progress update frequency (in chunks processed)
  config.bulk_import.progress_update_frequency = 5
  
  # Session timeout for bulk imports (in seconds)
  config.bulk_import.session_timeout = 3600  # 1 hour
  
  # Memory management
  config.bulk_import.gc_frequency = 10  # Run GC every 10 chunks
  
  # Job queue configuration
  config.active_job.queue_adapter = :async
  
  # Separate queue for bulk operations
  config.active_job.bulk_import_queue = :bulk_import
  config.active_job.anomaly_detection_queue = :anomaly_detection
end

# Configure job queues
ActiveJob::Base.queue_name_prefix = Rails.env

# Set up separate queues with different concurrency
if Rails.env.development?
  # In development, limit concurrency to prevent overwhelming the system
  Rails.application.config.active_job.async_adapter_concurrency = {
    default: 2,
    bulk_import: 1,
    anomaly_detection: 1
  }
end
