import type { TFunction } from '../i18n';
import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
  onToggle: () => void;
  /** Translator for the control's tooltip and accessible name. */
  t: TFunction;
  /** "switch" shows a labelled on/off control (login screen), "icon" a compact button (sidebar). */
  variant?: 'icon' | 'switch';
}

export default function ThemeToggle({ theme, onToggle, t, variant = 'icon' }: Props) {
  const isDark = theme === 'dark';
  const title = t(isDark ? 'theme.toLight' : 'theme.toDark');

  if (variant === 'switch') {
    return (
      <label className="theme-switch" title={title}>
        <span className="theme-switch-label">{t('theme.label')}</span>
        <input
          type="checkbox"
          role="switch"
          checked={isDark}
          onChange={onToggle}
          aria-label={t('theme.label')}
        />
        <span className="theme-switch-track" aria-hidden="true">
          <span className="theme-switch-knob" />
        </span>
      </label>
    );
  }

  return (
    <button
      type="button"
      className="btn-ghost theme-toggle"
      onClick={onToggle}
      title={title}
      aria-label={title}
      aria-pressed={isDark}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
