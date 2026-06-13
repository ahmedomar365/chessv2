import { PieceGlyph } from './pieces';
import { ArmyDefs, previewVars } from './BoardSvg';
import type { Theme } from './themes';

/** Themed board strip in the shop — the full unique piece set, both sides. */
export default function MiniPreview({ theme }: { theme: Theme }) {
  const prefix = `mini${theme.id}`;
  const order = [5, 4, 3, 2, 1, 0]; // K Q R B N P
  return (
    <svg className="mini-preview" viewBox="0 0 600 200" style={previewVars(theme, prefix)}>
      <ArmyDefs white={theme} black={theme} prefix={prefix} />
      {Array.from({ length: 12 }, (_, i) => {
        const x = (i % 6) * 100;
        const y = i < 6 ? 0 : 100;
        const dark = (i + Math.floor(i / 6)) % 2 === 0;
        return <rect key={i} x={x} y={y} width="100" height="100" className={dark ? 'sq-dark' : 'sq-light'} />;
      })}
      {order.map((ty, i) => (
        <g key={`b${ty}`} style={{ transform: `translate(${i * 100}px, 0px)` }}>
          <PieceGlyph ty={ty} color={1} themeId={theme.id} />
        </g>
      ))}
      {order.map((ty, i) => (
        <g key={`w${ty}`} style={{ transform: `translate(${i * 100}px, 100px)` }}>
          <PieceGlyph ty={ty} color={0} themeId={theme.id} />
        </g>
      ))}
    </svg>
  );
}
