import { DbConnection } from './module_bindings';

const URI = (import.meta.env.VITE_STDB_URI as string | undefined) ?? 'wss://maincloud.spacetimedb.com';
const DB = (import.meta.env.VITE_STDB_DB as string | undefined) ?? 'chessv2';
const TOKEN_KEY = 'chessv2_token';

/** Builder used by SpacetimeDBProvider; persists the auth token across visits. */
export function connectionBuilder() {
  return DbConnection.builder()
    .withUri(URI)
    .withDatabaseName(DB)
    .withToken(localStorage.getItem(TOKEN_KEY) ?? undefined)
    .onConnect((_conn, _identity, token) => {
      localStorage.setItem(TOKEN_KEY, token);
    });
}
