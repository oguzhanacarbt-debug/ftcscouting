import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Team,
  Match,
  ScoutEntry,
  PitScoutEntry,
  Event,
  TeamStats,
  SyncQueueItem,
  DeviceInfo
} from '@/models/DataModels';

interface AppState {
  // Current context
  currentEvent: Event | null;
  currentMatch: Match | null;
  scoutName: string;
  userTeamNumber: number | null;
  deviceId: string;

  // Data collections
  events: Event[];
  teams: Team[];
  matches: Match[];
  scoutEntries: ScoutEntry[];
  pitScoutEntries: PitScoutEntry[];
  teamStats: Map<number, TeamStats>;

  // Sync state
  syncQueue: SyncQueueItem[];
  isSyncing: boolean;
  lastSyncTime: number | null;
  isOnline: boolean;

  // Device/P2P state
  devices: DeviceInfo[];
  isHost: boolean;

  // Demo mode
  isDemoMode: boolean;

  // Actions
  setCurrentEvent: (event: Event | null) => void;
  setCurrentMatch: (match: Match | null) => void;
  setScoutName: (name: string) => void;
  setUserTeamNumber: (number: number | null) => void;
  setDeviceId: (id: string) => void;

  setEvents: (events: Event[]) => void;
  setTeams: (teams: Team[]) => void;
  setMatches: (matches: Match[]) => void;

  addScoutEntry: (entry: ScoutEntry) => void;
  updateScoutEntry: (id: string, updates: Partial<ScoutEntry>) => void;
  setScoutEntries: (entries: ScoutEntry[]) => void;

  addPitScoutEntry: (entry: PitScoutEntry) => void;
  updatePitScoutEntry: (id: string, updates: Partial<PitScoutEntry>) => void;
  setPitScoutEntries: (entries: PitScoutEntry[]) => void;

  updateTeamStats: (teamNumber: number, stats: TeamStats) => void;

  addToSyncQueue: (item: SyncQueueItem) => void;
  removeFromSyncQueue: (id: string) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSyncTime: (time: number) => void;
  setOnline: (online: boolean) => void;

  setDevices: (devices: DeviceInfo[]) => void;
  setIsHost: (isHost: boolean) => void;

  setDemoMode: (demo: boolean) => void;

  reset: () => void;
}

const generateDeviceId = (): string => {
  const stored = localStorage.getItem('ftc-device-id');
  if (stored) return stored;
  const id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('ftc-device-id', id);
  return id;
};

const initialState = {
  currentEvent: null,
  currentMatch: null,
  scoutName: '',
  userTeamNumber: null,
  deviceId: generateDeviceId(),
  events: [],
  teams: [],
  matches: [],
  scoutEntries: [],
  pitScoutEntries: [],
  teamStats: new Map(),
  syncQueue: [],
  isSyncing: false,
  lastSyncTime: null,
  isOnline: navigator.onLine,
  devices: [],
  isHost: false,
  isDemoMode: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentEvent: (event) => set({ currentEvent: event }),
      setCurrentMatch: (match) => set({ currentMatch: match }),
      setScoutName: (name) => set({ scoutName: name }),
      setUserTeamNumber: (num) => set({ userTeamNumber: num }),
      setDeviceId: (id) => set({ deviceId: id }),

      setEvents: (events) => set({ events }),
      setTeams: (teams) => set({ teams }),
      setMatches: (matches) => set({ matches }),

      addScoutEntry: (entry) => set((state) => ({
        scoutEntries: [...state.scoutEntries, entry]
      })),

      updateScoutEntry: (id, updates) => set((state) => ({
        scoutEntries: state.scoutEntries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
        )
      })),

      setScoutEntries: (entries) => set({ scoutEntries: entries }),

      addPitScoutEntry: (entry) => set((state) => ({
        pitScoutEntries: [...state.pitScoutEntries, entry]
      })),

      updatePitScoutEntry: (id, updates) => set((state) => ({
        pitScoutEntries: state.pitScoutEntries.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
        )
      })),

      setPitScoutEntries: (entries) => set({ pitScoutEntries: entries }),

      updateTeamStats: (teamNumber, stats) => set((state) => {
        const newStats = new Map(state.teamStats);
        newStats.set(teamNumber, stats);
        return { teamStats: newStats };
      }),

      addToSyncQueue: (item) => set((state) => ({
        syncQueue: [...state.syncQueue, item]
      })),

      removeFromSyncQueue: (id) => set((state) => ({
        syncQueue: state.syncQueue.filter((i) => i.id !== id)
      })),

      setSyncing: (syncing) => set({ isSyncing: syncing }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      setOnline: (online) => set({ isOnline: online }),

      setDevices: (devices) => set({ devices }),
      setIsHost: (isHost) => set({ isHost }),

      setDemoMode: (demo) => set({ isDemoMode: demo }),

      reset: () => set({
        ...initialState,
        deviceId: get().deviceId,
        scoutName: get().scoutName,
      }),
    }),
    {
      name: 'ftc-scouting-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentEvent: state.currentEvent,
        scoutName: state.scoutName,
        userTeamNumber: state.userTeamNumber,
        deviceId: state.deviceId,
        isDemoMode: state.isDemoMode,
        // Persist critical data for offline use
        events: state.events,
        teams: state.teams,
        matches: state.matches,
        // Save ALL entries locally
        scoutEntries: state.scoutEntries,
        pitScoutEntries: state.pitScoutEntries,
        syncQueue: state.syncQueue,
      }),
    }
  )
);
