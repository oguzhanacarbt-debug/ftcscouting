import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type DocumentReference,
  type CollectionReference,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  type Auth,
  type User,
} from 'firebase/auth';

// Firebase configuration from environment variables
// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB_uXR7FEbTaEf19t0BpdrIlKgaZZ67gN8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ftc-scouting-a59df.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ftc-scouting-a59df",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ftc-scouting-a59df.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1052548486634",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1052548486634:web:5393a636ff2f17a44d0e93",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-S7Q95C626S"
};

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;
let currentUser: User | null = null;

// Check if we're in demo mode
export const isDemoMode = (): boolean => {
  return false;
};

// Initialize Firebase
export const initializeFirebase = (): { app: FirebaseApp; db: Firestore; storage: FirebaseStorage; auth: Auth } => {
  if (isDemoMode()) {
    console.log('🎮 Running in demo mode - Firebase disabled');
    // Return mock objects for demo mode
    return {
      app: {} as FirebaseApp,
      db: {} as Firestore,
      storage: {} as FirebaseStorage,
      auth: {} as Auth,
    };
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);

  return { app, db, storage, auth };
};

// Get Firestore instance
export const getDb = (): Firestore => {
  if (isDemoMode()) throw new Error('Demo mode: Firestore not available');
  if (!db) initializeFirebase();
  return db!;
};

// Get Storage instance
export const getStorageInstance = (): FirebaseStorage => {
  if (isDemoMode()) throw new Error('Demo mode: Storage not available');
  if (!storage) initializeFirebase();
  return storage!;
};

// Get Auth instance
export const getAuthInstance = (): Auth => {
  if (isDemoMode()) throw new Error('Demo mode: Auth not available');
  if (!auth) initializeFirebase();
  return auth!;
};

// Anonymous sign in
export const signInAnonymouslyToFirebase = async (): Promise<User | null> => {
  if (isDemoMode()) {
    console.log('🎮 Demo mode: Simulated anonymous sign-in');
    return null;
  }

  const authInstance = getAuthInstance();
  try {
    const result = await signInAnonymously(authInstance);
    currentUser = result.user;
    console.log('✅ Signed in anonymously:', currentUser.uid);
    return currentUser;
  } catch (error) {
    console.error('❌ Anonymous sign-in failed:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => currentUser;

// Auth state listener
export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  if (isDemoMode()) {
    callback(null);
    return () => { };
  }

  const authInstance = getAuthInstance();
  return onAuthStateChanged(authInstance, (user) => {
    currentUser = user;
    callback(user);
  });
};

// Collection references
export const getCollection = (collectionName: string): CollectionReference => {
  return collection(getDb(), collectionName);
};

export const getDocument = (collectionName: string, docId: string): DocumentReference => {
  return doc(getDb(), collectionName, docId);
};

// Re-export Firestore utilities
export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  ref,
  uploadBytesResumable,
  getDownloadURL,
};

export type { DocumentReference, CollectionReference };
