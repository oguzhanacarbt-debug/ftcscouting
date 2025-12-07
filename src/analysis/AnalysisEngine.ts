import type { ScoutEntry, TeamStats, MatchPrediction, Match } from '@/models/DataModels';

// Constants for ELO calculations
const K_FACTOR = 32;
export const INITIAL_ELO = 1500;
const MOMENTUM_WINDOW = 5;

interface TeamPerformance {
  autoPoints: number;
  teleopPoints: number;
  endgamePoints: number;
  totalPoints: number;
  driverSkill: number;
  robotSpeed: number;
  defenseRating: number;
}

// Calculate expected win probability (ELO formula)
export const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

// Update ELO ratings after a match
export const updateEloRatings = (
  winnerRating: number,
  loserRating: number,
  margin: number = 0
): { newWinnerRating: number; newLoserRating: number } => {
  const expectedWinner = calculateExpectedScore(winnerRating, loserRating);
  const expectedLoser = 1 - expectedWinner;
  
  // Margin multiplier (higher margins = bigger rating changes)
  const marginMultiplier = Math.log(Math.abs(margin) + 1) / 10 + 1;
  
  const newWinnerRating = winnerRating + K_FACTOR * marginMultiplier * (1 - expectedWinner);
  const newLoserRating = loserRating + K_FACTOR * marginMultiplier * (0 - expectedLoser);
  
  return {
    newWinnerRating: Math.round(newWinnerRating),
    newLoserRating: Math.max(1000, Math.round(newLoserRating)), // Floor at 1000
  };
};

// Calculate team performance from a scout entry
export const calculatePerformance = (entry: ScoutEntry): TeamPerformance => {
  // Points estimation based on INTO THE DEEP game
  const autoPoints = (entry.autoSampleScored * 6) + (entry.autoSpecimenScored * 10) + (entry.autoParked ? 3 : 0);
  const teleopPoints = (entry.teleopSampleScored * 4) + (entry.teleopSpecimenScored * 8);
  const endgamePoints = entry.endgameParked ? 3 : 0 + 
    (entry.endgameHanging === 'low' ? 15 : entry.endgameHanging === 'high' ? 30 : 0);
  
  return {
    autoPoints,
    teleopPoints,
    endgamePoints,
    totalPoints: autoPoints + teleopPoints + endgamePoints,
    driverSkill: entry.driverSkill,
    robotSpeed: entry.robotSpeed,
    defenseRating: entry.defenseRating,
  };
};

// Calculate team statistics from scout entries
export const calculateTeamStats = (
  teamNumber: number,
  eventId: string,
  entries: ScoutEntry[],
  previousRating: number = INITIAL_ELO
): TeamStats => {
  const teamEntries = entries.filter(e => e.teamNumber === teamNumber);
  
  if (teamEntries.length === 0) {
    return {
      teamNumber,
      eventId,
      matchesPlayed: 0,
      avgAutoSamples: 0,
      avgAutoSpecimens: 0,
      avgTeleopSamples: 0,
      avgTeleopSpecimens: 0,
      avgTotalPoints: 0,
      autoSuccessRate: 0,
      hangSuccessRate: 0,
      avgDriverSkill: 0,
      avgRobotSpeed: 0,
      avgDefenseRating: 0,
      eloRating: previousRating,
      eloTrend: [previousRating],
      consistency: 0,
      lastUpdated: Date.now(),
    };
  }
  
  const performances = teamEntries.map(calculatePerformance);
  const n = performances.length;
  
  // Calculate averages
  const avgAutoSamples = teamEntries.reduce((sum, e) => sum + e.autoSampleScored, 0) / n;
  const avgAutoSpecimens = teamEntries.reduce((sum, e) => sum + e.autoSpecimenScored, 0) / n;
  const avgTeleopSamples = teamEntries.reduce((sum, e) => sum + e.teleopSampleScored, 0) / n;
  const avgTeleopSpecimens = teamEntries.reduce((sum, e) => sum + e.teleopSpecimenScored, 0) / n;
  const avgTotalPoints = performances.reduce((sum, p) => sum + p.totalPoints, 0) / n;
  
  // Calculate success rates
  const autoSuccessRate = teamEntries.filter(e => e.autoParked || e.autoSampleScored > 0 || e.autoSpecimenScored > 0).length / n;
  const hangSuccessRate = teamEntries.filter(e => e.endgameHanging !== 'none').length / n;
  
  // Calculate averages for subjective ratings
  const avgDriverSkill = teamEntries.reduce((sum, e) => sum + e.driverSkill, 0) / n;
  const avgRobotSpeed = teamEntries.reduce((sum, e) => sum + e.robotSpeed, 0) / n;
  const avgDefenseRating = teamEntries.reduce((sum, e) => sum + e.defenseRating, 0) / n;
  
  // Calculate consistency (inverse of coefficient of variation)
  const pointsStdDev = Math.sqrt(
    performances.reduce((sum, p) => sum + Math.pow(p.totalPoints - avgTotalPoints, 2), 0) / n
  );
  const consistency = avgTotalPoints > 0 ? Math.max(0, 1 - (pointsStdDev / avgTotalPoints)) : 0;
  
  // Generate ELO trend (simplified - would normally track across matches)
  const eloTrend = [previousRating];
  let currentRating = previousRating;
  for (let i = 0; i < Math.min(n, MOMENTUM_WINDOW); i++) {
    const perf = performances[i];
    const ratingDelta = (perf.totalPoints - 50) / 5; // Normalize around expected 50 points
    currentRating += ratingDelta;
    eloTrend.push(Math.round(currentRating));
  }
  
  return {
    teamNumber,
    eventId,
    matchesPlayed: n,
    avgAutoSamples,
    avgAutoSpecimens,
    avgTeleopSamples,
    avgTeleopSpecimens,
    avgTotalPoints,
    autoSuccessRate,
    hangSuccessRate,
    avgDriverSkill,
    avgRobotSpeed,
    avgDefenseRating,
    eloRating: Math.round(currentRating),
    eloTrend,
    consistency,
    lastUpdated: Date.now(),
  };
};

