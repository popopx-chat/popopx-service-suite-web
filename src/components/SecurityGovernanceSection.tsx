"use client";

import { useMemo, useState, type ReactElement } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Security and permission governance.
 *
 * This is the honesty bucket of the portal. The product story for a section like
 * this normally promises signed webhooks, scoped API keys, a credential vault and
 * a gateway-wide rate limiter; none of those four exist in v1.0.0. So every row
 * below says what the code actually does — a static bearer token compared in
 * constant time, a fail-closed webhook token, one real HMAC on H5 launch, an
 * append-only ledger — and the missing control is named as missing and marked
 * `planned`, never quietly dropped. Env names, header names, HTTP codes and file
 * paths stay untranslated; only the prose is authored in all 18 languages.
 */

type L = Localized<string>;
type RowState = "shipped" | "planned";
type Filter = "all" | RowState;

type Row = {
  readonly k: L;
  readonly v: L;
  readonly state: RowState;
};

type PanelLink = { readonly href: string; readonly label: L };

type Panel = {
  readonly id: string;
  readonly code: string;
  readonly glyph: readonly string[];
  readonly name: L;
  readonly hook: L;
  readonly rows: readonly Row[];
  readonly keys: readonly string[];
  readonly sample?: string;
  readonly sampleCaption?: L;
  readonly link?: PanelLink;
  readonly wide?: boolean;
  readonly accent: "brand" | "mesh" | "warn";
};

/** Shared focus ring, identical to the one Navbar, Footer and LanguageMenu use. */
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/70";

const EYEBROW: L = {
  en: "Security & permission governance",
  ru: "Безопасность и разграничение прав",
  de: "Sicherheit und Rechteverwaltung",
  fr: "Sécurité et gestion des droits",
  it: "Sicurezza e gestione dei permessi",
  nl: "Beveiliging en rechtenbeheer",
  cs: "Bezpečnost a správa oprávnění",
  "zh-Hans": "安全与权限治理",
  "zh-Hant": "安全與權限治理",
  es: "Seguridad y gestión de permisos",
  pl: "Bezpieczeństwo i zarządzanie uprawnieniami",
  ja: "セキュリティと権限ガバナンス",
  th: "ความปลอดภัยและการกำกับสิทธิ์",
  fi: "Turvallisuus ja käyttöoikeushallinta",
  uk: "Безпека та керування правами",
  bg: "Сигурност и управление на правата",
  tr: "Güvenlik ve yetki yönetişimi",
  hu: "Biztonság és jogosultságkezelés",
};

const TITLE: L = {
  en: "Tokens, a constant-time compare and an append-only ledger guard this gateway — no vault, no scopes, no signed webhook yet",
  ru: "Этот шлюз охраняют токены, сравнение за постоянное время и лишь-дописываемый реестр — ни хранилища, ни скоупов, ни подписанных вебхуков пока нет",
  de: "Dieses Gateway sichern Tokens, ein Vergleich mit konstanter Laufzeit und ein anhängendes Hauptbuch — kein Vault, keine Scopes, keine signierten Webhooks (noch nicht)",
  fr: "Ce gateway est gardé par des jetons, une comparaison à temps constant et un registre append-only — ni coffre, ni scopes, ni webhook signé pour l’instant",
  it: "Questo gateway è difeso da token, un confronto a tempo costante e un registro append-only: niente caveau, niente scope, nessun webhook firmato (per ora)",
  nl: "Deze gateway wordt bewaakt door tokens, een vergelijking met constante looptijd en een append-only grootboek — geen kluis, geen scopes, geen ondertekende webhooks (nog niet)",
  cs: "Tuhle bránu chrání tokeny, porovnání se stálým časem a append-only deník — žádný trezor, žádná oprávnění, žádné podepsané webhooky (zatím)",
  "zh-Hans": "守着网关的是静态令牌、常数时间比对和一张只追加的账本——没有凭据保险库，没有权限范围，也还没有签名 webhook",
  "zh-Hant": "守著閘道的是靜態權杖、常數時間比對和一張只追加的帳本——沒有憑證保險庫，沒有權限範圍，也還沒有簽名 webhook",
  es: "Lo que custodia esta pasarela son tokens, una comparación de tiempo constante y un libro append-only: sin bóveda, sin scopes, sin webhook firmado (aún)",
  pl: "Tę bramę strzegą tokeny, porównanie w stałym czasie i dziennik tylko-do-dopisywania — brak sejfu, brak zakresów uprawnień, brak podpisanych webhooków (jeszcze)",
  ja: "このゲートウェイを守るのはトークンと定数時間の比較、追記専用の台帳です。鍵の保管庫もスコープも署名付き Webhook もまだありません",
  th: "สิ่งที่เฝ้าเกตเวย์นี้คือโทเคน การเทียบแบบคงเวลา และบัญชีแบบต่อท้ายเท่านั้น ยังไม่มีคลังเก็บคีย์ ไม่มี scope และไม่มีการเซ็น webhook",
  fi: "Tätä gatewayta vartioivat tokenit, vakioaikainen vertailu ja vain-liitettävä kirjanpito: ei holkkia, ei skooppeja, ei allekirjoitettuja webhookkeja (vielä)",
  uk: "Цей шлюз стережуть токени, порівняння за сталий час і лише-дописуваний реєстр — без сховища, без скоупів і без підписаних вебхуків (поки що)",
  bg: "Този гейтуейт го пазят токени, сравнение с постоянно време и само-добавящ се дневник — няма трезор, няма обеми от права, няма подписани уебхуки (все още)",
  tr: "Bu ağ geçidini koruyan şey tokenlar, sabit zamanlı bir karşılaştırma ve yalnızca eklenen bir defter: henüz kasa yok, kapsam yok, imzalı webhook yok",
  hu: "Ezt az átjárót tokenek, állandó idejű összehasonlítás és csak hozzáfűzhető napló védi — nincs trezor, nincs scope, nincs aláírt webhook (még nem)",
};

const SUBTITLE: L = {
  en: "Everything here was read out of the v1.0.0 sources — gateway/app/config.py, gateway/app/main.py and the plugin modules — on 2026-11-25. Where the usual product story would promise signed webhooks, scoped keys or an encrypted credential store, this page names the gap and marks it planned instead of pretending.",
  ru: "Всё на этой странице вычитано из исходников v1.0.0 — gateway/app/config.py, gateway/app/main.py и модулей плагинов — 2026-11-25. Там, где обычный продуктовый рассказ обещал бы подписанные вебхуки, ключи с областями видимости или шифрованное хранилище, эта страница называет пробел и помечает его как план, а не делает вид.",
  de: "Alles hier wurde am 2026-11-25 aus den v1.0.0-Quellen gelesen — gateway/app/config.py, gateway/app/main.py und die Plugin-Module. Wo die übliche Produktgeschichte signierte Webhooks, Schlüssel mit Scopes oder einen verschlüsselten Credential-Store versprechen würde, benennt diese Seite die Lücke und markeriert sie als geplant, statt so zu tun.",
  fr: "Tout ce qui suit a été lu dans les sources v1.0.0 — gateway/app/config.py, gateway/app/main.py et les modules de plugins — le 2026-11-25. Là où le discours habituel promettrait des webhooks signés, des clés à périmètre ou un coffre chiffré, cette page nomme l’écart et l’étiquette comme prévu au lieu de faire semblant.",
  it: "Tutto quanto segue è stato letto nei sorgenti v1.0.0 — gateway/app/config.py, gateway/app/main.py e i moduli dei plugin — il 2026-11-25. Dove il solito racconto di prodotto prometterebbe webhook firmati, chiavi con scope o un caveau cifrato, questa pagina nomina il gap e lo etichetta come previsto invece di fingere.",
  nl: "Alles hier is uit de v1.0.0-bronnen gelezen — gateway/app/config.py, gateway/app/main.py en de plugin-modules — op 2026-11-25. Waar het gewone productverhaal ondertekende webhooks, scoped sleutels of een versleutelde sleutelkluis zou beloven, noemt deze pagina het gat en merkt het aan als gepland in plaats van te doen alsof.",
  cs: "Všechno zde bylo přečteno ze zdrojových kódů v1.0.0 — gateway/app/config.py, gateway/app/main.py a modulů pluginů — dne 2026-11-25. Kde by obvyklý produktový příběh slíbil podepsané webhooky, klíče s rozsahy nebo šifrovaný trezor, tato stránka pojmenuje mezeru a označí ji jako plánovanou, místo aby předstírala.",
  "zh-Hans": "本页每一条都取自 2026-11-25 的 v1.0.0 源码——gateway/app/config.py、gateway/app/main.py 与各插件模块。通常的产品故事会在这里许诺签名 webhook、带权限范围的密钥、加密的凭据保管库；我们不装，直接把缺口写出来并标成规划中。",
  "zh-Hant": "本頁每一條都取自 2026-11-25 的 v1.0.0 原始碼——gateway/app/config.py、gateway/app/main.py 與各外掛模組。常見的產品故事會在這裡許諾簽名 webhook、帶權限範圍的密鑰、加密的憑證保管庫；我們不裝，直接把缺口寫出來並標成規劃中。",
  es: "Todo lo de aquí se leyó de las fuentes v1.0.0 —gateway/app/config.py, gateway/app/main.py y los módulos de complementos— el 2026-11-25. Donde el relato de producto habitual prometería webhooks firmados, claves con alcance o un almacén cifrado, esta página nombra el hueco y lo marca como planificado en lugar de fingir.",
  pl: "Wszystko na tej stronie wyczytano ze źródeł v1.0.0 — gateway/app/config.py, gateway/app/main.py i modułów wtyczek — 2026-11-25. Tam, gdzie zwykła opowieść produktowa obiecywałaby podpisane webhooki, klucze z zakresem albo szyfowany sejf, ta strona nazywa lukę i oznacza ją jako planowaną, zamiast udawać.",
  ja: "ここにある記述はすべて 2026-11-25 時点の v1.0.0 ソース（gateway/app/config.py、gateway/app/main.py、各プラグインモジュール）から読み出したものです。ありきたりの製品説明なら署名付き Webhook、スコープ付きキー、暗号化された鍵保管庫を約束するところですが、このページでは無いものは無いと名指しし、計画中として印を付けます。",
  th: "ทุกข้อความในหน้านี้อ่านมาจากโค้ดต้นฉบับ v1.0.0 เมื่อ 2026-11-25 — gateway/app/config.py, gateway/app/main.py และโมดูลของปลั๊กอิน จุดที่เรื่องราวผลิตภัณฑ์ทั่วไปมักจะสัญญาเรื่อง webhook ที่เซ็นลายมือชื่อ คีย์ที่มี scope หรือคลังเก็บคีย์ที่เข้ารหัส หน้านี้จะระบุช่องว่างนั้นตรง ๆ แล้วติดป้ายว่าวางแผนไว้",
  fi: "Kaikki täällä on luettu v1.0.0-lähteistä — gateway/app/config.py, gateway/app/main.py ja lisäosamoduulit — 2026-11-25. Missä tavallinen tuotarina lupaisi allekirjoitetut webhookit, skoopilliset avaimet tai salatun avainsäilön, tämä sivu nimittää aukon ja merkitsee sen suunnitelluksi teeskentelyn sijaan.",
  uk: "Усе тут вичитане з початкових кодів v1.0.0 — gateway/app/config.py, gateway/app/main.py та модулів плагінів — 2026-11-25. Там, де звична продуктова історія обіцяла б підписані вебхуки, ключі зі скоупами чи зашифроване сховище, ця сторінка називає прогалину й позначає її як план, а не робить вигляд.",
  bg: "Всичко тук е изчетено от изходните кодове v1.0.0 — gateway/app/config.py, gateway/app/main.py и модулите на плъгините — на 2026-11-25. Където обичайната продуктова история би обещала подписани уебхуки, ключове с обхват или криптиран трезор, тази страница назовава пропуската и я маркира като планирана, вместо да се прави.",
  tr: "Buradaki her şey 2026-11-25 tarihli v1.0.0 kaynaklarından okundu — gateway/app/config.py, gateway/app/main.py ve eklenti modülleri. Alışılagelmiş ürün hikâyesinin imzalı webhook, kapsamlı anahtar veya şifreli anahtar kasası vaat edeceği yerde bu sayfa boşluğu adıyla anıp planlandı olarak işaretliyor.",
  hu: "Minden itt elolvasott sort a v1.0.0 forrásaiból vettünk — gateway/app/config.py, gateway/app/main.py és a bővítménymodulok — 2026-11-25-én. Ahol a szokásos terméktörténet aláírt webhookokat, scope-os kulcsokat vagy titkosított kulcstrezort ígérne, ez az oldal nevén nevezi a hiányt, és tervezett-csíkkal jelöli, nem úgy tesz, mintha ott lenne.",
};

const LEGEND_SOURCE: L = {
  en: "v1.0.0 sources, re-read 2026-11-25",
  ru: "Исходники v1.0.0, перечитаны 2026-11-25",
  de: "v1.0.0-Quellen, am 2026-11-25 nachgelesen",
  fr: "Sources v1.0.0, relues le 2026-11-25",
  it: "Sorgenti v1.0.0, riletti il 2026-11-25",
  nl: "v1.0.0-bronnen, op 2026-11-25 herlezen",
  cs: "Zdroje v1.0.0, znovu přečteny 2026-11-25",
  "zh-Hans": "v1.0.0 源码，2026-11-25 逐条复核",
  "zh-Hant": "v1.0.0 原始碼，2026-11-25 逐條複核",
  es: "Fuentes v1.0.0, releídas el 2026-11-25",
  pl: "Źródła v1.0.0, sprawdzono ponownie 2026-11-25",
  ja: "v1.0.0 のソース、2026-11-25 に再確認",
  th: "โค้ดต้นฉบับ v1.0.0 ตรวจซ้ำเมื่อ 2026-11-25",
  fi: "v1.0.0-lähteet, luettu uudelleen 2026-11-25",
  uk: "Початкові коди v1.0.0, перечитано 2026-11-25",
  bg: "Изходни кодове v1.0.0, препрочетени на 2026-11-25",
  tr: "v1.0.0 kaynakları, 2026-11-25 tarihinde yeniden okundu",
  hu: "v1.0.0 források, 2026-11-25-én útolvasva",
};

const LEGEND_PLANNED: L = {
  en: "Rows marked planned are not in the code",
  ru: "Строки с пометкой «в планах» в коде отсутствуют",
  de: "Zeilen mit „geplant“ stehen nicht im Code",
  fr: "Les lignes marquées prévu sont absentes du code",
  it: "Le righe marcate previsto non sono nel codice",
  nl: "Rijen met ‘gepland’ erbij staan niet in de code",
  cs: "Řádky označené plánováno v kódu nejsou",
  "zh-Hans": "标着「规划中」的条目，代码里还没有",
  "zh-Hant": "標著「規劃中」的條目，程式碼裡還沒有",
  es: "Las filas marcadas como previsto no están en el código",
  pl: "Wiersze oznaczone jako planowane nie istnieją w kodzie",
  ja: "計画中と付いた行は、まだコードに存在しません",
  th: "แถวที่ติดป้ายว่าวางแผนไว้ ยังไม่มีอยู่ในโค้ด",
  fi: "Rivit, joissa lukee suunnitteilla, puuttuvat koodista",
  uk: "Рядки з позначкою «у планах» відсутні в коді",
  bg: "Редовете, маркирани като планирано, ги няма в кода",
  tr: "Planlandı işaretli satırlar kodda yok",
  hu: "A tervezett-címkés sorok nincsenek benne a kódban",
};

const LEGEND_NOSECRET: L = {
  en: "Samples show env-var names, never a live secret",
  ru: "В примерах только имена переменных окружения, никогда настоящего секрета",
  de: "Beispiele zeigen env-Variablennamen, nie ein echtes Geheimnis",
  fr: "Les exemples montrent des noms de variables, jamais un secret réel",
  it: "Gli esempi mostrano nomi di variabili, mai un segreto reale",
  nl: "Voorbeelden tonen omgevingsvariabelen, nooit een echt geheim",
  cs: "Ukázky ukazují názvy proměnných, nikdy skutečné tajemství",
  "zh-Hans": "示例里只出现环境变量名，绝不出现真密钥",
  "zh-Hant": "範例裡只出現環境變數名，絕不出現真密鑰",
  es: "Los ejemplos muestran nombres de variable, nunca un secreto real",
  pl: "Przykłady pokazują nazwy zmiennych środowiskowych, nigdy prawdziwego sekretu",
  ja: "サンプルに載るのは環境変数名だけで、実在の秘密情報は出しません",
  th: "ตัวอย่างแสดงเฉพาะชื่อตัวแปรแวดล้อม ไม่เคยใส่ค่า secret จริง",
  fi: "Esimerkit näyttävät muuttujien nimet, ei koskaan oikeaa salaisuutta",
  uk: "У прикладах лише назви змінних середовища, жодного справжнього секрету",
  bg: "Примерите показват имена на променливи, никога истинска тайна",
  tr: "Örnekler yalnızca ortam değişkeni adı gösterir, gerçek sır asla",
  hu: "A példák csak környezeti változó neveit mutatják, valódi titkot soha",
};

const STATE_SHIPPED: L = {
  en: "in the code",
  ru: "в коде",
  de: "im Code",
  fr: "dans le code",
  it: "nel codice",
  nl: "in de code",
  cs: "v kódu",
  "zh-Hans": "代码里已有",
  "zh-Hant": "程式碼裡已有",
  es: "en el código",
  pl: "w kodzie",
  ja: "コードにある",
  th: "มีในโค้ด",
  fi: "koodissa",
  uk: "у коді",
  bg: "в кода",
  tr: "kodda",
  hu: "kódban",
};

