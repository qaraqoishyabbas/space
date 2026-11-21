import { ConfirmationModal } from '#components';
import type { ConfirmOptions } from '~/types/confirm';

const getConfirmProps = (opts: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>) => ({
  title: opts.title,
  description: opts.description ?? '',
  confirmButtonText: opts.confirmButtonText ?? 'Подтвердить',
  confirmButtonColor: opts.confirmButtonColor ?? 'primary',
  confirmButtonVariant: opts.confirmButtonVariant ?? 'soft',
  cancelButtonText: opts.cancelButtonText ?? 'Отмена',
  cancelButtonColor: opts.cancelButtonColor ?? 'neutral',
  cancelButtonVariant: opts.cancelButtonVariant ?? 'ghost',
});

export const useConfirm = () => {
  const overlay = useOverlay();

  const confirm = (opts: ConfirmOptions) => {
    overlay.create(ConfirmationModal).open({
      ...getConfirmProps(opts),
      onConfirm: opts.onConfirm,
      onCancel: opts.onCancel,
    });
  };

  const confirmAsync = (opts: Omit<ConfirmOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise<boolean>(resolve => {
      overlay.create(ConfirmationModal).open({
        ...getConfirmProps(opts),
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  return { confirm, confirmAsync };
};
