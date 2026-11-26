"use client";

import type { ReactElement } from "react";
import { SectionHeading, StatusDot } from "@/components/ui";
import { pick, useLocale, type Localized } from "@/lib/i18n";
import { ADMIN_CONSOLE_URL, NODE_WS_URL } from "@/lib/site";

/**
 * 服务号五大技术特点 + 双核架构与三方生态对比.
 *
 * Every number, key name and limit on this screen is read out of the sibling
 * checkout rather than invented here:
 *   .env.example                  POPOPX_GATEWAY_PORT=8080, POPOPX_NODE_WS_URL, POPOPX_DB_PATH
 *   app/config.py  (NodeConfig)   the node binds 127.0.0.1 and cannot serve elsewhere
 *   app/crypto_service.py         EcoLimits, CARD_STYLES, MENU_ITEM_KINDS,
 *                                 MENU_ACTION_KINDS, the four frame builders,
 *                                 ChannelEnvelope, verify_h5_auth
 *   app/database.py               the zero-knowledge channel tables — and what the
 *                                 gateway legitimately does hold
 *   README.md / README.en.md      the loopback-only, no-linking, no-redistribution line
 *
 * Copy follows the portal's authoring rule: `Localized<T>` in `src/lib/i18n.tsx`
 * is a total map over the 18 tags the iOS client declares, so every slot on this
 * screen is written as a literal object carrying all 18 languages. The compiler
 * is the completeness oracle — a missing language is a type error, not a silent
 * runtime fallback. Protocol tokens, env keys, byte counts and endpoint paths
 * stay locale-free.
 */

type Feature = {
  readonly index: string;
  readonly title: Localized<string>;
  readonly hook: Localized<string>;
  readonly facts: readonly Localized<string>[];
  /** Locale-free protocol token, verbatim from the source. */
  readonly chip: string;
  readonly tone: "brand" | "mesh";
};

