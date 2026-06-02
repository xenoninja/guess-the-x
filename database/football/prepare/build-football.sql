ATTACH 'database/football/prepare/transfermarkt-datasets.duckdb' AS source (READ_ONLY);

CREATE OR REPLACE TEMP TABLE geographic_continents (
    country_name VARCHAR PRIMARY KEY,
    continent VARCHAR NOT NULL
);

INSERT INTO geographic_continents VALUES
    ('Albania', 'Europe'),
    ('Algeria', 'Africa'),
    ('Andorra', 'Europe'),
    ('Argentina', 'South America'),
    ('Armenia', 'Asia'),
    ('Australia', 'Oceania'),
    ('Austria', 'Europe'),
    ('Azerbaijan', 'Asia'),
    ('Bangladesh', 'Asia'),
    ('Belarus', 'Europe'),
    ('Belgium', 'Europe'),
    ('Bolivia', 'South America'),
    ('Bosnia-Herzegovina', 'Europe'),
    ('Brazil', 'South America'),
    ('Bulgaria', 'Europe'),
    ('Cambodia', 'Asia'),
    ('Canada', 'North America'),
    ('Chile', 'South America'),
    ('China', 'Asia'),
    ('Chinese Taipei', 'Asia'),
    ('Colombia', 'South America'),
    ('Comoros', 'Africa'),
    ('Costa Rica', 'North America'),
    ('Croatia', 'Europe'),
    ('Cyprus', 'Asia'),
    ('Czech Republic', 'Europe'),
    ('Denmark', 'Europe'),
    ('Dominican Republic', 'North America'),
    ('Ecuador', 'South America'),
    ('Egypt', 'Africa'),
    ('El Salvador', 'North America'),
    ('England', 'Europe'),
    ('Estonia', 'Europe'),
    ('Ethiopia', 'Africa'),
    ('Faroe Islands', 'Europe'),
    ('Fiji', 'Oceania'),
    ('Finland', 'Europe'),
    ('France', 'Europe'),
    ('Georgia', 'Asia'),
    ('Germany', 'Europe'),
    ('Ghana', 'Africa'),
    ('Gibraltar', 'Europe'),
    ('Greece', 'Europe'),
    ('Guatemala', 'North America'),
    ('Honduras', 'North America'),
    ('Hongkong', 'Asia'),
    ('Hungary', 'Europe'),
    ('Iceland', 'Europe'),
    ('India', 'Asia'),
    ('Indonesia', 'Asia'),
    ('Iran', 'Asia'),
    ('Iraq', 'Asia'),
    ('Ireland', 'Europe'),
    ('Israel', 'Asia'),
    ('Italy', 'Europe'),
    ('Jamaica', 'North America'),
    ('Japan', 'Asia'),
    ('Jordan', 'Asia'),
    ('Kazakhstan', 'Asia'),
    ('Korea, South', 'Asia'),
    ('Kosovo', 'Europe'),
    ('Kyrgyzstan', 'Asia'),
    ('Laos', 'Asia'),
    ('Latvia', 'Europe'),
    ('Lebanon', 'Asia'),
    ('Libya', 'Africa'),
    ('Lithuania', 'Europe'),
    ('Luxembourg', 'Europe'),
    ('Malaysia', 'Asia'),
    ('Malta', 'Europe'),
    ('Mexico', 'North America'),
    ('Moldova', 'Europe'),
    ('Montenegro', 'Europe'),
    ('Morocco', 'Africa'),
    ('Myanmar', 'Asia'),
    ('Netherlands', 'Europe'),
    ('New Zealand', 'Oceania'),
    ('Nicaragua', 'North America'),
    ('Nigeria', 'Africa'),
    ('North Macedonia', 'Europe'),
    ('Northern Ireland', 'Europe'),
    ('Norway', 'Europe'),
    ('Oman', 'Asia'),
    ('Panama', 'North America'),
    ('Paraguay', 'South America'),
    ('Peru', 'South America'),
    ('Philippines', 'Asia'),
    ('Poland', 'Europe'),
    ('Portugal', 'Europe'),
    ('Puerto Rico', 'North America'),
    ('Qatar', 'Asia'),
    ('Romania', 'Europe'),
    ('Russia', 'Europe'),
    ('San Marino', 'Europe'),
    ('Saudi Arabia', 'Asia'),
    ('Scotland', 'Europe'),
    ('Senegal', 'Africa'),
    ('Serbia', 'Europe'),
    ('Singapore', 'Asia'),
    ('Slovakia', 'Europe'),
    ('Slovenia', 'Europe'),
    ('South Africa', 'Africa'),
    ('Spain', 'Europe'),
    ('Sweden', 'Europe'),
    ('Switzerland', 'Europe'),
    ('Tajikistan', 'Asia'),
    ('Thailand', 'Asia'),
    ('Tunisia', 'Africa'),
    ('Türkiye', 'Asia'),
    ('Uganda', 'Africa'),
    ('Ukraine', 'Europe'),
    ('United Arab Emirates', 'Asia'),
    ('United States', 'North America'),
    ('Uruguay', 'South America'),
    ('Uzbekistan', 'Asia'),
    ('Venezuela', 'South America'),
    ('Vietnam', 'Asia'),
    ('Wales', 'Europe');

