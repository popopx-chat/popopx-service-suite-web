"use client";

import { useEffect, useState, type ReactElement } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { LanguageMenu } from "@/components/LanguageMenu";
import {
  BOT_STUDIO_URL,
  MAIN_SITE_URL,
  NAV_SECTIONS,
  NODE_PORTAL_URL,
  REPO_URL,
  type NavSectionId,
} from "@/lib/site";

/**
 * Global sticky navbar.
 *
 * Honest constraints this file keeps:
 *  - Every internal link is a plain `#hash` jump: no router, no history API, no
 *    scroll listener. The portal is one anchored page, so the browser does the work.
 *  - There is deliberately no active-section highlight. A highlighted link would
 *    have to be computed from an IntersectionObserver over the section elements
 *    and this bar does not run one, so it never claims a current section.
 *  - The only image is the same-origin official logo. No webfont, no icon font,
 *    no CDN: the GitHub, menu, chevron and outbound glyphs are inline SVG.
 *  - The ecosystem and GitHub links are *navigation* to another origin. The bar
 *    loads nothing from there, which is what the zero-third-party-asset promise
 *    rests on, and each host was probed live before being published here.
 *  - Copy is authored in all 18 locales the engine declares and typed as a total
 *    `Localized<string>` map, so the compiler rejects a missing variant.
 *  - The language control is `LanguageMenu`, which lists the same 18 locales as
 *    the iOS client. A three-segment capsule cannot hold 18 options without
 *    overflowing, so it is not used here.
 */

const SECTION_LABELS: Record<NavSectionId, Localized<string>> = {
  overview: {
    en: "Overview",
    ru: "Обзор",
    de: "Überblick",
    fr: "Aperçu",
    it: "Panoramica",
    nl: "Overzicht",
    cs: "Přehled",
    "zh-Hans": "概览",
    "zh-Hant": "概覽",
    es: "Resumen",
    pl: "Omówienie",
    ja: "概要",
    th: "ภาพรวม",
    fi: "Yleiskatsaus",
    uk: "Огляд",
    bg: "Преглед",
    tr: "Genel bakış",
    hu: "Áttekintés",
  },
  plugins: {
    en: "Services & connectors",
    ru: "Сервисы и коннекторы",
    de: "Dienste & Konnektoren",
    fr: "Services et connecteurs",
    it: "Servizi e connettori",
    nl: "Services en connectors",
    cs: "Služby a konektory",
    "zh-Hans": "服务与连接器",
    "zh-Hant": "服務與連線器",
    es: "Servicios y conectores",
    pl: "Usługi i konektory",
    ja: "サービスとコネクタ",
    th: "บริการและตัวเชื่อมต่อ",
    fi: "Palvelut ja liittimet",
    uk: "Сервіси та конектори",
    bg: "Услуги и конектори",
    tr: "Hizmetler ve bağlayıcılar",
    hu: "Szolgáltatások és csatlakozók",
  },
  architecture: {
    en: "How it works",
    ru: "Как это работает",
    de: "Funktionsweise",
    fr: "Fonctionnement",
    it: "Come funziona",
    nl: "Hoe het werkt",
    cs: "Jak to funguje",
    "zh-Hans": "工作原理",
    "zh-Hant": "工作原理",
    es: "Cómo funciona",
    pl: "Jak to działa",
    ja: "仕組み",
    th: "หลักการทำงาน",
    fi: "Miten se toimii",
    uk: "Як це працює",
    bg: "Как работи",
    tr: "Nasıl çalışır",
    hu: "Működése",
  },
  sandbox: {
    en: "Developers & API",
    ru: "Разработчикам и API",
    de: "Entwickler & API",
    fr: "Développeurs et API",
    it: "Sviluppatori e API",
    nl: "Ontwikkelaars en API",
    cs: "Vývojáři a API",
    "zh-Hans": "开发者与 API",
    "zh-Hant": "開發者與 API",
    es: "Desarrolladores y API",
    pl: "Programiści i API",
    ja: "開発者と API",
    th: "นักพัฒนาและ API",
    fi: "Kehittäjät ja API",
    uk: "Розробникам та API",
    bg: "Разработчици и API",
    tr: "Geliştiriciler ve API",
    hu: "Fejlesztők és API",
  },
  security: {
    en: "Security & permissions",
    ru: "Безопасность и права",
    de: "Sicherheit & Berechtigungen",
    fr: "Sécurité et autorisations",
    it: "Sicurezza e autorizzazioni",
    nl: "Beveiliging en machtigingen",
    cs: "Bezpečnost a oprávnění",
    "zh-Hans": "安全与权限",
    "zh-Hant": "安全與權限",
    es: "Seguridad y permisos",
    pl: "Bezpieczeństwo i uprawnienia",
    ja: "セキュリティと権限",
    th: "ความปลอดภัยและการอนุญาต",
    fi: "Turvallisuus ja käyttöoikeudet",
    uk: "Безпека та дозволи",
    bg: "Сигурност и права",
    tr: "Güvenlik ve izinler",
    hu: "Biztonság és jogosultságok",
  },
  changelog: {
    en: "Status & changelog",
    ru: "Статус и изменения",
    de: "Status & Änderungen",
    fr: "Statut et journal",
    it: "Stato e novità",
    nl: "Status en logboek",
    cs: "Stav a změny",
    "zh-Hans": "状态与更新日志",
    "zh-Hant": "狀態與更新日誌",
    es: "Estado y novedades",
    pl: "Status i zmiany",
    ja: "状況と変更履歴",
    th: "สถานะและอัปเดต",
    fi: "Tila ja muutokset",
    uk: "Статус і зміни",
    bg: "Статус и промени",
    tr: "Durum ve değişiklikler",
    hu: "Állapot és változások",
  },
};

