import { useCallback, useEffect, useState } from 'react';
import { SETTINGS_PREFIX, applyTheme, readSettings, saveSettings } from './theme';
import type { Settings } from './types';

export interface SettingsState {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

/**
 * Theme and background settings, persisted in localStorage and shared by both pages.
 * A change made in another tab (the home page and a game open side by side) is picked up too.
 */
export function useSettings(): SettingsState {
  const [settings, setSettings] = useState<Settings>(readSettings);

  useEffect(() => {
    applyTheme(settings.theme);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith(SETTINGS_PREFIX)) {
        setSettings(readSettings());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { settings, update };
}
