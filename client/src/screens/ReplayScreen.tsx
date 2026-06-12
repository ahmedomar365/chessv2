import { useEffect, useMemo, useState } from 'react';
import { Timestamp } from 'spacetimedb';
import { useTable } from 'spacetimedb/react';
import { tables } from '../module_bindings';
import type { Piece } from '../module_bindings/types';
import BoardSvg from '../game/BoardSvg';
import { accuracy, gradeMoves, START_SNAPSHOT, type Grade } from '../game/judge';

const GRADE_LABEL: Record<Grade, string> = {
  brilliant: '✨ Brilliant',
  good: '✓ Good',
  solid: '· Solid',
  inaccuracy: '?! Inaccuracy',
  blunder: '?? Blunder',
};

/** Rebuild Piece-shaped rows from a 64-char snapshot for BoardSvg. */
function piecesFromSnapshot(snap: string, gameId: bigint): Piece[] {
  const out: Piece[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const ch = snap[sq];
    if (!ch || ch === '.') continue;
    const ty = { p: 0, n: 1, b: 2, r: 3, q: 4, k: 5 }[ch.toLowerCase()] ?? 5;
    out.push({
      pieceId: BigInt(sq + 1),
      gameId,
      ty,
      color: ch === ch.toUpperCase() ? 0 : 1,
      sq,
      hasMoved: false,
      cooldownUntil: new Timestamp(0n),
      shielded: false,
    } as Piece);
  }
  return out;
}

export default function ReplayScreen({ gameId, onBack }: { gameId: bigint; onBack: () => void }) {
  const [games] = useTable(tables.game.where((r) => r.gameId.eq(gameId)));
  const [moveRows] = useTable(tables.move_log.where((r) => r.gameId.eq(gameId)));
  const game = games[0];

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
          checkSq={null}
          shakeSq={null}
          serverNow={() => 0}
          onSquare={() => {}}
          frozen={false}
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
