import { SpacetimeDBProvider, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { useEffect, useMemo, useState } from 'react';
import { tables } from './module_bindings';
import { connectionBuilder } from './stdb';
import AuthScreen from './screens/AuthScreen';
import Lobby from './screens/Lobby';
import GameScreen from './screens/GameScreen';

const builder = connectionBuilder();

export default function App() {
  return (
    <SpacetimeDBProvider connectionBuilder={builder}>
      <Shell />
    </SpacetimeDBProvider>
  );
}

function Shell() {
  const { isActive, identity, connectionError } = useSpacetimeDB();
  const [sessions, sessionsReady] = useTable(tables.session);
  const [games] = useTable(tables.game);

  const me = useMemo(
    () => (identity ? sessions.find((s) => s.identity.toHexString() === identity.toHexString()) : undefined),
    [sessions, identity],
  );

  const myLiveGame = useMemo(() => {
    if (!me || me.accountId === 0n) return undefined;
    return games.find((g) => g.phase < 2 && (g.whiteId === me.accountId || g.blackId === me.accountId));
  }, [games, me]);

  // Sticky game routing: stay on the game screen after it finishes so the
  // result modal can be shown; "Back to lobby" clears it.
  const [stickyGameId, setStickyGameId] = useState<bigint | null>(null);
  useEffect(() => {
    if (myLiveGame) setStickyGameId(myLiveGame.gameId);
  }, [myLiveGame]);

  const currentGame = useMemo(() => {
    if (!me || me.accountId === 0n) return undefined;
    if (myLiveGame) return myLiveGame;
    if (stickyGameId !== null) {
      return games.find(
        (g) => g.gameId === stickyGameId && (g.whiteId === me.accountId || g.blackId === me.accountId),
      );
    }
    return undefined;
  }, [me, myLiveGame, stickyGameId, games]);

  if (connectionError) {
    return (
      <div className="center-stage">
        <div className="conn-banner">Connection lost — retrying… check your network</div>
      </div>
    );
  }
  if (!isActive || !sessionsReady) {
    return (
      <div className="center-stage">
        <div className="loading-mark">
          <span className="loading-gem" />
          CHESS<em>V2</em>
        </div>
      </div>
    );
  }
  if (!me || me.accountId === 0n) return <AuthScreen />;
  if (currentGame) {
    return (
      <GameScreen
        key={currentGame.gameId.toString()}
        game={currentGame}
        me={me}
        onExit={() => setStickyGameId(null)}
      />
    );
  }
  return <Lobby me={me} sessions={sessions} games={games} />;
}
