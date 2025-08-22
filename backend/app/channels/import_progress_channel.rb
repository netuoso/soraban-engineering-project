class ImportProgressChannel < ApplicationCable::Channel
  def subscribed
    session_id = params[:session_id]
    
    # Verify user owns this import session
    if session_id.present? && valid_session?(session_id)
      stream_from "import_progress_#{session_id}"
      
      # Send current progress immediately
      bulk_import = current_user&.bulk_imports&.find_by(session_id: session_id)
      if bulk_import
        transmit({
          session_id: session_id,
          status: bulk_import.status,
          percentage: bulk_import.progress_percentage,
          processed: bulk_import.processed_rows,
          total: bulk_import.total_rows,
          imported: bulk_import.imported_count,
          errors: bulk_import.error_count,
          started_at: bulk_import.started_at,
          completed_at: bulk_import.completed_at
        })
      end
    else
      reject
    end
  end
  
  def unsubscribed
    # Clean up when user disconnects
    stop_all_streams
  end
  
  private
  
  def valid_session?(session_id)
    # Check if the current user has this import session
    current_user&.bulk_imports&.exists?(session_id: session_id)
  end
  
  def current_user
    # This needs to be implemented based on your authentication
    # For now, assuming connection has access to current_user
    connection.current_user if connection.respond_to?(:current_user)
  end
end
