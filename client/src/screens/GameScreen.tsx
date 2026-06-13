import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';
import type { EffectLog, Game, Session } from '../module_bindings/types';
import BoardSvg, { type Flash } from '../game/BoardSvg';
import { CardHand, GemMeter } from '../game/CardHand';
import { CARDS, gemsNow } from '../game/cardsMeta';
import { legalTargets, type LPiece } from '../game/legal';
import { themeById } from '../game/themes';
import ChatPanel from '../components/ChatPanel';

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
  const [allSpectators] = useTable(tables.spectator);
  const specCount = allSpectators.filter((s) => s.gameId === game.gameId).length;
  const [chatOpen, setChatOpen] = useState(false);

  const [pieces] = useTable(tables.piece.where((r) => r.gameId.eq(game.gameId)));
  const [moves] = useTable(tables.move_log.where((r) => r.gameId.eq(game.gameId)));
  const [gemRows] = useTable(tables.game_gems.where((r) => r.gameId.eq(game.gameId)));
  const [cardRows] = useTable(tables.my_card_state);
  const [myProfiles] = useTable(tables.player_profile.where((r) => r.accountId.eq(me.accountId)));
  const theme = themeById(myProfiles[0]?.equippedSkin);

  const amWhite = spectating ? true : game.whiteId === me.accountId;
  const myColor = amWhite ? 0 : 1;

  // ---- server clock offset (refined from each move's server timestamp) ----
  const offsetRef = useRef(0);
  useEffect(() => {
    if (moves.length === 0) return;
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    offsetRef.current = Number(latest.ts.toMillis()) - Date.now();
  }, [moves.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const serverNow = useCallback(() => Date.now() + offsetRef.current, []);

  // ---- cards & gems ----
  const myCardState = useMemo(
    () => cardRows.find((c) => c.gameId === game.gameId && c.accountId === me.accountId),
    [cardRows, game.gameId, me.accountId],
  );
  const hand = useMemo(() => (myCardState ? Array.from(myCardState.hand) : []), [myCardState]);
  const myGems = gemRows.find((g) => g.accountId === me.accountId);
  const oppGems = gemRows.find((g) => g.accountId !== me.accountId);

  const [armed, setArmed] = useState<number | null>(null);
  const [swapFirst, setSwapFirst] = useState<number | null>(null);

  // ---- selection & toasts & flashes ----
  const [selected, setSelected] = useState<number | null>(null);
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

  // ---- effect log → animations/toasts (only NEW effects, not history) ----
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
          if (!mine) say(`Opponent played ${CARDS[e.card]?.name ?? 'a card'}`);
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
    const latest = moves.reduce((a, b) => (a.seq > b.seq ? a : b));
    return { from: latest.fromSq, to: latest.toSq };
  }, [moves]);

  const onSquare = (sq: number) => {
    if (spectating || game.phase !== 1) return;

    // armed card targeting takes priority over movement
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

  const oppGemCount = oppGems ? gemsNow(oppGems.base, Number(oppGems.anchor.toMillis()), serverNow()) : 0;

  return (
    <div className="game-stage">
      <header className="game-bar">
        <span className="bar-name">
          {spectating ? (
            <>
              {game.whiteName} <em className="vs-dim">vs</em> {game.blackName}
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

      <div className="board-wrap">
        <BoardSvg
          pieces={pieces}
          flipped={!amWhite}
          selected={selected}
          targets={targets}
          cardTargets={cardTargets}
          flashes={flashes}
          lastMove={lastMove}
          checkSq={checkSq}
          shakeSq={shakeSq}
          serverNow={serverNow}
          onSquare={onSquare}
          frozen={myMated}
          theme={theme}
        />

        {countLeft !== null && (
          <div className="board-overlay">
            <span key={countLeft} className="countdown-num">
              {countLeft}
            </span>
          </div>
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
        <footer className="game-foot">
          <div className="foot-row">
            <span className="bar-name">spectating</span>
            <span className="spec-gem-row">
              <span className="spec-gem">⬜ ◆ {gemsFor(gemRows, game.whiteId, serverNow)}</span>
              <span className="spec-gem">⬛ ◆ {gemsFor(gemRows, game.blackId, serverNow)}</span>
            </span>
          </div>
        </footer>
      ) : (
        <footer className="game-foot">
          <div className="foot-row">
            <span className="bar-name">
              {me.username}
              <span className="badge badge-dim">{amWhite ? 'white' : 'black'}</span>
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
    default:
      return '';
  }
}

function cardError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('NOT_ENOUGH_GEMS')) return 'Not enough gems';
  if (msg.includes('already shielded') || msg.includes('Already shielded')) return 'Already shielded';
  if (msg.includes('already ready')) return 'That piece is already ready';
  if (msg.includes('LeavesKingAttacked')) return 'Your king would fall';
  if (msg.includes('no gems')) return 'Opponent has no gems';
  if (msg.includes('must be ready')) return 'Both pieces must be ready';
  return 'Cannot play that card';
}

function rejectionText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('COOLDOWN')) return 'Still on cooldown';
  if (msg.includes('FROZEN_MATED')) return 'You are mated!';
  if (msg.includes('LeavesKingAttacked')) return 'Your king would fall';
  if (msg.includes('not live')) return 'Game over';
  return 'Illegal move';
}
