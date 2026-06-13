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
    whiteFill: '#f6efdd', whiteFill2: '#dccfb2', whiteStroke: '#181a22', whiteDetail: '#181a22',
    blackFill: '#1a1c26', blackFill2: '#0b0c12', blackStroke: '#a89e88', blackDetail: '#a89e88',
  },
  {
    id: 1, name: 'Safari',
    sqLight: '#d3a878', sqDark: '#9c6f43', accent: 'rgba(255,140,40,0.3)',
    whiteFill: '#f7ecd4', whiteFill2: '#e0c9a0', whiteStroke: '#5a3c1e', whiteDetail: '#5a3c1e',
    blackFill: '#54351c', blackFill2: '#33200f', blackStroke: '#e8c98e', blackDetail: '#e8c98e',
  },
  {
    id: 2, name: 'Cowboy',
    sqLight: '#c49a6c', sqDark: '#84563a', accent: 'rgba(216,138,56,0.32)',
    whiteFill: '#f2e3c8', whiteFill2: '#d4b88c', whiteStroke: '#4e2f18', whiteDetail: '#8a5524',
    blackFill: '#3d2414', blackFill2: '#241208', blackStroke: '#caa468', blackDetail: '#caa468',
  },
  {
    id: 3, name: 'Haunted Halloween',
    sqLight: '#2e2640', sqDark: '#1c1629', accent: 'rgba(255,140,26,0.35)',
    whiteFill: '#e9fbe2', whiteFill2: '#b7d9b0', whiteStroke: '#274b22', whiteDetail: '#3c7a33',
    blackFill: '#241330', blackFill2: '#120818', blackStroke: '#ff8c1a', blackDetail: '#ff8c1a',
  },
  {
    id: 4, name: 'Deep Ocean',
    sqLight: '#174254', sqDark: '#0c2a38', accent: 'rgba(64,224,208,0.3)',
    whiteFill: '#eef8f5', whiteFill2: '#bcd9d4', whiteStroke: '#16555c', whiteDetail: '#2a8c94',
    blackFill: '#0d2231', blackFill2: '#06121d', blackStroke: '#3fe0d0', blackDetail: '#3fe0d0',
  },
  {
    id: 5, name: 'Inferno',
    sqLight: '#432014', sqDark: '#260e08', accent: 'rgba(255,94,30,0.4)',
    whiteFill: '#ffd98a', whiteFill2: '#f0913a', whiteStroke: '#6b2207', whiteDetail: '#a33508',
    blackFill: '#27110b', blackFill2: '#120604', blackStroke: '#ff6a33', blackDetail: '#ff6a33',
  },
  {
    id: 6, name: 'Frostbite',
    sqLight: '#d4e8f4', sqDark: '#9cc0d6', accent: 'rgba(40,130,220,0.3)',
    whiteFill: '#ffffff', whiteFill2: '#dcecf5', whiteStroke: '#3d6e94', whiteDetail: '#5d92ba',
    blackFill: '#1f415e', blackFill2: '#102538', blackStroke: '#bfe2f5', blackDetail: '#bfe2f5',
  },
  {
    id: 7, name: 'Cyber Neon',
    sqLight: '#181828', sqDark: '#0d0d17', accent: 'rgba(61,255,240,0.35)',
    whiteFill: '#d8fcff', whiteFill2: '#8fe8f5', whiteStroke: '#0a7d8c', whiteDetail: '#0a7d8c',
    blackFill: '#1d0f24', blackFill2: '#0e0613', blackStroke: '#ff3df0', blackDetail: '#ff3df0',
  },
  {
    id: 8, name: 'Royal Gold',
    sqLight: '#3f3322', sqDark: '#251b0e', accent: 'rgba(255,206,84,0.35)',
    whiteFill: '#ffe9a8', whiteFill2: '#dca842', whiteStroke: '#5c3d0c', whiteDetail: '#8a5d14',
    blackFill: '#1c1812', blackFill2: '#0d0b07', blackStroke: '#e8c25c', blackDetail: '#e8c25c',
  },
  {
    id: 9, name: 'Elven Forest',
    sqLight: '#41603c', sqDark: '#27402a', accent: 'rgba(168,224,99,0.3)',
    whiteFill: '#f1eeda', whiteFill2: '#cfc8a4', whiteStroke: '#3c5224', whiteDetail: '#5d7a35',
    blackFill: '#1f2e1a', blackFill2: '#101a0d', blackStroke: '#b9d488', blackDetail: '#b9d488',
  },
  {
    id: 10, name: 'Galaxy',
    sqLight: '#221a44', sqDark: '#120d2b', accent: 'rgba(168,120,255,0.35)',
    whiteFill: '#f2edff', whiteFill2: '#c3b4ee', whiteStroke: '#4d3a8c', whiteDetail: '#6c54bd',
    blackFill: '#170e30', blackFill2: '#0a0618', blackStroke: '#c98ff5', blackDetail: '#ff7ac8',
  },
  {
    id: 11, name: 'Candyland',
    sqLight: '#f7cfdf', sqDark: '#e8a2bf', accent: 'rgba(255,82,156,0.3)',
    whiteFill: '#fff8ee', whiteFill2: '#fbe3c8', whiteStroke: '#c2447e', whiteDetail: '#e0639a',
    blackFill: '#56281a', blackFill2: '#38170d', blackStroke: '#7fe3c3', blackDetail: '#7fe3c3',
  },
  {
    id: 12, name: 'Samurai',
    sqLight: '#503030', sqDark: '#2f1b1b', accent: 'rgba(255,70,70,0.35)',
    whiteFill: '#f4ecdc', whiteFill2: '#d9cbb0', whiteStroke: '#8c1f1f', whiteDetail: '#b32424',
    blackFill: '#191014', blackFill2: '#0b0608', blackStroke: '#d8b96a', blackDetail: '#d8b96a',
  },
];

export function themeById(id: number | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
