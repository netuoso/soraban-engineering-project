# Soraban Development Environment with Docker

This project includes a complete Docker setup for easy development with all required services.

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git

### Start Development Environment

```bash
# Clone and enter the project
git clone <repository-url>
cd Soraban

# Start all services with one command
./start-dev.sh
```

This will start:
- **PostgreSQL** database (localhost:5432)
- **Redis** server (localhost:6379)
- **Rails backend** with Sidekiq (localhost:3000)
- **React frontend** (localhost:3001)

### Stop Development Environment

```bash
./stop-dev.sh
```

## Services Overview

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | React application |
| Backend API | http://localhost:3000 | Rails API server |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & job queue |

## Manual Docker Commands

If you prefer manual control:

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Access Rails console
docker-compose exec backend rails console

# Access backend shell
docker-compose exec backend bash

# Run database migrations
docker-compose exec backend rails db:migrate

# Run tests
docker-compose exec backend rails test

# Restart a specific service
docker-compose restart backend
```

## Development Workflow

### Backend Development
- Code changes are automatically reloaded
- Access Rails console: `docker-compose exec backend rails console`
- Run migrations: `docker-compose exec backend rails db:migrate`
- View Sidekiq jobs: Check Rails logs or add Sidekiq web UI

### Frontend Development
- Hot reloading is enabled
- Changes reflect immediately in browser
- Access at http://localhost:3001

### Database Management
- PostgreSQL runs in container with persistent volume
- Default credentials: postgres/password
- Database: backend_development

### Redis & Caching
- Redis is used for Rails caching and Sidekiq jobs
- Accessible at localhost:6379
- Cache is enabled automatically in development

## Environment Variables

Copy `.env.example` to `.env` and modify as needed:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `REACT_APP_API_URL`: Backend API URL for frontend

## Troubleshooting

### Services won't start
```bash
# Check Docker is running
docker info

# Check service status
docker-compose ps

# View detailed logs
docker-compose logs [service-name]
```

### Database issues
```bash
# Reset database
docker-compose exec backend rails db:drop db:create db:migrate db:seed

# Or recreate PostgreSQL container
docker-compose down
docker volume rm soraban_postgres_data
docker-compose up -d postgres
```

### Port conflicts
If ports 3000, 3001, 5432, or 6379 are in use, modify `docker-compose.yml` port mappings.

### Clearing everything
```bash
# Stop and remove everything
docker-compose down -v --rmi all

# Remove all unused Docker resources
docker system prune -a
```

## Performance Features Enabled

The Docker setup includes all performance optimizations:
- ✅ Redis caching enabled
- ✅ Sidekiq background job processing
- ✅ Database connection pooling
- ✅ Hot reloading for development
- ✅ Optimized Docker layers for faster builds

## Production Deployment

For production deployment, use the existing `Dockerfile` in the backend directory which is optimized for production builds.

---

*This Docker setup provides a complete development environment that matches the production architecture while maintaining fast development cycles.*
