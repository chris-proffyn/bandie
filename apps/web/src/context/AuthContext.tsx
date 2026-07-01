import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import {
  canSwitchWorkspaceMode,
  ensureAppMembership,
  ensureBandieProfile,
  getCurrentSession,
  getCurrentUserProfile,
  isPlatformAppAdminRole,
  isPlayerWorkspaceRoute,
  listUserBands,
  ensureLaunchTrialsExpired,
  loadPlatformEntitlementEnforcement,
  loadPlatformAccessMode,
  onAuthStateChange,
  resolveDisplayName,
  resolveWorkspaceMode,
  setBandieAdminModeActive,
  signOut,
  trackSessionActive,
  workspaceModeHomePath,
  type UserBand,
  type UserProfile,
  type WorkspaceMode,
} from '@bandie/data';

const ADMIN_MODE_STORAGE_PREFIX = 'bandie-admin-mode';
const WORKSPACE_MODE_STORAGE_PREFIX = 'bandie-workspace-mode';

function adminModeStorageKey(userId: string): string {
  return `${ADMIN_MODE_STORAGE_PREFIX}:${userId}`;
}

function workspaceModeStorageKey(userId: string): string {
  return `${WORKSPACE_MODE_STORAGE_PREFIX}:${userId}`;
}

function readStoredAdminMode(userId: string): boolean {
  return localStorage.getItem(adminModeStorageKey(userId)) === 'true';
}

function writeStoredAdminMode(userId: string, active: boolean): void {
  if (active) {
    localStorage.setItem(adminModeStorageKey(userId), 'true');
  } else {
    localStorage.removeItem(adminModeStorageKey(userId));
  }
}

function readStoredWorkspaceMode(userId: string): WorkspaceMode | null {
  const value = localStorage.getItem(workspaceModeStorageKey(userId));
  return value === 'player' || value === 'organiser' ? value : null;
}

