import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { Game, Session } from '../module_bindings/types';
import BoardSvg from '../game/BoardSvg';
import { legalTargets, type LPiece } from '../game/legal';

export default function GameScreen({
  game,
  me,
  onExit,
}: {
  game: Game;
  me: Session;
  onExit: () => void;
}) {
  const movePiece = useReducer(reducers.movePiece);
  const resign = useReducer(reducers.resign);
  const offerDraw = useReducer(reducers.offerDraw);

  const [pieces] = useTable(tables.piece.where((r) => r.gameId.eq(game.gameId)));
  const [moves] = useTable(tables.move_log.where((r) => r.gameId.eq(game.gameId)));

  const amWhite = game.whiteId === me.accountId;
  const myColor = amWhite ? 0 : 1;

  // ---- server clock offset (refined from each move's server timestamp) ----
  const offsetRef = useRef(0);
  useEffect(() => {
    if (moves.length === 0) return;
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    offsetRef.current = Number(latest.ts.toMillis()) - Date.now();
  }, [moves.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  // ---- selection & toasts ----
  const [selected, setSelected] = useState<number | null>(null);
  const [shakeSq, setShakeSq] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const say = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };
  const shake = (sq: number) => {
    setShakeSq(sq);
    setTimeout(() => setShakeSq(null), 350);
  };

  const lboard: LPiece[] = useMemo(
    () => pieces.map((p) => ({ ty: p.ty, color: p.color, sq: p.sq, hasMoved: p.hasMoved })),
    [pieces],
  );

  const targets = useMemo(
    () => (selected !== null ? legalTargets(lboard, selected, myColor) : []),
    [lboard, selected, myColor],
  );

  const myMated = amWhite ? game.whiteMated : game.blackMated;
  const myCheck = amWhite ? game.whiteInCheck : game.blackInCheck;
  const oppMated = amWhite ? game.blackMated : game.whiteMated;
  const oppOfferedDraw = amWhite ? game.blackDrawOffer : game.whiteDrawOffer;
  const iOfferedDraw = amWhite ? game.whiteDrawOffer : game.blackDrawOffer;

  const checkSq = useMemo(() => {
    if (!myCheck) return null;
    const king = pieces.find((p) => p.ty === 5 && p.color === myColor);
    return king ? king.sq : null;
  }, [myCheck, pieces, myColor]);

  const lastMove = useMemo(() => {
    if (moves.length === 0) return null;
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    return { from: latest.fromSq, to: latest.toSq };
  }, [moves]);

  const onSquare = (sq: number) => {
    if (game.phase !== 1) return;
    if (selected !== null && targets.includes(sq)) {
      const from = selected;
      setSelected(null);
      const moverRow = pieces.find((p) => p.sq === from);
      if (moverRow && Number(moverRow.cooldownUntil.toMillis()) > serverNow()) {
        shake(from);
        return;
      }
      if (myMated) {
        say('You are mated — only a card can save you now');
        return;
      }
      movePiece({ gameId: game.gameId, fromSq: from, toSq: sq }).catch((e) => {
        shake(sq);
        say(rejectionText(e));
      });
      return;
    }
    const p = pieces.find((q) => q.sq === sq);
    if (p && p.color === myColor) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  // ---- countdown ----
  const [countLeft, setCountLeft] = useState<number | null>(null);
  useEffect(() => {
    if (game.phase !== 0) {
      setCountLeft(null);
      return;
    }
    const startAt = Number(game.startedAt.toMillis());
    const id = setInterval(() => {
      const left = Math.ceil((startAt - serverNow()) / 1000);
      setCountLeft(left > 0 ? left : null);
    }, 100);
    return () => clearInterval(id);
  }, [game.phase, game.startedAt, serverNow]);

  const opponentName = amWhite ? game.blackName : game.whiteName;
  const finished = game.phase === 2;

  const [confirmResign, setConfirmResign] = useState(false);

  return (
    <div className="game-stage">
      <header className="game-bar">
        <span className="bar-name">
          {opponentName}
          {oppMated && <span className="badge badge-gold">MATED</span>}
        </span>
        <span className="bar-game">#{game.gameId.toString()}</span>
      </header>

      <div className="board-wrap">
        <BoardSvg
          pieces={pieces}
          flipped={!amWhite}
          selected={selected}
          targets={targets}
          lastMove={lastMove}
          checkSq={checkSq}
          shakeSq={shakeSq}
          serverNow={serverNow}
          onSquare={onSquare}
          frozen={myMated}
        />

        {countLeft !== null && (
          <div className="board-overlay">
            <span key={countLeft} className="countdown-num">{countLeft}</span>
          </div>
        )}

        {myMated && !finished && (
          <div className="mate-banner">
            ⛓️ MATED — your king is trapped
          </div>
        )}
        {myCheck && !myMated && !finished && <div className="check-chip">CHECK</div>}
        {toast && <div className="toast">{toast}</div>}
      </div>

      <footer className="game-bar">
        <span className="bar-name">
          {me.username}
          <span className="badge badge-dim">{amWhite ? 'white' : 'black'}</span>
        </span>
        <span className="bar-actions">
          <button
            className={`btn btn-ghost btn-sm ${oppOfferedDraw ? 'btn-attn' : ''} ${iOfferedDraw ? 'btn-active' : ''}`}
            onClick={() => offerDraw({ gameId: game.gameId }).catch(() => {})}
          >
            {oppOfferedDraw ? 'Accept draw' : iOfferedDraw ? 'Draw offered' : 'Offer draw'}
          </button>
          {confirmResign ? (
            <button
              className="btn btn-sm btn-danger"
              onClick={() => resign({ gameId: game.gameId }).catch(() => {})}
            >
              Confirm resign
            </button>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => {
              setConfirmResign(true);
              setTimeout(() => setConfirmResign(false), 3000);
            }}>
              Resign
            </button>
          )}
        </span>
      </footer>

      {finished && <ResultModal game={game} amWhite={amWhite} onExit={onExit} />}
    </div>
  );
}

function ResultModal({ game, amWhite, onExit }: { game: Game; amWhite: boolean; onExit: () => void }) {
  const iWon = (game.result === 1 && amWhite) || (game.result === 2 && !amWhite);
  const draw = game.result === 3;
  const reason = ['', 'king captured', 'resignation', 'abandonment', 'agreement'][game.resultReason] ?? '';
  return (
    <div className="modal-veil">
      <div className={`result-card ${draw ? 'is-draw' : iWon ? 'is-win' : 'is-loss'}`}>
        <div className="result-title">{draw ? 'DRAW' : iWon ? 'VICTORY' : 'DEFEAT'}</div>
        <div className="result-sub">{draw ? `by ${reason}` : `${reason}`}</div>
        <button className="btn btn-gold" onClick={onExit}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}

function rejectionText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('COOLDOWN')) return 'Still on cooldown';
  if (msg.includes('FROZEN_MATED')) return 'You are mated!';
  if (msg.includes('LeavesKingAttacked')) return 'Your king would fall';
  if (msg.includes('not live')) return 'Game over';
  return 'Illegal move';
}
