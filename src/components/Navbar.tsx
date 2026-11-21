"use client";

import { useEffect, useState, type ReactElement } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { LanguageMenu } from "@/components/LanguageMenu";
import { NAV_SECTIONS, REPO_URL, type NavSectionId } from "@/lib/site";

/**
 * Global sticky navbar.
 *
 * Honest constraints this file keeps:
 *  - Every link is a plain `#hash` jump: no router, no history API, no scroll
 *    listener. The portal is one anchored page, so the browser does the work.
 *  - There is deliberately no active-section highlight. A highlighted link would
 *    have to be computed from an IntersectionObserver over the section elements
 *    and this bar does not run one, so it never claims a current section.
 *  - The only image is the same-origin official logo. No webfont, no icon font,
 *    no CDN: the GitHub, menu and chevron glyphs are inline SVG.
 *  - Copy is authored in all 18 locales the engine declares and typed as a total
 *    `Localized<string>` map, so the compiler rejects a missing variant.
 *  - The language control is `LanguageMenu`, which lists the same 18 locales as
 *    the iOS client. A three-segment capsule cannot hold 18 options without
 *    overflowing, so it is not used here.
 */

const SECTION_LABELS: Record<NavSectionId, Localized<string>> = {
  features: {
    en: "Core features",
    ru: "Основные возможности",
    de: "Kernfunktionen",
    fr: "Fonctionnalités clés",
    it: "Funzionalità principali",
    nl: "Kernfuncties",
    cs: "Hlavní funkce",
    "zh-Hans": "核心特点",
    "zh-Hant": "核心特點",
    es: "Funciones principales",
    pl: "Funkcje główne",
    ja: "中核機能",
    th: "ฟีเจอร์หลัก",
    fi: "Keskeiset ominaisuudet",
    uk: "Основні можливості",
    bg: "Основни възможности",
    tr: "Temel özellikler",
    hu: "Alapfunkciók",
  },
  architecture: {
    en: "Dual-core architecture",
    ru: "Двухъядерная архитектура",
    de: "Zwei-Kern-Architektur",
    fr: "Architecture à double cœur",
    it: "Architettura a doppio core",
    nl: "Dual-core-architectuur",
    cs: "Dvojjaderná architektura",
    "zh-Hans": "双核架构",
    "zh-Hant": "雙核架構",
    es: "Arquitectura de doble núcleo",
    pl: "Architektura dwurdzeniowa",
    ja: "デュアルコア設計",
    th: "สถาปัตยกรรมสองแกน",
    fi: "Kaksisydäinarkkitehtuuri",
    uk: "Двосядерна архітектура",
    bg: "Двойоядрена архитектура",
    tr: "Çift çekirdekli mimari",
    hu: "Kétmagos architektúra",
  },
  plugins: {
    en: "Five built-in plugins",
    ru: "Пять встроенных плагинов",
    de: "Fünf integrierte Plugins",
    fr: "Cinq extensions intégrées",
    it: "Cinque plugin integrati",
    nl: "Vijf ingebouwde plug-ins",
    cs: "Pět vestavěných pluginů",
    "zh-Hans": "五大扩展插件",
    "zh-Hant": "五大擴充插件",
    es: "Cinco complementos integrados",
    pl: "Pięć wbudowanych wtyczek",
    ja: "5つの拡張プラグイン",
    th: "ปลั๊กอินในตัว 5 ตัว",
    fi: "Viisi sisäänrakennettua lisäosaa",
    uk: "П’ять вбудованих плагінів",
    bg: "Пет вградени плъгина",
    tr: "Beş yerleşik eklenti",
    hu: "Öt beépített bővítmény",
  },
  sandbox: {
    en: "Interactive sandbox",
    ru: "Интерактивная песочница",
    de: "Interaktive Sandbox",
    fr: "Bac à sable interactif",
    it: "Sandbox interattivo",
    nl: "Interactieve sandbox",
    cs: "Interaktivní pískoviště",
    "zh-Hans": "互动体验沙盒",
    "zh-Hant": "互動體驗沙盒",
    es: "Entorno de pruebas interactivo",
    pl: "Interaktywna piaskownica",
    ja: "インタラクティブ沙盒",
    th: "แซนด์บ็อกซ์เชิงโต้ตอบ",
    fi: "Interaktiivinen hiekkalaatikko",
    uk: "Інтерактивна пісочниця",
    bg: "Интерактивна пясъчница",
    tr: "Etkileşimli kum havuzu",
    hu: "Interaktív homokozó",
  },
  install: {
    en: "Install and usage guide",
    ru: "Установка и использование",
    de: "Installation und Nutzung",
    fr: "Installation et utilisation",
    it: "Installazione e uso",
    nl: "Installatie en gebruik",
    cs: "Instalace a použití",
    "zh-Hans": "安装与操作指南",
    "zh-Hant": "安裝與操作指南",
    es: "Instalación y uso",
    pl: "Instalacja i użycie",
    ja: "インストールと使い方",
    th: "การติดตั้งและวิธีใช้",
    fi: "Asennus ja käyttö",
    uk: "Встановлення та використання",
    bg: "Инсталация и употреба",
    tr: "Kurulum ve kullanım",
    hu: "Telepítés és használat",
  },
  directory: {
    en: "Open protocols and directory",
    ru: "Открытые протоколы и каталог",
    de: "Offene Protokolle und Verzeichnis",
    fr: "Protocoles ouverts et annuaire",
    it: "Protocolli aperti e directory",
    nl: "Open protocollen en catalogus",
    cs: "Otevřené protokoly a adresář",
    "zh-Hans": "开放协议与目录",
    "zh-Hant": "開放協定與目錄",
    es: "Protocolos abiertos y directorio",
    pl: "Otwarte protokoły i katalog",
    ja: "オープンプロトコルとカタログ",
    th: "โปรโตคอลเปิดและไดเรกทอรี",
    fi: "Avoimet protokollat ja hakemisto",
    uk: "Відкриті протоколи та каталог",
    bg: "Отворени протоколи и указател",
    tr: "Açık protokoller ve dizin",
    hu: "Nyílt protokollok és könyvtár",
  },
};

