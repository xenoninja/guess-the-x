export type RouteName = "home" | "football" | "not-found";
export type FootballShellState = "loading" | "ready" | "error";
export type FootballDataSummary = {
  guessablePlayerCount: number;
  answerCandidateCount: number;
};
export type DailyPuzzleSummary = {
  puzzleDate: string;
  attemptsRemaining: number;
  maxAttempts: number;
  completed: boolean;
};
export type ResultAnswerClueSummary = {
  label: string;
  value: string;
};
export type DailyPuzzleResultSummary = {
  outcome: "won" | "lost";
  answerName: string;
  answerImageUrl: string;
  answerClues: ResultAnswerClueSummary[];
};
export type ClueComparisonSummary = {
  label: string;
  value: string;
  match: "exact" | "partial" | "miss";
  direction?: "higher" | "lower";
};
export type GuessComparisonSummary = {
  playerId: number;
  playerName: string;
  clues: ClueComparisonSummary[];
};
export type RenderRouteOptions = {
  footballState?: FootballShellState;
  footballDataSummary?: FootballDataSummary;
  dailyPuzzleSummary?: DailyPuzzleSummary;
  resultSummary?: DailyPuzzleResultSummary;
  comparisonHistory?: GuessComparisonSummary[];
};

export function routeForPath(pathname: string): RouteName {
  if (pathname === "/") {
    return "home";
  }

  if (pathname === "/football" || pathname === "/football/") {
    return "football";
  }

  return "not-found";
}

export function renderRoute(pathname: string, options: RenderRouteOptions = {}): string {
  const route = routeForPath(pathname);

  if (route === "home") {
    return renderPage({
      body: `
        <main class="home-shell" aria-labelledby="home-title">
          <p class="eyebrow">Daily deduction games</p>
          <h1 id="home-title">Guess The X</h1>
          <p class="home-copy">Daily mysteries. Six shots. Clues that hit back.</p>
          <a class="route-card" href="/football">
            <span>Play</span>
            <strong>Guess The Football Player</strong>
          </a>
        </main>
      `,
    });
  }

  if (route === "football") {
    return renderFootballShell(
      options.footballState ?? "loading",
      options.footballDataSummary,
      options.dailyPuzzleSummary,
      options.resultSummary,
      options.comparisonHistory ?? [],
    );
  }

  return renderPage({
    body: `
      <main class="not-found-shell" aria-labelledby="not-found-title">
        <p class="eyebrow">404</p>
        <h1 id="not-found-title">Route Not Found</h1>
        <a class="route-card" href="/">Back home</a>
      </main>
    `,
  });
}

function renderFootballShell(
  state: FootballShellState,
  summary?: FootballDataSummary,
  dailyPuzzleSummary?: DailyPuzzleSummary,
  resultSummary?: DailyPuzzleResultSummary,
  comparisonHistory: GuessComparisonSummary[] = [],
): string {
  return renderPage({
    body: `
        <header class="game-header">
          <a class="back-link" href="/" aria-label="Go to Guess The X home">Home</a>
          <p>Guess The Football Player</p>
          <span>2025 data · v1</span>
        </header>
        <main class="game-shell" aria-labelledby="football-title">
          <section class="game-intro">
            <p class="eyebrow">Daily Puzzle</p>
            <h1 id="football-title">Guess The Football Player</h1>
            <p>Call your shot. Six tries. The grid exposes the truth.</p>
          </section>

          ${renderFootballState(state, summary, dailyPuzzleSummary, resultSummary, comparisonHistory)}
        </main>
      `,
  });
}

function renderFootballState(
  state: FootballShellState,
  summary?: FootballDataSummary,
  dailyPuzzleSummary?: DailyPuzzleSummary,
  resultSummary?: DailyPuzzleResultSummary,
  comparisonHistory: GuessComparisonSummary[] = [],
): string {
  if (state === "error") {
    return `
      <section class="state-panel state-panel--error" aria-live="polite" aria-labelledby="error-title">
        <p class="state-kicker">Data error</p>
        <h2 id="error-title">Could not load football data</h2>
        <p>This Daily Puzzle can retry once the data asset is reachable.</p>
        <button type="button">Retry</button>
      </section>
    `;
  }

  if (state === "ready" && summary && dailyPuzzleSummary) {
    return `
      <section class="state-panel state-panel--ready" aria-live="polite" aria-labelledby="ready-title">
        <p class="state-kicker">Ready</p>
        <h2 id="ready-title">Player database ready</h2>
        <dl class="data-summary" aria-label="Loaded football data and Daily Puzzle summary">
          <div>
            <dt>Guessable Players</dt>
            <dd>${formatCount(summary.guessablePlayerCount)} Guessable Players</dd>
          </div>
          <div>
            <dt>Answer Candidates</dt>
            <dd>${formatCount(summary.answerCandidateCount)} Answer Candidates</dd>
          </div>
          <div>
            <dt>Puzzle Date</dt>
            <dd>${dailyPuzzleSummary.puzzleDate} Puzzle Date</dd>
          </div>
          <div>
            <dt>Attempts</dt>
            <dd>${dailyPuzzleSummary.attemptsRemaining} attempts left</dd>
          </div>
        </dl>
        ${renderMatchLegend()}
        ${renderGuessCombobox(dailyPuzzleSummary)}
        ${renderComparisonHistory(comparisonHistory)}
        ${dailyPuzzleSummary.completed && resultSummary ? renderResultPanel(resultSummary) : ""}
        ${dailyPuzzleSummary.completed ? '<p class="lock-copy">Daily Puzzle locked</p>' : ""}
        <p>The grid is armed.</p>
      </section>
    `;
  }

  return `
    <section class="state-panel" aria-live="polite" aria-labelledby="loading-title">
      <p class="state-kicker">Loading</p>
      <h2 id="loading-title">Loading player database</h2>
      <p>Preparing Guessable Players and Answer Candidates.</p>
    </section>
  `;
}

