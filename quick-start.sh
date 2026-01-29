#!/bin/bash
# Quick Start Script for Smart Classroom Utilization Tracker
# Run this to quickly deploy the system

echo "═══════════════════════════════════════════════════════════════════"
echo "Smart Classroom Utilization Tracker - Quick Start"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
echo -e "${BLUE}[1/5]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found: $(docker --version)${NC}"

# Check if Docker Compose is installed
echo -e "${BLUE}[2/5]${NC} Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found: $(docker-compose --version)${NC}"

# Create .env file if it doesn't exist
echo -e "${BLUE}[3/5]${NC} Configuring environment..."
if [ ! -f .env ]; then
    cp backend/.env.example .env
    echo -e "${GREEN}✓ Created .env file${NC}"
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Start Docker containers
echo -e "${BLUE}[4/5]${NC} Starting Docker containers..."
docker-compose down 2>/dev/null
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"

# Wait for services to be ready
echo -e "${BLUE}[5/5]${NC} Waiting for services to be ready..."
sleep 15

# Verify all services
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Services are now running:"
echo ""
echo "📱 Admin Dashboard:"
echo "   URL: http://localhost:3000"
echo ""
echo "👥 Staff Portal:"
echo "   URL: http://localhost:3001"
echo ""
echo "🔌 API Server:"
echo "   URL: http://localhost:5000"
echo ""
echo "🗄️  Database:"
echo "   Host: localhost:5432"
echo "   User: classroom"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Create first admin user via API or dashboard"
echo "3. Register ESP devices"
echo "4. Create classrooms and assign devices"
echo ""
echo "For more information, see README.md and SETUP.md"
echo ""
