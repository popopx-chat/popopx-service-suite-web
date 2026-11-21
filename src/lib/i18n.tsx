"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Multi-language switch engine.
 *
 * The language set is **identical to the POPOPX iOS client's declared
 * localizations**: `CFBundleLocalizations` in
 * `apps/ios/POPOPX--iOS--Info.plist` lists exactly these 18 tags, in this order,
 * and the app builds one `.lproj` per tag. So the portal offers the same 18
 * languages as the phone, in the same order, and never a subset.
 *
 * Rules this file implements:
 *  - Default locale is `zh-Hans` (Simplified Chinese). The server pass and the
 *    first client pass must paint the *same* string, so detection only ever
 *    happens inside `useEffect` — a render-time `navigator` read would be a
 *    hydration mismatch.
 *  - `Localized<T>` is a **total** map: TypeScript only compiles when every copy
 *    slot exists in all 18 languages. That is the build-time proof that no
 *    visitor silently falls back to another language.
 *  - The visitor's choice persists to `localStorage` under `popopx.locale` and
 *    wins over browser detection on the next visit.
 *  - `document.documentElement.lang` follows the active locale, and `dir` is set
 *    for right-to-left candidates (none of the 18 is RTL, so it stays `ltr` —
 *    see `isRightToLeft`).
 *  - Nothing here fetches: copy lives inside each component, so switching is a
 *    pure re-render — no reload, no route change, no network round trip.
 */

export const LOCALES = [
  "en",
  "ru",
  "de",
  "fr",
  "it",
  "nl",
  "cs",
  "zh-Hans",
  "zh-Hant",
  "es",
  "pl",
  "ja",
  "th",
  "fi",
  "uk",
  "bg",
  "tr",
  "hu",
] as const;

export type Locale = (typeof LOCALES)[number];

/** A copy value that must exist in all 18 languages the iOS client ships. */
export type Localized<T = string> = Record<Locale, T>;

export const STORAGE_KEY = "popopx.locale";

/**
 * Endonyms — each language shown in its own script, the way the iOS client's
 * language list does, so a visitor finds their language without knowing English.
 */
export const LOCALE_NATIVE: Record<Locale, string> = {
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  cs: "Čeština",
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  es: "Español",
  pl: "Polski",
  ja: "日本語",
  th: "ไทย",
  fi: "Suomi",
  uk: "Українська",
  bg: "Български",
  tr: "Türkçe",
  hu: "Magyar",
};

/**
 * Full display names. Same values as `LOCALE_NATIVE`: the language list follows
 * the iOS client and names every language in its own script.
 */
export const LOCALE_NAME: Record<Locale, string> = LOCALE_NATIVE;

/** Short codes for the compact capsule (max 3 characters, script-safe). */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  de: "DE",
  fr: "FR",
  it: "IT",
  nl: "NL",
  cs: "CS",
  "zh-Hans": "简",
  "zh-Hant": "繁",
  es: "ES",
  pl: "PL",
  ja: "JA",
  th: "TH",
  fi: "FI",
  uk: "UK",
  bg: "BG",
  tr: "TR",
  hu: "HU",
};

/** `lang` attribute values, i.e. the BCP 47 form of each tag. */
export const HTML_LANG: Record<Locale, string> = {
  en: "en",
  ru: "ru",
  de: "de",
  fr: "fr",
  it: "it",
  nl: "nl",
  cs: "cs",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hant",
  es: "es",
  pl: "pl",
  ja: "ja",
  th: "th",
  fi: "fi",
  uk: "uk",
  bg: "bg",
  tr: "tr",
  hu: "hu",
};

export const DEFAULT_LOCALE: Locale = "zh-Hans";

/**
 * Fallback order used by `pick` when a slot is somehow absent at runtime:
 * the requested language, then English, then the default. Typing already
 * requires all 18, so this is defence-in-depth for data read from storage.
 */
const FALLBACK_CHAIN: readonly Locale[] = ["en", DEFAULT_LOCALE];

export const LOCALE_COUNT: number = LOCALES.length;

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * None of the 18 shipped localizations is right-to-left, so the document stays
 * `ltr`. The helper exists because adding an RTL language to the list must be a
 * deliberate, checked change rather than an accident.
 */
export function isRightToLeft(locale: Locale): boolean {
  return (["ar", "he", "fa", "ur"] as readonly string[]).includes(locale);
}

/**
 * Browser language detection mapped onto the 18 supported tags.
 *
 * `zh-TW` / `zh-HK` / `zh-MO` / `zh-Hant` map to Traditional Chinese, any other
 * `zh-*` to Simplified. An unrecognised browser language keeps the default
 * (`zh-Hans`), which is what the first paint renders too.
 */
export function detectLocale(candidates: readonly string[] = []): Locale {
  for (const raw of candidates) {
    if (typeof raw !== "string" || raw.length === 0) {
      continue;
    }
    const tag = raw.toLowerCase().replace(/_/g, "-");
    if (tag.startsWith("zh")) {
      return /-(hk|mo|tw)|hant/.test(tag) ? "zh-Hant" : "zh-Hans";
    }
    const primary = tag.split("-")[0];
    if (isLocale(primary)) {
      return primary;
    }
    if (isLocale(tag)) {
      return tag;
    }
  }
  return DEFAULT_LOCALE;
}

function browserCandidates(): string[] {
  if (typeof navigator === "undefined") {
    return [];
  }
  return [navigator.language, ...(navigator.languages ?? [])];
}

/**
 * Resolve a copy slot for the active locale.
 *
 * Accepts either a plain string (already locale-free, e.g. `POPOPX`,
 * `AGPL-3.0-only`, a shell command) or a `Localized` object, so component copy
 * can mix the two freely.
 */
export function pick<T>(value: Localized<T> | T, locale: Locale): T {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const dict = value as Partial<Record<Locale, T>>;
    const found = dict[locale];
    if (found !== undefined) {
      return found;
    }
    for (const fallback of FALLBACK_CHAIN) {
      const alt = dict[fallback];
      if (alt !== undefined) {
        return alt;
      }
    }
  }
  return value as T;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => undefined,
});

export function LocaleProvider({ children }: { children: ReactNode }): ReactElement {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private mode / storage disabled: browser detection still applies.
      stored = null;
    }
    setLocaleState(isLocale(stored) ? stored : detectLocale(browserCandidates()));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = HTML_LANG[locale];
    root.dir = isRightToLeft(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistence is best-effort; the switch itself already happened.
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Active locale plus the setter used by the navbar language menu. */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}

/** Bind a `Localized` copy object to the active locale. */
export function useCopy<T>(value: Localized<T> | T): T {
  const { locale } = useLocale();
  return pick(value, locale);
}
