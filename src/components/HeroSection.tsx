"use client";

import type { ReactElement } from "react";
import { StatusDot } from "@/components/ui";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";

/**
 * First screen: the dual-mode topology.
 *
 * The left half is the broadcast path (encrypted channels a relay can only ever
 * blind-store), the right half is the point-to-point path (per-follower E2EE
 * queues on a merchant's own federated service account), and both fans meet in
 * the middle on the merchant's own server. The only image on this page is the
 * same-origin POPOPX wordmark, because nothing here may draw a brand mark.
 *
 * Motion is deliberately cheap: the streams are the house `.flow-line` (a 1px
 * track whose `::after` carries `animate-flow-x`), the converging curves are one
 * inline SVG with a non-scaling stroke, and `prefers-reduced-motion` already
 * switches every animation off in `globals.css`. No canvas, no
 * requestAnimationFrame, no third-party script.
 *
 * Copy.
 *
 * Every string below is a literal `Localized<string>` map listing all 21 tags
 * `src/lib/i18n.tsx` declares — the same set the iOS client ships. Because the
 * type is a total record, the compiler is the completeness oracle: drop one
 * language and this file stops building. Nothing derives a slot from another
 * language. Inside the component the maps are bound once with `useCopy`; the
 * metric captions are read in a `.map()`, where a hook may not run, so those go
 * through `pick(caption, locale)` instead.
 */

const BRAND_LINES: readonly string[] = [
  "flow-line flow-brand left-0 top-[26%] w-[50%] origin-left rotate-[6deg] opacity-40",
  "flow-line flow-brand left-0 top-[34%] w-[50%] origin-left rotate-[4deg] [&::after]:[animation-delay:-1.2s]",
  "flow-line flow-brand left-0 top-[42%] w-[50%] origin-left rotate-[2deg] opacity-60 [&::after]:[animation-delay:-2.4s]",
  "flow-line flow-brand left-0 top-[50%] w-[50%] origin-left",
  "flow-line flow-brand left-0 top-[58%] w-[50%] origin-left rotate-[-2deg] opacity-60 [&::after]:[animation-delay:-3.6s]",
  "flow-line flow-brand left-0 top-[66%] w-[50%] origin-left rotate-[-4deg] [&::after]:[animation-delay:-4.8s]",
  "flow-line flow-brand left-0 top-[74%] w-[50%] origin-left rotate-[-6deg] opacity-40 [&::after]:[animation-delay:-5.4s]",
];

/**
 * The right half is mirrored twice over: geometry (`origin-right` and the
 * opposite sign) and direction — a streak there has to travel towards the
 * centre, so its `::after` runs the same keyframes in reverse.
 */
const MESH_LINES: readonly string[] = [
  "flow-line flow-mesh right-0 top-[26%] w-[50%] origin-right rotate-[-6deg] opacity-40 [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[34%] w-[50%] origin-right rotate-[-4deg] [&::after]:[animation-delay:-1.6s] [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[42%] w-[50%] origin-right rotate-[-2deg] opacity-60 [&::after]:[animation-delay:-2.8s] [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[50%] w-[50%] origin-right [&::after]:[animation-delay:-0.8s] [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[58%] w-[50%] origin-right rotate-[2deg] opacity-60 [&::after]:[animation-delay:-3.2s] [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[66%] w-[50%] origin-right rotate-[4deg] [&::after]:[animation-delay:-4.4s] [&::after]:[animation-direction:reverse]",
  "flow-line flow-mesh right-0 top-[74%] w-[50%] origin-right rotate-[6deg] opacity-40 [&::after]:[animation-delay:-5.2s] [&::after]:[animation-direction:reverse]",
];

const EYEBROW: Localized<string> = {
  en: "POPOPX Service Suite · the connection control plane",
  ru: "POPOPX Service Suite · панель управления подключениями",
  de: "POPOPX Service Suite · die Steuerungsebene für Verbindungen",
  fr: "POPOPX Service Suite · le plan de contrôle des connexions",
  it: "POPOPX Service Suite · il piano di controllo delle connessioni",
  nl: "POPOPX Service Suite · het controlepaneel voor verbindingen",
  cs: "POPOPX Service Suite · řídicí plocha připojení",
  "zh-Hans": "POPOPX Service Suite · 连接控制面",
  "zh-Hant": "POPOPX Service Suite · 連線控制面",
  es: "POPOPX Service Suite · el plano de control de conexiones",
  pl: "POPOPX Service Suite · panel zarządzania połączeniami",
  ja: "POPOPX Service Suite · 接続の制御プレーン",
  th: "POPOPX Service Suite · แผงควบคุมการเชื่อมต่อ",
  fi: "POPOPX Service Suite · yhteyskontrollitaso",
  uk: "POPOPX Service Suite · панель керування з’єднаннями",
  bg: "POPOPX Service Suite · контролният панел на връзките",
  tr: "POPOPX Service Suite · bağlantı kontrol düzlemi",
  hu: "POPOPX Service Suite · a kapcsolatok vezérlőfelülete",
  "pt-BR": "POPOPX Service Suite · o plano de controle de conexões",
  ko: "POPOPX Service Suite · 연결 제어 평면",
  ar: "POPOPX Service Suite · مستوى التحكم في الاتصال",
};

