import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lang, T, LANGUAGE_META, langSettings } from '../utils/i18n';

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: T;
  rtl: boolean;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(langSettings.get());

  const setLang = useCallback((l: Lang) => {
    langSettings.set(l);
    setLangState(l);
  }, []);

  const t = langSettings.t();
  const rtl = LANGUAGE_META[lang].rtl;

  return <Ctx.Provider value={{ lang, setLang, t, rtl }}>{children}</Ctx.Provider>;
}

export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}
