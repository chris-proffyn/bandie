import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import {
  checkUserLeaderCapability,
  checkUserOrganiserCapability,
  isPlanCapabilityEnabledForUser,
  type EntitlementPlanScope,
} from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type WorkspaceEntitlementRouteProps = {
  capability: string;
  planScope?: EntitlementPlanScope;
  children: ReactNode;
  redirectTo?: string;
  /** When true, gate on plan entitlements even if platform enforcement is disabled. */
  planGated?: boolean;
};

export function WorkspaceEntitlementRoute({
  capability,
  planScope = 'leader',
  children,
  redirectTo = '/app',
  planGated = false,
}: WorkspaceEntitlementRouteProps) {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setAllowed(false);
      return;
    }

    let cancelled = false;
    const check = planGated
      ? isPlanCapabilityEnabledForUser(user.id, capability, planScope).then((enabled) => ({
          allowed: enabled,
        }))
      : planScope === 'organiser'
        ? checkUserOrganiserCapability(user.id, capability)
        : checkUserLeaderCapability(user.id, capability);

    check
      .then((decision) => {
        if (!cancelled) {
          setAllowed(decision.allowed);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllowed(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [capability, planGated, planScope, user]);

  if (allowed === null) {
    return (
      <div className="panel">
        <p>Loading…</p>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

type BandDirectoryAccessRouteProps = {
  children: ReactNode;
  redirectTo?: string;
};

export function BandDirectoryAccessRoute({
  children,
  redirectTo = '/app',
}: BandDirectoryAccessRouteProps) {
  const { workspaceMode } = useAuth();
  const capability =
    workspaceMode === 'organiser' ? 'band_directory.search' : 'band_directory.browse';
  const planScope = workspaceMode === 'organiser' ? 'organiser' : 'leader';

  return (
    <WorkspaceEntitlementRoute
      capability={capability}
      planScope={planScope}
      redirectTo={redirectTo}
      planGated
    >
      {children}
    </WorkspaceEntitlementRoute>
  );
}