const HEADLINE: Localized<string> = {
  en: "Connect Services. Extend Every Agent.",
  ru: "Подключайте сервисы — дайте каждому агенту рабочие возможности.",
  de: "Dienste verbinden — damit jeder Agent wirklich nutzbare Fähigkeiten hat.",
  fr: "Connectez les services : chaque Agent gagne des capacités réellement utilisables.",
  it: "Collega i servizi: ogni Agent ottiene capacità effettivamente utilizzabili.",
  nl: "Verbind diensten — elk Agent krijgt bruikbare mogelijkheden.",
  cs: "Napojte služby — každý agent získá skutečně použitelné schopnosti.",
  "zh-Hans": "连接工具与服务，让每个 Agent 都拥有可用能力。",
  "zh-Hant": "連線工具與服務，讓每個 Agent 都具備可用能力。",
  es: "Conecta servicios: cada Agent obtiene capacidades realmente utilizables.",
  pl: "Łącz usługi — każdy agent zyskuje faktycznie użyteczne możliwości.",
  ja: "サービスを接続し、すべてのエージェントに実践できる力を。",
  th: "เชื่อมต่อบริการ เพื่อให้ทุก Agent มีความสามารถที่ใช้ได้จริง",
  fi: "Yhdistä palvelut — jokainen Agent saa oikeasti käyttökelpoiset kyvyt.",
  uk: "Підключайте сервіси — надайте кожному агенту реально придатні можливості.",
  bg: "Свързвайте услуги — всеки Agent получава реално приложими възможности.",
  tr: "Hizmetleri bağlayın — her Agent gerçekten kullanılabilir yetkinlikler kazansın.",
  hu: "Kössen szolgáltatásokat — minden Agent valóban használható képességeket kapjon.",
  "pt-BR": "Conecte serviços. Amplie cada Agent.",
  ko: "서비스를 연결하고, 모든 Agent를 확장하십시오.",
  ar: "اربط الخدمات. وسّع كل Agent.",
};

const SUBHEADLINE: Localized<string> = {
  en: "One control plane behind POPOPX Chat service accounts and AI Agents: a browsable plugin catalog, per-service switches, zero-knowledge channel envelope encryption, CP metering per call and an audit trail — on your own server, and this page ships no third-party script.",
  ru: "Единая панель для сервисных аккаунтов POPOPX Chat и ИИ-агентов: каталог плагинов, отдельные переключатели для каждого сервиса, конвертное шифрование каналов с нулевым разглашением, учёт CP за каждый вызов и журнал действий — на вашем сервере и без сторонних скриптов на этой странице.",
  de: "Eine Steuerungsebene hinter Service-Konten von POPOPX Chat und KI-Agenten: durchstöberbares Erweiterungskatalog, Schalter pro Dienst, envelope-verschlüsselte Zero-Knowledge-Kanäle, CP-Zählung pro Aufruf und Audit-Protokoll — auf dem eigenen Server, und diese Seite lädt kein Drittanbieter-Skript.",
  fr: "Un plan de contrôle unique pour les comptes de service POPOPX Chat et les Agents IA : catalogue d’extensions, interrupteur par service, chiffrement d’enveloppe des canaux à zero knowledge, comptage CP par appel et journal d’audit — sur votre serveur, et cette page n’embarque aucun script tiers.",
  it: "Un unico piano di controllo per gli account di servizio di POPOPX Chat e gli Agent IA: catalogo dei plugin, interruttori per singolo servizio, cifratura envelope dei canali a zero conoscenza, conteggio CP per chiamata e registro di audit — sul tuo server, e questa pagina non carica script di terze parti.",
  nl: "Eén controlepaneel achter de serviceaccounts van POPOPX Chat en AI-Agents: een plugincatalogus, een schakelaar per dienst, envelope-encryptie voor zero-knowledge kanalen, CP-telling per aanroep en een auditlog — op je eigen server, en deze pagina bevat geen script van derden.",
  cs: "Jedna řídicí plocha pro servisní účty POPOPX Chat a agenty AI: katalog doplňků, samostatný přepínač za službu, obálkové šifrování kanálů s nulovou znalostí, měření CP za každé volání a audit log — na vlastním serveru a bez skriptů třetích stran na této stránce.",
  "zh-Hans": "为 POPOPX Chat 服务号与 AI Agent 提供统一的连接控制面：可浏览的插件目录、按服务分开的开关、零知识频道信封加密、每次调用的 CP 计量与调用留痕 —— 全部运行在你自己的服务器上，本页零第三方脚本。",
  "zh-Hant": "為 POPOPX Chat 服務號與 AI Agent 提供統一的連線控制面：可瀏覽的外掛目錄、按服務分開的開關、零知識頻道信封加密、每次呼叫的 CP 計量與呼叫留痕 —— 全部執行在你自己的伺服器上，本頁零第三方腳本。",
  es: "Un único plano de control para las cuentas de servicio de POPOPX Chat y los Agents de IA: catálogo de complementos, interruptor por servicio, cifrado tipo sobre de canales de conocimiento cero, medición CP por llamada y registro de auditoría — en tu propio servidor, y esta página no carga scripts de terceros.",
  pl: "Jeden panel dla kont serwisowych POPOPX Chat i agentów AI: katalog wtyczek, osobny przełącznik dla każdej usługi, szyfrowanie kopertowe kanałów z zerową znajomością, naliczanie CP za każde wywołanie i dziennik audytu — na własnym serwerze, a ta strona nie ładuje skryptów podmiotów trzecich.",
  ja: "POPOPX Chat のサービスアカウントと AI エージェントのための単一の制御プレーン：プラグインカタログ、サービスごとのスイッチ、ゼロ知識チャンネルのエンベロープ暗号、呼び出し単位の CP 計量、監査ログ ——すべて自分のサーバー上で動き、このページはサードパーティースクリプトを読み込みません。",
  th: "แผงควบคุมเดียวเบื้องหลังบัญชีบริการของ POPOPX Chat และ Agent AI: แคตตาล็อกปลั๊กอิน, สวิตช์แยกตามบริการ, การเข้ารหัสแบบซองของช่องแบบ zero-knowledge, นับ CP ต่อการเรียกใช้ และบันทึกตรวจสอบ — รันบนเซิร์ฟเวอร์ของคุณเอง และหน้านี้ไม่สคริปต์ของบุคคลที่สาม",
  fi: "Yksi kontrollitaso POPOPX Chatin palvelutilien ja tekoälyagenttien taalla: laajennusluettelo, erillinen kytkin palvelua kohden, nollatiedon kanavien kuorensalaus, CP-mittaus kutsua kohden ja auditointiloki — omalla palvelimellasi, eikä tämä sivu lataa kolmannen osapuolen skriptiä.",
  uk: "Єдина панель для сервісних акаунтів POPOPX Chat та AI-агентів: каталог плагінів, окремий перемикач для кожного сервісу, конвертне шифрування каналів із нульовим розкриттям, облік CP за кожний виклик та журнал аудиту — на власному сервері, і ця сторінка не тягне сторонніх скриптів.",
  bg: "Един контролен панел за сервизните акаунти на POPOPX Chat и AI агентите: каталог с добавки, отделен превключвател за всяка услуга, обвивково криптиране на каналите с нулево разкриване, CP отчитане на всяко повикване и одиторски дневник — на вашия собствен сървър, и тази страница не зарежда скриптове на трети страни.",
  tr: "POPOPX Chat hizmet hesapları ve Yapay Zekâ Agent’ları için tek kontrol düzlemi: eklenti kataloğu, hizmet başına ayrı anahtar, sıfır bilgiyle şifrelenmiş kanallarda zarf şifreleme, çağrı başına CP ölçümü ve denetim kaydı — kendi sunucunuzda; bu sayfa üçüncü taraf betik yükmez.",
  hu: "Egy vezérlőfelület a POPOPX Chat szolgáltatási fiókok és MI-ügynökök mögött: bővítménykatalógus, szolgáltatásonkénti kapcsoló, boríték-titkosítás a nullaismeret-alapú csatornákon, hívásonkénti CP-elszámolás és audit napló — a saját szervereden, és ez az oldal nem tölt be harmadik féltől származó scriptet.",
  "pt-BR": "Um único plano de controle por trás das contas de serviço do POPOPX Chat e dos Agents de IA: um catálogo de plug-ins navegável, interruptores por serviço, criptografia de envelope de canais com conhecimento zero, medição de CP por chamada e uma trilha de auditoria — no seu próprio servidor, e esta página não carrega nenhum script de terceiros.",
  ko: "POPOPX Chat 서비스 계정과 AI Agent 뒤에 있는 하나의 제어 평면입니다. 탐색 가능한 플러그인 카탈로그, 서비스별 스위치, 영지식 채널 봉투 암호화, 호출당 CP 계량, 감사 추적을 갖추었고, 모두 사용자의 서버에서 동작하며 이 페이지에는 서드파티 스크립트가 없습니다.",
  ar: "مستوى تحكم واحد خلف حسابات خدمة POPOPX Chat ووكلاء AI Agents: كتالوج إضافات قابل للتصفح، ومفاتيح تشغيل لكل خدمة، وتشفير مغلف القنوات بالمعرفة الصفرية، وقياس CP مع كل نداء، وسجل تدقيق — على خادمك أنت، وهذه الصفحة لا تحمل أي سكربت من طرف ثالث.",
};

