export const FOOTBALL_DATA_ASSET_PATH = "/data/football-players-2025-v1.parquet";
export const EXPECTED_FOOTBALL_DATA_SUMMARY = {
  guessablePlayerCount: 12899,
  answerCandidateCount: 732,
} as const;

export type FootballPlayer = {
  playerId: number;
  name: string;
  dateOfBirth: string;
  position: string;
  subPosition: string;
  foot: string;
  nation: string;
  continent: string;
  heightCm: number;
  imageUrl: string;
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  marketValueEur: number | null;
  highestMarketValueEur: number | null;
  isAnswerCandidate: boolean;
  snapshotSeason: number;
};

export type FootballDataSummary = {
  guessablePlayerCount: number;
  answerCandidateCount: number;
};

export type FootballData = {
  guessablePlayers: FootballPlayer[];
  answerCandidates: FootballPlayer[];
  summary: FootballDataSummary;
};

export type FootballPlayerDataSource = {
  loadPlayers(assetPath: string): Promise<FootballPlayer[]>;
};

export type LoadFootballDataOptions = {
  expectedSummary?: FootballDataSummary;
};

export async function loadFootballData(
  dataSource: FootballPlayerDataSource,
  options: LoadFootballDataOptions = {},
): Promise<FootballData> {
  const guessablePlayers = await dataSource.loadPlayers(FOOTBALL_DATA_ASSET_PATH);
  const answerCandidates = guessablePlayers.filter((player) => player.isAnswerCandidate);
  const summary = {
    guessablePlayerCount: guessablePlayers.length,
    answerCandidateCount: answerCandidates.length,
  };

  if (options.expectedSummary) {
    verifyFootballDataSummary(summary, options.expectedSummary);
  }

  return {
    guessablePlayers,
    answerCandidates,
    summary,
  };
}

function verifyFootballDataSummary(summary: FootballDataSummary, expectedSummary: FootballDataSummary): void {
  if (
    summary.guessablePlayerCount === expectedSummary.guessablePlayerCount &&
    summary.answerCandidateCount === expectedSummary.answerCandidateCount
  ) {
    return;
  }

  throw new Error(
    `Expected ${formatCount(expectedSummary.guessablePlayerCount)} Guessable Players and ${formatCount(
      expectedSummary.answerCandidateCount,
    )} Answer Candidates, but loaded ${formatCount(summary.guessablePlayerCount)} Guessable Players and ${formatCount(
      summary.answerCandidateCount,
    )} Answer Candidates.`,
  );
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
