import { describe, expect, it } from "vitest";
import { renderRoute } from "./app";

describe("Guess The X app shell", () => {
  it("renders the home page with a path to Guess The Football Player", () => {
    const html = renderRoute("/");

    expect(html).toContain("Guess The X");
    expect(html).toContain('href="/football"');
    expect(html).toContain("Guess The Football Player");
  });

  it("renders the Guess The Football Player shell at /football", () => {
    const html = renderRoute("/football");

    expect(html).toContain("Guess The Football Player");
    expect(html).toContain('href="/" aria-label="Go to Guess The X home">Home</a>');
    expect(html).toContain("Loading player database");
    expect(html).not.toContain("Could not load football data");
    expect(html).toContain("2025 data · v1");
  });

  it("renders the retryable football data error state", () => {
    const html = renderRoute("/football", { footballState: "error" });

    expect(html).toContain("Could not load football data");
    expect(html).toContain("Retry");
    expect(html).not.toContain("Loading player database");
  });

  it("renders the ready football game shell with loaded data counts", () => {
    const html = renderRoute("/football", {
      footballState: "ready",
      footballDataSummary: {
        guessablePlayerCount: 12899,
        answerCandidateCount: 732,
      },
      dailyPuzzleSummary: {
        puzzleDate: "2026-06-04",
        attemptsRemaining: 6,
        maxAttempts: 6,
        completed: false,
      },
    });

    expect(html).toContain("Player database ready");
    expect(html).toContain("12,899 Guessable Players");
    expect(html).toContain("732 Answer Candidates");
    expect(html).toContain("2026-06-04 Puzzle Date");
    expect(html).toContain("6 attempts left");
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-controls="player-guess-listbox"');
    expect(html).toContain('role="listbox"');
    expect(html).toContain('data-player-guess-form');
    expect(html).not.toContain("Loading player database");
    expect(html).not.toContain("Could not load football data");
  });

  it("renders a locked completed Daily Puzzle ready state", () => {
    const html = renderRoute("/football", {
      footballState: "ready",
      footballDataSummary: {
        guessablePlayerCount: 12899,
        answerCandidateCount: 732,
      },
      dailyPuzzleSummary: {
        puzzleDate: "2026-06-04",
        attemptsRemaining: 0,
        maxAttempts: 6,
        completed: true,
      },
    });

    expect(html).toContain("Daily Puzzle locked");
    expect(html).toContain("0 attempts left");
    expect(html).toContain("disabled");
  });

  it("accepts the trailing slash football route", () => {
    const html = renderRoute("/football/");

    expect(html).toContain("Guess The Football Player");
    expect(html).toContain("Loading player database");
  });

  it("renders a not-found view for unknown routes", () => {
    const html = renderRoute("/countries");

    expect(html).toContain("Route Not Found");
    expect(html).toContain('href="/"');
  });
});