const CORE_LABEL: Localized<string> = {
  en: "Secure core",
  ru: "Защищённое ядро",
  de: "Sicherer Kern",
  fr: "Cœur sécurisé",
  it: "Nucleo sicuro",
  nl: "Beveiligde kern",
  cs: "Zabezpečené jádro",
  "zh-Hans": "安全核心",
  "zh-Hant": "安全核心",
  es: "Núcleo seguro",
  pl: "Bezpieczne jądro",
  ja: "セキュアコア",
  th: "แกนกลางที่ปลอดภัย",
  fi: "Turvallinen ydin",
  uk: "Захищене ядро",
  bg: "Защитено ядро",
  tr: "Güvenli çekirdek",
  hu: "Biztonságos mag",
  "pt-BR": "Núcleo seguro",
  ko: "보안 코어",
  ar: "نواة آمنة",
};

const CORE_SUB: Localized<string> = {
  en: "the merchant's own server",
  ru: "собственный сервер продавца",
  de: "eigener Server des Händlers",
  fr: "le serveur du commerçant",
  it: "il server del venditore",
  nl: "eigen server van de handelaar",
  cs: "vlastní server obchodníka",
  "zh-Hans": "商户自有服务器",
  "zh-Hant": "商家自有伺服器",
  es: "el servidor del comercio",
  pl: "własny serwer sprzedawcy",
  ja: "店舗自身が持つサーバー",
  th: "เซิร์ฟเวอร์ของผู้ขายเอง",
  fi: "kauppiaan oma palvelin",
  uk: "власний сервер продавця",
  bg: "собственият сървър на търговеца",
  tr: "satıcının kendi sunucusu",
  hu: "a kereskedő saját szervere",
  "pt-BR": "o servidor do próprio comerciante",
  ko: "판매자 자체 서버",
  ar: "خادم التاجر نفسه",
};

const LOGO_ALT: Localized<string> = {
  en: "POPOPX logo",
  ru: "логотип POPOPX",
  de: "POPOPX-Logo",
  fr: "logo POPOPX",
  it: "logo POPOPX",
  nl: "POPOPX-logo",
  cs: "logo POPOPX",
  "zh-Hans": "POPOPX 标识",
  "zh-Hant": "POPOPX 標識",
  es: "logotipo de POPOPX",
  pl: "logo POPOPX",
  ja: "POPOPX ロゴ",
  th: "โลโก้ POPOPX",
  fi: "POPOPX-logo",
  uk: "логотип POPOPX",
  bg: "лого POPOPX",
  tr: "POPOPX logosu",
  hu: "POPOPX-logó",
  "pt-BR": "Logotipo da POPOPX",
  ko: "POPOPX 로고",
  ar: "شعار POPOPX",
};

