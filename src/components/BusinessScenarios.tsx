"use client";

import { type ReactElement, type ReactNode } from "react";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { SectionHeading, StatusDot } from "@/components/ui";

/**
 * The business layer, placed between the hero and everything that speaks in
 * endpoints.
 *
 * A visitor who has never read a man page should be able to answer "what would I
 * use this for?" before the page shows a single URL, environment variable or byte
 * order. So this section is the first thing below the fold, it names six
 * scenarios instead of five modules, and every card is written as what happens
 * for the shop, the operator working the queue, the editor, the on-call
 * engineer, the site that needs a login and the team that runs its own model.
 * The developer half of the audience is not served less: one monospaced line per
 * card carries the real module file or the real environment switch, and the card
 * link jumps to the deep section that documents it (`#plugins`, `#protocol`,
 * `#security`, `#sandbox`, `#architecture`, `#install`). Nothing is promised here
 * that the catalog, the protocol quick reference or the governance section has to
 * walk back.
 *
 * Two claims are deliberately kept apart, because the page has to be honest
 * rather than flattering: five of the six cards run on plugin modules that ship in
 * this release and are on by factory default — and three of those cards (support,
 * enquiry handling, own model) are the *same* `ai_agent` module seen from three
 * sides, not three modules — while the encrypted channel is core gateway
 * behaviour: not a plugin, and not zero-knowledge with respect to the merchant's
 * own server, which is the issuer holding the channel key pair. The caveat is
 * printed in the card, not hidden below.
 *
 * Copy. Every string is a literal `Localized<string>` map listing all 21 tags
 * `src/lib/i18n.tsx` declares — the same set the iOS client ships — so the
 * compiler and `tools/check-i18n.mjs` both see every language a visitor gets.
 * No slot is derived from another language, nothing is cast, nothing is spread.
 * Wire tokens (module file names, routes, `epoch`, `Ed25519`) are plain `string`
 * on purpose: they are bytes on a wire, not prose, and every language reads the
 * same one. The word 确认 in the DevOps card is ordinary UI prose ("tap
 * acknowledge"), not the factory alert-resolve keyword list, which stays the
 * simplified literal `确认,已处理,ack,resolve` in `PluginsShowcase.tsx`.
 */

type ScenarioIcon = "support" | "auto" | "channel" | "alert" | "scan" | "local";

type Scenario = {
  readonly index: string;
  readonly icon: ScenarioIcon;
  readonly accent: "brand" | "mesh";
  readonly name: Localized<string>;
  readonly actor: Localized<string>;
  readonly tagline: Localized<string>;
  readonly body: Localized<string>;
  readonly steps: readonly Localized<string>[];
  readonly state: Localized<string>;
  readonly tech: string;
  readonly href: string;
  readonly link: Localized<string>;
};

/* ── COPY BLOCK START: 55 literal 18-locale maps, authored per language ───── */

const EYEBROW: Localized<string> = {
  en: "What you can do with it",
  ru: "Что это даёт",
  de: "Sechs Einsatzmöglichkeiten",
  fr: "Cas d’usage",
  it: "Casi d’uso",
  nl: "Zes praktijkscenario's",
  cs: "Šest scénářů nasazení",
  "zh-Hans": "你能用它做什么",
  "zh-Hant": "你能用它做什麼",
  es: "Casos de uso",
  pl: "Zastosowania w praktyce",
  ja: "何ができるか",
  th: "นำไปใช้ทำอะไรได้บ้าง",
  fi: "Mihin tätä käyttää",
  uk: "Що це дає",
  bg: "Какво реално дава",
  tr: "Bunlarla neler yapılır",
  hu: "Mire használhatod",
  "pt-BR": "O que você pode fazer com ele",
  ko: "이것으로 할 수 있는 일",
  ar: "ما يمكنك فعله بها",
};

const TITLE: Localized<string> = {
  en: "Six scenarios you can run today: support, auto-handling, channels, alerts, sign-in, your own model",
  ru: "Шесть сценариев, которые можно запустить сегодня: поддержка, автоматическая обработка, каналы, оповещения, вход, своя модель",
  de: "Alle sechs Szenarien für heute: Support, Anfragebearbeitung, Kanäle, Alarme, Login, eigenes Modell",
  fr: "Six scénarios que vous lancez dès aujourd’hui : support, réponses automatiques, canaux, alertes, connexion, votre propre modèle",
  it: "Sei scenari che puoi usare oggi: assistenza, gestione automatica delle richieste, canali, avvisi, login, modello proprio",
  nl: "Overzicht van zes scenario's die vandaag draaien: support, vragenafhandeling, kanalen, alarmen, inloggen, eigen model",
  cs: "Dnes spuštíte šest scénářů: podpora, vyřizování dotazů, kanály, alarmy, přihlášení, vlastní model",
  "zh-Hans": "六个今天就能跑起来的场景：客服、自动接待、频道、告警、登录、接入自有模型",
  "zh-Hant": "六個今天就能跑起來的場景：客服、自動接待、頻道、告警、登入、接入自有模型",
  es: "Seis escenarios que puedes usar hoy: soporte, gestión automática de consultas, canales, alertas, acceso, modelo propio",
  pl: "Sześć scenariuszy, które działają dziś: obsługa klienta, automatyczna obsługa zapytań, kanały, alerty, logowanie, własny model",
  ja: "今日から動かせる6つのシーン：AIサポート、自動応対、チャンネル、アラート、ログイン、自分のモデル",
  th: "ใช้ได้วันนี้ 6 แบบ: สนับสนุน, รับเรื่องอัตโนมัติ, เผยแพร่, แจ้งเตือน, เข้าสู่ระบบ และโมเดลของคุณเอง",
  fi: "Kuusi tänään käynnistyvää skenaariota: tuki, automaattinen käsittely, kanavat, hälytykset, kirjautuminen, oma malli",
  uk: "Шість сценаріїв, які можна запустити сьогодні: підтримка, обробка звернень, канали, сповіщення, вхід, власна модель",
  bg: "Шест сценария, които можете да пуснете днес: поддръжка, автоматична обработка, канали, аларми, вход, собствен модел",
  tr: "Bugün çalıştırabileceğiniz altı senaryo: destek, otomatik karşılama, kanal yayını, uyarı, giriş ve kendi modeliniz",
  hu: "Hat ma futtatható forgatókönyv: ügyfélszolgálat, automatikus ügyintézés, csatornák, riasztások, belépés, saját modell",
  "pt-BR": "Seis cenários que você pode executar hoje: suporte, tratamento automático de consultas, canais, alertas, login e seu próprio modelo",
  ko: "지금 운영할 수 있는 여섯 가지 시나리오: 고객 지원, 자동 응대, 채널, 알림, 로그인, 자체 모델",
  ar: "ستة سيناريوهات يمكنك تشغيلها اليوم: الدعم، والمعالجة التلقائية، والقنوات، والتنبيهات، وتسجيل الدخول، ونموذجك الخاص",
};

const SUBTITLE: Localized<string> = {
  en: "These cards say only what happens for the business. Module names, endpoints, environment switches and the cryptographic detail stay further down the page — in the services catalog, the protocol quick reference and the governance section — so a developer can still look every number up.",
  ru: "Карточки говорят только о том, что получает бизнес. Названия модулей, эндпоинты, переключатели окружения и криптография остаются ниже: в каталоге служб, справочнике протокола и разделе безопасности, где разработчик по-прежнему может сверить каждое число.",
  de: "Die Karten sagen nur, was geschäftlich passiert. Modulnamen, Endpunkte, Umgebungsvariablen und kryptografische Details stehen weiter unten: im Service-Katalog, der Protokoll-Kurzreferenz und im Abschnitt Sicherheit. Entwickler können dort jede Zahl nachschlagen.",
  fr: "Ces cartes ne disent que l’effet métier. Modules, endpoints, variables d’environnement et crypto restent plus bas — catalogue des services, référence du protocole, sécurité — un développeur peut tout vérifier.",
  it: "Queste carte dicono solo l’effetto per l’attività. Moduli, endpoint, variabili e dettagli di cifratura restano più giù — catalogo dei servizi, riferimento del protocollo, sicurezza — uno sviluppatore può verificare ogni numero.",
  nl: "De kaarten zeggen alleen wat er zakelijk gebeurt. Modulnamen, endpoints, omgevingschakelaars en cryptografie staan lager op de pagina: in de servicecatalogus, de korte protocolreferentie en de beveiligingssectie. Elk cijfer blijft opzoekbaar.",
  cs: "Karty říkají jen to, co se děje v byznysu. Názvy modulů, endpointy, přepínače a kryptografie zůstávají níže: v katalogu služeb, protokolovém přehledu a sekci správy, kde vývojář dohledá každé číslo.",
  "zh-Hans": "这些卡片只讲业务上会发生什么。模块名、接口、环境变量开关和加密细节都留在页面后半段——服务目录、协议速查与安全治理——开发者照样查得到每一个数字。",
  "zh-Hant": "這些卡片只講業務上會發生什麼。模組名、介面、環境變數開關和加密細節都留在頁面後半段——服務目錄、協議速查與安全治理——開發者照樣查得到每一個數字。",
  es: "Estas tarjetas solo dicen lo que cambia para el negocio. Módulos, endpoints, variables y detalle criptográfico quedan más abajo — catálogo de servicios, referencia del protocolo, seguridad — un desarrollador puede comprobar cada cifra.",
  pl: "Te karty mówią tylko o skutkach dla biznesu. Moduły, ścieżki, przełączniki i kryptografia zostały niżej — w katalogu usług, skrócie protokołu i sekcji bezpieczeństwa — więc programista każdą liczbę znajdzie sam.",
  ja: "カードに書くのは、ビジネスで何が起きるかだけです。モジュール名、エンドポイント、環境変数のスイッチ、暗号の詳細はページの後半——サービスカタログ、プロトコル早見表、権限ガバナンス——に残します。開発者はどの数値も確かめられます。",
  th: "การ์ดเหล่านี้พูดแค่เรื่องว่าจะเกิดอะไรขึ้นกับธุรกิจ ชื่อโมดูล เส้นทางเรียกใช้ สวิตช์ตัวแปรสภาพแวดล้อมและรายละเอียดการเข้ารหัสยังอยู่ในส่วนถัดไปของหน้า ทั้งแคตตาล็อกบริการ ตารางสรุปโพรโทคอล และการกำกับสิทธิ์ นักพัฒนายังตรวจสอบทุกตัวเลขได้เหมือนเดิม",
  fi: "Nämä kortit sanovat vain, mitä liiketoiminnalle tapahtuu. Moduulinimet, päätepisteet, ympäristökytkimet ja salaustekniikka jäävät sivun myöhempään osaan — palveluluetteloon, protokollan pikaoppaaseen ja turvallisuusosioon — joten kehittäjä voi vielä tarkistaa jokaisen luvun.",
  uk: "Картки кажуть лише про те, що відбувається для бізнесу. Назви модулів, ендпоінти, перемикачі середовища та криптографія лишаються нижче: у каталозі сервісів, довіднику протоколу й розділі безпеки, тож розробчик досі може з’яссувати кожне число.",
  bg: "Картите казват само какво се случва за бизнеса. Имената на модулите, крайните точки, превключвателите и криптирането остават по-надолу: в каталога, справочника по протокола и раздела за сигурност, където разработчикът намира всяко число.",
  tr: "Bu kartlar yalnızca iş tarafında ne olduğunu anlatır. Modül adları, uç noktalar, ortam anahtarları ve şifreleme ayrıntıları sayfanın ilerisinde — hizmet kataloğu, protokol hızlı bakışı, yetki yönetişimi — geliştirici her sayıyı yine bulabilir.",
  hu: "A kártyák csak azt írják le, mi történik az üzletben. A modul-, végpont- és kapcsolónevek, a titkosítás részletei lejebb maradnak: szolgáltatáskatalógus, protokoll-gyorsreferencia, biztonság — így a fejlesztő is minden számot megnézhet.",
  "pt-BR": "Estes cartões dizem apenas o que acontece para o negócio. Nomes de módulos, endpoints, interruptores de ambiente e o detalhe criptográfico ficam mais abaixo na página — no catálogo de serviços, na referência rápida do protocolo e na seção de governança — para que um desenvolvedor ainda possa conferir cada número.",
  ko: "이 카드들은 업무에서 실제로 무슨 일이 일어나는지만 설명합니다. 모듈 이름, 엔드포인트, 환경 변수 스위치, 암호화 세부 사항은 페이지 아래쪽의 서비스 카탈로그, 프로토콜 빠른 참조, 거버넌스 섹션에 남겨 두었으므로 개발자는 여전히 모든 수치를 확인할 수 있습니다.",
  ar: "لا تقول هذه البطاقات إلا ما يحدث على صعيد العمل. أما أسماء الوحدات ونقاط النهاية ومفاتيح تبديل البيئة والتفاصيل التشفيرية فتبقى في موضع لاحق من الصفحة — في كتالوج الخدمات، والمرجع السريع للبروتوكول، وقسم الحوكمة — كي يظل بإمكان المطوّر الرجوع إلى كل رقم.",
};

