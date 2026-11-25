"use client";

import { useReducer, type ReactElement } from "react";
import { pick, useLocale, type Locale, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";
import { ADMIN_CONSOLE_URL, NODE_WS_URL, SITE_HOST } from "@/lib/site";

/**
 * The interactive sandbox: one console, one phone, one relay.
 *
 * What the phone shows and what the relay sees are the *same* state, rendered
 * twice. Every control is a real `useReducer` transition — no timers, no
 * `Math.random()`, no network, nothing that could differ between the server
 * pass and the first client pass.
 *
 * Shapes are not invented here. Frames, field names, limits and the wire
 * behaviour of every button were read out of the sibling repository:
 *
 *   gateway/app/crypto_service.py     EcoLimits, build_card, build_menu,
 *                                     build_action, encode_frame,
 *                                     frame_channel_key_update, seal_envelope,
 *                                     h5_preimage / sign_h5_url
 *   gateway/app/main.py               send_article, push_menu, deliver_card,
 *                                     _kind_card_callback, _run_menu_item
 *   gateway/app/plugins/polls_plugin.py     card_id_for, option_actions,
 *                                           progress_for, fields_for,
 *                                           decide_vote_write
 *   gateway/app/plugins/alert_ops_plugin.py card_progress, card_actions,
 *                                           ack_payload, terminal_payload
 *   apps/ios/Shared/Features/ServiceAccount/PopopxEcoModels.swift
 *                                     `::CB::` / `::REF::` / `::SSO_SCAN::`
 *   apps/ios/Shared/Features/ServiceAccount/ChannelKeyRotationManager.swift
 *                                     ch/se/rp/env, revokePrevious
 *
 * Anything the page cannot show it says so, which is why the relay pane labels
 * its key material as generated-in-page examples rather than real secrets.
 */

/* ──────────────────────────────────────────────────────────────────────────
 * Copy plumbing
 *
 * `src/lib/i18n.tsx` types `Localized<T>` as a total map over the 18 tags the
 * POPOPX iOS client declares in `CFBundleLocalizations`. Every copy object in
 * this file is therefore written out as a literal with all 18 keys, in the
 * engine's own order, so both `tsc` and `tools/check-i18n.mjs` can see each
 * language a visitor actually gets — no helper fills a slot, nothing is cast,
 * nothing is spread. A slot read inside a `.map()` goes through `pick(map,
 * locale)`; `pick` is the only place a locale tag is looked up here.
 *
 * Protocol tokens stay locale-free on purpose: they are bytes on a wire, not
 * prose. Text that is a wire value (`::POPOPX_ECO::`, an `smp://` address, a
 * base64 run, a payload id) is emitted verbatim in every language.
 * ────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────
 * Deterministic fixtures
 * ────────────────────────────────────────────────────────────────────────── */

/** 2026-11-22 02:00 UTC. A fixed clock, so SSR and the client agree. */
const BASE_MS = 1_795_312_800_000;
const ECO_MARKER = "::POPOPX_ECO::";
const CONTACT_ID = 4213;
const PAIRWISE_UID = "pw_7Qm3ZxP9dLb2Ns";
const RELAY_HOST = "mp.popopx.chat";
const PUBLIC_BASE = "https://mp.popopx.chat";
const ARTICLE_ID = "a-2026-1122";
const POLL_ID = "179531280012345678";
const ALERT_ID = "al-0123456789abcdef";
const CHANNEL_ID = "ch-mens-weekly";
const MENU_REV = 3;

/**
 * Wire enums and digests. These are bytes on a wire, so the same constant is
 * referenced from every one of the 18 slots instead of being translated: a
 * German reader gets exactly the severity string the gateway wrote.
 */
const SEVERITY_WARNING = "warning";
const ALERT_FINGERPRINT = "8c1f42d9be07a351";

const STD_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * `smp://<host>/<connId>#key=<key>&auth=<auth>` — the shape `PopopxEcoLink`
 * documents. The three byte groups run through `fakeBytes`/`b64url` below instead
 * of being typed in, so no credential-shaped literal on this page can be mistaken
 * for a live key, and nothing here matches anything in the backend repository.
 */
const SERVICE_ADDRESS = `smp://${SITE_HOST}/${b64url(fakeBytes(0x5eed10, 21))}#key=${b64url(
  fakeBytes(0x5eed11, 32),
)}&auth=${b64url(fakeBytes(0x5eed12, 16))}`;

/** `popopx://service?uri=<address>&ref=<article id>`; opening it sends `::REF::`. */
const DEEP_LINK = "popopx://service?uri=%s&ref=%s".replace("%s", encodeURIComponent(SERVICE_ADDRESS)).replace("%s", ARTICLE_ID);

const H5_URL =
  "%s/h5/%s?popopx_uid=%s&ts=%d&sig=%s".replace("%s", PUBLIC_BASE).replace("%s", ARTICLE_ID).replace("%s", PAIRWISE_UID).replace("%d", String(Math.floor(BASE_MS / 1000))).replace("%s", "6f1c2d9a4b7e0c35a8d1f642b9e7c0d3415a86ce2f70d9b1e43c5a276f8de901");

const STORE_URL = "%s/h5/stores".replace("%s", PUBLIC_BASE);

/** `polls_plugin.mint_poll_id` = 13-digit clock + 5 digits of randomness. */
const POLL_ENDS_AT_MS = BASE_MS + 30 * 86_400_000;

/** Wire action kinds the client decodes (`crypto_service.ACTION_KINDS`). */
type ActionKind = "callback" | "open_url" | "open_channel" | "send_cmd" | "pay_credits";

type WireField = { readonly k: Localized<string>; readonly v: Localized<string>; readonly mono?: boolean };

type WireAction = {
  readonly id: string;
  readonly title: Localized<string>;
  readonly kind: ActionKind;
  readonly style: "primary" | "secondary" | "destructive";
  readonly payload?: string;
  readonly url?: string;
};

type WireProgress = { readonly l: Localized<string>; readonly p: number; readonly d: Localized<string> };

type CardStyle = "standard" | "receipt" | "security";

type CardMsg = {
  readonly kind: "card";
  readonly id: string;
  readonly v: CardStyle;
  readonly title: Localized<string>;
  readonly body?: Localized<string>;
  readonly ut: number;
  readonly fields: readonly WireField[];
  readonly progress?: WireProgress;
  readonly actions: readonly WireAction[];
  readonly et?: number;
  /** How this card last arrived: create `c` or in-place update `u`. */
  readonly mode: "c" | "u";
};

type TextMsg = { readonly kind: "text"; readonly id: string; readonly from: "svc" | "me"; readonly text: Localized<string>; readonly ut: number };

type Msg = CardMsg | TextMsg;

type LogTone = "brand" | "mesh" | "warn" | "mute";

type LogEntry = {
  readonly id: number;
  readonly dir: "up" | "down" | "note";
  readonly tone: LogTone;
  readonly text: Localized<string>;
  readonly code?: string;
};

type State = {
  readonly screen: "channel" | "chat";
  readonly unread: number;
  readonly messages: readonly Msg[];
  readonly menuRevPushed: number;
  readonly openMenu: number | null;
  readonly voted: readonly number[];
  readonly counts: readonly number[];
  readonly epoch: number;
  readonly sealedUnder: number;
  readonly rotateError: boolean;
  readonly h5Open: boolean;
  readonly relayOn: boolean;
  readonly locked: readonly string[];
  readonly spent: { readonly card: number; readonly menu: number; readonly poll: number; readonly rotation: number };
  readonly log: readonly LogEntry[];
  readonly seq: number;
};

const POLL_OPTIONS: readonly Localized<string>[] = [
  {
    en: "Pick up in store, restocked this Saturday",
    ru: "Самовывоз из магазина, завоз в эту субботу",
    de: "Abholung im Laden, Ware kommt diesen Samstag",
    fr: "Retrait en boutique, réassort samedi",
    it: "Ritiro in negozio, rifornimento sabato",
    nl: "Ophalen in de winkel, aanvulling deze zaterdag",
    cs: "Vyzvednutí v prodejně, zboží přijde v sobotu",
    "zh-Hans": "自提：门店本周六备货",
    "zh-Hant": "自取：門市本週六備貨",
    es: "Recogida en tienda, reposición el sábado",
    pl: "Odbiór w sklepie, towar w tę sobotę",
    ja: "店頭受け取り：今週土曜に入荷",
    th: "รับเองที่ร้าน สต๊อกเข้าใหม่วันเสาร์นี้",
    fi: "Nouto myymälästä, hyllyille lauantaina",
    uk: "Самовивіз із магазину, завоз цієї суботи",
    bg: "Вземане от магазина, пратка в събота",
    tr: "Mağazadan teslim al: cumartesi yenileniyor",
    hu: "Átvétel a boltban, áru érkezik szombaton",
  },
  {
    en: "Cold chain: the truck leaves tonight",
    ru: "Холодовая цепь: машина выезжает вечером",
    de: "Kühlkette: der Wagen fährt heute Abend",
    fr: "Chaîne du froid : le camion part ce soir",
    it: "Catena del freddo: il camion parte stasera",
    nl: "Gekoeld transport: vanavond vertrek",
    cs: "Chladicí řetězec: auto odjíždí večer",
    "zh-Hans": "冷链：当晚发车",
    "zh-Hant": "冷鏈：當晚發車",
    es: "Cadena de frío: sale esta noche",
    pl: "Łańcuch chłodniczy: wyjazd wieczorem",
    ja: "コールドチェーン：今夜の便で発送",
    th: "ห้องเย็น: รถออกคืนนี้",
    fi: "Kylmäketju: rekkä lähtee illalla",
    uk: "Холодовий ланцюг: автівка виїжджає ввечері",
    bg: "Студена верига: камионът тръгва вечерта",
    tr: "Soğuk zincir: araç bu akşam yola çıkar",
    hu: "Hűtött lánc: ma este indul a autó",
  },
  {
    en: "A community pickup point",
    ru: "Общественная точка выдачи",
    de: "Eine Gemeinschafts-Abholstelle",
    fr: "Un point de retrait de quartier",
    it: "Un punto di ritiro di quartiere",
    nl: "Een afhaalpunt in de wijk",
    cs: "Sběrné místo ve čtvrti",
    "zh-Hans": "社区团购点代收",
    "zh-Hant": "社區團購點代收",
    es: "Un punto de recogida del barrio",
    pl: "Punkt odbioru w osiedlu",
    ja: "コミュニティの受取点",
    th: "จุดรับร่วมในชุมชน",
    fi: "Yhteisön noutopiste",
    uk: "Спільний пункт видачі в громаді",
    bg: "Общ пункт за получаване в квартала",
    tr: "Mahalle teslim noktası",
    hu: "Községi átvételi pont",
  },
  {
    en: "Skip the group buy this week",
    ru: "На этой неделе без совместной закупки",
    de: "Diese Woche keine Sammelbestellung",
    fr: "Pas d'achat groupé cette semaine",
    it: "Nessun acquisto condiviso questa settimana",
    nl: "Deze week geen groepsaankoop",
    cs: "Tento týden bez skupinové objednávky",
    "zh-Hans": "本周不要团购",
    "zh-Hant": "本週不要團購",
    es: "Esta semana, sin compra conjunta",
    pl: "W tym tygodniu bez zakupu grupowego",
    ja: "今週は共同購入しない",
    th: "สัปดาห์นี้ไม่ซื้อรวมกลุ่ม",
    fi: "Ohita ryhmätilaus tällä viikolla",
    uk: "Цього тижня без спільного замовлення",
    bg: "Тази седмица без групова поръчка",
    tr: "Bu hafta toplu sipariş yok",
    hu: "Ezen a héten nincs csoportos rendelés",
  },
];

/** The three menu entries `crypto_service.build_menu` will accept (max 3). */
type MenuLeaf = {
  readonly title: Localized<string>;
  readonly kind: "click" | "view" | "scancode";
  readonly action?: ActionKind;
  readonly payload?: string;
  readonly url?: string;
};

type MenuTop = { readonly title: Localized<string>; readonly kind: "click" | "view"; readonly url?: string; readonly sub?: readonly MenuLeaf[] };

const MENU_TOP: readonly MenuTop[] = [
  {
    title: {
      en: "Service desk",
      ru: "Сервис",
      de: "Service",
      fr: "Service",
      it: "Servizi",
      nl: "Service",
      cs: "Servis",
      "zh-Hans": "服务中心",
      "zh-Hant": "服務中心",
      es: "Servicios",
      pl: "Serwis",
      ja: "サポート",
      th: "บริการ",
      fi: "Palvelut",
      uk: "Сервіс",
      bg: "Сервиз",
      tr: "Servis",
      hu: "Szolgáltatás",
    },
    kind: "click",
    sub: [
      {
        title: {
          en: "My orders",
          ru: "Мои заказы",
          de: "Meine Bestellungen",
          fr: "Mes commandes",
          it: "I miei ordini",
          nl: "Mijn bestellingen",
          cs: "Moje objednávky",
          "zh-Hans": "我的订单",
          "zh-Hant": "我的訂單",
          es: "Mis pedidos",
          pl: "Moje zamówienia",
          ja: "注文一覧",
          th: "คำสั่งซื้อของฉัน",
          fi: "Tilaukseni",
          uk: "Мої замовлення",
          bg: "Моите поръчки",
          tr: "Siparişlerim",
          hu: "Rendeléseim",
        },
        kind: "click",
        action: "callback",
        payload: "menu:orders",
      },
      {
        title: {
          en: "Talk to a human",
          ru: "Живой оператор",
          de: "Mit einem Menschen sprechen",
          fr: "Parler à un humain",
          it: "Parlare con un operatore",
          nl: "Praat met een medewerker",
          cs: "Promluvit si s člověkem",
          "zh-Hans": "联系人工",
          "zh-Hant": "聯絡人工",
          es: "Hablar con una persona",
          pl: "Rozmowa z człowiekiem",
          ja: "オペレーターに話す",
          th: "คุยกับพนักงาน",
          fi: "Puhu henkilökunnalle",
          uk: "Поговорити з живою людиною",
          bg: "Говорете с човек",
          tr: "Bir çalışanla konuş",
          hu: "Beszélj munkatárssal",
        },
        kind: "click",
        action: "callback",
        payload: "menu:human",
      },
      {
        title: {
          en: "Store list",
          ru: "Список магазинов",
          de: "Filialliste",
          fr: "Liste des boutiques",
          it: "Elenco dei negozi",
          nl: "Winkellijst",
          cs: "Seznam prodejen",
          "zh-Hans": "门店列表",
          "zh-Hant": "門市清單",
          es: "Lista de tiendas",
          pl: "Lista sklepów",
          ja: "店舗一覧",
          th: "รายชื่อร้าน",
          fi: "Myymäläluettelo",
          uk: "Список магазинів",
          bg: "Списък на магазините",
          tr: "Mağaza listesi",
          hu: "Üzletjegyzék",
        },
        kind: "view",
        url: STORE_URL,
      },
    ],
  },
  {
    title: {
      en: "This week's issue",
      ru: "Выпуск недели",
      de: "Ausgabe der Woche",
      fr: "Édition de la semaine",
      it: "Numero di questa settimana",
      nl: "Editie van de week",
      cs: "Týdenní vydání",
      "zh-Hans": "本周图文",
      "zh-Hant": "本週圖文",
      es: "Número de esta semana",
      pl: "Wydanie tego tygodnia",
      ja: "今週の記事",
      th: "ฉบับสัปดาห์นี้",
      fi: "Viikon julkaisu",
      uk: "Випуск цього тижня",
      bg: "Тазседмичният брой",
      tr: "Bu haftanın sayısı",
      hu: "A hét kiadványa",
    },
    kind: "view",
    url: "%s/h5/%s".replace("%s", PUBLIC_BASE).replace("%s", ARTICLE_ID),
  },
  {
    title: {
      en: "Scan",
      ru: "Сканер",
      de: "Scanner",
      fr: "Scanner",
      it: "Scanner",
      nl: "Scanner",
      cs: "Skenovat",
      "zh-Hans": "扫一扫",
      "zh-Hant": "掃描",
      es: "Escanear",
      pl: "Skanuj",
      ja: "スキャン",
      th: "สแกน",
      fi: "Skannaa",
      uk: "Сканер",
      bg: "Сканирай",
      tr: "Tarayıcı",
      hu: "Beolvasás",
    },
    kind: "view",
  },
];

/**
 * `build_menu_item` gives a `scancode` leaf no action at all, and the client's
 * `firing(of:)` answers `.unreachable` for it: the phone handles it locally and
 * the relay sees nothing. The menu bar therefore reports it honestly instead of
 * pretending to open a camera.
 */
const SCANNER_NOTE: Localized<string> = {
  en: "Scan runs on the phone: a `scancode` item carries no action, so the relay never sees an uplink frame for it.",
  ru: "Скан выполняется на телефоне: у элемента `scancode` нет action, поэтому ретранслятор не получает ни одного восходящего кадра.",
  de: "Scannen passiert auf dem Gerät: Ein `scancode`-Eintrag hat keinen action, beim Relay kommt deshalb kein Uplink-Frame an.",
  fr: "Le scan se fait sur le téléphone : un élément `scancode` ne porte aucun action, le relais ne reçoit donc aucune trame montante.",
  it: "La scansione avviene sul telefono: una voce `scancode` non porta alcun action, quindi il relay non vede alcun frame in uplink.",
  nl: "Scannen gebeurt op de telefoon: een `scancode`-item bevat geen action, dus de relay krijgt geen uplinkframe te zien.",
  cs: "Skenování běží na telefonu: položka `scancode` nemá žádný action, relay tedy nevidí žádný uplinkový rámec.",
  "zh-Hans": "扫一扫由 iOS 客户端本地处理：kind=scancode 的条目不带 action，中继收不到任何上行帧。",
  "zh-Hant": "掃描由 iOS 客戶端本地處理：kind=scancode 的條目不帶 action，中繼收不到任何上行訊框。",
  es: "El escaneo ocurre en el teléfono: un elemento `scancode` no lleva action, así que el relay no ve ninguna trama de subida.",
  pl: "Skanowanie dzieje się na telefonie: pozycja `scancode` nie ma action, więc przekaźnik nie widzi żadnej ramki uplink.",
  ja: "スキャンはスマホ側で完結します。`scancode` の項目に action が付かないため、リレーは上りフレームを受け取りません。",
  th: "การสแกนจบอยู่บนเครื่อง: รายการ `scancode` ไม่มี action รีเลย์จึงไม่เห็นเฟรมขาขึ้นเลย",
  fi: "Skannaus tapahtuu puhelimessa: `scancode`-kohdalla ei ole actionia, joten releasemaa ei näe nousevaa kehystä.",
  uk: "Сканування відбувається на телефоні: елемент `scancode` не має action, тому ретранслятор не бачить жодного висхідного кадру.",
  bg: "Сканирането е на телефона: елемент `scancode` няма action, затова ретранслаторът не вижда нито една възходяща рамка.",
  tr: "Tarama telefonda gerçekleşir: bir `scancode` maddesi action taşımaz, dolayısıyla aktarma düğümü yukarı yönlü bir çerçeve görmez.",
  hu: "A beolvasás a telefonon történik: egy `scancode` bejegyzés nem visz actiont, így az átvivő feljövő keretet egyáltalán nem lát.",
};

/* ──────────────────────────────────────────────────────────────────────────
 * Copy
 * ────────────────────────────────────────────────────────────────────────── */

const EYEBROW: Localized<string> = {
  en: "Interactive sandbox",
  ru: "Интерактивная песочница",
  de: "Interaktiver Spielplatz",
  fr: "Bac à sable interactif",
  it: "Sandbox interattiva",
  nl: "Interactieve zandbak",
  cs: "Interaktivní pískoviště",
  "zh-Hans": "互动体验沙盒",
  "zh-Hant": "互動體驗沙盒",
  es: "Sandbox interactivo",
  pl: "Interaktywna piaskownica",
  ja: "インタラクティブ沙盒",
  th: "แซนด์บ็อกซ์เชิงโต้ตอบ",
  fi: "Interakttiivi hiekkalaatikko",
  uk: "Інтерактивна пісочниця",
  bg: "Интерактивна пясъчница",
  tr: "Etkileşimli kum havuzu",
  hu: "Interaktív homokozó",
};

const TITLE: Localized<string> = {
  en: "Tap on the left, watch a real card grow on the phone",
  ru: "Нажмите слева — на телефоне появится настоящая карточка",
  de: "Links antippen, auf dem Telefon wächst eine echte Karte",
  fr: "Tapez à gauche, une vraie carte pousse sur le téléphone",
  it: "Tocca a sinistra, sul telefono cresce una carta vera",
  nl: "Tik links, op de telefoon groeit een echte kaart",
  cs: "Klepnutím vlevo se v telefonu objeví skutečná karta",
  "zh-Hans": "左边点一下，右边手机上真的会长出一张卡",
  "zh-Hant": "左邊點一下，右邊手機上真的會長出一張卡",
  es: "Toca a la izquierda y en el teléfono crece una tarjeta real",
  pl: "Kliknij po lewej — na telefonie pojawia się prawdziwa karta",
  ja: "左でタップすると、スマホに本物のカードが生える",
  th: "แตะทางซ้าย การ์ดจริงจะงอกขึ้นบนโทรศัพท์",
  fi: "Napauta vasemmalla, puhelimeen kasvaa oikea kortti",
  uk: "Натисніть ліворуч — на телефоні виросте справжня картка",
  bg: "Докнете вляво — на телефона гърми истинска карта",
  tr: "Soldan dokunun, telefonda gerçek bir kart belirsin",
  hu: "Kattints balra, a telefonon valódi karta nő ki",
};

const SUBTITLE: Localized<string> = {
  en: "A browser-only demo rig. The left column holds the actions a service-account console fires, the right column is the follower's iPhone, and the relay view below shows the third way of looking at the same event: a line of `::POPOPX_ECO::` plus compact JSON. Every frame shape, field name, button meaning and billing unit here was taken from gateway/app/ in the same repository.",
  ru: "Демо-стенд работает только в браузере. Слева — действия консоли сервисного аккаунта, справа — iPhone подписчика, а внизу вид ретранслятора показывает третье прочтение того же события: строка `::POPOPX_ECO::` плюс компактный JSON. Все формы кадров, имена полей, смысл кнопок и единицы списания взяты из gateway/app/ этого же репозитория.",
  de: "Ein reines Browser-Demo. Die linke Spalte zeigt die Aktionen einer Service-Konto-Konsole, die rechte das iPhone eines Followers, und die Relay-Ansicht darunter ist die dritte Lesart desselben Ereignisses: eine Zeile `::POPOPX_ECO::` plus kompaktes JSON. Jedes Frame-Format, jeder Feldname, jede Button-Bedeutung und jede Abrechnungseinheit stammt aus gateway/app/ desselben Repos.",
  fr: "Un banc d'essai purement navigateur. À gauche les actions d'une console de compte de service, à droite l'iPhone d'un abonné, et en bas la vue du relais donne le troisième regard sur le même événement : une ligne `::POPOPX_ECO::` suivie d'un JSON compact. Toutes les formes de trame, noms de champ, significations de bouton et unités de facturation viennent de gateway/app/ du même dépôt.",
  it: "Una demo che gira solo nel browser. La colonna di sinistra contiene le azioni della console di un account di servizio, quella di destra è l'iPhone di un follower e la vista relay qui sotto mostra la terza lettura dello stesso evento: una riga `::POPOPX_ECO::` più un JSON compatto. Ogni forma di frame, nome di campo, significato dei pulsanti e unità di addebito viene da gateway/app/ dello stesso repository.",
  nl: "Een demo die alleen in de browser draait. De linkerkolom bevat de acties van een serviceaccount-console, de rechterkant is de iPhone van een volger, en het relay-view hieronder toont de derde blik op hetzelfde event: één regel `::POPOPX_ECO::` plus compacte JSON. Elke framevorm, veldnaam, knopbetekenis en factureringseenheid is ontleend aan gateway/app/ in dezelfde repository.",
  cs: "Demo běží jen v prohlížeči. Levý sloupec obsahuje akce konzole servisního účtu, pravý je iPhone followera a pohled na relay níže je třetím úhlem pohledu na tutéž událost: řádek `::POPOPX_ECO::` plus kompaktní JSON. Každý tvar rámce, název pole, význam tlačítka i fakturační jednotka pocházejí z gateway/app/ stejného repozitáře.",
  "zh-Hans": "这是一台纯前端的演示机：左栏是服务号管理后台会发出的那些动作，右栏是粉丝的 iPhone，中间那条「中继服务器视角」把同一件事的第三种看法摊开——线上跑的就是 ::POPOPX_ECO:: 加一段紧凑 JSON。所有帧形、字段名、按钮语义和计费单位都取自同仓的 gateway/app/，不是照着宣传页编的。",
  "zh-Hant": "這是一台純前端的示範機：左欄是服務號管理後台會發出的那些動作，右欄是粉絲的 iPhone，中間那條「中繼伺服器視角」把同一件事的第三種看法攤開——線上跑的就是 ::POPOPX_ECO:: 加一段緊縮 JSON。所有訊框形狀、欄位名、按鈕語意與計費單位都取自同倉的 gateway/app/，不是照著宣傳頁編的。",
  es: "Una demo que solo vive en el navegador. La columna izquierda reúne las acciones que dispara la consola de una cuenta de servicio, la derecha es el iPhone de un seguidor y la vista de relay de abajo es la tercera forma de ver el mismo evento: una línea de `::POPOPX_ECO::` más JSON compacto. Cada forma de trama, nombre de campo, significado de botón y unidad de facturación salió de gateway/app/ del mismo repositorio.",
  pl: "Demonka działająca wyłącznie w przeglądarce. Lewa kolumna to akcje konsoli konta serwisowego, prawa to iPhone obserwującego, a widok przekaźnika poniżej pokazuje trzecie spojrzenie na to samo zdarzenie: linia `::POPOPX_ECO::` plus zwięzły JSON. Każdy kształt ramki, nazwa pola, znaczenie przycisku i jednostka rozliczeniowa pochodzą z gateway/app/ tego samego repozytorium.",
  ja: "ブラウザだけで動くデモ機です。左欄はサービスアカウントの管理コンソールが発火させる操作、右欄はフォロワーの iPhone、下の「リレー中継サーバー視点」は同じ出来事の三番目の見方、すなわち `::POPOPX_ECO::` の行とコンパクトな JSON を広げて見せます。フレーム形状・フィールド名・ボタンの意味・課金単位はすべて同一リポジトリの gateway/app/ から取った値で、宣伝ページからこしらえたものではありません。",
  th: "ชุดเดโมที่ทำงานในเบราว์เซอร์เท่านั้น คอลัมน์ซ้ายคือคำสั่งจากคอนโซลบัญชีบริการ คอลัมน์ขวาคือ iPhone ของผู้ติดตาม และมุมมองรีเลย์ด้านล่างคือมุมมองที่สามของเหตุการณ์เดียวกัน: บรรทัด `::POPOPX_ECO::` ตามด้วย JSON แบบกะทัดรัด รูปแบบเฟรม ชื่อฟิลด์ ความหมายปุ่ม และหน่วยคิดเงินทั้งหมดมาจาก gateway/app/ ในรีโปเดียวกัน",
  fi: "Selaimessa pyörivä demorivi. Vasen sarakkeen sisältää palvelutilin konsolin laukaisemat toiminnot, oikea on seuraajan iPhone ja alla näkyvä releasemanäkymä on sama tapahtuma kolmannesta näkökulmasta: rivi `::POPOPX_ECO::` tiiviin JSONin kanssa. Jokainen kehysmuoto, kentänimi, napin merkitys ja laskutusyksikkö on otettu gateway/app/-kansiosta samasta repositiosta.",
  uk: "Демостенд працює лише в браузері. Ліва колонка — дії консолі сервісного акаунта, права — iPhone підписника, а поданий нижче погляд ретранслятора показує третє прочитання тієї ж події: рядок `::POPOPX_ECO::` плюс компактний JSON. Усі форми кадрів, назви полів, значення кнопок та одиниці нарахувань узяті з gateway/app/ цього самого репозиторію.",
  bg: "Демо, което живее само в четеца. Лявата колона съдържа действията на конзолата на сервизен акаунт, дясната е iPhone-ът на последовател, а изгледът на ретранслатора долу е третият поглед към същото събитие: ред `::POPOPX_ECO::` плюс компактен JSON. Всяка форма на рамка, име на поле, значение на бутон и мерна единица са взети от gateway/app/ в същото хранилище.",
  tr: "Yalnızca tarayıcıda çalışan bir demo düzeni. Sol sütun Hizmet Hesabı konsolunun tetiklediği eylemleri, sağ sütun bir takipçinin iPhone'unu gösterir; alttaki aktarma düğümü görünümü ise aynı olayın üçüncü okunuşudur: bir satır `::POPOPX_ECO::` ve ardından sıkışık JSON. Buradaki her çerçeve biçimi, alan adı, düğme anlamı ve faturalandırma birimi aynı deponun gateway/app/ klasöründen alınmıştır.",
  hu: "Böngészőben futó demó. A bal oszlop a szolgáltatási fiók konzoljának műveleteit tartalmazza, a jobb a követő iPhone-a, alul pedig az átvivő nézete ugyanannak az eseménynek a harmadik olvasmánya: egy `::POPOPX_ECO::` sor meg tömör JSON. Minden keretforma, mezőnév, gombjelentés és számlázási egység ugyanabból a repóból, a gateway/app/ mappából való.",
};

const NO_NETWORK: Localized<string> = {
  en: "Reset the demo: every piece of state returns to its factory value. Nothing here sends anything — no fetch, no WebSocket, no upload — and every frame is assembled in the browser at that moment.",
  ru: "Сброс демо: все состояния возвращаются к заводским значениям. Отсюда ничего не отправляется — ни fetch, ни WebSocket, ни загрузка, — а каждый кадр собирается в браузере в момент нажатия.",
  de: "Demo zurücksetzen: jeder Zustand springt auf den Auslieferungswert. Hier geht nichts raus — kein fetch, kein WebSocket, kein Upload — und jedes Frame wird in genau dem Moment im Browser zusammengesetzt.",
  fr: "Réinitialiser la démo : chaque état revient à sa valeur d'usine. Rien n'est envoyé ici — ni fetch, ni WebSocket, ni téléversement — et chaque trame est assemblée dans le navigateur sur le moment.",
  it: "Resetta la demo: ogni stato torna al valore di fabbrica. Da qui non parte nulla — né fetch, né WebSocket, né upload — e ogni frame viene assemblato nel browser in quel momento.",
  nl: "Reset de demo: elke staat springt terug naar de fabriekswaarde. Hier wordt niets verstuurd — geen fetch, geen WebSocket, geen upload — en elk frame wordt op dat moment in de browser in elkaar gezet.",
  cs: "Reset dema: každý stav se vrací do továrního nastavení. Odtud se nic neposílá — žádný fetch, WebSocket ani upload — a každý rámec se sestaví v prohlížeči právě v ten moment.",
  "zh-Hans": "重置演示：所有状态回到出厂值。这个页面不发任何请求——没有 fetch，没有 WebSocket，没有图片上传，帧文本全部在浏览器里现场拼装。",
  "zh-Hant": "重置示範：所有狀態回到出廠值。這個頁面不發任何要求——沒有 fetch、沒有 WebSocket、沒有圖片上傳，訊框文字全部在瀏覽器裡現場組裝。",
  es: "Reinicia la demo: cada estado vuelve a su valor de fábrica. Desde aquí no se envía nada —ni fetch, ni WebSocket, ni subida— y cada trama se ensambla en el navegador en ese instante.",
  pl: "Reset dema: każdy stan wraca do wartości fabrycznej. Stąd nic nie wychodzi — ani fetch, ani WebSocket, ani wysyłka — a każda ramka jest składana w przeglądarce w tej właśnie chwili.",
  ja: "デモをリセットすると、すべての状態が出荷時の値に戻ります。このページは何も送信しません。fetch も WebSocket も画像アップロードも無く、フレーム文字列はその場でブラウザ内に組み立てられます。",
  th: "รีเซ็ตเดโม: ทุกสถานะกลับค่าเดิมจากโรงงาน จากหน้านี้ไม่ส่งอะไรออกไปเลย — ไม่มี fetch, ไม่มี WebSocket, ไม่อัปโหลดภาพ — ข้อความเฟรมถูกประกอบในเบราว์เซอร์ ณ ตอนนั้น",
  fi: "Nollaa demo: jokainen tila palautuu tehdysarvoonsa. Täältä ei lähetetä mitään — ei fetchiä, ei WebSocketiä, ei lähetystä — ja jokainen kehys koostetaan selaimessa juuri sillä hetkellä.",
  uk: "Скидання демо: кожен стан повертається до заводського значення. Звідси нікуди нічого не надсилається — ні fetch, ні WebSocket, ні вивантаження, — а кожен кадр збирається в браузері в ту саму мить.",
  bg: "Нулиране на демото: всяко състояние се връща към заводската стойност. Оттук нищо не се изпраща — нито fetch, нито WebSocket, нито качване — и всяка рамка се сглобява в четеца в онзи момент.",
  tr: "Demoyu sıfırla: her durum fabrika değerine döner. Buradan hiçbir şey gönderilmez — ne fetch, ne WebSocket, ne yükleme — ve her çerçeve o anda tarayıcıda kurulur.",
  hu: "A demó visszaállítása: minden állapot gyári értékre ugrik vissza. Innen semmi nem megy ki — sincs fetch, sincs WebSocket, sincs feltöltés — és minden keret abban a pillanatban a böngészőben áll össze.",
};

const CONSOLE_HEAD: Localized<string> = {
  en: "Service account console",
  ru: "Консоль сервисного аккаунта",
  de: "Service-Konto-Konsole",
  fr: "Console du compte de service",
  it: "Console dell'account di servizio",
  nl: "Console van de serviceaccount",
  cs: "Konzole servisního účtu",
  "zh-Hans": "服务号管理后台",
  "zh-Hant": "服務號管理後台",
  es: "Consola de la cuenta de servicio",
  pl: "Konsola konta serwisowego",
  ja: "サービスアカウントの管理後台",
  th: "คอนโซลบัญชีบริการ",
  fi: "Palvelutilin konsoli",
  uk: "Консоль сервісного акаунта",
  bg: "Конзола на сервизния акаунт",
  tr: "Hizmet Hesabı konsolu",
  hu: "Szolgáltatási fiók konzolja",
};
const PHONE_HEAD: Localized<string> = {
  en: "The follower's iPhone",
  ru: "iPhone подписчика",
  de: "Das iPhone eines Followers",
  fr: "L'iPhone d'un abonné",
  it: "L'iPhone di un follower",
  nl: "De iPhone van een volger",
  cs: "iPhone followera",
  "zh-Hans": "粉丝的 iPhone",
  "zh-Hant": "粉絲的 iPhone",
  es: "El iPhone de un seguidor",
  pl: "iPhone obserwującego",
  ja: "フォロワーの iPhone",
  th: "iPhone ของผู้ติดตาม",
  fi: "Seuraajan iPhone",
  uk: "iPhone підписника",
  bg: "iPhone-ът на последовател",
  tr: "Takipçinin iPhone'u",
  hu: "A követő iPhone-a",
};
const RELAY_HEAD: Localized<string> = {
  en: "Relay server view",
  ru: "Вид с ретранслятора",
  de: "Relay-Ansicht",
  fr: "Vue du serveur relais",
  it: "Vista del server relay",
  nl: "Relay-serverweergave",
  cs: "Pohled na relay server",
  "zh-Hans": "中继服务器视角",
  "zh-Hant": "中繼伺服器視角",
  es: "Vista del servidor relay",
  pl: "Widok serwera przekaźnikowego",
  ja: "リレー中継サーバー視点",
  th: "มุมมองเซิร์ฟเวอร์รีเลย์",
  fi: "Releasemanäkymä",
  uk: "Погляд з ретранслятора",
  bg: "Изглед от ретранслатора",
  tr: "Aktarma düğümü görünümü",
  hu: "Átvivő szerver nézete",
};
const SERVICE_TITLE: Localized<string> = {
  en: "White Peach Lab",
  ru: "Лаборатория белых персиков",
  de: "Weißpfirsich-Labor",
  fr: "Labo de la pêche blanche",
  it: "Laboratorio della pesca bianca",
  nl: "Witte-perziklab",
  cs: "Laboratoř bílých broskví",
  "zh-Hans": "白桃研究所",
  "zh-Hant": "白桃研究所",
  es: "Laboratorio del melocotón blanco",
  pl: "Laboratorium białych brzoskwiń",
  ja: "白桃研究所",
  th: "ห้องแล็บพีชขาว",
  fi: "Valkoisten persikoiden laboratorio",
  uk: "Лабораторія білих персиків",
  bg: "Лаборатория на белите праскови",
  tr: "Beyaz Şeftali Laboratuvarı",
  hu: "Fehér őszibarack labor",
};

const TAB_CHANNEL: Localized<string> = {
  en: "Channel",
  ru: "Канал",
  de: "Kanal",
  fr: "Canal",
  it: "Canale",
  nl: "Kanaal",
  cs: "Kanál",
  "zh-Hans": "频道",
  "zh-Hant": "頻道",
  es: "Canal",
  pl: "Kanał",
  ja: "チャンネル",
  th: "ช่องทาง",
  fi: "Kanava",
  uk: "Канал",
  bg: "Канал",
  tr: "Kanal",
  hu: "Csatorna",
};
const TAB_SERVICE: Localized<string> = {
  en: "Service",
  ru: "Сервис",
  de: "Dienste",
  fr: "Services",
  it: "Servizio",
  nl: "Diensten",
  cs: "Servis",
  "zh-Hans": "服务号",
  "zh-Hant": "服務號",
  es: "Servicio",
  pl: "Serwis",
  ja: "サービス",
  th: "บริการ",
  fi: "Palvelu",
  uk: "Сервіс",
  bg: "Сервиз",
  tr: "Hizmet",
  hu: "Szolgáltatás",
};

const ACTION_LABELS: Record<string, Localized<string>> = {
  publish: {
    en: "Publish the channel article",
    ru: "Опубликовать статью канала",
    de: "Kanal-Artikel veröffentlichen",
    fr: "Publier l'article du canal",
    it: "Pubblica l'articolo del canale",
    nl: "Kanaalartikel publiceren",
    cs: "Zveřejnit článek kanálu",
    "zh-Hans": "发布频道图文",
    "zh-Hant": "發布頻道圖文",
    es: "Publicar el artículo del canal",
    pl: "Opublikuj artykuł kanału",
    ja: "チャンネルの図文を投稿",
    th: "เผยแพร่บทความของช่องทาง",
    fi: "Julkaise kanavan artikkeli",
    uk: "Опублікувати статтю каналу",
    bg: "Публикувай статията на канала",
    tr: "Kanal makalesini yayınla",
    hu: "Csatorna-cikk közzététele",
  },
  pushMenu: {
    en: "Push menu_config",
    ru: "Отправить menu_config",
    de: "menu_config senden",
    fr: "Pousser menu_config",
    it: "Invia menu_config",
    nl: "menu_config pushen",
    cs: "Odeslat menu_config",
    "zh-Hans": "推送菜单 menu_config",
    "zh-Hant": "推送選單 menu_config",
    es: "Enviar menu_config",
    pl: "Wyślij menu_config",
    ja: "menu_config を送信",
    th: "ส่ง menu_config",
    fi: "Lähetä menu_config",
    uk: "Надіслати menu_config",
    bg: "Изпрати menu_config",
    tr: "menu_config gönder",
    hu: "menu_config küldése",
  },
  standard: {
    en: "Send a standard card",
    ru: "Отправить карточку standard",
    de: "Standard-Karte senden",
    fr: "Envoyer une carte standard",
    it: "Invia una carta standard",
    nl: "Standardkaart sturen",
    cs: "Odeslat kartu standard",
    "zh-Hans": "发 standard 卡",
    "zh-Hant": "發 standard 卡",
    es: "Enviar una tarjeta standard",
    pl: "Wyślij kartę standard",
    ja: "standard カードを送る",
    th: "ส่งการ์ดแบบ standard",
    fi: "Lähetä standard-kortti",
    uk: "Надіслати картку standard",
    bg: "Изпрати standard карта",
    tr: "standard kart gönder",
    hu: "standard kártya küldése",
  },
  receipt: {
    en: "Send a receipt card",
    ru: "Отправить карточку receipt",
    de: "Beleg-Karte senden",
    fr: "Envoyer une carte receipt",
    it: "Invia una carta receipt",
    nl: "Bon-kaart sturen",
    cs: "Odeslat kartu receipt",
    "zh-Hans": "发 receipt 卡",
    "zh-Hant": "發 receipt 卡",
    es: "Enviar una tarjeta receipt",
    pl: "Wyślij kartę receipt",
    ja: "receipt カードを送る",
    th: "ส่งการ์ดแบบ receipt",
    fi: "Lähetä receipt-kortti",
    uk: "Надіслати картку receipt",
    bg: "Изпрати receipt карта",
    tr: "receipt kart gönder",
    hu: "receipt kártya küldése",
  },
  security: {
    en: "Send a security alert card",
    ru: "Отправить карточку security",
    de: "Sicherheits-Karte senden",
    fr: "Envoyer une carte security",
    it: "Invia una carta security",
    nl: "Beveiligingskaart sturen",
    cs: "Odeslat bezpečnostní kartu",
    "zh-Hans": "发 security 告警卡",
    "zh-Hant": "發 security 告警卡",
    es: "Enviar una tarjeta security",
    pl: "Wyślij kartę security",
    ja: "security 警報カードを送る",
    th: "ส่งการ์ดแจ้งเตือน security",
    fi: "Lähetä security-härtikortti",
    uk: "Надіслати security-картку сповіщення",
    bg: "Изпрати security карта за предупреждение",
    tr: "security uyarı kartı gönder",
    hu: "security riasztókártya küldése",
  },
  poll: {
    en: "Open an anonymous poll",
    ru: "Запустить анонимный опрос",
    de: "Anonyme Abstimmung starten",
    fr: "Lancer un sondage anonyme",
    it: "Apri un sondaggio anonimo",
    nl: "Anonieme poll starten",
    cs: "Spustit anonymní anketu",
    "zh-Hans": "发起匿名投票",
    "zh-Hant": "發起匿名投票",
    es: "Abrir una encuesta anónima",
    pl: "Uruchom anonimową ankietę",
    ja: "匿名投票を開始",
    th: "เปิดโพลล์ไม่ระบุตัวตน",
    fi: "Käynnistä anonyymi kysely",
    uk: "Запустити анонімне опитування",
    bg: "Стартирай анонимна анкета",
    tr: "Anonim anket aç",
    hu: "Névtelen szavazás indítása",
  },
  rotate: {
    en: "Trigger an epoch key rotation",
    ru: "Запустить ротацию ключей эпохи",
    de: "Epoch-Schlüsselrotation auslösen",
    fr: "Déclencher une rotation de clé d'epoch",
    it: "Attiva la rotazione delle chiavi epoch",
    nl: "Epoch-sleutelrotatie triggeren",
    cs: "Spustit rotaci epoch klíče",
    "zh-Hans": "触发 Epoch 密钥轮换",
    "zh-Hant": "觸發 Epoch 金鑰輪換",
    es: "Activar una rotación de clave de epoch",
    pl: "Uruchom rotację klucza epoki",
    ja: "Epoch 鍵のローテーションを実行",
    th: "เริ่มการหมุนเวียนกุญแจ epoch",
    fi: "Käynnistä epoch-avaimen kierto",
    uk: "Запустити ротацію ключа епохи",
    bg: "Стартирай ротация на epoch ключ",
    tr: "Epoch anahtar dönüşümünü tetikle",
    hu: "Epoch-kulcsrotáció indítása",
  },
  reset: {
    en: "Reset the demo",
    ru: "Сбросить демо",
    de: "Demo zurücksetzen",
    fr: "Réinitialiser la démo",
    it: "Reimposta la demo",
    nl: "Demo resetten",
    cs: "Resetovat demo",
    "zh-Hans": "重置演示",
    "zh-Hant": "重置示範",
    es: "Reiniciar la demo",
    pl: "Zresetuj demo",
    ja: "デモをリセット",
    th: "รีเซ็ตเดโม",
    fi: "Nollaa demo",
    uk: "Скинути демо",
    bg: "Нулирай демото",
    tr: "Demoyu sıfırla",
    hu: "Demó visszaállítása",
  },
};

const HINTS: Record<string, Localized<string>> = {
  publish: {
    en: "The button at the foot of the article IS the deep link `popopx://service?uri=<address>&ref=<article id>`: tapping it is what moves the phone into the conversation and emits the `::REF::` uplink.",
    ru: "Кнопка внизу статьи — это и есть диплейнк `popopx://service?uri=<address>&ref=<article id>`: только нажатие переносит телефон в диалог и отправляет вверх кадр `::REF::`.",
    de: "Der Button am Fuß des Artikels IST der Deep Link `popopx://service?uri=<address>&ref=<article id>`: nur das Antippen wechselt ins Gespräch und löst den `::REF::`-Uplink aus.",
    fr: "Le bouton en bas de l'article EST le lien profond `popopx://service?uri=<address>&ref=<article id>` : le tap seul bascule le téléphone dans la conversation et émet la trame montante `::REF::`.",
    it: "Il pulsante in fondo all'articolo È il deep link `popopx://service?uri=<address>&ref=<article id>`: solo il tocco porta il telefono nella conversazione ed emette l'uplink `::REF::`.",
    nl: "De knop onderaan het artikel IS de deeplink `popopx://service?uri=<address>&ref=<article id>`: alleen tikken brengt de telefoon naar het gesprek en zendt de `::REF::`-uplink.",
    cs: "Tlačítko na konci článku JE deep link `popopx://service?uri=<address>&ref=<article id>`: právě tapnutí přenese telefon do konverzace a vyšle rámec `::REF::`.",
    "zh-Hans": "图文里那条「在服务号里办理」就是 popopx://service?uri=<address>&ref=<article id> 深链；粉丝点它才会跳进对话并回一条 ::REF::。",
    "zh-Hant": "圖文裡那條「在服務號裡辦理」就是 popopx://service?uri=<address>&ref=<article id> 深鏈；粉絲點它才會跳進對話並回一則 ::REF::。",
    es: "El botón del pie del artículo ES el enlace profundo `popopx://service?uri=<address>&ref=<article id>`: solo al tocarlo el teléfono entra en la conversación y devuelve un `::REF::`.",
    pl: "Przycisk na dole artykułu TO głęboki link `popopx://service?uri=<address>&ref=<article id>`: tylko jego dotknięcie przenosi telefon do rozmowy i wysyła ramkę `::REF::`.",
    ja: "記事のいちばん下のボタンがまさに `popopx://service?uri=<address>&ref=<article id>` ディープリンクです。タップして初めてスマホが会話に切り替わり、`::REF::` を上りに返します。",
    th: "ปุ่มท้ายบทความก็คือดีพลิงก์ `popopx://service?uri=<address>&ref=<article id>` นั่นเอง ต้องแตะถึงจะพาโทรศัพท์เข้าบทสนทนาและส่ง `::REF::` ขาขึ้น",
    fi: "Artikkelin alareunan painike ON syvälinkki `popopx://service?uri=<address>&ref=<article id>`: vain napautus siirtää puhelimen keskusteluun ja lähettää `::REF::`-uplinkin.",
    uk: "Кнопка внизу статті — це й є диплінк `popopx://service?uri=<address>&ref=<article id>`: лише натискання переносить телефон у розмову й надсилає кадр `::REF::`.",
    bg: "Бутонът под статията Е дълбоката връзка `popopx://service?uri=<address>&ref=<article id>`: само докосването прехвърля телефона в разговора и изпраща `::REF::` нагоре.",
    tr: "Makalenin altındaki düğme zaten `popopx://service?uri=<address>&ref=<article id>` derin bağlantısıdır: telefona konuşmayı yalnızca dokunuş getirir ve `::REF::` yukarı çerçevesini gönderir.",
    hu: "A cikk alján lévő gomb MAGA a mélylink (`popopx://service?uri=<address>&ref=<article id>`): csak rá koppintva lép a telefon a beszélgetésbe, és indul el a `::REF::` feltöltési keret.",
  },
  pushMenu: {
    en: "The menu arrives as a control frame beside the message, three entries at most. After Push, both the log and the relay panel gain an `mc` frame.",
    ru: "Меню приходит управляющим кадром рядом с сообщением, не больше трёх пунктов. После «Отправить» и в журнале, и на панели ретранслятора появляется кадр `mc`.",
    de: "Das Menü kommt als Steuerframe neben der Nachricht, maximal drei Einträge. Nach dem Senden taucht in Log und Relay-Panel ein `mc`-Frame auf.",
    fr: "Le menu arrive comme trame de contrôle à côté du message, trois entrées au plus. Après l'envoi, une trame `mc` s'ajoute au journal et au panneau relais.",
    it: "Il menu arriva come frame di controllo accanto al messaggio, tre voci al massimo. Dopo l'invio, sia il log sia il pannello relay guadagnano un frame `mc`.",
    nl: "Het menu komt als controleframe naast het bericht, maximaal drie items. Na pushen verschijnt er een `mc`-frame in het log en het relaypaneel.",
    cs: "Nabídka přichází jako řídicí rámec vedle zprávy, maximálně tři položky. Po odeslání se v logu i na relay panelu objeví rámec `mc`.",
    "zh-Hans": "菜单是随 message 一起下发的控制帧，最多三条；点「推送」后左栏的日志与中继面板都会多出一条 mc 帧。",
    "zh-Hant": "選單是隨 message 一併下發的控制訊框，最多三條；點「推送」後左欄日誌與中繼面板都會多出一條 mc 訊框。",
    es: "El menú llega como trama de control junto al mensaje, tres entradas como máximo. Tras enviarlo, el registro y el panel de relay ganan una trama `mc`.",
    pl: "Menu przychodzi jako ramka sterująca obok wiadomości, maksymalnie trzy pozycje. Po wysłaniu w logu i w panelu przekaźnika pojawia się ramka `mc`.",
    ja: "メニューはメッセージに添えられた制御フレームで、最大 3 項目です。「送信」を押すとログにもリレーパネルにも `mc` フレームが 1 行増えます。",
    th: "เมนูมากับเฟรมควบคุมข้างข้อความ มีได้มากสุด 3 รายการ หลังกดส่ง ทั้งบันทึกและแผงรีเลย์จะมีเฟรม `mc` เพิ่มอีกแถว",
    fi: "Valikko tulee ohjauskehyksenä viestin vieressä, korkeintaan kolme kohtaa. Lähetyksen jälkeen sekä lokista että relepaneelista löytyy uusi `mc`-kehys.",
    uk: "Меню приходить як керуючий кадр поруч із повідомленням, не більше трьох пунктів. Після надсилання в журналі та на панелі ретранслятора зʼявляється кадр `mc`.",
    bg: "Менюто идва като контролираща рамка до съобщението, най-много три елемента. След изпращането в дневника и в ретранслаторния панел се появява рамка `mc`.",
    tr: "Menü, mesajın yanında bir kontrol çerçevesi olarak gelir, en fazla üç madde. Gönderimden sonra hem günlükte hem aktarma düğümü panelinde bir `mc` çerçevesi belirir.",
    hu: "A menü a üzenet mellé tartó vezérlő keretként érkezik, legfeljebb három bejegyzéssel. A küldés után mind a naplóban, mind az átvivő panelen megjelén egy `mc` keret.",
  },
  cards: {
    en: "The three card styles are a hard-coded enum: standard, receipt, security.",
    ru: "Стиля карточек всего три и это жёсткий перечислимый тип: standard, receipt, security.",
    de: "Die drei Kartenstile sind ein hart kodiertes Enum: standard, receipt, security.",
    fr: "Les trois styles de carte sont une énumération figée : standard, receipt, security.",
    it: "I tre stili di carta sono un enum hard-coded: standard, receipt, security.",
    nl: "De drie kaartstijlen zijn een vast enum: standard, receipt, security.",
    cs: "Tři styly karet jsou natvrdo definovaný enum: standard, receipt, security.",
    "zh-Hans": "三种卡片样式是写死的枚举，网关只认 standard / receipt / security。",
    "zh-Hant": "三種卡片樣式是寫死的列舉，閘道只認 standard / receipt / security。",
    es: "Los tres estilos de tarjeta son un enum fijo en el código: standard, receipt, security.",
    pl: "Trzy style kart to na stałe zapisany enum: standard, receipt, security.",
    ja: "カードスタイルはハードコードされた列挙値で、standard / receipt / security の 3 つだけです。",
    th: "สไตล์การ์ด 3 แบบเป็น enum ที่กำหนดไว้ตายตัว: standard, receipt, security",
    fi: "Kolme korttityyliä on kooditettu enum: standard, receipt, security.",
    uk: "Стилі карток — жорстко заданий перелік: standard, receipt, security.",
    bg: "Трите стила на картите са твърдо записано изброяване: standard, receipt, security.",
    tr: "Üç kart stili sabit bir enumdur: standard, receipt, security.",
    hu: "A három kártyastílus beégetett enum: standard, receipt, security.",
  },
  poll: {
    en: "A poll card is keyed by cardId: a vote comes back as an `m:\"u\"` update, so the bar moves inside the same bubble instead of pushing a second message.",
    ru: "Карточка опроса привязана по cardId: голос возвращается обновлением `m:\"u\"`, поэтому полоса двигается в том же пузыре, а не вторым сообщением.",
    de: "Eine Poll-Karte wird über cardId identifiziert: eine Stimme kommt als `m:\"u\"`-Update zurück, der Balken bewegt sich also in derselben Blase statt einer zweiten Nachricht.",
    fr: "La carte de sondage est identifiée par cardId : un vote revient en mise à jour `m:\"u\"`, la barre bouge donc dans la même bulle au lieu de pousser un second message.",
    it: "La carta del sondaggio è chiaveata da cardId: un voto torna come aggiornamento `m:\"u\"`, quindi la barra si muove nella stessa bubble invece di inviare un secondo messaggio.",
    nl: "Een pollkaart wordt herkend aan cardId: een stem komt terug als `m:\"u\"`-update, dus de balk beweegt in dezelfde bubble in plaats van een tweede bericht te pushen.",
    cs: "Karta ankety se rozpozná podle cardId: hlas se vrací jako aktualizace `m:\"u\"`, takže se posuvník pohybuje v téže bublině místo druhé zprávy.",
    "zh-Hans": "投票卡按 cardId 认人：投出去的是 m:\"u\" 的更新帧，进度条在同一颗气泡里移动，不会再冒一条新消息。",
    "zh-Hant": "投票卡依 cardId 認人：投出去的是 m:\"u\" 的更新訊框，進度條在同一顆氣泡裡移動，不會再冒出一則新訊息。",
    es: "La tarjeta de encuesta se identifica por cardId: el voto vuelve como actualización `m:\"u\"`, así que la barra se mueve en la misma burbuja en lugar de mandar un segundo mensaje.",
    pl: "Karta ankiety jest rozpoznawana po cardId: głos wraca jako aktualizacja `m:\"u\"`, więc pasek przesuwa się w tym samym bąbelku zamiast dorzucać drugą wiadomość.",
    ja: "投票カードは cardId で識別されます。票は `m:\"u\"` の更新として戻るため、進捗バーは同じ気泡内で動き、メッセージは増えません。",
    th: "การ์ดโพลล์จดจำกันด้วย cardId: เสียงที่โหวตจะกลับมาเป็นเฟรมอัปเดต `m:\"u\"` แถบความคืบหน้าจึงขยับในฟองเดิมโดยไม่ส่งข้อความใหม่",
    fi: "Kyselykortti tunnistetaan cardId:n avulla: ääni palaa päivityksenä `m:\"u\"`, joten palkki liikkuu samassa kuplassa toisen viestin sijaista.",
    uk: "Картку опитування впізнають за cardId: голос повертається оновленням `m:\"u\"`, тому смуга рухається в тій самій хмаринці замість другого повідомлення.",
    bg: "Картата за анкета се разпознава по cardId: гласът се връща като актуализация `m:\"u\"`, затова лентата се мести в същия балон вместо да изпрати второ съобщение.",
    tr: "Anket kartı cardId ile tanınır: oy `m:\"u\"` güncellemesi olarak geri gelir, bu yüzden çubuk ikinci bir mesaj göndermek yerine aynı balonun içinde hareket eder.",
    hu: "A szavazókártyát cardId azonosítja: a szavazat `m:\"u\"` frissítésként tér vissza, így a sáv ugyanabban a buborékban mozog, nem küld második üzenetet.",
  },
  rotate: {
    en: "A rotation frame carries only the sealed envelope; the new epoch key lives inside the box. This page performs no ChaCha20-Poly1305 or Ed25519 — the nonce, ciphertext and signature below are examples built here, in the browser.",
    ru: "Кадр ротации несёт только запечатанный конверт; новый ключ эпохи лежит внутри ящика. Эта страница не выполняет ни ChaCha20-Poly1305, ни Ed25519 — nonce, шифротекст и подпись ниже примеры, собранные прямо в браузере.",
    de: "Ein Rotations-Frame trägt nur den versiegelten Umschlag; der neue Epoch-Schlüssel steckt in der Box. Diese Seite führt weder ChaCha20-Poly1305 noch Ed25519 aus — nonce, Chiffretext und Signatur unten sind hier im Browser gebaute Beispiele.",
    fr: "Une trame de rotation ne porte que l'enveloppe scellée ; la nouvelle clé d'epoch est dans la boîte. Cette page n'exécute ni ChaCha20-Poly1305 ni Ed25519 — nonce, chiffré et signature ci-dessous sont des exemples construits dans le navigateur.",
    it: "Un frame di rotazione porta solo la busta sigillata; la nuova chiave epoch sta dentro il box. Questa pagina non esegue né ChaCha20-Poly1305 né Ed25519: nonce, ciphertext e firma sotto sono esempi costruiti nel browser.",
    nl: "Een rotatieframe bevat alleen de verzegelde envelop; de nieuwe epochsleutel zit in de doos. Deze pagina voert geen ChaCha20-Poly1305 of Ed25519 uit — nonce, ciphertext en handtekening hieronder zijn in de browser gebouwde voorbeelden.",
    cs: "Rotační rámec nese pouze zapečetěnou obálku; nový epoch klíč je uvnitř schránky. Tato stránka nespouští ani ChaCha20-Poly1305, ani Ed25519 — nonce, šifrotext a podpis níže jsou příklady sestavené v prohlížeči.",
    "zh-Hans": "轮换帧只带密文信封，新的 Epoch 密钥在盒子里。本页不会真的做 ChaCha20-Poly1305 与 Ed25519：下面那串 nonce/密文/签名是当场拼出来的示例。",
    "zh-Hant": "輪換訊框只帶密信封裝，新的 Epoch 金鑰在盒子裡。本頁不會真的跑 ChaCha20-Poly1305 與 Ed25519：下面的 nonce/密文/簽名是當場拼出的範例。",
    es: "Un frame de rotación solo lleva el sobre sellado; la nueva clave de epoch vive dentro de la caja. Esta página no ejecuta ni ChaCha20-Poly1305 ni Ed25519: el nonce, el cifrado y la firma de abajo son ejemplos armados en el navegador.",
    pl: "Ramka rotacji niesie wyłącznie zapieczętowaną kopertę; nowy klucz epoki jest w środku. Ta strona nie wykonuje ani ChaCha20-Poly1305, ani Ed25519 — nonce, szyfrogram i podpis poniżej to przykłady zbudowane w przeglądarce.",
    ja: "ローテーションフレームが運ぶのは封緘されたエンベロープだけで、新しい Epoch 鍵はその内側に入ります。このページは ChaCha20-Poly1305 も Ed25519 も実行しません。下の nonce・暗号文・署名はブラウザ内で組み立てただけの例です。",
    th: "เฟรมหมุนเวียนพกแค่ซองที่ซีลปิด กุญแจ epoch ใหม่อยู่ในกล่อง หน้านี้ไม่ได้รัน ChaCha20-Poly1305 หรือ Ed25519 จริง — nonce ciphertext และลายเซ็นที่เห็นด้านล่างเป็นตัวอย่างที่ประกอบขึ้นในเบราว์เซอร์",
    fi: "Kiertokehys kantaa vain sinetöidyn kirjeen; uusi epoch-avain on laatikon sisällä. Tämä sivu ei suorita ChaCha20-Poly1305:ttä eikä Ed25519:ää — nonce, salateksti ja allekirjoitus alla ovat selaimessa koottuja esimerkkejä.",
    uk: "Кадр ротації несе лише запечатаний конверт; новий ключ епохи лежить у боксі. Ця сторінка не виконує ні ChaCha20-Poly1305, ні Ed25519 — nonce, шифротекст і підпис нижче це приклади, зібрані в браузері.",
    bg: "Кадърът за ротация носи само запечатания плик; новият epoch ключ е в кутията. Тази страница не изпълнява нито ChaCha20-Poly1305, нито Ed25519 — nonce, криптотекстът и подписът долу са примери, сгънени в четеца.",
    tr: "Dönüşüm çerçevesi yalnızca mühürlü zarfı taşır; yeni epoch anahtarı kutunun içindedir. Bu sayfa ChaCha20-Poly1305 de Ed25519 de çalıştırmaz — aşağıdaki nonce, şifreli metin ve imza tarayıcıda üretilmiş örneklerdir.",
    hu: "A rotációs keret csak a lepecsételt borítékot viszi; az új epoch-kulcs a dobozban lakik. Ez az oldal sem ChaCha20-Poly1305-öt, sem Ed25519-et nem futtat — az alábbi nonce, titkosított szöveg és aláírás a böngészőben összerakott példák.",
  },
};

const ARTICLE_TITLE: Localized<string> = {
  en: "This week: Yangshan honey peaches, tree to door in 48 hours",
  ru: "На этой неделе: медовые персики из Янгшаня, с дерева до двери за 48 часов",
  de: "Diese Woche: Yangshan-Honigpfirsiche, in 48 Stunden vom Baum zur Tür",
  fr: "Cette semaine : pêches de miel de Yangshan, de l'arbre à la porte en 48 heures",
  it: "Questa settimana: pesche miele di Yangshan, dall'albero alla porta in 48 ore",
  nl: "Deze week: Yangshan-honingsperziken, van boom tot deur in 48 uur",
  cs: "Tento týden: medové broskve z Yangšanu, ze stromu ke dveřím za 48 hodin",
  "zh-Hans": "本周到货：阳山白桃，48 小时内从树上到你手上",
  "zh-Hant": "本週到貨：陽山白桃，48 小時內從樹上到你手上",
  es: "Esta semana: melocotones de miel de Yangshan, del árbol a tu puerta en 48 horas",
  pl: "W tym tygodniu: brzoskwinie miodowe z Yangshan, z drzewa pod drzwi w 48 godzin",
  ja: "今週の入荷：陽山の白桃、樹上からあなたの手まで 48 時間",
  th: "สัปดาห์นี้: พีชน้ำผึ้งหยางซาน จากต้นถึงหน้าประตูใน 48 ชั่วโมง",
  fi: "Tällä viikolla: Yangshanin hunajapersikat, puusta ovelle 48 tunnissa",
  uk: "Цього тижня: медові персики з Янгшаня, з дерева під двері за 48 годин",
  bg: "Тази седмица: медени праскови от Янгшан, от дървото до вратата за 48 часа",
  tr: "Bu hafta: Yangshan bal şeftalileri, ağaçtan kapınıza 48 saatte",
  hu: "Ezen a héten: yangshani mézbarack, a fáról a küszöböd alá 48 óra alatt",
};

const ARTICLE_BODY: Localized<string> = {
  en: "Three photos, shipped straight from the orchard. To check your own order, or switch it to store pickup, handle it inside the service account.",
  ru: "Три фотографии, отправка прямо из сада. Проверить свой заказ или перевезти его на самовывоз из магазина можно в сервисном аккаунте.",
  de: "Drei Fotos, direkt aus dem Obstgarten versandt. Die eigene Bestellung prüfen oder auf Abholung im Laden umstellen — das geht im Service-Konto.",
  fr: "Trois photos, expédiées directement du verger. Pour consulter votre commande ou la basculer en retrait boutique, cela se passe dans le compte de service.",
  it: "Tre foto, spedite direttamente dal frutteto. Per controllare il tuo ordine o spostarlo sul ritiro in negozio, fallo dentro l'account di servizio.",
  nl: "Drie foto's, direct uit de boomgaard verzonden. Je eigen bestelling checken of omzetten naar ophalen in de winkel doe je in de serviceaccount.",
  cs: "Tři fotky, odeslané rovnou ze sadu. Vlastní objednávku zkontrolujete nebo přepnete na vyzvednutí v prodejně v servisním účtu.",
  "zh-Hans": "配图三张，产地直发。想查自己的那单，或者想把配送方式改成门店自提，就在服务号里办理。",
  "zh-Hant": "配圖三張，產地直發。想查自己的那單，或想把配送方式改成門市自取，就在服務號裡辦理。",
  es: "Tres fotos, enviado directo de la finca. Para revisar tu pedido o cambiarlo a recogida en tienda, tramítalo dentro de la cuenta de servicio.",
  pl: "Trzy zdjęcia, wysyłka prosto z sadu. Własne zamówienie sprawdzisz albo przeniesiesz na odbiór w sklepie w koncie serwisowym.",
  ja: "写真 3 枚、産地からそのまま発送。自分の注文を確認したり、店頭受け取りに変えたりするのはサービスアカウントの中で行います。",
  th: "ภาพประกอบ 3 รูป ส่งตรงจากสวน จะเช็คออเดอร์ของตัวเองหรือเปลี่ยนเป็นรับเองที่ร้าน ก็จัดการได้ในบัญชีบริการ",
  fi: "Kolme kuvaa, lähetys suoraan tarhasta. Om tilauksen voi tarkistaa tai vaihtaa myymälänoutoon palvelutilissä.",
  uk: "Три фото, відправка прямо з саду. Власне замовлення можна перевірити чи перевести на самовивіз із магазину в сервісному акаунті.",
  bg: "Три снимки, пратка направо от градината. Собствената поръчка се проверя и прехвърля към вземане от магазина в сервизния акаунт.",
  tr: "Üç fotoğraf, doğruca bahçeden kargo. Kendi siparişini kontrol etmek veya mağazadan teslim almaya çevirmek için Hizmet Hesabı içini kullan.",
  hu: "Három fotó, egyenesen a gyümölcsösből küldve. A saját rendelésedet ellenőrizheted, vagy átállíthatod bolti átvételre a szolgáltatási fiókban.",
};

const ARTICLE_CTA: Localized<string> = {
  en: "Handle it in the service account",
  ru: "Оформить в сервисном аккаунте",
  de: "Im Service-Konto erledigen",
  fr: "À faire dans le compte de service",
  it: "Gestisci nell'account di servizio",
  nl: "Regel het in de serviceaccount",
  cs: "Vyřídit v servisním účtu",
  "zh-Hans": "在服务号里办理",
  "zh-Hant": "在服務號裡辦理",
  es: "Gestiona tu cuenta de servicio",
  pl: "Załatw to w koncie serwisowym",
  ja: "サービスアカウントで手続き",
  th: "จัดการในบัญชีบริการ",
  fi: "Hoida palvelutilissä",
  uk: "Оформити в сервісному акаунті",
  bg: "Уредете в сервизния акаунт",
  tr: "Hizmet Hesabı içinde hallet",
  hu: "Intézd el a szolgáltatási fiókban",
};

const CARD_COPY: Record<CardStyle, { title: Localized<string>; body: Localized<string>; fields: readonly WireField[]; actions: readonly WireAction[] }> = {
  standard: {
    title: {
      en: "Your member benefit has landed",
      ru: "Привилегия участника зачислена",
      de: "Dein Mitglieds-Vorteil ist eingetroffen",
      fr: "Ton avantage de membre est arrivé",
      it: "Il vantaggio da membro è accreditato",
      nl: "Je voordeel als lid is bijgeschreven",
      cs: "Výhoda člena je připsaná",
      "zh-Hans": "会员权益已到账",
      "zh-Hant": "會員權益已到帳",
      es: "Tu ventaja de socio ya está en la cuenta",
      pl: "Korzyść członkowska została przyznana",
      ja: "会員特典が付与されました",
      th: "สิทธิสมาชิกเข้าบัญชีแล้ว",
      fi: "Jäsenetuutesi on kirjattu",
      uk: "Пільгу учасника нараховано",
      bg: "Членската ви привилегия е преведена",
      tr: "Üyelik avantajınız hesabınıza yattı",
      hu: "A tagsági kedvezmény megérkezett a fiókodba",
    },
    body: {
      en: "This week's fruit voucher is in your account and stays valid until Sunday 24:00.",
      ru: "Скидка на фрукты этой недели лежит в вашем аккаунте и действует до воскресенья 24:00.",
      de: "Der Fruchtgutschein dieser Woche liegt in deinem Konto und gilt bis Sonntag 24:00.",
      fr: "Le bon fruité de la semaine est dans ton compte, valable jusqu'à dimanche 24:00.",
      it: "Il voucher frutta di questa settimana è nel tuo account, valido fino a domenica 24:00.",
      nl: "De fruitvoucher van deze week staat in je account en geldt tot zondag 24:00.",
      cs: "Ovocný voucher tohoto týdne je ve vašem účtu a platí do neděle 24:00.",
      "zh-Hans": "本周的鲜果折扣券已放进你的账户，有效期到周日 24:00。",
      "zh-Hant": "本週的鮮果折價券已放進你的帳戶，有效期限到週日 24:00。",
      es: "El vale de fruta de esta semana está en tu cuenta y es válido hasta el domingo a las 24:00.",
      pl: "Kupon owocowy z tego tygodnia jest na twoim koncie i ważny do niedzieli 24:00.",
      ja: "今週の生果クーポンはアカウントに付与済み、日曜 24:00 まで有効です。",
      th: "คูปองผลไม้สัปดาห์นี้อยู่ในบัญชีคุณ ใช้ได้ถึงวันอาทิตย์ 24:00",
      fi: "Tämän viikon hedelmäseteli on tililläsi ja voimassa sunnuntaihin 24:00 asti.",
      uk: "Купон на фрукти цього тижня у вашому акаунті, діє до неділі 24:00.",
      bg: "Ваучерът за плодове за седмицата е в сметката ви и валиден до неделя 24:00.",
      tr: "Bu haftanın meyve kuponu hesabında, pazar 24:00'e kadar geçerli.",
      hu: "A héten járó gyümölcsutalvány a fiókodban van, vasárnap 24:00-ig érvényes.",
    },
    fields: [
      {
        k: {
          en: "Tier",
          ru: "Уровень",
          de: "Stufe",
          fr: "Palier",
          it: "Livello",
          nl: "Niveau",
          cs: "Úroveň",
          "zh-Hans": "等级",
          "zh-Hant": "等級",
          es: "Nivel",
          pl: "Poziom",
          ja: "ランク",
          th: "ระดับ",
          fi: "Taso",
          uk: "Рівень",
          bg: "Ниво",
          tr: "Seviye",
          hu: "Szint",
        },
        v: {
          en: "Black card",
          ru: "Чёрная карта",
          de: "Schwarze Karte",
          fr: "Carte noire",
          it: "Carta nera",
          nl: "Zwarte kaart",
          cs: "Černá karta",
          "zh-Hans": "黑卡会员",
          "zh-Hant": "黑卡會員",
          es: "Tarjeta negra",
          pl: "Czarna karta",
          ja: "ブラックカード会員",
          th: "สมาชิกบัตรดำ",
          fi: "Musta kortti",
          uk: "Чорна картка",
          bg: "Черна карта",
          tr: "Kara kart",
          hu: "Fekete kártya",
        },
      },
      {
        k: {
          en: "Voucher",
          ru: "Ваучер",
          de: "Gutschein",
          fr: "Bon",
          it: "Buono",
          nl: "Bon",
          cs: "Poukaz",
          "zh-Hans": "券号",
          "zh-Hant": "券號",
          es: "Vale",
          pl: "Kupon",
          ja: "クーポン番号",
          th: "เลขคูปอง",
          fi: "Seteli",
          uk: "Ваучер",
          bg: "Ваучер",
          tr: "Kupon",
          hu: "Utalvány",
        },
        v: {
          en: "VC-2026-1122-0417",
          ru: "VC-2026-1122-0417",
          de: "VC-2026-1122-0417",
          fr: "VC-2026-1122-0417",
          it: "VC-2026-1122-0417",
          nl: "VC-2026-1122-0417",
          cs: "VC-2026-1122-0417",
          "zh-Hans": "VC-2026-1122-0417",
          "zh-Hant": "VC-2026-1122-0417",
          es: "VC-2026-1122-0417",
          pl: "VC-2026-1122-0417",
          ja: "VC-2026-1122-0417",
          th: "VC-2026-1122-0417",
          fi: "VC-2026-1122-0417",
          uk: "VC-2026-1122-0417",
          bg: "VC-2026-1122-0417",
          tr: "VC-2026-1122-0417",
          hu: "VC-2026-1122-0417",
        },
        mono: true,
      },
      {
        k: {
          en: "Valid until",
          ru: "Действителен до",
          de: "Gültig bis",
          fr: "Valable jusqu'au",
          it: "Valido fino al",
          nl: "Geldig tot",
          cs: "Platí do",
          "zh-Hans": "有效期",
          "zh-Hant": "有效期限",
          es: "Válido hasta",
          pl: "Ważny do",
          ja: "有効期限",
          th: "ใช้ได้ถึง",
          fi: "Voimassa asti",
          uk: "Діє до",
          bg: "Валиден до",
          tr: "Geçerlilik",
          hu: "Érvényes",
        },
        v: {
          en: "2026-11-29 24:00 UTC",
          ru: "2026-11-29 24:00 UTC",
          de: "2026-11-29 24:00 UTC",
          fr: "2026-11-29 24:00 UTC",
          it: "2026-11-29 24:00 UTC",
          nl: "2026-11-29 24:00 UTC",
          cs: "2026-11-29 24:00 UTC",
          "zh-Hans": "2026-11-29 24:00 UTC",
          "zh-Hant": "2026-11-29 24:00 UTC",
          es: "2026-11-29 24:00 UTC",
          pl: "2026-11-29 24:00 UTC",
          ja: "2026-11-29 24:00 UTC",
          th: "2026-11-29 24:00 UTC",
          fi: "2026-11-29 24:00 UTC",
          uk: "2026-11-29 24:00 UTC",
          bg: "2026-11-29 24:00 UTC",
          tr: "2026-11-29 24:00 UTC",
          hu: "2026-11-29 24:00 UTC",
        },
      },
    ],
    actions: [
      {
        id: "detail",
        title: {
          en: "Open the benefit page",
          ru: "Открыть страницу привилегий",
          de: "Vorteilsseite öffnen",
          fr: "Ouvrir la page des avantages",
          it: "Apri la pagina dei vantaggi",
          nl: "Voordelenpagina openen",
          cs: "Otevřít stránku výhod",
          "zh-Hans": "查看权益",
          "zh-Hant": "查看權益",
          es: "Abrir la página de ventajas",
          pl: "Otwórz stronę przywilejów",
          ja: "特典ページを開く",
          th: "เปิดหน้าสิทธิพิเศษ",
          fi: "Avaa etusivu",
          uk: "Відкрити сторінку пільг",
          bg: "Отвори страницата с привилегиите",
          tr: "Avantaj sayfasını aç",
          hu: "Előnyoldal megnyitása",
        },
        kind: "open_url",
        style: "primary",
        url: "%s/h5/benefits?popopx_uid=%s&ts=%d&sig=%s"
          .replace("%s", PUBLIC_BASE)
          .replace("%s", PAIRWISE_UID)
          .replace("%d", String(Math.floor(BASE_MS / 1000)))
          .replace("%s", "0c5e9a17d3b842f61e07cc9452ba3d1ef7c60b8a42d1395e7f0cc6a1b3d84295"),
      },
      {
        id: "cancel",
        title: {
          en: "Cancel this voucher",
          ru: "Отменить этот ваучер",
          de: "Diesen Gutschein stornieren",
          fr: "Annuler ce bon",
          it: "Annulla questo voucher",
          nl: "Deze voucher annuleren",
          cs: "Zrušit tento voucher",
          "zh-Hans": "取消这张券",
          "zh-Hant": "取消這張券",
          es: "Anular este vale",
          pl: "Anuluj ten kupon",
          ja: "このクーポンを取り消す",
          th: "ยกเลิกคูปองนี้",
          fi: "Peruuta tämä seteli",
          uk: "Скасувати цей ваучер",
          bg: "Откажи този ваучер",
          tr: "Bu kuponu iptal et",
          hu: "Ennek az utalványnak a törlése",
        },
        kind: "callback",
        style: "secondary",
        payload: "order:cancel:vc-2026-1122-0417",
      },
    ],
  },
  receipt: {
    title: {
      en: "Cold-chain parcel SF7122068401130 is on the road",
      ru: "Холодовая посылка SF7122068401130 в пути",
      de: "Kühlketten-Paket SF7122068401130 ist unterwegs",
      fr: "Le colis en chaîne du froid SF7122068401130 est en route",
      it: "Il pacco in catena del freddo SF7122068401130 è in transito",
      nl: "Gekoeld pakket SF7122068401130 is onderweg",
      cs: "Balík v chladicím řetězci SF7122068401130 je na cestě",
      "zh-Hans": "顺丰冷链 SF7122068401130 已发出",
      "zh-Hant": "順豐冷鏈 SF7122068401130 已發出",
      es: "El paquete en cadena de frío SF7122068401130 está en camino",
      pl: "Przesyłka chłodnicza SF7122068401130 w drodze",
      ja: "コールドチェーン便 SF7122068401130 を発送しました",
      th: "พัสดุห้องเย็น SF7122068401130 ออกจากคลังแล้ว",
      fi: "Kylmäketjupaketti SF7122068401130 on matkalla",
      uk: "Холодильна посилка SF7122068401130 в дорозі",
      bg: "Пратката в студена верига SF7122068401130 е на път",
      tr: "Soğuk zincir paketi SF7122068401130 yola çıktı",
      hu: "A hűtött csomag SF7122068401130 úton van",
    },
    body: {
      en: "Two 1.5 kg gift boxes and four ice packs, arriving inside 36 hours.",
      ru: "Две коробки по 1,5 кг и четыре хладоэлемента, доставка в течение 36 часов.",
      de: "Zwei Geschenkboxen à 1,5 kg und vier Kühlakkus, Zustellung in 36 Stunden.",
      fr: "Deux coffrets de 1,5 kg et quatre plaques eutectiques, livraison sous 36 heures.",
      it: "Due confezioni regalo da 1,5 kg e quattro siberini, consegna entro 36 ore.",
      nl: "Twee geschenkdozen van 1,5 kg en vier koelelementen, binnen 36 uur bezorgd.",
      cs: "Dvě dárkové krabice po 1,5 kg a čtyři chladicí vložky, doručení do 36 hodin.",
      "zh-Hans": "1.5kg 礼盒两份，冰袋四组，预计 36 小时内到达。",
      "zh-Hant": "1.5kg 禮盒兩份，冰袋四組，預計 36 小時內抵達。",
      es: "Dos lotes de regalo de 1,5 kg y cuatro acumuladores de frío, entrega en 36 horas.",
      pl: "Dwie paczki prezentowe po 1,5 kg i cztery wkłady chłodzące, dostawa w 36 godzin.",
      ja: "1.5kg ギフト箱 2 件、保冷剤 4 個、36 時間以内に届く見込みです。",
      th: "กล่องของขวัญ 1.5 กก. 2 กล่อง พร้อมแผ่นทำความเย็น 4 ชุด คาดว่าถึงใน 36 ชั่วโมง",
      fi: "Kaksi 1,5 kg lahjarasiaa ja neljä kylmäelementtiä, perillä 36 tunnissa.",
      uk: "Дві подарункові коробки по 1,5 кг і чотири акумулятори холоду, доставка за 36 годин.",
      bg: "Две дарови кутии по 1,5 кг и четири охладителни елемента, доставка до 36 часа.",
      tr: "1,5 kg'lık iki hediyelik kutu ve dört buz aküsü, 36 saat içinde kapıda.",
      hu: "Két 1,5 kg-os ajándékdoboz és négy hűtőelem, 36 órán belül kézhez ér.",
    },
    fields: [
      {
        k: {
          en: "Order",
          ru: "Заказ",
          de: "Bestellung",
          fr: "Commande",
          it: "Ordine",
          nl: "Bestelling",
          cs: "Objednávka",
          "zh-Hans": "订单",
          "zh-Hant": "訂單",
          es: "Pedido",
          pl: "Zamówienie",
          ja: "注文番号",
          th: "เลขที่ออเดอร์",
          fi: "Tilaus",
          uk: "Замовлення",
          bg: "Поръчка",
          tr: "Sipariş",
          hu: "Rendelés",
        },
        v: {
          en: "A-2026-1122-8843",
          ru: "A-2026-1122-8843",
          de: "A-2026-1122-8843",
          fr: "A-2026-1122-8843",
          it: "A-2026-1122-8843",
          nl: "A-2026-1122-8843",
          cs: "A-2026-1122-8843",
          "zh-Hans": "A-2026-1122-8843",
          "zh-Hant": "A-2026-1122-8843",
          es: "A-2026-1122-8843",
          pl: "A-2026-1122-8843",
          ja: "A-2026-1122-8843",
          th: "A-2026-1122-8843",
          fi: "A-2026-1122-8843",
          uk: "A-2026-1122-8843",
          bg: "A-2026-1122-8843",
          tr: "A-2026-1122-8843",
          hu: "A-2026-1122-8843",
        },
        mono: true,
      },
      {
        k: {
          en: "Amount",
          ru: "Сумма",
          de: "Betrag",
          fr: "Montant",
          it: "Importo",
          nl: "Bedrag",
          cs: "Částka",
          "zh-Hans": "金额",
          "zh-Hant": "金額",
          es: "Importe",
          pl: "Kwota",
          ja: "金額",
          th: "จำนวนเงิน",
          fi: "Määrä",
          uk: "Сума",
          bg: "Сума",
          tr: "Tutar",
          hu: "Összeg",
        },
        v: {
          en: "¥ 216.00",
          ru: "216,00 ¥",
          de: "216,00 ¥",
          fr: "216,00 ¥",
          it: "216,00 ¥",
          nl: "¥ 216,00",
          cs: "216,00 ¥",
          "zh-Hans": "人民币 216.00 元",
          "zh-Hant": "¥ 216.00 元",
          es: "216,00 ¥",
          pl: "216,00 ¥",
          ja: "¥216.00",
          th: "216.00 ¥",
          fi: "216,00 ¥",
          uk: "216,00 ¥",
          bg: "216,00 ¥",
          tr: "216,00 ¥",
          hu: "216,00 ¥",
        },
        mono: true,
      },
      {
        k: {
          en: "State",
          ru: "Состояние",
          de: "Status",
          fr: "État",
          it: "Stato",
          nl: "Status",
          cs: "Stav",
          "zh-Hans": "状态",
          "zh-Hant": "狀態",
          es: "Estado",
          pl: "Stan",
          ja: "状態",
          th: "สถานะ",
          fi: "Tila",
          uk: "Стан",
          bg: "Състояние",
          tr: "Durum",
          hu: "Állapot",
        },
        v: {
          en: "In transit",
          ru: "В пути",
          de: "Unterwegs",
          fr: "En transit",
          it: "In transito",
          nl: "Onderweg",
          cs: "Na cestě",
          "zh-Hans": "运输中",
          "zh-Hant": "運輸中",
          es: "En tránsito",
          pl: "W drodze",
          ja: "輸送中",
          th: "กำลังขนส่ง",
          fi: "Kuljetuksessa",
          uk: "У дорозі",
          bg: "В транспортиране",
          tr: "Taşımada",
          hu: "Szállítás alatt",
        },
      },
    ],
    actions: [
      {
        id: "track",
        title: {
          en: "Track it",
          ru: "Отследить",
          de: "Sendung verfolgen",
          fr: "Suivre le colis",
          it: "Traccia la spedizione",
          nl: "Volg het pakket",
          cs: "Sledovat zásilku",
          "zh-Hans": "查物流",
          "zh-Hant": "查物流",
          es: "Seguir el envío",
          pl: "Śledź przesyłkę",
          ja: "配送状況を確認",
          th: "ตรวจสถานะพัสดุ",
          fi: "Seuraa pakettia",
          uk: "Відстежити посилку",
          bg: "Проследи пратката",
          tr: "Kargoyu izle",
          hu: "Csomag nyomon követése",
        },
        kind: "open_url",
        style: "primary",
        url: "%s/h5/track/A-2026-1122-8843?popopx_uid=%s&ts=%d&sig=%s"
          .replace("%s", PUBLIC_BASE)
          .replace("%s", PAIRWISE_UID)
          .replace("%d", String(Math.floor(BASE_MS / 1000)))
          .replace("%s", "b4d0719ce2a58f6130d9e47b52c8a1f306e9d74bc825103fa7e6b49052dc138f"),
      },
    ],
  },
  security: {
    title: {
      en: "[warning] checkout 5xx ratio over threshold",
      ru: "[warning] доля 5xx в интерфейсе заказов выше порога",
      de: "[warning] 5xx-Anteil der Checkout-Schnittstelle über Schwellwert",
      fr: "[warning] taux 5xx de l'API de commande au-dessus du seuil",
      it: "[warning] percentuale 5xx dell'interfaccia di checkout oltre la soglia",
      nl: "[warning] 5xx-aandeel van de checkout-API boven de drempel",
      cs: "[warning] podíl 5xx na rozhraní pokladny přesahuje práh",
      "zh-Hans": "[warning] 下单接口 5xx 比例超阈值",
      "zh-Hant": "[warning] 下單介面 5xx 比例超閾值",
      es: "[warning] el ratio 5xx de la API de pago supera el umbral",
      pl: "[warning] udział 5xx w interfejsie płatności powyżej progu",
      ja: "[warning] 決済 API の 5xx 比率が閾値を超過",
      th: "[warning] สัดส่วน 5xx ของ API สั่งซื้อเกินเกณฑ์",
      fi: "[warning] kassan 5xx-osuus ylitti kynnyksen",
      uk: "[warning] частка 5xx в інтерфейсі замовлень перевищить поріг",
      bg: "[warning] делът 5xx на checkout интерфейса надхвърли прага",
      tr: "[warning] ödeme arayüzü 5xx oranı eşiği aştı",
      hu: "[warning] a fizetés API 5xx aránya a küszöb felett",
    },
    body: {
      en: "Delivered by Grafana Alertmanager: 3.7% 5xx over the last 5 minutes against a 2% threshold.",
      ru: "Доставлено Grafana Alertmanager: 3,7% ответов 5xx за последние 5 минут при пороге 2%.",
      de: "Zugestellt von Grafana Alertmanager: 3,7 % 5xx in den letzten fünf Minuten bei einem Schwellwert von 2 %.",
      fr: "Acheminé par Grafana Alertmanager : 3,7 % de 5xx sur les 5 dernières minutes pour un seuil de 2 %.",
      it: "Consegnato da Grafana Alertmanager: 3,7% di 5xx negli ultimi 5 minuti contro una soglia del 2%.",
      nl: "Afgeleverd door Grafana Alertmanager: 3,7% 5xx in de laatste 5 minuten tegen een drempel van 2%.",
      cs: "Doručeno přes Grafana Alertmanager: 3,7 % 5xx za posledních 5 minut při prahu 2 %.",
      "zh-Hans": "Grafana Alertmanager 投递：最近 5 分钟 5xx 比例 3.7%，阈值 2%。",
      "zh-Hant": "Grafana Alertmanager 投遞：最近 5 分鐘 5xx 比例 3.7%，閾值 2%。",
      es: "Entregado por Grafana Alertmanager: 3,7% de 5xx en los últimos 5 minutos contra un umbral del 2%.",
      pl: "Dostarczone przez Grafana Alertmanager: 3,7% odpowiedzi 5xx w ostatnich 5 minutach przy progu 2%.",
      ja: "Grafana Alertmanager からの配信：直近 5 分間の 5xx 比率 3.7%、閾値 2%。",
      th: "ส่งโดย Grafana Alertmanager: สัดส่วน 5xx ใน 5 นาทีล่าสุดอยู่ที่ 3.7% ขณะที่เกณฑ์คือ 2%",
      fi: "Toimitettu Grafana Alertmanagerista: 3,7 % 5xx-virheitä viimeisen 5 minuutin aikana 2 % kynnyksellä.",
      uk: "Доставлено Grafana Alertmanager: 3,7% відповідей 5xx за останні 5 хвилин за порогу 2%.",
      bg: "Доставено от Grafana Alertmanager: 3,7% 5xx за последните 5 минути срещу праг от 2%.",
      tr: "Grafana Alertmanager ile iletildi: son 5 dakikada %3,7 5xx, eşik %2.",
      hu: "A Grafana Alertmanager kézbesítette: 3,7% 5xx az elmúlt 5 percben, a küszöb 2%.",
    },
    fields: [
      {
        k: {
          en: "Alert name",
          ru: "Имя алерта",
          de: "Alarmname",
          fr: "Nom de l'alerte",
          it: "Nome allarme",
          nl: "Alarmnaam",
          cs: "Název alarmu",
          "zh-Hans": "告警名称",
          "zh-Hant": "告警名稱",
          es: "Nombre de la alerta",
          pl: "Nazwa alarmu",
          ja: "アラート名",
          th: "ชื่อแจ้งเตือน",
          fi: "Hälytyksen nimi",
          uk: "Назва алерту",
          bg: "Име на алармата",
          tr: "Uyarı adı",
          hu: "Riasztás neve",
        },
        v: {
          en: "checkout 5xx ratio",
          ru: "доля 5xx в оформлении заказов",
          de: "Checkout-5xx-Anteil",
          fr: "taux 5xx de la commande",
          it: "percentuale 5xx checkout",
          nl: "checkout-5xx-aandeel",
          cs: "podíl 5xx pokladny",
          "zh-Hans": "下单接口 5xx 比例",
          "zh-Hant": "下單介面 5xx 比例",
          es: "ratio 5xx de pago",
          pl: "udział 5xx płatności",
          ja: "決済 API の 5xx 比率",
          th: "สัดส่วน 5xx ของการสั่งสินค้า",
          fi: "kassan 5xx-osuus",
          uk: "частка 5xx оформлення замовлень",
          bg: "дел 5xx на поръчките",
          tr: "sipariş 5xx oranı",
          hu: "5xx arány a fizetésnél",
        },
      },
      {
        k: {
          en: "Severity",
          ru: "Важность",
          de: "Schweregrad",
          fr: "Sévérité",
          it: "Gravità",
          nl: "Ernst",
          cs: "Závažnost",
          "zh-Hans": "严重级别",
          "zh-Hant": "嚴重等級",
          es: "Severidad",
          pl: "Poważność",
          ja: "重大度",
          th: "ระดับความรุนแรง",
          fi: "Vakavuus",
          uk: "Важливість",
          bg: "Степен на тежест",
          tr: "Önem derecesi",
          hu: "Súlyosság",
        },
        v: {
          en: SEVERITY_WARNING,
          ru: SEVERITY_WARNING,
          de: SEVERITY_WARNING,
          fr: SEVERITY_WARNING,
          it: SEVERITY_WARNING,
          nl: SEVERITY_WARNING,
          cs: SEVERITY_WARNING,
          "zh-Hans": SEVERITY_WARNING,
          "zh-Hant": SEVERITY_WARNING,
          es: SEVERITY_WARNING,
          pl: SEVERITY_WARNING,
          ja: SEVERITY_WARNING,
          th: SEVERITY_WARNING,
          fi: SEVERITY_WARNING,
          uk: SEVERITY_WARNING,
          bg: SEVERITY_WARNING,
          tr: SEVERITY_WARNING,
          hu: SEVERITY_WARNING,
        },
      },
      {
        k: {
          en: "Status",
          ru: "Статус",
          de: "Alarmstatus",
          fr: "Statut",
          it: "Stato",
          nl: "Alarmstatus",
          cs: "Stav",
          "zh-Hans": "状态",
          "zh-Hant": "狀態",
          es: "Estado",
          pl: "Stan",
          ja: "状態",
          th: "สถานะ",
          fi: "Tila",
          uk: "Статус",
          bg: "Статус",
          tr: "Durum",
          hu: "Állapot",
        },
        v: {
          en: "firing, unacked",
          ru: "срабатывает, не подтверждён",
          de: "feuert, unbestätigt",
          fr: "en cours de déclenchement, non acquitté",
          it: "in scatto, non confermato",
          nl: "vuurt, niet bevestigd",
          cs: "spouští se, nepotvrzeno",
          "zh-Hans": "待确认",
          "zh-Hant": "待確認",
          es: "disparando, sin confirmar",
          pl: "występuje, niepotwierdzony",
          ja: "発報中・未確認",
          th: "กำลังแจ้งเหตุ ยังไม่รับทราบ",
          fi: "laukeaa, ei kuittaukseen",
          uk: "спрацьовує, не підтверджено",
          bg: "активна, не потвърдена",
          tr: "tetikleniyor, onaysız",
          hu: "aktív, el nem ismerve",
        },
      },
      {
        k: {
          en: "Fingerprint",
          ru: "Отпечаток",
          de: "Fingerabdruck",
          fr: "Empreinte",
          it: "Impronta",
          nl: "Afdruk",
          cs: "Otisk",
          "zh-Hans": "指纹",
          "zh-Hant": "指紋",
          es: "Huella",
          pl: "Odcisk",
          ja: "指紋",
          th: "ลายนิ้วมือ",
          fi: "Sormenjälki",
          uk: "Відбиток",
          bg: "Пръстов отпечатък",
          tr: "Parmak izi",
          hu: "Ujjlenyomat",
        },
        v: {
          en: ALERT_FINGERPRINT,
          ru: ALERT_FINGERPRINT,
          de: ALERT_FINGERPRINT,
          fr: ALERT_FINGERPRINT,
          it: ALERT_FINGERPRINT,
          nl: ALERT_FINGERPRINT,
          cs: ALERT_FINGERPRINT,
          "zh-Hans": ALERT_FINGERPRINT,
          "zh-Hant": ALERT_FINGERPRINT,
          es: ALERT_FINGERPRINT,
          pl: ALERT_FINGERPRINT,
          ja: ALERT_FINGERPRINT,
          th: ALERT_FINGERPRINT,
          fi: ALERT_FINGERPRINT,
          uk: ALERT_FINGERPRINT,
          bg: ALERT_FINGERPRINT,
          tr: ALERT_FINGERPRINT,
          hu: ALERT_FINGERPRINT,
        },
        mono: true,
      },
      {
        k: {
          en: "Starts",
          ru: "Начало",
          de: "Beginnt",
          fr: "Démarre",
          it: "Inizio",
          nl: "Start",
          cs: "Začátek",
          "zh-Hans": "开始时间",
          "zh-Hant": "開始時間",
          es: "Inicio",
          pl: "Rozpoczęcie",
          ja: "開始時刻",
          th: "เวลาเริ่ม",
          fi: "Alku",
          uk: "Початок",
          bg: "Начало",
          tr: "Başlangıç",
          hu: "Kezdés",
        },
        v: {
          en: "2026-11-22 01:52 UTC",
          ru: "2026-11-22 01:52 UTC",
          de: "2026-11-22 01:52 UTC",
          fr: "2026-11-22 01:52 UTC",
          it: "2026-11-22 01:52 UTC",
          nl: "2026-11-22 01:52 UTC",
          cs: "2026-11-22 01:52 UTC",
          "zh-Hans": "2026-11-22 01:52 UTC",
          "zh-Hant": "2026-11-22 01:52 UTC",
          es: "2026-11-22 01:52 UTC",
          pl: "2026-11-22 01:52 UTC",
          ja: "2026-11-22 01:52 UTC",
          th: "2026-11-22 01:52 UTC",
          fi: "2026-11-22 01:52 UTC",
          uk: "2026-11-22 01:52 UTC",
          bg: "2026-11-22 01:52 UTC",
          tr: "2026-11-22 01:52 UTC",
          hu: "2026-11-22 01:52 UTC",
        },
        mono: true,
      },
    ],
    actions: [
      {
        id: "alert-ack",
        title: {
          en: "Ack",
          ru: "Подтвердить",
          de: "Quittieren",
          fr: "Acquitter",
          it: "Conferma",
          nl: "Bevestigen",
          cs: "Potvrdit",
          "zh-Hans": "确认",
          "zh-Hant": "確認",
          es: "Confirmar",
          pl: "Potwierdź",
          ja: "確認",
          th: "รับทราบ",
          fi: "Kvitaa",
          uk: "Підтвердити",
          bg: "Потвърди",
          tr: "Onayla",
          hu: "Elismerés",
        },
        kind: "callback",
        style: "primary",
        payload: "alert:ack:%s".replace("%s", ALERT_ID),
      },
    ],
  },
};

const ACKED: Localized<string> = {
  en: "Acknowledged",
  ru: "Подтверждено",
  de: "Bestätigt",
  fr: "Acquitté",
  it: "Confermato",
  nl: "Bevestigd",
  cs: "Potvrzeno",
  "zh-Hans": "已确认",
  "zh-Hant": "已確認",
  es: "Confirmado",
  pl: "Potwierdzono",
  ja: "確認済み",
  th: "รับทราบแล้ว",
  fi: "Kuitattu",
  uk: "Підтверджено",
  bg: "Потвърдено",
  tr: "Onaylandı",
  hu: "Elismerve",
};
const FIRING: Localized<string> = {
  en: "Awaiting ack",
  ru: "Ожидает подтверждения",
  de: "Bestätigung ausstehend",
  fr: "Acquittement en attente",
  it: "In attesa di conferma",
  nl: "Bevestiging verwacht",
  cs: "Čeká na potvrzení",
  "zh-Hans": "待确认",
  "zh-Hant": "待確認",
  es: "Esperando confirmación",
  pl: "Czeka na potwierdzenie",
  ja: "確認待ち",
  th: "รอรับทราบ",
  fi: "Odottaa kuittausta",
  uk: "Очікує підтвердження",
  bg: "Чака потвърждение",
  tr: "Onay bekleniyor",
  hu: "Elismerésre vár",
};
const STATUS_WORD: Localized<string> = {
  en: "Status",
  ru: "Статус",
  de: "Alarmstatus",
  fr: "Statut",
  it: "Stato",
  nl: "Alarmstatus",
  cs: "Stav",
  "zh-Hans": "状态",
  "zh-Hant": "狀態",
  es: "Estado",
  pl: "Stan alarmu",
  ja: "状態",
  th: "สถานะ",
  fi: "Tila",
  uk: "Статус",
  bg: "Статус",
  tr: "Durum",
  hu: "Állapot",
};

/* Console-side labels. */
const L_SOURCE: Localized<string> = {
  en: "Actions",
  ru: "Действия",
  de: "Aktionen",
  fr: "Opérations",
  it: "Azioni",
  nl: "Acties",
  cs: "Akce",
  "zh-Hans": "动作",
  "zh-Hant": "動作",
  es: "Acciones",
  pl: "Akcje",
  ja: "操作",
  th: "คำสั่ง",
  fi: "Toiminnot",
  uk: "Дії",
  bg: "Действия",
  tr: "Eylemler",
  hu: "Műveletek",
};
const L_LOG: Localized<string> = {
  en: "Console log",
  ru: "Журнал консоли",
  de: "Konsole-Protokoll",
  fr: "Journal de console",
  it: "Log della console",
  nl: "Consolelogboek",
  cs: "Protokol konzole",
  "zh-Hans": "后台日志",
  "zh-Hant": "後台日誌",
  es: "Registro de consola",
  pl: "Dziennik konsoli",
  ja: "コンソールログ",
  th: "บันทึกคอนโซล",
  fi: "Konsolin loki",
  uk: "Журнал консолі",
  bg: "Дневник на конзолата",
  tr: "Konsol günlüğü",
  hu: "Konzolnapló",
};
const L_CP: Localized<string> = {
  en: "Compute credits this demo has booked",
  ru: "Вычислительные кредиты, списанные этим демо",
  de: "Rechenpunkte, die diese Demo verbraucht hat",
  fr: "Crédits de calcul réservés par cette démo",
  it: "Crediti di calcolo prenotati da questa demo",
  nl: "Rekenkredieten die deze demo boekte",
  cs: "Výpočetní kredity, které demo zúčtovalo",
  "zh-Hans": "本次演示累计消耗的算力点",
  "zh-Hant": "本次示範累計消耗的算力點",
  es: "Créditos de cómputo que esta demo ha reservado",
  pl: "Punkty obliczeniowe naliczone przez to demo",
  ja: "このデモが積算した計算クレジット",
  th: "เครดิตการคำนวณที่เดโมนี้ใช้",
  fi: "Laskentayksiköt, jotka tämä demo on kirjannut",
  uk: "Обчислювальні кредити, списані цим демо",
  bg: "Изчислителни кредити, начислени от демото",
  tr: "Bu demonun kullandığı hesaplama kredisi",
  hu: "A demó által lekötött számítási kredit",
};
const L_TARGETS: Localized<string> = {
  en: "Targets",
  ru: "Адресаты",
  de: "Ziele",
  fr: "Cibles",
  it: "Destinatari",
  nl: "Doelen",
  cs: "Cíle",
  "zh-Hans": "目标",
  "zh-Hant": "目標",
  es: "Destinatarios",
  pl: "Cele",
  ja: "対象",
  th: "กลุ่มเป้าหมาย",
  fi: "Kohteet",
  uk: "Отримувачі",
  bg: "Цели",
  tr: "Hedefler",
  hu: "Célállások",
};
const L_MENU_NOT: Localized<string> = {
  en: "No menu pushed yet",
  ru: "Меню ещё не отправлено",
  de: "Noch kein Menü gesendet",
  fr: "Aucun menu envoyé pour l'instant",
  it: "Nessun menu inviato",
  nl: "Nog geen menu gepusht",
  cs: "Zatím neodeslána nabídka",
  "zh-Hans": "菜单还没推送",
  "zh-Hant": "選單還沒推送",
  es: "Todavía no se envió el menú",
  pl: "Nie wysłano jeszcze menu",
  ja: "まだメニュー未送信",
  th: "ยังไม่ได้ส่งเมนู",
  fi: "Valikkoa ei vielä lähetetty",
  uk: "Меню ще не надіслано",
  bg: "Все още няма изпратено меню",
  tr: "Henüz menü gönderilmedi",
  hu: "Nincs elküldött menü",
};
const L_UP: Localized<string> = {
  en: "Uplink",
  ru: "Восходящий",
  de: "Aufwärts",
  fr: "Montant",
  it: "In salita",
  nl: "Upstream",
  cs: "Vzestupné",
  "zh-Hans": "上行",
  "zh-Hant": "上行",
  es: "Ascendente",
  pl: "W górę",
  ja: "上り",
  th: "ขาขึ้น",
  fi: "Ylöspäin",
  uk: "Висхідний",
  bg: "Възходящ",
  tr: "Yukarı yön",
  hu: "Felfelé",
};
const L_DOWN: Localized<string> = {
  en: "Downlink",
  ru: "Нисходящий",
  de: "Abwärts",
  fr: "Descendant",
  it: "In discesa",
  nl: "Downstream",
  cs: "Sestupné",
  "zh-Hans": "下行",
  "zh-Hant": "下行",
  es: "Descendente",
  pl: "W dół",
  ja: "下り",
  th: "ขาลง",
  fi: "Alaspäin",
  uk: "Нисхідний",
  bg: "Низходящ",
  tr: "Aşağı yön",
  hu: "Lefelé",
};
const L_NOTE: Localized<string> = {
  en: "Note",
  ru: "Заметка",
  de: "Hinweis",
  fr: "Remarque",
  it: "Nota",
  nl: "Notitie",
  cs: "Poznámka",
  "zh-Hans": "备注",
  "zh-Hant": "備註",
  es: "Nota",
  pl: "Notatka",
  ja: "備考",
  th: "หมายเหตุ",
  fi: "Merkintä",
  uk: "Примітка",
  bg: "Бележка",
  tr: "Not",
  hu: "Jegyzet",
};

/* Relay-side labels. */
const L_FRAME: Localized<string> = {
  en: "Frame text",
  ru: "Текст кадра",
  de: "Frame-Text",
  fr: "Texte de la trame",
  it: "Testo del frame",
  nl: "Frametekst",
  cs: "Text rámce",
  "zh-Hans": "帧原文",
  "zh-Hant": "訊框原文",
  es: "Texto de la trama",
  pl: "Treść ramki",
  ja: "フレーム文字列",
  th: "ข้อความเฟรม",
  fi: "Kehyksen teksti",
  uk: "Текст кадру",
  bg: "Текст на рамката",
  tr: "Çerçeve metni",
  hu: "Keret szövege",
};
const L_NONE: Localized<string> = {
  en: "No control frame has gone out yet. Press a button on the left and the real line shows up here.",
  ru: "Ни одного управляющего кадра ещё не ушло. Нажмите кнопку слева — настоящая строка появится здесь.",
  de: "Noch ist kein Steuerframe rausgegangen. Drücke links einen Button und die echte Zeile erscheint hier.",
  fr: "Aucune trame de contrôle n'est encore partie. Appuie sur un bouton à gauche et la vraie ligne s'affiche ici.",
  it: "Nessun frame di controllo è ancora uscito. Premi un pulsante a sinistra e la riga reale appare qui.",
  nl: "Er ging nog geen controleframe uit. Druk links op een knop en de echte regel verschijnt hier.",
  cs: "Žádný řídicí rámec zatím neodešel. Zmáčkněte vlevo tlačítko a skutečný řádek se objeví tady.",
  "zh-Hans": "还没有下发任何控制帧。左边按下一个按钮，这里就会出现真实形状的那一行。",
  "zh-Hant": "還沒有下發任何控制訊框。左邊按下一個按鈕，這裡就會出現真實形狀的那一行。",
  es: "Todavía no salió ninguna trama de control. Pulsa un botón a la izquierda y la línea real aparece acá.",
  pl: "Żadna ramka sterująca jeszcze nie wyszła. Naciśnij przycisk po lewej, a prawdziwa linia pojawi się tutaj.",
  ja: "まだ制御フレームは送出されていません。左のボタンを押すと、本物の一行がここに現れます。",
  th: "ยังไม่มีเฟรมควบคุมถูกส่งออกไป กดปุ่มทางซ้ายแล้วบรรทัดจริงจะปรากฏที่นี่",
  fi: "Yhtään ohjauskehystä ei ole vielä lähtenyt. Paina napista vasemmalla ja aito rivi ilmestyy tähän.",
  uk: "Жодного керуючого кадру ще не надіслано. Натисніть кнопку ліворуч — справжній рядок з'явиться тут.",
  bg: "Няма изпратена контролираща рамка още. Натиснете бутон вляво и истинският ред се появява тук.",
  tr: "Henüz dışarı çıkmış bir kontrol çerçevesi yok. Solda bir düğmeye basın, gerçek satır burada belirsin.",
  hu: "Még egy vezérlő keret sem ment ki. Nyomj meg egy gombot balra, és az valódi sor itt jelenik meg.",
};
const L_ENV: Localized<string> = {
  en: "Ciphertext and signature digest",
  ru: "Шифротекст и дайджест подписи",
  de: "Chiffretext und Signatur-Digest",
  fr: "Chiffré et empreinte de signature",
  it: "Cifrato e digest della firma",
  nl: "Cijfertekst en handtekening-samenvatting",
  cs: "Šifrotext a digest podpisu",
  "zh-Hans": "密文与签名摘要",
  "zh-Hant": "密文與簽名摘要",
  es: "Texto cifrado y resumen de la firma",
  pl: "Szyfrogram i skrót podpisu",
  ja: "暗号文と署名ダイジェスト",
  th: "ข้อความลับและค่า digest ลายเซ็น",
  fi: "Salateksti ja allekirjoituksen tiivistelmä",
  uk: "Шифротекст і дайджест підпису",
  bg: "Криптотекст и резюме на подписа",
  tr: "Şifreli metin ve imza özeti",
  hu: "Titkosított szöveg és aláírás-kivonat",
};
const L_EXAMPLE: Localized<string> = {
  en: "example values",
  ru: "примерные значения",
  de: "Beispielwerte",
  fr: "valeurs d'exemple",
  it: "valori di esempio",
  nl: "voorbeeldwaarden",
  cs: "vzorové hodnoty",
  "zh-Hans": "示例值",
  "zh-Hant": "範例值",
  es: "valores de ejemplo",
  pl: "wartości przykładowe",
  ja: "値の例",
  th: "ค่าตัวอย่าง",
  fi: "esimerkkiarvot",
  uk: "прикладні значення",
  bg: "примерни стойности",
  tr: "örnek değerler",
  hu: "példaértékek",
};
const ENV_CAPTION: Localized<string> = {
  en: `The envelope's field names and byte lengths come from ChannelEnvelope and seal_envelope in gateway/app/crypto_service.py: a 12-byte nonce, the ciphertext with its 16-byte Poly1305 tag appended, a 64-byte Ed25519 signature, all in standard base64. The bytes shown here are built in this page as examples: there is no private key in a browser and no real cipher runs.`,
  ru: `Имена полей и длины в байтах конверта взяты из ChannelEnvelope и seal_envelope в gateway/app/crypto_service.py: 12-байтовый nonce, шифротекст с присоединённым 16-байтовым тегом Poly1305 и 64-байтовая подпись Ed25519 — всё в стандартном base64. Байты тут собраны на этой странице как примеры: в браузере нет приватного ключа и настоящее шифрование не выполняется.`,
  de: `Die Feldnamen und Bytelängen des Umschlags stammen aus ChannelEnvelope und seal_envelope in gateway/app/crypto_service.py: eine 12-Byte-Nonce, der Chiffretext mit angehängtem 16-Byte-Poly1305-Tag, eine 64-Byte-Ed25519-Signatur, alles in Standard-base64. Die Bytes hier sind in dieser Seite gebaute Beispiele: In einem Browser liegt kein private key, und es läuft keine echte Verschlüsselung.`,
  fr: `Les noms de champ et les longueurs en octets de l'enveloppe viennent de ChannelEnvelope et seal_envelope dans gateway/app/crypto_service.py : un nonce de 12 octets, le chiffré avec son tag Poly1305 de 16 octets ajouté, une signature Ed25519 de 64 octets, le tout en base64 standard. Les octets affichés ici sont des exemples construits par la page : un navigateur ne détient aucune clé privée et aucun vrai chiffrement ne s'exécute.`,
  it: `I nomi dei campi e le lunghezze in byte della busta vengono da ChannelEnvelope e seal_envelope in gateway/app/crypto_service.py: nonce di 12 byte, ciphertext con il tag Poly1305 di 16 byte accodato, firma Ed25519 di 64 byte, tutto in base64 standard. I byte mostrati qui sono esempi costruiti da questa pagina: nel browser non c'è alcuna chiave privata e non gira vera crittografia.`,
  nl: `De veldnamen en bytelengtes van de envelop komen uit ChannelEnvelope en seal_envelope in gateway/app/crypto_service.py: een nonce van 12 byte, de ciphertext met zijn 16-byte Poly1305-tag eraan geplakt, een Ed25519-handtekening van 64 byte, allemaal in standaard base64. De bytes hier zijn in deze pagina in elkaar gezette voorbeelden: in een browser ligt geen privésleutel en draait geen echte encryptie.`,
  cs: `Názvy polí a délky v bajtech obálky pocházejí z ChannelEnvelope a seal_envelope v gateway/app/crypto_service.py: 12bajtový nonce, šifrotext s připojeným 16bajtovým tagem Poly1305, 64bajtový podpis Ed25519, vše ve standardním base64. Zobrazené bajty jsou příklady sestavené přímo na této stránce: v prohlížeči není žádný soukromý klíč a neběží skutečná šifra.`,
  "zh-Hans": `信封的字段名与字节长度取自 gateway/app/crypto_service.py 的 ChannelEnvelope 与 seal_envelope：nonce 12 字节、ciphertext 是密文串接 16 字节 Poly1305 tag、signature 64 字节 Ed25519，一律标准 base64。这里的字节是本页拼出来的示例——浏览器里没有私钥，也不会做真加密。`,
  "zh-Hant": `信封的欄位名與位元組長度取自 gateway/app/crypto_service.py 的 ChannelEnvelope 與 seal_envelope：nonce 12 位元組、ciphertext 是密文串接 16 位元組 Poly1305 tag、signature 64 位元組 Ed25519，一律標準 base64。這裡的位元組是本頁組出的範例——瀏覽器裡沒有私鑰，也不會做真加密。`,
  es: `Los nombres de campo y las longitudes en bytes del sobre salen de ChannelEnvelope y seal_envelope en gateway/app/crypto_service.py: un nonce de 12 bytes, el texto cifrado con su tag Poly1305 de 16 bytes añadido, una firma Ed25519 de 64 bytes, todo en base64 estándar. Los bytes de aquí son ejemplos armados en esta página: en el navegador no hay clave privada y no corre ningún cifrado real.`,
  pl: `Nazwy pól i długości w bajtach koperty pochodzą z ChannelEnvelope i seal_envelope w gateway/app/crypto_service.py: 12-bajtowy nonce, szyfrogram z doczepionym 16-bajtowym tagiem Poly1305 i 64-bajtowy podpis Ed25519, wszystko w standardowym base64. Bajty pokazane tutaj to przykłady złożone na tej stronie: w przeglądarce nie ma klucza prywatnego i nie działa prawdziwe szyfrowanie.`,
  ja: `エンベロープのフィールド名とバイト長は gateway/app/crypto_service.py の ChannelEnvelope と seal_envelope から取りました。nonce は 12 バイト、ciphertext は暗号文に 16 バイトの Poly1305 tag を連結したもの、signature は 64 バイトの Ed25519 で、いずれも標準 base64 です。ここに表示されるバイト列はこのページが組み立てた例にすぎず、ブラウザには秘密鍵も本物の暗号処理もありません。`,
  th: `ชื่อฟิลด์และความยาวเป็นไบต์ของซองมาจาก ChannelEnvelope กับ seal_envelope ใน gateway/app/crypto_service.py: nonce 12 ไบต์, ciphertext ที่ต่อท้ายด้วยแท็ก Poly1305 16 ไบต์, ลายเซ็น Ed25519 64 ไบต์ ทั้งหมดเป็น base64 มาตรฐาน ไบต์ที่เห็นตรงนี้ถูกประกอบขึ้นเป็นตัวอย่างในหน้านี้ ในเบราว์เซอร์ไม่มีคีย์ส่วนตัวและไม่ได้เข้ารหัสจริง`,
  fi: `Kirjeen kenttänimet ja tavupituudet tulevat ChannelEnvelope- ja seal_envelope -funktioista gateway/app/crypto_service.py: 12 tavun nonce, salateksti 16 tavun Poly1305 -tagi perässään, 64 tavun Ed25519 -allekirjoitus, kaikki standardia base64:ta. Täällä näkyvät tavut ovat tämän sivun koostamia esimerkkejä: selaimessa ei ole yksityistä avainta eikä aitoa salausta suoriteta.`,
  uk: `Назви полів та довжини в байтах конверта взято з ChannelEnvelope і seal_envelope у gateway/app/crypto_service.py: 12-байтовий nonce, шифротекст із приєднаним 16-байтовим тегом Poly1305 та 64-байтовий підпис Ed25519 — усе у стандартному base64. Байти тут — приклади, зібрані на цій сторінці: у браузері немає приватного ключа й справжнє шифрування не виконується.`,
  bg: `Имената на полетата и дължините в байтове на пликчето идват от ChannelEnvelope и seal_envelope в gateway/app/crypto_service.py: 12-байтов nonce, криптотекст с прикачения 16-байтов Poly1305 таг, 64-байтов Ed25519 подпис, всичко в стандартен base64. Показаните байтове са примери, сгънени в тази страница: в четеца няма частен ключ и истинско криптиране не се изпълнява.`,
  tr: `Zarfın alan adları ve bayt uzunlukları gateway/app/crypto_service.py içindeki ChannelEnvelope ve seal_envelope fonksiyonlarından: 12 baytlık nonce, sonuna eklenmiş 16 baytlık Poly1305 etiketiyle şifreli metin, 64 baytlık Ed25519 imzası, hepsi standart base64. Burada görünen baytlar bu sayfada üretilmiş örneklerdir: tarayıcıda özel anahtar yoktur ve gerçek şifreleme çalışmaz.`,
  hu: `A boríték mezőnevei és a bájtok hossza a gateway/app/crypto_service.py ChannelEnvelope és seal_envelope függvényeiből valók: 12 bájtos nonce, a ciphertext a hozzáfűzött 16 bájtos Poly1305 címkével, 64 bájtos Ed25519 aláírás, minden szabvány base64-ban. A itt látható bájtok ezen az oldalon összerakott példák: a böngészőben nincs privát kulcs és valódi titkosítás nem fut.`,
};
const FRAME_CAPTION: Localized<string> = {
  en: `The encoding rules are from the same source: encode_frame glues ::POPOPX_ECO:: straight in front of json.dumps(separators=(",",":"), ensure_ascii=False), with no key sorting, no \\uXXXX escaping and no line break — a CJK glyph counts as one character.`,
  ru: `Правила кодирования — из того же исходника: encode_frame приклеивает ::POPOPX_ECO:: прямо перед json.dumps(separators=(",",":"), ensure_ascii=False), без сортировки ключей, без \\uXXXX-экранирования и без переноса строки; иероглиф считается за один символ.`,
  de: `Die Kodierungsregeln stammen aus derselben Quelle: encode_frame klebt ::POPOPX_ECO:: direkt vor json.dumps(separators=(",",":"), ensure_ascii=False) — ohne sortierte Schlüssel, ohne \\uXXXX-Eskapsing und ohne Umbruch; ein CJK-Zeichen zählt als ein Zeichen.`,
  fr: `Les règles d'encodage viennent de la même source : encode_frame colle ::POPOPX_ECO:: juste devant json.dumps(separators=(",",":"), ensure_ascii=False), sans tri de clés, sans échappement \\uXXXX et sans saut de ligne — un glyphe CJK compte pour un caractère.`,
  it: `Le regole di codifica vengono dalla stessa fonte: encode_frame incolla ::POPOPX_ECO:: proprio davanti a json.dumps(separators=(",",":"), ensure_ascii=False), senza ordinamento delle chiavi, senza escape \\uXXXX e senza a capo; un glifo CJK conta come un carattere.`,
  nl: `De coderingsregels komen uit dezelfde bron: encode_frame plakt ::POPOPX_ECO:: direct vóór json.dumps(separators=(",",":"), ensure_ascii=False), zonder sortsleutels, zonder \\uXXXX-escaping en zonder regelafbreking — een CJK-glyf telt als één teken.`,
  cs: `Pravidla kódování jsou ze stejného zdroje: encode_frame nalepí ::POPOPX_ECO:: přímo před json.dumps(separators=(",",":"), ensure_ascii=False), bez řazení klíčů, bez \\uXXXX escapeování a bez zalomení — znak CJK se počítá jako jeden znak.`,
  "zh-Hans": `编码规则同样来自源码：encode_frame 把 ::POPOPX_ECO:: 直接贴在 json.dumps(separators=(",",":"), ensure_ascii=False) 前面，不排序、不转义成 \\uXXXX，也不允许换行——汉字按一个字算一个字符。`,
  "zh-Hant": `編碼規則同樣取自原始碼：encode_frame 把 ::POPOPX_ECO:: 直接貼在 json.dumps(separators=(",",":"), ensure_ascii=False) 前面，不排序、不跳脫成 \\uXXXX，也不允許換行——漢字按一個字算一個字元。`,
  es: `Las reglas de codificación salen del mismo origen: encode_frame pega ::POPOPX_ECO:: justo delante de json.dumps(separators=(",",":"), ensure_ascii=False), sin ordenar claves, sin escapar a \\uXXXX y sin saltos de línea — un glifo CJK cuenta como un carácter.`,
  pl: `Reguły kodowania pochodzą z tego samego źródła: encode_frame przykleja ::POPOPX_ECO:: tuż przed json.dumps(separators=(",",":"), ensure_ascii=False), bez sortowania kluczy, bez ucieczek \\uXXXX i bez łamania linii — glif CJK liczy się jako jeden znak.`,
  ja: `エンコード規則も同じソースから来ています。encode_frame は ::POPOPX_ECO:: を json.dumps(separators=(",",":"), ensure_ascii=False) の直前に貼り付けるだけで、キーの並び替えも \\uXXXX エスケープも改行も許可しません。CJK 文字は 1 文字として数えられます。`,
  th: `กฎการเข้ารหัสมาจาก source เดียวกัน: encode_frame แนบ ::POPOPX_ECO:: ไว้ตรงหน้า json.dumps(separators=(",",":"), ensure_ascii=False) โดยไม่เรียงคีย์ ไม่ escape เป็น \\uXXXX และไม่ขึ้นบรรทัดใหม่ ตัวอักษร CJK นับเป็นหนึ่งตัวอักษร`,
  fi: `Koodaussäännöt ovat samasta lähteestä: encode_frame liimaa ::POPOPX_ECO:: suoraan json.dumps(separators=(",",":"), ensure_ascii=False) eteen, ilman avainten järjestystä, ilman \\uXXXX-escapausta ja ilman rivinvaihtoa — CJK-merkki lasketaan yhdeki merkeiksi.`,
  uk: `Правила кодування — з того самого джерела: encode_frame приклеює ::POPOPX_ECO:: просто перед json.dumps(separators=(",",":"), ensure_ascii=False), без сортування ключів, без \\uXXXX-екранування й без розриву рядка; ієрогліф рахується за один символ.`,
  bg: `Правилата за кодиране идват от същия източник: encode_frame лепи ::POPOPX_ECO:: точно пред json.dumps(separators=(",",":"), ensure_ascii=False), без сортиране на ключовете, без \\uXXXX екраниране и без пренасяне на ред — един CJK знак се брои за един знак.`,
  tr: `Kodlama kuralları da aynı kaynaktan: encode_frame, ::POPOPX_ECO:: ifadesini json.dumps(separators=(",",":"), ensure_ascii=False) satırının tam önüne yapıştırır; anahtar sıralaması yok, \\uXXXX kaçışı yok, satır sonu yok — CJK glifi bir karakter sayılır.`,
  hu: `Az kódolási szabályok is ugyanabból a forrásból valók: az encode_frame a ::POPOPX_ECO:: jelölést közvetlenül a json.dumps(separators=(",",":"), ensure_ascii=False) elé ragasztja — kulcsok rendezése nélkül, \\uXXXX-escape nélkül, sortörés nélkül; egy CJK glif egy karakternek számít.`,
};

/* Phone-side copy. */
const P_ONLINE: Localized<string> = {
  en: "online",
  ru: "в сети",
  de: "verbunden",
  fr: "en ligne",
  it: "in linea",
  nl: "verbonden",
  cs: "připojeno",
  "zh-Hans": "在线",
  "zh-Hant": "線上",
  es: "en línea",
  pl: "w sieci",
  ja: "オンライン",
  th: "ออนไลน์",
  fi: "paikallaan",
  uk: "у мережі",
  bg: "на линия",
  tr: "çevrimiçi",
  hu: "elérhető",
};
const P_MENU: Localized<string> = {
  en: "Custom menu",
  ru: "Пользовательское меню",
  de: "Benutzerdefiniertes Menü",
  fr: "Menu personnalisé",
  it: "Menu personalizzato",
  nl: "Aangepast menu",
  cs: "Vlastní nabídka",
  "zh-Hans": "自定义菜单",
  "zh-Hant": "自訂選單",
  es: "Menú personalizado",
  pl: "Menu niestandardowe",
  ja: "カスタムメニュー",
  th: "เมนูกำหนดเอง",
  fi: "Mukautettu valikko",
  uk: "Власне меню",
  bg: "Персонализирано меню",
  tr: "Özel menü",
  hu: "Egyéni menü",
};
const P_LOCKED: Localized<string> = {
  en: "Button locked until the card updates",
  ru: "Кнопка заблокирована до обновления карточки",
  de: "Schaltfläche gesperrt, bis die Karte aktualisiert wird",
  fr: "Bouton verrouillé tant que la carte n'est pas mise à jour",
  it: "Pulsante bloccato finché la scheda non si aggiorna",
  nl: "Knop vergrendeld tot de kaart ververst is",
  cs: "Tlačítko uzamčené, dokud se karta neobnoví",
  "zh-Hans": "按钮已锁定，等卡片更新才会恢复",
  "zh-Hant": "按鈕已鎖定，等卡片更新才會恢復",
  es: "Botón bloqueado hasta que se actualice la tarjeta",
  pl: "Przycisk zablokowany do odświeżenia karty",
  ja: "カードが更新されるまでボタンはロックされます",
  th: "ล็อกปุ่มไว้จนกว่าการ์ดจะอัปเดต",
  fi: "Painike lukittuna, kunnes kortti päivittyy",
  uk: "Кнопку заблоковано, доки картку не оновлено",
  bg: "Бутонът е заключен, докато картата се обнови",
  tr: "Kart güncellenene kadar düğme kilitli",
  hu: "A gomb zárva van a kártya frissüléséig",
};
const P_H5_TITLE: Localized<string> = {
  en: "H5 page",
  ru: "H5-страница",
  de: "H5-Seite",
  fr: "Page H5",
  it: "Pagina H5",
  nl: "H5-pagina",
  cs: "Stránka H5",
  "zh-Hans": "H5 页面",
  "zh-Hant": "H5 頁面",
  es: "Página H5",
  pl: "Strona H5",
  ja: "H5 ページ",
  th: "หน้า H5",
  fi: "H5-sivu",
  uk: "H5-сторінка",
  bg: "H5 страница",
  tr: "H5 sayfası",
  hu: "H5-oldal",
};
const P_H5_CLOSE: Localized<string> = {
  en: "Close",
  ru: "Закрыть",
  de: "Schließen",
  fr: "Fermer",
  it: "Chiudi",
  nl: "Sluiten",
  cs: "Zavřít",
  "zh-Hans": "关闭",
  "zh-Hant": "關閉",
  es: "Cerrar",
  pl: "Zamknij",
  ja: "閉じる",
  th: "ปิด",
  fi: "Sulje",
  uk: "Закрити",
  bg: "Затвори",
  tr: "Kapat",
  hu: "Bezárás",
};
const P_H5_NOTE: Localized<string> = {
  en: "On a real phone this does not happen inside the app: the client opens the signed link in an out-of-process SFSafariViewController, and the signature covers only uid=<pairwise_uid>&ts=<unix_seconds>, replay-checked inside a ±300 second window. The sandbox draws the same thing inside the frame so the parameters are visible.",
  ru: "На настоящем телефоне это происходит не внутри приложения: клиент открывает подписанную ссылку через SFSafariViewController вне процесса, а подпись покрывает только uid=<pairwise_uid>&ts=<unix_seconds>; проверка от повторов идёт в окне H5_MAX_SKEW_SECONDS=300 с обеих сторон. Песочница рисует то же самое внутри рамки, чтобы параметры были видны.",
  de: "Auf einem echten Telefon läuft dieser Schritt außerhalb der App: Der Client öffnet den signierten Link in einem out-of-process SFSafariViewController, und die Signatur deckt nur uid=<pairwise_uid>&ts=<unix_seconds> ab (Replay-Schutz über H5_MAX_SKEW_SECONDS=300, auf beiden Seiten geprüft). Diese Sandbox zeichnet dasselbe im Rahmen, damit die Parameter sichtbar sind.",
  fr: "Sur un vrai téléphone, cela ne se passe pas dans l'app : le client ouvre le lien signé dans un SFSafariViewController hors processus, et la signature ne couvre que uid=<pairwise_uid>&ts=<unix_seconds> (fenêtre anti-rejeu H5_MAX_SKEW_SECONDS=300, vérifiée des deux côtés). Le bac à sable dessine la même chose à l'intérieur de l'écran pour que les paramètres soient visibles.",
  it: "Su un telefono reale questo passaggio non avviene dentro l'app: il client apre il link firmato in un SFSafariViewController fuori processo, e la firma copre solo uid=<pairwise_uid>&ts=<unix_seconds> (finestra anti-replay H5_MAX_SKEW_SECONDS=300, verificata da entrambi i lati). Questa sandbox disegna la stessa cosa dentro lo schermo, così i parametri restano visibili.",
  nl: "Op een echte telefoon gebeurt dit niet in de app: de client opent de ondertekende link in een out-of-process SFSafariViewController, en de handtekening dekt alleen uid=<pairwise_uid>&ts=<unix_seconds> (anti-replayvenster H5_MAX_SKEW_SECONDS=300, aan beide kanten gecontroleerd). Deze sandbox tekent hetzelfde binnen het frame, zodat je de parameters ziet.",
  cs: "Na skutečném telefonu se tohle neděje uvnitř aplikace: klient otevírá podepsaný odkaz mimo proces přes SFSafariViewController a podpis pokrývá jen uid=<pairwise_uid>&ts=<unix_seconds> (okno proti opakovanému vyslání H5_MAX_SKEW_SECONDS=300, ověřené z obou stran). Pískoviště totéž vykresluje uvnitř rámečku, aby byly parametry vidět.",
  "zh-Hans": "真机上这一步不在 App 里：客户端用 out-of-process 的 SFSafariViewController 打开签名链接，签名只覆盖 uid=<pairwise_uid>&ts=<unix_seconds>（H5_MAX_SKEW_SECONDS=300 的防重放窗口两边都算）。这个沙盒把同一件事画在屏幕里，好让你看得见参数长什么样。",
  "zh-Hant": "真機上這一步不在 App 裡：客戶端用 out-of-process 的 SFSafariViewController 開啟簽名連結，簽名只涵蓋 uid=<pairwise_uid>&ts=<unix_seconds>（H5_MAX_SKEW_SECONDS=300 的防重放視窗兩邊都算）。這個沙盒把同一件事畫在螢幕裡，好讓你看得見參數長什麼樣。",
  es: "En un teléfono real este paso no ocurre dentro de la app: el cliente abre el enlace firmado en un SFSafariViewController fuera del proceso, y la firma solo cubre uid=<pairwise_uid>&ts=<unix_seconds> (ventana antirrepetición de H5_MAX_SKEW_SECONDS=300, comprobada en ambos lados). Este sandbox dibuja lo mismo dentro de la pantalla para que los parámetros sean visibles.",
  pl: "Na prawdziwym telefonie ten krok nie dzieje się w aplikacji: klient otwiera podpisany link w SFSafariViewController poza procesem, a podpis obejmuje tylko uid=<pairwise_uid>&ts=<unix_seconds> (okno antypowtórzeniowe H5_MAX_SKEW_SECONDS=300, sprawdzane z obu stron). Ta piaskownica rysuje to samo wewnątrz ramki, żeby parametry były widoczne.",
  ja: "実機ではこのステップはアプリの中では起きません。クライアントは署名付きリンクをプロセス外の SFSafariViewController で開き、署名がカバーするのは uid=<pairwise_uid>&ts=<unix_seconds> だけで、リプレイ防止は H5_MAX_SKEW_SECONDS=300 のウィンドウを両側から検証します。このサンドボックスでは同じことを画面の中に描画し、パラメータが見えるようにしています。",
  th: "บนเครื่องจริง ขั้นตอนนี้ไม่ได้เกิดในแอป: ไคลเอนต์เปิดลิงก์ที่ลงนามด้วย SFSafariViewController นอกโปรเซส และลายเซ็นครอบคลุมแค่ uid=<pairwise_uid>&ts=<unix_seconds> (หน้าต่างกันการส่งซ้ำ H5_MAX_SKEW_SECONDS=300 ตรวจทั้งสองฝั่ง) แซนด์บ็อกซ์นี้วาดสิ่งเดียวกันไว้ในขอบจอ เพื่อให้คุณเห็นพารามิเตอร์ชัด ๆ",
  fi: "Oikeassa puhelimessa tämä ei tapahdu sovelluksen sisällä: asiakas avaa allekirjoitetun linkin prosessin ulkopuolisella SFSafariViewControllerilla, ja allekirjoitus kattaa vain uid=<pairwise_uid>&ts=<unix_seconds> (toistojen estoikkuna H5_MAX_SKEW_SECONDS=300, tarkistetaan molemmin puolin). Tämä hiekkalaatikko piirtää saman kehyksen sisälle, jotta parametrit näkyvät.",
  uk: "На справжньому телефоні цей крок відбувається не в додатку: клієнт відкриває підписане посилання через SFSafariViewController поза процесом, а підпис покриває лише uid=<pairwise_uid>&ts=<unix_seconds> (вікно проти повторів H5_MAX_SKEW_SECONDS=300, перевіряється з обох боків). Ця пісочниця малює те саме всередині рамки, щоб параметри були видні.",
  bg: "На истински телефон тази стъпка не се случва в приложението: клиентът отваря подписания линк чрез SFSafariViewController извън процеса, а подписът покрива само uid=<pairwise_uid>&ts=<unix_seconds> (прозорец срещу повторения H5_MAX_SKEW_SECONDS=300, проверя се и от двете страни). Този пясъчник рисува същото вътре в рамката, за да се виждат параметрите.",
  tr: "Gerçek telefonda bu adım uygulamanın içinde olmaz: istemci imzalı bağlantıyı süreç dışı bir SFSafariViewController ile açar ve imza yalnızca uid=<pairwise_uid>&ts=<unix_seconds> değerlerini kapsar (tekrara karşı pencere H5_MAX_SKEW_SECONDS=300, iki taraftan da kontrol edilir). Bu kum kutusu aynı şeyi çerçevenin içinde çizer, böylece parametreler görünür.",
  hu: "Valódi telefonon ez a lépés nem az alkalmazásban történik: a kliens az aláírt hivatkozást folyamatból kiemelt SFSafariViewController-ban nyitja meg, és az aláírás csak a uid=<pairwise_uid>&ts=<unix_seconds> tartalmat fedi le (visszajátszás-gátló ablak H5_MAX_SKEW_SECONDS=300, mindkét irányban ellenőrizve). Ez a homokozda ugyanazt a kereten belül rajzolja meg, hogy a paraméterek látszódjanak.",
};
const P_VOTED: Localized<string> = {
  en: "voted",
  ru: "проголосовано",
  de: "abgestimmt",
  fr: "voté",
  it: "votato",
  nl: "gestemd",
  cs: "ohlasováno",
  "zh-Hans": "已投",
  "zh-Hant": "已投",
  es: "votado",
  pl: "zagłosowano",
  ja: "投票済み",
  th: "โหวตแล้ว",
  fi: "äänestetty",
  uk: "проголосовано",
  bg: "гласувано",
  tr: "oy verildi",
  hu: "szavazva",
};
const P_TOTAL: Localized<string> = {
  en: "Total votes",
  ru: "Всего голосов",
  de: "Stimmen gesamt",
  fr: "Votes au total",
  it: "Voti totali",
  nl: "Stemmen totaal",
  cs: "Hlasů celkem",
  "zh-Hans": "总票数",
  "zh-Hant": "總票數",
  es: "Votos totales",
  pl: "Głosów razem",
  ja: "投票総数",
  th: "คะแนนรวม",
  fi: "Ääniä yhteensä",
  uk: "Усього голосів",
  bg: "Общо гласове",
  tr: "Toplam oy",
  hu: "Összes szavazat",
};
const P_MULTI: Localized<string> = {
  en: "multiple choice",
  ru: "можно выбрать несколько",
  de: "Mehrfachauswahl",
  fr: "choix multiples",
  it: "scelta multipla",
  nl: "meerdere keuzes",
  cs: "více možností",
  "zh-Hans": "可多选",
  "zh-Hant": "可多選",
  es: "selección múltiple",
  pl: "wielokrotny wybór",
  ja: "複数選択可",
  th: "เลือกได้หลายข้อ",
  fi: "useampi valinta",
  uk: "можна кілька",
  bg: "няколко възможности",
  tr: "çoklu seçim",
  hu: "többválasztós",
};
const P_YOURS: Localized<string> = {
  en: "Your choice (visible only to you)",
  ru: "Ваш выбор (виден только вам)",
  de: "Deine Auswahl (nur für dich sichtbar)",
  fr: "Votre choix (visible par vous seul)",
  it: "La tua scelta (visibile solo a te)",
  nl: "Jouw keuze (alleen voor jou zichtbaar)",
  cs: "Vaše volba (vidíte jen vy)",
  "zh-Hans": "你的选择（仅你可见）",
  "zh-Hant": "你的選擇（僅你可見）",
  es: "Tu elección (solo tú la ves)",
  pl: "Twój wybór (widoczny tylko dla Ciebie)",
  ja: "あなたの選択（あなただけに表示）",
  th: "การเลือกของคุณ (เห็นเฉพาะคุณ)",
  fi: "Valintasi (näkyy vain sinulle)",
  uk: "Ваш вибір (бачите лише ви)",
  bg: "Вашият избор (виждате го само вие)",
  tr: "Seçimin (yalnızca sen görüyorsun)",
  hu: "A te választásod (csak neked látszik)",
};
const P_LEADING: Localized<string> = {
  en: "Leading",
  ru: "Лидер",
  de: "Führend",
  fr: "En tête",
  it: "In testa",
  nl: "Toonaangevend",
  cs: "Vedení",
  "zh-Hans": "领先",
  "zh-Hant": "領先",
  es: "Lidera",
  pl: "Prowadzi",
  ja: "リード",
  th: "นำ",
  fi: "Kärjessä",
  uk: "Лідер",
  bg: "Води",
  tr: "Önde",
  hu: "Élen",
};
const P_VOTES: Localized<string> = {
  en: "votes",
  ru: "голосов",
  de: "Stimmen",
  fr: "voix",
  it: "voti",
  nl: "stemmen",
  cs: "hlasů",
  "zh-Hans": "票",
  "zh-Hant": "票",
  es: "votos",
  pl: "głosów",
  ja: "票",
  th: "โหวต",
  fi: "ääntä",
  uk: "голосів",
  bg: "гласа",
  tr: "oy",
  hu: "szavazat",
};
const P_DEADLINE: Localized<string> = {
  en: "closes",
  ru: "завершается",
  de: "endet",
  fr: "se termine",
  it: "scade",
  nl: "eindigt",
  cs: "uzavřeno",
  "zh-Hans": "截止",
  "zh-Hant": "截止",
  es: "cierra",
  pl: "kończy się",
  ja: "締切",
  th: "ปิดโหวต",
  fi: "sulkeutuu",
  uk: "до",
  bg: "приключва",
  tr: "bitiş",
  hu: "határidő",
};
const P_NO_VOTES: Localized<string> = {
  en: "no votes yet",
  ru: "пока нет голосов",
  de: "noch keine Stimmen",
  fr: "aucun vote pour l'instant",
  it: "ancora nessun voto",
  nl: "nog geen stemmen",
  cs: "zatím žádné hlasy",
  "zh-Hans": "尚无投票",
  "zh-Hant": "尚無投票",
  es: "aún sin votos",
  pl: "jeszcze brak głosów",
  ja: "投票はまだありません",
  th: "ยังไม่มีคะแนนโหวต",
  fi: "ei vielä ääniä",
  uk: "поки немає голосів",
  bg: "все още няма гласове",
  tr: "henüz oy yok",
  hu: "még nincs szavazat",
};
const P_POLL_NOTE: Localized<string> = {
  en: "Anonymous poll: only the per-option counts and shares are published, never a voter.",
  ru: "Анонимное голосование: публикуются только количества и доли по вариантам, голосующие — никогда.",
  de: "Anonyme Umfrage: genannt werden nur Zahlen und Anteile pro Option, niemals eine Person.",
  fr: "Sondage anonyme : seuls les compteurs et pourcentages par option sont publiés, jamais un votant.",
  it: "Sondaggio anonimo: si pubblicano solo conteggi e percentuali per opzione, mai un votante.",
  nl: "Anonieme poll: alleen aantallen en percentages per optie worden gepubliceerd, nooit een stemmer.",
  cs: "Anonymní hlasování: zveřejňují se jen počty a podíly jednotlivých voleb, nikdy ne hlasující.",
  "zh-Hans": "匿名投票：只公布各选项票数与占比，不公布投票人。",
  "zh-Hant": "匿名投票：只公布各選項票數與占比，不公布投票人。",
  es: "Votación anónima: solo se publican los recuentos y porcentajes por opción, nunca un votante.",
  pl: "Anonimowe głosowanie: publikowane są tylko liczby i udziały dla poszczególnych opcji, nigdy osoba głosująca.",
  ja: "匿名投票：各選択肢の票数と割合だけを公開し、投票者を公開しません。",
  th: "โพลไม่ระบุตัวตน: เผยแค่จำนวนและสัดส่วนของแต่ละตัวเลือก ไม่เปิดเผยผู้โหวต",
  fi: "Anonyymi kysely: julkisia ovat vain vaihtoehtojen luvut ja osuudet, ei äänestäjiä.",
  uk: "Анонімне голосування: публікують лише кількості та частки за варіантами, а хто голосував — ніколи.",
  bg: "Анонимна анкета: публични са само броят и процентите по опции, а гласувалите не се разкриват.",
  tr: "Anonim anket: yalnızca seçenek bazında sayılar ve oranlar yayımlanır, oy veren kimse asla.",
  hu: "Névtelen szavazás: csak az opciókonkénti számok és arányok jelennek meg, szavazó soha.",
};
const P_ARTICLE: Localized<string> = {
  en: "Article",
  ru: "Статья",
  de: "Artikel",
  fr: "Publication",
  it: "Articolo",
  nl: "Artikel",
  cs: "Článek",
  "zh-Hans": "文章",
  "zh-Hant": "文章",
  es: "Artículo",
  pl: "Artykuł",
  ja: "記事",
  th: "บทความ",
  fi: "Artikkeli",
  uk: "Стаття",
  bg: "Статия",
  tr: "Makale",
  hu: "Cikk",
};
const P_READ: Localized<string> = {
  en: "Read the full article",
  ru: "Читать полностью",
  de: "Ganzen Artikel lesen",
  fr: "Lire l'article intégral",
  it: "Leggi l'articolo completo",
  nl: "Volledig artikel lezen",
  cs: "Přečíst celý článek",
  "zh-Hans": "阅读全文",
  "zh-Hant": "閱讀全文",
  es: "Leer el artículo completo",
  pl: "Czytaj cały artykuł",
  ja: "全文を読む",
  th: "อ่านบทความเต็ม",
  fi: "Lue koko artikkeli",
  uk: "Читати повністю",
  bg: "Прочети статията",
  tr: "Yazının tamamını oku",
  hu: "Teljes cikk elolvasása",
};

/* Log copy. */
const LOG_TEXT: Record<string, Localized<string>> = {
  published: {
    en: "Channel article published; the button at the foot of the article is the deep link itself.",
    ru: "Статья канала опубликована; кнопка внизу статьи — это и есть диплинк.",
    de: "Kanalartikel veröffentlicht; die Schaltfläche am Fuß des Artikels ist der Deep Link selbst.",
    fr: "Article du canal publié ; le bouton en bas de l'article est le deep link lui-même.",
    it: "Articolo del canale pubblicato; il pulsante in fondo all'articolo è il deep link stesso.",
    nl: "Kanaalartikel gepubliceerd; de knop onderaan het artikel is de deeplink zelf.",
    cs: "Článek kanálu publikován; tlačítko na patě článku je samotný deep link.",
    "zh-Hans": "频道图文已发布，正文底部那条按钮就是深链本身。",
    "zh-Hant": "頻道圖文已發布，正文底部那條按鈕就是深鏈本身。",
    es: "Artículo del canal publicado; el botón al pie del artículo es el propio deep link.",
    pl: "Artykuł kanału opublikowany; przycisk na dole artykułu to sam deep link.",
    ja: "チャンネルの図文を投稿しました。本文の一番下のボタンがそのままディープリンクです。",
    th: "เผยแพร่บทความของช่องทางแล้ว ปุ่มท้ายบทความคือดีปลิงก์นั่นเอง",
    fi: "Kanartikkeli julkaistu; artikkelin alareunan painike on itse deeplink.",
    uk: "Статтю каналу опубліковано; кнопка внизу статті — це й є диплінк.",
    bg: "Статията на канала е публикувана; бутонът в края на статията е самият диплинк.",
    tr: "Kanal makalesi yayımlandı; makalenin altındaki düğme doğrudan derin bağlantının kendisidir.",
    hu: "A csatornacikk közzétéve; a cikk alján lévő gomb maga a deep link.",
  },
  opened: {
    en: "The phone tapped the deep link and the conversation switched from the channel to the service account.",
    ru: "Телефон открыл диплинк, и диалог переключился с канала на сервисный аккаунт.",
    de: "Das Telefon hat den Deep Link geöffnet, und die Unterhaltung wechselte vom Kanal zum Service-Konto.",
    fr: "Le téléphone a tapé le deep link et la conversation est passée du canal au compte de service.",
    it: "Il telefono ha aperto il deep link e la conversazione è passata dal canale all'account di servizio.",
    nl: "De telefoon opende de deeplink en het gesprek ging van het kanaal naar de serviceaccount.",
    cs: "Telefon klepl na deep link a konverzace přepnula z kanálu na servisní účet.",
    "zh-Hans": "手机点了深链，对话界面从频道切到服务号。",
    "zh-Hant": "手機點了深鏈，對話介面從頻道切到服務號。",
    es: "El teléfono abrió el deep link y la conversación pasó del canal a la cuenta de servicio.",
    pl: "Telefon kliknął deep link i rozmowa przełączyła się z kanału na konto serwisowe.",
    ja: "スマホがディープリンクをタップし、会話がチャンネルからサービスアカウントに切り替わりました。",
    th: "มือถือแตะดีปลิงก์ แล้วบทสนทนาสลับจากช่องทางมาสู่บัญชีบริการ",
    fi: "Puhelin napautti deeplinkkiä ja keskustelu siirtyi kanavasta palvelutilille.",
    uk: "Телефон відкрив диплінк, і розмова перемкнулася з каналу на сервісний акаунт.",
    bg: "Телефонът натисна диплинкът и разговорът превключи от канала към сервизния акаунт.",
    tr: "Telefon derin bağlantıya dokundu ve sohbet kanaldan Hizmet Hesabına geçti.",
    hu: "A telefon rákattintott a deep linkre, és a beszélgetés a csatornáról a szolgáltatási fiókra váltott.",
  },
  ref: {
    en: "The phone sent a reference uplink.",
    ru: "Телефон отправил восходящий ref.",
    de: "Das Telefon sendete einen Referenz-Uplink.",
    fr: "Le téléphone a envoyé une référence montante.",
    it: "Il telefono ha inviato un riferimento in uplink.",
    nl: "De telefoon stuurde een uplink-referentie.",
    cs: "Telefon poslal referenční uplink.",
    "zh-Hans": "手机回了一根上行引用。",
    "zh-Hant": "手機回了一根上行引用。",
    es: "El teléfono envió un enlace ascendente de referencia.",
    pl: "Telefon wysłał uplink odniesienia.",
    ja: "スマホが上りの参照（ref）を送り返しました。",
    th: "มือถือส่ง uplink อ้างอิงขึ้นมา",
    fi: "Puhelin lähetti ylöspäin viitauksen.",
    uk: "Телефон надіслав висхідний ref.",
    bg: "Телефонът изпрати восходяща препратка.",
    tr: "Telefon yukarı yönlü bir referans gönderdi.",
    hu: "A telefon felfelé egy hivatkozást küldött.",
  },
  articleCard: {
    en: "The gateway answered with a receipt card built the way send_article builds one, signed H5 link included.",
    ru: "Шлюз ответил receipt-карточкой, собранной так же, как это делает send_article, включая подписанную H5-ссылку.",
    de: "Das Gateway antwortete mit einer receipt-Karte, gebaut genau so, wie send_article sie baut, inklusive signiertem H5-Link.",
    fr: "La passerelle a répondu avec une carte receipt construite comme le fait send_article, lien H5 signé compris.",
    it: "Il gateway ha risposto con una card receipt costruita come fa send_article, link H5 firmato incluso.",
    nl: "De gateway antwoordde met een receipt-kaart, opgebouwd zoals send_article dat doet, inclusief getekende H5-link.",
    cs: "Brána odpověděla kartou receipt postavenou stejně jako ji staví send_article, včetně podepsaného odkazu H5.",
    "zh-Hans": "网关按 send_article 的路子答了一张 receipt 卡，带签名过的 H5 链接。",
    "zh-Hant": "閘道依 send_article 的路子答了一張 receipt 卡，帶簽名過的 H5 連結。",
    es: "La pasarela respondió con una tarjeta receipt construida como la construye send_article, con enlace H5 firmado incluido.",
    pl: "Brama odpowiedziała kartą receipt zbudowaną tak, jak buduje ją send_article, wraz z podpisanym linkiem H5.",
    ja: "ゲートウェイが send_article と同じ作り方での receipt カードで応答しました。署名付き H5 リンクも入っています。",
    th: "เกตเวย์ตอบกลับด้วยการ์ด receipt ที่ประกอบแบบเดียวกับ send_article รวมลิงก์ H5 ที่ลงนามแล้ว",
    fi: "Yhdin vastasi receipt-kortilla, joka on koottu samaan tapaan kuin send_article, allekirjoitettu H5-linkki mukana.",
    uk: "Шлюз відповів карткою receipt, зібраною так, як це робить send_article, разом із підписаним H5-посиланням.",
    bg: "Гейтвеят отговори с receipt карта, сглобена по начина, по който send_article я прави, включително с подписания H5 линк.",
    tr: "Ağ geçidi, send_article'ın kurduğu biçimde kurulmuş bir receipt kartıyla yanıt verdi; imzalı H5 bağlantısı dahil.",
    hu: "Az átjáró egy receipt kártyával válaszolt, ugyanúgy összeállítva, ahogy a send_article állítja össze; az aláírt H5-hivatkozással együtt.",
  },
  menuPush: {
    en: "menu_config pushed: one menu_push unit per follower.",
    ru: "Отправлен menu_config: по одной единице menu_push на подписчика.",
    de: "menu_config geschoben: eine menu_push-Einheit pro Follower.",
    fr: "menu_config poussé : une unité menu_push par abonné.",
    it: "menu_config inviato: una unità menu_push per follower.",
    nl: "menu_config doorgestuurd: één menu_push-eenheid per volger.",
    cs: "menu_config odeslán: jedna jednotka menu_push za každého odběratele.",
    "zh-Hans": "推送 menu_config：每个粉丝一格 menu_push 计量。",
    "zh-Hant": "推送 menu_config：每位粉絲一格 menu_push 計量。",
    es: "Se envió menu_config: una unidad menu_push por seguidor.",
    pl: "Wysłano menu_config: jedna jednostka menu_push na obserwującego.",
    ja: "menu_config をプッシュしました。ファン 1 人につき menu_push 1 単位です。",
    th: "ผลักดัน menu_config แล้ว: คิดหน่วย menu_push หนึ่งหน่วยต่อผู้ติดตาม",
    fi: "menu_config työnnetty: yksi menu_push-yksikkö jokaisesta seuraajasta.",
    uk: "Надіслано menu_config: по одній одиниці menu_push на підписника.",
    bg: "Изтласкан е menu_config: една menu_push единица за всеки последовател.",
    tr: "menu_config gönderildi: her takipçi için bir menu_push birimi.",
    hu: "A menu_config elküldve: egy-egy menu_push egység követőnként.",
  },
  cardSent: {
    en: "Card delivered, charged on the card meter.",
    ru: "Карточка доставлена, списание по счётчику card.",
    de: "Karte zugestellt, über den card-Zähler abgerechnet.",
    fr: "Carte livrée, facturée sur le compteur card.",
    it: "Card consegnata, addebitata sul contatore card.",
    nl: "Kaart bezorgd, afgerekend op de card-meter.",
    cs: "Karta doručena, účtováno přes měřič card.",
    "zh-Hans": "卡片已下发，计费单位 card。",
    "zh-Hant": "卡片已下發，計費單位 card。",
    es: "Tarjeta entregada, cobrada en el medidor card.",
    pl: "Karta dostarczona, rozliczona na liczniku card.",
    ja: "カードを配信しました。課金単位は card です。",
    th: "ส่งการ์ดถึงแล้ว คิดเงินตามมาตร card",
    fi: "Kortti toimitettu, laskutettu card-mittarilla.",
    uk: "Картку доставлено, списано за лічильником card.",
    bg: "Картата е доставена, таксувано по брояча card.",
    tr: "Kart iletildi, card sayacından ücretlendirildi.",
    hu: "A kártya kézbesítve, a card mérőegység szerint terhelve.",
  },
  cardVisible: {
    en: "The phone received the card.",
    ru: "Телефон получил карточку.",
    de: "Das Telefon hat die Karte empfangen.",
    fr: "Le téléphone a reçu la carte.",
    it: "Il telefono ha ricevuto la card.",
    nl: "De telefoon heeft de kaart ontvangen.",
    cs: "Telefon kartu přijal.",
    "zh-Hans": "手机收到卡片。",
    "zh-Hant": "手機收到卡片。",
    es: "El teléfono recibió la tarjeta.",
    pl: "Telefon odebrał kartę.",
    ja: "スマホがカードを受け取りました。",
    th: "มือถือรับการ์ดแล้ว",
    fi: "Puhelin vastaanotti kortin.",
    uk: "Телефон отримав картку.",
    bg: "Телефонът получи картата.",
    tr: "Telefon kartı aldı.",
    hu: "A telefon fogadta a kártyát.",
  },
  pollSent: {
    en: "Poll card delivered, charged POPOPX_CP_PER_CARD=1 for the card itself.",
    ru: "Карточка опроса доставлена: за саму карточку списано POPOPX_CP_PER_CARD=1.",
    de: "Umfrage-Karte zugestellt, für die Karte selbst POPOPX_CP_PER_CARD=1 berechnet.",
    fr: "Carte de sondage livrée, POPOPX_CP_PER_CARD=1 facturée pour la carte elle-même.",
    it: "Card del sondaggio consegnata, POPOPX_CP_PER_CARD=1 addebitata per la card stessa.",
    nl: "Pollkaart bezorgd, POPOPX_CP_PER_CARD=1 berekend voor de kaart zelf.",
    cs: "Karta hlasování doručena, za samotnou kartu účtováno POPOPX_CP_PER_CARD=1.",
    "zh-Hans": "投票卡下发，卡片本身按 POPOPX_CP_PER_CARD=1 计。",
    "zh-Hant": "投票卡下發，卡片本身依 POPOPX_CP_PER_CARD=1 計。",
    es: "Tarjeta de votación entregada, POPOPX_CP_PER_CARD=1 cobrado por la tarjeta en sí.",
    pl: "Karta ankiety dostarczona, POPOPX_CP_PER_CARD=1 naliczone za samą kartę.",
    ja: "投票カードを配信しました。カード自体は POPOPX_CP_PER_CARD=1 で課金です。",
    th: "ส่งการ์ดโพลแล้ว คิด POPOPX_CP_PER_CARD=1 สำหรับตัวการ์ดเอง",
    fi: "Kyselykortti toimitettu, itse kortista laskutettu POPOPX_CP_PER_CARD=1.",
    uk: "Картку опитування доставлено: за саму картку списано POPOPX_CP_PER_CARD=1.",
    bg: "Картата с анкетата е доставена, за самата карта се таксува POPOPX_CP_PER_CARD=1.",
    tr: "Anket kartı iletildi, kartın kendisi için POPOPX_CP_PER_CARD=1 ücretlendirildi.",
    hu: "A szavazókártya kézbesítve, magáért a kártyáért POPOPX_CP_PER_CARD=1 terheléssel.",
  },
  voteCounted: {
    en: `Vote counted: the card was updated in place by cardId (m:"u"), charged POPOPX_CP_PER_POLL=1.`,
    ru: `Голос засчитан: карточка обновлена на месте по cardId (m:"u"), списано POPOPX_CP_PER_POLL=1.`,
    de: `Stimme gezählt: Die Karte wurde über cardId an Ort und Stelle aktualisiert (m:"u"), POPOPX_CP_PER_POLL=1 berechnet.`,
    fr: `Vote compté : la carte a été mise à jour en place via cardId (m:"u"), facturé POPOPX_CP_PER_POLL=1.`,
    it: `Voto conteggiato: la card è stata aggiornata sul posto tramite cardId (m:"u"), addebitato POPOPX_CP_PER_POLL=1.`,
    nl: `Stem geteld: de kaart werd ter plaatse bijgewerkt via cardId (m:"u"), POPOPX_CP_PER_POLL=1 berekend.`,
    cs: `Hlas započten: karta byla aktualizována na místě podle cardId (m:"u"), účtováno POPOPX_CP_PER_POLL=1.`,
    "zh-Hans": `这一票计入了：卡片按 cardId 原地更新（m:"u"），POPOPX_CP_PER_POLL=1。`,
    "zh-Hant": `這一票計入了：卡片依 cardId 原地更新（m:"u"），POPOPX_CP_PER_POLL=1。`,
    es: `Voto contado: la tarjeta se actualizó en el sitio por cardId (m:"u"), cobrado POPOPX_CP_PER_POLL=1.`,
    pl: `Głos zaliczony: karta została zaktualizowana w miejscu po cardId (m:"u"), naliczono POPOPX_CP_PER_POLL=1.`,
    ja: `投票を集計しました。カードは cardId でその場に更新（m:"u"）、POPOPX_CP_PER_POLL=1 を課金です。`,
    th: `นับคะแนนแล้ว: การ์ดถูกอัปเดต ณ ที่เดิมตาม cardId (m:"u") คิด POPOPX_CP_PER_POLL=1`,
    fi: `Ääni laskettu: kortti päivitettiin paikallaan cardId:n avulla (m:"u"), laskutettu POPOPX_CP_PER_POLL=1.`,
    uk: `Голос зараховано: картку оновлено на місці за cardId (m:"u"), списано POPOPX_CP_PER_POLL=1.`,
    bg: `Гласът е отчетен: картата е обновена на място по cardId (m:"u"), таксувано POPOPX_CP_PER_POLL=1.`,
    tr: `Oy sayıldı: kart cardId ile yerinde güncellendi (m:"u"), POPOPX_CP_PER_POLL=1 ücretlendirildi.`,
    hu: `A szavazat számítva: a kártya a helyén frissült a cardId alapján (m:"u"), POPOPX_CP_PER_POLL=1 terheléssel.`,
  },
  voteReplay: {
    en: "decide_vote_write called this a replay: the same option is not counted twice and not charged twice.",
    ru: "decide_vote_write счёл это повтором: один и тот же вариант не считается дважды и не списывается дважды.",
    de: "decide_vote_write stufte das als Replay ein: dieselbe Option wird weder zweimal gezählt noch zweimal berechnet.",
    fr: "decide_vote_write a qualifié cela de rejeu : la même option n'est ni comptée deux fois ni facturée deux fois.",
    it: "decide_vote_write ha classificato questo come replay: la stessa opzione non viene conteggiata né addebitata due volte.",
    nl: "decide_vote_write zag dit als replay: dezelfde optie wordt niet twee keer geteld én niet twee keer berekend.",
    cs: "decide_vote_write to označil jako replay: stejná volba se nezapočítává dvakrát ani se dvakrát neúčtuje.",
    "zh-Hans": "decide_vote_write 判为重放：同一个选项不数第二遍，也不扣第二格。",
    "zh-Hant": "decide_vote_write 判為重放：同一個選項不數第二遍，也不扣第二格。",
    es: "decide_vote_write lo marcó como repetición: la misma opción no se cuenta dos veces ni se cobra dos veces.",
    pl: "decide_vote_write uznał to za powtórzenie: ta sama opcja nie jest liczona ani naliczana podwójnie.",
    ja: "decide_vote_write はこれをリプレイと判定しました。同じ選択肢は 2 度数えられず、2 度課金もされません。",
    th: "decide_vote_write ระบุว่าเป็นการเล่นซ้ำ: ตัวเลือกเดิมไม่นับสองครั้งและไม่เก็บเงินสองครั้ง",
    fi: "decide_vote_write luokitteli tämän toistoksi: samaa vaihtoehtoa ei lasketa eikä laskuteta kahdesti.",
    uk: "decide_vote_write визнав це повтором: той самий варіант не рахується й не списується двічі.",
    bg: "decide_vote_write го определи като повторение: една и съща опция не се брои и не се таксува два пъти.",
    tr: "decide_vote_write bunu tekrar saydı: aynı seçenek iki kez ne sayılır ne ücretlendirilir.",
    hu: "A decide_vote_write ismétlésnek minősítette: ugyanaz az opció sem nem számít kétszer, sem nem terhel kétszer.",
  },
  acked: {
    en: "The alert moved to acknowledged: the same security card pushed its bar to 100% and the ack button became a terminal one.",
    ru: "Оповещение переведено в acknowledged: та же security-карточка довела полосу до 100 %, а кнопка подтверждения стала терминальной.",
    de: "Der Alarm wechselte auf acknowledged: dieselbe security-Karte schob den Balken auf 100 %, und der Bestätigungsbutton wurde zum Endzustand.",
    fr: "L'alerte est passée à acknowledged : la même carte security a poussé la barre à 100 % et le bouton d'acquittement est devenu terminal.",
    it: "L'avviso è passato a acknowledged: la stessa card security ha spinto la barra al 100% e il pulsante di conferma è diventato terminale.",
    nl: "Het alarm ging naar acknowledged: dezelfde security-kaart duwde de balk naar 100% en de ack-knop werd een eindknop.",
    cs: "Alert přešel do acknowledged: stejná security karta posunula pruh na 100 % a tlačítko potvrzení se stalo koncovým.",
    "zh-Hans": "告警转 acknowledged：同一张 security 卡原地把进度推到 100%，确认键换成终结态按钮。",
    "zh-Hant": "告警轉 acknowledged：同一張 security 卡原地把進度推到 100%，確認鍵換成終結態按鈕。",
    es: "El aviso pasó a acknowledged: la misma tarjeta security llevó la barra al 100 % y el botón de confirmación quedó en estado terminal.",
    pl: "Alarm przeszedł do acknowledged: ta sama karta security dopchnęła pasek do 100%, a przycisk potwierdzenia stał się końcowy.",
    ja: "アラートが acknowledged に移りました。同じ security カードがプログレスバーを 100% に押し上げ、確認ボタンは終端状態のボタンに変わりました。",
    th: "แจ้งเตือนย้ายไปสถานะ acknowledged: การ์ด security ใบเดิมดันแถบไปถึง 100% ส่วนปุ่มยืนยันกลายเป็นปุ่มปิดท้าย",
    fi: "Hälytys siirtyi tilaan acknowledged: sama security-kortti työnsi palkin 100 %:iin ja kuittauspainike muuttui lopputilan painikkeeksi.",
    uk: "Сповіщення переведено в acknowledged: та сама картка security дійшла смужкою до 100 %, а кнопку підтвердження замінено на термінальну.",
    bg: "Сигналът премина в acknowledged: същата security карта довеси лентата до 100%, а бутонът за потвърждение стана краен.",
    tr: "Uyarı acknowledged durumuna geçti: aynı security kartı çubuğu %100'e çıkardı ve onay düğmesi son durum düğmesine dönüştü.",
    hu: "A riasztás acknowledged állapotba ment át: ugyanaz a security kártya 100%-ra tolta a sávot, a nyugtázó gomb pedig záróállapotú gomb lett.",
  },
  callback: {
    en: "Card callback uplink.",
    ru: "Восходящий вызов карточки.",
    de: "Karten-Callback-Uplink.",
    fr: "Uplink de rappel de carte.",
    it: "Uplink di callback della card.",
    nl: "Callback-uplink van de kaart.",
    cs: "Uplink callbacku karty.",
    "zh-Hans": "卡片回调上行。",
    "zh-Hant": "卡片回呼上行。",
    es: "Uplink de callback de la tarjeta.",
    pl: "Uplink callbacku karty.",
    ja: "カードのコールバック上り。",
    th: "uplink callback ของการ์ด",
    fi: "Kortin callback-lähetys ylöspäin.",
    uk: "Висхідний callback картки.",
    bg: "Восходяща callback заявка от картата.",
    tr: "Kart geri çağırma uplink'i.",
    hu: "Kártya callback felfelé.",
  },
  unmatched: {
    en: "No plugin claimed this payload, so _kind_card_callback answers no_handler_for_payload; the button stays locked under the client's own rule until a card update releases it.",
    ru: "Ни один плагин не забрал этот payload, поэтому _kind_card_callback отвечает no_handler_for_payload; кнопка остаётся заблокированной по правилу клиента, пока её не разблокирует обновление карточки.",
    de: "Kein Plugin hat diesen Payload übernommen, daher antwortet _kind_card_callback mit no_handler_for_payload; die Schaltfläche bleibt nach der Client-Regel gesperrt, bis eine Kartenaktualisierung sie freigibt.",
    fr: "Aucun plugin n'a pris en charge ce payload, donc _kind_card_callback répond no_handler_for_payload ; le bouton reste verrouillé selon la règle du client jusqu'à ce qu'une mise à jour de carte le libère.",
    it: "Nessun plugin ha reclamato questo payload, quindi _kind_card_callback risponde no_handler_for_payload; il pulsante resta bloccato secondo la regola del client finché un aggiornamento della card non lo sblocca.",
    nl: "Geen plugin eiste deze payload op, dus _kind_card_callback antwoordt no_handler_for_payload; de knop blijft volgens de clientregel vergrendeld tot een kaartupdate hem vrijgeeft.",
    cs: "Žádný plugin tento payload nepřevzal, takže _kind_card_callback odpoví no_handler_for_payload; tlačítko zůstává podle pravidla klienta uzamčené, dokud ho neuvolní aktualizace karty.",
    "zh-Hans": "没有插件认领这个 payload，_kind_card_callback 回 no_handler_for_payload；按钮按客户端规则锁住，等卡片更新才放开。",
    "zh-Hant": "沒有外掛認領這個 payload，_kind_card_callback 回 no_handler_for_payload；按鈕依客戶端規則鎖住，等卡片更新才放開。",
    es: "Ningún plugin reclamó este payload, así que _kind_card_callback responde no_handler_for_payload; el botón queda bloqueado según la regla del cliente hasta que una actualización de la tarjeta lo libere.",
    pl: "Żadna wtyczka nie przejęła tego payloadu, więc _kind_card_callback odpowiada no_handler_for_payload; przycisk pozostaje zablokowany zgodnie z regułą klienta, aż odblokuje go aktualizacja karty.",
    ja: "この payload を引き受けるプラグインがなく、_kind_card_callback は no_handler_for_payload を返します。クライアント側のルールでボタンはロックされたまま、カードの更新で解除されます。",
    th: "ไม่มีปลั๊กอินรับ payload นี้ไว้ _kind_card_callback จึงตอบ no_handler_for_payload ปุ่มจึงล็อกอยู่ตามกติกาของฝั่งไคลเอนต์ จนกว่าการ์ดจะอัปเดตแล้วปลดออก",
    fi: "Yksikään laajennus ei ottanut tätä payloadia, joten _kind_card_callback vastaa no_handler_for_payload; painike pysyy lukittuna asiakaspuolen säännön mukaan, kunnes kortin päivitys vapauttaa sen.",
    uk: "Жоден плагін не забрав цей payload, тому _kind_card_callback відповідає no_handler_for_payload; кнопка лишається заблокованою за правилом клієнта, доки її не розблокує оновлення картки.",
    bg: "Никакъв плъгин не пое този payload, затова _kind_card_callback отговаря no_handler_for_payload; бутонът си остава заключен по правилото на клиента, докато обновяване на картата го освободи.",
    tr: "Bu payload'ı hiçbir eklenti üstlenmedi, bu yüzden _kind_card_callback no_handler_for_payload yanıtlıyor; düğme istemci kuralına göre kilitli kalır, kart güncellemesi onu bırakana kadar.",
    hu: "Egyik bővítmény sem vállalta ezt a payloadot, ezért a _kind_card_callback válasza no_handler_for_payload; a gomb az ügyfél szabálya szerint zárva marad, amíg egy kártyafrissítés fel nem oldja.",
  },
  menuLeaf: {
    en: "A menu leaf was tapped: a click item arrives flattened into action and payload, and the gateway runs it through _run_menu_item.",
    ru: "Нажали на лист меню: пункт типа click приходит расплющенный в поля action и payload, и шлюз прогоняет его через _run_menu_item.",
    de: "Ein Menü-Blatt wurde angetippt: Ein click-Eintrag kommt flach als action und payload an, und das Gateway führt ihn über _run_menu_item aus.",
    fr: "Une feuille de menu a été touchée : un élément click arrive aplati en action et payload, et la passerelle l'exécute via _run_menu_item.",
    it: "Una foglia del menu è stata toccata: una voce click arriva appiattita in action e payload, e il gateway la esegue tramite _run_menu_item.",
    nl: "Een menu-blad werd getikt: een click-item komt plat als action en payload aan, en de gateway voert het uit via _run_menu_item.",
    cs: "List nabídky byl klepnut: položka click přichází rozploštělá do action a payload, a brána ji spustí přes _run_menu_item.",
    "zh-Hans": "菜单叶子被点：kind=click 的条目把 action 摊平成 action/payload 两个键，网关按 _run_menu_item 走。",
    "zh-Hant": "選單葉被點：kind=click 的條目把 action 攤平為 action/payload 兩個鍵，閘道依 _run_menu_item 執行。",
    es: "Se tocó una hoja del menú: un elemento click llega aplanado en action y payload, y la pasarela lo ejecuta por _run_menu_item.",
    pl: "Ktoś kliknął liść menu: pozycja click przychodzi spłaszczona do action i payload, a brama uruchamia ją przez _run_menu_item.",
    ja: "メニューの末端をタップしました。kind=click の項目は action と payload の 2 キーに平坦化されて届き、ゲートウェイは _run_menu_item で処理します。",
    th: "แตะใบเมนู: รายการแบบ click ถูกแบนเหลือคีย์ action กับ payload แล้วเกตเวย์ก็รันผ่าน _run_menu_item",
    fi: "Valikon lehteä napauttiin: click-kohta saapuu litistettynä action- ja payload-kenttinä, ja yhdin ajaa sen _run_menu_item -kohdan kautta.",
    uk: "Натиснули лист меню: пункт типу click приходить сплющений у поля action і payload, і шлюз виконує його через _run_menu_item.",
    bg: "Натиснат е лист от менюто: елементът с тип click пристига сплескан в полетата action и payload, а гейтвеят го изпълнява през _run_menu_item.",
    tr: "Bir menü yaprağına dokunuldu: click türündeki öğe action ve payload olarak düzleştirilip geliyor ve ağ geçidi onu _run_menu_item üzerinden çalıştırıyor.",
    hu: "A menü egyik levelét nyomták meg: a click típusú bejegyzés action és payload mezőkre lapítva érkezik, és az átjáró a _run_menu_item szerint hajtja végre.",
  },
  menuView: {
    en: "A view item carries only a url; build_menu_item deliberately gives it no sub key.",
    ru: "Пункт view несёт только url; build_menu_item намеренно не даёт ему ключ sub.",
    de: "Ein view-Eintrag enthält nur eine url; build_menu_item gibt ihm bewusst keinen sub-Schlüssel.",
    fr: "Un élément view ne porte qu'un url ; build_menu_item ne lui donne volontairement pas de clé sub.",
    it: "Una voce view porta solo un url; build_menu_item deliberatamente non le dà la chiave sub.",
    nl: "Een view-item bevat alleen een url; build_menu_item geeft het bewust geen sub-sleutel.",
    cs: "Položka view nese jen url; build_menu_item jí záměrně nedá klíč sub.",
    "zh-Hans": "kind=view 的条目只带 url；build_menu_item 明确不给它 sub 键。",
    "zh-Hant": "kind=view 的條目只帶 url；build_menu_item 明確不給它 sub 鍵。",
    es: "Un elemento view lleva solo un url; build_menu_item deliberadamente no le da clave sub.",
    pl: "Pozycja view niesie tylko url; build_menu_item celowo nie nadaje jej klucza sub.",
    ja: "kind=view の項目は url だけを持ちます。build_menu_item は意図的に sub キーを付けません。",
    th: "รายการแบบ view มีแค่ url โดย build_menu_item ตั้งใจไม่ใส่คีย์ sub ให้",
    fi: "view-kohta sisältää vain urlin; build_menu_item ei anna sille tietoisesti sub-avainta.",
    uk: "Пункт view несе лише url; build_menu_item навмисно не дає йому ключа sub.",
    bg: "Елементът от тип view носи само url; build_menu_item умишлено не му дава ключ sub.",
    tr: "Bir view öğesi yalnızca bir url taşır; build_menu_item ona kasıtlı olarak sub anahtarı vermez.",
    hu: "A view bejegyzés csak egy url-t visz; a build_menu_item szándékosan nem ad neki sub kulcsot.",
  },
  scanner: SCANNER_NOTE,
  h5: {
    en: "An open_url action was tapped and the signed link went to the browser.",
    ru: "Нажали действие open_url, и подписанная ссылка ушла в браузер.",
    de: "Eine open_url-Aktion wurde angetippt, und der signierte Link ging an den Browser.",
    fr: "Une action open_url a été touchée et le lien signé est parti dans le navigateur.",
    it: "Un'azione open_url è stata toccata e il link firmato è passato al browser.",
    nl: "Een open_url-actie werd getikt en de getekende link ging naar de browser.",
    cs: "Klepli na akci open_url a podepsaný odkaz putoval do prohlížeče.",
    "zh-Hans": "open_url 动作被点，签名链接交给浏览器。",
    "zh-Hant": "open_url 動作被點，簽名連結交給瀏覽器。",
    es: "Se tocó una acción open_url y el enlace firmado pasó al navegador.",
    pl: "Kliknięto akcję open_url, a podpisany link powędrował do przeglądarki.",
    ja: "open_url アクションをタップし、署名付きリンクがブラウザに渡されました。",
    th: "แตะแอ็กชัน open_url แล้วลิงก์ที่ลงนามถูกส่งต่อไปยังเบราว์เซอร์",
    fi: "open_url -toiminto napauttiin ja allekirjoitettu linkki siirtyi selaimeen.",
    uk: "Натиснули дію open_url, і підписане посилання подалося в браузер.",
    bg: "Натиснато е действие open_url, а подписаният линк отиде в четеца.",
    tr: "Bir open_url eylemine dokunuldu ve imzalı bağlantı tarayıcıya gitti.",
    hu: "Egy open_url műveletet nyomtak meg, az aláírt hivatkozás pedig a böngészőbe került.",
  },
  rotate: {
    en: "The phone sent ::CB::rotate:<channelId> and the gateway answered with a channel_key_update frame, charged POPOPX_CP_PER_KEY_ROTATION=2.",
    ru: "Телефон отправил ::CB::rotate:<channelId>, шлюз ответил кадром channel_key_update, списано POPOPX_CP_PER_KEY_ROTATION=2.",
    de: "Das Telefon sendete ::CB::rotate:<channelId>, und das Gateway antwortete mit einem channel_key_update-Rahmen; abgerechnet über POPOPX_CP_PER_KEY_ROTATION=2.",
    fr: "Le téléphone a envoyé ::CB::rotate:<channelId> et la passerelle a répondu par une trame channel_key_update, facturée POPOPX_CP_PER_KEY_ROTATION=2.",
    it: "Il telefono ha inviato ::CB::rotate:<channelId> e il gateway ha risposto con un frame channel_key_update, addebitato POPOPX_CP_PER_KEY_ROTATION=2.",
    nl: "De telefoon stuurde ::CB::rotate:<channelId> en de gateway antwoordde met een channel_key_update-frame, berekend POPOPX_CP_PER_KEY_ROTATION=2.",
    cs: "Telefon poslal ::CB::rotate:<channelId> a brána odpověděla rámcem channel_key_update, účtováno POPOPX_CP_PER_KEY_ROTATION=2.",
    "zh-Hans": "手机发了 ::CB::rotate:<channelId>，网关回一帧 channel_key_update，按 POPOPX_CP_PER_KEY_ROTATION=2 计量。",
    "zh-Hant": "手機發了 ::CB::rotate:<channelId>，閘道回一幀 channel_key_update，依 POPOPX_CP_PER_KEY_ROTATION=2 計量。",
    es: "El teléfono envió ::CB::rotate:<channelId> y la pasarela respondió con un cuadro channel_key_update, cobrado POPOPX_CP_PER_KEY_ROTATION=2.",
    pl: "Telefon wysłał ::CB::rotate:<channelId>, a brama odpowiedziała ramką channel_key_update, naliczono POPOPX_CP_PER_KEY_ROTATION=2.",
    ja: "スマホが ::CB::rotate:<channelId> を送り、ゲートウェイは channel_key_update フレームで応答しました。課金は POPOPX_CP_PER_KEY_ROTATION=2 です。",
    th: "มือถือส่ง ::CB::rotate:<channelId> แล้วเกตเวย์ตอบด้วยเฟรม channel_key_update คิด POPOPX_CP_PER_KEY_ROTATION=2",
    fi: "Puhelin lähetti ::CB::rotate:<channelId> ja yhdin vastasi channel_key_update-kehyksellä, laskutettu POPOPX_CP_PER_KEY_ROTATION=2.",
    uk: "Телефон надіслав ::CB::rotate:<channelId>, а шлюз відповів кадром channel_key_update, списано POPOPX_CP_PER_KEY_ROTATION=2.",
    bg: "Телефонът изпрати ::CB::rotate:<channelId>, а гейтвеят отговори с кадър channel_key_update, таксувано POPOPX_CP_PER_KEY_ROTATION=2.",
    tr: "Telefon ::CB::rotate:<channelId> gönderdi, ağ geçidi bir channel_key_update çerçevesiyle yanıt verdi ve POPOPX_CP_PER_KEY_ROTATION=2 ücretlendirildi.",
    hu: "A telefon elküldte, hogy ::CB::rotate:<channelId>, az átjáró pedig egy channel_key_update kerettel válaszolt, POPOPX_CP_PER_KEY_ROTATION=2 terheléssel.",
  },
  rotateReplay: {
    en: "Pressing again turns this into a replay: frame_channel_key_update refuses se == env.epoch, and the client's isSane would drop the frame too.",
    ru: "Повторное нажатие превращает это в replay: frame_channel_key_update не принимает se == env.epoch, и клиентский isSane тоже выбросил бы этот кадр.",
    de: "Erneut drücken macht daraus ein Replay: frame_channel_key_update lehnt se == env.epoch ab, und isSane des Clients würde den Rahmen ebenfalls verwerfen.",
    fr: "Appuyer encore en fait un rejeu : frame_channel_key_update refuse se == env.epoch, et le isSane du client jetterait aussi cette trame.",
    it: "Premere di nuovo lo trasforma in replay: frame_channel_key_update rifiuta se == env.epoch, e anche isSane del client scarterebbe il frame.",
    nl: "Nogmaals drukken maakt er een replay van: frame_channel_key_update wijst se == env.epoch af, en de isSane van de client zou het frame ook laten vallen.",
    cs: "Další stisk z toho dělá replay: frame_channel_key_update odmítá se == env.epoch a isSane klienta by rámec rovněž zahodilo.",
    "zh-Hans": "再点一次就变成重放：frame_channel_key_update 不接受 se == env.epoch，客户端的 isSane 也会把这一帧丢掉。",
    "zh-Hant": "再點一次就變成重放：frame_channel_key_update 不接受 se == env.epoch，客戶端的 isSane 也會把這一幀丟掉。",
    es: "Volver a pulsarlo lo convierte en repetición: frame_channel_key_update rechaza se == env.epoch, y el isSane del cliente también descartaría el cuadro.",
    pl: "Ponowne naciśnięcie zamienia to w powtórzenie: frame_channel_key_update odrzuca se == env.epoch, a isSane klienta i tak wyrzuciłby tę ramkę.",
    ja: "もう一度押すとリプレイになります。frame_channel_key_update は se == env.epoch を拒否し、クライアント側の isSane もこのフレームを破棄します。",
    th: "กดอีกครั้งกลายเป็นเล่นซ้ำ: frame_channel_key_update ไม่รับ se == env.epoch และ isSane ฝั่งไคลเอนต์ก็จะทิ้งเฟรมนี้เหมือนกัน",
    fi: "Uudelleen painaminen tekee tästä toiston: frame_channel_key_update hylkää se == env.epoch, ja asiakkaan isSane hylkäisi kehyksen samoin.",
    uk: "Повторне натискання перетворює це на повтор: frame_channel_key_update не приймає se == env.epoch, і клієнтський isSane теж викинув би цей кадр.",
    bg: "Натискането отново го превръща в повторение: frame_channel_key_update отказва se == env.epoch, и isSane на клиента също би изхвърлил кадъра.",
    tr: "Tekrar basmak bunu tekrar haline getirir: frame_channel_key_update se == env.epoch değerini reddeder, istemcinin isSane denetimi de bu çerçeveyi atardı.",
    hu: "Újbóli nyomás replay-jé teszi: a frame_channel_key_update elutasítja a se == env.epoch esetet, és az ügyfél isSane ellenőrzése szintén eldobná a keretet.",
  },
  reset: {
    en: "Demo reset to its factory state.",
    ru: "Демо сброшено до заводского состояния.",
    de: "Demo auf Werkszustand zurückgesetzt.",
    fr: "Démo réinitialisée à son état d'usine.",
    it: "Demo riportata allo stato di fabbrica.",
    nl: "Demo teruggezet naar fabrieksstatus.",
    cs: "Demo obnoveno do továrního stavu.",
    "zh-Hans": "演示已重置，回到出厂状态。",
    "zh-Hant": "示範已重設，回到出廠狀態。",
    es: "Demo restablecida a su estado de fábrica.",
    pl: "Demo przywrócone do stanu fabrycznego.",
    ja: "デモを出荷時の状態にリセットしました。",
    th: "รีเซ็ตเดโมกลับสู่สถานะจากโรงงาน",
    fi: "Demot palautettu tehtaantilaan.",
    uk: "Демо скинуто до заводського стану.",
    bg: "Демонстрацията е върната в заводското си състояние.",
    tr: "Demo fabrika durumuna sıfırlandı.",
    hu: "A demó visszaállítva gyári állapotába.",
  },
  nothing: {
    en: "Nothing has happened yet: this is the factory screen.",
    ru: "Пока ничего не произошло: это заводской экран.",
    de: "Noch ist nichts geschehen: das ist die Werksansicht.",
    fr: "Rien ne s'est encore passé : c'est l'écran d'usine.",
    it: "Non è ancora successo nulla: questa è la schermata di fabbrica.",
    nl: "Er is nog niets gebeurd: dit is het fabrieksscherm.",
    cs: "Zatím se nic nestalo: tohle je tovární obrazovka.",
    "zh-Hans": "什么都没发生：这是出厂画面。",
    "zh-Hant": "什麼都沒有發生：這是出廠畫面。",
    es: "Todavía no ha pasado nada: esta es la pantalla de fábrica.",
    pl: "Nic się jeszcze nie stało: to jest ekran fabryczny.",
    ja: "まだ何も起きていません。出荷時の画面です。",
    th: "ยังไม่มีอะไรเกิดขึ้น: นี่คือหน้าจอจากโรงงาน",
    fi: "Mitään ei ole vielä tapahtunut: tämä on tehdasnäkymä.",
    uk: "Поки що нічого не сталося: це заводський екран.",
    bg: "Все още нищо не се е случило: това е заводският екран.",
    tr: "Henüz hiçbir şey olmadı: bu fabrika ekranı.",
    hu: "Még semmi nem történt: ez a gyári képernyő.",
  },
};

/* ──────────────────────────────────────────────────────────────────────────
 * Wire builders — they mirror the Python functions key for key
 * ────────────────────────────────────────────────────────────────────────── */

/** `crypto_service.b64_std` over a deterministic byte run: examples, not keys. */
function fakeBytes(seed: number, length: number): number[] {
  const out: number[] = [];
  let x = seed >>> 0;
  for (let i = 0; i < length; i += 1) {
    x = (x * 1_664_525 + 1_013_904_223) >>> 0;
    out.push((x >>> 16) & 0xff);
  }
  return out;
}

/** Standard padded base64, written out so the padding is the real thing. */
function b64std(data: readonly number[]): string {
  let out = "";
  for (let i = 0; i < data.length; i += 3) {
    const b0 = data[i];
    const b1 = i + 1 < data.length ? data[i + 1] : 0;
    const b2 = i + 2 < data.length ? data[i + 2] : 0;
    out += STD_ALPHABET[b0 >> 2];
    out += STD_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < data.length ? STD_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < data.length ? STD_ALPHABET[b2 & 0x3f] : "=";
  }
  return out;
}

/** `b64_url`: base64url without padding, the client's own form. */
function b64url(data: readonly number[]): string {
  let out = "";
  for (let i = 0; i < data.length; i += 3) {
    const b0 = data[i];
    const b1 = i + 1 < data.length ? data[i + 1] : 0;
    const b2 = i + 2 < data.length ? data[i + 2] : 0;
    out += URL_ALPHABET[b0 >> 2];
    out += URL_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    if (i + 1 < data.length) {
      out += URL_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)];
    }
    if (i + 2 < data.length) {
      out += URL_ALPHABET[b2 & 0x3f];
    }
  }
  return out;
}

