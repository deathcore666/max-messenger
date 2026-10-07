import { useCallback, useEffect } from 'react';
import { translate, type Lang, type TFunction } from '../i18n';
import { usePersistentState } from './usePersistentState';

const LANG_KEY = 'max-client.lang';

/**
 * UI language persisted in localStorage. `t` is stable for the current
 * language, and `<html lang>` is kept in sync so screen readers and
 * browser translation tools follow the selected language.
 */
export function useI18n(): { lang: Lang; setLang: (lang: Lang) => void; t: TFunction } {
  const [lang, setLangState] = usePersistentState<Lang>(LANG_KEY, 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback<TFunction>(
    (key, params) => translate(lang, key, params),
    [lang],
  );

  const setLang = useCallback((next: Lang) => setLangState(next), [setLangState]);

  return { lang, setLang, t };
}