type CopyKey =
  | "navRegion"
  | "github"
  | "menuOpen"
  | "menuClose"
  | "panelSections"
  | "panelActions"
  | "cta";

const COPY: Record<CopyKey, Localized<string>> = {
  navRegion: {
    en: "Main navigation",
    ru: "Основная навигация",
    de: "Hauptnavigation",
    fr: "Navigation principale",
    it: "Navigazione principale",
    nl: "Hoofdnavigatie",
    cs: "Hlavní navigace",
    "zh-Hans": "主导航",
    "zh-Hant": "主導覽",
    es: "Navegación principal",
    pl: "Nawigacja główna",
    ja: "メインナビゲーション",
    th: "การนำทางหลัก",
    fi: "Päänavigointi",
    uk: "Основна навігація",
    bg: "Основна навигация",
    tr: "Ana gezinme",
    hu: "Fő navigáció",
  },
  github: {
    en: "View the backend suite source on GitHub",
    ru: "Исходники серверного пакета на GitHub",
    de: "Backend-Quellcode auf GitHub ansehen",
    fr: "Voir le code du backend sur GitHub",
    it: "Consulta il sorgente del backend su GitHub",
    nl: "Backend-broncode op GitHub bekijken",
    cs: "Zdrojáky backendu na GitHubu",
    "zh-Hans": "在 GitHub 上查看后端套件源码",
    "zh-Hant": "在 GitHub 上檢視後端套件原始碼",
    es: "Ver el código del backend en GitHub",
    pl: "Zobacz źródła backendu na GitHubie",
    ja: "GitHub でバックエンド一式のソースを見る",
    th: "ดูซอร์สของแบ็กเอนด์บน GitHub",
    fi: "Näytä backend-paketin lähdekoodi GitHubissa",
    uk: "Переглянути код бекенду на GitHub",
    bg: "Вижте изходния код на бекенда в GitHub",
    tr: "Arka uç paketinin kaynağını GitHub’da görüntüle",
    hu: "A backend csomag forráskódja a GitHubon",
  },
  menuOpen: {
    en: "Open navigation menu",
    ru: "Открыть меню",
    de: "Menü öffnen",
    fr: "Ouvrir le menu",
    it: "Apri il menu",
    nl: "Menu openen",
    cs: "Otevřít nabídku",
    "zh-Hans": "展开导航菜单",
    "zh-Hant": "展開導覽選單",
    es: "Abrir el menú",
    pl: "Otwórz menu",
    ja: "メニューを開く",
    th: "เปิดเมนู",
    fi: "Avaa valikko",
    uk: "Відкрити меню",
    bg: "Отвори менюто",
    tr: "Menüyü aç",
    hu: "Menü megnyitása",
  },
  menuClose: {
    en: "Close navigation menu",
    ru: "Закрыть меню",
    de: "Menü schließen",
    fr: "Fermer le menu",
    it: "Chiudi il menu",
    nl: "Menu sluiten",
    cs: "Zavřít nabídku",
    "zh-Hans": "收起导航菜单",
    "zh-Hant": "收合導覽選單",
    es: "Cerrar el menú",
    pl: "Zamknij menu",
    ja: "メニューを閉じる",
    th: "ปิดเมนู",
    fi: "Sulje valikko",
    uk: "Закрити меню",
    bg: "Затвори менюто",
    tr: "Menüyü kapat",
    hu: "Menü bezárása",
  },
  panelSections: {
    en: "All sections",
    ru: "Все разделы",
    de: "Alle Abschnitte",
    fr: "Toutes les sections",
    it: "Tutte le sezioni",
    nl: "Alle secties",
    cs: "Všechny sekce",
    "zh-Hans": "全部板块",
    "zh-Hant": "全部板塊",
    es: "Todas las secciones",
    pl: "Wszystkie sekcje",
    ja: "すべてのセクション",
    th: "ทุกหมวด",
    fi: "Kaikki osiot",
    uk: "Усі розділи",
    bg: "Всички раздели",
    tr: "Tüm bölümler",
    hu: "Összes szakasz",
  },
  panelActions: {
    en: "Language and actions",
    ru: "Язык и действия",
    de: "Sprache und Aktionen",
    fr: "Langue et actions",
    it: "Lingua e azioni",
    nl: "Taal en acties",
    cs: "Jazyk a akce",
    "zh-Hans": "语言与操作",
    "zh-Hant": "語言與操作",
    es: "Idioma y acciones",
    pl: "Język i działania",
    ja: "言語と操作",
    th: "ภาษาและการดำเนินการ",
    fi: "Kieli ja toiminnot",
    uk: "Мова та дії",
    bg: "Език и действия",
    tr: "Dil ve işlemler",
    hu: "Nyelv és műveletek",
  },
  cta: {
    en: "Deploy a service account",
    ru: "Развернуть сервисный аккаунт",
    de: "Service-Konto bereitstellen",
    fr: "Déployer un compte service",
    it: "Distribuisci un account servizio",
    nl: "Serviceaccount implementeren",
    cs: "Nasadit služební účet",
    "zh-Hans": "立即部署服务号",
    "zh-Hant": "立即部署服務號",
    es: "Desplegar una cuenta de servicio",
    pl: "Wdróż konto serwisowe",
    ja: "サービスアカウントをデプロイ",
    th: "ใช้งานบัญชีบริการ",
    fi: "Ota palvelutili käyttöön",
    uk: "Розгорнути сервісний акаунт",
    bg: "Разгърни сервисен акаунт",
    tr: "Hizmet hesabını dağıt",
    hu: "Szolgáltatásfiók telepítése",
  },
};

