import type { Lang, TFunction } from '../i18n';
import type { Theme } from '../hooks/useTheme';
import type { Chat } from '../types';
import LangSwitch from './LangSwitch';
import ThemeToggle from './ThemeToggle';

interface Props {
  chat: Chat;
  /** Shows the back control (narrow layout, one pane at a time). */
  onBack?: () => void;
  /** Marks the built-in demo mode in the header. */
  demo?: boolean;
  /** Narrow layouts hide the sidebar, so the header carries the switches. */
  lang: Lang;
  onSetLang: (lang: Lang) => void;
  theme: Theme;
  onToggleTheme: () => void;
  t: TFunction;
}

export default function ChatHeader({
  chat,
  onBack,
  demo,
  lang,
  onSetLang,
  theme,
  onToggleTheme,
  t,
}: Props) {
  return (
    <header className="chat-header">
      {/* Only shown on narrow screens, where the sidebar is hidden. */}
      <div className="chat-header-top">
        <button
          type="button"
          className="chat-back"
          onClick={onBack}
          aria-label={t('action.back')}
          title={t('action.back')}
        >
          ‹
        </button>
        <div className="chat-header-controls">
          <LangSwitch lang={lang} onChange={onSetLang} label={t('lang.label')} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} t={t} />
        </div>
      </div>

      <span className="chat-header-title">
        {chat.title}
        {demo && (
          <span className="demo-badge" title={t('demo.hint')}>
            {t('demo.badge')}
          </span>
        )}
      </span>
      <span className="chat-header-subtitle">{t('chat.subtitle', { id: chat.id })}</span>
    </header>
  );
}