const FEATURES: readonly Feature[] = [
  {
    index: "01",
    tone: "brand",
    chip: "ws://127.0.0.1:5225",
    title: {
      en: "Physically separated containers",
      ru: "Физически разделённые контейнеры",
      de: "Physisch getrennte Container",
      fr: "Des conteneurs physiquement séparés",
      it: "Contenitori fisicamente separati",
      nl: "Fysiek gescheiden containers",
      cs: "Fyzicky oddělené kontejnery",
      "zh-Hans": "独立容器物理隔离",
      "zh-Hant": "獨立容器物理隔離",
      es: "Contenedores físicamente separados",
      pl: "Fizycznie oddzielone kontenery",
      ja: "物理的に分離されたコンテナ",
      th: "คอนเทนเนอร์แยกกันทางกายภาพ",
      fi: "Fyysisesti erilliset containerit",
      uk: "Фізично розділені контейнери",
      bg: "Физически разделени контейнери",
      tr: "Fiziksel olarak ayrılmış containerlar",
      hu: "Fizikailag elkülönített konténerek",
    },
    hook: {
      en: "The gateway and the open-source node are two processes joined by one loopback WebSocket.",
      ru: "Шлюз и узел с открытым кодом — два процесса, соединённые одним loopback WebSocket.",
      de: "Gateway und Open-Source-Node sind zwei Prozesse, verbunden über ein einziges Loopback-WebSocket.",
      fr: "La passerelle et le nœud open source sont deux processus reliés par un unique WebSocket en boucle locale.",
      it: "Il gateway e il nodo open source sono due processi collegati da un solo WebSocket su loopback.",
      nl: "De gateway en de open-source-node zijn twee processen, verbonden door één loopback-WebSocket.",
      cs: "Brána a open-source uzel jsou dva procesy spojené jediným loopback WebSocketem.",
      "zh-Hans": "网关与开源节点是两个进程，中间只有一条回环 WebSocket。",
      "zh-Hant": "閘道器與開放原始碼節點是兩個程序，中間只有一條迴圈 WebSocket。",
      es: "El gateway y el nodo de código abierto son dos procesos unidos por un único WebSocket de loopback.",
      pl: "Brama i węzeł open source to dwa procesy połączone jednym WebSocketem loopback.",
      ja: "ゲートウェイとオープンソースノードは別々のプロセスで、間をつなぐのは 1 本のループバック WebSocket のみ。",
      th: "เกทเวย์กับโหนดโอเพนซอร์สเป็นสองโปรเซส เชื่อมกันด้วย WebSocket แบบ loopback เพียงเส้นเดียว",
      fi: "Yhdyskäntä ja open source -solmu ovat kaksi prosessia, ja niiden välissä on vain yksi loopback-WebSocket.",
      uk: "Шлюз і вузол open source — це два процеси, з’єднані єдиним loopback WebSocket.",
      bg: "Гейтуейтът и възелът с отворен код са два процеса, свързани от един-единствен loopback WebSocket.",
      tr: "Ağ geçidi ile açık kaynaklı düğüm iki ayrı süreçtir ve aralarında yalnızca tek bir loopback WebSocket vardır.",
      hu: "Az átjáró és a nyílt forráskódú csomópont két külön folyamat, közöttük csak egy loopback WebSocket fut.",
    },
    facts: [
      {
        en: "The gateway is a FastAPI service; POPOPX_GATEWAY_PORT=8080 is its default port.",
        ru: "Шлюз — это сервис FastAPI; его порт по умолчанию задан значением POPOPX_GATEWAY_PORT=8080.",
        de: "Das Gateway ist ein FastAPI-Dienst; POPOPX_GATEWAY_PORT=8080 ist der Standardport.",
        fr: "La passerelle est un service FastAPI ; POPOPX_GATEWAY_PORT=8080 indique son port par défaut.",
        it: "Il gateway è un servizio FastAPI; POPOPX_GATEWAY_PORT=8080 è la sua porta predefinita.",
        nl: "De gateway is een FastAPI-service; POPOPX_GATEWAY_PORT=8080 is de standaardpoort.",
        cs: "Brána je služba FastAPI; výchozí port určuje POPOPX_GATEWAY_PORT=8080.",
        "zh-Hans": "网关是 FastAPI 服务，默认端口由 POPOPX_GATEWAY_PORT=8080 给出。",
        "zh-Hant": "閘道器是 FastAPI 服務，預設通訊埠由 POPOPX_GATEWAY_PORT=8080 給出。",
        es: "El gateway es un servicio FastAPI; POPOPX_GATEWAY_PORT=8080 es su puerto predeterminado.",
        pl: "Brama to usługa FastAPI; jej domyślny port ustawia POPOPX_GATEWAY_PORT=8080.",
        ja: "ゲートウェイは FastAPI サービスで、デフォルトポートは POPOPX_GATEWAY_PORT=8080 が指定します。",
        th: "เกทเวย์เป็นบริการ FastAPI ส่วนพอร์ตค่าเริ่มต้นกำหนดโดย POPOPX_GATEWAY_PORT=8080",
        fi: "Yhdyskäntä on FastAPI-palvelu; POPOPX_GATEWAY_PORT=8080 on sen oletusportti.",
        uk: "Шлюз — це сервіс FastAPI; його типовий порт задає POPOPX_GATEWAY_PORT=8080.",
        bg: "Гейтуейтът е услуга на FastAPI; портът по подразбиране се задава от POPOPX_GATEWAY_PORT=8080.",
        tr: "Ağ geçidi bir FastAPI servisidir; varsayılan portu POPOPX_GATEWAY_PORT=8080 değeri verir.",
        hu: "Az átjáró egy FastAPI szolgáltatás; az alapértelmezett portot a POPOPX_GATEWAY_PORT=8080 érték adja.",
      },
      {
        en: "Its one path to the node is the loopback WebSocket ws://127.0.0.1:5225, and the config layer takes only ws or wss URLs.",
        ru: "Единственный путь к узлу — loopback WebSocket ws://127.0.0.1:5225; слой конфигурации принимает только URL со схемой ws или wss.",
        de: "Der einzige Weg zum Node ist das Loopback-WebSocket ws://127.0.0.1:5225; die Konfigurationsschicht akzeptiert nur ws- oder wss-URLs.",
        fr: "Son unique chemin vers le nœud est le WebSocket en boucle locale ws://127.0.0.1:5225, et la couche de configuration n’accepte que des URL ws ou wss.",
        it: "L’unico percorso verso il nodo è il WebSocket su loopback ws://127.0.0.1:5225, e il layer di configurazione accetta solo URL ws o wss.",
        nl: "Het enige pad naar de node is de loopback-WebSocket ws://127.0.0.1:5225; de configuratielaag accepteert alleen ws- of wss-URL’s.",
        cs: "Jediná cesta k uzlu je loopback WebSocket ws://127.0.0.1:5225 a konfigurační vrstva přijímá pouze URL s ws nebo wss.",
        "zh-Hans": "它通向节点的唯一出口是回环 WebSocket ws://127.0.0.1:5225，配置层只接受 ws 或 wss 形式的 URL。",
        "zh-Hant": "它通往節點的唯一出口是迴圈 WebSocket ws://127.0.0.1:5225，設定層只接受 ws 或 wss 形式的 URL。",
        es: "Su única ruta al nodo es el WebSocket de loopback ws://127.0.0.1:5225, y la capa de configuración solo acepta URL ws o wss.",
        pl: "Jedyną drogą do węzła jest WebSocket loopback ws://127.0.0.1:5225, a warstwa konfiguracji przyjmuje wyłącznie adresy ws lub wss.",
        ja: "ノードへの唯一の出口はループバック WebSocket の ws://127.0.0.1:5225 で、設定層は ws または wss の URL しか受け付けません。",
        th: "ทางเดียวที่ต่อไปยังโหนดคือ WebSocket แบบ loopback ws://127.0.0.1:5225 และชั้นการตั้งค่าจะรับเฉพาะ URL แบบ ws หรือ wss",
        fi: "Ainoa reitti solmuun on loopback-WebSocket ws://127.0.0.1:5225, ja asetuskerros hyväksyy vain ws- tai wss-osoitteet.",
        uk: "Єдиний шлях до вузла — це loopback WebSocket ws://127.0.0.1:5225, а конфігураційний шар приймає лише URL зі схемою ws або wss.",
        bg: "Единственият път към възела е loopback WebSocket ws://127.0.0.1:5225, а конфигурационният слой приема само URL адреси със схема ws или wss.",
        tr: "Düğüme giden tek çıkış loopback WebSocket ws://127.0.0.1:5225; yapılandırma katmanı yalnızca ws veya wss biçiminde URL’leri kabul eder.",
        hu: "Az egyetlen út a csomóponthoz a loopback WebSocket (ws://127.0.0.1:5225), és a konfigurációs réteg csak ws vagy wss formátumú URL-eket fogad el.",
      },
      {
        en: "The node's WebSocket API binds to 127.0.0.1 and cannot be pointed at a public interface, so follower relationships and content stay on the merchant's own server.",
        ru: "WebSocket API узла привязан к 127.0.0.1 и его нельзя направить на публичный интерфейс, поэтому связи с подписчиками и контент остаются на сервере самого бизнеса.",
        de: "Die WebSocket-API des Nodes bindet an 127.0.0.1 und lässt sich nicht auf eine öffentliche Schnittstelle richten, daher bleiben Follower-Beziehungen und Inhalte auf dem eigenen Server des Händlers.",
        fr: "L’API WebSocket du nœud est liée à 127.0.0.1 et ne peut pas être dirigée vers une interface publique : les relations avec les abonnés et le contenu restent donc sur le serveur du marchand.",
        it: "L’API WebSocket del nodo è associata a 127.0.0.1 e non può puntare a un’interfaccia pubblica, quindi le relazioni con i follower e i contenuti restano sul server dell’attività.",
        nl: "De WebSocket-API van de node bindt op 127.0.0.1 en kan niet naar een publieke interface wijzen, dus volgrelaties en inhoud blijven op de eigen server van de handelaar.",
        cs: "WebSocket API uzlu je navázaná na 127.0.0.1 a nejde namířit na veřejné rozhraní, takže vztahy s odběrateli i obsah zůstávají na serveru prodejce.",
        "zh-Hans": "节点侧的 WebSocket API 只绑 127.0.0.1、也无法指向公网，所以粉丝关系和内容都留在商户自己的服务器上。",
        "zh-Hant": "節點端的 WebSocket API 只綁 127.0.0.1、也無法指向公網，因此粉絲關係與內容都留在商家自己的伺服器上。",
        es: "La API WebSocket del nodo está vinculada a 127.0.0.1 y no puede apuntar a una interfaz pública, así que las relaciones con los seguidores y el contenido se quedan en el servidor del comercio.",
        pl: "API WebSocket węzła jest związane z 127.0.0.1 i nie można go wskazać na publiczny interfejs, więc relacje z obserwującymi i treść pozostają na serwerze sprzedawcy.",
        ja: "ノード側の WebSocket API は 127.0.0.1 のみにバインドされ、公開インターフェースを指せません。そのためフォロワー関係もコンテンツも事業者自身のサーバーに留まります。",
        th: "WebSocket API ฝั่งโหนดผูกไว้กับ 127.0.0.1 เท่านั้น และชี้ไปยังอินเทอร์เฟซสาธารณะไม่ได้ ความสัมพันธ์กับผู้ติดตามและเนื้อหาจึงอยู่ที่เซิร์ฟเวอร์ของร้านค้าเอง",
        fi: "Solmun WebSocket API sitoutuu vain osoitteeseen 127.0.0.1, eikä sitä voi osoittaa julkiseen liitäntään, joten seuraajasuhteet ja sisältö pysyvät yrityksen omalla palvelimella.",
        uk: "WebSocket API вузла прив’язаний до 127.0.0.1 і його неможливо спрямувати на публічний інтерфейс, тому зв’язки з підписниками й контент лишаються на сервері самого підприємця.",
        bg: "WebSocket API на възела е обвързано с 127.0.0.1 и не може да сочи към публичен интерфейс, затова връзките с последователи и съдържанието остават на собствения сървър на търговеца.",
        tr: "Düğümün WebSocket API’si yalnızca 127.0.0.1'e bağlanır ve genel bir arayüze yönlendirilemez; böylece takipçi ilişkileri de içerik de işletmenin kendi sunucusunda kalır.",
        hu: "A csomópont WebSocket API-ja csak a 127.0.0.1 címhez kötődik, és nem irányítható nyilvános interfészre, ezért a követői kapcsolatok és a tartalom a kereskedő saját szerverén marad.",
      },
    ],
  },
  {
    index: "02",
    tone: "mesh",
    chip: "max_menu_items=3 · max_menu_subitems=5",
    title: {
      en: "Bottom menu, two levels (3 × 5)",
      ru: "Нижнее меню в два уровня (3 × 5)",
      de: "Unteres Menü mit zwei Ebenen (3 × 5)",
      fr: "Un menu bas de page à deux niveaux (3 × 5)",
      it: "Menu inferiore a due livelli (3 × 5)",
      nl: "Menu onderaan, twee niveaus (3 × 5)",
      cs: "Spodní nabídka, dvě úrovně (3 × 5)",
      "zh-Hans": "底部自定义菜单（两级 3 × 5）",
      "zh-Hant": "底部自訂選單（兩級 3 × 5）",
      es: "Menú inferior, dos niveles (3 × 5)",
      pl: "Menu dolne, dwa poziomy (3 × 5)",
      ja: "ボトムメニューは2階層（3 × 5）",
      th: "เมนูด้านล่างสองระดับ (3 × 5)",
      fi: "Alavalikko, kaksi tasoa (3 × 5)",
      uk: "Нижнє меню у два рівні (3 × 5)",
      bg: "Долно меню с две нива (3 × 5)",
      tr: "Alt menü, iki düzey (3 × 5)",
      hu: "Alsó menü, két szint (3 × 5)",
    },
    hook: {
      en: "Three top-level entries, up to five sub-entries each — the client renders exactly two levels.",
      ru: "Три пункта верхнего уровня и до пяти подпунктов у каждого — клиент рисует ровно два уровня.",
      de: "Drei Einträge auf der ersten Ebene, jeder mit bis zu fünf Untereinträgen – das Client rendert genau zwei Ebenen.",
      fr: "Trois entrées de premier niveau, chacune avec jusqu'à cinq sous-entrées : le client n'affiche exactement que deux niveaux.",
      it: "Tre voci di primo livello, ciascuna con fino a cinque sottovoci: il client visualizza esattamente due livelli.",
      nl: "Drie items op het eerste niveau, elk met maximaal vijf subitems — de client tekent precies twee niveaus.",
      cs: "Tři položky nejvyšší úrovně, každá až s pěti podpoložkami — klient vykreslí přesně dvě úrovně.",
      "zh-Hans": "三个一级项、每项最多五个子项，客户端只画两级。",
      "zh-Hant": "三個一級項、每項最多五個子項，客戶端只畫兩級。",
      es: "Tres entradas de primer nivel, con hasta cinco subentradas cada una: el cliente muestra exactamente dos niveles.",
      pl: "Trzy pozycje pierwszego poziomu, każda z maksymalnie pięcioma podpozycjami — klient wyświetla dokładnie dwa poziomy.",
      ja: "第1階層は3項目、各項目の子項目は最大5件。クライアントが描画するのはちょうど2階層までです。",
      th: "เมนูชั้นแรกมี 3 รายการ แต่ละรายการมีรายการย่อยได้สูงสุด 5 รายการ ไคลเอนต์เร็นเดอร์แค่สองระดับ",
      fi: "Kolme päätason kohtaa, jokaisessa enintään viisi alakohtaa — sovellus piirtää täsmälleen kaksi tasoa.",
      uk: "Три пункти верхнього рівня, у кожному до п'яти підпунктів — клієнт малює рівно два рівні.",
      bg: "Три елемента от горното ниво, всеки с до пет поделементи — клиентът изобразява точно две нива.",
      tr: "Üst düzeyde üç öğe, her birinde en çok beş alt öğe — istemci tam olarak iki düzey çizer.",
      hu: "Felső szinten három bejegyzés, mindegyikben legfeljebb öt albejegyzés — a kliens pontosan két szintet jelenít meg.",
    },
    facts: [
      {
        en: "The ceilings come from EcoLimits — max_menu_items=3 and max_menu_subitems=5 — and titles have to be unique within a level.",
        ru: "Пределы задаёт EcoLimits: max_menu_items=3 и max_menu_subitems=5, а заголовки внутри одного уровня должны быть разными.",
        de: "Die Obergrenzen kommen aus EcoLimits – max_menu_items=3 und max_menu_subitems=5 – und Titel müssen innerhalb einer Ebene eindeutig sein.",
        fr: "Les plafonds viennent de EcoLimits : max_menu_items=3 et max_menu_subitems=5, et les titres doivent être uniques au sein d'un niveau.",
        it: "I limiti derivano da EcoLimits: max_menu_items=3 e max_menu_subitems=5; inoltre i titoli devono essere univoci all'interno di un livello.",
        nl: "De plafonds komen uit EcoLimits: max_menu_items=3 en max_menu_subitems=5, en titels moeten binnen een niveau uniek zijn.",
        cs: "Stropy pocházejí z EcoLimits: max_menu_items=3 a max_menu_subitems=5 a názvy se v rámci jedné úrovně nesmí opakovat.",
        "zh-Hans": "上限来自 EcoLimits：max_menu_items=3、max_menu_subitems=5，同级的标题还必须互不相同。",
        "zh-Hant": "上限來自 EcoLimits：max_menu_items=3、max_menu_subitems=5，同層的標題還必須互不相同。",
        es: "Los límites vienen de EcoLimits: max_menu_items=3 y max_menu_subitems=5, y los títulos deben ser únicos dentro de un nivel.",
        pl: "Limity wynikają z EcoLimits: max_menu_items=3 i max_menu_subitems=5, a tytuły muszą być unikalne w obrębie jednego poziomu.",
        ja: "上限は EcoLimits の max_menu_items=3 と max_menu_subitems=5 で決まり、同じ階層内でタイトルは重複できません。",
        th: "เพดานกำหนดโดย EcoLimits คือ max_menu_items=3 กับ max_menu_subitems=5 และชื่อในระดับเดียวกันต้องไม่ซ้ำกัน",
        fi: "Rajojen arvot tulevat EcoLimitsista: max_menu_items=3 ja max_menu_subitems=5, ja nimikkeiden on oltava yksilölliset samalla tasolla.",
        uk: "Обмежі задає EcoLimits: max_menu_items=3 і max_menu_subitems=5, а заголовки в межах одного рівня мають бути різними.",
        bg: "Таваните идват от EcoLimits: max_menu_items=3 и max_menu_subitems=5, а заглавията в рамките на едно ниво трябва да са уникални.",
        tr: "Sınırlar EcoLimits'ten gelir: max_menu_items=3 ve max_menu_subitems=5; üstelik bir düzey içindeki başlıklar benzersiz olmalı.",
        hu: "A felső korlátok az EcoLimitsből jönnek: max_menu_items=3 és max_menu_subitems=5, és egy szinten belül a címeknek egyedinek kell lenniük.",
      },
      {
        en: "Item kinds are click / view / scancode / location / click_text, and a menu action may only be open_url / send_cmd / open_channel / callback.",
        ru: "Типы пунктов — click / view / scancode / location / click_text, а действие меню может быть только open_url / send_cmd / open_channel / callback.",
        de: "Eintragsarten sind click / view / scancode / location / click_text, und als Menüaktion kommen nur open_url / send_cmd / open_channel / callback in Frage.",
        fr: "Les types d'entrée sont click / view / scancode / location / click_text, et une action de menu ne peut être que open_url / send_cmd / open_channel / callback.",
        it: "I tipi di voce sono click / view / scancode / location / click_text e un'azione di menu può essere soltanto open_url / send_cmd / open_channel / callback.",
        nl: "Itemsoorten zijn click / view / scancode / location / click_text, en een menuactie mag alleen open_url / send_cmd / open_channel / callback zijn.",
        cs: "Druhy položek jsou click / view / scancode / location / click_text a akcí nabídky může být pouze open_url / send_cmd / open_channel / callback.",
        "zh-Hans": "条目类型是 click / view / scancode / location / click_text，菜单动作只能是 open_url / send_cmd / open_channel / callback。",
        "zh-Hant": "項目類型是 click / view / scancode / location / click_text，選單動作只能是 open_url / send_cmd / open_channel / callback。",
        es: "Los tipos de entrada son click / view / scancode / location / click_text, y una acción del menú solo puede ser open_url / send_cmd / open_channel / callback.",
        pl: "Rodzaje pozycji to click / view / scancode / location / click_text, a akcja menu może być tylko open_url / send_cmd / open_channel / callback.",
        ja: "項目のタイプは click / view / scancode / location / click_text、メニュー動作は open_url / send_cmd / open_channel / callback のみです。",
        th: "ชนิดของรายการคือ click / view / scancode / location / click_text และการกระทำของเมนูจะเป็นได้แค่ open_url / send_cmd / open_channel / callback เท่านั้น",
        fi: "Kohtien tyypit ovat click / view / scancode / location / click_text, ja valikon toiminto voi olla vain open_url / send_cmd / open_channel / callback.",
        uk: "Типи пунктів — click / view / scancode / location / click_text, а дія меню може бути лише open_url / send_cmd / open_channel / callback.",
        bg: "Видовете елементи са click / view / scancode / location / click_text, а действието в менюто може да е само open_url / send_cmd / open_channel / callback.",
        tr: "Öğe türleri click / view / scancode / location / click_text; bir menü eylemi ise yalnızca open_url / send_cmd / open_channel / callback olabilir.",
        hu: "A bejegyzések típusai click / view / scancode / location / click_text, egy menüművelet pedig csak open_url / send_cmd / open_channel / callback lehet.",
      },
      {
        en: "The menu ships whole as an ECO frame with t=mc, sub-items under the sub key. A third level makes the client drop the entire menu, so the gateway refuses it before sending.",
        ru: "Меню уходит целиком как ECO-кадр с t=mc, подпункты лежат в ключе sub. Третий уровень заставил бы клиент отбросить всё меню, поэтому шлюз отвергает его до отправки.",
        de: "Das Menü geht komplett als ECO-Rahmen mit t=mc hinaus, Untereinträge hängen unter dem Schlüssel sub. Eine dritte Ebene würde das ganze Menü im Client kippen, deshalb lehnt das Gateway sie schon vor dem Senden ab.",
        fr: "Le menu part entier dans une trame ECO avec t=mc, les sous-entrées étant placées sous la clé sub. Un troisième niveau ferait jeter le menu entier au client, donc la passerelle le refuse avant l'envoi.",
        it: "L'intero menu viene inviato come frame ECO con t=mc, con le sottovoci sotto la chiave sub; un terzo livello farebbe scartare al client tutto il menu, quindi il gateway lo rifiuta prima di inviarlo.",
        nl: "Het hele menu gaat als één ECO-frame met t=mc, subitems onder de sleutel sub. Een derde niveau zorgt ervoor dat de client het hele menu laat vallen, dus de gateway weigert het vóór het versturen.",
        cs: "Celá nabídka se odesílá jako jeden ECO rám s t=mc a podpoložkami pod klíčem sub. Třetí úroveň přiměje klienta zahodit celou nabídku, proto ji brána odmítne ještě před odesláním.",
        "zh-Hans": "整份菜单以 t=mc 的 ECO 帧下发，子项挂在 sub 键下；出现第三级时客户端会丢掉整个菜单，所以网关在送出前就拒绝。",
        "zh-Hant": "整份選單以 t=mc 的 ECO 幀下發，子項掛在 sub 鍵下；出現第三級時客戶端會丟掉整個選單，所以閘道器在送出前就拒絕。",
        es: "El menú completo se envía como un cuadro ECO con t=mc, con las subentradas bajo la clave sub. Un tercer nivel haría que el cliente descartara todo el menú, así que el gateway lo rechaza antes de enviarlo.",
        pl: "Całe menu jest wysyłane jako ramka ECO z t=mc, a podpozycje znajdują się pod kluczem sub. Trzeci poziom sprawiłby, że klient odrzucił całe menu, więc brama odmawia go jeszcze przed wysłaniem.",
        ja: "メニューは t=mc の ECO フレームとして一括送信され、子項目は sub キーに入ります。第3階層があるとクライアントがメニュー全体を破棄するため、ゲートウェイは送信前に拒否します。",
        th: "เมนูจะถูกส่งทั้งชุดเป็นเฟรม ECO แบบ t=mc โดยรายการย่อยอยู่ใต้คีย์ sub ถ้ามีระดับที่สาม ไคลเอนต์จะทิ้งเมนูทั้งเมนู เกทเวย์จึงปฏิเสธก่อนส่ง",
        fi: "Koko valikko lähtee yhtenä ECO-kehyksenä arvolla t=mc, ja alakohteet ovat avaimen sub alla. Kolmas taso saisi sovelluksen hylkäämään koko valikon, joten yhdyskäntä kieltäytyy siitä jo ennen lähetystä.",
        uk: "Меню надходить цілком як ECO-кадр із t=mc, підпункти лежать у ключі sub. Третій рівень змусив би клієнта відкинути все меню, тому шлюз відмовляє ще до надсилання.",
        bg: "Цялото меню се изпраща като един ECO кадър с t=mc, а поделементите са под ключа sub. Трето ниво кара клиента да изхвърли цялото меню, затова гейтуейтът го отхвърля още преди изпращането.",
        tr: "Menünün tamamı t=mc değerli bir ECO çerçevesi olarak gönderilir, alt öğeler sub anahtarının altında durur. Üçüncü düzey istemciyi menünün tamamını çöpe atmaya zorladığı için ağ geçidi bunu göndermeden önce reddeder.",
        hu: "A menu egészében egy t=mc jelölésű ECO keretként megy ki, az albejegyzések a sub kulcs alatt helyezkednek el. Egy harmadik szint a klienst a teljes menu eldobatására kényszerítené, ezért az átjáró már küldés előtt elutasítja.",
      },
    ],
  },
  {
    index: "03",
    tone: "brand",
    chip: "::POPOPX_ECO::",
    title: {
      en: "Three-style dynamic business cards",
      ru: "Динамические бизнес-карты в трёх стилях",
      de: "Dynamische Geschäftskarten in drei Stilen",
      fr: "Cartes d'entreprise dynamiques en trois styles",
      it: "Card aziendali dinamiche in tre stili",
      nl: "Dynamische zakelijke kaarten in drie stijlen",
      cs: "Dynamické obchodní karty ve třech stylech",
      "zh-Hans": "三样式动态业务卡片",
      "zh-Hant": "三樣式動態業務卡片",
      es: "Tarjetas de negocio dinámicas en tres estilos",
      pl: "Dynamiczne karty biznesowe w trzech stylach",
      ja: "3 種類のスタイルを持つ動的ビジネスカード",
      th: "การ์ดธุรกิจแบบไดนามิกสามรูปแบบ",
      fi: "Dynaamiset yrityskortit kolmessa tyylissä",
      uk: "Динамічні бізнес-картки у трьох стилях",
      bg: "Динамични бизнес карти в три стила",
      tr: "Üç stilli dinamik iş kartları",
      hu: "Dinamikus üzleti kártyák három stílusban",
    },
    hook: {
      en: "standard / receipt / security styles, refreshable in place on the very same card.",
      ru: "Стили standard / receipt / security, обновление на месте — на той же самой карте.",
      de: "Die Stile standard / receipt / security, die sich auf derselben Karte an Ort und Stelle aktualisieren lassen.",
      fr: "Les styles standard / receipt / security, actualisables sur place sur la même carte.",
      it: "Gli stili standard / receipt / security, aggiornabili sul posto sulla stessa identica card.",
      nl: "De stijlen standard / receipt / security, ter plaatse verversbaar op exact dezelfde kaart.",
      cs: "Styly standard / receipt / security, aktualizovatelné na místě na téže kartě.",
      "zh-Hans": "standard / receipt / security 三种样式，同一张卡片可以原地刷新。",
      "zh-Hant": "standard / receipt / security 三種樣式，同一張卡片可以原地重新整理。",
      es: "Los estilos standard / receipt / security, actualizables en el mismo sitio sobre esa misma tarjeta.",
      pl: "Style standard / receipt / security, odświeżane w miejscu na tej samej karcie.",
      ja: "スタイルは standard / receipt / security の 3 種で、同じカードそのままその場で更新できます。",
      th: "มีสามสไตล์คือ standard / receipt / security และรีเฟรช ณ ตำแหน่งเดิมบนการ์ดใบเดิมได้",
      fi: "Tyylit standard / receipt / security, ja samaa korttia voi päivittää paikan päällä.",
      uk: "Стили standard / receipt / security, оновлювані на місці на тій самій картці.",
      bg: "Стиловете standard / receipt / security, които се опресняват на място върху самата карта.",
      tr: "standard / receipt / security stilleri; aynı kartın üzerinde, yerinde yenilenebilir.",
      hu: "standard / receipt / security stílusok, amelyek ugyanannak a kártyának a helyén frissíthetők.",
    },
    facts: [
      {
        en: "Styles come from CARD_STYLES. A card frame is t=sc, where m=c creates and m=u replaces in place by cardId — which is how a progress bar moves without another message appearing.",
        ru: "Стили берутся из CARD_STYLES. Кадр карты — это t=sc, где m=c создаёт, а m=u заменяет на месте по cardId; именно поэтому полоса прогресса двигается, а нового сообщения не появляется.",
        de: "Die Stile kommen aus CARD_STYLES. Ein Kartenrahmen ist t=sc, wobei m=c neu anlegt und m=u per cardId an Ort und Stelle ersetzt – so bewegt sich eine Fortschrittsanzeige, ohne dass eine weitere Nachricht auftaucht.",
        fr: "Les styles viennent de CARD_STYLES. Une trame de carte est t=sc, où m=c crée et m=u remplace sur place d'après cardId : c'est ainsi qu'une barre de progression avance sans qu'un nouveau message n'apparaisse.",
        it: "Gli stili vengono da CARD_STYLES. Un frame di card è t=sc, dove m=c crea e m=u sostituisce sul posto tramite cardId: è così che una barra di progresso si muove senza che compaia un nuovo messaggio.",
        nl: "De stijlen komen uit CARD_STYLES. Een kaartframe is t=sc, waarbij m=c aanmaakt en m=u ter plaatse vervangt via cardId — zo beweegt een voortgangsbalk zonder dat er nog een bericht bij komt.",
        cs: "Styly pocházejí z CARD_STYLES. Rám karty je t=sc, kde m=c vytvoří a m=u nahradí na místě podle cardId — tak se posouvá ukazatel průběhu, aniž by se objevila další zpráva.",
        "zh-Hans": "样式取自 CARD_STYLES；卡片帧是 t=sc，m=c 新建、m=u 按 cardId 原地替换，进度条因此移动而不会多出一条消息。",
        "zh-Hant": "樣式取自 CARD_STYLES；卡片幀是 t=sc，m=c 新建、m=u 依 cardId 原地取代，進度條因此移動而不會多出一則訊息。",
        es: "Los estilos vienen de CARD_STYLES. Un cuadro de tarjeta es t=sc, donde m=c crea y m=u reemplaza en el sitio mediante cardId; así es como una barra de progreso se mueve sin que aparezca otro mensaje.",
        pl: "Style pochodzą z CARD_STYLES. Ramka karty to t=sc, gdzie m=c tworzy, a m=u zastępuje w miejscu na podstawie cardId — dlatego pasek postępu przesuwa się bez pojawiania kolejnej wiadomości.",
        ja: "スタイルは CARD_STYLES に定義され、カードフレームは t=sc です。m=c が新規作成、m=u が cardId で原地更新を担当するため、進行バーは新しいメッセージを増やさずに動きます。",
        th: "สไตล์กำหนดใน CARD_STYLES ส่วนเฟรมของการ์ดคือ t=sc โดย m=c สร้างใหม่ และ m=u แทนที่ตำแหน่งเดิมด้วย cardId แถบความคืบหน้าจึงเลื่อนได้โดยไม่ต้องมีข้อความใหม่",
        fi: "Tyylit tulevat CARD_STYLESista. Kortin kehys on t=sc, jossa m=c luo uuden ja m=u korvaa paikan päällä cardId:n mukaan — näin etenemispalkki siirtyy ilman, että viereen ilmestyy uutta viestiä.",
        uk: "Стилі беруться з CARD_STYLES. Кадр картки — це t=sc, де m=c створює, а m=u замінює на місці за cardId; саме тому смуга поступу рухається, не створюючи нового повідомлення.",
        bg: "Стиловете идват от CARD_STYLES. Кадърът на карта е t=sc, където m=c създава, а m=u замества на място по cardId — затова прогрес барът се движи, без да се появява ново съобщение.",
        tr: "Stiller CARD_STYLES'ten gelir. Bir kart çerçevesi t=sc'dir; m=c yeni oluşturur, m=u ise cardId ile yerinde değiştirir — ilerleme çubuğu, yeni bir mesaj belirmeden bu şekilde hareket eder.",
        hu: "A stílusok a CARD_STYLESből jönnek. Egy kártyakeret t=sc, ahol az m=c létrehoz, az m=u pedig cardId alapján helyettesít a helyén — így mozdul el egy haladássáv úgy, hogy nem jelenik meg új üzenet.",
      },
      {
        en: "The progress object has three keys: l (label), p (percent, 0 to 100) and d (detail); a card may carry up to 8 fields and 4 actions.",
        ru: "У объекта прогресса три ключа: l (подпись), p (проценты, 0–100) и d (подробности); карта несёт не больше 8 полей и 4 действий.",
        de: "Das Fortschrittsobjekt hat drei Schlüssel: l (Bezeichnung), p (Prozent, 0 bis 100) und d (Details); eine Karte darf höchstens 8 Felder und 4 Aktionen tragen.",
        fr: "L'objet de progression compte trois clés : l (libellé), p (pourcentage, de 0 à 100) et d (détail) ; une carte peut porter jusqu'à 8 champs et 4 actions.",
        it: "L'oggetto di progresso ha tre chiavi: l (etichetta), p (percentuale, da 0 a 100) e d (dettaglio); una card può portare fino a 8 campi e 4 azioni.",
        nl: "Het voortgangsobject heeft drie sleutels: l (label), p (percentage, 0 tot 100) en d (detail); een kaart mag maximaal 8 velden en 4 acties bevatten.",
        cs: "Objekt průběhu má tři klíče: l (popisek), p (procenta, 0 až 100) a d (podrobnosti); karta unese nejvýše 8 polí a 4 akce.",
        "zh-Hans": "进度对象三个键：l 标签、p 百分比（0 到 100）、d 明细；字段最多 8 个、动作最多 4 个。",
        "zh-Hant": "進度物件三個鍵：l 標籤、p 百分比（0 到 100）、d 明細；欄位最多 8 個、動作最多 4 個。",
        es: "El objeto de progreso tiene tres claves: l (etiqueta), p (porcentaje, de 0 a 100) y d (detalle); una tarjeta puede llevar hasta 8 campos y 4 acciones.",
        pl: "Obiekt postępu ma trzy klucze: l (etykieta), p (procent, od 0 do 100) i d (szczegóły); karta może zawierać do 8 pól i 4 czynności.",
        ja: "進行オブジェクトのキーは 3 つで、l がラベル、p がパーセンテージ（0〜100）、d が明細です。カードはフィールド最大 8 件、アクション最大 4 件まで持てます。",
        th: "อ็อบเจกต์ความคืบหน้ามีสามคีย์ คือ l (ป้ายชื่อ) p (เปอร์เซ็นต์ 0 ถึง 100) และ d (รายละเอียด) โดยหนึ่งการ์ดมีได้ถึง 8 ฟิลด์และ 4 การกระทำ",
        fi: "Edistymisobjektissa on kolme avainta: l (nimi), p (prosentti 0–100) ja d (tiedot). Kortissa voi olla korkeintaan 8 kenttää ja 4 toimintoa.",
        uk: "Об'єкт поступу має три ключі: l (підпис), p (відсотки, від 0 до 100) та d (деталі); картка може містити до 8 полів і 4 дій.",
        bg: "Обектът на прогреса има три ключа: l (етикет), p (процент, от 0 до 100) и d (подробност); една карта може да носи до 8 полета и 4 действия.",
        tr: "İlerleme nesnesinin üç anahtarı vardır: l (etiket), p (yüzde, 0 ile 100 arası) ve d (ayrıntı); bir kart en fazla 8 alan ve 4 eylem taşıyabilir.",
        hu: "A haladás objektumnak három kulcsa van: l (címke), p (százalék, 0-tól 100-ig) és d (részletek); egy kártya legfeljebb 8 mezőt és 4 műveletet hordozhat.",
      },
      {
        en: "Including the ::POPOPX_ECO:: marker a frame may not exceed 8192 characters (EcoLimits.frame_chars); past that it is a frame the client drops silently.",
        ru: "С учётом метки ::POPOPX_ECO:: кадр не должен превышать 8192 символов (EcoLimits.frame_chars); всё, что длиннее, клиент молча отбрасывает.",
        de: "Inklusive der Markierung ::POPOPX_ECO:: darf ein Rahmen 8192 Zeichen nicht überschreiten (EcoLimits.frame_chars); darüber ist es ein Rahmen, den der Client stillschweigend verwirft.",
        fr: "Y compris le marqueur ::POPOPX_ECO::, une trame ne doit pas dépasser 8192 caractères (EcoLimits.frame_chars) ; au-delà, c'est une trame que le client jette silencieusement.",
        it: "Incluso il marcatore ::POPOPX_ECO::, un frame non può superare 8192 caratteri (EcoLimits.frame_chars); oltre questa soglia è un frame che il client scarta in silenzio.",
        nl: "Inclusief de markering ::POPOPX_ECO:: mag een frame niet langer zijn dan 8192 tekens (EcoLimits.frame_chars); daarboven is het een frame dat de client stilzwijgend laat vallen.",
        cs: "Včetně označení ::POPOPX_ECO:: rám nesmí přesáhnout 8192 znaků (EcoLimits.frame_chars); nad tento limit je to rám, kterého se klient mlčky zbaví.",
        "zh-Hans": "算上 ::POPOPX_ECO:: 标记，整帧上限 8192 个字符（EcoLimits.frame_chars）；超出就是客户端会静默丢弃的帧。",
        "zh-Hant": "算上 ::POPOPX_ECO:: 標記，整幀上限 8192 個字元（EcoLimits.frame_chars）；超出就是客戶端會靜默丟棄的幀。",
        es: "Incluido el marcador ::POPOPX_ECO::, un cuadro no puede superar los 8192 caracteres (EcoLimits.frame_chars); por encima de eso es un cuadro que el cliente descarta en silencio.",
        pl: "Łącznie ze znacznikiem ::POPOPX_ECO:: ramka nie może przekraczać 8192 znaków (EcoLimits.frame_chars); powyżej tej granicy klient po cichu ją odrzuca.",
        ja: "::POPOPX_ECO:: マーカーも含めて 1 フレームは 8192 文字まで（EcoLimits.frame_chars）で、超えたフレームはクライアントが黙って破棄します。",
        th: "รวมเครื่องหมาย ::POPOPX_ECO:: แล้วหนึ่งเฟรมต้องไม่เกิน 8192 อักขระ (EcoLimits.frame_chars) ถ้าเกินถือเป็นเฟรมที่ไคลเอนต์จะทิ้งเงียบ ๆ",
        fi: "Merkintä ::POPOPX_ECO:: mukaan lukien kehys saa olla enintään 8192 merkkiä (EcoLimits.frame_chars); tätä pidempi kehys sovellus hylkää äänettömästi.",
        uk: "З урахуванням мітки ::POPOPX_ECO:: кадр не повинен перевищувати 8192 символи (EcoLimits.frame_chars); довший за те клієнт мовчки відкидає.",
        bg: "Включително маркера ::POPOPX_ECO::, един кадър не може да надхвърля 8192 знака (EcoLimits.frame_chars); отвъд това е кадър, който клиентът мълчаливо изхвърля.",
        tr: "::POPOPX_ECO:: işaretini de sayarsak bir çerçeve 8192 karakteri aşamaz (EcoLimits.frame_chars); aşıyorsa bu, istemcinin sessizce düşürdüğü bir çerçevedir.",
        hu: "A ::POPOPX_ECO:: jelölést is beleszámítva egy keret nem haladhatja meg a 8192 karaktert (EcoLimits.frame_chars); a fölötti keretet a kliens néma csendben eldobja.",
      },
    ],
  },
  {
    index: "04",
    tone: "mesh",
    chip: "POST /api/v1/verifyH5Auth",
    title: {
      en: "Pairwise anonymous H5 signatures",
      ru: "Попарные анонимные подписи H5",
      de: "Paarweise anonyme H5-Signaturen",
      fr: "Signatures H5 paires et anonymes",
      it: "Firme H5 a coppie, anonime",
      nl: "Paarsgewijze anonieme H5-handtekeningen",
      cs: "Párové anonymní H5 podpisy",
      "zh-Hans": "成对匿名 H5 签名，免跨站追踪",
      "zh-Hant": "成對匿名 H5 簽章，免跨站追蹤",
      es: "Firmas H5 por pares y anónimas",
      pl: "Parami anonimowe podpisy H5",
      ja: "ペア単位で匿名化する H5 署名",
      th: "ลายเซ็น H5 แบบนิรนามเฉพาะคู่",
      fi: "Parittaiset nimettömät H5-allekirjoitukset",
      uk: "Попарні анонімні підписи H5",
      bg: "Двойкови анонимни H5 подписи",
      tr: "Çift bazlı anonim H5 imzaları",
      hu: "Páronkénti névtelen H5-aláírások",
    },
    hook: {
      en: "There is no cross-site identifier to join on: the signature only proves that this follower is inside this service account right now.",
      ru: "Нет идентификатора, который можно было бы сопоставить между сайтами: подпись доказывает лишь то, что этот подписчик сейчас находится внутри данного сервиса-аккаунта.",
      de: "Es gibt keinen sitesübergreifenden Bezeichner, an dem man ansetzen könnte: Die Signatur belegt nur, dass dieser Follower sich gerade in diesem Dienstekonto befindet.",
      fr: "Il n'y a aucun identifiant inter-sites sur lequel faire la jointure : la signature prouve seulement que cet abonné se trouve dans ce compte de service à cet instant.",
      it: "Non esiste un identificatore cross-site su cui eseguire il join: la firma dimostra soltanto che questo follower si trova dentro questo account di servizio in questo momento.",
      nl: "Er bestaat geen site-overstijgende identifier om op te joinen: de handtekening bewijst alleen dat deze volger zich nu in dit serviceaccount bevindt.",
      cs: "Neexistuje žádný napříč weby sdílený identifikátor, podle kterého by šlo data spojit: podpis dokládá pouze to, že se tento odběratel právě teď nachází v tomto servisním účtu.",
      "zh-Hans": "没有可供关联的跨站标识：签名只证明这位粉丝此刻在这个服务号里。",
      "zh-Hant": "沒有可供關聯的跨站識別號：簽章只證明這位粉絲此刻在這個服務號裡。",
      es: "No hay ningún identificador entre sitios con el que hacer la correlación: la firma solo demuestra que este seguidor está dentro de esta cuenta de servicio en este momento.",
      pl: "Nie ma identyfikatora ponadwitrynowego, po którym można by łączyć dane: podpis dowodzi jedynie, że ten obserwujący znajduje się teraz w tym koncie serwisowym.",
      ja: "サイト間で突き合わせられる識別子が存在しないため、署名が証明するのは「このフォロワーが今このサービスアカウント内にいる」ということだけです。",
      th: "ไม่มีตัวระบุที่ใช้เชื่อมโยงข้ามเว็บไซต์ ลายเซ็นพิสูจน์เพียงว่าผู้ติดตามคนนี้อยู่ในบัญชีบริการนี้ ณ ขณะนั้น",
      fi: "Ei ole yksittäistä tunnusta, jonka perusteella sivustoja voisi liittää toisiinsa: allekirjoitus todistaa ainoastaan, että tämä seuraaja on juuri nyt tässä palvelutilissä.",
      uk: "Немає ідентифікатора, за яким можна було б зіставити дані між сайтами: підпис доводить лише те, що цей підписник саме зараз перебуває в цьому сервіс-акаунті.",
      bg: "Няма идентификатор за свързване между сайтове: подписът доказва единствено, че този последовател в момента е вътре в този акаунт за услуги.",
      tr: "Siteler arası eşleştirmeye olanak tanıyan hiçbir tanımlayıcı yok: imza yalnızca bu takipçinin şu anda bu hizmet hesabının içinde olduğunu kanıtlar.",
      hu: "Nincs oldalközi azonosító, amiből összefüggésvonást lehetne csinálni: az aláírás csak azt igazolja, hogy ez a követő éppen ebben a szolgáltatási fiókban van.",
    },
    facts: [
      {
        en: "On follow, a t=sh frame with the keys uid / sec / svc is issued: uid is a pairwise ID this gateway mints for that follower (prefix pw_), sec is 32 random bytes.",
        ru: "При подписке выдаётся кадр t=sh с ключами uid / sec / svc: uid — попарный ID, который этот шлюз выпускает для подписчика (префикс pw_), sec — 32 случайных байта.",
        de: "Beim Folgen wird ein Rahmen t=sh mit den Schlüsseln uid / sec / svc ausgegeben: uid ist eine paarweise ID, die dieses Gateway für diesen Follower ausstellt (Präfix pw_), sec sind 32 Zufallsbytes.",
        fr: "À l'abonnement, une trame t=sh portant les clés uid / sec / svc est émise : uid est un identifiant pair que cette passerelle fabrique pour cet abonné (préfixe pw_), sec est une clé de 32 octets aléatoires.",
        it: "All'iscrizione viene emesso un frame t=sh con le chiavi uid / sec / svc: uid è un ID a coppia che questo gateway conia per quel follower, sec è una chiave di 32 byte casuali.",
        nl: "Bij het volgen wordt een frame t=sh met de sleutels uid / sec / svc afgegeven: uid is een paarsgewijze ID die deze gateway voor die volger aanmaakt (prefix pw_), sec is 32 willekeurige bytes.",
        cs: "Při odběru je vydán rám t=sh s klíči uid / sec / svc: uid je párové ID, které tato brána pro daného odběratele vygeneruje (předpona pw_), sec je 32 náhodných bajtů.",
        "zh-Hans": "关注时下发 t=sh 帧，三个键 uid / sec / svc：uid 是本网关为这位粉丝生成的成对 ID（前缀 pw_），sec 是 32 字节随机密钥。",
        "zh-Hant": "關注時下發 t=sh 幀，三個鍵 uid / sec / svc：uid 是本閘道器為這位粉絲產生的成對 ID（前綴 pw_），sec 是 32 位元組隨機密鑰。",
        es: "Al seguir, se emite un cuadro t=sh con las claves uid / sec / svc: uid es un ID por par que este gateway acuña para ese seguidor (prefijo pw_), sec son 32 bytes aleatorios.",
        pl: "Przy obserwacji emitowana jest ramka t=sh z kluczami uid / sec / svc: uid to identyfikator parami, który ta brama nadaje danemu obserwującemu (prefiks pw_), a sec to 32 losowe bajty.",
        ja: "フォロー時に uid / sec / svc の 3 キーを持つ t=sh フレームが発行されます。uid はこのゲートウェイがそのフォロワー용으로採番するペア単位 ID（接頭辞 pw_）、sec は 32 バイトのランダム鍵です。",
        th: "เมื่อติดตาม ระบบจะออกเฟรม t=sh ที่มีคีย์ uid / sec / svc โดย uid เป็น ID เฉพาะคู่ที่เกทเวย์นี้เป็นผู้ออกให้แก่ผู้ติดตามคนนั้น (คำนำหน้า pw_) และ sec เป็นคีย์สุ่มยาว 32 ไบต์",
        fi: "Kun kanavan tilaa, julkaistaan kehys t=sh, jossa on avaimet uid / sec / svc: uid on parittainen tunniste, jonka tämä yhdyskäntä myönsää tälle seuraajalle (etuliite pw_), ja sec on 32 satunnaistavua.",
        uk: "Під час підписки видається кадр t=sh з ключами uid / sec / svc: uid — це попарний ID, який цей шлюз карбує для цього підписника (префікс pw_), а sec — 32 випадкові байти.",
        bg: "При последване се издава кадър t=sh с ключовете uid / sec / svc: uid е двойков идентификатор, който този гейтуейт отсича за този последовател (префикс pw_), а sec е 32 случайни байта.",
        tr: "Takip sırasında uid / sec / svc anahtarlarını içeren bir t=sh çerçevesi verilir: uid, bu ağ geçidinin o takipçi için ürettiği çift bazlı kimliktir (ön ek pw_), sec ise 32 rastgele bayttır.",
        hu: "Követéskor egy uid / sec / svc kulcsokat tartalmazó t=sh keret bocsátó ki: az uid egy páronkénti azonosító, amelyet ez az átjáró ver ki az adott követőnek (pw_ előtaggal), a sec pedig 32 véletlen bájt.",
      },
      {
        en: "The H5 page opens in an out-of-process browser session and calls back to POST /api/v1/verifyH5Auth with the query parameters popopx_uid, ts and sig.",
        ru: "H5-страница открывается в браузерной сессии за пределами процесса и вызывает POST /api/v1/verifyH5Auth с параметрами запроса popopx_uid, ts и sig.",
        de: "Die H5-Seite öffnet in einer browserseitigen, prozessfremden Sitzung und ruft POST /api/v1/verifyH5Auth mit den Query-Parametern popopx_uid, ts und sig auf.",
        fr: "La page H5 s'ouvre dans une session navigateur hors processus et rappelle POST /api/v1/verifyH5Auth avec les paramètres de requête popopx_uid, ts et sig.",
        it: "La pagina H5 si apre in una sessione del browser fuori processo e richiama POST /api/v1/verifyH5Auth con i parametri di query popopx_uid, ts e sig.",
        nl: "De H5-pagina opent in een browsersessie buiten het proces en roept POST /api/v1/verifyH5Auth aan met de queryparameters popopx_uid, ts en sig.",
        cs: "Stránka H5 se otevírá v mimosprocesové relaci prohlížeče a volá zpět POST /api/v1/verifyH5Auth s query parametry popopx_uid, ts a sig.",
        "zh-Hans": "H5 页在进程外的浏览器会话里打开，页面带 popopx_uid、ts、sig 三个查询参数回调 POST /api/v1/verifyH5Auth。",
        "zh-Hant": "H5 頁在程序外的瀏覽器工作階段裡開啟，頁面帶著 popopx_uid、ts、sig 三個查詢參數回呼 POST /api/v1/verifyH5Auth。",
        es: "La página H5 se abre en una sesión del navegador fuera del proceso y devuelve la llamada a POST /api/v1/verifyH5Auth con los parámetros de consulta popopx_uid, ts y sig.",
        pl: "Strona H5 otwiera się w sesji przeglądarki poza procesem i wywołuje zwrotnie POST /api/v1/verifyH5Auth z parametrami zapytania popopx_uid, ts oraz sig.",
        ja: "H5 ページはプロセス外のブラウザセッションで開かれ、クエリパラメータ popopx_uid、ts、sig を付けて POST /api/v1/verifyH5Auth にコールバックします。",
        th: "หน้า H5 เปิดในซีสชันของเบราว์เซอร์ที่อยู่นอกโปรเซส แล้วส่งกลับไปยัง POST /api/v1/verifyH5Auth พร้อมพารามิเตอร์คำขอ popopx_uid, ts และ sig",
        fi: "H5-sivu avautuu prosessin ulkopuolisessa selainistunnossa ja tekee takaisinkutsun osoitteeseen POST /api/v1/verifyH5Auth kyselyparametreilla popopx_uid, ts ja sig.",
        uk: "H5-сторінка відкривається в позапроцесній сесії браузера й викликає зворотньо POST /api/v1/verifyH5Auth із параметрами запиту popopx_uid, ts та sig.",
        bg: "H5 страницата се отваря в браузърна сесия извън процеса и извиква обратно POST /api/v1/verifyH5Auth с заявковите параметри popopx_uid, ts и sig.",
        tr: "H5 sayfası süreç dışı bir tarayıcı oturumunda açılır ve popopx_uid, ts ve sig sorgu parametreleriyle POST /api/v1/verifyH5Auth adresine geri çağrı yapar.",
        hu: "Az H5 oldal egy folyamaton kívüli böngésző-munkamenetben nyílik meg, és a popopx_uid, ts valamint sig lekérdezési paraméterekkel hívja vissza a POST /api/v1/verifyH5Auth végpontot.",
      },
      {
        en: "The signature is HMAC-SHA256 over the fixed preimage uid=<pairwise uid>&ts=<unix seconds>, accepted within a ±300-second window and compared in constant time.",
        ru: "Подпись — HMAC-SHA256 по фиксированному прообразу uid=<попарный uid>&ts=<уникс-секунды>, принимается в окне ±300 секунд и сравнивается за константное время.",
        de: "Die Signatur ist ein HMAC-SHA256 über den festen Urtext uid=<pairwise uid>&ts=<Unix-Sekunden>, angenommen innerhalb eines ±300-Sekunden-Fensters und verglichen in konstanter Zeit.",
        fr: "La signature est un HMAC-SHA256 sur la pré-image fixe uid=<uid pair>&ts=<secondes unix>, acceptée dans une fenêtre de ±300 secondes et comparée en temps constant.",
        it: "La firma è un HMAC-SHA256 calcolato sul preimmaggine fisso uid=<uid a coppia>&ts=<secondi unix>, accettata entro una finestra di ±300 secondi e confrontata in tempo costante.",
        nl: "De handtekening is een HMAC-SHA256 over de vaste pre-image uid=<paarsgewijze uid>&ts=<unix-seconden>, geaccepteerd binnen een venster van ±300 seconden en vergeleken in constante tijd.",
        cs: "Podpis je HMAC-SHA256 nad pevným preimage uid=<párové uid>&ts=<unix sekundy>, přijímán v okně ±300 sekund a porovnáván v konstantním čase.",
        "zh-Hans": "签名是 HMAC-SHA256，原文固定为 uid=成对uid&ts=Unix 秒，时间窗 ±300 秒，比对用常数时间实现。",
        "zh-Hant": "簽章是 HMAC-SHA256，原文固定為 uid=成對uid&ts=Unix 秒，時間窗 ±300 秒，比對採常數時間實作。",
        es: "La firma es un HMAC-SHA256 sobre el preimagen fijo uid=<uid por par>&ts=<segundos unix>, aceptado dentro de una ventana de ±300 segundos y comparado en tiempo constante.",
        pl: "Podpis to HMAC-SHA256 wyliczany z ustalonej przedobrazu uid=<identyfikator parami>&ts=<sekundy uniksowe>, akceptowany w oknie ±300 sekund i porównywany w czasie stałym.",
        ja: "署名は固定のプリイメージ uid=<ペア uid>&ts=<Unix 秒>> に対する HMAC-SHA256 で、±300 秒の窓内で受理し、比較は定数時間実装で行います。",
        th: "ลายเซ็นคือ HMAC-SHA256 ที่คำนวณจากรูปแบบตายตัว uid=<uid เฉพาะคู่>&ts=<วินาทียูนิกซ์> โดยยอมรับในช่วงเวลา ±300 วินาที และเปรียบเทียบด้วยเวลาที่คงที่",
        fi: "Allekirjoitus on HMAC-SHA256 kiinteälle esikuvalla uid=<parittainen uid>&ts=<unix-sekuntit>, hyväksytty ±300 sekunnin ikkunassa ja vertaillu vakioajassa.",
        uk: "Підпис — це HMAC-SHA256 від фіксованого прообразу uid=<попарний uid>&ts=<унікс-секунди>, який приймається у вікні ±300 секунд і порівнюється за сталий час.",
        bg: "Подписът е HMAC-SHA256 върху фиксиран предобраз uid=<двойков uid>&ts=<юникс-секунди>, приема се в прозорец от ±300 секунди и се сравнява за константно време.",
        tr: "İmza, sabit bir öncül resim üzerinden HMAC-SHA256'dır: uid=<çift bazlı uid>&ts=<unix saniyesi>; ±300 saniyelik pencere içinde kabul edilir ve sabit sürede karşılaştırılır.",
        hu: "Az aláírás HMAC-SHA256 a rögzített előképen: uid=<páronkénti uid>&ts=<unix másodperc>; ±300 másodperces ablakban fogadjuk, és állandó idejű összehasonlítással ellenőrizzük.",
      },
    ],
  },
  {
    index: "05",
    tone: "brand",
    chip: "popopx.channel.enc.v1",
    title: {
      en: "Zero-knowledge channels and Epoch Key rotation",
      ru: "Каналы с нулевым разглашением и ротация Epoch Key",
      de: "Zero-Knowledge-Kanäle und Epoch-Key-Rotation",
      fr: "Canaux à connaissance nulle et rotation des clés d'epoch",
      it: "Canali a conoscenza zero e rotazione delle Epoch Key",
      nl: "Zero-knowledge-kanalen en Epoch Key-rotatie",
      cs: "Kanály s nulovou znalostí a rotace Epoch Key",
      "zh-Hans": "零知识频道与 Epoch Key 轮换",
      "zh-Hant": "零知識頻道與 Epoch Key 輪換",
      es: "Canales de conocimiento cero y rotación de Epoch Key",
      pl: "Kanały zero-knowledge i rotacja kluczy epoch",
      ja: "ゼロ知識チャンネルと Epoch Key のローテーション",
      th: "ช่องทางความรู้เป็นศูนย์ และการหมุนเวียน Epoch Key",
      fi: "Nollatiedon kanavat ja Epoch Key -kierto",
      uk: "Канали з нульовим розголошенням та ротація Epoch Key",
      bg: "Канали с нулево разкриване и ротация на Epoch Key",
      tr: "Sıfır bilgi kanalları ve Epoch Key dönüşümü",
      hu: "Nulla-ismeretű csatornák és Epoch Key-csere",
    },
    hook: {
      en: "A relay only ever holds ciphertext — and the message that hands over the next key is sealed under the old one.",
      ru: "Ретранслятор видит только шифротекст — и сообщение, которое передаёт следующий ключ, запечатано старым.",
      de: "Ein Relay hält stets nur Chiffretext — und die Nachricht, die den nächsten Schlüssel übergibt, ist mit dem alten versiegelt.",
      fr: "Un relai ne détient jamais que du texte chiffré — et le message qui transmet la clé suivante est scellé sous l'ancienne.",
      it: "Un relay possiede solo testo cifrato — e il messaggio che consegna la chiave successiva è sigillato con la precedente.",
      nl: "Een relay houdt altijd slechts ciphertext — en het bericht dat de volgende sleutel overdraagt is verzegeld met de oude.",
      cs: "Relé drží vždy jen šifrotext — a zpráva, která předává další klíč, je zapečetěna tím starým.",
      "zh-Hans": "中继拿到的是密文；换钥匙那条消息本身，也用旧钥匙加密。",
      "zh-Hant": "中繼拿到的是密文；換金鑰那條訊息本身，也用舊金鑰加密。",
      es: "Un relay solo tiene texto cifrado — y el mensaje que entrega la siguiente clave está sellado con la anterior.",
      pl: "Przekaźnik zawsze trzyma tylko zaszyfrowany tekst — a wiadomość przekazujący następny klucz jest zapieczętowana poprzednim.",
      ja: "リレーが握るのは暗号文だけ。次の鍵を手渡すメッセージ自体も、前の鍵で封をされています。",
      th: "รีเลย์ถือเฉพาะข้อมูลที่ถูกเข้ารหัสเท่านั้น และข้อความที่มอบคีย์ถัดไปก็จะถูกผนึกด้วยคีย์เดิม",
      fi: "Välityssolmulla on hallussaan ainoastaan salattu teksti — ja viesti, joka luovuttaa seuraavan avaimen, on sinetöity vanhan alla.",
      uk: "Ретранслятор тримає лише шифротекст — і повідомлення, що передає наступний ключ, запечетано старим.",
      bg: "Ретранслаторът винаги държи само шифротекст — и съобщението, което предава следващия ключ, е запечатано със стария.",
      tr: "Bir aktarıcı yalnızca şifreli metni elinde tutar — ve bir sonraki anahtarı devreden mesaj, eski anahtarla mühürlenmiştir.",
      hu: "Egy közvetítő mindig csak titkosított szöveget tart — és az üzenet, amely a következő kulcsot adja át, a régivel van lepecsételve.",
    },
    facts: [
      {
        en: "The envelope is popopx.channel.enc.v1: ChaCha20-Poly1305 ciphertext with the 16-byte tag appended, a 12-byte nonce, a 64-byte Ed25519 signature and a 32-byte epoch key.",
        ru: "Конверт — это popopx.channel.enc.v1: шифротекст ChaCha20-Poly1305 с дописанным 16-байтовым тегом, 12-байтовый nonce, 64-байтовая подпись Ed25519 и 32-байтовый ключ epoch.",
        de: "Der Umschlag ist popopx.channel.enc.v1: ChaCha20-Poly1305-Chiffretext mit angehängtem 16-Byte-Tag, ein 12-Byte-Nonce, eine 64-Byte-Ed25519-Signatur und ein 32-Byte-Epoch-Schlüssel.",
        fr: "L'enveloppe est popopx.channel.enc.v1 : un texte chiffré ChaCha20-Poly1305 avec le tag de 16 octets appendu, un nonce de 12 octets, une signature Ed25519 de 64 octets et une clé d'epoch de 32 octets.",
        it: "La busta è popopx.channel.enc.v1: testo cifrato ChaCha20-Poly1305 con il tag da 16 byte apposto in coda, un nonce da 12 byte, una firma Ed25519 da 64 byte e una chiave epoch da 32 byte.",
        nl: "De envelop is popopx.channel.enc.v1: ChaCha20-Poly1305-ciphertext met de achtergeplaatste 16-byte tag, een 12-byte nonce, een 64-byte Ed25519-handtekening en een 32-byte epoch-sleutel.",
        cs: "Obálka je popopx.channel.enc.v1: šifrotext ChaCha20-Poly1305 s připojenou 16bajtovou značkou, 12bajtový nonce, 64bajtový podpis Ed25519 a 32bajtový klíč epoch.",
        "zh-Hans": "信封协议 popopx.channel.enc.v1：ChaCha20-Poly1305 密文（尾部附 16 字节 tag）、12 字节 nonce、64 字节 Ed25519 签名、32 字节 epoch key。",
        "zh-Hant": "信封協定 popopx.channel.enc.v1：ChaCha20-Poly1305 密文（尾部附 16 位元組 tag）、12 位元組 nonce、64 位元組 Ed25519 簽章、32 位元組 epoch key。",
        es: "El sobre es popopx.channel.enc.v1: texto cifrado ChaCha20-Poly1305 con la etiqueta de 16 bytes añadida al final, un nonce de 12 bytes, una firma Ed25519 de 64 bytes y una clave de epoch de 32 bytes.",
        pl: "Koperta to popopx.channel.enc.v1: tekst zaszyfrowany ChaCha20-Poly1305 z dołączonym 16-bajtowym tagiem, 12-bajtowy nonce, 64-bajtowy podpis Ed25519 oraz 32-bajtowy klucz epoch.",
        ja: "エンベロープは popopx.channel.enc.v1 で、末尾に 16 バイトの tag を付けた ChaCha20-Poly1305 暗号文、12 バイトの nonce、64 バイトの Ed25519 署名、32 バイトの epoch key で構成されます。",
        th: "ซองหุ้มคือ popopx.channel.enc.v1 ประกอบด้วยข้อมูลเข้ารหัส ChaCha20-Poly1305 พร้อม tag 16 ไบต์ต่อท้าย, nonce 12 ไบต์, ลายเซ็น Ed25519 ขนาด 64 ไบต์ และคีย์ epoch ขนาด 32 ไบต์",
        fi: "Päällys on popopx.channel.enc.v1: ChaCha20-Poly1305-salateksti perään liitetyllä 16-tavun tagilla, 12-tavun nonce, 64-tavun Ed25519-allekirjoitus ja 32-tavun epoch-avain.",
        uk: "Конверт — це popopx.channel.enc.v1: шифротекст ChaCha20-Poly1305 з дописаним 16-байтовим тегом, 12-байтовий nonce, 64-байтовий підпис Ed25519 та 32-байтовий ключ epoch.",
        bg: "Обвивката е popopx.channel.enc.v1: шифротекст ChaCha20-Poly1305 с добавен 16-байтов маркер, 12-байтов nonce, 64-байтов подпис Ed25519 и 32-байтов ключ на epoch.",
        tr: "Zarf popopx.channel.enc.v1'dir: sonuna 16 baytluk tag eklenmiş ChaCha20-Poly1305 şifreli metni, 12 baytluk nonce, 64 baytluk Ed25519 imzası ve 32 baytluk epoch anahtarı.",
        hu: "A burkoló popopx.channel.enc.v1: ChaCha20-Poly1305 titkosított szöveg a végére fűzött 16 bájtos címkével, 12 bájtos nonce, 64 bájtos Ed25519-aláírás és 32 bájtos epoch-kulcs.",
      },
      {
        en: "A rotation frame is t=ku, whose update object has the keys ch / se / rp / env. se must not equal env.epoch — the client enforces that, and the gateway rejects the equal case before sending.",
        ru: "Кадр ротации — t=ku, объект update в нём несёт ключи ch / se / rp / env. se не должен совпадать с env.epoch: клиент это жёстко проверяет, и шлюз отвергает равный случай ещё до отправки.",
        de: "Ein Rotationsrahmen ist t=ku, dessen update-Objekt die Schlüssel ch / se / rp / env trägt. se darf nicht env.epoch gleich sein – der Client erzwingt das, und das Gateway lehnt den gleichen Fall schon vor dem Senden ab.",
        fr: "Une trame de rotation est t=ku, dont l'objet update porte les clés ch / se / rp / env. se ne doit pas être égal à env.epoch : le client l'impose, et la passerelle rejette le cas égal avant l'envoi.",
        it: "Un frame di rotazione è t=ku, il cui oggetto update ha le chiavi ch / se / rp / env. se non deve essere uguale a env.epoch: il client lo impone, e il gateway rifiuta il caso di uguaglianza prima di inviare.",
        nl: "Een rotatieframe is t=ku, waarvan het update-object de sleutels ch / se / rp / env draagt. se mag niet gelijk zijn aan env.epoch — de client afdwingt dat, en de gateway wijst het gelijke geval af vóór het versturen.",
        cs: "Rám rotace je t=ku a jeho objekt update nese klíče ch / se / rp / env. se se nesmí rovnat env.epoch — klient to vynucuje a brána rovný případ odmítne ještě před odesláním.",
        "zh-Hans": "轮换帧 t=ku 的 update 有四个键 ch / se / rp / env；se 必须不等于 env.epoch，这条由客户端强制，网关在送出前同样拒绝相等的情况。",
        "zh-Hant": "輪換幀 t=ku 的 update 有四個鍵 ch / se / rp / env；se 必須不等於 env.epoch，這條由客戶端強制，閘道器在送出前同樣拒絕相等的情況。",
        es: "Un cuadro de rotación es t=ku, cuyo objeto update tiene las claves ch / se / rp / env. se no debe ser igual a env.epoch: el cliente lo impone, y el gateway rechaza el caso de igualdad antes de enviar.",
        pl: "Ramka rotacji to t=ku, a jej obiekt update ma klucze ch / se / rp / env. se nie może być równy env.epoch — klient to wymusza, a brama odrzuca przypadek równości jeszcze przed wysłaniem.",
        ja: "ローテーションフレームは t=ku で、update オブジェクトは ch / se / rp / env の 4 キーを持ちます。se は env.epoch と一致してはなりません。この制約はクライアントが強制し、ゲートウェイも送信前に一致ケースを拒否します。",
        th: "เฟรมหมุนเวียนคือ t=ku ซึ่งอ็อบเจกต์ update มีคีย์ ch / se / rp / env ค่า se ต้องไม่เท่ากับ env.epoch ไคลเอนต์บังคับข้อนี้ และเกทเวย์ก็จะปฏิเสธกรณีที่ตั้งค่าเท่ากันก่อนส่ง",
        fi: "Kiertokehys on t=ku, ja sen update-oliossa ovat avaimet ch / se / rp / env. se ei saa olla sama kuin env.epoch — sovellus vaatii sen, ja yhdyskäntä hylkää tasasuuruuden jo ennen lähetystä.",
        uk: "Кадр ротації — це t=ku, об'єкт update в якому несе ключі ch / se / rp / env. se не повинен дорівнювати env.epoch: клієнт це суворо перевіряє, і шлюз відхиляє рівний випадок ще до надсилання.",
        bg: "Кадърът на ротация е t=ku, а обектът update в него носи ключовете ch / se / rp / env. se не трябва да е равен на env.epoch — клиентът налага това, а гейтуейтът отхвърля равния случай преди изпращане.",
        tr: "Bir dönüşüm çerçevesi t=ku'dur ve update nesnesi ch / se / rp / env anahtarlarını taşır. se, env.epoch değerine eşit olmamalıdır; istemci bunu zorunlu kılar ve ağ geçidi eşitlik durumunu göndermeden önce reddeder.",
        hu: "Egy rotációs keret t=ku, amelynek update objektuma a ch / se / rp / env kulcsokat hordozza. Az se nem egyezhet meg az env.epoch értékével — a kliens ezt kikényszeríti, az átjáró pedig az egyezést már küldés előtt elutasítja.",
      },
      {
        en: "Membership of a paid channel is bought with a pay_credits button on a card, which grants that epoch; a menu item is never allowed to carry a payment action.",
        ru: "Членство в платном канале покупается кнопкой pay_credits на карте, и она же выдаёт доступ к epoch; пункту меню платить разрешать нельзя.",
        de: "Die Mitgliedschaft in einem Bezahlkanal wird über einen pay_credits-Knopf auf einer Karte gekauft, der jene epoch gewährt; einem Menüpunkt ist eine Zahlungsaktion niemals erlaubt.",
        fr: "L'appartenance à un canal payant s'achète avec un bouton pay_credits sur une carte, qui accorde cet epoch ; il n'est jamais permis à un élément de menu de porter une action de paiement.",
        it: "L'appartenenza a un canale a pagamento si acquista con un pulsante pay_credits su una card, che concede quell'epoch; a una voce di menu non è mai consentito portare un'azione di pagamento.",
        nl: "Lidmaatschap van een betaald kanaal wordt gekocht met een pay_credits-knop op een kaart, welke die epoch verleent; een menu-item mag nooit een betaalactie bevatten.",
        cs: "Členství v placeném kanálu se kupuje tlačítkem pay_credits na kartě, které danou epoch uděluje; položka nabídky nikdy nesmí nést platební akci.",
        "zh-Hans": "付费频道的成员身份，靠卡片上的 pay_credits 按钮购买并授予对应的 epoch；菜单项不允许携带支付动作。",
        "zh-Hant": "付費頻道的成員身分，靠卡片上的 pay_credits 按鈕購買並授予對應的 epoch；選單項不允許攜帶支付動作。",
        es: "La pertenencia a un canal de pago se compra con un botón pay_credits en una tarjeta, que otorga ese epoch; a un elemento del menú nunca se le permite llevar una acción de pago.",
        pl: "Członkostwo w płatnym kanale kupuje się przyciskiem pay_credits na karcie, który nadaje daną epoch; pozycja menu nigdy nie może zawierać czynności płatniczej.",
        ja: "有料チャンネルのメンバー資格はカード上の pay_credits ボタンで購入し、対応する epoch が付与されます。メニュー項目に支払い動作を持たせることは一切認められていません。",
        th: "สมาชิกของช่องทางแบบจ่ายเงินซื้อได้ด้วยปุ่ม pay_credits บนการ์ด ซึ่งมอบ epoch ที่ตรงกัน ส่วนรายการในเมนูจะไม่อนุญาตให้ถือการกระทำด้านการชำระเงินโดยเด็ดขาด",
        fi: "Maksullisen kanavan jäsenyys ostetaan kortin pay_credits-painikkeella, joka myöntää kyseisen epochin; valikkokohta ei saa koskaan sisältää maksutoimintoa.",
        uk: "Членство в платному каналі купується кнопкою pay_credits на картці, яка й надає той epoch; пункту меню ніколи не дозволяється нести платіжну дію.",
        bg: "Членството в платен канал се купува с бутон pay_credits на карта, който отстъпва съответния epoch; на елемент от менюто никога не се разрешава да носи платежно действие.",
        tr: "Ücretli bir kanala üyelik, kartın üzerindeki pay_credits düğmesiyle satın alınır ve o epoch'u kazandırır; bir menü öğesinin ödeme eylemi taşımasına asla izin verilmez.",
        hu: "Egy fizetős csatorna tagságát egy kártyán lévő pay_credits gombbal vásárolják meg, amely megadja az adott epochot; egy menüpontnak soha nem szabad fizetési műveletet tartalmaznia.",
      },
    ],
  },
];

