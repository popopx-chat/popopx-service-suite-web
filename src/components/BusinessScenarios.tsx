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
 * order. So this section is the first thing below the fold, it names four
 * scenarios instead of five modules, and every card is written as what happens
 * for the shop, the editor, the on-call engineer and the site that needs a login.
 * The developer half of the audience is not served less: one monospaced line per
 * card carries the real module file and the real route, and the card link jumps
 * to the deep section that documents it (`#plugins`, `#protocol`, `#security`,
 * `#sandbox`). Nothing is promised here that the catalog, the protocol quick
 * reference or the governance section has to walk back.
 *
 * Two claims are deliberately kept apart, because the page has to be honest
 * rather than flattering: three cards are plugin modules that ship in this
 * release and are on by factory default, and the encrypted channel is core
 * gateway behaviour — not a plugin, and not zero-knowledge with respect to the
 * merchant's own server, which is the issuer holding the channel key pair. The
 * caveat is printed in the card, not hidden below.
 *
 * Copy. Every string is a literal `Localized<string>` map listing all 18 tags
 * `src/lib/i18n.tsx` declares — the same set the iOS client ships — so the
 * compiler and `tools/check-i18n.mjs` both see every language a visitor gets.
 * No slot is derived from another language, nothing is cast, nothing is spread.
 * Wire tokens (module file names, routes, `epoch`, `Ed25519`) are plain `string`
 * on purpose: they are bytes on a wire, not prose, and every language reads the
 * same one. The word 确认 in the DevOps card is ordinary UI prose ("tap
 * acknowledge"), not the factory alert-resolve keyword list, which stays the
 * simplified literal `确认,已处理,ack,resolve` in `PluginsShowcase.tsx`.
 */

type ScenarioIcon = "support" | "channel" | "alert" | "scan";

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

/* ── COPY BLOCK START: 38 literal 18-locale maps, authored per language ───── */

const EYEBROW: Localized<string> = {
  en: "What you can do with it",
  ru: "Что это даёт",
  de: "Vier Einsatzmöglichkeiten",
  fr: "Cas d’usage",
  it: "Casi d’uso",
  nl: "Vier praktijkscenario's",
  cs: "Čtyři scénáře nasazení",
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
};

const TITLE: Localized<string> = {
  en: "Four scenarios you can run today: support, publishing, alerting, sign-in",
  ru: "Четыре сценария, которые можно запустить сегодня: поддержка, рассылка, оповещения, вход",
  de: "Vier Szenarien für heute: KI-Support, Kanal, Alarme, Login",
  fr: "Quatre scénarios que vous lancez dès aujourd’hui : support, publication, alertes, connexion",
  it: "Quattro scenari che puoi usare oggi: assistenza, pubblicazione, avvisi, login",
  nl: "Vier scenario's die vandaag draaien: support, publiceren, alarmen, inloggen",
  cs: "Čtyři scénáře, které dnes spuštíte: podpora, vysílání, alarmy, přihlášení",
  "zh-Hans": "四个今天就能跑起来的场景：客服、发布、告警、登录",
  "zh-Hant": "四個今天就能跑起來的場景：客服、發布、告警、登入",
  es: "Cuatro escenarios que puedes usar hoy: soporte, publicación, alertas, acceso",
  pl: "Cztery scenariusze, które działają dziś: obsługa klienta, publikacja, alerty, logowanie",
  ja: "今日から動かせる4つのシーン：サポート、配信、アラート、ログイン",
  th: "ใช้ได้วันนี้ 4 แบบ: สนับสนุน เผยแพร่ แจ้งเตือน และเข้าสู่ระบบ",
  fi: "Neljä tänään käynnistyvää skenaariota: tuki, julkaisu, hälytykset, kirjautuminen",
  uk: "Чотири сценарії, які можна запустити сьогодні: підтримка, розсилка, сповіщення, вхід",
  bg: "Четири сценария, които можете да пуснете днес: поддръжка, публикуване, аларми, вход",
  tr: "Bugün çalıştırabileceğiniz dört senaryo: destek, yayın, uyarı ve giriş",
  hu: "Négy ma futtatható forgatókönyv: ügyfélszolgálat, közzététel, riasztás, belépés",
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
};

const NOTE: Localized<string> = {
  en: "Three of these are plugin modules that ship with this release and are on by factory default; the encrypted channel is core gateway behaviour, not a plugin. All of them run on the gateway you deploy yourself, and the page you are reading loads no third-party script.",
  ru: "Три из них — модули плагинов этой поставки, включённые по умолчанию с завода; шифрованный канал — поведение ядра шлюза, а не плагин. Всё работает на вашем собственном шлюзе, и страница не загружает сторонних скриптов.",
  de: "Drei davon sind Plugin-Module dieses Releases, ab Werk aktiv; der verschlüsselte Kanal ist Kernverhalten des Gateways, kein Plugin. Alles läuft auf Ihrem eigenen Gateway, und diese Seite lädt kein Skript Dritter.",
  fr: "Trois sont des modules livrés dans cette version, activés par défaut d’usine ; le canal chiffré relève de la passerelle, pas d’un plugin. Tous tournent sur votre passerelle, et cette page n’embarque aucun script tiers.",
  it: "Tre sono plugin di questa release, attivi al valore di fabbrica; il canale cifrato è nativo del gateway, non un plugin. Tutti girano sul gateway che dispieghi tu; questa pagina non carica script di terze parti.",
  nl: "Drie ervan zijn meegeleverde pluginmodules, af fabriek aan; het versleutelde kanaal is kerngedrag van de gateway, geen plugin. Ze draaien op je eigen gateway; deze pagina laadt geen script van derden.",
  cs: "Tři z nich jsou dodané moduly pluginů, od výroby zapnuté; šifrovaný kanál je chování jádra brány, ne plugin. Vše běží na vaší vlastní bráně a tato stránka nenačítá žádné cizí skripty.",
  "zh-Hans": "四个场景里，三个是随本版本发布、默认开启的插件模块；加密频道是网关的核心能力，不是插件。它们都跑在你自己部署的网关上，而你现在读的这个页面不加载任何第三方脚本。",
  "zh-Hant": "四個場景中，三個是隨本版本發布、預設開啟的外掛模組；加密頻道是閘道的核心能力，不是外掛。它們都跑在你自己部署的閘道上，而你現在讀的這個頁面不載入任何第三方腳本。",
  es: "Tres son complementos de esta versión, activos por valor de fábrica; el canal cifrado es propio de la pasarela, no un complemento. Todo corre en la pasarela que despliegas tú; esta página no carga scripts de terceros.",
  pl: "Trzy to wtyczki z tej wersji, fabrycznie włączone; kanał szyfrowany to rdzeń bramy, nie wtyczka. Wszystkie działają na bramie, którą sam wdrażasz, a ta strona nie ładuje skryptów podmiotów trzecich.",
  ja: "4つのうち3つは、このリリースに同梱され、ファクトリーデフォルトでオンのプラグインモジュールです。暗号化チャンネルはプラグインではなくゲートウェイ本体の機能です。いずれもあなたが自分で立てるゲートウェイ上で動き、このページはサードパーティースクリプトを読み込みません。",
  th: "สามจากสี่อย่างเป็นปลั๊กอินที่มากับเวอร์ชันนี้และเปิดตามค่าเริ่มต้นจากโรงงาน ส่วนช่องทางเข้ารหัสเป็นความสามารถหลักของเกตเวย์ ไม่ใช่ปลั๊กอิน ทั้งหมดรันบนเกตเวย์ที่คุณติดตั้งเอง และหน้านี้ไม่โหลดสคริปต์จากบุคคลที่สาม",
  fi: "Kolme on tämän julkaisun mukana tulevia lisäosamoduuleita, tehdasasetuksiltaan oletuksena päällä; salattu kanava on yhdyskänteen ydintoiminto, ei lisäosa. Kaikki käyvät yhdyskänteellä, jonka isännöit itse, eikä tämä sivu lataa kolmannen osapuolen skriptiä.",
  uk: "Три з них — модулі плагінів цього випуску, типово увімкнені із заводу; зашифрований канал — базова поведінка шлюза, а не плагін. Усе працює на вашому власному шлюзі, а сторінка не завантажує чужих скриптів.",
  bg: "Три от четирите са плъгини от това издание, включени по фабрична настройка; криптираният канал е основно поведение на гейтуейта, не плъгин. Всички работят на собствения ви гейтуейт, а страницата не зарежда чужди скриптове.",
  tr: "Üçü bu sürümle gelen, fabrika çıkışında varsayılan olarak açık eklenti modülleridir; şifreli kanal eklenti değil ağ geçidinin çekirdek davranışıdır. Hepsi sizin kurduğunuz ağ geçidinde çalışır; bu sayfa üçüncü taraf betik yüklemiyor.",
  hu: "Három a kiadás bővítménye, gyárilag bekapcsolva; a titkosított csatorna az átjáró alapviselkedése, nem bővítmény. Mind a magad telepítette átjárón fut; ez az oldal nem tölt be harmadik féltől származó szkriptet.",
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
    index: "03",
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
    index: "04",
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

        <div className="mt-9 grid gap-4 sm:grid-cols-2">
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
                className="glass glass-hover flex flex-col gap-4 p-5"
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
