/**
 * FTCScout.org GraphQL API Client
 * API Documentation: https://api.ftcscout.org/graphql
 * 
 * FTCScout provides comprehensive FTC team data including:
 * - Team information and history
 * - Event data and rankings
 * - Match results and statistics
 * - Awards and achievements
 * - OPR/DPR/CCWM calculations
 */

const FTCSCOUT_API_URL = 'https://api.ftcscout.org/graphql';

export interface FTCScoutTeam {
  number: number;
  name: string;
  schoolName: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  rookieYear: number;
  website?: string;
}

export interface FTCScoutEvent {
  eventCode: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  season: number;
}

export interface FTCScoutMatch {
  matchNumber: number;
  redTeams: number[];
  blueTeams: number[];
  redScore?: number;
  blueScore?: number;
  winner?: 'red' | 'blue' | 'tie';
}

export interface FTCScoutAward {
  name: string;
  teamNumber: number;
  eventCode: string;
  season: number;
}

export interface FTCScoutRanking {
  rank: number;
  teamNumber: number;
  wins: number;
  losses: number;
  ties: number;
  qualifyingPoints: number;
  rankingPoints: number;
  opr?: number;
  dpr?: number;
  ccwm?: number;
}

export interface FTCScoutTeamEventStats {
  teamNumber: number;
  eventCode: string;
  season: number;
  rank?: number;
  wins: number;
  losses: number;
  ties: number;
  opr?: number;
  dpr?: number;
  ccwm?: number;
  matches: FTCScoutMatch[];
  awards: FTCScoutAward[];
}

export class FtcScoutApi {
  private apiUrl: string;

  constructor() {
    this.apiUrl = FTCSCOUT_API_URL;
  }