const BRAND_TITLE: Localized<string> = {
  en: "Large-scale broadcast channels",
  ru: "Широковещательные каналы большого масштаба",
  de: "Broadcast-Kanäle in großem Maßstab",
  fr: "Canaux de diffusion à grande échelle",
  it: "Canali broadcast su larga scala",
  nl: "Grootschalige uitzendkanalen",
  cs: "Vysílací kanály ve velkém měřítku",
  "zh-Hans": "大规模广播频道",
  "zh-Hant": "大規模廣播頻道",
  es: "Canales de difusión a gran escala",
  pl: "Kanały nadawcze na dużą skalę",
  ja: "大規模ブロードキャストチャンネル",
  th: "ช่องทางกระจายเนื้อหาขนาดใหญ่",
  fi: "Suuren skaalan lähetuskanavat",
  uk: "Широкомовні канали великого масштабу",
  bg: "Излъчващи канали в голям мащаб",
  tr: "Büyük ölçekli yayın kanalları",
  hu: "Nagy horderejű broadcast-csatornák",
  "pt-BR": "Canais de transmissão em larga escala",
  ko: "대규모 브로드캐스트 채널",
  ar: "قنوات بث واسعة النطاق",
};

const BRAND_SUB: Localized<string> = {
  en: "zero-knowledge channels, blind-store fan-out",
  ru: "каналы с нулевым разглашением, разсылка из слепого хранилища",
  de: "Zero-Knowledge-Kanäle, Blind-Speicher-Fan-out",
  fr: "canaux à zero knowledge, diffusion depuis un stockage aveugle",
  it: "canali a zero conoscenza, fan-out da archiviazione cieca",
  nl: "zero-knowledge-kanalen, fan-out vanuit blinde opslag",
  cs: "kanály s nulovou znalostí, rozosílání ze slepého úložiště",
  "zh-Hans": "零知识加密频道盲存扇出",
  "zh-Hant": "零知識加密頻道盲存扇出",
  es: "canales de conocimiento cero, distribución desde almacenamiento ciego",
  pl: "kanały z zerową znajomością, rozsyłanie ze ślepego bufora",
  ja: "ゼロ知識証明チャンネル、ブラインドストアからの扇出",
  th: "ช่องทาง zero-knowledge, จ่ายานกระจายจากที่เก็บแบบมองไม่เห็นเนื้อหา",
  fi: "nollatiedon kanavat, hajautus sokeasta varastosta",
  uk: "канали з нульовим розкриттям, розсилка зі сліпого сховища",
  bg: "канали с нулево разкриване, разпръскване от сляпо хранилище",
  tr: "sıfır bilgi kanalları, kör depodan yayma",
  hu: "nullaismeret-csatornák, szétosztás vak tárolóból",
  "pt-BR": "canais de conhecimento zero, distribuição a partir de armazenamento cego",
  ko: "영지식 채널, 블라인드 스토어 팬아웃",
  ar: "قنوات المعرفة الصفرية، وتوزيع التخزين الأعمى",
};

const MESH_TITLE: Localized<string> = {
  en: "One-to-one end-to-end encrypted queues",
  ru: "Персональные очереди со сквозным шифрованием",
  de: "Eins-zu-eins-Warteschlangen, Ende-zu-Ende verschlüsselt",
  fr: "Files d’attente chiffrées de bout en bout, en un à un",
  it: "Code cifrate end-to-end, uno a uno",
  nl: "End-to-end versleutelde wachtrijen, één-op-één",
  cs: "Fronty šifrované end-to-end, jeden na jednoho",
  "zh-Hans": "一对一端到端加密队列",
  "zh-Hant": "一對一端對端加密佇列",
  es: "Colas cifradas de extremo a extremo, de uno en uno",
  pl: "Kolejki szyfrowane end-to-end, jeden do jednego",
  ja: "1対1のエンドツーエンド暗号化キュー",
  th: "คิวเข้ารหัสแบบ end-to-end สำหรับผู้รับหนึ่งคน",
  fi: "Yksi-yhteen-jonot, salattu päästä päähän",
  uk: "Особисті черги з наскрізним шифруванням",
  bg: "Едно-към-едно опашки, криптирани край до край",
  tr: "Bire bir, uçtan uca şifreli kuyruklar",
  hu: "Egy-az-egy, végpontok között titkosított sorok",
  "pt-BR": "Filas individuais com criptografia de ponta a ponta",
  ko: "일대일 종단 간 암호화 큐",
  ar: "طوابير فردية مشفّرة من طرف إلى طرف",
};

const MESH_SUB: Localized<string> = {
  en: "federated private service accounts",
  ru: "федеративные приватные сервисные аккаунты",
  de: "föderierte private Service-Konten",
  fr: "comptes de service privés fédérés",
  it: "account di servizio privati federati",
  nl: "gefedereerde privé-serviceaccounts",
  cs: "federované soukromé servisní účty",
  "zh-Hans": "联邦私域服务号",
  "zh-Hant": "聯邦私域服務號",
  es: "cuentas de servicio privadas federadas",
  pl: "federowane prywatne konta serwisowe",
  ja: "連合型のプライベートサービスアカウント",
  th: "บัญชีบริการส่วนตัวแบบสหพันธ์",
  fi: "federaatiomaiset yksityiset palvelutilit",
  uk: "федеративні приватні сервісні акаунти",
  bg: "федерирани частни сервизни акаунти",
  tr: "federatif özel hizmet hesapları",
  hu: "föderált privát szolgáltatási fiókok",
  "pt-BR": "contas de serviço privadas federadas",
  ko: "연합형 프라이빗 서비스 계정",
  ar: "حسابات خدمة خاصة اتحادية",
};

