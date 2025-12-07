import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { getRealTimeService } from '@/services/RealTimeService';
import { Bell, BellOff, Radio, MessageSquare, Send, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MatchNotification, LiveCommentary } from '@/services/RealTimeService';

const LiveUpdates = () => {
    const { toast } = useToast();
    const { currentEvent, matches } = useAppStore();
    const [isLive, setIsLive] = useState(false);
    const [notifications, setNotifications] = useState<MatchNotification[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<string>('');
    const [commentary, setCommentary] = useState<LiveCommentary[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState<LiveCommentary['type']>('observation');
    const [scoutName, setScoutName] = useState('Scout');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const realTimeService = getRealTimeService();

    useEffect(() => {
        // Subscribe to notifications
        const unsubscribe = realTimeService.onNotification((notification) => {
            setNotifications(prev => [notification, ...prev]);

            toast({
                title: notification.title,
                description: notification.message,
                variant: notification.priority === 'high' ? 'default' : 'default',
            });
        });

        // Load existing notifications
        setNotifications(realTimeService.getNotifications());

        return () => {
            unsubscribe();
        };
    }, [realTimeService, toast]);

    useEffect(() => {
        if (selectedMatch) {
            setCommentary(realTimeService.getCommentary(selectedMatch));
        }
    }, [selectedMatch, realTimeService]);

    const toggleLiveUpdates = () => {
        if (!currentEvent) {
            toast({
                title: 'No Event Selected',
                description: 'Please select an event first',
                variant: 'destructive',
            });
            return;
        }

        if (isLive) {
            realTimeService.stopLiveUpdates();
            setIsLive(false);
            toast({
                title: 'Live Updates Stopped',
                description: 'No longer polling for match updates',
            });
        } else {
            realTimeService.startLiveUpdates(currentEvent.code, matches);
            setIsLive(true);
            toast({
                title: 'Live Updates Started',
                description: 'Now polling for real-time match data',
            });
        }
    };

    const requestNotifications = async () => {
        const granted = await realTimeService.requestNotificationPermission();
        setNotificationsEnabled(granted);

        if (granted) {
            toast({
                title: 'Notifications Enabled',
                description: 'You will receive push notifications for match updates',
            });
        } else {
            toast({
                title: 'Notifications Denied',
                description: 'Please enable notifications in your browser settings',
                variant: 'destructive',
            });
        }
    };

    const addComment = () => {
        if (!selectedMatch || !newComment.trim()) return;

        const comment = realTimeService.addCommentary(
            selectedMatch,
            undefined,
            newComment,
            scoutName,
            commentType
        );

        setCommentary(prev => [...prev, comment]);
        setNewComment('');

        toast({
            title: 'Comment Added',
            description: 'Your commentary has been recorded',
        });
    };

    const markAllAsRead = () => {
        realTimeService.markAllAsRead();
        setNotifications(realTimeService.getNotifications());
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'upcoming_match': return '⏰';
            case 'match_started': return '🏁';
            case 'match_completed': return '✅';
            case 'score_update': return '📊';
            default: return '📢';
        }
    };

    const getCommentTypeColor = (type: LiveCommentary['type']) => {
        switch (type) {
            case 'observation': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'strategy': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
            case 'issue': return 'bg-red-500/10 text-red-600 border-red-500/20';
            case 'highlight': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
            default: return 'bg-muted';
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

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AppLayout>
            <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Radio className={`w-8 h-8 ${isLive ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                        Live Updates & Commentary
                    </h1>
                    <div className="flex gap-2">
                        <Button
                            variant={notificationsEnabled ? 'default' : 'outline'}
                            size="sm"
                            onClick={requestNotifications}
                            className="gap-2"
                        >
                            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
                        </Button>
                        <Button
                            variant={isLive ? 'destructive' : 'default'}
                            onClick={toggleLiveUpdates}
                            className="gap-2"
                        >
                            <Radio className={`w-4 h-4 ${isLive ? 'animate-pulse' : ''}`} />
                            {isLive ? 'Stop Live Updates' : 'Start Live Updates'}
                        </Button>
                    </div>
                </div>

                {isLive && (
                    <Card className="glass border-green-500/50 bg-green-500/5">
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                <span className="font-semibold text-green-600">
                                    Live updates active - Polling every 30 seconds
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Notifications Panel */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-primary" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <Badge variant="destructive" className="ml-2">
                                            {unreadCount} new
                                        </Badge>
                                    )}
                                </CardTitle>
                                {notifications.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="gap-2">
                                        <CheckCheck className="w-4 h-4" />
                                        Mark All Read
                                    </Button>
                                )}
                            </div>
                            <CardDescription>Real-time match notifications and alerts</CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No notifications yet</p>
                                    <p className="text-sm">Start live updates to receive notifications</p>
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 rounded-lg border transition-colors ${notif.read
                                                ? 'bg-muted/20 border-border/30'
                                                : 'bg-primary/5 border-primary/30'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold mb-1">{notif.title}</div>
                                                <div className="text-sm text-muted-foreground mb-2">{notif.message}</div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {new Date(notif.timestamp).toLocaleTimeString()}
                                                    </Badge>
                                                    <Badge
                                                        variant={notif.priority === 'high' ? 'destructive' : 'secondary'}
                                                        className="text-xs"
                                                    >
                                                        {notif.priority}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Live Commentary Panel */}
                    <Card className="glass border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                Live Commentary
                            </CardTitle>
                            <CardDescription>Add timestamped notes during matches</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Match Selector */}
                            <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a match..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {matches.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            Match {m.matchNumber} - {m.status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedMatch && (
                                <>
                                    {/* Add Comment */}
                                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select value={commentType} onValueChange={(v: any) => setCommentType(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="observation">Observation</SelectItem>
                                                    <SelectItem value="strategy">Strategy</SelectItem>
                                                    <SelectItem value="issue">Issue</SelectItem>
                                                    <SelectItem value="highlight">Highlight</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <input
                                                type="text"
                                                placeholder="Your name"
                                                value={scoutName}
                                                onChange={(e) => setScoutName(e.target.value)}
                                                className="px-3 py-2 bg-background border border-border rounded-md text-sm"
                                            />
                                        </div>
                                        <Textarea
                                            placeholder="Add your commentary..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={3}
                                        />
                                        <Button onClick={addComment} className="w-full gap-2" disabled={!newComment.trim()}>
                                            <Send className="w-4 h-4" />
                                            Add Comment
                                        </Button>
                                    </div>

                                    {/* Commentary Feed */}
                                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                                        {commentary.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No commentary yet for this match</p>
                                            </div>
                                        ) : (
                                            commentary.map(comment => (
                                                <div
                                                    key={comment.id}
                                                    className="p-3 rounded-lg bg-muted/20 border border-border/30"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-sm">{comment.scoutName}</span>
                                                            <Badge className={`text-xs ${getCommentTypeColor(comment.type)}`}>
                                                                {comment.type}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(comment.timestamp).toLocaleTimeString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{comment.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default LiveUpdates;
