<script setup lang="ts">
import { CANVAS_WORLD_SIZE } from '~/constants/canvas';

const { canvasRef, centerPosition, zoomByFactor, resetView, toggleGrid, zoom, panOffset } = useCanvasController(CANVAS_WORLD_SIZE.width, CANVAS_WORLD_SIZE.height);
</script>

<template>
  <canvas ref="canvasRef" data-canvas-drop-target class="fixed inset-0 z-0 cursor-default touch-none" />
  <CanvasElements :zoom="zoom" :panOffset="panOffset" />
  <CanvasPanel :onZoom="zoomByFactor" :onResetView="resetView" :position="centerPosition" :onToggleGrid="toggleGrid" />
</template>
