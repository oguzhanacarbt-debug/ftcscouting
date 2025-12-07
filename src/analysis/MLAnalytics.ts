import type { ScoutEntry, TeamStats, Team } from '@/models/DataModels';

export type TeamArchetype = 'scorer' | 'defender' | 'specialist' | 'balanced' | 'inconsistent';

export interface TeamClassification {
    teamNumber: number;
    archetype: TeamArchetype;
    confidence: number;
    characteristics: string[];
    strengths: string[];
    weaknesses: string[];
}

export interface AnomalyDetection {
    teamNumber: number;
    matchId: string;
    type: 'exceptional' | 'underperformance' | 'unusual_pattern';
    severity: 'low' | 'medium' | 'high';
    description: string;
    expectedValue: number;
    actualValue: number;
    deviation: number;
}

export interface PerformanceTrend {
    teamNumber: number;
    trend: 'improving' | 'declining' | 'stable' | 'volatile';
    trendStrength: number; // -1 to 1
    recentPerformance: number[];
    prediction: {
        nextMatchScore: number;
        confidence: number;
    };
}

export interface TeamRecommendation {
    teamNumber: number;
    score: number;
    reasons: string[];
    synergies: string[];
    concerns: string[];
}

// Classify teams into archetypes using clustering-like approach
export const classifyTeam = (
    teamNumber: number,
    stats: TeamStats,
    entries: ScoutEntry[]
): TeamClassification => {
    const characteristics: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    // Analyze scoring patterns
    const autoFocus = stats.avgAutoSamples + stats.avgAutoSpecimens;
    const teleopFocus = stats.avgTeleopSamples + stats.avgTeleopSpecimens;
    const endgameFocus = stats.hangSuccessRate;

    // Determine archetype
    let archetype: TeamArchetype = 'balanced';
    let confidence = 0;

    // Scorer: High teleop, consistent
    if (teleopFocus > 6 && stats.consistency > 0.7) {
        archetype = 'scorer';
        confidence = 0.85;
        characteristics.push('High-volume scorer');
        strengths.push('Consistent teleop performance');
    }
    // Defender: Low scoring, high defense rating
    else if (stats.avgDefenseRating > 3.5 && stats.avgTotalPoints < 45) {
        archetype = 'defender';
        confidence = 0.75;
        characteristics.push('Defensive specialist');
        strengths.push('Strong defensive capabilities');
    }
    // Specialist: Excels in one area
    else if (autoFocus > 4 || endgameFocus > 0.8) {
        archetype = 'specialist';
        confidence = 0.7;
        if (autoFocus > 4) {
            characteristics.push('Autonomous specialist');
            strengths.push('Reliable auto routine');
        }
        if (endgameFocus > 0.8) {
            characteristics.push('Endgame specialist');
            strengths.push('Consistent hanging');
        }
    }
    // Inconsistent: Low consistency
    else if (stats.consistency < 0.4) {
        archetype = 'inconsistent';
        confidence = 0.8;
        characteristics.push('Unpredictable performance');
        weaknesses.push('High variance in scores');
    }
    // Balanced: Good all-around
    else {
        archetype = 'balanced';
        confidence = 0.65;
        characteristics.push('Well-rounded robot');
    }

    // Add specific strengths
    if (stats.avgDriverSkill > 4) strengths.push('Excellent driver control');
    if (stats.avgRobotSpeed > 4) strengths.push('Fast cycle times');
    if (stats.autoSuccessRate > 0.8) strengths.push('Reliable autonomous');

    // Add weaknesses
    if (stats.avgDriverSkill < 2.5) weaknesses.push('Driver control issues');
    if (stats.avgTotalPoints < 35) weaknesses.push('Low scoring output');
    if (stats.hangSuccessRate < 0.3) weaknesses.push('Unreliable endgame');

    return {
        teamNumber,
        archetype,
        confidence,
        characteristics,
        strengths,
        weaknesses,
    };
};

