import { useEffect, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { Session } from '../module_bindings/types';
import { CARDS } from '../game/cardsMeta';
import MiniPreview from '../game/MiniPreview';
import { themeById } from '../game/themes';

const PAY_BASE = location.hostname === 'localhost' ? 'https://chessv2.com/api/pay' : '/api/pay';

declare global {
  interface Window {
    paypal?: { Buttons: (opts: Record<string, unknown>) => { render: (el: HTMLElement) => void } };
  }
}

export default function ShopScreen({ me, onBack }: { me: Session; onBack: () => void }) {
  const buyCardCopy = useReducer(reducers.buyCardCopy);
  const buySkin = useReducer(reducers.buySkin);
  const equipSkin = useReducer(reducers.equipSkin);

  const [wallets] = useTable(tables.my_wallet);
  const [myCards] = useTable(tables.my_cards);
  const [skins] = useTable(tables.skin_catalog);
  const [mySkins] = useTable(tables.my_skins);
  const [profiles] = useTable(tables.player_profile.where((r) => r.accountId.eq(me.accountId)));

  const wallet = wallets[0];
  const equipped = profiles[0]?.equippedSkin ?? 0;
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2600);
  };
  const oops = (e: unknown) => say(String(e instanceof Error ? e.message : e).replace(/^.*Error: /, ''));

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div className="wordmark sm">
          SHOP
        </div>
        <div className="lobby-id">
          <WalletChips coins={wallet?.coins ?? 0n} crowns={wallet?.crowns ?? 0n} />
          <button className="btn btn-ghost btn-sm" onClick={onBack}>
            Back
          </button>
        </div>
      </header>

      <section className="panel">
        <h2 className="panel-title">Crowns — premium currency</h2>
        <p className="shop-note">Crowns buy themes and card copies instantly. Payments via PayPal.</p>
        <div className="pack-grid">
          <CrownPack pack={0} label="100 Crowns" price="$0.99" accountId={me.accountId} onDone={say} />
          <CrownPack pack={1} label="550 Crowns" price="$4.99" accountId={me.accountId} onDone={say} />
          <CrownPack pack={2} label="1200 Crowns" price="$9.99" accountId={me.accountId} onDone={say} />
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Card copies — up to 3 each</h2>
        <ul className="player-list">
          {Object.values(CARDS).map((meta) => {
            const owned = myCards.find((c) => c.cardId === meta.id)?.copies ?? 0;
            const maxed = owned >= 3;
            return (
              <li key={meta.id} className="player-row">
                <span className="player-name">
                  {meta.icon} {meta.name}
                  <span className="vs-dim">×{owned}</span>
                </span>
                <span className="player-side">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={maxed}
                    onClick={() =>
                      buyCardCopy({ cardId: meta.id, withCrowns: false }).then(() => say('Copy added!')).catch(oops)
                    }
                  >
                    {maxed ? 'MAX' : '200 🪙'}
                  </button>
                  {!maxed && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        buyCardCopy({ cardId: meta.id, withCrowns: true }).then(() => say('Copy added!')).catch(oops)
                      }
                    >
                      40 ♛
                    </button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">Themes — 3 free, 10 premium</h2>
        <div className="theme-grid">
          {[...skins]
            .sort((a, b) => a.skinId - b.skinId)
            .map((s) => {
              const owned = s.free || mySkins.some((o) => o.skinId === s.skinId);
              const isEquipped = equipped === s.skinId;
              return (
                <div key={s.skinId} className={`theme-card ${isEquipped ? 'theme-equipped' : ''}`}>
                  <MiniPreview theme={themeById(s.skinId)} />
                  <div className="theme-row">
                    <span className="player-name">
                      {s.name}
                      {s.free && <span className="vs-dim">free</span>}
                      {isEquipped && <span className="you-chip">equipped</span>}
                    </span>
                    {owned ? (
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={isEquipped}
                        onClick={() => equipSkin({ skinId: s.skinId }).then(() => say('Equipped!')).catch(oops)}
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => buySkin({ skinId: s.skinId }).then(() => say('Theme unlocked!')).catch(oops)}
                      >
                        {s.priceCrowns.toString()} ♛
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {toast && <div className="toast toast-fixed">{toast}</div>}
    </div>
  );
}

export function WalletChips({ coins, crowns }: { coins: bigint; crowns: bigint }) {
  return (
    <span className="wallet-chips">
      <span className="chip-coin">🪙 {coins.toString()}</span>
      <span className="chip-crown">♛ {crowns.toString()}</span>
    </span>
  );
}

/** A PayPal smart button for one crown pack. */
function CrownPack({
  pack,
  label,
  price,
  accountId,
  onDone,
}: {
  pack: number;
  label: string;
  price: string;
  accountId: bigint;
  onDone: (msg: string) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (mounted.current) return; // render the buttons exactly once
        if (!window.paypal) {
          const cfg = await fetch(`${PAY_BASE}/config`).then((r) => r.json());
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[data-paypal]');
            if (existing) {
              // another pack is already loading the SDK — wait for it
              const poll = setInterval(() => {
                if (window.paypal) {
                  clearInterval(poll);
                  resolve();
                }
              }, 100);
              setTimeout(() => {
                clearInterval(poll);
                window.paypal ? resolve() : reject(new Error('paypal sdk timeout'));
              }, 15_000);
              return;
            }
            const s = document.createElement('script');
            s.src = `https://www.paypal.com/sdk/js?client-id=${cfg.clientId}&currency=USD`;
            s.dataset.paypal = '1';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('paypal sdk failed'));
            document.head.appendChild(s);
          });
        }
        if (cancelled || !holder.current || !window.paypal || mounted.current) return;
        mounted.current = true;
        await window.paypal
          .Buttons({
            style: { layout: 'horizontal', color: 'gold', height: 38, tagline: false },
            createOrder: async () => {
              const r = await fetch(`${PAY_BASE}/create-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pack, accountId: accountId.toString() }),
              });
              const d = await r.json();
              if (!r.ok) throw new Error(d.error ?? 'order failed');
              return d.id;
            },
            onApprove: async (data: { orderID: string }) => {
              const r = await fetch(`${PAY_BASE}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const d = await r.json();
              if (r.ok && d.ok) onDoneRef.current(`✨ ${d.crowns} Crowns added!`);
              else onDoneRef.current('Payment could not be verified — contact support');
            },
            onError: () => onDoneRef.current('Payment cancelled or failed'),
          })
          .render(holder.current);
        if (!cancelled) setState('ready');
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack]);

  return (
    <div className="pack-card">
      <div className="pack-label">♛ {label}</div>
      <div className="pack-price">{price}</div>
      <div ref={holder} className="pack-paypal" />
      {state === 'loading' && <div className="vs-dim">loading PayPal…</div>}
      {state === 'error' && <div className="chat-error">PayPal unavailable</div>}
    </div>
  );
}
