// src/context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Translator from '../i18n/translator';

const LANG_PERSIST_KEY = 'user_lang';
const DEFAULT_LANG = 'en';

export type LangCode = 'en' | 'hi' | 'kn' | string;

type TranslateValues = Record<string, any> | undefined;

type LanguageContextType = {
  lang: LangCode;
  initializing: boolean;
  setLang: (l: LangCode) => Promise<void>;
  translate: (text: string, values?: TranslateValues) => Promise<string>;
  prefetch: (texts: string[], targetLang?: LangCode) => Promise<void>;
  clearCache: () => Promise<void>;
  options: { code: LangCode; label: string }[];
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLang?: LangCode }> = ({
  children,
  initialLang,
}) => {
  const [lang, setLangState] = useState<LangCode>(initialLang ?? DEFAULT_LANG);
  const [initializing, setInitializing] = useState<boolean>(true);

  // language options shown in UI (edit labels if you want)
  const options = useMemo(
    () => [
      { code: 'en', label: 'English' },
      { code: 'hi', label: 'हिन्दी' },
      { code: 'kn', label: 'ಕನ್ನಡ' },
      // add more as needed
    ],
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const persisted = await AsyncStorage.getItem(LANG_PERSIST_KEY);
        if (persisted) setLangState(persisted);
      } catch (e) {
        // ignore and keep default
      } finally {
        setInitializing(false);
      }
    })();
  }, []);

  // set language (persist + optionally prefetch common strings)
  async function setLang(newLang: LangCode) {
    try {
      await AsyncStorage.setItem(LANG_PERSIST_KEY, newLang);
      setLangState(newLang);
      // optional: prefetch very common UI strings to avoid first-run lag
      // await Translator.translateBatch(['Welcome','Save','Cancel'], newLang);
    } catch (e) {
      // ignore persistence failure but still set in state
      setLangState(newLang);
    }
  }

  // async translate using translator module; ensures fallback when translator fails
  async function translate(text: string, values?: TranslateValues) {
    try {
      return await Translator.translate(text, lang, values);
    } catch (e) {
      // fallback: inject values into english string
      if (!text) return text;
      if (!values) return text;
      return text.replace(/{{\s*([^}]+?)\s*}}/g, (match, p1) => {
        const key = p1.trim();
        return Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match;
      });
    }
  }

  // prefetch array of strings (uses translator.translateBatch)
  async function prefetch(texts: string[], targetLang?: LangCode) {
    try {
      const target = targetLang ?? lang;
      await Translator.translateBatch(texts, target);
    } catch {
      // ignore failures
    }
  }

  async function clearCache() {
    try {
      await Translator.clearTranslationCache();
    } catch {
      // ignore
    }
  }

  const value = useMemo(
    () => ({
      lang,
      initializing,
      setLang,
      translate,
      prefetch,
      clearCache,
      options,
    }),
    [lang, initializing, options]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// helper hook
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
