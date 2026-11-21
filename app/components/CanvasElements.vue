<script setup lang="ts">
import { CANVAS_WORLD_SIZE } from '~/constants/canvas';
import type { CanvasPoint } from '~/types/canvas';

const props = defineProps<{
  zoom: number;
  panOffset: CanvasPoint;
}>();

const { cards, handleCardPointerDown, handleCardResizeStart, handleCardClose } = useCanvasElements(toRef(props, 'zoom'), toRef(props, 'panOffset'));

const worldLayerStyle = computed(() => ({
  width: `${CANVAS_WORLD_SIZE.width}px`,
  height: `${CANVAS_WORLD_SIZE.height}px`,
  transform: `translate(${props.panOffset.x}px, ${props.panOffset.y}px) scale(${props.zoom})`,
  transformOrigin: 'top left',
}));
</script>

<template>
  <div data-canvas-drop-target class="pointer-events-none fixed inset-0 z-10">
    <div class="absolute top-0 left-0" :style="worldLayerStyle">
      <CanvasCard
        v-for="card in cards"
        :key="card.id"
        :x="card.x"
        :y="card.y"
        :width="card.width"
        :height="card.height"
        :text="card.text"
        :title="card.title"
        :image-url="card.image_url"
        :youtube-embed-url="card.youtube_embed_url"
        @pointerdown="handleCardPointerDown(card, $event)"
        @resize-start="handleCardResizeStart(card, $event)"
        @close="handleCardClose(card.id)" />
    </div>
  </div>
</template>
