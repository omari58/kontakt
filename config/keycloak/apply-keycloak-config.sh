#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve the Docker network that keycloak is running on
NETWORK=$(docker inspect kontakt-keycloak -f '{{range $net, $_ := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null)

if [ -z "$NETWORK" ]; then
  echo "Error: keycloak container not running. Run 'pnpm infra:up' first."
  exit 1
fi

# Inside the Docker network, reach keycloak by service name on its internal port
INTERNAL_URL="http://kontakt-keycloak:8080/"

echo "Importing Kontakt Keycloak configuration..."
echo "Keycloak network: ${NETWORK}"

docker run --rm --network "${NETWORK}" \
  -v "${SCRIPT_DIR}:/config:ro" \
  -e KEYCLOAK_URL="${INTERNAL_URL}" \
  -e KEYCLOAK_REALM="master" \
  -e KEYCLOAK_USER="admin" \
  -e KEYCLOAK_PASSWORD="admin" \
  -e KEYCLOAK_CLIENTID="admin-cli" \
  -e IMPORT_FILES_LOCATIONS="/config/kontakt-realm.json,/config/kontakt-clients.json" \
  -e IMPORT_REMOTESTATE_ENABLED=true \
  adorsys/keycloak-config-cli:latest

KEYCLOAK_PORT="${KEYCLOAK_PORT:-4080}"

echo ""
echo "Kontakt Keycloak configuration applied successfully."
echo ""
echo "Keycloak admin console: http://localhost:${KEYCLOAK_PORT}/admin"
echo "  Admin login: admin / admin"
echo ""
echo "Test users (realm: kontakt):"
echo "  Admin:   admin@kontakt.local / admin   (has kontakt-admin role)"
echo "  Regular: user@kontakt.local  / user"
echo ""
echo "OIDC Issuer: http://localhost:${KEYCLOAK_PORT}/realms/kontakt"
