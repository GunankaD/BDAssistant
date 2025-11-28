// src/hooks/useTranslate.ts
import { useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../context/LanguageContext';
import * as Translator from '../i18n/translator';

/**
 * useTranslate
 *
 * - t(text, values) -> Promise<string>    // async translate (guaranteed)
 * - tSync(text, values) -> string | null  // fast in-memory cached value or null if not available
 * - prefetch(texts) -> Promise<void>
 *
 * Note: persistent cache (AsyncStorage) is used by translator.ts, but tSync reads from in-memory cache
 * which is populated on-demand when translations are fetched with t() or prefetch().
 */

type Values = Record<string, any> | undefined;

export default function useTranslate() {
  const { lang } = useLanguage();

  // in-memory cache: key = `${lang}:${text}` -> translated string
  // useRef so it survives re-renders without causing updates
  const cacheRef = useRef<Map<string, string>>(new Map());

  // optionally hydrate some cached translations from AsyncStorage for common keys
  // (keep this minimal to avoid heavy work on app load)
  useEffect(() => {
    // clear in-memory cache when language changes to avoid stale entries
    cacheRef.current = new Map();
  }, [lang]);

  const makeKey = useCallback((language: string, text: string) => `${language}:${text}`, []);

  // async translate wrapper (uses LanguageContext.translate under the hood)
  const t = useCallback(
    async (text: string, values?: Values): Promise<string> => {
      if (!text) return '';
      try {
        const translated = await Translator.translate(text, lang, values);
        // update in-memory cache
        try {
          const k = makeKey(lang, text);
          cacheRef.current.set(k, translated);
        } catch {}
        return translated;
      } catch {
        // fallback: inject values into english text
        if (!values) return text;
        return text.replace(/{{\s*([^}]+?)\s*}}/g, (m, p1) =>
          Object.prototype.hasOwnProperty.call(values, p1.trim()) ? String(values[p1.trim()]) : m
        );
      }
    },
    [lang, makeKey]
  );

  // synchronous cache read (fast). Returns null if not cached.
  const tSync = useCallback(
    (text: string, values?: Values): string | null => {
      if (!text) return '';
      const k = makeKey(lang, text);
      const cached = cacheRef.current.get(k);
      if (cached !== undefined) {
        // if values provided, we assume translator output still contains placeholders already restored
        return cached;
      }
      // if target language is english, immediately return injected english
      if (lang === 'en') {
        if (!values) return text;
        return text.replace(/{{\s*([^}]+?)\s*}}/g, (m, p1) =>
          Object.prototype.hasOwnProperty.call(values, p1.trim()) ? String(values[p1.trim()]) : m
        );
      }
      return null;
    },
    [lang, makeKey]
  );

  // prefetch texts into cache using translator.translateBatch
  const prefetch = useCallback(
    async (texts: string[]) => {
      if (!texts || texts.length === 0) return;
      try {
        const map = await Translator.translateBatch(texts, lang);
        // map: original -> translated
        for (const [orig, translated] of Object.entries(map)) {
          const k = makeKey(lang, orig);
          cacheRef.current.set(k, translated);
        }
      } catch {
        // ignore
      }
    },
    [lang, makeKey]
  );

  // optional helper to hydrate specific text from AsyncStorage if exists (not called automatically)
  const hydrateFromStorage = useCallback(
    async (text: string) => {
      try {
        const storeKey = `tr:${lang}:${text}`;
        const raw = await AsyncStorage.getItem(storeKey);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && parsed.v) {
          const k = makeKey(lang, text);
          cacheRef.current.set(k, parsed.v);
        }
      } catch {
        // ignore
      }
    },
    [lang, makeKey]
  );

  return { t, tSync, prefetch, hydrateFromStorage };
}
