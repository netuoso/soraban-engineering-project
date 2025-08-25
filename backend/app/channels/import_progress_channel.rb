class ImportProgressChannel < ApplicationCable::Channel
  def subscribed
    session_id = params[:session_id]
    
    Rails.logger.info "ImportProgressChannel: Attempting to subscribe to session_id: #{session_id}, current_user: #{current_user&.id}"
    
    # Verify user owns this import session
    if session_id.present? && valid_session?(session_id)
      stream_from "import_progress_#{session_id}"
      Rails.logger.info "ImportProgressChannel: Successfully subscribed to session: #{session_id}"
      
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
      Rails.logger.warn "ImportProgressChannel: Rejecting subscription for session_id: #{session_id}, current_user: #{current_user&.id}"
      reject
    end
  end
  
  def unsubscribed
    # Clean up when user disconnects
    Rails.logger.info "ImportProgressChannel: Unsubscribed from session"
    stop_all_streams
  end
  
  private
  
  def valid_session?(session_id)
    # Check if the current user has this import session
    result = current_user&.bulk_imports&.exists?(session_id: session_id)
    Rails.logger.info "ImportProgressChannel: Session validation for #{session_id}: #{result}, user: #{current_user&.id}"
    result
  end
end