const EPOCH_KEY_1 = b64url(fakeBytes(0x5eed01, 32));
const EPOCH_KEY_2 = b64url(fakeBytes(0x5eed02, 32));
const IDENTITY_PUB = b64url(fakeBytes(0x5eed03, 32));

/** The channel bootstrap URI: two path segments and only key=/pub= in the fragment. */
const CHANNEL_URI = "popopx://channel/%s/%s#key=%s&pub=%s"
  .replace("%s", RELAY_HOST)
  .replace("%s", CHANNEL_ID)
  .replace("%s", EPOCH_KEY_1)
  .replace("%s", IDENTITY_PUB);

/** `PopopxChannelEpochSecret` — the JSON inside the box. */
function epochSecret(epoch: number, keyB64Url: string): string {
  return JSON.stringify({ epoch, keyBase64URL: keyB64Url });
}

/** `seal_envelope`: ciphertext is the box with the 16-byte tag appended. */
function envelope(epoch: number, keyB64Url: string): Record<string, string | number> {
  const secret = epochSecret(epoch, keyB64Url);
  const body = fakeBytes(0xbee7 + epoch, secret.length);
  const tag = fakeBytes(0xa9 + epoch, 16);
  return {
    protocol: "popopx.channel.enc.v1",
    epoch,
    nonce: b64std(fakeBytes(0x0ece + epoch, 12)),
    ciphertext: b64std([...body, ...tag]),
    signature: b64std(fakeBytes(0x519 + epoch * 7, 64)),
  };
}

