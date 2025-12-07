import type { Match, TeamStats } from '@/models/DataModels';
import { calculateExpectedScore, INITIAL_ELO } from './AnalysisEngine';

export interface SimulationResult {
    matchId: string;
    redWinProbability: number;
    blueWinProbability: number;
    predictedRedScore: number;
    predictedBlueScore: number;
    confidenceInterval: {
        redScoreLow: number;
        redScoreHigh: number;
        blueScoreLow: number;
        blueScoreHigh: number;
    };
    simulations: number;
    variance: number;
}

export interface WhatIfScenario {
    scenarioName: string;
    redAlliance: number[];
    blueAlliance: number[];
    result: SimulationResult;
}

// Monte Carlo Simulation - Run thousands of match simulations
export const runMonteCarloSimulation = (
    match: Match,
    teamStatsMap: Map<number, TeamStats>,
    iterations: number = 10000
): SimulationResult => {
    const getStats = (teamNumber: number): TeamStats => {
        return teamStatsMap.get(teamNumber) || createDefaultStats(teamNumber, match.eventId);
    };

    const redStats = match.redAlliance.map(getStats);
    const blueStats = match.blueAlliance.map(getStats);

    let redWins = 0;
    const redScores: number[] = [];
    const blueScores: number[] = [];

    // Run simulations
    for (let i = 0; i < iterations; i++) {
        const redScore = simulateAllianceScore(redStats);
        const blueScore = simulateAllianceScore(blueStats);

        redScores.push(redScore);
        blueScores.push(blueScore);

        if (redScore > blueScore) redWins++;
    }

    // Calculate statistics
    const avgRedScore = average(redScores);
    const avgBlueScore = average(blueScores);
    const redStdDev = standardDeviation(redScores, avgRedScore);
    const blueStdDev = standardDeviation(blueScores, avgBlueScore);

    // 95% confidence interval (±1.96 standard deviations)
    const confidenceMultiplier = 1.96;

    return {
        matchId: match.id,
        redWinProbability: redWins / iterations,
        blueWinProbability: (iterations - redWins) / iterations,
        predictedRedScore: Math.round(avgRedScore),
        predictedBlueScore: Math.round(avgBlueScore),
        confidenceInterval: {
            redScoreLow: Math.max(0, Math.round(avgRedScore - confidenceMultiplier * redStdDev)),
            redScoreHigh: Math.round(avgRedScore + confidenceMultiplier * redStdDev),
            blueScoreLow: Math.max(0, Math.round(avgBlueScore - confidenceMultiplier * blueStdDev)),
            blueScoreHigh: Math.round(avgBlueScore + confidenceMultiplier * blueStdDev),
        },
        simulations: iterations,
        variance: (redStdDev + blueStdDev) / 2,
    };
};

// Simulate a single alliance's score with variance
const simulateAllianceScore = (teamStats: TeamStats[]): number => {
    let totalScore = 0;

    teamStats.forEach(stats => {
        // Add variance based on consistency
        const variance = 1 - stats.consistency;
        const randomFactor = 1 + (Math.random() - 0.5) * variance;

        // Simulate auto points
        const autoSamples = Math.max(0, Math.round(stats.avgAutoSamples * randomFactor));
        const autoSpecimens = Math.max(0, Math.round(stats.avgAutoSpecimens * randomFactor));
        const autoPoints = autoSamples * 6 + autoSpecimens * 10;

        // Simulate teleop points
        const teleopSamples = Math.max(0, Math.round(stats.avgTeleopSamples * randomFactor));
        const teleopSpecimens = Math.max(0, Math.round(stats.avgTeleopSpecimens * randomFactor));
        const teleopPoints = teleopSamples * 4 + teleopSpecimens * 8;

        // Simulate endgame (probabilistic)
        let endgamePoints = 0;
        if (Math.random() < stats.hangSuccessRate) {
            // Assume high hang is more common if success rate is high
            endgamePoints = stats.hangSuccessRate > 0.7 ? 30 : 15;
        }

        totalScore += autoPoints + teleopPoints + endgamePoints;
    });

    return totalScore;
};

