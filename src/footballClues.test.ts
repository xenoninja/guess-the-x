import { describe, expect, it } from "vitest";
import { compareFootballGuess, getVisibleFootballClues } from "./footballClues";
import type { FootballPlayer } from "./footballData";

describe("football Clues", () => {
  it("compares visible Clues against the hidden answer with partials and numeric direction", () => {
    const answer = player({
      playerId: 10,
      name: "Erling Haaland",
      dateOfBirth: "2000-07-21",
      nation: "Norway",
      continent: "Europe",
      position: "Attack",
      subPosition: "Centre-Forward",
      foot: "left",
      heightCm: 195,
      clubId: "281",
      clubName: "Manchester City Football Club",
      leagueId: "GB1",
    });
    const guess = player({
      playerId: 20,
      name: "Bukayo Saka",
      dateOfBirth: "2001-09-05",
      nation: "England",
      continent: "Europe",
      position: "Attack",
      subPosition: "Right Winger",
      foot: "left",
      heightCm: 178,
      clubId: "11",
      clubName: "Arsenal Football Club",
      leagueId: "GB1",
    });

    const comparison = compareFootballGuess({
      guess,
      answer,
      puzzleDate: "2026-06-04",
    });

    expect(getVisibleFootballClues()).toEqual(["Player", "Nation", "Position", "Puzzle Age", "Height", "Foot", "Club"]);
    expect(comparison.playerName).toBe("Bukayo Saka");
    expect(comparison.clues).toEqual([
      { label: "Player", value: "Bukayo Saka", match: "miss" },
      { label: "Nation", value: "England", match: "partial" },
      { label: "Position", value: "Attack", match: "exact" },
      { label: "Puzzle Age", value: "24", match: "partial", direction: "higher" },
      { label: "Height", value: "178 cm", match: "partial", direction: "higher" },
      { label: "Foot", value: "left", match: "exact" },
      { label: "Club", value: "Arsenal Football Club", match: "partial" },
    ]);
    expect(JSON.stringify(comparison)).not.toContain("Europe");
    expect(JSON.stringify(comparison)).not.toContain("GB1");
    expect(JSON.stringify(comparison)).not.toContain("Right Winger");
  });

  it("marks Nation and Club misses while exact numeric Clues stay exact", () => {
    const answer = player({
      playerId: 10,
      name: "Erling Haaland",
      dateOfBirth: "2000-07-21",
      nation: "Norway",
      continent: "Europe",
      heightCm: 195,
      clubId: "281",
      clubName: "Manchester City Football Club",
      leagueId: "GB1",
    });
    const guess = player({
      playerId: 30,
      name: "Tall Forward",
      dateOfBirth: "2000-07-21",
      nation: "Brazil",
      continent: "South America",
      heightCm: 195,
      clubId: "999",
      clubName: "Santos Futebol Clube",
      leagueId: "BRA1",
    });

    const comparison = compareFootballGuess({ guess, answer, puzzleDate: "2026-06-04" });

    expect(comparison.clues.find((clue) => clue.label === "Nation")).toMatchObject({ match: "miss" });
    expect(comparison.clues.find((clue) => clue.label === "Club")).toMatchObject({ match: "miss" });
    expect(comparison.clues.find((clue) => clue.label === "Puzzle Age")).toEqual({
      label: "Puzzle Age",
      value: "25",
      match: "exact",
    });
    expect(comparison.clues.find((clue) => clue.label === "Height")).toEqual({
      label: "Height",
      value: "195 cm",
      match: "exact",
    });
  });
});

function player(overrides: Partial<FootballPlayer> & Pick<FootballPlayer, "playerId" | "name">): FootballPlayer {
  return {
    playerId: overrides.playerId,
    name: overrides.name,
    dateOfBirth: overrides.dateOfBirth ?? "2000-01-01",
    position: overrides.position ?? "Attack",
    subPosition: overrides.subPosition ?? "Centre-Forward",
    foot: overrides.foot ?? "right",
    nation: overrides.nation ?? "Norway",
    continent: overrides.continent ?? "Europe",
    heightCm: overrides.heightCm ?? 180,
    imageUrl: overrides.imageUrl ?? "https://example.test/player.png",
    clubId: overrides.clubId ?? "1",
    clubName: overrides.clubName ?? "Example FC",
    leagueId: overrides.leagueId ?? "GB1",
    leagueName: overrides.leagueName ?? "premier-league",
    leagueCountry: overrides.leagueCountry ?? "England",
    marketValueEur: overrides.marketValueEur ?? null,
    highestMarketValueEur: overrides.highestMarketValueEur ?? null,
    isAnswerCandidate: overrides.isAnswerCandidate ?? false,
    snapshotSeason: overrides.snapshotSeason ?? 2025,
  };
}
