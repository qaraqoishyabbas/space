<script setup lang="ts">
import type { ButtonColor, ButtonVariant, ConfirmCallback } from '~/types/confirm';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;

    confirmButtonText?: string;
    confirmButtonColor?: ButtonColor; // Nuxt UI color: primary, neutral, red, etc.
    confirmButtonVariant?: ButtonVariant; // Nuxt UI variant: solid, ghost, soft, link...

    cancelButtonText?: string;
    cancelButtonColor?: ButtonColor;
    cancelButtonVariant?: ButtonVariant;

    onConfirm?: ConfirmCallback;
    onCancel?: ConfirmCallback;
  }>(),
  {
    description: '',
    confirmButtonText: 'Подтвердить',
    confirmButtonColor: 'primary',
    confirmButtonVariant: 'soft',

    cancelButtonText: 'Отмена',
    cancelButtonColor: 'neutral',
    cancelButtonVariant: 'ghost',
  },
);

const emit = defineEmits<{
  (e: 'confirm'): void;
  (e: 'cancel'): void;
  (e: 'close'): void;
}>();

const { lock } = useCanvasInteractionLock();
const isLoading = ref(false);
let releaseInteractionLock: (() => void) | null = null;

const handleClose = () => emit('close');

const handleConfirm = async () => {
  if (isLoading.value) return;
  isLoading.value = true;
  try {
    if (props.onConfirm) {
      await props.onConfirm(); // используем callback-режим
    } else {
      emit('confirm'); // либо событийный режим
    }
  } finally {
    isLoading.value = false;
    emit('close');
  }
};

const handleCancel = async () => {
  if (isLoading.value) return;
  try {
    if (props.onCancel) {
      await props.onCancel();
    } else {
      emit('cancel');
    }
  } finally {
    emit('close');
  }
};

onMounted(() => {
  releaseInteractionLock = lock();
});

onBeforeUnmount(() => {
  releaseInteractionLock?.();
});
</script>

<template>
  <UModal :title="title" description="Подтвердите действие" :dismissible="!isLoading" @close="handleClose">
    <template #content>
      <div class="flow-root space-y-3 p-4">
        <div class="space-y-2">
          <div class="text-lg font-semibold">{{ title }}</div>
          <div v-if="description" class="text-muted text-sm">{{ description }}</div>
        </div>

        <div class="float-right flex gap-2">
          <UButton type="button" :label="cancelButtonText" :color="cancelButtonColor" :variant="cancelButtonVariant" :disabled="isLoading" @click="handleCancel" />
          <UButton
            type="button"
            :label="confirmButtonText"
            :color="confirmButtonColor"
            :variant="confirmButtonVariant"
            :disabled="isLoading"
            :loading="isLoading"
            @click="handleConfirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