const ARCH = {
  eyebrowFeatures: {
    en: "Five technical characteristics",
    ru: "Пять технических особенностей",
    de: "Fünf technische Merkmale",
    fr: "Cinq caractéristiques techniques",
    it: "Cinque caratteristiche tecniche",
    nl: "Vijf technische kenmerken",
    cs: "Pět technických vlastností",
    "zh-Hans": "五大技术特点",
    "zh-Hant": "五大技術特點",
    es: "Cinco características técnicas",
    pl: "Pięć cech technicznych",
    ja: "5 つの技術的特徴",
    th: "จุดเด่นทางเทคนิค 5 ประการ",
    fi: "Viisi teknistä ominaisuutta",
    uk: "П'ять технічних особливостей",
    bg: "Пет технически характеристики",
    tr: "Beş teknik özellik",
    hu: "Öt technikai jellemző",
  },
  titleFeatures: {
    en: "The five technical characteristics of a service account",
    ru: "Пять технических особенностей сервиса-аккаунта",
    de: "Die fünf technischen Merkmale eines Dienstekontos",
    fr: "Les cinq caractéristiques techniques d'un compte de service",
    it: "Le cinque caratteristiche tecniche di un account di servizio",
    nl: "De vijf technische kenmerken van een serviceaccount",
    cs: "Pět technických vlastností servisního účtu",
    "zh-Hans": "服务号五大技术特点",
    "zh-Hant": "服務號五大技術特點",
    es: "Las cinco características técnicas de una cuenta de servicio",
    pl: "Pięć cech technicznych konta serwisowego",
    ja: "サービスアカウントの 5 つの技術的特徴",
    th: "จุดเด่นทางเทคนิค 5 ประการของบัญชีบริการ",
    fi: "Palvelutilin viisi teknistä ominaisuutta",
    uk: "П'ять технічних особливостей сервіс-акаунта",
    bg: "Петте технически характеристики на акаунта за услуги",
    tr: "Bir hizmet hesabının beş teknik özelliği",
    hu: "A szolgáltatási fiók öt technikai jellemzője",
  },
  subFeatures: {
    en: "Every line is checkable against the upstream repository field by field: the limits, the frame types and the signature parameter names all come out of the source, not out of marketing copy.",
    ru: "Каждую строку можно сверить с вышестоящим репозиторием поле за полем: пределы, типы кадров и имена параметров подписи взяты из исходного кода, а не из рекламного текста.",
    de: "Jede Zeile Feld für Feld im Upstream-Repository nachprüfbar: Obergrenzen, Rahmentypen und Signatur-Parameternamen stammen aus dem Quellcode, nicht aus Marketingtexten.",
    fr: "Chaque ligne se vérifie champ par champ dans le dépôt amont : les plafonds, les types de trame et les noms de paramètres de signature sortent du source, pas du texte marketing.",
    it: "Ogni riga è verificabile campo per campo nel repository upstream: limiti, tipi di frame e nomi dei parametri di firma vengono dal sorgente, non dal copy pubblicitario.",
    nl: "Elke regel is veld voor veld na te kijken in de upstream-repository: plafonds, frametypen en de namen van signatuurparameters komen uit de broncode, niet uit marketingtekst.",
    cs: "Každý řádek lze pole po poli ověřit proti upstream repozitáři: stropy, typy rámu i názvy parametrů podpisu pocházejí ze zdrojového kódu, ne z marketingového textu.",
    "zh-Hans": "每一条都能在上游仓库里逐字段核对：上限值、帧类型、签名字段名都取自源码，不是宣传口径。",
    "zh-Hant": "每一條都能在上游倉庫裡逐欄位核對：上限值、幀類型、簽章欄位名都取自原始碼，不是宣傳口徑。",
    es: "Cada línea es comprobable campo por campo en el repositorio upstream: los límites, los tipos de cuadro y los nombres de los parámetros de firma salen del código fuente, no del texto de marketing.",
    pl: "Każdą linię można sprawdzać pole po polu w górnym repozytorium: limity, typy ramek i nazwy parametrów podpisu wzięto z kodu źródłowego, a nie z tekstu reklamowego.",
    ja: "1 項目ずつ上流リポジトリと突き合わせられます。上限値もフレームタイプも署名パラメータ名も、宣伝文句ではなくソースコード由来です。",
    th: "ตรวจสอบได้ทุกบรรทัดต่อฟิลด์กับ repo ด้านต้นทาง ทั้งเพดาน ชนิดเฟรม และชื่อพารามิเตอร์ลายเซ็น ล้วนมาจากซอร์สโค้ดไม่ใช่ข้อความโฆษณา",
    fi: "Jokainen rivi on tarkistettavissa kenttä kerrallaan ylävirran repositoriosta: rajat, kehysten tyypit ja allekirjoitusparametrien nimet tulevat lähdekoodista, eivätkä markkinointitekstistä.",
    uk: "Кожен рядок можна звірити поле за полем з вищезазначеним репозиторієм: обмеження, типи кадрів та назви параметрів підпису взяті з вихідного коду, а не з маркетингового тексту.",
    bg: "Всеки ред може да се сверява поле по поле с upstream хранилището: таваните, видовете кадри и имената на параметрите на подпис идват от изходния код, а не от маркетингов текст.",
    tr: "Her satır üst akış deposunda alan alan doğrulanabilir: sınırlar, çerçeve türleri ve imza parametre adları pazarlama metninden değil, kaynak kodundan gelir.",
    hu: "Minden sor mezőről mezőre ellenőrizhető az upstream kódtárban: a korlátok, a kerettípusok és az aláírás-paraméternevek mind a forráskódből jönnek, nem a marketing-szövegből.",
  },
  eyebrowArchitecture: {
    en: "Dual-core architecture",
    ru: "Двухъядерная архитектура",
    de: "Doppelkern-Architektur",
    fr: "Architecture à double cœur",
    it: "Architettura a doppio core",
    nl: "Dual-core-architectuur",
    cs: "Dvojjádrová architektura",
    "zh-Hans": "双核架构",
    "zh-Hant": "雙核心架構",
    es: "Arquitectura de doble núcleo",
    pl: "Architektura dwurdzeniowa",
    ja: "デュアルコア構成",
    th: "สถาปัตยกรรมสองแกน",
    fi: "Kaksen ytimen arkkitehtuuri",
    uk: "Доядерна архітектура",
    bg: "Двойна ядрена архитектура",
    tr: "Çift çekirdekli mimari",
    hu: "Dual-core architektúra",
  },
  titleArchitecture: {
    en: "Dual-core architecture, compared with the rest of the field",
    ru: "Двухъядерная архитектура в сравнении с остальными решениями на рынке",
    de: "Doppelkern-Architektur, verglichen mit dem übrigen Feld",
    fr: "Architecture à double cœur, comparée au reste du marché",
    it: "Architettura a doppio core, confrontata con il resto del mercato",
    nl: "Dual-core-architectuur, vergeleken met de rest van het veld",
    cs: "Dvojjádrová architektura v porovnání se zbytkem oboru",
    "zh-Hans": "双核架构 + 三方生态对比",
    "zh-Hant": "雙核心架構 + 三方生態對比",
    es: "Arquitectura de doble núcleo, comparada con el resto del sector",
    pl: "Architektura dwurdzeniowa na tle pozostałych rozwiązań",
    ja: "デュアルコア構成と、他方式との三方比較",
    th: "สถาปัตยกรรมสองแกน เทียบกับแนวทางอื่นในตลาด",
    fi: "Kaksen ytimen arkkitehtuuri verrattuna muuhun tarjontaan",
    uk: "Доядерна архітектура у порівнянні з іншими рішеннями на ринку",
    bg: "Двойна ядрена архитектура, сравнена с останалите решения",
    tr: "Çift çekirdekli mimari, sahadaki diğer çözümlerle karşılaştırma",
    hu: "Dual-core architektúra összehasonlítva a mező többi szereplőjével",
  },
  subArchitecture: {
    en: "Client, gateway and node each hold one boundary: messages travel through the node, H5 verification through the gateway.",
    ru: "Клиент, шлюз и узел охраняют каждый свою границу: сообщения идут через узел, а проверка H5 — через шлюз.",
    de: "Client, Gateway und Node halten je eine Grenze: Nachrichten laufen über den Node, die H5-Prüfung über das Gateway.",
    fr: "Client, passerelle et nœud tiennent chacun une frontière : les messages passent par le nœud, la vérification H5 par la passerelle.",
    it: "Client, gateway e nodo presiedono un confine: i messaggi passano dal nodo, la verifica H5 dal gateway.",
    nl: "Client, gateway en node houden elk één grens: berichten lopen via de node, H5-verificatie via de gateway.",
    cs: "Klient, brána a uzel drží každá jednu hranici: zprávy procházejí uzlem, ověření H5 bránou.",
    "zh-Hans": "客户端、网关、节点各守一段边界：消息经节点，H5 验证经网关。",
    "zh-Hant": "客戶端、閘道器、節點各守一段邊界：訊息經節點，H5 驗證經閘道器。",
    es: "Cliente, gateway y nodo sostienen cada uno una frontera: los mensajes viajan por el nodo, la verificación H5 por el gateway.",
    pl: "Klient, brama i węzeł pilnują każdy jednej granicy: wiadomości idą przez węzeł, weryfikacja H5 przez bramę.",
    ja: "クライアント・ゲートウェイ・ノードがそれぞれ 1 つの境界を受け持ち、メッセージはノードを経由し、H5 検証はゲートウェイを経由します。",
    th: "ไคลเอนต์ เกทเวย์ และโหนดต่างคุมขอบเขตของตัวเอง ข้อความเดินทางผ่านโหนด ส่วนการตรวจสอบ H5 ผ่านเกทเวย์",
    fi: "Client, yhdyskäntä ja solmu pitävät kutakin oma rajansa: viestit kulkevat solmun kautta, H5-tarkistus yhdyskänteen kautta.",
    uk: "Клієнт, шлюз і вузол тримають кожен свій кордон: повідомлення йдуть через вузол, перевірка H5 — через шлюз.",
    bg: "Клиентът, гейтуейтът и възелът пазят всеки своята граница: съобщенията минават през възела, а H5 проверката — през гейтуейта.",
    tr: "İstemci, ağ geçidi ve düğüm her biri bir sınırı tutar: mesajlar düğüm üzerinden, H5 doğrulaması ağ geçidi üzerinden gider.",
    hu: "A kliens, az átjáró és a csomópont egy-egy határt őriz: az üzenetek a csomóponton, az H5-ellenőrzés az átjárón megy át.",
  },
  clientRole: {
    en: "iOS client",
    ru: "Клиент iOS",
    de: "iOS-Client",
    fr: "Client iOS",
    it: "Client iOS",
    nl: "iOS-client",
    cs: "Klient iOS",
    "zh-Hans": "iOS 客户端",
    "zh-Hant": "iOS 客戶端",
    es: "Cliente iOS",
    pl: "Klient iOS",
    ja: "iOS クライアント",
    th: "ไคลเอนต์ iOS",
    fi: "iOS-sovellus",
    uk: "Клієнт iOS",
    bg: "iOS клиент",
    tr: "iOS istemcisi",
    hu: "iOS kliens",
  },
  clientFacts: {
    en: "The protocol lines up byte for byte with the gateway; card, menu and channel parsing all happen on the device.",
    ru: "Протокол совпадает с шлюзом побайтово; разбор карт, меню и каналов происходит на устройстве.",
    de: "Das Protokoll stimmt byteweise mit dem Gateway überein; das Parsen von Karten, Menü und Kanälen geschieht vollständig auf dem Gerät.",
    fr: "Le protocole s'aligne octet par octet sur la passerelle ; l'analyse des cartes, du menu et des canaux se fait sur l'appareil.",
    it: "Il protocollo è allineato byte per byte con il gateway; l'analisi di card, menu e canali avviene tutta sul dispositivo.",
    nl: "Het protocol sluit byte voor byte op de gateway aan; het parsen van kaarten, menu en kanalen gebeurt allemaal op het apparaat.",
    cs: "Protokol sedí bajt po bajtu s bránou; parsování karet, nabídky i kanálů probíhá celé na zařízení.",
    "zh-Hans": "协议与网关逐字节对齐；卡片、菜单、频道的解析都在设备侧。",
    "zh-Hant": "協定與閘道器逐位元組對齊；卡片、選單、頻道的解析都在裝置端。",
    es: "El protocolo coincide byte a byte con el gateway; el análisis de tarjetas, menú y canales ocurre íntegramente en el dispositivo.",
    pl: "Protokol zgadza się bajt w bajt z bramą; parsowanie kart, menu i kanałów zachodzi w całości na urządzeniu.",
    ja: "プロトコルはゲートウェイと 1 バイト単位で一致し、カード・メニュー・チャンネルの解析はすべて端末側で行われます。",
    th: "โพรโทคอลตรงกับเกทเวย์ทีละไบต์ ส่วนการวิเคราะห์การ์ด เมนู และช่องทางเกิดบนอุปกรณ์ทั้งหมด",
    fi: "Protokolla on yhdyskänteen kanssa byte bytea tarkoin; korttien, valikon ja kanavien jäsennys tapahtuu laitteella.",
    uk: "Протокол збігається з шлюзом побайтово; розбір карток, меню та каналів відбувається на пристрої.",
    bg: "Протоколът съвпада байт по байт с гейтуейтът; анализирането на карти, меню и канали се извършва на устройството.",
    tr: "Protokol ağ geçidiyle bayt bayt hizalanır; kart, menü ve kanal ayrıştırması tamamen cihazda yapılır.",
    hu: "A protokoll bájtról bájtrára egyezik az átjáróval; a kártyák, a menü és a csatornák feldolgozása is az eszközön történik.",
  },

  gatewayTitle: {
    en: "Gateway · FastAPI :8080",
    ru: "Шлюз · FastAPI :8080",
    de: "Gateway · FastAPI auf Port 8080",
    fr: "Passerelle · FastAPI :8080",
    it: "Gateway · FastAPI su porta 8080",
    nl: "Gateway · FastAPI op poort 8080",
    cs: "Brána · FastAPI :8080",
    "zh-Hans": "网关 · FastAPI :8080",
    "zh-Hant": "閘道器 · FastAPI :8080",
    es: "Gateway · FastAPI en el puerto 8080",
    pl: "Brama · FastAPI :8080",
    ja: "ゲートウェイ · FastAPI :8080",
    th: "เกทเวย์ · FastAPI :8080",
    fi: "Yhdyskäntä · FastAPI :8080",
    uk: "Шлюз · FastAPI :8080",
    bg: "Гейтуейт · FastAPI :8080",
    tr: "Ağ geçidi · FastAPI :8080",
    hu: "Átjáró · FastAPI :8080",
  },
  gatewayFacts: {
    en: "The nine plugin modules and the single-file SQLite database all sit on the gateway side.",
    ru: "Девять модулей плагинов и однофайловая база SQLite расположены на стороне шлюза.",
    de: "Die neun Plugin-Module und die SQLite-Datenbank als einzelne Datei sitzen allesamt auf der Gateway-Seite.",
    fr: "Les neuf modules de greffons et la base SQLite à fichier unique se trouvent tous du côté de la passerelle.",
    it: "I nove moduli plugin e il database SQLite a file singolo stanno tutti dal lato del gateway.",
    nl: "De negen plug-inmodules en de SQLite-database als één bestand zitten allemaal aan de gateway-kant.",
    cs: "Devět modulů pluginů a jednosouborová databáze SQLite sedí celé na straně brány.",
    "zh-Hans": "九个插件模块与 SQLite 单文件都挂在网关这一侧。",
    "zh-Hant": "九個外掛模組與 SQLite 單檔案都掛在閘道器這一側。",
    es: "Los nueve módulos de complemento y la base de datos SQLite de un solo archivo están todos del lado del gateway.",
    pl: "Dziewięć modułów wtyczek i jednoplikowa baza danych SQLite leżą w całości po stronie bramy.",
    ja: "9 つのプラグインモジュールと SQLite の単一ファイルは、いずれもゲートウェイ側に置かれます。",
    th: "โมดูลปลั๊กอินทั้งเก้าและฐานข้อมูล SQLite ไฟล์เดียวล้วนอยู่ฝั่งเกทเวย์",
    fi: "Yhdeksän laajennusmoduulia ja SQLite-tietokanta yhteen tiedostoon ovat kaikki yhdyskäytävän puolella.",
    uk: "Дев'ять модулів плагінів та однофайлова база SQLite містяться на боці шлюзу.",
    bg: "Деветте модула плъгини и базата SQLite с един файл са изцяло от страната на гейтуейта.",
    tr: "Dokuz eklenti modülü ve tek dosyalık SQLite veritabanının tümü ağ geçidi tarafında durur.",
    hu: "A kilenc bővítménymodul és az egyetlen fájlból álló SQLite-adatbázis mind az átjáró oldalán található.",
  },
  gatewayPluginLayer: {
    en: "Plugin layer",
    ru: "Слой плагинов",
    de: "Plugin-Ebene",
    fr: "Couche des greffons",
    it: "Livello dei plugin",
    nl: "Plug-inlaag",
    cs: "Vrstva pluginů",
    "zh-Hans": "插件层",
    "zh-Hant": "外掛層",
    es: "Capa de complementos",
    pl: "Warstwa wtyczek",
    ja: "プラグイン層",
    th: "ชั้นปลั๊กอิน",
    fi: "Laajennoskerros",
    uk: "Шар плагінів",
    bg: "Слой с плъгини",
    tr: "Eklenti katmanı",
    hu: "Bővítményréteg",
  },
  gatewayPluginList: {
    en: "Four on by default: AI agent · alert ops · privacy SSO · polls; five off: Web3 events · workflow webhooks · CardDAV · CalDAV · Slack/Discord.",
    ru: "Четыре включены по умолчанию: AI-агент · алерт-операции · приватный SSO · опросы; пять выключены: события Web3 · workflow-вебхуки · CardDAV · CalDAV · Slack/Discord.",
    de: "Vier standardmäßig an: KI-Agent · Alarmbetrieb · Privacy-SSO · Umfragen; fünf aus: Web3-Ereignisse · Workflow-Webhooks · CardDAV · CalDAV · Slack/Discord.",
    fr: "Quatre actifs par défaut : agent IA · exploitation d’alertes · SSO respectueux de la vie privée · sondages ; cinq désactivés : événements Web3 · webhooks de workflow · CardDAV · CalDAV · Slack/Discord.",
    it: "Quattro attivi per impostazione predefinita: agente IA · gestione avvisi · SSO privato · sondaggi; cinque disattivati: eventi Web3 · webhook di workflow · CardDAV · CalDAV · Slack/Discord.",
    nl: "Vier standaard aan: AI-agent · alarmoperaties · privacy-SSO · peilingen; vijf uit: Web3-events · workflowwebhooks · CardDAV · CalDAV · Slack/Discord.",
    cs: "Čtyři ve výchozím stavu zapnuté: AI agent · provoz alertů · soukromé SSO · ankety; pět vypnutých: události Web3 · webhooky workflow · CardDAV · CalDAV · Slack/Discord.",
    "zh-Hans": "默认开启四个：AI 客服 · 告警运维 · 隐私登录 · 投票；默认关闭五个：Web3 事件 · 工作流 Webhook · CardDAV · CalDAV · Slack/Discord。",
    "zh-Hant": "預設開啟四個：AI 客服 · 告警維運 · 隱私登入 · 投票；預設關閉五個：Web3 事件 · 工作流程 Webhook · CardDAV · CalDAV · Slack/Discord。",
    es: "Cuatro activados por defecto: agente de IA · operación de alertas · SSO privado · encuestas; cinco desactivados: eventos Web3 · webhooks de workflow · CardDAV · CalDAV · Slack/Discord.",
    pl: "Cztery włączone domyślnie: agent AI · obsługa alertów · prywatne SSO · ankiety; pięć wyłączonych: zdarzenia Web3 · webhooki workflow · CardDAV · CalDAV · Slack/Discord.",
    ja: "既定で有効が 4 つ：AI 応対 · アラート運用 · プライバシー SSO · 投票。無効が 5 つ：Web3 イベント · ワークフロー Webhook · CardDAV · CalDAV · Slack/Discord。",
    th: "เปิดเป็นค่าเริ่มต้นสี่ตัว: เอเจนต์ AI · การเดินเรื่องแจ้งเตือน · SSO รักษาความเป็นส่วนตัว · แบบสำรวจ; ปิดห้าตัว: อีเวนต์ Web3 · เว็บฮุกของ workflow · CardDAV · CalDAV · Slack/Discord",
    fi: "Oletuksena päällä neljä: TE-agentti · hälytysten ylläpito · yksityisyyttä kunnioittava SSO · kyselyt; pois viisi: Web3-tapahtumat · workflow-webhookit · CardDAV · CalDAV · Slack/Discord.",
    uk: "Чотири увімкнено типово: AI-агент · обробка сповіщень · приватний SSO · опитування; п’ять вимкнено: події Web3 · workflow-вебхуки · CardDAV · CalDAV · Slack/Discord.",
    bg: "Четири включени по подразбиране: AI агент · операции с известия · поверително SSO · допитвания; пет изключени: Web3 събития · workflow уебхукове · CardDAV · CalDAV · Slack/Discord.",
    tr: "Varsayılan olarak dördü açık: yapay zekâ ajanı · uyarı operasyonları · gizlilik dostu SSO · anketler; beşi kapalı: Web3 olayları · workflow webhook’ları · CardDAV · CalDAV · Slack/Discord.",
    hu: "Alapértelmezés szerint négy bekapcsolva: MI-ügynök · riasztásüzemeltetés · magánéletkímélő SSO · szavazások; öt kikapcsolva: Web3-események · workflow-webhookok · CardDAV · CalDAV · Slack/Discord.",
  },
  gatewayStore: {
    en: "SQLite single file",
    ru: "Один файл SQLite",
    de: "SQLite als Einzeldatei",
    fr: "Fichier SQLite unique",
    it: "File singolo SQLite",
    nl: "SQLite als één bestand",
    cs: "Jeden soubor SQLite",
    "zh-Hans": "SQLite 单文件",
    "zh-Hant": "SQLite 單檔案",
    es: "Archivo único de SQLite",
    pl: "Pojedynczy plik SQLite",
    ja: "SQLite 単一ファイル",
    th: "ไฟล์ SQLite ไฟล์เดียว",
    fi: "Yksi SQLite-tiedosto",
    uk: "Один файл SQLite",
    bg: "Един файл на SQLite",
    tr: "SQLite tek dosyası",
    hu: "SQLite egyetlen fájl",
  },
  gatewayStoreList: {
    en: "Ledger and credit balance · pairwise session secrets · channel identity private keys and every epoch key",
    ru: "Реестр и остаток кредитов · попарные секреты сессий · приватные ключи идентификации канала и каждый ключ epoch",
    de: "Konto und Guthaben · paarweise Sitzungsgeheimnisse · private Identitätsschlüssel der Kanäle und jeder Epoch-Schlüssel",
    fr: "Registre et solde de crédits · secrets de session par paire · clés privées d'identité des canaux et chaque clé d'epoch",
    it: "Registro e saldo dei crediti · segreti di sessione a coppie · chiavi private di identità del canale e ogni chiave epoch",
    nl: "Aangetekening en tegoedsaldo · paarsgewijze sessiegeheimen · privé-identiteitssleutels van kanalen en elke epoch-sleutel",
    cs: "Účet a zůstatek kreditů · párová tajemství relací · soukromé klíče identity kanálu a každý klíč epoch",
    "zh-Hans": "账本与算力余额 · 成对会话密钥 · 频道身份私钥与每个 epoch key",
    "zh-Hant": "帳本與算力餘額 · 成對工作階段密鑰 · 頻道身分私密金鑰與每個 epoch key",
    es: "Registro y saldo de créditos · secretos de sesión por par · claves privadas de identidad del canal y cada clave de epoch",
    pl: "Rejestr i saldo kredytów · parami secrety sesji · prywatne klucze tożsamości kanału i każdy klucz epoch",
    ja: "元帳とクレジット残高 · ペア単位のセッション鍵 · チャンネルのアイデンティティ秘密鍵とすべての epoch key",
    th: "บัญชีรายชื่อและยอดเครดิต · ความลับเซสชันเฉพาะคู่ · คีย์ส่วนตัวระบุตัวตนของช่องทางและคีย์ epoch ทุกอัน",
    fi: "Tilikirja ja luottosaldo · parittaiset istunnon salaisuudet · kanavan henkilöllisyyden yksityiset avaimet ja jokainen epoch-avain",
    uk: "Реєстр і залишок кредитів · попарні секрети сесій · приватні ключі ідентичності каналу та кожен ключ epoch",
    bg: "Главна книга и салдо на кредити · двойкови тайни на сесиите · частните ключове за самоличността на канала и всеки ключ на epoch",
    tr: "Defter ve kredi bakiyesi · çift bazlı oturum sırları · kanalın kimlik özel anahtarları ve her bir epoch anahtarı",
    hu: "Főkönyv és kredit-egyenleg · páronkénti munkamenet-titkok · a csatorna-azonosság privát kulcsai és minden egyes epoch-kulcs",
  },
  nodeTitle: {
    en: "Open-source node",
    ru: "Узел с открытым кодом",
    de: "Open-Source-Node",
    fr: "Nœud open source",
    it: "Nodo open source",
    nl: "Open-source-node",
    cs: "Open-source uzel",
    "zh-Hans": "开源节点",
    "zh-Hant": "開放原始碼節點",
    es: "Nodo de código abierto",
    pl: "Węzeł open source",
    ja: "オープンソースノード",
    th: "โหนดโอเพนซอร์ส",
    fi: "Open source -solmu",
    uk: "Вузол open source",
    bg: "Възел с отворен код",
    tr: "Açık kaynaklı düğüm",
    hu: "Nyílt forráskódú csomópont",
  },
  nodeRole: {
    en: "WebSocket API · loopback only",
    ru: "WebSocket API · только loopback",
    de: "WebSocket-API · nur loopback",
    fr: "API WebSocket · boucle locale uniquement",
    it: "API WebSocket · solo loopback",
    nl: "WebSocket-API · alleen loopback",
    cs: "WebSocket API · pouze loopback",
    "zh-Hans": "WebSocket API · 仅回环",
    "zh-Hant": "WebSocket API · 僅迴圈",
    es: "API WebSocket · solo loopback",
    pl: "API WebSocket · tylko loopback",
    ja: "WebSocket API · ループバックのみ",
    th: "WebSocket API · เฉพาะ loopback",
    fi: "WebSocket-sovellusliittymä · vain loopback",
    uk: "WebSocket API · лише loopback",
    bg: "WebSocket API · само loopback",
    tr: "WebSocket API · yalnızca loopback",
    hu: "WebSocket API · csak loopback",
  },
  nodeFacts: {
    en: "The node's WebSocket API binds to 127.0.0.1; pointing it at a hostname simply will not work.",
    ru: "WebSocket API узла привязан к 127.0.0.1; указать ему доменное имя — не получится.",
    de: "Die WebSocket-API des Nodes bindet an 127.0.0.1; sie auf einen Hostnamen zu richten, funktioniert schlicht nicht.",
    fr: "L'API WebSocket du nœud se lie à 127.0.0.1 ; le diriger vers un nom d'hôte ne fonctionne tout simplement pas.",
    it: "L'API WebSocket del nodo si associa a 127.0.0.1; puntarla a un nome host semplicemente non funziona.",
    nl: "De WebSocket-API van de node bindt op 127.0.0.1; er een hostnaam aan wijzen werkt simpelweg niet.",
    cs: "WebSocket API uzlu se navazuje na 127.0.0.1; namířit ho na hostname prostě nefunguje.",
    "zh-Hans": "节点的 WebSocket API 绑在 127.0.0.1 上，配置里指向主机名是起不来的。",
    "zh-Hant": "節點的 WebSocket API 綁在 127.0.0.1 上，設定檔裡指向主機名稱是起不來的。",
    es: "La API WebSocket del nodo se vincula a 127.0.0.1; apuntarla a un nombre de host simplemente no funciona.",
    pl: "API WebSocket węzła wiąże się z 127.0.0.1; wskazywanie go na nazwę hosta po prostu nie zadziała.",
    ja: "ノードの WebSocket API は 127.0.0.1 にバインドされるため、ホスト名を指定しても起動しません。",
    th: "WebSocket API ของโหนดผูกไว้กับ 127.0.0.1 การจะตั้งค่าให้ชี้ไปที่ชื่อโฮสต์นั้นทำไม่ได้เลย",
    fi: "Solmun WebSocket-API sitoutuu 127.0.0.1; sen osoittaminen isäntänimeen ei yksinkertaisesti toimi.",
    uk: "WebSocket API вузла прив'язується до 127.0.0.1; вказати йому назву хоста просто не вдасться.",
    bg: "WebSocket API на възела се обвързва с 127.0.0.1; насочването му към име на хост изобщо не работи.",
    tr: "Düğümün WebSocket API'si 127.0.0.1'e bağlanır; onu bir ana makine adına yönlendirmek çalışmaz.",
    hu: "A csomópont WebSocket API-ja a 127.0.0.1-hez kötődik; hosztnévre mutatni egyszerűen nem működik.",
  },
  linkClientGateway: {
    en: "H5 signature check · HTTPS",
    ru: "Проверка подписи H5 · HTTPS",
    de: "H5-Signaturprüfung · HTTPS",
    fr: "Contrôle de signature H5 · HTTPS",
    it: "Controllo firma H5 · HTTPS",
    nl: "H5-handtekeningcontrole · HTTPS",
    cs: "Kontrola podpisu H5 · HTTPS",
    "zh-Hans": "H5 签名验证 · HTTPS",
    "zh-Hant": "H5 簽章驗證 · HTTPS",
    es: "Verificación de firma H5 · HTTPS",
    pl: "Sprawdzanie podpisu H5 · HTTPS",
    ja: "H5 署名検証 · HTTPS",
    th: "ตรวจสอบลายเซ็น H5 · HTTPS",
    fi: "H5-allekirjoituksen tarkistus · HTTPS",
    uk: "Перевірка підпису H5 · HTTPS",
    bg: "Проверка на H5 подпис · HTTPS",
    tr: "H5 imza doğrulama · HTTPS",
    hu: "H5-aláírás-ellenőrzés · HTTPS",
  },
  linkGatewayNode: {
    en: "Loopback WebSocket · sole outbound path",
    ru: "Loopback WebSocket · единственный исходящий путь",
    de: "Loopback-WebSocket · einziger ausgehender Weg",
    fr: "WebSocket en boucle locale · unique chemin sortant",
    it: "WebSocket su loopback · unico percorso in uscita",
    nl: "Loopback-WebSocket · enige uitgaande weg",
    cs: "Loopback WebSocket · jediná odcházící cesta",
    "zh-Hans": "回环 WebSocket · 唯一出口",
    "zh-Hant": "迴圈 WebSocket · 唯一出口",
    es: "WebSocket de loopback · única ruta de salida",
    pl: "WebSocket loopback · jedyna droga wychodząca",
    ja: "ループバック WebSocket · 唯一の出口",
    th: "WebSocket แบบ loopback · ทางออกเดียว",
    fi: "Loopback-WebSocket · ainoa ulostuleva reitti",
    uk: "Loopback WebSocket · єдиний вихідний шлях",
    bg: "Loopback WebSocket · единствен изходен път",
    tr: "Loopback WebSocket · tek giden yol",
    hu: "Loopback WebSocket · egyedüli kimenő útvonal",
  },

  diagramCaption: {
    en: "The upstream README puts it verbatim: the open-source node is only ever connected to over ws://127.0.0.1:5225, and this suite links against, patches and redistributes none of its code. The documented cross-machine option is an authenticated TLS front ending in wss:// — never the node listening on a public interface.",
    ru: "В вышестоящем README это сказано дословно: к узлу с открытым кодом подключаются только через ws://127.0.0.1:5225, а данный набор не линкует, не правит и не распространяет ни строки его кода. Задокументированный вариант развертывания на другой машине — это аутентифицированный TLS-фронт, завершающийся на wss://, но никак не публичный интерфейс узла.",
    de: "Im Upstream-README steht es wörtlich: Der Open-Source-Node wird ausschließlich über ws://127.0.0.1:5225 verbunden, und diese Suite linkt, patcht und weitergibt keinen einzigen Zeile seines Codes. Die dokumentierte Option für Maschinen über Grenzen hinweg ist ein authentifiziertes TLS-Frontend mit wss:// – niemals ein Node, der auf einer öffentlichen Schnittstelle lauscht.",
    fr: "Le README amont le dit mot pour mot : le nœud open source n'est jamais connecté que via ws://127.0.0.1:5225, et cette suite ne link, ne patche et ne redistribue aucune ligne de son code. L'option documentée pour un déploiement sur plusieurs machines est un front TLS authentifié aboutissant en wss:// — jamais le nœud écoutant une interface publique.",
    it: "Il README upstream lo dice alla lettera: il nodo open source viene connesso soltanto tramite ws://127.0.0.1:5225, e questa suite non linka, non modifica e non ridistribuisce nemmeno una riga del suo codice. L'opzione documentata per l'uso su macchine separate è un front TLS autenticato che sfocia in wss:// — mai il nodo in ascolto su un'interfaccia pubblica.",
    nl: "Het upstream-README zegt het letterlijk: de open-source-node wordt uitsluitend via ws://127.0.0.1:5225 verbonden, en deze suite linkt, patcht en herverdeelt geen enkele regel van zijn code. De gedocumenteerde optie voor inzet over machines heen is een geauthenticeerd TLS-front dat in wss:// eindigt — nooit de node die op een publieke interface luistert.",
    cs: "Upstream README to říká doslova: open-source uzel se připojuje pouze přes ws://127.0.0.1:5225 a tato sada nenalinkuje, neupraví ani dál nedistribuuje ani řádku jeho kódu. Dokumentovaná varianta pro nasazení napříč stroji je autentizovaný TLS front končící wss:// — nikdy ne uzel poslouchající na veřejném rozhraní.",
    "zh-Hans": "上游 README 的原话是：「开源节点只通过 ws://127.0.0.1:5225 连接，本套件不链接、不修改、也不重新分发它的任何代码。」要跨机器部署，做法是在中间加一层带鉴权的 TLS 前置并改用 wss://，而不是让节点去监听公网。",
    "zh-Hant": "上游 README 的原話是：「開放原始碼節點只透過 ws://127.0.0.1:5225 連線，本套件不連結、不修改、也不重新分發它的任何程式碼。」要跨機器部署，做法是在中間加一層帶驗證的 TLS 前置並改用 wss://，而不是讓節點去監聽公網。",
    es: "El README upstream lo dice al pie de la letra: al nodo de código abierto solo se conecta mediante ws://127.0.0.1:5225, y este conjunto no enlaza, parchea ni redistribuye ni una línea de su código. La opción documentada para desplegar entre máquinas es un front TLS autenticado que termina en wss:// — nunca que el nodo escuche en una interfaz pública.",
    pl: "Repozytorium nadrzędne mówi to dosłownie: z węzłem open source łączy się wyłącznie przez ws://127.0.0.1:5225, a ten zestaw nie linkuje, nie łata i nie redystrybuuje ani linii jego kodu. Udokumentowana opcja wdrożenia na wielu maszynach to uwierzytelniony front TLS kończący się na wss:// — nigdy węzeł nasłuchujący na publicznym interfejsie.",
    ja: "上流の README にはこう書かれています。オープンソースノードは ws://127.0.0.1:5225 でのみ接続され、本スイートはそのコードをリンクも改変も再配布もしません。マシンをまたぐ展開として文書化されているのは、認証付き TLS の前段を置いて wss:// に切り替える方法であり、ノードに公網で待ち受けさせる方法ではありません。",
    th: "README ต้นทางเขียนไว้ตรงตัวว่า โหนดโอเพนซอร์สจะถูกเชื่อมต่อผ่าน ws://127.0.0.1:5225 เท่านั้น และชุดนี้ไม่มีการลิงก์ แก้ไข หรือแจกจ่ายซอร์สโค้ดของมันแม้แต่บรรทัดเดียว ทางเลือกที่ระบุไว้ในเอกสารสำหรับใช้งานข้ามเครื่อง คือวางชั้น TLS ที่ต้องพิสูจน์ตัวตนไว้ข้างหน้าแล้วเปลี่ยนเป็น wss:// ไม่ใช่ให้โหนดไปฟังที่อินเทอร์เฟซสาธารณะ",
    fi: "Ylävirre-README sanoo tämän sanoin: open source -solmuun yhdistetään ainoastaan osoitteella ws://127.0.0.1:5225, eikä tämä paketti linkitä, muokkaa eikä edelleenjakä sen koodista yhtäkään riviä. Dokumentoitu vaihtoehto koneiden yli on todennettu TLS-etupää, joka päättyy wss:// — ei koskaan se, että solmu kuuntelisi julkista rajapintaa.",
    uk: "У вищезазначеному README це сказано дослівно: вузол open source підключають лише через ws://127.0.0.1:5225, а цей набір не лінкує, не латає і не поширює жодного рядка його коду. Задокументований варіант розгортання між машинами — це автентифікований TLS-фронт, що завершується на wss://, а не вузол, який слухає публічний інтерфейс.",
    bg: "Горният README го казва буквално: възелът с отворен код се свързва единствено през ws://127.0.0.1:5225, а този комплект не линква, не пачва и не разпространява нито ред от кода му. Документираната опция за внедряване между машини е удостоен TLS фронтенд, завършващ на wss:// — никога възел, който слуша на публичен интерфейс.",
    tr: "Üst README bunu aynen şöyle söylüyor: açık kaynaklı düğüme yalnızca ws://127.0.0.1:5225 üzerinden bağlanılır ve bu takım onun kodundan tek bir satırı ne bağlar ne yamalar ne de yeniden dağıtır. Makineler arası kurulum için belgelenmiş seçenek, wss:// ile biten kimlik doğrulamalı bir TLS ön katmanıdır — düğümün genel bir arayüzde dinlemesi asla değil.",
    hu: "A felirati README ezt szó szerint így mondja: a nyílt forráskódú csomóponthoz kizárólag a ws://127.0.0.1:5225 címén kapcsolódnak, és ez a csomag a kódjából egy sort sem linkel, javít, terjeszt tovább. A dokumentált gépközi telepítési lehetőség egy hitelesített TLS előtag, amely wss:// címen végződik — sosem az, hogy a csomópont nyilvános felületen figyeljen.",
  },
  pathLegend: {
    en: "Three paths",
    ru: "Три пути",
    de: "Drei Pfade",
    fr: "Trois chemins",
    it: "Tre percorsi",
    nl: "Drie paden",
    cs: "Tři cesty",
    "zh-Hans": "三条路径",
    "zh-Hant": "三條路徑",
    es: "Tres rutas",
    pl: "Trzy ścieżki",
    ja: "3 経路",
    th: "สามเส้นทาง",
    fi: "Kolme reittiä",
    uk: "Три шляхи",
    bg: "Три пътеки",
    tr: "Üç yol",
    hu: "Három útvonal",
  },

  tableCaption: {
    en: "The other two columns describe the general architecture of a product category, never a specific named product; every POPOPX cell below is one of the five source-backed facts above.",
    ru: "Две другие колонки описывают общую архитектуру категории продуктов, а не какой-то конкретный названный продукт; каждая ячейка POPOPX ниже — один из пяти фактов, подтверждённых исходным кодом выше.",
    de: "Die anderen zwei Spalten beschreiben die allgemeine Architektur einer Produktkategorie, niemals ein konkret benanntes Produkt; jede POPOPX-Zelle unten ist eine der fünf Quellcode-gestützten Fakten oben.",
    fr: "Les deux autres colonnes décrivent l'architecture générale d'une catégorie de produits, jamais un produit nommément désigné ; chaque cellule POPOPX ci-dessous est l'un des cinq faits sourcés ci-dessus.",
    it: "Le altre due colonne descrivono l'architettura generale di una categoria di prodotti, mai un prodotto specifico e nominato; ogni cella POPOPX qui sotto è uno dei cinque fatti supportati dal sorgente qui sopra.",
    nl: "De andere twee kolommen beschrijven de algemene architectuur van een productcategorie, nooit een specifiek genoemd product; elke POPOPX-cel hieronder is een van de vijf door de broncode onderbouwde feiten hierboven.",
    cs: "Ty další dva sloupce popisují obecnou architekturu kategorie produktů, nikdy nikoli konkrétní pojmenovaný produkt; každá buňka POPOPX níže je jeden z pěti zdrojem podložených faktů výše.",
    "zh-Hans": "对照的是两类产品的通用架构，不是任何一款具体商品；POPOPX 那一列的每一格，都是上面五条里的源码事实。",
    "zh-Hant": "對照的是兩類產品的通用架構，不是任何一款具體產品；POPOPX 那一欄的每一格，都是上面五條裡的原始碼事實。",
    es: "Las otras dos columnas describen la arquitectura general de una categoría de producto, nunca un producto concreto y nombrado; cada celda de POPOPX más abajo es uno de los cinco hechos respaldados por el código fuente de arriba.",
    pl: "Pozostałe dwie kolumny opisują ogólną architekturę kategorii produktów, a nie jakiś konkretny nazwany produkt; każda komórka POPOPX poniżej jest jednym z pięciu faktów potwierdzonych kodem źródłowym powyżej.",
    ja: "残り 2 列は製品カテゴリー一般的なアーキテクチャを示すもので、特定の商品名を挙げたものではありません。POPOPX 列の各マスは、上に挙げた 5 つのソース由来事実のいずれかです。",
    th: "อีกสองคอลัมน์อธิบายสถาปัตยกรรมทั่วไปของผลิตภัณฑ์ในหมวดนั้น ไม่ใช่ผลิตภัณฑ์เฉพาะยี่ห้อใด ส่วนตารางของ POPOPX ทุกช่องด้านล่างคือข้อเท็จจริงจากซอร์สโค้ดในห้าข้อด้านบน",
    fi: "Ne kaksi muuta saraketta kuvaavat tuoteryhmän yleistä arkkitehtuuria, eivät koskaan nimettyä yksittäistä tuotetta; jokainen POPOPX-ruutu alla on yksi viidestä lähdekoodilla vahvistetusta seikasta yllä.",
    uk: "Дві інші колонки описують загальну архітектуру категорії продуктів, а не якийсь конкретний названий продукт; кожна комірка POPOPX нижче — це один із п'яти фактів, підтверджених вихідним кодом вище.",
    bg: "Двете други колони описват общата архитектура на продуктова категория, а не конкретен назован продукт; всяка POPOPX клетка по-долу е един от петте факта, подкрепени от изходния код по-горе.",
    tr: "Diğer iki sütun bir ürün kategorisinin genel mimarisini anlatır, asla adıyla anılan belirli bir ürünü değil; aşağıdaki her POPOPX hücresi yukarıdaki kaynağı doğrulanmış beş olgudan biridir.",
    hu: "A másik két oszlop egy termékkategória általános architektúráját írja le, sosem egy konkrét megnevezett terméket; minden POPOPX-cella lent a fenti, forrással igazolt öt tény egyike.",
  },
  tableHeading: {
    en: "The comparison: POPOPX service accounts against two centralised designs",
    ru: "Сравнение: сервис-аккаунты POPOPX против двух централизованных схем",
    de: "Der Vergleich: POPOPX-Dienstekonten gegen zwei zentralisierte Bauarten",
    fr: "La comparaison : comptes de service POPOPX contre deux conceptions centralisées",
    it: "Il confronto: account di servizio POPOPX contro due progettazioni accentrate",
    nl: "De vergelijking: POPOPX-serviceaccounts tegenover twee gecentraliseerde ontwerpen",
    cs: "Srovnání: servisní účty POPOPX proti dvěma centralizovaným návrhům",
    "zh-Hans": "对比：POPOPX 服务号与两类中心化方案",
    "zh-Hant": "對比：POPOPX 服務號與兩類中心化方案",
    es: "La comparación: cuentas de servicio POPOPX frente a dos diseños centralizados",
    pl: "Porównanie: konta serwisowe POPOPX wobec dwóch scentralizowanych rozwiązań",
    ja: "比較：POPOPX サービスアカウント と 2 種類の中央集権型方式",
    th: "การเปรียบเทียบ: บัญชีบริการ POPOPX กับแนวทางรวมศูนย์สองแบบ",
    fi: "Vertailu: POPOPX-palvelutilit kahta keskitettyä ratkaisua vastaan",
    uk: "Порівняння: сервіс-акаунти POPOPX проти двох централізованих схем",
    bg: "Сравнението: акаунти за услуги POPOPX срещу две централизирани схеми",
    tr: "Karşılaştırma: POPOPX hizmet hesapları, merkezi iki tasarımın karşısında",
    hu: "Az összehasonlítás: POPOPX szolgáltatási fiókok két centralizált megoldással szemben",
  },
  colDimension: {
    en: "Dimension",
    ru: "Критерий",
    de: "Vergleichspunkt",
    fr: "Critère",
    it: "Aspetto",
    nl: "Overwegingspunt",
    cs: "Hledisko",
    "zh-Hans": "对比维度",
    "zh-Hant": "對比維度",
    es: "Criterio",
    pl: "Kryterium",
    ja: "比較項目",
    th: "หัวข้อเปรียบเทียบ",
    fi: "Näkökulma",
    uk: "Критерій",
    bg: "Критерий",
    tr: "Ölçüt",
    hu: "Szempont",
  },
  colSelf: {
    en: "POPOPX service account",
    ru: "Сервис-аккаунт POPOPX",
    de: "POPOPX-Dienstekonto",
    fr: "Compte de service POPOPX",
    it: "Account di servizio POPOPX",
    nl: "POPOPX-serviceaccount",
    cs: "Servisní účet POPOPX",
    "zh-Hans": "POPOPX 服务号",
    "zh-Hant": "POPOPX 服務號",
    es: "Cuenta de servicio POPOPX",
    pl: "Konto serwisowe POPOPX",
    ja: "POPOPX サービスアカウント",
    th: "บัญชีบริการ POPOPX",
    fi: "POPOPX-palvelutili",
    uk: "Сервіс-акаунт POPOPX",
    bg: "Акаунт за услуги POPOPX",
    tr: "POPOPX hizmet hesabı",
    hu: "POPOPX szolgáltatási fiók",
  },
  colOfficial: {
    en: "Traditional social-platform official accounts",
    ru: "Традиционные официальные аккаунты соцплатформ",
    de: "Klassische offizielle Konten von Social-Plattformen",
    fr: "Comptes officiels classiques de plateformes sociales",
    it: "Account ufficiali tradizionali delle piattaforme social",
    nl: "Klassieke officiële accounts van sociale platforms",
    cs: "Klasické oficiální účty sociálních platforem",
    "zh-Hans": "传统社交公众号",
    "zh-Hant": "傳統社群公眾帳號",
    es: "Cuentas oficiales tradicionales de plataformas sociales",
    pl: "Zwykłe oficjalne konta platform społecznościowych",
    ja: "従来のソーシャルプラットフォーム公式アカウント",
    th: "บัญชีทางการของแพลตฟอร์มโซเชียลแบบเดิม",
    fi: "Perinteiset sosiaalialustojen viralliset tilit",
    uk: "Традиційні офіційні акаунти соцплатформ",
    bg: "Традиционни официални акаунти в социалните платформи",
    tr: "Geleneksel sosyal platform resmî hesapları",
    hu: "Hagyományos közösségi platformos hivatalos fiókok",
  },
  colBot: {
    en: "Centralised bot platforms",
    ru: "Централизованные Bot-платформы",
    de: "Zentralisierte Bot-Plattformen",
    fr: "Plateformes de bots centralisées",
    it: "Piattaforme di bot centralizzate",
    nl: "Gecentraliseerde botplatforms",
    cs: "Centralizované bot platformy",
    "zh-Hans": "中心化 Bot 平台",
    "zh-Hant": "中心化 Bot 平台",
    es: "Plataformas de bots centralizadas",
    pl: "Scentralizowane platformy botów",
    ja: "中央集権型 Bot プラットフォーム",
    th: "แพลตฟอร์มบอทแบบรวมศูนย์",
    fi: "Keskitetyt bottialustat",
    uk: "Централізовані Bot-платформи",
    bg: "Централизирани bot платформи",
    tr: "Merkezi bot platformları",
    hu: "Centralizált bot-platformok",
  },

  sovereigntyHeading: {
    en: "Data sovereignty: what the gateway does not hold",
    ru: "Суверенитет данных: что шлюз не хранит",
    de: "Datensouveränität: was das Gateway nicht hält",
    fr: "Souveraineté des données : ce que la passerelle ne détient pas",
    it: "Sovranità dei dati: ciò che il gateway non detiene",
    nl: "Gegevenssoevereiniteit: wat de gateway níét in bezit heeft",
    cs: "Dataová suverenita: co brána nedrží",
    "zh-Hans": "数据主权边界：网关不持有什么",
    "zh-Hant": "資料主權邊界：閘道器不持有什麼",
    es: "Soberanía de los datos: lo que el gateway no posee",
    pl: "Suwerenność danych: czego brama nie przechowuje",
    ja: "データ主権の範囲:ゲートウェイが保有しないもの",
    th: "อธิปไตยของข้อมูล: สิ่งที่เกทเวย์ไม่ได้ถือครอง",
    fi: "Tietosouveräniteetti: mitä yhdyskäntä ei pidä hallussaan",
    uk: "Суверенітет даних: що шлюз не зберігає",
    bg: "Суверенитет на данните: какво гейтуейтът не притежава",
    tr: "Veri egemenliği: ağ geçidinin tutmadığı şeyler",
    hu: "Adatszuverenitás: amit az átjáró nem birtokol",
  },
  sovereigntyKept: {
    en: "Three that hold up",
    ru: "Три утверждения, которые выдерживают проверку",
    de: "Drei, die standhalten",
    fr: "Trois qui tiennent",
    it: "Tre che reggono",
    nl: "Drie die standhouden",
    cs: "Tři, které obstojí",
    "zh-Hans": "三条站得住的",
    "zh-Hant": "三條站得住腳的",
    es: "Tres que se sostienen",
    pl: "Trzy, które się obronią",
    ja: "成立する 3 項目",
    th: "สามข้อที่ยืนยันได้",
    fi: "Kolme kestävää väitettä",
    uk: "Три твердження, що витримують перевірку",
    bg: "Три твърдения, които издържат",
    tr: "Karşılığı olan üç iddia",
    hu: "Három, ami megállja a helyét",
  },
  sovereigntyHeld: {
    en: "The same source also states plainly what it does hold",
    ru: "Тот же исходный код прямо говорит и о том, что шлюз действительно хранит",
    de: "Dieselbe Quelle sagt auch klar, was sie tatsächlich hält",
    fr: "La même source indique tout aussi clairement ce qu'elle détient réellement",
    it: "La stessa sorgente indica senza giri di parole anche che cosa effettivamente detenga",
    nl: "Dezelfde bron zegt ook letterlijk wat deze wél in bezit heeft",
    cs: "Stejný zdroj otevřeně říká i to, co skutečně drží",
    "zh-Hans": "同一段源码也写明了它确实持有什么",
    "zh-Hant": "同一段原始碼也寫明了它確實持有甚麼",
    es: "La misma fuente también dice sin rodeos lo que sí posee",
    pl: "To samo źródło wprost mówi też, co faktycznie przechowuje",
    ja: "同じソースは、実際に何を保有しているかも明確に書き込んであります",
    th: "ซอร์สเดียวกันยังระบุชัดด้วยว่าอะไรคือสิ่งที่ถือครองอยู่จริง",
    fi: "Sama lähde sanoo suoraan myös sen, mitä se todella pitää hallussaan",
    uk: "Той самий вихідний код прямо каже й про те, що шлюз справді зберігає",
    bg: "Същият източник ясно казва и какво реално притежава",
    tr: "Aynı kaynak, gerçekte neyi tuttuğunu da açıkça söylüyor",
    hu: "Ugyanez a forrás azt is nyíltan kimondja, amit tényleg birtokol",
  },
} satisfies Record<string, Localized<string>>;

