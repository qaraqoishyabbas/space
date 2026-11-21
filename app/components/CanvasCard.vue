<script setup lang="ts">
const { confirm } = useConfirm();

const props = withDefaults(
  defineProps<{
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    title?: string;
    imageUrl?: string;
    youtubeEmbedUrl?: string;
  }>(),
  {
    text: '',
    title: '',
    imageUrl: '',
    youtubeEmbedUrl: '',
  },
);

const emit = defineEmits<{
  (e: 'pointerdown', event: MouseEvent | TouchEvent): void;
  (e: 'resize-start', event: MouseEvent | TouchEvent): void;
  (e: 'close'): void;
}>();

const displayTitle = computed(() => props.title);

const youtubeWatchUrl = computed(() => {
  if (!props.youtubeEmbedUrl) return '';

  try {
    const url = new URL(props.youtubeEmbedUrl);
    const videoId = url.pathname.split('/').filter(Boolean)[1];

    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : props.youtubeEmbedUrl;
  } catch {
    return props.youtubeEmbedUrl;
  }
});

const cardStyle = computed(() => ({
  left: `${props.x}px`,
  top: `${props.y}px`,
  width: `${props.width}px`,
  height: props.imageUrl || props.youtubeEmbedUrl ? `${props.height}px` : 'auto',
}));

const handlePointerDown = (event: MouseEvent | TouchEvent) => {
  const target = event.target as HTMLElement | null;

  if (target && typeof target.closest === 'function') {
    const interactiveElement = target.closest('[data-card-action]');
    if (interactiveElement) return;
  }

  emit('pointerdown', event);
};

const handleResizePointerDown = (event: MouseEvent | TouchEvent) => {
  emit('resize-start', event);
};

const handleCloseClick = () => {
  confirm({
    title: 'Вы точно хотите удалить элемент?',
    confirmButtonText: 'Удалить',
    confirmButtonColor: 'error',
    confirmButtonVariant: 'solid',
    async onConfirm() {
      emit('close');
    },
  });
};
</script>

<template>
  <div
    class="bg-inverted/5 group ring-default pointer-events-auto absolute cursor-move overflow-hidden rounded-lg p-1 shadow-md backdrop-blur-xl select-none"
    :style="cardStyle"
    @mousedown.stop.prevent="handlePointerDown"
    @touchstart.stop.prevent="handlePointerDown">
    <div class="flex h-full flex-col gap-2">
      <div v-if="displayTitle" class="flex items-start justify-between px-2">
        <div class="text-md truncate font-bold">
          {{ displayTitle }}
        </div>
        <UButton
          icon="i-ph-x-bold"
          size="xs"
          variant="ghost"
          class="hidden group-hover:inline-flex"
          data-card-action
          @click.stop.prevent="handleCloseClick"
          @touchstart.stop.prevent="handleCloseClick" />
      </div>

      <div class="bg-default/80 relative min-h-0 w-full flex-1 overflow-hidden rounded-lg">
        <UButton
          v-if="!displayTitle"
          icon="i-ph-x-bold"
          size="xs"
          variant="soft"
          class="absolute top-1 right-1 z-10 hidden group-hover:inline-flex"
          data-card-action
          @click.stop.prevent="handleCloseClick"
          @touchstart.stop.prevent="handleCloseClick" />

        <UButton
          v-if="youtubeWatchUrl"
          :to="youtubeWatchUrl"
          target="_blank"
          icon="i-ph-youtube-logo-bold"
          size="xs"
          variant="soft"
          class="absolute top-1 left-1 z-10 hidden group-hover:inline-flex"
          data-card-action
          @mousedown.stop
          @touchstart.stop />

        <iframe
          v-if="youtubeEmbedUrl"
          :src="youtubeEmbedUrl"
          title="YouTube video player"
          class="pointer-events-auto block h-full w-full"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen />
        <img v-else-if="imageUrl" :src="imageUrl" alt="" class="block h-full w-full object-cover" />
        <div v-else class="p-2 whitespace-pre-line">
          {{ text }}
        </div>

        <UButton
          icon="i-ph-notches-bold"
          size="xs"
          variant="soft"
          class="absolute right-1 bottom-1 z-10 hidden cursor-se-resize p-1 group-hover:inline-flex"
          data-card-action
          @mousedown.stop.prevent="handleResizePointerDown"
          @touchstart.stop.prevent="handleResizePointerDown" />
      </div>
    </div>
  </div>
</template>
