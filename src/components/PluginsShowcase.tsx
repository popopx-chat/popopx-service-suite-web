"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";

/**
 * Services & connector catalog.
 *
 * The catalog is the honest answer to "what can this gateway actually do today":
 * five plugin modules that exist as code, four of them on by factory default,
 * `web3_bridge` implemented but switched off, and a separate 规划中 block for the
 * connectors that appear nowhere in the repository. Every card answers the same
 * four questions — capability, credential, data flow, revocation — and the
 * credential question is answered with what really exists: one static
 * `X-Admin-Token` bearer for `/api/v1/plugins/*`, no scopes and no per-key ACL.
 * The filter is a `useState` over category only, so a filtered subset can never
 * come back empty: each of the five categories owns exactly one card.
 */

type Fact = { readonly k: Localized<string>; readonly v: Localized<string> };

type Category = "agent" | "ops" | "identity" | "engagement" | "chain";
type ShipState = "default-on" | "default-off" | "roadmap";

type PluginModel = {
  readonly code: string;
  readonly file: string;
  readonly category: Category;
  readonly status: ShipState;
  readonly name: Localized<string>;
  readonly hook: Localized<string>;
  readonly facts: readonly Fact[];
  readonly keys: readonly string[];
  readonly route: string;
  readonly accent: "brand" | "mesh" | "warn";
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/70";

/** The six filter chips: `全部` plus the five categories. Because the five
 *  implemented modules each own exactly one category, every chip selects at
 *  least one card, so a filtered grid can never come back empty. */
const CATEGORY_ALL = "all";
type FilterValue = Category | typeof CATEGORY_ALL;

const EYEBROW: Localized<string> = {
  en: "Services & connector catalog",
  ru: "Каталог служб и коннекторов",
  de: "Dienste- und Konnektorenkatalog",
  fr: "Catalogue des services et des connecteurs",
  it: "Catalogo dei servizi e dei connettori",
  nl: "Catalogus van diensten en connectors",
  cs: "Katalog služeb a konektorů",
  "zh-Hans": "服务与连接器目录",
  "zh-Hant": "服務與連線器目錄",
  es: "Catálogo de servicios y conectores",
  pl: "Katalog usług i konektorów",
  ja: "サービスとコネクタのカタログ",
  th: "แคตตาล็อกบริการและตัวเชื่อมต่อ",
  fi: "Palvelujen ja liittimien luettelo",
  uk: "Каталог сервісів і конекторів",
  bg: "Каталог на услугите и конекторите",
  tr: "Hizmetler ve bağlayıcılar kataloğu",
  hu: "Szolgáltatások és csatlakoztatók katalógusa",
};

const TITLE: Localized<string> = {
  en: "Catalog state: five plugin modules ship, four are on by factory default, web3_bridge is implemented but off, the remaining connectors are not built",
  ru: "Состояние каталога: пять модулей плагинов поставляются, четыре включены по умолчанию, web3_bridge реализован, но выключен, остальных коннекторов пока нет",
  de: "Stand des Katalogs: fünf Plugin-Module sind ausgeliefert, vier sind standardmäßig aktiv, web3_bridge ist implementiert, aber abgeschaltet, die übrigen Konnektoren gibt es noch nicht",
  fr: "État du catalogue : cinq modules de plugin sont livrés, quatre sont activés par défaut, web3_bridge est implémenté mais éteint, les connecteurs restants ne sont pas développés",
  it: "Stato del catalogo: cinque moduli plugin sono inclusi, quattro sono attivi per impostazione predefinita, web3_bridge è implementato ma spento, gli altri connettori non sono sviluppati",
  nl: "Stand van de catalogus: vijf plug-inmodules worden meegeleverd, vier staan standaard aan, web3_bridge is geïmplementeerd maar uit, de overige connectors zijn niet gebouwd",
  cs: "Stav katalogu: pět modulů pluginů se dodává, čtyři jsou ve výchozím stavu zapnuté, web3_bridge je implementovaný, ale vypnutý, zbývající konektory zatím neexistují",
  "zh-Hans": "目录现状：五个插件模块随网关发布，四个默认开启，web3_bridge 已实现但默认关闭，其余连接器尚未开发",
  "zh-Hant": "目錄現況：五個外掛模組隨閘道發布，四個預設開啟，web3_bridge 已實作但預設關閉，其餘連線器尚未開發",
  es: "Estado del catálogo: se entregan cinco módulos de complemento, cuatro vienen activados de forma predeterminada, web3_bridge está implementado pero apagado, y los conectores restantes no existen",
  pl: "Stan katalogu: pięć modułów wtyczek jest dostarczanych, cztery są domyślnie włączone, web3_bridge jest zaimplementowany, ale wyłączony, a pozostałe konektory nie powstały",
  ja: "カタログの現状：5つのプラグインモジュールが出荷に含まれ、4つは既定でオン、web3_bridge は実装済みだが既定でオフ、それ以外のコネクタはまだ作られていません",
  th: "สภาพของแคตตาล็อก: มีโมดูลปลั๊กอิน 5 ตัวออกมาพร้อมเกตเวย์ สี่ตัวเปิดใช้โดยค่าเริ่มต้น web3_bridge ถูกพัฒนาแล้วแต่ปิดอยู่ ส่วนตัวเชื่อมต่ออื่นยังไม่ถูกสร้าง",
  fi: "Luettelon tila: mukana tulee viisi lisäosamoduulia, neljä on oletuksena päällä, web3_bridge on toteutettu mutta pois kytketty, eikä muita liittimiä ole vielä tehty",
  uk: "Стан каталогу: пʼять модулів плагінів постачаються, чотири типово увімкнені, web3_bridge реалізований, але вимкнений, а решту конекторів ще не створено",
  bg: "Състоянието на каталога: пет модула на плъгини се доставят, четири са включени по подразбиране, web3_bridge е реализиран, но изключен, а останалите конектори все още няма",
  tr: "Katalog durumu: beş eklenti modülü sevk edilir, dördü varsayılan olarak açık, web3_bridge yazılmış ama kapalı, geri kalan bağlayıcılar henüz yok",
  hu: "A katalógus állapota: öt bővítménymodul érkezik, négy alapértelmezés szerint bekapcsolva, a web3_bridge megvalósult, de ki van kapcsolva, és a többi csatlakoztató még nem létezik",
};

const SUBTITLE: Localized<string> = {
  en: "Each entry states what the module does, which credential the call actually needs, what leaves your server, and how to switch it off again. All of it is read out of gateway/app/plugins/, gateway/app/config.py and .env.example; the planned block at the end names the connectors that do not exist in v1.0.0 and promises no date.",
  ru: "Каждая запись говорит, что делает модуль, какого ключа на самом деле требует вызов, что уходит с вашего сервера и как это снова выключить. Всё это вычитано из gateway/app/plugins/, gateway/app/config.py и .env.example; блок «в планах» внизу перечисляет коннекторы, которых в v1.0.0 нет, и сроков не обещает.",
  de: "Jeder Eintrag sagt, was das Modul tut, welches Credential ein Aufruf wirklich braucht, was deinen Server verlässt und wie du es wieder abschaltest. Alles ist aus gateway/app/plugins/, gateway/app/config.py und .env.example ausgelesen; der Block „Geplant“ unten listet die Konnektoren, die es in v1.0.0 nicht gibt, und verspricht keine Termine.",
  fr: "Chaque entrée dit ce que fait le module, quel identifiant l’appel exige vraiment, ce qui quitte votre serveur et comment le rearmer. Tout est lu dans gateway/app/plugins/, gateway/app/config.py et .env.example ; le bloc « prévu » en bas énumère les connecteurs qui n’existent pas dans la v1.0.0 et ne promet aucune date.",
  it: "Ogni voce indica cosa fa il modulo, quale credenziale serve davvero alla chiamata, cosa lascia il tuo server e come spegnerlo di nuovo. Tutto è stato letto da gateway/app/plugins/, gateway/app/config.py e .env.example; il blocco «in programma» in fondo elenca i connettori che non esistono nella v1.0.0 e non promette date.",
  nl: "Elke vermelding zegt wat de module doet, welk credential een oproep echt nodig heeft, wat je server verlaat en hoe je het weer uitzet. Alles is uitgelezen uit gateway/app/plugins/, gateway/app/config.py en .env.example; het blok ‘gepland’ onderaan noemt de connectors die er in v1.0.0 niet zijn en belooft geen datums.",
  cs: "Každý záznam říká, co modul dělá, jaký klíč volání skutečně potřebuje, co opouští váš server a jak to zase vypnout. Vše je přečteno z gateway/app/plugins/, gateway/app/config.py a .env.example; blok „plánováno“ dole vyjmenovává konektory, které v verzi 1.0.0 neexistují, a neslibuje žádná data.",
  "zh-Hans":
    "每一项都写清模块做什么、调用实际需要哪把凭据、什么数据会离开你的服务器、以及怎么再把它关掉。内容逐条取自 gateway/app/plugins/、gateway/app/config.py 与 .env.example；文末的「规划中」列出 v1.0.0 里并不存在的连接器，不承诺任何时间。",
  "zh-Hant":
    "每一項都寫清模組做什麼、呼叫實際需要哪把憑證、什麼資料會離開你的伺服器、以及怎麼再把它關掉。內容逐條取自 gateway/app/plugins/、gateway/app/config.py 與 .env.example；文末的「規劃中」列出 v1.0.0 裡並不存在的連線器，不承諾任何時間。",
  es: "Cada entrada indica qué hace el módulo, qué credencial necesita realmente la llamada, qué datos salen de tu servidor y cómo volver a apagarlo. Todo se leyó de gateway/app/plugins/, gateway/app/config.py y .env.example; el bloque «previsto» al final enumera los conectores que no existen en la v1.0.0 y no promete fechas.",
  pl: "Każdy wpis mówi, co robi moduł, jakiego klucza naprawdę żąda wywołanie, jakie dane opuszczają twój serwer i jak to znowu wyłączyć. Wszystko przepisano z gateway/app/plugins/, gateway/app/config.py i .env.example; blok „w planach” na końcu wylicza konektory, których w v1.0.0 nie ma, i nie obiecuje terminów.",
  ja: "各項目は、モジュールの役割、呼び出しが実際に要求する認証キー、サーバーから外へ出るデータ、そして再び止める方法を書いています。内容は gateway/app/plugins/、gateway/app/config.py、.env.example から取り出したもので、末尾の「計画中」は v1.0.0 に存在しないコネクタを列挙するだけ、時期は約束しません。",
  th: "แต่ละรายการบอกว่าโมดูลทำอะไร, การเรียกใช้ต้องใช้คีย์อะไรจริง ๆ, ข้อมูลไหนออกจากเซิร์ฟเวอร์ของคุณ และจะปิดมันกลับได้อย่างไร ทั้งหมดอ่านมาจาก gateway/app/plugins/, gateway/app/config.py และ .env.example; หัวข้อ «วางแผนไว้» ด้านท้ายระบุตัวเชื่อมต่อที่ไม่มีใน v1.0.0 และไม่สัญญาช่วงเวลาใด",
  fi: "Kukin kohta kertoo, mitä moduuli tekee, mitä avainta kutsu todella vaatii, mikä data lähtee sinun palvelimeltasi ja miten sammuttat sen uudelleen. Kaikki on luettu kohteista gateway/app/plugins/, gateway/app/config.py ja .env.example; lopussa oleva suunnittelu-lohko luettelee liittimet, joita ei ole versiossa 1.0.0, eikä lupaa päivämääriä.",
  uk: "Кожен запис каже, що робить модуль, який ключ насправді вимагає виклик, які дані йдуть із вашого сервера і як це знову вимкнути. Усе це зчитано з gateway/app/plugins/, gateway/app/config.py та .env.example; блок «у планах» внизу перелічує конектори, яких у v1.0.0 немає, і не обіцяє строків.",
  bg: "Всяка запись казва какво прави модулът, какъв ключ наистина изисква извикването, кои данни напускат сървъра ви и как отново да го изключите. Всичко е изчетено от gateway/app/plugins/, gateway/app/config.py и .env.example; блокът «в плановете» на края изброява конекторите, които ги няма в v1.0.0, и не обещава дати.",
  tr: "Her girdi modülün ne yaptığını, çağrının gerçekten hangi anahtara ihtiyaç duyduğunu, sunucunuzdan çıkan veriyi ve nasıl tekrar kapatılacağını anlatır. Tamamı gateway/app/plugins/, gateway/app/config.py ve .env.example dosyalarından okundu; sondaki «planlanan» bloğu, v1.0.0’da var olmayan bağlayıcıları sıralar ve tarih vaat etmez.",
  hu: "Minden bejegyzés megmondja, mit csinál a modul, milyen kulcsot igényel tényleg a hívás, milyen adat hagyja el a szerveredet, és hogyan kapcsolhatod ki újra. Az egész a gateway/app/plugins/, a gateway/app/config.py és a .env.example fájlokból van kiolvasva; a végén lévő „tervekben” blokk azokat a csatlakoztatókat sorolja fel, amelyek nem léteznek a v1.0.0-ban, és dátumot nem ígér.",
};

const LEGEND_SOURCE: Localized<string> = {
  en: "Same repository: gateway/app/plugins/",
  ru: "Тот же репозиторий: gateway/app/plugins/",
  de: "Gleiches Repository: gateway/app/plugins/",
  fr: "Même dépôt : gateway/app/plugins/",
  it: "Stesso repository: gateway/app/plugins/",
  nl: "Zelfde repository: gateway/app/plugins/",
  cs: "Stejný repozitář: gateway/app/plugins/",
  "zh-Hans": "源码同仓：gateway/app/plugins/",
  "zh-Hant": "原始碼同倉：gateway/app/plugins/",
  es: "Mismo repositorio: gateway/app/plugins/",
  pl: "To samo repozytorium: gateway/app/plugins/",
  ja: "同じリポジトリ内: gateway/app/plugins/",
  th: "อยู่ในรีโปเดียวกัน: gateway/app/plugins/",
  fi: "Samassa repositoriossa: gateway/app/plugins/",
  uk: "Той самий репозиторій: gateway/app/plugins/",
  bg: "Същото хранилище: gateway/app/plugins/",
  tr: "Aynı depoda: gateway/app/plugins/",
  hu: "Ugyanabban a repóban: gateway/app/plugins/",
};

const LEGEND_METER: Localized<string> = {
  en: "Meter unit: POPX-CP compute credits",
  ru: "Единица учёта: вычислительные кредиты POPX-CP",
  de: "Maßeinheit: POPX-CP-Rechenkredite",
  fr: "Unité de mesure : crédits de calcul POPX-CP",
  it: "Unità di misura: crediti di calcolo POPX-CP",
  nl: "Maateenheid: POPX-CP-computkredieten",
  cs: "Jednotka měření: výpočetní kredity POPX-CP",
  "zh-Hans": "计量单位：POPX-CP 算力点",
  "zh-Hant": "計量單位：POPX-CP 算力點",
  es: "Unidad de medida: créditos informáticos POPX-CP",
  pl: "Jednostka rozliczeniowa: kredyty obliczeniowe POPX-CP",
  ja: "計量単位：POPX-CP 計算ポイント",
  th: "หน่วยการวัด: เครดิตการคำนวณ POPX-CP",
  fi: "Mittayksikkö: POPX-CP-laskentapisteet",
  uk: "Одиниця обліку: обчислювальні кредити POPX-CP",
  bg: "Мерна единица: изчислителни кредити POPX-CP",
  tr: "Ölçü birimi: POPX-CP hesaplama kredisi",
  hu: "Mértékegység: POPX-CP számítási kredit",
};

const LEGEND_DISABLED: Localized<string> = {
  en: "Four on by default; web3_bridge is off by default",
  ru: "Четыре включены по умолчанию, web3_bridge — выключен",
  de: "Vier standardmäßig an, web3_bridge standardmäßig aus",
  fr: "Quatre activés par défaut ; web3_bridge est désactivé par défaut",
  it: "Quattro attivi per impostazione predefinita; web3_bridge è inattivo",
  nl: "Vier standaard aan; web3_bridge staat standaard uit",
  cs: "Čtyři jsou ve výchozím stavu zapnuté, web3_bridge vypnutý",
  "zh-Hans": "四个默认开启，web3_bridge 默认关闭",
  "zh-Hant": "四個預設開啟，web3_bridge 預設關閉",
  es: "Cuatro activados de forma predeterminada; web3_bridge está desactivado",
  pl: "Cztery domyślnie włączone; web3_bridge domyślnie wyłączony",
  ja: "4 つは既定でオン、web3_bridge は既定でオフ",
  th: "สี่ตัวเปิดใช้โดยค่าเริ่มต้น ส่วน web3_bridge ปิดไว้โดยค่าเริ่มต้น",
  fi: "Neljä on oletuksena päällä, web3_bridge on oletuksena pois",
  uk: "Чотири типово увімкнені, web3_bridge типово вимкнений",
  bg: "Четири са включени по подразбиране; web3_bridge е изключен",
  tr: "Dördü varsayılan olarak açık; web3_bridge varsayılan olarak kapalı",
  hu: "Négy alapértelmezés szerint bekapcsolva; a web3_bridge alapértelmezés szerint kikapcsolva",
};

const STATE_LABEL: Localized<string> = {
  en: "Ships as",
  ru: "Штатно",
  de: "Auslieferungszustand",
  fr: "À la livraison",
  it: "Alla consegna",
  nl: "Bij oplevering",
  cs: "Při dodání",
  "zh-Hans": "出厂默认",
  "zh-Hant": "出廠預設",
  es: "De fábrica",
  pl: "Fabrycznie",
  ja: "出荷時は",
  th: "เมื่อจัดส่ง",
  fi: "Toimitettaessa",
  uk: "У типовій поставці",
  bg: "При доставка",
  tr: "Sevkiyatta",
  hu: "Szállításkor",
};

const ON_LABEL: Localized<string> = {
  en: "enabled by default",
  ru: "по умолчанию включён",
  de: "standardmäßig aktiviert",
  fr: "activé par défaut",
  it: "abilitato per impostazione predefinita",
  nl: "standaard ingeschakeld",
  cs: "ve výchozím stavu zapnuto",
  "zh-Hans": "默认开启",
  "zh-Hant": "預設開啟",
  es: "habilitado de forma predeterminada",
  pl: "domyślnie włączone",
  ja: "既定で有効",
  th: "เปิดใช้โดยค่าเริ่มต้น",
  fi: "oletuksena käytössä",
  uk: "типово увімкнено",
  bg: "включено по подразбиране",
  tr: "varsayılan olarak etkin",
  hu: "alapértelmezés szerint engedélyezve",
};

const OFF_LABEL: Localized<string> = {
  en: "disabled by default",
  ru: "по умолчанию отключён",
  de: "standardmäßig deaktiviert",
  fr: "désactivé par défaut",
  it: "disabilitato per impostazione predefinita",
  nl: "standaard uitgeschakeld",
  cs: "ve výchozím stavu vypnuto",
  "zh-Hans": "默认关闭",
  "zh-Hant": "預設關閉",
  es: "deshabilitado de forma predeterminada",
  pl: "domyślnie wyłączone",
  ja: "既定で無効",
  th: "ปิดใช้โดยค่าเริ่มต้น",
  fi: "oletuksena pois käytöstä",
  uk: "типово вимкнено",
  bg: "изключено по подразбиране",
  tr: "varsayılan olarak devre dışı",
  hu: "alapértelmezés szerint letiltva",
};

/** The one word a card's state pill prints, keyed off `status` rather than off a
 *  boolean, so `roadmap` cannot be mistaken for a switched-off but built plugin. */
const NOT_BUILT_LABEL: Localized<string> = {
  en: "not built",
  ru: "не реализовано",
  de: "nicht gebaut",
  fr: "non développé",
  it: "non sviluppato",
  nl: "niet gebouwd",
  cs: "není implementováno",
  "zh-Hans": "尚未实现",
  "zh-Hant": "尚未實作",
  es: "no está hecho",
  pl: "nie zbudowane",
  ja: "未実装",
  th: "ยังไม่ถูกสร้าง",
  fi: "ei ole tehty",
  uk: "не реалізовано",
  bg: "не е изградено",
  tr: "yazılmadı",
  hu: "nincs megépítve",
};

const SHIP_WORD: Record<ShipState, Localized<string>> = {
  "default-on": ON_LABEL,
  "default-off": OFF_LABEL,
  roadmap: NOT_BUILT_LABEL,
};

const KEYS_LABEL: Localized<string> = {
  en: "Environment",
  ru: "Среда",
  de: "Umgebung",
  fr: "Environnement",
  it: "Ambiente",
  nl: "Omgeving",
  cs: "Prostředí",
  "zh-Hans": "环境变量",
  "zh-Hant": "環境變數",
  es: "Entorno",
  pl: "Środowisko",
  ja: "環境変数",
  th: "ตัวแปรสภาพแวดล้อม",
  fi: "Ympäristö",
  uk: "Середовище",
  bg: "Средата",
  tr: "Ortam",
  hu: "Környezet",
};

const ROUTE_LABEL: Localized<string> = {
  en: "Endpoint",
  ru: "Конечная точка",
  de: "Endpunkt",
  fr: "Point d'accès",
  it: "Punto finale",
  nl: "Eindpunt",
  cs: "Koncový bod",
  "zh-Hans": "接口",
  "zh-Hant": "介面",
  es: "Punto de acceso",
  pl: "Punkt końcowy",
  ja: "エンドポイント",
  th: "จุดเข้าถึง",
  fi: "Päätepiste",
  uk: "Кінцева точка",
  bg: "Крайна точка",
  tr: "Uç nokta",
  hu: "Végpont",
};

const FILE_LABEL: Localized<string> = {
  en: "Module",
  ru: "Модуль",
  de: "Modul",
  fr: "Module",
  it: "Modulo",
  nl: "Module",
  cs: "Modul",
  "zh-Hans": "实现文件",
  "zh-Hant": "實作檔案",
  es: "Módulo",
  pl: "Moduł",
  ja: "実装モジュール",
  th: "โมดูล",
  fi: "Moduuli",
  uk: "Модуль",
  bg: "Модул",
  tr: "Modül",
  hu: "Modul",
};

/* ── 规划中 ───────────────────────────────────────────────────────────────
 *
 * Verified by absence: a case-insensitive scan of every `.py`, `.md`, `.ts`,
 * `.tsx`, `.swift`, `.yml` and `.yaml` file in gateway/app, docs/ and the repo
 * root for stripe|paypal|alipay|slack|discord|shopify|woocommerce|notion|
 * telegram|whatsapp|salesforce|hubspot returns only vendored hits under
 * .venv/. None of these connectors exists, so they get their own array, are
 * never concatenated into `PLUGINS`, and are never offered in the filter. */

const ROADMAP_TITLE: Localized<string> = {
  en: "Planned, not delivered: these connector families exist nowhere in the v1.0.0 repository",
  ru: "В планах, не в поставке: этих семейств коннекторов нет ни в одном файле репозитория v1.0.0",
  de: "Geplant, nicht geliefert: diese Konnektorfamilien existieren im v1.0.0-Repository nirgends",
  fr: "Prévu, non livré : ces familles de connecteurs n’existent nulle part dans le dépôt v1.0.0",
  it: "In programma, non consegnato: queste famiglie di connettori non esistono in nessun file del repository v1.0.0",
  nl: "Gepland, niet meegeleverd: deze connectorfamilies bestaan nergens in de v1.0.0-repository",
  cs: "Plánováno, nedoděláno: tyto rodiny konektorů v repozitáři 1.0.0 neexistují nikde",
  "zh-Hans": "规划中，未交付：以下几类连接器在 v1.0.0 的仓库里一个都不存在",
  "zh-Hant": "規劃中，未交付：以下幾類連線器在 v1.0.0 的倉庫裡一個都不存在",
  es: "Previsto, no entregado: estas familias de conectores no existen en ninguna parte del repositorio v1.0.0",
  pl: "W planach, nie w dostawie: tych rodzin konektorów nie ma nigdzie w repozytorium v1.0.0",
  ja: "計画中であって出荷していません：以下のコネクタ群は v1.0.0 のリポジトリのどこにも存在しません",
  th: "อยู่ในแผนแต่ยังไม่ถูกส่งมอบ: ตัวเชื่อมต่อกลุ่มนี้ไม่มีอยู่เลยในคลังโค้ด v1.0.0",
  fi: "Suunniteltu mutta toittamaton: näitä liitinperheitä ei ole v1.0.0-variosta mistään löytyy",
  uk: "У планах, не у поставці: цих родин конекторів немає жодному файлі репозиторію v1.0.0",
  bg: "В плановете, не в доставката: тези семейства конектори ги няма никъде в хранилището v1.0.0",
  tr: "Planlanan, teslim edilmeyen: bu bağlayıcı ailelerinin hiçbir dosyası v1.0.0 deposunda yok",
  hu: "Tervekben, de nem kézbesítve: ezek a csatlakoztató-családok egyetlen fájlban sem léteznek a v1.0.0 repóban",
};

const ROADMAP_SUB: Localized<string> = {
  en: "The gateway has exactly five plugin modules — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — declared in gateway/app/plugins/__init__.py. A brand name below is only a wish written down, never a feature you can call, and it is not an OAuth or SAML integration either.",
  ru: "У шлюза ровно пять модулей плагинов — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — объявленных в gateway/app/plugins/__init__.py. Название бренда ниже — это записанное желание, а не вызываемая функция; и это не интеграция ни OAuth, ни SAML.",
  de: "Das Gateway hat genau fünf Plugin-Module — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — erklärt in gateway/app/plugins/__init__.py. Ein Markenname unten ist ein notierter Wunsch, nie ein anrufbares Feature, und auch keine OAuth- oder SAML-Integration.",
  fr: "La passerelle n’a exactement que cinq modules de plugin — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — déclarés dans gateway/app/plugins/__init__.py. Un nom de marque ci-dessous est un souhait consigné, jamais une fonction que l’on appelle, et ce n’est pas non plus une intégration OAuth ou SAML.",
  it: "Il gateway ha esattamente cinque moduli plugin — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — dichiarati in gateway/app/plugins/__init__.py. Un nome di marca qui sotto è un desiderio annotato, mai una funzione che puoi chiamare, e non è nemmeno un’integrazione OAuth o SAML.",
  nl: "De gateway heeft precies vijf pluginmodules — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — gedeclareerd in gateway/app/plugins/__init__.py. Een merknaam hieronder is een opgeschreven wens, nooit een aanroepbare functie, en het is ook geen OAuth- of SAML-integratie.",
  cs: "Brána má přesně pět modulů pluginů — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — deklarovaných v gateway/app/plugins/__init__.py. Značka níže je pouze sepsané přání, nikdy funkce, kterou lze zavolat, a není to ani integrace OAuth či SAML.",
  "zh-Hans":
    "网关一共只有五个插件模块 —— ai_agent、alert_ops、privacy_sso、polls、web3_bridge，声明在 gateway/app/plugins/__init__.py。下面的品牌名只是把愿望写了下来，不是你能调用的功能，也不是 OAuth 或 SAML 对接。",
  "zh-Hant":
    "閘道一共只有五個外掛模組 —— ai_agent、alert_ops、privacy_sso、polls、web3_bridge，宣告在 gateway/app/plugins/__init__.py。下面的品牌名只是把願望寫了下來，不是你能呼叫的功能，也不是 OAuth 或 SAML 對接。",
  es: "La pasarela tiene exactamente cinco módulos de complemento — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — declarados en gateway/app/plugins/__init__.py. Un nombre de marca abajo es un deseo anotado, nunca una función que puedas llamar, y tampoco una integración OAuth o SAML.",
  pl: "Bramka ma dokładnie pięć modułów wtyczek — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — zadeklarowanych w gateway/app/plugins/__init__.py. Nazwa marki poniżej to tylko zapisane życzenie, a nie coś, co można wywołać, i to nie jest też integracja OAuth ani SAML.",
  ja: "ゲートのプラグインモジュールは ai_agent、alert_ops、privacy_sso、polls、web3_bridge の5つだけで、gateway/app/plugins/__init__.py に宣言されています。以下のブランド名は書き留めた望みであって、呼び出せる機能ではありません。OAuth や SAML の連携でもありません。",
  th: "เกตเวย์มีโมดูลปลั๊กอินเพียงห้าตัว — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — ที่ประกาศไว้ใน gateway/app/plugins/__init__.py ชื่อแบรนด์ด้านล่างเป็นเพียงความต้องการที่จดไว้ ไม่ใช่ฟีเจอร์ที่คุณเรียกใช้ได้ และไม่ใช่การเชื่อมกับ OAuth หรือ SAML ด้วย",
  fi: "Yhdyskaarella on täsmälleen viisi lisäosamoduulia — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — ilmoitettuna tiedostossa gateway/app/plugins/__init__.py. Alla oleva brändinimi on vain ylös kirjoitettu toive, ei koskaan kutsuttava ominaisuus, eikä se ole OAuth- tai SAML-integraatiokaan.",
  uk: "У шлюза рівно п’ять модулів плагінів — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — оголошених у gateway/app/plugins/__init__.py. Назва бренду нижче — це записане бажання, а не викликава функція, і це не інтеграція ні з OAuth, ні з SAML.",
  bg: "Шлюзът има точно пет модула на плъгини — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — обявени в gateway/app/plugins/__init__.py. Марката отдолу е само записано желание, никога функция, която можете да извикате, и не е нито OAuth, нито SAML интеграция.",
  tr: "Ağ geçidinde tam olarak beş eklenti modülü var — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — gateway/app/plugins/__init__.py içinde bildirilmiş. Aşağıdaki marka adı yalnızca kâğıda dökülmüş bir istek, asla çağırabileceğiniz bir işlev değil; üstelik bir OAuth ya da SAML entegrasyonu da değil.",
  hu: "Az átjárónak pontosan öt bővítménymodulja van — ai_agent, alert_ops, privacy_sso, polls, web3_bridge — amelyek a gateway/app/plugins/__init__.py fájlban vannak deklaráltva. Az alábbi márkanév csak egy lejegyzett kívánság, sosem olyan funkció, amelyet meghívhat, és OAuth- vagy SAML-integráció sem.",
};

const ROADMAP_NEEDS: Localized<string> = {
  en: "What it would take",
  ru: "Что для этого нужно",
  de: "Was dafür nötig wäre",
  fr: "Ce que cela exigerait",
  it: "Cosa servirebbe",
  nl: "Wat het zou kosten",
  cs: "Co by to stálo",
  "zh-Hans": "要做需要什么",
  "zh-Hant": "要做需要什麼",
  es: "Qué haría falta",
  pl: "Czego by to wymagało",
  ja: "必要なもの",
  th: "ต้องใช้อะไรบ้าง",
  fi: "Mitä se vaatisi",
  uk: "Що для цього треба",
  bg: "Какво би било нужно",
  tr: "Ne gerektirirdi",
  hu: "Kellene hozzá",
};

const ROADMAP_NO_DATE: Localized<string> = {
  en: "No delivery date is promised for any row above, and none should be inferred: this block records what is missing, it is not a schedule, and nothing in it works today.",
  ru: "Ни для одной строки выше не обещан срок, и выводить его не стоит: блок фиксирует отсутствие, это не расписание, и сегодня здесь ничего не работает.",
  de: "Für keine der Zeilen oben wird ein Liefertermin versprochen, und man sollte auch keinen hineinlesen: dieser Block hält fest, was fehlt, er ist kein Plan, und nichts davon funktioniert heute.",
  fr: "Aucune date de livraison n’est promise pour les lignes ci-dessus, et il ne faut pas en déduire une : ce bloc consigne ce qui manque, ce n’est pas un calendrier, et rien de son contenu ne fonctionne aujourd’hui.",
  it: "Per nessuna delle righe sopra viene promessa una data di consegna, e non bisognerebbe dedurla: questo blocco registra ciò che manca, non è un piano, e al momento nulla di ciò che elenca funziona.",
  nl: "Voor geen van de regels hierboven wordt een leverdatum beloofd, en je mag die er ook niet uit afleiden: dit blok houdt bij wat ontbreekt, het is geen planning, en niets ervan werkt vandaag.",
  cs: "Za žádným z výše uvedených řádků není slíbené datum dodání, a neměli byste si žádné domýšlet: tento blok zaznamenává, co chybí, není to rozvrh, a nic v něm dnes nefunguje.",
  "zh-Hans":
    "上面任何一行都没有承诺交付时间，也不该被读出一个：这一块记录的是「还缺什么」，它不是排期，其中没有一项今天能用。",
  "zh-Hant":
    "上面任何一行都沒有承諾交付時間，也不該被讀出一個：這一塊記錄的是「還缺什麼」，它不是排程，其中沒有一項今天能用。",
  es: "Para ninguna de las filas de arriba se promete una fecha de entrega, y no habría que deducir ninguna: este bloque anota lo que falta, no es un calendario, y nada de lo que enumera funciona hoy.",
  pl: "Dla żadnego z powyższych wierszy nie obiecano terminu dostawy i nie należy go wywnioskować: ten blok zapisuje to, czego brakuje, nie jest harmonogramem, i nic z tego dziś nie działa.",
  ja: "上のどの行についても納期は約束していません。そこから読み取ってもいけません。このブロックは「何が足りないか」を書き留めたもので、工程表ではなく、今日動くものは一つもありません。",
  th: "ไม่มีการสัญญาวันส่งมอบให้กับรายการใด ๆ ด้านบน และไม่ควรถูกอ่านเอาเองว่ามีความนั้น: บล็อกนี้บันทึกเฉพาะว่ายังขาดอะไร ไม่ใช่กำหนดการ และไม่มีข้อไหนที่ใช้งานได้ในวันนี้",
  fi: "Millekaan yllä olevista riveistä ei luvata toimituspäivää, eikä sellaista pidä päätelläkään: tämä lohko kirjaa puuttuvat asiat, se ei ole aikataulu, eikä mikään sen sisällä toimi tänään.",
  uk: "Жодному з наведених вище рядків не обіцяють строку постачання, і виводити її не варто: цей блок фіксує, чого бракує, це не розклад, і сьогодні в ньому ніщо не працює.",
  bg: "За нито един от горните редове не се обещана дата на доставка, и не трябва да се извежда такава: този блок описва какво липсва, той не е график, и нищо от него днес не работи.",
  tr: "Yukarıdaki satırların hiçbiri için bir teslim tarihi vaat edilmiyor, bir tarih çıkarılmaması da gerekiyor: bu blok neyin eksik olduğunu not eder, bir takvim değildir ve içindeki hiçbir şey bugün çalışmaz.",
  hu: "A fenti sorok egyikéhez sem ígérnek szállítási dátumot, és ilyet nem is kell belőle kikövetkeztetni: ez a blokk azt rögzíti, ami hiányzik, nem ütemterv, és egyetlen benne felsorolt dolog sem működik ma.",
};

type RoadmapItem = {
  /** Latin brand string, kept untranslated like `PluginModel.code`: these are
   *  proper nouns, and translating them would be the only way to misname them. */
  readonly brand: string;
  readonly label: Localized<string>;
  readonly caption: Localized<string>;
};

const ROADMAP: readonly RoadmapItem[] = [
  {
    brand: "Stripe / PayPal",
    label: {
      en: "Payment gateway",
      ru: "Платёжный шлюз",
      de: "Zahlungsgateway",
      fr: "Passerelle de paiement",
      it: "Gateway di pagamento",
      nl: "Betaalgateway",
      cs: "Platební brána",
      "zh-Hans": "支付网关",
      "zh-Hant": "支付閘道",
      es: "Pasarela de pago",
      pl: "Bramka płatności",
      ja: "決済ゲートウェイ",
      th: "ตัวกลางรับชำระเงิน",
      fi: "Maksuyhdyskäytävä",
      uk: "Платіжний шлюз",
      bg: "Платежен шлюз",
      tr: "Ödeme geçidi",
      hu: "Fizetési átjáró",
    },
    caption: {
      en: "No payment provider is wired in anywhere — billing is the internal POPX-CP credit meter with its eight POPOPX_CP_* knobs. A real row would need a merchant secret held on your server, an inbound signed callback, and a refund path; none of the three is written.",
      ru: "Ни один платёжный провайдер не подключён — расчёт ведёт внутренний учёт POPX-CP с восемью настройками POPOPX_CP_*. Настоящей строке понадобились бы ключ продавца на вашем сервере, входящий подписанный колбэк и путь возврата; ни одна из трёх частей не написана.",
      de: "Kein Zahlungsanbieter ist irgendwo angebunden — abgerechnet wird intern in POPX-CP mit den acht POPOPX_CP_*-Schaltern. Eine echte Zeile bräuchte einen Händlerkey auf deinem Server, einen signierten eingehenden Callback und einen Erstattungspfad; keines der drei ist geschrieben.",
      fr: "Aucun prestataire de paiement n’est branché — la facturation passe par le compteur interne POPX-CP avec ses huit réglages POPOPX_CP_*. Une vraie ligne exigerait une clé marchand sur votre serveur, un rappel entrant signé et un chemin de remboursement ; aucun des trois n’est écrit.",
      it: "Nessun gestore di pagamenti è collegato da nessuna parte — la fatturazione usa il contatore interno POPX-CP con le sue otto levette POPOPX_CP_*. Una riga reale richiederebbe una chiave commerciante sul tuo server, un callback in ingresso firmato e un percorso di rimborso; nessuno dei tre è scritto.",
      nl: "Er is geen enkele betaalprovider aangesloten — de facturatie loopt via de interne POPX-CP-meter met zijn acht POPOPX_CP_*-knoppen. Een echte rij zou een winkelierssleutel op je server nodig hebben, een handtekeningdragende inkomende callback en een pad voor terugbetalingen; geen van de drie is geschreven.",
      cs: "Není napojen žádný platební poskytovatel — fakturaci dělá interní měrka POPX-CP s osmi přepínači POPOPX_CP_*. Skutečný řádek by potřeboval obchodníkový klíč na vašem serveru, podepsaný příchozí callback a cestu vrácení peněz; žádná ze tří částí nenapsána.",
      "zh-Hans":
        "仓库里没有接任何支付服务商 —— 计费走的是内部 POPX-CP 算力点，只有八颗 POPOPX_CP_* 旋钮。真要加这一行，需要在你服务器上存商户密钥、要有一条带签名的入站回调、还要有退款路径；这三样都没写。",
      "zh-Hant":
        "倉庫裡沒有接任何支付服務商 —— 計費走的是內部 POPX-CP 算力點，只有八顆 POPOPX_CP_* 旋鈕。真要加這一行，需要在你的伺服器上存商户金鑰、要有一條帶簽名的入站回呼、還要有退款路徑；這三樣都沒寫。",
      es: "No hay ningún proveedor de pago integrado en ninguna parte — la facturación usa el medidor interno POPX-CP con sus ocho parámetros POPOPX_CP_*. Una fila real necesitaría una clave de comercio en tu servidor, un callback entrante firmado y una ruta de reembolso; ninguna de las tres está escrita.",
      pl: "Żaden operator płatności nie jest podłączony — rozliczenia prowadzi wewnętrzny licznik POPX-CP z ośmioma pokrętłami POPOPX_CP_*. Prawdziwy wiersz wymagałby klucza kupca na twoim serwerze, podpisanego przychodzącego wywołania zwrotnego i ścieżki zwrotu; żadna z tych trzech rzeczy nie jest napisana.",
      ja: "決済プロバイダーはどこにも組み込まれていません —— 課金は内部の POPX-CP ポイントで、八つの POPOPX_CP_* つまみだけです。この行を本物にするには、あなたのサーバー上の加盟店キー、署名付きの受信コールバック、返金経路の三つが必要で、三つとも書かれていません。",
      th: "ไม่มีผู้ให้บริการชำระเงินใดถูกเชื่อมไว้เลย — การคิดเงินใช้หน่วย POPX-CP ภายในที่มีปุ่ม POPOPX_CP_* แปดปุ่ม แถวที่เป็นจริงต้องมีส่วนลับของผู้ขายเก็บบนเซิร์ฟเวอร์ของคุณ มี callback ขาเข้าที่เซ็นลายมือชื่อ และมีเส้นทางคืนเงิน ซึ่งทั้งสามอย่างไม่ได้ถูกเขียนไว้",
      fi: "Maksupalveluntarjoajaa ei ole kytketty mihinkään — laskenta käy sisäisellä POPX-CP-mittarilla, jonka kahdeksalla POPOPX_CP_*-säädöllä. Oikea rivi vaatisi kauppiaan avaimen sinun palvelimellesi, sisään tulevan allekirjoitetun callbackin ja palautusreitin; yksikään kolmesta ei ole kirjoitettu.",
      uk: "Жодного платіжного провайдера не підключено — розрахунки ведуться внутрішнім лічильником POPX-CP із вісьмома регуляторами POPOPX_CP_*. Справжньому рядку потрібні ключ продавця на вашому сервері, вхідний виклик із підписом і шлях повернення коштів; жодна з трьох частин не написана.",
      bg: "Няма свързан платежен доставчик никъде — отчитът минава през вътрешния измерител POPX-CP с осте му POPOPX_CP_* регулатора. Истински ред би изисквал търговски ключ на вашия сървър, входящо подписано обратното извикване и път за връщане на средства; нито едно от трите е написано.",
      tr: "Hiçbir yerde bir ödeme sağlayıcısı bağlanmamış — faturalandırma, sekiz POPOPX_CP_* düğmeli dahili POPX-CP sayacı ile yapılıyor. Gerçek bir satır sizin sunucunuzda bir tüccar anahtarı, imzalı bir gelen geri çağırma ve bir iade yolu gerektirirdi; üçünün de kodu yazılmadı.",
      hu: "Fizetési szolgáltató nincs bekötve sehol — az elszámolás a belső POPX-CP mérővel történik, a nyolc POPOPX_CP_* kapcsolóval. Egy valós sorhoz a szervereden tárolt kereskedői kulcs, egy aláírt bejövő visszahívás és egy visszatérítési útvonal kellene; a három egyike sincs megírva.",
    },
  },
  {
    brand: "Slack / Discord",
    label: {
      en: "Team chat",
      ru: "Командный чат",
      de: "Team-Chat",
      fr: "Messagerie d’équipe",
      it: "Chat di team",
      nl: "Teamchat",
      cs: "Týmový chat",
      "zh-Hans": "团队协作",
      "zh-Hant": "團隊協作",
      es: "Chat de equipo",
      pl: "Czat zespołu",
      ja: "チームチャット",
      th: "แชททีม",
      fi: "Tiimikeskustelu",
      uk: "Командний чат",
      bg: "Отдово чатче",
      tr: "Ekip sohbeti",
      hu: "Csapatcsevegés",
    },
    caption: {
      en: "Alerts currently end on the follower’s phone and in the console; nothing pushes them onward. This would be a second outbound transport beside the single loopback node WebSocket that gateway/app/config.py defines, plus its own secret and its own retry rules.",
      ru: "Сейчас оповещения заканчиваются на телефоне подписчика и в консоли; наружу их никто не отправляет. Это будет второй исходящий транспорт рядом с единственным узлом WebSocket на loopback, который определён в gateway/app/config.py, со своим ключом и своими правилами повторов.",
      de: "Meldungen enden heute auf dem Handy des Followers und in der Konsole; nichts schiebt sie weiter. Das wäre ein zweiter ausgehender Transport neben dem einen Loopback-Node-WebSocket, den gateway/app/config.py kennt, mit eigenem Schlüssel und eigenen Retry-Regeln.",
      fr: "Les alertes s’arrêtent aujourd’hui sur le téléphone de l’abonné et dans la console ; rien ne les pousse plus loin. Ce serait un second transport sortant à côté de l’unique WebSocket de nœud en bouclage local défini par gateway/app/config.py, avec son propre secret et ses propres règles de relance.",
      it: "Gli avvisi oggi finiscono sul telefono del follower e nella console; nulla li inoltra. Sarebbe un secondo trasporto in uscita accanto all’unico WebSocket di nodo su loopback definito da gateway/app/config.py, con un segreto proprio e regole di ritentativo proprie.",
      nl: "Meldingen eindigen nu op de telefoon van de volger en in de console; niets duwt ze verder. Dit zou een tweede uitgaand transport zijn naast de ene node-WebSocket op loopback die gateway/app/config.py definieert, met een eigen geheim en eigen stallingsregels.",
      cs: "Výstrahy dnes končí na telefonu sledujícího a v konzoli; nic je neposílá dál. Byl by to druhý odchozí transport vedle jediného uzlového WebSocketu na loopback, který definuje gateway/app/config.py, s vlastním tajemstvím a vlastními pravidly opakování.",
      "zh-Hans":
        "告警今天只落到粉丝的手机和后台里，没有任何东西把它们再转发出去。这会是 gateway/app/config.py 里那条唯一的 loopback 节点 WebSocket 之外的第二条出站通道，还要自带一把密钥和一套重试规则。",
      "zh-Hant":
        "告警今天只落到粉絲的手機和後台裡，沒有任何東西把它們再轉發出去。這會是 gateway/app/config.py 裡那條唯一的 loopback 節點 WebSocket 之外的第二條出站通道，還要自帶一把金鑰和一套重試規則。",
      es: "Las alertas terminan hoy en el teléfono del seguidor y en la consola; nada las reenvía. Sería un segundo transporte de salida junto al único WebSocket de nodo en loopback que define gateway/app/config.py, con su propio secreto y sus propias reglas de reintento.",
      pl: "Alerty kończą się dziś na telefonie obserwującego i w konsoli; nic ich dalej nie wysyła. Byłby to drugi transport wychodzący obok jednego WebSocketu węzła na pętli lokalnej, który definiuje gateway/app/config.py, z własnym sekretem i własnymi regułami ponawiania.",
      ja: "アラートは今のところフォロワーのスマホとコンソールで止まり、そこから先へ送るものはありません。これは gateway/app/config.py が定義する唯一の loopback ノード WebSocket でもう一つの送信路になり、自分の秘密鍵と自分の再送規則も必要になります。",
      th: "ปัจจุบันการแจ้งเตือนจบแค่ที่โทรศัพท์ของผู้ติดตามและในคอนโซล ไม่มีสิ่งใดส่งต่อไปข้างนอก นี่จะเป็นช่องทางขาออกที่สองนอกเหนือจาก WebSocket ของโหนดบน loopback เส้นเดียวที่ gateway/app/config.py กำหนดไว้ พร้อมกับคีย์ของตัวเองและกติกาการลองใหม่ของตัวเอง",
      fi: "Hälytykset päättyvät tällä hetkellä seuraajan puhelimeen ja konsoliin; mikään ei työnnä niitä eteenpäin. Tämä olisi toinen ulostuleva kuljetus gateway/app/config.py:n määrittelemän ainoan loopback-solmu WebSocketin rinnalle, oman salaisuutensa ja omien uudelleenyrityssääntönsä kera.",
      uk: "Тривоги нині закінчуються на телефоні підписника й у консолі; ніщо не надсилає їх далі. Це був би другий вихідний транспорт поруч із єдиним WebSocket вузла на loopback, який визначає gateway/app/config.py, зі власним секретом і власними правилами повторів.",
      bg: "Предупрежденията днес свършват на телефона на последователя и в конзолата; нищо не ги препраща. Това би бил втори изходящ транспорт до единствения WebSocket на възел върху loopback, дефиниран от gateway/app/config.py, със собствена тайна и собствени правила за повторение.",
      tr: "Uyarılar şimdilik takipçinin telefonunda ve konsolda duruyor; hiçbir şey bunları öteye itmıyor. Bu, gateway/app/config.py’nin tanımladığı tek loopback düğüm WebSocket’inin yanına ikinci bir gidiş taşıması olurdu, üstelik kendi sırrı ve kendi yeniden deneme kurallarıyla.",
      hu: "A riasztások jelenleg a követő telefonján és a konzolban végződnek; semmi továbbítja őket. Ez a gateway/app/config.py által definiált egyetlen loopback csomóponti WebSocket mellé egy második kimenő szállítás lenne, saját titokkal és saját újrapróbálási szabályokkal.",
    },
  },
  {
    brand: "Shopify / WooCommerce",
    label: {
      en: "Commerce",
      ru: "Коммерция",
      de: "Handel",
      fr: "Commerce",
      it: "Commercio",
      nl: "Handel",
      cs: "Obchod",
      "zh-Hans": "电商平台",
      "zh-Hant": "電商平台",
      es: "Comercio",
      pl: "Handel",
      ja: "EC サイト",
      th: "แพลตฟอร์มค้าปลีก",
      fi: "Kauppa",
      uk: "Комерція",
      bg: "Търговия",
      tr: "Ticaret",
      hu: "Kereskedelem",
    },
    caption: {
      en: "The suite has no product, cart or order model; cards carry text and buttons, not SKUs. An order feed would arrive over HTTPS into storage this gateway does not have, and it would have to be reconciled against POPX-CP, which is a credit meter rather than money.",
      ru: "В套件 нет ни товаров, ни корзины, ни заказов; карточки несут текст и кнопки, но не артикулы. Поток заказов пришёл бы по HTTPS в хранилище, которого у шлюза нет, и его сверяли бы с POPX-CP — а это счётчик кредитов, а не деньги.",
      de: "Die Suite hat kein Produkt-, Warenkorb- oder Bestellmodell; Karten tragen Text und Knöpfe, keine SKUs. Ein Bestell-Feed käme über HTTPS in einen Speicher, den dieses Gateway nicht hat, und müsste gegen POPX-CP abgeglichen werden, das ein Kreditzähler ist und kein Geld.",
      fr: "La suite n’a aucun modèle de produit, de panier ou de commande ; les cartes portent du texte et des boutons, pas de référence. Un flux de commandes arriverait en HTTPS dans un stockage que cette passerelle n’a pas, et il faudrait le rapprocher de POPX-CP, qui est un compteur de crédits et non de la monnaie.",
      it: "La suite non ha nessun modello di prodotto, carrello o ordine; le carte portano testo e pulsanti, non codici articolo. Un flusso di ordini arriverebbe via HTTPS in un archivio che questo gateway non ha, e andrebbe conciliato con POPX-CP, che è un contatore di crediti e non denaro.",
      nl: "De suite kent geen product-, winkelwagen- of bestelmodel; kaarten dragen tekst en knoppen, geen artikelnummers. Een bestellingsfeed zou via HTTPS binnenkomen in opslag die deze gateway niet heeft, en zou tegen POPX-CP afgeweegd moeten worden, dat een kredietmeter is en geen geld.",
      cs: "Souprava nemá žádný model produktu, košíku ani objednávky; karty nesou text a tlačítka, ne položky. Zásilka objednávek by přišla přes HTTPS do úložiště, které tato brána nemá, a musela by se srovnávat s POPX-CP, což je měrka kreditů, nikoli peníze.",
      "zh-Hans":
        "这套东西没有商品、购物车或订单模型；卡片带的是文字和按钮，不是 SKU。订单流要靠 HTTPS 进到这个网关并不存在的存储里，还得跟 POPX-CP 对账 —— 而 POPX-CP 是算力点计量，不是钱。",
      "zh-Hant":
        "這套東西沒有商品、購物車或訂單模型；卡片帶的是文字和按鈕，不是 SKU。訂單流要靠 HTTPS 進到這個閘道並不存在的儲存裡，還得跟 POPX-CP 對帳 —— 而 POPX-CP 是算力點計量，不是錢。",
      es: "El conjunto no tiene modelo de producto, carrito ni pedido; las tarjetas llevan texto y botones, no referencias de producto. Un flujo de pedidos llegaría por HTTPS a un almacenamiento que esta pasarela no tiene, y habría que conciliarlo con POPX-CP, que es un medidor de créditos y no dinero.",
      pl: "Pakiet nie ma modelu produktu, koszyka ani zamówienia; karty niosą tekst i przyciski, nie indeksy. Strumień zamówień przychodziłby przez HTTPS do magazynu, którego ta bramka nie ma, i musiałby być rozliczany z POPX-CP, a to licznik kredytów, nie pieniądze.",
      ja: "この一式には商品・カート・注文のモデルがなく、カードが運ぶのは文字とボタンで SKU ではありません。注文フィードを HTTPS でこのゲートが持っていない保存領域に受け、しかも POPX-CP と突き合わせる必要がありますが、あれはお金ではなく計算ポイントのカウントです。",
      th: "ชุดนี้ไม่มีโมเดลสินค้า ตะกร้า หรือคำสั่งซื้อ การ์ด carrying ข้อความกับปุ่ม ไม่ใช่ SKU ฟีดคำสั่งซื้อต้องเข้ามาทาง HTTPS เข้าสู่ที่เก็บข้อมูลที่เกตเวย์นี้ไม่มี และยังต้องกระทบยอดกับ POPX-CP ซึ่งเป็นตัวนับเครดิต ไม่ใช่เงิน",
      fi: "Packassa ei ole tuote-, ostoskori- tai tilausmallia; kortit kuljettavat tekstiä ja painikkeita eivätkä tuotekoodeja. Tilausvirta saapuisi HTTPS:llä tallennustilaan, jota tällä yhdyskaarella ei ole, ja se pitäisi täsmättää POPX-CP:hen, joka on kreditmitari eikä rahaa.",
      uk: "У наборі немає моделі товару, кошика чи замовлення; картки несуть текст і кнопки, а не артикули. Потік замовлень мав би надійти через HTTPS у сховище, якого в цього шлюза немає, і його треба звіряти з POPX-CP, а це лічильник кредитів, а не гроші.",
      bg: "Комплектът няма модел на продукт, количка или поръчка; картите носят текст и бутони, не артикули. Поток от поръчки би дошъл през HTTPS в хранилище, което този шлюз няма, и би трябвало да се сверява с POPX-CP, което е мерител на кредити, а не пари.",
      tr: "Bu takımda ürün, sepet ya da sipariş modeli yok; kartlar metin ve düğme taşır, SKU değil. Sipariş akışı HTTPS ile bu ağ geçidinin sahip olmadığı bir depoya gelirdi, üstelik POPX-CP ile mutabık olması gerekirdi; o ise bir kredi sayacı, para değil.",
      hu: "A csomagban nincs termék-, kosár- vagy rendelési modell; a kártyák szöveget és gombokat visznek,cikket nem. A rendelési adatfolyom HTTPS-en érkezne egy olyan tárolóba, amellyel ez az átjáró nem rendelkezik, és az POPX-CP-vel szembe egyeztetendő, amely kreditmérő, nem pénz.",
    },
  },
  {
    brand: "Google Sheets / Notion",
    label: {
      en: "Spreadsheets and docs",
      ru: "Таблицы и документы",
      de: "Tabellen und Dokumente",
      fr: "Tableurs et documents",
      it: "Fogli e documenti",
      nl: "Spreadsheets en documenten",
      cs: "Tabulky a dokumenty",
      "zh-Hans": "表格与文档",
      "zh-Hant": "試算表與文件",
      es: "Hojas de cálculo y documentos",
      pl: "Arkusze i dokumenty",
      ja: "スプレッドシートと文書",
      th: "สเปรดชีตและเอกสาร",
      fi: "Taulukot ja dokumentit",
      uk: "Таблиці та документи",
      bg: "Електронни таблици и документи",
      tr: "Tablolar ve belgeler",
      hu: "Táblázatok és dokumentumok",
    },
    caption: {
      en: "Everything the gateway knows sits in one SQLite file. Export exists only as GET /api/v1/plugins/ai/transcript/<contact_id>/export and the polls result endpoints; there is no writer to any external document store, and no OAuth refresh token machinery to authorize one.",
      ru: "Всё, что знает шлюз, лежит в одном файле SQLite. Экспорт существует только как GET /api/v1/plugins/ai/transcript/<contact_id>/export и результаты опросов; писателя во внешний документ-хран нет, как и машины refresh-токенов OAuth для авторизации.",
      de: "Alles, was das Gateway weiß, liegt in einer SQLite-Datei. Export gibt es nur als GET /api/v1/plugins/ai/transcript/<contact_id>/export und die Umfrage-Ergebnisse; ein Schreibpfad in einen externen Dokumentenspeicher fehlt, ebenso die OAuth-Refresh-Token-Maschinerie, die ihn autorisieren würde.",
      fr: "Tout ce que la passerelle sait est dans un seul fichier SQLite. L’exportation n’existe que via GET /api/v1/plugins/ai/transcript/<contact_id>/export et les points de résultat des sondages ; il n’y a aucun rédacteur vers un magasin de documents externe, ni aucune mécanique de jetons d’actualisation OAuth pour l’autoriser.",
      it: "Tutto ciò che il gateway sa sta in un unico file SQLite. L’esportazione esiste solo come GET /api/v1/plugins/ai/transcript/<contact_id>/export e gli endpoint dei risultati dei sondaggi; non c’è nessuno scrittore verso un archivio di documenti esterno, né una macchina di refresh token OAuth per autorizzarla.",
      nl: "Alles wat de gateway weet staat in één SQLite-bestand. Export bestaat alleen als GET /api/v1/plugins/ai/transcript/<contact_id>/export en de resultaten-eindpunten van polls; er is geen schrijver naar een externe documentopslag, en geen OAuth-verversingstokenmachine om die te machtigen.",
      cs: "Vše, co brána ví, leží v jednom souboru SQLite. Export existuje jen jako GET /api/v1/plugins/ai/transcript/<contact_id>/export a koncové body výsledků ankety; žádný zapisovač do vnějšího úložiště dokumentů neexistuje, a ani mechanismus obnovovacích tokenů OAuth, který by ho zmocnil.",
      "zh-Hans":
        "网关知道的一切都在一个 SQLite 文件里。导出只有 GET /api/v1/plugins/ai/transcript/<contact_id>/export 和问卷结果那两个口子；没有任何往外部文档存储写入的代码，也就没有能授权的 OAuth refresh token 那一整套机制。",
      "zh-Hant":
        "閘道知道的一切都在一個 SQLite 檔案裡。匯出只有 GET /api/v1/plugins/ai/transcript/<contact_id>/export 和問卷結果那两个口子；沒有任何往外部文件儲存寫入的程式碼，也就沒有能授權的 OAuth refresh token 那一整套機制。",
      es: "Todo lo que sabe la pasarela está en un único archivo SQLite. La exportación solo existe como GET /api/v1/plugins/ai/transcript/<contact_id>/export y los puntos de resultado de encuestas; no hay ningún escritor hacia un almacén de documentos externo, ni tampoco la maquinaria de tokens de actualización OAuth para autorizarlo.",
      pl: "Wszystko, co bramka wie, leży w jednym pliku SQLite. Eksport istnieje jedynie jako GET /api/v1/plugins/ai/transcript/<contact_id>/export i punkty wyników ankiet; nie ma żadnego zapisującego do zewnętrznego magazynu dokumentów ani mechanizmu odświeżania tokenów OAuth, który by go upoważnił.",
      ja: "ゲートが知っていることは全て SQLite の1ファイルに入っています。書き出しは GET /api/v1/plugins/ai/transcript/<contact_id>/export と投票の結果エンドポイントしかなく、外部の文書ストレージへ書き込むコードも、それを認める OAuth のリフレッシュトークンの仕組みもありません。",
      th: "สิ่งที่เกตเวย์รู้ทั้งหมดอยู่ในไฟล์ SQLite ไฟล์เดียว การส่งออกมีแค่ GET /api/v1/plugins/ai/transcript/<contact_id>/export กับ endpoing ผลโพล ไม่มีตัวเขียนไปยังที่เก็บเอกสารภายนอก และไม่มีกลไก refresh token ของ OAuth ที่จะอนุญาต",
      fi: "Kaikki mitä yhdyskaari tietää on yhdessä SQLite-tiedostossa. vientinä toimivat vain GET /api/v1/plugins/ai/transcript/<contact_id>/export ja kyselyjen tulososoitteet; ulkoiseen dokumenttivarastoon ei kirjoita kukaan, eikä sitä valtuuttavaa OAuth-päivitystokenkoneistoa ole.",
      uk: "Усе, що знає шлюз, лежить в одному файлі SQLite. Експорт існує лише як GET /api/v1/plugins/ai/transcript/<contact_id>/export та ендпоінти результатів опитувань; писаря до зовнішнього сховища документів немає, як і машини оновлення токенів OAuth, щоб його авторизувати.",
      bg: "Всичко, което шлюзът знае, е в един SQLite файл. Експортът съществува само като GET /api/v1/plugins/ai/transcript/<contact_id>/export и крайните точки за резултати от анкети; няма писател към външно хранилище за документи, нито машина за обновяващи токени на OAuth, която да го оторизира.",
      tr: "Ağ geçidinin bildiği her şey tek bir SQLite dosyasında duruyor. Dışa aktarım yalnızca GET /api/v1/plugins/ai/transcript/<contact_id>/export ve anket sonuç uç noktaları olarak var; harici bir belge deposuna yazan bir kod da yok, onu yetkilendirecek OAuth yenileme jetonu düzeneği de.",
      hu: "Bmit is tud az átjáró, egyetlen SQLite fájlban van. Exportálás csak a GET /api/v1/plugins/ai/transcript/<contact_id>/export és a szavazások eredményvégpontjai formájában létezik; nincs író külső dokumentumtárba, és nincs hozzá felhatalmazó OAuth-frissítőtoken-gépészet sem.",
    },
  },
  {
    brand: "CRM / ERP",
    label: {
      en: "CRM and ERP",
      ru: "CRM и ERP",
      de: "CRM und ERP",
      fr: "CRM et ERP",
      it: "CRM ed ERP",
      nl: "CRM en ERP",
      cs: "CRM a ERP",
      "zh-Hans": "客户与企业管理",
      "zh-Hant": "客戶與企業管理",
      es: "CRM y ERP",
      pl: "CRM i ERP",
      ja: "CRM と ERP",
      th: "CRM และ ERP",
      fi: "CRM ja ERP",
      uk: "CRM та ERP",
      bg: "CRM и ERP",
      tr: "CRM ve ERP",
      hu: "CRM és ERP",
    },
    caption: {
      en: "Deliberately so: the follower table keys on pairwise_uid and stores no phone number, no email and no real-name profile, which is the privacy promise rather than an omission. Syncing a CRM in would import exactly the identifiers this gateway refuses to hold.",
      ru: "И это сделано намеренно: таблица подписчиков ключуется на pairwise_uid и не хранит ни телефона, ни почты, ни реального имени — это обещание приватности, а не упущение. Синхронизация с CRM привнесла бы ровно те идентификаторы, которые шлюз отказывается держать.",
      de: "Bewusst so: die Follower-Tabelle schlüsselt über pairwise_uid und speichert keine Telefonnummer, keine E-Mail und kein Realname-Profil — das ist das Datenschutzversprechen, kein Versehen. Eine CRM-Synchronisation würde genau die Kennungen importieren, die dieses Gateway nicht halten will.",
      fr: "C’est voulu : la table des abonnés est indexée sur pairwise_uid et ne stocke ni téléphone, ni courriel, ni profil en nom réel, ce qui est la promesse de confidentialité et non un oubli. Synchroniser un CRM importerait précisément les identifiants que cette passerelle refuse de détenir.",
      it: "Ed è una scelta: la tabella dei follower è indicizzata su pairwise_uid e non conserva numero di telefono, email né profilo anagrafico, il che è la promessa di privacy e non una dimenticanza. Sincronizzare un CRM importerebbe esattamente gli identificatori che questo gateway rifiuta di trattenere.",
      nl: "Opzettelijk zo: de volgerentabel sleutelt op pairwise_uid en bewaart geen telefoonnummer, geen e-mail en geen realnaamprofiel, wat de privacybelofte is en geen weglating. Een CRM synchroniseren zou precies die identificatoren importeren die deze gateway weigert te bewaren.",
      cs: "Záměrně: tabčka sledujících je klíčovaná na pairwise_uid a neukládá telefonní číslo, e-mail ani profil pod pravým jménem, což je ten soukromý slib, ne opomenutí. Synchronizace CRM by dovezl přesně ty identifikátory, které tato brána odmítá držet.",
      "zh-Hans":
        "这一点是故意的：粉丝表以 pairwise_uid 为主键，不存手机号、不存邮箱、也不建实名画像 —— 这是隐私承诺，不是漏掉了。真要同步一个 CRM 进来，导入的恰恰是这套网关拒绝保存的那批标识符。",
      "zh-Hant":
        "這一點是故意的：粉絲表以 pairwise_uid 為主鍵，不存手機號、不存信箱、也不建實名畫像 —— 這是隱私承諾，不是漏掉了。真要同步一個 CRM 進來，匯入的恰恰是這個閘道拒絕儲存的那批識別碼。",
      es: "Es a propósito: la tabla de seguidores indexa por pairwise_uid y no guarda teléfono, ni correo, ni perfil con nombre real, y eso es la promesa de privacidad, no una omisión. Sincronizar un CRM importaría justo los identificadores que esta pasarela se niega a guardar.",
      pl: "Z premedytacją: tabela obserwujących jest kluczowana po pairwise_uid i nie przechowuje numeru telefonu, adresu e-mail ani profilu z prawdziwym imieniem i nazwiskiem — to przyrzeczenie prywatności, a nie przeoczenie. Synchronizacja CRM wprowadziłaby dokładnie te identyfikatory, których ta bramka odmawia przechowywać.",
      "ja": "これは意図的です。フォロワー表の主キーは pairwise_uid で、電話番号もメールも実名プロファイルも保存しません。これはプライバシーの約束で、抜けではありません。CRM を同期すると、このゲートが保持することを拒んでいる識別子そのものを入力ことになります。",
      th: "เป็นเรื่องตั้งใจ: ตารางผู้ติดตามใช้ pairwise_uid เป็นคีย์หลัก และไม่เก็บเบอร์โทร อีเมล หรือโปรไฟล์ชื่อจริง ซึ่งเป็นคำสัญญาด้านความเป็นส่วนตัวไม่ใช่ข้อตกหล่น การซิงค์ CRM เข้ามาจะนำเข้าตัวระบุที่เกตเวย์นี้ปฏิเสธที่จะเก็บพอดี",
      fi: "Tämä on tahallista: seuraajataulukko avautuu pairwise_uid:llä eikä pidä puhelinnumeroa, sähköpostia eikä oikean nimen profiilia, mikä on yksityisyyslupaus eikä laiminlyönti. CRM-synkronointi toisi juuri ne tunnisteet, joita tämä yhdyskaari kieltäytyy säilyttämästä.",
      uk: "Це зроблено умисно: таблиця підписників ключується на pairwise_uid і не зберігає телефону, пошти чи профілю під справжнім іменем — це обіцянка приватності, а не пропуск. Синхронізація з CRM імпортувала б саме ті ідентифікатори, які цей шлюз відмовляється тримати.",
      bg: "И това е умишлено: таблицата с последователи се индексира от pairwise_uid и не пази телефонен номер, имейл или профил с истинско име, което е обещанието за поверителност, а не пропуск. Синхронизирането на CRM би внесло точно идентификаторите, които този шлюз отказва да съхранява.",
      "tr": "Bu bilinçli bir tercih: takipçi tablosu pairwise_uid üzerine anahtarlanır ve telefon numarası, e-posta ya da gerçek adlı profil saklamaz; bu bir gizlilik sözüdür, eksiklik değil. Bir CRM’i eşitlemek tam da bu ağ geçidinin tutmayı reddettiği tanımlayıcıları içeri aktarırdı.",
      hu: "Ez szándékos: a követőtábla pairwise_uid szerint kulcsol, és nem tárol telefonszámot, e-mailt ولا valódi nevű profilt — ez a magánszféra ígérete, nem kimaradás. Egy CRM szinkronizálása éppen azokat az azonosítókat hozná be, amelyeket ez az átjáró nem vállal tárolni.",
    },
  },
  {
    brand: "Telegram / WhatsApp",
    label: {
      en: "Other chat bridges",
      ru: "Другие мосты",
      de: "Andere Chat-Brücken",
      fr: "Autres ponts de messagerie",
      it: "Altri bridge di chat",
      nl: "Andere chatbruggen",
      cs: "Další chatové můstky",
      "zh-Hans": "其它消息平台桥",
      "zh-Hant": "其它訊息平台橋",
      es: "Otros puentes de mensajería",
      pl: "Inne mosty czatu",
      ja: "他のチャット橋渡し",
      th: "สะพานเชื่อมแชทอื่น",
      fi: "Muut chat-sillat",
      uk: "Інші чат-мости",
      bg: "Други мостове за чат",
      tr: "Diğer sohbet köprüleri",
      hu: "További chat-hidak",
    },
    caption: {
      en: "The gateway speaks to one transport only: the open-source node on ws://127.0.0.1:5225. A second network would mean a second identity model, and those platforms bind accounts to phone numbers, which is the one thing this suite promises not to carry.",
      ru: "Шлюз говорит только с одним транспортом: узел с открытым кодом на ws://127.0.0.1:5225. Вторая сеть означала бы вторую модель идентичности, а эти платформы привязывают аккаунты к номеру телефона — к единственной вещи, которую этот набор обещает не переносить.",
      de: "Das Gateway spricht mit genau einem Transport: dem Open-Source-Knoten auf ws://127.0.0.1:5225. Ein zweites Netz hieße ein zweites Identitätsmodell, und diese Plattformen binden Konten an Telefonnummern — genau das, was diese Suite nicht tragen will.",
      fr: "La passerelle ne parle qu’à un seul transport : le nœud open source sur ws://127.0.0.1:5225. Un second réseau signifierait un second modèle d’identité, et ces plateformes lient les comptes à un numéro de téléphone, ce que cette suite promet justement de ne pas transporter.",
      it: "Il gateway parla con un solo trasporto: il nodo open source su ws://127.0.0.1:5225. Una seconda rete significherebbe un secondo modello di identità, e queste piattaforme legano gli account al numero di telefono, che è l’unica cosa che questa suite promette di non trasportare.",
      nl: "De gateway praat met één transport: de open-bron knoop op ws://127.0.0.1:5225. Een tweede netwerk zou een tweede identiteitsmodel betekenen, en die platforms binden accounts aan telefoonnummers, wat het enige is wat deze suite belooft niet mee te slepen.",
      cs: "Brána mluví pouze s jedním transportem: uzlem s otevřeným kódem na ws://127.0.0.1:5225. Druhá síť by znamenala druhý model identity, a tyto platformy poutají účty k telefonnímu číslu, což je jediná věc, kterou tato souprava slibuje nepřenášet.",
      "zh-Hans":
        "网关只对接一条通道：本机 ws://127.0.0.1:5225 上那个开源节点。多一个网络就是多一套身份模型，而这些平台把账号绑在手机号上 —— 手机号正是这套服务承诺不搬运的那一样东西。",
      "zh-Hant":
        "閘道只對接一條通道：本機 ws://127.0.0.1:5225 上那個開源節點。多一個網路就是多一套身分模型，而這些平台把帳號綁在手機號上 —— 手機號正是這套服務承諾不搬運的那一樣東西。",
      es: "La pasarela solo habla con un transporte: el nodo de código abierto en ws://127.0.0.1:5225. Una segunda red significaría un segundo modelo de identidad, y esas plataformas vinculan las cuentas a un número de teléfono, que es justamente lo único que este conjunto promete no transportar.",
      pl: "Bramka rozmawia tylko z jednym transportem: węzłem open source na ws://127.0.0.1:5225. Druga sieć oznaczałaby drugi model tożsamości, a te platformy wiążą konta z numerem telefonu, czyli jedyną rzeczą, którą ten pakiet obiecuje nie przenosić.",
      "ja": "ゲートが話すのは ws://127.0.0.1:5225 のオープンソースノードという一つの輸送手段だけです。網がもう一つ増えれば身分モデルももう一つ増えることになり、これらのプラットフォームはアカウントを電話番号に紐付けるため、電話番号はこの一式が運ばないと約束しているものそのものです。",
      "th": "เกตเวย์คุยกับช่องทางเดียวเท่านั้น คือโหนดโอเพนซอร์สบน ws://127.0.0.1:5225 เครือข่ายที่สองย่อมแปลว่าโมเดลตัวตนที่สอง และแพลตฟอร์มเหล่านี้ผูกบัญชีเข้ากับเบอร์โทร ซึ่งเป็นสิ่งเดียวที่ชุดนี้สัญญาว่าจะไม่ขนย้าย",
      fi: "Yhdyskaari puhuu vain yhtä kuljetusta: avoimen lähdekoodin solmua osoitteessa ws://127.0.0.1:5225. Toinen verkko tarkoittaisi toista identiteettimallia, ja nämät alustat sitovat tilit puhelinnumeroon, joka on juuri se yksittäinen asia, mitä tämä paketti lupaami kuljettaa.",
      uk: "Шлюз розмовляє лише з одним транспортом: вузлом із відкритим кодом на ws://127.0.0.1:5225. Друга мережа означала б другу модель ідентичності, а ті платформи прив’язують облікові записи до номера телефону — єдиної речі, яку цей набір обіцяє не переносити.",
      "bg": "Шлюзът говори само с един транспорт: възел с отворен код на ws://127.0.0.1:5225. Втората мрежа би значела втори модел на самоличността, а тези платформи обвързват сметките с телефонен номер — единственото нещо, което този комплект обещава да не пренася.",
      "tr": "Ağ geçidi yalnızca tek bir taşımayla konuşur: ws://127.0.0.1:5225 üzerindeki açık kaynak düğüm. İkinci bir ağ, ikinci bir kimlik modeli demek olurdu; üstelik bu platformlar hesapları telefon numarasına bağlar — bu takımın taşımama sözü verdiği tek şey de telefon numarasıdır.",
      hu: "Az átjáró csak egy szállítófelülettel beszél: a ws://127.0.0.1:5225 címen futó nyílt forráskódú csomóponttal. Egy második hálózat második személyazonosság-modellt jelentene, ezek a platformok pedig a fiókokat telefonszámhoz kötik — ez az egyetlen dolog, amelyet ez a csomag nem vállal szállítani.",
    },
  },
];


/* ── the four questions every card has to answer, and their labels ──────────
 *
 * `能力说明 / 调用凭据 / 数据流向 / 如何撤销` are printed as the `<dt>` of the
 * first four facts of each card, so the answer is never just implied by prose.
 * The remaining facts on a card are detail on top of those four. */

const Q_CAPABILITY: Localized<string> = {
  en: "Capability",
  ru: "Возможность",
  de: "Funktion",
  fr: "Fonction",
  it: "Funzione",
  nl: "Functie",
  cs: "Schopnost",
  "zh-Hans": "能力说明",
  "zh-Hant": "能力說明",
  es: "Capacidad",
  pl: "Zdolność",
  ja: "できること",
  th: "ความสามารถ",
  fi: "Ominaisuus",
  uk: "Можливість",
  bg: "Възможност",
  tr: "Yetenek",
  hu: "Teljesítmény",
};

const Q_CREDENTIAL: Localized<string> = {
  en: "Credential",
  ru: "Допуск",
  de: "Zugangsschlüssel",
  fr: "Identifiant",
  it: "Credenziale",
  nl: "Toegangssleutel",
  cs: "Klíč",
  "zh-Hans": "调用凭据",
  "zh-Hant": "呼叫憑證",
  es: "Credencial",
  pl: "Klucz",
  ja: "必要な鍵",
  th: "คีย์ที่ใช้เรียก",
  fi: "Avain",
  uk: "Ключ допуску",
  bg: "Ключ",
  tr: "Anahtar",
  hu: "Kulcs",
};

const Q_DATAFLOW: Localized<string> = {
  en: "Data flow",
  ru: "Данные",
  de: "Datenfluss",
  fr: "Flux de données",
  it: "Flusso di dati",
  nl: "Datastroom",
  cs: "Tok dat",
  "zh-Hans": "数据流向",
  "zh-Hant": "資料流向",
  es: "Flujo de datos",
  pl: "Przepływ danych",
  ja: "データの行方",
  th: "ทิศทางข้อมูล",
  fi: "Datavirta",
  uk: "Потік даних",
  bg: "Поток от данни",
  tr: "Veri akışı",
  hu: "Adatfolyam",
};

const Q_REVOKE: Localized<string> = {
  en: "Revocation",
  ru: "Отзыв",
  de: "Widerruf",
  fr: "Révocation",
  it: "Revoca",
  nl: "Intrekken",
  cs: "Odvolání",
  "zh-Hans": "如何撤销",
  "zh-Hant": "如何撤銷",
  es: "Revocación",
  pl: "Odwołanie",
  ja: "止め方",
  th: "การยกเลิก",
  fi: "Peruminen",
  uk: "Відкликання",
  bg: "Отмяна",
  tr: "Geri alma",
  hu: "Visszavonás",
};

const FILTER_LABEL: Localized<string> = {
  en: "Filter",
  ru: "Фильтр",
  de: "Filter",
  fr: "Filtre",
  it: "Filtro",
  nl: "Filter",
  cs: "Filtr",
  "zh-Hans": "按类别筛选",
  "zh-Hant": "按類別篩選",
  es: "Filtro",
  pl: "Filtr",
  ja: "絞り込み",
  th: "ตัวกรอง",
  fi: "Suodatin",
  uk: "Фільтр",
  bg: "Филтър",
  tr: "Filtre",
  hu: "Szűrő",
};

const CAT_ALL: Localized<string> = {
  en: "All five",
  ru: "Все пять",
  de: "Alle fünf",
  fr: "Les cinq",
  it: "Tutti e cinque",
  nl: "Alle vijf",
  cs: "Všech pět",
  "zh-Hans": "全部五项",
  "zh-Hant": "全部五項",
  es: "Los cinco",
  pl: "Wszystkie pięć",
  ja: "すべて",
  th: "ทั้งหมดห้าตัว",
  fi: "Kaikki viisi",
  uk: "Усі пʼять",
  bg: "Всички пет",
  tr: "Beşi de",
  hu: "Mind az öt",
};

const CAT_AGENT: Localized<string> = {
  en: "Support agent",
  ru: "Агент поддержки",
  de: "Support-Assistent",
  fr: "Agent d’assistance",
  it: "Assistente di supporto",
  nl: "Supportagent",
  cs: "Asistent podpory",
  "zh-Hans": "智能客服",
  "zh-Hant": "智慧客服",
  es: "Agente de soporte",
  pl: "Asystent wsparcia",
  ja: "サポート対応",
  th: "เจ้าหน้าที่สนับสนุน",
  fi: "Tukiassistentti",
  uk: "Асистент підтримки",
  bg: "Асистент за поддръжка",
  tr: "Destek ajanı",
  hu: "Ügyféltámogatás",
};

const CAT_OPS: Localized<string> = {
  en: "Ops alerting",
  ru: "Оповещения",
  de: "Ops-Warnungen",
  fr: "Alertes d’exploitation",
  it: "Avvisi operativi",
  nl: "Ops-meldingen",
  cs: "Provozní výstrahy",
  "zh-Hans": "运维告警",
  "zh-Hant": "維運告警",
  es: "Alertas de operaciones",
  pl: "Alerty operacyjne",
  ja: "運用アラート",
  th: "การแจ้งเตือนปฏิบัติการ",
  fi: "Käyttöhälytykset",
  uk: "Тривоги експлуатації",
  bg: "Експлоатационни предупредявания",
  tr: "Operasyon uyarıları",
  hu: "Üzemriasztások",
};

const CAT_IDENTITY: Localized<string> = {
  en: "Identity",
  ru: "Идентичность",
  de: "Identität",
  fr: "Identité",
  it: "Identità",
  nl: "Identiteit",
  cs: "Identita",
  "zh-Hans": "身份登录",
  "zh-Hant": "身分登入",
  es: "Identidad",
  pl: "Tożsamość",
  ja: "ID・ログイン",
  th: "ตัวตนและการเข้าสู่ระบบ",
  fi: "Identiteetti",
  uk: "Ідентичність",
  bg: "Идентичност",
  tr: "Kimlik",
  hu: "Személyazonosság",
};

const CAT_ENGAGEMENT: Localized<string> = {
  en: "Engagement",
  ru: "Вовлечение",
  de: "Interaktion",
  fr: "Interaction",
  it: "Coinvolgimento",
  nl: "Interactie",
  cs: "Zapojení",
  "zh-Hans": "互动投票",
  "zh-Hant": "互動投票",
  es: "Interacción",
  pl: "Zaangażowanie",
  ja: "アンケート",
  th: "การมีส่วนร่วม",
  fi: "Kanssakäyminen",
  uk: "Взаємодія",
  bg: "Ангажираност",
  tr: "Etkileşim",
  hu: "Közösségi bevonás",
};

const CAT_CHAIN: Localized<string> = {
  en: "On-chain",
  ru: "Ончейн",
  de: "On-Chain",
  fr: "On-chain",
  it: "On-chain",
  nl: "On-chain",
  cs: "On-chain",
  "zh-Hans": "链上桥接",
  "zh-Hant": "鏈上串接",
  es: "Cadena",
  pl: "Łańcuch",
  ja: "オンチェーン",
  th: "บนเชน",
  fi: "Ketjussa",
  uk: "Ончейн",
  bg: "Верижно",
  tr: "Zincir üstü",
  hu: "Láncra írva",
};

const CATEGORY_COPY: Record<Category, Localized<string>> = {
  agent: CAT_AGENT,
  ops: CAT_OPS,
  identity: CAT_IDENTITY,
  engagement: CAT_ENGAGEMENT,
  chain: CAT_CHAIN,
};

const FILTER_CHIPS: readonly { readonly value: FilterValue; readonly copy: Localized<string> }[] = [
  { value: CATEGORY_ALL, copy: CAT_ALL },
  { value: "agent", copy: CAT_AGENT },
  { value: "ops", copy: CAT_OPS },
  { value: "identity", copy: CAT_IDENTITY },
  { value: "engagement", copy: CAT_ENGAGEMENT },
  { value: "chain", copy: CAT_CHAIN },
];

const FILTER_ARIA: Localized<string> = {
  en: "Filter the service catalog by category",
  ru: "Фильтр каталога служб по категории",
  de: "Dienstekatalog nach Kategorie filtern",
  fr: "Filtrer le catalogue de services par catégorie",
  it: "Filtra il catalogo dei servizi per categoria",
  nl: "Catalogus filteren op categorie",
  cs: "Filtrovat katalog služeb podle kategorie",
  "zh-Hans": "按类别筛选服务目录",
  "zh-Hant": "按類別篩選服務目錄",
  es: "Filtrar el catálogo de servicios por categoría",
  pl: "Filtruj katalog usług według kategorii",
  ja: "カテゴリでサービスカタログを絞り込む",
  th: "กรองแคตตาล็อกบริการตามหมวดหมู่",
  fi: "Suodata palveluluetteloa luokan mukaan",
  uk: "Фільтрувати каталог сервісів за категорією",
  bg: "Филтрирай каталога на услугите по категория",
  tr: "Hizmet kataloğunu kategoriye göre süzüp daralt",
  hu: "Szolgáltatáskatalógus szűrése kategória szerint",
};

const ROADMAP_LABEL: Localized<string> = {
  en: "not implemented",
  ru: "не реализовано",
  de: "nicht implementiert",
  fr: "non développé",
  it: "non implementato",
  nl: "niet geïmplementeerd",
  cs: "neimplementováno",
  "zh-Hans": "未实现",
  "zh-Hant": "未實作",
  es: "no implementado",
  pl: "nie zaimplementowano",
  ja: "未実装",
  th: "ยังไม่ทำ",
  fi: "ei toteutettu",
  uk: "не реалізовано",
  bg: "не е реализирано",
  tr: "yazılmadı",
  hu: "nincs megvalósítva",
};

/* --- four-step integration path ---------------------------------------------- */

const STEPS_TITLE: Localized<string> = {
  en: "Four steps from catalog entry to a live call",
  ru: "Четыре шага от записи каталога до рабочего вызова",
  de: "Vier Schritte vom Katalogeintrag zum live laufenden Aufruf",
  fr: "Quatre étapes, de l’entrée du catalogue à un appel en production",
  it: "Quattro passaggi dalla voce di catalogo a una chiamata in esercizio",
  nl: "Vier stappen van catalogusvermelding tot een live aanroep",
  cs: "Čtyři kroky od položky katalogu ke skutečnému volání",
  "zh-Hans": "四步：从目录里挑选项到真的被调用",
  "zh-Hant": "四步：從目錄裡挑選項到真的被呼叫",
  es: "Cuatro pasos de la entrada del catálogo a una llamada en marcha",
  pl: "Cztery kroce od wpisu w katalogu do działającego wywołania",
  ja: "カタログの項目から実際の呼び出しまで、4つのステップ",
  th: "สี่ขั้นตอนจากรายการในแคตตาล็อกไปสู่การเรียกใช้งานจริง",
  fi: "Neljä vaihetta luettelon kohdasta oikeaan kutsuun",
  uk: "Чотири кроки від запису в каталозі до робочого виклику",
  bg: "Четири стъпки от записа в каталога до реално извикване",
  tr: "Katalog kaydından çalışan çağrıya dört adım",
  hu: "Négy lépés a katalógusbejegyzéstől az élő hívásig",
};

const STEP_1_TITLE: Localized<string> = {
  en: "Pick the service",
  ru: "Выбрать службу",
  de: "Dienst auswählen",
  fr: "Choisir le service",
  it: "Scegli il servizio",
  nl: "Kies de dienst",
  cs: "Vybrat službu",
  "zh-Hans": "选择服务/插件",
  "zh-Hant": "選擇服務/外掛",
  es: "Elige el servicio",
  pl: "Wybierz usługę",
  ja: "サービスを選ぶ",
  th: "เลือกบริการ",
  fi: "Valitse palvelu",
  uk: "Вибрати сервіс",
  bg: "Избери услугата",
  tr: "Hizmeti seç",
  hu: "Válaszd ki a szolgáltatást",
};

const STEP_1_COPY: Localized<string> = {
  en: "Filter the catalog and read the state chip first: shipped on, shipped off, or not built at all. Only the five cards below exist as code.",
  ru: "Отфильтруй каталог и сначала посмотри на чип состояния: включён, выключен или вообще не существует. Как код существуют только пять карточек ниже.",
  de: "Filtere den Katalog und lies zuerst den Zustands-Chip: ausgeliefert an, ausgeliefert aus, oder gar nicht gebaut. Nur die fünf Karten unten existieren als Code.",
  fr: "Filtrez le catalogue et lisez d’abord la puce d’état : livré activé, livré désactivé, ou jamais développé. Seules les cinq fiches ci-dessous existent en code.",
  it: "Filtra il catalogo e leggi prima la chip di stato: spedito attivo, spedito inattivo, o proprio non esistente. Solo le cinque schede qui sotto esistono come codice.",
  nl: "Filter de catalogus en lees eerst de statuschip: meegeleverd aan, meegeleverd uit, of helemaal niet gebouwd. Alleen de vijf kaarten hieronder bestaan als code.",
  cs: "Filtrujte katalog a nejprve čtěte chip o stavu: dodáno zapnuto, dodáno vypnuto, nebo vůbec neexistuje. Jako kód existuje jen pět karet níže.",
  "zh-Hans": "先筛选目录，再看状态标签：出厂开启、出厂关闭，或者根本没做。作为代码存在的只有下面五张卡片。",
  "zh-Hant": "先篩選目錄，再看狀態標籤：出廠開啟、出廠關閉，或者根本沒做。作為程式碼存在的只有下面五張卡片。",
  es: "Filtra el catálogo y lee primero la etiqueta de estado: entregado activado, entregado apagado o directamente no construido. Solo las cinco tarjetas de abajo existen como código.",
  pl: "Przefiltruj katalog i najpierw odczytaj plakietkę stanu: dostarczone włączone, dostarczone wyłączone albo wcale niezbudowane. Jako kod istnieje tylko pięć kartek poniżej.",
  ja: "カタログを絞り込み、まず状態チップを見てください。出荷時にオン、出荷時にオフ、または作られてすらいません。コードとして存在するのは下の5枚だけです。",
  th: "กรองแคตตาล็อกแล้วอ่านป้ายสถานะก่อน: เปิดมาแต่ต้น ปิดมาแต่ต้น หรือไม่มีการสร้างเลย มีแค่ห้าการ์ดข้างล่างเท่านั้นที่มีอยู่จริงในโค้ด",
  fi: "Suodata luetteloa ja lue ensin tilamerkki: toimitettu päällä, toimitettu pois tai ei lainkaan toteutettu. Vain alla olevat viisi korttia ovat olemassa koodina.",
  uk: "Відфільтруйте каталог і спершу подивіться на чип стану: поставлено увімкненим, поставлено вимкненим або взагалі не існує. Як код існують лише пʼять карток нижче.",
  bg: "Филтрирай каталога и първо прочети етикета на състоянието: доставено включено, доставено изключено или изобщо не е правено. Само петте карти по-долу съществуват като код.",
  tr: "Kataloğu süz ve önce durum etiketine bak: açık geliyor, kapalı geliyor ya da hiç yazılmamış. Kod olarak var olan tek şey aşağıdaki beş kart.",
  hu: "Szűrd a katalógust, és először az állapotjelzőt olvasd el: gyárilag bekapcsolva, gyárilag kikapcsolva vagy egyáltalán nem létezik. Csak az alábbi öt kártya létezik kódként.",
};

const STEP_2_TITLE: Localized<string> = {
  en: "Set the connection and credentials",
  ru: "Настроить соединение и ключи",
  de: "Verbindung und Zugangsdaten setzen",
  fr: "Régler la connexion et les identifiants",
  it: "Imposta connessione e credenziali",
  nl: "Verbinding en aanmeldsleutels instellen",
  cs: "Nastavit připojení a klíče",
  "zh-Hans": "配置连接与凭据",
  "zh-Hant": "設定連線與憑證",
  es: "Configura la conexión y las credenciales",
  pl: "Ustaw połączenie i poświadczenia",
  ja: "接続と認証情報を設定する",
  th: "ตั้งค่าการเชื่อมต่อและข้อมูลใช้ยืนยัน",
  fi: "Aseta yhteys ja tunnukset",
  uk: "Налаштувати зʼєднання й облікові ключі",
  bg: "Задай връзката и ключовете",
  tr: "Bağlantıyı ve kimlik bilgilerini ayarla",
  hu: "Állítsd be a kapcsolatot és a hitelesítő adatokat",
};

const STEP_2_COPY: Localized<string> = {
  en: "Write the POPOPX_PLUGIN_* switch and the plugin's own keys into .env, keep that file 0600, give POPOPX_ADMIN_TOKEN at least 24 characters that are not a template value, then restart; the card's Environment row is the whole list.",
  ru: "Запиши переключатель POPOPX_PLUGIN_* и ключи плагина в .env, держи файл в режиме 0600, дай POPOPX_ADMIN_TOKEN не меньше 24 символов и не шаблонное значение, затем перезапусти; строка «Среда» на карточке — это весь список.",
  de: "Schalter POPOPX_PLUGIN_* und die Schlüssel des Moduls in .env schreiben, die Datei auf 0600 lassen, POPOPX_ADMIN_TOKEN mit mindestens 24 Zeichen und keinem Vorgabewert setzen, dann neu starten; die Umgebung-Zeile der Karte ist die vollständige Liste.",
  fr: "Écrivez l’interrupteur POPOPX_PLUGIN_* et les clés du module dans .env, gardez le fichier en 0600, donnez à POPOPX_ADMIN_TOKEN au moins 24 caractères qui ne sont pas une valeur modèle, puis redémarrez ; la ligne Environnement de la fiche est la liste complète.",
  it: "Scrivi l’interruttore POPOPX_PLUGIN_* e le chiavi del modulo nel .env, lascia il file in 0600, dai a POPOPX_ADMIN_TOKEN almeno 24 caratteri che non siano un valore predefinito, poi riavvia; la riga Ambiente della scheda è l’elenco completo.",
  nl: "Zet de schakelaar POPOPX_PLUGIN_* en de sleutels van de module in .env, houd dat bestand 0600, geef POPOPX_ADMIN_TOKEN minstens 24 tekens die geen sjabloonwaarde zijn, en start opnieuw; de Omgeving-rij van de kaart is de volledige lijst.",
  cs: "Přepínač POPOPX_PLUGIN_* a klíče modulu napište do .env, soubor nechte na 0600, POPOPX_ADMIN_TOKEN dejte alespoň 24 znaků, které nejsou šablonou, a restartujte; řádek Prostředí na kartě je celý seznam.",
  "zh-Hans": "把 POPOPX_PLUGIN_* 开关和这个插件自己的键写进 .env，文件权限保持 0600，POPOPX_ADMIN_TOKEN 至少 24 个字符且不能是模板值，然后重启；卡片上的「环境变量」一行就是全部清单。",
  "zh-Hant": "把 POPOPX_PLUGIN_* 開關和這個外掛自己的鍵寫進 .env，檔案權限維持 0600，POPOPX_ADMIN_TOKEN 至少 24 個字元而且不能是範例值，然後重新啟動；卡片上的「環境變數」那列就是完整清單。",
  es: "Escribe el interruptor POPOPX_PLUGIN_* y las claves del módulo en .env, mantén ese archivo en 0600, dale a POPOPX_ADMIN_TOKEN al menos 24 caracteres que no sean un valor de plantilla y reinicia; la fila Entorno de la tarjeta es la lista completa.",
  pl: "Przełącznik POPOPX_PLUGIN_* i klucze modułu wpisz do .env, trzymaj ten plik w trybie 0600, nadaj POPOPX_ADMIN_TOKEN co najmniej 24 znaki, które nie są wartością szablonu, i zrestartuj; wiersze Środowisko na karcie to pełna lista.",
  ja: "スイッチ POPOPX_PLUGIN_* とそのモジュールの鍵を .env に書き、ファイルは 0600 のまま、POPOPX_ADMIN_TOKEN はひな形値ではなく 24 文字以上にしてお再起動します。カードの環境変数欄がそのまま一覧です。",
  th: "เขียนสวิตช์ POPOPX_PLUGIN_* กับคีย์ของโมดูลลงไฟล์ .env, ไฟล์นั้นต้องเป็น 0600, กำหนด POPOPX_ADMIN_TOKEN อย่างน้อย 24 อักขระและไม่ใช่ค่าเทมเพลต แล้วรีสตาร์ท; บรรทัดตัวแปรสภาพแวดล้อมในการ์ดคือรายการทั้งหมด",
  fi: "Kirjoita kytkin POPOPX_PLUGIN_* ja moduulin omat avaimet .env-tiedostoon, pidä tiedosto tilassa 0600, anna POPOPX_ADMIN_TOKEN vähintään 24 merkkiä, jotka eivät ole malliarvo, ja käynnistä uudelleen; kortin Ympäristö-rivi on koko lista.",
  uk: "Запишіть перемикач POPOPX_PLUGIN_* та ключі модуля у .env, тримайте файл у режимі 0600, дайте POPOPX_ADMIN_TOKEN щонайменше 24 символи, що не збігаються з шаблонним значенням, і перезапустіть; рядок Середовище на картці — це весь перелік.",
  bg: "Запиши превключвателя POPOPX_PLUGIN_* и ключовете на модула в .env, запази файла в режим 0600, дай на POPOPX_ADMIN_TOKEN поне 24 знака, които не са шаблонна стойност, и рестартирай; редът Средата в картата е целият списък.",
  tr: "POPOPX_PLUGIN_* anahtarını ve modülün kendi anahtarlarını .env içine yaz, dosyayı 0600 olarak bırak, POPOPX_ADMIN_TOKEN için şablon olmayan en az 24 karakter ver ve yeniden başlat; karttaki Ortam satırı tüm listedir.",
  hu: "Írd a .env-be a POPOPX_PLUGIN_* kapcsolót és a modul kulcsait, tartsd a fájlt 0600 módban, adj a POPOPX_ADMIN_TOKEN-nak legalább 24, nem sablon karaktert, majd indítsd újra; a kártya Környezet sora a teljes lista.",
};

const STEP_3_TITLE: Localized<string> = {
  en: "Narrow the exposure",
  ru: "Сузить поверхность",
  de: "Exposure verkleinern",
  fr: "Réduire la surface exposée",
  it: "Riduci lʼesposizione",
  nl: "Kleinere blootstelling",
  cs: "Sniž výstavní plochu",
  "zh-Hans": "收窄暴露面",
  "zh-Hant": "收窄暴露面",
  es: "Reduce la superficie expuesta",
  pl: "Zwęź powierzchnię ataku",
  ja: "露出面を狭める",
  th: "ลดพื้นที่การเปิดเผย",
  fi: "Karsi altistusta",
  uk: "Звужуємо поверхню",
  bg: "Свиси изложената повърхност",
  tr: "Saldırı yüzeyini daralt",
  hu: "Szűkítsd a kitettséget",
};

const STEP_3_COPY: Localized<string> = {
  en: "The levers that actually exist are four: the per-plugin switch, binding the gateway to 127.0.0.1:8080 instead of 0.0.0.0, read-only credentials where a service offers them, and the per-plugin caps. Scoped tokens are not one of them.",
  ru: "Реальных рычагов четыре: переключатель каждого плагина, привязка шлюза к 127.0.0.1:8080 вместо 0.0.0.0, ключи только для чтения там, где сервис это умеет, и лимиты по плагинам. Скоупованных токенов среди них нет.",
  de: "Es gibt vier Hebel, die wirklich existieren: den Plugin-Schalter, das Binden des Gateways an 127.0.0.1:8080 statt 0.0.0.0, schreibgeschützte Zugangsdaten, wo der Dienst sie anbietet, und Limits pro Modul. Token mit scopes gibt es nicht.",
  fr: "Quatre leviers existent vraiment : l’interrupteur par module, l’écoute sur 127.0.0.1:8080 au lieu de 0.0.0.0, des identifiants en lecture seule quand le service le permet, et les plafonds par module. Des jetons à scope n’existent pas.",
  it: "Le leve che esistono davvero sono quattro: l’interruttore per singolo modulo, l’ascolto su 127.0.0.1:8080 invece di 0.0.0.0, credenziali di sola lettura dove il servizio le offre e i limiti per modulo. I token con scope non sono tra queste.",
  nl: "Er zijn vier hendels die echt bestaan: de per-module schakelaar, de gateway vastzetten op 127.0.0.1:8080 in plaats van 0.0.0.0, alleen-lezen credentials waar de dienst ze biedt, en de per-module plafonds. Scoped tokens behoren er niet toe.",
  cs: "Reálné páky jsou čtyři: přepínač každého modulu, navázání brány na 127.0.0.1:8080 místo 0.0.0.0, klíče jen pro čtení, kde je služba nabízí, a limity podle modulu. Tokeny s rozsahem mezi nimi nejsou.",
  "zh-Hans": "真正存在的杠杆只有四根：单个插件的开关、把网关绑到 127.0.0.1:8080 而不是 0.0.0.0、在对方支持的场合用只读凭据、以及每插件限额。带作用域的令牌不在其中。",
  "zh-Hant": "真正存在的槓桿只有四根：單一外掛的開關、把閘道綁定到 127.0.0.1:8080 而不是 0.0.0.0、在對方支援的場合使用唯讀憑證、以及每外掛額度上限。帶作用域的權杖不在其中。",
  es: "Las palancas que de verdad existen son cuatro: el interruptor por módulo, enlazar la pasarela a 127.0.0.1:8080 en vez de 0.0.0.0, credenciales de solo lectura cuando el servicio las ofrece y topes por módulo. Los tokens con alcance no están entre ellas.",
  pl: "Dźwigni, które naprawdę istnieją, są cztery: przełącznik pojedynczego modułu, wiązanie bramy z 127.0.0.1:8080 zamiast 0.0.0.0, poświadczenia tylko do odczytu tam, gdzie usługa je oferuje, oraz limity na moduł. Tokeny zakresowe do nich nie należą.",
  ja: "実際に使えるレバーは4つだけです。モジュール単位のスイッチ、ゲートウェイを 0.0.0.0 ではなく 127.0.0.1:8080 にバインドすること、相手が対応しているなら読み取り専用の認証情報を使うこと、そしてモジュール単位の上限。スコープ付きトークンは入っていません。",
  th: "คันโยกที่มีอยู่จริงมีสี่อัน: สวิตช์รายโมดูล, ผูกเกตเวย์ไว้กับ 127.0.0.1:8080 แทน 0.0.0.0, ใช้คีย์อ่านอย่างเดียวในกรณีที่ฝั่งบริการรองรับ, และจำกัดโควตาเป็นรายโมดูล — โทเคนแบบกำหนด scope ไม่มีอยู่ในนี้",
  fi: "Todellisia vivut ovat neljä: lisäosakohtainen kytkin, gatewayn sitominen 127.0.0.1:8080-osoitteeseen 0.0.0.0 sijaan, vain-luku-tunnukset silloin kun palvelu tarjoaa niitä, ja lisäosakohtaiset katot. Scopeitetut tokenit eivät ole yksi niistä.",
  uk: "Важелів, які справді існують, чотири: перемикач кожного модуля, привʼязка шлюза до 127.0.0.1:8080 замість 0.0.0.0, ключі лише для читання там, де сервіс їх підтримує, й ліміти за модулями. Скоупованих токенів серед них немає.",
  bg: "Лостите, които наистина съществуват, са четири: превключвателят по модул, обвързването на гейтуейта с 127.0.0.1:8080 вместо 0.0.0.0, ключовете само за четене, където услугата ги предлага, и лимитите по модул. Токените с обхват не са сред тях.",
  tr: "Gerçekte var olan dört kaldıraç var: eklenti başına anahtar, ağ geçidini 0.0.0.0 yerine 127.0.0.1:8080ʼe bağlamak, hizmet sunduğunda salt okunur kimlik bilgisi kullanmak ve eklenti başına tavanlar. Kapsamlı tokenlar bunlardan biri değil.",
  hu: "Négy valódi kar létezik: modulonkénti kapcsoló, az átjáró 127.0.0.1:8080-hoz kötése a 0.0.0.0 helyett, csak olvasható hitelesítők, ahol a szolgáltatás ilyet kínál, és a modulonkénti korlátok. Scope-okkal ellátott token nincs közöttük.",
};

const STEP_4_TITLE: Localized<string> = {
  en: "Hand it to a service account or an Agent",
  ru: "Подать это сервис-аккаунту или Agent",
  de: "An Dienstkonto oder Agent übergeben",
  fr: "Le donner au compte-service ou à l’Agent",
  it: "Passalo all’account servizio o all’Agent",
  nl: "Geef het door aan het dienstaccount of de Agent",
  cs: "Předej to služebnímu účtu nebo Agentovi",
  "zh-Hans": "供 Chat 服务号或 Agent 调用",
  "zh-Hant": "供 Chat 服務號或 Agent 呼叫",
  es: "Pásaselo a la cuenta de servicio o al Agent",
  pl: "Przekaż to konta usługi albo Agentowi",
  ja: "サービスアカウントか Agent から呼ぶ",
  th: "ส่งต่อให้บัญชีบริการหรือ Agent เรียกใช้",
  fi: "Anna se palvelutilille tai Agentille kutattavaksi",
  uk: "Передайте це сервіс-акаунту або Agent",
  bg: "Прехвърли го на акаунта на услугата или на Agent",
  tr: "Hizmet hesabına ya da Agentʼa devret",
  hu: "Add tovább a szolgáltatási fióknak vagy az Agentnek",
};

const STEP_4_COPY: Localized<string> = {
  en: "Two consumers exist. A POPOPX Chat 服务号 gets cards and up to three menu items, and drives the plugin through callbacks. An Agent calls the same /api/v1 endpoints over HTTP with the admin bearer — no extra credential, no separate permission.",
  ru: "Потребителя два. Сервис-аккаунт POPOPX Chat получает карточки и до трёх пунктов меню и работает через колбэки. Agent вызывает те же эндпоинты /api/v1 по HTTP с админским bearer — без отдельного ключа и без отдельных прав.",
  de: "Es gibt zwei Abnehmer. Eine POPOPX-Chat-Dienstkontonummer bekommt Karten und bis zu drei Menüpunkte und arbeitet über Callbacks. Ein Agent ruft dieselben /api/v1-Endpunkte über HTTP mit dem Admin-Bearer auf — kein zusätzliches Credential, keine eigene Berechtigung.",
  fr: "Deux consommateurs existent. Un compte-service POPOPX Chat reçoit des cartes et trois entrées de menu au plus, et pilote le module par callbacks. Un Agent appelle les mêmes points /api/v1 en HTTP avec le bearer admin — pas d’identifiant supplémentaire, pas de permission distincte.",
  it: "I consumatori sono due. Un account servizio POPOPX Chat riceve card e fino a tre voci di menu e agisce tramite callback. Un Agent chiama gli stessi endpoint /api/v1 in HTTP col bearer admin: nessuna credenziale aggiuntiva, nessun permesso separato.",
  nl: "Er zijn twee verbruikers. Een POPOPX Chat-dienstaccount krijgt kaarten en maximaal drie menu-items en stuurt via callbacks. Een Agent roept dezelfde /api/v1-eindpunten over HTTP aan met de admin-bearer — geen extra credential, geen aparte toestemming.",
  cs: "Jsou dva spotřebitelé. Servisní účet POPOPX Chat dostává karty a nejvýše tři položky menu a ovládá modul přes callbacky. Agent volá stejné /api/v1 koncovky přes HTTP s admin bearerem — žádný další klíč, žádné extra oprávnění.",
  "zh-Hans": "消费方只有两个。POPOPX Chat 服务号拿到卡片和最多三级菜单，用回调来驱动插件；Agent 走 HTTP 调同一批 /api/v1 接口，带的还是那把 admin bearer——没有额外的凭据，也没有单独的权限。",
  "zh-Hant": "消費方只有兩個。POPOPX Chat 服務號取得卡片與最多三項菜單，用回調來驅動外掛；Agent 透過 HTTP 呼叫同一批 /api/v1 介面，帶的還是那把 admin bearer——沒有額外憑證，也沒有單獨權限。",
  es: "Hay dos consumidores. Una cuenta de servicio POPOPX Chat recibe tarjetas y hasta tres elementos de menú, y opera mediante callbacks. Un Agent llama a los mismos endpoints /api/v1 por HTTP con el bearer de administración: sin credencial extra, sin permiso aparte.",
  pl: "Są dwa rodzaje odbiorców. Konto usługi POPOPX Chat dostaje karty i do trzech pozycji menu oraz steruje modułem przez callbacki. Agent woła te same punkty /api/v1 przez HTTP z bearerem administratora — bez dodatkowej poświadczenia, bez osobnego uprawnienia.",
  ja: "利用側は2つです。POPOPX Chat のサービスアカウントはカードと最大3項目のメニューを受け取り、コールバックでモジュールを動かします。Agent はまったく同じ /api/v1 エンドポイントを、管理者 bearer を付けて HTTP で呼びます。別の credential も、別個の権限もありません。",
  th: "มีผู้ใช้งานสองแบบ บัญชีบริการ POPOPX Chat จะได้การ์ดกับเมนูสูงสุด 3 รายการแล้วสั่งงานผ่าน callback ส่วน Agent จะเรียก endpoint /api/v1 ชุดเดิมผ่าน HTTP พร้อม bearer ของผู้ดูแล — ไม่มีคีย์เพิ่มเติม ไม่มีสิทธิ์แยกต่างหาก",
  fi: "Kuluttaja on kaksi. POPOPX Chat -palvelutili saa kortteja ja korkeintaan kolme valikkokohtaa, ja ohjaa moduulia callbackeilla. Agent kutsuu samoja /api/v1-päätepisteitä HTTP:llä admin-bearerin kanssa — ei uutta tunnusta, ei erillistä lupaa.",
  uk: "Споживачів двоє. Сервіс-акаунт POPOPX Chat отримує картки й до трьох пунктів меню та керує модулем через callback. Agent викликає ті самі ендпоінти /api/v1 по HTTP з admin-bearer — без додаткового ключа й без окремого дозволу.",
  bg: "Потребителите са двама. Акаунтът на услугата POPOPX Chat получава карти и до три меню елемента и работи през callback. Един Agent извиква същите /api/v1 крайни точки през HTTP с admin bearer — без допълнителен ключ и без отделно разрешение.",
  tr: "İki tüketici var. Bir POPOPX Chat hizmet hesabı kartları ve en fazla üç menü öğesini alır, eklentiyi callback üzerinden sürer. Bir Agent aynı /api/v1 uç noktalarını HTTP üzerinden admin bearer ile çağırır — ek kimlik bilgisi yok, ayrı izin yok.",
  hu: "Két fogyasztó van. Egy POPOPX Chat szolgáltatási fiók kártyákat és legfeljebb három menüpontot kap, s callbackekkel hajtja a modult. Egy Agent ugyanazokat a /api/v1 végpontokat hívja HTTP-n az admin bearerrel — nincs különös kulcs, nincs külön jogosultság.",
};

/* --- roadmap block -------------------------------------------------------------- */

const ROADMAP_SHIPPED_NOTE: Localized<string> = {
  en: "The two connectors that do exist are elsewhere: OpenAI-compatible chat completions under ai_agent, and read-only EVM/Solana JSON-RPC under web3_bridge. Both are in the grid above.",
  ru: "Два реальных коннектора лежат в другом месте: совместимые с OpenAI chat completions в ai_agent и JSON-RPC только для чтения EVM/Solana в web3_bridge. Оба — в сетке выше.",
  de: "Die beiden Konnektoren, die es wirklich gibt, stehen woanders: OpenAI-kompatible Chat-Completions unter ai_agent und schreibgeschütztes EVM/Solana-JSON-RPC unter web3_bridge — beide im Raster oben.",
  fr: "Les deux connecteurs qui existent sont ailleurs : les chat completions compatibles OpenAI dans ai_agent, et le JSON-RPC EVM/Solana en lecture seule dans web3_bridge. Les deux sont dans la grille ci-dessus.",
  it: "I due connettori che esistono davvero sono altrove: i chat completion compatibili OpenAI in ai_agent e il JSON-RPC EVM/Solana di sola lettura in web3_bridge. Entrambi sono nella griglia qui sopra.",
  nl: "De twee connectors die er wél zijn, staan elders: OpenAI-compatibele chat completions onder ai_agent en alleen-lezen EVM/Solana JSON-RPC onder web3_bridge. Beide zitten in het raster hierboven.",
  cs: "Dva konektory, které skutečně existují, jsou jinde: chat completions kompatibilní s OpenAI v ai_agent a JSON-RPC EVM/Solana jen pro čtení v web3_bridge. Oba jsou v mřížce výše.",
  "zh-Hans": "真正存在的那两个连接器在别处：ai_agent 里的 OpenAI 兼容 chat completions，和 web3_bridge 里只读的 EVM/Solana JSON-RPC。两个都在上面的网格里。",
  "zh-Hant": "實際存在的兩個連線器在別處：ai_agent 裡的 OpenAI 相容 chat completions，以及 web3_bridge 裡唯讀的 EVM/Solana JSON-RPC。兩個都在上面的網格裡。",
  es: "Los dos conectores que sí existen están en otra parte: los chat completions compatibles con OpenAI en ai_agent y el JSON-RPC de solo lectura de EVM/Solana en web3_bridge. Los dos figuran en la cuadrícula de arriba.",
  pl: "Dwa konektory, które naprawdę istnieją, są gdzie indziej: chat completions zgodne z OpenAI w ai_agent oraz JSON-RPC EVM/Solana tylko do odczytu w web3_bridge. Oba są w siatce powyżej.",
  ja: "実在する2つのコネクタは別の場所にあります。ai_agent の OpenAI 互換 chat completions と、web3_bridge の読み取り専用 EVM/Solana JSON-RPC で、どちらも上のグリッドに載っています。",
  th: "ตัวเชื่อมต่อที่มีอยู่จริงสองตัวอยู่คนละที่: chat completions ที่เข้ากันได้กับ OpenAI ใน ai_agent และ JSON-RPC อ่านอย่างเดียวของ EVM/Solana ใน web3_bridge ทั้งคู่อยู่ในตารางข้างบน",
  fi: "Kaksi olemassa olevaa liitintä ovat muualla: OpenAI-yhteensopivat chat completionit kohdassa ai_agent ja vain-luku-EVM/Solana-JSON-RPC kohdassa web3_bridge. Molemmat ovat yllä olevassa ruudukossa.",
  uk: "Два конектори, які справді існують, розташовані інакше: сумісні з OpenAI chat completions у ai_agent і JSON-RPC EVM/Solana лише для читання у web3_bridge. Обидва — у сітці вище.",
  bg: "Двата конектора, които наистина съществуват, са другаде: chat completions, съвместими с OpenAI, в ai_agent и JSON-RPC за EVM/Solana само за четене в web3_bridge. И двата са в решетката отгоре.",
  tr: "Gerçekten var olan iki bağlayıcı başka yerde: ai_agent altındaki OpenAI uyumlu chat completions ve web3_bridge altındaki salt okunur EVM/Solana JSON-RPC. İkisi de yukarıdaki ızgarada.",
  hu: "A két valóban létező csatlakoztató máshol van: az OpenAI-kompatibilis chat completionek az ai_agentben és a csak olvasható EVM/Solana JSON-RPC a web3_bridge-ben — mindkettő a fenti rácsban.",
};

/* --- footer: route census ------------------------------------------------------- */

const CENSUS_TEXT: Localized<string> = {
  en: "Route census, re-checked 2026-11-25: 91 route registrations across main.py and the five plugins, 82 of them served with the factory defaults, 50 documented core routes. The grep recipe under the sample is the whole method.",
  ru: "Перепись маршрутов, сверена 2026-11-25: 91 регистрация в main.py и пяти плагинах, 82 из них обслуживаются в типовом наборе, 50 документированных core-маршрутов. Рецепт grep под примером — это и есть весь метод.",
  de: " Routenzählung, nachgeprüft am 2026-11-25: 91 Registrierungen über main.py und die fünf Plugins, 82 davon werden mit den Auslieferungsdefaults bedient, 50 dokumentierte Core-Routen. Das grep-Rezept unter dem Beispiel ist die ganze Methode.",
  fr: "Recensement des routes, revérifié le 2026-11-25 : 91 inscriptions entre main.py et les cinq plugins, dont 82 servies avec les valeurs d’usine, et 50 routes cœur documentées. La recette grep sous l’exemple est la méthode entière.",
  it: "Censimento delle route, ricontrollato il 2026-11-25: 91 registrazioni tra main.py e i cinque plugin, di cui 82 servite con i valori predefiniti, e 50 route core documentate. La ricetta grep sotto lʼesempio è lʼintero metodo.",
  nl: "Routentelling, herberekend op 2026-11-25: 91 registraties over main.py en de vijf plug-ins, waarvan er 82 met de fabrieksstandaard worden bediend, en 50 gedocumenteerde core-routes. Het grep-recept onder het voorbeeld is de hele methode.",
  cs: "Sčítání route, znovu zkontrolováno 2026-11-25: 91 registrací v main.py a v pěti modulech, z nichž 82 se servíruje ve výchozím stavu, a 50 zdokumentovaných core route. Recept grep pod ukázkou je celá metoda.",
  "zh-Hans": "路由普查，2026-11-25 复核：main.py 与五个插件共注册 91 条路由，出厂默认状态下实际服务 82 条，其中核心路由文档化 50 条。示例下面的 grep 命令就是全部统计方法。",
  "zh-Hant": "路由普查，2026-11-25 複核：main.py 與五個外掛共註冊 91 條路由，出廠預設狀態下實際服務 82 條，其中核心路由文件化 50 條。範例下方的 grep 指令就是全部統計方法。",
  es: "Censo de rutas, revisado el 2026-11-25: 91 registros entre main.py y los cinco complementos, 82 de ellos servidos con los valores de fábrica y 50 rutas núcleo documentadas. La receta de grep bajo el ejemplo es todo el método.",
  pl: "Spis tras, sprawdzony 2026-11-25: 91 rejestracji w main.py i pięciu wtyczkach, 82 z nich obsługiwanych przy domyślnych ustawieniach, 50 udokumentowanych tras rdzenia. Przepis grep pod przykładem to cała metoda.",
  ja: "ルート調査（2026-11-25 再確認）: main と5プラグインでルート登録は 91 件、出荷時のまま実際に提供されるのは 82 件、文書化されたコアルートは 50 件。サンプル下の grep 式が調査方法のすべてです。",
  th: "การนับเราต์ ทวนเมื่อ 2026-11-25: ลงทะเบียนไว้ 91 รายการใน main.py กับห้าปลั๊กอิน ให้บริการจริง 82 รายการเมื่อใช้ค่าโรงงาน และเราต์แกนที่มีเอกสาร 50 รายการ คำสั่ง grep ใต้ตัวตัวอย่างคือวิธีนับทั้งหมด",
  fi: "Reittien laskenta, tarkistettu 2026-11-25: 91 rekisteröintiä tiedostoissa main.py ja viidessä lisäosassa, joista 82 palvelee oletusarvoilla, ja 50 dokumentoitua ydinreittiä. Grep-ohje esimerkin alla on koko menetelmä.",
  uk: "Перепис маршрутів, перевірено 2026-11-25: 91 реєстрація у main.py та пʼяти плагінах, 82 з них обслуговуються за типових налаштувань, 50 документованих core-маршрутів. Рецепт grep під прикладом — увесь метод.",
  bg: "Преброяване на маршрути, проверено на 2026-11-25: 91 регистрирания в main.py и петте плъгина, 82 от тях се обслужват с фабричните настройки, 50 документирани основни маршрути. Grep рецептата под примера е целият метод.",
  tr: "Rota sayımı, 2026-11-25ʼte yeniden doğrulandı: main.py ve beş eklentide 91 kayıt, bunlardan 82ʼsi fabrika varsayılanlarıyla sunuluyor, 50 çekirdek rota belgelenmiş. Örneğin altındaki grep tarifi metodun tamamı.",
  hu: "Útvonalnévsor, 2026-11-25-én újraellenőrizve: 91 regisztráció a main.py és az öt bővítmény szerint, ebből 82 a gyári alapértelmezésekkel kiszolgálva, 50 dokumentált törzsútvonal. A példa alatti grep recept a teljes módszer.",
};

const FOOTER_TITLE: Localized<string> = {
  en: "How the console knows a plugin is alive",
  ru: "Как консоль понимает, жив ли плагин",
  de: "Woher die Konsole weiß, dass ein Plugin lebt",
  fr: "Comment la console sait qu’un plugin est vivant",
  it: "Come fa la console a sapere che un plugin è attivo",
  nl: "Hoe de console weet dat een plug-in leeft",
  cs: "Jak konzole pozná, že plugin žije",
  "zh-Hans": "后台怎么知道插件现在是死是活",
  "zh-Hant": "後台怎麼知道外掛現在是死是活",
  es: "Cómo sabe la consola que un complemento está vivo",
  pl: "Skąd konsola wie, że wtyczka działa",
  ja: "コンソールはプラグインの生死をどうやって知るのか",
  th: "คอนโซลรู้ได้อย่างไรว่าปลั๊กอินยังทำงานอยู่",
  fi: "Miten konsola tietää, että lisäosa on elossa",
  uk: "Як консоль дізнається, чи плагін живий",
  bg: "Как конзолата знае, че плъгинът е жив",
  tr: "Konsol bir eklentinin hayatta olduğunu nasıl anlıyor",
  hu: "Honnan tudja a konzol, hogy a bővítmény él",
};

const FOOTER_BODY: Localized<string> = {
  en: "The console calls GET /api/v1/plugins with POPOPX_ADMIN_TOKEN and gets all five gate decisions at once; each plugin also answers GET <its own prefix>/status. The three kinds of 'cannot run' stay distinguishable: a switched-off plugin answers 404 and names the exact key to flip in the body, an unfunded one answers 402 with the balance, a down node answers 503 and is retryable. One honest note: web3_bridge ships as 0 and the merchant has to turn it on.",
  ru: "Консоль вызывает GET /api/v1/plugins с POPOPX_ADMIN_TOKEN и за один запрос получает все пять вердиктов; каждый плагин дополнительно отвечает на GET <его собственный префикс>/status. Три вида «нельзя выполнить» остаются различимыми: выключенный плагин отвечает 404 и называет в теле ответа конкретный ключ, который надо переключить; при исчерпанном балансе приходит 402 вместе с остатком; упавший узел отвечает 503, и запрос можно повторить. Честная оговорка: web3_bridge поставляется с нулём, и продавец должен включить его сам.",
  de: "Die Konsole ruft GET /api/v1/plugins mit POPOPX_ADMIN_TOKEN auf und erhält auf einen Schlag alle fünf Tor-Entscheidungen; jedes Plugin beantwortet zusätzlich GET <eigenes Präfix>/status. Die drei Arten von „kann nicht laufen“ bleiben unterscheidbar: ein ausgeschaltetes Plugin antwortet mit 404 und nennt im Body genau den Schlüssel, der zu drehen ist, ein nicht gedecktes antwortet mit 402 samt Restguthaben, ein ausgefallener Knoten antwortet mit 503 und ist wiederholbar. Ein ehrlicher Hinweis: web3_bridge wird als 0 ausgeliefert und der Händler muss es selbst einschalten.",
  fr: "La console appelle GET /api/v1/plugins avec POPOPX_ADMIN_TOKEN et récupère d’un coup les cinq décisions de contrôle ; chaque plugin répond aussi à GET <préfixe du plugin>/status. Les trois cas d’« impossible d’exécuter » restent distinguables : un plugin éteint répond 404 et nomme dans le corps la clé exacte à activer, un compte non approvisionné répond 402 avec le solde, un nœud hors ligne répond 503 et l’appel est rejouable. Note honnête : web3_bridge est livré à 0 et le marchand doit l’activer lui-même.",
  it: "La console chiama GET /api/v1/plugins con POPOPX_ADMIN_TOKEN e ottiene in una volta tutte e cinque le decisioni dei controlli; ogni plugin risponde anche a GET <prefisso del plugin>/status. I tre casi di “impossibile eseguire” restano distinguibili: un plugin spento risponde 404 e indica nel corpo la chiave esatta da attivare, uno senza credito risponde 402 con il saldo, un nodo irraggiungibile risponde 503 ed è riprovabile. Una nota onesta: web3_bridge viene consegnato a 0 e tocca al negoziante attivarlo.",
  nl: "De console roept GET /api/v1/plugins aan met POPOPX_ADMIN_TOKEN en krijgt in één keer alle vijf poortbeslissingen; elke plug-in beantwoordt bovendien GET <eigen voorvoegsel>/status. De drie soorten ‘kan niet draaien’ blijven te onderscheiden: een uitgeschakelde plug-in geeft 404 terug en noemt in de body welke sleutel erom moet, een rekening zonder krediet geeft 402 met het saldo terug, een uitgevallen knoop geeft 503 terug en is opnieuw probeerbaar. Eerlijke noot: web3_bridge wordt als 0 meegeleverd en de verkoper moet hem zelf aanzetten.",
  cs: "Konzole volá GET /api/v1/plugins s POPOPX_ADMIN_TOKEN a najednou dostane všech pět rozhodnutí; každý plugin navíc odpovídá na GET <vlastní předpona>/status. Tři druhy „nelze spustit“ zůstávají rozlišitelné: vypnutý plugin odpoví 404 a v těle pojmenuje přesný klíč, který se má přepnout, nedotovaný odpoví 402 a zbytkem zůstatku, a spadlý uzel odpoví 503, což je opakovatelné. Upřímná poznámka: web3_bridge se dodává jako 0 a obchodník ho musí zapnout sám.",
  "zh-Hans":
    "控制台带 POPOPX_ADMIN_TOKEN 调 GET /api/v1/plugins，一次拿回五张门的判定；每个插件另外回答 GET <自身前缀>/status。三种「不能用」是能被区分的：开关关着答 404 并在 body 里点名要改的那颗键，余额耗尽答 402 并附上余额，节点掉线答 503 且可重试。诚实说一句：web3_bridge 出厂就是 0，需要商家自己把它打开。",
  "zh-Hant":
    "控制台帶 POPOPX_ADMIN_TOKEN 呼叫 GET /api/v1/plugins，一次拿回五道門的判定；每個外掛另外回答 GET <自身前綴>/status。三種「不能用」是可區分的：開關關著答 404 並在 body 裡點名要改的那個鍵，餘額耗盡答 402 並附上餘額，節點離線答 503 且可重試。誠實地說一句：web3_bridge 出廠就是 0，需要商家自己把它打開。",
  es: "La consola llama a GET /api/v1/plugins con POPOPX_ADMIN_TOKEN y recibe de una vez las cinco decisiones de los controles; cada complemento también responde a GET <prefijo propio>/status. Los tres modos de «no puede ejecutarse» siguen siendo distinguibles: un complemento apagado responde 404 y nombra en el cuerpo la clave exacta que hay que cambiar, uno sin fondo responde 402 con el saldo, y un nodo caído responde 503 y se puede reintentar. Nota honesta: web3_bridge se entrega en 0 y el comercio debe activarlo él mismo.",
  pl: "Konsola wywołuje GET /api/v1/plugins z POPOPX_ADMIN_TOKEN i za jednym razem dostaje wszystkie pięć decyzji bramek; każda wtyczka odpowiada też na GET <własny prefiks>/status. Trzy rodzaje „nie można uruchomić” pozostają rozróżnialne: wyłączona wtyczka zwraca 404 i wskazuje w treści dokładnie ten klucz, brak środków daje 402 razem z saldem, a padnięty węzeł zwraca 503 i żądanie można ponowić. Uczciwa uwaga: web3_bridge jest dostarczany jako 0 i sprzedawca musi sam go włączyć.",
  ja: "コンソールは POPOPX_ADMIN_TOKEN を付けて GET /api/v1/plugins を呼び、5つのゲートの判定を一括で受け取ります。各プラグイン自身も GET <それぞれのプレフィックス>/status に応答します。「動かない」には3つの種類があり、切り分けられます。スイッチが切れていれば 404 を返し、ボディの中で書き換えるべきキーを名指しします。残高を使い果たすと 402 に残高を添えて返し、ノードが落ちていると 503 を返し、再試行ができます。正直な注記を一つ。web3_bridge は出荷時の値が 0 で、商家自身がオンにする必要があります。",
  th: "คอนโซลเรียก GET /api/v1/plugins พร้อม POPOPX_ADMIN_TOKEN แล้วได้รับผลการตัดสินของประตูทั้งห้ามาในการเรียกครั้งเดียว; แต่ละปลั๊กอินยังตอบ GET <คำนำหน้าของตัวเอง>/status ด้วย เงื่อนไข “ใช้ไม่ได้” ทั้งสามชนิดยังแยกจากกันได้: ปลั๊กอินที่ถูกปิดจะตอบ 404 พร้อมระบุในบอดี้ว่าต้องกลับคีย์ใด, บัญชีที่ใช้เครดิตหมดตอบ 402 พร้อมยอดคงเหลือ, โหนดที่ล่มตอบ 503 และลองใหม่ได้ ข้อสังเกตแบบตรงไปตรงมา: web3_bridge ถูกส่งออกมาด้วยค่า 0 ผู้ขายต้องเปิดมันเอง",
  fi: "Konsola kutsuu osoitetta GET /api/v1/plugins POPOPX_ADMIN_TOKENilla ja saa kerralla kaikki viisi portin päätöstä; jokainen lisäosa vastaa myös GET <oma etuliite>/status -kutsuun. Kolme ”ei voi ajaa” -tilannetta pysyvät erottuvina: pois kytketty lisäosa palauttaa 404:n ja nimeää vastausrungossa juuri sen avaimen, joka on käännettävä; loppuun kulunut lisäosa palauttaa 402:n ja jäljellä olevan saldon; kaatunut solmu palauttaa 503:n, ja kutsun voi yrittää uudelleen. Rehellinen huomio: web3_bridge toimitetaan arvolla 0, ja kauppiaan on käännettävä se itse päälle.",
  uk: "Консоль викликає GET /api/v1/plugins із POPOPX_ADMIN_TOKEN і за один виклик отримує всі п’ять рішень воріт; кожен плагін також відповідає на GET <власний префікс>/status. Три види «не може працювати» розрізнюються: вимкнений плагін відповідає 404 і називає в тілі саме той ключ, який треба перевернути, за відсутності коштів приходить 402 разом із залишком, а відвалений вузол відповідає 503, і запит можна повторити. Справедлива примітка: web3_bridge постачається з 0, і продавець має увімкнути його сам.",
  bg: "Конзолата извиква GET /api/v1/plugins с POPOPX_ADMIN_TOKEN и наведнъж получава всичките пет решения на контролите; всеки плъгин отговаря и на GET <собствен префикс>/status. Трите вида „не може да работи“ си остават различими: изключен плъгин отговаря с 404 и сочи в тялото точния ключ, изчерпаният баланс отговаря с 402 заедно с остатъка, а паднал възел отговаря с 503 и заявката може да се повтори. Честна бележка: web3_bridge се доставя с 0 и търговецът трябва да го включи сам.",
  tr: "Konsol, POPOPX_ADMIN_TOKEN ile GET /api/v1/plugins çağrısını yapar ve beş kontrolün kararını tek seferde alır; her eklenti ayrıca GET <kendi ön eki>/status sorusuna da yanıt verir. “Çalışmıyor” durumlarının üç türü birbirinden ayırt edilebilir kalır: kapatılmış bir eklenti 404 döner ve gövdede çevrilecek tam anahtarı söyler, bakiyesi biten 402 ile birlikte kalan bakiyeyi döner, düşmüş bir düğüm 503 döner ve yeniden denenebilir. Dürüst bir not: web3_bridge fabrikadan 0 olarak çıkar ve tüccarın kendisi açması gerekir.",
  hu: "A konzol POPOPX_ADMIN_TOKEN-nal hívja a GET /api/v1/plugins végpontot, és egyetlen hívással megkapja mind az öt kapu döntését; minden bővítmény a saját GET <saját előtag>/status kérésre is válaszol. A „nem fut el” három fajtája megkülönböztethető marad: a kikapcsolt bővítmény 404-gyel válaszol és a törzsben megnevezi a pontos kulcsot, a credit nélkül lévő 402-vel és az egyenleggel válaszol, a lezuhant csomópont 503-mal, az újrapróbálás pedig adott. Őszinte megjegyzés: a web3_bridge 0 értékkel érkezik, és a kereskedőnek magának kell bekapcsolnia.",
};

const FOOTER_SAMPLE_CAPTION: Localized<string> = {
  en: "The real field names of the web3_bridge entry in a GET /api/v1/plugins body (example values).",
  ru: "Реальные имена полей записи web3_bridge в теле GET /api/v1/plugins (значения примера).",
  de: "Die echten Feldnamen des Eintrags web3_bridge in einem GET /api/v1/plugins-Body (Beispielwerte).",
  fr: "Les vrais noms de champs de l’entrée web3_bridge dans un corps de réponse GET /api/v1/plugins (valeurs d’exemple).",
  it: "I nomi reali dei campi della voce web3_bridge in un corpo GET /api/v1/plugins (valori di esempio).",
  nl: "De echte veldnamen van het web3_bridge-item in een GET /api/v1/plugins-body (voorbeeldwaarden).",
  cs: "Skutečné názvy polí položky web3_bridge v těle odpovědi GET /api/v1/plugins (ukázkové hodnoty).",
  "zh-Hans": "GET /api/v1/plugins 响应体中 web3_bridge 那一项的真实字段名（示例值）。",
  "zh-Hant": "GET /api/v1/plugins 回應體中 web3_bridge 那一項的真實欄位名（範例值）。",
  es: "Los nombres reales de los campos de la entrada web3_bridge en un cuerpo de GET /api/v1/plugins (valores de ejemplo).",
  pl: "Prawdziwe nazwy pól wpisu web3_bridge w treści odpowiedzi GET /api/v1/plugins (wartości przykładowe).",
  ja: "GET /api/v1/plugins のレスポンスボディにある web3_bridge エントリの実際のフィールド名（値はサンプル）。",
  th: "ชื่อฟิลด์จริงของรายการ web3_bridge ในบอดี้คำตอบของ GET /api/v1/plugins (ค่าตัวอย่าง)",
  fi: "GET /api/v1/plugins -vastausrungossa olevan web3_bridge-merkinnän oikeat kenttänimet (esimerkkiarvot).",
  uk: "Справжні назви полів запису web3_bridge в тілі відповіді GET /api/v1/plugins (значення-приклади).",
  bg: "Истинските имена на полите на записа web3_bridge в тялото на GET /api/v1/plugins (примерни стойности).",
  tr: "Bir GET /api/v1/plugins gövdesindeki web3_bridge kaydının gerçek alan adları (örnek değerler).",
  hu: "A web3_bridge bejegyzés valódi mezőnevei egy GET /api/v1/plugins törzsben (példaértékek).",
};

/** Field names and the `detail` sentence come from `PluginGate.status` and
 *  `MountedPlugin.as_dict`; the ordering is what `json.dumps` produces. */
const PLUGIN_STATUS_SAMPLE =
  '{"ok":true,"plugins":[{"plugin_id":"web3_bridge","url_prefix":"/api/v1/plugins/web3","meter":"web3_event","callback_kinds":["system"],"available":false,"error":"disabled","gate":{"ok":false,"plugin":"web3_bridge","reason":"disabled","detail":"plugin web3_bridge is switched off (set POPOPX_PLUGIN_WEB3_BRIDGE=1)"}}]}';

const PLUGINS: readonly PluginModel[] = [
  {
    code: "AI Agent",
    file: "ai_agent_plugin.py",
    category: "agent",
    status: "default-on",
    accent: "brand",
    name: {
      en: "Privacy-first AI support agent",
      ru: "Приватный AI-ассистент поддержки",
      de: "Datenschutzfreundlicher KI-Support-Assistent",
      fr: "Agent IA d’assistance, confidentialité d’abord",
      it: "Assistente IA di supporto privacy-first",
      nl: "Privacy-first AI-supportagent",
      cs: "AI asistent podpory s ochranou soukromí",
      "zh-Hans": "隐私 AI 智能客服",
      "zh-Hant": "隱私 AI 智慧客服",
      es: "Agente de asistencia IA con la privacidad por delante",
      pl: "Prywatnościowy asystent AI obsługi klienta",
      ja: "プライバシー優先の AI カスタマーサポート",
      th: "ผู้ช่วย AI ฝ่ายสนับสนุนที่เน้นความเป็นส่วนตัว",
      fi: "Tietosuoja edellä oleva tukiassistentti tekoälyllä",
      uk: "Приватний AI-асистент підтримки",
      bg: "AI асистент за поддръжка с приоритет на поверителността",
      tr: "Gizlilik odaklı yapay zekâ destek asistanı",
      hu: "Adatvédelmet előtérbe helyező MI ügyfélszolgálati asszisztens",
    },
    hook: {
      en: "The model key never leaves your own server, and the default system prompt already says not to ask for any personal information.",
      ru: "Ключ модели никогда не покидает ваш собственный сервер, а в системном промпте по умолчанию уже написано, что запрашивать персональные данные нельзя.",
      de: "Der Modellschlüssel verlässt deinen eigenen Server nie, und der Standard-Systemprompt sagt bereits, dass nach keinen persönlichen Daten gefragt werden darf.",
      fr: "La clé du modèle ne quitte jamais votre propre serveur et le prompt système par défaut indique déjà de ne demander aucune information personnelle.",
      it: "La chiave del modello non lascia mai il tuo server e il prompt di sistema predefinito dice già di non chiedere alcuna informazione personale.",
      nl: "De modelsleutel verlaat nooit je eigen server en de standaard systeemprompt zegt al dat er om geen persoonlijke informatie gevraagd mag worden.",
      cs: "Klíč modelu nikdy neopustí váš vlastní server a výchozí systémový prompt už obsahuje pokyn nevyžadovat žádné osobní údaje.",
      "zh-Hans": "大模型 Key 只留在商家自己的服务器上；默认系统提示词就写着「不索要任何个人身份信息」。",
      "zh-Hant": "大模型金鑰只留在商家自己的伺服器上；預設系統提示詞就寫著「不索要任何個人身分資訊」。",
      es: "La clave del modelo nunca sale de tu propio servidor y el prompt de sistema predeterminado ya indica que no se pida ninguna información personal.",
      pl: "Klucz modelu nigdy nie opuszcza twojego własnego serwera, a domyślny prompt systemowy już zawiera nakaz nieżądania żadnych danych osobowych.",
      ja: "モデルのキーは商家自身のサーバーから外へ出ず、既定のシステムプロンプトには個人情報を一切要求しないと書かれています。",
      th: "คีย์ของโมเดลจะอยู่ในเซิร์ฟเวอร์ของผู้ขายเองเท่านั้น และ system prompt ค่าเริ่มต้นก็เขียนไว้แล้วว่าห้ามขอข้อมูลระบุตัวบุคคล",
      fi: "Mallin avain ei koskaan poistu myyjän omalta palvelimelta, ja oletusjärjestelmäkehotus sanoo jo, ettei henkilötietoja saa kysyä.",
      uk: "Ключ моделі ніколи не залишає власного сервера продавця, а в типовому системному промпті вже написано не вимагати жодних персональних даних.",
      bg: "Ключът на модела никога не напуска собствения сървър на търговеца, а подразбиращият се системен подканващ текст вече гласи да не се изискват лични данни.",
      tr: "Model anahtarı asla satıcının kendi sunucusundan dışarı çıkmaz; varsayılan sistem istemi zaten hiçbir kişisel bilgi istenmemesini söylüyor.",
      hu: "A modell kulcsa soha nem hagyja el a kereskedő saját szerverét, és az alapértelmezett rendszerprompt már kimondja, hogy személyes adatot tilos kérni.",
    },
    facts: [
      {
        k: {
          en: "Identity",
          ru: "Идентификация",
          de: "Identität",
          fr: "Identité",
          it: "Identità",
          nl: "Identiteit",
          cs: "Identita",
          "zh-Hans": "身份",
          "zh-Hant": "身分",
          es: "Identidad",
          pl: "Tożsamość",
          ja: "身分",
          th: "การระบุตัวตน",
          fi: "Identiteetti",
          uk: "Ідентичність",
          bg: "Самоличност",
          tr: "Kimlik",
          hu: "Személyazonosság",
        },
        v: {
          en: "Exchanges are rows in ai_messages keyed by the pairwise uid: no phone number, no email, no real-name profile.",
          ru: "Переписки лежат строками в таблице ai_messages под pairwise uid: без номера телефона, без почты и без профиля по реальному имени.",
          de: "Gespräche stehen als Zeilen in der Tabelle ai_messages, keyed über die pairwise uid: ohne Telefonnummer, ohne E-Mail, ohne Realname-Profil.",
          fr: "Les échanges sont des lignes de la table ai_messages indexées par l’uid pairwise : pas de numéro de téléphone, pas d’e-mail, pas de profil au vrai nom.",
          it: "Le conversazioni sono righe della tabella ai_messages indicizzate per uid pairwise: niente numero di telefono, niente email, niente profilo con nome reale.",
          nl: "Wissels staan als rijen in de tabel ai_messages, gesleuteld op de pairwise uid: geen telefoonnummer, geen e-mail, geen profiel op echte naam.",
          cs: "Konverzace jsou řádky v tabulce ai_messages klíčené pairwise uid: bez telefonního čísla, bez e-mailu, bez profilu se skutečným jménem.",
          "zh-Hans": "对话按 pairwise_uid 落在 ai_messages 表里，没有手机号、没有邮箱，也不建实名画像。",
          "zh-Hant": "對話依 pairwise_uid 落在 ai_messages 表裡，沒有手機號、沒有信箱，也不建實名輪廓。",
          es: "Los intercambios son filas en la tabla ai_messages indexadas por el uid del par: sin teléfono, sin correo, sin perfil con nombre real.",
          pl: "Rozmowy to wiersze w tabeli ai_messages kluczowane parami pairwise uid: bez numeru telefonu, bez e-maila, bez profilu na prawdziwe nazwisko.",
          ja: "やり取りは ai_messages テーブルに pairwise_uid をキーとした行として残り、電話番号もメールアドレスも、実名プロフィールも作りません。",
          th: "แต่ละบทสนทนาเป็นแถวในตาราง ai_messages ที่ใช้ pairwise_uid เป็นคีย์ ไม่มีหมายเลขโทรศัพท์ ไม่มีอีเมล และไม่สร้างโปรไฟล์จากชื่อจริง",
          fi: "Keskustelut ovat rivejä taulussa ai_messages, avaimena pairwise_uid: ei puhelinnumeroa, ei sähköpostia, ei toiminimiprofiilia.",
          uk: "Розмови зберігаються рядками в таблиці ai_messages під pairwise uid: без номера телефону, без пошти й без профілю за справжнім ім’ям.",
          bg: "Разговорите са редове в таблицата ai_messages с ключ на двойката uid: без телефонен номер, без имейл, без профил с истинско име.",
          tr: "Yazışmalar ai_messages tablosunda pairwise uid ile anahtarlanmış satırlardır: telefon numarası yok, e-posta yok, gerçek adlı profil de yok.",
          hu: "A beszélgetések az ai_messages tábla sorai, pairwise uid kulccsal: telefonszám nélkül, e-mail cím nélkül, valós nevű profil nélkül.",
        },
      },
      {
        k: {
          en: "Endpoint",
          ru: "Подключение",
          de: "Anbindung",
          fr: "Raccordement",
          it: "Integrazione",
          nl: "Aansluiting",
          cs: "Připojení",
          "zh-Hans": "接入",
          "zh-Hant": "接取",
          es: "Conexión",
          pl: "Połączenie",
          ja: "接続",
          th: "การเชื่อมต่อ",
          fi: "Liittäminen",
          uk: "Підключення",
          bg: "Свързване",
          tr: "Bağlantı",
          hu: "Csatlakozás",
        },
        v: {
          en: "POPOPX_AI_BASE_URL defaults to https://api.openai.com/v1 and POPOPX_AI_MODEL to gpt-4o-mini; a local Ollama at http://127.0.0.1:11434/v1 works too.",
          ru: "POPOPX_AI_BASE_URL по умолчанию равен https://api.openai.com/v1, POPOPX_AI_MODEL — gpt-4o-mini; можно указать и локальный Ollama (http://127.0.0.1:11434/v1).",
          de: "POPOPX_AI_BASE_URL steht standardmäßig auf https://api.openai.com/v1 und POPOPX_AI_MODEL auf gpt-4o-mini; ein lokales Ollama (http://127.0.0.1:11434/v1) geht ebenfalls.",
          fr: "POPOPX_AI_BASE_URL vaut https://api.openai.com/v1 par défaut et POPOPX_AI_MODEL vaut gpt-4o-mini ; un Ollama local (http://127.0.0.1:11434/v1) fonctionne aussi.",
          it: "POPOPX_AI_BASE_URL è impostato su https://api.openai.com/v1 per impostazione predefinita e POPOPX_AI_MODEL su gpt-4o-mini; funziona anche un Ollama locale (http://127.0.0.1:11434/v1).",
          nl: "POPOPX_AI_BASE_URL staat standaard op https://api.openai.com/v1 en POPOPX_AI_MODEL op gpt-4o-mini; een lokale Ollama (http://127.0.0.1:11434/v1) kan ook.",
          cs: "POPOPX_AI_BASE_URL je výchozí https://api.openai.com/v1 a POPOPX_AI_MODEL je gpt-4o-mini; funguje i lokální Ollama (http://127.0.0.1:11434/v1).",
          "zh-Hans": "POPOPX_AI_BASE_URL 默认 https://api.openai.com/v1，POPOPX_AI_MODEL 默认 gpt-4o-mini，也可指向本机 Ollama（http://127.0.0.1:11434/v1）。",
          "zh-Hant": "POPOPX_AI_BASE_URL 預設 https://api.openai.com/v1，POPOPX_AI_MODEL 預設 gpt-4o-mini，也可指向本機 Ollama（http://127.0.0.1:11434/v1）。",
          es: "POPOPX_AI_BASE_URL vale https://api.openai.com/v1 de forma predeterminada y POPOPX_AI_MODEL vale gpt-4o-mini; un Ollama local (http://127.0.0.1:11434/v1) también sirve.",
          pl: "POPOPX_AI_BASE_URL ma domyślnie wartość https://api.openai.com/v1, a POPOPX_AI_MODEL wartość gpt-4o-mini; lokalne Ollama (http://127.0.0.1:11434/v1) też działa.",
          ja: "POPOPX_AI_BASE_URL の既定値は https://api.openai.com/v1、POPOPX_AI_MODEL の既定値は gpt-4o-mini です。自ホストの Ollama（http://127.0.0.1:11434/v1）も指定できます。",
          th: "ค่าเริ่มต้นของ POPOPX_AI_BASE_URL คือ https://api.openai.com/v1 และ POPOPX_AI_MODEL คือ gpt-4o-mini จะชี้ไปที่ Ollama บนเครื่องตัวเอง (http://127.0.0.1:11434/v1) ก็ได้",
          fi: "POPOPX_AI_BASE_URL on oletuksena https://api.openai.com/v1 ja POPOPX_AI_MODEL oletuksena gpt-4o-mini; paikallinen Ollama (http://127.0.0.1:11434/v1) käy myös.",
          uk: "POPOPX_AI_BASE_URL типово дорівнює https://api.openai.com/v1, а POPOPX_AI_MODEL — gpt-4o-mini; локальне Ollama (http://127.0.0.1:11434/v1) теж працює.",
          bg: "POPOPX_AI_BASE_URL е по подразбиране https://api.openai.com/v1, а POPOPX_AI_MODEL е gpt-4o-mini; работи и локално Ollama (http://127.0.0.1:11434/v1).",
          tr: "POPOPX_AI_BASE_URL varsayılan olarak https://api.openai.com/v1, POPOPX_AI_MODEL varsayılan olarak gpt-4o-mini; makinedeki bir Ollama (http://127.0.0.1:11434/v1) da olur.",
          hu: "A POPOPX_AI_BASE_URL alapértelmezése https://api.openai.com/v1, a POPOPX_AI_MODEL-é pedig gpt-4o-mini; helyi Ollama (http://127.0.0.1:11434/v1) is megfelel.",
        },
      },
      {
        k: {
          en: "Limits and price",
          ru: "Лимиты и цена",
          de: "Limits und Preis",
          fr: "Limites et tarif",
          it: "Limiti e prezzo",
          nl: "Limieten en prijs",
          cs: "Limity a cena",
          "zh-Hans": "限速与价",
          "zh-Hant": "限速與價格",
          es: "Límites y precio",
          pl: "Limity i cena",
          ja: "レート制限と価格",
          th: "จำกัดอัตราและราคา",
          fi: "Rajoitukset ja hinta",
          uk: "Ліміти та ціна",
          bg: "Лимити и цена",
          tr: "Sınırlar ve fiyat",
          hu: "Korlátok és ár",
        },
        v: {
          en: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 per follower inside POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300, priced at POPOPX_CP_PER_AI_MESSAGE=5, and a turn that produced no answer is refunded in full.",
          ru: "Не более POPOPX_AI_RATE_LIMIT_MESSAGES=20 сообщений на подписчика в окне POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 секунд; сообщение стоит POPOPX_CP_PER_AI_MESSAGE=5, а на ход без ответа кредиты возвращаются полностью.",
          de: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 Nachrichten pro Follower innerhalb des Fensters POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 Sekunden; jeder Durchlauf kostet POPOPX_CP_PER_AI_MESSAGE=5, und ein Turn ohne Antwort wird vollständig erstattet.",
          fr: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 messages par follower dans la fenêtre POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 secondes ; chaque message est facturé POPOPX_CP_PER_AI_MESSAGE=5 et un tour sans réponse est intégralement remboursé.",
          it: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 messaggi per follower nella finestra POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 secondi; ogni messaggio costa POPOPX_CP_PER_AI_MESSAGE=5 e un turno senza risposta viene rimborsato per intero.",
          nl: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 berichten per volger binnen het venster POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 seconden; elk bericht kost POPOPX_CP_PER_AI_MESSAGE=5 en een beurt zonder antwoord wordt volledig teruggestort.",
          cs: "Na followera jde maximálně POPOPX_AI_RATE_LIMIT_MESSAGES=20 zpráv v okně POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 sekund; každá zpráva se měří POPOPX_CP_PER_AI_MESSAGE=5 a kolo bez odpovědi se vrátí v plné výši.",
          "zh-Hans": "每位粉丝在 POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS（默认 300 秒）内最多 POPOPX_AI_RATE_LIMIT_MESSAGES（默认 20）条；每条按 POPOPX_CP_PER_AI_MESSAGE=5 计量，模型没答上来就原额退回。",
          "zh-Hant": "每位粉絲在 POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS（預設 300 秒）內最多 POPOPX_AI_RATE_LIMIT_MESSAGES（預設 20）則；每則依 POPOPX_CP_PER_AI_MESSAGE=5 計量，模型未答上即原額退回。",
          es: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 mensajes por seguidor dentro de la ventana POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 segundos; cada mensaje se factura con POPOPX_CP_PER_AI_MESSAGE=5 y un turno sin respuesta se reembolsa íntegro.",
          pl: "POPOPX_AI_RATE_LIMIT_MESSAGES=20 wiadomości na obserwującego w oknie POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 sekund; każda wiadomość rozliczana jest stawką POPOPX_CP_PER_AI_MESSAGE=5, a tura bez odpowiedzi jest w całości zwracana.",
          ja: "フォロワー 1 人あたり POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 秒の窓内で POPOPX_AI_RATE_LIMIT_MESSAGES=20 件まで。1 件は POPOPX_CP_PER_AI_MESSAGE=5 で計量され、答えられなかった回は全額返還されます。",
          th: "ต่อผู้ติดตาม 1 คน ในหน้าต่าง POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 ส่งได้สูงสุด POPOPX_AI_RATE_LIMIT_MESSAGES=20 ข้อความ แต่ละข้อความนับเป็น POPOPX_CP_PER_AI_MESSAGE=5 และรอบที่โมเดลตอบไม่ได้จะได้เครดิตคืนเต็มจำนวน",
          fi: "Yhtä seuraajaa kohden enintään POPOPX_AI_RATE_LIMIT_MESSAGES=20 viestiä ikkunassa POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 sekuntia; jokainen viesti mitoitetaan POPOPX_CP_PER_AI_MESSAGE=5 ja vastaukseton kierros palautetaan kokonaan.",
          uk: "На одного підписника не більше POPOPX_AI_RATE_LIMIT_MESSAGES=20 повідомлень у вікні POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 секунд; кожне повідомлення коштує POPOPX_CP_PER_AI_MESSAGE=5, а хід без відповіді повертається повністю.",
          bg: "За един последовател най-много POPOPX_AI_RATE_LIMIT_MESSAGES=20 съобщения в прозореца POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 секунди; всяко съобщение се отчита с POPOPX_CP_PER_AI_MESSAGE=5, а ход без отговор се възстановява напълно.",
          tr: "Bir takipçi başına POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 saniyelik pencerede en fazla POPOPX_AI_RATE_LIMIT_MESSAGES=20 mesaj; her mesaj POPOPX_CP_PER_AI_MESSAGE=5 olarak ölçülür ve yanıt çıkmayan tur tamamen geri iade edilir.",
          hu: "Követőnként legfeljebb POPOPX_AI_RATE_LIMIT_MESSAGES=20 üzenet a POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 másodperces ablakban; üzenetenként POPOPX_CP_PER_AI_MESSAGE=5 a díj, és a válasz nélkül maradt kör teljes egészében visszajár.",
        },
      },
    ],
    keys: [
      "POPOPX_PLUGIN_AI_AGENT=1",
      "POPOPX_AI_BASE_URL",
      "POPOPX_AI_MODEL",
      "POPOPX_AI_SYSTEM_PROMPT",
      "POPOPX_AI_RATE_LIMIT_MESSAGES",
      "POPOPX_CP_PER_AI_MESSAGE",
    ],
    route: "POST /api/v1/plugins/ai/chat",
  },
  {
    code: "AlertOps",
    file: "alert_ops_plugin.py",
    category: "ops",
    status: "default-on",
    accent: "brand",
    name: {
      en: "DevOps and on-chain security alerts",
      ru: "Оповещения DevOps и ончейн-безопасности",
      de: "DevOps- und On-Chain-Sicherheitswarnungen",
      fr: "Alertes DevOps et sécurité on-chain",
      it: "Avvisi DevOps e di sicurezza on-chain",
      nl: "DevOps- en on-chain-beveiligingsmeldingen",
      cs: "Výstrahy DevOps a on-chain bezpečnosti",
      "zh-Hans": "DevOps 运维与链上安全告警",
      "zh-Hant": "DevOps 維運與鏈上安全告警",
      es: "Alertas de DevOps y seguridad on-chain",
      pl: "Alerty DevOps i bezpieczeństwa on-chain",
      ja: "DevOps とオンチェーンのセキュリティ告警",
      th: "การแจ้งเตือน DevOps และความปลอดภัยออนเชน",
      fi: "DevOps- ja ketjunsisäiset tietoturvahälytykset",
      uk: "Сповіщення DevOps та ончейн-безпеки",
      bg: "DevOps известия и ончейн сигнализации за сигурност",
      tr: "DevOps ve zincir üstü güvenlik uyarıları",
      hu: "DevOps és on-chain biztonsági riasztások",
    },
    hook: {
      en: "One webhook in from Grafana or Alertmanager, one security card on the phone.",
      ru: "Один webhook из Grafana или Alertmanager — и одна security-карточка на телефоне.",
      de: "Ein Webhook von Grafana oder Alertmanager rein, eine security-Karte auf dem Handy raus.",
      fr: "Un webhook entrant de Grafana ou Alertmanager, une carte security sur le téléphone.",
      it: "Un webhook in ingresso da Grafana o Alertmanager, una card security sul telefono.",
      nl: "Eén webhook binnen vanuit Grafana of Alertmanager, één security-kaart op de telefoon.",
      cs: "Jeden webhook z Grafany nebo Alertmanageru, jedna security karta v telefonu.",
      "zh-Hans": "一条 Webhook 进来自 Grafana 或 Alertmanager，手机上落下一张 security 卡。",
      "zh-Hant": "一條 Webhook 進來自 Grafana 或 Alertmanager，手機上落下一張 security 卡。",
      es: "Un webhook que entra de Grafana o Alertmanager, una tarjeta security en el móvil.",
      pl: "Jeden webhook z Grafany lub Alertmanagera, jedna karta security w telefonie.",
      ja: "Grafana か Alertmanager からの Webhook が1件入り、スマートフォンには security カードが1枚届きます。",
      th: "Webhook หนึ่งเส้นจาก Grafana หรือ Alertmanager เข้ามา แล้วการ์ด security หนึ่งใบบนมือถือก็เด้งขึ้น",
      fi: "Yksi webhook Grafanasta tai Alertmanagerista, yksi security-kortti puhelimeen.",
      uk: "Один webhook із Grafana або Alertmanager — і одна security-картка на телефоні.",
      bg: "Един webhook от Grafana или Alertmanager и една security картичка на телефона.",
      tr: "Grafana veya Alertmanager’dan gelen tek bir webhook, telefonda tek bir security kartı.",
      hu: "Egy bejövő webhook Grafanából vagy Alertmanagerből, egy security kártya a telefonon.",
    },
    facts: [
      {
        k: {
          en: "Ingress",
          ru: "Вход",
          de: "Eingang",
          fr: "Point d’entrée",
          it: "Ingresso",
          nl: "Ingang",
          cs: "Vstup",
          "zh-Hans": "入口",
          "zh-Hant": "入口",
          es: "Entrada",
          pl: "Wejście",
          ja: "受付口",
          th: "จุดรับเข้า",
          fi: "Sisääntulo",
          uk: "Вхід",
          bg: "Вход",
          tr: "Giriş",
          hu: "Bemenet",
        },
        v: {
          en: "POST /api/v1/plugins/alerts/webhook is authenticated by POPOPX_ALERT_WEBHOOK_TOKEN (empty rejects every call with 401); POPOPX_ALERT_MIN_SEVERITY defaults to warning and anything below it is stored rather than pushed.",
          ru: "POST /api/v1/plugins/alerts/webhook проверяется токеном POPOPX_ALERT_WEBHOOK_TOKEN (пустой отбивает каждый вызов кодом 401); POPOPX_ALERT_MIN_SEVERITY по умолчанию равен warning, а всё ниже порога только сохраняется, но не рассылается.",
          de: "POST /api/v1/plugins/alerts/webhook wird mit POPOPX_ALERT_WEBHOOK_TOKEN geprüft (leer beantwortet jeden Aufruf mit 401); POPOPX_ALERT_MIN_SEVERITY steht standardmäßig auf warning und alles darunter wird nur gespeichert, nicht gepusht.",
          fr: "POST /api/v1/plugins/alerts/webhook est authentifié par POPOPX_ALERT_WEBHOOK_TOKEN (vide rejette chaque appel par 401) ; POPOPX_ALERT_MIN_SEVERITY vaut warning par défaut et tout ce qui est sous le seuil est stocké sans être poussé.",
          it: "POST /api/v1/plugins/alerts/webhook è autenticato da POPOPX_ALERT_WEBHOOK_TOKEN (se vuoto rifiuta ogni chiamata con 401); POPOPX_ALERT_MIN_SEVERITY è warning per impostazione predefinita e tutto ciò che sta sotto viene archiviato invece di essere inviato.",
          nl: "POST /api/v1/plugins/alerts/webhook wordt gecontroleerd met POPOPX_ALERT_WEBHOOK_TOKEN (leeg wijst elke aanroep af met 401); POPOPX_ALERT_MIN_SEVERITY staat standaard op warning en alles daaronder wordt alleen opgeslagen, niet gepusht.",
          cs: "POST /api/v1/plugins/alerts/webhook se ověřuje pomocí POPOPX_ALERT_WEBHOOK_TOKEN (prázdný odmítne každé volání kódem 401); POPOPX_ALERT_MIN_SEVERITY je výchozí warning a vše pod prahem se jen uloží, neposílá.",
          "zh-Hans": "POST /api/v1/plugins/alerts/webhook 用 POPOPX_ALERT_WEBHOOK_TOKEN 校验，令牌留空时每一次投递都答 401；POPOPX_ALERT_MIN_SEVERITY 默认 warning，低于门槛的事件只入库、不发卡。",
          "zh-Hant": "POST /api/v1/plugins/alerts/webhook 以 POPOPX_ALERT_WEBHOOK_TOKEN 驗證，令牌留空時每次投遞都答 401；POPOPX_ALERT_MIN_SEVERITY 預設 warning，低於門檻的事件只入庫、不發卡。",
          es: "POST /api/v1/plugins/alerts/webhook se autentica con POPOPX_ALERT_WEBHOOK_TOKEN (vacío rechaza cada llamada con 401); POPOPX_ALERT_MIN_SEVERITY vale warning de forma predeterminada y todo lo que está por debajo se almacena en lugar de enviarse.",
          pl: "POST /api/v1/plugins/alerts/webhook jest uwierzytelniany tokenem POPOPX_ALERT_WEBHOOK_TOKEN (pusty odrzuca każde wywołanie kodem 401); POPOPX_ALERT_MIN_SEVERITY ma domyślnie wartość warning, a wszystko poniżej progu jest zapisywane zamiast wysyłane.",
          ja: "POST /api/v1/plugins/alerts/webhook は POPOPX_ALERT_WEBHOOK_TOKEN で認証されます。トークンを空にするとすべての配信が 401 で拒否されます。POPOPX_ALERT_MIN_SEVERITY の既定値は warning で、閾値未満のイベントは保存のみ行われ、カードは届きません。",
          th: "POST /api/v1/plugins/alerts/webhook ตรวจสอบด้วย POPOPX_ALERT_WEBHOOK_TOKEN (ถ้าเว้นว่างจะตอบ 401 กับการส่งทุกครั้ง); POPOPX_ALERT_MIN_SEVERITY ค่าเริ่มต้นคือ warning และเหตุการณ์ที่ต่ำกว่าเกณฑ์จะแค่ถูกเก็บ ไม่ถูกส่งเป็นการ์ด",
          fi: "POST /api/v1/plugins/alerts/webhook todennetaan POPOPX_ALERT_WEBHOOK_TOKENilla (tyhjö hylkää jokaisen kutsun 401:llä); POPOPX_ALERT_MIN_SEVERITY on oletuksena warning, ja sitä matalampi tallennetaan mutta ei lähetetä.",
          uk: "POST /api/v1/plugins/alerts/webhook автентифікується токеном POPOPX_ALERT_WEBHOOK_TOKEN (порожній відхиляє кожен виклик із 401); POPOPX_ALERT_MIN_SEVERITY типово дорівнює warning, а все нижче порогу лише зберігається, без розсилки.",
          bg: "POST /api/v1/plugins/alerts/webhook се удостоверява с POPOPX_ALERT_WEBHOOK_TOKEN (празен отказва всяка заявка с 401); POPOPX_ALERT_MIN_SEVERITY е по подразбиране warning и всичко под прага се съхранява, вместо да се изпраща.",
          tr: "POST /api/v1/plugins/alerts/webhook, POPOPX_ALERT_WEBHOOK_TOKEN ile doğrulanır (boş bırakılırsa her istek 401 ile reddedilir); POPOPX_ALERT_MIN_SEVERITY varsayılan olarak warning’dır ve eşiğin altındaki olaylar yalnızca saklanır, kart gönderilmez.",
          hu: "A POST /api/v1/plugins/alerts/webhook végpontot a POPOPX_ALERT_WEBHOOK_TOKEN igazolja (üres token minden hívást 401-gyel elutasít); az POPOPX_ALERT_MIN_SEVERITY alapértelmezése warning, és a küszöb alatti események csak tárolódnak, nem kerülnek kiküldésre.",
        },
      },
      {
        k: {
          en: "On the phone",
          ru: "На телефоне",
          de: "Auf dem Handy",
          fr: "Sur le téléphone",
          it: "Sul telefono",
          nl: "Op de telefoon",
          cs: "V telefonu",
          "zh-Hans": "手机端",
          "zh-Hant": "手機端",
          es: "En el móvil",
          pl: "W telefonie",
          ja: "スマホ側",
          th: "บนมือถือ",
          fi: "Puhelimessa",
          uk: "На телефоні",
          bg: "На телефона",
          tr: "Telefonda",
          hu: "A telefonon",
        },
        v: {
          en: "Tapping 确认 sends ::CB::alert:ack:<id> and that same card moves its progress bar from 0% to 100% in place; resolution itself comes from the webhook, the console, or a whole-string keyword (defaults 确认,已处理,ack,resolve).",
          ru: "Касание «确认» отправляет ::CB::alert:ack:<id>, и та же карточка на месте превращает свой прогресс-бар из 0% в 100%; само закрытие приходит из webhook, из консоли или по совпадению всей строки с ключевым словом (по умолчанию 确认,已处理,ack,resolve).",
          de: "Ein Tap auf „确认“ sendet ::CB::alert:ack:<id> und dieselbe Karte schiebt ihren Fortschrittsbalken an Ort und Stelle von 0% auf 100%; die Lösung selbst kommt vom Webhook, aus der Konsole oder per Ganzzeichenketten-Schlüsselwort (Standard: 确认,已处理,ack,resolve).",
          fr: "Toucher «确认» envoie ::CB::alert:ack:<id> et cette même carte fait passer sa barre de progression de 0% à 100% sur place ; la résolution elle-même vient du webhook, de la console ou d’une correspondance sur toute la chaîne de mot-clé (par défaut 确认,已处理,ack,resolve).",
          it: "Toccare «确认» invia ::CB::alert:ack:<id> e la stessa card sposta la sua barra di avanzamento dallo 0% al 100% sul posto; la risoluzione arriva dal webhook, dalla console o da una corrispondenza a stringa intera (predefinito 确认,已处理,ack,resolve).",
          nl: "Tikken op «确认» stuurt ::CB::alert:ack:<id> en dezelfde kaart schuift haar voortgangsbalk ter plaatse van 0% naar 100%; de resolution zelf komt van de webhook, uit de console of via een trefwoord op de volledige tekst (standaard 确认,已处理,ack,resolve).",
          cs: "Klepnutí na „确认“ odešle ::CB::alert:ack:<id> a táž karta posune svůj ukazatel na místě z 0 % na 100 %; vyřešení samotné přichází z webhooku, z konzole nebo shodou celého řetězce (výchozí 确认,已处理,ack,resolve).",
          "zh-Hans": "轻点 确认 回传 ::CB::alert:ack:<id>，同一张卡原地把进度条从 0% 推到 100%；解除事件仍由 Webhook、后台或整串关键词（默认 确认,已处理,ack,resolve）触发。",
          "zh-Hant": "輕點 確認 回傳 ::CB::alert:ack:<id>，同一張卡原地把進度條從 0% 推到 100%；解除事件仍由 Webhook、後台或整串關鍵字觸發，出廠關鍵字是簡體字面值 确认,已处理,ack,resolve，不做繁簡轉換。",
          es: "Pulsar «确认» envía ::CB::alert:ack:<id> y esa misma tarjeta mueve su barra de progreso del 0% al 100% en el sitio; la resolución en sí proviene del webhook, de la consola o de una coincidencia de cadena completa (por defecto 确认,已处理,ack,resolve).",
          pl: "Tapnięcie «确认» wysyła ::CB::alert:ack:<id> i ta sama karta przesuwa swój pasek postępu z 0% do 100% w miejscu; samo rozwiązanie przychodzi z webhooka, z konsoli lub z dopasowania całego ciągu (domyślnie 确认,已处理,ack,resolve).",
          ja: "确认 をタップすると ::CB::alert:ack:<id> が送られ、そのカードのまま進捗バーが 0% から 100% に動きます。解消のトリガー自体は Webhook、コンソール、または全文一致のキーワード（既定は 确认,已处理,ack,resolve）です。",
          th: "การแตะ 确认 จะส่ง ::CB::alert:ack:<id> และการ์ดใบเดิมนั้นจะเลื่อนแถบความคืบหน้าจาก 0% เป็น 100% ที่เดิม ส่วนการปิดเคสจริง ๆ มาจาก webhook, จากคอนโซล หรือจากการจับคู่ข้อความทั้งสตริง (ค่าเริ่มต้น 确认,已处理,ack,resolve)",
          fi: "Napautus kohteesta 确认 lähettää ::CB::alert:ack:<id>, ja saman kortin etenemispalkki siirtyy paikallaan 0 %:sta 100 %:iin; ratkaisu itse tulee webhookista, konsolista tai koko merkkijonon avainsanasta (oletuksena 确认,已处理,ack,resolve).",
          uk: "Торкнення «确认» надсилає ::CB::alert:ack:<id>, і та сама картка пересуває свій прогрес-бар з 0% на 100% на місці; саме закриття надходить із webhook, з консолі або за збігом усього рядка (типово 确认,已处理,ack,resolve).",
          bg: "Докосването на 确认 изпраща ::CB::alert:ack:<id> и същата картичка премества прогрес бара си на място от 0% на 100%; самото разрешаване идва от webhook, от конзолата или по съвпадение на целия низ (по подразбиране 确认,已处理,ack,resolve).",
          tr: "确认 öğesine dokunmak ::CB::alert:ack:<id> gönderir ve aynı kart ilerleme çubuğunu yerinde %0’dan %100’e iter; çözümün kendisi webhook’tan, konsoldan veya tüm dize eşleşmesiyle gelir (varsayılan 确认,已处理,ack,resolve).",
          hu: "A 确认 érintése ::CB::alert:ack:<id> parancsot küld, és ugyanaz a kártya a helyén tolja a haladássávját 0%-ról 100%-ra; a megoldás maga a webhookból, a konzolból vagy egy teljes karakterláncos kulcsszóból érkezik (alapértelmezés: 确认,已处理,ack,resolve).",
        },
      },
      {
        k: {
          en: "Billing",
          ru: "Тарификация",
          de: "Abrechnung",
          fr: "Facturation",
          it: "Fatturazione",
          nl: "Facturering",
          cs: "Účtování",
          "zh-Hans": "计费",
          "zh-Hant": "計費",
          es: "Facturación",
          pl: "Rozliczenia",
          ja: "課金",
          th: "การคิดค่าธรรมเนียม",
          fi: "Laskutus",
          uk: "Облік",
          bg: "Таксуване",
          tr: "Faturalandırma",
          hu: "Számlázás",
        },
        v: {
          en: "One incident fingerprint is charged once at POPOPX_CP_PER_ALERT=2: re-fires, resampled notifications and repeated acks all land on the same idempotency key.",
          ru: "На один отпечаток инцидента списание проходит один раз по POPOPX_CP_PER_ALERT=2: повторные срабатывания, пересэмплированные уведомления и повторяющиеся ack попадают на один и тот же идемпотентный ключ.",
          de: "Für einen Incident-Fingerabdruck wird genau einmal POPOPX_CP_PER_ALERT=2 berechnet: Wiederauslösung, erneut abgetastete Meldungen und wiederholte Acks landen alle auf demselben Idempotenz-Schlüssel.",
          fr: "Une empreinte d’incident n’est facturée qu’une fois à POPOPX_CP_PER_ALERT=2 : re-déclenchements, notifications rééchantillonnées et accusés répétés retombent tous sur la même clé d’idempotence.",
          it: "Un’impronta dell’incidente viene addebitata una sola volta a POPOPX_CP_PER_ALERT=2: riattivazioni, notifiche ricampionate e ack ripetuti ricadono tutti sulla stessa chiave di idempotenza.",
          nl: "Voor één incident-vingerafdruk wordt één keer POPOPX_CP_PER_ALERT=2 in rekening gebracht: herhaalde triggers, opnieuw bemonsterde meldingen en telkens dezelfde acks komen allemaal op dezelfde idempotency-sleutel uit.",
          cs: "Za jeden otisk incidentu se účtuje jednorázově POPOPX_CP_PER_ALERT=2: opakovaná spuštění, znovu vzorkovaná oznámení i opakovaná potvrzení dopadnou na stejný idempotentní klíč.",
          "zh-Hans": "一个事件指纹只扣一次 POPOPX_CP_PER_ALERT=2；重复投递、重采样通知与反复确认都落到同一把幂等键上。",
          "zh-Hant": "一個事件指紋只扣一次 POPOPX_CP_PER_ALERT=2；重複投遞、重取樣通知與反覆確認都落到同一把冪等鍵上。",
          es: "Una huella de incidente se factura una sola vez con POPOPX_CP_PER_ALERT=2: los re-disparos, las notificaciones remuestreadas y los acuses repetidos caen sobre la misma clave de idempotencia.",
          pl: "Za jeden odcisk incydentu naliczana jest jednorazowo opłata POPOPX_CP_PER_ALERT=2: ponowne wyzwalania, powiadomienia z nowego próbkowania i ponowne potwierdzenia trafiają na ten sam klucz idempotencji.",
          ja: "インシデントの指紋に対して POPOPX_CP_PER_ALERT=2 が1回だけ課金されます。再発火、再サンプリングされた通知、繰り返しの ack はいずれも同じ冪等キーに落ちます。",
          th: "ลายนิ้วมือของเหตุการณ์หนึ่งจะถูกคิด POPOPX_CP_PER_ALERT=2 เพียงครั้งเดียว การยิงซ้ำ การแจ้งเตือนที่สุ่มตัวอย่างใหม่ และการกดยืนยันซ้ำ ต่างลงคีย์ idempotency เดียวกัน",
          fi: "Yhtä tapahtuman sormenjälkeä kohti laskutetaan kerran POPOPX_CP_PER_ALERT=2: uudelleenlaukeukset, uudelleenotetut ilmoitukset ja toistetut kuittaujat osuvat samalle idempotenttisyysavaimelle.",
          uk: "За один відбиток інциденту списується одноразово POPOPX_CP_PER_ALERT=2: повторні спрацювання, сповіщення знову взяті на пробі та повторні ack потрапляють на той самий ідемпотентний ключ.",
          bg: "За един отпечатък на инцидент таксата POPOPX_CP_PER_ALERT=2 се начислява веднъж: повторни задействания, препробирани известия и повторно потвърждения попадат на един и същ идемпотентен ключ.",
          tr: "Bir olay parmak izi için POPOPX_CP_PER_ALERT=2 tek seferlik ücretlendirilir: yeniden tetiklemeler, yeniden örneklenen bildirimler ve yinelenen onaylar hep aynı idempotency anahtarına düşer.",
          hu: "Egy esemény-ujjlenyomat után a POPOPX_CP_PER_ALERT=2 díjat csak egyszer számoljuk fel: az újratüzelések, az újravett minták és az ismételt elismerések mind ugyanarra az idempotens kulcsra futnak ki.",
        },
      },
    ],
    keys: [
      "POPOPX_PLUGIN_ALERT_OPS=1",
      "POPOPX_ALERT_WEBHOOK_TOKEN",
      "POPOPX_ALERT_MIN_SEVERITY",
      "POPOPX_ALERT_RESOLVE_KEYWORDS",
      "POPOPX_CP_PER_ALERT",
    ],
    route: "POST /api/v1/plugins/alerts/webhook",
  },
  {
    code: "Privacy SSO",
    file: "privacy_sso_plugin.py",
    category: "identity",
    status: "default-on",
    accent: "mesh",
    name: {
      en: "Zero-tracking scan login",
      ru: "Вход по QR-коду без отслеживания",
      de: "Scan-Login ohne Tracking",
      fr: "Connexion par scan sans pistage",
      it: "Accesso con scansione senza tracciamento",
      nl: "Qr-login zonder tracking",
      cs: "Přihlášení skenováním bez sledování",
      "zh-Hans": "零追踪扫码登录",
      "zh-Hant": "零追蹤掃描登入",
      es: "Inicio de sesión por escaneo sin rastreo",
      pl: "Logowanie skanem bez śledzenia",
      ja: "追跡なしの QR コードログイン",
      th: "เข้าสู่ระบบด้วยการสแกนแบบไม่ติดตาม",
      fi: "QR-kirjautuminen ilman seurantaa",
      uk: "Вхід скануванням без відстеження",
      bg: "Вход с сканиране без проследяване",
      tr: "İzleme yapmadan QR ile giriş",
      hu: "Trackingmentes QR-bejelentkezés",
    },
    hook: {
      en: "No phone number and no email: the iOS scanner completes the third-party site login.",
      ru: "Ни номера телефона, ни почты: сканер iOS завершает вход на сторонний сайт.",
      de: "Keine Telefonnummer und keine E-Mail: der iOS-Scanner schließt den Login bei der Drittanbieter-Seite ab.",
      fr: "Ni numéro de téléphone ni e-mail : le scanner iOS termine la connexion au site tiers.",
      it: "Né numero di telefono né email: lo scanner di iOS completa il login sul sito terzo.",
      nl: "Geen telefoonnummer en geen e-mail: de iOS-scanner rondt de login bij de externe site af.",
      cs: "Bez telefonního čísla a bez e-mailu: skener iOS dokončí přihlášení ke třetí straně.",
      "zh-Hans": "不需要手机号，也不需要邮箱：iOS 扫一扫即完成第三方网站的授权登录。",
      "zh-Hant": "不需要手機號，也不需要信箱：iOS 掃描即完成第三方網站的授權登入。",
      es: "Ni teléfono ni correo: el escáner de iOS completa el inicio de sesión en el sitio de terceros.",
      pl: "Bez numeru telefonu i bez e-maila: skaner na iOS-ie kończy logowanie do serwisu strony trzeciej.",
      ja: "電話番号もメールアドレスも不要。iOS のスキャナーが第三者サイトのログインを完了させます。",
      th: "ไม่ต้องใช้หมายเลขโทรศัพท์และไม่ต้องใช้อีเมล ตัวสแกนบน iOS จะทำให้การเข้าสู่ระบบไซต์ภายนอกเสร็จสมบูรณ์",
      fi: "Ei puhelinnumeroa eikä sähköpostia: iOS-skanneri viimeistelee kirjautumisen kolmannen osapuolen sivustolle.",
      uk: "Без номера телефону й без пошти: сканер в iOS завершує вхід на сторонній сайт.",
      bg: "Нито телефонен номер, нито имейл: скенерът на iOS завършва влизането в сайт на трета страна.",
      tr: "Telefon numarası yok, e-posta yok: iOS tarayıcısı üçüncü taraf site girişini tamamlıyor.",
      hu: "Telefonszám nélkül és e-mail cím nélkül: az iOS beolvasója fejezi be a harmadik fél oldalán való bejelentkezést.",
    },
    facts: [
      {
        k: {
          en: "The QR",
          ru: "QR-код",
          de: "Der QR-Code",
          fr: "Le QR",
          it: "Il QR",
          nl: "De QR-code",
          cs: "QR kód",
          "zh-Hans": "二维码",
          "zh-Hant": "QR 碼",
          es: "El QR",
          pl: "Kod QR",
          ja: "QR コード",
          th: "รหัส QR",
          fi: "QR-koodi",
          uk: "QR-код",
          bg: "QR код",
          tr: "QR kodu",
          hu: "QR-kód",
        },
        v: {
          en: "The payload is popopx://sso?uri=<service address>&session=<id>, where the id is 24 URL-safe characters off 18 random bytes, so guessing one is not a thing.",
          ru: "Нагрузкой служит popopx://sso?uri=<адрес сервисного аккаунта>&session=<id>, где id — это 24 URL-safe символа из 18 случайных байт, так что угадать его невозможно.",
          de: "Die Nutzlast ist popopx://sso?uri=<service-konto-adresse>&session=<id>, wobei das id 24 URL-sichere Zeichen umfasst, die aus 18 Zufallsbytes erzeugt werden – Raten ist hier also keine Option.",
          fr: "La charge utile est popopx://sso?uri=<adresse du compte service>&session=<id>, où l’id compte 24 caractères URL-sûrs issus de 18 octets aléatoires, le deviner n’est donc pas une option.",
          it: "Il payload è popopx://sso?uri=<indirizzo dell’account servizio>&session=<id>, dove l’id è composto da 24 caratteri URL-safe generati da 18 byte casuali, quindi indovinarlo non è un’opzione.",
          nl: "De lading is popopx://sso?uri=<serviceaccount-adres>&session=<id>, waarin de id 24 URL-veilige tekens uit 18 willekeurige bytes zijn; gokken is dus geen optie.",
          cs: "Payload je popopx://sso?uri=<adresa služebního účtu>&session=<id>, kde id tvoří 24 URL-safe znaků ze 18 náhodných bajtů, takže uhádnout se nedá.",
          "zh-Hans": "载荷是 popopx://sso?uri=<服务号地址>&session=<会话 id>，会话 id 是 24 个字符的 URL-safe 随机串（144 位），猜不出来。",
          "zh-Hant": "載體是 popopx://sso?uri=<服務號位址>&session=<工作階段 id>，工作階段 id 是 24 字元的 URL-safe 隨機字串（144 位），猜不出來。",
          es: "La carga útil es popopx://sso?uri=<dirección de la cuenta de servicio>&session=<id>, donde el id son 24 caracteres aptos para URL derivados de 18 bytes aleatorios, así que adivinarlo no funciona.",
          pl: "Payload ma postać popopx://sso?uri=<adres konta serwisowego>&session=<id>, gdzie id to 24 znaków URL-safe z 18 losowych bajtów, więc zgadywanie nie wchodzi w grę.",
          ja: "ペイロードは popopx://sso?uri=<サービスアカウントのアドレス>&session=<id> で、id はランダム 18 バイト由来の URL-safe な 24 文字です。推測は成立しません。",
          th: "เพย์โหลดคือ popopx://sso?uri=<ที่อยู่บัญชีบริการ>&session=<id> โดย id เป็นอักขระแบบ URL-safe 24 ตัวที่สุ่มมาจาก 18 ไบต์ การเดาจึงเป็นไปไม่ได้",
          fi: "Hyötykuorma on popopx://sso?uri=<palvelutilin osoite>&session=<id>, jossa id on 24 URL-safe-merkkiä, arpottu 18 satunnaisesta tavusta, joten sen arvaaminen ei onnistu.",
          uk: "Навантаженням слугує popopx://sso?uri=<адреса сервісного акаунта>&session=<id>, де id — це 24 URL-safe символи з 18 випадкових байтів, тож вгадати його не вийде.",
          bg: "Натоварването е popopx://sso?uri=<адрес на сервисния акаунт>&session=<id>, където id са 24 URL-safe знака от 18 случайни байта, та че да го познаеш не е вариант.",
          tr: "Yük, popopx://sso?uri=<hizmet hesabı adresi>&session=<id> biçimindedir; buradaki id 18 rastgele bayttan üretilmiş 24 URL-güvenli karakterdir, yani tahmin etmek söz konusu değil.",
          hu: "A hasznos teher popopx://sso?uri=<szolgáltatásfiók-cím>&session=<id>, ahol az id 24 URL-biztos karakter 18 véletlen bájtból, így a találgatás szóba sem jön.",
        },
      },
      {
        k: {
          en: "Polling",
          ru: "Опрос",
          de: "Abfragetakt",
          fr: "Interrogation",
          it: "Interrogazione",
          nl: "Uitvragen",
          cs: "Dotazování",
          "zh-Hans": "轮询",
          "zh-Hant": "輪詢",
          es: "Sondeo",
          pl: "Odpytywanie",
          ja: "ポーリング",
          th: "การสอบถามซ้ำ",
          fi: "Kysely",
          uk: "Опитування",
          bg: "Запитване",
          tr: "Sorgulama",
          hu: "Lekérdezés",
        },
        v: {
          en: "The scan page polls GET /api/v1/plugins/sso/sessions/{id} with no token at all and gets state, never an identity; the credential is released only by the bearer-authenticated POST /api/v1/plugins/sso/verify and is burned on redemption.",
          ru: "Страница сканирования опрашивает GET /api/v1/plugins/sso/sessions/{id} вообще без токена и получает только состояние, никогда личность; учётные данные выдаёт лишь POST /api/v1/plugins/sso/verify с bearer-токеном, и при погашении они сгорают.",
          de: "Die Scan-Seite fragt GET /api/v1/plugins/sso/sessions/{id} ganz ohne Token ab und bekommt den Zustand, nie eine Identität; das Credential gibt nur das per Bearer-Token authentifizierte POST /api/v1/plugins/sso/verify heraus, und bei der Einlösung verfällt es endgültig.",
          fr: "La page de scan interroge GET /api/v1/plugins/sso/sessions/{id} sans aucun token et n’obtient que l’état, jamais une identité ; le credential n’est délivré que par le POST /api/v1/plugins/sso/verify authentifié par bearer et il est détruit lors de l’échange.",
          it: "La pagina di scansione interroga GET /api/v1/plugins/sso/sessions/{id} senza alcun token e ottiene solo lo stato, mai un’identità; la credenziale viene emessa soltanto dal POST /api/v1/plugins/sso/verify autenticato con bearer e viene annullata al momento del riscatto.",
          nl: "De scanpagina pollt GET /api/v1/plugins/sso/sessions/{id} helemaal zonder token en krijgt alleen status, nooit een identiteit; het credential wordt alleen vrijgegeven door het bearer-geauthenticeerde POST /api/v1/plugins/sso/verify en vervalt bij inlossing.",
          cs: "Stránka skenování dotazuje GET /api/v1/plugins/sso/sessions/{id} bez jakéhokoli tokenu a dostává stav, nikdy identitu; pověření vydává pouze POST /api/v1/plugins/sso/verify ověřené bearer tokenem a při uplatnění se spálí.",
          "zh-Hans": "扫码页免令牌轮询 GET /api/v1/plugins/sso/sessions/{id}，只拿状态、永不拿身分；凭证只在带令牌的 POST /api/v1/plugins/sso/verify 里下发，兑现一次即作废。",
          "zh-Hant": "掃描頁免權杖輪詢 GET /api/v1/plugins/sso/sessions/{id}，只拿狀態、永不拿身分；憑證只在帶權杖的 POST /api/v1/plugins/sso/verify 裡下發，兌現一次即作廢。",
          es: "La página de escaneo consulta GET /api/v1/plugins/sso/sessions/{id} sin ningún token y solo obtiene el estado, nunca una identidad; la credencial la libera únicamente el POST /api/v1/plugins/sso/verify autenticado con bearer y se destruye al canjearla.",
          pl: "Strona skanowania odpytuje GET /api/v1/plugins/sso/sessions/{id} bez żadnego tokenu i dostaje stan, nigdy tożsamość; poświadczenie wydaje wyłącznie POST /api/v1/plugins/sso/verify uwierzytelniony tokenem bearer i przepada w momencie wymiany.",
          ja: "スキャンページは GET /api/v1/plugins/sso/sessions/{id} をトークンなしでポーリングし、状態だけを受け取ります。身元は渡されません。認証情報は bearer トークンを付けた POST /api/v1/plugins/sso/verify だけが払い出し、引き換えられた瞬間に使えなくなります。",
          th: "หน้าสแกนสอบถาม GET /api/v1/plugins/sso/sessions/{id} โดยไม่มีโทเคนเลย และได้เฉพาะสถานะ ไม่เคยได้ตัวตน; ข้อมูลรับรองจะถูกจ่ายออกโดย POST /api/v1/plugins/sso/verify ที่ต้องมี bearer token เท่านั้น และจะใช้ได้ครั้งเดียวตอนแลก",
          fi: "Skannussivu kyselee GET /api/v1/plugins/sso/sessions/{id} ilman mitään tokenia ja saa vain tilan, ei koskaan henkilöllisyyttä; tunnusteen luovuttaa ainoastaan bearer-tokenilla todennettu POST /api/v1/plugins/sso/verify, ja se poltetaan lunastuksen hetkellä.",
          uk: "Сторінка сканування опитує GET /api/v1/plugins/sso/sessions/{id} взагалі без токена й отримує лише стан, ніколи особу; облікові дані видає тільки POST /api/v1/plugins/sso/verify з bearer-автентифікацією, і при погашенні вони згорають.",
          bg: "Страницата за сканиране се допитва до GET /api/v1/plugins/sso/sessions/{id} изобщо без токен и получава само състояние, никога самоличност; удостоверението се освобождава единствено от POST /api/v1/plugins/sso/verify, удостоверяван с bearer токен, и изгаря при поднасянето.",
          tr: "Tarama sayfası GET /api/v1/plugins/sso/sessions/{id} adresini hiçbir token olmadan yoklar ve yalnızca durumu alır, kimliği asla; kimlik bilgisi ancak bearer ile doğrulanmış POST /api/v1/plugins/sso/verify tarafından verilir ve kullanıldığı anda geçersiz hale gelir.",
          hu: "A beolváltó oldal token nélkül kérdezi le a GET /api/v1/plugins/sso/sessions/{id} végpontot, és csak állapotot kap, identitást soha; a hitelesítő adatot kizárólag a bearer-rel hitelesített POST /api/v1/plugins/sso/verify adja ki, és az átvétel pillanatában megsemmisül.",
        },
      },
      {
        k: {
          en: "Lifetime and price",
          ru: "Срок и цена",
          de: "Laufzeit und Preis",
          fr: "Durée et tarif",
          it: "Durata e prezzo",
          nl: "Levensduur en prijs",
          cs: "Platnost a cena",
          "zh-Hans": "时效与价",
          "zh-Hant": "時效與價格",
          es: "Vigencia y precio",
          pl: "Czas życia i cena",
          ja: "有効期限と価格",
          th: "อายุและราคา",
          fi: "Voimassaolo ja hinta",
          uk: "Термін і ціна",
          bg: "Срок и цена",
          tr: "Süre ve fiyat",
          hu: "Élettartam és ár",
        },
        v: {
          en: "POPOPX_SSO_TTL_SECONDS=180 and POPOPX_SSO_POLL_INTERVAL_MS=2000; minting a QR is free, the POPOPX_CP_PER_SSO_LOGIN=1 charge happens on the user's approval.",
          ru: "POPOPX_SSO_TTL_SECONDS=180 и POPOPX_SSO_POLL_INTERVAL_MS=2000; выпуск QR-кода бесплатный, списание POPOPX_CP_PER_SSO_LOGIN=1 происходит в момент подтверждения пользователем.",
          de: "POPOPX_SSO_TTL_SECONDS=180 und POPOPX_SSO_POLL_INTERVAL_MS=2000; das Erzeugen eines QR-Code kostet nichts, die Abrechnung von POPOPX_CP_PER_SSO_LOGIN=1 erfolgt mit der Zustimmung des Nutzers.",
          fr: "POPOPX_SSO_TTL_SECONDS=180 et POPOPX_SSO_POLL_INTERVAL_MS=2000 ; émettre un QR est gratuit, la facturation POPOPX_CP_PER_SSO_LOGIN=1 intervient à l’approbation de l’utilisateur.",
          it: "POPOPX_SSO_TTL_SECONDS=180 e POPOPX_SSO_POLL_INTERVAL_MS=2000; coniare un QR è gratuito, l’addebito POPOPX_CP_PER_SSO_LOGIN=1 scatta all’approvazione dell’utente.",
          nl: "POPOPX_SSO_TTL_SECONDS=180 en POPOPX_SSO_POLL_INTERVAL_MS=2000; een QR-code aanmaken is gratis, de POPOPX_CP_PER_SSO_LOGIN=1-kosten komen pas bij de goedkeuring van de gebruiker.",
          cs: "POPOPX_SSO_TTL_SECONDS=180 a POPOPX_SSO_POLL_INTERVAL_MS=2000; vygenerování QR je zdarma, poplatek POPOPX_CP_PER_SSO_LOGIN=1 se účtuje ve chvíli, kdy uživatel potvrdí.",
          "zh-Hans": "POPOPX_SSO_TTL_SECONDS=180、POPOPX_SSO_POLL_INTERVAL_MS=2000；生成二维码不扣费，用户点确认那一刻才按 POPOPX_CP_PER_SSO_LOGIN=1 计量。",
          "zh-Hant": "POPOPX_SSO_TTL_SECONDS=180、POPOPX_SSO_POLL_INTERVAL_MS=2000；產生 QR 碼不扣費，使用者點確認那一刻才依 POPOPX_CP_PER_SSO_LOGIN=1 計量。",
          es: "POPOPX_SSO_TTL_SECONDS=180 y POPOPX_SSO_POLL_INTERVAL_MS=2000; acuñar un QR es gratuito, el cargo POPOPX_CP_PER_SSO_LOGIN=1 se aplica en la aprobación del usuario.",
          pl: "POPOPX_SSO_TTL_SECONDS=180 i POPOPX_SSO_POLL_INTERVAL_MS=2000; wygenerowanie kodu QR nic nie kosztuje, a opłata POPOPX_CP_PER_SSO_LOGIN=1 naliczana jest w momencie zatwierdzenia przez użytkownika.",
          ja: "POPOPX_SSO_TTL_SECONDS=180、POPOPX_SSO_POLL_INTERVAL_MS=2000。QR の発行では課金されず、利用者が承認した瞬間に POPOPX_CP_PER_SSO_LOGIN=1 が計量されます。",
          th: "POPOPX_SSO_TTL_SECONDS=180 และ POPOPX_SSO_POLL_INTERVAL_MS=2000 การสร้าง QR ไม่เสียค่าใช้จ่าย การเรียกเก็บ POPOPX_CP_PER_SSO_LOGIN=1 จะเกิดขึ้นตอนผู้ใช้งานกดยอมรับ",
          fi: "POPOPX_SSO_TTL_SECONDS=180 ja POPOPX_SSO_POLL_INTERVAL_MS=2000; QR-koodin luonti on ilmaista, POPOPX_CP_PER_SSO_LOGIN=1 -velous tapahtuu käyttäjän hyväksymishetkellä.",
          uk: "POPOPX_SSO_TTL_SECONDS=180 і POPOPX_SSO_POLL_INTERVAL_MS=2000; випуск QR безкоштовний, списання POPOPX_CP_PER_SSO_LOGIN=1 відбувається в момент підтвердження користувачем.",
          bg: "POPOPX_SSO_TTL_SECONDS=180 и POPOPX_SSO_POLL_INTERVAL_MS=2000; издаването на QR е безплатно, таксата POPOPX_CP_PER_SSO_LOGIN=1 се начислява в момента на одобрение от потребителя.",
          tr: "POPOPX_SSO_TTL_SECONDS=180 ve POPOPX_SSO_POLL_INTERVAL_MS=2000; QR üretimi ücretsizdir, POPOPX_CP_PER_SSO_LOGIN=1 ücretlendirmesi kullanıcının onay anında yapılır.",
          hu: "POPOPX_SSO_TTL_SECONDS=180 és POPOPX_SSO_POLL_INTERVAL_MS=2000; a QR kibocsátása ingyenes, a POPOPX_CP_PER_SSO_LOGIN=1 terhelés a felhasználó jóváhagyásakor lép fel.",
        },
      },
    ],
    keys: [
      "POPOPX_PLUGIN_PRIVACY_SSO=1",
      "POPOPX_SSO_TTL_SECONDS",
      "POPOPX_SSO_POLL_INTERVAL_MS",
      "POPOPX_CP_PER_SSO_LOGIN",
    ],
    route: "GET /api/v1/plugins/sso/sessions/{id}",
  },
  {
    code: "Encrypted Polls",
    file: "polls_plugin.py",
    category: "engagement",
    status: "default-on",
    accent: "mesh",
    name: {
      en: "Backend-free encrypted surveys and polls",
      ru: "Опросы и анонимные голосования с шифрованием без бэкенда",
      de: "Serverlose verschlüsselte Umfragen und anonyme Abstimmungen",
      fr: "Sondages chiffrés sans back-end et votes anonymes",
      it: "Sondaggi cifrati senza backend e votazioni anonime",
      nl: "Backendloze versleutelde enquêtes en anonieme polls",
      cs: "Šifrované ankety a anonymní hlasování bez backendu",
      "zh-Hans": "无后端加密问卷与匿名投票",
      "zh-Hant": "無後端加密問卷與匿名投票",
      es: "Encuestas cifradas sin backend y votaciones anónimas",
      pl: "Szyfrowane ankiety bez backendu i anonimowe głosowania",
      ja: "バックエンド不要の暗号化アンケートと匿名投票",
      th: "แบบสอบถามเข้ารหัสไร้แบ็กเอนด์และการลงคะแนนแบบไม่ระบุตัวตน",
      fi: "Salatut kyselyt backendittä ja anonyymit äänestykset",
      uk: "Зашифровані опитування без бекенду та анонімні голосування",
      bg: "Криптирани проучвания без бекенд и анонимни гласувания",
      tr: "Backend’siz şifreli anketler ve anonim oylamalar",
      hu: "Backend nélküli titkosított felmérések és anonim szavazások",
    },
    hook: {
      en: "Create the poll in the console, fans tap to vote, and the bar moves inside the same bubble.",
      ru: "Опрос создаётся в консоли, подписчики голосуют касанием, и полоска двигается внутри того же пузыря.",
      de: "Umfrage in der Konsole anlegen, Follower tippen zum Abstimmen, und der Balken bewegt sich innerhalb derselben Blase.",
      fr: "Créer le sondage dans la console, les followers votent d’un tap, et la barre bouge dans la même bulle.",
      it: "Crea il sondaggio nella console, i follower toccano per votare e la barra si muove dentro la stessa bolla.",
      nl: "Maak de poll in de console, volgers tikken om te stemmen, en de balk beweegt binnen dezelfde bubble.",
      cs: "Anketu vytvoříte v konzoli, followeři klepnou pro hlasování a ukazatel se posune uvnitř stejné bubliny.",
      "zh-Hans": "后台建票，粉丝一点即投，进度条按 cardId 在同一颗气泡里刷新。",
      "zh-Hant": "後台建票，粉絲一點即投，進度條依 cardId 在同一顆氣泡裡重新整理。",
      es: "Crea la encuesta en la consola, los seguidores tocan para votar y la barra se mueve dentro de la misma burbuja.",
      pl: "Ankieta tworzona jest w konsoli, obserwujący klikają, aby zagłosować, a pasek przesuwa się wewnątrz tego samego dymka.",
      ja: "コンソールで票を作り、ファンはタップするだけで投票します。進捗バーは同じバブルの中で動きます。",
      th: "สร้างโพลในคอนโซล ผู้ติดตามแตะเพื่อลงคะแนน แล้วแถบผลก็จะขยับอยู่ภายในบอลลูนใบเดิม",
      fi: "Luo kysely konsolissa, seuraajat napauttavat äänestääkseen, ja palkki liikkuu saman kuplan sisällä.",
      uk: "Створюєте опитування в консолі, підписники голосують дотиком, і смужка рухається всередині тієї ж бульбашки.",
      bg: "Създавате анкетата в конзолата, последователите докосват, за да гласуват, и барът се мести в същия балон.",
      tr: "Anketi konsolda oluşturun, takipçiler dokunarak oy verir ve çubuk aynı baloncuğun içinde hareket eder.",
      hu: "A konzolban hozod létre a szavazást, a követők egy érintéssel szavaznak, és a sáv ugyanabban a buborékban mozog.",
    },
    facts: [
      {
        k: {
          en: "Creating",
          ru: "Создание",
          de: "Anlegen",
          fr: "Création",
          it: "Creazione",
          nl: "Aanmaken",
          cs: "Vytvoření",
          "zh-Hans": "建票",
          "zh-Hant": "建票",
          es: "Creación",
          pl: "Tworzenie",
          ja: "票の作成",
          th: "การสร้างโพล",
          fi: "Luominen",
          uk: "Створення",
          bg: "Създаване",
          tr: "Oluşturma",
          hu: "Létrehozás",
        },
        v: {
          en: "POST /api/v1/plugins/polls takes question, options, mode, multi and targets; at most four options (the client's action ceiling), and empty targets means nobody, so a poll is never a broadcast by default.",
          ru: "POST /api/v1/plugins/polls принимает question, options, mode, multi и targets; максимум четыре варианта (потолок кнопок в клиенте), а пустой targets означает никого, поэтому опрос по умолчанию никогда не бывает рассылкой всем.",
          de: "POST /api/v1/plugins/polls nimmt question, options, mode, multi und targets an; höchstens vier Optionen (die Aktions-Obergrenze des Clients), und leere targets heißt niemand, ein Vote ist standardmäßig also niemals ein Broadcast.",
          fr: "POST /api/v1/plugins/polls accepte question, options, mode, multi et targets ; au plus quatre options (le plafond de boutons du client), et targets vide signifie personne, donc un sondage n’est jamais une diffusion à tous par défaut.",
          it: "POST /api/v1/plugins/polls accetta question, options, mode, multi e targets; al massimo quattro opzioni (il limite dei pulsanti del client) e targets vuoto significa nessuno, quindi un sondaggio di default non è mai una broadcast.",
          nl: "POST /api/v1/plugins/polls neemt question, options, mode, multi en targets; maximaal vier opties (het plafond van de kaartknoppen aan de cliëntkant), en lege targets betekent niemand, dus een poll is standaard nooit een broadcast.",
          cs: "POST /api/v1/plugins/polls přijímá question, options, mode, multi a targets; maximálně čtyři možnosti (strop tlačítek klienta) a prázdné targets znamená nikoho, takže anketa není ve výchozím stavu nikdy broadcast.",
          "zh-Hans": "POST /api/v1/plugins/polls 收 question、options、mode、multi、targets；最多 4 个选项（客户端卡片按钮上限），targets 留空就是不发，投票永远不会广播给全体粉丝。",
          "zh-Hant": "POST /api/v1/plugins/polls 收受 question、options、mode、multi、targets；最多 4 個選項（用戶端卡片按鈕上限），targets 留空就是不發，投票永遠不會廣播給全體粉絲。",
          es: "POST /api/v1/plugins/polls recibe question, options, mode, multi y targets; como máximo cuatro opciones (el techo de botones del cliente), y targets vacío significa nadie, así que una encuesta nunca es una difusión por defecto.",
          pl: "POST /api/v1/plugins/polls przyjmuje question, options, mode, multi i targets; maksymalnie cztery opcje (limit przycisków klienta), a puste targets oznacza nikogo, więc ankieta domyślnie nigdy nie jest broadcastem.",
          ja: "POST /api/v1/plugins/polls は question、options、mode、multi、targets を受け取ります。選択肢は最大 4 つ（クライアントのボタン数の上限）で、targets が空なら誰も指定しないという意味になり、投票は既定では全体配信にはなりません。",
          th: "POST /api/v1/plugins/polls รับ question, options, mode, multi และ targets ได้สูงสุด 4 ตัวเลือก (เพดานปุ่มของฝั่งไคลเอนต์) และการปล่อย targets ว่างหมายถึงไม่ส่งให้ใครเลย โพลจึงไม่ใช่การบรอดแคสต์โดยค่าเริ่มต้น",
          fi: "POST /api/v1/plugins/polls ottaa vastaan question, options, mode, multi ja targets; enintään neljä vaihtoehtoa (asiakkaan painekatto) ja tyhjä targets tarkoittaa ei ketään, joten kysely ei ole oletuksena koskaan yleislähetys.",
          uk: "POST /api/v1/plugins/polls приймає question, options, mode, multi та targets; щонайбільше чотири варіанти (стеля кнопок у клієнті), а порожній targets означає нікому, тож опитування типово ніколи не є розсилкою на всіх.",
          bg: "POST /api/v1/plugins/polls приема question, options, mode, multi и targets; най-много четири опции (таванът на бутоните в клиента), а празен targets означава никой, така че анкетата по подразбиране никога не е излъчване към всички.",
          tr: "POST /api/v1/plugins/polls, question, options, mode, multi ve targets alır; en fazla dört seçenek (istemcinin buton sınırı) ve boş targets hiç kimse demektir, dolayısıyla anket varsayılan olarak asla bir toplu gönderim olmaz.",
          hu: "A POST /api/v1/plugins/polls a question, options, mode, multi és targets mezőket fogadja; legfeljebb négy opció (a kliens gombplafonja), és az üres targets azt jelenti, hogy senkinek, így a szavazás alapértelmezés szerint sosem tömegküldés.",
        },
      },
      {
        k: {
          en: "Dedupe",
          ru: "Дедупликация",
          de: "Duplikatschutz",
          fr: "Déduplication",
          it: "Anti-duplicazione",
          nl: "Dedup",
          cs: "Deduplikace",
          "zh-Hans": "防重复",
          "zh-Hant": "防重複",
          es: "Deduplicado",
          pl: "Deduplikacja",
          ja: "重複排除",
          th: "การกันซ้ำ",
          fi: "Deduplikointi",
          uk: "Дедуплікація",
          bg: "Дедуплициране",
          tr: "Mükerrer engelleme",
          hu: "Duplikációszűrés",
        },
        v: {
          en: "poll_votes carries UNIQUE (poll_id, contact_id) and the check-plus-write runs in one transaction; a follower's second tap is answered as a replay, no count, no charge, no rewrite of a published result.",
          ru: "В таблице poll_votes лежит UNIQUE (poll_id, contact_id), и проверка вместе с записью выполняются в одной транзакции; второе касание подписчика трактуется как повтор: ни зачёта, ни списания, ни переписывания опубликованного результата.",
          de: "poll_votes enthält UNIQUE (poll_id, contact_id), und Prüfung plus Schreibvorgang laufen in einer Transaktion; ein zweiter Tap eines Followers wird als Replay beantwortet: keine Zählung, keine Abrechnung, kein Umschreiben eines veröffentlichten Ergebnisses.",
          fr: "poll_votes porte UNIQUE (poll_id, contact_id) et le contrôle plus l’écriture s’exécutent dans une seule transaction ; le second tap d’un follower est traité comme un rejeu : pas de comptage, pas de facture, pas de réécriture d’un résultat publié.",
          it: "poll_votes contiene UNIQUE (poll_id, contact_id) e controllo più scrittura vengono eseguiti in un’unica transazione; il secondo tap di un follower viene gestito come replay: niente conteggio, niente addebito, nessuna riscrittura di un risultato pubblicato.",
          nl: "poll_votes bevat UNIQUE (poll_id, contact_id) en de check en de schrijffase gebeuren in één transactie; een tweede tik van een volger wordt als replay behandeld: geen telling, geen kosten, geen herschrijving van een gepubliceerd resultaat.",
          cs: "poll_votes nese UNIQUE (poll_id, contact_id) a kontrola spolu se zápisem běží v jedné transakci; druhé klepnutí followera se zodpoví jako replay: bez započítání, bez poplatku, bez přepsání zveřejněného výsledku.",
          "zh-Hans": "票根上有 UNIQUE (poll_id, contact_id)，判重与写库在同一条事务里完成；同一位粉丝的第二次点击按重放处理：不计数、不扣费、不改写已公布的结果。",
          "zh-Hant": "票根上有 UNIQUE (poll_id, contact_id)，判重與寫庫在同一條交易裡完成；同一位粉絲的第二點擊依重放處理：不計數、不扣費、不改寫已公布的結果。",
          es: "poll_votes lleva UNIQUE (poll_id, contact_id) y la comprobación más la escritura se ejecutan en una sola transacción; el segundo toque de un seguidor se responde como replay: sin conteo, sin cargo, sin reescribir un resultado publicado.",
          pl: "poll_votes zawiera UNIQUE (poll_id, contact_id), a sprawdzenie wraz z zapisem wykonuje się w jednej transakcji; drugie tapnięcie obserwującego jest traktowane jako replay: bez zliczenia, bez opłaty, bez przepisywania opublikowanego wyniku.",
          ja: "poll_votes には UNIQUE (poll_id, contact_id) があり、重複チェックと書き込みは同一トランザクションで完了します。ファンの2回目のタップは再送として扱われ、計上されず、課金されず、公開済みの結果も書き換わりません。",
          th: "ตาราง poll_votes มี UNIQUE (poll_id, contact_id) และการตรวจซ้ำพร้อมการเขียนจะอยู่ในทรานแซกชันเดียวกัน การแตะครั้งที่สองของผู้ติดตามจะถูกถือว่าเป็นการส่งซ้ำ ไม่มีการนับ ไม่มีการหักเครดิต และไม่แก้ไขผลที่ประกาศไปแล้ว",
          fi: "poll_votes sisältää UNIQUE (poll_id, contact_id), ja tarkistus sekä kirjoitus suoritetaan yhdessä transaktiossa; seuraajan toinen napautus vastataan toistona: ei lasketa, ei veloiteta, ei julkaistun tuloksen uudelleenkirjoitusta.",
          uk: "У poll_votes є UNIQUE (poll_id, contact_id), і перевірка разом із записом виконуються в одній транзакції; друге торкнення підписника розцінюється як повтор: без зарахування, без списання, без переписування опублікованого результату.",
          bg: "poll_votes носи UNIQUE (poll_id, contact_id), а проверката заедно със записа се извършва в една транзакция; второто докосване на последовател се третира като повторение: без броене, без такса, без презаписване на публикуван резултат.",
          tr: "poll_votes tablosunda UNIQUE (poll_id, contact_id) bulunur ve kontrol ile yazma tek transaction içinde çalışır; takipçinin ikinci dokunuşu yeniden gönderim olarak yanıtlanır: sayım yok, ücret yok, yayımlanmış sonucun yeniden yazılması yok.",
          hu: "A poll_votes tábla UNIQUE (poll_id, contact_id) kulccsal rendelkezik, és az ellenőrzés meg a beírás egyetlen tranzakcióban fut; a követő második érintését replay-ként kezeljük: nem számítjuk, nem számlázzuk, és egy közzétett eredményt sem írunk át.",
        },
      },
      {
        k: {
          en: "Billing",
          ru: "Тарификация",
          de: "Abrechnung",
          fr: "Facturation",
          it: "Fatturazione",
          nl: "Facturering",
          cs: "Účtování",
          "zh-Hans": "计费",
          "zh-Hant": "計費",
          es: "Facturación",
          pl: "Rozliczenia",
          ja: "課金",
          th: "การคิดค่าธรรมเนียม",
          fi: "Laskutus",
          uk: "Облік",
          bg: "Таксуване",
          tr: "Faturalandırma",
          hu: "Számlázás",
        },
        v: {
          en: "Polls default to anonymous, publishing counts and shares but never a voter; each counted vote is POPOPX_CP_PER_POLL=1 and the card itself is POPOPX_CP_PER_CARD=1.",
          ru: "Опросы по умолчанию анонимны: публикуются только количества и доли, но никогда голосующий; каждый зачтённый голос стоит POPOPX_CP_PER_POLL=1, а сама карточка — POPOPX_CP_PER_CARD=1.",
          de: "Votes sind standardmäßig anonym: veröffentlicht werden Anzahlen und Anteile, aber niemals ein Wähler; jeder gezählte Vote kostet POPOPX_CP_PER_POLL=1 und die Karte selbst POPOPX_CP_PER_CARD=1.",
          fr: "Les sondages sont anonymes par défaut : ils publient des comptes et des parts mais jamais un votant ; chaque vote compté coûte POPOPX_CP_PER_POLL=1 et la carte elle-même POPOPX_CP_PER_CARD=1.",
          it: "I sondaggi sono anonimi per impostazione predefinita: vengono pubblicati conteggi e percentuali ma mai un votante; ogni voto conteggiato costa POPOPX_CP_PER_POLL=1 e la card in sé POPOPX_CP_PER_CARD=1.",
          nl: "Polls zijn standaard anoniem: aantallen en percentages worden gepubliceerd, een stemmer nooit; elke getelde stem kost POPOPX_CP_PER_POLL=1 en de kaart zelf POPOPX_CP_PER_CARD=1.",
          cs: "Ankety jsou ve výchozím stavu anonymní: zveřejňují se počty a podíly, ale nikdy hlasující; každý započítaný hlas je POPOPX_CP_PER_POLL=1 a samotná karta je POPOPX_CP_PER_CARD=1.",
          "zh-Hans": "投票卡默认匿名：只公布各选项票数与占比，投票人身份不进结果；每张计入的票按 POPOPX_CP_PER_POLL=1，发卡本身按 POPOPX_CP_PER_CARD=1。",
          "zh-Hant": "投票卡預設匿名：只公布各選項票數與占比，投票人身分不進結果；每張計入的票依 POPOPX_CP_PER_POLL=1，發卡本身依 POPOPX_CP_PER_CARD=1。",
          es: "Las encuestas son anónimas por defecto: se publican conteos y proporciones, pero nunca un votante; cada voto contabilizado cuesta POPOPX_CP_PER_POLL=1 y la tarjeta en sí cuesta POPOPX_CP_PER_CARD=1.",
          pl: "Ankiety są domyślnie anonimowe: publikowane są liczby i udziały, ale nigdy głosujący; każdy zaliczony głos to POPOPX_CP_PER_POLL=1, a sama karta to POPOPX_CP_PER_CARD=1.",
          ja: "投票カードは既定で匿名です。公開されるのは各選択肢の票数と比率だけで、投票者の身元は結果に含まれません。計上された票1つあたり POPOPX_CP_PER_POLL=1、カード自体は POPOPX_CP_PER_CARD=1 です。",
          th: "การ์ดโพลจะไม่ระบุตัวตนโดยค่าเริ่มต้น สิ่งที่เผยแพร่ออกไปคือจำนวนและสัดส่วนของแต่ละตัวเลือกเท่านั้น ตัวตนของผู้โหวตจะไม่เข้าไปในผล; แต่ละเสียงที่นับจะคิด POPOPX_CP_PER_POLL=1 และตัวการ์ดเองคิด POPOPX_CP_PER_CARD=1",
          fi: "Kyselyt ovat oletuksena anonyymeja: julkisesti ilmoitetaan luvut ja osuudet, ei koskaan äänestäjää; jokainen huomioitu ääni on POPOPX_CP_PER_POLL=1 ja kortti itsessään POPOPX_CP_PER_CARD=1.",
          uk: "Опитування типово анонімні: публікуються кількості й частки, але ніколи голосувальник; кожен зарахований голос — POPOPX_CP_PER_POLL=1, а сама картка — POPOPX_CP_PER_CARD=1.",
          bg: "Анкетите са анонимни по подразбиране: публикуват се бройки и дялове, но никога гласувалият; всеки броен глас е POPOPX_CP_PER_POLL=1, а самата картичка е POPOPX_CP_PER_CARD=1.",
          tr: "Oylama kartları varsayılan olarak anonimdir: yalnızca seçenek sayıları ve oranları yayımlanır, oy veren kişinin kimliği sonuca girmez; sayılan her oy POPOPX_CP_PER_POLL=1, kartın kendisi POPOPX_CP_PER_CARD=1.",
          hu: "A szavazások alapértelmezés szerint névtelenek: darabszámok és arányok kerülnek közzétételre, szavazó soha; minden beszámított szavazat POPOPX_CP_PER_POLL=1, maga a kártya POPOPX_CP_PER_CARD=1.",
        },
      },
    ],
    keys: [
      "POPOPX_PLUGIN_POLLS=1",
      "POPOPX_CP_PER_POLL",
      "POPOPX_CP_PER_CARD",
    ],
    route: "POST /api/v1/plugins/polls",
  },
  {
    code: "Web3 Bridge",
    file: "web3_bridge_plugin.py",
    category: "chain",
    status: "default-off",
    accent: "warn",
    name: {
      en: "On-chain watch and whitelist delivery",
      ru: "Мониторинг ончейн-активов и рассылка по белому списку",
      de: "On-Chain-Überwachung und Versand per Weißliste",
      fr: "Surveillance on-chain et envoi sur liste blanche",
      it: "Monitoraggio on-chain e invio su whitelist",
      nl: "On-chain-bewaking en levering via whitelist",
      cs: "Sledování on-chain aktiv a distribuce na whitelistu",
      "zh-Hans": "链上资产监控与白名单发卡",
      "zh-Hant": "鏈上資產監控與白名單發卡",
      es: "Vigilancia on-chain y entrega por lista blanca",
      pl: "Monitorowanie on-chain i dostarczanie na białą listę",
      ja: "オンチェーン資産の監視とホワイトリスト配信",
      th: "การเฝ้าดูออนเชนและการส่งให้รายการขาว",
      fi: "Ketjunsisäinen valvonta ja whitelist-jakelu",
      uk: "Моніторинг ончейн-активів і розсилка за білим списком",
      bg: "Наблюдение on-chain и изпращане по бял списък",
      tr: "Zincir üstü izleme ve beyaz listeye gönderim",
      hu: "On-chain figyelés és fehérlistás kiküldés",
    },
    hook: {
      en: "Read-only watching of EVM and Solana addresses: a transfer becomes a receipt card, and a private key never enters the server.",
      ru: "Наблюдение только для чтения за адресами EVM и Solana: перевод превращается в receipt-карточку, а закрытый ключ на сервер не попадает никогда.",
      de: "Reine Leseüberwachung von EVM- und Solana-Adressen: ein Eingang wird zu einer receipt-Karte, und ein privater Schlüssel betritt nie den Server.",
      fr: "Surveillance en lecture seule des adresses EVM et Solana : un virement devient une carte receipt et une clé privée n’entre jamais sur le serveur.",
      it: "Monitoraggio in sola lettura degli indirizzi EVM e Solana: un accredito diventa una card receipt e una chiave privata non entra mai nel server.",
      nl: "Alleen-lezen bewaking van EVM- en Solana-adressen: een overschrijving wordt een receipt-kaart en een privésleutel komt nooit op de server.",
      cs: "Sledování adres EVM a Solana pouze pro čtení: příchozí platba se stane kartou receipt a soukromý klíč se na server nikdy nedostane.",
      "zh-Hans": "只读监听 EVM 与 Solana 地址，把到账变成一张 receipt 卡；私钥永不进服务器。",
      "zh-Hant": "唯讀監聽 EVM 與 Solana 位址，把到帳變成一張 receipt 卡；私鑰永不進伺服器。",
      es: "Vigilancia de solo lectura de direcciones EVM y Solana: una transferencia se convierte en una tarjeta receipt y una clave privada nunca entra en el servidor.",
      pl: "Nadzór tylko do odczytu nad adresami EVM i Solana: przelew staje się kartą receipt, a klucz prywatny nigdy nie trafia na serwer.",
      ja: "EVM と Solana のアドレスを読み取り専用で監視します。着金が receipt カードに変わり、秘密鍵がサーバーに入ることは一切ありません。",
      th: "เฝ้าดูที่อยู่ EVM และ Solana แบบอ่านอย่างเดียว: การโอนเงินจะกลายเป็นการ์ด receipt และคีย์ส่วนตัวจะไม่มีวันเข้ามาในเซิร์ฟเวอร์",
      fi: "Vain lukutilassa tapahtuva EVM- ja Solana-osoitteiden valvonta: siirrosta tulee receipt-kortti, eikä yksityinen avain koskaan päädy palvelimelle.",
      uk: "Спостереження лише для читання за адресами EVM і Solana: переказ перетворюється на receipt-картку, а приватний ключ ніколи не потрапляє на сервер.",
      bg: "Наблюдение само за четене на адреси от EVM и Solana: преводът се превръща в картичка receipt, а личният ключ никога не влиза в сървъра.",
      tr: "EVM ve Solana adreslerinin yalnızca okuma şeklinde izlenmesi: gelen transfer bir receipt kartına dönüşür ve özel anahtar sunucuya asla girmez.",
      hu: "Csak olvasható módban történő figyelés EVM és Solana címeken: az érkezett átutalás receipt kártyává válik, és a privát kulcs soha nem kerül fel a szerverre.",
    },
    facts: [
      {
        k: {
          en: "Switch",
          ru: "Переключатель",
          de: "Schalter",
          fr: "Bascule",
          it: "Interruttore",
          nl: "Schakelaar",
          cs: "Přepínač",
          "zh-Hans": "开关",
          "zh-Hant": "開關",
          es: "Interruptor",
          pl: "Przełącznik",
          ja: "スイッチ",
          th: "สวิตช์",
          fi: "Kytkin",
          uk: "Перемикач",
          bg: "Превключвател",
          tr: "Anahtar",
          hu: "Kapcsoló",
        },
        v: {
          en: "Default 0: the routes are not mounted, the console row reports available false with error disabled, and only POPOPX_PLUGIN_WEB3_BRIDGE=1 brings it up.",
          ru: "Значение по умолчанию 0: маршруты не монтируются, строка в консоли показывает available false с error disabled, и только POPOPX_PLUGIN_WEB3_BRIDGE=1 поднимает плагин.",
          de: "Standardwert 0: Die Routen werden nicht eingehängt, die Konsolenzeile meldet available false mit error disabled, und nur POPOPX_PLUGIN_WEB3_BRIDGE=1 startet es.",
          fr: "Valeur par défaut 0 : les routes ne sont pas montées, la ligne de console indique available false avec error disabled, et seul POPOPX_PLUGIN_WEB3_BRIDGE=1 le démarre.",
          it: "Valore predefinito 0: le route non vengono montate, la riga della console riporta available false con error disabled, e solo POPOPX_PLUGIN_WEB3_BRIDGE=1 lo avvia.",
          nl: "Standaard 0: de routes worden niet gemount, de console-rij meldt available false met error disabled, en alleen POPOPX_PLUGIN_WEB3_BRIDGE=1 zet het aan.",
          cs: "Výchozí 0: routy se nenasadí, řádek v konzoli hlásí available false s error disabled a nastartuje ho jedině POPOPX_PLUGIN_WEB3_BRIDGE=1.",
          "zh-Hans": "默认 0：路由不挂载、后台面板里 available 为 false 且 error 记 disabled，要显式写 POPOPX_PLUGIN_WEB3_BRIDGE=1 才会起来。",
          "zh-Hant": "預設 0：路由不掛載、後台面板裡 available 為 false 且 error 記 disabled，要明確寫 POPOPX_PLUGIN_WEB3_BRIDGE=1 才會起來。",
          es: "Valor por defecto 0: las rutas no se montan, la fila de la consola informa available false con error disabled, y solo POPOPX_PLUGIN_WEB3_BRIDGE=1 lo levanta.",
          pl: "Domyślnie 0: trasy nie są montowane, wiersz w konsoli zgłasza available false z error disabled, a podnosi go wyłącznie POPOPX_PLUGIN_WEB3_BRIDGE=1.",
          ja: "既定値は 0 です。ルートはマウントされず、コンソールの行では available が false、error が disabled と表示され、POPOPX_PLUGIN_WEB3_BRIDGE=1 を書いて初めて起動します。",
          th: "ค่าเริ่มต้นคือ 0: เส้นทางจะไม่ถูกเมาต์ และแถวในคอนโซลรายงาน available เป็น false พร้อม error เป็น disabled จะมีก็แต่ POPOPX_PLUGIN_WEB3_BRIDGE=1 เท่านั้นที่ปลุกมันขึ้นมา",
          fi: "Oletusarvo 0: reittejä ei asenneta, konsolarivi ilmoittaa available arvon false ja error arvon disabled, ja vain POPOPX_PLUGIN_WEB3_BRIDGE=1 käynnistää sen.",
          uk: "Типове значення 0: маршрути не монтуються, рядок у консолі показує available false з error disabled, і лише POPOPX_PLUGIN_WEB3_BRIDGE=1 його піднімає.",
          bg: "Стойност по подразбиране 0: маршрутите не се качват, редът в конзолата сочи available false с error disabled и единствено POPOPX_PLUGIN_WEB3_BRIDGE=1 го стартира.",
          tr: "Varsayılan 0: rotalar monte edilmez, konsol satırı available false ve error disabled olarak raporlar; ancak POPOPX_PLUGIN_WEB3_BRIDGE=1 ile ayağa kalkar.",
          hu: "Alapértelmezés 0: az útvonalak nem kerülnek felcsatolásra, a konzol sora available false és error disabled értéket mutat, és csak a POPOPX_PLUGIN_WEB3_BRIDGE=1 indítja be.",
        },
      },
      {
        k: {
          en: "Watching",
          ru: "Наблюдение",
          de: "Überwachung",
          fr: "Surveillance",
          it: "Monitoraggio",
          nl: "Bewaking",
          cs: "Sledování",
          "zh-Hans": "监听",
          "zh-Hant": "監聽",
          es: "Vigilancia",
          pl: "Nadzór",
          ja: "監視",
          th: "การเฝ้าดู",
          fi: "Valvonta",
          uk: "Спостереження",
          bg: "Наблюдение",
          tr: "İzleme",
          hu: "Figyelés",
        },
        v: {
          en: "Public JSON-RPC is read every POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 (POPOPX_WEB3_EVM_RPC_URL defaults to https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL to https://api.mainnet-beta.solana.com), and any parameter whose name smells like key material is refused outright.",
          ru: "Публичный JSON-RPC опрашивается каждые POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 секунд (POPOPX_WEB3_EVM_RPC_URL по умолчанию https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL — https://api.mainnet-beta.solana.com), а любой параметр, имя которого похоже на материал ключа, отвергается сразу.",
          de: "Öffentliches JSON-RPC wird alle POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 Sekunden gelesen (POPOPX_WEB3_EVM_RPC_URL steht standardmäßig auf https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL auf https://api.mainnet-beta.solana.com), und jeder Parameter, dessen Name nach Schlüsselmaterial riecht, wird sofort abgelehnt.",
          fr: "Le JSON-RPC public est lu toutes POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 secondes (POPOPX_WEB3_EVM_RPC_URL vaut https://eth.llamarpc.com par défaut, POPOPX_WEB3_SOLANA_RPC_URL vaut https://api.mainnet-beta.solana.com), et tout paramètre dont le nom évoque une matière de clé est rejeté d’office.",
          it: "Il JSON-RPC pubblico viene letto ogni POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 secondi (POPOPX_WEB3_EVM_RPC_URL è https://eth.llamarpc.com per impostazione predefinita, POPOPX_WEB3_SOLANA_RPC_URL è https://api.mainnet-beta.solana.com) e qualsiasi parametro il cui nome sa di materiale chiave viene rifiutato senza esitazioni.",
          nl: "Openbare JSON-RPC wordt elke POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 seconden uitgelezen (POPOPX_WEB3_EVM_RPC_URL staat standaard op https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL op https://api.mainnet-beta.solana.com), en elke parameter wiens naam op sleutelmateriaal lijkt wordt meteen geweigerd.",
          cs: "Veřejný JSON-RPC se čte každých POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 sekund (POPOPX_WEB3_EVM_RPC_URL je výchozí https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL https://api.mainnet-beta.solana.com) a jakýkoli parametr, jehož název připomíná klíčový materiál, se okamžitě odmítne.",
          "zh-Hans": "每 POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 秒读一次公开 JSON-RPC（POPOPX_WEB3_EVM_RPC_URL 默认 https://eth.llamarpc.com，POPOPX_WEB3_SOLANA_RPC_URL 默认 https://api.mainnet-beta.solana.com）；任何参数名一旦像密钥材料就被直接拒绝。",
          "zh-Hant": "每 POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 秒讀取一次公開 JSON-RPC（POPOPX_WEB3_EVM_RPC_URL 預設 https://eth.llamarpc.com，POPOPX_WEB3_SOLANA_RPC_URL 預設 https://api.mainnet-beta.solana.com）；任何參數名一旦像金鑰材料就被直接拒絕。",
          es: "El JSON-RPC público se lee cada POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 segundos (POPOPX_WEB3_EVM_RPC_URL vale https://eth.llamarpc.com por defecto y POPOPX_WEB3_SOLANA_RPC_URL vale https://api.mainnet-beta.solana.com), y cualquier parámetro cuyo nombre huela a material de clave se rechaza de plano.",
          pl: "Publiczny JSON-RPC jest odczytywany co POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 sekund (POPOPX_WEB3_EVM_RPC_URL ma domyślnie https://eth.llamarpc.com, a POPOPX_WEB3_SOLANA_RPC_URL https://api.mainnet-beta.solana.com), a każdy parametr, którego nazwa przypomina materiał klucza, jest odrzucany bezwzględnie.",
          ja: "公開 JSON-RPC は POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 秒ごとに読み込まれます（POPOPX_WEB3_EVM_RPC_URL の既定値は https://eth.llamarpc.com、POPOPX_WEB3_SOLANA_RPC_URL の既定値は https://api.mainnet-beta.solana.com）。名前の雰囲気が鍵の材料を思わせるパラメータは例外なく拒否されます。",
          th: "จะอ่าน JSON-RPC สาธารณะทุก POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 วินาที (POPOPX_WEB3_EVM_RPC_URL ค่าเริ่มต้นคือ https://eth.llamarpc.com ส่วน POPOPX_WEB3_SOLANA_RPC_URL คือ https://api.mainnet-beta.solana.com) และพารามิเตอร์ที่ชื่อออกแนวเป็นวัสดุคีย์จะถูกปฏิเสธทันที",
          fi: "Julkista JSON-RPC:ä luetaan joka POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 sekunti (POPOPX_WEB3_EVM_RPC_URL on oletuksena https://eth.llamarpc.com ja POPOPX_WEB3_SOLANA_RPC_URL https://api.mainnet-beta.solana.com), ja jokainen parametri, jonka nimi muistuttaa avainmateriaalia, hylätään heti.",
          uk: "Публічний JSON-RPC читають кожні POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 секунд (POPOPX_WEB3_EVM_RPC_URL типово https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL — https://api.mainnet-beta.solana.com), а будь-який параметр, назва якого нагадує ключовий матеріал, відкидається одразу.",
          bg: "Публичният JSON-RPC се чете на всеки POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 секунди (POPOPX_WEB3_EVM_RPC_URL е по подразбиране https://eth.llamarpc.com, а POPOPX_WEB3_SOLANA_RPC_URL е https://api.mainnet-beta.solana.com), и всеки параметър, чието име напомня за ключов материал, се отхвърля без колебание.",
          tr: "Genel JSON-RPC her POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 saniyede bir okunur (POPOPX_WEB3_EVM_RPC_URL varsayılan olarak https://eth.llamarpc.com, POPOPX_WEB3_SOLANA_RPC_URL ise https://api.mainnet-beta.solana.com) ve adı anahtar malzemesini andıran herhangi bir parametre kesinlikle reddedilir.",
          hu: "A nyilvános JSON-RPC-t minden POPOPX_WEB3_POLL_INTERVAL_SECONDS=30 másodpercbel elolvassuk (a POPOPX_WEB3_EVM_RPC_URL alapértelmezése https://eth.llamarpc.com, a POPOPX_WEB3_SOLANA_RPC_URL-é https://api.mainnet-beta.solana.com), és minden paramétert, amelynek neve kulcsanyagra utal, határozottan elutasítunk.",
        },
      },
      {
        k: {
          en: "Whitelist",
          ru: "Белый список",
          de: "Weißliste",
          fr: "Liste blanche",
          it: "Lista bianca",
          nl: "Witte lijst",
          cs: "Seznam povolených",
          "zh-Hans": "白名单",
          "zh-Hant": "白名單",
          es: "Lista blanca",
          pl: "Biała lista",
          ja: "ホワイトリスト",
          th: "รายการอนุญาต",
          fi: "Sallittujen lista",
          uk: "Білий список",
          bg: "Бял списък",
          tr: "Beyaz liste",
          hu: "Fehérlista",
        },
        v: {
          en: "POST /api/v1/plugins/web3/whitelist claims an address as a member of a channel, and the poll loop honours that promise by handing the epoch key over in a channel_key_update; chain events cost POPOPX_CP_PER_WEB3_EVENT=1 and a replayed receipt charges nothing at all.",
          ru: "POST /api/v1/plugins/web3/whitelist заверяет, что адрес — участник канала, и цикл опроса исполняет это обещание, передавая ключ эпохи в channel_key_update; событие в цепи стоит POPOPX_CP_PER_WEB3_EVENT=1, а повторный receipt не стоит ничего.",
          de: "POST /api/v1/plugins/web3/whitelist erklärt eine Adresse zum Kanalmitglied, und der Poll-Loop löst dieses Versprechen ein, indem er den Epoch-Schlüssel in einem channel_key_update übergibt; Kettenereignisse kosten POPOPX_CP_PER_WEB3_EVENT=1 und ein wiederholter receipt kostet gar nichts.",
          fr: "POST /api/v1/plugins/web3/whitelist engage la parole qu’une adresse est membre d’un canal, et la boucle de sondage tient cet engagement en remettant la clé d’époque dans un channel_key_update ; un événement on-chain coûte POPOPX_CP_PER_WEB3_EVENT=1 et un receipt rejoué ne coûte absolument rien.",
          it: "POST /api/v1/plugins/web3/whitelist dichiara un indirizzo come membro di un canale, e il loop di polling onora quell’impegno passando la chiave di epoca in un channel_key_update; gli eventi on-chain costano POPOPX_CP_PER_WEB3_EVENT=1 e una receipt rigiocata non costa nulla.",
          nl: "POST /api/v1/plugins/web3/whitelist claimt een adres als lid van een kanaal, en de poll-loop lost die belofte in door de epochsleutel door te geven in een channel_key_update; ketenevents kosten POPOPX_CP_PER_WEB3_EVENT=1 en een herhaalde receipt kost niets.",
          cs: "POST /api/v1/plugins/web3/whitelist prohlásí adresu za člena kanálu a dotazovací smyčka ten slib splní předáním epochového klíče v channel_key_update; události v řetězci stojí POPOPX_CP_PER_WEB3_EVENT=1 a opakovaný receipt nezúčtuje vůbec nic.",
          "zh-Hans": "POST /api/v1/plugins/web3/whitelist 把 (chain, address, channel_id) 认成频道成员，新的 Epoch 密钥由后台轮询以 channel_key_update 派发；链上事件按 POPOPX_CP_PER_WEB3_EVENT=1 计量，重放的回执分文不取。",
          "zh-Hant": "POST /api/v1/plugins/web3/whitelist 把 (chain, address, channel_id) 認成頻道成員，新的 Epoch 金鑰由背景輪詢以 channel_key_update 派發；鏈上事件依 POPOPX_CP_PER_WEB3_EVENT=1 計量，重放的回執分文不取。",
          es: "POST /api/v1/plugins/web3/whitelist reclama una dirección como miembro de un canal, y el bucle de consulta cumple esa promesa entregando la clave de época en un channel_key_update; los eventos de la cadena cuestan POPOPX_CP_PER_WEB3_EVENT=1 y un recibo rejugado no cuesta nada.",
          pl: "POST /api/v1/plugins/web3/whitelist deklaruje adres jako członka kanału, a pętla odpytująca dotrzymuje tej obietnicy, przekazując klucz epoki w channel_key_update; zdarzenia łańcuchowe kosztują POPOPX_CP_PER_WEB3_EVENT=1, a odtworzony paragon nie kosztuje nic.",
          ja: "POST /api/v1/plugins/web3/whitelist はアドレスをチャンネルの成員だと宣言し、ポーリングループはその約束を果たす形で channel_key_update の中でエポック鍵を手渡します。オンチェーンイベントは POPOPX_CP_PER_WEB3_EVENT=1 で計量され、再送された受領通知はまったく課金されません。",
          th: "POST /api/v1/plugins/web3/whitelist รับรองว่าที่อยู่นี้เป็นสมาชิกของแชนแนล และลูปการสอบถามก็รักษาสัญญานั้นด้วยการส่งมอบคีย์ Epoch ไปใน channel_key_update เหตุการณ์ออนเชนคิด POPOPX_CP_PER_WEB3_EVENT=1 ส่วนใบเสร็จที่ถูกส่งซ้ำไม่คิดอะไรเลย",
          fi: "POST /api/v1/plugins/web3/whitelist ilmoittaa osoitteen kanavan jäseneksi, ja kyselysilmukka lunastaa tuon lupauksen luovuttamalla epoch-avaimen channel_key_update-viestissä; ketjutapahtumat maksavat POPOPX_CP_PER_WEB3_EVENT=1 ja toistettu kuitti ei maksa lainkaan.",
          uk: "POST /api/v1/plugins/web3/whitelist заявляє адресу як учасника каналу, і цикл опиту виконує цю обіцянку, передаючи ключ епохи в channel_key_update; подія в мережі коштує POPOPX_CP_PER_WEB3_EVENT=1, а повторний receipt не коштує взагалі нічого.",
          bg: "POST /api/v1/plugins/web3/whitelist обявява адрес за член на канал и цикълът на допитване изпълнява това обещание, като предава ключа на епохата в channel_key_update; събитията от веригата струват POPOPX_CP_PER_WEB3_EVENT=1, а повторен receipt не струва нищо.",
          tr: "POST /api/v1/plugins/web3/whitelist bir adresi kanal üyesi olarak taahhüt eder ve yoklama döngüsü bu sözü, epoch anahtarını bir channel_key_update içinde teslim ederek tutar; zincir olayları POPOPX_CP_PER_WEB3_EVENT=1 tutar ve yeniden gönderilen makbuz hiç ücretlendirilmez.",
          hu: "A POST /api/v1/plugins/web3/whitelist azt ígéri, hogy a cím egy csatorna tagja, és a lekérdező ciklus be is tartja ezt az ígéretet: az epochakulcsot egy channel_key_update keretében adja át; a láncesemények POPOPX_CP_PER_WEB3_EVENT=1-be kerülnek, egy replayelt receipt pedig egyáltalán nem számít fel díjat.",
        },
      },
    ],
    keys: [
      "POPOPX_PLUGIN_WEB3_BRIDGE=0",
      "POPOPX_WEB3_EVM_RPC_URL",
      "POPOPX_WEB3_SOLANA_RPC_URL",
      "POPOPX_WEB3_POLL_INTERVAL_SECONDS",
      "POPOPX_CP_PER_WEB3_EVENT",
    ],
    route: "POST /api/v1/plugins/web3/watchers",
  },
];

const ACCENT_BAR: Record<PluginModel["accent"], string> = {
  brand: "bg-brand-soft",
  mesh: "bg-mesh-soft",
  warn: "bg-warn",
};
/**
 * The two answers every card owes the visitor that are identical for all five
 * modules, because the gateway really does not vary them: authorisation is one
 * static bearer token with no scope model (`gateway/app/api/admin.py`,
 * `AUTH_HEADER = "Authorization"`), and turning a service off is the
 * `POPOPX_PLUGIN_*` boolean read at `gateway/app/config.py:441-445`. Written as
 * one block rather than five, so the page cannot accidentally promise a
 * per-connection revocation the code does not have.
 */
const CREDENTIAL_NOTE: Localized<string> = {
  en: "No scope model and no per-key ACL: every call under /api/v1/plugins/* is authorised by one static bearer token, POPOPX_ADMIN_TOKEN, presented in the Authorization header. What the module brings of its own is only the environment keys listed below.",
  ru: "Никакой модели доменов доступа и никакого ACL по ключам: каждый вызов в /api/v1/plugins/* авторизует один статичный bearer-токен POPOPX_ADMIN_TOKEN в заголовке Authorization. Собственные секреты модуля — только перечисленные ниже переменные окружения.",
  de: "Kein Scope-Modell, keine ACL pro Schlüssel: Jeden Aufruf unter /api/v1/plugins/* autorisiert ein einzelner statischer Bearer-Token, POPOPX_ADMIN_TOKEN, im Authorization-Header. Was das Modul selbst mitbringt, sind nur die unten genannten Umgebungsschlüssel.",
  fr: "Aucun modèle de portées ni d’ACL par clé : chaque appel sous /api/v1/plugins/* est autorisé par un unique jeton bearer statique, POPOPX_ADMIN_TOKEN, présenté dans l’en-tête Authorization. Les secrets propres au module se limitent aux variables d’environnement listées ci-dessous.",
  it: "Nessun modello di scope e nessuna ACL per singola chiave: ogni chiamata sotto /api/v1/plugins/* è autorizzata da un unico token bearer statico, POPOPX_ADMIN_TOKEN, presentato nell’header Authorization. I segreti propri del modulo sono solo le variabili d’ambiente elencate qui sotto.",
  nl: "Geen scopemodel en geen ACL per sleutel: elke aanroep onder /api/v1/plugins/* wordt geautoriseerd door één statisch bearertoken, POPOPX_ADMIN_TOKEN, in de Authorization-header. Wat de module zelf meebrengt zijn alleen de hieronder genoemde omgevingsvariabelen.",
  cs: "Žádný model oprávnění a žádné ACL per key: každý požadavek pod /api/v1/plugins/* autorizuje jeden statický bearer token, POPOPX_ADMIN_TOKEN, v hlavičce Authorization. Vlastní tajné údaje modulu jsou jen níže uvedené proměnné prostředí.",
  "zh-Hans": "没有权限范围（scope）模型，也没有按 key 的 ACL：/api/v1/plugins/* 下的每一次调用都只由一个静态 bearer token 授权，也就是 Authorization 头里的 POPOPX_ADMIN_TOKEN。模块自己带来的密钥只有下面列出的那几颗环境变量。",
  "zh-Hant": "沒有權限範圍（scope）模型，也沒有按 key 的 ACL：/api/v1/plugins/* 下的每次呼叫都只由一個靜態 bearer token 授權，也就是 Authorization 標頭裡的 POPOPX_ADMIN_TOKEN。模組自帶的金鑰只有下面列出的那幾顆環境變數。",
  es: "No hay modelo de alcances ni ACL por clave: cada llamada bajo /api/v1/plugins/* la autoriza un único token bearer estático, POPOPX_ADMIN_TOKEN, en la cabecera Authorization. Lo que el módulo aporta por su parte son solo las variables de entorno listadas abajo.",
  pl: "Brak modelu zakresów i brak ACL per klucz: każde wywołanie pod /api/v1/plugins/* autoryzuje jeden statyczny token bearer, POPOPX_ADMIN_TOKEN, w nagłówku Authorization. Własne sekrety modułu to tylko wymienione niżej zmienne środowiskowe.",
  ja: "スコープの模型もキー単位の ACL もありません。/api/v1/plugins/* 配下の呼び出しはすべて、Authorization ヘッダーで送る静的な bearer トークン POPOPX_ADMIN_TOKEN ひとつで認可されます。モジュール自身が持つ秘密情報は、下に並べた環境変数だけです。",
  th: "ไม่มีโมเดล scope และไม่มีการตั้ง ACL ต่อคีย์: การเรียกใช้ใต้ /api/v1/plugins/* ทุกครั้งได้รับอนุญาตด้วย bearer token สถิติตัวเดียวคือ POPOPX_ADMIN_TOKEN ที่ส่งใน header Authorization ความลับของโม듈เองมีแค่ตัวแปรแวดล้อมที่ระบุไว้ข้างล่าง",
  fi: "E scope-mallia eikä ACL:ia avainta kohden: jokaisen /api/v1/plugins/* -polun kutsun valtuuttaa yksi staattinen bearer-token, POPOPX_ADMIN_TOKEN, Authorization-otsakkeessa. Moduulin omat salaisuudet ovat vain alla luetellut ympäristömuuttujat.",
  uk: "Жодної моделі доменів доступу й жодного ACL за ключем: кожен виклик у /api/v1/plugins/* авторизує один статичний bearer-токен POPOPX_ADMIN_TOKEN у заголовку Authorization. Власні секрети модуля — це лише перелічені нижче змінні середовища.",
  bg: "Няма модел на обхвата и няма ACL по ключ: всяко извикване под /api/v1/plugins/* се оторизира от един статичен bearer токен, POPOPX_ADMIN_TOKEN, в заглавката Authorization. Собствените тайни на модула са само изброените по-долу променливи на средата.",
  tr: "Kapsam modeli de anahtar başına ACL de yok: /api/v1/plugins/* altındaki her çağrıyı, Authorization başlığıyla gösterilen tek sabit bearer token olan POPOPX_ADMIN_TOKEN yetkilendirir. Modülün kendine ait sırları yalnızca aşağıda listelenen ortam değişkenleridir.",
  hu: "Nincs scope-modell és kulcsenkénti ACL sem: a /api/v1/plugins/* alatti minden hívást egyetlen statikus bearer token jogosítja, az Authorization fejlécben elküldött POPOPX_ADMIN_TOKEN. A modul saját titkai csak az alább felsorolt környezeti változók.",
};

const REVOKE_NOTE: Localized<string> = {
  en: "Revocation is a switch, not a key list: set the module's POPOPX_PLUGIN_* boolean to 0 and restart the gateway; GET /api/v1/plugins then reports the module disabled and its routes stop answering. There is nothing to revoke per connection, because no per-connection credential is ever handed out.",
  ru: "Отзыв — это переключатель, а не список ключей: поставьте булев POPOPX_PLUGIN_* модуля в 0 и перезапустите шлюз; после этого GET /api/v1/plugins показывает модуль отключённым, а его маршруты перестают отвечать. Отзывать что-то отдельно для соединения нечего — учётных данных на соединение никто не выдаёт.",
  de: "Widerruf ist ein Schalter, keine Schlüsselliste: setze das POPOPX_PLUGIN_*-Boolean des Moduls auf 0 und starten das Gateway neu; danach meldet GET /api/v1/plugins das Modul als disabled und seine Routen antworten nicht mehr. Pro Verbindung gibt es nichts zu widerrufen, weil nie eine Berechtigung pro Verbindung ausgegeben wird.",
  fr: "La révocation est un interrupteur, pas une liste de clés : passez le booléen POPOPX_PLUGIN_* du module à 0 et redémarrez la passerelle ; ensuite GET /api/v1/plugins annonce le module désactivé et ses routes cessent de répondre. Rien n’est révocable connexion par connexion, aucun identifiant de connexion n’étant jamais distribué.",
  it: "La revoca è un interruttore, non un elenco di chiavi: imposta a 0 il booleano POPOPX_PLUGIN_* del modulo e riavvia il gateway; poi GET /api/v1/plugins segnala il modulo disattivato e le sue route non rispondono più. Non c’è nulla da revocare per singola connessione, perché nessuna credenziale per connessione viene distribuita.",
  nl: "Intrekken is een schakelaar, geen sleutellijst: zet de POPOPX_PLUGIN_*-boolean van de module op 0 en start de gateway opnieuw; daarna meldt GET /api/v1/plugins de module als uitgeschakeld en zijn routes stoppen met antwoorden. Er is per verbinding niets in te trekken, omdat er nooit een credential per verbinding wordt uitgegeven.",
  cs: "Zrušení je přepínač, ne seznam klíčů: dejte boolean POPOPX_PLUGIN_* modulu na 0 a restartujte gateway; pak GET /api/v1/plugins hlásí modul vypnutý a jeho routes přestanou odpovídat. Po jednotlivých spojení není co zrušit, protože žádné pověření na spojení se nikdy nevydává.",
  "zh-Hans": "撤销是一个开关，不是一份 key 清单：把该模块的 POPOPX_PLUGIN_* 布尔量置 0 并重启网关，GET /api/v1/plugins 就会把它报成 disabled，它的接口也不再应答。没有「按连接撤销」这回事，因为系统从来不会按连接下发凭证。",
  "zh-Hant": "撤銷是一個開關，不是一份 key 清單：把該模組的 POPOPX_PLUGIN_* 布林值設為 0 並重啟閘道，GET /api/v1/plugins 就會把它報成 disabled，它的介面也不再應答。沒有「按連線撤銷」這回事，因為系統從來不會按連線下發憑證。",
  es: "Revocar es un interruptor, no una lista de claves: pon el booleano POPOPX_PLUGIN_* del módulo en 0 y reinicia la pasarela; entonces GET /api/v1/plugins informa el módulo desactivado y sus rutas dejan de responder. No hay nada que revocar por conexión, porque nunca se entrega ninguna credencial por conexión.",
  pl: "Odwołanie to przełącznik, nie lista kluczy: ustaw wartość logiczną POPOPX_PLUGIN_* modułu na 0 i uruchom bramę ponownie; wtedy GET /api/v1/plugins zgłasza moduł jako wyłączony, a jego trasy przestają odpowiadać. Nie ma czego odwoływać dla poszczególnego połączenia, bo żadne poświadczenie na połączenie nigdy nie jest wydawane.",
  ja: "取り消しはスイッチであって、鍵のリストではありません。そのモジュールの POPOPX_PLUGIN_* ブール値を 0 にしてゲートウェイを再起動すれば、GET /api/v1/plugins は disabled を返し、そのルートは応答をやめます。接続単位の資格情報はそもそも配布されないため、接続単位で取り消すものは存在しません。",
  th: "การเพิกถอนคือสวิตช์ ไม่ใช่รายการคีย์: ตั้งค่า boolean POPOPX_PLUGIN_* ของโม듈เป็น 0 แล้วรีสตาร์ทเกตเวย์ จากนั้น GET /api/v1/plugins จะรายงานโม듈เป็น disabled และรูตของมันหยุดตอบ ไม่มีอะไรให้เพิกถอนทีละการเชื่อมต่อ เพราะไม่มีการจ่ายสิทธิ์ยืนยันเฉพาะการเชื่อมต่อตั้งแต่แรก",
  fi: "Peruutus on kytkin eikä avainlista: aseta moduulin POPOPX_PLUGIN_*-totuusarvo 0:aan ja käynnistä gateway uudelleen; sen jälkeen GET /api/v1/plugins ilmoittaa moduulin poistetuksi eikä sen reitit vastaa. Yksittäistä yhteyttä ei ole mitä peruuttaa, koska yhteyskohtaisia tunnuksia ei jaeta ollenkaan.",
  uk: "Відкликання — це перемикач, а не перелік ключів: поставте булеве значення POPOPX_PLUGIN_* модуля на 0 і перезапустіть шлюз; після цього GET /api/v1/plugins повідомляє, що модуль вимкнено, а його маршрути перестють відповідати. Відкликати щось окремо для з'єднання нічого, бо жодних облікових даних на з'єднання не видають.",
  bg: "Отменянето е превключвател, не списък с ключове: сложете булевата POPOPX_PLUGIN_* на модула на 0 и рестартирайте шлюза; след това GET /api/v1/plugins отчита модула като изключен и маршрутите му спират да отговарят. Няма какво да се отменя на ниво връзка, защото никога не се издават удостоверения за конкретна връзка.",
  tr: "İptal bir anahtardır, anahtar listesi değil: modülün POPOPX_PLUGIN_* boolean değerini 0 yapın ve ağ geçidini yeniden başlatın; ardından GET /api/v1/plugins modülü disabled olarak bildirir ve rotaları yanıt vermeyi bırakır. Bağlantı bazında iptal edilecek bir şey yok, çünkü bağlantı bazında hiçbir kimlik bilgisi dağıtılmıyor.",
  hu: "A visszavonás kapcsoló, nem kulcslista: állítsd a modul POPOPX_PLUGIN_* logikai értékét 0-ra, és indítsd újra az átkapcsolót; ezután a GET /api/v1/plugins letiltottként jelzi a modult, az útvonalai pedig nem válaszolnak többé. Kapcsolatonként nincs visszavonható dolog, mert kapcsolatonként sosem adunk ki hitelesítőt.",
};

function CardRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 text-[13px] leading-relaxed text-mute">{children}</dd>
    </div>
  );
}

