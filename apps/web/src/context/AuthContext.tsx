import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import {
  ensureAppMembership,
  ensureBandieProfile,
  getCurrentSession,
  getCurrentUserProfile,
  isPlatformAppAdminRole,
  listUserBands,
  onAuthStateChange,
  resolveDisplayName,
  signOut,
  type UserBand,
  type UserProfile,
} from '@bandie/data';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  displayName: string;
  bands: UserBand[];
  isAppAdmin: boolean;
  loading: boolean;
  refreshBands: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bands, setBands] = useState<UserBand[]>([]);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session) {
      setProfile(null);
      return;
    }

    try {
      const currentProfile = await getCurrentUserProfile();
      if (currentProfile) {
        setProfile(currentProfile);
        return;
      }

      const created = await ensureBandieProfile();
      setProfile(created);
    } catch {
      setProfile(null);
    }
  }, [session]);

  const refreshBands = useCallback(async () => {
    if (!session) {
      setBands([]);
      return;
    }
    const userBands = await listUserBands();
    setBands(userBands);
  }, [session]);

  useEffect(() => {
    let mounted = true;

    getCurrentSession()
      .then((current) => {
        if (mounted) {
          setSession(current);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const unsubscribe = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setBands([]);
      setProfile(null);
      setIsAppAdmin(false);
      return;
    }

    ensureAppMembership()
      .then(async (membership) => {
        setIsAppAdmin(isPlatformAppAdminRole(membership.role));
        await Promise.all([refreshBands(), refreshProfile()]);
      })
      .catch(() => {
        setBands([]);
        setProfile(null);
        setIsAppAdmin(false);
      });
  }, [session, refreshBands, refreshProfile]);

  const logout = useCallback(async () => {
    navigate('/', { replace: true });
    await signOut();
    setSession(null);
    setBands([]);
    setProfile(null);
    setIsAppAdmin(false);
  }, [navigate]);

  const displayName = useMemo(
    () =>
      resolveDisplayName(
        profile,
        session?.user?.email,
        session?.user?.user_metadata?.display_name,
      ),
    [profile, session?.user?.email, session?.user?.user_metadata?.display_name],
  );

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      displayName,
      bands,
      isAppAdmin,
      loading,
      refreshBands,
      refreshProfile,
      logout,
    }),
    [session, profile, displayName, bands, isAppAdmin, loading, refreshBands, refreshProfile, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
