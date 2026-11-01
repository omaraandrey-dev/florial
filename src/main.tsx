import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ManagerApp from './manager/ManagerApp'
import { LanguageProvider } from './lib/i18n'

const isManagerRoute = window.location.pathname === '/manager' || window.location.pathname.startsWith('/manager/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isManagerRoute ? <ManagerApp /> : <LanguageProvider><App /></LanguageProvider>}
  </StrictMode>,
)
