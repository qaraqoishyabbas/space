export type ButtonColor = 'error' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'neutral';
export type ButtonVariant = 'link' | 'solid' | 'outline' | 'soft' | 'subtle' | 'ghost';
export type ConfirmCallback = () => void | Promise<void>;

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmButtonText?: string;
  confirmButtonColor?: ButtonColor;
  confirmButtonVariant?: ButtonVariant;
  cancelButtonText?: string;
  cancelButtonColor?: ButtonColor;
  cancelButtonVariant?: ButtonVariant;
  onConfirm?: ConfirmCallback;
  onCancel?: ConfirmCallback;
}
