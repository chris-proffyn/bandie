import { useEffect, useState } from 'react';
import { getPlayerWorkspaceAccess, type PlayerWorkspaceAccess } from '@bandie/data';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ACCESS: PlayerWorkspaceAccess = {
  canCreateBand: false,
  canBrowseBandDirectory: false,
  canBrowsePlayerDirectory: false,
  canSendPlayerMessage: false,
};

export function usePlayerWorkspaceAccess(): {
  access: PlayerWorkspaceAccess;
  loading: boolean;
} {
  const { session } = useAuth();
  const [access, setAccess] = useState<PlayerWorkspaceAccess>(DEFAULT_ACCESS);
  const [loading, setLoading] = useState(Boolean(session));

  useEffect(() => {
    if (!session) {
      setAccess(DEFAULT_ACCESS);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getPlayerWorkspaceAccess()
      .then((result) => {
        if (!cancelled) {
          setAccess(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess(DEFAULT_ACCESS);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  return { access, loading };
}
