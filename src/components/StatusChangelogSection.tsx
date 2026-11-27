"use client";

import { type ReactElement } from "react";
import { pick, useCopy, type Localized } from "@/lib/i18n";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";

/**
 * 状态与更新日志 — section `changelog`.
 *
 * The honesty contract for this section is narrow on purpose: there is no status
 * page, no uptime feed and no analytics behind this project, so nothing here may
 * look like a live indicator. Every tile is a *quoted* property of the two
 * repositories, read on 2026-11-26, and the commands that re-derive the counts are
 * printed next to them. The changelog contains only commits that exist — the
 * backend has no CHANGELOG file, so its history is the git log itself. The last
 * block is a gap register: things v1.0.0 does not do, with no date attached.
 */

/** Date the values below were read out of both checkouts. Locale-free. */
const SNAPSHOT_DATE = "2026-11-26";

type Stat = {
  readonly key: string;
  readonly value: string;
  readonly source: string;
  readonly caption: Localized<string>;
};

type Entry = {
  readonly key: string;
  readonly hash: string | null;
  readonly date: string;
  readonly type: string;
  readonly subject: string;
  readonly feature: boolean;
  readonly marker?: Localized<string>;
  readonly what: Localized<string>;
};

type Group = {
  readonly date: string;
  readonly entries: readonly Entry[];
};

/* ─────────────────────────────────────────────────────────────────────────
 * 1. Section heading
 * ───────────────────────────────────────────────────────────────────────── */

const EYEBROW: Localized<string> = {
  en: "Status & changelog",
  ru: "Статус и журнал изменений",
  de: "Status & Änderungsprotokoll",
  fr: "Statut et journal des modifications",
  it: "Stato e registro delle modifiche",
  nl: "Status en wijzigingslogboek",
  cs: "Stav a protokol změn",
  "zh-Hans": "状态与更新日志",
  "zh-Hant": "狀態與更新日誌",
  es: "Estado y registro de cambios",
  pl: "Status i dziennik zmian",
  ja: "ステータスと変更履歴",
  th: "สถานะและบันทึกการเปลี่ยนแปลง",
  fi: "Tila ja muutoshistoria",
  uk: "Статус і журнал змін",
  bg: "Статус и журнал на промените",
  tr: "Durum ve değişiklik günlüğü",
  hu: "Állapot és változásnapló",
  "pt-BR": "Status e changelog",
  ko: "상태 및 변경 이력",
  ar: "الحالة وسجل التغييرات",
};

const TITLE: Localized<string> = {
  en: "Status and changelog: what holds on 2026-11-26, and which commit made it hold",
  ru: "Статус и журнал изменений: что верно на 2026-11-26 и какой коммит это сделало",
  de: "Status und Änderungsprotokoll: Was am 2026-11-26 gilt und welcher Commit es bewirkt hat",
  fr: "Statut et journal : ce qui est vrai le 2026-11-26, et quel commit l’a rendu vrai",
  it: "Stato e registro: ciò che vale il 2026-11-26 e quale commit lo ha determinato",
  nl: "Status en logboek: wat op 2026-11-26 klopt en welke commit dat maakte",
  cs: "Stav a protokol: co platí k 2026-11-26 a který commit to způsobilo",
  "zh-Hans": "状态与更新日志：2026-11-26 哪些成立，以及是哪个提交让它成立",
  "zh-Hant": "狀態與更新日誌：2026-11-26 哪些成立，以及是哪個提交讓它成立",
  es: "Estado y registro: qué se cumple el 2026-11-26 y qué commit lo hizo posible",
  pl: "Status i dziennik zmian: co obowiązuje 2026-11-26 i który commit to sprawił",
  ja: "ステータスと変更履歴：2026-11-26 に何が成立していて、どのコミットがそうしたか",
  th: "สถานะและบันทึกการเปลี่ยนแปลง: อะไรใช้ได้ ณ 2026-11-26 และคอมมิตไหนที่ทำให้เป็นเช่นนั้น",
  fi: "Tila ja muutosloki: mikä pitää paikkansa 2026-11-26 ja mikä commit sen aiheutti",
  uk: "Статус і журнал змін: що справедливе 2026-11-26 і який коміт це зробив",
  bg: "Статус и журнал: какво важи на 2026-11-26 и кой комит го предизвика",
  tr: "Durum ve değişiklik günlüğü: 2026-11-26 itibarıyla ne geçerli ve hangi kayıt bunu sağladı",
  hu: "Állapot és változásnapló: 2026-11-26-én mi áll fenn, és melyik commit hozta létre",
  "pt-BR": "Status e changelog: o que vale em 2026-11-26 e qual commit fez isso valer",
  ko: "상태 및 변경 이력: 2026-11-26에 성립하는 것과, 그것을 성립시킨 커밋",
  ar: "الحالة وسجل التغييرات: ما يظل صحيحًا في 2026-11-26، وأي إيداع جعله كذلك",
};

const SUBTITLE: Localized<string> = {
  en: "No status light sits in this section, because there is nothing to light up: no status page, no uptime feed, no analytics. Everything below was read out of the two repositories on 2026-11-26, and the commands that re-derive the numbers are printed beside them.",
  ru: "В этом разделе нет индикатора живости, потому что показывать нечего: ни статус-страницы, ни мониторинга аптайма, ни аналитики. Всё ниже прочитано из двух репозиториев 2026-11-26, а команды, заново дающие эти числа, напечатаны рядом.",
  de: "In diesem Abschnitt gibt es keine Live-Anzeige, weil es nichts anzuzeigen gibt: keine Statusseite, kein Uptime-Feed, keine Analyse. Alles unten wurde am 2026-11-26 aus den zwei Repositories gelesen, und die Befehle, die die Zahlen erneut liefern, stehen daneben.",
  fr: "Cette section n’affiche aucun voyant, faute de quoi l’allumer : pas de page de statut, pas de flux d’uptime, pas d’analytics. Tout ce qui suit a été lu dans les deux dépôts le 2026-11-26, et les commandes qui re-derivent les chiffres sont imprimées à côté.",
  it: "In questa sezione non c’è alcuna spia, perché non c’è nulla da accendere: nessuna pagina di stato, nessun feed di uptime, nessuna analytics. Tutto quanto segue è stato letto dai due repository il 2026-11-26, e i comandi che ricavano di nuovo i numeri sono stampati accanto.",
  nl: "In deze sectie staat geen live-indicator, omdat er niets te tonen is: geen statuspagina, geen uptime-feed, geen analytics. Alles hieronder is op 2026-11-26 uit de twee repositories gelezen en de commando’s die de cijfers opnieuw opleveren staan ernaast.",
  cs: "V této sekci žádný živý ukazatel není, protože není co ukazovat: žádná stavová stránka, žádný feed uptime, žádná analytika. Vše níže bylo přečteno ze dvou repozitářů k 2026-11-26 a příkazy, které čísla znovu vyrobí, jsou vytištěny vedle.",
  "zh-Hans": "这一节没有状态灯，因为无可点亮：没有状态页、没有可用性数据源、没有统计。下面的内容都是 2026-11-26 从两个仓库读出来的，能重新得到这些数字的命令就印在旁边。",
  "zh-Hant": "這一節沒有狀態燈，因為無可點亮：沒有狀態頁、沒有可用性資料源、沒有統計。下面的內容都是 2026-11-26 從兩個倉庫讀出來的，能重新得到這些數字的指令就印在旁邊。",
  es: "En esta sección no hay indicador en vivo porque no hay nada que encender: sin página de estado, sin flujo de uptime, sin analítica. Todo lo siguiente se leyó de los dos repositorios el 2026-11-26, y los comandos que re-derivan las cifras están impresos junto a ellas.",
  pl: "W tej sekcji nie ma wskaźnika na żywo, bo nie ma czego świecić: brak strony statusu, brak kanału dostępności, brak analityki. Wszystko poniżej odczytano z dwóch repozytoriów 2026-11-26, a polecenia odtwarzające te liczby wydrukowano obok.",
  ja: "このセクションに稼働中ランプはありません。点灯させるものがないからです。ステータスページも、アップタイムのフィードも、アクセス解析もありません。以下はすべて 2026-11-26 に両リポジトリから読み出した内容で、同じ数字を出すコマンドをそばに載せています。",
  th: "ในส่วนนี้ไม่มีไฟสถานะ เพราะไม่มีอะไรให้จุดแสง: ไม่มีหน้าสถานะ ไม่มีฟีดอัปไทม์ ไม่มีการวิเคราะห์ทราฟฟิก ทุกข้อความด้านล่างอ่านออกจากสองรีโปเมื่อวันที่ 2026-11-26 และคำสั่งที่สร้างตัวเลขเหล่านั้นใหม่อีกครั้งพิมพ์ไว้ข้าง ๆ",
  fi: "Tässä osiossa ei ole reaaliaikaista valoa, koska ei ole mitä valaista: ei statussivua, ei uptime-syötettä, ei analytiikkaa. Kaikki alla on luettu kahdesta repositoriosta 2026-11-26, ja komennot, jotka lukemat tuottavat uudelleen, on julkaistu vieressä.",
  uk: "У цьому розділі немає індикатора, бо показувати нічого: немає статус-сторінки, немає потоку аптайму, немає аналітики. Усе нижче прочитано з двох репозиторіїв 2026-11-26, а команди, що відтворюють ці числа, надруковано поруч.",
  bg: "В тази секция няма индикатор, защото няма какво да се показва: няма статус страница, няма ъптайм поток, няма аналитика. Всичко по-долу е прочетено от двете хранилища на 2026-11-26, а командите, които възпроизвеждат числата, са отпечатани до тях.",
  tr: "Bu bölümde canlı durum ışığı yok, çünkü aydınlatılacak bir şey yok: durum sayfası yok, çalışma süresi akışı yok, analitik yok. Aşağıdaki her şey 2026-11-26’te iki depodan okundu ve bu sayıları yeniden üreten komutlar yanlarında basılı.",
  hu: "Ebben a fejezetben nincs élő jelző, mert nincs mit kijelezni: nincs statuszoldal, nincs uptime-hírcsatorna, nincs analitika. Az alábbiak mind a két repóból származnak 2026-11-26 keltezéssel, és a számokat újra előállító parancsok mellettük találhatók.",
  "pt-BR": "Não há nenhuma luz de status nesta seção, porque não há nada para acender: nenhuma página de status, nenhum feed de disponibilidade, nenhuma análise. Tudo abaixo foi lido dos dois repositórios em 2026-11-26, e os comandos que recalculam os números estão impressos ao lado deles.",
  ko: "이 섹션에는 상태 표시등이 없습니다. 표시할 것이 없기 때문입니다. 상태 페이지도, 업타임 피드도, 분석 도구도 없습니다. 아래의 모든 내용은 2026-11-26에 두 저장소에서 읽어 왔으며, 수치를 다시 도출하는 명령이 옆에 함께 표시되어 있습니다.",
  ar: "لا يوجد ضوء حالة في هذا القسم، لأنه لا شيء يُضاء: لا صفحة حالة، ولا تغذية لوقت التشغيل، ولا تحليلات. وكل ما أدناه قُرئ من المستودعين في 2026-11-26، والأوامر التي تعيد استخراج الأرقام مطبوعة إلى جانبها.",
};

const PILL_ASOF: Localized<string> = {
  en: "Read from the repositories on 2026-11-26",
  ru: "Прочитано из репозиториев 2026-11-26",
  de: "Am 2026-11-26 aus den Repositories abgelesen",
  fr: "Lu dans les dépôts le 2026-11-26",
  it: "Letto dai repository il 2026-11-26",
  nl: "Op 2026-11-26 uit de repositories gelezen",
  cs: "Načteno z repozitářů 2026-11-26",
  "zh-Hans": "2026-11-26 取自两个仓库",
  "zh-Hant": "2026-11-26 取自兩個倉庫",
  es: "Leído de los repositorios el 2026-11-26",
  pl: "Odczytano z repozytoriów 2026-11-26",
  ja: "2026-11-26 にリポジトリから読み出し",
  th: "อ่านจากรีโปเมื่อ 2026-11-26",
  fi: "Luettu repositorioista 2026-11-26",
  uk: "Прочитано з репозиторіїв 2026-11-26",
  bg: "Прочетено от хранилищата на 2026-11-26",
  tr: "2026-11-26’te depolardan okundu",
  hu: "A repókból leolvasva 2026-11-26-kor",
  "pt-BR": "Lido dos repositórios em 2026-11-26",
  ko: "2026-11-26에 저장소에서 읽음",
  ar: "مقروء من المستودعين في 2026-11-26",
};

const PILL_STATIC: Localized<string> = {
  en: "Nothing is polled, so nothing here is live",
  ru: "Ничего не опрашивается, поэтому ничего не в реальном времени",
  de: "Es wird nichts abgefragt, daher ist hier nichts live",
  fr: "Rien n’est interrogé, donc rien ici n’est en direct",
  it: "Nulla viene interrogato, quindi nulla qui è in tempo reale",
  nl: "Er wordt niets opgevraagd, dus niets hier is live",
  cs: "Nic se nedotazuje, takže nic zde není živé",
  "zh-Hans": "不做轮询，所以这里没有实时值",
  "zh-Hant": "不做輪詢，所以這裡沒有即時值",
  es: "Nada se sondea, así que nada aquí está en vivo",
  pl: "Nic nie jest odpytywane, więc nic tu nie jest na żywo",
  ja: "ポーリングしないので、ここはライブ表示ではありません",
  th: "ไม่มีการ poll จึงไม่มีค่าสดในนี้",
  fi: "Mitään ei kysellä, joten mikään täällä ei ole reaaliaikaista",
  uk: "Нічого не опитується, тож ніщо тут не в реальному часі",
  bg: "Нищо не се проверя периодично, следователно нищо тук не е на живо",
  tr: "Hiçbir şey yoklanmadığı için burada hiçbir şey canlı değil",
  hu: "Semmit nem kérdezünk le, így itt semmi nincs élőben",
  "pt-BR": "Nada é consultado periodicamente, então nada aqui é em tempo real",
  ko: "폴링하는 것이 없으므로 여기의 어떤 것도 실시간이 아닙니다",
  ar: "لا يجري استقصاء دوري لأي شيء، لذا لا شيء هنا مباشر",
};

