<script setup lang="ts">
import { CANVAS_ZOOM } from '~/constants/canvas';
import type { CanvasPoint } from '~/types/canvas';

interface CanvasPanelProps {
  onZoom: (factor: number) => void;
  onResetView: () => void;
  position: CanvasPoint;
  onToggleGrid: () => void;
}

const props = defineProps<CanvasPanelProps>();
const isActionsMenuOpen = ref(false);
const { lock } = useCanvasInteractionLock();
let releaseActionsMenuLock: (() => void) | null = null;

const items = ref([
  [
    {
      label: 'Сетка',
      icon: 'i-ph-grid-four-bold',
      onSelect(e: Event) {
        props.onToggleGrid();
        e.preventDefault();
      },
    },
  ],
]);

watch(isActionsMenuOpen, isOpen => {
  releaseActionsMenuLock?.();
  releaseActionsMenuLock = isOpen ? lock() : null;
});

onBeforeUnmount(() => {
  releaseActionsMenuLock?.();
});
</script>

<template>
  <div class="fixed top-1/2 right-2 z-20 flex -translate-y-1/2 transform flex-col space-y-1">
    <UButton icon="i-ph-plus-bold" aria-label="Увеличить" @click="props.onZoom(CANVAS_ZOOM.stepIn)" />
    <UButton icon="i-ph-minus-bold" aria-label="Уменьшить" @click="props.onZoom(CANVAS_ZOOM.stepOut)" />
    <UButton icon="i-ph-crosshair-simple-bold" aria-label="Сбросить вид" @click="props.onResetView" />
  </div>

  <div class="fixed right-2 bottom-2 z-20 flex space-x-1">
    <UButton :label="`${props.position.x} × ${props.position.y}`" @click="props.onResetView" class="font-bold" />
    <UColorModeButton variant="soft" />
    <UDropdownMenu v-model:open="isActionsMenuOpen" :items="items" :modal="true">
      <UButton icon="i-ph-command-bold" />
    </UDropdownMenu>
  </div>
</template>