const NOTE: Localized<string> = {
  en: "Five of these run on three plugin modules that ship with this release and are on by factory default: support, enquiry handling and your own model are all the one ai_agent module. The encrypted channel is core gateway behaviour, not a plugin. Everything runs on the gateway you deploy yourself, and the page you are reading loads no third-party script.",
  ru: "Пять из шести сценариев работают на трёх модулях плагинов этой поставки, включённых по умолчанию с завода: поддержка, обработка обращений и своя модель — это один и тот же модуль ai_agent. Шифрованный канал — поведение ядра шлюза, а не плагин. Всё работает на шлюзе, который вы развёртываете сами, и страница, которую вы сейчас читаете, не загружает сторонних скриптов.",
  de: "Von den sechs Szenarien laufen fünf auf drei Plugin-Modulen dieses Releases, die ab Werk aktiv sind: Support, automatische Anfragebearbeitung und eigenes Modell sind ein und dasselbe Modul ai_agent. Der verschlüsselte Kanal ist Kernverhalten des Gateways, kein Plugin. Alles läuft auf dem Gateway, das Sie selbst einsetzen, und die Seite, die Sie gerade lesen, lädt kein Skript Dritter.",
  fr: "Cinq des six tournent sur trois plugins livrés dans cette version, activés par défaut d’usine : support, traitement des demandes et votre propre modèle ne sont qu’un seul et même module ai_agent. Le canal chiffré relève de la passerelle, pas d’un plugin. Tout tourne sur la passerelle que vous déployez vous-même, et cette page n’embarque aucun script tiers.",
  it: "Cinque dei sei girano su tre plugin di questa release, attivi al valore di fabbrica: assistenza, gestione delle richieste e modello proprio sono uno e il medesimo modulo ai_agent. Il canale cifrato è nativo del gateway, non un plugin. Tutto gira sul gateway che dispieghi tu, e questa pagina non carica script di terze parti.",
  nl: "Van deze zes draaien vijf op drie pluginmodules van deze release, af fabriek aan: support, automatische vragenafhandeling en je eigen model zijn één en dezelfde pluginmodule ai_agent. Het versleutelde kanaal is kerngedrag van de gateway, geen plugin. Alles draait op de gateway die je zelf uitrolt, en de pagina die je nu leest laadt geen script van derden.",
  cs: "Z šesti scénářů jich pět běží na třech modulech, které tato verze přináší a které jsou od výroby zapnuté: podpora, automatické vyřizování dotazů i vlastní model jsou jeden a tentýž modul ai_agent. Šifrovaný kanál je chování jádra brány, ne plugin. Vše běží na bráně, kterou si sami nasadíte, a tato stránka nenačítá žádné cizí skripty.",
  "zh-Hans": "六个场景里有五个跑在三个随本版本发布、默认开启的插件模块上：客服、自动接待、接入自有模型用的都是同一个 ai_agent 模块。加密频道是网关的核心能力，不是插件。它们都跑在你自己部署的网关上，而你现在读的这个页面不加载任何第三方脚本。",
  "zh-Hant": "六個場景裡有五個跑在三個隨本版本發布、預設開啟的外掛模組上：客服、自動接待、接入自有模型用的都是同一個 ai_agent 模組。加密頻道是閘道的核心能力，不是外掛。它們都跑在你自己部署的閘道上，而你現在讀的這個頁面不載入任何第三方腳本。",
  es: "Cinco de los seis corren sobre tres complementos de esta versión, activos por valor de fábrica: soporte, gestión de consultas y modelo propio, los tres son un mismo módulo ai_agent. El canal cifrado es propio de la pasarela, no un complemento. Todo corre en la pasarela que despliegas tú, y esta página no carga scripts de terceros.",
  pl: "Pięć z sześciu scenariuszy działa na trzech modułach wtyczek dołączonych do tej wersji, włączonych z ustawienia fabrycznego: obsługa klienta, automatyczna obsługa zapytań i własny model to ten sam moduł ai_agent. Kanał szyfrowany to rdzeń bramy, nie wtyczka. Wszystko działa na bramie, którą sam wdrażasz, a ta strona nie ładuje skryptów podmiotów trzecich.",
  ja: "6つ中5つは、このリリースに同梱の、ファクトリーデフォルトでオンの3つのプラグインモジュールで動きます。サポート、自動応対、自分のモデルは同じ ai_agent モジュールです。暗号化チャンネルはプラグインでなくゲートウェイ本体の機能で、どれもあなたが自分で立てるゲートウェイで動きます。このページはサードパーティースクリプトを読み込みません。",
  th: "ห้าจากหกอย่างเป็นปลั๊กอินสามโมดูลที่มากับเวอร์ชันนี้และเปิดตามค่าเริ่มต้นจากโรงงาน: ฝ่ายสนับสนุน การรับเรื่องอัตโนมัติ และการเชื่อมโมเดลของคุณเองล้วนใช้โมดูล ai_agent อันเดียวกันทั้งหมด ส่วนช่องทางเข้ารหัสเป็นความสามารถหลักของเกตเวย์ ไม่ใช่ปลั๊กอิน ทั้งหมดรันบนเกตเวย์ที่คุณติดตั้งเอง และหน้าที่คุณกำลังอ่านอยู่นี้ไม่โหลดสคริปต์จากบุคคลที่สาม",
  fi: "Viisi kuudesta skenaariota käynnistyy kolmen tämän julkaisun mukana tulevan lisäosamoduulin varassa, tehtaalla oletuksena päällä: tuki, automaattinen käsittely ja oma malli ovat kaikki yhtä ja samaa ai_agent-moduulia. Salattu kanava on yhdyskänteen ydintoiminto, ei lisäosa. Kaikki käyvät yhdyskänteellä, jonka isännöit itse, eikä lukemasi sivu lataa kolmannen osapuolen skriptiä.",
  uk: "П’ять із шести сценаріїв працюють на трьох модулях плагінів цього випуску, типово увімкнених із заводу: підтримка, обробка звернень і власна модель — це один і той самий модуль ai_agent. Зашифрований канал — базова поведінка шлюза, а не плагін. Усе працює на шлюзі, який розгортаєте ви самі, а сторінка, яку ви зараз читаєте, не завантажує сторонніх скриптів.",
  bg: "Пет от шестте сценария работят на три плъгин-модула от това издание, включени по фабрична настройка: поддръжка, автоматична обработка и собствен модел — това е един и същ модул ai_agent. Криптираният канал е основно поведение на гейтуейта, не плъгин. Всичко работи на собствения ви гейтуейт, който сами разгръщате, а страницата, която четете сега, не зарежда чужди скриптове.",
  tr: "Altı senaryonun beşi, bu sürümle gelen ve fabrika çıkışında varsayılan olarak açık olan üç eklenti modülünde çalışır: destek, otomatik karşılama ve kendi modeliniz hepsi aynı ai_agent modülüdür. Şifreli kanal eklenti değil, ağ geçidinin çekirdek davranışıdır. Hepsi sizin kurduğunuz ağ geçidinde çalışır; okuduğunuz bu sayfa üçüncü taraf betik yüklemiyor.",
  hu: "A hat forgatókönyvből öt a kiadás három bővítménymodulján fut, gyárilag bekapcsolva: az ügyfélszolgálat, az automatikus ügyintézés és a saját modell mind ugyanaz az ai_agent modul. A titkosított csatorna az átjáró alapviselkedése, nem bővítmény. Minden a magad telepítette átjárón fut, és ez az oldal nem tölt be harmadik féltől származó szkriptet.",
  "pt-BR": "Cinco deles rodam em três módulos de plug-in que acompanham esta versão e vêm ligados por padrão de fábrica: suporte, tratamento de consultas e seu próprio modelo são todos o mesmo módulo ai_agent. O canal criptografado é comportamento central do gateway, não um plug-in. Tudo roda no gateway que você mesmo implanta, e a página que você está lendo não carrega nenhum script de terceiros.",
  ko: "이 중 다섯 가지는 이번 릴리스에 포함되어 출고 기본값으로 켜져 있는 세 개의 플러그인 모듈에서 동작합니다. 고객 지원, 문의 처리, 자체 모델은 모두 하나의 ai_agent 모듈입니다. 암호화 채널은 플러그인이 아니라 게이트웨이 코어의 동작입니다. 모든 것은 직접 배포한 게이트웨이에서 실행되며, 지금 보고 있는 페이지는 서드파티 스크립트를 전혀 불러오지 않습니다.",
  ar: "خمسة من هذه السيناريوهات تعمل على ثلاث وحدات إضافات تأتي مع هذا الإصدار ومفعّلة افتراضيًا من المصنع: الدعم، ومعالجة الاستفسارات، ونموذجك الخاص كلها الوحدة نفسها ai_agent. أما القناة المشفّرة فهي سلوك أصيل في البوابة وليست إضافة. وكل شيء يعمل على البوابة التي تنشرها بنفسك، والصفحة التي تقرأها الآن لا تحمّل أي سكربت من طرف ثالث.",
};

const STATE_ON: Localized<string> = {
  en: "On by factory default",
  ru: "Включён по умолчанию с завода",
  de: "Ab Werk standardmäßig aktiv",
  fr: "Activé par défaut d’usine",
  it: "Attivo al valore di fabbrica",
  nl: "Standaard aan als fabrieksinstelling",
  cs: "Zapnuto ve výchozím stavu z výroby",
  "zh-Hans": "默认开启",
  "zh-Hant": "預設開啟",
  es: "Activo por defecto de fábrica",
  pl: "Włączone domyślnie, z ustawienia fabrycznego",
  ja: "ファクトリーデフォルトでオン",
  th: "เปิดตามค่าเริ่มต้นจากโรงงาน",
  fi: "Päällä tehtaalla oletuksena",
  uk: "Типово увімкнено із заводу",
  bg: "Включен по фабрична настройка",
  tr: "Fabrika çıkışında varsayılan olarak açık",
  hu: "Gyárilag alapértelmezés szerint bekapcsolva",
  "pt-BR": "Ligado por padrão de fábrica",
  ko: "출고 기본값으로 켜짐",
  ar: "مفعّلة افتراضيًا من المصنع",
};

const STATE_CORE: Localized<string> = {
  en: "Core gateway behaviour, not a plugin",
  ru: "Поведение ядра шлюза, а не плагин",
  de: "Kernverhalten des Gateways, kein Plugin",
  fr: "Cœur de passerelle, pas un plugin",
  it: "Nativo del gateway, non un plugin",
  nl: "Kerngedrag van de gateway, geen plugin",
  cs: "Chování jádra brány, ne plugin",
  "zh-Hans": "网关核心能力，非插件",
  "zh-Hant": "閘道核心能力，非外掛",
  es: "Núcleo de pasarela, no un complemento",
  pl: "Zachowanie rdzenia bramy, nie wtyczka",
  ja: "ゲートウェイ本体の機能、プラグインではない",
  th: "ความสามารถหลักของเกตเวย์ ไม่ใช่ปลั๊กอิน",
  fi: "Yhdyskänteen ydintoiminto, ei lisäosa",
  uk: "Поведінка ядра шлюза, а не плагін",
  bg: "Основно поведение на гейтуейта, не плъгин",
  tr: "Ağ geçidinin çekirdek davranışı, eklenti değil",
  hu: "Az átjáró alapviselkedése, nem bővítmény",
  "pt-BR": "Comportamento central do gateway, não um plug-in",
  ko: "플러그인이 아닌 게이트웨이 코어 동작",
  ar: "سلوك أصيل في البوابة، لا إضافة",
};

const STATE_ENV: Localized<string> = {
  en: "An environment switch, no extra plugin",
  ru: "Переключатель окружения, без дополнительного плагина",
  de: "Schalter per Umgebungsvariable, kein extra Plugin",
  fr: "Un commutateur d’environnement, aucun plugin en plus",
  it: "Un commutatore d’ambiente, nessun plugin in più",
  nl: "Schakelaar via omgevingswaarden, geen extra plugin",
  cs: "Přepínač v proměnných prostředí, žádný další plugin",
  "zh-Hans": "环境变量开关，不额外装插件",
  "zh-Hant": "環境變數開關，不額外裝外掛",
  es: "Un conmutador de entorno, no un complemento extra",
  pl: "Przełącznik w zmiennych środowiskowych, bez dodatkowej wtyczki",
  ja: "環境変数スイッチ、追加プラグイン不要",
  th: "สวิตช์ตัวแปรสภาพแวดล้อม ไม่ต้องติดตั้งปลั๊กอินเพิ่ม",
  fi: "Ympäristökytkin, ei ylimääräistä lisäosaa",
  uk: "Перемикач середовища, без додаткового плагіна",
  bg: "Превключвател на средата, без допълнителен плъгин",
  tr: "Bir ortam anahtarı, ek eklenti gerekmez",
  hu: "Környezeti kapcsoló, nem külön bővítmény",
  "pt-BR": "Um interruptor de ambiente, sem plug-in extra",
  ko: "환경 변수 스위치만으로 동작, 추가 플러그인 없음",
  ar: "مفتاح في إعدادات البيئة، دون أي إضافة",
};

const AI_NAME: Localized<string> = {
  en: "AI customer support",
  ru: "AI-поддержка клиентов",
  de: "KI-Kundensupport",
  fr: "Assistance client par IA",
  it: "Supporto clienti con IA",
  nl: "AI-klantenservice",
  cs: "Zákaznická podpora s AI",
  "zh-Hans": "AI 客服接待",
  "zh-Hant": "AI 客服接待",
  es: "Atención al cliente IA",
  pl: "Obsługa klienta AI",
  ja: "AI カスタマーサポート",
  th: "ฝ่ายสนับสนุนลูกค้าด้วย AI",
  fi: "Tekoälyn asiakastuki",
  uk: "AI-підтримка клієнтів",
  bg: "AI поддръжка на клиенти",
  tr: "Yapay zekâ müşteri desteği",
  hu: "Ügyfélszolgálat MI-ügynökkel",
  "pt-BR": "Suporte ao cliente com IA",
  ko: "AI 고객 지원",
  ar: "دعم العملاء بالذكاء الاصطناعي",
};

const AI_ACTOR: Localized<string> = {
  en: "Support · shop floor",
  ru: "Поддержка · торговый зал",
  de: "Support · Verkaufsfläche",
  fr: "Assistance · magasin",
  it: "Supporto · punto vendita",
  nl: "Support · winkel",
  cs: "Podpora · prodejna",
  "zh-Hans": "客服 · 门店",
  "zh-Hant": "客服 · 門市",
  es: "Soporte · tienda",
  pl: "Obsługa klienta · sklep",
  ja: "問い合わせ窓口 · 店舗",
  th: "ฝ่ายสนับสนุน · หน้าร้าน",
  fi: "Tuki · myymälä",
  uk: "Підтримка · торговий зал",
  bg: "Поддръжка · търговска зала",
  tr: "Destek · satış noktası",
  hu: "Ügyfélszolgálat · bolt",
  "pt-BR": "Suporte · loja",
  ko: "고객 지원 · 매장 현장",
  ar: "الدعم · صالة المتجر",
};

const AI_TAGLINE: Localized<string> = {
  en: "A follower asks in the service account; the model you configured answers.",
  ru: "Подписчик пишет в сервисном аккаунте — отвечает настроенная вами модель.",
  de: "Ein Follower fragt im Service-Konto; das von Ihnen konfigurierte Modell antwortet.",
  fr: "Un abonné écrit dans le compte de service ; votre modèle répond.",
  it: "Un follower scrive nell’account di servizio; risponde il modello che hai scelto.",
  nl: "Een volger vraagt iets in het serviceaccount; het model dat je instelde antwoordt.",
  cs: "Follower se zeptá v servisním účtu; odpoví model, který jste nastavili.",
  "zh-Hans": "粉丝在服务号里问一句，你配置的模型答一句。",
  "zh-Hant": "粉絲在服務號裡問一句，你設定的模型答一句。",
  es: "Un seguidor pregunta en la cuenta de servicio; responde tu modelo.",
  pl: "Obserwujący pyta w koncie serwisowym, odpowiada model, który skonfigurowałeś.",
  ja: "フォロワーがサービスアカウントで質問すると、設定したモデルが答えます。",
  th: "ผู้ติดตามถามในบัญชีบริการ โมเดลที่คุณตั้งไว้ก็ตอบกลับ",
  fi: "Seuraaja kysyy palvelutilissä, ja sinun määrittämäsi malli vastaa.",
  uk: "Підписник пише в сервісному акаунті — відповідає налаштована вами модель.",
  bg: "Последовател пита в сервизния акаунт, отговаря моделът, който сте настроили.",
  tr: "Takipçi hizmet hesabında sorar; sizin yapılandırdığınız model yanıtlar.",
  hu: "Egy követő kérdez a szolgáltatási fiókban; az általad beállított modell válaszol.",
  "pt-BR": "Um seguidor pergunta na conta de serviço; o modelo que você configurou responde.",
  ko: "팔로워가 서비스 계정에서 질문하면 설정한 모델이 답변합니다.",
  ar: "يسأل أحد المتابعين في حساب الخدمة، فيجيب النموذج الذي أعددته.",
};

const AI_BODY: Localized<string> = {
  en: "Conversations are filed under an anonymous pairwise_uid in the ai_messages table on your own server, and the factory system prompt says outright that no personal identifier is requested. A turn the model cannot answer is not billed.",
  ru: "Диалоги сохраняются в таблице ai_messages на вашем собственном сервере под анонимным pairwise_uid, а заводской системный промпт прямо запрещает запрашивать персональные данные. За ход без ответа модели списание не идёт.",
  de: "Gespräche liegen unter einem anonymen pairwise_uid in der Tabelle ai_messages auf Ihrem eigenen Server. Der Systemprompt ab Werk sagt ausdrücklich, dass nach keinen persönlichen Daten gefragt wird. Eine Antwort, die das Modell nicht schafft, wird nicht berechnet.",
  fr: "Les échanges tiennent dans la table ai_messages de votre serveur, indexés sur un pairwise_uid anonyme ; le prompt système d’usine dit sans détour qu’aucun identifiant personnel n’est demandé. Un tour sans réponse n’est pas facturé.",
  it: "Le conversazioni stanno nella tabella ai_messages del tuo server, indicizzate su un pairwise_uid anonimo, e il prompt di sistema di fabbrica dice che non si chiede alcun identificatore personale. Un turno senza risposta non viene addebitato.",
  nl: "Gesprekken staan onder een anonieme pairwise_uid in de tabel ai_messages op je eigen server. De systeemprompt af fabriek zegt expliciet dat er geen persoonsgegevens worden gevraagd. Een beurt die het model mist, wordt niet gefactureerd.",
  cs: "Konverzace se ukládají pod anonymní pairwise_uid do tabulky ai_messages na vašem vlastním serveru. Výchozí systémový prompt výslovně říká, že se nemá ptát po žádných osobních údajích. Kolo, na které model neodpoví, se neúčtuje.",
  "zh-Hans": "对话按匿名的 pairwise_uid 记在你自己服务器的 ai_messages 表里，出厂的系统提示词直接写着不索要任何个人身份信息；模型没答上来的那一轮不计费。",
  "zh-Hant": "對話按匿名的 pairwise_uid 記在你自己伺服器的 ai_messages 表裡，出廠的系統提示詞直接寫著不索要任何個人身分資訊；模型沒答上來的那一輪不計費。",
  es: "Las conversaciones quedan en la tabla ai_messages de tu servidor, indexadas por un pairwise_uid anónimo, y el prompt de sistema de fábrica dice que no se pide ningún identificador personal. Un turno sin respuesta no se factura.",
  pl: "Rozmowy trafiają do tabeli ai_messages na twoim własnym serwerze, opisane anonimowym pairwise_uid, a fabryczna instrukcja dla modelu wprost stanowi, że nie żąda on żadnych danych osobowych. Runda bez odpowiedzi modelu nie jest naliczana.",
  ja: "やり取りは匿名の pairwise_uid をキーに、自分のサーバーの ai_messages テーブルに記録されます。ファクトリーのシステムプロンプトは個人情報を要求しないと明記しており、モデルが答えられなかった回は課金されません。",
  th: "บทสนทนาถูกเก็บด้วย pairwise_uid แบบไม่ระบุตัวตนในตาราง ai_messages บนเซิร์ฟเวอร์ของคุณเอง และ system prompt จากโรงงานก็เขียนชัดว่าจะไม่ขอข้อมูลระบุตัวบุคคล รอบที่โมเดลตอบไม่ได้ไม่นับเครดิต",
  fi: "Keskustelot tallentuvat anonyymin pairwise_uid:n alle ai_messages-tauluun sinun omalla palvelimellasi, ja tehtaalla määritelty ohjeistus sanoo suoraan, ettei henkilötietoja kysytä. Vuoroa, johon malli ei vastannut, ei mitata.",
  uk: "Розмови зберігаються в таблиці ai_messages на вашому власному сервері під анонімним pairwise_uid, а заводський системний промпт прямо забороняє запитувати персональні дані. За хід без відповіді моделі списування не йде.",
  bg: "Разговорите се записват в таблицата ai_messages на собствения ви сървър под анонимен pairwise_uid, а фабричният системен подканващ текст изрично казва да не се искат лични данни. За ход без отговор на модела не се таксува.",
  tr: "Konuşmalar, kendi sunucunuzdaki ai_messages tablosunda anonim bir pairwise_uid altında dosyalanır ve fabrika sistem istemi hiçbir kişisel tanımlayıcı istenmediğini açıkça yazar. Modelin yanıtlayamadığı tur ölçüme girmez.",
  hu: "A beszélgetéseket egy névtelen pairwise_uid jelöli a saját szervered ai_messages táblájában, és a gyári rendszer-utasítás nyíltan kimondja, hogy nem kér személyes azonosítót. Azt a kört, amelyre a modell nem tud válaszolni, nem számolja fel.",
  "pt-BR": "As conversas ficam arquivadas sob um pairwise_uid anônimo na tabela ai_messages do seu próprio servidor, e o prompt de sistema de fábrica declara abertamente que nenhum identificador pessoal é solicitado. Uma rodada que o modelo não consegue responder não é cobrada.",
  ko: "대화는 자체 서버의 ai_messages 테이블에 익명 pairwise_uid 기준으로 저장되며, 출고 기본 시스템 프롬프트에는 개인 식별자를 요청하지 않는다고 명시되어 있습니다. 모델이 답변하지 못한 턴은 과금되지 않습니다.",
  ar: "تُحفظ المحادثات تحت معرّف مجهول pairwise_uid في جدول ai_messages على خادمك الخاص، وينص توجيه النظام الافتراضي صراحةً على عدم طلب أي معرّف شخصي. ولا تُحتسب رسوم عن دور لا يستطيع النموذج الإجابة عنه.",
};

