import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-900.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./styles.css";
import { renderRoute, routeForPath } from "./app";
import { consumeDailyPuzzleResetQuery, createDailyPuzzle } from "./dailyPuzzle";
import { createDuckDbFootballDataSource } from "./duckdbFootballDataSource";
import {
  EXPECTED_FOOTBALL_DATA_SUMMARY,
  FOOTBALL_DATA_VERSION,
  FOOTBALL_GAME_ID,
  loadFootballData,
} from "./footballData";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("Missing #app root");
}

void renderApp(root);

async function renderApp(rootElement: HTMLElement): Promise<void> {
  if (routeForPath(window.location.pathname) !== "football") {
    rootElement.innerHTML = renderRoute(window.location.pathname);
    return;
  }

  const now = new Date();
  consumeDailyPuzzleResetQuery({
    url: new URL(window.location.href),
    gameId: FOOTBALL_GAME_ID,
    now,
    progressStore: window.localStorage,
    replaceUrl(url) {
      window.history.replaceState(null, "", url);
    },
  });

  rootElement.innerHTML = renderRoute(window.location.pathname, { footballState: "loading" });

  try {
    const footballData = await loadFootballData(createDuckDbFootballDataSource(), {
      expectedSummary: EXPECTED_FOOTBALL_DATA_SUMMARY,
    });
    const dailyPuzzle = createDailyPuzzle({
      answerCandidates: footballData.answerCandidates,
      gameId: FOOTBALL_GAME_ID,
      dataVersion: FOOTBALL_DATA_VERSION,
      now,
      progressStore: window.localStorage,
    });

    rootElement.innerHTML = renderRoute(window.location.pathname, {
      footballState: "ready",
      footballDataSummary: footballData.summary,
      dailyPuzzleSummary: {
        puzzleDate: dailyPuzzle.identity.puzzleDate,
        attemptsRemaining: dailyPuzzle.attemptsRemaining,
        maxAttempts: dailyPuzzle.maxAttempts,
        completed: dailyPuzzle.completed,
      },
    });
  } catch {
    rootElement.innerHTML = renderRoute(window.location.pathname, { footballState: "error" });
    rootElement.querySelector("button")?.addEventListener("click", () => {
      void renderApp(rootElement);
    });
  }
}
