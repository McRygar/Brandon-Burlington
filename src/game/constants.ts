// 16-bit Palette
export const PALETTE = {
  0: 'transparent',
  1: '#000000', // Black
  2: '#4a4a4a', // Dark Grey
  3: '#9e9e9e', // Light Grey
  4: '#ffffff', // White
  5: '#e53935', // Red
  6: '#43a047', // Green
  7: '#1e88e5', // Blue
  8: '#fdd835', // Yellow
  9: '#795548', // Brown
  10: '#ffcc80', // Skin
  11: '#8e24aa', // Purple
  12: '#f06292', // Pink
  13: '#00bcd4', // Cyan (Water)
};

// Sprites defined as arrays of palette indices
// 0 is transparent
export const SPRITES: Record<string, number[][]> = {
  BEER: [
    [0, 6, 6, 0],
    [0, 6, 6, 0],
    [0, 6, 6, 0],
    [6, 6, 6, 6],
    [6, 6, 6, 6],
    [6, 6, 6, 6],
    [6, 6, 6, 6],
  ],
  PIPE: [
    [0, 0, 0, 13],
    [0, 0, 1, 13],
    [0, 1, 0, 13],
    [1, 0, 0, 13],
    [1, 1, 1, 1],
    [1, 13, 13, 1],
    [1, 1, 1, 1],
  ],
  MAGAZINE: [
    [4, 4, 4, 4, 4],
    [4, 5, 5, 5, 4],
    [4, 5, 10, 5, 4],
    [4, 5, 5, 5, 4],
    [4, 4, 4, 4, 4],
  ],
  CAP: [
    [3, 3, 3],
    [3, 5, 3],
    [3, 3, 3],
  ],
  GUM: [
    [12, 12, 12],
    [12, 4, 12],
    [12, 12, 12],
  ],
  FUNNEL: [
    [5, 5, 5, 5, 5],
    [0, 5, 5, 5, 0],
    [0, 0, 5, 0, 0],
    [0, 0, 5, 0, 0],
    [0, 0, 5, 0, 0],
  ],
  BEADS: [
    [0, 11, 0, 11],
    [11, 0, 11, 0],
    [0, 11, 0, 11],
    [11, 0, 11, 0],
  ],
  LIGHTER: [
    [3, 3, 0],
    [5, 5, 0],
    [5, 5, 0],
    [5, 5, 0],
  ],
  CIGARETTE: [
    [4, 4, 4, 4, 10],
    [4, 4, 4, 4, 10],
  ],
  // Decor
  POSTER: [
    [4, 4, 4, 4, 4, 4, 4, 4],
    [4, 7, 7, 7, 7, 7, 7, 4],
    [4, 7, 8, 8, 8, 7, 7, 4],
    [4, 7, 8, 1, 8, 7, 7, 4],
    [4, 7, 8, 8, 8, 7, 7, 4],
    [4, 7, 7, 7, 7, 7, 7, 4],
    [4, 4, 4, 4, 4, 4, 4, 4],
  ],
  LAMP: [
    [0, 0, 8, 8, 0, 0],
    [0, 8, 8, 8, 8, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 0],
  ],
  RUG: [
    [11, 11, 11, 11, 11, 11, 11, 11],
    [11, 7, 7, 7, 7, 7, 7, 11],
    [11, 7, 11, 7, 7, 11, 7, 11],
    [11, 7, 7, 7, 7, 7, 7, 11],
    [11, 11, 11, 11, 11, 11, 11, 11],
  ],
};

export const LEVELS = [
  { id: 1, time: 60, items: 5 },
  { id: 2, time: 55, items: 8 },
  { id: 3, time: 50, items: 11 },
  { id: 4, time: 45, items: 14 },
  { id: 5, time: 40, items: 17 },
];

export const PARTY_ITEMS = [
  'BEER', 'PIPE', 'MAGAZINE', 'CAP', 'GUM', 'FUNNEL', 'BEADS', 'LIGHTER', 'CIGARETTE'
];

export const DECOR_ITEMS = [
  'POSTER', 'LAMP', 'RUG'
];

export const ITEM_NAMES: Record<string, string> = {
  BEER: 'Green Beer',
  PIPE: 'Water Pipe',
  MAGAZINE: 'Teen Magazine',
  CAP: 'Bottle Cap',
  GUM: 'Chewing Gum',
  FUNNEL: 'Party Funnel',
  BEADS: 'Mardi Gras Beads',
  LIGHTER: 'Cheap Lighter',
  CIGARETTE: 'Loose Cigarette',
  GREEN_JAR: 'Mysterious Jar',
  // Decor
  BED: 'Unmade Bed',
  COMPUTER: 'Desktop PC',
  CLOSET: 'Messy Closet',
  DOOR: 'Bedroom Door',
  POSTER: 'Band Poster',
  LAMP: 'Desk Lamp',
  RUG: 'Dirty Rug'
};

// Add Green Jar to Sprites (fallback)
SPRITES['GREEN_JAR'] = [
  [0, 6, 6, 0],
  [6, 6, 6, 6],
  [6, 8, 8, 6],
  [6, 6, 6, 6],
  [6, 6, 6, 6],
];
