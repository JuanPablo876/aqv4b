// DEPRECATED: Use useNotifications instead
// This file is kept for backward compatibility
import { useNotifications } from '../contexts/NotificationContext';

export const useToast = () => {
  const { notify } = useNotifications();

  // Legacy toast interface - maps to new notification system
  const toast = {
    success: (message, duration) => notify.success(message, { autoRemoveDelay: duration }),
    error: (message, duration) => notify.error(message, { autoRemoveDelay: duration }),
    warning: (message, duration) => notify.warning(message, { autoRemoveDelay: duration }),
    info: (message, duration) => notify.info(message, { autoRemoveDelay: duration })
  };

  return { toast };
};

export default useToast;
