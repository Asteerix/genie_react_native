#!/bin/bash

# Script pour tester les endpoints de l'API backend
# Ce script teste les fonctionnalités principales du backend avec curl

# Configuration
API_URL="http://localhost:8080"
EMAIL="test@example.com"
PASSWORD="Test123!"
FIRST_NAME="Test"
LAST_NAME="User"
BIRTH_DATE="1990-01-01"
GENDER="male"

# Variables pour stocker les tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""

# Fonction pour afficher les résultats des requêtes
print_result() {
  echo "-----------------------------------"
  echo "Endpoint: $1"
  echo "Status: $2"
  echo "Response:"
  echo "$3"
  echo "-----------------------------------"
  echo ""
}

# Test du Health Check
echo "Test du Health Check"
response=$(curl -s -w "%{http_code}" -X GET "$API_URL/health")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "GET /health" "$status" "$body"

# Génération d'un email unique pour éviter les conflits
TIMESTAMP=$(date +%s)
UNIQUE_EMAIL="test-${TIMESTAMP}@example.com"
echo "Utilisation de l'email unique: $UNIQUE_EMAIL"

# Test d'inscription (signup)
echo "Test d'inscription (signup)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$UNIQUE_EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"$FIRST_NAME\",
    \"lastName\": \"$LAST_NAME\",
    \"birthDate\": \"$BIRTH_DATE\",
    \"gender\": \"$GENDER\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/auth/signup" "$status" "$body"

# Test de vérification de l'utilisateur
echo "Test de vérification de l'utilisateur (check)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/check" \
  -H "Content-Type: application/json" \
  -d "{
    \"emailOrPhone\": \"$UNIQUE_EMAIL\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/auth/check" "$status" "$body"

# Test de connexion (signin)
echo "Test de connexion (signin)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{
    \"emailOrPhone\": \"$UNIQUE_EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/auth/signin" "$status" "$body"

# Extraire les tokens de la réponse
if [ "$status" = "200" ]; then
  ACCESS_TOKEN=$(echo "$body" | grep -o '"accessToken":"[^"]*' | sed 's/"accessToken":"//')
  REFRESH_TOKEN=$(echo "$body" | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')
  USER_ID=$(echo "$body" | grep -o '"userId":"[^"]*' | sed 's/"userId":"//')
  
  echo "Access Token: ${ACCESS_TOKEN:0:15}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:15}..."
  echo "User ID: $USER_ID"
  echo ""
else
  echo "Connexion échouée, impossible de continuer les tests qui nécessitent une authentification"
  exit 1
fi

# Test de rafraîchissement du token
echo "Test de rafraîchissement du token (refresh)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/auth/refresh" "$status" "$body"

# Test de mise à jour du profil
echo "Test de mise à jour du profil (update profile)"
response=$(curl -s -w "%{http_code}" -X PUT "$API_URL/api/auth/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"firstName\": \"Updated\",
    \"lastName\": \"$LAST_NAME\",
    \"birthDate\": \"$BIRTH_DATE\",
    \"gender\": \"$GENDER\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "PUT /api/auth/profile" "$status" "$body"

# Test de récupération des comptes gérés
echo "Test de récupération des comptes gérés (get managed accounts)"
response=$(curl -s -w "%{http_code}" -X GET "$API_URL/api/managed-accounts" \
  -H "Authorization: Bearer $ACCESS_TOKEN")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "GET /api/managed-accounts" "$status" "$body"

# Test de création d'un compte géré
echo "Test de création d'un compte géré (create managed account)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/managed-accounts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"firstName\": \"Child\",
    \"lastName\": \"Test\",
    \"birthDate\": \"2015-05-15\",
    \"gender\": \"female\",
    \"managedBy\": \"$USER_ID\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/managed-accounts" "$status" "$body"

# Extraire l'ID du compte géré créé
MANAGED_ACCOUNT_ID=""
if [ "$status" = "200" ] || [ "$status" = "201" ]; then
  MANAGED_ACCOUNT_ID=$(echo "$body" | grep -o '"id":"[^"]*' | sed 's/"id":"//')
  echo "Managed Account ID: $MANAGED_ACCOUNT_ID"
  echo ""
  
  # Test de récupération d'un compte géré spécifique
  if [ ! -z "$MANAGED_ACCOUNT_ID" ]; then
    echo "Test de récupération d'un compte géré spécifique (get managed account)"
    response=$(curl -s -w "%{http_code}" -X GET "$API_URL/api/managed-accounts/$MANAGED_ACCOUNT_ID" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    status=${response: -3}
    body=${response:0:${#response}-3}
    print_result "GET /api/managed-accounts/$MANAGED_ACCOUNT_ID" "$status" "$body"
    
    # Test de mise à jour d'un compte géré
    echo "Test de mise à jour d'un compte géré (update managed account)"
    response=$(curl -s -w "%{http_code}" -X PUT "$API_URL/api/managed-accounts/$MANAGED_ACCOUNT_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -d "{
        \"firstName\": \"UpdatedChild\",
        \"lastName\": \"Test\",
        \"birthDate\": \"2015-05-15\",
        \"gender\": \"female\"
      }")
    status=${response: -3}
    body=${response:0:${#response}-3}
    print_result "PUT /api/managed-accounts/$MANAGED_ACCOUNT_ID" "$status" "$body"
    
    # Test de suppression d'un compte géré
    echo "Test de suppression d'un compte géré (delete managed account)"
    response=$(curl -s -w "%{http_code}" -X DELETE "$API_URL/api/managed-accounts/$MANAGED_ACCOUNT_ID" \
      -H "Authorization: Bearer $ACCESS_TOKEN")
    status=${response: -3}
    body=${response:0:${#response}-3}
    print_result "DELETE /api/managed-accounts/$MANAGED_ACCOUNT_ID" "$status" "$body"
  fi
fi

# Test de déconnexion
echo "Test de déconnexion (signout)"
response=$(curl -s -w "%{http_code}" -X POST "$API_URL/api/auth/signout" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")
status=${response: -3}
body=${response:0:${#response}-3}
print_result "POST /api/auth/signout" "$status" "$body"

echo "Tests terminés"