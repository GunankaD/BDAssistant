import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

const inFlight: Map<string, Promise<string>> = new Map();
const DEBUG_TRANSLATE: boolean = true;
const NETWORK_TRANSLATION_ENABLED = false;

/**
 * Translator module (on-the-fly)
 *
 * Usage:
 *   import { translate, translateBatch, setApiConfig } from 'src/i18n/translator';
 *   const txt = await translate("Welcome, {{name}}!", "kn", { name: "Gunanka" });
 *
 * Notes:
 * - Preserve placeholders {{...}} (they are replaced with tokens pre-translate and restored after)
 * - By default uses LibreTranslate public endpoint. Swap API_CONFIG to use Google/Azure (see comments).
 */

// -------------------- Config --------------------
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const DEFAULT_RETRIES = 2;
const DEFAULT_BACKOFF_MS = 500;

// ---------- built-in small fallback translations ----------
const LOCAL_FALLBACKS: Record<string, Record<string, string>> = {
  // keyed by lang -> { "English source": "translation" }
  kn: {
    // Profile badges
    'Farm Manager': 'ಫಾರ್ಮ್ ವ್ಯವಸ್ಥಾಪಕ',
    'Member since {{date}}': '{{date}} ರಿಂದ ಸದಸ್ಯ',

    // Account details section
    'Account details': 'ಖಾತೆ ವಿವರಗಳು',
    'Devices linked': 'ಕನೆಕ್ಟ್ ಮಾಡಿದ ಸಾಧನಗಳು',
    'Last active': 'ಕೊನೆಯ ಕ್ರಿಯಾಶೀಲತೆ',
    'Preferred location': 'ಆಯ್ಕೆ ಮಾಡಿದ ಸ್ಥಳ',
    'Plan': 'ಯೋಜನೆ',
    'Language': 'ಭಾಷೆ',

    // Home screen
    'Dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    'Devices': 'ಸಾಧನಗಳು',
    'View all farm devices (online/offline, last seen)': 'ಎಲ್ಲಾ ಫಾರ್ಮ್ ಸಾಧನಗಳನ್ನು ವೀಕ್ಷಿಸಿ (ಆನ್‌ಲೈನ್/ಆಫ್‌ಲೈನ್, ಕೊನೆಯ ದೃಷ್ಟಿ)',
    'History': 'ಇತಿಹಾಸ',
    'View all bird events (images, sound, time & location)': 'ಎಲ್ಲಾ ಹಕ್ಕಿ ಘಟನೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ (ಚಿತ್ರಗಳು, ಧ್ವನಿ, ಸಮಯ ಮತ್ತು ಸ್ಥಳ)',

    // Device card
    'online': 'ಆನ್‌ಲೈನ್',
    'offline': 'ಆಫ್‌ಲೈನ್',
    'unknown': 'ಅಪರಿಚಿತ',
    'No devices found': 'ಯಾವುದೇ ಸಾಧನಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    'ID: {{id}}': 'ಐಡಿ: {{id}}',
    'Location: {{loc}}': 'ಸ್ಥಳ: {{loc}}',
    'Version: {{ver}}': 'ಆವೃತ್ತಿ: {{ver}}',
    'Last synced: {{time}}': 'ಕೊನೆಯ ಸಿಂಕ್: {{time}}',
  },

  hi: {
    // Profile badges
    'Farm Manager': 'फ़ार्म प्रबंधक',
    'Member since {{date}}': '{{date}} से सदस्य',

    // Account details
    'Account details': 'खाता विवरण',
    'Devices linked': 'जुड़े हुए डिवाइस',
    'Last active': 'अंतिम सक्रियता',
    'Preferred location': 'पसंदीदा स्थान',
    'Plan': 'योजना',
    'Language': 'भाषा',

    // Home screen
    'Dashboard': 'डैशबोर्ड',
    'Devices': 'डिवाइस',
    'View all farm devices (online/offline, last seen)': 'सभी फ़ार्म डिवाइस देखें (ऑनलाइन/ऑफ़लाइन, अंतिम बार देखा गया)',
    'History': 'इतिहास',
    'View all bird events (images, sound, time & location)': 'सभी पक्षी घटनाएँ देखें (छवियाँ, ध्वनि, समय और स्थान)',

    // Device card
    'online': 'ऑनलाइन',
    'offline': 'ऑफ़लाइन',
    'unknown': 'अज्ञात',
    'No devices found': 'कोई डिवाइस नहीं मिला',
    'ID: {{id}}': 'आईडी: {{id}}',
    'Location: {{loc}}': 'स्थान: {{loc}}',
    'Version: {{ver}}': 'संस्करण: {{ver}}',
    'Last synced: {{time}}': 'अंतिम सिंक: {{time}}',
  },
};


