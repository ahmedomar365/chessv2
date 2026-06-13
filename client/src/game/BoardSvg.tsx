import { useEffect, useRef, useState } from 'react';
import type { Piece } from '../module_bindings/types';
import { PieceGlyph } from './pieces';
import { THEMES, type Theme } from './themes';

/**
 * League-style army skins: the WHITE army renders in the white player's
 * theme, the BLACK army in the black player's theme. The board itself stays
 * constant (Classic) so games always read cleanly.
 */
export function ArmyDefs({ white, black, prefix }: { white: Theme; black: Theme; prefix: string }) {
  return (
    <defs>
      <linearGradient id={`${prefix}-pw`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={white.whiteFill} />
        <stop offset="1" stopColor={white.whiteFill2} />
      </linearGradient>
      <linearGradient id={`${prefix}-pb`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={black.blackFill} />
        <stop offset="1" stopColor={black.blackFill2} />
      </linearGradient>
    </defs>
  );
}

/** Piece-material vars only — board squares keep their Classic CSS defaults. */
export function armyVars(white: Theme, black: Theme, prefix: string): React.CSSProperties {
  return {
    ['--pw-fill' as string]: `url(#${prefix}-pw)`,
    ['--pb-fill' as string]: `url(#${prefix}-pb)`,
    ['--pw-stroke' as string]: white.whiteStroke,
    ['--pb-stroke' as string]: black.blackStroke,
    ['--pw-detail' as string]: white.whiteDetail,
    ['--pb-detail' as string]: black.blackDetail,
  };
}

/** Full theming incl. board — used by shop previews only. */
export function previewVars(theme: Theme, prefix: string): React.CSSProperties {
  return {
    ...armyVars(theme, theme, prefix),
    ['--sq-light' as string]: theme.sqLight,
    ['--sq-dark' as string]: theme.sqDark,
    ['--sq-accent' as string]: theme.accent,
  };
}

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

export interface Flash {
  id: number;
  sq: number;
  /** css color keyword used by the flash ring */
  tone: 'gold' | 'ember' | 'teal' | 'violet';
}

export interface BoardProps {
  pieces: readonly Piece[];
  flipped: boolean;
  selected: number | null;
  targets: readonly number[];
  /** squares targetable by the armed card (cyan rings) */
  cardTargets: readonly number[];
  flashes: readonly Flash[];
  lastMove: { from: number; to: number } | null;
  premove: { from: number; to: number } | null;
  checkSq: number | null;
  shakeSq: number | null;
  /** piece ids currently locked in stasis */
  stasisIds: ReadonlySet<string>;
  /** serverNow() - returns estimated server time in ms */
  serverNow: () => number;
  onSquare: (sq: number) => void;
  /** drag-and-drop release: from → to (only fired when actually dragged) */
  onDrop?: (from: number, to: number) => void;
  /** squares whose pieces the local player may drag */
  draggable?: ReadonlySet<number>;
  frozen: boolean;
  /** the white player's equipped theme (their army's skin) */
  themeWhite?: Theme;
  /** the black player's equipped theme (their army's skin) */
  themeBlack?: Theme;
}

const xyOf = (sq: number, flipped: boolean) => {
  const f = sq % 8;
  const r = Math.floor(sq / 8);
  return flipped
    ? { x: (7 - f) * SQ, y: r * SQ }
    : { x: f * SQ, y: (7 - r) * SQ };
};

export default function BoardSvg(props: BoardProps) {
  const { pieces, flipped, selected, targets, cardTargets, flashes, lastMove, premove, checkSq, shakeSq, stasisIds, onSquare, onDrop, draggable, frozen } = props;
  const themeWhite = props.themeWhite ?? THEMES[0];
  const themeBlack = props.themeBlack ?? THEMES[0];
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<{ from: number; x: number; y: number; moved: boolean } | null>(null);

  const squareFromXY = (clientX: number, clientY: number): number | null => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const fx = Math.floor(((clientX - rect.left) / rect.width) * 8);
    const fy = Math.floor(((clientY - rect.top) / rect.height) * 8);
    if (fx < 0 || fx > 7 || fy < 0 || fy > 7) return null;
    const f = flipped ? 7 - fx : fx;
    const r = flipped ? fy : 7 - fy;
    return r * 8 + f;
  };

  /** board-space coords (0..800) for the drag ghost */
  const boardXY = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 800,
      y: ((clientY - rect.top) / rect.height) * 800,
    };
  };

  return (
    <svg
      ref={svgRef}
      className={`board ${frozen ? 'board-frozen' : ''}`}
      viewBox="0 0 800 800"
      style={armyVars(themeWhite, themeBlack, 'live')}
      onPointerDown={(e) => {
        const sq = squareFromXY(e.clientX, e.clientY);
        if (sq === null) return;
        onSquare(sq);
        if (draggable?.has(sq)) {
          const { x, y } = boardXY(e.clientX, e.clientY);
          setDrag({ from: sq, x, y, moved: false });
          svgRef.current?.setPointerCapture(e.pointerId);
        }
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const { x, y } = boardXY(e.clientX, e.clientY);
        setDrag({ ...drag, x, y, moved: true });
      }}
      onPointerUp={(e) => {
        if (!drag) return;
        const to = squareFromXY(e.clientX, e.clientY);
        const from = drag.from;
        const moved = drag.moved;
        setDrag(null);
        if (moved && to !== null && to !== from) onDrop?.(from, to);
      }}
      onPointerCancel={() => setDrag(null)}
    >
      <ArmyDefs white={themeWhite} black={themeBlack} prefix="live" />
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
            {premove !== null && (premove.from === sq || premove.to === sq) && (
              <rect x={x + 3} y={y + 3} width={SQ - 6} height={SQ - 6} className="sq-premove" />
            )}
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
          const dragging = drag !== null && drag.moved && drag.from === p.sq;
          const { x, y } = dragging
            ? { x: drag.x - 50, y: drag.y - 50 }
            : xyOf(p.sq, flipped);
          const inStasis = stasisIds.has(p.pieceId.toString());
          return (
            <g
              key={p.pieceId.toString()}
              className={`piece-slot ${shakeSq === p.sq ? 'piece-shake' : ''} ${dragging ? 'piece-dragging' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
            >
              <PieceGlyph ty={p.ty} color={p.color} themeId={p.color === 0 ? themeWhite.id : themeBlack.id} />
              {p.shielded && <circle cx={50} cy={50} r={46} className="shield-bubble" />}
              {inStasis && (
                <g className="stasis-crystal">
                  <circle cx={50} cy={50} r={45} className="stasis-ring" />
                  <path d="M50 8 L66 50 L50 92 L34 50 Z" className="stasis-shard" />
                </g>
              )}
              <CooldownRing piece={p} serverNow={props.serverNow} />
            </g>
          );
        })}

      {/* card targeting rings */}
      {cardTargets.map((sq) => {
        const { x, y } = xyOf(sq, flipped);
        return <circle key={`ct${sq}`} cx={x + 50} cy={y + 50} r={42} className="card-target-ring" />;
      })}

      {/* transient effect flashes */}
      {flashes.map((f) => {
        const { x, y } = xyOf(f.sq, flipped);
        return <circle key={f.id} cx={x + 50} cy={y + 50} r={44} className={`fx-flash fx-${f.tone}`} />;
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
