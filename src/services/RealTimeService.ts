import { createFtcApi } from '@/api/FtcApi';
import type { Match, ScoutEntry } from '@/models/DataModels';

export interface LiveMatchUpdate {
    matchId: string;
    redScore?: number;
    blueScore?: number;
    status: 'pending' | 'in_progress' | 'completed';
    timestamp: number;
}

export interface LiveCommentary {
    id: string;
    matchId: string;
    teamNumber?: number;
    timestamp: number;
    gameTime: number; // Seconds into the match
    scoutName: string;
    comment: string;
    type: 'observation' | 'strategy' | 'issue' | 'highlight';
    tags: string[];
}

export interface MatchNotification {
    id: string;
    type: 'upcoming_match' | 'match_started' | 'match_completed' | 'score_update';
    title: string;
    message: string;
    matchId: string;
    priority: 'low' | 'medium' | 'high';
    timestamp: number;
    read: boolean;
}

export type NotificationCallback = (notification: MatchNotification) => void;
export type LiveUpdateCallback = (update: LiveMatchUpdate) => void;

class RealTimeFeaturesService {
    private apiKey: string;
    private pollingInterval: number = 30000; // 30 seconds
    private pollingTimer: NodeJS.Timeout | null = null;
    private notificationCallbacks: NotificationCallback[] = [];
    private liveUpdateCallbacks: LiveUpdateCallback[] = [];
    private commentary: Map<string, LiveCommentary[]> = new Map();
    private notifications: MatchNotification[] = [];
    private lastCheckedMatches: Map<string, Match> = new Map();
    private isPolling: boolean = false;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    // Start polling for live updates
    startLiveUpdates(eventCode: string, matches: Match[]): void {
        if (this.isPolling) return;

        this.isPolling = true;
        this.lastCheckedMatches = new Map(matches.map(m => [m.id, m]));

        // Initial check
        this.checkForUpdates(eventCode);

        // Set up polling
        this.pollingTimer = setInterval(() => {
            this.checkForUpdates(eventCode);
        }, this.pollingInterval);

        console.log('🔴 Live updates started');
    }

    // Stop polling
    stopLiveUpdates(): void {
        if (this.pollingTimer) {
            clearInterval(this.pollingTimer);
            this.pollingTimer = null;
        }
        this.isPolling = false;
        console.log('⏹️ Live updates stopped');
    }