const AI_S1: Localized<string> = {
  en: "A follower asks a question",
  ru: "Подписчик задаёт вопрос",
  de: "Ein Follower stellt eine Frage",
  fr: "Question posée dans le compte de service",
  it: "Domanda nell’account di servizio",
  nl: "Een volger stelt een vraag",
  cs: "Follower se zeptá",
  "zh-Hans": "粉丝在服务号提问",
  "zh-Hant": "粉絲在服務號提問",
  es: "Pregunta en la cuenta de servicio",
  pl: "Obserwujący zadaje pytanie",
  ja: "フォロワーがサービスアカウントで質問",
  th: "ผู้ติดตามถามในบัญชีบริการ",
  fi: "Seuraaja kysyy palvelutilissä",
  uk: "Підписник ставить запитання",
  bg: "Последовател задава въпрос",
  tr: "Takipçi hizmet hesabında sorar",
  hu: "Egy követő kérdez",
  "pt-BR": "Um seguidor faz uma pergunta",
  ko: "팔로워가 질문합니다",
  ar: "يطرح أحد المتابعين سؤالًا",
};

const AI_S2: Localized<string> = {
  en: "The gateway calls your model",
  ru: "Шлюз обращается к вашей модели",
  de: "Das Gateway ruft Ihr Modell auf",
  fr: "La passerelle appelle votre modèle",
  it: "Il gateway chiama il tuo modello",
  nl: "De gateway roept jouw model aan",
  cs: "Brána zavolá váš model",
  "zh-Hans": "网关调用你自己的模型",
  "zh-Hant": "閘道呼叫你自己的模型",
  es: "La pasarela llama a tu modelo",
  pl: "Brama wywołuje twój model",
  ja: "ゲートウェイが自分のモデルを呼ぶ",
  th: "เกตเวย์เรียกโมเดลของคุณ",
  fi: "Yhdyskäntä kutsuu sinun mallisi",
  uk: "Шлюз викликає вашу модель",
  bg: "Гейтуейтът извиква вашия модел",
  tr: "Ağ geçidi sizin modelinizi çağırır",
  hu: "Az átjáró hívja a te modelled",
  "pt-BR": "O gateway chama o seu modelo",
  ko: "게이트웨이가 모델을 호출합니다",
  ar: "تستدعي البوابة النموذج الخاص بك",
};

const AI_S3: Localized<string> = {
  en: "The transcript stays in your own database",
  ru: "Переписка остаётся в вашей базе",
  de: "Das Protokoll bleibt in Ihrer Datenbank",
  fr: "L’historique reste dans votre base",
  it: "La cronologia resta nel tuo database",
  nl: "Het transcript blijft in je eigen database",
  cs: "Přepis zůstává ve vaší databázi",
  "zh-Hans": "对话留在你自己的库里",
  "zh-Hant": "對話留在你自己的資料庫裡",
  es: "El historial queda en tu base",
  pl: "Rozmowa zostaje w twojej bazie",
  ja: "記録は自分のデータベースに残る",
  th: "บทสนทนาอยู่ในฐานข้อมูลของคุณ",
  fi: "Keskustelu jää sinun omaan tietokantaan",
  uk: "Розмова лишається у вашій базі",
  bg: "Разговорът остава във вашата база",
  tr: "Kayıt kendi veritabanınızda kalır",
  hu: "A leirat a saját adatbázisodban marad",
  "pt-BR": "O histórico fica no seu próprio banco de dados",
  ko: "대화 기록은 자체 데이터베이스에 남습니다",
  ar: "يبقى النص الكامل للمحادثة في قاعدة بياناتك",
};

const AI_LINK: Localized<string> = {
  en: "See its credential and data flow",
  ru: "Смотреть допуск и поток данных",
  de: "Credential und Datenfluss ansehen",
  fr: "Voir identifiant et flux de données",
  it: "Vedi credenziale e flusso di dati",
  nl: "Bekijk credential en datstroom",
  cs: "Pověření a tok dat",
  "zh-Hans": "看这个模块的凭据与数据流",
  "zh-Hant": "看這個模組的憑證與資料流",
  es: "Ver credencial y flujo de datos",
  pl: "Zobacz jego token i obieg danych",
  ja: "このプラグインの認証情報とデータフロー",
  th: "ดูข้อมูลใช้ยืนยันและการไหลของข้อมูล",
  fi: "Katso sen token ja tietovirta",
  uk: "Переглянути ключ допуску й потік даних",
  bg: "Вижте ключа и потока от данни",
  tr: "Kimlik bilgisine ve veri akışına bakın",
  hu: "Nézd meg a tokenjét és az adatfolyamát",
  "pt-BR": "Ver o fluxo de credencial e de dados",
  ko: "자격 증명과 데이터 흐름 확인하기",
  ar: "اطّلع على مسار بيانات الاعتماد والبيانات",
};

const AUTO_NAME: Localized<string> = {
  en: "Automated enquiry handling",
  ru: "Автоматическая обработка обращений",
  de: "Automatische Anfragebearbeitung",
  fr: "Traitement automatique des demandes",
  it: "Gestione automatica delle richieste",
  nl: "Automatische vragenafhandeling",
  cs: "Automatické vyřizování dotazů",
  "zh-Hans": "自动处理咨询",
  "zh-Hant": "自動處理諮詢",
  es: "Gestión automática de consultas",
  pl: "Automatyczna obsługa zapytań",
  ja: "問合せ自動応対",
  th: "รับเรื่องสอบถามอัตโนมัติ",
  fi: "Tiedustelujen automaattinen käsittely",
  uk: "Автоматична обробка звернень",
  bg: "Автоматична обработка на запитвания",
  tr: "Bilgi taleplerinin otomatik karşılanması",
  hu: "Kérdések automatikus kezelése",
  "pt-BR": "Tratamento automatizado de consultas",
  ko: "자동 문의 처리",
  ar: "معالجة الاستفسارات تلقائيًا",
};

const AUTO_ACTOR: Localized<string> = {
  en: "Shop ops · after-sales",
  ru: "Магазин · послепродажное обслуживание",
  de: "Shopbetrieb · After-Sales",
  fr: "Opérations boutique · après-vente",
  it: "Operazioni punto vendita · post-vendita",
  nl: "Webshop-teams · after-sales",
  cs: "Provoz eshopu · poprodejní péče",
  "zh-Hans": "店铺运营 · 售后",
  "zh-Hant": "店面營運 · 售後",
  es: "Operaciones de tienda · posventa",
  pl: "Sklep · obsługa posprzedażowa",
  ja: "店舗運営 · アフターケア",
  th: "ฝ่ายหน้าร้าน · หลังการขาย",
  fi: "Kauppa · jälkimyynti",
  uk: "Магазин · післяпродажне обслуговування",
  bg: "Магазин · следпродабно обслужване",
  tr: "Mağaza operasyonu · satış sonrası",
  hu: "Bolt · értékesítés után",
  "pt-BR": "Operação da loja · pós-venda",
  ko: "매장 운영 · 애프터서비스",
  ar: "عمليات المتجر · خدمة ما بعد البيع",
};

const AUTO_TAGLINE: Localized<string> = {
  en: "The questions you already have an answer for never reach a person.",
  ru: "Вопросы, на которые вы уже знаете ответ, не доходят до живого человека.",
  de: "Fragen, auf die Sie schon eine Antwort haben, erreichen nie eine Person.",
  fr: "Les questions auxquelles vous avez déjà une réponse n’arrivent jamais à une personne.",
  it: "Le domande a cui hai già risposto non arrivano mai a una persona.",
  nl: "Vragen waar je al antwoord op hebt, hoeven nooit een persoon te bereiken.",
  cs: "Otázky, na které už odpověď máte, nikdy nedorazí k člověku.",
  "zh-Hans": "你早有答案的那批问题，不必再经人手。",
  "zh-Hant": "你早有答案的那批問題，不必再經人手。",
  es: "Las preguntas para las que ya tienes respuesta no llegan a una persona.",
  pl: "Pytania, na które masz już odpowiedź, w ogóle nie docierają do człowieka.",
  ja: "答えが決まっている質問は、人に届かなくなります。",
  th: "คำถามที่คุณมีคำตอบอยู่แล้ว ไม่ต้องส่งไปถึงคนเลย",
  fi: "Kysymykset, joihin sinulla on jo vastaus, eivät koskaan päädy ihmiselle.",
  uk: "Питання, на які ви вже маєте відповідь, не потрапляють до живої людини.",
  bg: "Въпросите, на които вече имате отговор, не стигат до жив човек.",
  tr: "Zaten yanıtını bildiğiniz sorular bir insana hiç ulaşmaz.",
  hu: "Azok a kérdések, amelyekre már van válaszod, soha nem érkeznek emberhez.",
  "pt-BR": "As perguntas para as quais você já tem resposta nunca chegam a uma pessoa.",
  ko: "이미 답이 있는 질문은 상담원에게 도달하지 않습니다.",
  ar: "الأسئلة التي لديك إجابة عنها مسبقًا لا تصل إلى أي شخص.",
};

const AUTO_BODY: Localized<string> = {
  en: "A two-level bottom menu (3 × 5) carries the standing answers, and pushing it costs no model call; whatever the menu misses goes into the AI reply loop, capped by factory default at POPOPX_AI_RATE_LIMIT_MESSAGES=20 per follower inside POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Every round is filed under the same anonymous pairwise_uid, so a person picking the thread up reads one transcript and answers back with POST /api/v1/send/text.",
  ru: "Двухуровневое нижнее меню (3 × 5) держит готовые ответы, а нажатие не стоит вызова модели; что меню не покрыло, уходит в цикл AI-ответов под заводским лимитом POPOPX_AI_RATE_LIMIT_MESSAGES=20 на подписчика за POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Раунды записаны под тем же анонимным pairwise_uid: подхвативший диалог человек читает одну ленту переписки и отвечает через POST /api/v1/send/text.",
  de: "Das zweistufige Menü unten (3 × 5) trägt die Standardantworten, ein Druck kostet keinen Modellaufruf; was es nicht abdeckt, geht in die AI-Schleife, ab Werk begrenzt auf POPOPX_AI_RATE_LIMIT_MESSAGES=20 pro Follower innerhalb von POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Alles liegt unter demselben anonymen pairwise_uid, wer übernimmt, liest ein Protokoll und antwortet mit POST /api/v1/send/text.",
  fr: "Le menu du bas à deux niveaux (3 × 5) écoule les réponses figées ; le pousser coûte zéro appel de modèle. Le reste va dans la boucle IA, plafonnée par défaut d’usine à POPOPX_AI_RATE_LIMIT_MESSAGES=20 par abonné dans POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Tout s’archive sous le même pairwise_uid anonyme : qui reprend lit un seul historique, répond par POST /api/v1/send/text.",
  it: "Un menu in basso a due livelli (3 × 5) smaltisce le risposte pronte; premerlo costa zero chiamate al modello. Il resto va nel ciclo IA, limitato al valore di fabbrica a POPOPX_AI_RATE_LIMIT_MESSAGES=20 per follower entro POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Tutto resta sotto lo stesso pairwise_uid anonimo: chi riprende legge una sola cronologia, risponde con POST /api/v1/send/text.",
  nl: "Het tweelaagse menu onderin (3 × 5) bevat de standaardantwoorden, één tik kost geen modelaanroep; wat het menu mist, gaat de AI-loop in, af fabriek beperkt tot POPOPX_AI_RATE_LIMIT_MESSAGES=20 per volger binnen POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Alles staat onder dezelfde anonieme pairwise_uid, dus wie overneemt leest één transcript en antwoordt met POST /api/v1/send/text.",
  cs: "Dvouúrovňové menu dole (3 × 5) drží stálé odpovědi a jedno stisknutí stojí nula modelových volání; co menu nepokryje, jde do AI smyčky, od výroby omezené na POPOPX_AI_RATE_LIMIT_MESSAGES=20 na followera uvnitř POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Vše se ukládá pod týmž anonymním pairwise_uid, takže člověk čte jediný přepis a odpoví přes POST /api/v1/send/text.",
  "zh-Hans": "两级底部菜单（3 × 5）先接掉那些固定问答，推一次菜单不消耗任何模型调用；菜单没盖到的落进 AI 自动应答，出厂默认每位粉丝在 POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS（300 秒）内最多 POPOPX_AI_RATE_LIMIT_MESSAGES（20）条。每一轮都记在同一个匿名 pairwise_uid 下，人接手时只读一份留痕，再用 POST /api/v1/send/text 回一句。",
  "zh-Hant": "兩級底部選單（3 × 5）先接掉那些固定問答，推一次選單不消耗任何模型呼叫；選單沒蓋到的落進 AI 自動應答，出廠預設每位粉絲在 POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS（300 秒）內最多 POPOPX_AI_RATE_LIMIT_MESSAGES（20）條。每一輪都記在同一個匿名 pairwise_uid 下，人接手時只讀一份留痕，再用 POST /api/v1/send/text 回一句。",
  es: "El menú inferior de dos niveles (3 × 5) resuelve las respuestas fijas; pulsarlo cuesta cero llamadas al modelo. Lo que no cubre va al bucle IA, limitado por valor de fábrica a POPOPX_AI_RATE_LIMIT_MESSAGES=20 por seguidor dentro de POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Todo queda bajo el mismo pairwise_uid anónimo: quien retoma lee un solo historial, responde con POST /api/v1/send/text.",
  pl: "Dwupoziomowe menu dolne (3 × 5) niesie gotowe odpowiedzi, a jego otwarcie nie kosztuje wywołania modelu; resztę przejmuje pętla odpowiedzi AI, limitowana fabrycznie do POPOPX_AI_RATE_LIMIT_MESSAGES=20 na obserwującego w oknie POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Każda runda ląduje w tym samym anonimowym pairwise_uid, więc przejmujący wątek czyta jeden zapis i odpowiada przez POST /api/v1/send/text.",
  ja: "2階層の底部メニュー（3 × 5）が決まり切った問答を受け持ち、メニューを送ってもモデル呼び出しを1回も消費しません。メニューが取りこぼした分は AI 自動応答に入り、ファクトリーデフォルトではフォロワー1人あたり POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 秒以内に POPOPX_AI_RATE_LIMIT_MESSAGES=20 件までです。どの回も同じ匿名の pairwise_uid に記録されるので、人が引き継ぐときはひとつの会話記録を読み、POST /api/v1/send/text で一文返します。",
  th: "เมนูด้านล่างสองระดับ (3 × 5) รับคำถามที่มีคำตอบสำเร็จไว้ก่อน การส่งเมนูหนึ่งครั้งไม่เปลืองการเรียกโมเดลเลย ส่วนที่เมนูไม่ครอบคลุมก็ตกเข้าวงจร AI อัตโนมัติ ซึ่งจำกัดตามค่าเริ่มต้นจากโรงงานว่าผู้ติดตามแต่ละคนได้ไม่เกิน POPOPX_AI_RATE_LIMIT_MESSAGES=20 ข้อความ ภายใน POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 วินาที ทุกครั้งถูกเก็บไว้ใต้ pairwise_uid แบบไม่ระบุตัวตนอันเดียวกัน คนที่รับช่วงต่อจึงอ่านบันทึกเพียงชุดเดียว แล้วตอบกลับด้วย POST /api/v1/send/text",
  fi: "Kaksitasoinen alavalikko (3 × 5) kantaa valmiit vastaukset, eikä sen lähettäminen maksa mallikutsua; mitä valikko ei kata, siirtyy AI-vastauskiertoon, joka on rajattu tehtaalla arvoon POPOPX_AI_RATE_LIMIT_MESSAGES=20 seuraajaa kohden ikkunassa POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Jokainen vuoro tallentuu saman anonyymin pairwise_uid:n alle, joten langan poimiva henkilö lukee yhtä ainoaa lokia ja vastaa POST /api/v1/send/text.",
  uk: "Дворівневе нижнє меню (3 × 5) тримає готові відповіді, а натискання не коштує виклику моделі; що меню не закрыло, іде в цикл AI-відповідей із заводським лімітом POPOPX_AI_RATE_LIMIT_MESSAGES=20 на підписника за POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Раунди пишуться під тим самим анонімним pairwise_uid: людина, що підхоплює розмову, читає одну стрічку й відповідає через POST /api/v1/send/text.",
  bg: "Двунивковото долно меню (3 × 5) държи готовите отговори, а докосване не коства извик на модела; което менюто не покрие, влиза в AI цикъла с фабрично ограничение POPOPX_AI_RATE_LIMIT_MESSAGES=20 за последовател в POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Размените са под един и същ анонимен pairwise_uid, затова поемащият чете една лента и отговаря с POST /api/v1/send/text.",
  tr: "İki düzeyli alt menü (3 × 5) hazır yanıtları üstlenir; menüyü bir kez göndermek hiçbir model çağrısı harcatmaz. Menünün kaçırdığı, fabrika çıkışında takipçi başına POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 saniye içinde POPOPX_AI_RATE_LIMIT_MESSAGES=20 mesajla sınırlı AI yanıt döngüsüne düşer. Her tur aynı anonim pairwise_uid altına dosyalanır; devralan kişi tek bir kaydı okur ve yanıtını POST /api/v1/send/text ile verir.",
  hu: "A kétszintű alsó menü (3 × 5) viszi a rögzített válaszokat, és a kiküldése nem kerül egy modellhívásba sem; ami kimarad, AI-válaszoló hurokba megy, gyári korláttal: követőnként POPOPX_AI_RATE_LIMIT_MESSAGES=20 a POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 másodperces ablakban. Minden kör azonos névtelen pairwise_uid mögé kerül, az átvevő egyetlen leiratot olvas, és POST /api/v1/send/text hívással válaszol.",
  "pt-BR": "Um menu inferior de dois níveis (3 × 5) carrega as respostas prontas, e enviá-lo não custa nenhuma chamada ao modelo; o que o menu não cobre entra no ciclo de respostas de IA, limitado por padrão de fábrica a POPOPX_AI_RATE_LIMIT_MESSAGES=20 por seguidor dentro de POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. Cada rodada fica arquivada sob o mesmo pairwise_uid anônimo, então uma pessoa que assume a conversa lê um único histórico e responde com POST /api/v1/send/text.",
  ko: "2단계 하단 메뉴(3 × 5)에 상시 답변을 담아 두며, 메뉴를 푸시하는 데는 모델 호출이 들지 않습니다. 메뉴가 놓친 질문은 AI 응답 루프로 넘어가고, 출고 기본값으로 팔로워당 POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300 이내에 POPOPX_AI_RATE_LIMIT_MESSAGES=20회로 제한됩니다. 모든 라운드는 동일한 익명 pairwise_uid로 기록되므로, 상담원이 스레드를 이어받아 대화 기록 하나를 읽고 POST /api/v1/send/text로 답장합니다.",
  ar: "تحمل قائمة سفلية من مستويين (3 × 5) الإجابات الجاهزة، وإرسالها لا يكلّف أي استدعاء للنموذج؛ وما لا تغطيه القائمة يدخل حلقة الرد بالذكاء الاصطناعي، المقيّدة افتراضيًا من المصنع عند POPOPX_AI_RATE_LIMIT_MESSAGES=20 لكل متابع ضمن POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300. وتُحفظ كل جولة تحت معرّف pairwise_uid المجهول نفسه، فيقرأ من يتولّى المحادثة نصًا واحدًا كاملًا ويرد عبر POST /api/v1/send/text.",
};

