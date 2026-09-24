import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { LoginPage } from './pages/login-page.tsx'
import { ChangePasswordPage } from './pages/change-password-page.tsx'
import { RequireAuth } from './features/auth/require-auth.tsx'
import { RequirePasswordChanged } from './features/auth/require-password-changed.tsx'

type PlaceholderPageProps = {
  title: string
  description: string
}

function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
      <section className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-blue-600">
          SHIFT MANAGEMENT SYSTEM
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          {description}
        </p>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        element={<RequireAuth />}
      >
        <Route
          path="/change-password"
          element={
            <ChangePasswordPage/>
          }
        />

        <Route
          element={
            <RequirePasswordChanged />
          }
        >
          <Route
            path="/manager"
            element={
              <PlaceholderPage
                title="Manager Dashboard"
                description="マネージャー向け画面を準備中です。"
              />
            }
          />

          <Route
            path="/schedule"
            element={
              <PlaceholderPage
                title="My Schedule"
                description="公開済みシフトの確認画面を準備中です。"
              />
            }
          />
        </Route>
      </Route>

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />
    </Routes>
  )
}

export default App