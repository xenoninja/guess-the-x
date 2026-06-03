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
export type RenderRouteOptions = {
  footballState?: FootballShellState;
  footballDataSummary?: FootballDataSummary;
  dailyPuzzleSummary?: DailyPuzzleSummary;
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

          ${renderFootballState(state, summary, dailyPuzzleSummary)}
        </main>
      `,
  });
}

function renderFootballState(
  state: FootballShellState,
  summary?: FootballDataSummary,
  dailyPuzzleSummary?: DailyPuzzleSummary,
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

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderPage({ body }: { body: string }): string {
  return body;
}
