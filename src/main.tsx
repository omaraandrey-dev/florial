import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import { Footer } from './components/Footer'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'

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
          <PrivacyPolicyPage />
          <Footer />
        </div>
      </LanguageProvider>
    ) : <LanguageProvider><App /></LanguageProvider>}
  </StrictMode>,
)
