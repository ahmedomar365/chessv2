/**
 * ChessV2 payment service — the ONLY trusted bridge between PayPal and the
 * SpacetimeDB module. Verifies captures with PayPal server-side, then grants
 * Crowns via the operator-only grant_purchase reducer (idempotent by order id).
 *
 * Env (.env is sourced by the systemd unit / start script — never committed):
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET   — sandbox or live app credentials
 *   PAYPAL_ENV                        — "sandbox" (default) | "live"
 *   STDB_URI                          — https://maincloud.spacetimedb.com
 *   STDB_DB                           — chessv2
 *   STDB_OPERATOR_TOKEN               — token of the pinned operator identity
 *   PORT                              — default 8787
 */

import express from 'express';

const {
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
  PAYPAL_ENV = 'sandbox',
  STDB_URI = 'https://maincloud.spacetimedb.com',
  STDB_DB = 'chessv2',
  STDB_OPERATOR_TOKEN,
  PORT = 8787,
} = process.env;

if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET || !STDB_OPERATOR_TOKEN) {
  console.error('Missing required env (PAYPAL_CLIENT_ID, PAYPAL_SECRET, STDB_OPERATOR_TOKEN)');
  process.exit(1);
}

const PAYPAL_BASE =
  PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

/** Crown packs — MUST stay in sync with the client shop display. */
const PACKS = [
  { usd: '0.99', crowns: 100 },
  { usd: '4.99', crowns: 550 },
  { usd: '9.99', crowns: 1200 },
];

const ALLOWED_ORIGINS = new Set([
  'https://chessv2.com',
  'https://www.chessv2.com',
  'http://localhost:5173',
]);

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ---- PayPal access token (cached) ----
let tokenCache = { token: null, exp: 0 };
async function paypalToken() {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60_000) return tokenCache.token;
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`paypal oauth ${res.status}`);
  const data = await res.json();
  tokenCache = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return tokenCache.token;
}

async function grantCrowns(accountId, crowns, orderId) {
  const res = await fetch(`${STDB_URI}/v1/database/${STDB_DB}/call/grant_purchase`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STDB_OPERATOR_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([Number(accountId), crowns, orderId]),
  });
  if (!res.ok) throw new Error(`grant failed ${res.status}: ${await res.text()}`);
}

// ---- routes ----

app.get('/api/pay/config', (_req, res) => {
  res.json({ clientId: PAYPAL_CLIENT_ID, env: PAYPAL_ENV, packs: PACKS });
});

app.post('/api/pay/create-order', async (req, res) => {
  try {
    const pack = Number(req.body?.pack);
    const accountId = String(req.body?.accountId ?? '');
    if (!(pack >= 0 && pack < PACKS.length) || !/^\d+$/.test(accountId) || accountId === '0') {
      return res.status(400).json({ error: 'bad pack or account' });
    }
    const token = await paypalToken();
    const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: { currency_code: 'USD', value: PACKS[pack].usd },
            custom_id: `${accountId}:${pack}`,
            description: `ChessV2 — ${PACKS[pack].crowns} Crowns`,
          },
        ],
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('create-order failed', data);
      return res.status(502).json({ error: 'paypal create failed' });
    }
    res.json({ id: data.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/pay/capture', async (req, res) => {
  try {
    const orderId = String(req.body?.orderId ?? '');
    if (!/^[A-Z0-9-]{5,40}$/i.test(orderId)) return res.status(400).json({ error: 'bad order id' });
    const token = await paypalToken();
    const r = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await r.json();
    // ALREADY_CAPTURED is fine — the grant is idempotent anyway.
    const alreadyCaptured = data?.details?.some?.((d) => d.issue === 'ORDER_ALREADY_CAPTURED');
    if (!r.ok && !alreadyCaptured) {
      console.error('capture failed', data);
      return res.status(502).json({ error: 'capture failed' });
    }

    // Re-fetch the order for a trustworthy view of what was paid.
    const or = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const order = await or.json();
    if (!or.ok || order.status !== 'COMPLETED') {
      return res.status(409).json({ error: 'order not completed' });
    }
    const unit = order.purchase_units?.[0];
    const customId = unit?.payments?.captures?.[0]?.custom_id ?? unit?.custom_id ?? '';
    const paid = unit?.payments?.captures?.[0]?.amount;
    const [accountId, packStr] = customId.split(':');
    const pack = PACKS[Number(packStr)];
    if (!pack || !accountId || paid?.currency_code !== 'USD' || paid?.value !== pack.usd) {
      console.error('verification mismatch', { customId, paid });
      return res.status(409).json({ error: 'verification mismatch' });
    }
    await grantCrowns(accountId, pack.crowns, orderId);
    res.json({ ok: true, crowns: pack.crowns });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'internal' });
  }
});

// Webhook: log-only in v1 (capture flow is the source of truth; grants are
// idempotent). Signature verification lands with live-mode hardening.
app.post('/api/pay/webhook', (req, res) => {
  console.log('webhook', req.body?.event_type ?? 'unknown');
  res.sendStatus(200);
});

app.get('/api/pay/health', (_req, res) => res.json({ ok: true, env: PAYPAL_ENV }));

app.listen(PORT, '127.0.0.1', () => console.log(`payments listening on 127.0.0.1:${PORT} (${PAYPAL_ENV})`));
