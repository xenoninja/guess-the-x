import * as duckdb from "@duckdb/duckdb-wasm";
import duckdbWasmEh from "@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url";
import duckdbWorkerEh from "@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url";
import duckdbWasmMvp from "@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url";
import duckdbWorkerMvp from "@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url";
import type { FootballPlayer, FootballPlayerDataSource } from "./footballData";

const DUCKDB_FOOTBALL_FILE = "football-players-2025-v1.parquet";

export function createDuckDbFootballDataSource(): FootballPlayerDataSource {
  return {
    async loadPlayers(assetPath) {
      const db = await createDuckDb();
      const connection = await db.connect();

      try {
        await db.registerFileURL(DUCKDB_FOOTBALL_FILE, assetPath, duckdb.DuckDBDataProtocol.HTTP, false);
        const table = await connection.query(`
          SELECT
            player_id,
            name,
            date_of_birth,
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
          FROM read_parquet('${DUCKDB_FOOTBALL_FILE}')
          ORDER BY player_id
        `);

        return table.toArray().map(mapFootballPlayerRow);
      } finally {
        await connection.close();
        await db.terminate();
      }
    },
  };
}

async function createDuckDb(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle({
    mvp: {
      mainModule: duckdbWasmMvp,
      mainWorker: duckdbWorkerMvp,
    },
    eh: {
      mainModule: duckdbWasmEh,
      mainWorker: duckdbWorkerEh,
    },
  });
  if (!bundle.mainWorker) {
    throw new Error("DuckDB-Wasm selected bundle is missing a worker URL.");
  }

  const worker = new Worker(bundle.mainWorker);
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

  return db;
}

function mapFootballPlayerRow(row: Record<string, unknown>): FootballPlayer {
  return {
    playerId: Number(row.player_id),
    name: String(row.name),
    dateOfBirth: formatDuckDbDate(row.date_of_birth),
    position: String(row.position),
    subPosition: String(row.sub_position),
    foot: String(row.foot),
    nation: String(row.nation),
    continent: String(row.continent),
    heightCm: Number(row.height_cm),
    imageUrl: String(row.image_url),
    clubId: String(row.club_id),
    clubName: String(row.club_name),
    leagueId: String(row.league_id),
    leagueName: String(row.league_name),
    leagueCountry: String(row.league_country),
    marketValueEur: nullableNumber(row.market_value_eur),
    highestMarketValueEur: nullableNumber(row.highest_market_value_eur),
    isAnswerCandidate: Boolean(row.is_answer_candidate),
    snapshotSeason: Number(row.snapshot_season),
  };
}

export function formatDuckDbDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    return new Date(value).toISOString().slice(0, 10);
  }

  if (typeof value === "object" && value !== null && "valueOf" in value) {
    const primitiveValue = value.valueOf();

    if (typeof primitiveValue === "number") {
      return new Date(primitiveValue).toISOString().slice(0, 10);
    }
  }

  return String(value);
}

function nullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}
