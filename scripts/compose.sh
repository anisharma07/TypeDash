# Type Dash - shared setup for start.sh, status.sh and stop.sh (sourced, not run directly)
#
# Moves to the repo root so Compose finds docker-compose.yml from any directory, and sets
# COMPOSE to the available command: the Compose v2 plugin (`docker compose`), or the
# legacy standalone v1 binary (`docker-compose`) on older installs.

cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

if docker compose version >/dev/null 2>&1; then
    COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE="docker-compose"
else
    echo "❌ Docker Compose not found. Install Docker with the Compose plugin: https://docs.docker.com/compose/install/"
    exit 1
fi
