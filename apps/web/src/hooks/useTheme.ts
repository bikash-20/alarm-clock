import { useEffect } from 'react';
import { useStore } from '../store';

// Applies the persisted theme to <html data-theme>. Runs once on mount and
// whenever the settings slice changes.

export const useTheme = (): void => {
  const theme = useStore((s) => s.settings.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
};