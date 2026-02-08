#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KEYCLOAK_URL="${KEYCLOAK_URL:-https://auth.localhost.dev/}"

echo "Importing Kontakt Keycloak configuration..."
echo "Keycloak URL: ${KEYCLOAK_URL}"

docker run --rm --network host \
  -v "${SCRIPT_DIR}:/config:ro" \
  -e KEYCLOAK_URL="${KEYCLOAK_URL}" \
  -e KEYCLOAK_REALM="master" \
  -e KEYCLOAK_USER="admin" \
  -e KEYCLOAK_PASSWORD="admin" \
  -e KEYCLOAK_CLIENTID="admin-cli" \
  -e IMPORT_FILES_LOCATIONS="/config/kontakt-realm.json,/config/kontakt-clients.json" \
  -e IMPORT_REMOTESTATE_ENABLED=true \
  -e KEYCLOAK_SSLVERIFY="false" \
  adorsys/keycloak-config-cli:latest

echo ""
echo "Kontakt Keycloak configuration applied successfully."
echo ""
echo "Keycloak admin console: ${KEYCLOAK_URL}admin"
echo "  Admin login: admin / admin"
echo ""
echo "Test users (realm: kontakt):"
echo "  Admin:   admin@kontakt.local / admin   (has kontakt-admin role)"
echo "  Regular: user@kontakt.local  / user"
echo ""
echo "OIDC Issuer: ${KEYCLOAK_URL}realms/kontakt"
