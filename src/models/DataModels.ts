// Core data models for FTC Scouting

export type Alliance = 'red' | 'blue';

export interface Team {
  id: string;
  number: number;
  name: string;
  school?: string;
  city?: string;
  state?: string;
  country?: string;
  rookieYear?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Award {
  awardId: string;
  teamId: string;
  eventId: string;
  description: string;
  divisionId: string;
  name: string;
  seriesId: string;
  teamNumber: number;
}

export interface Match {
  id: string;
  eventId: string;
  matchNumber: number;
  matchType: 'qualification' | 'semifinal' | 'final';
  redAlliance: number[];
  blueAlliance: number[];
  redScore?: number;
  blueScore?: number;
  scheduledTime?: number;
  actualTime?: number;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

export interface ScoutEntry {
  id: string;
  eventId: string;
  matchId: string;
  teamNumber: number;
  alliance: Alliance;
  scoutId: string;
  scoutName: string;
  deviceId: string;

  // Autonomous
  autoSampleScored: number;
  autoSpecimenScored: number;
  autoParked: boolean;
  autoNotes: string;

  // TeleOp
  teleopSampleScored: number;
  teleopSpecimenScored: number;
  teleopNotes: string;

  // Endgame
  endgameParked: boolean;
  endgameHanging: 'none' | 'low' | 'high';
  endgameNotes: string;

  // Overall
  driverSkill: 1 | 2 | 3 | 4 | 5;
  robotSpeed: 1 | 2 | 3 | 4 | 5;
  defenseRating: 1 | 2 | 3 | 4 | 5;
  overallNotes: string;

  // Sync metadata
  localTimestamp: number;
  serverTimestamp?: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  version: number;

  createdAt: number;
  updatedAt: number;
}

export interface PitScoutEntry {
  id: string;
  eventId: string;
  teamNumber: number;
  scoutId: string;
  scoutName: string;
  deviceId: string;

  // Robot specs
  driveType: 'tank' | 'mecanum' | 'swerve' | 'other';
  motorCount: number;
  programmingLanguage: 'java' | 'blocks' | 'other';
  hasVision: boolean;

  // Capabilities
  canScoreSamples: boolean;
  canScoreSpecimens: boolean;
  canHangLow: boolean;
  canHangHigh: boolean;
  preferredStartPosition: 'left' | 'center' | 'right';

  // Strategy
  autoRoutines: string;
  strengths: string;
  weaknesses: string;

  // Photos
  photoUrls: string[];

  // Sync metadata
  syncStatus: 'pending' | 'synced' | 'conflict';
  version: number;

  createdAt: number;
  updatedAt: number;
}

export interface Event {
  id: string;
  code: string;
  name: string;
  type: string;
  venue?: string;
  city?: string;
  state?: string;
  country?: string;
  startDate: string;
  endDate: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TeamStats {
  teamNumber: number;
  eventId: string;
  matchesPlayed: number;

  // Averages
  avgAutoSamples: number;
  avgAutoSpecimens: number;
  avgTeleopSamples: number;
  avgTeleopSpecimens: number;
  avgTotalPoints: number;

  // Success rates
  autoSuccessRate: number;
  hangSuccessRate: number;

  // Ratings
  avgDriverSkill: number;
  avgRobotSpeed: number;
  avgDefenseRating: number;

  // ELO-style rating
  eloRating: number;
  eloTrend: number[];

  // Consistency
  consistency: number;

  lastUpdated: number;
}

export interface MatchPrediction {
  matchId: string;
  redWinProbability: number;
  blueWinProbability: number;
  predictedRedScore: number;
  predictedBlueScore: number;
  confidenceBand: number;
  factors: {
    redElo: number;
    blueElo: number;
    redMomentum: number;
    blueMomentum: number;
  };
  createdAt: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'scout' | 'pit' | 'photo';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  retryCount: number;
  createdAt: number;
  lastAttempt?: number;
  error?: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  lastSeen: number;
  scoutName?: string;
  isHost: boolean;
  publicKey?: string;
}

export interface PeerMessage {
  type: 'sync' | 'ping' | 'host_election' | 'entry_update';
  id: string;
  ts: number;
  deviceId: string;
  entryId?: string;
  payload: unknown;
  signature?: string;
}