const AUTO_S1: Localized<string> = {
  en: "Standing answers go into the two-level menu",
  ru: "Готовые ответы лежат в двухуровневом меню",
  de: "Standardantworten stehen im zweistufigen Menü",
  fr: "Réponses figées dans le menu à deux niveaux",
  it: "Risposte pronte nel menu a due livelli",
  nl: "Standaardantwoorden gaan in het tweelaagse menu",
  cs: "Stálé odpovědi patří do dvouúrovňového menu",
  "zh-Hans": "固定问答放进两级菜单",
  "zh-Hant": "固定問答放進兩級選單",
  es: "Las respuestas fijas van al menú de dos niveles",
  pl: "Stałe odpowiedzi trafiają do menu dwupoziomowego",
  ja: "固定の問答を2階層メニューに",
  th: "ใส่คำตอบสำเร็จไว้ในเมนูสองระดับ",
  fi: "Vakiovastaukset menevät kaksitasoiseen alavalikkoon",
  uk: "Готові відповіді лежать у дворівневому меню",
  bg: "Готовите отговори са в менюто с две нива",
  tr: "Hazır yanıtları iki düzeyli menü taşısın",
  hu: "A rögzített válaszok a kétszintű menübe kerülnek",
  "pt-BR": "As respostas prontas entram no menu de dois níveis",
  ko: "상시 답변은 2단계 메뉴에 담깁니다",
  ar: "تُدرج الإجابات الجاهزة في القائمة ذات المستويين",
};

const AUTO_S2: Localized<string> = {
  en: "The rest hits the AI loop, rate-limited per follower",
  ru: "Остальное — в цикл AI-ответов, лимит на подписчика",
  de: "Der Rest läuft in die AI-Schleife, pro Follower begrenzt",
  fr: "Le reste : boucle IA plafonnée par abonné",
  it: "Resto al ciclo IA, con limite per follower",
  nl: "De rest gaat de AI-loop in, met volgerlimiet",
  cs: "Zbytek jde do AI smyčky, s limitem na followera",
  "zh-Hans": "其余进 AI 应答，按粉丝限速",
  "zh-Hant": "其餘進 AI 應答，按粉絲限速",
  es: "Resto al bucle IA, con límite por seguidor",
  pl: "Reszta trafia do pętli AI z limitem na obserwującego",
  ja: "残りは AI 応答、フォロワー別に制限",
  th: "ที่เหลือเข้าวงจร AI และจำกัดอัตราตามผู้ติดตาม",
  fi: "Loput menevät AI-kiertoon, rajoitus seuraajaa kohden",
  uk: "Решта — в AI-цикл з обмеженням на підписника",
  bg: "Останалото — в AI цикъла с лимит за последовател",
  tr: "Kalanı AI döngüsü alır, takipçi başına sınırlı",
  hu: "A többi az AI-hurokba megy, követőnként korlátozva",
  "pt-BR": "O restante cai no ciclo de IA, com limite de taxa por seguidor",
  ko: "나머지는 팔로워별로 제한된 AI 루프로 들어갑니다",
  ar: "وما تبقّى يصل إلى حلقة الذكاء الاصطناعي، بمعدّل محدود لكل متابع",
};

const AUTO_S3: Localized<string> = {
  en: "A person reads one transcript and replies in one call",
  ru: "Человек читает одну ленту переписки и отвечает одним вызовом",
  de: "Ein Mensch liest ein Protokoll, antwortet mit einem Aufruf",
  fr: "Une personne relit un historique, répond en un appel",
  it: "Una persona legge una cronologia, risponde in una chiamata",
  nl: "Eén persoon leest één transcript, antwoordt in één aanroep",
  cs: "Člověk čte jediný přepis a odpoví jedním voláním",
  "zh-Hans": "人读同一份留痕，一次调用回一句",
  "zh-Hant": "人讀同一份留痕，一次呼叫回一句",
  es: "Una persona lee un historial, responde en una llamada",
  pl: "Człowiek czyta jeden zapis i odpowiada jednym wywołaniem",
  ja: "人は同一の履歴を読み、1回の呼び出しで返信",
  th: "คนอ่านบันทึกชุดเดียวแล้วตอบด้วยการเรียกครั้งเดียว",
  fi: "Ihminen lukee yhtä lokia ja vastaa yhdellä kutsulla",
  uk: "Людина читає одну стрічку й відповідає одним викликом",
  bg: "Човек чете една лента и отговаря с едно извикване",
  tr: "Bir kişi tek kaydı okur, tek çağrıyla yanıtlar",
  hu: "Egy ember egyetlen leiratot olvas, egy hívással válaszol",
  "pt-BR": "Uma pessoa lê um único histórico e responde em uma chamada",
  ko: "상담원이 기록 하나를 읽고 한 번의 호출로 답장합니다",
  ar: "يقرأ أحد أفراد الفريق نصًا واحدًا ويرد باستدعاء واحد",
};

const AUTO_LINK: Localized<string> = {
  en: "See the menu shape and what it costs",
  ru: "Смотреть устройство меню и его стоимость",
  de: "Menüaufbau und Kosten ansehen",
  fr: "Voir la structure du menu et son coût",
  it: "Vedi la forma del menu e cosa costa",
  nl: "Bekijk menuopbouw en wat het kost",
  cs: "Zobrazte strukturu menu a co stojí",
  "zh-Hans": "看菜单结构与计量",
  "zh-Hant": "看選單結構與計量",
  es: "Ver la forma del menú y su coste",
  pl: "Zobacz kształt menu i ile kosztuje",
  ja: "メニュー構成と計量を見る",
  th: "ดูโครงสร้างเมนูและการนับเครดิต",
  fi: "Katso valikon muoto ja mitä se maksaa",
  uk: "Переглянути будову меню та його вартість",
  bg: "Вижте устройството на менюто и цената му",
  tr: "Menü yapısına ve ölçüme bakın",
  hu: "Nézd meg a menü felépítését és a költségét",
  "pt-BR": "Ver o formato do menu e quanto ele custa",
  ko: "메뉴 구조와 비용 확인하기",
  ar: "اطّلع على بنية القائمة وتكلفتها",
};

const CHANNEL_NAME: Localized<string> = {
  en: "Encrypted channel publishing",
  ru: "Публикация в шифрованный канал",
  de: "Verschlüsselte Kanalveröffentlichung",
  fr: "Publication sur canal chiffré",
  it: "Pubblicazione su canale cifrato",
  nl: "Versleuteld kanaal publiceren",
  cs: "Šifrované vysílání kanálu",
  "zh-Hans": "加密频道发布",
  "zh-Hant": "加密頻道發布",
  es: "Publicación en canal cifrado",
  pl: "Publikacja w szyfrowanym kanale",
  ja: "暗号化チャンネルの配信",
  th: "เผยแพร่ผ่านช่องทางเข้ารหัส",
  fi: "Salatun kanavan julkaisu",
  uk: "Публікація в зашифрований канал",
  bg: "Публикуване в криптиран канал",
  tr: "Şifreli kanal yayıncılığı",
  hu: "Közzététel titkosított csatornán",
  "pt-BR": "Publicação em canal criptografado",
  ko: "암호화 채널 게시",
  ar: "النشر في قناة مشفّرة",
};

const CHANNEL_ACTOR: Localized<string> = {
  en: "Content · brand account",
  ru: "Контент · аккаунт бренда",
  de: "Redaktion · Markenkonto",
  fr: "Contenu · compte de marque",
  it: "Contenuti · account del brand",
  nl: "Content · merkaccount",
  cs: "Obsah · účet značky",
  "zh-Hans": "内容 · 品牌号",
  "zh-Hant": "內容 · 品牌號",
  es: "Contenido · cuenta de marca",
  pl: "Treści · konto marki",
  ja: "コンテンツ · ブランドアカウント",
  th: "ฝ่ายเนื้อหา · บัญชีแบรนด์",
  fi: "Sisältö · bränditili",
  uk: "Контент · акаунт бренду",
  bg: "Съдържание · бранд акаунт",
  tr: "İçerik · marka hesabı",
  hu: "Tartalom · márkafiók",
  "pt-BR": "Conteúdo · conta da marca",
  ko: "콘텐츠 · 브랜드 계정",
  ar: "المحتوى · حساب علامة تجارية",
};

const CHANNEL_TAGLINE: Localized<string> = {
  en: "Publish once, every subscriber receives it, and the relay only ever sees ciphertext.",
  ru: "Одна публикация — все подписчики получают, ретранслятор видит только шифртекст.",
  de: "Einmal veröffentlichen, jeder Abonnent erhält es, und das Relay sieht nur Chiffretext.",
  fr: "Une publication, tous les abonnés la reçoivent, le relais ne voit que du chiffré.",
  it: "Pubblica una volta, ogni follower riceve, e il relay vede solo testo cifrato.",
  nl: "Eén keer publiceren, elke abonnee krijgt het, en de relay ziet alleen cijertext.",
  cs: "Napsat jednou, dostane to každý odběratel, a relay uvidí jen šifrový text.",
  "zh-Hans": "一次发布扇出给全部订阅者，中继只见密文。",
  "zh-Hant": "一次發布扇出給全部訂閱者，中繼只見密文。",
  es: "Publicas una vez, cada seguidor lo recibe, y el relay solo ve texto cifrado.",
  pl: "Raz opublikowany post trafia do wszystkich uczestników, a przekaźnik widzi tylko zaszyfrowany tekst.",
  ja: "1回の投稿がメンバー全員に届き、リレーに見えるのは暗号文だけです。",
  th: "เผยแพร่ครั้งเดียวถึงสมาชิกทุกคน รีเลย์เห็นเฉพาะข้อมูลที่ถูกเข้ารหัส",
  fi: "Julkaise kerran, jokainen jäsen saa sen, ja välityssolmu näkee vain salattua tekstiä.",
  uk: "Одна публікація — усі підписники отримують, ретранслятор бачить лише шифротекст.",
  bg: "Едно публикуване — всички последователи получават, ретранслаторът вижда само шифротекст.",
  tr: "Tek yayın her aboneye ulaşır; röle yalnızca şifreli metni görür.",
  hu: "Egyetlen közzététel, minden tag megkapja, és a közvetítő mindig csak titkosított szöveget lát.",
  "pt-BR": "Publique uma vez, todos os assinantes recebem, e o relay só vê texto cifrado.",
  ko: "한 번 게시하면 모든 구독자가 받고, 릴레이는 언제나 암호문만 봅니다.",
  ar: "انشر مرة واحدة، فيتلقاه كل مشترك، ولا يرى المرحّل سوى نص مشفّر.",
};

