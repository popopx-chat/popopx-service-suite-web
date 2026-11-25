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
 * repositories, read on 2026-11-25, and the commands that re-derive the counts are
 * printed next to them. The changelog contains only commits that exist — the
 * backend has no CHANGELOG file, so its history is the git log itself. The last
 * block is a gap register: things v1.0.0 does not do, with no date attached.
 */

/** Date the values below were read out of both checkouts. Locale-free. */
const SNAPSHOT_DATE = "2026-11-25";

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
};

const TITLE: Localized<string> = {
  en: "Status and changelog: what holds on 2026-11-25, and which commit made it hold",
  ru: "Статус и журнал изменений: что верно на 2026-11-25 и какой коммит это сделало",
  de: "Status und Änderungsprotokoll: Was am 2026-11-25 gilt und welcher Commit es bewirkt hat",
  fr: "Statut et journal : ce qui est vrai le 2026-11-25, et quel commit l’a rendu vrai",
  it: "Stato e registro: ciò che vale il 2026-11-25 e quale commit lo ha determinato",
  nl: "Status en logboek: wat op 2026-11-25 klopt en welke commit dat maakte",
  cs: "Stav a protokol: co platí k 2026-11-25 a který commit to způsobilo",
  "zh-Hans": "状态与更新日志：2026-11-25 哪些成立，以及是哪个提交让它成立",
  "zh-Hant": "狀態與更新日誌：2026-11-25 哪些成立，以及是哪個提交讓它成立",
  es: "Estado y registro: qué se cumple el 2026-11-25 y qué commit lo hizo posible",
  pl: "Status i dziennik zmian: co obowiązuje 2026-11-25 i który commit to sprawił",
  ja: "ステータスと変更履歴：2026-11-25 に何が成立していて、どのコミットがそうしたか",
  th: "สถานะและบันทึกการเปลี่ยนแปลง: อะไรใช้ได้ ณ 2026-11-25 และคอมมิตไหนที่ทำให้เป็นเช่นนั้น",
  fi: "Tila ja muutosloki: mikä pitää paikkansa 2026-11-25 ja mikä commit sen aiheutti",
  uk: "Статус і журнал змін: що справедливе 2026-11-25 і який коміт це зробив",
  bg: "Статус и журнал: какво важи на 2026-11-25 и кой комит го предизвика",
  tr: "Durum ve değişiklik günlüğü: 2026-11-25 itibarıyla ne geçerli ve hangi kayıt bunu sağladı",
  hu: "Állapot és változásnapló: 2026-11-25-én mi áll fenn, és melyik commit hozta létre",
};

const SUBTITLE: Localized<string> = {
  en: "No status light sits in this section, because there is nothing to light up: no status page, no uptime feed, no analytics. Everything below was read out of the two repositories on 2026-11-25, and the commands that re-derive the numbers are printed beside them.",
  ru: "В этом разделе нет индикатора живости, потому что показывать нечего: ни статус-страницы, ни мониторинга аптайма, ни аналитики. Всё ниже прочитано из двух репозиториев 2026-11-25, а команды, заново дающие эти числа, напечатаны рядом.",
  de: "In diesem Abschnitt gibt es keine Live-Anzeige, weil es nichts anzuzeigen gibt: keine Statusseite, kein Uptime-Feed, keine Analyse. Alles unten wurde am 2026-11-25 aus den zwei Repositories gelesen, und die Befehle, die die Zahlen erneut liefern, stehen daneben.",
  fr: "Cette section n’affiche aucun voyant, faute de quoi l’allumer : pas de page de statut, pas de flux d’uptime, pas d’analytics. Tout ce qui suit a été lu dans les deux dépôts le 2026-11-25, et les commandes qui re-derivent les chiffres sont imprimées à côté.",
  it: "In questa sezione non c’è alcuna spia, perché non c’è nulla da accendere: nessuna pagina di stato, nessun feed di uptime, nessuna analytics. Tutto quanto segue è stato letto dai due repository il 2026-11-25, e i comandi che ricavano di nuovo i numeri sono stampati accanto.",
  nl: "In deze sectie staat geen live-indicator, omdat er niets te tonen is: geen statuspagina, geen uptime-feed, geen analytics. Alles hieronder is op 2026-11-25 uit de twee repositories gelezen en de commando’s die de cijfers opnieuw opleveren staan ernaast.",
  cs: "V této sekci žádný živý ukazatel není, protože není co ukazovat: žádná stavová stránka, žádný feed uptime, žádná analytika. Vše níže bylo přečteno ze dvou repozitářů k 2026-11-25 a příkazy, které čísla znovu vyrobí, jsou vytištěny vedle.",
  "zh-Hans": "这一节没有状态灯，因为无可点亮：没有状态页、没有可用性数据源、没有统计。下面的内容都是 2026-11-25 从两个仓库读出来的，能重新得到这些数字的命令就印在旁边。",
  "zh-Hant": "這一節沒有狀態燈，因為無可點亮：沒有狀態頁、沒有可用性資料源、沒有統計。下面的內容都是 2026-11-25 從兩個倉庫讀出來的，能重新得到這些數字的指令就印在旁邊。",
  es: "En esta sección no hay indicador en vivo porque no hay nada que encender: sin página de estado, sin flujo de uptime, sin analítica. Todo lo siguiente se leyó de los dos repositorios el 2026-11-25, y los comandos que re-derivan las cifras están impresos junto a ellas.",
  pl: "W tej sekcji nie ma wskaźnika na żywo, bo nie ma czego świecić: brak strony statusu, brak kanału dostępności, brak analityki. Wszystko poniżej odczytano z dwóch repozytoriów 2026-11-25, a polecenia odtwarzające te liczby wydrukowano obok.",
  ja: "このセクションに稼働中ランプはありません。点灯させるものがないからです。ステータスページも、アップタイムのフィードも、アクセス解析もありません。以下はすべて 2026-11-25 に両リポジトリから読み出した内容で、同じ数字を出すコマンドをそばに載せています。",
  th: "ในส่วนนี้ไม่มีไฟสถานะ เพราะไม่มีอะไรให้จุดแสง: ไม่มีหน้าสถานะ ไม่มีฟีดอัปไทม์ ไม่มีการวิเคราะห์ทราฟฟิก ทุกข้อความด้านล่างอ่านออกจากสองรีโปเมื่อวันที่ 2026-11-25 และคำสั่งที่สร้างตัวเลขเหล่านั้นใหม่อีกครั้งพิมพ์ไว้ข้าง ๆ",
  fi: "Tässä osiossa ei ole reaaliaikaista valoa, koska ei ole mitä valaista: ei statussivua, ei uptime-syötettä, ei analytiikkaa. Kaikki alla on luettu kahdesta repositoriosta 2026-11-25, ja komennot, jotka lukemat tuottavat uudelleen, on julkaistu vieressä.",
  uk: "У цьому розділі немає індикатора, бо показувати нічого: немає статус-сторінки, немає потоку аптайму, немає аналітики. Усе нижче прочитано з двох репозиторіїв 2026-11-25, а команди, що відтворюють ці числа, надруковано поруч.",
  bg: "В тази секция няма индикатор, защото няма какво да се показва: няма статус страница, няма ъптайм поток, няма аналитика. Всичко по-долу е прочетено от двете хранилища на 2026-11-25, а командите, които възпроизвеждат числата, са отпечатани до тях.",
  tr: "Bu bölümde canlı durum ışığı yok, çünkü aydınlatılacak bir şey yok: durum sayfası yok, çalışma süresi akışı yok, analitik yok. Aşağıdaki her şey 2026-11-25’te iki depodan okundu ve bu sayıları yeniden üreten komutlar yanlarında basılı.",
  hu: "Ebben a fejezetben nincs élő jelző, mert nincs mit kijelezni: nincs statuszoldal, nincs uptime-hírcsatorna, nincs analitika. Az alábbiak mind a két repóból származnak 2026-11-25 keltezéssel, és a számokat újra előállító parancsok mellettük találhatók.",
};