const CTA_PRIMARY: Localized<string> = {
  en: "One-command deploy guide (macOS / Ubuntu)",
  ru: "Руководство по развёртыванию одной командой (macOS / Ubuntu)",
  de: "Anleitung: Deployment mit einem Befehl (macOS / Ubuntu)",
  fr: "Guide de déploiement en une commande (macOS / Ubuntu)",
  it: "Guida al deploy con un comando (macOS / Ubuntu)",
  nl: "Handleiding één-commando-deploy (macOS / Ubuntu)",
  cs: "Průvodce nasazením jedním příkazem (macOS / Ubuntu)",
  "zh-Hans": "一键部署指南 (macOS / Ubuntu)",
  "zh-Hant": "一鍵部署指南 (macOS / Ubuntu)",
  es: "Guía de despliegue con un comando (macOS / Ubuntu)",
  pl: "Poradnik wdrożenia jednym poleceniem (macOS / Ubuntu)",
  ja: "ワンコマンド・デプロイガイド (macOS / Ubuntu)",
  th: "คู่มือดีพลอยด้วยคำสั่งเดียว (macOS / Ubuntu)",
  fi: "Yhden komennon käyttöönotto-opas (macOS / Ubuntu)",
  uk: "Посібник з розгортання однією командою (macOS / Ubuntu)",
  bg: "Ръководство за внедряване с една команда (macOS / Ubuntu)",
  tr: "Tek komutla kurulum rehberi (macOS / Ubuntu)",
  hu: "Telepítési útmutató egyetlen paranccsal (macOS / Ubuntu)",
  "pt-BR": "Guia de implantação com um único comando (macOS / Ubuntu)",
  ko: "한 명령 배포 가이드 (macOS / Ubuntu)",
  ar: "دليل النشر بأمر واحد (macOS / Ubuntu)",
};

const CTA_SECONDARY: Localized<string> = {
  en: "Try the service-account sandbox",
  ru: "Открыть песочницу сервисного аккаунта",
  de: "Service-Konto-Sandbox ausprobieren",
  fr: "Essayer le bac à sable du compte de service",
  it: "Prova la sandbox dell’account di servizio",
  nl: "Probeer de serviceaccount-speeltuin",
  cs: "Vyzkoušet pískoviště servisního účtu",
  "zh-Hans": "在线体验服务号沙盒",
  "zh-Hant": "線上體驗服務號沙盒",
  es: "Prueba el entorno de pruebas de la cuenta de servicio",
  pl: "Wypróbuj piaskownicę konta serwisowego",
  ja: "サービスアカウントのサンドボックスを試す",
  th: "ลองแซนด์บ็อกซ์บัญชีบริการ",
  fi: "Kokeile palvelutilin hiekkalaatikkoa",
  uk: "Відкрити пісочницю сервісного акаунта",
  bg: "Пробвайте пясъчницата на сервизния акаунт",
  tr: "Hizmet hesabı deneme ortamını deneyin",
  hu: "Próbáld ki a szolgáltatási fiók homokozóját",
  "pt-BR": "Experimente o sandbox de conta de serviço",
  ko: "서비스 계정 샌드박스 체험하기",
  ar: "جرّب بيئة اختبار حساب الخدمة",
};

const METRICS_HEADING: Localized<string> = {
  en: "The hard numbers behind this suite",
  ru: "Твёрдые цифры этого комплекта",
  de: "Die harten Zahlen hinter diesem Paket",
  fr: "Les chiffres concrets de cette suite",
  it: "I numeri concreti di questa suite",
  nl: "De harde cijfers achter deze suite",
  cs: "Tvrdá čísla této sady",
  "zh-Hans": "这套件的硬指标",
  "zh-Hant": "這套件的硬指標",
  es: "Las cifras duras de esta suite",
  pl: "Twarde liczby tego pakietu",
  ja: "このスイートの数字",
  th: "ตัวเลขจริงของชุดนี้",
  fi: "Tämän paketin kiistattomat luvut",
  uk: "Чіткі цифри цього комплекту",
  bg: "Крепките числа на този комплект",
  tr: "Bu paketin somut rakamları",
  hu: "A csomag kemény számai",
  "pt-BR": "Os números concretos por trás deste pacote",
  ko: "이 제품군을 뒷받침하는 확실한 숫자",
  ar: "الأرقام الصلبة وراء هذه الحزمة",
};

