import type { CanvasCardItem } from '~/types/canvas';

export const CANVAS_WORLD_SIZE = {
  width: 4000,
  height: 3000,
} as const;

export const CANVAS_STORAGE_KEYS = {
  cards: 'canvas:cards',
  isGridEnabled: 'canvas:isGridEnabled',
} as const;

export const CANVAS_ZOOM = {
  min: 0.5,
  max: 2,
  stepIn: 1.2,
  stepOut: 0.8,
} as const;

export const CANVAS_GRID_SIZE = 50;
export const VIEW_ANIMATION_DURATION_MS = 300;
export const RESET_ANIMATION_DURATION_MS = 600;

export const MIN_CARD_SIZE = {
  width: 80,
  height: 80,
} as const;

export const PASTED_TEXT_CARD_SIZE = {
  width: 320,
  height: 160,
} as const;

export const YOUTUBE_CARD_SIZE = {
  width: 480,
  height: 270,
} as const;

export const DEFAULT_CARDS: CanvasCardItem[] = [
  {
    id: 5,
    x: 1560.039779663086,
    y: 1390.8095092773438,
    width: 215,
    height: 226,
    image_url: 'https://i.giphy.com/3og0IGjLXRttYbbtcc.webp',
  },
  {
    id: 4,
    x: 1735.0266571044922,
    y: 1210.0885848999023,
    width: 310,
    height: 432,
    image_url: 'https://upload.wikimedia.org/wikipedia/en/c/c7/Chill_guy_original_artwork.jpg',
  },
  {
    id: 1,
    x: 1645.2837448120117,
    y: 1566.1097259521484,
    width: 313,
    height: 160,
    title: 'Анекдот про шайбу',
    text: 'Почему шайбы в хоккее чёрного цвета?\n\nПотому что если бы были белыми, по ним бы никто не бил',
  },
  {
    id: 2,
    x: 1995.0980072021484,
    y: 1383.3955841064453,
    width: 309,
    height: 160,
    text: 'Гуляют две зубочистки по лесу. Вдруг мимо пробегает ежик. Одна зубочистка говорит другой:\n- Слушай, а ты знала, что здесь ходит автобус?',
  },
  {
    id: 7,
    x: 2270.039779663086,
    y: 1452.8095092773438,
    width: 304,
    height: 321,
    image_url:
      'https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExb2JpcTk2MDhuMDdyejVucjNkNzdveDVtZGV2ZnQ5N2NtZTgzM3Y1YyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/SHzl9Rp6UjlJm9GbSg/giphy.gif',
  },
  {
    id: 3,
    x: 2117.1995403699143,
    y: 1529.4926129896737,
    width: 489,
    height: 140,
    title: '© Luke Rockhold',
    text: 'Мир не такой уж солнечный и приветливый. Важно, какой держишь удар, и как двигаешься вперёд.',
  },
  {
    id: 8,
    x: 2037.4156494140625,
    y: 1248.5502853393555,
    width: 122,
    height: 144,
    image_url: 'https://i.redd.it/58radj9pxfc81.gif',
  },
];
