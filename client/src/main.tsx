import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA + seamless updates: a new deploy never logs anyone out (the auth token
// lives in localStorage) and never interrupts a live game — the refreshed
// shell is applied when the player is back in the lobby or the tab is hidden.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      // check for a new version every few minutes
      setInterval(() => reg.update().catch(() => {}), 5 * 60_000);
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.dispatchEvent(new CustomEvent('chessv2:update-ready'));
        refreshing = true;
      });
    } catch {
      /* offline support is best-effort */
    }
  });
}
