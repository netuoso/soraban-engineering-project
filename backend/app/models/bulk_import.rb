class BulkImport < ApplicationRecord
  belongs_to :user
  
  validates :session_id, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[pending processing completed failed] }
  
  scope :active, -> { where(status: %w[pending processing]) }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  
  def progress_percentage
    return 0 if total_rows == 0
    ((processed_rows.to_f / total_rows) * 100).round(2)
  end
  
  def duration
    return nil unless started_at
    
    end_time = completed_at || Time.current
    end_time - started_at
  end
  
  def mark_started!
    update!(status: 'processing', started_at: Time.current)
  end
  
  def mark_completed!
    update!(status: 'completed', completed_at: Time.current)
  end
  
  def mark_failed!(error_message)
    update!(
      status: 'failed',
      completed_at: Time.current,
      error_details: error_message
    )
  end
  
  def update_progress!(processed:, imported: 0, errors: 0)
    update!(
      processed_rows: processed,
      imported_count: imported_count + imported,
      error_count: error_count + errors
    )
  end
end
