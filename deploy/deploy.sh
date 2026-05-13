#!/bin/bash
set -e

echo "========================================="
echo "  LEFTERIA FC - Deployment Script"
echo "========================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "Docker installed. Please log out and back in, then run this script again."
    exit 0
fi

# Check if docker compose is available
if ! docker compose version &> /dev/null; then
    echo "ERROR: docker compose not found. Install Docker Compose plugin."
    exit 1
fi

# Check .env file
if [ ! -f .env ]; then
    echo ""
    echo "ERROR: .env file not found!"
    echo "1. Copy the example: cp .env.example .env"
    echo "2. Edit .env and set DOMAIN_URL to your VPS IP or domain"
    echo "3. Run this script again"
    exit 1
fi

# Load .env
source .env

echo ""
echo "Domain: $DOMAIN_URL"
echo "Admin: $ADMIN_USERNAME"
echo ""

# Build and start
echo "Building containers..."
docker compose --env-file .env build --no-cache

echo ""
echo "Starting services..."
docker compose --env-file .env up -d

echo ""
echo "Waiting for services to start..."
sleep 10

# Health check (containers are not on the host network — Traefik handles public traffic)
echo ""
echo "Checking services..."
if docker compose ps backend | grep -q "Up\|running"; then
    echo "Backend: OK"
else
    echo "Backend: Starting... (may take a few seconds)"
fi

if docker compose ps frontend | grep -q "Up\|running"; then
    echo "Frontend: OK"
else
    echo "Frontend: Starting... (may take a few seconds)"
fi

# Confirm Traefik network attachment
if docker network inspect traefik-proxy --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}' 2>/dev/null | grep -q "${COMPOSE_PROJECT_NAME:-lefteriafc}-frontend"; then
    echo "Traefik routing: CONNECTED"
else
    echo "Traefik routing: WARNING — frontend container not seen on traefik-proxy network."
fi

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE!"
echo "========================================="
echo ""
echo "  Website: $DOMAIN_URL"
echo "  Admin:   $DOMAIN_URL/admin"
echo "  Mobile:  $DOMAIN_URL/app"
echo ""
echo "  Admin Login:"
echo "    Username: $ADMIN_USERNAME"
echo "    Password: (see .env file)"
echo ""
echo "  Useful commands:"
echo "    docker compose logs -f        # View logs"
echo "    docker compose restart        # Restart all"
echo "    docker compose down           # Stop all"
echo "    docker compose up -d --build  # Rebuild & start"
echo ""
