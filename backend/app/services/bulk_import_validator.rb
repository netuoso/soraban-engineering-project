require 'csv'

class BulkImportError < StandardError
  attr_reader :error_type, :details

  def initialize(message, error_type: :general, details: {})
    super(message)
    @error_type = error_type
    @details = details
  end
end

class BulkImportValidator
  REQUIRED_HEADERS = %w[date amount description category].freeze
  MAX_FILE_SIZE = 50.megabytes
  MAX_ROWS = 500_000

  def self.validate_file(file)
    errors = []
    
    # Check file size
    if file.size > MAX_FILE_SIZE
      errors << "File size (#{file.size.to_f / 1.megabyte}MB) exceeds maximum allowed size (#{MAX_FILE_SIZE / 1.megabyte}MB)"
    end
    
    # Check file format
    unless file.content_type == 'text/csv' || file.original_filename&.end_with?('.csv')
      errors << "File must be a CSV format"
    end
    
    return errors unless errors.empty?
    
    # Validate CSV structure
    begin
      csv_content = file.read
      file.rewind # Reset file position
      
      csv = CSV.parse(csv_content, headers: true)
      
      # Check row count
      if csv.length > MAX_ROWS
        errors << "File contains #{csv.length} rows, maximum allowed is #{MAX_ROWS}"
      end
      
      # Check required headers
      missing_headers = REQUIRED_HEADERS - csv.headers.map(&:downcase)
      unless missing_headers.empty?
        errors << "Missing required columns: #{missing_headers.join(', ')}"
      end
      
      # Validate sample rows
      sample_errors = validate_sample_rows(csv.first(10))
      errors.concat(sample_errors)
      
    rescue CSV::MalformedCSVError => e
      errors << "Invalid CSV format: #{e.message}"
    rescue StandardError => e
      errors << "Error reading file: #{e.message}"
    end
    
    errors
  end
  
  private
  
  def self.validate_sample_rows(rows)
    errors = []
    
    rows.each_with_index do |row, index|
      row_number = index + 2 # Account for header row
      
      # Validate date
      begin
        Date.parse(row['date']) if row['date'].present?
      rescue ArgumentError
        errors << "Row #{row_number}: Invalid date format '#{row['date']}'"
      end
      
      # Validate amount
      begin
        BigDecimal(row['amount']) if row['amount'].present?
      rescue ArgumentError
        errors << "Row #{row_number}: Invalid amount format '#{row['amount']}'"
      end
      
      # Check required fields
      if row['description'].blank?
        errors << "Row #{row_number}: Description is required"
      end
    end
    
    # Limit error messages to prevent overwhelming response
    errors.first(10)
  end
end
