import './instrument'
import * as Sentry from '@sentry/react'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { AnalyticsConsent } from './components/AnalyticsConsent'
import App from './App.tsx'
import { LanguageProvider } from './lib/i18n'
import { Footer } from './components/Footer'
import { completeHomepageHandoff } from './lib/homepageHandoff.mjs'
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(({ PrivacyPolicyPage }) => ({ default: PrivacyPolicyPage })))
const WithdrawalPage = lazy(() => import('./pages/WithdrawalPage').then(({ WithdrawalPage }) => ({ default: WithdrawalPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then(({ TermsPage }) => ({ default: TermsPage })))

const ManagerApp = lazy(() => import('./manager/ManagerApp'))
const isManagerRoute = window.location.pathname === '/manager' || window.location.pathname.startsWith('/manager/')
const isPrivacyPolicyRoute = window.location.pathname.replace(/\/+$/, '') === '/privacy-policy'
const isWithdrawalRoute = window.location.pathname.replace(/\/+$/, '') === '/withdrawal'
const isTermsRoute = window.location.pathname.replace(/\/+$/, '') === '/terms'

const isHomepageRoute = window.location.pathname === '/'
const serverRoot = document.getElementById('root')
const clientRoot = isHomepageRoute ? document.getElementById('app-root') : null
const appMountNode = clientRoot || serverRoot
const onHomepageReady = isHomepageRoute ? () => {
  completeHomepageHandoff(serverRoot, clientRoot)
} : undefined

createRoot(appMountNode!).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => {
        const locale = new URLSearchParams(window.location.search).get('lang') || navigator.language.slice(0, 2)
        const copy = locale === 'ru'
          ? { message: 'Не удалось открыть страницу. Попробуйте ещё раз.', action: 'Повторить' }
          : locale === 'en'
            ? { message: 'We could not load this page. Please try again.', action: 'Try again' }
            : { message: 'Страницата не можа да се зареди. Опитайте отново.', action: 'Опитайте отново' }
        return (
          <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center text-slate-700" role="alert">
            <p>{copy.message}</p>
            <button type="button" onClick={resetError} className="rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">
              {copy.action}
            </button>
          </main>
        )
      }}
    >
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
    ) : isWithdrawalRoute ? (
      <LanguageProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<main className="flex flex-grow items-center justify-center px-4 py-16 text-sm text-stone-500">Зареждане на страницата…</main>}><WithdrawalPage /></Suspense>
          <Footer />
        </div>
              <AnalyticsConsent />
      </LanguageProvider>
    ) : isTermsRoute ? (
      <LanguageProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<main className="flex flex-grow items-center justify-center px-4 py-16 text-sm text-slate-500">Зареждане на страницата…</main>}><TermsPage /></Suspense>
          <Footer />
        </div>
              <AnalyticsConsent />
      </LanguageProvider>
    ) : isPrivacyPolicyRoute ? (
      <LanguageProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<main className="flex flex-grow items-center justify-center px-4 py-16 text-sm text-slate-500">Зареждане на страницата…</main>}><PrivacyPolicyPage /></Suspense>
          <Footer />
        </div>
              <AnalyticsConsent />
      </LanguageProvider>
    ) : <LanguageProvider><><App onHomepageReady={onHomepageReady} /><AnalyticsConsent /></></LanguageProvider>}
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