const NOTE: Localized<string> = {
  en: "This page is a plain static build: system fonts only, every icon and image served from this origin, and no third-party script, font or analytics code at all. The output is a folder of ordinary files that can be distributed and opened offline.",
  ru: "Эта страница — обычная статическая сборка: только системные шрифты, все значки и изображения отдаются с этого же домена и никаких сторонних скриптов, шрифтов или счётчиков посещаемости. На выходе получается папка обычных файлов, которые можно распространять и открывать без сети.",
  de: "Diese Seite ist ein reiner Static-Build: nur Systemschriften, alle Icons und Bilder kommen von derselben Origin, und keinerlei Skripte, Schriften oder Analyse-Code Dritter. Das Ergebnis ist ein Ordner gewöhnlicher Dateien, die sich offline verteilen und öffnen lassen.",
  fr: "Cette page est une compilation statique ordinaire : polices système uniquement, toutes les icônes et images servies depuis cette origine, et aucun script, police ou code de mesure tiers. Le résultat est un dossier de fichiers classiques, distribuables et consultables hors ligne.",
  it: "Questa pagina è una build statica ordinaria: solo font di sistema, tutte le icone e le immagini sono servite da questa origine e non c’è alcuno script, font o codice di analisi di terze parti. L’output è una cartella di file normali, distribuibile e apribile offline.",
  nl: "Deze pagina is een gewone statische build: alleen systeemletters, alle pictogrammen en afbeeldingen vanaf dezelfde oorsprong, en geen enkel script, lettertype of analysecode van derden. De output is een map met gewone bestanden die je offline kunt delen en openen.",
  cs: "Tato stránka je obyčejná statická sestava: pouze systémová písma, všechny ikony a obrázky se dodávají z této domény a žádné cizí skripty, písma ani analytický kód. Výsledkem je složka běžných souborů, kterou lze šířit a otevírat offline.",
  "zh-Hans": "本页是纯静态构建产物：字体走系统栈，图标与图片与本站同源，不加载任何第三方脚本、字体或统计代码。构建结果是一组普通文件，可以离线分发、离线打开。",
  "zh-Hant": "本頁是純靜態建置產物：字型走系統堆疊，圖示與圖片與本站同源，不載入任何第三方腳本、字型或統計程式碼。建置結果是一組一般檔案，可離線分發、離線開啟。",
  es: "Esta página es una compilación estática a secas: solo tipografías del sistema, cada icono e imagen se sirve desde este origen y ni un script, fuente o código de analítica de terceros. El resultado es una carpeta de archivos normales que puede distribuirse y abrirse sin conexión.",
  pl: "Ta strona to zwykły build statyczny: wyłącznie czcionki systemowe, wszystkie ikony i obrazy serwuje ta sama domena, ani grama zewnętrznych skryptów, fontów ani kodu analitycznego. Efektem jest folder zwyczajnych plików, które można rozpowszechniać i otwierać bez sieci.",
  ja: "このページはごく普通の静的ビルドです。フォントはシステム標準のみ、アイコンも画像もすべて同一オリジンから配信し、外部のスクリプト・フォント・アクセス解析コードは一切読み込みません。成果物は通常のファイルのフォルダで、オフラインで配布して開けます。",
  th: "หน้านี้เป็นบิลด์สแตติกล้วน: ใช้ฟอนต์ระบบเท่านั้น ไอคอนและรูปภาพทั้งหมดเสิร์ฟจากต้นทางเดียวกัน และไม่โหลดสคริปต์ ฟอนต์ หรือโค้ดวิเคราะห์ของบุคคลที่สามแม้แต่น้อย ผลลัพธ์คือโฟลเดอร์ของไฟล์ธรรมดาที่แจกจ่ายและเปิดแบบออฟไลน์ได้",
  fi: "Tämä sivu on tavallinen staattinen buildi: vain järjestelmäfontit, ikonit ja kuvat haetaan samasta alkuperästä, eikä kolmannen osapuolen skriptejä, fontteja eikä analytiikkakooda ollenkaan. Tuloksena on tavallinen tiedostokansio, joka levittyy ja avautuu ilman verkkoyhteyttä.",
  uk: "Ця сторінка — звичайна статична збірка: лише системні шрифти, усі піктограми та зображення віддаються з того самого домену, жодних сторонніх скриптів, шрифтів чи коду аналітики. На виході — тека зі звичайними файлами, які можна поширювати та відкривати без мережі.",
  bg: "Тази страница е обикновена статична компилация: само системни шрифтове, всички икони и изображения идват от един и същи източник, и никакъв скрипт, шрифт или аналитичен код на трета страна. Резултатът е папка с обикновени файлове, които могат да се разпространяват и отварят офлайн.",
  tr: "Bu sayfa sade bir statik derlemedir: yalnızca sistem yazı tipleri, tüm simgeler ve görseller aynı kaynaktan sunulur ve hiçbir üçüncü taraf betiği, yazı tipi veya analiz kodu yüklenmez. Ortaya, çevrimdışı paylaşılıp açılabilecek sıradan dosyalardan oluşan bir klasör çıkar.",
  hu: "Ez az oldal egy közönséges statikus build: csak rendszerbetűtípusok, minden ikon és kép ugyanonnan a forrásból érkezik, és semmilyen harmadik féltől származó szkript, betűtípus vagy elemző kód nem töltődik be. Az eredmény egy mappányi hétköznapi fájl, amely offline terjeszthető és megnyitható.",
  "pt-BR": "Esta página é uma build estática simples: apenas fontes do sistema, cada ícone e imagem servidos desta mesma origem, e nenhum script, fonte ou código de análise de terceiros. O resultado é uma pasta de arquivos comuns que pode ser distribuída e aberta offline.",
  ko: "이 페이지는 평범한 정적 빌드입니다. 시스템 폰트만 사용하고, 모든 아이콘과 이미지는 이 출처에서 제공하며, 서드파티 스크립트나 폰트, 분석 코드는 전혀 없습니다. 결과물은 오프라인에서도 배포하고 열 수 있는 평범한 파일 폴더입니다.",
  ar: "هذه الصفحة بناء ساكن بسيط: خطوط النظام فقط، وكل أيقونة وصورة تُقدَّم من هذا الأصل نفسه، ولا سكربت أو خط أو شيفرة تحليلات من طرف ثالث إطلاقًا. والمخرج مجلد من ملفات عادية يمكن توزيعه وفتحه دون اتصال.",
};

