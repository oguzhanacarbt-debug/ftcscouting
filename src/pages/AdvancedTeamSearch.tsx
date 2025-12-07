import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { createFtcScoutApi } from '@/api/FtcScoutApi';
import { createFtcApi } from '@/api/FtcApi';
import { createFtcNexusApi } from '@/api/FtcNexusApi';
import { useAppStore } from '@/store/appStore';
import type { FTCScoutTeam } from '@/api/FtcScoutApi';
import type { NexusTeamEvent } from '@/api/FtcNexusApi';
import type { Award, Event } from '@/models/DataModels';
import {
    Search,
    MapPin,
    School,
    Calendar,
    Loader2,
    ExternalLink,
    BarChart3,
    Globe,
    Trophy,
} from 'lucide-react';

const AdvancedTeamSearch = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    // FTCScout data
    const [team, setTeam] = useState<FTCScoutTeam | null>(null);

    // FTC Official API data
    const [awards, setAwards] = useState<Award[]>([]);
    const [events, setEvents] = useState<Event[]>([]);

    // FTC Nexus API data
    const [nexusEvents, setNexusEvents] = useState<NexusTeamEvent[]>([]);

    const { currentEvent } = useAppStore();

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        setSearched(true);
        setTeam(null);
        setAwards([]);
        setEvents([]);
        setNexusEvents([]);

        try {
            const teamNumber = parseInt(searchQuery);
            if (isNaN(teamNumber)) {
                throw new Error('Invalid team number');
            }

            // Fetch from all three APIs in parallel
            const ftcScoutApi = createFtcScoutApi();
            const ftcApiKey = import.meta.env.VITE_FTC_API_KEY || '';
            const ftcApi = createFtcApi(ftcApiKey);
            const nexusApi = createFtcNexusApi();

            const [teamData, teamAwards, teamNexusEvents] = await Promise.all([
                ftcScoutApi.getTeam(teamNumber),
                ftcApi.getTeamAwards(teamNumber),
                nexusApi.getCurrentSeasonEvents(teamNumber),
            ]);

            if (teamData) {
                setTeam(teamData);
            }

            setAwards(teamAwards);
            setNexusEvents(teamNexusEvents);

            // Set current event if available
            if (currentEvent) {
                setEvents([currentEvent]);
            }
        } catch (error) {
            console.error('Failed to search team:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Search className="w-8 h-8 text-primary" />
                        Team Search
                    </h1>
                </div>

                {/* Search Bar */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle>Search FTC Teams</CardTitle>
                        <CardDescription>
                            Powered by FTCScout.org, FTC Official API, and FTC Nexus
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-3">
                            <Input
                                placeholder="Enter Team Number (e.g., 25153)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="bg-input border-border"
                                type="number"
                            />
                            <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()} className="gap-2">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                Search
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {searched && !loading && !team && (
                    <Card className="glass border-border/50">
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No team found with number {searchQuery}
                        </CardContent>
                    </Card>
                )}

                {team && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Team Header */}
                        <Card className="glass border-border/50">
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-20 w-20 border-2 border-primary/20 bg-background/50">
                                            <AvatarImage
                                                src={`https://api.dicebear.com/9.x/bottts/svg?seed=${team.number}`}
                                                alt={team.name}
                                            />
                                            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                                {team.name?.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h2 className="text-3xl font-bold flex items-center gap-3">
                                                {team.name}
                                                <Badge variant="outline" className="text-xl px-4 py-1 bg-primary/10 border-primary/20 text-primary">
                                                    #{team.number}
                                                </Badge>
                                            </h2>
                                            {team.schoolName && (
                                                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                                                    <School className="w-4 h-4" />
                                                    <span>{team.schoolName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start md:items-end gap-2 text-sm">
                                        {team.location?.city && team.location?.state && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <MapPin className="w-4 h-4" />
                                                <span>{team.location.city}, {team.location.state}, {team.location.country || 'USA'}</span>
                                            </div>
                                        )}
                                        {team.rookieYear && (
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                <span>Rookie Year: {team.rookieYear}</span>
                                            </div>
                                        )}
                                        {team.website && (
                                            <a
                                                href={team.website}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-primary hover:underline"
                                            >
                                                <Globe className="w-4 h-4" />
                                                <span>Website</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Tabs */}
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="info">Team Info</TabsTrigger>
                                <TabsTrigger value="events">Events ({nexusEvents.length})</TabsTrigger>
                                <TabsTrigger value="awards">Awards ({awards.length})</TabsTrigger>
                            </TabsList>

                            {/* Team Info Tab */}
                            <TabsContent value="info">
                                <Card className="glass border-border/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-primary" />
                                            Team Information
                                        </CardTitle>
                                        <CardDescription>
                                            From FTCScout.org
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Team Number</label>
                                                <p className="text-lg font-semibold">{team.number}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                                                <p className="text-lg font-semibold">{team.name}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">School</label>
                                                <p className="text-lg">{team.schoolName}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Rookie Year</label>
                                                <p className="text-lg">{team.rookieYear}</p>
                                            </div>
                                            {team.location && (
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                                                    <p className="text-lg">
                                                        {team.location.city}, {team.location.state}, {team.location.country || 'USA'}
                                                    </p>
                                                </div>
                                            )}
                                            {team.website && (
                                                <div className="md:col-span-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Website</label>
                                                    <p className="text-lg">
                                                        <a href={team.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
                                                            {team.website}
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Events Tab */}
                            <TabsContent value="events">
                                <Card className="glass border-border/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            Event History
                                        </CardTitle>
                                        <CardDescription>
                                            From FTC Nexus API
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {nexusEvents.length > 0 ? (
                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {nexusEvents.map((event, idx) => (
                                                    <div
                                                        key={`${event.eventCode}-${idx}`}
                                                        className="p-4 rounded-lg bg-card border border-border/50 hover:bg-accent/50 transition-colors"
                                                    >
                                                        <h4 className="font-semibold text-foreground">{event.eventName}</h4>
                                                        <div className="flex flex-wrap gap-2 mt-2 text-sm">
                                                            <Badge variant="outline" className="bg-primary/5">
                                                                {event.eventCode}
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                Season {event.season}
                                                            </Badge>
                                                            {event.location && (
                                                                <span className="text-muted-foreground flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3" />
                                                                    {event.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {event.startDate && (
                                                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {event.startDate}
                                                                {event.endDate && ` - ${event.endDate}`}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-muted-foreground">No events found</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Awards Tab */}
                            <TabsContent value="awards">
                                <Card className="glass border-border/50">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                            Season Awards
                                        </CardTitle>
                                        <CardDescription>
                                            From FTC Official API
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {awards.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {awards.map((award, idx) => (
                                                    <div
                                                        key={`${award.awardId}-${idx}`}
                                                        className="flex items-center justify-between p-4 rounded-lg bg-card border border-border/50"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Trophy className="w-5 h-5 text-yellow-500" />
                                                            <div>
                                                                <div className="font-semibold">{award.name}</div>
                                                                {award.description && (
                                                                    <div className="text-sm text-muted-foreground">{award.description}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary">{award.eventId}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                                                <p className="text-muted-foreground">No awards found</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default AdvancedTeamSearch;
