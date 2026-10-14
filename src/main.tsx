import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './styles.css'
import { captureRecoveryArrival } from './domain/recovery'

captureRecoveryArrival(window.location, window.history)

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// Installable app (PWA) in production builds only; never in dev or tests' dev server.
if (import.meta.env.PROD && 'serviceWorker' in navigator)
  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register(import.meta.env.BASE_URL + 'sw.js', {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        /* the site works without offline support */
      })
  })