/** Values are locale-free tokens; only the caption is a copy slot. */
const METRICS: readonly { value: string; caption: Localized<string> }[] = [
  {
    value: "0",
    caption: {
      en: "global user IDs",
      ru: "глобальных ID пользователей",
      de: "globale Nutzer-IDs",
      fr: "identifiants utilisateur globaux",
      it: "ID utente globali",
      nl: "globale gebruikers-ID’s",
      cs: "globálních uživatelských ID",
      "zh-Hans": "全局用户 ID",
      "zh-Hant": "全域使用者 ID",
      es: "IDs globales de usuario",
      pl: "globalnych identyfikatorów użytkowników",
      ja: "グローバルユーザーID",
      th: "ID ผู้ใช้สากล",
      fi: "globaalia käyttäjätunnistetta",
      uk: "глобальних ID користувачів",
      bg: "глобални потребителски ID-та",
      tr: "küresel kullanıcı kimliği",
      hu: "globális felhasználói azonosító",
      "pt-BR": "IDs globais de usuário",
      ko: "전역 사용자 ID",
      ar: "معرّفات مستخدم عالمية",
    },
  },
  {
    value: "100%",
    caption: {
      en: "of message content E2EE",
      ru: "содержимого сообщений зашифровано сквозным шифрованием",
      de: "des Nachrichteninhalts Ende-zu-Ende verschlüsselt",
      fr: "du contenu des messages chiffré de bout en bout",
      it: "del contenuto dei messaggi cifrato end-to-end",
      nl: "van de berichtinhoud end-to-end versleuteld",
      cs: "obsahu zpráv šifrováno end-to-end",
      "zh-Hans": "消息内容端到端加密",
      "zh-Hant": "訊息內容端對端加密",
      es: "del contenido de los mensajes cifrado de extremo a extremo",
      pl: "treści wiadomości szyfrowane end-to-end",
      ja: "メッセージ内容をエンドツーエンド暗号化",
      th: "ของเนื้อหาข้อความเข้ารหัสแบบ end-to-end",
      fi: "viestisisällöstä päästä päähän salattuna",
      uk: "вмісту повідомлень наскрізним шифруванням",
      bg: "съдържанието на съобщенията е криптирано край до край",
      tr: "mesaj içeriği uçtan uca şifreli",
      hu: "az üzenettartalom végpontok között titkosított",
      "pt-BR": "do conteúdo das mensagens com E2EE",
      ko: "메시지 내용 E2EE 적용",
      ar: "من محتوى الرسائل مشفّر من طرف إلى طرف",
    },
  },
  {
    value: "E2EE",
    caption: {
      en: "blind-store channels",
      ru: "слепое хранение в шифрованных каналах",
      de: "Blind-Speicher in verschlüsselten Kanälen",
      fr: "stockage aveugle dans les canaux chiffrés",
      it: "archiviazione cieca nei canali cifrati",
      nl: "blinde opslag in versleutelde kanalen",
      cs: "slepé uložení v šifrovaných kanálech",
      "zh-Hans": "盲存加密频道",
      "zh-Hant": "盲存加密頻道",
      es: "almacenamiento ciego en canales cifrados",
      pl: "ślepe składowanie w kanałach szyfrowanych",
      ja: "暗号化チャンネルのブラインドストア",
      th: "ที่เก็บแบบมองไม่เห็นเนื้อหาในช่องทางเข้ารหัส",
      fi: "sokea tallennus salatuilla kanavilla",
      uk: "сліпе зберігання в шифрованих каналах",
      bg: "сляпо съхранение в криптирани канали",
      tr: "şifreli kanallarda kör depolama",
      hu: "vak tárolás titkosított csatornákon",
      "pt-BR": "canais com armazenamento cego",
      ko: "블라인드 스토어 채널",
      ar: "قنوات تخزين أعمى",
    },
  },
  {
    value: "AGPL-3.0",
    caption: {
      en: "open source, all layers",
      ru: "открытый код на всех уровнях",
      de: "Open Source auf allen Ebenen",
      fr: "open source à toutes les couches",
      it: "open source a tutti i livelli",
      nl: "open source op elke laag",
      cs: "open source ve všech vrstvách",
      "zh-Hans": "全栈开源",
      "zh-Hant": "全棧開源",
      es: "código abierto capa a capa",
      pl: "otwarty kod na każdej warstwie",
      ja: "フルスタックOSS",
      th: "เปิดซอร์สทุกชั้น",
      fi: "avoin lähdekoodi jokaisella tasolla",
      uk: "відкритий код на всіх рівнях",
      bg: "отворен код на всички нива",
      tr: "her katmanda açık kaynak",
      hu: "nyílt forráskód minden rétegben",
      "pt-BR": "código aberto em todas as camadas",
      ko: "전 계층 오픈소스",
      ar: "مفتوح المصدر في كل الطبقات",
    },
  },
  {
    value: "BLE Mesh",
    caption: {
      en: "offline dual-mode on the client",
      ru: "два офлайн-режима на клиенте",
      de: "zwei Offline-Modi auf dem Client",
      fr: "deux modes hors ligne côté client",
      it: "due modalità offline sul client",
      nl: "twee offlinemodi op de client",
      cs: "dva režimy offline na klientovi",
      "zh-Hans": "客户端离线双模",
      "zh-Hant": "客戶端離線雙模",
      es: "dos modos sin conexión en el cliente",
      pl: "dwa tryby offline po stronie klienta",
      ja: "クライアント側のオフライン二モード",
      th: "สองโหมดออฟไลน์ฝั่งไคลเอนต์",
      fi: "kaksi offline-tilaa asiakkaassa",
      uk: "два офлайн-режими на клієнті",
      bg: "два офлайн режима в клиента",
      tr: "istemci tarafında iki çevrimdışı mod",
      hu: "két offline mód az ügyféloldalon",
      "pt-BR": "modo duplo offline no cliente",
      ko: "클라이언트 오프라인 듀얼 모드",
      ar: "وضعان دون اتصال على العميل",
    },
  },
];

