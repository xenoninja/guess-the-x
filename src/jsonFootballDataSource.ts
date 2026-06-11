import type { FootballPlayer, FootballPlayerDataSource } from "./footballData";

export function createJsonFootballDataSource(): FootballPlayerDataSource {
  return {
    async loadPlayers(assetPath) {
      const response = await fetch(resolveAssetUrl(assetPath), {
        headers: {
          Accept: "application/x-ndjson, text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`Could not load football data asset: ${response.status} ${response.statusText}`);
      }

      const payload = await response.text();
      const rows = payload
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line) as unknown);

      return rows.map((row) => mapJsonFootballPlayer(asJsonFootballPlayerRow(row)));
    },
  };
}

function resolveAssetUrl(assetPath: string): string {
  return new URL(assetPath, globalThis.location.href).toString();
}

function mapJsonFootballPlayer(row: FootballPlayerJsonRow): FootballPlayer {
  return {
    playerId: Number(row[0]),
    name: String(row[1]),
    dateOfBirth: String(row[2]),
    position: String(row[3]),
    subPosition: String(row[4]),
    foot: String(row[5]),
    nation: String(row[6]),
    continent: String(row[7]),
    heightCm: Number(row[8]),
    imageUrl: String(row[9]),
    clubId: String(row[10]),
    clubName: String(row[11]),
    leagueId: String(row[12]),
    leagueName: String(row[13]),
    leagueCountry: String(row[14]),
    marketValueEur: nullableNumber(row[15]),
    highestMarketValueEur: nullableNumber(row[16]),
    isAnswerCandidate: Boolean(row[17]),
    snapshotSeason: Number(row[18]),
  };
}

type FootballPlayerJsonRow = [
  playerId: unknown,
  name: unknown,
  dateOfBirth: unknown,
  position: unknown,
  subPosition: unknown,
  foot: unknown,
  nation: unknown,
  continent: unknown,
  heightCm: unknown,
  imageUrl: unknown,
  clubId: unknown,
  clubName: unknown,
  leagueId: unknown,
  leagueName: unknown,
  leagueCountry: unknown,
  marketValueEur: unknown,
  highestMarketValueEur: unknown,
  isAnswerCandidate: unknown,
  snapshotSeason: unknown,
];

function asJsonFootballPlayerRow(value: unknown): FootballPlayerJsonRow {
  if (!Array.isArray(value) || value.length !== 19) {
    throw new Error("Football data asset rows must be 19-column JSON arrays.");
  }

  return value as FootballPlayerJsonRow;
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}
