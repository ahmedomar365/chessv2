import { SpacetimeDBProvider, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { useEffect, useMemo, useState } from 'react';
import { tables } from './module_bindings';
import { connectionBuilder } from './stdb';
import AuthScreen from './screens/AuthScreen';
import Lobby from './screens/Lobby';
import GameScreen from './screens/GameScreen';
import ProfileScreen from './screens/ProfileScreen';
import ReplayScreen from './screens/ReplayScreen';
import ShopScreen from './screens/ShopScreen';
import CollectionScreen from './screens/CollectionScreen';

const builder = connectionBuilder();

type Route =
  | { kind: 'lobby' }
  | { kind: 'profile'; accountId: bigint }
  | { kind: 'replay'; gameId: bigint; fromProfile?: bigint }
  | { kind: 'shop' }
  | { kind: 'collection' };

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
  const [spectators] = useTable(tables.spectator);

  const me = useMemo(
    () => (identity ? sessions.find((s) => s.identity.toHexString() === identity.toHexString()) : undefined),
    [sessions, identity],
  );

  const myLiveGame = useMemo(() => {
    if (!me || me.accountId === 0n) return undefined;
    return games.find((g) => g.phase < 2 && (g.whiteId === me.accountId || g.blackId === me.accountId));
  }, [games, me]);

  const [route, setRoute] = useState<Route>({ kind: 'lobby' });

  // Apply pending app updates only when it's safe (never mid-game).
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    const onReady = () => setUpdateReady(true);
    window.addEventListener('chessv2:update-ready', onReady);
    return () => window.removeEventListener('chessv2:update-ready', onReady);
  }, []);

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

  useEffect(() => {
    if (updateReady && !currentGame) {
      window.location.reload();
    }
  }, [updateReady, currentGame]);

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

  const mySpec = spectators.find((s) => s.accountId === me.accountId);
  const specGame = mySpec ? games.find((g) => g.gameId === mySpec.gameId) : undefined;
  if (specGame) {
    return <GameScreen key={`spec${specGame.gameId}`} game={specGame} me={me} onExit={() => {}} spectating />;
  }
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
  if (route.kind === 'replay') {
    return (
      <ReplayScreen
        key={route.gameId.toString()}
        gameId={route.gameId}
        onBack={() =>
          setRoute(route.fromProfile !== undefined ? { kind: 'profile', accountId: route.fromProfile } : { kind: 'lobby' })
        }
      />
    );
  }
  if (route.kind === 'profile') {
    return (
      <ProfileScreen
        key={route.accountId.toString()}
        accountId={route.accountId}
        onBack={() => setRoute({ kind: 'lobby' })}
        onReplay={(gameId) => setRoute({ kind: 'replay', gameId, fromProfile: route.accountId })}
      />
    );
  }
  if (route.kind === 'shop') {
    return <ShopScreen me={me} onBack={() => setRoute({ kind: 'lobby' })} />;
  }
  if (route.kind === 'collection') {
    return <CollectionScreen onBack={() => setRoute({ kind: 'lobby' })} />;
  }
  return (
    <Lobby
      me={me}
      sessions={sessions}
      games={games}
      onOpenProfile={(accountId) => setRoute({ kind: 'profile', accountId })}
      onOpenShop={() => setRoute({ kind: 'shop' })}
      onOpenCollection={() => setRoute({ kind: 'collection' })}
    />
  );
}