// Predict match outcome
export const predictMatch = (
  match: Match,
  teamStatsMap: Map<number, TeamStats>
): MatchPrediction => {
  // Get team stats or use defaults
  const getStats = (teamNumber: number): TeamStats => {
    return teamStatsMap.get(teamNumber) || {
      teamNumber,
      eventId: match.eventId,
      matchesPlayed: 0,
      avgAutoSamples: 2,
      avgAutoSpecimens: 1,
      avgTeleopSamples: 4,
      avgTeleopSpecimens: 2,
      avgTotalPoints: 50,
      autoSuccessRate: 0.5,
      hangSuccessRate: 0.3,
      avgDriverSkill: 3,
      avgRobotSpeed: 3,
      avgDefenseRating: 3,
      eloRating: INITIAL_ELO,
      eloTrend: [INITIAL_ELO],
      consistency: 0.5,
      lastUpdated: Date.now(),
    };
  };
  
  // Calculate alliance ELO and predicted scores
  const redStats = match.redAlliance.map(getStats);
  const blueStats = match.blueAlliance.map(getStats);
  
  const redElo = redStats.reduce((sum, s) => sum + s.eloRating, 0) / redStats.length;
  const blueElo = blueStats.reduce((sum, s) => sum + s.eloRating, 0) / blueStats.length;
  
  const predictedRedScore = redStats.reduce((sum, s) => sum + s.avgTotalPoints, 0);
  const predictedBlueScore = blueStats.reduce((sum, s) => sum + s.avgTotalPoints, 0);
  
  // Calculate win probability using ELO
  const redWinProbability = calculateExpectedScore(redElo, blueElo);
  const blueWinProbability = 1 - redWinProbability;
  
  // Calculate momentum (recent ELO trend)
  const calculateMomentum = (stats: TeamStats[]): number => {
    return stats.reduce((sum, s) => {
      const trend = s.eloTrend;
      if (trend.length < 2) return sum;
      return sum + (trend[trend.length - 1] - trend[0]) / trend.length;
    }, 0) / stats.length;
  };
  
  const redMomentum = calculateMomentum(redStats);
  const blueMomentum = calculateMomentum(blueStats);
  
  // Calculate confidence band based on consistency and match count
  const avgConsistency = [...redStats, ...blueStats].reduce((sum, s) => sum + s.consistency, 0) / 4;
  const avgMatches = [...redStats, ...blueStats].reduce((sum, s) => sum + s.matchesPlayed, 0) / 4;
  const confidenceBand = Math.max(0.1, 0.5 - (avgConsistency * 0.2) - (Math.min(avgMatches, 10) * 0.02));
  
  return {
    matchId: match.id,
    redWinProbability: Math.round(redWinProbability * 1000) / 1000,
    blueWinProbability: Math.round(blueWinProbability * 1000) / 1000,
    predictedRedScore: Math.round(predictedRedScore),
    predictedBlueScore: Math.round(predictedBlueScore),
    confidenceBand: Math.round(confidenceBand * 100) / 100,
    factors: {
      redElo: Math.round(redElo),
      blueElo: Math.round(blueElo),
      redMomentum: Math.round(redMomentum * 10) / 10,
      blueMomentum: Math.round(blueMomentum * 10) / 10,
    },
    createdAt: Date.now(),
  };
};

// Batch calculate all team stats for an event
export const calculateAllTeamStats = (
  teams: number[],
  eventId: string,
  entries: ScoutEntry[],
  existingStats?: Map<number, TeamStats>
): Map<number, TeamStats> => {
  const statsMap = new Map<number, TeamStats>();
  
  teams.forEach(teamNumber => {
    const previousRating = existingStats?.get(teamNumber)?.eloRating ?? INITIAL_ELO;
    const stats = calculateTeamStats(teamNumber, eventId, entries, previousRating);
    statsMap.set(teamNumber, stats);
  });
  
  return statsMap;
};
