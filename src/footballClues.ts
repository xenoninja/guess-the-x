import type { FootballPlayer } from "./footballData";

export type FootballClueLabel = "Player" | "Nation" | "Position" | "Puzzle Age" | "Height" | "Foot" | "Club";
export type ClueMatch = "exact" | "partial" | "miss";
export type NumericDirection = "higher" | "lower";

export type FootballClueComparison = {
  label: FootballClueLabel;
  value: string;
  match: ClueMatch;
  direction?: NumericDirection;
};

export type FootballGuessComparison = {
  playerId: number;
  playerName: string;
  clues: FootballClueComparison[];
};

export type CompareFootballGuessInput = {
  guess: FootballPlayer;
  answer: FootballPlayer;
  puzzleDate: string;
};

export function getVisibleFootballClues(): FootballClueLabel[] {
  return ["Player", "Nation", "Position", "Puzzle Age", "Height", "Foot", "Club"];
}

export function compareFootballGuess({ guess, answer, puzzleDate }: CompareFootballGuessInput): FootballGuessComparison {
  const guessPuzzleAge = getPuzzleAge(guess.dateOfBirth, puzzleDate);
  const answerPuzzleAge = getPuzzleAge(answer.dateOfBirth, puzzleDate);

  return {
    playerId: guess.playerId,
    playerName: guess.name,
    clues: [
      {
        label: "Player",
        value: guess.name,
        match: guess.playerId === answer.playerId ? "exact" : "miss",
      },
      {
        label: "Nation",
        value: guess.nation,
        match: compareNation(guess, answer),
      },
      {
        label: "Position",
        value: guess.position,
        match: exactOnly(guess.position, answer.position),
      },
      {
        label: "Puzzle Age",
        value: String(guessPuzzleAge),
        ...compareNumber(guessPuzzleAge, answerPuzzleAge),
      },
      {
        label: "Height",
        value: `${guess.heightCm} cm`,
        ...compareNumber(guess.heightCm, answer.heightCm),
      },
      {
        label: "Foot",
        value: guess.foot,
        match: exactOnly(guess.foot, answer.foot),
      },
      {
        label: "Club",
        value: guess.clubName,
        match: compareClub(guess, answer),
      },
    ],
  };
}

export function getPuzzleAge(dateOfBirth: string, puzzleDate: string): number {
  const birthDate = parseUtcDate(dateOfBirth);
  const date = parseUtcDate(puzzleDate);
  let age = date.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasHadBirthday =
    date.getUTCMonth() > birthDate.getUTCMonth() ||
    (date.getUTCMonth() === birthDate.getUTCMonth() && date.getUTCDate() >= birthDate.getUTCDate());

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}

function compareNation(guess: FootballPlayer, answer: FootballPlayer): ClueMatch {
  if (guess.nation === answer.nation) {
    return "exact";
  }

  return guess.continent === answer.continent ? "partial" : "miss";
}

function compareClub(guess: FootballPlayer, answer: FootballPlayer): ClueMatch {
  if (guess.clubId === answer.clubId) {
    return "exact";
  }

  return guess.leagueId === answer.leagueId ? "partial" : "miss";
}

function compareNumber(guessValue: number, answerValue: number): { match: ClueMatch; direction?: NumericDirection } {
  if (guessValue === answerValue) {
    return { match: "exact" };
  }

  return {
    match: "partial",
    direction: answerValue > guessValue ? "higher" : "lower",
  };
}

function exactOnly(guessValue: string, answerValue: string): ClueMatch {
  return guessValue === answerValue ? "exact" : "miss";
}

function parseUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
