import { useEventListener, useLocalStorage } from '@vueuse/core';
import type { Ref } from 'vue';
import { CANVAS_STORAGE_KEYS, DEFAULT_CARDS, MIN_CARD_SIZE, PASTED_TEXT_CARD_SIZE, YOUTUBE_CARD_SIZE } from '~/constants/canvas';
import type { CanvasCardItem, CanvasPoint } from '~/types/canvas';
import { getClientPoint } from '~/utils/canvas';

interface DragStartState {
  clientX: number;
  clientY: number;
  cardX: number;
  cardY: number;
}

interface ResizeStartState {
  clientX: number;
  clientY: number;
  width: number;
  height: number;
  mode: 'width' | 'both';
}

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
};

const createCardId = (cards: CanvasCardItem[]) => Math.max(0, ...cards.map(card => card.id)) + 1;

const readImageFile = (file: File) =>
  new Promise<{ url: string; width: number; height: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onabort = () => reject(new Error('Image reading cancelled'));
    reader.onload = () => {
      const url = reader.result as string;
      const image = new Image();
      image.onerror = () => reject(new Error('Invalid image'));
      image.onload = () => {
        const scale = Math.min(1, 480 / image.naturalWidth, 480 / image.naturalHeight);
        resolve({ url, width: image.naturalWidth * scale, height: image.naturalHeight * scale });
      };
      image.src = url;
    };
    reader.readAsDataURL(file);
  });

