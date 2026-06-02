#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../.." && pwd)
SOURCE_DB="$SCRIPT_DIR/transfermarkt-datasets.duckdb"
OUTPUT_DB="$SCRIPT_DIR/../football.duckdb"
SQL_FILE="$SCRIPT_DIR/build-football.sql"
TEMP_DIR=$(mktemp -d "$SCRIPT_DIR/.build-football.XXXXXX")
TEMP_DB="$TEMP_DIR/football.duckdb"

cleanup() {
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT INT TERM

if ! command -v duckdb >/dev/null 2>&1; then
    echo "Error: duckdb CLI is not installed or not available on PATH." >&2
    exit 1
fi

if [ ! -f "$SOURCE_DB" ]; then
    echo "Error: missing source database: $SOURCE_DB" >&2
    exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: missing build SQL: $SQL_FILE" >&2
    exit 1
fi

cd "$REPO_ROOT"

duckdb "$TEMP_DB" < "$SQL_FILE"

PLAYER_COUNT=$(duckdb -readonly -csv -noheader "$TEMP_DB" \
    -c "SELECT count(*) FROM players;")
INVALID_COUNT=$(duckdb -readonly -csv -noheader "$TEMP_DB" -c "
    SELECT count(*)
    FROM players
    WHERE name IS NULL OR trim(name) = ''
       OR date_of_birth IS NULL
       OR position IS NULL OR position = 'Missing'
       OR sub_position IS NULL OR trim(sub_position) = ''
       OR foot IS NULL OR trim(foot) = ''
       OR nation IS NULL OR trim(nation) = ''
       OR continent IS NULL OR trim(continent) = ''
       OR height_cm NOT BETWEEN 140 AND 215
       OR image_url IS NULL OR trim(image_url) = ''
       OR image_url = 'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1'
       OR club_id IS NULL OR trim(club_id) = ''
       OR club_name IS NULL OR trim(club_name) = ''
       OR league_id IS NULL OR trim(league_id) = ''
       OR league_name IS NULL OR trim(league_name) = ''
       OR league_country IS NULL OR trim(league_country) = '';
")

if [ "$PLAYER_COUNT" -eq 0 ]; then
    echo "Error: build produced no players." >&2
    exit 1
fi

if [ "$INVALID_COUNT" -ne 0 ]; then
    echo "Error: build produced $INVALID_COUNT invalid player rows." >&2
    exit 1
fi

mv "$TEMP_DB" "$OUTPUT_DB"

echo "Built $OUTPUT_DB with $PLAYER_COUNT clean players."
