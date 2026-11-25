"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { CodeBlock, CopyButton, SectionHeading, StatusDot } from "@/components/ui";
import { REPO_URL } from "@/lib/site";

/**
 * 开放协议与目录 — section `directory`.
 *
 * Three jobs, all of them honest about what they are:
 *
 *  1. A QR wall. Every code is drawn on the visitor's own machine by
 *     `qrcode.react` as SVG (`QRCodeSVG`), so nothing is fetched from a QR
 *     service and no `<img>` leaves this origin. The encoded strings are the
 *     deep-link *forms* the shipped client parses, confirmed in source:
 *       `popopx://service?uri=popopx%3A%2FQ7dnHsF8Kz&ref=welcome-2026`       PopopxEcoRouterAndDeepLink.swift
 *       `popopx://sso?uri=popopx%3A%2FQ7dnHsF8Kz&session=a1b2c3d4e5f60718`   same file, + privacy_sso_plugin.py `build_qr_payload`
 *       `popopx://channel/<relay>/<id>#key=&pub=`  crypto_service.py `build_channel_public_uri`
 *       `popopx://channel?p=&t=&e=&s=`          PopopxBadgeCreditsModels.swift `wireString`
 *       `?popopx_uid=&ts=&sig=`                 crypto_service.py `sign_h5_url`
 *     filled with placeholder values and labelled as demo data in every one of
 *     the 18 languages (`SAMPLE_CHIP`), because
 *     none of them resolves to a live service account, channel or merchant page.
 *  2. A directory-entry generator. There is no directory schema in
 *     `popopx-service-suite`, `popopx-chat` or `popopx.chat-site` (all searched), and the
 *     gateway exposes no submission route — `PUBLIC_ROUTE_KEYS` in `gateway/app/main.py`
 *     lists exactly four token-free endpoints and none takes an entry. So the format here is
 *     *this page's proposal*, and the submission path it prints is a pull request.
 *  3. A protocol cheatsheet: the rotation envelope, the `::POPOPX_ECO::` frame family and
 *     `POST /api/v1/verifyH5Auth`, each with the exact rule it encodes.
 */

/* ─────────────────────────────────────────────────────────────────────────
 * 0. Copy maps
 *
 * `src/lib/i18n.tsx` types `Localized<T>` as a **total** map over the 18
 * language tags the POPOPX iOS client declares in `CFBundleLocalizations`
 * (`apps/ios/POPOPX--iOS--Info.plist`), and that is exactly what the `ui.tsx`
 * primitives ask for. So every string in this section is authored as a literal
 * 18-key map: no fallback helper, no partial object, no spread. A locale that
 * is missing here does not compile, which is the point — this section states
 * byte lengths, enum members and hard limits, and a language that quietly fell
 * back to English would ship a wrong limit to the people who need it most.
 *
 * Call sites bind a map with `useCopy(...)` at the top of a component, or with
 * `pick(...)` inside a `.map` callback where a hook would be illegal. Wire keys,
 * frames, URIs, routes and commands are technical and stay byte-identical in
 * plain `const` strings.
 * ───────────────────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────────────────
 * 1. Copy
 * ───────────────────────────────────────────────────────────────────────── */

const HEYEBROW: Localized<string> = {
  en: "Open protocol & directory",
  ru: "Открытый протокол и каталог",
  de: "Offenes Protokoll & Verzeichnis",
  fr: "Protocole ouvert et annuaire",
  it: "Protocollo aperto e directory",
  nl: "Open protocol en map",
  cs: "Otevřený protokol a adresář",
  "zh-Hans": "开放协议与目录",
  "zh-Hant": "開放協議與目錄",
  es: "Protocolo abierto y directorio",
  pl: "Otwarty protokół i katalog",
  ja: "オープンプロトコルとディレクトリ",
  th: "โปรโตคอลเปิดและไดเรกทอรี",
  fi: "Avoin protokolla ja hakemisto",
  uk: "Відкритий протокол і каталог",
  bg: "Отворен протокол и указател",
  tr: "Açık protokol ve dizin",
  hu: "Nyílt protokoll és könyvtár",
};

const HEADLINE: Localized<string> = {
  en: "QR wall · directory format · protocol cheatsheet",
  ru: "Стена QR-кодов · формат каталога · шпаргалка по протоколу",
  de: "QR-Wand · Verzeichnisformat · Protokoll-Spickzettel",
  fr: "Mur de QR codes · format d’annuaire · aide-mémoire du protocole",
  it: "Muro di codici QR · formato della directory · promemoria del protocollo",
  nl: "QR-muur · mapformaat · protocolspiekbriefje",
  cs: "Zeď QR kódů · formát adresáře · tahák protokolem",
  "zh-Hans": "二维码展示墙 · 目录格式 · 协议速查",
  "zh-Hant": "QR Code 展示牆 · 目錄格式 · 協議速查",
  es: "Muro de códigos QR · formato de directorio · chuleta del protocolo",
  pl: "Ściana kodów QR · format katalogu · ściągawka z protokołu",
  ja: "QRコードウォール · ディレクトリ形式 · プロトコルチートシート",
  th: "ผนังรหัส QR · รูปแบบไดเรกทอรี · สรุปโปรโตคอล",
  fi: "QR-seinä · hakemiston muoto · protokollan muistilista",
  uk: "Стіна QR-кодів · формат каталогу · шпаргалка протоколом",
  bg: "Стена с QR кодове · формат на указателя · упътване за протокола",
  tr: "QR duvarı · dizin biçimi · protokol kopya kâğıdı",
  hu: "QR-fal · könyvtári formátum · protokoll-csal",
};

const SUBHEAD: Localized<string> = {
  en: "Every code below is rendered as local SVG at paint time — no online QR service, no off-origin image. It still scans with the network unplugged.",
  ru: "Каждый код ниже рисуется на вашем устройстве как SVG в момент отрисовки — без онлайн-сервиса QR-кодов и без картинок с чужих доменов. Он считывается и без сети.",
  de: "Jeder Code unten wird beim Malen lokal als SVG gezeichnet – kein Online-QR-Dienst, kein Bild einer fremden Origin. Er scannt auch ohne Netzwerkverbindung.",
  fr: "Chaque code ci-dessous est dessiné localement en SVG au moment du rendu — aucun service de QR en ligne, aucune image hors origine. Il se scanne même réseau débranché.",
  it: "Ogni codice qui sotto è disegnato localmente in SVG al momento del rendering: nessun servizio QR online, nessuna immagine esterna. Si scansiona anche senza rete.",
  nl: "Elke code hieronder wordt bij het schilderen lokaal als SVG getekend — geen online QR-dienst, geen afbeelding van een andere origin. Hij scant ook zonder netwerk.",
  cs: "Každý kód níže se při kreslení vykreslí lokálně jako SVG — žádná online služba QR kódů, žádný obrázek z cizí domény. Zůstane čitelný i bez sítě.",
  "zh-Hans": "每一张二维码都在这里实时绘制成本机 SVG，不请求在线二维码服务，也不加载外链图片；断网照样能扫。",
  "zh-Hant": "每一張 QR Code 都在這裡即時轉譯為本機 SVG，不請求線上 QR Code 服務，也不載入外部連結圖片；離線照樣能掃。",
  es: "Cada código de abajo se dibuja localmente como SVG en el momento de pintar: sin servicios de QR en línea y sin imágenes de otros orígenes. Escanea igual con la red desconectada.",
  pl: "Każdy poniższy kod jest rysowany lokalnie jako SVG w chwili malowania — bez internetowych serwisów QR i bez obrazów z innych domen. Działa też bez sieci.",
  ja: "以下のすべてのコードは描画時にローカルで SVG として生成されます。オンラインの QR サービスも外部ドメインの画像も使いません。ネットワークを外してもスキャンできます。",
  th: "รหัสทุกด้านล่างถูกวาดเป็น SVG ในเครื่องตอนวาดภาพ ไม่ใช้บริการ QR ออนไลน์และไม่เรียกภาพจากโดเมนอื่น สแกนได้แม้ตัดเครือข่าย",
  fi: "Jokainen alla oleva koodi piirretään paikallisesti SVG:nä piirtohetkellä — ei online-palvelua, ei toiselta palveluntarjoajaa tulevaa kuvaa. Se skannaa verkottommankin.",
  uk: "Кожен код нижче малюється на вашому пристрої як SVG під час відмальовування — без онлайн-сервісу QR-кодів і без зображень з чужих доменів. Він сканується й без мережі.",
  bg: "Всеки долен код се изрисува локално като SVG в момента на изчертаване — без онлайн QR услуга и без изображение от друг произход. Сканира се и без мрежа.",
  tr: "Aşağıdaki her kod, boyama anında cihazda yerel SVG olarak çizilir — çevrimiçi QR servisi yok, başka kaynaktan görsel yok. Ağ kapalıyken de taranır.",
  hu: "Az alábbi kódok mindegyike rajzoláskor helyileg SVG-ként jön létre — nincs online QR-szolgáltatás, nincs idegen tartományról betöltött kép. Hálózat nélkül is beolvasható.",
};

const NOTICE: Localized<string> = {
  en: "Sample / placeholder demo data: the codes, frames and JSON below demonstrate format and field names only. None of them points at a live service account, channel or merchant page, and none of them is a listing.",
  ru: "Демо-данные-заглушки: коды, фреймы и JSON ниже показывают только формат и имена полей. Ни один из них не указывает на реальный сервисный аккаунт, канал или страницу продавца и не является публикацией в каталоге.",
  de: "Beispiel- / Platzhalterdaten: Die Codes, Frames und das JSON unten zeigen nur Format und Feldnamen. Keiner davon zeigt auf ein echtes Service-Konto, einen echten Kanal oder eine Händlerseite, und keiner ist ein Verzeichniseintrag.",
  fr: "Données de démonstration fictives : les codes, trames et le JSON ci-dessous ne montrent que le format et les noms de champs. Aucun ne pointe vers un compte de service, un canal ou une page marchand réel, et aucun n’est une fiche d’annuaire.",
  it: "Dati dimostrativi segnaposto: codici, frame e JSON qui sotto mostrano solo formato e nomi dei campi. Nessuno punta a un account servizio, a un canale o a una pagina venditore reale, e nessuno è una scheda di directory.",
  nl: "Voorbeeld- / plaathoudergegevens: de codes, frames en JSON hieronder tonen alleen formaat en veldnamen. Geen enkele wijst naar een echt serviceaccount, kanaal of verkoperspagina, en geen enkele is een mapvermelding.",
  cs: "Ukázková / Platzholderská data: kódy, snímky a JSON níže ukazují pouze formát a názvy polí. Žádný neodkazuje na skutečný servisní účet, kanál nebo stránku obchodu a žádný není zápisem v adresáři.",
  "zh-Hans": "示例 / 占位演示数据：下面的二维码、帧与 JSON 只演示格式与字段名，不指向任何正在运行的服务号、频道或商家页面，也不构成任何收录承诺。",
  "zh-Hant": "範例 / 佔位示範資料：下面的 QR Code、訊框與 JSON 只演示格式與欄位名稱，不指向任何正在運作的服務帳號、頻道或商家頁面，也不構成任何收錄承諾。",
  es: "Datos de muestra y marcador de posición: los códigos, tramas y el JSON de abajo solo demuestran formato y nombres de campo. Ninguno apunta a una cuenta de servicio, canal o página de comercio real, y ninguno es una ficha del directorio.",
  pl: "Dane przykładowe i zastępcze: poniższe kody, ramki i JSON pokazują wyłącznie format i nazwy pól. Nic nie wskazuje na prawdziwe konto serwisowe, kanał ani stronę sprzedawcy i nic nie jest wpisem w katalogu.",
  ja: "サンプル / 仮のデモデータです。以下のコード、フレーム、JSON は形式とフィールド名を示すだけのもので、実在のサービスアカウント、チャンネル、加盟店ページを指すものではなく、掲載実績でもありません。",
  th: "ข้อมูลตัวอย่าง / ข้อมูลชั่วคราว: รหัส เฟรม และ JSON ด้านล่างสาธิตเพียงรูปแบบและชื่อฟิลด์ ไม่ได้อ้างถึงบัญชีบริการ แชนแนล หรือหน้าร้านค้าจริง และไม่ใช่การจดทะเบียนไดเรกทอรี",
  fi: "Esimerkki- / paikkannusdataa: alla olevat koodit, kehykset ja JSON esittävät vain muotoa ja kenttien nimiä. Mikään niistä ei osoita oikeaan service-tiliin, kanavaan tai kaupan sivulle, eikä mikään ole hakemistomerkintä.",
  uk: "Демонстраційні та тестові дані: коди, фрейми й JSON нижче показують лише формат і назви полів. Жоден із них не вказує на справжній сервісний акаунт, канал чи сторінку продавця і не є публікацією в каталозі.",
  bg: "Примерни / запълващи данни: кодовете, кадрите и JSON по-долу показват само формат и имена на полета. Никой от тях не сочи към реален сервизен акаунт, канал или страница на търговец и не е запис в указателя.",
  tr: "Örnek / yer tutucu demo verileri: aşağıdaki kodlar, çerçeveler ve JSON yalnızca biçimi ve alan adlarını gösterir. Hiçbiri gerçek bir hizmet hesabına, kanala veya satıcı sayfasına işaret etmez; hiçbiri bir dizin kaydı değildir.",
  hu: "Minta- / helyőző adatok: az alábbi kódok, frame-ek és a JSON csak a formátumot és a mezőneveket mutatják. Egyikük sem mutat valós szolgáltatási fiókra, csatornára vagy kereskedő oldalára, és egyikük sem könyvtári bejegyzés.",
};

const WALL_TITLE: Localized<string> = {
  en: "Reference ecosystem QR wall",
  ru: "Стена QR-кодов эталонной экосистемы",
  de: "QR-Wand des Referenz-Ökosystems",
  fr: "Mur de QR codes de l’écosystème de référence",
  it: "Muro di codici QR dell’ecosistema di riferimento",
  nl: "QR-muur van het referentie-ecosysteem",
  cs: "Zeď QR kódů referenční ekosystémy",
  "zh-Hans": "示范生态二维码展示墙",
  "zh-Hant": "示範生態 QR Code 展示牆",
  es: "Muro de códigos QR del ecosistema de referencia",
  pl: "Ściana kodów QR wzorcowego ekosystemu",
  ja: "リファレンスエコシステムの QR コードウォール",
  th: "ผนังรหัส QR ของระบบนิเวศอ้างอิง",
  fi: "Vertailujärjestelmän QR-seinä",
  uk: "Стіна QR-кодів еталонної екосистеми",
  bg: "Стена с QR кодове на референтната екосистема",
  tr: "Referans ekosistemin QR duvarı",
  hu: "A referencia-ökoszisztéma QR-fala",
};

const WALL_HINT: Localized<string> = {
  en: "Tap a code or “Tap to enlarge” for a bigger render and the full link; “Copy link” puts the raw string on the clipboard.",
  ru: "Нажмите на код или на «Увеличить», чтобы увидеть крупнее и полную ссылку; «Копировать ссылку» кладёт исходную строку в буфер обмена.",
  de: "Tippe auf einen Code oder auf „Zum Vergrößern antippen“, um eine größere Darstellung und den vollständigen Link zu sehen; „Link kopieren“ legt die Rohzeichenkette in die Zwischenablage.",
  fr: "Touchez un code ou « Toucher pour agrandir » pour un rendu plus grand et le lien complet ; « Copier le lien » met la chaîne brute dans le presse-papiers.",
  it: "Tocca un codice o “Tocca per ingrandire” per una resa più grande e il collegamento completo; “Copia collegamento” mette la stringa così com’è negli appunti.",
  nl: "Tik op een code of op “Tikken om te vergroten” voor een grotere weergave en de volledige koppeling; “Koppeling kopiëren” zet de ruwe tekenreeks op het klembord.",
  cs: "Klepnutím na kód nebo na „Zvětšit“ získáte větší zobrazení a celý odkaz; „Kopírovat odkaz“ dá syrový řetězec do schránky.",
  "zh-Hans": "点击二维码或「点击放大」查看大图与完整链接；「复制链接」把原文送到剪贴板。",
  "zh-Hant": "點擊 QR Code 或「點擊放大」檢視大圖與完整連結；「複製連結」把原文送到剪貼簿。",
  es: "Toca un código o «Toca para ampliar» para ver un tamaño mayor y el enlace completo; «Copiar enlace» lleva la cadena sin tratar al portapapeles.",
  pl: "Dotknij kodu lub „Dotknij, aby powiększyć”, aby zobaczyć większy obraz i pełne łącze; „Kopiuj łącze” wkłada surowy ciąg do schowka.",
  ja: "コードか「タップして拡大」をタップすると、大きな表示と完全なリンクが見えます。「リンクをコピー」で生の文字列がクリップボードに入ります。",
  th: "แตะรหัสหรือ “แตะเพื่อขยาย” เพื่อดูภาพใหญ่และลิงก์เต็ม; “คัดลอกลิงก์” จะวางสตริงดิบลงในคลิปบอร์ด",
  fi: "Napauta koodia tai napautaa “Suurenna napauttamalla” nähdäksesi isomman kuvan ja täyden linkin; “Kopioi linkki” vie raakan merkkijonon leikepöydälle.",
  uk: "Натисніть на код або на «Натисніть, щоб збільшити», щоб побачити велике зображення й повне посилання; «Копіювати посилання» кладе сирій рядок у буфер обміну.",
  bg: "Докоснете код или „Докосване за уголемяване“, за да видите по-голямо изображение и пълната връзка; „Копиране на връзка“ слага суровия низ в буфера.",
  tr: "Daha büyük görüntü ve tam bağlantı için bir koda veya “Büyütmek için dokun”a dokunun; “Bağlantıyı kopyala” ham diziyi panoya koyar.",
  hu: "Koppints egy kódra vagy a „Koppints a nagyításhoz” gombra a nagyobb ábráért és a teljes hivatkozásért; a „Hivatkozás másolása” a nyers szöveget a vágólapra teszi.",
};

const ENLARGE: Localized<string> = {
  en: "Tap to enlarge",
  ru: "Нажмите, чтобы увеличить",
  de: "Zum Vergrößern antippen",
  fr: "Toucher pour agrandir",
  it: "Tocca per ingrandire",
  nl: "Tikken om te vergroten",
  cs: "Zvětšit klepnutím",
  "zh-Hans": "点击放大",
  "zh-Hant": "點擊放大",
  es: "Toca para ampliar",
  pl: "Dotknij, aby powiększyć",
  ja: "タップして拡大",
  th: "แตะเพื่อขยาย",
  fi: "Suurenna napauttamalla",
  uk: "Натисніть, щоб збільшити",
  bg: "Докоснете за уголемяване",
  tr: "Büyütmek için dokun",
  hu: "Koppints a nagyításhoz",
};

const COPY_LINK: Localized<string> = {
  en: "Copy link",
  ru: "Копировать ссылку",
  de: "Link kopieren",
  fr: "Copier le lien",
  it: "Copia collegamento",
  nl: "Koppeling kopiëren",
  cs: "Kopírovat odkaz",
  "zh-Hans": "复制链接",
  "zh-Hant": "複製連結",
  es: "Copiar enlace",
  pl: "Kopiuj łącze",
  ja: "リンクをコピー",
  th: "คัดลอกลิงก์",
  fi: "Kopioi linkki",
  uk: "Копіювати посилання",
  bg: "Копиране на връзка",
  tr: "Bağlantıyı kopyala",
  hu: "Hivatkozás másolása",
};

const COPIED_LINK: Localized<string> = {
  en: "Copied",
  ru: "Скопировано",
  de: "Kopiert",
  fr: "Copié",
  it: "Copiato",
  nl: "Gekopieerd",
  cs: "Zkopírováno",
  "zh-Hans": "已复制",
  "zh-Hant": "已複製",
  es: "Copiado",
  pl: "Skopiowano",
  ja: "コピーしました",
  th: "คัดลอกแล้ว",
  fi: "Kopioitu",
  uk: "Скопійовано",
  bg: "Копирано",
  tr: "Kopyalandı",
  hu: "Másolva",
};