const getYoutubeEmbedUrl = (value: string) => {
  const iframeSrc = value.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1];
  const candidate = iframeSrc ?? value;

  try {
    const url = new URL(candidate.trim());
    const hostname = url.hostname.replace(/^www\./, '');

    if (hostname === 'youtu.be') {
      const videoId = url.pathname.split('/').filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com' || hostname === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/')) {
        const videoId = url.pathname.split('/').filter(Boolean)[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (url.pathname === '/watch') {
        const videoId = url.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (url.pathname.startsWith('/shorts/')) {
        const videoId = url.pathname.split('/').filter(Boolean)[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export function useCanvasElements(zoom: Ref<number>, panOffset: Readonly<Ref<CanvasPoint>>) {
  const cards = useLocalStorage<CanvasCardItem[]>(CANVAS_STORAGE_KEYS.cards, DEFAULT_CARDS);
  const { isInteractionLocked } = useCanvasInteractionLock();
  const toast = useToast();

  const draggedCardId = ref<number | null>(null);
  const dragStartState = ref<DragStartState | null>(null);

  const resizedCardId = ref<number | null>(null);
  const resizeStartState = ref<ResizeStartState | null>(null);

  const bringCardToFront = (card: CanvasCardItem) => {
    const index = cards.value.findIndex(item => item.id === card.id);
    if (index === -1) return card;

    const [selectedCard] = cards.value.splice(index, 1);
    if (!selectedCard) return card;
    cards.value.push(selectedCard);

    return selectedCard;
  };

  const stopInteractions = () => {
    draggedCardId.value = null;
    dragStartState.value = null;
    resizedCardId.value = null;
    resizeStartState.value = null;
  };

  const handleCardResizeStart = (card: CanvasCardItem, event: MouseEvent | TouchEvent) => {
    if (isInteractionLocked.value) {
      stopInteractions();
      return;
    }

    const point = getClientPoint(event);
    if (!point) return;

    const selectedCard = bringCardToFront(card);

    resizedCardId.value = selectedCard.id;
    resizeStartState.value = {
      clientX: point.x,
      clientY: point.y,
      width: selectedCard.width,
      height: selectedCard.height,
      mode: selectedCard.image_url || selectedCard.youtube_embed_url ? 'both' : 'width',
    };

    draggedCardId.value = null;
    dragStartState.value = null;
  };

  const handleCardPointerDown = (card: CanvasCardItem, event: MouseEvent | TouchEvent) => {
    if (isInteractionLocked.value) {
      stopInteractions();
      return;
    }

    const point = getClientPoint(event);
    if (!point) return;

    const selectedCard = bringCardToFront(card);

    draggedCardId.value = selectedCard.id;
    dragStartState.value = {
      clientX: point.x,
      clientY: point.y,
      cardX: selectedCard.x,
      cardY: selectedCard.y,
    };
  };

  const handleCardClose = (id: number) => {
    const index = cards.value.findIndex(card => card.id === id);
    if (index !== -1) cards.value.splice(index, 1);
  };

  const addImageFiles = async (files: File[], center: CanvasPoint) => {
    for (const [index, file] of files.entries()) {
      try {
        const image = await readImageFile(file);
        cards.value.push({
          id: createCardId(cards.value),
          x: center.x - image.width / 2 + index * 24,
          y: center.y - image.height / 2 + index * 24,
          width: image.width,
          height: image.height,
          image_url: image.url,
        });
      } catch {
        toast.add({ title: 'Не удалось добавить изображение', description: 'Попробуйте другой файл.', color: 'error' });
      }
    }
  };

  const isCanvasDropTarget = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('[data-canvas-drop-target]'));

  const handleDragOver = (event: DragEvent) => {
    if (isInteractionLocked.value || isEditableTarget(event.target) || !isCanvasDropTarget(event.target) || !event.dataTransfer) return;

    const hasImages = Array.from(event.dataTransfer.items).some(item => item.kind === 'file' && item.type.startsWith('image/'));
    if (!hasImages) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: DragEvent) => {
    if (isInteractionLocked.value || isEditableTarget(event.target) || !isCanvasDropTarget(event.target)) return;

    const files = Array.from(event.dataTransfer?.files ?? []).filter(file => file.type.startsWith('image/'));
    if (!files.length) return;

    event.preventDefault();
    stopInteractions();
    await addImageFiles(files, {
      x: (event.clientX - panOffset.value.x) / zoom.value,
      y: (event.clientY - panOffset.value.y) / zoom.value,
    });
  };

  const handlePaste = async (event: ClipboardEvent) => {
    if (isInteractionLocked.value || isEditableTarget(event.target)) return;

    const imageFiles = Array.from(event.clipboardData?.items ?? [])
      .filter(item => item.kind === 'file' && item.type.startsWith('image/'))
      .map(item => item.getAsFile())
      .filter((file): file is File => file !== null);
    const text = event.clipboardData?.getData('text/plain').trim();
    if (!imageFiles.length && !text) return;

    event.preventDefault();
    stopInteractions();

    const centerX = (window.innerWidth / 2 - panOffset.value.x) / zoom.value;
    const centerY = (window.innerHeight / 2 - panOffset.value.y) / zoom.value;

    if (imageFiles.length) {
      await addImageFiles(imageFiles, { x: centerX, y: centerY });
      return;
    }

    if (!text) return;
    const youtubeEmbedUrl = getYoutubeEmbedUrl(text);
    const cardSize = youtubeEmbedUrl ? YOUTUBE_CARD_SIZE : PASTED_TEXT_CARD_SIZE;

    cards.value.push({
      id: createCardId(cards.value),
      x: centerX - cardSize.width / 2,
      y: centerY - cardSize.height / 2,
      width: cardSize.width,
      height: cardSize.height,
      ...(youtubeEmbedUrl ? { title: text, youtube_embed_url: youtubeEmbedUrl } : { text }),
    });
  };

  const handlePointerMove = (event: MouseEvent | TouchEvent) => {
    if (isInteractionLocked.value) {
      stopInteractions();
      return;
    }

    const point = getClientPoint(event);
    if (!point) return;

    if (event instanceof TouchEvent) {
      event.preventDefault();
    }

    const startState = resizeStartState.value ?? dragStartState.value;
    if (!startState) return;

    const dxWorld = (point.x - startState.clientX) / zoom.value;
    const dyWorld = (point.y - startState.clientY) / zoom.value;

    if (resizedCardId.value !== null && resizeStartState.value) {
      const card = cards.value.find(item => item.id === resizedCardId.value);
      if (!card) return;

      card.width = Math.max(MIN_CARD_SIZE.width, resizeStartState.value.width + dxWorld);

      if (resizeStartState.value.mode === 'both') {
        card.height = Math.max(MIN_CARD_SIZE.height, resizeStartState.value.height + dyWorld);
      }

      return;
    }

    if (draggedCardId.value === null || !dragStartState.value) return;

    const card = cards.value.find(item => item.id === draggedCardId.value);
    if (!card) return;

    card.x = dragStartState.value.cardX + dxWorld;
    card.y = dragStartState.value.cardY + dyWorld;
  };

  useEventListener(window, 'mousemove', handlePointerMove);
  useEventListener(window, 'touchmove', handlePointerMove, { passive: false });
  useEventListener(window, 'mouseup', stopInteractions);
  useEventListener(window, 'touchend', stopInteractions);
  useEventListener(window, 'touchcancel', stopInteractions);
  useEventListener(window, 'paste', handlePaste);
  useEventListener(window, 'dragover', handleDragOver);
  useEventListener(window, 'drop', handleDrop);

  return {
    cards,
    draggedCardId,
    resizedCardId,
    handleCardPointerDown,
    handleCardResizeStart,
    handleCardClose,
  };
}