/** Shared focus ring for every focusable control in the bar. */
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/70";

/** The GitHub glyph: upstream octicon path, inlined so nothing is fetched. */
function GitHubMark(): ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="currentColor"
      className="h-4 w-4 shrink-0"
    >
      <path d="M6.766 11.328c-2.063-.25-3.516-1.734-3.516-3.656 0-.781.281-1.625.75-2.188-.203-.515-.172-1.609.063-2.062.625-.078 1.468.25 1.968.703.594-.187 1.219-.281 1.985-.281.765 0 1.39.094 1.953.265.484-.437 1.344-.765 1.969-.687.218.422.25 1.515.046 2.047.5.593.766 1.39.766 2.203 0 1.922-1.453 3.375-3.547 3.64.531.344.89 1.094.89 1.954v1.625c0 .468.391.734.86.547C13.781 14.359 16 11.53 16 8.03 16 3.61 12.406 0 7.984 0 3.563 0 0 3.61 0 8.031a7.88 7.88 0 0 0 5.172 7.422c.422.156.828-.125.828-.547v-1.25c-.219.094-.5.156-.75.156-1.031 0-1.64-.562-2.078-1.609-.172-.422-.36-.672-.719-.719-.187-.015-.25-.093-.25-.187 0-.188.313-.328.625-.328.453 0 .844.281 1.25.86.313.452.64.655 1.031.655s.641-.14 1-.5c.266-.265.47-.5.657-.656" />
    </svg>
  );
}

