import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import { Footer } from './components/Footer'
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(({ PrivacyPolicyPage }) => ({ default: PrivacyPolicyPage })))

const ManagerApp = lazy(() => import('./manager/ManagerApp'))
const isManagerRoute = window.location.pathname === '/manager' || window.location.pathname.startsWith('/manager/')
const isPrivacyPolicyRoute = window.location.pathname.replace(/\/+$/, '') === '/privacy-policy'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isManagerRoute ? (
      <Suspense fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-600"
          role="status"
          aria-live="polite"
        >
          Зареждане на панела за управление…
        </main>
      }>
        <ManagerApp />
      </Suspense>
    ) : isPrivacyPolicyRoute ? (
      <LanguageProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<main className="flex flex-grow items-center justify-center px-4 py-16 text-sm text-slate-500">Зареждане на страницата…</main>}><PrivacyPolicyPage /></Suspense>
          <Footer />
        </div>
      </LanguageProvider>
    ) : <LanguageProvider><App /></LanguageProvider>}
  </StrictMode>,
)