type ApiConfig = {
  provider: 'libre' | 'google' | 'azure' | 'custom';
  url: string; // full translate endpoint URL
  apiKey?: string; // if needed (Google/Azure/custom)
  // transform request & parse response if provider non-standard
  requestTransformer?: (opts: { q: string; source: string; target: string }) => { url: string; init: RequestInit };
  responseExtractor?: (resJson: any) => string; // extract translated text from provider response
};

let API_CONFIG: ApiConfig = {
  provider: 'libre',
  url: 'https://libretranslate.com/translate',
};

// allow swapping at runtime (e.g. set to Google with server proxy)
export function setApiConfig(cfg: Partial<ApiConfig>) {
  API_CONFIG = { ...API_CONFIG, ...cfg };
}

// -------------------- Helpers --------------------
function pickDeviceLang() {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) return locales[0].languageCode;
  return 'en';
}

function makeCacheKey(lang: string, text: string) {
  // lightweight stable key
  return `tr:${lang}:${text}`;
}

async function setCache(key: string, value: string, ttl = DEFAULT_TTL_MS) {
  const payload = { v: value, ts: Date.now(), ttl };
  await AsyncStorage.setItem(key, JSON.stringify(payload));
}

async function getCache(key: string) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.ts || !parsed.v) return null;
    if (Date.now() - parsed.ts > (parsed.ttl ?? DEFAULT_TTL_MS)) {
      // expired
      await AsyncStorage.removeItem(key).catch(() => {});
      return null;
    }
    return parsed.v as string;
  } catch {
    return null;
  }
}

// placeholders: replace {{name}} with tokens like __PH_0__, keep mapping
function tokenizePlaceholders(text: string) {
  const regex = /{{\s*([^}]+?)\s*}}/g;
  const tokens: string[] = [];
  const placeholders: string[] = [];
  const tokenized = text.replace(regex, (match, p1) => {
    const idx = placeholders.length;
    placeholders.push(match); // store full "{{name}}"
    const token = `__PH_${idx}__`;
    tokens.push(token);
    return token;
  });
  return { tokenized, placeholders };
}

function restorePlaceholders(text: string, placeholders: string[], values?: Record<string, any>) {
  // restore tokens with either provided values or original placeholder text
  let out = text;
  placeholders.forEach((ph, idx) => {
    const token = `__PH_${idx}__`;
    // try to extract the key inside {{ }}
    const keyMatch = ph.match(/{{\s*([^}]+?)\s*}}/);
    const key = keyMatch ? keyMatch[1].trim() : null;
    let replaceWith = ph; // fallback to original placeholder
    if (key && values && values.hasOwnProperty(key)) replaceWith = String(values[key]);
    // else keep original template (so UI shows {{name}} if not provided)
    out = out.split(token).join(replaceWith);
  });
  return out;
}

function injectValues(text: string, values?: Record<string, any>) {
  if (!values) return text;
  return text.replace(/{{\s*([^}]+?)\s*}}/g, (match, p1) => {
    const key = p1.trim();
    return values.hasOwnProperty(key) ? String(values[key]) : match;
  });
}

