import { useEffect, useRef, useState } from 'react';
import type { Piece } from '../module_bindings/types';
import { PieceGlyph } from './pieces';

/** Cooldown per piece type (ms) — mirrors server/src/game.rs cooldown_micros. */
export const COOLDOWN_MS: Record<number, number> = {
  0: 3000,
  1: 5000,
  2: 5000,
  3: 7000,
  4: 10000,
  5: 7000,
};

const SQ = 100; // board is an 800×800 viewBox

export interface BoardProps {
  pieces: readonly Piece[];
  flipped: boolean;
  selected: number | null;
  targets: readonly number[];
  lastMove: { from: number; to: number } | null;
  checkSq: number | null;
  shakeSq: number | null;
  /** serverNow() - returns estimated server time in ms */
  serverNow: () => number;
  onSquare: (sq: number) => void;
  frozen: boolean;
}

const xyOf = (sq: number, flipped: boolean) => {
  const f = sq % 8;
  const r = Math.floor(sq / 8);
  return flipped
    ? { x: (7 - f) * SQ, y: r * SQ }
    : { x: f * SQ, y: (7 - r) * SQ };
};

export default function BoardSvg(props: BoardProps) {
  const { pieces, flipped, selected, targets, lastMove, checkSq, shakeSq, onSquare, frozen } = props;
  const svgRef = useRef<SVGSVGElement>(null);

  const squareFromEvent = (e: React.PointerEvent): number | null => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const fx = Math.floor(((e.clientX - rect.left) / rect.width) * 8);
    const fy = Math.floor(((e.clientY - rect.top) / rect.height) * 8);
    if (fx < 0 || fx > 7 || fy < 0 || fy > 7) return null;
    const f = flipped ? 7 - fx : fx;
    const r = flipped ? fy : 7 - fy;
    return r * 8 + f;
  };

  return (
    <svg
      ref={svgRef}
      className={`board ${frozen ? 'board-frozen' : ''}`}
      viewBox="0 0 800 800"
      onPointerDown={(e) => {
        const sq = squareFromEvent(e);
        if (sq !== null) onSquare(sq);
      }}
    >
      {/* squares */}
      {Array.from({ length: 64 }, (_, sq) => {
        const { x, y } = xyOf(sq, flipped);
        const dark = (Math.floor(sq / 8) + (sq % 8)) % 2 === 0;
        const isLast = lastMove !== null && (lastMove.from === sq || lastMove.to === sq);
        return (
          <g key={sq}>
            <rect x={x} y={y} width={SQ} height={SQ} className={dark ? 'sq-dark' : 'sq-light'} />
            {isLast && <rect x={x} y={y} width={SQ} height={SQ} className="sq-last" />}
            {selected === sq && <rect x={x} y={y} width={SQ} height={SQ} className="sq-selected" />}
          </g>
        );
      })}

      {/* coordinates */}
      {Array.from({ length: 8 }, (_, i) => {
        const fileChar = String.fromCharCode(97 + (flipped ? 7 - i : i));
        const rankChar = String(flipped ? i + 1 : 8 - i);
        return (
          <g key={i} className="coords">
            <text x={i * SQ + 6} y={796}>{fileChar}</text>
            <text x={6} y={i * SQ + 18}>{rankChar}</text>
          </g>
        );
      })}

      {/* check warning under the king */}
      {checkSq !== null && (() => {
        const { x, y } = xyOf(checkSq, flipped);
        return <circle cx={x + 50} cy={y + 50} r={44} className="check-ring" />;
      })()}

      {/* pieces */}
      {[...pieces]
        .sort((a, b) => Number(a.pieceId - b.pieceId))
        .map((p) => {
          const { x, y } = xyOf(p.sq, flipped);
          return (
            <g
              key={p.pieceId.toString()}
              className={`piece-slot ${shakeSq === p.sq ? 'piece-shake' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <PieceGlyph ty={p.ty} color={p.color} />
              <CooldownRing piece={p} serverNow={props.serverNow} />
            </g>
          );
        })}

      {/* legal target dots — on top so they're always visible */}
      {targets.map((sq) => {
        const { x, y } = xyOf(sq, flipped);
        const occupied = pieces.some((p) => p.sq === sq);
        return occupied ? (
          <circle key={sq} cx={x + 50} cy={y + 50} r={44} className="dot-capture" />
        ) : (
          <circle key={sq} cx={x + 50} cy={y + 50} r={13} className="dot-move" />
        );
      })}
    </svg>
  );
}

/** Gold ring that depletes while a piece cools down. */
function CooldownRing({ piece, serverNow }: { piece: Piece; serverNow: () => number }) {
  const [, force] = useState(0);
  const until = Number(piece.cooldownUntil.toMillis());
  const duration = COOLDOWN_MS[piece.ty] ?? 5000;
  const remaining = until - serverNow();

  useEffect(() => {
    if (remaining <= 0) return;
    let raf = 0;
    const tick = () => {
      force((n) => n + 1);
      if (piece.cooldownUntil.toMillis() > BigInt(Math.floor(serverNow()))) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [until]);

  if (remaining <= 0) return null;
  const pct = Math.min(1, Math.max(0, remaining / duration));
  return (
    <g className="cooldown">
      <circle cx={50} cy={50} r={43} className="cooldown-track" pathLength={100} />
      <circle
        cx={50}
        cy={50}
        r={43}
        className="cooldown-arc"
        pathLength={100}
        strokeDasharray={`${pct * 100} 100`}
        transform="rotate(-90 50 50)"
      />
    </g>
  );
}
