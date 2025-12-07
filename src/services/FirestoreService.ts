import {
  getDb,
  getCollection,
  getDocument,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  isDemoMode,
} from '@/lib/firebase';
import type { 
  Team, 
  Match, 
  ScoutEntry, 
  PitScoutEntry, 
  Event,
  TeamStats,
} from '@/models/DataModels';
import { useAppStore } from '@/store/appStore';

type UnsubscribeFn = () => void;

class FirestoreService {
  private listeners: Map<string, UnsubscribeFn> = new Map();

  // Events
  async getEvents(): Promise<Event[]> {
    if (isDemoMode()) return [];
    
    const snapshot = await getDocs(getCollection('events'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
  }

  async saveEvent(event: Event): Promise<void> {
    if (isDemoMode()) return;
    
    const docRef = getDocument('events', event.id);
    await setDoc(docRef, {
      ...event,
      updatedAt: serverTimestamp(),
    });
  }

  subscribeToEvents(callback: (events: Event[]) => void): UnsubscribeFn {
    if (isDemoMode()) return () => {};
    
    const q = query(getCollection('events'), orderBy('startDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
      callback(events);
    });
    
    this.listeners.set('events', unsubscribe);
    return unsubscribe;
  }

  // Teams
  async getTeams(eventId: string): Promise<Team[]> {
    if (isDemoMode()) return [];
    
    const q = query(getCollection('teams'), where('eventIds', 'array-contains', eventId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
  }

  async saveTeam(team: Team): Promise<void> {
    if (isDemoMode()) return;
    
    const docRef = getDocument('teams', team.id);
    await setDoc(docRef, {
      ...team,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async saveTeamsBatch(teams: Team[]): Promise<void> {
    if (isDemoMode()) return;
    
    const db = getDb();
    const batch = writeBatch(db);
    
    teams.forEach(team => {
      const docRef = getDocument('teams', team.id);
      batch.set(docRef, {
        ...team,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    
    await batch.commit();
  }

  subscribeToTeams(eventId: string, callback: (teams: Team[]) => void): UnsubscribeFn {
    if (isDemoMode()) return () => {};
    
    const q = query(
      getCollection('teams'),
      where('eventIds', 'array-contains', eventId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      callback(teams);
    });
    
    this.listeners.set(`teams-${eventId}`, unsubscribe);
    return unsubscribe;
  }

  // Matches
  async getMatches(eventId: string): Promise<Match[]> {
    if (isDemoMode()) return [];
    
    const q = query(
      getCollection('matches'),
      where('eventId', '==', eventId),
      orderBy('matchNumber', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
  }

  async saveMatch(match: Match): Promise<void> {
    if (isDemoMode()) return;
    
    const docRef = getDocument('matches', match.id);
    await setDoc(docRef, {
      ...match,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  async saveMatchesBatch(matches: Match[]): Promise<void> {
    if (isDemoMode()) return;
    
    const db = getDb();
    const batch = writeBatch(db);
    
    matches.forEach(match => {
      const docRef = getDocument('matches', match.id);
      batch.set(docRef, {
        ...match,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    
    await batch.commit();
  }

  subscribeToMatches(eventId: string, callback: (matches: Match[]) => void): UnsubscribeFn {
    if (isDemoMode()) return () => {};
    
    const q = query(
      getCollection('matches'),
      where('eventId', '==', eventId),
      orderBy('matchNumber', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match));
      callback(matches);
    });
    
    this.listeners.set(`matches-${eventId}`, unsubscribe);
    return unsubscribe;
  }

  // Scout Entries
  async getScoutEntries(eventId: string): Promise<ScoutEntry[]> {
    if (isDemoMode()) return [];
    
    const q = query(
      getCollection('scoutEntries'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoutEntry));
  }

  async saveScoutEntry(entry: ScoutEntry): Promise<void> {
    if (isDemoMode()) return;
    
    const docRef = getDocument('scoutEntries', entry.id);
    await setDoc(docRef, {
      ...entry,
      serverTimestamp: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  subscribeToScoutEntries(eventId: string, callback: (entries: ScoutEntry[]) => void): UnsubscribeFn {
    if (isDemoMode()) return () => {};
    
    const q = query(
      getCollection('scoutEntries'),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScoutEntry));
      callback(entries);
    });
    
    this.listeners.set(`scoutEntries-${eventId}`, unsubscribe);
    return unsubscribe;
  }

  // Pit Scout Entries
  async getPitScoutEntries(eventId: string): Promise<PitScoutEntry[]> {
    if (isDemoMode()) return [];
    
    const q = query(
      getCollection('pitScoutEntries'),
      where('eventId', '==', eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PitScoutEntry));
  }

  async savePitScoutEntry(entry: PitScoutEntry): Promise<void> {
    if (isDemoMode()) return;
    
    const docRef = getDocument('pitScoutEntries', entry.id);
    await setDoc(docRef, {
      ...entry,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  subscribeToPitScoutEntries(eventId: string, callback: (entries: PitScoutEntry[]) => void): UnsubscribeFn {
    if (isDemoMode()) return () => {};
    
    const q = query(
      getCollection('pitScoutEntries'),
      where('eventId', '==', eventId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PitScoutEntry));
      callback(entries);
    });
    
    this.listeners.set(`pitScoutEntries-${eventId}`, unsubscribe);
    return unsubscribe;
  }

  // Team Stats
  async getTeamStats(eventId: string): Promise<TeamStats[]> {
    if (isDemoMode()) return [];
    
    const q = query(
      getCollection('teamStats'),
      where('eventId', '==', eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as TeamStats);
  }

  async saveTeamStats(stats: TeamStats): Promise<void> {
    if (isDemoMode()) return;
    
    const docId = `${stats.eventId}_${stats.teamNumber}`;
    const docRef = getDocument('teamStats', docId);
    await setDoc(docRef, {
      ...stats,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  }

  // Cleanup
  unsubscribeAll(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }

  unsubscribe(key: string): void {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }
}

export const firestoreService = new FirestoreService();