// What-If Scenario Analysis
export const analyzeWhatIfScenario = (
    scenarioName: string,
    redAlliance: number[],
    blueAlliance: number[],
    eventId: string,
    teamStatsMap: Map<number, TeamStats>
): WhatIfScenario => {
    const mockMatch: Match = {
        id: `scenario-${Date.now()}`,
        eventId,
        matchNumber: 0,
        matchType: 'qualification',
        redAlliance,
        blueAlliance,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const result = runMonteCarloSimulation(mockMatch, teamStatsMap, 5000);

    return {
        scenarioName,
        redAlliance,
        blueAlliance,
        result,
    };
};

// Compare multiple alliance combinations
export interface AllianceCombination {
    teams: number[];
    expectedScore: number;
    winProbability: number;
    variance: number;
}

export const findOptimalAlliance = (
    availableTeams: number[],
    opponentAlliance: number[],
    eventId: string,
    teamStatsMap: Map<number, TeamStats>,
    allianceSize: number = 2
): AllianceCombination[] => {
    const combinations: AllianceCombination[] = [];

    // Generate all possible combinations
    const generateCombinations = (arr: number[], size: number): number[][] => {
        if (size === 1) return arr.map(el => [el]);
        const result: number[][] = [];
        arr.forEach((el, i) => {
            const remaining = arr.slice(i + 1);
            const subCombos = generateCombinations(remaining, size - 1);
            subCombos.forEach(combo => result.push([el, ...combo]));
        });
        return result;
    };

    const allCombos = generateCombinations(availableTeams, allianceSize);

    // Analyze each combination
    allCombos.forEach(combo => {
        const scenario = analyzeWhatIfScenario(
            'Optimization',
            combo,
            opponentAlliance,
            eventId,
            teamStatsMap
        );

        combinations.push({
            teams: combo,
            expectedScore: scenario.result.predictedRedScore,
            winProbability: scenario.result.redWinProbability,
            variance: scenario.result.variance,
        });
    });

    // Sort by win probability, then by expected score
    return combinations.sort((a, b) => {
        if (Math.abs(a.winProbability - b.winProbability) > 0.05) {
            return b.winProbability - a.winProbability;
        }
        return b.expectedScore - a.expectedScore;
    });
};

// Playoff bracket simulation
export interface PlayoffPrediction {
    round: string;
    matches: {
        matchNumber: number;
        redAlliance: number[];
        blueAlliance: number[];
        redWinProbability: number;
        predictedWinner: 'red' | 'blue';
    }[];
}

export const simulatePlayoffBracket = (
    seeds: number[][],
    eventId: string,
    teamStatsMap: Map<number, TeamStats>
): PlayoffPrediction[] => {
    const predictions: PlayoffPrediction[] = [];

    // Quarterfinals (if 8 alliances)
    if (seeds.length === 8) {
        const qfMatches = [
            { red: seeds[0], blue: seeds[7] },
            { red: seeds[1], blue: seeds[6] },
            { red: seeds[2], blue: seeds[5] },
            { red: seeds[3], blue: seeds[4] },
        ];

        predictions.push({
            round: 'Quarterfinals',
            matches: qfMatches.map((m, i) => {
                const sim = analyzeWhatIfScenario('QF', m.red, m.blue, eventId, teamStatsMap);
                return {
                    matchNumber: i + 1,
                    redAlliance: m.red,
                    blueAlliance: m.blue,
                    redWinProbability: sim.result.redWinProbability,
                    predictedWinner: sim.result.redWinProbability > 0.5 ? 'red' : 'blue',
                };
            }),
        });
    }

    return predictions;
};

// Helper functions
const average = (arr: number[]): number => {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

const standardDeviation = (arr: number[], mean: number): number => {
    const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
};

const createDefaultStats = (teamNumber: number, eventId: string): TeamStats => {
    return {
        teamNumber,
        eventId,
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