const CHANNEL_BODY: Localized<string> = {
  en: "A post is sealed with the channel's epoch key before it fans out, so the relay blind-stores frames it cannot read. The honest caveat: your own gateway is the issuer and holds the channel's Ed25519 pair and every epoch key.",
  ru: "Пост запечатывается ключом epoch канала до рассылки, поэтому ретранслятор хранит вслепую кадры, которые не может прочесть. Честная оговорка: эмитент — ваш собственный шлюз, он держит пару Ed25519 канала и каждый ключ epoch.",
  de: "Ein Beitrag wird vor dem Fan-out mit dem Epoch-Schlüssel des Kanals versiegelt; das Relay speichert die Rahmen blind. Der ehrliche Hinweis: Ihr eigenes Gateway ist der Aussteller und hält das Ed25519-Paar des Kanals und jeden Epoch-Schlüssel.",
  fr: "Le message est scellé sous la clé epoch du canal ; le relais ne stocke à l’aveugle que des trames qu’il ne peut lire. Point honnête : votre passerelle est l’émetteur, elle détient la paire Ed25519 et chaque clé epoch.",
  it: "Il post è sigillato con la chiave epoch del canale prima del fan-out; il relay deposita alla cieca frame che non può leggere. Nota onesta: il tuo gateway è l’emittente, custodisce la coppia Ed25519 e ogni chiave epoch.",
  nl: "Een bericht wordt vóór de fan-out verzegeld met de epochsleutel van het kanaal; de relay bewaart frames blind. Het eerlijke voorbehoud: je eigen gateway is de uitgever en houdt het Ed25519-paar en elke epochsleutel van dat kanaal.",
  cs: "Příspěvek se před rozosláním zapečetí epochovým klíčem kanálu, relay tedy slepě uloží rámečky, které nemůže přečíst. Upřímné upozornění: vydavatelem je vaše vlastní brána a drží Ed25519 pár kanálu i každý epochový klíč.",
  "zh-Hans": "图文先用频道的 epoch 密钥封装再发出去，中继只做盲存、读不到明文。要说清的一点是：签发方就是你自己的网关，它持有该频道的 Ed25519 密钥对和每一个 epoch 密钥。",
  "zh-Hant": "圖文先用頻道的 epoch 密鑰封装再發出去，中繼只做盲存、讀不到明文。要說清的一點是：簽發方就是你自己的閘道，它持有該頻道的 Ed25519 密鑰對和每一個 epoch 密鑰。",
  es: "El post se sella con la clave epoch del canal antes de distribuirse; el relay almacena a ciegas tramas que no puede leer. Aviso honesto: tu pasarela es el emisor, guarda el par Ed25519 y cada clave epoch.",
  pl: "Post jest zapieczętowany kluczem epoch kanału, zanim trafi do rozesłania, więc przekaźnik przechowuje ślepo ramki, których nie umie przeczytać. Trzeba powiedzieć wprost: wydawcą jest twoja brama, która trzyma parę Ed25519 kanału i każdy klucz epoch.",
  ja: "投稿は配信前にチャンネルの epoch 鍵で封をするため、リレーは読めないフレームを内容を判別せずに保管します。正直に言っておくべき点は、発行者はあなた自身のゲートウェイで、そのチャンネルの Ed25519 鍵ペアとすべての epoch 鍵を保有していることです。",
  th: "โพสต์ถูกผนึกด้วยคีย์ epoch ของช่องทางก่อนกระจายออก รีเลย์จึงเก็บเฟรมที่อ่านไม่ออกไว้โดยไม่เห็นเนื้อหา ข้อที่ต้องพูดตรง ๆ คือผู้ออกคีย์คือเกตเวย์ของคุณเอง ซึ่งถือคู่คีย์ Ed25519 ของช่องนั้นและคีย์ epoch ทุกอัน",
  fi: "Viesti sinetöidään kanavan epoch-avaimella ennen hajautusta, joten välityssolmu säilyttää sokeasti kehyksiä, joita se ei pysty lukemaan. Rehellinen huomautus: sinun oma yhdyskäntäsi on myöntäjä, ja sillä on kanavan Ed25519-pari ja jokainen epoch-avain.",
  uk: "Допис запечатується ключем epoch каналу ще до розсилки, тож ретранслятор зберігає наосліп кадри, які не може прочитати. Чесне застереження: емітент — це ваш власний шлюз, він тримає пару Ed25519 каналу та кожен ключ epoch.",
  bg: "Постът се запечатва с ключа на epoch преди разпръскването, затова ретранслаторът пази на сляпо кадри, които не може да прочете. Честното уточнение: издателят е собственият ви гейтуейт, който държи двойката Ed25519 на канала и всеки ключ на epoch.",
  tr: "Bir gönderi, dağıtılmadan önce kanalın epoch anahtarıyla mühürlendiği için röle okuyamadığı kareleri içeriğe bakmadan saklar. Dürüst not: çıkarıcı taraf sizin kendi ağ geçidinizdir; kanalın Ed25519 çiftini ve her epoch anahtarını elinde tutan odur.",
  hu: "A bejegyzést a csatorna epoch-kulcsával pecsételjük a szétosztás előtt, ezért a közvetítő olvashatatlan kereteket tárol vakon. Az őszinte megjegyzés: a kibocsátó a saját átjáród, amely birtokában van a csatorna Ed25519 kulcspárjának és minden epoch-kulcsnak.",
  "pt-BR": "Uma publicação é selada com a chave de epoch do canal antes de ser distribuída, então o relay armazena às cegas quadros que não consegue ler. A ressalva honesta: o seu próprio gateway é o emissor e detém o par Ed25519 do canal e todas as chaves de epoch.",
  ko: "게시물은 팬아웃 전에 채널의 epoch 키로 봉인되므로, 릴레이는 읽을 수 없는 프레임을 그대로 보관할 뿐입니다. 솔직한 단서: 발급자는 자체 게이트웨이이며, 게이트웨이가 채널의 Ed25519 키 쌍과 모든 epoch 키를 보유합니다.",
  ar: "يُختم المنشور بمفتاح الحقبة الخاص بالقناة قبل توزيعه، فيخزّن المرحّل الحزم تخزينًا أعمى دون أن يستطيع قراءتها. والتحفّظ الصادق: بوابتك أنت هي المُصدِر، وهي تحتفظ بزوج مفاتيح Ed25519 الخاص بالقناة وبكل مفتاح حقبة.",
};

const CHANNEL_S1: Localized<string> = {
  en: "Compose the post",
  ru: "Составить пост",
  de: "Beitrag schreiben",
  fr: "Rédaction du message",
  it: "Stesura del post",
  nl: "Bericht opstellen",
  cs: "Napsat příspěvek",
  "zh-Hans": "写好一条图文",
  "zh-Hant": "寫好一則圖文",
  es: "Escritura del post",
  pl: "Napisz wpis",
  ja: "投稿を書く",
  th: "เขียนโพสต์หนึ่งชิ้น",
  fi: "Laadi julkaisu",
  uk: "Написати допис",
  bg: "Напишете публикацията",
  tr: "Gönderiyi yazın",
  hu: "Írd meg a bejegyzést",
  "pt-BR": "Componha a publicação",
  ko: "게시물 작성",
  ar: "حرّر المنشور",
};

const CHANNEL_S2: Localized<string> = {
  en: "Sealed with the epoch key",
  ru: "Запечатан ключом epoch",
  de: "Versiegelt mit dem Epoch-Schlüssel",
  fr: "Scellé sous la clé epoch",
  it: "Sigillato con la chiave epoch",
  nl: "Verzegeld met de epochsleutel",
  cs: "Zapečetěno epochovým klíčem",
  "zh-Hans": "用 epoch 密钥封装",
  "zh-Hant": "用 epoch 密鑰封裝",
  es: "Sellado con la clave epoch",
  pl: "Zapieczętowany kluczem epoch",
  ja: "epoch 鍵で封をする",
  th: "ผนึกด้วยคีย์ epoch",
  fi: "Sinetöinti epoch-avaimella",
  uk: "Запечатаний ключем epoch",
  bg: "Запечатан с ключа на epoch",
  tr: "epoch anahtarıyla mühürlenir",
  hu: "Pecsételés epoch-kulccsal",
  "pt-BR": "Selado com a chave de epoch",
  ko: "epoch 키로 봉인",
  ar: "مختوم بمفتاح الحقبة",
};

const CHANNEL_S3: Localized<string> = {
  en: "Blind fan-out to subscriber inboxes",
  ru: "Слепая рассылка в ящики подписчиков",
  de: "Blinder Fan-out in Abonnenten-Postfächer",
  fr: "Diffusion à l’aveugle vers les abonnés",
  it: "Fan-out cieco nelle caselle follower",
  nl: "Blind fan-out naar abonnee-inboxen",
  cs: "Slepé rozeslání do schránek odběratelů",
  "zh-Hans": "盲存扇出到订阅者收件箱",
  "zh-Hant": "盲存扇出到訂閱者收件匣",
  es: "Entrega ciega a las bandejas",
  pl: "Ślepe rozesłanie do skrzynek uczestników",
  ja: "暗号文のままメンバーへ配信",
  th: "กระจายถึงกล่องข้อความสมาชิกโดยไม่เห็นเนื้อหา",
  fi: "Sokea hajautus jäsenten postilaatikoihin",
  uk: "Сліпа розсилка у скриньки підписників",
  bg: "Сляпо разпръскване към кутиите на последователите",
  tr: "İçeriği görünmeden abonelerin gelen kutusuna dağıtılır",
  hu: "Vak szétosztás a tagok postaládáiba",
  "pt-BR": "Distribuição cega para as caixas de entrada dos assinantes",
  ko: "구독자 수신함으로 블라인드 팬아웃",
  ar: "توزيع أعمى إلى صناديق وارد المشتركين",
};

const CHANNEL_LINK: Localized<string> = {
  en: "Look up the envelope and key ownership",
  ru: "Смотреть конверт и владельцев ключей",
  de: "Umschlag und Schlüsselbesitz nachschlagen",
  fr: "Consulter enveloppe et garde des clés",
  it: "Consulta busta e custodia chiavi",
  nl: "Omslag en sleutelbeheer opzoeken",
  cs: "Obálka a vlastnictví klíčů",
  "zh-Hans": "查信封格式与密钥归属",
  "zh-Hant": "查信封格式與密鑰歸屬",
  es: "Consulta sobre y custodia de claves",
  pl: "Sprawdź kopertę i właściciela kluczy",
  ja: "エンベロープと鍵の保有者を見る",
  th: "ดูรูปแบบซองและเจ้าของคีย์",
  fi: "Tarkista kuori ja avainten omistus",
  uk: "Переглянути конверт і власника ключів",
  bg: "Вижте обвивката и собственика на ключовете",
  tr: "Zarf biçimine ve anahtar sahipliğine bakın",
  hu: "Burkolat és a kulcsok birtoklása",
  "pt-BR": "Consultar o envelope e a posse das chaves",
  ko: "봉투와 키 소유 구조 확인하기",
  ar: "راجع بنية المغلف وملكية المفاتيح",
};

const ALERT_NAME: Localized<string> = {
  en: "Ops and security alerting",
  ru: "Оповещения эксплуатации и безопасности",
  de: "Ops- und Sicherheitswarnungen",
  fr: "Alertes DevOps et sécurité",
  it: "Avvisi ops e sicurezza",
  nl: "Ops- en beveiligingsmeldingen",
  cs: "Provozní a bezpečnostní výstrahy",
  "zh-Hans": "运维安全告警",
  "zh-Hant": "維運安全告警",
  es: "Alertas ops y seguridad",
  pl: "Alerty operacyjne i bezpieczeństwa",
  ja: "運用とセキュリティのアラート",
  th: "แจ้งเตือนงานปฏิบัติการและความปลอดภัย",
  fi: "Ylläpidon ja tietoturvan hälytykset",
  uk: "Сповіщення експлуатації та безпеки",
  bg: "Дежурни аларми и безопасност",
  tr: "Operasyon ve güvenlik uyarıları",
  hu: "Üzemeltetési és biztonsági riasztások",
  "pt-BR": "Alertas de operação e segurança",
  ko: "운영 및 보안 알림",
  ar: "تنبيهات التشغيل والأمن",
};

const ALERT_ACTOR: Localized<string> = {
  en: "On-call ops · security",
  ru: "Дежурный · безопасность",
  de: "Bereitschaft · Sicherheit",
  fr: "Astreinte · sécurité",
  it: "Reperibilità · sicurezza",
  nl: "Ploegendienst · beveiliging",
  cs: "Pohotovost · bezpečnost",
  "zh-Hans": "运维值班 · 安全",
  "zh-Hant": "維運值班 · 安全",
  es: "Guardia · seguridad",
  pl: "Dyżur · bezpieczeństwo",
  ja: "当直の運用 · セキュリティ",
  th: "เวรปฏิบัติการ · ความปลอดภัย",
  fi: "Päivystys · tietoturva",
  uk: "Черговий · безпека",
  bg: "Дежурен · сигурност",
  tr: "Nöbetçi operasyon · güvenlik",
  hu: "Riasztásüzemeltetés · biztonság",
  "pt-BR": "Plantão de operação · segurança",
  ko: "당직 운영 · 보안",
  ar: "التشغيل المناوب · الأمن",
};

const ALERT_TAGLINE: Localized<string> = {
  en: "One webhook from your monitoring becomes an acknowledgeable card on a phone.",
  ru: "Один Webhook из мониторинга становится карточкой, которую можно подтвердить с телефона.",
  de: "Ein Webhook aus dem Monitoring wird eine quittierbare Karte aufs Handy.",
  fr: "Un Webhook de votre supervision devient une carte avec accusé sur le téléphone.",
  it: "Un Webhook del monitoraggio diventa una card che puoi accettare dal telefono.",
  nl: "Eén Webhook uit de bewaking wordt een kaart op de telefoon met ack-knop.",
  cs: "Jeden Webhook ze sledování se stane kartou v telefonu, kterou lze potvrdit.",
  "zh-Hans": "监控里的一条 Webhook，变成手机上一张能确认的卡。",
  "zh-Hant": "監控裡的一條 Webhook，變成手機上一張能確認的卡。",
  es: "Un Webhook de tu monitorización se vuelve una tarjeta con acuse en el móvil.",
  pl: "Jeden Webhook z monitoringu staje się kartą z potwierdzeniem na telefonie.",
  ja: "モニタリングの Webhook 1件が、スマホで確認できるカードになります。",
  th: "Webhook หนึ่งเส้นจากระบบเฝ้าระวังก็กลายเป็นการ์ดที่กดยืนยันได้บนมือถือ",
  fi: "Yksi Webhook monitoroinnista muuttuu kuittattavaksi kortiksi puhelimessa.",
  uk: "Один Webhook з моніторингу стає карткою, яку можна підтвердити з телефону.",
  bg: "Един Webhook от мониторинга става картичка, която се потвърждава с докосване.",
  tr: "İzleme sisteminizin tek Webhook’u, telefonda onaylanabilir bir karta dönüşür.",
  hu: "A megfigyelésed egy Webhook-hívása nyugtázható kártyává válik a telefonján.",
  "pt-BR": "Um webhook do seu monitoramento vira um cartão confirmável no celular.",
  ko: "모니터링에서 보낸 웹훅 하나가 휴대폰에서 확인 버튼이 달린 카드가 됩니다.",
  ar: "يتحوّل ويب هوك واحد من نظام المراقبة إلى بطاقة قابلة للإقرار على الهاتف.",
};

const ALERT_BODY: Localized<string> = {
  en: "Grafana or Alertmanager posts to a token-checked webhook, events below the severity floor are stored without drawing a card, and the responder taps acknowledge right on the card. One event fingerprint is metered once, however often it is re-sent.",
  ru: "Grafana или Alertmanager пишут на Webhook с проверкой токена, события ниже порога серьёзности сохраняются без карточки, а дежурный подтверждает касанием прямо на карточке. Отпечаток инцидента списывает CP один раз, сколько бы раз его ни пересылали.",
  de: "Grafana oder Alertmanager melden an einen Webhook mit Tokenprüfung, Ereignisse unter der Schwelle werden gespeichert, ohne eine Karte zu zeichnen, und der Diensthabende bestätigt direkt auf der Karte. Pro Ereignis-Fingerabdruck zählt die CP-Messung einmal, unabhängig von Wiederholungen.",
  fr: "Grafana ou Alertmanager écrit dans un Webhook contrôlé par jeton ; les événements sous le seuil de gravité sont stockés sans carte, et l’astreinte confirme sur la carte. Une empreinte d’incident n’est facturée qu’une fois, malgré les renvois.",
  it: "Grafana o Alertmanager scrivono in un Webhook protetto da token; gli eventi sotto la soglia di severità vengono archiviati senza card, e il reperibile tocca ack sulla card. Un’impronta dell’incidente viene addebitata una sola volta, anche se riinviata.",
  nl: "Grafana of Alertmanager post naar een Webhook met tokencontrole, events onder de ernstgrens blijven in de opslag zonder kaart, en de responder bevestigt op de kaart zelf. Eén event-vingerafdruk wordt één keer geteld, ook bij herhaalpost.",
  cs: "Grafana nebo Alertmanager posílají na Webhook s kontrolou tokenu, události pod prahem závažnosti se uloží bez karty a zasahující technik potvrdí přímo na kartě. Za jeden otisk události se účtuje jednou, i když se pošle opakovaně.",
  "zh-Hans": "Grafana 或 Alertmanager 投递到带令牌校验的 Webhook，低于门槛级别的事件只入库不发卡；值班人员在卡片上轻点确认即可回传。同一个事件指纹只计量一次，重复投递不再扣。",
  "zh-Hant": "Grafana 或 Alertmanager 投遞到帶令牌驗證的 Webhook，低於門檻等級的事件只入庫不發卡；值班人員在卡片上輕點確認即可回傳。同一個事件指紋只計量一次，重複投遞不再扣。",
  es: "Grafana o Alertmanager escriben en un Webhook validado por token; bajo el umbral de severidad se guarda sin tarjeta, y la guardia confirma sobre ella. Una huella de incidente se factura una vez, aunque se repita.",
  pl: "Grafana albo Alertmanager trafia na Webhook pilnowany tokenem; zdarzenia poniżej progu ważności są zapisywane, ale nie rysują karty, a dyżurujący potwierdza tapnięciem w kartę. Ten sam odcisk zdarzenia jest naliczany raz, choćbyś wysyłał go wielokrotnie.",
  ja: "Grafana や Alertmanager が、トークンを検証する Webhook に届けます。深刻度が基準に満たないイベントは記録だけしてカードを出しません。対応者はそのカードで確認をタップでき、同じイベント指紋なら、何度再送されても計量は1回だけです。",
  th: "Grafana หรือ Alertmanager ส่งเข้ามาที่ Webhook ซึ่งตรวจด้วยโทเคน เหตุการณ์ที่ความรุนแรงต่ำกว่าเกณฑ์จะถูกเก็บโดยไม่ออกการ์ด ผู้รับเรื่องแตะรับทราบได้บนการ์ดใบเดิม และลายนิ้วมือเหตุการณ์หนึ่งนับเครดิตครั้งเดียวไม่ว่าจะส่งซ้ำกี่ครั้ง",
  fi: "Grafana tai Alertmanager postittaa tokenilla tarkistettuun Webhook-kutsuun; alle vakavuuskynnyksen jäävät tapahtumat tallentuvat ilman korttia, ja päivystäjä kuittaa kortin päältä. Tapahtuman sormenjälki mitataan kerran, vaikka se lähetettäisiin uudelleen.",
  uk: "Grafana або Alertmanager пишуть на Webhook з перевіркою токена, події нижче порога важливості зберігаються без картки, а черговий підтверджує дотиком просто на картці. Один відбиток події списує у CP один раз, скільки б разів його не пересилали.",
  bg: "Grafana или Alertmanager стигат до Webhook с проверка на токена; под прага на тежестта събитията се пазят без картичка, а дежурният потвърждава с докосване по картичката. Един отпечатък се таксува в CP веднъж, колкото и пъти да се препраща.",
  tr: "Grafana ya da Alertmanager, jeton denetimli bir Webhook’a gönderir; eşik altı olaylar kart çıkarmadan kaydedilir. Yanıtlayan kişi onayı doğrudan kartın üstünde verir. Aynı olay parmak izi, kaç kez yeniden gönderilirse gönderilsin yalnızca bir kez ölçülür.",
  hu: "A Grafana vagy Alertmanager tokennel őrzött Webhook-címre küld; a súlyossági küszöb alatti események csak tárolódnak, kártya nem kel belőlük, az ügyeletes pedig a kártyán koppintva nyugtázza. Egy esemény lenyomata egyszer kerül felszámításra, bárhányszor küldik újra.",
  "pt-BR": "O Grafana ou o Alertmanager envia para um webhook verificado por token, eventos abaixo do piso de severidade são armazenados sem gerar um cartão, e o responsável toca em confirmar direto no cartão. A impressão digital de um evento é medida uma única vez, não importa quantas vezes ele seja reenviado.",
  ko: "Grafana 또는 Alertmanager가 토큰으로 검증되는 웹훅으로 이벤트를 보내고, 심각도 하한 미만의 이벤트는 카드를 만들지 않고 저장만 됩니다. 대응 담당자는 카드에서 바로 확인을 탭합니다. 하나의 이벤트 지문은 몇 번을 다시 보내든 한 번만 계량됩니다.",
  ar: "يرسل Grafana أو Alertmanager طلبه إلى ويب هوك محمي برمز، وتُخزَّن الأحداث الأدنى من حد الخطورة دون إنشاء بطاقة، ويضغط المستجيب على «إقرار» مباشرة على البطاقة. وتُحتسب بصمة الحدث الواحدة مرة واحدة، مهما تكرّر إرسالها.",
};

