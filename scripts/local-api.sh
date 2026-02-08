#!/bin/bash

# Local API request utility for Kontakt.
# Authenticates against the local PostgreSQL database and mints a JWT session
# cookie for testing API endpoints without going through the OIDC browser flow.
#
# Usage:
#   ./scripts/local-api.sh login [admin|user|<email>]   # Get a session (default: user)
#   ./scripts/local-api.sh token                          # Print current session JWT
#   ./scripts/local-api.sh get    <path>                  # GET    /api/<path>
#   ./scripts/local-api.sh post   <path> [json-body]      # POST   /api/<path>
#   ./scripts/local-api.sh put    <path> [json-body]      # PUT    /api/<path>
#   ./scripts/local-api.sh delete <path>                  # DELETE /api/<path>
#   ./scripts/local-api.sh upload <card-id> <type> <file> # Upload image
#
# Examples:
#   ./scripts/local-api.sh login admin
#   ./scripts/local-api.sh get me
#   ./scripts/local-api.sh get me/cards
#   ./scripts/local-api.sh post cards '{"name":"John Doe"}'
#   ./scripts/local-api.sh get cards/slug/john-doe
#   ./scripts/local-api.sh put cards/<id> '{"jobTitle":"Engineer"}'
#   ./scripts/local-api.sh delete cards/<id>
#   ./scripts/local-api.sh upload <card-id> avatar ./photo.jpg

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    source "$PROJECT_ROOT/.env"
    set +a
fi

API_URL="${APP_URL:-http://localhost:4000}"
DATABASE_URL="${DATABASE_URL:-postgresql://kontakt:kontakt@localhost:5432/kontakt?schema=public}"
JWT_SECRET="${JWT_SECRET:-change-me-to-a-random-secret}"
JWT_EXPIRY="${JWT_EXPIRY:-24h}"
SESSION_FILE="$PROJECT_ROOT/.kontakt-session"

usage() {
    echo -e "${CYAN}Kontakt — Local API request utility${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 login [admin|user|<email>]    Get a session (default: user)"
    echo "  $0 token                          Print current session JWT"
    echo "  $0 get    <path>                  GET    /api/<path>"
    echo "  $0 post   <path> [json-body]      POST   /api/<path>"
    echo "  $0 put    <path> [json-body]      PUT    /api/<path>"
    echo "  $0 delete <path>                  DELETE /api/<path>"
    echo "  $0 upload <card-id> <type> <file> Upload image to a card"
    echo ""
    echo "Paths are relative to /api/. Examples:"
    echo "  $0 login admin"
    echo "  $0 get me"
    echo "  $0 get me/cards"
    echo "  $0 post cards '{\"name\":\"John Doe\"}'"
    echo "  $0 get cards/slug/john-doe"
    echo "  $0 upload <card-id> avatar ./photo.jpg"
    echo ""
    echo "Test users (created automatically on first login):"
    echo "  admin  -> admin@kontakt.local (ADMIN)"
    echo "  user   -> user@kontakt.local  (USER)"
    exit 1
}

require_session() {
    if [ ! -f "$SESSION_FILE" ]; then
        echo -e "${RED}No session found.${NC} Run ${BOLD}$0 login${NC} first." >&2
        exit 1
    fi
}

get_token() {
    require_session
    cat "$SESSION_FILE"
}

DB_CONTAINER="${DB_CONTAINER:-kontakt-postgres-1}"
DB_USER="${DB_USER:-kontakt}"
DB_NAME="${DB_NAME:-kontakt}"

# Run a psql query — uses local psql if available, otherwise docker exec
run_psql() {
    local query="$1"
    local flags="${2:--t -A}"

    if command -v psql &>/dev/null; then
        local db_url="${DATABASE_URL%%\?*}"
        psql "$db_url" $flags -c "$query" 2>/dev/null
    else
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" $flags -c "$query" 2>/dev/null
    fi
}

