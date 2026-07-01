import { useEffect, useState } from 'react';
import {
  getPlatformAccessModeStatus,
  loadPlatformAccessMode,
  type PlatformAccessModeStatus,
} from '@bandie/data';

let cachedStatus: PlatformAccessModeStatus | null = null;

export function usePlatformAccessMode(): PlatformAccessModeStatus | null {
  const [status, setStatus] = useState<PlatformAccessModeStatus | null>(cachedStatus);

  useEffect(() => {
    let cancelled = false;

    const apply = (next: PlatformAccessModeStatus) => {
      cachedStatus = next;
      if (!cancelled) {
        setStatus(next);
      }
    };

    if (cachedStatus) {
      void getPlatformAccessModeStatus()
        .then(apply)
        .catch(() => undefined);
      return () => {
        cancelled = true;
      };
    }

    void loadPlatformAccessMode()
      .then(apply)
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return status?.active ? status : null;
}

export async function bootstrapPlatformAccessMode(): Promise<PlatformAccessModeStatus> {
  const status = await loadPlatformAccessMode();
  cachedStatus = status;
  return status;
}
