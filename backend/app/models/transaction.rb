class Transaction < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :status, inclusion: { in: %w[valid invalid] }

  before_validation :apply_rules
  before_validation :set_status
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

  private

  def apply_rules
    return if errors.any? || !description.present? || !amount.present? # Skip if validation failed or missing required data
    RuleApplicationService.apply_rules(self)
  end

  def set_status
    # Start with base status
    base_status = if category.nil? || description.blank?
                    'invalid'
                  else
                    'valid'
                  end
    
    # If there are anomaly flags in notes, mark as invalid
    has_anomalies = notes.present? && notes.include?('[ANOMALY:')
    self.status = (has_anomalies || base_status == 'invalid') ? 'invalid' : 'valid'
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
