export function useCanvasInteractionLock() {
  const lockCount = useState('canvas:interaction-lock-count', () => 0);
  const isInteractionLocked = computed(() => lockCount.value > 0);

  const release = () => {
    lockCount.value = Math.max(0, lockCount.value - 1);
  };

  const lock = () => {
    lockCount.value += 1;

    let isReleased = false;

    return () => {
      if (isReleased) return;

      isReleased = true;
      release();
    };
  };

  return {
    isInteractionLocked,
    lock,
    release,
  };
}
