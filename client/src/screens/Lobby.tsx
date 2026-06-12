import { useMemo, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { Game, Session } from '../module_bindings/types';
import ChatPanel from '../components/ChatPanel';

export default function Lobby({
  me,
  sessions,
  games,
  onOpenProfile,
}: {
  me: Session;
  sessions: readonly Session[];
  games: readonly Game[];
  onOpenProfile: (accountId: bigint) => void;
}) {
  const joinQueue = useReducer(reducers.joinQueue);
  const leaveQueue = useReducer(reducers.leaveQueue);
  const logout = useReducer(reducers.logout);
  const createChallenge = useReducer(reducers.createChallenge);
  const acceptChallenge = useReducer(reducers.acceptChallenge);
  const declineChallenge = useReducer(reducers.declineChallenge);
  const spectate = useReducer(reducers.spectate);

  const [queue] = useTable(tables.queue_entry);
  const [challenges] = useTable(tables.challenge);
  const [spectators] = useTable(tables.spectator);
  const [profiles] = useTable(tables.player_profile);
  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };

  const searching = queue.some((q) => q.accountId === me.accountId);

  const players = useMemo(() => {
    const seen = new Map<bigint, Session>();
    for (const s of sessions) {
      if (!s.online || s.accountId === 0n) continue;
      const prev = seen.get(s.accountId);
      if (!prev || s.status > prev.status) seen.set(s.accountId, s);
    }
    return [...seen.values()].sort((a, b) => a.username.localeCompare(b.username));
  }, [sessions]);

  const liveGames = useMemo(() => games.filter((g) => g.phase < 2), [games]);
  const incoming = challenges.filter((c) => c.toId === me.accountId);
  const open = challenges.filter((c) => c.toId === 0n && c.fromId !== me.accountId);
  const mine = challenges.find((c) => c.fromId === me.accountId);

  const oops = (e: unknown) => say(String(e instanceof Error ? e.message : e).replace(/^.*Error: /, ''));

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div className="wordmark sm">
          CHESS<em>V2</em>
        </div>
        <div className="lobby-id">
          <button className="lobby-user as-link" onClick={() => onOpenProfile(me.accountId)}>
            {me.username}
            <span className="lobby-rating">{profiles.find((p) => p.accountId === me.accountId)?.rating ?? 1200}</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      {incoming.map((c) => (
        <div key={c.challengeId.toString()} className="challenge-banner">
          <span>
            ⚔️ <strong>{c.fromName}</strong> challenges you!
          </span>
          <span className="challenge-actions">
            <button className="btn btn-gold btn-sm" onClick={() => acceptChallenge({ challengeId: c.challengeId }).catch(oops)}>
              Accept
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => declineChallenge({ challengeId: c.challengeId }).catch(oops)}>
              Decline
            </button>
          </span>
        </div>
      ))}

      <section className="play-zone">
        {searching ? (
          <button className="btn btn-searching" onClick={() => leaveQueue()}>
            <span className="pulse-dot" />
            Searching for an opponent… <em>tap to cancel</em>
          </button>
        ) : (
          <button className="btn btn-gold btn-play" onClick={() => joinQueue().catch(oops)}>
            PLAY
          </button>
        )}
        <div className="play-sub">
          {mine ? (
            <button className="btn btn-ghost btn-sm" onClick={() => declineChallenge({ challengeId: mine.challengeId }).catch(oops)}>
              {mine.toId === 0n ? '🏳 Open challenge posted — cancel' : `⚔️ Challenge sent to ${mine.toName} — cancel`}
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => createChallenge({ toAccountId: 0n }).catch(oops)}>
              Post open challenge
            </button>
          )}
        </div>
        <p className="play-hint">
          {players.length} {players.length === 1 ? 'player' : 'players'} online · {liveGames.length}{' '}
          {liveGames.length === 1 ? 'game' : 'games'} live
        </p>
      </section>

      {open.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">Open challenges</h2>
          <ul className="player-list">
            {open.map((c) => (
              <li key={c.challengeId.toString()} className="player-row">
                <span className="player-name">⚔️ {c.fromName}</span>
                <button className="btn btn-gold btn-sm" onClick={() => acceptChallenge({ challengeId: c.challengeId }).catch(oops)}>
                  Accept
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {liveGames.length > 0 && (
        <section className="panel">
          <h2 className="panel-title">Live games</h2>
          <ul className="player-list">
            {liveGames.map((g) => {
              const specCount = spectators.filter((s) => s.gameId === g.gameId).length;
              return (
                <li key={g.gameId.toString()} className="player-row">
                  <span className="player-name">
                    {g.whiteName} <em className="vs-dim">vs</em> {g.blackName}
                    {specCount > 0 && <span className="spec-count">👁 {specCount}</span>}
                  </span>
                  <button className="btn btn-ghost btn-sm" onClick={() => spectate({ gameId: g.gameId }).catch(oops)}>
                    Watch
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2 className="panel-title">In the arena</h2>
        <ul className="player-list">
          {players.map((p) => (
            <li key={p.accountId.toString()} className="player-row">
              <button className="player-name as-link" onClick={() => onOpenProfile(p.accountId)}>
                {p.username}
                <span className="lobby-rating">{profiles.find((pr) => pr.accountId === p.accountId)?.rating ?? ''}</span>
                {p.accountId === me.accountId && <span className="you-chip">you</span>}
              </button>
              <span className="player-side">
                <span className={`status-chip s${p.status}`}>
                  {p.status === 1 ? 'in game' : p.status === 2 ? 'watching' : 'lobby'}
                </span>
                {p.accountId !== me.accountId && p.status === 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => createChallenge({ toAccountId: p.accountId }).catch(oops)}
                  >
                    ⚔️
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel-title">Leaderboard</h2>
        <ul className="player-list">
          {[...profiles]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 100)
            .map((p, i) => (
              <li key={p.accountId.toString()} className="player-row">
                <button className="player-name as-link" onClick={() => onOpenProfile(p.accountId)}>
                  <span className={`rank-num ${i < 3 ? 'rank-top' : ''}`}>#{i + 1}</span>
                  {p.username}
                  {p.accountId === me.accountId && <span className="you-chip">you</span>}
                </button>
                <span className="lb-rating">{p.rating}</span>
              </li>
            ))}
        </ul>
      </section>

      <section className="panel chat-home">
        <h2 className="panel-title">Arena chat</h2>
        <ChatPanel channel={0} gameId={0n} myAccountId={me.accountId} />
      </section>

      {toast && <div className="toast toast-fixed">{toast}</div>}
    </div>
  );
}
