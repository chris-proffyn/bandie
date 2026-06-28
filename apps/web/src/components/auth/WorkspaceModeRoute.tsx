import { Navigate } from 'react-router-dom';
import { workspaceModeHomePath } from '@bandie/data';
import { useAuth } from '../../context/AuthContext';

type WorkspaceModeRouteProps = {
  mode: 'player' | 'organiser';
  children: React.ReactNode;
};

export function WorkspaceModeRoute({ mode, children }: WorkspaceModeRouteProps) {
  const { workspaceMode, adminModeActive, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (adminModeActive || workspaceMode === mode) {
    return children;
  }

  return <Navigate to={workspaceModeHomePath(workspaceMode)} replace />;
}