/** `build_card` output for one of the page's cards, in the client's key order. */
function cardWire(card: CardMsg, locale: Locale): Record<string, unknown> {
  const out: Record<string, unknown> = {
    id: card.id,
    v: card.v,
    title: pick(card.title, locale),
    ut: card.ut,
  };
  if (card.body !== undefined) {
    out.body = pick(card.body, locale);
  }
  if (card.fields.length > 0) {
    out.fields = card.fields.map((field) => ({
      k: pick(field.k, locale),
      v: pick(field.v, locale),
      ...(field.mono ? { mono: true } : {}),
    }));
  }
  if (card.progress !== undefined) {
    out.progress = { l: pick(card.progress.l, locale), p: card.progress.p, d: pick(card.progress.d, locale) };
  }
  if (card.actions.length > 0) {
    out.actions = card.actions.map((action) => ({
      id: action.id,
      title: pick(action.title, locale),
      action: action.kind,
      style: action.style,
      ...(action.payload === undefined ? {} : { payload: action.payload }),
      ...(action.url === undefined ? {} : { url: action.url }),
    }));
  }
  if (card.et !== undefined) {
    out.et = card.et;
  }
  return out;
}

function cardFrame(card: CardMsg, locale: Locale): string {
  return ECO_MARKER + JSON.stringify({ t: "sc", m: card.mode, card: cardWire(card, locale) });
}

