import type { CanvasPoint, CanvasSize } from '~/types/canvas';

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getViewportSize = (): CanvasSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export const getCanvasCenter = (viewport: CanvasSize, panOffset: CanvasPoint, zoom: number): CanvasPoint => ({
  x: Math.floor((viewport.width / 2 - panOffset.x) / zoom),
  y: Math.floor((viewport.height / 2 - panOffset.y) / zoom),
});

export const getCenteredOffset = (world: CanvasSize, viewport: CanvasSize, zoom = 1): CanvasPoint => ({
  x: viewport.width / 2 - (world.width * zoom) / 2,
  y: viewport.height / 2 - (world.height * zoom) / 2,
});

export const getClampedPanOffset = (panOffset: CanvasPoint, world: CanvasSize, viewport: CanvasSize, zoom: number): CanvasPoint => {
  const scaledWidth = world.width * zoom;
  const scaledHeight = world.height * zoom;

  return {
    x: scaledWidth <= viewport.width ? (viewport.width - scaledWidth) / 2 : clamp(panOffset.x, viewport.width - scaledWidth, 0),
    y: scaledHeight <= viewport.height ? (viewport.height - scaledHeight) / 2 : clamp(panOffset.y, viewport.height - scaledHeight, 0),
  };
};

export const getClientPoint = (event: MouseEvent | TouchEvent): CanvasPoint | null => {
  if (event instanceof MouseEvent) {
    return { x: event.clientX, y: event.clientY };
  }

  const touch = event.touches[0] || event.changedTouches[0];

  if (!touch) return null;

  return { x: touch.clientX, y: touch.clientY };
};

export const getTouchDistance = (touches: TouchList) => {
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return 0;

  const dx = first.clientX - second.clientX;
  const dy = first.clientY - second.clientY;

  return Math.hypot(dx, dy);
};

export const getTouchCenter = (touches: TouchList): CanvasPoint | null => {
  const first = touches[0];
  const second = touches[1];
  if (!first || !second) return null;

  return {
    x: (first.clientX + second.clientX) / 2,
    y: (first.clientY + second.clientY) / 2,
  };
};