const PILL_ASOF: Localized<string> = {
  en: "Read from the repositories on 2026-11-25",
  ru: "Прочитано из репозиториев 2026-11-25",
  de: "Am 2026-11-25 aus den Repositories abgelesen",
  fr: "Lu dans les dépôts le 2026-11-25",
  it: "Letto dai repository il 2026-11-25",
  nl: "Op 2026-11-25 uit de repositories gelezen",
  cs: "Načteno z repozitářů 2026-11-25",
  "zh-Hans": "2026-11-25 取自两个仓库",
  "zh-Hant": "2026-11-25 取自兩個倉庫",
  es: "Leído de los repositorios el 2026-11-25",
  pl: "Odczytano z repozytoriów 2026-11-25",
  ja: "2026-11-25 にリポジトリから読み出し",
  th: "อ่านจากรีโปเมื่อ 2026-11-25",
  fi: "Luettu repositorioista 2026-11-25",
  uk: "Прочитано з репозиторіїв 2026-11-25",
  bg: "Прочетено от хранилищата на 2026-11-25",
  tr: "2026-11-25’te depolardan okundu",
  hu: "A repókból leolvasva 2026-11-25-kor",
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
};

/* ─────────────────────────────────────────────────────────────────────────
 * 2. Status strip
 * ───────────────────────────────────────────────────────────────────────── */

