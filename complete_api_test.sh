#!/bin/bash

# Set timeout for curl commands
TIMEOUT=10

echo "===== COMPLETE BACKEND API TEST ====="

# Color formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}$1${NC}"
}

# Function to test an endpoint and check its success
test_endpoint() {
  local description=$1
  local command=$2
  
  echo -e "\n${BLUE}$description${NC}"
  local response=$(eval $command)
  echo "$response"
  
  if [[ $response == *"error"* ]]; then
    echo -e "${RED}❌ Failed${NC}"
    return 1
  else
    echo -e "${GREEN}✓ Success${NC}"
    return 0
  fi
}

print_header "1. HEALTH CHECK"
test_endpoint "Testing health endpoint" "curl -s --max-time $TIMEOUT http://localhost:8080/health"

print_header "2. AUTHENTICATION ENDPOINTS"
test_endpoint "Testing auth/check endpoint" "curl -s --max-time $TIMEOUT -X POST -H \"Content-Type: application/json\" -d '{\"emailOrPhone\":\"janesmith@example.com\"}' http://localhost:8080/api/auth/check"

SIGNIN_RESPONSE=$(curl -s --max-time $TIMEOUT -X POST -H "Content-Type: application/json" -d '{"emailOrPhone":"janesmith@example.com","password":"StrongPass123"}' http://localhost:8080/api/auth/signin)
test_endpoint "Testing user signin" "echo '$SIGNIN_RESPONSE'"

# Extract the access token
ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  print_header "3. PROFILE MANAGEMENT"
  test_endpoint "Testing get profile (through signin response)" "echo '$SIGNIN_RESPONSE' | grep -o '\"user\":{[^}]*}'"
  
  test_endpoint "Testing update profile" "curl -s --max-time $TIMEOUT -X PUT -H \"Authorization: Bearer $ACCESS_TOKEN\" -H \"Content-Type: application/json\" -d '{\"firstName\":\"Jane\",\"lastName\":\"Smith-Updated\"}' http://localhost:8080/api/auth/profile"

  print_header "4. MANAGED ACCOUNTS"
  test_endpoint "Testing managed accounts list" "curl -s --max-time $TIMEOUT -H \"Authorization: Bearer $ACCESS_TOKEN\" http://localhost:8080/api/managed-accounts"
  
  MANAGED_ACCOUNT_RESPONSE=$(curl -s --max-time $TIMEOUT -X POST -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"firstName":"Child2","lastName":"Smith","birthDate":"2018-01-15","gender":"male"}' http://localhost:8080/api/managed-accounts)
  test_endpoint "Testing create managed account" "echo '$MANAGED_ACCOUNT_RESPONSE'"
  
  # Extract the managed account ID
  MANAGED_ACCOUNT_ID=$(echo "$MANAGED_ACCOUNT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  
  if [ -n "$MANAGED_ACCOUNT_ID" ]; then
    test_endpoint "Testing get specific managed account" "curl -s --max-time $TIMEOUT -H \"Authorization: Bearer $ACCESS_TOKEN\" http://localhost:8080/api/managed-accounts/$MANAGED_ACCOUNT_ID"
    
    test_endpoint "Testing update managed account" "curl -s --max-time $TIMEOUT -X PUT -H \"Authorization: Bearer $ACCESS_TOKEN\" -H \"Content-Type: application/json\" -d '{\"firstName\":\"Updated2\",\"lastName\":\"Child\",\"birthDate\":\"2018-01-15\",\"gender\":\"male\"}' http://localhost:8080/api/managed-accounts/$MANAGED_ACCOUNT_ID"
    
    test_endpoint "Testing delete managed account" "curl -s --max-time $TIMEOUT -X DELETE -H \"Authorization: Bearer $ACCESS_TOKEN\" http://localhost:8080/api/managed-accounts/$MANAGED_ACCOUNT_ID"
  else
    echo "No managed account ID available, skipping related tests"
  fi
  
  print_header "5. PASSWORD RESET FLOW"
  test_endpoint "Testing request password reset" "curl -s --max-time $TIMEOUT -X POST -H \"Content-Type: application/json\" -d '{\"email\":\"janesmith@example.com\"}' http://localhost:8080/api/auth/reset"
  
  print_header "6. SIGNOUT"
  test_endpoint "Testing signout" "curl -s --max-time $TIMEOUT -X POST -H \"Authorization: Bearer $ACCESS_TOKEN\" http://localhost:8080/api/auth/signout"
else
  echo -e "${RED}No access token available, skipping authenticated tests${NC}"
fi

echo -e "\n${GREEN}===== ALL TESTS COMPLETED =====${NC}"