function renderResultPanel(result: DailyPuzzleResultSummary): string {
  const title = result.outcome === "won" ? "Solved" : "Answer Revealed";

  return `
    <section class="result-panel" aria-labelledby="result-title">
      <div class="result-copy">
        <p class="state-kicker">${title}</p>
        <h2 id="result-title">${escapeHtml(result.answerName)}</h2>
      </div>
      <img class="result-portrait" src="${escapeHtml(result.answerImageUrl)}" alt="${escapeHtml(
        result.answerName,
      )} portrait" />
      <div class="result-answer-row" aria-label="Answer row">
        ${result.answerClues.map(renderResultAnswerClue).join("")}
      </div>
    </section>
  `;
}

function renderResultAnswerClue(clue: ResultAnswerClueSummary): string {
  return `
    <div class="result-answer-clue">
      <span>${escapeHtml(clue.label)}</span>
      <strong>${escapeHtml(clue.value)}</strong>
    </div>
  `;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderMatchLegend(): string {
  return `
    <section class="match-legend" aria-label="Clue match legend">
      <div class="legend-items">
        <span class="legend-swatch" data-match="exact">Exact</span>
        <span class="legend-swatch" data-match="partial">Partial</span>
        <span class="legend-swatch" data-match="miss">Miss</span>
      </div>
    </section>
  `;
}

function renderGuessCombobox(dailyPuzzleSummary: DailyPuzzleSummary): string {
  const disabledAttribute = dailyPuzzleSummary.completed ? "disabled" : "";

  return `
    <form class="guess-form" data-player-guess-form autocomplete="off">
      <label for="player-guess-input">Your guess</label>
      <div class="guess-control">
        <input
          id="player-guess-input"
          name="playerGuess"
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="false"
          aria-controls="player-guess-listbox"
          aria-activedescendant=""
          placeholder="Start typing a player"
          ${disabledAttribute}
        />
        <button type="submit" ${disabledAttribute}>Guess</button>
      </div>
      <div id="player-guess-listbox" class="suggestion-list" role="listbox" hidden></div>
      <p class="guess-message" data-player-guess-message aria-live="polite"></p>
    </form>
  `;
}

function renderComparisonHistory(comparisonHistory: GuessComparisonSummary[]): string {
  if (comparisonHistory.length === 0) {
    return "";
  }

  const clueLabels = comparisonHistory[0]?.clues.map((clue) => clue.label) ?? [];

  return `
    <section class="comparison-history" aria-label="Comparison history">
      <div class="comparison-grid" role="table">
        <div class="comparison-header" role="row">
          ${clueLabels.map((label) => `<div role="columnheader">${escapeHtml(label)}</div>`).join("")}
        </div>
        ${comparisonHistory.map(renderComparisonRow).join("")}
      </div>
    </section>
  `;
}

function renderComparisonRow(comparison: GuessComparisonSummary): string {
  return `
    <div class="comparison-row" role="row" data-player-id="${comparison.playerId}">
      <div class="guess-row-header">${escapeHtml(comparison.playerName)}</div>
      ${comparison.clues.map(renderClueCell).join("")}
    </div>
  `;
}

function renderClueCell(clue: ClueComparisonSummary): string {
  return `
    <div
      class="clue-cell"
      role="cell"
      data-clue="${escapeHtml(clue.label)}"
      data-match="${clue.match}"
      ${clue.direction ? `data-direction="${clue.direction}"` : ""}
    >
      <span class="clue-label">${escapeHtml(clue.label)}</span>
      <span class="clue-value">${escapeHtml(clue.value)}</span>
      ${clue.direction ? `<span class="clue-direction">${clue.direction}</span>` : ""}
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

function renderPage({ body }: { body: string }): string {
  return body;
}
