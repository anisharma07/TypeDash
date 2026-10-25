import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { THEMES } from '../theme/theme';
import type { ColorScheme, Settings } from '../theme/types';

type Filter = 'all' | ColorScheme;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

/** Settings modal shared by both pages: the theme picker (applied live) and the starfield switch. */
export function SettingsDialog({ open, onClose, settings, onChange }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // The checked theme can be filtered out; focus must still land inside the dialog, or keys reach the page.
    // No scroll: the dialog opens at the top, and the arrow keys bring the focused theme into view.
    const target =
      dialogRef.current?.querySelector<HTMLElement>('input[name="theme"]:checked') ??
      dialogRef.current?.querySelector<HTMLElement>('button');
    target?.focus({ preventScroll: true });
    return () => opener?.focus();
  }, [open]);

  if (!open) return null;

  // Every key stays inside the dialog: the pages bind Esc (leave the game), Enter (ready), Tab, the arrows
  // and more on the document, and none of them may fire behind the modal.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !(el instanceof HTMLInputElement && el.type === 'radio' && !el.checked),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  const onBackdrop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const visible = THEMES.filter((t) => filter === 'all' || t.scheme === filter);

  return (
    <div className="settings-backdrop" onMouseDown={onBackdrop}>
      <div
        className="settings"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={dialogRef}
        onKeyDown={onKeyDown}
      >
        <header className="settings-head">
          <h2 id="settings-title">Settings</h2>
          <button type="button" className="icon-btn" aria-label="Close settings" onClick={onClose}>
            <i className="bx bx-x" aria-hidden="true"></i>
          </button>
        </header>

        <div className="settings-body">
          <section className="settings-section">
            <label className="switch-row">
              <span>
                <span className="switch-label">Starfield</span>
                <span className="switch-hint">Stars drifting behind the page</span>
              </span>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={settings.starfield}
                onChange={(e) => onChange({ starfield: e.target.checked })}
              />
            </label>
          </section>

          <section className="settings-section" aria-labelledby="settings-theme">
            <div className="settings-section-head">
              <h3 id="settings-theme">Theme</h3>
              <div className="segmented" role="group" aria-label="Show themes">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    aria-pressed={filter === f.value}
                    onClick={() => setFilter(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="theme-grid" role="radiogroup" aria-labelledby="settings-theme">
              {visible.map((theme) => (
                <label key={theme.slug} className="theme-option">
                  <input
                    type="radio"
                    name="theme"
                    value={theme.slug}
                    className="visually-hidden"
                    checked={settings.theme === theme.slug}
                    onChange={() => onChange({ theme: theme.slug })}
                  />
                  {/* The swatch carries the theme's own data-theme, so it is drawn in that theme's tokens. */}
                  <span className="theme-swatch" data-theme={theme.slug} aria-hidden="true">
                    <span className="theme-swatch-text">Aa</span>
                    <span className="theme-swatch-accent"></span>
                  </span>
                  <span className="theme-option-name">{theme.name}</span>
                  <span className="theme-option-meta">{theme.scheme === 'dark' ? 'Dark' : 'Light'}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="settings-foot">
          Themes adapted from{' '}
          <a href="https://github.com/Nutlope/hallmark" target="_blank" rel="noreferrer">
            Hallmark
          </a>{' '}
          (MIT licence).
        </footer>
      </div>
    </div>
  );
}
