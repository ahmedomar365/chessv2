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
  {
    // brass automatons vs oxidized iron
    id: 13, name: 'Steampunk',
    sqLight: '#6b5a44', sqDark: '#463a2a', accent: 'rgba(232,178,84,0.4)',
    whiteFill: '#ecc87e', whiteFill2: '#b08038', whiteStroke: '#3a2a12', whiteDetail: '#6e4a18',
    blackFill: '#565c64', blackFill2: '#272b30', blackStroke: '#e0b66a', blackDetail: '#e0b66a',
  },
  {
    // weathered bone vs dark rum & gold
    id: 14, name: 'Pirate',
    sqLight: '#c9b289', sqDark: '#8a7354', accent: 'rgba(232,160,60,0.35)',
    whiteFill: '#f1e8ce', whiteFill2: '#cdbb90', whiteStroke: '#4a3a22', whiteDetail: '#6e5630',
    blackFill: '#553823', blackFill2: '#2e1d10', blackStroke: '#ecd49a', blackDetail: '#ecd49a',
  },
  {
    // sun gold vs lapis lazuli
    id: 15, name: 'Pharaoh',
    sqLight: '#c7a86a', sqDark: '#94753c', accent: 'rgba(255,210,90,0.4)',
    whiteFill: '#f7da74', whiteFill2: '#c8982e', whiteStroke: '#5c4310', whiteDetail: '#8a6512',
    blackFill: '#2a5cb0', blackFill2: '#142f62', blackStroke: '#f0cf6a', blackDetail: '#f0cf6a',
  },
  {
    // dragonbone vs emerald scale
    id: 16, name: 'Emerald Dragon',
    sqLight: '#3e4c40', sqDark: '#252f27', accent: 'rgba(120,232,150,0.35)',
    whiteFill: '#eee6d4', whiteFill2: '#c4b698', whiteStroke: '#3c3422', whiteDetail: '#6a5c3a',
    blackFill: '#33824f', blackFill2: '#164026', blackStroke: '#bcf2cc', blackDetail: '#bcf2cc',
  },
  {
    // VARIANT of Royal Gold sculpts — silver vs obsidian
    id: 17, name: 'Royal Obsidian',
    sqLight: '#30303a', sqDark: '#1c1c24', accent: 'rgba(200,205,228,0.3)',
    whiteFill: '#eceef4', whiteFill2: '#a9adbc', whiteStroke: '#2c2e38', whiteDetail: '#5c6072',
    blackFill: '#28242f', blackFill2: '#110e17', blackStroke: '#cbcee2', blackDetail: '#cbcee2',
  },
  {
    // VARIANT of Samurai sculpts — blossom & plum
    id: 18, name: 'Sakura',
    sqLight: '#e8c9d4', sqDark: '#c294a6', accent: 'rgba(255,120,160,0.35)',
    whiteFill: '#fff6f3', whiteFill2: '#f6d1d8', whiteStroke: '#b84a66', whiteDetail: '#d4708c',
    blackFill: '#74304a', blackFill2: '#3e1628', blackStroke: '#f6ccd6', blackDetail: '#f6ccd6',
  },
  {
    // VARIANT of Deep Ocean sculpts — the lightless deep
    id: 19, name: 'Abyss',
    sqLight: '#14262f', sqDark: '#0a141c', accent: 'rgba(70,232,200,0.4)',
    whiteFill: '#dcf8ea', whiteFill2: '#93dcc4', whiteStroke: '#0e4a3a', whiteDetail: '#1d7a5e',
    blackFill: '#20405a', blackFill2: '#0d1e30', blackStroke: '#4ae9ca', blackDetail: '#4ae9ca',
  },
  {
    // VARIANT of Halloween sculpts — crimson night
    id: 20, name: 'Blood Moon',
    sqLight: '#3c1a22', sqDark: '#240d13', accent: 'rgba(255,90,90,0.4)',
    whiteFill: '#f4eae6', whiteFill2: '#cfbab6', whiteStroke: '#5c1c1c', whiteDetail: '#8a2c2c',
    blackFill: '#90202e', blackFill2: '#460b16', blackStroke: '#ff8276', blackDetail: '#ff8276',
  },
];

export function themeById(id: number | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
