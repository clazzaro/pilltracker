#!/bin/bash

# Bob SDLC Demo - Automated Setup Script
# This script sets up everything needed to run the demo

set -e  # Exit on any error

echo "🤖 Bob SDLC Demo - Setup Starting..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Warning: Node.js 18+ recommended. You have: $(node -v)${NC}"
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"
echo ""

# Check if .env exists
echo -e "${BLUE}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit .env with your Jira and GitHub credentials${NC}"
    echo ""
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi
echo ""

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Install workspace dependencies
echo -e "${BLUE}Installing workspace dependencies...${NC}"
npm install --workspaces
echo -e "${GREEN}✓ Workspace dependencies installed${NC}"
echo ""

# Initialize database
echo -e "${BLUE}Initializing database...${NC}"
cd backend
npm run db:init
echo -e "${GREEN}✓ Database initialized${NC}"
echo ""

# Seed database
echo -e "${BLUE}Seeding database with demo data...${NC}"
npm run seed
echo -e "${GREEN}✓ Database seeded${NC}"
echo ""

cd ..

# Create .bob-tasks directory if it doesn't exist
echo -e "${BLUE}Setting up task directory...${NC}"
mkdir -p .bob-tasks
echo -e "${GREEN}✓ Task directory ready${NC}"
echo ""

# Verify MCP configuration
echo -e "${BLUE}Verifying MCP configuration...${NC}"
if [ -f ".bob/mcp.json" ]; then
    echo -e "${GREEN}✓ MCP configuration exists${NC}"
else
    echo -e "${YELLOW}⚠️  MCP configuration not found - Bob IDE will create it${NC}"
fi
echo ""

# Final checks
echo -e "${BLUE}Running final checks...${NC}"

# Check if ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use (Frontend)${NC}"
else
    echo -e "${GREEN}✓ Port 3000 available (Frontend)${NC}"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 3001 is in use (Backend)${NC}"
else
    echo -e "${GREEN}✓ Port 3001 available (Backend)${NC}"
fi
echo ""

# Success message
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Edit .env with your credentials:"
echo "   - Jira API token"
echo "   - GitHub token"
echo ""
echo "2. Start the application:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "3. Start the watchers (in separate terminals):"
echo "   ${YELLOW}cd mcp-servers/jira-server && npm run watch${NC}"
echo "   ${YELLOW}cd mcp-servers/github-server && npm run watch${NC}"
echo ""
echo "4. Create a Jira ticket and assign to 'bobdev'"
echo ""
echo "5. Tell Bob: 'Check for new tasks and work on them'"
echo ""
echo -e "${GREEN}Happy demoing! 🚀${NC}"
echo ""

# Made with Bob
