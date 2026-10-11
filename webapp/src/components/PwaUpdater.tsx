import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from '../store/useToastStore';

const UPDATE_TOAST_ID = 'pwa-update';

/**
 * Registers the service worker (`registerType: 'autoUpdate'`). A new version
 * activates automatically in the background; instead of force-reloading (which
 * could interrupt an edit) we show an "update available" toast with Reload.
 */
export default function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onNeedReload() {
      toast('A new version of Vacay is available', {
        id: UPDATE_TOAST_ID,
        duration: 0,
        action: { label: 'Reload', onClick: () => window.location.reload() },
      });
    },
    onRegisterError(error: unknown) {
      console.warn('Service worker registration failed:', error);
    },
  });

  useEffect(() => {
    if (!offlineReady) return;
    toast.success('Ready to work offline');
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  return null;
}
