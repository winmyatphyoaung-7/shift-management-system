import {
  lazy,
  Suspense,
} from 'react'

import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { RequireAuth } from './features/auth/require-auth.tsx'
import { RequirePasswordChanged } from './features/auth/require-password-changed.tsx'
import { RequireManager } from './features/auth/require-manager.tsx'
import { RequireStaff } from './features/auth/require-staff.tsx'
import { RequireGuest } from './features/auth/require-guest.tsx'
import { AuthenticatedHomeRedirect } from './features/auth/authenticated-home-redirect.tsx'
import { AppLayout } from './layouts/app-layout.tsx'

const LoginPage = lazy(() =>
  import('./pages/login-page.tsx')
    .then((module) => ({
      default: module.LoginPage,
    })),
)

const ChangePasswordPage = lazy(() =>
  import('./pages/change-password-page.tsx')
    .then((module) => ({
      default:
        module.ChangePasswordPage,
    })),
)

const ManagerMembersPage = lazy(() =>
  import('./pages/manager-members-page.tsx')
    .then((module) => ({
      default:
        module.ManagerMembersPage,
    })),
)

const SchedulePage = lazy(() =>
  import('./pages/schedule-page.tsx')
    .then((module) => ({
      default: module.SchedulePage,
    })),
)

const NotificationsPage = lazy(() =>
  import('./pages/notifications-page.tsx')
    .then((module) => ({
      default:
        module.NotificationsPage,
    })),
)

const StaffDashboardPage = lazy(() =>
  import('./pages/staff-dashboard-page.tsx')
    .then((module) => ({
      default:
        module.StaffDashboardPage,
    })),
)

const ManagerDashboardPage = lazy(() =>
  import('./pages/manager-dashboard-page.tsx')
    .then((module) => ({
      default:
        module.ManagerDashboardPage,
    })),
)

const OpenReplacementsPage = lazy(() =>
  import('./pages/open-replacements-page.tsx')
    .then((module) => ({
      default:
        module.OpenReplacementsPage,
    })),
)

const MyReplacementsPage = lazy(() =>
  import('./pages/my-replacements-page.tsx')
    .then((module) => ({
      default:
        module.MyReplacementsPage,
    })),
)

const ManagerReplacementsPage =
  lazy(() =>
    import(
      './pages/manager-replacements-page.tsx'
    ).then((module) => ({
      default:
        module.ManagerReplacementsPage,
    })),
  )



function App() {
  return (
    <Suspense
      fallback={
        <div
          role="status"
          className="flex min-h-screen items-center justify-center gap-3 bg-slate-50"
        >
          <div className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="font-medium text-slate-600">
            読み込んでいます...
          </p>
        </div>
      }
    >
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


              <Route element={<RequireStaff />}>
                <Route
                  path="/dashboard"
                  element={<StaffDashboardPage />}
                />

                <Route
                  path="/replacements"
                  element={<OpenReplacementsPage />}
                />

                <Route
                  path="/my-replacements"
                  element={<MyReplacementsPage />}
                />
              </Route>

              <Route
                path="/schedule"
                element={<SchedulePage />}
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
    </Suspense>

  )
}

export default App