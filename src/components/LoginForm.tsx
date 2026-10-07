import { useState, type FormEvent } from 'react';
import type { Lang, TFunction } from '../i18n';
import type { Theme } from '../hooks/useTheme';
import type { Credentials } from '../types';
import LangSwitch from './LangSwitch';
import ThemeToggle from './ThemeToggle';

interface Props {
  onConnect: (credentials: Credentials) => void | Promise<void>;
  /** Enters the built-in demo mode (seeded chats, simulated replies). */
  onDemo: () => void;
  busy: boolean;
  error: string | null;
  theme: Theme;
  onToggleTheme: () => void;
  lang: Lang;
  onSetLang: (lang: Lang) => void;
  t: TFunction;
}

export default function LoginForm({
  onConnect,
  onDemo,
  busy,
  error,
  theme,
  onToggleTheme,
  lang,
  onSetLang,
  t,
}: Props) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');

  const canSubmit = idInstance.trim().length > 0 && apiTokenInstance.trim().length > 0 && !busy;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    void onConnect({
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
    });
  };

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card-top">
          <div className="login-logo">MAX</div>
          <div className="login-card-actions">
            <LangSwitch lang={lang} onChange={onSetLang} label={t('lang.label')} />
            <ThemeToggle theme={theme} onToggle={onToggleTheme} t={t} variant="switch" />
          </div>
        </div>

        <h1>{t('login.title')}</h1>
        <p className="login-hint">
          {t('login.hint')}{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            {t('login.console')}
          </a>
        </p>

        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            placeholder="3100000000"
            autoComplete="off"
            inputMode="numeric"
            autoFocus
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
            placeholder="apiTokenInstance"
            autoComplete="off"
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {busy ? t('login.connecting') : t('login.connect')}
        </button>

        <button
          type="button"
          className="btn-ghost demo-btn"
          onClick={onDemo}
          disabled={busy}
          title={t('demo.hint')}
        >
          {t('login.demo')}
        </button>
      </form>
    </div>
  );
}
