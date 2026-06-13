/**
 * Visual themes (skins). Ids MUST match the server skin_catalog seed order.
 * Every theme keeps the same readable glyph geometry — themes change the
 * board palette and piece materials, never the silhouettes.
 */

export interface Theme {
  id: number;
  name: string;
  sqLight: string;
  sqDark: string;
  /** last-move + selection tint */
  accent: string;
  whiteFill: string;
  whiteFill2: string;
  whiteStroke: string;
  whiteDetail: string;
  blackFill: string;
  blackFill2: string;
  blackStroke: string;
  blackDetail: string;
}

export const THEMES: Theme[] = [
  {
    id: 0, name: 'Classic',
    sqLight: '#3a3f52', sqDark: '#262a3a', accent: 'rgba(232,163,61,0.25)',
    whiteFill: '#f6efdd', whiteFill2: '#d8c9a8', whiteStroke: '#181a22', whiteDetail: '#181a22',
    blackFill: '#23252f', blackFill2: '#101117', blackStroke: '#b0a690', blackDetail: '#b0a690',
  },
  {
    id: 1, name: 'Safari',
    sqLight: '#d3a878', sqDark: '#9c6f43', accent: 'rgba(255,140,40,0.3)',
    whiteFill: '#f9efd8', whiteFill2: '#e2cb9e', whiteStroke: '#5a3c1e', whiteDetail: '#5a3c1e',
    blackFill: '#5e3b1e', blackFill2: '#37200d', blackStroke: '#f0d49a', blackDetail: '#f0d49a',
  },
  {
    id: 2, name: 'Cowboy',
    sqLight: '#c49a6c', sqDark: '#84563a', accent: 'rgba(216,138,56,0.32)',
    whiteFill: '#f2e3c8', whiteFill2: '#d2b486', whiteStroke: '#4e2f18', whiteDetail: '#8a5524',
    blackFill: '#46281a', blackFill2: '#28130a', blackStroke: '#d8b074', blackDetail: '#d8b074',
  },
  {
    // ghosts vs pumpkins
    id: 3, name: 'Haunted Halloween',
    sqLight: '#352b4d', sqDark: '#211a33', accent: 'rgba(255,140,26,0.4)',
    whiteFill: '#eafce4', whiteFill2: '#a9d6a0', whiteStroke: '#2c5426', whiteDetail: '#3c7a33',
    blackFill: '#ef8224', blackFill2: '#a04c0c', blackStroke: '#33180a', blackDetail: '#33180a',
  },
  {
    // pearls vs the deep
    id: 4, name: 'Deep Ocean',
    sqLight: '#1b5063', sqDark: '#0e3344', accent: 'rgba(64,224,208,0.35)',
    whiteFill: '#f4fcf9', whiteFill2: '#c4e4dc', whiteStroke: '#1d6e75', whiteDetail: '#2a8c94',
    blackFill: '#2a78b0', blackFill2: '#143e62', blackStroke: '#8df0ff', blackDetail: '#8df0ff',
  },
  {
    // molten gold vs charred ember
    id: 5, name: 'Inferno',
    sqLight: '#4a2012', sqDark: '#2a0f08', accent: 'rgba(255,94,30,0.45)',
    whiteFill: '#ffdd8e', whiteFill2: '#ef8f38', whiteStroke: '#6b2207', whiteDetail: '#a33508',
    blackFill: '#7a2c12', blackFill2: '#3e1208', blackStroke: '#ff8348', blackDetail: '#ff8348',
  },
  {
    // snow vs glacier
    id: 6, name: 'Frostbite',
    sqLight: '#d8e9f4', sqDark: '#a2c2d8', accent: 'rgba(40,130,220,0.3)',
    whiteFill: '#ffffff', whiteFill2: '#dcecf5', whiteStroke: '#3d6e94', whiteDetail: '#5d92ba',
    blackFill: '#3f74a6', blackFill2: '#1f4468', blackStroke: '#dceefc', blackDetail: '#dceefc',
  },
  {
    // hologram cyan vs neon magenta
    id: 7, name: 'Cyber Neon',
    sqLight: '#191930', sqDark: '#0d0d1a', accent: 'rgba(61,255,240,0.4)',
    whiteFill: '#9af5ff', whiteFill2: '#3fb8cc', whiteStroke: '#06303a', whiteDetail: '#06303a',
    blackFill: '#d445ea', blackFill2: '#711884', blackStroke: '#ffc2f8', blackDetail: '#380a42',
  },
  {
    // polished gold vs onyx
    id: 8, name: 'Royal Gold',
    sqLight: '#46371e', sqDark: '#2a1f0f', accent: 'rgba(255,206,84,0.4)',
    whiteFill: '#ffeaa9', whiteFill2: '#d8a23c', whiteStroke: '#5c3d0c', whiteDetail: '#8a5d14',
    blackFill: '#3a3542', blackFill2: '#1b1820', blackStroke: '#f0cf7a', blackDetail: '#f0cf7a',
  },
  {
    // birch vs deep moss
    id: 9, name: 'Elven Forest',
    sqLight: '#4c6c46', sqDark: '#2d462f', accent: 'rgba(168,224,99,0.35)',
    whiteFill: '#f3f0dc', whiteFill2: '#c8c098', whiteStroke: '#3c5224', whiteDetail: '#5d7a35',
    blackFill: '#3f7034', blackFill2: '#1e3d19', blackStroke: '#cdf0a2', blackDetail: '#cdf0a2',
  },
  {
    // starlight vs nebula
    id: 10, name: 'Galaxy',
    sqLight: '#282052', sqDark: '#161136', accent: 'rgba(168,120,255,0.4)',
    whiteFill: '#f4efff', whiteFill2: '#beA8f0', whiteStroke: '#503a96', whiteDetail: '#6c54bd',
    blackFill: '#8347dc', blackFill2: '#41207e', blackStroke: '#eec2ff', blackDetail: '#2a1054',
  },
  {
    // vanilla cream vs chocolate-mint
    id: 11, name: 'Candyland',
    sqLight: '#f9d6e4', sqDark: '#eba9c4', accent: 'rgba(255,82,156,0.35)',
    whiteFill: '#fff9f0', whiteFill2: '#fbe0c0', whiteStroke: '#c2447e', whiteDetail: '#e0639a',
    blackFill: '#744022', blackFill2: '#3e1c0c', blackStroke: '#7fe3c3', blackDetail: '#7fe3c3',
  },
  {
    // ivory vs crimson lacquer
    id: 12, name: 'Samurai',
    sqLight: '#543434', sqDark: '#331d1d', accent: 'rgba(255,70,70,0.4)',
    whiteFill: '#f6eedd', whiteFill2: '#d4c4a4', whiteStroke: '#8c1f1f', whiteDetail: '#b32424',
    blackFill: '#8a2228', blackFill2: '#46100f', blackStroke: '#efc868', blackDetail: '#efc868',
  },
];

export function themeById(id: number | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