const STATUS_TITLE: Localized<string> = {
  en: "Facts as of 2026-11-25",
  ru: "Факты на 2026-11-25",
  de: "Fakten zum 2026-11-25",
  fr: "Faits au 2026-11-25",
  it: "Fatti al 2026-11-25",
  nl: "Feiten per 2026-11-25",
  cs: "Fakta k 2026-11-25",
  "zh-Hans": "截至 2026-11-25 的事实",
  "zh-Hant": "截至 2026-11-25 的事實",
  es: "Hechos a 2026-11-25",
  pl: "Fakty na 2026-11-25",
  ja: "2026-11-25 時点の事実",
  th: "ข้อเท็จจริง ณ 2026-11-25",
  fi: "Faktat 2026-11-25",
  uk: "Факти станом на 2026-11-25",
  bg: "Факти към 2026-11-25",
  tr: "2026-11-25 itibarıyla gerçekler",
  hu: "Tények 2026-11-25-i állapottal",
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
    },
  },
  {
    key: "plugins",
    value: "5",
    source: "gateway/app/plugins/__init__.py:88-133",
    caption: {
      en: "Native plugins in v1.0.0: four on by default, web3_bridge ships as real code but off",
      ru: "Нативные плагины в v1.0.0: четыре включены по умолчанию, web3_bridge идёт реальным кодом, но выключен",
      de: "Native Plugins in v1.0.0: vier standardmäßig an, web3_bridge kommt als echter Code, aber aus",
      fr: "Plugins natifs de v1.0.0 : quatre activés par défaut, web3_bridge arrive comme code réel mais éteint",
      it: "Plugin nativi della v1.0.0: quattro attivi per impostazione predefinita, web3_bridge arriva come codice reale ma spento",
      nl: "Native plug-ins in v1.0.0: vier standaard aan, web3_bridge komt als echte code maar uit",
      cs: "Nativní pluginy v1.0.0: čtyři ve výchozím stavu zapnuté, web3_bridge přichází jako skutečný kód, ale vypnutý",
      "zh-Hans": "v1.0.0 的原生插件：四个默认开启，web3_bridge 是真实代码但默认关闭",
      "zh-Hant": "v1.0.0 的原生外掛：四個預設開啟，web3_bridge 是真實程式碼但預設關閉",
      es: "Complementos nativos de v1.0.0: cuatro activos por defecto, web3_bridge llega como código real pero apagado",
      pl: "Natywne wtyczki w v1.0.0: cztery domyślnie włączone, web3_bridge to prawdziwy kod, lecz wyłączony",
      ja: "v1.0.0 のネイティブプラグインは5つ。4つは既定でオン、web3_bridge は実装済みですが既定はオフです",
      th: "ปลั๊กอินเนทีฟใน v1.0.0: สี่ตัวเปิดเป็นค่าเริ่มต้น ส่วน web3_bridge เป็นโค้ดจริงแต่ปิดอยู่",
      fi: "Natiivit lisäosat versiossa 1.0.0: neljä oletuksena päällä, web3_bridge toimitetaan oikeana koodina mutta pois päältä",
      uk: "Нативні плагіни у v1.0.0: чотири типово увімкнені, web3_bridge постачається як реальний код, але вимкнений",
      bg: "Нативни плъгини в v1.0.0: четири са включени по подразбиране, web3_bridge идва като истински код, но изключен",
      tr: "v1.0.0 içindeki yerleşik eklentiler: dördü varsayılan olarak açık, web3_bridge gerçek kod olarak geliyor ama kapalı",
      hu: "Natív bővítmények az v1.0.0-ban: négy alapból bekapcsolva, a web3_bridge valódi kód de kikapcsolva",
    },
  },
  {
    key: "routes-total",
    value: "91",
    source: "gateway/app/main.py + gateway/app/plugins/",
    caption: {
      en: "Route decorators registered in source: 52 on the core app plus 10 + 9 + 8 + 6 + 6 in the five plugin files",
      ru: "Декораторы маршрутов, зарегистрированные в коде: 52 в ядре плюс 10 + 9 + 8 + 6 + 6 в пяти файлах плагинов",
      de: "Im Quellcode registrierte Route-Dekoratoren: 52 an der Core-App plus 10 + 9 + 8 + 6 + 6 in den fünf Plugin-Dateien",
      fr: "Décorateurs de routes enregistrés dans le code : 52 sur le core plus 10 + 9 + 8 + 6 + 6 dans les cinq fichiers de plugin",
      it: "Decoratori di rotte registrati nel sorgente: 52 sul core più 10 + 9 + 8 + 6 + 6 nei cinque file dei plugin",
      nl: "In de bron geregistreerde route-decorators: 52 op de core plus 10 + 9 + 8 + 6 + 6 in de vijf plug-inbestanden",
      cs: "Dekorátory rout registrované ve zdroji: 52 na jádru plus 10 + 9 + 8 + 6 + 6 v pěti souborech pluginů",
      "zh-Hans": "源码注册的路由装饰器：核心应用 52 个，五个插件文件再加 10 + 9 + 8 + 6 + 6 个",
      "zh-Hant": "原始碼註冊的路由裝飾器：核心應用 52 個，五個外掛檔案再加 10 + 9 + 8 + 6 + 6 個",
      es: "Decoradores de rutas registrados en el código: 52 en la app core más 10 + 9 + 8 + 6 + 6 en los cinco archivos de complementos",
      pl: "Dekoratory tras zarejestrowane w kodzie: 52 w rdzeniu plus 10 + 9 + 8 + 6 + 6 w pięciu plikach wtyczek",
      ja: "ソースに登録されたルートデコレータの数。コアアプリ 52 に5つのプラグインファイルの 10 + 9 + 8 + 6 + 6 を加えた総数です",
      th: "จำนวน decorator ของรูทที่ลงทะเบียนในซอร์ส: แกนหลัก 52 บวก 10 + 9 + 8 + 6 + 6 ในไฟล์ปลั๊กอินห้าไฟล์",
      fi: "Lähteeseen rekisteröidyt reittikoristeet: 52 ytimessä plus 10 + 9 + 8 + 6 + 6 viidessä lisäosatiedostossa",
      uk: "Декоратори маршрутів, зареєстровані в коді: 52 у ядрі плюс 10 + 9 + 8 + 6 + 6 у пʼяти файлах плагінів",
      bg: "Декоратори на пътища, регистрирани в кода: 52 върху ядрото плюс 10 + 9 + 8 + 6 + 6 в петте файла с плъгини",
      tr: "Kaynakta kayıtlı rota dekoratörleri: çekirdek uygulamada 52, beş eklenti dosyasında 10 + 9 + 8 + 6 + 6",
      hu: "A forrásban regisztrált útvonal-dekorátorok: a törzsön 52, plusz 10 + 9 + 8 + 6 + 6 az öt bővítményfájlban",
    },
  },
  {
    key: "routes-served",
    value: "82",
    source: "gateway/app/config.py:440-446",
    caption: {
      en: "Routes a fresh install answers with factory defaults, web3_bridge left switched off",
      ru: "Маршруты, которые отвечает свежая установка с настройками по умолчанию, при выключенном web3_bridge",
      de: "Routen, die eine frische Installation mit Standardwerten beantwortet, während web3_bridge aus bleibt",
      fr: "Routes auxquelles répond une installation neuve avec les valeurs d’usine, web3_bridge restant éteint",
      it: "Rotte a cui risponde una installazione nuova con i valori di fabbrica, con web3_bridge lasciato spento",
      nl: "Routes die een verse installatie met fabrieksinstellingen beantwoordt, web3_bridge blijft uit",
      cs: "Routy, na které čerstvá instalace s továrními nastaveními odpovídá, web3_bridge zůstává vypnutý",
      "zh-Hans": "全新安装按出厂默认值实际应答的路由数，web3_bridge 保持关闭",
      "zh-Hant": "全新安裝依出廠預設值實際應答的路由數，web3_bridge 維持關閉",
      es: "Rutas a las que responde una instalación nueva con valores de fábrica, con web3_bridge apagado",
      pl: "Trasy, na które odpowiada świeża instalacja przy ustawieniach fabrycznych, web3_bridge pozostaje wyłączony",
      ja: "初期設定で新規インストールした場合に実際に応答するルート数。web3_bridge はオフのままです",
      th: "จำนวนรูทที่การติดตั้งใหม่ด้วยค่าจากโรงงานตอบจริง โดย web3_bridge ยังปิดอยู่",
      fi: "Reitit, joille tuore asennus tehdasetuksilla vastaa, web3_bridge:n pysyessä pois päältä",
      uk: "Маршрути, на які відповідає свіжа установка з типовими параметрами, web3_bridge лишається вимкненим",
      bg: "Пътищата, на които нова инсталация отговаря със заводските стойности, докато web3_bridge е изключен",
      tr: "Fabrika ayarlarıyla yapılan yeni bir kurulumun yanıt verdiği rotalar; web3_bridge kapalı kalıyor",
      hu: "Az az útvonalszám, amelyre egy friss telepítés gyári beállításokkal válaszol, web3_bridge kikapcsolt állapotában",
    },
  },
  {
    key: "routes-documented",
    value: "50",
    source: "gateway/app/main.py:3301 · :3323",
    caption: {
      en: "Documented core routes: two of the 52 carry include_in_schema=False, so they are served but not listed",
      ru: "Документированные маршруты ядра: у двух из 52 стоит include_in_schema=False, они отвечают, но не перечисляются",
      de: "Dokumentierte Core-Routen: zwei der 52 tragen include_in_schema=False, sie werden bedient aber nicht gelistet",
      fr: "Routes core documentées : deux des 52 portent include_in_schema=False, elles sont servies mais pas listées",
      it: "Rotte core documentate: due delle 52 hanno include_in_schema=False, quindi sono servite ma non elencate",
      nl: "Gedocumenteerde core-routes: twee van de 52 dragen include_in_schema=False, ze worden wel bediend maar niet getoond",
      cs: "Dokumentované jádrové routy: dvě z 52 mají include_in_schema=False, jsou obsluhované, ale nevyjmenované",
      "zh-Hans": "有文档的核心路由数：52 个里有 2 个标了 include_in_schema=False，能访问但不出现在列表里",
      "zh-Hant": "有文件的核心路由數：52 個裡有 2 個標了 include_in_schema=False，能存取但不出現在清單裡",
      es: "Rutas core documentadas: dos de las 52 llevan include_in_schema=False, así que se sirven pero no se listan",
      pl: "Udokumentowane trasy rdzenia: dwie z 52 mają include_in_schema=False, więc są obsługiwane, ale niewykazane",
      ja: "文書化されているコアルートの数。52 のうち 2 つに include_in_schema=False が付いており、提供はされますが一覧に出ません",
      th: "จำนวนรูทแกนหลักที่มีเอกสาร: 2 จาก 52 มี include_in_schema=False จึงถูกให้บริการแต่ไม่ถูกจดรายการ",
      fi: "Dokumentoidut ydinreitit: kahdella 52:sta on include_in_schema=False, joten ne palvellaan mutta ei listata",
      uk: "Задокументовані маршрути ядра: два з 52 мають include_in_schema=False, тож вони обслуговуються, але не перелічені",
      bg: "Документирани основни пътища: два от 52 носят include_in_schema=False, затова се обслужват, но не се изброяват",
      tr: "Belgelenmiş çekirdek rotalar: 52ʼden ikisinde include_in_schema=False var, sunuluyor ama listelenmiyor",
      hu: "Dokumentált törzs-útvonalak: a 52-ből kettőn include_in_schema=False áll, tehát kiszolgálva, de nem listázva",
    },
  },
  {
    key: "meters",
    value: "8",
    source: "gateway/app/billing_service.py:164-175",
    caption: {
      en: "POPX-CP compute-credit meters, each priced by its own POPOPX_CP_* key in the environment file",
      ru: "Счётчики POPX-CP, каждый со ценой в собственном ключе POPOPX_CP_* в файле окружения",
      de: "POPX-CP-Rechenkredit-Meter, je eines über einen eigenen POPOPX_CP_*-Schlüssel in der Umgebungsdatei bepreist",
      fr: "Compteurs de crédits de calcul POPX-CP, chacun tarifé par sa propre clé POPOPX_CP_* dans le fichier d’environnement",
      it: "Contatori di crediti di calcolo POPX-CP, ciascuno prezzato dalla propria chiave POPOPX_CP_* nel file d’ambiente",
      nl: "POPX-CP-computkredietmeters, elk geprijsd via een eigen POPOPX_CP_*-sleutel in het omgevingsbestand",
      cs: "Měridla výpočetních kreditů POPX-CP, každé oceněné vlastním klíčem POPOPX_CP_* v souboru prostředí",
      "zh-Hans": "POPX-CP 算力点计量表共 8 项，单价各由环境文件里自己的 POPOPX_CP_* 键决定",
      "zh-Hant": "POPX-CP 算力點計量表共 8 項，單價各由環境檔裡自己的 POPOPX_CP_* 鍵決定",
      es: "Medidores de créditos informáticos POPX-CP, cada uno con precio por su propia clave POPOPX_CP_* en el archivo de entorno",
      pl: "Liczniki kredytów obliczeniowych POPX-CP, każdy wyceniany własnym kluczem POPOPX_CP_* w pliku środowiska",
      ja: "POPX-CP 計算ポイントの計量表は8項目。単価は環境ファイル内のそれぞれの POPOPX_CP_* キーで決まります",
      th: "ตัวนับเครดิตการคำนวณ POPX-CP มี 8 รายการ แต่ละตัวตั้งราคาด้วยคีย์ POPOPX_CP_* ของตัวเองในไฟล์ environment",
      fi: "POPX-CP-laskentapistemittarit, kukin hinnoiteltu omalla POPOPX_CP_*-avaimella ympäristötiedostossa",
      uk: "Лічильники обчислювальних кредитів POPX-CP, кожен цінується власним ключем POPOPX_CP_* у файлі середовища",
      bg: "Броячи на изчислителни кредити POPX-CP, всеки оценен със собствен ключ POPOPX_CP_* в средата",
      tr: "POPX-CP hesaplama kredisi sayaçları; her biri ortam dosyasındaki kendi POPOPX_CP_* anahtarıyla fiyatlanır",
      hu: "POPX-CP számítási kreditmérők, mindegyik a saját POPOPX_CP_* kulcsával árazva a környezeti fájlban",
    },
  },
  {
    key: "commits",
    value: "10",
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
    },
  },
  {
    key: "languages",
    value: "18",
    source: "apps/ios/POPOPX--iOS--Info.plist",
    caption: {
      en: "Portal languages: exactly the 18 tags in the iOS client’s CFBundleLocalizations, same order",
      ru: "Языки портала: ровно те 18 тегов, что в CFBundleLocalizations клиента iOS, в том же порядке",
      de: "Portal-Sprachen: exakt die 18 Tags aus CFBundleLocalizations des iOS-Clients, gleiche Reihenfolge",
      fr: "Langues du portail : exactement les 18 tags de CFBundleLocalizations du client iOS, dans le même ordre",
      it: "Lingue del portale: esattamente i 18 tag di CFBundleLocalizations del client iOS, stesso ordine",
      nl: "Portaltalen: precies de 18 tags uit CFBundleLocalizations van de iOS-cliënt, zelfde volgorde",
      cs: "Jazyky portálu: přesně 18 tagů z CFBundleLocalizations iOS klienta, ve stejném pořadí",
      "zh-Hans": "门户语言数：与 iOS 客户端 CFBundleLocalizations 里的 18 个标签完全一致，顺序相同",
      "zh-Hant": "入口語言數：與 iOS 用戶端 CFBundleLocalizations 裡的 18 個標籤完全一致，順序相同",
      es: "Idiomas del portal: exactamente las 18 etiquetas de CFBundleLocalizations del cliente iOS, en el mismo orden",
      pl: "Języki portalu: dokładnie te 18 tagów co CFBundleLocalizations klienta iOS, w tej samej kolejności",
      ja: "ポータルの言語数。iOS クライアントの CFBundleLocalizations に並ぶ 18 タグと同一で、並び順も同じです",
      th: "จำนวนภาษาของพอร์ทัล: ตรงกับ 18 แท็กใน CFBundleLocalizations ของไคลเอนต์ iOS และเรียงลำดับเหมือนกัน",
      fi: "Portaalin kielet: täsmälleen ne 18 tagiä kuin iOS-asiakkaan CFBundleLocalizations, samassa järjestyksessä",
      uk: "Мови порталу: рівно ті 18 тегів, що в CFBundleLocalizations клієнта iOS, у тому ж порядку",
      bg: "Езици на портала: точно 18-те етикета в CFBundleLocalizations на iOS клиента, в същия ред",
      tr: "Portal dilleri: iOS istemcisindeki CFBundleLocalizations etiketlerinin tam 18’i, aynı sırayla",
      hu: "A portál nyelvei: pontosan az iOS ügyfél CFBundleLocalizations értékében lévő 18 tag, azonos sorrendben",
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
};

/** Locale-free: shell commands and file paths, byte-identical for every reader. */
const RECIPE_COMMANDS = `# Run from the portal repository root, with the two checkouts side by side.

# 1. Core route registrations. Prints 52.
grep -cE '^\\s+@app\\.(get|post|put|patch|delete)\\(' ../popopx-service-suite/gateway/app/main.py

# 2. Plugin route registrations. Prints 10, 9, 8, 6, 6.
for p in alert_ops web3_bridge polls privacy_sso ai_agent; do
  printf '%-14s' "$p"
  grep -cE '^\\s+@router\\.(get|post|put|patch|delete)\\(' "../popopx-service-suite/gateway/app/plugins/\${p}_plugin.py"
done

# 3. Backend history and tags. Prints the ten commits listed below, then v1.0.0.
git -C ../popopx-service-suite log --date=short --pretty='%h %ad %s'
git -C ../popopx-service-suite tag

# 4. This portal's own history, and the absence of a deploy pipeline.
git log --date=short --pretty='%h %ad %s'
test -d .github && echo "workflows directory present" || echo "no .github directory"`;

const RECIPE_CAPTION: Localized<string> = {
  en: "Run and verified on 2026-11-25: 52 core registrations, plugin registrations 10 + 9 + 8 + 6 + 6 = 39, one tag named v1.0.0, ten commits, and no .github directory in this repository.",
  ru: "Выполнено и проверено 2026-11-25: 52 регистрации ядра, регистрации плагинов 10 + 9 + 8 + 6 + 6 = 39, один тег v1.0.0, десять коммитов и нет каталога .github в этом репозитории.",
  de: "Am 2026-11-25 ausgeführt und geprüft: 52 Core-Registrierungen, Plugin-Registrierungen 10 + 9 + 8 + 6 + 6 = 39, ein Tag v1.0.0, zehn Commits, und kein .github-Verzeichnis in diesem Repository.",
  fr: "Exécuté et vérifié le 2026-11-25 : 52 enregistrements core, enregistrements de plugins 10 + 9 + 8 + 6 + 6 = 39, un tag nommé v1.0.0, dix commits, et pas de dossier .github dans ce dépôt.",
  it: "Eseguito e verificato il 2026-11-25: 52 registrazioni core, registrazioni plugin 10 + 9 + 8 + 6 + 6 = 39, un tag chiamato v1.0.0, dieci commit e nessuna cartella .github in questo repository.",
  nl: "Uitgevoerd en gecontroleerd op 2026-11-25: 52 core-registraties, plugin-registraties 10 + 9 + 8 + 6 + 6 = 39, één label v1.0.0, tien commits en geen .github-map in deze repository.",
  cs: "Spuštěno a ověřeno 2026-11-25: 52 registrací jádra, registrace pluginů 10 + 9 + 8 + 6 + 6 = 39, jeden tag v1.0.0, deset commitů a žádná složka .github v tomto repozitáři.",
  "zh-Hans": "2026-11-25 实际运行并核对：核心注册 52 条，插件注册 10 + 9 + 8 + 6 + 6 = 39 条，一个名为 v1.0.0 的 tag，十个提交，且本仓库没有 .github 目录。",
  "zh-Hant": "2026-11-25 實際執行並核對：核心註冊 52 條，外掛註冊 10 + 9 + 8 + 6 + 6 = 39 條，一個名為 v1.0.0 的 tag，十個提交，且本倉庫沒有 .github 目錄。",
  es: "Ejecutado y verificado el 2026-11-25: 52 registros core, registros de complementos 10 + 9 + 8 + 6 + 6 = 39, una etiqueta llamada v1.0.0, diez commits y ningún directorio .github en este repositorio.",
  pl: "Uruchomione i sprawdzone 2026-11-25: 52 rejestracje rdzenia, rejestracje wtyczek 10 + 9 + 8 + 6 + 6 = 39, jeden tag v1.0.0, dziesięć commitów i brak katalogu .github w tym repozytorium.",
  ja: "2026-11-25 に実行して確認済み：コア側の登録 52、プラグイン側の登録 10 + 9 + 8 + 6 + 6 = 39、v1.0.0 というタグが1件、コミット10件、そしてこのリポジトリに .github ディレクトリはありません。",
  th: "รันและตรวจสอบเมื่อ 2026-11-25: ลงทะเบียนแกนหลัก 52, ลงทะเบียนปลั๊กอิน 10 + 9 + 8 + 6 + 6 = 39, แท็กเดียวชื่อ v1.0.0, สิบคอมมิต และไม่มีไดเรกทอรี .github ในรีโปนี้",
  fi: "Suoritettu ja varmistettu 2026-11-25: 52 ytimen kirjausta, lisäosien kirjausta 10 + 9 + 8 + 6 + 6 = 39, yksi tag nimeltä v1.0.0, kymmenen commitia eikä .github-hakemistoa tässä repositoriossa.",
  uk: "Виконано і перевірено 2026-11-25: 52 реєстрації ядра, реєстрації плагінів 10 + 9 + 8 + 6 + 6 = 39, один тег v1.0.0, десять комітів і немає каталогу .github у цьому репозиторії.",
  bg: "Изпълнено и проверено на 2026-11-25: 52 регистрации на ядрото, регистрации на плъгини 10 + 9 + 8 + 6 + 6 = 39, един маркер v1.0.0, десет комита и няма директория .github в това хранилище.",
  tr: "2026-11-25 tarihinde çalıştırılıp doğrulandı: 52 çekirdek kaydı, eklenti kayıtları 10 + 9 + 8 + 6 + 6 = 39, v1.0.0 adında tek etiket, on kayıt ve bu depoda .github dizini yok.",
  hu: "2026-11-25-én lefuttatva és ellenőrizve: 52 törzs-nyilvántartás, bővítmény-nyilvántartások 10 + 9 + 8 + 6 + 6 = 39, egy v1.0.0 nevű tag, tíz commit, és nincs .github könyvtár ebben a repóban.",
};

const RECIPE_HINT: Localized<string> = {
  en: "Two routes are served but excluded from the schema, which is why 91 registrations and 82 served routes do not turn into 91 documented endpoints.",
  ru: "Два маршрута обслуживаются, но исключены из схемы, поэтому 91 регистрация и 82 обслуживаемых маршрута не превращаются в 91 документированный эндпоинт.",
  de: "Zwei Routen werden bedient, aber aus dem Schema ausgeschlossen – deshalb werden aus 91 Registrierungen und 82 bedienten Routen nicht 91 dokumentierte Endpunkte.",
  fr: "Deux routes sont servies mais exclues du schéma, c’est pourquoi 91 enregistrements et 82 routes servies ne donnent pas 91 endpoints documentés.",
  it: "Due rotte sono servite ma escluse dallo schema, motivo per cui 91 registrazioni e 82 rotte servite non diventano 91 endpoint documentati.",
  nl: "Twee routes worden bediend maar uit het schema gehouden, daarom worden 91 registraties en 82 bediende routes niet 91 gedocumenteerde eindpunten.",
  cs: "Dvě routy jsou obsluhované, ale vyňaté ze schématu — proto z 91 registrací a 82 obsluhovaných rout nevznikne 91 zdokumentovaných endpointů.",
  "zh-Hans": "有两条路由会被服务但从 schema 中排除，所以 91 条注册、82 条实际应答并不会变成 91 个有文档的接口。",
  "zh-Hant": "有兩條路由會被服務但從 schema 中排除，所以 91 條註冊、82 條實際應答並不會變成 91 個有文件的介面。",
  es: "Dos rutas se sirven pero quedan excluidas del esquema, por eso 91 registros y 82 rutas servidas no se convierten en 91 endpoints documentados.",
  pl: "Dwie trasy są obsługiwane, ale wyłączone ze schematu, dlatego 91 rejestracji i 82 obsługiwanych tras nie daje 91 udokumentowanych endpointów.",
  ja: "2つのルートは提供されますがスキーマから除外されているため、91件の登録と82件の応答ルートがそのまま 91 の文書化済みエンドポイントにはなりません。",
  th: "มีสองรูทที่ถูกให้บริการแต่ถูกตัดออกจากส키มา นี่คือเหตุที่ 91 การลงทะเบียนกับ 82 รูทที่ตอบจริง ไม่กลายเป็น 91 endpoint ที่มีเอกสาร",
  fi: "Kaksi reittiä palvellaan mutta jätetään skeeman ulkopuolelle, siksi 91 kirjausta ja 82 palveltua reittiä eivät ole 91 dokumentoitua päätepistettä.",
  uk: "Два маршрути обслуговуються, але виключені зі схеми, тому 91 реєстрація і 82 обслуговувані маршрути не перетворюються на 91 задокументований ендпоінт.",
  bg: "Два пътища се обслужват, но са извадени от схемата, затова 91 регистрирания и 82 обслужвани пътища не стават 91 документирани крайни точки.",
  tr: "İki rota sunulur ancak şemanın dışındadır, bu yüzden 91 kayıt ve 82 sunulan rota 91 belgelenmiş uç noktaya dönüşmez.",
  hu: "Két útvonal kiszolgálva kerül, de ki van hagyva a sémából, ezért a 91 nyilvántartás és 82 kiszolgált útvonal nem válik 91 dokumentált végponttá.",
};

/* ─────────────────────────────────────────────────────────────────────────
 * 4. Backend changelog — the ten commits that exist, oldest first
 * ───────────────────────────────────────────────────────────────────────── */

const BACKEND_TITLE: Localized<string> = {
  en: "Backend changelog: the ten entries that exist",
  ru: "Журнал бэкенда: десять записей, которые есть",
  de: "Backend-Änderungsprotokoll: die zehn Einträge, die existieren",
  fr: "Journal backend : les dix entrées qui existent",
  it: "Registro del backend: le dieci voci che esistono",
  nl: "Backend-logboek: de tien items die bestaan",
  cs: "Protokol backendu: deset položek, které existují",
  "zh-Hans": "后端更新日志：真实存在的十条",
  "zh-Hant": "後端更新日誌：真實存在的十條",
  es: "Registro del backend: las diez entradas que existen",
  pl: "Dziennik backendu: dziesięć wpisów, które istnieją",
  ja: "バックエンドの変更履歴：実在する10件",
  th: "บันทึกการเปลี่ยนแปลงแบ็กเอนด์: สิบรายการที่มีอยู่จริง",
  fi: "Backendin muutosloki: kymmenen merkintää, jotka ovat olemassa",
  uk: "Журнал бекенду: десять записів, які існують",
  bg: "Журнал на бекенда: десетте записа, които съществуват",
  tr: "Arka uç değişiklik günlüğü: var olan on kayıt",
  hu: "Backend változásnapló: a tíz létező bejegyzés",
};

const BACKEND_LEDE: Localized<string> = {
  en: "The backend repository has no CHANGELOG file, so this is the commit history itself: ten entries, grouped by date, oldest first. Nothing was added to it and nothing left out. Each row carries its own commit subject, verbatim, and one line about what that commit changes for whoever runs the gateway.",
  ru: "В репозитории бэкенда нет файла CHANGELOG, поэтому здесь — сама история коммитов: десять записей, сгруппированных по датам, от старых к новым. Ничего не добавили и ничего не пропустили. Каждая строка дословно приводит заголовок коммита и одно предложение о том, что этот коммит меняет для того, кто запускает шлюз.",
  de: "Im Backend-Repository gibt es keine CHANGELOG-Datei, daher steht hier die Commit-Geschichte selbst: zehn Einträge, nach Datum gruppiert, älteste zuerst. Nichts wurde ergänzt, nichts weggelassen. Jede Zeile enthält die eigene Commit-Betreffzeile im Wortlaut und einen Satz, was dieser Eintrag für den ändert, der das Gateway betreibt.",
  fr: "Le dépôt backend n’a pas de fichier CHANGELOG, voici donc l’historique des commits lui-même : dix entrées, groupées par date, de la plus ancienne à la plus récente. Rien n’y a été ajouté, rien retiré. Chaque ligne porte son propre message de commit, mot pour mot, et une ligne sur ce que ce commit change pour celui qui exploite le gateway.",
  it: "Nel repository backend non esiste un file CHANGELOG, quindi qui c’è la cronologia dei commit stessa: dieci voci, raggruppate per data, dalla più vecchia. Non è stato aggiunto nulla e nulla è stato omesso. Ogni riga riporta l’oggetto del proprio commit alla lettera e una riga su ciò che quel commit cambia per chi gestisce il gateway.",
  nl: "De backend-repository bevat geen CHANGELOG-bestand, dus hier staat de commitgeschiedenis zelf: tien items, gegroepeerd per datum, oudste eerst. Er is niets aan toegevoegd en niets weggelaten. Elke regel bevat het eigen commit-onderwerp woord voor woord, plus één regel over wat die commit verandert voor wie de gateway beheert.",
  cs: "Backend repozitář nemá soubor CHANGELOG, takže tady je samotná historie commitů: deset položek, seskupených podle data, nejstarší první. Nic nepřidáno, nic vynecháno. Každý řádek obsahuje vlastní předmět commitu doslovně a jednou řádkou, co takový commit mění pro toho, kdo bránu provozuje.",
  "zh-Hans": "后端仓库没有 CHANGELOG 文件，所以下面就是提交历史本身：十条记录，按日期分组，从旧到新。既没有加进去的东西，也没有漏掉的条目。每行原样带上它自己的提交标题，再补一句这条提交对跑网关的人意味着什么。",
  "zh-Hant": "後端倉庫沒有 CHANGELOG 檔案，所以下面就是提交歷史本身：十條記錄，依日期分組，從舊到新。既沒有加進去的東西，也沒有漏掉的條目。每行原樣帶上它自己的提交標題，再補一句這條提交對執行閘道的人意味著什麼。",
  es: "El repositorio del backend no tiene archivo CHANGELOG, así que esto es el historial de commits en persona: diez entradas agrupadas por fecha, la más antigua primero. No se añadió nada ni se omitió nada. Cada fila lleva el asunto de su commit literalmente y una línea sobre lo que ese commit cambia para quien opera la pasarela.",
  pl: "W repozytorium backendu nie ma pliku CHANGELOG, więc poniżej jest sama historia commitów: dziesięć wpisów pogrupowanych według dat, od najstarszego. Nic nie dodano i nic pominięto. Każdy wiersz zawiera dosłowny temat swojego commitu oraz jedno zdanie o tym, co ten commit zmienia dla osoby prowadzącej bramę.",
  ja: "バックエンドリポジトリには CHANGELOG ファイルがないため、以下はコミット履歴そのものです。10件を日付でグループ化し、古い順に並べています。足したものも省いたものもありません。各行にはコミットタイトルを原文のまま置き、その下に、ゲートウェイを運用する人に何が起きるかを一節添えています。",
  th: "รีโปแบ็กเอนด์ไม่มีไฟล์ CHANGELOG ด้านล่างจึงเป็นประวัติคอมมิตเอง: สิบรายการจัดกลุ่มตามวันที่ เรียงจากเก่าไปใหม่ ไม่มีอะไรถูกเพิ่มหรือถูกตัดออก แต่ละแถวพกรายหัวคอมมิตของตัวเองตามต้นฉบับ พร้อมหนึ่งบรรทัดว่าคอมมิตนั้นเปลี่ยนอะไรสำหรับคนที่รันเกตเวย์",
  fi: "Backend-repossa ei ole CHANGELOG-tiedostoa, joten tässä on commit-historia sellaisenaan: kymmenen merkintää ryhmiteltynä päivän mukaan vanhin ensin. Mitään ei ole lisätty eikä jätetty pois. Jokaisella rivillä on commitin oma otsikko sellaisenaan ja yksi rivi siitä, mitä tämä commit muuttaa gatewayn ylläpitäjälle.",
  uk: "У репозиторії бекенду немає файлу CHANGELOG, тому тут — сама історія комітів: десять записів, згрупованих за датами, від найстарішого. Нічого не додано і нічого не пропущено. Кожен рядок дослівно наводить власний заголовок коміту й один рядок про те, що цей коміт змінює для того, хто запускає шлюз.",
  bg: "В бекенд хранилището няма файл CHANGELOG, затова по-долу е самата история на комитите: десет записа, групирани по дати, най-старият пръв. Нищо не е добавено и нищо не е пропуснато. Всеки ред носи собствения си заглавие на комит буквално и един ред за това какво променя той за хората, които управляват гейтуейта.",
  tr: "Arka uç deposunda CHANGELOG dosyası yok, bu yüzden aşağıdaki doğrudan işlem geçmişi: on kayıt, tarihe göre gruplanmış, eskiden yeniye. Ne bir şey eklendi ne de atlandı. Her satır kendi işlem başlığını aynen taşır ve ağ geçidini çalıştıran kişi için o işlemin neyi değiştirdiğini tek satırda söyler.",
  hu: "A backend repóban nincs CHANGELOG fájl, ezért itt maga a commitelőzmény: tíz bejegyzés dátum szerint csoportosítva, a legrégebbi elöl. Nem adtunk hozzá és nem hagytunk ki semmit. Minden sor tartalmazza a saját commit-címét szó szerint, plusz egy sort arról, mit jelent az az átjáró üzemeltetőjének.",
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
                <p className="font-mono text-[11px] tracking-[0.18em] text-faint">{stat.source}</p>
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
                <p className="font-mono text-[11px] tracking-[0.18em] text-faint">{group.date}</p>
                <ul className="mt-3 space-y-2">
                  {group.entries.map((entry) => (
                    <li key={entry.key} className="text-[12.5px] leading-relaxed text-mute">
                      <code className="mr-2 font-mono text-[10.5px] text-brand-soft">{entry.hash?.slice(0, 7) ?? "—"}</code>
                      <span className="mr-2 font-mono text-[10.5px] text-faint">[{entry.type}]</span>
                      {entry.subject}
                      {entry.marker && <span className="ml-2 text-[11px] text-warn">({pick(entry.marker, "en")})</span>}
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
