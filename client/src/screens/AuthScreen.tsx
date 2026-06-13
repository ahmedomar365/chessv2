import { useState } from 'react';
import { useReducer } from 'spacetimedb/react';
import { reducers } from '../module_bindings';

export default function AuthScreen() {
  const enter = useReducer(reducers.enter);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await enter({ username: username.trim(), password });
      // success → session row updates and App re-routes
    } catch (e) {
      setError(humanize(e));
    } finally {
      setBusy(false);
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
            submit();
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

          <button type="submit" className="btn btn-gold btn-enter" disabled={busy || !username || password.length < 6}>
            {busy ? 'Entering the arena…' : 'ENTER'}
          </button>
        </form>

        <p className="auth-note">New name? Your account is created on the spot.</p>
        <div className="warn-box">
          ⚠ There is <strong>no password recovery</strong>. Save your password somewhere safe — a lost
          password means a lost account.
        </div>
      </div>
    </div>
  );
}

function humanize(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes('Wrong password')) return 'That name is taken and the password does not match';
  const m = msg.match(/(?:Error: )?([^:]*(?:Username|Password|Account|Too many)[^.]*)/);
  return m ? m[1].trim() : 'Could not sign in — try again';
}
