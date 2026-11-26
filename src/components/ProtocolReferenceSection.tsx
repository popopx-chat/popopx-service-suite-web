"use client";

import { useState, type ReactElement } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";

/**
 * 协议速查 — section `protocol`, the technical block inside 工作原理.
 *
 * Envelope bytes, epoch custody, menu and card limits, the phone-side HMAC. Every
 * number is printed as the constant's own name plus its `file:line`, mono values
 * stay byte-identical in all 18 languages and every caption around them is
 * authored 18 times — a reader who trusts this table writes a client from it.
 * Byte-exact frames belong to `DirectoryAndDocsSection`; we summarise and hand
 * off to `#directory` and `#sandbox`.
 *
 * Honesty spine, kept hard: the gateway *is* the channel issuer, it holds the
 * identity pair and every epoch key in plaintext SQLite columns, so
 * zero-knowledge is a property of the relay path, never of your own server.
 */

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/70";

/* ─────────────────────────────────────────────────────────────────────────
 * 1. Locale-free values
 *
 * Constant names, enum members, limits and routes are code. They are rendered
 * verbatim in every language on purpose: a translated `max_menu_items` is a
 * limit nobody can grep for.
 * ───────────────────────────────────────────────────────────────────────── */

const V_PROTOCOL = 'PROTOCOL = "popopx.channel.enc.v1"';
const V_IDENTITY = "Ed25519 · IDENTITY_KEY_BYTES = 32 · SIGNATURE_BYTES = 64";
const V_SEAL = "ChaCha20-Poly1305 · NONCE_BYTES = 12 · TAG_BYTES = 16";
const V_EPOCH_KEY = "EPOCH_KEY_BYTES = 32";
const V_AAD = "protocol|channelId|epoch|identityPub";
const V_SEP = "SEPARATOR = 0x7C";
const V_CAPS = "max_epoch = 1000000 · max_ciphertext_bytes = 512*1024 · frame_chars = 8192";
const V_ROTATE_METER = "POPOPX_CP_PER_KEY_ROTATION = 2 CP";

const COL_CUSTODY: readonly string[] = [
  "channels.identity_pub_b64url",
  "channels.identity_sec_b64url",
  "channel_epochs.key_b64url",
];

const V_MENU_ITEMS = "max_menu_items = 3";
const V_MENU_SUBS = "max_menu_subitems = 5";
const V_MENU_TITLE = "max_menu_title_chars = 80";
const V_MENU_KINDS = "click|view|scancode|location|click_text";
const V_MENU_ACTIONS = "open_url|send_cmd|open_channel|callback";
const V_MENU_WIRE = "sub";
const V_MENU_ERR =
  'HTTP 400 {"error":"client_rule","rule":"menu_items" | "menu_subitems" | "menu_depth"}';

const V_CARD_REQ = "id · v · title · ut";
const V_CARD_OPT = "body · fields[{k,v,mono}] · progress{l,p,d} · actions[] · et";
const V_CARD_CAPS =
  "max_fields = 8 · max_actions = 4 · card_title_chars = 120 · card_body_chars = 2000 · field_label_chars = 80 · field_value_chars = 240";
const V_CARD_ACTKINDS = "callback|pay_credits|open_url|open_channel|send_cmd|none";
const V_CARD_ACTSTYLES = "primary|secondary|destructive";
const CARD_CODES: readonly string[] = ["standard", "receipt", "security"];

const V_H5_ALG = "HMAC-SHA256";
const V_H5_PRE = "uid=<pairwise_uid>&ts=<unix-seconds>";
const V_H5_SIG = "64";
const V_H5_SKEW = "H5_MAX_SKEW_SECONDS = 300";
const V_H5_QUERY = "popopx_uid · ts · sig";
const V_H5_VERIFY = "POST /api/v1/verifyH5Auth";

/** One block, 18 languages: the layout is bytes, and bytes do not localise. */
const AAD_ASCII = `AAD  (envelope_aad)  authenticated, never encrypted

  protocol              21 B   popopx.channel.enc.v1
  separator              1 B   0x7C
  channelId              n B   UTF-8
  separator              1 B   0x7C
  epoch               1-7 B   ASCII decimal, 1 to 1000000
  separator              1 B   0x7C
  identityPub32         32 B   raw Ed25519 public key

SIGNATURE PREIMAGE  (signing_preimage)  raw bytes, never the base64 forms

  protocol | channelId | epoch | nonce | ciphertext + tag
           0x7C        0x7C      0x7C      0x7C

  unwrap order: Ed25519 verify the signature, then open the Poly1305 tag.`;

/* ─────────────────────────────────────────────────────────────────────────
 * 2. Section copy
 * ───────────────────────────────────────────────────────────────────────── */

const EYEBROW: Localized<string> = {
  en: "Protocol quick reference",
  ru: "Справочник по протоколу",
  de: "Protokoll-Kurzreferenz",
  fr: "Référence rapide du protocole",
  it: "Riferimento rapido del protocollo",
  nl: "Korte protocolreferentie",
  cs: "Protokolový rychlý přehled",
  "zh-Hans": "协议速查",
  "zh-Hant": "協議速查",
  es: "Referencia rápida del protocolo",
  pl: "Protokół w skrócie",
  ja: "プロトコル早見表",
  th: "สรุปโปรโตคอลอย่างย่อ",
  fi: "Pikaopas protokollasta",
  uk: "Стислий довідник протоколу",
  bg: "Кратък справочник по протокола",
  tr: "Protokol hızlı başvuru rehberi",
  hu: "Protokoll gyorsreferencia",
};

const TITLE: Localized<string> = {
  en: "Envelope, epoch keys, menu and card limits — every number carries its source line",
  ru: "Конверт, ключи эпох, лимиты меню и карточек — у каждого числа своя исходная строка",
  de: "Umschlag, Epoch-Schlüssel, Menü- und Kartengrenzen — jede Zahl mit ihrer Quellzeile",
  fr: "Enveloppe, clés d’époque, limites de menu et de carte — chaque chiffre porte sa ligne source",
  it: "Busta, chiavi di epoca, limiti di menu e di card — ogni numero porta la sua riga sorgente",
  nl: "Omslag, epochsleutels, menu- en kaartlimieten — elk cijfer draagt zijn bronregel",
  cs: "Obálka, epochové klíče, limity menu a karet — každé číslo má svůj zdrojový řádek",
  "zh-Hans": "信封、epoch 密钥、菜单与卡片上限——每个数字都带着它的源码行号",
  "zh-Hant": "信封、epoch 密鑰、選單與卡片上限——每個數字都帶著它的原始碼行號",
  es: "Sobre, claves de época, límites de menú y de tarjeta: cada número lleva su línea fuente",
  pl: "Koperta, klucze epok, limity menu i kart — każda liczba ma swój źródłowy wiersz",
  ja: "エンベロープ、エポック鍵、メニューとカードの上限——すべての数値にソース行を添えました",
  th: "ซอง, คีย์ epoch, ขีดจำกัดของเมนูและการ์ด — ทุกตัวเลขมีบรรทัดแหล่งที่มาของมัน",
  fi: "Kirjekuori, epoch-avaimet, valikon ja korttien rajat — jokainen luku kertoo lähderivinsä",
  uk: "Конверт, ключі епох, ліміти меню й карток — кожне число з посиланням на рядок у коді",
  bg: "Обвивка, ключове на епохи, лимити на меню и карти — всяко число си носи изходния ред",
  tr: "Zarf, epoch anahtarları, menü ve kart sınırları — her sayı kaynak satırını taşır",
  hu: "Boríték, epochakulcsok, menü- és kártyakorlátok — minden szám a forrásorával érkezik",
};

const SUBTITLE: Localized<string> = {
  en: "A cheat sheet, not a second specification. Each value was read off gateway/app/crypto_service.py, gateway/app/database.py and gateway/app/config.py on 2026-11-26; the file:line is printed under every card. The one question a table cannot answer — who holds the keys — has its own card.",
  ru: "Это шпаргалка, а не вторая спецификация. Каждое значение взято из gateway/app/crypto_service.py, gateway/app/database.py и gateway/app/config.py (проверено 2026-11-26); file:line напечатан под каждой карточкой. Единственный вопрос, на который таблица не отвечает, — кто держит ключи, — вынесен в отдельную карточку.",
  de: "Ein Spickzettel, keine zweite Spezifikation. Jeder Wert ist am 2026-11-26 aus gateway/app/crypto_service.py, gateway/app/database.py und gateway/app/config.py abgelesen; file:line steht unter jeder Karte. Die eine Frage, die keine Tabelle beantworten kann — wer die Schlüssel hält — hat eine eigene Karte.",
  fr: "Un aide-mémoire, pas une seconde spécification. Chaque valeur a été lue le 2026-11-26 dans gateway/app/crypto_service.py, gateway/app/database.py et gateway/app/config.py ; le file:line est imprimé sous chaque carte. La seule question qu’aucun tableau ne résout — qui détient les clés — a sa propre carte.",
  it: "Un promemoria, non una seconda specifica. Ogni valore è stato letto il 2026-11-26 da gateway/app/crypto_service.py, gateway/app/database.py e gateway/app/config.py; il file:line è stampato sotto ogni card. L’unica domanda a cui una tabella non risponde — chi custodisce le chiavi — ha una card propria.",
  nl: "Een spiekbrief, geen tweede specificatie. Elke waarde is op 2026-11-26 uit gateway/app/crypto_service.py, gateway/app/database.py en gateway/app/config.py gelezen; de file:line staat onder elke kaart. De ene vraag die een tabel niet beantwoordt — wie de sleutels bezit — krijgt een eigen kaart.",
  cs: "Tahák, ne druhá specifikace. Každá hodnota byla 2026-11-26 přečtena z gateway/app/crypto_service.py, gateway/app/database.py a gateway/app/config.py; file:line je vytištěn pod každou kartou. Jediná otázka, na kterou tabulka neodpoví — kdo drží klíče — má vlastní kartu.",
  "zh-Hans": "这是一份速查表，不是第二份规范。每个取值都是 2026-11-26 从 gateway/app/crypto_service.py、gateway/app/database.py 与 gateway/app/config.py 里读出来的，file:line 印在每张卡片下面。表格回答不了的那一个问题——密钥在谁手上——单独一张卡。",
  "zh-Hant": "這是一份速查表，不是第二份規格。每個數值都是 2026-11-26 從 gateway/app/crypto_service.py、gateway/app/database.py 與 gateway/app/config.py 讀出來的，file:line 印在每張卡片下面。表格回答不了的那一個問題——密鑰在誰手上——單獨一張卡。",
  es: "Una chuleta, no una segunda especificación. Cada valor se leyó el 2026-11-26 de gateway/app/crypto_service.py, gateway/app/database.py y gateway/app/config.py; el file:line se imprime bajo cada tarjeta. La única pregunta que ninguna tabla responde — quién guarda las claves — tiene su propia tarjeta.",
  pl: "Ściąga, a nie druga specyfikacja. Każdą wartość odczytano 2026-11-26 z gateway/app/crypto_service.py, gateway/app/database.py i gateway/app/config.py; file:line jest drukowany pod każdą kartą. Jedyne pytanie, na które tabela nie odpowiada — kto trzyma klucze — ma własną kartę.",
  ja: "早見表であり、二番目の仕様書ではありません。すべての値を 2026-11-26 に gateway/app/crypto_service.py、gateway/app/database.py、gateway/app/config.py から読み出し、file:line を各カードの下に印字しました。表では答えられないたった一つの問い——鍵を誰が握っているか——には専用のカードを設けています。",
  th: "นี่คือสรุปทางลัด ไม่ใช่สเปกฉบับที่สอง ค่าแต่ละค่าถูกอ่านมาจาก gateway/app/crypto_service.py, gateway/app/database.py และ gateway/app/config.py เมื่อวันที่ 2026-11-26 โดย file:line จะพิมพ์ไว้ใต้ทุกการ์ด ส่วนคำถามเดียวที่ตารางตอบไม่ได้คือใครเป็นผู้ถือคีย์ ก็มีการ์ดของตัวเอง",
  fi: "Tämä on muistilappu, ei toinen spesifikaatio. Jokainen arvo luettiin 2026-11-26 kohteista gateway/app/crypto_service.py, gateway/app/database.py ja gateway/app/config.py, ja file:line on painettu jokaisen kortin alle. Vain kysymykselle, johon taulukko ei vastaa — kuka pitää avaimia hallussaan — on oma korttinsa.",
  uk: "Це шпаргалка, а не друга специфікація. Кожне значення прочитано 2026-11-26 із gateway/app/crypto_service.py, gateway/app/database.py та gateway/app/config.py; file:line надруковано під кожною карткою. Єдине питання, на яке таблиця не відповідає — хто тримає ключі, — має власну картку.",
  bg: "Това е обзорна таблица, не втора спецификация. Всяка стойност е прочетена на 2026-11-26 от gateway/app/crypto_service.py, gateway/app/database.py и gateway/app/config.py; file:line е отпечатан под всяка картичка. Единственият въпрос, на който таблица не отговаря — кой пази ключовете — си има собствена картичка.",
  tr: "Bu bir kopya kağıdı, ikinci bir şartname değil. Her değer 2026-11-26 tarihinde gateway/app/crypto_service.py, gateway/app/database.py ve gateway/app/config.py dosyalarından okundu; file:line her kartın altına basıldı. Hiçbir tablonun yanıtlayamadığı tek soru — anahtarları kim tutuyor — kendi kartına sahip.",
  hu: "Ez gyorsfüzet, nem második specifikáció. Minden értéket 2026-11-26-én olvastuk ki a gateway/app/crypto_service.py, gateway/app/database.py és gateway/app/config.py fájlokból, és a file:line minden kártya alatt ki van írva. Az egyetlen kérdésre, amelyet egy táblázat nem tud megválaszolni — ki tartja a kulcsokat — saját kártya tartozik.",
};

const PILL_CITED: Localized<string> = {
  en: "Every card cites file:line",
  ru: "Каждая карточка приводит file:line",
  de: "Jede Karte zitiert file:line",
  fr: "Chaque carte cite son file:line",
  it: "Ogni card cita il file:line",
  nl: "Elke kaart citeert file:line",
  cs: "Každá karta uvádí file:line",
  "zh-Hans": "每张卡都标注 file:line",
  "zh-Hant": "每張卡都標註 file:line",
  es: "Cada tarjeta cita su file:line",
  pl: "Każda karta podaje file:line",
  ja: "すべてのカードに file:line を明記",
  th: "ทุกการ์ดอ้าง file:line ของตัวเอง",
  fi: "Jokainen kortti näyttää file:line-osoitteen",
  uk: "Кожна картка наводить file:line",
  bg: "Всяка картичка посочва file:line",
  tr: "Her kartta bir file:line alıntısı eşlik eder",
  hu: "Minden kártya file:line hivatkozással él",
};

const PILL_SPINE: Localized<string> = {
  en: "Zero-knowledge is a property of the relay path, not of your server",
  ru: "Нулевое знание относится к каналу relay, а не к вашему серверу",
  de: "Zero-Knowledge gilt für den Relay-Pfad, nicht für deinen Server",
  fr: "Le zero-knowledge qualifie le chemin relay, pas ton serveur",
  it: "Il zero-knowledge è una proprietà del percorso relay, non del tuo server",
  nl: "Zero-knowledge geldt voor het relaypad, niet voor jouw server",
  cs: "Zero-knowledge platí pro cestu přes relay, ne pro tvůj server",
  "zh-Hans": "零知识说的是中继链路，不是你自己的服务器",
  "zh-Hant": "零知識說的是中繼鏈路，不是你自己的伺服器",
  es: "El conocimiento cero es una propiedad de la ruta de retransmisión, no de tu servidor",
  pl: "Zerowa wiedza dotyczy toru przekaźnika, nie twojego serwera",
  ja: "ゼロ知識が成立するのはリレー側であって、あなたのサーバー側ではありません",
  th: "คุณสมบัติ zero-knowledge เป็นของเส้นทางรีเลย์ ไม่ใช่เซิร์ฟเวอร์ของคุณ",
  fi: "Nollatieto koskee relay-reittiä, ei omaa palvelintasi",
  uk: "Нульове знання — властивість ретрансляційного шляху, а не вашого сервера",
  bg: "Нулевото знание е свойство на релейния път, а не на твоия сървър",
  tr: "Sıfır bilgi aktarım yolunun bir özelliğidir, sunucunuzun değil",
  hu: "A zero-knowledge az átjátszó útvonal tulajdonsága, nem a saját szerveredé",
};

/** Shared row caption, reused wherever a POPX-CP price is printed. */
const CAP_FEE: Localized<string> = {
  en: "Fee",
  ru: "Тариф",
  de: "Gebühr",
  fr: "Tarif",
  it: "Tariffa",
  nl: "Tarief",
  cs: "Poplatek",
  "zh-Hans": "计费",
  "zh-Hant": "計費",
  es: "Tarifa",
  pl: "Opłata",
  ja: "課金",
  th: "ค่าธรรมเนียม",
  fi: "Maksu",
  uk: "Тариф",
  bg: "Такса",
  tr: "Ücret",
  hu: "Díj",
};

