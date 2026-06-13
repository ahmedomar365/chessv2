import { useMemo, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import { CARDS } from '../game/cardsMeta';

const DECK_SIZE = 8;

export default function CollectionScreen({ onBack }: { onBack: () => void }) {
  const saveLoadout = useReducer(reducers.saveLoadout);
  const setActiveLoadout = useReducer(reducers.setActiveLoadout);
  const deleteLoadout = useReducer(reducers.deleteLoadout);

  const [myCards] = useTable(tables.my_cards);
  const [loadouts] = useTable(tables.my_loadouts);

  const [editing, setEditing] = useState<bigint | 0n | null>(null); // 0n = new
  const [draftName, setDraftName] = useState('');
  const [draftCards, setDraftCards] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };
  const oops = (e: unknown) => say(String(e instanceof Error ? e.message : e).replace(/^.*Error: /, ''));

  const copiesOf = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of myCards) m.set(c.cardId, c.copies);
    return m;
  }, [myCards]);

  const startEdit = (id: bigint | 0n, name: string, cards: number[]) => {
    setEditing(id);
    setDraftName(name);
    setDraftCards(cards);
  };

  const usedOf = (cardId: number) => draftCards.filter((c) => c === cardId).length;

  const save = () => {
    saveLoadout({ loadoutId: editing === 0n ? 0n : (editing as bigint), name: draftName || 'Loadout', deck: new Uint8Array(draftCards) })
      .then(() => {
        say('Loadout saved');
        setEditing(null);
      })
      .catch(oops);
  };

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div className="wordmark sm">LOADOUTS</div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          Back
        </button>
      </header>

      {editing === null ? (
        <>
          <section className="panel">
            <h2 className="panel-title">Your loadouts</h2>
            <ul className="player-list">
              {[...loadouts]
                .sort((a, b) => Number(a.loadoutId - b.loadoutId))
                .map((l) => (
                  <li key={l.loadoutId.toString()} className="player-row">
                    <span className="player-name">
                      {l.name}
                      {l.active && <span className="you-chip">active</span>}
                      <span className="vs-dim">{Array.from(l.cards).map((c) => CARDS[c]?.icon).join(' ')}</span>
                    </span>
                    <span className="player-side">
                      {!l.active && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setActiveLoadout({ loadoutId: l.loadoutId }).then(() => say('Active!')).catch(oops)}
                        >
                          Use
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => startEdit(l.loadoutId, l.name, Array.from(l.cards))}
                      >
                        Edit
                      </button>
                      {!l.active && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => deleteLoadout({ loadoutId: l.loadoutId }).catch(oops)}
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
            <button className="btn btn-gold btn-sm new-loadout" onClick={() => startEdit(0n, '', [])}>
              + New loadout
            </button>
          </section>

          <section className="panel">
            <h2 className="panel-title">Collection</h2>
            <ul className="player-list">
              {Object.values(CARDS).map((meta) => (
                <li key={meta.id} className="player-row">
                  <span className="player-name">
                    {meta.icon} {meta.name}
                    <span className="vs-dim">{meta.blurb}</span>
                  </span>
                  <span className="lb-rating">×{copiesOf.get(meta.id) ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <section className="panel">
          <h2 className="panel-title">{editing === 0n ? 'New loadout' : 'Edit loadout'}</h2>
          <label className="field">
            <span>Name</span>
            <input value={draftName} onChange={(e) => setDraftName(e.target.value)} maxLength={24} placeholder="My deck" />
          </label>

          <div className="deck-slots">
            {Array.from({ length: DECK_SIZE }, (_, i) => {
              const card = draftCards[i];
              return (
                <button
                  key={i}
                  className={`deck-slot ${card !== undefined ? 'deck-slot-full' : ''}`}
                  onClick={() => card !== undefined && setDraftCards((d) => d.filter((_, j) => j !== i))}
                >
                  {card !== undefined ? CARDS[card]?.icon : '·'}
                </button>
              );
            })}
          </div>
          <p className="shop-note">
            {draftCards.length}/{DECK_SIZE} — tap a card below to add, tap a slot to remove (max 3 copies each)
          </p>

          <div className="pick-grid">
            {Object.values(CARDS).map((meta) => {
              const owned = copiesOf.get(meta.id) ?? 0;
              const used = usedOf(meta.id);
              const can = draftCards.length < DECK_SIZE && used < Math.min(owned, 3);
              return (
                <button
                  key={meta.id}
                  className="card-tile"
                  disabled={!can}
                  onClick={() => setDraftCards((d) => [...d, meta.id])}
                >
                  <span className="card-icon">{meta.icon}</span>
                  <span className="card-name">{meta.name}</span>
                  <span className="card-cost">
                    {used}/{Math.min(owned, 3)}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="auth-actions">
            <button className="btn btn-gold" disabled={draftCards.length !== DECK_SIZE} onClick={save}>
              Save loadout
            </button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </section>
      )}

      {toast && <div className="toast toast-fixed">{toast}</div>}
    </div>
  );
}