/** `build_menu_item`: a view leaf gets url and nothing else; a click leaf is flattened. */
function menuLeafWire(leaf: MenuLeaf, locale: Locale): Record<string, unknown> {
  if (leaf.kind === "view") {
    return { title: pick(leaf.title, locale), kind: "view", url: leaf.url };
  }
  return {
    title: pick(leaf.title, locale),
    kind: leaf.kind,
    ...(leaf.action === undefined ? {} : { action: leaf.action }),
    ...(leaf.payload === undefined ? {} : { payload: leaf.payload }),
    ...(leaf.url === undefined ? {} : { url: leaf.url }),
    sub: [],
  };
}

function menuFrame(rev: number, locale: Locale): string {
  const items = MENU_TOP.map((item) => {
    if (item.kind === "view") {
      return { title: pick(item.title, locale), kind: "view", url: item.url };
    }
    return {
      title: pick(item.title, locale),
      kind: item.kind,
      sub: (item.sub ?? []).map((leaf) => menuLeafWire(leaf, locale)),
    };
  });
  return ECO_MARKER + JSON.stringify({ t: "mc", menu: { items, rev } });
}

function keyUpdateFrame(epoch: number, sealedUnder: number, locale: Locale): string {
  void locale;
  return ECO_MARKER + JSON.stringify({
    t: "ku",
    update: { ch: CHANNEL_ID, se: sealedUnder, rp: true, env: envelope(epoch, epoch === 1 ? EPOCH_KEY_1 : EPOCH_KEY_2) },
  });
}

