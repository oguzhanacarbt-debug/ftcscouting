import type { Event, Team, Match } from '@/models/DataModels';

// Demo data for FTC scouting platform
const DEMO_EVENTS: Event[] = [
  {
    id: '2024_USNYUSR',
    code: 'USNYUSR',
    name: 'New York Tech Valley Regional',
    type: 'Regional',
    venue: 'RPI Field House',
    city: 'Troy',
    state: 'NY',
    country: 'USA',
    startDate: '2024-03-15',
    endDate: '2024-03-17',
    latitude: 42.7284,
    longitude: -73.6918,
    timezone: 'America/New_York',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2024_USCASD',
    code: 'USCASD',
    name: 'San Diego Regional Championship',
    type: 'Regional',
    venue: 'Del Mar Fairgrounds',
    city: 'San Diego',
    state: 'CA',
    country: 'USA',
    startDate: '2024-03-08',
    endDate: '2024-03-10',
    latitude: 32.9594,
    longitude: -117.2653,
    timezone: 'America/Los_Angeles',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2024_USTXHOU',
    code: 'USTXHOU',
    name: 'Houston World Championship',
    type: 'Championship',
    venue: 'George R. Brown Convention Center',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    startDate: '2024-04-17',
    endDate: '2024-04-20',
    latitude: 29.7519,
    longitude: -95.3556,
    timezone: 'America/Chicago',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

const TEAM_NAMES = [
  'Gearheads', 'RoboWarriors', 'Circuit Breakers', 'TechTitans',
  'Iron Eagles', 'Cyber Knights', 'Quantum Mechanics', 'Binary Blasters',
  'Voltage Vikings', 'Mechatronic Masters', 'Steel Stingers', 'Code Crushers',
  'Pixel Pioneers', 'Fusion Force', 'Omega Bots', 'Alpha Automatons',
];

const SCHOOLS = [
  'Central High School', 'Tech Academy', 'STEM Magnet School', 
  'Innovation Prep', 'Engineering Academy', 'Science High',
  'Robotics Charter', 'Future Leaders Academy',
];

const generateTeams = (count: number, startNumber: number = 7000): Team[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `team_${startNumber + i * 100 + Math.floor(Math.random() * 50)}`,
    number: startNumber + i * 100 + Math.floor(Math.random() * 50),
    name: TEAM_NAMES[i % TEAM_NAMES.length] + (i >= TEAM_NAMES.length ? ` ${Math.floor(i / TEAM_NAMES.length) + 1}` : ''),
    school: SCHOOLS[i % SCHOOLS.length],
    city: ['Troy', 'Albany', 'Schenectady', 'Buffalo', 'Rochester'][i % 5],
    state: 'NY',
    country: 'USA',
    rookieYear: 2015 + (i % 8),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }));
};

const DEMO_TEAMS = generateTeams(32);

const generateMatches = (eventId: string, teams: Team[]): Match[] => {
  const matches: Match[] = [];
  const teamNumbers = teams.map(t => t.number);
  
  for (let i = 1; i <= 40; i++) {
    // Shuffle and pick 4 teams for each match
    const shuffled = [...teamNumbers].sort(() => Math.random() - 0.5);
    const redAlliance = shuffled.slice(0, 2);
    const blueAlliance = shuffled.slice(2, 4);
    
    const isCompleted = i <= 25;
    
    matches.push({
      id: `${eventId}_Q${i}`,
      eventId,
      matchNumber: i,
      matchType: 'qualification',
      redAlliance,
      blueAlliance,
      redScore: isCompleted ? Math.floor(Math.random() * 100) + 50 : undefined,
      blueScore: isCompleted ? Math.floor(Math.random() * 100) + 50 : undefined,
      scheduledTime: Date.now() + (i - 25) * 10 * 60 * 1000,
      status: isCompleted ? 'completed' : i === 26 ? 'in_progress' : 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }
  
  return matches;
};

class FtcApiMock {
  private events: Event[] = DEMO_EVENTS;
  private teams: Map<string, Team[]> = new Map();
  private matches: Map<string, Match[]> = new Map();
  private latency: number;

  constructor(options?: { latency?: number }) {
    this.latency = options?.latency ?? 300;
    
    // Pre-generate data for first event
    this.teams.set(DEMO_EVENTS[0].id, DEMO_TEAMS);
    this.matches.set(DEMO_EVENTS[0].id, generateMatches(DEMO_EVENTS[0].id, DEMO_TEAMS));
  }

  private async simulate<T>(data: T): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, this.latency));
    return data;
  }

  async getEvents(): Promise<Event[]> {
    return this.simulate([...this.events]);
  }

  async getTeams(eventCode: string): Promise<Team[]> {
    const eventId = this.events.find(e => e.code === eventCode)?.id;
    if (!eventId) return this.simulate([]);
    
    if (!this.teams.has(eventId)) {
      this.teams.set(eventId, generateTeams(24 + Math.floor(Math.random() * 16)));
    }
    
    return this.simulate([...this.teams.get(eventId)!]);
  }

  async getMatches(eventCode: string): Promise<Match[]> {
    const eventId = this.events.find(e => e.code === eventCode)?.id;
    if (!eventId) return this.simulate([]);
    
    if (!this.matches.has(eventId)) {
      const teams = this.teams.get(eventId) || generateTeams(24);
      if (!this.teams.has(eventId)) {
        this.teams.set(eventId, teams);
      }
      this.matches.set(eventId, generateMatches(eventId, teams));
    }
    
    return this.simulate([...this.matches.get(eventId)!]);
  }

  async getEventSchedule(eventCode: string): Promise<Match[]> {
    return this.getMatches(eventCode);
  }
}

// Singleton instance
let mockApiInstance: FtcApiMock | null = null;

export const createFtcApiMock = (options?: { latency?: number }): FtcApiMock => {
  if (!mockApiInstance) {
    mockApiInstance = new FtcApiMock(options);
  }
  return mockApiInstance;
};

export type { FtcApiMock };
