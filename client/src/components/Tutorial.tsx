import { useState } from 'react';

const STEPS: { title: string; body: string; art: string }[] = [
  {
    title: 'Welcome to ChessV2',
    body: 'This is chess with NO TURNS. Both players move at the same time, in real time. Speed, timing, and nerve matter as much as strategy.',
    art: '⚡♟️⚡',
  },
  {
    title: 'Cooldowns',
    body: 'After a piece moves it cools down — a golden ring drains around it. Pawns recover in 3s, knights & bishops 5s, rooks & kings 7s, the queen 10s. Any piece that is ready can move. Use your whole army!',
    art: '⏳',
  },
  {
    title: 'Check & Mate',
    body: "If your king is attacked you may only make moves that escape check. If NO escape exists you are MATED — completely frozen. But the game only ends when the king is actually CAPTURED… so a rescue is still possible.",
    art: '👑⛓️',
  },
  {
    title: 'Time Gems & Cards',
    body: 'You earn a gem every 5 seconds (max 10). Spend gems to play cards from your hand of 3: shield a piece with Barrier, Reset a cooldown, Freeze an enemy, even Rewind the whole board 20 seconds. The Guardian card saves your king automatically.',
    art: '◆🃏',
  },
  {
    title: 'Repelled!',
    body: 'When an enemy tries to capture a shielded piece, they bounce back and suffer a full cooldown. Cards can be played even while you are mated — they are your comeback.',
    art: '🛡️💥',
  },
  {
    title: 'Climb the ladder',
    body: 'Quick match is rated (ELO). Win games to earn Coins, build card loadouts, and unlock themes in the shop. Warm up against the TimeKeeper bot anytime. Good luck — the clock is always running.',
    art: '🏆',
  },
];

export default function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="result-card tutorial-card" onClick={(e) => e.stopPropagation()}>
        <div className="tutorial-art">{s.art}</div>
        <div className="result-title tutorial-title">{s.title}</div>
        <p className="tutorial-body">{s.body}</p>
        <div className="tutorial-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`tut-dot ${i === step ? 'tut-dot-on' : ''}`} />
          ))}
        </div>
        <div className="auth-actions">
          {step > 0 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <button className="btn btn-ghost" onClick={onClose}>
              Skip
            </button>
          )}
          <button className="btn btn-gold" onClick={() => (last ? onClose() : setStep(step + 1))}>
            {last ? "Let's play!" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
