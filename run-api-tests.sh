#!/bin/bash

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== API Testing with Enhanced Logging ===${NC}"
echo -e "${YELLOW}This script will restart the backend with detailed logging and run test API calls${NC}"

# Stop any running backend processes
echo -e "\n${BLUE}Stopping any running backend servers...${NC}"
pkill -f backend-server || true
sleep 1

# Start the backend server
echo -e "\n${GREEN}Starting backend server with enhanced logging...${NC}"
cd backend
./backend-server &
BACKEND_PID=$!
cd ..

# Wait for backend to be fully started
echo -e "${YELLOW}Waiting for backend to initialize...${NC}"
sleep 3
echo -e "${GREEN}Backend server started with PID: $BACKEND_PID${NC}"

# Test server health
echo -e "\n${BLUE}Testing backend server health...${NC}"
curl -s http://localhost:8080/health | jq .

# Run API tests
echo -e "\n${BLUE}Running API tests with detailed logging...${NC}"
echo -e "${YELLOW}1. Testing auth/check endpoint${NC}"
curl -s -X POST -H "Content-Type: application/json" -d '{"emailOrPhone":"test@example.com"}' http://localhost:8080/api/auth/check
echo -e "\n\n${YELLOW}2. Testing auth/signin endpoint (with invalid credentials to test error logging)${NC}"
curl -s -X POST -H "Content-Type: application/json" -d '{"emailOrPhone":"test@example.com","password":"wrongpassword"}' http://localhost:8080/api/auth/signin
echo

# Show that the mobile app is also logging API calls
echo -e "\n${BLUE}The mobile app is logging all API calls with the following details:${NC}"
echo -e "- ${GREEN}Request URLs, methods and payloads${NC}"
echo -e "- ${GREEN}Response status codes and data${NC}"
echo -e "- ${GREEN}Response times in milliseconds${NC}"
echo -e "- ${GREEN}Error details when requests fail${NC}"

echo -e "\n${BLUE}Check the terminal running the backend server for detailed request/response logs${NC}"

# Keep the backend server running
echo -e "\n${YELLOW}Backend server is still running with PID: $BACKEND_PID${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop when finished testing${NC}"
echo -e "\n${GREEN}You can now test the mobile app against the backend with enhanced logging${NC}"

# Wait for user to stop the script
wait $BACKEND_PID