/* ──────────────────────────────────────────────────────────────────────────
 * Cards the console can send
 * ────────────────────────────────────────────────────────────────────────── */

function cardOf(style: CardStyle, id: string, ut: number): CardMsg {
  const spec = CARD_COPY[style];
  return {
    kind: "card",
    id,
    v: style,
    title: spec.title,
    body: spec.body,
    ut,
    fields: spec.fields,
    actions: spec.actions,
    mode: "c",
    ...(style === "security" ? { progress: { l: STATUS_WORD, p: 0, d: FIRING } } : {}),
  };
}

function articleCard(ut: number): CardMsg {
  return {
    kind: "card",
    id: "art_%s".replace("%s", "Kp3Ls9Nq1uYb4Tc"),
    v: "receipt",
    title: ARTICLE_TITLE,
    body: ARTICLE_BODY,
    ut,
    fields: [{ k: P_ARTICLE, v: ARTICLE_TITLE }],
    actions: [{ id: "read", title: P_READ, kind: "open_url", style: "primary", url: H5_URL }],
    mode: "c",
  };
}

/** `polls_plugin.fields_for` + `progress_for`, recomputed for one follower's card. */
function pollCard(counts: readonly number[], voted: readonly number[], ut: number, mode: "c" | "u"): CardMsg {
  const total = counts.reduce((sum, count) => sum + count, 0);
  const shares = counts.map((count) => (total === 0 ? 0 : Math.round((count * 100) / total)));
  const leader = shares.length === 0 ? 0 : shares.indexOf(Math.max(...shares));
  const leadingShare = shares.length === 0 ? 0 : Math.max(...shares);
  const fields: WireField[] = counts.map((count, index) => ({
    k: POLL_OPTIONS[index],
    v: {
      en: `${count} ${pick(P_VOTES, "en")} · ${shares[index]}%`,
      ru: `${count} ${pick(P_VOTES, "ru")} · ${shares[index]}%`,
      de: `${count} ${pick(P_VOTES, "de")} · ${shares[index]} %`,
      fr: `${count} ${pick(P_VOTES, "fr")} · ${shares[index]} %`,
      it: `${count} ${pick(P_VOTES, "it")} · ${shares[index]}%`,
      nl: `${count} ${pick(P_VOTES, "nl")} · ${shares[index]}%`,
      cs: `${count} ${pick(P_VOTES, "cs")} · ${shares[index]} %`,
      "zh-Hans": `${count} 票 · ${shares[index]}%`,
      "zh-Hant": `${count} 票 · ${shares[index]}%`,
      es: `${count} ${pick(P_VOTES, "es")} · ${shares[index]} %`,
      pl: `${count} ${pick(P_VOTES, "pl")} · ${shares[index]}%`,
      ja: `${count} ${pick(P_VOTES, "ja")} · ${shares[index]}%`,
      th: `${count} ${pick(P_VOTES, "th")} · ${shares[index]}%`,
      fi: `${count} ${pick(P_VOTES, "fi")} · ${shares[index]} %`,
      uk: `${count} ${pick(P_VOTES, "uk")} · ${shares[index]}%`,
      bg: `${count} ${pick(P_VOTES, "bg")} · ${shares[index]}%`,
      tr: `${count} ${pick(P_VOTES, "tr")} · ${shares[index]}%`,
      hu: `${count} ${pick(P_VOTES, "hu")} · ${shares[index]}%`,
    },
  }));
  fields.push({
    k: {
      en: `${pick(P_TOTAL, "en")} (${pick(P_MULTI, "en")})`,
      ru: `${pick(P_TOTAL, "ru")} (${pick(P_MULTI, "ru")})`,
      de: `${pick(P_TOTAL, "de")} (${pick(P_MULTI, "de")})`,
      fr: `${pick(P_TOTAL, "fr")} (${pick(P_MULTI, "fr")})`,
      it: `${pick(P_TOTAL, "it")} (${pick(P_MULTI, "it")})`,
      nl: `${pick(P_TOTAL, "nl")} (${pick(P_MULTI, "nl")})`,
      cs: `${pick(P_TOTAL, "cs")} (${pick(P_MULTI, "cs")})`,
      "zh-Hans": `${pick(P_TOTAL, "zh-Hans")}（${pick(P_MULTI, "zh-Hans")}）`,
      "zh-Hant": `${pick(P_TOTAL, "zh-Hant")}（${pick(P_MULTI, "zh-Hant")}）`,
      es: `${pick(P_TOTAL, "es")} (${pick(P_MULTI, "es")})`,
      pl: `${pick(P_TOTAL, "pl")} (${pick(P_MULTI, "pl")})`,
      ja: `${pick(P_TOTAL, "ja")}（${pick(P_MULTI, "ja")}）`,
      th: `${pick(P_TOTAL, "th")} (${pick(P_MULTI, "th")})`,
      fi: `${pick(P_TOTAL, "fi")} (${pick(P_MULTI, "fi")})`,
      uk: `${pick(P_TOTAL, "uk")} (${pick(P_MULTI, "uk")})`,
      bg: `${pick(P_TOTAL, "bg")} (${pick(P_MULTI, "bg")})`,
      tr: `${pick(P_TOTAL, "tr")} (${pick(P_MULTI, "tr")})`,
      hu: `${pick(P_TOTAL, "hu")} (${pick(P_MULTI, "hu")})`,
    },
    v: {
      en: `${total} ${pick(P_VOTES, "en")}`,
      ru: `${total} ${pick(P_VOTES, "ru")}`,
      de: `${total} ${pick(P_VOTES, "de")}`,
      fr: `${total} ${pick(P_VOTES, "fr")}`,
      it: `${total} ${pick(P_VOTES, "it")}`,
      nl: `${total} ${pick(P_VOTES, "nl")}`,
      cs: `${total} ${pick(P_VOTES, "cs")}`,
      "zh-Hans": `${total} 票`,
      "zh-Hant": `${total} 票`,
      es: `${total} ${pick(P_VOTES, "es")}`,
      pl: `${total} ${pick(P_VOTES, "pl")}`,
      ja: `${total} ${pick(P_VOTES, "ja")}`,
      th: `${total} ${pick(P_VOTES, "th")}`,
      fi: `${total} ${pick(P_VOTES, "fi")}`,
      uk: `${total} ${pick(P_VOTES, "uk")}`,
      bg: `${total} ${pick(P_VOTES, "bg")}`,
      tr: `${total} ${pick(P_VOTES, "tr")}`,
      hu: `${total} ${pick(P_VOTES, "hu")}`,
    },
    mono: true,
  });
  if (voted.length > 0) {
    fields.push({
      k: P_YOURS,
      v: {
        en: voted.map((index) => pick(POLL_OPTIONS[index], "en")).join(", "),
        ru: voted.map((index) => pick(POLL_OPTIONS[index], "ru")).join(", "),
        de: voted.map((index) => pick(POLL_OPTIONS[index], "de")).join(", "),
        fr: voted.map((index) => pick(POLL_OPTIONS[index], "fr")).join(", "),
        it: voted.map((index) => pick(POLL_OPTIONS[index], "it")).join(", "),
        nl: voted.map((index) => pick(POLL_OPTIONS[index], "nl")).join(", "),
        cs: voted.map((index) => pick(POLL_OPTIONS[index], "cs")).join(", "),
        "zh-Hans": voted.map((index) => pick(POLL_OPTIONS[index], "zh-Hans")).join("、"),
        "zh-Hant": voted.map((index) => pick(POLL_OPTIONS[index], "zh-Hant")).join("、"),
        es: voted.map((index) => pick(POLL_OPTIONS[index], "es")).join(", "),
        pl: voted.map((index) => pick(POLL_OPTIONS[index], "pl")).join(", "),
        ja: voted.map((index) => pick(POLL_OPTIONS[index], "ja")).join("、"),
        th: voted.map((index) => pick(POLL_OPTIONS[index], "th")).join(" "),
        fi: voted.map((index) => pick(POLL_OPTIONS[index], "fi")).join(", "),
        uk: voted.map((index) => pick(POLL_OPTIONS[index], "uk")).join(", "),
        bg: voted.map((index) => pick(POLL_OPTIONS[index], "bg")).join(", "),
        tr: voted.map((index) => pick(POLL_OPTIONS[index], "tr")).join(", "),
        hu: voted.map((index) => pick(POLL_OPTIONS[index], "hu")).join(", "),
      },
    });
  }
  const closing = utcMinute(POLL_ENDS_AT_MS);
  const progressLabel: Localized<string> = {
    en: total === 0 ? pick(P_NO_VOTES, "en") : `${pick(P_LEADING, "en")} ${pick(POLL_OPTIONS[leader], "en")} ${leadingShare}%`,
    ru: total === 0 ? pick(P_NO_VOTES, "ru") : `${pick(P_LEADING, "ru")} ${pick(POLL_OPTIONS[leader], "ru")} ${leadingShare}%`,
    de: total === 0 ? pick(P_NO_VOTES, "de") : `${pick(P_LEADING, "de")} ${pick(POLL_OPTIONS[leader], "de")} ${leadingShare} %`,
    fr: total === 0 ? pick(P_NO_VOTES, "fr") : `${pick(P_LEADING, "fr")} ${pick(POLL_OPTIONS[leader], "fr")} ${leadingShare} %`,
    it: total === 0 ? pick(P_NO_VOTES, "it") : `${pick(P_LEADING, "it")} ${pick(POLL_OPTIONS[leader], "it")} ${leadingShare}%`,
    nl: total === 0 ? pick(P_NO_VOTES, "nl") : `${pick(P_LEADING, "nl")} ${pick(POLL_OPTIONS[leader], "nl")} ${leadingShare}%`,
    cs: total === 0 ? pick(P_NO_VOTES, "cs") : `${pick(P_LEADING, "cs")} ${pick(POLL_OPTIONS[leader], "cs")} ${leadingShare} %`,
    "zh-Hans": total === 0 ? pick(P_NO_VOTES, "zh-Hans") : `领先 ${pick(POLL_OPTIONS[leader], "zh-Hans")} ${leadingShare}%`,
    "zh-Hant": total === 0 ? pick(P_NO_VOTES, "zh-Hant") : `領先 ${pick(POLL_OPTIONS[leader], "zh-Hant")} ${leadingShare}%`,
    es: total === 0 ? pick(P_NO_VOTES, "es") : `${pick(P_LEADING, "es")} ${pick(POLL_OPTIONS[leader], "es")} ${leadingShare} %`,
    pl: total === 0 ? pick(P_NO_VOTES, "pl") : `${pick(P_LEADING, "pl")} ${pick(POLL_OPTIONS[leader], "pl")} ${leadingShare}%`,
    ja: total === 0 ? pick(P_NO_VOTES, "ja") : `${pick(P_LEADING, "ja")} ${pick(POLL_OPTIONS[leader], "ja")} ${leadingShare}%`,
    th: total === 0 ? pick(P_NO_VOTES, "th") : `${pick(P_LEADING, "th")} ${pick(POLL_OPTIONS[leader], "th")} ${leadingShare}%`,
    fi: total === 0 ? pick(P_NO_VOTES, "fi") : `${pick(P_LEADING, "fi")} ${pick(POLL_OPTIONS[leader], "fi")} ${leadingShare} %`,
    uk: total === 0 ? pick(P_NO_VOTES, "uk") : `${pick(P_LEADING, "uk")} ${pick(POLL_OPTIONS[leader], "uk")} ${leadingShare}%`,
    bg: total === 0 ? pick(P_NO_VOTES, "bg") : `${pick(P_LEADING, "bg")} ${pick(POLL_OPTIONS[leader], "bg")} ${leadingShare}%`,
    tr: total === 0 ? pick(P_NO_VOTES, "tr") : `${pick(P_LEADING, "tr")} ${pick(POLL_OPTIONS[leader], "tr")} ${leadingShare}%`,
    hu: total === 0 ? pick(P_NO_VOTES, "hu") : `${pick(P_LEADING, "hu")} ${pick(POLL_OPTIONS[leader], "hu")} ${leadingShare}%`,
  };
  const progressDetail: Localized<string> = {
    en: `${total} ${pick(P_VOTES, "en")} · ${pick(P_DEADLINE, "en")} ${closing}`,
    ru: `${total} ${pick(P_VOTES, "ru")} · ${pick(P_DEADLINE, "ru")} ${closing}`,
    de: `${total} ${pick(P_VOTES, "de")} · ${pick(P_DEADLINE, "de")} ${closing}`,
    fr: `${total} ${pick(P_VOTES, "fr")} · ${pick(P_DEADLINE, "fr")} ${closing}`,
    it: `${total} ${pick(P_VOTES, "it")} · ${pick(P_DEADLINE, "it")} ${closing}`,
    nl: `${total} ${pick(P_VOTES, "nl")} · ${pick(P_DEADLINE, "nl")} ${closing}`,
    cs: `${total} ${pick(P_VOTES, "cs")} · ${pick(P_DEADLINE, "cs")} ${closing}`,
    "zh-Hans": `${total} 票 · ${pick(P_DEADLINE, "zh-Hans")} ${closing}`,
    "zh-Hant": `${total} 票 · ${pick(P_DEADLINE, "zh-Hant")} ${closing}`,
    es: `${total} ${pick(P_VOTES, "es")} · ${pick(P_DEADLINE, "es")} ${closing}`,
    pl: `${total} ${pick(P_VOTES, "pl")} · ${pick(P_DEADLINE, "pl")} ${closing}`,
    ja: `${total} ${pick(P_VOTES, "ja")} · ${pick(P_DEADLINE, "ja")} ${closing}`,
    th: `${total} ${pick(P_VOTES, "th")} · ${pick(P_DEADLINE, "th")} ${closing}`,
    fi: `${total} ${pick(P_VOTES, "fi")} · ${pick(P_DEADLINE, "fi")} ${closing}`,
    uk: `${total} ${pick(P_VOTES, "uk")} · ${pick(P_DEADLINE, "uk")} ${closing}`,
    bg: `${total} ${pick(P_VOTES, "bg")} · ${pick(P_DEADLINE, "bg")} ${closing}`,
    tr: `${total} ${pick(P_VOTES, "tr")} · ${pick(P_DEADLINE, "tr")} ${closing}`,
    hu: `${total} ${pick(P_VOTES, "hu")} · ${pick(P_DEADLINE, "hu")} ${closing}`,
  };
  const actions: WireAction[] = POLL_OPTIONS.map((option, index) => ({
    id: "opt%d".replace("%d", String(index)),
    title: option,
    kind: "callback",
    style: index === 0 ? "primary" : "secondary",
    payload: "poll:vote:%s:%d".replace("%s", POLL_ID).replace("%d", String(index)),
  }));
  return {
    kind: "card",
    id: "poll-%s-%d".replace("%s", POLL_ID).replace("%d", String(CONTACT_ID)),
    v: "standard",
    title: {
      en: "How should this week's box reach you?",
      ru: "Как вам удобнее получить коробку на этой неделе?",
      de: "Wie soll die Kiste diese Woche bei dir ankommen?",
      fr: "Comment votre colis doit-il vous parvenir cette semaine ?",
      it: "Come deve arrivare da te la box di questa settimana?",
      nl: "Hoe moet je box deze week bij je aankomen?",
      cs: "Jak by vám měla letos v týdnu bedýnka dorazit?",
      "zh-Hans": "本周想怎么拿？",
      "zh-Hant": "本週想怎麼拿？",
      es: "¿Cómo debería llegarte la caja de esta semana?",
      pl: "Jak ma do Ciebie dotrzeć skrzynka w tym tygodniu?",
      ja: "今週のボックス、どう受け取りますか？",
      th: "สัปดาห์นี้อยากให้กล่องมาหาคุณแบบไหน?",
      fi: "Miten laatikon pitäisi tällä viikolla tavoittaa sinut?",
      uk: "Як вам має дійти скринька цього тижня?",
      bg: "Как да стигне до вас кутията тази седмица?",
      tr: "Bu haftaki kutu sana nasıl ulaşmalı?",
      hu: "Hogyan jusson el hozzád a heti doboz?",
    },
    body: {
      en: `${pick(P_POLL_NOTE, "en")} · ${pick(P_MULTI, "en")} · ${pick(P_DEADLINE, "en")} ${closing} · ${POLL_OPTIONS.length} options`,
      ru: `${pick(P_POLL_NOTE, "ru")} · ${pick(P_MULTI, "ru")} · ${pick(P_DEADLINE, "ru")} ${closing} · ${POLL_OPTIONS.length} варианта`,
      de: `${pick(P_POLL_NOTE, "de")} · ${pick(P_MULTI, "de")} · ${pick(P_DEADLINE, "de")} ${closing} · ${POLL_OPTIONS.length} Optionen`,
      fr: `${pick(P_POLL_NOTE, "fr")} · ${pick(P_MULTI, "fr")} · ${pick(P_DEADLINE, "fr")} ${closing} · ${POLL_OPTIONS.length} options`,
      it: `${pick(P_POLL_NOTE, "it")} · ${pick(P_MULTI, "it")} · ${pick(P_DEADLINE, "it")} ${closing} · ${POLL_OPTIONS.length} opzioni`,
      nl: `${pick(P_POLL_NOTE, "nl")} · ${pick(P_MULTI, "nl")} · ${pick(P_DEADLINE, "nl")} ${closing} · ${POLL_OPTIONS.length} keuzes`,
      cs: `${pick(P_POLL_NOTE, "cs")} · ${pick(P_MULTI, "cs")} · ${pick(P_DEADLINE, "cs")} ${closing} · ${POLL_OPTIONS.length} volby`,
      "zh-Hans": `${pick(P_POLL_NOTE, "zh-Hans")} · ${pick(P_MULTI, "zh-Hans")} · ${pick(P_DEADLINE, "zh-Hans")} ${closing} · ${POLL_OPTIONS.length} 个选项`,
      "zh-Hant": `${pick(P_POLL_NOTE, "zh-Hant")} · ${pick(P_MULTI, "zh-Hant")} · ${pick(P_DEADLINE, "zh-Hant")} ${closing} · ${POLL_OPTIONS.length} 個選項`,
      es: `${pick(P_POLL_NOTE, "es")} · ${pick(P_MULTI, "es")} · ${pick(P_DEADLINE, "es")} ${closing} · ${POLL_OPTIONS.length} opciones`,
      pl: `${pick(P_POLL_NOTE, "pl")} · ${pick(P_MULTI, "pl")} · ${pick(P_DEADLINE, "pl")} ${closing} · ${POLL_OPTIONS.length} opcje`,
      ja: `${pick(P_POLL_NOTE, "ja")} · ${pick(P_MULTI, "ja")} · ${pick(P_DEADLINE, "ja")} ${closing} · ${POLL_OPTIONS.length} 択`,
      th: `${pick(P_POLL_NOTE, "th")} · ${pick(P_MULTI, "th")} · ${pick(P_DEADLINE, "th")} ${closing} · ${POLL_OPTIONS.length} ตัวเลือก`,
      fi: `${pick(P_POLL_NOTE, "fi")} · ${pick(P_MULTI, "fi")} · ${pick(P_DEADLINE, "fi")} ${closing} · ${POLL_OPTIONS.length} vaihtoehtoa`,
      uk: `${pick(P_POLL_NOTE, "uk")} · ${pick(P_MULTI, "uk")} · ${pick(P_DEADLINE, "uk")} ${closing} · ${POLL_OPTIONS.length} варіанти`,
      bg: `${pick(P_POLL_NOTE, "bg")} · ${pick(P_MULTI, "bg")} · ${pick(P_DEADLINE, "bg")} ${closing} · ${POLL_OPTIONS.length} опции`,
      tr: `${pick(P_POLL_NOTE, "tr")} · ${pick(P_MULTI, "tr")} · ${pick(P_DEADLINE, "tr")} ${closing} · ${POLL_OPTIONS.length} seçenek`,
      hu: `${pick(P_POLL_NOTE, "hu")} · ${pick(P_MULTI, "hu")} · ${pick(P_DEADLINE, "hu")} ${closing} · ${POLL_OPTIONS.length} opció`,
    },
    ut,
    fields,
    progress: { l: progressLabel, p: leadingShare, d: progressDetail },
    actions,
    et: POLL_ENDS_AT_MS,
    mode,
  };
}