const ALERT_S1: Localized<string> = {
  en: "Monitoring sends a webhook",
  ru: "Мониторинг отправляет Webhook",
  de: "Das Monitoring sendet einen Webhook",
  fr: "La supervision émet un Webhook",
  it: "Il monitoraggio invia un Webhook",
  nl: "De bewaking stuurt een Webhook",
  cs: "Sledování pošle Webhook",
  "zh-Hans": "监控发出 Webhook",
  "zh-Hant": "監控發出 Webhook",
  es: "La monitorización lanza un Webhook",
  pl: "Monitoring wysyła Webhook",
  ja: "監視が Webhook を送る",
  th: "ระบบเฝ้าระวังส่ง Webhook",
  fi: "Monitorointi lähettää Webhook-kutsun",
  uk: "Моніторинг надсилає Webhook",
  bg: "Мониторингът изпраща Webhook",
  tr: "İzleme bir Webhook gönderir",
  hu: "A megfigyelés Webhook-üzenetet küld",
  "pt-BR": "O monitoramento envia um webhook",
  ko: "모니터링이 웹훅을 전송합니다",
  ar: "يرسل نظام المراقبة ويب هوك",
};

const ALERT_S2: Localized<string> = {
  en: "The severity gate draws the card",
  ru: "Порог серьёзности решает, рисовать ли карточку",
  de: "Die Schwelle entscheidet über die Karte",
  fr: "Le seuil de gravité décide la carte",
  it: "La soglia di severità decide la card",
  nl: "De ernstgrens bepaalt of de kaart verschijnt",
  cs: "Práh závažnosti rozhodne o kartě",
  "zh-Hans": "按严重级别决定发卡",
  "zh-Hant": "按嚴重等級決定發卡",
  es: "El umbral de severidad decide la tarjeta",
  pl: "Próg ważności decyduje o karcie",
  ja: "深刻度の基準がカードを出すか決める",
  th: "เกณฑ์ความรุนแรงตัดสินการออกการ์ด",
  fi: "Vakavuuskynnys päättää kortin",
  uk: "Поріг важливості вирішує, чи малювати картку",
  bg: "Прагът на тежестта решава дали става картичка",
  tr: "Eşik kartı çıkarıp çıkarmamaya karar verir",
  hu: "A súlyossági küszöb dönt a kártyáról",
  "pt-BR": "A barreira de severidade gera o cartão",
  ko: "심각도 게이트가 카드를 생성합니다",
  ar: "بوابة الخطورة تُنشئ البطاقة",
};

const ALERT_S3: Localized<string> = {
  en: "Tap acknowledge, progress fills in place",
  ru: "Касание подтверждает, прогресс обновляется на месте",
  de: "Bestätigung antippen, Balken füllt sich",
  fr: "Accusé touché, barre remplie sur place",
  it: "Ack toccato, barra che si riempie",
  nl: "Tik, en de balk vult ter plekke",
  cs: "Potvrdit klepnutím, pruh se doplní",
  "zh-Hans": "轻点确认，进度原地更新",
  "zh-Hant": "輕點確認，進度原地更新",
  es: "Acuse tocado, barra completada al momento",
  pl: "Potwierdź, pasek postępu rusza na karcie",
  ja: "タップで確認、進捗はそのカードに反映",
  th: "แตะรับทราบ ความคืบหน้าแสดงบนการ์ดใบเดิม",
  fi: "Kuittaa, etenemispalkki täydentyy paikallaan",
  uk: "Дотик підтверджує, прогрес оновлюється на місці",
  bg: "Докосване потвърждава, напредъкът се запълва на място",
  tr: "Onaylayın, ilerleme aynı kartta dolar",
  hu: "Nyugta koppintva, a sáv a helyén telik",
  "pt-BR": "Toque em confirmar; o progresso avança ali mesmo",
  ko: "확인을 탭하면 진행 상태가 제자리에서 채워집니다",
  ar: "اضغط «إقرار»، فيُستكمل التقدّم في مكانه",
};

const ALERT_LINK: Localized<string> = {
  en: "Review auth, rate limiting and audit",
  ru: "Смотреть авторизацию, лимиты и журнал",
  de: "Auth, Ratenbegrenzung und Audit prüfen",
  fr: "Relire autorisation, limitation de débit et journal",
  it: "Rivedi token, limiter e registro",
  nl: "Auth, limiet en audit bekijken",
  cs: "Kontrola ověření, limitů a auditu",
  "zh-Hans": "看鉴权、限流与审计留痕",
  "zh-Hant": "看鑑權、限流與稽核留痕",
  es: "Revisa token, límite de tasa y registro",
  pl: "Sprawdź uwierzytelnianie, limity i audyt",
  ja: "認証 · レート制限 · 監査ログを見る",
  th: "ดูการตรวจสิทธิ์ การจำกัดอัตรา และบันทึกตรวจสอบ",
  fi: "Tarkista token, rajat ja auditointiloki",
  uk: "Переглянути авторизацію, обмеження та журнал",
  bg: "Вижте оторизацията, ограничителя и дневника",
  tr: "Yetkilendirme, hız sınırı ve denetim kaydı",
  hu: "Hitelesítés, korlát és audit átnézése",
  "pt-BR": "Revisar autenticação, limite de taxa e auditoria",
  ko: "인증, 레이트 리밋, 감사 검토하기",
  ar: "راجع المصادقة وتحديد المعدّل والتدقيق",
};

const SSO_NAME: Localized<string> = {
  en: "Anonymous scan-to-login",
  ru: "QR-вход без слежки",
  de: "Anonymer QR-Login",
  fr: "Connexion par scan anonyme",
  it: "Accesso con scansione anonima",
  nl: "Anoniem inloggen met QR",
  cs: "Anonymní přihlášení skenováním QR",
  "zh-Hans": "匿名扫码登录",
  "zh-Hant": "匿名掃描登入",
  es: "Acceso por escaneo anónimo",
  pl: "Anonimowe logowanie skanowaniem",
  ja: "追跡なしの QR ログイン",
  th: "เข้าสู่ระบบด้วยการสแกนแบบไม่ระบุตัวตน",
  fi: "Anonyymi kirjautuminen skannauksella",
  uk: "QR-вхід без відстеження",
  bg: "QR вход без проследяване",
  tr: "İz bırakmayan QR girişi",
  hu: "Névtelen belépés QR-olvasással",
  "pt-BR": "Login anônimo por escaneamento",
  ko: "익명 스캔 로그인",
  ar: "تسجيل دخول مجهول بالمسح",
};

const SSO_ACTOR: Localized<string> = {
  en: "A website · an internal system",
  ru: "Сайт · внутренняя система",
  de: "Website · internes System",
  fr: "Site web · système interne",
  it: "Sito web · sistema interno",
  nl: "Website · intern systeem",
  cs: "Web · interní systém",
  "zh-Hans": "网站 · 内部系统",
  "zh-Hant": "網站 · 內部系統",
  es: "Sitio web · sistema interno",
  pl: "Witryna · system wewnętrzny",
  ja: "Web サイト · 社内システム",
  th: "เว็บไซต์ · ระบบในบริษัท",
  fi: "Verkkosivu · sisäinen järjestelmä",
  uk: "Сайт · внутрішня система",
  bg: "Сайт · вътрешна система",
  tr: "Web sitesi · iç sistem",
  hu: "Weboldal · belső rendszer",
  "pt-BR": "Um site · um sistema interno",
  ko: "웹사이트 · 내부 시스템",
  ar: "موقع ويب · نظام داخلي",
};

const SSO_TAGLINE: Localized<string> = {
  en: "No phone number, no email: scanning with the phone signs the user in.",
  ru: "Ни номера телефона, ни почты: сканирование завершает вход пользователя.",
  de: "Keine Telefonnummer, keine E-Mail: Mit dem Handy gescannt, ist der Nutzer angemeldet.",
  fr: "Ni numéro de téléphone ni e-mail : un scan et l’utilisateur est connecté.",
  it: "Né numero di telefono né email: una scansione e l’utente accede.",
  nl: "Geen telefoonnummer, geen e-mail: de gebruiker scant en is ingelogd.",
  cs: "Bez telefonního čísla, bez e-mailu: uživatel naskenuje a je přihlášen.",
  "zh-Hans": "不填手机号、不填邮箱，手机扫一扫就登上了。",
  "zh-Hant": "不填手機號、不填電子郵件，手機掃描一下就登入了。",
  es: "Sin teléfono y sin correo: escanear con el móvil inicia la sesión.",
  pl: "Bez numeru telefonu i adresu e-mail: skanowanie telefonem loguje użytkownika.",
  ja: "電話番号もメールも不要です。スマホでスキャンすればログインできます。",
  th: "ไม่ต้องมีเบอร์โทรศัพท์ ไม่ต้องมีอีเมล สแกนด้วยมือถือก็เข้าระบบได้",
  fi: "Ei puhelinnumeroa, ei sähköpostia: skannaus puhelimella kirjaa käyttäjän sisään.",
  uk: "Ні номера телефону, ні пошти: сканування завершує вхід користувача.",
  bg: "Нито телефонен номер, нито имейл: сканирането завършва влизането.",
  tr: "Telefon numarası yok, e-posta yok: telefonla taramak giriş için yeterli.",
  hu: "Nincs telefonszám, nincs e-mail: a telefonnal beolvasva bejelentkezik.",
  "pt-BR": "Sem número de telefone, sem e-mail: escanear com o celular autentica o usuário.",
  ko: "전화번호도 이메일도 없이, 휴대폰으로 스캔하면 로그인됩니다.",
  ar: "لا رقم هاتف ولا بريد إلكتروني: المسح بالهاتف يسجّل دخول المستخدم.",
};

const SSO_BODY: Localized<string> = {
  en: "Your site draws a QR carrying a random session id; the scan page polls status only and never receives an identity, while the credential itself is handed out once, through the token-checked verify call, and is spent on first use. Drawing the QR costs nothing — the meter moves when the user confirms.",
  ru: "Сайт рисует QR со случайным id сессии; страница сканирования опрашивает только состояние и никогда не получает идентичность, а допуск выдаётся один раз вызовом под проверкой токена и гаснет при первом использовании. QR ничего не стоит: списание идёт с подтверждения.",
  de: "Ihre Seite zeichnet ein QR mit zufälliger id. Die Scan-Seite pollt nur Status, nie Identität. Das Credential kommt einmal aus dem tokengeprüften verify-Aufruf und ist beim ersten Gebrauch verbraucht. Das QR kostet nichts; gemessen wird bei Bestätigung.",
  fr: "Le QR porte un id de session aléatoire ; la page de scan ne sonde que l’état, jamais une identité. Le jeton sort une seule fois de l’appel verify, usage unique. Émettre le QR est gratuit, le comptage part à la confirmation.",
  it: "Il QR porta un id di sessione casuale; la pagina di scansione sonda solo lo stato, mai un’identità. La credenziale esce una volta sola dalla chiamata verify, monouso. Coniare il QR è gratuito, il conteggio scatta alla conferma.",
  nl: "Je site tekent een QR met willekeurige id. De scanpagina pollt alleen status, nooit identiteit. Het credential komt één keer via de tokengecontroleerde verify-aanroep en is bij gebruik op. De QR kost niets; de CP-telling begint bij bevestigen.",
  cs: "Váš web vykreslí QR s náhodným id. Stránka skenování dotazuje jen stav, nikdy identitu. Pověření vyjde jednou, přes verify volání s tokenem, a spotřebuje se při prvním použití. Vykreslení QR stojí nula, měření začne potvrzením.",
  "zh-Hans": "你的网站生成一张带随机会话 id 的二维码；扫码页只轮询状态、永远拿不到身份，登录凭证只在带令牌的 verify 接口里下发，兑现一次即作废。生成二维码不扣费，用户点确认那一刻才计量。",
  "zh-Hant": "你的網站產生一張帶隨機會話 id 的 QR 碼；掃描頁只輪詢狀態、永遠拿不到身分，登入憑證只在帶令牌的 verify 介面下發，兌現一次即作廢。產生 QR 碼不扣費，使用者點確認那一刻才計量。",
  es: "El QR lleva un id de sesión aleatorio; la página de escaneo solo consulta el estado, nunca una identidad. La credencial sale una sola vez por la llamada verify y caduca al uso. Generar el QR no cuesta; la medición llega al confirmar.",
  pl: "Twoja strona rysuje QR z losowym id sesji; ekran skanowania zna tylko status, nie tożsamość. Wywołanie verify, pilnowane tokenem, wydaje jednorazowe dane logowania, zużywane przy pierwszym użyciu. Rysowanie QR nic nie kosztuje, licznik rusza przy potwierdzeniu.",
  ja: "サイトはランダムなセッション id を込んだ QR コードを表示し、スキャンページは状態をポーリングするだけで身元は受け取りません。認証情報はトークンを検証する verify 呼び出しで1度だけ発行され、使えば失効します。QR の表示では課金されず、計量するのは利用者が承認した瞬間です。",
  th: "เว็บไซต์ของคุณสร้าง QR ที่มี id เซสชันแบบสุ่ม หน้าสแกนจะตรวจเฉพาะสถานะและไม่มีวันได้ข้อมูลระบุตัวตน ส่วนข้อมูลใช้ยืนยันออกหนึ่งครั้งผ่านการเรียก verify ที่ตรวจด้วยโทเคน และใช้ได้ครั้งเดียว การสร้าง QR ไม่คิดเครดิต จะนับตอนผู้ใช้กดยืนยัน",
  fi: "Sivusi piirtää QR-koodin, jossa on satunnainen istunnon id; skannaussivu kysyy vain tilaa, ei henkilöllisyyttä. Tokenilla vartioitu verify-kutsu myöntää tunnisteen kerran, ja se kuluu ensimmäisellä käytöllä. QR-koodin piirtäminen ei maksa, metari liikkuu kun käyttäjä kuittaa.",
  uk: "Сайт малює QR із випадковим id сесії; сторінка сканування опитує лише стан і ніколи не отримує ідентичності, а ключ допуску видається один раз викликом під перевіркою токена й гасне від першого вжитку. QR нічого не коштує: списування починається з підтвердження.",
  bg: "Сайтът рисува QR със случайно id; страницата за сканиране пита само състоянието и никога не получава самоличност, а входният ключ се издава еднократно при проверка на токена и изгаря при употреба. QR не струва нищо, таксата идва при потвърждение.",
  tr: "Siteniz rastgele bir oturum id’si taşıyan bir QR çizer; tarama sayfası yalnızca durumu yoklar, kimlik almaz. Kimlik bilgisi tek kez, jeton denetimli verify çağrısıyla verilir ve ilk kullanımda tükenir. QR çizimi ölçüme girmez; sayaç kullanıcı onayladığında ilerler.",
  hu: "Oldalod egy véletlen munkamenet-id-t vivő QR-kódot rajzol; az olvasólap csak az állapotot kérdezi, személyazonosságot nem. A tokennel őrzött verify hívás állítja ki a belépési igazolást; egyszer használható. A QR nem mérhető, a mérő nyugtázáskor indul.",
  "pt-BR": "Seu site desenha um QR que carrega um id de sessão aleatório; a página de escaneamento consulta apenas o status e nunca recebe uma identidade, enquanto a própria credencial é entregue uma única vez, pela chamada de verificação protegida por token, e é consumida no primeiro uso. Desenhar o QR não custa nada — o medidor avança quando o usuário confirma.",
  ko: "사이트가 임의의 세션 ID를 담은 QR을 표시하고, 스캔 페이지는 상태만 폴링하며 신원 정보는 결코 받지 않습니다. 자격 증명 자체는 토큰으로 검증되는 verify 호출을 통해 한 번만 발급되고 첫 사용 시 소진됩니다. QR을 그리는 데는 비용이 들지 않으며, 사용자가 확인할 때 계량기가 움직입니다.",
  ar: "يعرض موقعك رمز QR يحمل معرّف جلسة عشوائيًا؛ وصفحة المسح تستعلم عن الحالة فقط ولا تتلقى أي هوية، أما بيانات الاعتماد نفسها فتُسلَّم مرة واحدة عبر استدعاء التحقق المحمي برمز، وتُستهلك عند أول استخدام. عرض رمز QR لا يكلّف شيئًا — فالعداد يتحرك عندما يؤكّد المستخدم.",
};