export function HeroSection(): ReactElement {
  const { locale } = useLocale();
  const eyebrow = useCopy(EYEBROW);
  const headline = useCopy(HEADLINE);
  const subheadline = useCopy(SUBHEADLINE);
  const coreLabel = useCopy(CORE_LABEL);
  const coreSub = useCopy(CORE_SUB);
  const logoAlt = useCopy(LOGO_ALT);
  const brandTitle = useCopy(BRAND_TITLE);
  const brandSub = useCopy(BRAND_SUB);
  const meshTitle = useCopy(MESH_TITLE);
  const meshSub = useCopy(MESH_SUB);
  const ctaPrimary = useCopy(CTA_PRIMARY);
  const ctaSecondary = useCopy(CTA_SECONDARY);
  const metricsHeading = useCopy(METRICS_HEADING);
  const note = useCopy(NOTE);

  return (
    <section id="overview" aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      {/* Ambient wash behind the whole first screen. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 -top-24 h-[520px] bg-brand-halo" />
        <div className="absolute left-0 top-1/3 h-[360px] w-1/2 bg-brand-halo opacity-60" />
        <div className="absolute right-0 top-1/3 h-[360px] w-1/2 bg-mesh-halo" />
        <div className="grain absolute inset-0 opacity-30" />
      </div>

      <div className="section-wrap flex min-h-[90vh] flex-col justify-center gap-7 py-16 sm:gap-9 sm:py-20">
        {/* ── dual-mode topology ─────────────────────────────────────────── */}
        <div className="relative mx-auto h-[220px] w-full max-w-[1040px] sm:h-[260px]">
          {/* Curved connectors: the two fans converging on the core. */}
          <svg
            aria-hidden
            viewBox="0 0 1000 260"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <linearGradient id="hero-brand-fan" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9B7BFF" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#9B7BFF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#6E3FF3" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="hero-mesh-fan" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#34E0B4" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#34E0B4" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <g fill="none" strokeWidth="1" vectorEffect="non-scaling-stroke">
              <path d="M0 34 C 360 34 470 110 500 130" stroke="url(#hero-brand-fan)" opacity="0.75" />
              <path d="M0 92 C 340 92 460 116 500 130" stroke="url(#hero-brand-fan)" />
              <path d="M0 168 C 340 168 460 144 500 130" stroke="url(#hero-brand-fan)" />
              <path d="M0 226 C 360 226 470 150 500 130" stroke="url(#hero-brand-fan)" opacity="0.75" />
              <path d="M1000 34 C 640 34 530 110 500 130" stroke="url(#hero-mesh-fan)" opacity="0.75" />
              <path d="M1000 92 C 660 92 540 116 500 130" stroke="url(#hero-mesh-fan)" />
              <path d="M1000 168 C 660 168 540 144 500 130" stroke="url(#hero-mesh-fan)" />
              <path d="M1000 226 C 640 226 530 150 500 130" stroke="url(#hero-mesh-fan)" opacity="0.75" />
            </g>
          </svg>

          {/* The animated streams. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {BRAND_LINES.map((cls) => (
              <span key={cls} className={cls} />
            ))}
            {MESH_LINES.map((cls) => (
              <span key={cls} className={cls} />
            ))}
          </div>

          {/* The core: halo, reticle, official wordmark. */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
            <div className="relative flex h-[104px] w-[104px] items-center justify-center sm:h-[124px] sm:w-[124px]">
              <div
                aria-hidden
                className="absolute -inset-3.5 rounded-full bg-brand-halo blur-[2px] animate-pulse-soft"
              />
              <svg
                aria-hidden
                viewBox="0 0 120 120"
                className="absolute inset-0 h-full w-full animate-spin-slow text-brand-soft/45"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="56"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="3 9"
                />
              </svg>
              <svg
                aria-hidden
                viewBox="0 0 140 140"
                className="absolute -left-3.5 -top-3.5 h-[calc(100%+28px)] w-[calc(100%+28px)] animate-spin-slow text-mesh-soft/40 [animation-direction:reverse]"
              >
                <circle
                  cx="70"
                  cy="70"
                  r="66"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeDasharray="16 30"
                />
              </svg>
              <div className="relative flex h-full w-full items-center justify-center rounded-full border border-hair bg-white/[0.045] shadow-brand-ring backdrop-blur-xl">
                <img
                  src="/logo-popopx.png"
                  alt={logoAlt}
                  width={72}
                  height={72}
                  className="h-[62%] w-[62%] object-contain"
                />
              </div>
            </div>
            <p className="pill bg-black/45">
              <span className="font-medium text-white">{coreLabel}</span>
              <span className="text-faint">{coreSub}</span>
            </p>
          </div>

          {/* Fan endpoints, labelled. */}
          <div className="absolute left-0 top-0 max-w-[46%] text-start">
            <span className="chip border-brand/45 bg-brand/10 text-white">
              <StatusDot tone="brand" />
              {brandTitle}
            </span>
            <span className="mt-1.5 block text-[11px] leading-snug text-faint">{brandSub}</span>
          </div>
          <div className="absolute right-0 top-0 max-w-[46%] text-end">
            <span className="chip border-mesh/45 bg-mesh/10 text-white">
              <StatusDot tone="mesh" />
              {meshTitle}
            </span>
            <span className="mt-1.5 block text-[11px] leading-snug text-faint">{meshSub}</span>
          </div>
        </div>

        {/* ── headline block ────────────────────────────────────────────── */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1
            id="hero-heading"
            className="mt-3 text-[26px] font-semibold leading-[1.22] tracking-tight text-white sm:text-[40px] sm:leading-[1.15]"
          >
            <span className="text-gradient-brand">{headline}</span>
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-mute sm:text-[15px]">
            {subheadline}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a href="#install" className="btn-primary">
              {ctaPrimary}
            </a>
            <a href="#sandbox" className="btn-ghost">
              {ctaSecondary}
            </a>
          </div>
        </div>

        {/* ── metric strip ──────────────────────────────────────────────── */}
        <div className="mx-auto w-full max-w-[1040px]">
          <h2 className="sr-only">{metricsHeading}</h2>
          <dl className="glass grid grid-cols-2 gap-px overflow-hidden xs:grid-cols-3 sm:grid-cols-5">
            {METRICS.map((m) => (
              <div
                key={m.value}
                className="flex flex-col items-center gap-1 bg-white/[0.02] px-3 py-4 text-center"
              >
                <dt className="font-mono text-[17px] font-semibold tracking-tight text-white sm:text-[19px]">
                  {m.value}
                </dt>
                <dd className="text-[11px] leading-snug text-faint">{pick(m.caption, locale)}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── honest local-only note ────────────────────────────────────── */}
        <p className="mx-auto flex max-w-2xl items-start gap-2 text-center text-[11.5px] leading-relaxed text-faint">
          <span className="mt-1.5 shrink-0">
            <StatusDot tone="mesh" pulse />
          </span>
          <span>{note}</span>
        </p>
      </div>
    </section>
  );
}
