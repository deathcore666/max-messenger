import { useState, type FormEvent } from 'react';
import type { Lang, TFunction } from '../i18n';
import type { Theme } from '../hooks/useTheme';
import type { ChatSummary } from '../types';
import { errorMessage } from '../api/greenApi';
import LangSwitch from './LangSwitch';
import ThemeToggle from './ThemeToggle';

interface Props {
  chats: ChatSummary[];
  activeChatId: string | null;
  onSelect: (chatId: string) => void;
  /** Creates (or opens) a chat for a phone number. Resolves with an error, or null on success. */
  onNewChat: (phone: string) => Promise<Error | null>;
  onLogout: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  lang: Lang;
  onSetLang: (lang: Lang) => void;
  t: TFunction;
}

const AVATAR_COLORS = ['#0066cc', '#e8590c', '#2f9e44', '#9c36b5', '#0c8599'];

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return '?';
  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    return digits.slice(-2) || '?';
  }
  const letters = trimmed.match(/[A-Za-zА-Яа-яЁё]/g);
  if (letters && letters.length >= 2) {
    return (letters[0] + letters[1]).toUpperCase();
  }
  return trimmed.slice(0, 2);
}

export default function Sidebar({
  chats,
  activeChatId,
  onSelect,
  onNewChat,
  onLogout,
  theme,
  onToggleTheme,
  lang,
  onSetLang,
  t,
}: Props) {
  const [phone, setPhone] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (creating || !phone.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const failure = await onNewChat(phone);
      if (failure) setError(failure);
      else setPhone('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <span className="sidebar-logo">MAX</span>
        <div className="sidebar-actions">
          <LangSwitch lang={lang} onChange={onSetLang} label={t('lang.label')} />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} t={t} />
          <button
            type="button"
            className="btn-ghost btn-logout"
            onClick={onLogout}
            title={t('action.disconnect')}
            aria-label={t('action.disconnect')}
          >
            <span className="logout-icon" aria-hidden="true">
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.5 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h3" />
                <path d="M10.5 11 14 8l-3.5-3" />
                <path d="M14 8H6" />
              </svg>
            </span>
            <span className="logout-text">{t('action.disconnect')}</span>
          </button>
        </div>
      </header>

      <form className="new-chat" onSubmit={handleCreate}>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t('chat.newPlaceholder')}
          inputMode="tel"
          autoComplete="off"
          aria-label={t('chat.newPlaceholder')}
        />
        <button type="submit" className="btn-primary" disabled={creating || !phone.trim()}>
          {creating ? '…' : t('chat.create')}
        </button>
        {error && <div className="form-error">{errorMessage(error, t)}</div>}
      </form>

      <nav className="chat-list">
        {chats.length === 0 && <div className="list-hint">{t('chat.emptyList')}</div>}
        {chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
            onClick={() => onSelect(chat.id)}
          >
            <span className="avatar" style={{ background: avatarColor(chat.id) }}>
              {initials(chat.title)}
            </span>
            <span className="chat-item-body">
              <span className="chat-item-top">
                <span className="chat-item-title">{chat.title}</span>
                {chat.lastTime && <span className="chat-item-time">{chat.lastTime}</span>}
              </span>
              {chat.lastText && <span className="chat-item-preview">{chat.lastText}</span>}
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
