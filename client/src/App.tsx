import {
  Navigate,
  Route,
  Routes,
} from 'react-router'

import { LoginPage } from './pages/login-page.tsx'

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
        path="/change-password"
        element={
          <PlaceholderPage
            title="パスワード変更"
            description="初回ログイン時のパスワード変更画面を準備中です。"
          />
        }
      />

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