import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { GuestRoute, ProtectedRoute } from './components/auth/ProtectedRoute';
import { WorkspaceModeRoute } from './components/auth/WorkspaceModeRoute';
import { AppLayout } from './components/app/AppLayout';
import { AcceptInvitePage } from './pages/app/AcceptInvitePage';
import { AppEntryPage } from './pages/app/AppEntryPage';
import { AdminUserProfileEditPage } from './pages/app/AdminUserProfileEditPage';
import { UserProfilePage } from './pages/app/UserProfilePage';
import { CommunicationsPage } from './pages/app/CommunicationsPage';
import { PendingInvitesPage } from './pages/app/PendingInvitesPage';
import { CreateBandPage } from './pages/app/CreateBandPage';
import { WorkspaceHomePage } from './pages/app/WorkspaceHomePage';
import { SongsDashboardPage } from './pages/app/SongsDashboardPage';
import { SongFolderPage } from './pages/app/SongFolderPage';
import { SongPartFolderPage } from './pages/app/SongPartFolderPage';
import { SetlistsDashboardPage } from './pages/app/SetlistsDashboardPage';
import { SetlistBuilderPage } from './pages/app/SetlistBuilderPage';
import { CalendarPage } from './pages/app/CalendarPage';
import { GigsDashboardPage } from './pages/app/GigsDashboardPage';
import { GigDetailPage } from './pages/app/GigDetailPage';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminAccountsPage } from './pages/admin/AdminAccountsPage';
import { AdminMetricsPage } from './pages/admin/AdminMetricsPage';
import { AdminEntitlementsPage } from './pages/admin/AdminEntitlementsPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';
import { WorkspaceBandDirectoryPage } from './pages/app/WorkspaceBandDirectoryPage';
import { WorkspaceBandProfilePage } from './pages/app/WorkspaceBandProfilePage';
import { WorkspacePlayerDirectoryPage } from './pages/app/WorkspacePlayerDirectoryPage';
import { WorkspacePlayerProfilePage } from './pages/app/WorkspacePlayerProfilePage';
import { MyVenuesPage } from './pages/app/MyVenuesPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { LoginPage } from './pages/auth/LoginPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SignupPage } from './pages/auth/SignupPage';
import { HomePage } from './pages/HomePage';
import { PublicBandProfilePage } from './pages/PublicBandProfilePage';

function RedirectToBandOverview() {
  const { bandId } = useParams();
  return <Navigate to={`/app/${bandId}`} replace />;
}

function RedirectToWorkspaceBandDirectory() {
  return <Navigate to="/app/bands" replace />;
}

function RedirectToWorkspacePlayerDirectory() {
  return <Navigate to="/app/players" replace />;
}

function RedirectToWorkspacePlayerProfile() {
  const { profileId } = useParams();
  return <Navigate to={`/app/players/${profileId ?? ''}`} replace />;
}

export default function App() {
  return (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/bands/:slug" element={<PublicBandProfilePage />} />
        <Route path="/invite/:token" element={<AcceptInvitePage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/bands" element={<RedirectToWorkspaceBandDirectory />} />
          <Route path="/players" element={<RedirectToWorkspacePlayerDirectory />} />
          <Route path="/players/:profileId" element={<RedirectToWorkspacePlayerProfile />} />

          <Route path="/app" element={<AppLayout />}>
            <Route
              index
              element={
                <WorkspaceModeRoute mode="player">
                  <AppEntryPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path="communications"
              element={
                <WorkspaceModeRoute mode="player">
                  <CommunicationsPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path="notifications"
              element={<Navigate to="/app/communications" replace />}
            />
            <Route
              path="invites"
              element={
                <WorkspaceModeRoute mode="player">
                  <PendingInvitesPage />
                </WorkspaceModeRoute>
              }
            />
            <Route path="profile" element={<UserProfilePage />} />
            <Route path="profiles/:profileId/edit" element={<AdminUserProfileEditPage />} />
            <Route
              path="bands/new"
              element={
                <WorkspaceModeRoute mode="player">
                  <CreateBandPage />
                </WorkspaceModeRoute>
              }
            />
            <Route path="bands/:slug" element={<WorkspaceBandProfilePage />} />
            <Route path="bands" element={<WorkspaceBandDirectoryPage />} />
            <Route
              path="venues"
              element={
                <WorkspaceModeRoute mode="organiser">
                  <MyVenuesPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path="players/:profileId"
              element={
                <WorkspaceModeRoute mode="player">
                  <WorkspacePlayerProfilePage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path="players"
              element={
                <WorkspaceModeRoute mode="player">
                  <WorkspacePlayerDirectoryPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/calendar"
              element={
                <WorkspaceModeRoute mode="player">
                  <CalendarPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/gigs/:gigId"
              element={
                <WorkspaceModeRoute mode="player">
                  <GigDetailPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/gigs"
              element={
                <WorkspaceModeRoute mode="player">
                  <GigsDashboardPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/setlists/:setlistId"
              element={
                <WorkspaceModeRoute mode="player">
                  <SetlistBuilderPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/setlists"
              element={
                <WorkspaceModeRoute mode="player">
                  <SetlistsDashboardPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/songs/:songId/parts/:partFolderId"
              element={
                <WorkspaceModeRoute mode="player">
                  <SongPartFolderPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/songs/:songId"
              element={
                <WorkspaceModeRoute mode="player">
                  <SongFolderPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/songs"
              element={
                <WorkspaceModeRoute mode="player">
                  <SongsDashboardPage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId"
              element={
                <WorkspaceModeRoute mode="player">
                  <WorkspaceHomePage />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/members"
              element={
                <WorkspaceModeRoute mode="player">
                  <RedirectToBandOverview />
                </WorkspaceModeRoute>
              }
            />
            <Route
              path=":bandId/profile"
              element={
                <WorkspaceModeRoute mode="player">
                  <RedirectToBandOverview />
                </WorkspaceModeRoute>
              }
            />
          </Route>

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverviewPage />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
            <Route path="metrics" element={<AdminMetricsPage />} />
            <Route path="entitlements" element={<AdminEntitlementsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>
        </Route>
      </Routes>
  );
}
