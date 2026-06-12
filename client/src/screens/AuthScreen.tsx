import { useState } from 'react';
import { useReducer } from 'spacetimedb/react';
import { reducers } from '../module_bindings';

export default function AuthScreen() {
  const login = useReducer(reducers.login);
  const register = useReducer(reducers.register);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'login' | 'register' | null>(null);

  const submit = async (kind: 'login' | 'register') => {
    if (busy) return;
    setError(null);
    setBusy(kind);
    try {
      if (kind === 'login') await login({ username: username.trim(), password });
      else await register({ username: username.trim(), password });
      // success → session row updates and App re-routes
    } catch (e) {
      setError(humanize(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="auth-stage">
      <div className="auth-card">
        <div className="wordmark">
          CHESS<em>V2</em>
        </div>
        <p className="tagline">real-time chess · no turns · every piece on its own clock</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit('login');
          }}
        >
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={16}
              placeholder="3–16 letters, numbers, _"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="min 6 characters"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="auth-actions">
            <button type="submit" className="btn btn-gold" disabled={busy !== null || !username || !password}>
              {busy === 'login' ? 'Entering…' : 'Log in'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={busy !== null || !username || !password}
              onClick={() => submit('register')}
            >
              {busy === 'register' ? 'Forging…' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="warn-box">
          ⚠ There is <strong>no password recovery</strong>. Save your password somewhere safe — a lost
          password means a lost account.
        </div>
        <p className="auth-note">Logging in never creates an account — use “Create account” the first time.</p>
      </div>
    </div>
  );
}

function humanize(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  // Reducer errors arrive wrapped; surface the meaningful part.
  const m = msg.match(/(?:Error: )?([^:]*(?:Username|Password|Account|Wrong|Too many)[^.]*)/);
  return m ? m[1].trim() : msg;
}