type CopyKey =
  | "navRegion"
  | "github"
  | "menuOpen"
  | "menuClose"
  | "panelSections"
  | "panelActions"
  | "cta"
  | "mainSite"
  | "mainSiteAria"
  | "ecosystemGroup"
  | "botStudio"
  | "nodePortal";

const COPY: Record<CopyKey, Localized<string>> = {
  mainSite: {
    en: "Main site",
    ru: "Основной сайт",
    de: "Hauptseite",
    fr: "Site principal",
    it: "Sito principale",
    nl: "Hoofdsite",
    cs: "Hlavní web",
    "zh-Hans": "主站",
    "zh-Hant": "主站",
    es: "Sitio principal",
    pl: "Strona główna",
    ja: "メインサイト",
    th: "ไซต์หลัก",
    fi: "Pääsivusto",
    uk: "Головний сайт",
    bg: "Основен сайт",
    tr: "Ana site",
    hu: "Főoldal",
  },
  mainSiteAria: {
    en: "Go to the POPOPX main site at popopx.chat",
    ru: "Перейти на основной сайт POPOPX: popopx.chat",
    de: "Zur POPOPX-Hauptseite unter popopx.chat",
    fr: "Aller sur le site principal de POPOPX sur popopx.chat",
    it: "Vai al sito principale di POPOPX su popopx.chat",
    nl: "Ga naar de POPOPX-hoofdsite op popopx.chat",
    cs: "Přejít na hlavní web POPOPX na adrese popopx.chat",
    "zh-Hans": "前往 POPOPX 主站 popopx.chat",
    "zh-Hant": "前往 POPOPX 主站 popopx.chat",
    es: "Ir al sitio principal de POPOPX en popopx.chat",
    pl: "Przejdź do głównej strony POPOPX pod popopx.chat",
    ja: "popopx.chat の POPOPX メインサイトへ移動します",
    th: "ไปที่ไซต์หลักของ POPOPX ที่ popopx.chat",
    fi: "Siirry POPOPX:n pääsivustolle osoitteessa popopx.chat",
    uk: "Перейти на основний сайт POPOPX за адресою popopx.chat",
    bg: "Към основния сайт на POPOPX на popopx.chat",
    tr: "popopx.chat adresindeki POPOPX ana sitesine git",
    hu: "Ugrás a POPOPX főoldalára a popopx.chat címen",
  },
  ecosystemGroup: {
    en: "Ecosystem",
    ru: "Экосистема",
    de: "Ökosystem",
    fr: "Écosystème",
    it: "Ecosistema",
    nl: "Ecosysteem",
    cs: "Ekosystém",
    "zh-Hans": "生态入口",
    "zh-Hant": "生態入口",
    es: "Ecosistema",
    pl: "Ekosystem",
    ja: "エコシステム",
    th: "ระบบนิเวศ",
    fi: "Ekosysteemi",
    uk: "Екосистема",
    bg: "Екосистема",
    tr: "Ekosistem",
    hu: "Ökoszisztéma",
  },
  botStudio: {
    en: "Bot Studio",
    ru: "Студия ботов",
    de: "Bot-Studio",
    fr: "Studio de bots",
    it: "Studio bot",
    nl: "Botstudio",
    cs: "Studio botů",
    "zh-Hans": "机器人工作台",
    "zh-Hant": "機器人工作台",
    es: "Estudio de bots",
    pl: "Studio botów",
    ja: "ボットスタジオ",
    th: "สตูดิโอของบอต",
    fi: "Bot-studio",
    uk: "Студія ботів",
    bg: "Студио за ботове",
    tr: "Bot Stüdyosu",
    hu: "Botstúdió",
  },
  nodePortal: {
    en: "Mac node",
    ru: "Узел Mac",
    de: "Mac-Knoten",
    fr: "Nœud Mac",
    it: "Nodo Mac",
    nl: "Mac-knooppunt",
    cs: "Uzel Mac",
    "zh-Hans": "Mac 自建节点",
    "zh-Hant": "Mac 自建節點",
    es: "Nodo Mac",
    pl: "Węzeł Mac",
    ja: "Mac ノード",
    th: "โหนด Mac",
    fi: "Mac-solmu",
    uk: "Вузол Mac",
    bg: "Mac възел",
    tr: "Mac düğümü",
    hu: "Mac csomópont",
  },
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

/** Outbound arrow: marks a link that leaves this origin without loading anything. */
function OutboundMark(): ReactElement {
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
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
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
  const mainSiteLabel = useCopy(COPY.mainSite);
  const mainSiteAria = useCopy(COPY.mainSiteAria);
  const ecosystemLabel = useCopy(COPY.ecosystemGroup);
  const botStudioLabel = useCopy(COPY.botStudio);
  const nodeLabel = useCopy(COPY.nodePortal);

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
            href={MAIN_SITE_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={mainSiteAria}
            className={`hidden items-center gap-1.5 rounded-full border border-hair bg-white/[0.04] px-3 py-2 text-[12px] text-mute transition-colors duration-200 hover:border-brand/50 hover:text-white lg:inline-flex ${FOCUS}`}
          >
            <OutboundMark />
            {mainSiteLabel}
          </a>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={githubLabel}
            className={`hidden h-9 items-center gap-2 rounded-full border border-hair bg-white/[0.04] px-3 text-[12px] text-mute transition-colors duration-200 hover:border-hair-strong hover:text-white sm:inline-flex ${FOCUS}`}
          >
            <GitHubMark />
            GitHub
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
              <p className="eyebrow flex items-center gap-1.5">{ecosystemLabel}</p>
              <ul className="mt-1 grid gap-0.5">
                {[
                  { href: MAIN_SITE_URL, label: mainSiteLabel, host: "popopx.chat" },
                  { href: BOT_STUDIO_URL, label: botStudioLabel, host: "bot.popopx.chat" },
                  { href: NODE_PORTAL_URL, label: nodeLabel, host: "node.popopx.chat" },
                ].map((entry) => (
                  <li key={entry.href}>
                    <a
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      onClick={closePanel}
                      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[14px] text-mute transition-colors duration-200 hover:bg-white/[0.06] hover:text-white ${FOCUS}`}
                    >
                      <span className="min-w-0 truncate">{entry.label}</span>
                      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-faint">
                        {entry.host}
                        <OutboundMark />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

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
