import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/inter/latin-900.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./styles.css";
import { renderRoute, routeForPath } from "./app";
import { consumeDailyPuzzleResetQuery, createDailyPuzzle, savePuzzleProgress } from "./dailyPuzzle";
import { createDuckDbFootballDataSource } from "./duckdbFootballDataSource";
import { compareFootballGuess } from "./footballClues";
import {
  EXPECTED_FOOTBALL_DATA_SUMMARY,
  FOOTBALL_DATA_VERSION,
  FOOTBALL_GAME_ID,
  loadFootballData,
} from "./footballData";
import {
  moveActiveSuggestionIndex,
  searchGuessablePlayers,
  submitGuess,
  type GuessablePlayer,
  type PlayerSuggestion,
} from "./playerGuessing";

const root = document.querySelector<HTMLElement>("#app");
let removeGuessFocusShortcut: (() => void) | undefined;

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
    renderReadyFootballGame(rootElement, footballData, now);
  } catch {
    rootElement.innerHTML = renderRoute(window.location.pathname, { footballState: "error" });
    rootElement.querySelector("button")?.addEventListener("click", () => {
      void renderApp(rootElement);
    });
  }
}

function renderReadyFootballGame(
  rootElement: HTMLElement,
  footballData: Awaited<ReturnType<typeof loadFootballData>>,
  now: Date,
): void {
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
    comparisonHistory: dailyPuzzle.progress.guessedPlayerIds
      .map((playerId) => footballData.guessablePlayers.find((player) => player.playerId === playerId))
      .filter((player) => player !== undefined)
      .map((guess) =>
        compareFootballGuess({
          guess,
          answer: dailyPuzzle.answer,
          puzzleDate: dailyPuzzle.identity.puzzleDate,
        }),
      ),
  });

  hydratePlayerGuessCombobox({
    rootElement,
    guessablePlayers: footballData.guessablePlayers,
    guessedPlayerIds: dailyPuzzle.progress.guessedPlayerIds,
    disabled: dailyPuzzle.completed,
    onAcceptedGuess(playerId) {
      savePuzzleProgress(window.localStorage, {
        ...dailyPuzzle.progress,
        guessedPlayerIds: [...dailyPuzzle.progress.guessedPlayerIds, playerId],
      });
      renderReadyFootballGame(rootElement, footballData, now);
    },
  });
}

type HydratePlayerGuessComboboxInput = {
  rootElement: HTMLElement;
  guessablePlayers: GuessablePlayer[];
  guessedPlayerIds: number[];
  disabled: boolean;
  onAcceptedGuess(playerId: number): void;
};

function hydratePlayerGuessCombobox({
  rootElement,
  guessablePlayers,
  guessedPlayerIds,
  disabled,
  onAcceptedGuess,
}: HydratePlayerGuessComboboxInput): void {
  const form = rootElement.querySelector<HTMLFormElement>("[data-player-guess-form]");
  const input = rootElement.querySelector<HTMLInputElement>("#player-guess-input");
  const listbox = rootElement.querySelector<HTMLElement>("#player-guess-listbox");
  const message = rootElement.querySelector<HTMLElement>("[data-player-guess-message]");

  if (!form || !input || !listbox || !message || disabled) {
    removeGuessFocusShortcut?.();
    return;
  }

  const guessInput = input;
  const suggestionListbox = listbox;
  const feedbackMessage = message;
  let suggestions: PlayerSuggestion[] = [];
  let activeIndex = -1;
  let selectedPlayerId: number | undefined;

  function renderSuggestions(): void {
    guessInput.setAttribute("aria-expanded", suggestions.length > 0 ? "true" : "false");
    suggestionListbox.hidden = suggestions.length === 0;
    suggestionListbox.innerHTML = suggestions
      .map((suggestion, index) => {
        const optionId = `player-guess-option-${suggestion.playerId}`;

        return `
          <div
            id="${optionId}"
            class="suggestion-option"
            role="option"
            aria-selected="${index === activeIndex ? "true" : "false"}"
            data-player-id="${suggestion.playerId}"
          >
            <span class="suggestion-name">${escapeHtml(suggestion.name)}</span>
            <span class="suggestion-meta">${escapeHtml(suggestion.clubName)} · ${escapeHtml(suggestion.nation)}</span>
          </div>
        `;
      })
      .join("");

    guessInput.setAttribute(
      "aria-activedescendant",
      activeIndex >= 0 && suggestions[activeIndex] ? `player-guess-option-${suggestions[activeIndex].playerId}` : "",
    );
  }

  function closeSuggestions(): void {
    suggestions = [];
    activeIndex = -1;
    renderSuggestions();
  }

  function updateSuggestions(): void {
    selectedPlayerId = undefined;
    suggestions = searchGuessablePlayers(guessablePlayers, guessInput.value);
    activeIndex = suggestions.length > 0 ? 0 : -1;
    renderSuggestions();
  }

  guessInput.addEventListener("input", updateSuggestions);
  guessInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSuggestions();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = moveActiveSuggestionIndex({
        currentIndex: activeIndex,
        suggestionCount: suggestions.length,
        direction: event.key === "ArrowDown" ? "next" : "previous",
      });
      renderSuggestions();
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
      selectedPlayerId = suggestions[activeIndex].playerId;
      guessInput.value = suggestions[activeIndex].name;
      closeSuggestions();
    }
  });

  suggestionListbox.addEventListener("click", (event) => {
    const option = (event.target as HTMLElement).closest<HTMLElement>("[data-player-id]");

    if (!option) {
      return;
    }

    selectedPlayerId = Number(option.dataset.playerId);
    const suggestion = suggestions.find((candidate) => candidate.playerId === selectedPlayerId);
    guessInput.value = suggestion?.name ?? guessInput.value;
    closeSuggestions();
    guessInput.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = submitGuess({
      guessablePlayers,
      guessedPlayerIds,
      input: guessInput.value,
      selectedPlayerId,
    });

    if (result.status === "rejected") {
      feedbackMessage.textContent = rejectedGuessMessage(result.reason);
      return;
    }

    onAcceptedGuess(result.player.playerId);
  });

  removeGuessFocusShortcut?.();
  const focusGuessInput = (event: KeyboardEvent) => {
    if (event.key === "/" && document.activeElement !== guessInput) {
      event.preventDefault();
      guessInput.focus();
    }
  };
  window.addEventListener("keydown", focusGuessInput);
  removeGuessFocusShortcut = () => window.removeEventListener("keydown", focusGuessInput);
}

function rejectedGuessMessage(reason: "invalid" | "ambiguous" | "duplicate"): string {
  if (reason === "ambiguous") {
    return "Choose the exact player from the list.";
  }

  if (reason === "duplicate") {
    return "Already guessed. Try a new player.";
  }

  return "No Guessable Player found.";
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
