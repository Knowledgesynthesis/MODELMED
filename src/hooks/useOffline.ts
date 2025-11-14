import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';

export function useOffline() {
  const setOfflineStatus = useAppStore((state) => state.setOfflineStatus);
  const isOffline = useAppStore((state) => state.isOffline);

  useEffect(() => {
    const handleOnline = () => setOfflineStatus(false);
    const handleOffline = () => setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    setOfflineStatus(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOfflineStatus]);

  return isOffline;
}