/** A fixed UTC clock, formatted exactly the way the gateway formats deadlines. */
function utcMinute(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return "%s-%s-%s %s:%s UTC"
    .replace("%s", String(d.getUTCFullYear()))
    .replace("%s", pad(d.getUTCMonth() + 1))
    .replace("%s", pad(d.getUTCDate()))
    .replace("%s", pad(d.getUTCHours()))
    .replace("%s", pad(d.getUTCMinutes()));
}

function clockTime(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return "%s:%s".replace("%s", pad(d.getUTCHours())).replace("%s", pad(d.getUTCMinutes()));
}

/* ──────────────────────────────────────────────────────────────────────────
 * Reducer
 * ────────────────────────────────────────────────────────────────────────── */

type Action =
  | { readonly type: "publish" }
  | { readonly type: "goto"; readonly screen: "channel" | "chat" }
  | { readonly type: "openService" }
  | { readonly type: "pushMenu" }
  | { readonly type: "menuTop"; readonly index: number }
  | { readonly type: "menuLeaf"; readonly top: number; readonly leaf: number }
  | { readonly type: "sendCard"; readonly style: CardStyle }
  | { readonly type: "sendPoll" }
  | { readonly type: "vote"; readonly index: number }
  | { readonly type: "callback"; readonly cardId: string; readonly actionId: string; readonly payload: string; readonly label: Localized<string> }
  | { readonly type: "ackAlert"; readonly cardId: string }
  | { readonly type: "rotate" }
  | { readonly type: "openH5" }
  | { readonly type: "closeH5" }
  | { readonly type: "toggleRelay" }
  | { readonly type: "reset" };

