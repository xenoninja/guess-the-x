# Compact JSONL football data

Status: Accepted

Guess The Football Player will keep the Cloudflare Pages static-site architecture, but the runtime football asset is now a compact versioned JSONL file loaded with `fetch` instead of a Parquet file queried through DuckDB-Wasm.

The deployed Parquet asset is small, but the browser still had to load and instantiate DuckDB-Wasm from jsDelivr before the game could render. That added a large third-party WASM dependency to the critical path for a dataset that is already fully materialized during build time.

The browser now downloads `/data/football-players-2025-v1.jsonl`, where each line is a 19-column JSON array ordered by `player_id`. The app maps those arrays into the existing `FootballPlayer` domain type. The asset is versioned and Cloudflare Pages serves `/data/*` with long-lived immutable caching.

D1 is not a strong fit for the current game because the browser needs the full Guessable Player list for autocomplete and local clue comparison. Moving only storage to D1 would replace one static download with many API queries or a server endpoint that still serializes the same data. R2 may become useful later if data or media assets grow beyond comfortable Git and Pages limits, but it is not required for this performance fix.
