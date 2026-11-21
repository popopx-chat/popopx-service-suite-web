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
 * Every string below is a literal `Localized<string>` map listing all 18 tags
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
  en: "POPOPX Service Account · backend suite",
  ru: "Сервисный аккаунт POPOPX · набор серверных модулей",
  de: "POPOPX Service-Konto · Backend-Paket",
  fr: "Compte de service POPOPX · suite serveur",
  it: "Account di servizio POPOPX · suite backend",
  nl: "POPOPX-serviceaccount · backend-suite",
  cs: "Servisní účet POPOPX · sada backendových modulů",
  "zh-Hans": "POPOPX 服务号 · 后端套件",
  "zh-Hant": "POPOPX 服務號 · 後端套件",
  es: "Cuenta de servicio POPOPX · suite de backend",
  pl: "Konto serwisowe POPOPX · pakiet backendowy",
  ja: "POPOPX サービスアカウント · バックエンドスイート",
  th: "บัญชีบริการ POPOPX · ชุดโมดูลฝั่งเซิร์ฟเวอร์",
  fi: "POPOPX-palvelutili · taustapalvelupaketti",
  uk: "Сервісний акаунт POPOPX · комплект серверних модулів",
  bg: "Сервизен акаунт на POPOPX · комплект сървърни модули",
  tr: "POPOPX Hizmet Hesabı · arka uç paketi",
  hu: "POPOPX szolgáltatási fiók · backend csomag",
};

const HEADLINE: Localized<string> = {
  en: "Reshaping decentralised business links: zero-knowledge encrypted channels × federated private service accounts",
  ru: "Перестраиваем децентрализованные деловые связи: шифрованные каналы с нулевым разглашением × федеративные приватные сервисные аккаунты",
  de: "Dezentrale Geschäftsverbindungen neu gedacht: zero-knowledge-verschlüsselte Kanäle × föderierte private Service-Konten",
  fr: "Repenser les liens commerciaux décentralisés : canaux chiffrés à zero knowledge × comptes de service privés fédérés",
  it: "Riprogettare i legami commerciali decentralizzati: canali cifrati a zero conoscenza × account di servizio privati federati",
  nl: "Decentrale zakelijke verbindingen opnieuw ingericht: zero-knowledge versleutelde kanalen × gefedereerde privé-serviceaccounts",
  cs: "Nové pojetí decentralizovaných obchodních vazeb: šifrované kanály s nulovou znalostí × federované soukromé servisní účty",
  "zh-Hans": "重塑去中心化商业连接：零知识加密频道 × 联邦私域服务号",
  "zh-Hant": "重塑去中心化商業連接：零知識加密頻道 × 聯邦私域服務號",
  es: "Repensando los vínculos comerciales descentralizados: canales cifrados de conocimiento cero × cuentas de servicio privadas federadas",
  pl: "Połączenia biznesowe bez scentralizowania: kanały szyfrowane z zerową znajomością × federowane prywatne konta serwisowe",
  ja: "分散型のビジネスのつながりを組み替える：ゼロ知識証明の暗号化チャンネル × 連合型のプライベートサービスアカウント",
  th: "ปรับโฉมการเชื่อมต่อทางธุรกิจแบบกระจายศูนย์: ช่องทางเข้ารหัสแบบ zero-knowledge × บัญชีบริการส่วนตัวแบบสหพันธ์",
  fi: "Hajautetut kaupalliset yhteydet mietittynä uusiksi: nollatiedon salauksen kanavat × federaatiomaiset yksityiset palvelutilit",
  uk: "По-новому про децентралізовані ділові зв’язки: шифровані канали з нульовим розкриттям × федеративні приватні сервісні акаунти",
  bg: "Преосмисляме децентрализираните бизнес връзки: криптирани канали с нулево разкриване × федерирани частни сервизни акаунти",
  tr: "Merkeziyetsiz ticari bağları yeniden kuruyoruz: sıfır bilgiyle şifrelenmiş kanallar × federatif özel hizmet hesapları",
  hu: "A decentralizált üzleti kapcsolatok újragondolása: nullaismeret-alapú titkosított csatornák × föderált privát szolgáltatási fiókok",
};

