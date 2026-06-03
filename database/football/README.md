# Football Database Reference

`football.duckdb` is the compact runtime database for the guess-the-football-player
app. It is generated from the latest season in the Transfermarkt snapshot and
contains only players with complete clue data.

## Rebuild

Run from the repository root:

```bash
./database/football/prepare/build-football.sh
./database/football/prepare/export-football-parquet.sh
```

The script reads `database/football/prepare/transfermarkt-datasets.duckdb`,
builds and validates a temporary database, then replaces
`database/football/football.duckdb` only
after validation passes. The export script writes the versioned browser data
asset to `public/data/football-players-2025-v1.parquet`. The filtering and
transformation logic lives in `database/football/prepare/build-football.sql`.

## Runtime Table

The runtime database contains one denormalized table:

```text
players
```

Current snapshot summary:

| Metric | Value |
| --- | ---: |
| Players | 12,899 |
| Leagues | 32 |
| Nations | 103 |
| Answer candidates | 732 |
| Snapshot season | 2025 |

## Player Attributes

| Name | Type | Meaning | Example value |
| --- | --- | --- | --- |
| `player_id` | `INTEGER` | Transfermarkt player ID and primary key. | `418560` |
| `name` | `VARCHAR` | Display name, trimmed during generation. | `Erling Haaland` |
| `date_of_birth` | `DATE` | Birth date. Calculate age dynamically when starting a game. | `2000-07-21` |
| `position` | `VARCHAR` | Broad playing position. | `Attack` |
| `sub_position` | `VARCHAR` | Detailed playing position. | `Centre-Forward` |
| `foot` | `VARCHAR` | Preferred foot: `left`, `right`, or `both`. | `left` |
| `nation` | `VARCHAR` | Country of citizenship. | `Norway` |
| `continent` | `VARCHAR` | Geographic continent derived from the curated country mapping. | `Europe` |
| `height_cm` | `SMALLINT` | Height in centimeters. Only values from `140` to `215` are retained. | `195` |
| `image_url` | `VARCHAR` | Transfermarkt portrait URL. Default placeholder portraits are excluded. | `https://img.a.transfermarkt.technology/portrait/header/418560-1709108116.png?lm=1` |
| `club_id` | `VARCHAR` | Transfermarkt ID of the player's current club. | `281` |
| `club_name` | `VARCHAR` | Current club display name. | `Manchester City Football Club` |
| `league_id` | `VARCHAR` | Transfermarkt competition ID for the current domestic league. | `GB1` |
| `league_name` | `VARCHAR` | Current domestic league name from the source `competitions` table. | `premier-league` |
| `league_country` | `VARCHAR` | Country where the current domestic league is played. | `England` |
| `market_value_eur` | `INTEGER NULL` | Current estimated market value in euros. Useful for difficulty ranking. | `200000000` |
| `highest_market_value_eur` | `INTEGER NULL` | Highest recorded estimated market value in euros. Useful as a recognizability signal. | `200000000` |
| `is_answer_candidate` | `BOOLEAN` | Whether the player is eligible to be the mystery answer in the first game version. | `true` |
| `snapshot_season` | `SMALLINT` | Latest source season selected automatically during generation. | `2025` |

All attributes except the two market-value columns are non-null.

## Answer Candidates

The first game version chooses mystery answers from players marked
`is_answer_candidate = true`. A player is an answer candidate when they play in
one of the Big Five European Leagues and have a highest recorded market value of
at least EUR 25,000,000.

The Big Five European League competition IDs are:

| League | Competition ID |
| --- | --- |
| Premier League | `GB1` |
| LaLiga | `ES1` |
| Serie A | `IT1` |
| Bundesliga | `L1` |
| Ligue 1 | `FR1` |

## Geographic Continents

The `continent` attribute uses location rather than football confederation:

```text
Africa
Asia
Europe
North America
Oceania
South America
```

For example, Australia and New Zealand are in `Oceania`. The curated mapping
covers all countries currently present in the source database.

## Player Filtering

A player is retained only when the latest source-season row has:

- A non-empty name and birth date
- A known broad position, detailed position, and preferred foot
- A citizenship country with a geographic continent mapping
- A height from `140` to `215` centimeters
- A real portrait rather than Transfermarkt's default placeholder
- A current club
- A current domestic league with a matching competition row

## Example Query

```sql
SELECT
    player_id,
    name,
    date_diff('year', date_of_birth, current_date) AS approximate_age,
    position,
    nation,
    continent,
    club_name,
    league_name
FROM players
ORDER BY highest_market_value_eur DESC NULLS LAST
LIMIT 20;
```
