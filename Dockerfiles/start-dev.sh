#!/bin/bash

# Soraban Development Environment Setup Script

set -e

echo "🚀 Starting Soraban Development Environment..."

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [ ! -f .env ]; then
        echo "📝 Creating .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/backend_development
DATABASE_HOST=postgres

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# Rails Configuration
RAILS_ENV=development
RAILS_MAX_THREADS=5
WEB_CONCURRENCY=1

# React Configuration
REACT_APP_API_URL=http://localhost:3000
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
EOF
        echo "✅ Created .env file with default configuration"
    fi
}

# Function to enable Rails caching
enable_rails_caching() {
    echo "📦 Enabling Rails caching for development..."
    docker-compose exec backend touch tmp/caching-dev.txt || true
}

# Function to setup database
setup_database() {
    echo "🗄️  Setting up database..."
    docker-compose exec backend rails db:create db:migrate db:seed || {
        echo "⚠️  Database setup failed, but continuing..."
    }
}

# Main execution
main() {
    check_docker
    create_env_file
    
    echo "🔨 Building and starting services..."
    docker-compose up -d --build
    
    echo "⏳ Waiting for services to be ready..."
    sleep 10
    
    enable_rails_caching
    setup_database
    
    echo ""
    echo "🎉 Soraban Development Environment is ready!"
    echo ""
    echo "📊 Services running:"
    echo "   • Frontend (React):  http://localhost:3001"
    echo "   • Backend (Rails):   http://localhost:3000"
    echo "   • PostgreSQL:        localhost:5432"
    echo "   • Redis:             localhost:6379"
    echo ""
    echo "🔧 Useful commands:"
    echo "   • View logs:         docker-compose logs -f"
    echo "   • Stop services:     docker-compose down"
    echo "   • Restart services:  docker-compose restart"
    echo "   • Shell into backend: docker-compose exec backend bash"
    echo "   • Rails console:     docker-compose exec backend rails console"
    echo "   • Run tests:         docker-compose exec backend rails test"
    echo ""
    echo "📝 Check logs with: docker-compose logs -f"
}

main