const POLL_START = [0, 0, 0, 0];

function makeInitial(): State {
  return {
    screen: "channel",
    unread: 0,
    messages: [],
    menuRevPushed: 0,
    openMenu: null,
    voted: [],
    counts: [...POLL_START],
    epoch: 1,
    sealedUnder: 1,
    rotateError: false,
    h5Open: false,
    relayOn: true,
    locked: [],
    spent: { card: 0, menu: 0, poll: 0, rotation: 0 },
    log: [{ id: 0, dir: "note", tone: "mute", text: LOG_TEXT.nothing }],
    seq: 0,
  };
}

const INITIAL: State = makeInitial();

function stamp(state: State): number {
  return BASE_MS + (state.seq + 1) * 1_000;
}

function pushLog(state: State, entry: Omit<LogEntry, "id">): LogEntry[] {
  const next = [{ ...entry, id: state.seq + 1 }, ...state.log];
  return next.slice(0, 12);
}

function appendMsg(state: State, msg: Msg): Msg[] {
  return [...state.messages, msg];
}

function replaceCard(state: State, card: CardMsg): Msg[] {
  return state.messages.map((msg) => (msg.kind === "card" && msg.id === card.id ? card : msg));
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "publish": {
      const ut = stamp(state);
      const article: TextMsg = { kind: "text", id: "art-text-%d".replace("%d", String(state.seq + 1)), from: "svc", text: ARTICLE_BODY, ut };
      return {
        ...state,
        seq: state.seq + 1,
        messages: [...state.messages, article],
        unread: state.screen === "channel" ? state.unread : state.unread + 1,
        log: pushLog(state, { dir: "down", tone: "brand", text: LOG_TEXT.published, code: DEEP_LINK }),
      };
    }
    case "goto": {
      if (state.screen === action.screen) {
        return state;
      }
      return { ...state, screen: action.screen, unread: action.screen === "chat" ? 0 : state.unread };
    }
    case "openService": {
      const ut = stamp(state);
      const ref: TextMsg = { kind: "text", id: "ref-%d".replace("%d", String(state.seq + 1)), from: "me", text: ARTICLE_CTA, ut };
      const card = articleCard(ut + 1);
      return {
        ...state,
        seq: state.seq + 2,
        screen: "chat",
        unread: 0,
        messages: [...state.messages, ref, card],
        spent: { ...state.spent, card: state.spent.card + 1 },
        log: [
          { id: state.seq + 2, dir: "down" as const, tone: "brand" as const, text: LOG_TEXT.articleCard, code: cardFrame(card, "zh-Hans") },
          { id: state.seq + 1, dir: "up" as const, tone: "mesh" as const, text: LOG_TEXT.ref, code: "::REF::%s".replace("%s", ARTICLE_ID) },
          ...state.log,
        ].slice(0, 12),
      };
    }
    case "pushMenu": {
      return {
        ...state,
        seq: state.seq + 1,
        menuRevPushed: MENU_REV,
        spent: { ...state.spent, menu: state.spent.menu + 1 },
        log: pushLog(state, {
          dir: "down",
          tone: "brand",
          text: LOG_TEXT.menuPush,
          code: "%s%s".replace("%s", "::CB::").replace("%s", "menu:push"),
        }),
      };
    }
    case "menuTop": {
      const open = state.openMenu === action.index ? null : action.index;
      return { ...state, openMenu: open };
    }
    case "menuLeaf": {
      const top = MENU_TOP[action.top];
      const leaf = top?.sub?.[action.leaf];
      if (leaf === undefined) {
        return state;
      }
      const ut = stamp(state);
      if (leaf.kind === "view" || leaf.action === undefined) {
        return {
          ...state,
          seq: state.seq + 1,
          openMenu: null,
          h5Open: true,
          log: pushLog(state, { dir: "up", tone: "mesh", text: LOG_TEXT.menuView, code: leaf.url }),
        };
      }
      if (leaf.action === "callback") {
        const up: TextMsg = {
          kind: "text",
          id: "cb-%d".replace("%d", String(state.seq + 1)),
          from: "me",
          text: leaf.title,
          ut,
        };
        const reply = cardOf("standard", "lnk_%s".replace("%s", "Qm3ZxP9dLb2Ns"), ut + 1);
        return {
          ...state,
          seq: state.seq + 2,
          screen: "chat",
          openMenu: null,
          messages: [...state.messages, up, reply],
          spent: { ...state.spent, card: state.spent.card + 1 },
          log: [
            { id: state.seq + 2, dir: "down" as const, tone: "brand" as const, text: LOG_TEXT.cardSent, code: cardFrame(reply, "zh-Hans") },
            { id: state.seq + 1, dir: "up" as const, tone: "mesh" as const, text: LOG_TEXT.menuLeaf, code: "::CB::%s".replace("%s", leaf.payload ?? "") },
            ...state.log,
          ].slice(0, 12),
        };
      }
      return {
        ...state,
        seq: state.seq + 1,
        openMenu: null,
        log: pushLog(state, { dir: "up", tone: "mesh", text: LOG_TEXT.scanner }),
      };
    }
    case "sendCard": {
      const ut = stamp(state);
      const idPrefix: Record<CardStyle, string> = { standard: "card", receipt: "rcp", security: "alrt" };
      const card = cardOf(action.style, "%s_%s".replace("%s", idPrefix[action.style]).replace("%s", "Kp3Ls9Nq1uYb4Tc"), ut);
      return {
        ...state,
        seq: state.seq + 1,
        messages: appendMsg(state, card),
        unread: state.screen === "chat" ? 0 : state.unread + 1,
        spent: { ...state.spent, card: state.spent.card + 1 },
        log: pushLog(state, { dir: "down", tone: action.style === "security" ? "warn" : "brand", text: LOG_TEXT.cardSent, code: cardFrame(card, "zh-Hans") }),
      };
    }
    case "sendPoll": {
      const ut = stamp(state);
      const card = pollCard([...POLL_START], [], ut, "c");
      return {
        ...state,
        seq: state.seq + 1,
        messages: appendMsg(state, card),
        voted: [],
        counts: [...POLL_START],
        unread: state.screen === "chat" ? 0 : state.unread + 1,
        spent: { ...state.spent, card: state.spent.card + 1 },
        log: pushLog(state, { dir: "down", tone: "brand", text: LOG_TEXT.pollSent, code: cardFrame(card, "zh-Hans") }),
      };
    }
    case "vote": {
      const card = state.messages.find((msg): msg is CardMsg => msg.kind === "card" && msg.id.startsWith("poll-"));
      if (card === undefined) {
        return state;
      }
      if (state.voted.includes(action.index)) {
        return {
          ...state,
          seq: state.seq + 1,
          log: pushLog(state, {
            dir: "up",
            tone: "warn",
            text: LOG_TEXT.voteReplay,
            code: "::CB::%s".replace("%s", "poll:vote:%s:%d".replace("%s", POLL_ID).replace("%d", String(action.index))),
          }),
        };
      }
      const ut = stamp(state);
      const counts = card_counts_for(state, action.index);
      const updated = pollCard(counts, [...state.voted, action.index], ut, "u");
      return {
        ...state,
        seq: state.seq + 1,
        messages: replaceCard(state, updated),
        voted: [...state.voted, action.index],
        counts,
        spent: { ...state.spent, poll: state.spent.poll + 1 },
        log: pushLog(state, {
          dir: "down",
          tone: "brand",
          text: LOG_TEXT.voteCounted,
          code: cardFrame(updated, "zh-Hans"),
        }),
      };
    }
    case "callback": {
      const ut = stamp(state);
      const up: TextMsg = {
        kind: "text",
        id: "cb-%d".replace("%d", String(state.seq + 1)),
        from: "me",
        text: action.label,
        ut,
      };
      return {
        ...state,
        seq: state.seq + 1,
        messages: [...appendMsg(state, up)],
        locked: [...state.locked, "%s:%s".replace("%s", action.cardId).replace("%s", action.actionId)],
        log: pushLog(state, {
          dir: "up",
          tone: "warn",
          text: LOG_TEXT.unmatched,
          code: "::CB::%s".replace("%s", action.payload),
        }),
      };
    }
    case "ackAlert": {
      const card = state.messages.find((msg): msg is CardMsg => msg.kind === "card" && msg.id === action.cardId);
      if (card === undefined) {
        return state;
      }
      const ut = stamp(state);
      const acked: CardMsg = {
        ...card,
        ut,
        mode: "u",
        progress: {
          l: STATUS_WORD,
          p: 100,
          d: {
            en: `${pick(ACKED, "en")} · contact ${CONTACT_ID} · ${utcMinute(ut)}`,
            ru: `${pick(ACKED, "ru")} · контакт ${CONTACT_ID} · ${utcMinute(ut)}`,
            de: `${pick(ACKED, "de")} · Kontakt ${CONTACT_ID} · ${utcMinute(ut)}`,
            fr: `${pick(ACKED, "fr")} · contact ${CONTACT_ID} · ${utcMinute(ut)}`,
            it: `${pick(ACKED, "it")} · contatto ${CONTACT_ID} · ${utcMinute(ut)}`,
            nl: `${pick(ACKED, "nl")} · contact ${CONTACT_ID} · ${utcMinute(ut)}`,
            cs: `${pick(ACKED, "cs")} · kontakt ${CONTACT_ID} · ${utcMinute(ut)}`,
            "zh-Hans": `${pick(ACKED, "zh-Hans")} · 联系人 ${CONTACT_ID} · ${utcMinute(ut)}`,
            "zh-Hant": `${pick(ACKED, "zh-Hant")} · 聯絡人 ${CONTACT_ID} · ${utcMinute(ut)}`,
            es: `${pick(ACKED, "es")} · contacto ${CONTACT_ID} · ${utcMinute(ut)}`,
            pl: `${pick(ACKED, "pl")} · kontakt ${CONTACT_ID} · ${utcMinute(ut)}`,
            ja: `${pick(ACKED, "ja")} · 連絡先 ${CONTACT_ID} · ${utcMinute(ut)}`,
            th: `${pick(ACKED, "th")} · ผู้ติดต่อ ${CONTACT_ID} · ${utcMinute(ut)}`,
            fi: `${pick(ACKED, "fi")} · yhteys ${CONTACT_ID} · ${utcMinute(ut)}`,
            uk: `${pick(ACKED, "uk")} · контакт ${CONTACT_ID} · ${utcMinute(ut)}`,
            bg: `${pick(ACKED, "bg")} · контакт ${CONTACT_ID} · ${utcMinute(ut)}`,
            tr: `${pick(ACKED, "tr")} · kişi ${CONTACT_ID} · ${utcMinute(ut)}`,
            hu: `${pick(ACKED, "hu")} · kapcsolat ${CONTACT_ID} · ${utcMinute(ut)}`,
          },
        },
        fields: card.fields.map((field) =>
          field.k === CARD_COPY.security.fields[2].k ? { ...field, v: ACKED } : field,
        ),
        actions: [
          {
            id: "alert-terminal",
            title: ACKED,
            kind: "callback",
            style: "secondary",
            payload: "alert:noop:%s".replace("%s", ALERT_ID),
          },
        ],
      };
      return {
        ...state,
        seq: state.seq + 1,
        messages: replaceCard(state, acked),
        locked: state.locked.filter((key) => !key.startsWith("%s:".replace("%s", action.cardId))),
        log: pushLog(state, {
          dir: "down",
          tone: "brand",
          text: LOG_TEXT.acked,
          code: cardFrame(acked, "zh-Hans"),
        }),
      };
    }
    case "rotate": {
      if (state.epoch > 1) {
        return {
          ...state,
          seq: state.seq + 1,
          rotateError: true,
          log: pushLog(state, { dir: "note", tone: "warn", text: LOG_TEXT.rotateReplay }),
        };
      }
      return {
        ...state,
        seq: state.seq + 1,
        epoch: 2,
        sealedUnder: 1,
        rotateError: false,
        spent: { ...state.spent, rotation: state.spent.rotation + 2 },
        log: pushLog(state, {
          dir: "down",
          tone: "mesh",
          text: LOG_TEXT.rotate,
          code: keyUpdateFrame(2, 1, "zh-Hans"),
        }),
      };
    }
    case "openH5": {
      if (state.h5Open) {
        return { ...state, h5Open: false, log: pushLog(state, { dir: "note", tone: "mute", text: LOG_TEXT.h5 }) };
      }
      return { ...state, h5Open: true, log: pushLog(state, { dir: "note", tone: "mute", text: LOG_TEXT.h5 }) };
    }
    case "closeH5": {
      return { ...state, h5Open: false };
    }
    case "toggleRelay": {
      return { ...state, relayOn: !state.relayOn };
    }
    case "reset": {
      return { ...makeInitial(), log: [{ id: 0, dir: "note", tone: "mute", text: LOG_TEXT.reset }] };
    }
    default: {
      return state;
    }
  }
}

