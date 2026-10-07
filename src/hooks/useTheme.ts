import { useCallback, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'max-client.theme';

/**
 * Light/dark mode persisted in localStorage and mirrored to
 * `document.documentElement.dataset.theme` (an inline script in index.html
 * applies it before first paint to avoid a flash of the wrong theme).
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = usePersistentState<Theme>(THEME_KEY, 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setTheme]);

  return [theme, toggle];
}
