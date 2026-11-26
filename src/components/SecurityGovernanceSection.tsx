"use client";

import { useMemo, useState, type ReactElement } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";
import { SITE_ORIGIN } from "@/lib/site";

/**
 * Security and permission governance.
 *
 * This is the honesty bucket of the portal. Three of the controls this kind of
 * section usually promises now exist: an optional operator-held vault key that
 * seals secrets at rest, scoped `pxa_` admin tokens with a root-only management
 * surface, and a timestamped HMAC over alert webhooks once a signing secret is
 * configured. The gateway-wide rate limiter still does not exist. So every row
 * below says what the code actually does — the vault's mixed reads and custody
 * rule, the scope grammar and 401/403 split, the token-then-HMAC order, a
 * fail-closed webhook token, the per-follower H5 launch HMAC, an append-only
 * ledger — and any control that is missing stays marked `planned`, never quietly dropped.
 * Env names, header names, HTTP codes and file paths stay untranslated; only the
 * prose is authored in all 18 languages.
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
  en: "Three controls guard this gateway: scoped pxa_ admin tokens, an optional vault that seals secrets at rest, and timestamped HMAC webhook signatures",
  ru: "Этот шлюз охраняют три средства: админ-токены pxa_ с ограниченными областями, необязательное хранилище, шифрующее секреты на диске, и подписи HMAC с меткой времени на вебхуках",
  de: "Drei Kontrollen sichern dieses Gateway: Admin-Tokens mit pxa_-Präfix und Scopes, ein optionaler Vault, der Secrets im Ruhezustand versiegelt, und Webhook-Aufrufe mit zeitgestempelter HMAC-Signatur",
  fr: "Trois mécanismes gardent cette passerelle : des jetons admin pxa_ à portée limitée, un coffre optionnel qui scelle les secrets au repos, et des webhooks signés par HMAC horodaté",
  it: "Tre controlli proteggono questo gateway: token admin pxa_ con scope, una cassaforte opzionale che sigilla i segreti a riposo e webhook con firma HMAC e timestamp",
  nl: "Drie maatregelen bewaken deze gateway: admin-tokens met pxa_-prefix en scopes, een optionele kluis die secrets in rust verzegelt, en webhooks met een getijdstempelde HMAC-handtekening",
  cs: "Tuhle bránu chrání tři opatření: admin tokeny pxa_ s omezeným rozsahem, volitelný trezor, který zapečeťuje tajemství v klidu, a webhooky s časovaným HMAC podpisem",
  "zh-Hans": "守护这个网关的是三件事：带权限范围的 pxa_ 管理令牌、可选的静态加密保险库，以及带时间戳 HMAC 签名的 webhook",
  "zh-Hant": "守護這個閘道的是三件事：帶權限範圍的 pxa_ 管理權杖、可選的靜態加密保險庫，以及帶時間戳 HMAC 簽名的 webhook",
  es: "Tres controles custodian esta pasarela: tokens de administración pxa_ con alcance limitado, una bóveda opcional que sella los secretos en reposo y webhooks firmados con HMAC y marca de tiempo",
  pl: "Tej bramy strzegą trzy mechanizmy: tokeny administracyjne pxa_ z zakresem uprawnień, opcjonalny sejf pieczętujący sekrety w spoczynku oraz webhooki z podpisem HMAC i znacznikiem czasu",
  ja: "このゲートウェイを守るのは三つです。スコープ付きの pxa_ 管理トークン、保存時の秘密情報を封緘する任意の保管庫、そしてタイムスタンプ付き HMAC 署名の Webhook です",
  th: "สิ่งที่คุ้มครองเกตเวย์นี้มีสามอย่าง: โทเคนผู้ดูแล pxa_ ที่จำกัด scope, คลังเก็บคีย์ทางเลือกที่ผนึก secret ขณะพัก และ webhook ที่เซ็นด้วย HMAC พร้อมการประทับเวลา",
  fi: "Tätä gatewayta suojaa kolme asiaa: pxa_-alkuiset skoopilliset admin-tokenit, valinnainen holkki joka sinetöi salaisuudet lepotilassa, ja aikaleimattu HMAC-allekirjoitus webhookeissa",
  uk: "Цей шлюз стережуть три речі: адмін-токени pxa_ зі скоупами, необов'язкове сховище, що запечатує секрети на диску, та вебхуки з підписом HMAC і позначкою часу",
  bg: "Този гейтуейт се пази от три неща: админ токени pxa_ с обхват, незадължителен трезор, който запечатва тайните в покой, и уебхукове с HMAC подпис и времеви печат",
  tr: "Bu ağ geçidini üç şey korur: kapsamlı pxa_ yönetici token’ları, sırları depoda mühürleyen isteğe bağlı bir kasa ve zaman damgalı HMAC imzalı webhook’lar",
  hu: "Ezt az átjárót három dolog védi: a scope-os pxa_ admin tokenek, a titkokat nyugvó állapotban lepecsételő opcionális trezor és az időbélyeges HMAC-aláírású webhookok",
};

const SUBTITLE: L = {
  en: "Everything here was re-read out of the sources on 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py and the plugin modules. The vault key, scoped tokens and signed intake all ship; each row still names exactly what the code does and where its limit sits.",
  ru: "Всё здесь заново вычитано из исходников 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py и модулей плагинов. Хранилище, токены со скоупами и подписанный приём уже поставлены; каждая строка по-прежнему называет, что именно делает код и где проходит его граница.",
  de: "Alles hier wurde am 2026-11-26 erneut aus den Quellen gelesen — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py und die Plugin-Module. Vault-Schlüssel, Tokens mit Scopes und signierter Eingang sind ausgeliefert; jede Zeile nennt weiterhin genau, was der Code tut und wo seine Grenze liegt.",
  fr: "Tout ce qui suit a été relu dans les sources le 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py et les modules de plugins. Clé de coffre, jetons à portée et réception signée sont livrés ; chaque ligne dit toujours exactement ce que fait le code et où se situe sa limite.",
  it: "Tutto quanto segue è stato riletto nei sorgenti il 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py e i moduli dei plugin. Chiave del caveau, token con scope e ingresso firmato sono già in codice; ogni riga continua a dire esattamente cosa fa il codice e dove sta il suo limite.",
  nl: "Alles hier is op 2026-11-26 opnieuw uit de bronnen gelezen — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py en de plugin-modules. Kluissleutel, tokens met scopes en ondertekende ingang zijn uitgebracht; elke rij zegt nog steeds precies wat de code doet en waar de grens ligt.",
  cs: "Všechno zde bylo znovu přečteno ze zdrojů dne 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py a modulů pluginů. Klíč trezoru, tokeny s rozsahy i podepsaný příjem už jsou v kódu; každý řádek dál přesně říká, co kód dělá a kde leží jeho mez.",
  "zh-Hans": "本页每一条都于 2026-11-26 重新取自源码——gateway/app/vault.py、gateway/app/admin_auth.py、gateway/app/main.py 与各插件模块。保管库密钥、带范围的令牌、签名入口都已上线；每一行仍然只写代码实际做了什么，以及边界在哪里。",
  "zh-Hant": "本頁每一條都於 2026-11-26 重新取自原始碼——gateway/app/vault.py、gateway/app/admin_auth.py、gateway/app/main.py 與各外掛模組。保管庫密鑰、帶範圍的權杖、簽名入口都已上線；每一行仍然只寫程式碼實際做了什麼，以及邊界在哪裡。",
  es: "Todo lo de aquí se releyó de las fuentes el 2026-11-26 —gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py y los módulos de complementos—. La clave de la bóveda, los tokens con alcance y la entrada firmada ya están en el código; cada fila sigue diciendo exactamente qué hace el código y dónde está su límite.",
  pl: "Wszystko na tej stronie odczytano ponownie ze źródeł 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py i modułów wtyczek. Klucz sejfu, tokeny z zakresem i podpisane wejście już są w kodzie; każdy wiersz nadal mówi dokładnie, co robi kod i gdzie leży jego granica.",
  ja: "ここにある記述はすべて 2026-11-26 にソース（gateway/app/vault.py、gateway/app/admin_auth.py、gateway/app/main.py、各プラグインモジュール）から読み直したものです。保管庫の鍵、スコープ付きトークン、署名付き受け口はいずれも実装済みで、各行はコードが実際に何をし、どこに限界があるかを今も正確に書いています。",
  th: "ทุกข้อความในหน้านี้ตรวจอ่านจากโค้ดต้นฉบับอีกครั้งเมื่อ 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py และโมดูลของปลั๊กอิน คีย์ของคลังเก็บ โทเคนแบบมี scope และช่องทางรับที่เซ็นลายมือชื่อมีอยู่ในโค้ดแล้ว แต่ละแถวยังคงบอกตรง ๆ ว่าโค้ดทำอะไรและขีดจำกัดอยู่ตรงไหน",
  fi: "Kaikki täällä on luettu uudelleen lähteistä 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py ja lisäosamoduulit. Holkin avain, skoopilliset tokenit ja allekirjoitettu sisäänmeno ovat jo koodissa; jokainen rivi kertoo edelleen tarkalleen, mitä koodi tekee ja mihin sen raja asettuu.",
  uk: "Усе тут перечитано з початкових кодів 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py та модулів плагінів. Ключ сховища, токени зі скоупами й підписаний прийом уже постачаються; кожен рядок і далі точно каже, що робить код і де його межа.",
  bg: "Всичко тук е препрочетено от изходните кодове на 2026-11-26 — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py и модулите на плъгините. Ключът на трезора, токените с обхват и подписаният вход вече са в кода; всеки ред продължава да казва точно какво прави кодът и къде е границата му.",
  tr: "Buradaki her şey 2026-11-26 tarihinde kaynaklardan yeniden okundu — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py ve eklenti modülleri. Kasa anahtarı, kapsamlı token’lar ve imzalı giriş artık kodda; her satır hâlâ kodun tam olarak ne yaptığını ve sınırının nerede olduğunu söylüyor.",
  hu: "Minden itt 2026-11-26-án, a forrásokból újra elolvasott sor — gateway/app/vault.py, gateway/app/admin_auth.py, gateway/app/main.py és a bővítménymodulok. A trezor kulcsa, a scope-os tokenek és az aláírt bemenet már a kódban van; minden sor továbbra is pontosan megmondja, mit tesz a kód, és hol a határa.",
};

const LEGEND_SOURCE: L = {
  en: "v1.0.0 sources, re-read 2026-11-26",
  ru: "Исходники v1.0.0, перечитаны 2026-11-26",
  de: "v1.0.0-Quellen, am 2026-11-26 nachgelesen",
  fr: "Sources v1.0.0, relues le 2026-11-26",
  it: "Sorgenti v1.0.0, riletti il 2026-11-26",
  nl: "v1.0.0-bronnen, op 2026-11-26 herlezen",
  cs: "Zdroje v1.0.0, znovu přečteny 2026-11-26",
  "zh-Hans": "v1.0.0 源码，2026-11-26 逐条复核",
  "zh-Hant": "v1.0.0 原始碼，2026-11-26 逐條複核",
  es: "Fuentes v1.0.0, releídas el 2026-11-26",
  pl: "Źródła v1.0.0, sprawdzono ponownie 2026-11-26",
  ja: "v1.0.0 のソース、2026-11-26 に再確認",
  th: "โค้ดต้นฉบับ v1.0.0 ตรวจซ้ำเมื่อ 2026-11-26",
  fi: "v1.0.0-lähteet, luettu uudelleen 2026-11-26",
  uk: "Початкові коди v1.0.0, перечитано 2026-11-26",
  bg: "Изходни кодове v1.0.0, препрочетени на 2026-11-26",
  tr: "v1.0.0 kaynakları, 2026-11-26 tarihinde yeniden okundu",
  hu: "v1.0.0 források, 2026-11-26-én útolvasva",
};

const LEGEND_PLANNED: L = {
  en: "No row here is planned — each one is in the code today",
  ru: "Здесь нет строк «в планах» — каждая уже в коде",
  de: "Keine Zeile hier ist geplant — jede steht heute im Code",
  fr: "Aucune ligne ici n’est prévue — toutes sont dans le code",
  it: "Nessuna riga qui è prevista — sono tutte nel codice",
  nl: "Geen rij hier is gepland — elke staat in de code",
  cs: "Žádný řádek zde není plánovaný — všechny jsou v kódu",
  "zh-Hans": "这里没有「规划中」的条目——每一条都已写进代码",
  "zh-Hant": "這裡沒有「規劃中」的條目——每一條都已寫進程式碼",
  es: "Aquí ninguna fila está prevista: todas están en el código",
  pl: "Żaden wiersz nie jest tu planowany — wszystkie są w kodzie",
  ja: "ここに計画中の行はありません。すべてコードにあります",
  th: "ไม่มีแถวใดที่นี่อยู่ในแผน — ทุกแถวมีอยู่ในโค้ด",
  fi: "Yksikään rivi täällä ei ole suunnitteilla — kaikki ovat koodissa",
  uk: "Тут немає рядків «у планах» — кожен уже в коді",
  bg: "Тук няма планирани редове — всички са в кода",
  tr: "Burada planlandı işaretli satır yok — hepsi kodda",
  hu: "Itt egyetlen sor sincs tervezve — mindegyik a kódban van",
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
  "# Alertmanager / Grafana -> gateway. The token is checked first, always.",
  "curl -sS -X POST http://127.0.0.1:8080/api/v1/plugins/alerts/webhook \\",
  '     -H "Content-Type: application/json" \\',
  '     -H "X-Popopx-Alert-Token: $POPOPX_ALERT_WEBHOOK_TOKEN" \\',
  '     -H "X-Popopx-Timestamp: $(date +%s)" \\',
  '     -H "X-Popopx-Signature: v1=<hex HMAC-SHA256($POPOPX_ALERT_WEBHOOK_SECRET, \\"<timestamp>.<raw body>\\")>" \\',
  '     -d \'{"alertname":"disk_full","severity":"critical","labels":{"instance":"node-a"}}\'',
  "",
  "# With POPOPX_ALERT_WEBHOOK_SECRET set, a valid token alone is refused.",
  "# The signature covers the exact bytes sent, so sign the same body.",
  "",
  "# An operator route, by contrast, carries the admin token.",
  'curl -sS -H "X-Popopx-Admin-Token: $POPOPX_ADMIN_TOKEN" \\',
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
  "# the configurable throttle: AI messages, per follower",
  "POPOPX_AI_RATE_LIMIT_MESSAGES=20",
  "POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300",
  "# above the limit -> 429 with a Retry-After header",
  "",
  "# the SSO mint throttle is fixed at 20 per 60 s, per source, in memory",
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
  "POPOPX_CP_PER_WORKFLOW_EVENT=1",
  "POPOPX_CP_PER_CARDDAV_QUERY=1",
  "POPOPX_CP_PER_CALDAV_QUERY=1",
  "POPOPX_CP_PER_SLACK_DISCORD_EVENT=1",
  "",
  "# why a call is refused, and how the answers differ",
  "401  no admin token, or the wrong one",
  "402  balance fused, the body carries the remainder",
  "404  plugin switched off, the body names the key to flip",
  "503  node unreachable, the call is retryable",
].join("\n");

const WEBHOOK_CAPTION: L = {
  en: "The webhook route is exempt from the admin middleware because its caller is the alerting system, not the operator. With POPOPX_ALERT_WEBHOOK_SECRET set, the timestamp and signature headers are required on top of the token.",
  ru: "Маршрут вебхука выведен из-под админ-мидлвари, потому что его вызывает система алертинга, а не оператор. Если задан POPOPX_ALERT_WEBHOOK_SECRET, помимо токена обязательны заголовки метки времени и подписи.",
  de: "Die Webhook-Route ist vom Admin-Middleware ausgenommen, weil ihr Aufrufer das Alarmsystem ist, nicht der Operator. Ist POPOPX_ALERT_WEBHOOK_SECRET gesetzt, sind zusätzlich zum Token die Header für Zeitstempel und Signatur Pflicht.",
  fr: "La route webhook est exemptée du middleware admin parce que son appelant est le système d’alerte, pas l’opérateur. Si POPOPX_ALERT_WEBHOOK_SECRET est défini, les en-têtes d’horodatage et de signature sont exigés en plus du jeton.",
  it: "La route del webhook è esclusa dal middleware admin perché il chiamante è il sistema di allertamento, non l’operatore. Se POPOPX_ALERT_WEBHOOK_SECRET è impostato, oltre al token servono gli header di timestamp e firma.",
  nl: "De webhook-route valt buiten de admin-middleware omdat haar aanroeper het alarmsysteem is, niet de operator. Staat POPOPX_ALERT_WEBHOOK_SECRET gezet, dan zijn naast het token ook de tijdstempel- en handtekeningheaders verplicht.",
  cs: "Webhooková trasa je vyňata ze správcovského middleware, protože jejím volajícím je alertovací systém, ne operátor. Je-li POPOPX_ALERT_WEBHOOK_SECRET nastaveno, kromě tokenu jsou povinné i hlavičky s časovým údajem a podpisem.",
  "zh-Hans": "webhook 路由被中间件放行，因为它的调用方是告警系统，不是操作员。一旦设置 POPOPX_ALERT_WEBHOOK_SECRET，除了令牌还必须带上时间戳和签名请求头。",
  "zh-Hant": "webhook 路由被中介層放行，因為它的呼叫端是告警系統，不是操作員。一旦設定 POPOPX_ALERT_WEBHOOK_SECRET，除了權杖還必須帶上時間戳與簽名標頭。",
  es: "La ruta del webhook está exenta del middleware de administración porque quien la llama es el sistema de alertas, no el operador. Con POPOPX_ALERT_WEBHOOK_SECRET configurado, además del token son obligatorias las cabeceras de marca de tiempo y firma.",
  pl: "Ścieżka webhook jest wyłączona spod middleware administratora, bo wzywa ją system alertów, a nie operator. Gdy POPOPX_ALERT_WEBHOOK_SECRET jest ustawiony, poza tokenem obowiązkowe są nagłówki znacznika czasu i podpisu.",
  ja: "Webhook ルートは管理者ミドルウェアから除外されています。呼び出すのは運用者ではなく告警システムだからです。POPOPX_ALERT_WEBHOOK_SECRET が設定されている場合、トークンに加えてタイムスタンプと署名のヘッダーが必須になります。",
  th: "เส้นทาง webhook หลุดจากการตรวจของ middleware ผู้ดูแล เพราะผู้เรียกคือระบบแจ้งเตือน ไม่ใช่ผู้ดูแลระบบ เมื่อตั้ง POPOPX_ALERT_WEBHOOK_SECRET ไว้ นอกจาก token แล้วยังต้องมีส่วนหัวเวลาและลายเซ็นด้วย",
  fi: "Webhook-reitti on ohitettu admin-middlewaresta, koska sen kutsuja on hälytysjärjestelmä eikä operaattori. Kun POPOPX_ALERT_WEBHOOK_SECRET on asetettu, tokenin lisäksi vaaditaan aikaleima- ja allekirjoitusotsikot.",
  uk: "Маршрут вебхука виведено з-під адмін-проміжного шару, бо його викликач — система алертінгу, а не оператор. Якщо задано POPOPX_ALERT_WEBHOOK_SECRET, крім токена обов’язкові заголовки позначки часу й підпису.",
  bg: "Маршрутът на уебхука е изваден от админ middleware, защото неговият подвикващ е системата за известия, не операторът. Ако POPOPX_ALERT_WEBHOOK_SECRET е зададена, освен токена са задължителни заглавките за време и подпис.",
  tr: "Webhook rotası yönetici ara katmanından muaftır, çünkü onu çağıran operatör değil uyarı sistemidir. POPOPX_ALERT_WEBHOOK_SECRET ayarlıysa token’a ek olarak zaman damgası ve imza başlıkları da zorunludur.",
  hu: "A webhook útvonal ki van véve az admin middleware alól, mert a hívója a riasztási rendszer, nem az operátor. Ha a POPOPX_ALERT_WEBHOOK_SECRET be van állítva, a token mellett kötelező az időbélyeg- és az aláírásfejléc is.",
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
  en: "The twelve meters, their factory prices, and the four answers a refused call can get. All of them are distinguishable on purpose.",
  ru: "Двенадцать счётчиков, их заводские цены и четыре ответа, которые может получить отклонённый вызов. Все они различимы намеренно.",
  de: "Die zwölf Meter, ihre Werkpreise und die vier Antworten, die ein abgelehnter Aufruf bekommen kann. Alle sind bewusst unterscheidbar.",
  fr: "Les douze compteurs, leurs prix d’usine et les quatre réponses qu’un appel refusé peut obtenir. Ils sont distinguables volontairement.",
  it: "I dodici contatori, i prezzi di fabbrica e le quattro risposte che una chiamata rifiutata può ottenere. Sono distinguibili per scelta.",
  nl: "De twaalf meters, hun fabrieksprijzen en de vier antwoorden die een geweigerde aanroep kan krijgen. Opzettelijk allemaal te onderscheiden.",
  cs: "Dvanáct měrek, jejich výrobní ceny a čtyři odpovědi, které může odmítnutý požadavek dostat. Všechny jsou záměrně rozlišitelné.",
  "zh-Hans": "十二个计量表、出厂单价，以及一次被拒调用能拿到的四种答案。这四种是刻意做成可区分的。",
  "zh-Hant": "十二個計量表、出廠單價，以及一次被拒呼叫能拿到的四種答案。這四種是刻意做成可區分的。",
  es: "Los doce medidores, sus precios de fábrica y las cuatro respuestas que puede obtener una llamada rechazada. Todas distinguibles a propósito.",
  pl: "Dwanaście mierników, ich ceny fabryczne i cztery odpowiedzi, jakie może dostać odrzucone wywołanie. Wszystkie celowo do rozróżnienia.",
  ja: "12 個のメーターとその出荷時単価、そして拒否された呼び出しが取り得る 4 つの回答。4 つは意図的に区別できるようにしてあります。",
  th: "ตัวนับทั้งสิบสอง ราคาตั้งต้นจากโรงงาน และคำตอบสี่แบบที่การเรียกถูกปฏฺิเสธได้รับ ทั้งสี่จงใจให้แยกออกจากกัน",
  fi: "Kaksitoista mittaria, niiden tehdashinnat ja neljä vastausta, jotka hylätty kutsu voi saada. Tarkoitus on, että ne erottaa toisistaan.",
  uk: "Дванадцять лічильників, їхні заводські ціни та чотири відповіді, які може отримати відхилений виклик. Усі вони навмисне розрізнені.",
  bg: "Дванадесетте мерни единици, фабричните им цени и четирите отговора, които отказано извикване може да получи. Всички са различими по замисъл.",
  tr: "On iki ölçer, fabrika fiyatları ve reddedilen bir çağrının alabileceği dört yanıt. Dördü de bilinçli olarak birbirinden ayırt edilebilir.",
  hu: "A tizenkét mérő, a gyári áraik és a négy válasz, amit egy elutasított hívás kaphat. Mind a négy szándékosan megkülönböztethető.",
};

/* ─────────────────────────────────────────────────────────────────────────────
 * The grouped cards. A row tagged `planned` is a control the code does not have:
 * the tag is what the filter reads, and the value text names the gap too, so the
 * honesty survives even with the filter on "All rows". As of 2026-11-26 every
 * row below is `shipped`; the tag stays in the model for the next gap.
 * ────────────────────────────────────────────────────────────────────────── */

