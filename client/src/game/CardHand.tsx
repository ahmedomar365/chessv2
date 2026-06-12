import { useEffect, useState } from 'react';
import { CARDS, GEM_CAP, gemsNow, gemProgress } from './cardsMeta';

export function GemMeter({ base, anchorMs, serverNow }: { base: number; anchorMs: number; serverNow: () => number }) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  const now = serverNow();
  const gems = gemsNow(base, anchorMs, now);
  const progress = gemProgress(base, anchorMs, now);
  return (
    <div className="gem-meter" title={`${gems} time gems`}>
      {Array.from({ length: GEM_CAP }, (_, i) => (
        <span
          key={i}
          className={`gem ${i < gems ? 'gem-full' : ''} ${i === gems ? 'gem-next' : ''}`}
          style={i === gems ? ({ ['--p' as string]: progress } as React.CSSProperties) : undefined}
        />
      ))}
      <span className="gem-count">{gems}</span>
    </div>
  );
}

export function CardHand({
  hand,
  gems,
  armedIndex,
  onArm,
}: {
  hand: readonly number[];
  gems: number;
  armedIndex: number | null;
  onArm: (index: number | null) => void;
}) {
  return (
    <div className="card-hand">
      {hand.map((cardId, i) => {
        const meta = CARDS[cardId];
        if (!meta) return null;
        const passive = meta.target === 'passive';
        const affordable = meta.cost !== null && gems >= meta.cost;
        const armed = armedIndex === i;
        return (
          <button
            key={`${i}-${cardId}`}
            className={`card-tile ${armed ? 'card-armed' : ''} ${passive ? 'card-passive' : ''} ${
              !passive && !affordable ? 'card-poor' : ''
            }`}
            disabled={passive}
            onClick={() => onArm(armed ? null : i)}
          >
            <span className="card-icon">{meta.icon}</span>
            <span className="card-name">{meta.name}</span>
            {passive ? (
              <span className="card-cost card-cost-passive">auto</span>
            ) : (
              <span className="card-cost">{meta.cost}◆</span>
            )}
            <span className="card-blurb">{meta.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
