import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppStore } from '@/store/appStore';
import { calculateAllTeamStats } from '@/analysis/AnalysisEngine';
import { useToast } from '@/hooks/use-toast';
import { Download, Plus, GripVertical, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PickListTeam {
    teamNumber: number;
    rank: number;
    notes: string;
}

const AllianceSelection = () => {
    const { toast } = useToast();
    const { currentEvent, teams, scoutEntries, userTeamNumber } = useAppStore();

    // Local state for the pick list (teams added)
    const [pickList, setPickList] = useState<PickListTeam[]>([]);

    // Calculate stats for all teams to display helper info
    const teamStats = useMemo(() => {
        if (!currentEvent || teams.length === 0) return new Map();
        return calculateAllTeamStats(teams.map(t => t.number), currentEvent.id, scoutEntries);
    }, [currentEvent, teams, scoutEntries]);

    // My stats
    const myStats = useMemo(() => {
        if (!userTeamNumber) return null;
        return teamStats.get(userTeamNumber);
    }, [userTeamNumber, teamStats]);

    // Teams available to be added (not already in pick list)
    const availableTeams = useMemo(() => {
        const list = teams
            .filter(t => !pickList.some(p => p.teamNumber === t.number))
            .filter(t => t.number !== userTeamNumber); // Don't pick myself

        return list.sort((a, b) => {
            const statA = teamStats.get(a.number);
            const statB = teamStats.get(b.number);

            // Calculate compatibility score if we know our own stats
            let scoreA = statA?.eloRating || 0;
            let scoreB = statB?.eloRating || 0;

            if (myStats) {
                // Recommendation Logic:
                // 1. If we are bad at Auto (< 3 pts avg samples), value their Auto more.
                // 2. If we can't hang, value their Hang.
                // 3. Overall ELO still matters most.

                const calcCompat = (s: typeof statA) => {
                    if (!s) return 0;
                    let score = s.eloRating; // Base: ELO

                    // Needs Analysis
                    if (myStats.avgAutoSamples < 2) score += (s.avgAutoSamples * 50); // Need Auto support
                    if (myStats.hangSuccessRate < 0.5) score += (s.hangSuccessRate * 200); // Need Hang support
                    if (myStats.avgTeleopSamples < 3) score += (s.avgTeleopSamples * 30); // Need TeleOp support

                    return score;
                };

                scoreA = calcCompat(statA);
                scoreB = calcCompat(statB);
            }

            return scoreB - scoreA;
        });
    }, [teams, pickList, teamStats, myStats, userTeamNumber]);

    const getCompatibilityBadge = (teamNumber: number) => {
        if (!myStats) return null;
        const them = teamStats.get(teamNumber);
        if (!them) return null;

        let reasons = [];
        if (myStats.avgAutoSamples < 2 && them.avgAutoSamples > 2.5) reasons.push("Strong Auto");
        if (myStats.hangSuccessRate < 0.5 && them.hangSuccessRate > 0.8) reasons.push("Reliable Hang");
        if (myStats.avgTeleopSamples < 3 && them.avgTeleopSamples > 4) reasons.push("High TeleOp");

        if (reasons.length === 0) return null;
        return reasons[0]; // Return the top reason
    };

    const addToPickList = (teamNumber: number) => {
        setPickList(prev => [
            ...prev,
            { teamNumber, rank: prev.length + 1, notes: '' }
        ]);
    };

    const removeFromPickList = (teamNumber: number) => {
        setPickList(prev => {
            const filtered = prev.filter(p => p.teamNumber !== teamNumber);
            // Re-rank
            return filtered.map((item, index) => ({ ...item, rank: index + 1 }));
        });
    };

    const moveUp = (index: number) => {
        if (index === 0) return;
        setPickList(prev => {
            const newList = [...prev];
            [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
            return newList.map((item, idx) => ({ ...item, rank: idx + 1 }));
        });
    };

    const moveDown = (index: number) => {
        if (index === pickList.length - 1) return;
        setPickList(prev => {
            const newList = [...prev];
            [newList[index + 1], newList[index]] = [newList[index], newList[index + 1]];
            return newList.map((item, idx) => ({ ...item, rank: idx + 1 }));
        });
    };

    const exportCSV = () => {
        const headers = ['Rank', 'Team Number', 'Team Name', 'ELO', 'Avg Points', 'Consistency'];
        const rows = pickList.map(item => {
            const team = teams.find(t => t.number === item.teamNumber);
            const stats = teamStats.get(item.teamNumber);
            return [
                item.rank,
                item.teamNumber,
                team?.name || 'Unknown',
                stats?.eloRating || 0,
                stats?.avgTotalPoints.toFixed(1) || 0,
                (stats?.consistency || 0 * 100).toFixed(0) + '%'
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `alliance_pick_list_${currentEvent?.code || 'event'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: "Exported", description: "Pick list exported to CSV" });
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
            <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Alliance Selection Assistant</h1>
                    <Button onClick={exportCSV} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* The Pick List */}
                    <Card className="glass border-border/50 h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle className=" text-primary">Your Pick List</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Rank</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead>ELO</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pickList.length > 0 ? pickList.map((item, index) => {
                                        const team = teams.find(t => t.number === item.teamNumber);
                                        const stats = teamStats.get(item.teamNumber);
                                        return (
                                            <TableRow key={item.teamNumber}>
                                                <TableCell className="font-bold">{item.rank}</TableCell>
                                                <TableCell>
                                                    <div className="font-semibold">{item.teamNumber}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">{team?.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="bg-primary/5 border-primary/20">
                                                        {stats?.eloRating || '-'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveUp(index)} disabled={index === 0}>
                                                            ▲
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => moveDown(index)} disabled={index === pickList.length - 1}>
                                                            ▼
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromPickList(item.teamNumber)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                Your pick list is empty. Add teams from the right.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Available Teams */}
                    <Card className="glass border-border/50 h-[600px] flex flex-col">
                        <CardHeader>
                            <CardTitle>Available Teams</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Team</TableHead>
                                        <TableHead>Avg Pts</TableHead>
                                        <TableHead>ELO</TableHead>
                                        <TableHead className="text-right">Add</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {availableTeams.length > 0 ? availableTeams.map((team) => {
                                        const stats = teamStats.get(team.number);
                                        const badge = getCompatibilityBadge(team.number);
                                        return (
                                            <TableRow key={team.number}>
                                                <TableCell>
                                                    <div className="font-bold">{team.number}</div>
                                                    <div className="text-xs text-muted-foreground truncate max-w-[120px]">{team.name}</div>
                                                    {badge && (
                                                        <Badge variant="secondary" className="mt-1 text-[10px] px-1 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                                                            {badge}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>{stats?.avgTotalPoints.toFixed(1) || '-'}</TableCell>
                                                <TableCell>{stats?.eloRating || '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button size="sm" variant="secondary" onClick={() => addToPickList(team.number)}>
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                All teams have been added to your pick list!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default AllianceSelection;