const PANELS: readonly Panel[] = [
  {
    id: "credentials",
    code: "Credential handling",
    accent: "mesh",
    glyph: ["M12 3l7 3v5c0 4.2-2.9 7.5-7 8.7-4.1-1.2-7-4.5-7-8.7V6l7-3z", "M12 9.5v3.5"],
    name: {
      en: "Credential handling — plaintext by default, sealed with a key you hold",
      ru: "Работа с секретами — по умолчанию открыто, с вашим ключом — запечатано",
      de: "Umgang mit Secrets — standardmäßig Klartext, mit deinem Schlüssel versiegelt",
      fr: "Traitement des secrets — en clair par défaut, scellés avec votre clé",
      it: "Gestione dei segreti — in chiaro per default, sigillati con la tua chiave",
      nl: "Omgaan met secrets — standaard platte tekst, verzegeld met jouw sleutel",
      cs: "Práce s tajnými údaji — ve výchozím stavu otevřená, s vaším klíčem zapečetěná",
      "zh-Hans": "凭据处理——默认明文，握有密钥即可封缄",
      "zh-Hant": "憑證處理——預設明文，握有密鑰即可封緘",
      es: "Gestión de credenciales — en claro por defecto, selladas con tu clave",
      pl: "Obsługa sekretów — domyślnie jawnie, z twoim kluczem zapieczętowane",
      ja: "認証情報の取り扱い — 既定は平文、鍵があれば封緘",
      th: "การจัดการ credential — ค่าเริ่มต้นเป็นข้อความชัด ใส่กุญแจแล้วผนึก",
      fi: "Kirjautustietojen käsittely — oletuksena selväkielistä, avaimellasi sinetöityä",
      uk: "Робота з секретами — типово відкрито, із вашим ключем — запечатано",
      bg: "Работа с тайните — по подразбиране открито, с вашия ключ — запечатано",
      tr: "Kimlik bilgisi yönetimi — varsayılan düz metin, anahtarınızla mühürlü",
      hu: "A titkok kezelése — alapból nyílt szöveg, a te kulcsoddal lepecsételve",
    },
    hook: {
      en: "POPOPX_VAULT_KEY is optional. Set it and gateway/app/vault.py seals seven columns with ChaCha20-Poly1305 before they reach SQLite; leave it unset and the same columns stay plaintext, which is the shipped default.",
      ru: "POPOPX_VAULT_KEY необязателен. Задайте его — и gateway/app/vault.py запечатает семь колонок через ChaCha20-Poly1305 ещё до записи в SQLite; не задавайте — те же колонки останутся открытым текстом, таково поведение по умолчанию.",
      de: "POPOPX_VAULT_KEY ist optional. Ist er gesetzt, versiegelt gateway/app/vault.py sieben Spalten mit ChaCha20-Poly1305, bevor sie SQLite erreichen; ohne ihn bleiben dieselben Spalten Klartext — das ist der ausgelieferte Standard.",
      fr: "POPOPX_VAULT_KEY est facultatif. Défini, gateway/app/vault.py scelle sept colonnes avec ChaCha20-Poly1305 avant qu’elles n’atteignent SQLite ; absent, ces mêmes colonnes restent en clair — c’est le comportement livré par défaut.",
      it: "POPOPX_VAULT_KEY è facoltativa. Se impostata, gateway/app/vault.py sigilla sette colonne con ChaCha20-Poly1305 prima che arrivino a SQLite; se assente, le stesse colonne restano in chiaro — è il default spedito.",
      nl: "POPOPX_VAULT_KEY is optioneel. Stel je hem in, dan verzegelt gateway/app/vault.py zeven kolommen met ChaCha20-Poly1305 voordat ze SQLite bereiken; laat je hem weg, dan blijven die kolommen platte tekst — dat is de geleverde standaard.",
      cs: "POPOPX_VAULT_KEY je volitelný. Když ho nastavíte, gateway/app/vault.py zapečetí sedm sloupců pomocí ChaCha20-Poly1305 dřív, než se dostanou do SQLite; bez něj zůstávají tytéž sloupce otevřené — to je výchozí stav.",
      "zh-Hans": "POPOPX_VAULT_KEY 是可选的。设上它，gateway/app/vault.py 会在写入 SQLite 之前用 ChaCha20-Poly1305 封缄七列；不设，这七列就保持明文，这也是默认行为。",
      "zh-Hant": "POPOPX_VAULT_KEY 是可選的。設上它，gateway/app/vault.py 會在寫入 SQLite 之前用 ChaCha20-Poly1305 封緘七欄；不設，這七欄就保持明文，這也是預設行為。",
      es: "POPOPX_VAULT_KEY es opcional. Si la defines, gateway/app/vault.py sella siete columnas con ChaCha20-Poly1305 antes de que lleguen a SQLite; si no, esas mismas columnas quedan en claro, que es el comportamiento de fábrica.",
      pl: "POPOPX_VAULT_KEY jest opcjonalny. Po ustawieniu gateway/app/vault.py pieczętuje siedem kolumn algorytmem ChaCha20-Poly1305, zanim trafią do SQLite; bez niego te same kolumny zostają jawne — to zachowanie domyślne.",
      ja: "POPOPX_VAULT_KEY は任意です。設定すると gateway/app/vault.py が SQLite に届く前に 7 つのカラムを ChaCha20-Poly1305 で封緘します。未設定なら同じカラムは平文のままで、これが出荷時の既定です。",
      th: "POPOPX_VAULT_KEY เป็นตัวเลือก ถ้าตั้งไว้ gateway/app/vault.py จะผนึกเจ็ดคอลัมน์ด้วย ChaCha20-Poly1305 ก่อนถึง SQLite ถ้าไม่ตั้ง คอลัมน์เดิมจะยังเป็นข้อความชัด ซึ่งเป็นค่าเริ่มต้นที่ส่งมอบ",
      fi: "POPOPX_VAULT_KEY on valinnainen. Kun se on asetettu, gateway/app/vault.py sinetöi seitsemän saraketta ChaCha20-Poly1305:llä ennen kuin ne päätyvät SQLiteen; ilman sitä samat sarakkeet pysyvät selväkielisinä — se on toimitettu oletus.",
      uk: "POPOPX_VAULT_KEY необов'язковий. Якщо його задати, gateway/app/vault.py запечатає сім стовпців через ChaCha20-Poly1305 ще до запису в SQLite; якщо ні — ті самі стовпці лишаються відкритими, це типова поведінка.",
      bg: "POPOPX_VAULT_KEY е незадължителен. Зададен ли е, gateway/app/vault.py запечатва седем колони с ChaCha20-Poly1305, преди да стигнат до SQLite; без него същите колони остават открити — това е доставената настройка по подразбиране.",
      tr: "POPOPX_VAULT_KEY isteğe bağlıdır. Ayarlarsanız gateway/app/vault.py yedi sütunu SQLite’a ulaşmadan önce ChaCha20-Poly1305 ile mühürler; ayarlamazsanız aynı sütunlar düz metin kalır — gönderilen varsayılan budur.",
      hu: "A POPOPX_VAULT_KEY opcionális. Ha beállítod, a gateway/app/vault.py hét oszlopot pecsétel le ChaCha20-Poly1305-tel, mielőtt az SQLite-ba kerülnek; ha nem, ugyanezek az oszlopok nyílt szövegben maradnak — ez a szállított alapértelmezés.",
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
        state: "shipped",
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
          en: "Shipped: set POPOPX_VAULT_KEY and gateway/app/vault.py derives a per-column key with HKDF-SHA256, then seals seven columns with ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password and both slack_discord_workspaces columns. AAD is popopx.vault.v1|<table>|<column>|<subject>, sealed values carry a vault1: prefix, and plaintext rows still read. The gateway still holds the Ed25519 channel identity and can decrypt what it stores: zero-knowledge holds against the relay, not against your own gateway.",
          ru: "Уже в коде: задайте POPOPX_VAULT_KEY, и gateway/app/vault.py выведет ключ для каждой колонки через HKDF-SHA256 и запечатает семь колонок ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password и обе колонки slack_discord_workspaces. AAD — popopx.vault.v1|<table>|<column>|<subject>, запечатанные значения несут префикс vault1:, а незапечатанные строки по-прежнему читаются. Шлюз всё равно держит Ed25519-идентичность канала и может расшифровать то, что хранит: zero-knowledge действует против релея, а не против вашего собственного шлюза.",
          de: "Ausgeliefert: Mit gesetztem POPOPX_VAULT_KEY leitet gateway/app/vault.py per HKDF-SHA256 einen Schlüssel je Spalte ab und versiegelt sieben Spalten mit ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password und beide slack_discord_workspaces-Spalten. Das AAD ist popopx.vault.v1|<table>|<column>|<subject>, versiegelte Werte tragen das Präfix vault1:, und Klartextzeilen werden weiterhin gelesen. Das Gateway hält die Ed25519-Kanalidentität und kann entschlüsseln, was es speichert: Zero-Knowledge gilt gegen das Relay, nicht gegen dein eigenes Gateway.",
          fr: "Livré : avec POPOPX_VAULT_KEY défini, gateway/app/vault.py dérive une clé par colonne via HKDF-SHA256, puis scelle sept colonnes avec ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password et les deux colonnes de slack_discord_workspaces. L’AAD est popopx.vault.v1|<table>|<column>|<subject>, les valeurs scellées portent le préfixe vault1:, et les lignes en clair restent lisibles. La passerelle détient toujours l’identité Ed25519 du canal et peut déchiffrer ce qu’elle stocke : le zero-knowledge vaut contre le relais, pas contre votre propre passerelle.",
          it: "In codice: con POPOPX_VAULT_KEY impostata, gateway/app/vault.py deriva una chiave per colonna con HKDF-SHA256 e sigilla sette colonne con ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password e entrambe le colonne di slack_discord_workspaces. L’AAD è popopx.vault.v1|<table>|<column>|<subject>, i valori sigillati portano il prefisso vault1: e le righe in chiaro si leggono ancora. Il gateway detiene comunque l’identità Ed25519 del canale e può decifrare ciò che conserva: il zero-knowledge vale contro il relay, non contro il tuo gateway.",
          nl: "Uitgebracht: met POPOPX_VAULT_KEY gezet leidt gateway/app/vault.py per kolom een sleutel af met HKDF-SHA256 en verzegelt zeven kolommen met ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password en beide kolommen van slack_discord_workspaces. De AAD is popopx.vault.v1|<table>|<column>|<subject>, verzegelde waarden dragen het prefix vault1: en rijen met platte tekst blijven leesbaar. De gateway houdt de Ed25519-kanaalidentiteit en kan ontsleutelen wat hij bewaart: zero-knowledge geldt tegen de relay, niet tegen je eigen gateway.",
          cs: "V kódu: s nastaveným POPOPX_VAULT_KEY odvodí gateway/app/vault.py klíč pro každý sloupec přes HKDF-SHA256 a zapečetí sedm sloupců pomocí ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password a oba sloupce slack_discord_workspaces. AAD je popopx.vault.v1|<table>|<column>|<subject>, zapečetěné hodnoty nesou předponu vault1: a řádky v otevřeném textu se dál čtou. Brána stále drží Ed25519 identitu kanálu a umí dešifrovat, co ukládá: zero-knowledge platí proti relay, ne proti vaší vlastní bráně.",
          "zh-Hans": "已上线：设好 POPOPX_VAULT_KEY，gateway/app/vault.py 会用 HKDF-SHA256 为每一列派生密钥，再用 ChaCha20-Poly1305 封缄七列——eco_sessions.secret_hex、channels.identity_sec_b64url、channel_epochs.key_b64url、workflow_subscriptions.secret、dav_endpoints.password，以及 slack_discord_workspaces 的两列。AAD 是 popopx.vault.v1|<table>|<column>|<subject>，封缄值带 vault1: 前缀，明文行照样能读。网关仍然握有频道的 Ed25519 身份、能解开自己存的东西：零知识是对中继站成立的，不是对你自己的网关成立的。",
          "zh-Hant": "已上線：設好 POPOPX_VAULT_KEY，gateway/app/vault.py 會用 HKDF-SHA256 為每一欄派生密鑰，再用 ChaCha20-Poly1305 封緘七欄——eco_sessions.secret_hex、channels.identity_sec_b64url、channel_epochs.key_b64url、workflow_subscriptions.secret、dav_endpoints.password，以及 slack_discord_workspaces 的兩欄。AAD 是 popopx.vault.v1|<table>|<column>|<subject>，封緘值帶 vault1: 前綴，明文列照樣能讀。閘道仍然握有頻道的 Ed25519 身分、能解開自己存的東西：零知識是對中繼站成立的，不是對你自己的閘道成立的。",
          es: "Ya en el código: con POPOPX_VAULT_KEY definida, gateway/app/vault.py deriva una clave por columna con HKDF-SHA256 y sella siete columnas con ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password y las dos columnas de slack_discord_workspaces. El AAD es popopx.vault.v1|<table>|<column>|<subject>, los valores sellados llevan el prefijo vault1: y las filas en claro se siguen leyendo. La pasarela conserva la identidad Ed25519 del canal y puede descifrar lo que guarda: el zero-knowledge vale contra el relay, no contra tu propia pasarela.",
          pl: "Już w kodzie: po ustawieniu POPOPX_VAULT_KEY gateway/app/vault.py wyprowadza klucz na kolumnę przez HKDF-SHA256 i pieczętuje siedem kolumn algorytmem ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password oraz obie kolumny slack_discord_workspaces. AAD to popopx.vault.v1|<table>|<column>|<subject>, zapieczętowane wartości niosą prefiks vault1:, a wiersze jawne nadal się czytają. Brama wciąż trzyma tożsamość Ed25519 kanału i potrafi odszyfrować to, co przechowuje: zero-knowledge działa wobec przekaźnika, nie wobec twojej własnej bramy.",
          ja: "実装済み: POPOPX_VAULT_KEY を設定すると、gateway/app/vault.py が HKDF-SHA256 でカラムごとの鍵を導出し、7 つのカラムを ChaCha20-Poly1305 で封緘します — eco_sessions.secret_hex、channels.identity_sec_b64url、channel_epochs.key_b64url、workflow_subscriptions.secret、dav_endpoints.password、slack_discord_workspaces の 2 カラムです。AAD は popopx.vault.v1|<table>|<column>|<subject>、封緘値には vault1: が付き、平文の行もそのまま読めます。ゲートウェイはチャンネルの Ed25519 識別子を保持し、保存したものを復号できます。ゼロ知識が成立するのはリレーに対してであり、自分のゲートウェイに対してではありません。",
          th: "มีในโค้ดแล้ว: เมื่อตั้ง POPOPX_VAULT_KEY, gateway/app/vault.py จะสังเคราะห์คีย์แยกตามคอลัมน์ด้วย HKDF-SHA256 แล้วผนึกเจ็ดคอลัมน์ด้วย ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password และทั้งสองคอลัมน์ของ slack_discord_workspaces ค่า AAD คือ popopx.vault.v1|<table>|<column>|<subject> ค่าที่ผนึกมีคำนำหน้า vault1: และแถวที่เป็นข้อความชัดยังอ่านได้ เกตเวย์ยังถือตัวตน Ed25519 ของแชนเนลและถอดรหัสสิ่งที่เก็บไว้ได้: zero-knowledge ใช้ได้กับ relay ไม่ใช่กับเกตเวย์ของคุณเอง",
          fi: "Koodissa: kun POPOPX_VAULT_KEY on asetettu, gateway/app/vault.py johtaa sarakekohtaisen avaimen HKDF-SHA256:lla ja sinetöi seitsemän saraketta ChaCha20-Poly1305:llä — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password sekä slack_discord_workspacesin molemmat sarakkeet. AAD on popopx.vault.v1|<table>|<column>|<subject>, sinetöidyt arvot kantavat vault1:-etuliitettä ja selväkieliset rivit luetaan edelleen. Gateway säilyttää kanavan Ed25519-identiteetin ja voi purkaa sen, mitä tallentaa: nollatieto pätee relaita vastaan, ei omaa gatewaytäsi vastaan.",
          uk: "Уже в коді: задайте POPOPX_VAULT_KEY, і gateway/app/vault.py виведе ключ для кожного стовпця через HKDF-SHA256 та запечатає сім стовпців ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password та обидва стовпці slack_discord_workspaces. AAD — popopx.vault.v1|<table>|<column>|<subject>, запечатані значення мають префікс vault1:, а відкриті рядки й далі читаються. Шлюз усе одно тримає Ed25519-ідентичність каналу й може розшифрувати те, що зберігає: zero-knowledge діє проти релею, а не проти вашого власного шлюзу.",
          bg: "В кода: при зададен POPOPX_VAULT_KEY gateway/app/vault.py извежда ключ за всяка колона чрез HKDF-SHA256 и запечатва седем колони с ChaCha20-Poly1305 — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password и двете колони на slack_discord_workspaces. AAD е popopx.vault.v1|<table>|<column>|<subject>, запечатаните стойности носят префикс vault1:, а редовете в чист текст продължават да се четат. Гейтуейтът все още държи Ed25519 идентичността на канала и може да разшифрова това, което пази: нулевото знание важи срещу relaya, не срещу собствения ти гейтуейт.",
          tr: "Kodda: POPOPX_VAULT_KEY ayarlıysa gateway/app/vault.py HKDF-SHA256 ile sütun başına anahtar türetir, ardından yedi sütunu ChaCha20-Poly1305 ile mühürler — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password ve slack_discord_workspaces’in iki sütunu. AAD, popopx.vault.v1|<table>|<column>|<subject> biçimindedir, mühürlü değerler vault1: öneki taşır ve düz metin satırlar okunmaya devam eder. Ağ geçidi kanalın Ed25519 kimliğini hâlâ elinde tutar ve sakladığını çözebilir: sıfır bilgi aktarana karşı geçerlidir, kendi ağ geçidine karşı değil.",
          hu: "Már a kódban: ha a POPOPX_VAULT_KEY be van állítva, a gateway/app/vault.py HKDF-SHA256-tal oszloponkénti kulcsot vezet le, majd ChaCha20-Poly1305-tel lepecsétel hét oszlopot — eco_sessions.secret_hex, channels.identity_sec_b64url, channel_epochs.key_b64url, workflow_subscriptions.secret, dav_endpoints.password és a slack_discord_workspaces mindkét oszlopa. Az AAD a popopx.vault.v1|<table>|<column>|<subject>, a lepecsételt értékek vault1: előtagot hordoznak, a nyílt szövegű sorok pedig továbbra is olvashatók. Az átjáró továbbra is birtokolja a csatorna Ed25519 azonosságát, és vissza tudja fejteni, amit tárol: a zero-knowledge a relay ellen áll, nem a saját átjáród ellen.",
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
          en: "The boundary is the host and the key: 0600 on .env, a service user nobody else can become, a default bind on 127.0.0.1:8080, and a POPOPX_VAULT_KEY that lives in the environment, never in the database or its backup. The key is deliberately not derived from POPOPX_ADMIN_TOKEN, and losing it makes sealed rows unreadable. To seal existing rows run python3 -m app.main --migrate-secrets once — it is idempotent and leaves empty values alone. Without the cryptography wheel the vault fails loud with VaultUnavailable instead of writing plaintext.",
          ru: "Граница теперь — это хост и ключ: 0600 на .env, сервисный пользователь, которым больше никто не может стать, типичный bind на 127.0.0.1:8080 и POPOPX_VAULT_KEY, который живёт в окружении, но никогда — в базе или её резервной копии. Ключ намеренно не выводится из POPOPX_ADMIN_TOKEN, и его потеря делает запечатанные строки нечитаемыми. Чтобы запечатать существующие строки, один раз запустите python3 -m app.main --migrate-secrets — команда идемпотентна и не трогает пустые значения. Без пакета cryptography хранилище громко падает с VaultUnavailable и не пишет открытый текст.",
          de: "Die Grenze sind jetzt Host und Schlüssel: 0600 auf .env, ein Dienstbenutzer, der sonst niemand werden kann, ein Standard-Bind auf 127.0.0.1:8080 und ein POPOPX_VAULT_KEY, der in der Umgebung lebt, nie in der Datenbank oder ihrem Backup. Der Schlüssel wird bewusst nicht aus POPOPX_ADMIN_TOKEN abgeleitet; geht er verloren, sind versiegelte Zeilen nicht mehr lesbar. Um vorhandene Zeilen zu versiegeln, einmal python3 -m app.main --migrate-secrets ausführen — idempotent, leere Werte bleiben unberührt. Ohne das cryptography-Wheel scheitert der Vault laut mit VaultUnavailable, statt Klartext zu schreiben.",
          fr: "La frontière, désormais, c’est l’hôte et la clé : 0600 sur .env, un utilisateur de service que personne d’autre ne peut devenir, un bind par défaut sur 127.0.0.1:8080, et une POPOPX_VAULT_KEY qui vit dans l’environnement, jamais dans la base ni sa sauvegarde. La clé n’est délibérément pas dérivée de POPOPX_ADMIN_TOKEN, et sa perte rend les lignes scellées illisibles. Pour sceller les lignes existantes, lancez une fois python3 -m app.main --migrate-secrets : idempotent, et les valeurs vides restent intactes. Sans la roue cryptography, le coffre échoue bruyamment avec VaultUnavailable au lieu d’écrire en clair.",
          it: "Il confine ora è host e chiave: 0600 su .env, un utente di servizio che nessun altro può diventare, un bind predefinito su 127.0.0.1:8080 e una POPOPX_VAULT_KEY che vive nell’ambiente, mai nel database né nel suo backup. La chiave non è derivata di proposito da POPOPX_ADMIN_TOKEN, e perderla rende illeggibili le righe sigillate. Per sigillare le righe esistenti esegui una volta python3 -m app.main --migrate-secrets: è idempotente e lascia intatti i valori vuoti. Senza il wheel cryptography il caveau fallisce rumorosamente con VaultUnavailable invece di scrivere in chiaro.",
          nl: "De grens is nu host en sleutel: 0600 op .env, een servicegebruiker die niemand anders kan worden, een standaard bind op 127.0.0.1:8080, en een POPOPX_VAULT_KEY die in de omgeving leeft, nooit in de database of haar back-up. De sleutel wordt bewust niet van POPOPX_ADMIN_TOKEN afgeleid, en verlies ervan maakt verzegelde rijen onleesbaar. Draai één keer python3 -m app.main --migrate-secrets om bestaande rijen te verzegelen — idempotent, en lege waarden blijven ongemoeid. Zonder de cryptography-wheel faalt de kluis luid met VaultUnavailable in plaats van platte tekst te schrijven.",
          cs: "Hranicí jsou teď hostitel a klíč: 0600 na .env, služební uživatel, kterým se nikdo další nestane, výchozí bind na 127.0.0.1:8080 a POPOPX_VAULT_KEY, který žije v prostředí, nikdy v databázi ani její záloze. Klíč se záměrně neodvozuje z POPOPX_ADMIN_TOKEN a jeho ztráta učiní zapečetěné řádky nečitelnými. Pro zapečetění existujících řádků jednou spusťte python3 -m app.main --migrate-secrets — je idempotentní a prázdné hodnoty nechává být. Bez wheelu cryptography trezor hlasitě selže s VaultUnavailable, místo aby zapisoval otevřený text.",
          "zh-Hans": "边界现在既是主机也是密钥：.env 给 0600，跑在别的用户变不过去的服务账号下，默认只绑 127.0.0.1:8080，而 POPOPX_VAULT_KEY 只存在于环境里，绝不进数据库，也不进备份。密钥刻意不从 POPOPX_ADMIN_TOKEN 派生；弄丢它，被封缄的行就再也读不出来。要给已有行封缄，跑一次 python3 -m app.main --migrate-secrets——幂等，空值不动。缺 cryptography 轮子时，保管库会以 VaultUnavailable 大声失败，而不是悄悄写明文。",
          "zh-Hant": "邊界現在既是主機也是密鑰：.env 給 0600，跑在別人變不過去的服務帳號下，預設只綁 127.0.0.1:8080，而 POPOPX_VAULT_KEY 只存在於環境裡，絕不進資料庫，也不進備份。密鑰刻意不從 POPOPX_ADMIN_TOKEN 派生；弄丟它，被封緘的列就再也讀不出來。要給既有列封緘，跑一次 python3 -m app.main --migrate-secrets——冪等，空值不動。缺 cryptography 輪子時，保管庫會以 VaultUnavailable 大聲失敗，而不是悄悄寫明文。",
          es: "La frontera ahora es el host y la clave: 0600 en .env, un usuario de servicio que nadie más puede ser, un bind por defecto en 127.0.0.1:8080 y una POPOPX_VAULT_KEY que vive en el entorno, nunca en la base ni en su copia de seguridad. La clave no se deriva a propósito de POPOPX_ADMIN_TOKEN, y perderla deja ilegibles las filas selladas. Para sellar las filas existentes, ejecuta una vez python3 -m app.main --migrate-secrets: es idempotente y deja intactos los valores vacíos. Sin la rueda cryptography, la bóveda falla en voz alta con VaultUnavailable en lugar de escribir en claro.",
          pl: "Granicą są teraz host i klucz: 0600 na .env, konto serwisowe, którym nikt inny nie może zostać, domyślny bind na 127.0.0.1:8080 oraz POPOPX_VAULT_KEY, który żyje w środowisku, nigdy w bazie ani jej kopii. Klucz celowo nie jest wyprowadzany z POPOPX_ADMIN_TOKEN, a jego utrata czyni zapieczętowane wiersze nieczytelnymi. Aby zapieczętować istniejące wiersze, uruchom raz python3 -m app.main --migrate-secrets — jest idempotentne i nie rusza pustych wartości. Bez koła cryptography sejf głośno zawodzi z VaultUnavailable zamiast pisać jawny tekst.",
          ja: "境界は今やホストと鍵の両方です。.env に 0600 を掛け、他の誰もなれないサービスユーザーで動かし、既定では 127.0.0.1:8080 にバインドし、POPOPX_VAULT_KEY は環境変数の中だけに置き、データベースにもそのバックアップにも入れません。鍵は POPOPX_ADMIN_TOKEN から意図的に導出せず、失うと封緘済みの行は読めなくなります。既存行を封緘するには python3 -m app.main --migrate-secrets を一度だけ実行してください。冪等で、空の値はそのまま残ります。cryptography ホイールが無い場合、保管庫は平文を書かず VaultUnavailable で大きな音を立てて失敗します。",
          th: "เส้นแบ่งตอนนี้คือทั้งเครื่องและคีย์: .env ตั้ง 0600, รันด้วยบัญชี service ที่คนอื่นกลายเป็นไม่ได้, bind ค่าเริ่มต้นที่ 127.0.0.1:8080 และ POPOPX_VAULT_KEY อยู่ใน environment เท่านั้น ไม่เคยอยู่ในฐานข้อมูลหรือแบ็กอัป คีย์นี้จงใจไม่สังเคราะห์จาก POPOPX_ADMIN_TOKEN และถ้าทำหาย แถวที่ผนึกแล้วจะอ่านไม่ได้ หากต้องการผนึกแถวที่มีอยู่ ให้รัน python3 -m app.main --migrate-secrets หนึ่งครั้ง — เป็นการทำงานซ้ำได้และไม่แตะค่าที่ว่างอยู่ ถ้าไม่มี wheel cryptography คลังเก็บจะล้มเหลวดัง ๆ ด้วย VaultUnavailable แทนที่จะเขียนข้อความชัด",
          fi: "Raja on nyt sekä isäntäkone että avain: 0600 .env:lle, palvelukäyttäjä, joksi kukaan muu ei voi tulla, oletusbindaus 127.0.0.1:8080, ja POPOPX_VAULT_KEY, joka elää ympäristössä, ei koskaan tietokannassa tai sen varmuuskopiossa. Avainta ei tarkoituksella johdeta POPOPX_ADMIN_TOKENista, ja sen menettäminen tekee sinetöidyistä riveistä lukukelvottomia. Sinetöi olemassa olevat rivit ajamalla kerran python3 -m app.main --migrate-secrets — se on idempotentti eikä koske tyhjiin arvoihin. Ilman cryptography-pyörää holkki epäonnistuu äänekkäästi VaultUnavailable-virheellä sen sijaan että kirjoittaisi selväkieltä.",
          uk: "Межа тепер — це і хост, і ключ: 0600 на .env, сервісний користувач, ким більше ніхто не може стати, типовий bind на 127.0.0.1:8080 та POPOPX_VAULT_KEY, який живе в середовищі, але ніколи — в базі чи її резервній копії. Ключ навмисно не виводиться з POPOPX_ADMIN_TOKEN, і його втрата робить запечатані рядки нечитними. Щоб запечатати наявні рядки, запустіть один раз python3 -m app.main --migrate-secrets — команда ідемпотентна й не чіпає порожніх значень. Без пакета cryptography сховище гучно падає з VaultUnavailable, а не пише відкритий текст.",
          bg: "Границата сега са хостът и ключът: 0600 върху .env, сервисен потребител, в който никой друг не може да се превърне, bind по подразбиране на 127.0.0.1:8080 и POPOPX_VAULT_KEY, който живее в средата, никога в базата или нейното резервно копие. Ключът умишлено не се извежда от POPOPX_ADMIN_TOKEN и загубата му прави запечатаните редове нечетими. За да запечатате съществуващите редове, пуснете веднъж python3 -m app.main --migrate-secrets — идемпотентно е и не пипа празните стойности. Без wheel-а cryptography трезорът се проваля шумно с VaultUnavailable, вместо да пише чист текст.",
          tr: "Sınır artık hem ana makine hem anahtar: .env üzerinde 0600, kimsenin olamadığı bir servis kullanıcısı, varsayılan 127.0.0.1:8080 bind’i ve yalnızca ortamda yaşayan, veritabanına ya da yedeğine asla girmeyen bir POPOPX_VAULT_KEY. Anahtar bilinçli olarak POPOPX_ADMIN_TOKEN’dan türetilmez; kaybı, mühürlü satırları okunamaz kılar. Var olan satırları mühürlemek için python3 -m app.main --migrate-secrets komutunu bir kez çalıştırın — idempotenttir ve boş değerlere dokunmaz. cryptography wheel’i yoksa kasa, düz metin yazmak yerine VaultUnavailable ile yüksek sesle başarısız olur.",
          hu: "A határ most a gép és a kulcs: 0600 a .env-re, egy szolgáltatás-felhasználó, amely senki más nem lehet, alapértelmezett bind a 127.0.0.1:8080 címre, és egy POPOPX_VAULT_KEY, amely csak a környezetben él, az adatbázisban vagy annak mentésében soha. A kulcs szándékosan nem a POPOPX_ADMIN_TOKEN-ból származik, elvesztése pedig olvashatatlanná teszi a lepecsételt sorokat. A meglévő sorok lepecsételéséhez futtasd egyszer a python3 -m app.main --migrate-secrets parancsot — idempotens, és az üres értékeket békén hagyja. A cryptography wheel nélkül a trezor hangosan VaultUnavailable hibával áll le, ahelyett hogy nyílt szöveget írna.",
        },
      },
    ],
    keys: [".env (mode 0600)", "POPOPX_ADMIN_TOKEN", "POPOPX_VAULT_KEY", "gateway/app/vault.py", "--migrate-secrets", "gateway/app/config.py"],
  },
  {
    id: "admin-token",
    code: "Admin authorisation",
    accent: "brand",
    glyph: ["M4 6h16v12H4z", "M8 10h4", "M8 14h8"],
    name: {
      en: "Admin authorisation: a root token plus scoped pxa_ tokens",
      ru: "Авторизация админа: корневой токен плюс pxa_-токены со скоупами",
      de: "Admin-Autorisierung: Root-Token plus pxa_-Tokens mit Scopes",
      fr: "Autorisation admin : un jeton racine et des jetons pxa_ à portée",
      it: "Autorizzazione admin: token root più token pxa_ con scope",
      nl: "Admin-autorisatie: een root-token plus pxa_-tokens met scopes",
      cs: "Ověření admina: kořenový token plus tokeny pxa_ s rozsahy",
      "zh-Hans": "管理员授权：根令牌，加上带范围的 pxa_ 令牌",
      "zh-Hant": "管理員授權：根權杖，加上帶範圍的 pxa_ 權杖",
      es: "Autorización de administración: token raíz más tokens pxa_ con alcance",
      pl: "Uwierzytelnianie administratora: token główny plus tokeny pxa_ z zakresem",
      ja: "管理権限 — ルートトークンとスコープ付き pxa_ トークン",
      th: "การให้สิทธิ์ผู้ดูแล: root token บวกโทเคน pxa_ แบบมี scope",
      fi: "Admin-valtuutus: root-token ja skoopilliset pxa_-tokenit",
      uk: "Авторизація адміна: кореневий токен плюс pxa_-токени зі скоупами",
      bg: "Оторизация на админа: root токен плюс pxa_ токени с обхват",
      tr: "Yönetici yetkilendirmesi: root token artı kapsamlı pxa_ token’ları",
      hu: "Admin-hitelesítés: root token és scope-os pxa_ tokenek",
    },
    hook: {
      en: "The root POPOPX_ADMIN_TOKEN still opens everything and is the only credential that can mint, list or revoke scoped tokens. A pxa_ token is stored as its SHA-256 hash only and carries 1–16 scopes.",
      ru: "Корневой POPOPX_ADMIN_TOKEN по-прежнему открывает всё и остаётся единственной учёткой, которой можно выпускать, перечислять и отзывать токены. Токен pxa_ хранится только как SHA-256-хеш и несёт от 1 до 16 скоупов.",
      de: "Das Root-POPOPX_ADMIN_TOKEN öffnet weiterhin alles und ist das einzige Credential, das Tokens mit Scopes prägen, auflisten oder widerrufen kann. Ein pxa_-Token liegt nur als SHA-256-Hash vor und trägt 1–16 Scopes.",
      fr: "Le POPOPX_ADMIN_TOKEN racine ouvre toujours tout et reste le seul credential capable de créer, lister ou révoquer des jetons à portée. Un jeton pxa_ n’est stocké que sous forme de hash SHA-256 et porte 1 à 16 portées.",
      it: "Il POPOPX_ADMIN_TOKEN root apre ancora tutto ed è l’unica credenziale che può coniare, elencare o revocare token con scope. Un token pxa_ esiste solo come hash SHA-256 e porta da 1 a 16 scope.",
      nl: "Het root-POPOPX_ADMIN_TOKEN opent nog steeds alles en is het enige credential dat tokens met scopes kan slaan, opsommen of intrekken. Een pxa_-token staat alleen als SHA-256-hash opgeslagen en draagt 1–16 scopes.",
      cs: "Kořenový POPOPX_ADMIN_TOKEN dál otevírá vše a je jediným pověřením, které umí tokeny s rozsahy razit, vypisovat a odvolávat. Token pxa_ se ukládá jen jako SHA-256 hash a nese 1–16 rozsahů.",
      "zh-Hans": "根 POPOPX_ADMIN_TOKEN 照样畅通无阻，而且只有它能签发、列出、吊销带范围的令牌。pxa_ 令牌只以 SHA-256 哈希落库，携带 1–16 个范围。",
      "zh-Hant": "根 POPOPX_ADMIN_TOKEN 照樣暢通無阻，而且只有它能簽發、列出、撤銷帶範圍的權杖。pxa_ 權杖只以 SHA-256 雜湊落庫，攜帶 1–16 個範圍。",
      es: "El POPOPX_ADMIN_TOKEN raíz sigue abriéndolo todo y es la única credencial que puede acuñar, listar o revocar tokens con alcance. Un token pxa_ solo se guarda como su hash SHA-256 y lleva de 1 a 16 alcances.",
      pl: "Główny POPOPX_ADMIN_TOKEN nadal otwiera wszystko i jest jedynym poświadczeniem, którym można tworzyć, listować i odwoływać tokeny z zakresem. Token pxa_ istnieje tylko jako hash SHA-256 i niesie 1–16 zakresów.",
      ja: "ルートの POPOPX_ADMIN_TOKEN は今もすべてを開き、スコープ付きトークンを発行・一覧・失効できる唯一の認証情報です。pxa_ トークンは SHA-256 ハッシュとしてだけ保存され、1〜16 個のスコープを持ちます。",
      th: "POPOPX_ADMIN_TOKEN ระดับ root ยังเปิดได้ทุกอย่าง และเป็น credential เดียวที่ออก รายการ หรือเพิกถอนโทเคนแบบมี scope ได้ ตัวโทเคน pxa_ ถูกเก็บเป็นแฮช SHA-256 เท่านั้น และพก scope ได้ 1–16 รายการ",
      fi: "Root-tason POPOPX_ADMIN_TOKEN avaa edelleen kaiken, ja vain sillä voi luoda, listata ja peruuttaa skoopillisia tokeneita. pxa_-token säilytetään vain SHA-256-tiivisteenä ja kantaa 1–16 skooppia.",
      uk: "Кореневий POPOPX_ADMIN_TOKEN і далі відкриває все, і лише ним можна випускати, перелічувати та відкликати токени зі скоупами. Токен pxa_ зберігається лише як SHA-256-хеш і несе від 1 до 16 скоупів.",
      bg: "Root POPOPX_ADMIN_TOKEN продължава да отваря всичко и е единственото удостоверение, с което могат да се издават, изброяват и отменят токени с обхват. Токенът pxa_ се пази само като SHA-256 хеш и носи 1–16 обхвата.",
      tr: "Root POPOPX_ADMIN_TOKEN hâlâ her şeyi açar ve kapsamlı token’ları üretebilen, listeleyebilen ve iptal edebilen tek kimlik bilgisidir. Bir pxa_ token’ı yalnızca SHA-256 karması olarak saklanır ve 1–16 kapsam taşır.",
      hu: "A root POPOPX_ADMIN_TOKEN továbbra is mindent kinyit, és csak vele lehet scope-os tokent kibocsátani, listázni és visszavonni. A pxa_ token csak SHA-256-ként tárolódik, és 1–16 scope-ot hordoz.",
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
          en: "Four spellings are accepted: X-Popopx-Admin-Token and its older X-Admin-Token alias, Authorization: Bearer, or ?token= in the query. A root token is compared in constant time against POPOPX_ADMIN_TOKEN; an empty configured token is a refusal, never a wildcard.",
          ru: "Принимаются четыре формы: X-Popopx-Admin-Token и его старый псевдоним X-Admin-Token, Authorization: Bearer либо ?token= в строке запроса. Корневой токен сравнивается с POPOPX_ADMIN_TOKEN за постоянное время; пустое значение в конфиге — это отказ, а не подстановочный шаблон.",
          de: "Vier Schreibweisen zählen: X-Popopx-Admin-Token und dessen älterer Alias X-Admin-Token, Authorization: Bearer oder ?token= in der Query. Ein Root-Token wird mit konstanter Laufzeit gegen POPOPX_ADMIN_TOKEN verglichen; ein leer konfiguriertes Token ist eine Ablehnung, nie ein Platzhalter.",
          fr: "Quatre écritures sont acceptées : X-Popopx-Admin-Token et son ancien alias X-Admin-Token, Authorization: Bearer, ou ?token= dans la query. Un jeton root est comparé à temps constant avec POPOPX_ADMIN_TOKEN ; un jeton configuré vide est un refus, jamais un joker.",
          it: "Sono accettate quattro forme: X-Popopx-Admin-Token e il suo vecchio alias X-Admin-Token, Authorization: Bearer, oppure ?token= nella query string. Un token root è confrontato a tempo costante con POPOPX_ADMIN_TOKEN; un token configurato vuoto è un rifiuto, mai un jolly.",
          "zh-Hant": "接受四種寫法：X-Popopx-Admin-Token 及其較舊的別名 X-Admin-Token、Authorization: Bearer，或 query 裡的 ?token=。Root token 會與 POPOPX_ADMIN_TOKEN 做常數時間比對；設定檔裡留空是拒絕，不是萬用字元。",
          nl: "Vier vormen worden geaccepteerd: X-Popopx-Admin-Token en het oudere alias X-Admin-Token, Authorization: Bearer, of ?token= in de querystring. Een root-token wordt met constante looptijd vergeleken tegen POPOPX_ADMIN_TOKEN; een leeg gezet token is een weigering, nooit een wildcard.",
          cs: "Přijímají se čtyři podoby: X-Popopx-Admin-Token a jeho starší alias X-Admin-Token, Authorization: Bearer, nebo ?token= v dotazu. Root token se porovnává s POPOPX_ADMIN_TOKEN ve stálém čase; prázdně nastavený token znamená zamítnutí, nikoli divoká karta.",
          "zh-Hans": "接受四种写法：X-Popopx-Admin-Token 及其旧别名 X-Admin-Token、Authorization: Bearer，或者 query 里的 ?token=。Root token 会与 POPOPX_ADMIN_TOKEN 做常数时间比对；配置里留空是拒绝，不是通配。",
          es: "Se aceptan cuatro formas: X-Popopx-Admin-Token y su alias anterior X-Admin-Token, Authorization: Bearer, o ?token= en la consulta. Un token root se compara en tiempo constante contra POPOPX_ADMIN_TOKEN; un token configurado vacío es un rechazo, nunca un comodín.",
          pl: "Akceptowane są cztery postacie: X-Popopx-Admin-Token i jego starszy alias X-Admin-Token, Authorization: Bearer albo ?token= w zapytaniu. Token root jest porównywany w stałym czasie z POPOPX_ADMIN_TOKEN; pusty token w konfiguracji to odmowa, nigdy wieloznacznik.",
          ja: "受け付けるのは 4 通りです。X-Popopx-Admin-Token と旧来の別名 X-Admin-Token、Authorization: Bearer、クエリの ?token= です。ルートトークンは POPOPX_ADMIN_TOKEN と定数時間で比較され、設定が空なら拒否であってワイルドカードにはなりません。",
          th: "รับได้สี่รูปแบบ: X-Popopx-Admin-Token และชื่อเดิม X-Admin-Token, Authorization: Bearer หรือ ?token= ใน query โดย root token จะถูกเทียบกับ POPOPX_ADMIN_TOKEN แบบคงเวลา ถ้าตั้งไว้ว่างเปล่าคือการปฏิเสธ ไม่ใช่ wildcard",
          fi: "Neljä muotoa hyväksytään: X-Popopx-Admin-Token ja sen vanhempi alias X-Admin-Token, Authorization: Bearer tai ?token= kyselyssä. Root-token verrataan vakioajassa POPOPX_ADMIN_TOKENiin; tyhjä asetettu token on hylkäys, ei koskaan villikortti.",
          uk: "Приймаються чотири форми: X-Popopx-Admin-Token та його старіший псевдонім X-Admin-Token, Authorization: Bearer або ?token= у рядку запиту. Кореневий токен порівнюється за сталий час з POPOPX_ADMIN_TOKEN; порожнє значення в конфігу — це відмова, а не wildcard.",
          bg: "Приемат се четири форми: X-Popopx-Admin-Token и по-стария му псевдоним X-Admin-Token, Authorization: Bearer или ?token= в заявката. Root токенът се сравнява с постоянно време срещу POPOPX_ADMIN_TOKEN; празен конфигуриран токен е отказ, никога не е заместител.",
          "tr": "Dört yazım kabul edilir: X-Popopx-Admin-Token ve eski takma adı X-Admin-Token, Authorization: Bearer ya da sorgudaki ?token=. Root token, POPOPX_ADMIN_TOKEN ile sabit zamanda karşılaştırılır; boş bırakılmış token bir rettir, asla joker değildir.",
          "hu": "Négy írásmód elfogadott: a X-Popopx-Admin-Token és a régebbi X-Admin-Token álneve, az Authorization: Bearer, vagy a queryben a ?token=. A root tokent állandó idejű összehasonlítással vetjük össze a POPOPX_ADMIN_TOKEN-nal; az üresen hagyott token elutasítás, soha nem helyettesítő karakter.",
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
          en: "Middleware now guards plugin routes and every non-public /api/v1/ route: unknown, expired or revoked tokens get 401 {\"ok\":false,\"error\":\"unauthorized\"}, and a known token missing the route's scope gets 403 {\"ok\":false,\"error\":\"forbidden\"} plus an audit row, before any handler runs.",
          ru: "Мидлвара теперь охраняет маршруты плагинов и все непубличные маршруты /api/v1/: неизвестный, просроченный или отозванный токен получает 401 {\"ok\":false,\"error\":\"unauthorized\"}, а известный токен без нужной области — 403 {\"ok\":false,\"error\":\"forbidden\"} и запись в аудите, ещё до вызова обработчика.",
          de: "Die Middleware schützt jetzt Plugin-Routen und jeden nicht öffentlichen /api/v1/-Pfad: unbekannte, abgelaufene oder widerrufene Tokens erhalten 401 {\"ok\":false,\"error\":\"unauthorized\"}, ein bekanntes Token ohne die nötige Scope erhält 403 {\"ok\":false,\"error\":\"forbidden\"} plus Audit-Zeile — bevor ein Handler läuft.",
          fr: "Le middleware protège désormais les routes de plugins et toutes les routes /api/v1/ non publiques : un jeton inconnu, expiré ou révoqué reçoit 401 {\"ok\":false,\"error\":\"unauthorized\"}, un jeton connu sans la portée requise reçoit 403 {\"ok\":false,\"error\":\"forbidden\"} et une ligne d’audit, avant tout traitement.",
          it: "Il middleware ora protegge le rotte dei plugin e ogni rotta /api/v1/ non pubblica: un token sconosciuto, scaduto o revocato riceve 401 {\"ok\":false,\"error\":\"unauthorized\"}, un token noto privo dello scope richiesto riceve 403 {\"ok\":false,\"error\":\"forbidden\"} più una riga di audit, prima di qualsiasi handler.",
          nl: "De middleware beschermt nu plugin-routes en elk niet-openbaar /api/v1/-pad: een onbekend, verlopen of ingetrokken token krijgt 401 {\"ok\":false,\"error\":\"unauthorized\"}, een bekend token zonder de vereiste scope krijgt 403 {\"ok\":false,\"error\":\"forbidden\"} plus een auditregel, voordat een handler draait.",
          cs: "Middleware nyní chrání trasy pluginů a každou neveřejnou trasu /api/v1/: neznámý, prošlý nebo odvolaný token dostane 401 {\"ok\":false,\"error\":\"unauthorized\"}, známý token bez potřebného scope dostane 403 {\"ok\":false,\"error\":\"forbidden\"} a záznam do auditu, ještě než se spustí handler.",
          "zh-Hans": "中间件现在同时保护插件路由和所有非公开的 /api/v1/ 路由：未知、过期或已撤销的 token 得到 401 {\"ok\":false,\"error\":\"unauthorized\"}；已知但缺少所需 scope 的 token 得到 403 {\"ok\":false,\"error\":\"forbidden\"} 并写入一条审计记录，这一切都发生在处理函数运行之前。",
          "zh-Hant": "中介層現在同時保護外掛路由與所有非公開的 /api/v1/ 路由：未知、過期或已撤銷的 token 得到 401 {\"ok\":false,\"error\":\"unauthorized\"}；已知但缺少所需 scope 的 token 得到 403 {\"ok\":false,\"error\":\"forbidden\"} 並寫入一筆稽核紀錄，而這一切都發生在處理函式執行之前。",
          es: "El middleware ahora protege las rutas de complementos y toda ruta /api/v1/ no pública: un token desconocido, caducado o revocado recibe 401 {\"ok\":false,\"error\":\"unauthorized\"}, y un token conocido sin el ámbito requerido recibe 403 {\"ok\":false,\"error\":\"forbidden\"} más una fila de auditoría, antes de que se ejecute ningún manejador.",
          pl: "Middleware chroni teraz trasy wtyczek i każdą niepubliczną trasę /api/v1/: nieznany, wygasły lub odwołany token dostaje 401 {\"ok\":false,\"error\":\"unauthorized\"}, a znany token bez wymaganego zakresu — 403 {\"ok\":false,\"error\":\"forbidden\"} plus wpis w audycie, zanim uruchomi się jakikolwiek handler.",
          ja: "ミドルウェアは現在、プラグインのルートと非公開の /api/v1/ ルートをすべて保護します。未知・期限切れ・失効済みのトークンには 401 {\"ok\":false,\"error\":\"unauthorized\"}、必要なスコープを持たない既知のトークンには 403 {\"ok\":false,\"error\":\"forbidden\"} と監査行を返し、ハンドラは一切実行されません。",
          th: "middleware ปกป้องทั้งเส้นทางปลั๊กอินและทุกเส้นทาง /api/v1/ ที่ไม่เปิดสาธารณะ: token ที่ไม่รู้จัก หมดอายุ หรือถูกเพิกถอนได้ 401 {\"ok\":false,\"error\":\"unauthorized\"} ส่วน token ที่รู้จักแต่ขาด scope ที่ต้องใช้ได้ 403 {\"ok\":false,\"error\":\"forbidden\"} พร้อมบันทึกการตรวจสอบ โดยทั้งหมดเกิดก่อน handler จะทำงาน",
          fi: "Middleware suojaa nyt lisäosien reitit ja kaikki ei-julkiset /api/v1/-reitit: tuntematon, vanhentunut tai peruutettu token saa 401 {\"ok\":false,\"error\":\"unauthorized\"}, ja tunnettu token ilman vaadittua scopea saa 403 {\"ok\":false,\"error\":\"forbidden\"} sekä audit-rivin ennen kuin käsittelijä ehtii ajaa.",
          uk: "Мідлвара тепер охороняє маршрути плагінів і всі непублічні маршрути /api/v1/: невідомий, прострочений або відкликаний токен отримує 401 {\"ok\":false,\"error\":\"unauthorized\"}, а відомий токен без потрібної області — 403 {\"ok\":false,\"error\":\"forbidden\"} плюс запис в аудиті, ще до запуску обробника.",
          "bg": "Middleware-ът вече пази пътищата на плъгините и всеки непубличен път под /api/v1/: непознат, изтекъл или отменен токен получава 401 {\"ok\":false,\"error\":\"unauthorized\"}, а познат токен без нужния обхват получава 403 {\"ok\":false,\"error\":\"forbidden\"} и запис в одита, преди който и да е handler да се изпълни.",
          "tr": "Ara katman artık eklenti rotalarını ve /api/v1/ altındaki her genel olmayan rotayı koruyor: bilinmeyen, süresi dolmuş ya da iptal edilmiş token 401 {\"ok\":false,\"error\":\"unauthorized\"}, gereken kapsamı olmayan bilinen bir token ise 403 {\"ok\":false,\"error\":\"forbidden\"} ve bir denetim satırı alır; bunların hepsi bir işleyici çalışmadan önce olur.",
          "hu": "A middleware most a bővítmény-útvonalakat és minden nem nyilvános /api/v1/ útvonalat véd: az ismeretlen, lejárt vagy visszavont token 401 {\"ok\":false,\"error\":\"unauthorized\"}, a ismert, de a szükséges scope-tal nem rendelkező token 403 {\"ok\":false,\"error\":\"forbidden\"} és egy audit-sor választ kap, még mielőtt bármely kezelő lefutna.",
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
          en: "Plugin exemptions are narrow: paths ending /webhook, /verify or /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} for the QR poll. The core adds exactly five token-free routes — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth and POST /api/v1/workflows/trigger — and each authenticates its caller another way.",
          ru: "Исключения для плагинов узкие: пути на /webhook, /verify или /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} для опроса QR. В ядре ровно пять маршрутов без админ-токена — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth и POST /api/v1/workflows/trigger — и каждый удостоверяет вызывающего иначе.",
          de: "Die Plugin-Ausnahmen sind eng: Pfade auf /webhook, /verify oder /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} für den QR-Poll. Der Kern ergänzt genau fünf tokenfreie Routen — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth und POST /api/v1/workflows/trigger — und jede authentifiziert ihren Aufrufer anders.",
          fr: "Les exemptions de plugins restent étroites : chemins finissant par /webhook, /verify ou /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} pour le poll QR. Le cœur ajoute exactement cinq routes sans jeton — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth et POST /api/v1/workflows/trigger — et chacune authentifie son appelant autrement.",
          it: "Le esenzioni dei plugin restano strette: percorsi che finiscono in /webhook, /verify o /callback, più GET /api/v1/plugins/sso/sessions/{session_id} per il poll QR. Il core aggiunge esattamente cinque rotte senza token — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth e POST /api/v1/workflows/trigger — e ognuna autentica il chiamante in un altro modo.",
          nl: "De plugin-uitzonderingen blijven smal: paden eindigend op /webhook, /verify of /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} voor de QR-poll. De kern voegt precies vijf tokenloze routes toe — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth en POST /api/v1/workflows/trigger — en elk authenticeert de aanroeper op een andere manier.",
          cs: "Výjimky pluginů zůstávají úzké: cesty končící /webhook, /verify nebo /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} pro QR dotazování. Jádro přidává přesně pět tras bez tokenu — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth a POST /api/v1/workflows/trigger — a každá ověřuje volajícího jinak.",
          "zh-Hans": "插件豁免仍然很窄：以 /webhook、/verify、/callback 结尾的路径，加上供二维码轮询的 GET /api/v1/plugins/sso/sessions/{session_id}。内核另有恰好五条免令牌路由——GET /healthz、GET /、GET /h5/{article_id}、POST /api/v1/verifyH5Auth 和 POST /api/v1/workflows/trigger——每一条都用别的方式验证调用方。",
          "zh-Hant": "外掛豁免仍然很窄：以 /webhook、/verify、/callback 結尾的路徑，加上供 QR 輪詢的 GET /api/v1/plugins/sso/sessions/{session_id}。核心另有恰好五條免權杖路由——GET /healthz、GET /、GET /h5/{article_id}、POST /api/v1/verifyH5Auth 和 POST /api/v1/workflows/trigger——每一條都用別的方式驗證呼叫端。",
          es: "Las excepciones de complementos siguen siendo estrechas: rutas que acaban en /webhook, /verify o /callback, más GET /api/v1/plugins/sso/sessions/{session_id} para el sondeo QR. El núcleo añade exactamente cinco rutas sin token — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth y POST /api/v1/workflows/trigger — y cada una autentica a su llamador de otra forma.",
          pl: "Wyjątki wtyczek pozostają wąskie: ścieżki kończące się na /webhook, /verify lub /callback, plus GET /api/v1/plugins/sso/sessions/{session_id} dla odpytywania QR. Rdzeń dokłada dokładnie pięć tras bez tokenu — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth i POST /api/v1/workflows/trigger — a każda uwierzytelnia wywołującego inaczej.",
          ja: "プラグイン側の例外は狭いままです。/webhook、/verify、/callback で終わるパスと、QR ポーリング用の GET /api/v1/plugins/sso/sessions/{session_id} だけです。コア側にはトークン不要のルートがちょうど 5 本あります — GET /healthz、GET /、GET /h5/{article_id}、POST /api/v1/verifyH5Auth、POST /api/v1/workflows/trigger — いずれも別の方法で呼び出し元を認証します。",
          th: "ข้อยกเว้นของปลั๊กอินยังแคบ: เส้นทางที่ลงท้าย /webhook, /verify หรือ /callback บวก GET /api/v1/plugins/sso/sessions/{session_id} สำหรับการถามสถานะ QR ส่วนแกนกลางมีเส้นทางที่ไม่ต้องใช้ token ห้าเส้นพอดี — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth และ POST /api/v1/workflows/trigger — และแต่ละเส้นทางยืนยันผู้เรียกด้วยวิธีอื่น",
          fi: "Lisäosien poikkeukset pysyvät kapeina: polut, jotka päättyvät /webhook, /verify tai /callback, sekä GET /api/v1/plugins/sso/sessions/{session_id} QR-kyselyä varten. Ytimessä on täsmälleen viisi tokenitonta reittiä — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth ja POST /api/v1/workflows/trigger — ja jokainen todentaa kutsujansa muulla tavoin.",
          uk: "Винятки для плагінів вузькі: шляхи на /webhook, /verify чи /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} для опитування QR. Ядро додає рівно п'ять маршрутів без токена — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth і POST /api/v1/workflows/trigger — і кожен удостоверює викликача інакше.",
          bg: "Изключенията за плъгини остават тесни: пътища, завършващи на /webhook, /verify или /callback, плюс GET /api/v1/plugins/sso/sessions/{session_id} за допитването на QR. Ядрото добавя точно пет маршрута без токен — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth и POST /api/v1/workflows/trigger — и всеки удостоверява подвикващия по друг начин.",
          tr: "Eklenti muafiyetleri dar kalır: /webhook, /verify veya /callback ile biten yollar ve QR yoklaması için GET /api/v1/plugins/sso/sessions/{session_id}. Çekirdek ise tam olarak beş tokensiz rota ekler — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth ve POST /api/v1/workflows/trigger — ve her biri çağıranı başka bir yolla doğrular.",
          hu: "A bővítmény-kivételek szűkek maradnak: a /webhook, /verify vagy /callback végű útvonalak, valamint a GET /api/v1/plugins/sso/sessions/{session_id} a QR-lekérdezéshez. A mag pontosan öt token nélküli útvonalat ad hozzá — GET /healthz, GET /, GET /h5/{article_id}, POST /api/v1/verifyH5Auth és POST /api/v1/workflows/trigger — és mindegyik másképp hitelesíti a hívót.",
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
        state: "shipped",
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
          en: "shipped: POST /api/v1/admin/tokens mints a pxa_ token, shown in plaintext once and stored only as SHA-256. Scopes follow a closed grammar — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1 to 16 per token, core:admin is not grantable, ro means GET and HEAD only. Expiry runs 1 to 3650 days, revocation is immediate, and the audit keeps the last 5,000 rows.",
          ru: "есть: POST /api/v1/admin/tokens выпускает токен pxa_, который показывается открытым один раз и хранится только как SHA-256. Скоупы подчиняются закрытой грамматике — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — от 1 до 16 на токен, core:admin выдать нельзя, ro означает только GET и HEAD. Срок — от 1 до 3650 дней, отзыв мгновенный, аудит хранит последние 5 000 записей.",
          de: "ausgeliefert: POST /api/v1/admin/tokens prägt ein pxa_-Token, einmal im Klartext gezeigt und nur als SHA-256 gespeichert. Scopes folgen einer geschlossenen Grammatik — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1 bis 16 pro Token, core:admin ist nicht vergebbar, ro heißt nur GET und HEAD. Laufzeit 1 bis 3650 Tage, Widerruf sofort, das Audit behält die letzten 5.000 Zeilen.",
          fr: "livré : POST /api/v1/admin/tokens émet un jeton pxa_, affiché en clair une seule fois et stocké uniquement sous forme de SHA-256. Les portées suivent une grammaire fermée — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — de 1 à 16 par jeton, core:admin n’est pas attribuable, ro signifie GET et HEAD seulement. Expiration de 1 à 3650 jours, révocation immédiate, l’audit conserve les 5 000 dernières lignes.",
          it: "disponibile: POST /api/v1/admin/tokens conia un token pxa_, mostrato in chiaro una sola volta e salvato solo come SHA-256. Gli scope seguono una grammatica chiusa — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — da 1 a 16 per token, core:admin non è assegnabile, ro significa solo GET e HEAD. Scadenza da 1 a 3650 giorni, revoca immediata, l’audit conserva le ultime 5.000 righe.",
          nl: "geleverd: POST /api/v1/admin/tokens slaat een pxa_-token, één keer in platte tekst getoond en alleen als SHA-256 opgeslagen. Scopes volgen een gesloten grammatica — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1 tot 16 per token, core:admin is niet toe te kennen, ro betekent alleen GET en HEAD. Geldigheid 1 tot 3650 dagen, intrekken is onmiddellijk, het auditlog bewaart de laatste 5.000 regels.",
          cs: "dodáno: POST /api/v1/admin/tokens vydá token pxa_, zobrazený jednou v otevřené podobě a uložený pouze jako SHA-256. Scope se řídí uzavřenou gramatikou — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1 až 16 na token, core:admin nelze udělit, ro znamená jen GET a HEAD. Platnost 1 až 3650 dní, odvolání je okamžité, audit uchovává posledních 5 000 řádků.",
          "zh-Hans": "已交付：POST /api/v1/admin/tokens 签发 pxa_ 令牌，明文只展示一次，之后只存 SHA-256。scope 遵循封闭语法——*、core:<resource>:ro|rw、plugin:<id>:ro|rw——每个令牌 1 到 16 个，core:admin 不可授予，ro 仅代表 GET 与 HEAD。有效期 1 到 3650 天，撤销立即生效，审计保留最近 5,000 行。",
          "zh-Hant": "已交付：POST /api/v1/admin/tokens 簽發 pxa_ 權杖，明文只顯示一次，之後只存 SHA-256。scope 遵循封閉語法——*、core:<resource>:ro|rw、plugin:<id>:ro|rw——每枚權杖 1 到 16 個，core:admin 不可授予，ro 僅代表 GET 與 HEAD。有效期 1 到 3650 天，撤銷立即生效，稽核保留最近 5,000 列。",
          es: "incluido: POST /api/v1/admin/tokens acuña un token pxa_, mostrado en claro una sola vez y guardado solo como SHA-256. Los ámbitos siguen una gramática cerrada — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — de 1 a 16 por token, core:admin no es otorgable, ro significa solo GET y HEAD. Caducidad de 1 a 3650 días, revocación inmediata, la auditoría conserva las últimas 5.000 filas.",
          pl: "dostarczone: POST /api/v1/admin/tokens tworzy token pxa_, pokazany jawnie tylko raz i przechowywany wyłącznie jako SHA-256. Zakresy podlegają zamkniętej gramatyce — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — od 1 do 16 na token, core:admin nie jest nadawalny, ro oznacza tylko GET i HEAD. Ważność od 1 do 3650 dni, cofnięcie jest natychmiastowe, audyt przechowuje ostatnie 5000 wierszy.",
          ja: "提供済みです。POST /api/v1/admin/tokens が pxa_ トークンを発行し、平文は一度だけ表示され、保存されるのは SHA-256 のみです。スコープは閉じた文法に従います — *、core:<resource>:ro|rw、plugin:<id>:ro|rw — 1 トークンあたり 1〜16 個、core:admin は付与できず、ro は GET と HEAD のみを意味します。有効期限は 1〜3650 日、失効は即時、監査は直近 5,000 行を保持します。",
          th: "พร้อมใช้: POST /api/v1/admin/tokens ออก token pxa_ โดยแสดงข้อความธรรมดาเพียงครั้งเดียวและเก็บไว้เป็น SHA-256 เท่านั้น scope ใช้ไวยากรณ์แบบปิด — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1 ถึง 16 ต่อ token, core:admin มอบให้ไม่ได้, ro หมายถึง GET และ HEAD เท่านั้น อายุ 1 ถึง 3650 วัน เพิกถอนได้ทันที และ audit เก็บ 5,000 แถวล่าสุด",
          fi: "toimitettu: POST /api/v1/admin/tokens luo pxa_-tokenin, joka näytetään selkokielisenä kerran ja tallennetaan vain SHA-256-tiivisteenä. Scope noudattaa suljettua kielioppia — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — 1–16 tokenia kohden, core:admin ei ole myönnettävissä, ro tarkoittaa vain GET ja HEAD. Voimassaolo 1–3650 päivää, peruutus on välitön, audit säilyttää viimeiset 5 000 riviä.",
          uk: "доставлено: POST /api/v1/admin/tokens випускає токен pxa_, який показується відкритим один раз і зберігається лише як SHA-256. Скоупи підлягають закритій граматиці — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — від 1 до 16 на токен, core:admin не можна надати, ro означає лише GET і HEAD. Термін — від 1 до 3650 днів, відкликання миттєве, аудит зберігає останні 5 000 рядків.",
          bg: "доставено: POST /api/v1/admin/tokens издава токен pxa_, показан в явен вид веднъж и съхраняван само като SHA-256. Обхватите следват затворена граматика — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — от 1 до 16 на токен, core:admin не може да се дава, ro означава само GET и HEAD. Срок 1 до 3650 дни, отмяната е незабавна, одитът пази последните 5000 реда.",
          tr: "hazır: POST /api/v1/admin/tokens bir pxa_ token üretir; düz metin yalnızca bir kez gösterilir ve yalnızca SHA-256 olarak saklanır. Kapsamlar kapalı bir dilbilgisine uyar — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — token başına 1 ile 16 arası, core:admin verilemez, ro yalnızca GET ve HEAD demektir. Geçerlilik 1–3650 gün, iptal anındadır, denetim son 5.000 satırı tutar.",
          hu: "szállítva: a POST /api/v1/admin/tokens pxa_ tokent bocsát ki, amely egyszer jelenik meg nyílt szövegként, és csak SHA-256-ként tárolódik. A scope-ok zárt nyelvtant követnek — *, core:<resource>:ro|rw, plugin:<id>:ro|rw — tokennként 1–16, a core:admin nem adható ki, a ro csak GET és HEAD jelent. Lejárat 1–3650 nap, a visszavonás azonnali, az audit az utolsó 5000 sort őrzi.",
        },
      },
    ],
    keys: ["gateway/app/admin_auth.py", "POST /api/v1/admin/tokens", "pxa_", "X-Popopx-Admin-Token", "POPOPX_ADMIN_TOKEN", "gateway/app/main.py"],
  },
  {
    id: "webhook",
    code: "Webhook intake",
    accent: "mesh",
    glyph: ["M4 12h9", "M10 8l4 4-4 4", "M18 5v14"],
    name: {
      en: "Webhook intake: a shared token first, then a timestamped HMAC once the secret is set",
      ru: "Приём вебхуков: сначала общий токен, затем HMAC с меткой времени, если задан секрет",
      de: "Webhook-Eingang: zuerst ein geteiltes Token, dann ein HMAC mit Zeitstempel, sobald das Secret gesetzt ist",
      fr: "Réception webhook : d’abord un jeton partagé, puis un HMAC horodaté dès que le secret est défini",
      it: "Ingresso webhook: prima un token condiviso, poi un HMAC con timestamp quando il segreto è impostato",
      nl: "Webhook-ingang: eerst een gedeeld token, dan een HMAC met tijdstempel zodra het geheim is gezet",
      cs: "Příjem webhooku: nejprve sdílený token, poté HMAC s časovým údajem, jakmile je nastaveno tajemství",
      "zh-Hans": "webhook 入口：先验证共享令牌；一旦设置密钥，再强制加带时间戳的 HMAC",
      "zh-Hant": "webhook 入口：先驗共享權杖；一旦設定密鑰，再強制加帶時間戳的 HMAC",
      es: "Entrada de webhook: primero un token compartido y, en cuanto hay secreto, un HMAC con marca de tiempo",
      pl: "Wejście webhook: najpierw współdzielony token, a gdy ustawiony jest sekret — HMAC ze znacznikiem czasu",
      ja: "Webhook 受け口 — まず共有トークン、シークレットを設定すればタイムスタンプ付き HMAC を必須に",
      th: "ช่องทางรับ webhook: ตรวจ token ร่วมก่อน แล้วบังคับ HMAC พร้อมเวลาเมื่อตั้ง secret ไว้",
      fi: "Webhook-sisäänmeno: ensin jaettu token, sitten aikaleimattu HMAC, kun salaisuus on asetettu",
      uk: "Прийом вебхуків: спершу спільний токен, далі HMAC з позначкою часу, щойно задано секрет",
      bg: "Вход за уебхуки: първо споделен токен, после HMAC с времеви печат, щом е зададена тайна",
      tr: "Webhook girişi: önce paylaşılan token, secret ayarlıysa ardından zaman damgalı HMAC",
      hu: "Webhook-bemenet: először közös token, majd – ha a titok be van állítva – időbélyeges HMAC",
    },
    hook: {
      en: "The shared token is checked first and always; it must still be present even when signing. If POPOPX_ALERT_WEBHOOK_SECRET is set, a valid token is only the first gate: the request then needs X-Popopx-Timestamp and X-Popopx-Signature. With the secret unset, token-only deliveries are still accepted.",
      ru: "Общий токен проверяется первым и всегда — он нужен даже при подписи. Если задан POPOPX_ALERT_WEBHOOK_SECRET, валидный токен — лишь первая дверь: запросу нужны X-Popopx-Timestamp и X-Popopx-Signature. Если секрет не задан, доставка только с токеном всё ещё принимается.",
      de: "Das geteilte Token wird zuerst und immer geprüft; es muss auch beim Signieren vorhanden sein. Ist POPOPX_ALERT_WEBHOOK_SECRET gesetzt, ist ein gültiges Token nur die erste Pforte: die Anfrage braucht dann X-Popopx-Timestamp und X-Popopx-Signature. Ohne Secret werden Token-only-Zustellungen weiterhin angenommen.",
      fr: "Le jeton partagé est vérifié d’abord et toujours ; il doit rester présent même avec signature. Si POPOPX_ALERT_WEBHOOK_SECRET est défini, un jeton valide n’est que la première porte : la requête exige alors X-Popopx-Timestamp et X-Popopx-Signature. Sans secret, une livraison avec jeton seul reste acceptée.",
      it: "Il token condiviso è controllato per primo e sempre; deve esserci anche quando si firma. Se POPOPX_ALERT_WEBHOOK_SECRET è impostato, un token valido è solo la prima porta: la richiesta richiede allora X-Popopx-Timestamp e X-Popopx-Signature. Senza segreto, le consegne con solo token restano accettate.",
      nl: "Het gedeelde token wordt altijd eerst gecontroleerd; het moet ook aanwezig zijn bij ondertekening. Is POPOPX_ALERT_WEBHOOK_SECRET gezet, dan is een geldig token slechts de eerste poort: het verzoek heeft dan X-Popopx-Timestamp en X-Popopx-Signature nodig. Zonder geheim blijven leveringen met alleen een token geaccepteerd.",
      cs: "Sdílený token se kontroluje vždy první; musí být přítomen i při podpisu. Je-li POPOPX_ALERT_WEBHOOK_SECRET nastaveno, platný token je jen první branou: požadavek pak potřebuje X-Popopx-Timestamp a X-Popopx-Signature. Bez tajemství se doručení jen s tokenem stále přijímá.",
      "zh-Hans": "共享令牌永远最先检查，即使签名也必须带上。一旦设置了 POPOPX_ALERT_WEBHOOK_SECRET，有效令牌只是第一道门：请求还需要 X-Popopx-Timestamp 和 X-Popopx-Signature。密钥未设置时，只带令牌的投递仍然接受。",
      "zh-Hant": "共用權杖永遠最先檢查，即使簽名也必須帶上。一旦設定了 POPOPX_ALERT_WEBHOOK_SECRET，有效權杖只是第一道門：請求還需要 X-Popopx-Timestamp 和 X-Popopx-Signature。密鑰未設定時，只帶權杖的投遞仍然接受。",
      es: "El token compartido se comprueba primero y siempre; debe seguir presente incluso al firmar. Si POPOPX_ALERT_WEBHOOK_SECRET está configurado, un token válido es solo la primera puerta: la petición necesita entonces X-Popopx-Timestamp y X-Popopx-Signature. Sin secreto, las entregas con solo token siguen aceptándose.",
      pl: "Współdzielony token jest sprawdzany zawsze pierwszy; musi być obecny nawet przy podpisywaniu. Gdy POPOPX_ALERT_WEBHOOK_SECRET jest ustawiony, ważny token to tylko pierwsza brama: żądanie wymaga wtedy X-Popopx-Timestamp i X-Popopx-Signature. Bez sekretu dostawy z samym tokenem są nadal przyjmowane.",
      ja: "共有トークンは常に最初に検査され、署名する場合でも必ず必要です。POPOPX_ALERT_WEBHOOK_SECRET が設定されている場合、有効なトークンは最初の関門にすぎず、X-Popopx-Timestamp と X-Popopx-Signature も要求されます。シークレットが未設定なら、トークンだけの配信は従来どおり受け付けます。",
      th: "token ร่วมถูกตรวจเป็นอย่างแรกเสมอ และต้องมีแม้ในขณะเซ็นชื่อ ถ้าตั้ง POPOPX_ALERT_WEBHOOK_SECRET ไว้ token ที่ถูกต้องเป็นเพียงด่านแรก คำขอจะต้องมี X-Popopx-Timestamp และ X-Popopx-Signature ด้วย ถ้าไม่ได้ตั้ง secret การส่งด้วย token อย่างเดียวยังคงรับได้",
      fi: "Jaettu token tarkistetaan aina ensin, ja se tarvitaan myös allekirjoitettaessa. Jos POPOPX_ALERT_WEBHOOK_SECRET on asetettu, kelvollinen token on vasta ensimmäinen portti: pyyntö tarvitsee silloin X-Popopx-Timestamp- ja X-Popopx-Signature-otsikot. Ilman salaisuutta pelkällä tokenilla tehdyt toimitukset hyväksytään edelleen.",
      uk: "Спільний токен перевіряється першим і завжди; він потрібен навіть під час підпису. Якщо задано POPOPX_ALERT_WEBHOOK_SECRET, валідний токен — лише перша брама: запиту потрібні X-Popopx-Timestamp і X-Popopx-Signature. Коли секрет не задано, доставку лише з токеном досі приймають.",
      bg: "Споделеният токен се проверява винаги пръв; той трябва да присъства и при подписване. Ако POPOPX_ALERT_WEBHOOK_SECRET е зададена, валидният токен е само първата врата: заявката изисква още X-Popopx-Timestamp и X-Popopx-Signature. Без тайна доставките само с токен продължават да се приемат.",
      tr: "Paylaşılan token her zaman önce denetlenir; imzalarken bile bulunmak zorundadır. POPOPX_ALERT_WEBHOOK_SECRET ayarlıysa geçerli bir token yalnızca ilk kapıdır: istek ayrıca X-Popopx-Timestamp ve X-Popopx-Signature taşımalıdır. Secret ayarlı değilse yalnızca token’lı teslimler hâlâ kabul edilir.",
      hu: "A közös tokent mindig először ellenőrizzük, és aláíráskor is jelen kell lennie. Ha a POPOPX_ALERT_WEBHOOK_SECRET be van állítva, az érvényes token csak az első kapu: a kérésnek ilyenkor X-Popopx-Timestamp és X-Popopx-Signature fejlécet is kell hoznia. Ha a titok nincs beállítva, a csak tokennel érkező átvitel továbbra is elfogadott.",
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
          en: "Either X-Popopx-Alert-Token or Authorization: Bearer, matched against POPOPX_ALERT_WEBHOOK_TOKEN in constant time. This check comes first and cannot be skipped: when POPOPX_ALERT_WEBHOOK_SECRET is also set, the token only unlocks the second gate.",
          ru: "Либо X-Popopx-Alert-Token, либо Authorization: Bearer; значение сравнивается с POPOPX_ALERT_WEBHOOK_TOKEN за постоянное время. Эта проверка идёт первой и её нельзя пропустить: если ещё задан POPOPX_ALERT_WEBHOOK_SECRET, токен лишь открывает вторую дверь.",
          de: "Entweder X-Popopx-Alert-Token oder Authorization: Bearer, verglichen mit konstanter Laufzeit gegen POPOPX_ALERT_WEBHOOK_TOKEN. Diese Prüfung kommt zuerst und lässt sich nicht überspringen: ist zusätzlich POPOPX_ALERT_WEBHOOK_SECRET gesetzt, öffnet das Token nur die zweite Pforte.",
          fr: "Soit X-Popopx-Alert-Token, soit Authorization: Bearer, comparé à temps constant à POPOPX_ALERT_WEBHOOK_TOKEN. Ce contrôle vient en premier et ne se saute pas : si POPOPX_ALERT_WEBHOOK_SECRET est aussi défini, le jeton ne fait qu’ouvrir la seconde porte.",
          it: "O X-Popopx-Alert-Token o Authorization: Bearer, confrontato a tempo costante con POPOPX_ALERT_WEBHOOK_TOKEN. Questo controllo viene per primo e non si può saltare: se è impostato anche POPOPX_ALERT_WEBHOOK_SECRET, il token apre solo la seconda porta.",
          nl: "Ofwel X-Popopx-Alert-Token, ofwel Authorization: Bearer, vergeleken met constante looptijd tegen POPOPX_ALERT_WEBHOOK_TOKEN. Deze controle komt eerst en is niet over te slaan: staat ook POPOPX_ALERT_WEBHOOK_SECRET gezet, dan opent het token slechts de tweede poort.",
          cs: "Buď X-Popopx-Alert-Token, nebo Authorization: Bearer, porovnáno ve stálém čase s POPOPX_ALERT_WEBHOOK_TOKEN. Tato kontrola přichází první a nelze ji přeskočit: je-li nastaveno i POPOPX_ALERT_WEBHOOK_SECRET, token otevírá jen druhou bránu.",
          "zh-Hans": "X-Popopx-Alert-Token 或 Authorization: Bearer 二选一，与 POPOPX_ALERT_WEBHOOK_TOKEN 做常数时间比对。这道检查永远排在最前，无法跳过：如果同时设置了 POPOPX_ALERT_WEBHOOK_SECRET，令牌只是打开第二道门。",
          "zh-Hant": "X-Popopx-Alert-Token 或 Authorization: Bearer 二選一，與 POPOPX_ALERT_WEBHOOK_TOKEN 做常數時間比對。這道檢查永遠排在最前，無法跳過：如果同時設定了 POPOPX_ALERT_WEBHOOK_SECRET，權杖只是打開第二道門。",
          es: "O bien X-Popopx-Alert-Token o Authorization: Bearer, comparado en tiempo constante contra POPOPX_ALERT_WEBHOOK_TOKEN. Esta comprobación va primero y no se puede saltar: si también está configurado POPOPX_ALERT_WEBHOOK_SECRET, el token solo abre la segunda puerta.",
          pl: "Albo X-Popopx-Alert-Token, albo Authorization: Bearer, porównane w stałym czasie z POPOPX_ALERT_WEBHOOK_TOKEN. Ten test idzie pierwszy i nie da się go pominąć: jeśli ustawiono też POPOPX_ALERT_WEBHOOK_SECRET, token otwiera tylko drugą bramę.",
          ja: "X-Popopx-Alert-Token か Authorization: Bearer のどちらかを、POPOPX_ALERT_WEBHOOK_TOKEN と定数時間で照合します。この検査は常に最初で、飛ばせません。POPOPX_ALERT_WEBHOOK_SECRET も設定されていれば、トークンは二番目の関門を開くだけです。",
          th: "ใส่ X-Popopx-Alert-Token หรือ Authorization: Bearer ก็ได้ แล้วเทียบกับ POPOPX_ALERT_WEBHOOK_TOKEN แบบคงเวลา การตรวจนี้มาก่อนเสมอและข้ามไม่ได้ ถ้าตั้ง POPOPX_ALERT_WEBHOOK_SECRET ไว้ด้วย token เป็นเพียงกุญแจด่านที่สอง",
          fi: "Joko X-Popopx-Alert-Token tai Authorization: Bearer, verrataan vakioajassa POPOPX_ALERT_WEBHOOK_TOKENiin. Tämä tarkistus tulee aina ensin eikä sitä voi ohittaa: jos myös POPOPX_ALERT_WEBHOOK_SECRET on asetettu, token avaa vain toisen portin.",
          uk: "Або X-Popopx-Alert-Token, або Authorization: Bearer; значення порівнюється за сталий час з POPOPX_ALERT_WEBHOOK_TOKEN. Ця перевірка завжди перша і її не можна оминути: якщо також задано POPOPX_ALERT_WEBHOOK_SECRET, токен лише відчиняє другу браму.",
          bg: "Или X-Popopx-Alert-Token, или Authorization: Bearer, сравнено с постоянно време срещу POPOPX_ALERT_WEBHOOK_TOKEN. Тази проверка винаги е първа и не може да се прескочи: ако е зададена и POPOPX_ALERT_WEBHOOK_SECRET, токенът отваря само втората врата.",
          tr: "Ya X-Popopx-Alert-Token ya da Authorization: Bearer; değer POPOPX_ALERT_WEBHOOK_TOKEN ile sabit zamanda karşılaştırılır. Bu denetim her zaman ilk sıradadır ve atlanamaz: POPOPX_ALERT_WEBHOOK_SECRET de ayarlıysa token yalnızca ikinci kapıyı açar.",
          hu: "Vagy X-Popopx-Alert-Token, vagy Authorization: Bearer, állandó idejű összevetéssel a POPOPX_ALERT_WEBHOOK_TOKEN-nal. Ez az ellenőrzés mindig első, és nem hagyható ki: ha a POPOPX_ALERT_WEBHOOK_SECRET is be van állítva, a token csak a második kaput nyitja.",
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
        state: "shipped",
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
          en: "shipped: once POPOPX_ALERT_WEBHOOK_SECRET is set, passing the token is not enough. X-Popopx-Timestamp carries unix seconds and X-Popopx-Signature carries v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; then a ±300 s window and a constant-time compare run, and a 2,048-entry replay cache rejects a second delivery of the same signed request. The cache is process-local, so it is not shared across workers.",
          ru: "есть: как только задан POPOPX_ALERT_WEBHOOK_SECRET, одного токена мало. X-Popopx-Timestamp несёт unix-секунды, а X-Popopx-Signature — v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; дальше идут окно ±300 с и сравнение за постоянное время, затем кэш повторов на 2 048 записей отклоняет повторную доставку того же подписанного запроса. Кэш живёт в процессе, между воркерами он не делится.",
          de: "ausgeliefert: Sobald POPOPX_ALERT_WEBHOOK_SECRET gesetzt ist, genügt das Token nicht mehr. X-Popopx-Timestamp trägt Unix-Sekunden, X-Popopx-Signature trägt v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; dann folgen ein Fenster von ±300 s und ein Vergleich mit konstanter Laufzeit, danach weist ein Replay-Cache mit 2.048 Einträgen eine zweite Zustellung derselben signierten Anfrage ab. Der Cache lebt im Prozess und wird nicht zwischen Workern geteilt.",
          fr: "livré : dès que POPOPX_ALERT_WEBHOOK_SECRET est défini, le jeton ne suffit plus. X-Popopx-Timestamp porte des secondes Unix et X-Popopx-Signature porte v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")> ; suivent une fenêtre de ±300 s et une comparaison à temps constant, puis un cache anti-rejeu de 2 048 entrées refuse une seconde livraison de la même requête signée. Le cache vit dans le processus, il n’est pas partagé entre workers.",
          it: "disponibile: appena POPOPX_ALERT_WEBHOOK_SECRET è impostato, il token non basta più. X-Popopx-Timestamp porta secondi Unix e X-Popopx-Signature porta v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; seguono una finestra di ±300 s e un confronto a tempo costante, poi una cache anti-replay da 2.048 voci rifiuta una seconda consegna della stessa richiesta firmata. La cache è nel processo, non è condivisa tra i worker.",
          nl: "geleverd: zodra POPOPX_ALERT_WEBHOOK_SECRET gezet is, volstaat het token niet meer. X-Popopx-Timestamp draagt unix-seconden en X-Popopx-Signature draagt v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; dan volgen een venster van ±300 s en een vergelijking met constante looptijd, waarna een replay-cache van 2.048 items een tweede levering van hetzelfde ondertekende verzoek weigert. De cache leeft in het proces en wordt niet tussen workers gedeeld.",
          cs: "dodáno: jakmile je POPOPX_ALERT_WEBHOOK_SECRET nastaveno, token už nestačí. X-Popopx-Timestamp nese unixové sekundy a X-Popopx-Signature nese v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; následuje okno ±300 s a porovnání ve stálém čase, poté cache proti opakování s 2 048 položkami odmítne druhé doručení téhož podepsaného požadavku. Cache žije v procesu, mezi workery se nesdílí.",
          "zh-Hans": "已交付：一旦设置 POPOPX_ALERT_WEBHOOK_SECRET，只有令牌就不够了。X-Popopx-Timestamp 携带 unix 秒，X-Popopx-Signature 携带 v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>；随后是 ±300 秒的时间窗和常数时间比对，再由 2,048 条目的重放缓存拒绝同一签名请求的第二次投递。该缓存只在进程内，不跨 worker 共享。",
          "zh-Hant": "已交付：一旦設定 POPOPX_ALERT_WEBHOOK_SECRET，只有權杖就不夠了。X-Popopx-Timestamp 攜帶 unix 秒，X-Popopx-Signature 攜帶 v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>；接著是 ±300 秒的時間窗與常數時間比對，再由 2,048 筆的重放快取拒絕同一簽名請求的第二次投遞。該快取只在行程內，不跨 worker 共享。",
          es: "incluido: en cuanto POPOPX_ALERT_WEBHOOK_SECRET está configurado, el token ya no basta. X-Popopx-Timestamp lleva segundos unix y X-Popopx-Signature lleva v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; después vienen una ventana de ±300 s y una comparación en tiempo constante, y luego una caché anti-repetición de 2.048 entradas rechaza una segunda entrega de la misma petición firmada. La caché vive en el proceso y no se comparte entre workers.",
          pl: "dostarczone: gdy tylko POPOPX_ALERT_WEBHOOK_SECRET jest ustawiony, sam token nie wystarcza. X-Popopx-Timestamp niesie sekundy unixowe, a X-Popopx-Signature niesie v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; potem następuje okno ±300 s i porównanie w stałym czasie, a następnie cache przeciw powtórzeniom na 2048 wpisów odrzuca drugie dostarczenie tego samego podpisanego żądania. Cache żyje w procesie i nie jest współdzielony między workerami.",
          ja: "提供済みです。POPOPX_ALERT_WEBHOOK_SECRET が設定された時点で、トークンだけでは足りません。X-Popopx-Timestamp が unix 秒を、X-Popopx-Signature が v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")> を運び、続いて ±300 秒の窓と定数時間の比較、さらに 2,048 件のリプレイキャッシュが同じ署名済みリクエストの二度目の配信を拒否します。キャッシュはプロセス内にあり、ワーカー間で共有されません。",
          th: "พร้อมใช้: เมื่อตั้ง POPOPX_ALERT_WEBHOOK_SECRET แล้ว token อย่างเดียวไม่พอ X-Popopx-Timestamp พาเวลายูนิกซ์วินาที และ X-Popopx-Signature พา v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")> ตามด้วยหน้าต่าง ±300 วินาทีและการเทียบแบบคงเวลา แล้วแคชกันส่งซ้ำขนาด 2,048 รายการจะปฏิเสธการส่งซ้ำของคำขอที่เซ็นแล้วเดียวกัน แคชนี้อยู่ในโปรเซส ไม่ได้แชร์ข้าม worker",
          fi: "toimitettu: kun POPOPX_ALERT_WEBHOOK_SECRET on asetettu, pelkkä token ei enää riitä. X-Popopx-Timestamp kuljettaa unix-sekunteja ja X-Popopx-Signature kuljettaa v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; sitten seuraa ±300 s ikkuna ja vakioaikainen vertailu, ja lopuksi 2 048 merkinnän toistovälimuisti hylkää saman allekirjoitetun pyynnön toisen toimituksen. Välimuisti on prosessikohtainen, ei jaettu workerien kesken.",
          uk: "доставлено: щойно задано POPOPX_ALERT_WEBHOOK_SECRET, самого токена вже мало. X-Popopx-Timestamp несе unix-секунди, а X-Popopx-Signature — v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; далі йдуть вікно ±300 с і порівняння за сталий час, а потім кеш повторів на 2 048 записів відхиляє другу доставку того самого підписаного запиту. Кеш живе в процесі й не ділиться між воркерами.",
          bg: "доставено: щом е зададена POPOPX_ALERT_WEBHOOK_SECRET, само токен вече не стига. X-Popopx-Timestamp носи unix секунди, а X-Popopx-Signature носи v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")>; следват прозорец от ±300 s и сравнение с постоянно време, после кеш срещу повторение с 2048 записа отхвърля второ доставяне на същата подписана заявка. Кешът живее в процеса и не се споделя между worker-и.",
          tr: "hazır: POPOPX_ALERT_WEBHOOK_SECRET ayarlandığı anda token yeterli olmaz. X-Popopx-Timestamp unix saniyesini, X-Popopx-Signature ise v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")> değerini taşır; ardından ±300 s’lik bir pencere ve sabit zamanlı karşılaştırma, sonra 2.048 girişlik yeniden oynatma önbelleği aynı imzalı isteğin ikinci teslimini reddeder. Önbellek süreç içindedir, worker’lar arasında paylaşılmaz.",
          hu: "szállítva: amint a POPOPX_ALERT_WEBHOOK_SECRET be van állítva, a token már nem elég. A X-Popopx-Timestamp unix másodperceket, a X-Popopx-Signature pedig v1=<hex HMAC-SHA256(secret, \"<timestamp>.<raw body>\")> értéket hordoz; ezt ±300 s-es ablak és állandó idejű összehasonlítás követi, majd egy 2048 bejegyzéses replay-gyorsítótár utasítja el ugyanazon aláírt kérés második átvitelét. A gyorsítótár a folyamaton belül él, workerek között nem oszlik meg.",
        },
      },
    ],
    keys: ["X-Popopx-Alert-Token", "POPOPX_ALERT_WEBHOOK_TOKEN", "POPOPX_ALERT_WEBHOOK_SECRET", "X-Popopx-Timestamp", "X-Popopx-Signature", "gateway/app/plugins/alert_ops_plugin.py", "POPOPX_ALERT_MIN_SEVERITY", "POPOPX_CP_PER_ALERT"],
  },
];

function PanelCard({ panel }: { readonly panel: Panel }): ReactElement {
  const { locale } = useLocale();
  const name = useCopy(panel.name);
  const hook = useCopy(panel.hook);
  const statePlanned = useCopy(STATE_PLANNED);
  const keysLabel = useCopy(KEYS_LABEL);

  return (
    <article className={`glass glass-hover relative flex flex-col overflow-hidden p-5 sm:p-6 [overflow-wrap:anywhere] ${panel.wide ? "lg:col-span-2" : ""}`}>
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
            <StatusDot tone="mesh" />
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
