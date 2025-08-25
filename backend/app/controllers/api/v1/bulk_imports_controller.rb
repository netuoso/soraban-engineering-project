class Api::V1::BulkImportsController < ApplicationController
  before_action :authenticate_user!
  
  def create
    file = params[:file]
    
    unless file.present?
      return render json: { error: 'No file provided' }, status: :bad_request
    end
    
    # Validate file before processing
    validation_errors = BulkImportValidator.validate_file(file)
    if validation_errors.any?
      return render json: { 
        error: 'File validation failed', 
        details: validation_errors 
      }, status: :unprocessable_entity
    end
    
    # Generate unique session ID for tracking progress
    session_id = SecureRandom.uuid
    
    # Create bulk import record for tracking
    bulk_import = current_user.bulk_imports.create!(
      session_id: session_id,
      status: 'pending'
    )
    
    # Store temporary file info
    temp_file_path = store_temporary_file(file)
    
    # Store session info in Redis for progress tracking
    Rails.cache.write("bulk_import_session:#{session_id}", {
      user_id: current_user.id,
      filename: file.original_filename,
      temp_file_path: temp_file_path,
      started_at: Time.current
    }, expires_in: 1.hour)
    
    # Queue the bulk import job
    BulkTransactionImportJob.perform_later(
      temp_file_path,
      current_user.id,
      session_id
    )
    
    render json: { 
      session_id: session_id,
      message: 'Bulk import started. You will receive real-time updates.'
    }
  rescue BulkImportError => e
    Rails.logger.error "Bulk import validation error: #{e.message}"
    render json: { 
      error: e.message, 
      error_type: e.error_type,
      details: e.details 
    }, status: :unprocessable_entity
  rescue StandardError => e
    Rails.logger.error "Bulk import error: #{e.message}\n#{e.backtrace.join("\n")}"
    render json: { error: 'Failed to start bulk import' }, status: :internal_server_error
  end
  
  def progress
    session_id = params[:session_id]
    
    # Get progress from database
    bulk_import = current_user.bulk_imports.find_by(session_id: session_id)
    
    unless bulk_import
      return render json: { error: 'Import session not found' }, status: :not_found
    end
    
    progress_data = {
      session_id: session_id,
      status: bulk_import.status,
      percentage: bulk_import.progress_percentage,
      processed: bulk_import.processed_rows,
      total: bulk_import.total_rows,
      imported: bulk_import.imported_count,
      errors: bulk_import.error_count,
      started_at: bulk_import.started_at,
      completed_at: bulk_import.completed_at,
      duration: bulk_import.duration
    }
    
    # Add estimated completion time if still processing
    if bulk_import.status == 'processing' && bulk_import.processed_rows > 0
      rate = bulk_import.processed_rows.to_f / bulk_import.duration
      remaining = bulk_import.total_rows - bulk_import.processed_rows
      progress_data[:estimated_completion] = remaining / rate if rate > 0
    end
    
    render json: progress_data
  end
  
  def index
    imports = current_user.bulk_imports
                          .order(created_at: :desc)
                          .limit(20)
                          .select(:id, :session_id, :status, :total_rows, 
                                 :processed_rows, :imported_count, :error_count, 
                                 :started_at, :completed_at, :created_at)
    
    render json: imports.map { |import|
      {
        id: import.id,
        session_id: import.session_id,
        status: import.status,
        total_rows: import.total_rows,
        imported_count: import.imported_count,
        error_count: import.error_count,
        progress_percentage: import.progress_percentage,
        duration: import.duration,
        started_at: import.started_at,
        completed_at: import.completed_at,
        created_at: import.created_at
      }
    }
  end
  
  def cancel
    session_id = params[:session_id]
    
    # Mark import as cancelled in database
    bulk_import = current_user.bulk_imports.find_by(session_id: session_id)
    
    if bulk_import&.status == 'processing'
      bulk_import.mark_failed!('Import cancelled by user')
      
      # Set cancellation flag in cache
      Rails.cache.write("import_cancelled_#{session_id}", true, expires_in: 1.hour)
      
      render json: { message: 'Import cancellation requested' }
    else
      render json: { error: 'Import session not found or not cancellable' }, status: :not_found
    end
  end
  
  private
  
  def store_temporary_file(file)
    # Create temp directory if it doesn't exist
    temp_dir = Rails.root.join('tmp', 'bulk_imports')
    FileUtils.mkdir_p(temp_dir)
    
    # Generate unique filename
    timestamp = Time.current.strftime('%Y%m%d_%H%M%S')
    filename = "#{current_user.id}_#{timestamp}_#{SecureRandom.hex(8)}.csv"
    temp_path = temp_dir.join(filename)
    
    # Copy uploaded file to temp location
    File.open(temp_path, 'wb') do |temp_file|
      temp_file.write(file.read)
    end
    
    temp_path.to_s
  end
end
