class Transaction < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :status, optional: true
  belongs_to :user

  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :status, presence: true

  before_validation :apply_rules
  before_validation :handle_anomaly_clearing
  before_validation :set_final_status
  after_commit :enqueue_anomaly_detection, on: [:create, :update], unless: :skip_anomaly_detection?

  # Store anomaly information in notes field with a prefix
  scope :anomalous, -> { where(status: 'invalid') }
  scope :with_anomaly, ->(type) { where("notes LIKE ?", "%[ANOMALY:#{type}]%") }

  attr_accessor :skip_anomaly_detection

  def anomaly_types
    return [] unless notes.present?
    notes.scan(/\[ANOMALY:([^\]]+)\]/).flatten
  end

  def has_anomaly?(type)
    anomaly_types.include?(type.to_s)
  end

  def add_anomaly_flag(type, details)
    self.notes = "#{notes || ''}\n[ANOMALY:#{type}] #{details}".strip
    self.status = 'invalid' # Mark as invalid when anomaly is detected
  end

  def clear_anomaly_flags
    return unless notes.present?
    self.notes = notes.gsub(/\[ANOMALY:[^\]]+\][^\n]*\n?/, '').strip
    self.notes = nil if notes.empty?
  end

  def clear_specific_anomaly(type)
    return unless notes.present?
    self.notes = notes.gsub(/\[ANOMALY:#{type}\][^\n]*\n?/, '').strip
    self.notes = nil if notes.empty?
  end

  def add_user_validation_note
    # Clear all existing anomalies first
    clear_anomaly_flags
    # Add note to prevent future anomaly detection
    user_note = "[USER_VALIDATED] Transaction explicitly marked as valid by user"
    self.notes = notes.present? ? "#{notes}\n#{user_note}" : user_note
  end

  def user_validated?
    notes.present? && notes.include?('[USER_VALIDATED]')
  end

  private

  def apply_rules
    return if errors.any? || !description.present? || !amount.present? # Skip if validation failed or missing required data
    
    # Apply rules regardless of existing category (rules may update status too)
    RuleApplicationService.apply_rules(self)
  end

  def handle_anomaly_clearing
    # If category was added and we had a missing metadata anomaly, clear it
    if category_id_changed? && category_id.present? && has_anomaly?('incomplete_metadata')
      # Check if this was specifically about missing category
      if notes.present? && notes.include?('Missing required fields: category')
        clear_specific_anomaly('incomplete_metadata')
      end
    end

    # If user explicitly marks transaction as valid, clear all anomalies and add user validation note
    if status_changed? && status == 'valid' && status_was == 'invalid' && notes.present? && notes.include?('[ANOMALY:')
      add_user_validation_note
    end
  end

  def set_final_status
    # If status was already set by rules and it's not a default status, keep it
    return if status.present? && !status.in?(['valid', 'invalid'])
    
    # Check for anomaly flags first - they always force invalid status
    if notes.present? && notes.include?('[ANOMALY:')
      self.status = 'invalid'
      return
    end
    
    # If status was manually changed to 'invalid' in this update, preserve it
    # This allows manual flagging to be preserved
    if status_changed? && status == 'invalid'
      return
    end
    
    # If status is already 'invalid' and wasn't changed in this update, preserve it
    # This prevents automatic override of manually flagged transactions
    if status == 'invalid' && !status_changed?
      return
    end
    
    # Set status based on transaction completeness after rules have been applied
    if category.present? && description.present?
      self.status = 'valid'
    else
      self.status = 'invalid'
    end
  end

  def enqueue_anomaly_detection
    # Only run anomaly detection for persisted transactions with required data
    return unless persisted? && user_id.present?
    
    # Enqueue the anomaly detection job to run asynchronously
    AnomalyDetectionJob.perform_later(id)
  end

  def skip_anomaly_detection?
    !!@skip_anomaly_detection
  end
end