/** Votes on the page: the demo seeds a quiet poll and every tap adds exactly one. */
function card_counts_for(state: State, index: number): number[] {
  const base = [...state.counts];
  base[index] = (base[index] ?? 0) + 1;
  return base;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Small view helpers
 * ────────────────────────────────────────────────────────────────────────── */

const TONE_DOT: Record<LogTone, "brand" | "mesh" | "warn" | "alert"> = {
  brand: "brand",
  mesh: "mesh",
  warn: "warn",
  mute: "alert",
};

const DIR_WORD: Record<LogEntry["dir"], Localized<string>> = {
  up: L_UP,
  down: L_DOWN,
  note: L_NOTE,
};

const BTN =
  "w-full rounded-lg px-3 py-2 text-left text-[12.5px] font-medium text-ink-100 transition-colors duration-200 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60";

function ActionButton({
  label,
  hint,
  onClick,
  tone = "ghost",
}: {
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: "ghost" | "primary";
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`glass-inset ${BTN} ${tone === "primary" ? "text-brand-soft" : ""} hover:bg-white/[0.06] active:scale-[0.99]`}
    >
      {label}
    </button>
  );
}

function FieldRow({ k, v, mono }: { k: string; v: string; mono?: boolean }): ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-2 text-[11px]">
      <span className="shrink-0 text-faint">{k}</span>
      <span className={`min-w-0 truncate text-right ${mono ? "font-mono text-[10.5px] text-mesh-soft" : "text-ink-100"}`}>{v}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * The phone
 * ────────────────────────────────────────────────────────────────────────── */

function CardBubble({
  card,
  state,
  dispatch,
  locale,
}: {
  card: CardMsg;
  state: State;
  dispatch: (action: Action) => void;
  locale: Locale;
}): ReactElement {
  const votedIndex = card.id.startsWith("poll-") ? state.voted : [];
  const shield = card.v === "security";
  return (
    <div className="rounded-2xl border-hair bg-white/[0.05] p-3 shadow-glass">
      <div className="flex items-start gap-2">
        {shield ? (
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6l7-3z" strokeLinejoin="round" />
          </svg>
        ) : null}
        <p className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug text-white">{pick(card.title, locale)}</p>
        <span className="shrink-0 font-mono text-[9.5px] text-faint">{clockTime(card.ut)}</span>
      </div>
      {card.body !== undefined ? <p className="mt-1.5 text-[11.5px] leading-relaxed text-mute">{pick(card.body, locale)}</p> : null}

      {card.fields.length > 0 ? (
        <div className="mt-2.5 space-y-1 rounded-xl bg-white/[0.04] p-2.5">
          {card.fields.map((field, index) => (
            <FieldRow key={index} k={pick(field.k, locale)} v={pick(field.v, locale)} mono={field.mono} />
          ))}
        </div>
      ) : null}

      {card.progress !== undefined ? (
        <div className="mt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[10.5px] text-faint">{pick(card.progress.l, locale)}</span>
            <span className="font-mono text-[10.5px] text-ink-100">{card.progress.p}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${shield ? "bg-warn" : "bg-gradient-to-r from-brand-soft to-mesh-soft"}`}
              style={{ width: `${card.progress.p}%` }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-faint">{pick(card.progress.d, locale)}</p>
        </div>
      ) : null}

      {card.actions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {card.actions.map((action) => {
            const locked = state.locked.includes("%s:%s".replace("%s", card.id).replace("%s", action.id));
            const mine = votedIndex.includes(Number(action.id.replace("opt", "")));
            const isAck = action.id === "alert-ack";
            return (
              <button
                key={action.id}
                type="button"
                disabled={locked}
                aria-disabled={locked}
                onClick={() => {
                  if (locked) {
                    return;
                  }
                  if (isAck) {
                    dispatch({ type: "ackAlert", cardId: card.id });
                    return;
                  }
                  if (action.id.startsWith("opt")) {
                    dispatch({ type: "vote", index: Number(action.id.replace("opt", "")) });
                    return;
                  }
                  if (action.kind === "open_url") {
                    dispatch({ type: "openH5" });
                    return;
                  }
                  dispatch({ type: "callback", cardId: card.id, actionId: action.id, payload: action.payload ?? "", label: action.title });
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                  locked
                    ? "cursor-not-allowed border-hair text-faint"
                    : action.style === "primary"
                      ? "border-brand/50 bg-brand/[0.14] text-brand-soft hover:bg-brand/20"
                      : "border-hair text-ink-100 hover:bg-white/[0.07]"
                } ${mine ? "ring-1 ring-mesh/50" : ""}`}
              >
                {pick(action.title, locale)}
                {mine ? <span className="ml-1.5 font-mono text-[9px] text-mesh-soft">{pick(P_VOTED, locale)}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {state.locked.length > 0 ? <p className="mt-2 text-[10px] text-faint">{pick(P_LOCKED, locale)}</p> : null}
    </div>
  );
}

function MenuBar({ state, dispatch, locale }: { state: State; dispatch: (action: Action) => void; locale: Locale }): ReactElement {
  if (state.menuRevPushed === 0) {
    return (
      <p className="border-t border-white/[0.06] px-3 py-2.5 text-center text-[10.5px] text-faint">{pick(L_MENU_NOT, locale)}</p>
    );
  }
  return (
    <nav aria-label={pick(P_MENU, locale)} className="border-t border-white/[0.06]">
      {state.openMenu !== null ? (
        <div className="space-y-1 border-b border-white/[0.06] px-3 py-2">
          {(MENU_TOP[state.openMenu]?.sub ?? []).map((leaf, index) => (
            <button
              key={index}
              type="button"
              onClick={() => dispatch({ type: "menuLeaf", top: state.openMenu ?? 0, leaf: index })}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[11px] text-ink-100 transition-colors hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {pick(leaf.title, locale)}
              {leaf.kind === "view" ? <span className="ml-1.5 font-mono text-[9px] text-faint">view</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid grid-cols-3">
        {MENU_TOP.map((item, index) => {
          const open = state.openMenu === index;
          const hasSub = (item.sub?.length ?? 0) > 0;
          return (
            <button
              key={index}
              type="button"
              aria-expanded={hasSub ? open : undefined}
              onClick={() => {
                if (hasSub) {
                  dispatch({ type: "menuTop", index });
                  return;
                }
                if (item.kind === "view") {
                  dispatch({ type: "openH5" });
                  return;
                }
                dispatch({ type: "menuLeaf", top: index, leaf: -1 });
              }}
              className={`px-2 py-2.5 text-center text-[11px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                open ? "bg-white/[0.08] text-white" : "text-ink-100 hover:bg-white/[0.05]"
              }`}
            >
              <span className="block truncate">{pick(item.title, locale)}</span>
              <span className="mt-0.5 block font-mono text-[9px] text-faint">{hasSub ? (open ? "▾" : "▴") : item.kind === "view" ? "url" : "scan"}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section
 * ────────────────────────────────────────────────────────────────────────── */

export function InteractiveSandbox(): ReactElement {
  const { locale } = useLocale();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const cpTotal = state.spent.card + state.spent.menu + state.spent.poll + state.spent.rotation;
  const frames: string[] = [
    ...(state.menuRevPushed > 0 ? [menuFrame(state.menuRevPushed, locale)] : []),
    ...state.messages.filter((msg): msg is CardMsg => msg.kind === "card").map((card) => cardFrame(card, locale)),
    ...(state.epoch > 1 ? [keyUpdateFrame(state.epoch, state.sealedUnder, locale)] : []),
  ];
  const latest = frames.slice(-3).reverse();

  return (
    <section id="sandbox" className="relative py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-[0.05]" />
      <div className="section-wrap relative">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          {/* Console ------------------------------------------------------- */}
          <div className="glass p-5 sm:p-6">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-white">{pick(CONSOLE_HEAD, locale)}</h3>
              <p className="font-mono text-[10.5px] text-faint">{ADMIN_CONSOLE_URL}</p>
            </header>

            <p className="eyebrow mt-5">{pick(L_SOURCE, locale)}</p>
            <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <ActionButton label={pick(ACTION_LABELS.publish, locale)} hint={pick(HINTS.publish, locale)} onClick={() => dispatch({ type: "publish" })} />
              <ActionButton label={pick(ACTION_LABELS.pushMenu, locale)} hint={pick(HINTS.pushMenu, locale)} onClick={() => dispatch({ type: "pushMenu" })} />
              <ActionButton label={pick(ACTION_LABELS.standard, locale)} hint={pick(HINTS.cards, locale)} onClick={() => dispatch({ type: "sendCard", style: "standard" })} />
              <ActionButton label={pick(ACTION_LABELS.receipt, locale)} hint={pick(HINTS.cards, locale)} onClick={() => dispatch({ type: "sendCard", style: "receipt" })} />
              <ActionButton label={pick(ACTION_LABELS.security, locale)} hint={pick(HINTS.cards, locale)} onClick={() => dispatch({ type: "sendCard", style: "security" })} />
              <ActionButton label={pick(ACTION_LABELS.poll, locale)} hint={pick(HINTS.poll, locale)} onClick={() => dispatch({ type: "sendPoll" })} />
              <ActionButton
                label={pick(ACTION_LABELS.rotate, locale)}
                hint={pick(HINTS.rotate, locale)}
                onClick={() => dispatch({ type: "rotate" })}
              />
              <ActionButton label={pick(ACTION_LABELS.reset, locale)} onClick={() => dispatch({ type: "reset" })} />
            </div>

            {state.rotateError ? (
              <p className="mt-3 rounded-lg border border-warn/40 bg-warn/[0.08] px-3 py-2 text-[11.5px] text-warn">{pick(LOG_TEXT.rotateReplay, locale)}</p>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="glass-inset p-3">
                <p className="eyebrow">{pick(L_TARGETS, locale)}</p>
                <p className="mt-1.5 font-mono text-[11px] text-ink-100">contact_ids=[{CONTACT_ID}]</p>
                <p className="mt-1 font-mono text-[10.5px] text-faint">pairwise uid {PAIRWISE_UID}</p>
                <p className="mt-2 font-mono text-[10.5px] text-mute">{NODE_WS_URL}</p>
              </div>
              <div className="glass-inset p-3">
                <p className="eyebrow">{pick(L_CP, locale)}</p>
                <p className="mt-1.5 font-mono text-[15px] text-brand-soft">POPX-CP {cpTotal}</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
                  card {state.spent.card} · menu_push {state.spent.menu} · poll {state.spent.poll} · key_rotation {state.spent.rotation}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="eyebrow">{pick(L_LOG, locale)}</p>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1 no-scrollbar">
                {state.log.map((entry) => (
                  <li key={entry.id} className="glass-inset p-2.5">
                    <div className="flex items-center gap-2">
                      <StatusDot tone={TONE_DOT[entry.tone]} />
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">{pick(DIR_WORD[entry.dir], locale)}</span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-100">{pick(entry.text, locale)}</p>
                    {entry.code !== undefined && entry.code.length > 0 ? (
                      <p className="mt-1.5 break-all font-mono text-[10px] text-mesh-soft">{entry.code}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-faint">{pick(NO_NETWORK, locale)}</p>
          </div>

          {/* Phone --------------------------------------------------------- */}
          <div className="flex flex-col items-center gap-4">
            <p className="eyebrow text-center">{pick(PHONE_HEAD, locale)}</p>
            <div className="w-full max-w-[340px] rounded-[42px] border border-white/[0.10] bg-white/[0.04] p-3 shadow-brand-ring">
              <div className="mx-auto mb-2 h-1.5 w-24 rounded-full bg-white/[0.12]" aria-hidden />
              <div className="overflow-hidden rounded-[32px] bg-ink-900/70">
                <div className="flex items-center justify-between px-4 pt-2 font-mono text-[10px] text-faint">
                  <span>9:41</span>
                  <span className="tracking-[0.14em]">POPOPX</span>
                </div>
                <div className="mt-2 flex items-center gap-2 border-b border-white/[0.06] px-3 pb-2.5">
                  <img src="/logo-popopx.png" alt="POPOPX" width={28} height={28} className="h-7 w-7 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-white">{pick(SERVICE_TITLE, locale)}</p>
                    <p className="flex items-center gap-1.5 text-[10px] text-faint">
                      <StatusDot tone="brand" pulse />
                      {pick(P_ONLINE, locale)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 px-3 py-2">
                  {(["channel", "chat"] as const).map((screen) => (
                    <button
                      key={screen}
                      type="button"
                      aria-pressed={state.screen === screen}
                      onClick={() => dispatch({ type: "goto", screen })}
                      className={`rounded-lg px-2 py-1.5 text-[11px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
                        state.screen === screen ? "bg-white/[0.10] text-white" : "text-faint hover:bg-white/[0.05]"
                      }`}
                    >
                      {screen === "channel" ? pick(TAB_CHANNEL, locale) : pick(TAB_SERVICE, locale)}
                      {screen === "chat" && state.unread > 0 ? (
                        <span className="ml-1.5 rounded-full bg-mesh px-1.5 py-0.5 font-mono text-[9px] text-white">{state.unread}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <div className="max-h-[340px] min-h-[220px] space-y-2.5 overflow-y-auto px-3 pb-3 no-scrollbar">
                  {state.screen === "channel" ? (
                    <article className="rounded-2xl border-hair bg-white/[0.05] p-3">
                      <p className="text-[12px] font-semibold leading-snug text-white">{pick(ARTICLE_TITLE, locale)}</p>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-mute">{pick(ARTICLE_BODY, locale)}</p>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "openService" })}
                        className="mt-2.5 w-full rounded-lg border border-brand/50 bg-brand/[0.14] px-2.5 py-1.5 text-[11px] font-medium text-brand-soft transition-colors hover:bg-brand/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                      >
                        {pick(ARTICLE_CTA, locale)}
                      </button>
                      <p className="mt-2 break-all font-mono text-[9.5px] text-faint">{DEEP_LINK}</p>
                    </article>
                  ) : (
                    <div key={state.messages.length} className="animate-rise-in space-y-2.5">
                      {state.messages.length === 0 ? (
                        <p className="py-8 text-center text-[11px] text-faint">{pick(L_NONE, locale)}</p>
                      ) : null}
                      {state.messages.map((msg) => {
                        if (msg.kind === "card") {
                          return <CardBubble key={msg.id} card={msg} state={state} dispatch={dispatch} locale={locale} />;
                        }
                        return (
                          <div
                            key={msg.id}
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed ${
                              msg.from === "me" ? "ml-auto bg-brand/20 text-white" : "border-hair bg-white/[0.05] text-ink-100"
                            }`}
                          >
                            {pick(msg.text, locale)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <MenuBar state={state} dispatch={dispatch} locale={locale} />

                {state.h5Open ? (
                  <div className="relative">
                    <div className="absolute inset-0 z-10 bg-ink-900/70 backdrop-blur-[2px]" />
                    <div className="absolute inset-x-2 bottom-2 z-20 rounded-2xl border-hair bg-ink-900/95 p-3 shadow-glass">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11.5px] font-semibold text-white">{pick(P_H5_TITLE, locale)}</p>
                        <button
                          type="button"
                          onClick={() => dispatch({ type: "closeH5" })}
                          className="rounded-md px-2 py-1 text-[10.5px] text-faint transition-colors hover:bg-white/[0.07] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                        >
                          {pick(P_H5_CLOSE, locale)}
                        </button>
                      </div>
                      <p className="mt-2 break-all font-mono text-[9.5px] text-mesh-soft">{H5_URL}</p>
                      <p className="mt-2 text-[10px] leading-relaxed text-mute">{pick(P_H5_NOTE, locale)}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              aria-pressed={state.relayOn}
              onClick={() => dispatch({ type: "toggleRelay" })}
              className="pill gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              <StatusDot tone={state.relayOn ? "mesh" : "warn"} />
              <span className="text-[11px]">{pick(RELAY_HEAD, locale)}</span>
            </button>
          </div>
        </div>

        {/* Relay ---------------------------------------------------------- */}
        {state.relayOn ? (
          <div className="glass mt-4 grid grid-cols-1 gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <div>
              <h3 className="text-[14px] font-semibold text-white">{pick(L_FRAME, locale)}</h3>
              <div className="mt-3 space-y-3">
                {latest.length === 0 ? (
                  <p className="text-[11.5px] leading-relaxed text-faint">{pick(L_NONE, locale)}</p>
                ) : (
                  latest.map((frame, index) => (
                    <CodeBlock
                      key={index}
                      code={frame}
                      caption={index === latest.length - 1 ? pick(FRAME_CAPTION, locale) : undefined}
                      maxHeightClass="max-h-44"
                    />
                  ))
                )}
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-white">{pick(L_ENV, locale)}</h3>
              <CodeBlock
                code={JSON.stringify({ t: "ku", update: { ch: CHANNEL_ID, se: state.sealedUnder, rp: true, env: envelope(state.epoch, state.epoch === 1 ? EPOCH_KEY_1 : EPOCH_KEY_2) } })}
                caption={pick(ENV_CAPTION, locale)}
                maxHeightClass="max-h-56"
              />
              <p className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <span className="pill">{pick(L_EXAMPLE, locale)}</span>
                <code className="chip font-mono text-[10px]">popopx.channel.enc.v1</code>
                <code className="chip font-mono text-[10px]">ChaCha20-Poly1305</code>
                <code className="chip font-mono text-[10px]">Ed25519</code>
              </p>
              <p className="mt-3 break-all font-mono text-[10px] text-mute">{CHANNEL_URI}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{pick(SCANNER_NOTE, locale)}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
