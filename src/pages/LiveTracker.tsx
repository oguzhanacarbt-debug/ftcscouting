import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { calculateTeamStats } from '@/analysis/AnalysisEngine';
import type { Match } from '@/models/DataModels';

const LiveTracker = () => {
    const { currentEvent, matches, teams, scoutEntries } = useAppStore();
    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [nextMatches, setNextMatches] = useState<Match[]>([]);

    useEffect(() => {
        if (!currentEvent || matches.length === 0) return;

        // Find the first pending or in-progress match
        const ongoing = matches.find(m => m.status === 'in_progress');
        const upcoming = matches
            .filter(m => m.status === 'pending')
            .sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));

        setCurrentMatch(ongoing || upcoming[0] || null);
        setNextMatches(upcoming.slice(ongoing ? 0 : 1, 4));
    }, [currentEvent, matches]);

    const getTeamName = (teamNumber: number) => {
        return teams.find(t => t.number === teamNumber)?.name || `Team ${teamNumber}`;
    };

    const getPredictedScore = (teamNumbers: number[]) => {
        if (!currentEvent) return 0;

        let totalScore = 0;
        teamNumbers.forEach(num => {
            const stats = calculateTeamStats(num, currentEvent.id, scoutEntries);
            totalScore += stats.avgTotalPoints;
        });

        return Math.round(totalScore);
    };

    const getWinProbability = (redAlliance: number[], blueAlliance: number[]) => {
        const redScore = getPredictedScore(redAlliance);
        const blueScore = getPredictedScore(blueAlliance);
        const total = redScore + blueScore;

        if (total === 0) return 50;
        return Math.round((redScore / total) * 100);
    };

    const MatchCard = ({ match, isLive = false }: { match: Match; isLive?: boolean }) => {
        const redWinProb = getWinProbability(match.redAlliance, match.blueAlliance);
        const redPredicted = getPredictedScore(match.redAlliance);
        const bluePredicted = getPredictedScore(match.blueAlliance);

        return (
            <Card className={`glass border-border/50 ${isLive ? 'border-primary border-2 shadow-glow' : ''}`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                            Match {match.matchNumber}
                            {isLive && (
                                <Badge variant="destructive" className="ml-2 animate-pulse">
                                    <Activity className="w-3 h-3 mr-1" />
                                    LIVE
                                </Badge>
                            )}
                        </CardTitle>
                        {match.scheduledTime && (
                            <span className="text-sm text-muted-foreground">
                                {new Date(match.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Red Alliance */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-red-500">Red Alliance</span>
                            <div className="flex items-center gap-2">
                                {match.redScore !== undefined ? (
                                    <span className="text-2xl font-bold text-red-500">{match.redScore}</span>
                                ) : (
                                    <span className="text-lg text-muted-foreground">~{redPredicted}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {match.redAlliance.map(team => (
                                <Badge key={team} variant="outline" className="border-red-500/30 text-red-500">
                                    {team}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Win Probability Bar */}
                    {match.status === 'pending' && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{redWinProb}%</span>
                                <span>Win Probability</span>
                                <span>{100 - redWinProb}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                                <div
                                    className="bg-red-500 transition-all duration-500"
                                    style={{ width: `${redWinProb}%` }}
                                />
                                <div
                                    className="bg-blue-500 transition-all duration-500"
                                    style={{ width: `${100 - redWinProb}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Actual vs Predicted */}
                    {match.status === 'completed' && (
                        <div className="flex items-center justify-center gap-2 text-sm">
                            {match.redScore! > redPredicted ? (
                                <TrendingUp className="w-4 h-4 text-green-500" />
                            ) : match.redScore! < redPredicted ? (
                                <TrendingDown className="w-4 h-4 text-red-500" />
                            ) : (
                                <Minus className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-muted-foreground">
                                Predicted: {redPredicted} vs {bluePredicted}
                            </span>
                        </div>
                    )}

                    {/* Blue Alliance */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-blue-500">Blue Alliance</span>
                            <div className="flex items-center gap-2">
                                {match.blueScore !== undefined ? (
                                    <span className="text-2xl font-bold text-blue-500">{match.blueScore}</span>
                                ) : (
                                    <span className="text-lg text-muted-foreground">~{bluePredicted}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {match.blueAlliance.map(team => (
                                <Badge key={team} variant="outline" className="border-blue-500/30 text-blue-500">
                                    {team}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (!currentEvent) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-muted-foreground">Please select an event to view live match tracking.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-8 h-8 text-primary" />
                    Live Match Tracker
                </h1>

                {currentMatch ? (
                    <>
                        <MatchCard match={currentMatch} isLive={currentMatch.status === 'in_progress'} />

                        {nextMatches.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-foreground">Upcoming Matches</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {nextMatches.map(match => (
                                        <MatchCard key={match.id} match={match} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <Card className="glass border-border/50">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No matches scheduled or in progress.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default LiveTracker;
