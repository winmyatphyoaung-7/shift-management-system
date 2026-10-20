import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { LoginPage } from './pages/login-page.tsx'
import { ChangePasswordPage } from './pages/change-password-page.tsx'
import { ManagerMembersPage } from './pages/manager-members-page.tsx'
import { SchedulePage } from './pages/schedule-page.tsx'
import { NotificationsPage } from './pages/notifications-page.tsx'
import { StaffDashboardPage } from './pages/staff-dashboard-page.tsx'
import { ManagerDashboardPage } from './pages/manager-dashboard-page.tsx'
import { OpenReplacementsPage } from './pages/open-replacements-page.tsx'
import { MyReplacementsPage } from './pages/my-replacements-page.tsx'
import { ManagerReplacementsPage } from './pages/manager-replacements-page.tsx'
import { RequireAuth } from './features/auth/require-auth.tsx'
import { RequirePasswordChanged } from './features/auth/require-password-changed.tsx'
import { RequireManager } from './features/auth/require-manager.tsx'
import { RequireGuest } from './features/auth/require-guest.tsx'
import { AuthenticatedHomeRedirect } from './features/auth/authenticated-home-redirect.tsx'
import { AppLayout } from './layouts/app-layout.tsx'


function App() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route
          path="/login"
          element={<LoginPage />}
        />
      </Route>

      <Route
        element={<RequireAuth />}
      >

        <Route
          path="/"
          element={
            <AuthenticatedHomeRedirect />
          }
        />


        <Route
          path="/change-password"
          element={
            <ChangePasswordPage />
          }
        />

        <Route
          element={
            <RequirePasswordChanged />
          }
        >
          <Route element={<AppLayout />}>
            <Route
              element={<RequireManager />}
            >
              <Route
                path="/manager"
                element={
                  <ManagerDashboardPage />
                }
              />

              <Route
                path="/manager/members"
                element={<ManagerMembersPage />}
              />
              <Route
                path="/manager/replacements"
                element={
                  <ManagerReplacementsPage />
                }
              />
            </Route>


            <Route
              path="/dashboard"
              element={<StaffDashboardPage />}
            />

            <Route
              path="/schedule"
              element={<SchedulePage />}
            />
            <Route
              path="/replacements"
              element={<OpenReplacementsPage />}
            />
            <Route
              path="/my-replacements"
              element={<MyReplacementsPage />}
            />
            <Route
              path="/notifications"
              element={<NotificationsPage />}
            />
          </Route>
        </Route>
      </Route>


      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App