const CAP_VERIFIED: Localized<string> = {
  en: "Verified at",
  ru: "Проверено в",
  de: "Geprüft in",
  fr: "Vérifié dans",
  it: "Verificato in",
  nl: "Gecontroleerd in",
  cs: "Ověřeno v",
  "zh-Hans": "核实于",
  "zh-Hant": "核實於",
  es: "Verificado en",
  pl: "Sprawdzono w",
  ja: "確認箇所",
  th: "ตรวจสอบที่",
  fi: "Tarkistettu kohdasta",
  uk: "Перевірено у",
  bg: "Проверено в",
  tr: "Şurada doğrulandı",
  hu: "Ellenőrizve itt",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 3. Card 1 — the channel envelope
 * ───────────────────────────────────────────────────────────────────────── */

const C1_TITLE: Localized<string> = {
  en: "Channel envelope popopx.channel.enc.v1",
  ru: "Конверт канала popopx.channel.enc.v1",
  de: "Kanalumschlag popopx.channel.enc.v1",
  fr: "Enveloppe de canal popopx.channel.enc.v1",
  it: "Busta del canale popopx.channel.enc.v1",
  nl: "Kanaalomslag popopx.channel.enc.v1",
  cs: "Obálka kanálu popopx.channel.enc.v1",
  "zh-Hans": "频道信封 popopx.channel.enc.v1",
  "zh-Hant": "頻道信封 popopx.channel.enc.v1",
  es: "Sobre del canal popopx.channel.enc.v1",
  pl: "Koperta kanału popopx.channel.enc.v1",
  ja: "チャンネルエンベロープ popopx.channel.enc.v1",
  th: "ซองของแชนแนล popopx.channel.enc.v1",
  fi: "Kanavakirjekuori popopx.channel.enc.v1",
  uk: "Конверт каналу popopx.channel.enc.v1",
  bg: "Обвивка на канала popopx.channel.enc.v1",
  tr: "Kanal zarfı popopx.channel.enc.v1",
  hu: "Csatornaboríték popopx.channel.enc.v1",
};

const C1_LEDE: Localized<string> = {
  en: "The rotation payload the issuer seals for one channel: a ChaCha20-Poly1305 box around the new epoch key, signed by that channel's Ed25519 identity.",
  ru: "Полезная нагрузка ротации, которую эмитент запечатывает для одного канала: короб ChaCha20-Poly1305 вокруг нового ключа эпохи, подписанный Ed25519-идентификатором этого канала.",
  de: "Die Rotationsnutzlast, die der Aussteller für einen Kanal versiegelt: ein ChaCha20-Poly1305-Box um den neuen Epoch-Schlüssel, signiert mit der Ed25519-Identität genau dieses Kanals.",
  fr: "La charge utile de rotation scellée par l’émetteur pour un canal : une boîte ChaCha20-Poly1305 autour de la nouvelle clé d’époque, signée par l’identité Ed25519 de ce canal.",
  it: "Il carico utile di rotazione sigillato dall'emittente per un singolo canale: una scatola ChaCha20-Poly1305 attorno alla nuova chiave di epoca, firmata dall'identità Ed25519 di quel canale.",
  nl: "De rotatie-betalingslast die de uitgever voor één kanaal verzegelt: een ChaCha20-Poly1305-doos rond de nieuwe epochsleutel, ondertekend door de Ed25519-identiteit van dat kanaal.",
  cs: "Rotace payload, který emitent zapečetí pro jediný kanál: box ChaCha20-Poly1305 kolem nového epochového klíče, podepsaný Ed25519 identitou tohoto kanálu.",
  "zh-Hans": "签发方为单个频道封好的轮换载荷：用 ChaCha20-Poly1305 把新 epoch 密钥装进盒子，再由该频道的 Ed25519 身份签名。",
  "zh-Hant": "簽發方為單一頻道封好的輪換載具：用 ChaCha20-Poly1305 把新 epoch 密鑰裝進盒子，再由該頻道的 Ed25519 身分簽名。",
  es: "La carga útil de rotación que el emisor sella para un canal: una caja ChaCha20-Poly1305 alrededor de la nueva clave de época, firmada por la identidad Ed25519 de ese canal.",
  pl: "Ładunek rotacji zakrywany przez wystawcę dla jednego kanału: pudełko ChaCha20-Poly1305 wokół nowego klucza epoki, podpisane tożsamością Ed25519 tego kanału.",
  ja: "発行者がチャンネル単位で封をするローテーションペイロードです。新しいエポック鍵を ChaCha20-Poly1305 の箱に収め、そのチャンネルの Ed25519 アイデンティティで署名します。",
  th: "payload หมุนเวียนที่ผู้ออกซีลไว้ให้แชนแนลเดียว: กล่อง ChaCha20-Poly1305 ครอบคีย์ epoch ใหม่ แล้วลงชื่อด้วยตัวตน Ed25519 ของแชนแนลนั้น",
  fi: "Kiertokuorma, jonka myöntäjä sinetöi yhdelle kanavalle: ChaCha20-Poly1305-laatikko uuden epoch-avaimen ympärillä, kanavan Ed25519-identiteetillä allekirjoitettuna.",
  uk: "Ротаційне навантаження, яке емітент запечатує для одного каналу: коробка ChaCha20-Poly1305 довкола нового ключа епохи, підписана Ed25519-ідентифікацією цього каналу.",
  bg: "Ротационният товар, който издателят запечатва за един канал: кутия ChaCha20-Poly1305 около новия ключ на епохата, подписана с Ed25519 самоличността на този канал.",
  tr: "Çıkarıcının tek bir kanal için mühürlediği rotasyon yükü: yeni epoch anahtarının etrafında bir ChaCha20-Poly1305 kutusu, kanulun Ed25519 kimliğiyle imzalanmış.",
  hu: "A kibocsátó által egyetlen csatornára lezárt forgatási terhelés: ChaCha20-Poly1305 doboz az új epochakulcs körül, a csatorna Ed25519 azonosságával aláírva.",
};

const C1_R_PROTOCOL: Localized<string> = {
  en: "Protocol id",
  ru: "Идентификатор протокола",
  de: "Protokoll-Kennung",
  fr: "Identifiant de protocole",
  it: "Identificatore del protocollo",
  nl: "Protocol-id",
  cs: "Identifikátor protokolu",
  "zh-Hans": "协议标识",
  "zh-Hant": "協議識別碼",
  es: "ID del protocolo",
  pl: "Identyfikator protokołu",
  ja: "プロトコル ID",
  th: "รหัสโปรโตคอล",
  fi: "Protokollatunniste",
  uk: "Ідентифікатор протоколу",
  bg: "Идентификатор на протокола",
  tr: "Protokol kimliği",
  hu: "Protokoll-azonosító",
};

const C1_R_IDENTITY: Localized<string> = {
  en: "Identity key",
  ru: "Ключ идентификатора",
  de: "Identitätsschlüssel",
  fr: "Clé d’identité",
  it: "Chiave di identità",
  nl: "Identiteitssleutel",
  cs: "Identifikační klíč",
  "zh-Hans": "身份密钥",
  "zh-Hant": "身分密鑰",
  es: "Clave de identidad",
  pl: "Klucz tożsamości",
  ja: "アイデンティティ鍵",
  th: "คีย์ตัวตน",
  fi: "Identiteettiavain",
  uk: "Ключ ідентифікації",
  bg: "Ключ за самоличност",
  tr: "Kimlik anahtarı",
  hu: "Azonosító kulcs",
};

const C1_R_SEAL: Localized<string> = {
  en: "Seal",
  ru: "Печать",
  de: "Versiegelung",
  fr: "Scellement",
  it: "Sigillo",
  nl: "Verzegeling",
  cs: "Zapečetění",
  "zh-Hans": "密封算法",
  "zh-Hant": "密封演算法",
  es: "Sello",
  pl: "Zakrycie",
  ja: "シール",
  th: "การซีล",
  fi: "Sinetöinti",
  uk: "Запечатка",
  bg: "Печат",
  tr: "Mühür",
  hu: "Zár",
};

const C1_R_EPOCHKEY: Localized<string> = {
  en: "Epoch key",
  ru: "Ключ эпохи",
  de: "Epoch-Schlüssel",
  fr: "Clé d’époque",
  it: "Chiave di epoca",
  nl: "Epochsleutel",
  cs: "Epochový klíč",
  "zh-Hans": "epoch 密钥",
  "zh-Hant": "epoch 密鑰",
  es: "Clave de época",
  pl: "Klucz epoki",
  ja: "エポック鍵",
  th: "คีย์ epoch",
  fi: "Epoch-avain",
  uk: "Ключ епохи",
  bg: "Ключ на епохата",
  tr: "Epoch anahtarı",
  hu: "Epochakulcs",
};

const C1_R_AAD: Localized<string> = {
  en: "AAD layout",
  ru: "Состав AAD",
  de: "AAD-Aufbau",
  fr: "Structure de l’AAD",
  it: "Struttura dell'AAD",
  nl: "AAD-opbouw",
  cs: "Složení AAD",
  "zh-Hans": "AAD 组成",
  "zh-Hant": "AAD 組成",
  es: "Composición del AAD",
  pl: "Układ AAD",
  ja: "AAD の構成",
  th: "การจัดวาง AAD",
  fi: "AAD-rakenne",
  uk: "Склад AAD",
  bg: "Състав на AAD",
  tr: "AAD düzeni",
  hu: "AAD felépítés",
};

const C1_R_SEP: Localized<string> = {
  en: "Separator",
  ru: "Разделитель",
  de: "Trennzeichen",
  fr: "Séparateur",
  it: "Separatore",
  nl: "Scheidingsteken",
  cs: "Oddělovač",
  "zh-Hans": "分隔符",
  "zh-Hant": "分隔符號",
  es: "Separador",
  pl: "Separator",
  ja: "区切り文字",
  th: "ตัวคั่น",
  fi: "Erotin",
  uk: "Розділювач",
  bg: "Разделител",
  tr: "Ayırıcı",
  hu: "Elválasztó",
};

const C1_R_ORDER: Localized<string> = {
  en: "Unwrap order",
  ru: "Порядок раскрытия",
  de: "Auspackreihenfolge",
  fr: "Ordre d’ouverture",
  it: "Ordine di apertura",
  nl: "Uitpakvolgorde",
  cs: "Pořadí rozbalení",
  "zh-Hans": "解封顺序",
  "zh-Hant": "解封順序",
  es: "Orden de apertura",
  pl: "Kolejność otwierania",
  ja: "解封の手順",
  th: "ลำดับการแกะ",
  fi: "Avausjärjestys",
  uk: "Порядок розкриття",
  bg: "Ред на разпечатване",
  tr: "Açma sırası",
  hu: "Bontási sorrend",
};

const C1_ORDER_VAL: Localized<string> = {
  en: "verify the Ed25519 signature first, then open the AEAD tag",
  ru: "сначала проверить подпись Ed25519, затем вскрывать тег AEAD",
  de: "erst die Ed25519-Signatur prüfen, dann den AEAD-Tag öffnen",
  fr: "vérifier d’abord la signature Ed25519, puis ouvrir le tag AEAD",
  it: "prima verificare la firma Ed25519, poi aprire il tag AEAD",
  nl: "eerst de Ed25519-ondertekening controleren, dan de AEAD-tag openen",
  cs: "nejprve ověřit podpis Ed25519, poté otevřít AEAD tag",
  "zh-Hans": "先验证 Ed25519 签名，再打开 AEAD 标签",
  "zh-Hant": "先驗證 Ed25519 簽名，再開啟 AEAD 標籤",
  es: "verificar primero la firma Ed25519 y luego abrir la etiqueta AEAD",
  pl: "najpierw zweryfikować podpis Ed25519, potem otworzyć znacznik AEAD",
  ja: "Ed25519 署名を先に検証し、その後に AEAD タグを開けます",
  th: "ตรวจสอบลายเซ็น Ed25519 ก่อน แล้วจึงเปิดแท็ก AEAD",
  fi: "tarkista Ed25519-allekirjoitus ensin ja avaa vasta sen jälkeen AEAD-tunniste",
  uk: "спочатку перевірити підпис Ed25519, потім відкривати тег AEAD",
  bg: "първо проверката на подписа Ed25519, след това отварянето на AEAD етикета",
  tr: "önce Ed25519 imzasını doğrula, sonra AEAD etiketini aç",
  hu: "előbb az Ed25519 aláírást ellenőrizzük, csak ezután nyitjuk meg az AEAD-címkét",
};

const C1_R_LIMITS: Localized<string> = {
  en: "Caps",
  ru: "Потолки",
  de: "Obergrenzen",
  fr: "Plafonds",
  it: "Limiti superiori",
  nl: "Bovengrenzen",
  cs: "Stropy",
  "zh-Hans": "上限",
  "zh-Hant": "上限",
  es: "Límites",
  pl: "Limity",
  ja: "上限",
  th: "เพดาน",
  fi: "Ylärajat",
  uk: "Обмеження",
  bg: "Горни граници",
  tr: "Sınırlar",
  hu: "Felső korlátok",
};

const C1_NOTE: Localized<string> = {
  en: "Fields are joined by one byte, 0x7C. The AAD is authenticated but not encrypted: an envelope recorded from one channel and replayed onto another fails the tag check even though its ciphertext is byte-identical.",
  ru: "Поля склеены одним байтом 0x7C. AAD аутентифицируется, но не шифруется: конверт, записанный с одного канала и воспроизведённый на другом, провалит проверку тега, хотя его шифртекст побайтово идентичен.",
  de: "Felder werden durch ein einzelnes Byte 0x7C verbunden. Das AAD ist authentifiziert, aber nicht verschlüsselt: ein Umschlag, der von einem Kanal mitgeschnitten und auf einen anderen wiederverwendet wird, fällt durch die Tag-Prüfung, obwohl sein Chiffretext byte-identisch ist.",
  fr: "Les champs sont joints par un seul octet, 0x7C. L’AAD est authentifié mais non chiffré : une enveloppe enregistrée sur un canal et rejouée sur un autre échoue au contrôle du tag, même si son texte chiffré est identique octet par octet.",
  it: "I campi sono uniti da un solo byte, 0x7C. L'AAD è autenticato ma non cifrato: una busta registrata da un canale e rigiocata su un altro fallisce il controllo del tag anche se il testo cifrato è identico byte per byte.",
  nl: "Velden worden door één byte, 0x7C, aan elkaar gevoegd. De AAD is geauthenticeerd maar niet versleuteld: een omslag die van het ene kanaal is opgenomen en op het andere nagespeeld, zakt door de tagcontrole hoewel zijn ciphertext byte voor byte identiek is.",
  cs: "Položky spojuje jeden bajt, 0x7C. AAD je autentizován, ale nešifrován: obálka zaznamenaná z jednoho kanálu a opakovaně odeslaná na jiný propadne kontrole tagu, i když je její šifrový text bajt od bajtu totožný.",
  "zh-Hans": "字段之间用单个字节 0x7C 连接。AAD 只做认证、不做加密：把某个频道的信封录下来重放到另一个频道，即使密文逐字节相同，也会在标签校验这一步失败。",
  "zh-Hant": "欄位之間用單一位元組 0x7C 連接。AAD 只做認證、不做加密：把某個頻道的信封錄下來重放到另一個頻道，即使密文逐位元組相同，也會在標籤驗證這一步失敗。",
  es: "Los campos se unen con un solo byte, 0x7C. El AAD se autentica pero no se cifra: un sobre grabado de un canal y reenviado a otro falla la comprobación de la etiqueta, aunque su texto cifrado sea idéntico byte a byte.",
  pl: "Pola łączy pojedynczy bajt, 0x7C. AAD jest uwierzytelniany, ale nie szyfrowany: koperta nagrana z jednego kanału i odtworzona w innym nie przejdzie sprawdzania znacznika, nawet jeśli jej tekst szyfrowany jest bajt w bajt identyczny.",
  ja: "フィールドは 0x7C という 1 バイトで連結されます。AAD は認証されますが暗号化はされません。あるチャンネルから録ったエンベロープを別のチャンネルに再生すると、暗号文が1バイト違わず同じでもタグ検証で失敗します。",
  th: "ฟิลด์เชื่อมด้วยไบต์เดียวคือ 0x7C ส่วน AAD จะถูกยืนยันความถูกต้องแต่ไม่ถูกเข้ารหัส: ซองที่บันทึกจากแชนแนลหนึ่งแล้วนำไปเล่นซ้ำอีกแชนแนลจะตกที่การตรวจแท็ก แม้เนื้อหาที่เข้ารหัสจะเหมือนกันทุกไบต์ก็ตาม",
  fi: "Kentät liittää yksi tavu, 0x7C. AAD todennetaan mutta ei salata: toiselta kanavalta nauhoitettu kirjekuori, joka toistetaan toiselle kanavalle, hylätään tunnisteen tarkistuksessa vaikka sen salateksti oli tavu tavulta identtinen.",
  uk: "Поля з’єднує один байт, 0x7C. AAD автентифікується, але не шифрується: конверт, записаний з одного каналу та відтворений на іншому, не пройде перевірку тегу, хоча його шифротекст побайтово однаковий.",
  bg: "Полетата се свързват от един байт, 0x7C. AAD се удостоверява, но не се криптира: обвивка, записана от един канал и пусната отново в друг, се проваля при проверката на етикета, макар криптираният текст да е бит по бит еднакъв.",
  tr: "Alanlar tek bir bayt ile, 0x7C ile birleştirilir. AAD doğrulanır ama şifrelenmez: bir kanaldan kaydedilen zarf başka bir kanalda yeniden gönderilirse, şifreli metin bayt bayt aynı olsa bile etiket doğrulamasından geçemez.",
  hu: "A mezőket egyetlen bájt, 0x7C fűzi össze. Az AAD hitelesített, de nem titkosított: az egyik csatornáról rögzített boríték egy másikon lejátszva a címkeellenőrzésen elbukik, még ha a titkosított szövege bájtról bájtra azonos is.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 4. Card 2 — epoch rotation, as it is implemented
 * ───────────────────────────────────────────────────────────────────────── */

const C2_TITLE: Localized<string> = {
  en: "Epoch rotation: an issuer call, not a timer",
  ru: "Ротация ключей эпохи: вызов эмитента, а не таймер",
  de: "Epoch-Rotation: ein Ausstelleraufruf, kein Timer",
  fr: "Rotation d’époque : un appel de l’émetteur, pas un minuteur",
  it: "Rotazione di epoca: una chiamata dell'emittente, non un timer",
  nl: "Epoch-rotatie: een oproep van de uitgever, geen timer",
  cs: "Rotace epoch: volání emitenta, ne časovač",
  "zh-Hans": "epoch 密钥轮换：由签发方调用，不是定时器",
  "zh-Hant": "epoch 密鑰輪換：由簽發方呼叫，不是計時器",
  es: "Rotación de época: una llamada del emisor, no un temporizador",
  pl: "Rotacja epok: wywołanie wystawcy, nie timer",
  ja: "エポックのローテーション：タイマーではなく発行者の呼び出しです",
  th: "การหมุนเวียน epoch:คือการเรียกผู้ออก ไม่ใช่ตัวจับเวลา",
  fi: "Epoch-kierto: myöntäjän kutu, ei ajastin",
  uk: "Ротація епох: виклик емітента, а не таймер",
  bg: "Ротация на епохите: извикване от издателя, не таймер",
  tr: "Epoch rotasyonu: zamanlayıcı değil, çıkarıcının çağrısı",
  hu: "Epoch-forgatás: a kibocsátó hívása, nem időzítő",
};

const C2_B1: Localized<string> = {
  en: "A new epoch key is 32 random bytes from the system CSPRNG, minted at rotation time and not derived from the previous epoch.",
  ru: "Новый ключ эпохи — 32 случайных байта из системного CSPRNG; он создаётся в момент ротации и не выводится из предыдущей эпохи.",
  de: "Ein neuer Epoch-Schlüssel sind 32 Zufallsbytes aus dem System-CSPRNG, gemünzt im Moment der Rotation und nicht aus der vorherigen Epoch abgeleitet.",
  fr: "Une nouvelle clé d’époque est 32 octets aléatoires du CSPRNG système, frappée au moment de la rotation et non dérivée de l’époque précédente.",
  it: "Una nuova chiave di epoca è costituita da 32 byte casuali del CSPRNG di sistema, coniata al momento della rotazione e non derivata dall'epoca precedente.",
  nl: "Een nieuwe epochsleutel is 32 willekeurige bytes uit de systeem-CSPRNG, gemunt op het moment van rotatie en niet afgeleid van de vorige epoch.",
  cs: "Nový epochový klíč je 32 náhodných bajtů z systémového CSPRNG, vytvořených v okamžiku rotace a neodvozených z předchozí epochy.",
  "zh-Hans": "新的 epoch 密钥是系统 CSPRNG 生成的 32 字节随机数，在轮换那一刻铸出，不是从上一个 epoch 推导出来的。",
  "zh-Hant": "新的 epoch 密鑰是系統 CSPRNG 產生的 32 位元組隨機數，在輪換那一刻鑄出，不是從上一個 epoch 推導出來的。",
  es: "Una nueva clave de época son 32 bytes aleatorios del CSPRNG del sistema, acuñados en el momento de la rotación y no derivados de la época anterior.",
  pl: "Nowy klucz epoki to 32 losowe bajty z systemowego CSPRNG, wygenerowane w chwili rotacji i niewyprowadzone z poprzedniej epoki.",
  ja: "新しいエポック鍵はシステムの CSPRNG から得た 32 バイトの乱数で、ローテーションの瞬間に鋳造され、前のエポックから導出されたものではありません。",
  th: "คีย์ epoch ตัวใหม่คือไบต์สุ่ม 32 ไบต์จาก CSPRNG ของระบบ ที่สร้างขึ้นมาตอนหมุนเวียนพอดี และไม่ได้อนุพันธ์มาจาก epoch ก่อนหน้า",
  fi: "Uusi epoch-avain on 32 satunnaistavua järjestelmän CSPRNG:stä, lyötü kiertohetkellä eikä johdettu edellisestä epochista.",
  uk: "Новий ключ епохи — це 32 випадкові байти з системного CSPRNG, виготовлені в момент ротації, а не виведені з попередньої епохи.",
  bg: "Новият ключ на епохата са 32 случайни байта от системното CSPRNG, създадени в момента на ротация и не са производни на предишната епоха.",
  tr: "Yeni bir epoch anahtarı, sistem CSPRNG'sinden gelen 32 rastgele bayttır; rotasyon anında üretilir ve önceki epoch'tan türetilmez.",
  hu: "Egy új epochakulcs 32 véletlen bájt a rendszer CSPRNG-jéből; a forgatás pillanatában ütődik, és nem az előző epochból következik.",
};

const C2_B2: Localized<string> = {
  en: "expires_at_ms is optional and supplied by the caller, so the gateway has no fixed epoch duration and runs no automatic rotation.",
  ru: "expires_at_ms необязателен и задаётся вызывающей стороной, поэтому у шлюза нет фиксированной длительности эпохи и он не запускает автоматической ротации.",
  de: "expires_at_ms ist optional und wird vom Aufrufer geliefert, das Gateway hat also keine feste Epoch-Dauer und fährt keine automatische Rotation.",
  fr: "expires_at_ms est facultatif et fourni par l’appelant : la passerelle n’a donc aucune durée d’époque fixe et n’exécute aucune rotation automatique.",
  it: "expires_at_ms è facoltativo e fornito dal chiamante, quindi il gateway non ha una durata di epoca fissa e non esegue rotazioni automatiche.",
  nl: "expires_at_ms is optioneel en wordt door de aanroeper aangeleverd, dus de gateway kent geen vaste epochduur en draait geen automatische rotatie.",
  cs: "expires_at_ms je nepovinný a dodává ho volající, brána tedy nemá pevnou délku epochy a nespouští žádnou automatickou rotaci.",
  "zh-Hans": "expires_at_ms 是可选参数、由调用方提供，所以网关没有固定的 epoch 时长，也不会自动轮换。",
  "zh-Hant": "expires_at_ms 是可選參數、由呼叫方提供，所以閘道沒有固定的 epoch 時長，也不會自動輪換。",
  es: "expires_at_ms es opcional y lo aporta quien llama, así que la pasarela no tiene una duración de época fija ni ejecuta rotaciones automáticas.",
  pl: "expires_at_ms jest opcjonalne i podawane przez wywołującego, dlatego brama nie ma stałego czasu trwania epoki i nie wykonuje automatycznej rotacji.",
  ja: "expires_at_ms は省略可能で呼び出し側が与えるため、ゲートウェイに固定のエポック期間はありませんし、自動ローテーションも動きません。",
  th: "expires_at_ms เป็นตัวเลือกและกำหนดโดยผู้เรียก ดังนั้นเกตเวย์จึงไม่มีระยะเวลา epoch คงที่และไม่ทำการหมุนเวียนอัตโนมัติ",
  fi: "expires_at_ms on valinnainen ja kutsujan toimittama, joten gatewayssä ei ole kiinteää epoch-kestoa eikä se suorita automaattista kiertoa.",
  uk: "expires_at_ms є необовʼязковим і надається тим, хто викликає, тож у шлюза немає фіксованої тривалості епохи й він не запускає автоматичної ротації.",
  bg: "expires_at_ms е по желание и се подава от извикващия, затова гейтуейтът няма фиксирана продължителност на епохата и не извършва автоматична ротация.",
  tr: "expires_at_ms isteğe bağlıdır ve çağıran tarafından verilir; bu yüzden ağ geçidinin sabit bir epoch süresi yoktur ve otomatik rotasyon çalıştırmaz.",
  hu: "az expires_at_ms opcionális, és a hívó adja meg, ezért az átjárónak nincs rögzített epoch-időtartama, és nem futtat automatikus forgatást.",
};

const C2_B3: Localized<string> = {
  en: "Rotation is an issuer operation and is metered as one; no route rotates a key for free.",
  ru: "Ротация — это операция эмитента, и учитывается она как операция эмитента; ни один маршрут не меняет ключ бесплатно.",
  de: "Rotation ist eine Ausstelleroperation und wird auch als solche gemessen; keine Route dreht einen Schlüssel umsonst.",
  fr: "La rotation est une opération d’émetteur et est comptée comme telle : aucune route ne fait tourner une clé gratuitement.",
  it: "La rotazione è un'operazione dell'emittente e viene conteggiata come tale: nessuna route ruota una chiave gratuitamente.",
  nl: "Rotatie is een uitgeversoperatie en wordt als zodanig gemeten; geen enkele route draait een sleutel gratis.",
  cs: "Rotace je operací emitenta a tak je i účtována; žádná rota nevymění klíč zdarma.",
  "zh-Hans": "轮换是签发方操作，也按签发方操作计量；没有任何接口会免费换密钥。",
  "zh-Hant": "輪換是簽發方操作，也依簽發方操作計量；沒有任何介面會免費換密鑰。",
  es: "La rotación es una operación del emisor y se mide como tal; ninguna ruta cambia una clave de balde.",
  pl: "Rotacja jest operacją wystawcy i tak jest naliczana; żaden punkt końcowy nie wymienia klucza za darmo.",
  ja: "ローテーションは発行者の操作であり、そのとおりに計量されます。鍵を無償で回すルートは存在しません。",
  th: "การหมุนเวียนเป็นการปฏิบัติการของผู้ออกและถูกนับเป็นเช่นนั้น ไม่มีเส้นทางใดเปลี่ยนคีย์ให้ฟรี",
  fi: "Kierto on myöntäjän operaatio ja se mitoidaan sellaisena; yksikään reitti ei vaihda avainta ilmaiseksi.",
  uk: "Ротація — це операція емітента, і обліковується вона так само; жоден маршрут не змінює ключ безкоштовно.",
  bg: "Ротацията е операция на издателя и се отчита като такава; нито един път не подменя ключ безплатно.",
  tr: "Rotasyon bir çıkarıcı işlemidir ve öyle ölçülür; hiçbir uç nokta anahtarı ücretsiz çevirmez.",
  hu: "A forgatás a kibocsátó művelete, és úgy is kerül számlázásra; egyetlen végpont sem ad ingyenes kulcsforgatást.",
};

const C2_FEE_NOTE: Localized<string> = {
  en: "The price lives in the same .env block as card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query and slack_discord_event; every one of the twelve meters can be repriced there.",
  ru: "Цена стоит в том же блоке .env, что card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query и slack_discord_event; все двенадцать счётчиков можно переставить там же.",
  de: "Der Preis steht im selben .env-Block wie card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query und slack_discord_event; alle zwölf Messuhren lassen sich dort umstellen.",
  fr: "Le tarif se trouve dans le même bloc .env que card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query et slack_discord_event ; les douze compteurs se reprogramment là.",
  it: "Il prezzo si trova nello stesso blocco .env di card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query e slack_discord_event; tutti e dodici i contatori si possono ritoccare lì.",
  nl: "De prijs staat in hetzelfde .env-blok als card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query en slack_discord_event; alle twaalf meters zijn er te herprijzen.",
  cs: "Cena sídlí ve stejném bloku .env jako card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query a slack_discord_event; všech dvanáct měřičů tam lze přecenit.",
  "zh-Hans": "单价与 card、menu_push、key_rotation、ai_message、alert、sso_login、poll、web3_event、workflow_event、carddav_query、caldav_query、slack_discord_event 在同一个 .env 块里，十二个计量项都可以在那里改价。",
  "zh-Hant": "單價與 card、menu_push、key_rotation、ai_message、alert、sso_login、poll、web3_event、workflow_event、carddav_query、caldav_query、slack_discord_event 在同一個 .env 區塊裡，十二個計量項都可以在那裡改價。",
  es: "El precio vive en el mismo bloque .env que card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query y slack_discord_event; los doce medidores se recalculan ahí.",
  pl: "Cena znajduje się w tym samym bloku .env co card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query i slack_discord_event; wszystkie dwanaście liczników można tam przycenić.",
  ja: "単価は card、menu_push、key_rotation、ai_message、alert、sso_login、poll、web3_event、workflow_event、carddav_query、caldav_query、slack_discord_event と同じ .env ブロックにあり、12 の計量項目はすべてそこで変更できます。",
  th: "ราคาอยู่ในบล็อก .env เดียวกับ card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query และ slack_discord_event โดยตัววัดทั้งสิบสองสามารถปรับราคาใหม่ได้ที่นั่น",
  fi: "Hinta on samassa .env-lohkossa kuin card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query ja slack_discord_event; kaikki kaksitoista mittaria voi hinnoitella uudelleen siellä.",
  uk: "Ціна стоїть у тому самому блоці .env, що й card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query та slack_discord_event; усі дванадцять лічильників можна переоцінити там.",
  bg: "Цената е в същия .env блок като card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query и slack_discord_event; всичките дванадесет брояча се преоценяват там.",
  tr: "Birim fiyat, card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query ve slack_discord_event ile aynı .env bloğunda yer alır; on iki sayacın tamamı orada yeniden fiyatlandırılabilir.",
  hu: "Az ár ugyanabban a .env-blokkban lakik, mint a card, menu_push, key_rotation, ai_message, alert, sso_login, poll, web3_event, workflow_event, carddav_query, caldav_query és slack_discord_event; mind a tizenkét mérőóra ott árazható át.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 5. Card 3 — key custody (the honesty centrepiece, not softened)
 * ───────────────────────────────────────────────────────────────────────── */

const C3_TITLE: Localized<string> = {
  en: "Key custody, before you call the gateway zero-knowledge",
  ru: "Хранение ключей — прежде чем называть шлюз zero-knowledge",
  de: "Schlüsselverwahrung, bevor du das Gateway zero-knowledge nennst",
  fr: "Garde des clés, avant de qualifier la passerelle de zero-knowledge",
  it: "Custodia delle chiavi, prima di definire il gateway zero-knowledge",
  nl: "Sleutelbewaring, voor je de gateway zero-knowledge noemt",
  cs: "Uložení klíčů — než začnete branu označovat za zero-knowledge",
  "zh-Hans": "密钥归属：在把网关称作零知识之前",
  "zh-Hant": "密鑰歸屬：在把閘道稱作零知識之前",
  es: "Custodia de claves, antes de llamar zero-knowledge a la pasarela",
  pl: "Kwestia kluczy, zanim nazwiesz bramę zero-knowledge",
  ja: "ゲートウェイをゼロ知識と呼ぶ前に、鍵の所在について",
  th: "ที่อยู่กับคีย์: ก่อนที่คุณจะเรียกเกตเวย์ว่า zero-knowledge",
  fi: "Avainten säilytys, ennen kuin kutsut gatewayta zero-knowledgeksi",
  uk: "Зберігання ключів — перш ніж називати шлюз zero-knowledge",
  bg: "Съхранение на ключовете, преди наречете гейтуейта zero-knowledge",
  tr: "Ağ geçidine zero-knowledge demeden önce: anahtarlar kimde",
  hu: "A kulcsok őrzése, mielőtt zero-knowledge-nak neveznéd az átjárót",
};

const C3_LEDE: Localized<string> = {
  en: "The gateway is the channel issuer. It holds the Ed25519 identity pair and every epoch key, and it keeps them in plaintext columns of its SQLite file — the code comment at database.py:183-188 says exactly that.",
  ru: "Шлюз и есть эмитент канала. Он держит пару Ed25519 и каждый ключ эпохи, причём в открытых колонках своего файла SQLite — комментарий в database.py:183-188 говорит ровно это.",
  de: "Das Gateway ist der Kanal-Aussteller. Es hält das Ed25519-Schlüsselpaar für die Identität und jeden Epoch-Schlüssel — in Klartextspalten seiner SQLite-Datei; der Codekommentar in database.py:183-188 sagt genau das.",
  fr: "La passerelle est l’émetteur du canal. Elle détient la paire Ed25519 et chaque clé d’époque, en colonnes en clair de son fichier SQLite — le commentaire de code de database.py:183-188 le dit textuellement.",
  it: "Il gateway è l'emittente del canale. Custodisce la coppia Ed25519 e ogni chiave di epoca, in colonne in chiaro del proprio file SQLite; il commento nel codice alle righe 183-188 di database.py lo dice esplicitamente.",
  nl: "De gateway is de kanaaluitgever. Hij bezit het Ed25519-sleutelpaar en elke epochsleutel, in leesbare kolommen van zijn SQLite-bestand — de codeopmerking in database.py:183-188 zegt precies dat.",
  cs: "Brána je emitentem kanálu. Drží Ed25519 pár i každý epochový klíč, a to v jasné textové podobě ve sloupcích své SQLite databáze — komentář v database.py:183-188 říká přesně tohle.",
  "zh-Hans": "网关就是频道的签发方。它持有 Ed25519 身份密钥对和每一个 epoch 密钥，并且以明文列存在自己的 SQLite 文件里——database.py:183-188 的源码注释写的就是这件事。",
  "zh-Hant": "閘道就是頻道的簽發方。它持有 Ed25519 身分密鑰對與每一個 epoch 密鑰，而且以明文欄位存在自己的 SQLite 檔案裡——database.py:183-188 的原始碼註解寫的正是這件事。",
  es: "La pasarela es el emisor del canal. Guarda el par Ed25519 y todas las claves de época en columnas de texto plano de su archivo SQLite; el comentario del código en database.py:183-188 dice literalmente eso.",
  pl: "Brama jest wystawcą kanału. Przechowuje parę Ed25519 i każdy klucz epoki w jawnych kolumnach swojego pliku SQLite — komentarz w database.py:183-188 mówi dokładnie to samo.",
  ja: "ゲートウェイこそがチャンネルの発行者です。Ed25519 の鍵ペアとすべてのエポック鍵を保有し、それらを SQLite ファイルの平文カラムに格納します。database.py:183-188 のコメントがまさにそのことを書いています。",
  th: "เกตเวย์คือผู้ออกแชนแนลเอง มันถือคู่คีย์ Ed25519 และคีย์ epoch ทุกตัวไว้ในคอลัมน์ข้อความธรรมดาของไฟล์ SQLite ของตัวเอง ข้อความคอมเมนต์ในโค้ดที่ database.py:183-188 ระบุไว้แบบนี้ตรง ๆ",
  fi: "Gateway on kanavan myöntäjä. Se pitää hallussaan Ed25519-avainparin ja jokaisen epoch-avaimen selväkielisinä SQLite-tiedoston sarakkeina — kommentti kohdassa database.py:183-188 sanoo täsmälleen tämän.",
  uk: "Шлюз і є емітентом каналу. Він тримає пару Ed25519 і кожен ключ епохи у відкритих стовпцях свого файлу SQLite — саме це й каже коментар у database.py:183-188.",
  bg: "Гейтуейтът е издателят на канала. Той пази Ed25519 двойката и всеки ключ на епохата като обикновен текст в колоните на своя SQLite файл — коментарът в кода на database.py:183-188 казва точно това.",
  tr: "Ağ geçidi, kanalın çıkarıcısıdır. Ed25519 anahtar çiftini ve her epoch anahtarını SQLite dosyasının düz metin sütunlarında tutar; database.py:183-188 konumundaki kod yorumu aynen bunu söylüyor.",
  hu: "Az átjáró a csatorna kibocsátója. Megtartja az Ed25519 kulcspárt és minden egyes epochakulcsot, méghozzá a saját SQLite-fájlja nyílt szövegű oszlopaiban — a database.py:183-188 kódmegjegyzése pontosan ezt mondja.",
};

const C3_COLS: Localized<string> = {
  en: "Plaintext columns",
  ru: "Открытые колонки",
  de: "Klartextspalten",
  fr: "Colonnes en clair",
  it: "Colonne in chiaro",
  nl: "Leesbare kolommen",
  cs: "Sloupce v jasné textové podobě",
  "zh-Hans": "明文列",
  "zh-Hant": "明文欄位",
  es: "Columnas en texto plano",
  pl: "Jawne kolumny",
  ja: "平文のカラム",
  th: "คอลัมน์ข้อความธรรมดา",
  fi: "Selväkieliset sarakkeet",
  uk: "Відкриті стовпці",
  bg: "Колони с обикновен текст",
  tr: "Düz metin sütunları",
  hu: "Nyílt szövegű oszlopok",
};

const C3_SPINE: Localized<string> = {
  en: "Zero-knowledge holds against the SMP relay, which only blind-stores base64 frames and never sees an epoch key or a plaintext. It does not hold against your own server — that is where the keys live.",
  ru: "Нулевое знание действует по отношению к SMP-ретранслятору: тот слепо хранит base64-кадры и никогда не видит ни ключ эпохи, ни открытый текст. По отношению к вашему собственному серверу оно не действует — ключи живут именно там.",
  de: "Zero-Knowledge gilt gegenüber dem SMP-Relay: das speichert base64-Rahmen nur blind und bekommt weder einen Epoch-Schlüssel noch Klartext zu sehen. Gegenüber dem eigenen Server gilt es nicht — dort liegen die Schlüssel.",
  fr: "Le zero-knowledge vaut face au relais SMP, qui ne fait que stocker à l’aveugle des trames base64 et ne voit jamais une clé d’époque ni un texte en clair. Il ne vaut pas face à ton propre serveur : c’est là que vivent les clés.",
  it: "Il zero-knowledge vale nei confronti del relay SMP, che si limita a depositare alla cieca frame base64 e non vede mai una chiave di epoca né un testo in chiaro. Non vale nei confronti del tuo server: è lì che le chiavi risiedono.",
  nl: "Zero-knowledge geldt ten opzichte van de SMP-relay, die alleen base64-frames blind opslaat en nooit een epochsleutel of leesbare tekst ziet. Het geldt niet ten opzichte van je eigen server — daar wonen de sleutels.",
  cs: "Zero-knowledge platí vůči SMP relay, který jen naslepo ukládá base64 snímky a nikdy nevidí epochový klíč ani otevřený text. Vůči vlastnímu serveru neplatí — klíče žijí právě tam.",
  "zh-Hans": "零知识是针对 SMP 中继而言的：中继只会盲存 base64 帧，看不到 epoch 密钥，也看不到明文。它对你的服务器并不成立——密钥就住在服务器上。",
  "zh-Hant": "零知識是針對 SMP 中繼而言的：中繼只會盲存 base64 影格，看不到 epoch 密鑰，也看不到明文。它對你的伺服器並不成立——密鑰就住在伺服器上。",
  es: "El conocimiento cero se cumple frente al relay SMP, que solo almacena a ciegas tramas en base64 y nunca ve una clave de época ni texto plano. No se cumple frente a tu propio servidor: ahí es donde viven las claves.",
  pl: "Zerowa wiedza obowiązuje wobec przekaźnika SMP, który tylko ślepo przechowuje ramki base64 i nigdy nie widzi klucza epoki ani tekstu jawnego. Nie obowiązuje wobec twojego własnego serwera — to tam mieszkają klucze.",
  ja: "ゼロ知識が成り立つのは SMP リレーに対してです。リレーは base64 フレームの内容を判別せずに保管するだけで、エポック鍵も平文も目にはしません。あなた自身のサーバーに対しては成り立ちません。鍵があるのはそこです。",
  th: "คุณสมบัติ zero-knowledge ใช้ได้กับรีเลย์ SMP เท่านั้น เพราะรีเลย์เก็บเฟรม base64 แบบมืดบอดโดยไม่เห็นคีย์ epoch หรือข้อความธรรมดาเลย ส่วนกับเซิร์ฟเวอร์ของคุณเองนั้นใช้ไม่ได้ — เพราะคีย์เก็บอยู่ที่นั่น",
  fi: "Nollatieto pätee SMP-relayhin, joka vain tallettaa sokeasti base64-kehyksiä eikä näe koskaan epoch-avainta eikä selvää tekstiä. Se ei päte omaan palvelimeesi — avaimet asuvat siellä.",
  uk: "Нульове знання діє щодо SMP-ретранслятора, який лише всліпо зберігає base64-кадри й ніколи не бачить ні ключа епохи, ні відкритого тексту. Щодо вашого власного сервера воно не діє — ключі живуть саме там.",
  bg: "Нулевото знание важи срещу SMP релея, който само съхранява на сляпо base64 кадри и никога не вижда нито ключ на епохата, нито отворен текст. То не важи срещу собствения ви сървър — там живеят ключовете.",
  tr: "Sıfır bilgi SMP aktarıcisına karşı geçerlidir: aktarıcı yalnızca base64 karelerini körlemesine saklar, ne bir epoch anahtarı ne de düz metin görür. Kendi sunucunuza karşı geçerli değildir — anahtarların yaşadığı yer orasıdır.",
  hu: "A zero-knowledge az SMP átjátszóval szemben áll fenn: az átjátszó csak base64 kereteket tárol vakon, és soha nem lát epochakulcsot vagy nyílt szöveget. A saját szervereddel szemben nem áll fenn — a kulcsok ott laknak.",
};

const C3_MITIGATION: Localized<string> = {
  en: "Mitigation is operational, not cryptographic: keep the default loopback bind (127.0.0.1:8080), restrict OS-level file permissions on the SQLite path, and treat that host as a trusted zone.",
  ru: "Митигация операционная, а не криптографическая: держите дефолтный loopback-бинд (127.0.0.1:8080), ограничьте права на файл SQLite на уровне ОС и считайте этот хост доверенной зоной.",
  de: "Die Gegenmaßnahme ist betrieblich, nicht kryptografisch: Standard-Loopback-Bind behalten (127.0.0.1:8080), Dateiberechtigungen des SQLite-Pfads auf OS-Ebene einschränken, diesen Host als vertraute Zone behandeln.",
  fr: "La parade est opérationnelle, pas cryptographique : conservez le bind loopback par défaut (127.0.0.1:8080), restreignez les droits OS sur le chemin SQLite et considérez cette machine comme une zone de confiance.",
  it: "La mitigazione è operativa, non crittografica: mantieni il bind loopback predefinito (127.0.0.1:8080), restringi i permessi sui file del percorso SQLite a livello di sistema operativo e considera quell'host una zona fidata.",
  nl: "De mitigering is operationeel, niet cryptografisch: houd de standaard loopback-bind (127.0.0.1:8080), beperk OS-rechten op het SQLite-pad en beschouw die host als een vertrouwde zone.",
  cs: "Ochrana je provozní, nikoli kryptografická: ponechte výchozí loopback bind (127.0.0.1:8080), omezte oprávnění na soubor SQLite na úrovni OS a berte danžený stroj jako důvěryhodnou zónu.",
  "zh-Hans": "对策是运维层面的，不是密码学层面的：保持默认的 loopback 绑定（127.0.0.1:8080），在操作系统层限制 SQLite 文件的权限，并把这台主机当作可信区域对待。",
  "zh-Hant": "對策是營運層面的，不是密碼學層面的：維持預設的 loopback 綁定（127.0.0.1:8080），在作業系統層限制 SQLite 檔案的權限，並把這台主機當成可信區域。",
  es: "La mitigación es operativa, no criptográfica: mantenga el bind de loopback por defecto (127.0.0.1:8080), restrinja los permisos de sistema sobre la ruta de SQLite y considere ese host una zona de confianza.",
  pl: "Ochrona jest operacyjna, nie kryptograficzna: zachowaj domyślne nasłuchiwanie na loopback (127.0.0.1:8080), ogranicz uprawnienia systemowe do pliku SQLite i traktuj ten host jako strefę zaufaną.",
  ja: "対策は暗号ではなく運用で打ちます。既定の loopback バインド（127.0.0.1:8080）を維持し、SQLite ファイルへのアクセスを OS レベルで絞り、そのホストを信頼済みゾーンとして扱ってください。",
  th: "แนวทางลดความเสี่ยงเป็นเรื่องการปฏิบัติการ ไม่ใช่เรื่องรหัสวิธี: คงการ bind แบบ loopback ค่าเริ่มต้น (127.0.0.1:8080) ไว้, จำกัดสิทธิ์ระดับระบบปฏิบัติการบนเส้นทาง SQLite และมองโฮสต์นั้นเป็นโซนที่เชื่อถือได้",
  fi: "Toimenpide on operatiivinen eikä kryptografinen: pidä oletusloopback-sidoksessa (127.0.0.1:8080), rajaa SQLite-polun käyttöoikeudet käyttöjärjestelmätasolla ja käsittele tuota konetta luotettuna vyöhykkeenä.",
  uk: "Захист операційний, а не криптографічний: залиште типове loopback-привʼязання (127.0.0.1:8080), обмежте права на рівні ОС для шляху до SQLite та розглядайте цей хост як довірену зону.",
  bg: "Мерката е оперативна, не криптографска: запазете подразбиращия се loopback bind (127.0.0.1:8080), ограничете правата върху SQLite пътя на ниво операционна система и разглеждайте този хост като доверена зона.",
  tr: "Önlem kriptografik değil, operasyoneldir: varsayılan loopback bağlama düzenini (127.0.0.1:8080) koruyun, SQLite yolu için işletim sistemi düzeyinde dosya izinlerini kısıtlayın ve bu sunucuyu güvenli bir bölge olarak ele alın.",
  hu: "Az enyhítés operatív, nem kriptográfiai: tartsd meg az alapértelmezett loopback bekötést (127.0.0.1:8080), korlátozd az SQLite elérésének OS-szintű jogosultságait, és kezeld ezt a gépet megbízható zónaként.",
};

const C3_NOTE: Localized<string> = {
  en: "This is not a content leak. Channel content is sealed by the publisher under the epoch key, and the relay never receives a plaintext; holding the next key is simply what an issuer has to be able to do.",
  ru: "Это не утечка содержимого. Контент канала запечатывается издателем под ключ эпохи, и ретранслятор никогда не получает открытый текст; уметь выдать следующий ключ — ровно то, что эмитент обязан уметь.",
  de: "Das ist kein Inhaltsleck. Kanalinhalte versiegelt der Herausgeber unter dem Epoch-Schlüssel, und das Relay erhält nie Klartext; den nächsten Schlüssel ausstellen zu können, ist genau das, wofür ein Aussteller da ist.",
  fr: "Ce n’est pas une fuite de contenu. Le contenu du canal est scellé par l’éditeur sous la clé d’époque, et le relais ne reçoit jamais de texte en clair : pouvoir remettre la clé suivante, c’est exactement le rôle de l’émetteur.",
  it: "Non è una fuga di contenuti. Il contenuto del canale è sigillato dall'editore con la chiave di epoca e il relay non riceve mai testo in chiaro: emettere la chiave successiva è semplicemente ciò che un'emittente deve poter fare.",
  nl: "Dit is geen lekkage van inhoud. Kanaalinhoud wordt door de uitgever onder de epochsleutel verzegeld en de relay krijgt nooit leesbare tekst; de volgende sleutel kunnen uitreiken is nu eenmaal wat een uitgever moet kunnen.",
  cs: "Nejde o únik obsahu. Obsah kanál zapečetí vydavatel pod epochovým klíčem a relay nikdy neobdrží otevřený text; vydat další klíč je prostě to, co emitent musí umět.",
  "zh-Hans": "这不是内容泄露。频道内容由发布方用 epoch 密钥封装，中继永远收不到明文；能发下一个密钥，本来就是签发方必须做到的事。",
  "zh-Hant": "這不是內容外洩。頻道內容由發布方用 epoch 密鑰封裝，中繼永遠收不到明文；能發下一個密鑰，本來就是簽發方必須做到的事。",
  es: "Esto no es una filtración de contenido. El contenido del canal lo sella el publicador con la clave de época y el relay nunca recibe texto plano: emitir la clave siguiente es justo lo que un emisor debe poder hacer.",
  pl: "To nie jest wyciek treści. Treść kanału zakrywa wydawca pod kluczem epoki, a przekaźnik nigdy nie otrzymuje tekstu jawnego; wystawienie następnego klucza to po prostu to, co wystawca musi potrafić.",
  ja: "これは内容の漏えいではありません。チャンネルの内容は公開者がエポック鍵で封をするため、リレーに平文が届くことはありません。次の鍵を発行できることは、発行者としての必須の機能です。",
  th: "นี่ไม่ใช่การทำเนื้อหาหลุด ผู้เผยแพร่ซีลเนื้อหาแชนแนลด้วยคีย์ epoch และรีเลย์ไม่มีวันได้รับข้อความธรรมดา การออกคีย์ถัดไปได้คือสิ่งที่ผู้ออกต้องทำได้อยู่แล้ว",
  fi: "Tämä ei ole sisällön vuoto. Kanavan sisällön sinetöi julkaisija epoch-avaimella, eikä relay saa koskaan selvää tekstiä; seuraavan avaimen myöntäminen on yksinkertaisesti se, mitä myöntäjän täytyy pystyä tekemään.",
  uk: "Це не витік вмісту. Вміст каналу запечатує видавець під ключем епохи, і ретранслятор ніколи не отримує відкритого тексту; вміння видати наступний ключ — саме те, що емітент повинен уміти.",
  bg: "Това не е изтичане на съдържание. Съдържанието на канала се запечатва от издателя под ключа на епохата и релеят никога не получава отворен текст; способността да издадеш следващия ключ е просто това, което един издател трябва да може.",
  tr: "Bu bir içerik sızıntısı değildir. Kanal içeriği, yayıncı tarafından epoch anahtarıyla mühürlenir ve aktarıcı asla düz metin almaz; bir sonraki anahtarı verebilmek, zaten bir çıkarıcının yapması gereken şeydir.",
  hu: "Ez nem tartalmi szivárgás. A csatorna tartalmát a közreadó az epochakulccsal zárja le, és az átjátszó soha nem kap nyílt szöveget; a következő kulcs kiállítása egyszerűen az, amit egy kibocsátónak tudnia kell.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 6. Card 4 — service-account menu
 * ───────────────────────────────────────────────────────────────────────── */

const C4_TITLE: Localized<string> = {
  en: "Service-account menu: two levels, 3 x 5",
  ru: "Меню сервисного аккаунта: два уровня, 3 x 5",
  de: "Dienstkontomenü: zwei Ebenen, 3 x 5",
  fr: "Menu du compte de service : deux niveaux, 3 x 5",
  it: "Menu dell'account servizio: due livelli, 3 x 5",
  nl: "Serviceaccountmenu: twee niveaus, 3 x 5",
  cs: "Menu služebního účtu: dvě úrovně, 3 x 5",
  "zh-Hans": "服务号菜单：两级，3 x 5",
  "zh-Hant": "服務號選單：兩級，3 x 5",
  es: "Menú de la cuenta de servicio: dos niveles, 3 x 5",
  pl: "Menu konta serwisowego: dwa poziomy, 3 x 5",
  ja: "サービスアカウントのメニュー：2 階層、3 x 5",
  th: "เมนูของบัญชีบริการ: สองระดับ 3 x 5",
  fi: "Palvelutilin valikko: kaksi tasoa, 3 x 5",
  uk: "Меню сервісного акаунта: два рівні, 3 x 5",
  bg: "Меню на сервисния акаунт: две нива, 3 x 5",
  tr: "Servis hesabı menüsü: iki seviye, 3 x 5",
  hu: "A szolgáltatási fiók menüje: két szint, 3 x 5",
};

const C4_LEDE: Localized<string> = {
  en: "The gateway validates a menu against the client's own limits before it pushes one, so a broken menu is rejected at the API instead of silently dropped on the phone.",
  ru: "Шлюз проверяет меню по лимитам самого клиента, прежде чем отправить его, — сломанное меню отвергается на API, а не молча пропадает на телефоне.",
  de: "Das Gateway prüft ein Menü gegen die Grenzen des Clients, bevor es es pusht: ein kaputtes Menü wird also an der API abgewiesen und verschwindet nicht still auf dem Telefon.",
  fr: "La passerelle valide un menu contre les limites du client avant de le pousser : un menu invalide est donc rejeté à l’API au lieu de disparaître en silence sur le téléphone.",
  it: "Il gateway valida un menu contro i limiti del client prima di inviarlo, quindi un menu malformato viene rifiutato all'API invece di scomparire in silenzio sul telefono.",
  nl: "De gateway toetst een menu tegen de limieten van de client voordat hij het doorstuurt: een kapot menu wordt dus bij de API afgewezen in plaats van stil op de telefoon te verdwijnen.",
  cs: "Brána menu ověří podle limitů samotného klienta, než ho pošle — poškozené menu tak zamítne API, místo aby na telefonu tiše zmizelo.",
  "zh-Hans": "网关在推送菜单之前会按客户端自己的上限校验它，所以格式错的菜单是在 API 上被拒绝，而不是在手机上悄悄消失。",
  "zh-Hant": "閘道在推送選單之前會依用戶端自己的上限驗證它，所以格式錯的選單是在 API 上被拒絕，而不是在手機上悄悄消失。",
  es: "La pasarela valida un menú contra los límites del propio cliente antes de enviarlo, así que un menú roto lo rechaza la API en lugar de desaparecer en silencio en el teléfono.",
  pl: "Brama sprawdza menu według limitów samego klienta, zanim je wyśle — zepsute menu odrzuca więc API, zamiast po cichu zniknąć na telefonie.",
  ja: "ゲートウェイはメニューを送信する前にクライアント自身の上限で検証します。不正なメニューはスマホ上で黙って消えるのではなく、API で拒否されます。",
  th: "เกตเวย์จะตรวจเมนูกับขีดจำกัดของไคลเอนต์เองก่อนส่งเสมอ เมนูที่ผิดรูปจึงถูก API ปฏิเสธ แทนที่จะหายเงียบไปบนมือถือ",
  fi: "Gateway tarkistaa valikon clientin omia rajoja vasten ennen lähettämistä, joten vioittunut valikko hylätään API:ssa sen sijaan, että se katoaisi puhelimessa hiljaa.",
  uk: "Шлюз перевіряє меню за лімітами самого клієнта, перш ніж надіслати його, — зламане меню відхиляє API, замість того щоб беззвучно зникнути на телефоні.",
  bg: "Гейтуейтът проверява менюто спрямо лимитите на самия клиент, преди да го изпрати, така че счупено меню се отхвърля от API-то, вместо безмълвно да изчезне на телефона.",
  tr: "Ağ geçidi, bir menüyü göndermeden önce istemcinin kendi sınırlarına göre doğrular; bozuk bir menü telefonda sessizce kaybolmak yerine API'de reddedilir.",
  hu: "Az átjáró elküldés előtt az ügyfél saját korlátjai szerint ellenőrzi a menüt, ezért egy hibás menüt az API utasít el, nem pedig csendben eltűnik a telefonon.",
};

const C4_R_ITEMS: Localized<string> = {
  en: "Top level",
  ru: "Верхний уровень",
  de: "Erste Ebene",
  fr: "Premier niveau",
  it: "Primo livello",
  nl: "Eerste niveau",
  cs: "První úroveň",
  "zh-Hans": "第一级",
  "zh-Hant": "第一級",
  es: "Primer nivel",
  pl: "Pierwszy poziom",
  ja: "第一段階",
  th: "ระดับบนสุด",
  fi: "Ensimmäinen taso",
  uk: "Верхній рівень",
  bg: "Първо ниво",
  tr: "Üst seviye",
  hu: "Felső szint",
};

const C4_R_SUBS: Localized<string> = {
  en: "Second level",
  ru: "Второй уровень",
  de: "Zweite Ebene",
  fr: "Deuxième niveau",
  it: "Secondo livello",
  nl: "Tweede niveau",
  cs: "Druhá úroveň",
  "zh-Hans": "第二级",
  "zh-Hant": "第二級",
  es: "Segundo nivel",
  pl: "Drugi poziom",
  ja: "第二段階",
  th: "ระดับสอง",
  fi: "Toinen taso",
  uk: "Другий рівень",
  bg: "Второ ниво",
  tr: "İkinci seviye",
  hu: "Második szint",
};

const C4_R_TITLE: Localized<string> = {
  en: "Item title",
  ru: "Заголовок пункта",
  de: "Menüpunkt-Titel",
  fr: "Titre d’élément",
  it: "Titolo della voce",
  nl: "Itemtitel",
  cs: "Název položky",
  "zh-Hans": "菜单项标题",
  "zh-Hant": "選單項標題",
  es: "Título del elemento",
  pl: "Tytuł pozycji",
  ja: "項目タイトル",
  th: "ชื่อรายการ",
  fi: "Kohdan nimike",
  uk: "Заголовок пункту",
  bg: "Заглавие на елемента",
  tr: "Öğe başlığı",
  hu: "Bejegyzés címe",
};

const C4_R_KINDS: Localized<string> = {
  en: "Item kind",
  ru: "Тип пункта",
  de: "Punktart",
  fr: "Type d’élément",
  it: "Tipo di voce",
  nl: "Soort item",
  cs: "Druh položky",
  "zh-Hans": "菜单项类型",
  "zh-Hant": "選單項類型",
  es: "Tipo de elemento",
  pl: "Rodzaj pozycji",
  ja: "項目の種類",
  th: "ชนิดของรายการ",
  fi: "Kohdan tyyppi",
  uk: "Тип пункту",
  bg: "Вид елемент",
  tr: "Öğe türü",
  hu: "Bejegyzés típusa",
};

const C4_R_ACTIONS: Localized<string> = {
  en: "Action on an item",
  ru: "Действие пункта",
  de: "Aktion eines Punktes",
  fr: "Action d’un élément",
  it: "Azione di una voce",
  nl: "Actie van een item",
  cs: "Akce položky",
  "zh-Hans": "菜单项动作",
  "zh-Hant": "選單項動作",
  es: "Acción del elemento",
  pl: "Akcja pozycji",
  ja: "項目のアクション",
  th: "การกระทำของรายการ",
  fi: "Kohdan toiminto",
  uk: "Дія пункту",
  bg: "Действие на елемента",
  tr: "Öğe eylemi",
  hu: "Bejegyzés művelete",
};

const C4_R_WIRE: Localized<string> = {
  en: "Wire key for subitems",
  ru: "Wire-ключ подпунктов",
  de: "Wire-Schlüssel für Unterpunkte",
  fr: "Clé wire des sous-éléments",
  it: "Chiave wire dei sottoelementi",
  nl: "Wire-sleutel voor onderpunten",
  cs: "Wire-klíč pro podpoložky",
  "zh-Hans": "子项的线上键名",
  "zh-Hant": "子項的線上鍵名",
  es: "Clave wire de los subelementos",
  pl: "Klucz wire podpunktów",
  ja: "下位項目のワイヤキー",
  th: "คีย์ wire ของรายการย่อย",
  fi: "Alakohdan wire-avain",
  uk: "Wire-ключ підпунктів",
  bg: "Wire ключ на поделементите",
  tr: "Alt öğelerin wire anahtarı",
  hu: "Az alpontok wire-kulcsa",
};

const C4_R_ERR: Localized<string> = {
  en: "Violation answer",
  ru: "Ответ при нарушении",
  de: "Antwort bei Verstoß",
  fr: "Réponse en cas d’infraction",
  it: "Risposta in caso di violazione",
  nl: "Antwoord bij overtreding",
  cs: "Odpověď při porušení",
  "zh-Hans": "违规时的响应",
  "zh-Hant": "違規時的回應",
  es: "Respuesta ante la infracción",
  pl: "Odpowiedź przy naruszeniu",
  ja: "違反時の応答",
  th: "คำตอบเมื่อละเมิด",
  fi: "Vastaus rikkeestä",
  uk: "Відповідь при порушенні",
  bg: "Отговор при нарушение",
  tr: "İhlalde verilen yanıt",
  hu: "Válasz szabálysértéskor",
};

const C4_REJECT: Localized<string> = {
  en: "pay_credits and none are rejected on a menu item. Payment belongs on a card, where the amount and the confirmation copy are visible.",
  ru: "pay_credits и none на пункте меню отвергаются. Оплата живёт на карточке, где видны и сумма, и текст подтверждения.",
  de: "pay_credits und none werden auf einem Menüpunkt abgelehnt. Bezahlung gehört auf eine Karte, wo Betrag und Bestätigungstext sichtbar sind.",
  fr: "pay_credits et none sont rejetés sur un élément de menu : le paiement appartient à une carte, où le montant et le texte de confirmation sont visibles.",
  it: "pay_credits e none vengono rifiutati su una voce di menu. Il pagamento appartiene a una card, dove l'importo e il testo di conferma sono visibili.",
  nl: "pay_credits en none worden op een menu-item geweigerd. Betaling hoort op een kaart, waar het bedrag en de bevestigingstekst zichtbaar zijn.",
  cs: "pay_credits a none se na položce menu zamítají. Platba patří na kartu, kde jsou vidět částka i potvrzovací text.",
  "zh-Hans": "菜单项上不接受 pay_credits 与 none。付款应该放在卡片上，那里金额和确认文案都是可见的。",
  "zh-Hant": "選單項上不允許 pay_credits 與 none。付款應該放在卡片上，那裡金額與確認文字都是可見的。",
  es: "pay_credits y none se rechazan en un elemento de menú. El pago va en una tarjeta, donde el importe y el texto de confirmación son visibles.",
  pl: "pay_credits i none są odrzucane na pozycji menu. Płatność należy do karty, na której widoczna jest kwota i tekst potwierdzenia.",
  ja: "メニュー項目では pay_credits と none が拒否されます。支払いはカード上で行うもので、金額と確認文が目に見える場所です。",
  th: "เมนูรายการจะไม่รับ pay_credits และ none การจ่ายเงินต้องอยู่บนการ์ด ซึ่งเป็นที่ที่จำนวนเงินและข้อความยืนยันปรากฏให้เห็น",
  fi: "pay_credits ja none hylätään valikkokohdalla. Maksaminen kuuluu kortille, jossa määrä ja vahvistusteksti näkyvät.",
  uk: "pay_credits і none на пункті меню відхиляються. Оплата належить картці, де видні й сума, і текст підтвердження.",
  bg: "pay_credits и none се отхвърлят върху елемент от менюто. Плащането си е на картичка, където сумата и текстът за потвърждение се виждат.",
  tr: "Menü öğesinde pay_credits ve none reddedilir. Ödeme, tutarın ve onay metninin göründüğü kartta yer alır.",
  hu: "A pay_credits és a none menübejegyzésen elutasításra kerül. A fizetés kártyára tartozik, ahol az összeg és a megerősítő szöveg is látható.",
};

const C4_DEPTH: Localized<string> = {
  en: "A third level does not degrade into a submenu: the iOS client discards the entire menu, so the gateway refuses the frame instead.",
  ru: "Третий уровень не превращается в подменю: iOS-клиент выбрасывает всё меню целиком, поэтому шлюз отвергает такой кадр заранее.",
  de: "Eine dritte Ebene degeneriert nicht zu einem Untermenü: der iOS-Client verwirft das ganze Menü, deshalb weist das Gateway den Rahmen gleich ab.",
  fr: "Un troisième niveau ne se dégrade pas en sous-menu : le client iOS jette le menu entier, aussi la passerelle refuse la trame à sa place.",
  it: "Un terzo livello non degrada a sottomenu: il client iOS scarta l'intero menu, quindi il gateway rifiuta il frame in anticipo.",
  nl: "Een derde niveau degradeert niet tot een submenu: de iOS-client gooit het hele menu weg, dus de gateway wijst het frame af.",
  cs: "Třetí úroveň se neredukuje na podmenu: iOS klient zahodí celé menu, proto brána takový frame odmítne předem.",
  "zh-Hans": "第三级不会退化成子菜单：iOS 客户端会把整个菜单丢掉，所以网关宁可直接拒绝这一帧。",
  "zh-Hant": "第三級不會退化成子選單：iOS 用戶端會把整個選單丟掉，所以閘道寧可直接拒絕這一影格。",
  es: "Un tercer nivel no degrada a un submenú: el cliente de iOS descarta el menú completo, así que la pasarela rechaza la trama de antemano.",
  pl: "Trzeci poziom nie zdegraduje do podmenu: klient iOS odrzuca całe menu, dlatego brama odrzuca taką ramkę z góry.",
  ja: "三つ目の階層はサブメニューに縮退しません。iOS クライアントはメニュー全体を破棄してしまうため、ゲートウェイがそのフレームを拒否します。",
  th: "ระดับที่สามไม่ได้กลายเป็นเมนูย่อย ไคลเอนต์ iOS จะทิ้งเมนูทั้งชุด เกตเวย์จึงปฏิเสธเฟรมนั้นเสียตั้งแต่แรก",
  fi: "Kolmas taso ei rapautu alivalikoksi: iOS-client hylkää koko valikon, joten gateway kieltäytyy kehyksestä jo ennakkoon.",
  uk: "Третій рівень не перетворюється на підменю: iOS-клієнт викидає все меню цілком, тому шлюз відхиляє такий кадр заздалегідь.",
  bg: "Трето ниво не се свежда до подменю: iOS клиентът хвърля цялото меню, затова гейтуейтът отхвърля кадъра предварително.",
  tr: "Üçüncü seviye bir alt menüye dönüşmez: iOS istemcisi tüm menüyü çöpe atar, bu yüzden ağ geçidi kareyi baştan reddeder.",
  hu: "A harmadik szint nem almenüvé romlik: az iOS-ügyfél az egész menüt eldobja, ezért az átjáró előre elutasítja a keretet.",
};

const C4_QUIRK: Localized<string> = {
  en: "Client quirk the server cannot enforce: a parent that carries its own action is only reachable as the popup's first row while it has fewer than 5 children; at exactly 5 its action has no row left.",
  ru: "Клиентская особенность, которую сервер не может проконтролировать: действие родителя доступно в попапе только первой строкой и только пока у него меньше 5 дочерних пунктов; ровно на 5 для действия не остаётся строки.",
  de: "Client-Eigenheit, die der Server nicht erzwingen kann: Ein Elternpunkt mit eigener Aktion ist nur als erste Popup-Zeile erreichbar, solange er weniger als 5 Unterpunkte hat; bei genau 5 bleibt für die Aktion keine Zeile.",
  fr: "Particularité du client que le serveur ne peut pas imposer : l’action d’un parent n’est atteignable en popup qu’en première ligne, et seulement tant qu’il a moins de 5 enfants ; à exactement 5, il ne reste aucune ligne pour elle.",
  it: "Comportamento del client che il server non può imporre: l'azione di un genitore è raggiungibile come prima riga del popup solo finché ha meno di 5 figli; a esattamente 5, per l'azione non resta nessuna riga.",
  nl: "Client-eigenheid die de server niet kan afdwingen: een oudersitem met een eigen actie is alleen bereikbaar als eerste rij van de pop-up zolang het minder dan 5 onderpunten heeft; bij precies 5 blijft er voor de actie geen rij over.",
  cs: "Vlastnost klienta, kterou server nemůže vynutit: akce rodiče je dosažitelná jako první řádek popupu jen tehdy, když má rodič méně než 5 podpoložek; při přesně 5 na akci nezůstává řádek.",
  "zh-Hans": "服务器管不到的客户端行为：自带动作的父项只有作为弹出菜单第一行时才点得到，而且必须它的子项少于 5 个；正好 5 个时，那个动作就没有位置放了。",
  "zh-Hant": "伺服器管不到的用戶端行為：自帶動作的父項只有作為彈出選單第一行時才點得到，而且必須它的子項少於 5 個；正好 5 個時，那個動作就沒有位置可放。",
  es: "Particularidad del cliente que el servidor no puede imponer: la acción de un padre solo es alcanzable como primera fila del emergente mientras tenga menos de 5 hijos; con exactamente 5 no queda fila para la acción.",
  pl: "Cecha klienta, której serwer nie wymusi: akcja elementu nadrzędnego jest osiągalna jako pierwszy wiersz wyskakującego okna tylko dopóki ma mniej niż 5 dzieci; przy dokładnie 5 nie zostaje już wiersz.",
  ja: "サーバーが強制できないクライアント側の挙動があります。自前のアクションを持つ親項目は、子項目が 5 個未満の間だけポップアップの先頭行として到達できます。ちょうど 5 個になると、アクションのための行が残りません。",
  th: "พฤติกรรมของไคลเอนต์ที่เซิร์ฟเวอร์บังคับไม่ได้: เมนูแม่ที่มีแอ็กชันของตัวเองจะกดได้ถึงก็ต่อเมื่อเป็นแถวแรกของป๊อปอัพและมีรายการย่อยน้อยกว่า 5 ตัว ถ้ามีครบ 5 ตัวจะไม่มีแถวเหลือให้แอ็กชันนั้น",
  fi: "Clientin ominaisuus, jota palvelin ei voi pakottaa: vanhemman oma toiminto on saavutettavissa ponnahduksen ensimmäisenä rivinä vain niin kauan kuin sillä on alle 5 alakohdetta; tasan 5 jälkeen riviltä ei jää tilaa toiminnolle.",
  uk: "Особливість клієнта, яку сервер не може проконтролювати: дія батьківського пункту доступна як перший рядок попапа, лише поки в нього менше 5 дочірніх; рівно на 5 для дії рядка вже не залишається.",
  bg: "Поведение на клиента, което сървърът не може да наложи: собственото действие на родител се достига като първи ред в изскачащия прозорец само докато има по-малко от 5 деца; при точно 5 за действието не остава ред.",
  tr: "Sunucunun zorlayamadığı bir istemci davranışı: kendi eylemi olan üst öğe, ancak çocuk sayısı 5'ten azken açılır menünün ilk satırı olarak erişilebilir; tam 5 çocukta eyleme satır kalmaz.",
  hu: "Ügyféljellemző, amelyet a szerver nem tud kikényszeríteni: a saját művelettel rendelkező szülő csak a felugró első soraként érhető el, amíg kevesebb mint 5 gyermeke van; pontosan 5 gyermeknél a műveletnek nem marad sor.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 7. Card 5 — card styles
 * ───────────────────────────────────────────────────────────────────────── */

const C5_TITLE: Localized<string> = {
  en: "Card styles: standard, receipt, security",
  ru: "Стили карточек: standard, receipt, security",
  de: "Kartenstile: standard, receipt, security",
  fr: "Styles de carte : standard, receipt, security",
  it: "Stili delle card: standard, receipt, security",
  nl: "Kaartstijlen: standard, receipt, security",
  cs: "Styly karet: standard, receipt, security",
  "zh-Hans": "卡片样式：standard、receipt、security",
  "zh-Hant": "卡片樣式：standard、receipt、security",
  es: "Estilos de tarjeta: standard, receipt, security",
  pl: "Style kart: standard, receipt, security",
  ja: "カードスタイル：standard、receipt、security",
  th: "สไตล์ของการ์ด: standard, receipt, security",
  fi: "Korttityylit: standard, receipt, security",
  uk: "Стилі карток: standard, receipt, security",
  bg: "Стилове на картичките: standard, receipt, security",
  tr: "Kart stilleri: standard, receipt, security",
  hu: "Kártyastílusok: standard, receipt, security",
};

const C5_LEDE: Localized<string> = {
  en: "The field set is identical for all three styles. The style is a render hint the client paints with; it is not a schema, and no field exists in one style that another one lacks.",
  ru: "Набор полей у всех трёх стилей одинаков. Стиль — это подсказка для отрисовки на клиенте, а не схема: в одном стиле нет поля, которого не хватает в другом.",
  de: "Der Feldsatz ist bei allen drei Stilen identisch. Der Stil ist ein Render-Hint, mit dem der Client malt, aber kein Schema: In einem Stil gibt es kein Feld, das in einem anderen fehlte.",
  fr: "Le jeu de champs est identique pour les trois styles. Le style est une indication de rendu pour le client, pas un schéma : aucun champ n’existe dans un style et manque dans un autre.",
  it: "L'insieme dei campi è identico per tutti e tre gli stili. Lo stile è un suggerimento di rendering per il client, non uno schema: non esiste un campo presente in uno stile e assente in un altro.",
  nl: "De veldenset is voor alle drie stijlen identiek. De stijl is een renderhint waarmee de client tekent, geen schema: er bestaat geen veld dat in de ene stijl wél en in de andere niet voorkomt.",
  cs: "Sada polí je u všech tří stylů totožná. Styl je jen napověda pro vykreslení na klientu, ne schéma: žádné pole neexistuje v jednom stylu a chybí v druhém.",
  "zh-Hans": "三种样式的字段集合完全相同。样式只是客户端绘制时的提示，不是 schema：不存在某一样式里有、另一样式里没有的字段。",
  "zh-Hant": "三種樣式的欄位集合完全相同。樣式只是用戶端繪製時的提示，不是 schema：不存在某一樣式裡有、另一樣式裡沒有的欄位。",
  es: "El conjunto de campos es idéntico en los tres estilos. El estilo es una pista de renderizado para el cliente, no un esquema: ningún campo existe en un estilo y falta en otro.",
  pl: "Zestaw pól jest we wszystkich trzech stylach identyczny. Styl to tylko podpowiedź do renderowania po stronie klienta, a nie schemat: żadne pole nie istnieje w jednym stylu, a braknie go w drugim.",
  ja: "3 つのスタイルでフィールド集合は完全に同じです。スタイルはクライアントが描画する際のヒントにすぎず、スキーマではありません。あるスタイルにあって別のはずりにないフィールドは存在しません。",
  th: "ชุดฟิลด์ของทั้งสามสไตล์เหมือนกันสนิท สไตล์เป็นแค่คำแนะนำในการเรนเดอร์ที่ไคลเอนต์ใช้ ไม่ได้เป็นสคีมา: ไม่มีฟิลด์ไหนที่มีในสไตล์หนึ่งแต่ขาดไปในอีกสไตล์",
  fi: "Kenttäjoukko on kaikissa kolmessa tyylissä identtinen. Tyyli on vihje, jolla client piirtää, ei skeema: mikään kenttä ei ole toisessa tyylissä ja puuttuu toisesta.",
  uk: "Набір полів в усіх трьох стилях однаковий. Стиль — це підказка для малювання на клієнті, а не схема: жодне поле не існує в одному стилі, щоб бракувало в іншому.",
  bg: "Наборът от полета е еднакъв при и трите стила. Стилът е подсказка за изчертаване в клиента, не схема: няма поле, което да е в един стил и да липсва в друг.",
  tr: "Üç stilde de alan seti tamamen aynıdır. Stil, istemcinin boyadığı bir çizim ipucudur, şema değil: bir stilde olan başka bir stilde bulunmayan alan yoktur.",
  hu: "Mindhárom stílusban a mezők készlete azonos. A stílus csak renderelési tipp az ügyfélnek, nem séma: nincs olyan mező, amely az egyik stílusban létezik, a másikban viszont hiányzik.",
};

const C5_USE_STANDARD: Localized<string> = {
  en: "Everything that is not one of the other two.",
  ru: "Всё, что не относится к двум другим.",
  de: "Alles, was nicht zu den anderen beiden gehört.",
  fr: "Tout ce qui ne relève pas des deux autres.",
  it: "Tutto ciò che non rientra negli altri due.",
  nl: "Alles wat niet tot de andere twee behoort.",
  cs: "Vše, co nepatří pod ty druhé dva.",
  "zh-Hans": "不属于另外两种的一切都用它。",
  "zh-Hant": "不屬於另外兩種的一切都用它。",
  es: "Todo lo que no corresponde a los otros dos.",
  pl: "Wszystko, co nie należy do pozostałych dwóch.",
  ja: "他の 2 つに当たらないものはすべてこれです。",
  th: "ทุกอย่างที่ไม่เข้าข่ายอีกสองแบบ",
  fi: "Kaikki, mikä ei kuulu mihinkään muista kahdesta.",
  uk: "Усе, що не належить до двох інших.",
  bg: "Всичко, което не е от другите два.",
  tr: "Diğer ikisine girmeyen her şey.",
  hu: "Minden, ami nem tartozik a másik kettőbe.",
};

const C5_USE_RECEIPT: Localized<string> = {
  en: "Article and payment receipts, as built by main.py.",
  ru: "Чеки за статьи и платежи — так их собирает main.py.",
  de: "Belege für Artikel und Zahlungen, so wie main.py sie baut.",
  fr: "Reçus d’article et de paiement, tels que main.py les construit.",
  it: "Ricevute di articoli e pagamenti, come le costruisce main.py.",
  nl: "Bonnetjes voor artikelen en betalingen, zoals main.py ze bouwt.",
  cs: "Potvrzení o článku a platbě, jak je staví main.py.",
  "zh-Hans": "文章与付款的回执，由 main.py 这样构造。",
  "zh-Hant": "文章與付款的回執，由 main.py 這樣建構。",
  es: "Recibos de artículo y de pago, como los construye main.py.",
  pl: "Paragony artykułu i płatności, takie jak buduje je main.py.",
  ja: "記事と支払いの受領証明です。main.py はこれをこの形で組み立てます。",
  th: "ใบเสร็จของบทความและการจ่ายเงิน ตามที่ main.py สร้างขึ้น",
  fi: "Artikkel- ja maksukuittikortit sellaisina kuin main.py ne rakentaa.",
  uk: "Квитанції за статті та платежі — у саме такому вигляді їх збирає main.py.",
  bg: "Разписи за статии и плащания, каквито main.py изгражда.",
  tr: "Makale ve ödeme makbuzları; main.py bunları bu şekilde kurar.",
  hu: "Cikk- és fizetési igazolások, ahogyan a main.py elkészíti.",
};

const C5_USE_SECURITY: Localized<string> = {
  en: "Alerts and SSO, as used by alert_ops and privacy_sso.",
  ru: "Оповещения и SSO — так их применяют alert_ops и privacy_sso.",
  de: "Alarme und SSO, so wie alert_ops und privacy_sso es nutzen.",
  fr: "Alertes et SSO, tels que alert_ops et privacy_sso les utilisent.",
  it: "Avvisi e SSO, come li usano alert_ops e privacy_sso.",
  nl: "Alarmen en SSO, zoals alert_ops en privacy_sso ze gebruiken.",
  cs: "Alerty a SSO, jak je používají alert_ops a privacy_sso.",
  "zh-Hans": "告警与 SSO，alert_ops 和 privacy_sso 就是这么用的。",
  "zh-Hant": "告警與 SSO，alert_ops 與 privacy_sso 就是這麼用的。",
  es: "Alertas y SSO, como los usan alert_ops y privacy_sso.",
  pl: "Alerty i SSO, tak jak korzystają z nich alert_ops i privacy_sso.",
  ja: "アラートと SSO です。alert_ops と privacy_sso がこの使い方になっています。",
  th: "การแจ้งเตือนกับ SSO ตามที่ alert_ops และ privacy_sso ใช้",
  fi: "Hälytykset ja SSO siten kuin alert_ops ja privacy_sso niitä käyttävät.",
  uk: "Сповіщення та SSO — саме так їх уживають alert_ops і privacy_sso.",
  bg: "Аларми и SSO, както ги ползват alert_ops и privacy_sso.",
  tr: "Uyarılar ve SSO; alert_ops ile privacy_sso bunları böyle kullanır.",
  hu: "Riasztások és SSO, ahogyan az alert_ops és a privacy_sso használja.",
};

const C5_R_REQ: Localized<string> = {
  en: "Required fields",
  ru: "Обязательные поля",
  de: "Pflichtfelder",
  fr: "Champs obligatoires",
  it: "Campi obbligatori",
  nl: "Verplichte velden",
  cs: "Povinná pole",
  "zh-Hans": "必填字段",
  "zh-Hant": "必填欄位",
  es: "Campos obligatorios",
  pl: "Pola wymagane",
  ja: "必須フィールド",
  th: "ฟิลด์ที่จำเป็น",
  fi: "Pakolliset kentät",
  uk: "Обовʼязкові поля",
  bg: "Задължителни полета",
  tr: "Zorunlu alanlar",
  hu: "Kötelező mezők",
};

const C5_R_OPT: Localized<string> = {
  en: "Optional fields",
  ru: "Необязательные поля",
  de: "Optionale Felder",
  fr: "Champs facultatifs",
  it: "Campi facoltativi",
  nl: "Optionele velden",
  cs: "Nepovinná pole",
  "zh-Hans": "可选字段",
  "zh-Hant": "可選欄位",
  es: "Campos opcionales",
  pl: "Pola opcjonalne",
  ja: "任意フィールド",
  th: "ฟิลด์เสริม",
  fi: "Valinnaiset kentät",
  uk: "Необовʼязкові поля",
  bg: "Незадължителни полета",
  tr: "İsteğe bağlı alanlar",
  hu: "Opcionális mezők",
};

const C5_R_ACTKINDS: Localized<string> = {
  en: "Card action kinds",
  ru: "Типы действий карточки",
  de: "Aktionsarten der Karte",
  fr: "Types d’action de carte",
  it: "Tipi di azione della card",
  nl: "Soorten kaartacties",
  cs: "Druhy akcí karty",
  "zh-Hans": "卡片动作类型",
  "zh-Hant": "卡片動作類型",
  es: "Tipos de acción de la tarjeta",
  pl: "Rodzaje akcji karty",
  ja: "カードのアクション種類",
  th: "ชนิดของการกระทำบนการ์ด",
  fi: "Kortin toimintotyypit",
  uk: "Типи дій картки",
  bg: "Видове действия на картичката",
  tr: "Kart eylem türleri",
  hu: "Kártyaműveletek típusai",
};

const C5_R_ACTSTYLES: Localized<string> = {
  en: "Button styles",
  ru: "Стили кнопок",
  de: "Schaltflächenstile",
  fr: "Styles de bouton",
  it: "Stili dei pulsanti",
  nl: "Knopstijlen",
  cs: "Styly tlačítek",
  "zh-Hans": "按钮样式",
  "zh-Hant": "按鈕樣式",
  es: "Estilos de botón",
  pl: "Style przycisków",
  ja: "ボタンのスタイル",
  th: "สไตล์ของปุ่ม",
  fi: "Painikkeiden tyylit",
  uk: "Стили кнопок",
  bg: "Стилове на бутоните",
  tr: "Düğüm stilleri",
  hu: "Gombstílusok",
};

const C5_HINT: Localized<string> = {
  en: "Selecting a style here changes nothing above: same fields, same caps, same frame.",
  ru: "Выбор стиля здесь ничего выше не меняет: те же поля, те же лимиты, тот же кадр.",
  de: "Die Stilwahl hier ändert oben nichts: gleiche Felder, gleiche Grenzen, gleicher Frame.",
  fr: "Choisir un style ici ne change rien au-dessus : mêmes champs, mêmes plafonds, même trame.",
  it: "Scegliere uno stile qui non cambia nulla sopra: stessi campi, stessi limiti, stesso frame.",
  nl: "Een stijl kiezen verandert hierboven niets: dezelfde velden, dezelfde limieten, hetzelfde frame.",
  cs: "Výběr stylu nahoře nic nemění: stejná pole, stejné limity, stejný frame.",
  "zh-Hans": "在这里选样式不会改变上面的任何内容：字段相同、上限相同、帧格式也相同。",
  "zh-Hant": "在這裡選樣式不會改變上面的任何內容：欄位相同、上限相同、影格格式也相同。",
  es: "Elegir un estilo aquí no cambia nada arriba: mismos campos, mismos límites, misma trama.",
  pl: "Wybranie stylu nic powyżej nie zmienia: te same pola, te same limity, ta sama ramka.",
  ja: "ここでスタイルを選んでも上は何も変わりません。フィールドも上限もフレーム書式も同じです。",
  th: "การเลือกสไตล์ที่นี่ไม่ได้เปลี่ยนข้อมูลด้านบน: ฟิลด์เดียวกัน เพดานเดียวกัน และเฟรมเดียวกัน",
  fi: "Tyylin valaminen ei muuta yläpuolella mitään: samat kentät, samat rajat, sama kehys.",
  uk: "Вибір стилю нічого вгорі не змінює: ті самі поля, ті самі ліміти, той самий кадр.",
  bg: "Изборът на стил тук не променя нищо по-горе: същите полета, същите лимити, същият кадър.",
  tr: "Burada stil seçmek yukarıda hiçbir şeyi değiştirmez: aynı alanlar, aynı sınırlar, aynı kare.",
  hu: "A stílus kiválasztása fent semmit nem változtat: ugyanazok a mezők, ugyanazok a korlátok, ugyanaz a keret.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 8. Card 6 — H5 launch authorisation, the phone-side HMAC
 * ───────────────────────────────────────────────────────────────────────── */

const C6_TITLE: Localized<string> = {
  en: "H5 launch authorisation: the phone-side HMAC",
  ru: "Авторизация запуска H5: HMAC на стороне телефона",
  de: "H5-Startautorisierung: der HMAC auf der Telefonseite",
  fr: "Autorisation de lancement H5 : le HMAC côté téléphone",
  it: "Autorizzazione di avvio H5: l'HMAC lato telefono",
  nl: "H5-startautorisatie: de HMAC aan de telefoonkant",
  cs: "Autorizace spuštění H5: HMAC na straně telefonu",
  "zh-Hans": "H5 启动授权：手机侧的 HMAC",
  "zh-Hant": "H5 啟動授權：手機端的 HMAC",
  es: "Autorización de arranque H5: el HMAC del lado del teléfono",
  pl: "Autoryzacja uruchomienia H5: HMAC po stronie telefonu",
  ja: "H5 起動の認可：スマートフォン側の HMAC",
  th: "การอนุญาตเปิดหน้า H5: HMAC ฝั่งโทรศัพท์",
  fi: "H5-käynnistyksen valtuutus: puhelimen puolen HMAC",
  uk: "Авторизація запуску H5: HMAC на боці телефона",
  bg: "Упълномощаване на H5 старт: HMAC от страната на телефона",
  tr: "H5 açma yetkisi: telefon tarafındaki HMAC",
  hu: "H5-indítás engedélyezése: a telefon oldali HMAC",
};

const C6_LEDE: Localized<string> = {
  en: "Alert intake checks a per-source static token first; when POPOPX_ALERT_WEBHOOK_SECRET is set it also demands X-Popopx-Timestamp and X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> within ±300 s, with a process-local replay cache. Admin access is the root token — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer or ?token= — plus scoped pxa_ tokens: SHA-256 at rest, core:/plugin: scopes, expiry, revocation and audit. HMAC-SHA256 signs the H5 launch URL here, and Slack/Discord and workflow deliveries carry their own outbound HMACs.",
  ru: "Приём алертов сначала проверяет статический токен источника; если задан POPOPX_ALERT_WEBHOOK_SECRET, он дополнительно требует X-Popopx-Timestamp и X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> в пределах ±300 с, с кешем повторов, локальным для процесса. Доступ в админку — это корневой токен (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer или ?token=) плюс ограниченные по областям токены pxa_: SHA-256 в хранилище, области core:/plugin:, срок действия, отзыв и аудит. HMAC-SHA256 здесь подписывает URL запуска H5, а доставки Slack/Discord и workflow несут собственные исходящие HMAC.",
  de: "Der Alarm-Intake prüft zuerst einen statischen Token pro Quelle; ist POPOPX_ALERT_WEBHOOK_SECRET gesetzt, verlangt er zusätzlich X-Popopx-Timestamp und X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> innerhalb von ±300 s, mit einem prozesslokalen Replay-Cache. Der Admin-Zugang besteht aus dem Root-Token (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer oder ?token=) plus bereichsgebundenen pxa_-Tokens: SHA-256 im Speicher, core:/plugin:-Scopes, Ablauf, Widerruf und Audit. HMAC-SHA256 signiert hier die H5-Start-URL, und Slack/Discord- sowie Workflow-Zustellungen tragen ihre eigenen ausgehenden HMACs.",
  fr: "L’ingestion d’alertes vérifie d’abord un jeton statique par source ; lorsque POPOPX_ALERT_WEBHOOK_SECRET est défini, elle exige en plus X-Popopx-Timestamp et X-Popopx-Signature : v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> à ±300 s près, avec un cache de rejeu local au processus. L’accès admin, c’est le jeton racine (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer ou ?token=) plus des jetons pxa_ à portée limitée : SHA-256 au repos, portées core:/plugin:, expiration, révocation et audit. Le HMAC-SHA256 signe ici l’URL de lancement H5, et les livraisons Slack/Discord et workflow portent leurs propres HMAC sortants.",
  it: "L’acquisizione degli avvisi controlla prima un token statico per fonte; quando POPOPX_ALERT_WEBHOOK_SECRET è impostato richiede anche X-Popopx-Timestamp e X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> entro ±300 s, con una cache di replay locale al processo. L’accesso admin è il token root (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer o ?token=) più token pxa_ con scope: SHA-256 a riposo, scope core:/plugin:, scadenza, revoca e audit. Qui HMAC-SHA256 firma l’URL di avvio H5, mentre le consegne Slack/Discord e workflow portano i propri HMAC in uscita.",
  nl: "Alertinname controleert eerst een statische token per bron; staat POPOPX_ALERT_WEBHOOK_SECRET ingesteld, dan eist het ook X-Popopx-Timestamp en X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> binnen ±300 s, met een proceslokale replaycache. Beheerderstoegang is het root-token (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer of ?token=) plus pxa_-tokens met scopes: SHA-256 in rust, core:/plugin:-scopes, vervaldatum, intrekking en audit. HMAC-SHA256 ondertekent hier de H5-start-URL, en Slack/Discord- en workflowleveringen dragen hun eigen uitgaande HMAC’s.",
  cs: "Příjem alertů nejprve ověří statický token daného zdroje; je-li nastaven POPOPX_ALERT_WEBHOOK_SECRET, vyžaduje navíc X-Popopx-Timestamp a X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> v rozmezí ±300 s, s procesně lokální cache pro opakování. Přístup do administrace je kořenový token (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer nebo ?token=) plus tokeny pxa_ s rozsahy: SHA-256 při uložení, rozsahy core:/plugin:, platnost, odvolání a audit. HMAC-SHA256 zde podepisuje URL pro spuštění H5 a doručení Slack/Discord i workflow nesou vlastní odchozí HMAC.",
  "zh-Hans": "告警接入先校验按来源的静态令牌；配置了 POPOPX_ALERT_WEBHOOK_SECRET 时，还会要求 X-Popopx-Timestamp 与 X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")>，时间窗 ±300 秒，并带进程内重放缓存。管理面是根令牌（X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer 或 ?token= 四种写法）加带作用域的 pxa_ 令牌：落库只存 SHA-256，作用域为 core:/plugin:，支持过期、吊销与审计。HMAC-SHA256 在这里给 H5 启动链接签名，Slack/Discord 与工作流投递则各自携带自己的出站 HMAC。",
  "zh-Hant": "告警接入先驗證依來源的靜態權杖；設定了 POPOPX_ALERT_WEBHOOK_SECRET 時，還會要求 X-Popopx-Timestamp 與 X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")>，時間窗 ±300 秒，並附程序內重放快取。管理面是根權杖（X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer 或 ?token= 四種寫法）加上帶作用域的 pxa_ 權杖：落庫只存 SHA-256，作用域為 core:/plugin:，支援到期、撤銷與稽核。HMAC-SHA256 在這裡替 H5 啟動連結簽名，Slack/Discord 與工作流程投遞則各自帶著自己的出站 HMAC。",
  es: "La ingesta de alertas comprueba primero un token estático por origen; si POPOPX_ALERT_WEBHOOK_SECRET está definido, exige además X-Popopx-Timestamp y X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> dentro de ±300 s, con una caché de repetición local al proceso. El acceso de administración es el token raíz (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer o ?token=) más tokens pxa_ con alcance: SHA-256 en reposo, alcances core:/plugin:, caducidad, revocación y auditoría. Aquí HMAC-SHA256 firma la URL de lanzamiento H5, y las entregas de Slack/Discord y de workflow llevan sus propios HMAC de salida.",
  pl: "Przyjmowanie alertów najpierw sprawdza statyczny token źródła; gdy ustawiono POPOPX_ALERT_WEBHOOK_SECRET, wymaga dodatkowo X-Popopx-Timestamp i X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> w oknie ±300 s, z procesowym cache′em powtórzeń. Dostęp administracyjny to token główny (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer lub ?token=) plus tokeny pxa_ z zakresami: SHA-256 w spoczynku, zakresy core:/plugin:, wygaśnięcie, odwołanie i audyt. HMAC-SHA256 podpisuje tutaj adres startowy H5, a dostarczenia Slack/Discord i workflow niosą własne wychodzące HMAC.",
  ja: "アラート受け口はまず送信元ごとの静的トークンを検証し、POPOPX_ALERT_WEBHOOK_SECRET が設定されていれば X-Popopx-Timestamp と X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> を ±300 秒の範囲で追加要求します（プロセス内のリプレイキャッシュ付き）。管理面はルートトークン（X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer、?token= の4通り）に加え、スコープ付き pxa_ トークンです。保存時は SHA-256、スコープは core:/plugin:、有効期限・失効・監査を備えます。ここでは HMAC-SHA256 が H5 起動 URL に署名し、Slack/Discord とワークフローの配信はそれぞれ独自の送信用 HMAC を携えます。",
  th: "ช่องรับการแจ้งเตือนตรวจโทเคนสถิติต่อแหล่งที่มาก่อน หากตั้ง POPOPX_ALERT_WEBHOOK_SECRET ไว้ จะต้องมี X-Popopx-Timestamp และ X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> ภายใน ±300 วินาที พร้อมแคชกัน replay ระดับโปรเซส การเข้าถึงผู้ดูแลคือโทเคนหลัก (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer หรือ ?token=) บวกโทเคน pxa_ แบบมีขอบเขต: เก็บเป็น SHA-256, ขอบเขต core:/plugin:, มีวันหมดอายุ การเพิกถอน และการตรวจสอบย้อนหลัง HMAC-SHA256 ใช้เซ็น URL เปิดหน้า H5 ที่นี่ ส่วนการส่งไป Slack/Discord และ workflow มี HMAC ขาออกของตัวเอง",
  fi: "Hälytysten vastaanotto tarkistaa ensin lähdekohtaisen staattisen tunnisteen; jos POPOPX_ALERT_WEBHOOK_SECRET on asetettu, se vaatii lisäksi X-Popopx-Timestamp- ja X-Popopx-Signature-otsikot: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> ±300 sekunnin sisällä, prosessikohtaisella toistovälimuistilla. Hallintapääsy on juuritunniste (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer tai ?token=) sekä rajatuin valtuuksin varustetut pxa_-tunnisteet: SHA-256 tallennuksessa, core:/plugin:-rajaukset, vanheneminen, mitätöinti ja auditointi. HMAC-SHA256 allekirjoittaa täällä H5-käynnistys-URL:n, ja Slack/Discord- sekä workflow-toimituksilla on omat lähtevät HMAC:nsa.",
  uk: "Приймання сповіщень спершу перевіряє статичний токен джерела; якщо задано POPOPX_ALERT_WEBHOOK_SECRET, воно додатково вимагає X-Popopx-Timestamp і X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> у межах ±300 с, із кешем повторів, локальним для процесу. Доступ до адмінки — це кореневий токен (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer або ?token=) плюс токени pxa_ зі скоупами: SHA-256 у сховищі, скоупи core:/plugin:, термін дії, відкликання й аудит. HMAC-SHA256 тут підписує URL запуску H5, а доставки Slack/Discord і workflow несуть власні вихідні HMAC.",
  bg: "Приемането на известия първо проверява статичен токен за всеки източник; когато е зададен POPOPX_ALERT_WEBHOOK_SECRET, то изисква още X-Popopx-Timestamp и X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> в рамките на ±300 s, с локален за процеса кеш за повторения. Достъпът до администрацията е главният токен (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer или ?token=) плюс токени pxa_ с обхвати: SHA-256 при съхранение, обхвати core:/plugin:, изтичане, отнемане и одит. Тук HMAC-SHA256 подписва URL адреса за стартиране на H5, а доставките към Slack/Discord и workflow носят собствени изходящи HMAC.",
  tr: "Uyarı girişi önce kaynak başına statik bir jetonu kontrol eder; POPOPX_ALERT_WEBHOOK_SECRET ayarlıysa ayrıca X-Popopx-Timestamp ve X-Popopx-Signature: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> başlıklarını ±300 s penceresinde ister ve süreç yerelinde bir yeniden oynatma önbelleği tutar. Yönetim erişimi, kök jeton (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer veya ?token=) ile kapsamlı pxa_ jetonlarından oluşur: saklarken SHA-256, core:/plugin: kapsamları, süre sonu, iptal ve denetim. Burada HMAC-SHA256, H5 açma URL'sini imzalar; Slack/Discord ve workflow teslimatları ise kendi giden HMAC'larını taşır.",
  hu: "A riasztásbevitel először forrásonkénti statikus tokent ellenőriz; ha a POPOPX_ALERT_WEBHOOK_SECRET be van állítva, emellett X-Popopx-Timestamp és X-Popopx-Signature fejlécet is követel: v1=<hex HMAC-SHA256(secret, \"<ts>.<raw body>\")> ±300 s ablakon belül, folyamaton belüli visszajátszás-gyorsítótárral. Az admin hozzáférés a gyökér token (X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer vagy ?token=) plusz hatókörözött pxa_ tokenek: SHA-256 a tárolóban, core:/plugin: hatókörök, lejárat, visszavonás és audit. Az HMAC-SHA256 itt az H5-indító URL-t írja alá, a Slack/Discord és workflow kézbesítések pedig saját kimenő HMAC-ot hordoznak.",
};

const C6_R_ALG: Localized<string> = {
  en: "Algorithm",
  ru: "Алгоритм",
  de: "Algorithmus",
  fr: "Algorithme",
  it: "Algoritmo",
  nl: "Algoritme",
  cs: "Algoritmus",
  "zh-Hans": "算法",
  "zh-Hant": "演算法",
  es: "Algoritmo",
  pl: "Algorytm",
  ja: "アルゴリズム",
  th: "อัลกอริทึม",
  fi: "Algoritmi",
  uk: "Алгоритм",
  bg: "Алгоритъм",
  tr: "Algoritma",
  hu: "Algoritmus",
};

const C6_R_PRE: Localized<string> = {
  en: "Signed preimage",
  ru: "Подписываемый прообраз",
  de: "Signiertes Preimage",
  fr: "Préimage signé",
  it: "Preimage firmato",
  nl: "Ondertekende preimage",
  cs: "Podepsovaný preimage",
  "zh-Hans": "被签名的原文",
  "zh-Hant": "被簽名的原文",
  es: "Preimagen firmada",
  pl: "Podpisany preimage",
  ja: "署名対象のプレイメージ",
  th: "พรีอิมเมจที่เซ็น",
  fi: "Allekirjoitettu esikuva",
  uk: "Підписуваний прообраз",
  bg: "Подписван предобраз",
  tr: "İmzalanan öncül görüntü",
  hu: "Aláírt preimage",
};

const C6_R_KEY: Localized<string> = {
  en: "HMAC key",
  ru: "Ключ HMAC",
  de: "HMAC-Schlüssel",
  fr: "Clé HMAC",
  it: "Chiave HMAC",
  nl: "HMAC-sleutel",
  cs: "Klíč HMAC",
  "zh-Hans": "HMAC 密钥",
  "zh-Hant": "HMAC 密鑰",
  es: "Clave HMAC",
  pl: "Klucz HMAC",
  ja: "HMAC 鍵",
  th: "คีย์ HMAC",
  fi: "HMAC-avain",
  uk: "Ключ HMAC",
  bg: "HMAC ключ",
  tr: "HMAC anahtarı",
  hu: "HMAC-kulcs",
};

const C6_KEY_VAL: Localized<string> = {
  en: "the per-follower session secret",
  ru: "секрет сессии конкретного подписчика",
  de: "das Sitzungsgeheimnis des jeweiligen Followers",
  fr: "le secret de session propre à l’abonné",
  it: "il segreto di sessione del singolo follower",
  nl: "het sessiegeheim van die ene volger",
  cs: "session secret konkrétního odběratele",
  "zh-Hans": "该关注者专属的会话密钥",
  "zh-Hant": "該關注者專屬的工作階段密鑰",
  es: "el secreto de sesión de ese seguidor",
  pl: "sekret sesji konkretnego obserwującego",
  ja: "フォロワーごとのセッションシークレット",
  th: "ซีเร็ทเซสชันของผู้ติดตามแต่ละคน",
  fi: "kunkin seuraajan istuntosalaisuus",
  uk: "секрет сесії конкретного підписника",
  bg: "секретът на сесията на конкретния последовател",
  tr: "takipçiye özel oturum sırrı",
  hu: "az adott követő munkamenet-titka",
};

const C6_R_SIG: Localized<string> = {
  en: "Signature length",
  ru: "Длина подписи",
  de: "Signaturlänge",
  fr: "Longueur de la signature",
  it: "Lunghezza della firma",
  nl: "Lengte van de handtekening",
  cs: "Délka podpisu",
  "zh-Hans": "签名长度",
  "zh-Hant": "簽名長度",
  es: "Longitud de la firma",
  pl: "Długość podpisu",
  ja: "署名の長さ",
  th: "ความยาวลายเซ็น",
  fi: "Allekirjoituksen pituus",
  uk: "Довжина підпису",
  bg: "Дължина на подписа",
  tr: "İmza uzunluğu",
  hu: "Alírás hossza",
};

const C6_R_SKEW: Localized<string> = {
  en: "Replay window",
  ru: "Окно повтора",
  de: "Wiederholungsfenster",
  fr: "Fenêtre de rejeu",
  it: "Finestra di replay",
  nl: "Herhalingsvenster",
  cs: "Okno pro opakování",
  "zh-Hans": "重放窗口",
  "zh-Hant": "重放視窗",
  es: "Ventana de repetición",
  pl: "Okno odtworzenia",
  ja: "リプレイ許容窓",
  th: "หน้าต่าง replay",
  fi: "Toistoaika",
  uk: "Вікно повтору",
  bg: "Прозорец за повторение",
  tr: "Yeniden oynatma penceresi",
  hu: "Visszajátszási ablak",
};

const C6_R_QUERY: Localized<string> = {
  en: "Query parameters",
  ru: "Параметры запроса",
  de: "Query-Parameter",
  fr: "Paramètres de requête",
  it: "Parametri di query",
  nl: "Queryparameters",
  cs: "Parametry dotazu",
  "zh-Hans": "查询参数",
  "zh-Hant": "查詢參數",
  es: "Parámetros de consulta",
  pl: "Parametry zapytania",
  ja: "クエリパラメータ",
  th: "พารามิเตอร์ใน query",
  fi: "Kyselyparametrit",
  uk: "Параметри запиту",
  bg: "Параметри на заявката",
  tr: "Sorgu parametreleri",
  hu: "Lekérdezési paraméterek",
};

const C6_R_VERIFY: Localized<string> = {
  en: "Server-side check",
  ru: "Проверка на сервере",
  de: "Serverseitige Prüfung",
  fr: "Vérification côté serveur",
  it: "Verifica lato server",
  nl: "Controle aan de serverkant",
  cs: "Kontrola na straně serveru",
  "zh-Hans": "服务器侧校验",
  "zh-Hant": "伺服器端驗證",
  es: "Comprobación en el servidor",
  pl: "Sprawdzenie po stronie serwera",
  ja: "サーバー側検証",
  th: "การตรวจสอบฝั่งเซิร์ฟเวอร์",
  fi: "Palvelinpuolen tarkistus",
  uk: "Перевірка на боці сервера",
  bg: "Проверка от сървърната страна",
  tr: "Sunucu tarafı kontrol",
  hu: "Szerver oldi ellenőrzés",
};

const C6_ASYM: Localized<string> = {
  en: "The trap is visible on purpose: the preimage says uid=, the query says popopx_uid=. A server that normalises the two starts rejecting every phone.",
  ru: "Ловушка показана нарочно: в прообразе uid=, а в запросе popopx_uid=. Сервер, который «улучшит» эти два имени, начнёт отвергать все телефоны.",
  de: "Die Falle steht absichtlich da: Im Preimage heißt es uid=, in der Query popopx_uid=. Ein Server, der die beiden normalisiert, fängt an, jedes Telefon abzulehnen.",
  fr: "Le piège est visible volontairement : le préimage écrit uid=, la requête écrit popopx_uid=. Un serveur qui normalise les deux commence à rejeter tous les téléphones.",
  it: "La trappola è in mostra di proposito: il preimage dice uid=, la query dice popopx_uid=. Un server che normalizza i due nomi comincia a rifiutare ogni telefono.",
  nl: "De val is opzettelijk zichtbaar: de preimage zegt uid=, de query zegt popopx_uid=. Een server die de twee gelijktrekt, begint elk toestel te weigeren.",
  cs: "Ta past je záměrně vidět: preimage říká uid=, dotaz říká popopx_uid=. Server, který ty dva názvy sjednotí, začne odmítat každý telefon.",
  "zh-Hans": "这个坑是故意留在明处的：原文里写 uid=，查询里写 popopx_uid=。服务器要是把这两个名字统一了，就会开始拒绝每一台手机。",
  "zh-Hant": "這個坑是刻意留在明處：原文裡寫 uid=，查詢裡寫 popopx_uid=。伺服器要是把這兩個名字統一了，就會開始拒絕每一支手機。",
  es: "La trampa está a la vista a propósito: la preimagen dice uid= y la consulta dice popopx_uid=. Un servidor que normalice los dos nombres empieza a rechazar todos los teléfonos.",
  pl: "Ta pułapka jest celowo widoczna: preimage mówi uid=, a zapytanie mówi popopx_uid=. Serwer, który ujednolici te dwie nazwy, zacznie odrzucać każdy telefon.",
  ja: "落とし穴はわざと見える所に置いてあります。プレイメージは uid=、クエリは popopx_uid= です。この 2 つを正規化してしまうサーバーは、あらゆる端末を拒否し始めます。",
  th: "กับดักนี้จงใจให้เห็นชัด: พรีอิมเมจเขียนว่า uid= แต่ใน query เขียนว่า popopx_uid= เซิร์ฟเวอร์ที่ไปทำสองชื่อนี้ให้เหมือนกันจะเริ่มปฏิเสธมือถือทุกเครื่อง",
  fi: "Anska on tarkoituksella näkyvillä: esikuvassa lukee uid=, kyselyssä popopx_uid=. Palvelin, joka yhdenmukaistaa nämä, alkaa hylätä jokaista puhelinta.",
  uk: "Пастку навмисне показано: у прообразі стоїть uid=, а в запиті — popopx_uid=. Сервер, який «зведе» ці дві назви, почне відхиляти кожен телефон.",
  bg: "Капанът е оставен умишлено видим: предобразът казва uid=, а заявката казва popopx_uid=. Сървър, който ги уеднакви, започва да отхвърля всеки телефон.",
  tr: "Tuzak bilerek açıkta: öncül görüntü uid= diyor, sorgu popopx_uid= diyor. Bu iki adı normalize eden bir sunucu her telefonu reddetmeye başlar.",
  hu: "A csapda szándékosan látható: a preimage azt írja, uid=, a lekérdezés azt, popopx_uid=. A két nevet egységesítő szerver elkezdi elutasítani minden telefont.",
};

const C6_NOSECRET: Localized<string> = {
  en: "Only the gateway holds the per-follower secret, so page JavaScript cannot compute a signature itself. verifyH5Auth exists so a merchant's own web server can check a launch without any gateway credential.",
  ru: "Только шлюз держит секрет подписчика, поэтому JS на странице не может сам вычислить подпись. verifyH5Auth существует для того, чтобы веб-сервер мерчанта проверил запуск, не имея учётных данных шлюза.",
  de: "Nur das Gateway kennt das Follower-Geheimnis, Seiten-JavaScript kann die Signatur also nicht selbst berechnen. verifyH5Auth existiert, damit der Webserver des Händlers einen Start ohne jedes Gateway-Credential prüfen kann.",
  fr: "Seule la passerelle détient le secret de l’abonné, donc le JavaScript de la page ne peut pas calculer la signature lui-même. verifyH5Auth existe pour que le serveur web du marchand vérifie un lancement sans aucun identifiant de passerelle.",
  it: "Solo il gateway conosce il segreto del follower, quindi il JavaScript della pagina non può calcolare la firma da sé. verifyH5Auth esiste per permettere al web server del commerciante di verificare un avvio senza alcuna credenziale del gateway.",
  nl: "Alleen de gateway kent het volgergeheim, dus de JavaScript van de pagina kan de handtekening zelf niet berekenen. verifyH5Auth bestaat zodat de webserver van de handelaar een start kan controleren zonder enige gateway-aanmeldgegevens.",
  cs: "Jen brána zná secret odběratele, takže JavaScript stránky podpis sám vypočítat nedokáže. verifyH5Auth existuje proto, aby vlastní web server obchodníka ověřil spuštění bez jakéhokoli přihlašovacího údaje k bráně.",
  "zh-Hans": "只有网关持有该关注者的密钥，页面的 JavaScript 自己算不出签名。verifyH5Auth 的存在，就是让商家自己的 Web 服务器不需要任何网关凭据也能校验一次启动。",
  "zh-Hant": "只有閘道持有該關注者的密鑰，頁面裡的 JavaScript 自己算不出簽名。verifyH5Auth 的存在，就是讓商家自己的 Web 伺服器不需要任何閘道憑證也能驗證一次啟動。",
  es: "Solo la pasarela conoce el secreto del seguidor, así que el JavaScript de la página no puede calcular la firma por su cuenta. verifyH5Auth existe para que el servidor web del comercio verifique una apertura sin ninguna credencial de la pasarela.",
  pl: "Tylko brama zna sekret obserwującego, więc JavaScript strony sam nie jest w stanie obliczyć podpisu. verifyH5Auth istnieje po to, aby własny serwer www sprzedawcy mógł sprawdzić uruchomienie bez żadnych poświadczeń bramy.",
  ja: "フォロワーごとのシークレットを握っているのはゲートウェイだけなので、ページの JavaScript 自体は署名を計算できません。verifyH5Auth は、店舗自身の Web サーバーがゲートウェイの資格情報を一切持たずに起動を検証できるよう作られたエンドポイントです。",
  th: "มีเฉพาะเกตเวย์เท่านั้นที่รู้ซีเร็ทของผู้ติดตาม JavaScript ของหน้าเว็บจึงคำนวณลายเซ็นเองไม่ได้ verifyH5Auth ถูกสร้างมาเพื่อให้เว็บเซิร์ฟเวอร์ของร้านค้าตรวจสอบการเปิดหน้าได้โดยไม่ต้องมีข้อมูลประจำตัวของเกตเวย์",
  fi: "Vain gateway tuntee seuraajan salaisuuden, joten sivun JavaScript ei voi laskea allekirjoitusta itsekseen. verifyH5Auth on olemassa, jotta kauppiaan oma web-palvelin voi tarkistaa käynnistyksen ilman gateway-tunnisteita.",
  uk: "Лише шлюз знає секрет підписника, тому JS на сторінці не може сам обчислити підпис. verifyH5Auth існує для того, щоб вебсервер мерчанта перевіряв запуск, не маючи жодних облікових даних шлюза.",
  bg: "Само гейтуейтът знае секрета на последователя, затова JavaScript на страницата не може сам да изчисли подписа. verifyH5Auth съществува, за да може уеб сървърът на търговеца да провери стартиране без никакви данни за гейтуейта.",
  tr: "Takipçinin sırrını yalnızca ağ geçidi bilir, dolayısıyla sayfanın JavaScript'i imzayı kendi başına hesaplayamaz. verifyH5Auth, tüccarın kendi web sunucusunun herhangi bir ağ geçidi bilgisi gerektirmeden bir açmayı doğrulayabilmesi için var.",
  hu: "Csak az átjáró ismeri a követő titkát, ezért az oldal JavaScript-e maga nem tudja kiszámolni az aláírást. A verifyH5Auth azért létezik, hogy a kereskedő saját webszervere bármilyen átjáró-hitelesítő nélkül ellenőrizzen egy indítást.",
};

const C6_SKEW_NOTE: Localized<string> = {
  en: "The window is checked in both directions: a clock 20 minutes ahead would otherwise mint a signature that stays valid twice as long.",
  ru: "Окно проверяется в обе стороны: часы, спешащие на 20 минут, иначе выдали бы подпись, живущую вдвое дольше.",
  de: "Das Fenster wird in beide Richtungen geprüft: eine um 20 Minuten vorgestellte Uhr würde sonst eine Signatur prägen, die doppelt so lange gültig bleibt.",
  fr: "La fenêtre est contrôlée dans les deux sens : une horloge en avance de 20 minutes engendrerait sinon une signature valable deux fois plus longtemps.",
  it: "La finestra è controllata in entrambe le direzioni: un orologio in anticipo di 20 minuti conierebbe altrimenti una firma che resta valida il doppio a lungo.",
  nl: "Het venster wordt in beide richtingen gecontroleerd: een klok die 20 minuten voorloopt, zou anders een handtekening munten die dubbel zo lang geldig blijft.",
  cs: "Okno se kontroluje oběma směry: hodiny ukvapené o 20 minut by jinak vyrobily podpis platný dvakrát déle.",
  "zh-Hans": "这个窗口两个方向都要检查：时钟快 20 分钟的设备，否则会铸出一个有效期翻倍的签名。",
  "zh-Hant": "這個視窗兩個方向都要檢查：時鐘快 20 分鐘的裝置，否則會鑄出一個效期翻倍的簽名。",
  es: "La ventana se comprueba en ambas direcciones: un reloj adelantado 20 minutos fabricaría si no una firma válida el doble de tiempo.",
  pl: "Okno jest sprawdzane w obu kierunkach: zegar wskazany o 20 minut do przodu wyprodukowałby inaczej podpis ważny dwa razy dłużej.",
  ja: "許容窓は両方向でチェックします。時計が 20 分進んでいる端末だと、署名が 2 倍長く有効なままになってしまうからです。",
  th: "หน้าต่างนี้ตรวจทั้งสองทิศทาง: นาฬิกาที่เดินเร็วไป 20 นาทีจะทำให้ลายเซ็นมีอายุยาวเป็นสองเท่าถ้าไม่ตรวจกลับทาง",
  fi: "Aikaa tarkistetaan molempiin suuntiin: 20 minuuttia edellä oleva kello tuottaisi muuten allekirjoituksen, joka pysyisi voimassa kaksi kertaa niin kauan.",
  uk: "Вікно перевіряється в обидва боки: годинник, що спішить на 20 хвилин, інакше видав би підпис, чинний удвічі довше.",
  bg: "Прозорецът се проверява в двете посоки: часовник, подравнен на 20 минути напред, иначе би отпечатал подпис, валид два пъти по-дълго.",
  tr: "Pencere iki yönde de kontrol edilir: 20 dakika ileri ayarlı bir saat, aksi halde iki kat uzun süre geçerli kalan bir imza üretirdi.",
  hu: "Az ablakot mindkét irányban ellenőrizzük: egy 20 perccel előre járó óra olyan aláírást adna, amely kétszer olyan sokáig marad érvényes.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 9. Shared note captions and the closing hand-off
 * ───────────────────────────────────────────────────────────────────────── */

const CAP_RULE: Localized<string> = {
  en: "Rule",
  ru: "Правило",
  de: "Regel",
  fr: "Règle",
  it: "Regola",
  nl: "Regel",
  cs: "Pravidlo",
  "zh-Hans": "规则",
  "zh-Hant": "規則",
  es: "Regla",
  pl: "Zasada",
  ja: "規則",
  th: "กติกา",
  fi: "Sääntö",
  uk: "Правило",
  bg: "Правило",
  tr: "Kural",
  hu: "Szabály",
};

const CAP_QUIRK: Localized<string> = {
  en: "Client behaviour",
  ru: "Поведение клиента",
  de: "Client-Verhalten",
  fr: "Comportement du client",
  it: "Comportamento del client",
  nl: "Gedrag van de client",
  cs: "Chování klienta",
  "zh-Hans": "客户端行为",
  "zh-Hant": "用戶端行為",
  es: "Comportamiento del cliente",
  pl: "Zachowanie klienta",
  ja: "クライアント側の挙動",
  th: "พฤติกรรมของไคลเอนต์",
  fi: "Clientin käyttäytyminen",
  uk: "Поведінка клієнта",
  bg: "Поведение на клиента",
  tr: "İstemci davranışı",
  hu: "Ügyfél viselkedése",
};

const CAP_TRAP: Localized<string> = {
  en: "The trap",
  ru: "Ловушка",
  de: "Die Falle",
  fr: "Le piège",
  it: "La trappola",
  nl: "De val",
  cs: "Ta past",
  "zh-Hans": "这个坑",
  "zh-Hant": "這個坑",
  es: "La trampa",
  pl: "Pułapka",
  ja: "落とし穴",
  th: "กับดัก",
  fi: "Ansa",
  uk: "Пастка",
  bg: "Капанът",
  tr: "Tuzak",
  hu: "A csapda",
};

const CAP_DESIGN: Localized<string> = {
  en: "Why the route exists",
  ru: "Зачем этот маршрут",
  de: "Warum es die Route gibt",
  fr: "Pourquoi cette route existe",
  it: "Perché esiste questa route",
  nl: "Waarom deze route bestaat",
  cs: "Proč ta route existuje",
  "zh-Hans": "这个接口为何存在",
  "zh-Hant": "這個介面為何存在",
  es: "Por qué existe esta ruta",
  pl: "Dlaczego ta trasa istnieje",
  ja: "このルートが存在する理由",
  th: "ทำไมต้องมี路由นี้",
  fi: "Miksi reitti on olemassa",
  uk: "Навіщо цей маршрут",
  bg: "Защо съществува този път",
  tr: "Bu uç nokta neden var",
  hu: "Miért létezik ez a végpont",
};

const C3_SPINE_CAP: Localized<string> = {
  en: "Read it literally",
  ru: "Читайте буквально",
  de: "Wörtlich lesen",
  fr: "À lire au sens propre",
  it: "Da leggere alla lettera",
  nl: "Letterlijk lezen",
  cs: "Brát doslova",
  "zh-Hans": "请照字面理解",
  "zh-Hant": "請照字面理解",
  es: "Léelo literalmente",
  pl: "Czytaj to dosłownie",
  ja: "そのまま受け取ってください",
  th: "อ่านตามตัวอักษร",
  fi: "Lue sananmukaisesti",
  uk: "Читайте буквально",
  bg: "Четете го буквално",
  tr: "Sözünü tam anlamıyla okuyun",
  hu: "Szó szerint olvasandó",
};

const STYLE_GROUP: Localized<string> = {
  en: "Preview style",
  ru: "Стиль предпросмотра",
  de: "Vorschau-Stil",
  fr: "Style d’aperçu",
  it: "Stile di anteprima",
  nl: "Voorbeeldstijl",
  cs: "Styl náhledu",
  "zh-Hans": "预览样式",
  "zh-Hant": "預覽樣式",
  es: "Estilo de vista previa",
  pl: "Styl podglądu",
  ja: "プレビューのスタイル",
  th: "สไตล์ตัวอย่าง",
  fi: "Esikatselun tyyli",
  uk: "Стиль попереднього перегляду",
  bg: "Стил на прегледа",
  tr: "Önizleme stili",
  hu: "Előnézeti stílus",
};

const CLOSE_TITLE: Localized<string> = {
  en: "Exact bytes are elsewhere, on purpose",
  ru: "Точные байты живут в другом месте — и это намеренно",
  de: "Die exakten Bytes stehen absichtlich woanders",
  fr: "Les octets exacts sont ailleurs, volontairement",
  it: "I byte esatti stanno altrove, di proposito",
  nl: "De exacte bytes staan elders, met opzet",
  cs: "Přesné bajty jsou záměrně jinde",
  "zh-Hans": "精确字节故意放在别处",
  "zh-Hant": "精確位元組故意放在別處",
  es: "Los bytes exactos están en otro lado, a propósito",
  pl: "Dokładne bajty znajdują się gdzie indziej — celowo",
  ja: "正確なバイト列は意図的に別の場所にあります",
  th: "ไบต์ที่แม่นยำจงใจไว้ที่อื่น",
  fi: "Tarkat tavut ovat tarkoituksella muualla",
  uk: "Точні байти навмисне живуть в іншому місці",
  bg: "Точните байтове са на друго място — умишлено",
  tr: "Birebir baytlar başka yerde, bu bilinçli bir tercih",
  hu: "A pontos bájtok szándékosan máshol találhatók",
};

const CLOSE_DIR: Localized<string> = {
  en: "Byte-exact envelope JSON, the ku, sc, mc and sh wire frames, and both HMAC samples",
  ru: "Побайтовый JSON конверта, кадры ku, sc, mc и sh, и оба примера HMAC",
  de: "Byte-exaktes Umschlag-JSON, die ku-, sc-, mc- und sh-Rahmen und beide HMAC-Beispiele",
  fr: "Le JSON d’enveloppe octet pour octet, les trames ku, sc, mc et sh, et les deux exemples HMAC",
  it: "Il JSON della busta byte per byte, i frame ku, sc, mc e sh, ed entrambi gli esempi HMAC",
  nl: "Byte-exacte omslag-JSON, de ku-, sc-, mc- en sh-frames en beide HMAC-voorbeelden",
  cs: "Přesný bajt od bajtu JSON obálky, snímky ku, sc, mc a sh a oba vzorky HMAC",
  "zh-Hans": "逐字节的信封 JSON、ku、sc、mc、sh 线上帧，以及两份 HMAC 示例",
  "zh-Hant": "逐位元組的信封 JSON、ku、sc、mc、sh 線上影格，以及兩份 HMAC 範例",
  es: "El JSON del sobre byte a byte, las tramas ku, sc, mc y sh, y ambos ejemplos de HMAC",
  pl: "Dokładny bajt w bajcie JSON koperty, ramki ku, sc, mc i sh oraz oba przykłady HMAC",
  ja: "バイト一致のエンベロープ JSON、ku / sc / mc / sh のワイヤフレーム、2 種類の HMAC サンプル",
  th: "JSON ซองตรงทุกไบต์ เฟรม ku, sc, mc และ sh รวมถึงตัวอย่าง HMAC ทั้งสองชุด",
  fi: "Tavun tarkka kirjekuorin JSON, ku-, sc-, mc- ja sh-kehykset sekä molemmat HMAC-esimerkit",
  uk: "Побайтовий JSON конверта, кадри ku, sc, mc і sh, та обидва приклади HMAC",
  bg: "Байт по байт JSON на обвивката, кадрите ku, sc, mc и sh и двата примера с HMAC",
  tr: "Baytı baytına zarf JSON'u, ku, sc, mc ve sh kareleri ile iki HMAC örneği",
  hu: "A boríték bájt pontosságú JSON-ja, a ku, sc, mc és sh keretek, mindkét HMAC példa",
};

const CLOSE_SANDBOX: Localized<string> = {
  en: "The same envelope, sealed and decoded interactively against a gateway you drive yourself",
  ru: "Тот же конверт, запечатанный и раскрытый в интерактивной песочнице с вашим собственным шлюзом",
  de: "Derselbe Umschlag, interaktiv versiegelt und entschlüsselt gegen ein Gateway, das du selbst bedienst",
  fr: "La même enveloppe, scellée et décodée en interactif contre une passerelle que vous pilotez vous-même",
  it: "La stessa busta, sigillata e decodificata in modo interattivo contro un gateway che gestisci tu",
  nl: "Dezelfde omslag, interactief verzegeld en gedecodeerd tegen een gateway die je zelf bedient",
  cs: "Stejná obálka, interaktivně zapečetěná a rozkodovaná proti bráně, kterou řídíte sami",
  "zh-Hans": "同一个信封，在你自己操作的网关上交互式地封装与解码",
  "zh-Hant": "同一個信封，在你自己操作的閘道上互動式地封裝與解碼",
  es: "El mismo sobre, sellado y decodificado de forma interactiva contra una pasarela que usted mismo maneja",
  pl: "Ta sama koperta, interaktywnie zakrywana i dekodowana przy bramie, którą sterujesz samodzielnie",
  ja: "同じエンベロープを、ご自身が操作するゲートウェイに対して対話的に封印・復号できます",
  th: "ซองเดียวกันนี้ ถูกซีลและถอดรหัสแบบอินเทอร์แอกทีฟกับเกตเวย์ที่คุณควบคุมเอง",
  fi: "Sama kirjekuori, sinetöity ja purettu interaktiivisesti gatewayta vasten, jota hallitset itse",
  uk: "Той самий конверт, запечатаний і розкодований в інтерактивній пісочниці з вашим власним шлюзом",
  bg: "Същата обвивка, запечатана и разчетена интерактивно срещу гейтуейт, който управлявате сами",
  tr: "Aynı zarf, bizzat kullandığınız bir ağ geçidine karşı etkileşimli olarak mühürlenip çözümleniyor",
  hu: "Ugyanaz a boríték, interaktívan lezárva és dekódolva egy általad kezelt átjáró ellen",
};

const ASCII_CAPTION: Localized<string> = {
  en: "AAD and signature preimage, in byte order",
  ru: "AAD и прообраз подписи, в порядке байтов",
  de: "AAD und Signatur-Preimage, in Byte-Reihenfolge",
  fr: "AAD et préimage de signature, dans l’ordre des octets",
  it: "AAD e preimage della firma, in ordine di byte",
  nl: "AAD en handtekening-preimage, in bytevolgorde",
  cs: "AAD a preimage podpisu, v pořadí bajtů",
  "zh-Hans": "AAD 与签名原文，按字节顺序",
  "zh-Hant": "AAD 與簽名原文，依位元組順序",
  es: "AAD y preimagen de la firma, en orden de bytes",
  pl: "AAD i preimage podpisu, w kolejności bajtów",
  ja: "AAD と署名プレイイメージをバイト順に並べたもの",
  th: "AAD และพรีอิมเมจของลายเซ็น เรียงตามลำดับไบต์",
  fi: "AAD ja allekirjoituksen esikuva tavujärjestyksessä",
  uk: "AAD і прообраз підпису, у порядку байтів",
  bg: "AAD и предобраз на подписа, в байтов ред",
  tr: "AAD ve imza öncül görüntüsü, bayt sırasıyla",
  hu: "AAD és az aláírás preimage-je, bájtsorrendben",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 10. Data model
 * ───────────────────────────────────────────────────────────────────────── */

const CAP_FOR_OPERATOR: Localized<string> = {
  en: "For the operator",
  ru: "Для оператора",
  de: "Für den Betreiber",
  fr: "Pour l’opérateur",
  it: "Per l'operatore",
  nl: "Voor de operator",
  cs: "Pro provozujícího",
  "zh-Hans": "给运维的话",
  "zh-Hant": "給維運的話",
  es: "Para el operador",
  pl: "Dla operatora",
  ja: "運用者へ",
  th: "สำหรับผู้ดูแลระบบ",
  fi: "Käyttäjän ylläpitäjälle",
  uk: "Для оператора",
  bg: "За оператора",
  tr: "Operatör için",
  hu: "Az üzemeltetőnek",
};

type Row = {
  readonly code: string;
  readonly k: Localized<string>;
  readonly v: string | Localized<string>;
};

type Note = {
  readonly code: string;
  readonly cap: Localized<string>;
  readonly body: Localized<string>;
  readonly tone?: "warn";
};

type CardModel = {
  readonly code: string;
  readonly number: string;
  readonly accent: "brand" | "mesh" | "warn";
  readonly title: Localized<string>;
  readonly lede: Localized<string> | null;
  readonly rows: readonly Row[];
  readonly bullets: readonly Localized<string>[];
  readonly chipsCap: Localized<string> | null;
  readonly chips: readonly string[];
  readonly notes: readonly Note[];
  readonly cite: string;
  readonly wide: boolean;
};

const ENVELOPE_CARD: CardModel = {
  code: "envelope",
  number: "01",
  accent: "brand",
  wide: false,
  title: C1_TITLE,
  lede: C1_LEDE,
  cite: "crypto_service.py:95-101 · :88-89 · :67 · :1001-1024 · :1027-1050 · :1143-1156",
  rows: [
    { code: "protocol", k: C1_R_PROTOCOL, v: V_PROTOCOL },
    { code: "identity", k: C1_R_IDENTITY, v: V_IDENTITY },
    { code: "seal", k: C1_R_SEAL, v: V_SEAL },
    { code: "epoch", k: C1_R_EPOCHKEY, v: V_EPOCH_KEY },
    { code: "aad", k: C1_R_AAD, v: V_AAD },
    { code: "separator", k: C1_R_SEP, v: V_SEP },
    { code: "order", k: C1_R_ORDER, v: C1_ORDER_VAL },
    { code: "limits", k: C1_R_LIMITS, v: V_CAPS },
  ],
  bullets: [],
  chipsCap: null,
  chips: [],
  notes: [{ code: "aad-note", cap: CAP_RULE, body: C1_NOTE }],
};

const ROTATION_CARD: CardModel = {
  code: "rotation",
  number: "02",
  accent: "brand",
  wide: false,
  title: C2_TITLE,
  lede: null,
  cite: "crypto_service.py:1166 · :1077 · main.py:1679 · config.py:420-423",
  rows: [{ code: "fee", k: CAP_FEE, v: V_ROTATE_METER }],
  bullets: [C2_B1, C2_B2, C2_B3, C2_FEE_NOTE],
  chipsCap: null,
  chips: [],
  notes: [],
};

const CUSTODY_CARD: CardModel = {
  code: "custody",
  number: "03",
  accent: "warn",
  wide: true,
  title: C3_TITLE,
  lede: C3_LEDE,
  cite: "database.py:183-188 · :193-194 · :208 · crypto_service.py:1159-1163",
  rows: [],
  bullets: [C3_NOTE],
  chipsCap: C3_COLS,
  chips: COL_CUSTODY,
  notes: [
    { code: "spine", cap: C3_SPINE_CAP, body: C3_SPINE, tone: "warn" },
    { code: "operator", cap: CAP_FOR_OPERATOR, body: C3_MITIGATION },
  ],
};

const MENU_CARD: CardModel = {
  code: "menu",
  number: "04",
  accent: "brand",
  wide: false,
  title: C4_TITLE,
  lede: C4_LEDE,
  cite: "crypto_service.py:77-79 · :361 · :378 · :364-368 · :569-582 · :630-644",
  rows: [
    { code: "items", k: C4_R_ITEMS, v: V_MENU_ITEMS },
    { code: "subitems", k: C4_R_SUBS, v: V_MENU_SUBS },
    { code: "title", k: C4_R_TITLE, v: V_MENU_TITLE },
    { code: "kinds", k: C4_R_KINDS, v: V_MENU_KINDS },
    { code: "actions", k: C4_R_ACTIONS, v: V_MENU_ACTIONS },
    { code: "sub", k: C4_R_WIRE, v: V_MENU_WIRE },
    { code: "error", k: C4_R_ERR, v: V_MENU_ERR },
  ],
  bullets: [],
  chipsCap: null,
  chips: [],
  notes: [
    { code: "reject", cap: CAP_RULE, body: C4_REJECT },
    { code: "depth", cap: CAP_RULE, body: C4_DEPTH },
    { code: "quirk", cap: CAP_QUIRK, body: C4_QUIRK },
  ],
};

const H5_CARD: CardModel = {
  code: "h5",
  number: "06",
  accent: "brand",
  wide: true,
  title: C6_TITLE,
  lede: C6_LEDE,
  cite: "crypto_service.py:869-876 · :929-947 · :104-107 · main.py:3664",
  rows: [
    { code: "alg", k: C6_R_ALG, v: V_H5_ALG },
    { code: "preimage", k: C6_R_PRE, v: V_H5_PRE },
    { code: "key", k: C6_R_KEY, v: C6_KEY_VAL },
    { code: "siglen", k: C6_R_SIG, v: V_H5_SIG },
    { code: "skew", k: C6_R_SKEW, v: V_H5_SKEW },
    { code: "query", k: C6_R_QUERY, v: V_H5_QUERY },
    { code: "verify", k: C6_R_VERIFY, v: V_H5_VERIFY },
  ],
  bullets: [C6_SKEW_NOTE],
  chipsCap: null,
  chips: [],
  notes: [
    { code: "trap", cap: CAP_TRAP, body: C6_ASYM, tone: "warn" },
    { code: "no-secret", cap: CAP_DESIGN, body: C6_NOSECRET },
  ],
};

const ACCENT_BAR: Record<CardModel["accent"], string> = {
  brand: "bg-brand-soft",
  mesh: "bg-mesh-soft",
  warn: "bg-warn",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 11. Presentation
 * ───────────────────────────────────────────────────────────────────────── */

function BulletMark(): ReactElement {
  return (
    <svg aria-hidden viewBox="0 0 8 8" className="mt-[6px] h-1.5 w-1.5 shrink-0">
      <rect width="8" height="8" transform="rotate(45 4 4)" className="fill-mesh-soft/70" />
    </svg>
  );
}

function WarnMark(): ReactElement {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-warn">
      <path
        d="M8 2.4 13.2 4v4.1c0 3-2.3 4.8-5.2 5.6-2.9-.8-5.2-2.6-5.2-5.6V4L8 2.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowMark(): ReactElement {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0">
      <path
        d="M3 8h9M9 5l3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardHeader({ card }: { card: CardModel }): ReactElement {
  const title = useCopy(card.title);
  const lede = useCopy(card.lede ?? card.title);
  return (
    <header className="min-w-0">
      <p className="font-mono text-[11px] tracking-[0.18em] text-faint">
        {card.number} / {card.code}
      </p>
      <h3 className="mt-1.5 text-[16.5px] font-semibold leading-snug text-white">{title}</h3>
      {card.lede ? <p className="mt-2 text-[13px] leading-relaxed text-mute">{lede}</p> : null}
    </header>
  );
}

function RowList({ rows }: { rows: readonly Row[] }): ReactElement {
  const { locale } = useLocale();
  return (
    <dl className="mt-4 space-y-2.5">
      {rows.map((row) => (
        <div
          key={row.code}
          className="grid grid-cols-1 gap-1 sm:grid-cols-[124px_minmax(0,1fr)] sm:gap-3"
        >
          <dt className="text-[11.5px] font-medium leading-relaxed text-faint">{pick(row.k, locale)}</dt>
          <dd className="min-w-0 text-[12.5px] leading-relaxed text-mute">
            {typeof row.v === "string" ? (
              <code className="block overflow-x-auto whitespace-pre font-mono text-[11.5px] text-mesh-soft">
                {row.v}
              </code>
            ) : (
              <span>{pick(row.v, locale)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BulletList({ items }: { items: readonly Localized<string>[] }): ReactElement {
  const { locale } = useLocale();
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item, index) => (
        <li key={`b${index}`} className="flex gap-2.5 break-words text-[13px] leading-relaxed text-mute">
          <BulletMark />
          <span className="min-w-0">{pick(item, locale)}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipRow({ cap, items }: { cap: Localized<string>; items: readonly string[] }): ReactElement {
  const label = useCopy(cap);
  return (
    <div className="mt-4">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <code key={item} className="chip font-mono text-[10.5px] text-warn">
            {item}
          </code>
        ))}
      </div>
    </div>
  );
}

function NoteBlock({ note }: { note: Note }): ReactElement {
  const cap = useCopy(note.cap);
  const body = useCopy(note.body);
  if (note.tone === "warn") {
    return (
      <div className="mt-3 flex items-start gap-3 border border-warn/35 bg-warn/[0.06] p-3.5">
        <WarnMark />
        <div className="min-w-0">
          <p className="eyebrow text-warn">{cap}</p>
          <p className="mt-1.5 break-words text-[12.5px] leading-relaxed text-warn/90">{body}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="glass-inset mt-3 p-3.5">
      <p className="eyebrow">{cap}</p>
      <p className="mt-1.5 break-words text-[12.5px] leading-relaxed text-mute">{body}</p>
    </div>
  );
}

function CiteFooter({ cite }: { cite: string }): ReactElement {
  const label = useCopy(CAP_VERIFIED);
  return (
    <div className="hairline-top mt-auto flex flex-wrap items-start gap-x-2 gap-y-1 pt-3 text-[11px] text-faint">
      <span className="shrink-0">{label}</span>
      <code className="min-w-0 break-all font-mono text-[10.5px]">{cite}</code>
    </div>
  );
}

function SpecCardView({ card }: { card: CardModel }): ReactElement {
  const shell = card.wide ? "xl:col-span-2" : "";
  const inner = card.wide ? "lg:grid lg:grid-cols-2 lg:gap-6" : "";
  return (
    <article
      className={`glass glass-hover relative flex flex-col overflow-hidden p-5 sm:p-6 ${shell}`}
    >
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-px ${ACCENT_BAR[card.accent]} opacity-60`}
      />
      <CardHeader card={card} />
      <div className={`mt-1 min-w-0 flex-1 ${inner}`}>
        <div className="min-w-0">
          {card.rows.length > 0 ? <RowList rows={card.rows} /> : null}
          {card.chipsCap !== null && card.chips.length > 0 ? (
            <ChipRow cap={card.chipsCap} items={card.chips} />
          ) : null}
        </div>
        <div className="min-w-0">
          {card.bullets.length > 0 ? <BulletList items={card.bullets} /> : null}
          {card.notes.map((note) => (
            <NoteBlock key={note.code} note={note} />
          ))}
        </div>
      </div>
      <div className="mt-5">
        <CiteFooter cite={card.cite} />
      </div>
    </article>
  );
}

function CardStyleCard(): ReactElement {
  const { locale } = useLocale();
  const [code, setCode] = useState<string>("standard");
  const group = useCopy(STYLE_GROUP);
  const same = useCopy(C5_HINT);
  const options: readonly { code: string; use: Localized<string> }[] = [
    { code: "standard", use: C5_USE_STANDARD },
    { code: "receipt", use: C5_USE_RECEIPT },
    { code: "security", use: C5_USE_SECURITY },
  ];
  const active = options.find((item) => item.code === code) ?? options[0];

  return (
    <article className="glass glass-hover relative flex flex-col overflow-hidden p-5 sm:p-6">
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-mesh-soft opacity-60" />
      <CardHeader card={STYLES_CARD_HEAD} />
      <div className="mt-1 min-w-0 flex-1">
        <RowList rows={STYLES_ROWS} />
        <div className="mt-4">
          <p className="eyebrow">{group}</p>
          <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label={group}>
            {CARD_CODES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCode(item)}
                aria-pressed={item === code}
                className={`chip text-[11px] transition-colors ${FOCUS} ${
                  item === code
                    ? "border-brand-soft/60 bg-brand-soft/10 text-brand-soft"
                    : "text-faint hover:border-brand/50 hover:text-brand-soft"
                }`}
              >
                <code className="font-mono">{item}</code>
              </button>
            ))}
          </div>
          <p className="mt-2.5 break-words text-[12.5px] leading-relaxed text-mesh-soft">
            {pick(active.use, locale)}
          </p>
          <p className="mt-2 break-words text-[12px] leading-relaxed text-faint">{same}</p>
        </div>
      </div>
      <div className="mt-5">
        <CiteFooter cite={STYLES_CITE} />
      </div>
    </article>
  );
}

const STYLES_CITE =
  "crypto_service.py:362 · :359-360 · :653-716 · :66-76 · database.py:139";

/** The head and rows of card 5 live outside the CardModel list: it owns a toggle. */
const STYLES_CARD_HEAD: CardModel = {
  code: "styles",
  number: "05",
  accent: "mesh",
  wide: false,
  title: C5_TITLE,
  lede: C5_LEDE,
  rows: [],
  bullets: [],
  chipsCap: null,
  chips: [],
  notes: [],
  cite: STYLES_CITE,
};

const STYLES_ROWS: readonly Row[] = [
  { code: "required", k: C5_R_REQ, v: V_CARD_REQ },
  { code: "optional", k: C5_R_OPT, v: V_CARD_OPT },
  { code: "limits", k: C1_R_LIMITS, v: V_CARD_CAPS },
  { code: "actionkinds", k: C5_R_ACTKINDS, v: V_CARD_ACTKINDS },
  { code: "actionstyles", k: C5_R_ACTSTYLES, v: V_CARD_ACTSTYLES },
];

const SPEC_CARDS: readonly CardModel[] = [ENVELOPE_CARD, ROTATION_CARD, CUSTODY_CARD, MENU_CARD];

export function ProtocolReferenceSection(): ReactElement {
  const dirLabel = useCopy(CLOSE_DIR);
  const sandboxLabel = useCopy(CLOSE_SANDBOX);
  const closeTitle = useCopy(CLOSE_TITLE);
  const pillCited = useCopy(PILL_CITED);
  const pillSpine = useCopy(PILL_SPINE);
  const asciiCaption = useCopy(ASCII_CAPTION);

  return (
    <section id="protocol" className="relative py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-[0.05]" />
      <div className="section-wrap relative">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="pill">{pillCited}</span>
          <span className="pill">
            <StatusDot tone="warn" pulse />
            {pillSpine}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {SPEC_CARDS.map((card) => (
            <SpecCardView key={card.code} card={card} />
          ))}
          <CardStyleCard />
          <SpecCardView key="h5" card={H5_CARD} />
        </div>

        <div className="glass mt-4 grid grid-cols-1 gap-5 p-5 sm:p-6 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-white">{closeTitle}</h3>
            <ul className="mt-3 space-y-2.5">
              <li className="flex gap-2.5">
                <a
                  href="#directory"
                  className={`flex min-w-0 items-start gap-2 break-words text-[13px] leading-relaxed text-brand-soft underline-offset-4 hover:underline ${FOCUS}`}
                >
                  <ArrowMark />
                  <span>#directory - {dirLabel}</span>
                </a>
              </li>
              <li className="flex gap-2.5">
                <a
                  href="#sandbox"
                  className={`flex min-w-0 items-start gap-2 break-words text-[13px] leading-relaxed text-mesh-soft underline-offset-4 hover:underline ${FOCUS}`}
                >
                  <ArrowMark />
                  <span>#sandbox - {sandboxLabel}</span>
                </a>
              </li>
            </ul>
          </div>
          <CodeBlock code={AAD_ASCII} caption={asciiCaption} showCopy={false} maxHeightClass="max-h-72" />
        </div>
      </div>
    </section>
  );
}