const PILL_RECIPE: Localized<string> = {
  en: "Every count is published with its command",
  ru: "Каждый счётчик публикуется вместе с командой",
  de: "Jede Zahl wird mit ihrem Befehl veröffentlicht",
  fr: "Chaque compteur est publié avec sa commande",
  it: "Ogni conteggio è pubblicato con il suo comando",
  nl: "Elke telling wordt met het bijbehorende commando gepubliceerd",
  cs: "Každý počet je zveřejněn s příkazem",
  "zh-Hans": "每个计数都附带它的命令",
  "zh-Hant": "每個計數都附帶它的指令",
  es: "Cada recuento se publica con su comando",
  pl: "Każda liczba jest publikowana z poleceniem",
  ja: "すべての数を出すコマンドを併記",
  th: "ทุกตัวเลขมีคำสั่งกำกับ",
  fi: "Jokainen luku julkaistaan sitä vastaavan komennon kanssa",
  uk: "Кожен лічильник публікується з командою",
  bg: "Всяко число е публикувано с командата си",
  tr: "Her sayım, komutuyla birlikte yayımlanıyor",
  hu: "Minden szám a hozzá tartozó paranccsal jelenik meg",
  "pt-BR": "Cada contagem é publicada junto com o seu comando",
  ko: "모든 집계는 명령과 함께 게시됩니다",
  ar: "كل عدد يُنشر مع الأمر الخاص به",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 2. Status strip
 * ───────────────────────────────────────────────────────────────────────── */

const STATUS_TITLE: Localized<string> = {
  en: "Facts as of 2026-11-26",
  ru: "Факты на 2026-11-26",
  de: "Fakten zum 2026-11-26",
  fr: "Faits au 2026-11-26",
  it: "Fatti al 2026-11-26",
  nl: "Feiten per 2026-11-26",
  cs: "Fakta k 2026-11-26",
  "zh-Hans": "截至 2026-11-26 的事实",
  "zh-Hant": "截至 2026-11-26 的事實",
  es: "Hechos a 2026-11-26",
  pl: "Fakty na 2026-11-26",
  ja: "2026-11-26 時点の事実",
  th: "ข้อเท็จจริง ณ 2026-11-26",
  fi: "Faktat 2026-11-26",
  uk: "Факти станом на 2026-11-26",
  bg: "Факти към 2026-11-26",
  tr: "2026-11-26 itibarıyla gerçekler",
  hu: "Tények 2026-11-26-i állapottal",
  "pt-BR": "Fatos em 2026-11-26",
  ko: "2026-11-26 기준 사실",
  ar: "وقائع بتاريخ 2026-11-26",
};

const STATUS_NOTE: Localized<string> = {
  en: "Static HTML, static numbers. Nothing on this page knows whether a gateway is running right now; for that, ask your own host with GET /api/v1/status. The values below are properties of the source tree, checked on the date stated above.",
  ru: "Статичный HTML и статичные числа. Страница не знает, запущен ли шлюз прямо сейчас; для этого спросите свой собственный сервер через GET /api/v1/status. Значения ниже — свойства дерева исходников, проверенные на указанную выше дату.",
  de: "Statisches HTML, statische Zahlen. Nichts auf dieser Seite weiß, ob gerade ein Gateway läuft; dafür fragen Sie Ihren eigenen Host mit GET /api/v1/status. Die Werte unten sind Eigenschaften des Quellbaums, geprüft am oben genannten Datum.",
  fr: "HTML statique, chiffres statiques. Rien sur cette page ne sait si une passerelle tourne en ce moment ; pour cela, interrogez votre hôte avec GET /api/v1/status. Les valeurs ci-dessous sont des propriétés de l’arborescence source, vérifiées à la date indiquée plus haut.",
  it: "HTML statico, numeri statici. Nulla in questa pagina sa se un gateway è in esecuzione adesso; per questo chiedi al tuo host con GET /api/v1/status. I valori sotto sono proprietà dell’albero dei sorgenti, verificati alla data indicata sopra.",
  nl: "Statische html, statische cijfers. Niets op deze pagina weet of er nu een gateway draait; vraag dat uw eigen host met GET /api/v1/status. De waarden hieronder zijn eigenschappen van de bronboom, gecontroleerd op bovenstaande datum.",
  cs: "Statické HTML, statická čísla. Nic na této stránce neví, zda brána právě teď běží; na to se zeptejte vlastního serveru přes GET /api/v1/status. Hodnoty níže jsou vlastnosti stromu zdrojáku, zkontrolované k výše uvedenému datu.",
  "zh-Hans": "静态 HTML，静态数字。这一页不知道网关此刻有没有在跑；要问这个，请用 GET /api/v1/status 问你自己那台机器。下面的值都是源码树的属性，于上面写的日期核对过。",
  "zh-Hant": "靜態 HTML，靜態數字。這一頁不知道閘道此刻有沒有在跑；要問這個，請用 GET /api/v1/status 問你自己那台機器。下面的值都是原始碼樹的屬性，於上面寫的日期核對過。",
  es: "HTML estático, cifras estáticas. Nada en esta página sabe si una pasarela está corriendo ahora mismo; para eso consulte su propio host con GET /api/v1/status. Los valores de abajo son propiedades del árbol de código fuente, comprobadas en la fecha indicada arriba.",
  pl: "Statyczny HTML, statyczne liczby. Nic na tej stronie nie wie, czy brama działa w tej chwili; o to zapytaj własny serwer przez GET /api/v1/status. Poniższe wartości to właściwości drzewa źródeł, sprawdzone we wskazanej wyżej dacie.",
  ja: "静的な HTML と静的な数字です。このページはゲートウェイが今動いているかどうかを知りません。必要なら GET /api/v1/status でご自身のホストに聞いてください。以下の値はソースツリーの属性で、上に書いた日に確認したものです。",
  th: "เป็น HTML นิ่งและตัวเลขนิ่ง ไม่มีสิ่งใดในหน้าที่รู้ว่ามีเกตเวย์กำลังรันอยู่ตอนนี้หรือไม่ เรื่องนั้นให้ถามเครื่องของคุณเองด้วย GET /api/v1/status ค่าด้านล่างเป็นคุณสมบัติของต้นไม้ซอร์สที่ตรวจ ณ วันที่ระบุไว้ข้างบน",
  fi: "Staattinen HTML, staattiset luvut. Mikään tällä sivulla ei tiedä, onko gateway käynnissä juuri nyt; se selviää omalta palvelimelta: GET /api/v1/status. Alla olevat arvot ovat lähdepuun ominaisuuksia, tarkistettu yllä olevana päivänä.",
  uk: "Статичний HTML і статичні числа. Жодна деталь сторінки не знає, чи працює шлюз просто зараз; для цього запитайте власний хост через GET /api/v1/status. Наведені значення — властивості дерева коду, перевірені на зазначену вище дату.",
  bg: "Статичен HTML, статични числа. Нищо на тази страница не знае дали гейтуейт работи в момента; за това попитайте собствения си хост с GET /api/v1/status. Стойностите по-долу са свойства на дървото с код, проверени на посочената по-горе дата.",
  tr: "Statik HTML, statik sayılar. Bu sayfadaki hiçbir şey bir ağ geçidinin şu anda çalışıp çalışmadığını bilmez; bunun için kendi sunucunuza GET /api/v1/status ile sorun. Aşağıdaki değerler kaynak ağacının özellikleridir ve yukarıda belirtilen tarihte kontrol edilmiştir.",
  hu: "Statikus HTML, statikus számok. Az oldal nem tudja, fut-e éppen egy átjáró; ezért a saját kiszolgálóját kérdezze meg a GET /api/v1/status hívással. Az alábbi értékek a forrásfa tulajdonságai, a fent megadott napon ellenőrizve.",
  "pt-BR": "HTML estático, números estáticos. Nada nesta página sabe se um gateway está rodando agora; para isso, pergunte ao seu próprio host com GET /api/v1/status. Os valores abaixo descrevem propriedades da árvore de código-fonte e foram verificados na data indicada acima.",
  ko: "정적 HTML, 정적 수치입니다. 이 페이지의 어느 부분도 게이트웨이가 지금 실행 중인지 알지 못합니다. 그것은 GET /api/v1/status로 자체 호스트에 물어보십시오. 아래 값은 소스 트리의 속성이며, 위에 명시한 날짜에 확인한 것입니다.",
  ar: "HTML ثابت وأرقام ثابتة. لا شيء في هذه الصفحة يعرف ما إذا كانت بوابة ما تعمل الآن؛ ولذلك اسأل مضيفك عبر GET /api/v1/status. والقيم أدناه خصائص لشجرة المصدر، فُحصت في التاريخ المذكور أعلاه.",
};

const STATS: readonly Stat[] = [
  {
    key: "asof",
    value: SNAPSHOT_DATE,
    source: "popopx-service-suite + popopx-service-suite-web",
    caption: {
      en: "Date every value on this page was read from both checkouts",
      ru: "Дата, когда все значения страницы прочитаны из обеих рабочих копий",
      de: "Datum, an dem jeder Wert dieser Seite aus beiden Checkouts gelesen wurde",
      fr: "Date à laquelle chaque valeur de cette page a été lue dans les deux dépôts",
      it: "Data in cui ogni valore di questa pagina è stato letto dai due checkout",
      nl: "Datum waarop elke waarde van deze pagina uit beide checkouts werd gelezen",
      cs: "Datum, kdy každá hodnota této stránky přečtena z obou checkoutů",
      "zh-Hans": "本页所有读数从两份检出中读取的日期",
      "zh-Hant": "本頁所有讀數從兩份簽出中讀取的日期",
      es: "Fecha en que cada valor de esta página se leyó de ambos checkouts",
      pl: "Data, w którą każdą wartość z tej strony odczytano z obu kopii roboczych",
      ja: "このページのすべての値を両チェックアウトから読み出した日付",
      th: "วันที่อ่านค่าทุกตัวในหน้านี้จาก source checkout ทั้งสองชุด",
      fi: "Päivä, jolloin kaikki tämän sivun arvot luettiin molemmista checkouteista",
      uk: "Дата, коли кожне значення сторінки прочитано з двох робочих копій",
      bg: "Дата, на която всяка стойност на страницата е прочетена от двете работни копия",
      tr: "Bu sayfadaki her değerin iki depodan okunduğu tarih",
      hu: "Dátum, amikor az oldal minden értékét a két munkamásolatból olvastuk",
      "pt-BR": "Data em que cada valor desta página foi lido dos dois checkouts",
      ko: "이 페이지의 모든 값을 두 체크아웃에서 읽어 온 날짜",
      ar: "التاريخ الذي قُرئت فيه كل قيمة في هذه الصفحة من كلا النسختين المحليتين",
    },
  },
  {
    key: "gateway-version",
    value: "1.0.0",
    source: "gateway/app/__init__.py:12",
    caption: {
      en: "Gateway version, and the same string GET /api/v1/status returns",
      ru: "Версия шлюза, ту же строку возвращает GET /api/v1/status",
      de: "Gateway-Version; denselben String liefert GET /api/v1/status zurück",
      fr: "Version du gateway ; GET /api/v1/status renvoie la même chaîne",
      it: "Versione del gateway; la stessa stringa è restituita da GET /api/v1/status",
      nl: "Gateway-versie; dezelfde tekenreeks geeft GET /api/v1/status terug",
      cs: "Verze brány; stejný řetězec vrací GET /api/v1/status",
      "zh-Hans": "网关版本；GET /api/v1/status 返回同一个字符串",
      "zh-Hant": "閘道版本；GET /api/v1/status 回傳同一字串",
      es: "Versión de la pasarela; GET /api/v1/status devuelve la misma cadena",
      pl: "Wersja bramy; ten sam ciąg zwraca GET /api/v1/status",
      ja: "ゲートウェイのバージョン。GET /api/v1/status が返す文字列と同じです",
      th: "เวอร์ชันเกตเวย์ และได้สตริงเดียวกับที่ GET /api/v1/status ส่งกลับ",
      fi: "Gatewayn versio; GET /api/v1/status palauttaa saman merkkijonon",
      uk: "Версія шлюза; такий самий рядок повертає GET /api/v1/status",
      bg: "Версия на гейтуейта; същият низ връща GET /api/v1/status",
      tr: "Ağ geçidi sürümü; GET /api/v1/status aynı dizeyi döndürür",
      hu: "Az átjáró verziója; ugyanezt a karaktersort adja vissza a GET /api/v1/status",
      "pt-BR": "Versão do gateway, e a mesma string que GET /api/v1/status retorna",
      ko: "게이트웨이 버전이며, GET /api/v1/status가 반환하는 문자열과 같습니다",
      ar: "إصدار البوابة، وهو السلسلة نفسها التي يعيدها GET /api/v1/status",
    },
  },
  {
    key: "schema",
    value: "1",
    source: "gateway/app/database.py:49",
    caption: {
      en: "SCHEMA_VERSION: one database schema, no migration ladder behind it",
      ru: "SCHEMA_VERSION: одна схема базы, без лестницы миграций за ней",
      de: "SCHEMA_VERSION: ein Datenbankschema, keine Migrationsleiter dahinter",
      fr: "SCHEMA_VERSION : un seul schéma de base, pas d’escalier de migrations derrière",
      it: "SCHEMA_VERSION: uno schema del database, nessuna scala di migrazioni dietro",
      nl: "SCHEMA_VERSION: één databaseschema, geen migratieladder erachter",
      cs: "SCHEMA_VERSION: jediné schéma databáze, žádný žebřík migrací za ním",
      "zh-Hans": "SCHEMA_VERSION：只有一个数据库 schema，后面没有迁移阶梯",
      "zh-Hant": "SCHEMA_VERSION：只有一個資料庫 schema，後面沒有遷移階梯",
      es: "SCHEMA_VERSION: un esquema de base de datos, sin escalera de migraciones detrás",
      pl: "SCHEMA_VERSION: jeden schemat bazy danych, bez drabinki migracji za nim",
      ja: "SCHEMA_VERSION。データベースのスキーマは1つで、後ろに移行の連鎖はありません",
      th: "SCHEMA_VERSION: ส키มาฐานข้อมูลเดียว ไม่มีบันไดการ migrate อยู่ข้างหลัง",
      fi: "SCHEMA_VERSION: yksi tietokantaskeema, sen takana ei migraatiotikkaita",
      uk: "SCHEMA_VERSION: одна схема бази даних, без драбини міграцій позаду",
      bg: "SCHEMA_VERSION: една схема на базата данни, без стълба от миграции зад нея",
      tr: "SCHEMA_VERSION: tek veritabanı şeması, arkasında göç merdiveni yok",
      hu: "SCHEMA_VERSION: egy adatbázis-séma, nincs mögötte migrációs létra",
      "pt-BR": "SCHEMA_VERSION: um único esquema de banco de dados, sem escada de migrações por trás",
      ko: "SCHEMA_VERSION: 하나의 데이터베이스 스키마이며, 그 뒤에 마이그레이션 사다리는 없습니다",
      ar: "SCHEMA_VERSION: مخطط واحد لقاعدة البيانات، لا سلّم ترحيل خلفه",
    },
  },
  {
    key: "tag",
    value: "v1.0.0",
    source: "git tag · commit f727323",
    caption: {
      en: "The only release tag in the repository; it points at commit f727323, dated 2026-11-21",
      ru: "Единственный релизный тег в репозитории; он указывает на коммит f727323 от 2026-11-21",
      de: "Der einzige Release-Tag im Repository; er zeigt auf Commit f727323 vom 2026-11-21",
      fr: "Le seul tag de version du dépôt ; il pointe sur le commit f727323, daté du 2026-11-21",
      it: "L’unico tag di release nel repository; punta al commit f727323, datato 2026-11-21",
      nl: "Het enige release-label in de repository; het wijst naar commit f727323 van 2026-11-21",
      cs: "Jediný release tag v repozitáři; ukazuje na commit f727323 z 2026-11-21",
      "zh-Hans": "仓库里唯一的发布 tag；它指向 2026-11-21 的提交 f727323",
      "zh-Hant": "倉庫裡唯一的發布 tag；它指向 2026-11-21 的提交 f727323",
      es: "La única etiqueta de lanzamiento del repositorio; apunta al commit f727323, fechado el 2026-11-21",
      pl: "Jedyny tag wydania w repozytorium; wskazuje na commit f727323 z 2026-11-21",
      ja: "リポジトリで唯一のリリースタグ。2026-11-21 のコミット f727323 を指しています",
      th: "แท็กเวอร์ชันเดียวในรีโป ชี้ไปยังคอมมิต f727323 ลงวันที่ 2026-11-21",
      fi: "Repositorion ainoa julkaisutag; se osoittaa commitiin f727323, päivätty 2026-11-21",
      uk: "Єдиний релізний тег у репозиторії; вказує на коміт f727323 від 2026-11-21",
      bg: "Единият релийз маркер в хранилището; сочи към комит f727323 от 2026-11-21",
      tr: "Depodaki tek sürüm etiketi; 2026-11-21 tarihli f727323 kaydına işaret ediyor",
      hu: "A repó egyetlen kiadási tagje; a 2026-11-21-i f727323 commitre mutat",
      "pt-BR": "A única tag de versão no repositório; ela aponta para o commit f727323, datado de 2026-11-21",
      ko: "저장소의 유일한 릴리스 태그이며, 2026-11-21 날짜의 커밋 f727323을 가리킵니다",
      ar: "وسم الإصدار الوحيد في المستودع؛ يشير إلى الإيداع f727323 بتاريخ 2026-11-21",
    },
  },
  {
    key: "licence",
    value: "AGPL-3.0-only",
    source: "LICENSE",
    caption: {
      en: "Backend licence, written as the SPDX identifier the code ships with",
      ru: "Лицензия бэкенда, указана SPDX-идентификатором из комплекта кода",
      de: "Backend-Lizenz, als SPDX-Kennung geschrieben, so wie sie im Code liegt",
      fr: "Licence du backend, écrite comme l’identifiant SPDX livré avec le code",
      it: "Licenza del backend, scritta come identificatore SPDX distribuito con il codice",
      nl: "Backend-licentie, geschreven als de SPDX-identifier die bij de code hoort",
      cs: "Licence backendu, uvedená jako SPDX identifikátor dodávaný s kódem",
      "zh-Hans": "后端许可证，按随代码发布的 SPDX 标识符书写",
      "zh-Hant": "後端授權條款，依隨程式碼發布的 SPDX 識別碼書寫",
      es: "Licencia del backend, escrita como el identificador SPDX que acompaña al código",
      pl: "Licencja backendu zapisana identyfikatorem SPDX dostarczanym z kodem",
      ja: "バックエンドのライセンス。コードと一緒に配布される SPDX 識別子どおりに記載",
      th: "สัญญาอนุญาตแบ็กเอนด์ เขียนเป็นรหัส SPDX ที่มาพร้อมโค้ด",
      fi: "Backendin lisenssi, kirjoitettuna koodin mukana tulevalla SPDX-tunnisteella",
      uk: "Ліцензія бекенду, записана як SPDX-ідентифікатор із комплекту коду",
      bg: "Лиценз на бекенда, изписан като SPDX идентификаторът, който идва с кода",
      tr: "Arka uç lisansı, kodla birlikte gelen SPDX tanımlayıcısı olarak yazılmış",
      hu: "A backend licenc a kóddal együtt szállított SPDX-azonosítóval írva",
      "pt-BR": "Licença do backend, escrita como o identificador SPDX que acompanha o código",
      ko: "백엔드 라이선스이며, 코드에 포함된 SPDX 식별자 그대로 표기합니다",
      ar: "رخصة الواجهة الخلفية، مكتوبة بالمعرّف SPDX الذي تأتي به الشيفرة",
    },
  },
  {
    key: "plugins",
    value: "9",
    source: "gateway/app/plugins/__init__.py:89-170",
    caption: {
      en: "Native plugins in the package: nine in total, four on by default (ai_agent, alert_ops, privacy_sso, polls); the other five ship as real code but off",
      ru: "Нативные плагины в пакете: всего девять, четыре включены по умолчанию (ai_agent, alert_ops, privacy_sso, polls); остальные пять поставляются реальным кодом, но выключены",
      de: "Native Plugins im Paket: insgesamt neun, vier standardmäßig an (ai_agent, alert_ops, privacy_sso, polls); die anderen fünf kommen als echter Code, aber aus",
      fr: "Plugins natifs du paquet : neuf au total, quatre activés par défaut (ai_agent, alert_ops, privacy_sso, polls) ; les cinq autres arrivent comme code réel mais éteints",
      it: "Plugin nativi nel pacchetto: nove in tutto, quattro attivi per impostazione predefinita (ai_agent, alert_ops, privacy_sso, polls); gli altri cinque arrivano come codice reale ma spenti",
      nl: "Native plug-ins in het pakket: negen in totaal, vier standaard aan (ai_agent, alert_ops, privacy_sso, polls); de overige vijf komen als echte code maar uit",
      cs: "Nativní pluginy v balíčku: celkem devět, čtyři ve výchozím stavu zapnuté (ai_agent, alert_ops, privacy_sso, polls); zbylých pět přichází jako skutečný kód, ale vypnutých",
      "zh-Hans": "包内的原生插件共九个，四个默认开启（ai_agent、alert_ops、privacy_sso、polls）；其余五个是真实代码，但默认关闭",
      "zh-Hant": "套件內的原生外掛共九個，四個預設開啟（ai_agent、alert_ops、privacy_sso、polls）；其餘五個是真實程式碼，但預設關閉",
      es: "Complementos nativos del paquete: nueve en total, cuatro activos por defecto (ai_agent, alert_ops, privacy_sso, polls); los otros cinco llegan como código real pero apagados",
      pl: "Natywne wtyczki w pakiecie: dziewięć łącznie, cztery domyślnie włączone (ai_agent, alert_ops, privacy_sso, polls); pozostałe pięć to prawdziwy kod, lecz wyłączony",
      ja: "パッケージ内のネイティブプラグインは合計9つ。4つ（ai_agent、alert_ops、privacy_sso、polls）が既定でオン、残り5つは実装済みですが既定はオフです",
      th: "ปลั๊กอินเนทีฟในแพ็กเกจมีทั้งหมดเก้าตัว เปิดเป็นค่าเริ่มต้นสี่ตัว (ai_agent, alert_ops, privacy_sso, polls) อีกห้าตัวเป็นโค้ดจริงแต่ปิดอยู่",
      fi: "Paketin natiivit lisäosat: yhteensä yhdeksän, neljä oletuksena päällä (ai_agent, alert_ops, privacy_sso, polls); loput viisi toimitetaan oikeana koodina mutta pois päältä",
      uk: "Нативні плагіни в пакеті: усього девʼять, чотири типово увімкнені (ai_agent, alert_ops, privacy_sso, polls); решта пʼять постачаються реальним кодом, але вимкнені",
      bg: "Нативни плъгини в пакета: общо девет, четири са включени по подразбиране (ai_agent, alert_ops, privacy_sso, polls); останалите пет идват като истински код, но изключени",
      tr: "Paketteki yerleşik eklentiler: toplam dokuz, dördü varsayılan olarak açık (ai_agent, alert_ops, privacy_sso, polls); diğer beşi gerçek kod olarak geliyor ama kapalı",
      hu: "Natív bővítmények a csomagban: összesen kilenc, négy alapból bekapcsolva (ai_agent, alert_ops, privacy_sso, polls); a többi öt valódi kód, de kikapcsolva",
      "pt-BR": "Plug-ins nativos no pacote: nove no total, quatro ligados por padrão (ai_agent, alert_ops, privacy_sso, polls); os outros cinco vêm como código real, mas desligados",
      ko: "패키지의 네이티브 플러그인: 총 9개이며, 4개는 기본으로 켜져 있습니다(ai_agent, alert_ops, privacy_sso, polls). 나머지 5개는 실제 코드로 포함되어 있지만 꺼져 있습니다",
      ar: "الإضافات الأصلية في الحزمة: تسع إجمالًا، أربع منها مفعّلة افتراضيًا (ai_agent وalert_ops وprivacy_sso وpolls)؛ والخمس الأخرى تأتي شيفرة حقيقية لكنها معطّلة",
    },
  },
  {
    key: "routes-total",
    value: "129",
    source: "gateway/app/main.py + gateway/app/plugins/",
    caption: {
      en: "Route decorators registered in source: 59 on the core app plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 in the nine plugin files",
      ru: "Декораторы маршрутов, зарегистрированные в коде: 59 в ядре плюс 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 в девяти файлах плагинов",
      de: "Im Quellcode registrierte Route-Dekoratoren: 59 an der Core-App plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 in den neun Plugin-Dateien",
      fr: "Décorateurs de routes enregistrés dans le code : 59 sur le core plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 dans les neuf fichiers de plugin",
      it: "Decoratori di rotte registrati nel sorgente: 59 sul core più 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 nei nove file dei plugin",
      nl: "In de bron geregistreerde route-decorators: 59 op de core plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 in de negen plug-inbestanden",
      cs: "Dekorátory rout registrované ve zdroji: 59 na jádru plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 v devíti souborech pluginů",
      "zh-Hans": "源码注册的路由装饰器：核心应用 59 个，九个插件文件再加 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 个",
      "zh-Hant": "原始碼註冊的路由裝飾器：核心應用 59 個，九個外掛檔案再加 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 個",
      es: "Decoradores de rutas registrados en el código: 59 en la app core más 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 en los nueve archivos de complementos",
      pl: "Dekoratory tras zarejestrowane w kodzie: 59 w rdzeniu plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 w dziewięciu plikach wtyczek",
      ja: "ソースに登録されたルートデコレータの数。コアアプリ 59 に、9つのプラグインファイルの 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 を加えた総数です",
      th: "จำนวน decorator ของรูทที่ลงทะเบียนในซอร์ส: แกนหลัก 59 บวก 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 ในไฟล์ปลั๊กอินเก้าไฟล์",
      fi: "Lähteeseen rekisteröidyt reittikoristeet: 59 ytimessä plus 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 yhdeksässä lisäosatiedostossa",
      uk: "Декоратори маршрутів, зареєстровані в коді: 59 у ядрі плюс 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 у девʼяти файлах плагінів",
      bg: "Декоратори на пътища, регистрирани в кода: 59 върху ядрото плюс 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 в деветте файла с плъгини",
      tr: "Kaynakta kayıtlı rota dekoratörleri: çekirdek uygulamada 59, dokuz eklenti dosyasında 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70",
      hu: "A forrásban regisztrált útvonal-dekorátorok: a törzsön 59, plusz 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 a kilenc bővítményfájlban",
      "pt-BR": "Decoradores de rota registrados no código-fonte: 59 no app principal, mais 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 nos nove arquivos de plug-in",
      ko: "소스에 등록된 라우트 데코레이터: 코어 앱에 59개, 그리고 9개 플러그인 파일에 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70개",
      ar: "مزيّنات المسارات المسجلة في المصدر: 59 في التطبيق الأساسي إضافةً إلى 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 في ملفات الإضافات التسعة",
    },
  },
  {
    key: "routes-served",
    value: "89",
    source: "gateway/app/config.py:458-468",
    caption: {
      en: "Factory defaults serve 89 routes: 59 core plus 30 from the four plugins that start on (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); the other five stay off",
      ru: "Настройки по умолчанию обслуживают 89 маршрутов: 59 ядра плюс 30 от четырёх включённых плагинов (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); остальные пять выключены",
      de: "Die Standardwerte bedienen 89 Routen: 59 Core plus 30 aus den vier standardmäßig aktiven Plugins (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); die anderen fünf bleiben aus",
      fr: "Les valeurs d’usine servent 89 routes : 59 core plus 30 issues des quatre plugins actifs par défaut (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8) ; les cinq autres restent éteints",
      it: "I valori di fabbrica servono 89 rotte: 59 core più 30 dai quattro plugin attivi per impostazione predefinita (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); gli altri cinque restano spenti",
      nl: "Fabrieksinstellingen bedienen 89 routes: 59 core plus 30 van de vier standaard actieve plug-ins (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); de andere vijf blijven uit",
      cs: "Tovární nastavení obsluhují 89 rout: 59 jádra plus 30 ze čtyř pluginů zapnutých ve výchozím stavu (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); zbylých pět zůstává vypnutých",
      "zh-Hans": "出厂默认值实际应答 89 条路由：核心 59 条，加上四个默认开启插件带来的 30 条（ai_agent 6、alert_ops 10、privacy_sso 6、polls 8）；其余五个保持关闭",
      "zh-Hant": "出廠預設值實際應答 89 條路由：核心 59 條，加上四個預設開啟外掛帶來的 30 條（ai_agent 6、alert_ops 10、privacy_sso 6、polls 8）；其餘五個維持關閉",
      es: "Los valores de fábrica sirven 89 rutas: 59 core más 30 de los cuatro complementos activos por defecto (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); los otros cinco siguen apagados",
      pl: "Ustawienia fabryczne obsługują 89 tras: 59 rdzenia plus 30 od czterech wtyczek domyślnie włączonych (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); pozostałe pięć pozostaje wyłączonych",
      ja: "初期設定では 89 ルートに応答します。コア 59 に、既定で有効な4プラグイン（ai_agent 6、alert_ops 10、privacy_sso 6、polls 8）の 30 を加えた数で、残り5つはオフのままです",
      th: "ค่าเริ่มต้นจากโรงงานตอบ 89 รูท: แกนหลัก 59 บวก 30 จากปลั๊กอินสี่ตัวที่เปิดอยู่ (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8) ส่วนอีกห้าตัวยังปิดอยู่",
      fi: "Tehdasasetukset palvelevat 89 reittiä: 59 ytimestä plus 30 neljästä oletuksena päällä olevasta lisäosasta (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); loput viisi pysyvät pois päältä",
      uk: "Типові параметри обслуговують 89 маршрутів: 59 ядра плюс 30 від чотирьох увімкнених плагінів (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); решта пʼять лишаються вимкненими",
      bg: "Заводските стойности обслужват 89 пътя: 59 от ядрото плюс 30 от четирите включени плъгина (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); останалите пет остават изключени",
      tr: "Fabrika ayarları 89 rotaya yanıt verir: 59 çekirdek artı varsayılan açık dört eklentiden 30 (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); diğer beşi kapalı kalır",
      hu: "A gyári beállítások 89 útvonalat szolgálnak ki: 59 törzs plusz 30 a négy alapból bekapcsolt bővítményből (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); a másik öt kikapcsolva marad",
      "pt-BR": "Os padrões de fábrica servem 89 rotas: 59 principais mais 30 dos quatro plug-ins que iniciam ligados (ai_agent 6, alert_ops 10, privacy_sso 6, polls 8); os outros cinco permanecem desligados",
      ko: "출고 기본값으로 89개 라우트를 제공합니다: 코어 59개에 켜져 있는 4개 플러그인의 30개(ai_agent 6, alert_ops 10, privacy_sso 6, polls 8)를 더하며, 나머지 5개는 꺼진 상태로 남습니다",
      ar: "تخدم الإعدادات الافتراضية من المصنع 89 مسارًا: 59 مسارًا أساسيًا إضافةً إلى 30 من الإضافات الأربع التي تبدأ مفعّلة (ai_agent 6، وalert_ops 10، وprivacy_sso 6، وpolls 8)؛ وتبقى الخمس الأخرى معطّلة",
    },
  },
  {
    key: "routes-documented",
    value: "57",
    source: "gateway/app/main.py:3714 · :3736",
    caption: {
      en: "Documented core routes: two of the 59 carry include_in_schema=False, so 57 are listed even though all 59 are served",
      ru: "Документированные маршруты ядра: у двух из 59 стоит include_in_schema=False, поэтому в списке 57, хотя обслуживаются все 59",
      de: "Dokumentierte Core-Routen: zwei der 59 tragen include_in_schema=False, daher sind 57 gelistet, obwohl alle 59 bedient werden",
      fr: "Routes core documentées : deux des 59 portent include_in_schema=False, donc 57 sont listées alors que les 59 sont servies",
      it: "Rotte core documentate: due delle 59 hanno include_in_schema=False, quindi 57 sono elencate anche se tutte le 59 vengono servite",
      nl: "Gedocumenteerde core-routes: twee van de 59 dragen include_in_schema=False, dus 57 staan in de lijst terwijl alle 59 worden bediend",
      cs: "Dokumentované jádrové routy: dvě z 59 mají include_in_schema=False, takže 57 je vypsaných, i když se obsluhuje všech 59",
      "zh-Hans": "有文档的核心路由：59 个里有 2 个标了 include_in_schema=False，所以列出 57 个，而实际应答仍是 59 个",
      "zh-Hant": "有文件的核心路由：59 個裡有 2 個標了 include_in_schema=False，所以列出 57 個，而實際應答仍是 59 個",
      es: "Rutas core documentadas: dos de las 59 llevan include_in_schema=False, así que se listan 57 aunque se sirven las 59",
      pl: "Udokumentowane trasy rdzenia: dwie z 59 mają include_in_schema=False, więc wykazano 57, choć obsługiwane jest wszystkie 59",
      ja: "文書化されているコアルートの数。59 のうち 2 つに include_in_schema=False が付くため、提供は 59 すべてでも一覧は 57 です",
      th: "จำนวนรูทแกนหลักที่มีเอกสาร: 2 จาก 59 มี include_in_schema=False จึงจดรายการ 57 รูท แม้ให้บริการครบ 59 รูท",
      fi: "Dokumentoidut ydinreitit: kahdella 59:stä on include_in_schema=False, joten listattuja on 57 vaikka kaikki 59 palvellaan",
      uk: "Задокументовані маршрути ядра: два з 59 мають include_in_schema=False, тож у переліку 57, хоча обслуговуються всі 59",
      bg: "Документирани основни пътища: два от 59 носят include_in_schema=False, затова 57 са изброени, макар всичките 59 да се обслужват",
      tr: "Belgelenmiş çekirdek rotalar: 59ʼdan ikisinde include_in_schema=False var, bu yüzden 57 listeleniyor ama 59ʼu da sunuluyor",
      hu: "Dokumentált törzs-útvonalak: az 59-ből kettőn include_in_schema=False áll, ezért 57 szerepel a listán, pedig mind az 59 kiszolgálva van",
      "pt-BR": "Rotas principais documentadas: duas das 59 carregam include_in_schema=False, então 57 são listadas, embora todas as 59 sejam servidas",
      ko: "문서화된 코어 라우트: 59개 중 2개가 include_in_schema=False를 가지므로, 59개 모두 제공되지만 목록에는 57개만 표시됩니다",
      ar: "المسارات الأساسية الموثقة: مسارَان من أصل 59 يحملان include_in_schema=False، لذا تُسرد 57 رغم أن المسارات الـ59 كلها مخدومة",
    },
  },
  {
    key: "meters",
    value: "12",
    source: "gateway/app/billing_service.py:164-177",
    caption: {
      en: "POPX-CP compute-credit meters, each priced by its own POPOPX_CP_* key in the environment file",
      ru: "Счётчики POPX-CP, каждый со ценой в собственном ключе POPOPX_CP_* в файле окружения",
      de: "POPX-CP-Rechenkredit-Meter, je eines über einen eigenen POPOPX_CP_*-Schlüssel in der Umgebungsdatei bepreist",
      fr: "Compteurs de crédits de calcul POPX-CP, chacun tarifé par sa propre clé POPOPX_CP_* dans le fichier d’environnement",
      it: "Contatori di crediti di calcolo POPX-CP, ciascuno prezzato dalla propria chiave POPOPX_CP_* nel file d’ambiente",
      nl: "POPX-CP-computkredietmeters, elk geprijsd via een eigen POPOPX_CP_*-sleutel in het omgevingsbestand",
      cs: "Měridla výpočetních kreditů POPX-CP, každé oceněné vlastním klíčem POPOPX_CP_* v souboru prostředí",
      "zh-Hans": "POPX-CP 算力点计量表共 12 项，单价各由环境文件里自己的 POPOPX_CP_* 键决定",
      "zh-Hant": "POPX-CP 算力點計量表共 12 項，單價各由環境檔裡自己的 POPOPX_CP_* 鍵決定",
      es: "Medidores de créditos informáticos POPX-CP, cada uno con precio por su propia clave POPOPX_CP_* en el archivo de entorno",
      pl: "Liczniki kredytów obliczeniowych POPX-CP, każdy wyceniany własnym kluczem POPOPX_CP_* w pliku środowiska",
      ja: "POPX-CP 計算ポイントの計量表は12項目。単価は環境ファイル内のそれぞれの POPOPX_CP_* キーで決まります",
      th: "ตัวนับเครดิตการคำนวณ POPX-CP มี 12 รายการ แต่ละตัวตั้งราคาด้วยคีย์ POPOPX_CP_* ของตัวเองในไฟล์ environment",
      fi: "POPX-CP-laskentapistemittarit, kukin hinnoiteltu omalla POPOPX_CP_*-avaimella ympäristötiedostossa",
      uk: "Лічильники обчислювальних кредитів POPX-CP, кожен цінується власним ключем POPOPX_CP_* у файлі середовища",
      bg: "Броячи на изчислителни кредити POPX-CP, всеки оценен със собствен ключ POPOPX_CP_* в средата",
      tr: "POPX-CP hesaplama kredisi sayaçları; her biri ortam dosyasındaki kendi POPOPX_CP_* anahtarıyla fiyatlanır",
      hu: "POPX-CP számítási kreditmérők, mindegyik a saját POPOPX_CP_* kulcsával árazva a környezeti fájlban",
      "pt-BR": "Medidores de créditos de computação do POPX-CP, cada um com preço definido pela sua própria chave POPOPX_CP_* no arquivo de ambiente",
      ko: "POPX-CP 컴퓨트 크레딧 미터이며, 각각 환경 파일의 자체 POPOPX_CP_* 키로 가격이 정해집니다",
      ar: "عدّادات أرصدة الحوسبة POPX-CP، ولكل منها سعره بمفتاحه الخاص POPOPX_CP_* في ملف البيئة",
    },
  },
  {
    key: "commits",
    value: "14",
    source: "git -C ../popopx-service-suite log",
    caption: {
      en: "Commits in the backend repository — its entire public history, listed entry by entry below",
      ru: "Коммитов в репозитории бэкенда — вся публичная история, перечислена ниже построчно",
      de: "Commits im Backend-Repository — dessen komplette öffentliche Geschichte, unten Eintrag für Eintrag aufgelistet",
      fr: "Commits du dépôt backend : toute son historique public, détaillé entrée par entrée plus bas",
      it: "Commit nel repository backend: l’intera cronologia pubblicata, elencata voce per voce più sotto",
      nl: "Commits in de backend-repository — diens volledige publieke geschiedenis, hieronder item voor item opgesomd",
      cs: "Commity v backend repozitáři — celá jeho veřejná historie, níže položka po položce",
      "zh-Hans": "后端仓库的提交总数 —— 全部公开历史，下面逐条列出",
      "zh-Hant": "後端倉庫的提交總數 —— 全部公開歷史，下面逐條列出",
      es: "Commits en el repositorio del backend: todo su historial público, listado entrada por entrada más abajo",
      pl: "Commity w repozytorium backendu — cała jego publiczna historia, wypisana poniżej wpis po wpisie",
      ja: "バックエンドリポジトリのコミット数。公開されている履歴の全体を、下に1件ずつ載せています",
      th: "จำนวนคอมมิตในรีโปแบ็กเอนด์ — ประวัติสาธารณะทั้งหมด ถูกไล่เรียงรายการด้านล่าง",
      fi: "Commitit backend-repossa — sen koko julkinen historia, merkintä merkinnältä alla",
      uk: "Комізити у репозиторії бекенду — вся його публічна історія, нижче перелічена запис за записом",
      bg: "Комити в бекенд хранилището — цялата му публична история, изброена запис по запис по-долу",
      tr: "Arka uç deposundaki işlemler — tamamı açık geçmiş, aşağıda kayıt kayıt listelenmiş",
      hu: "Commitek a backend repóban — a teljes nyilvános előzmény, lent bejegyzésenként kilistázva",
      "pt-BR": "Commits no repositório do backend — todo o seu histórico público, listado entrada por entrada abaixo",
      ko: "백엔드 저장소의 커밋 — 전체 공개 이력이며, 아래에 항목별로 나열합니다",
      ar: "الإيداعات في مستودع الواجهة الخلفية — تاريخه العام بأكمله، مسرودة إيداعًا إيداعًا أدناه",
    },
  },
  {
    key: "languages",
    value: "21",
    source: "src/lib/i18n.tsx",
    caption: {
      en: "Portal languages: the 18 tags in the iOS client’s CFBundleLocalizations plus pt-BR, ko and ar",
      ru: "Языки портала: 18 тегов из CFBundleLocalizations клиента iOS плюс pt-BR, ko и ar",
      de: "Portal-Sprachen: die 18 Tags aus CFBundleLocalizations des iOS-Clients plus pt-BR, ko und ar",
      fr: "Langues du portail : les 18 tags de CFBundleLocalizations du client iOS, plus pt-BR, ko et ar",
      it: "Lingue del portale: i 18 tag di CFBundleLocalizations del client iOS più pt-BR, ko e ar",
      nl: "Portaltalen: de 18 tags uit CFBundleLocalizations van de iOS-cliënt plus pt-BR, ko en ar",
      cs: "Jazyky portálu: 18 tagů z CFBundleLocalizations iOS klienta plus pt-BR, ko a ar",
      "zh-Hans": "门户语言数：iOS 客户端 CFBundleLocalizations 里的 18 个标签，加上 pt-BR、ko、ar",
      "zh-Hant": "入口語言數：iOS 用戶端 CFBundleLocalizations 裡的 18 個標籤，加上 pt-BR、ko、ar",
      es: "Idiomas del portal: las 18 etiquetas de CFBundleLocalizations del cliente iOS, más pt-BR, ko y ar",
      pl: "Języki portalu: 18 tagów z CFBundleLocalizations klienta iOS plus pt-BR, ko i ar",
      ja: "ポータルの言語数です。iOS クライアントの CFBundleLocalizations の 18 タグに、pt-BR・ko・ar を加えた数です",
      th: "จำนวนภาษาของพอร์ทัล: 18 แท็กใน CFBundleLocalizations ของไคลเอนต์ iOS บวก pt-BR, ko และ ar",
      fi: "Portaalin kielet: iOS-asiakkaan CFBundleLocalizations-tagit (18) sekä pt-BR, ko ja ar",
      uk: "Мови порталу: 18 тегів із CFBundleLocalizations клієнта iOS плюс pt-BR, ko і ar",
      bg: "Езици на портала: 18-те етикета в CFBundleLocalizations на iOS клиента плюс pt-BR, ko и ar",
      tr: "Portal dilleri: iOS istemcisinin CFBundleLocalizations etiketlerindeki 18 dil ile pt-BR, ko ve ar",
      hu: "A portál nyelvei: az iOS ügyfél CFBundleLocalizations értékében lévő 18 tag, valamint a pt-BR, a ko és az ar",
      "pt-BR": "Idiomas do portal: as 18 etiquetas do CFBundleLocalizations do cliente iOS, mais pt-BR, ko e ar",
      ko: "포털 언어 수: iOS 클라이언트의 CFBundleLocalizations 태그 18개에 pt-BR, ko, ar을 더한 값",
      ar: "لغات البوابة: 18 وسمًا من CFBundleLocalizations في عميل iOS، إضافةً إلى pt-BR وko وar",
    },
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 3. Reproducibility — the page publishes numbers, so it publishes the recipe
 * ───────────────────────────────────────────────────────────────────────── */

const RECIPE_TITLE: Localized<string> = {
  en: "How each number was produced",
  ru: "Как получено каждое число",
  de: "Wie jede Zahl zustande kommt",
  fr: "Comment chaque chiffre a été produit",
  it: "Come è stato prodotto ogni numero",
  nl: "Hoe elk getal tot stand kwam",
  cs: "Jak vzniklo každé číslo",
  "zh-Hans": "每个数字是怎么得出来的",
  "zh-Hant": "每個數字是怎麼得出來的",
  es: "Cómo se obtuvo cada cifra",
  pl: "Skąd wzięła się każda liczba",
  ja: "各数字の出し方",
  th: "แต่ละตัวเลขได้มาอย่างไร",
  fi: "Miten kukin luku tuotettiin",
  uk: "Як отримане кожне число",
  bg: "Как е получено всяко число",
  tr: "Her sayı nasıl üretildi",
  hu: "Hogy készült minden egyes szám",
  "pt-BR": "Como cada número foi produzido",
  ko: "각 수치가 산출된 방식",
  ar: "كيف أُنتج كل رقم",
};

const RECIPE_LEDE: Localized<string> = {
  en: "A page that publishes counts owes the reader the way to check them. These commands run against the same tree this portal documents, from the portal repository root; the expected outputs sit in the comments. Nothing here reaches the network.",
  ru: "Страница, публикующая счётчики, должна давать читателю способ их проверить. Команды запускаются по тому же дереву, которое документировано здесь, из корня репозитория портала; ожидаемый вывод — в комментариях. Сеть не задействована.",
  de: "Eine Seite, die Zahlen publiziert, schuldet dem Leser den Weg, sie zu prüfen. Diese Befehle laufen gegen denselben Baum, den dieses Portal dokumentiert, aus dem Wurzelverzeichnis des Portal-Repositories; die erwarteten Ausgaben stehen in den Kommentaren. Ins Netz geht dabei nichts.",
  fr: "Une page qui publie des compteurs doit au lecteur de quoi les vérifier. Ces commandes s’exécutent sur l’arbre même que ce portail documente, depuis la racine du dépôt du portail ; les sorties attendues sont dans les commentaires. Rien ici ne touche le réseau.",
  it: "Una pagina che pubblica conteggi deve al lettore il modo di verificarli. Questi comandi girano sullo stesso albero che questo portale documenta, dalla radice del repository del portale; gli output attesi sono nei commenti. Nulla passa per la rete.",
  nl: "Een pagina die tellingen publiceert is de lezer de manier schuldig om ze te controleren. Deze commando’s draaien tegen dezelfde boom die dit portaal documenteert, vanuit de root van de portal-repository; de verwachte uitvoer staat in de commentaren. Niets hiervan gaat op netwerk.",
  cs: "Stránka, která zveřejňuje počty, dluží čtenáři způsob, jak je ověřit. Ty příkazy běží proti stromu, který tento portál dokumentuje, z kořene repozitáře portálu; očekávané výstupy jsou v komentářích. Nic z toho nejde po síti.",
  "zh-Hans": "一个公布计数的页面，欠读者一个核对方法。下面这些命令从门户仓库根目录出发，跑在本门户所记录的那份源码树上；预期输出写在注释里，整个过程不访问网络。",
  "zh-Hant": "一個公佈計數的頁面，欠讀者一個核對方法。下面這些指令從入口倉庫根目錄出發，跑在本入口所記錄的那份原始碼樹上；預期輸出寫在註釋裡，整個過程不存取網路。",
  es: "Una página que publica recuentos le debe al lector la forma de comprobarlos. Estos comandos corren sobre el mismo árbol que este portal documenta, desde la raíz del repositorio del portal; las salidas esperadas están en los comentarios. Nada aquí llega a la red.",
  pl: "Strona, która publikuje liczby, jest czytelnikowi winna sposób ich sprawdzenia. Te polecenia działają na tym samym drzewie, które ten portal dokumentuje, z katalogu głównego repozytorium portalu; oczekiwane wyniki są w komentarzach. Nic tu nie wychodzi do sieci.",
  ja: "件数を公開するページは、読者に検証方法を示す義務があります。以下のコマンドは、このポータルが対象にしているのと同じツリーに対して、ポータルのリポジトリのルートから動きます。期待される出力はコメントに書き、ネットワークには一切出かけません。",
  th: "หน้าที่ตีพิมพ์ตัวเลขย่อมติดหนี้ผู้อ่านด้วยวิธีตรวจเลขเหล่านั้น คำสั่งเหล่านี้รันกับต้นไม้ซอร์สชุดเดียวกับที่พอร์ทัลนี้บันทึกไว้ โดยเริ่มจากรากของรีโปพอร์ทัล ผลลัพธ์ที่คาดหวังเขียนไว้ในคอมเมนต์ และไม่มีส่วนใดแตะเครือข่าย",
  fi: "Sivu, joka julkaisee lukuja, velkaa lukijalle tavan tarkistaa ne. Nämä komennot ajetaan samaa puuta vasten, jota tämä portaali dokumentoi, portaalin repositoriossa juuresta. Odotetut tulokset ovat kommenteissa. Mikään ei kulje verkkoon.",
  uk: "Сторінка, що публікує лічби, винна читачеві спосіб їх перевірити. Ці команди запускаються проти того самого дерева, яке документує цей портал, з кореня репозиторію порталу; очікувані результати — у коментарях. Ніщо тут не виходить у мережу.",
  bg: "Страница, която публикува бройки, дължи на читателя начин да ги провери. Тези команди работят върху същото дърво, което този портал документира, от корена на хранилището на портала; очакваните изходи са в коментарите. Нищо не излиза в мрежата.",
  tr: "Sayım yayımlayan bir sayfa, okuyucuya bunları nasıl denetleyeceğini borçludur. Bu komutlar bu portalın belgelediği aynı ağaca, portal deposunun kökünden çalışır; beklenen çıktılar yorumlarda yazar. Buradaki hiçbir şey ağa ulaşmaz.",
  hu: "Egy oldal, amely számokat közöl, tartozik az ellenőrzés módjával is. Ezek a parancsok ugyanarra a fán futnak, amelyet ez a portál dokumentál, a portál repójának gyökeréből; a várt kimenetek a kommentekben vannak. Semmi sem érinti a hálózatot.",
  "pt-BR": "Uma página que publica contagens deve ao leitor a maneira de verificá-las. Estes comandos rodam contra a mesma árvore que este portal documenta, a partir da raiz do repositório do portal; as saídas esperadas ficam nos comentários. Nada aqui acessa a rede.",
  ko: "집계를 게시하는 페이지는 독자에게 그것을 확인할 방법을 빚지고 있습니다. 이 명령들은 이 포털이 문서화하는 것과 같은 트리를 대상으로, 포털 저장소 루트에서 실행합니다. 예상 출력은 주석에 들어 있습니다. 여기의 어떤 것도 네트워크에 접속하지 않습니다.",
  ar: "الصفحة التي تنشر أعدادًا تدين للقارئ بطريقة التحقق منها. وتُشغَّل هذه الأوامر على الشجرة نفسها التي توثّقها هذه البوابة، من جذر مستودع البوابة؛ والمخرجات المتوقعة موضوعة في التعليقات. ولا شيء هنا يصل إلى الشبكة.",
};

/** Locale-free: shell commands and file paths, byte-identical for every reader. */
const RECIPE_COMMANDS = `# Run from the portal repository root, with the two checkouts side by side.

# 1. Core route registrations. Prints 59.
grep -cE '^\\s+@app\\.(get|post|put|patch|delete)\\(' ../popopx-service-suite/gateway/app/main.py

# 2. Plugin route registrations. Prints 6, 10, 6, 8, 9, 12, 6, 6, 7 = 70.
for f in ai_agent_plugin alert_ops_plugin privacy_sso_plugin polls_plugin \\
         web3_bridge_plugin workflow_webhook_plugin carddav_connector \\
         caldav_connector slack_discord_plugin; do
  printf '%-24s' "$f"
  grep -cE '^\\s+@router\\.(get|post|put|patch|delete)\\(' "../popopx-service-suite/gateway/app/plugins/\${f}.py"
done

# 3. Backend history and tags. Prints the fourteen commits listed below, then v1.0.0.
git -C ../popopx-service-suite log --date=short --pretty='%h %ad %s'
git -C ../popopx-service-suite tag

# 4. This portal's own history, and the absence of a deploy pipeline.
git log --date=short --pretty='%h %ad %s'
test -d .github && echo "workflows directory present" || echo "no .github directory"`;

const RECIPE_CAPTION: Localized<string> = {
  en: "Run and verified on 2026-11-26: 59 core registrations, plugin registrations 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 route decorators in total, 89 served with factory defaults, 57 documented core routes, one tag named v1.0.0, fourteen commits, and no .github directory in this repository.",
  ru: "Выполнено и проверено 2026-11-26: 59 регистраций ядра, регистрации плагинов 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, всего 129 декораторов маршрутов, 89 обслуживаются с настройками по умолчанию, 57 документированных маршрутов ядра, один тег v1.0.0, четырнадцать коммитов и нет каталога .github в этом репозитории.",
  de: "Am 2026-11-26 ausgeführt und geprüft: 59 Core-Registrierungen, Plugin-Registrierungen 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, insgesamt 129 Route-Dekoratoren, 89 mit Standardwerten bedient, 57 dokumentierte Core-Routen, ein Tag v1.0.0, vierzehn Commits, und kein .github-Verzeichnis in diesem Repository.",
  fr: "Exécuté et vérifié le 2026-11-26 : 59 enregistrements core, enregistrements de plugins 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 décorateurs de routes au total, 89 servis avec les valeurs d’usine, 57 routes core documentées, un tag nommé v1.0.0, quatorze commits, et pas de dossier .github dans ce dépôt.",
  it: "Eseguito e verificato il 2026-11-26: 59 registrazioni core, registrazioni plugin 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 decoratori di rotte in totale, 89 servite con i valori di fabbrica, 57 rotte core documentate, un tag chiamato v1.0.0, quattordici commit e nessuna cartella .github in questo repository.",
  nl: "Uitgevoerd en gecontroleerd op 2026-11-26: 59 core-registraties, plugin-registraties 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 route-decorators in totaal, 89 bediend met fabrieksinstellingen, 57 gedocumenteerde core-routes, één label v1.0.0, veertien commits en geen .github-map in deze repository.",
  cs: "Spuštěno a ověřeno 2026-11-26: 59 registrací jádra, registrace pluginů 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, celkem 129 dekorátorů rout, 89 obsluhovaných s továrními nastaveními, 57 dokumentovaných jádrových rout, jeden tag v1.0.0, čtrnáct commitů a žádná složka .github v tomto repozitáři.",
  "zh-Hans": "2026-11-26 实际运行并核对：核心注册 59 条，插件注册 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 条，路由装饰器共 129 条，出厂默认值实际应答 89 条，核心有文档路由 57 条，一个名为 v1.0.0 的 tag，十四个提交，且本仓库没有 .github 目录。",
  "zh-Hant": "2026-11-26 實際執行並核對：核心註冊 59 條，外掛註冊 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70 條，路由裝飾器共 129 條，出廠預設值實際應答 89 條，核心有文件路由 57 條，一個名為 v1.0.0 的 tag，十四個提交，且本倉庫沒有 .github 目錄。",
  es: "Ejecutado y verificado el 2026-11-26: 59 registros core, registros de complementos 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 decoradores de rutas en total, 89 servidas con valores de fábrica, 57 rutas core documentadas, una etiqueta llamada v1.0.0, catorce commits y ningún directorio .github en este repositorio.",
  pl: "Uruchomione i sprawdzone 2026-11-26: 59 rejestracji rdzenia, rejestracje wtyczek 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, łącznie 129 dekoratorów tras, 89 obsługiwanych przy ustawieniach fabrycznych, 57 udokumentowanych tras rdzenia, jeden tag v1.0.0, czternaście commitów i brak katalogu .github w tym repozytorium.",
  ja: "2026-11-26 に実行して確認済み：コア側の登録 59、プラグイン側の登録 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70、ルートデコレータは合計 129、初期設定で応答するのは 89、文書化されたコアルートは 57、v1.0.0 というタグが1件、コミット14件、そしてこのリポジトリに .github ディレクトリはありません。",
  th: "รันและตรวจสอบเมื่อ 2026-11-26: ลงทะเบียนแกนหลัก 59, ลงทะเบียนปลั๊กอิน 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, มี decorator ของรูททั้งหมด 129, ให้บริการด้วยค่าเริ่มต้นจากโรงงาน 89 รูท, รูทแกนหลักที่มีเอกสาร 57 รูท, แท็กเดียวชื่อ v1.0.0, สิบสี่คอมมิต และไม่มีไดเรกทอรี .github ในรีโปนี้",
  fi: "Suoritettu ja varmistettu 2026-11-26: 59 ytimen kirjausta, lisäosien kirjausta 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, yhteensä 129 reittikoristetta, 89 palvellaan tehdasasetuksilla, 57 dokumentoitua ydinreittiä, yksi tag nimeltä v1.0.0, neljätoista commitia eikä .github-hakemistoa tässä repositoriossa.",
  uk: "Виконано і перевірено 2026-11-26: 59 реєстрацій ядра, реєстрації плагінів 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, усього 129 декораторів маршрутів, 89 обслуговуються з типовими параметрами, 57 задокументованих маршрутів ядра, один тег v1.0.0, чотирнадцять комітів і немає каталогу .github у цьому репозиторії.",
  bg: "Изпълнено и проверено на 2026-11-26: 59 регистрации на ядрото, регистрации на плъгини 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, общо 129 декоратора на пътища, 89 обслужвани със заводските стойности, 57 документирани основни пътя, един маркер v1.0.0, четиринадесет комита и няма директория .github в това хранилище.",
  tr: "2026-11-26 tarihinde çalıştırılıp doğrulandı: 59 çekirdek kaydı, eklenti kayıtları 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, toplam 129 rota dekoratörü, fabrika ayarlarıyla 89 rota sunuluyor, 57 belgelenmiş çekirdek rota, v1.0.0 adında tek etiket, on dört kayıt ve bu depoda .github dizini yok.",
  hu: "2026-11-26-én lefuttatva és ellenőrizve: 59 törzs-nyilvántartás, bővítmény-nyilvántartások 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, összesen 129 útvonal-dekorátor, 89 kiszolgálva gyári beállításokkal, 57 dokumentált törzs-útvonal, egy v1.0.0 nevű tag, tizennégy commit, és nincs .github könyvtár ebben a repóban.",
  "pt-BR": "Executado e verificado em 2026-11-26: 59 registros principais, registros de plug-in 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70, 129 decoradores de rota no total, 89 servidas com os padrões de fábrica, 57 rotas principais documentadas, uma tag chamada v1.0.0, quatorze commits e nenhum diretório .github neste repositório.",
  ko: "2026-11-26에 실행 및 검증: 코어 등록 59개, 플러그인 등록 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70개, 라우트 데코레이터 총 129개, 출고 기본값으로 제공되는 라우트 89개, 문서화된 코어 라우트 57개, v1.0.0이라는 이름의 태그 1개, 커밋 14개, 그리고 이 저장소에는 .github 디렉터리가 없습니다.",
  ar: "شُغِّل وتُحقِّق منه في 2026-11-26: 59 تسجيلًا أساسيًا، وتسجيلات الإضافات 6 + 10 + 6 + 8 + 9 + 12 + 6 + 6 + 7 = 70، و129 مزيّن مسار إجمالًا، و89 مسارًا مخدومًا بالإعدادات الافتراضية، و57 مسارًا أساسيًا موثقًا، ووسم واحد اسمه v1.0.0، وأربعة عشر إيداعًا، ولا دليل .github في هذا المستودع.",
};

const RECIPE_HINT: Localized<string> = {
  en: "Two of the 59 core routes are served but excluded from the schema, so 129 registrations and 89 served routes do not turn into 129 documented endpoints: 57 core routes are documented.",
  ru: "Два из 59 маршрутов ядра обслуживаются, но исключены из схемы, поэтому 129 регистраций и 89 обслуживаемых маршрутов не превращаются в 129 документированных эндпоинтов: документировано 57 маршрутов ядра.",
  de: "Zwei der 59 Core-Routen werden bedient, aber aus dem Schema ausgeschlossen – deshalb werden aus 129 Registrierungen und 89 bedienten Routen nicht 129 dokumentierte Endpunkte: 57 Core-Routen sind dokumentiert.",
  fr: "Deux des 59 routes core sont servies mais exclues du schéma, c’est pourquoi 129 enregistrements et 89 routes servies ne donnent pas 129 endpoints documentés : 57 routes core sont documentées.",
  it: "Due delle 59 rotte core sono servite ma escluse dallo schema, motivo per cui 129 registrazioni e 89 rotte servite non diventano 129 endpoint documentati: le rotte core documentate sono 57.",
  nl: "Twee van de 59 core-routes worden bediend maar uit het schema gehouden, daarom worden 129 registraties en 89 bediende routes niet 129 gedocumenteerde eindpunten: 57 core-routes zijn gedocumenteerd.",
  cs: "Dvě z 59 jádrových rout jsou obsluhované, ale vyňaté ze schématu — proto z 129 registrací a 89 obsluhovaných rout nevznikne 129 zdokumentovaných endpointů: zdokumentováno je 57 jádrových rout.",
  "zh-Hans": "59 条核心路由里有两条会被服务但从 schema 中排除，所以 129 条注册、89 条实际应答并不会变成 129 个有文档的接口：有文档的核心路由是 57 条。",
  "zh-Hant": "59 條核心路由裡有兩條會被服務但從 schema 中排除，所以 129 條註冊、89 條實際應答並不會變成 129 個有文件的介面：有文件的核心路由是 57 條。",
  es: "Dos de las 59 rutas core se sirven pero quedan excluidas del esquema, por eso 129 registros y 89 rutas servidas no se convierten en 129 endpoints documentados: hay 57 rutas core documentadas.",
  pl: "Dwie z 59 tras rdzenia są obsługiwane, ale wyłączone ze schematu, dlatego 129 rejestracji i 89 obsługiwanych tras nie daje 129 udokumentowanych endpointów: udokumentowanych tras rdzenia jest 57.",
  ja: "59 のコアルートのうち2つは提供されますがスキーマから除外されているため、129 件の登録と 89 件の応答ルートがそのまま 129 の文書化済みエンドポイントにはなりません。文書化されているコアルートは 57 です。",
  th: "มีสองรูทจาก 59 รูทแกนหลักที่ถูกให้บริการแต่ถูกตัดออกจากสกีมา นี่คือเหตุที่ 129 การลงทะเบียนกับ 89 รูทที่ตอบจริง ไม่กลายเป็น 129 endpoint ที่มีเอกสาร: รูทแกนหลักที่มีเอกสารมี 57 รูท",
  fi: "Kaksi 59 ydinreitistä palvellaan mutta jätetään skeeman ulkopuolelle, siksi 129 kirjausta ja 89 palveltua reittiä eivät ole 129 dokumentoitua päätepistettä: dokumentoituja ydinreittejä on 57.",
  uk: "Два з 59 маршрутів ядра обслуговуються, але виключені зі схеми, тому 129 реєстрацій і 89 обслуговуваних маршрутів не перетворюються на 129 задокументований ендпоінт: задокументовано 57 маршрутів ядра.",
  bg: "Два от 59 основни пътя се обслужват, но са извадени от схемата, затова 129 регистрации и 89 обслужвани пътя не стават 129 документирани крайни точки: документирани са 57 основни пътя.",
  tr: "59 çekirdek rotadan ikisi sunulur ama şemanın dışındadır, bu yüzden 129 kayıt ve 89 sunulan rota 129 belgelenmiş uç noktaya dönüşmez: belgelenmiş çekirdek rota sayısı 57.",
  hu: "Az 59 törzs-útvonalból kettő kiszolgálva van, de ki van hagyva a sémából, ezért a 129 nyilvántartás és 89 kiszolgált útvonal nem válik 129 dokumentált végponttá: 57 törzs-útvonal dokumentált.",
  "pt-BR": "Duas das 59 rotas principais são servidas, mas excluídas do esquema, então 129 registros e 89 rotas servidas não se transformam em 129 endpoints documentados: 57 rotas principais estão documentadas.",
  ko: "59개 코어 라우트 중 2개는 제공되지만 스키마에서 제외되므로, 등록 129개와 제공 89개가 문서화된 엔드포인트 129개로 이어지지는 않습니다. 문서화된 코어 라우트는 57개입니다.",
  ar: "مسارَان من أصل 59 مسارًا أساسيًا مخدومان لكنهما مستبعدان من المخطط، لذا لا تتحول 129 تسجيلًا و89 مسارًا مخدومًا إلى 129 نقطة نهاية موثقة: بل تُوثَّق 57 مسارًا أساسيًا.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 4. Backend changelog — the fourteen commits that exist, oldest first
 * ───────────────────────────────────────────────────────────────────────── */

const BACKEND_TITLE: Localized<string> = {
  en: "Backend changelog: the fourteen entries that exist",
  ru: "Журнал бэкенда: четырнадцать записей, которые есть",
  de: "Backend-Änderungsprotokoll: die vierzehn Einträge, die existieren",
  fr: "Journal backend : les quatorze entrées qui existent",
  it: "Registro del backend: le quattordici voci che esistono",
  nl: "Backend-logboek: de veertien items die bestaan",
  cs: "Protokol backendu: čtrnáct položek, které existují",
  "zh-Hans": "后端更新日志：真实存在的十四条",
  "zh-Hant": "後端更新日誌：真實存在的十四條",
  es: "Registro del backend: las catorce entradas que existen",
  pl: "Dziennik backendu: czternaście wpisów, które istnieją",
  ja: "バックエンドの変更履歴：実在する14件",
  th: "บันทึกการเปลี่ยนแปลงแบ็กเอนด์: สิบสี่รายการที่มีอยู่จริง",
  fi: "Backendin muutosloki: neljätoista merkintää, jotka ovat olemassa",
  uk: "Журнал бекенду: чотирнадцять записів, які існують",
  bg: "Журнал на бекенда: четиринадесетте записа, които съществуват",
  tr: "Arka uç değişiklik günlüğü: var olan on dört kayıt",
  hu: "Backend változásnapló: a tizennégy létező bejegyzés",
  "pt-BR": "Changelog do backend: as quatorze entradas que existem",
  ko: "백엔드 변경 이력: 실제로 존재하는 열네 개 항목",
  ar: "سجل تغييرات الواجهة الخلفية: المدخلات الأربعة عشر الموجودة",
};

const BACKEND_LEDE: Localized<string> = {
  en: "The backend repository has no CHANGELOG file, so this is the commit history itself: fourteen entries, grouped by date, oldest first. Nothing was added to it and nothing left out. Each row carries its own commit subject, verbatim, and one line about what that commit changes for whoever runs the gateway.",
  ru: "В репозитории бэкенда нет файла CHANGELOG, поэтому здесь — сама история коммитов: четырнадцать записей, сгруппированных по датам, от старых к новым. Ничего не добавили и ничего не пропустили. Каждая строка дословно приводит заголовок коммита и одно предложение о том, что этот коммит меняет для того, кто запускает шлюз.",
  de: "Im Backend-Repository gibt es keine CHANGELOG-Datei, daher steht hier die Commit-Geschichte selbst: vierzehn Einträge, nach Datum gruppiert, älteste zuerst. Nichts wurde ergänzt, nichts weggelassen. Jede Zeile enthält die eigene Commit-Betreffzeile im Wortlaut und einen Satz, was dieser Eintrag für den ändert, der das Gateway betreibt.",
  fr: "Le dépôt backend n’a pas de fichier CHANGELOG, voici donc l’historique des commits lui-même : quatorze entrées, groupées par date, de la plus ancienne à la plus récente. Rien n’y a été ajouté, rien retiré. Chaque ligne porte son propre message de commit, mot pour mot, et une ligne sur ce que ce commit change pour celui qui exploite le gateway.",
  it: "Nel repository backend non esiste un file CHANGELOG, quindi qui c’è la cronologia dei commit stessa: quattordici voci, raggruppate per data, dalla più vecchia. Non è stato aggiunto nulla e nulla è stato omesso. Ogni riga riporta l’oggetto del proprio commit alla lettera e una riga su ciò che quel commit cambia per chi gestisce il gateway.",
  nl: "De backend-repository bevat geen CHANGELOG-bestand, dus hier staat de commitgeschiedenis zelf: veertien items, gegroepeerd per datum, oudste eerst. Er is niets aan toegevoegd en niets weggelaten. Elke regel bevat het eigen commit-onderwerp woord voor woord, plus één regel over wat die commit verandert voor wie de gateway beheert.",
  cs: "Backend repozitář nemá soubor CHANGELOG, takže tady je samotná historie commitů: čtrnáct položek, seskupených podle data, nejstarší první. Nic nepřidáno, nic vynecháno. Každý řádek obsahuje vlastní předmět commitu doslovně a jednou řádkou, co takový commit mění pro toho, kdo bránu provozuje.",
  "zh-Hans": "后端仓库没有 CHANGELOG 文件，所以下面就是提交历史本身：十四条记录，按日期分组，从旧到新。既没有加进去的东西，也没有漏掉的条目。每行原样带上它自己的提交标题，再补一句这条提交对跑网关的人意味着什么。",
  "zh-Hant": "後端倉庫沒有 CHANGELOG 檔案，所以下面就是提交歷史本身：十四條記錄，依日期分組，從舊到新。既沒有加進去的東西，也沒有漏掉的條目。每行原樣帶上它自己的提交標題，再補一句這條提交對執行閘道的人意味著什麼。",
  es: "El repositorio del backend no tiene archivo CHANGELOG, así que esto es el historial de commits en persona: catorce entradas agrupadas por fecha, la más antigua primero. No se añadió nada ni se omitió nada. Cada fila lleva el asunto de su commit literalmente y una línea sobre lo que ese commit cambia para quien opera la pasarela.",
  pl: "W repozytorium backendu nie ma pliku CHANGELOG, więc poniżej jest sama historia commitów: czternaście wpisów pogrupowanych według dat, od najstarszego. Nic nie dodano i nic pominięto. Każdy wiersz zawiera dosłowny temat swojego commitu oraz jedno zdanie o tym, co ten commit zmienia dla osoby prowadzącej bramę.",
  ja: "バックエンドリポジトリには CHANGELOG ファイルがないため、以下はコミット履歴そのものです。14件を日付でグループ化し、古い順に並べています。足したものも省いたものもありません。各行にはコミットタイトルを原文のまま置き、その下に、ゲートウェイを運用する人に何が起きるかを一節添えています。",
  th: "รีโปแบ็กเอนด์ไม่มีไฟล์ CHANGELOG ด้านล่างจึงเป็นประวัติคอมมิตเอง: สิบสี่รายการจัดกลุ่มตามวันที่ เรียงจากเก่าไปใหม่ ไม่มีอะไรถูกเพิ่มหรือถูกตัดออก แต่ละแถวพกรายหัวคอมมิตของตัวเองตามต้นฉบับ พร้อมหนึ่งบรรทัดว่าคอมมิตนั้นเปลี่ยนอะไรสำหรับคนที่รันเกตเวย์",
  fi: "Backend-repossa ei ole CHANGELOG-tiedostoa, joten tässä on commit-historia sellaisenaan: neljätoista merkintää ryhmiteltynä päivän mukaan vanhin ensin. Mitään ei ole lisätty eikä jätetty pois. Jokaisella rivillä on commitin oma otsikko sellaisenaan ja yksi rivi siitä, mitä tämä commit muuttaa gatewayn ylläpitäjälle.",
  uk: "У репозиторії бекенду немає файлу CHANGELOG, тому тут — сама історія комітів: чотирнадцять записів, згрупованих за датами, від найстарішого. Нічого не додано і нічого не пропущено. Кожен рядок дослівно наводить власний заголовок коміту й один рядок про те, що цей коміт змінює для того, хто запускає шлюз.",
  bg: "В бекенд хранилището няма файл CHANGELOG, затова по-долу е самата история на комитите: четиринадесет записа, групирани по дати, най-старият пръв. Нищо не е добавено и нищо не е пропуснато. Всеки ред носи собствения си заглавие на комит буквално и един ред за това какво променя той за хората, които управляват гейтуейта.",
  tr: "Arka uç deposunda CHANGELOG dosyası yok, bu yüzden aşağıdaki doğrudan işlem geçmişi: on dört kayıt, tarihe göre gruplanmış, eskiden yeniye. Ne bir şey eklendi ne de atlandı. Her satır kendi işlem başlığını aynen taşır ve ağ geçidini çalıştıran kişi için o işlemin neyi değiştirdiğini tek satırda söyler.",
  hu: "A backend repóban nincs CHANGELOG fájl, ezért itt maga a commitelőzmény: tizennégy bejegyzés dátum szerint csoportosítva, a legrégebbi elöl. Nem adtunk hozzá és nem hagytunk ki semmit. Minden sor tartalmazza a saját commit-címét szó szerint, plusz egy sort arról, mit jelent az az átjáró üzemeltetőjének.",
  "pt-BR": "O repositório do backend não tem arquivo CHANGELOG, então este é o próprio histórico de commits: quatorze entradas, agrupadas por data, das mais antigas para as mais novas. Nada foi adicionado e nada ficou de fora. Cada linha traz o seu próprio assunto de commit, palavra por palavra, e uma linha sobre o que aquele commit muda para quem opera o gateway.",
  ko: "백엔드 저장소에는 CHANGELOG 파일이 없으므로, 이것이 곧 커밋 이력입니다. 열네 개 항목을 날짜별로 묶고 오래된 것부터 배치했습니다. 아무것도 추가하지 않았고 아무것도 빼지 않았습니다. 각 행에는 해당 커밋 제목이 그대로 실리고, 게이트웨이를 운영하는 사람에게 그 커밋이 무엇을 바꾸는지 한 줄로 덧붙였습니다.",
  ar: "لا يوجد في مستودع الواجهة الخلفية ملف CHANGELOG، فهذا هو سجل الإيداعات نفسه: أربعة عشر مدخلًا، مجمعة حسب التاريخ، من الأقدم أولًا. لم يُضف إليها شيء ولم يُحذف منها شيء. ويحمل كل صف عنوان إيداعه كما هو حرفيًا، وسطرًا واحدًا عمّا يغيّره ذلك الإيداع لمن يشغّل البوابة.",
};


const BACKEND_GROUPS: readonly Group[] = [
  {
    date: "2026-11-21",
    entries: [
      {
        key: "fa1098f",
        hash: "fa1098f",
        date: "2026-11-21",
        type: "—",
        subject: "first commit",
        feature: false,
        what: {
          en: "History starts here: the gateway source lands in the repository as one commit.",
          ru: "История начинается: исходники шлюза попадают в репозиторий одним коммитом.",
          de: "Die Geschichte beginnt: Der Gateway-Quellcode landet in einem einzigen Commit im Repository.",
          fr: "L’historique commence ici : le code source du gateway arrive dans le dépôt en un seul commit.",
          it: "La cronologia inizia qui: il sorgente del gateway arriva nel repository in un unico commit.",
          nl: "De geschiedenis begint hier: de gateway-broncode komt in één commit in de repository.",
          cs: "Historie začíná: zdrojový kód brány přistává v repozitáři jako jeden commit.",
          "zh-Hans": "历史从这里开始：网关源码一次性提交进仓库。",
          "zh-Hant": "歷史從這裡開始：閘道原始碼一次性提交進倉庫。",
          es: "La historia empieza aquí: el código de la pasarela entra al repositorio en un solo commit.",
          pl: "Historia zaczyna się tutaj: kod bramy trafia do repozytorium jednym commitem.",
          ja: "履歴の起点です。ゲートウェイのソースが1件のコミットでリポジトリに入りました。",
          th: "จุดเริ่มของประวัติอยู่ที่นี่: ซอร์สของเกตเวย์เข้ารีโปด้วยคอมมิตเดียว",
          fi: "Historia alkaa tästä: gatewayn lähdekoodi tulee repositoryyn yhdellä commitilla.",
          uk: "Історія починається тут: код шлюза потрапляє до репозиторію одним комітом.",
          bg: "Историята започва тук: кодът на гейтуейта влиза в хранилището с един комит.",
          tr: "Geçmiş burada başlıyor: ağ geçidi kaynağı depoya tek bir kayıtla giriyor.",
          hu: "A előzmények itt kezdődnek: az átjáró forrása egyetlen committal kerül a repóba.",
          "pt-BR": "A história começa aqui: o código-fonte do gateway entra no repositório em um único commit.",
          ko: "이력은 여기서 시작합니다: 게이트웨이 소스가 하나의 커밋으로 저장소에 들어옵니다.",
          ar: "يبدأ التاريخ هنا: تصل شيفرة البوابة إلى المستودع في إيداع واحد.",
        },
      },
      {
        key: "0517c95",
        hash: "0517c95",
        date: "2026-11-21",
        type: "chore",
        subject: "chore(oss): release popopx-service-suite under AGPL-3.0-only",
        feature: false,
        what: {
          en: "The licence is fixed as AGPL-3.0-only and the LICENSE file ships with the code, so your obligations are the standard ones.",
          ru: "Лицензия зафиксирована как AGPL-3.0-only, файл LICENSE едет вместе с кодом, значит обязанности стандартные.",
          de: "Die Lizenz ist auf AGPL-3.0-only festgelegt und die LICENSE-Datei kommt mit dem Code, Ihre Pflichten sind also die üblichen.",
          fr: "La licence est fixée à AGPL-3.0-only et le fichier LICENSE est livré avec le code, vos obligations sont donc les habituelles.",
          it: "La licenza è fissata ad AGPL-3.0-only e il file LICENSE viene distribuito con il codice, quindi gli obblighi sono quelli standard.",
          nl: "De licentie staat vast op AGPL-3.0-only en het LICENSE-bestand gaat mee met de code, dus uw verplichtingen zijn de standaard.",
          cs: "Licence je upevněna na AGPL-3.0-only a soubor LICENSE jde s kódem, takže povinnosti jsou standardní.",
          "zh-Hans": "许可证确定为 AGPL-3.0-only，LICENSE 文件随代码一起发布，义务就是标准那套。",
          "zh-Hant": "授權條款確定為 AGPL-3.0-only，LICENSE 檔隨程式碼一起發布，義務就是標準那套。",
          es: "La licencia queda fijada en AGPL-3.0-only y el archivo LICENSE se distribuye con el código, así que las obligaciones son las estándar.",
          pl: "Licencja zostaje ustalona jako AGPL-3.0-only, a plik LICENSE jest dostarczany z kodem, więc obowiązki są standardowe.",
          ja: "ライセンスが AGPL-3.0-only に確定し、LICENSE ファイルもコードと一緒に配布されました。負担は通常どおりです。",
          th: "สัญญาอนุญาตถูกตรึงเป็น AGPL-3.0-only และไฟล์ LICENSE มากับโค้ด ข้อผูกพันจึงเป็นแบบมาตรฐาน",
          fi: "Lisenssi lukitaan AGPL-3.0-only:ksi ja LICENSE-tiedosto tulee koodin mukana, joten velvoitteet ovat vakiintuneet.",
          uk: "Ліцензію зафіксовано як AGPL-3.0-only, файл LICENSE постачається з кодом, тож зобовʼязання стандартні.",
          bg: "Лицензът се фиксира като AGPL-3.0-only и файлът LICENSE идва с кода, затова задълженията са стандартните.",
          tr: "Lisans AGPL-3.0-only olarak sabitlendi ve LICENSE dosyası kodla birlikte geliyor, yükümlülükleriniz de standart.",
          hu: "A licenc AGPL-3.0-only-ra rögzül, a LICENSE fájl pedig a kóddal együtt jár, tehát a kötelezettségek a szabványosak.",
          "pt-BR": "A licença está fixada como AGPL-3.0-only e o arquivo LICENSE acompanha o código, então as suas obrigações são as padrão.",
          ko: "라이선스는 AGPL-3.0-only로 확정되었고 LICENSE 파일이 코드와 함께 배포되므로, 의무는 표준적인 것입니다.",
          ar: "تُثبَّت الرخصة على AGPL-3.0-only ويأتي ملف LICENSE مع الشيفرة، لذا فالتزاماتك هي الالتزامات المعتادة.",
        },
      },
      {
        key: "f727323",
        hash: "f727323",
        date: "2026-11-21",
        type: "chore",
        subject: "chore(oss): migrate to lifespan and support menu subItems",
        feature: true,
        what: {
          en: "Startup and shutdown moved to FastAPI lifespan, and a menu item now accepts children under the wire key sub. The second menu level shows up in the iOS client because of this commit and not before it.",
          ru: "Старт и остановка переведены на lifespan в FastAPI, а пункт меню принял дочерние элементы под ключом sub. Второй уровень меню появляется в iOS-клиенте именно после этого коммита.",
          de: "Start und Stopp wurden auf FastAPI-lifespan umgestellt, und ein Menüpunkt akzeptiert Kinder unter dem Übertragungsschlüssel sub. Die zweite Menüebene erscheint im iOS-Client wegen dieses Commits, davor nicht.",
          fr: "Démarrage et arrêt passés au lifespan de FastAPI, et un élément de menu accepte désormais des enfants sous la clé de transmission sub. Le second niveau de menu apparaît dans le client iOS à cause de ce commit, pas avant.",
          it: "Avvio e arresto spostati sul lifespan di FastAPI, e una voce di menu accetta figli sotto la chiave di trasmissione sub. Il secondo livello del menu compare nel client iOS per merito di questo commit, prima no.",
          nl: "Start en stop gaan nu via FastAPI-lifespan, en een menu-onderdeel accepteert kinderen onder de draadsleutel sub. De tweede menulaag verschijnt in de iOS-cliënt door deze commit, daarvoor niet.",
          cs: "Spouštění a vypnutí přešlo na lifespan ve FastAPI a položka menu teď přijímá podpoložky pod klíčem sub. Druhá úroveň menu se v iOS klientovi objevuje až tímto commitem.",
          "zh-Hans": "启动与关闭迁到 FastAPI lifespan，菜单项开始用协议键 sub 携带子项。iOS 客户端上能看到第二级菜单，是从这次提交起才有的。",
          "zh-Hant": "啟動與關閉遷到 FastAPI lifespan，選單項開始用傳輸鍵 sub 攜帶子項。iOS 用戶端能看到第二層選單，是從這次提交起才有的。",
          es: "El arranque y el cierre pasaron al lifespan de FastAPI, y un elemento de menú ahora acepta hijos bajo la clave de cable sub. El segundo nivel del menú aparece en el cliente iOS por este commit, antes no.",
          pl: "Uruchamianie i zatrzymywanie przeniesiono do lifespan w FastAPI, a pozycja menu przyjmuje elementy podrzędne pod kluczem transmisji sub. Drugi poziom menu w kliencie iOS pojawia się dopiero przez ten commit.",
          ja: "起動と停止を FastAPI の lifespan に移し、メニュー項目が転送キー sub で子を持つようになりました。iOS クライアントで第二レベルのメニューが見えるのはこのコミットからです。",
          th: "ย้ายการสตาร์ตและชัตดาวน์ไปใช้ lifespan ของ FastAPI และรายการเมนูรับรายการย่อยด้วยคีย์บนสายชื่อ sub เมนูระดับที่สองจึงโผล่ในไคลเอนต์ iOS เพราะคอมมิตนี้เท่านั้น",
          fi: "Käynnistys ja sammutus siirrettiin FastAPI-lifespaniin, ja valikkokohta ottaa nyt lapsia siirtoavaimella sub. Valikon toinen taso näkyy iOS-asiakkaassa tämän commitin ansiosta, ei sitä ennen.",
          uk: "Запуск і зупинку переведено на lifespan у FastAPI, а пункт меню тепер приймає дочірні під ключем передачі sub. Другий рівень меню зʼявляється в iOS-клієнті саме після цього коміту.",
          bg: "Стартирането и спирането преминаха към lifespan във FastAPI, а елемент от менюто приема деца под ключа за предаване sub. Второто ниво на менюто се появява в iOS клиента благодаря на този комит, преди това не.",
          tr: "Açılış ve kapanış FastAPI lifespanʼına taşındı ve bir menü öğesi artık iletim anahtarı sub altında alt öğe kabul ediyor. iOS istemcisinde ikinci menü seviyesinin görünmesinin sebebi bu kayıttır, öncesinde görünmüyordu.",
          hu: "Az indítást és a leállítást a FastAPI lifespanje alá helyezték, egy menüpont pedig fogad alrendelt elemeket a sub átviszi kulcs alatt. A menü második szintje az iOS ügyfélen emiatt a commit miatt jelenik meg, azelőtt nem.",
          "pt-BR": "A inicialização e o encerramento passaram para o lifespan do FastAPI, e um item de menu agora aceita filhos sob a chave wire sub. O segundo nível de menu aparece no cliente iOS por causa deste commit e não antes dele.",
          ko: "시작과 종료가 FastAPI lifespan으로 옮겨졌고, 이제 메뉴 항목이 와이어 키 sub 아래의 자식 항목을 받습니다. 두 번째 메뉴 단계가 iOS 클라이언트에 나타나는 것은 이 커밋 덕분이며, 그 이전에는 나타나지 않았습니다.",
          ar: "انتقل البدء والإيقاف إلى FastAPI lifespan، وأصبح عنصر القائمة يقبل عناصر فرعية تحت المفتاح sub على الشبكة. ويظهر المستوى الثاني للقائمة في عميل iOS بفضل هذا الإيداع وليس قبله.",
        },
      },
      {
        key: "0aa7e57",
        hash: "0aa7e57",
        date: "2026-11-21",
        type: "docs",
        subject: "docs(oss): make the two READMEs section-parallel and correct their install claims",
        feature: false,
        what: {
          en: "The two READMEs now run section by section in parallel, and their install instructions match the scripts that exist.",
          ru: "Оба README теперь идут раздел за разделом параллельно, а инструкции по установке совпадают с реально существующими скриптами.",
          de: "Die beiden READMEs laufen jetzt Abschnitt für Abschnitt parallel, und die Installationsanweisungen stimmen mit den vorhandenen Skripten überein.",
          fr: "Les deux README avancent désormais section par section en parallèle, et les consignes d’installation correspondent aux scripts qui existent réellement.",
          it: "I due README ora procedono sezione per sezione in parallelo e le istruzioni di installazione corrispondono agli script effettivamente esistenti.",
          nl: "De twee README’s lopen nu sectie per sectie parallel, en de install-instructies komen overeen met de scripts die er zijn.",
          cs: "Obě README jdou teď sekce po sekci paralelně a instalační pokyny odpovídají skutečně existujícím skriptům.",
          "zh-Hans": "两份 README 改为逐节平行对齐，安装说明也和仓库里真实存在的脚本对上了。",
          "zh-Hant": "兩份 README 改為逐節平行對齊，安裝說明也與倉庫裡真實存在的腳本對上了。",
          es: "Los dos README ahora avanzan sección por sección en paralelo, y las instrucciones de instalación coinciden con los scripts que existen.",
          pl: "Oba pliki README idą teraz sekcja po sekcji równolegle, a instrukcje instalacji pokrywają się z faktycznie istniejącymi skryptami.",
          ja: "2つの README を節ごとに並ぶ構成へ整え、インストール手順を実在するスクリプトと一致させました。",
          th: "README ทั้งสองฉบับเรียงตรงกันทีละหัวข้อ และขั้นตอนติดตั้งตรงกับสคริปต์ที่มีอยู่จริง",
          fi: "Molemmat README-t etenevät nyt kohta kohdalta rinnakkain, ja asennusohjeet vastaavat olemassa olevia skriptejä.",
          uk: "Обидва README тепер ідуть розділ за розділом паралельно, а інструкції з встановлення збігаються з тими скриптами, що справді існують.",
          bg: "Двете README вече вървят раздел по раздел успоредно, а инструкциите за инсталация съвпадат със съществуващите скриптове.",
          tr: "İki README artık bölüm bölüm paralel ilerliyor ve kurulum talimatları gerçekte var olan betiklerle uyuşuyor.",
          hu: "A két README most szakaszról szakaszra párhuzamosan halad, és a telepítési utasítások a valóban létező szkriptekkel egyeznek.",
          "pt-BR": "Os dois READMEs agora seguem seção por seção em paralelo, e suas instruções de instalação correspondem aos scripts que existem.",
          ko: "두 README가 이제 섹션별로 나란히 진행되며, 설치 지침이 실제로 존재하는 스크립트와 일치합니다.",
          ar: "أصبح دليلا README يسيران قسمًا بقسم بالتوازي، وأصبحت تعليمات التثبيت فيهما مطابقة للسكربتات الموجودة.",
        },
      },
    ],
  },
  {
    date: "2026-11-22",
    entries: [
      {
        key: "12a5de7",
        hash: "12a5de7",
        date: "2026-11-22",
        type: "feat",
        subject: "feat(macos): add production LaunchDaemon installer and harden deploy exclusions",
        feature: true,
        what: {
          en: "install_macos.sh appears: the gateway is registered as a LaunchDaemon under its own service account, and the deploy step now excludes files that must not leave the machine.",
          ru: "Появляется install_macos.sh: шлюз регистрируется как LaunchDaemon под собственным сервисным аккаунтом, а деплой теперь отсекает файлы, которые не должны покидать машину.",
          de: "install_macos.sh kommt hinzu: Das Gateway wird als LaunchDaemon mit eigenem Service-Account eingetragen, und der Deployment-Schritt schließt Dateien aus, die den Rechner nicht verlassen dürfen.",
          fr: "install_macos.sh apparaît : le gateway est enregistré comme LaunchDaemon sous son propre compte de service, et l’étape de déploiement exclut désormais les fichiers qui ne doivent pas quitter la machine.",
          it: "Compare install_macos.sh: il gateway viene registrato come LaunchDaemon con il proprio account di servizio, e il passaggio di deploy esclude i file che non devono lasciare la macchina.",
          nl: "install_macos.sh verschijnt: de gateway wordt geregistreerd als LaunchDaemon onder een eigen service-account, en de deploy-stap sluit bestanden uit die de machine niet mogen verlaten.",
          cs: "Objevuje se install_macos.sh: brána se registrovaná jako LaunchDaemon pod vlastním servisním účtem a nasazení teď vyřazuje soubory, které nesmí opustit stroj.",
          "zh-Hans": "install_macos.sh 出现：网关以自己独立的服务账号注册成 LaunchDaemon，部署步骤同时排除不该离开这台机器的文件。",
          "zh-Hant": "install_macos.sh 出現：閘道以自己獨立的服務帳號註冊成 LaunchDaemon，部署步驟同時排除不該離開這台機器的檔案。",
          es: "Aparece install_macos.sh: la pasarela se registra como LaunchDaemon con su propia cuenta de servicio, y el paso de despliegue excluye los archivos que no deben salir de la máquina.",
          pl: "Pojawia się install_macos.sh: brama jest rejestrowana jako LaunchDaemon pod własnym kontem serwisowym, a etap wdrożenia odrzuca pliki, które nie mogą opuścić maszyny.",
          ja: "install_macos.sh が加わり、ゲートウェイ専用のサービスアカウントで LaunchDaemon として登録されます。デプロイ時にマシン外へ出すべきでないファイルも除外されます。",
          th: "install_macos.sh ปรากฏขึ้น: เกตเวย์ถูกลงทะเบียนเป็น LaunchDaemon ด้วยบัญชีบริการของตัวเอง และขั้นตอน deploy กันไฟล์ที่ไม่ควรออกจากเครื่อง",
          fi: "install_macos.sh tulee mukaan: gateway rekisteröidään LaunchDaemonina omalla palvelutilillään, ja käyttöönotto sulkee pois tiedostot, jotka eivät saa poistua koneelta.",
          uk: "Зʼявляється install_macos.sh: шлюз реєструється як LaunchDaemon під власним сервісним акаунтом, а крок розгортання відфільтровує файли, що не мають полишати машину.",
          bg: "Появява се install_macos.sh: гейтуейтът се регистрира като LaunchDaemon със собствен сервисен акаунт, а стъпката за внедряване изключва файлове, които не трябва да напуснат машината.",
          tr: "install_macos.sh ortaya çıkıyor: ağ geçidi kendi hizmet hesabı altında LaunchDaemon olarak kaydediliyor ve dağıtım adımı makineden çıkmaması gereken dosyaları dışarıda bırakıyor.",
          hu: "Megjelenik az install_macos.sh: az átjáró saját szolgáltatási fiókkal LaunchDaemon-ként regisztrálódik, a deploy lépés pedig kizárja a gépről ki nem kerülő fájlokat.",
          "pt-BR": "install_macos.sh aparece: o gateway é registrado como um LaunchDaemon sob a sua própria conta de serviço, e a etapa de deploy agora exclui arquivos que não devem sair da máquina.",
          ko: "install_macos.sh가 등장합니다: 게이트웨이는 자체 서비스 계정 아래 LaunchDaemon으로 등록되고, 배포 단계는 이제 머신을 떠나서는 안 되는 파일을 제외합니다.",
          ar: "يظهر install_macos.sh: إذ تُسجَّل البوابة كـ LaunchDaemon تحت حساب خدمة خاص بها، وتستبعد خطوة النشر الآن الملفات التي يجب ألا تغادر الجهاز.",
        },
      },
      {
        key: "ce5f558",
        hash: "ce5f558",
        date: "2026-11-22",
        type: "fix",
        subject: "fix(macos): wait for launchd bootout to finish before bootstrapping",
        feature: false,
        what: {
          en: "A restart now waits until launchd has finished the bootout call before bootstrapping again, so reloading the service no longer races itself.",
          ru: "Перезапуск теперь ждёт завершения bootout у launchd, прежде чем снова вызывать bootstrap, поэтому перезагрузка сервиса не конкурирует сама с собой.",
          de: "Ein Neustart wartet jetzt den bootout-Aufruf von launchd ab, bevor erneut gebootstrapped wird – ein Reload des Dienstes rennt nicht mehr gegen sich selbst.",
          fr: "Un redémarrage attend désormais la fin de l’appel bootout de launchd avant de relancer le bootstrap, donc recharger le service ne se marche plus dessus.",
          it: "Un riavvio ora attende il completamento della chiamata bootout di launchd prima di rilanciare il bootstrap, quindi ricaricare il servizio non compete più con sé stesso.",
          nl: "Een herstart wacht nu tot de bootout-aanroep van launchd klaar is vóór opnieuw te bootstrappen, zodat een herlaadde dienst niet meer tegen zichzelf racet.",
          cs: "Restart teď počká, až launchd dokončí volání bootout, a teprve pak znovu bootstrapuje — načtení služby už nesoutěží samo se sebou.",
          "zh-Hans": "重启时会先等 launchd 的 bootout 调用结束再执行 bootstrap，服务重载不再自己抢自己的时序。",
          "zh-Hant": "重啟時會先等 launchd 的 bootout 呼叫結束再執行 bootstrap，服務重載不再自己搶自己的時序。",
          es: "Un reinicio ahora espera a que termine la llamada bootout de launchd antes del siguiente bootstrap, así que recargar el servicio ya no compite consigo mismo.",
          pl: "Ponowne uruchomienie czeka teraz, aż launchd skończy wywołanie bootout, zanim ponownie wykona bootstrap — przeładowanie usługi nie ściga się już samo ze sobą.",
          ja: "再起動時に launchd の bootout 呼び出しが終わるのを待ってから bootstrap するようになったため、サービスの再読み込みが自分自身と競合しなくなりました。",
          th: "การรีสตาร์ตรอให้ launchd เรียก bootout จบก่อนแล้วค่อย bootstrap ใหม่ การโหลดซำ้บริการจึงไม่แย่งจังหวะกับตัวเองอีก",
          fi: "Uudelleenkäynnistys odottaa nyt launchd:n bootout-kutsun valmistumista ennen uutta bootstrapia, joten palvelun lataus ei enää kilpaile itsensä kanssa.",
          uk: "Перезапуск тепер чекає, доки launchd завершить виклик bootout, перш ніж знову робити bootstrap, тож перезавантаження сервісу не змагається саме з собою.",
          bg: "Рестартът вече изчаква приключването на bootout извикването на launchd, преди нов bootstrap, презареждането на услугата вече не се състезава само със себе си.",
          tr: "Yeniden başlatma artık sıradaki bootstrapʼtan önce launchdʼnin bootout çağrısının bitmesini bekler, böylece hizmeti yeniden yüklemek kendisiyle yarışmaz.",
          hu: "Újrainításkor a rendszer megvárja a launchd bootout hívását, mielőtt újra bootstrapelne, így a szolgáltatás újratöltése nem versenyz önmagával.",
          "pt-BR": "Um reinício agora espera o launchd terminar a chamada bootout antes de fazer o bootstrap novamente, então recarregar o serviço não corre mais contra si mesmo.",
          ko: "이제 재시작은 launchd가 bootout 호출을 마칠 때까지 기다린 뒤 다시 부트스트랩하므로, 서비스를 다시 로드할 때 스스로와 경쟁하지 않습니다.",
          ar: "أصبحت إعادة التشغيل تنتظر انتهاء launchd من استدعاء bootout قبل إعادة التهيئة، فلم تعد إعادة تحميل الخدمة تتسابق مع نفسها.",
        },
      },
      {
        key: "a6e34bb",
        hash: "a6e34bb",
        date: "2026-11-22",
        type: "docs",
        subject: "docs(oss): make the channel-rotate example runnable and correct two field lists",
        feature: false,
        what: {
          en: "The channel-rotate example can be pasted and run as printed, and two field lists now say what the code actually accepts.",
          ru: "Пример channel-rotate можно вставить и запустить как напечатано, а два списка полей теперь описывают то, что код действительно принимает.",
          de: "Das channel-rotate-Beispiel lässt sich so einfügen und ausführen, wie es dasteht, und zwei Feldlisten beschreiben jetzt, was der Code tatsächlich annimmt.",
          fr: "L’exemple channel-rotate se colle et s’exécute tel qu’imprimé, et deux listes de champs décrivent maintenant ce que le code accepte vraiment.",
          it: "L’esempio channel-rotate si può incollare ed eseguire così com’è stampato, e due elenchi di campi descrivono ciò che il codice accetta davvero.",
          nl: "Het channel-rotate-voorbeeld laat zich plakken en draaien zoals het gedrukt staat, en twee veldlijsten beschrijven nu wat de code werkelijk aanvaardt.",
          cs: "Příklad channel-rotate lze vložit a spustit přesně tištěný, a dva výčty polí teď popisují, co kód skutečně přijímá.",
          "zh-Hans": "channel-rotate 示例可以直接粘贴原样运行，另外两处字段列表改成代码实际接受的内容。",
          "zh-Hant": "channel-rotate 範例可以直接貼上原樣執行，另外兩處欄位清單改成程式碼實際接受的內容。",
          es: "El ejemplo de channel-rotate se puede pegar y ejecutar tal cual está impreso, y dos listas de campos ya describen lo que el código acepta de verdad.",
          pl: "Przykład channel-rotate można wkleić i uruchomić dokładnie tak, jak jest wydrukowany, a dwie listy pól opisują to, co kod faktycznie przyjmuje.",
          ja: "channel-rotate の例を印刷されたまま貼り付けて実行できるようになり、2つのフィールド一覧も実際にコードが受け取る内容を指すようになりました。",
          th: "วางแล้วรันตัวอย่าง channel-rotate ได้ตรงตามที่พิมพ์ และรายการช่องสองจุดบรรยายสิ่งที่โค้ดรับจริงแล้ว",
          fi: "Channel-rotate-esimerkin voi liittää ja ajaa sellaisenaan julkaistuna, ja kaksi kenttäluetteloa kertoo nyt mitä koodi oikeasti hyväksyy.",
          uk: "Приклад channel-rotate можна вставити та запустити саме так, як він надрукований, і два переліки полів тепер описують те, що код насправді приймає.",
          bg: "Примерът channel-rotate може да се постави и изпълни точно както е отпечатан, а два списъка с полета описват това, което кодът наистина приема.",
          tr: "channel-rotate örneği basıldığı gibi yapıştırılıp çalıştırılabiliyor ve iki alan listesi artık kodun gerçekte ne kabul ettiğini anlatıyor.",
          hu: "A channel-rotate példa úgy illeszthető be és futtatható, ahogy a szövegkörnyezetben szerepel, és két mezőlista a kód által ténylegesen elfogadott mezőket írja le.",
          "pt-BR": "O exemplo de channel-rotate pode ser colado e executado como está impresso, e duas listas de campos agora dizem o que o código de fato aceita.",
          ko: "channel-rotate 예제를 인쇄된 그대로 붙여 넣어 실행할 수 있으며, 두 필드 목록이 이제 코드가 실제로 받아들이는 내용을 설명합니다.",
          ar: "أصبح مثال channel-rotate قابلًا للّصق والتشغيل كما هو مطبوع، وأصبحت قائمتا حقول تذكران ما تقبله الشيفرة فعليًا.",
        },
      },
      {
        key: "d2e5367",
        hash: "d2e5367",
        date: "2026-11-22",
        type: "test",
        subject: "test(gateway): make the throttle-key check deterministic",
        feature: false,
        what: {
          en: "The throttle-key check no longer depends on wall-clock timing, so a passing test run means the limiter key is right rather than lucky.",
          ru: "Проверка throttle-key больше не зависит от реального времени, поэтому зелёные тесты значат, что ключ лимитера верный, а не повезло.",
          de: "Die throttle-key-Prüfung hängt nicht mehr von der realen Uhrzeit ab, ein grüner Testlauf bedeutet also, dass der Limiterschlüssel stimmt und nicht nur Glück hatte.",
          fr: "Le contrôle throttle-key ne dépend plus de l’horloge murale, donc une session de tests verte signifie que la clé du limiteur est juste, pas seulement chanceuse.",
          it: "Il controllo throttle-key non dipende più dall’orologio di sistema, quindi una run verde significa che la chiave del limiter è corretta e non solo fortunata.",
          nl: "De throttle-key-controle hangt niet meer aan de systeemtijd, dus een groene testrun betekent dat de limiter-sleutel klopt en niet dat het toeval was.",
          cs: "Kontrola throttle-key už nezávisí na reálném čase, takže zelený průběh testů znamená, že klíč omezovače sedí, ne že by se to zrovna povedlo.",
          "zh-Hans": "throttle-key 检查不再依赖真实时钟，测试跑绿说明限流键本身是对的，而不是刚好卡上了时间。",
          "zh-Hant": "throttle-key 檢查不再依賴真實時鐘，測試跑綠說明限流鍵本身是對的，而不是剛好卡上時間。",
          es: "La comprobación de throttle-key ya no depende del reloj del sistema, así que una pasada de tests en verde significa que la clave del limitador es correcta, no que tuvo suerte.",
          pl: "Sprawdzenie throttle-key nie zależy już od czasu systemowego, więc zielony przebieg testów znaczy, że klucz limitera jest poprawny, a nie że akurat się udało.",
          ja: "throttle-key の検査が実時間に依存しなくなったため、テストが緑なのは制限キーが正しい証拠で、偶然通ったのとは違います。",
          th: "การตรวจ throttle-key ไม่พึ่งนาฬิกาจริงอีกต่อไป ผลเทสต์ที่ขึ้นเขียวจึงแปลว่าคีย์ตัวจำกัดถูกต้อง ไม่ใช่แค่โชคช่วย",
          fi: "Throttle-key-tarkistus ei enää riipu kellonajasta, joten vihreä testiajo tarkoittaa rajoittimen avaimen olevan oikea eikä onnennykkyys.",
          uk: "Перевірка throttle-key більше не залежить від системного часу, тож зелений прогін тестів означає, що ключ обмежувача правильний, а не влучив момент.",
          bg: "Проверката throttle-key вече не зависи от системния часовник, затова зелен тестов резултат означава, че ключът на ограничителя е верен, а не е случайност.",
          tr: "throttle-key denetimi artık sistem saatine bağlı değil, bu yüzden yeşil bir test koşumu limit anahtarının doğru olduğunu gösterir, şansını değil.",
          hu: "A throttle-key ellenőrzés már nem függ a rendszerórától, tehát a zöld tesztfuttatás azt jelenti, hogy a limiter kulcsa helyes, nem szerencse.",
          "pt-BR": "A verificação da chave de throttle não depende mais do tempo do relógio de parede, então uma execução de teste que passa significa que a chave do limitador está certa, e não que teve sorte.",
          ko: "스로틀 키 검사가 더 이상 벽시계 타이밍에 의존하지 않으므로, 테스트가 통과하면 리미터 키가 운 좋게 맞은 것이 아니라 실제로 올바르다는 뜻입니다.",
          ar: "لم يعد فحص مفتاح التقييد يعتمد على توقيت الساعة الحقيقية، لذا فإن نجاح تشغيل الاختبار يعني أن مفتاح المحدِّد صحيح لا أنه محظوظ.",
        },
      },
      {
        key: "95f15e9",
        hash: "95f15e9",
        date: "2026-11-22",
        type: "fix",
        subject: "fix(macos): name the env backup the way the code actually writes it",
        feature: false,
        what: {
          en: "The .env backup is named exactly the way the installer writes it, so the rollback the script promises can actually find the file.",
          ru: "Резервная копия .env называется ровно так, как её пишет установщик, поэтому обещанный откат действительно находит файл.",
          de: "Das .env-Backup heißt exakt so, wie der Installer es schreibt, sodass das versprochene Rollback die Datei tatsächlich findet.",
          fr: "La sauvegarde .env porte exactement le nom que l’installeur écrit, si bien que le retour arrière promis trouve vraiment le fichier.",
          it: "Il backup .env ha esattamente il nome che l’installer scrive, quindi il rollback promesso trova davvero il file.",
          nl: "De .env-backup draagt precies de naam die de installer schrijft, zodat de beloofde rollback het bestand werkelijk vindt.",
          cs: "Záloha .env se jmenuje přesně tak, jak ji instalátor zapisuje, takže slibovaný rollback soubor skutečně najde.",
          "zh-Hans": ".env 备份的文件名与安装脚本实际写入的格式一致，它承诺的回滚这才真能找到文件。",
          "zh-Hant": ".env 備份的檔名與安裝腳本實際寫入的格式一致，它承諾的回滾這時才真的能找到檔案。",
          es: "La copia de .env se nombra exactamente como el instalador la escribe, así que la reversión prometida por fin encuentra el archivo.",
          pl: "Kopia zapasowa .env ma dokładnie taką nazwę, jaką zapisuje instalator, więc obiecany rollback faktycznie znajduje plik.",
          ja: ".env のバックアップを実際にインストーラが書く名前と同じにしたため、約束していたロールバックが本当にファイルを見つけられます。",
          th: "ไฟล์สำรอง .env ใช้ชื่อตรงกับที่ตัวติดตั้งเขียนจริง การ rollback ที่สัญญาไว้จึงหาไฟล์เจอจริง",
          fi: ".env-varamuonnin nimi on täsmälleen se, jonka asennusohjelma kirjoittaa, joten luvattu rollback löytää tiedoston oikeasti.",
          uk: "Резервна копія .env називається рівно так, як її пише інсталятор, тож обіцяний відкат справді знаходить файл.",
          bg: "Резервното копие на .env се казва точно така, както инсталаторът го пише, затова обещаният rollback наистина намира файла.",
          tr: ".env yedeği, kurulumun yazdığı adla birebir aynı adlandırılıyor, böylece vaat edilen geri alma dosyayı gerçekten bulabiliyor.",
          hu: "A .env biztonsági mentése pontosan azzal a névvel készül, amit a telepítő ír, így az ígért rollback valóban megtalálja a fájlt.",
          "pt-BR": "O backup do .env tem exatamente o nome que o instalador grava, então o rollback que o script promete consegue de fato encontrar o arquivo.",
          ko: ".env 백업의 이름이 설치 프로그램이 기록하는 방식과 정확히 같아서, 스크립트가 약속하는 롤백이 실제로 파일을 찾을 수 있습니다.",
          ar: "سُمّيت نسخة .env الاحتياطية بالطريقة نفسها التي يكتبها بها المثبّت، فيستطيع التراجع الذي يَعِده السكربت أن يجد الملف فعلًا.",
        },
      },
    ],
  },
  {
    date: "2026-11-24",
    entries: [
      {
        key: "76c2ca0",
        hash: "76c2ca0",
        date: "2026-11-24",
        type: "feat",
        subject: "feat(installer): auto-download popopx-chat node with SHA256 verification and wrapper script",
        feature: true,
        what: {
          en: "The macOS installer can fetch the popopx-chat node itself and check it against a SHA256 before anything is started, so a fresh machine needs no manual download step.",
          ru: "Установщик для macOS сам скачивает ноду popopx-chat и сверяет её по SHA256 прежде, чем что-либо запустить, — на свежей машине не нужен ручной шаг загрузки.",
          de: "Der macOS-Installer kann den popopx-chat-Knoten selbst holen und per SHA256 prüfen, bevor etwas startet – auf einem frischen Rechner entfällt der manuelle Download.",
          fr: "L’installeur macOS peut télécharger lui-même le nœud popopx-chat et le contrôler par SHA256 avant de rien démarrer : sur une machine neuve, plus besoin de télécharger à la main.",
          it: "L’installer macOS può scaricare da sé il nodo popopx-chat e verificarlo con SHA256 prima di avviare qualsiasi cosa: su una macchina nuova non serve più il download manuale.",
          nl: "De macOS-installer kan de popopx-chat-node zelf ophalen en via SHA256 controleren voordat er iets opstart, dus op een verse machine vervalt de handmatige download.",
          cs: "Instalátor pro macOS si umí stáhnout uzel popopx-chat sám a ověřit ho přes SHA256, než něco nastartuje — na čistém stroju odpadá ruční stažení.",
          "zh-Hans": "macOS 安装脚本可以自行下载 popopx-chat 节点，并在启动任何东西之前用 SHA256 校验它，新机器不用再手动下载。",
          "zh-Hant": "macOS 安裝腳本可以自行下載 popopx-chat 節點，並在啟動任何東西之前以 SHA256 驗證它，新機器不必再手動下載。",
          es: "El instalador de macOS puede descargar por sí mismo el nodo popopx-chat y verificarlo con SHA256 antes de arrancar nada, así que en una máquina nueva ya no hace falta la descarga manual.",
          pl: "Instalator dla macOS sam pobiera węzeł popopx-chat i sprawdza go po SHA256, zanim coś wystartuje, więc na czystej maszynie odpada ręczne pobieranie.",
          ja: "macOS 用インストーラが popopx-chat ノードを自分で取得し、何かを起動する前に SHA256 で検証します。新しいマシンで手動ダウンロードをする必要がなくなりました。",
          th: "ตัวติดตั้งบน macOS ดาวน์โหลดโหนด popopx-chat มาเองและตรวจ SHA256 ก่อนเริ่มสิ่งใด เครื่องใหม่จึงไม่ต้องข้ามขั้นตอนดาวน์โหลดเอง",
          fi: "macOS-asentaja voi hakea popopx-chat-solmun itse ja varmentaa sen SHA256:lla ennen mitään käynnistystä, uudella koneella ei siis tarvitse ladata käsin.",
          uk: "Інсталятор macOS може сам завантажити ноду popopx-chat і перевірити її за SHA256, перш ніж щось запустити, тож на чистій машині ручне завантаження вже не потрібне.",
          bg: "Инсталаторът за macOS може сам да свали възела popopx-chat и да го провери по SHA256, преди да стартира каквото и да е, така че на чиста машина ръчното изтегляне отпада.",
          tr: "macOS kurucusu popopx-chat düğümünü kendi indirir ve bir şey başlatmadan önce SHA256 ile doğrular, böylece yeni bir makinede elle indirme adımı kalmıyor.",
          hu: "A macOS telepítő maga tölti le a popopx-chat csomópontot, és SHA256-vel ellenőrzi, mielőtt bármit elindítane, így egy új gépen nem kell kézzel letölteni.",
          "pt-BR": "O instalador do macOS consegue buscar o próprio nó popopx-chat e verificá-lo contra um SHA256 antes de qualquer coisa iniciar, então uma máquina nova não precisa de nenhuma etapa manual de download.",
          ko: "macOS 설치 프로그램이 popopx-chat 노드를 직접 내려받아 무엇이든 시작하기 전에 SHA256으로 검증할 수 있으므로, 새 머신에 수동 다운로드 단계가 필요 없습니다.",
          ar: "أصبح مثبّت macOS قادرًا على جلب عقدة popopx-chat بنفسه والتحقق منها مقابل SHA256 قبل بدء أي شيء، فلا يحتاج جهاز جديد إلى خطوة تنزيل يدوية.",
        },
      },
    ],
  },
  {
    date: "2026-11-26",
    entries: [
      {
        key: "f0eee63",
        hash: "f0eee63",
        date: "2026-11-26",
        type: "feat",
        subject: "feat(connectors): add Node-RED/Activepieces webhook bridge and privacy-preserving CardDAV/CalDAV connectors",
        feature: true,
        what: {
          en: "Three opt-in connector plugins arrive, all off by default: a Node-RED/Activepieces workflow bridge in workflow_webhook_plugin.py and CardDAV/CalDAV connectors in carddav_connector.py and caldav_connector.py, sharing gateway/app/connectors.py. Existing installs see no change until a merchant enables one.",
          ru: "Появляются три опциональных плагина-коннектора, все выключены по умолчанию: мост workflow для Node-RED/Activepieces в workflow_webhook_plugin.py и коннекторы CardDAV/CalDAV в carddav_connector.py и caldav_connector.py, использующие общий gateway/app/connectors.py. Существующие установки не меняются, пока владелец не включит один из них.",
          de: "Drei optionale Connector-Plugins kommen hinzu, alle standardmäßig aus: eine Node-RED/Activepieces-Workflow-Brücke in workflow_webhook_plugin.py sowie CardDAV/CalDAV-Connectoren in carddav_connector.py und caldav_connector.py, die gateway/app/connectors.py gemeinsam nutzen. Bestehende Installationen ändern sich nicht, bis jemand eines davon aktiviert.",
          fr: "Trois plugins connecteurs optionnels arrivent, tous éteints par défaut : un pont workflow Node-RED/Activepieces dans workflow_webhook_plugin.py et des connecteurs CardDAV/CalDAV dans carddav_connector.py et caldav_connector.py, partageant gateway/app/connectors.py. Une installation existante ne change pas tant que personne n’en active un.",
          it: "Arrivano tre plugin connettore opzionali, tutti spenti per impostazione predefinita: un ponte workflow Node-RED/Activepieces in workflow_webhook_plugin.py e connettori CardDAV/CalDAV in carddav_connector.py e caldav_connector.py, che condividono gateway/app/connectors.py. Un’installazione esistente non cambia finché qualcuno non ne attiva uno.",
          nl: "Er komen drie optionele connector-plug-ins bij, alle standaard uit: een Node-RED/Activepieces-workflowbrug in workflow_webhook_plugin.py en CardDAV/CalDAV-connectoren in carddav_connector.py en caldav_connector.py, die gateway/app/connectors.py delen. Een bestaande installatie verandert niet tot iemand er een aanzet.",
          cs: "Přicházejí tři volitelné konektorové pluginy, všechny ve výchozím stavu vypnuté: workflow most pro Node-RED/Activepieces v workflow_webhook_plugin.py a konektory CardDAV/CalDAV v carddav_connector.py a caldav_connector.py, sdílející gateway/app/connectors.py. Stávající instalace se nezmění, dokud někdo jeden z nich nezapne.",
          "zh-Hans": "新增三个可选连接器插件，默认全部关闭：workflow_webhook_plugin.py 里的 Node-RED/Activepieces 工作流桥，以及 carddav_connector.py 和 caldav_connector.py 里的 CardDAV/CalDAV 连接器，三者共用 gateway/app/connectors.py。在有人启用之前，现有安装没有任何变化。",
          "zh-Hant": "新增三個可選連接器外掛，預設全部關閉：workflow_webhook_plugin.py 裡的 Node-RED/Activepieces 工作流橋，以及 carddav_connector.py 和 caldav_connector.py 裡的 CardDAV/CalDAV 連接器，三者共用 gateway/app/connectors.py。在有人啟用之前，現有安裝沒有任何變化。",
          es: "Llegan tres complementos conectores opcionales, todos apagados por defecto: un puente de flujo de trabajo Node-RED/Activepieces en workflow_webhook_plugin.py y conectores CardDAV/CalDAV en carddav_connector.py y caldav_connector.py, que comparten gateway/app/connectors.py. Una instalación existente no cambia hasta que alguien active uno.",
          pl: "Pojawiają się trzy opcjonalne wtyczki-konektory, wszystkie domyślnie wyłączone: most workflow Node-RED/Activepieces w workflow_webhook_plugin.py oraz konektory CardDAV/CalDAV w carddav_connector.py i caldav_connector.py, współdzielące gateway/app/connectors.py. Istniejąca instalacja nie zmienia się, dopóki ktoś nie włączy jednego z nich.",
          ja: "オプトインのコネクタプラグインが3つ加わります。いずれも既定はオフです。workflow_webhook_plugin.py の Node-RED/Activepieces ワークフローブリッジと、carddav_connector.py および caldav_connector.py の CardDAV/CalDAV コネクタで、gateway/app/connectors.py を共有します。誰かが有効にするまで、既存のインストールに変化はありません。",
          th: "มีปลั๊กอินคอนเนกเตอร์แบบเลือกเปิดสามตัวเพิ่มเข้ามา ทั้งหมดปิดเป็นค่าเริ่มต้น: บริดจ์เวิร์กโฟลว์ Node-RED/Activepieces ใน workflow_webhook_plugin.py และคอนเนกเตอร์ CardDAV/CalDAV ใน carddav_connector.py กับ caldav_connector.py ซึ่งใช้ gateway/app/connectors.py ร่วมกัน การติดตั้งเดิมไม่เปลี่ยนจนกว่าจะมีคนเปิดใช้ตัวใดตัวหนึ่ง",
          fi: "Kolme valinnaista liitinlisäosaa saapuu, kaikki oletuksena pois päältä: Node-RED/Activepieces-työnkulkusilta workflow_webhook_plugin.py:ssä sekä CardDAV/CalDAV-liittimet carddav_connector.py:ssä ja caldav_connector.py:ssä, jotka jakavat gateway/app/connectors.py:n. Nykyinen asennus ei muutu ennen kuin joku ottaa yhden käyttöön.",
          uk: "Додаються три опційні плагіни-конектори, усі типово вимкнені: міст workflow для Node-RED/Activepieces у workflow_webhook_plugin.py і конектори CardDAV/CalDAV у carddav_connector.py та caldav_connector.py, що спільно використовують gateway/app/connectors.py. Наявна установка не змінюється, доки хтось не увімкне один із них.",
          bg: "Добавят се три опционални конекторни плъгина, всички изключени по подразбиране: workflow мост за Node-RED/Activepieces във workflow_webhook_plugin.py и CardDAV/CalDAV конектори в carddav_connector.py и caldav_connector.py, споделящи gateway/app/connectors.py. Съществуваща инсталация не се променя, докато някой не включи един от тях.",
          tr: "İsteğe bağlı üç bağlayıcı eklentisi geliyor, hepsi varsayılan olarak kapalı: workflow_webhook_plugin.py içinde bir Node-RED/Activepieces iş akışı köprüsü ve carddav_connector.py ile caldav_connector.py içinde gateway/app/connectors.py dosyasını paylaşan CardDAV/CalDAV bağlayıcıları. Mevcut bir kurulum, biri bunlardan birini açana kadar değişmez.",
          hu: "Három opcionális összekötő bővítmény érkezik, mind alapból kikapcsolva: egy Node-RED/Activepieces munkafolyamat-híd a workflow_webhook_plugin.py-ban, valamint CardDAV/CalDAV összekötők a carddav_connector.py-ban és caldav_connector.py-ban, amelyek a gateway/app/connectors.py-t használják közösen. A meglévő telepítés nem változik, amíg valaki be nem kapcsol egyet.",
          "pt-BR": "Chegam três plug-ins de conector opcionais, todos desligados por padrão: uma ponte de workflow Node-RED/Activepieces em workflow_webhook_plugin.py e conectores CardDAV/CalDAV em carddav_connector.py e caldav_connector.py, compartilhando gateway/app/connectors.py. Instalações existentes não veem mudança até que um comerciante habilite um deles.",
          ko: "세 가지 옵트인 커넥터 플러그인이 추가되며, 모두 기본적으로 꺼져 있습니다: workflow_webhook_plugin.py의 Node-RED/Activepieces 워크플로 브리지와 carddav_connector.py, caldav_connector.py의 CardDAV/CalDAV 커넥터이며, gateway/app/connectors.py를 공유합니다. 판매자가 하나를 켜기 전까지 기존 설치에는 아무 변화가 없습니다.",
          ar: "تصل ثلاث إضافات ربط اختيارية، جميعها معطّلة افتراضيًا: جسر سير عمل Node-RED/Activepieces في workflow_webhook_plugin.py، وموصّلات CardDAV/CalDAV في carddav_connector.py وcaldav_connector.py، تشترك في gateway/app/connectors.py. ولا ترى عمليات التثبيت القائمة أي تغيير حتى يفعّل تاجر إحداها.",
        },
      },
      {
        key: "79217c4",
        hash: "79217c4",
        date: "2026-11-26",
        type: "feat",
        subject: "feat(workflow): queue inbound triggers when the node is offline",
        feature: true,
        what: {
          en: "Inbound workflow triggers no longer fail when the chat node is offline: the plugin saves the trigger to outbox or workflow_approvals and answers 202 with status queued_local or pending_approval plus delivery_mode standalone_gateway; only a trigger that was neither sent nor queued is a 502. Changes gateway/app/main.py and workflow_webhook_plugin.py.",
          ru: "Входящие триггеры workflow больше не падают, когда чат-нода офлайн: плагин сохраняет триггер в outbox или workflow_approvals и отвечает 202 со статусом queued_local или pending_approval плюс delivery_mode standalone_gateway; 502 получает только триггер, который не был ни отправлен, ни поставлен в очередь. Меняет gateway/app/main.py и workflow_webhook_plugin.py.",
          de: "Eingehende Workflow-Trigger scheitern nicht mehr, wenn der Chat-Knoten offline ist: Das Plugin legt den Trigger in outbox oder workflow_approvals ab und antwortet mit 202, Status queued_local oder pending_approval plus delivery_mode standalone_gateway; nur ein Trigger, der weder gesendet noch eingereiht wurde, ist ein 502. Ändert gateway/app/main.py und workflow_webhook_plugin.py.",
          fr: "Les déclencheurs workflow entrants n’échouent plus quand le nœud de chat est hors ligne : le plugin enregistre le déclencheur dans outbox ou workflow_approvals et répond 202 avec le statut queued_local ou pending_approval et delivery_mode standalone_gateway ; seul un déclencheur ni envoyé ni mis en file reçoit un 502. Modifie gateway/app/main.py et workflow_webhook_plugin.py.",
          it: "I trigger workflow in ingresso non falliscono più quando il nodo chat è offline: il plugin salva il trigger in outbox o workflow_approvals e risponde 202 con stato queued_local o pending_approval più delivery_mode standalone_gateway; solo un trigger né inviato né accodato è un 502. Modifica gateway/app/main.py e workflow_webhook_plugin.py.",
          nl: "Inkomende workflow-triggers falen niet meer wanneer de chat-node offline is: de plug-in bewaart de trigger in outbox of workflow_approvals en antwoordt met 202 en status queued_local of pending_approval plus delivery_mode standalone_gateway; alleen een trigger die niet verzonden en niet in de wachtrij staat is een 502. Wijzigt gateway/app/main.py en workflow_webhook_plugin.py.",
          cs: "Příchozí workflow triggery už neselhávají, když je chat uzel offline: plugin uloží trigger do outbox nebo workflow_approvals a odpoví 202 se stavem queued_local nebo pending_approval a delivery_mode standalone_gateway; 502 dostane jen trigger, který nebyl ani odeslán, ani zařazen do fronty. Mění gateway/app/main.py a workflow_webhook_plugin.py.",
          "zh-Hans": "聊天节点离线时，入站 workflow 触发器不再失败：插件把触发器写进 outbox 或 workflow_approvals，并以 202 应答，状态为 queued_local 或 pending_approval，附带 delivery_mode standalone_gateway；只有既未发出、也未入队的触发器才返回 502。改动 gateway/app/main.py 和 workflow_webhook_plugin.py。",
          "zh-Hant": "聊天節點離線時，入站 workflow 觸發器不再失敗：外掛把觸發器寫進 outbox 或 workflow_approvals，並以 202 應答，狀態為 queued_local 或 pending_approval，附帶 delivery_mode standalone_gateway；只有既未送出、也未入列的觸發器才回傳 502。改動 gateway/app/main.py 和 workflow_webhook_plugin.py。",
          es: "Los disparadores workflow entrantes ya no fallan cuando el nodo de chat está fuera de línea: el complemento guarda el disparador en outbox o workflow_approvals y responde 202 con estado queued_local o pending_approval más delivery_mode standalone_gateway; solo un disparador que no se envió ni se encoló recibe un 502. Cambia gateway/app/main.py y workflow_webhook_plugin.py.",
          pl: "Przychodzące wyzwalacze workflow nie zawodzą już, gdy węzeł czatu jest offline: wtyczka zapisuje wyzwalacz w outbox lub workflow_approvals i odpowiada 202 ze statusem queued_local lub pending_approval oraz delivery_mode standalone_gateway; 502 dostaje tylko wyzwalacz, którego ani nie wysłano, ani nie zakolejkowano. Zmienia gateway/app/main.py i workflow_webhook_plugin.py.",
          ja: "チャットノードがオフラインでも、受信ワークフロートリガーは失敗しなくなりました。プラグインはトリガーを outbox または workflow_approvals に保存し、状態 queued_local または pending_approval と delivery_mode standalone_gateway を付けて 202 を返します。送信もキュー投入もされなかったトリガーだけが 502 です。gateway/app/main.py と workflow_webhook_plugin.py を変更します。",
          th: "ทริกเกอร์ workflow ขาเข้าไม่ล้มเหลวอีกต่อไปเมื่อโหนดแชตออฟไลน์: ปลั๊กอินบันทึกทริกเกอร์ลง outbox หรือ workflow_approvals แล้วตอบ 202 พร้อมสถานะ queued_local หรือ pending_approval และ delivery_mode standalone_gateway เฉพาะทริกเกอร์ที่ไม่ได้ส่งและไม่ได้เข้าคิวเท่านั้นจึงเป็น 502 เปลี่ยน gateway/app/main.py และ workflow_webhook_plugin.py",
          fi: "Saapuvat workflow-liipaisimet eivät enää epäonnistu, kun chat-solmu on offline: lisäosa tallentaa liipaisimen outbox- tai workflow_approvals-tauluun ja vastaa 202 tilalla queued_local tai pending_approval sekä delivery_mode standalone_gateway; vain liipaisin, jota ei lähetetty eikä jonotettu, on 502. Muuttaa tiedostoja gateway/app/main.py ja workflow_webhook_plugin.py.",
          uk: "Вхідні тригери workflow більше не падають, коли чат-нода офлайн: плагін зберігає тригер в outbox або workflow_approvals і відповідає 202 зі статусом queued_local чи pending_approval плюс delivery_mode standalone_gateway; 502 отримує лише тригер, який не було ні надіслано, ні поставлено в чергу. Змінює gateway/app/main.py і workflow_webhook_plugin.py.",
          bg: "Входящите workflow тригери вече не се провалят, когато чат възелът е офлайн: плъгинът записва тригера в outbox или workflow_approvals и отговаря 202 със статус queued_local или pending_approval плюс delivery_mode standalone_gateway; само тригер, който не е нито изпратен, нито на опашка, получава 502. Променя gateway/app/main.py и workflow_webhook_plugin.py.",
          tr: "Sohbet düğümü çevrimdışıyken gelen workflow tetikleyicileri artık başarısız olmuyor: eklenti tetikleyiciyi outbox veya workflow_approvals içine kaydeder ve queued_local ya da pending_approval durumu ile delivery_mode standalone_gateway ekleyerek 202 döndürür; yalnızca ne gönderilen ne de kuyruğa alınan tetikleyici 502 olur. gateway/app/main.py ve workflow_webhook_plugin.py dosyalarını değiştirir.",
          hu: "A bejövő workflow-eseményindítók már nem hibáznak, ha a chat-csomópont offline: a bővítmény az outbox vagy workflow_approvals táblába menti az eseményindítót, és 202-t válaszol queued_local vagy pending_approval állapottal, delivery_mode standalone_gateway kíséretében; csak az a kiváltó kap 502-t, amelyet sem elküldeni, sem sorba állítani nem sikerült. A gateway/app/main.py és a workflow_webhook_plugin.py fájlt módosítja.",
          "pt-BR": "Gatilhos de workflow de entrada não falham mais quando o nó de chat está offline: o plug-in salva o gatilho em outbox ou workflow_approvals e responde 202 com status queued_local ou pending_approval e delivery_mode standalone_gateway; só um gatilho que não foi nem enviado nem enfileirado é um 502. Altera gateway/app/main.py e workflow_webhook_plugin.py.",
          ko: "이제 채팅 노드가 오프라인이어도 인바운드 워크플로 트리거가 실패하지 않습니다: 플러그인이 트리거를 outbox 또는 workflow_approvals에 저장하고 status queued_local 또는 pending_approval과 delivery_mode standalone_gateway를 담아 202로 응답합니다. 전송되지도 대기열에 들어가지도 않은 트리거만 502입니다. gateway/app/main.py와 workflow_webhook_plugin.py를 변경합니다.",
          ar: "لم تعد محفّزات سير العمل الواردة تفشل عندما تكون عقدة المحادثة غير متصلة: فالإضافة تحفظ المحفّز في outbox أو workflow_approvals وتجيب بالرمز 202 مع الحالة queued_local أو pending_approval إضافةً إلى delivery_mode standalone_gateway؛ ولا يكون 502 إلا لمحفّز لم يُرسل ولم يُدرج في قائمة الانتظار. يغيّر gateway/app/main.py وworkflow_webhook_plugin.py.",
        },
      },
      {
        key: "a6c1632",
        hash: "a6c1632",
        date: "2026-11-26",
        type: "feat",
        subject: "feat(privacy): adopt opaque encrypted invite links and QR codes for service accounts",
        feature: true,
        what: {
          en: "Service-account invite links become opaque and encrypted, with QR codes: gateway/app/opaque_invite_codec.py (plus opaque_invite_vectors.json) seals the link behind POST /api/v1/invite-links, and invite_link_audit stores only created_at_ms, kind, subject_id and code_prefix — never the link or the relay URI.",
          ru: "Инвайт-ссылки сервисных аккаунтов становятся непрозрачными и зашифрованными, с QR-кодами: gateway/app/opaque_invite_codec.py (плюс opaque_invite_vectors.json) запечатывает ссылку за POST /api/v1/invite-links, а invite_link_audit хранит только created_at_ms, kind, subject_id и code_prefix — никогда саму ссылку или relay URI.",
          de: "Einladungslinks für Service-Accounts werden undurchsichtig und verschlüsselt, samt QR-Codes: gateway/app/opaque_invite_codec.py (plus opaque_invite_vectors.json) versiegelt den Link hinter POST /api/v1/invite-links, und invite_link_audit speichert nur created_at_ms, kind, subject_id und code_prefix – nie den Link oder die Relay-URI.",
          fr: "Les liens d’invitation des comptes de service deviennent opaques et chiffrés, avec QR codes : gateway/app/opaque_invite_codec.py (et opaque_invite_vectors.json) scelle le lien derrière POST /api/v1/invite-links, et invite_link_audit ne conserve que created_at_ms, kind, subject_id et code_prefix — jamais le lien ni l’URI de relais.",
          it: "I link di invito degli account di servizio diventano opachi e cifrati, con codici QR: gateway/app/opaque_invite_codec.py (più opaque_invite_vectors.json) sigilla il link dietro POST /api/v1/invite-links, e invite_link_audit conserva solo created_at_ms, kind, subject_id e code_prefix — mai il link o l’URI di relay.",
          nl: "Uitnodigingslinks voor service-accounts worden ondoorzichtig en versleuteld, met QR-codes: gateway/app/opaque_invite_codec.py (plus opaque_invite_vectors.json) verzegelt de link achter POST /api/v1/invite-links, en invite_link_audit bewaart alleen created_at_ms, kind, subject_id en code_prefix — nooit de link of de relay-URI.",
          cs: "Pozvánkové odkazy servisních účtů jsou nyní neprůhledné a šifrované, s QR kódy: gateway/app/opaque_invite_codec.py (spolu s opaque_invite_vectors.json) zapečetí odkaz za POST /api/v1/invite-links a invite_link_audit ukládá jen created_at_ms, kind, subject_id a code_prefix — nikdy samotný odkaz ani relay URI.",
          "zh-Hans": "服务账号的邀请链接改为不透明加密形式，并配二维码：gateway/app/opaque_invite_codec.py（以及 opaque_invite_vectors.json）把链接封装在 POST /api/v1/invite-links 之后，invite_link_audit 只保存 created_at_ms、kind、subject_id 和 code_prefix —— 从不保存链接本身或中继 URI。",
          "zh-Hant": "服務帳號的邀請連結改為不透明加密形式，並附 QR 碼：gateway/app/opaque_invite_codec.py（以及 opaque_invite_vectors.json）把連結封裝在 POST /api/v1/invite-links 之後，invite_link_audit 只保存 created_at_ms、kind、subject_id 和 code_prefix —— 從不保存連結本身或中繼 URI。",
          es: "Los enlaces de invitación de las cuentas de servicio pasan a ser opacos y cifrados, con códigos QR: gateway/app/opaque_invite_codec.py (más opaque_invite_vectors.json) sella el enlace detrás de POST /api/v1/invite-links, e invite_link_audit solo guarda created_at_ms, kind, subject_id y code_prefix: nunca el enlace ni la URI de retransmisión.",
          pl: "Linki zaproszeń kont usługowych stają się nieprzejrzyste i szyfrowane, z kodami QR: gateway/app/opaque_invite_codec.py (oraz opaque_invite_vectors.json) pieczętuje link za POST /api/v1/invite-links, a invite_link_audit przechowuje tylko created_at_ms, kind, subject_id i code_prefix — nigdy samego linku ani URI przekaźnika.",
          ja: "サービスアカウントの招待リンクが不透明化・暗号化され、QR コードも付きます。gateway/app/opaque_invite_codec.py（および opaque_invite_vectors.json）がリンクを POST /api/v1/invite-links の背後で封緘し、invite_link_audit が保持するのは created_at_ms、kind、subject_id、code_prefix のみで、リンク本体やリレー URI は保存しません。",
          th: "ลิงก์เชิญของบัญชีบริการกลายเป็นแบบทึบและเข้ารหัส พร้อมคิวอาร์โค้ด: gateway/app/opaque_invite_codec.py (และ opaque_invite_vectors.json) ผนึกลิงก์ไว้หลัง POST /api/v1/invite-links และ invite_link_audit เก็บเพียง created_at_ms, kind, subject_id และ code_prefix เท่านั้น ไม่เคยเก็บลิงก์หรือ relay URI",
          fi: "Palvelutilien kutsulinkit muuttuvat läpinäkymättömiksi ja salatuiksi, QR-koodeilla: gateway/app/opaque_invite_codec.py (sekä opaque_invite_vectors.json) sinetöi linkin POST /api/v1/invite-linksin taakse, ja invite_link_audit säilyttää vain kentät created_at_ms, kind, subject_id ja code_prefix — ei koskaan itse linkkiä tai relay-URI:a.",
          uk: "Запрошувальні посилання сервісних акаунтів стають непрозорими й зашифрованими, з QR-кодами: gateway/app/opaque_invite_codec.py (разом з opaque_invite_vectors.json) запечатує посилання за POST /api/v1/invite-links, а invite_link_audit зберігає лише created_at_ms, kind, subject_id і code_prefix — ніколи саме посилання чи relay URI.",
          bg: "Линковете за покани на сервизни акаунти стават непрозрачни и криптирани, с QR кодове: gateway/app/opaque_invite_codec.py (плюс opaque_invite_vectors.json) запечатва линка зад POST /api/v1/invite-links, а invite_link_audit пази само created_at_ms, kind, subject_id и code_prefix — никога линка или relay URI.",
          tr: "Hizmet hesabı davet bağlantıları opak ve şifreli hale geliyor, QR kodlarıyla: gateway/app/opaque_invite_codec.py (ve opaque_invite_vectors.json) bağlantıyı POST /api/v1/invite-links arkasında mühürler ve invite_link_audit yalnızca created_at_ms, kind, subject_id ile code_prefix saklar — bağlantıyı ya da relay URIʼsini asla.",
          hu: "A szolgáltatásfiókok meghívólinkjei átláthatatlan, titkosított formára váltanak, QR-kódokkal: a gateway/app/opaque_invite_codec.py (és az opaque_invite_vectors.json) a POST /api/v1/invite-links mögött pecsételi le a linket, az invite_link_audit pedig csak created_at_ms, kind, subject_id és code_prefix mezőket tárol — soha nem magát a linket vagy a relay URI-t.",
          "pt-BR": "Os links de convite de conta de serviço ficam opacos e criptografados, com códigos QR: gateway/app/opaque_invite_codec.py (mais opaque_invite_vectors.json) sela o link por trás de POST /api/v1/invite-links, e invite_link_audit armazena apenas created_at_ms, kind, subject_id e code_prefix — nunca o link nem a URI do relay.",
          ko: "서비스 계정 초대 링크가 QR 코드와 함께 불투명하고 암호화된 형태가 됩니다: gateway/app/opaque_invite_codec.py(opaque_invite_vectors.json 포함)가 POST /api/v1/invite-links 뒤에서 링크를 봉인하며, invite_link_audit는 created_at_ms, kind, subject_id, code_prefix만 저장하고 링크나 릴레이 URI는 결코 저장하지 않습니다.",
          ar: "تصبح روابط دعوة حسابات الخدمة معتمة ومشفّرة، مع رموز QR: يختم gateway/app/opaque_invite_codec.py (مع opaque_invite_vectors.json) الرابط خلف POST /api/v1/invite-links، ولا يخزّن invite_link_audit سوى created_at_ms وkind وsubject_id وcode_prefix — ولا يخزّن الرابط أو URI المرحّل أبدًا.",
        },
      },
      {
        key: "d68f2d5",
        hash: "d68f2d5",
        date: "2026-11-26",
        type: "feat",
        subject: "feat(gateway): implement planned mp.popopx.chat portal features and tests",
        feature: true,
        what: {
          en: "The portal-completion commit: an operator-held vault (POPOPX_VAULT_KEY, seven sealed columns, python3 -m app.main --migrate-secrets), scoped pxa_ admin tokens with an audit trail, a timestamped HMAC for alert webhooks, the Slack/Discord plugin and a pytest adapter over the self-tests. Adds gateway/app/vault.py, admin_auth.py and plugins/slack_discord_plugin.py, and extends alert_ops_plugin.py and tests/.",
          ru: "Коммит, завершающий портальный набор: хранилище под ключом оператора (POPOPX_VAULT_KEY, семь запечатанных столбцов, python3 -m app.main --migrate-secrets), ограниченные токены администратора pxa_ с аудитом, HMAC с отметкой времени для вебхуков алертов, плагин Slack/Discord и адаптер pytest над самотестами. Добавляет gateway/app/vault.py, admin_auth.py и plugins/slack_discord_plugin.py, расширяет alert_ops_plugin.py и tests/.",
          de: "Der Portal-Abschluss-Commit: ein vom Betreiber gehaltener Tresor (POPOPX_VAULT_KEY, sieben versiegelte Spalten, python3 -m app.main --migrate-secrets), bereichsgebundene pxa_-Admin-Tokens mit Audit-Spur, ein zeitgestempelter HMAC für Alert-Webhooks, das Slack/Discord-Plugin und ein pytest-Adapter über den Selbsttests. Fügt gateway/app/vault.py, admin_auth.py und plugins/slack_discord_plugin.py hinzu und erweitert alert_ops_plugin.py sowie tests/.",
          fr: "Le commit qui achève le portail : un coffre détenu par l’opérateur (POPOPX_VAULT_KEY, sept colonnes scellées, python3 -m app.main --migrate-secrets), des jetons admin pxa_ à portée limitée avec piste d’audit, un HMAC horodaté pour les webhooks d’alerte, le plugin Slack/Discord et un adaptateur pytest par-dessus les autotests. Ajoute gateway/app/vault.py, admin_auth.py et plugins/slack_discord_plugin.py, et étend alert_ops_plugin.py et tests/.",
          it: "Il commit che completa il portale: una cassaforte tenuta dall’operatore (POPOPX_VAULT_KEY, sette colonne sigillate, python3 -m app.main --migrate-secrets), token admin pxa_ con ambito limitato e traccia di audit, un HMAC con timestamp per i webhook degli alert, il plugin Slack/Discord e un adattatore pytest sopra i self-test. Aggiunge gateway/app/vault.py, admin_auth.py e plugins/slack_discord_plugin.py, ed estende alert_ops_plugin.py e tests/.",
          nl: "De portal-voltooiing-commit: een kluis in handen van de operator (POPOPX_VAULT_KEY, zeven verzegelde kolommen, python3 -m app.main --migrate-secrets), beperkte pxa_-admintokens met auditspoor, een getimestempelde HMAC voor alert-webhooks, de Slack/Discord-plug-in en een pytest-adapter bovenop de zelftests. Voegt gateway/app/vault.py, admin_auth.py en plugins/slack_discord_plugin.py toe en breidt alert_ops_plugin.py en tests/ uit.",
          cs: "Commit dokončující portál: trezor pod kontrolou operátora (POPOPX_VAULT_KEY, sedm zapečetěných sloupců, python3 -m app.main --migrate-secrets), omezené admin tokeny pxa_ s auditem, HMAC s časovým razítkem pro alert webhooky, plugin Slack/Discord a adaptér pytest nad self-testy. Přidává gateway/app/vault.py, admin_auth.py a plugins/slack_discord_plugin.py a rozšiřuje alert_ops_plugin.py a tests/.",
          "zh-Hans": "完成门户功能的提交：由运维方自持的保险库（POPOPX_VAULT_KEY、七个密封列、python3 -m app.main --migrate-secrets），带审计的 pxa_ 限定范围管理令牌，告警 webhook 的时间戳 HMAC，Slack/Discord 插件，以及架在自检之上的 pytest 适配。新增 gateway/app/vault.py、admin_auth.py 和 plugins/slack_discord_plugin.py，并扩展 alert_ops_plugin.py 与 tests/。",
          "zh-Hant": "完成入口功能的提交：由維運方自持的保險庫（POPOPX_VAULT_KEY、七個密封欄、python3 -m app.main --migrate-secrets），帶稽核的 pxa_ 限定範圍管理權杖，告警 webhook 的時間戳 HMAC，Slack/Discord 外掛，以及架在自檢之上的 pytest 適配。新增 gateway/app/vault.py、admin_auth.py 和 plugins/slack_discord_plugin.py，並擴充 alert_ops_plugin.py 與 tests/。",
          es: "El commit que completa el portal: una bóveda en manos del operador (POPOPX_VAULT_KEY, siete columnas selladas, python3 -m app.main --migrate-secrets), tokens de administración pxa_ con alcance limitado y auditoría, un HMAC con marca de tiempo para los webhooks de alertas, el complemento Slack/Discord y un adaptador pytest sobre las autopruebas. Añade gateway/app/vault.py, admin_auth.py y plugins/slack_discord_plugin.py, y amplía alert_ops_plugin.py y tests/.",
          pl: "Commit domykający portal: sejf trzymany przez operatora (POPOPX_VAULT_KEY, siedem zapieczętowanych kolumn, python3 -m app.main --migrate-secrets), ograniczone tokeny administracyjne pxa_ ze ścieżką audytu, HMAC ze znacznikiem czasu dla webhooków alertów, wtyczka Slack/Discord i adapter pytest nad autotestami. Dodaje gateway/app/vault.py, admin_auth.py i plugins/slack_discord_plugin.py oraz rozszerza alert_ops_plugin.py i tests/.",
          ja: "ポータル完成のコミットです。運用者自身が保持する Vault（POPOPX_VAULT_KEY、7つの封緘列、python3 -m app.main --migrate-secrets）、監査付きのスコープ限定 pxa_ 管理トークン、アラート webhook 用のタイムスタンプ付き HMAC、Slack/Discord プラグイン、セルフテスト上に載る pytest アダプタを導入します。gateway/app/vault.py、admin_auth.py、plugins/slack_discord_plugin.py を追加し、alert_ops_plugin.py と tests/ を拡張します。",
          th: "คอมมิตที่ทำให้พอร์ทัลครบ: ห้องนิรภัยที่ผู้ปฏิบัติการถือกุญแจเอง (POPOPX_VAULT_KEY, เจ็ดคอลัมน์ที่ผนึกไว้, python3 -m app.main --migrate-secrets), โทเคนผู้ดูแล pxa_ แบบจำกัดขอบเขตพร้อมการตรวจสอบ, HMAC ที่มีเวลากำกับสำหรับ webhook แจ้งเตือน, ปลั๊กอิน Slack/Discord และตัวปรับ pytest บน self-test เพิ่ม gateway/app/vault.py, admin_auth.py และ plugins/slack_discord_plugin.py พร้อมขยาย alert_ops_plugin.py และ tests/",
          fi: "Portaalin viimeistelevä commit: operaattorin hallussa oleva holvi (POPOPX_VAULT_KEY, seitsemän sinetöityä saraketta, python3 -m app.main --migrate-secrets), rajatur pxa_-ylläpitotunnukset auditointijäljellä, aikaleimattu HMAC alert-webhookeille, Slack/Discord-lisäosa ja pytest-sovitin itsetestien päällä. Lisää tiedostot gateway/app/vault.py, admin_auth.py ja plugins/slack_discord_plugin.py sekä laajentaa tiedostoja alert_ops_plugin.py ja tests/.",
          uk: "Коміт, що завершує портал: сховище під ключем оператора (POPOPX_VAULT_KEY, сім запечатаних стовпців, python3 -m app.main --migrate-secrets), обмежені адмін-токени pxa_ з аудитом, HMAC з відміткою часу для вебхуків алертів, плагін Slack/Discord і адаптер pytest над самотестами. Додає gateway/app/vault.py, admin_auth.py та plugins/slack_discord_plugin.py, розширює alert_ops_plugin.py і tests/.",
          bg: "Комитът, който завършва портала: трезор, държан от оператора (POPOPX_VAULT_KEY, седем запечатани колони, python3 -m app.main --migrate-secrets), ограничени pxa_ администраторски токени с одит, HMAC с времеви печат за alert webhook-ове, плъгинът Slack/Discord и pytest адаптер върху самотестовете. Добавя gateway/app/vault.py, admin_auth.py и plugins/slack_discord_plugin.py и разширява alert_ops_plugin.py и tests/.",
          tr: "Portalı tamamlayan kayıt: operatörün elinde tuttuğu kasa (POPOPX_VAULT_KEY, yedi mühürlü sütun, python3 -m app.main --migrate-secrets), denetim izli kapsamlı pxa_ yönetici belirteçleri, alert webhook'ları için zaman damgalı HMAC, Slack/Discord eklentisi ve öz testler üzerinde bir pytest bağdaştırıcısı. gateway/app/vault.py, admin_auth.py ve plugins/slack_discord_plugin.py dosyalarını ekler; alert_ops_plugin.py ve tests/ dosyalarını genişletir.",
          hu: "A portált lezáró commit: operátor kezében tartott széf (POPOPX_VAULT_KEY, hét lepecsételt oszlop, python3 -m app.main --migrate-secrets), hatáskörrel rendelkező pxa_ admin tokenek auditnyommal, időbélyeges HMAC az alert webhookokhoz, a Slack/Discord bővítmény és a selftesztek fölötti pytest adapter. Hozzáadja a gateway/app/vault.py, admin_auth.py és plugins/slack_discord_plugin.py fájlt, valamint bővíti az alert_ops_plugin.py-t és a tests/ könyvtárat.",
          "pt-BR": "O commit de conclusão do portal: um cofre mantido pelo operador (POPOPX_VAULT_KEY, sete colunas seladas, python3 -m app.main --migrate-secrets), tokens de administração pxa_ com escopo e trilha de auditoria, um HMAC com carimbo de data e hora para webhooks de alerta, o plug-in Slack/Discord e um adaptador pytest sobre os autotestes. Adiciona gateway/app/vault.py, admin_auth.py e plugins/slack_discord_plugin.py, e estende alert_ops_plugin.py e tests/.",
          ko: "포털 완성 커밋: 운영자가 보유하는 볼트(POPOPX_VAULT_KEY, 봉인된 7개 컬럼, python3 -m app.main --migrate-secrets), 감사 추적이 붙은 스코프 pxa_ 관리자 토큰, 알림 웹훅용 타임스탬프 HMAC, Slack/Discord 플러그인, 그리고 자체 테스트 위의 pytest 어댑터입니다. gateway/app/vault.py, admin_auth.py, plugins/slack_discord_plugin.py를 추가하고 alert_ops_plugin.py와 tests/를 확장합니다.",
          ar: "إيداع استكمال البوابة: خزنة يحتفظ بها مشغّل النظام (POPOPX_VAULT_KEY، وسبعة أعمدة مختومة، وpython3 -m app.main --migrate-secrets)، ورموز إدارية pxa_ محددة النطاق مع مسار تدقيق، وHMAC بطابع زمني لويب هوك التنبيهات، وإضافة Slack/Discord، ومهايئ pytest فوق الاختبارات الذاتية. يضيف gateway/app/vault.py وadmin_auth.py وplugins/slack_discord_plugin.py، ويوسّع alert_ops_plugin.py وtests/.",
        },
      },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────────────
 * 5. Portal changelog — this site's own dated history
 * ───────────────────────────────────────────────────────────────────────── */

const PORTAL_TITLE: Localized<string> = {
  en: "This portal’s own dated history",
  ru: "Собственная история портала",
  de: "Die eigene Geschichte dieses Portals",
  fr: "L’historique daté de ce portail",
  it: "La cronologia datata di questo portale",
  nl: "De eigen datumgeschiedenis van dit portaal",
  cs: "Vlastní historie tohoto portálu",
  "zh-Hans": "本门户自己的带日期历史",
  "zh-Hant": "本入口自己的帶日期歷史",
  es: "El historial fechado de este propio portal",
  pl: "Własna historia tego portalu",
  ja: "このポータル自身の履歴",
  th: "ประวัติลงวันที่ของพอร์ทัลนี้เอง",
  fi: "Tämän portaalin oma päivätty historia",
  uk: "Власна історія цього порталу",
  bg: "Собствената дата по дата история на портала",
  tr: "Bu portalın kendi tarihli geçmişi",
  hu: "Ennek a portálnak a saját dátumozott előzménye",
  "pt-BR": "O histórico datado deste portal",
  ko: "이 포털 자체의 날짜별 이력",
  ar: "تاريخ هذه البوابة نفسه، موثّقًا بالتواريخ",
};

const PORTAL_LEDE: Localized<string> = {
  en: "The same rule applies to this page: the rows below are commits in the portal repository, read from git log with their real dates. Two of them carry no hash, because they were never commits — a deploy someone ran by hand on the server, and the revision you are looking at now.",
  ru: "То же правило — к этой же странице: строки ниже — коммиты в репозитории портала, прочитанные из git log с настоящими датами. У двух из них нет хеша, потому что они никогда не были коммитами: развёртывание, которое кто-то запустил руками на сервере, и ревизия, которую вы сейчас видите.",
  de: "Dieselbe Regel gilt für diese Seite: Die Zeilen unten sind Commits im Portal-Repository, mit echten Daten aus git log. Zwei davon tragen keinen Hash, weil sie nie Commits waren – ein Deploy, das jemand auf dem Server von Hand ausführt, und die Revision, die Sie gerade ansehen.",
  fr: "La même règle s’applique à cette page : les lignes ci-dessous sont des commits du dépôt du portail, lus dans git log avec leurs vraies dates. Deux d’entre elles n’ont pas de hash, car ce n’ont jamais été des commits — un déploiement exécuté à la main sur le serveur, et la révision que vous consultez actuellement.",
  it: "La stessa regola vale per questa pagina: le righe sotto sono commit del repository del portale, letti da git log con le date reali. Due di queste non hanno hash, perché non sono mai state commit — un deploy eseguito a mano sul server e la revisione che state leggendo adesso.",
  nl: "Dezelfde regel geldt voor deze pagina: de regels hieronder zijn commits in de portal-repository, met echte data uit git log. Twee ervan dragen geen hash, omdat ze nooit commits zijn geweest — een deploy die iemand handmatig op de server uitvoert, en de revisie die u nu bekijkt.",
  cs: "Stejné pravidlo platí i pro tuto stránku: řádky níže jsou commity v repozitáři portálu, přečtené z git log s reálnými daty. Dva z nich nemají hash, protože nikdy commity nebyly — nasazení, které někna serveru spustil ručně, a revize, kterou právě prohlížíte.",
  "zh-Hans": "同一条规则也用在本站身上：下面的每一行都是门户仓库里的一次提交，日期取自 git log。其中两行没有哈希，因为它们从来不是提交 —— 一次是有人在服务器上手动跑的部署，一次是你此刻正在读的这版改动。",
  "zh-Hant": "同一條規則也用在本站身上：下面的每一行都是入口倉庫裡的一次提交，日期取自 git log。其中兩列沒有雜湊值，因為牠們從來不是提交 —— 一次是有人在伺服器上手動跑的部署，一次是你此刻正在讀的這版改動。",
  es: "La misma regla aplica a esta página: las filas de abajo son commits en el repositorio del portal, leídos de git log con sus fechas reales. Dos de ellas no llevan hash porque nunca fueron commits — un despliegue que alguien ejecuta a mano en el servidor y la revisión que está leyendo ahora.",
  pl: "Ta sama zasada dotyczy tej strony: poniższe wiersze to commity w repozytorium portalu, odczytane z git log z prawdziwymi datami. Dwa z nich nie mają skrótu, bo nigdy nie były commitami — wdrożenie odpalane ręcznie na serwerze oraz rewizja, którą właśnie czytasz.",
  ja: "同じルールはこのページ自身にも適用しています。以下の行はポータルリポジトリのコミットで、日付は git log から取りました。2行はハッシュがありません。コミットではなかったからです——1つはサーバー上で誰かが手動で実行したデプロイ、もう1つはいまご覧になっている改版です。",
  th: "กติกาเดียวกันใช้กับหน้านี้ด้วย: แถวด้านล่างคือคอมมิตในรีโปพอร์ทัลที่อ่านจาก git log พร้อมวันที่จริง สองแถวไม่มีแฮช เพราะไม่เคยเป็นคอมมิตเลย — เป็นการ deploy ที่ใครสักคนรันเองบนเซิร์ฟเวอร์ และการแก้ไขที่คุณกำลังดูอยู่ตอนนี้",
  fi: "Sama sääntö päteei tähän sivuun: alla olevat rivit ovat portaalin repositorion committeja aitoine päivineen git logista. Kahdella rivillä ei ole tiivistettä, koska ne eivät ole koskaan olleet committeja — palvelimella käsin ajettu käyttöönotto sekä versio, jota luette nyt.",
  uk: "Те саме правило стосується цієї сторінки: рядки нижче — це коміти в репозиторії порталу з реальними датами з git log. У двох із них немає хеша, бо вони ніколи не були комітами: розгортання, яке хтось запустив на сервері вручну, і ревзія, яку ви зараз бачите.",
  bg: "Същото правило важи и за тази страница: редовете по-долу са комити в хранилището на портала с истинските им дати от git log. Два от тях нямат хеш, защото никога не са били комити — внедряване, което някой пуска ръчно на сървъра, и ревизията, която четете сега.",
  tr: "Aynı kural bu sayfa için de geçerli: aşağıdaki satırlar portal deposundaki işlemlerdir ve tarihleri git logʼdan alınmıştır. İkisinde karma yok, çünkü hiç işlem olmadılar — sunucuda birinin elle çalıştırdığı bir dağıtım ve şu an okuduğunuz sürüm.",
  hu: "Ugyanez a szabály él magára az oldalra: az alábbi sorok a portál repójában lévő commitok, a dátumaik a git logból valók. Kettő nem tartalmaz hash-t, mert sosem voltak commitok — egy kézzel futtatott telepítés a szerveren, és az a javítás, amelyet most olvas.",
  "pt-BR": "A mesma regra vale para esta página: as linhas abaixo são commits do repositório do portal, lidos do git log com as suas datas reais. Duas delas não trazem hash, porque nunca foram commits — um deploy que alguém executou à mão no servidor, e a revisão que você está vendo agora.",
  ko: "같은 규칙이 이 페이지에도 적용됩니다: 아래 행들은 포털 저장소의 커밋이며, 실제 날짜와 함께 git log에서 읽어 왔습니다. 두 행에는 해시가 없는데, 커밋이 아니었기 때문입니다. 누군가 서버에서 손으로 실행한 배포와, 지금 보고 있는 리비전입니다.",
  ar: "تنطبق القاعدة نفسها على هذه الصفحة: الصفوف أدناه إيداعات في مستودع البوابة، مقروءة من git log بتواريخها الحقيقية. واثنان منها بلا تجزئة، لأنهما لم يكونا إيداعين قط — نشرٌ شغّله أحدهم يدويًا على الخادم، والمراجعة التي تنظر إليها الآن.",
};

const PORTAL_NOHASH: Localized<string> = {
  en: "no commit · run by hand",
  ru: "нет коммита · сделано вручную",
  de: "kein Commit · von Hand ausgeführt",
  fr: "aucun commit · exécuté à la main",
  it: "nessun commit · eseguito a mano",
  nl: "geen commit · handmatig uitgevoerd",
  cs: "žádný commit · spuštěno ručně",
  "zh-Hans": "无提交 · 手动执行",
  "zh-Hant": "無提交 · 手動執行",
  es: "sin commit · ejecutado a mano",
  pl: "bez commitu · uruchomione ręcznie",
  ja: "コミットなし · 手動実行",
  th: "ไม่มีคอมมิต · รันเองด้วยมือ",
  fi: "ei commitia · ajettu käsin",
  uk: "без коміту · виконано вручну",
  bg: "без комит · изпълнено ръчно",
  tr: "kayıt yok · elle çalıştırıldı",
  hu: "nincs commit · kézzel futtatva",
  "pt-BR": "sem commit · executado à mão",
  ko: "커밋 없음 · 수동 실행",
  ar: "بلا إيداع · تشغيل يدوي",
};

const PORTAL_UNCOMMITTED: Localized<string> = {
  en: "not committed yet",
  ru: "ещё не закоммичено",
  de: "noch nicht committet",
  fr: "pas encore committé",
  it: "non ancora committato",
  nl: "nog niet vastgelegd",
  cs: "zatím neocommitnuto",
  "zh-Hans": "尚未提交",
  "zh-Hant": "尚未提交",
  es: "aún sin commit",
  pl: "jeszcze nie zacommitowane",
  ja: "まだコミットされていません",
  th: "ยังไม่ถูกคอมมิต",
  fi: "ei vielä commitissa",
  uk: "ще не закомічено",
  bg: "все още не е комитнато",
  tr: "henüz işlenmedi",
  hu: "még nincs commitalva",
  "pt-BR": "ainda não commitado",
  ko: "아직 커밋되지 않음",
  ar: "لم يُودَع بعد",
};

const PORTAL_MANUAL_TITLE: Localized<string> = {
  en: "Deployment stays manual, by decision",
  ru: "Развёртывание остаётся ручным — это решение",
  de: "Deployment bleibt manuell – das ist eine Entscheidung",
  fr: "Le déploiement reste manuel, c’est décidé",
  it: "Il deploy resta manuale, per scelta",
  nl: "De deployment blijft handmatig, bewust",
  cs: "Nasazení zůstává ruční — je to rozhodnutí",
  "zh-Hans": "部署保持手动，这是决定，不是疏漏",
  "zh-Hant": "部署維持手動，這是決定，不是疏漏",
  es: "El despliegue sigue siendo manual, por decisión",
  pl: "Wdrożenie pozostaje ręczne — tak zdecydowano",
  ja: "デプロイは手動のまま。これは判断です",
  th: "การ deploy ยังเป็นแบบ manual ตามการตัดสินใจ",
  fi: "Käyttöönotto pysyy käsin tehtävänä, tahdallaan",
  uk: "Розгортання лишається ручним — це рішення",
  bg: "Внедряването си остава ръчно, по решение",
  tr: "Dağıtımelle yapılır, bu bir karar",
  hu: "A telepítés szándékosan maradt kézi",
  "pt-BR": "A implantação continua manual, por decisão",
  ko: "배포는 결정에 따라 수동으로 유지됩니다",
  ar: "يبقى النشر يدويًا، بقرار",
};

const PORTAL_MANUAL_BODY: Localized<string> = {
  en: "This repository contains no .github directory and no workflow file, so nothing builds or publishes this page on its own. A release is someone running deploy/centos/deploy_centos.sh against the server, with nginx -t gating the reload. That choice is on record here instead of a badge, because a page about status should not imply a pipeline that no one built.",
  ru: "В этом репозитории нет каталога .github и нет файла workflow, поэтому ничего не собирает и не публикует эту страницу само. Релиз — это когда кто-то запускает deploy/centos/deploy_centos.sh на сервере, а перезагрузку пропускает через nginx -t. Это решение зафиксировано текстом, а не значком, потому что странице про статус не стоит намекать на конвейер, который никто не строил.",
  de: "In diesem Repository gibt es weder ein Verzeichnis .github noch eine Workflow-Datei, nichts baut oder veröffentlicht diese Seite von allein. Ein Release ist jemand, der deploy/centos/deploy_centos.sh gegen den Server laufen lässt, wobei nginx -t den Reload freigibt. Diese Entscheidung steht hier als Text statt als Badge, denn eine Seite über Status soll keine Pipeline andeuten, die nie jemand gebaut hat.",
  fr: "Ce dépôt ne contient ni dossier .github ni fichier workflow, donc rien ne construit ni ne publie cette page tout seul. Une publication, c’est quelqu’un qui exécute deploy/centos/deploy_centos.sh sur le serveur, avec nginx -t comme garde-fou du rechargement. Ce choix est consigné ici en texte plutôt qu’en badge, car une page sur le statut ne doit pas laisser croire à un pipeline que personne n’a construit.",
  it: "In questo repository non ci sono né la cartella .github né un file workflow, quindi nulla compila o pubblica questa pagina da solo. Una release è qualcuno che esegue deploy/centos/deploy_centos.sh sul server, con nginx -t a fare da guardiano al reload. Questa scelta è registrata qui come testo invece che come badge, perché una pagina sullo stato non deve far presupporre una pipeline che nessuno ha costruito.",
  nl: "Deze repository bevat geen map .github en geen workflow-bestand, dus niets bouwt of publiceert deze pagina vanzelf. Een release is iemand die deploy/centos/deploy_centos.sh tegen de server uitvoert, met nginx -t als poortwachter van de reload. Die keuze staat hier als tekst in plaats van als badge, want een pagina over status mag geen pipeline suggelleren die niemand gebouwd heeft.",
  cs: "Tento repozitář neobsahuje složku .github ani soubor workflow, takže nic tuto stránku nestaví ani nezveřejňuje samo. Release je někdo, kdo spustí deploy/centos/deploy_centos.sh proti serveru a nginx -t povolí reload. Toto rozhodnutí je zde zaznamenané textem místo odznaku, protože stránka o stavu nemá naznačovat pipeline, který nikdo nepostavil.",
  "zh-Hans": "本仓库既没有 .github 目录，也没有 workflow 文件，所以没有任何东西会自动构建或发布这一页。所谓发布，就是有人对着服务器跑一次 deploy/centos/deploy_centos.sh，并由 nginx -t 决定是否 reload。这件事写在这里是一段说明，而不是一枚徽章 —— 一节讲状态的内容不该暗示一条没人搭建过的流水线。",
  "zh-Hant": "本倉庫既沒有 .github 目錄，也沒有 workflow 檔案，所以沒有任何東西會自動建構或發布這一頁。所謂發布，就是有人對伺服器跑一次 deploy/centos/deploy_centos.sh，並由 nginx -t 決定是否 reload。這件事寫在這裡是一段說明，而不是一個徽章 —— 一節講狀態的內容不該暗示一條沒人搭建過的管線。",
  es: "Este repositorio no tiene directorio .github ni archivo workflow, así que nada compila ni publica esta página por sí solo. Un lanzamiento es alguien ejecutando deploy/centos/deploy_centos.sh contra el servidor, con nginx -t decidiendo el recargo. Esa decisión queda aquí como texto en lugar de una insignia, porque una página sobre estado no debe insinuar una tubería que nadie construyó.",
  pl: "To repozytorium nie zawiera katalogu .github ani pliku workflow, więc nic samo nie buduje ani nie publikuje tej strony. Wydanie to ktoś uruchamiający deploy/centos/deploy_centos.sh na serwerze, a przeładowanie przechodzi przez nginx -t. Ta decyzja jest tu zapisana tekstem zamiast odznaką, bo strona o statusie nie powinna sugerować pipeline’u, którego nikt nie zbudował.",
  ja: "このリポジトリには .github ディレクトリも workflow ファイルもなく、このページを勝手にビルドしたり公開したりするものはありません。リリースとは、deploy/centos/deploy_centos.sh をサーバーに対して誰かが実行し、nginx -t がリロードを通すかどうかを決めることです。この判断はバッジではなく文章でここに残しています。状況についてのページが、誰も作っていない管道を匂わせるべきではないからです。",
  th: "รีโปนี้ไม่มีไดเรกทอรี .github และไม่มีไฟล์ workflow ไม่มีสิ่งใดสร้างหรือเผยแพร่หน้านี้เอง การออกเวอร์ชันคือคนที่รัน deploy/centos/deploy_centos.sh กับเซิร์ฟเวอร์โดยให้ nginx -t เป็นตัว deciding ว่าโหลดซ้ำได้ — เรื่องนี้บันทึกไว้เป็นข้อความแทนป้าย เพราะหน้าที่พูดถึงสถานะไม่ควรถ่ายให้รู้สึกว่ามีไปป์ไลน์ที่ไม่มีใครสร้าง",
  fi: "Tässä repositoriossa ei ole .github-hakemistoa eikä workflow-tiedostoa, joten mikään ei rakenna tai julkaise tätä sivua itsekseen. Julkaisu on henkilö, joka ajaa deploy/centos/deploy_centos.sh palvelimelle, ja nginx -t päästää latauksen läpi. Tämä valinta on täällä tekstinä eikä merkkinä, sillä tilaa käsittelevän sivun ei kuulu vihjata putkesta, jota kukaan ole rakentanut.",
  uk: "У цьому репозиторії немає каталогу .github і немає файла workflow, тому ніщо не збирає і не публікує цю сторінку саме. Реліз — це коли хтось запускає deploy/centos/deploy_centos.sh на сервері, а nginx -t вирішує, чи перевантажувати. Це рішення зафіксовано тут текстом, а не значком, бо сторінці про статус не варто натякати на пайплайн, який ніхто не будував.",
  bg: "В това хранилище няма директория .github и няма workflow файл, нищо не изгражда и не публикува тази страница от само себе си. Релийзът е някой, който пусне deploy/centos/deploy_centos.sh срещу сървъра, а nginx -t решава дали презареждането минава. Решението е записано тук като текст, а не като значка, защото страница за статус не трябва да намеква за фурия, която никто не е построил.",
  tr: "Bu depoda .github dizini de workflow dosyası da yok, yani bu sayfayı kendi kendine derleyen ya da yayınlayan bir şey yok. Sürüm, birinin sunucuya karşı deploy/centos/deploy_centos.sh çalıştırmasıdır ve yeniden yüklemeyi nginx -t onaylar. Bu tercih burada rozet yerine metin olarak duruyor, çünkü durum üzerine bir sayfanın kimsenin kurmadığı bir hattı ima etmemesi gerekir.",
  hu: "Ebben a repóban nincs .github könyvtár és nincs workflow fájl, tehát semmi nem fordítja és nem teszi közzé ezt az oldalt magától. A kiadás azt jelenti, hogy valaki lefuttatja a deploy/centos/deploy_centos.sh parancsot a szerver ellen, és az nginx -t dönt a reloadról. Ez a választás itt szövegként van rögzítve, nem jelvényként, mert egy státuszt tárgyyaló oldalnak nem kell olyan folyamatot sejtetnie, amelyet senki nem épített.",
  "pt-BR": "Este repositório não contém diretório .github nem arquivo de workflow, então nada compila ou publica esta página sozinho. Um lançamento é alguém executando deploy/centos/deploy_centos.sh contra o servidor, com nginx -t barrando o reload. Essa escolha fica registrada aqui em vez de um selo, porque uma página sobre status não deve sugerir um pipeline que ninguém construiu.",
  ko: "이 저장소에는 .github 디렉터리도 워크플로 파일도 없으므로, 이 페이지를 스스로 빌드하거나 게시하는 것은 아무것도 없습니다. 릴리스는 누군가 서버를 대상으로 deploy/centos/deploy_centos.sh를 실행하는 일이며, nginx -t가 리로드를 통제합니다. 그 선택은 배지 대신 여기에 기록됩니다. 상태를 다루는 페이지가 아무도 만들지 않은 파이프라인을 암시해서는 안 되기 때문입니다.",
  ar: "لا يحتوي هذا المستودع دليل .github ولا ملف سير عمل، فلا شيء يبني هذه الصفحة أو ينشرها من تلقاء نفسه. فالإصدار هو أن يشغّل أحدهم deploy/centos/deploy_centos.sh على الخادم، مع nginx -t كبوابة لإعادة التحميل. وهذا الخيار مسجّل هنا بدل شارة، لأن صفحة عن الحالة ينبغي ألا توحي بخط أنابيب لم يبنه أحد.",
};

export function StatusChangelogSection(): ReactElement {
  const pillAsof = useCopy(PILL_ASOF);
  const pillStatic = useCopy(PILL_STATIC);
  const pillRecipe = useCopy(PILL_RECIPE);
  const statusTitle = useCopy(STATUS_TITLE);
  const statusNote = useCopy(STATUS_NOTE);
  const recipeTitle = useCopy(RECIPE_TITLE);
  const recipeLede = useCopy(RECIPE_LEDE);
  const recipeCaption = useCopy(RECIPE_CAPTION);
  const recipeHint = useCopy(RECIPE_HINT);
  const backendTitle = useCopy(BACKEND_TITLE);
  const backendLede = useCopy(BACKEND_LEDE);
  const portalTitle = useCopy(PORTAL_TITLE);
  const portalLede = useCopy(PORTAL_LEDE);
  const portalNoHash = useCopy(PORTAL_NOHASH);
  const portalUncommitted = useCopy(PORTAL_UNCOMMITTED);
  const portalManualTitle = useCopy(PORTAL_MANUAL_TITLE);
  const portalManualBody = useCopy(PORTAL_MANUAL_BODY);

  return (
    <section id="changelog" className="relative py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 grain opacity-[0.06]" />
      <div className="section-wrap relative">
        <SectionHeading eyebrow={EYEBROW} title={TITLE} subtitle={SUBTITLE} />

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="pill">{pillAsof}</span>
          <span className="pill">{pillStatic}</span>
          <span className="pill">{pillRecipe}</span>
        </div>

        {/* Stats grid */}
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold text-white">{statusTitle}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-mute">{statusNote}</p>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STATS.map((stat) => (
              <div key={stat.key} className="glass glass-hover relative flex flex-col overflow-hidden p-5 [overflow-wrap:anywhere]">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-brand-soft opacity-60" />
                <p className="font-mono text-[11px] tracking-[0.18em] text-faint"><bdi dir="ltr">{stat.source}</bdi></p>
                <p className="mt-1.5 text-[22px] font-semibold leading-tight text-white">{stat.value}</p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-mute">{pick(stat.caption, "en")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recipe section */}
        <div className="glass mt-8 p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold text-white">{recipeTitle}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-mute">{recipeLede}</p>
          <div className="mt-4">
            <CodeBlock code={RECIPE_COMMANDS} caption={recipeCaption} maxHeightClass="max-h-64" />
          </div>
          <p className="mt-3 text-[11.5px] text-faint">{recipeHint}</p>
        </div>

        {/* Backend changelog */}
        <div className="mt-8">
          <h3 className="text-[15px] font-semibold text-white">{backendTitle}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-mute">{backendLede}</p>
          <div className="mt-5 space-y-6">
            {BACKEND_GROUPS.map((group) => (
              <div key={group.date} className="glass p-5">
                <p className="font-mono text-[11px] tracking-[0.18em] text-faint"><bdi dir="ltr">{group.date}</bdi></p>
                <ul className="mt-3 space-y-2">
                  {group.entries.map((entry) => (
                    <li key={entry.key} className="text-[12.5px] leading-relaxed text-mute">
                      <code className="me-2 font-mono text-[10.5px] text-brand-soft">{entry.hash?.slice(0, 7) ?? "—"}</code>
                      <span className="me-2 font-mono text-[10.5px] text-faint"><bdi dir="ltr">[{entry.type}]</bdi></span>
                      {entry.subject}
                      {entry.marker && <span className="ms-2 text-[11px] text-warn">({pick(entry.marker, "en")})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Portal status */}
        <div className="glass mt-8 p-5 sm:p-6">
          <h3 className="text-[15px] font-semibold text-white">{portalTitle}</h3>
          <p className="mt-2 text-[13px] leading-relaxed text-mute">{portalLede}</p>
          <dl className="mt-5 space-y-3">
            {/* auto_1fr is unusable in a 238px row: the status label's max-content is 199–210px in
                Cyrillic and Latin, so the value column collapsed to 0–28px. Stacked below sm. */}
            <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="flex items-center gap-1.5 pt-0.5 text-[11.5px] font-medium text-faint">
                <StatusDot tone="mesh" />
                {portalNoHash}
              </dt>
              <dd className="min-w-0 text-[12.5px] leading-relaxed text-mute [overflow-wrap:anywhere]">{portalUncommitted}</dd>
            </div>
            <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-[auto_minmax(0,1fr)]">
              <dt className="flex items-center gap-1.5 pt-0.5 text-[11.5px] font-medium text-faint">
                <StatusDot tone="warn" />
                {portalManualTitle}
              </dt>
              <dd className="min-w-0 text-[12.5px] leading-relaxed text-mute [overflow-wrap:anywhere]">{portalManualBody}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
