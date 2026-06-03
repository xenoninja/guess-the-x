#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
SOURCE_DB="$SCRIPT_DIR/../football.duckdb"
OUTPUT_DIR="$REPO_ROOT/public/data"
DATA_VERSION="v1"

if ! command -v duckdb >/dev/null 2>&1; then
    echo "Error: duckdb CLI is not installed or not available on PATH." >&2
    exit 1
fi

if [ ! -f "$SOURCE_DB" ]; then
    echo "Error: missing runtime database: $SOURCE_DB" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR"

SNAPSHOT_SEASON=$(duckdb -readonly -csv -noheader "$SOURCE_DB" \
    -c "SELECT max(snapshot_season) FROM players;")
OUTPUT_FILE="$OUTPUT_DIR/football-players-$SNAPSHOT_SEASON-$DATA_VERSION.parquet"

duckdb -readonly "$SOURCE_DB" -c "
    COPY players
    TO '$OUTPUT_FILE'
    (FORMAT parquet, COMPRESSION zstd);
"

echo "Exported $OUTPUT_FILE"
