#!/bin/bash

# Soraban Development Environment Stop Script

echo "🛑 Stopping Soraban Development Environment..."

# Stop and remove containers
docker-compose down

# Remove Rails server.pid file if it exists (prevents server start issues)
PID_FILE="../backend/tmp/pids/server.pid"
if [ -f "$PID_FILE" ]; then
	echo "🧹 Removing Rails server.pid file..."
	rm -f "$PID_FILE"
fi

echo "✅ All services stopped"
echo ""
echo "🔧 Other useful commands:"
echo "   • Remove volumes:      docker-compose down -v"
echo "   • Remove images:       docker-compose down --rmi all"
echo "   • Clean everything:    docker system prune -a"
