import { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { calculateTeamStats } from '@/analysis/AnalysisEngine';
import { createFtcApi } from '@/api/FtcApi';
import { Award, Trophy, Zap, MapPin, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { Award as AwardType } from '@/models/DataModels';

const TeamComparison = () => {
    const { currentEvent, teams, scoutEntries, pitScoutEntries } = useAppStore();
    const [team1Id, setTeam1Id] = useState<string>('');
    const [team2Id, setTeam2Id] = useState<string>('');
    const [team1Awards, setTeam1Awards] = useState<AwardType[]>([]);
    const [team2Awards, setTeam2Awards] = useState<AwardType[]>([]);

    const team1 = teams.find(t => t.number.toString() === team1Id);
    const team2 = teams.find(t => t.number.toString() === team2Id);

    const stats1 = useMemo(() => team1 ? calculateTeamStats(team1.number, currentEvent?.id || '', scoutEntries) : null, [team1, currentEvent, scoutEntries]);
    const stats2 = useMemo(() => team2 ? calculateTeamStats(team2.number, currentEvent?.id || '', scoutEntries) : null, [team2, currentEvent, scoutEntries]);

    const pit1 = useMemo(() => pitScoutEntries.find(p => p.teamNumber.toString() === team1Id && p.eventId === currentEvent?.id), [team1Id, currentEvent, pitScoutEntries]);
    const pit2 = useMemo(() => pitScoutEntries.find(p => p.teamNumber.toString() === team2Id && p.eventId === currentEvent?.id), [team2Id, currentEvent, pitScoutEntries]);

    useEffect(() => {
        const fetchAwards = async (teamId: string, setAwards: (a: AwardType[]) => void) => {
            if (!teamId) {
                setAwards([]);
                return;
            }
            try {
                const apiKey = import.meta.env.VITE_FTC_API_KEY || "";
                const api = createFtcApi(apiKey);
                const awards = await api.getTeamAwards(parseInt(teamId));
                setAwards(awards);
            } catch (e) {
                console.error(e);
            }
        };

        fetchAwards(team1Id, setTeam1Awards);
        fetchAwards(team2Id, setTeam2Awards);
    }, [team1Id, team2Id]);

    const chartData = useMemo(() => {
        if (!stats1 && !stats2) return [];
        return [
            { subject: 'Auto', A: stats1?.avgAutoSamples || 0, B: stats2?.avgAutoSamples || 0, fullMark: 5 },
            { subject: 'TeleOp', A: stats1?.avgTeleopSamples || 0, B: stats2?.avgTeleopSamples || 0, fullMark: 10 },
            { subject: 'Endgame', A: (stats1?.hangSuccessRate || 0) * 10, B: (stats2?.hangSuccessRate || 0) * 10, fullMark: 10 },
            { subject: 'Driver', A: stats1?.avgDriverSkill || 0, B: stats2?.avgDriverSkill || 0, fullMark: 5 },
            { subject: 'Speed', A: stats1?.avgRobotSpeed || 0, B: stats2?.avgRobotSpeed || 0, fullMark: 5 },
            { subject: 'Defense', A: stats1?.avgDefenseRating || 0, B: stats2?.avgDefenseRating || 0, fullMark: 5 },
        ];
    }, [stats1, stats2]);

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
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
                <h1 className="text-2xl font-bold text-foreground mb-6">Head-to-Head Comparison</h1>

                {/* Team Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-card/50 p-6 rounded-xl border border-border/50">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-team-red">Team 1 (Red)</label>
                        <Select value={team1Id} onValueChange={setTeam1Id}>
                            <SelectTrigger className="text-xl h-12">
                                <SelectValue placeholder="Select Team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.number} value={t.number.toString()}>
                                        {t.number} | {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="hidden md:flex justify-center">
                        <Badge variant="outline" className="text-xl px-4 py-1 rounded-full bg-background">VS</Badge>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-team-blue">Team 2 (Blue)</label>
                        <Select value={team2Id} onValueChange={setTeam2Id}>
                            <SelectTrigger className="text-xl h-12">
                                <SelectValue placeholder="Select Team..." />
                            </SelectTrigger>
                            <SelectContent>
                                {teams.map(t => (
                                    <SelectItem key={t.number} value={t.number.toString()}>
                                        {t.number} | {t.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {(team1 || team2) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Comparison Chart */}
                        <Card className="glass border-border/50 md:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-center">Performance Radar</CardTitle>
                            </CardHeader>
                            <CardContent className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                                        <PolarGrid stroke="#3f3f46" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                        <Radar
                                            name={team1?.name || 'Team 1'}
                                            dataKey="A"
                                            stroke="#ef4444"
                                            fill="#ef4444"
                                            fillOpacity={0.4}
                                        />
                                        <Radar
                                            name={team2?.name || 'Team 2'}
                                            dataKey="B"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.4}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Team 1 Details */}
                        <div className="space-y-4">
                            {team1 ? (
                                <>
                                    <Card className="glass border-team-red/30 bg-team-red/5">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center text-team-red">
                                                <span>Stats</span>
                                                <span className="text-2xl">{stats1?.eloRating || '-'} ELO</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Avg Points</span>
                                                <span className="font-bold">{stats1?.avgTotalPoints.toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Auto Reliability</span>
                                                <span className="font-bold">{((stats1?.autoSuccessRate || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Hang Success</span>
                                                <span className="font-bold">{((stats1?.hangSuccessRate || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass border-border/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Awards</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {team1Awards.length > 0 ? team1Awards.map((a, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{a.name}</Badge>
                                                )) : <span className="text-sm text-muted-foreground italic">No awards found</span>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass border-border/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Pit Intel</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            {pit1 ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-muted/50 p-2 rounded">
                                                            <div className="text-xs text-muted-foreground">Drive Train</div>
                                                            <div className="font-medium capitalize">{pit1.driveType}</div>
                                                        </div>
                                                        <div className="bg-muted/50 p-2 rounded">
                                                            <div className="text-xs text-muted-foreground">Vision</div>
                                                            <div className={`font-medium ${pit1.hasVision ? 'text-green-500' : 'text-muted-foreground'}`}>{pit1.hasVision ? 'Yes' : 'No'}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Strengths</div>
                                                        <p className="bg-muted/30 p-2 rounded min-h-[40px]">{pit1.strengths || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Weaknesses</div>
                                                        <p className="bg-muted/30 p-2 rounded min-h-[40px]">{pit1.weaknesses || 'N/A'}</p>
                                                    </div>
                                                </>
                                            ) : <div className="text-center py-4 text-muted-foreground italic">No pit scouting data</div>}
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl p-8">Select Team 1</div>
                            )}
                        </div>

                        {/* Team 2 Details */}
                        <div className="space-y-4">
                            {team2 ? (
                                <>
                                    <Card className="glass border-team-blue/30 bg-team-blue/5">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center text-team-blue">
                                                <span>Stats</span>
                                                <span className="text-2xl">{stats2?.eloRating || '-'} ELO</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Avg Points</span>
                                                <span className="font-bold">{stats2?.avgTotalPoints.toFixed(1)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Auto Reliability</span>
                                                <span className="font-bold">{((stats2?.autoSuccessRate || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Hang Success</span>
                                                <span className="font-bold">{((stats2?.hangSuccessRate || 0) * 100).toFixed(0)}%</span>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass border-border/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Awards</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {team2Awards.length > 0 ? team2Awards.map((a, i) => (
                                                    <Badge key={i} variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{a.name}</Badge>
                                                )) : <span className="text-sm text-muted-foreground italic">No awards found</span>}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass border-border/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Pit Intel</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 text-sm">
                                            {pit2 ? (
                                                <>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-muted/50 p-2 rounded">
                                                            <div className="text-xs text-muted-foreground">Drive Train</div>
                                                            <div className="font-medium capitalize">{pit2.driveType}</div>
                                                        </div>
                                                        <div className="bg-muted/50 p-2 rounded">
                                                            <div className="text-xs text-muted-foreground">Vision</div>
                                                            <div className={`font-medium ${pit2.hasVision ? 'text-green-500' : 'text-muted-foreground'}`}>{pit2.hasVision ? 'Yes' : 'No'}</div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Strengths</div>
                                                        <p className="bg-muted/30 p-2 rounded min-h-[40px]">{pit2.strengths || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground mb-1">Weaknesses</div>
                                                        <p className="bg-muted/30 p-2 rounded min-h-[40px]">{pit2.weaknesses || 'N/A'}</p>
                                                    </div>
                                                </>
                                            ) : <div className="text-center py-4 text-muted-foreground italic">No pit scouting data</div>}
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl p-8">Select Team 2</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">Select two teams above to compare them headed-to-head.</div>
                )}
            </div>
        </AppLayout>
    );
};

export default TeamComparison;