  private async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FTCScout API HTTP Error:', response.status, errorText);
        throw new Error(`FTCScout API Error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('FTCScout API Response:', result);

      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        throw new Error(`GraphQL Error: ${result.errors[0].message}`);
      }

      return result.data;
    } catch (error) {
      console.error('FTCScout API Request Failed:', error);
      throw error;
    }
  }

  // Team queries
  async getTeam(teamNumber: number): Promise<FTCScoutTeam | null> {
    const query = `
      query GetTeam($teamNumber: Int!) {
        teamByNumber(number: $teamNumber) {
          number
          name
          schoolName
          location {
            city
            state
            country
          }
          rookieYear
          website
        }
      }
    `;

    const data = await this.query<{ teamByNumber: FTCScoutTeam }>(query, { teamNumber });
    return data.teamByNumber;
  }

  async searchTeams(searchTerm: string, limit: number = 20): Promise<FTCScoutTeam[]> {
    const query = `
      query SearchTeams($searchTerm: String!, $limit: Int!) {
        teamsSearch(query: $searchTerm, first: $limit) {
          teamNumber
          name
          schoolName
          city
          state
          country
          rookieYear
        }
      }
    `;

    const data = await this.query<{ teamsSearch: FTCScoutTeam[] }>(query, { searchTerm, limit });
    return data.teamsSearch || [];
  }

  async getTeamSeasons(teamNumber: number): Promise<number[]> {
    const query = `
      query GetTeamSeasons($teamNumber: Int!) {
        teamByNumber(number: $teamNumber) {
          seasons
        }
      }
    `;

    const data = await this.query<{ teamByNumber: { seasons: number[] } }>(query, { teamNumber });
    return data.teamByNumber?.seasons || [];
  }

  // Event queries
  async getEvent(eventCode: string, season: number): Promise<FTCScoutEvent | null> {
    const query = `
      query GetEvent($eventCode: String!, $season: Int!) {
        eventByCode(code: $eventCode, season: $season) {
          eventCode
          name
          location
          city
          state
          country
          startDate
          endDate
          season
        }
      }
    `;

    const data = await this.query<{ eventByCode: FTCScoutEvent }>(query, { eventCode, season });
    return data.eventByCode;
  }

  async getEventsBySeason(season: number): Promise<FTCScoutEvent[]> {
    const query = `
      query GetEventsBySeason($season: Int!) {
        eventsBySeason(season: $season) {
          eventCode
          name
          location
          city
          state
          country
          startDate
          endDate
          season
        }
      }
    `;

    const data = await this.query<{ eventsBySeason: FTCScoutEvent[] }>(query, { season });
    return data.eventsBySeason || [];
  }

  async getTeamEvents(teamNumber: number, season: number): Promise<FTCScoutEvent[]> {
    const query = `
      query GetTeamEvents($teamNumber: Int!, $season: Int!) {
        teamByNumber(number: $teamNumber) {
          eventsBySeason(season: $season) {
            eventCode
            name
            location
            city
            state
            country
            startDate
            endDate
            season
          }
        }
      }
    `;

    const data = await this.query<{ teamByNumber: { eventsBySeason: FTCScoutEvent[] } }>(query, { teamNumber, season });
    return data.teamByNumber?.eventsBySeason || [];
  }

  // Match queries
  async getEventMatches(eventCode: string, season: number): Promise<FTCScoutMatch[]> {
    const query = `
      query GetEventMatches($eventCode: String!, $season: Int!) {
        eventByCode(code: $eventCode, season: $season) {
          matches {
            matchNumber
            redTeams
            blueTeams
            redScore
            blueScore
            winner
          }
        }
      }
    `;

    const data = await this.query<{ eventByCode: { matches: FTCScoutMatch[] } }>(query, { eventCode, season });
    return data.eventByCode?.matches || [];
  }

  async getTeamMatches(teamNumber: number, eventCode: string, season: number): Promise<FTCScoutMatch[]> {
    const query = `
      query GetTeamMatches($teamNumber: Int!, $eventCode: String!, $season: Int!) {
        teamByNumber(number: $teamNumber) {
          matchesByEvent(eventCode: $eventCode, season: $season) {
            matchNumber
            redTeams
            blueTeams
            redScore
            blueScore
            winner
          }
        }
      }
    `;

    const data = await this.query<{ teamByNumber: { matchesByEvent: FTCScoutMatch[] } }>(query, { teamNumber, eventCode, season });
    return data.teamByNumber?.matchesByEvent || [];
  }

  // Rankings queries
  async getEventRankings(eventCode: string, season: number): Promise<FTCScoutRanking[]> {
    const query = `
      query GetEventRankings($eventCode: String!, $season: Int!) {
        eventByCode(code: $eventCode, season: $season) {
          rankings {
            rank
            teamNumber
            wins
            losses
            ties
            qualifyingPoints
            rankingPoints
            opr
            dpr
            ccwm
          }
        }
      }
    `;

    const data = await this.query<{ eventByCode: { rankings: FTCScoutRanking[] } }>(query, { eventCode, season });
    return data.eventByCode?.rankings || [];
  }

  async getTeamRanking(teamNumber: number, eventCode: string, season: number): Promise<FTCScoutRanking | null> {
    const rankings = await this.getEventRankings(eventCode, season);
    return rankings.find(r => r.teamNumber === teamNumber) || null;
  }

  // Awards queries
  async getEventAwards(eventCode: string, season: number): Promise<FTCScoutAward[]> {
    const query = `
      query GetEventAwards($eventCode: String!, $season: Int!) {
        eventByCode(code: $eventCode, season: $season) {
          awards {
            name
            teamNumber
            eventCode
            season
          }
        }
      }
    `;

    const data = await this.query<{ eventByCode: { awards: FTCScoutAward[] } }>(query, { eventCode, season });
    return data.eventByCode?.awards || [];
  }

  async getTeamAwards(teamNumber: number, season?: number): Promise<FTCScoutAward[]> {
    const query = season
      ? `
        query GetTeamAwards($teamNumber: Int!, $season: Int!) {
          teamByNumber(number: $teamNumber) {
            awardsBySeason(season: $season) {
              name
              teamNumber
              eventCode
              season
            }
          }
        }
      `
      : `
        query GetTeamAwards($teamNumber: Int!) {
          teamByNumber(number: $teamNumber) {
            awards {
              name
              teamNumber
              eventCode
              season
            }
          }
        }
      `;

    const data = season
      ? await this.query<{ teamByNumber: { awardsBySeason: FTCScoutAward[] } }>(query, { teamNumber, season })
      : await this.query<{ teamByNumber: { awards: FTCScoutAward[] } }>(query, { teamNumber });

    if (season) {
      const seasonData = data as { teamByNumber: { awardsBySeason: FTCScoutAward[] } };
      return seasonData.teamByNumber?.awardsBySeason || [];
    } else {
      const allData = data as { teamByNumber: { awards: FTCScoutAward[] } };
      return allData.teamByNumber?.awards || [];
    }
  }

  // Team event stats (comprehensive)
  async getTeamEventStats(teamNumber: number, eventCode: string, season: number): Promise<FTCScoutTeamEventStats | null> {
    const query = `
      query GetTeamEventStats($teamNumber: Int!, $eventCode: String!, $season: Int!) {
        teamByNumber(number: $teamNumber) {
          statsByEvent(eventCode: $eventCode, season: $season) {
            teamNumber
            eventCode
            season
            rank
            wins
            losses
            ties
            opr
            dpr
            ccwm
            matches {
              matchNumber
              redTeams
              blueTeams
              redScore
              blueScore
              winner
            }
            awards {
              name
              teamNumber
              eventCode
              season
            }
          }
        }
      }
    `;

    const data = await this.query<{ teamByNumber: { statsByEvent: FTCScoutTeamEventStats } }>(query, { teamNumber, eventCode, season });
    return data.teamByNumber?.statsByEvent || null;
  }

  // Season stats
  async getTeamSeasonStats(teamNumber: number, season: number): Promise<any> {
    const query = `
      query GetTeamSeasonStats($teamNumber: Int!, $season: Int!) {
        teamByNumber(number: $teamNumber) {
          seasonStats(season: $season) {
            teamNumber
            season
            totalMatches
            wins
            losses
            ties
            avgOPR
            avgDPR
            avgCCWM
            highestRank
            lowestRank
            totalAwards
          }
        }
      }
    `;

    const data = await this.query<{ teamByNumber: { seasonStats: any } }>(query, { teamNumber, season });
    return data.teamByNumber?.seasonStats;
  }
}

export const createFtcScoutApi = (): FtcScoutApi => {
  return new FtcScoutApi();
};
