/**
 * FTC Nexus API Client
 * API Documentation: https://ftc-nexus.vercel.app/api
 * 
 * FTC Nexus provides:
 * - Team event history
 * - Pit maps for events
 * - Additional team and event data
 */

const FTC_NEXUS_API_URL = 'https://ftc-nexus.vercel.app/api';
const FTC_NEXUS_API_KEY = 'xbhAEc-UQ4XoiwkM5HXocC1b_h4';

export interface NexusTeamEvent {
    eventCode: string;
    eventName: string;
    season: number;
    location?: string;
    startDate?: string;
    endDate?: string;
}

export interface NexusPitMap {
    eventCode: string;
    season: number;
    imageUrl: string;
    teams?: Array<{
        teamNumber: number;
        pitLocation: string;
    }>;
}

export class FtcNexusApi {
    private apiUrl: string;
    private apiKey: string;

    constructor() {
        this.apiUrl = FTC_NEXUS_API_URL;
        this.apiKey = FTC_NEXUS_API_KEY;
    }

    private async request<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.apiUrl}${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`FTC Nexus API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get all events for a specific team
     */
    async getTeamEvents(teamNumber: number, season?: number): Promise<NexusTeamEvent[]> {
        try {
            const endpoint = season
                ? `/team/${teamNumber}/events?season=${season}`
                : `/team/${teamNumber}/events`;

            const data = await this.request<{ events: NexusTeamEvent[] }>(endpoint);
            return data.events || [];
        } catch (error) {
            console.error('Failed to fetch team events from Nexus:', error);
            return [];
        }
    }

    /**
     * Get pit map for a specific event
     */
    async getPitMap(eventCode: string, season?: number): Promise<NexusPitMap | null> {
        try {
            const currentSeason = season || new Date().getFullYear();
            const endpoint = `/event/${eventCode}/pitmap?season=${currentSeason}`;

            const data = await this.request<NexusPitMap>(endpoint);
            return data;
        } catch (error) {
            console.error('Failed to fetch pit map from Nexus:', error);
            return null;
        }
    }

    /**
     * Get team's pit location at a specific event
     */
    async getTeamPitLocation(teamNumber: number, eventCode: string, season?: number): Promise<string | null> {
        try {
            const pitMap = await this.getPitMap(eventCode, season);
            if (!pitMap || !pitMap.teams) {
                return null;
            }

            const teamPit = pitMap.teams.find(t => t.teamNumber === teamNumber);
            return teamPit?.pitLocation || null;
        } catch (error) {
            console.error('Failed to fetch team pit location:', error);
            return null;
        }
    }

    /**
     * Get all team events for current season
     */
    async getCurrentSeasonEvents(teamNumber: number): Promise<NexusTeamEvent[]> {
        const currentSeason = new Date().getFullYear();
        return this.getTeamEvents(teamNumber, currentSeason);
    }
}

export const createFtcNexusApi = (): FtcNexusApi => {
    return new FtcNexusApi();
};
