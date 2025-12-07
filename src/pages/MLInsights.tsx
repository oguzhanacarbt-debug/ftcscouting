import { useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { calculateAllTeamStats } from '@/analysis/AnalysisEngine';
import {
    classifyTeam,
    detectAnomalies,
    analyzePerformanceTrend,
    recommendAlliancePartners,
    predictMechanicalIssues,
} from '@/analysis/MLAnalytics';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Users, Wrench, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MLInsights = () => {
    const { currentEvent, teams, scoutEntries } = useAppStore();
    const [selectedTeam, setSelectedTeam] = useState<string>('');

    const teamStatsMap = useMemo(() => {
        if (!currentEvent || teams.length === 0) return new Map();
        return calculateAllTeamStats(teams.map(t => t.number), currentEvent.id, scoutEntries);
    }, [currentEvent, teams, scoutEntries]);

    const selectedTeamNumber = selectedTeam ? parseInt(selectedTeam) : null;
    const selectedTeamStats = selectedTeamNumber ? teamStatsMap.get(selectedTeamNumber) : null;

    const classification = useMemo(() => {
        if (!selectedTeamNumber || !selectedTeamStats) return null;
        return classifyTeam(selectedTeamNumber, selectedTeamStats, scoutEntries);
    }, [selectedTeamNumber, selectedTeamStats, scoutEntries]);

    const anomalies = useMemo(() => {
        if (!selectedTeamNumber || !selectedTeamStats) return [];
        return detectAnomalies(selectedTeamNumber, scoutEntries, selectedTeamStats);
    }, [selectedTeamNumber, selectedTeamStats, scoutEntries]);

    const trend = useMemo(() => {
        if (!selectedTeamNumber || !selectedTeamStats) return null;
        return analyzePerformanceTrend(selectedTeamNumber, scoutEntries, selectedTeamStats);
    }, [selectedTeamNumber, selectedTeamStats, scoutEntries]);

    const recommendations = useMemo(() => {
        if (!selectedTeamNumber) return [];
        const available = teams.map(t => t.number);
        return recommendAlliancePartners(selectedTeamNumber, available, teamStatsMap, scoutEntries).slice(0, 5);
    }, [selectedTeamNumber, teams, teamStatsMap, scoutEntries]);

    const mechanicalConcerns = useMemo(() => {
        if (!selectedTeamNumber) return null;
        return predictMechanicalIssues(selectedTeamNumber, scoutEntries);
    }, [selectedTeamNumber, scoutEntries]);

    const allAnomalies = useMemo(() => {
        const all: any[] = [];
        teams.forEach(team => {
            const stats = teamStatsMap.get(team.number);
            if (stats) {
                const teamAnomalies = detectAnomalies(team.number, scoutEntries, stats);
                all.push(...teamAnomalies);
            }
        });
        return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
    }, [teams, teamStatsMap, scoutEntries]);

    const trendChartData = useMemo(() => {
        if (!trend) return [];
        return trend.recentPerformance.map((score, idx) => ({
            match: idx + 1,
            score,
        }));
    }, [trend]);

    const getArchetypeColor = (archetype: string) => {
        switch (archetype) {
            case 'scorer': return 'bg-green-500/10 text-green-600 border-green-500/20';
            case 'defender': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'specialist': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'balanced': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            case 'inconsistent': return 'bg-red-500/10 text-red-600 border-red-500/20';
            default: return 'bg-muted';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />;
            default: return <Target className="w-4 h-4 text-muted-foreground" />;
        }
    };

    if (!currentEvent) {
        return (
            <AppLayout>
                <div className="text-center py-16">
                    <h2 className="text-xl font-semibold">No event selected</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Brain className="w-8 h-8 text-primary" />
                        ML-Powered Insights
                    </h1>
                </div>

                {/* Team Selector */}
                <Card className="glass border-border/50">
                    <CardContent className="pt-6">
                        <div className="flex gap-4 items-center">
                            <label className="text-sm font-medium">Analyze Team:</label>
                            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="Select a team..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {teams.map(t => (
                                        <SelectItem key={t.number} value={t.number.toString()}>
                                            {t.number} - {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {selectedTeamNumber && (
                    <>
                        {/* Team Classification */}
                        {classification && (
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-primary" />
                                        Team Classification
                                    </CardTitle>
                                    <CardDescription>AI-powered team archetype analysis</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <Badge className={`text-lg px-4 py-2 ${getArchetypeColor(classification.archetype)}`}>
                                            {classification.archetype.toUpperCase()}
                                        </Badge>
                                        <div className="text-sm text-muted-foreground">
                                            Confidence: {(classification.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium">Characteristics</div>
                                            <div className="space-y-1">
                                                {classification.characteristics.map((char, idx) => (
                                                    <Badge key={idx} variant="outline" className="mr-2">
                                                        {char}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-green-600">Strengths</div>
                                            <div className="space-y-1">
                                                {classification.strengths.map((str, idx) => (
                                                    <div key={idx} className="text-sm text-muted-foreground">• {str}</div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-red-600">Weaknesses</div>
                                            <div className="space-y-1">
                                                {classification.weaknesses.map((weak, idx) => (
                                                    <div key={idx} className="text-sm text-muted-foreground">• {weak}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Performance Trend */}
                        {trend && trend.recentPerformance.length > 0 && (
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {getTrendIcon(trend.trend)}
                                        Performance Trend Analysis
                                    </CardTitle>
                                    <CardDescription>
                                        Trend: <span className="font-semibold capitalize">{trend.trend}</span> (Strength: {trend.trendStrength.toFixed(2)})
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={trendChartData}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                <XAxis dataKey="match" stroke="#888" />
                                                <YAxis stroke="#888" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                                    labelStyle={{ color: '#fff' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="score"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3b82f6', r: 5 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="flex items-center justify-center gap-8 pt-4 border-t border-border">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">{trend.prediction.nextMatchScore}</div>
                                            <div className="text-sm text-muted-foreground">Predicted Next Score</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-500">
                                                {(trend.prediction.confidence * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Confidence</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Anomaly Detection */}
                        {anomalies.length > 0 && (
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                        Anomalies Detected
                                    </CardTitle>
                                    <CardDescription>Unusual performances requiring attention</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {anomalies.map((anomaly, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-4 rounded-lg border ${anomaly.type === 'exceptional'
                                                        ? 'bg-green-500/5 border-green-500/20'
                                                        : anomaly.type === 'underperformance'
                                                            ? 'bg-red-500/5 border-red-500/20'
                                                            : 'bg-yellow-500/5 border-yellow-500/20'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-semibold mb-1">{anomaly.description}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Expected: {anomaly.expectedValue} | Actual: {anomaly.actualValue}
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={anomaly.severity === 'high' ? 'destructive' : 'outline'}
                                                        className="ml-4"
                                                    >
                                                        {anomaly.severity}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Mechanical Issues Prediction */}
                        {mechanicalConcerns && mechanicalConcerns.hasConcern && (
                            <Card className="glass border-destructive/50 bg-destructive/5">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <Wrench className="w-5 h-5" />
                                        Potential Mechanical Issues
                                    </CardTitle>
                                    <CardDescription>
                                        Confidence: {(mechanicalConcerns.confidence * 100).toFixed(0)}%
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {mechanicalConcerns.concerns.map((concern, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <AlertTriangle className="w-4 h-4 text-destructive" />
                                                <span>{concern}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Alliance Recommendations */}
                        {recommendations.length > 0 && (
                            <Card className="glass border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Recommended Alliance Partners
                                    </CardTitle>
                                    <CardDescription>AI-powered complementary team analysis</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recommendations.map((rec, idx) => (
                                            <div
                                                key={idx}
                                                className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-lg px-3">#{idx + 1}</Badge>
                                                        <div className="font-semibold text-lg">Team {rec.teamNumber}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm text-muted-foreground">Match Score</div>
                                                        <div className="text-xl font-bold text-primary">{rec.score}</div>
                                                    </div>
                                                </div>

                                                {rec.synergies.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="text-xs font-medium text-green-600 mb-1">Synergies:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {rec.synergies.map((syn, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                                                                    {syn}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {rec.concerns.length > 0 && (
                                                    <div>
                                                        <div className="text-xs font-medium text-yellow-600 mb-1">Concerns:</div>
                                                        <div className="flex flex-wrap gap-1">
                                                            {rec.concerns.map((con, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600">
                                                                    {con}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </>
                )}

                {/* Recent Anomalies Across All Teams */}
                {!selectedTeamNumber && allAnomalies.length > 0 && (
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                Recent Anomalies (All Teams)
                            </CardTitle>
                            <CardDescription>Notable performances across the event</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {allAnomalies.map((anomaly, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">Team {anomaly.teamNumber}</Badge>
                                            <span className="text-sm">{anomaly.description}</span>
                                        </div>
                                        <Badge variant={anomaly.type === 'exceptional' ? 'default' : 'destructive'}>
                                            {anomaly.type}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default MLInsights;