const CLIENT_TITLE = "POPOPX";

const PATHS: readonly Localized<string>[] = [
  {
    en: "Messages: client ↔ node, end to end encrypted — a relay sees ciphertext and its own routing metadata.",
    ru: "Сообщения: клиент ↔ узел, сквозное шифрование — ретранслятор видит шифротекст и лишь свои метаданные маршрутизации.",
    de: "Nachrichten: Client ↔ Node, Ende-zu-Ende-verschlüsselt – ein Relay sieht Chiffretext und seine eigenen Routing-Metadaten.",
    fr: "Messages : client ↔ nœud, chiffré de bout en bout — un relai ne voit que du texte chiffré et ses propres métadonnées de routage.",
    it: "Messaggi: client ↔ nodo, cifratura end to end — un relay vede solo testo cifrato e i propri metadati di instradamento.",
    nl: "Berichten: client ↔ node, end-to-end versleuteld — een relay ziet alleen ciphertext en zijn eigen routeringsmetadata.",
    cs: "Zprávy: klient ↔ uzel, end-to-end šifrování — relé vidí šifrotext a svá vlastní metadata směrování.",
    "zh-Hans": "消息：客户端 ↔ 节点，端到端加密，中继只见密文与自己那段路由元数据。",
    "zh-Hant": "訊息：客戶端 ↔ 節點，端對端加密，中繼只看得到密文與自己那段路由元資料。",
    es: "Mensajes: cliente ↔ nodo, cifrado de extremo a extremo — un relay solo ve texto cifrado y sus propios metadatos de enrutamiento.",
    pl: "Wiadomości: klient ↔ węzeł, szyfrowanie end-to-end — przekaźnik widzi tylko zaszyfrowany tekst i własne metadane routingu.",
    ja: "メッセージ:クライアント ↔ ノードでエンドツーエンド暗号化。リレーが見るのは暗号文と、自分区間のルーティングメタデータのみです。",
    th: "ข้อความ: ไคลเอนต์ ↔ โหนด เข้ารหัสแบบ end-to-end รีเลย์จะเห็นเฉพาะข้อมูลที่ถูกเข้ารหัสกับเมทาดาทาการกำหนดเส้นทางของตัวมันเอง",
    fi: "Viestit: sovellus ↔ solmu, päästä päähän salattu — välityssolmu näkee salauksen ja omat reitityksen metatiedot.",
    uk: "Повідомлення: клієнт ↔ вузол, наскрізне шифрування — ретранслятор бачить шифротекст і лише власні метадані маршрутизації.",
    bg: "Съобщения: клиент ↔ възел, криптиране от край до край — ретранслаторът вижда само шифротекст и собствените си метаданни за маршрутизация.",
    tr: "Mesajlar: istemci ↔ düğüm, uçtan uca şifreli — bir aktarıcı yalnızca şifreli metni ve kendi yönlendirme üst verisini görür.",
    hu: "Üzenetek: kliens ↔ csomópont, végpontok közötti titkosítással — egy közvetítő csak titkosított szöveget és a saját útválasztási metaadatait látja.",
  },
  {
    en: "Commands: gateway → node over that one loopback channel, ws://127.0.0.1:5225.",
    ru: "Команды: шлюз → узел по тому единственному loopback-каналу, ws://127.0.0.1:5225.",
    de: "Befehle: Gateway → Node über genau diesen einen Loopback-Kanal, ws://127.0.0.1:5225.",
    fr: "Commandes : passerelle → nœud par cet unique canal en boucle locale, ws://127.0.0.1:5225.",
    it: "Comandi: gateway → nodo su quell'unico canale su loopback, ws://127.0.0.1:5225.",
    nl: "Commando's: gateway → node via dat ene loopback-kanaal, ws://127.0.0.1:5225.",
    cs: "Příkazy: brána → uzel tím jediným loopback-kanálem, ws://127.0.0.1:5225.",
    "zh-Hans": "指令：网关 → 节点，只有 ws://127.0.0.1:5225 这一条回环通道。",
    "zh-Hant": "指令：閘道器 → 節點，只有 ws://127.0.0.1:5225 這條迴圈通道。",
    es: "Comandos: gateway → nodo por ese único canal de loopback, ws://127.0.0.1:5225.",
    pl: "Polecenia: brama → węzeł tym jednym kanałem loopback, ws://127.0.0.1:5225.",
    ja: "コマンド:ゲートウェイ → ノードは ws://127.0.0.1:5225 のループバック経路ただ 1 本のみ。",
    th: "คำสั่ง: เกทเวย์ → โหนด ผ่านช่องทาง loopback เส้นเดียวเท่านั้น คือ ws://127.0.0.1:5225",
    fi: "Komennot: yhdyskäntä → solmu sitä ainoaa loopback-kanavaa pitkin, ws://127.0.0.1:5225.",
    uk: "Команди: шлюз → вузол тим єдиним каналом loopback, ws://127.0.0.1:5225.",
    bg: "Команди: гейтуейт → възел по онзи единствен loopback канал, ws://127.0.0.1:5225.",
    tr: "Komutlar: ağ geçidi → düğüm, o tek loopback kanalı üzerinden, ws://127.0.0.1:5225.",
    hu: "Parancsok: átjáró → csomópont azon az egy loopback csatornán, ws://127.0.0.1:5225.",
  },
  {
    en: "H5: the client's browser → gateway — card callbacks and verifyH5Auth reach the public origin.",
    ru: "H5: браузер клиента → шлюз — обратные вызовы карт и verifyH5Auth приходят на публичный адрес источника.",
    de: "H5: Browser des Clients → Gateway — Karten-Callbacks und verifyH5Auth erreichen den öffentlichen Ursprung.",
    fr: "H5 : le navigateur du client → passerelle — les rappels de carte et verifyH5Auth atteignent l'origine publique.",
    it: "H5: il browser del client → gateway — i callback delle card e verifyH5Auth raggiungono l'origine pubblica.",
    nl: "H5: de browser van de client → gateway — kaart-callbacks en verifyH5Auth komen bij de publieke oorsprong aan.",
    cs: "H5: prohlížeč klienta → brána — callbacky karet a verifyH5Auth dorazí na veřejný zdroj.",
    "zh-Hans": "H5：客户端浏览器 → 网关，卡片回调与 verifyH5Auth 走公网那个来源地址。",
    "zh-Hant": "H5：客戶端瀏覽器 → 閘道器，卡片回呼與 verifyH5Auth 走公網那個來源位址。",
    es: "H5: el navegador del cliente → gateway — las devoluciones de llamada de la tarjeta y verifyH5Auth llegan al origen público.",
    pl: "H5: przeglądarka klienta → brama — wywołania zwrotne kart i verifyH5Auth trafiają do publicznego źródła.",
    ja: "H5:クライアントのブラウザ → ゲートウェイ。カードのコールバックと verifyH5Auth は公網側の起点アドレスに向かいます。",
    th: "H5: เบราว์เซอร์ของไคลเอนต์ → เกทเวย์ — การเรียกกลับของการ์ดกับ verifyH5Auth ไปยังที่มาสาธารณะ",
    fi: "H5: sovelluksen selain → yhdyskäntä — korttien takaisinkutsut ja verifyH5Auth tulevat julkiseen alkuperään.",
    uk: "H5: браузер клієнта → шлюз — зворотні виклики карток та verifyH5Auth надходять на публічний адрес джерела.",
    bg: "H5: браузърът на клиента → гейтуейт — обажданията на картите и verifyH5Auth достигат публичния произход.",
    tr: "H5: istemcinin tarayıcısı → ağ geçidi — kart geri çağrıları ve verifyH5Auth genel kaynağa ulaşır.",
    hu: "H5: a kliens böngészője → átjáró — a kártya visszahívások és a verifyH5Auth a nyilvános forráshoz érkezik.",
  },
];

