import { LANGS, type Lang } from '../i18n';

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
  label: string;
}

/** Segmented EN | RU control used on every screen. */
export default function LangSwitch({ lang, onChange, label }: Props) {
  return (
    <div className="lang-switch" role="group" aria-label={label}>
      {LANGS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={option.code === lang ? 'active' : undefined}
          onClick={() => onChange(option.code)}
          aria-pressed={option.code === lang}
          title={option.code.toUpperCase()}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