function PluginPanel({ model, index }: { model: PluginModel; index: number }): ReactElement {
  const { locale } = useLocale();
  const name = useCopy(model.name);
  const hook = useCopy(model.hook);
  const capability = useCopy(Q_CAPABILITY);
  const credential = useCopy(Q_CREDENTIAL);
  const dataflow = useCopy(Q_DATAFLOW);
  const revocation = useCopy(Q_REVOKE);
  const credentialNote = useCopy(CREDENTIAL_NOTE);
  const revocationNote = useCopy(REVOKE_NOTE);
  const shipLabel = useCopy(STATE_LABEL);
  const shipWord = useCopy(SHIP_WORD[model.status]);
  const categoryLabel = useCopy(CATEGORY_COPY[model.category]);
  const keysLabel = useCopy(KEYS_LABEL);
  const routeLabel = useCopy(ROUTE_LABEL);
  const fileLabel = useCopy(FILE_LABEL);
  const on = model.status === "default-on";
  const number = String(index + 1).padStart(2, "0");

  return (
    <article className="glass glass-hover relative flex flex-col overflow-hidden p-5 sm:p-6">
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px ${ACCENT_BAR[model.accent]} opacity-60`}
      />
      <header className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em] text-faint">
            {number} / {model.code}
          </p>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug text-white">{name}</h3>
        </div>
        <span className="pill shrink-0 whitespace-nowrap">
          <StatusDot tone={on ? "brand" : "warn"} pulse={on} />
          <span className="text-[11px]">
            {shipLabel} · {shipWord}
          </span>
        </span>
      </header>

      <p className="mt-2 text-[11.5px] font-medium tracking-[0.14em] text-brand-soft uppercase">
        {categoryLabel}
      </p>

      <dl className="mt-5 space-y-4">
        <CardRow label={capability}>{hook}</CardRow>
        <CardRow label={credential}>
          {credentialNote}
          <span className="eyebrow mt-3 block">{keysLabel}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            {model.keys.map((key) => (
              <code key={key} className="chip font-mono text-[10.5px] text-brand-soft">
                {key}
              </code>
            ))}
          </span>
        </CardRow>
        <CardRow label={dataflow}>
          <span className="block space-y-2">
            {model.facts.map((fact) => (
              <span key={pick(fact.k, locale)} className="block">
                <span className="font-mono text-[11px] text-faint">{pick(fact.k, locale)}</span>
                <span className="mt-0.5 block">{pick(fact.v, locale)}</span>
              </span>
            ))}
          </span>
        </CardRow>
        <CardRow label={revocation}>{revocationNote}</CardRow>
      </dl>

      <div className="hairline-top mt-auto pt-4 text-[11px] text-faint">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span>
            {routeLabel}
            <code className="ml-1.5 font-mono text-mesh-soft">{model.route}</code>
          </span>
          <span aria-hidden>|</span>
          <span>
            {fileLabel}
            <code className="ml-1.5 font-mono">{model.file}</code>
          </span>
        </div>
      </div>
    </article>
  );
}

function StepCard({
  number,
  title,
  copy,
}: {
  readonly number: string;
  readonly title: string;
  readonly copy: string;
}): ReactElement {
  return (
    <li className="glass-inset relative p-4">
      <p className="font-mono text-[11px] tracking-[0.18em] text-brand-soft">{number}</p>
      <h4 className="mt-1.5 text-[13.5px] font-semibold leading-snug text-white">{title}</h4>
      <p className="mt-2 text-[12.5px] leading-relaxed text-mute">{copy}</p>
    </li>
  );
}

export function PluginsShowcase(): ReactElement {
  const { locale } = useLocale();
  const [filter, setFilter] = useState<FilterValue>(CATEGORY_ALL);
  const legendSource = useCopy(LEGEND_SOURCE);
  const legendMeter = useCopy(LEGEND_METER);
  const legendDisabled = useCopy(LEGEND_DISABLED);
  const filterLabel = useCopy(FILTER_LABEL);
  const filterAria = useCopy(FILTER_ARIA);
  const roadmapLabel = useCopy(ROADMAP_LABEL);
  const roadmapTitle = useCopy(ROADMAP_TITLE);
  const roadmapSub = useCopy(ROADMAP_SUB);
  const roadmapNeeds = useCopy(ROADMAP_NEEDS);
  const roadmapNoDate = useCopy(ROADMAP_NO_DATE);
  const roadmapShipped = useCopy(ROADMAP_SHIPPED_NOTE);
  const stepsTitle = useCopy(STEPS_TITLE);
  const step1Title = useCopy(STEP_1_TITLE);
  const step1Copy = useCopy(STEP_1_COPY);
  const step2Title = useCopy(STEP_2_TITLE);
  const step2Copy = useCopy(STEP_2_COPY);
  const step3Title = useCopy(STEP_3_TITLE);
  const step3Copy = useCopy(STEP_3_COPY);
  const step4Title = useCopy(STEP_4_TITLE);
  const step4Copy = useCopy(STEP_4_COPY);
  const census = useCopy(CENSUS_TEXT);
  const footerTitle = useCopy(FOOTER_TITLE);
  const footerBody = useCopy(FOOTER_BODY);
  const sampleCaption = useCopy(FOOTER_SAMPLE_CAPTION);

  const visible = PLUGINS.filter(
    (model) => filter === CATEGORY_ALL || model.category === filter,
  );

  return (
    <section id="plugins" className="relative py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-[0.06]" />
      <div className="section-wrap relative">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="pill">{legendSource}</span>
          <span className="pill">{legendMeter}</span>
          <span className="pill">
            <StatusDot tone="warn" />
            {legendDisabled}
          </span>
        </div>

        <div className="glass mt-8 p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold text-white">{stepsTitle}</h3>
          <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StepCard number="01" title={step1Title} copy={step1Copy} />
            <StepCard number="02" title={step2Title} copy={step2Copy} />
            <StepCard number="03" title={step3Title} copy={step3Copy} />
            <StepCard number="04" title={step4Title} copy={step4Copy} />
          </ol>
        </div>

        <div
          role="group"
          aria-label={filterAria}
          className="mt-8 flex flex-wrap items-center gap-2"
        >
          <span className="eyebrow mr-1">{filterLabel}</span>
          {FILTER_CHIPS.map((chip) => {
            const active = chip.value === filter;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setFilter(chip.value)}
                aria-pressed={active}
                className={`pill transition ${
                  active ? "!border-brand-soft/60 !bg-brand/20 text-white" : "text-mute"
                } ${FOCUS}`}
              >
                {pick(chip.copy, locale)}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visible.map((model, index) => (
            <PluginPanel key={model.code} model={model} index={index} />
          ))}
        </div>

        <div className="glass mt-6 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="pill">
              <StatusDot tone="alert" />
              {roadmapLabel}
            </span>
            <h3 className="text-[15px] font-semibold text-white">{roadmapTitle}</h3>
          </div>
          <p className="mt-2.5 text-[13px] leading-relaxed text-mute">{roadmapSub}</p>
          <ul className="mt-5 space-y-4">
            {ROADMAP.map((item) => (
              <li key={item.brand} className="glass-inset p-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <code className="font-mono text-[11.5px] text-warn">{item.brand}</code>
                  <span className="text-[13.5px] font-medium text-white">
                    {pick(item.label, locale)}
                  </span>
                </div>
                <p className="eyebrow mt-3">{roadmapNeeds}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute">
                  {pick(item.caption, locale)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12.5px] leading-relaxed text-faint">{roadmapNoDate}</p>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-faint">{roadmapShipped}</p>
        </div>

        <div className="glass mt-4 grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div>
            <h3 className="text-[15px] font-semibold text-white">{footerTitle}</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-mute">{footerBody}</p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-faint">{census}</p>
          </div>
          <CodeBlock code={PLUGIN_STATUS_SAMPLE} caption={sampleCaption} maxHeightClass="max-h-56" />
        </div>
      </div>
    </section>
  );
}