const ROWS: readonly {
  readonly dimension: Localized<string>;
  readonly self: Localized<string>;
  readonly official: Localized<string>;
  readonly bot: Localized<string>;
}[] = [
  {
    dimension: {
      en: "What a server can read",
      ru: "Что читает сервер",
      de: "Was ein Server mitliest",
      fr: "Ce qu'un serveur peut lire",
      it: "Cosa un server riesce a leggere",
      nl: "Wat een server kan lezen",
      cs: "Co server dokáže přečíst",
      "zh-Hans": "服务器内容可见性",
      "zh-Hant": "伺服器內容可見性",
      es: "Lo que un servidor puede leer",
      pl: "Co potrafi odczytać serwer",
      ja: "サーバー側で見える内容の範囲",
      th: "สิ่งที่เซิร์ฟเวอร์อ่านได้",
      fi: "Mitä palvelin pystyy lukemaan",
      uk: "Що сервер читає",
      bg: "Какво сървърът може да прочете",
      tr: "Bir sunucunun okuyabildikleri",
      hu: "Mit olvas el egy szerver",
    },
    self: {
      en: "Channel content is encrypted with the epoch key before it fans out, so a relay sees only ciphertext; cards and menus live in the merchant's own gateway.db.",
      ru: "Содержимое канала шифруется ключом epoch ещё до рассылки, поэтому ретранслятор видит только шифротекст; карты и меню лежат в gateway.db самого продавца.",
      de: "Kanalinhalt wird mit dem Epoch-Schlüssel verschlüsselt, bevor er verteilt wird, deshalb sieht ein Relay nur Chiffretext; Karten und Menüs liegen in der gateway.db des Händlers selbst.",
      fr: "Le contenu du canal est chiffré avec la clé d'epoch avant d'être diffusé, si bien qu'un relai ne voit que du texte chiffré ; les cartes et les menus résident dans le gateway.db du marchand.",
      it: "Il contenuto del canale è cifrato con la chiave epoch prima di essere distribuito, quindi un relay vede solo testo cifrato; card e menu stanno nel gateway.db dell'attività stessa.",
      nl: "Kanaalinhoud wordt met de epoch-sleutel versleuteld vóór de distributie, dus een relay ziet alleen ciphertext; kaarten en menu’s staan in de eigen gateway.db van de handelaar.",
      cs: "Obsah kanálu je šifrován klíčem epoch ještě před rozšířením, takže relé vidí jen šifrotext; karty i nabídka sídlí v gateway.db prodejce samotného.",
      "zh-Hans": "频道内容由签发方用 epoch key 加密后才扇出，中继只见密文；卡片与菜单存在商户自己的 gateway.db 里。",
      "zh-Hant": "頻道內容由簽發方用 epoch key 加密後才扇出，中繼只見密文；卡片與選單存在商家自己的 gateway.db 裡。",
      es: "El contenido del canal se cifra con la clave de epoch antes de repartirse, así que un relay solo ve texto cifrado; las tarjetas y los menús viven en el gateway.db del propio comercio.",
      pl: "Treść kanału jest szyfrowana kluczem epoch jeszcze przed rozesłaniem, więc przekaźnik widzi tylko tekst zaszyfrowany; karty i menu znajdują się w pliku gateway.db samego sprzedawcy.",
      ja: "チャンネルの内容は配信前に epoch key で暗号化されるため、リレーに見えるのは暗号文だけです。カードとメニューは事業者自身の gateway.db に格納されます。",
      th: "เนื้อหาในช่องทางถูกเข้ารหัสด้วยคีย์ epoch ก่อนกระจายออก รีเลย์จึงเห็นแค่ข้อมูลเข้ารหัส ส่วนการ์ดกับเมนูเก็บใน gateway.db ของร้านค้าเอง",
      fi: "Kanavan sisältö salataan epoch-avaimella jo ennen levittämistä, joten välityssolmu näkee vain salattua tekstiä; kortit ja valikot ovat kauppiaan omassa gateway.db-tiedostossa.",
      uk: "Вміст каналу шифрується ключем epoch ще до розсилки, тому ретранслятор бачить лише шифротекст; картки та меню лежать у gateway.db самого продавця.",
      bg: "Съдържанието на канала се криптира с ключа на epoch, преди да се раздели, затова ретранслаторът вижда само шифротекст; картите и менютата са в gateway.db на търговеца.",
      tr: "Kanal içeriği, dağıtılmadan önce epoch anahtarıyla şifrelenir, böylece bir aktarıcı yalnızca şifreli metni görür; kartlar ve menü, tüccarın kendi gateway.db dosyasında durur.",
      hu: "A csatorna tartalmát az epoch-kulccsal titkosítják a szétosztás előtt, ezért egy közvetítő csak titkosított szöveget lát; a kártyák és a menük a kereskedő saját gateway.db fájljában vannak.",
    },
    official: {
      en: "Hosted on the operator's servers and readable in plaintext there.",
      ru: "Размещается на серверах оператора и читается там открытым текстом.",
      de: "Wird auf den Servern des Betreibers gehostet und ist dort im Klartext lesbar.",
      fr: "Hébergé sur les serveurs de l'opérateur et lisible en clair chez lui.",
      it: "Ospitato sui server dell'operatore e leggibile in chiaro presso di lui.",
      nl: "Gehost op de servers van de exploitant en daar in leesbare tekst te lezen.",
      cs: "Hostováno na serverech provozovatele a čitelné otevřeným textem.",
      "zh-Hans": "托管在运营方服务器，运营方一侧以明文可见。",
      "zh-Hant": "託管在營運方伺服器，營運方一側以明文可見。",
      es: "Alojado en los servidores del operador y legible en texto plano allí.",
      pl: "Hostowany na serwerach operatora i tam czytelny jako zwykły tekst.",
      ja: "運営者のサーバーに預けられ、その側では平文で読めます。",
      th: "โฮสต์บนเซิร์ฟเวอร์ของผู้ให้บริการและอ่านเป็นข้อความธรรมดาได้ที่นั่น",
      fi: "Operaattorin palvelimilla isännöity ja siellä selkosanaisena luettavissa.",
      uk: "Розміщено на серверах оператора й читається там відкритим текстом.",
      bg: "Хостирован на сървърите на оператора и четим там като чист текст.",
      tr: "İşletenin sunucularında barındırılır ve orada düz metin olarak okunabilir.",
      hu: "Az üzemeltető szervereiben van elhelyezve, és ott nyílt szövegként olvasható.",
    },
    bot: {
      en: "Message bodies are relayed by the platform to the developer's server, and readable in plaintext on both sides.",
      ru: "Тела сообщений платформа передаёт на сервер разработчика, и они читаются открытым текстом с обеих сторон.",
      de: "Nachrichtenrümpfe werden von der Plattform an den Server des Entwicklers weitergegeben und sind auf beiden Seiten im Klartext lesbar.",
      fr: "Les corps des messages sont relayés par la plateforme vers le serveur du développeur et lisibles en clair des deux côtés.",
      it: "I corpi dei messaggi vengono inoltrati dalla piattaforma al server dello sviluppatore e leggibili in chiaro da entrambe le parti.",
      nl: "Berichtteksten worden door het platform naar de server van de ontwikkelaar doorgespeeld en zijn aan beide kanten in leesbare tekst te lezen.",
      cs: "Těla zpráv platforma přeposílá na server vývojáře a jsou čitelná otevřeným textem na obou stranách.",
      "zh-Hans": "消息体由平台转发给开发者服务器，平台与开发者两侧都可读明文。",
      "zh-Hant": "訊息體由平台轉發給開發者伺服器，平台與開發者兩側皆可讀明文。",
      es: "Los cuerpos de los mensajes son retransmitidos por la plataforma al servidor del desarrollador y legibles en texto plano en ambos lados.",
      pl: "Treści wiadomości są przekazywane przez platformę na serwer dewelopera i czytelne jako zwykły tekst po obu stronach.",
      ja: "メッセージ本文はプラットフォーム経由で開発者のサーバーに中継され、両側で平文として読めます。",
      th: "ตัวข้อความถูกแพลตฟอร์มส่งต่อไปยังเซิร์ฟเวอร์ของนักพัฒนา และอ่านเป็นข้อความธรรมดาได้ทั้งสองฝั่ง",
      fi: "Viestien runnot välitetään alustalta kehittäjän palvelimelle, ja ne ovat luettavissa selkeäsanaisena molemmin puolin.",
      uk: "Тіла повідомлень платформа передає на сервер розробника, і вони читаються відкритим текстом з обох боків.",
      bg: "Телата на съобщенията се препредават от платформата към сървъра на разработчика и се четат като чист текст от двете страни.",
      tr: "Mesaj gövdeleri platform tarafından geliştiricinin sunucusuna iletilir ve her iki tarafta da düz metin olarak okunabilir.",
      hu: "Az üzenettörzseket a platform továbbítja a fejlesztő szerverére, és mindkét oldalon nyílt szövegként olvashatók.",
    },
  },
  {
    dimension: {
      en: "Global account ID exposure",
      ru: "Утечка глобального ID аккаунта",
      de: "Exposition der globalen Konten-ID",
      fr: "Exposition de l'identifiant global de compte",
      it: "Esposizione dell'ID account globale",
      nl: "Blootstelling van het globale account-ID",
      cs: "Odhalení globálního ID účtu",
      "zh-Hans": "全局账号 ID 暴露",
      "zh-Hant": "全域帳號 ID 暴露",
      es: "Exposición del ID global de cuenta",
      pl: "Ujawnienie globalnego identyfikatora konta",
      ja: "グローバルアカウント ID の露出",
      th: "การเปิดเผย ID บัญชีระดับสากล",
      fi: "Maailmanlaajuisen tilin paljastuminen",
      uk: "Витік глобального ID акаунта",
      bg: "Разкриване на глобалния идентификатор на акаунта",
      tr: "Genel hesap kimliğinin açığa çıkması",
      hu: "A globális fiók-azonosító kiszivárgása",
    },
    self: {
      en: "No global user ID at all. Each follower has one pairwise uid minted by that gateway (prefix pw_), so a different service account sees a different ID.",
      ru: "Глобального ID пользователя нет вовсе. У каждого подписчика есть только попарный uid, выпущенный этим шлюзом (префикс pw_), поэтому другой сервис-аккаунт видит другой ID.",
      de: "Es gibt gar keine globale Benutzer-ID. Jeder Follower hat genau eine paarweise uid, die dieses Gateway ausstellt (Präfix pw_), sodass ein anderes Dienstekonto eine andere ID sieht.",
      fr: "Pas du tout d'identifiant utilisateur global. Chaque abonné n'a qu'un uid par paire frappé par cette passerelle (préfixe pw_), donc un autre compte de service voit un autre identifiant.",
      it: "Nessun ID utente globale, punto. Ogni follower ha un solo uid a coppie coniato da quel gateway (prefisso pw_), quindi un account di servizio diverso vede un ID diverso.",
      nl: "Er bestaat geen globale gebruikers-ID. Elke volger heeft slechts één paarsgewijze uid, aangemaakt door deze gateway (prefix pw_), dus een ander serviceaccount ziet een andere ID.",
      cs: "Žádné globální ID uživatele vůbec neexistuje. Každý odběratel má jediné párové uid, které vydává daná brána (předpona pw_), takže jiný servisní účet vidí jiné ID.",
      "zh-Hans": "没有全局用户 ID。每位粉丝只有一个由本网关生成的成对 uid（pw_ 前缀），换一个服务号就换一个 ID。",
      "zh-Hant": "沒有全域使用者 ID。每位粉絲只有一個由本閘道器產生的成對 uid（pw_ 前綴），換一個服務號就換一個 ID。",
      es: "Ningún ID global de usuario en absoluto. Cada seguidor tiene un único uid por par acuñado por ese gateway (prefijo pw_), así que una cuenta de servicio distinta ve un ID distinto.",
      pl: "W ogóle nie ma globalnego identyfikatora użytkownika. Każdy obserwujący ma jeden identyfikator uid parami nadany przez tę bramę (prefiks pw_), więc inne konto serwisowe widzi inny identyfikator.",
      ja: "グローバルなユーザー ID は存在しません。フォロワーごとに、そのゲートウェイが発番したペア単位 uid（接頭辞 pw_）が 1 つだけ。したがって別のサービスアカウントでは別の ID が見えます。",
      th: "ไม่มี ID ผู้ใช้ระดับ สกาล เลย แต่ละผู้ติดตามมี uid เฉพาะคู่ที่เกทเวย์นี้เป็นผู้ออกเพียงค่าเดียว (คำนำหน้า pw_) สลับบัญชีบริการก็เห็นคนละ ID",
      fi: "Yleismaailmallista käyttäjätunnistetta ei ole lainkaan. Jokaisella seuraajalla on ainoastaan se yhdyskäntälyömä parittainen uid (etuliite pw_), joten toinen palvelutili näkee toisen tunnisteen.",
      uk: "Глобального ID користувача взагалі немає. У кожного підписника є лише один попарний uid, виданий цим шлюзом (префікс pw_), тому інший сервіс-акаунт бачить інший ID.",
      bg: "Няма глобален потребителски ID изобщо. Всеки последовател има само един двойков uid, издаден от този гейтуейт (префикс pw_), така че различен акаунт за услуги вижда различен ID.",
      tr: "Genel bir kullanıcı kimliği hiç yok. Her takipçinin, o ağ geçidinin ürettiği tek bir çift bazlı uid'si vardır (ön ek pw_), dolayısıyla farklı bir hizmet hesabı farklı bir kimlik görür.",
      hu: "Egyáltalán nincs globális felhasználói azonosító. Minden követőnek csak egy, az adott átjáró által kiállított, páronkénti uid-je van (pw_ előtag), így egy másik szolgáltatási fiók másik azonosítót lát.",
    },
    official: {
      en: "One account ID runs through every official account and third-party page on the platform and can be joined server-side.",
      ru: "Один ID аккаунта проходит через все официальные аккаунты и сторонние страницы на платформе и может быть сопоставлен на стороне сервера.",
      de: "Eine Konten-ID zieht sich durch jedes offizielle Konto und jede Drittanbieterseite auf der Plattform und lässt sich serverseitig verknüpfen.",
      fr: "Un même identifiant de compte traverse tous les comptes officiels et toutes les pages tierces de la plateforme et peut être rapproché côté serveur.",
      it: "Un unico ID account attraversa ogni account ufficiale e ogni pagina di terze parti sulla piattaforma e può essere incrociato lato server.",
      nl: "Eén account-ID loopt door elk officieel account en elke pagina van derden op het platform en kan serverzijds worden gekoppeld.",
      cs: "Jedno ID účtu prochází všemi oficiálními účty a všemi stránkami třetích stran na platformě a dá se na straně serveru spojit.",
      "zh-Hans": "同一个账号 ID 贯穿平台内所有公众号与第三方页面，可以在服务端关联。",
      "zh-Hant": "同一個帳號 ID 貫穿平台內所有公眾帳號與第三方頁面，可以在服務端關聯。",
      es: "Un mismo ID de cuenta recorre todas las cuentas oficiales y todas las páginas de terceros de la plataforma y puede correlacionarse en el servidor.",
      pl: "Ten sam identyfikator konta przechodzi przez wszystkie konta oficjalne i strony zewnętrzne na platformie i można go powiązać po stronie serwera.",
      ja: "同一のアカウント ID がプラットフォーム上の全公式アカウントと第三者ページを横断するため、サーバー側で突合できます。",
      th: "ID บัญชีเดียวไหลผ่านทุกบัญชีทางการและทุกหน้าบุคคลที่สามบนแพลตฟอร์ม และสามารถถูกจับเชื่อมโยงที่ฝั่งเซิร์ฟเวอร์",
      fi: "Sama tilin tunniste kulkee kaikkien virallisten tilien ja kolmannen osapuolen sivustojen läpi alustalla ja voidaan liittää palvelinpuolella.",
      uk: "Один ID акаунта проходить через усі офіційні акаунти та сторінки третіх сторін на платформі й може бути зіставлений на боці сервера.",
      bg: "Един идентификатор на акаунта преминава през всички официални акаунти и страници на трети страни в платформата и може да се свърже от страната на сървъра.",
      tr: "Tek bir hesap kimliği, platformdaki bütün resmî hesaplardan ve üçüncü taraf sayfalarından geçer ve sunucu tarafında eşleştirilebilir.",
      hu: "Egy fiók-azonosító végigmegy a platform minden hivatalos fiókján és harmadik féltől származó lapján, és szerveroldalon összevonható.",
    },
    bot: {
      en: "The platform-issued user identifier is visible to every bot that integrates, so it joins across them by default.",
      ru: "Идентификатор пользователя, выданный платформой, виден каждому интегрированному боту, поэтому по умолчанию он сопоставляется между ними.",
      de: "Die vom Plattform ausgestellte Benutzerkennung ist für jeden integrierten Bot sichtbar, weshalb sie standardmäßig über alle hinweg verknüpft wird.",
      fr: "L'identifiant utilisateur délivré par la plateforme est visible de chaque bot qui s'intègre, donc il se recoupe entre eux par défaut.",
      it: "L'identificativo utente emesso dalla piattaforma è visibile a ogni bot che si integra, quindi di default si incrocia fra tutti.",
      nl: "De door het platform uitgegeven gebruikersidentifier is zichtbaar voor elke geïntegreerde bot, dus wordt hij standaard over al die bots heen gekoppeld.",
      cs: "Identifikátor uživatele vydávaný platformou je viditelný každému napojenému botovi, a proto se napříč boty standardně spojuje.",
      "zh-Hans": "平台分配的用户标识对每个接入的 bot 都可见，天生可交叉比对。",
      "zh-Hant": "平台分配的使用者識別號對每個接入的 bot 都可見，天生可交叉比對。",
      es: "El identificador de usuario emitido por la plataforma es visible para cada bot que se integra, así que por defecto se correlaciona entre todos.",
      pl: "Identyfikator użytkownika nadany przez platformę jest widoczny dla każdego zintegrowanego bota, więc domyślnie daje się powiązać między nimi.",
      ja: "プラットフォームが発行したユーザー識別子は接続しているすべての Bot に見えてしまうため、既定では Bot 間で突合されてしまいます。",
      th: "ตัวระบุผู้ใช้ที่แพลตฟอร์มออกให้ได้ จะมองเห็นได้จากทุกบอทที่เชื่อมต่อเข้ามา จึงถูกจับโยงข้ามบอทได้ตามค่าเริ่มต้น",
      fi: "Alustan myöntämä käyttäjätunniste näkyy jokaiselle integroidulle botille, joten se oletuksena liitetään niiden kesken.",
      uk: "Ідентифікатор користувача, виданий платформою, видимий кожному інтегрованому боту, тому типово він зіставляється між ними.",
      bg: "Идентификаторът на потребителя, издаден от платформата, се вижда от всеки интегриран bot, затова по подразбиране се свързва между тях.",
      tr: "Platformun verdiği kullanıcı tanımlayıcısı, entegre olan her bota görünür; bu yüzden varsayılan olarak botlar arasında eşleştirilir.",
      hu: "A platform által kiállított felhasználói azonosítót minden bejelentkező bot látja, ezért alapértelmezésben összevonhatók egymással.",
    },
  },
  {
    dimension: {
      en: "Self-hosted data",
      ru: "Данные на своём сервере",
      de: "Selbst gehostete Daten",
      fr: "Données auto-hébergées",
      it: "Dati self-hosted",
      nl: "Eigen gehoste gegevens",
      cs: "Data na vlastním hostingu",
      "zh-Hans": "数据私有化部署",
      "zh-Hant": "資料私有化部署",
      es: "Datos autoalojados",
      pl: "Dane we własnym hostingu",
      ja: "データを自前で運用する",
      th: "ข้อมูลที่โฮสต์เอง",
      fi: "Omalla palvelimella pidettävät tiedot",
      uk: "Дані на власному сервері",
      bg: "Собствено хостирани данни",
      tr: "Kendi barındırılan veriler",
      hu: "Saját üzemeltetésű adatok",
    },
    self: {
      en: "One command onto your own machine (a production script for Ubuntu 22.04, a dev script for macOS); all state sits in a single SQLite file, and backing that file up is the whole procedure.",
      ru: "Одна команда на собственную машину (продакшн-скрипт для Ubuntu 22.04, скрипт разработки для macOS); всё состояние лежит в одном файле SQLite, и резервная копия этого файла — вся процедура.",
      de: "Ein Befehl auf den eigenen Rechner (ein Produktionsskript für Ubuntu 22.04, ein Entwicklungsskript für macOS); sämtlicher Zustand sitzt in einer einzigen SQLite-Datei, und diese Datei zu sichern ist das ganze Verfahren.",
      fr: "Une commande vers votre propre machine (un script de production pour Ubuntu 22.04, un script de développement pour macOS) ; tout l'état tient dans un unique fichier SQLite, et sauvegarder ce fichier constitue toute la procédure.",
      it: "Un comando sul proprio calcolatore (uno script di produzione per Ubuntu 22.04, uno script di sviluppo per macOS); tutto lo stato sta in un singolo file SQLite, e fare il backup di quel file è l'intera procedura.",
      nl: "Eén commando naar je eigen machine (een productiescript voor Ubuntu 22.04, een development-script voor macOS); alle staat zit in één SQLite-bestand, en dat bestand back-uppen is de hele procedure.",
      cs: "Jeden příkaz na vlastní stroj (produkční skript pro Ubuntu 22.04, vývojový skript pro macOS); veškerý stav sedí v jediném souboru SQLite a záloha tohoto souboru je celá procedura.",
      "zh-Hans": "一条命令装到自有服务器（Ubuntu 22.04 生产脚本 / macOS 开发脚本），全部状态收在一个 SQLite 文件，备份它就够了。",
      "zh-Hant": "一條命令裝到自有伺服器（Ubuntu 22.04 生產腳本 / macOS 開發腳本），所有狀態收在一個 SQLite 檔案，備份它就夠了。",
      es: "Un comando a su propia máquina (un script de producción para Ubuntu 22.04, un script de desarrollo para macOS); todo el estado reside en un único archivo SQLite, y hacer la copia de seguridad de ese archivo es todo el procedimiento.",
      pl: "Jedno polecenie na własną maszynę (skrypt produkcyjny dla Ubuntu 22.04, skrypt deweloperski dla macOS); cały stan mieści się w pojedynczym pliku SQLite i zrobienie kopii zapasowej tego pliku stanowi całą procedurę.",
      ja: "コマンド 1 つで自分のマシンに導入できます（Ubuntu 22.04 向け運用スクリプト / macOS 向け開発スクリプト）。状態はすべて SQLite ファイル 1 つに収まり、そのファイルをバックアップするだけで手順は完了です。",
      th: "ใช้คำสั่งเดียวติดตั้งบนเครื่องของตัวเอง (สคริปต์สำหรับใช้งานจริงบน Ubuntu 22.04 และสคริปต์สำหรับพัฒนาบน macOS) สถานะทั้งหมดเก็บในไฟล์ SQLite ไฟล์เดียว และการสำรองข้อมูลไฟล์นี้ก็คือขั้นตอนทั้งหมด",
      fi: "Yhdellä komennolla omalle koneelle (tuotantiskripti Ubuntu 22.04:lle, kehitysskripti macOS:lle); koko tila on yhdessä SQLite-tiedostossa, ja sen varmuuskopiointi on koko toimenpide.",
      uk: "Одна команда на власну машину (продакшн-скрипт для Ubuntu 22.04, скрипт розробки для macOS); усе стан лежить в одному файлі SQLite, і резервне копіювання цього файла — вся процедура.",
      bg: "Една команда към собствения ти компютър (производствен скрипт за Ubuntu 22.04, скрипт за разработка за macOS); цялото състояние е в един файл SQLite, и архивирането на този файл е цялата процедура.",
      tr: "Kendi makinene tek komutla kurulum (Ubuntu 22.04 için üretim betiği, macOS için geliştirme betiği); bütün durum tek bir SQLite dosyasında toplanır ve o dosyanın yedeğini almak tüm prosedürdür.",
      hu: "Egy parancs a saját gépre (telepítő szkript Ubuntu 22.04-hez, fejlesztői szkript macOS-hez); minden állapot egyetlen SQLite fájlban van, és ennek a fájlnak a mentése az egész eljárás.",
    },
    official: {
      en: "No self-hosting option; relationships and content live in the operator's data centre.",
      ru: "Варианта самостоятельного хостинга нет; связи и контент живут в дата-центре оператора.",
      de: "Keine Selbsthosting-Option; Beziehungen und Inhalte liegen im Rechenzentrum des Betreibers.",
      fr: "Aucune option d'auto-hébergement ; les relations et le contenu résident dans le centre de données de l'opérateur.",
      it: "Nessuna opzione di self-hosting; le relazioni e i contenuti stanno nel data center dell'operatore.",
      nl: "Geen mogelijkheid tot self-hosting; relaties en inhoud staan in het datacenter van de exploitant.",
      cs: "Žádná možnost vlastního hostingu; vztahy i obsah sídlí v datovém centru provozovatele.",
      "zh-Hans": "没有自托管选项，账号关系与内容都存在运营方机房。",
      "zh-Hant": "沒有自託管選項，帳號關係與內容都存在營運方機房。",
      es: "No hay opción de autoalojamiento; las relaciones y el contenido residen en el centro de datos del operador.",
      pl: "Brak opcji własnego hostingu; relacje i treści znajdują się w centrum danych operatora.",
      ja: "自前運用の選択肢はなく、関係もコンテンツも運営者のデータセンターにあります。",
      th: "ไม่มีตัวเลือกให้โฮสต์เอง ความสัมพันธ์และเนื้อหาจึงอยู่ในศูนย์ข้อมูลของผู้ให้บริการ",
      fi: "Ei omaa hostausvaihtoehtoa; siteet ja sisältö ovat operaattorin tietokeskuksessa.",
      uk: "Варіанту власного хостингу немає; зв'язки та контент живлять у дата-центрі оператора.",
      bg: "Няма опция за собствено хостиране; връзките и съдържанието са в data center на оператора.",
      tr: "Kendi sunucunda barındırma seçeneği yok; ilişkiler de içerik de işletenin veri merkezinde durur.",
      hu: "Nincs lehetőség saját szerveren üzemeltetni; a kapcsolatok és a tartalom az üzemeltető adatközpontjában vannak.",
    },
    bot: {
      en: "The business backend can be self-hosted, while sessions, identity and message transport still pass through the platform.",
      ru: "Бизнес-бэкенд можно разместить у себя, но сессии, идентификация и передача сообщений всё равно идут через платформу.",
      de: "Das Business-Backend lässt sich selbst hosten, während Sitzungen, Identität und Nachrichtentransport weiterhin über die Plattform laufen.",
      fr: "Le back-end métier peut être auto-hébergé, tandis que les sessions, l'identité et le transport des messages passent toujours par la plateforme.",
      it: "Il backend di business può essere self-hosted, mentre sessioni, identità e trasporto dei messaggi continuano a passare dalla piattaforma.",
      nl: "De business-backend kan zelf gehost worden, terwijl sessies, identiteit en berichtentransport alsnog via het platform lopen.",
      cs: "Obchodní backend lze hostovat sami, ale relace, totožnost i přenos zpráv stále procházejí platformou.",
      "zh-Hans": "业务后端可以自建，但会话、身份与消息传输仍然经过平台。",
      "zh-Hant": "業務後端可以自建，但工作階段、身分與訊息傳輸仍然經過平台。",
      es: "El backend de negocio puede autoalojarse, mientras que las sesiones, la identidad y el transporte de mensajes siguen pasando por la plataforma.",
      pl: "Backend biznesowy można hostować samodzielnie, ale sesje, tożsamość i przesyłanie wiadomości nadal idą przez platformę.",
      ja: "業務側のバックエンドは自前運用できますが、セッション・身元・メッセージ転送は依然としてプラットフォームを経由します。",
      th: "แบ็กเอนด์ของธุรกิจจะโฮสต์เองก็ได้ แต่เซสชัน ตัวระบุตัวตน และการส่งข้อความยังคงผ่านแพลตฟอร์ม",
      fi: "Business-backendin voi isännöidä itse, mutta istunnot, identiteetti ja viestiliikenne kulkevat silti alustan kautta.",
      uk: "Бізнес-бекенд можна розмістити у себе, але сесії, ідентифікація та передача повідомлень усе одно йдуть через платформу.",
      bg: "Бизнес бекендът може да се хостира самостоятелно, но сесиите, самоличността и преносът на съобщения пак минават през платформата.",
      tr: "İşin arka ucu kendi sunucunda barındırılabilir; ancak oturumlar, kimlik ve mesaj taşıma hâlâ platform üzerinden geçer.",
      hu: "Az üzleti backend saját gépen futtatható, de a munkamenetek, a személyazonosság és az üzenetátvitel továbbra is a platformon megy át.",
    },
  },
  {
    dimension: {
      en: "Cross-site tracking in embedded H5",
      ru: "Кросс-сайтовый трекинг во встроенном H5",
      de: "Seitenübergreifendes Tracking im eingebetteten H5",
      fr: "Suivi inter-sites dans le H5 intégré",
      it: "Tracciamento cross-site nell'H5 integrato",
      nl: "Domeinoverstijgend volgen in ingebedde H5",
      cs: "Sledování napříč weby ve vestavěném H5",
      "zh-Hans": "H5 跨站追踪防护",
      "zh-Hant": "H5 跨站追蹤防護",
      es: "Rastreo entre sitios en el H5 incrustado",
      pl: "Śledzenie między witrynami w osadzonym H5",
      ja: "埋め込み H5 でのサイト横断トラッキング",
      th: "การติดตามข้ามเว็บไซต์ใน H5 ที่ฝังอยู่",
      fi: "Sivustojen välinen seuranta upotetussa H5:ssä",
      uk: "Міжсайтовий трекінг у вбудованому H5",
      bg: "Междусайтово проследяване във вградения H5",
      tr: "Gömülü H5 içinde siteler arası izleme",
      hu: "Oldalak közti követés a beágyazott H5-ben",
    },
    self: {
      en: "The H5 page opens in an out-of-process browser session and identity travels only as a pairwise uid plus an HMAC-SHA256 signature valid for ±300 seconds; the signed preimage contains no hostname.",
      ru: "H5-страница открывается в браузерной сессии за пределами процесса, а идентификация передаётся только как попарный uid плюс подпись HMAC-SHA256 со сроком ±300 секунд; подписываемые данные не содержат имени хоста.",
      de: "Die H5-Seite öffnet in einer prozessfremden Browser-Sitzung, und die Identität wandert nur als paarweise uid plus eine HMAC-SHA256-Signatur mit ±300 Sekunden Gültigkeit; der signierte Urtext enthält keinen Hostnamen.",
      fr: "La page H5 s'ouvre dans une session navigateur hors processus et l'identité ne circule qu'en tant qu'uid par paire plus une signature HMAC-SHA256 valable ±300 secondes ; la pré-image signée ne contient aucun nom d'hôte.",
      it: "La pagina H5 si apre in una sessione del browser fuori processo e l'identità viaggia solo come uid a coppie più una firma HMAC-SHA256 valida ±300 secondi; la preimmagine firmata non contiene alcun nome host.",
      nl: "De H5-pagina opent in een browsersessie buiten het proces en identiteit reist alleen als een paarsgewijze uid plus een HMAC-SHA256-handtekening geldig voor ±300 seconden; de ondertekende pre-image bevat geen hostnaam.",
      cs: "Stránka H5 se otevírá v mimosprocesové relaci prohlížeče a identita putuje pouze jako párové uid plus podpis HMAC-SHA256 platný ±300 sekund; podepsaná preimage neobsahuje žádný hostname.",
      "zh-Hans": "H5 在进程外的浏览器会话打开，身份只靠成对 uid 与 ±300 秒内有效的 HMAC-SHA256 签名传递，签名原文里不含域名。",
      "zh-Hant": "H5 在程序外的瀏覽器工作階段開啟，身分只靠成對 uid 與 ±300 秒內有效的 HMAC-SHA256 簽章傳遞，簽章原文裡不含網域名稱。",
      es: "La página H5 se abre en una sesión del navegador fuera del proceso y la identidad viaja solo como un uid por par más una firma HMAC-SHA256 válida durante ±300 segundos; el preimagen firmado no contiene ningún nombre de host.",
      pl: "Strona H5 otwiera się w sesji przeglądarki poza procesem, a tożsamość wędruje wyłącznie jako identyfikator uid parami plus podpis HMAC-SHA256 ważny ±300 sekund; podpisywany ciąg nie zawiera nazwy hosta.",
      ja: "H5 ページはプロセス外のブラウザセッションで開かれ、身元はペア単位の uid と、±300 秒間有効な HMAC-SHA256 署名だけで伝わります。署名対象の文字列にホスト名は含まれません。",
      th: "หน้า H5 เปิดในซีสชันของเบราว์เซอร์ที่อยู่นอกโปรเซส และตัวระบุตัวตนส่งไปด้วย uid เฉพาะคู่กับลายเซ็น HMAC-SHA256 ที่มีอายุ ±300 วินาทีเท่านั้น ข้อความที่ถูกเซ็นไม่มีชื่อโฮสต์รวมอยู่",
      fi: "H5-sivu avautuu prosessin ulkopuolisessa selainistunnossa, ja identiteetti kulkee ainoastaan parittaisena uid:nä plus HMAC-SHA256-allekirjoituksena, joka on voimassa ±300 sekuntia; allekirjoitettu esikuva ei sisältää isäntänimeä.",
      uk: "H5-сторінка відкривається в позапроцесній сесії браузера, а ідентичність передається лише як попарний uid плюс підпис HMAC-SHA256 строком ±300 секунд; підписувані дані не містять назви хоста.",
      bg: "H5 страницата се отваря в браузърна сесия извън процеса, а самоличността пътува само като двойков uid плюс подпис HMAC-SHA256 с валидност ±300 секунди; подписаният предобраз не съдържа име на хост.",
      tr: "H5 sayfası süreç dışı bir tarayıcı oturumunda açılır ve kimlik yalnızca çift bazlı bir uid ile ±300 saniye geçerli bir HMAC-SHA256 imzası olarak dolaşır; imzalanan öncül resimde ana makine adı bulunmaz.",
      hu: "Az H5 oldal egy folyamaton kívüli böngésző-munkamenetben nyílik meg, és a személyazonosság csak egy páronkénti uid plusz ±300 másodpercig érvényes HMAC-SHA256-aláírás formájában utazik; az aláírt előképen nincs hosztnév.",
    },
    official: {
      en: "The in-app browser shares cookies and sign-in state with the rest of the platform, which is enough to link the same user.",
      ru: "Встроенный браузер делит cookies и состояние входа с остальной платформой, чего достаточно, чтобы связать одного и того же пользователя.",
      de: "Der In-App-Browser teilt Cookies und Anmeldezustand mit dem Rest der Plattform, was ausreicht, um denselben Nutzer zu verknüpfen.",
      fr: "Le navigateur intégré partage les cookies et l'état de connexion avec le reste de la plateforme, ce qui suffit pour rapprocher le même utilisateur.",
      it: "Il browser in-app condivide i cookie e lo stato di accesso con il resto della piattaforma, il che basta per collegare lo stesso utente.",
      nl: "De ingebouwde browser deelt cookies en aanmeldstatus met de rest van het platform, wat genoeg is om dezelfde gebruiker te koppelen.",
      cs: "Vestavěný prohlížeč sdílí cookies a stav přihlášení se zbytkem platformy, což stačí ke spojení stejného uživatele.",
      "zh-Hans": "内嵌浏览器与平台全站共用 Cookie 与登录态，页面可以据此关联同一个用户。",
      "zh-Hant": "內嵌瀏覽器與平台全站共用 Cookie 與登入狀態，頁面可以據此關聯同一個使用者。",
      es: "El navegador integrado comparte cookies y estado de sesión con el resto de la plataforma, lo cual basta para vincular al mismo usuario.",
      pl: "Wbudowana przeglądarka dzieli pliki cookie i stan zalogowania z resztą platformy, co wystarcza, aby powiązać tego samego użytkownika.",
      ja: "内蔵ブラウザは Cookie とログイン状態をプラットフォーム全体と共有しており、それだけで同一ユーザーを紐付けられてしまいます。",
      th: "เบราว์เซอร์ที่ฝังอยู่ใช้ Cookie และสถานะการเข้าสู่ระบบร่วมกับทั้งแพลตฟอร์ม ซึ่งมากพอที่จะระบุว่าเป็นผู้ใช้คนเดียวกัน",
      fi: "Sovelluksen sisäinen selain jakaa evästeet ja kirjautumistilan muun alustan kanssa, ja se riittää saman käyttäjän yhdistämiseen.",
      uk: "Вбудований браузер ділить cookie та стан входу з рештою платформи, чого достатньо, щоб пов'язати того самого користувача.",
      bg: "Вграденият браузър споделя бисквитки и състояние на влизане с останалата част от платформата, което е достатъчно да свърже един и същ потребител.",
      tr: "Uygulama içi tarayıcı, çerezleri ve oturum durumunu platformun geri kalanıyla paylaşır; bu, aynı kullanıcıyı eşleştirmek için yeter.",
      hu: "A beépített böngésző süteményeket és bejelentkezési állapotot oszt meg a platform többi részével, ami elég ugyanazon felhasználó összekapcsolásához.",
    },
    bot: {
      en: "Web authorisation reuses the platform sign-in, and the callback carries the same user identifier.",
      ru: "Веб-авторизация переиспользует вход в платформе, а обратный вызов несёт тот же идентификатор пользователя.",
      de: "Die Web-Authorisierung nutzt die Anmeldung der Plattform weiter, und der Callback trägt dieselbe Benutzerkennung.",
      fr: "L'autorisation web réutilise la connexion à la plateforme, et le rappel porte le même identifiant utilisateur.",
      it: "L'autorizzazione web riutilizza l'accesso della piattaforma, e il callback trasporta il medesimo identificativo utente.",
      nl: "Webautorisatie hergebruikt de aanmelding van het platform, en de callback draagt dezelfde gebruikersidentifier.",
      cs: "Webová autorizace znovu využívá přihlášení k platformě a callback nese ten samý identifikátor uživatele.",
      "zh-Hans": "网页授权沿用平台账号的登录态，回调里带着同一个用户标识。",
      "zh-Hant": "網頁授權沿用平台帳號的登入狀態，回呼裡帶著同一個使用者識別號。",
      es: "La autorización web reutiliza el inicio de sesión de la plataforma, y la devolución de llamada lleva el mismo identificador de usuario.",
      pl: "Autoryzacja WWW wykorzystuje ponownie zalogowanie do platformy, a wywołanie zwrotne niesie ten sam identyfikator użytkownika.",
      ja: "Web 認証はプラットフォームのログイン状態を使い回し、コールバックには同じユーザー識別子が載ります。",
      th: "การอนุญาตผ่านเว็บจะใช้สถานะเข้าสู่ระบบของแพลตฟอร์มต่อ และคำเรียกกลับจะพกตัวระบุผู้ใช้เดิมมาด้วย",
      fi: "Web-valtuutus käyttää alustan kirjautumistilaa uudelleen, ja takaisinkutsu sisältää saman käyttäjätunnisteen.",
      uk: "Веб-авторизація повторно використовує вхід до платформи, а зворотний виклик несе той самий ідентифікатор користувача.",
      bg: "Уеб оторизацията преизползва влизането в платформата, а обратното обаждане носи един и същ идентификатор на потребителя.",
      tr: "Web yetkilendirmesi platformun oturum açmasını yeniden kullanır ve geri çağrı aynı kullanıcı kimliğini taşır.",
      hu: "A webes hitelesítés újrafelhasználja a platform bejelentkezését, és a visszahívás ugyanazt a felhasználói azonosítót hordozza.",
    },
  },
  {
    dimension: {
      en: "Offline Bluetooth mesh",
      ru: "Bluetooth-сетка без сети",
      de: "Bluetooth-Mesh ohne Netz",
      fr: "Maille Bluetooth hors ligne",
      it: "Rete Bluetooth mesh offline",
      nl: "Bluetooth-mesh zonder verbinding",
      cs: "Bluetoothová mesh bez sítě",
      "zh-Hans": "离线蓝牙 Mesh 兼容",
      "zh-Hant": "離線藍牙 Mesh 相容",
      es: "Malla Bluetooth sin conexión",
      pl: "Sieć Bluetooth mesh bez łączności",
      ja: "オフラインの Bluetooth メッシュ",
      th: "เครือข่าย Bluetooth mesh แบบออฟไลน์",
      fi: "Bluetooth-mesh ilman yhteyttä",
      uk: "Bluetooth mesh без мережі",
      bg: "Bluetooth mesh без връзка",
      tr: "Çevrimdışı Bluetooth ağı",
      hu: "Bluetooth hálózat kapcsolat nélkül",
    },
    self: {
      en: "The client ships its own BLE mesh transport (Noise sessions, flooding and fragmentation all on-device), so nearby peers still form a net with neither cellular nor Wi-Fi.",
      ru: "В клиенте есть собственный BLE mesh-транспорт: сессии Noise, затопление и фрагментация обрабатываются на устройстве, поэтому соседние пиры образуют сеть даже без мобильной сети и Wi-Fi.",
      de: "Der Client bringt einen eigenen BLE-Mesh-Transport mit (Noise-Sitzungen, Fluten und Fragmentierung alles auf dem Gerät), sodass benachbarte Peers auch ohne Mobilfunk und Wi-Fi ein Netz bilden.",
      fr: "Le client embarque son propre transport BLE mesh : les sessions Noise, l'inondation et la fragmentation se font sur l'appareil, donc les pairs proches forment un réseau sans cellulaire ni Wi-Fi.",
      it: "Il client porta un proprio trasporto BLE mesh (sessioni Noise, flooding e frammentazione avvengono sul dispositivo), quindi i peer vicini formano una rete senza cellulare né Wi-Fi.",
      nl: "De client brengt een eigen BLE-mesh-transport mee (Noise-sessies, flooding en fragmentatie gebeuren op het apparaat), dus nabije peers vormen nog een netwerk zonder cellulariteit of Wi-Fi.",
      cs: "Klient má vlastní BLE mesh transport — relace Noise, flooding i fragmentace běží na zařízení — takže blízcí peerové vytvoří síť i bez mobilního data a Wi-Fi.",
      "zh-Hans": "客户端自带 BLE mesh 传输层（Noise 会话、泛洪与分片都在设备侧），没有蜂窝也没有 Wi-Fi 时仍能就近组网。",
      "zh-Hant": "客戶端自備 BLE mesh 傳輸層（Noise 工作階段、泛洪與分片都在裝置端），沒有行動網路也沒有 Wi-Fi 時仍能就近組網。",
      es: "El cliente incluye su propio transporte BLE mesh (las sesiones Noise, la inundación y la fragmentación ocurren en el dispositivo), así que los pares cercanos forman una red sin telefonía ni Wi-Fi.",
      pl: "Klient ma własny transport BLE mesh — sesje Noise, flooding i fragmentacja działają na urządzeniu — więc pobliskie węzły stworzą sieć nawet bez łączności komórkowej i Wi-Fi.",
      ja: "クライアントは BLE mesh の転送層を内蔵しており、Noise セッションもフラッディングも断片化も端末側で完結します。モバイル回線も Wi-Fi もない環境でも、近くのピア同士だけで網を組めます。",
      th: "ไคลเอนต์มีชั้นส่ง BLE mesh ในตัว (เซสชัน Noise การฟลัดและการแบ่งส่วนเกิดบนอุปกรณ์) เพื่อนบ้านใกล้เคียงจึงสร้างเครือข่ายได้แม้ไม่มีทั้งเครือข่ายมือถือและ Wi-Fi",
      fi: "Sovelluksessa on oma BLE-mesh-kuljetus (Noise-istunnot, tulvitus ja palastointi tapahtuvat laitteella), joten läheiset solmut muodostavat verkon ilman matkapuhelinverkkoa tai Wi-Fiä.",
      uk: "Клієнт постачається з власним BLE mesh-транспортом: сесії Noise, затоплення та фрагментація відбуваються на пристрої, тож сусідні піри утворять мережу навіть без стільникового зв'язку та Wi-Fi.",
      bg: "Клиентът носи собствен BLE mesh транспорт (Noise сесии, наводняване и фрагментация се извършват на устройството), така че близки пири образуват мрежа и без клетъчна, и без Wi-Fi.",
      tr: "İstemci kendi BLE ağı taşıma katmanıyla gelir (Noise oturumları, sel verme ve parçalama cihazın içinde yapılır), böylece yakındaki eşler hücresel ya da Wi-Fi olmadan da bir ağ kurar.",
      hu: "A kliens saját BLE mesh-átviteli réteggel érkezik (a Noise-munkamenetek, az áradás és a törédezés mind az eszközön fut), így a közeli csomópontok mobiladat és Wi-Fi nélkül is hálózatot alkotnak.",
    },
    official: {
      en: "Everything depends on reaching the operator's servers; offline, the feature set is gone.",
      ru: "Всё зависит от доступности серверов оператора; без сети функциональность исчезает.",
      de: "Alles hängt davon ab, die Server des Betreibers zu erreichen; ohne Netz ist der Funktionsumfang weg.",
      fr: "Tout dépend de l'atteinte des serveurs de l'opérateur ; hors ligne, le panel de fonctionnalités disparaît.",
      it: "Tutto dipende dal raggiungere i server dell'operatore; offline, la dotazione di funzioni scompare.",
      nl: "Alles hangt van het bereiken van de servers van de exploitant af; zonder verbinding is het functieaanbod weg.",
      cs: "Vše závisí na dosažitelnosti serverů provozovatele; bez sítě je funkcionalita ta tam.",
      "zh-Hans": "全部功能都依赖平台服务器在线，断网即不可用。",
      "zh-Hant": "所有功能都依賴平台伺服器連線，斷網即不可用。",
      es: "Todo depende de alcanzar los servidores del operador; sin conexión, el conjunto de funciones desaparece.",
      pl: "Wszystko zależy od dostępności serwerów operatora; bez łączności zestaw funkcji znika.",
      ja: "すべてが運営者のサーバーに到達できるかに掛かっており、オフラインでは機能ごと消えます。",
      th: "ทุกอย่างขึ้นอยู่กับการเข้าถึงเซิร์ฟเวอร์ของผู้ให้บริการ เมื่อออฟไลน์ชุดความสามารถก็ใช้ไม่ได้",
      fi: "Kaikki riippuu operaattorin palvelimille pääsystä; offline-tilassa toiminnallisuus katoaa.",
      uk: "Усе залежить від доступності серверів оператора; без мережі функціонал зникає.",
      bg: "Всичко зависи от достигането на сървърите на оператора; без връзка функционалността изчезва.",
      tr: "Her şey işletenin sunucularına ulaşmaya bağlıdır; çevrimdışıyken yetenek seti buhar olur.",
      hu: "Minden az üzemeltető szervereinek elérésétől függ; kapcsolat nélkül a funkciókészlet eltűnik.",
    },
    bot: {
      en: "A bot sends and receives over network requests, with no on-device fallback path.",
      ru: "Бот принимает и отправляет через сетевые запросы, запасного пути на устройстве нет.",
      de: "Ein Bot sendet und empfängt über Netzanfragen, ohne einen Ausweichpfad auf dem Gerät.",
      fr: "Un bot envoie et reçoit par requêtes réseau, sans aucun chemin de repli sur l'appareil.",
      it: "Un bot invia e riceve tramite richieste di rete, senza alcun percorso di riserva sul dispositivo.",
      nl: "Een bot verstuurt en ontvangt via netwerkaanvragen, zonder een alternatief pad op het apparaat.",
      cs: "Bot odesílá a přijímá přes síťové požadavky a na zařízení nemá žádnou náhradní cestu.",
      "zh-Hans": "bot 的收发本身就是网络请求，设备侧没有替代路径。",
      "zh-Hant": "bot 的收發本身就是網路請求，裝置端沒有替代路徑。",
      es: "Un bot envía y recibe mediante solicitudes de red, sin ninguna ruta alternativa en el dispositivo.",
      pl: "Bot wysyła i odbiera poprzez żądania sieciowe, bez żadnej zastępczej ścieżki na urządzeniu.",
      ja: "Bot の送受信そのものがネットワークリクエストであり、端末側に代替経路はありません。",
      th: "บอทส่งและรับผ่านคำขอเครือข่ายโดยตรง ไม่มีเส้นทางสำรองบนอุปกรณ์",
      fi: "Botin lähetys ja vastaanotto ovat verkkopyyntöjä, eikä laitteella ole varareittiä.",
      uk: "Бот надсилає та отримує через мережеві запити, запасного шляху на пристрої немає.",
      bg: "Ботът изпраща и получава чрез мрежови заявки, без алтернативен път на устройството.",
      tr: "Bir bot ağ istekleri üzerinden gönderir ve alır; cihazda yedek bir yol yoktur.",
      hu: "Egy bot hálózati kérésekkel küld és fogad, eszközoldali tartalék útvonal nélkül.",
    },
  },
];

