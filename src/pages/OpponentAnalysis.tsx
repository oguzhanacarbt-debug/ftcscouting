import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/store/appStore';
import { calculateTeamStats } from '@/analysis/AnalysisEngine';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

const OpponentAnalysis = () => {
    const { currentEvent, teams, scoutEntries, pitScoutEntries, userTeamNumber } = useAppStore();
    const [selectedOpponent, setSelectedOpponent] = useState<number | null>(null);

    const myStats = useMemo(() => {
        if (!userTeamNumber || !currentEvent) return null;
        return calculateTeamStats(userTeamNumber, currentEvent.id, scoutEntries);
    }, [userTeamNumber, currentEvent, scoutEntries]);

    const opponentStats = useMemo(() => {
        if (!selectedOpponent || !currentEvent) return null;
        return calculateTeamStats(selectedOpponent, currentEvent.id, scoutEntries);
    }, [selectedOpponent, currentEvent, scoutEntries]);

    const opponentPitData = useMemo(() => {
        if (!selectedOpponent || !currentEvent) return null;
        return pitScoutEntries.find(p => p.teamNumber === selectedOpponent && p.eventId === currentEvent.id);
    }, [selectedOpponent, currentEvent, pitScoutEntries]);

    const getComparison = (myValue: number, theirValue: number, higherIsBetter = true) => {
        const diff = theirValue - myValue;
        const percentDiff = myValue > 0 ? (diff / myValue) * 100 : 0;

        if (Math.abs(percentDiff) < 10) return { status: 'neutral', icon: CheckCircle2, color: 'text-muted-foreground' };

        const isBetter = higherIsBetter ? diff > 0 : diff < 0;
        return isBetter
            ? { status: 'threat', icon: AlertTriangle, color: 'text-destructive' }
            : { status: 'advantage', icon: TrendingUp, color: 'text-success' };
    };

    const StatComparison = ({
        label,
        myValue,
        theirValue,
        format = (v: number) => v.toFixed(1),
        higherIsBetter = true
    }: {
        label: string;
        myValue: number;
        theirValue: number;
        format?: (v: number) => string;
        higherIsBetter?: boolean;
    }) => {
        const comparison = getComparison(myValue, theirValue, higherIsBetter);
        const Icon = comparison.icon;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{label}</span>
                    <Icon className={`w-4 h-4 ${comparison.color}`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">You</div>
                        <div className="text-lg font-bold">{format(myValue)}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Them</div>
                        <div className="text-lg font-bold">{format(theirValue)}</div>
                    </div>
                </div>
                <Progress
                    value={myValue > theirValue ? 100 : (myValue / theirValue) * 100}
                    className="h-1"
                />
            </div>
        );
    };

    if (!currentEvent) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-muted-foreground">Please select an event first.</p>
                </div>
            </AppLayout>
        );
    }

    if (!userTeamNumber) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-muted-foreground">Please set your team number on the Home page to use Opponent Analysis.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Target className="w-8 h-8 text-primary" />
                    Opponent Analysis
                </h1>

                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle>Select Opponent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedOpponent?.toString() || ''}
                            onValueChange={(v) => setSelectedOpponent(parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a team to analyze..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams
                                    .filter(t => t.number !== userTeamNumber)
                                    .map(team => (
                                        <SelectItem key={team.number} value={team.number.toString()}>
                                            {team.number} - {team.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {selectedOpponent && opponentStats && myStats && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Performance Comparison */}
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <StatComparison
                                    label="Avg Total Points"
                                    myValue={myStats.avgTotalPoints}
                                    theirValue={opponentStats.avgTotalPoints}
                                />
                                <StatComparison
                                    label="Auto Samples"
                                    myValue={myStats.avgAutoSamples}
                                    theirValue={opponentStats.avgAutoSamples}
                                />
                                <StatComparison
                                    label="TeleOp Samples"
                                    myValue={myStats.avgTeleopSamples}
                                    theirValue={opponentStats.avgTeleopSamples}
                                />
                                <StatComparison
                                    label="Hang Success Rate"
                                    myValue={myStats.hangSuccessRate}
                                    theirValue={opponentStats.hangSuccessRate}
                                    format={(v) => `${(v * 100).toFixed(0)}%`}
                                />
                            </CardContent>
                        </Card>

                        {/* Ratings Comparison */}
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Skill Ratings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <StatComparison
                                    label="ELO Rating"
                                    myValue={myStats.eloRating}
                                    theirValue={opponentStats.eloRating}
                                    format={(v) => Math.round(v).toString()}
                                />
                                <StatComparison
                                    label="Driver Skill"
                                    myValue={myStats.avgDriverSkill}
                                    theirValue={opponentStats.avgDriverSkill}
                                />
                                <StatComparison
                                    label="Robot Speed"
                                    myValue={myStats.avgRobotSpeed}
                                    theirValue={opponentStats.avgRobotSpeed}
                                />
                                <StatComparison
                                    label="Defense Rating"
                                    myValue={myStats.avgDefenseRating}
                                    theirValue={opponentStats.avgDefenseRating}
                                />
                            </CardContent>
                        </Card>

                        {/* Strategic Insights */}
                        <Card className="glass border-border/50 md:col-span-2">
                            <CardHeader>
                                <CardTitle>Strategic Insights</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-success flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Your Advantages
                                        </h3>
                                        <ul className="space-y-1 text-sm">
                                            {myStats.avgAutoSamples > opponentStats.avgAutoSamples && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-success/30 text-success">Auto</Badge>
                                                    <span>+{(myStats.avgAutoSamples - opponentStats.avgAutoSamples).toFixed(1)} samples</span>
                                                </li>
                                            )}
                                            {myStats.avgTeleopSamples > opponentStats.avgTeleopSamples && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-success/30 text-success">TeleOp</Badge>
                                                    <span>+{(myStats.avgTeleopSamples - opponentStats.avgTeleopSamples).toFixed(1)} samples</span>
                                                </li>
                                            )}
                                            {myStats.hangSuccessRate > opponentStats.hangSuccessRate && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-success/30 text-success">Endgame</Badge>
                                                    <span>+{((myStats.hangSuccessRate - opponentStats.hangSuccessRate) * 100).toFixed(0)}% hang rate</span>
                                                </li>
                                            )}
                                            {myStats.avgDriverSkill > opponentStats.avgDriverSkill && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-success/30 text-success">Driving</Badge>
                                                    <span>Superior driver control</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="font-semibold text-destructive flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4" />
                                            Their Advantages
                                        </h3>
                                        <ul className="space-y-1 text-sm">
                                            {opponentStats.avgAutoSamples > myStats.avgAutoSamples && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-destructive/30 text-destructive">Auto</Badge>
                                                    <span>+{(opponentStats.avgAutoSamples - myStats.avgAutoSamples).toFixed(1)} samples</span>
                                                </li>
                                            )}
                                            {opponentStats.avgTeleopSamples > myStats.avgTeleopSamples && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-destructive/30 text-destructive">TeleOp</Badge>
                                                    <span>+{(opponentStats.avgTeleopSamples - myStats.avgTeleopSamples).toFixed(1)} samples</span>
                                                </li>
                                            )}
                                            {opponentStats.hangSuccessRate > myStats.hangSuccessRate && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-destructive/30 text-destructive">Endgame</Badge>
                                                    <span>+{((opponentStats.hangSuccessRate - myStats.hangSuccessRate) * 100).toFixed(0)}% hang rate</span>
                                                </li>
                                            )}
                                            {opponentStats.avgDriverSkill > myStats.avgDriverSkill && (
                                                <li className="flex items-center gap-2">
                                                    <Badge variant="outline" className="border-destructive/30 text-destructive">Driving</Badge>
                                                    <span>Superior driver control</span>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>

                                {opponentPitData && (
                                    <div className="pt-4 border-t border-border/50">
                                        <h3 className="font-semibold mb-2">Pit Scouting Notes</h3>
                                        <div className="grid gap-2 text-sm">
                                            <div><span className="text-muted-foreground">Drive:</span> {opponentPitData.driveType}</div>
                                            <div><span className="text-muted-foreground">Vision:</span> {opponentPitData.hasVision ? 'Yes' : 'No'}</div>
                                            {opponentPitData.strengths && (
                                                <div><span className="text-muted-foreground">Strengths:</span> {opponentPitData.strengths}</div>
                                            )}
                                            {opponentPitData.weaknesses && (
                                                <div><span className="text-muted-foreground">Weaknesses:</span> {opponentPitData.weaknesses}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default OpponentAnalysis;