const SSO_S1: Localized<string> = {
  en: "The site draws a QR code",
  ru: "Сайт рисует QR-код",
  de: "Die Seite zeichnet ein QR",
  fr: "Le site affiche un QR",
  it: "Il sito genera un QR",
  nl: "De site tekent een QR-code",
  cs: "Web vykreslí QR kód",
  "zh-Hans": "网站生成二维码",
  "zh-Hant": "網站產生 QR 碼",
  es: "El sitio genera un QR",
  pl: "Strona rysuje kod QR",
  ja: "サイトが QR コードを表示",
  th: "เว็บไซต์สร้าง QR หนึ่งใบ",
  fi: "Sivusto piirtää QR-koodin",
  uk: "Сайт малює QR-код",
  bg: "Сайтът рисува QR код",
  tr: "Site bir QR kodu çizer",
  hu: "Az oldal QR-kódot rajzol",
  "pt-BR": "O site desenha um código QR",
  ko: "사이트가 QR 코드를 표시합니다",
  ar: "يعرض الموقع رمز QR",
};

const SSO_S2: Localized<string> = {
  en: "The user scans and confirms",
  ru: "Пользователь сканирует и подтверждает",
  de: "Der Nutzer scannt und bestätigt",
  fr: "L’utilisateur scanne et confirme",
  it: "L’utente scansiona e conferma",
  nl: "De gebruiker scant en bevestigt",
  cs: "Uživatel naskenuje a potvrdí",
  "zh-Hans": "用户扫码并点确认",
  "zh-Hant": "使用者掃描並點確認",
  es: "El usuario escanea y confirma",
  pl: "Użytkownik skanuje i potwierdza",
  ja: "利用者がスキャンして承認",
  th: "ผู้ใช้สแกนแล้วกดยืนยัน",
  fi: "Käyttäjä skannaa ja kuittaa",
  uk: "Користувач сканує й підтверджує",
  bg: "Потребителят сканира и потвърждава",
  tr: "Kullanıcı tarar ve onaylar",
  hu: "A felhasználó beolvassa és nyugtázza",
  "pt-BR": "O usuário escaneia e confirma",
  ko: "사용자가 스캔하고 확인합니다",
  ar: "يمسح المستخدم ويؤكّد",
};

const SSO_S3: Localized<string> = {
  en: "A one-time credential returns to the site",
  ru: "Одноразовый допуск возвращается на сайт",
  de: "Ein einmaliges Credential geht zurück",
  fr: "Un jeton à usage unique revient",
  it: "Credenziale monouso restituita al sito",
  nl: "Een eenmalig credential gaat terug",
  cs: "Jednorázové pověření se vrací webu",
  "zh-Hans": "一次性凭证回到网站",
  "zh-Hant": "一次性憑證回到網站",
  es: "Vuelve una credencial de un solo uso",
  pl: "Jednorazowe dane wracają do strony",
  ja: "1回だけの認証情報がサイトへ戻る",
  th: "ข้อมูลใช้ยืนยันครั้งเดียวกลับสู่เว็บไซต์",
  fi: "Kertakäyttöinen tunniste palautuu sivustolle",
  uk: "Одноразовий ключ допуску повертається на сайт",
  bg: "Еднократният ключ се връща в сайта",
  tr: "Tek kullanımlık kimlik bilgisi siteye döner",
  hu: "Egyszeri igazolás megy vissza az oldalnak",
  "pt-BR": "Uma credencial de uso único volta para o site",
  ko: "일회용 자격 증명이 사이트로 반환됩니다",
  ar: "تعود بيانات اعتماد لمرة واحدة إلى الموقع",
};

const SSO_LINK: Localized<string> = {
  en: "Run the scan flow in the sandbox",
  ru: "Пройти сценарий QR в песочнице",
  de: "Scan-Ablauf in der Sandbox ausführen",
  fr: "Exécuter le scan en bac à sable",
  it: "Esegui la scansione nella sandbox",
  nl: "Scanflow in de speeltuin uitproberen",
  cs: "Provést skenování v pískovišti",
  "zh-Hans": "在沙盒里跑一遍扫码",
  "zh-Hant": "在沙盒裡跑一遍掃描",
  es: "Ejecuta el escaneo en la demo",
  pl: "Przejdź ścieżkę skanowania w piaskownicy",
  ja: "サンドボックスでスキャンの流れを試す",
  th: "ลองเส้นทางการสแกนในแซนด์บ็อกซ์",
  fi: "Kokeile skannausta hiekkalaatikossa",
  uk: "Пройти сценарій QR у пісочниці",
  bg: "Пуснете QR потока в пясъчницата",
  tr: "Tarama akışını kum havuzunda çalıştırın",
  hu: "Futtasd végig a beolvasást a homokozóban",
  "pt-BR": "Executar o fluxo de escaneamento no sandbox",
  ko: "샌드박스에서 스캔 흐름 실행하기",
  ar: "شغّل مسار المسح في بيئة الاختبار",
};

const LOCAL_NAME: Localized<string> = {
  en: "Connect your own local agent",
  ru: "Подключение локального агента",
  de: "Eigenen lokalen Agent verbinden",
  fr: "Connectez votre agent local",
  it: "Collega il tuo agente locale",
  nl: "Eigen lokale Agent koppelen",
  cs: "Připojte vlastní lokální Agent",
  "zh-Hans": "连接本地 Agent",
  "zh-Hant": "連線本地 Agent",
  es: "Conecta tu agente local",
  pl: "Podłącz własny lokalny Agent",
  ja: "ローカル Agent を接続",
  th: "เชื่อมต่อ Agent บนเครื่องของคุณเอง",
  fi: "Yhdistä oma paikallinen Agent",
  uk: "Підключення локального агента",
  bg: "Свързване на локален Agent",
  tr: "Kendi yerel Agent’ınızı bağlayın",
  hu: "Saját helyi Agent bekötése",
  "pt-BR": "Conectar o seu próprio agente local",
  ko: "자체 로컬 에이전트 연결",
  ar: "اربط الوكيل المحلي الخاص بك",
};

const LOCAL_ACTOR: Localized<string> = {
  en: "Self-hosted model · intranet",
  ru: "Своя модель · внутренняя сеть",
  de: "Selbst gehostetes Modell · Intranet",
  fr: "Modèle auto-hébergé · intranet",
  it: "Modello self-hosted · intranet",
  nl: "Zelf gehost model · intranet",
  cs: "Model u vás · intranet",
  "zh-Hans": "自建模型 · 内网",
  "zh-Hant": "自建模型 · 內網",
  es: "Modelo autoalojado · intranet",
  pl: "Własny model · serwer lokalny",
  ja: "自前モデル · 社内ネット",
  th: "โมเดลที่ตั้งเอง · ระบบในบริษัท",
  fi: "Oma malli · paikallinen palvelin",
  uk: "Власна модель · внутрішня мережа",
  bg: "Собствен модел · вътрешна мрежа",
  tr: "Kendi modeliniz · iç ağ",
  hu: "Saját modell · helyi szerver",
  "pt-BR": "Modelo auto-hospedado · intranet",
  ko: "자체 호스팅 모델 · 인트라넷",
  ar: "نموذج مستضاف ذاتيًا · شبكة داخلية",
};

const LOCAL_TAGLINE: Localized<string> = {
  en: "The service account answers from a model that never leaves your machine.",
  ru: "Сервисный аккаунт отвечает моделью, которая никогда не покидает ваш сервер.",
  de: "Das Service-Konto antwortet aus einem Modell, das Ihren Rechner nie verlässt.",
  fr: "Le compte de service répond depuis un modèle qui ne quitte jamais votre machine.",
  it: "L’account di servizio risponde con un modello che non lascia mai il tuo computer.",
  nl: "Het serviceaccount antwoordt vanuit een model dat je machine nooit verlaat.",
  cs: "Servisní účet odpovídá z modelu, který nikdy neopustí váš stroj.",
  "zh-Hans": "服务号的回答来自一个从不出你机器的模型。",
  "zh-Hant": "服務號的回答來自一個從不出你機器的模型。",
  es: "La cuenta de servicio responde desde un modelo que nunca sale de tu equipo.",
  pl: "Konto serwisowe odpowiada z modelu, który nigdy nie opuszcza twojego serwera.",
  ja: "サービスアカウントの回答は、自前マシンから出ないモデル。",
  th: "บัญชีบริการตอบโดยโมเดลที่ไม่เคยออกจากเครื่องของคุณ",
  fi: "Palvelutili vastaa mallista, joka ei koskaan poistu sinun koneeltasi.",
  uk: "Сервісний акаунт відповідає моделлю, яка ніколи не покидає ваш сервер.",
  bg: "Сервизният акаунт отговаря с модел, който никога не напуска сървъра ви.",
  tr: "Hizmet hesabı, makinenizden hiç çıkmayan bir modelden yanıtlar.",
  hu: "A szolgáltatási fiók olyan modellből válaszol, amely soha nem hagyja el a géped.",
  "pt-BR": "A conta de serviço responde a partir de um modelo que nunca sai da sua máquina.",
  ko: "서비스 계정이 자체 머신을 벗어나지 않는 모델로 답변합니다.",
  ar: "يجيب حساب الخدمة من نموذج لا يغادر جهازك أبدًا.",
};

