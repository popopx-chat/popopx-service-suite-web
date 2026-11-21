"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import {
  LOCALES,
  LOCALE_COUNT,
  LOCALE_NATIVE,
  LOCALE_SHORT,
  useCopy,
  useLocale,
  type Locale,
  type Localized,
} from "@/lib/i18n";

/**
 * The language picker.
 *
 * It lists exactly `LOCALE_COUNT` (18) languages — the same set the POPOPX iOS
 * client declares in `CFBundleLocalizations` — each labelled in its own script
 * so a visitor never has to read English to find their language. A three-button
 * capsule cannot hold 18 options without overflowing, hence a disclosure menu:
 *
 *  - `aria-haspopup="true"` + `aria-expanded` on the trigger;
 *  - Escape and any outside pointer press close it;
 *  - opening moves focus to the *active* language, and closing returns it to the
 *    trigger, so the keyboard path through the navbar stays sane;
 *  - switching is a pure re-render: no reload, no route change, no fetch.
 */

const MENU_COPY: Record<"languages" | "current" | "choose", Localized<string>> = {
  languages: {
    en: "Languages",
    ru: "Языки",
    de: "Sprachen",
    fr: "Langues",
    it: "Lingue",
    nl: "Talen",
    cs: "Jazyky",
    "zh-Hans": "界面语言",
    "zh-Hant": "介面語言",
    es: "Idiomas",
    pl: "Języki",
    ja: "表示言語",
    th: "ภาษา",
    fi: "Kielet",
    uk: "Мови",
    bg: "Езици",
    tr: "Diller",
    hu: "Nyelvek",
  },
  current: {
    en: "Current language",
    ru: "Текущий язык",
    de: "Aktuelle Sprache",
    fr: "Langue actuelle",
    it: "Lingua attuale",
    nl: "Huidige taal",
    cs: "Aktuální jazyk",
    "zh-Hans": "当前语言",
    "zh-Hant": "目前語言",
    es: "Idioma actual",
    pl: "Bieżący język",
    ja: "現在の言語",
    th: "ภาษาปัจจุบัน",
    fi: "Nykyinen kieli",
    uk: "Поточна мова",
    bg: "Текущ език",
    tr: "Geçerli dil",
    hu: "Jelenlegi nyelv",
  },
  choose: {
    en: "Switch interface language",
    ru: "Изменить язык интерфейса",
    de: "Oberflächensprache wechseln",
    fr: "Changer la langue de l’interface",
    it: "Cambia la lingua dell’interfaccia",
    nl: "Weergavetaal wijzigen",
    cs: "Změnit jazyk rozhraní",
    "zh-Hans": "切换界面语言",
    "zh-Hant": "切換介面語言",
    es: "Cambiar el idioma de la interfaz",
    pl: "Zmień język interfejsu",
    ja: "表示言語を切り替える",
    th: "เปลี่ยนภาษาอินเทอร์เฟซ",
    fi: "Vaihda käyttöliittymän kieli",
    uk: "Змінити мову інтерфейсу",
    bg: "Смяна на езика на интерфейса",
    tr: "Arayüz dilini değiştir",
    hu: "Felhasználói felület nyelvének váltása",
  },
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/70";

function GlobeMark(): ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="h-4 w-4 shrink-0 text-brand-soft"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.6 3.9 5.7 3.9 9s-1.3 6.4-3.9 9c-2.6-2.6-3.9-5.7-3.9-9S9.4 5.6 12 3z" />
    </svg>
  );
}

function CheckMark(): ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 text-mesh-soft"
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export function LanguageMenu({
  align = "right",
  compact = false,
}: {
  align?: "left" | "right";
  compact?: boolean;
}): ReactElement {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const title = useCopy(MENU_COPY.choose);
  const groupLabel = useCopy(MENU_COPY.languages);
  const currentLabel = useCopy(MENU_COPY.current);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    // Move the keyboard to the language already in use, so Enter/Escape from
    // here behaves the way a native menu does.
    const active = listRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]');
    active?.focus();

    function onPointerDown(event: PointerEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        close(true);
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const choose = (next: Locale): void => {
    setLocale(next);
    close(true);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close(true) : setOpen(true))}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={title}
        title={`${title} · ${LOCALE_COUNT}`}
        className={`inline-flex items-center gap-2 rounded-full border border-hair bg-white/[0.05] px-3 py-2 text-[12px] font-medium text-mute transition-colors duration-200 hover:border-brand/50 hover:text-white ${FOCUS} ${
          compact ? "w-full justify-center" : ""
        }`}
      >
        <GlobeMark />
        <span className="truncate">{LOCALE_NATIVE[locale]}</span>
        <span className="rounded-full border border-hair px-1.5 py-0.5 text-[10px] leading-none text-faint">
          {LOCALE_SHORT[locale]} · {LOCALE_COUNT}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="group"
          aria-label={groupLabel}
          className={`glass animate-rise-in absolute z-50 mt-2 w-[min(92vw,420px)] p-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <p className="eyebrow px-2 pb-1 pt-1.5">
            {groupLabel} · {LOCALE_COUNT}
          </p>
          <div
            ref={listRef}
            className="grid max-h-[52vh] grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3"
          >
            {LOCALES.map((code) => {
              const active = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  data-active={active ? "true" : "false"}
                  onClick={() => choose(code)}
                  aria-pressed={active}
                  aria-label={`${LOCALE_NATIVE[code]}${active ? ` · ${currentLabel}` : ""}`}
                  className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-[12.5px] leading-tight transition-colors duration-150 ${FOCUS} ${
                    active
                      ? "border-brand/60 bg-brand/25 text-white"
                      : "border-transparent bg-white/[0.03] text-mute hover:border-hair-strong hover:text-white"
                  }`}
                >
                  <span className="truncate">{LOCALE_NATIVE[code]}</span>
                  {active ? <CheckMark /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
