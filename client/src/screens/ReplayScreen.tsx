import { useEffect, useMemo, useState } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import BoardSvg from '../game/BoardSvg';
import { accuracy, gradeMoves, START_SNAPSHOT, type Grade } from '../game/judge';
import { piecesFromSnapshot } from '../game/snapshot';
import { themeById } from '../game/themes';

const GRADE_LABEL: Record<Grade, string> = {
  brilliant: '✨ Brilliant',
  good: '✓ Good',
  solid: '· Solid',
  inaccuracy: '?! Inaccuracy',
  blunder: '?? Blunder',
};

export default function ReplayScreen({ gameId, onBack }: { gameId: bigint; onBack: () => void }) {
  const [games] = useTable(tables.game.where((r) => r.gameId.eq(gameId)));
  const [moveRows] = useTable(tables.move_log.where((r) => r.gameId.eq(gameId)));
  const [profiles] = useTable(tables.player_profile);
  const game = games[0];
  const themeWhite = themeById(profiles.find((p) => game && p.accountId === game.whiteId)?.equippedSkin);
  const themeBlack = themeById(profiles.find((p) => game && p.accountId === game.blackId)?.equippedSkin);

  const graded = useMemo(
    () =>
      gradeMoves(
        moveRows.map((m) => ({
          seq: m.seq,
          tsMs: Number(m.ts.toMillis()),
          color: m.color,
          fromSq: m.fromSq,
          toSq: m.toSq,
          boardAfter: m.boardAfter,
        })),
      ),
    [moveRows],
  );

  // index = number of moves applied (0 = start position)
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const total = graded.length;

  useEffect(() => {
    if (!playing) return;
    if (index >= total) {
      setPlaying(false);
      return;
    }
    const gap =
      index === 0 ? 600 : Math.min(2000, Math.max(250, graded[index].tsMs - graded[index - 1].tsMs));
    const t = setTimeout(() => setIndex((i) => i + 1), gap);
    return () => clearTimeout(t);
  }, [playing, index, total, graded]);

  const snapshot = index === 0 ? START_SNAPSHOT : graded[index - 1].boardAfter;
  const pieces = useMemo(() => piecesFromSnapshot(snapshot, gameId), [snapshot, gameId]);
  const current = index > 0 ? graded[index - 1] : null;
  const lastMove = current ? { from: current.fromSq, to: current.toSq } : null;

  const accW = useMemo(() => accuracy(graded, 0), [graded]);
  const accB = useMemo(() => accuracy(graded, 1), [graded]);

  return (
    <div className="game-stage">
      <header className="game-bar">
        <span className="bar-name">
          ▶ {game ? `${game.whiteName} vs ${game.blackName}` : 'Replay'}
        </span>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          Back
        </button>
      </header>

      <div className="board-wrap">
        <BoardSvg
          pieces={pieces}
          flipped={false}
          selected={null}
          targets={[]}
          cardTargets={[]}
          flashes={[]}
          lastMove={lastMove}
          premove={null}
          checkSq={null}
          shakeSq={null}
          stasisIds={new Set()}
          serverNow={() => 0}
          onSquare={() => {}}
          frozen={false}
          themeWhite={themeWhite}
          themeBlack={themeBlack}
        />
        {current && (
          <div className={`grade-chip grade-${current.grade}`}>
            {current.color === 0 ? '⬜' : '⬛'} {GRADE_LABEL[current.grade]}
            {current.delta !== 0 && ` (${current.delta > 0 ? '+' : ''}${current.delta})`}
          </div>
        )}
      </div>

      <footer className="game-foot">
        <div className="foot-row replay-controls">
          <span className="replay-step">
            {index}/{total}
          </span>
          <span className="bar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex(0); }}>⏮</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex((i) => Math.max(0, i - 1)); }}>◀</button>
            <button className="btn btn-gold btn-sm" onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex((i) => Math.min(total, i + 1)); }}>▶︎</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setPlaying(false); setIndex(total); }}>⏭</button>
          </span>
        </div>
        <div className="foot-row judge-summary">
          <span>
            ⬜ {game?.whiteName} — accuracy <strong>{accW}%</strong>
          </span>
          <span>
            ⬛ {game?.blackName} — accuracy <strong>{accB}%</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}
