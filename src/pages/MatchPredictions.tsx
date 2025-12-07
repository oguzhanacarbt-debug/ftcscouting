import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { calculateAllTeamStats } from '@/analysis/AnalysisEngine';
import { runMonteCarloSimulation, analyzeWhatIfScenario, findOptimalAlliance } from '@/analysis/SimulationEngine';
import { Zap, TrendingUp, Target, Sparkles, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const MatchPredictions = () => {
    const { currentEvent, teams, matches, scoutEntries } = useAppStore();
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [simulating, setSimulating] = useState(false);
    const [whatIfRed, setWhatIfRed] = useState<number[]>([]);
    const [whatIfBlue, setWhatIfBlue] = useState<number[]>([]);

    const teamStatsMap = useMemo(() => {
        if (!currentEvent || teams.length === 0) return new Map();
        return calculateAllTeamStats(teams.map(t => t.number), currentEvent.id, scoutEntries);
    }, [currentEvent, teams, scoutEntries]);

    const pendingMatches = useMemo(() => {
        return matches.filter(m => m.status === 'pending').sort((a, b) => (a.scheduledTime || 0) - (b.scheduledTime || 0));
    }, [matches]);

    const selectedMatchData = useMemo(() => {
        return matches.find(m => m.id === selectedMatch);
    }, [selectedMatch, matches]);

    const simulation = useMemo(() => {
        if (!selectedMatchData) return null;
        return runMonteCarloSimulation(selectedMatchData, teamStatsMap, 10000);
    }, [selectedMatchData, teamStatsMap]);

    const whatIfSimulation = useMemo(() => {
        if (whatIfRed.length < 2 || whatIfBlue.length < 2 || !currentEvent) return null;
        return analyzeWhatIfScenario('Custom Scenario', whatIfRed, whatIfBlue, currentEvent.id, teamStatsMap);
    }, [whatIfRed, whatIfBlue, currentEvent, teamStatsMap]);

    const optimalAlliances = useMemo(() => {
        if (whatIfBlue.length < 2 || !currentEvent) return [];
        const available = teams.map(t => t.number).filter(n => !whatIfBlue.includes(n));
        return findOptimalAlliance(available, whatIfBlue, currentEvent.id, teamStatsMap, 2).slice(0, 10);
    }, [whatIfBlue, teams, currentEvent, teamStatsMap]);

    const runSimulation = () => {
        setSimulating(true);
        setTimeout(() => setSimulating(false), 1500);
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
                        <Sparkles className="w-8 h-8 text-primary" />
                        Match Predictions & Simulation
                    </h1>
                </div>

                {/* Match Prediction Section */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Monte Carlo Match Simulation
                        </CardTitle>
                        <CardDescription>
                            Run 10,000 simulations to predict match outcomes with confidence intervals
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 block">Select Match</label>
                                <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a match..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pendingMatches.map(m => (
                                            <SelectItem key={m.id} value={m.id}>
                                                Match {m.matchNumber} - Red: {m.redAlliance.join(', ')} vs Blue: {m.blueAlliance.join(', ')}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={runSimulation} disabled={!selectedMatch || simulating} className="gap-2">
                                <RefreshCw className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
                                {simulating ? 'Simulating...' : 'Run Simulation'}
                            </Button>
                        </div>

                        {simulation && selectedMatchData && (
                            <div className="space-y-6 animate-fade-in">
                                {/* Win Probability */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <div className="text-center flex-1">
                                            <div className="text-sm text-muted-foreground mb-1">Red Alliance</div>
                                            <div className="text-3xl font-bold text-red-500">
                                                {(simulation.redWinProbability * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {selectedMatchData.redAlliance.join(', ')}
                                            </div>
                                        </div>
                                        <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
                                        <div className="text-center flex-1">
                                            <div className="text-sm text-muted-foreground mb-1">Blue Alliance</div>
                                            <div className="text-3xl font-bold text-blue-500">
                                                {(simulation.blueWinProbability * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {selectedMatchData.blueAlliance.join(', ')}
                                            </div>
                                        </div>
                                    </div>
                                    <Progress
                                        value={simulation.redWinProbability * 100}
                                        className="h-3"
                                    />
                                </div>

                                {/* Predicted Scores */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Card className="bg-red-500/5 border-red-500/20">
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground mb-2">Predicted Red Score</div>
                                                <div className="text-4xl font-bold text-red-500 mb-2">
                                                    {simulation.predictedRedScore}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    95% CI: {simulation.confidenceInterval.redScoreLow} - {simulation.confidenceInterval.redScoreHigh}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-blue-500/5 border-blue-500/20">
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <div className="text-sm text-muted-foreground mb-2">Predicted Blue Score</div>
                                                <div className="text-4xl font-bold text-blue-500 mb-2">
                                                    {simulation.predictedBlueScore}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    95% CI: {simulation.confidenceInterval.blueScoreLow} - {simulation.confidenceInterval.blueScoreHigh}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                                    <Badge variant="outline">
                                        {simulation.simulations.toLocaleString()} simulations
                                    </Badge>
                                    <Badge variant="outline">
                                        Variance: {simulation.variance.toFixed(1)}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* What-If Scenario */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            What-If Scenario Builder
                        </CardTitle>
                        <CardDescription>
                            Create custom alliance combinations and see predicted outcomes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Red Alliance Builder */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-red-500">Red Alliance</label>
                                <div className="space-y-2">
                                    {[0, 1].map(idx => (
                                        <Select
                                            key={idx}
                                            value={whatIfRed[idx]?.toString() || ''}
                                            onValueChange={(val) => {
                                                const newRed = [...whatIfRed];
                                                newRed[idx] = parseInt(val);
                                                setWhatIfRed(newRed);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Team ${idx + 1}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teams.map(t => (
                                                    <SelectItem key={t.number} value={t.number.toString()}>
                                                        {t.number} - {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ))}
                                </div>
                            </div>

                            {/* Blue Alliance Builder */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium text-blue-500">Blue Alliance</label>
                                <div className="space-y-2">
                                    {[0, 1].map(idx => (
                                        <Select
                                            key={idx}
                                            value={whatIfBlue[idx]?.toString() || ''}
                                            onValueChange={(val) => {
                                                const newBlue = [...whatIfBlue];
                                                newBlue[idx] = parseInt(val);
                                                setWhatIfBlue(newBlue);
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={`Team ${idx + 1}`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teams.map(t => (
                                                    <SelectItem key={t.number} value={t.number.toString()}>
                                                        {t.number} - {t.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {whatIfSimulation && (
                            <div className="space-y-4 animate-fade-in border-t border-border pt-6">
                                <div className="flex justify-between items-center">
                                    <div className="text-center flex-1">
                                        <div className="text-2xl font-bold text-red-500">
                                            {(whatIfSimulation.result.redWinProbability * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Win Probability</div>
                                    </div>
                                    <div className="text-center flex-1">
                                        <div className="text-2xl font-bold text-blue-500">
                                            {(whatIfSimulation.result.blueWinProbability * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Win Probability</div>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground mb-1">Predicted Score</div>
                                    <div className="text-xl font-bold">
                                        <span className="text-red-500">{whatIfSimulation.result.predictedRedScore}</span>
                                        {' - '}
                                        <span className="text-blue-500">{whatIfSimulation.result.predictedBlueScore}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Optimal Alliance Finder */}
                {whatIfBlue.length >= 2 && (
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                Optimal Alliance Partners
                            </CardTitle>
                            <CardDescription>
                                Best 2-team combinations to beat Blue: {whatIfBlue.join(', ')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {optimalAlliances.slice(0, 5).map((combo, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-lg px-3">
                                                #{idx + 1}
                                            </Badge>
                                            <div>
                                                <div className="font-semibold">
                                                    Teams: {combo.teams.join(' + ')}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Expected Score: {combo.expectedScore} pts
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-500">
                                                {(combo.winProbability * 100).toFixed(1)}%
                                            </div>
                                            <div className="text-xs text-muted-foreground">Win Rate</div>
                                        </div>
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

export default MatchPredictions;
