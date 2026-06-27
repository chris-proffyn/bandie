import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/app/AppLayout';
import { AcceptInvitePage } from './pages/app/AcceptInvitePage';
import { AppEntryPage } from './pages/app/AppEntryPage';
import { AdminUserProfileEditPage } from './pages/app/AdminUserProfileEditPage';
import { UserProfilePage } from './pages/app/UserProfilePage';
import { PendingInvitesPage } from './pages/app/PendingInvitesPage';
import { CreateBandPage } from './pages/app/CreateBandPage';
import { WorkspaceHomePage } from './pages/app/WorkspaceHomePage';
import { WorkspaceBandDirectoryPage } from './pages/app/WorkspaceBandDirectoryPage';
import { WorkspaceBandProfilePage } from './pages/app/WorkspaceBandProfilePage';
import { WorkspacePlayerDirectoryPage } from './pages/app/WorkspacePlayerDirectoryPage';
import { WorkspacePlayerProfilePage } from './pages/app/WorkspacePlayerProfilePage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SignupPage } from './pages/auth/SignupPage';
import { BandDirectoryPage } from './pages/BandDirectoryPage';
import { PlayerDirectoryPage } from './pages/PlayerDirectoryPage';
import { PublicPlayerProfilePage } from './pages/PublicPlayerProfilePage';
import { HomePage } from './pages/HomePage';
import { PublicBandProfilePage } from './pages/PublicBandProfilePage';

function RedirectToBandOverview() {
  const { bandId } = useParams();
  return <Navigate to={`/app/${bandId}`} replace />;
}

export default function App() {
  return (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bands" element={<BandDirectoryPage />} />
        <Route path="/bands/:slug" element={<PublicBandProfilePage />} />
        <Route path="/players" element={<PlayerDirectoryPage />} />
        <Route path="/players/:profileId" element={<PublicPlayerProfilePage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<AppEntryPage />} />
            <Route path="invites" element={<PendingInvitesPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="profiles/:profileId/edit" element={<AdminUserProfileEditPage />} />
            <Route path="bands/new" element={<CreateBandPage />} />
            <Route path="bands/:slug" element={<WorkspaceBandProfilePage />} />
            <Route path="bands" element={<WorkspaceBandDirectoryPage />} />
            <Route path="players/:profileId" element={<WorkspacePlayerProfilePage />} />
            <Route path="players" element={<WorkspacePlayerDirectoryPage />} />
            <Route path=":bandId" element={<WorkspaceHomePage />} />
            <Route path=":bandId/members" element={<RedirectToBandOverview />} />
            <Route path=":bandId/profile" element={<RedirectToBandOverview />} />
          </Route>
        </Route>
      </Routes>
  );
}
