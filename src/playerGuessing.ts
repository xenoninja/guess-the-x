export type GuessablePlayer = {
  playerId: number;
  name: string;
  clubName: string;
  nation: string;
};

export type PlayerSuggestion = GuessablePlayer;

export type AcceptedGuess<TGuessablePlayer extends GuessablePlayer> = {
  status: "accepted";
  player: TGuessablePlayer;
  guessedPlayerIds: number[];
};

export type RejectedGuess = {
  status: "rejected";
  reason: "invalid" | "ambiguous" | "duplicate";
  guessedPlayerIds: number[];
};

export type GuessSubmissionResult<TGuessablePlayer extends GuessablePlayer> =
  | AcceptedGuess<TGuessablePlayer>
  | RejectedGuess;

export type SubmitGuessInput<TGuessablePlayer extends GuessablePlayer> = {
  guessablePlayers: TGuessablePlayer[];
  guessedPlayerIds: number[];
  input: string;
  selectedPlayerId?: number;
};

export function searchGuessablePlayers<TGuessablePlayer extends GuessablePlayer>(
  guessablePlayers: TGuessablePlayer[],
  query: string,
  limit = 8,
): PlayerSuggestion[] {
  const normalizedQuery = normalizePlayerName(query);

  if (!normalizedQuery) {
    return [];
  }

  return guessablePlayers
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => normalizePlayerName(player.name).includes(normalizedQuery))
    .sort((left, right) => compareSuggestions(left, right, normalizedQuery))
    .slice(0, limit)
    .map(({ player }) => {
      const { playerId, name, clubName, nation } = player;

      return { playerId, name, clubName, nation };
    });
}

export function submitGuess<TGuessablePlayer extends GuessablePlayer>({
  guessablePlayers,
  guessedPlayerIds,
  input,
  selectedPlayerId,
}: SubmitGuessInput<TGuessablePlayer>): GuessSubmissionResult<TGuessablePlayer> {
  const resolvedPlayer =
    selectedPlayerId !== undefined
      ? guessablePlayers.find((player) => player.playerId === selectedPlayerId)
      : resolveExactTextGuess(guessablePlayers, input);

  if (resolvedPlayer === "ambiguous") {
    return rejectGuess("ambiguous", guessedPlayerIds);
  }

  if (!resolvedPlayer) {
    return rejectGuess("invalid", guessedPlayerIds);
  }

  if (guessedPlayerIds.includes(resolvedPlayer.playerId)) {
    return rejectGuess("duplicate", guessedPlayerIds);
  }

  return {
    status: "accepted",
    player: resolvedPlayer,
    guessedPlayerIds: [...guessedPlayerIds, resolvedPlayer.playerId],
  };
}

export type MoveActiveSuggestionInput = {
  currentIndex: number;
  suggestionCount: number;
  direction: "next" | "previous";
};

export function moveActiveSuggestionIndex({
  currentIndex,
  suggestionCount,
  direction,
}: MoveActiveSuggestionInput): number {
  if (suggestionCount === 0) {
    return -1;
  }

  if (direction === "next") {
    return (currentIndex + 1) % suggestionCount;
  }

  return currentIndex <= 0 ? suggestionCount - 1 : currentIndex - 1;
}

export function normalizePlayerName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function resolveExactTextGuess<TGuessablePlayer extends GuessablePlayer>(
  guessablePlayers: TGuessablePlayer[],
  input: string,
): TGuessablePlayer | "ambiguous" | null {
  const normalizedInput = normalizePlayerName(input);
  const exactMatches = guessablePlayers.filter((player) => normalizePlayerName(player.name) === normalizedInput);

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    return "ambiguous";
  }

  return null;
}

function rejectGuess(reason: RejectedGuess["reason"], guessedPlayerIds: number[]): RejectedGuess {
  return {
    status: "rejected",
    reason,
    guessedPlayerIds,
  };
}

function compareSuggestions(
  left: { player: GuessablePlayer; index: number },
  right: { player: GuessablePlayer; index: number },
  normalizedQuery: string,
): number {
  const leftName = normalizePlayerName(left.player.name);
  const rightName = normalizePlayerName(right.player.name);
  const leftStarts = leftName.startsWith(normalizedQuery);
  const rightStarts = rightName.startsWith(normalizedQuery);

  if (leftStarts !== rightStarts) {
    return leftStarts ? -1 : 1;
  }

  return left.index - right.index;
}
