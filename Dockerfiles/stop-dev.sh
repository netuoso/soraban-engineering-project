#!/bin/bash

# Soraban Development Environment Stop Script

echo "🛑 Stopping Soraban Development Environment..."

# Stop and remove containers
docker-compose down

echo "✅ All services stopped"
echo ""
echo "🔧 Other useful commands:"
echo "   • Remove volumes:      docker-compose down -v"
echo "   • Remove images:       docker-compose down --rmi all"
echo "   • Clean everything:    docker system prune -a"