const STATE_PLANNED: L = {
  en: "planned",
  ru: "в планах",
  de: "geplant",
  fr: "prévu",
  it: "previsto",
  nl: "gepland",
  cs: "plánováno",
  "zh-Hans": "规划中",
  "zh-Hant": "規劃中",
  es: "previsto",
  pl: "planowane",
  ja: "計画中",
  th: "วางแผนไว้",
  fi: "suunnitteilla",
  uk: "у планах",
  bg: "планирано",
  tr: "planlandı",
  hu: "tervezve",
};

const FILTER_LABEL: L = {
  en: "Filter the rows in this section",
  ru: "Фильтр строк в этом разделе",
  de: "Zeilen in diesem Abschnitt filtern",
  fr: "Filtrer les lignes de cette section",
  it: "Filtra le righe di questa sezione",
  nl: "Rijen in dit deel filteren",
  cs: "Filtrovat řádky této sekce",
  "zh-Hans": "筛选本节的条目",
  "zh-Hant": "篩選本節的條目",
  es: "Filtrar las filas de esta sección",
  pl: "Filtruj wiersze tej sekcji",
  ja: "このセクションの行を絞り込む",
  th: "กรองแถวในส่วนนี้",
  fi: "Suodata tämän osion rivit",
  uk: "Фільтр рядків у цьому розділі",
  bg: "Филтрирай редовете в тази секция",
  tr: "Bu bölümdeki satırları süz",
  hu: "Szekció sorainak szűrése",
};

const FILTER_ALL: L = {
  en: "All rows",
  ru: "Все строки",
  de: "Alle Zeilen",
  fr: "Toutes les lignes",
  it: "Tutte le righe",
  nl: "Alle rijen",
  cs: "Všechny řádky",
  "zh-Hans": "全部条目",
  "zh-Hant": "全部條目",
  es: "Todas las filas",
  pl: "Wszystkie wiersze",
  ja: "すべての行",
  th: "ทุกแถว",
  fi: "Kaikki rivit",
  uk: "Усі рядки",
  bg: "Всички редове",
  tr: "Tüm satırlar",
  hu: "Minden sor",
};

const FILTER_EMPTY: L = {
  en: "No row in this card carries that mark.",
  ru: "В этой карточке нет строки с такой отметкой.",
  de: "In dieser Karte trägt keine Zeile diese Markierung.",
  fr: "Aucune ligne de cette carte ne porte cette marque.",
  it: "Nessuna riga di questa scheda porta quel marchio.",
  nl: "Geen rij in deze kaart draagt die markering.",
  cs: "Žádný řádek v této kartě nese tuto značku.",
  "zh-Hans": "这张卡片里没有条目带该标记。",
  "zh-Hant": "這張卡片裡沒有條目帶該標記。",
  es: "Ninguna fila de esta tarjeta lleva esa marca.",
  pl: "Żaden wiersz tej karty nie niesie tego znaku.",
  ja: "このカードに該当マークの行はありません。",
  th: "ไม่มีแถวในการ์ดนี้ที่ติดเครื่องหมายนั้น",
  fi: "Yksikään tämän kortin rivi ei kannata tuota merkkiä.",
  uk: "У цій картці немає рядка з такою позначкою.",
  bg: "Нито един ред в тази карта не носи този маркер.",
  tr: "Bu karttaki hiçbir satır o işareti taşımıyor.",
  hu: "Ebben a kártyában egyetlen sor sem viseli ezt a jelölést.",
};

