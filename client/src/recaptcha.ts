/**
 * reCAPTCHA v3 — invisible bot scoring. The site key is public (safe in the
 * client); the secret key lives only on the payment service. Flow: get a
 * token here → POST it with our STDB identity to /api/pay/recaptcha → the
 * service verifies with Google and blesses the identity so it may register.
 */

const SITE_KEY = '6LezVyAtAAAAAKfueCrWZkELKIYFf4uivGAlBTUk';

/** Same proxy the shop uses; on localhost we hit the live service. */
export const PAY_BASE = location.hostname === 'localhost' ? 'https://chessv2.com/api/pay' : '/api/pay';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loader: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    if (window.grecaptcha) return resolve();
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('recaptcha load failed'));
    document.head.appendChild(s);
  });
  return loader;
}

/** Returns a fresh reCAPTCHA v3 token for the given action. */
export async function getRecaptchaToken(action: string): Promise<string> {
  await loadScript();
  await new Promise<void>((r) => window.grecaptcha!.ready(() => r()));
  return window.grecaptcha!.execute(SITE_KEY, { action });
}