DROP TABLE IF EXISTS players;

CREATE TABLE players (
    player_id INTEGER PRIMARY KEY,
    name VARCHAR NOT NULL,
    date_of_birth DATE NOT NULL,
    position VARCHAR NOT NULL,
    sub_position VARCHAR NOT NULL,
    foot VARCHAR NOT NULL,
    nation VARCHAR NOT NULL,
    continent VARCHAR NOT NULL,
    height_cm SMALLINT NOT NULL,
    image_url VARCHAR NOT NULL,
    club_id VARCHAR NOT NULL,
    club_name VARCHAR NOT NULL,
    league_id VARCHAR NOT NULL,
    league_name VARCHAR NOT NULL,
    league_country VARCHAR NOT NULL,
    market_value_eur INTEGER,
    highest_market_value_eur INTEGER,
    snapshot_season SMALLINT NOT NULL
);

INSERT INTO players
SELECT
    p.player_id,
    trim(p.name),
    cast(p.date_of_birth AS DATE),
    p.position,
    p.sub_position,
    p.foot,
    trim(p.country_of_citizenship),
    gc.continent,
    cast(p.height_in_cm AS SMALLINT),
    p.image_url,
    p.current_club_id,
    trim(p.current_club_name),
    p.current_club_domestic_competition_id,
    c.name,
    c.country_name,
    p.market_value_in_eur,
    p.highest_market_value_in_eur,
    cast(p.last_season AS SMALLINT)
FROM source.players p
JOIN source.countries n ON p.country_of_citizenship = n.country_name
JOIN geographic_continents gc ON n.country_name = gc.country_name
JOIN source.competitions c
  ON p.current_club_domestic_competition_id = c.competition_id
WHERE try_cast(p.last_season AS SMALLINT) = (
    SELECT max(try_cast(last_season AS SMALLINT))
    FROM source.players
)
  AND p.name IS NOT NULL
  AND trim(p.name) <> ''
  AND p.date_of_birth IS NOT NULL
  AND p.position IS NOT NULL
  AND p.position <> 'Missing'
  AND p.sub_position IS NOT NULL
  AND p.foot IS NOT NULL
  AND trim(p.foot) <> ''
  AND p.country_of_citizenship IS NOT NULL
  AND trim(p.country_of_citizenship) <> ''
  AND p.height_in_cm BETWEEN 140 AND 215
  AND p.image_url IS NOT NULL
  AND trim(p.image_url) <> ''
  AND p.image_url <> 'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1'
  AND p.current_club_id IS NOT NULL
  AND trim(p.current_club_id) <> ''
  AND p.current_club_name IS NOT NULL
  AND trim(p.current_club_name) <> ''
  AND p.current_club_domestic_competition_id IS NOT NULL
  AND trim(p.current_club_domestic_competition_id) <> '';

CHECKPOINT;
