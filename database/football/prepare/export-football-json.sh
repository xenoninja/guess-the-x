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
OUTPUT_FILE="$OUTPUT_DIR/football-players-$SNAPSHOT_SEASON-$DATA_VERSION.jsonl"

duckdb -readonly "$SOURCE_DB" -c "
    COPY (
        SELECT
            json_array(
            player_id,
            name,
            CAST(date_of_birth AS VARCHAR),
            position,
            sub_position,
            foot,
            nation,
            continent,
            height_cm,
            image_url,
            club_id,
            club_name,
            league_id,
            league_name,
            league_country,
            market_value_eur,
            highest_market_value_eur,
            is_answer_candidate,
            snapshot_season
            ) AS player
        FROM players
        ORDER BY player_id
    )
    TO '$OUTPUT_FILE'
    (FORMAT csv, HEADER false, QUOTE '', ESCAPE '');
"

echo "Exported $OUTPUT_FILE"