const KEYS_LABEL: L = {
  en: "Keys and files",
  ru: "Ключи и файлы",
  de: "Schlüssel und Dateien",
  fr: "Clés et fichiers",
  it: "Chiavi e file",
  nl: "Sleutels en bestanden",
  cs: "Klíče a soubory",
  "zh-Hans": "相关键与文件",
  "zh-Hant": "相關金鑰與檔案",
  es: "Claves y archivos",
  pl: "Klucze i pliki",
  ja: "キーとファイル",
  th: "คีย์และไฟล์",
  fi: "Avaimet ja tiedostot",
  uk: "Ключі та файли",
  bg: "Ключове и файлове",
  tr: "Anahtarlar ve dosyalar",
  hu: "Kulcsok és fájlok",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Code samples. These are wire values and shell, so they are deliberately
 * locale-free: env-var names stand in for secrets, never a literal token.
 * ────────────────────────────────────────────────────────────────────────── */

const WEBHOOK_SAMPLE = [
  "# Alertmanager / Grafana -> gateway. Either header form is accepted.",
  "curl -sS -X POST http://127.0.0.1:8080/api/v1/plugins/alerts/webhook \\",
  '     -H "Content-Type: application/json" \\',
  '     -H "X-Popopx-Alert-Token: $POPOPX_ALERT_WEBHOOK_TOKEN" \\',
  '     -d \'{"alertname":"disk_full","severity":"critical","labels":{"instance":"node-a"}}\'',
  "",
  "# An operator route, by contrast, carries the admin token.",
  'curl -sS -H "X-Admin-Token: $POPOPX_ADMIN_TOKEN" \\',
  "     http://127.0.0.1:8080/api/v1/plugins/alerts",
].join("\n");

const H5_SAMPLE = [
  "# The merchant's own web server verifies a launch: no gateway credential is sent.",
  "curl -sS -X POST http://127.0.0.1:8080/api/v1/verifyH5Auth \\",
  '     -H "Content-Type: application/json" \\',
  '     -d \'{"popopx_uid":"<pairwise_uid>","ts":1795555200,"sig":"<64 hex chars>"}\'',
  "",
  "# What the phone signs, and nothing else:",
  "# HMAC-SHA256(\"uid=<pairwise_uid>&ts=<unix-seconds>\", session_secret) -> 64 lowercase hex",
].join("\n");

const LIMITS_SAMPLE = [
  "# the only throttle inside the application: AI, per follower",
  "POPOPX_AI_RATE_LIMIT_MESSAGES=20",
  "POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300",
  "# above the limit -> 429 with a Retry-After header",
  "",
  "# the alert gate: below this severity nothing is ever built",
  "POPOPX_ALERT_MIN_SEVERITY=warning   # debug | info | warning | critical",
].join("\n");

const METERS_SAMPLE = [
  "POPOPX_CP_PER_CARD=1",
  "POPOPX_CP_PER_MENU_PUSH=1",
  "POPOPX_CP_PER_KEY_ROTATION=2",
  "POPOPX_CP_PER_AI_MESSAGE=5",
  "POPOPX_CP_PER_ALERT=2",
  "POPOPX_CP_PER_SSO_LOGIN=1",
  "POPOPX_CP_PER_POLL=1",
  "POPOPX_CP_PER_WEB3_EVENT=1",
  "",
  "# why a call is refused, and how the answers differ",
  "401  no admin token, or the wrong one",
  "402  balance fused, the body carries the remainder",
  "404  plugin switched off, the body names the key to flip",
  "503  node unreachable, the call is retryable",
].join("\n");

const WEBHOOK_CAPTION: L = {
  en: "Both forms are real: the webhook route is exempt from the admin middleware because its caller is the alerting system, not the operator.",
  ru: "Обе формы настоящие: маршрут вебхука выведен из-под админ-мидлвари, потому что его вызывает система алертинга, а не оператор.",
  de: "Beide Formen sind echt: die Webhook-Route ist vom Admin-Middleware ausgenommen, weil ihr Aufrufer das Alarmsystem ist, nicht der Operator.",
  fr: "Les deux formes sont réelles : la route webhook est exemptée du middleware admin parce que son appelant est le système d’alerte, pas l’opérateur.",
  it: "Entrambe le forme sono reali: la route del webhook è esclusa dal middleware admin perché il chiamante è il sistema di allertamento, non l’operatore.",
  nl: "Beide vormen zijn echt: de webhook-route valt buiten de admin-middleware omdat haar aanroeper het alarmsysteem is, niet de operator.",
  cs: "Obě podoby jsou reálné: webhooková trasa je vyňata ze správcovského middleware, protože jejím volajícím je alertovací systém, ne operátor.",
  "zh-Hans": "两种写法都是真的：webhook 路由被中间件放行，因为它的调用方是告警系统，不是操作员。",
  "zh-Hant": "兩種寫法都是真的：webhook 路由被中介層放行，因為它的呼叫端是告警系統，不是操作員。",
  es: "Ambas formas son reales: la ruta del webhook está exenta del middleware de administración porque quien la llama es el sistema de alertas, no el operador.",
  pl: "Obie formy są prawdziwe: ścieżka webhook jest wyłączona spod middleware administratora, bo wzywa ją system alertów, a nie operator.",
  ja: "どちらの形も実在します。Webhook ルートは管理者ミドルウェアから除外されています。呼び出すのは運用者ではなく告警システムだからです。",
  th: "ทั้งสองรูปแบบมีอยู่จริง: เส้นทาง webhook หลุดจากการตรวจของ middleware ผู้ดูแล เพราะผู้เรียกคือระบบแจ้งเตือน ไม่ใช่ผู้ดูแลระบบ",
  fi: "Molemmat muodot ovat todet: webhook-reitti on ohitettu admin-middlewaresta, koska sen kutsuja on hälytysjärjestelmä eikä operaattori.",
  uk: "Обиди форми справжні: маршрут вебхука виведено з-під адмін-проміжного програмного забезпечення, бо його викликач — система алертінгу, а не оператор.",
  bg: "И двата формата са истински: маршрутът на уебхука е изваден от админ middleware, защото неговият подвикващ е системата за известия, не операторът.",
  tr: "İki biçim de gerçek: webhook rotası yönetici ara katmanından muaftır, çünkü onu çağıran kişi operatör değil uyarı sistemidir.",
  hu: "Mindkét forma valós: a webhook útvonal ki van véve az admin middleware alól, mert a hívója a riasztási rendszer, nem az operátor.",
};

const H5_CAPTION: L = {
  en: "No token in this call on purpose. The endpoint exists so a merchant's web server can verify a launch without ever holding a gateway credential.",
  ru: "Токен в этом вызове отсутствует намеренно: эндпоинт создан, чтобы веб-сервер продавца мог проверить запуск, не держа у себя учётные данные шлюза.",
  de: "In diesem Aufruf ist bewusst kein Token. Der Endpunkt existiert damit der Webserver des Händlers einen Start prüfen kann, ohne je ein Gateway-Credential zu besitzen.",
  fr: "Aucun jeton dans cet appel, délibérément. Le point de terminaison existe pour qu’un serveur marchand vérifie un lancement sans jamais détenir de credential de passerelle.",
  it: "Nessun token in questa chiamata, deliberatamente. L’endpoint esiste perché il web server del negoziante possa verificare un avvio senza mai detenere una credenziale del gateway.",
  nl: "Opzettelijk geen token in deze aanroep. Het endpoint bestaat zodat de webserver van een verkoper een start kan verifiëren zonder ooit gateway-gegevens te bezitten.",
  cs: "Záměrně bez tokenu. Tento endpoint existuje, aby webový server obchodníka ověřil spuštění aniž by kdy držel pověření brány.",
  "zh-Hans": "这个调用里故意不带令牌。接口存在的意义，就是让商家的 web 服务器能自己验证一次启动，而永远拿不到网关凭据。",
  "zh-Hant": "這個呼叫裡故意不帶權杖。介面存在的意義，就是讓商家的 web 伺服器能自己驗證一次啟動，而永遠拿不到閘道憑證。",
  es: "Sin token en esta llamada, a propósito. El endpoint existe para que el servidor web del comercio verifique un lanzamiento sin poseer nunca una credencial de la pasarela.",
  pl: "Celowo bez tokenu w tym wywołaniu. Ten punkt istnieje po to, by serwer WWW sprzedawcy zweryfikował uruchomienie, nigdy nie trzymając poświadczenia bramy.",
  ja: "この呼び出しにトークンは入っていません。わざとです。商家の Web サーバーがゲートウェイの credential を一切持たずに起動を検証できるように、このエンドポイントが存在します。",
  th: "ไม่มีโทเคนในการเรียกนี้โดยเจตนา endpoint นี้มีขึ้นเพื่อให้เว็บเซิร์ฟเวอร์ของผู้ขายตรวจรับการเปิดใช้ได้ โดยไม่ต้องถือ credential ของเกตเวย์แม้แต่ชิ้นเดียว",
  fi: "Tässä kutsussa ei ole tokenia tarkoituksella. Päätepiste on olemassa, jotta kauppiaan webpalvelin voi tarkistaa käynnistyksen hallitsematta ikinä gatewayn kirjautustietoja.",
  uk: "У цьому виклику навмисне немає токена. Ендпоінт існує, щоб вебсервер продавця міг перевірити запуск, не маючи жодних облікових даних шлюза.",
  bg: "В това извикване нарочно няма токен. Крайната точка съществува, за да може уеб сървърът на търговеца да провери стартиране, без никога да притежава удостоверяване на гейтуейта.",
  tr: "Bu çağrıda bilerek token yok. Uç nokta, tüccarın web sunucusunun bir ağ geçidi kimlik bilgisi hiç elinde tutmadan bir başlatmayı doğrulayabilmesi için var.",
  hu: "Ebben a hívásban szándékosan nincs token. A végpont azért létezik, hogy a kereskedő webkiszolgálója végrehajthasson egy indítás-ellenőrzést anélkül, hogy valaha átjáró-hitelesítőt birtokolna.",
};

const LIMITS_CAPTION: L = {
  en: "Two keys, both per-follower. There is no third switch for a gateway-wide limit, because the gateway has no such limiter.",
  ru: "Два ключа, и оба на подписчика. Третьего переключателя на весь шлюз нет, потому что такого ограничителя в шлюзе нет.",
  de: "Zwei Schlüssel, beide pro Follower. Kein dritter Schalter für ein Gateway-weites Limit, denn so einen Begrenzer hat das Gateway nicht.",
  fr: "Deux clés, toutes deux par follower. Pas de troisième interrupteur pour une limite globale du gateway, parce qu’un tel limiteur n’existe pas dedans.",
  it: "Due chiavi, entrambe per follower. Non c’è un terzo interruttore per un limite globale del gateway, perché un limiter del genere nel gateway non esiste.",
  nl: "Twee sleutels, beide per volger. Er is geen derde schakelaar voor een gateway-brede limiet, omdat zo’n limiter de gateway niet heeft.",
  cs: "Dva klíče, oba na followera. Žádný třetí přepínač pro limit celé brány neexistuje, protože takový omezovač brána nemá.",
  "zh-Hans": "两个键，都按粉丝计。没有第三个开关能全局限速，因为网关里根本没有这样一个限速器。",
  "zh-Hant": "兩個鍵，都按粉絲計。沒有第三個開關能全域限速，因為閘道裡根本沒有這樣一個限速器。",
  es: "Dos claves, ambas por seguidor. No hay un tercer interruptor para un límite global de la pasarela, porque la pasarela no tiene ese limitador.",
  pl: "Dwa klucze, oba na obserwującego. Nie ma trzeciego przełącznika na limit całej bramy, bo taki ogranicznik w bramie nie istnieje.",
  ja: "キーは 2 つ、どちらもフォロワー単位です。ゲートウェイ全体の速率を切る 3 つ目のスイッチはありません。ゲートウェイにそういうリミッターが無いからです。",
  th: "มีสองคีย์เท่านั้น และทั้งคู่คิดต่อผู้ติดตาม ไม่มีสวิตช์ที่สามสำหรับจำกัดอัตราทั้งเกตเวย์ เพราะในตัวเกตเวย์ไม่มีตัวจำกัดอัตราการเรียกแบบนั้น",
  fi: "Kaksi avainta, molemmat seuraajaa kohden. Kolatta kytkintä gatewayn laajuiselle rajoitukselle ei ole, koska tällaista rajoitinta gatewayssa ei ole.",
  uk: "Два ключі, обидва на підписника. Третього перемикача для шлюзу в цілому немає, бо такого обмежувача в шлюзі не існує.",
  bg: "Два ключа, и двата за последовател. Трети превключвател за глобален лимит на гейтуейта няма, защото такъв ограничител гейтуейтът няма.",
  tr: "İki anahtar, ikisi de takipçi başına. Ağ geçidinin geneli için üçüncü bir anahtar yok, çünkü ağ geçidinde öyle bir sınırlayıcı yok.",
  hu: "Kulcsból kettő van, mindkét követőre vetítve. Nincs harmadik kapcsoló átjáró-szintű korláthoz, mert ilyen korlátozó az átjáróban nincs.",
};

const METERS_CAPTION: L = {
  en: "The eight meters, their factory prices, and the four answers a refused call can get. All of them are distinguishable on purpose.",
  ru: "Восемь счётчиков, их заводские цены и четыре ответа, которые может получить отклонённый вызов. Все они различимы намеренно.",
  de: "Die acht Meter, ihre Werkpreise und die vier Antworten, die ein abgelehnter Aufruf bekommen kann. Alle sind bewusst unterscheidbar.",
  fr: "Les huit compteurs, leurs prix d’usine et les quatre réponses qu’un appel refusé peut obtenir. Ils sont distinguables volontairement.",
  it: "Gli otto contatori, i prezzi di fabbrica e le quattro risposte che una chiamata rifiutata può ottenere. Sono distinguibili per scelta.",
  nl: "De acht meters, hun fabrieksprijzen en de vier antwoorden die een geweigerde aanroep kan krijgen. Opzettelijk allemaal te onderscheiden.",
  cs: "Osm měrek, jejich výrobní ceny a čtyři odpovědi, které může odmítnutý požadavek dostat. Všechny jsou záměrně rozlišitelné.",
  "zh-Hans": "八个计量表、出厂单价，以及一次被拒的调用能拿到的四种答案。这四种是刻意做成可区分的。",
  "zh-Hant": "八個計量表、出廠單價，以及一次被拒的呼叫能拿到的四種答案。這四種是刻意做成可區分的。",
  es: "Los ocho medidores, sus precios de fábrica y las cuatro respuestas que puede obtener una llamada rechazada. Todas distinguibles a propósito.",
  pl: "Osiem mierników, ich ceny fabryczne i cztery odpowiedzi, jakie może dostać odrzucone wywołanie. Wszystkie celowo do rozróżnienia.",
  ja: "8つのメーターとその出荷時単価、そして拒否された呼び出しが取り得る4つの回答。4つは意図的に区別できるようにしてあります。",
  th: "ตัวนับทั้งแปด ราคาตั้งต้นจากโรงงาน และคำตอบสี่แบบที่การเรียกถูกปฏฺิเสธได้รับ ทั้งสี่จงใจให้แยกออกจากกัน",
  fi: "Kahdeksan mittaria, niiden tehdashinnat ja neljä vastausta, jotka hylätty kutsu voi saada. Tarkoitus on, että ne erottaa toisistaan.",
  uk: "Вісім лічильників, їхні заводські ціни та чотири відповіді, які може отримати відхилений виклик. Усі вони навмисне розрізнені.",
  bg: "Осемте мерни единици, фабричните им цени и четирите отговора, които отказано извикване може да получи. Всички са различими по замисъл.",
  tr: "Sekiz ölçer, fabrika fiyatları ve reddedilen bir çağrının alabileceği dört yanıt. Dördü de bilinçli olarak birbirinden ayırt edilebilir.",
  hu: "A nyolc mérő, a gyári áraik és a négy válasz, amit egy elutasított hívás kaphat. Mind a négy szándéosan megkülönböztethető.",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * The grouped cards. A row tagged `planned` is a control the code does not have:
 * the tag is what the filter reads, and the value text names the gap too, so the
 * honesty survives even with the filter on "All rows".
 * ────────────────────────────────────────────────────────────────────────── */

const PANELS: readonly Panel[] = [
  {
    id: "credentials",
    code: "Credential handling",
    accent: "mesh",
    glyph: ["M12 3l7 3v5c0 4.2-2.9 7.5-7 8.7-4.1-1.2-7-4.5-7-8.7V6l7-3z", "M12 9.5v3.5"],
    name: {
      en: "Credential handling — the honest inventory",
      ru: "Работа с секретами — честная опись",
      de: "Umgang mit Secrets — die ehrliche Bestandsaufnahme",
      fr: "Traitement des secrets — l’inventaire honnête",
      it: "Gestione dei segreti — l’inventario onesto",
      nl: "Omgaan met secrets — de eerlijke inventaris",
      cs: "Práce s tajnými údaji — upřímná evidence",
      "zh-Hans": "凭据处理——一份诚实清单",
      "zh-Hant": "憑證處理——一份誠實清單",
      es: "Gestión de credenciales — el inventario honesto",
      pl: "Obsługa sekretów — uczciwy wykaz",
      ja: "認証情報の取り扱い — 正直な棚卸し",
      th: "การจัดการ credential — บัญชีที่ตรงไปตรงมา",
      fi: "Kirjautustietojen käsittely — rehellinen luettelo",
      uk: "Робота з секретами — чесний перелік",
      bg: "Работа с тайните — честният инвентар",
      tr: "Kimlik bilgisi yönetimi — dürüst envanter",
      hu: "A titkok kezelése — a becsületes leltár",
    },
    hook: {
      en: "No secret is encrypted here. What guards them today is a handful of load-time checks, plus the operating system around the process.",
      ru: "Ни один секрет здесь не шифруется. Сегодня его охраняют несколько проверок при загрузке да операционная система вокруг процесса.",
      de: "Hier wird kein Secret verschlüsselt. Was sie heute schützt, sind ein paar Prüfungen beim Laden plus das Betriebssystem um den Prozess.",
      fr: "Ici, aucun secret n’est chiffré. Ce qui les garde aujourd’hui, ce sont quelques contrôles au chargement, plus le système d’exploitation autour du processus.",
      it: "Qui nessun segreto è cifrato. A custodirli oggi sono alcune verifiche al caricamento, più il sistema operativo attorno al processo.",
      nl: "Hier wordt geen enkel secret versleuteld. Wat ze vandaag bewaakt, zijn een paar laadtijdcontroles plus het besturingssysteem rond het proces.",
      cs: "Žádné tajemství se tady nešifruje. Dnes je chrání několik kontrol při načtení plus operační systém kolem procesu.",
      "zh-Hans": "这里没有任何密钥被加密。今天护着它们的，是几条加载期检查，以及进程外面那层操作系统。",
      "zh-Hant": "這裡沒有任何密鑰被加密。今天護著它們的，是幾條載入期檢查，以及程序外面那層作業系統。",
      es: "Aquí ningún secreto se cifra. Lo que los custodia hoy son unas comprobaciones al cargar, más el sistema operativo alrededor del proceso.",
      pl: "Żaden sekret nie jest tu szyfrowany. Dzisiaj strzegą ich nieliczne sprawdzenia przy wczytywaniu plus system operacyjny wokół procesu.",
      ja: "ここで暗号化される秘密情報はひとつもありません。今日それらを守っているのは、起動時の数件のチェックと、プロセスを囲む OS です。",
      th: "ไม่มี secret ใดในหน้านี้ที่ถูกเข้ารหัส สิ่งที่เฝ้ามันไว้ตอนนี้คือการตรวจตอนโหลดไม่กี่อย่าง บวกกับระบบปฏิบัติการณ์ที่ห่อหุ้มโปรเซสอยู่",
      fi: "Täällä yhtäkään salaisuutta ei salata. Niitä vartioivat tänään muutama tarkistus latauksen aikana, plus käyttöjärjestelmä prosessin ympärillä.",
      uk: "Жоден секрет тут не шифрується. Сьогодні його пильнують кілька перевірок під час завантаження та операційна система навколо процесу.",
      bg: "Тук нито една тайна не се криптира. Днес ги пазят малкото проверки при зареждане, плюс операционната система около процеса.",
      tr: "Burada hiçbir sır şifrelenmez. Bugün onları koruyan, yükleme sırasında yapılan birkaç kontrol ile sürecin etrafındaki işletim sistemi.",
      hu: "Itt egyetlen titok sincs titkosítva. Ma egy pár betöltéskori ellenőrzés, meg a folyamatot körülvevő operációs rendszer védi őket.",
    },
    rows: [
      {
        state: "shipped",
        k: {
          en: ".env file",
          ru: "Файл .env",
          de: ".env-Datei",
          fr: "Fichier .env",
          it: "File .env",
          nl: ".env-bestand",
          cs: "Soubor .env",
          "zh-Hans": ".env 文件",
          "zh-Hant": ".env 檔案",
          es: "Archivo .env",
          pl: "Plik .env",
          ja: ".env ファイル",
          th: "ไฟล์ .env",
          fi: ".env-tiedosto",
          uk: "Файл .env",
          bg: "Файл .env",
          tr: ".env dosyası",
          hu: ".env fájl",
        },
        v: {
          en: "load_config warns when .env is readable by group or other — 0600 is the only quiet mode. A warning, not a gate: refusing to boot over one permission bit would take a working deployment offline.",
          ru: "load_config предупреждает, если .env читается группой или всеми — 0600 единственный тихий режим. Это предупреждение, а не запрет: отказ стартовать из-за одного бита прав уронил бы рабочую установку.",
          de: "load_config warnt, wenn .env von Gruppe oder allen lesbar ist — 0600 ist der einzige stille Modus. Eine Warnung, keine Sperre: wegen eines Berechtigungs-Bits nicht zu starten würde eine funktionierende Installation offline nehmen.",
          fr: "load_config avertit quand .env est lisible par le groupe ou par tous — 0600 est le seul mode silencieux. Un avertissement, pas un verrou : refuser de démarrer pour un bit de permission mettrait hors ligne un déploiement qui fonctionne.",
          it: "load_config avvisa quando .env è leggibile dal gruppo o da tutti — 0600 è l’unica modalità silenziosa. Un avviso, non un blocco: rifiutarsi di partire per un bit di permesso spegnerebbe un deploy funzionante.",
          nl: "load_config waarschuwt als .env leesbaar is voor groep of anderen — 0600 is de enige stille modus. Een waarschuwing, geen drempel: weigeren op te starten vanwege één permissiebit zou een werkende implementatie offline halen.",
          cs: "load_config varuje, když je .env čitelný skupině nebo všem — 0600 je jediný tichý režim. Je to varování, ne závora: odmítnout start kvůli jednomu bitu oprávnění by odstavilo fungující nasazení.",
          "zh-Hans": "load_config 在 .env 被同组或其他用户可读时会告警——0600 是唯一安静模式。这是告警，不是拦截：为一个权限位拒绝启动，等于把一套本来能跑的部署按下线。",
          "zh-Hant": "load_config 在 .env 被同群或其他使用者可讀時會告警——0600 是唯一安靜模式。這是告警，不是攔截：為一個權限位拒絕啟動，等於把一套本來能跑的部署按下線。",
          es: "load_config avisa cuando .env es legible por el grupo o por todos — 0600 es el único modo silencioso. Es un aviso, no una barrera: negarse a arrancar por un bit de permiso desconectaría un despliegue que funciona.",
          pl: "load_config ostrzega, gdy .env jest czytelny dla grupy lub wszystkich — 0600 to jedyny cichy tryb. To ostrzeżenie, nie blokada: odmowa startu przez jeden bit uprawnień wyłączyłaby działającą instalację.",
          ja: "load_config は、.env をグループや other が読める状態だと警告します — 0600 のみが無音モードです。警告であって拒否ではありません。権限ビット 1 個のせいで起動を断ったら、動くはずのデプロイを止めてしまいます。",
          th: "load_config จะเตือนเมื่อ .env เปิดให้อื่นอ่านได้ — มี 0600 เท่านั้นที่เงียบ มันเป็นคำเตือน ไม่ใช่ประตู เพราะการปฏิเสธไม่บูตด้วยสิทธิ์บิตเดียว ทำให้ระบบที่ใช้อยู่ดีต้องออฟไลน์",
          fi: "load_config varoittaa, jos .env on ryhmän tai muiden luettavissa — 0600 on ainoa hiljainen tila. Varoitus, ei kynnys: yhden lupa-bitin takia käynnistymisestä kieltäytyminen veiksisi toimivan asennuksen pois verkosta.",
          uk: "load_config попереджає, коли .env читають група чи всі — 0600 єдиний тихий режим. Це попередження, а не заборона: відмова стартувати через один біт прав знімила б робочу установку.",
          bg: "load_config предупреждава, когато .env се чете от групата или от всички — 0600 е единственият тих режим. Предупреждение, не бариера: отказът да стартира заради един бит за права би свалял работеща инсталация.",
          "tr": "load_config, .env dosyası grup veya diğerleri tarafından okunabiliyorsa uyarır — tek sessiz mod 0600’dır. Bu bir uyarıdır, engel değil: tek bir izin biti için açılmayı reddetmek çalışan bir kurulumu çevrimdışı bırakırdı.",
          "hu": "A load_config figyelmeztet, ha a .env fájlt a csoport vagy bárki olvashatja — a 0600 az egyetlen csendes mód. Figyelmeztetés, nem kapu: egyetlen jogosultsági bit miatt megtagadni az indulást offline-ra tenné a működő telepítést.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Admin token",
          ru: "Админ-токен",
          de: "Admin-Token",
          fr: "Jeton admin",
          it: "Token admin",
          nl: "Admin-token",
          cs: "Token správce",
          "zh-Hans": "管理员令牌",
          "zh-Hant": "管理員權杖",
          es: "Token de administración",
          pl: "Token administratora",
          ja: "管理トークン",
          th: "โทเคนผู้ดูแล",
          fi: "Admin-token",
          uk: "Адмін-токен",
          bg: "Админ токен",
          "tr": "Yönetici token’ı",
          hu: "Rendszergazdai token",
        },
        v: {
          en: "POPOPX_ADMIN_TOKEN shorter than 24 characters, or equal to an example value such as change-me, refuses to load; the error line itself suggests openssl rand -hex 32.",
          ru: "POPOPX_ADMIN_TOKEN короче 24 символов или равный шаблонному значению вроде change-me не загружается; строка ошибки сама подсказывает openssl rand -hex 32.",
          de: "Ein POPOPX_ADMIN_TOKEN kürzer als 24 Zeichen oder gleich einem Beispielwert wie change-me verweigert das Laden; die Fehlerzeile schlägt gleich openssl rand -hex 32 vor.",
          fr: "Un POPOPX_ADMIN_TOKEN de moins de 24 caractères, ou égal à une valeur d’exemple comme change-me, refuse de se charger ; la ligne d’erreur suggère openssl rand -hex 32.",
          it: "Un POPOPX_ADMIN_TOKEN più corto di 24 caratteri, o uguale a un valore d’esempio come change-me, rifiuta il caricamento; la riga di errore suggerisce openssl rand -hex 32.",
          nl: "Een POPOPX_ADMIN_TOKEN korter dan 24 tekens, of gelijk aan een voorbeeldwaarde als change-me, weigert te laden; de foutregel stelt zelf openssl rand -hex 32 voor.",
          cs: "POPOPX_ADMIN_TOKEN kratší než 24 znaků, nebo shodný s ukázkovou hodnotou typu change-me odmítne načtení; řádek chyby rovnou navrhuje openssl rand -hex 32.",
          "zh-Hans": "POPOPX_ADMIN_TOKEN 少于 24 字符，或等于 change-me 这类模板值，就直接拒绝加载；报错行里还附了 openssl rand -hex 32 这个建议。",
          "zh-Hant": "POPOPX_ADMIN_TOKEN 少於 24 字元，或等於 change-me 這類範例值，就會拒絕載入；錯誤訊息裡也直接建議 openssl rand -hex 32。",
          es: "Un POPOPX_ADMIN_TOKEN de menos de 24 caracteres, o igual a un valor de ejemplo como change-me, rechaza cargarse; la propia línea de error sugiere openssl rand -hex 32.",
          pl: "POPOPX_ADMIN_TOKEN krótszy niż 24 znaki lub równy przykładowej wartości typu change-me odmawia wczytania; linia błędu sama podpowiada openssl rand -hex 32.",
          ja: "POPOPX_ADMIN_TOKEN が 24 文字未満、または change-me のようなサンプル値と同じなら、読み込みは拒否されます。エラー行が openssl rand -hex 32 を勧めてきます。",
          th: "ถ้า POPOPX_ADMIN_TOKEN สั้นกว่า 24 ตัวอักษร หรือตรงกับค่าตัวอย่างอย่าง change-me การโหลดจะถูกปฏิเสธ และบรรทัดข้อผิดพลาดก็แนะ openssl rand -hex 32 ให้เลย",
          "fi": "Alle 24 merkin pituinen POPOPX_ADMIN_TOKEN tai arvo, joka on sama kuin esimerkki change-me, kieltäytyy latautumasta; virherivi ehdottaa openssl rand -hex 32 -komentoa.",
          uk: "POPOPX_ADMIN_TOKEN коротший за 24 символи або рівний шаблонному значенню на кшталт change-me не завантажиться; рядок помилки сам пропонує openssl rand -hex 32.",
          bg: "POPOPX_ADMIN_TOKEN с по-малко от 24 знака или равен на примерна стойност като change-me отказва да се зареди; редът с грешката сама подсказва openssl rand -hex 32.",
          "tr": "24 karakterden kısa veya change-me gibi bir örnek değere eşit POPOPX_ADMIN_TOKEN yüklenmeyi reddeder; hata satırının kendisi openssl rand -hex 32 önerir.",
          "hu": "A 24 karakternél rövidebb, vagy a change-me mintájú értékkel egyező POPOPX_ADMIN_TOKEN megtagadja a betöltést; a hibaüzenet maga javasolja az openssl rand -hex 32 parancsot.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Session token",
          ru: "Токен сессии",
          de: "Sitzungs-Token",
          fr: "Jeton de session",
          it: "Token di sessione",
          nl: "Sessietoken",
          cs: "Token relace",
          "zh-Hans": "会话令牌",
          "zh-Hant": "工作階段權杖",
          "es": "Token de sesión",
          pl: "Token sesji",
          ja: "セッショントークン",
          th: "โทเคนเซสชัน",
          "fi": "Istuntotoken",
          uk: "Токен сесії",
          "bg": "Токен на сесията",
          "tr": "Oturum token’ı",
          hu: "Munkamenet-token",
        },
        v: {
          en: "The SSO store keeps only a one-way image — an HMAC-SHA256 over the session preimage, or a SHA256 seal tagged with the key source. The token itself is never persisted.",
          ru: "Хранилище SSO держит только односторонний отпечаток — HMAC-SHA256 по преизображению сессии либо SHA256-печать с указанием источника ключа. Сам токен в базу не попадает никогда.",
          de: "Der SSO-Speicher hält nur ein Einwegbild — ein HMAC-SHA256 über dem Sitzungs-Preimage, oder ein SHA256-Siegel mit vermerkter Schlüsselquelle. Das Token selbst wird nie gespeichert.",
          fr: "Le magasin SSO ne garde qu’une image à sens unique — un HMAC-SHA256 sur le preimage de session, ou un sceau SHA256 tagué de la source de clé. Le jeton lui-même n’est jamais persisté.",
          it: "Lo store SSO conserva solo un’immagine one-way — un HMAC-SHA256 sul preimage di sessione, o un sigillo SHA256 etichettato con la fonte della chiave. Il token in sé non viene mai persistito.",
          nl: "De SSO-opslag bewaart alleen een eenrichtingsbeeld — een HMAC-SHA256 over het sessie-preimage, of een SHA256-zeegel met de bron van de sleutel erbij. Het token zelf wordt nooit opgeslagen.",
          cs: "Úložiště SSO drží jen jednsměrný obraz — HMAC-SHA256 nad preimage relace, nebo SHA256 pečeť se štítkem zdroje klíče. Samotný token se nikdy neukládá.",
          "zh-Hans": "SSO 库里只留一个单向像——对会话 preimage 做 HMAC-SHA256，或者带键源标签的 SHA256 封缄。令牌本体从来不落库。",
          "zh-Hant": "SSO 儲存裡只留一個單向像——對工作階段 preimage 做 HMAC-SHA256，或是帶來源標籤的 SHA256 封緘。權杖本身從不落庫。",
          es: "El almacén SSO guarda solo una imagen de un solo sentido — un HMAC-SHA256 sobre el preimage de la sesión, o un sello SHA256 etiquetado con el origen de la clave. El token en sí nunca se persiste.",
          pl: "Pamięć SSO trzyma tylko obraz jednokierunkowy — HMAC-SHA256 na preimage’ie sesji, albo pieczęć SHA256 z oznaczonym źródłem klucza. Sam token nigdy nie jest zapisywany.",
          ja: "SSO の保存欄に入るのは一方向の像だけです — セッション preimage に対する HMAC-SHA256、あるいは鍵の由来を添えた SHA256 の封。トークンそのものは永続化されません。",
          th: "ที่เก็บ SSO บันทึกแค่ภาพทางเดียว — HMAC-SHA256 บน preimage ของเซสชัน หรือรอยตรา SHA256 ที่ระบุที่มาของคีย์ ตัวโทเคนจะไม่ถูกเก็บถาวรเลย",
          "fi": "SSO-tallennus pitää vain yksisuuntaisen kuvan — HMAC-SHA256 istunnon preimagesta, tai SHA256-sinetin, jossa avaimen lähde on merkittynä. Itse tokenia ei koskaan tallenneta.",
          "uk": "Сховище SSO тримає лише односторонній відбиток — HMAC-SHA256 на преобразі сесії, чи SHA256-печатку з позначкою джерела ключа. Сам токен ніколи не зберігається.",
          bg: "SSO хранилището пази само еднопосочен отпечатък — HMAC-SHA256 върху преизображението на сесията или SHA256 печат с етикет на източника на ключа. Самият токен никога не се съхранява.",
          "tr": "SSO deposu yalnızca tek yönlü bir görüntü saklar — oturum preimage’ı üzerinde bir HMAC-SHA256, ya da anahtar kaynağı etiketli bir SHA256 mührü. Token’ın kendisi asla kalıcı hale getirilmez.",
          "hu": "Az SSO tároló csak egyirányú képet őriz — HMAC-SHA256 a munkamenet preimage-jén, vagy a kulcs forrásával megjelölt SHA256-lényeg. Magát a tokent soha nem írjuk le.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Logs and banner",
          ru: "Логи и баннер",
          de: "Logs und Banner",
          fr: "Journaux et bannière",
          it: "Log e banner",
          nl: "Logs en banner",
          cs: "Logy a banner",
          "zh-Hans": "日志与横幅",
          "zh-Hant": "日誌與橫幅",
          es: "Registros y banner",
          pl: "Dzienniki i baner",
          ja: "ログとバナー",
          th: "บันทึกและแบนเนอร์",
          "fi": "Lokit ja banneri",
          uk: "Логи та банер",
          bg: "Логове и банер",
          "tr": "Günlükler ve banner",
          hu: "Naplók és banner",
        },
        v: {
          en: "The boot banner prints listen host, port, node URL, db path and the switch states — never a secret value. Credentials inside a web3 RPC URL are redacted before anything is logged.",
          ru: "Загрузочный баннер печатает host, порт, URL узла, путь к БД и состояние переключателей — и никогда значение секрета. Учётные данные внутри web3 RPC URL вырезаются до того, как что-то попадёт в лог.",
          de: "Das Start-Banner druckt listen-Host, Port, Knoten-URL, DB-Pfad und Schalterzustände — niemals einen Secret-Wert. Zugangsdaten in einer web3-RPC-URL werden geschwärzt, bevor irgendetwas geloggt wird.",
          fr: "La bannière de démarrage imprime hôte d’écoute, port, URL du nœud, chemin de la base et état des bascules — jamais une valeur secrète. Les identifiants d’une URL RPC web3 sont expurgés avant toute journalisation.",
          it: "Il banner di avvio stampa host di ascolto, porta, URL del nodo, percorso del db e stato degli interruttori — mai un valore segreto. Le credenziali in un URL RPC web3 vengono redatte prima che qualcosa finisca nel log.",
          nl: "De opstartbanner druckt listen-host, poort, node-URL, db-pad en de schakelaarstanden — nooit een geheime waarde. Aanmeldgegevens in een web3-RPC-URL worden weggestreept voordat er iets wordt gelogd.",
          cs: "Banner při startu tiskne listen host, port, URL uzlu, cestu k db a stavy přepínačů — nikdy hodnotu tajemství. Přístupové údaje v URL web3 RPC se redigují dřív, než se něco zapíše do logu.",
          "zh-Hans": "启动横幅只打印监听地址、端口、节点 URL、数据库路径和开关状态——永远不带密钥值。web3 RPC URL 里的账号密码在写日志之前就被抹掉。",
          "zh-Hant": "啟動橫幅只列印監聽位址、連接埠、節點 URL、資料庫路徑與開關狀態——永遠不帶密鑰值。web3 RPC URL 裡的帳號密碼在寫日誌之前就被抹除。",
          es: "El banner de arranque imprime host de escucha, puerto, URL del nodo, ruta de la base y estado de los interruptores — nunca un valor secreto. Las credenciales de una URL RPC de web3 se redactan antes de registrar nada.",
          pl: "Baner startowy wypisuje host nasłuchu, port, URL węzła, ścieżkę bazy i stan przełączników — nigdy wartości sekretnych. Poświadczenia w URL RPC web3 są redagowane, zanim cokolwiek trafi do dziennika.",
          ja: "起動バナーが出るのは listen host、ポート、ノード URL、DB パス、スイッチの状態だけ — 秘密の値は絶対に出しません。web3 の RPC URL に含まれる認証情報は、ログに載る前に伏せられます。",
          th: "แบนเนอร์ตอนบูตพิมพ์เฉพาะ host ที่ฟัง, พอร์ต, URL ของโหนด, เส้นทางฐานข้อมูล และสถานะสวิตช์ — ไม่มีค่า secret ติดมาแน่นอน ส่วน credential ใน URL ของ web3 RPC จะถูกลบออกก่อนเขียนลงบันทึก",
          "fi": "Käynnistysbanneri tulostaa kuunteluosoitteen, portin, solmun URL:n, db-polun ja kytkinten tilat — ei koskaan salaisuuden arvoa. Web3 RPC -URL:n kirjautustiedot peitetään, ennen kuin mitään lokitetaan.",
          "uk": "Банер завантаження друкує host, порт, URL вузла, шлях до БД та стан перемикачів — жодного значення секрету. Облікові дані в URL web3 RPC вилучаються до того, як щось потрапить у лог.",
          "bg": "Банерът при стартиране отпечатва listen host, порт, URL на възела, пътя до базата и състоянията на превключвателите — никога стойност на тайна. Удостоверенията в URL на web3 RPC се цензурират, преди нещо да влезе в лога.",
          "tr": "Açılış banner’ı yalnızca dinleme ana makinesini, portu, düğüm URL’sini, veritabanı yolunu ve anahtar durumlarını yazar — asla bir sır değeri. web3 RPC URL’sinin içindeki kimlik bilgileri, günlüğe bir şey düşmeden önce sansürlenir.",
          "hu": "Az indulási banner a kilistelt hostot, a portot, a csomópont URL-jét, az adatbázis útvonalát és a kapcsolók állapotát írja ki — titok értékét soha. A web3 RPC URL-ben lévő hitelesítő adatokat kitöröljük, mielőtt bármi a naplóba kerülne.",
        },
      },
      {
        state: "planned",
        k: {
          en: "Secrets at rest",
          ru: "Секреты на диске",
          de: "Secrets in Ruhe",
          fr: "Secrets au repos",
          it: "Segreti a riposo",
          nl: "Geheimen in rust",
          cs: "Tajemství v klidu",
          "zh-Hans": "静态存储的密钥",
          "zh-Hant": "靜態儲存的密鑰",
          es: "Secretos en reposo",
          pl: "Sekrety spoczynkowe",
          ja: "保存時の秘密情報",
          th: "secret ขณะพักอยู่",
          "fi": "Lepotilan avaimet",
          uk: "Секрети на диску",
          bg: "Тайни в покой",
          "tr": "Depolanan sırlar",
          hu: "Nyugvó titkok",
        },
        v: {
          en: "planned, and absent: no vault, no key derivation function, no cipher at rest. Session secrets and channel key material sit in plaintext SQLite columns, and the gateway is itself the channel issuer holding the Ed25519 identity pair — zero-knowledge holds against the relay, not against your own gateway.",
          ru: "в планах, а значит — отсутствует: ни хранилища, ни KDF, ни шифрования на диске. Секреты сессий и ключевой материал каналов лежат в открытых колонках SQLite, а шлюз сам является эмитентом канала и держит пару Ed25519 — zero-knowledge работает против SMP-реле, но не против вашего собственного шлюза.",
          de: "geplant und damit nicht vorhanden: kein Vault, keine Schlüsselableitung, keine Verschlüsselung in Ruhe. Sitzungsgeheimnisse und Kanal-Schlüsselmaterial stehen in Klartext-Spalten von SQLite, und das Gateway ist selbst der Kanal-Aussteller, der das Ed25519-Identitätspaar hält — Zero-Knowledge gilt gegen das Relay, nicht gegen dein eigenes Gateway.",
          fr: "prévu, donc absent : ni coffre, ni fonction de dérivation, ni chiffrement au repos. Les secrets de session et la matière de clé des canaux tiennent dans des colonnes SQLite en clair, et le gateway est lui-même l’émetteur du canal, détenteur de la paire Ed25519 — le zero-knowledge vaut contre le relais, pas contre votre propre passerelle.",
          it: "previsto e quindi assente: niente caveau, nessuna funzione di derivazione, nessuna cifratura a riposo. I segreti di sessione e il materiale delle chiavi dei canali stanno in colonne SQLite in chiaro, e il gateway è esso stesso l’emittente del canale, con in mano la coppia Ed25519 — il zero-knowledge vale contro il relay, non contro il tuo gateway.",
          "zh-Hant": "規劃中，也就是目前沒有：沒有保險庫，沒有金鑰派生函式，也沒有靜態加密。工作階段密鑰與頻道密鑰材料就躺在 SQLite 的明文字欄裡；而閘道本身就是頻道的簽發者，手上握著 Ed25519 身分密鑰對——零知識是對 SMP 中繼成立的，不是對你自己的閘道成立。",
          nl: "gepland en dus afwezig: geen kluis, geen key derivation-functie, geen versleuteling in rust. Sessiegeheimen en kanaalsleutelmateriaal staan in plaintext SQLite-kolommen, en de gateway is zelf de kanaaluitgever met dat Ed25519-identiteitspaar — zero-knowledge geldt tegen de relay, niet tegen je eigen gateway.",
          cs: "plánováno, tedy neexistuje: žádný trezor, žádná odvozovací funkce, žádné šifrování v klidu. Tajemství relací a materiál kanálových klíčů leží v plaintext sloupcích SQLite, a brána je sama vydavatelem kanálu s Ed25519 identifikačním párem — zero-knowledge platí proti relay, ne proti vaší vlastní bráně.",
          "zh-Hans": "规划中，也就是眼下没有：没有 vault，没有密钥派生函数，没有静态加密。会话密钥和频道密钥材料就躺在 SQLite 的明文列里，而网关本身就是频道的签发者，手里握着那对 Ed25519 身份密钥——零知识是对 SMP 中转站成立的，不是对你自己的网关成立的。",
          es: "previsto y por tanto ausente: no hay bóveda, ni función de derivación, ni cifrado en reposo. Los secretos de sesión y el material de clave de los canales viven en columnas de SQLite en texto plano, y la pasarela es en sí la emisora del canal, con el par Ed25519 en su poder — el zero-knowledge vale contra el relay, no contra tu propia pasarela.",
          pl: "planowane, a więc nieobecne: nie ma sejfu, funkcji wyprowadzania klucza ani szyfrowania spoczynkowego. Sekrety sesji i materiał kluczy kanałów leżą w jawnych kolumnach SQLite, a sama brama jest emitentem kanału i trzyma parę Ed25519 — zero-knowledge działa wobec przekaźnika, nie wobec twojej własnej bramy.",
          "fi": "suunnitteilla, siis poissa: ei holkkia, ei avaimenjohtofunktiota, ei salausta lepotilassa. Istuntojen avaimet ja kanavien avainmateriaali makaavat SQLite-taulun selväkielisinä sarakkeina, ja gateway on itse kanavanmyöntäjä, jolla on Ed25519-identiteettipari — nollatieto pätee relaita vastaan, ei omaa gatewaytäsi vastaan.",
          "tr": "planlandı, dolayısıyla yok: kasa yok, anahtar türetme fonksiyonu yok, depolama şifrelemesi yok. Oturum sırları ve kanal anahtar malzemesi SQLite sütunlarında düz metin duruyor; ağ geçidi zaten kanalın üreticisi ve Ed25519 kimlik çiftini elinde tutuyor — sıfır bilgi aktarana karşı geçerli, kendi ağ geçidine karşı değil.",
          uk: "у планах, а отже — відсутнє: немає сховища, функції виведення ключа чи шифрування на диску. Секрети сесій і ключовий матеріал каналів лежать у відкритих стовпцях SQLite, а шлюз сам є емітентом каналу й тримає пару Ed25519 — zero-knowledge діє проти релею, а не проти вашого власного шлюзу.",
          hu: "tervezett, vagyis jelenleg nincs: nincs trezor, nincs kulcsvezetési függvény, nincs nyugvó adatokat titkosító réteg. A munkamenetek titkai és a csatornák kulcsanyaga SQLite oszlopokban, nyílt szövegként hever, és az átjáró maga a csatorna-kibocsátó, amely az Ed25519 azonosító párt birtokolja — a zero-knowledge a relay ellen áll, nem a saját átjáród ellen.",
          bg: "планирано, следователно отсъстващо: няма трезор, няма функция за извеждане на ключ, няма криптиране в покой. Тайните на сесиите и ключовият материал на каналите лежат в чист текст в колони на SQLite, а самият гейтуейт е издателят на канала, държащ двойката Ed25519 — нулевото знание важи срещу relaya, не срещу собствения ти гейтуейт.",
          ja: "計画中であり、今は存在しません。保管庫も鍵導出関数も保存時暗号もありません。セッションシークレットとチャンネルの鍵素材は SQLite の平文カラムに置かれ、ゲートウェイ自身がチャンネルの発行者として Ed25519 の鍵ペアを持ちます。ゼロ知識が成立するのはリレーに対してであって、自分のゲートウェイに対してではありません。",
          th: "อยู่ในแผน ซึ่งแปลว่ายังไม่มี: ไม่มี vault ไม่มีฟังก์ชันสังเคราะห์คีย์ และไม่มีการเข้ารหัสขณะพัก คีย์ของเซสชันกับวัสดุคีย์ของแชนเนลอยู่ในคอลัมน์ SQLite เป็นข้อความชัด และเกตเวย์เองคือผู้ออกแชนเนลที่ถือคู่คีย์ Ed25519 — zero-knowledge ใช้ได้กับ relay เท่านั้น ไม่ใช่กับเกตเวย์ของคุณเอง",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Operator controls",
          ru: "Что делает оператор",
          de: "Was der Operator tut",
          fr: "Ce fait l’opérateur",
          it: "Cosa fa l’operatore",
          nl: "Wat de operator doet",
          cs: "Co děláš operátorem",
          "zh-Hans": "运维侧的补位",
          "zh-Hant": "維運側的補位",
          es: "Lo que aporta el operador",
          pl: "To, co dokłada operator",
          "ja": "運用側で埋める分",
          "th": "ส่วนที่ผู้ดูแลเติมเข้ามา",
          "fi": "Operaattorin keinot",
          uk: "Що робить оператор",
          bg: "Какво добавя операторът",
          "tr": "Operatörün üstlendiği",
          hu: "Amit az operátor pótol",
        },
        v: {
          en: "So the real boundary is the host: 0600 on .env, a service user nobody else can become, and a default bind on 127.0.0.1:8080 so the port never reaches the network. Anything finer is yours to configure.",
          ru: "Поэтому настоящая граница — это хост: 0600 на .env, сервисный пользователь, которым больше никто не может стать, и типичный bind на 127.0.0.1:8080, чтобы порт не выходил в сеть. Всё тоньше настраиваете вы.",
          de: "Die echte Grenze ist also der Host: 0600 auf .env, ein Dienstbenutzer, der sonst niemand werden kann, und ein Standard-Bind auf 127.0.0.1:8080, damit der Port nie ins Netz gelangt. Alles Feinere darfst du selbst konfigurieren.",
          fr: "La vraie frontière est donc l’hôte : 0600 sur .env, un utilisateur de service que personne d’autre ne peut devenir, et un bind par défaut sur 127.0.0.1:8080 pour que le port ne touche jamais le réseau. Tout ce qui est plus fin, c’est à vous de le configurer.",
          it: "Il vero confine dunque è l’host: 0600 su .env, un utente di servizio che nessun altro può diventare, e un bind predefinito su 127.0.0.1:8080 così che la porta non raggiunga mai la rete. Tutto ciò che è più fine tocca configurarlo a te.",
          nl: "De echte grens is dus de host: 0600 op .env, een servicegebruiker die niemand anders kan worden, en een standaard bind op 127.0.0.1:8080 zodat de poort het netwerk nooit haalt. Alles wat fijner is, stel jij zelf in.",
          cs: "Skutečná hranice je tedy hostitel: 0600 na .env, služební uživatel, kterým se nikdo další nestane, a výchozí bind na 127.0.0.1:8080, aby port nikdy nevlezl do sítě. Všechno jemnější si už nastavuješ sám.",
          "zh-Hans": "所以真正的边界是主机本身：.env 给 0600，跑在别的用户变不过去的服务账号下，默认只绑 127.0.0.1:8080，端口压根碰不到网络。比这更细的粒度，归你自己配。",
          "zh-Hant": "所以真正的邊界是主機本身：.env 給 0600，跑在別人變不過去的服務帳號下，預設只綁 127.0.0.1:8080，連線埠根本碰不到網路。比這更細的粒度，歸你自己配。",
          es: "Así que la frontera real es el host: 0600 en .env, un usuario de servicio que nadie más puede ser, y un bind por defecto en 127.0.0.1:8080 para que el puerto jamás toque la red. Todo lo más fino te toca configurarlo a ti.",
          pl: "Prawdziwą granicą jest więc host: 0600 na .env, konto serwisowe, którym nikt inny nie może zostać, oraz domyślny bind na 127.0.0.1:8080, by port w ogóle nie wyszedł do sieci. Wszystko subtelniejsze musicie ustawić sami.",
          "ja": "つまり実質的な境界はホストです。.env に 0600 を掛け、他の誰もなれないサービスユーザーで動かし、既定では 127.0.0.1:8080 にバインドする。だからポートはネットワークに届きません。これより細かい粒度はあなたの設定次第です。",
          th: "ดังนั้นเส้นแบ่งที่แท้จริงคือตัวเครื่อง: .env ตั้ง 0600, รันด้วยบัญชี service ที่คนอื่นกลายเป็นไม่ได้ และ bind ค่าเริ่มต้นที่ 127.0.0.1:8080 พอร์ตจึงไม่แตะเครือข่ายเลย รายละเอียดที่เล็กลงไปกว่านี้ คุณต้องตั้งเอง",
          fi: "Todellinen raja on siis isäntäkone: 0600 .env:lle, palvelukäyttäjä, joksi kukaan muu ei voi tulla, ja oletusbindaus 127.0.0.1:8080, joten portti ei yllä verkkoon. Hienommat säädöt ovat sinun konfiguroitavaksesi.",
          "uk": "Тож справжня межа — це хост: 0600 на .env, сервісний користувач, ким більше ніхто не може стати, та типовий bind на 127.0.0.1:8080, щоб порт не виходив у мережу. Усе тонше налаштовуєте ви.",
          "bg": "Реалната граница е хостът: 0600 върху .env, сервисен потребител, в който никой друг не може да се превърне, и bind по подразбиране на 127.0.0.1:8080, та портът никога да не стига мрежата. Всичко по-фино отреждаш сам.",
          "tr": "Dolayısıyla gerçek sınır ana makinedir: .env üzerinde 0600, kimsenin olamadığı bir servis kullanıcısı ve portun ağa hiç çıkmaması için varsayılan olarak 127.0.0.1:8080 üzerine bind. Bundan ince olan her şeyi siz ayarlıyorsunuz.",
          "hu": "A valódi határ tehát a gép: 0600 a .env-re, egy szolgáltatás-felhasználó, amely senki más nem lehet, és alapértelmezett bindolás a 127.0.0.1:8080 címre, így a port soha eléri a hálózatot. Aennél finomabb beállítás már a te dolgod.",
        },
      },
    ],
    keys: [".env (mode 0600)", "POPOPX_ADMIN_TOKEN", "gateway/app/config.py", "gateway/app/database.py"],
  },
  {
    id: "admin-token",
    code: "Admin authorisation",
    accent: "brand",
    glyph: ["M4 6h16v12H4z", "M8 10h4", "M8 14h8"],
    name: {
      en: "Admin authorisation: one token, no scopes",
      ru: "Авторизация админа: один токен, без скоупов",
      de: "Admin-Autorisierung: ein Token, keine Scopes",
      fr: "Autorisation admin : un jeton, pas de scopes",
      it: "Autorizzazione admin: un token, niente scope",
      nl: "Admin-autorisatie: één token, geen scopes",
      cs: "Ověření admina: jeden token, žádné rozsahy",
      "zh-Hans": "管理员授权：一枚令牌，没有权限范围",
      "zh-Hant": "管理員授權：一枚權杖，沒有權限範圍",
      es: "Autorización de administración: un token, sin scopes",
      pl: "Uwierzytelnianie administratora: jeden token, brak zakresów",
      ja: "管理権限 — トークン 1 つ、スコープなし",
      th: "การให้สิทธิ์ผู้ดูแล: โโทเคนเดียว ไม่มี scope",
      fi: "Admin-valtuutus: yksi token, ei skooppeja",
      uk: "Авторизація адміна: один токен, без скоупів",
      bg: "Оторизация на админа: един токен, без обеми",
      tr: "Yönetici yetkilendirmesi: tek token, kapsam yok",
      hu: "Admin-hitelesítés: egy token, scope-ok nélkül",
    },
    hook: {
      en: "Authorisation is a single static bearer credential. That is the whole model — and it is why the console page may be public.",
      ru: "Авторизация — это одна статическая bearer-учётка. Вся модель в этом, и именно поэтому страница консоли может быть публичной.",
      de: "Autorisierung ist ein einzelnes statisches Bearer-Credential. Das ist das ganze Modell — und der Grund, warum die Konsolenseite öffentlich sein darf.",
      fr: "L’autorisation est un unique credential bearer statique. C’est tout le modèle, et c’est pour ça que la page console peut être publique.",
      it: "L’autorizzazione è una singola credenziale bearer statica. È tutto il modello, ed è per questo che la pagina della console può essere pubblica.",
      nl: "Autorisatie is één statische bearer-credential. Dat is het hele model — en daarom mag de consolepagina openbaar zijn.",
      cs: "Ověření je jediný statický bearer údaj. To je celý model, a proto může být stránka konzole veřejná.",
      "zh-Hans": "授权就是一枚静态 bearer 凭据，模型只有这么多——这也正是控制台页面可以公开的理由。",
      "zh-Hant": "授權就是一枚靜態 bearer 憑證，模型就只有這麼多——這也是控制台頁面可以公開的理由。",
      es: "La autorización es una única credencial bearer estática. Ese es todo el modelo, y por eso la página de consola puede ser pública.",
      pl: "Uwierzytelnianie to jeden statyczny poświadczenie bearer. Na tym polega cały model i dlatego strona konsoli może być publiczna.",
      ja: "認可は静的な bearer 認証情報の 1 本だけ。モデルはそれで完結しており、コンソールページを公開できる理由もそこにあります。",
      th: "การให้สิทธิ์คือ bearer credential สถิติเพียงหนึ่งเดียว โมเดลมีเท่านี้เอง และนั่นคือเหตุผลที่หน้าคอนโซลจะเป็นสาธารณะก็ได้",
      fi: "Valtuutus on yksi staattinen bearer-tunnus. Siinä koko malli — ja siksi konsolisivu saa olla julkinen.",
      uk: "Авторизація — це одна статична bearer-облікові дані. Вся модель у цьому, і саме тому сторінка консолі може бути публічною.",
      bg: "Оторизацията е едно статично bearer удостоверение. Целият модел е това, и затова страницата на конзолата може да е публична.",
      "tr": "Yetkilendirme tek bir statik bearer kimlik bilgisidir. Modelin tamamı bu — ve konsol sayfasının herkese açık olabilmesinin nedeni de bu.",
      "hu": "A jogosultság egy darab statikus bearer hitelesítő. Ez az egész modell, és ezért lehet nyilvános a konzol oldala.",
    },
    rows: [
      {
        state: "shipped",
        k: {
          en: "Credential",
          ru: "Учётные данные",
          de: "Zugangsdaten",
          fr: "Identifiant",
          it: "Credenziale",
          nl: "Inloggegevens",
          cs: "Pověření",
          "zh-Hans": "凭据",
          "zh-Hant": "憑證",
          es: "Credencial",
          pl: "Poświadczenie",
          ja: "認証情報",
          "th": "ข้อมูลยืนยันตัว",
          fi: "Tunnus",
          uk: "Облікові дані",
          bg: "Удостоверение",
          tr: "Kimlik bilgisi",
          hu: "Hitelesítő",
        },
        v: {
          en: "X-Admin-Token, or ?token= in the query string, compared in constant time against POPOPX_ADMIN_TOKEN. An empty configured token is a refusal, never a wildcard.",
          ru: "X-Admin-Token либо ?token= в строке запроса, сравнивается с POPOPX_ADMIN_TOKEN за постоянное время. Пустое настроенное значение — это отказ, а не подстановочный шаблон.",
          de: "X-Admin-Token, oder ?token= in der Query, wird mit konstanter Laufzeit gegen POPOPX_ADMIN_TOKEN verglichen. Ein leer konfiguriertes Token ist eine Ablehnung, nie ein Platzhalter.",
          fr: "X-Admin-Token, ou ?token= dans la query, comparé à temps constant avec POPOPX_ADMIN_TOKEN. Un jeton configuré vide est un refus, jamais un joker.",
          it: "X-Admin-Token, oppure ?token= nella query string, confrontato a tempo costante con POPOPX_ADMIN_TOKEN. Un token configurato vuoto è un rifiuto, mai un jolly.",
          "zh-Hant": "X-Admin-Token，或 query 裡的 ?token=，與 POPOPX_ADMIN_TOKEN 做常數時間比對。設定檔裡留空是拒絕，不是萬用字元。",
          nl: "X-Admin-Token, of ?token= in de querystring, vergeleken met constante looptijd tegen POPOPX_ADMIN_TOKEN. Een leeg gezet token is een weigering, nooit een wildcard.",
          cs: "X-Admin-Token, nebo ?token= v dotazu, porovnán s POPOPX_ADMIN_TOKEN ve stálém čase. Prázdně nastavený token znamená zamítnutí, nikoli divoká karta.",
          "zh-Hans": "X-Admin-Token，或者 query 里的 ?token=，与 POPOPX_ADMIN_TOKEN 做常数时间比对。配置里留空是拒绝，不是通配。",
          es: "X-Admin-Token, o ?token= en la consulta, comparado en tiempo constante contra POPOPX_ADMIN_TOKEN. Un token configurado vacío es un rechazo, nunca un comodín.",
          pl: "X-Admin-Token albo ?token= w zapytaniu, porównywany w stałym czasie z POPOPX_ADMIN_TOKEN. Pusty token w konfiguracji to odmowa, nigdy wieloznacznik.",
          ja: "X-Admin-Token、またはクエリの ?token= を POPOPX_ADMIN_TOKEN と定数時間で比較します。設定が空なら拒否であって、ワイルドカードにはなりません。",
          th: "X-Admin-Token หรือ ?token= ใน query จะถูกเทียบกับ POPOPX_ADMIN_TOKEN แบบคงเวลา ถ้าตั้งไว้ว่างเปล่าคือการปฏิเสธ ไม่ใช่ wildcard",
          fi: "X-Admin-Token tai ?token= kyselyssä verrataan vakioajassa POPOPX_ADMIN_TOKENiin. Tyhjä asetettu token on hylkäys, ei koskaan villikortti.",
          uk: "X-Admin-Token або ?token= у рядку запиту порівнюється за сталий час з POPOPX_ADMIN_TOKEN. Порожнє значення в конфігу — це відмова, а не wildcard.",
          bg: "X-Admin-Token или ?token= в заявката, сравнен с постоянно време срещу POPOPX_ADMIN_TOKEN. Празен конфигуриран токен е отказ, никога не е заместител.",
          "tr": "X-Admin-Token ya da sorgudaki ?token=, POPOPX_ADMIN_TOKEN ile sabit zamanda karşılaştırılır. Boş bırakılmış token bir rettir, asla joker değildir.",
          "hu": "X-Admin-Token, vagy a queryben a ?token=, állandó idejű összehasonlítással a POPOPX_ADMIN_TOKEN-nal. Az üresen hagyott token elutasítás, soha nem helyettesítő karakter.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Where it bites",
          ru: "Где срабатывает",
          de: "Wo es greift",
          fr: "Où ça frappe",
          it: "Dove scatta",
          nl: "Waar het bijt",
          cs: "Kde to zabírá",
          "zh-Hans": "在哪里生效",
          "zh-Hant": "在哪裡生效",
          es: "Dónde actúa",
          pl: "Gdzie działa",
          ja: "効いてくる場所",
          th: "ตรงที่มีผล",
          fi: "Missä se iskee",
          uk: "Де спрацьовує",
          bg: "Къде хапе",
          tr: "Nerede devreye giriyor",
          hu: "Hol ütközik ki",
        },
        v: {
          en: "Middleware covers every path under /api/v1/plugins/ and answers 401 {\"ok\":false,\"error\":\"unauthorized\"} before a plugin ever sees the request.",
          ru: "Мидлвара накрывает все пути под /api/v1/plugins/ и отвечает 401 {\"ok\":false,\"error\":\"unauthorized\"}, прежде чем запрос увидит плагин.",
          de: "Die Middleware deckt jeden Pfad unter /api/v1/plugins/ ab und antwortet 401 {\"ok\":false,\"error\":\"unauthorized\"}, bevor ein Plugin die Anfrage je zu Gesicht bekommt.",
          fr: "Le middleware couvre tous les chemins sous /api/v1/plugins/ et répond 401 {\"ok\":false,\"error\":\"unauthorized\"} avant qu’un plugin voie la requête.",
          it: "Il middleware copre ogni percorso sotto /api/v1/plugins/ e risponde 401 {\"ok\":false,\"error\":\"unauthorized\"} prima che un plugin veda la richiesta.",
          nl: "De middleware dekt elk pad onder /api/v1/plugins/ en antwoordt 401 {\"ok\":false,\"error\":\"unauthorized\"} voordat een plug-in het verzoek ooit ziet.",
          cs: "Middleware pokrývá každou cestu pod /api/v1/plugins/ a odpovědí 401 {\"ok\":false,\"error\":\"unauthorized\"}, dřív než plugin request vůbec uvidí.",
          "zh-Hans": "中间件覆盖 /api/v1/plugins/ 下的每一条路径，在插件看到请求之前就返回 401 {\"ok\":false,\"error\":\"unauthorized\"}。",
          "zh-Hant": "中介層涵蓋 /api/v1/plugins/ 下的每一條路徑，在外掛看到請求之前就回傳 401 {\"ok\":false,\"error\":\"unauthorized\"}。",
          es: "El middleware cubre todas las rutas bajo /api/v1/plugins/ y responde 401 {\"ok\":false,\"error\":\"unauthorized\"} antes de que un complemento vea la petición.",
          pl: "Middleware obejmuje każdą ścieżkę pod /api/v1/plugins/ i odpowiada 401 {\"ok\":false,\"error\":\"unauthorized\"}, zanim wtyczka w ogóle zobaczy żądanie.",
          ja: "ミドルウェアは /api/v1/plugins/ 以下の全パスを覆い、プラグインがリクエストを見る前に 401 {\"ok\":false,\"error\":\"unauthorized\"} を返します。",
          th: "middleware ครอบคลุมทุกเส้นทางใต้ /api/v1/plugins/ และตอบ 401 {\"ok\":false,\"error\":\"unauthorized\"} ตั้งแต่ปลั๊กอินยังไม่เห็นคำขอ",
          fi: "Middleware kattaa kaikki polut kohdan /api/v1/plugins/ alla ja vastaa 401 {\"ok\":false,\"error\":\"unauthorized\"} ennen kuin lisäosa näkee pyynnön.",
          uk: "Мідлвара накриває всі шляхи під /api/v1/plugins/ і відповідає 401 {\"ok\":false,\"error\":\"unauthorized\"}, перш ніж плагін взагалі побачить запит.",
          "bg": "Middleware-ът покрива всеки път под /api/v1/plugins/ и отговаря с 401 {\"ok\":false,\"error\":\"unauthorized\"}, преди плъгинът изобщо да види заявката.",
          "tr": "Ara katman /api/v1/plugins/ altındaki her yolu kapsar ve bir eklenti isteği görmeden 401 {\"ok\":false,\"error\":\"unauthorized\"} ile yanıt verir.",
          "hu": "A middleware az /api/v1/plugins/ alatti minden útvonalat lefedi, és 401 {\"ok\":false,\"error\":\"unauthorized\"} választ ad, mielőtt a bővítmény látná a kérést.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Public by design",
          ru: "Публично по замыслу",
          de: "Absichtlich öffentlich",
          fr: "Public par conception",
          it: "Pubblico per progettazione",
          nl: "Publiek met opzet",
          cs: "Veřejné záměrně",
          "zh-Hans": "有意公开",
          "zh-Hant": "刻意公開",
          es: "Público a propósito",
          pl: "Publiczne z założenia",
          ja: "意図的な公開",
          th: "เปิดสาธารณะโดยเจตนา",
          fi: "Julkinen tarkoituksella",
          uk: "Публічно за задумом",
          bg: "Публично по замисъл",
          tr: "Bilinçli olarak açık",
          hu: "Szándékosan nyilvános",
        },
        v: {
          en: "Three exemptions: any path ending /webhook, /verify or /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — the QR page poll, where a browser can hold no secret.",
          ru: "Три исключения: любой путь на /webhook, /verify или /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} — опрос QR-страницы, где браузер не может держать секрет.",
          de: "Drei Ausnahmen: jeder Pfad auf /webhook, /verify oder /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — der Poll der QR-Seite, wo kein Browser ein Geheimnis halten kann.",
          fr: "Trois exemptions : tout chemin finissant par /webhook, /verify ou /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — le poll de la page QR, où un navigateur ne peut détenir aucun secret.",
          it: "Tre esenzioni: qualsiasi percorso che finisce in /webhook, /verify o /callback, più GET /api/v1/plugins/sso/sessions/{session_id} — l’interrogazione della pagina QR, dove un browser non può custodire alcun segreto.",
          nl: "Drie uitzonderingen: elk pad eindigend op /webhook, /verify of /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — de poll van de QR-pagina, waar een browser geen geheim kan dragen.",
          cs: "Tři výjimky: jakákoli cesta končící /webhook, /verify nebo /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — dotaz QR stránky, kde prohlížeč nemůže nést tajný údaj.",
          "zh-Hans": "三类豁免：以 /webhook、/verify 或 /callback 结尾的路径，外加 GET /api/v1/plugins/sso/sessions/{session_id}——那是二维码页面在轮询，浏览器里根本放不进密钥。",
          "zh-Hant": "三類豁免：以 /webhook、/verify 或 /callback 結尾的路徑，外加 GET /api/v1/plugins/sso/sessions/{session_id}——那是 QR 頁面在輪詢，瀏覽器裡根本放不進密鑰。",
          es: "Tres exenciones: cualquier ruta que termine en /webhook, /verify o /callback, más GET /api/v1/plugins/sso/sessions/{session_id} — el sondeo de la página QR, donde un navegador no puede guardar ningún secreto.",
          pl: "Trzy wyłączenia: każda ścieżka kończąca się na /webhook, /verify albo /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} — odpytywanie strony QR, na której przeglądarka nie może trzymać sekretu.",
          ja: "例外は三つ: /webhook、/verify、/callback で終わるパス、それに GET /api/v1/plugins/sso/sessions/{session_id} です。QR ページのポーリングで、ブラウザーに秘密を持たせられない場所です。",
          th: "มีข้อยกเว้นสามอย่าง: เส้นทางที่ลงท้ายด้วย /webhook, /verify หรือ /callback บวกกับ GET /api/v1/plugins/sso/sessions/{session_id} —คือการถามสถานะของหน้า QR ซึ่งเบราว์เซอร์เก็บ secret ไว้ไม่ได้",
          fi: "Kolme poikkeusta: kaikki polut, jotka päättyvät /webhook, /verify tai /callback, sekä GET /api/v1/plugins/sso/sessions/{session_id} — QR-sivun kysely, jossa selain ei voi säilyttää salaisuutta.",
          uk: "Три винятки: будь-який шлях на /webhook, /verify чи /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} — опитування QR-сторінки, де браузер не може тримати секрет.",
          bg: "Три изключения: всеки път, завършващ на /webhook, /verify или /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} — допитването на QR страницата, където браузър не може да пази тайна.",
          "tr": "Üç muafiyet: /webhook, /verify veya /callback ile biten her yol, bir de GET /api/v1/plugins/sso/sessions/{session_id} — QR sayfasının yoklaması; tarayıcı orada sır tutamaz.",
          "hu": "Két kivételi csoport van: minden /webhook, /verify vagy /callback végű útvonal, valamint a GET /api/v1/plugins/sso/sessions/{session_id} — a QR-oldal lekérdezése, ahol a böngésző nem tarthat titkot.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "The console page",
          ru: "Страница консоли",
          de: "Die Konsolenseite",
          fr: "La page console",
          it: "La pagina della console",
          nl: "De consolepagina",
          cs: "Stránka konzole",
          "zh-Hans": "控制台页面",
          "zh-Hant": "控制台頁面",
          es: "La página de consola",
          pl: "Strona konsoli",
          ja: "コンソールページ",
          th: "หน้าคอนโซล",
          fi: "Konsolisivu",
          uk: "Сторінка консолі",
          bg: "Страницата на конзолата",
          "tr": "Konsol sayfası",
          hu: "A konzol oldala",
        },
        v: {
          en: "GET / serves the static SPA from gateway/app/static/index.html with no token, deliberately. The page is a shell and every write carries the token, so a leaked page is not a leaked gateway.",
          ru: "GET / отдаёт статический SPA из gateway/app/static/index.html без токена — нарочно. Страница лишь оболочка, а каждый запрос на запись идёт с токеном, поэтому утёкшая страница — это не утёкший шлюз.",
          de: "GET / liefert bewusst die statische SPA aus gateway/app/static/index.html ohne Token. Die Seite ist eine Hülle und jeder Schreibzugriff trägt das Token — eine geleakte Seite ist also kein geleaktes Gateway.",
          fr: "GET / sert le SPA statique depuis gateway/app/static/index.html sans jeton, volontairement. La page n’est qu’une coquille et chaque écriture porte le jeton : une page divulguée n’est donc pas une passerelle divulguée.",
          it: "GET / serve la SPA statica da gateway/app/static/index.html senza token, deliberatamente. La pagina è un guscio e ogni scrittura porta il token, quindi una pagina trapelata non è un gateway trapelato.",
          nl: "GET / levert de statische SPA uit gateway/app/static/index.html zonder token, met opzet. De pagina is een omhulsel en elke schrijfactie draagt het token, dus een gelekte pagina is geen gelekte gateway.",
          cs: "GET / záměrně vydává statickou SPA z gateway/app/static/index.html bez tokenu. Stránka je jen schránka a každý zápis nese token, takže uniklá stránka není uniklá brána.",
          "zh-Hans": "GET / 故意不带令牌就把 gateway/app/static/index.html 这个静态 SPA 发出去。页面只是个壳，每一次写请求都得带令牌，所以页面泄露不等于网关泄露。",
          "zh-Hant": "GET / 故意不帶權杖就把 gateway/app/static/index.html 這個靜態 SPA 發出去。頁面只是個殼，每一次寫請求都得帶權杖，所以頁面洩漏不等於閘道洩漏。",
          "es": "GET / sirve la SPA estática desde gateway/app/static/index.html sin token, a propósito. La página es una carcasa y cada escritura lleva el token, así que una página filtrada no es una pasarela filtrada.",
          pl: "GET / celowo wydaje statyczne SPA z gateway/app/static/index.html bez tokenu. Strona jest powłoką, a każde zapisywanie niesie token, więc wyciekła strona to nie wycieknięta brama.",
          ja: "GET / は gateway/app/static/index.html の静的 SPA を、意図的にトークン無しで返します。ページは器にすぎず、書き込みはすべてトークンを伴うので、ページが漏れた＝ゲートウェイが漏れたにはなりません。",
          th: "GET / ส่ง SPA สถิติจาก gateway/app/static/index.html โดยไม่มีโทเคน และทำแบบนั้นโดยเจตนา หน้าเพจเป็นแค่เปลือก ทุกคำขอเขียนจะพกโทเคนไปด้วย ดังนั้นหน้าหลุดไม่ได้หมายความว่าเกตเวย์หลุด",
          "fi": "GET / palvelee staattisen SPA:n osoitteesta gateway/app/static/index.html ilman tokenia tarkoituksella. Sivu on kuori ja jokainen kirjoitus kantaa tokenin, joten vuotanut sivu ei vuotanut gatewaytä.",
          uk: "GET / навмисно віддає статичний SPA з gateway/app/static/index.html без токена. Сторінка лише оболонка, а кожен запис на зміну несе токен, тож витік сторінки — це не витік шлюзу.",
          "bg": "GET / съзнателно обслужва статичното SPA от gateway/app/static/index.html без токен. Страницата е обвивка и всяко записване носи токена, следователно отекла страница не е отекъл гейтуейт.",
          "tr": "GET / bilinçli olarak statik SPA’yı gateway/app/static/index.html üzerinden token vermeden sunar. Sayfa yalnızca bir kabuktur ve her yazma işlemi token’ı taşır; bu yüzden sızan bir sayfa sızan bir ağ geçidi değildir.",
          "hu": "A GET / szándékosan, token nélkül kiszolgálja a gateway/app/static/index.html statikus SPA-t. Az oldal csak egy héj, és minden írás viseli a tokent, így egy kiszivárgott oldal nem kiszivárgott átjárót jelent.",
        },
      },
      {
        state: "planned",
        k: {
          en: "Fine-grained rights",
          ru: "Тонкие права",
          de: "Feingranulare Rechte",
          fr: "Droits fins",
          it: "Permessi granulari",
          nl: "Fijne rechten",
          cs: "Jemná oprávnění",
          "zh-Hans": "细粒度权限",
          "zh-Hant": "細粒度權限",
          es: "Derechos de grano fino",
          pl: "Uprawnienia szczegółowe",
          ja: "細粒度の権限",
          th: "สิทธิ์แบบละเอียด",
          "fi": "Hienot oikeudet",
          uk: "Деталізовані права",
          bg: "Фино зърнести права",
          tr: "İnce taneli yetkiler",
          hu: "Finom jogok",
        },
        v: {
          en: "planned, and absent: no permission scopes, no per-key ACL, no read-only credential. The one token is all-or-nothing. Today’s least-privilege answer is the per-plugin switch, the loopback bind and the read-only GET routes.",
          ru: "в планах, а значит — отсутствует: нет областей доступа, нет ACL на ключ, нет права только на чтение. Один токен — всё или ничего. Ответ «минимальных привилегий» сегодня: переключатель плагина, bind на loopback и чтение через GET.",
          de: "geplant und damit nicht vorhanden: keine Berechtigungsumfänge, keine ACL pro Schlüssel, kein Nur-Lese-Credential. Das eine Token heißt alles oder nichts. Die Least-Privilege-Antwort von heute ist der Plugin-Schalter, der Loopback-Bind und die Nur-Lese-GET-Routen.",
          "zh-Hant": "規劃中，也就是目前沒有：沒有權限範圍，沒有逐金鑰的 ACL，沒有唯讀憑證。那一枚權杖是全有或全無。今天的「最小權限」答案是：逐外掛開關、loopback 綁定，以及唯讀的 GET 路徑。",
          fr: "prévu, donc absent : pas de portée de permission, pas d’ACL par clé, pas de credential en lecture seule. L’unique jeton veut tout ou rien. La réponse « moindre privilège » d’aujourd’hui : la bascule par plugin, le bind loopback et les routes GET en lecture seule.",
          it: "previsto e quindi assente: niente scope di permesso, niente ACL per chiave, niente credenziale di sola lettura. L’unico token è tutto-o-niente. La risposta least-privilege di oggi è l’interruttore per plugin, il bind loopback e le route GET di sola lettura.",
          nl: "gepland en dus afwezig: geen permisiescopes, geen ACL per sleutel, geen alleen-lezen credential. Het ene token is alles-of-niets. Het least-privilege-antwoord van vandaag is de plugin-schakelaar, de loopback-bind en de alleen-lezen GET-routes.",
          cs: "plánováno, tedy neexistuje: žádné rozsahy oprávnění, žádný ACL na klíč, žádnéreadonly pověření. Jediný token je vše nebo nic. Dnešní odpověď nejnižších oprávnění je přepínač pluginu, loopback bind a GET trasy jen pro čtení.",
          "zh-Hans": "规划中，也就是眼下没有：没有权限范围，没有按密钥的 ACL，也没有只读凭据。这一枚令牌是全有或全无。今天所谓最小权限，靠的是按插件的开关、回环绑定，和只读的 GET 路由。",
          es: "previsto y por tanto ausente: sin scopes de permiso, sin ACL por clave, sin credencial de solo lectura. El único token lo da todo o no da nada. La respuesta de mínimo privilegio hoy es el interruptor por complemento, el bind de loopback y las rutas GET de solo lectura.",
          pl: "planowane, a więc nieobecne: brak zakresów uprawnień, brak ACL dla klucza, brak poświadczenia tylko-do-odczytu. Ten jeden token to wszystko albo nic. Dzisiejsza odpowiedź najmniejszych uprawnień to przełącznik wtyczki, bindowanie loopback i ścieżki GET tylko do odczytu.",
          ja: "計画中であり、今はありません。権限スコープも、キー単位の ACL も、読み取り専用の認証情報もありません。唯一のトークンは全権か無権かの二択です。今のところ最小権限の答えは、プラグイン単位のスイッチと loopback バインド、そして読み取り専用の GET ルートです。",
          th: "อยู่ในแผน ซึ่งยังไม่มี: ไม่มี scope สิทธิ์ ไม่มี ACL ต่อคีย์ และไม่มี credential แบบอ่านอย่างเดียว โทเคนเดียวนี้คือทั้งหมดหรือไม่เลย คำตอบของ least privilege วันนี้คือสวิตช์รายปลั๊กอิน การ bind เฉพาะ loopback และเส้นทาง GET ที่อ่านอย่างเดียว",
          fi: "suunnitteilla, siis poissa: ei käyttöoikeuskooppeja, ei avainta kohden ACL:ää, ei vain-luku-tunnusta. Yksi token on kaikki tai ei mitään. Tämän päivän vähäisin oikeuksin -vastaus on lisäosakytkin, loopback-bindaus ja vain-luku GET -reitit.",
          uk: "у планах, а отже — відсутнє: немає скоупів прав, немає ACL на ключ, немає Credential лише для читання. Той один токен — це все або нічого. Сучасна відповідь «мінімальних привілеїв»: перемикач плагіна, bind на loopback та читання через GET-маршрути.",
          bg: "планирано, следователно отсъстващо: няма обеми от права, няма ACL по ключ, няма удостоверение само за четене. Единствият токен е всичко или нищо. Днешният отговор за най-малки права е превключвателят по плъгин, loopback bind и GET маршрутите само за четене.",
          "tr": "planlandı, dolayısıyla yok: izin kapsamları, anahtar başına ACL, salt okunur bir kimlik bilgisi yok. Tek token ya her şeydir ya hiçbir şey. Bugünkü en az ayrıcalık yanıtı eklenti başına anahtar, loopback bind ve salt okunur GET rotalarıdır.",
          "hu": "tervezett, vagyis nincs: sem jogosultsági scope, sem kulcsenkénti ACL, sem csak olvasható hitelesítő. Az egyetlen token mindent vagy semmit ad. A legkisebb jogosultság mára a bővítményenkénti kapcsoló, a loopback bindolás és a csak olvasható GET útvonalak.",
        },
      },
    ],
    keys: ["X-Admin-Token", "?token=", "PUBLIC_PLUGIN_SUFFIXES", "gateway/app/main.py"],
  },
  {
    id: "webhook",
    code: "Webhook intake",
    accent: "mesh",
    glyph: ["M4 12h9", "M10 8l4 4-4 4", "M18 5v14"],
    name: {
      en: "Webhook intake: a static token, fail-closed",
      ru: "Приём вебхуков: статический токен, отказ по умолчанию",
      de: "Webhook-Eingang: ein statisches Token, fail-closed",
      fr: "Réception webhook : un jeton statique, fermé par défaut",
      it: "Ingresso webhook: un token statico, fail-closed",
      nl: "Webhook-ingang: een statisch token, fail-closed",
      cs: "Příjem webhooku: statický token, zavřeno ve výchozím stavu",
      "zh-Hans": "webhook 入口：静态令牌，默认拒绝",
      "zh-Hant": "webhook 入口：靜態權杖，預設拒絕",
      es: "Entrada de webhook: un token estático, cerrado por defecto",
      pl: "Wejście webhook: statyczny token, domyślnie odrzucający",
      ja: "Webhook 受け口 — 静的トークンで、未設定なら全拒否",
      th: "ช่องทางรับ webhook: โทเคนแบบสถิต, ปิดไว้ก่อน",
      fi: "Webhook-sisäänmeno: staattinen token, fail-closed",
      uk: "Прийом вебхуків: статичний токен, відмова за замовчуванням",
      bg: "Вход за уебхуки: статичен токен, затворен по подразбиране",
      tr: "Webhook girişi: statik token, varsayılan olarak kapalı",
      hu: "Webhook-bemenet: statikus token, alapból zárva",
    },
    hook: {
      en: "Alert delivery is authenticated by a shared token, not by a signature over the payload. The useful detail: leaving the token unset locks the door instead of opening it.",
      ru: "Доставка алертов проверяется общим токеном, а не подписью к телу. Полезная деталь: незаполненный токен закрывает дверь, а не открывает её.",
      de: "Die Zustellung von Alerts wird mit einem geteilten Token geprüft, nicht mit einer Signatur über dem Payload. Das nützliche Detail: ein leer gelassenes Token schließt die Tür, statt sie zu öffnen.",
      fr: "La livraison d’alertes est authentifiée par un jeton partagé, pas par une signature du payload. Le détail utile : laisser le jeton non défini verrouille la porte au lieu de l’ouvrir.",
      it: "La consegna degli avvisi è autenticata da un token condiviso, non da una firma sul payload. Il dettaglio utile: lasciare il token non impostato chiude la porta invece di aprirla.",
      nl: "Alarmpostbezorging wordt geauthenticeerd met een gedeeld token, niet met een handtekening op de payload. Het nuttige detail: een ongezet token sluit de deur in plaats van te openen.",
      cs: "Doručení alertů ověřuje sdílený token, ne podpis nad payloadem. Užitečný detail: nenastavený token dveře zamkne, místo aby je otevřel.",
      "zh-Hans": "告警投递靠一颗共享令牌来验，不是靠对 body 签名。有个好消息：忘了设这颗令牌，门是锁上的，不是敞开的。",
      "zh-Hant": "告警投递靠一顆共用權杖來驗，不是靠對 body 簽名。有個好消息：忘了設這顆權杖，門是鎖上的，不是敞開的。",
      es: "La entrega de alertas la autentica un token compartido, no una firma sobre el payload. El detalle útil: dejar el token sin configurar cierra la puerta en lugar de abrirla.",
      pl: "Dostarczenie alertu uwierzytelnia współdzielony token, a nie podpis nad payloadem. Pożyteczny szczegół: nieustawiony token zamyka drzwi, zamiast je otwierać.",
      ja: "告警の受け入れは署名ではなく共有トークンで認可します。ここで役に立つのは、トークンを設定し忘れると扉が開くのではなく閉じるという点です。",
      th: "การรับแจ้งเหตุใช้โทเคนร่วมกันยืนยันตัวตน ไม่ใช่ลายเซ็นบน payload จุดที่เป็นข่าวดีคือ ถ้าลืมตั้งโทเคน ประตูจะล็อก ไม่ใช่เปิดอ้า",
      fi: "Hälytysten toimitus todetaan jaetulla tokenilla, ei allekirjoituksella payloadin päällä. Hyödyllinen yksityiskohta: asettamaton token lukitsee oven sen sijaan että avaisi sen.",
      uk: "Доставку алертів перевіряє спільний токен, а не підпис до тіла. Корисна деталь: не заповнений токен замикає двері, а не відчиняє їх.",
      bg: "Доставката на известия се удостоверява с споделен токен, а не с подпис върху самия товар. Полезният детайл: непоставен токен заключва вратата, вместо да я отваря.",
      tr: "Uyarı teslimi bir imzayla değil, paylaşılan bir token ile doğrulanır. İşe yarar ayrıntı: token’ı boş bırakmak kapıyı açmaz, kilitler.",
      "hu": "A riasztások átvitelét nem a payload aláírása, hanem egy közös token hitelesíti. A hasznos részlet: ha a tokent be nem állítod, az ajtó bezárul, nem kinyílik.",
    },
    sample: WEBHOOK_SAMPLE,
    sampleCaption: WEBHOOK_CAPTION,
    rows: [
      {
        state: "shipped",
        k: {
          en: "Two header forms",
          ru: "Две формы заголовка",
          de: "Zwei Header-Formen",
          fr: "Deux formes d’en-tête",
          it: "Due forme di header",
          nl: "Twee kopvormen",
          cs: "Dvě podoby hlavičky",
          "zh-Hans": "两种请求头写法",
          "zh-Hant": "兩種標頭寫法",
          es: "Dos formas de encabezado",
          pl: "Dwie postacie nagłówka",
          ja: "ヘッダーの2形",
          th: "รูปแบบส่วนหัวสองแบบ",
          "fi": "Kaksi otsikkotapaa",
          uk: "Дві форми заголовка",
          bg: "Две форми на заглавка",
          tr: "İki başlık biçimi",
          hu: "Két fejlécalak",
        },
        v: {
          en: "Either X-Popopx-Alert-Token or Authorization: Bearer, matched against POPOPX_ALERT_WEBHOOK_TOKEN in constant time. No HMAC over the body, no timestamp, no replay window — that is the whole gate.",
          ru: "Либо X-Popopx-Alert-Token, либо Authorization: Bearer; значение сравнивается с POPOPX_ALERT_WEBHOOK_TOKEN за постоянное время. Без HMAC над телом, без метки времени, без окна повтора — вся защита в этом.",
          de: "Entweder X-Popopx-Alert-Token oder Authorization: Bearer, verglichen mit konstanter Laufzeit gegen POPOPX_ALERT_WEBHOOK_TOKEN. Kein HMAC über dem Body, kein Zeitstempel, kein Replay-Fenster — das ist die ganze Pforte.",
          fr: "Soit X-Popopx-Alert-Token, soit Authorization: Bearer, comparé à temps constant à POPOPX_ALERT_WEBHOOK_TOKEN. Pas de HMAC sur le body, pas d’horodatage, pas de fenêtre de rejeu — c’est tout le contrôle.",
          it: "O X-Popopx-Alert-Token o Authorization: Bearer, confrontato a tempo costante con POPOPX_ALERT_WEBHOOK_TOKEN. Nessun HMAC sul body, nessun timestamp, nessuna finestra di replay: è tutto qui il controllo.",
          nl: "Ofwel X-Popopx-Alert-Token, ofwel Authorization: Bearer, vergeleken met constante looptijd tegen POPOPX_ALERT_WEBHOOK_TOKEN. Geen HMAC over de body, geen tijdstempel, geen replay-venster — dat is de hele poort.",
          cs: "Buď X-Popopx-Alert-Token, nebo Authorization: Bearer, porovnáno se stálým časem s POPOPX_ALERT_WEBHOOK_TOKEN. Žádný HMAC nad tělem, žádný časový údaj, žádné okno pro opakování — to je celá brána.",
          "zh-Hans": "X-Popopx-Alert-Token 或 Authorization: Bearer 二选一，与 POPOPX_ALERT_WEBHOOK_TOKEN 做常数时间比对。没有对 body 的 HMAC，没有时间戳，也没有防重放窗口——门就这么多。",
          "zh-Hant": "X-Popopx-Alert-Token 或 Authorization: Bearer 二選一，與 POPOPX_ALERT_WEBHOOK_TOKEN 做常數時間比對。沒有對 body 的 HMAC，沒有時間戳，也沒有防重放視窗——門就這麼多。",
          es: "O bien X-Popopx-Alert-Token o Authorization: Bearer, comparado en tiempo constante contra POPOPX_ALERT_WEBHOOK_TOKEN. Sin HMAC sobre el cuerpo, sin marca de tiempo, sin ventana de reempuje — esa es toda la barrera.",
          pl: "Albo X-Popopx-Alert-Token, albo Authorization: Bearer, porównane w stałym czasie z POPOPX_ALERT_WEBHOOK_TOKEN. Bez HMAC nad treścią, bez znacznika czasu, bez okna odtworzenia — cała brama tyle ma.",
          ja: "X-Popopx-Alert-Token か Authorization: Bearer のどちらかを、POPOPX_ALERT_WEBHOOK_TOKEN と定数時間で照合します。ボディへの HMAC も、タイムスタンプも、再生窓口もありません。関門はその程度です。",
          th: "ใส่ X-Popopx-Alert-Token หรือ Authorization: Bearer ก็ได้ แล้วเทียบคงเวลากับ POPOPX_ALERT_WEBHOOK_TOKEN ไม่มีการทำ HMAC บน body ไม่มีการประทับเวลา ไม่มีหน้าต่างกันส่งซ้ำ — ประตูมีเท่านั้น",
          "fi": "Joko X-Popopx-Alert-Token tai Authorization: Bearer, verrataan vakioajassa POPOPX_ALERT_WEBHOOK_TOKENiin. Ei HMAC:ia rungon päällä, ei aikaleimaa, ei toistoikkunaa — siinä koko portti.",
          uk: "Або X-Popopx-Alert-Token, або Authorization: Bearer; значення порівнюється за сталий час з POPOPX_ALERT_WEBHOOK_TOKEN. Без HMAC над тілом, без позначки часу, без вікна повтору — брама цілком в цьому.",
          "bg": "Или X-Popopx-Alert-Token, или Authorization: Bearer, сравнено с постоянно време срещу POPOPX_ALERT_WEBHOOK_TOKEN. Без HMAC върху тялото, без времеви печат, без прозорец за повторение — това еwhole бариерата.",
          tr: "Ya X-Popopx-Alert-Token ya da Authorization: Bearer; değer POPOPX_ALERT_WEBHOOK_TOKEN ile sabit zamanda karşılaştırılır. Gövde üzerinde HMAC yok, zaman damgası yok, yeniden oynatma penceresi yok — kapının tamamı bu.",
          "hu": "Vagy X-Popopx-Alert-Token, vagy Authorization: Bearer, állandó idejű összevetéssel a POPOPX_ALERT_WEBHOOK_TOKEN-nal. Nincs HMAC a törzs felett, nincs időbélyeg, nincs replay-ablak — a整个 kapu ennyi.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Unset token",
          ru: "Порожній токен",
          de: "Leeres Token",
          fr: "Jeton non défini",
          it: "Token non impostato",
          nl: "Ongezet token",
          cs: "Nenastavený token",
          "zh-Hans": "未设置令牌",
          "zh-Hant": "未設定權杖",
          es: "Token sin configurar",
          pl: "Nieustawiony token",
          "ja": "未設定のトークン",
          th: "โทเคนที่ยังไม่ได้ตั้ง",
          fi: "Asettamaton token",
          uk: "Порожній токен",
          bg: "Незададен токен",
          tr: "Ayarlanmamış token",
          hu: "Be nem állított token",
        },
        v: {
          en: "If POPOPX_ALERT_WEBHOOK_TOKEN is empty, every delivery is refused with 401, and the detail names the missing variable: an unconfigured webhook must not be able to mint red cards by accident.",
          ru: "Если POPOPX_ALERT_WEBHOOK_TOKEN пуст, любая доставка отклоняется с 401, и detail называет отсутствующую переменную: незакрытый вебхук не должен случайно штамповать красные карточки.",
          de: "Ist POPOPX_ALERT_WEBHOOK_TOKEN leer, wird jede Zustellung mit 401 abgelehnt, und das detail nennt die fehlende Variable: ein nicht konfigurierter Webhook darf nicht versehentlich rote Karten prägen.",
          fr: "Si POPOPX_ALERT_WEBHOOK_TOKEN est vide, chaque livraison est refusée avec 401, et le detail nomme la variable manquante : un webhook non configuré ne doit pas pouvoir frapper des cartes rouges par accident.",
          it: "Se POPOPX_ALERT_WEBHOOK_TOKEN è vuoto, ogni consegna viene rifiutata con 401 e il detail nomina la variabile mancante: un webhook non configurato non deve poter coniare carte rosse per sbaglio.",
          nl: "Is POPOPX_ALERT_WEBHOOK_TOKEN leeg, dan wordt elke bezorging met 401 geweigerd, en het detail noemt de ontbrekende variabele: een ongeconfigureerde webhook mag niet per ongeluk rode kaarten mogen slaan.",
          cs: "Pokud je POPOPX_ALERT_WEBHOOK_TOKEN prázdný, každé doručení odmítne 401 a detail pojmenuje chybějící proměnnou: nenastavený webhook nesmí omylem razít červené karty.",
          "zh-Hans": "如果 POPOPX_ALERT_WEBHOOK_TOKEN 是空的，所有投递都会被 401 拒绝，detail 里直接点名那颗缺失的变量：没配好的 webhook 绝不能靠运气就把红色卡片发到用户手机上。",
          "zh-Hant": "如果 POPOPX_ALERT_WEBHOOK_TOKEN 是空的，所有投递都會被 401 拒絕，detail 裡直接點名那顆缺失的變數：沒設好的 webhook 絕不能靠運氣就把紅色卡片送到使用者手機上。",
          es: "Si POPOPX_ALERT_WEBHOOK_TOKEN está vacío, cada entrega se rechaza con 401 y el detail nombra la variable que falta: un webhook sin configurar no debería poder acuñar tarjetas rojas por accidente.",
          pl: "Jeżeli POPOPX_ALERT_WEBHOOK_TOKEN jest pusty, każde dostarczenie jest odrzucane z 401, a detail wskazuje brakującą zmienną: nie skonfigurowany webhook nie może przez przypadek wybijać czerwonych kart.",
          "ja": "POPOPX_ALERT_WEBHOOK_TOKEN が空なら、すべての配信が 401 で拒否され、detail が足りない変数を名指しします。未設定の webhook が赤いカードを誤って発行できるはずがない、という前提です。",
          th: "ถ้า POPOPX_ALERT_WEBHOOK_TOKEN ว่างเปล่า การส่งทุกครั้งจะถูกปฏิเสธด้วย 401 และใน detail ก็ระบุชื่ตัวแปรที่ขาดไป webhook ที่ยังไม่ได้ตั้งจึงพิมพ์การ์ดสีแดงผิดพลาดไม่ได้",
          "fi": "Jos POPOPX_ALERT_WEBHOOK_TOKEN on tyhjä, jokainen toimitus hylätään 401:llä, ja detail nimeää puuttuvan muuttujan: määittämätön webhook ei saa vahingossakaan lyödä punaisia kortteja.",
          uk: "Якщо POPOPX_ALERT_WEBHOOK_TOKEN порожній, будь-яку доставку відхилено з 401, а detail називає відсутню змінну: налаштуваний вебхук не повинен випадково друкувати червоні картки.",
          bg: "Ако POPOPX_ALERT_WEBHOOK_TOKEN е празен, всяка доставка се отхвърля с 401 и детайлът назовава липсващата променлива: нек конфигуриран уебхук не трябва да може случайно да с кове червени карти.",
          "tr": "POPOPX_ALERT_WEBHOOK_TOKEN boşsa her teslim 401 ile reddedilir ve detail eksik değişkeni adıyla söyler: yapılandırılmamış bir webhook yanlışlıkla kırmızı kart basmamalıdır.",
          "hu": "Ha a POPOPX_ALERT_WEBHOOK_TOKEN üres, minden átvitel 401-gyel elutasításra kerül, és a detail kimondja a hiányzó változót: be nem állított webhook véletlenül sem üthet ki piros kártyát.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Severity gate",
          ru: "Фильтр по серьёзности",
          de: "Schweregrad-Schwelle",
          fr: "Seuil de sévérité",
          it: "Soglia di severità",
          nl: "Seriousheidsdrempel",
          cs: "Práh závažnosti",
          "zh-Hans": "严重级别门槛",
          "zh-Hant": "嚴重等級門檻",
          es: "Umbral de severidad",
          pl: "Próg ważności",
          ja: "深刻度の閾値",
          th: "เกณฑ์ระดับความรุนแรง",
          "fi": "Vakavuuskynnys",
          uk: "Поріг серйозності",
          bg: "Праг на тежестта",
          "tr": "Önem eşiği",
          "hu": "Súlyességi küszöb",
        },
        v: {
          en: "POPOPX_ALERT_MIN_SEVERITY=warning drops everything below the gate before a card is ever built. The accepted values are debug|info|warning|critical, matched case-insensitively; an unknown word is a ConfigError.",
          ru: "POPOPX_ALERT_MIN_SEVERITY=warning отсекает всё, что ниже порога, ещё до построения карточки. Допустимые значения — debug|info|warning|critical, регистр не важен; неизвестное слово вызывает ConfigError.",
          de: "POPOPX_ALERT_MIN_SEVERITY=warning verwirft alles unterhalb der Schwelle, bevor überhaupt eine Karte entsteht. Erlaubt sind debug|info|warning|critical, ohne Rücksicht auf Großschreibung; ein unbekanntes Wort ist ein ConfigError.",
          "zh-Hant": "POPOPX_ALERT_MIN_SEVERITY=warning 會在卡片建立之前就丟掉門檻以下的所有告警。可接受的值是 debug|info|warning|critical，比較時不分大小寫；寫錯詞就直接 ConfigError。",
          fr: "POPOPX_ALERT_MIN_SEVERITY=warning rejette tout ce qui est sous le seuil avant même de construire une carte. Les valeurs admises sont debug|info|warning|critical, sans tenir compte de la casse ; un mot inconnu déclenche une ConfigError.",
          it: "POPOPX_ALERT_MIN_SEVERITY=warning scarta tutto ciò che è sotto la soglia prima ancora di costruire una carta. I valori ammessi sono debug|info|warning|critical, senza distinzione di maiuscole; una parola sconosciuta provoca una ConfigError.",
          nl: "POPOPX_ALERT_MIN_SEVERITY=warning gooit alles onder de drempel weg voordat er ooit een kaart wordt gebouwd. Toegestane waarden zijn debug|info|warning|critical, hoofdletterongevoelig; een onbekend woord geeft een ConfigError.",
          cs: "POPOPX_ALERT_MIN_SEVERITY=warning zahodí všechno pod práh dřív, než se karta vůbec sestrojí. Povolené hodnoty jsou debug|info|warning|critical bez ohledu na velikost písmen; neznámé slovo je ConfigError.",
          "zh-Hans": "POPOPX_ALERT_MIN_SEVERITY=warning 会在卡片被构造之前就丢掉门槛以下的一切。可接受的值是 debug|info|warning|critical，比较不分大小写；写错词直接 ConfigError。",
          es: "POPOPX_ALERT_MIN_SEVERITY=warning descarta todo lo que está por debajo del umbral antes de construir una tarjeta. Los valores admitidos son debug|info|warning|critical, sin distinguir mayúsculas; una palabra desconocida es un ConfigError.",
          pl: "POPOPX_ALERT_MIN_SEVERITY=warning odrzuca wszystko poniżej progu, zanim karta w ogóle powstanie. Dozwolone wartości to debug|info|warning|critical, bez znaczenia wielkości liter; nieznane słowo daje ConfigError.",
          ja: "POPOPX_ALERT_MIN_SEVERITY=warning は、カードが作られるより前に閾値未満のものをすべて捨てます。許される値は debug|info|warning|critical で大文字小文字は無視、未知の語は ConfigError になります。",
          th: "POPOPX_ALERT_MIN_SEVERITY=warning จะทิ้งทุกลำดับที่ต่ำกว่าเกณฑ์ก่อนจะสร้างการ์ดเลย ค่าที่ใช้ได้คือ debug|info|warning|critical โดยไม่สนตัวพิมพ์ใหญ่ และถ้าพิมพ์ผิดจะเป็น ConfigError",
          fi: "POPOPX_ALERT_MIN_SEVERITY=warning hylkää kaiken kynnysarvon alapuolelta ennen kuin korttia rakennetaan. Sallitut arvot ovat debug|info|warning|critical, kirjainskohtaisesti vertailuna; tuntematon sana on ConfigError.",
          uk: "POPOPX_ALERT_MIN_SEVERITY=warning відсікає все нижче порога ще до побудови картки. Допустимі значення — debug|info|warning|critical, регістр не важливий; невідоме слово спричиняє ConfigError.",
          bg: "POPOPX_ALERT_MIN_SEVERITY=warning хвърля всичко под прага, преди изобщо да се построи карта. Позволените стойности са debug|info|warning|critical без оглед на главните букви; непозната дума е ConfigError.",
          "tr": "POPOPX_ALERT_MIN_SEVERITY=warning, bir kart kurulmadan önce eşiğin altındaki her şeyi düşürür. Kabul edilen değerler debug|info|warning|critical biçimindedir, büyük/küçük harf ayrımı yapılmaz; bilinmeyen kelime ConfigError üretir.",
          "hu": "A POPOPX_ALERT_MIN_SEVERITY=warning a kártya létrejötte előtt eldob minden a küszöb alól. Elfogadott értékek: debug|info|warning|critical, kis-/nagybetű nélkül; egy ismeretlen szó ConfigError.",
        },
      },
      {
        state: "shipped",
        k: {
          en: "Idempotency",
          ru: "Идемпотентность",
          de: "Idempotenz",
          fr: "Idempotence",
          it: "Idempotenza",
          nl: "Idempotentie",
          cs: "Idempotence",
          "zh-Hans": "幂等性",
          "zh-Hant": "冪等性",
          es: "Idempotencia",
          pl: "Idempotencja",
          "ja": "べき等性",
          th: "idempotency",
          fi: "Idempotenssi",
          uk: "Ідемпотентність",
          bg: "Идемпотентност",
          tr: "İdempotens",
          hu: "Idempotencia",
        },
        v: {
          en: "An incident’s identity is its fingerprint, so the ledger key alert:<fingerprint> charges POPOPX_CP_PER_ALERT=2 exactly once; a re-fire updates the same card in place and costs nothing.",
          ru: "Идентичность инцидента — это его fingerprint, поэтому ключ реестра alert:<fingerprint> снимает POPOPX_CP_PER_ALERT=2 ровно один раз; повторное срабатывание обновляет ту же карточку и ничего не стоит.",
          de: "Die Identität eines Vorfalls ist sein fingerprint, darum berechnet der Ledger-Schlüssel alert:<fingerprint> POPOPX_CP_PER_ALERT=2 genau einmal; ein erneutes Feuern aktualisiert dieselbe Karte und kostet nichts.",
          fr: "L’identité d’un incident, c’est son fingerprint, donc la clé de registre alert:<fingerprint> facture POPOPX_CP_PER_ALERT=2 exactement une fois ; un re-déclenchement met à jour la même carte et ne coûte rien.",
          it: "L’identità di un incidente è il suo fingerprint, quindi la chiave di contabilità alert:<fingerprint> addebita POPOPX_CP_PER_ALERT=2 esattamente una volta; un ri-scatto aggiorna la stessa carta e non costa nulla.",
          nl: "De identiteit van een incident is zijn fingerprint, dus de ledger-sleutel alert:<fingerprint> aanrekent POPOPX_CP_PER_ALERT=2 precies één keer; een herhaalde trigger werkt dezelfde kaart bij en kost niets.",
          cs: "Identitou incidentu je jeho fingerprint, takže klíč účtu alert:<fingerprint> účtuje POPOPX_CP_PER_ALERT=2 právě jednou; opakované spuštění aktualizuje tutéž kartu a nestojí nic.",
          "zh-Hans": "一次事件的身份证就是它的 fingerprint，所以台账键 alert:<fingerprint> 只会收一次 POPOPX_CP_PER_ALERT=2；同一事件再触发时原地更新那张卡，分文不取。",
          "zh-Hant": "一次事件的身分證就是它的 fingerprint，所以帳本鍵 alert:<fingerprint> 只會收一次 POPOPX_CP_PER_ALERT=2；同一事件再觸發時原地更新那張卡，分文不取。",
          "es": "La identidad de un incidente es su fingerprint, así que la clave del libro alert:<fingerprint> cobra POPOPX_CP_PER_ALERT=2 exactamente una vez; una reactivación actualiza la misma tarjeta y no cuesta nada.",
          pl: "Tożsamością incydentu jest jego fingerprint, więc klucz rejestru alert:<fingerprint> nalicza POPOPX_CP_PER_ALERT=2 dokładnie raz; ponowne wyzwolenie aktualizuje tę samą kartę i nic nie kosztuje.",
          "ja": "インシデントの身元は fingerprint なので、台帳キー alert:<fingerprint> が POPOPX_CP_PER_ALERT=2 を課金するのはちょうど 1 回だけです。同じ事件が再発火しても、同じカードを書き換えるだけで課金は起きません。",
          th: "ตัวตนของเหตุการณ์คือ fingerprint ของมัน ดังนั้นคีย์ในบัญชี alert:<fingerprint> จะคิด POPOPX_CP_PER_ALERT=2 เพียงครั้งเดียว ส่วนการยิงซ้ำจะอัปเดตการ์ดใบเดิมและไม่คิดเงิน",
          fi: "Tapauksen identiteetti on sen fingerprint, joten kirjanpidon avain alert:<fingerprint> laskuttaa POPOPX_CP_PER_ALERT=2 tasan kerran; uudelleenlaukaisu päivittää saman kortin eikä maksa mitään.",
          uk: "Тотожністю інциденту є його fingerprint, тому ключ реєстру alert:<fingerprint> знімає POPOPX_CP_PER_ALERT=2 рівно один раз; повторне спрацювання оновлює ту саму картку й нічого не коштує.",
          bg: "Самоличността на един инцидент е неговият fingerprint, затова ключът на дневника alert:<fingerprint> таксува POPOPX_CP_PER_ALERT=2 точно веднъж; повторно задействане обновява същата карта и не струва нищо.",
          "tr": "Bir olayın kimliği fingerprint’ıdır; bu yüzden defter anahtarı alert:<fingerprint> POPOPX_CP_PER_ALERT=2 ücretini tam olarak bir kez alır, aynı olay yeniden tetiklendiğinde ise mevcut kartı günceller ve hiçbir şey ücretlendirmez.",
          "hu": "Egy incidens azonossága a fingerprintje, ezért a naplókulcs alert:<fingerprint> pontosan egyszer számol fel POPOPX_CP_PER_ALERT=2-t; az újraváltás ugyanazt a kártyát frissíti, és semibe sem kerül.",
        },
      },
      {
        state: "planned",
        k: {
          en: "Signed intake",
          ru: "Подписанный приём",
          de: "Signierter Eingang",
          fr: "Réception signée",
          it: "Ingresso firmato",
          nl: "Ondertekende ingang",
          cs: "Podepsaný příjem",
          "zh-Hans": "带签名的入口",
          "zh-Hant": "帶簽名的入口",
          es: "Entrada firmada",
          pl: "Podpisane wejście",
          ja: "署名付き受け口",
          th: "ช่องทางที่เซ็นลายมือชื่อ",
          "fi": "Allekirjoitettu sisäänmeno",
          uk: "Підписаний прийом",
          bg: "Подписан вход",
          tr: "İmzalı giriş",
          hu: "Aláírt bemenet",
        },
        v: {
          en: "planned, and absent: per-source request signatures over the body — the shape most alerting products offer — are not implemented. Until they are, a stolen webhook token is a stolen intake.",
          ru: "в планах, а значит — отсутствует: подписи запроса по источнику поверх тела, как у большинства систем алертинга, не реализованы. До этого украденный токен вебхука — это украденный канал приёма.",
          de: "geplant und nicht vorhanden: quellenspezifische Signaturen über dem Body, wie sie die meisten Alerting-Produkte bieten, sind nicht implementiert. Bis dahin ist ein gestohlenes Webhook-Token ein gestohlener Einlass.",
          fr: "prévu, donc absent : les signatures de requête par source sur le body, la forme qu’offrent la plupart des produits d’alerting, ne sont pas implémentées. D’ici là, un jeton webhook volé est une réception volée.",
          it: "previsto e quindi assente: le firme della richiesta per fonte sul body, la forma offerta dalla maggior parte dei prodotti di alerting, non sono implementate. Finché non lo saranno, un token webhook rubato è un ingresso rubato.",
          "zh-Hant": "規劃中，也就是目前沒有：大多數告警產品常見的「逐來源 body 簽名」並未實作。在那之前，偷到 webhook 權杖就等於偷到整個入口。",
          nl: "gepland en dus afwezig: per-bron handtekeningen over de body, zoals de meeste alerting-producten bieden, zijn niet geïmplementeerd. Tot die tijd is een gestolen webhook-token een gestolen ingang.",
          cs: "plánováno, tedy neexistuje: podpisy požadavku nad tělem podle zdroje, které většina alertovacích produktů umí, nejsou implementovány. Do té doby ukradený token webhooku znamená ukradený příjem.",
          "zh-Hans": "规划中，也就是眼下没有：大多数告警产品都有的「按来源对 body 签名」还没实现。在那之前，偷到 webhook 令牌就等于偷到整个入口。",
          es: "previsto y por tanto ausente: las firmas de petición por fuente sobre el cuerpo, la forma que ofrecen la mayoría de productos de alertas, no están implementadas. Hasta entonces, un token de webhook robado es una entrada robada.",
          pl: "planowane, a więc nieobecne: podpisy zapytań nad treścią, per źródło — rozwiązanie znane z większości produktów alertujących — nie są zaimplementowane. Do tego czasu skradziony token webhooka to skradzione wejście.",
          ja: "計画中であり、今はありません。Body に対するソース単位の署名——たいていのアラート製品が備える形——は未実装です。実装されるまでは、Webhook トークンの盗難は受け口そのものの盗難になります。",
          th: "อยู่ในแผน ซึ่งยังไม่มี: การเซ็นคำขอต่อแหล่งที่มาบน body แบบที่ผลิตภัณฑ์แจ้งเตือนส่วนใหญ่มี ยังไม่ถูกสร้าง แล้วถ้าโทเคน webhook ถูกขโมย ก็เท่ากับทั้งช่องทางถูกขโมยไปด้วย",
          fi: "suunnitteilla, siis poissa: lähdekohtaiset allekirjoitukset rungon päällä, kuten useimmat hälytystuotteet tarjoavat, eivät ole toteutettu. Sitä ennen varastettu webhook-token on varastettu sisäänmeno.",
          uk: "у планах, а отже — відсутнє: підписи запиту за джерелом поверх тіла, як у більшості систем алертингу, не реалізовані. Доти вкрадений токен вебхука — це вкрадений канал прийому.",
          bg: "планирано, следователно отсъстващо: подписи на заявката по източник върху тялото — форматът, който повечето продукти за известия предлагат — не са реализирани. Дотогава откраднат уебхутокен е откраднат вход.",
          "tr": "planlandı, dolayısıyla yok: gövde üzerinde kaynak bazlı imzalar — çoğu uyarı ürününün sunduğu biçim — uygulanmış değil. Uygulanana kadar çalınan bir webhook token’ı çalınan bir giriş kapısıdır.",
          "hu": "tervezett, vagyis nincs: forrásonkénti, a törzs alá írt requestsignatúrák — a legtöbb riasztási termék ezt adja — még nincsenek meg. addig egy ellopott webhook-token ellopott belépőt jelent.",
        },
      },
    ],
    keys: ["X-Popopx-Alert-Token", "POPOPX_ALERT_WEBHOOK_TOKEN", "POPOPX_ALERT_MIN_SEVERITY", "POPOPX_CP_PER_ALERT"],
  },
];

function PanelCard({ panel }: { readonly panel: Panel }): ReactElement {
  const { locale } = useLocale();
  const name = useCopy(panel.name);
  const hook = useCopy(panel.hook);
  const statePlanned = useCopy(STATE_PLANNED);
  const keysLabel = useCopy(KEYS_LABEL);

  return (
    <article className={`glass glass-hover relative flex flex-col overflow-hidden p-5 sm:p-6 ${panel.wide ? "lg:col-span-2" : ""}`}>
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px ${
          panel.accent === "brand" ? "bg-brand-soft" : panel.accent === "mesh" ? "bg-mesh-soft" : "bg-warn"
        } opacity-60`}
      />
      <header className="flex items-start gap-4">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="mt-0.5 h-8 w-8 shrink-0 text-brand-soft"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {panel.glyph.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] tracking-[0.18em] text-faint">{panel.code}</p>
          <h3 className="mt-1.5 text-[17px] font-semibold leading-snug text-white">{name}</h3>
        </div>
      </header>
      <p className="mt-3 text-[13px] leading-relaxed text-mute">{hook}</p>
      <dl className="mt-5 space-y-3">
        {panel.rows.map((row) => {
          const k = pick(row.k, locale);
          const v = pick(row.v, locale);
          const shipped = row.state === "shipped";
          return (
            <div key={k} className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="flex items-center gap-1.5 pt-0.5 text-[11.5px] font-medium text-faint">
                <StatusDot tone={shipped ? "mesh" : "warn"} pulse={shipped} />
                {k}
              </dt>
              <dd className="text-[12.5px] leading-relaxed text-mute">
                {v}
                {!shipped && (
                  <span className="ml-2 font-mono text-[10.5px] text-warn">
                    ({statePlanned})
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      {panel.keys.length > 0 && (
        <div className="mt-5">
          <p className="eyebrow">{keysLabel}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {panel.keys.map((key) => (
              <code key={key} className="chip font-mono text-[10.5px] text-brand-soft">
                {key}
              </code>
            ))}
          </div>
        </div>
      )}
      {panel.sample && (
        <div className="mt-5">
          <CodeBlock
            code={panel.sample}
            caption={panel.sampleCaption ? useCopy(panel.sampleCaption) : undefined}
            maxHeightClass="max-h-48"
          />
        </div>
      )}
      {panel.link && (
        <a
          href={panel.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-1.5 text-[12px] text-brand-soft hover:text-brand"
        >
          {pick(panel.link.label, locale)}
          <span aria-hidden>→</span>
        </a>
      )}
    </article>
  );
}

export function SecurityGovernanceSection(): ReactElement {
  const [filter, setFilter] = useState<Filter>("all");
  const legendSource = useCopy(LEGEND_SOURCE);
  const legendPlanned = useCopy(LEGEND_PLANNED);
  const legendNoSecret = useCopy(LEGEND_NOSECRET);
  const filterLabel = useCopy(FILTER_LABEL);
  const filterAll = useCopy(FILTER_ALL);
  const filterShipped = useCopy(STATE_SHIPPED);
  const filterPlanned = useCopy(STATE_PLANNED);
  const filterEmpty = useCopy(FILTER_EMPTY);
  const h5Caption = useCopy(H5_CAPTION);
  const limitsCaption = useCopy(LIMITS_CAPTION);
  const metersCaption = useCopy(METERS_CAPTION);

  const filteredPanels = useMemo(() => {
    if (filter === "all") return PANELS;
    return PANELS.map((p) => ({
      ...p,
      rows: p.rows.filter((r) => r.state === filter),
    })).filter((p) => p.rows.length > 0);
  }, [filter]);

  return (
    <section id="security" className="relative py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-[0.06]" />
      <div className="section-wrap relative">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="pill">{legendSource}</span>
          <span className="pill">
            <StatusDot tone="warn" />
            {legendPlanned}
          </span>
          <span className="pill">{legendNoSecret}</span>
        </div>

        <div role="group" aria-label={filterLabel} className="mt-8 flex flex-wrap items-center gap-2">
          <span className="eyebrow mr-1">{filterLabel}</span>
          {(["all", "shipped", "planned"] as const).map((f) => {
            const active = filter === f;
            const label = f === "all" ? filterAll : f === "shipped" ? filterShipped : filterPlanned;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={active}
                className={`pill transition ${
                  active ? "!border-brand-soft/60 !bg-brand/20 text-white" : "text-mute"
                } ${FOCUS}`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {filteredPanels.length === 0 ? (
          <p className="mt-8 text-center text-[13px] text-faint">{filterEmpty}</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {filteredPanels.map((panel) => (
              <PanelCard key={panel.id} panel={panel} />
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <CodeBlock code={H5_SAMPLE} caption={h5Caption} maxHeightClass="max-h-48" />
          <CodeBlock code={LIMITS_SAMPLE} caption={limitsCaption} maxHeightClass="max-h-48" />
          <CodeBlock code={METERS_SAMPLE} caption={metersCaption} maxHeightClass="max-h-48" />
        </div>

        <p className="mt-8 text-center text-[11px] text-faint">
          Source: <code className="font-mono">{SITE_ORIGIN}</code>
        </p>
      </div>
    </section>
  );
}
