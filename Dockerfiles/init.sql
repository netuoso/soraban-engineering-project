-- Create test database for Rails
CREATE DATABASE backend_test;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE backend_development TO postgres;
GRANT ALL PRIVILEGES ON DATABASE backend_test TO postgres;