const LOCAL_BODY: Localized<string> = {
  en: "POPOPX_AI_BASE_URL takes any OpenAI-compatible chat completions address, so a local Ollama at http://127.0.0.1:11434/v1 is just another value, and POPOPX_AI_MODEL names the model. The address and the key are environment values rather than console fields, so they stay on your server: the AI panel hot-edits six keys only — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  ru: "POPOPX_AI_BASE_URL принимает любой адрес OpenAI-совместимого chat completions, поэтому локальный Ollama на http://127.0.0.1:11434/v1 — ещё одно значение, а POPOPX_AI_MODEL задаёт модель. Адрес и ключ — значения окружения, а не поля консоли, поэтому остаются на вашем сервере: панель AI горячо правит ровно шесть ключей — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  de: "POPOPX_AI_BASE_URL nimmt jede OpenAI-kompatible Adresse für chat completions, ein lokales Ollama auf http://127.0.0.1:11434/v1 ist nur ein weiterer Wert; POPOPX_AI_MODEL benennt das Modell. Adresse und Key sind Umgebungswerte, keine Felder in der Konsole, sie bleiben also auf Ihrem Server. Das AI-Panel hot-editiert genau sechs Schlüssel: system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  fr: "POPOPX_AI_BASE_URL prend toute adresse chat completions compatible OpenAI : un Ollama local sur http://127.0.0.1:11434/v1 n’est qu’une valeur de plus ; POPOPX_AI_MODEL nomme le modèle. Adresse et clé sont des valeurs d’environnement, non des champs de console, et restent sur votre serveur. Le panneau IA ne modifie à chaud que six clés exactement : system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  it: "POPOPX_AI_BASE_URL accetta qualunque indirizzo chat completions compatibile con OpenAI: un Ollama locale su http://127.0.0.1:11434/v1 è solo un valore in più; POPOPX_AI_MODEL nomina il modello. Indirizzo e API key sono valori d’ambiente, non campi della console: restano sul tuo server. Il pannello IA si limita a hot-editare esattamente sei chiavi: system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  nl: "POPOPX_AI_BASE_URL accepteert elk OpenAI-compatibel adres voor chat completions, een lokale Ollama op http://127.0.0.1:11434/v1 is gewoon een andere waarde, en POPOPX_AI_MODEL noemt het model. Adres en API-sleutel zijn omgevingswaarden, geen consolevelden; ze blijven dus op je server. Het AI-paneel hot-edit precies zes sleutels: system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  cs: "POPOPX_AI_BASE_URL pojme libovolnou adresu chat completions kompatibilní s OpenAI, lokální Ollama na http://127.0.0.1:11434/v1 je jen další hodnota, a POPOPX_AI_MODEL určuje model. Adresa a klíč jsou hodnoty prostředí, ne pole v konzoli – zůstávají na vašem serveru. Panel AI horkě edituje přesně šest klíčů: system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  "zh-Hans": "POPOPX_AI_BASE_URL 可以填任何 OpenAI 兼容的 chat completions 地址，本机 Ollama（http://127.0.0.1:11434/v1）也只是其中一个值；模型由 POPOPX_AI_MODEL 指定。接入地址和 Key 是环境变量、不是控制台字段，所以一直留在你自己的服务器上：AI 面板只能热改六个键——system_prompt、model、history_size、temperature、max_tokens、exhausted_message。",
  "zh-Hant": "POPOPX_AI_BASE_URL 可以填任何 OpenAI 相容的 chat completions 位址，本機 Ollama（http://127.0.0.1:11434/v1）也只是其中一個值；模型由 POPOPX_AI_MODEL 指定。接入位址和 Key 是環境變數、不是控制台欄位，所以一直留在你自己的伺服器上：AI 面板只能熱改六個鍵——system_prompt、model、history_size、temperature、max_tokens、exhausted_message。",
  es: "POPOPX_AI_BASE_URL acepta cualquier dirección chat completions compatible con OpenAI: un Ollama local en http://127.0.0.1:11434/v1 es solo un valor más; POPOPX_AI_MODEL nombra el modelo. Dirección y clave son valores de entorno, no campos de consola: se quedan en tu servidor. El panel IA edita en caliente exactamente seis claves, solo esas: system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  pl: "POPOPX_AI_BASE_URL przyjmuje dowolny adres chat completions zgodny z OpenAI — lokalne Ollama (http://127.0.0.1:11434/v1) to tylko kolejna wartość, a POPOPX_AI_MODEL wskazuje model. Adres i klucz to wartości środowiskowe, nie pola konsoli, więc zostają na twoim serwerze: panel AI edytuje na gorąco dokładnie sześć kluczy — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  ja: "POPOPX_AI_BASE_URL には OpenAI 互換の chat completions アドレスなら何でも入れられるので、マシン上の Ollama（http://127.0.0.1:11434/v1）も単なる一つの値で、モデルは POPOPX_AI_MODEL が指定します。アドレスとキーはコンソールの入力欄ではなく環境値なので、あなたのサーバーに留まります。AI パネルが hot-edit するのは system_prompt、model、history_size、temperature、max_tokens、exhausted_message の6キーだけです。",
  th: "POPOPX_AI_BASE_URL ใส่ที่อยู่ chat completions ที่เข้ากันได้กับ OpenAI ได้ทุกแบบ Ollama บนเครื่องตัวเอง (http://127.0.0.1:11434/v1) จึงเป็นแค่ค่าค่าหนึ่ง ส่วนโมเดลให้ POPOPX_AI_MODEL เป็นผู้ระบุ ที่อยู่กับคีย์เป็นค่าจากสภาพแวดล้อม ไม่ใช่ช่องในคอนโซล มันจึงอยู่แต่บนเซิร์ฟเวอร์ของคุณต่อไป แผง AI แก้ไขแบบร้อน ๆ ได้หกคีย์พอดี คือ system_prompt, model, history_size, temperature, max_tokens และ exhausted_message",
  fi: "POPOPX_AI_BASE_URL:iin kelpaa mikä tahansa OpenAI-yhteensopiva chat completions -osoite, joten paikallinen Ollama osoitteessa http://127.0.0.1:11434/v1 on vain yksi arvo lisää, ja POPOPX_AI_MODEL nimeää mallin. Osoite ja avain ovat ympäristöarvoja eivätkä konsolin kenttiä, joten ne jäävät sinun palvelimellesi: AI-paneeli muokkaa kuumana täsmälleen kuutta avainta — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  uk: "POPOPX_AI_BASE_URL приймає будь-яку адресу chat completions, сумісну з OpenAI, тож локальне Ollama на http://127.0.0.1:11434/v1 — ще одне значення, а POPOPX_AI_MODEL задає модель. Адреса й ключ — значення середовища, а не поля консолі, тож лишаються на вашому сервері: панель AI гаряче править рівно шість ключів — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  bg: "POPOPX_AI_BASE_URL приема всеки OpenAI-съвместим chat completions адрес, затова локалното Ollama на http://127.0.0.1:11434/v1 е просто още една стойност, а POPOPX_AI_MODEL назова модела. Адресът и ключът са стойности на средата, не полета в конзолата, и остават на вашия сървър: AI панелът горещо редактира точно шест ключа — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  tr: "POPOPX_AI_BASE_URL, OpenAI uyumlu her chat completions adresini kabul eder; dolayısıyla makinenizdeki bir Ollama (http://127.0.0.1:11434/v1) yalnızca bir başka değerdir, modeli ise POPOPX_AI_MODEL adlandırır. Adres ve anahtar, konsol alanı değil ortam değerleri olduğu için kendi sunucunuzda kalır: AI paneli hot olarak tam altı anahtarı düzenler — system_prompt, model, history_size, temperature, max_tokens ve exhausted_message.",
  hu: "POPOPX_AI_BASE_URL elé bármilyen OpenAI-kompatibilis chat completions cím kerülhet, a helyi Ollama (http://127.0.0.1:11434/v1) csak egy további érték, a POPOPX_AI_MODEL megnevezi a modellt. A cím és a kulcs környezeti érték, nem konzolos mező, ezért a saját szervereden marad: az AI-panel melegen pontosan hat kulcsot szerkeszt — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  "pt-BR": "POPOPX_AI_BASE_URL aceita qualquer endereço de chat completions compatível com OpenAI, então um Ollama local em http://127.0.0.1:11434/v1 é apenas mais um valor, e POPOPX_AI_MODEL dá nome ao modelo. O endereço e a chave são valores de ambiente, e não campos do console, por isso ficam no seu servidor: o painel de IA edita a quente apenas seis chaves — system_prompt, model, history_size, temperature, max_tokens, exhausted_message.",
  ko: "POPOPX_AI_BASE_URL은 OpenAI 호환 chat completions 주소라면 무엇이든 받아들이므로 http://127.0.0.1:11434/v1에 있는 로컬 Ollama도 또 하나의 값일 뿐이고, POPOPX_AI_MODEL이 모델 이름을 지정합니다. 주소와 키는 콘솔 필드가 아니라 환경 값이므로 서버에 그대로 남습니다: AI 패널이 즉석에서 편집하는 키는 system_prompt, model, history_size, temperature, max_tokens, exhausted_message 여섯 개뿐입니다.",
  ar: "يقبل POPOPX_AI_BASE_URL أي عنوان chat completions متوافق مع OpenAI، لذا فإن Ollama محليًا على http://127.0.0.1:11434/v1 ليس إلا قيمة أخرى، ويسمّي POPOPX_AI_MODEL الطراز. والعنوان والمفتاح قيمتا بيئة لا حقول في وحدة التحكم، لذا يبقيان على خادمك: لوحة الذكاء الاصطناعي تعدّل آنيًا ستة مفاتيح فقط — system_prompt وmodel وhistory_size وtemperature وmax_tokens وexhausted_message.",
};

const LOCAL_S1: Localized<string> = {
  en: "Point POPOPX_AI_BASE_URL at your own address",
  ru: "Укажите в POPOPX_AI_BASE_URL свой адрес",
  de: "POPOPX_AI_BASE_URL auf Ihre eigene Adresse setzen",
  fr: "POPOPX_AI_BASE_URL dirigé vers votre adresse",
  it: "Punta POPOPX_AI_BASE_URL sul tuo indirizzo",
  nl: "Zet POPOPX_AI_BASE_URL op je eigen adres",
  cs: "Nastavte POPOPX_AI_BASE_URL na vlastní adresu",
  "zh-Hans": "把 POPOPX_AI_BASE_URL 指向自己的地址",
  "zh-Hant": "把 POPOPX_AI_BASE_URL 指向自己的位址",
  es: "Apunta POPOPX_AI_BASE_URL a tu propia dirección",
  pl: "Skieruj POPOPX_AI_BASE_URL na własny adres",
  ja: "POPOPX_AI_BASE_URL を自分のアドレスへ",
  th: "ชี้ POPOPX_AI_BASE_URL ไปยังที่อยู่ของคุณเอง",
  fi: "Ohjaa POPOPX_AI_BASE_URL omaan osoitteeseen",
  uk: "Вкажіть у POPOPX_AI_BASE_URL власну адресу",
  bg: "Задайте вашия адрес в POPOPX_AI_BASE_URL",
  tr: "POPOPX_AI_BASE_URL’ı kendi adresinize yöneltin",
  hu: "Állítsd a POPOPX_AI_BASE_URL értékét a saját címedre",
  "pt-BR": "Aponte POPOPX_AI_BASE_URL para o seu próprio endereço",
  ko: "POPOPX_AI_BASE_URL을 자체 주소로 지정",
  ar: "وجّه POPOPX_AI_BASE_URL إلى عنوانك الخاص",
};

const LOCAL_S2: Localized<string> = {
  en: "Name the model in POPOPX_AI_MODEL",
  ru: "Задайте модель в POPOPX_AI_MODEL",
  de: "Das Modell in POPOPX_AI_MODEL benennen",
  fr: "Le modèle nommé dans POPOPX_AI_MODEL",
  it: "Nomina il modello in POPOPX_AI_MODEL",
  nl: "Noem het model in POPOPX_AI_MODEL",
  cs: "Určete model v POPOPX_AI_MODEL",
  "zh-Hans": "用 POPOPX_AI_MODEL 指定模型",
  "zh-Hant": "用 POPOPX_AI_MODEL 指定模型",
  es: "Nombra el modelo en POPOPX_AI_MODEL",
  pl: "Nazwij model w POPOPX_AI_MODEL",
  ja: "POPOPX_AI_MODEL でモデルを指定",
  th: "ระบุโมเดลใน POPOPX_AI_MODEL",
  fi: "Malli nimetään POPOPX_AI_MODEL-arvolla",
  uk: "Назвіть модель у POPOPX_AI_MODEL",
  bg: "Назовете модела в POPOPX_AI_MODEL",
  tr: "Modeli POPOPX_AI_MODEL ile adlandırın",
  hu: "Add meg a modellt a POPOPX_AI_MODEL értékben",
  "pt-BR": "Indique o modelo em POPOPX_AI_MODEL",
  ko: "POPOPX_AI_MODEL에 모델 이름 지정",
  ar: "حدّد اسم النموذج في POPOPX_AI_MODEL",
};

const LOCAL_S3: Localized<string> = {
  en: "Restart once; the answer arrives as a normal message",
  ru: "Одна перезагрузка — и ответ приходит обычным сообщением",
  de: "Einmal neu starten, die Antwort kommt als normale Nachricht",
  fr: "Redémarrez une fois : la réponse arrive en message normal",
  it: "Riavvia una volta; la risposta arriva come messaggio normale",
  nl: "Herstart één keer, het antwoord komt als gewoon bericht",
  cs: "Po jednom restartu přijde odpověď jako běžná zpráva",
  "zh-Hans": "重启一次；回答就是一条普通消息",
  "zh-Hant": "重啟一次；回答就是一則普通訊息",
  es: "Reinicia una vez; la respuesta llega como mensaje normal",
  pl: "Restartuj raz; odpowiedź przychodzi jako zwykła wiadomość",
  ja: "1回の再起動で、回答は通常のメッセージ",
  th: "รีสตาร์ทครั้งเดียว คำตอบก็มาเป็นข้อความปกติ",
  fi: "Käynnistä uudelleen kerran; vastaus saapuu tavallisena viestinä",
  uk: "Один перезапуск — і відповідь приходить звичайним повідомленням",
  bg: "Едно рестартиране — и отговорът идва като обикновено съобщение",
  tr: "Bir kez yeniden başlatın; yanıt normal mesaj olur",
  hu: "Indítsd újra egyszer; a válasz normál üzenetként érkezik",
  "pt-BR": "Reinicie uma vez; a resposta chega como uma mensagem normal",
  ko: "한 번 재시작하면 답변이 일반 메시지로 도착합니다",
  ar: "أعد التشغيل مرة واحدة، فيصل الرد كرسالة عادية",
};

const LOCAL_LINK: Localized<string> = {
  en: "Open the environment file and the restart step",
  ru: "Открыть файл окружения и шаг перезапуска",
  de: "Umgebungsdatei und Neustartschritt öffnen",
  fr: "Ouvrir le fichier d’environnement et l’étape de redémarrage",
  it: "Apri file d’ambiente e procedura di riavvio",
  nl: "Open het .env-bestand en de herstartstap",
  cs: "Otevřete soubor .env a postup restartu",
  "zh-Hans": "看环境变量文件与重启步骤",
  "zh-Hant": "看環境變數檔案與重啟步驟",
  es: "Abre el archivo de entorno y el reinicio",
  pl: "Otwórz plik środowiskowy i krok restartu",
  ja: "環境変数ファイルと再起動を見る",
  th: "เปิดไฟล์ตัวแปรสภาพแวดล้อมและขั้นตอนรีสตาร์ท",
  fi: "Avaa ympäristötiedosto ja uudelleenkäynnistyksen vaihe",
  uk: "Переглянути файл середовища й крок перезапуску",
  bg: "Отворете файла на средата и стъпката за рестарт",
  tr: "Ortam dosyasını ve yeniden başlatma adımını açın",
  hu: "Nyisd meg a környezeti fájlt és az újraindítást",
  "pt-BR": "Abrir o arquivo de ambiente e a etapa de reinício",
  ko: "환경 파일과 재시작 절차 보기",
  ar: "افتح ملف البيئة وخطوة إعادة التشغيل",
};

/* ── COPY BLOCK END ──────────────────────────────────────────────────────── */

const SCENARIOS: readonly Scenario[] = [
  {
    index: "01",
    icon: "support",
    accent: "brand",
    name: AI_NAME,
    actor: AI_ACTOR,
    tagline: AI_TAGLINE,
    body: AI_BODY,
    steps: [AI_S1, AI_S2, AI_S3],
    state: STATE_ON,
    tech: "ai_agent_plugin.py · POST /api/v1/plugins/ai/chat",
    href: "#plugins",
    link: AI_LINK,
  },
  {
    index: "02",
    icon: "auto",
    accent: "brand",
    name: AUTO_NAME,
    actor: AUTO_ACTOR,
    tagline: AUTO_TAGLINE,
    body: AUTO_BODY,
    steps: [AUTO_S1, AUTO_S2, AUTO_S3],
    state: STATE_ON,
    tech: "POST /api/v1/menu/push · POST /api/v1/send/text",
    href: "#architecture",
    link: AUTO_LINK,
  },
  {
    index: "03",
    icon: "channel",
    accent: "brand",
    name: CHANNEL_NAME,
    actor: CHANNEL_ACTOR,
    tagline: CHANNEL_TAGLINE,
    body: CHANNEL_BODY,
    steps: [CHANNEL_S1, CHANNEL_S2, CHANNEL_S3],
    state: STATE_CORE,
    tech: "popopx.channel.enc.v1 · Ed25519 + ChaCha20-Poly1305",
    href: "#protocol",
    link: CHANNEL_LINK,
  },
  {
    index: "04",
    icon: "alert",
    accent: "mesh",
    name: ALERT_NAME,
    actor: ALERT_ACTOR,
    tagline: ALERT_TAGLINE,
    body: ALERT_BODY,
    steps: [ALERT_S1, ALERT_S2, ALERT_S3],
    state: STATE_ON,
    tech: "alert_ops_plugin.py · POST /api/v1/plugins/alerts/webhook",
    href: "#security",
    link: ALERT_LINK,
  },
  {
    index: "05",
    icon: "scan",
    accent: "mesh",
    name: SSO_NAME,
    actor: SSO_ACTOR,
    tagline: SSO_TAGLINE,
    body: SSO_BODY,
    steps: [SSO_S1, SSO_S2, SSO_S3],
    state: STATE_ON,
    tech: "privacy_sso_plugin.py · POST /api/v1/plugins/sso/verify",
    href: "#sandbox",
    link: SSO_LINK,
  },
  {
    index: "06",
    icon: "local",
    accent: "mesh",
    name: LOCAL_NAME,
    actor: LOCAL_ACTOR,
    tagline: LOCAL_TAGLINE,
    body: LOCAL_BODY,
    steps: [LOCAL_S1, LOCAL_S2, LOCAL_S3],
    state: STATE_ENV,
    tech: "POPOPX_AI_BASE_URL · http://127.0.0.1:11434/v1",
    href: "#install",
    link: LOCAL_LINK,
  },
];

/** Hairline glyphs, drawn inline: no icon font and nothing loaded from anywhere. */
function ScenarioGlyph({ kind }: { kind: ScenarioIcon }): ReactElement {
  const shapes: Record<ScenarioIcon, ReactNode> = {
    support: (
      <>
        <path d="M4 5.5h16v10h-7.5L8 19v-3.5H4z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </>
    ),
    auto: (
      <>
        <path d="M4 5.5h11.5v8H9.2L6.2 16.3V13.5H4z" />
        <path d="M6.9 8.6h6M6.9 11.1h4" />
        <path d="M16.4 15.6l1.9 1.9 3.2-3.7" />
      </>
    ),
    channel: (
      <>
        <circle cx="12" cy="12" r="2.1" />
        <path d="M8.2 8.2a5.4 5.4 0 0 0 0 7.6M15.8 15.8a5.4 5.4 0 0 0 0-7.6" />
        <path d="M5.6 5.6a9 9 0 0 0 0 12.8M18.4 18.4a9 9 0 0 0 0-12.8" />
      </>
    ),
    alert: (
      <>
        <path d="M12 4 5.8 6.6v5.3c0 3.3 2.4 6 6.2 7.4 3.8-1.4 6.2-4.1 6.2-7.4V6.6z" />
        <path d="M12 9.2v3.4M12 15.3h.01" />
      </>
    ),
    scan: (
      <>
        <path d="M4 8.6V5h3.6M20 8.6V5h-3.6M4 15.4V19h3.6M20 15.4V19h-3.6" />
        <path d="M8.5 12h7" />
      </>
    ),
    local: (
      <>
        <rect x="3.6" y="5" width="16.8" height="6.2" rx="1.6" />
        <rect x="3.6" y="12.8" width="16.8" height="6.2" rx="1.6" />
        <path d="M6.9 8.1h4.3M6.9 15.9h4.3" />
        <path d="M16.6 8.1h.01M16.6 15.9h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {shapes[kind]}
    </svg>
  );
}

function ArrowMark(): ReactElement {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
    >
      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
    </svg>
  );
}

export function BusinessScenarios(): ReactElement {
  const { locale } = useLocale();
  const note = useCopy(NOTE);

  return (
    <section id="scenarios" className="relative py-14 sm:py-16">
      <div className="section-wrap">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((scenario) => {
            const tone =
              scenario.accent === "mesh"
                ? {
                    chip: "border-mesh/45 bg-mesh/10 text-white",
                    box: "border-mesh/40 bg-mesh/10 text-mesh-soft",
                    num: "text-mesh-soft/80",
                  }
                : {
                    chip: "border-brand/45 bg-brand/10 text-white",
                    box: "border-brand/40 bg-brand/10 text-brand-soft",
                    num: "text-brand-soft/80",
                  };

            return (
              <article
                key={scenario.index}
                // min-w-0 + inherited overflow-wrap: a single-column grid track never shrinks
                // below its item's min-content, and one unbreakable env token (
                // POPOPX_AI_RATE_LIMIT_WINDOW_SECONDS=300) is wider than the card's content box.
                className="glass glass-hover flex min-w-0 flex-col gap-4 p-5 [overflow-wrap:anywhere]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`chip ${tone.chip}`}>
                    <StatusDot tone={scenario.accent} />
                    {pick(scenario.actor, locale)}
                  </span>
                  <span className="font-mono text-[11px] tracking-tight text-faint">
                    {scenario.index}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${tone.box}`}
                  >
                    <ScenarioGlyph kind={scenario.icon} />
                  </span>
                  <h3 className="text-[16.5px] font-semibold leading-snug tracking-tight text-white">
                    {pick(scenario.name, locale)}
                  </h3>
                </div>

                <p className="text-[13.5px] leading-relaxed text-[#dedeee]">
                  {pick(scenario.tagline, locale)}
                </p>
                <p className="text-[12.5px] leading-relaxed text-mute">
                  {pick(scenario.body, locale)}
                </p>

                <ol className="hairline-top grid gap-2 pt-3.5">
                  {scenario.steps.map((step, order) => (
                    <li
                      key={step.en}
                      className="flex items-start gap-2.5 text-[12.5px] leading-relaxed text-mute"
                    >
                      <span
                        className={`mt-px shrink-0 font-mono text-[10.5px] ${tone.num}`}
                      >
                        {order + 1}
                      </span>
                      <span>{pick(step, locale)}</span>
                    </li>
                  ))}
                </ol>

                <p className="font-mono text-[10.5px] leading-relaxed text-faint">
                  {scenario.tech}
                </p>

                <div className="hairline-top flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-3.5">
                  <span className="pill text-[11px]">{pick(scenario.state, locale)}</span>
                  <a
                    href={scenario.href}
                    className="group inline-flex items-center gap-1.5 text-[12.5px] text-brand-soft transition-colors duration-200 hover:text-white"
                  >
                    {pick(scenario.link, locale)}
                    <ArrowMark />
                  </a>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 flex max-w-3xl items-start gap-2 text-[11.5px] leading-relaxed text-faint">
          <span className="mt-1.5 shrink-0">
            <StatusDot tone="mesh" pulse />
          </span>
          <span>{note}</span>
        </p>
      </div>
    </section>
  );
}