// -------------------- Network layer --------------------
async function providerTranslate(q: string, source: string, target: string): Promise<string> {
  if (!NETWORK_TRANSLATION_ENABLED) {
    if (DEBUG_TRANSLATE) console.log('[TRANSLATE] Network translation disabled');
    throw new Error("Network translation disabled");
  }

  // quick defensive: if we have a local fallback for this exact input, use it
  try {
    const rawKey = q;
    if (LOCAL_FALLBACKS[target] && LOCAL_FALLBACKS[target][rawKey]) {
      if (DEBUG_TRANSLATE) console.log('[TRANSLATE] local fallback used', { rawKey, target });
      return LOCAL_FALLBACKS[target][rawKey];
    }
  } catch {}

  if (API_CONFIG.requestTransformer) {
    const { url, init } = API_CONFIG.requestTransformer({ q, source, target });
    try {
      const resp = await fetch(url, init);
      if (DEBUG_TRANSLATE) console.log('[TRANSLATE] custom resp status', resp.status, url);
      const text = await resp.text();
      // try parse, but fallback to text
      try {
        const json: any = JSON.parse(text);
        if (API_CONFIG.responseExtractor) return API_CONFIG.responseExtractor(json);
        if (json && typeof json === 'object') {
          if ('translatedText' in json && typeof json.translatedText === 'string') return json.translatedText;
          if (json.data && Array.isArray(json.data.translations) && json.data.translations[0]?.translatedText) return json.data.translations[0].translatedText;
        }
        return typeof json === 'string' ? json : JSON.stringify(json);
      } catch {
        // not JSON — return raw text (may be HTML error) to be handled upstream
        if (DEBUG_TRANSLATE) console.warn('[TRANSLATE] custom resp not json, raw text:', text.slice(0,200));
        throw new Error('Non-JSON response from custom provider');
      }
    } catch (err) {
      if (DEBUG_TRANSLATE) console.error('[TRANSLATE] custom provider error', err);
      throw err;
    }
  }

  // default libre flow
  if (API_CONFIG.provider === 'libre') {
    try {
      const res = await fetch(API_CONFIG.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, source, target, format: 'text' }),
      });
      if (DEBUG_TRANSLATE) console.log('[TRANSLATE] libre status', res.status, API_CONFIG.url);

      // read raw text first and attempt parse
      const raw = await res.text();

      // If server returned HTML (portal page), raw will start with '<', detect and throw
      if (raw && raw.trim().startsWith('<')) {
        if (DEBUG_TRANSLATE) console.warn('[TRANSLATE] libre returned HTML (probably portal / key required)');
        throw new Error('LibreTranslate returned HTML (likely rate-limited or API-key required)');
      }

      // try parse JSON
      let json: any;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        if (DEBUG_TRANSLATE) console.warn('[TRANSLATE] libre parse failed, raw:', raw.slice(0,200));
        throw new Error('Unexpected translate response (invalid JSON)');
      }

      if (json && typeof json === 'object' && typeof json.translatedText === 'string') return json.translatedText;
      // some instances might return string directly in a 'result' field or others, try common shapes
      if (typeof json === 'string') return json;
      if (json && json.result && typeof json.result === 'string') return json.result;
      if (json && json.data && Array.isArray(json.data.translations) && json.data.translations[0]?.translatedText) return json.data.translations[0].translatedText;

      throw new Error('Unexpected translate response: ' + JSON.stringify(json));
    } catch (err) {
      if (DEBUG_TRANSLATE) console.error('[TRANSLATE] libre error', err);
      throw err;
    }
  }

  throw new Error('API provider not configured properly - set requestTransformer for this provider');
}



async function safeTranslateNetwork(q: string, source: string, target: string, retries = DEFAULT_RETRIES) {
  let attempt = 0;
  let backoff = DEFAULT_BACKOFF_MS;
  while (attempt <= retries) {
    try {
      return await providerTranslate(q, source, target);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, backoff));
      backoff *= 2;
      attempt++;
    }
  }
  throw new Error('translation failed');
}

// -------------------- Public API --------------------

/**
 * Translate a single string (with optional interpolation values).
 * - text: English base text containing optional {{keys}}
 * - targetLang: 'hi' | 'kn' | 'en' etc.
 * - values: optional object to replace interpolation after translation (preferred)
 */