function ChevronMark(): ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function Navbar(): ReactElement {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const regionLabel = useCopy(COPY.navRegion);
  const githubLabel = useCopy(COPY.github);
  const menuLabel = useCopy(open ? COPY.menuClose : COPY.menuOpen);
  const sectionsLabel = useCopy(COPY.panelSections);
  const actionsLabel = useCopy(COPY.panelActions);
  const ctaLabel = useCopy(COPY.cta);

  // Escape closes the small-screen panel. Deliberately no scroll listener: the
  // bar is `position: sticky`, so the browser handles the pinning.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const closePanel = (): void => setOpen(false);

  return (
    <header className="glass sticky top-0 z-50 rounded-none border-x-0 border-t-0 bg-ink/75">
      <nav
        aria-label={regionLabel}
        className="section-wrap flex h-16 items-center justify-between gap-3 sm:gap-4 lg:h-[68px]"
      >
        <a
          href="#top"
          onClick={closePanel}
          className={`flex shrink-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-colors duration-200 hover:bg-white/[0.05] ${FOCUS}`}
        >
          <img
            src="/logo-popopx.png"
            alt="POPOPX"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-brand-ring"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-white">POPOPX</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-faint">
              Service Suite
            </span>
          </span>
        </a>

        <div className="hidden flex-1 items-center justify-center gap-0.5 xl:flex">
          {NAV_SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`rounded-full px-3 py-2 text-[13px] text-mute transition-colors duration-200 hover:bg-white/[0.06] hover:text-white ${FOCUS}`}
            >
              {pick(SECTION_LABELS[section.id], locale)}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={githubLabel}
            className={`hidden h-9 w-9 items-center justify-center rounded-full border border-hair bg-white/[0.04] text-mute transition-colors duration-200 hover:border-hair-strong hover:text-white sm:inline-flex ${FOCUS}`}
          >
            <GitHubMark />
          </a>

          <div className="hidden items-center gap-3 lg:flex">
            <LanguageMenu />
            <a href="#install" className="btn-primary px-4 py-2 text-[13px]">
              {ctaLabel}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="popopx-nav-panel"
            aria-label={menuLabel}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-hair bg-white/[0.04] text-mute transition-colors duration-200 hover:border-hair-strong hover:text-white lg:hidden ${FOCUS}`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-[18px] w-[18px]"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open ? (
        <div
          id="popopx-nav-panel"
          className="animate-rise-in border-t border-hair px-5 pb-5 pt-3 sm:px-8 lg:hidden"
        >
          <div className="glass p-2">
            <p className="eyebrow flex items-center gap-1.5 px-2 pb-1 pt-2">
              <ChevronMark />
              {sectionsLabel}
            </p>
            <ul className="grid gap-0.5">
              {NAV_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={closePanel}
                    className={`flex items-center rounded-xl px-3 py-2.5 text-[14px] text-mute transition-colors duration-200 hover:bg-white/[0.06] hover:text-white ${FOCUS}`}
                  >
                    {pick(SECTION_LABELS[section.id], locale)}
                  </a>
                </li>
              ))}
            </ul>
            <div className="hairline-top mt-2 px-2 pb-1 pt-3">
              <p className="eyebrow mb-2">{actionsLabel}</p>
              <LanguageMenu align="left" compact />
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={githubLabel}
                className={`mt-3 inline-flex h-9 items-center gap-2 rounded-full border border-hair bg-white/[0.04] px-3 text-[12px] text-mute transition-colors duration-200 hover:border-hair-strong hover:text-white ${FOCUS}`}
              >
                <GitHubMark />
                GitHub
              </a>
              <a href="#install" onClick={closePanel} className="btn-primary mt-3 w-full text-[13px]">
                {ctaLabel}
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
