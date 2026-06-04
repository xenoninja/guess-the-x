import { describe, expect, it } from "vitest";
import { moveActiveSuggestionIndex, searchGuessablePlayers, submitGuess } from "./playerGuessing";

describe("player guessing", () => {
  const players = [
    player({ playerId: 10, name: "Ousmane Dembélé", clubName: "Paris Saint-Germain", nation: "France" }),
    player({ playerId: 20, name: "Mousa Dembélé", clubName: "Tottenham Hotspur", nation: "Belgium" }),
    player({ playerId: 30, name: "Bukayo Saka", clubName: "Arsenal", nation: "England" }),
    player({ playerId: 40, name: "Arsenal Runner", clubName: "Example FC", nation: "Spain" }),
  ];

  it("searches Guessable Player names with accent-insensitive and case-insensitive matching", () => {
    const suggestions = searchGuessablePlayers(players, "dembele");

    expect(suggestions).toEqual([
      { playerId: 10, name: "Ousmane Dembélé", clubName: "Paris Saint-Germain", nation: "France" },
      { playerId: 20, name: "Mousa Dembélé", clubName: "Tottenham Hotspur", nation: "Belgium" },
    ]);
  });

  it("does not search club or nation text", () => {
    expect(searchGuessablePlayers(players, "arsenal").map((suggestion) => suggestion.playerId)).toEqual([40]);
    expect(searchGuessablePlayers(players, "england")).toEqual([]);
  });

  it("accepts an exact normalized free-text guess only when it resolves to one player", () => {
    const result = submitGuess({
      guessablePlayers: players,
      guessedPlayerIds: [],
      input: "bukayo saka",
    });

    expect(result).toEqual({
      status: "accepted",
      player: players[2],
      guessedPlayerIds: [30],
    });
  });

  it("requires choosing a suggestion for ambiguous duplicate-name submissions", () => {
    const duplicatePlayers = [
      player({ playerId: 50, name: "Alex Silva", clubName: "North FC", nation: "Brazil" }),
      player({ playerId: 60, name: "Álex Silva", clubName: "South FC", nation: "Portugal" }),
    ];

    expect(
      submitGuess({
        guessablePlayers: duplicatePlayers,
        guessedPlayerIds: [],
        input: "alex silva",
      }),
    ).toEqual({
      status: "rejected",
      reason: "ambiguous",
      guessedPlayerIds: [],
    });
  });

  it("selects by player ID and rejects invalid or duplicate submissions without consuming attempts", () => {
    expect(
      submitGuess({
        guessablePlayers: players,
        guessedPlayerIds: [],
        input: "anything",
        selectedPlayerId: 10,
      }),
    ).toMatchObject({ status: "accepted", guessedPlayerIds: [10] });

    expect(
      submitGuess({
        guessablePlayers: players,
        guessedPlayerIds: [10],
        input: "Ousmane Dembele",
      }),
    ).toEqual({
      status: "rejected",
      reason: "duplicate",
      guessedPlayerIds: [10],
    });

    expect(
      submitGuess({
        guessablePlayers: players,
        guessedPlayerIds: [10],
        input: "No Such Player",
      }),
    ).toEqual({
      status: "rejected",
      reason: "invalid",
      guessedPlayerIds: [10],
    });
  });

  it("moves the active suggestion for keyboard navigation", () => {
    expect(moveActiveSuggestionIndex({ currentIndex: -1, suggestionCount: 3, direction: "next" })).toBe(0);
    expect(moveActiveSuggestionIndex({ currentIndex: 0, suggestionCount: 3, direction: "next" })).toBe(1);
    expect(moveActiveSuggestionIndex({ currentIndex: 0, suggestionCount: 3, direction: "previous" })).toBe(2);
    expect(moveActiveSuggestionIndex({ currentIndex: -1, suggestionCount: 0, direction: "next" })).toBe(-1);
  });
});

function player({
  playerId,
  name,
  clubName,
  nation,
}: {
  playerId: number;
  name: string;
  clubName: string;
  nation: string;
}) {
  return {
    playerId,
    name,
    clubName,
    nation,
  };
}
