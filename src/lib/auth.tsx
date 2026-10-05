// Auth context: exposes the current Supabase session + the user's profile
// (which carries their role) to the whole app.
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Role = 'donor' | 'beneficiary' | 'staff';

export type Profile = {
  id: string;
  full_name: string | null;
  role: Role;
};

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('[BAMX] Could not load profile:', error.message);
    return null;
  }
  return data as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfileFor(nextSession: Session | null) {
    if (nextSession?.user) {
      setProfile(await fetchProfile(nextSession.user.id));
    } else {
      setProfile(null);
    }
  }

  useEffect(() => {
    // 1. Restore any persisted session on launch.
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfileFor(data.session);
      setLoading(false);
    });

    // 2. React to login / logout / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      loadProfileFor(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    session,
    profile,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (session?.user) setProfile(await fetchProfile(session.user.id));
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