// Detect anomalies in team performance
export const detectAnomalies = (
    teamNumber: number,
    entries: ScoutEntry[],
    stats: TeamStats
): AnomalyDetection[] => {
    const anomalies: AnomalyDetection[] = [];
    const teamEntries = entries.filter(e => e.teamNumber === teamNumber);

    teamEntries.forEach(entry => {
        // Calculate actual performance
        const autoPoints = entry.autoSampleScored * 6 + entry.autoSpecimenScored * 10;
        const teleopPoints = entry.teleopSampleScored * 4 + entry.teleopSpecimenScored * 8;
        const totalPoints = autoPoints + teleopPoints;

        // Check for exceptional performance
        const deviation = (totalPoints - stats.avgTotalPoints) / (stats.avgTotalPoints || 1);

        if (deviation > 0.5 && stats.matchesPlayed > 3) {
            anomalies.push({
                teamNumber,
                matchId: entry.matchId,
                type: 'exceptional',
                severity: deviation > 1 ? 'high' : 'medium',
                description: `Scored ${Math.round(deviation * 100)}% above average`,
                expectedValue: Math.round(stats.avgTotalPoints),
                actualValue: totalPoints,
                deviation: Math.round(deviation * 100) / 100,
            });
        }

        if (deviation < -0.5 && stats.matchesPlayed > 3) {
            anomalies.push({
                teamNumber,
                matchId: entry.matchId,
                type: 'underperformance',
                severity: deviation < -1 ? 'high' : 'medium',
                description: `Scored ${Math.round(Math.abs(deviation) * 100)}% below average`,
                expectedValue: Math.round(stats.avgTotalPoints),
                actualValue: totalPoints,
                deviation: Math.round(deviation * 100) / 100,
            });
        }

        // Check for unusual patterns
        if (entry.autoSampleScored === 0 && stats.avgAutoSamples > 2) {
            anomalies.push({
                teamNumber,
                matchId: entry.matchId,
                type: 'unusual_pattern',
                severity: 'medium',
                description: 'Failed autonomous routine (usually reliable)',
                expectedValue: Math.round(stats.avgAutoSamples),
                actualValue: 0,
                deviation: -1,
            });
        }
    });

    return anomalies;
};

