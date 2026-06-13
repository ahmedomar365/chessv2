import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { EffectLog, Game, Session } from '../module_bindings/types';
import BoardSvg, { type Flash } from '../game/BoardSvg';
import { CardHand, GemMeter } from '../game/CardHand';
import { CARDS, gemsNow } from '../game/cardsMeta';
import { legalTargets, isLegal, type LPiece } from '../game/legal';
import { piecesFromSnapshot } from '../game/snapshot';
import { themeById } from '../game/themes';
import ChatPanel from '../components/ChatPanel';

/** Spectators watch on a delay to prevent ghosting. */
const SPECTATE_DELAY_MS = 15_000;

export default function GameScreen({
  game,
  me,
  onExit,
  spectating = false,
}: {
  game: Game;
  me: Session;
  onExit: () => void;
  spectating?: boolean;
}) {
  const movePiece = useReducer(reducers.movePiece);
  const playCard = useReducer(reducers.playCard);
  const resign = useReducer(reducers.resign);
  const offerDraw = useReducer(reducers.offerDraw);
  const stopSpectating = useReducer(reducers.stopSpectating);

  const [livePieces] = useTable(tables.piece.where((r) => r.gameId.eq(game.gameId)));
  const [moves] = useTable(tables.move_log.where((r) => r.gameId.eq(game.gameId)));
  const [gemRows] = useTable(tables.game_gems.where((r) => r.gameId.eq(game.gameId)));
  const [statusRows] = useTable(tables.piece_status.where((r) => r.gameId.eq(game.gameId)));
  const [cardRows] = useTable(tables.my_card_state);
  const [allSpectators] = useTable(tables.spectator);
  const [sessions] = useTable(tables.session);
  const [profiles] = useTable(tables.player_profile);

  // League-style skins: each army wears its OWNER's equipped theme
  const themeWhite = themeById(profiles.find((p) => p.accountId === game.whiteId)?.equippedSkin);
  const themeBlack = themeById(profiles.find((p) => p.accountId === game.blackId)?.equippedSkin);
  const specCount = allSpectators.filter((s) => s.gameId === game.gameId).length;
  const [chatOpen, setChatOpen] = useState(false);

  const amWhite = spectating ? true : game.whiteId === me.accountId;
  const myColor = amWhite ? 0 : 1;
  const oppId = amWhite ? game.blackId : game.whiteId;

  // ---- server clock offset ----
  const offsetRef = useRef(0);
  useEffect(() => {
    if (moves.length === 0) return;
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    offsetRef.current = Number(latest.ts.toMillis()) - Date.now();
  }, [moves.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  // ---- delayed board for spectators (anti-ghosting) ----
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!spectating) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [spectating]);
  const pieces = useMemo(() => {
    if (!spectating || game.phase === 2) return livePieces;
    void tick;
    const cutoff = serverNow() - SPECTATE_DELAY_MS;
    const past = moves.filter((m) => Number(m.ts.toMillis()) <= cutoff);
    if (past.length === 0) return piecesFromSnapshot('RNBQKBNRPPPPPPPP' + '.'.repeat(32) + 'pppppppprnbqkbnr', game.gameId);
    const latest = past.reduce((a, b) => (a.seq > b.seq ? a : b));
    return piecesFromSnapshot(latest.boardAfter, game.gameId);
  }, [spectating, game.phase, game.gameId, livePieces, moves, tick, serverNow]);

  // ---- cards & gems ----
  const myCardState = useMemo(
    () => cardRows.find((c) => c.gameId === game.gameId && c.accountId === me.accountId),
    [cardRows, game.gameId, me.accountId],
  );
  const hand = useMemo(() => (myCardState ? Array.from(myCardState.hand) : []), [myCardState]);
  const deckCount = myCardState?.deck.length ?? 0;
  const discardCount = myCardState?.discard.length ?? 0;
  const myGems = gemRows.find((g) => g.accountId === me.accountId);
  const oppGems = gemRows.find((g) => g.accountId !== me.accountId);

  const [armed, setArmed] = useState<number | null>(null);
  const [swapFirst, setSwapFirst] = useState<number | null>(null);

  // ---- selection, premove, toasts, flashes ----
  const [selected, setSelected] = useState<number | null>(null);
  const [premove, setPremove] = useState<{ from: number; to: number } | null>(null);
  const [shakeSq, setShakeSq] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashId = useRef(0);

  const say = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };
  const shake = (sq: number) => {
    setShakeSq(sq);
    setTimeout(() => setShakeSq(null), 350);
  };
  const flash = useCallback((sq: number, tone: Flash['tone']) => {
    if (sq > 63) return;
    const id = ++flashId.current;
    setFlashes((fs) => [...fs, { id, sq, tone }]);
    setTimeout(() => setFlashes((fs) => fs.filter((f) => f.id !== id)), 750);
  }, []);

  // ---- stasis (active piece ids) ----
  const stasisIds = useMemo(() => {
    const now = serverNow();
    return new Set(
      statusRows.filter((s) => Number(s.stasisUntil.toMillis()) > now).map((s) => s.pieceId.toString()),
    );
  }, [statusRows, serverNow]);

  // ---- effect log → animations/toasts ----
  const seenReady = useRef(false);
  useEffect(() => {
    seenReady.current = false;
  }, [game.gameId]);
  useTable(tables.effect_log.where((r) => r.gameId.eq(game.gameId)), {
    onInsert: (e: EffectLog) => {
      if (!seenReady.current) return;
      const mine = e.actorColor === myColor;
      switch (e.kind) {
        case 0:
          if (!mine && !spectating) say(`Opponent played ${CARDS[e.card]?.name ?? 'a card'}`);
          break;
        case 1:
          flash(e.bSq, 'gold');
          flash(e.aSq, 'ember');
          say('🛡 Repelled!');
          break;
        case 2:
          flash(e.bSq, 'gold');
          say('👼 Guardian saved the king!');
          break;
        case 3:
          say('⏪ Time rewound 20 seconds');
          break;
        case 4:
          flash(e.aSq, 'teal');
          break;
        case 5:
          flash(e.aSq, 'gold');
          break;
        case 6:
          say(mine ? '⚡ Pawn Storm!' : '⚡ Enemy Pawn Storm!');
          break;
        case 8:
          say(mine ? '⏳ Stole 2 gems' : '⏳ Your gems were stolen!');
          break;
        case 10:
          flash(e.aSq, 'gold');
          say('🕊 A piece returns!');
          break;
        case 11:
          flash(e.aSq, 'teal');
          flash(e.bSq, 'teal');
          break;
        case 12:
          say(mine ? '⚙ Overclocked!' : '⚙ Enemy overclocked!');
          break;
        case 13:
          flash(e.aSq, 'violet');
          break;
      }
    },
  });
  useEffect(() => {
    const t = setTimeout(() => {
      seenReady.current = true;
    }, 1500);
    return () => clearTimeout(t);
  }, [game.gameId]);

  const lboard: LPiece[] = useMemo(
    () => pieces.map((p) => ({ ty: p.ty, color: p.color, sq: p.sq, hasMoved: p.hasMoved })),
    [pieces],
  );

  const targets = useMemo(
    () => (selected !== null && armed === null ? legalTargets(lboard, selected, myColor) : []),
    [lboard, selected, myColor, armed],
  );

  // ---- card targeting ----
  const armedCard = armed !== null && hand[armed] !== undefined ? CARDS[hand[armed]] : null;
  const cardTargets = useMemo(() => {
    if (!armedCard) return [];
    const now = serverNow();
    switch (armedCard.target) {
      case 'own':
        return pieces.filter((p) => p.color === myColor && !p.shielded).map((p) => p.sq);
      case 'own-cooling':
        return pieces
          .filter((p) => p.color === myColor && Number(p.cooldownUntil.toMillis()) > now)
          .map((p) => p.sq);
      case 'enemy':
        return pieces.filter((p) => p.color !== myColor).map((p) => p.sq);
      case 'own-two':
        return pieces
          .filter(
            (p) => p.color === myColor && Number(p.cooldownUntil.toMillis()) <= now && p.sq !== swapFirst,
          )
          .map((p) => p.sq);
      case 'own-pawn':
        return pieces.filter((p) => p.color === myColor && p.ty === 0).map((p) => p.sq);
      case 'any':
        return pieces.map((p) => p.sq);
      case 'empty-home': {
        const occupied = new Set(pieces.map((p) => p.sq));
        const out: number[] = [];
        for (let sq = 0; sq < 64; sq++) {
          const r = Math.floor(sq / 8);
          const home = myColor === 0 ? r <= 1 : r >= 6;
          if (home && !occupied.has(sq)) out.push(sq);
        }
        return out;
      }
      default:
        return [];
    }
  }, [armedCard, pieces, myColor, swapFirst, serverNow]);

  const disarm = () => {
    setArmed(null);
    setSwapFirst(null);
  };

  const sendCard = (handIndex: number, a: number, b: number) => {
    playCard({ gameId: game.gameId, handIndex, targetA: a, targetB: b }).catch((e) => say(cardError(e)));
    disarm();
  };

  const onArm = (index: number | null) => {
    setSelected(null);
    setSwapFirst(null);
    if (index === null) {
      setArmed(null);
      return;
    }
    const meta = CARDS[hand[index]];
    if (!meta || meta.target === 'passive') return;
    const have = myGems ? gemsNow(myGems.base, Number(myGems.anchor.toMillis()), serverNow()) : 0;
    if (meta.cost !== null && have < meta.cost) {
      say('Not enough gems');
      return;
    }
    if (meta.target === 'none') {
      sendCard(index, 255, 255);
      return;
    }
    setArmed(index);
  };

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
    if (spectating) {
      const cutoff = serverNow() - SPECTATE_DELAY_MS;
      const past = moves.filter((m) => Number(m.ts.toMillis()) <= cutoff);
      if (past.length === 0) return null;
      const latest = past.reduce((a, b) => (a.seq > b.seq ? a : b));
      return { from: latest.fromSq, to: latest.toSq };
    }
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    return { from: latest.fromSq, to: latest.toSq };
  }, [moves, spectating, serverNow, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- moving: tap, drag, premove ----
  const attemptMove = useCallback(
    (from: number, to: number) => {
      if (myMated) {
        say('You are mated — only a card can save you now');
        return;
      }
      const mover = livePieces.find((p) => p.sq === from);
      if (!mover) return;
      if (Number(mover.cooldownUntil.toMillis()) > serverNow()) {
        // lichess-style premove: queued and fired the instant the piece is ready
        setPremove({ from, to });
        return;
      }
      setPremove(null);
      movePiece({ gameId: game.gameId, fromSq: from, toSq: to }).catch((e) => {
        shake(to);
        say(rejectionText(e));
      });
    },
    [livePieces, myMated, game.gameId, movePiece, serverNow], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // premove auto-fire
  useEffect(() => {
    if (!premove || spectating) return;
    const id = setInterval(() => {
      const mover = livePieces.find((p) => p.sq === premove.from && p.color === myColor);
      if (!mover) {
        setPremove(null);
        return;
      }
      if (Number(mover.cooldownUntil.toMillis()) <= serverNow()) {
        setPremove(null);
        const lb = livePieces.map((p) => ({ ty: p.ty, color: p.color, sq: p.sq, hasMoved: p.hasMoved }));
        if (isLegal(lb, premove.from, premove.to, myColor)) {
          movePiece({ gameId: game.gameId, fromSq: premove.from, toSq: premove.to }).catch(() => {});
        }
      }
    }, 80);
    return () => clearInterval(id);
  }, [premove, livePieces, myColor, spectating, game.gameId, movePiece, serverNow]);

  const draggable = useMemo(
    () => (spectating ? new Set<number>() : new Set(livePieces.filter((p) => p.color === myColor).map((p) => p.sq))),
    [livePieces, myColor, spectating],
  );

  const onSquare = (sq: number) => {
    if (spectating || game.phase !== 1) return;

    if (armed !== null && armedCard) {
      if (!cardTargets.includes(sq)) {
        disarm();
        return;
      }
      if (armedCard.target === 'own-two') {
        if (swapFirst === null) {
          setSwapFirst(sq);
          return;
        }
        sendCard(armed, swapFirst, sq);
        return;
      }
      sendCard(armed, sq, 255);
      return;
    }

    if (premove && sq !== premove.from) setPremove(null);

    if (selected !== null && (targets.includes(sq) || pieces.find((p) => p.sq === selected && Number(p.cooldownUntil.toMillis()) > serverNow()))) {
      const from = selected;
      if (from === sq) {
        setSelected(null);
        return;
      }
      // allow premove targets beyond current legality when the piece is cooling
      const coolingMover = livePieces.find((p) => p.sq === from && Number(p.cooldownUntil.toMillis()) > serverNow());
      if (targets.includes(sq) || coolingMover) {
        setSelected(null);
        attemptMove(from, sq);
        return;
      }
    }
    const p = pieces.find((q) => q.sq === sq);
    if (p && p.color === myColor) setSelected(sq === selected ? null : sq);
    else setSelected(null);
  };

  const onDrop = (from: number, to: number) => {
    if (spectating || game.phase !== 1 || armed !== null) return;
    setSelected(null);
    attemptMove(from, to);
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

  const oppGemCount = oppGems ? gemsNow(oppGems.base, Number(oppGems.anchor.toMillis()), serverNow()) : 0;
  const opponentOnline =
    spectating || opponentName === 'TimeKeeper' || sessions.some((s) => s.accountId === oppId && s.online);

  return (
    <div className="game-stage game-grid">
      <header className="game-bar area-head">
        <span className="bar-name">
          {spectating ? (
            <>
              {game.whiteName} <em className="vs-dim">vs</em> {game.blackName}
              <span className="badge badge-dim">delayed 15s</span>
            </>
          ) : (
            <>
              {opponentName}
              {oppMated && <span className="badge badge-gold">MATED</span>}
              <span className="opp-gems">◆ {oppGemCount}</span>
            </>
          )}
          {specCount > 0 && <span className="spec-count">👁 {specCount}</span>}
        </span>
        <span className="bar-actions">
          <button className={`btn btn-ghost btn-sm ${chatOpen ? 'btn-active' : ''}`} onClick={() => setChatOpen((v) => !v)}>
            💬
          </button>
          {spectating ? (
            <button className="btn btn-ghost btn-sm" onClick={() => stopSpectating().catch(() => {})}>
              Stop watching
            </button>
          ) : (
            <>
              <button
                className={`btn btn-ghost btn-sm ${oppOfferedDraw ? 'btn-attn' : ''} ${iOfferedDraw ? 'btn-active' : ''}`}
                onClick={() => offerDraw({ gameId: game.gameId }).catch(() => {})}
              >
                {oppOfferedDraw ? 'Accept draw' : iOfferedDraw ? 'Draw offered' : 'Draw'}
              </button>
              {confirmResign ? (
                <button className="btn btn-sm btn-danger" onClick={() => resign({ gameId: game.gameId }).catch(() => {})}>
                  Confirm
                </button>
              ) : (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setConfirmResign(true);
                    setTimeout(() => setConfirmResign(false), 3000);
                  }}
                >
                  Resign
                </button>
              )}
            </>
          )}
        </span>
      </header>

      <div className="board-wrap area-board">
        <BoardSvg
          pieces={pieces}
          flipped={!amWhite}
          selected={selected}
          targets={targets}
          cardTargets={cardTargets}
          flashes={flashes}
          lastMove={lastMove}
          premove={premove}
          checkSq={checkSq}
          shakeSq={shakeSq}
          stasisIds={stasisIds}
          serverNow={serverNow}
          onSquare={onSquare}
          onDrop={onDrop}
          draggable={draggable}
          frozen={myMated}
          themeWhite={themeWhite}
          themeBlack={themeBlack}
        />

        {countLeft !== null && (
          <div className="board-overlay">
            <span key={countLeft} className="countdown-num">
              {countLeft}
            </span>
          </div>
        )}

        {!opponentOnline && !finished && (
          <div className="dc-banner">📡 {opponentName} disconnected — auto-win if they don't return</div>
        )}
        {myMated && !finished && <div className="mate-banner">⛓ MATED — your king is trapped</div>}
        {myCheck && !myMated && !finished && <div className="check-chip">CHECK</div>}
        {armedCard && (
          <div className="aim-chip">
            {armedCard.icon} {armedCard.name}: {swapFirst !== null ? 'pick the second piece' : aimHint(armedCard.target)}
          </div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>

      {spectating ? (
        <footer className="game-foot area-foot">
          <div className="foot-row">
            <span className="bar-name">spectating</span>
            <span className="spec-gem-row">
              <span className="spec-gem">⬜ ◆ {gemsFor(gemRows, game.whiteId, serverNow)}</span>
              <span className="spec-gem">⬛ ◆ {gemsFor(gemRows, game.blackId, serverNow)}</span>
            </span>
          </div>
        </footer>
      ) : (
        <footer className="game-foot area-foot">
          <div className="foot-row">
            <span className="bar-name">
              {me.username}
              <span className="badge badge-dim">{amWhite ? 'white' : 'black'}</span>
            </span>
            <span className="deck-chip" title="deck · discard">
              🂠 {deckCount} · 🗑 {discardCount}
            </span>
            {myGems && (
              <GemMeter base={myGems.base} anchorMs={Number(myGems.anchor.toMillis())} serverNow={serverNow} />
            )}
          </div>
          <CardHand
            hand={hand}
            gems={myGems ? gemsNow(myGems.base, Number(myGems.anchor.toMillis()), serverNow()) : 0}
            armedIndex={armed}
            onArm={onArm}
          />
        </footer>
      )}

      {chatOpen && (
        <div className="chat-drawer">
          <ChatPanel channel={spectating ? 2 : 1} gameId={game.gameId} myAccountId={me.accountId} compact />
        </div>
      )}

      {finished &&
        (spectating ? (
          <ResultModalSpec game={game} onExit={() => stopSpectating().catch(() => {})} />
        ) : (
          <ResultModal game={game} amWhite={amWhite} onExit={onExit} />
        ))}
    </div>
  );
}

function gemsFor(
  rows: readonly { accountId: bigint; base: number; anchor: { toMillis(): bigint } }[],
  accountId: bigint,
  serverNow: () => number,
): number {
  const r = rows.find((g) => g.accountId === accountId);
  return r ? gemsNow(r.base, Number(r.anchor.toMillis()), serverNow()) : 0;
}

function ResultModal({ game, amWhite, onExit }: { game: Game; amWhite: boolean; onExit: () => void }) {
  const iWon = (game.result === 1 && amWhite) || (game.result === 2 && !amWhite);
  const draw = game.result === 3;
  const reason = ['', 'king captured', 'resignation', 'abandonment', 'agreement'][game.resultReason] ?? '';
  return (
    <div className="modal-veil">
      <div className={`result-card ${draw ? 'is-draw' : iWon ? 'is-win' : 'is-loss'}`}>
        <div className="result-title">{draw ? 'DRAW' : iWon ? 'VICTORY' : 'DEFEAT'}</div>
        <div className="result-sub">{reason}</div>
        <button className="btn btn-gold" onClick={onExit}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}

function ResultModalSpec({ game, onExit }: { game: Game; onExit: () => void }) {
  const winner = game.result === 1 ? game.whiteName : game.result === 2 ? game.blackName : null;
  const reason = ['', 'king captured', 'resignation', 'abandonment', 'agreement'][game.resultReason] ?? '';
  return (
    <div className="modal-veil">
      <div className="result-card is-draw">
        <div className="result-title">{winner ? `${winner} WINS` : 'DRAW'}</div>
        <div className="result-sub">{reason}</div>
        <button className="btn btn-gold" onClick={onExit}>
          Back to lobby
        </button>
      </div>
    </div>
  );
}

function aimHint(target: string): string {
  switch (target) {
    case 'own':
      return 'pick one of your pieces';
    case 'own-cooling':
      return 'pick a cooling piece';
    case 'enemy':
      return 'pick an enemy piece';
    case 'own-two':
      return 'pick two ready pieces';
    case 'own-pawn':
      return 'pick one of your pawns';
    case 'any':
      return 'pick any piece';
    case 'empty-home':
      return 'pick an empty square on your first two ranks';
    default:
      return '';
  }
}

function cardError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('NOT_ENOUGH_GEMS')) return 'Not enough gems';
  if (msg.includes('Already shielded')) return 'Already shielded';
  if (msg.includes('already ready')) return 'That piece is already ready';
  if (msg.includes('LeavesKingAttacked')) return 'Your king would fall';
  if (msg.includes('no gems')) return 'Opponent has no gems';
  if (msg.includes('must be ready')) return 'Both pieces must be ready';
  if (msg.includes("haven't lost")) return "You haven't lost a piece yet";
  if (msg.includes('home ranks')) return 'Only on your two home ranks';
  if (msg.includes('pawns can be duplicated')) return 'Only pawns can be duplicated';
  if (msg.includes('Nothing is cooling')) return 'Nothing is cooling down';
  if (msg.includes('stasis')) return 'Locked in stasis';
  return 'Cannot play that card';
}

function rejectionText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('COOLDOWN')) return 'Still on cooldown';
  if (msg.includes('FROZEN_MATED')) return 'You are mated!';
  if (msg.includes('STASIS')) return 'Locked in stasis';
  if (msg.includes('stasis')) return 'Target is locked in stasis';
  if (msg.includes('LeavesKingAttacked')) return 'Your king would fall';
  if (msg.includes('TOO_FAST')) return 'Too fast!';
  if (msg.includes('not live')) return 'Game over';
  return 'Illegal move';
}