const CLOSE: Localized<string> = {
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

const FULL_LINK: Localized<string> = {
  en: "Full link",
  ru: "Полная ссылка",
  de: "Vollständiger Link",
  fr: "Lien complet",
  it: "Collegamento completo",
  nl: "Volledige koppeling",
  cs: "Celý odkaz",
  "zh-Hans": "完整链接",
  "zh-Hant": "完整連結",
  es: "Enlace completo",
  pl: "Pełne łącze",
  ja: "完全なリンク",
  th: "ลิงก์เต็ม",
  fi: "Täysi linkki",
  uk: "Повне посилання",
  bg: "Пълна връзка",
  tr: "Tam bağlantı",
  hu: "Teljes hivatkozás",
};

const FOOTER_NOTE: Localized<string> = {
  en: "This page loads no off-origin resource: the codes, the fonts and the scripts all come from this origin.",
  ru: "Эта страница не загружает ресурсов с чужих доменов: коды, шрифты и скрипты приходят с этого же источника.",
  de: "Diese Seite lädt keine Ressource einer fremden Origin: Codes, Schriftarten und Skripte kommen alle von hier.",
  fr: "Cette page ne charge aucune ressource extérieure : les codes, les polices et les scripts viennent tous de cette même origine.",
  it: "Questa pagina non carica risorse esterne: codici, font e script arrivano tutti da questa origine.",
  nl: "Deze pagina laadt geen bronnen van andere origins: codes, lettertypen en scripts komen allemaal van hier.",
  cs: "Tato stránka nenačítá žádné zdroje z cizích domén: kódy, písma i skripty pocházejí odsud.",
  "zh-Hans": "本页不加载任何外链资源：二维码、字体与脚本都来自这个源。",
  "zh-Hant": "本頁不載入任何外部連結資源：QR Code、字型與指令碼都來自這個來源。",
  es: "Esta página no carga ningún recurso de otro origen: códigos, tipografías y scripts vienen todos de este origen.",
  pl: "Ta strona nie wczytuje zasobów z innych domen: kody, czcionki i skrypty pochodzą stąd.",
  ja: "このページは外部由来のリソースを読み込みません。コードもフォントもスクリプトもすべて同じオリジンから届きます。",
  th: "หน้านี้ไม่โหลดทรัพยากรจากโดเมนอื่น รหัส ฟอนต์ และสคริปต์ทั้งหมดมาจากต้นทางเดียวกัน",
  fi: "Tämä sivu ei lataa mitään ulkopuolista resurssia: koodit, fontit ja skriptit tulevat kaikki samalta palveluntarjoajalta.",
  uk: "Ця сторінка не завантажує ресурсів із чужих доменів: коди, шрифти й скрипти надходять звідси.",
  bg: "Тази страница не заресъс ресурси от друг произход: кодовете, шрифтовете и скриптовете идват оттук.",
  tr: "Bu sayfa başka bir kaynaktan kaynak yüklemez: kodlar, yazı tipleri ve betiklerin hepsi bu kaynaktan gelir.",
  hu: "Ez az oldal nem tölt be idegen forrásból származó elemeket: a kódok, betűkészletek és parancsfájlok mind ugyanonnan a tartományról jönnek.",
};

const SAMPLE_CHIP: Localized<string> = {
  en: "Sample",
  ru: "Образец",
  de: "Beispiel",
  fr: "Exemple",
  it: "Esempio",
  nl: "Voorbeeld",
  cs: "Ukázka",
  "zh-Hans": "示例",
  "zh-Hant": "範例",
  es: "Ejemplo",
  pl: "Przykład",
  ja: "サンプル",
  th: "ตัวอย่าง",
  fi: "Esimerkki",
  uk: "Зразок",
  bg: "Пример",
  tr: "Örnek",
  hu: "Példa",
};

const QR_MODAL_NOTE: Localized<string> = {
  en: "This picture is local vector output: it stays sharp when enlarged, and on-screen scanning and printing use the same bytes. The content is a format demo — the client hands each string to the parser that matches its shape.",
  ru: "Это локальный векторный вывод: он остаётся чётким при увеличении, а экранное сканирование и печать используют одни и те же байты. Содержимое — демонстрация формата: клиент передаёт каждую строку тому анализатору, который соответствует её виду.",
  de: "Dieses Bild ist lokale Vektorausgabe: es bleibt beim Vergrößern scharf, und Bildschirmlesen und Drucken verwenden dieselben Bytes. Der Inhalt ist eine Formatdemo – der Client gibt jede Zeichenkette an den Parser, der zu ihrer Form passt.",
  fr: "Cette image est un rendu vectoriel local : elle reste nette agrandie, et la lecture à l’écran comme l’impression utilisent les mêmes octets. Le contenu est une démo de format — le client remet chaque chaîne au parser qui correspond à sa forme.",
  it: "Questa immagine è output vettoriale locale: resta nitida se ingrandita, e scansione a schermo e stampa usano gli stessi byte. Il contenuto è una demo di formato — il client passa ogni stringa al parser che ne riconosce la forma.",
  nl: "Deze afbeelding is lokale vectoruitvoer: ze blijft scherp bij vergroten, en scannen op het scherm en printen gebruiken dezelfde bytes. De inhoud is een formatdemo — de cliënt geeft elke tekenreeks aan de parser die bij de vorm past.",
  cs: "Tento obrázek je lokální vektorový výstup: zůstává ostrý i po zvětšení, a čtení na obrazovce i tisk používají stejné bajty. Obsah je ukázka formátu — klient předá každý řetězec parseru, který odpovídá jeho tvaru.",
  "zh-Hans": "这张图是本地矢量渲染：放大不失真，屏幕直扫和打印用的是同一份字节。内容是格式演示，扫码端会按链接形态把它交给对应的解析器。",
  "zh-Hant": "這張圖是本機向量轉譯：放大不失真，螢幕直掃與列印使用的是同一份位元組。內容是格式示範，掃描端會依連結形態把它交給對應的解析器。",
  es: "Esta imagen es salida vectorial local: se mantiene nítida al ampliarla, y el escaneo en pantalla y la impresión usan los mismos bytes. El contenido es una demostración de formato: el cliente entrega cada cadena al analizador que corresponde a su forma.",
  pl: "Ten obraz to lokalny wynik wektorowy: pozostaje ostry po powiększeniu, a skanowanie z ekranu i druk używają tych samych bajtów. Zawartość to demonstracja formatu — klient przekazuje każdy ciąg parserowi odpowiadającemu jego kształtowi.",
  ja: "この画像はローカル生成のベクター出力です。拡大してもにじまず、画面スキャンも印刷も同じバイト列を使います。中身は形式のデモで、クライアントは文字列をその形に合ったパーサーに渡します。",
  th: "ภาพนี้เป็นผลเวกเตอร์ที่สร้างในเครื่อง ขยายแล้วยังคม และการสแกนจากหน้าจอกับการพิมพ์ใช้ไบต์ชุดเดียวกัน เนื้อหาเป็นการสาธิตรูปแบบ ไคลเอนต์จะส่งสตริงแต่ละตัวให้ตัววิเคราะห์ที่ตรงกับรูปแบบของมัน",
  fi: "Tämä kuva on paikallinen vektorituloste: se pysyy terävänä suurennettuna, ja ruudulta skannaus ja tulostus käyttävät samoja tavuja. Sisältö on muotodemo — asiakasohjelma antaa kunkin merkkijonon sen muodon tunnistavalle jäsmentäjälle.",
  uk: "Це локальний векторний вивід: він залишається різким при збільшенні, а сканування з екрана й друк використовують одні й ті самі байти. Вміст — демонстрація формату: клієнт передає кожен рядок тому парсеру, що відповідає його вигляду.",
  bg: "Това изображение е локален векторен изход: остава остро при уголемяване, а сканирането от екрана и печатът използват едни и същи байтове. Съдържанието е демонстрация на формата — клиентът предава всеки низ на анализатора, който отговаря на вида му.",
  tr: "Bu resim yerel vektör çıktısıdır: büyütüldüğünde net kalır, ekrandan tarama ile yazdırma aynı baytları kullanır. İçerik bir biçim demosudur — istemci her diziyi kendi biçimine ayrıştırcıya verir.",
  hu: "Ez a kép helyi vektoros kimenet: nagyítva is éles marad, és a képernyőről olvasás valamint a nyomtatás ugyanazokat a bájtokat használja. A tartalom formátum-bemutató — az ügyfél minden szöveget az alakjának megfelelő elemzőnek ad.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 2. The wall — values
 * ───────────────────────────────────────────────────────────────────────── */

/** An invite address in the form the SSO plugin's own self-test carries. */
const DEMO_INVITE_ADDRESS = "popopx:/Q7dnHsF8Kz";

/** `uri=` is percent-encoded by the producer (`privacy_sso_plugin.py::percent_encode`, RFC 3986 unreserved only). */
const DEMO_ENCODED_ADDRESS = "popopx%3A%2FQ7dnHsF8Kz";

/** Both fragment values decode to exactly 32 bytes, which is what `validate_channel_public_uri` demands. */
const DEMO_CHANNEL_URI =
  "popopx://channel/smp.example.org/announcements" +
  "#key=AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA" +
  "&pub=ZWZnaGlqa2xtbm9wcXJzdHV2d3h5ent8fX5_gIGCg4Q";

const DEMO_H5_URL = "https://service.example.com/h5/welcome-2026";

/** The signature really is HMAC-SHA256(DEMO_SESSION_SECRET_HEX, "uid=u_7Qk2Lp9Rt3Vx&ts=1767225600"). */
const DEMO_SIGNED_H5_URL =
  DEMO_H5_URL +
  "?popopx_uid=u_7Qk2Lp9Rt3Vx&ts=1767225600" +
  "&sig=bbdc7e045d536caa921049f132b17c78e44e89fdc8657e6bcf79cce433db0d14";

const DEMO_SESSION_SECRET_HEX = "0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0";

type WallEntry = {
  id: string;
  kind: Localized<string>;
  title: Localized<string>;
  caption: Localized<string>;
  value: string;
};

const WALL_ENTRIES: WallEntry[] = [
  {
    id: "follow",
    kind: {
      en: "Follow",
      ru: "Подписка",
      de: "Folgen",
      fr: "Abonnement",
      it: "Seguito",
      nl: "Volgen",
      cs: "Sledování",
      "zh-Hans": "关注引流",
      "zh-Hant": "關注引流",
      es: "Seguimiento",
      pl: "Obserwacja",
      ja: "フォロー",
      th: "การติดตาม",
      fi: "Seuranta",
      uk: "Підписка",
      bg: "Следване",
      tr: "Takip",
      hu: "Követés",
    },
    title: {
      en: "Service-account follow link",
      ru: "Ссылка подписки на сервисный аккаунт",
      de: "Link zum Folgen eines Service-Kontos",
      fr: "Lien d’abonnement à un compte de service",
      it: "Collegamento di seguito dell’account servizio",
      nl: "Koppeling om een serviceaccount te volgen",
      cs: "Odkaz pro sledování servisního účtu",
      "zh-Hans": "服务号关注链接",
      "zh-Hant": "服務帳號關注連結",
      es: "Enlace para seguir la cuenta de servicio",
      pl: "Łącze obserwowania konta serwisowego",
      ja: "サービスアカウントのフォローリンク",
      th: "ลิงก์ติดตามบัญชีบริการ",
      fi: "Service-tilin seurantalinkki",
      uk: "Посилання підписки на сервісний акаунт",
      bg: "Връзка за следване на сервизен акаунт",
      tr: "Hesabı takip bağlantısı",
      hu: "Szolgáltatási fiók követési hivatkozása",
    },
    caption: {
      en: "Follows the account and reports the article it came from as a silent ::REF::.",
      ru: "Подписывает на аккаунт и молча передаёт статью-источник через ::REF::.",
      de: "Folgt dem Konto und meldet den Herkunftsartikel stumm als ::REF::.",
      fr: "Suit le compte et transmet silencieusement l’article d’origine via ::REF::.",
      it: "Segue l’account e segnala in silenzio l’articolo di provenienza con ::REF::.",
      nl: "Volgt het account en meldt het artikel van herkomst stil via ::REF::.",
      cs: "Sleduje účet a tiše ohlásí zdrojový článek jako ::REF::.",
      "zh-Hans": "关注服务号，并把文章来源作为 ::REF:: 静默带上。",
      "zh-Hant": "關注服務帳號，並把文章來源以 ::REF:: 靜默帶上。",
      es: "Sigue la cuenta e informa en silencio del artículo de procedencia mediante ::REF::.",
      pl: "Obserwuje konto i po cichu zgłasza artykuł źródłowy jako ::REF::.",
      ja: "アカウントをフォローし、元のニュース記事を ::REF:: として黙って伝えます。",
      th: "ติดตามบัญชีและส่งข่าวต้นทางไปอย่างเงียบ ๆ ในรูป ::REF::",
      fi: "Seuraa tiliä ja ilmoittaa lähtiartikkelin hiljaa ::REF::-muodossa.",
      uk: "Підписує на акаунт і мовчки передає статтю-джерело через ::REF::.",
      bg: "Следва акаунта и безшумно съобщава за статията източник чрез ::REF::.",
      tr: "Hesabı takip eder ve geldiği makaleyi ::REF:: ile sessizce bildirir.",
      hu: "Követi a fiókot, és néma ::REF:: jelzéssel jelzi a forráscikket.",
    },
    value: `popopx://service?uri=${DEMO_ENCODED_ADDRESS}&ref=welcome-2026`,
  },
  {
    id: "channel",
    kind: {
      en: "Channel",
      ru: "Канал",
      de: "Kanal",
      fr: "Canal",
      it: "Canale",
      nl: "Kanaal",
      cs: "Kanál",
      "zh-Hans": "频道订阅",
      "zh-Hant": "頻道訂閱",
      es: "Canal",
      pl: "Kanał",
      ja: "チャンネル",
      th: "แชนแนล",
      fi: "Kanava",
      uk: "Канал",
      bg: "Канал",
      tr: "Kanal",
      hu: "Csatorna",
    },
    title: {
      en: "Channel public link",
      ru: "Публичная ссылка канала",
      de: "Öffentlicher Kanal-Link",
      fr: "Lien public du canal",
      it: "Collegamento pubblico del canale",
      nl: "Openbare kanaalkoppeling",
      cs: "Veřejný odkaz kanálu",
      "zh-Hans": "频道公开链接",
      "zh-Hant": "頻道公開連結",
      es: "Enlace público del canal",
      pl: "Publiczne łącze kanału",
      ja: "チャンネルの公開リンク",
      th: "ลิงก์สาธารณะของแชนแนล",
      fi: "Kanavan julkinen linkki",
      uk: "Публічне посилання каналу",
      bg: "Публична връзка на канала",
      tr: "Kanalın herkese açık bağlantısı",
      hu: "A csatorna nyilvános hivatkozása",
    },
    caption: {
      en: "Two path segments with the read key in the fragment; nothing after # is ever sent to a relay.",
      ru: "Два сегмента пути, ключ чтения — во фрагменте после #; всё, что после #, никогда не уходит на релей.",
      de: "Zwei Pfadsegmente, der Leseschlüssel sitzt im Fragment; nach dem # geht nichts an ein Relay.",
      fr: "Deux segments de chemin, la clé de lecture est dans le fragment ; rien de ce qui suit le # n’est envoyé à un relais.",
      it: "Due segmenti di percorso, la chiave di lettura è nel fragment; nulla di ciò che segue il # viene inviato a un relay.",
      nl: "Twee padsegmenten met de leesleutel in het fragment; niets achter de # gaat ooit naar een relay.",
      cs: "Dva úseky cesty, čtecí klíč je ve fragmentu; nic za znakem # se relé nikdy pošle.",
      "zh-Hans": "两个路径段，读取密钥放在 fragment 里；# 之后的内容不会发给中继。",
      "zh-Hant": "兩個路徑段，讀取密鑰放在 fragment 裡；# 之後的內容不會送給中繼。",
      es: "Dos segmentos de ruta con la clave de lectura en el fragmento; nada tras la # se envía a un relé.",
      pl: "Dwa segmenty ścieżki, klucz odczytu jest w fragmencie; nic po # nie trafia do przekaźnika.",
      ja: "パスは 2 区切り、読み取り鍵はフラグメントに置きます。# より後ろがリレーに送られることはありません。",
      th: "มีสองส่วนของเส้นทาง โดยคีย์อ่านอยู่ใน fragment; ไม่มีสิ่งใดหลัง # ถูกส่งไปรีเลย์",
      fi: "Kaksi polkusegmenttiä, lukuavain on fragmentissa; mitään #-merkin jälkeen ei lähetetä relaylle.",
      uk: "Два сегменти шляху, ключ читання — у фрагменті; після # на релей не йде нічого.",
      bg: "Два сегмента от пътя, ключът за четене е във фрагмента; нищо след # не се изпраща на реле.",
      tr: "İki yol bölümü ve okuma anahtarı parça içinde; # sonrasındaki hiçbir şey röleye gitmez.",
      hu: "Két útvonalszegmens, az olvasási kulcs a törtben; a # jele után semmi sem megy átjátszónak.",
    },
    value: DEMO_CHANNEL_URI,
  },
  {
    id: "sso",
    kind: {
      en: "Sign-in",
      ru: "Вход",
      de: "Anmeldung",
      fr: "Connexion",
      it: "Accesso",
      nl: "Aanmelden",
      cs: "Přihlášení",
      "zh-Hans": "扫码登录",
      "zh-Hant": "掃碼登入",
      es: "Inicio de sesión",
      pl: "Logowanie",
      ja: "サインイン",
      th: "การเข้าสู่ระบบ",
      fi: "Kirjautuminen",
      uk: "Вхід",
      bg: "Влизане",
      tr: "Giriş",
      hu: "Bejelentkezés",
    },
    title: {
      en: "SSO scan-to-sign-in link",
      ru: "Ссылка SSO-входа по QR-коду",
      de: "SSO-Link zum Anmelden per Scan",
      fr: "Lien de connexion SSO par scan",
      it: "Collegamento SSO con accesso tramite scansione",
      nl: "SSO-aanmeldkoppeling via scan",
      cs: "Odkaz pro přihlášení SSO skenováním",
      "zh-Hans": "SSO 扫码登录链接",
      "zh-Hant": "SSO 掃碼登入連結",
      es: "Enlace de inicio de sesión SSO por escaneo",
      pl: "Łącze logowania SSO przez zeskanowanie",
      ja: "SSO スキャンサインインリンク",
      th: "ลิงก์เข้าสู่ระบบ SSO ด้วยการสแกน",
      fi: "SSO-kirjautumislinkki skannaamalla",
      uk: "Посилання входу SSO скануванням",
      bg: "Връзка за вход чрез SSO сканиране",
      tr: "SSO tarayarak giriş bağlantısı",
      hu: "SSO bejelentkezési hivatkozás beolvasással",
    },
    caption: {
      en: "The camera recognises a third-party login code and sends ::SSO_SCAN:: silently; the account raises the consent card.",
      ru: "Камера узнаёт чужой код входа и молча отправляет ::SSO_SCAN::; аккаунт поднимает карточку согласия.",
      de: "Die Kamera erkennt einen fremden Anmeldecode und schickt stumm ::SSO_SCAN::; das Konto wirft die Einwilligungskarte auf.",
      fr: "La caméra reconnaît un code de connexion tiers et envoie ::SSO_SCAN:: silencieusement ; le compte affiche la carte de consentement.",
      it: "La fotocamera riconosce un codice di accesso di terze parti e invia ::SSO_SCAN:: in silenzio; l’account mostra la carta di consenso.",
      nl: "De camera herkent een aanmeldcode van derden en stuurt stil ::SSO_SCAN::; het account toont de toestemmingskaart.",
      cs: "Kamera pozná cizí přihlašovací kód a tiše pošle ::SSO_SCAN::; účet vyvolá souhlasovou kartu.",
      "zh-Hans": "扫一扫识别第三方站点的登录码，静默发出 ::SSO_SCAN::，由服务号弹出授权卡片。",
      "zh-Hant": "掃一掃辨識第三方站點的登入碼，靜默發出 ::SSO_SCAN::，由服務帳號彈出授權卡片。",
      es: "La cámara reconoce un código de acceso de terceros y envía ::SSO_SCAN:: en silencio; la cuenta muestra la tarjeta de consentimiento.",
      pl: "Aparat rozpoznaje kod logowania strony trzeciej i po cichu wysyła ::SSO_SCAN::; konto podnosi kartę zgody.",
      ja: "カメラが第三者サイトのログインコードを見分け、::SSO_SCAN:: を黙って送信します。サービスアカウントが同意カードを表示します。",
      th: "กล้องจำรหัสเข้าสู่ระบบของบุคคลที่สามแล้วส่ง ::SSO_SCAN:: อย่างเงียบ ๆ บัญชีบริการจะแสดงการ์ดให้ความยินยอม",
      fi: "Kamera tunnistaa kolmannen osapuolen kirjautumiskoodin ja lähettää ::SSO_SCAN:: hiljaa; tili nostaa suostumuskortin.",
      uk: "Камера впізнає чужий код входу й мовчки надсилає ::SSO_SCAN::; акаунт показує картку згоди.",
      bg: "Камерата разпознава входен код на трета страна и изпраща безшумно ::SSO_SCAN::; акаунтът показва картата за съгласие.",
      tr: "Kamera üçüncü tarafın giriş kodunu tanır ve sessizce ::SSO_SCAN:: gönderir; hesap onay kartını açar.",
      hu: "A kamera felismeri egy harmadik fél bejelentkezési kódját, és néma ::SSO_SCAN:: küldést indít; a fiók hozzájárulási kártyát dob fel.",
    },
    value: `popopx://sso?uri=${DEMO_ENCODED_ADDRESS}&session=a1b2c3d4e5f60718`,
  },
  {
    id: "access",
    kind: {
      en: "Credential",
      ru: "Учётные данные",
      de: "Zugangsdaten",
      fr: "Identifiant",
      it: "Credenziale",
      nl: "Inloggegeven",
      cs: "Přístupový údaj",
      "zh-Hans": "频道凭证",
      "zh-Hant": "頻道憑證",
      es: "Credencial",
      pl: "Dane uwierzytelniające",
      ja: "資格情報",
      th: "ข้อมูลประจำตัว",
      fi: "Tunniste",
      uk: "Облікові дані",
      bg: "Удостоверение",
      tr: "Kimlik bilgisi",
      hu: "Hitelesítő adat",
    },
    title: {
      en: "Paid channel access credential",
      ru: "Кредит доступа к платному каналу",
      de: "Zugangsdaten für einen kostenpflichtigen Kanal",
      fr: "Identifiant d’accès à un canal payant",
      it: "Credenziale di accesso a canale a pagamento",
      nl: "Toegangsgegeven voor betaald kanaal",
      cs: "Přístupový údaj placeného kanálu",
      "zh-Hans": "频道付费访问凭证",
      "zh-Hant": "頻道付費存取憑證",
      es: "Credencial de acceso a canal de pago",
      pl: "Dane dostępowe do płatnego kanału",
      ja: "有料チャンネルアクセスの資格情報",
      th: "ข้อมูลสิทธิ์เข้าใช้แชนแนลแบบชำระเงิน",
      fi: "Maksetun kanavan pääsytunniste",
      uk: "Облікові дані доступу до платного каналу",
      bg: "Удостоверение за платен достъп до канал",
      tr: "Ücretli kanal erişim bilgisi",
      hu: "Fizetős csatorna hozzáférési hitelesítője",
    },
    caption: {
      en: "Also opens with popopx://channel, but a query rather than a path — neither parser accepts the other's shape.",
      ru: "Тоже начинается с popopx://channel, но дальше идёт запрос, а не путь — ни один парсер не принимает чужую форму.",
      de: "Beginnt ebenfalls mit popopx://channel, aber mit einer Query statt eines Pfads – keiner der Parser akzeptiert die Form des anderen.",
      fr: "Commence aussi par popopx://channel, mais avec une requête et non un chemin — aucun parser n’accepte la forme de l’autre.",
      it: "Inizia anch’esso con popopx://channel, ma con una query invece di un percorso — nessun parser accetta la forma dell’altro.",
      nl: "Begint ook met popopx://channel, maar met een query in plaats van een pad — geen van beide parsers accepteert de vorm van de ander.",
      cs: "Též začíná na popopx://channel, ale dotazem místo cesty — žádný parser nepřijme tvar toho druhého.",
      "zh-Hans": "同样以 popopx://channel 开头，但走查询而不是路径；两个解析器互不接受对方的形态。",
      "zh-Hant": "同樣以 popopx://channel 開頭，但走查詢而不是路徑；兩個解析器互不接受對方的形態。",
      es: "También empieza con popopx://channel, pero con una consulta en lugar de una ruta: ningún analizador acepta la forma del otro.",
      pl: "Też zaczyna się od popopx://channel, ale zapytaniem, nie ścieżką — żaden parser nie przyjmuje kształtu drugiego.",
      ja: "同じく popopx://channel で始まりますが、パスではなくクエリです。両方のパーサーは相手の形を受け付けません。",
      th: "ขึ้นต้นด้วย popopx://channel เช่นกัน แต่ใช้แบบ query ไม่ใช่เส้นทาง ตัววิเคราะห์ทั้งสองไม่รับรูปแบบของอีกฝ่าย",
      fi: "Alkaa samoin popopx://channel-muodossa, mutta kyselynä eikä polkuna — kumpikaan jäsmentäjä ei hyväksy toisen muotoa.",
      uk: "Теж починається з popopx://channel, але запитом, а не шляхом — жоден парсер не приймає чужу форму.",
      bg: "Също започва с popopx://channel, но с заявка, а не с път — нито един анализатор не приема формата на другия.",
      tr: "O da popopx://channel ile başlar ama yol yerine sorgu kullanır — iki ayrıştırıcı da diğerinin biçimini kabul etmez.",
      hu: "Szintén popopx://channel-lel indul, de útvonal helyett lekérdezéssel — egyik elemző sem fogadja el a másik alakját.",
    },
    value:
      "popopx://channel?p=200&t=1767225600123" +
      "&e=BAcUIS47SFVib3yJlqOwvcrX5PH-CxglMj9MWWZzgI2ap7TBztvo9QIPHCk2Q1BdaneEkZ6ruMXS3-z5BhMgLTo" +
      "&s=DSpHZIGeu9j1Ei9MaYajwN36FzRRbouoxeL_HDlWc5CtyucEIT5beJWyz-wJJkNgfZq31PEOK0hlgp-82fYTME1qh6TB3vsY",
  },
  {
    id: "h5",
    kind: {
      en: "Signed H5",
      ru: "Подписанный H5",
      de: "Signiertes H5",
      fr: "H5 signé",
      it: "H5 firmato",
      nl: "Ondertekende H5",
      cs: "Podepsené H5",
      "zh-Hans": "已签名 H5",
      "zh-Hant": "已簽名 H5",
      es: "H5 firmado",
      pl: "Podpisany H5",
      ja: "署名済み H5",
      th: "H5 ที่ลงนาม",
      fi: "Allekirjoitettu H5",
      uk: "Підписаний H5",
      bg: "Подписан H5",
      tr: "İmzalı H5",
      hu: "Aláírt H5",
    },
    title: {
      en: "Signed H5 article link",
      ru: "Подписанная ссылка на H5-статью",
      de: "Signierter Link auf einen H5-Artikel",
      fr: "Lien d’article H5 signé",
      it: "Collegamento firmato a un articolo H5",
      nl: "Ondertekende H5-artikellink",
      cs: "Podepsený odkaz na H5 článek",
      "zh-Hans": "带签名的 H5 文章链接",
      "zh-Hant": "帶簽名的 H5 文章連結",
      es: "Enlace firmado a un artículo H5",
      pl: "Podpisane łącze artykułu H5",
      ja: "署名付き H5 記事リンク",
      th: "ลิงก์บทความ H5 ที่มีการลงนาม",
      fi: "Allekirjoitettu H5-artikkelilinkki",
      uk: "Підписане посилання на H5-статтю",
      bg: "Подписана връзка към H5 статия",
      tr: "İmzalı H5 makale bağlantısı",
      hu: "Aláírt H5 cikk-hivatkozás",
    },
    caption: {
      en: "Parameter order is popopx_uid, ts, sig; the signature covers uid= and ts= only — never the host name.",
      ru: "Порядок параметров: popopx_uid, ts, sig; подпись покрывает только uid= и ts= и никогда — имя хоста.",
      de: "Parameterreihenfolge ist popopx_uid, ts, sig; die Signatur deckt nur uid= und ts= ab, nie den Hostnamen.",
      fr: "L’ordre des paramètres est popopx_uid, ts, sig ; la signature ne couvre que uid= et ts=, jamais le nom d’hôte.",
      it: "L’ordine dei parametri è popopx_uid, ts, sig; la firma copre solo uid= e ts=, mai il nome host.",
      nl: "Parametervolgorde is popopx_uid, ts, sig; de handtekening dekt alleen uid= en ts=, nooit de hostnaam.",
      cs: "Pořadí parametrů je popopx_uid, ts, sig; podpis se vztahuje jen na uid= a ts=, nikdy na název hostitele.",
      "zh-Hans": "参数顺序固定为 popopx_uid、ts、sig；签名只覆盖 uid= 和 ts=，不覆盖主机名。",
      "zh-Hant": "參數順序固定為 popopx_uid、ts、sig；簽名只涵蓋 uid= 與 ts=，不涵蓋主機名。",
      es: "El orden de parámetros es popopx_uid, ts, sig; la firma solo cubre uid= y ts=, nunca el nombre de host.",
      pl: "Kolejność parametrów to popopx_uid, ts, sig; podpis obejmuje tylko uid= i ts=, nigdy nazwę hosta.",
      ja: "パラメータ順は popopx_uid、ts、sig。署名がカバーするのは uid= と ts= だけで、ホスト名は含みません。",
      th: "ลำดับพารามิเตอร์คือ popopx_uid, ts, sig; ลายเซ็นครอบคลุมเฉพาะ uid= และ ts= ไม่ครอบคลุมชื่อโฮสต์",
      fi: "Parametrijärjestys on popopx_uid, ts, sig; allekirjoitus kattaa vain uid=- ja ts=-kentät, ei koskaan isäntänimeä.",
      uk: "Порядок параметрів: popopx_uid, ts, sig; підпис покриває лише uid= і ts=, а не назву хоста.",
      bg: "Редът на параметрите е popopx_uid, ts, sig; подписът покрива само uid= и ts=, никога името на хоста.",
      tr: "Parametre sırası popopx_uid, ts, sig; imza yalnızca uid= ve ts= kapsar, ana bilgisayar adını asla.",
      hu: "A paraméterek sorrendje popopx_uid, ts, sig; az aláírás csak a uid= és ts= mezőket fedi le, a gépinevet soha.",
    },
    value: DEMO_SIGNED_H5_URL,
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 3. Protocol samples — locale-free by design
 * ───────────────────────────────────────────────────────────────────────── */

const ENVELOPE_JSON = `{
  "protocol": "popopx.channel.enc.v1",
  "epoch": 3,
  "nonce": "IU9tAhF6M1xuCBkr",
  "ciphertext": "AwoRGB8mLTQ7QklQV15lbHN6gYiPlp2kq7K5wMfO1dzj6vH4/wYNFBsiKTA3PkVMU1phaG92fYSLkpmgp661vMPK0djf5u30+wIJEBceJSwzOkFIT1ZdZA==",
  "signature": "BRAbJjE8R1JdaHN+iZSfqrXAy9bh7PcCDRgjLjlET1plcHuGkZynsr3I097p9P8KFSArNkFMV2JteIOOmaSvug=="
}`;

const KU_FRAME =
  '::POPOPX_ECO::{"t":"ku","update":{"ch":"announcements","se":2,"rp":false,"env":' +
  '{"protocol":"popopx.channel.enc.v1","epoch":3,"nonce":"IU9tAhF6M1xuCBkr",' +
  '"ciphertext":"AwoRGB8mLTQ7QklQV15lbHN6gYiPlp2kq7K5wMfO1dzj6vH4/wYNFBsiKTA3PkVMU1phaG92fYSLkpmgp661vMPK0djf5u30+wIJEBceJSwzOkFIT1ZdZA==",' +
  '"signature":"BRAbJjE8R1JdaHN+iZSfqrXAy9bh7PcCDRgjLjlET1plcHuGkZynsr3I097p9P8KFSArNkFMV2JteIOOmaSvug=="}}}';

const CARD_FRAME =
  '::POPOPX_ECO::{"t":"sc","m":"c","card":{"id":"order-2026-0417","v":"receipt",' +
  '"title":"订单已支付","ut":1767225600123,"body":"服务将在三个工作日内开通。",' +
  '"fields":[{"k":"订单号","v":"POPX-2026-0417","mono":true},{"k":"规格","v":"年度服务号席位"},{"k":"金额","v":"20点算力额度","mono":true}],' +
  '"progress":{"l":"开通进度","p":60,"d":"3/5"},' +
  '"actions":[{"id":"a-open","title":"查看凭证","action":"open_url","style":"primary","url":"' + DEMO_H5_URL + '"},' +
  '{"id":"a-pay","title":"支付尾款","action":"pay_credits","style":"secondary","amount":20,"confirm":true},' +
  '{"id":"a-cancel","title":"取消订单","action":"callback","style":"destructive","payload":"kw:order-cancel"}]}}';

const HANDSHAKE_FRAME =
  '::POPOPX_ECO::{"t":"sh","uid":"u_7Qk2Lp9Rt3Vx","sec":"' + DEMO_SESSION_SECRET_HEX + '","svc":"popopx.official"}';

const MENU_FRAME =
  '::POPOPX_ECO::{"t":"mc","menu":{"items":[' +
  '{"title":"订单","kind":"click","action":"callback","payload":"kw:order","sub":[]},' +
  '{"title":"说明","kind":"view","url":"' + DEMO_H5_URL + '"},' +
  '{"title":"更多","kind":"click","action":"send_cmd","payload":"kw:more","sub":[{"title":"公告频道","kind":"click","action":"open_channel",' +
  '"payload":"' + DEMO_CHANNEL_URI + '","sub":[]}]}],"rev":7}}';

const H5_PYTHON = `import hashlib
import hmac
import time

# The per-follower session secret, as hex, exactly the way the session_handshake frame delivered it.
SECRET_HEX = "${DEMO_SESSION_SECRET_HEX}"
PAIRWISE_UID = "u_7Qk2Lp9Rt3Vx"
GATEWAY_ORIGIN = "https://service.example.com"


def sign(pairwise_uid: str, timestamp_seconds: int) -> str:
    """Recompute what the phone signed. Note the asymmetry: uid= here, popopx_uid= in the URL."""
    preimage = ("uid=%s&ts=%d" % (pairwise_uid, timestamp_seconds)).encode("utf-8")
    key = bytes.fromhex(SECRET_HEX)
    return hmac.new(key, preimage, hashlib.sha256).hexdigest()


timestamp = int(time.time())
signature = sign(PAIRWISE_UID, timestamp)
article_url = "%s/h5/welcome-2026?popopx_uid=%s&ts=%d&sig=%s" % (
    GATEWAY_ORIGIN,
    PAIRWISE_UID,
    timestamp,
    signature,
)
print(article_url)`;

const H5_VERIFY_JS = `/**
 * The merchant's own server asks the gateway whether the signature that just arrived is real.
 * The gateway is the only party holding the per-follower secret, so page JavaScript must never
 * compute this HMAC itself.
 */
async function verifyH5Auth(gatewayOrigin, params) {
  const response = await fetch(gatewayOrigin + "/api/v1/verifyH5Auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      popopx_uid: params.get("popopx_uid"),
      ts: params.get("ts"),
      sig: params.get("sig"),
    }),
  });
  // Same body shape on both outcomes; 200 when valid, 401 when it is not.
  const result = await response.json();
  return {
    valid: result.valid === true,
    reason: result.reason,
    serviceId: result.service_id,
    pairwiseUid: result.pairwise_uid,
  };
}

const params = new URL(window.location.href).searchParams;
const verdict = await verifyH5Auth("https://service.example.com", params);
if (!verdict.valid) {
  document.body.textContent = "signature refused: " + verdict.reason;
}`;

/* ─────────────────────────────────────────────────────────────────────────
 * 4. The rule each sample encodes
 * ───────────────────────────────────────────────────────────────────────── */

const ENVELOPE_TITLE: Localized<string> = {
  en: "The channel key envelope popopx.channel.enc.v1",
  ru: "Конверт ключей канала popopx.channel.enc.v1",
  de: "Der Kanal-Schlüsselumschlag popopx.channel.enc.v1",
  fr: "L’enveloppe de clé de canal popopx.channel.enc.v1",
  it: "La busta delle chiavi del canale popopx.channel.enc.v1",
  nl: "De kanaalsleutelomslag popopx.channel.enc.v1",
  cs: "Obálka kanálového klíče popopx.channel.enc.v1",
  "zh-Hans": "频道密钥信封 popopx.channel.enc.v1",
  "zh-Hant": "頻道密鑰信封 popopx.channel.enc.v1",
  es: "El sobre de claves del canal popopx.channel.enc.v1",
  pl: "Koperta klucza kanału popopx.channel.enc.v1",
  ja: "チャンネル鍵エンベロープ popopx.channel.enc.v1",
  th: "ซองคีย์แชนแนล popopx.channel.enc.v1",
  fi: "Kanava-avaimen kirjekuori popopx.channel.enc.v1",
  uk: "Конверт ключів каналу popopx.channel.enc.v1",
  bg: "Обвивката на ключа на канала popopx.channel.enc.v1",
  tr: "Kanal anahtarı zarfı popopx.channel.enc.v1",
  hu: "A csatornakulcs-boríték popopx.channel.enc.v1",
};

const ENVELOPE_JSON_LABEL: Localized<string> = {
  en: "Envelope JSON",
  ru: "JSON конверта",
  de: "Umschlag-JSON",
  fr: "JSON de l’enveloppe",
  it: "JSON della busta",
  nl: "Omslag-JSON",
  cs: "JSON obálky",
  "zh-Hans": "信封 JSON",
  "zh-Hant": "信封 JSON",
  es: "JSON del sobre",
  pl: "JSON koperty",
  ja: "エンベロープ JSON",
  th: "JSON ของซอง",
  fi: "Kirjekuon JSON",
  uk: "JSON конверта",
  bg: "JSON на обвивката",
  tr: "Zarf JSON’u",
  hu: "Boríték JSON",
};

const KU_FRAME_LABEL: Localized<string> = {
  en: "The enclosing ku frame (compact, one line)",
  ru: "Внешний фрейм ku (компактный, одной строкой)",
  de: "Der umschließende ku-Frame (kompakt, eine Zeile)",
  fr: "La trame ku englobante (compacte, sur une ligne)",
  it: "Il frame ku circostante (compatto, su una riga)",
  nl: "Het omvattende ku-frame (compact, één regel)",
  cs: "Obklopující snímek ku (kompaktní, na jeden řádek)",
  "zh-Hans": "外层 ku 帧（紧凑单行）",
  "zh-Hant": "外層 ku 訊框（緊湊單行）",
  es: "La trama ku envolvente (compacta, en una línea)",
  pl: "Ramka ku obejmująca całość (kompaktowa, w jednej linii)",
  ja: "外側の ku フレーム（コンパクトな 1 行）",
  th: "เฟรม ku ภายนอก (บีบอัดบรรทัดเดียว)",
  fi: "Yläpuolinen ku-kehys (tiivissä, yhdellä rivillä)",
  uk: "Зовнішній фрейм ku (компактний, в один рядок)",
  bg: "Външният ku кадър (компактен, на един ред)",
  tr: "Kapsayan ku çerçevesi (kompakt, tek satır)",
  hu: "A körülvevő ku frame (tömören, egy sorban)",
};

const ENVELOPE_RULES: readonly Localized<string>[] = [
  {
    en: "Five fields are the whole envelope: protocol, epoch, nonce (12 bytes), ciphertext and signature (Ed25519, 64 bytes). The three byte fields are padded standard base64, not base64url.",
    ru: "Пять полей — весь конверт: protocol, epoch, nonce (12 байт), ciphertext и signature (Ed25519, 64 байта). Три байтовых поля — стандартный base64 с выравниванием, а не base64url.",
    de: "Fünf Felder sind der ganze Umschlag: protocol, epoch, nonce (12 Byte), ciphertext und signature (Ed25519, 64 Byte). Die drei Bytefelder sind gepolstertes Standard-base64, kein base64url.",
    fr: "Cinq champs constituent toute l’enveloppe : protocol, epoch, nonce (12 octets), ciphertext et signature (Ed25519, 64 octets). Les trois champs d’octets sont du base64 standard avec remplissage, pas du base64url.",
    it: "Cinque campi sono l’intera busta: protocol, epoch, nonce (12 byte), ciphertext e signature (Ed25519, 64 byte). I tre campi di byte sono base64 standard con riempimento, non base64url.",
    nl: "Vijf velden zijn de hele omslag: protocol, epoch, nonce (12 bytes), ciphertext en signature (Ed25519, 64 bytes). De drie bytevelden zijn opgevulde standaard base64, geen base64url.",
    cs: "Pět polí je celá obálka: protocol, epoch, nonce (12 bajtů), ciphertext a signature (Ed25519, 64 bajtů). Ta tři bajtová pole jsou doplněný standardní base64, nikoli base64url.",
    "zh-Hans": "五个字段就是信封的全部：protocol、epoch、nonce（12 字节）、ciphertext、signature（Ed25519，64 字节）。三个字节字段都是补齐填充的标准 base64，不是 base64url。",
    "zh-Hant": "五個欄位就是信封的全部：protocol、epoch、nonce（12 位元組）、ciphertext、signature（Ed25519，64 位元組）。三個位元組欄位都是補齊填充的標準 base64，不是 base64url。",
    es: "Cinco campos son todo el sobre: protocol, epoch, nonce (12 bytes), ciphertext y signature (Ed25519, 64 bytes). Los tres campos de bytes son base64 estándar con relleno, no base64url.",
    pl: "Pięć pól stanowi całą kopertę: protocol, epoch, nonce (12 bajtów), ciphertext oraz signature (Ed25519, 64 bajty). Trzy pola bajtowe to dopełniony standardowy base64, a nie base64url.",
    ja: "フィールドは 5 つが信封のすべてです：protocol、epoch、nonce（12 バイト）、ciphertext、signature（Ed25519、64 バイト）。3 つのバイト列はパディング付きの標準 base64 で、base64url ではありません。",
    th: "ห้าฟิลด์คือทั้งหมดของซอง: protocol, epoch, nonce (12 ไบต์), ciphertext และ signature (Ed25519, 64 ไบต์) ฟิลด์ไบต์ทั้งสามเป็น base64 มาตรฐานที่มีการเติมไบต์ ไม่ใช่ base64url",
    fi: "Viisi kenttää ovat koko kirjekuori: protocol, epoch, nonce (12 tavua), ciphertext ja signature (Ed25519, 64 tavua). Kolme tavukenttää ovat täytettyä tavallista base64:ta eivätkä base64url:aa.",
    uk: "П’ять полів — увесь конверт: protocol, epoch, nonce (12 байтів), ciphertext і signature (Ed25519, 64 байти). Три байтові поля — це стандартний base64 з вирівнюванням, а не base64url.",
    bg: "Пет полета са цялата обвивка: protocol, epoch, nonce (12 байта), ciphertext и signature (Ed25519, 64 байта). Трите байтови полета са стандартен base64 с подравняване, не base64url.",
    tr: "Beş alan zarfın tamamıdır: protocol, epoch, nonce (12 bayt), ciphertext ve signature (Ed25519, 64 bayt). Üç bayt alanı, dolgulu standart base64’tir, base64url değildir.",
    hu: "Öt mező a teljes boríték: protocol, epoch, nonce (12 bájt), ciphertext és signature (Ed25519, 64 bájt). A három bájtos mező kitöltött szabványos base64, nem base64url.",
  },
  {
    en: "The AAD is protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ the 32-byte identity public key. The channel id is not in the envelope; it comes from update.ch one level up — without it, a cross-channel replay could only be caught by trying every stored key.",
    ru: "AAD — это protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ открытая ключ идентификации (32 байта). Идентификатор канала в конверт не входит, он берётся из update.ch уровнем выше — без него перенос между каналами ловился бы только перебором всех сохранённых ключей.",
    de: "Die AAD ist protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ der 32-Byte-Identitätsschlüssel. Die Kanal-ID liegt nicht im Umschlag, sie kommt aus update.ch eine Ebene höher — ohne sie ließe sich eine Kanal-übergreifende Wiedereinspielung nur durch Ausprobieren aller gespeicherten Schlüssel erkennen.",
    fr: "L’AAD est protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ la clé publique d’identité de 32 octets. L’identifiant de canal n’est pas dans l’enveloppe, il vient de update.ch un niveau au-dessus — sans lui, un rejeu entre canaux ne se détecterait qu’en essayant toutes les clés stockées.",
    it: "L’AAD è protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ la chiave pubblica d’identità di 32 byte. L’id del canale non è nella busta: viene da update.ch un livello più su — senza di esso, un replay tra canali siindividuarebbe solo provando tutte le chiavi salvate.",
    nl: "De AAD is protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ de identiteits-sleutel van 32 bytes. De kanaal-id zit niet in de omslag maar komt uit update.ch één niveau hoger — zonder die id zou je een kanaal-overstijgende replay alleen vinden door elke opgeslagen sleutel te proberen.",
    cs: "AAD je protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32bajtový veřejný klíč identity. ID kanálu v obálce není — přichází z update.ch o úroveň výš; bez něj by se opakování napříč kanály odhalilo jen vyzkoušením všech uložených klíčů.",
    "zh-Hans": "AAD 是 protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 身份公钥 32 字节。频道 id 不在信封里，它来自外面那一层的 update.ch——没有 id，跨频道重放就只能靠穷举每一把密钥。",
    "zh-Hant": "AAD 是 protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 身分公鑰 32 位元組。頻道 id 不在信封裡，它來自外一層的 update.ch——沒有 id，跨頻道重放就只能窮舉每一把密鑰。",
    es: "El AAD es protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ la clave pública de identidad de 32 bytes. El id del canal no está en el sobre: viene de update.ch un nivel arriba — sin él, una reproducción entre canales solo se detectaría probando todas las claves guardadas.",
    pl: "AAD to protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32-bajtowy klucz publiczny tożsamości. Identyfikator kanału nie jest w kopercie — bierze się z update.ch poziom wyżej; bez niego odtworzenie między kanałami dałoby się wykryć tylko przez wypróbowanie wszystkich zapisanych kluczy.",
    ja: "AAD は protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ アイデンティティ公開鍵 32 バイトです。チャンネル id はエンベロープに含まれず、一段外側の update.ch から取られます。id がなければ、チャンネルをまたぐ再生は保存済み鍵を総当たりするしか検出手段がありません。",
    th: "AAD คือ protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ คีย์สาธารณะประจำตัวตน 32 ไบต์ id ของแชนแนลไม่ได้อยู่ในซอง แต่มาจาก update.ch ที่อยู่ชั้นนอกกว่า — ถ้าไม่มี id การเล่นซ้ำข้ามแชนแนลจะตรวจได้ก็ลองด้วยการไล่ใช้คีย์ที่เก็บไว้ทุกอัน",
    fi: "AAD on protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32-tavun identiteetin julkinen avain. Kanavan id ei ole kirjekuoressa vaan tulee update.ch-kentästä ylempänä — ilman sitä toistohyökkäys kanavien välillä voitaisiin havaita vain kokeilemalla jokaista tallennettua avainta.",
    uk: "AAD — це protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32-байтовий відкритий ключ ідентичності. Ідентифікатор каналу не входить до конверта, він береся з update.ch на рівень вище — без нього відтворення між каналами можна було б виявити лише перебиранням усіх збережених ключів.",
    bg: "AAD е protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32-байтовият публичен ключ за самоличност. Идентификаторът на канала не е в обвивката — идва от update.ch с ниво по-нагоре; без него препращане между канали би се хванало само с изпробване на всеки съхранен ключ.",
    tr: "AAD şu dizidir: protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ 32 baytlık kimlik açık anahtarı. Kanal kimliği zarfın içinde değil, bir üstteki update.ch alanından gelir — o olmadan kanallar arası tekrar ancak kayıtlı tüm anahtarları deneyerek yakalanabilirdi.",
    hu: "Az AAD: protocol ‖ 0x7C ‖ channelId ‖ 0x7C ‖ ASCII(epoch) ‖ 0x7C ‖ a 32 bájtos identitás nyilvános kulcs. A csatorna-azonosító nem a borítékban van, hanem egy szinttel feljebb, az update.ch mezőben — nélküle a csatornák közti visszajátszást csak az összes tárolt kulcs kipróbálásával lehetne kiszűrni.",
  },
  {
    en: "The signature covers different bytes again: the AAD layout, then ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. The separators kill an ambiguity — concatenating epoch and nonce plainly makes epoch 1 followed by a nonce starting with “1” byte-identical to epoch 11.",
    ru: "Подпись покрывает другие байты: раскладка AAD, затем ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Разделители снимают неоднозначность: если склеить epoch и nonce напрямую, epoch 1 с nonce, начинающимся на «1», даст ровно те же байты, что epoch 11.",
    de: "Die Signatur deckt wieder andere Bytes: das AAD-Layout, dann ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Die Trenner beseitigen eine Mehrdeutigkeit – epoch und nonce roh aneinandergehängt ergäben für epoch 1 mit einer mit „1“ beginnenden Nonce exakt dieselben Bytes wie für epoch 11.",
    fr: "La signature porte encore sur d’autres octets : la disposition AAD, puis ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Les séparateurs lèvent une ambiguïté — concaténer brutalement epoch et nonce rendrait epoch 1 suivi d’un nonce commençant par « 1 » identique octet pour octet à epoch 11.",
    it: "La firma copre byte ancora diversi: il layout AAD, poi ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. I separatori eliminano un’ambiguità: concatenare epoch e nonce alla cieca renderebbe epoch 1 seguito da un nonce che inizia con “1” identico byte per byte a epoch 11.",
    nl: "De handtekening dekt weer andere bytes: de AAD-indeling, dan ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. De scheidingstekens halen een dubbelzinnigheid weg — epoch en nonce plat aaneenplakken maakt epoch 1 met een nonce die met “1” begint byte-identiek aan epoch 11.",
    cs: "Podpis opět pokrývá jinou bajtovou posloupnost: uspořádání AAD a pak ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Oddělovače odstraňují nejednoznačnost — prosté zřetězení epoch a nonce by učinilo epoch 1 s nonce začínajícím na „1“ bajtově shodným s epoch 11.",
    "zh-Hans": "签名覆盖的是另一串字节：在 AAD 的布局之后再接 ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext。分隔符是为了消除歧义——把 epoch 和 nonce 直接拼起来，epoch 1 配一个开头是 “1” 的 nonce，与 epoch 11 完全同串。",
    "zh-Hant": "簽名覆蓋的是另一串位元組：在 AAD 的佈局之後再接 ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext。分隔符是為了消除歧義——把 epoch 與 nonce 直接串接，epoch 1 配一個開頭是 “1” 的 nonce，與 epoch 11 完全同串。",
    es: "La firma cubre otros bytes distintos: el diseño AAD y después ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Los separadores eliminan una ambigüedad: concatenar epoch y nonce a secas haría que epoch 1 con un nonce que empieza por «1» fuese idéntico byte a byte a epoch 11.",
    pl: "Podpis obejmuje znowu inne bajty: układ AAD, a potem ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Separatory usuwają niejednoznaczność — złączenie epoch i nonce wprost sprawiłoby, że epoch 1 z nonce zaczynającym się od „1” dałby dokładnie te same bajty co epoch 11.",
    ja: "署名がカバーするのはまた別のバイト列で、AAD の並びのあとに ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext を続けたものです。区切り文字は曖昧さを消すためのもので、epoch と nonce をそのまま連結すると、epoch 1 に先頭が「1」の nonce を続けた列が epoch 11 とバイト単位で一致してしまいます。",
    th: "ลายเซ็นครอบคลุมไบต์อีกชุดหนึ่ง: รูปแบบ AAD แล้วต่อด้วย ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext ตัวคั่นช่วยขจัดความกำกวม — ถ้าต่อ epoch กับ nonce ตรง ๆ epoch 1 ที่ตามด้วย nonce ขึ้นต้นด้วย “1” จะให้ไบต์ตรงกับ epoch 11 ทุกตัว",
    fi: "Allekirjoitus kattaa taas eri tavut: AAD-järjestyksen, sitten ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Erotinmerkit poistavat monitulkintaisuuden — epoch ja nonce sellaisenaan peräkkäin liitettynä tekisivät epoch-arvosta 1 ja ”1”:llä alkavalla noncella tavutäsmäisen epoch-arvon 11 kanssa.",
    uk: "Підпис покриває інші байти: компонування AAD, потім ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Роздільники прибирають неоднозначність: якщо зліпити epoch і nonce напряму, epoch 1 з nonce, що починається на «1», дасть ровно той самий байтовий рядок, що й epoch 11.",
    bg: "Подписът покрива отново други байтове: подредбата на AAD, после ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Разделителите премахват двусмислие — обикновеното слепване на epoch и nonce би направило epoch 1 с nonce, започващ с „1“, идентичен байт по байт с epoch 11.",
    tr: "İmza yine başka baytları kapsar: AAD düzeni, ardından ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Ayraçlar bir belirsizliği giderir — epoch ile nonce’u doğrudan bitiştirmek, “1” ile başlayan bir nonce’a sahip epoch 1’i epoch 11 ile bayt düzeyinde aynı yapardı.",
    hu: "Az aláírás ismét más bájtokra szól: az AAD elrendezés, majd ‖ 0x7C ‖ nonce ‖ 0x7C ‖ ciphertext. Az elválasztók egy kétértelműséget szüntetnek meg — az epoch és a nonce puszta összefűzése az epoch 1-et egy „1”-gyel kezdődő nonce-zal bájtonként azonosná tenné az epoch 11-gyel.",
  },
  {
    en: "ciphertext is the ChaCha20-Poly1305 body with the 16-byte tag appended — not the nonce-first combined form; the client splits it back apart with dropLast(16) and suffix(16). The plaintext inside the box is the new epoch key, e.g. {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}, where the optional publicKeyBase64URL means an identity handover and the optional expiresAtMs a promised expiry, as in {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    ru: "ciphertext — это тело ChaCha20-Poly1305 с дописанным 16-байтовым тегом, а не combined-форма с nonce в начале; клиент разбирает её обратно через dropLast(16) и suffix(16). Открытый текст внутри коробки — новый ключ эпохи, например {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; необязательный publicKeyBase64URL означает передачу идентичности, а необязательный expiresAtMs — обещанный срок, как в {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    de: "ciphertext ist der ChaCha20-Poly1305-Rumpf mit angehängtem 16-Byte-Tag — nicht die Nonce-zuerst-Kombinform; der Client trennt ihn mit dropLast(16) und suffix(16) wieder auf. Der Klartext in der Box ist der neue Epochenschlüssel, etwa {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; das optionale publicKeyBase64URL bedeutet eine Identitätsübergabe, das optionale expiresAtMs ein zugesagtes Ablaufdatum, wie in {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    fr: "ciphertext est le corps ChaCha20-Poly1305 suivi du tag de 16 octets — pas la forme combinée avec nonce en tête ; le client le sépare à nouveau avec dropLast(16) et suffix(16). Le clair à l’intérieur de la boîte est la nouvelle clé d’époque, par exemple {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"} ; le publicKeyBase64URL facultatif signale un transfert d’identité et l’expiresAtMs facultatif une échéance promise, comme dans {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    it: "ciphertext è il corpo ChaCha20-Poly1305 con in coda il tag di 16 byte, non la forma combined con nonce in testa; il client lo separa di nuovo con dropLast(16) e suffix(16). Il testo in chiaro dentro la box è la nuova chiave di epoca, ad esempio {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; l’eventuale publicKeyBase64URL indica un passaggio d’identità e l’eventuale expiresAtMs una scadenza promessa, come in {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    nl: "ciphertext is de ChaCha20-Poly1305-body met de 16-byte tag eraan geplakt — niet de combined-vorm met nonce vooraan; de cliënt splitst het weer met dropLast(16) en suffix(16). De leesbare tekst in de doos is de nieuwe epochsleutel, bijvoorbeeld {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; een eventuele publicKeyBase64URL betekent een identiteitsoverdracht en een eventuele expiresAtMs een beloofde vervaldatum, zoals in {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    cs: "ciphertext je tělo ChaCha20-Poly1305 s připojenou 16bajtovou značkou — nikoli combined tvar s nonce na začátku; klient to rozděluje zpět pomocí dropLast(16) a suffix(16). Čistý text uvnitř schránky je nový klíč epochy, třeba {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; volitelný publicKeyBase64URL znamená předání identity a volitelný expiresAtMs slíbený konec platnosti, jako v {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    "zh-Hans": "ciphertext 是 ChaCha20-Poly1305 的密文再接上 16 字节的 tag，不是 nonce 在前的 combined 形式；客户端用 dropLast(16) 与 suffix(16) 拆回来。盒子打开后的明文才是新纪元密钥，例如 {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}；可选的 publicKeyBase64URL 表示身份移交，可选的 expiresAtMs 表示承诺的到期，完整形态是 {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}。",
    "zh-Hant": "ciphertext 是 ChaCha20-Poly1305 的密文再接上 16 位元組的 tag，不是 nonce 在前的 combined 形式；用戶端用 dropLast(16) 與 suffix(16) 拆回來。盒子開啟後的明文才是新紀元密鑰，例如 {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}；可選的 publicKeyBase64URL 代表身分移交，可選的 expiresAtMs 代表承諾的到期，完整形態是 {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}。",
    es: "ciphertext es el cuerpo ChaCha20-Poly1305 con la etiqueta de 16 bytes añadida al final, no la forma combinada con el nonce delante; el cliente la separa de nuevo con dropLast(16) y suffix(16). El texto en claro dentro de la caja es la nueva clave de época, p. ej. {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; un publicKeyBase64URL opcional significa traspaso de identidad y un expiresAtMs opcional un vencimiento prometido, como en {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    pl: "ciphertext to obudowa ChaCha20-Poly1305 z dopisanym 16-bajtowym tagiem, a nie postać combined z nonce na początku; klient rozdziela ją z powrotem przez dropLast(16) i suffix(16). Jawny tekst w środku to nowy klucz epoki, na przykład {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; opcjonalny publicKeyBase64URL oznacza przekazanie tożsamości, a opcjonalny expiresAtMs obiecaną datę wygaśnięcia, jak w {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    ja: "ciphertext は ChaCha20-Poly1305 の本体に 16 バイトの tag を後置きしたもので、nonce を前に置く combined 形式ではありません。クライアントは dropLast(16) と suffix(16) で再び分けます。箱の中の平文が新しいエポック鍵で、例えば {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"} です。任意の publicKeyBase64URL は身分の引き継ぎを、任意の expiresAtMs は約束された失効時刻を意味し、完全な形は {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000} のようになります。",
    th: "ciphertext คือเนื้อ ChaCha20-Poly1305 ที่ต่อท้ายด้วย tag 16 ไบต์ ไม่ใช่รูปแบบ combined ที่มี nonce นำหน้า ไคลเอนต์จะแยกกลับด้วย dropLast(16) และ suffix(16) ข้อความชัดภายในกล่องคือคีย์ epoch ใหม่ เช่น {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"} ส่วน publicKeyBase64URL ที่มีหรือไม่ก็ได้หมายถึงการส่งต่อตัวตน และ expiresAtMs ที่มีหรือไม่ก็ได้หมายถึงวันหมดอายุที่สัญญาไว้ แบบ {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}",
    fi: "ciphertext on ChaCha20-Poly1305-runko perässä olevan 16-tavun tagin kanssa — ei noncen edellä sisältävä combined-muoto; asiakasohjelma pilkoo sen takaisin dropLast(16):lla ja suffix(16):lla. Kopan sisällä oleva selvä teksti on uuden aikakauden avain, esimerkiksi {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; valinnainen publicKeyBase64URL tarkoittaa identiteetin luovutusta ja valinnainen expiresAtMs luvattua vanhenemista, kuten {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    uk: "ciphertext — це тіло ChaCha20-Poly1305 із дописаним 16-байтовим тегом, а не combined-форма з nonce на початку; клієнт розділяє його назад через dropLast(16) та suffix(16). Відкритий текст усередині — новий ключ епохи, наприклад {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; необов’язковий publicKeyBase64URL означає передачу ідентичності, а необов’язковий expiresAtMs — обіцяний термін, як у {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    bg: "ciphertext е тялото на ChaCha20-Poly1305 с добавен 16-байтов маркер — не combined формата с nonce отпред; клиентът го разделя обратно с dropLast(16) и suffix(16). Отвореният текст в кутията е новият ключ на епохата, напр. {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; незадължителният publicKeyBase64URL означава прехвърляне на самоличност, а незадължителният expiresAtMs — обещано изтичане, както в {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000}.",
    tr: "ciphertext, sonuna 16 baytluk tag eklenmiş ChaCha20-Poly1305 gövdesidir — başta nonce bulunan combined biçimi değil; istemci bunu dropLast(16) ve suffix(16) ile ayırır. Kutunun içindeki düz metin yeni dönem anahtarıdır, örneğin {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; isteğe bağlı publicKeyBase64URL kimlik devrini, isteğe bağlı expiresAtMs ise vaat edilen sona ermeyi belirtir, {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000} örneğinde olduğu gibi.",
    hu: "a ciphertext a ChaCha20-Poly1305 törzs a végére fűzött 16 bájtos címkével — nem az elején nonce-ot tartalmaz combined alak; az ügyfél a dropLast(16) és suffix(16) hívásokkal bontja szét újra. A dobozban lévő nyílt szöveg az új epochakulcs, például {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\"}; az opcionális publicKeyBase64URL személyiségátadást, az opcionális expiresAtMs ígért lejárati időt jelent, mint a {\"epoch\":3,\"keyBase64URL\":\"ISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A\",\"publicKeyBase64URL\":\"AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA\",\"expiresAtMs\":1775001600000} példában.",
  },
  {
    en: "The client's isSane flatly requires se != env.epoch: a rotation frame must be sealed under the OLD epoch. Decrypting yourself with the key you are replacing leaves no way to detect a replay. Both epoch and se run from 1 to 1000000.",
    ru: "Проверка isSane в клиенте безусловно требует se != env.epoch: фрейм ротации должен быть запечатан под СТАРОЙ эпохой. Если расшифровать себя тем ключом, который вы меняете, отличить повтор невозможно. И epoch, и se лежат в диапазоне от 1 до 1000000.",
    de: "Das isSane des Clients verlangt ausdrücklich se != env.epoch: ein Rotations-Frame muss unter dem ALTEN Epoch versiegelt sein. Wer sich mit dem Schlüssel, den er ersetzt, selbst entschlüsselt, kann kein Replay erkennen. Sowohl epoch als auch se laufen von 1 bis 1000000.",
    fr: "Le isSane du client exige sans discussion se != env.epoch : une trame de rotation doit être scellée sous l’ANCIENNE époque. Se déchiffrer avec la clé que l’on remplace ne laisse aucun moyen de détecter un rejeu. epoch comme se vont de 1 à 1000000.",
    it: "L’isSane del client richiede senza sconti se != env.epoch: un frame di rotazione deve essere sigillato sotto la VECCHIA epoca. Decifrare sé stessi con la chiave che si sta sostituendo non lascia alcun modo di rilevare un replay. Sia epoch sia se vanno da 1 a 1000000.",
    nl: "De isSane van de cliënt eist zonder aarzelen se != env.epoch: een rotatieframe moet onder de OUDE epoch verzegeld zijn. Jezelf ontsleutelen met de sleutel die je vervangt, laat geen enkele mogelijkheid om een replay te zien. Zowel epoch als se lopen van 1 tot 1000000.",
    cs: "Klientské isSane bez výhrad vyžaduje se != env.epoch: rotační snímek musí být zapečetěn pod STARŠÍ epochou. Vlastní dešifrování klíčem, který měníte, nenechává žádnou možnost odhalit opakování. epoch i se jdou od 1 do 1000000.",
    "zh-Hans": "客户端的 isSane 硬性要求 se != env.epoch：轮换帧必须用旧纪元密封。用要换掉的那把钥匙解开自己，就等于没有重放检测。epoch 与 se 的取值范围都是 1 到 1000000。",
    "zh-Hant": "用戶端的 isSane 硬性要求 se != env.epoch：輪換訊框必須用舊紀元封存。用要換掉的那把鑰匙解開自己，就等於沒有重放檢測。epoch 與 se 的取值範圍都是 1 到 1000000。",
    es: "El isSane del cliente exige sin matices se != env.epoch: una trama de rotación debe ir sellada bajo la epoch ANTERIOR. Descifrarse a una misma con la clave que se reemplaza deja sin forma de detectar una reproducción. Tanto epoch como se van de 1 a 1000000.",
    pl: "Klienckie isSane bezwarunkowo wymaga se != env.epoch: ramka rotacji musi być zapieczętowana pod STARĄ epoką. Odszyfrowywanie siebie klucz, który wymieniasz, nie pozostawia sposobu wykrycia powtórki. Zarówno epoch, jak i se mieszczą się od 1 do 1000000.",
    ja: "クライアントの isSane は se != env.epoch を絶対条件としています。ローテーションフレームは古いエポックで封をする必要があります。置き換える鍵で自分自身を復号してしまっては、再生攻撃を検出する手がかりが残らないからです。epoch も se も 1 から 1000000 の範囲です。",
    th: "isSane ของไคลเอนต์บังคับแบบไม่มีข้อยกเว้นว่า se != env.epoch: เฟรมการหมุนเวียนต้องผนึกด้วย epoch เก่า ถ้าเอาคีย์ที่กำลังจะถูกเปลี่ยนมาถอดรหัสตัวเอง ก็จะไม่มีทางตรวจจับการเล่นซ้ำได้เลย ทั้ง epoch และ se อยู่ในช่วง 1 ถึง 1000000",
    fi: "Asiakasohjelman isSane vaatii ehdottomasti se != env.epoch: vaihtokehys on sinetöitävä VANHAN aikakauden alle. Avaimella, joka ollaan korvaamassa, itsensä purkaminen ei jätä mitään keinoa havaita toistoa. Sekä epoch että se käyvät arvoja 1 – 1000000.",
    uk: "Клієнтська перевірка isSane беззастережно вимагає se != env.epoch: фрейм ротації має бути запечатаний під СТАРОЮ епохою. Розшифрувати себе тим самим ключем, який ви замінюєте, — значить не мати способу виявити відтворення. І epoch, і se мають значення від 1 до 1000000.",
    bg: "Клиентското isSane изисква категорично se != env.epoch: кадровът на ротация трябва да е запечатан под СТАРАТА епоха. Дешифрирането със самия ключ, който заменяш, не оставя начин да се засече препращане. И epoch, и se са в диапазона 1 до 1000000.",
    tr: "İstemcinin isSane kontrolüsü kayıtsız şartsız se != env.epoch ister: bir döngü çerçevesi ESKİ dönemle mühürlenmiş olmalıdır. Değiştirdiğiniz anahtarla kendinizi çözmek, tekrarı tespit etmenin hiçbir yolunu bırakmaz. Hem epoch hem de se 1 ile 1000000 arasındadır.",
    hu: "Az ügyfél isSane ellenőrzése feltétlenül megköveteli, hogy se != env.epoch: a rotációs frame-et a RÉGI epocha alá kell lepecsételni. Ha a kicserélt kulccsal fejted magad, nem marad mód a visszajátszás észlelésére. Az epoch és a se is 1 és 1000000 között lehet.",
  },
  {
    en: "Outside the envelope sits the ku frame, whose update object carries exactly four keys — ch, se, rp and env — and the ku frame printed above this list is one complete instance of it (ch is \"announcements\", se is 2, rp is false, env is the envelope JSON shown above). rp=true revokes every epoch older than the new one. The key never appears in plaintext — a relay only ever sees base64.",
    ru: "Снаружи конверта стоит фрейм ku: объект update содержит ровно четыре ключа — ch, se, rp и env, — и пример ku-фрейма выше в этом списке есть его полный экземпляр (ch = \"announcements\", se = 2, rp = false, env = показанный выше JSON-конверт). rp=true отзывает все эпохи старше новой. Ключ никогда не появляется в открытом виде — релей видит только base64.",
    de: "Außerhalb des Umschlags liegt der ku-Frame: Das update-Objekt trägt genau vier Schlüssel – ch, se, rp und env – und der ku-Frame oben in dieser Liste ist eine vollständige Instanz davon (ch ist \"announcements\", se ist 2, rp ist false, env ist der oben gezeigte Umschlag-JSON). rp=true widerruft alle Epochen vor der neuen. Der Schlüssel taucht nie im Klartext auf – ein Relay sieht nur base64.",
    fr: "Autour de l’enveloppe se trouve la trame ku : son objet update porte exactement quatre clés — ch, se, rp et env — et la trame ku imprimée plus haut dans cette liste en est un exemplaire complet (ch vaut \"announcements\", se vaut 2, rp vaut false, env est le JSON d’enveloppe affiché ci-dessus). rp=true révoque toutes les époques antérieures à la nouvelle. La clé n’apparaît jamais en clair — un relais ne voit que du base64.",
    it: "Fuori dalla busta c’è il frame ku: l’oggetto update porta esattamente quattro chiavi — ch, se, rp ed env — e il frame ku mostrato sopra in questo elenco ne è un’istanza completa (ch è \"announcements\", se è 2, rp è false, env è il JSON della busta mostrato sopra). rp=true revoca tutte le epoche precedenti alla nuova. La chiave non appare mai in chiaro — un relay vede solo base64.",
    nl: "Buiten de omslag zit het ku-frame: het update-object draagt precies vier sleutels — ch, se, rp en env — en het ku-frame hierboven in deze lijst is er een volledig voorbeeld van (ch is \"announcements\", se is 2, rp is false, env is de hierboven getoonde omslag-JSON). rp=true herroept elke epoch ouder dan de nieuwe. De sleutel verschijnt nooit in leesbare tekst — een relay ziet alleen base64.",
    cs: "Mimo obálku je snímek ku: objekt update nese právě čtyři klíče — ch, se, rp a env — a snímek ku vytištěný výše v tomto seznamu je jeho úplným exemplářem (ch je \"announcements\", se je 2, rp je false, env je výše uvedený JSON obálky). rp=true odvolá všechny epochy starší než nová. Klíč se nikdy neobjeví v čistém textu — relé vidí pouze base64.",
    "zh-Hans": "信封外面是 ku 帧，它的 update 对象只有四个键——ch、se、rp、env——本页上方那条 ku 帧样例就是它的完整实例（ch 是 \"announcements\"，se 是 2，rp 是 false，env 就是上面那份信封 JSON）。rp=true 表示撤销比新纪元更早的所有密钥。密钥永远不出现在明文里，中继看到的只有 base64。",
    "zh-Hant": "信封外面是 ku 訊框，它的 update 物件只有四個鍵——ch、se、rp、env——本頁上方那條 ku 訊框範例就是它的完整實例（ch 是 \"announcements\"，se 是 2，rp 是 false，env 就是上面那份信封 JSON）。rp=true 表示撤銷比新紀元更早的所有密鑰。密鑰永遠不出現在明文裡，中繼看到的只有 base64。",
    es: "Fuera del sobre está la trama ku: su objeto update lleva exactamente cuatro claves — ch, se, rp y env — y la trama ku impresa arriba en esta lista es una instancia completa (ch vale \"announcements\", se vale 2, rp vale false y env es el JSON del sobre mostrado arriba). rp=true revoca todas las épocas anteriores a la nueva. La clave nunca aparece en claro: un relé solo ve base64.",
    pl: "Na zewnątrz koperty jest ramka ku: obiekt update zawiera dokładnie cztery klucze — ch, se, rp i env — a ramka ku wypisana wyżej w tym zestawieniu jest jej pełnym egzemplarzem (ch to \"announcements\", se to 2, rp to false, env to pokazany wyżej JSON koperty). rp=true unieważnia wszystkie epoki starsze niż nowa. Klucz nigdy nie pojawia się jawnie — przekaźnik widzi tylko base64.",
    ja: "エンベロープの外側には ku フレームがあります。update オブジェクトが持つキーは ch、se、rp、env の 4 つだけで、この一覧の上に表示してある ku フレームがその完全なインスタンスです（ch は \"announcements\"、se は 2、rp は false、env は上に出ている信封 JSON）。rp=true は新しいエポックより古いエポックをすべて失効させます。鍵が平文で現れることはなく、リレーに見えるのは base64 だけです。",
    th: "นอกซองคือเฟรม ku ซึ่งอ็อบเจ็กต์ update มีคีย์เพียงสี่ตัว — ch, se, rp และ env — และเฟรม ku ที่แสดงไว้ด้านบนของรายการนี้คือตัวอย่างสมบูรณ์ของมัน (ch คือ \"announcements\", se คือ 2, rp คือ false, env คือ JSON ซองที่แสดงไว้ข้างบน) rp=true จะเพิกถอนทุก epoch ที่เก่ากว่า epoch ใหม่ คีย์จะไม่ปรากฏเป็นข้อความชัดเลย รีเลย์จะเห็นเพียง base64",
    fi: "Kirjekuoren ulkopuolella on ku-kehys: update-olio sisältää täsmälleen neljä avainta — ch, se, rp ja env — ja tämän luettelon yläpuolella näkyvä ku-kehys on siitä täydellinen esimerkki (ch on \"announcements\", se on 2, rp on false ja env on yllä oleva kirjekuorin JSON). rp=true peruu kaikki uutta aikakautta vanhemmat. Avain ei koskaan näy selvänä tekstinä — relay näkee vain base64-muodon.",
    uk: "Поза конвертом стоїть фрейм ku: об’єкт update містить рівно чотири ключі — ch, se, rp і env, — а фрейм ku, наведений вище в цьому переліку, є його повним екземпляром (ch дорівнює \"announcements\", se дорівнює 2, rp дорівнює false, env — це наведений вище JSON конверта). rp=true відкликає всі епохи старіші за нову. Ключ ніколи не з’являється у відкритому вигляді — релей бачить лише base64.",
    bg: "Извън обвивката е ku кадровът: обектът update носи точно четири ключа — ch, se, rp и env — а ku кадрът, изписан по-горе в този списък, е негов пълен екземпляр (ch е \"announcements\", se е 2, rp е false, env е показаният по-горе JSON на обвивката). rp=true отменя всички епохи по-стари от новата. Ключът никога не се появява в чист текст — рележда само base64.",
    tr: "Zarfın dışında ku çerçevesi bulunur: update nesnesinde tam olarak dört anahtar vardır — ch, se, rp ve env — ve bu listenin üstünde basılan ku çerçevesi onun eksiksiz bir örneğidir (ch \"announcements\", se 2, rp false, env yukarıda gösterilen zarf JSON’u). rp=true, yenisinden eski tüm dönemleri iptal eder. Anahtar asla düz metin olarak görünmez — röle yalnızca base64 görür.",
    hu: "A borítékán kívül áll a ku frame: az update objektum pontosan négy kulcsot tartalmaz — ch, se, rp és env — és a lista felett látható ku frame ennek egy teljes példánya (ch értéke \"announcements\", se értéke 2, rp értéke false, env a fenti boríték-JSON). Az rp=true minden újabb epochánál régebbi epochát visszavon. A kulcs soha nem jelenik meg nyílt szövegként — az átjátszó csak base64-et lát.",
  },
];

const CARD_TITLE: Localized<string> = {
  en: "The ::POPOPX_ECO:: card protocol",
  ru: "Протокол карточек ::POPOPX_ECO::",
  de: "Das ::POPOPX_ECO:: Kartenprotokoll",
  fr: "Le protocole de carte ::POPOPX_ECO::",
  it: "Il protocollo delle card ::POPOPX_ECO::",
  nl: "Het ::POPOPX_ECO:: kaartprotocol",
  cs: "Kartový protokol ::POPOPX_ECO::",
  "zh-Hans": "::POPOPX_ECO:: 卡片协议",
  "zh-Hant": "::POPOPX_ECO:: 卡片協議",
  es: "El protocolo de tarjetas ::POPOPX_ECO::",
  pl: "Protokół kart ::POPOPX_ECO::",
  ja: "::POPOPX_ECO:: カードプロトコル",
  th: "โปรโตคอลการ์ด ::POPOPX_ECO::",
  fi: "::POPOPX_ECO:: korttaprotokolla",
  uk: "Протокол карток ::POPOPX_ECO::",
  bg: "Картовият протокол ::POPOPX_ECO::",
  tr: "::POPOPX_ECO:: kart protokolü",
  hu: "A ::POPOPX_ECO:: kártyaprotokoll",
};

const CARD_LABEL: Localized<string> = {
  en: "The sc card frame",
  ru: "Фрейм карточки sc",
  de: "Der sc-Kartenframe",
  fr: "La trame de carte sc",
  it: "Il frame card sc",
  nl: "Het sc kaartframe",
  cs: "Snímek karty sc",
  "zh-Hans": "卡片帧 sc",
  "zh-Hant": "卡片訊框 sc",
  es: "La trama de tarjeta sc",
  pl: "Ramka karty sc",
  ja: "sc カードフレーム",
  th: "เฟรมการ์ด sc",
  fi: "sc-korttikehys",
  uk: "Фрейм картки sc",
  bg: "sc картеният кадър",
  tr: "sc kart çerçevesi",
  hu: "Az sc kártya-frame",
};

const MENU_LABEL: Localized<string> = {
  en: "The mc menu frame",
  ru: "Фрейм меню mc",
  de: "Der mc-Menüframe",
  fr: "La trame de menu mc",
  it: "Il frame menu mc",
  nl: "Het mc menuframe",
  cs: "Snímek nabídky mc",
  "zh-Hans": "菜单帧 mc",
  "zh-Hant": "菜單訊框 mc",
  es: "La trama de menú mc",
  pl: "Ramka menu mc",
  ja: "mc メニューフレーム",
  th: "เฟรมเมนู mc",
  fi: "mc-valikkokehys",
  uk: "Фрейм меню mc",
  bg: "mc менюният кадър",
  tr: "mc menü çerçevesi",
  hu: "Az mc menüframe",
};

const HANDSHAKE_LABEL: Localized<string> = {
  en: "The sh handshake frame",
  ru: "Фрейм рукопожатия sh",
  de: "Der sh-Handshake-Frame",
  fr: "La trame de poignée de main sh",
  it: "Il frame di handshake sh",
  nl: "Het sh handshakeframe",
  cs: "Snímek handshake sh",
  "zh-Hans": "握手帧 sh",
  "zh-Hant": "握手訊框 sh",
  es: "La trama de apretón de manos sh",
  pl: "Ramka powitania sh",
  ja: "sh ハンドシェイクフレーム",
  th: "เฟรมจับมือ sh",
  fi: "sh-kädenpuristukehys",
  uk: "Фрейм рукостискання sh",
  bg: "sh ръкостискане кадър",
  tr: "sh el sıkışma çerçevesi",
  hu: "Az sh kézfogás frame",
};

const CARD_RULES: readonly Localized<string>[] = [
  {
    en: "A frame is the marker ::POPOPX_ECO:: immediately followed by one line of compact JSON — no padding spaces, no line break. Four types: sc card, sh handshake, mc menu, ku key rotation. Except for a brand-new card, the frame must be the whole message: append a sentence and the client drops it silently.",
    ru: "Кадр — это маркер ::POPOPX_ECO:: и сразу строка компактного JSON: без лишних пробелов, без переноса. Типа четыре: sc-карточка, sh-рукопожатие, mc-меню, ku-ротация ключей. Кроме новой карточки кадр обязан быть всем сообщением — добавьте следом предложение, и клиент молча выбросит всё.",
    de: "Ein Rahmen ist die Marke ::POPOPX_ECO:: und direkt danach eine Zeile kompaktes JSON — ohne Leerzeichen-Polster, ohne Umbruch. Vier Typen: sc-Karte, sh-Handschlag, mc-Menü, ku-Schlüsselrotation. Außer bei einer neuen Karte muss der Rahmen die ganze Nachricht sein: ein angehängter Satz, und der Client verwirft sie still.",
    fr: "Une trame est le marqueur ::POPOPX_ECO:: suivi immédiatement d'une ligne de JSON compact — sans espaces inutiles, sans saut de ligne. Quatre types : carte sc, poignée de main sh, menu mc, rotation de clés ku. Sauf carte entièrement nouvelle, la trame doit être le message entier : ajoutez une phrase et le client l'écarte silencieusement.",
    it: "Un frame è il marcatore ::POPOPX_ECO:: seguito subito da una riga di JSON compatto — senza spazi di riempimento, senza a capo. Quattro tipi: carta sc, handshake sh, menu mc, rotazione chiavi ku. Tranne una carta nuova di zecca, il frame deve essere l'intero messaggio: aggiungi una frase e il client lo scarta in silenzio.",
    nl: "Een frame is de markering ::POPOPX_ECO:: met direct daarna één regel compacte JSON — geen vulspaties, geen regeleinde. Vier types: sc-kaart, sh-handshake, mc-menu, ku-sleutelrotatie. Behalve een spiksplinternieuwe kaart moet het frame het hele bericht zijn: plak er een zin achter en de cli verwijdert het stilzwijgend.",
    cs: "Rámec je značka ::POPOPX_ECO:: a hned za ní jeden řádek kompaktního JSON — nic navíc, žádný zalomení řádku. Čtyři typy: karta sc, handshake sh, menu mc, rotace klíčů ku. Kromě tamamen nové karty musí být rámec celá zpráva: přidejte větu a klient celou zprávu tiše zahodí.",
    "zh-Hans": "帧 = 标记 ::POPOPX_ECO:: 紧接一行紧凑 JSON，没有多余空格、没有换行。四种类型：sc 卡片、sh 握手、mc 菜单、ku 密钥轮换。除新建卡片外，帧必须是整条消息——尾巴上多一句人话，客户端会整条丢掉且不报错。",
    "zh-Hant": "訊框 = 標記 ::POPOPX_ECO:: 緊接一行緊湊 JSON，沒有多餘空格、沒有換行。四種類型：sc 卡片、sh 握手、mc 選單、ku 金鑰輪替。除新建卡片外，訊框必須是整則訊息——尾巴上多一句人話，用戶端會整則丟掉且不報錯。",
    es: "Un fotograma es el marcador ::POPOPX_ECO:: seguido al instante por una línea de JSON compacto — sin espacios de relleno, sin salto de línea. Cuatro tipos: tarjeta sc, saludo sh, menú mc, rotación de claves ku. Salvo una tarjeta recién creada, el fotograma debe ser el mensaje entero: añade una frase y el cliente lo descarta en silencio.",
    pl: "Ramka to znacznik ::POPOPX_ECO:: i zaraz potem jeden wiersz zwięzłego JSON — bez zbędnych spacji, bez łamania wiersza. Cztery typy: karta sc, uścisk dłoni sh, menu mc, rotacja kluczy ku. Poza zupełnie nową kartą ramka musi być całą wiadomością: dopisz zdanie, a klient bez ostrzeżenia wyrzuci wszystko.",
    ja: "フレームはマーカー ::POPOPX_ECO:: の直後にコンパクトな JSON を 1 行続けたもので、余分な空白も改行もない。種類は 4 つ：sc カード、sh ハンドシェイク、mc メニュー、ku 鍵のローテーション。新規作成のカード以外、フレームはメッセージ全体でなければならず、文末にひと言足した瞬間、クライアントはエラーも出さずに破棄する。",
    th: "เฟรมคือเครื่องหมาย ::POPOPX_ECO:: ตามด้วย JSON แบบกระชับหนึ่งบรรทัดทันที ไม่มีช่องว่างส่วนเกิน ไม่มีขึ้นบรรทัดใหม่ มีสี่แบบ: การ์ด sc, จับมือ sh, เมนู mc, หมุนกุญแจ ku ยกเว้นการ์ดที่สร้างใหม่ทั้งหมด เฟรมต้องเป็นข้อความทั้งก้อน — ต่อท้ายด้วยประโยคเดียวแล้วไคลเอนต์จะทิ้งทั้งข้อความโดยไม่รายงาน error",
    fi: "Kehys on merkki ::POPOPX_ECO:: ja heti perään tiivis JSON rivityksinä — ei täytevalkoja, ei rivinvaihtoa. Tyyppejä neljä: sc-kortti, sh-kädenpuristus, mc-valikko, ku-avaimen kierrätys. Paitsi aivan uuden kortin, kehyksen on oltava koko viesti: lisää perään lause, niin asiakas hylkää viestin ilman virheilmoitusta.",
    uk: "Кадр — це маркер ::POPOPX_ECO:: і відразу рядок компактного JSON: без зайвих пробілів, без перенесення. Типи чотири: картка sc, рукостискання sh, меню mc, ротація ключів ku. Окрім щойно створеної картки, кадр має бути цілим повідомленням: допишіть речення — і клієнт мовчки викине все.",
    bg: "Кадърът е маркерът ::POPOPX_ECO:: и веднага след него един ред компактен JSON — без подравняващи интервали, без пренасяне. Четири вида: sc карта, sh ръкостискане, mc меню, ku смяна на ключове. Освен напълно нова карта, кадрът трябва да е цялото съобщение — добавете изказ и клиентът го изхвърля мълчаливо.",
    tr: "Bir çerçeve, ::POPOPX_ECO:: işaretinin hemen ardından gelen tek satır sıkışık JSON demektir — dolgu boşluğu yok, satır sonu yok. Dört tür: sc kartı, sh el sıkışma, mc menüsü, ku anahtar dönüşümü. Sıfırdan oluşturulan kart dışında çerçeve bütün mesaj olmak zorundadır: sonuna bir cümle eklersen istemci mesajı sessizce çöpe atar.",
    hu: "A keret a ::POPOPX_ECO:: jelölés és közvetlenül utána egy sor tömör JSON — nincs kitöltő szóköz, nincs sortörés. Négy típus: sc kártya, sh kézfogás, mc menü, ku kulcscsere. Az egészen új kártyán kívül a keretnek az egész üzenetnek kell lennie: szúrjelé a végére egy mondatot, és a kliens néma csendben eldobja.",
  },
  {
    en: "A card frame is {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Order paid\",\"ut\":1767225600123}} or the same with \"m\":\"u\". m=c renders a new bubble; m=u replaces the same card in place by card id — that is the mechanism behind a vote's progress bar moving without a second message. If any of id, v, title or ut is missing, the card does not render degraded, it does not exist.",
    ru: "Кадр карточки — {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Заказ оплачен\",\"ut\":1767225600123}} или тот же с \"m\":\"u\". m=c даёт новый пузырёк, m=u на месте заменяет ту же карточку по id — именно так полоса голосования сдвигается, не порождая второго сообщения. Не хватает любого из id, v, title, ut — и карточка не «ухудшается», её просто нет.",
    de: "Ein Kartenrahmen ist {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Bestellung bezahlt\",\"ut\":1767225600123}} oder derselbe mit \"m\":\"u\". m=c erzeugt eine neue Blase, m=u ersetzt dieselbe Karte an Ort und Stelle per card id — dahinter rückt der Fortschrittsbalken einer Abstimmung, ohne eine zweite Nachricht zu erzeugen. Fehlt auch nur id, v, title oder ut, wird die nicht schlecht gerendert — sie existiert schlicht nicht.",
    fr: "Une trame de carte, c'est {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Commande payée\",\"ut\":1767225600123}} ou la même avec \"m\":\"u\". m=c dessine une nouvelle bulle ; m=u remplace sur place la même carte grâce à card id — c'est ainsi que la barre de progression d'un vote bouge sans second message. S'il manque id, v, title ou ut, la carte ne s'affiche pas dégradée, elle n'existe pas.",
    it: "Un frame di carta è {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Ordine pagato\",\"ut\":1767225600123}} oppure lo stesso con \"m\":\"u\". m=c disegna una nuova bolla; m=u sostituisce sul posto la stessa carta tramite card id — è così che la barra di avanzamento di un voto si muove senza un secondo messaggio. Se manca uno fra id, v, title e ut, la carta non viene renderizzata male: non esiste.",
    nl: "Een kaartframe is {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Bestelling betaald\",\"ut\":1767225600123}} of hetzelfde met \"m\":\"u\". m=c tekent een nieuwe bubble; m=u vervangt ter plekke dezelfde kaart op card id — zo beweegt de voortgangsbalk van een stemming zonder tweede bericht. Ontbreekt een van id, v, title of ut, dan wordt de kaart niet slecht getekend, dan bestaat hij niet.",
    cs: "Rámec karty je {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Objednávka zaplacena\",\"ut\":1767225600123}} nebo stejný s \"m\":\"u\". m=c vykreslí novou bublinu, m=u na místě vymění tutéž kartu podle card id — tak se posune ukazatel hlasování bez druhé zprávy. Chybí-li id, v, title nebo ut, karta se nezobrazí ořezaně — ona vůbec neexistuje.",
    "zh-Hans": "卡片帧是 {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"订单已支付\",\"ut\":1767225600123}}，也可以是同一份把 m 写成 \"u\"。m=c 新建一个气泡，m=u 按 cardId 原地替换同一张卡——这就是投票进度条「动了一下而没有多出消息」的机制。id、v、title、ut 四个键缺一个，卡片不是降级渲染，而是不存在。",
    "zh-Hant": "卡片訊框是 {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"訂單已付款\",\"ut\":1767225600123}}，也可以是同一份把 m 寫成 \"u\"。m=c 新建一個氣泡，m=u 依 cardId 原地取代同一張卡——這就是投票進度條「動了一下而沒有多出訊息」的機制。id、v、title、ut 四個鍵缺一個，卡片不是降級轉譯，而是不存在。",
    es: "Un fotograma de tarjeta es {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Pedido pagado\",\"ut\":1767225600123}} o el mismo con \"m\":\"u\". m=c dibuja una burbuja nueva; m=u reemplaza en el sitio la misma tarjeta por card id — así la barra de progreso de una votación avanza sin generar un segundo mensaje. Si falta id, v, title o ut, la tarjeta no se muestra degradada: no existe.",
    pl: "Ramka karty to {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Zamówienie opłacone\",\"ut\":1767225600123}} albo ta sama z \"m\":\"u\". m=c rysuje nową dymkę, m=u podmienia w miejscu tę samą kartę po card id — tak pasek postępu głosowania przesuwa się bez drugiej wiadomości. Jeśli brakuje id, v, title albo ut, karta nie renderuje się byle jak — ona po prostu nie istnieje.",
    ja: "カードのフレームは {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"注文は支払い済み\",\"ut\":1767225600123}}、または同じもので m が \"u\"。m=c は新しいバブルを描き、m=u は card id を使って同じカードをその場で差し替える——投票の進捗バーが「動いたのにメッセージ増えない」のはこの仕組みだ。id・v・title・ut のひとつでも欠ければ、カードは劣化表示にはならず、存在しなくなる。",
    th: "เฟรมการ์ดคือ {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"ชำระคำสั่งซื้อแล้ว\",\"ut\":1767225600123}} หรือแบบเดียวกันที่ m เป็น \"u\" — m=c วาดบับเบิลใบใหม่, m=u แทนที่การ์ดเดิมบนที่เดิมด้วย card id นี่คือกลไกที่ทำให้แถบความคืบหน้าของการโหวต «ขยับนิดเดียวโดยไม่มีข้อความเพิ่ม» ถ้าขาด id, v, title หรือ ut สักหนึ่งการ์ดจะไม่แสดงแบบด้อยลง — แต่จะไม่แสดงเลย",
    fi: "Korttikehys on {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Tilaus maksettu\",\"ut\":1767225600123}} tai sama kehyksellä \"m\":\"u\". m=c piirtää uuden kuplan; m=u korvaa saman kortin paikan päällä card id:llä — näin äänestyksen etenemispalkki liikkuu ilman toista viestiä. Jos id, v, title tai ut puuttuu, korttia ei piirretä huonontuneena, sitä ei ole olemassa.",
    uk: "Кадр картки — {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Замовлення оплачено\",\"ut\":1767225600123}} або той самий із \"m\":\"u\". m=c малює нову бульбашку, m=u на місці замінює ту саму картку за card id — так смужка прогресу голосування рухається, не створюючи другого повідомлення. Бракує id, v, title чи ut — картка не відмальовується гірше, її просто не існує.",
    bg: "Кадрът на карта е {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Поръчката е платена\",\"ut\":1767225600123}} или същият с \"m\":\"u\". m=c рисува нов балон; m=u замества на място същата карта по card id — така лентата на прогреса при гласуване мърдва без второ съобщение. Ако липсва id, v, title или ut, картата не се изобразява влошено — тя не съществува.",
    tr: "Kart çerçevesi şudur: {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"Sipariş ödendi\",\"ut\":1767225600123}} ya da aynısının \"m\":\"u\" hâli. m=c yeni bir balon oluşturur; m=u aynı kartı card id ile yerinde değiştirir — oylamanın ilerleme çubuğunun ikinci mesaj üretmeden hareket etmesinin sebebi bu. id, v, title veya ut'dan biri eksikse kart bozuk çizilmez, hiç var olmaz.",
    hu: "A kártyakeret {\"t\":\"sc\",\"m\":\"c\",\"card\":{\"id\":\"order-2026-0417\",\"v\":\"receipt\",\"title\":\"A rendelés kifizetve\",\"ut\":1767225600123}}, vagy ugyanaz \"m\":\"u\"-val. Az m=c új buborékot rajzol; az m=u ugyanazt a kártyát helyben cseréli ki a card id alapján — így mozdul meg egy szavazás haladássávja második üzenet nélkül. Ha az id, a v, a title vagy az ut hiányzik, a kártya nem romlottan jelenik meg, hanem egyáltalán nem létezik.",
  },
  {
    en: "The card's wire keys are exactly these short names: id, v (style), title, ut (millisecond timestamp), body, fields:[{k,v,mono}], progress:{l,p,d}, actions and et (expiry in milliseconds). Three styles: standard for announcements, receipt for a key/value grid, security for consent and alerts.",
    ru: "Проводные ключи карточки — ровно эти короткие имена: id, v (стиль), title, ut (метка времени в миллисекундах), body, fields:[{k,v,mono}], progress:{l,p,d}, actions и et (срок в миллисекундах). Стиля три: standard для объявлений, receipt для таблицы «ключ — значение», security для согласий и тревог.",
    de: "Die Wire-Keys der Karte sind genau diese Kurznamen: id, v (Stil), title, ut (Millisekunden-Timestamp), body, fields:[{k,v,mono}], progress:{l,p,d}, actions und et (Ablauf in Millisekunden). Drei Stile: standard für Ansagen, receipt für ein Schlüssel/Wert-Raster, security für Einwilligung und Warnungen.",
    fr: "Les clés de transmission de la carte sont exactement ces noms courts : id, v (style), title, ut (horodatage en millisecondes), body, fields:[{k,v,mono}], progress:{l,p,d}, actions et et (expiration en millisecondes). Trois styles : standard pour les annonces, receipt pour une grille clé/valeur, security pour le consentement et les alertes.",
    it: "Le chiavi wire della carta sono esattamente questi nomi corti: id, v (stile), title, ut (timestamp in millisecondi), body, fields:[{k,v,mono}], progress:{l,p,d}, actions ed et (scadenza in millisecondi). Tre stili: standard per gli annunci, receipt per una griglia chiave/valore, security per consensi e avvisi.",
    nl: "De wire-sleutels van de kaart zijn precies deze korte namen: id, v (stijl), title, ut (millisecondetijdstempel), body, fields:[{k,v,mono}], progress:{l,p,d}, actions en et (verval in milliseconden). Drie stijlen: standard voor mededelingen, receipt voor een sleutel/waarderooster, security voor toestemming en waarschuwingen.",
    cs: "Wire-názvy karty jsou přesně tyto krátké názvy: id, v (styl), title, ut (časové razítko v milisekundách), body, fields:[{k,v,mono}], progress:{l,p,d}, actions a et (platnost v milisekundách). Tři styly: standard pro oznámení, receipt pro matici klíč/hodnota, security pro souhlasy a výstrahy.",
    "zh-Hans": "卡片的 wire 键位就是这些短名：id、v（样式）、title、ut（毫秒时间戳）、body、fields:[{k,v,mono}]、progress:{l,p,d}、actions、et（过期毫秒）。样式三种：standard 公告、receipt 键值表、security 授权与告警。",
    "zh-Hant": "卡片的 wire 鍵位就是這些短名：id、v（樣式）、title、ut（毫秒時間戳）、body、fields:[{k,v,mono}]、progress:{l,p,d}、actions、et（過期毫秒）。樣式三種：standard 公告、receipt 鍵值表、security 授權與告警。",
    es: "Las claves de transmisión de la tarjeta son exactamente estos nombres cortos: id, v (estilo), title, ut (marca de tiempo en milisegundos), body, fields:[{k,v,mono}], progress:{l,p,d}, actions y et (caducidad en milisegundos). Tres estilos: standard para anuncios, receipt para una rejilla clave/valor, security para consentimientos y alertas.",
    pl: "Klucze on-wire karty to dokładnie te krótkie nazwy: id, v (styl), title, ut (znacznik czasu w milisekundach), body, fields:[{k,v,mono}], progress:{l,p,d}, actions oraz et (wygaśnięcie w milisekundach). Trzy style: standard dla ogłoszeń, receipt dla tabeli klucz/wartość, security dla zgód i alertów.",
    ja: "カードの wire キーはこの短い名前どおり：id、v（スタイル）、title、ut（ミリ秒タイムスタンプ）、body、fields:[{k,v,mono}]、progress:{l,p,d}、actions、et（ミリ秒単位の有効期限）。スタイルは 3 種：standard が告知、receipt がキー／値の表、security が認可と警告。",
    th: "คีย์บนสายของการ์ดชื่อสั้น ๆ เท่านี้: id, v (สไตล์), title, ut (เวลาหน่วยมิลลิวินาที), body, fields:[{k,v,mono}], progress:{l,p,d}, actions และ et (หมดอายุหน่วยมิลลิวินาที) สไตล์มีสามแบบ: standard สำหรับประกาศ, receipt สำหรับตารางคู่คีย์-ค่า, security สำหรับการอนุญาตและข้อเตือน",
    fi: "Kortin wire-avaimet ovat täsmälleen nämä lyhyet nimet: id, v (tyyli), title, ut (millisekuntiaikaleima), body, fields:[{k,v,mono}], progress:{l,p,d}, actions ja et (vanheneminen milliseunteina). Kolme tyyliä: standard tiedotuksiin, receipt avain/arvo-ruudukkoon, security suostumuksiin ja hälytyksiin.",
    uk: "Ключі картки на дроті — саме ці короткі імена: id, v (стиль), title, ut (мілісекундна мітка часу), body, fields:[{k,v,mono}], progress:{l,p,d}, actions та et (термін у мілісекундах). Стилі три: standard для оголошень, receipt для таблиці «ключ — значення», security для згод і попереджень.",
    bg: "Ключовете на картата по жицата са точно тези кратки имена: id, v (стил), title, ut (милисекунден time stamp), body, fields:[{k,v,mono}], progress:{l,p,d}, actions и et (изтичане в милисекунди). Стилът е три: standard за обявления, receipt за таблица ключ/стойност, security за съгласия и предупреждения.",
    tr: "Kartın tel anahtarları tam olarak bu kısa adlar: id, v (biçim), title, ut (milisaniye zaman damgası), body, fields:[{k,v,mono}], progress:{l,p,d}, actions ve et (milisaniye cinsinden son kullanma). Üç biçim: duyuru için standard, anahtar/değer tablosu için receipt, izin ve uyarılar için security.",
    hu: "A kártya drótkulcsai pontosan ezek a rövid nevek: id, v (stílus), title, ut (ezredmásodperc időbélyeg), body, fields:[{k,v,mono}], progress:{l,p,d}, actions és et (lejárat ezredmásodpercben). Három stílus: standard bejelentésekre, receipt kulcs/érték rácshoz, security engedélyekhez és riasztásokhoz.",
  },
  {
    en: "A button is {id,title,action,style,payload|url|amount,confirm}. action is the behaviour, style is the colour, and both are enums: kinds are callback / pay_credits / open_url / open_channel / send_cmd / none, colours are primary / secondary / destructive. One unknown string anywhere costs the whole frame, not just that button.",
    ru: "Кнопка — это {id,title,action,style,payload|url|amount,confirm}. action задаёт поведение, style — цвет, и то и другое перечислимо: поведения callback / pay_credits / open_url / open_channel / send_cmd / none, цвета primary / secondary / destructive. Одно неизвестное строковое значение где угодно стоит всего кадра, а не только этой кнопки.",
    de: "Ein Knopf ist {id,title,action,style,payload|url|amount,confirm}. action ist das Verhalten, style die Farbe, beide sind Enums: Verhaltensweisen callback / pay_credits / open_url / open_channel / send_cmd / none, Farben primary / secondary / destructive. Ein unbekannter String irgendwo kostet den ganzen Rahmen, nicht nur diesen Knopf.",
    fr: "Un bouton est {id,title,action,style,payload|url|amount,confirm}. action est le comportement, style la couleur, et tous deux sont des énumérations : comportements callback / pay_credits / open_url / open_channel / send_cmd / none, couleurs primary / secondary / destructive. Une chaîne inconnue où que ce soit coûte le cadre entier, pas seulement ce bouton.",
    it: "Un pulsante è {id,title,action,style,payload|url|amount,confirm}. action è il comportamento, style è il colore, e entrambi sono enum: comportamenti callback / pay_credits / open_url / open_channel / send_cmd / none, colori primary / secondary / destructive. Una stringa sconosciuta dovunque costa l'intero frame, non solo quel pulsante.",
    nl: "Een knop is {id,title,action,style,payload|url|amount,confirm}. action is het gedrag, style is de kleur, en beide zijn enums: gedragingen callback / pay_credits / open_url / open_channel / send_cmd / none, kleuren primary / secondary / destructive. Eén onbekende tekenreeks waar dan ook kost het hele frame, niet alleen die knop.",
    cs: "Tlačítko je {id,title,action,style,payload|url|amount,confirm}. action je chování, style je barva a obojí je výčet: chování callback / pay_credits / open_url / open_channel / send_cmd / none, barvy primary / secondary / destructive. Jedna neznámá řetězcová hodnota kdekoli stojí celý rámec, ne jen to dané tlačítko.",
    "zh-Hans": "按钮是 {id,title,action,style,payload|url|amount,confirm}。action 是行为、style 是颜色，两者都是枚举：行为取 callback / pay_credits / open_url / open_channel / send_cmd / none，颜色取 primary / secondary / destructive。写错任意一个未知字符串，丢掉的是整帧，不是那一个按钮。",
    "zh-Hant": "按鈕是 {id,title,action,style,payload|url|amount,confirm}。action 是行為、style 是顏色，兩者都是列舉：行為取 callback / pay_credits / open_url / open_channel / send_cmd / none，顏色取 primary / secondary / destructive。寫錯任一個未知字串，丟掉的是整幀，不是那一個按鈕。",
    es: "Un botón es {id,title,action,style,payload|url|amount,confirm}. action es la acción, style el color, y ambos son enumeraciones: acciones callback / pay_credits / open_url / open_channel / send_cmd / none, colores primary / secondary / destructive. Una cadena desconocida en cualquier punto cuesta el fotograma entero, no solo ese botón.",
    pl: "Przycisk to {id,title,action,style,payload|url|amount,confirm}. action określa zachowanie, style kolor, a oba są wyliczeniami: zachowania callback / pay_credits / open_url / open_channel / send_cmd / none, kolory primary / secondary / destructive. Jedna nieznana wartość tekstowa gdziekolwiek kosztuje całą ramkę, nie tylko ten przycisk.",
    ja: "ボタンは {id,title,action,style,payload|url|amount,confirm}。action が挙動、style が色を決め、どちらも列挙型。挙動は callback / pay_credits / open_url / open_channel / send_cmd / none、色は primary / secondary / destructive。どこか一箇所でも未知の文字列を書くと、失くなるのはそのボタンではなくフレーム全体だ。",
    th: "ปุ่มคือ {id,title,action,style,payload|url|amount,confirm} — action คือพฤติกรรม, style คือสี และทั้งคู่เป็น enum: พฤติกรรมใช้ callback / pay_credits / open_url / open_channel / send_cmd / none, สีใช้ primary / secondary / destructive ถ้าใส่สตริงที่ไม่รู้จักสักจุด สิ่งที่ถูกทิ้งคือทั้งเฟรม ไม่ใช่แค่ปุ่มนั้น",
    fi: "Painike on {id,title,action,style,payload|url|amount,confirm}. action on toiminta, style on väri, ja molemmat ovat enumia: toiminnot callback / pay_credits / open_url / open_channel / send_cmd / none, värit primary / secondary / destructive. Yksi tuntemainen merkkijono missä tahansa maksaa koko kehyksen, ei vain sen painikkeen.",
    uk: "Кнопка — це {id,title,action,style,payload|url|amount,confirm}. action визначає поведінку, style — колір, і обидва є переліками: поведінки callback / pay_credits / open_url / open_channel / send_cmd / none, кольори primary / secondary / destructive. Один невідомий рядок будь-де коштує всього кадру, а не лише цієї кнопки.",
    bg: "Бутонът е {id,title,action,style,payload|url|amount,confirm}. action е поведението, style е цветът, и двете са изброими типове: поведения callback / pay_credits / open_url / open_channel / send_cmd / none, цветове primary / secondary / destructive. Един непознат низ където и да е коства целия кадър, не само този бутон.",
    tr: "Bir düğme {id,title,action,style,payload|url|amount,confirm} şeklindedir. action davranışı, style rengi belirler ve ikisi de enum'dur: davranışlar callback / pay_credits / open_url / open_channel / send_cmd / none, renkler primary / secondary / destructive. Herhangi bir yere yazılan bilinmeyen bir metin bütün çerçeveye mal olur, yalnızca o düğmeye değil.",
    hu: "A gomb {id,title,action,style,payload|url|amount,confirm}. az action a viselkedés, a style a szín, és mindkettő felsorolásos típus: viselkedések callback / pay_credits / open_url / open_channel / send_cmd / none, színek primary / secondary / destructive. Egy ismeretlen szöveg bárhol az egész keretbe kerül, nemcsak abba a gombba.",
  },
  {
    en: "Limits worth memorising: 8192 characters per frame (characters, not bytes — which is why CJK goes into the JSON raw instead of \\u-escaped), fields ≤ 8, actions ≤ 4, menu items ≤ 3, sub-items ≤ 5 and only two levels deep. card id ≤ 64, title ≤ 120, body ≤ 2000, field label ≤ 80, field value ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    ru: "Пределы, которые стоит запомнить: 8192 символа на кадр — символов, а не байт, поэтому иероглифы пишутся в JSON как есть, без \\u-экранирования; fields ≤ 8, actions ≤ 4, пунктов меню ≤ 3, вложенных ≤ 5 и только два уровня глубины. card id ≤ 64, title ≤ 120, body ≤ 2000, имя поля ≤ 80, значение поля ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    de: "Grenzen, die man sich merken sollte: 8192 Zeichen pro Rahmen — Zeichen, keine Bytes, deshalb kommt CJK roh ins JSON statt \\u-escapet; fields ≤ 8, actions ≤ 4, Menüpunkte ≤ 3, Unterpunkte ≤ 5 und nur zwei Ebenen tief. card id ≤ 64, title ≤ 120, body ≤ 2000, Feldname ≤ 80, Feldwert ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    fr: "Les bornes à retenir : 8192 caractères par trame — des caractères, pas des octets, c'est pourquoi les idéogrammes vont tels quels dans le JSON au lieu d'être échappés en \\u ; fields ≤ 8, actions ≤ 4, entrées de menu ≤ 3, sous-entrées ≤ 5 et deux niveaux seulement. card id ≤ 64, title ≤ 120, body ≤ 2000, nom de champ ≤ 80, valeur de champ ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    it: "I limiti degni di memoria: 8192 caratteri per frame — caratteri, non byte, perciò il CJK va nel JSON così com'è invece di essere \\u-escapato; fields ≤ 8, actions ≤ 4, voci di menu ≤ 3, sottovoci ≤ 5 e solo due livelli. card id ≤ 64, title ≤ 120, body ≤ 2000, nome campo ≤ 80, valore campo ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    nl: "Grenzen om te onthouden: 8192 tekens per frame — tekens, geen bytes, daarom gaat CJK rauw in de JSON in plaats van \\u-ge-escaped; fields ≤ 8, actions ≤ 4, menu-items ≤ 3, sub-items ≤ 5 en slechts twee niveaus diep. card id ≤ 64, title ≤ 120, body ≤ 2000, veldnaam ≤ 80, veldwaarde ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    cs: "Limity, které stojí za to si pamatovat: 8192 znaků na rámec — znaků, ne bajtů, proto jde CJK do JSON čerstvý, nikoli \\u-escapovaný; fields ≤ 8, actions ≤ 4, položek menu ≤ 3, podpoložek ≤ 5 a jen dvě úrovně do hloubky. card id ≤ 64, title ≤ 120, body ≤ 2000, název pole ≤ 80, hodnota pole ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    "zh-Hans": "值得记住的上限：整帧 8192 个字符（按字符计，不按字节；所以中文要原样写进 JSON，而不是 \\u 转义）、fields ≤ 8、actions ≤ 4、菜单项 ≤ 3、子项 ≤ 5 且只到两层。card id ≤ 64、title ≤ 120、body ≤ 2000、字段名 ≤ 80、字段值 ≤ 240、payload ≤ 512、URL ≤ 2048、progress 0–100、pay_credits 1–100000。",
    "zh-Hant": "值得記住的上限：整訊框 8192 個字元（按字元計，不按位元組；所以中文要原樣寫進 JSON，而不是 \\u 轉義）、fields ≤ 8、actions ≤ 4、選單項 ≤ 3、子項 ≤ 5 且只到兩層。card id ≤ 64、title ≤ 120、body ≤ 2000、欄位名 ≤ 80、欄位值 ≤ 240、payload ≤ 512、URL ≤ 2048、progress 0–100、pay_credits 1–100000。",
    es: "Límites que conviene memorizar: 8192 caracteres por fotograma (caracteres, no bytes — por eso el CJK va crudo en el JSON en lugar de escapado con \\u), fields ≤ 8, actions ≤ 4, elementos de menú ≤ 3, subelementos ≤ 5 y solo dos niveles de profundidad. card id ≤ 64, title ≤ 120, body ≤ 2000, nombre de campo ≤ 80, valor de campo ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    pl: "Limity warte zapamiętania: 8192 znaków na ramkę — znaków, nie bajtów, dlatego CJK wpisujemy do JSON surowo, zamiast uciekać przez \\u; fields ≤ 8, actions ≤ 4, pozycji menu ≤ 3, podpozycji ≤ 5 i tylko dwa poziomy w głąb. card id ≤ 64, title ≤ 120, body ≤ 2000, nazwa pola ≤ 80, wartość pola ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    ja: "覚えておくべき上限：フレームあたり 8192 文字（バイト数ではない。だから日本語や中国語は \\u エスケープにせず JSON に生で書く）、fields ≤ 8、actions ≤ 4、メニュー項目 ≤ 3、サブ項目 ≤ 5、深さは 2 層まで。card id ≤ 64、title ≤ 120、body ≤ 2000、項目名 ≤ 80、項目値 ≤ 240、payload ≤ 512、URL ≤ 2048、progress 0–100、pay_credits 1–100000。",
    th: "ขีดจำกัดที่ควรจำ: ต่อเฟรม 8192 อักขระ (นับเป็นอักขระ ไม่นับเป็นไบต์ — ภาษาจีนและญี่ปุ่นจึงเขียนลง JSON ตรง ๆ ได้ ไม่ต้อง escape เป็น \\u), fields ≤ 8, actions ≤ 4, รายการเมนู ≤ 3, รายการย่อย ≤ 5 และลึกลงไปได้แค่สองชั้น card id ≤ 64, title ≤ 120, body ≤ 2000, ชื่อช่อง ≤ 80, ค่าช่อง ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000",
    fi: "Rajat, jotka kannattaa ulkoa opetella: 8192 merkkiä kehystä kohti — merkkejä, ei tavuja, siksi CJK kirjoitetaan JSON:iin sellaisenaan eikä \\u-escapetuna; fields ≤ 8, actions ≤ 4, valikkokohtia ≤ 3, aliarkohtia ≤ 5 ja vain kaksi tasoa syvälle. card id ≤ 64, title ≤ 120, body ≤ 2000, kentän nimi ≤ 80, kentän arvo ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    uk: "Межі, які варто запам'ятати: 8192 символів на кадр — саме символів, а не байтів, тому ієрогліфи пишуть у JSON як є, замість \\u-екранування; fields ≤ 8, actions ≤ 4, пунктів меню ≤ 3, вкладених ≤ 5 і лише два рівні глибини. card id ≤ 64, title ≤ 120, body ≤ 2000, назва поля ≤ 80, значення поля ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    bg: "Границите, които заслужават запомняне: 8192 знака на кадър — знаци, не байтове, затова CJK влиза в JSON суров, вместо \\u-екраниран; fields ≤ 8, actions ≤ 4, елементи на менюто ≤ 3, поделементи ≤ 5 и само две нива дълбочина. card id ≤ 64, title ≤ 120, body ≤ 2000, име на поле ≤ 80, стойност на поле ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    tr: "Akılda tutulmaya değer sınırlar: çerçeve başına 8192 karakter — bayt değil karakter sayılır, bu yüzden Uzak Doğu alfabeleri JSON'a \\u ile kaçırılmadan olduğu gibi yazılır; fields ≤ 8, actions ≤ 4, menü öğesi ≤ 3, alt öğe ≤ 5 ve en fazla iki seviye derinlik. card id ≤ 64, title ≤ 120, body ≤ 2000, alan adı ≤ 80, alan değeri ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
    hu: "Megjegyzésre érdemes korlátok: keretenként 8192 karakter — karakter, nem bájt, ezért a CJK nyersen megy a JSON-ba a \\u-átírás helyett; fields ≤ 8, actions ≤ 4, menüpont ≤ 3, alpont ≤ 5 és csak két szintnyi mélység. card id ≤ 64, title ≤ 120, body ≤ 2000, mezőnév ≤ 80, mezőérték ≤ 240, payload ≤ 512, URL ≤ 2048, progress 0–100, pay_credits 1–100000.",
  },
  {
    en: "The menu frame {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Orders\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} keys its items as title, kind, action, payload, url and sub. Kinds are click / view / scancode / location / click_text, and a menu item may only carry open_url, send_cmd, open_channel or callback — payment belongs on a card whose amount the user can read, not on a menu label. The submenu key is sub, never the Swift property name.",
    ru: "Кадр меню {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Заказы\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} ключует пункты как title, kind, action, payload, url и sub. kind бывает click / view / scancode / location / click_text, а пункт меню может нести только open_url, send_cmd, open_channel или callback — платёж принадлежит карточке, с которой пользователь видит сумму, а не ярлыку меню. Ключ подменю — sub, никогда имя свойства из Swift.",
    de: "Der Menürahmen {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Bestellungen\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} führt seine Punkte als title, kind, action, payload, url und sub. kind heißt click / view / scancode / location / click_text, und ein Menüpunkt darf nur open_url, send_cmd, open_channel oder callback tragen — Zahlen gehört auf eine Karte, deren Betrag der Nutzer lesen kann, nicht auf ein Menülabel. Der Schlüssel des Untermenüs ist sub, nie der Swift-Attributname.",
    fr: "{\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Commandes\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} est le menu type ; ses entrées se nomment title, kind, action, payload, url et sub. kind vaut click / view / scancode / location / click_text, et une entrée ne peut porter que open_url, send_cmd, open_channel ou callback — le paiement se fait sur une carte dont l'utilisateur lit le montant, pas sur un libellé de menu. La clé du sous-menu est sub, jamais le nom de propriété Swift.",
    it: "Il frame di menu {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Ordini\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} chiava le sue voci come title, kind, action, payload, url e sub. kind vale click / view / scancode / location / click_text, e una voce di menu può portare solo open_url, send_cmd, open_channel o callback — il pagamento sta su una carta di cui l'utente legge l'importo, non su un'etichetta di menu. La chiave del sottomenu è sub, mai il nome della proprietà Swift.",
    nl: "Het menuframe {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Bestellingen\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} sleutelt zijn items als title, kind, action, payload, url en sub. kind is click / view / scancode / location / click_text, en een menu-item mag alleen open_url, send_cmd, open_channel of callback dragen — betalen hoort op een kaart waarvan de gebruiker het bedrag kan lezen, niet op een menulabel. De sleutel van het submenu is sub, nooit de Swift-eigennaam.",
    cs: "Rámec menu {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Objednávky\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} má položky klíčované jako title, kind, action, payload, url a sub. kind je click / view / scancode / location / click_text a položka menu smí nést jen open_url, send_cmd, open_channel nebo callback — platba patří na kartu, jejíž částku uživatel vidí, ne na popisek menu. Klíč podmenu je sub, nikdy název vlastnosti ve Swiftu.",
    "zh-Hans": "菜单帧 {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"订单\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} 的项键是 title、kind、action、payload、url、sub。kind 取 click / view / scancode / location / click_text；菜单项只能带 open_url、send_cmd、open_channel、callback 四种行为——付款必须发生在用户看得见面额的卡片上，不是一个菜单标签上。子菜单的键是 sub，不是 Swift 里的属性名。",
    "zh-Hant": "選單訊框 {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"訂單\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} 的項鍵是 title、kind、action、payload、url、sub。kind 取 click / view / scancode / location / click_text；選單項只能帶 open_url、send_cmd、open_channel、callback 四種行為——付款必須發生在用戶看得見面額的卡片上，不是一個選單標籤上。子選單的鍵是 sub，不是 Swift 裡的屬性名。",
    es: "El fotograma de menú {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Pedidos\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} clavea sus elementos como title, kind, action, payload, url y sub. kind vale click / view / scancode / location / click_text, y un elemento de menú solo puede llevar open_url, send_cmd, open_channel o callback — el pago ocurre en una tarjeta cuyo importe lee el usuario, no en una etiqueta de menú. La clave del submenú es sub, nunca el nombre de la propiedad Swift.",
    pl: "Ramka menu {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Zamówienia\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} kluczuje pozycje jako title, kind, action, payload, url i sub. kind przyjmuje click / view / scancode / location / click_text, a pozycja menu może nieść tylko open_url, send_cmd, open_channel albo callback — płatność należy do karty, na której użytkownik widzi kwotę, nie do etykiety menu. Klucz podmenu to sub, nigdy nazwa właściwości Swift.",
    ja: "メニューのフレーム {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"注文\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} の項目の鍵は title、kind、action、payload、url、sub。kind は click / view / scancode / location / click_text、そしてメニュー項目が持てる action は open_url、send_cmd、open_channel、callback の四つだけ——支払いは利用者が金額を読めるカードの上でしなければならず、メニューのラベルの上ではいけない。サブメニューの鍵は sub で、Swift のプロパティ名ではない。",
    th: "เฟรมเมนู {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"คำสั่งซื้อ\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} ใช้คีย์ของรายการคือ title, kind, action, payload, url และ sub — kind เป็น click / view / scancode / location / click_text ส่วนเมนูหนึ่งรายการมีได้แค่ open_url, send_cmd, open_channel หรือ callback การจ่ายเงินต้องเกิดบนการ์ดที่ผู้ใช้มองเห็นจำนวนเงิน ไม่ใช่บนป้ายชื่อเมนู คีย์ของเมนูย่อยคือ sub ไม่ใช่ชื่อ property ใน Swift",
    fi: "Valikkokehys {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Tilaukset\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} avaa kohtansa nimillä title, kind, action, payload, url ja sub. kind voi olla click / view / scancode / location / click_text, ja valikkokohta saa sisältää vain open_url, send_cmd, open_channel tai callback — maksaminen kuuluu kortille, jonka summan käyttäjä näkee, ei valikon otsikolle. Alivalikon avain on sub, ei koskaan Swiftin atomin nimi.",
    uk: "Кадр меню {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Замовлення\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} ключує пункти як title, kind, action, payload, url і sub. kind буває click / view / scancode / location / click_text, а пункт меню може нести лише open_url, send_cmd, open_channel або callback — платіж має бути на картці, з якої користувач бачить суму, а не на ярлику меню. Ключ вкладеного меню — sub, а не назва властивості зі Swift.",
    bg: "Кадрът на менюто {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Поръчки\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} ключва елементите си като title, kind, action, payload, url и sub. kind е click / view / scancode / location / click_text, а елемент от менюто може да носи само open_url, send_cmd, open_channel или callback — плащането е върху карта, чието потребителят вижда сумата, не върху етикет на меню. Ключът на подменюто е sub, никога името на свойството в Swift.",
    tr: "Menü çerçevesi {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Siparişler\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} öğelerini title, kind, action, payload, url ve sub anahtarlarıyla taşır. kind değeri click / view / scancode / location / click_text olabilir ve bir menü öğesi yalnızca open_url, send_cmd, open_channel ya da callback taşıyabilir — ödeme, kullanıcının tutarını okuyabildiği kartta yapılır, bir menü etiketinde değil. Alt menünün anahtarı sub'dır, Swift'teki özellik adı asla.",
    hu: "A {\"t\":\"mc\",\"menu\":{\"items\":[{\"title\":\"Rendelések\",\"kind\":\"click\",\"action\":\"callback\",\"payload\":\"kw:orders\",\"sub\":[]}],\"rev\":7}} menükeret a pontjait title, kind, action, payload, url és sub kulcsokkal viszi. A kind értéke click / view / scancode / location / click_text, és egy menüpont csak open_url, send_cmd, open_channel vagy callback műveletet vihet — a fizetés arra a kártyára tartozik, amelynek összegét a felhasználó elolvashatja, nem egy menücímkére. Az alamenu kulcsa a sub, soha nem a Swift property-neve.",
  },
  {
    en: "It is the handshake frame {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} that makes a phone treat this service account as a peer allowed to raise a payment card. sec is 2–64 hex characters (1–32 bytes, and the length must be even); an odd length decodes to nothing and the whole frame disappears.",
    ru: "Именно кадр рукопожатия {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} заставляет телефон считать этот сервисный аккаунт контрагентом, которому можно поднимать платёжную карточку. sec — это 2–64 шестнадцатеричных символа (1–32 байта, длина обязана быть чётной); нечётная длина распадается в ничего, и кадр исчезает целиком.",
    de: "Erst der Handschlagrahmen {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} bringt ein Telefon dazu, diesen Dienstaccount als Gegenstelle zu behandeln, die eine Zahlungskarte hochziehen darf. sec sind 2–64 Hexzeichen (1–32 Bytes, und die Länge muss gerade sein); eine ungerade Länge dekodiert ins Nichts, und der ganze Rahmen verschwindet.",
    fr: "C'est la trame de poignée de main {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} qui fait considérer ce compte de service par le téléphone comme un pair autorisé à ouvrir une carte de paiement. sec compte 2–64 caractères hexadécimaux (1–32 octets, et la longueur doit être paire) ; une longueur impaire se décode en rien et la trame entière disparaît.",
    it: "È il frame di handshake {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} che fa trattare questo account di servizio dal telefono come un pari a cui è consentito sollevare una carta di pagamento. sec è 2–64 caratteri esadecimali (1–32 byte, e la lunghezza deve essere pari); una lunghezza dispari si decodifica in nulla e l'intero frame scompare.",
    nl: "Het is het handshakeframe {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} dat een telefoon dit serviceaccount als een peer laat behandelen die een betaalkaart mag optrekken. sec is 2–64 hex tekens (1–32 bytes, en de lengte moet even zijn); een oneven lengte decodeert naar niets en het hele frame verdwijnt.",
    cs: "Právě rámec handshake {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} přiměje telefon, aby považoval tento servisní účet za protějšek, který může vyvolat platební kartu. sec je 2–64 hex znaku (1–32 bajtů a délka musí být sudá); lichá délka se dekóduje na nic a celý rámec zmizí.",
    "zh-Hans": "握手帧 {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} 才是让手机把这个服务号当作「可发付款卡片的对端」的那一步：sec 是 2–64 个十六进制字符（1–32 字节，长度必须成双），奇数长度会被解码成空、整帧消失。",
    "zh-Hant": "握手訊框 {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} 才是讓手機把這個服務號當作「可發付款卡片的對端」的那一步：sec 是 2–64 個十六進位字元（1–32 位元組，長度必須成雙），奇數長度會被解碼成空、整訊框消失。",
    es: "Es el fotograma de saludo {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} el que hace que un teléfono trate esta cuenta de servicio como un par al que se le permite levantar una tarjeta de pago. sec son 2–64 caracteres hexadecimales (1–32 bytes, y la longitud debe ser par); una longitud impar se decodifica a nada y el fotograma entero desaparece.",
    pl: "Właśnie ramka uścisku dłoni {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} sprawia, że telefon traktuje to konto serwisowe jako partnera, któremu wolno podnieść kartę płatniczą. sec to 2–64 znaków szesnastkowych (1–32 bajty, a długość musi być parzysta); nieparzysta długość dekoduje się na nic i cała ramka znika.",
    ja: "スマートフォンにこのサービスアカウントを「決済カードを出せる相手」と認識させるのは、ハンドシェイクのフレーム {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} だ。sec は 16 進 2〜64 文字（1〜32 バイト、しかも長さは偶数でなければならない）。長さが奇数だとデコード結果は空になり、フレームごと消える。",
    th: "เฟรมจับมือ {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} ต่างหากที่ทำให้มือถือยอมรับว่าบัญชีบริการนี้เป็นปลายทางที่ออกการ์ดชำระเงินได้ — sec เป็นอักขระฐานสิบหก 2–64 ตัว (1–32 ไบต์ และความยาวต้องเป็นเลขคู่) ถ้ายาวเป็นเลขคี่ มันจะถูกถอดความเป็นค่าว่าง แล้วทั้งเฟรมก็หายไป",
    fi: "Nimenomaan kädenpuristuskehys {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} saa puhelimen kohtelemaan tätä palvelutiliä vastapuolena, joka saa nostaa maksukortin. sec on 2–64 numerokirjainta (1–32 tavua, ja pituuden on oltava parillinen); pariton pituus purkautuu tyhjäksi, ja koko kehys katoaa.",
    uk: "Саме кадр рукостискання {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} змушує телефон вважати цей сервісний обліковий запис контрагентом, якому можна піднімати платіжну картку. sec — це 2–64 шістнадцяткових символів (1–32 байти, і довжина має бути парною); непарна довжина розкодується в ніщо, і весь кадр зникає.",
    bg: "Точно ръкостискането {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} кара телефона да разглежда този сервисен акаунт като партньор, на който му е позволено да повдигне карта за плащане. sec е 2–64 шестнадесетични знака (1–32 байта, а дължината трябва да е четна); нечетна дължина се разкодира в нищо и целият кадър изчезва.",
    tr: "Telefon bu hizmet hesabını ödeme kartı açmasına izin verilen bir eş gibi ele aldıran şey, el sıkışma çerçevesidir: {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"}. sec 2–64 onaltılık karakterdir (1–32 bayt ve uzunluk çift olmak zorundadır); tek uzunluk hiçliğe çözülür ve bütün çerçeve kaybolur.",
    hu: "Pontosan a kézfogáskeret {\"t\":\"sh\",\"uid\":\"u_7Qk2Lp9Rt3Vx\",\"sec\":\"0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0\",\"svc\":\"popopx.official\"} veszi rá a telefont, hogy ezt a szolgáltatási fiókot olyan párként kezelje, amelyik fizetési kártyát emelhet. A sec 2–64 hexadecimális karakter (1–32 bájt, és a hossznek párosnak kell lennie); páratlan hossz semmire oldódik, és az egész keret eltűnik.",
  },
];

const H5_TITLE: Localized<string> = {
  en: "Third-party H5 onboarding: POST /api/v1/verifyH5Auth",
  ru: "Подключение стороннего H5: POST /api/v1/verifyH5Auth",
  de: "Drittanbieter-H5-Anbindung: POST /api/v1/verifyH5Auth",
  fr: "Intégration H5 tierce : POST /api/v1/verifyH5Auth",
  it: "Integrazione H5 di terze parti: POST /api/v1/verifyH5Auth",
  nl: "H5-aansluiting van derden: POST /api/v1/verifyH5Auth",
  cs: "Napojení H5 třetí strany: POST /api/v1/verifyH5Auth",
  "zh-Hans": "第三方 H5 接入：POST /api/v1/verifyH5Auth",
  "zh-Hant": "第三方 H5 接入：POST /api/v1/verifyH5Auth",
  es: "Integración H5 de terceros: POST /api/v1/verifyH5Auth",
  pl: "Podłączenie zewnętrznego H5: POST /api/v1/verifyH5Auth",
  ja: "第三者の H5 受け入れ：POST /api/v1/verifyH5Auth",
  th: "ให้ H5 ของบุคคลที่สามเข้ามา: POST /api/v1/verifyH5Auth",
  fi: "Kolmannen osapuolen H5-liittyminen: POST /api/v1/verifyH5Auth",
  uk: "Підключення стороннього H5: POST /api/v1/verifyH5Auth",
  bg: "Включване на H5 от трета страна: POST /api/v1/verifyH5Auth",
  tr: "Üçüncü taraf H5 bağlantısı: POST /api/v1/verifyH5Auth",
  hu: "Harmadik féltől származó H5 csatlakozás: POST /api/v1/verifyH5Auth",
};

const H5_PYTHON_LABEL: Localized<string> = {
  en: "Python: recompute the bytes the phone signed",
  ru: "Python: заново собрать байты, которые подписал телефон",
  de: "Python: die Bytes nachbauen, die das Telefon signiert hat",
  fr: "Python : recalculer les octets signés par le téléphone",
  it: "Python: ricalcola i byte che il telefono ha firmato",
  nl: "Python: herbereken de bytes die de telefoon ondertekende",
  cs: "Python: přepočítejte bajty, které telefon podepsal",
  "zh-Hans": "Python：算出手机签的那串字节",
  "zh-Hant": "Python：算出手機簽的那串位元組",
  es: "Python: recalcula los bytes que firmó el teléfono",
  pl: "Python: przelicz bajty, które podpisał telefon",
  ja: "Python：スマホが署名したバイト列を組み直す",
  th: "Python: คำนวณไบต์ที่มือถือลงนามอีกครั้ง",
  fi: "Python: laske uudelleen ne tavut, jotka puhelin allekirjoitti",
  uk: "Python: перерахуйте байти, які підписав телефон",
  bg: "Python: преизчисли байтовете, които телефонът е подписал",
  tr: "Python: telefonun imzaladığı baytları yeniden hesapla",
  hu: "Python: számold újra a telefon által aláírt bájtokat",
};

const H5_JS_LABEL: Localized<string> = {
  en: "JavaScript: the page asks its own server",
  ru: "JavaScript: страница спрашивает свой сервер",
  de: "JavaScript: die Seite fragt ihren eigenen Server",
  fr: "JavaScript : la page interroge son propre serveur",
  it: "JavaScript: la pagina chiede al proprio server",
  nl: "JavaScript: de pagina vraagt haar eigen server",
  cs: "JavaScript: stránka se zeptá vlastního serveru",
  "zh-Hans": "JavaScript：页面回源校验",
  "zh-Hant": "JavaScript：頁面回源校驗",
  es: "JavaScript: la página pregunta a su propio servidor",
  pl: "JavaScript: strona pyta własny serwer",
  ja: "JavaScript：ページが自分のサーバーに検証させる",
  th: "JavaScript: หน้าตาถามเซิร์ฟเวอร์ของตัวเอง",
  fi: "JavaScript: sivusto kysyy omalta palvelimeltaan",
  uk: "JavaScript: сторінка питає власний сервер",
  bg: "JavaScript: страницата пита собствения си сървър",
  tr: "JavaScript: sayfa kendi sunucusuna soruyor",
  hu: "JavaScript: az oldal a saját szerverét kérdezi meg",
};

const H5_RULES: readonly Localized<string>[] = [
  {
    en: "The signature is HMAC-SHA256 keyed on the raw bytes of that follower's session secret, over the UTF-8 string uid=<pairwise_uid>&ts=<unix-seconds>, emitted as 64 lowercase hex characters.",
    ru: "Подпись — HMAC-SHA256 на сырых байтах секретом сессии этого подписчика, по строке UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, результат — 64 строчных шестнадцатеричных символа.",
    de: "Die Signatur ist HMAC-SHA256 über den rohen Bytes des Sitzungsgeheimnisses dieses Folgenden, über den UTF-8-String uid=<pairwise_uid>&ts=<unix-seconds>, ausgegeben als 64 Kleinstbuchstaben-Hexzeichen.",
    fr: "La signature est un HMAC-SHA256 clé sur les octets bruts du secret de session de cet abonné, sur la chaîne UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, rendue en 64 caractères hexadécimaux minuscules.",
    it: "La firma è un HMAC-SHA256 con chiave sui byte grezzi del segreto di sessione di quello stesso follower, sulla stringa UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, emessa come 64 caratteri esadecimali minuscoli.",
    nl: "De handtekening is HMAC-SHA256 met als sleutel de rauwe bytes van het sessiegeheimnis van die volger, over de UTF-8-tekenreeks uid=<pairwise_uid>&ts=<unix-seconds>, uitgezet als 64 kleine hexa decimale tekens.",
    cs: "Podpis je HMAC-SHA256 s klíčem z hrubých bajtů tajného klíče relace tohoto sledujícího, nad řetězcem UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, vypsán jako 64 malých hex znaku.",
    "zh-Hans": "签名是 HMAC-SHA256，密钥是这条会话的会话密钥原始字节，消息是 UTF-8 的 uid=<pairwise_uid>&ts=<unix 秒>，输出小写十六进制、64 个字符。",
    "zh-Hant": "簽名是 HMAC-SHA256，金鑰是這條工作階段的會話金鑰原始位元組，訊息是 UTF-8 的 uid=<pairwise_uid>&ts=<unix 秒>，輸出小寫十六進位、64 個字元。",
    es: "La firma es HMAC-SHA256 con clave en los bytes crudos del secreto de sesión de ese seguidor, sobre la cadena UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, emitida como 64 caracteres hexadecimales en minúscula.",
    pl: "Podpis to HMAC-SHA256 z kluczem z surowych bajtów sekretu sesji tego obserwującego, na łańcuchu UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, wypisany jako 64 małych szesnastkowych znaków.",
    ja: "署名は HMAC-SHA256。鍵はそのフォロワーのセッションシークレットの生バイト、対象は UTF-8 の文字列 uid=<pairwise_uid>&ts=<unix-seconds>、出力は小文字 16 進 64 文字。",
    th: "ลายเซ็นคือ HMAC-SHA256 ใช้คีย์เป็นไบต์ดิบของ secret ของเซสชันผู้ติดตามคนนั้น บนสตริง UTF-8 uid=<pairwise_uid>&ts=<unix-seconds> ผลออกมาเป็นอักขระฐานสิบตัวพิมพ์เล็ก 64 ตัว",
    fi: "Allekirjoitus on HMAC-SHA256, jonka avain on tämän seuraajan istuntosalaisuuden raakatavut, ja se lasketaan UTF-8-merkkijonosta uid=<pairwise_uid>&ts=<unix-seconds>; tulos on 64 pienenä kirjoitettua numerokirjainta.",
    uk: "Підпис — HMAC-SHA256 на сирих байтах таємниці сесії цього підписника, над рядком UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, виданий як 64 малих шістнадцяткових символів.",
    bg: "Подписът е HMAC-SHA256 с ключ суровите байтове на тайната на сесията на този последовател, върху низа с UTF-8 uid=<pairwise_uid>&ts=<unix-seconds>, изпратен като 64 малки шестнадесетични знака.",
    tr: "İmza, o takipçinin oturum sırrının ham baytları üzerine kurulmuş HMAC-SHA256'dır; UTF-8 dizisi uid=<pairwise_uid>&ts=<unix-seconds> üzerinden hesaplanır ve 64 küçük harfli onaltılık karakter olarak verilir.",
    hu: "Az aláírás HMAC-SHA256, a kulcs az adott követ munkamenetének titkos nyers bájtai, az üzenet a UTF-8 uid=<pairwise_uid>&ts=<unix-seconds> karakterlánc, kimenete 64 kisbetűs hexadecimális karakter.",
  },
  {
    en: "One real asymmetry: the query parameter is popopx_uid while the preimage spells it uid=. They are deliberately different, and a server that \"normalises\" them starts rejecting every phone.",
    ru: "Одно реальное несимметричное место: параметр запроса называется popopx_uid, а в преимадже написано uid=. Они различаются намеренно — сервер, который «приведёт их к одному виду», начнёт отклонять все телефоны.",
    de: "Eine echte Asymmetrie: der Query-Parameter heißt popopx_uid, im Preimage steht uid=. Das ist so gewollt, und ein Server, der das „normalisiert“, fängt an, jedes Telefon abzulehnen.",
    fr: "Une vraie asymétrie : le paramètre d'URL s'appelle popopx_uid alors que le preimage l'écrit uid=. C'est voulu, et un serveur qui « unifie » les deux se met à rejeter tous les téléphones.",
    it: "Una vera asimmetria: il parametro della query si chiama popopx_uid mentre il preimage lo scrive uid=. Sono diversi di proposito, e un server che li «normalizza» comincia a rifiutare ogni telefono.",
    nl: "Een echte asymmetrie: de queryparameter heet popopx_uid terwijl de preimage het als uid= schrijft. Ze zijn opzettelijk verschillend, en een server die ze „even gelijktrekt“ begint elke telefoon te weigeren.",
    cs: "Jedna skutečná asymetrie: query parametr se jmenuje popopx_uid, ale v preimageu je napsáno uid=. Jsou záměrně různé, a server, který je „sjednotí“, začne odmítat každý telefon.",
    "zh-Hans": "一个真实的不对称：URL 上的查询参数叫 popopx_uid，而预镜像里写的是 uid=。两者就是不一样，服务端「顺手统一一下」会拒掉每一台手机。",
    "zh-Hant": "一個真實的不對稱：URL 上的查詢參數叫 popopx_uid，而預像裡寫的是 uid=。兩者就是不一樣，服務端「順手統一一下」會拒掉每一支手機。",
    es: "Una asimetría real: el parámetro de consulta se llama popopx_uid mientras el preimagen lo escribe uid=. Son distintos a propósito, y un servidor que los «unifique» empieza a rechazar todos los teléfonos.",
    pl: "Jedna realna asymetria: parametr zapytania nazywa się popopx_uid, a w preobrazie jest zapisany jako uid=. Różnią się celowo, a serwer, który je „ujednolici“, zacznie odrzucać każdy telefon.",
    ja: "実在する非対称がひとつ。URL のクエリパラメータは popopx_uid、プリイメージの中では uid= と書く。意図的に違い、ここで「揃えておこう」としたサーバーは全スマホを拒否し始める。",
    th: "ความไม่สมมาตรที่มีอยู่จริง: พารามิเตอร์ใน URL ชื่อ popopx_uid แต่ใน preimage เขียนว่า uid= — สองอย่างนี้ต่างกันโดยเจตนา เซิร์ฟเวอร์ที่ «มาทำให้เหมือนกัน» จะเริ่มปฏิเสธมือถือทุกเครื่อง",
    fi: "Yksi oikea epäsymmetria: kyselyparametri on popopx_uid mutta esikuva kirjoittaa sen uid=. Ne ovat tarkoituksella erilaiset, ja palvelin joka \"normalisoi\" ne alkaa hylätä jokaista puhelinta.",
    uk: "Одна справжня асиметрія: параметр запиту називається popopx_uid, а в преобразі написано uid=. Вони різняться вмотивовано, і сервер, що «зведе їх до одного вигляду», почне відхиляти кожен телефон.",
    bg: "Една реална асиметрия: параметърът в URL е popopx_uid, а в преизображението е записано uid=. Те са различни по дизайн, и сървър, който ги „уеднакви“, започва да отхвърля всеки телефон.",
    tr: "Gerçek bir asimetri var: sorgu parametresinin adı popopx_uid, oysa ön görüntü onu uid= olarak yazar. Kasıtlı olarak farklıdırlar ve onları \"düzelterek birleştiren\" bir sunucu her telefonu reddetmeye başlar.",
    hu: "Egy valós aszimmetria: a lekérdezés paramétere popopx_uid, míg a preimage uid=-ként írja. Szándékosan különböznek, és egy szerver, amely „egységesíti“ őket, elkezdi elutasítani minden telefont.",
  },
  {
    en: "The replay window is ±300 seconds and it is checked in both directions — otherwise a phone running 20 minutes fast could mint a credential that stays valid twice as long.",
    ru: "Окно защиты от повтора — ±300 секунд, и проверяются оба направления. Иначе телефон, спешащий на 20 минут, смог бы выпустить креденциал, живущий вдвое дольше.",
    de: "Das Wiederholungsfenster beträgt ±300 Sekunden und wird in beide Richtungen geprüft — sonst prägte ein 20 Minuten vorschnelles Telefon ein Credential, das doppelt so lange gilt.",
    fr: "La fenêtre anti-rejeu est de ±300 secondes et elle est contrôlée dans les deux sens — sinon un téléphone en avance de 20 minutes pourrait émettre un justificatif valable deux fois plus longtemps.",
    it: "La finestra anti-ripetizione è di ±300 secondi ed è controllata in entrambe le direzioni — altrimenti un telefono in anticipo di 20 minuti conierebbe una credenza valida il doppio a lungo.",
    nl: "Het replay-venster is ±300 seconden en wordt beide kanten op gecontroleerd — anders mint een telefoon die 20 minuten voorloopt een credential dat twee keer zo lang geldig blijft.",
    cs: "Okno proti opakování je ±300 sekund a kontroluje se oběma směry — jinak telefon jdoucí 20 minut napřed vyrobí pověření platné dvakrát déle.",
    "zh-Hans": "重放窗口是 ±300 秒，两个方向都查。否则一台快了 20 分钟的手机，能签出一张有效期翻倍的凭证。",
    "zh-Hant": "重放視窗是 ±300 秒，兩個方向都查。否則一支快 20 分鐘的裝置，能簽出一張有效期翻倍的憑證。",
    es: "La ventana de rejeuación es de ±300 segundos y se comprueba en ambas direcciones — de lo contrario, un teléfono adelantado 20 minutos podría acuñar una credencial que dure el doble.",
    pl: "Okno odtworzenia wynosi ±300 sekund i jest sprawdzane w obie strony — w przeciwnym razie telefon spieszący o 20 minut wybiłby poświadczenie ważne dwa razy dłużej.",
    ja: "リプレイ防止の窓は ±300 秒で、両方向にチェックする。でないと 20 分進んだスマホが、有効期間 2 倍の認証情報を量産できてしまう。",
    th: "หน้าต่างกันเล่นซ้ำคือ ±300 วินาที และตรวจทั้งสองทาง — ไม่งั้นมือถือที่ตั้งเวลาเร็วไป 20 นาที จะออกใบรับรองที่มีอายุยาวเป็นสองเท่าได้",
    fi: "Toistooneston ikkuna on ±300 sekuntia ja se tarkistetaan molempiin suuntiin — muuten 20 minuuttia edellä oleva puhelin voisi myöntää kaksinkertaisen voimassaolon.",
    uk: "Вікно захисту від повтору — ±300 секунд, і перевіряються обидва напрямки. Інакше телефон, що спішить на 20 хвилин, випустив би креденціал удвічі довший.",
    bg: "Прозорецът срещу повторно изпращане е ±300 секунди и се проверява в двете посоки — иначе телефон, бързащ с 20 минути, може да отпечата удостоверение с двойна валидност.",
    tr: "Yeniden oynatma penceresi ±300 saniyedir ve iki yönde de denetlenir — aksi hâlde 20 dakika ileri alan bir telefon iki katı geçerli bir kimlik üretmiş olur.",
    hu: "Az ismétlés-gátlás ablaka ±300 másodperc, és mindkét irányban ellenőrizzük — különben 20 perccel siető telefon kétszer olyan hosszú ideig érvényes hitelszerzőt bocsáthatna ki.",
  },
  {
    en: "The host name is not signed, so a wrong POPOPX_PUBLIC_BASE_URL is a reachability failure and never a signature mismatch. The endpoint needs no admin token — the HMAC is the authorisation — which is exactly why rate limiting belongs in front of it.",
    ru: "Имя хоста в подпись не входит, поэтому неверный POPOPX_PUBLIC_BASE_URL — это проблема достижимости, а никогда не несовпадение подписи. Эндпоинту не нужен админский токен: авторизация — это сама HMAC, и именно поэтому ограничитель частоты ставят перед ним.",
    de: "Der Hostname wird nicht signiert, ein falsches POPOPX_PUBLIC_BASE_URL ist also ein Erreichbarkeitsproblem und niemals eine Signaturabweichung. Der Endpunkt braucht kein Admin-Token — die HMAC ist die Autorisierung — weshalb die Ratenbegrenzung davor gehört.",
    fr: "Le nom d'hôte n'est pas signé, donc un POPOPX_PUBLIC_BASE_URL erroné est un échec d'accessibilité et jamais une mismatch de signature. L'endpoint n'a pas besoin de jeton administrateur — le HMAC est l'autorisation — c'est pourquoi la limitation de débit se place devant lui.",
    it: "Il nome host non è firmato, perciò un POPOPX_PUBLIC_BASE_URL sbagliato è un problema di raggiungibilità e mai una firma non corrispondente. L'endpoint non ha bisogno di un token admin — l'HMAC è l'autorizzazione — ed è esattamente per questo che il rate limiting sta davanti.",
    nl: "De hostnaam wordt niet ondertekend, dus een verkeerde POPOPX_PUBLIC_BASE_URL is een bereikbaarheidsfout en nooit een handtekening mismatch. Het eindpunt heeft geen admin-token nodig — de HMAC ís de autorisatie — daarom hoort snelheidsbeperking ervoor.",
    cs: "Název hostitele se nepodepisuje, takže špatná POPOPX_PUBLIC_BASE_URL je problém dostupnosti a nikdy neshoda podpisu. Koncový bod nepotřebuje administrátorský token — autorizací je samotné HMAC — proto patří omezování frekvence před něj.",
    "zh-Hans": "签名不覆盖主机名，所以 POPOPX_PUBLIC_BASE_URL 配错是一个可达性问题，永远不会是签名不匹配。这个端点不需要管理员令牌：授权本身就是这条 HMAC，因此它必须站在网关前面做限流。",
    "zh-Hant": "簽名不覆蓋主機名，所以 POPOPX_PUBLIC_BASE_URL 配錯是可達性問題，永遠不會是簽名不匹配。這端點不需要管理員令牌：授權本身就是這條 HMAC，因此它必須站在閘道前面做限流。",
    es: "El nombre de host no se firma, así que un POPOPX_PUBLIC_BASE_URL incorrecto es un fallo de accesibilidad y nunca una discordancia de firma. El endpoint no necesita token de administrador — el HMAC es la autorización — y por eso el límite de frecuencia va delante.",
    pl: "Nazwa hosta nie jest podpisana, więc błędny POPOPX_PUBLIC_BASE_URL jest problemem osiągalności, a nigdy niezgodnością podpisu. Ten punkt końcowy nie potrzebuje tokenu administratora — autoryzacją jest samo HMAC — dlatego limitowanie ruchu stawia się przed nim.",
    ja: "ホスト名は署名対象ではない。だから POPOPX_PUBLIC_BASE_URL の誤設定は到達失敗にはなっても署名不一致にはならない。このエンドポイントに管理者トークンはいらない。認可とはこの HMAC そのものだからだ——だからこそ前段でレートを絞る必要がある。",
    th: "ชื่อโฮสต์ไม่ได้อยู่ในลายเซ็น POPOPX_PUBLIC_BASE_URL ที่ผิดจึงเป็นปัญหาเข้าถึงไม่ได้ ไม่ใช่ลายเซ็นไม่ตรง endpoint นี้ไม่ต้องมี token ผู้ดูแล — HMAC คือการอนุญาตเอง — นั่นแหละคือเหตุผลที่ต้องวางตัวจำกัดอัตราการเรียกไว้ข้างหน้า",
    fi: "Isäntänimeä ei allekirjoiteta, joten väärä POPOPX_PUBLIC_BASE_URL on tavoitettavuusvirhe eikä koskaan allekirjoituksen virhe. Päätte ei tarvitse hallintatunnusta — HMAC on itse valtuutus — siksi nopeusrajoitus kuuluu sen eteen.",
    uk: "Ім'я хоста не підписується, тому хибний POPOPX_PUBLIC_BASE_URL — це проблема досяжності, а не невідповідність підпису. Ендпоінту не потрібен адмінський токен: авторизація — це сама HMAC, і саме тому обмежник частоти ставлять перед ним.",
    bg: "Името на хоста не се подписва, затова грешен POPOPX_PUBLIC_BASE_URL е проблем с достъпността и никога с несъвпадение на подписа. Крайната точка не се нуждае от администраторски токен — HMAC е самото разрешение — и точно затова ограничението на честота седи пред нея.",
    tr: "Ana bilgisayar adı imzalanmaz, bu yüzden yanlış POPOPX_PUBLIC_BASE_URL bir erişilebilirlik hatasıdır, asla imza uyuşmazlığı değil. Bu uç noktanın yönetici jetonuna ihtiyacı yok — yetkilendirmenin kendisi HMAC'tır — işte bu yüzden hız sınırlama onun önünde durmalıdır.",
    hu: "A gépnév nincs aláírva, ezért egy hibás POPOPX_PUBLIC_BASE_URL elérhetetlenségi hiba, soha nem aláíráseltérés. A végpontnak nincs szüksége admin tokenre — a HMAC maga az engedélyezés — éppen ezért a sebességkorlátozás elé tartozik.",
  },
  {
    en: "The body is {ok, valid, reason, service_id}, and on success also contact_id, pairwise_uid and ts_seconds. A true valid answers 200, a false one 401, same shape. reason is ok, unknown_uid, revoked, or a complaint about the signature or the timestamp.",
    ru: "Тело ответа — {ok, valid, reason, service_id}, а при успехе ещё contact_id, pairwise_uid и ts_seconds. Истинный valid отвечает 200, ложный — 401, форма та же. reason принимает ok, unknown_uid, revoked либо жалобу на подпись или метку времени.",
    de: "Der Rumpf ist {ok, valid, reason, service_id}, bei Erfolg zusätzlich contact_id, pairwise_uid und ts_seconds. Ein true valid antwortet 200, ein false 401, gleiche Form. reason ist ok, unknown_uid, revoked oder eine Beschwerde über Signatur oder Zeitstempel.",
    fr: "Le corps est {ok, valid, reason, service_id}, et en cas de succès aussi contact_id, pairwise_uid et ts_seconds. Un valid vrai répond 200, un faux 401, même forme. reason vaut ok, unknown_uid, revoked, ou une plainte sur la signature ou l'horodatage.",
    it: "Il corpo è {ok, valid, reason, service_id}, e con esito positivo anche contact_id, pairwise_uid e ts_seconds. Un valid vero risponde 200, uno falso 401, stessa forma. reason è ok, unknown_uid, revoked, oppure un lamento sulla firma o sul timestamp.",
    nl: "De body is {ok, valid, reason, service_id}, en bij succes ook contact_id, pairwise_uid en ts_seconds. Een true valid antwoordt 200, een false 401, dezelfde vorm. reason is ok, unknown_uid, revoked, of een klacht over de handtekening of het tijdstempel.",
    cs: "Tělo je {ok, valid, reason, service_id} a při úspěchu také contact_id, pairwise_uid a ts_seconds. Pravdivé valid odpoví 200, nepravdivé 401, stejný tvar. reason je ok, unknown_uid, revoked, nebo stížnost na podpis či časové razítko.",
    "zh-Hans": "响应体是 {ok, valid, reason, service_id}；校验通过时再带上 contact_id、pairwise_uid 与 ts_seconds。valid 为真返回 200，为假返回 401，形状不变。reason 的取值是 ok、unknown_uid、revoked，或者对签名与时间戳的抱怨。",
    "zh-Hant": "回應體是 {ok, valid, reason, service_id}；驗證通過時再加上 contact_id、pairwise_uid 與 ts_seconds。valid 為真回傳 200，為假回傳 401，形狀不變。reason 的取值是 ok、unknown_uid、revoked，或對簽名與時間戳的抱怨。",
    es: "El cuerpo es {ok, valid, reason, service_id}, y si tiene éxito también contact_id, pairwise_uid y ts_seconds. Un valid verdadero responde 200, uno falso 401, misma forma. reason es ok, unknown_uid, revoked, o una queja sobre la firma o la marca de tiempo.",
    pl: "Ciało to {ok, valid, reason, service_id}, a przy sukcesie także contact_id, pairwise_uid i ts_seconds. Prawdziwe valid odpowiada 200, fałszywe 401, ten sam kształt. reason to ok, unknown_uid, revoked albo skarga na podpis lub znacznik czasu.",
    ja: "ボディは {ok, valid, reason, service_id} で、成功時は contact_id、pairwise_uid、ts_seconds が加わる。valid が真なら 200、偽なら 401、形は同じ。reason の値は ok、unknown_uid、revoked、あるいは署名とタイムスタンプに関する文句だ。",
    th: "เนื้อหาคือ {ok, valid, reason, service_id} และเมื่อสำเร็จจะมี contact_id, pairwise_uid กับ ts_seconds เพิ่มมาด้วย — valid เป็นจริงตอบ 200 เป็นเท็จตอบ 401 รูปทรงเหมือนกัน ส่วน reason เป็น ok, unknown_uid, revoked หรือข้อบ่นเรื่องลายเซ็นกับเวลา",
    fi: "Runko on {ok, valid, reason, service_id} ja onnistuessa myös contact_id, pairwise_uid ja ts_seconds. Tosi valid vastaa 200, epätosi 401, sama muoto. reason on ok, unknown_uid, revoked tai valitus allekirjoituksesta tai aikaleimasta.",
    uk: "Тіло — {ok, valid, reason, service_id}, а при успіху ще contact_id, pairwise_uid і ts_seconds. Істинний valid відповідає 200, хибний — 401, форма та сама. reason приймає ok, unknown_uid, revoked або скаргу на підпис чи мітку часу.",
    bg: "Тялото е {ok, valid, reason, service_id}, а при успех още contact_id, pairwise_uid и ts_seconds. Вярно valid отговаря 200, невярно 401, същата форма. reason е ok, unknown_uid, revoked или оплакване за подписа или time stamp-а.",
    tr: "Gövde {ok, valid, reason, service_id} şeklindedir, başarıda ayrıca contact_id, pairwise_uid ve ts_seconds gelir. Doğru bir valid 200 ile, yanlış olanı 401 ile aynı biçimde yanıt verir. reason değerleri ok, unknown_uid, revoked ya da imza ve zaman damgasına dair bir sızlanmadır.",
    hu: "A törzs {ok, valid, reason, service_id}, és sikeres válasz esetén Contact_id, pairwise_uid és ts_seconds is. Egy igaz valid 200-assal, egy hamis 401-gyel válaszol, ugyanabban a formában. A reason értéke ok, unknown_uid, revoked, vagy egy panasz az aláírásra illetve az időbélyegre.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 5. Directory entry generator
 * ───────────────────────────────────────────────────────────────────────── */

const GEN_TITLE: Localized<string> = {
  en: "Decentralised directory JSON generator",
  ru: "Генератор JSON для децентрализованного каталога",
  de: "Generator für dezentrales Verzeichnis-JSON",
  fr: "Générateur de JSON d'annuaire décentralisé",
  it: "Generatore di JSON per directory decentralizzata",
  nl: "Generator voor gedecentraliseerde directory-JSON",
  cs: "Generátor JSON pro decentralizovaný adresář",
  "zh-Hans": "去中心化目录 JSON 生成器",
  "zh-Hant": "去中心化目錄 JSON 產生器",
  es: "Generador de JSON de directorio descentralizado",
  pl: "Generator JSON-u decentralizowanego katalogu",
  ja: "分散型ディレクトリ JSON ジェネレーター",
  th: "ตัวสร้าง JSON สำหรับไดเรกทอรีแบบกระจายศูนย์",
  fi: "Hajautetun hakemiston JSON-luonti",
  uk: "Генератор JSON для децентралізованого каталогу",
  bg: "Генератор на JSON за децентрализиран указател",
  tr: "Merkeziyetsiz dizin JSON üreticisi",
  hu: "Decentralizált könyvtár JSON generátor",
};

const GEN_LEDE: Localized<string> = {
  en: "The gateway has no directory submission endpoint of any kind — PUBLIC_ROUTE_KEYS lists exactly four token-free routes: /healthz, /, /h5/{article_id} and /api/v1/verifyH5Auth. So the format below is this page's proposal (a draft), and the submission path is a pull request against the source repository. The form runs entirely in your browser and sends nothing anywhere.",
  ru: "У шлюза нет эндпоинта для подачи в каталог — вообще никакого: в PUBLIC_ROUTE_KEYS ровно четыре маршрута без токена — /healthz, /, /h5/{article_id} и /api/v1/verifyH5Auth. Значит, формат ниже — предложение этой страницы (черновик), а способ подачи — pull request в исходный репозиторий. Форма работает целиком в вашем браузере и никуда ничего не отправляет.",
  de: "Das Gateway hat keinerlei Endpunkt zur Katalogeinreichung — PUBLIC_ROUTE_KEYS führt genau vier tokenfreie Routen auf: /healthz, /, /h5/{article_id} und /api/v1/verifyH5Auth. Das folgende Format ist deshalb der Vorschlag dieser Seite (ein Entwurf), und der Weg der Einreichung ist ein Pull Request gegen das Quellrepo. Das Formular läuft vollständig in Ihrem Browser und sendet nichts hinaus.",
  fr: "La passerelle ne propose aucun point d'entrée de soumission à un annuaire — PUBLIC_ROUTE_KEYS ne compte que quatre routes sans jeton : /healthz, /, /h5/{article_id} et /api/v1/verifyH5Auth. Le format ci-dessous est donc la proposition de cette page (un brouillon), et la voie de soumission est une pull request sur le dépôt source. Le formulaire tourne entièrement dans votre navigateur et n'envoie rien.",
  it: "Il gateway non ha nessun endpoint di sottomissione alla directory — PUBLIC_ROUTE_KEYS elenca esattamente quattro route senza token: /healthz, /, /h5/{article_id} e /api/v1/verifyH5Auth. Il formato qui sotto è quindi la proposta di questa pagina (una bozza), e la via di sottomissione è una pull request verso il repository sorgente. Il modulo gira interamente nel tuo browser e non manda nulla da nessuna parte.",
  nl: "De gateway heeft in het geheel geen endpoint voor directory-inzending — PUBLIC_ROUTE_KEYS somt precies vier tokenloze routes op: /healthz, /, /h5/{article_id} en /api/v1/verifyH5Auth. Het onderstaande format is daarom het voorstel van deze pagina (een concept), en de inzendingweg is een pull request tegen de bronrepository. Het formulier draait volledig in je browser en verzendt niets.",
  cs: "Brána nemá žádné rozhraní pro podání do adresáře — PUBLIC_ROUTE_KEYS uvádí přesně čtyři routy bez tokenu: /healthz, /, /h5/{article_id} a /api/v1/verifyH5Auth. Následující formát je proto návrhem této stránky (koncept) a cestou podání je pull request do zdrojového repozitáře. Formulář běží celý ve vašem prohlížeči a nikam nic neposílá.",
  "zh-Hans": "网关没有目录提交接口，也没有任何收录端点——PUBLIC_ROUTE_KEYS 里只有 /healthz、/、/h5/{article_id} 与 /api/v1/verifyH5Auth 四个免令牌路由。所以下面的格式是本页面提议的收录格式（草案），提交方式是向源码仓库开一个 PR。表单只在你这台设备的浏览器里运行，不发送任何东西。",
  "zh-Hant": "閘道沒有目錄提交介面，也沒有任何收錄端點——PUBLIC_ROUTE_KEYS 裡只有 /healthz、/、/h5/{article_id} 與 /api/v1/verifyH5Auth 四個免令牌路由。所以下面的格式是本頁面提議的收錄格式（草案），提交方式是對原始碼倉庫開一個 PR。表單只在你這台裝置的瀏覽器裡執行，不傳送任何東西。",
  es: "La pasarela no tiene ningún endpoint de envío de directorio — PUBLIC_ROUTE_KEYS enumera exactamente cuatro rutas sin token: /healthz, /, /h5/{article_id} y /api/v1/verifyH5Auth. Así que el formato de abajo es la propuesta de esta página (un borrador), y el camino de envío es una pull request contra el repositorio fuente. El formulario corre íntegramente en su navegador y no envía nada a ningún sitio.",
  pl: "Brama nie ma w ogóle punktu końcowego do zgłaszania wpisów — PUBLIC_ROUTE_KEYS wymienia dokładnie cztery trasy bez tokenu: /healthz, /, /h5/{article_id} i /api/v1/verifyH5Auth. Poniższy format jest więc propozycją tej strony (projektem), a drogą zgłoszenia pull request do repozytorium źródłowego. Formularz działa w całości w Twojej przeglądarce i niczego nie wysyła.",
  ja: "ゲートウェイにディレクトリ提出用のエンドポイントは存在しない。PUBLIC_ROUTE_KEYS が並べるトークン不要のルートは /healthz、/、/h5/{article_id}、/api/v1/verifyH5Auth の 4 本だけ。したがって下の形式はこのページの提案（ドラフト）で、提出方法はソースリポジトリへのプルリクエストである。このフォームは端末のブラウザだけで動き、外部へ何も送らない。",
  th: "เกตเวย์ไม่มี endpoint สำหรับส่งรายการเข้าไดเรกทอรีเลย — PUBLIC_ROUTE_KEYS มีเส้นทางไม่ต้องใช้ token อยู่สี่เส้นเท่านั้น คือ /healthz, /, /h5/{article_id} และ /api/v1/verifyH5Auth รูปแบบด้านล่างจึงเป็นข้อเสนอของหน้านี้ (ยังเป็นร่าง) ส่วนวิธีส่งคือเปิด pull request เข้ารีโปซอร์ส เครื่องฟอร์มนี้ทำงานในเบราว์เซอร์ของคุณล้วน ๆ และไม่ส่งอะไรออกไปเลย",
  fi: "Yhdyskäytävällä ei ole ollenkaan hakemiston lähetyspäätettä — PUBLIC_ROUTE_KEYS listaa täsmälleen neljä todennuksetonta reittiä: /healthz, /, /h5/{article_id} ja /api/v1/verifyH5Auth. Jäljempänä oleva muoto on tämän sivun ehdotus (luonnos), ja lähetystapa on pull request lähdearkistoon. Lomake toimii kokonaan selaimessasi eikä lähetä mitään minnekään.",
  uk: "У шлюза немає жодного ендпоінта для подання до каталогу — PUBLIC_ROUTE_KEYS містить рівно чотири маршрути без токена: /healthz, /, /h5/{article_id} та /api/v1/verifyH5Auth. Тому формат нижче — це пропозиція цієї сторінки (чернетка), а спосіб подання — pull request до вихідного репозиторію. Форма працює повністю у вашому браузері і нікуди нічого не надсилає.",
  bg: "Шлюзът няма никакъв крайна точка за подаване в указател — PUBLIC_ROUTE_KEYS изброява точно четири маршрута без токен: /healthz, /, /h5/{article_id} и /api/v1/verifyH5Auth. Затова долният формат е предложението на тази страница (чернова), а начинът на подаване е pull request към изходното хранилище. Формулярът работи изцяло във вашия браузър и нищо не изпраща.",
  tr: "Ağ geçidinde dizine gönderim için hiçbir uç nokta yok — PUBLIC_ROUTE_KEYS tam olarak dört adet jtonsuz yolu listeliyor: /healthz, /, /h5/{article_id} ve /api/v1/verifyH5Auth. Dolayısıyla aşağıdaki biçim bu sayfanın önerisidir (bir taslak) ve gönderim yolu kaynak depoya bir pull request açmaktır. Form tamamen tarayıcınızda çalışır ve dışarıya hiçbir şey göndermez.",
  hu: "Az átjárónak egyáltalán nincs könyvtár-benyújtási végpontja — a PUBLIC_ROUTE_KEYS pontosan négy token nélküli útvonalat sorol fel: /healthz, /, /h5/{article_id} és /api/v1/verifyH5Auth. Az alábbi formátum ezért ennek az oldalnak a javaslata (tervezet), a benyújtás módja pedig a forrástárolóhoz nyitott pull request. Az űrlap teljesen a böngészőben fut és semmit nem küld el.",
};

const GEN_CTA: Localized<string> = {
  en: "Open the directory generator",
  ru: "Открыть генератор каталога",
  de: "Verzeichnis-Generator öffnen",
  fr: "Ouvrir le générateur d'annuaire",
  it: "Apri il generatore di directory",
  nl: "Open de directorygenerator",
  cs: "Otevřít generátor adresáře",
  "zh-Hans": "打开目录生成器",
  "zh-Hant": "開啟目錄產生器",
  es: "Abrir el generador de directorio",
  pl: "Otwórz generator katalogu",
  ja: "ディレクトリ生成器を開く",
  th: "เปิดตัวสร้างไดเรกทอรี",
  fi: "Avaa hakemistoluoja",
  uk: "Відкрити генератор каталогу",
  bg: "Отвори генератора на указател",
  tr: "Dizin üreticisini aç",
  hu: "Könyvtárgenerátor megnyitása",
};

const PROPOSAL_CHIP: Localized<string> = {
  en: "Format proposed by this page",
  ru: "Формат, предложенный этой страницей",
  de: "Von dieser Seite vorgeschlagenes Format",
  fr: "Format proposé par cette page",
  it: "Formato proposto da questa pagina",
  nl: "Door deze pagina voorgesteld format",
  cs: "Formát navržený touto stránkou",
  "zh-Hans": "本页面提议的收录格式",
  "zh-Hant": "本頁面提議的收錄格式",
  es: "Formato propuesto por esta página",
  pl: "Format zaproponowany przez tę stronę",
  ja: "このページが提案する形式",
  th: "รูปแบบที่หน้านี้เสนอ",
  fi: "Tämän sivun ehdottama muoto",
  uk: "Формат, запропонований цією сторінкою",
  bg: "Формат, предложен от тази страница",
  tr: "Bu sayfanın önerdiği biçim",
  hu: "Az oldal által javasolt formátum",
};

const GEN_DISCLAIMER: Localized<string> = {
  en: "Sample / placeholder demo data — this format is a draft, not an existing specification. The output stays on this page and is never sent anywhere.",
  ru: "Пример / заполнитель для демонстрации — этот формат черновик, а не существующая спецификация. Результат остаётся на этой странице и никуда не отправляется.",
  de: "Beispiel- / Platzhalter-Demodaten — dieses Format ist ein Entwurf, keine bestehende Spezifikation. Die Ausgabe bleibt auf dieser Seite und wird nirgends hin gesendet.",
  fr: "Exemple / données de démonstration — ce format est un brouillon, pas une spécification existante. La sortie reste sur cette page et n'est jamais envoyée.",
  it: "Esempio / dati segnaposto dimostrativi — questo formato è una bozza, non una specifica esistente. L'output resta su questa pagina e non viene inviato da nessuna parte.",
  nl: "Voorbeeld-/placeholder-demogegevens — dit format is een concept, geen bestaande specificatie. De uitvoer blijft op deze pagina en wordt nergens naartoe gestuurd.",
  cs: "Ukázková / výplňová demo data — tento formát je koncept, nikoli existující specifikace. Výstup zůstává na této stránce a nikam se neposílá.",
  "zh-Hans": "示例 / 占位演示数据 —— 这个格式是草案，不是已经存在的规范；生成结果留在本页面，不会被发送出去。",
  "zh-Hant": "範例 / 佔位示範資料 —— 這個格式是草案，不是已經存在的規範；產生結果留在本頁面，不會被送出去。",
  es: "Datos de ejemplo / marcador de posición — este formato es un borrador, no una especificación existente. La salida se queda en esta página y nunca se envía a ninguna parte.",
  pl: "Przykładowe dane / wypełniacz demonstracyjny — ten format jest projektem, nie istniejącą specyfikacją. Wynik pozostaje na tej stronie i nigdzie nie jest wysyłany.",
  ja: "サンプル／プレースホルダーのデモデータです。この形式はドラフトであり、確定した仕様ではない。生成結果はこのページ内に留まり、外部には一切送信されない。",
  th: "ข้อมูลตัวอย่าง / ข้อมูลจำลองสำหรับโชว์ — รูปแบบนี้ยังเป็นร่าง ไม่ใช่ข้อกำหนดที่ใช้บังคับ ผลลัพธ์อยู่ในหน้านี้ ไม่ถูกส่งไปที่ใด",
  fi: "Esimerkki- / paikkannusdataa — tämä muoto on luonnos, ei olemassa oleva spesifikaatio. Tulos pysyy tällä sivulla eikä lähteen minnekään.",
  uk: "Приклад / демонстраційні заповнювачі — цей формат є чернеткою, а не чинною специфікацією. Результат лишається на цій сторінці й нікуди не надсилається.",
  bg: "Примерни / запълващи демонстрационни данни — този формат е чернова, не съществуваща спецификация. Изходът остава на тази страница и никога не се изпраща.",
  tr: "Örnek / yer tutucu gösteri verisi — bu biçim bir taslaktır, var olan bir özellik değildir. Çıktı bu sayfada kalır ve hiçbir yere gönderilmez.",
  hu: "Példa / helykitöltő bemutató adatok — ez a formátum tervezet, nem létező specifikáció. A kimenet ezen az oldalon marad, és sehova nem kerül elküldésre.",
};

const GEN_RESTORE: Localized<string> = {
  en: "Restore the sample",
  ru: "Вернуть пример",
  de: "Beispiel wiederherstellen",
  fr: "Restaurer l'exemple",
  it: "Ripristina l'esempio",
  nl: "Voorbeeld herstellen",
  cs: "Obnovit ukázku",
  "zh-Hans": "恢复示例内容",
  "zh-Hant": "恢復範例內容",
  es: "Restaurar el ejemplo",
  pl: "Przywróć przykład",
  ja: "サンプルに戻す",
  th: "คืนค่าตัวอย่าง",
  fi: "Palauta esimerkki",
  uk: "Повернути приклад",
  bg: "Възстанови примера",
  tr: "Örneği geri yükle",
  hu: "Példa visszaállítása",
};

const GEN_REPO_LINK: Localized<string> = {
  en: "Source repository",
  ru: "Исходный репозиторий",
  de: "Quellrepository",
  fr: "Dépôt source",
  it: "Repository sorgente",
  nl: "Bronrepository",
  cs: "Zdrojový repozitář",
  "zh-Hans": "源码仓库",
  "zh-Hant": "原始碼倉庫",
  es: "Repositorio fuente",
  pl: "Repozytorium źródłowe",
  ja: "ソースリポジトリ",
  th: "รีโปซอร์ส",
  fi: "Lähdearkisto",
  uk: "Вихідний репозиторій",
  bg: "Изходно хранилище",
  tr: "Kaynak depo",
  hu: "Forrástároló",
};

const GEN_OUTPUT_LABEL: Localized<string> = {
  en: "Generated entry",
  ru: "Сгенерированная запись",
  de: "Erzeugter Eintrag",
  fr: "Entrée générée",
  it: "Voce generata",
  nl: "Gegenereerd item",
  cs: "Vygenerovaná položka",
  "zh-Hans": "生成结果",
  "zh-Hant": "產生結果",
  es: "Entrada generada",
  pl: "Wygenerowany wpis",
  ja: "生成されたエントリー",
  th: "รายการที่สร้างได้",
  fi: "Luotu merkintä",
  uk: "Згенерований запис",
  bg: "Генериран запис",
  tr: "Oluşturulan kayıt",
  hu: "Legenerált bejegyzés",
};

const GEN_STEPS_TITLE: Localized<string> = {
  en: "Submitting it as a community pull request",
  ru: "Как подать это community pull request-ом",
  de: "Einreichen als Pull Request der Gemeinschaft",
  fr: "Le soumettre comme une pull request communautaire",
  it: "Sottometterlo come pull request della community",
  nl: "Het indienen als een community pull request",
  cs: "Podání jako community pull request",
  "zh-Hans": "作为社区 PR 提交",
  "zh-Hant": "作為社群 PR 提交",
  es: "Enviarlo como una pull request de la comunidad",
  pl: "Zgłoszenie tego jako pull request społeczności",
  ja: "コミュニティの PR として提出する",
  th: "ส่งเป็น pull request ของชุมชน",
  fi: "Lähettäminen yhteisön pull requestina",
  uk: "Подати це як community pull request",
  bg: "Подаване като pull request на общността",
  tr: "Topluluk pull request'i olarak göndermek",
  hu: "Benyújtás közösségi pull requestként",
};

const GEN_EMPTY_HINT: Localized<string> = {
  en: "A field left blank falls back to its sample value.",
  ru: "Оставленное пустым поле берёт своё примерное значение.",
  de: "Ein leer gelassenes Feld fällt auf seinen Beispielwert zurück.",
  fr: "Un champ laissé vide retombe sur sa valeur d'exemple.",
  it: "Un campo lasciato vuoto ripiega sul suo valore di esempio.",
  nl: "Een leeg gelaten veld valt terug op zijn voorbeeldwaarde.",
  cs: "Pole ponechané prázdné se vrátí ke své ukázkové hodnotě.",
  "zh-Hans": "留空的字段会回落到示例值。",
  "zh-Hant": "留空的欄位會回落到範例值。",
  es: "Un campo dejado en blanco recurre a su valor de ejemplo.",
  pl: "Pole pozostawione puste wraca do swojej przykładowej wartości.",
  ja: "空欄のままにすると、そのフィールドはサンプル値に戻る。",
  th: "ช่องที่เว้นว่างจะใช้ค่าตัวอย่างของช่องนั้น",
  fi: "Tyhjäksi jätetty kenttä palautuu esimerkkiarvoonsa.",
  uk: "Поле, залишене порожнім, бере своє прикладове значення.",
  bg: "Оставено празно поле се връща към примерната си стойност.",
  tr: "Boş bırakılan alan kendi örnek değerine döner.",
  hu: "Egy üresen hagyott mező a példaértékére esik vissza.",
};

type FieldSpec = {
  readonly id: string;
  readonly label: Localized<string>;
  readonly hint: Localized<string>;
  readonly sample: string;
  readonly multiline?: boolean;
  readonly options?: readonly string[];
};

/**
 * The six inputs. Each one carries its own sample so a blank field still
 * produces a complete entry, and the vocabulary stays visible on the page
 * rather than in a comment.
 */
const FIELD = {
  name: {
    id: "dir-name",
    label: {
      en: "Service name",
      ru: "Название сервиса",
      de: "Dienstname",
      fr: "Nom du service",
      it: "Nome del servizio",
      nl: "Servicenaam",
      cs: "Název služby",
      "zh-Hans": "服务名称",
      "zh-Hant": "服務名稱",
      es: "Nombre del servicio",
      pl: "Nazwa usługi",
      ja: "サービス名",
      th: "ชื่อบริการ",
      fi: "Palvelun nimi",
      uk: "Назва сервісу",
      bg: "Име на услугата",
      tr: "Hizmet adı",
      hu: "Szolgáltatás neve",
    },
    hint: {
      en: "The name shown in the listing; the slug is folded from it.",
      ru: "Имя, показываемое в каталоге; из него сворачивается slug.",
      de: "Der Name, der im Eintrag steht; aus ihm wird der slug gefaltet.",
      fr: "Le nom affiché dans la liste ; le slug en est dérivé.",
      it: "Il nome mostrato nella voce; lo slug si ripiega da esso.",
      nl: "De naam die in de vermelding staat; de slug wordt ervan afgeleid.",
      cs: "Jméno zobrazené v výčtu; slug se z něj složí.",
      "zh-Hans": "目录里显示的名字，slug 由它折叠出来。",
      "zh-Hant": "目錄裡顯示的名字，slug 由它摺疊出來。",
      es: "El nombre que se muestra en la lista; el slug se pliega de él.",
      pl: "Nazwa wyświetlana w zestawieniu; slug jest z niej składany.",
      ja: "一覧に表示される名前。slug はこれから折りたたまれる。",
      th: "ชื่อที่แสดงในรายการ — slug ถูกย่อมาจากชื่อนี้",
      fi: "Listingissä näkyvä nimi; slug taitetaan sen päälle.",
      uk: "Ім'я, показане в переліку; з нього згортається slug.",
      bg: "Името, показано в списъка; slug се сгъва от него.",
      tr: "Kayıtta gösterilen ad; slug onundan katlanır.",
      hu: "A listában megjelenő név; a slug ebből áll elő.",
    },
    sample: "POPOPX Service Suite",
  },
  operator: {
    id: "dir-operator",
    label: {
      en: "Operator",
      ru: "Оператор",
      de: "Betreiber",
      fr: "Opérateur",
      it: "Gestore",
      nl: "Exploitant",
      cs: "Provozovatel",
      "zh-Hans": "运营者",
      "zh-Hant": "營運者",
      es: "Operador",
      pl: "Operator usługi",
      ja: "運営者",
      th: "ผู้ดำเนินการ",
      fi: "Ylläpitäjä",
      uk: "Оператор",
      bg: "Оператор",
      tr: "İşleten",
      hu: "Üzemeltető",
    },
    hint: {
      en: "A person, a team or a company. A listing has to name somebody accountable.",
      ru: "Человек, команда или компания. Запись в каталоге обязана называть ответственного.",
      de: "Eine Person, ein Team oder eine Firma. Ein Eintrag muss jemanden nennen, der zuständig ist.",
      fr: "Une personne, une équipe ou une société. Une entrée doit nommer un responsable.",
      it: "Una persona, un team o un'azienda. Una voce deve nominare qualcuno di responsabile.",
      nl: "Een persoon, een team of een bedrijf. Een vermelding moet iemand aanspreekbaar noemen.",
      cs: "Osoba, tým nebo firma. Položka musí uvést někoho odpovědného.",
      "zh-Hans": "个人、团队或公司。一条收录要能联系到责任主体。",
      "zh-Hant": "個人、團隊或公司。一筆收錄要能聯絡到負責主體。",
      es: "Una persona, un equipo o una empresa. Una entrada tiene que nombrar a alguien responsable.",
      pl: "Osoba, zespół albo firma. Wpis musi wskazywać kogoś odpowiedzialnego.",
      ja: "個人でもチームでも会社でもよい。掲載条目には責任者の名前が要る。",
      th: "จะเป็นบุคคล ทีม หรือบริษัทก็ได้ — รายการหนึ่งต้องมีชื่อผู้ที่รับผิดชอบ",
      fi: "Henkilö, tiimi tai yritys. Merkinnän on nimettävä joku vastuullainen.",
      uk: "Особа, команда чи компанія. Запис у каталозі має називати відповідального.",
      bg: "Лице, екип или фирма. Записът трябва да сочи отговорен субект.",
      tr: "Bir kişi, bir ekip ya da bir şirket. Bir kaydın sorumlu birini adlandırması gerekir.",
      hu: "Személy, csapat vagy cég. Egy bejegyzésnek nevet kell adnia a felelősnek.",
    },
    sample: "POPOPX Community",
  },
  address: {
    id: "dir-address",
    label: {
      en: "SMP / relay address",
      ru: "SMP / адрес ретранслятора",
      de: "SMP- / Relay-Adresse",
      fr: "Adresse SMP / relais",
      it: "Indirizzo SMP / relay",
      nl: "SMP- / relayadres",
      cs: "SMP / adresa relay",
      "zh-Hans": "SMP / 中继地址",
      "zh-Hant": "SMP / 中繼位址",
      es: "Dirección SMP / relay",
      pl: "Adres SMP / przekaźnika",
      ja: "SMP／リレーアドレス",
      th: "ที่อยู่ SMP / ตัวกลาง",
      fi: "SMP- / välityspalvelinosoite",
      uk: "SMP / адреса ретранслятора",
      bg: "SMP / адрес на реле",
      tr: "SMP / aktarma adresi",
      hu: "SMP / relay cím",
    },
    hint: {
      en: "The account's own invite address, of the form popopx:/Q7dnHsF8Kz. It is a secret: hand it to reviewers inside the pull request rather than pasting it publicly.",
      ru: "Собственный адрес-приглашение аккаунта вида popopx:/Q7dnHsF8Kz. Это секрет: передавайте его ревьюерам внутри pull request, а не публикуйте.",
      de: "Die eigene Einladungsadresse des Kontos, Form popopx:/Q7dnHsF8Kz. Sie ist ein Geheimnis: geben Sie sie Prüfern im Pull Request, statt sie öffentlich einzufügen.",
      fr: "La propre adresse d'invitation du compte, de la forme popopx:/Q7dnHsF8Kz. C'est un secret : remettez-la aux relecteurs dans la pull request, ne la collez pas publiquement.",
      it: "L'indirizzo d'invito dell'account stesso, nella forma popopx:/Q7dnHsF8Kz. È un segreto: dagli ai revisori dentro la pull request invece di incollarlo pubblicamente.",
      nl: "Het eigen uitnodigingsadres van de account, in de vorm popopx:/Q7dnHsF8Kz. Het is een geheim: geef het aan reviewers in de pull request in plaats van het openbaar te plakken.",
      cs: "Vlastní adresa pozvánky účtu, ve tvaru popopx:/Q7dnHsF8Kz. Je to tajemství: předejte ji recenzentům uvnitř pull requestu, nevkládejte ji veřejně.",
      "zh-Hans": "服务号自己的邀请地址，形如 popopx:/Q7dnHsF8Kz。它是秘密：在 PR 里只交给审阅者，不要公开粘贴。",
      "zh-Hant": "服務號自己的邀請位址，形如 popopx:/Q7dnHsF8Kz。它是秘密：在 PR 裡只交給審閱者，不要公開貼上。",
      es: "La propia dirección de invitación de la cuenta, con forma popopx:/Q7dnHsF8Kz. Es un secreto: entréguesela a los revisores dentro de la pull request en lugar de pegarla públicamente.",
      pl: "Własny adres zaproszenia konta, w postaci popopx:/Q7dnHsF8Kz. To tajemnica: przekaż go recenzentom wewnątrz pull request, zamiast wklejać publicznie.",
      ja: "アカウント自身の招待アドレスで、形は popopx:/Q7dnHsF8Kz。これは秘密情報だ。公開で貼り付けるのではなく、PR の中でレビュアーにだけ渡す。",
      th: "ที่อยู่เชิญของบัญชีบริการนี้เอง มีรูปแบบเป็น popopx:/Q7dnHsF8Kz — มันเป็นความลับ ส่งให้ผู้ตรวจโค้ดใน pull request อย่าเอาไปวางเผยแพร่",
      fi: "Tilin oma kutsuosoite, muotoa popopx:/Q7dnHsF8Kz. Se on salaisuus: anna se tarkastajille pull requestin sisällä, älä liitä sitä julkisesti.",
      uk: "Власна адреса-запрошення облікового запису, вигляду popopx:/Q7dnHsF8Kz. Це таємниця: передайте її рецензентам у межах pull request, а не публікуйте.",
      bg: "Собственият адрес-покана на акаунта, от вида popopx:/Q7dnHsF8Kz. Той е тайна: предайте го на прегледачите вътре в pull request, вместо да го лепите публично.",
      tr: "Hesabın kendi davet adresi, biçimi popopx:/Q7dnHsF8Kz. Bu bir sırdır: onu herkese yapıştırmak yerine pull request içinde inceleyenlere verin.",
      hu: "A fiók saját meghívó címe, alakja popopx:/Q7dnHsF8Kz. Ez titok: a pull requesten belül adja át a bírálóknak, ne illessze be nyilvánosan.",
    },
    sample: DEMO_INVITE_ADDRESS,
  },
  category: {
    id: "dir-category",
    label: {
      en: "Category",
      ru: "Категория",
      de: "Kategorie",
      fr: "Catégorie",
      it: "Categoria",
      nl: "Categorie",
      cs: "Kategorie",
      "zh-Hans": "分类",
      "zh-Hant": "分類",
      es: "Categoría",
      pl: "Kategoria",
      ja: "カテゴリ",
      th: "หมวดหมู่",
      fi: "Luokka",
      uk: "Категорія",
      bg: "Категория",
      tr: "Kategori",
      hu: "Kategória",
    },
    hint: {
      en: "The draft's own vocabulary; the selector is the whole list.",
      ru: "Словарь самого черновика; список значений — весь в этом селекторе.",
      de: "Das eigene Vokabular des Entwurfs; die Auswahl ist die vollständige Liste.",
      fr: "Le vocabulaire propre au brouillon ; le sélecteur en donne la liste entière.",
      it: "Il vocabolario proprio della bozza; il selettore è l'elenco completo.",
      nl: "Het eigen vocabulary van het concept; de selector is de volledige lijst.",
      cs: "Vlastní slovník konceptu; výběr je celý výčet hodnot.",
      "zh-Hans": "草案自定的取值集合，收录取值见这个下拉。",
      "zh-Hant": "草案自定的取值集合，收錄取值見這個下拉。",
      es: "El vocabulario propio del borrador; el selector muestra la lista completa.",
      pl: "Własny słownik projektu; selektor pokazuje całą listę wartości.",
      ja: "ドラフトが独自に定めた語彙。取りうる値はこのセレクトの一覧どおり。",
      th: "คำศัพท์ที่ร่างนี้กำหนดเอง — ค่าที่รับมีเท่าที่เห็นในกล่องเลือกนี้ทั้งหมด",
      fi: "Luonnoksen oma sanasto; valitsin sisältää koko joukon.",
      uk: "Власний словник чернетки; селектор показує весь перелік значень.",
      bg: "Собственият речник на черновата; селекторът е целият списък.",
      tr: "Taslığın kendi sözcük dağarcığı; seçicideki liste bütün listedir.",
      hu: "A tervezet saját szókincse; a választó tartalmazza az egész listát.",
    },
    sample: "tools",
    options: ["tools", "commerce", "news", "devops", "community", "research"],
  },
  summary: {
    id: "dir-summary",
    label: {
      en: "Description",
      ru: "Описание",
      de: "Beschreibung",
      fr: "Présentation",
      it: "Descrizione",
      nl: "Beschrijving",
      cs: "Popis",
      "zh-Hans": "简介",
      "zh-Hant": "簡介",
      es: "Descripción",
      pl: "Opis",
      ja: "説明",
      th: "คำอธิบาย",
      fi: "Kuvaus",
      uk: "Опис",
      bg: "Описание",
      tr: "Açıklama",
      hu: "Leírás",
    },
    hint: {
      en: "One sentence. The draft caps it at 240 characters, the same budget as a card field value.",
      ru: "Одно предложение. Черновик ограничивает его 240 символами — тот же бюджет, что у значения поля карточки.",
      de: "Ein Satz. Der Entwurf deckelt ihn auf 240 Zeichen — dasselbe Budget wie ein Kartenfeldwert.",
      fr: "Une phrase. Le brouillon la plafonne à 240 caractères, même budget qu'une valeur de champ de carte.",
      it: "Una frase. La bozza la limita a 240 caratteri, lo stesso budget di un valore di campo della carta.",
      nl: "Eén zin. Het concept plafonneert op 240 tekens, dezelfde budgetgrens als een kaartveldwaarde.",
      cs: "Jedna věta. Koncept ji omezuje na 240 znaků, stejný rozpočet jako hodnota pole karty.",
      "zh-Hans": "一句话。草案建议上限 240 个字符，与卡片字段值同一尺度。",
      "zh-Hant": "一句話。草案建議上限 240 個字元，與卡片欄位值同一尺度。",
      es: "Una frase. El borrador la limita a 240 caracteres, el mismo presupuesto que un valor de campo de tarjeta.",
      pl: "Jedno zdanie. Projekt ogranicza je do 240 znaków, ten sam budżet co wartość pola karty.",
      ja: "一文。ドラフトは 240 文字を上限としており、これはカードの項目値と同じ枠だ。",
      th: "หนึ่งประโยค — ร่างนี้กำหนดเพดานไว้ 240 อักขระ เท่ากับโควตาของค่าช่องในการ์ด",
      fi: "Yksi lause. Luonnos rajaa sen 240 merkkiin, sama tilibudjetti kuin kortin kenttäarvolla.",
      uk: "Одне речення. Чернетка обмежує його 240 символами — той самий бюджет, що й у значенні поля картки.",
      bg: "Едно изречение. Черновата го ограничава до 240 знака — същият бюджет като стойност на поле от карта.",
      tr: "Bir cümle. Taslak onu 240 karakterle sınırlıyor; bu, bir kart alanı değerinin bütçesiyle aynı.",
      hu: "Egy mondat. A tervezet 240 karakterben szab limitet, ugyanakkora keretben, mint egy kártyamező értéke.",
    },
    sample:
      "Reference service account for the open protocol: cards, menus, channel key rotation, traceless scan-to-sign-in.",
    multiline: true,
  },
  contact: {
    id: "dir-contact",
    label: {
      en: "Contact link",
      ru: "Контактная ссылка",
      de: "Kontaktlink",
      fr: "Lien de contact",
      it: "Link di contatto",
      nl: "Contactlink",
      cs: "Kontaktní odkaz",
      "zh-Hans": "联系链接",
      "zh-Hant": "聯絡連結",
      es: "Enlace de contacto",
      pl: "Łącze kontaktowe",
      ja: "連絡リンク",
      th: "ลิงก์ติดต่อ",
      fi: "Yhteyslinkki",
      uk: "Контактне посилання",
      bg: "Връзка за контакт",
      tr: "İletişim bağlantısı",
      hu: "Kapcsolattartási hivatkozás",
    },
    hint: {
      en: "An absolute https URL with a host, which is exactly the check an open_url card action has to pass.",
      ru: "Абсолютный https URL с именем хоста — ровно та проверка, которую проходит действие open_url на карточке.",
      de: "Eine absolute https-URL mit Hostnamen — genau die Prüfung, die eine open_url-Aktion der Karte bestehen muss.",
      fr: "Une URL absolue en https avec un hôte, exactement le contrôle que doit passer une action open_url de carte.",
      it: "Un URL assoluto in https con un host, che è esattamente il controllo che un'azione open_url della carta deve superare.",
      nl: "Een absolute https-URL met een host, precies de controle die een open_url-actie van de kaart moet doorstaan.",
      cs: "Absolutní https URL s hostitelem, přesně ta kontrola, kterou musí projít akce open_url na kartě.",
      "zh-Hans": "https 的绝对地址，必须有主机名——这正是卡片 open_url 的校验规则。",
      "zh-Hant": "https 的絕對位址，必須有主機名——這正是卡片 open_url 的校驗規則。",
      es: "Una URL https absoluta con host, que es justamente la comprobación que debe pasar la acción open_url de una tarjeta.",
      pl: "Bezwzględny adres https z nazwą hosta, dokładnie ta kontrola, którą musi przejść akcja open_url karty.",
      ja: "ホスト名を含む https の絶対 URL。カードの open_url 動作が通るのと同じ検証規則だ。",
      th: "ต้องเป็น URL แบบเต็มเฉพาะ https พร้อมชื่อโฮสต์ — เป็นการตรวจแบบเดียวกับที่ action open_url ในการ์ดต้องผ่าน",
      fi: "Absoluuttinen https-URL, jossa on isäntä, täsmälleen sama tarkistus kuin kortin open_url-toiminnon on läpäistävä.",
      uk: "Абсолютна https URL з іменем хоста — саме ту перевірку має пройти дія open_url на картці.",
      bg: "Абсолютен https URL с хост — точно проверката, която действието open_url на картата трябва да мине.",
      tr: "Mutlak bir https adresi, barındırma adı içermeli — karttaki open_url eyleminin geçmek zorunda olduğu denetim tam olarak budur.",
      hu: "Abszolút https URL gépnévvel — pontosan ezt a vizsgát kell teljesítenie egy kártya open_url műveletének.",
    },
    sample: "https://service.example.com/contact",
  },
} satisfies Record<string, FieldSpec>;

const GEN_FIELDS: readonly FieldSpec[] = [
  FIELD.name,
  FIELD.operator,
  FIELD.address,
  FIELD.category,
  FIELD.summary,
  FIELD.contact,
];

const GEN_STEPS: readonly Localized<string>[] = [
  {
    en: "Replace the sample with real information and treat the two address fields differently: invite_address is a secret for reviewers inside the pull request, contact_url must be something you are willing to publish.",
    ru: "Замените пример настоящими данными и разделите два адресных поля: invite_address — секрет, его видят только ревьюеры внутри pull request, contact_url обязан быть тем, что вы готовы опубликовать.",
    de: "Ersetzen Sie das Beispiel durch echte Angaben und unterscheiden Sie die zwei Adressfelder: invite_address ist ein Geheimnis für Prüfer im Pull Request, contact_url muss etwas sein, das Sie veröffentlichen wollen.",
    fr: "Remplacez l'exemple par de vraies informations et distinguez les deux champs d'adresse : invite_address est un secret réservé aux relecteurs dans la pull request, contact_url doit être quelque chose que vous acceptez de publier.",
    it: "Sostituisci l'esempio con informazioni reali e tratta diversamente i due campi indirizzo: invite_address è un segreto per i revisori dentro la pull request, contact_url deve essere qualcosa che sei disposto a pubblicare.",
    nl: "Vervang het voorbeeld door echte gegevens en scheid de twee adresvelden: invite_address is een geheim voor reviewers in de pull request, contact_url moet iets zijn dat u publicerbaar vindt.",
    cs: "Nahraďte ukázku skutečnými údaji a rozlište dvě pole adres: invite_address je tajemství pro recenzenty uvnitř pull requestu, contact_url musí být něco, co jste ochotni zveřejnit.",
    "zh-Hans": "把表单换成真实信息，并区分两类字段：invite_address 是秘密，只在 PR 里给审阅者；contact_url 必须是你愿意公开的地址。",
    "zh-Hant": "把表單換成真實資訊，並區分兩類欄位：invite_address 是秘密，只在 PR 裡給審閱者；contact_url 必須是你願意公開的位址。",
    es: "Sustituya el ejemplo por información real y distinga los dos campos de dirección: invite_address es un secreto para los revisores dentro de la pull request, contact_url debe ser algo que esté dispuesto a publicar.",
    pl: "Zastąp przykład prawdziwymi danymi i rozróżnij dwa pola adresowe: invite_address jest sekretem dla recenzentów wewnątrz pull request, contact_url musi być czymś, co jesteś gotów opublikować.",
    ja: "サンプルを実情報に置き換え、二つのアドレス欄は区別して扱う。invite_address は秘密で、PR の中でレビュアーにだけ見せる。contact_url は公開を前提にできるアドレスでなければならない。",
    th: "เปลี่ยนข้อมูลตัวอย่างเป็นข้อมูลจริง แล้วแยกฟิลด์ที่อยู่สองชนิดออกจากกัน: invite_address เป็นความลับให้แต่ผู้ตรวจโค้ดใน pull request ส่วน contact_url ต้องเป็นที่อยู่ที่ยอมเผยแพร่ได้",
    fi: "Korvaa esimerkki oikeilla tiedoilla ja käsittele kaksi osoitekenttää eri lailla: invite_address on salaisuus tarkastajille pull requestin sisällä, contact_url on oltava jotakin, jonka suostut julkaisemaan.",
    uk: "Замініть приклад справжніми даними й розрізніть два адресні поля: invite_address — таємниця для рецензентів у межах pull request, contact_url має бути тим, що ви готові оприлюднити.",
    bg: "Заменете примера с истинска информация и разделете двете адресни полета: invite_address е тайна за прегледачите вътре в pull request, contact_url трябва да е нещо, което сте готови да публикувате.",
    tr: "Örneği gerçek bilgiyle değiştirin ve iki adres alanını ayrı tutun: invite_address pull request içinde inceleyenler için bir sırdır, contact_url ise yayınlamayı göze aldığınız bir adres olmalı.",
    hu: "Cserélje le a példát valódi adatokra, és a két címmezőt különböztessen meg: az invite_address titok, csak a pull requestben lévő bírálók lássák, a contact_url pedig legyen valami olyan, amit közzétenne.",
  },
  {
    en: "Copy the generated JSON, add it to the source repository as directory/<slug>.json, and open a pull request. The repository link is at the end of this section.",
    ru: "Скопируйте сгенерированный JSON, положите его в исходный репозиторий файлом directory/<slug>.json и откройте pull request. Ссылка на репозиторий — в конце этого раздела.",
    de: "Kopieren Sie das erzeugte JSON, fügen Sie es dem Quellrepository als directory/<slug>.json hinzu und öffnen Sie einen Pull Request. Der Reapolink steht am Ende dieses Abschnitts.",
    fr: "Copiez le JSON généré, ajoutez-le au dépôt source sous directory/<slug>.json et ouvrez une pull request. Le lien du dépôt est à la fin de cette section.",
    it: "Copia il JSON generato, aggiungilo al repository sorgente come directory/<slug>.json e apri una pull request. Il link al repository sta in fondo a questa sezione.",
    nl: "Kopieer de gegenereerde JSON, voeg die aan de bronrepository toe als directory/<slug>.json en open een pull request. De reapolink staat aan het einde van deze sectie.",
    cs: "Zkopírujte vygenerovaný JSON, přidejte ho do zdrojového repozitáře jako directory/<slug>.json a otevřete pull request. Odkaz na repozitář je na konci této sekce.",
    "zh-Hans": "复制生成的 JSON，在源码仓库里新建 directory/<slug>.json，把内容粘贴进去，开一个 PR。仓库链接就在这一节的末尾。",
    "zh-Hant": "複製產生的 JSON，在原始碼倉庫裡新建 directory/<slug>.json，把內容貼進去，開一個 PR。倉庫連結就在這一節的結尾。",
    es: "Copie el JSON generado, añádalo al repositorio fuente como directory/<slug>.json y abra una pull request. El enlace al repositorio está al final de esta sección.",
    pl: "Skopiuj wygenerowany JSON, dodaj go do repozytorium źródłowego jako directory/<slug>.json i otwórz pull request. Łącze do repozytorium znajduje się na końcu tej sekcji.",
    ja: "生成された JSON をコピーし、ソースリポジトリに directory/<slug>.json として追加し、PR を開く。リポジトリへのリンクはこの節の末尾にある。",
    th: "คัดลอก JSON ที่สร้างได้ แล้วเพิ่มเข้าไปในรีโปซอร์สเป็นไฟล์ directory/<slug>.json จากนั้นเปิด pull request — ลิงก์รีโปอยู่ท้ายหัวข้อนี้",
    fi: "Kopioi luotu JSON, lisää se lähdearkistoon tiedostoksi directory/<slug>.json ja avaa pull request. Arkistolinkki on tämän luvun lopussa.",
    uk: "Скопіюйте згенерований JSON, додайте його до вихідного репозиторію як directory/<slug>.json і відкрийте pull request. Посилання на репозиторій — наприкінці цього розділу.",
    bg: "Копирайте генерирания JSON, добавете го в изходното хранилище като directory/<slug>.json и отворете pull request. Връзката към хранилището е в края на тази секция.",
    tr: "Üretilen JSON'u kopyalayın, kaynak depoya directory/<slug>.json olarak ekleyin ve bir pull request açın. Depo bağlantısı bu bölümün en sonunda.",
    hu: "Másolja le a generált JSON-t, adja hozzá a forrástárolóhoz directory/<slug>.json néven, és nyisson egy pull requestet. A tároló hivatkozása e szakasz végén található.",
  },
  {
    en: "Attach this account's own handshake frame plus one real card frame to the pull request so a reviewer can verify the format on a device. Where a field name or a limit disagrees with the client, the client source is authoritative.",
    ru: "Приложите к pull request кадр рукопожатия этого аккаунта и один настоящий кадр карточки, чтобы ревьюер смог проверить формат на устройстве. Если имя поля или лимит расходится с клиентом, авторитетен исходный код клиента.",
    de: "Hängen Sie an den Pull Request den Handschlagrahmen dieses Kontos plus einen echten Kartenrahmen an, damit ein Prüfer das Format auf einem Gerät verifizieren kann. Weicht ein Feldname oder eine Grenze vom Client ab, ist der Client-Quellcode maßgeblich.",
    fr: "Joignez à la pull request la trame de poignée de main de ce compte et une vraie trame de carte, afin qu'un relecteur vérifie le format sur un appareil. Si un nom de champ ou une limite diverge du client, le code source du client fait foi.",
    it: "Allega alla pull request il frame di handshake di questo account più un frame di carta reale, così che un revisore possa verificare il formato su un dispositivo. Se un nome di campo o un limite diverge dal client, fa fede il sorgente del client.",
    nl: "Voeg bij de pull request het handshakeframe van dit account plus één echt kaartframe, zodat een reviewer het format op een apparaat kan verifiëren. Waar een veldnaam of limiet afwijkt van de client, is de client-broncode leidend.",
    cs: "Přiložte k pull requestu rámec handshake tohoto účtu a jeden skutečný rámec karty, aby recenzent mohl formát ověřit na zařízení. Pokud se název pole nebo limit liší od klienta, rozhodující je zdrojový kód klienta.",
    "zh-Hans": "PR 描述里附上这条服务号自己的握手帧和一帧真实卡片输出，让审阅能在自己的设备上验一遍格式。字段名与上限若和客户端冲突，以客户端源码为准。",
    "zh-Hant": "PR 描述裡附上這條服務號自己的握手訊框與一則真實卡片輸出，讓審閱能在自己的裝置上驗一遍格式。欄位名與上限若和用戶端衝突，以用戶端原始碼為準。",
    es: "Adjunte a la pull request el fotograma de saludo de esta cuenta más un fotograma de tarjeta real, para que un revisor pueda verificar el formato en un dispositivo. Si un nombre de campo o un límite contradice al cliente, manda el código fuente del cliente.",
    pl: "Dołącz do pull request ramkę uścisku dłoni tego konta oraz jedną prawdziwą ramkę karty, aby recenzent mógł zweryfikować format na urządzeniu. Jeżeli nazwa pola albo limit jest niezgodna z klientem, wiążący jest kod źródłowy klienta.",
    ja: "PR にはこのアカウント自身のハンドシェイクフレームと、実物のカードフレームを一つ添付する。レビュアーが端末で形式を検証できるようにするためだ。フィールド名や上限がクライアントと食い違うなら、クライアントのソースが正しい。",
    th: "แนบเฟรมจับมือของบัญชีนี้กับเฟรมการ์ดจริงอีกหนึ่งเฟรมไว้ใน pull request ผู้ตรวจจะได้พิสูจน์รูปแบบบนเครื่องได้ ถ้าชื่อช่องหรือขีดจำกัดไม่ตรงกับไคลเอนต์ ให้ถือตามซอร์สโค้ดของไคลเอนต์",
    fi: "Liitä pull requestiin tämän tilin kädenpuristuskehys ja yksi todellinen korttikehys, jotta tarkastaja voi varmentaa muodon laitteella. Jos kentän nimi tai raja poikkeaa asiakkaasta, asiakkaan lähdekoodi on ratkaiseva.",
    uk: "Додайте до pull request кадр рукостискання цього запису та один справжній кадр картки, щоб рецензент міг перевірити формат на пристрої. Якщо назва поля чи лімит суперечить клієнту, автентичним є код клієнта.",
    bg: "Приложете към pull request кадрът на ръкостискане на този акаунт плюс един истински кадър на карта, за да може преглеждащият да провери формата на устройство. Ако име на поле или граница се разминава с клиента, меродавен е изходният код на клиента.",
    tr: "Pull request'e bu hesabın kendi el sıkışma çerçevesini ve gerçek bir kart çerçevesini ekleyin; inceleme yapan biri biçimi bir aygıtta doğrulayabilsin. Bir alan adı ya da sınır istemciyle çelişirse bağlayıcı olan istemcinin kaynak kodudur.",
    hu: "Csatolja a pull requesthez ennek a fióknak a kézfogáskeretét meg egy valódi kártyakeretet, hogy egy bíráló egy eszközön ellenőrizhesse a formátumot. Ha egy mezőnév vagy korlát ellentmond a kliensnek, a kliens forráskódja a mérvadó.",
  },
  {
    en: "The directory stays decentralised: any site may list this entry or not. The JSON grants nothing and does not make the gateway declare anybody official.",
    ru: "Каталог остаётся децентрализованным: любой сайт может включить эту запись или нет. Этот JSON ничего не даёт и не заставляет шлюз объявлять кого-то официальным.",
    de: "Das Verzeichnis bleibt dezentral: Jede Seite kann diesen Eintrag führen oder nicht. Das JSON erteilt nichts und lässt das Gateway niemanden offiziell erklären.",
    fr: "L'annuaire reste décentralisé : tout site peut lister cette entrée ou non. Le JSON n'accorde rien et ne fait déclarer officiel qui que ce soit par la passerelle.",
    it: "La directory resta decentralizzata: qualsiasi sito può elencare questa voce o meno. Il JSON non concede nulla e non fa dichiarare dal gateway nessuno come ufficiale.",
    nl: "De directory blijft gedecentraliseerd: elke site mag dit item opnemen of niet. De JSON verleent niets en laat de gateway niemand officieel verklaren.",
    cs: "Adresář zůstává decentralizovaný: jakýkoli web jej může uvést nebo ne. Ten JSON nic nepropůjčuje a nedonutí bránu nikoho prohlásit za oficiálního.",
    "zh-Hans": "目录是去中心化的：任何站点都可以收录或不收录这一条。这条 JSON 不产生任何授权，也不会让网关承认谁是「官方」。",
    "zh-Hant": "目錄是去中心化的：任何站點都可以收錄或不收錄這一條。這條 JSON 不產生任何授權，也不會讓閘道承認誰是「官方」。",
    es: "El directorio sigue descentralizado: cualquier sitio puede listar esta entrada o no. El JSON no otorga nada ni hace que la pasarela declare a nadie oficial.",
    pl: "Katalog pozostaje decentralizowany: dowolna strona może ten wpis umieścić albo nie. Ten JSON niczego nie udziela i nie sprawia, że brama kogoś ogłasza oficjalnym.",
    ja: "ディレクトリは分散型でありつづける。どのサイトもこの条目を載せるか否かを選べる。この JSON はなんの認可も生まず、ゲートウェイが誰かを「公式」だと宣言させることもない。",
    th: "ไดเรกทอรียังคงเป็นแบบกระจายศูนย์ — ไซต์ใดจะบันทึกรายการนี้หรือไม่ก็ได้ JSON นี้ไม่ให้สิทธิ์ใด ๆ และไม่ทำให้เกตเวย์ประกาศว่าใครเป็นทางการ",
    fi: "Hakemisto pysyy hajautettuna: mikä tahansa sivusto voi listata tämän merkinnän tai olla listaamatta. JSON ei myönnä mitään eikä pakota yhdyskäytävää julistamaan ketään viralliseksi.",
    uk: "Каталог лишається децентралізованим: будь-який сайт може включити цей запис або ні. Цей JSON нічого не надає і не змушує шлюз когось оголошувати офіційним.",
    bg: "Указателят остава децентрализиран: всеки сайт може да включи този запис или не. Този JSON нищо не отпуска и не кара шлюзът да обявява когото и да е за официален.",
    tr: "Dizin merkeziyetsiz kalır: her site bu kaydı alır ya da almaz. Bu JSON hiçbir yetki vermez ve ağ geçidine kimseyi resmî ilan ettirmez.",
    hu: "A könyvtár decentralizált marad: bármely oldal felveheti ezt a bejegyzést vagy sem. A JSON semmit nem ruház át, és nem kényszeríti az átjárót, hogy valakit hivatalosnak nyilváníson.",
  },
];

/** Fold a display name into a path-safe slug; anything unrecognisable becomes "unnamed". */
function slugify(raw: string): string {
  const folded = raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (folded.length === 0) {
    return "unnamed";
  }
  return folded.slice(0, 40);
}

type FormValues = Record<string, string>;

function valueOf(values: FormValues, field: FieldSpec): string {
  const raw = (values[field.id] ?? "").trim();
  return raw.length > 0 ? raw : field.sample;
}

/**
 * The proposed entry. Its field names are self-describing rather than short on
 * purpose: unlike an ECO frame, which a decoder with a fixed `CodingKeys` list
 * has to read, a directory entry is read by a human reviewing a pull request, so
 * compressing it would cost clarity and buy nothing.
 */
function buildEntry(values: FormValues): string {
  const name = valueOf(values, FIELD.name);
  const slug = slugify(name);
  const entry = {
    format: "popopx-directory-entry/0-draft",
    status: "proposal",
    slug,
    name,
    operator: valueOf(values, FIELD.operator),
    categories: [valueOf(values, FIELD.category)],
    summary: valueOf(values, FIELD.summary),
    contact_url: valueOf(values, FIELD.contact),
    service_account: { invite_address: valueOf(values, FIELD.address) },
    protocol: {
      eco_marker: "::POPOPX_ECO::",
      frame_types: ["sh", "mc", "sc", "ku"],
      envelope_protocol: "popopx.channel.enc.v1",
      h5_verify: "POST /api/v1/verifyH5Auth",
      h5_replay_window_seconds: 300,
    },
    submission: {
      method: "pull-request",
      repository: REPO_URL,
      path: "directory/" + slug + ".json",
      note: "the gateway exposes no directory route, so there is nothing to POST this to; the pull request is the whole pipeline",
    },
  };
  return JSON.stringify(entry, null, 2);
}

/* ─────────────────────────────────────────────────────────────────────────
 * 6. Dialog shell
 * ───────────────────────────────────────────────────────────────────────── */

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function Dialog({
  titleId,
  heading,
  onClose,
  children,
}: {
  titleId: string;
  heading: string;
  onClose: () => void;
  children: ReactNode;
}): ReactElement {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const closeCopy = useCopy(CLOSE);

  useEffect(() => {
    const panel = panelRef.current;
    if (openerRef.current === null) {
      openerRef.current = document.activeElement;
    }
    const opener = openerRef.current;
    const overflowBefore = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || panel === null) {
        return;
      }
      const stops = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute("disabled"),
      );
      if (stops.length === 0) {
        return;
      }
      const first = stops[0];
      const last = stops[stops.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore the exact value that was found rather than blanket-clearing it,
      // so a dialog can never leave a scroll lock behind.
      document.body.style.overflow = overflowBefore;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus();
      }
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="glass animate-rise-in relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 outline-none sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={titleId} className="text-base font-semibold leading-snug text-white sm:text-lg">
            {heading}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeCopy}
            className="chip shrink-0 text-faint hover:border-alert/60 hover:text-white"
          >
            <span aria-hidden>{"\u00d7"}</span>
            <span>{closeCopy}</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * 7. QR pieces
 * ───────────────────────────────────────────────────────────────────────── */

/** Inverted contrast would not scan off a screen: dark modules on white, kept that way in both sizes. */
const QR_BG = "#FFFFFF";
const QR_FG = "#0B0B16";

function QrPlate({ value, size, label }: { value: string; size: number; label: string }): ReactElement {
  return (
    <div className="mx-auto w-fit rounded-xl bg-white p-3">
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        bgColor={QR_BG}
        fgColor={QR_FG}
        marginSize={2}
        title={label}
      />
    </div>
  );
}

function QrCard({ entry, onEnlarge }: { entry: WallEntry; onEnlarge: () => void }): ReactElement {
  const { locale } = useLocale();
  const title = pick(entry.title, locale);
  const enlarge = useCopy(ENLARGE);
  const sample = useCopy(SAMPLE_CHIP);

  return (
    <article className="glass glass-hover flex h-full min-w-0 flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow truncate">{pick(entry.kind, locale)}</p>
        <span className="pill shrink-0 border-warn/40 text-warn">{sample}</span>
      </div>
      <h3 className="mt-2 text-[15px] font-semibold leading-snug text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-mute">{pick(entry.caption, locale)}</p>

      <button
        type="button"
        onClick={onEnlarge}
        aria-label={enlarge + " \u2014 " + title}
        className="mt-3 block w-full rounded-xl border border-hair bg-white/10 p-2 hover:border-brand-soft/70"
      >
        <QrPlate value={entry.value} size={150} label={title} />
      </button>

      <p className="mt-3 rounded-lg border border-hair bg-black/45 px-2.5 py-2 font-mono text-[11px] leading-relaxed break-all text-[#c9c9e4]">
        {entry.value}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onEnlarge} className="btn-ghost px-3 py-1.5 text-xs">
          {enlarge}
        </button>
        <CopyButton
          value={entry.value}
          label={COPY_LINK}
          copiedLabel={COPIED_LINK}
          className="chip px-3 py-1.5 text-xs text-mute hover:border-brand/50 hover:text-white"
        />
      </div>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * 8. Sample blocks
 * ───────────────────────────────────────────────────────────────────────── */

function MiniLabel({ children }: { children: string }): ReactElement {
  return <p className="eyebrow mb-2">{children}</p>;
}

function ProtocolSample({
  title,
  rules,
  children,
}: {
  title: Localized<string>;
  rules: readonly Localized<string>[];
  children: ReactNode;
}): ReactElement {
  const { locale } = useLocale();
  const heading = useCopy(title);

  return (
    <article className="glass min-w-0 p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-white sm:text-base">{heading}</h3>
      <div className="mt-4 space-y-4">{children}</div>
      {/* The rules quote whole JSON objects, which are one unbreakable run at 13px. */}
      <ul className="hairline-top mt-5 space-y-2.5 [overflow-wrap:anywhere]">
        {rules.map((rule, index) => (
          <li key={index} className="flex gap-2.5 text-[13px] leading-relaxed text-mute">
            <span className="mt-2 shrink-0">
              <StatusDot tone="mesh" />
            </span>
            <span>{pick(rule, locale)}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * 9. Generator body
 * ───────────────────────────────────────────────────────────────────────── */

function GeneratorBody({
  values,
  onChange,
  onReset,
}: {
  values: FormValues;
  onChange: (id: string, next: string) => void;
  onReset: () => void;
}): ReactElement {
  const { locale } = useLocale();
  const json = useMemo(() => buildEntry(values), [values]);
  const disclaimer = useCopy(GEN_DISCLAIMER);
  const proposal = useCopy(PROPOSAL_CHIP);
  const restore = useCopy(GEN_RESTORE);
  const repoLink = useCopy(GEN_REPO_LINK);
  const outputLabel = useCopy(GEN_OUTPUT_LABEL);
  const stepsTitle = useCopy(GEN_STEPS_TITLE);
  const emptyHint = useCopy(GEN_EMPTY_HINT);
  const slug = slugify(valueOf(values, FIELD.name));

  const handle =
    (id: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      onChange(id, event.target.value);

  return (
    <div className="space-y-5">
      <p className="text-[12px] leading-relaxed text-faint">{emptyHint}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {GEN_FIELDS.map((field) => {
          const label = pick(field.label, locale);
          const hint = pick(field.hint, locale);
          const current = values[field.id] ?? "";
          const controlClass =
            "mt-1 w-full rounded-lg border border-hair bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-faint focus:border-brand-soft";
          return (
            <div key={field.id} className={field.multiline === true ? "sm:col-span-2" : ""}>
              <label className="block" htmlFor={field.id}>
                <span className="text-[12.5px] font-medium text-white">{label}</span>
                {field.options === undefined ? null : (
                  <select
                    id={field.id}
                    value={current.length > 0 ? current : field.sample}
                    onChange={handle(field.id)}
                    className={controlClass}
                  >
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                {field.options === undefined && field.multiline === true ? (
                  <textarea
                    id={field.id}
                    rows={2}
                    value={current}
                    placeholder={field.sample}
                    onChange={handle(field.id)}
                    className={controlClass}
                  />
                ) : null}
                {field.options === undefined && field.multiline !== true ? (
                  <input
                    id={field.id}
                    type="text"
                    value={current}
                    placeholder={field.sample}
                    spellCheck={false}
                    onChange={handle(field.id)}
                    className={controlClass}
                  />
                ) : null}
              </label>
              <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{hint}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="pill border-warn/40 text-warn">{proposal}</span>
        <button type="button" onClick={onReset} className="btn-ghost px-3 py-1.5 text-xs">
          {restore}
        </button>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
          {repoLink}
        </a>
      </div>

      <div>
        <MiniLabel>{outputLabel + " \u00b7 directory/" + slug + ".json"}</MiniLabel>
        <CodeBlock code={json} maxHeightClass="max-h-[320px]" />
      </div>

      <div className="glass-inset p-4">
        <p className="text-[11.5px] leading-relaxed text-warn">{disclaimer}</p>
      </div>

      <div>
        <MiniLabel>{stepsTitle}</MiniLabel>
        <ol className="space-y-2">
          {GEN_STEPS.map((step, index) => (
            <li key={index} className="flex gap-3 text-[12.5px] leading-relaxed text-mute">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-brand-soft">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{pick(step, locale)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * 10. Enlarged QR body
 * ───────────────────────────────────────────────────────────────────────── */

function QrDialogBody({ entry }: { entry: WallEntry }): ReactElement {
  const { locale } = useLocale();
  const title = pick(entry.title, locale);
  const fullLink = useCopy(FULL_LINK);
  const note = useCopy(QR_MODAL_NOTE);
  const sample = useCopy(SAMPLE_CHIP);

  return (
    <div className="space-y-4">
      <QrPlate value={entry.value} size={264} label={title} />
      <div>
        <MiniLabel>{fullLink}</MiniLabel>
        <p className="rounded-lg border border-hair bg-black/50 px-3 py-2.5 font-mono text-[12px] leading-relaxed break-all text-[#c9c9e4]">
          {entry.value}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          value={entry.value}
          label={COPY_LINK}
          copiedLabel={COPIED_LINK}
          className="btn-ghost px-4 py-2 text-xs"
        />
        <span className="pill border-warn/40 text-warn">{sample}</span>
      </div>
      <p className="glass-inset p-3 text-[12px] leading-relaxed text-faint">{note}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * 11. Section
 * ───────────────────────────────────────────────────────────────────────── */

export function DirectoryAndDocsSection(): ReactElement {
  const { locale } = useLocale();
  const [enlargedId, setEnlargedId] = useState<string | null>(null);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({});

  const enlarged = useMemo(
    () => WALL_ENTRIES.find((entry) => entry.id === enlargedId) ?? null,
    [enlargedId],
  );

  const closeQr = useCallback(() => setEnlargedId(null), []);
  const closeGenerator = useCallback(() => setGeneratorOpen(false), []);
  const resetValues = useCallback(() => setValues({}), []);
  const changeValue = useCallback((id: string, next: string) => {
    setValues((current) => ({ ...current, [id]: next }));
  }, []);

  const notice = useCopy(NOTICE);
  const wallTitle = useCopy(WALL_TITLE);
  const wallHint = useCopy(WALL_HINT);
  const genTitle = useCopy(GEN_TITLE);
  const genLede = useCopy(GEN_LEDE);
  const genCta = useCopy(GEN_CTA);
  const envelopeJsonLabel = useCopy(ENVELOPE_JSON_LABEL);
  const kuFrameLabel = useCopy(KU_FRAME_LABEL);
  const cardLabel = useCopy(CARD_LABEL);
  const menuLabel = useCopy(MENU_LABEL);
  const handshakeLabel = useCopy(HANDSHAKE_LABEL);
  const pythonLabel = useCopy(H5_PYTHON_LABEL);
  const jsLabel = useCopy(H5_JS_LABEL);
  const footerNote = useCopy(FOOTER_NOTE);

  return (
    <section id="directory" className="relative border-t border-hair py-20 sm:py-24">
      <div className="section-wrap">
        <SectionHeading eyebrow={HEYEBROW} title={HEADLINE} subtitle={SUBHEAD} />

        <div className="glass-inset mt-8 flex items-start gap-3 p-4">
          <span className="mt-1.5 shrink-0">
            <StatusDot tone="warn" pulse />
          </span>
          <p className="text-[13px] leading-relaxed text-warn">{notice}</p>
        </div>

        {/* ── 1. QR wall ─────────────────────────────────────────────── */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold tracking-tight text-white">{wallTitle}</h3>
          <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-mute">{wallHint}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WALL_ENTRIES.map((entry) => (
              <QrCard key={entry.id} entry={entry} onEnlarge={() => setEnlargedId(entry.id)} />
            ))}
          </div>
        </div>

        {/* ── 2. Directory entry generator ───────────────────────────── */}
        <div className="glass mt-12 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-3xl [overflow-wrap:anywhere]">
              <h3 className="text-xl font-semibold tracking-tight text-white">{genTitle}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-mute">{genLede}</p>
            </div>
            <button type="button" onClick={() => setGeneratorOpen(true)} className="btn-primary shrink-0">
              {genCta}
            </button>
          </div>
        </div>

        {/* ── 3. Protocol cheatsheet ─────────────────────────────────── */}
        <div className="mt-12 grid gap-4 xl:grid-cols-2">
          <ProtocolSample title={ENVELOPE_TITLE} rules={ENVELOPE_RULES}>
            <div>
              <MiniLabel>{envelopeJsonLabel}</MiniLabel>
              <CodeBlock code={ENVELOPE_JSON} maxHeightClass="max-h-[280px]" />
            </div>
            <div>
              <MiniLabel>{kuFrameLabel}</MiniLabel>
              <CodeBlock code={KU_FRAME} maxHeightClass="max-h-[190px]" />
            </div>
          </ProtocolSample>

          <ProtocolSample title={CARD_TITLE} rules={CARD_RULES}>
            <div>
              <MiniLabel>{cardLabel}</MiniLabel>
              <CodeBlock code={CARD_FRAME} maxHeightClass="max-h-[240px]" />
            </div>
            <div>
              <MiniLabel>{menuLabel}</MiniLabel>
              <CodeBlock code={MENU_FRAME} maxHeightClass="max-h-[200px]" />
            </div>
            <div>
              <MiniLabel>{handshakeLabel}</MiniLabel>
              <CodeBlock code={HANDSHAKE_FRAME} maxHeightClass="max-h-[150px]" />
            </div>
          </ProtocolSample>

          <ProtocolSample title={H5_TITLE} rules={H5_RULES}>
            <div>
              <MiniLabel>{pythonLabel}</MiniLabel>
              <CodeBlock code={H5_PYTHON} maxHeightClass="max-h-[380px]" />
            </div>
            <div>
              <MiniLabel>{jsLabel}</MiniLabel>
              <CodeBlock code={H5_VERIFY_JS} maxHeightClass="max-h-[420px]" />
            </div>
          </ProtocolSample>
        </div>

        <p className="mt-10 text-[12px] leading-relaxed text-faint">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-brand-soft underline-offset-4 hover:underline"
          >
            {REPO_URL.replace("https://", "")}
          </a>
          {" \u00b7 AGPL-3.0-only \u00b7 " + footerNote}
        </p>
      </div>

      {enlarged !== null ? (
        <Dialog
          titleId="directory-qr-dialog"
          heading={pick(enlarged.title, locale)}
          onClose={closeQr}
        >
          <QrDialogBody entry={enlarged} />
        </Dialog>
      ) : null}

      {generatorOpen ? (
        <Dialog titleId="directory-generator-dialog" heading={genTitle} onClose={closeGenerator}>
          <GeneratorBody values={values} onChange={changeValue} onReset={resetValues} />
        </Dialog>
      ) : null}
    </section>
  );
}
