import { useMemo, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { Game, Session } from '../module_bindings/types';
import ChatPanel from '../components/ChatPanel';
import Tutorial from '../components/Tutorial';

type Tab = 'arena' | 'ranks' | 'chat';

export default function Lobby({
  me,
  sessions,
  games,
  onOpenProfile,
  onOpenCollection,
}: {
  me: Session;
  sessions: readonly Session[];
  games: readonly Game[];
  onOpenProfile: (accountId: bigint) => void;
  onOpenShop?: () => void; // shop hidden for now; prop kept for easy re-enable
  onOpenCollection: () => void;
}) {
  const joinQueue = useReducer(reducers.joinQueue);
  const leaveQueue = useReducer(reducers.leaveQueue);
  const logout = useReducer(reducers.logout);
  const createChallenge = useReducer(reducers.createChallenge);
  const acceptChallenge = useReducer(reducers.acceptChallenge);
  const declineChallenge = useReducer(reducers.declineChallenge);
  const spectate = useReducer(reducers.spectate);
  const playBot = useReducer(reducers.playBot);

  const [queue] = useTable(tables.queue_entry);
  const [challenges] = useTable(tables.challenge);
  const [spectators] = useTable(tables.spectator);
  const [profiles] = useTable(tables.player_profile);

  const [tab, setTab] = useState<Tab>('arena');
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('chessv2_tutorial_seen'));
  const closeTutorial = () => {
    localStorage.setItem('chessv2_tutorial_seen', '1');
    setShowTutorial(false);
  };

  const [toast, setToast] = useState<string | null>(null);
  const say = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  };
  const oops = (e: unknown) => say(String(e instanceof Error ? e.message : e).replace(/^.*Error: /, ''));

  const queuedIds = useMemo(() => new Set(queue.map((q) => q.accountId.toString())), [queue]);
  const searching = queuedIds.has(me.accountId.toString());

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
  const myRating = profiles.find((p) => p.accountId === me.accountId)?.rating ?? 1200;

  /** Leaderboard hides fresh accounts (0 games) so test/new names don't flood it. */
  const ranked = useMemo(
    () => [...profiles].filter((p) => p.games > 0).sort((a, b) => b.rating - a.rating).slice(0, 100),
    [profiles],
  );

  return (
    <div className="lobby lobby-grid">
      <header className="lobby-head lobby-span">
        <div className="wordmark sm">
          CHESS<em>V2</em>
        </div>
        <div className="lobby-id">
          {/* wallet chips hidden while the shop is disabled */}
          <button className="lobby-user as-link" onClick={() => onOpenProfile(me.accountId)}>
            {me.username}
            <span className="lobby-rating">{myRating}</span>
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>

      <div className="lobby-left">
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

        <section className="play-zone panel">
          {searching ? (
            <button className="btn btn-searching" onClick={() => leaveQueue()}>
              <span className="pulse-dot" />
              Searching… <em>tap to cancel</em>
            </button>
          ) : (
            <button className="btn btn-gold btn-play" onClick={() => joinQueue().catch(oops)}>
              PLAY
            </button>
          )}
          <p className="play-hint">
            ranked · {players.length} online · {liveGames.length} live
          </p>
          <div className="nav-col">
            <button className="btn btn-ghost" onClick={() => playBot().catch(oops)}>
              🤖 Practice vs TimeKeeper
            </button>
            {/* Shop hidden for now — re-enable by restoring this button:
            <button className="btn btn-ghost" onClick={onOpenShop}>
              🛒 Shop
            </button> */}
            <button className="btn btn-ghost" onClick={onOpenCollection}>
              🃏 Cards & Loadouts
            </button>
            <button className="btn btn-ghost" onClick={() => setShowTutorial(true)}>
              📖 How to play
            </button>
            {mine ? (
              <button className="btn btn-ghost" onClick={() => declineChallenge({ challengeId: mine.challengeId }).catch(oops)}>
                {mine.toId === 0n ? '🏳 Cancel open challenge' : `⚔️ Cancel challenge to ${mine.toName}`}
              </button>
            ) : (
              <button className="btn btn-ghost" onClick={() => createChallenge({ toAccountId: 0n }).catch(oops)}>
                🏳 Post open challenge
              </button>
            )}
          </div>
        </section>
      </div>

      <div className="lobby-main panel">
        <div className="tab-bar">
          <button className={`tab ${tab === 'arena' ? 'tab-on' : ''}`} onClick={() => setTab('arena')}>
            Arena
          </button>
          <button className={`tab ${tab === 'ranks' ? 'tab-on' : ''}`} onClick={() => setTab('ranks')}>
            Leaderboard
          </button>
          <button className={`tab ${tab === 'chat' ? 'tab-on' : ''}`} onClick={() => setTab('chat')}>
            Chat
          </button>
        </div>

        <div className="tab-body">
          {tab === 'arena' && (
            <>
              {open.length > 0 && (
                <>
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
                </>
              )}

              {liveGames.length > 0 && (
                <>
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
                </>
              )}

              <h2 className="panel-title">Players online</h2>
              <ul className="player-list">
                {players.map((p) => (
                  <li key={p.accountId.toString()} className="player-row">
                    <button className="player-name as-link" onClick={() => onOpenProfile(p.accountId)}>
                      {p.username}
                      <span className="lobby-rating">
                        {profiles.find((pr) => pr.accountId === p.accountId)?.rating ?? ''}
                      </span>
                      {p.accountId === me.accountId && <span className="you-chip">you</span>}
                    </button>
                    <span className="player-side">
                      {p.status === 0 && queuedIds.has(p.accountId.toString()) ? (
                        <span className="status-chip searching">
                          <span className="pulse-dot sm" /> searching
                        </span>
                      ) : (
                        <span className={`status-chip s${p.status}`}>
                          {p.status === 1 ? 'in game' : p.status === 2 ? 'watching' : 'lobby'}
                        </span>
                      )}
                      {p.accountId !== me.accountId && p.status === 0 && !queuedIds.has(p.accountId.toString()) && (
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
            </>
          )}

          {tab === 'ranks' && (
            <ul className="player-list">
              {ranked.length === 0 && <div className="chat-empty">No rated games yet — be the first!</div>}
              {ranked.map((p, i) => (
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
          )}

          {tab === 'chat' && <ChatPanel channel={0} gameId={0n} myAccountId={me.accountId} />}
        </div>
      </div>

      {showTutorial && <Tutorial onClose={closeTutorial} />}
      {toast && <div className="toast toast-fixed">{toast}</div>}
    </div>
  );
}
