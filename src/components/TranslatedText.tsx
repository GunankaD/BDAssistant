// src/components/TranslatedText.tsx
import React, { useEffect, useState } from 'react';
import { Text, TextProps } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

/**
 * <TranslatedText text="Welcome, {{name}}!" values={{ name: 'Gunanka' }} />
 *
 * - text: English key/string (we use the full English sentence as key for on-the-fly translations)
 * - values: interpolation values to inject after translation (like {name})
 * - fallback: optional fallback string (if you want a different fallback than `text`)
 *
 * Keeps rendering simple: shows the original English immediately while translation loads,
 * then updates once translated text is available. This avoids blank UI.
 */

type Props = TextProps & {
  text: string;
  values?: Record<string, any>;
  fallback?: string;
  prefetch?: boolean; // if true, tells provider to prefetch this string when lang changes
};

export default function TranslatedText({ text, values, fallback, children, prefetch, ...rest }: Props) {
  const { translate, lang, prefetch: doPrefetch } = useLanguage();
  const [display, setDisplay] = useState<string>(() => {
    // immediate render: inject values into english text so UI isn't blank
    if (!values) return text;
    return text.replace(/{{\s*([^}]+?)\s*}}/g, (m, p1) =>
      Object.prototype.hasOwnProperty.call(values, p1.trim()) ? String(values[p1.trim()]) : m
    );
  });

  // prefetch if requested whenever language changes
  useEffect(() => {
    if (prefetch) {
      // fire-and-forget
      doPrefetch([text], lang).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, prefetch]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const t = await translate(text, values);
        if (mounted && typeof t === 'string') setDisplay(t);
      } catch {
        if (mounted) setDisplay(fallback ?? text);
      }
    })();
    return () => {
      mounted = false;
    };
    // we intentionally depend on `text`, `lang`, and JSON.stringify(values)
    // adding explicit dependencies so it re-runs when language or values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, lang, JSON.stringify(values)]);

  // If user passed children, prefer that (rare). Otherwise render translated string.
  return <Text {...rest}>{children ?? display}</Text>;
}