const SOVEREIGNTY: readonly Localized<string>[] = [
  {
    en: "No global user ID: the contacts table holds only the node's local contact_id and the pairwise uid this gateway minted, and neither joins across service accounts.",
    ru: "Глобального ID пользователя нет: в таблице contacts лежат только локальный contact_id от узла и попарный uid, выпущенный этим шлюзом, и ни то, ни другое не сопоставляется между сервис-аккаунтами.",
    de: "Keine globale Benutzer-ID: die Tabelle contacts enthält nur die lokale contact_id des Nodes und die paarweise uid, die dieses Gateway ausstellte – keines von beiden lässt sich über Dienstekonten hinweg verknüpfen.",
    fr: "Pas d'identifiant utilisateur global : la table contacts ne contient que le contact_id local donné par le nœud et l'uid par paire frappé par cette passerelle, et aucun des deux ne se rapproche d'un compte de service à l'autre.",
    it: "Nessun ID utente globale: la tabella contacts contiene solo il contact_id locale fornito dal nodo e l'uid a coppie coniato da questo gateway, e nessuno dei due si incrocia tra account di servizio diversi.",
    nl: "Geen globale gebruikers-ID: de tabel contacts bevat alleen de lokale contact_id van de node en de paarsgewijze uid die deze gateway aanmaakte, en geen van beide laat zich over serviceaccounts heen koppelen.",
    cs: "Žádné globální ID uživatele: tabulka contacts obsahuje pouze lokální contact_id z uzlu a párové uid, které vydala tato brána, a ani jedno nejde propojit napříč servisními účty.",
    "zh-Hans": "没有全局用户 ID：contacts 表只有节点给的本地 contact_id 和本网关生成的成对 uid，两者都不能跨服务号关联。",
    "zh-Hant": "沒有全域使用者 ID：contacts 表只有節點給的本地 contact_id 和本閘道器產生的成對 uid，兩者都不能跨服務號關聯。",
    es: "Sin ID global de usuario: la tabla contacts solo contiene el contact_id local que da el nodo y el uid por par que acuñó este gateway, y ninguno de los dos se correlaciona entre cuentas de servicio.",
    pl: "Brak globalnego identyfikatora użytkownika: tabela contacts zawiera jedynie lokalny identyfikator contact_id z węzła oraz wydany przez tę bramę uid dla każdej pary, i żadnego z nich nie da się powiązać między kontami serwisowymi.",
    ja: "グローバルなユーザー ID はありません。contacts 表に入るのはノードが与えたローカルな contact_id と、このゲートウェイが発番したペア単位の uid だけで、いずれもサービスアカウントをまたいだ突合には使えません。",
    th: "ไม่มี ID ผู้ใช้ระดับสากล ตาราง contacts เก็บเฉพาะ contact_id ในเครื่องที่โหนดให้มากับ uid เฉพาะคู่ที่เกทเวย์นี้ออกให้ และทั้งสองอย่างนำไปเชื่อมโยงข้ามบัญชีบริการไม่ได้",
    fi: "Ei globaalia käyttäjätunnistetta: contacts-taulussa on vain solmun paikallinen contact_id ja tämän yhdyskänteen myöntämä parillinen uid, eikä kumpikaan yhdistä palvelutilien välillä.",
    uk: "Глобального ID користувача немає: таблиця contacts містить лише локальний contact_id від вузла та попарний uid, виданий цим шлюзом, і жоден із них не зіставляється між сервіс-акаунтами.",
    bg: "Няма глобален потребителски ID: таблицата contacts съдържа само локалния contact_id от възела и двойния uid, издаден от този гейтуейт, и нито единият от тях не може да свърже данните между акаунтите за услуги.",
    tr: "Genel kullanıcı kimliği yok: contacts tablosu yalnızca düğümün yerel contact_id değerini ve bu ağ geçidinin ürettiği çift bazlı uid değerini tutar; bunlardan hiçbiri hizmet hesapları arasında eşleştirilemez.",
    hu: "Nincs globális felhasználói azonosító: a contacts tábla csak a csomópont által adott helyi contact_id-t és az átjáró által kiállított, páronkénti uid-t tárolja, és egyik sem vonható össze különböző szolgáltatási fiókok között.",
  },
  {
    en: "A follower's session secret never appears in an API response: GET /api/v1/contacts deliberately omits secret_hex, because its only job is signing H5 callbacks.",
    ru: "Секрет сессии подписчика никогда не попадает в ответ API: GET /api/v1/contacts намеренно не возвращает secret_hex, потому что его единственная задача — подписывать обратные вызовы H5.",
    de: "Das Sitzungsgeheimnis eines Followers erscheint in keiner API-Antwort: GET /api/v1/contacts lässt secret_hex absichtlich weg, denn seine einzige Aufgabe ist das Signieren von H5-Callbacks.",
    fr: "Le secret de session d'un abonné n'apparaît jamais dans une réponse d'API : GET /api/v1/contacts omet volontairement secret_hex, car sa seule fonction est de signer les rappels H5.",
    it: "Il segreto di sessione di un follower non compare mai in una risposta API: GET /api/v1/contacts omette deliberatamente secret_hex, perché il suo unico compito è firmare i callback H5.",
    nl: "Het sessiegeheim van een volger verschijnt in geen enkele API-respons: GET /api/v1/contacts laat secret_hex opzettelijk weg, want zijn enige taak is het ondertekenen van H5-callbacks.",
    cs: "Tajemství relace odběratele se nikdy neobjeví v odpovědi API: GET /api/v1/contacts vědomě vynechává secret_hex, protože jeho jediným úkolem je podepisovat callbacky H5.",
    "zh-Hans": "粉丝的会话密钥不进任何接口响应：GET /api/v1/contacts 有意省略 secret_hex，它唯一的用途是签 H5 回调。",
    "zh-Hant": "粉絲的工作階段密鑰不進任何介面回應：GET /api/v1/contacts 刻意省略 secret_hex，它唯一的用途是簽 H5 回呼。",
    es: "El secreto de sesión de un seguidor nunca aparece en una respuesta de la API: GET /api/v1/contacts omite secret_hex a propósito, porque su única tarea es firmar las devoluciones de llamada H5.",
    pl: "Sekret sesji obserwującego nigdy nie pojawia się w odpowiedzi API: GET /api/v1/contacts celowo pomija secret_hex, bo jego jedynym zadaniem jest podpisywanie wywołań zwrotnych H5.",
    ja: "フォロワーのセッション秘密値は API のレスポンスに一切現われません。GET /api/v1/contacts は secret_hex を意図的に省略しています。この値の仕事は H5 コールバックの署名だけです。",
    th: "ความลับเซสชันของผู้ติดตามจะไม่ปรากฏในการตอบกลับของ API เลย GET /api/v1/contacts จะละ secret_hex ไว้โดยเจตนา เพราะหน้าที่เดียวของมันคือการเซ็นคำเรียกกลับ H5",
    fi: "Seuraajan istuntosalaisuus ei koskaan ilmesty API-vastaukseen: GET /api/v1/contacts jättää secret_hex:n tietoisesti pois, koska sen ainoa tehtävä on H5-takaisinkutsujen allekirjoittaminen.",
    uk: "Секрет сесії підписника ніколи не з'являється у відповіді API: GET /api/v1/contacts навмисно не віддає secret_hex, бо його єдине завдання — підписувати зворотні виклики H5.",
    bg: "Тайната на сесията на последовател никога не се появява в API отговор: GET /api/v1/contacts умишлено пропуска secret_hex, защото единствената ѝ работа е да подписва H5 обаждания.",
    tr: "Bir takipçinin oturum sırrı hiçbir API yanıtında görünmez: GET /api/v1/contacts bilerek secret_hex'i dışarıda bırakır, çünkü tek işi H5 geri çağırmalarını imzalamaktır.",
    hu: "Egy követő munkamenet-titka soha nem jelenik meg API-válaszban: a GET /api/v1/contacts szándékosan kihagyja a secret_hex-t, mert az egyetlen feladata a H5-visszahívások aláírása.",
  },
  {
    en: "A relay never sees channel plaintext: content is encrypted under the epoch key before publication, and a new key only travels inside the sealed box of a rotation frame.",
    ru: "Ретранслятор никогда не видит открытый текст канала: содержимое шифруется ключом epoch до публикации, а новый ключ идёт только внутри запечатанного конверта кадра ротации.",
    de: "Ein Relay sieht nie Klartext eines Kanals: Inhalte werden mit dem Epoch-Schlüssel vor der Veröffentlichung verschlüsselt, und ein neuer Schlüssel wandert nur im versiegelten Fach eines Rotationsrahmens.",
    fr: "Un relai ne voit jamais le texte en clair du canal : le contenu est chiffré sous la clé d'epoch avant publication, et une nouvelle clé ne circule que dans la boîte scellée d'une trame de rotation.",
    it: "Un relay non vede mai il testo in chiaro del canale: il contenuto è cifrato con la chiave epoch prima della pubblicazione, e una nuova chiave viaggia solo dentro la scatola sigillata di un frame di rotazione.",
    nl: "Een relay ziet nooit platte tekst van een kanaal: inhoud wordt met de epoch-sleutel vóór publicatie versleuteld, en een nieuwe sleutel reist alleen in het verzegelde vakje van een rotatieframe.",
    cs: "Relé nikdy nevidí otevřený text kanálu: obsah je šifrován klíčem epoch před zveřejněním a nový klíč putuje pouze uvnitř zapečetěné schránky rotačního rámu.",
    "zh-Hans": "中继侧看不到频道明文：内容在发布前就用 epoch key 加密，新钥匙只装在密封盒里随轮换帧走。",
    "zh-Hant": "中繼端看不到頻道明文：內容在發布前就用 epoch key 加密，新金鑰只裝在密封盒裡隨輪換幀走。",
    es: "Un relay nunca ve texto plano del canal: el contenido se cifra con la clave de epoch antes de publicarse, y una clave nueva solo viaja dentro de la caja sellada de un cuadro de rotación.",
    pl: "Przekaźnik nigdy nie widzi zwykłego tekstu kanału: treść jest szyfrowana kluczem epoch przed publikacją, a nowy klucz wędruje wyłącznie w zapieczętowanym pudełku ramki rotacji.",
    ja: "リレーはチャンネルの平文を一切見ません。内容は公開前に epoch key で暗号化され、新しい鍵はローテーションフレームの密封箱の中だけで運ばれます。",
    th: "รีเลย์จะไม่มีทางเห็นข้อความชัดเจนของช่องทาง เนื้อหาถูกเข้ารหัสด้วยคีย์ epoch ก่อนเผยแพร่ และคีย์ใหม่จะเดินทางเฉพาะภายในกล่องผนึกของเฟรมหมุนเวียนเท่านั้น",
    fi: "Välityssolmu ei näe kanavan selvää tekstiä koskaan: sisältö salataan epoch-avaimella ennen julkaisua, ja uusi avain kulkee ainoastaan kiertokehyksen sinetyn koteron sisällä.",
    uk: "Ретранслятор ніколи не бачить відкритого тексту каналу: вміст шифрується ключем epoch до публікації, а новий ключ подорожує лише всередині запечатаної коробки кадра ротації.",
    bg: "Ретранслаторът никога не вижда чист текст на канала: съдържанието се криптира с ключа на epoch преди публикуване, а нов ключ пътува само вътре в запечатаната кутия на кадъра за ротация.",
    tr: "Bir aktarıcı kanalın düz metnini asla görmez: içerik yayımlanmadan önce epoch anahtarıyla şifrelenir ve yeni anahtar yalnızca bir dönüşüm çerçevesinin mühürlü kutusunun içinde dolaşır.",
    hu: "Egy közvetítő soha nem látja a csatorna nyílt szövegét: a tartalmat az epoch-kulccsal titkosítják a közzététel előtt, és egy új kulcs csak a rotációs keret lepecsételt dobozában utazik.",
  },
];

