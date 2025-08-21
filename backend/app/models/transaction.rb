class Transaction < ApplicationRecord
  belongs_to :category, optional: true
  belongs_to :user

  validates :date, presence: true
  validates :amount, presence: true, numericality: true
  validates :status, inclusion: { in: %w[valid invalid] }

  before_validation :apply_rules
  before_validation :set_status
  before_validation :detect_anomalies

  # Store anomaly information in notes field with a prefix
  scope :anomalous, -> { where(status: 'invalid') }
  scope :with_anomaly, ->(type) { where("notes LIKE ?", "%[ANOMALY:#{type}]%") }

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

  def detect_anomalies
    return if errors.any? || user.nil?
    
    # Clear existing anomaly flags before detecting new ones
    clear_anomaly_flags
    
    # Detect individual anomalies
    detect_amount_anomaly
    detect_duplicate_anomaly
    detect_incomplete_metadata_anomaly
  end

  def detect_amount_anomaly
    return unless amount.present?
    
    # Get user's transaction history (excluding current transaction if updating)
    historical_transactions = user.transactions.where.not(id: id).limit(100).pluck(:amount)
    return if historical_transactions.size < 10 # Need at least 10 transactions for statistical analysis
    
    # Calculate statistics
    amounts = historical_transactions.map(&:abs)
    mean = amounts.sum / amounts.size.to_f
    variance = amounts.sum { |x| (x - mean) ** 2 } / amounts.size.to_f
    std_dev = Math.sqrt(variance)
    
    # Check if current amount is anomalous (more than 2 standard deviations)
    current_amount = amount.abs
    if (current_amount - mean).abs > 2 * std_dev && std_dev > 0
      add_anomaly_flag('unusual_amount', "Amount significantly different from usual patterns (#{current_amount} vs avg #{mean.round(2)})")
    end
  end

  def detect_duplicate_anomaly
    return unless date.present? && amount.present? && description.present?
    
    # Look for potential duplicates within the same day
    similar_transactions = user.transactions
                              .where.not(id: id)
                              .where(date: date.beginning_of_day..date.end_of_day)
                              .where(amount: amount)
                              .where('LOWER(description) = ?', description.downcase)
    
    if similar_transactions.exists?
      add_anomaly_flag('potential_duplicate', "Similar transaction found on the same date with identical amount and description")
    end
  end

  def detect_incomplete_metadata_anomaly
    missing_fields = []
    
    missing_fields << 'description' if description.blank?
    missing_fields << 'category' if category.nil?
    
    if missing_fields.any?
      add_anomaly_flag('incomplete_metadata', "Missing required fields: #{missing_fields.join(', ')}")
    end
  end
end
