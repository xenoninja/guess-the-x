import { afterEach, describe, expect, it, vi } from "vitest";
import { createJsonFootballDataSource } from "./jsonFootballDataSource";

describe("JSON football data source", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads and maps players from the versioned JSON asset", async () => {
    const fetchMock = vi.fn(async () => textResponse(`${JSON.stringify(jsonPlayerRow())}\n`));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("location", new URL("https://guess.example.test/football"));

    const players = await createJsonFootballDataSource().loadPlayers("/data/football-players-2025-v1.jsonl");

    expect(fetchMock).toHaveBeenCalledWith("https://guess.example.test/data/football-players-2025-v1.jsonl", {
      headers: {
        Accept: "application/x-ndjson, text/plain",
      },
    });
    expect(players).toEqual([
      {
        playerId: 10,
        name: "Aitana Bonmati",
        dateOfBirth: "1998-01-18",
        position: "Midfield",
        subPosition: "Central Midfield",
        foot: "right",
        nation: "Spain",
        continent: "Europe",
        heightCm: 162,
        imageUrl: "https://example.test/player.png",
        clubId: "131",
        clubName: "FC Barcelona",
        leagueId: "ES1",
        leagueName: "laliga",
        leagueCountry: "Spain",
        marketValueEur: null,
        highestMarketValueEur: 750000,
        isAnswerCandidate: true,
        snapshotSeason: 2025,
      },
    ]);
  });

  it("rejects missing data assets", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 404, statusText: "Not Found" })));
    vi.stubGlobal("location", new URL("https://guess.example.test/football"));

    await expect(createJsonFootballDataSource().loadPlayers("/missing.json")).rejects.toThrow(
      "Could not load football data asset: 404 Not Found",
    );
  });

  it("rejects malformed JSON payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => textResponse(JSON.stringify({ playerId: 10 }))));
    vi.stubGlobal("location", new URL("https://guess.example.test/football"));

    await expect(createJsonFootballDataSource().loadPlayers("/data.json")).rejects.toThrow(
      "Football data asset rows must be 19-column JSON arrays.",
    );
  });
});

function textResponse(payload: string) {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    async text() {
      return payload;
    },
  };
}

function jsonPlayerRow() {
  return [
    10,
    "Aitana Bonmati",
    "1998-01-18",
    "Midfield",
    "Central Midfield",
    "right",
    "Spain",
    "Europe",
    162,
    "https://example.test/player.png",
    "131",
    "FC Barcelona",
    "ES1",
    "laliga",
    "Spain",
    null,
    750000,
    true,
    2025,
  ];
}
