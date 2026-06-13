import { PieceGlyph } from './pieces';
import { ThemeDefs, themeVars } from './BoardSvg';
import type { Theme } from './themes';

/** Small themed board strip used in the shop — "see the pieces in action". */
export default function MiniPreview({ theme }: { theme: Theme }) {
  const prefix = `mini${theme.id}`;
  const order = [5, 4, 1, 0]; // king queen knight pawn
  return (
    <svg className="mini-preview" viewBox="0 0 400 200" style={themeVars(theme, prefix)}>
      <ThemeDefs theme={theme} prefix={prefix} />
      {Array.from({ length: 8 }, (_, i) => {
        const x = (i % 4) * 100;
        const y = i < 4 ? 0 : 100;
        const dark = (i + Math.floor(i / 4)) % 2 === 0;
        return <rect key={i} x={x} y={y} width="100" height="100" className={dark ? 'sq-dark' : 'sq-light'} />;
      })}
      {order.map((ty, i) => (
        <g key={`b${ty}`} style={{ transform: `translate(${i * 100}px, 0px)` }}>
          <PieceGlyph ty={ty} color={1} />
        </g>
      ))}
      {order.map((ty, i) => (
        <g key={`w${ty}`} style={{ transform: `translate(${i * 100}px, 100px)` }}>
          <PieceGlyph ty={ty} color={0} />
        </g>
      ))}
    </svg>
  );
}
