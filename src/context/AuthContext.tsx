import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { getApps } from 'firebase/app';
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';
import {
  clearStoredAuth,
  getStoredToken,
  setStoredAuth,
  setUnauthorizedHandler,
} from '../api/client';
import { authApi, userApi } from '../api/endpoints';
import type { AuthSession, PrefilledUserData, UserProfile } from '../types/api';

export type AuthStatus =
  | 'initializing'
  | 'unauthenticated'
  | 'needsOnboarding'
  | 'pendingDeletion'
  | 'authenticated';

const PENDING_ROUTE_KEY = 'mateeazy_pending_shared_route';

export interface PendingSharedItem {
  kind: 'room' | 'post';
  id: string;
  targetRoute: string;
}

export function parseSharedPath(pathname: string): PendingSharedItem | null {
  const match = pathname.match(/^\/(room|post)\/([0-9A-Za-z-]+)\/?$/);
  if (!match) return null;
  const kind = match[1] as 'room' | 'post';
  const id = match[2];
  return {
    kind,
    id,
    targetRoute:
      kind === 'room' ? `/discover/room/${id}` : `/community/post/${id}`,
  };
}

interface AuthContextValue {
  status: AuthStatus;
  userId: string | null;
  profile: UserProfile | null;
  prefilled: PrefilledUserData | null;
  scheduledPurgeAt: string | null;
  pendingShared: PendingSharedItem | null;
  setPendingShared: (item: PendingSharedItem | null) => void;
  consumePendingShared: () => PendingSharedItem | null;
  signInWithFirebaseToken: (
    idToken: string,
    provider: 'GOOGLE' | 'PHONE'
  ) => Promise<void>;
  refreshProfile: () => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [prefilled, setPrefilled] = useState<PrefilledUserData | null>(null);
  const [scheduledPurgeAt, setScheduledPurgeAt] = useState<string | null>(null);
  const [pendingShared, setPendingSharedState] =
    useState<PendingSharedItem | null>(() => {
      try {
        const raw = sessionStorage.getItem(PENDING_ROUTE_KEY);
        return raw ? (JSON.parse(raw) as PendingSharedItem) : null;
      } catch {
        return null;
      }
    });

  const setPendingShared = useCallback((item: PendingSharedItem | null) => {
    setPendingSharedState(item);
    try {
      if (item) {
        sessionStorage.setItem(PENDING_ROUTE_KEY, JSON.stringify(item));
      } else {
        sessionStorage.removeItem(PENDING_ROUTE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const consumePendingShared = useCallback(() => {
    const current = pendingShared;
    setPendingShared(null);
    return current;
  }, [pendingShared, setPendingShared]);

  const signOut = useCallback(async () => {
    clearStoredAuth();
    setUserId(null);
    setProfile(null);
    setPrefilled(null);
    setScheduledPurgeAt(null);
    setStatus('unauthenticated');
    try {
      if (getApps().length) {
        await firebaseSignOut(getAuth());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const hydrateProfile = useCallback(async () => {
    const me = await userApi.getMe();
    setProfile(me);
    setUserId(me.userId);
    setStatus(me.isProfileComplete ? 'authenticated' : 'needsOnboarding');
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus('unauthenticated');
      return;
    }
    hydrateProfile().catch(() => {
      clearStoredAuth();
      setStatus('unauthenticated');
    });
  }, [hydrateProfile]);

  const applySession = useCallback(
    async (session: AuthSession) => {
      setStoredAuth(session.accessToken, session.userId);
      setUserId(session.userId);
      setPrefilled(session.preFilledUserData ?? null);

      if (session.pendingDeletion) {
        setScheduledPurgeAt(session.scheduledPurgeAt ?? null);
        setStatus('pendingDeletion');
        return;
      }
      if (!session.isProfileComplete) {
        setStatus('needsOnboarding');
        return;
      }
      await hydrateProfile();
    },
    [hydrateProfile]
  );

  const signInWithFirebaseToken = useCallback(
    async (idToken: string, provider: 'GOOGLE' | 'PHONE') => {
      const session = await authApi.verifyToken(idToken, provider);
      await applySession(session);
    },
    [applySession]
  );

  const refreshProfile = useCallback(async () => {
    await hydrateProfile();
  }, [hydrateProfile]);

  const markOnboardingComplete = useCallback(async () => {
    await hydrateProfile();
  }, [hydrateProfile]);

  return (
    <AuthContext.Provider
      value={{
        status,
        userId,
        profile,
        prefilled,
        scheduledPurgeAt,
        pendingShared,
        setPendingShared,
        consumePendingShared,
        signInWithFirebaseToken,
        refreshProfile,
        markOnboardingComplete,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