function writeStoredWorkspaceMode(userId: string, mode: WorkspaceMode): void {
  localStorage.setItem(workspaceModeStorageKey(userId), mode);
}

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  displayName: string;
  bands: UserBand[];
  isAppAdmin: boolean;
  adminModeActive: boolean;
  isPlayer: boolean;
  isOrganiser: boolean;
  workspaceMode: WorkspaceMode;
  canSwitchWorkspaceMode: boolean;
  loading: boolean;
  membershipResolved: boolean;
  refreshBands: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setAdminModeActive: (active: boolean) => Promise<void>;
  setWorkspaceMode: (mode: WorkspaceMode) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bands, setBands] = useState<UserBand[]>([]);
  const [isAppAdmin, setIsAppAdmin] = useState(false);
  const [adminModeEnabled, setAdminModeEnabled] = useState(false);
  const [workspaceMode, setWorkspaceModeState] = useState<WorkspaceMode>('player');
  const [loading, setLoading] = useState(true);
  const [membershipResolved, setMembershipResolved] = useState(false);

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
    const currentSession = await getCurrentSession();
    if (!currentSession) {
      setBands([]);
      return;
    }
    const userBands = await listUserBands();
    setBands(userBands);
  }, []);

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
      setAdminModeEnabled(false);
      setWorkspaceModeState('player');
      setBandieAdminModeActive(false);
      setMembershipResolved(true);
      return;
    }

    setMembershipResolved(false);
    let mounted = true;

    ensureAppMembership()
      .then(async (membership) => {
        if (!mounted) {
          return;
        }

        const appAdmin = isPlatformAppAdminRole(membership.role);
        setIsAppAdmin(appAdmin);

        const storedAdminMode = appAdmin ? readStoredAdminMode(session.user.id) : false;
        setAdminModeEnabled(storedAdminMode);
        setBandieAdminModeActive(appAdmin && storedAdminMode);

        try {
          await refreshBands();
        } catch {
          if (mounted) {
            setBands([]);
          }
        }

        try {
          await refreshProfile();
        } catch {
          if (mounted) {
            setProfile(null);
          }
        }

        void Promise.allSettled([
          loadPlatformEntitlementEnforcement(),
          loadPlatformAccessMode(),
          ensureLaunchTrialsExpired(),
          trackSessionActive(),
        ]);
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setBands([]);
        setProfile(null);
        setIsAppAdmin(false);
        setAdminModeEnabled(false);
        setWorkspaceModeState('player');
        setBandieAdminModeActive(false);
      })
      .finally(() => {
        if (mounted) {
          setMembershipResolved(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [session, refreshBands, refreshProfile]);

  useEffect(() => {
    if (!session?.user || !profile) {
      return;
    }

    const storedMode = readStoredWorkspaceMode(session.user.id);
    const resolvedMode = resolveWorkspaceMode(profile.is_player, profile.is_organiser, storedMode);
    setWorkspaceModeState(resolvedMode);

    if (storedMode !== resolvedMode) {
      writeStoredWorkspaceMode(session.user.id, resolvedMode);
    }
  }, [session?.user, profile]);

  const adminModeActive = isAppAdmin && adminModeEnabled;

  useEffect(() => {
    if (loading || !session || !profile || adminModeActive) {
      return;
    }

    if (workspaceMode === 'organiser' && isPlayerWorkspaceRoute(location.pathname)) {
      navigate(workspaceModeHomePath('organiser'), { replace: true });
    }
  }, [loading, session, profile, adminModeActive, workspaceMode, location.pathname, navigate]);

  const setAdminModeActive = useCallback(
    async (active: boolean) => {
      if (!session?.user || !isAppAdmin) {
        return;
      }

      setAdminModeEnabled(active);
      writeStoredAdminMode(session.user.id, active);
      setBandieAdminModeActive(active);
      await refreshBands();

      if (!active) {
        navigate('/app/profile', { replace: true });
      }
    },
    [session?.user, isAppAdmin, refreshBands, navigate],
  );

  const setWorkspaceMode = useCallback(
    async (mode: WorkspaceMode) => {
      if (!session?.user || !profile) {
        return;
      }

      if (!canSwitchWorkspaceMode(profile.is_player, profile.is_organiser)) {
        return;
      }

      if (mode === 'player' && !profile.is_player) {
        return;
      }

      if (mode === 'organiser' && !profile.is_organiser) {
        return;
      }

      setWorkspaceModeState(mode);
      writeStoredWorkspaceMode(session.user.id, mode);

      if (mode === 'organiser' && isPlayerWorkspaceRoute(location.pathname)) {
        navigate(workspaceModeHomePath('organiser'), { replace: true });
      }
    },
    [session?.user, profile, location.pathname, navigate],
  );

  const logout = useCallback(async () => {
    navigate('/', { replace: true });
    await signOut();
    setSession(null);
    setBands([]);
    setProfile(null);
    setIsAppAdmin(false);
    setAdminModeEnabled(false);
    setWorkspaceModeState('player');
    setBandieAdminModeActive(false);
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

  const isPlayer = profile?.is_player ?? true;
  const isOrganiser = profile?.is_organiser ?? false;
  const canSwitchModes = canSwitchWorkspaceMode(isPlayer, isOrganiser);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      displayName,
      bands,
      isAppAdmin,
      adminModeActive,
      isPlayer,
      isOrganiser,
      workspaceMode,
      canSwitchWorkspaceMode: canSwitchModes,
      loading,
      membershipResolved,
      refreshBands,
      refreshProfile,
      setAdminModeActive,
      setWorkspaceMode,
      logout,
    }),
    [
      session,
      profile,
      displayName,
      bands,
      isAppAdmin,
      adminModeActive,
      isPlayer,
      isOrganiser,
      workspaceMode,
      canSwitchModes,
      loading,
      membershipResolved,
      refreshBands,
      refreshProfile,
      setAdminModeActive,
      setWorkspaceMode,
      logout,
    ],
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
