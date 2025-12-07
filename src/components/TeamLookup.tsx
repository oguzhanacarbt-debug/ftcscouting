import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/store/appStore';
import { createFtcApi } from '@/api/FtcApi';
import { Search, Trophy, MapPin, School, Calendar, Loader2 } from 'lucide-react';
import type { Team, Award } from '@/models/DataModels';

export const TeamLookup = () => {
    const { events } = useAppStore();
    const [teamNumber, setTeamNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [team, setTeam] = useState<Team | null>(null);
    const [awards, setAwards] = useState<Award[]>([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = async () => {
        if (!teamNumber.trim()) return;

        setLoading(true);
        setSearched(true);
        setTeam(null);
        setAwards([]);

        try {
            const apiKey = import.meta.env.VITE_FTC_API_KEY || "";
            const api = createFtcApi(apiKey);

            const number = parseInt(teamNumber);
            if (isNaN(number)) throw new Error("Invalid team number");

            const [teams, teamAwards] = await Promise.all([
                api.getTeams(undefined, number),
                api.getTeamAwards(number)
            ]);

            if (teams.length > 0) {
                setTeam(teams[0]);
                setAwards(teamAwards);
            }
        } catch (error) {
            console.error('Failed to lookup team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const getEventName = (awardEventId: string) => {
        if (!awardEventId) return 'Event';

        // Try to find exact match on ID or Code
        const event = events.find(e =>
            e.id === awardEventId ||
            e.code === awardEventId ||
            (awardEventId.includes('_') && e.code === awardEventId.split('_')[1])
        );

        if (event) return event.name;

        // Fallback to formatting the ID
        return (awardEventId.includes('_')) ? awardEventId.split('_')[1] : awardEventId;
    };

    return (
        <Card className="glass border-border/50 w-full animate-fade-in">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-primary" />
                    Team Lookup
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-3">
                    <Input
                        placeholder="Enter Team Number (e.g. 11115)"
                        value={teamNumber}
                        onChange={(e) => setTeamNumber(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="bg-input border-border"
                        type="number"
                    />
                    <Button onClick={handleSearch} disabled={loading || !teamNumber.trim()}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                    </Button>
                </div>

                {searched && !loading && !team && (
                    <div className="text-center py-6 text-muted-foreground">
                        No team found with number {teamNumber}
                    </div>
                )}

                {team && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Team Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border/50">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-primary/20 bg-background/50">
                                    <AvatarImage
                                        src={`https://api.dicebear.com/9.x/bottts/svg?seed=${team.number}`}
                                        alt={team.name}
                                    />
                                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-3">
                                        {team.name}
                                        <Badge variant="outline" className="text-lg px-3 py-1 bg-primary/10 border-primary/20 text-primary">
                                            #{team.number}
                                        </Badge>
                                    </h3>
                                    {team.school && (
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                            <School className="w-4 h-4" />
                                            <span>{team.school}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col items-start md:items-end gap-1 text-sm text-muted-foreground pl-20 md:pl-0">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span>{team.city}, {team.state}, {team.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>Rookie Year: {team.rookieYear}</span>
                                </div>
                            </div>
                        </div>

                        {/* Awards Section */}
                        <div>
                            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" />
                                Season Awards
                            </h4>
                            {awards.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {awards.map((award, index) => (
                                        <div
                                            key={`${award.awardId}-${index}`}
                                            className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground">{award.name}</span>
                                                <span className="text-sm text-muted-foreground">{award.description}</span>
                                            </div>
                                            <Badge variant="secondary" className="ml-2 w-fit max-w-[40%] truncate" title={getEventName(award.eventId)}>
                                                {getEventName(award.eventId)}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground italic">No awards found for this season yet.</p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
