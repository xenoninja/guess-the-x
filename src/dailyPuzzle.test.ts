import { describe, expect, it } from "vitest";
import {
  DAILY_PUZZLE_ATTEMPT_LIMIT,
  clearPuzzleProgress,
  consumeDailyPuzzleResetQuery,
  createDailyPuzzle,
  getUtcPuzzleDate,
  savePuzzleProgress,
  selectDailyPuzzleAnswer,
} from "./dailyPuzzle";

describe("Daily Puzzle", () => {
  it("derives the Puzzle Date from the UTC calendar date", () => {
    expect(getUtcPuzzleDate(new Date("2026-06-03T23:30:00-07:00"))).toBe("2026-06-04");
  });

  it("selects a deterministic Answer Candidate from player IDs sorted ascending", () => {
    const selection = {
      gameId: "guess-football-player",
      puzzleDate: "2026-06-04",
      dataVersion: "football-players-2025-v1",
    };
    const first = selectDailyPuzzleAnswer(
      [{ playerId: 300 }, { playerId: 100 }, { playerId: 200 }],
      selection,
    );
    const second = selectDailyPuzzleAnswer(
      [{ playerId: 200 }, { playerId: 300 }, { playerId: 100 }],
      selection,
    );

    expect(first.answer).toEqual(second.answer);
    expect(first.selectionKey).toBe("guess-football-player:2026-06-04:football-players-2025-v1");
  });

  it("creates a six-attempt Daily Puzzle for the UTC Puzzle Date", () => {
    const puzzle = createDailyPuzzle({
      answerCandidates: [{ playerId: 100 }, { playerId: 200 }, { playerId: 300 }],
      gameId: "guess-football-player",
      dataVersion: "football-players-2025-v1",
      now: new Date("2026-06-03T23:30:00-07:00"),
    });

    expect(DAILY_PUZZLE_ATTEMPT_LIMIT).toBe(6);
    expect(puzzle.identity).toEqual({
      gameId: "guess-football-player",
      puzzleDate: "2026-06-04",
      dataVersion: "football-players-2025-v1",
    });
    expect(puzzle.maxAttempts).toBe(6);
    expect(puzzle.attemptsRemaining).toBe(6);
    expect(puzzle.completed).toBe(false);
    expect(puzzle.answer.playerId).toEqual(expect.any(Number));
  });

  it("restores matching Puzzle Progress with attempts and completed outcome", () => {
    const progressStore = new MemoryProgressStore();
    progressStore.setItem(
      "guess-the-x:puzzle-progress:guess-football-player:2026-06-04",
      JSON.stringify({
        gameId: "guess-football-player",
        puzzleDate: "2026-06-04",
        dataVersion: "football-players-2025-v1",
        guessedPlayerIds: [100, 200],
        outcome: "won",
      }),
    );

    const puzzle = createDailyPuzzle({
      answerCandidates: [{ playerId: 100 }, { playerId: 200 }, { playerId: 300 }],
      gameId: "guess-football-player",
      dataVersion: "football-players-2025-v1",
      now: new Date("2026-06-04T12:00:00Z"),
      progressStore,
    });

    expect(puzzle.progress.guessedPlayerIds).toEqual([100, 200]);
    expect(puzzle.progress.outcome).toBe("won");
    expect(puzzle.attemptsRemaining).toBe(4);
    expect(puzzle.completed).toBe(true);
  });

  it("ignores saved Puzzle Progress when the data version does not match", () => {
    const progressStore = new MemoryProgressStore();
    progressStore.setItem(
      "guess-the-x:puzzle-progress:guess-football-player:2026-06-04",
      JSON.stringify({
        gameId: "guess-football-player",
        puzzleDate: "2026-06-04",
        dataVersion: "old-data-version",
        guessedPlayerIds: [100, 200, 300],
        outcome: "lost",
      }),
    );

    const puzzle = createDailyPuzzle({
      answerCandidates: [{ playerId: 100 }, { playerId: 200 }, { playerId: 300 }],
      gameId: "guess-football-player",
      dataVersion: "football-players-2025-v1",
      now: new Date("2026-06-04T12:00:00Z"),
      progressStore,
    });

    expect(puzzle.progress.guessedPlayerIds).toEqual([]);
    expect(puzzle.progress.outcome).toBeNull();
    expect(puzzle.attemptsRemaining).toBe(6);
    expect(puzzle.completed).toBe(false);
  });

  it("saves and clears Puzzle Progress for the Daily Puzzle identity", () => {
    const progressStore = new MemoryProgressStore();
    const progress = {
      gameId: "guess-football-player",
      puzzleDate: "2026-06-04",
      dataVersion: "football-players-2025-v1",
      guessedPlayerIds: [100],
      outcome: null,
    };

    savePuzzleProgress(progressStore, progress);
    expect(progressStore.getItem("guess-the-x:puzzle-progress:guess-football-player:2026-06-04")).toContain(
      '"guessedPlayerIds":[100]',
    );

    clearPuzzleProgress(progressStore, progress);

    expect(progressStore.getItem("guess-the-x:puzzle-progress:guess-football-player:2026-06-04")).toBeNull();
  });

  it("consumes reset query by clearing today's Puzzle Progress and cleaning the URL", () => {
    const progressStore = new MemoryProgressStore();
    const replacedUrls: string[] = [];
    progressStore.setItem(
      "guess-the-x:puzzle-progress:guess-football-player:2026-06-04",
      JSON.stringify({
        gameId: "guess-football-player",
        puzzleDate: "2026-06-04",
        dataVersion: "football-players-2025-v1",
        guessedPlayerIds: [100],
        outcome: null,
      }),
    );

    const didReset = consumeDailyPuzzleResetQuery({
      url: new URL("https://guess.example/football?reset=1"),
      gameId: "guess-football-player",
      now: new Date("2026-06-04T12:00:00Z"),
      progressStore,
      replaceUrl(url) {
        replacedUrls.push(url);
      },
    });

    expect(didReset).toBe(true);
    expect(progressStore.getItem("guess-the-x:puzzle-progress:guess-football-player:2026-06-04")).toBeNull();
    expect(replacedUrls).toEqual(["/football"]);
  });
});

class MemoryProgressStore {
  private readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}