do_login() {
    local who="${1:-user}"
    local email name role

    case "$who" in
        admin)
            email="admin@kontakt.local"
            name="Admin User"
            role="ADMIN"
            ;;
        user)
            email="user@kontakt.local"
            name="Regular User"
            role="USER"
            ;;
        *)
            email="$who"
            name="Dev User"
            role="USER"
            ;;
    esac

    # Query DB for existing user
    local user_row
    user_row=$(run_psql "SELECT id, email, name, role FROM \"User\" WHERE email = '${email}' LIMIT 1" "-t -A -F|") || true

    local user_id user_email user_name user_role

    if [ -n "$user_row" ]; then
        IFS='|' read -r user_id user_email user_name user_role <<< "$user_row"
        echo -e "${DIM}Found user: ${user_email} (${user_role})${NC}" >&2
    else
        # Create test user directly in the database
        user_id=$(run_psql "INSERT INTO \"User\" (id, \"oidcSub\", email, name, role, \"createdAt\", \"updatedAt\")
             VALUES (gen_random_uuid(), 'local-dev-${who}', '${email}', '${name}', '${role}', NOW(), NOW())
             RETURNING id")

        if [ -z "$user_id" ]; then
            echo -e "${RED}Failed to create user. Is PostgreSQL running?${NC}" >&2
            echo -e "${YELLOW}Tried: psql (local) and docker exec ${DB_CONTAINER}${NC}" >&2
            exit 1
        fi

        user_email="$email"
        user_name="$name"
        user_role="$role"
        echo -e "${GREEN}Created test user: ${user_email} (${user_role})${NC}" >&2
    fi

    # Trim whitespace from psql output
    user_id=$(echo "$user_id" | xargs)
    user_email=$(echo "${user_email:-$email}" | xargs)
    user_name=$(echo "${user_name:-$name}" | xargs)
    user_role=$(echo "${user_role:-$role}" | xargs)

    # Mint JWT using jsonwebtoken (transitive dep of @nestjs/jwt)
    local jwt
    jwt=$(node -e "
        const jwt = require('${PROJECT_ROOT}/node_modules/jsonwebtoken');
        const token = jwt.sign(
            { sub: '${user_id}', email: '${user_email}', name: '${user_name}', role: '${user_role}' },
            '${JWT_SECRET}',
            { expiresIn: '${JWT_EXPIRY}' }
        );
        process.stdout.write(token);
    ")

    echo "$jwt" > "$SESSION_FILE"
    echo -e "${GREEN}Logged in as ${user_email} (${user_role})${NC}" >&2
    echo -e "${DIM}Session saved to .kontakt-session${NC}" >&2
}

api_request() {
    local method="$1"
    local path="$2"
    local body="${3:-}"

    local url="${API_URL}/api/${path}"
    local token
    token=$(get_token)

    echo -e "${DIM}${method} ${url}${NC}" >&2

    local curl_args=(-s -w "\n${DIM}HTTP %{http_code}${NC}\n" \
        -X "$method" "$url" \
        -b "kontakt_session=${token}" \
        -H "Content-Type: application/json")

    if [ -n "$body" ]; then
        curl_args+=(-d "$body")
    fi

    curl "${curl_args[@]}"
}

do_upload() {
    local card_id="$1"
    local type="$2"
    local file="$3"

    if [ ! -f "$file" ]; then
        echo -e "${RED}File not found: ${file}${NC}" >&2
        exit 1
    fi

    local url="${API_URL}/api/cards/${card_id}/upload/${type}"
    local token
    token=$(get_token)

    echo -e "${DIM}POST ${url} (file: ${file})${NC}" >&2

    curl -s -w "\n${DIM}HTTP %{http_code}${NC}\n" \
        -X POST "$url" \
        -b "kontakt_session=${token}" \
        -F "file=@${file}"
}

# --- Main ---

if [ $# -lt 1 ]; then
    usage
fi

COMMAND="$1"

case "$COMMAND" in
    login)
        do_login "${2:-user}"
        ;;
    token)
        get_token
        ;;
    get|post|put|delete)
        [ $# -lt 2 ] && usage
        require_session
        METHOD=$(echo "$COMMAND" | tr '[:lower:]' '[:upper:]')
        api_request "$METHOD" "$2" "${3:-}"
        ;;
    upload)
        [ $# -lt 4 ] && usage
        require_session
        do_upload "$2" "$3" "$4"
        ;;
    *)
        usage
        ;;
esac