export async function translate(text: string, targetLang?: string, values?: Record<string, any>) {
  if (!text) return text;
  const target = targetLang ?? pickDeviceLang() ?? 'en';
  // 1) If English, return English (still allow {{values}})
  if (target === 'en') {
    return injectValues(text, values);
  }

  // 2) If network translation disabled -> immediately try local fallback
  if (!NETWORK_TRANSLATION_ENABLED) {
    if (DEBUG_TRANSLATE) console.log('[TRANSLATE] Network translation disabled. Using LOCAL_FALLBACKS');
    // Use LOCAL_FALLBACKS if available
    if (LOCAL_FALLBACKS[target] && LOCAL_FALLBACKS[target][text]) {
      return injectValues(LOCAL_FALLBACKS[target][text], values);
    }

    // No local translation → just return English with values
    return injectValues(text, values);
  }
    
  const cacheKey = makeCacheKey(target, text);
  const cached = await getCache(cacheKey);
  if (cached) {
    return restorePlaceholders(cached, tokenizePlaceholders(text).placeholders, values);
  }

  // If there's already an in-flight request for this exact cacheKey, reuse it
  const inflightKey = cacheKey;
  if (inFlight.has(inflightKey)) {
    try {
      const result = await inFlight.get(inflightKey)!;
      return restorePlaceholders(result, tokenizePlaceholders(text).placeholders, values);
    } catch {
      // fallthrough to attempt new request
    }
  }

  // create promise, store in inFlight, and make sure to clear it once done
  const promise = (async () => {
    const { tokenized, placeholders } = tokenizePlaceholders(text);
    try {
      const translated = await safeTranslateNetwork(tokenized, 'en', target);
      await setCache(cacheKey, translated, DEFAULT_TTL_MS);
      return translated;
    } catch (err) {
      throw err;
    } finally {
      // nothing here; resolved value is returned to callers
    }
  })();

  inFlight.set(inflightKey, promise);

  try {
    const translated = await promise;
    inFlight.delete(inflightKey);
    const withPlaceholders = restorePlaceholders(translated, tokenizePlaceholders(text).placeholders, values);
    return withPlaceholders;
  } catch (err) {
    inFlight.delete(inflightKey);
    // fallback
    return injectValues(text, values);
  }
}

/**
 * Translate a batch of strings (deduplicates and caches) - returns map original->translated
 * Useful to prefetch common screen strings.
 * - texts: string[]
 * - targetLang: 'hi', 'kn', ...
 */
export async function translateBatch(texts: string[], targetLang?: string) {
  const target = targetLang ?? pickDeviceLang() ?? 'en';
  if (target === 'en') {
    return Object.fromEntries(texts.map(t => [t, t]));
  }

  // dedupe
  const uniq = Array.from(new Set(texts));
  const results: Record<string, string> = {};

  // prepare network work: only translate keys not in cache
  const toFetch: { original: string; tokenized: string; placeholders: string[] }[] = [];
  for (const t of uniq) {
    const ck = makeCacheKey(target, t);
    // eslint-disable-next-line no-await-in-loop
    const c = await getCache(ck);
    if (c) {
      const placeholders = tokenizePlaceholders(t).placeholders;
      results[t] = restorePlaceholders(c, placeholders);
    } else {
      const { tokenized, placeholders } = tokenizePlaceholders(t);
      toFetch.push({ original: t, tokenized, placeholders });
    }
  }

  // fetch translations one-by-one (could be parallel but avoid API throttling)
  for (const item of toFetch) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const translated = await safeTranslateNetwork(item.tokenized, 'en', target);
      const ck = makeCacheKey(target, item.original);
      // eslint-disable-next-line no-await-in-loop
      await setCache(ck, translated, DEFAULT_TTL_MS);
      results[item.original] = restorePlaceholders(translated, item.placeholders);
    } catch {
      // fallback to english
      results[item.original] = item.original;
    }
  }

  return results;
}

/**
 * Clear translation cache (useful in dev or when switching providers)
 */
export async function clearTranslationCache() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const keys = allKeys.filter(k => k.startsWith('tr:'));
    if (keys.length) await AsyncStorage.multiRemove(keys);
  } catch (e) {
    // ignore
  }
}

// export for tests or advanced usage
export default {
  translate,
  translateBatch,
  clearTranslationCache,
  setApiConfig,
};