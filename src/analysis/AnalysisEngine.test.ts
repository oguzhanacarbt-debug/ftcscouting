import { describe, it, expect } from 'vitest';
import {
  calculateExpectedScore,
  updateEloRatings,
  calculateTeamStats,
  predictMatch,
  INITIAL_ELO,
} from './AnalysisEngine';
import type { ScoutEntry, Match, TeamStats } from '@/models/DataModels';

// We need to export INITIAL_ELO from AnalysisEngine, let's use the value directly
const TEST_INITIAL_ELO = 1500;

describe('AnalysisEngine', () => {
  describe('calculateExpectedScore', () => {
    it('should return 0.5 for equal ratings', () => {
      const result = calculateExpectedScore(1500, 1500);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should return higher probability for higher rated team', () => {
      const result = calculateExpectedScore(1600, 1400);
      expect(result).toBeGreaterThan(0.5);
      expect(result).toBeLessThan(1);
    });

    it('should return lower probability for lower rated team', () => {
      const result = calculateExpectedScore(1400, 1600);
      expect(result).toBeLessThan(0.5);
      expect(result).toBeGreaterThan(0);
    });

    it('should be symmetric (probabilities sum to 1)', () => {
      const probA = calculateExpectedScore(1600, 1400);
      const probB = calculateExpectedScore(1400, 1600);
      expect(probA + probB).toBeCloseTo(1, 5);
    });
  });

  describe('updateEloRatings', () => {
    it('should increase winner rating and decrease loser rating', () => {
      const { newWinnerRating, newLoserRating } = updateEloRatings(1500, 1500);
      expect(newWinnerRating).toBeGreaterThan(1500);
      expect(newLoserRating).toBeLessThan(1500);
    });

    it('should have larger change for upset victories', () => {
      const expected = updateEloRatings(1500, 1500);
      const upset = updateEloRatings(1400, 1600); // Lower rated beats higher
      
      expect(upset.newWinnerRating - 1400).toBeGreaterThan(expected.newWinnerRating - 1500);
    });

    it('should factor in margin of victory', () => {
      const closeGame = updateEloRatings(1500, 1500, 5);
      const blowout = updateEloRatings(1500, 1500, 50);
      
      expect(blowout.newWinnerRating).toBeGreaterThan(closeGame.newWinnerRating);
    });

    it('should not let loser rating go below 1000', () => {
      const { newLoserRating } = updateEloRatings(1500, 1050, 100);
      expect(newLoserRating).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('calculateTeamStats', () => {
    const mockEntry = (overrides: Partial<ScoutEntry> = {}): ScoutEntry => ({
      id: 'test-entry',
      eventId: 'event-1',
      matchId: 'match-1',
      teamNumber: 12345,
      alliance: 'red',
      scoutId: 'scout-1',
      scoutName: 'Test Scout',
      deviceId: 'device-1',
      autoSampleScored: 2,
      autoSpecimenScored: 1,
      autoParked: true,
      autoNotes: '',
      teleopSampleScored: 5,
      teleopSpecimenScored: 2,
      teleopNotes: '',
      endgameParked: true,
      endgameHanging: 'low',
      endgameNotes: '',
      driverSkill: 4,
      robotSpeed: 3,
      defenseRating: 2,
      overallNotes: '',
      localTimestamp: Date.now(),
      syncStatus: 'synced',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...overrides,
    });

    it('should return zero stats for team with no entries', () => {
      const stats = calculateTeamStats(12345, 'event-1', []);
      expect(stats.matchesPlayed).toBe(0);
      expect(stats.avgTotalPoints).toBe(0);
      expect(stats.eloRating).toBe(TEST_INITIAL_ELO);
    });

    it('should calculate correct averages', () => {
      const entries = [
        mockEntry({ autoSampleScored: 2, teleopSampleScored: 4 }),
        mockEntry({ autoSampleScored: 4, teleopSampleScored: 6 }),
      ];
      
      const stats = calculateTeamStats(12345, 'event-1', entries);
      expect(stats.avgAutoSamples).toBe(3);
      expect(stats.avgTeleopSamples).toBe(5);
      expect(stats.matchesPlayed).toBe(2);
    });

    it('should calculate success rates', () => {
      const entries = [
        mockEntry({ autoParked: true, endgameHanging: 'high' }),
        mockEntry({ autoParked: false, endgameHanging: 'none' }),
        mockEntry({ autoParked: true, endgameHanging: 'low' }),
      ];
      
      const stats = calculateTeamStats(12345, 'event-1', entries);
      expect(stats.autoSuccessRate).toBeCloseTo(1, 2); // All have some auto scoring
      expect(stats.hangSuccessRate).toBeCloseTo(0.667, 1); // 2 out of 3 hung
    });

    it('should use previous rating as starting point', () => {
      const entries = [mockEntry()];
      const stats = calculateTeamStats(12345, 'event-1', entries, 1600);
      expect(stats.eloTrend[0]).toBe(1600);
    });
  });

  describe('predictMatch', () => {
    const mockMatch: Match = {
      id: 'match-1',
      eventId: 'event-1',
      matchNumber: 1,
      matchType: 'qualification',
      redAlliance: [12345, 12346],
      blueAlliance: [12347, 12348],
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const mockTeamStats = (teamNumber: number, eloRating: number): TeamStats => ({
      teamNumber,
      eventId: 'event-1',
      matchesPlayed: 5,
      avgAutoSamples: 2,
      avgAutoSpecimens: 1,
      avgTeleopSamples: 5,
      avgTeleopSpecimens: 2,
      avgTotalPoints: 60,
      autoSuccessRate: 0.8,
      hangSuccessRate: 0.6,
      avgDriverSkill: 4,
      avgRobotSpeed: 3,
      avgDefenseRating: 3,
      eloRating,
      eloTrend: [eloRating - 50, eloRating - 25, eloRating],
      consistency: 0.7,
      lastUpdated: Date.now(),
    });

    it('should predict 50/50 for equal teams', () => {
      const statsMap = new Map<number, TeamStats>([
        [12345, mockTeamStats(12345, 1500)],
        [12346, mockTeamStats(12346, 1500)],
        [12347, mockTeamStats(12347, 1500)],
        [12348, mockTeamStats(12348, 1500)],
      ]);

      const prediction = predictMatch(mockMatch, statsMap);
      expect(prediction.redWinProbability).toBeCloseTo(0.5, 1);
      expect(prediction.blueWinProbability).toBeCloseTo(0.5, 1);
    });

    it('should favor higher ELO alliance', () => {
      const statsMap = new Map<number, TeamStats>([
        [12345, mockTeamStats(12345, 1600)],
        [12346, mockTeamStats(12346, 1600)],
        [12347, mockTeamStats(12347, 1400)],
        [12348, mockTeamStats(12348, 1400)],
      ]);

      const prediction = predictMatch(mockMatch, statsMap);
      expect(prediction.redWinProbability).toBeGreaterThan(0.5);
      expect(prediction.blueWinProbability).toBeLessThan(0.5);
    });

    it('should calculate predicted scores', () => {
      const statsMap = new Map<number, TeamStats>([
        [12345, mockTeamStats(12345, 1500)],
        [12346, mockTeamStats(12346, 1500)],
        [12347, mockTeamStats(12347, 1500)],
        [12348, mockTeamStats(12348, 1500)],
      ]);

      const prediction = predictMatch(mockMatch, statsMap);
      expect(prediction.predictedRedScore).toBeGreaterThan(0);
      expect(prediction.predictedBlueScore).toBeGreaterThan(0);
    });

    it('should include confidence band', () => {
      const statsMap = new Map<number, TeamStats>();
      const prediction = predictMatch(mockMatch, statsMap);
      expect(prediction.confidenceBand).toBeGreaterThan(0);
      expect(prediction.confidenceBand).toBeLessThanOrEqual(0.5);
    });
  });
});
