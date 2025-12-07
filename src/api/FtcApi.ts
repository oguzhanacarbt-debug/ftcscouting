import type { Event, Team, Match, Award } from '@/models/DataModels';

// Use local proxy in development to avoid CORS issues
const FTC_API_BASE = import.meta.env.DEV ? '/api/ftc' : 'https://ftc-events.firstinspires.org/v2.0';

interface FtcApiConfig {
  apiKey: string;
  season?: number;
}

interface ApiTeam {
  teamNumber: number;
  nameFull: string;
  nameShort: string;
  city: string;
  stateProv: string;
  country: string;
  schoolName: string;
  rookieYear: number;
}

interface ApiMatch {
  matchNumber: number;
  description: string;
  tournamentLevel: string;
  teams: {
    teamNumber: number;
    station: string;
  }[];
  scoreRedFinal?: number;
  scoreBlueFinal?: number;
  modifiedOn?: string;
  startTime?: string;
  actualStartTime?: string;
}

interface ApiEvent {
  code: string;
  name: string;
  type: string;
  venue: string;
  city: string;
  stateprov: string;
  country: string;
  dateStart: string;
  dateEnd: string;
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

class FtcApi {
  private apiKey: string;
  private season: number;

  constructor(config: FtcApiConfig) {
    this.apiKey = config.apiKey;
    this.season = config.season || new Date().getFullYear();
  }

  private getAuthHeader(): string {
    // If the key contains a colon, assume it's 'username:key' format
    if (this.apiKey.includes(':')) {
      return `Basic ${btoa(this.apiKey)}`;
    }
    // Otherwise assume it's a username/token that needs the colon appended (blank password)
    return `Basic ${btoa(`${this.apiKey}:`)}`;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${FTC_API_BASE}/${this.season}${endpoint}`, {
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`FTC API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getEvents(): Promise<Event[]> {
    const data = await this.fetch<{ events: ApiEvent[] }>('/events');

    return data.events.map((e): Event => ({
      id: `${this.season}_${e.code}`,
      code: e.code,
      name: e.name,
      type: e.type,
      venue: e.venue,
      city: e.city,
      state: e.stateprov,
      country: e.country,
      startDate: e.dateStart,
      endDate: e.dateEnd,
      timezone: e.timezone,
      latitude: e.coordinates?.lat,
      longitude: e.coordinates?.lng,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  async getTeams(eventCode?: string, teamNumber?: number): Promise<Team[]> {
    const params = new URLSearchParams();
    if (eventCode) params.append('eventCode', eventCode);
    if (teamNumber) params.append('teamNumber', teamNumber.toString());

    const queryString = params.toString();
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`;

    const data = await this.fetch<{ teams: ApiTeam[] }>(endpoint);

    return data.teams.map((t): Team => ({
      id: `team_${t.teamNumber}`,
      number: t.teamNumber,
      name: t.nameShort || t.nameFull,
      school: t.schoolName,
      city: t.city,
      state: t.stateProv,
      country: t.country,
      rookieYear: t.rookieYear,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  async getTeamAwards(teamNumber: number): Promise<Award[]> {
    try {
      const data = await this.fetch<{ awards: Award[] }>(`/awards/${teamNumber}`);
      return data.awards;
    } catch (error) {
      console.error(`Failed to fetch awards for team ${teamNumber}:`, error);
      return [];
    }
  }

  async getEventAwards(eventCode: string): Promise<Award[]> {
    try {
      const data = await this.fetch<{ awards: Award[] }>(`/awards/${eventCode}`);
      return data.awards;
    } catch (error) {
      console.error(`Failed to fetch awards for event ${eventCode}:`, error);
      return [];
    }
  }

  async getMatches(eventCode: string): Promise<Match[]> {
    const data = await this.fetch<{ matches: ApiMatch[] }>(`/matches/${eventCode}`);

    return data.matches.map((m): Match => {
      const redTeams = m.teams
        .filter(t => t.station.startsWith('Red'))
        .map(t => t.teamNumber);
      const blueTeams = m.teams
        .filter(t => t.station.startsWith('Blue'))
        .map(t => t.teamNumber);

      const matchType = m.tournamentLevel.toLowerCase().includes('final')
        ? 'final'
        : m.tournamentLevel.toLowerCase().includes('semi')
          ? 'semifinal'
          : 'qualification';

      return {
        id: `${this.season}_${eventCode}_${m.matchNumber}`,
        eventId: `${this.season}_${eventCode}`,
        matchNumber: m.matchNumber,
        matchType,
        redAlliance: redTeams,
        blueAlliance: blueTeams,
        redScore: m.scoreRedFinal,
        blueScore: m.scoreBlueFinal,
        scheduledTime: m.startTime ? new Date(m.startTime).getTime() : undefined,
        actualTime: m.actualStartTime ? new Date(m.actualStartTime).getTime() : undefined,
        status: m.scoreRedFinal !== undefined ? 'completed' : 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });
  }

  async getEventSchedule(eventCode: string): Promise<Match[]> {
    const data = await this.fetch<{ schedule: ApiMatch[] }>(`/schedule/${eventCode}?tournamentLevel=qual`);

    return data.schedule.map((m): Match => {
      const redTeams = m.teams
        .filter(t => t.station.startsWith('Red'))
        .map(t => t.teamNumber);
      const blueTeams = m.teams
        .filter(t => t.station.startsWith('Blue'))
        .map(t => t.teamNumber);

      return {
        id: `${this.season}_${eventCode}_${m.matchNumber}`,
        eventId: `${this.season}_${eventCode}`,
        matchNumber: m.matchNumber,
        matchType: 'qualification',
        redAlliance: redTeams,
        blueAlliance: blueTeams,
        scheduledTime: m.startTime ? new Date(m.startTime).getTime() : undefined,
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    });
  }
}

// Factory function
export const createFtcApi = (apiKey: string, season?: number): FtcApi => {
  return new FtcApi({ apiKey, season });
};

export type { FtcApi };
