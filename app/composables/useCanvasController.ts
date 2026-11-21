import { useEventListener, useLocalStorage } from '@vueuse/core';
import { CANVAS_GRID_SIZE, CANVAS_STORAGE_KEYS, CANVAS_WORLD_SIZE, CANVAS_ZOOM, RESET_ANIMATION_DURATION_MS, VIEW_ANIMATION_DURATION_MS } from '~/constants/canvas';
import type { CanvasPoint, CanvasRenderCallback, CanvasState, CanvasSize, UseCanvasOptions } from '~/types/canvas';
import { clamp, getCanvasCenter, getCenteredOffset, getClampedPanOffset, getTouchCenter, getTouchDistance, getViewportSize } from '~/utils/canvas';

const easeInOutQuad = (progress: number) => (progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress);

export function useCanvasController(width = CANVAS_WORLD_SIZE.width, height = CANVAS_WORLD_SIZE.height, options: UseCanvasOptions = {}) {
  const worldSize: CanvasSize = {
    width: options.width ?? width,
    height: options.height ?? height,
  };

  const minScale = options.minScale ?? CANVAS_ZOOM.min;
  const maxScale = options.maxScale ?? CANVAS_ZOOM.max;
  const gridSize = options.gridSize ?? CANVAS_GRID_SIZE;

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const centerPosition = ref<CanvasPoint>({ x: 0, y: 0 });
  const zoom = ref(1);
  const panOffset = reactive<CanvasPoint>({ x: 0, y: 0 });
  const isGridEnabled = useLocalStorage<boolean>(CANVAS_STORAGE_KEYS.isGridEnabled, true);
  const { isInteractionLocked } = useCanvasInteractionLock();

  let ctx: CanvasRenderingContext2D | null = null;
  let canvasEl: HTMLCanvasElement | null = null;
  let renderCallback: CanvasRenderCallback | undefined = options.onRender;

  let isSpaceKeyPressed = false;
  let isDragging = false;
  let dragStartScreenPoint: CanvasPoint = { x: 0, y: 0 };
  let lastTouchPoint: CanvasPoint | null = null;
  let pinchInitialDistance = 0;
  let pinchInitialScale = zoom.value;
  let animationFrameId = 0;

  const clampPanOffset = () => {
    const clampedOffset = getClampedPanOffset(panOffset, worldSize, getViewportSize(), zoom.value);
    panOffset.x = clampedOffset.x;
    panOffset.y = clampedOffset.y;
  };

  const resizeCanvasBuffer = () => {
    if (!canvasEl || !ctx) return;

    const viewport = getViewportSize();
    const dpr = window.devicePixelRatio || 1;

    canvasEl.style.width = `${viewport.width}px`;
    canvasEl.style.height = `${viewport.height}px`;
    canvasEl.width = Math.floor(viewport.width * dpr);
    canvasEl.height = Math.floor(viewport.height * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const drawGrid = () => {
    if (!ctx) return;

    ctx.strokeStyle = '#d4d4d4';
    ctx.lineWidth = 0.5 / zoom.value;

    for (let x = 0; x <= worldSize.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, worldSize.height);
      ctx.stroke();
    }

    for (let y = 0; y <= worldSize.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(worldSize.width, y);
      ctx.stroke();
    }
  };

  const buildCanvasState = (): CanvasState => ({
    ...worldSize,
    zoom: zoom.value,
    panOffset: { ...panOffset },
    centerPosition: { ...centerPosition.value },
  });

  const renderCanvas = () => {
    if (!ctx || !canvasEl) return;

    const viewport = getViewportSize();
    const dpr = window.devicePixelRatio || 1;

    centerPosition.value = getCanvasCenter(viewport, panOffset, zoom.value);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, viewport.width, viewport.height);

    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom.value, zoom.value);

    if (isGridEnabled.value) {
      drawGrid();
    }

    renderCallback?.(ctx, buildCanvasState());
    ctx.restore();
  };

  const requestRender = () => renderCanvas();

  const setRenderCallback = (callback?: CanvasRenderCallback) => {
    renderCallback = callback;
    renderCanvas();
  };

  const toggleGrid = () => {
    isGridEnabled.value = !isGridEnabled.value;
    renderCanvas();
  };

  const animateView = (targetScale: number, targetOffset: CanvasPoint, duration: number) => {
    cancelAnimationFrame(animationFrameId);

    const startTime = performance.now();
    const startScale = zoom.value;
    const startOffset = { ...panOffset };

    const animate = (time: number) => {
      const progress = clamp((time - startTime) / duration, 0, 1);
      const easedProgress = easeInOutQuad(progress);

      zoom.value = startScale + (targetScale - startScale) * easedProgress;
      panOffset.x = startOffset.x + (targetOffset.x - startOffset.x) * easedProgress;
      panOffset.y = startOffset.y + (targetOffset.y - startOffset.y) * easedProgress;

      clampPanOffset();
      renderCanvas();

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
  };

  const resetView = () => {
    animateView(1, getCenteredOffset(worldSize, getViewportSize()), RESET_ANIMATION_DURATION_MS);
  };

  const zoomAroundPoint = (targetScale: number, point: CanvasPoint) => {
    const nextScale = clamp(targetScale, minScale, maxScale);
    const scaleRatio = nextScale / zoom.value;

    panOffset.x -= (point.x - panOffset.x) * (scaleRatio - 1);
    panOffset.y -= (point.y - panOffset.y) * (scaleRatio - 1);
    zoom.value = nextScale;

    clampPanOffset();
    renderCanvas();
  };

  const zoomByFactor = (factor: number) => {
    const viewport = getViewportSize();
    const targetScale = clamp(zoom.value * factor, minScale, maxScale);
    const startScale = zoom.value;
    const startOffset = { ...panOffset };
    const centerPoint = { x: viewport.width / 2, y: viewport.height / 2 };

    const scaleRatio = targetScale / startScale;
    const targetOffset = {
      x: startOffset.x - (centerPoint.x - startOffset.x) * (scaleRatio - 1),
      y: startOffset.y - (centerPoint.y - startOffset.y) * (scaleRatio - 1),
    };

    animateView(targetScale, targetOffset, VIEW_ANIMATION_DURATION_MS);
  };

  const setCanvasCursor = (cursor: string) => {
    if (canvasEl) canvasEl.style.cursor = cursor;
  };

  const stopNavigation = () => {
    isDragging = false;
    lastTouchPoint = null;
    pinchInitialDistance = 0;
    setCanvasCursor('default');
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (isInteractionLocked.value) {
      stopNavigation();
      return;
    }

    if (!isSpaceKeyPressed) return;

    isDragging = true;
    dragStartScreenPoint = { x: event.clientX, y: event.clientY };
    setCanvasCursor('grabbing');
    event.preventDefault();
  };

  const handleMouseUp = () => {
    isDragging = false;
    setCanvasCursor(isSpaceKeyPressed && !isInteractionLocked.value ? 'grab' : 'default');
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (isInteractionLocked.value) {
      stopNavigation();
      return;
    }

    if (!isDragging) return;

    panOffset.x += event.clientX - dragStartScreenPoint.x;
    panOffset.y += event.clientY - dragStartScreenPoint.y;
    dragStartScreenPoint = { x: event.clientX, y: event.clientY };
    clampPanOffset();
    renderCanvas();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Space') return;

    if (isInteractionLocked.value) {
      stopNavigation();
      return;
    }

    isSpaceKeyPressed = true;
    if (!isDragging) setCanvasCursor('grab');
    event.preventDefault();
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    if (event.code !== 'Space') return;

    isSpaceKeyPressed = false;
    if (!isDragging) setCanvasCursor('default');
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (isInteractionLocked.value) {
      stopNavigation();
      return;
    }

    const touch = event.touches[0];
    if (event.touches.length === 1 && touch) {
      lastTouchPoint = { x: touch.clientX, y: touch.clientY };
      return;
    }

    if (event.touches.length === 2) {
      pinchInitialDistance = getTouchDistance(event.touches);
      pinchInitialScale = zoom.value;
    }
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (isInteractionLocked.value) {
      stopNavigation();
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];
    if (event.touches.length === 1 && touch && lastTouchPoint) {
      panOffset.x += touch.clientX - lastTouchPoint.x;
      panOffset.y += touch.clientY - lastTouchPoint.y;
      lastTouchPoint = { x: touch.clientX, y: touch.clientY };
      clampPanOffset();
      renderCanvas();
      return;
    }

    if (event.touches.length === 2 && pinchInitialDistance) {
      const touchCenter = getTouchCenter(event.touches);
      if (!touchCenter) return;

      const factor = getTouchDistance(event.touches) / pinchInitialDistance;
      zoomAroundPoint(pinchInitialScale * factor, touchCenter);
    }
  };

  const handleTouchEnd = (event: TouchEvent) => {
    lastTouchPoint = event.touches[0] ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    if (event.touches.length < 2) pinchInitialDistance = 0;
  };

  const handleWheel = (event: WheelEvent) => {
    if (isInteractionLocked.value) return;

    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      zoomAroundPoint(zoom.value * (1 - event.deltaY * 0.01), { x: event.clientX, y: event.clientY });
      return;
    }

    if (event.deltaX === 0 && event.deltaY === 0) return;

    event.preventDefault();
    panOffset.x -= event.deltaX;
    panOffset.y -= event.deltaY;
    clampPanOffset();
    renderCanvas();
  };

  const handleResize = () => {
    const previousCenter = { ...centerPosition.value };

    resizeCanvasBuffer();

    const viewport = getViewportSize();
    panOffset.x = viewport.width / 2 - previousCenter.x * zoom.value;
    panOffset.y = viewport.height / 2 - previousCenter.y * zoom.value;

    clampPanOffset();
    renderCanvas();
  };

  onMounted(() => {
    canvasEl = canvasRef.value;
    if (!canvasEl) return;

    ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    resizeCanvasBuffer();

    const initialOffset = getCenteredOffset(worldSize, getViewportSize());
    panOffset.x = initialOffset.x;
    panOffset.y = initialOffset.y;

    renderCanvas();
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(animationFrameId);
  });

  useEventListener(canvasRef, 'mousedown', handleMouseDown);
  useEventListener(canvasRef, 'mousemove', handleMouseMove);
  useEventListener(canvasRef, 'touchstart', handleTouchStart, { passive: false });
  useEventListener(canvasRef, 'touchmove', handleTouchMove, { passive: false });
  useEventListener(canvasRef, 'touchend', handleTouchEnd);
  useEventListener(window, 'mouseup', handleMouseUp);
  useEventListener(window, 'keydown', handleKeyDown);
  useEventListener(window, 'keyup', handleKeyUp);
  useEventListener(window, 'wheel', handleWheel, { passive: false });
  useEventListener(window, 'resize', handleResize);

  return {
    canvasRef,
    centerPosition,
    zoom,
    panOffset,
    isGridEnabled,
    zoomByFactor,
    resetView,
    toggleGrid,
    requestRender,
    setRenderCallback,
  };
}
