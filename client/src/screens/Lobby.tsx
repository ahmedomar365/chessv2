import { useMemo } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { Game, Session } from '../module_bindings/types';

export default function Lobby({ me, sessions, games }: { me: Session; sessions: readonly Session[]; games: readonly Game[] }) {
  const joinQueue = useReducer(reducers.joinQueue);
  const leaveQueue = useReducer(reducers.leaveQueue);
  const logout = useReducer(reducers.logout);
  const [queue] = useTable(tables.queue_entry);

  const searching = queue.some((q) => q.accountId === me.accountId);

  /** Online, logged-in players — deduped by account (multi-device). */
  const players = useMemo(() => {
    const seen = new Map<bigint, Session>();
    for (const s of sessions) {
      if (!s.online || s.accountId === 0n) continue;
      const prev = seen.get(s.accountId);
      if (!prev || s.status > prev.status) seen.set(s.accountId, s);
    }
    return [...seen.values()].sort((a, b) => a.username.localeCompare(b.username));
  }, [sessions]);

  const liveGames = games.filter((g) => g.phase < 2).length;

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div className="wordmark sm">
          CHESS<em>V2</em>
        </div>
        <div className="lobby-id">
          <span className="lobby-user">{me.username}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <section className="play-zone">
        {searching ? (
          <button className="btn btn-searching" onClick={() => leaveQueue()}>
            <span className="pulse-dot" />
            Searching for an opponent… <em>tap to cancel</em>
          </button>
        ) : (
          <button className="btn btn-gold btn-play" onClick={() => joinQueue()}>
            PLAY
          </button>
        )}
        <p className="play-hint">
          {players.length} {players.length === 1 ? 'player' : 'players'} online · {liveGames}{' '}
          {liveGames === 1 ? 'game' : 'games'} live
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">In the arena</h2>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.accountId.toString()} className="player-row">
              <span className="player-name">
                {p.username}
                {p.accountId === me.accountId && <span className="you-chip">you</span>}
              </span>
              <span className={`status-chip s${p.status}`}>
                {p.status === 1 ? 'in game' : p.status === 2 ? 'watching' : 'lobby'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
