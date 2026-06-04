import { describe, expect, it } from "vitest";
import { formatDuckDbDate } from "./duckdbFootballDataSource";
import { EXPECTED_FOOTBALL_DATA_SUMMARY, FOOTBALL_DATA_ASSET_PATH, loadFootballData } from "./footballData";

describe("football data loading", () => {
  it("builds Guessable Player and Answer Candidate lists from the versioned asset", async () => {
    const loadedPaths: string[] = [];
    const data = await loadFootballData({
      async loadPlayers(assetPath) {
        loadedPaths.push(assetPath);
        return [
          player({ playerId: 10, name: "Aitana Bonmati", isAnswerCandidate: true }),
          player({ playerId: 20, name: "Ada Hegerberg", isAnswerCandidate: false }),
          player({ playerId: 30, name: "Sam Kerr", isAnswerCandidate: true }),
        ];
      },
    });

    expect(loadedPaths).toEqual([FOOTBALL_DATA_ASSET_PATH]);
    expect(data.guessablePlayers).toHaveLength(3);
    expect(data.answerCandidates.map((candidate) => candidate.playerId)).toEqual([10, 30]);
    expect(data.summary).toEqual({
      guessablePlayerCount: 3,
      answerCandidateCount: 2,
    });
  });

  it("rejects football data when the expected dataset counts do not match", async () => {
    await expect(
      loadFootballData(
        {
          async loadPlayers() {
            return [player({ playerId: 10, name: "Aitana Bonmati", isAnswerCandidate: true })];
          },
        },
        { expectedSummary: EXPECTED_FOOTBALL_DATA_SUMMARY },
      ),
    ).rejects.toThrow("Expected 12,899 Guessable Players and 732 Answer Candidates");
  });

  it("formats DuckDB Date values from Arrow epoch milliseconds", () => {
    expect(formatDuckDbDate(Date.UTC(1987, 5, 24))).toBe("1987-06-24");
    expect(formatDuckDbDate({ valueOf: () => Date.UTC(2001, 8, 5) })).toBe("2001-09-05");
  });
});

function player(overrides: { playerId: number; name: string; isAnswerCandidate: boolean }) {
  return {
    playerId: overrides.playerId,
    name: overrides.name,
    dateOfBirth: "1998-01-01",
    position: "Attack",
    subPosition: "Centre-Forward",
    foot: "right",
    nation: "Norway",
    continent: "Europe",
    heightCm: 176,
    imageUrl: "https://example.test/player.png",
    clubId: "1",
    clubName: "Example FC",
    leagueId: "GB1",
    leagueName: "premier-league",
    leagueCountry: "England",
    marketValueEur: null,
    highestMarketValueEur: null,
    isAnswerCandidate: overrides.isAnswerCandidate,
    snapshotSeason: 2025,
  };
}
