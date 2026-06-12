import { useMemo } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';

export default function ProfileScreen({
  accountId,
  onBack,
  onReplay,
}: {
  accountId: bigint;
  onBack: () => void;
  onReplay: (gameId: bigint) => void;
}) {
  const [profiles] = useTable(tables.player_profile.where((r) => r.accountId.eq(accountId)));
  const [history] = useTable(tables.rating_history.where((r) => r.accountId.eq(accountId)));
  const [games] = useTable(tables.game);
  const p = profiles[0];

  const points = useMemo(
    () => [...history].sort((a, b) => Number(a.id - b.id)).slice(-40).map((h) => h.rating),
    [history],
  );

  const myGames = useMemo(
    () =>
      games
        .filter((g) => g.phase === 2 && (g.whiteId === accountId || g.blackId === accountId))
        .sort((a, b) => Number(b.gameId - a.gameId))
        .slice(0, 20),
    [games, accountId],
  );

  if (!p) {
    return (
      <div className="center-stage">
        <p>Profile not found.</p>
        <button className="btn btn-ghost" onClick={onBack}>
          Back
        </button>
      </div>
    );
  }

  const winRate = p.games > 0 ? Math.round((p.wins / p.games) * 100) : 0;

  return (
    <div className="lobby">
      <header className="lobby-head">
        <div className="wordmark sm">
          CHESS<em>V2</em>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          Back
        </button>
      </header>

      <section className="panel profile-hero">
        <div className="profile-name">{p.username}</div>
        <div className="profile-rating">
          <span className="rating-big">{p.rating}</span>
          <span className="rating-peak">peak {p.peak}</span>
        </div>
        <Sparkline points={points} />
        <div className="profile-stats">
          <span>
            <strong>{p.games}</strong> games
          </span>
          <span>
            <strong>{p.wins}</strong>W · <strong>{p.losses}</strong>L · <strong>{p.draws}</strong>D
          </span>
          <span>
            <strong>{winRate}%</strong> win rate
          </span>
          {p.streak > 1 && (
            <span className="streak-chip">🔥 {p.streak} streak</span>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="panel-title">Match history</h2>
        {myGames.length === 0 && <div className="chat-empty">No finished games yet.</div>}
        <ul className="player-list">
          {myGames.map((g) => {
            const asWhite = g.whiteId === accountId;
            const won = (g.result === 1 && asWhite) || (g.result === 2 && !asWhite);
            const draw = g.result === 3;
            const vs = asWhite ? g.blackName : g.whiteName;
            return (
              <li key={g.gameId.toString()} className="player-row">
                <span className="player-name">
                  <span className={`result-dot ${draw ? 'dot-draw' : won ? 'dot-win' : 'dot-loss'}`} />
                  vs {vs}
                  <span className="vs-dim">{draw ? 'draw' : won ? 'won' : 'lost'}</span>
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => onReplay(g.gameId)}>
                  ▶ Replay
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="spark-empty">Play rated games to grow your rating graph</div>;
  }
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const w = 300;
  const h = 60;
  const path = points
    .map((r, i) => `${i === 0 ? 'M' : 'L'}${((i / (points.length - 1)) * w).toFixed(1)},${(h - ((r - min) / span) * (h - 8) - 4).toFixed(1)}`)
    .join(' ');
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path d={path} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}
