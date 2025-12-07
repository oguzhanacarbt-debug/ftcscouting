import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Trophy } from 'lucide-react';
import { format } from 'date-fns';

const Schedule = () => {
    const { currentEvent, matches } = useAppStore();
    const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

    const filteredMatches = matches.filter(match => {
        if (filter === 'upcoming') return match.status === 'pending';
        if (filter === 'completed') return match.status === 'completed';
        return true;
    }).sort((a, b) => (a.matchNumber - b.matchNumber));

    if (!currentEvent) {
        return (
            <AppLayout>
                <div className="text-center py-16">
                    <h2 className="text-xl font-semibold text-foreground">No event selected</h2>
                    <p className="text-muted-foreground mt-2">Go to Home to select an event first.</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <Calendar className="w-6 h-6 text-primary" />
                            Match Schedule
                        </h1>
                        <p className="text-muted-foreground">{currentEvent.name}</p>
                    </div>

                    <div className="flex bg-muted p-1 rounded-lg">
                        {(['all', 'upcoming', 'completed'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <Card className="glass border-border/50 min-h-[500px]">
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            <div className="divide-y divide-border/50">
                                {filteredMatches.length > 0 ? (
                                    filteredMatches.map((match) => (
                                        <div key={match.id} className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row items-center justify-between gap-4">
                                            {/* Match Info */}
                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="min-w-[80px] text-center">
                                                    <Badge variant="outline" className="font-mono text-lg">Q{match.matchNumber}</Badge>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Clock className="w-3 h-3" />
                                                        <span>
                                                            {match.actualTime
                                                                ? format(match.actualTime, 'h:mm a')
                                                                : (match.scheduledTime ? format(match.scheduledTime, 'h:mm a') : 'TBD')}
                                                        </span>
                                                    </div>
                                                    <span className={`text-xs uppercase font-bold ${match.status === 'completed' ? 'text-green-500' : 'text-blue-500'}`}>
                                                        {match.status}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Teams & Scores */}
                                            <div className="flex-1 w-full md:w-auto flex items-center justify-center gap-2 md:gap-8">
                                                {/* Red Alliance */}
                                                <div className={`flex flex-col items-center flex-1 p-2 rounded-lg ${match.redScore !== undefined && match.blueScore !== undefined && match.redScore > match.blueScore ? 'bg-red-500/10 ring-1 ring-red-500/50' : ''}`}>
                                                    <span className="text-2xl font-bold text-team-red">
                                                        {match.redScore !== undefined ? match.redScore : '-'}
                                                    </span>
                                                    <div className="flex gap-1.5 text-sm font-medium text-team-red/80">
                                                        {match.redAlliance.map(t => <span key={t}>{t}</span>)}
                                                    </div>
                                                </div>

                                                <span className="text-muted-foreground font-bold text-lg">vs</span>

                                                {/* Blue Alliance */}
                                                <div className={`flex flex-col items-center flex-1 p-2 rounded-lg ${match.blueScore !== undefined && match.redScore !== undefined && match.blueScore > match.redScore ? 'bg-blue-500/10 ring-1 ring-blue-500/50' : ''}`}>
                                                    <span className="text-2xl font-bold text-team-blue">
                                                        {match.blueScore !== undefined ? match.blueScore : '-'}
                                                    </span>
                                                    <div className="flex gap-1.5 text-sm font-medium text-team-blue/80">
                                                        {match.blueAlliance.map(t => <span key={t}>{t}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        No matches found for this filter.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
};

export default Schedule;