const HELD: readonly Localized<string>[] = [
  {
    en: "The gateway is the channel's issuer, so it does hold that channel's Ed25519 identity key pair and every epoch key — a rotation manager cannot hand out the next key without them, and the comment in database.py says exactly that. “No content inspection by the server” bounds relays and other people's servers, not a merchant's view of its own data.",
    ru: "Шлюз является выпускающей стороной канала, поэтому он действительно хранит пару Ed25519-ключей идентификации этого канала и каждый ключ epoch — без них менеджер ротации не может выдать следующий ключ, и комментарий в database.py говорит ровно это. «Ноль доступа к содержимому на сервере» ограничивает ретрансляторы и чужие серверы, а не доступность данных самого продавца.",
    de: "Das Gateway ist der Aussteller des Kanals, deshalb hält es durchaus das Ed25519-Identitätsschlüsselpaar dieses Kanals und jeden Epoch-Schlüssel – ohne sie kann ein Rotationsverwalter den nächsten Schlüssel nicht ausgeben, und der Kommentar in database.py sagt genau das. „Keine Inhaltseinsicht durch den Server“ begrenzt Relays und fremde Server, nicht den Blick eines Händlers auf seine eigenen Daten.",
    fr: "La passerelle est l'émetteur du canal, donc elle détient bien la paire de clés d'identité Ed25519 de ce canal et chaque clé d'epoch — sans elles, un gestionnaire de rotation ne peut pas remettre la clé suivante, et le commentaire dans database.py dit exactement cela. « Aucune inspection du contenu par le serveur » borne les relais et les serveurs d'autrui, pas la vision d'un marchand sur ses propres données.",
    it: "Il gateway è l'emittente del canale, quindi detiene davvero la coppia di chiavi di identità Ed25519 di quel canale e ogni chiave epoch — senza di esse un gestore di rotazione non può emettere la chiave successiva, e il commento in database.py dice esattamente questo. «Nessuna ispezione del contenuto da parte del server» riguarda i relay e i server altrui, non la visibilità che il commerciante ha dei suoi dati.",
    nl: "De gateway is de uitgever van het kanaal, dus hij heeft inderdaad het Ed25519-identiteitssleutelpaar van dat kanaal en elke epoch-sleutel in bezit — zonder die kan een rotatiebeheerder de volgende sleutel niet uitgeven, en de commentaar in database.py zegt precies dat. “Geen inhoudsinspectie door de server” geldt voor relays en voor servers van anderen, niet voor het zicht van een handelaar op eigen gegevens.",
    cs: "Brána je vydavatelem kanálu, takže skutečně drží pár Ed25519 identity-key klíčů daného kanálu a každý klíč epoch — bez nich správce rotace nemůže vydat další klíč, a komentář v database.py říká přesně tohle. „Žádná inspekce obsahu na serveru“ se vztahuje na relé a cizí servery, nikoli na náhled prodejce do jeho vlastních dat.",
    "zh-Hans": "网关是频道的签发方，所以它确实持有该频道的 Ed25519 身份密钥对和每一个 epoch key —— 这是签发轮换的前提，database.py 的注释也是这么写的。「服务器零内容窥探」约束的是中继和别人的服务器，不是商家对自己那份数据的可见性。",
    "zh-Hant": "閘道器是頻道的簽發方，所以它確實持有該頻道的 Ed25519 身分金鑰對和每一個 epoch key —— 這是簽發輪換的前提，database.py 的註釋也是這麼寫的。「伺服器零內容窺探」約束的是中繼和別人的伺服器，不是商家對自己那份資料的可見性。",
    es: "El gateway es el emisor del canal, así que sí posee el par de claves de identidad Ed25519 de ese canal y cada clave de epoch — sin ellas un gestor de rotación no puede entregar la siguiente clave, y el comentario en database.py dice exactamente eso. «Sin inspección de contenido por parte del servidor» acota los relays y los servidores ajenos, no la visión que el comercio tiene de sus propios datos.",
    pl: "Brama jest wystawcą kanału, więc faktycznie przechowuje parę kluczy tożsamości Ed25519 tego kanału oraz każdy klucz epoch — bez nich zarządca rotacji nie wyda następnego klucza, i komentarz w database.py mówi dokładnie to. „Brak wglądu w treść po stronie serwera” dotyczy przekaźników i cudzych serwerów, a nie wglądu sprzedawcy we własne dane.",
    ja: "ゲートウェイはチャンネルの発行主体であるため、そのチャンネルの Ed25519 アイデンティティ鍵ペアとすべての epoch key を実際に保有しています。これらがなければローテーション管理は次の鍵を配れませんし、database.py のコメントもそう書いています。「サーバーは内容を覗かない」が縛るのはリレーと他人のサーバーであり、事業者が自分のデータを見られるかどうかではありません。",
    th: "เกทเวย์เป็นผู้ออกช่องทาง จึงถือคู่คีย์ตัวตน Ed25519 ของช่องถอนนั้นกับคีย์ epoch ทุกอันอย่างแท้จริง หากไม่มีคีย์เหล่านี้ ตัวจัดการการหมุนเวียนมอบคีย์ถัดไปไม่ได้ และคอมเมนต์ใน database.py ก็เขียนไว้เช่นนั้น ข้อจำกัด “เซิร์ฟเวอร์ไม่สอดส่องเนื้อหา” ผูกพันรีเลย์กับเซิร์ฟเวอร์ของคนอื่น ไม่ใช่การเข้าถึงข้อมูลของตัวร้านค้าเอง",
    fi: "Yhdyskäntä on kanavan liikkeeseenlaskija, joten se todella pitää hallussaan kyseisen kanavan Ed25519-identiteettivarmenneparin ja jokaisen epoch-avaimen — ilman niitä kierrättäjä ei voi antaa seuraavaa avainta, ja kommenti tiedostossa database.py sanoo juuri näin. ”Ei sisällön tarkastamista palvelimella” koskee välityssolmuja ja muiden palvelimia, ei kauppiaan näkymää omiin tietoihin.",
    uk: "Шлюз є емітентом каналу, тому він справді зберігає пару Ed25519-ключів ідентичності цього каналу та кожен ключ epoch — без них менеджер ротації не може видати наступний ключ, і коментар у database.py каже саме це. «Немає інспекції вмісту на сервері» обмежує ретранслятори та чужі сервери, а не доступ продавця до власних даних.",
    bg: "Гейтуейтът е издател на канала, затова наистина притежава двойката Ed25519 ключове за самоличност на този канал и всеки ключ на epoch — без тях управителят на ротацията не може да издаде следващия ключ, и коментарът в database.py казва точно това. „Без преглед на съдържанието от сървъра“ важи за ретранслаторите и за чуждите сървъри, а не за погледа на търговеца към собствените му данни.",
    tr: "Ağ geçidi kanalın düzenleyicisidir, dolayısıyla o kanalın Ed25519 kimlik anahtar çiftini ve her epoch anahtarını gerçekten elinde tutar — bunlar olmadan bir dönüşüm yöneticisi bir sonraki anahtarı dağıtamaz, ve database.py içindeki yorum da tam olarak bunu söylüyor. “Sunucu tarafından içerik denetimi yok” ifadesi aktarıcıları ve başkalarının sunucularını bağlar, tüccarın kendi verisine bakışını değil.",
    hu: "Az átjáró a csatorna kibocsátója, ezért valóban birtokában van az adott csatorna Ed25519 személyazonosító kulcspárjának és minden epoch-kulcsnak — ezek nélkül egy rotációkezelő nem adja ki a következő kulcsot, és a database.py kommentje ezt mondja. „A szerver nem vizsgálja a tartalmat“ a közvetítőkre és mások szervereire vonatkozik, nem arra, amit a kereskedő a saját adatairól lát.",
  },
];

