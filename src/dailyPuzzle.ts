export function getUtcPuzzleDate(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type AnswerCandidateReference = {
  playerId: number;
};

export type DailyPuzzleIdentity = {
  gameId: string;
  puzzleDate: string;
  dataVersion: string;
};

export type DailyPuzzleAnswerSelection<TAnswerCandidate extends AnswerCandidateReference> = {
  answer: TAnswerCandidate;
  selectionKey: string;
};

export const DAILY_PUZZLE_ATTEMPT_LIMIT = 6;

export type PuzzleProgressOutcome = "won" | "lost";
export type PuzzleProgress = DailyPuzzleIdentity & {
  guessedPlayerIds: number[];
  outcome: PuzzleProgressOutcome | null;
};

export type DailyPuzzle<TAnswerCandidate extends AnswerCandidateReference> = {
  identity: DailyPuzzleIdentity;
  answer: TAnswerCandidate;
  answerSelectionKey: string;
  maxAttempts: number;
  progress: PuzzleProgress;
  attemptsRemaining: number;
  completed: boolean;
};

export type CreateDailyPuzzleInput<TAnswerCandidate extends AnswerCandidateReference> = {
  answerCandidates: TAnswerCandidate[];
  gameId: string;
  dataVersion: string;
  now: Date;
  progressStore?: PuzzleProgressStore;
};

export type PuzzleProgressStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export function createDailyPuzzle<TAnswerCandidate extends AnswerCandidateReference>({
  answerCandidates,
  gameId,
  dataVersion,
  now,
  progressStore,
}: CreateDailyPuzzleInput<TAnswerCandidate>): DailyPuzzle<TAnswerCandidate> {
  const identity = {
    gameId,
    puzzleDate: getUtcPuzzleDate(now),
    dataVersion,
  };
  const answerSelection = selectDailyPuzzleAnswer(answerCandidates, identity);
  const progress = restorePuzzleProgress(progressStore, identity) ?? createEmptyPuzzleProgress(identity);

  return createDailyPuzzleState(identity, answerSelection, progress);
}

export function selectDailyPuzzleAnswer<TAnswerCandidate extends AnswerCandidateReference>(
  answerCandidates: TAnswerCandidate[],
  identity: DailyPuzzleIdentity,
): DailyPuzzleAnswerSelection<TAnswerCandidate> {
  if (answerCandidates.length === 0) {
    throw new Error("Cannot select a Daily Puzzle answer without Answer Candidates.");
  }

  const sortedCandidates = [...answerCandidates].sort((left, right) => left.playerId - right.playerId);
  const selectionKey = `${identity.gameId}:${identity.puzzleDate}:${identity.dataVersion}`;
  const answerIndex = stableHash(selectionKey) % sortedCandidates.length;

  return {
    answer: sortedCandidates[answerIndex],
    selectionKey,
  };
}

function createEmptyPuzzleProgress(identity: DailyPuzzleIdentity): PuzzleProgress {
  return {
    ...identity,
    guessedPlayerIds: [],
    outcome: null,
  };
}

export function puzzleProgressStorageKey(identity: Pick<DailyPuzzleIdentity, "gameId" | "puzzleDate">): string {
  return `guess-the-x:puzzle-progress:${identity.gameId}:${identity.puzzleDate}`;
}

export function savePuzzleProgress(progressStore: PuzzleProgressStore, progress: PuzzleProgress): void {
  progressStore.setItem(puzzleProgressStorageKey(progress), JSON.stringify(progress));
}

export function clearPuzzleProgress(
  progressStore: PuzzleProgressStore,
  identity: Pick<DailyPuzzleIdentity, "gameId" | "puzzleDate">,
): void {
  progressStore.removeItem(puzzleProgressStorageKey(identity));
}

export type ConsumeDailyPuzzleResetQueryInput = {
  url: URL;
  gameId: string;
  now: Date;
  progressStore: PuzzleProgressStore;
  replaceUrl(url: string): void;
};

export function consumeDailyPuzzleResetQuery({
  url,
  gameId,
  now,
  progressStore,
  replaceUrl,
}: ConsumeDailyPuzzleResetQueryInput): boolean {
  if (url.searchParams.get("reset") !== "1") {
    return false;
  }

  clearPuzzleProgress(progressStore, {
    gameId,
    puzzleDate: getUtcPuzzleDate(now),
  });
  replaceUrl(url.pathname);

  return true;
}

export function restorePuzzleProgress(
  progressStore: PuzzleProgressStore | undefined,
  identity: DailyPuzzleIdentity,
): PuzzleProgress | null {
  if (!progressStore) {
    return null;
  }

  const serializedProgress = progressStore.getItem(puzzleProgressStorageKey(identity));

  if (!serializedProgress) {
    return null;
  }

  return parsePuzzleProgress(serializedProgress, identity);
}

function parsePuzzleProgress(serializedProgress: string, identity: DailyPuzzleIdentity): PuzzleProgress | null {
  try {
    const progress = JSON.parse(serializedProgress) as Partial<PuzzleProgress>;

    if (
      progress.gameId !== identity.gameId ||
      progress.puzzleDate !== identity.puzzleDate ||
      progress.dataVersion !== identity.dataVersion ||
      !Array.isArray(progress.guessedPlayerIds) ||
      (progress.outcome !== null && progress.outcome !== "won" && progress.outcome !== "lost")
    ) {
      return null;
    }

    return {
      gameId: identity.gameId,
      puzzleDate: identity.puzzleDate,
      dataVersion: identity.dataVersion,
      guessedPlayerIds: progress.guessedPlayerIds.map(Number),
      outcome: progress.outcome,
    };
  } catch {
    return null;
  }
}

function createDailyPuzzleState<TAnswerCandidate extends AnswerCandidateReference>(
  identity: DailyPuzzleIdentity,
  answerSelection: DailyPuzzleAnswerSelection<TAnswerCandidate>,
  progress: PuzzleProgress,
): DailyPuzzle<TAnswerCandidate> {
  return {
    identity,
    answer: answerSelection.answer,
    answerSelectionKey: answerSelection.selectionKey,
    maxAttempts: DAILY_PUZZLE_ATTEMPT_LIMIT,
    progress,
    attemptsRemaining: Math.max(DAILY_PUZZLE_ATTEMPT_LIMIT - progress.guessedPlayerIds.length, 0),
    completed: progress.outcome !== null,
  };
}

function stableHash(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
