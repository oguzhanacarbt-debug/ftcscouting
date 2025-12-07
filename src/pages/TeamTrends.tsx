import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const TeamTrends = () => {
    const { currentEvent, teams, scoutEntries } = useAppStore();
    const [selectedTeam, setSelectedTeam] = useState<number | null>(null);

    const trendData = useMemo(() => {
        if (!selectedTeam || !currentEvent) return [];

        const teamEntries = scoutEntries
            .filter(e => e.teamNumber === selectedTeam && e.eventId === currentEvent.id)
            .sort((a, b) => a.createdAt - b.createdAt);

        return teamEntries.map((entry, index) => ({
            match: index + 1,
            autoPoints: entry.autoSampleScored * 6 + entry.autoSpecimenScored * 10,
            teleopPoints: entry.teleopSampleScored * 4 + entry.teleopSpecimenScored * 6,
            endgamePoints: entry.endgameHanging === 'high' ? 15 : entry.endgameHanging === 'low' ? 3 : 0,
            totalPoints:
                (entry.autoSampleScored * 6 + entry.autoSpecimenScored * 10) +
                (entry.teleopSampleScored * 4 + entry.teleopSpecimenScored * 6) +
                (entry.endgameHanging === 'high' ? 15 : entry.endgameHanging === 'low' ? 3 : 0),
            driverSkill: entry.driverSkill,
            robotSpeed: entry.robotSpeed,
            defenseRating: entry.defenseRating,
        }));
    }, [selectedTeam, currentEvent, scoutEntries]);

    const performanceBreakdown = useMemo(() => {
        if (trendData.length === 0) return [];

        const avgAuto = trendData.reduce((sum, d) => sum + d.autoPoints, 0) / trendData.length;
        const avgTeleop = trendData.reduce((sum, d) => sum + d.teleopPoints, 0) / trendData.length;
        const avgEndgame = trendData.reduce((sum, d) => sum + d.endgamePoints, 0) / trendData.length;

        return [
            { phase: 'Auto', points: Math.round(avgAuto) },
            { phase: 'TeleOp', points: Math.round(avgTeleop) },
            { phase: 'Endgame', points: Math.round(avgEndgame) },
        ];
    }, [trendData]);

    if (!currentEvent) {
        return (
            <AppLayout>
                <div className="max-w-4xl mx-auto text-center py-12">
                    <p className="text-muted-foreground">Please select an event first.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-primary" />
                    Team Performance Trends
                </h1>

                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle>Select Team</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedTeam?.toString() || ''}
                            onValueChange={(v) => setSelectedTeam(parseInt(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(team => (
                                    <SelectItem key={team.number} value={team.number.toString()}>
                                        {team.number} - {team.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {selectedTeam && trendData.length > 0 && (
                    <div className="grid gap-6">
                        {/* Points Over Time */}
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Points Progression</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="match"
                                            stroke="hsl(var(--muted-foreground))"
                                            label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="totalPoints"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            name="Total Points"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="autoPoints"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            name="Auto Points"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="teleopPoints"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            name="TeleOp Points"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Performance Breakdown */}
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Average Points by Phase</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performanceBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="phase" stroke="hsl(var(--muted-foreground))" />
                                        <YAxis stroke="hsl(var(--muted-foreground))" />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))'
                                            }}
                                        />
                                        <Bar dataKey="points" fill="hsl(var(--primary))" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Skills Over Time */}
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Skills Ratings Over Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis
                                            dataKey="match"
                                            stroke="hsl(var(--muted-foreground))"
                                            label={{ value: 'Match Number', position: 'insideBottom', offset: -5 }}
                                        />
                                        <YAxis
                                            stroke="hsl(var(--muted-foreground))"
                                            domain={[0, 5]}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))'
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="driverSkill"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            name="Driver Skill"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="robotSpeed"
                                            stroke="#8b5cf6"
                                            strokeWidth={2}
                                            name="Robot Speed"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="defenseRating"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            name="Defense"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {selectedTeam && trendData.length === 0 && (
                    <Card className="glass border-border/50">
                        <CardContent className="py-12 text-center">
                            <p className="text-muted-foreground">No scouting data available for this team yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
};

export default TeamTrends;