function Connector({ label, tone }: { label: string; tone: "brand" | "mesh" }): ReactElement {
  const stroke = tone === "brand" ? "text-brand-soft" : "text-mesh-soft";
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1 px-1 py-1 text-[10.5px] text-faint md:py-0">
      <svg aria-hidden viewBox="0 0 88 12" className={`h-3 w-full max-w-[88px] ${stroke}`}>
        <line x1="0" y1="6" x2="88" y2="6" stroke="currentColor" strokeWidth="1" strokeDasharray="5 4" />
        <path d="M88 2 L80 6 L88 10 Z" fill="currentColor" />
        <path d="M0 2 L8 6 L0 10 Z" fill="currentColor" />
      </svg>
      {/* nowrap only where there is room for it: at 320px the ru label is wider than the track. */}
      <span className="text-center [overflow-wrap:anywhere] sm:whitespace-nowrap">{label}</span>
    </div>
  );
}

export function ArchitectureComparison(): ReactElement {
  const { locale } = useLocale();

  return (
    <>
      {/* ── 五大技术特点 ─────────────────────────────────────────────────── */}
      <section id="features" aria-label={pick(ARCH.titleFeatures, locale)} className="py-16 sm:py-20">
        <div className="section-wrap">
          <SectionHeading
            eyebrow={ARCH.eyebrowFeatures}
            title={ARCH.titleFeatures}
            subtitle={ARCH.subFeatures}
          />

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.index} className="animate-rise-in">
                <article className="glass glass-hover flex h-full flex-col gap-3 p-5">
                  <header className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className={`font-mono text-[13px] font-semibold ${
                        f.tone === "brand" ? "text-brand-soft" : "text-mesh-soft"
                      }`}
                    >
                      {f.index}
                    </span>
                    <h3 className="text-[15.5px] font-semibold leading-snug text-white sm:text-[17px]">
                      {pick(f.title, locale)}
                    </h3>
                  </header>

                  <p className="text-[13px] leading-relaxed text-mute">{pick(f.hook, locale)}</p>

                  <ul className="flex flex-col gap-2 text-[12px] leading-relaxed text-faint">
                    {f.facts.map((fact, i) => (
                      <li key={`${f.index}-${i}`} className="flex gap-2">
                        <span className="mt-[7px] shrink-0">
                          <StatusDot tone={f.tone} />
                        </span>
                        <span>{pick(fact, locale)}</span>
                      </li>
                    ))}
                  </ul>

                  <footer className="hairline-top mt-auto flex items-center gap-2 pt-3">
                    <code className="chip font-mono text-[10.5px] text-[#d7d7ea]">{f.chip}</code>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 双核架构 + 生态对比 ──────────────────────────────────────────── */}
      <section
        id="architecture"
        aria-label={pick(ARCH.titleArchitecture, locale)}
        className="py-16 sm:py-20"
      >
        <div className="section-wrap">
          <SectionHeading
            eyebrow={ARCH.eyebrowArchitecture}
            title={ARCH.titleArchitecture}
            subtitle={ARCH.subArchitecture}
          />

          <div className="glass mt-10 p-5 sm:p-7">
            <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.45fr)_auto_minmax(0,1fr)]">
              {/* client */}
              <div className="glass-inset flex flex-col gap-2 p-4">
                <p className="eyebrow text-mesh-soft">{pick(ARCH.clientRole, locale)}</p>
                <p className="text-[14px] font-semibold text-white">{CLIENT_TITLE}</p>
                <p className="text-[11.5px] leading-relaxed text-faint">
                  {pick(ARCH.clientFacts, locale)}
                </p>
              </div>

              <Connector label={pick(ARCH.linkClientGateway, locale)} tone="mesh" />

              {/* gateway */}
              <div className="glass-inset flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="eyebrow">{pick(ARCH.gatewayTitle, locale)}</p>
                  <code className="font-mono text-[11px] text-faint">{ADMIN_CONSOLE_URL}</code>
                </div>
                <p className="text-[11.5px] leading-relaxed text-faint">
                  {pick(ARCH.gatewayFacts, locale)}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-lg border border-brand/35 bg-brand/10 p-3">
                    <p className="text-[12px] font-semibold text-white">
                      {pick(ARCH.gatewayPluginLayer, locale)}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">
                      {pick(ARCH.gatewayPluginList, locale)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-hair bg-black/35 p-3">
                    <p className="text-[12px] font-semibold text-white">
                      {pick(ARCH.gatewayStore, locale)}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-faint">
                      {pick(ARCH.gatewayStoreList, locale)}
                    </p>
                  </div>
                </div>
              </div>

              <Connector label={pick(ARCH.linkGatewayNode, locale)} tone="brand" />

              {/* node */}
              <div className="glass-inset flex flex-col gap-2 p-4">
                <p className="eyebrow text-mesh-soft">{pick(ARCH.nodeTitle, locale)}</p>
                <code className="font-mono text-[11.5px] text-white">{NODE_WS_URL}</code>
                <p className="text-[11px] leading-snug text-faint">{pick(ARCH.nodeRole, locale)}</p>
                <p className="text-[11.5px] leading-relaxed text-faint">
                  {pick(ARCH.nodeFacts, locale)}
                </p>
              </div>
            </div>

            <p className="hairline-top mt-5 pt-4 text-[11.5px] leading-relaxed text-faint">
              {pick(ARCH.diagramCaption, locale)}
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <p className="eyebrow">{pick(ARCH.pathLegend, locale)}</p>
              <ul className="grid gap-2 sm:grid-cols-3">
                {PATHS.map((path, i) => (
                  <li
                    key={`path-${i}`}
                    className="glass-inset flex gap-2 p-3 text-[11.5px] leading-relaxed text-mute"
                  >
                    <span className="mt-[6px] shrink-0">
                      <StatusDot tone="brand" pulse />
                    </span>
                    <span>{pick(path, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* comparison table */}
          <div className="glass mt-6 p-5 sm:p-7">
            <h3 className="text-[15px] font-semibold text-white sm:text-[17px]">
              {pick(ARCH.tableHeading, locale)}
            </h3>
            <div className="no-scrollbar mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-[12px] leading-relaxed">
                <caption className="pb-4 text-left align-top text-[11.5px] leading-relaxed text-faint">
                  {pick(ARCH.tableCaption, locale)}
                </caption>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="w-[150px] border-b border-hair pb-2 pr-4 text-left align-bottom text-[11px] font-semibold uppercase tracking-wider text-brand-soft"
                    >
                      {pick(ARCH.colDimension, locale)}
                    </th>
                    <th
                      scope="col"
                      className="border-b border-brand/45 pb-2 pr-4 text-left align-bottom text-[12.5px] font-semibold text-white"
                    >
                      {pick(ARCH.colSelf, locale)}
                    </th>
                    <th
                      scope="col"
                      className="border-b border-hair pb-2 pr-4 text-left align-bottom text-[12.5px] font-medium text-mute"
                    >
                      {pick(ARCH.colOfficial, locale)}
                    </th>
                    <th
                      scope="col"
                      className="border-b border-hair pb-2 text-left align-bottom text-[12.5px] font-medium text-mute"
                    >
                      {pick(ARCH.colBot, locale)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, i) => (
                    <tr key={`row-${i}`}>
                      <th
                        scope="row"
                        className="border-b border-hair py-3.5 pr-4 text-left align-top text-[12px] font-semibold text-white"
                      >
                        {pick(row.dimension, locale)}
                      </th>
                      <td className="border-b border-hair py-3.5 pr-4 align-top text-mesh-soft">
                        {pick(row.self, locale)}
                      </td>
                      <td className="border-b border-hair py-3.5 pr-4 align-top text-mute">
                        {pick(row.official, locale)}
                      </td>
                      <td className="border-b border-hair py-3.5 align-top text-mute">
                        {pick(row.bot, locale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* data sovereignty */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="glass-inset p-5">
              <h3 className="text-[14px] font-semibold text-white sm:text-[15.5px]">
                {pick(ARCH.sovereigntyHeading, locale)}
              </h3>
              <p className="eyebrow mt-2">{pick(ARCH.sovereigntyKept, locale)}</p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {SOVEREIGNTY.map((item, i) => (
                  <li
                    key={`sov-${i}`}
                    className="flex gap-2 text-[12px] leading-relaxed text-mute"
                  >
                    <span className="mt-[6px] shrink-0">
                      <StatusDot tone="mesh" />
                    </span>
                    <span>{pick(item, locale)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-inset border-warn/35 p-5">
              <p className="eyebrow text-warn">{pick(ARCH.sovereigntyHeld, locale)}</p>
              {HELD.map((item, i) => (
                <p
                  key={`held-${i}`}
                  className="mt-3 flex gap-2 text-[12px] leading-relaxed text-mute"
                >
                  <span className="mt-[6px] shrink-0">
                    <StatusDot tone="warn" />
                  </span>
                  <span>{pick(item, locale)}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