const SUBHEADLINE: Localized<string> = {
  en: "No content inspection by the server · no global ID for cross-site tracking · one-command deployment on your own server · the next generation of encrypted commerce, open source end to end under AGPL-3.0.",
  ru: "Ноль доступа к содержимому на сервере · никакого глобального ID для отслеживания между сайтами · развёртывание одной командой на вашем сервере · новое поколение шифрованной коммерции, открытое от первой до последней строки под AGPL-3.0.",
  de: "Keine Inhalteinsicht auf dem Server · keine globale ID für übergreifendes Tracking · Deployment mit einem Befehl auf eigenem Server · die nächste Generation des verschlüsselten Handels, durchgehend Open Source unter AGPL-3.0.",
  fr: "Aucune inspection du contenu par le serveur · aucun identifiant global pour le suivi entre sites · déploiement en une commande sur votre propre serveur · la prochaine génération du commerce chiffré, open source de bout en bout sous AGPL-3.0.",
  it: "Nessuna ispezione dei contenuti da parte del server · nessun ID globale per il tracciamento tra siti · deploy con un comando sul tuo server · la prossima generazione del commercio cifrato, open source end-to-end sotto AGPL-3.0.",
  nl: "Geen inhoudsinspectie door de server · geen globaal ID voor site-overschrijdende tracking · met één commando op je eigen server draaien · de volgende generatie versleutelde handel, end-to-end open source onder AGPL-3.0.",
  cs: "Žádná kontrola obsahu na serveru · žádné globální ID pro sledování napříč weby · nasazení jedním příkazem na vlastním serveru · další generace šifrovaného obchodu, open source od konce ke konci pod licencí AGPL-3.0.",
  "zh-Hans": "服务器零内容窥探 · 无全局 ID 跨站追踪 · 自有服务器一键部署 · AGPL-3.0 全栈开源的下一代加密商业生态。",
  "zh-Hant": "伺服器零內容窺探 · 無全域 ID 跨站追蹤 · 自有伺服器一鍵部署 · AGPL-3.0 全棧開源的下一世代加密商業生態。",
  es: "Sin inspección de contenido por parte del servidor · sin ID global para rastreo entre sitios · despliegue con un solo comando en tu propio servidor · la próxima generación de comercio cifrado, de código abierto de extremo a extremo bajo AGPL-3.0.",
  pl: "Brak wglądu serwera w treść · brak globalnego identyfikatora do śledzenia między serwisami · wdrożenie jednym poleceniem na własnym serwerze · kolejna generacja szyfrowanego handlu, wolne oprogramowanie od końca do końca na licencji AGPL-3.0.",
  ja: "サーバーが内容をのぞくことはゼロ · サイト間追跡用のグローバルIDもゼロ · 自分のサーバーへワンコマンドでデプロイ · AGPL-3.0 のフルスタックOSSで築く次世代の暗号化コマース基盤。",
  th: "เซิร์ฟเวอร์ไม่เห็นเนื้อหาเลย · ไม่มี ID สากลสำหรับติดตามข้ามไซต์ · ดีพลอยด้วยคำสั่งเดียวบนเซิร์ฟเวอร์ของคุณเอง · ระบบนิเวศพาณิชย์เข้ารหัสรุ่นถัดไปที่เปิดซอร์สทั้งสแต็กใต้ AGPL-3.0",
  fi: "Palvelin ei näe sisältöä · ei globaalia tunnista sivustojen väliseen seurantaan · käyttöönotto yhdellä komennolla omalle palvelimelle · seuraavan sukupolven salattu kaupankäynti, avoimen lähdekoodin läpi linjan AGPL-3.0-nojalla.",
  uk: "Сервер не зазирає вмісту · жодного глобального ID для відстеження між сайтами · розгортання однією командою на власному сервері · наступне покоління шифрованої комерції, повністю відкрите під ліцензією AGPL-3.0.",
  bg: "Без преглед на съдържанието от сървъра · без глобален ID за проследяване между сайтове · внедряване с една команда на ваш собствен сървър · следващото поколение на криптираната търговия, с отворен код навсякъде под AGPL-3.0.",
  tr: "Sunucunun içeriğe erişimi yok · siteler arası izleme için küresel kimlik yok · kendi sunucunuza tek komutla kurulum · baştan sona AGPL-3.0 altında açık kaynak, şifreli ticaretin yeni nesli.",
  hu: "A szerver nem lát bele a tartalba · nincs globális azonosító az oldalak közötti követésre · egy parancsból telepítés a saját szerveredre · a titkosított kereskedelem következő generációja, végig nyílt forráskóddal, AGPL-3.0 alatt.",
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
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
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
                <stop offset="0%" stopColor="#7D7AFF" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#7D7AFF" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#5856D6" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="hero-mesh-fan" x1="1" y1="0" x2="0" y2="0">
                <stop offset="0%" stopColor="#00D2B8" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#00D2B8" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#00A896" stopOpacity="0.85" />
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
          <div className="absolute left-0 top-0 max-w-[46%] text-left">
            <span className="chip border-brand/45 bg-brand/10 text-white">
              <StatusDot tone="brand" />
              {brandTitle}
            </span>
            <span className="mt-1.5 block text-[11px] leading-snug text-faint">{brandSub}</span>
          </div>
          <div className="absolute right-0 top-0 max-w-[46%] text-right">
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