// Analyze performance trends
export const analyzePerformanceTrend = (
    teamNumber: number,
    entries: ScoutEntry[],
    stats: TeamStats
): PerformanceTrend => {
    const teamEntries = entries
        .filter(e => e.teamNumber === teamNumber)
        .sort((a, b) => a.createdAt - b.createdAt);

    if (teamEntries.length < 3) {
        return {
            teamNumber,
            trend: 'stable',
            trendStrength: 0,
            recentPerformance: [],
            prediction: {
                nextMatchScore: Math.round(stats.avgTotalPoints),
                confidence: 0.5,
            },
        };
    }

    // Calculate scores for each match
    const scores = teamEntries.map(entry => {
        const auto = entry.autoSampleScored * 6 + entry.autoSpecimenScored * 10;
        const teleop = entry.teleopSampleScored * 4 + entry.teleopSpecimenScored * 8;
        return auto + teleop;
    });

    // Linear regression to find trend
    const n = scores.length;
    const indices = scores.map((_, i) => i);
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = scores.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * scores[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Determine trend
    let trend: PerformanceTrend['trend'] = 'stable';
    const trendStrength = slope / (stats.avgTotalPoints || 1);

    if (Math.abs(trendStrength) < 0.05) {
        trend = 'stable';
    } else if (trendStrength > 0.15) {
        trend = 'improving';
    } else if (trendStrength < -0.15) {
        trend = 'declining';
    } else if (stats.consistency < 0.4) {
        trend = 'volatile';
    }

    // Predict next match score
    const nextMatchScore = Math.max(0, Math.round(slope * n + intercept));
    const confidence = Math.min(0.95, stats.consistency);

    return {
        teamNumber,
        trend,
        trendStrength: Math.round(trendStrength * 100) / 100,
        recentPerformance: scores.slice(-5),
        prediction: {
            nextMatchScore,
            confidence,
        },
    };
};

// Recommend alliance partners based on complementary strengths
export const recommendAlliancePartners = (
    myTeamNumber: number,
    availableTeams: number[],
    teamStatsMap: Map<number, TeamStats>,
    allEntries: ScoutEntry[]
): TeamRecommendation[] => {
    const myStats = teamStatsMap.get(myTeamNumber);
    if (!myStats) return [];

    const myClassification = classifyTeam(myTeamNumber, myStats, allEntries);
    const recommendations: TeamRecommendation[] = [];

    availableTeams.forEach(teamNum => {
        if (teamNum === myTeamNumber) return;

        const theirStats = teamStatsMap.get(teamNum);
        if (!theirStats) return;

        const theirClassification = classifyTeam(teamNum, theirStats, allEntries);
        const reasons: string[] = [];
        const synergies: string[] = [];
        const concerns: string[] = [];
        let score = theirStats.eloRating;

        // Complementary analysis
        if (myStats.avgAutoSamples < 2 && theirStats.avgAutoSamples > 3) {
            synergies.push('Compensates for weak autonomous');
            score += 100;
        }

        if (myStats.hangSuccessRate < 0.5 && theirStats.hangSuccessRate > 0.8) {
            synergies.push('Reliable endgame partner');
            score += 150;
        }

        if (myStats.avgTeleopSamples < 3 && theirStats.avgTeleopSamples > 5) {
            synergies.push('Strong teleop scorer');
            score += 120;
        }

        // Archetype synergies
        if (myClassification.archetype === 'defender' && theirClassification.archetype === 'scorer') {
            synergies.push('Defense + Offense combo');
            score += 200;
        }

        if (myClassification.archetype === 'specialist' && theirClassification.archetype === 'balanced') {
            synergies.push('Specialist + Generalist balance');
            score += 100;
        }

        // Concerns
        if (theirStats.consistency < 0.4) {
            concerns.push('Inconsistent performance');
            score -= 100;
        }

        if (theirStats.avgTotalPoints < 30) {
            concerns.push('Low scoring output');
            score -= 150;
        }

        // Add reasons
        if (theirStats.eloRating > 1600) reasons.push('High ELO rating');
        if (theirStats.consistency > 0.7) reasons.push('Very consistent');
        if (theirClassification.strengths.length > 2) reasons.push('Multiple strengths');

        recommendations.push({
            teamNumber: teamNum,
            score,
            reasons,
            synergies,
            concerns,
        });
    });

    return recommendations.sort((a, b) => b.score - a.score);
};

// Predict potential mechanical issues based on performance degradation
export const predictMechanicalIssues = (
    teamNumber: number,
    entries: ScoutEntry[]
): { hasConcern: boolean; concerns: string[]; confidence: number } => {
    const teamEntries = entries
        .filter(e => e.teamNumber === teamNumber)
        .sort((a, b) => a.createdAt - b.createdAt);

    if (teamEntries.length < 4) {
        return { hasConcern: false, concerns: [], confidence: 0 };
    }

    const concerns: string[] = [];
    const recent = teamEntries.slice(-3);
    const earlier = teamEntries.slice(0, -3);

    // Calculate average speeds
    const recentSpeed = recent.reduce((sum, e) => sum + e.robotSpeed, 0) / recent.length;
    const earlierSpeed = earlier.reduce((sum, e) => sum + e.robotSpeed, 0) / earlier.length;

    if (earlierSpeed - recentSpeed > 1.5) {
        concerns.push('Significant speed degradation detected');
    }

    // Check for declining scores
    const recentScores = recent.map(e => e.teleopSampleScored + e.teleopSpecimenScored);
    const earlierScores = earlier.map(e => e.teleopSampleScored + e.teleopSpecimenScored);
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;

    if (earlierAvg - recentAvg > 3) {
        concerns.push('Declining scoring capability');
    }

    // Check for failed mechanisms
    const recentHangFailures = recent.filter(e => e.endgameHanging === 'none').length;
    const earlierHangAttempts = earlier.filter(e => e.endgameHanging !== 'none').length;

    if (earlierHangAttempts > 2 && recentHangFailures === 3) {
        concerns.push('Endgame mechanism may be failing');
    }

    const confidence = concerns.length > 0 ? Math.min(0.9, concerns.length * 0.3) : 0;

    return {
        hasConcern: concerns.length > 0,
        concerns,
        confidence,
    };
};
