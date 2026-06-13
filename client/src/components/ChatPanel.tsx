import { useEffect, useRef, useState } from 'react';
import { useReducer, useTable } from 'spacetimedb/react';
import { reducers, tables } from '../module_bindings';

/**
 * Live chat over a channel: 0 = global lobby, 1 = game players, 2 = game spectators.
 */
export default function ChatPanel({
  channel,
  gameId,
  myAccountId,
  compact,
}: {
  channel: number;
  gameId: bigint;
  myAccountId: bigint;
  compact?: boolean;
}) {
  const sendChat = useReducer(reducers.sendChat);
  // Single stable subscription; the table is history-capped so it stays small.
  const [messages] = useTable(tables.chat_message);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const visible = messages
    .filter((m) => m.channel === channel && (channel === 0 || m.gameId === gameId))
    .sort((a, b) => Number(a.msgId - b.msgId))
    .slice(-100);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    sendChat({ channel, gameId, text }).catch((e) => {
      const msg = String(e instanceof Error ? e.message : e);
      setError(
        msg.includes('NEED_GAME')
          ? 'Play a game first to chat in the lobby'
          : msg.includes('fast')
            ? 'Slow down…'
            : 'Message not sent',
      );
      setTimeout(() => setError(null), 2400);
    });
  };

  return (
    <div className={`chat-panel ${compact ? 'chat-compact' : ''}`}>
      <div className="chat-list" ref={listRef}>
        {visible.length === 0 && <div className="chat-empty">No messages yet — say hi!</div>}
        {visible.map((m) => (
          <div key={m.msgId.toString()} className={`chat-msg ${m.accountId === myAccountId ? 'chat-mine' : ''}`}>
            <span className="chat-user">{m.username}</span>
            <span className="chat-text">{m.text}</span>
          </div>
        ))}
      </div>
      {error && <div className="chat-error">{error}</div>}
      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          placeholder={channel === 0 ? 'Message the arena…' : channel === 2 ? 'Spectator chat…' : 'Message your opponent…'}
        />
        <button type="submit" className="btn btn-gold btn-sm" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
