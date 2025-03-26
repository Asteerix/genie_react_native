#!/bin/bash

# Set timeout for curl commands
TIMEOUT=10

echo "===== TESTING BACKEND API ENDPOINTS ====="

echo -e "\n1. Testing health endpoint..."
curl -s --max-time $TIMEOUT http://localhost:8080/health
echo -e "\n"

echo "2. Testing auth/check endpoint with correct parameter..."
curl -s --max-time $TIMEOUT -X POST -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"janesmith@example.com"}' \
  http://localhost:8080/api/auth/check
echo -e "\n"

echo "3. Testing user signin..."
SIGNIN_RESPONSE=$(curl -s --max-time $TIMEOUT -X POST -H "Content-Type: application/json" \
  -d '{"emailOrPhone":"janesmith@example.com","password":"StrongPass123"}' \
  http://localhost:8080/api/auth/signin)
echo "$SIGNIN_RESPONSE"
echo -e "\n"

# Extract the access token from the signin response
ACCESS_TOKEN=$(echo "$SIGNIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ACCESS_TOKEN" ]; then
  echo "4. Testing managed accounts list (authenticated)..."
  curl -s --max-time $TIMEOUT -H "Authorization: Bearer $ACCESS_TOKEN" \
    http://localhost:8080/api/managed-accounts
  echo -e "\n"

  echo "5. Testing create managed account..."
  MANAGED_ACCOUNT_RESPONSE=$(curl -s --max-time $TIMEOUT -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Child","lastName":"Smith","birthDate":"2020-01-15","gender":"female"}' \
    http://localhost:8080/api/managed-accounts)
  echo "$MANAGED_ACCOUNT_RESPONSE"
  echo -e "\n"

  # Extract the managed account ID
  MANAGED_ACCOUNT_ID=$(echo "$MANAGED_ACCOUNT_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

  if [ -n "$MANAGED_ACCOUNT_ID" ]; then
    echo "6. Testing get specific managed account..."
    curl -s --max-time $TIMEOUT -H "Authorization: Bearer $ACCESS_TOKEN" \
      http://localhost:8080/api/managed-accounts/$MANAGED_ACCOUNT_ID
    echo -e "\n"

    echo "7. Testing update managed account..."
    curl -s --max-time $TIMEOUT -X PUT \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"firstName":"Updated","lastName":"Child","birthDate":"2020-01-15","gender":"female"}' \
      http://localhost:8080/api/managed-accounts/$MANAGED_ACCOUNT_ID
    echo -e "\n"
  else
    echo "No managed account ID available, skipping related tests"
  fi

  echo "8. Testing update profile..."
  curl -s --max-time $TIMEOUT -X PUT \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"firstName":"Jane","lastName":"Smith-Updated"}' \
    http://localhost:8080/api/auth/profile
  echo -e "\n"
else
  echo "No access token available, skipping authenticated tests"
fi

echo "===== ALL TESTS COMPLETED ====="