    // Check for match updates
    private async checkForUpdates(eventCode: string): Promise<void> {
        try {
            const api = createFtcApi(this.apiKey);
            const matches = await api.getMatches(eventCode);

            matches.forEach(newMatch => {
                const oldMatch = this.lastCheckedMatches.get(newMatch.id);

                if (!oldMatch) {
                    this.lastCheckedMatches.set(newMatch.id, newMatch);
                    return;
                }

                // Check for status changes
                if (oldMatch.status !== newMatch.status) {
                    this.handleStatusChange(oldMatch, newMatch);
                }

                // Check for score updates
                if (
                    oldMatch.redScore !== newMatch.redScore ||
                    oldMatch.blueScore !== newMatch.blueScore
                ) {
                    this.handleScoreUpdate(newMatch);
                }

                this.lastCheckedMatches.set(newMatch.id, newMatch);
            });

            // Check for upcoming matches
            this.checkUpcomingMatches(matches);
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }

    // Handle match status changes
    private handleStatusChange(oldMatch: Match, newMatch: Match): void {
        const update: LiveMatchUpdate = {
            matchId: newMatch.id,
            redScore: newMatch.redScore,
            blueScore: newMatch.blueScore,
            status: newMatch.status,
            timestamp: Date.now(),
        };

        this.liveUpdateCallbacks.forEach(cb => cb(update));

        // Create notification
        if (newMatch.status === 'in_progress') {
            this.createNotification({
                type: 'match_started',
                title: `Match ${newMatch.matchNumber} Started`,
                message: `Red: ${newMatch.redAlliance.join(', ')} vs Blue: ${newMatch.blueAlliance.join(', ')}`,
                matchId: newMatch.id,
                priority: 'high',
            });
        } else if (newMatch.status === 'completed') {
            const winner = (newMatch.redScore || 0) > (newMatch.blueScore || 0) ? 'Red' : 'Blue';
            this.createNotification({
                type: 'match_completed',
                title: `Match ${newMatch.matchNumber} Completed`,
                message: `${winner} Alliance wins! Red: ${newMatch.redScore} - Blue: ${newMatch.blueScore}`,
                matchId: newMatch.id,
                priority: 'medium',
            });
        }
    }

    // Handle score updates
    private handleScoreUpdate(match: Match): void {
        const update: LiveMatchUpdate = {
            matchId: match.id,
            redScore: match.redScore,
            blueScore: match.blueScore,
            status: match.status,
            timestamp: Date.now(),
        };

        this.liveUpdateCallbacks.forEach(cb => cb(update));

        this.createNotification({
            type: 'score_update',
            title: `Match ${match.matchNumber} Score Update`,
            message: `Red: ${match.redScore} - Blue: ${match.blueScore}`,
            matchId: match.id,
            priority: 'low',
        });
    }

    // Check for upcoming matches
    private checkUpcomingMatches(matches: Match[]): void {
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        matches.forEach(match => {
            if (match.status === 'pending' && match.scheduledTime) {
                const timeUntilMatch = match.scheduledTime - now;

                // Notify 5 minutes before match
                if (timeUntilMatch > 0 && timeUntilMatch < fiveMinutes) {
                    const alreadyNotified = this.notifications.some(
                        n => n.matchId === match.id && n.type === 'upcoming_match'
                    );

                    if (!alreadyNotified) {
                        this.createNotification({
                            type: 'upcoming_match',
                            title: `Match ${match.matchNumber} Starting Soon`,
                            message: `Match starts in ${Math.round(timeUntilMatch / 60000)} minutes`,
                            matchId: match.id,
                            priority: 'high',
                        });
                    }
                }
            }
        });
    }

    // Create a notification
    private createNotification(
        params: Omit<MatchNotification, 'id' | 'timestamp' | 'read'>
    ): void {
        const notification: MatchNotification = {
            id: `notif-${Date.now()}-${Math.random()}`,
            ...params,
            timestamp: Date.now(),
            read: false,
        };

        this.notifications.push(notification);
        this.notificationCallbacks.forEach(cb => cb(notification));

        // Browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/icon.png',
                badge: '/badge.png',
            });
        }
    }

    // Live commentary methods
    addCommentary(
        matchId: string,
        teamNumber: number | undefined,
        comment: string,
        scoutName: string,
        type: LiveCommentary['type'] = 'observation',
        tags: string[] = []
    ): LiveCommentary {
        const commentary: LiveCommentary = {
            id: `comment-${Date.now()}-${Math.random()}`,
            matchId,
            teamNumber,
            timestamp: Date.now(),
            gameTime: 0, // Would need match start time to calculate
            scoutName,
            comment,
            type,
            tags,
        };

        const existing = this.commentary.get(matchId) || [];
        existing.push(commentary);
        this.commentary.set(matchId, existing);

        return commentary;
    }

    getCommentary(matchId: string): LiveCommentary[] {
        return this.commentary.get(matchId) || [];
    }

    getCommentaryByTeam(teamNumber: number): LiveCommentary[] {
        const all: LiveCommentary[] = [];
        this.commentary.forEach(comments => {
            all.push(...comments.filter(c => c.teamNumber === teamNumber));
        });
        return all.sort((a, b) => b.timestamp - a.timestamp);
    }

    // Notification management
    getNotifications(): MatchNotification[] {
        return [...this.notifications].sort((a, b) => b.timestamp - a.timestamp);
    }

    getUnreadNotifications(): MatchNotification[] {
        return this.notifications.filter(n => !n.read);
    }

    markNotificationAsRead(id: string): void {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
        }
    }

    markAllAsRead(): void {
        this.notifications.forEach(n => (n.read = true));
    }

    clearNotifications(): void {
        this.notifications = [];
    }

    // Subscribe to updates
    onNotification(callback: NotificationCallback): () => void {
        this.notificationCallbacks.push(callback);
        return () => {
            this.notificationCallbacks = this.notificationCallbacks.filter(cb => cb !== callback);
        };
    }

    onLiveUpdate(callback: LiveUpdateCallback): () => void {
        this.liveUpdateCallbacks.push(callback);
        return () => {
            this.liveUpdateCallbacks = this.liveUpdateCallbacks.filter(cb => cb !== callback);
        };
    }

    // Request notification permission
    async requestNotificationPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    // Set polling interval
    setPollingInterval(milliseconds: number): void {
        this.pollingInterval = milliseconds;
        if (this.isPolling) {
            // Restart polling with new interval
            const wasPolling = this.isPolling;
            this.stopLiveUpdates();
            if (wasPolling) {
                // Would need to store event code to restart
                console.log('Polling interval updated to', milliseconds, 'ms');
            }
        }
    }

    // Get polling status
    isActive(): boolean {
        return this.isPolling;
    }
}

// Singleton instance
let realTimeService: RealTimeFeaturesService | null = null;

export const getRealTimeService = (apiKey?: string): RealTimeFeaturesService => {
    if (!realTimeService) {
        const key = apiKey || import.meta.env.VITE_FTC_API_KEY || '';
        realTimeService = new RealTimeFeaturesService(key);
    }
    return realTimeService;
};

export default RealTimeFeaturesService;
