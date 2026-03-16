/**
 * ELO Puanlama Sistemi — Move League
 *
 * K Faktörü:
 *   İlk 30 düello: K = 40
 *   30+ düello:    K = 20
 *   2000+ rating:  K = 10
 *
 * Beklenen Skor: E = 1 / (1 + 10^((Rb - Ra) / 400))
 * Yeni Rating:   R' = R + K × (S - E)
 */

function getKFactor(rating: number, totalBattles: number): number {
  if (totalBattles < 30) return 40;
  if (rating >= 2000) return 10;
  return 20;
}

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export interface EloResult {
  winnerNewRating: number;
  loserNewRating: number;
  winnerChange: number;
  loserChange: number;
}

export function calculateElo(
  winnerRating: number,
  loserRating: number,
  winnerTotalBattles: number,
  loserTotalBattles: number
): EloResult {
  const kWinner = getKFactor(winnerRating, winnerTotalBattles);
  const kLoser = getKFactor(loserRating, loserTotalBattles);

  const expectedWinner = expectedScore(winnerRating, loserRating);
  const expectedLoser = expectedScore(loserRating, winnerRating);

  const winnerChange = Math.round(kWinner * (1 - expectedWinner));
  const loserChange = Math.round(kLoser * (0 - expectedLoser));

  return {
    winnerNewRating: winnerRating + winnerChange,
    loserNewRating: Math.max(0, loserRating + loserChange),
    winnerChange,
    loserChange,
  };
}

export function calculateSeasonTransition(previousRating: number): number {
  return Math.round(1500 + previousRating * 0.2);
}
