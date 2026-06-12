import { useReducer } from 'spacetimedb/react';
import { reducers } from '../module_bindings';
import type { Game, Session } from '../module_bindings/types';

/** Placeholder shell — the real board lands in the next task. */
export default function GameScreen({ game, me }: { game: Game; me: Session }) {
  const resign = useReducer(reducers.resign);
  const myColor = game.whiteId === me.accountId ? 'White' : 'Black';

  return (
    <div className="game-stage">
      <header className="game-head">
        <div className="wordmark sm">
          CHESS<em>V2</em>
        </div>
        <span className="game-vs">
          {game.whiteName} <em>vs</em> {game.blackName}
        </span>
      </header>
      <div className="center-stage">
        <p>
          Game #{game.gameId.toString()} — you are {myColor}. Board incoming.
        </p>
        <button className="btn btn-ghost" onClick={() => resign({ gameId: game.gameId })}>
          Resign
        </button>
      </div>
    </div>
  );
}
