#!/bin/bash

# Soraban Development Environment Health Check

echo "🔍 Checking Soraban Development Environment Health..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service health
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}
    
    echo -n "Checking $service_name... "
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ Unhealthy${NC}"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local service_name=$1
    
    echo -n "Checking Docker service $service_name... "
    
    if docker-compose ps | grep -q "$service_name.*Up"; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Running${NC}"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo -n "Checking PostgreSQL connectivity... "
    
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Connected${NC}"
        return 1
    fi
}

# Function to check Redis connectivity
check_redis() {
    echo -n "Checking Redis connectivity... "
    
    if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Connected${NC}"
        return 0
    else
        echo -e "${RED}❌ Not Connected${NC}"
        return 1
    fi
}

# Function to show service logs
show_failing_logs() {
    local service=$1
    echo ""
    echo -e "${YELLOW}📋 Last 10 log entries for $service:${NC}"
    docker-compose logs --tail=10 "$service"
}

# Main health check
main() {
    local overall_health=0
    
    echo "📊 Docker Services Status:"
    check_docker_service "postgres" || overall_health=1
    check_docker_service "redis" || overall_health=1
    check_docker_service "backend" || overall_health=1
    check_docker_service "sidekiq" || overall_health=1
    check_docker_service "frontend" || overall_health=1
    
    echo ""
    echo "🔗 Service Connectivity:"
    check_database || overall_health=1
    check_redis || overall_health=1
    
    echo ""
    echo "🌐 HTTP Endpoints:"
    check_service "Rails Backend" "http://localhost:3000/health" 5 || overall_health=1
    check_service "React Frontend" "http://localhost:3001" 5 || overall_health=1
    
    echo ""
    
    if [ $overall_health -eq 0 ]; then
        echo -e "${GREEN}🎉 All services are healthy!${NC}"
        echo ""
        echo "📊 Access your application:"
        echo "   • Frontend: http://localhost:3001"
        echo "   • Backend:  http://localhost:3000"
        echo ""
    else
        echo -e "${RED}⚠️  Some services are unhealthy${NC}"
        echo ""
        echo "🔧 Troubleshooting steps:"
        echo "   1. Check service logs: docker-compose logs [service-name]"
        echo "   2. Restart services: docker-compose restart"
        echo "   3. Rebuild services: docker-compose up -d --build"
        echo "   4. Check Docker resources: docker system df"
        echo ""
        
        # Show logs for failing services
        if ! docker-compose ps | grep -q "backend.*Up"; then
            show_failing_logs "backend"
        fi
        
        if ! docker-compose ps | grep -q "frontend.*Up"; then
            show_failing_logs "frontend"
        fi
    fi
    
    exit $overall_health
}

main
