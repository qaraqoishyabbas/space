export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasState extends CanvasSize {
  zoom: number;
  panOffset: CanvasPoint;
  centerPosition: CanvasPoint;
}

export type CanvasRenderCallback = (ctx: CanvasRenderingContext2D, state: CanvasState) => void;

export interface UseCanvasOptions extends Partial<CanvasSize> {
  minScale?: number;
  maxScale?: number;
  gridSize?: number;
  onRender?: CanvasRenderCallback;
}

export interface CanvasCardItem extends CanvasSize {
  id: number;
  x: number;
  y: number;
  title?: string;
  text?: string;
  image_url?: string;
  youtube_embed_url?: string;
}
