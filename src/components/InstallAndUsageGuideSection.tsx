"use client";

import { useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { CodeBlock, SectionHeading, StatusDot } from "@/components/ui";
import { pick, useCopy, useLocale, type Localized } from "@/lib/i18n";
import { ADMIN_CONSOLE_URL, NODE_WS_URL, REPO_URL } from "@/lib/site";

/**
 * Step 1 → 3: install, console, iPhone.
 *
 * Nothing here is invented. Every command, flag, environment key, port, URL and
 * endpoint is read out of the sibling checkout:
 *
 *   README.md                       跑起来 / 使用示例 / 接口一览 / 配置 / 算力码 / 自检
 *   .env.example                    58 keys and their defaults
 *   install_ubuntu22.sh             modes, flags, the ufw line, NEXT STEPS
 *   install_macos.sh                --port / --lan / --with-node / --check / --dry-run
 *                                   / --uninstall, the launchd label `com.popopx.gateway`,
 *                                   its plan printout and the fact that it has no docker mode
 *   start_macos.sh                  --check / --show-token / --no-node / --host,
 *                                   the pairing printout and its troubleshooting list
 *   docker-compose.yml              network_mode: host and the missing `ports:`
 *   official_tools/gen_voucher.py   its usage block plus the argparse options
 *   gateway/app/static/index.html   the real NAV panel names and section titles
 *   gateway/app/main.py             the route decorators, admin_required, /healthz
 *
 * Where the README and the code disagree, the code wins and the sentence is
 * worded so it stays true: `/healthz` answers `ok`, `node_connected` and
 * `service_id`, while the version and the service identity live in
 * `GET /api/v1/status` (README §使用示例 lists uptime/version on the first line).
 */

/**
 * Copy slots.
 *
 * `src/lib/i18n.tsx` types `Localized<T>` as a **total** map over the 18 tags the
 * iOS client declares, so every literal below carries all eighteen and the
 * compiler — plus `tools/check-i18n.mjs`, which reads the same literals — fails
 * the moment one is missing. Shell commands, environment keys, file names, URLs,
 * route paths, `systemd` unit names and console control labels are technical:
 * they stay byte-identical in all 18 slots and only the prose around them is
 * translated. `useCopy` binds a slot to the visitor's language inside a render,
 * `pick` does it at a call site that already holds a locale.
 */
type L = Localized<string>;

type Platform = "ubuntu" | "macos";

/* ─────────────────────────────────────────────────────────────────────────────
 * 1. Commands — locale-free by design. A shell command is never translated.
 * ──────────────────────────────────────────────────────────────────────────── */

const CMD = {
  clone: `git clone ${REPO_URL}\ncd popopx-service-suite`,
  env: `cp .env.example .env`,
  token: `openssl rand -hex 32`,
  readToken: `sudo grep POPOPX_ADMIN_TOKEN /opt/popopx-service-suite/src/.env
sudo grep POPOPX_ADMIN_TOKEN /etc/popopx-service-suite/env
sudo grep POPOPX_ADMIN_TOKEN /usr/local/etc/popopx-service-suite/env`,
  install: `sudo ./install_ubuntu22.sh`,
  installModes: `sudo ./install_ubuntu22.sh --mode native\nsudo ./install_ubuntu22.sh --with-node\nsudo ./install_ubuntu22.sh --help`,
  compose: `docker compose up -d\ndocker compose --profile node up -d\ndocker compose logs -f gateway`,
  ufw: `sudo ufw allow 8080/tcp comment 'popopx-service-suite gateway'`,
  gates: `cd gateway && python3 -m app.main --check-routes\ncd gateway && python3 -m app.main --self-test`,

  /* macOS — production installer: exactly the command lines install_macos.sh takes,
     plus the three launchctl lines it prints itself in its NEXT STEPS section. */
  macInstall: `sudo ./install_macos.sh`,
  macPreflight: `./install_macos.sh --check\n./install_macos.sh --dry-run`,
  macInstallFlags: `sudo ./install_macos.sh --lan\nsudo ./install_macos.sh --with-node\nsudo ./install_macos.sh --port 9090 --public-base-url https://suite.example.com`,
  macCtl: `sudo launchctl print system/com.popopx.gateway\nsudo launchctl kickstart -k system/com.popopx.gateway\nsudo launchctl bootout system/com.popopx.gateway`,
  macUninstall: `sudo ./install_macos.sh --uninstall\nsudo ./install_macos.sh --uninstall --purge-state`,

  /* macOS — development launcher. */
  macStart: `./start_macos.sh`,
  macCheck: `./start_macos.sh --check`,
  macToken: `./start_macos.sh --show-token\ngrep '^POPOPX_ADMIN_TOKEN=' .env`,
  macNode: `./start_macos.sh --no-node\n./start_macos.sh --host 192.168.1.20 --port 8080`,
  firewallState: `/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate`,
  venv: `python3.11 -m venv .venv\n.venv/bin/pip install -r gateway/requirements.txt\ncd gateway && ../.venv/bin/python -m app.main --self-test`,

  healthz: `curl -s http://127.0.0.1:8080/healthz | python3 -m json.tool`,

  apiSetup: `TOKEN=$(grep '^POPOPX_ADMIN_TOKEN=' .env | cut -d= -f2-)\nAPI=http://127.0.0.1:8080\nCHANNEL_ID=ops-demo`,
  status: `curl -s $API/api/v1/status -H "X-Admin-Token: $TOKEN" | python3 -m json.tool`,
  tokenQuery: `curl -s "$API/api/v1/plugins?token=$TOKEN"`,
  redeem: `curl -s -X POST $API/api/v1/vouchers/redeem \\
     -H "X-Admin-Token: $TOKEN" \\
     -H 'content-type: application/json' \\
     -d '{"code":"<voucher-code>","redeemed_by":"operator-a"}'`,
  menu: `curl -s -X POST $API/api/v1/menu/push \\
     -H "X-Admin-Token: $TOKEN" \\
     -H 'content-type: application/json' -d '{}'
curl -s -X POST $API/api/v1/menu/push \\
     -H "X-Admin-Token: $TOKEN" \\
     -H 'content-type: application/json' -d '{"contact_ids":[3,7]}'`,
  sendText: `curl -s -X POST $API/api/v1/send/text \\
     -H "X-Admin-Token: $TOKEN" \\
     -H 'content-type: application/json' -d '{"contact_id":3,"text":"02:00 UTC 维护"}'`,
  rotate: `curl -s -X POST "$API/api/v1/channels/$CHANNEL_ID/rotate" \\
     -H "X-Admin-Token: $TOKEN"`,
  plugins: `curl -s $API/api/v1/plugins -H "X-Admin-Token: $TOKEN"\ncurl -s $API/api/v1/plugins/alert_ops/status -H "X-Admin-Token: $TOKEN"`,

  voucher: `python3 official_tools/gen_voucher.py --gen-keyring --keyring ./official_keys\npython3 official_tools/gen_voucher.py --show-pubkey --keyring ./official_keys\npython3 official_tools/gen_voucher.py --mint --plan startup --credits 500 --qty 20 --keyring ./official_keys\npython3 official_tools/gen_voucher.py --self-test`,
  voucherHelp: `cd gateway && python3 ../official_tools/gen_voucher.py --help`,

  frames: `{ "t": "sh", "uid": "<pairwise_uid>", "sec": "<64 hex>", "svc": "<service_id>" }
{ "t": "mc", "menu": { "items": [ { "title": "", "kind": "", "action": "", "sub": [] } ], "rev": 0 } }
{ "t": "sc", "m": "c", "card": { ... } }   card created
{ "t": "sc", "m": "u", "card": { ... } }   same cardId, replaced in place
{ "t": "ku", "update": { "ch": "", "se": 0, "rp": true, "env": {} } }`,
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 2. Visitor-facing copy
 * ──────────────────────────────────────────────────────────────────────────── */

const T = {
  eyebrow: {
    en: "Section 05 · Install & usage guide",
    "ru": "Раздел 05 · Установка и руководство",
    "de": "Abschnitt 05 · Installation und Anleitung",
    "fr": "Section 05 · Installation et guide d'utilisation",
    "it": "Sezione 05 · Installazione e guida all'uso",
    "nl": "Sectie 05 · Installatie en handleiding",
    "cs": "Oddíl 05 · Instalace a návod k použití",
    "zh-Hans": "第 05 节 · 安装与使用指引",
    "zh-Hant": "第 05 節 · 安裝與使用指引",
    "es": "Sección 05 · Instalación y guía de uso",
    "pl": "Sekcja 05 · Instalacja i instrukcja obsługi",
    "ja": "セクション05 · インストールと使い方",
    "th": "หมวด 05 · การติดตั้งและคู่มือการใช้งาน",
    "fi": "Osio 05 · Asennus ja käyttöopas",
    "uk": "Розділ 05 · Встановлення та посібник",
    "bg": "Раздел 05 · Инсталация и ръководство",
    "tr": "Bölüm 05 · Kurulum ve kullanım rehberi",
    "hu": "05. fejezet · Telepítés és használati útmutató",
  } satisfies L,
  title: {
    en: "Three steps: install it, open the console, see your first card on an iPhone",
    "ru": "Три шага: установить, открыть консоль, увидеть первую карточку на iPhone",
    "de": "Drei Schritte: installieren, Konsole öffnen, die erste Karte auf dem iPhone sehen",
    "fr": "Trois étapes : l'installer, ouvrir la console, voir sa première carte sur iPhone",
    "it": "Tre passi: installalo, apri la console, vedi la tua prima carta su iPhone",
    "nl": "Drie stappen: installeer het, open de console, zie je eerste kaart op een iPhone",
    "cs": "Tři kroky: nainstalovat, otevřít konzoli, zobrazit první kartu na iPhonu",
    "zh-Hans": "三步上手：装好它、进后台、在 iPhone 上看到第一张卡片",
    "zh-Hant": "三步上手：裝好它、進後台、在 iPhone 上看到第一張卡片",
    "es": "Tres pasos: instálalo, abre la consola, ve tu primera tarjeta en un iPhone",
    "pl": "Trzy kroki: zainstaluj, otwórz konsolę, zobacz pierwszą kartę na iPhonie",
    "ja": "3ステップ：インストールし、コンソールを開き、iPhoneで最初のカードを見る",
    "th": "สามขั้น: ติดตั้ง เปิดคอนโซล แล้วเห็นการ์ดใบแรกบน iPhone",
    "fi": "Kolme vaihetta: asenna, avaa konsoli, näe ensimmäinen kortti iPhonessa",
    "uk": "Три кроки: встановити, відкрити консоль, побачити першу картку на iPhone",
    "bg": "Три стъпки: инсталирай, отвори конзолата, виж първата си карта на iPhone",
    "tr": "Üç adım: kurun, konsolu açın ve iPhone'unuzda ilk kartı görün",
    "hu": "Három lépés: telepítés, a konsol megnyitása, az első kártya megtekintése iPhone-on",
  } satisfies L,
  subtitle: {
    en: "Every command, flag, endpoint and key below comes from the repository itself: the README, the three launchers, docker-compose.yml, gen_voucher.py and the console source. If a script does not implement an option, this page does not print it.",
    "ru": "Каждая команда, каждый флаг, каждая конечная точка и каждый ключ ниже взяты из самого репозитория: README, трёх скриптов запуска, docker-compose.yml, gen_voucher.py и исходников консоли. Чего нет в скриптах, того нет и на этой странице.",
    "de": "Jeder Befehl, jeder Schalter, jeder Endpunkt und jeder Schlüssel unten stammt aus dem Repository selbst: README, die drei Startskripte, docker-compose.yml, gen_voucher.py und der Konsolenquelltext. Was ein Skript nicht umsetzt, steht hier nicht.",
    "fr": "Chaque commande, chaque option, chaque point d'entrée et chaque clé ci-dessous viennent du dépôt lui-même : le README, les trois lanceurs, docker-compose.yml, gen_voucher.py et le code de la console. Ce qu'un script n'implémente pas n'est pas affiché ici.",
    "it": "Ogni comando, ogni opzione, ogni endpoint e ogni chiave riportati qui sotto provengono dal repository stesso: README, i tre script di avvio, docker-compose.yml, gen_voucher.py e il sorgente della console. Se uno script non implementa un'opzione, questa pagina non la stampa.",
    "nl": "Elk commando, elke vlag, elk eindpunt en elke sleutel hieronder komt uit de repository zelf: README, de drie startscripts, docker-compose.yml, gen_voucher.py en de broncode van de console. Wat een script niet biedt, zetten we hier niet op.",
    "cs": "Každý příkaz, každý přepínač, každý koncový bod i každý klíč níže pochází ze samotného repozitáře: README, tří spouštěcích skriptů, docker-compose.yml, gen_voucher.py a zdrojového kódu konzole. Co skript neimplementuje, tiskneme i my vynecháváme.",
    "zh-Hans": "下面每一条命令、每一个开关、每一个接口都取自 popopx-service-suite 仓库里的 README、三个启动脚本、docker-compose.yml、gen_voucher.py 与管理后台源码。脚本里没有的选项，这里一律不写。",
    "zh-Hant": "底下每一行指令、每一個開關、每一個介面都取自 popopx-service-suite 倉庫裡的 README、三個啟動腳本、docker-compose.yml、gen_voucher.py 與管理後台原始碼。腳本裡沒有的選項，這裡一概不寫。",
    "es": "Cada comando, cada opción, cada endpoint y cada clave de abajo proceden del propio repositorio: el README, los tres lanzadores, docker-compose.yml, gen_voucher.py y el código de la consola. Si un script no implementa una opción, esta página no la muestra.",
    "pl": "Każde polecenie, każda opcja, każdy punkt końcowy i każdy klucz poniżej pochodzą z samego repozytorium: README, trzech skryptów startowych, docker-compose.yml, gen_voucher.py oraz kodu konsoli. Czego skrypt nie implementuje, tego nie ma na tej stronie.",
    "ja": "以下に掲載するコマンド・オプション・エンドポイント・キーはすべてリポジトリそのものから取っています。README、3つの起動スクリプト、docker-compose.yml、gen_voucher.py、そしてコンソールのソースコードです。スクリプトが実装していないオプションはこのページには書きません。",
    "th": "ทุกคำสั่ง ทุกตัวเลือก ทุก endpoint และทุกคีย์ด้านล่างมาจากตัวรีโปเอง ได้แก่ README, สคริปต์เปิดใช้งานสามตัว, docker-compose.yml, gen_voucher.py และซอร์สของคอนโซล ถ้าสคริปต์ไม่มีออปชันไหน หน้านี้ก็จะไม่เขียนถึง",
    "fi": "Jokainen komento, lippu, päätepiste ja avain alla on peräisin versiosta itsestään: README, kolme käynnistyskomentosarjaa, docker-compose.yml, gen_voucher.py ja konsolin lähdekoodi. Jos skripti ei tue valintaa, emme listaa sitä myöskään tällä sivulla.",
    "uk": "Кожна команда, кожен прапорець, кожна кінцева точка й кожен ключ нижче взяті з самого репозиторію: README, трьох скриптів запуску, docker-compose.yml, gen_voucher.py та вихідного коду консолі. Чого скрипти не реалізують, того немає й на цій сторінці.",
    "bg": "Всяка команда, всеки флаг, всяка крайна точка и всеки ключ по-долу са взети от самото хранилище: README, трите стартиращи скрипта, docker-compose.yml, gen_voucher.py и изходният код на конзолата. Каквото скриптът не поддържа, не го изписваме и тук.",
    "tr": "Aşağıdaki her komut, her bayrak, her uç nokta ve her anahtar deposunun kendisinden alınmıştır: README, üç başlatma betiği, docker-compose.yml, gen_voucher.py ve konsol kaynak kodu. Bir betiğin desteklemediği hiçbir seçeneği burada yayınlamıyoruz.",
    "hu": "Az alábbi minden parancs, kapcsoló, végpont és kulcs a tárolóból származik: README, a három indító szkript, a docker-compose.yml, a gen_voucher.py és a konzol forráskódja. Amely kapcsolót egy szkript nem valósítja meg, azt ez az oldal nem írja le.",
  } satisfies L,

  /* Part 1 */
  p1Eyebrow: {
    en: "Step 1 · STEP 01",
    "ru": "Шаг 1 · STEP 01",
    "de": "Schritt 1 · STEP 01",
    "fr": "Étape 1 · STEP 01",
    "it": "Passo 1 · STEP 01",
    "nl": "Stap 1 · STEP 01",
    "cs": "Krok 1 · STEP 01",
    "zh-Hans": "第一步 · STEP 01",
    "zh-Hant": "第一步 · STEP 01",
    "es": "Paso 1 · STEP 01",
    "pl": "Krok 1 · STEP 01",
    "ja": "ステップ1 · STEP 01",
    "th": "ขั้นที่ 1 · STEP 01",
    "fi": "Vaihe 1 · STEP 01",
    "uk": "Крок 1 · STEP 01",
    "bg": "Стъпка 1 · STEP 01",
    "tr": "Adım 1 · STEP 01",
    "hu": "1. lépés · STEP 01",
  } satisfies L,
  p1Title: {
    en: "Install the environment and launch it in one command",
    "ru": "Установка окружения и запуск одной командой",
    "de": "Umgebung installieren und mit einem Befehl starten",
    "fr": "Installer l'environnement et lancer en une commande",
    "it": "Installa l'ambiente e avvialo con un comando",
    "nl": "Installeer de omgeving en start met één commando",
    "cs": "Nainstalujte prostředí a spusťte jedním příkazem",
    "zh-Hans": "环境安装与一键启动",
    "zh-Hant": "環境安裝與一鍵啟動",
    "es": "Instala el entorno y arranca con un solo comando",
    "pl": "Zainstaluj środowisko i uruchom jednym poleceniem",
    "ja": "環境をインストールして1コマンドで起動",
    "th": "ติดตั้งสภาพแวดล้อมแล้วเริ่มด้วยคำสั่งเดียว",
    "fi": "Asenna ympäristö ja käynnistä yhdellä komennolla",
    "uk": "Встановіть середовище й запустіть однією командою",
    "bg": "Инсталирайте средата и стартирайте с една команда",
    "tr": "Ortamı kurun ve tek komutla başlatın",
    "hu": "A környezet telepítése és indítás egyetlen paranccsal",
  } satisfies L,
  p1Sub: {
    en: "Production hosts run an installer: sudo ./install_ubuntu22.sh on Ubuntu, or sudo ./install_macos.sh on macOS, where the gateway becomes a native launchd daemon. The ./start_macos.sh launcher is the development path — it runs the gateway in the foreground out of a venv. All three bring the gateway up on 8080 and keep the node's WebSocket on 127.0.0.1:5225.",
    "ru": "Продакшен-серверы ставят установщиком: sudo ./install_ubuntu22.sh на Ubuntu или sudo ./install_macos.sh на macOS, где шлюз становится нативным демоном launchd. Скрипт ./start_macos.sh — это путь разработки: он поднимает шлюз на переднем плане из venv. Все три поднимают шлюз на 8080 и держат WebSocket узла на 127.0.0.1:5225.",
    "de": "Produktivrechner laufen mit einem Installer: sudo ./install_ubuntu22.sh auf Ubuntu oder sudo ./install_macos.sh auf macOS, wo das Gateway zum nativen launchd-Daemon wird. Das Skript ./start_macos.sh ist der Entwicklungsweg — es startet das Gateway im Vordergrund aus einem venv. Alle drei bringen das Gateway auf Port 8080 hoch und halten das Node-WebSocket auf 127.0.0.1:5225.",
    "fr": "Les serveurs de production passent par un installeur : sudo ./install_ubuntu22.sh sur Ubuntu, ou sudo ./install_macos.sh sur macOS, où la passerelle devient un démon launchd natif. Le lanceur ./start_macos.sh est la voie de développement — il exécute la passerelle au premier plan depuis un venv. Les trois démarrent la passerelle sur 8080 et gardent le WebSocket du nœud sur 127.0.0.1:5225.",
    "it": "Le macchine di produzione usano un installer: sudo ./install_ubuntu22.sh su Ubuntu, oppure sudo ./install_macos.sh su macOS, dove il gateway diventa un demone launchd nativo. Lo script ./start_macos.sh è la strada di sviluppo — esegue il gateway in foreground da un venv. Tutti e tre avviano il gateway sulla porta 8080 e mantengono il WebSocket del nodo su 127.0.0.1:5225.",
    "nl": "Productiehosts draaien een installateur: sudo ./install_ubuntu22.sh op Ubuntu, of sudo ./install_macos.sh op macOS, waar de gateway een native launchd-daemon wordt. Het script ./start_macos.sh is het ontwikkelingsspoor — het draait de gateway op de voorgrond uit een venv. Alle drie brengen de gateway op 8080 omhoog en houden de node-WebSocket op 127.0.0.1:5225.",
    "cs": "Produkční stroje spouštějí instalátor: sudo ./install_ubuntu22.sh na Ubuntu, nebo sudo ./install_macos.sh na macOS, kde se brána stane nativním démonem launchd. Skript ./start_macos.sh je vývojová cesta — spouští bránu na popředí z venv. Všechny tři cesty spustí bránu na portu 8080 a drží WebSocket uzlu na 127.0.0.1:5225.",
    "zh-Hans": "生产机用安装脚本：Ubuntu 上是 sudo ./install_ubuntu22.sh，macOS 上是 sudo ./install_macos.sh——后者把网关装成原生 launchd 守护进程。./start_macos.sh 是开发路径，它从 venv 里前台起网关。三条路都把网关起在 8080，把节点 WebSocket 起在 127.0.0.1:5225。",
    "zh-Hant": "生產機用安裝腳本：Ubuntu 上是 sudo ./install_ubuntu22.sh，macOS 上是 sudo ./install_macos.sh——後者把閘道裝成原生 launchd 背景服務。./start_macos.sh 是開發路徑，它從 venv 裡前景啟動閘道。三條路都把閘道起在 8080，把節點 WebSocket 起在 127.0.0.1:5225。",
    "es": "Los servidores de producción usan un instalador: sudo ./install_ubuntu22.sh en Ubuntu, o sudo ./install_macos.sh en macOS, donde la pasarela pasa a ser un demonio launchd nativo. El lanzador ./start_macos.sh es el camino de desarrollo — ejecuta la pasarela en primer plano desde un venv. Los tres levantan la pasarela en el 8080 y mantienen el WebSocket del nodo en 127.0.0.1:5225.",
    "pl": "Serwery produkcyjne korzystają z instalatora: sudo ./install_ubuntu22.sh na Ubuntu albo sudo ./install_macos.sh na macOS, gdzie brama staje się natywnym demonem launchd. Skrypt ./start_macos.sh to ścieżka deweloperska — uruchamia bramę na pierwszym planie z venv. Wszystkie trzy podnoszą bramę na porcie 8080 i trzymają WebSocket węzła na 127.0.0.1:5225.",
    "ja": "本番機はインストーラーで立てます。Ubuntu では sudo ./install_ubuntu22.sh、macOS では sudo ./install_macos.sh で、ゲートウェイが native な launchd デーモンになります。./start_macos.sh は開発用の道で、venv からフォアグラウンドにゲートウェイを起動します。3つともゲートウェイを 8080 で起動し、ノードの WebSocket は 127.0.0.1:5225 に保ちます。",
    "th": "เครื่องงานจริงใช้ตัวติดตั้ง: sudo ./install_ubuntu22.sh บน Ubuntu หรือ sudo ./install_macos.sh บน macOS ซึ่งตัวหลังจะแปลง gateway ให้เป็น daemon launchd แบบ native ส่วน ./start_macos.sh คือเส้นทางพัฒนา — มันรัน gateway แบบ foreground จาก venv ทั้งสามทางยก gateway ขึ้นที่พอร์ต 8080 และคง WebSocket ของโหนดไว้ที่ 127.0.0.1:5225",
    "fi": "Tuotantokoneet käyttävät asennusohjelmaa: sudo ./install_ubuntu22.sh Ubuntulla tai sudo ./install_macos.sh macOS:llä, jolloin gatewaysta tulee natiivi launchd-daemoni. ./start_macos.sh on kehityspolku — se ajaa gatewayn etualalla venvistä. Kaikki kolme nostavat gatewayn portille 8080 ja pitävät solmun WebSocketin osoitteessa 127.0.0.1:5225.",
    "uk": "Продакшн-сервери ставлять інсталятором: sudo ./install_ubuntu22.sh на Ubuntu або sudo ./install_macos.sh на macOS, де шлюз стає нативним демоном launchd. Скрипт ./start_macos.sh — це шлях розробки: він піднімає шлюз на передньому плані з venv. Усі три піднімають шлюз на 8080 і тримають WebSocket вузла на 127.0.0.1:5225.",
    "bg": "Продукционните машини използват инсталатор: sudo ./install_ubuntu22.sh върху Ubuntu или sudo ./install_macos.sh върху macOS, където шлюзът става нативен launchd демон. Скриптът ./start_macos.sh е developmentalният път — той задига шлюза на преден план от venv. И трите вдигат шлюза на порт 8080 и държат WebSocket на възела на 127.0.0.1:5225.",
    "tr": "Üretim sunucuları bir kurulum programı çalıştırır: Ubuntu'da sudo ./install_ubuntu22.sh ya da macOS'ta sudo ./install_macos.sh; ikinci seçenekte ağ geçidi native bir launchd yardımcısı olur. ./start_macos.sh betiği ise geliştirme yoludur — ağ geçidini bir venv içinden ön planda çalıştırır. Üçünün de ağ geçidini 8080 portunda ayağa kaldırır ve düğümün WebSocket'ini 127.0.0.1:5225 adresinde tutar.",
    "hu": "Éles gépeken telepítővel indul: sudo ./install_ubuntu22.sh Ubuntu-n, vagy sudo ./install_macos.sh macOS-en, ahol az átjáró natív launchd démonná válik. A ./start_macos.sh indító a fejlesztői út — az átjárót az előtérben futtatja egy venv-ből. Mind a három az átjárót a 8080-as porton indítja, a csomópont WebSocketjét pedig 127.0.0.1:5225-ön tartja.",
  } satisfies L,
  tabsLabel: {
    en: "Choose a deployment platform",
    "ru": "Выберите платформу развёртывания",
    "de": "Deployment-Plattform wählen",
    "fr": "Choisir la plateforme de déploiement",
    "it": "Scegli la piattaforma di deployment",
    "nl": "Kies een deployplatform",
    "cs": "Zvolte nasazovací platformu",
    "zh-Hans": "选择部署平台",
    "zh-Hant": "選擇部署平台",
    "es": "Elige la plataforma de despliegue",
    "pl": "Wybierz platformę wdrożenia",
    "ja": "デプロイ先のプラットフォームを選択",
    "th": "เลือกแพลตฟอร์มที่จะใช้งาน",
    "fi": "Valitse käyttöönottomisalusta",
    "uk": "Оберіть платформу розгортання",
    "bg": "Изберете платформа за внедряване",
    "tr": "Dağıtım platformunu seçin",
    "hu": "Válassza ki a telepítési platformot",
  } satisfies L,
  tabsLegend: {
    en: "With focus on a tab, the left and right arrow keys switch platform.",
    "ru": "Когда фокус на вкладке, платформу переключают стрелки влево и вправо.",
    "de": "Wenn der Fokus auf einem Tab liegt, wechseln die Pfeiltasten links und rechts die Plattform.",
    "fr": "Lorsqu'un onglet a le focus, les flèches gauche et droite changent de plateforme.",
    "it": "Con il focus su una scheda, le frecce sinistra e destra cambiano piattaforma.",
    "nl": "Met de focus op een tab wissel je met de pijltjes links en rechts van platform.",
    "cs": "Když je fokus na kartě, platformu přepínají šipky vlevo a vpravo.",
    "zh-Hans": "焦点在标签上时用左右方向键切换。",
    "zh-Hant": "焦點在標籤上時用左右方向鍵切換。",
    "es": "Con el foco en una pestaña, las flechas izquierda y derecha cambian de plataforma.",
    "pl": "Gdy kursor znajduje się na zakładce, strzałki w lewo i w prawo zmieniają platformę.",
    "ja": "タブにフォーカスがある状態では、左矢印・右矢印でプラットフォームを切り替えます。",
    "th": "เมื่อโฟกัสอยู่ที่แท็บ ใช้ปุ่มลูกศรซ้าย-ขวาเพื่อสลับแพลตฟอร์ม",
    "fi": "Kun välilehdellä on fokus, vasen ja oikea nuolinäppäin vaihtavat alustaa.",
    "uk": "Коли фокус на вкладці, платформу перемикають стрілки вліво та вправо.",
    "bg": "Когато фокусът е върху раздел, стрелките наляво и надясно сменят платформата.",
    "tr": "Bir sekmede odakliyken sol ve sağ ok tuşları platformu değiştirir.",
    "hu": "Ha a fülön van a fókusz, a bal és jobb nyíl billentyűk váltanak platformot.",
  } satisfies L,
  tabUbuntu: {
    en: "Ubuntu 22.04 LTS production",
    "ru": "Ubuntu 22.04 LTS, продакшен",
    "de": "Ubuntu 22.04 LTS Produktion",
    "fr": "Ubuntu 22.04 LTS en production",
    "it": "Ubuntu 22.04 LTS produzione",
    "nl": "Ubuntu 22.04 LTS productie",
    "cs": "Ubuntu 22.04 LTS, produkce",
    "zh-Hans": "Ubuntu 22.04 LTS 生产部署",
    "zh-Hant": "Ubuntu 22.04 LTS 生產部署",
    "es": "Ubuntu 22.04 LTS, producción",
    "pl": "Ubuntu 22.04 LTS, środowisko produkcyjne",
    "ja": "Ubuntu 22.04 LTS 本番向け",
    "th": "Ubuntu 22.04 LTS สำหรับงานจริง",
    "fi": "Ubuntu 22.04 LTS, tuotanto",
    "uk": "Ubuntu 22.04 LTS, продакшн",
    "bg": "Ubuntu 22.04 LTS, продукция",
    "tr": "Ubuntu 22.04 LTS üretim",
    "hu": "Ubuntu 22.04 LTS éles környezet",
  } satisfies L,
  tabMacos: {
    en: "macOS (Apple Silicon / Intel): production & local dev",
    "ru": "macOS (Apple Silicon / Intel): продакшен и локальная разработка",
    "de": "macOS (Apple Silicon / Intel): Produktion und lokale Entwicklung",
    "fr": "macOS (Apple Silicon / Intel) : production et développement local",
    "it": "macOS (Apple Silicon / Intel): produzione e sviluppo locale",
    "nl": "macOS (Apple Silicon / Intel): productie en lokale ontwikkeling",
    "cs": "macOS (Apple Silicon / Intel): produkce a lokální vývoj",
    "zh-Hans": "macOS（Apple Silicon / Intel）生产部署与本地开发",
    "zh-Hant": "macOS（Apple Silicon / Intel）生產部署與本機開發",
    "es": "macOS (Apple Silicon / Intel): producción y desarrollo local",
    "pl": "macOS (Apple Silicon / Intel): produkcja i rozwój lokalny",
    "ja": "macOS（Apple Silicon / Intel）本番とローカル開発",
    "th": "macOS (Apple Silicon / Intel): งานจริงและพัฒนาในเครื่อง",
    "fi": "macOS (Apple Silicon / Intel): tuotanto ja paikallinen kehitys",
    "uk": "macOS (Apple Silicon / Intel): продакшн і локальна розробка",
    "bg": "macOS (Apple Silicon / Intel): продукция и локална разработка",
    "tr": "macOS (Apple Silicon / Intel): üretim ve yerel geliştirme",
    "hu": "macOS (Apple Silicon / Intel): üretim és helyi fejlesztés",
  } satisfies L,

  ubuntuIntro: {
    en: "The installer prints this sentence in its failed-probe warning, not among the numbered NEXT STEPS — that block never mentions /healthz — and --mode native runs the same gateway behind the same route. It gives its own reason there: /healthz reports node state rather than gating readiness on it, so a green answer proves the gateway serves — the next field is what says whether followers can actually be reached.",
    "ru": "Установщик печатает эту фразу в предупреждении о непройденной проверке, а не в нумерованном блоке NEXT STEPS — тот про /healthz вообще не упоминает, — а --mode native поднимает тот же шлюз по тому же маршруту. Причина формулируется там же: /healthz сообщает состояние узла и не является признаком готовности, поэтому зелёный ответ доказывает лишь то, что шлюз обслуживает — достигаются ли подписчики, показывает следующее поле.",
    "de": "Der Installierer gibt diesen Satz in seiner Warnung bei fehlgeschlagener Sonde aus, nicht zwischen den nummerierten NEXT STEPS — der Block erwähnt /healthz mit keinem Wort —, und --mode native betreibt dasselbe Gateway hinter derselben Route. Den Grund nennt er dort selbst: /healthz meldet den Knotenzustand, statt die Bereitschaft daran festzumachen — ein grüner Wert beweist nur, dass das Gateway ausliefert, ob Anhänger erreichbar sind, steht im nächsten Feld.",
    "fr": "L'installeur affiche cette phrase dans son avertissement de sonde échouée, pas dans les NEXT STEPS numérotés — ce bloc ne mentionne jamais /healthz —, et --mode native sert la même passerelle sur la même route. Il en donne la raison là : /healthz rend l'état du nœud sans en faire un critère de préparation ; un feu vert prouve seulement que la passerelle répond — le champ suivant dit si les abonnés sont bel et bien atteignables.",
    "it": "L'installatore stampa questa frase nell'avviso di sonda fallita, non tra i NEXT STEPS numerati — quel blocco non nomina mai /healthz — e --mode native esegue lo stesso gateway sullo stesso percorso. Il motivo lo dà lì: /healthz riporta lo stato del nodo senza usarlo come gate di prontezza, quindi un verde dimostra solo che il gateway serve — se i follower sono raggiungibili lo dice il campo successivo.",
    "nl": "De installateur print deze zin in zijn waarschuwing bij een mislukte probe, niet tussen de genummerde NEXT STEPS — dat blok meldt /healthz met geen woord —, en --mode native draait dezelfde gateway op dezelfde route. De reden geeft hij daar zelf: /healthz meldt de nodestatus zonder die als gereedheid te gebruiken, dus een groen antwoord bewijst alleen dat de gateway bedient — of volgers werkelijk bereikbaar zijn, zegt het volgende veld.",
    "cs": "Instalátor tiskne tuto větu ve varování u nezdařené sondy, nikoli mezi číslované NEXT STEPS — tam se /healthz vůbec neobjeví — a --mode native spouští stejnou bránu na stejné cestě. Zdůvodnění dodává právě tam: /healthz hlásí stav uzlu, aniž by jím měřil připravenost, takže zelená dokládá jen to, že brána obsluhuje — zda jsou odběratelé skutečně dosažitelní, ukáže další pole.",
    "zh-Hans": "容器模式的安装脚本把这句印在「探活失败」的警告里，而不是那条编号 NEXT STEPS——NEXT STEPS 整块从没提到 /healthz（--mode native 起的是同一个网关，同一条路由）。理由也在那句里：/healthz 报的是节点状态，不就以此为就绪门禁——所以这一步绿了只说明网关在服务，粉丝能不能被触达要看下一个字段。",
    "zh-Hant": "容器模式的安裝腳本把這句印在「探活失敗」的警告裡，而不是那條編號 NEXT STEPS——NEXT STEPS 整塊從沒提到 /healthz（--mode native 起的是同一個閘道，同一條路由）。理由也在那句裡：/healthz 報的是節點狀態，不就以此為就緒閘門——所以這一步綠了只說明閘道在服務，粉絲能不能被觸達要看下一個欄位。",
    "es": "El instalador imprime esta frase en su aviso de sonda fallida, no entre los NEXT STEPS numerados —ese bloque nunca menciona /healthz—, y --mode native ejecuta la misma pasarela tras la misma ruta. También da su razón allí: /healthz informa del estado del nodo sin tomarlo como señal de disponibilidad, así que un verde solo prueba que la pasarela sirve; si los seguidores son alcanzables lo dice el campo siguiente.",
    "pl": "Instalator drukuje to zdanie w ostrzeżeniu o nieudanej próbie, a nie wśród numerowanych NEXT STEPS — ten blok w ogóle nie wspomina o /healthz — a --mode native podnosi tę samą bramę na tej samej trasie. Powód podaje właśnie tam: /healthz raportuje stan węzła, nie czyniąc z niego wyznacznika gotowości, więc zielony wynik dowodzi tylko, że brama obsługuje — czy odbiorcy są naprawdę osiągalni, pokazuje następne pole.",
    "ja": "インストーラーはこの文を、プローブ失敗時の警告として出力します。番号付きの NEXT STEPS ではなく、あそこまで /healthz には触れません。--mode native は同じゲートウェイを同じルートで起動します。理由もその警告の中で述べています。/healthz はノードの状態を報告するだけで準備完了の判定には使わないので、ここで緑でも「ゲートウェイが応答している」ことしか確かめられません。フォロワーに届くかどうかは次の欄が見ます。",
    "th": "ตัวติดตั้งพิมพ์ประโยคนี้ไว้ในคำเตือนตอน probe ไม่ผ่าน ไม่ใช่ใน NEXT STEPS ที่ใส่เลขไว้ — ก้อนนั้นไม่เคยพูดถึง /healthz เลย — และ --mode native ก็รัน gateway ตัวเดิมบนเส้นทางเดิม มันอธิบายเหตุผลไว้ในที่นั้นเอง: /healthz รายงานสถานะโหนดแต่ไม่เอามาเป็นเกณฑ์ความพร้อม ดังนั้นขึ้นเขียวพิสูจน์แค่ว่า gateway ให้บริการอยู่ ส่วนผู้ติดตามถูกเข้าถึงได้จริงไหมต้องดูฟิลด์ถัดไป",
    "fi": "Asennusohjelma tulostaa tämän lauseen koeluodon epäillyt varoituksessa, ei numeroitujen NEXT STEPS -kohdassa — kyseinen lohko ei mainitse /healthz:iä ollenkaan — ja --mode native ajaa saman gatewayn saman reitin takana. Syyn se antaa juuri siellä: /healthz kertoo solmun tilan tekemättä siitä valmiuskynnystä, joten vihreä vastaus todistaa vain että gateway palvelee — seuraava kenttä kertoo yltääkö seuraajiin.",
    "uk": "Інсталятор друкує це речення у попередженні про непройдену пробу, а не у нумерованому блоці NEXT STEPS — той про /healthz вообще не згадує, — а --mode native піднімає той самий шлюз на тому самому маршруті. причину формулює там само: /healthz повідомляє стан вузла й не слугує ознакою готовності, тож зелена відповідь доводить хіба що те, що шлюз обслуговує — чи справді дописувачі досяжні, показує наступне поле.",
    "bg": "Инсталаторът печата това изречение в предупреждението при неуспешна сонда, не сред номерираните NEXT STEPS — този блок изобщо не споменава /healthz — а --mode native стартира един и същ шлюз зад един и същи път. Причината дава именно там: /healthz съобщава състоянието на възела, без да го прави праг на готовност, следователно зелено доказва само че шлюзът обслужва — дали последователите наистина се достигат, показва следващото поле.",
    "tr": "Kurulum programı bu cümleyi başarısız yoklama uyarısında yazdırır, numaralı NEXT STEPS listesinde değil — o blok /healthz'den hiç söz etmez —; --mode native aynı ağ geçidini aynı rota arkasında çalıştırır. Gerekçesini de orada verir: /healthz düğüm durumunu bildirir ama hazır olma ölçütü yapmaz — burada yeşil çıkan yanıt yalnızca ağ geçidinin hizmet verdiğini kanıtlar, takipçilere ulaşılıp ulaşılmadığını bir sonraki alan söyler.",
    "hu": "A telepítő ezt a mondatot a sikertelen próba figyelmeztetésében nyomtatja ki, nem a sorszámozott NEXT STEPS között — az a blokk egyáltalán nem említi a /healthz-t —, és a --mode native ugyanazt az átjárót futtatja ugyanazon az útvonalon. A magyarázatot ott adja meg: a /healthz a csomópont állapotát jelenti, nem a készenlét mércéje, tehát a zöld itt csak azt bizonyítja, hogy az átjáró kiszolgál — hogy a követők tényleg elérhetők-e, azt a következő mező mondja meg.",
  } satisfies L,
  macosIntro: {
    en: "This is the very probe the launcher uses: it requests /healthz first and only prints the console address once the gateway answers. On this path the response body is discarded — start_macos.sh logs just gateway healthy (pid N) and never prints node_connected. Dumping the body is what the two production installers do: install_ubuntu22.sh and install_macos.sh each curl /healthz and print it, and that is where a node that stayed down shows up as node_connected. A node that stays down never aborts the run.",
    "ru": "Это именно та проверка, которой пользуется запускатор: сначала он запрашивает /healthz и только после ответа шлюза печатает адрес консоли. На этом пути тело ответа выбрасывается — start_macos.sh пишет только gateway healthy (pid N) и node_connected не печатает вовсе. Тело печатают два продакшен-установщика: install_ubuntu22.sh и install_macos.sh каждый делает curl /healthz и выводит ответ, — вот там неподнявшийся узел и виден как node_connected. Сам запуск из-за этого не прерывается.",
    "de": "Das ist genau die Sonde, mit der das Startskript arbeitet: Es fragt zuerst /healthz ab und gibt die Konsolenadresse erst aus, wenn das Gateway antwortet. Auf diesem Weg wird der Antwortkörper verworfen — start_macos.sh meldet nur gateway healthy (pid N) und gibt node_connected nie aus. Den Körper ausgeben die zwei Produktions-Installer: install_ubuntu22.sh und install_macos.sh curlen jeweils /healthz und drucken die Antwort; dort erscheint ein nicht hochkommender Knoten als node_connected. Abgebrochen wird der Start deshalb nicht.",
    "fr": "C'est exactement la sonde utilisée par le lanceur : il interroge d'abord /healthz et n'affiche l'adresse de la console qu'une fois la passerelle répondue. Sur ce chemin le corps de réponse est jeté — start_macos.sh ne journalise que gateway healthy (pid N) et n'imprime jamais node_connected. Le corps, ce sont les deux installeurs de production qui l'affichent : install_ubuntu22.sh et install_macos.sh curlent chacun /healthz et impriment la réponse ; c'est là qu'un nœud qui ne démarre pas apparaît comme node_connected. Le lancement n'est jamais interrompu pour autant.",
    "it": "Questa è proprio la sonda che usa l'avviatore: prima chiede /healthz e stampa l'indirizzo della console solo quando il gateway risponde. Su questo percorso il corpo della risposta viene scartato — start_macos.sh registra soltanto gateway healthy (pid N) e non stampa mai node_connected. Il corpo lo stampano i due installer di produzione: install_ubuntu22.sh e install_macos.sh eseguono entrambi un curl /healthz e ne danno l'output; è lì che un nodo non avviato compare come node_connected. L'avvio comunque non si interrompe.",
    "nl": "Dit is precies de probe waar de starter gebruik van maakt: eerst wordt /healthz aangevraagd en pas als de gateway antwoordt wordt het consoleadres geprint. Op dit pad wordt de response-body weggegooid — start_macos.sh logt alleen gateway healthy (pid N) en print node_connected nooit. De body printen de twee productie-installateurs: install_ubuntu22.sh en install_macos.sh curlen beide /healthz en tonen het antwoord; daar verschijnt een node die niet opstaat als node_connected. De start wordt er niet door afgebroken.",
    "cs": "Tohle je přesně ta sonda, kterou spouštěč používá: nejdřív požaduje /healthz a adresu konzole vypíše, až když brána odpoví. Na této cestě se tělo odpovězení zahazuje – start_macos.sh loguje jen gateway healthy (pid N) a node_connected nikdy nevytiskne. Tělo tisknou dva produkční instalátory: install_ubuntu22.sh i install_macos.sh si každý curlnou /healthz a výpis dodají; tam se uzel, který nevstal, objeví jako node_connected. Běh tím přerušen není.",
    "zh-Hans": "脚本探活用的就是这一条：它先向 /healthz 发请求，只有网关答了才开始打印后台地址。在这条路上响应体是被丢掉的——start_macos.sh 只记一行 gateway healthy (pid N)，从头到尾不会打印 node_connected。把响应体打出来的是那两个生产安装脚本：install_ubuntu22.sh 和 install_macos.sh 各自 curl 一次 /healthz 并把内容贴出来，节点没起来就在那一行里显示成 node_connected。节点没起来本身不会中止这次启动。",
    "zh-Hant": "腳本探活用的就是這一條：它先向 /healthz 發請求，只有閘道答了才開始列印後臺位址。在這條路上回應體是被丟掉的——start_macos.sh 只記一行 gateway healthy (pid N)，從頭到尾不會列印 node_connected。把回應體打出來的是那兩個生產安裝腳本：install_ubuntu22.sh 和 install_macos.sh 各自 curl 一次 /healthz 並把內容貼出來，節點沒起來就在那一行裡顯示成 node_connected。節點沒起來本身不會中止這次啟動。",
    "es": "Es exactamente la sonda que usa el lanzador: primero consulta /healthz y solo imprime la dirección de la consola cuando la pasarela responde. En este camino el cuerpo de la respuesta se descarta — start_macos.sh registra apenas gateway healthy (pid N) y nunca imprime node_connected. El cuerpo lo imprimen los dos instaladores de producción: install_ubuntu22.sh e install_macos.sh hacen cada uno un curl a /healthz y vuelcan la respuesta; ahí es donde un nodo que no arranca aparece como node_connected. La ejecución no se interrumpe por ello.",
    "pl": "To dokładnie ta próba, której używa uruchamiacz: najpierw odpytuje /healthz i drukuje adres konsoli dopiero, gdy brama odpowie. Na tej ścieżce treść odpowiedzi jest wyrzucana — start_macos.sh loguje tylko gateway healthy (pid N) i nigdy nie drukuje node_connected. Treść drukują dwa instalatory produkcyjne: install_ubuntu22.sh i install_macos.sh wykonują każdy curl /healthz i wypisują odpowiedź; tam właśnie węzeł, który nie wstał, pojawia się jako node_connected. Start przez to nie jest przerywany.",
    "ja": "起動スクリプトが使うのはまさにこのプローブです。まず /healthz に要求を送り、ゲートウェイが応答して初めてコンソールのアドレスを表示します。この経路ではレスポンス本体は捨てられるため、start_macos.sh が記録するのは gateway healthy (pid N) だけで、node_connected は一度も表示されません。本体を表示するのは2つの本番インストーラーです。install_ubuntu22.sh と install_macos.sh はそれぞれ /healthz を curl して結果をそのまま出力し、そこで初めてノードが上がっていないことが node_connected として現れます。ノードが上がらなくても実行は中断されません。",
    "th": "นี่คือตัวตรวจที่สคริปต์เริ่มต้นใช้อย่างแท้จริง: มันเรียก /healthz ก่อน และจะพิมพ์ที่อยู่คอนโซลก็ต่อเมื่อ gateway ตอบกลับมา บนเส้นทางนี้ body ของคำตอบจะถูกทิ้ง — start_macos.sh บันทึกแค่ gateway healthy (pid N) และไม่พิมพ์ node_connected เลย ส่วนที่พิมพ์ body คือตัวติดตั้งงานจริงสองตัว: install_ubuntu22.sh กับ install_macos.sh ต่าง curl /healthz แล้วพิมพ์ผลตอบกลับออกมา โหนดที่ไม่ขึ้นจะไปปรากฏเป็น node_connected อยู่ตรงนั้น และการเริ่มงานไม่ถูกยกเลิกเพราะเรื่องนิ้",
    "fi": "Tämä on täsmälleen se koeluota, jota käynnistäjä käyttää: se kyselee ensin /healthz:ia ja tulostaa konsolensa osoitteen vasta gatewayn vastattua. Tällä polulla vastauksen body heitetään pois – start_macos.sh merkitsee vain gateway healthy (pid N) eikä tulosta node_connected lainkaan. Bodyn tulostavat kaksi tuotantoasentajaa: install_ubuntu22.sh ja install_macos.sh molemmat curlaavat /healthz:n ja printtaavat vastauksen; siinä ylös lähtemätön solmu näkyy node_connected-kenttänä. Käynnistys ei siitä keskeydy.",
    "uk": "Це саме та проба, якою користується запускач: спершу він запитує /healthz і лише коли шлюз відповість, друкує адресу консолі. На цьому шляху тіло відповіді викидається — start_macos.sh пише лише gateway healthy (pid N) і взагалі не друкує node_connected. Тіло друкують два продакшн-інсталятори: install_ubuntu22.sh та install_macos.sh кожен роблять curl /healthz і виводять відповідь; саме там вузол, що не піднявся, показується як node_connected. Сам запуск через це не переривається.",
    "bg": "Това е точно сондата, с която работи стартерът: първо проверява /healthz и чак когато шлюзът отговори, печата адреса на конзолата. По този път тялото на отговора се изхвърля — start_macos.sh записва само gateway healthy (pid N) и никога не печата node_connected. Тялото го печатат двата продукционни инсталатора: install_ubuntu22.sh и install_macos.sh всеки прави curl към /healthz и изписва отговора; там именно възел, който не е станал, се вижда като node_connected. Стартирането не се прекъсва заради това.",
    "tr": "Bu, başlatma betiğinin kullandığı yoklamanın ta kendisidir: önce /healthz'i sorgular, ağ geçidi yanıt verince konsol adresini yazdırır. Bu yolda yanıt gövdesi atılır — start_macos.sh yalnızca gateway healthy (pid N) kaydeder ve node_connected'i hiç yazdırmaz. Gövdeyi iki üretim kurulum programı döküyor: install_ubuntu22.sh ve install_macos.sh ikisi de /healthz'i curl'leyip çıktıyı basar; ayağa kalkmayan düğüm ancak orada node_connected olarak görünür. Çalışma bu yüzden yarıda kesilmez.",
    "hu": "Ez pontosan az a próba, amit az indító használ: előbb a /healthz-t kérdezi le, és csak az átjáró válasza után nyomtatja ki a konzol címét. Ezen az úton a válasz törzsét eldobja — a start_macos.sh csak azt jegyzi meg, hogy gateway healthy (pid N), és node_connected-t soha nem nyomtat ki. A törzsét két üretim telepítő írja ki: az install_ubuntu22.sh és az install_macos.sh egyaránt megcurlazza a /healthz-t és kiszedi a választ; ott jelenik meg a fel nem kelő csomópont node_connected formájában. Az indítás ettől nem szakad meg.",
  } satisfies L,

  uCloneT: {
    en: "Get the source",
    "ru": "Получить исходники",
    "de": "Quelltext holen",
    "fr": "Récupérer les sources",
    "it": "Ottieni il sorgente",
    "nl": "Haal de broncode",
    "cs": "Získat zdrojový kód",
    "zh-Hans": "取源码",
    "zh-Hant": "取原始碼",
    "es": "Obtén el código fuente",
    "pl": "Pobierz kod źródłowy",
    "ja": "ソースを取得",
    "th": "ดึงซอร์สโค้ด",
    "fi": "Hae lähdekoodi",
    "uk": "Отримати вихідний код",
    "bg": "Свали изходния код",
    "tr": "Kaynak kodu edinin",
    "hu": "A forráskód beszerzése",
  } satisfies L,
  uCloneC: {
    en: "The installer looks for docker-compose.yml and gateway/app next to itself and aborts if either is missing, so a half-finished checkout never becomes a running service.",
    "ru": "Установщик ищет docker-compose.yml и gateway/app рядом со своим собственным каталогом и выходит, если чего-то не хватает, — недоустановленный код никогда не станет работающим сервисом.",
    "de": "Der Installierer sucht docker-compose.yml und gateway/app im eigenen Verzeichnis und bricht ab, wenn eines fehlt — ein halb ausgepackter Checkout wird so niemals zum laufenden Dienst.",
    "fr": "L'installeur cherche docker-compose.yml et gateway/app à côté de son propre répertoire et s'arrête si l'un manque : un dépôt à moitié copié ne devient jamais un service en marche.",
    "it": "L'installatore cerca docker-compose.yml e gateway/app nella propria directory e si interrompe se manca qualcosa: un checkout a metà non diventa mai un servizio attivo.",
    "nl": "De installateur zoekt docker-compose.yml en gateway/app naast zichzelf en stopt als er iets ontbreekt — een half afgemaakte checkout wordt zo nooit een draaiende dienst.",
    "cs": "Instalátor hledá docker-compose.yml a gateway/app vedle svého vlastního adresáře a při chybějící složce skončí — nedokončený checkout se tak nikdy nestane běžící službou.",
    "zh-Hans": "安装脚本会从自己所在目录找 docker-compose.yml 和 gateway/app，缺任何一个就当场退出——半套装载不会变成服务。",
    "zh-Hant": "安裝腳本會從自己所在目錄找 docker-compose.yml 與 gateway/app，缺任何一個就當場退出——半套装載不會變成服務。",
    "es": "El instalador busca docker-compose.yml y gateway/app junto a su propio directorio y aborta si falta alguno: un checkout a medias nunca acaba siendo un servicio en marcha.",
    "pl": "Instalator szuka docker-compose.yml i katalogu gateway/app obok siebie i przerywa, gdy czegoś brakuje — niedokończony checkout nigdy nie stanie się działającą usługą.",
    "ja": "インストーラーは自分と同じ階層にある docker-compose.yml と gateway/app を探し、どちらかが無ければその場で終了します。途中で止まったチェックアウトがサービスとして起動することはありません。",
    "th": "ตัวติดตั้งจะมองหา docker-compose.yml และ gateway/app ในโฟลเดอร์เดียวกับมัน แล้วจบงานทันทีถ้าขาดอย่างใดอย่างหนึ่ง — ซอร์สที่ยังดาวน์โหลดไม่ครบจะไม่มีวันกลายเป็นเซอร์วิสที่รันอยู่",
    "fi": "Asennusohjelma etsii docker-compose.yml:n ja gateway/app:n omasta hakemistoaan ja lopettaa, jos kumpi tahansa puuttuu — kesken jäänyt checkout ei koskaan tule palveluksi.",
    "uk": "Інсталятор шукає docker-compose.yml і gateway/app поруч із власним каталогом і виходить, якщо чогось бракує, — недокопійований код ніколи не стане робочим сервісом.",
    "bg": "Инсталаторът търси docker-compose.yml и gateway/app до собствената си директория и спира, ако липсва някое от двете — незавършен checkout никога няма да стане работеща услуга.",
    "tr": "Kurulum programı kendi dizininin yanında docker-compose.yml ve gateway/app arar; biri eksikse hemen durur, böylece yarım kalmış bir klon asla çalışan bir hizmet olmaz.",
    "hu": "A telepítő a saját könyvtára mellett keresi a docker-compose.yml és a gateway/app elemeket, és hiány esetén azonnal kilép — a félig pakolt checkout sosem lesz futó szolgáltatás.",
  } satisfies L,
  uEnvT: {
    en: "Configure: cp .env.example .env",
    "ru": "Настройка: cp .env.example .env",
    "de": "Konfiguration: cp .env.example .env",
    "fr": "Configuration : cp .env.example .env",
    "it": "Configurazione: cp .env.example .env",
    "nl": "Configureren: cp .env.example .env",
    "cs": "Konfigurace: cp .env.example .env",
    "zh-Hans": "配置：cp .env.example .env",
    "zh-Hant": "設定：cp .env.example .env",
    "es": "Configuración: cp .env.example .env",
    "pl": "Konfiguracja: cp .env.example .env",
    "ja": "設定：cp .env.example .env",
    "th": "ตั้งค่า: cp .env.example .env",
    "fi": "Määritys: cp .env.example .env",
    "uk": "Налаштування: cp .env.example .env",
    "bg": "Конфигуриране: cp .env.example .env",
    "tr": "Yapılandırma: cp .env.example .env",
    "hu": "Beállítás: cp .env.example .env",
  } satisfies L,
  uEnvC: {
    en: ".env.example carries 58 commented keys — the README points at the very grep that counts them. The lookup order is --env <path> → $POPOPX_ENV_FILE → the repository root's .env, and a value already in the process environment overrides the file: the orchestrator wins. An unrecognised POPOPX_* key is ignored rather than an error, while a malformed KEY=value line stops startup on purpose.",
    "ru": "В .env.example 58 ключей, и каждый с комментарием. Порядок поиска: --env <path>, затем $POPOPX_ENV_FILE, затем .env в корне репозитория; значение из окружения процесса перекрывает файл. Не распознанные ключи POPOPX_* просто игнорируются и не считаются ошибкой.",
    "de": ".env.example führt 58 kommentierte Schlüssel. Die Suchreihenfolge ist --env <path> → $POPOPX_ENV_FILE → .env im Repository-Rumpf, und ein Wert aus der Prozessumgebung schlägt die Datei. Unbekannte POPOPX_*-Schlüssel werden ignoriert, nicht als Fehler gewertet.",
    "fr": ".env.example contient 58 clés commentées. L'ordre de recherche est --env <path> → $POPOPX_ENV_FILE → le fichier .env à la racine du dépôt, et une valeur déjà présente dans l'environnement du processus l'emporte sur le fichier. Les clés POPOPX_* non reconnues sont ignorées, sans erreur.",
    "it": ".env.example contiene 58 chiavi, ognuna con un commento. L'ordine di ricerca è --env <path> → $POPOPX_ENV_FILE → il file .env alla radice del repository, e un valore già presente nell'ambiente del processo ha la precedenza sul file. Le chiavi POPOPX_* non riconosciute vengono ignorate, senza errore.",
    "nl": ".env.example bevat 58 keys, elk met commentaar. De zoekvolgorde is --env <path> → $POPOPX_ENV_FILE → het .env-bestand in de root van de repository, en een waarde die al in de procesomgeving staat wint van het bestand. Onbekende POPOPX_*-keys worden genegeerd, niet als fout gemeld.",
    "cs": ".env.example má 58 klíčů, každý s komentářem. Hledá se v pořadí --env <path> → $POPOPX_ENV_FILE → .env v kořeni repozitáře, a hodnota již přítomná v prostředí procesu soubor přebije. Nerozpoznané klíče POPOPX_* se ignorují, není to chyba.",
    "zh-Hans": ".env.example 有 58 个键、每个都有注释（README 给的就是那条 grep）。查找顺序是 --env <path> → $POPOPX_ENV_FILE → 仓库根目录的 .env，进程环境里的同名键覆盖文件值——编排器说的算；未识别的 POPOPX_* 键被忽略、不报错，但写坏的 KEY=value 行会让启动停下来。",
    "zh-Hant": ".env.example 有 58 個鍵、每個都有註解（README 給的就是那條 grep）。尋找順序是 --env <path> → $POPOPX_ENV_FILE → 倉庫根目錄的 .env，程序環境裡的同名鍵覆蓋檔案值——編排器說的算；不認識的 POPOPX_* 鍵會被忽略、不報錯，但寫壞的 KEY=value 行會讓啟動停下來。",
    "es": ".env.example trae 58 claves, cada una comentada. El orden de búsqueda es --env <path> → $POPOPX_ENV_FILE → el archivo .env en la raíz del repositorio, y un valor ya presente en el entorno del proceso gana sobre el archivo. Las claves POPOPX_* no reconocidas se ignoran, no es un error.",
    "pl": "Plik .env.example zawiera 58 kluczy, każdy z komentarzem. Kolejność wyszukiwania to --env <path> → $POPOPX_ENV_FILE → plik .env w katalogu głównym repozytorium, a wartość już obecna w środowisku procesu wygrywa z plikiem. Nierozpoznane klucze POPOPX_* są po prostu ignorowane, nie stanowią błędu.",
    "ja": ".env.example にはコメント付きのキーが58個あります。探索順は --env <path> → $POPOPX_ENV_FILE → リポジトリ直下の .env で、プロセス環境変数に同じ名前の値があればファイルよりそちらが優先されます。認識できない POPOPX_* キーはエラーにせず無視します。",
    "th": "ใน .env.example มี 58 คีย์ แต่ละคีย์มีคอมเมนต์กำกับ ลำดับการค้นหาคือ --env <path> → $POPOPX_ENV_FILE → ไฟล์ .env ที่ root ของรีโป ค่าที่อยู่ในสภาพแวดล้อมของกระบวนการจะทับค่าในไฟล์ ส่วนคีย์ POPOPX_* ที่ไม่รู้จักจะถูกข้ามไปโดยไม่รายงานข้อผิดพลาด",
    "fi": ".env.example sisältää 58 avainta, jokaisen kommentoituna. Hakujärjestys on --env <path> → $POPOPX_ENV_FILE → versionvaraston juuren .env, ja prosessin ympäristössä jo oleva arvo voittaa tiedoston. Tuntemattomat POPOPX_*-avaimet jätetään huomiotta, eikä niistä tule virhettä.",
    "uk": "У .env.example 58 ключів, кожен із коментарем. Порядок пошуку: --env <path> → $POPOPX_ENV_FILE → .env у корені репозиторію; значення з середовища процесу перекриває файл. Нерозпізнані ключі POPOPX_* ігноруються й не вважаються помилкою.",
    "bg": ".env.example съдържа 58 ключа, всеки с коментар. Редът на търсене е --env <path> → $POPOPX_ENV_FILE → файлът .env в корена на хранилището, а стойност, вече налична в средата на процеса, надделява над файла. Неразпознатите POPOPX_* ключове се игнорират, не са грешка.",
    "tr": ".env.example içinde her biri açıklamalı 58 anahtar var. Arama sırası --env <path> → $POPOPX_ENV_FILE → depo kökündeki .env şeklindedir; süreç ortamında zaten bulunan bir değer dosyayı ezer. Tanınmayan POPOPX_* anahtarları yok sayılır, hata olarak raporlanmaz.",
    "hu": "A .env.example 58 kommentált kulcsot tartalmaz. A keresési sorrend: --env <path> → $POPOPX_ENV_FILE → a gyökér .env fájlja, és a folyamat környezetében már szereplő érték felülbírálja a fájlt. Az ismeretlen POPOPX_* kulcsokat a rendszer figyelmen kívül hagyja, nem hibajelenség.",
  } satisfies L,
  uTokenT: {
    en: "Admin token: do not skip this",
    "ru": "Админ-токен: этот шаг не пропускают",
    "de": "Admin-Token: dieser Schritt ist Pflicht",
    "fr": "Jeton d'administration : ne sautez pas cette étape",
    "it": "Token di amministrazione: questo passo non si salta",
    "nl": "Beheertoken: deze stap sla je niet over",
    "cs": "Admin token: tento krok nepřeskakujte",
    "zh-Hans": "管理令牌：这一步不能跳",
    "zh-Hant": "管理權杖：這一步不能跳",
    "es": "Token de administración: este paso no se omite",
    "pl": "Token administratora: ten krok jest obowiązkowy",
    "ja": "管理トークン：このステップは飛ばせません",
    "th": "โทเคนผู้ดูแล: ข้ามขั้นตอนนี้ไม่ได้",
    "fi": "Ylläpilotunnus: tätä vaihetta ei ohiteta",
    "uk": "Адмін-токен: цей крок не пропускають",
    "bg": "Административен токен: тази стъпка не се прескача",
    "tr": "Yönetici jetonu: bu adım atlanmaz",
    "hu": "Adminisztrátori token: ezt a lépést nem lehet kihagyni",
  } satisfies L,
  uTokenC: {
    en: "Paste the 64 hex characters it prints into POPOPX_ADMIN_TOKEN= in .env. load_config() refuses to start when that key is missing, shorter than 24 characters, or still an example value — and the refusal message itself hands you this generator. The installer only generates a token when there is no .env at all, and then leaves .env at mode 0600; once you have copied one, it will not touch it.",
    "ru": "Вставьте 64 шестнадцатеричных символа, которые печатает эта команда, в POPOPX_ADMIN_TOKEN= внутри .env. load_config() отказывается запускаться, когда ключ отсутствует, короче 24 символов или остался примерным, — и в самом тексте отказа есть эта строка-генератор. Установщик генерирует токен только когда файла .env нет вовсе, и тогда выставляет .env режим 0600; скопировали вы его сами — он его не тронет.",
    "de": "Fügen Sie die 64 Hex-Zeichen, die der Befehl ausgibt, in POPOPX_ADMIN_TOKEN= in .env ein. load_config() verweigert den Start, wenn der Schlüssel fehlt, kürzer als 24 Zeichen ist oder noch ein Beispielwert ist — und die Ablehnungsmeldung nennt diesen Generator gleich mit. Der Installierer erzeugt nur dann ein Token, wenn es gar keine .env gibt, und belässt .env dann bei Modus 0600; wer selbst kopiert hat, dessen Datei bleibt unberührt.",
    "fr": "Collez les 64 caractères hexadécimaux qu'il affiche dans POPOPX_ADMIN_TOKEN= du fichier .env. load_config() refuse de démarrer si la clé est absente, fait moins de 24 caractères ou vaut encore l'exemple fourni — et le message de refus vous donne justement cette commande de génération. L'installeur ne génère un jeton que s'il n'existe aucun .env, et laisse alors .env en mode 0600 ; si vous l'avez copié vous-même, il n'y touchera pas.",
    "it": "Incolla i 64 caratteri esadecimali che vengono stampati in POPOPX_ADMIN_TOKEN= dentro .env. load_config() rifiuta l'avvio quando la chiave manca, è più corta di 24 caratteri o è ancora il valore d'esempio, e il messaggio di rifiuto contiene proprio questo generatore. L'installatore crea un token solo se non esiste alcun file .env, e in quel caso lascia .env in modalità 0600; se l'hai copiato tu, non lo tocca.",
    "nl": "Plak de 64 hex-tekens die het commando print in POPOPX_ADMIN_TOKEN= in .env. load_config() weigert te starten als die sleutel ontbreekt, korter is dan 24 tekens of nog een voorbeeldwaarde is — en de weigeringsmelding zelf geeft je deze generator. De installateur maakt alleen een token aan als er helemaal geen .env is, en laat .env dan op modus 0600 staan; heb je zelf gekopieerd, dan komt hij het bestand niet aan.",
    "cs": "Všechen 64 hexadecimálních znaků, které příkaz vytiskne, vložte do POPOPX_ADMIN_TOKEN= v .env. load_config() odmítne spustit, když klíč chybí, je kratší než 24 znaků nebo je to stále ukázková hodnota — a v samotné odmítací hlášce najdete tento generátor. Instalátor vygeneruje token pouze tehdy, když .env vůbec neexistuje, a nechá .env režimu 0600; pokud jste si zkopírovali sami, souboru se nedotkne.",
    "zh-Hans": "把生成出的 64 个十六进制字符写进 .env 的 POPOPX_ADMIN_TOKEN=。load_config() 在这个键缺失、短于 24 字符或仍是示例值时拒绝启动，而它的拒绝信息里就带着这句生成命令。安装脚本只有在 .env 完全不存在时才会自己生成令牌，并把 .env 设成 0600；你已经 cp 出来了，它就不会再动这个文件。",
    "zh-Hant": "把產生的 64 個十六進位字元寫進 .env 的 POPOPX_ADMIN_TOKEN=。這個鍵遺失、短於 24 字元或仍是示例值時，load_config() 拒絕啟動，而拒絕訊息裡就帶著這句產生命令。安裝腳本只有在 .env 完全不存在時才會自己產生權杖，並把 .env 設成 0600；你已經 cp 出來了，它就不會再動這個檔。",
    "es": "Pega los 64 caracteres hexadecimales que imprime en POPOPX_ADMIN_TOKEN= dentro de .env. load_config() se niega a arrancar si esa clave falta, mide menos de 24 caracteres o sigue siendo el valor de ejemplo — y el propio mensaje de rechazo te da este generador. El instalador solo genera un token si no existe ningún .env, y entonces deja .env en modo 0600; si ya lo copiaste tú, no lo toca.",
    "pl": "Wpisz 64 znaków szesnastkowych, które zwraca to polecenie, do POPOPX_ADMIN_TOKEN= w pliku .env. Funkcja load_config() odmawia startu, gdy klucz nie istnieje, ma mniej niż 24 znaki albo nadal jest wartością przykładową — a w samym komunikacie odmowy znajdziesz tę komendę generującą. Instalator tworzy token tylko wtedy, gdy plik .env w ogóle nie istnieje, i zostawia go wtedy w trybie 0600; jeśli skopiowałeś go sam, nie tknie tego pliku.",
    "ja": "このコマンドが表示する64個の16進文字を .env の POPOPX_ADMIN_TOKEN= に貼り付けます。キーが無い、24文字より短い、サンプル値のまま、という場合 load_config() は起動を拒否しますが、その拒否メッセージにこの生成コマンドが書かれています。インストーラーがトークンを作するのは .env が存在しないときだけで、その場合は .env をモード 0600 にします。自分で cp したなら、ファイルには手を入れられません。",
    "th": "วางอักขระฐานสิบหก 64 ตัวที่คำสั่งนี้พิมพ์ออกมาลงใน POPOPX_ADMIN_TOKEN= ภายในไฟล์ .env ฟังก์ชัน load_config() จะปฏิเสธการเริ่มต้น ถ้าคีย์นี้หายไป สั้นกว่า 24 ตัวอักษร หรือยังเป็นค่าตัวอย่าง — และข้อความที่ปฏิเสธนั่นแหละที่มีคำสั่งสร้างโทเคนนี้อยู่ ตัวติดตั้งจะสร้างโทเคนก็ต่อเมื่อไม่มีไฟล์ .env เลยเท่านั้น แล้วก็ตั้ง .env เป็นโหมด 0600 พอคุณ cp เองแล้ว มันจะไม่แตะไฟล์นี้",
    "fi": "Liitä tulostetut 64 heksamerkkiä kohtaan POPOPX_ADMIN_TOKEN= tiedostossa .env. load_config() kieltäytyy käynnistymästä, jos avain puuttuu, on lyhyempi kuin 24 merkkiä tai on ylhäällä esimerkkiarvolla — ja hylkäysviesti kertoo tämän generointikomennon. Asennusohjelma luo tunnuksen vain jos .env-tilaa ei ole lainkaan, ja jättää .env-tiedoston tilaan 0600; jos kopioit sen itse, siihen ei kosketa.",
    "uk": "Вставте 64 шістнадцяткових символи, які виводить ця команда, у POPOPX_ADMIN_TOKEN= всередині .env. Функція load_config() відмовляється запускатися, коли ключ відсутній, коротший за 24 символи або лишився прикладним, — і в самому тексті відмови є цей генератор. Інсталятор створює токен лише коли файлу .env немає взагалі, і тоді ставить .env режим 0600; якщо ви скопіювали самі — він його не чинятиме.",
    "bg": "Поставете 64-те шестнадесетични символа, които командата отпечатва, в POPOPX_ADMIN_TOKEN= вътре в .env. load_config() отказва стартиране, когато ключът липсва, е по-къс от 24 символа или все още е примерна стойност — и в самото съобщение за отказ се съдържа този генератор. Инсталаторът създава токен само когато няма никакъв .env, и тогава оставя .env в режим 0600; ако сте го копирали сами, файлът няма да бъде докоснат.",
    "tr": "Yazdırdığı 64 onaltılık karakteri .env içindeki POPOPX_ADMIN_TOKEN= satırına yapıştırın. load_config() işlevi bu anahtar eksikse, 24 karakterden kısaysa ya da hâlâ örnek değeri içeriyorsa başlamayı reddeder — ve reddetme mesajının kendisi size bu üretici komutu verir. Kurulum programı yalnızca hiç .env yoksa jeton üretir ve sonra .env dosyasını 0600 modunda bırakır; siz kopyaladıysanız dosyaya dokunmaz.",
    "hu": "Illessze be a parancs által kiírt 64 hexadecimális karaktert a .env fájl POPOPX_ADMIN_TOKEN= kulcsába. A load_config() megtagadja az indulást, ha a kulcs hiányzik, rövidebb mint 24 karakter, vagy még mindig példaérték — és az elutasító üzenet magát ezt a generátort tartalmazza. A telepítő csak akkor állít elő tokent, ha egyetlen .env sincs, és akkor 0600 módban hagyja; ha ön másolta, nem nyúl hozzá.",
  } satisfies L,
  uReadT: {
    en: "Reading the value back",
    "ru": "Читать значение обратно",
    "de": "Den Wert zurücklesen",
    "fr": "Relire la valeur",
    "it": "Leggersi il valore",
    "nl": "De waarde uitlezen",
    "cs": "Načíst hodnotu zpět",
    "zh-Hans": "要把值读出来",
    "zh-Hant": "要把值讀出來",
    "es": "Volver a leer el valor",
    "pl": "Odczytaj wartość",
    "ja": "値を読み出す",
    "th": "อ่านค่ากลับไปดู",
    "fi": "Lue arvo takaisin",
    "uk": "Прочитати значення назад",
    "bg": "Извади стойността обратно",
    "tr": "Değeri geri okumak",
    "hu": "Az érték visszaolvasása",
  } satisfies L,
  uReadC: {
    en: "The value is never printed to the terminal by default; the installer reports only the key name and prints this grep line for you. The three paths are the three install modes: /opt/popopx-service-suite/src/.env is the Ubuntu installer in container mode, /etc/popopx-service-suite/env is the Ubuntu installer under --mode native, and /usr/local/etc/popopx-service-suite/env is what the macOS production installer, install_macos.sh, writes for its launchd job. If it ever lands in a ticket or a CI log, treat it as compromised and rotate it.",
    "ru": "Значение токена по умолчанию в терминал не попадает: установщик сообщает только имя ключа и печатает для вас эти строки grep. Три пути — это три режима установки: /opt/popopx-service-suite/src/.env пишет Ubuntu-скрипт в контейнерном режиме, /etc/popopx-service-suite/env — Ubuntu-скрипт в режиме --mode native, а /usr/local/etc/popopx-service-suite/env — это файл macOS-установщика install_macos.sh для его задачи launchd. Если значение оказалось в тикете или в логе CI, считайте его скомпрометированным и выпустите новое.",
    "de": "Der Wert landet standardmäßig nicht im Terminal; der Installierer meldet nur den Schlüsselnamen und druckt genau diese grep-Zeilen für Sie. Die drei Pfade sind die drei Installationsmodi: /opt/popopx-service-suite/src/.env schreibt das Ubuntu-Skript im Containermodus, /etc/popopx-service-suite/env schreibt es unter --mode native, und /usr/local/etc/popopx-service-suite/env ist die Datei des macOS-Produktionsinstallers install_macos.sh für seinen launchd-Auftrag. Falls der Wert jemals in einem Ticket oder CI-Log landet, behandeln Sie ihn als kompromittiert und drehen Sie ihn.",
    "fr": "La valeur n'est jamais affichée dans le terminal par défaut : l'installeur ne signale que le nom de la clé et imprime ces lignes grep pour vous. Les trois chemins correspondent aux trois modes d'installation : /opt/popopx-service-suite/src/.env est écrit par le script Ubuntu en mode conteneur, /etc/popopx-service-suite/env par le script Ubuntu sous --mode native, et /usr/local/etc/popopx-service-suite/env est le fichier que l'installeur macOS de production, install_macos.sh, écrit pour son job launchd. Si la valeur atterrit dans un ticket ou un journal CI, considérez-la comme compromise et changez-la.",
    "it": "Il valore non finisce mai nel terminale per impostazione predefinita: l'installatore riporta solo il nome della chiave e stampa queste righe grep per te. I tre percorsi sono le tre modalità di installazione: /opt/popopx-service-suite/src/.env lo scrive lo script Ubuntu in modalità container, /etc/popopx-service-suite/env lo scrive lo script Ubuntu sotto --mode native, e /usr/local/etc/popopx-service-suite/env è il file che l'installer di produzione macOS, install_macos.sh, scrive per il suo job launchd. Se il valore finisce in un ticket o in un log CI, trattalo come compromesso e ruotalo.",
    "nl": "De waarde komt standaard niet in de terminal: de installateur meldt alleen de key-naam en print precies deze grep-regels voor je. De drie paden zijn de drie installatiemodi: /opt/popopx-service-suite/src/.env schrijft het Ubuntu-script in containermode, /etc/popopx-service-suite/env schrijft het onder --mode native, en /usr/local/etc/popopx-service-suite/env is het bestand dat de macOS-productie-installateur install_macos.sh voor zijn launchd-taak schrijft. Belandt de waarde ooit in een ticket of CI-log, beschouw haar dan als gecompromitteerd en draai haar om.",
    "cs": "Hodnota se ve výchozím nastavení do terminálu nevypisuje: instalátor hlásí pouze název klíče a tiskne tyto grep příkazy. Tři cesty odpovídají třem instalačním režimům: /opt/popopx-service-suite/src/.env zapisuje ubuntu skript v kontejnerovém režimu, /etc/popopx-service-suite/env zapisuje tentýž skript pod --mode native a /usr/local/etc/popopx-service-suite/env je soubor, který pro svůj launchd úkol zapíše produkční instalátor pro macOS, install_macos.sh. Pokud se hodnota octne v tiketu nebo CI logu, považujte ji za kompromitovanou a vyměňte ji.",
    "zh-Hans": "令牌的值默认不进终端，安装脚本只报键名，并把这几条 grep 原样打印在一次性提示里。三个路径对应三种安装模式：/opt/popopx-service-suite/src/.env 是 Ubuntu 脚本在容器模式下写的，/etc/popopx-service-suite/env 是 Ubuntu 脚本 --mode native 那一份，/usr/local/etc/popopx-service-suite/env 则是 macOS 生产安装脚本 install_macos.sh 为它的 launchd 任务落的文件。贴进工单或 CI 日志就当作泄露处理，换一枚。",
    "zh-Hant": "權杖的值預設不進終端機，安裝腳本只報鍵名，並把這幾條 grep 原樣印在一次性提示裡。三個路徑對應三種安裝模式：/opt/popopx-service-suite/src/.env 是 Ubuntu 腳本在容器模式寫的，/etc/popopx-service-suite/env 是 Ubuntu 腳本 --mode native 的那份，/usr/local/etc/popopx-service-suite/env 則是 macOS 生產安裝腳本 install_macos.sh 為它的 launchd 工作所落的檔。貼進工單或 CI 日誌就當作外洩處理，換一枚。",
    "es": "El valor nunca se imprime en la terminal por defecto: el instalador solo informa del nombre de la clave y te imprime estas líneas de grep. Las tres rutas son los tres modos de instalación: /opt/popopx-service-suite/src/.env lo escribe el script de Ubuntu en modo contenedor, /etc/popopx-service-suite/env lo escribe ese script bajo --mode native, y /usr/local/etc/popopx-service-suite/env es el archivo que el instalador de producción para macOS, install_macos.sh, deja para su trabajo launchd. Si acaba en un ticket o en un log de CI, trátalo como comprometido y cámbialo.",
    "pl": "Wartość domyślnie nigdy nie trafia do terminala: instalator podaje wyłącznie nazwę klucza i drukuje dla Ciebie te polecenia grep. Trzy ścieżki odpowiadają trzem trybom instalacji: /opt/popopx-service-suite/src/.env zapisuje skrypt Ubuntu w trybie kontenerowym, /etc/popopx-service-suite/env ten sam skrypt w trybie --mode native, a /usr/local/etc/popopx-service-suite/env to plik, który dla swojego zadania launchd zapisuje instalator produkcyjny macOS, install_macos.sh. Jeśli wartość trafi do zgłoszenia albo loga CI, potraktuj ją jako ujawnioną i wymień ją.",
    "ja": "既定ではトークンの値はターミナルに表示されません。インストーラーはキー名だけを報告し、これらの grep 行を表示します。3つのパスは3つのインストールモードに対応します。/opt/popopx-service-suite/src/.env は Ubuntu スクリプトがコンテナモードで書くファイル、/etc/popopx-service-suite/env は同じスクリプトを --mode native で使った場合、/usr/local/etc/popopx-service-suite/env は macOS 本番インストーラー install_macos.sh が launchd ジョブ用に書くファイルです。値がチケットや CI ログに残ったら、漏れたものとして新しいトークンに交換してください。",
    "th": "ค่าของโทเคนจะไม่ถูกพิมพ์ออกเทอร์มินัลตามค่าเริ่มต้น ตัวติดตั้งจะแจ้งแค่ชื่อคีย์แล้วพิมพ์คำสั่ง grep เหล่านี้ให้คุณ เส้นทางสามเส้นคือสามโหมดการติดตั้ง: /opt/popopx-service-suite/src/.env คือไฟล์ที่สคริปต์ Ubuntu เขียนในโหมดคอนเทนเนอร์, /etc/popopx-service-suite/env คือไฟล์ที่สคริปต์เดียวกันเขียนเมื่อใช้ --mode native และ /usr/local/etc/popopx-service-suite/env คือไฟล์ที่ตัวติดตั้ง macOS สำหรับงานจริง คือ install_macos.sh เขียนไว้ให้งาน launchd ของมัน ถ้าค่านี้หลุดไปยังตั๋วงานหรือล็อก CI ให้ถือว่าถูกเปิดเผยแล้วและเปลี่ยนใหม่",
    "fi": "Arvo ei tule päätoiminnossa terminaliin: asennusohjelma ilmoittaa vain avaimen nimen ja tulostaa nämä grep-komennot. Kolme polkua vastaavat kolmea asennustilaa: /opt/popopx-service-suite/src/.env on ubuntu-skriptin konttitilassa kirjoittama tiedosto, /etc/popopx-service-suite/env on saman skriptin --mode native -tiedosto, ja /usr/local/etc/popopx-service-suite/env on tiedosto, jonka macOS-tuotantoasentaja install_macos.sh kirjoittaa sen launchd-työtä varten. Jos arvo päätyy ticketiin tai CI-lokiin, käsittele sitä vaarantuneena ja vaihda se.",
    "uk": "Значення токена типово не потрапляє в термінал: інсталятор повідомляє лише назву ключа й друкує для вас ці рядки grep. Три шляхи — це три режими встановлення: /opt/popopx-service-suite/src/.env пише скрипт Ubuntu в контейнерному режимі, /etc/popopx-service-suite/env — той самий скрипт у режимі --mode native, а /usr/local/etc/popopx-service-suite/env — це файл, який для свого завдання launchd пише macOS-інсталятор продакшну install_macos.sh. Якщо значення опинилося в тікеті чи CI-лозі, вважайте його скомпрометованим і випустіть нове.",
    "bg": "Стойността по подразбиране не се отпечатва в терминала: инсталаторът съобщава само името на ключа и печата точно тези grep редове. Трите пътеки са трите режима на инсталация: /opt/popopx-service-suite/src/.env се записва от ubuntu скрипта в контейнерен режим, /etc/popopx-service-suite/env се записва от него при --mode native, а /usr/local/etc/popopx-service-suite/env е файлът, който продуктовият инсталатор за macOS, install_macos.sh, записва за launchd задачата си. Ако стойността попадне в билет или CI лог, я считайте за компрометирана и я сменете.",
    "tr": "Değer varsayılan olarak terminale yazdırılmaz: kurulum programı yalnızca anahtar adını bildirir ve bu grep satırlarınız için yazdırır. Üç yol, üç kurulum kipi demektir: /opt/popopx-service-suite/src/.env kapsayıcı kipinde Ubuntu betiğinin yazdığı dosyadır, /etc/popopx-service-suite/env aynı betiğin --mode native altında yazdığı dosyadır, /usr/local/etc/popopx-service-suite/env ise macOS üretim kurulum programının, install_macos.sh'nin, launchd işi için yazdığı dosyadır. Değer bir iş kaydına ya da CI günlüğüne düşerse ele geçirilmiş sayın ve yenisini üretin.",
    "hu": "Az érték alapértelmezésben nem kerül a terminálba: a telepítő csak a kulcs nevét jelenti, és ezeket a grep sorokat nyomtatja ki. A három útvonal a három telepítési módot jelenti: az /opt/popopx-service-suite/src/.env fájlt az Ubuntu szkript konténeres módban írja, az /etc/popopx-service-suite/env fájlt ugyanaz a szkript --mode native alatt, az /usr/local/etc/popopx-service-suite/env fájlt pedig a macOS éles telepítő, az install_macos.sh írja a launchd feladata számára. Ha az érték jegybe vagy CI-naplóba kerül, tekintsé kompromittáltnak, és cserélje le.",
  } satisfies L,
  uInstallT: {
    en: "One-command install",
    "ru": "Установка одной командой",
    "de": "Installation mit einem Befehl",
    "fr": "Installation en une commande",
    "it": "Installazione con un comando",
    "nl": "Installatie met één commando",
    "cs": "Instalace jedním příkazem",
    "zh-Hans": "一键安装",
    "zh-Hant": "一鍵安裝",
    "es": "Instalación con un comando",
    "pl": "Instalacja jednym poleceniem",
    "ja": "1コマンドでインストール",
    "th": "ติดตั้งด้วยคำสั่งเดียว",
    "fi": "Asennus yhdellä komennolla",
    "uk": "Встановлення однією командою",
    "bg": "Инсталация с една команда",
    "tr": "Tek komutla kurulum",
    "hu": "Telepítés egyetlen paranccsal",
  } satisfies L,
  uInstallC: {
    en: "Root is required. The default mode is containerised: docker.io plus the compose plugin, a build of the gateway image, then compose up. The script is idempotent — an existing .env is backed up with a timestamp and kept, and anything it would overwrite is backed up first. Its own wording is that it never destroys the state directory: the files in it survive a re-run, but the installer does change that directory's owner and mode — chown -R 1001:1001 plus chmod 0750 in container mode, -o popopx -g popopx in native mode.",
    "ru": "Нужен root. Режим по умолчанию — контейнерный: docker.io с плагином compose, сборка образа шлюза, затем compose up. Скрипт идемпотентен: существующий .env копируется с меткой времени и остаётся на месте, а всё, что было бы перезаписано, сначала резервируется. Его собственная формулировка — он не разрушает каталог состояния: файлы в нём переживают повторный запуск, но установщик меняет владельца и права самого каталога — chown -R 1001:1001 и chmod 0750 в контейнерном режиме, -o popopx -g popopx в нативном.",
    "de": "Root ist nötig. Der Standardmodus ist containerisiert: docker.io plus compose-Plugin, ein Build des Gateway-Images, dann compose up. Das Skript ist idempotent — eine vorhandene .env wird mit Zeitstempel gesichert und behalten, und alles, was überschrieben würde, wird vorher gesichert. Die eigene Formulierung lautet, dass es den Zustandsordner nie zerstört: die Dateien darin überleben einen erneuten Lauf, aber der Installierer ändert Eigentümer und Modus dieses Ordners — chown -R 1001:1001 plus chmod 0750 im Containermodus, -o popopx -g popopx im nativen Modus.",
    "fr": "Root est requis. Le mode par défaut est conteneurisé : docker.io avec le plugin compose, construction de l'image de la passerelle, puis compose up. Le script est idempotent : un .env existant est sauvegardé avec horodatage et conservé, et tout ce qui serait écrasé est d'abord sauvegardé. Son propre formulation dit qu'il ne détruit jamais le répertoire d'état : les fichiers qu'il contient survivent à une relance, mais l'installeur modifie bien le propriétaire et le mode du répertoire — chown -R 1001:1001 plus chmod 0750 en mode conteneur, -o popopx -g popopx en mode native.",
    "it": "Serveva root. La modalità predefinita è containerizzata: docker.io più il plugin compose, build dell'immagine del gateway, poi compose up. Lo script è idempotente: un .env esistente viene copiato con timestamp e conservato, e tutto ciò che verrebbe sovrascritto viene prima salvato. La sua stessa dizione dice che non distrugge mai la directory di stato: i file che contiene sopravvivono a una riesecuzione, ma l'installatore cambia proprietario e mode di quella directory — chown -R 1001:1001 più chmod 0750 in modalità container, -o popopx -g popopx in modalità native.",
    "nl": "Root is nodig. De standaardmodus is gecontaineriseerd: docker.io plus de compose-plugin, een build van de gateway-image, daarna compose up. Het script is idempotent: een bestaande .env wordt met tijdstempel gekopieerd en blijft staan, en alles wat zou worden overschreven krijgt eerst een back-up. De eigen formulering luidt dat het de stadirectory nooit verwoest: de bestanden erin overleven een herhaalde run, maar de installateur wijzigt eigenaar en modus van die directory wel — chown -R 1001:1001 plus chmod 0750 in containermode, -o popopx -g popopx in native modus.",
    "cs": "Je potřeba root. Výchozí režim je kontejnerový: docker.io s compose pluginem, sestavení image brány a poté compose up. Skript je idempotentní – existující .env je zálohován s časovým razítkem a ponechán a vše, co by se přepsalo, se nejdřív zálohuje. Jeho vlastní formulace zní, že adresář se stavem nikdy neničí: soubory v něm běh po běhu přežijí, ale instalátor mění vlastníka a režim tohoto adresáře – chown -R 1001:1001 plus chmod 0750 v kontejnerovém režimu, -o popopx -g popopx v nativním režimu.",
    "zh-Hans": "需要 root。默认是容器模式：装 docker.io 与 compose 插件、build gateway 映像、compose up -d。脚本可重入——已有 .env 会被时间戳备份后原样保留，任何它要覆盖的东西都先备份。脚本自己的说法是它從不「毀掉」状态目录：里面的文件熬得过第二次执行，但它确实会改这个目录的属主和权限——容器模式下 chown -R 1001:1001 加 chmod 0750，native 模式下 -o popopx -g popopx。",
    "zh-Hant": "需要 root。預設是容器模式：裝 docker.io 與 compose 插件、build gateway 映像、compose up -d。腳本可重入——既有 .env 會被時間戳記備份後原樣保留，任何它要覆蓋的東西都先備份。腳本自身的說法是它從不「毀掉」狀態目錄：裡面的檔熬得過第二次執行，但它確實會改這個目錄的擁有者和權限——容器模式下 chown -R 1001:1001 加 chmod 0750，native 模式下 -o popopx -g popopx。",
    "es": "Se requiere root. El modo predeterminado es containerizado: docker.io más el plugin de compose, una compilación de la imagen de la pasarela y luego compose up. El script es idempotente: un .env existente se respalda con marca de tiempo y se conserva, y todo lo que se sobrescribiría se respalda primero. Su propia redacción dice que nunca destruye el directorio de estado: los archivos que contiene sobreviven a una segunda ejecución, pero el instalador sí cambia el propietario y el modo de ese directorio — chown -R 1001:1001 más chmod 0750 en modo contenedor, -o popopx -g popopx en modo nativo.",
    "pl": "Wymagany jest root. Domyślny tryb to kontenery: docker.io wraz z wtyczką compose, zbudowanie obrazu bramy, a potem compose up. Skrypt jest idempotentny — istniejący .env jest kopiowany z znacznikiem czasu i zachowywany, a wszystko, co zostałoby nadpisane, najpierw trafia do kopii. Własne sformułowanie skryptu mówi, że nigdy nie niszczony jest katalog stanu: pliki w nim przetrwają ponowne uruchomienie, ale instalator zmienia właściciela i tryb tego katalogu — chown -R 1001:1001 plus chmod 0750 w trybie kontenerowym, -o popopx -g popopx w trybie natywnym.",
    "ja": "root が必要です。既定はコンテナモードで、docker.io と compose プラグインを入れ、ゲートウェイのイメージをビルドして compose up します。スクリプトは冪等で、既存の .env はタイムスタンプ付きでバックアップされたまま保持され、上書きされる可能性のあるものはすべて先にバックアップされます。スクリプト自身の言い回しでは、状態ディレクトリを「壊す」ことはなく、中のファイルは再実行を生き延びます。ただしこのディレクトリの所有者とモードは変更されます。コンテナモードでは chown -R 1001:1001 と chmod 0750、native モードでは -o popopx -g popopx です。",
    "th": "ต้องมีสิทธิ์ root โหมดเริ่มต้นคือรันในคอนเทนเนอร์: ติดตั้ง docker.io พร้อมปลั๊กอิน compose build อิมเมจของ gateway แล้ว compose up สคริปต์นี้อยู่นิต (idempotent) — ถ้ามี .env อยู่แล้วจะถูกสำรองพร้อมประทับเวลาและคงไว้ สิ่งใดที่เขียนทับจะถูกสำรองก่อน ถ้อยของตัวมันเองบอกว่ามันไม่ทำลายโฟลเดอร์สถานะ: ไฟล์ข้างในอยู่รอดผ่านการรันซ้ำได้ แต่ตัวติดตั้งเปลี่ยนเจ้าของและ mode ของโฟลเดอร์นั้นจริง — chown -R 1001:1001 บวก chmod 0750 ในโหมดคอนเทนเนอร์ และ -o popopx -g popopx ในโหมด native",
    "fi": "Root vaaditaan. Oletustilana on kontillinen: docker.io plus compose-liitännäinen, gateway-kuvan build ja sitten compose up. Komentosarja on idempotentti – olemassa oleva .env varmuuskopioidaan aikaleimalla ja säilytetään, ja kaikki mitä ylikirjoitettaisiin otetaan ensin varmuuskopioon. Sen oma muotoilu sanoo, ettei se koskaan tuhoa tilahakemistoa: sen sisällä olevat tiedostot selviävät uudelleenajosta, mutta asennusohjelma kyllä muuttaa tuon hakemiston omistajan ja mode – chown -R 1001:1001 plus chmod 0750 konttitilassa, -o popopx -g popopx natiivissa tilassa.",
    "uk": "Потрібен root. Типовий режим — контейнерний: docker.io з плагіном compose, збірка образу шлюза, потім compose up. Скрипт ідемпотентний: наявний .env копіюється з міткою часу й лишається на місці, а все, що було б перезаписано, спершу резервується. Власне формулювання скрипта — він не руйнує каталог стану: файли в ньому переживають повторний запуск, але інсталятор змінює власника й права самого каталогу — chown -R 1001:1001 та chmod 0750 у контейнерному режимі, -o popopx -g popopx у нативному.",
    "bg": "Нужен е root. Режимът по подразбиране е контейнерен: docker.io с compose приставка, изграждане на образа на шлюза и после compose up. Скриптът е идемпотентен — съществуващ .env се архивира с времеви печат и се запазва, а всичко, което би било презаписано, първо се архивира. Собствената му формулировка е, че никога не унищожава директорията със състояние: файловете в нея оцеляват при повторно изпълнение, но инсталаторът променя собственика и режима на тази директория — chown -R 1001:1001 плюс chmod 0750 в контейнерен режим, -o popopx -g popopx в native режим.",
    "tr": "root gerekir. Varsayılan kip kapsayıcılıdır: docker.io artı compose eklentisi, ağ geçidi imajının derlenmesi ve ardından compose up. Betik tekrarlanabilir (idempotent) — var olan bir .env zaman damgasıyla yedeklenip korunur ve üzerine yazılacak her şey önce yedeklenir. Betiğin kendi ifadesi durum dizisini asla yok etmediğidir: içindeki dosyalar yeniden çalıştırmadan sağ çıkar, ancak kurulum programı o dizinin sahibini ve modunu değiştirir — kapsayıcı kipinde chown -R 1001:1001 artı chmod 0750, native kipte -o popopx -g popopx.",
    "hu": "root szükséges. Az alapértelmezett mód konténeres: docker.io a compose-bővítménnyel, az átjáró image-ének felépítése, majd compose up. A szkript idempotens — egy meglévő .env fájlt időbélyeggel ment, és megőriz, és mindent, amit felülírna, előre ment. A saját megfogalmazása szerint sosem pusztítja el az állapotkönyvtárat: a benne lévő fájlok túlél egy újrafuttatást, de a telepítő valóban megváltoztatja e könyvtár tulajdonosát és módját — konténeres módban chown -R 1001:1001 és chmod 0750, natív módban -o popopx -g popopx.",
  } satisfies L,
  uModesT: {
    en: "Pick one: mode, node, help",
    "ru": "Выбор из трёх: режим, узел, справка",
    "de": "Drei Möglichkeiten: Modus, Node, Hilfe",
    "fr": "Trois choix : mode, nœud, aide",
    "it": "Tre scelte: modalità, nodo, aiuto",
    "nl": "Drie keuzes: modus, node, help",
    "cs": "Tři volby: režim, uzel, nápověda",
    "zh-Hans": "三选一：模式、节点、帮助",
    "zh-Hant": "三選一：模式、節點、說明",
    "es": "Tres opciones: modo, nodo, ayuda",
    "pl": "Trzy opcje: tryb, węzeł, pomoc",
    "ja": "3つの選択肢：モード、ノード、ヘルプ",
    "th": "เลือกสามอย่าง: โหมด โหนด และวิธีใช้",
    "fi": "Kolme valintaa: tila, solmu, ohje",
    "uk": "Вибір із трьох: режим, вузол, довідка",
    "bg": "Три избора: режим, възел, помощ",
    "tr": "Üç seçim: kip, düğüm, yardım",
    "hu": "Három választás: mód, csomópont, súgó",
  } satisfies L,
  uModesC: {
    en: "--mode native is the venv + systemd path: deadsnakes for Python 3.11, gateway/requirements.txt into /opt/popopx-service-suite/venv, a pip freeze into requirements.lock, and a popopx-gateway.service whose ExecStart is exactly python -m app.main, so the socket is decided by the EnvironmentFile alone and only one worker runs. --with-node adds the node unit. The options this script knows are --mode, --with-node, --port, --skip-apt and --help; anything else is an unknown argument. On an Ubuntu that is not 22.04 it prints two warnings and continues, noting that the only release-specific step is the deadsnakes PPA.",
    "ru": "--mode native — путь venv + systemd: deadsnakes для Python 3.11, gateway/requirements.txt в /opt/popopx-service-suite/venv, pip freeze в requirements.lock и popopx-gateway.service, у которого ExecStart — ровно python -m app.main, так что сокет задаётся только EnvironmentFile и воркер один. --with-node добавляет юнит узла. Скрипт понимает --mode, --with-node, --port, --skip-apt и --help; всё остальное — unknown argument. На Ubuntu, отличной от 22.04, он печатает два предупреждения и продолжает, замечая, что единственный шаг, привязанный к релизу, — это PPA deadsnakes.",
    "de": "--mode native ist der venv + systemd-Weg: deadsnakes für Python 3.11, gateway/requirements.txt in /opt/popopx-service-suite/venv, ein pip freeze in requirements.lock und ein popopx-gateway.service, dessen ExecStart genau python -m app.main ist — der Socket wird also allein vom EnvironmentFile bestimmt und es läuft ein Worker. --with-node ergänzt den Node-Unit. Das Skript kennt nur --mode, --with-node, --port, --skip-apt und --help; alles andere ist ein unknown argument. Auf einem anderen Ubuntu als 22.04 print es zwei Warnungen und macht weiter, mit dem Hinweis, dass der einzige releaseabhängige Schritt das deadsnakes-PPA ist.",
    "fr": "--mode native est la voie venv + systemd : deadsnakes pour Python 3.11, gateway/requirements.txt dans /opt/popopx-service-suite/venv, un pip freeze vers requirements.lock et un popopx-gateway.service dont l'ExecStart est exactement python -m app.main — la socket est donc décidée par le seul EnvironmentFile et un seul worker tourne. --with-node ajoute l'unité du nœud. Le script ne connaît que --mode, --with-node, --port, --skip-apt et --help ; tout le reste est un unknown argument. Sur un Ubuntu autre que 22.04, il affiche deux avertissements et continue, en précisant que la seule étape liée à la distribution est le PPA deadsnakes.",
    "it": "--mode native è la strada venv + systemd: deadsnakes per Python 3.11, gateway/requirements.txt dentro /opt/popopx-service-suite/venv, un pip freeze in requirements.lock e un popopx-gateway.service il cui ExecStart è esattamente python -m app.main, quindi il socket è deciso solo dall'EnvironmentFile e il worker è uno. --with-node aggiunge l'unità del nodo. Le opzioni riconosciute sono --mode, --with-node, --port, --skip-apt e --help; tutto il resto è unknown argument. Su un Ubuntu diverso dal 22.04 stampa due avvisi e prosegue, notando che l'unico passo dipendente dalla release è il PPA deadsnakes.",
    "nl": "--mode native is het venv + systemd-pad: deadsnakes voor Python 3.11, gateway/requirements.txt in /opt/popopx-service-suite/venv, een pip freeze naar requirements.lock en een popopx-gateway.service waarvan ExecStart precies python -m app.main is, dus de socket wordt alleen door het EnvironmentFile bepaald en er draait één worker. --with-node voegt de node-unit toe. De opties die dit script kent zijn --mode, --with-node, --port, --skip-apt en --help; al de rest is een unknown argument. Op een andere Ubuntu dan 22.04 print het twee waarschuwingen en gaat het door, met de opmerking dat het deadsnakes-PPA de enige release-afhankelijke stap is.",
    "cs": "--mode native je cesta venv + systemd: deadsnakes pro Python 3.11, gateway/requirements.txt do /opt/popopx-service-suite/venv, pip freeze do requirements.lock a unit popopx-gateway.service, jehož ExecStart je přesně python -m app.main – sokl tedy určuje pouze EnvironmentFile a běží jeden worker. --with-node přidá unit uzlu. Skript zná jen --mode, --with-node, --port, --skip-apt a --help; ostatní je unknown argument. Na Ubuntu jiném než 22.04 vytiskne dvě varování a pokračuje s poznámkou, že jediným krokem závislým na distribuci je PPA deadsnakes.",
    "zh-Hans": "--mode native 是 venv + systemd 那条路：用 deadsnakes 装 Python 3.11、在 /opt/popopx-service-suite/venv 装 gateway/requirements.txt、pip freeze 出 requirements.lock、写 popopx-gateway.service（ExecStart 就是 python -m app.main，套接字只由 EnvironmentFile 决定，只有一个 worker）。--with-node 再带上节点单元。这个脚本认的开关只有 --mode、--with-node、--port、--skip-apt、--help，其余一律报 unknown argument。在非 22.04 的 Ubuntu 上它打两行 warn 继续跑，并说明唯一与发行版相关的步骤就是 deadsnakes 那个 PPA。",
    "zh-Hant": "--mode native 是 venv + systemd 那條路：用 deadsnakes 裝 Python 3.11、在 /opt/popopx-service-suite/venv 裝 gateway/requirements.txt、pip freeze 出 requirements.lock、寫 popopx-gateway.service（ExecStart 就是 python -m app.main，連線埠只由 EnvironmentFile 決定，只有一個 worker）。--with-node 再帶上節點單元。這個腳本認的開關只有 --mode、--with-node、--port、--skip-apt、--help，其餘一律報 unknown argument。在非 22.04 的 Ubuntu 上它打兩行 warn 繼續跑，並說明唯一與發行版相關的步驟就是 deadsnakes 那個 PPA。",
    "es": "--mode native es el camino de venv + systemd: deadsnakes para Python 3.11, gateway/requirements.txt en /opt/popopx-service-suite/venv, un pip freeze a requirements.lock y un popopx-gateway.service cuyo ExecStart es exactamente python -m app.main, así que el socket lo decide solo el EnvironmentFile y corre un único worker. --with-node añade la unidad del nodo. Las opciones que este script reconoce son --mode, --with-node, --port, --skip-apt y --help; todo lo demás es unknown argument. En un Ubuntu que no sea 22.04 imprime dos avisos y continúa, indicando que el único paso dependiente de la versión es el PPA de deadsnakes.",
    "pl": "--mode native to ścieżka venv + systemd: deadsnakes dla Pythona 3.11, gateway/requirements.txt w /opt/popopx-service-suite/venv, pip freeze do requirements.lock oraz usługa popopx-gateway.service, w której ExecStart to dokładnie python -m app.main — więc gniazdo wyznacza wyłącznie EnvironmentFile i działa jeden worker. --with-node dokłada jednostkę węzła. Ten skrypt rozpoznaje tylko --mode, --with-node, --port, --skip-apt i --help; reszta to unknown argument. Na innym Ubuntu niż 22.04 wypisze dwa ostrzeżenia i leci dalej, zaznaczając, że jedynym krokiem zależnym od wydania jest PPA deadsnakes.",
    "ja": "--mode native は venv + systemd の経路です。deadsnakes で Python 3.11 を入れ、gateway/requirements.txt を /opt/popopx-service-suite/venv に適用し、pip freeze で requirements.lock を作り、ExecStart をちょうど python -m app.main とした popopx-gateway.service を書きます。つまりソケットは EnvironmentFile だけが決め、ワーカーは1つです。--with-node はノードのユニットも追加します。このスクリプトが知るオプションは --mode、--with-node、--port、--skip-apt、--help だけで、他は unknown argument になります。22.04 以外の Ubuntu では2行の warn を出して続行し、ディストリビューションに依存する工程は deadsnakes の PPA だけだと述べます。",
    "th": "--mode native คือเส้นทางแบบ venv + systemd: ใช้ deadsnakes ติดตั้ง Python 3.11, ลง gateway/requirements.txt ใน /opt/popopx-service-suite/venv, pip freeze ออกมาเป็น requirements.lock และเขียน popopx-gateway.service ที่ ExecStart เป็น python -m app.main พอดี ดังนั้นซ็อกเก็ตถูกกำหนดจาก EnvironmentFile เท่านั้นและมีเวิร์กเกอร์ตัวเดียว --with-node จะเพิ่มยูนิตของโหนดเข้ามา ตัวเลือกที่สคริปต์รู้จักมีแค่ --mode, --with-node, --port, --skip-apt และ --help ที่เหลือจะรายงานเป็น unknown argument บน Ubuntu ที่ไม่ใช่ 22.04 มันจะพิมพ์ warn สองบรรทัดแล้วทำงานต่อ พร้อมบอกว่าขั้นตอนเดียวที่ขึ้นกับรุ่นกระจายคือ PPA ของ deadsnakes",
    "fi": "--mode native on venv + systemd -reitti: deadsnakes Python 3.11:ta varten, gateway/requirements.txt hakemistoon /opt/popopx-service-suite/venv, pip freeze requirements.lock-tiedostoon ja popopx-gateway.service, jonka ExecStart on täsmälleen python -m app.main — joten socketin määrää yksin EnvironmentFile ja worker on yksi. --with-node lisää solmun unit. Tämä skripti tuntee vain --mode, --with-node, --port, --skip-apt ja --help; muu on unknown argument. Muulla kuin 22.04-Ubutulla se tulostaa kaksi varoitusta ja jatkaa todeten, että ainoa julkaisuun sidottu vaihe on deadsnakes-PPA.",
    "uk": "--mode native — це шлях venv + systemd: deadsnakes для Python 3.11, gateway/requirements.txt у /opt/popopx-service-suite/venv, pip freeze у requirements.lock і popopx-gateway.service, чий ExecStart — рівно python -m app.main, тож сокет визначається лише EnvironmentFile і працює один воркер. --with-node додає юніт вузла. Скрипт розпізнає тільки --mode, --with-node, --port, --skip-apt та --help; решта — unknown argument. На Ubuntu, відмінному від 22.04, він друкує два попередження й продовжує, зазначаючи, що єдиний крок, прив'язаний до релізу, — це PPA deadsnakes.",
    "bg": "--mode native е пътят venv + systemd: deadsnakes за Python 3.11, gateway/requirements.txt в /opt/popopx-service-suite/venv, pip freeze в requirements.lock и popopx-gateway.service, чийто ExecStart е точно python -m app.main — така сокетът се определя единствено от EnvironmentFile и работи един worker. --with-node добавя юнита на възела. Скриптът разбира само --mode, --with-node, --port, --skip-apt и --help; всичко друго е unknown argument. На Ubuntu, различен от 22.04, той отпечатва две предупреждения и продължава, отбелязвайки, че единствената зависеща от изданието стъпка е deadsnakes PPA.",
    "tr": "--mode native, venv + systemd yoludur: Python 3.11 için deadsnakes, gateway/requirements.txt dosyasının /opt/popopx-service-suite/venv içine kurulması, pip freeze ile requirements.lock ve ExecStart'ı tam olarak python -m app.main olan bir popopx-gateway.service; yani soketi yalnızca EnvironmentFile belirler ve tek worker çalışır. --with-node düğüm ünitesini ekler. Bu betiğin tanıdığı seçenekler --mode, --with-node, --port, --skip-apt ve --help; gerisi unknown argument olarak bildirilir. 22.04 olmayan bir Ubuntu'da iki uyarı basar ve devam eder, sürüme özgü tek adımın deadsnakes PPA olduğunu belirterek.",
    "hu": "--mode native a venv + systemd út: deadsnakes a Python 3.11-hez, gateway/requirements.txt a /opt/popopx-service-suite/venv-be, pip freeze a requirements.lockba, és egy popopx-gateway.service, amelynek ExecStartja pontosan python -m app.main — tehát a foglalatot csak az EnvironmentFile határozza meg, és egyetlen worker fut. --with-node a csomópont unitjét adja hozzá. A szkript csak a --mode, --with-node, --port, --skip-apt és --help kapcsolókat ismeri; minden más unknown argument. Nem 22.04 Ubuntu esetén két figyelmeztetést nyomtat és folytatja, megjegyezve, hogy az egyetlen kiadásfüggő lépés a deadsnakes PPA.",
  } satisfies L,
  uComposeT: {
    en: "Driving compose directly (Linux)",
    "ru": "Работать с compose напрямую (Linux)",
    "de": "Compose direkt ansteuern (Linux)",
    "fr": "Piloter compose directement (Linux)",
    "it": "Usare compose direttamente (Linux)",
    "nl": "Compose rechtstreeks aansturen (Linux)",
    "cs": "Řídit compose přímo (Linux)",
    "zh-Hans": "直接用 compose（Linux）",
    "zh-Hant": "直接用 compose（Linux）",
    "es": "Manejar compose directamente (Linux)",
    "pl": "Obsługa compose bezpośrednio (Linux)",
    "ja": "compose を直接使う（Linux）",
    "th": "ใช้ compose ตรง ๆ (Linux)",
    "fi": "Ohjaa composea suoraan (Linux)",
    "uk": "Працювати з compose напряму (Linux)",
    "bg": "Работа с compose директно (Linux)",
    "tr": "compose'u doğrudan kullanmak (Linux)",
    "hu": "A compose közvetlen használata (Linux)",
  } satisfies L,
  uComposeC: {
    en: "Of these three lines the installer runs the two up commands for you, with the service names spelled out — up -d gateway, or --profile node up -d gateway node — preceded by a compose build gateway and followed by a compose ps. The third line, logs -f gateway, it only prints as a hint; you run it yourself. The node lives in the node profile, so without --profile node only the gateway ever comes up. POPOPX_NODE_IMAGE is read by compose only, never by the gateway — that image is built from the node's own repository, and this suite neither contains nor links its code.",
    "ru": "Из этих трёх строк установщик выполняет за вас две команды up — с явно названными сервисами: up -d gateway, либо --profile node up -d gateway node; перед ним идёт compose build gateway, а после — compose ps. Третью строку, logs -f gateway, он только печатает как подсказку, запускаете её вы сами. Узел лежит в профиле node, поэтому без --profile node встает только шлюз. POPOPX_NODE_IMAGE читает только compose, шлюз его не читает вовсе — образ узла собирается из его собственного репозитория, а этот комплект его код не содержит и не линкует.",
    "de": "Von diesen drei Zeilen nimmt Ihnen der Installierer die zwei up-Befehle ab, mit ausgeschriebenem Dienstnamen — up -d gateway, oder --profile node up -d gateway node — davor ein compose build gateway und danach ein compose ps. Die dritte Zeile, logs -f gateway, gibt er nur als Hinweis aus; die führen Sie selbst aus. Der Node steckt im node-Profil, ohne --profile node kommt also nur das Gateway hoch. POPOPX_NODE_IMAGE liest nur compose, das Gateway nie — das Node-Image wird aus dessen eigenem Repository gebaut, und dieses Suite enthält oder linkt seinen Code nicht.",
    "fr": "Sur ces trois lignes, l'installeur exécute pour vous les deux commandes up, le nom du service écrit explicitement — up -d gateway, ou --profile node up -d gateway node — précédées d'un compose build gateway et suivies d'un compose ps. La troisième ligne, logs -f gateway, il ne fait que l'imprimer comme indication ; c'est vous qui la lancez. Le nœud vit dans le profil node, donc sans --profile node seule la passerelle démarre. POPOPX_NODE_IMAGE n'est lu que par compose, jamais par la passerelle — l'image du nœud se construit depuis son propre dépôt, et cette suite ne contient ni ne link son code.",
    "it": "Di queste tre righe l'installatore esegue per te i due comandi up, col nome del servizio scritto per esteso — up -d gateway, oppure --profile node up -d gateway node — preceduti da un compose build gateway e seguiti da un compose ps. La terza riga, logs -f gateway, la stampa soltanto come suggerimento; la esegui tu. Il nodo sta nel profilo node, quindi senza --profile node si avvia solo il gateway. POPOPX_NODE_IMAGE lo legge solo compose, mai il gateway — l'immagine del nodo si costruisce dal repository del nodo stesso, e questa suite non contiene né linka il suo codice.",
    "nl": "Van deze drie regels voert de installateur de twee up-commando's voor je uit, met de dienstnamen voluit geschreven — up -d gateway, of --profile node up -d gateway node — voorafgegaan door een compose build gateway en opgevolgd door een compose ps. De derde regel, logs -f gateway, print hij alleen als hint; die voer je zelf uit. De node zit in het node-profiel, dus zonder --profile node komt alleen de gateway omhoog. POPOPX_NODE_IMAGE wordt alleen door compose gelezen, nooit door de gateway — die image wordt uit de eigen repository van de node gebouwd, en deze suite bevat of linkt zijn code niet.",
    "cs": "Z těchto tří řádků za vás instalátor udělá oba příkazy up, s rozepsanými názvy služeb – up -d gateway, nebo --profile node up -d gateway node — před nimi compose build gateway a za nimi compose ps. Třetí řádek, logs -f gateway, jen vytiskne jako nápovědu; ten spouštíte sami. Uzel je v profilu node, takže bez --profile node vstane jen brána. POPOPX_NODE_IMAGE čte pouze compose, brána nikdy — image uzlu se staví z jeho vlastního repozitáře a tato sada jeho kód neobsahuje ani s ním nelinkuje.",
    "zh-Hans": "这三条里，安装脚本替你跑的是两条 up（服务名会写全）：up -d gateway，或 --profile node up -d gateway node；前面还会 compose build gateway，后面补一条 compose ps。第三条 logs -f gateway 它只是打印出来当提示，得你自己执行。节点在 profile「node」里，不加 --profile node 就永远只有网关起来。POPOPX_NODE_IMAGE 只被 compose 读，网关不读它——节点镜像要从它自己的仓库构建，这套件不含也不链接它的代码。",
    "zh-Hant": "這三條裡，安裝腳本替你跑的是兩條 up（服務名會寫全）：up -d gateway，或 --profile node up -d gateway node；前面還會 compose build gateway，後面補一條 compose ps。第三條 logs -f gateway 它只是列印出來當提示，得你自己執行。節點在 profile「node」裡，不加 --profile node 就永遠只有閘道起來。POPOPX_NODE_IMAGE 只被 compose 讀，閘道不讀它——節點映像要從它自己的倉庫建置，這套件不含也不連結它的程式碼。",
    "es": "De estas tres líneas, el instalador ejecuta por ti las dos comandos up, con los nombres de servicio escritos por extenso — up -d gateway, o --profile node up -d gateway node — precedidas por un compose build gateway y seguidas por un compose ps. La tercera línea, logs -f gateway, solo la imprime como sugerencia; la ejecutas tú. El nodo vive en el perfil node, así que sin --profile node solo arranca la pasarela. POPOPX_NODE_IMAGE solo lo lee compose, nunca la pasarela — esa imagen se construye desde el repositorio propio del nodo, y este conjunto ni contiene ni enlaza su código.",
    "pl": "Z tych trzech wierszy instalator wykonuje za Ciebie dwa polecenia up, z wypisanymi nazwami usług — up -d gateway, albo --profile node up -d gateway node — poprzedzone compose build gateway i zakończone compose ps. Trzeci wiersz, logs -f gateway, tylko drukuje jako podpowiedź; uruchamiasz go sam. Węzeł siedzi w profilu node, więc bez --profile node podnosi się tylko brama. POPOPX_NODE_IMAGE czyta wyłącznie compose, nigdy brama — ten obraz budowany jest z osobnego repozytorium węzła, a ten zestaw nie zawiera ani nie linkuje jego kodu.",
    "ja": "この3行のうち、インストーラーが代わりに実行するのは up の2コマンドまでです。サービス名は明示され、up -d gateway、または --profile node up -d gateway node になります。その前に compose build gateway、後に compose ps が続きます。3行目の logs -f gateway はヒントとして表示されるだけで、実行するのはあなたです。ノードは node プロファイルに属するので、--profile node を付けないとゲートウェイだけ起動します。POPOPX_NODE_IMAGE を読むのは compose だけでゲートウェイは一切読みません。ノードのイメージはノード自身のリポジトリからビルドし、このスイートはそのコードを含みませんしリンクもしません。",
    "th": "จากสามบรรทัดนี้ ตัวติดตั้งรันคำสั่ง up สองบรรทัดแรกแทนคุณ โดยเขียนชื่อเซอร์วิสให้ครบ — up -d gateway หรือ --profile node up -d gateway node — มี compose build gateway นำหน้า และ compose ps ตามหลัง บรรทัดที่สามคือ logs -f gateway มันก็แค่พิมพ์ไว้เป็นคำแนะนำ คุณต้องรันเอง โหนดอยู่ในโปรไฟล์ node ดังนั้นถ้าไม่ใส่ --profile node จะมีแค่ gateway ที่ขึ้น POPOPX_NODE_IMAGE ถูกอ่านโดย compose เท่านั้น ตัว gateway ไม่อ่านเลย — อิมเมจของโหนดต้อง build จากรีโปของโหนดเอง และชุดโปรแกรมนี้ไม่ได้มีหรือลิงก์โค้ดของมัน",
    "fi": "Näistä kolmesta rivistä asennusohjelma suorittaa puolestasi kaksi up-komentoa, palvelut nimettynä — up -d gateway, tai --profile node up -d gateway node — edellään compose build gateway ja perässään compose ps. Kolmannen rivin, logs -f gateway, se vain tulostaa vihjeenä; sen ajat itse. Solmu on node-profiilissa, joten ilman --profile node-asetusta vain gateway nousee. POPOPX_NODE_IMAGE:ta lukee vain compose, ei koskaan gateway — tuo image rakennetaan solmun omasta versiosta, eikä tämä pakkaus sisällä tai linkitä sen koodia.",
    "uk": "З цих трьох рядків інсталятор виконує за вас дві команди up, із названими сервісами: up -d gateway, або --profile node up -d gateway node; перед ними compose build gateway, після — compose ps. Третій рядок, logs -f gateway, він лише друкує як підказку — запускаєте його самі. Вузол лежить у профілі node, тому без --profile node стає лише шлюз. POPOPX_NODE_IMAGE читає тільки compose, шлюз — ніколи; образ вузла збирається з його власного репозиторію, а цей комплект його код не містить і не лінкує.",
    "bg": "От тези три реда инсталаторът изпълнява вместо вас двете up команди, с изписани имена на услугите — up -d gateway, или --profile node up -d gateway node — с compose build gateway отпред и compose ps отзад. Третия ред, logs -f gateway, той само отпечатва като подсказка; изпълнявате го вие. Възелът е в профила node, така че без --profile node се повдига само шлюзът. POPOPX_NODE_IMAGE се чете само от compose, никога от шлюза — образът на възела се изгражда от собственото му хранилище, а този комплект не съдържа и не линква кода му.",
    "tr": "Bu üç satırdan ikisini, yani up komutlarını, kurulum programı sizin yerinize çalıştırır — hizmet adları açıkça yazılır: up -d gateway, ya da --profile node up -d gateway node; başında bir compose build gateway, sonunda bir compose ps olur. Üçüncü satır, logs -f gateway, yalnızca bir ipucu olarak yazdırılır; onu siz çalıştırırsınız. Düğüm node profilinde durur, bu yüzden --profile node olmadan yalnızca ağ geçidi ayağa kalkar. POPOPX_NODE_IMAGE'yi yalnızca compose okur, ağ geçidi hiç okumaz — düğüm imajı kendi deposundan derlenir ve bu takım onun kodunu içermez ya da linklemez.",
    "hu": "Ezen három sor közül a telepítő ön helyett a két up parancsot futtatja le, a szolgáltatásnevek kiírásával — up -d gateway, vagy --profile node up -d gateway node — előtte egy compose build gateway, utána egy compose ps. A harmadik sort, logs -f gateway-t, csak tippként nyomtatja ki; azt maga futtatja. A csomópont a node profilban van, ezért --profile node nélkül csak az átjáró indul el. A POPOPX_NODE_IMAGE-t csak a compose olvassa, az átjáró soha — a csomópont image-je a csomópont saját tárolójából épül, és ez a csomag nem tartalmazza és nem linkeli a kódját.",
  } satisfies L,
  uUfwT: {
    en: "Firewall: the installer prints it, never runs it",
    "ru": "Файрвол: установщик печатает правило, но не применяет его",
    "de": "Firewall: Der Installierer print die Regel, setzt sie nie",
    "fr": "Pare-feu : l'installeur imprime la règle, ne l'applique jamais",
    "it": "Firewall: l'installatore stampa la regola, non la applica",
    "nl": "Firewall: de installateur print de regel, past hem nooit toe",
    "cs": "Firewall: instalátor pravidlo vytiskne, ale nikdy neaplikuje",
    "zh-Hans": "防火墙：脚本只打印，不动手",
    "zh-Hant": "防火牆：腳本只列印，不動手",
    "es": "Firewall: el instalador imprime la regla, nunca la aplica",
    "pl": "Zapora: instalator drukuje regułę, ale jej nie stosuje",
    "ja": "ファイアウォール：スクリプトは行を表示するだけで実行しない",
    "th": "ไฟร์วอลล์: สคริปต์แค่พิมพ์บรรทัดให้อ่าน ไม่ได้รันให้",
    "fi": "Palomuuri: asennusohjelma tulostaa säännön, ei koskaan aja sitä",
    "uk": "Файрвол: інсталятор друкує правило, але не застосовує його",
    "bg": "Огнена стена: инсталаторът печата правилото, но не го прилага",
    "tr": "Güvenlik duvarı: betik kuralı yazdırır, asla uygulamaz",
    "hu": "Tűzfal: a telepítő kinyomtatja a szabályt, de sosem alkalmazza",
  } satisfies L,
  uUfwC: {
    en: "This is exactly the line the installer's fourth NEXT STEP prints — swap in your own POPOPX_GATEWAY_PORT. The compose file says it plainly: under host networking the firewall is set with ufw on the host, and EXPOSE would be meaningless. Open it only once TLS is in place.",
    "ru": "Это ровно та строка, которую печатает четвёртый пункт NEXT STEPS установщика — подставьте свой POPOPX_GATEWAY_PORT. В compose-файле сказано прямо: при host-сети файрвол настраивают через ufw на хосте, а EXPOSE ничего не значит. Открывайте порт, только когда TLS уже на месте.",
    "de": "Das ist exakt die Zeile aus dem vierten NEXT-STEP-Punkt des Installierers — tauschen Sie nur Ihren eigenen POPOPX_GATEWAY_PORT ein. Die Compose-Datei sagt es offen: bei host-Netzwerk stellt man die Firewall mit ufw auf dem Host, EXPOSE ist bedeutungslos. Öffnen Sie den Port erst, wenn TLS steht.",
    "fr": "C'est exactement la ligne qu'affiche le quatrième point NEXT STEPS de l'installeur — remplacez par votre propre POPOPX_GATEWAY_PORT. Le fichier compose l'dit sans détour : en réseau host, le pare-feu se règle avec ufw sur l'hôte et EXPOSE n'a aucun sens. N'ouvrez le port qu'une fois TLS en place.",
    "it": "Questa è esattamente la riga che stampa il quarto punto NEXT STEPS dell'installatore — sostituisci il tuo POPOPX_GATEWAY_PORT. Il file compose lo dice chiaro: con la rete host il firewall si imposta con ufw sull'host ed EXPOSE non significa nulla. Apri la porta solo quando il TLS è in piedi.",
    "nl": "Dit is precies de regel die het vierde NEXT STEPS-punt van de installateur print — vervang door je eigen POPOPX_GATEWAY_PORT. Het compose-bestand zegt het ronduit: bij host-netwerk zet je de firewall met ufw op de host en is EXPOSE betekenisloos. Open de pas wanneer TLS op zijn plaats is.",
    "cs": "Tohle je přesně ten řádek, který tiskne čtvrtý bod NEXT STEPS instalátoru — dosaďte svůj POPOPX_GATEWAY_PORT. V compose souboru se dočtete otevřeně: při host síti se firewall nastavuje přes ufw na hostiteli a EXPOSE nemá význam. Otevírejte port, až když je TLS na místě.",
    "zh-Hans": "这条就是安装脚本第 4 条 NEXT STEPS 打印的那行，端口换成你的 POPOPX_GATEWAY_PORT。compose 文件里写得很清楚：host 网络下要设的是宿主机的 ufw，EXPOSE 没有意义。等到 TLS 就位再开。",
    "zh-Hant": "這行就是安裝腳本第 4 條 NEXT STEPS 印出來的，埠換成你的 POPOPX_GATEWAY_PORT。compose 檔裡寫得很清楚：host 網路下要設的是宿主機的 ufw，EXPOSE 沒有意義。等 TLS 就位再開。",
    "es": "Es exactamente la línea que imprime el cuarto punto de NEXT STEPS del instalador — cambia el puerto por tu propio POPOPX_GATEWAY_PORT. El archivo compose lo dice sin rodeos: con red host el cortafuegos se ajusta con ufw en el anfitrión y EXPOSE no significa nada. Abre el puerto solo cuando TLS esté en su sitio.",
    "pl": "To dokładnie ta linia, którą wypisuje czwarty punkt NEXT STEPS instalatora — podstaw własny POPOPX_GATEWAY_PORT. Plik compose mówi wprost: przy sieci host zaporę ustawia się przez ufw na hoście, a EXPOSE nic nie znaczy. Otwórz port dopiero, gdy TLS jest na miejscu.",
    "ja": "これはインストーラーが NEXT STEPS の4番目に印字するあの行そのものです — ポート番号はご自身の POPOPX_GATEWAY_PORT に置き換えてください。compose ファイルにも明記があるとおり、host ネットワークではファイアウォールはホスト側の ufw で設定し、EXPOSE に意味はありません。TLS が整ってからポートを開けてください。",
    "th": "นี่คือบรรทัดที่ขั้นตอนที่ 4 ของ NEXT STEPS ในตัวติดตั้งพิมพ์ออกมาเป๊ะ ๆ — เปลี่ยนเป็น POPOPX_GATEWAY_PORT ของคุณเอง ในไฟล์ compose ระบุไว้ชัดว่าเมื่อใช้ระบบเครือข่ายแบบ host ต้องตั้งไฟร์วอลล์ด้วย ufw บนโฮสต์ ส่วน EXPOSE ไม่มีความหมาย ค่อยเปิดพอร์ตเมื่อ TLS พร้อมแล้ว",
    "fi": "Tämä on täsmälleen se rivi, jonka asennusohjelman neljäs NEXT STEPS -kohta tulostaa — vaihda tilillesi oma POPOPX_GATEWAY_PORT. Compose-tiedosto sanoo suoraan: host-verkossa palomuuri asetetaan ufw:llä isäntäkoneella, eikä EXPOSE merkitse mitään. Avaa portti vasta kun TLS on paikoillaan.",
    "uk": "Це рівно той рядок, який друкує четвертий пункт NEXT STEPS інсталятора — підставте власний POPOPX_GATEWAY_PORT. У compose-файлі сказано прямо: за мережі host файрвол налаштовують через ufw на хості, а EXPOSE нічого не означає. Відкривайте порт, лише коли TLS уже на місці.",
    "bg": "Това е точно редът, който печата четвъртата стъпка от NEXT STEPS на инсталатора — заменете с вашия POPOPX_GATEWAY_PORT. В compose файла пише открыто: при host мрежа огнената стена се настройва с ufw върху хоста, а EXPOSE няма смисъл. Отворете порта едва когато TLS е налице.",
    "tr": "Bu, kurulum betiğinin NEXT STEPS listesindeki dördüncü maddenin yazdırdığı satırın ta kendisidir — kendi POPOPX_GATEWAY_PORT değerinizle değiştirin. compose dosyası açıkça söylüyor: host ağında güvenlik duvarı ana makinede ufw ile kurulur, EXPOSE'in bir anlamı yoktur. Portu ancak TLS hazır olduğunda açın.",
    "hu": "Ez pontosan az a sor, amelyet a telepítő NEXT STEPS listájának negyedik pontja nyomtat — cserélje ki a saját POPOPX_GATEWAY_PORT értékére. A compose fájl egyértelműen mondja: host hálózatnál a tűzfalat a gazdagépen ufw-val állítjuk, az EXPOSE-nek nincs jelentősége. Csak akkor nyissa ki a portot, ha a TLS már a helyén van.",
  } satisfies L,
  uGatesT: {
    en: "The two pre-release gates, off the boot path",
    "ru": "Два предрелизных рубильника, вне пути загрузки",
    "de": "Die zwei Veröffentlichungstore, abseits des Startpfads",
    "fr": "Les deux portes pré-publication, hors du chemin de démarrage",
    "it": "I due cancelli pre-rilascio, fuori dal percorso di avvio",
    "nl": "De twee pre-release-poorten, buiten het startpad",
    "cs": "Dve přepublikovací brány, mimo cestu startu",
    "zh-Hans": "发布前的两道门，不在启动路径上",
    "zh-Hant": "發布前的兩道門，不在啟動路徑上",
    "es": "Las dos puertas de prelanzamiento, fuera de la ruta de arranque",
    "pl": "Dwie bramy przed wydaniem, poza ścieżką startu",
    "ja": "リリース前の2つの関門、起動パスの外に置く",
    "th": "ประตูก่อนปล่อยสองชั้น อยู่นอกเส้นทางการบูต",
    "fi": "Kaksi julkaisua edeltävää porttia, käynnistyspolun ulkopuolella",
    "uk": "Два передумовні рубильники, поза шляхом завантаження",
    "bg": "Двете врати преди релиз, извън пътя на стартиране",
    "tr": "Yayın öncesi iki kapı, açılış yolunun dışında",
    "hu": "A két kiadás előtti kapu, az indulási útvonalon kívül",
  } satisfies L,
  uGatesC: {
    en: "create_app() runs only the route gate assert_routes_are_gated() at startup: a single admin route left ungated and the socket never binds. The full suite is the development and release entry point, and all three launchers — start_macos.sh, install_ubuntu22.sh, install_macos.sh — print these two commands as their last step. The self-test really issues requests against the ASGI app, which is how it can tell a mounted route from one that merely exists in source.",
    "ru": "При запуске create_app() выполняет только маршрутный рубильник assert_routes_are_gated(): одна незакрытая токеном админ-маршрут — и сокет не привязывается. Полный набор — это входная точка разработки и релиза, и все три запускатора — start_macos.sh, install_ubuntu22.sh, install_macos.sh — печатают эти две команды последним шагом. --self-test действительно рассылает запросы к ASGI-приложению, поэтому он и умеет отличить смонтированный маршрут от того, что лишь лежит в исходниках.",
    "de": "Beim Start fährt create_app() nur das Routentor assert_routes_are_gated() auf: eine einzige ungesicherte Admin-Route und der Socket bindet nicht. Die vollständigen Suites sind der Entwicklungs- und Release-Einstieg, und alle drei Starter — start_macos.sh, install_ubuntu22.sh, install_macos.sh — geben diese zwei Befehle als letzten Schritt zum Kopieren aus. Der Self-Test stellt seine Anfragen tatsächlich an die ASGI-App — nur deshalb kann er eine montierte Route von einer unterscheiden, die nur im Quelltext steht.",
    "fr": "Au démarrage, create_app() ne fait passer que le filtre de routes assert_routes_are_gated() : une seule route admin non gardée et la socket ne se lie pas. Les suites complètes sont le point d'entrée de développement et de publication, et les trois lanceurs — start_macos.sh, install_ubuntu22.sh, install_macos.sh — impriment ces deux commandes en dernière étape. Le --self-test envoie réellement des requêtes à l'application ASGI, ce qui lui permet de distinguer une route montée d'une route qui ne fait qu'exister dans le source.",
    "it": "All'avvio create_app() esegue solo il cancello dei percorsi assert_routes_are_gated(): un singolo route admin non protetto e il socket non fa bind. Le suite complete sono l'entry point di sviluppo e rilascio, e tutti e tre i launcher — start_macos.sh, install_ubuntu22.sh, install_macos.sh — stampano questi due comandi come ultimo passo. Il --self-test invia davvero richieste all'app ASGI, ed è per questo che sa distinguere una route montata da una che esiste soltanto nel sorgente.",
    "nl": "Bij het opstarten voert create_app() alleen het routetonkel assert_routes_are_gated() uit: één onbeveiligde admin-route en de socket bindt niet. De volledige suites zijn het ontwikkel- en release-instappunt, en alle drie de starters — start_macos.sh, install_ubuntu22.sh, install_macos.sh — printen deze twee commando's als laatste stap. De --self-test doet echt aanvragen aan de ASGI-app, en daarom kan hij een gemonteerde route onderscheiden van eentje die alleen in de broncode staat.",
    "cs": "Při startu create_app() spustí pouze bránu rout assert_routes_are_gated(): jediná nechráněná admin route a sokl se nenabinduje. Kompletní sady jsou vstupním bodem pro vývoj a release, a všechny tři spouštěče — start_macos.sh, install_ubuntu22.sh, install_macos.sh — je vytisknou jako poslední krok. --self-test skutečně posílá požadavky na ASGI aplikaci, proto umí rozlišit nasazenou routu od té, která jen leží ve zdrojáku.",
    "zh-Hans": "create_app() 启动时只跑路由门禁 assert_routes_are_gated()：有一条 admin 路由没被令牌盖住，就不该开始监听。完整套件是开发/发布前的入口，三个启动脚本——start_macos.sh、install_ubuntu22.sh、install_macos.sh——都在最后一步把这两条打印出来供复制。--self-test 的请求是真向 ASGI 应用发的，所以它能分辨一条路由是装上了还是只是写在源码里。",
    "zh-Hant": "create_app() 啟動時只跑路由閘門 assert_routes_are_gated()：有一條 admin 路由沒被權杖蓋住，就不該開始監聽。完整套件是開發/發布前的入口，三個啟動腳本——start_macos.sh、install_ubuntu22.sh、install_macos.sh——都在最後一步把這兩條印出來供複製。--self-test 的請求是真的向 ASGI 應用發的，所以它能分辨一條路由是裝上了還是只是寫在原始碼裡。",
    "es": "Al arrancar, create_app() solo ejecuta la barrera de rutas assert_routes_are_gated(): una sola ruta de administración sin cubrir y el socket no hace bind. Las suites completas son la entrada de desarrollo y publicación, y los tres lanzadores — start_macos.sh, install_ubuntu22.sh, install_macos.sh — imprimen estas dos comandos como último paso. La prueba --self-test emite peticiones reales contra la app ASGI, y por eso distingue una ruta montada de otra que solo existe en el código fuente.",
    "pl": "Przy starcie create_app() uruchamia tylko blokadę tras assert_routes_are_gated(): jedno nieobjęte tokenem trasa administracyjna i gniazdo się nie wiąże. Pełne zestawy są punktem wejścia dla developmentu i wydania, a wszystkie trzy uruchamiacze — start_macos.sh, install_ubuntu22.sh, install_macos.sh — wypisują te dwa polecenia jako ostatni krok. --self-test naprawdę wysyła żądania do aplikacji ASGI, dlatego odróżnia trasę zamontowaną od takiej, która tylko istnieje w kodzie.",
    "ja": "起動時に create_app() が実行するのは関門 assert_routes_are_gated() だけです。admin ルートが1つでもトークンで覆われていなければ、ソケットは bind しません。完全な一式は開発とリリースのための入口であり、3つの起動スクリプト——start_macos.sh、install_ubuntu22.sh、install_macos.sh——とも最後のステップでこの2つのコマンドをコピー用に表示します。--self-test は ASGI アプリに対して実際にリクエストを発行するので、マウント済みのルートとソースに書いてあるだけのルートを区別できます。",
    "th": "ตอนเริ่มระบบ create_app() จะรันเฉพาะด่านตรวจเส้นทาง assert_routes_are_gated() เท่านั้น: ถ้ามีเส้นทางการดูแลระบบสักเส้นไม่ถูกคลุมด้วยโทเคน ซ็อกเก็ตจะไม่ bind เลย ชุดทดสอบเต็มเป็นประตูเข้าสำหรับการพัฒนาและการปล่อย และสคริปต์เริ่มต้นทั้งสามตัว — start_macos.sh, install_ubuntu22.sh, install_macos.sh — จะพิมพ์คำสั่งคู่นี้เป็นขั้นสุดท้ายให้ก็อปปี --self-test ส่งคำขอเข้าแอป ASGI จริง ๆ มันจึงแยกออกระหว่างเส้นทางที่ถูกติดตั้งแล้วกับที่มีแค่ในซอร์ส",
    "fi": "Kun create_app() käynnistyy, se ajaa vain reittivartijan assert_routes_are_gated(): yksi vartioimaton hallintareitti eikä socket sido. Täydet testisarjat ovat kehityksen ja julkaisun entry point, ja kaikki kolme käynnistintä — start_macos.sh, install_ubuntu22.sh, install_macos.sh — tulostavat nämä komennot viimeisenä vaiheena. --self-test todella lähettää pyyntöjä ASGI-sovellukselle, ja siksi se erottaa asennetun reitin sellaisesta, joka on vain lähdekoodissa.",
    "uk": "Під час запуску create_app() виконує лише маршрутний рубильник assert_routes_are_gated(): одна незахищена адмін-маршрут — і сокет не прив'язується. Повні набори — це вхідна точка для розробки та релізу, і всі три запускачі — start_macos.sh, install_ubuntu22.sh, install_macos.sh — друкують ці дві команди останнім кроком. --self-test насправді надсилає запити до ASGI-застосунку, тому й розрізняє змонтований маршрут і той, що лише лежить у вихідному коді.",
    "bg": "При стартиране create_app() изпълнява само вратата на маршрутите assert_routes_are_gated(): един незащитен админски маршрут и сокетът не се обвързва. Пълните набори са входната точка за разработка и релиз, и и трите стартера — start_macos.sh, install_ubuntu22.sh, install_macos.sh — печатат тези две команди като последна стъпка. --self-test наистина изпраща заявки към ASGI приложението, затова различава монтиран маршрут от такъв, който само съществува в кода.",
    "tr": "Açılışta create_app() yalnızca rota kapısını assert_routes_are_gated() çalıştırır: tek bir korunmasız yönetici rotası varsa soket hiç bağlanmaz. Tam takımlar geliştirme ve yayın giriş kapısıdır, ve üç betiğin hepsi — start_macos.sh, install_ubuntu22.sh, install_macos.sh — bu iki komutu son adım olarak yazdırır. --self-test ASGI uygulamasına gerçekten istek gönderir; bu yüzden kurulmuş bir rotayı, yalnızca kaynakta var olan bir rotadan ayırt edebilir.",
    "hu": "Induláskor a create_app() csak az útvonalőrt futtatja: assert_routes_are_gated() — egyetlen védtelen admin útvonal, és a foglalat nem köt ki. A teljes csomagok a fejlesztés és a kiadás belépési pontjai, és mind a három indító — start_macos.sh, install_ubuntu22.sh, install_macos.sh — utolsó lépésként nyomtatja ki ezt a két parancsot. A --self-test valóban küld kéréseket az ASGI alkalmazásnak, ezért tudja megkülönböztetni a felcsatolt útvonalat attól, amely csak a forrásban létezik.",
  } satisfies L,

  secTitle: {
    en: "Four things to know before you expose it",
    "ru": "Четыре вещи, которые надо знать до выхода в сеть",
    "de": "Vier Dinge, die Sie kennen sollten, bevor Sie es ins Netz stellen",
    "fr": "Quatre choses à savoir avant de l'exposer au réseau",
    "it": "Quattro cose da sapere prima di esporlo alla rete",
    "nl": "Vier dingen om te weten voor je het naar buiten opent",
    "cs": "Čtyři věci, které musíte znát, než to pustíte do sítě",
    "zh-Hans": "部署前必须知道的四件事",
    "zh-Hant": "部署前必須知道的四件事",
    "es": "Cuatro cosas que saber antes de exponerlo a la red",
    "pl": "Cztery rzeczy, które trzeba znać, zanim wystawisz to do sieci",
    "ja": "外部に公開する前に知っておくべき4つのこと",
    "th": "สี่เรื่องที่ควรรู้ก่อนเปิดออกสู่เครือข่าย",
    "fi": "Neljä asiaa, jotka pitää tietää ennen julkaisua verkkoon",
    "uk": "Чотири речі, які треба знати, перш ніж виводити це в мережу",
    "bg": "Четири неща, които трябва да знаете, преди да го извадите в мрежата",
    "tr": "Dışarı açmadan önce bilmeniz gereken dört şey",
    "hu": "Négy dolog, amit tudnia kell, mielőtt kinyitja a hálózat felé",
  } satisfies L,
  secPortL: {
    en: "Port",
    "ru": "Порт",
    "de": "Port",
    "fr": "Port",
    "it": "Porta",
    "nl": "Poort",
    "cs": "Port",
    "zh-Hans": "端口",
    "zh-Hant": "連線埠",
    "es": "Puerto",
    "pl": "Port",
    "ja": "ポート",
    "th": "พอร์ต",
    "fi": "Portti",
    "uk": "Порт",
    "bg": "Порт",
    "tr": "Port",
    "hu": "Port",
  } satisfies L,
  secPort: {
    en: "The console and the API share one socket, sized by POPOPX_GATEWAY_HOST (default 0.0.0.0) and POPOPX_GATEWAY_PORT (default 8080): http://<host>:8080/ is it. The installer opens no firewall port itself — it only prints the ufw line you are supposed to run.",
    "ru": "Консоль и API делят один сокет: его задают POPOPX_GATEWAY_HOST (по умолчанию 0.0.0.0) и POPOPX_GATEWAY_PORT (по умолчанию 8080), и http://<host>:8080/ — это он. Сам установщик не открывает ни одного порта файрвола, он лишь печатает строку ufw, которую положится выполнить.",
    "de": "Konsole und API teilen sich einen Socket, bestimmt von POPOPX_GATEWAY_HOST (Standard 0.0.0.0) und POPOPX_GATEWAY_PORT (Standard 8080): http://<host>:8080/ ist genau der. Der Installierer selbst öffnet keinen Firewall-Port — er druckt nur die ufw-Zeile, die Sie laufen lassen sollen.",
    "fr": "La console et l'API partagent une seule socket, définie par POPOPX_GATEWAY_HOST (0.0.0.0 par défaut) et POPOPX_GATEWAY_PORT (8080 par défaut) : http://<host>:8080/ est elle. L'installeur n'ouvre lui-même aucun port du pare-feu, il se contente d'imprimer la ligne ufw qu'il faut lancer.",
    "it": "Console e API condividono un solo socket, deciso da POPOPX_GATEWAY_HOST (default 0.0.0.0) e POPOPX_GATEWAY_PORT (default 8080): http://<host>:8080/ è quello. L'installatore non apre nessuna porta del firewall di per sé: si limita a stampare la riga ufw che dovresti eseguire.",
    "nl": "Console en API delen één socket, bepaald door POPOPX_GATEWAY_HOST (standaard 0.0.0.0) en POPOPX_GATEWAY_PORT (standaard 8080): http://<host>:8080/ is het. De installateur opent zelf geen firewallpoort — hij print alleen de ufw-regel die je hoort te draaien.",
    "cs": "Konzole a API sdílejí jeden sokl, určený POPOPX_GATEWAY_HOST (výchozí 0.0.0.0) a POPOPX_GATEWAY_PORT (výchozí 8080): http://<host>:8080/ je on. Instalátor sám žádný port firewallu neotevře — jen vytiskne řádek ufw, který máte spustit.",
    "zh-Hans": "后台和 API 共用一只套接字，由 POPOPX_GATEWAY_HOST（默认 0.0.0.0）与 POPOPX_GATEWAY_PORT（默认 8080）决定，浏览器打开 http://<host>:8080/ 就是它。安装脚本自己不开放任何防火墙端口，它只把该跑的那条 ufw 打印出来。",
    "zh-Hant": "後台和 API 共用一個連線埠，由 POPOPX_GATEWAY_HOST（預設 0.0.0.0）與 POPOPX_GATEWAY_PORT（預設 8080）決定，瀏覽器開 http://<host>:8080/ 就是它。安裝腳本自己不開放任何防火牆埠，它只把該跑的那條 ufw 印出來。",
    "es": "La consola y la API comparten un único socket, fijado por POPOPX_GATEWAY_HOST (por defecto 0.0.0.0) y POPOPX_GATEWAY_PORT (por defecto 8080): http://<host>:8080/ es eso. El instalador no abre ningún puerto del cortafuegos por sí mismo: solo imprime la línea de ufw que debes ejecutar.",
    "pl": "Konsola i API dzielą jedno gniazdo, wyznaczone przez POPOPX_GATEWAY_HOST (domyślnie 0.0.0.0) i POPOPX_GATEWAY_PORT (domyślnie 8080): http://<host>:8080/ to właśnie ono. Sam instalator nie otwiera żadnego portu zapory — tylko drukuje linijkę ufw, którą powinieneś uruchomić.",
    "ja": "コンソールと API は同じソケットを共用しています。決めるのは POPOPX_GATEWAY_HOST（既定 0.0.0.0）と POPOPX_GATEWAY_PORT（既定 8080）で、http://<host>:8080/ がそれです。インストーラー自身はファイアウォールのポートを一つも開けません。あなたが実行すべき ufw の行を表示するだけです。",
    "th": "หน้าเว็บผู้ดูแลกับ API ใช้ซ็อกเก็ตตัวเดียวกัน ซึ่งกำหนดโดย POPOPX_GATEWAY_HOST (ค่าเริ่มต้น 0.0.0.0) และ POPOPX_GATEWAY_PORT (ค่าเริ่มต้น 8080) — http://<host>:8080/ ก็คือตัวนี้เอง ตัวติดตั้งไม่เปิดพอร์ตไฟร์วอลล์ให้เลย มันแค่พิมพ์บรรทัด ufw ที่คุณควรรันออกมาให้",
    "fi": "Konsoli ja API käyttävät samaa socketia, jonka määräävät POPOPX_GATEWAY_HOST (oletus 0.0.0.0) ja POPOPX_GATEWAY_PORT (oletus 8080): http://<host>:8080/ on se. Asennusohjelma ei avaa itse yhtään palomuuriporttia — se vain tulostaa sen ufw-komennon, joka sinun pitäisi ajaa.",
    "uk": "Консоль і API ділять один сокет, який задають POPOPX_GATEWAY_HOST (типово 0.0.0.0) і POPOPX_GATEWAY_PORT (типово 8080), і http://<host>:8080/ — це він. Сам інсталятор не відкриває жодного порту файрвола, він лише друкує рядок ufw, який слід запустити.",
    "bg": "Конзолата и API споделят един сокет, определен от POPOPX_GATEWAY_HOST (по подразбиране 0.0.0.0) и POPOPX_GATEWAY_PORT (по подразбиране 8080): http://<host>:8080/ е той. Инсталаторът сам не отваря никакъв порт на огнената стена – само печата реда с ufw, който трябва да изпълните.",
    "tr": "Konsol ile API tek bir soketi paylaşır; onu POPOPX_GATEWAY_HOST (varsayılan 0.0.0.0) ve POPOPX_GATEWAY_PORT (varsayılan 8080) belirler: http://<host>:8080/ işte budur. Kurulum programı güvenlik duvarında kendi başına hiçbir port açmaz — yalnızca çalıştırmanız gereken ufw satırını yazdırır.",
    "hu": "A konzol és az API egy foglalatot oszt ki, amelyet a POPOPX_GATEWAY_HOST (alapértelmezett 0.0.0.0) és a POPOPX_GATEWAY_PORT (alapértelmezett 8080) határoz meg: http://<host>:8080/ ez maga. A telepítő maga egy tűzfalportot sem nyit meg — csak azt az ufw sort nyomtatja ki, amelyet futtatnia kell.",
  } satisfies L,
  secNodeL: {
    en: "Node",
    "ru": "Узел",
    "de": "Knoten",
    "fr": "Nœud",
    "it": "Nodo",
    "nl": "Node",
    "cs": "Uzel",
    "zh-Hans": "节点",
    "zh-Hant": "節點",
    "es": "Nodo",
    "pl": "Węzeł",
    "ja": "ノード",
    "th": "โหนด",
    "fi": "Solmu",
    "uk": "Вузол",
    "bg": "Възел",
    "tr": "Düğüm",
    "hu": "Csomópont",
  } satisfies L,
  secNode: {
    en:
      `The node's WebSocket API binds loopback only — ${NODE_WS_URL} — and that layer carries no authentication. Keep it that way: never forward or expose 5225 onto a network. If nginx sits in front of the gateway, protect /api/v1/admin and leave the node alone.`,
    "ru":
      `WebSocket API узла привязан только к loopback — ${NODE_WS_URL} — и этот слой не несёт никакой аутентификации. Пусть так и остаётся: никогда не пробрасывайте 5225 и не выставляйте его в сеть. Если nginx стоит перед шлюзом, довольно защитить /api/v1/admin, а узел не трогать.`,
    "de":
      `Die WebSocket-API des Knotens bindet nur loopback — ${NODE_WS_URL} — und diese Schicht trägt keine Authentifizierung. Belassen Sie es dabei: leiten Sie 5225 niemals auf ein Netzwerk weiter und exponieren Sie es nicht. Wenn nginx vor dem Gateway sitzt, schützen Sie /api/v1/admin und lassen Sie den Knoten in Ruhe.`,
    "fr":
      `L'API WebSocket du nœud ne se lie qu'à loopback — ${NODE_WS_URL} — et cette couche ne porte aucune authentification. Laissez-la telle quelle : ne relayez ni n'exposez jamais 5225 sur un réseau. Si nginx se tient devant la passerelle, protégez /api/v1/admin et laissez le nœud tranquille.`,
    "it":
      `L'API WebSocket del nodo si binda solo su loopback — ${NODE_WS_URL} — e questo livello non porta autenticazione. Lasciate stare: non inoltrate né esponete mai 5225 su una rete. Se nginx sta davanti al gateway, proteggete /api/v1/admin e lasciate in pace il nodo.`,
    "nl":
      `De WebSocket-API van de node bindt alleen naar loopback — ${NODE_WS_URL} — en die laag draagt geen authenticatie. Laat het zo: laat 5225 nooit door en exposeer het niet op een netwerk. Als nginx vóór de gateway zit, beveilig je /api/v1/admin en laat je de node met rust.`,
    "cs":
      `WebSocket API uzlu se váže jen na loopback — ${NODE_WS_URL} — a ta vrstva nemá žádné ověření. Nechte to tak: 5225 nikdy nepřeposílejte ani nevydávejte do sítě. Pokud před bránou stojí nginx, chráňte /api/v1/admin a uzlu se nedotýkejte.`,
    "zh-Hans":
      `节点的 WebSocket API 只绑回环：${NODE_WS_URL}，而且这一层没有鉴权。保持这样——不要把 5225 转发或暴露到任何网络上。如果用 nginx 挡在网关前面，保护 /api/v1/admin 就够了，节点那侧不用动。`,
    "zh-Hant":
      `節點的 WebSocket API 只綁迴環：${NODE_WS_URL}，而且這一層沒有鑑權。保持這樣——不要把 5225 轉發或暴露到任何網路上。若用 nginx 擋在閘道前面，保護 /api/v1/admin 就夠了，節點那側不用動。`,
    "es":
      `La API WebSocket del nodo sólo se enlaza a loopback — ${NODE_WS_URL} — y esa capa no lleva autenticación. Déjelo así: nunca reenvíe ni exponga 5225 a una red. Si nginx está delante de la pasarela, proteja /api/v1/admin y deje el nodo en paz.`,
    "pl":
      `API WebSocket węzła wiąże się tylko z loopback — ${NODE_WS_URL} — i ta warstwa nie ma żadnego uwierzytelniania. Zostawcie to tak: nigdy nie przekazujcie 5225 ani nie wystawiajcie go na sieć. Jeśli nginx stoi przed bramą, wystarczy zabezpieczyć /api/v1/admin, a węzeł zostawić w spokoju.`,
    "ja":
      `ノードの WebSocket API はループバックだけにバインドします（${NODE_WS_URL}）。この層には認証がありません。そのままにしてください。5225 を転送したりネットワークに公開したりしないでください。nginx でゲートウェイを覆う場合は /api/v1/admin を守れば足り、ノード側に手を入れる必要はありません。`,
    "th":
      `API แบบ WebSocket ของ node ผูกเฉพาะ loopback เท่านั้น — ${NODE_WS_URL} — และชั้นนี้ไม่มีการยืนยันตัวตนเลย ปล่อยไว้แบบนี้ อย่าส่งต่อหรือเปิดพอร์ต 5225 ออกสู่เครือข่าย ถ้าวาง nginx ไว้หน้า gateway ก็แค่ป้องกัน /api/v1/admin แล้วไม่ต้องแตะฝั่ง node`,
    "fi":
      `Noden WebSocket-API sitoutuu vain loopbackkiin — ${NODE_WS_URL} — eikä tämä kerros sisällä lainkaan todennusta. Jätä se näin: älä koskaan välitä eikä altista 5225:ttä verkolle. Jos nginx seisoo gatewayn edessä, suojaa /api/v1/admin ja jätä node rauhaan.`,
    "uk":
      `WebSocket API вузла прив'язаний лише до loopback — ${NODE_WS_URL} — і цей шар не має автентифікації. Залиште так: ніколи не пересилайте і не викладайте 5225 у мережу. Якщо nginx стоїть перед шлюзом, захистіть /api/v1/admin, а вузол не чіпайте.`,
    "bg":
      `WebSocket API на възела се обвързва само с loopback — ${NODE_WS_URL} — и този слой няма автентикация. Оставете го така: никога не препращайте и не излагайте 5225 в мрежа. Ако nginx стои пред шлюза, защитете /api/v1/admin и не се месете във възела.`,
    "tr":
      `Düğümün WebSocket API'si yalnızca loopback'e bağlanır — ${NODE_WS_URL} — ve bu katmanda kimlik doğrulama yoktur. Öyle bırakın: 5225'i asla bir ağa iletmeyin ya da açık etmeyin. nginx ağ geçidinin önünde duruyorsa /api/v1/admin'i koruyun, düğümü rahat bırakın.`,
    "hu":
      `A csomópont WebSocket API-ja csak a loopback-re kötődik — ${NODE_WS_URL} —, és ez a réteg nem hordoz hitelesítést. Hagyja így: soha ne továbbítsa és ne tegye ki 5225-öt egy hálózatra. Ha az nginx az átjáró előtt ül, védje a /api/v1/admin útvonalat, és a csomópontot hagyja békén.`,
  } satisfies L,
  secLaunchL: {
    en: "Starting point",
    "ru": "Отправная точка",
    "de": "Ausgangspunkt",
    "fr": "Point de départ",
    "it": "Punto di partenza",
    "nl": "Startpunt",
    "cs": "Výchozí bod",
    "zh-Hans": "起点",
    "zh-Hant": "起點",
    "es": "Punto de partida",
    "pl": "Punkt wyjścia",
    "ja": "スタート地点",
    "th": "จุดเริ่ม",
    "fi": "Lähtökohta",
    "uk": "Відправна точка",
    "bg": "Изходна точка",
    "tr": "Başlangıç noktası",
    "hu": "Kiindulópont",
  } satisfies L,
  secCompose: {
    en: "docker-compose.yml is the starting point for a Linux production box: both services use network_mode: host, which is why the file declares no ports: (they would be silently ignored). The three shell launchers are the venv path. The README states the caveat itself: the author's machine has no docker and the compose file has never been executed — --check-routes proves the URL inside it exists, not that the two containers boot.",
    "ru": "docker-compose.yml — отправная точка для продакшн-машины на Linux: оба сервиса идут с network_mode: host, поэтому в файле нет ports: (в host-сети они молча игнорируются). Три shell-запускатора — это путь venv. README сам формулирует оговорку: на машине автора нет docker, и этот compose-файл никогда не запускался — --check-routes доказывает, что URL внутри файла существует, а не то, что два контейнера поднимутся.",
    "de": "docker-compose.yml ist der Ausgangspunkt für einen Linux-Produktivrechner: beide Dienste nutzen network_mode: host, deshalb erklärt die Datei keine ports: (die würden bei host-Netzwerk stillschweigend ignoriert). Die drei Shell-Startskripte sind der venv-Weg. Der README nennt den Vorbehalt selbst: auf dem Rechner des Autors gibt es kein docker, und diese compose-Datei wurde nie ausgeführt — --check-routes belegt, dass die darin stehende URL existiert, nicht dass die zwei Container hochfahren.",
    "fr": "docker-compose.yml est le point de départ d'une machine de production Linux : les deux services utilisent network_mode: host, d'où l'absence de ports: dans le fichier (ils seraient silencieusement ignorés en réseau host). Les trois lanceurs shell sont la voie venv. Le README pose lui-même la réserve : la machine de l'auteur n'a pas docker et ce fichier compose n'a jamais été exécuté — --check-routes prouve que l'URL qu'il contient existe, pas que les deux conteneurs démarreront.",
    "it": "docker-compose.yml è il punto di partenza per una macchina Linux di produzione: entrambi i servizi usano network_mode: host, e infatti il file non dichiara ports: (con la rete host verrebbero ignorati in silenzio). I tre launcher shell sono la strada venv. Il README dichiara da sé la riserva: sulla macchina dell'autore non c'è docker e questo file compose non è mai stato eseguito — --check-routes prova che l'URL contenuta nel file esiste, non che i due container si avvino.",
    "nl": "docker-compose.yml is het startpunt voor een Linux-productiebox: beide diensten gebruiken network_mode: host, verklaart het bestand geen ports: (die worden bij host-netwerk stilzwijgend genegeerd). De drie shell-starters zijn het venv-pad. De README vermeldt de kanttekening zelf: op de machine van de auteur staat geen docker en dit compose-bestand is nooit uitgevoerd — --check-routes bewijst dat de URL erin bestaat, niet dat de twee containers opkomen.",
    "cs": "docker-compose.yml je výchozím bodem pro linuxový produkční stroj: obe služby používají network_mode: host, proto soubor nedeklaruje ports: (v host síti by se tiše ignorovaly). Tři shell spouštěče jsou cesta venv. README samo uvádí výhradu: na autorově stroji není docker a tento compose soubor nikdy nebyl spuštěn — --check-routes dokládá, že URL uvnitř existuje, ne to, že dva kontejnery vstanou.",
    "zh-Hans": "docker-compose.yml 是 Linux 生产机的起点：两个服务都用 network_mode: host，所以文件里没有 ports:（host 网络下会被静默忽略）。三个 shell 启动脚本走的是 venv 那条路。README 自己也写明：作者机器上没有 docker，这份 compose 文件本身从未被执行过——--check-routes 证明的是文件里那条 URL 存在，不是两个容器起得来。",
    "zh-Hant": "docker-compose.yml 是 Linux 生產機的起點：兩個服務都用 network_mode: host，所以檔裡沒有 ports:（host 網路下會被靜默忽略）。三個 shell 啟動腳本走的是 venv 那條路。README 自己也寫明：作者機器上沒有 docker，這份 compose 檔本身從未被執行過——--check-routes 證明的是檔裡那條 URL 存在，不是兩個容器起得來。",
    "es": "docker-compose.yml es el punto de partida de una máquina Linux de producción: ambos servicios usan network_mode: host, por eso el archivo no declara ports: (en red host se ignorarían en silencio). Los tres lanzadores shell son el camino de venv. El propio README deja la advertencia escrita: en la máquina del autor no hay docker y este archivo compose nunca se ha ejecutado — --check-routes prueba que la URL que contiene existe, no que los dos contenedores arranquen.",
    "pl": "docker-compose.yml jest punktem wyjścia dla linuksowej maszyny produkcyjnej: obie usługi używają network_mode: host, dlatego plik nie deklaruje ports: (przy sieci host byłyby cicho ignorowane). Trzy uruchamiacze shellowe to ścieżka venv. README sam formułuje zastrzeżenie: na maszynie autora nie ma docker, a ten plik compose nigdy nie został wykonany — --check-routes dowodzi, że URL w nim zapisany istnieje, a nie że dwa kontenery wstaną.",
    "ja": "docker-compose.yml は Linux 本番機の開始点です。両サービスが network_mode: host を使うため、このファイルに ports: の宣言はありません（host ネットワークでは黙って無視されるから）。3つのシェル起動スクリプトは venv の側です。README 自身が留保を書いています。作者の機械には docker が無く、この compose ファイルは一度も実行されていません。--check-routes が証明するのはファイル内の URL が存在することであって、2つのコンテナが起動することではありません。",
    "th": "docker-compose.yml คือจุดเริ่มของเครื่อง Linux ที่ใช้จริง: สองเซอร์วิสใช้ network_mode: host ทั้งคู่ จึงไม่มี ports: ประกาศไว้ในไฟล์ (ถ้าเป็นเครือข่ายแบบ host มันจะถูกเงียบทิ้ง) สามสคริปต์เชลล์เริ่มต้นคือเส้นทางแบบ venv README ระบุข้อแม้ไว้ด้วยตัวเอง: บนเครื่องของผู้เขียนไม่มี docker และไฟล์ compose นี้ไม่เคยถูกรันเลย — --check-routes พิสูจน์ว่ามี URL ที่เขียนไว้ในไฟล์อยู่จริง ไม่ได้พิสูจน์ว่าคอนเทนเนอร์สองตัวจะขึ้นได้",
    "fi": "docker-compose.yml on lähtökohta Linux-tuotantokoneella: molemmat palvelut käyttävät network_mode: host -tilaa, siksi tiedosto ei julista ports: -kohtaa (ne sivuutettaisiin host-verkossa äänettömästi). Kolme shell-käynnistintä ovat venv-reitti. README mainitsee varauksen itse: tekijän koneella ei ole dockeria, eikä tätä compose-tiedostoa ole koskaan suoritettu — --check-routes todistaa tiedoston URL-osoitteen olemassaolon, ei sitä että kaksi konttia nousee.",
    "uk": "docker-compose.yml — це відправна точка для продакшн-машини на Linux: обидва сервіси йдуть з network_mode: host, тому у файлі немає ports: (у host-мережі їх мовчки проігноровано). Три shell-запускачі — це шлях venv. README сам формулює застереження: на машині автора docker немає, і цей compose-файл ніколи не запускали — --check-routes доводить, що URL усередині файлу існує, а не те, що два контейнери піднімуться.",
    "bg": "docker-compose.yml е изходната точка за продуктов Linux компютър: и двете услуги ползват network_mode: host, затова във файла няма ports: (при host мрежа те биха били безмълвно игнорирани). Трите shell стартера са пътят на venv. README сам поставя уговорката: на машината на автора няма docker и този compose файл никога не е изпълняван — --check-routes доказва, че URL-ът в него съществува, а не че двата контейнера ще станат.",
    "tr": "docker-compose.yml, bir Linux üretim makinesi için başlangıç noktasıdır: iki hizmet de network_mode: host kullanır, bu yüzden dosyada ports: bildirimi yok (host ağında sessizce yok sayılırlar). Üç kabuk betiği venv yoludur. README çekinceyi bizzat kendisi yazar: yazarın makinesinde docker yok ve bu compose dosyası hiç çalıştırılmadı — --check-routes dosyanın içindeki URL'in var olduğunu kanıtlar, iki konteynerin ayağa kalkacağını değil.",
    "hu": "A docker-compose.yml a Linux éles gép kiindulópontja: mindkét szolgáltatás network_mode: host módot használ, ezért a fájl nem deklarál ports: részt (host hálózatban csendben figyelmen kívül maradnának). A három shell indító a venv út. A README maga fogalmazza meg a fenntartást: a szerző gépén nincs docker, és ezt a compose fájlt soha nem futottatták — a --check-routes azt igazolja, hogy a benne lévő URL létezik, nem azt, hogy a két konténer elindul.",
  } satisfies L,
  secBackupL: {
    en: "Backup",
    "ru": "Резервная копия",
    "de": "Sicherung",
    "fr": "Sauvegarde",
    "it": "Backup",
    "nl": "Back-up",
    "cs": "Záloha",
    "zh-Hans": "备份",
    "zh-Hant": "備份",
    "es": "Copia de seguridad",
    "pl": "Kopia zapasowa",
    "ja": "バックアップ",
    "th": "การสำรองข้อมูล",
    "fi": "Varmuuskopio",
    "uk": "Резервна копія",
    "bg": "Резервно копие",
    "tr": "Yedek",
    "hu": "Biztonsági mentés",
  } satisfies L,
  secBackup: {
    en: "One file, gateway.db under /var/lib/popopx-service-suite, holds the ledger, every pairwise session secret and the channel identity private keys; there is deliberately no separate keyring file, because a rotation must commit in the same transaction as the frame it delivers. Lose it and every existing zero-knowledge channel goes silent for good — no rotation can be signed that members will verify. That is the installer's fifth NEXT STEP. The vault is opt-in: with POPOPX_VAULT_KEY set (32 raw bytes, held by the operator) selected secrets are sealed with ChaCha20-Poly1305 and kept as vault1: values in that same database, so back up the key separately — lose it and those rows stay unreadable, while older plaintext rows keep working.",
    "ru": "Один файл, gateway.db в /var/lib/popopx-service-suite, хранит реестр, каждую парную сессионную тайну и приватные ключи идентификации канала; отдельного файла keyring здесь намеренно нет, потому что ротация обязана фиксироваться в той же транзакции, что и доставляемый ею кадр. Потеряете его — и все существующие каналы с нулевым разглашением замолчат навсегда: ни одна ротация не будет подписана так, чтобы участники её проверили. Это пятый пункт NEXT STEP установщика. Хранилище включается по желанию: если задан POPOPX_VAULT_KEY (32 сырых байта, хранит оператор), выбранные секреты запечатываются ChaCha20-Poly1305 и лежат как значения vault1: в той же базе, поэтому ключ надо бэкапить отдельно — потеряете его, и эти строки останутся нечитаемыми, а старые строки с открытым текстом продолжат работать.",
    "de": "Eine Datei, gateway.db unter /var/lib/popopx-service-suite, enthält Hauptbuch, jedes paarweise Sitzungsgeheimnis und die privaten Identitätsschlüssel der Kanäle; eine separate keyring-Datei gibt es bewusst nicht, weil eine Rotation zusammen mit dem Rahmen, den sie zustellt, in derselben Transaktion festschreiben muss. Ginge sie verloren, schwiegen alle bestehenden Zero-Knowledge-Kanäle endgültig — keine Rotation ließe sich mehr so signieren, dass Mitglieder sie prüften. Das ist der fünfte NEXT STEP des Installierers. Der Vault ist optional: mit gesetztem POPOPX_VAULT_KEY (32 rohe Bytes, vom Betreiber gehalten) werden ausgewählte Geheimnisse mit ChaCha20-Poly1305 versiegelt und als vault1:-Werte in derselben Datenbank abgelegt, also sichern Sie den Schlüssel getrennt — geht er verloren, bleiben diese Zeilen unlesbar, während ältere Klartextzeilen weiter funktionieren.",
    "fr": "Un seul fichier, gateway.db sous /var/lib/popopx-service-suite, contient le grand-livre, chaque secret de session pairwise et les clés privées d'identité des canaux ; aucun fichier keyring séparé n'existe volontairement, car une rotation doit se committer dans la même transaction que la trame qu'elle livre. Perdez-le et tous les canaux à connaissance nulle se taisent définitivement — plus aucune rotation signée que les membres pourraient vérifier. C'est le cinquième NEXT STEP de l'installeur. Le coffre est optionnel : avec POPOPX_VAULT_KEY défini (32 octets bruts, détenus par l'opérateur), certains secrets sont scellés en ChaCha20-Poly1305 et stockés en valeurs vault1: dans la même base ; sauvegardez donc la clé séparément — perdez-la et ces lignes restent illisibles, tandis que les anciennes lignes en clair continuent de fonctionner.",
    "it": "Un solo file, gateway.db sotto /var/lib/popopx-service-suite, contiene il libro mastro, ogni secret di sessione pairwise e le chiavi private di identità dei canali; un file keyring separato non esiste di proposito, perché una rotazione deve essere committata nella stessa transazione del frame che consegna. Perdendolo, ogni canale a conoscenza zero tace per sempre: nessuna rotazione potrà essere firmata in modo che i membri la verifichino. È il quinto NEXT STEP dell'installatore. La cassaforte è opzionale: con POPOPX_VAULT_KEY impostata (32 byte grezzi, tenuti dall'operatore) i segreti scelti vengono sigillati con ChaCha20-Poly1305 e restano come valori vault1: nello stesso database, quindi salva la chiave a parte — se la perdi quelle righe restano illeggibili, mentre le righe in chiaro più vecchie continuano a funzionare.",
    "nl": "Eén bestand, gateway.db onder /var/lib/popopx-service-suite, bevat het grootboek, elk pairwise-sessiegeheim en de privésleutels van de kanaalidentiteit; een apart keyring-bestand bestaat opzettelijk niet, want een rotatie moet in dezelfde transactie committen als het frame dat ze bezorgt. Verlies het en elk bestaand zero-knowledge-kanaal zwijgt voorgoed: geen enkele rotatie is nog te signeren die leden zullen verifiëren. Dat is de vijfde NEXT STEP van de installateur. De kluis is optioneel: met POPOPX_VAULT_KEY gezet (32 ruwe bytes, door de operator beheerd) worden gekozen geheimen verzegeld met ChaCha20-Poly1305 en bewaard als vault1:-waarden in diezelfde database, dus back-up de sleutel apart — raak je hem kwijt, dan blijven die rijen onleesbaar, terwijl oudere plaintext-rijen blijven werken.",
    "cs": "Jeden soubor, gateway.db pod /var/lib/popopx-service-suite, drží účetní knihu, každý pairwise sekret relace a soukromé klíče identity kanálů; samostatný soubor keyring záměrně neexistuje, protože rotace musí být potvrzena ve stejné transakci jako rám, který doručuje. Ztratíte ho a všechny existující kanály s nulovou znalostí navždy umlknou — žádnou rotaci už členové nepoznají jako platnou. To je pátý NEXT STEP instalátoru. Trezor je volitelný: když je nastaven POPOPX_VAULT_KEY (32 surových bajtů, drží ho operátor), vybrané secrety se zapečetí ChaCha20-Poly1305 a zůstanou jako hodnoty vault1: ve stejné databázi, takže klíč zálohujte zvlášť — ztratíte ho a ty řádky zůstanou nečitelné, zatímco starší řádky v otevřeném textu dál fungují.",
    "zh-Hans": "/var/lib/popopx-service-suite 里那份 gateway.db 装着账本、每人的会话密钥和频道身份私钥，没有单独的 keyring 文件——轮换必须与它送出的那一帧同事务提交。丢了它，已有零知识频道会永久静默：再也签不出成员会验的轮换。这是安装脚本第 5 条 NEXT STEPS 的原话。加密库是可选功能：设置了 POPOPX_VAULT_KEY（32 字节原始密钥，由运维方自己保管）后，选定的密钥会用 ChaCha20-Poly1305 封装、以 vault1: 形式存进同一份数据库，所以这个密钥要单独备份——丢了它，这些行就再也读不出来，而更早的明文行仍照常工作。",
    "zh-Hant": "/var/lib/popopx-service-suite 裡那份 gateway.db 裝著帳本、每個人的工作階段金鑰與頻道身分私密金鑰，沒有單獨的 keyring 檔——輪換必須與它送出的那一幀同事務提交。丟了它，既有零知識頻道會永久靜默：再也簽不出成員會驗的輪換。這是安裝腳本第 5 條 NEXT STEPS 的原話。加密庫是選用功能：設定了 POPOPX_VAULT_KEY（32 位元組原始金鑰，由維運方自己保管）後，選定的密鑰會用 ChaCha20-Poly1305 封裝、以 vault1: 形式存進同一份資料庫，所以這個金鑰要單獨備份——丟了它，這些列就再也讀不出來，而更早的明文列仍照常運作。",
    "es": "Un solo archivo, gateway.db bajo /var/lib/popopx-service-suite, guarda el libro mayor, cada secreto de sesión pairwise y las claves privadas de identidad del canal; no hay archivo keyring aparte de forma deliberada, porque un giro debe comitarse en la misma transacción que la trama que entrega. Si se pierde, todos los canales de conocimiento cero callan para siempre: ningún giro podrá firmarse de modo que los miembros lo verifiquen. Es el quinto NEXT STEP del instalador. La caja fuerte es opcional: con POPOPX_VAULT_KEY definida (32 bytes crudos, en manos del operador) los secretos elegidos se sellan con ChaCha20-Poly1305 y quedan como valores vault1: en esa misma base, así que respalde la clave aparte: si se pierde, esas filas quedan ilegibles, mientras las filas antiguas en claro siguen funcionando.",
    "pl": "Jeden plik, gateway.db pod /var/lib/popopx-service-suite, przechowuje księgę główną, każdy parowy sekret sesji i klucze prywatne tożsamości kanału; osobnego pliku keyring celowo nie ma, bo rotacja musi zostać zatwierdzona w tej samej transakcji co ramka, którą dostarcza. Po jego utracie każdy istniejący kanał zero-knowledge milknie na zawsze — żadna rotacja nie zostanie podpisana tak, by członkowie ją zweryfikowali. To piąty punkt NEXT STEP instalatora. Sejf jest opcjonalny: po ustawieniu POPOPX_VAULT_KEY (32 surowe bajty, trzymane przez operatora) wybrane sekrety są pieczętowane ChaCha20-Poly1305 i leżą jako wartości vault1: w tej samej bazie, więc klucz należy zabezpieczyć osobno — po jego utracie te wiersze pozostaną nieczytelne, a starsze wiersze z jawnym tekstem nadal działają.",
    "ja": "gateway.db という一個のファイル（/var/lib/popopx-service-suite の中）が台帳・ pairwise のセッション鍵・チャンネル識別子の秘密鍵をすべて保持しています。あえて keyring という別のファイルはありません。ローテーションは、自分が配信するフレームと同じトランザクションでコミットしなければならないからです。これを失った瞬間、既存のゼロ知識チャンネルは二度と黙ったままになります。メンバーが検証できるローテーションはもう署名できません。インストーラーの5番目の NEXT STEP に書かれているのも、このことです。ボールトはオプトインです。POPOPX_VAULT_KEY（32 バイトの生データ、運用者が保持）を設定すると、選ばれた秘密は ChaCha20-Poly1305 で封緘され vault1: 値として同じデータベースに保存されます。したがって鍵は別にバックアップしてください。失うとそれらの行は読めなくなり、以前の平文の行はそのまま動きます。",
    "th": "ไฟล์เดียวคือ gateway.db ภายใต้ /var/lib/popopx-service-suite ซึ่งเก็บทั้งบัญชีแยกประเภท ค่าความลับ เซสชันแบบ pairwise ของทุกคู่สาย และคีย์ส่วนตัวของตัวระบุช่อง ไม่มีไฟล์ keyring แยกต่างหากโดยเจตนา เพราะการหมุนเวียน คีย์ต้อง commit ไปในทรานแซกชันเดียวกับเฟรมที่มันส่ง ถ้าไฟล์นี้หายไป ช่องแบบ zero-knowledge ทั้งหมดจะเงียบถาวร — จะไม่ มีการหมุนเวียนคีย์ไหนที่สมาชิกตรวจสอบผ่านอีก และนี่คือข้อความข้อที่ 5 ใน NEXT STEPS ของตัวติดตั้ง vault เป็นแบบเลือกใช้: ถ้าตั้ง POPOPX_VAULT_KEY (ไบต์ดิบ 32 ไบต์ ผู้ปฏิบัติงานถือเอง) ความลับที่เลือกจะถูกปิดผนึกด้วย ChaCha20-Poly1305 แล้วเก็บเป็นค่า vault1: ในฐานข้อมูลเดียวกัน ดังนั้นต้องสำรองคีย์แยกไว้ — ถ้าคีย์หาย แถวเหล่านั้นจะอ่านไม่ได้ ส่วนแถวเก่าที่เป็นข้อความธรรมดายังใช้งานได้",
    "fi": "Yksi tiedosto, gateway.db polun /var/lib/popopx-service-suite alla, pitää sisällään pääkirjan, jokaisen pairwise-istunnon salaisuudet ja kanavien identiteetin yksityisavaimet; erillistä keyring-tiedostoa ei ole tietoisesti, koska kierröksen on committava samassa transaktiossa sen toimittaman kehyksen kanssa. Jos se katoaa, olemassa olevat nollatietokanavat vaipuvat ijoiseksi hiljaisuudeksi — uutta kierröstä ei enää voida allekirjoittaa siten, että jäsenet hyväksyisivät sen. Tämä on asennusohjelman viides NEXT STEP. Holvi on valinnainen: kun POPOPX_VAULT_KEY on asetettu (32 raakaa tavua, operaattorin hallussa), valitut salaisuudet sinetöidään ChaCha20-Poly1305:llä ja säilytetään vault1:-arvoina samassa tietokannassa, joten varmuuskopioi avain erikseen — jos se katoaa, ne rivit jäävät lukukelvottomiksi, kun taas vanhemmat selkokieliset rivit toimivat edelleen.",
    "uk": "Один файл, gateway.db у /var/lib/popopx-service-suite, зберігає реєстр, кожну пару session secret і приватні ключі ідентичності каналу; окремого файла keyring тут немає в навмисно, бо ротація мусить бути зафіксована у тій самій транзакції, що й кадр, який вона доставляє. Втратите його — і всі наявні канали з нульовим розголошенням замовкнуть назавжди: жодну ротацію не вдасться підписати так, щоб учасники її перевірили. Це п'ятий пункт NEXT STEP інсталятора. Сховище вмикається за бажанням: якщо задано POPOPX_VAULT_KEY (32 сирих байти, зберігає оператор), вибрані секрети запечатуються ChaCha20-Poly1305 і лежать як значення vault1: у тій самій базі, тож ключ треба бекапити окремо — втратите його, і ці рядки стануть нечитабельними, а старіші рядки з відкритим текстом працюватимуть далі.",
    "bg": "Един файл, gateway.db под /var/lib/popopx-service-suite, пази главната книга, всяка двойна сесионна тайна и частните ключове за самоличността на каналите; отделен keyring файл умишлено няма, защото ротацията трябва да се фиксира в същата транзакция като кадръ, който доставя. Ако го загубите, всички съществуващи нулево-информационни канали замлъкват завинаги — никоя ротация не може да се подпише така, че членовете да я проверят. Това е петата NEXT STEP стъпка на инсталатора. Хранилището е по избор: при зададен POPOPX_VAULT_KEY (32 сурови байта, държани от оператора) избраните тайни се запечатват с ChaCha20-Poly1305 и стоят като стойности vault1: в същата база, затова ключът се архивира отделно — загубите ли го, тези редове остават нечетими, докато по-старите редове с открит текст продължават да работят.",
    "tr": "Tek bir dosya, /var/lib/popopx-service-suite altındaki gateway.db, defteri, her eşleşmeli oturum sırrını ve kanal kimliğinin özel anahtarlarını barındırır; bilinçli olarak ayrı bir keyring dosyası yoktur, çünkü bir rotasyon, teslim ettiği kare ile aynı transaction içinde commit edilmelidir. Onu kaybederseniz mevcut tüm sıfır bilgi kanalları kalıcı olarak susar — üyelerin doğrulayacağı hiçbir rotasyon imzalanamaz. Kurulum betiğinin beşinci NEXT STEP maddesi tam olarak bunu söylüyor. Kasa isteğe bağlıdır: POPOPX_VAULT_KEY ayarlıysa (32 ham bayt, operatörde saklanır) seçilen sırlar ChaCha20-Poly1305 ile mühürlenir ve aynı veritabanında vault1: değerleri olarak durur, bu yüzden anahtarı ayrıca yedekleyin — kaybederseniz o satırlar okunamaz kalır, eski düz metin satırları ise çalışmaya devam eder.",
    "hu": "Egyetlen fájl, a /var/lib/popopx-service-suite alatti gateway.db tartalmazza a főkönyvet, minden páros munkamenet-titkot és a csatornák azonosságának privát kulcsait; tudatosan nincs külön keyring fájl, mert egy rotációnak ugyanabban a tranzakcióban kell rögzülnie, mint a keretnek, amit kiszállít. Ha elveszti, minden meglévő nullaismereti csatorna végleg elhallgat — többé nem lehet olyan rotációt aláírni, amelyet a tagok elfogadnak. Ez a telepítő ötödik NEXT STEP pontja. A széf opcionális: ha a POPOPX_VAULT_KEY be van állítva (32 nyers bájt, az üzemeltetőnél), a kiválasztott titkok ChaCha20-Poly1305-tel pecsételődnek és vault1: értékként ugyanabban az adatbázisban maradnak, ezért a kulcsot külön mentse — ha elveszik, azok a sorok olvashatatlanok maradnak, a régebbi nyílt szöveges sorok viszont tovább működnek.",
  } satisfies L,

  /* macOS — production: install_macos.sh (launchd) */
  mProdHeading: {
    en: "Production install: sudo ./install_macos.sh",
    "ru": "Продакшен-установка: sudo ./install_macos.sh",
    "de": "Produktionsinstallation: sudo ./install_macos.sh",
    "fr": "Installation de production : sudo ./install_macos.sh",
    "it": "Installazione di produzione: sudo ./install_macos.sh",
    "nl": "Productie-installatie: sudo ./install_macos.sh",
    "cs": "Produkční instalace: sudo ./install_macos.sh",
    "zh-Hans": "生产部署：sudo ./install_macos.sh",
    "zh-Hant": "生產部署：sudo ./install_macos.sh",
    "es": "Instalación en producción: sudo ./install_macos.sh",
    "pl": "Instalacja produkcyjna: sudo ./install_macos.sh",
    "ja": "本番インストール: sudo ./install_macos.sh",
    "th": "ติดตั้งสำหรับงานจริง: sudo ./install_macos.sh",
    "fi": "Tuotantoasennus: sudo ./install_macos.sh",
    "uk": "Продакшн-встановлення: sudo ./install_macos.sh",
    "bg": "Продукционна инсталация: sudo ./install_macos.sh",
    "tr": "Üretim kurulumu: sudo ./install_macos.sh",
    "hu": "Éles telepítés: sudo ./install_macos.sh",
  } satisfies L,
  mProdInstallT: {
    en: "Install the LaunchDaemon",
    "ru": "Установить LaunchDaemon",
    "de": "Den LaunchDaemon installieren",
    "fr": "Installer le LaunchDaemon",
    "it": "Installa il LaunchDaemon",
    "nl": "De LaunchDaemon installeren",
    "cs": "Nainstalovat LaunchDaemon",
    "zh-Hans": "装成 LaunchDaemon",
    "zh-Hant": "裝成 LaunchDaemon",
    "es": "Instalar el LaunchDaemon",
    "pl": "Zainstaluj LaunchDaemon",
    "ja": "LaunchDaemon として登録",
    "th": "ติดตั้งเป็น LaunchDaemon",
    "fi": "Asenna LaunchDaemon",
    "uk": "Встановити LaunchDaemon",
    "bg": "Инсталирай LaunchDaemon",
    "tr": "LaunchDaemon'ı kur",
    "hu": "Telepítsd a LaunchDaemont",
  } satisfies L,
  mProdInstallC: {
    en: "Root is required. The gateway becomes com.popopx.gateway in /Library/LaunchDaemons, running as the role account _popopx (UID 450, shell /usr/bin/false): code and venv under /usr/local/popopx-service-suite, owned root:wheel and not writable by the service itself, the env file at /usr/local/etc/popopx-service-suite/env, state and logs under /usr/local/var. The entrypoint is python -m app.main, so the socket is read from that env file and nowhere else. Python 3.11 is required and the installer calls no package manager: a missing interpreter exits 3 and prints the brew line for your login user to run, unless you point it at one with --python PATH. The suite targets macOS 13+; the script reads sw_vers and warns rather than refusing.",
    "ru": "Нужен root. Шлюз становится службой com.popopx.gateway в /Library/LaunchDaemons под служебной учётной записью _popopx (UID 450, оболочка /usr/bin/false): код и venv в /usr/local/popopx-service-suite, владельцы root:wheel, для самой службы — не на запись; env-файл лежит в /usr/local/etc/popopx-service-suite/env, состояние и логи — в /usr/local/var. Точка входа — python -m app.main, поэтому адрес сокета читается только из этого env-файла. Требуется Python 3.11, а установщик не вызывает ни один менеджер пакетов: без интерпретатора он выходит с кодом 3 и печатает строку brew для вашего обычного пользователя — или укажите путь сами через --python PATH. Набор рассчитан на macOS 13+; скрипт читает sw_vers и предупреждает, но не отказывается ставить.",
    "de": "Root ist Pflicht. Aus dem Gateway wird com.popopx.gateway in /Library/LaunchDaemons, gestartet als Dienstkonto _popopx (UID 450, Shell /usr/bin/false): Code und venv unter /usr/local/popopx-service-suite, root:wheel gehörend und für den Dienst selbst nicht beschreibbar, die Env-Datei in /usr/local/etc/popopx-service-suite/env, Zustand und Logs unter /usr/local/var. Einstiegspunkt ist python -m app.main, der Socket wird also nur aus dieser Env-Datei gelesen und aus sonst nichts. Python 3.11 ist nötig, der Installer ruft keinen Paketmanager auf: fehlt der Interpreter, bricht er mit Exit-Code 3 ab und druckt die brew-Zeile für Ihren Login-Nutzer — oder Sie zeigen mit --python PATH auf ihn. Die Suite zielt auf macOS 13+; das Skript liest sw_vers und warnt, statt abzulehnen.",
    "fr": "Root est obligatoire. La passerelle devient com.popopx.gateway dans /Library/LaunchDaemons, exécutée sous le compte de service _popopx (UID 450, shell /usr/bin/false) : le code et le venv sous /usr/local/popopx-service-suite, appartenant à root:wheel et non inscriptibles par le service lui-même, le fichier env dans /usr/local/etc/popopx-service-suite/env, l'état et les journaux sous /usr/local/var. Le point d'entrée est python -m app.main, l'adresse d'écoute se lit donc dans ce seul fichier env. Python 3.11 est requis et l'installeur n'appelle aucun gestionnaire de paquets : sans interpréteur il sort avec le code 3 et imprime la ligne brew à lancer par votre utilisateur de session, à moins que vous ne l'indiquiez via --python PATH. La suite vise macOS 13+ ; le script lit sw_vers et avertit sans refuser.",
    "it": "Serve root. Il gateway diventa com.popopx.gateway in /Library/LaunchDaemons, eseguito con l'account di servizio _popopx (UID 450, shell /usr/bin/false): codice e venv sotto /usr/local/popopx-service-suite, di proprietà root:wheel e non scrivibili dal servizio stesso, il file env in /usr/local/etc/popopx-service-suite/env, stato e log sotto /usr/local/var. L'entrypoint è python -m app.main, quindi il socket si legge solo da quel file env. Serve Python 3.11 e l'installer non invoca alcun package manager: se l'interprete manca esce con 3 e stampa la riga brew da eseguire come utente normale, a meno che non lo indichiate con --python PATH. La suite punta a macOS 13+; lo script legge sw_vers e avvisa, senza rifiutarsi.",
    "nl": "Root is nodig. De gateway wordt com.popopx.gateway in /Library/LaunchDaemons, draaiend als het dienaccount _popopx (UID 450, shell /usr/bin/false): code en venv onder /usr/local/popopx-service-suite, eigendom root:wheel en voor de dienst zelf niet schrijfbaar, het env-bestand in /usr/local/etc/popopx-service-suite/env, staat en logs onder /usr/local/var. Het startpunt is python -m app.main, dus het socketadres komt uit dat env-bestand en uit niets anders. Python 3.11 is vereist en de installateur roept geen package manager aan: ontbreekt de interpreter, dan sluit hij af met 3 en print hij de brew-regel voor je inloggebruiker, tenzij je met --python PATH wijst. De suite richt zich op macOS 13+; het script leest sw_vers en waarschuwt in plaats van te weigeren.",
    "cs": "Root je podmínka. Brána se stane službou com.popopx.gateway v /Library/LaunchDaemons, běžící pod službovým účtem _popopx (UID 450, shell /usr/bin/false): kód a venv pod /usr/local/popopx-service-suite, vlastník root:wheel a pro službu nezapisovatelné, env soubor je /usr/local/etc/popopx-service-suite/env, stav a logy pod /usr/local/var. Vstup je python -m app.main, takže adresa soklu se čte pouze z toho env souboru. Python 3.11 je povinný a instalátor nevolá žádného správce balíčků: bez interpretu skončí kódem 3 a vytiskne řádek brew pro vašeho přihlášeného uživatele — nebo ho určíte přes --python PATH. Sada cílí na macOS 13+; skript čte sw_vers a raději varuje, než by odmítl.",
    "zh-Hans": "需要 root。网关被登记成 /Library/LaunchDaemons 里的 com.popopx.gateway，以角色账号 _popopx（UID 450，shell 是 /usr/bin/false）运行：代码和 venv 在 /usr/local/popopx-service-suite 下，属主 root:wheel，服务自己写不了；env 文件是 /usr/local/etc/popopx-service-suite/env，状态和日志在 /usr/local/var 下。入口是 python -m app.main，所以监听地址只从这份 env 文件读，别处没有。它要 Python 3.11，而脚本自己不叫包管理器：找不到解释器就退出 3，把 brew 那行打印出来给你的登录用户去跑，除非你用 --python PATH 直接指过去。套件面向 macOS 13+；脚本读了 sw_vers，只警告，不拒绝安装。",
    "zh-Hant": "需要 root。閘道被登記成 /Library/LaunchDaemons 裡的 com.popopx.gateway，以角色帳號 _popopx（UID 450，shell 是 /usr/bin/false）執行：程式碼與 venv 在 /usr/local/popopx-service-suite 下，屬主 root:wheel，服務自己寫不進去；env 檔是 /usr/local/etc/popopx-service-suite/env，狀態與日誌在 /usr/local/var 下。入口是 python -m app.main，所以監聽位址只從這份 env 檔讀。它需要 Python 3.11，腳本自己不會叫包管理器：找不到直譯器就退出 3，把 brew 那行印出來給你的登入帳號去跑，除非你用 --python PATH 直接指過去。套件面向 macOS 13+；腳本讀了 sw_vers，只警告、不拒絕安裝。",
    "es": "Se requiere root. La pasarela pasa a ser com.popopx.gateway en /Library/LaunchDaemons, ejecutándose con la cuenta de servicio _popopx (UID 450, shell /usr/bin/false): código y venv bajo /usr/local/popopx-service-suite, propiedad de root:wheel y sin escritura para el propio servicio, el archivo env en /usr/local/etc/popopx-service-suite/env, estado y registros bajo /usr/local/var. El punto de entrada es python -m app.main, así que el socket se lee solo de ese archivo env. Hace falta Python 3.11 y el instalador no llama a ningún gestor de paquetes: sin intérprete sale con código 3 e imprime la línea de brew para tu usuario de sesión, salvo que la indiques con --python PATH. El conjunto apunta a macOS 13+; el script lee sw_vers y avisa en lugar de negarse.",
    "pl": "Root jest wymagany. Brama staje się usługą com.popopx.gateway w /Library/LaunchDaemons, uruchamianą jako konto serwisowe _popopx (UID 450, powłoka /usr/bin/false): kod i venv pod /usr/local/popopx-service-suite, właściciel root:wheel, dla samej usługi bez zapisu; plik env leży w /usr/local/etc/popopx-service-suite/env, stan i logi pod /usr/local/var. Wejściem jest python -m app.main, więc gniazdo jest odczytywane wyłącznie z tego pliku env. Wymagany jest Python 3.11, a instalator nie woła żadnego menedżera pakietów: brak interpretera kończy się kodem 3 i wydrukowaniem linii brew dla Twojego użytkownika logowania — chyba że wskażesz ścieżkę przez --python PATH. Zestaw celuje w macOS 13+; skrypt czyta sw_vers i ostrzega, zamiast odmawiać.",
    "ja": "root が必要です。ゲートウェイは /Library/LaunchDaemons に com.popopx.gateway として登録され、サービス用アカウント _popopx（UID 450、シェルは /usr/bin/false）で動きます。コードと venv は /usr/local/popopx-service-suite 以下、所有者は root:wheel でサービス自身は書き込めず、env ファイルは /usr/local/etc/popopx-service-suite/env、状態とログは /usr/local/var 以下です。入口は python -m app.main なので、バインド先はこの env ファイルからのみ読まれます。Python 3.11 が必須で、インストーラーはパッケージマネージャーを呼びません。インタープリターが無ければ終了コード 3 で、ログインユーザー向けの brew の行を表示します（--python PATH で明示すればよい）。この一式は macOS 13+ を対象としており、スクリプトは sw_vers を読んで、拒否する代わりに警告します。",
    "th": "ต้องมี root gateway จะกลายเป็น com.popopx.gateway ใน /Library/LaunchDaemons รันด้วยบัญชีบริการ _popopx (UID 450, shell คือ /usr/bin/false): โค้ดกับ venv อยู่ใต้ /usr/local/popopx-service-suite เจ้าของเป็น root:wheel และตัวบริการเขียนไม่ได้เอง ไฟล์ env อยู่ที่ /usr/local/etc/popopx-service-suite/env ส่วนสถานะกับล็อกอยู่ใต้ /usr/local/var จุดเข้าคือ python -m app.main ดังนั้นแอดเดรสของซ็อกเก็ตอ่านจากไฟล์ env นั้นเท่านั้น ต้องการ Python 3.11 และตัวติดตั้งไม่เรียก package manager ใด ๆ: ถ้าไม่พบ interpreter จะออกด้วยโค้ด 3 พร้อมพิมพ์คำสั่ง brew ให้ผู้ใช้ที่ล็อกอินไปรันเอง หรือระบุเองด้วย --python PATH ชุดนี้วางเป้าหมายไว้ที่ macOS 13+ สคริปต์อ่าน sw_vers แล้วแค่เตือน ไม่ได้ปฏิเสธ",
    "fi": "Root vaaditaan. Gatewaysta tulee com.popopx.gateway hakemistossa /Library/LaunchDaemons, ja se pyörii palvelutilillä _popopx (UID 450, shell /usr/bin/false): koodi ja venv polun /usr/local/popopx-service-suite alla, omistaja root:wheel, eikä palvelu itse saa kirjoittaa niihin; env-tiedosto on /usr/local/etc/popopx-service-suite/env, tila ja lokit /usr/local/varin alla. Sisäänkäynti on python -m app.main, joten socket luetaan vain tuosta env-tiedostosta. Python 3.11 vaaditaan, eikä asennusohjelma kutsu pakettienhallintaa: puuttuva tulkki poistuu koodilla 3 ja tulostaa brew-komennon kirjautuneelle käyttäjälle, ellei polkua anna muodossa --python PATH. Tämä paketti tähtää macOS 13+:een; skripti lukee sw_versin ja varoittaa kieltäytymisen sijaan.",
    "uk": "Потрібен root. Шлюз стає службою com.popopx.gateway у /Library/LaunchDaemons під службовим обліковим записом _popopx (UID 450, оболонка /usr/bin/false): код і venv у /usr/local/popopx-service-suite, власник root:wheel, для самої служби — без запису; env-файл лежить у /usr/local/etc/popopx-service-suite/env, стан і логи — у /usr/local/var. Точка входу — python -m app.main, тому сокет читається лише з цього env-файла. Потрібен Python 3.11, а інсталятор не викликає жодного менеджера пакунків: без інтерпретатора вихід із кодом 3 і друк рядка brew для вашого звичайного користувача — або вкажіть шлях через --python PATH. Набор орієнтований на macOS 13+; скрипт читає sw_vers і попереджає, а не відмовляє.",
    "bg": "Нужен е root. Шлюзът става услугата com.popopx.gateway в /Library/LaunchDaemons, стартирана със служебния акаунт _popopx (UID 450, shell /usr/bin/false): кодът и venv са под /usr/local/popopx-service-suite, собственик root:wheel и незаписваеми за самата услуга; env файлът е /usr/local/etc/popopx-service-suite/env, а състоянието и логовете са под /usr/local/var. Входът е python -m app.main, затова сокетът се чете единствено от този env файл. Изисква се Python 3.11, а инсталаторът не вика мениджър на пакети: без интерпретатор излиза с код 3 и печата реда brew за вашия потребител — освен ако не го посочите с --python PATH. Комплектът е за macOS 13+; скриптът чете sw_vers и предупреждава, вместо да отказва.",
    "tr": "Root şart. Ağ geçidi /Library/LaunchDaemons içinde com.popopx.gateway hâline gelir ve _popopx hizmet hesabıyla çalışır (UID 450, kabuk /usr/bin/false): kod ve venv /usr/local/popopx-service-suite altında, sahip root:wheel ve hizmetin kendisi buralara yazamaz; env dosyası /usr/local/etc/popopx-service-suite/env, durum ve günlükler /usr/local/var altında. Girdi noktası python -m app.main, dolayısıyla soket yalnızca şu env dosyasından okunur. Python 3.11 gerekir ve kurulum programı hiçbir paket yöneticisi çağırmaz: yorumlayıcı yoksa 3 koduyla çıkar ve oturum kullanıcınız için brew satırını yazdırır — --python PATH ile yolu siz göstermediyseniz. Takım macOS 13+ hedefliyor; betik sw_vers okur ve reddetmek yerine uyarır.",
    "hu": "Root szükséges. Az átjáróból lesz a com.popopx.gateway a /Library/LaunchDaemons alatt, a _popopx szolgáltatásfiókkal futtatva (UID 450, shell /usr/bin/false): a kód és a venv a /usr/local/popopx-service-suite alatt van, root:wheel tulajdonnal, és a szolgáltatás maga nem írhatja; az env fájl a /usr/local/etc/popopx-service-suite/env, az állapot és a naplók a /usr/local/var alatt. A belépési pont python -m app.main, úgyhogy a foglalás csak ebből az env fájlból jön. Python 3.11 kell, és a telepítő nem hív csomagkezelőt: ha nincs értelmező, 3-as kilépéssel kiírja a brew sort a bejelentkezett felhasználónak — hacsak nem a --python PATH jelöli meg. A csomag macOS 13+-ra céloz; a szkript beolvassa a sw_vers-t, és nem tagadja meg, csak figyelmeztet.",
  } satisfies L,

  mProdCheckT: {
    en: "Look first, write nothing",
    "ru": "Сначала посмотреть, ничего не записать",
    "de": "Erst schauen, nichts schreiben",
    "fr": "Regarder d'abord, ne rien écrire",
    "it": "Prima guarda, non scrive nulla",
    "nl": "Eerst kijken, niets schrijven",
    "cs": "Nejdřív nahlédnout, nic nezapsat",
    "zh-Hans": "先看，一个字节都不写",
    "zh-Hant": "先看，一個位元組都不寫",
    "es": "Mirar primero, no escribir nada",
    "pl": "Najpierw spójrz, nic nie zapisz",
    "ja": "先に確認、書き込みはゼロ",
    "th": "ดูก่อน ไม่เขียนอะไรเลย",
    "fi": "Katso ensin, älä kirjoita mitään",
    "uk": "Спершу подивитись, нічого не записати",
    "bg": "Първо поглед, нищо не се записва",
    "tr": "Önce bak, hiçbir şey yazma",
    "hu": "Előbb nézzük, ne írjunk semmit",
  } satisfies L,
  mProdCheckC: {
    en: "Neither line needs sudo. --check runs every read-only probe and writes nothing: the macOS version, the interpreter, whether the gateway port is free, the Application Firewall state, which node binary --with-node would pick, and whether an existing env file will be kept (it always is, with a timestamped env.bak.<utc> copy); then it prints the same plan as the real install and exits 1 if anything would block it. --dry-run renders the plist and the env file into a temporary directory and lints the plist with plutil; the system is untouched.",
    "ru": "Ни одна строка не требует sudo. --check прогоняет все только-для-чтения пробы и ничего не пишет: версия macOS, интерпретатор, свободен ли порт шлюза, состояние Application Firewall, какой бинарник узла выберет --with-node и будет ли сохранён существующий env-файл (сохраняется всегда, с копией env.bak.<utc> по метке времени) — после чего печатает тот же план, что и настоящая установка, и выходит с 1, если что-то ей мешает. --dry-run рендерит plist и env во временный каталог и проверяет plist через plutil; система остаётся нетронутой.",
    "de": "Beide Zeilen gehen ohne sudo. --check führt alle schreibgeschützten Sonden aus und schreibt nichts: macOS-Version, Interpreter, ob der Gateway-Port frei ist, der Zustand der Application Firewall, welches Node-Binary --with-node fände, und ob eine vorhandene Env-Datei bleiben würde (sie bleibt immer, mit einer zeitgestempelten Kopie env.bak.<utc>); danach druckt es denselben Plan wie die echte Installation und geht mit 1 raus, wenn etwas sie blockieren würde. --dry-run erzeugt plist und Env-Datei in einem temporären Verzeichnis und prüft die plist mit plutil; das System bleibt unberührt.",
    "fr": "Ces deux lignes n'ont pas besoin de sudo. --check exécute toutes les sondes en lecture seule et n'écrit rien : version de macOS, interpréteur, liberté du port de la passerelle, état de l'Application Firewall, binaire du nœud que --with-node choisirait, et présence ou non d'un fichier env conservé (il l'est toujours, avec une copie horodatée env.bak.<utc>) ; puis il imprime le même plan que l'installation réelle et sort avec 1 si quelque chose la bloquerait. --dry-run rend le plist et le fichier env dans un dossier temporaire et valide le plist avec plutil ; le système reste intact.",
    "it": "Nessuna delle due righe richiede sudo. --check esegue tutte le sonde in sola lettura e non scrive nulla: versione di macOS, interprete, se la porta del gateway è libera, stato dell'Application Firewall, quale binario del nodo sceglierebbe --with-node, e se un file env esistente verrebbe conservato (lo è sempre, con una copia con marca temporale env.bak.<utc>); poi stampa lo stesso piano dell'installazione vera e esce con 1 se qualcosa la bloccherebbe. --dry-run genera il plist e il file env in una cartella temporanea e li valida con plutil; il sistema non viene toccato.",
    "nl": "Geen van beide regels heeft sudo nodig. --check draait alle read-only-probes en schrijft niets: de macOS-versie, de interpreter, of de gateway-poort vrij is, de status van de Application Firewall, welk node-binary --with-node zou kiezen en of een bestaand env-bestand bewaard blijft (dat is altijd zo, met een tijdstempel-kopie env.bak.<utc>); daarna print het hetzelfde plan als de echte installatie en sluit het af met 1 als er iets de installatie zou blokkeren. --dry-run rendert de plist en het env-bestand naar een tijdelijke map en lint de plist met plutil; het systeem blijft onaangeroerd.",
    "cs": "Žádná z těch dvou řádek nepotřebuje root. --check projde všechny read-only sondy a nic nezapíše: verzi macOS, interpret, jestli je port brány volný, stav Application Firewall, který binární soubor uzlu by --with-node zvolil, a jestli existující env soubor zůstane (vždy zůstane, s časově označenou kopií env.bak.<utc>). Pak vytiskne stejný plán jako skutečná instalace a skončí 1, pokud by ji něco blokovalo. --dry-run vygeneruje plist a env do dočasné složky a zkontroluje plist přes plutil; systém zůstane nedotčený.",
    "zh-Hans": "这两条都不需要 sudo。--check 把所有只读探针跑一遍、什么都不写：macOS 版本、解释器、网关端口是否空闲、应用防火墙当前状态、--with-node 会挑中哪个节点二进制、已有的 env 文件会不会被保留（一定保留，另存一份带时间戳的 env.bak.<utc>）；然后打印和真实安装同一张计划表，有东西挡路就退出 1。--dry-run 把 plist 和 env 生成到临时目录，并用 plutil 校验 plist，系统本身一点不动。",
    "zh-Hant": "這兩條都不需要 sudo。--check 把所有唯讀探針跑一遍、什麼都不寫：macOS 版本、直譯器、閘道埠是否空閒、應用防火牆目前狀態、--with-node 會挑中哪個節點二元檔、已存在的 env 檔會不會被保留（一定保留，另存一份帶時間戳的 env.bak.<utc>）；然後列印和真實安裝同一張計畫表，有東西擋路就退出 1。--dry-run 把 plist 和 env 產生到暫存目錄，並用 plutil 驗證 plist，系統本身一點不動。",
    "es": "Ninguna de las dos líneas necesita sudo. --check ejecuta todas las sondas de solo lectura y no escribe nada: la versión de macOS, el intérprete, si el puerto de la pasarela está libre, el estado del Application Firewall, qué binario de nodo elegiría --with-node y si un archivo env existente se conservará (siempre se conserva, con una copia con marca de tiempo env.bak.<utc>); después imprime el mismo plan que la instalación real y sale con 1 si algo lo bloqueara. --dry-run genera el plist y el archivo env en un directorio temporal y valida el plist con plutil; el sistema queda intacto.",
    "pl": "Żadna z tych linii nie wymaga sudo. --check uruchamia wszystkie sondy tylko-do-odczytu i nic nie zapisuje: wersję macOSa, interpreter, czy port bramy jest wolny, stan Application Firewall, który plik binarny węzła wybrałoby --with-node oraz czy istniejący plik env zostanie zachowany (zawsze zostaje, z kopią oznaczoną czasem env.bak.<utc>); potem drukuje ten sam plan co prawdziwa instalacja i kończy się kodem 1, jeśli coś by ją blokowało. --dry-run generuje plist i plik env w katalogu tymczasowym i sprawdza plist przez plutil; system pozostaje nietknięty.",
    "ja": "どちらにも sudo は要りません。--check は読み取り専用の探査だけを全て実行して、何も書きません。macOS のバージョン、インタープリター、ゲートウェイのポートがあいているか、Application Firewall の状態、--with-node がどのノードバイナリを選ぶか、既存の env ファイルが保持されるか（必ず保持され、env.bak.<utc> というタイムスタンプ付きコピーが作られる）。その後に本番のインストールと同じ計画表を表示し、妨げがあれば 1 で終了します。--dry-run は plist と env を一時ディレクトリに生成して plutil で plist を検証し、システムには手を入れません。",
    "th": "สองบรรทัดนี้ไม่ต้องใช้ sudo. --check รันเฉพาะ probe แบบอ่านอย่างเดียวและไม่เขียนอะไรเลย: เวอร์ชัน macOS, interpreter, พอร์ตของ gateway ว่างไหม, สถานะ Application Firewall, โหนดไบนารีที่ --with-node จะเลือก และไฟล์ env เดิมจะถูกเก็บไว้ไหม (เก็บไว้เสมอ พร้อมสำเนา env.bak.<utc> ที่ใส่เวลาไว้) จากนั้นมันพิมพ์แผนเดียวกันกับการติดตั้งจริงและออกด้วยโค้ด 1 ถ้ามีอะไรขัดขวาง ส่วน --dry-run จะเรนเดอร์ plist กับไฟล์ env ลงโฟลเดอร์ชั่วคราวแล้วตรวจ plist ด้วย plutil โดยไม่แตะระบบ",
    "fi": "Kumpikaan rivi ei vaadi root-oikeuksia. --check ajaa kaikki vain-luku-kokeet eikä kirjoita mitään: macOS-versio, tulkki, onko gatewayn portti vapaa, Application Firewall -tila, minkä solmun binäärin --with-node valitsisi ja säilyettäisiinkö olemassa oleva env-tiedosto (säilytetään aina, aikaleimatussa kopiossa env.bak.<utc); sen jälkeen se tulostaa saman suunnitelman kuin oikea asennus ja poistuu koodilla 1, jos jokin estäisi sen. --dry-run luo plistin ja env-tiedoston väliaikaiseen hakemistoon ja tarkistaa plistin plutililla; järjestelmää ei kosketa.",
    "uk": "Жоден з цих рядків не потребує sudo. --check виконує всі придатні-лише-для-читання проби й нічого не пише: версію macOS, інтерпретатор, чи вільний порт шлюза, стан Application Firewall, який бінарник вузла обере --with-node і чи буде збережено наявний env-файл (завжди буде, з копією env.bak.<utc> за часовою міткою); потім друкує той самий план, що й справжня установка, і виходить із 1, якщо щось їй заважало б. --dry-run рендерить plist і env-файл у тимчасовий каталог і перевіряє plist через plutil; система лишається недоторканою.",
    "bg": "Нито един от двата реда не изисква sudo. --check изпълнява всички само-за-четене сонди и не записва нищо: версията на macOS, интерпретаторът, дали портът на шлюза е свободен, състоянието на Application Firewall, кой двоичен файл на възела би избрал --with-node и дали съществуващ env файл ще бъде запазен (винаги се запазва, с копие с времеви маркер env.bak.<utc>); след това печата същия план като истинската инсталация и излиза с 1, ако нещо би я блокирало. --dry-run генерира plist и env файла в временна директория и проверява plist с plutil; системата остава недокосната.",
    "tr": "İki satırın da sudo'ya ihtiyacı yok. --check yalnızca okuma amaçlı tüm yoklamaları çalıştırıp hiçbir şey yazmaz: macOS sürümü, yorumlayıcı, ağ geçidi portu boş mu, Application Firewall durumu, --with-node'un hangi düğüm ikilisini seçeceği ve var olan bir env dosyasının korunup korunmayacağı (her zaman korunur, zaman damgalı bir env.bak.<utc> kopyasıyla); ardından gerçek kurulumla aynı planı yazdırır ve bir şey onu engelleyecekse 1 koduyla çıkar. --dry-run plist ile env dosyasını geçici bir dizine üretir ve plist'i plutil ile denetler; sisteme dokunulmaz.",
    "hu": "Egyik sorhoz sem kell sudo. A --check minden csak olvasható próbát lefuttat és semmit nem ír: macOS-verzió, értelmező, a gateway portja szabad-e, az Application Firewall állása, melyik csomópont-binárist választaná a --with-node, és hogy egy meglévő env fájl megmarad-e (mindig megmarad, egy időbélyeges env.bak.<utc> másolattal); utána ugyanazt a tervet nyomtatja ki, mint a valódi telepítés, és 1-es kilépéssel áll le, ha valami blokkolná. A --dry-run a plistet és az env fájlt egy ideiglenes könyvtárba generálja, és a plutil-lal ellenőrzi a plistet; a rendszert nem éri változás.",
  } satisfies L,
  mProdFlagsT: {
    en: "The flags, and one trap",
    "ru": "Флаги — и одна ловушка",
    "de": "Die Flags und eine Falle",
    "fr": "Les options, et un piège",
    "it": "I flag e una trappola",
    "nl": "De vlaggen, en een val",
    "cs": "Přepínače a jedna past",
    "zh-Hans": "开关，还有一个坑",
    "zh-Hant": "開關，還有一個坑",
    "es": "Las opciones y una trampa",
    "pl": "Flagi i jedna pułapka",
    "ja": "フラグと、1つの落とし穴",
    "th": "flags และกับดักหนึ่งข้อ",
    "fi": "Liput ja yksi ansa",
    "uk": "Прапорці — і одна пастка",
    "bg": "Флаговете и един капан",
    "tr": "Bayraklar ve bir tuzak",
    "hu": "A kapcsolók és egy csapda",
  } satisfies L,
  mProdFlagsC: {
    en: "Every value flag also accepts the --flag=VALUE spelling. --lan switches the bind from the default 127.0.0.1 to 0.0.0.0, and when you use it the installer warns that this gateway trusts X-Forwarded-* from any peer, so whoever can reach the port can impersonate any client. --with-node adds a second LaunchDaemon, com.popopx.node, running as _popopx-node (UID 451); if no popopx-chat binary is found that run exits 4, and --node-bin PATH with --node-port N are the overrides. --public-base-url rewrites POPOPX_PUBLIC_BASE_URL, which has to be the exact https origin the phone loads, because the launcher signs the URL it is about to open. The trap the script states out loud: an existing env file wins, so a re-run with --port does not move a service whose port is already written in that file.",
    "ru": "Любой флаг со значением понимает и форму --flag=VALUE. --lan переключает привязку с типового 127.0.0.1 на 0.0.0.0, и тогда установщик предупреждает: этот шлюз доверяет X-Forwarded-* от любого пира, поэтому всякий, кто достигает порта, может выдать себя за любого клиента. --with-node добавляет второй LaunchDaemon, com.popopx.node под учётной записью _popopx-node (UID 451); если бинарник popopx-chat не найден, запуск завершается кодом 4, а переопределяют его --node-bin PATH и --node-port N. --public-base-url переписывает POPOPX_PUBLIC_BASE_URL — это должен быть ровно тот https-источник, который загружает телефон, поскольку лаунчер подписывает URL, который собирается открыть. Ловушка, которую скрипт проговаривает вслух: существующий env-файл важнее, поэтому повторный запуск с --port не сдвинет службу, порт которой уже записан в этом файле.",
    "de": "Jedes Flag mit Wert akzeptiert auch die Schreibweise --flag=VALUE. --lan stellt die Bindung vom Standard 127.0.0.1 auf 0.0.0.0 um, und dann warnt der Installer, dass dieses Gateway X-Forwarded-* von jedem Gegenüber vertraut — wer den Port erreicht, kann sich also als jeder Client ausgeben. --with-node ergänzt einen zweiten LaunchDaemon, com.popopx.node, laufend als _popopx-node (UID 451); findet er kein popopx-chat-Binary, bricht dieser Lauf mit 4 ab, --node-bin PATH und --node-port N sind die Überschreiber. --public-base-url schreibt POPOPX_PUBLIC_BASE_URL, und das muss exakt der https-Origin sein, den das Telefon lädt, weil der Launcher die URL signiert, die er gleich öffnet. Die Falle, die das Skript laut benennt: Eine vorhandene Env-Datei gewinnt, ein erneuter Lauf mit --port verschiebt den Dienst also nicht, wenn seine Portnummer bereits in der Datei steht.",
    "fr": "Toute option à valeur accepte aussi la forme --flag=VALUE. --lan bascule l'écoute du défaut 127.0.0.1 à 0.0.0.0, et dans ce cas l'installeur avertit que cette passerelle accorde sa confiance aux en-têtes X-Forwarded-* de tout pair : quiconque atteint le port peut simuler n'importe quel client. --with-node ajoute un second LaunchDaemon, com.popopx.node, exécuté sous _popopx-node (UID 451) ; si aucun binaire popopx-chat n'est trouvé, l'exécution sort avec 4, et --node-bin PATH avec --node-port N servent d'écrasements. --public-base-url réécrit POPOPX_PUBLIC_BASE_URL, qui doit être exactement l'origine https chargée par le téléphone, car le lanceur signe l'URL qu'il va ouvrir. Le piège que le script énonce lui-même : un fichier env existant gagne, donc relancer avec --port ne déplace pas un service dont le port est déjà écrit dans ce fichier.",
    "it": "Ogni flag con valore accetta anche la forma --flag=VALUE. --lan sposta il bind dal default 127.0.0.1 a 0.0.0.0, e in quel caso l'installer avvisa che questo gateway si fida di X-Forwarded-* da qualsiasi peer: chi raggiunge la porta può spacciarsi per qualsiasi client. --with-node aggiunge un secondo LaunchDaemon, com.popopx.node, eseguito come _popopx-node (UID 451); se non trova un binario popopx-chat l'esecuzione esce con 4, e gli override sono --node-bin PATH e --node-port N. --public-base-url riscrive POPOPX_PUBLIC_BASE_URL, che deve essere esattamente l'origine https che il telefono carica, perché il launcher firma l'URL che sta per aprire. La trappola che lo script dichiara apertamente: un file env esistente vince, quindi un riuso con --port non sposta un servizio la cui porta è già scritta in quel file.",
    "nl": "Elke vlag met een waarde aanvaardt ook de --flag=VALUE-vorm. --lan zet de bind van de default 127.0.0.1 naar 0.0.0.0, en dan waarschuwt de installateur dat deze gateway X-Forwarded-* van elke peer vertrouwt: wie de port bereikt, kan zich als elke client voordoen. --with-node voegt een tweede LaunchDaemon toe, com.popopx.node, draaiend als _popopx-node (UID 451); zonder popopx-chat-binary sluit die run af met 4, en --node-bin PATH met --node-port N zijn de overrides. --public-base-url herschrijft POPOPX_PUBLIC_BASE_URL, dat exact de https-origin moet zijn die de telefoon laadt, want de launcher signeert de URL die hij gaat openen. De val die het script zelf hardop noemt: een bestaand env-bestand wint, dus een herhaalde run met --port verplaatst een dienst waarvan de poort al in dat bestand staat niet.",
    "cs": "Každý přepínač s hodnotou přijímá i tvar --flag=VALUE. --lan přepne bind z výchozího 127.0.0.1 na 0.0.0.0 a instalátor pak varuje, že tahle brána důvěřuje X-Forwarded-* od kohokoli: kdokoli se dostane k portu, může se vydávat za kteréhokoli klienta. --with-node přidá druhý LaunchDaemon, com.popopx.node, běžící pod _popopx-node (UID 451); když se nenajde binárka popopx-chat, běh skončí kódem 4 a přepínače jsou --node-bin PATH a --node-port N. --public-base-url přepíše POPOPX_PUBLIC_BASE_URL, což musí být přesně ten https origin, který telefon načítá — spouštěč podepisuje URL, kterou se chystá otevřít. Past, kterou skript říká nahlas: existující env soubor vyhrává, takže opakovaný běh s --port nepřesune službu, jejíž port už v tom souboru je.",
    "zh-Hans": "带值的开关都接受 --flag=VALUE 这种写法。--lan 把绑定从默认的 127.0.0.1 换成 0.0.0.0，这时脚本自己会警告：这个网关信任任何对端发来的 X-Forwarded-*，能连上端口的人就能把自己说成任意客户端。--with-node 再加第二个 LaunchDaemon com.popopx.node，以 _popopx-node（UID 451）运行；找不到 popopx-chat 二进制时这一次安装退出 4，可用 --node-bin PATH 和 --node-port N 覆盖。--public-base-url 改写 POPOPX_PUBLIC_BASE_URL，它必须正是手机要加载的那个 https 来源，因为启动器会给它即将打开的 URL 签名。脚本自己点出的那个坑：已有的 env 文件优先，所以重跑时加 --port 挪不动端口已经写在那份文件里的服务。",
    "zh-Hant": "帶值的開關都接受 --flag=VALUE 這種寫法。--lan 把綁定從預設的 127.0.0.1 換成 0.0.0.0，這時腳本自己會警告：這個閘道信任任何對端傳來的 X-Forwarded-*，能連上埠的人就能把自己說成任意客戶端。--with-node 再加第二個 LaunchDaemon com.popopx.node，以 _popopx-node（UID 451）執行；找不到 popopx-chat 二元檔時這次安裝退出 4，可用 --node-bin PATH 與 --node-port N 覆寫。--public-base-url 改寫 POPOPX_PUBLIC_BASE_URL，它必須正是手機要載入的那個 https 來源，因為啟動器會為它即將開啟的 URL 簽名。腳本自己點出那個坑：既有的 env 檔優先，所以重跑時加 --port 挪不動埠已經寫在那份檔裡的服務。",
    "es": "Cada opción con valor acepta también la forma --flag=VALUE. --lan cambia el enlace del valor por defecto 127.0.0.1 a 0.0.0.0, y entonces el instalador advierte que esta pasarela confía en X-Forwarded-* de cualquier par: quien alcance el puerto puede suplantar a cualquier cliente. --with-node añade un segundo LaunchDaemon, com.popopx.node, que se ejecuta como _popopx-node (UID 451); si no encuentra un binario popopx-chat esa ejecución sale con 4, y las anulaciones son --node-bin PATH y --node-port N. --public-base-url reescribe POPOPX_PUBLIC_BASE_URL, que debe ser exactamente el origen https que carga el teléfono, porque el lanzador firma la URL que va a abrir. La trampa que el script enuncia en voz alta: un archivo env existente gana, así que repetir la ejecución con --port no mueve un servicio cuyo puerto ya está escrito en ese archivo.",
    "pl": "Każda flaga z wartością przyjmuje też postać --flag=VALUE. --lan przełącza wiązanie z domyślnego 127.0.0.1 na 0.0.0.0 i wtedy instalator ostrzega, że ta brama ufa X-Forwarded-* od każdego nadawcy: kto dosięga portu, może podszyć się pod dowolnego klienta. --with-node dodaje drugi LaunchDaemon, com.popopx.node, uruchamiany jako _popopx-node (UID 451); jeśli nie znajdzie pliku popopx-chat, takie uruchomienie kończy się kodem 4, a nadpisania to --node-bin PATH i --node-port N. --public-base-url przepisuje POPOPX_PUBLIC_BASE_URL, który musi być dokładnie tym początkiem https, który wczytuje telefon — uruchamiacz podpisuje adres URL, który zamierza otworzyć. Pułapka, którą skrypt wypowiada wprost: istniejący plik env wygrywa, więc powtórne uruchomienie z --port nie przeniesie usługi, której port jest już w tym pliku.",
    "ja": "値を取るフラグはどれも --flag=VALUE という書き方も受け付けます。--lan はバインドを既定の 127.0.0.1 から 0.0.0.0 に切り替え、その場合インストーラーは、このゲートウェイがどの対抗者からの X-Forwarded-* も信じることを警告します。ポートに届ける人は誰でも、任意のクライアントを装えます。--with-node は 2 つ目の LaunchDaemon com.popopx.node を追加し、_popopx-node（UID 451）で動かします。popopx-chat バイナリが見つからなければ 4 で終了し、上書き用は --node-bin PATH と --node-port N です。--public-base-url は POPOPX_PUBLIC_BASE_URL を書き換えますが、これはスマートフォンが読み込む https オリジンと完全一致していなければなりません。起動ツールは開こうとする URL に署名するからです。スクリプト自身が口に出す罠はこれです。既存の env ファイルが優先されるため、そのファイルにポートが書かれている限り、--port を付けて再実行してもサービスは動きません。",
    "th": "flags ทุกตัวที่รับค่าเขียนแบบ --flag=VALUE ก็ได้ --lan เปลี่ยนการ bind จากค่าเริ่มต้น 127.0.0.1 ไปเป็น 0.0.0.0 และเมื่อใช้ flag นี้ ตัวติดตั้งจะเตือนเองว่า gateway ตัวนี้เชื่อ X-Forwarded-* จากทุกฝ่าย ใครที่เข้าถึงพอร์ตได้จึงปลอมเป็น client คนไหนก็ได้ --with-node เพิ่ม LaunchDaemon ตัวที่สองชื่อ com.popopx.node รันด้วย _popopx-node (UID 451) ถ้าหาไบนารี popopx-chat ไม่เจอ การรันนั้นออกด้วยโค้ด 4 และที่เขียนทับได้คือ --node-bin PATH กับ --node-port N --public-base-url เขียน POPOPX_PUBLIC_BASE_URL ใหม่ ซึ่งต้องเป็น https origin เดียวกับที่มือถือโหลดจริง เพราะตัวเปิดแอปจะเซ็นลายน้ำกับ URL ที่กำลังจะเปิด กับดักที่สคริปต์พูดออกมาดัง ๆ คือ ไฟล์ env ที่มีอยู่แล้วชนะเสมอ ดังนั้นรันซ้ำพร้อม --port ก็ไม่ขยับบริการที่พอร์ตถูกเขียนไว้ในไฟล์นั้น",
    "fi": "Arvoa ottava lippu hyväksyy myös muodon --flag=VALUE. --lan vaihtaa sidoksen oletuksena olevasta 127.0.0.1:stä 0.0.0.0:aan, ja tällöin asennusohjelma varoittaa, että tämä gateway luottaa X-Forwarded-*:hin keneltä tahansa vastapuolelta: portin tavoittaja voi esittää kenen tahansa klientin. --with-node lisää toisen LaunchDaemonin, com.popopx.node, joka ajetaan käyttäjänä _popopx-node (UID 451); jos popopx-chat-binääriä ei löydy, ajo päättyy koodiin 4, ja ohitukset ovat --node-bin PATH sekä --node-port N. --public-base-url kirjoittaa POPOPX_PUBLIC_BASE_URL:n, jonka on oltava täsmälleen se https-alkuperä, jonka puhelin lataa, sillä käynnistäjä allekirjoittaa juuri avattavan URL-osoitteen. Yksi ansa, jonka skripti sanoo ääneen: olemassa oleva env-tiedosto voittaa, joten uudelleenajo parametrilla --port ei siirrä palvelua, jonka portti on jo kirjoitettu tuohon tiedostoon.",
    "uk": "Будь-який прапорець зі значенням приймає й форму --flag=VALUE. --lan перемикає прив'язку з типового 127.0.0.1 на 0.0.0.0, і тоді інсталятор попереджає: цей шлюз довіряє X-Forwarded-* від будь-якого піра, тож той, хто дістає до порту, може видати себе за будь-якого клієнта. --with-node додає другий LaunchDaemon, com.popopx.node, під обліковим записом _popopx-node (UID 451); якщо бінарника popopx-chat не знайдено, запуск завершується кодом 4, а перевизначення — --node-bin PATH та --node-port N. --public-base-url переписує POPOPX_PUBLIC_BASE_URL — це має бути рівно той https-походження, який завантажує телефон, бо запускач підписує URL, який збирається відкрити. Пастку скрипт озвучує сам: наявний env-файл важливіший, тому повторний запуск із --port не зсуне службу, порт якої вже записаний у цьому файлі.",
    "bg": "Всеки флаг със стойност приема и формата --flag=VALUE. --lan превключва обвързването от подразбиращото се 127.0.0.1 на 0.0.0.0, и тогава инсталаторът предупреждава, че този шлюз има доверие на X-Forwarded-* от всеки партньор: който достигне порта, може да се представи за когото и да е клиент. --with-node добавя втори LaunchDaemon, com.popopx.node, работещ под _popopx-node (UID 451); ако не намери двоичния файл popopx-chat, изпълнението излиза с код 4, а замяната е --node-bin PATH и --node-port N. --public-base-url презаписва POPOPX_PUBLIC_BASE_URL, който трябва да е точният https произход, който телефонът зарежда — стартерът подписва URL-а, който предстои да отвори. Капанът, който скриптът изрича на глас: съществуващ env файл печели, затова повторно пускане с --port не мести услуга, чийто порт вече е записан в този файл.",
    "tr": "Değer alan her bayrak --flag=VALUE yazımını da kabul eder. --lan bağlamayı varsayılan 127.0.0.1'den 0.0.0.0'a çevirir ve kullanıldığında kurulum programı uyarır: bu ağ geçidi her eşten gelen X-Forwarded-*'e güvenir, yani porta ulaşan herkes herhangi bir istemci gibi görünebilir. --with-node ikinci bir LaunchDaemon ekler, com.popopx.node, _popopx-node (UID 451) olarak çalışır; popopx-chat ikilisi bulunamazsa bu çalıştırma 4 koduyla çıkar ve geçersiz kılmalar --node-bin PATH ile --node-port N'dir. --public-base-url, POPOPX_PUBLIC_BASE_URL değerini yeniden yazar; telefonun yüklediği https köküyle birebir aynı olmalıdır, çünkü başlatıcı açacağı URL'yi imzalar. Betiğin yüksek sesle söylediği tuzak: var olan bir env dosyası kazanır, bu yüzden --port ile tekrar çalıştırmak, portu zaten o dosyada yazılı olan bir hizmeti taşımaz.",
    "hu": "Minden értékű kapcsoló elfogadja a --flag=VALUE alakot is. A --lan az alapértelmezett 127.0.0.1 kötésről 0.0.0.0-ra vált, és ekkor a telepítő figyelmeztet: ez az átjáró megbízik bármelyik féltől érkező X-Forwarded-* fejlécekben, tehát aki eléri a portot, bárkinek kiadhatja magát. A --with-node egy második LaunchDaemont ad hozzá, com.popopx.node, _popopx-node (UID 451) alatt futtatva; ha nem talál popopx-chat binárist, a futás 4-es kóddal lép ki, a felülírások a --node-bin PATH és a --node-port N. A --public-base-url felülírja a POPOPX_PUBLIC_BASE_URL-t, amelynek pontosan annak az https-eredetnek kell lennie, amit a telefon betölt, mert az indító az által megnyitni kívánt URL-t írja alá. A csapda, amit a szkript hangosan ki is mond: egy meglévő env fájl nyer, ezért a --port-tal való újrafuttatás nem mozdítja el azt a szolgáltatást, amelynek portja már benne van a fájlban.",
  } satisfies L,

  mProdCtlT: {
    en: "Status, restart, stop",
    "ru": "Состояние, перезапуск, остановка",
    "de": "Status, Neustart, Stopp",
    "fr": "État, redémarrage, arrêt",
    "it": "Stato, riavvio, arresto",
    "nl": "Status, herstart, stop",
    "cs": "Stav, restart, zastavení",
    "zh-Hans": "状态、重启、停止",
    "zh-Hant": "狀態、重啟、停止",
    "es": "Estado, reinicio, parada",
    "pl": "Stan, restart, zatrzymanie",
    "ja": "状態・再起動・停止",
    "th": "สถานะ เริ่มใหม่ หยุด",
    "fi": "Tila, uudelleenkäynnistys, pysäytys",
    "uk": "Стан, перезапуск, зупинка",
    "bg": "Състояние, рестарт, спиране",
    "tr": "Durum, yeniden başlatma, durdurma",
    "hu": "Állapot, újraindítás, leállítás",
  } satisfies L,
  mProdCtlC: {
    en: "These are the three lines the installer's own NEXT STEPS section prints. Stopping is launchctl bootout, not launchctl stop, and re-enabling means running install_macos.sh again: the plist is generated, and its header says edits there are overwritten. Crash-restart is KeepAlive with SuccessfulExit false and Crashed true, launchd's spelling of systemd's Restart=on-failure; there is no StartLimitBurst, so launchd retries forever, throttled — which is exactly why the config gate runs before the job is bootstrapped. launchd also has no KillSignal (it only ever sends SIGTERM) and no ProtectSystem, PrivateTmp, NoNewPrivileges or MemoryMax; when you need the exact SIGINT it is one command: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "ru": "Это ровно те три строки, которые печатает раздел NEXT STEPS самого установщика. Останавливать — bootout, а не launchctl stop, а вернуть в работу — значит снова запустить install_macos.sh: plist формируется скриптом, и в его заголовке сказано, что правки в нём перезаписываются. Перезапуск после падения — KeepAlive с SuccessfulExit false и Crashed true, лончдауновская запись systemd-овского Restart=on-failure; StartLimitBurst здесь нет, поэтому launchd повторяет попытки бесконечно, с паузой — именно поэтому проверка конфигурации выполняется до bootstrap задачи. У launchd также нет KillSignal (он шлёт только SIGTERM) и нет ProtectSystem, PrivateTmp, NoNewPrivileges и MemoryMax; если нужен именно SIGINT — это одна команда: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "de": "Das sind genau die drei Zeilen, die der NEXT-STEPS-Abschnitt des Installierers selbst druckt. Gestoppt wird mit launchctl bootout, nicht mit launchctl stop, und wieder aktiviert wird, indem Sie install_macos.sh erneut laufen lassen: Die plist wird erzeugt, und ihr Kopf sagt, dass Änderungen daran überschrieben werden. Crash-Neustart ist KeepAlive mit SuccessfulExit false und Crashed true, die launchd-Schreibweise für Restart=on-failure bei systemd; StartLimitBurst gibt es nicht, also versucht es launchd für immer weiter, gedrosselt — genau deshalb läuft der Konfigurationscheck, bevor der Job überhaupt bootstrappt. launchd hat auch kein KillSignal (es sendet nur SIGTERM) und kein ProtectSystem, PrivateTmp, NoNewPrivileges oder MemoryMax; wenn Sie exakt SIGINT brauchen, ist das ein Befehl: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "fr": "Ce sont exactement les trois lignes qu'imprime la section NEXT STEPS de l'installeur lui-même. L'arrêt se fait par launchctl bootout, pas par launchctl stop, et réactiver consiste à relancer install_macos.sh : le plist est généré, et son en-tête dit que les modifications y sont écrasées. Le redémarrage sur crash, c'est KeepAlive avec SuccessfulExit false et Crashed true, l'écriture launchd du Restart=on-failure de systemd ; il n'y a pas de StartLimitBurst, donc launchd réessaie indéfiniment, en mode bridé — c'est précisément pourquoi le contrôle de configuration passe avant le bootstrap du job. launchd n'a non plus ni KillSignal (il n'envoie que SIGTERM) ni ProtectSystem, PrivateTmp, NoNewPrivileges ni MemoryMax ; si vous avez besoin du SIGINT exact, c'est une commande : sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "it": "Sono esattamente le tre righe che stampa la sezione NEXT STEPS dell'installer stesso. Lo stop si fa con launchctl bootout, non con launchctl stop, e riabilitare significa rieseguire install_macos.sh: il plist è generato, e la sua intestazione dice che le modifiche vengono sovrascritte. Il riavvio dopo un crash è KeepAlive con SuccessfulExit false e Crashed true, la versione launchd di Restart=on-failure di systemd; non esiste StartLimitBurst, quindi launchd riprova per sempre, con intervallo — ed è esattamente per questo che il gate di configurazione gira prima che il job sia bootstrappato. launchd non ha nemmeno KillSignal (manda solo SIGTERM) né ProtectSystem, PrivateTmp, NoNewPrivileges o MemoryMax; se vi serve il SIGINT esatto è un comando: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "nl": "Dit zijn precies de drie regels die de NEXT STEPS-sectie van de installateur zelf print. Stoppen gebeurt met launchctl bootout, niet met launchctl stop, en opnieuw inschakelen betekent install_macos.sh nogmaals runnen: de plist is gegenereerd en zijn kop zegt dat bewerkingen erin worden overschreven. Crash-herstart is KeepAlive met SuccessfulExit false en Crashed true, de launchd-spelling van Restart=on-failure bij systemd; er is geen StartLimitBurst, dus launchd probeert eeuwig verder, afgetemd — precies daarom draait de configuratiepoort vóórdat de job wordt gebootst. launchd heeft ook geen KillSignal (het stuurt enkel SIGTERM) en geen ProtectSystem, PrivateTmp, NoNewPrivileges of MemoryMax; als u het exacte SIGINT nodig heeft, is dat één commando: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "cs": "To jsou přesně ty tři řádky, které tiskne sekce NEXT STEPS samotného instalátoru. Zastavuje se pomocí launchctl bootout, nikoli launchctl stop, a znovu se zapne opětovným spuštěním install_macos.sh: plist se generuje a jeho hlavička říká, že úpravy v něm přepíšete. Restart po pádu je KeepAlive s SuccessfulExit false a Crashed true, launchd-psaní systemd Restart=on-failure; StartLimitBurst tu není, takže launchd zkouší donekonečna, s prodlevou — přesně proto kontrola konfigurace běží před bootstrapem úlohy. launchd taky nemá KillSignal (posílá jen SIGTERM) ani ProtectSystem, PrivateTmp, NoNewPrivileges nebo MemoryMax; když potřebujete přesně SIGINT, je to jeden příkaz: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "zh-Hans": "这三行就是安装脚本自己 NEXT STEPS 段落里打印的那三条。停止用的是 launchctl bootout，不是 launchctl stop；要重新启用，就再跑一次 install_macos.sh——plist 是生成的，它文件头就写着手改会被覆盖。崩溃后重启靠 KeepAlive 里的 SuccessfulExit false 与 Crashed true，这是 launchd 版的 systemd Restart=on-failure；launchd 没有 StartLimitBurst，会按节流间隔无限重试，所以配置门禁必须在 bootstrap 之前跑完。launchd 也没有 KillSignal，只发 SIGTERM，更没有 ProtectSystem、PrivateTmp、NoNewPrivileges 和 MemoryMax；真要用那个精确的 SIGINT，就一条命令 sudo launchctl kill SIGINT system/com.popopx.gateway。",
    "zh-Hant": "這三行就是安裝腳本自己 NEXT STEPS 段落裡列印的那三條。停止用的是 launchctl bootout，不是 launchctl stop；要重新啟用，就再跑一次 install_macos.sh——plist 是產生的，它檔案頭就寫著手改會被覆蓋。崩潰後重啟靠 KeepAlive 裡的 SuccessfulExit false 與 Crashed true，這是 launchd 版的 systemd Restart=on-failure；launchd 沒有 StartLimitBurst，會按節流間隔無限重試，所以設定閘門必須在 bootstrap 之前跑完。launchd 也沒有 KillSignal，只送 SIGTERM，更沒有 ProtectSystem、PrivateTmp、NoNewPrivileges 和 MemoryMax；真要用那個精確的 SIGINT，就一條命令 sudo launchctl kill SIGINT system/com.popopx.gateway。",
    "es": "Son exactamente las tres líneas que imprime la sección NEXT STEPS del propio instalador. Parar es launchctl bootout, no launchctl stop, y volver a habilitar significa ejecutar install_macos.sh otra vez: el plist se genera, y su cabecera dice que las ediciones allí se sobreescriben. El reinicio tras un fallo es KeepAlive con SuccessfulExit false y Crashed true, la forma launchd del Restart=on-failure de systemd; no existe StartLimitBurst, así que launchd reintenta para siempre, con intervalo — precisamente por eso la puerta de configuración corre antes del bootstrap del trabajo. launchd tampoco tiene KillSignal (solo envía SIGTERM) ni ProtectSystem, PrivateTmp, NoNewPrivileges o MemoryMax; si necesita el SIGINT exacto, es un comando: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "pl": "To dokładnie te trzy linie, które drukuje sekcja NEXT STEPS samego instalatora. Zatrzymanie to launchctl bootout, a nie launchctl stop, a ponowne włączenie oznacza uruchomienie install_macos.sh raz jeszcze: plist jest generowany, a jego nagłówek mówi, że zmiany są nadpisywane. Restart po awarii to KeepAlive z SuccessfulExit false i Crashed true, launchdowy zapis systemdowego Restart=on-failure; nie ma tu StartLimitBurst, więc launchd próbuje w nieskończoność, z przerwą — właśnie dlatego kontrola konfiguracji działa przed bootstrapem usługi. launchd nie ma też KillSignal (wysyła wyłącznie SIGTERM) ani ProtectSystem, PrivateTmp, NoNewPrivileges czy MemoryMax; jeśli potrzebujesz dokładnego SIGINT, to jedno polecenie: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "ja": "これはインストーラー自身の NEXT STEPS 節が印字する、まさにあの 3 行です。停止は launchctl bootout であって launchctl stop ではなく、再次有効化するには install_macos.sh をもう一度実行します。plist は生成されるもので、先頭のコメントに「ここを編集しても上書きされる」と書かれています。クラッシュ後の再起動は KeepAlive の SuccessfulExit false と Crashed true で、systemd の Restart=on-failure に相当する launchd の書き方です。StartLimitBurst は無いので launchd は間隔を空けて無限に再試行します——だからこそ設定関門が bootstrap より前に走ります。launchd には KillSignal もありません（送るのは SIGTERM のみ）。ProtectSystem、PrivateTmp、NoNewPrivileges、MemoryMax も無く、正確な SIGINT が必要なら 1 コマンドです: sudo launchctl kill SIGINT system/com.popopx.gateway。",
    "th": "นี่คือสามบรรทัดที่หัวข้อ NEXT STEPS ของตัวติดตั้งพิมพ์ออกมาเอง การหยุดใช้ launchctl bootout ไม่ใช่ launchctl stop และการเปิดใช้ใหม่หมายความว่าต้องรัน install_macos.sh อีกครั้ง ตัว plist ถูกสร้างขึ้นใหม่และหัวไฟล์เขียนไว้ชัดว่าแก้ตรงนี้จะถูกเขียนทับ การเริ่มใหม่หลังล่มคือ KeepAlive ที่มี SuccessfulExit false กับ Crashed true ซึ่งเป็นการสะกดแบบ launchd ของ Restart=on-failure ใน systemd; ไม่มี StartLimitBurst launchd จึงลองซ้ำไปเรื่อย ๆ แบบมีระยะพัก — นั่นเป็นเหตุผลว่าทำไมด่านตรวจค่าตั้งต้องรันก่อน bootstrap job launchd ไม่มี KillSignal เช่นกัน (ส่งแค่ SIGTERM) และไม่มี ProtectSystem, PrivateTmp, NoNewPrivileges หรือ MemoryMax ถ้าต้องใช้ SIGINT แบบนั้นจริง ๆ ก็คือคำสั่งเดียว: sudo launchctl kill SIGINT system/com.popopx.gateway",
    "fi": "Nämä ovat täsmälleen ne kolme riviä, jotka asennusohjelman oma NEXT STEPS -kohta tulostaa. Pysäytys tehdään komennolla launchctl bootout, ei launchctl stopilla, ja uudelleenkäynnistäminen tarkoittaa install_macos.sh:n ajamista uudelleen: plist generoidaan, ja sen otsikko sanoo, että muokkaukset ylikirjoitetaan. Kaatumisen jälkeinen uudelleenkäynnistys on KeepAlive arvoilla SuccessfulExit false ja Crashed true — launchdin kirjoitustapa systemdin Restart=on-failurelle; StartLimitBurstia ei ole, joten launchd yrittää ikuisesti kurissa — juuri siksi konfiguroinnin vartija ajetaan ennen jobin bootstrapia. launchdissa ei ole myöskään KillSignalia (se lähettää vain SIGTERMiä) eikä ProtectSystemiä, PrivateTmp:tä, NoNewPrivilegesiä tai MemoryMaxia; jos tarvitset täsmälleen SIGINTin, se on yksi komento: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "uk": "Це рівно ті три рядки, які друкує розділ NEXT STEPS самого інсталятора. Зупиняють через launchctl bootout, а не launchctl stop, а повертають у роботу повторно запускаючи install_macos.sh: plist генерується, і в його заголовку написано, що правки в ньому перезаписуються. Перезапуск після падіння — KeepAlive із SuccessfulExit false та Crashed true, лончдаунівська форма systemd Restart=on-failure; StartLimitBurst тут немає, тому launchd пробує нескінченно, з паузою — саме тому перевірка конфігурації виконується до bootstrap задачі. У launchd також немає KillSignal (він надсилає лише SIGTERM) і немає ProtectSystem, PrivateTmp, NoNewPrivileges чи MemoryMax; якщо потрібен саме SIGINT — це одна команда: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "bg": "Това са точно трите реда, които разделът NEXT STEPS на инсталатора печата сам. Спирането е launchctl bootout, не launchctl stop, а повторното включване означава да пуснеш install_macos.sh отново: plist-ът се генерира и заглавката му казва, че редакциите в него се презаписват. Рестартът след срив е KeepAlive със SuccessfulExit false и Crashed true, launchd формулировката на systemd Restart=on-failure; няма StartLimitBurst, затова launchd опитва безкрайно, с интервал — точно защото вратата за конфигурация минава преди bootstrap на задачата. launchd също няма KillSignal (изпраща само SIGTERM) и няма ProtectSystem, PrivateTmp, NoNewPrivileges или MemoryMax; ако ви трябва точният SIGINT, това е една команда: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "tr": "Bunlar, kurulum programının kendi NEXT STEPS bölümünün yazdırdığı tam olarak bu üç satır. Durdurma launchctl bootout ile yapılır, launchctl stop ile değil; yeniden etkinleştirmek için install_macos.sh'ı tekrar çalıştırmak gerekir: plist üretilir ve başlığındaki not, burada yapılan düzenlemelerin üzerine yazıldığını söyler. Çökmeden sonra yeniden başlatma, launchd'ın systemd'deki Restart=on-failure karşılığı olan, SuccessfulExit false ve Crashed true içeren KeepAlive'ıdır; StartLimitBurst olmadığı için launchd aralıklarla sonsuza dek denenir — yapılandırma kapısının bootstrap'ten önce çalışmasının nedeni tam olarak bu. launchd'de KillSignal de yoktur (yalnızca SIGTERM gönderir) ve ProtectSystem, PrivateTmp, NoNewPrivileges veya MemoryMax yoktur; tam olarak SIGINT gerekirse tek bir komut: sudo launchctl kill SIGINT system/com.popopx.gateway.",
    "hu": "Ezek pontosan azok a sorok, amelyeket a telepítő saját NEXT STEPS része nyomtat ki. Az leállítás launchctl bootout, nem launchctl stop, és az újbóli engedélyezéshez újra futtatni kell az install_macos.sh-t: a plist generált fájl, és a fejléce kimondja, hogy a benne végzett módosítások felülíródnak. Az összeomlás utáni újraindítás a KeepAlive SuccessfulExit false és Crashed true értékekkel — ez a systemd Restart=on-failure launchd-írásmódja; StartLimitBurst nincs, ezért a launchd az örökkévalóságig próbálkozik ritmussal — éppen ezért fut a konfigurációs kapu a dzsob bootstrapje előtt. A launchdban nincs KillSignal sem (csak SIGTERM-et küld), és ProtectSystem, PrivateTmp, NoNewPrivileges vagy MemoryMax sincs; ha pont az SIGINT kell, az egyetlen parancs: sudo launchctl kill SIGINT system/com.popopx.gateway.",
  } satisfies L,
  mProdUninstallT: {
    en: "Uninstall, and the state it will not delete",
    "ru": "Удаление — и состояние, которое он не трогает",
    "de": "Deinstallation und der Zustand, der bleibt",
    "fr": "Désinstallation et l'état qu'il ne supprime pas",
    "it": "Disinstallazione e lo stato che non cancella",
    "nl": "Verwijderen, en de staat die hij niet wist",
    "cs": "Odinstalace a stav, který nemaže",
    "zh-Hans": "卸载，和它不肯删的状态目录",
    "zh-Hant": "解除安裝，和它不願刪的狀態目錄",
    "es": "Desinstalación y el estado que no borra",
    "pl": "Odinstalowanie i stan, którego nie kasuje",
    "ja": "アンインストールと、消さない状態",
    "th": "ถอนติดตั้ง และสถานะที่ไม่ลบ",
    "fi": "Poisto ja tila, jota ei poisteta",
    "uk": "Видалення — і стан, якого він не чіпає",
    "bg": "Деинсталация и състоянието, което не се изтрива",
    "tr": "Kaldırma ve silmeyeceği durum",
    "hu": "Eltávolítás és az állapot, amit nem töröl",
  } satisfies L,
  mProdUninstallC: {
    en: "--uninstall boots out both services, removes the plists, the code, the config and the log directory, and deletes the role accounts with -keepHome. The state directory /usr/local/var/popopx-service-suite stays: it holds gateway.db — the ledger, every pairwise session secret and the channel identity private keys — and a re-install reuses it. Only --purge-state deletes it, and that is the one action here with no undo: every zero-knowledge channel this deployment created goes silent for good, because no rotation can be signed that its members will verify. The checkout is never touched.",
    "ru": "--uninstall выгружает обе службы, убирает plist-ы, код, конфигурацию и каталог логов, а учётные записи удаляет вместе с -keepHome. Каталог состояния /usr/local/var/popopx-service-suite остаётся: в нём gateway.db — главная книга, каждая pairwise-тайна сессии и приватные ключи идентификации каналов, — и повторная установка использует его снова. Только --purge-state удаляет его, и это единственное действие здесь без возврата: каждый zero-knowledge-канал, созданный этим развёртыванием, навсегда замолкает, потому что никакую ротацию уже нельзя подписать так, чтобы её участники проверили. Ваш checkout не трогается.",
    "de": "--uninstall bootet beide Dienste aus, entfernt die plists, den Code, die Konfiguration und das Log-Verzeichnis und löscht die Konten mit -keepHome. Der Zustandsordner /usr/local/var/popopx-service-suite bleibt: Er enthält gateway.db — das Hauptbuch, jedes pairwise Sitzungsgeheimnis und die privaten Identitätsschlüssel der Kanäle — und eine Neuinstallation nutzt ihn wieder. Nur --purge-state löscht ihn, und das ist der einzige Schritt hier ohne Rückweg: Jeder Zero-Knowledge-Kanal, den diese Installation erzeugt hat, verstummt endgültig, weil keine Rotation mehr signiert werden kann, die seine Mitglieder prüfen würden. Der Checkout wird nie angefasst.",
    "fr": "--uninstall décharge les deux services, retire les plists, le code, la configuration et le dossier de journaux, et supprime les comptes avec -keepHome. Le dossier d'état /usr/local/var/popopx-service-suite reste : il contient gateway.db — le grand livre, chaque secret de session par paires et les clés privées d'identité des canaux — et une réinstallation le réutilise. Seul --purge-state le supprime, et c'est la seule action ici sans retour en arrière : chaque canal zero-knowledge créé par ce déploiement se tait pour toujours, car aucune rotation ne peut plus être signée que ses membres vérifient. Le checkout n'est jamais touché.",
    "it": "--uninstall scarica entrambi i servizi, rimuove i plist, il codice, la configurazione e la cartella dei log, e cancella gli account con -keepHome. La cartella di stato /usr/local/var/popopx-service-suite resta: contiene gateway.db — il mastro, ogni secret di sessione pairwise e le chiavi private di identità dei canali — e una reinstallazione la riusa. Solo --purge-state la cancella, ed è l'unica azione qui senza annullamento: ogni canale zero-knowledge creato da questa installazione ammutolisce per sempre, perché nessuna rotazione potrà più essere firmata in modo che i membri la verifichino. Il checkout non viene mai toccato.",
    "nl": "--uninstall boot beide diensten uit, verwijdert de plists, de code, de config en de logmap, en wist de accounts met -keepHome. De staatmap /usr/local/var/popopx-service-suite blijft: die bevat gateway.db — het grootboek, elk pairwise sessiegeheim en de privésleutels van de kanaalidentiteit — en een herinstallatie gebruikt ze opnieuw. Alleen --purge-state wist haar, en dat is de enige handeling hier zonder ongedaan maken: elk zero-knowledge-kanaal dat deze opzet schiep, zwijgt definitief, want geen enkele rotatie kan nog ondertekend worden die haar leden verifiëren. Je checkout wordt nooit aangeraakt.",
    "cs": "--uninstall odhlásí obě služby, odstraní place listy, kód, konfiguraci a adresář logů a smaže účty s -keepHome. Stavový adresář /usr/local/var/popopx-service-suite zůstává: má v sobě gateway.db — hlavní knihu, každé pairwise tajemství relace a soukromé klíče identity kanálů — a opětovná instalace ho znovu použije. Jen --purge-state ho smaže, a to je tady jediná akce bez návratu: každý zero-knowledge kanál, který tohle nasazení vytvořil, navěky ztichne, protože žádnou rotaci už nepodepíšeš tak, aby ji členové ověřili. Váš checkout zůstává nedotčen.",
    "zh-Hans": "--uninstall 会 bootout 两个服务，删掉 plist、代码、配置和日志目录，并用 -keepHome 删除角色账号。/usr/local/var/popopx-service-suite 这个状态目录留着：里面有 gateway.db——台帐、每一对 pairwise 的会话密钥、频道身份私钥——重装会接着用它。只有 --purge-state 才会删它，而这是这里唯一没有反悔的一条：这次部署建起来的每一个零知识频道都会永久沉默，因为再也签不出成员愿意验证的密钥轮换。你的 checkout 全程不动。",
    "zh-Hant": "--uninstall 會 bootout 兩個服務，刪掉 plist、程式碼、設定和日誌目錄，並用 -keepHome 刪除角色帳號。/usr/local/var/popopx-service-suite 這個狀態目錄留著：裡面有 gateway.db——台帳、每一對 pairwise 的工作階段金鑰、頻道身份私鑰——重裝會接著用它。只有 --purge-state 才會刪它，而這是這裡唯一沒有反悔的一條：這次部署建起來的每一個零知識頻道都會永久沉默，因為再也簽不出成員願意驗證的金鑰輪替。你的 checkout 全程不動。",
    "es": "--uninstall descarga los dos servicios, elimina los plists, el código, la configuración y el directorio de registros, y borra las cuentas con -keepHome. El directorio de estado /usr/local/var/popopx-service-suite se queda: contiene gateway.db —el libro mayor, cada secreto de sesión pairwise y las claves privadas de identidad de los canales— y una reinstalación lo reutiliza. Solo --purge-state lo borra, y es la única acción aquí sin deshacer: cada canal de conocimiento cero que creó este despliegue calla para siempre, porque ninguna rotación podrá firmarse de modo que sus miembros la verifiquen. El checkout nunca se toca.",
    "pl": "--uninstall wyrzuca obie usługi, usuwa pliki plist, kod, konfigurację i katalog logów oraz kasuje konta z -keepHome. Katalog stanu /usr/local/var/popopx-service-suite zostaje: zawiera gateway.db — księgę główną, każdy sekret sesji pairwise i prywatne klucze tożsamości kanałów — a ponowna instalacja go wykorzystuje. Tylko --purge-state go kasuje i to jest tu jedyna czynność bez cofnięcia: każdy kanał zero-knowledge, który ta instalacja utworzyła, milknie na zawsze, bo nie da się już podpisać rotacji, którą jego członkowie zweryfikują. Checkout nigdy nie jest dotykany.",
    "ja": "--uninstall は両方のサービスを bootout し、plist・コード・設定・ログディレクトリを消し、サービスアカウントを -keepHome で削除します。状態ディレクトリ /usr/local/var/popopx-service-suite は残ります。中には gateway.db ——台帳、すべての pairwise セッション秘密、チャンネル識別子の秘密鍵—— が入っていて、再インストールすればそのまま使われます。これを消すのは --purge-state だけで、この中にやり直しの無い操作がそれです。この展開が作ったゼロ知識チャンネルはすべて永久に黙ります。メンバーが検証できる鍵のローテーションを、もう二度と署名できないからです。checkout は一度も触られません。",
    "th": "--uninstall จะ bootout ทั้งสองเซอร์วิส ลบ plist, โค้ด, ค่าตั้ง และโฟลเดอร์ล็อก แล้วลบบัญชีบริการทิ้งด้วย -keepHome โฟลเดอร์สถานะ /usr/local/var/popopx-service-suite จะยังอยู่ เพราะข้างในมี gateway.db — ทั้งบัญชีหลัก, ค่า secret ของเซสชัน pairwise ทุกคู่, และคีย์ส่วนตัวของตัวระบุแชนแนล — และการติดตั้งซ้ำจะใช้มันต่อ มีแค่ --purge-state เท่านั้นที่ลบมัน และนี่เป็นการกระทำเดียวในหน้านี้ที่ย้อนกลับไม่ได้: แชนแนล zero-knowledge ทุกแชนแนลที่การติดตั้งนี้สร้างจะเงียบถาวร เพราะจะไม่มีการ rotate คีย์ใดที่สมาชิกของแชนแนลยอมตรวจสอบอีก checkout ของคุณไม่ถูกแตะเลย",
    "fi": "--uninstall ajaa molemmat palvelut ulos, poistaa plistit, koodin, konfiguraation ja lokihakemiston, ja poistaa palvelutilit -keepHome:lla. Tilahakemisto /usr/local/var/popopx-service-suite jää: sen alla on gateway.db — pääkirja, jokainen pairwise-istunnon salaisuus ja kanavien identiteetin yksityisavaimet — ja uudelleenasennus käyttää sitä uudelleen. Vain --purge-state poistaa sen, ja se on ainoa toiminto tässä, jota ei voi perua: jokaisen tämän asennuksen luoman nollatietokanavan ääni sammuu lopullisesti, koska yhtään kiertoa ei enää voi allekirjoittaa niin, että sen jäsenet tarkastaisivat sen. Checkentiä ei koskaan kosketa.",
    "uk": "--uninstall вивантажує обидві служби, прибирає plist-и, код, конфігурацію й каталог логів, а облікові записи видаляє з -keepHome. Каталог стану /usr/local/var/popopx-service-suite лишається: у ньому gateway.db — головна книга, кожна pairwise-таємниця сесії й приватні ключі ідентичності каналів, — і повторне встановлення використає його знову. Лише --purge-state видаляє його, і це єдина дія тут без можливості повернення: кожен zero-knowledge-канал, створений цим розгортанням, назавжди замовкне, бо жодну ротацію вже неможливо підписати так, щоб її перевірили учасники. Ваш checkout не чіпають.",
    "bg": "--uninstall изхвърля и двете услуги, премахва plist-ите, кода, конфигурацията и директорията с логове и изтрива ролите с -keepHome. Директорията на състоянието /usr/local/var/popopx-service-suite остава: в нея е gateway.db — главната книга, всяка двойкова тайна на сесия и частните ключове за самоличност на каналите — и преинсталация я използва отново. Само --purge-state я изтрива и това е единственото действие тук без връщане: всеки zero-knowledge канал, създаден от това разгръщане, замлъква завинаги, защото никоя ротация вече не може да бъде подписана така, че членовете й да я проверят. Работното копие не се докосва.",
    "tr": "--uninstall iki hizmeti de bootout eder, plist'leri, kodu, yapılandırmayı ve günlük dizinini kaldırır, hizmet hesaplarını -keepHome ile siler. Durum dizini /usr/local/var/popopx-service-suite yerinde kalır: içinde gateway.db var — defterin kendisi, her pairwise oturum sırrı ve kanal kimliğinin özel anahtarları — ve yeniden kurulum onu tekrar kullanır. Yalnızca --purge-state onu siler ve bu, burada geri alınışı olmayan tek eylemdir: bu kurulumun yarattığı her sıfır bilgi kanalı kalıcı olarak susar, çünkü üyelerinin doğrulayacağı bir rotasyon bir daha imzalanamaz. Checkou'unuza hiç dokunulmaz.",
    "hu": "--uninstall mindkét szolgáltatást kidobja, törli a plisteket, a kódot, a konfigurációt és a naplókönyvtárat, és a -keepHome kapcsolóval törli a szolgáltatásfiókokat. Az állapotkönyvtár, /usr/local/var/popopx-service-suite, helyben marad: benne a gateway.db — a főkönyv, minden pairwise munkamenet-titok és a csatornák azonosságának privát kulcsai — és egy újratelepítés újra felhasználja. Csak a --purge-state törli, és ez az egyetlen itt végzett művelet, aminek nincs visszafordítása: minden zero-knowledge csatorna, amit ez a telepítés létrehozott, végleg elhallgat, mert nincs olyan rotáció, amit aláírhatnál és a tagjai ellenőriznének. A checkoutodat soha nem érinti.",
  } satisfies L,

  mProdNoteTitle: {
    en: "Three things install_macos.sh will not do for you",
    "ru": "Три вещи, которые install_macos.sh не сделает за вас",
    "de": "Drei Dinge, die install_macos.sh nicht für Sie tut",
    "fr": "Trois choses que install_macos.sh ne fait pas pour vous",
    "it": "Tre cose che install_macos.sh non fa per voi",
    "nl": "Drie dingen die install_macos.sh niet voor je doet",
    "cs": "Tři věci, které install_macos.sh za vás neudělá",
    "zh-Hans": "install_macos.sh 不会替你做的三件事",
    "zh-Hant": "install_macos.sh 不會替你做的三件事",
    "es": "Tres cosas que install_macos.sh no hace por ti",
    "pl": "Trzy rzeczy, których install_macos.sh nie zrobi za Ciebie",
    "ja": "install_macos.sh が代行しない 3 つのこと",
    "th": "สามสิ่งที่ install_macos.sh ไม่ทำให้",
    "fi": "Kolme asiaa, joita install_macos.sh ei tee puolestasi",
    "uk": "Три речі, які install_macos.sh не зробить за вас",
    "bg": "Три неща, които install_macos.sh не върши вместо теб",
    "tr": "install_macos.sh'ın sizin yerinize yapmadığı üç şey",
    "hu": "Három dolog, amit az install_macos.sh nem végez el helyetted",
  } satisfies L,
  mProdBindL: {
    en: "Bind",
    "ru": "Привязка",
    "de": "Bind-Adresse",
    "fr": "Adresse d'écoute",
    "it": "Ascolto",
    "nl": "Binding",
    "cs": "Bindování",
    "zh-Hans": "监听绑定",
    "zh-Hant": "監聽綁定",
    "es": "Escucha",
    "pl": "Wiązanie",
    "ja": "バインド",
    "th": "การ bind",
    "fi": "Sidos",
    "uk": "Прив'язка",
    "bg": "Обвързване",
    "tr": "Bağlama",
    "hu": "Kötés",
  } satisfies L,
  mProdBind: {
    en: "The default is loopback only, 127.0.0.1:8080 — reachable from this Mac alone. That is a deliberate divergence from the Ubuntu installer, which binds every interface by default. This script never opens anything in the Application Firewall: --check only reports its global state, and the NEXT STEPS print the two socketfilterfw lines (--add and --unblockapp on the venv's python) for you to run yourself, once TLS is in place and only if you used --lan.",
    "ru": "По умолчанию это только обратная петля, 127.0.0.1:8080 — достать можно лишь с самого же Mac. Это осознанное расхождение с Ubuntu-установщиком, который по умолчанию привязывается ко всем интерфейсам. Application Firewall эта скрипт не открывает никогда: --check лишь сообщает его общее состояние, а в NEXT STEPS напечатаны две команды socketfilterfw (--add и --unblockapp для python из venv) — их запускаете вы сами, когда TLS уже на месте и только если вы использовали --lan.",
    "de": "Der Standard ist nur loopback, 127.0.0.1:8080 — erreichbar allein von diesem Mac. Das ist absichtlich anders als beim Ubuntu-Installer, der per Vorgabe alle Interfaces bindet. Die Application Firewall öffnet dieses Skript nie: --check meldet nur ihren globalen Zustand, und die NEXT STEPS drucken die beiden socketfilterfw-Zeilen (--add und --unblockapp auf das Python aus dem venv), die Sie selbst ausführen, sobald TLS läuft und nur, wenn Sie --lan benutzt haben.",
    "fr": "Le défaut est la boucle locale seule, 127.0.0.1:8080 — atteignable uniquement depuis ce Mac. C'est un écart délibéré avec l'installeur Ubuntu, qui lie toutes les interfaces par défaut. Ce script n'ouvre jamais l'Application Firewall : --check se contente d'imprimer son état global, et les NEXT STEPS donnent les deux lignes socketfilterfw (--add et --unblockapp sur le python du venv) que vous lancez vous-mêmes, une fois le TLS en place et seulement si vous avez utilisé --lan.",
    "it": "Il default è solo loopback, 127.0.0.1:8080 — raggiungibile soltanto da questo Mac. È una divergenza voluta dall'installer Ubuntu, che per default binda tutte le interfacce. Questo script non apre mai l'Application Firewall: --check si limita a riportarne lo stato globale, e i NEXT STEPS stampano le due righe socketfilterfw (--add e --unblockapp sul python del venv) che eseguite voi, quando il TLS è in piedi e solo se avete usato --lan.",
    "nl": "Standaard is het alleen loopback, 127.0.0.1:8080 — alleen bereikbaar vanaf deze Mac. Dat is een bewust verschil met de Ubuntu-installateur, die standaard alle interfaces bindt. Dit script opent de Application Firewall nooit: --check meldt alleen haar globale staat, en de NEXT STEPS printen de twee socketfilterfw-regels (--add en --unblockapp op de python uit het venv) die je zelf uitvoert, zodra TLS rond is en alleen als je --lan hebt gebruikt.",
    "cs": "Výchozí stav je jen loopback, 127.0.0.1:8080 — dostupné pouze z tohohle Macu. Je to záměrný rozdíl oproti Ubuntu instalátoru, který ve výchozím nastavení binduje všechna rozhraní. Tenhle skript nikdy neotevře Application Firewall: --check jen oznámí její globální stav, a NEXT STEPS tisknou oba řádky socketfilterfw (--add a --unblockapp na python z venv), které spustíte sami, až když je TLS na místě a jen pokud jste použili --lan.",
    "zh-Hans": "默认只走回环，127.0.0.1:8080——只有这台 Mac 自己碰得到。这是与 Ubuntu 那个安装脚本刻意不同的地方：Ubuntu 默认绑所有网卡。这个脚本从不开应用防火墙的口子：--check 只报告它当前的全局状态，NEXT STEPS 则把两条 socketfilterfw（对 venv 里的 python 执行 --add 和 --unblockapp）打印出来让你自己跑，前提是 TLS 已经就位、而且你确实用了 --lan。",
    "zh-Hant": "預設只走回環，127.0.0.1:8080——只有這台 Mac 自己碰得到。這是與 Ubuntu 那個安裝腳本刻意不同的地方：Ubuntu 預設綁所有網路卡。這個腳本從不開應用防火牆的口子：--check 只報告它目前的全域狀態，NEXT STEPS 則把兩條 socketfilterfw（對 venv 裡的 python 執行 --add 和 --unblockapp）印出來讓你自己跑，前提是 TLS 已經就緒、而且你確實用了 --lan。",
    "es": "Por defecto solo loopback, 127.0.0.1:8080 — alcanzable únicamente desde este Mac. Es una divergencia deliberada con el instalador de Ubuntu, que enlaza todas las interfaces por defecto. Este script nunca abre nada en el Application Firewall: --check solo informa de su estado global, y los NEXT STEPS imprimen las dos líneas de socketfilterfw (--add y --unblockapp sobre el python del venv) para que las ejecutes tú, una vez el TLS esté en su sitio y solo si usaste --lan.",
    "pl": "Domyślnie to tylko loopback, 127.0.0.1:8080 — osiągalny wyłącznie z tego Maca. To zamierzone odstępstwo od instalatora Ubuntu, który domyślnie wiąże wszystkie interfejsy. Ten skrypt nigdy nie otwiera niczego w Application Firewall: --check tylko raportuje jego stan globalny, a NEXT STEPS drukują dwie linie socketfilterfw (--add i --unblockapp na pythona z venv), które uruchamiasz sam, gdy TLS już działa i tylko jeśli użyłeś --lan.",
    "ja": "既定はループバックのみ、127.0.0.1:8080 — この Mac の上からでしか届きません。Ubuntu のインストーラーが既定で全インターフェースにバインドするとの、意図的な違いです。このスクリプトは Application Firewall の穴を絶対に開けません。--check はそのグローバル状態を報告するだけで、NEXT STEPS は venv の python に対する socketfilterfw の 2 行（--add と --unblockapp）を表示するにとどめます。TLS が済んでいて、かつ --lan を使った場合にかぎって、あなたが自分で実行します。",
    "th": "ค่าเริ่มต้นเป็นเฉพาะ loopback เท่านั้น คือ 127.0.0.1:8080 — เข้าถึงได้จากบน Mac เครื่องนี้เท่านั้น นี่คือจุดที่ตั้งใจให้ต่างจากตัวติดตั้ง Ubuntu ที่ bind ทุก interface เป็นค่าเริ่มต้น สคริปต์นี้ไม่เคยเปิดช่องใน Application Firewall ให้: --check แค่มารายงานสถานะ global ของมัน ส่วน NEXT STEPS จะพิมพ์สองคำสั่ง socketfilterfw (--add และ --unblockapp กับ python ใน venv) ให้คุณรันเอง เมื่อ TLS พร้อมแล้วและเมื่อคุณใช้ --lan เท่านั้น",
    "fi": "Oletuksena on pelkkä loopback, 127.0.0.1:8080 — siihen yltää vain tältä Macilta. Tämä on tietoista poikkeama Ubuntu-asentajasta, joka sitoo oletuksena kaikki rajapinnat. Tämä skripti ei koskaan avaa mitään Application Firewallissa: --check vain ilmoittaa sen globaalin tilan, ja NEXT STEPS tulostaa kaksi socketfilterfw-riviä (--add ja --unblockapp venvin pythonille), jotka ajat itse, kun TLS on kunnossa ja vain jos käytit --lan:ia.",
    "uk": "Типово це лише loopback, 127.0.0.1:8080 — дістатися можна тільки з самого цього Mac. Це свідома відмінність від Ubuntu-інсталятора, який типово прив'язується до всіх інтерфейсів. Цей скрипт ніколи не відкриває нічого в Application Firewall: --check лише повідомляє його загальний стан, а у NEXT STEPS надруковані дві команди socketfilterfw (--add і --unblockapp для python з venv) — їх запускаєте ви самі, коли TLS уже на місці й лише якщо ви вжили --lan.",
    "bg": "По подразбиране е само loopback, 127.0.0.1:8080 — достига се единствено от самия този Mac. Това е съзнателно разминаване с Ubuntu инсталатора, който по подразбиране обвързва всички интерфейси. Този скрипт никога не отваря нищо в Application Firewall: --check само съобщава глобалното му състояние, а NEXT STEPS печатат двете реда socketfilterfw (--add и --unblockapp върху python от venv), които стартираш сам, след като TLS е налице и само ако си използвал --lan.",
    "tr": "Varsayılan yalnızca loopback, 127.0.0.1:8080 — sadece bu Mac'in üzerinden erişilebilir. Bu, Ubuntu kurulum programından bilinçli bir ayrışmadır; Ubuntu varsayılan olarak tüm arayüzlere bağlanır. Bu betik Application Firewall'da asla hiçbir şey açmaz: --check yalnızca küresel durumu bildirir, NEXT STEPS ise sizin çalıştıracağınız iki socketfilterfw satırını yazdırır (venv içindeki python üzerinde --add ve --unblockapp) — TLS kurulduysa ve yalnızca --lan kullandıysanız.",
    "hu": "Alapértelmezés szerint csak loopback, 127.0.0.1:8080 — csak erről a Macről érhető el. Ez szándékos eltérés az Ubuntu telepítőtől, amely alapértelmezés szerint minden interfészt leköt. Ez a szkript soha nem nyit semmit az Application Firewallban: a --check csak a globális állapotát jelenti, a NEXT STEPS pedig két socketfilterfw sort nyomtat (--add és --unblockapp a venv pythonjára), amelyeket magad futtatsz, ha már megvan a TLS, és csak ha --lan-t használtál.",
  } satisfies L,
  mProdLogL: {
    en: "Logs",
    "ru": "Логи",
    "de": "Protokolle",
    "fr": "Journaux",
    "it": "Log di servizio",
    "nl": "Logbestanden",
    "cs": "Logy",
    "zh-Hans": "日志",
    "zh-Hant": "日誌",
    "es": "Registros",
    "pl": "Dzienniki",
    "ja": "ログ",
    "th": "ล็อก",
    "fi": "Logit",
    "uk": "Логи",
    "bg": "Логове",
    "tr": "Günlükler",
    "hu": "Naplók",
  } satisfies L,
  mProdLog: {
    en: "launchd writes them into /usr/local/var/log/popopx-service-suite at mode 0600, and there is no rotation — the install plan says so in exactly those words. Everything the gateway says goes to gateway.err.log; gateway.out.log carries only the banner lines. The safe rotation is the one that reopens the file descriptor: move the log, then kickstart -k the job, because a newsyslog entry that renames the file leaves a running daemon writing into an inode nobody opens again.",
    "ru": "Логи пишет launchd в /usr/local/var/log/popopx-service-suite с правами 0600, и ротации нет — план установки говорит это теми же словами. Всё, что говорит шлюз, попадает в gateway.err.log; в gateway.out.log только строки баннера. Безопасная ротация — та, что заново открывает дескриптор: перенесите файл, затем kickstart -k задачу, потому что запись newsyslog, переименовывающая файл, оставляет работающего демона писать в inode, который больше никто не откроет.",
    "de": "Die Logs schreibt launchd in /usr/local/var/log/popopx-service-suite mit Modus 0600, und es gibt keine Rotation — der Installationsplan sagt das wörtlich. Alles, was das Gateway sagt, landet in gateway.err.log; gateway.out.log trägt nur die Bannerzeilen. Die sichere Rotation ist die, die den Dateideskriptor wieder öffnet: Log verschieben, dann den Job mit kickstart -k neu starten, weil ein newsyslog-Eintrag, der die Datei umbenennt, einen laufenden Daemon zurücklässt, der in ein inode schreibt, das nie wieder jemand öffnet.",
    "fr": "Les journaux sont écrits par launchd dans /usr/local/var/log/popopx-service-suite en mode 0600, et il n'y a pas de rotation — le plan d'installation le dit mot pour mot. Tout ce que dit la passerelle va dans gateway.err.log ; gateway.out.log ne porte que les lignes de bandeau. La rotation sûre est celle qui rouvre le descripteur : déplacer le fichier puis relancer le job avec kickstart -k, car une entrée newsyslog qui renomme le fichier laisse un démon en train d'écrire dans un inode que plus personne ne rouvrira.",
    "it": "I log li scrive launchd in /usr/local/var/log/popopx-service-suite in modalità 0600, e non c'è rotazione — il piano di installazione lo dice esattamente così. Tutto quello che il gateway dice finisce in gateway.err.log; gateway.out.log porta solo le righe di banner. La rotazione sicura è quella che riapre il descrittore di file: sposta il log, poi riavvia il job con kickstart -k, perché una voce di newsyslog che rinomina il file lascia un demone in esecuzione a scrivere in un inode che nessuno riaprirà.",
    "nl": "De logs worden door launchd in /usr/local/var/log/popopx-service-suite geschreven met modus 0600, en er is geen rotatie — het installatieplan zegt dat letterlijk. Alles wat de gateway zegt gaat naar gateway.err.log; gateway.out.log bevat alleen de bannerregels. De veilige rotatie is die welke de bestandsdescriptor heropent: verplaats het logbestand, start de job met kickstart -k, want een newsyslog-vermelding die het bestand hernoemt laat een draaiende daemon schrijven naar een inode die niemand opnieuw opent.",
    "cs": "Logy píše launchd do /usr/local/var/log/popopx-service-suite s režimem 0600, a rotace neexistuje — instalační plán to říká doslova. Všechno, co brána říká, jde do gateway.err.log; gateway.out.log nese jen řádky banneru. Bezpečná rotace je taková, která zavřený deskriptor znovu otevře: log přesuňte, pak úlohu restartujte přes kickstart -k, protože položka newsyslog, která soubor přejmenuje, nechá běžícího daemona psát do inode, který už nikdo neotevře.",
    "zh-Hans": "日志由 launchd 写进 /usr/local/var/log/popopx-service-suite，权限 0600，而且没有轮转——安装计划表那一行就是这几个字。网关说的话全部进 gateway.err.log，gateway.out.log 只有 banner 那几行。安全的轮转是「会重开文件描述符」的那种：先把日志挪走，再用 kickstart -k 重启这个 job；只是用 newsyslog 把文件改名，会让还在跑的守护进程继续往一个再没人打开的 inode 里写。",
    "zh-Hant": "日誌由 launchd 寫進 /usr/local/var/log/popopx-service-suite，權限 0600，而且沒有輪轉——安裝計畫表那一行就是這幾個字。閘道說的話全部進 gateway.err.log，gateway.out.log 只有 banner 那幾行。安全的輪轉是「會重開檔案描述符」的那種：先把日誌挪走，再用 kickstart -k 重啟這個 job；只用 newsyslog 把檔案改名，會讓還在跑的常駐程式繼續往一個再沒人開啟的 inode 裡寫。",
    "es": "Los registros los escribe launchd en /usr/local/var/log/popopx-service-suite con modo 0600, y no hay rotación — el plan de instalación lo dice con esas mismas palabras. Todo lo que dice la pasarela va a gateway.err.log; gateway.out.log solo lleva las líneas de banner. La rotación segura es la que reabre el descriptor de archivo: mueve el log y luego reinicia el trabajo con kickstart -k, porque una entrada de newsyslog que renombra el archivo deja a un demonio en ejecución escribiendo en un inode que nadie volverá a abrir.",
    "pl": "Logi zapisuje launchd w /usr/local/var/log/popopx-service-suite z trybem 0600 i nie ma rotacji — plan instalacji mówi to dokładnie tymi słowami. Wszystko, co mówi brama, trafia do gateway.err.log; gateway.out.log zawiera tylko linie banera. Bezpieczna rotacja to taka, która ponownie otwiera deskryptor pliku: przenieś log, potem restartuj usługę przez kickstart -k, bo wpis newsyslog zmieniający nazwę pliku zostawia działający demon piszący do inode'a, którego nikt już nie otworzy.",
    "ja": "ログは launchd が /usr/local/var/log/popopx-service-suite にモード 0600 で書き込み、ローテーションはありません——インストール計画表がそのままそう書いています。ゲートウェイが話す内容はすべて gateway.err.log に入り、gateway.out.log に載るのは banner の行だけです。安全なローテーションはファイルディスクリプターを開き直すほうです。ログを退かしてから kickstart -k で job を再起動します。ファイルをリネームするだけの newsyslog 設定は、稼働中のデーモンを誰も再び開かない inode への書き込みに取り残します。",
    "th": "launchd เป็นผู้เขียนล็อกไปที่ /usr/local/var/log/popopx-service-suite ด้วย mode 0600 และไม่มีการ rotate เลย — ตารางแผนการติดตั้งเขียนไว้ตรง ๆ แบบนั้น คำพูดทั้งหมดของ gateway ไปอยู่ใน gateway.err.log ส่วน gateway.out.log มีแค่บรรทัด banner การ rotate ที่ปลอดภัยคือแบบที่เปิด file descriptor ใหม่: ย้ายไฟล์ล็อกออกก่อน แล้วค่อย kickstart -k job นั้น เพราะ entry newsyslog ที่แค่เปลี่ยนชื่อไฟล์จะทิ้งให้ demon ที่ยังรันอยู่เขียนลง inode ที่ไม่มีใครเปิดอีก",
    "fi": "launchd kirjoittaa lokit hakemistoon /usr/local/var/log/popopx-service-suite tilamuodolla 0600, ja kiertoa ei ole — asennussuunnitelma sanoo juuri noin. Kaikki gatewayn sanoma menee tiedostoon gateway.err.log; gateway.out.log sisältää vain banner-rivit. Turvallinen kierto on se, joka avaa tiedostokuvaimen uudelleen: siirrä loki, sitten käynnistä tehtävä uudelleen kickstart -k:lla, koska newsyslog-merkintä, joka nimeää tiedoston, jättää käynnissä olevan daemin kirjoittamaan inodeen, jota kukaan ei enää avaa.",
    "uk": "Логи пише launchd у /usr/local/var/log/popopx-service-suite з режимом 0600, і ротації немає — план встановлення каже це тими самими словами. Усе, що каже шлюз, потрапляє до gateway.err.log; у gateway.out.log лиш рядки банера. Безпечна ротація — та, що заново відкриває дескриптор: перенесіть лог, потім перезавантажте задачу через kickstart -k, бо запис newsyslog, який перейменовує файл, залишає робочого демона писати в inode, який більше ніхто не відкриє.",
    "bg": "Логовете се записват от launchd в /usr/local/var/log/popopx-service-suite с режим 0600 и няма ротация — планът за инсталация го казва с точно тези думи. Всичко, което шлюзът казва, отива в gateway.err.log; gateway.out.log носи само редовете на банера. Безопасната ротация е тази, която отново отваря файловия дескриптор: премести лога, после рестартирай задачата с kickstart -k, защото запис на newsyslog, който преименува файла, оставя работещ демон да пише в inode, който никой повече няма да отвори.",
    "tr": "Günlükleri launchd /usr/local/var/log/popopx-service-suite içine 0600 modunda yazar ve rotasyon yoktur — kurulum planı tam bu kelimeleri söyler. Ağ geçidinin söylediği her şey gateway.err.log'a gider; gateway.out.log yalnız banner satırlarını taşır. Güvenli rotasyon, dosya tanımlayıcısını yeniden açan rotasyondur: günlüğü taşıyın, sonra işi kickstart -k ile yeniden başlatın; çünkü dosyayı yeniden adlandıran bir newsyslog kaydı, çalışan bir koruyucu programı kimsenin bir daha açmayacağı bir inode'a yazmaya bırakır.",
    "hu": "A naplókat a launchd írja a /usr/local/var/log/popopx-service-suite alá 0600 móddal, és nincs rotáció — a telepítési terv szó szerint így mondja. Amit az átjáró megszólal, az a gateway.err.log-ba megy; a gateway.out.log csak a banner sorokat viszi. A biztonságos rotáció az, amelyik újra megnyitja a fájlleírót: helyezd át a naplót, majd indítsd újra a dzsobot kickstart -k-val, mert egy newsyslog bejegyzés, amelyik átnevezi a fájlt, egy futó démont hagy írni egy olyan inode-ba, amit senki többé nem nyit meg.",
  } satisfies L,
  mProdExitL: {
    en: "Exit codes",
    "ru": "Коды выхода",
    "de": "Exit-Codes",
    "fr": "Codes de sortie",
    "it": "Codici di uscita",
    "nl": "Exitcodes",
    "cs": "Kódy konce",
    "zh-Hans": "退出码",
    "zh-Hant": "退出碼",
    "es": "Códigos de salida",
    "pl": "Kody zakończenia",
    "ja": "終了コード",
    "th": "exit code",
    "fi": "Poistumiskoodit",
    "uk": "Коди виходу",
    "bg": "Кодове на излизане",
    "tr": "Çıkış kodları",
    "hu": "Kilépési kódok",
  } satisfies L,
  mProdExit: {
    en: "The numbers are part of the contract: 3 is no Python 3.11 found, 4 is --with-node with no popopx-chat binary, 5 is installed but silent on the probe to http://127.0.0.1:<port>/healthz — then the installer tells you to look at launchctl print first, and at gateway.err.log after. 1 stays the fatal-preflight code, and 3 and 4 are deliberately kept from collapsing into it.",
    "ru": "Числа — часть договора: 3 означает, что Python 3.11 не найден, 4 — что --with-node без бинарника popopx-chat, а 5 — что служба установилась, но на пробу http://127.0.0.1:<порт>/healthz не отвечает; при 5 установщик советует сначала посмотреть launchctl print, потом gateway.err.log. Единица остаётся кодом фатальной предыстановочной проверки, и 3 с 4 намеренно не сводятся к ней.",
    "de": "Die Zahlen sind Teil des Vertrags: 3 heißt, kein Python 3.11 wurde gefunden, 4 heißt --with-node ohne popopx-chat-Binary, und 5 heißt, der Dienst ist installiert, bleibt aber auf der Sonde http://127.0.0.1:<port>/healthz stumm — bei 5 rät der Installer erst zu launchctl print, dann zu gateway.err.log. 1 bleibt der Code für einen fatalen Preflight, und 3 und 4 werden bewusst nicht darin aufgelöst.",
    "fr": "Ces nombres font partie du contrat : 3 signifie qu'aucun Python 3.11 n'a été trouvé, 4 un --with-node sans binaire popopx-chat, et 5 que le service est installé mais muet sur la sonde http://127.0.0.1:<port>/healthz — dans ce cas l'installeur conseille de regarder launchctl print puis gateway.err.log. 1 reste le code du préflight fatal, et 3 et 4 sont délibérément tenus à part de lui.",
    "it": "I numeri sono parte del contratto: 3 significa che Python 3.11 non è stato trovato, 4 che --with-node non ha trovato alcun binario popopx-chat, e 5 che il servizio è installato ma resta muto alla sonda http://127.0.0.1:<porta>/healthz — in quel caso l'installer dice di guardare prima launchctl print e poi gateway.err.log. 1 resta il codice del preflight fatale, e 3 e 4 sono tenuti deliberatamente distinti da esso.",
    "nl": "De getallen zijn deel van de overeenkomst: 3 betekent dat Python 3.11 niet gevonden is, 4 betekent --with-node zonder popopx-chat-binary, en 5 betekent dat de dienst geïnstalleerd is maar stil blijft op de probe http://127.0.0.1:<poort>/healthz — bij 5 raadt de installateur eerst launchctl print aan, daarna gateway.err.log. 1 blijft de code voor een fatale preflight, en 3 en 4 worden er bewust niet in samengevat.",
    "cs": "Čísla jsou součástí kontraktu: 3 znamená, že Python 3.11 se nenašel, 4 že --with-node bez binárky popopx-chat a 5, že služba je nainstalovaná, ale na sondu http://127.0.0.1:<port>/healthz mlčí — při 5 instalátor radí nejdřív nahlédnout do launchctl print, pak do gateway.err.log. Z jedničky zůstává kód fatálního preflightu a 3 a 4 se do ní záměrně neslučují.",
    "zh-Hans": "这些数字是约定的一部分：3 是没找到 Python 3.11，4 是 --with-node 却找不到 popopx-chat 二进制，5 是服务装好了却对 http://127.0.0.1:<端口>/healthz 这条探活不作声——遇到 5 时脚本会让你先看 launchctl print，再翻 gateway.err.log。1 仍然是预检致命错误的代码，3 和 4 被刻意保持与它不同。",
    "zh-Hant": "這些數字是約定的一部分：3 是沒找到 Python 3.11，4 是 --with-node 卻找不到 popopx-chat 二元檔，5 是服務裝好了卻對 http://127.0.0.1:<埠>/healthz 這條探活不作聲——遇到 5 時腳本會請你先看 launchctl print，再翻 gateway.err.log。1 仍然是預檢致命錯誤的程式碼，3 和 4 被刻意與它分開。",
    "es": "Los números son parte del contrato: 3 significa que no se encontró Python 3.11, 4 que --with-node se quedó sin binario popopx-chat, y 5 que el servicio quedó instalado pero calla ante la sonda http://127.0.0.1:<puerto>/healthz — con 5 el instalador manda mirar primero launchctl print y luego gateway.err.log. El 1 sigue siendo el código del preflight fatal, y 3 y 4 se mantienen deliberadamente separados de él.",
    "pl": "Te liczby są częścią kontraktu: 3 oznacza, że nie znaleziono Pythona 3.11, 4 — że --with-node nie znalazł pliku popopx-chat, a 5 — że usługa została zainstalowana, ale milczy na sondzie http://127.0.0.1:<port>/healthz; przy 5 instalator każe najpierw zajrzeć do launchctl print, potem do gateway.err.log. 1 pozostaje kodem fatalnego sprawdzenia wstępnego, a 3 i 4 są celowo z niego wyłączone.",
    "ja": "この数値は契約の一部です。3 は Python 3.11 が見つからないこと、4 は --with-node で popopx-chat バイナリが見つからないこと、5 はサービスはインストールされたのに http://127.0.0.1:<port>/healthz の探査に何も答えないことを意味します。5 の場合、インストーラーはまず launchctl print、次に gateway.err.log を見るよう促します。1 は事前チェックの致命的エラーのコードのままで、3 と 4 をそれに潰さないのが意図です。",
    "th": "ตัวเลขเป็นส่วนหนึ่งของสัญญา: 3 คือหา Python 3.11 ไม่เจอ, 4 คือ --with-node แต่ไม่มีไบนารี popopx-chat, ส่วน 5 คือติดตั้งเซอร์วิสแล้วแต่มันเงียบใส่ probe http://127.0.0.1:<port>/healthz — เมื่อเป็น 5 ตัวติดตั้งจะบอกให้ดู launchctl print ก่อน แล้วค่อยไล่ gateway.err.log. เลข 1 ยังเป็นโค้ด fatal preflight ตามเดิม และการที่ 3 กับ 4 ไม่ถูกยุบรวมลง 1 คือเรื่องที่ตั้งใจ",
    "fi": "Numerot ovat osa sopimusta: 3 tarkoittaa, ettei Python 3.11:ta löytynyt, 4 tarkoittaa --with-node ilman popopx-chat-binääriä, ja 5 tarkoittaa, että palvelu asennettiin mutta pysyy vaitteilla koeluodalle http://127.0.0.1:<portti>/healthz — viidosen tapauksessa asennusohjelma neuvoo katsomaan ensin launchctl print ja sitten gateway.err.log. 1 pysyy vakavan esitarkistuksen koodina, eikä 3:ta ja 4:ää romahdeta siihen tarkoituksella.",
    "uk": "Числа — частина домовленості: 3 означає, що Python 3.11 не знайдено, 4 — що --with-node без бінарника popopx-chat, а 5 — що службу встановлено, але на пробу http://127.0.0.1:<порт>/healthz вона мовчить; у такому разі інсталятор радить спершу подивитись launchctl print, потім gateway.err.log. Одиниця лишається кодом фатальної попередньої перевірки, і 3 з 4 свідомо не зливаються з нею.",
    "bg": "Числата са част от договора: 3 означава, че Python 3.11 не е намерен, 4 — че --with-node е без двоичен файл popopx-chat, а 5 — че услугата е инсталирана, но мълчи на сондата http://127.0.0.1:<порт>/healthz; при 5 инсталаторът съветва първо да погледнеш launchctl print, после gateway.err.log. Единицата остава код на фаталния предварителен преглед, а 3 и 4 умишлено не се свиват в нея.",
    "tr": "Sayılar sözleşmenin parçası: 3 Python 3.11 bulunamadığı anlamına gelir, 4 --with-node için popopx-chat ikilisi bulunamadığı, 5 ise hizmetin kurulup http://127.0.0.1:<port>/healthz yoklamasına sessiz kaldığı anlamına gelir — 5'te kurulum programı önce launchctl print'e, sonra gateway.err.log'a bakmanızı söyler. 1 ölümcül ön kontrol kodu olarak kalır ve 3 ile 4'un içine düşürülmesi bilinçli olarak engellenir.",
    "hu": "A számok a megállapodás részei: a 3 azt jelenti, hogy nincs meg a Python 3.11, a 4 azt, hogy --with-node esetén nincs meg a popopx-chat bináris, az 5 pedig azt, hogy a szolgáltatás feltelepült, de hallgat a http://127.0.0.1:<port>/healthz próbára — 5 esetén a telepítő először a launchctl print, majd a gateway.err.log megnyitását tanácsolja. Az 1 marad a végzetes előellenőrzés kódja, és a 3-at meg a 4-et szándékosan nem olthatja bele.",
  } satisfies L,

  /* macOS — development: start_macos.sh */
  mDevHeading: {
    en: "Local development: ./start_macos.sh",
    "ru": "Локальная разработка: ./start_macos.sh",
    "de": "Lokale Entwicklung: ./start_macos.sh",
    "fr": "Développement local : ./start_macos.sh",
    "it": "Sviluppo locale: ./start_macos.sh",
    "nl": "Lokale ontwikkeling: ./start_macos.sh",
    "cs": "Lokální vývoj: ./start_macos.sh",
    "zh-Hans": "本地开发：./start_macos.sh",
    "zh-Hant": "本機開發：./start_macos.sh",
    "es": "Desarrollo local: ./start_macos.sh",
    "pl": "Rozwój lokalny: ./start_macos.sh",
    "ja": "ローカル開発: ./start_macos.sh",
    "th": "พัฒนาในเครื่อง: ./start_macos.sh",
    "fi": "Paikallinen kehitys: ./start_macos.sh",
    "uk": "Локальна розробка: ./start_macos.sh",
    "bg": "Локална разработка: ./start_macos.sh",
    "tr": "Yerel geliştirme: ./start_macos.sh",
    "hu": "Helyi fejlesztés: ./start_macos.sh",
  } satisfies L,

  mWhyVenv: {
    en: "The default is a venv, not Docker, for a reason: the node listens only on 127.0.0.1, and inside Docker Desktop a container's “host” is the linuxvm loopback, not this Mac's. network_mode: host is a Linux kernel feature, so running both natively is what makes that loopback hop real.",
    "ru": "По умолчанию это venv, а не Docker, и не случайно: узел слушает только 127.0.0.1, а внутри Docker Desktop «host» контейнера — это loopback виртуальной linuxvm, а не этого Mac. network_mode: host — возможность ядра Linux, поэтому только нативный запуск обоих делает этот loopback-переход настоящим.",
    "de": "Der Standard ist ein venv, nicht Docker, und das hat einen Grund: Der Node lauscht nur auf 127.0.0.1, und innerhalb von Docker Desktop ist der „host“ eines Containers das Loopback der linuxvm, nicht dieses Macs. network_mode: host ist eine Funktion des Linux-Kernels — nur wenn beide nativ laufen, wird dieser Loopback-Hop echt.",
    "fr": "Le défaut est un venv et non Docker, et pour cause : le nœud n'écoute que 127.0.0.1, et dans Docker Desktop le « host » d'un conteneur est la boucle locale de la linuxvm, pas celle de ce Mac. network_mode: host est une fonctionnalité du noyau Linux ; exécuter les deux en natif est ce qui rend ce saut loopback réel.",
    "it": "La scelta di default è un venv, non Docker, e ha una ragione: il nodo ascolta solo su 127.0.0.1, e dentro Docker Desktop l'“host” di un container è il loopback della linuxvm, non quello di questo Mac. network_mode: host è una funzionalità del kernel Linux, quindi eseguire entrambi nativamente è ciò che rende reale quel salto di loopback.",
    "nl": "Standaard is het een venv en geen Docker, en dat heeft een reden: de node luistert alleen op 127.0.0.1, en in Docker Desktop is de “host” van een container de loopback van de linuxvm, niet die van deze Mac. network_mode: host is een Linux-kernelvoorziening, dus alleen door beide native te draaien wordt die loopback-hop echt.",
    "cs": "Volbou je venv, ne Docker, a má to důvod: uzel naslouchá jen na 127.0.0.1, a uvnitř Docker Desktopu je „host“ kontejneru loopback linuxvm, nikoli tohoto Macu. network_mode: host je vlastnost jádra Linux, takže právě běh obou komponent nativně dělá onen loopbackový přeskok skutečným.",
    "zh-Hans": "默认不走 Docker 是有原因的：节点只监听 127.0.0.1，而 Docker Desktop 里容器的 host 是 linuxvm 的回环，不是这台 Mac 的回环；network_mode: host 是 Linux 才有的内核能力。两边都原生运行，这一跳回环才是真的。脚本确实留了 --docker 这个开关，但它自己写明了条件：Docker Desktop 要打开 Enable host networking，而且只有节点也容器化时才有意义。",
    "zh-Hant": "預設不走 Docker 是有原因的：節點只監聽 127.0.0.1，而 Docker Desktop 裡容器的 host 是 linuxvm 的迴環，不是這臺 Mac 的迴環；network_mode: host 是 Linux 才有的核心能力。兩邊都原生執行，這一跳迴環才是真的。腳本確實留了 --docker 這個開關，但它自己寫明了條件：Docker Desktop 要打開 Enable host networking，而且只有節點也容器化時才有意義。",
    "es": "Por defecto se usa un venv y no Docker, y hay una razón para ello: el nodo solo escucha en 127.0.0.1, y dentro de Docker Desktop el “host” de un contenedor es el loopback de la linuxvm, no el de este Mac. network_mode: host es una función del kernel de Linux, así que ejecutar ambos de forma nativa es lo que hace real ese salto de loopback.",
    "pl": "Domyślnie jest to venv, a nie Docker, i nie bez powodu: węzeł nasłuchuje wyłącznie na 127.0.0.1, a w Docker Desktop „host” kontenera to loopback linuxvm, nie tego Maca. network_mode: host to cecha jądra Linux, więc dopiero natywne uruchomienie obu rzeczy czyni ten hop po loopbacku prawdziwym.",
    "ja": "既定が Docker ではなく venv なのには理由があります。ノードは 127.0.0.1 だけを待ち受けますが、Docker Desktop の中でのコンテナの「host」は linuxvm のループバックであって、この Mac のループバックではありません。network_mode: host は Linux カーネルの機能なので、両方をネイティブで動かして初めて、あのループバックの一跳ぎりが現実のものになります。",
    "th": "ค่าเริ่มต้นเป็น venv ไม่ใช่ Docker และมีเหตุผล: โหนดฟังเฉพาะที่ 127.0.0.1 ในขณะที่ใน Docker Desktop คำว่า “host” ของคอนเทนเนอร์คือ loopback ของ linuxvm ไม่ใช่ของ Mac เครื่องนี้ และ network_mode: host เป็นความสามารถของ เคอร์เนล Linux การรันทั้งสองอย่างเป็น native เท่านั้นที่ทำให้การกระโดดผ่าน loopback เป็นของจริง",
    "fi": "Oletus on venv eikä Docker, ja syynä on tämä: solmu kuuntelee vain osoitetta 127.0.0.1, ja Docker Desktopissa kontin “host” on linuxvm:n loopback, ei tämän Macin. network_mode: host on Linux-ytimen ominaisuus, joten vasta kun molemmat pyörivät natiivisti, tuo loopback-hyppy on totta.",
    "uk": "Типово це venv, а не Docker, і не випадково: вузол слухає лише 127.0.0.1, а всередині Docker Desktop «host» контейнера — це loopback віртуальної linuxvm, а не цього Mac. network_mode: host — це можливість ядра Linux, тому саме нативний запуск обох компонентів робить цей loopback-перехід справжнім.",
    "bg": "По подразбиране е venv, а не Docker, и има причина: възелът слуша само на 127.0.0.1, а в Docker Desktop „host“-ът на контейнера е loopback на linuxvm, не на този Mac. network_mode: host е възможност на Linux ядрото, затова само пускането и на двете нативно прави този loopback скок истински.",
    "tr": "Varsayılanın Docker değil venv olmasının bir nedeni var: düğüm yalnızca 127.0.0.1'i dinler, üstelik Docker Desktop içinde bir konteynerin “host”'u bu Mac'in değil linuxvm'in loopback'idir. network_mode: host bir Linux çekirdek özelliğidir; bu loopback atlamasını gerçek kılan da ikisini yerel olarak çalıştırmaktır.",
    "hu": "Az alapértelmezés venv, nem Docker, és ennek oka van: a csomópont csak a 127.0.0.1-en figyel, és a Docker Desktopban a konténer „host”ja a linuxvm loopback-je, nem ennek a Macnek a loopback-je. A network_mode: host egy Linux kernel funkció, tehát csak ha mindkettő natívan fut, valós az a loopback ugrás.",
  } satisfies L,
  mStartT: {
    en: "One command, two processes",
    "ru": "Одна команда — два процесса",
    "de": "Ein Befehl, zwei Prozesse",
    "fr": "Une commande, deux processus",
    "it": "Un comando, due processi",
    "nl": "Eén commando, twee processen",
    "cs": "Jeden příkaz, dva procesy",
    "zh-Hans": "一条命令起两套进程",
    "zh-Hant": "一行指令起兩個程序",
    "es": "Un comando, dos procesos",
    "pl": "Jedno polecenie, dwa procesy",
    "ja": "1つのコマンドで2つのプロセス",
    "th": "คำสั่งเดียว สองกระบวนการ",
    "fi": "Yksi komento, kaksi prosessia",
    "uk": "Одна команда — два процеси",
    "bg": "Една команда, два процеса",
    "tr": "Tek komut, iki süreç",
    "hu": "Egy parancs, két folyamat",
  } satisfies L,
  mStartC: {
    en: "It copies .env.example to .env when none exists and generates the token inside it (reporting only that it did, never the value, and leaving .env at mode 600); finds Python 3.11, creates .venv and installs gateway/requirements.txt (first run only); starts the node on 127.0.0.1:5225 and the gateway on 0.0.0.0:8080, probes /healthz, then prints the console URL, the phone-side origin and where the token lives. Ctrl-C stops the gateway and any node the script started; a node you were already running is yours and is left alone. Nothing is installed system-wide and .venv is deletable.",
    "ru": "Он копирует .env.example в .env, если того нет, и генерирует внутри токен (сообщая только о факте генерации, никогда — о значении, и оставляя .env с правами 600); находит Python 3.11, создаёт .venv и ставит gateway/requirements.txt (только при первом запуске); поднимает узел на 127.0.0.1:5225 и шлюз на 0.0.0.0:8080, проверяет /healthz, после чего печатает адрес консоли, адрес для телефона и местоположение токена. Ctrl-C останавливает шлюз и тот узел, который запустил скрипт; запущенный вами узел остаётся в покое. В системе ничего не устанавливается, .venv удаляется вместе с папкой.",
    "de": "Er kopiert .env.example nach .env, falls es fehlt, und erzeugt darin das Token (meldet nur, dass er es tat, nie den Wert, und belässt .env bei Modus 600); findet Python 3.11, legt .venv an und installiert gateway/requirements.txt (nur beim ersten Lauf); startet den Node auf 127.0.0.1:5225 und das Gateway auf 0.0.0.0:8080, prüft /healthz und gibt dann die Konsolen-URL, den phone-seitigen Ursprung und den Ort des Tokens aus. Strg-C beendet das Gateway und jeden vom Skript gestarteten Node; einen von Ihnen laufenden Node lässt er in Ruhe. Es wird nichts systemweit installiert, .venv ist löschbar.",
    "fr": "Il copie .env.example en .env s'il n'existe pas et y génère le jeton (en signalant seulement qu'il l'a fait, jamais la valeur, et laisse .env en mode 600) ; il trouve Python 3.11, crée .venv et installe gateway/requirements.txt (premier lancement uniquement) ; démarre le nœud sur 127.0.0.1:5225 et la passerelle sur 0.0.0.0:8080, sonde /healthz, puis affiche l'URL de la console, l'origine côté téléphone et l'endroit du jeton. Ctrl-C arrête la passerelle et le nœud lancé par le script ; un nœud que vous faisiez tourner vous appartient et n'est pas touché. Rien n'est installé dans le système et .venv est supprimable.",
    "it": "Copia .env.example in .env quando non esiste e genera il token al suo interno (comunicando solo che lo ha fatto, mai il valore, e lasciando .env in modalità 600); trova Python 3.11, crea .venv e installa gateway/requirements.txt (solo alla prima esecuzione); avvia il nodo su 127.0.0.1:5225 e il gateway su 0.0.0.0:8080, verifica /healthz, poi stampa l'URL della console, l'origine lato telefono e dove si trova il token. Ctrl-C ferma il gateway e l'eventuale nodo avviato dallo script; un nodo che stai già eseguendo resta tuo e non viene toccato. Non si installa nulla nel sistema e .venv è cancellabile.",
    "nl": "Hij kopieert .env.example naar .env als die er niet is en genereert er het token in (meldt alleen dat het gebeurde, nooit de waarde, en laat .env op modus 600 staan); hij vindt Python 3.11, maakt .venv en installeert gateway/requirements.txt (alleen bij de eerste run); hij start de node op 127.0.0.1:5225 en de gateway op 0.0.0.0:8080, proeft /healthz en print dan de console-URL, de telefoonzijde-origine en waar het token staat. Ctrl-C stopt de gateway en elke door het script gestarte node; een node die jij al draait is van jou en blijft onaangeroerd. Er wordt niets systeembreed geïnstalleerd en .venv is weg te gooien.",
    "cs": "Zkopíruje .env.example do .env, pokud neexistuje, a vygeneruje v něm token (hlásí jen že to udělal, nikdy hodnotu, a nechá .env ve režimu 600); najde Python 3.11, vytvoří .venv a nainstaluje gateway/requirements.txt (pouze při prvním běhu); spustí uzel na 127.0.0.1:5225 a bránu na 0.0.0.0:8080, ověří /healthz a poté vytiskne URL konzole, původ ze strany telefonu a kde token sídlí. Ctrl-C zastaví bránu i uzel, který skript spustil; uzel, který už běží váš, je váš a skript do něj nezasahuje. Nic se do systému neinstaluje a .venv je mazatelný.",
    "zh-Hans": "它会：没有 .env 就从 .env.example 复制一份并在里面生成令牌（只报「已生成」、不打印值，并把 .env 设成 600）；找到 Python 3.11 后建 .venv 并装 gateway/requirements.txt（只在第一次跑装）；起节点（127.0.0.1:5225）与网关（0.0.0.0:8080），探活 /healthz 之后打印后台地址、手机侧来源与令牌所在位置。Ctrl-C 收掉网关和它自己起的节点——已经在跑的节点是开发者的进程，脚本不动它。系统里不装任何东西，.venv 可以直接删。",
    "zh-Hant": "它會：沒有 .env 就從 .env.example 複製一份並在裡面產生權杖（只報「已產生」、不列印值，並把 .env 設成 600）；找到 Python 3.11 後建 .venv 並裝 gateway/requirements.txt（只在第一次跑裝）；起節點（127.0.0.1:5225）與閘道（0.0.0.0:8080），探活 /healthz 之後列印後臺位址、手機側來源與權杖所在位置。Ctrl-C 收掉閘道和它自己起的節點——已在跑的節點是開發者的程序，腳本不動它。系統裡不裝任何東西，.venv 可直接刪。",
    "es": "Copia .env.example a .env cuando no existe y genera el token dentro (solo informa de que lo hizo, nunca del valor, y deja .env en modo 600); busca Python 3.11, crea .venv e instala gateway/requirements.txt (solo en el primer arranque); levanta el nodo en 127.0.0.1:5225 y la pasarela en 0.0.0.0:8080, sondea /healthz y luego imprime la URL de la consola, el origen del lado del teléfono y dónde vive el token. Ctrl-C detiene la pasarela y cualquier nodo que el script arrancó; un nodo que ya tuvieras corriendo es tuyo y se respeta. No se instala nada en el sistema y .venv se puede borrar.",
    "pl": "Kopiuje .env.example do .env, gdy tego nie ma, i generuje w nim token (zgłasza tylko fakt, nigdy wartości, i zostawia .env w trybie 600); znajduje Pythona 3.11, tworzy .venv i instaluje gateway/requirements.txt (tylko przy pierwszym uruchomieniu); podnosi węzeł na 127.0.0.1:5225 i bramę na 0.0.0.0:8080, sprawdza /healthz, a potem drukuje adres konsoli, źródło po stronie telefonu i miejsce, w którym token mieszka. Ctrl-C zatrzymuje bramę i każdy węzeł startowany przez skrypt; węzeł, który już prowadzisz, jest twój i skrypt go nie tyka. Systemowo nic nie jest instalowane, a .venv można usunąć.",
    "ja": "スクリプトは .env が無いときに .env.example をコピーしてその中でトークンを生成します（生成した事実だけを報告し、値は出さず、.env はモード 600 のまま）。Python 3.11 を探して .venv を作り、gateway/requirements.txt を導入するのは初回実行時だけです。ノードを 127.0.0.1:5225、ゲートウェイを 0.0.0.0:8080 で起動し、/healthz を確認してから、コンソールの URL・スマホ側の origin・トークンの保存場所を表示します。Ctrl-C はゲートウェイと、スクリプトが起動したノードを止めます。あなたが既に動かしていたノードには手をつけません。システムには何もインストールされず、.venv はそのまま削除できます。",
    "th": "สคริปต์จะคัดลอก .env.example เป็น .env เมื่อไฟล์ยังไม่มี แล้วสร้างโทเคนไว้ในนั้น (รายงานแค่ว่าสร้างให้ ไม่ได้พิมพ์ค่า และทิ้ง .env ไว้ที่โหมด 600) มันมองหา Python 3.11 สร้าง .venv แล้วลง gateway/requirements.txt (เฉพาะรอบแรกเท่านั้น) เปิดโหนดที่ 127.0.0.1:5225 และ gateway ที่ 0.0.0.0:8080 ตรวจ /healthz ก่อนพิมพ์ที่อยู่คอนโซล origin ฝั่งมือถือ และตำแหน่งที่เก็บโทเคน Ctrl-C หยุด gateway กับโหนดที่สคริปต์เป็นคนเปิด ส่วนโหนดที่คุณรันอยู่แล้วเป็นของคุณ สคริปต์ไม่แตะ ในระบบไม่มีอะไรติดตั้งเลย และ .venv ลบทิ้งได้",
    "fi": "Se kopioi .env.example-tiedoston .env:ksi, jos sitä ei ole, ja luo tokenin sisään (ilmoittaen vain että tekee, ei koskaan arvoa, ja jättäen .env tilaan 600); se löytää Python 3.11:n, luo .venv-tiedoston ja asentaa gateway/requirements.txtin (vain ensimmäisellä ajokerralla); se käynnistää solmun osoitteessa 127.0.0.1:5225 ja gatewayn osoitteessa 0.0.0.0:8080, koittaa /healthz ja tulostaa sitten konsolin URL-osoitteen, puhelimella käytettävän originin sekä sen, missä token on. Ctrl-C pysäyttää gatewayn ja skriptin käynnistämän solmun; sinun itsesi käynnistämä solmu on sinun eikä skripti koske siihen. Järjestelmään ei asenneta mitään, ja .venv voi poistaa.",
    "uk": "Він копіює .env.example у .env, якщо того ще немає, і генерує в ньому токен (повідомляє лише про сам факт, ніколи про значення, і лишає .env у режимі 600); знаходить Python 3.11, створює .venv і встановлює gateway/requirements.txt (лише під час першого запуску); піднімає вузол на 127.0.0.1:5225 і шлюз на 0.0.0.0:8080, перевіряє /healthz, після чого друкує адресу консолі, адресу для телефону й місце, де лежить токен. Ctrl-C зупиняє шлюз і той вузол, який запустив скрипт; ваш власний запущений вузол лишається в спокої. У системі нічого не встановлюється, а .venv можна видалити.",
    "bg": "Той копира .env.example в .env, когато го няма, и генерира токена вътре (съобщава само че го е направил, никога стойността, и оставя .env в режим 600); намира Python 3.11, създава .venv и инсталира gateway/requirements.txt (само при първо изпълнение); вдига възела на 127.0.0.1:5225 и шлюза на 0.0.0.0:8080, проверява /healthz и после печата адреса на конзолата, произхода от страната на телефона и къде се намира токенът. Ctrl-C спира шлюза и възела, пуснат от скрипта; възел, който вече вашият изпълнява, е ваш и не се пипа. Нищо не се инсталира в системата и .venv може да се изтрие.",
    "tr": "Script .env yoksa .env.example dosyasını kopyalayıp tokeni içinde üretir (yalnızca ürettiğini bildirir, değeri asla yazdırmaz ve .env'i 600 modunda bırakır); Python 3.11'i bulur, .venv oluşturur ve gateway/requirements.txt kurar (ilk çalıştırmada); 127.0.0.1:5225'deki düğüm ile 0.0.0.0:8080'deki ağ geçidini ayağa kaldırır, /healthz'i yoklar, sonra konsol adresini, telefon tarafının origin'ini ve token'ın nerede olduğunu yazar. Ctrl-C, ağ geçidini ve betiğin başlattığı düğümü durdurur; zaten sizin çalıştırdığınız düğmeye dokunmaz. Sisteme hiçbir şey kurulmaz ve .venv silinebilir.",
    "hu": "A szkript, ha nincs .env, átmásolja a .env.example-t .env-be, és legenerálja benne a tokent (csak arról tájékoztat, hogy megtette, az értékről soha, és 600 módban hagyja a fájlt); megtalálja a Python 3.11-et, létrehozza a .venv-környezetet és telepíti a gateway/requirements.txt fájlt (csak az első futáskor); elindítja a csomópontot a 127.0.0.1:5225-ön és az átjárót a 0.0.0.0:8080-címen, leellenőrzi a /healthz végét, majd kinyomtatja a konzol URL-jét, a telefon oldali origin-t és a token helyét. A Ctrl-C leállítja az átjárót és a szkript által indított csomópontot; a már futó, a saját csomópontját nem bolygatja. A rendszerbe semmi nem települ, és a .venv törölhető.",
  } satisfies L,
  mCheckT: {
    en: "Preflight only",
    "ru": "Только предпроверка",
    "de": "Nur Vorabprüfung",
    "fr": "Pré-vérification seule",
    "it": "Solo preflight",
    "nl": "Alleen vooraf controleren",
    "cs": "Pouze předběžná kontrola",
    "zh-Hans": "只预检，不起进程",
    "zh-Hant": "只預檢，不起程序",
    "es": "Solo comprobación previa",
    "pl": "Tylko sprawdzanie wstępne",
    "ja": "事前チェックだけ",
    "th": "ตรวจล่วงหน้าอย่างเดียว",
    "fi": "Vain esitarkistus",
    "uk": "Лише попередня перевірка",
    "bg": "Само предварителна проверка",
    "tr": "Yalnızca ön kontrol",
    "hu": "Csak elő ellenőrzés",
  } satisfies L,
  mCheckC: {
    en: "--check reports whether Python 3.11 exists, which node binary it found, whether anything is listening on 5225, whether docker is present, whether .env exists, whether the admin token is set and the state of the official voucher key — then prints the LAN address plus the socket and database path a real run would use. It starts nothing and creates nothing.",
    "ru": "--check докладывать, есть ли Python 3.11, какой бинарный узел найден, слушает ли кто-то 5225, есть ли docker, существует ли .env, задан ли админ-токен и в каком состоянии официальный ключ вычислительных кодов — а затем печатает LAN-адрес машины плюс сокет и путь к базе данных, которые использовал бы реальный запуск. Он ничего не запускает и ничего не создаёт.",
    "de": "--check meldet, ob Python 3.11 existiert, welche Node-Binary gefunden wurde, ob auf 5225 jemand lauscht, ob docker vorhanden ist, ob .env existiert, ob das Admin-Token gesetzt ist und wie der offizielle Voucher-Schüssel dasteht — und printet dann die LAN-Adresse plus Socket und Datenbankpfad, die ein echter Lauf benutzen würde. Er startet nichts und erzeugt nichts.",
    "fr": "--check indique si Python 3.11 existe, quel binaire de nœud a été trouvé, si quelqu'un écoute sur 5225, si docker est présent, si .env existe, si le jeton d'administration est défini et quel est l'état de la clé officielle des codes de calcul — puis affiche l'adresse LAN ainsi que la socket et le chemin de base de données qu'utiliserait une vraie exécution. Il ne lance rien et ne crée rien.",
    "it": "--check riporta se Python 3.11 esiste, quale binario del nodo è stato trovato, se qualcuno ascolta sulla 5225, se docker è presente, se .env esiste, se il token di amministrazione è impostato e com'è lo stato della chiave ufficiale dei voucher; poi stampa l'indirizzo LAN più il socket e il percorso del database che una esecuzione reale userebbe. Non avvia nulla e non crea nulla.",
    "nl": "--check meldt of Python 3.11 bestaat, welke node-binary het vond, of er iemand op 5225 luistert, of docker aanwezig is, of .env bestaat, of het admin-token is gezet en hoe het staat met de officiële voucher-sleutel — en print daarna het LAN-adres plus de socket en het databasepad die een echte run zou gebruiken. Het start niets en maakt niets.",
    "cs": "--check hlásí, jestli existuje Python 3.11, který binární soubor uzlu našel, jestli něco naslouchá na 5225, jestli je přítomen docker, jestli existuje .env, jestli je nastaven admin token a v jakém stavu je oficiální klíč voucherů — pak vytiskne LAN adresu spolu se soklem a cestou k databázi, které by použil reálný běh. Nic nespustí a nic nevytvoří.",
    "zh-Hans": "--check 报告 Python 3.11 在不在、找到哪个节点二进制、5225 上有没有人在听、docker 在不在、.env 是否存在、管理令牌是否已设、官方算力码公钥的状态，最后给出本机 LAN 地址与这次会用到的套接字和数据库路径。它什么都不启动，也什么都不创建。",
    "zh-Hant": "--check 報告 Python 3.11 在不在、找到哪個節點二元檔、5225 上有沒有人在聽、docker 在不在、.env 是否存在、管理權杖是否已設、官方算力碼公鑰的狀態，最後給出本機 LAN 位址與這次會用到的連線埠和資料庫路徑。它什麼都不啟動，也什麼都不建立。",
    "es": "--check informa de si existe Python 3.11, qué binario de nodo encontró, si alguien escucha en el 5225, si docker está presente, si .env existe, si el token de administración está definido y en qué estado está la clave oficial de los códigos; después imprime la dirección LAN más el socket y la ruta de la base de datos que usaría una ejecución real. No arranca nada y no crea nada.",
    "pl": "--check raportuje, czy istnieje Python 3.11,który binarny węzła został znaleziony, czy ktoś nasłuchuje na 5225, czy docker jest obecny, czy plik .env istnieje, czy token administratora jest ustawiony oraz w jakim stanie jest oficjalny klucz kodów obliczeniowych — a następnie drukuje adres LAN wraz z gniazdem i ścieżką do bazy danych, których użyłby prawdziwy start. Nic nie uruchamia i nic nie tworzy.",
    "ja": "--check は、Python 3.11 が有るか、ノードバイナリとして何を見つけたか、5225 を聞いているプロセスがあるか、docker は有るか、.env は存在するか、管理トークンが設定済みか、公式クレジットコード鍵の状態は何かを報告し、最後にこの Mac の LAN アドレスと、実際の実行で使われるソケットおよびデータベースのパスを表示します。何も起動せず、何も作成しません。",
    "th": "--check จะรายงานให้ทราบว่า มี Python 3.11 หรือไม่, เจอไบนารีของโหนดตัวไหน, มีอะไรฟังอยู่ที่พอร์ต 5225, docker มีอยู่ไหม, ไฟล์ .env มีไหม, ตั้งโทเคนผู้ดูแลหรือยัง และคีย์ทางการของโค้ดเครดิตอยู่ในสถานะไหน แล้วถึงพิมพ์ที่อยู่ LAN พร้อมซ็อกเก็ตและเส้นทางฐานข้อมูล ที่การรันจริงจะใช้ มันไม่ได้เริ่มอะไรทั้งหมดและไม่สร้างไฟล์ใด ๆ",
    "fi": "--check kertoo, onko Python 3.11 olemassa, minkä solmubinaarin se löysi, kuunteleeko joku porttia 5225, onko dockeria, onko .env olemassa, onko ylläpilotunnus asetettu ja missä kunnossa virallinen voucher-avain on — minkä jälkeen se tulostaa LAN-osoitteen sekä sen socketin ja tietokantapolun, jota oikea ajokerta käyttäisi. Se ei käynnistä mitään eikä luo mitään.",
    "uk": "--check доповідає, чи є Python 3.11, який бінарний вузол знайдено, чи хтось слухає 5225, чи є docker, чи існує .env, чи задано адмін-токен і в якому стані офіційний ключ облікових кодів — а тоді друкує LAN-адресу машини плюс сокет і шлях до бази даних, які використав би реальний запуск. Він нічого не запускає і нічого не створює.",
    "bg": "--check докладва дали има Python 3.11, кой двоичен файл на възела е намерен, дали някой слуша на 5225, дали има docker, дали .env съществува, дали административният токен е зададен и в какъв състояние е официалният ключ на кодовете — после печата LAN адреса плюс сокета и пътя към базата, които реалното изпълнение би използвало. Нищо не стартира и нищо не създава.",
    "tr": "--check, Python 3.11'in var olduğunu, hangi düğüm ikili dosyasını bulduğunu, 5225'i dinleyen biri olup olmadığını, docker'in kurulu olup olmadığını, .env dosyasının varlığını, yönetici jetonunun ayarlanıp ayarlanmadığını ve resmî kupon anahtarının durumunu bildirir — ardından gerçek bir çalıştırmanın kullanacağı LAN adresini, soketi ve veritabanı yolunu yazar. Hiçbir şey başlatmaz, hiçbir şey oluşturmaz.",
    "hu": "A --check jelentést ad arról, létezik-e Python 3.11, melyik csomópont-binárist találta, figyel-e valaki az 5225-ös porton, telepítve van-e a docker, létezik-e a .env, beállították-e az adminisztrátori tokent, és milyen állapotban van a hivatalos utalvány-kulcs — majd kinyomtatja a LAN-címet, azt a foglalatot és adatbázis-útvonalat, amelyeket egy valódi futtatás használna. Semmit nem indít el és semmit nem hoz létre.",
  } satisfies L,
  mTokenT: {
    en: "When you want the token printed",
    "ru": "Когда токен нужно распечатать",
    "de": "Wenn Sie das Token ausgedruckt sehen wollen",
    "fr": "Quand vous voulez voir le jeton",
    "it": "Quando vuoi stampa il token",
    "nl": "Wanneer u het token wilt zien",
    "cs": "Když chcete token vytisknout",
    "zh-Hans": "要把令牌打印出来",
    "zh-Hant": "要把權杖列印出來",
    "es": "Cuando quieres ver el token impreso",
    "pl": "Kiedy chcesz wydrukować token",
    "ja": "トークンを表示させたいとき",
    "th": "เมื่อต้องการให้พิมพ์โทเคนออกมา",
    "fi": "Kun haluat tulostaa tokenin",
    "uk": "Коли потрібно роздрукувати токен",
    "bg": "Когато искате токенът да се отпечата",
    "tr": "Jetonu yazdırmak istediğinizde",
    "hu": "Amikor ki szeretné nyomtatni a tokent",
  } satisfies L,
  mTokenC: {
    en: "By default only the path that holds the token is printed; --show-token prints the value itself, which you can also read straight out of the development .env at the repository root.",
    "ru": "По умолчанию печатается только путь, где лежит токен; --show-token печатает само значение, которое можно и напрямую прочитать из служебного .env в корне репозитория.",
    "de": "Standardmäßig wird nur der Pfad ausgegeben, der das Token enthält; --show-token printet den Wert selbst, den Sie auch direkt aus der Entwicklungs-.env im Repository-Wurzel lesen können.",
    "fr": "Par défaut, seul le chemin contenant le jeton est affiché ; --show-token imprime la valeur elle-même, que vous pouvez aussi lire directement dans le .env de développement à la racine du dépôt.",
    "it": "Per impostazione predefinita viene stampato solo il percorso che contiene il token; --show-token stampa il valore stesso, che puoi anche leggere direttamente dal .env di sviluppo nella radice del repository.",
    "nl": "Standaard wordt alleen het pad getoond waarin het token staat; --show-token print de waarde zelf, die u ook rechtstreeks uit de development-.env in de repository-root kunt lezen.",
    "cs": "Ve výchozím nastavení se tiskne pouze cesta, kde token bydlí; --show-token vytiskne hodnotu samu, kterou lze navíc přečíst přímo ze vývojového .env v kořeni repozitáře.",
    "zh-Hans": "默认只打印令牌所在的文件位置；--show-token 把 POPOPX_ADMIN_TOKEN 的值打给你。值本身也可以直接从 .env 里读出来——开发令牌就写在仓库根目录那份文件里。",
    "zh-Hant": "預設只列印權杖所在的檔案位置；--show-token 會把 POPOPX_ADMIN_TOKEN 的值打給你。值本身也可以直接從 .env 讀出來——開發權杖就寫在倉庫根目錄那份檔裡。",
    "es": "Por defecto solo se imprime la ruta que contiene el token; --show-token imprime el valor en sí, que además puedes leer directamente del .env de desarrollo en la raíz del repositorio.",
    "pl": "Domyślnie drukowana jest wyłącznie ścieżka zawierająca token; --show-token wypisuje samą wartość, którą można też wprost odczytać z deweloperskiego .env w głównym katalogu repozytorium.",
    "ja": "既定ではトークンを格納しているファイルの場所だけが画面に出ます。--show-token は値そのものを表示します。開発用のトークンはリポジトリ直下の .env にそのまま書いてあるので、そこから読むこともできます。",
    "th": "ตามค่าเริ่มต้นจะพิมพ์เฉพาะเส้นทางที่เก็บโทเคน ส่วน --show-token จะพิมพ์ตัวค่าออกมาเลย ซึ่งคุณอ่านค่าเดียวกันนี้ได้ตรง ๆ จากไฟล์ .env สำหรับพัฒนาที่อยู่-root ของรีโปเช่นกัน",
    "fi": "Oletuksena tulostetaan vain polku, jossa token on; --show-token tulostaa itse arvon, jonka voit lukea myös suoraan repositoriossa juuressa olevalta kehitys-.env-tiedostolta.",
    "uk": "Типово друкується лише шлях, де лежить токен; --show-token друкує саме значення, яке можна також прочитати напряму зі службового .env у корені репозиторію.",
    "bg": "По подразбиране се печата само пътят, където е токенът; --show-token печата самата стойност, която може да прочетете и директно от разработъчния .env в корена на хранилището.",
    "tr": "Varsayılan olarak yalnızca jetonun bulunduğu dosyanın yolu yazdırılır; --show-token değerin kendisini yazdırır — bu değeri ayrıca depo kökündeki geliştirme .env dosyasından doğrudan da okuyabilirsiniz.",
    "hu": "Alapértelmezésben csak az a elérési út jelenik meg, amely a toket tartalmazza; a --show-token magát az értéket nyomtatja ki, amely egyébként közvetlenül is elolvasható a gyökérben lévő fejlesztői .env fájlból.",
  } satisfies L,
  mNodeT: {
    en: "Attach to your own node, or move the port",
    "ru": "Подключиться к своему узлу или сменить порт",
    "de": "An Ihren eigenen Node anhängen oder den Port verschieben",
    "fr": "Se brancher sur votre propre nœud, ou changer de port",
    "it": "Agganciatevi al vostro nodo, oppure spostate la porta",
    "nl": "Aanhaak op uw eigen node, of verhuis de poort",
    "cs": "Napojte se na svůj uzel, nebo přesuňte port",
    "zh-Hans": "接你已经跑着的节点，或换个端口",
    "zh-Hant": "接你已經跑著的節點，或換個埠",
    "es": "Engánchate a tu propio nodo o mueve el puerto",
    "pl": "Podłącz się do własnego węzła albo przenieś port",
    "ja": "自分で立てたノードに接続する、ポートを変える",
    "th": "ต่อเข้ากับโหนดของคุณเอง หรือย้ายพอร์ต",
    "fi": "Liity omaan solmuusi, tai siirrä portti",
    "uk": "Підключитися до власного вузла або змінити порт",
    "bg": "Прикачете се към ваш собствен възел или преместете порта",
    "tr": "Kendi düğümünüze bağlanın ya da portu taşıyın",
    "hu": "Kapcsolódjon a saját csomópontjához, vagy helyezze át a portot",
  } satisfies L,
  mNodeC: {
    en: "--no-node stops the script from starting one and makes it assume a node already answers on 127.0.0.1:5225; --node-bin PATH points at a binary directly and --node-port N moves the port (the gateway's POPOPX_NODE_WS_URL follows). --host changes the bind address (default 0.0.0.0); the two port numbers, --port and --node-port, are validated as 1 to 65535 before anything starts. A node that is not up yet is not fatal — see the verification block below.",
    "ru": "--no-node запрещает скрипту запускать узел и заставляет его считать, что на 127.0.0.1:5225 уже кто-то отвечает; --node-bin PATH задаёт бинарник напрямую, --node-port N меняет порт (POPOPX_NODE_WS_URL на стороне шлюза следует за ним). --host меняет адрес привязки (типово 0.0.0.0); как 1–65535 до запуска проверяются оба номера портов, --port и --node-port. Если узел не поднялся, это не фатально, см. блок проверки ниже.",
    "de": "--no-node hindert das Skript daran, einen Node zu starten, und lässt es annehmen, dass auf 127.0.0.1:5225 bereits einer antwortet; --node-bin PATH zeigt direkt auf ein Binary und --node-port N verschiebt den Port (POPOPX_NODE_WS_URL des Gateways folgt). --host ändert die Bind-Adresse (Standard 0.0.0.0); die beiden Portnummern --port und --node-port werden vor dem Start als 1 bis 65535 geprüft. Ein Node, der nicht hochkommt, ist nicht fatal — siehe den Verifikationsblock unten.",
    "fr": "--no-node empêche le script de démarrer un nœud et le fait supposer qu'un nœud répond déjà sur 127.0.0.1:5225 ; --node-bin PATH pointe directement sur un binaire et --node-port N déplace le port (le POPOPX_NODE_WS_URL de la passerelle suit). --host change l'adresse de liaison (par défaut 0.0.0.0) ; les deux numéros de port, --port et --node-port, sont validés entre 1 et 65535 avant tout démarrage. Un nœud pas encore levé n'est pas fatal — voir le bloc de vérification plus bas.",
    "it": "--no-node impedisce allo script di avviare un nodo e gli fa presumere che uno risponda già su 127.0.0.1:5225; --node-bin PATH indica direttamente un binario e --node-port N sposta la porta (il POPOPX_NODE_WS_URL del gateway la segue). --host cambia l'indirizzo di bind (default 0.0.0.0); i due numeri di porta, --port e --node-port, sono validati tra 1 e 65535 prima di avviare qualsiasi cosa. Un nodo che non è su non è fatale: vedi il blocco di verifica sotto.",
    "nl": "--no-node verhinderd dat het script een node start en laat het aannemen dat er al een antwoordt op 127.0.0.1:5225; --node-bin PATH wijst rechtstreeks naar een binary en --node-port N verhuist de poort (de POPOPX_NODE_WS_URL van de gateway volgt). --host verandert het bind-adres (standaard 0.0.0.0); de twee poortnummers --port en --node-port worden gevalideerd als 1 tot 65535 voordat er iets start. Een node die niet opstaat, is niet fataal — zie het verificatieblok hieronder.",
    "cs": "--no-node zabrání skriptu spustit uzel a nechá ho předpokládat, že na 127.0.0.1:5225 už někdo odpovídá; --node-bin PATH ukazuje přímo na binárku a --node-port N přesune port (POPOPX_NODE_WS_URL brány to následuje). --host mění bind adresu (výchozí 0.0.0.0); obě čísla portů, --port a --node-port, se ověřují jako 1 až 65535, než něco vstane. Když uzel nevstane, není to fatální — viz ověřovací blok níže.",
    "zh-Hans": "--no-node 让脚本不去起节点，只假设 127.0.0.1:5225 上已经有一个；--node-bin PATH 直接指定二进制，--node-port N 改端口（网关侧的 POPOPX_NODE_WS_URL 跟着改）。--host 改绑定位址（默认 0.0.0.0）；--port 与 --node-port 这两个端口号都必须是 1 到 65535，脚本先验再启动。节点没起来不是致命错误，见下面「验证起来了」。",
    "zh-Hant": "--no-node 讓腳本不去起節點，只假設 127.0.0.1:5225 上已經有一個；--node-bin PATH 直接指定二元檔，--node-port N 改埠（閘道側的 POPOPX_NODE_WS_URL 跟著改）。--host 改綁定位址（預設 0.0.0.0）；--port 與 --node-port 這兩個埠號都必須是 1 到 65535，腳本先驗再啟動。節點沒起來不是致命錯誤，見下面「驗證起來了」。",
    "es": "--no-node impide que el script arranque un nodo y le hace suponer que ya uno responde en 127.0.0.1:5225; --node-bin PATH apunta a un binario concreto y --node-port N cambia el puerto (el POPOPX_NODE_WS_URL de la pasarela lo sigue). --host cambia la dirección de enlace (por defecto 0.0.0.0); los dos números de puerto, --port y --node-port, se validan como 1 a 65535 antes de arrancar nada. Que el nodo no esté levantado no es fatal: mira el bloque de verificación más abajo.",
    "pl": "--no-node zabrania skryptowi startować węzeł i każe mu zakładać, że na 127.0.0.1:5225 już ktoś odpowiada; --node-bin PATH wskazuje wprost na plik binarny, a --node-port N przesuwa port (POPOPX_NODE_WS_URL bramy podąża za nim). --host zmienia adres wiązania (domyślnie 0.0.0.0); oba numery portów, --port i --node-port, są sprawdzane jako 1–65535, zanim cokolwiek wystartuje. Węzeł, który nie wstał, nie jest błędem krytycznym — zobacz blok weryfikacji poniżej.",
    "ja": "--no-node を付けるとスクリプトはノードを起動せず、127.0.0.1:5225 に既に応答があるものとして振る舞います。--node-bin PATH でバイナリを直接指定でき、--node-port N でポートを動かせます（ゲートウェイ側の POPOPX_NODE_WS_URL も追随します）。--host はバインドアドレス（既定は 0.0.0.0）を変えますが、ポート番号は --port と --node-port の 2 つとも、起動前に 1 から 65535 の値として検証されます。ノードが上がっていないのは致命的ではないので、下の「検証起来了」のブロックを参照してください。",
    "th": "--no-node ทำให้สคริปต์ไม่เปิดโหนดเองและสมมติว่ามีโหนดตอบอยู่ที่ 127.0.0.1:5225 แล้ว; --node-bin PATH ใช้ระบุไบนารีโดยตรง ส่วน --node-port N ย้ายพอร์ต (ตัว POPOPX_NODE_WS_URL ทางฝั่ง gateway จะเปลี่ยนตาม) --host เปลี่ยน address ที่ bind (ค่าเริ่มต้น 0.0.0.0) ส่วนพอร์ตสองตัวคือ --port กับ --node-port ที่สคริปต์ตรวจว่าต้องอยู่ระหว่าง 1 ถึง 65535 ก่อนเริ่มงาน การที่โหนดยังไม่ขึ้นไม่ใช่ความผิดพลาดร้ายแรง ดูบล็อกการตรวจสอบข้างล่าง",
    "fi": "--no-node estää skriptiä käynnistämästä solmua ja olettaa jonkun jo vastaavan osoitteessa 127.0.0.1:5225; --node-bin PATH osoittaa suoraan binääriin ja --node-port N siirtää portin (gatewayn POPOPX_NODE_WS_URL seuraa perässä). --host muuttaa sitoutumisosoitetta (oletus 0.0.0.0); ja molemmat porttinumerot, --port ja --node-port, tarkistetaan arvoiksi 1–65535 ennen mitään käynnistystä. Solmun puuttuminen ei ole kohtalokasta — ks. alla oleva varmistuslohko.",
    "uk": "--no-node забороняє скрипту запускати вузол і змушує вважати, що на 127.0.0.1:5225 хтось уже відповідає; --node-bin PATH задає бінарник напряму, --node-port N змінює порт (POPOPX_NODE_WS_URL на боці шлюза йде за ним). --host змінює адресу прив'язки (типово 0.0.0.0), і обидва номери портів, --port і --node-port, перевіряються як 1–65535 перед запуском. Якщо вузол не підвівся — це не фатально, див. блок перевірки нижче.",
    "bg": "--no-node не позволява на скрипта да стартира възел и го кара да предполага, че на 127.0.0.1:5225 вече някой отговаря; --node-bin PATH сочи директно към двоичен файл, а --node-port N мести порта (POPOPX_NODE_WS_URL на шлюза следва промяната). --host променя адреса на bind (по подразбиране 0.0.0.0), и двата портови номера, --port и --node-port, се проверяват като 1 до 65535 преди да стартира каквото и да е. Възел, който не е горе, не е фатален — вижте блока за проверка по-долу.",
    "tr": "--no-node, betiğin düğüm başlatmasını engeller ve 127.0.0.1:5225 adresinde zaten birinin yanıt verdiğini varsayar; --node-bin PATH doğrudan bir ikili dosyayı gösterir, --node-port N ise portu taşır (ağ geçidinin POPOPX_NODE_WS_URL değeri buna uyar). --host bağlama adresini değiştirir (varsayılan 0.0.0.0); --port ve --node-port ikisi de hiçbir şey başlamadan önce 1–65535 aralığında doğrulanır. Düğümün ayağa kalkmamış olması ölümcül değildir — aşağıdaki doğrulama bloğuna bakın.",
    "hu": "--no-node megakadályozza, hogy a szkript csomópontot indítson, és azt feltételezi, hogy a 127.0.0.1:5225 alatt már valaki válaszol; a --node-bin PATH közvetlenül egy binárist jelöl meg, a --node-port N áttelepíti a portot (az átjáró POPOPX_NODE_WS_URL értéke követi). A --host a kötési címet módosítja (alapértelmezés 0.0.0.0), a --port és a --node-port portszámot pedig indulás előtt 1 és 65535 között ellenőrzi. Hogy a csomópont még nem kelt fel, nem végzetes — lásd az alábbi ellenőrzési blokkot.",
  } satisfies L,
  pairTitle: {
    en: "Pairing with a real iPhone",
    "ru": "Сопряжение с настоящим iPhone",
    "de": "Koppeln mit einem echten iPhone",
    "fr": "Appairer avec un vrai iPhone",
    "it": "Abbinamento con un iPhone reale",
    "nl": "Koppelen met een echte iPhone",
    "cs": "Párování se skutečným iPhonem",
    "zh-Hans": "和一台真实 iPhone 联调",
    "zh-Hant": "和一臺真實 iPhone 聯調",
    "es": "Emparejar con un iPhone real",
    "pl": "Parowanie z prawdziwym iPhone'em",
    "ja": "実物の iPhone と連携する",
    "th": "จับคู่กับ iPhone เครื่องจริง",
    "fi": "Aitoon iPhoneen parittaminen",
    "uk": "Спряження зі справжнім iPhone",
    "bg": "Сдвояване с истински iPhone",
    "tr": "Gerçek bir iPhone ile eşleştirme",
    "hu": "Párosítás valódi iPhone-nal",
  } satisfies L,
  pairBody: {
    en: "The script binds the gateway to 0.0.0.0 and sets POPOPX_PUBLIC_BASE_URL for this run only to http://<this Mac's LAN IP>:8080 — nothing is written back to .env, so git diff stays clean. Put the phone on the same Wi-Fi and open that printed http://<LAN-IP>:8080; PopopxH5Launcher accepts http as well as https. Development only: the session secret's HMAC travels in cleartext, and a phone on guest Wi-Fi leaks it to the whole segment. What the phone actually dials for pairing is the relay address, not this LAN IP.",
    "ru": "Скрипт вешает шлюз на 0.0.0.0 и задаёт POPOPX_PUBLIC_BASE_URL только на этот запуск как http://<LAN IP этого Mac>:8080 — в .env ничего не пишется, git diff остаётся чистым. Поставьте телефон в ту же Wi-Fi и откройте напечатанный http://<LAN-IP>:8080; PopopxH5Launcher принимает и http, и https. Только для разработки: HMAC сессионного секрета идёт открытым текстом, и телефон в гостевой сети раздаст его всему сегменту. Для реального сопряжения телефон набирает адрес контакта на ретрансляторе, а не этот LAN IP.",
    "de": "Das Skript bindet das Gateway an 0.0.0.0 und setzt POPOPX_PUBLIC_BASE_URL nur für diesen Lauf auf http://<LAN-IP dieses Mac>:8080 — in die .env wird nichts zurückgeschrieben, git diff bleibt sauber. Legen Sie das Telefon ins gleiche Wi-Fi und öffnen Sie das gedruckte http://<LAN-IP>:8080; PopopxH5Launcher akzeptiert http wie https. Nur für Entwicklung: das HMAC des Sitzungsgeheimnisses reist im Klartext, und ein Telefon im Gast-WLAN leakt es an den ganzen Abschnitt. Was das Telefon zum wirklichen Koppeln anruft, ist die Kontaktadresse im Relay-Netz, nicht diese LAN-IP.",
    "fr": "Le script lie la passerelle sur 0.0.0.0 et règle POPOPX_PUBLIC_BASE_URL pour cette exécution seule sur http://<IP LAN de ce Mac>:8080 — rien n'est écrit dans .env, git diff reste propre. Mettez le téléphone sur le même Wi-Fi et ouvrez le http://<LAN-IP>:8080 affiché ; PopopxH5Launcher accepte http comme https. Développement seulement : le HMAC du secret de session circule en clair, et un téléphone sur un Wi-Fi invité le fuit vers tout le segment. Pour un appairage réel, le téléphone compose l'adresse du contact sur le relais, pas cette IP LAN.",
    "it": "Lo script lega il gateway a 0.0.0.0 e imposta POPOPX_PUBLIC_BASE_URL per questa sola esecuzione su http://<LAN IP di questo Mac>:8080 — niente viene scritto in .env, git diff resta pulito. Metti il telefono sulla stessa Wi-Fi e apri l'http://<LAN-IP>:8080 stampato; PopopxH5Launcher accetta http oltre che https. Solo per sviluppo: l'HMAC del secret di sessione viaggia in chiaro, e un telefono su una rete ospiti lo regala a tutto il segmento. Per l'abbinamento reale il telefono compone l'indirizzo del contatto sul relay, non questo LAN IP.",
    "nl": "Het script bindt de gateway aan 0.0.0.0 en zet POPOPX_PUBLIC_BASE_URL voor deze enkele run op http://<LAN-IP van deze Mac>:8080 — er gaat niets terug naar .env, git diff blijft schoon. Zet de telefoon in dezelfde Wi-Fi en open het geprinte http://<LAN-IP>:8080; PopopxH5Launcher accepteert http net zo goed als https. Alleen voor ontwikkeling: de HMAC van het sessiegeheim reist in cleartext, en een telefoon op gastnetwerk lekt het naar het hele segment. Voor echte koppeling belt de telefoon het contactadres op de relay, niet dit LAN-IP.",
    "cs": "Skript naváže bránu na 0.0.0.0 a POPOPX_PUBLIC_BASE_URL nastaví jen pro tento běh na http://<LAN IP tohoto Macu>:8080 — do .env se nic nezapisuje, git diff zůstává čistý. Dejte telefon do stejné Wi-Fi a otevřete vytištěné http://<LAN-IP>:8080; PopopxH5Launcher přijímá http i https. Pouze pro vývoj: HMAC sekretu relace putuje v čistém textu a telefon na hostitelské síti ho prozradí celému segmentu. Při skutečném párování telefon volí adresu kontaktu na relayi, ne tohle LAN IP.",
    "zh-Hans": "脚本默认把网关绑在 0.0.0.0，并把这次运行的 POPOPX_PUBLIC_BASE_URL 设成 http://<本机 LAN IP>:8080——不写回 .env，git diff 保持干净。手机连同一个 Wi-Fi，用终端打印的那个 http://<LAN-IP>:8080 打开 H5 就行：客户端的 PopopxH5Launcher 接受 http。这只适合开发——会话密钥的 HMAC 在明文里跑，连上访客网络的手机会把它漏给同一网段的任何人。真正配对时手机拨的是中继上的联系人地址，不是这个 LAN IP。",
    "zh-Hant": "腳本預設把閘道綁在 0.0.0.0，並把這次執行的 POPOPX_PUBLIC_BASE_URL 設成 http://<本機 LAN IP>:8080——不寫回 .env，git diff 保持乾淨。手機連同一個 Wi-Fi，用終端機列印的那個 http://<LAN-IP>:8080 開 H5 就行：用戶端的 PopopxH5Launcher 接受 http。這只適合開發——工作階段金鑰的 HMAC 在明文裡跑，連上訪客網路的手機會把它漏給同一網段的任何人。真正配對時手機撥的是中繼上的聯絡人位址，不是這個 LAN IP。",
    "es": "El script enlaza la pasarela a 0.0.0.0 y fija POPOPX_PUBLIC_BASE_URL solo para esta ejecución a http://<IP LAN de este Mac>:8080 — nada se devuelve a .env, git diff se mantiene limpio. Pon el teléfono en la misma Wi-Fi y abre el http://<LAN-IP>:8080 impreso; PopopxH5Launcher acepta http igual que https. Solo para desarrollo: el HMAC del secreto de sesión viaja en texto claro, y un teléfono en red de invitados lo filtra a todo el segmento. Para el emparejamiento real el teléfono marca la dirección del contacto en el relay, no esta IP LAN.",
    "pl": "Skrypt wiąże bramę z 0.0.0.0 i ustawia POPOPX_PUBLIC_BASE_URL tylko na ten start na http://<adres LAN tego Maca>:8080 — nic nie wraca do .env, git diff pozostaje czysty. Włóż telefon do tej samej Wi-Fi i otwórz wydrukowane http://<LAN-IP>:8080; PopopxH5Launcher przyjmuje http tak samo jak https. Tylko do rozwoju: HMAC sekretu sesji leci jawnym tekstem, a telefon w gościnnej sieci wycieka nim do całego segmentu. Przy prawdziwym parowaniu telefon wybiera adres kontaktu w węźle przekaźnikowym, nie ten LAN IP.",
    "ja": "スクリプトはゲートウェイを 0.0.0.0 にバインドし、その回の POPOPX_PUBLIC_BASE_URL を http://<この Mac の LAN IP>:8080 に設定します。.env には書き戻さないので git diff はクリーンのままです。スマホを同じ Wi-Fi に繋いで、表示された http://<LAN-IP>:8080 を開けば、PopopxH5Launcher は http も https も受け付けます。開発専用としてください。セッション鍵の HMAC は平文で通るため、来客用 Wi-Fi のスマホはセグメント中の全員にそれを漏らします。実際にペアリングするときにスマホがかけるのは中継ノード上のコンタクトアドレスであり、この LAN IP ではありません。",
    "th": "สคริปต์จะ bind gateway ไว้ที่ 0.0.0.0 และตั้ง POPOPX_PUBLIC_BASE_URL เฉพาะรอบนี้เป็น http://<LAN IP ของ Mac เครื่องนี้>:8080 — ไม่เขียนกลับไปลง .env ดังนั้น git diff จะยังสะอาดอยู่ ตั้งมือถือให้เข้า Wi-Fi วงเดียวกันแล้วเปิด http://<LAN-IP>:8080 ที่พิมพ์ออกมา ตัว PopopxH5Launcher รับทั้ง http และ https ใช้ได้เฉพาะตอนพัฒนาเท่านั้น เพราะ HMAC ของค่าความลับเซสชันวิ่งเป็นข้อความชัด มือถือที่เข้าเครือข่ายแขกรับจะเผยมันออกไปทั้งวง สำหรับการจับคู่จริง มือถือจะเรียก address ของ contact บนตัว relay ไม่ใช่ LAN IP นี้",
    "fi": "Skripti sitoo gatewayn osoitteeseen 0.0.0.0 ja asettaa POPOPX_PUBLIC_BASE_URL tässä ajossa muotoon http://<tämän Macin LAN IP>:8080 — mitään ei kirjoitella .env:ään, joten git diff pysyy siistinä. Laita puhelin samaan Wi-Fihen ja avaa tulostettu http://<LAN-IP>:8080; PopopxH5Launcher hyväksyy http:n kuten https:n. Vain kehitykseen: istuntosalaisuuden HMAC kulkii selvänä tekstinä, ja vieraan verkon puhelin vuotaa sen koko segmentille. Aidossa parituksessa puhelin soittaa contact-osoitetta relay-verkossa, ei tätä LAN-IP:tä.",
    "uk": "Скрипт прив'язує шлюз до 0.0.0.0 і ставляє POPOPX_PUBLIC_BASE_URL лише на цей запуск як http://<LAN IP цього Mac>:8080 — у .env нічого не пишеться, git diff лишається чистим. Поставте телефон у ту саму Wi-Fi й відкрийте надрукований http://<LAN-IP>:8080; PopopxH5Launcher приймає і http, і https. Лише для розробки: HMAC сесійного секрету йде відкритим текстом, і телефон у гостьовій мережі роздасть його всьому сегменту. Для справжнього спряження телефон набирає адресу контакту на ретрансляторі, а не цей LAN IP.",
    "bg": "Скриптът обвързва шлюза с 0.0.0.0 и слага POPOPX_PUBLIC_BASE_URL само за това изпълнение на http://<LAN IP на този Mac>:8080 — нищо не се записва обратно в .env, git diff остава чист. Поставете телефона в същата Wi-Fi и отворете отпечатаното http://<LAN-IP>:8080; PopopxH5Launcher приема http така же и https. Само за разработка: HMAC-ът на сесиенната тайна пътува като ясен текст, а телефон в гостова мрежа го изпуска към целия сегмент. За истинско сдвояване телефонът набира адреса на контакта в релейната мрежа, не този LAN IP.",
    "tr": "Betik ağ geçidini 0.0.0.0'e bağlar ve POPOPX_PUBLIC_BASE_URL'i yalnızca bu çalıştırma için http://<bu Mac'in LAN IP>:8080 olarak ayarlar — .env'e hiçbir şey yazılmaz, git diff temiz kalır. Telefonu aynı Wi-Fi'a alın ve yazdırılan http://<LAN-IP>:8080 adresini açın; PopopxH5Launcher http'yi de https gibi kabul eder. Yalnızca geliştirme için: oturum sırrının HMAC'ı düz metin olarak gider, misafir ağındaki bir telefon bunu tüm ağa sızdırır. Gerçek eşleştirmede telefonun aradığı, röle üzerindeki kişi adresidir; bu LAN IP değil.",
    "hu": "A szkript az átjárót a 0.0.0.0-címhez köti, és a POPOPX_PUBLIC_BASE_URL-t csak erre a futásra állítja be http://<a Mac LAN IP-címe>:8080 alakban — a .env-be semmi nem íródik vissza, a git diff tiszta marad. Tegye a telefont ugyanabba a Wi-Fi-be, és nyissa meg a kinyomtatott http://<LAN-IP>:8080 címet; a PopopxH5Launcher az http-t is elfogadja, mint a https-t. Csak fejlesztéshez: a munkamenet-titok HMAC-ja nyílt szövegként utazik, és egy vendéghálózati telefon kiszivárogtatja azt az egész szegmensnek. A valódi párosításkor a telefon a relay-en lévő contact címet hívja, nem ezt a LAN IP-t.",
  } satisfies L,
  pairTrouble: {
    en: "When the iPhone cannot reach that address the script lists three causes in order of likelihood: the macOS application firewall has not allowed python3 (check the global state with the line above); the access point has client isolation on, which guest and corporate Wi-Fi do constantly and no setting on this Mac fixes — use another network or the phone's hotspot; or the contact address was generated for a different host, so re-share it from the console. Switching nodes means resetting the .data/ state, otherwise old pairwise uids get signed with secrets the new node never issued.",
    "ru": "Если iPhone не дотягивается до адреса, скрипт перечисляет три причины по убыванию вероятности: файрвол macOS не пропустил python3 (проверьте глобальное состояние строкой выше); точка доступа включила изоляцию клиентов — так сплошь и рядом делают гостевые и корпоративные Wi-Fi, и никакая настройка на этом Mac не поможет, меняйте сеть или идите в режим модема телефона; или адрес контакта был сгенерирован для другого хоста, тогда переопубликуйте его в консоли. Смена узла означает сброс состояния в .data/, иначе старые pairwise uid будут подписаны секретом, который новый узел никогда не выдавал.",
    "de": "Wenn das iPhone diese Adresse nicht erreicht, listet das Skript drei Ursachen nach Wahrscheinlichkeit: die macOS-Anwendungsfirewall hat python3 nicht erlaubt (prüfen Sie den globalen Zustand mit der Zeile oben); der Zugangspunkt hat Client-Isolation an, was Gast- und Firmen-WLANs ständig tun, und keine Einstellung auf diesem Mac repariert das — wechseln Sie das Netz oder gehen Sie auf den Hotspot des Telefons; oder die Kontaktadresse wurde für einen anderen Rechner erzeugt, dann teilen Sie sie in der Konsole neu. Der Wechsel des Node bedeutet den .data/-Zustand zurückzusetzen, sonst werden alte pairwise-uids mit Geheimnissen signiert, die der neue Node nie ausgegeben hat.",
    "fr": "Quand l'iPhone ne atteint pas cette adresse, le script énumère trois causes par ordre de probabilité : le pare-feu de l'application n'a pas autorisé python3 (vérifiez l'état global avec la ligne ci-dessus) ; le point d'accès a activé l'isolation des clients, ce que les réseaux invités et d'entreprise font constamment et qu'aucun réglage sur ce Mac ne corrige — changez de réseau ou passez par le partage de connexion du téléphone ; ou l'adresse du contact a été générée pour une autre machine, alors repartagez-la depuis la console. Changer de nœud veut dire réinitialiser l'état dans .data/, sinon les anciens uid pairwise sont signés avec des secrets que le nouveau nœud n'a jamais émis.",
    "it": "Quando l'iPhone non raggiunge quell'indirizzo, lo script elenca tre cause in ordine di probabilità: il firewall delle applicazioni di macOS non ha autorizzato python3 (controlla lo stato globale con la riga qui sopra); l'access point ha l'isolamento dei client attivo, cosa che reti ospiti e aziendali fanno di continuo e nessuna impostazione su questo Mac risolve — cambia rete o usa l'hotspot del telefono; oppure l'indirizzo del contatto è stato generato per un'altra macchina, quindi ricondividilo dalla console. Cambiare nodo significa azzerare lo stato in .data/, altrimenti i vecchi uid pairwise vengono firmati con secret che il nuovo nodo non ha mai emesso.",
    "nl": "Haalt de iPhone dat adres niet, dan somt het script drie oorzaken af in volgorde van waarschijnlijkheid: de macOS-toepassingsfirewall heeft python3 niet toegestaan (controleer de globale staat met de regel hierboven); het access point heeft client-isolatie aan, wat gast- en zakelijke netwerken voortdurend doen en geen instelling op deze Mac repareert — wissel van netwerk of ga op de hotspot van de telefoon; of het contactadres is voor een andere machine gegenereerd, dus deel het opnieuw vanuit de console. Van node wisselen betekent de .data/-status resetten, anders worden oude pairwise-uids gesigneerd met geheimen die de nieuwe node nooit uitgereikt heeft.",
    "cs": "Když se iPhone na tu adresu nedostane, skript vypíše tři příčiny podle pravděpodobnosti: firewall macOS neuvolnil python3 (stav zkontrolujte řádkem výše); access point má zaplou izolaci klientů, což Wi-Fi pro hosty a firemní sítě dělají neustále a žádné nastavení na tomto Macu to nespraví — přejte na jinou síť nebo na telefonní hotspot; nebo byla adresa kontaktu vygenerována pro jiný stroj, tak ji v konzoli znovu nasdílejte. Změna uzlu znamená reset stavu v .data/, jinak staré pairwise uid podepíšete sekret, který nový uzel nikdy nevydal.",
    "zh-Hans": "iPhone 到不了那个地址时，脚本按可能性高低列了三件事：一是 macOS 应用防火墙没放行 python3（先用上面那条查全局状态）；二是无线 AP 开了客户端隔离，访客与企业网络极常见，这个在本机改不好，换网络或用手机热点；三是这个联系人地址是为另一台主机生成的，回后台重新分享一个。换节点时把 .data/ 清掉，否则旧的 pairwise uid 会用新节点从没发过的密钥去签。",
    "zh-Hant": "iPhone 到不了那個位址時，腳本按可能性高低列了三件事：一是 macOS 應用防火牆沒放行 python3（先用上面那條查全域狀態）；二是無線 AP 開了用戶端隔離，訪客與企業網路極常見，這個在本機改不好，換網路或用手機熱點；三是這個聯絡人位址是為另一臺主機產生的，回後臺重新分享一個。換節點時把 .data/ 清掉，否則舊的 pairwise uid 會用新節點從沒發過的金鑰去簽。",
    "es": "Cuando el iPhone no llega a esa dirección, el script enumera tres causas por orden de probabilidad: el cortafuegos de aplicaciones de macOS no ha autorizado a python3 (comprueba el estado global con la línea de arriba); el punto de acceso tiene activado el aislamiento de clientes, algo que las Wi-Fi de invitados y corporativas hacen constantemente y ningún ajuste en este Mac arregla — cambia de red o usa el hotspot del teléfono; o la dirección del contacto se generó para otra máquina, así que vuelve a compartirla desde la consola. Cambiar de nodo significa reiniciar el estado en .data/, porque si no los viejos uid pairwise se firman con secretos que el nuevo nodo nunca emitió.",
    "pl": "Kiedy iPhone nie sięga tego adresu, skrypt wylicza trzy przyczyny wg prawdopodobieństwa: zapora aplikacji macOS nie przepuściła python3 (sprawdź stan globalny przywołaną wyżej linią); punkt dostępowy ma włączoną izolację klientów, co sieci gościnne i firmowe robią nagminnie, a żadne ustawienie na tym Macu nie pomoże — zmień sieć albo wejdź na hotspot telefonu; albo adres kontaktu został wygenerowany dla innego hosta, więc udostępnij go ponownie z konsoli. Zmiana węzła to reset stanu w .data/, inaczej stare pairwise uid są podpisywane sekretami, których nowy węzeł nigdy nie wydał.",
    "ja": "iPhone からそのアドレスに届かないとき、スクリプトは確からしさの順に3つを挙げます。macOS アプリケーションファイアウォールが python3 を許可していない（上の行でグローバル状態を確認する）。アクセスポイントでクライアント分離が有効になっている（来客用と企業 Wi-Fi ではごく普通で、この Mac の設定では直せません。ネットワークを変えるかスマホのテザリングにしてください）。あるいはそのコンタクトアドレスは別のホスト向けに生成されたものなので、コンソールで共有し直します。ノードを乗り換えるときは .data/ の状態もリセットしてください。古い pairwise uid が新しいノードの発行していない鍵で署名されてしまいます。",
    "th": "เมื่อ iPhone ไปไม่ถึง address นั้น สคริปต์จะไล่สาเหตุที่เป็นไปได้มากสุดก่อนสามข้อ: ไฟร์วอลล์ของแอปใน macOS ยังไม่ยอมให้ python3 ผ่าน (ใช้บรรทัดข้างบนตรวจสถานะทั้งระบบ) จุดกระจายสัญญาณเปิด client isolation ซึ่งเครือข่ายแขกรับและของบริษัทเปิดกันบ่อยมาก และไม่มี setting ใดบน Mac เครื่องนี้แก้ได้ — ต้องเปลี่ยนเครือข่ายหรือใช้ฮอตสปอตของมือถือ หรือ address ของ contact นี้ถูกสร้างไว้สำหรับอีก host หนึ่ง ก็กลับไปแชร์ใหม่จากหน้าคอนโซล ส่วนการเปลี่ยนโหนดหมายถึงต้องล้างสถานะใน .data/ ด้วย ไม่งั้น pairwise uid เก่าจะไปใช้คีย์ที่โหนดใหม่ไม่เคยออกมาก่อนมาเซ็น",
    "fi": "Kun iPhone ei tavoita osoitetta, skripti luettelee kolme syyttä todennäköisyysjärjestyksessä: macOSin sovelluspalomuuri ei ole päästänyt python3:a läpi (tarkista globaali tila yllä olevalla komennolla); tukiasemassa on asiakasieristys päällä, vieraan ja yritys-Wi-Fi tekevät sitä jatkuvasti, eikä mikään asetus tällä Macilla korjaa sitä — vaihda verkkoa tai mene puhelimen hotspotiin; tai contact-osoite on generoitu toiselle koneelle, joten jaa se uudelleen konsolista. Solmun vaihto tarkoittaa .data/-tilan nollaamista, muuten vanhat pairwise uidit signeerataan salaisuuksilla, joita uusi solmu ei ole koskaan julkaissut.",
    "uk": "Коли iPhone не дістається до адреси, скрипт перелічує три причини за спаданням ймовірності: файрвол застосунків macOS не пропустив python3 (перевірте глобальний стан рядком вище); точка доступу ввімкнула ізоляцію клієнтів — так суціль і пороблять гостьові та корпоративні Wi-Fi, і жодне налаштування на цьому Mac не допоможе, змініть мережу або йдіть у режим модема телефону; або адресу контакту згенеровано для іншого хоста, тож опублікуйте її в консолі заново. Зміна вузла означає скидання стану в .data/, інакше старі pairwise uid підписуватимуть секретом, який новий вузол ніколи не видавав.",
    "bg": "Когато iPhone не стига до адреса, скриптът изброява три причини по вероятност: приложният firewall на macOS не е пуснал python3 (проверете глобалното състояние с реда по-горе); достъпната точка има включена изолация на клиенти, което гостови и фирмени Wi-Fi правят постоянно и никаква настройка на този Mac не оправя — сменете мрежата или минете на hotspot на телефона; или адресът на контакта е генериран за друга машина, затова го споделете отново от конзолата. Смяната на възела означава нулиране на състоянието в .data/, иначе старите pairwise uid се подписват с тайни, които новият възел никога не е издавал.",
    "tr": "iPhone o adrese ulaşamıyorsa betik olasılık sırasıyla üç nedeni sayar: macOS uygulama güvenlik duvarı python3'e izin vermemiş (küresel durumu yukarıdaki satırla kontrol edin); erişim noktasında istemci yalıtımı açık — misafir ve kurumsal Wi-Fi ağları bunu sürekli yapar ve bu Mac'teki hiçbir ayar düzeltmez, ağı değiştirin ya da telefonun erişim noktasını kullanın; ya da kişi adresi başka bir makine için üretilmiştir, o hâlde konsoldan yeniden paylaşın. Düğüm değiştirmek .data/ durumunu sıfırlamak demektir; aksi hâlde eski pairwise uid'ler, yeni düğümün hiç vermediği sırlarla imzalanır.",
    "hu": "Ha az iPhone nem éri el a címet, a szkript három okot sorol valószínűség szerint: a macOS alkalmazástűzfal nem engedte át a python3-at (a fenti sorral ellenőrizheti a globális állapotot); a hozzáférési pont bekapcsolta az ügyfél-elválasztást, amit vendég- és vállalati Wi-Fi-k folyamatosan tesznek, és egyetlen Mac-beállítás ezt nem javítja — váltson hálózatot, vagy menjen a telefon hotspot-jára; vagy a contact cím másik gépre generálódott, tehát ossza meg újra a konzolból. A csomópont váltása a .data/ állapotának visszaállítását is jelenti, különben a régi pairwise uid-k olyan titkokkal aláíródnak, amelyeket az új csomópont soha nem adott ki.",
  } satisfies L,
  mVenvT: {
    en: "Developer path: venv + the full self-test",
    "ru": "Путь разработчика: venv + полный самотест",
    "de": "Entwicklerpfad: venv + kompletter Selbsttest",
    "fr": "Chemin développeur : venv + auto-test complet",
    "it": "Percorso da sviluppatore: venv + self-test completo",
    "nl": "Ontwikkelaarspad: venv + volledige zelftest",
    "cs": "Cesta vývojáře: venv + úplný self-test",
    "zh-Hans": "开发者路径：venv + 完整自检",
    "zh-Hant": "開發者路徑：venv + 完整自檢",
    "es": "Ruta de desarrollador: venv + autoprueba completa",
    "pl": "Ścieżka developera: venv + pełny test własny",
    "ja": "開発者向け：venv + 完全セルフテスト",
    "th": "เส้นทางนักพัฒนา: venv + การทดสอบตัวเองครบชุด",
    "fi": "Kehittäjän reitti: venv + täysi itsetestaus",
    "uk": "Шлях розробника: venv + повний само-тест",
    "bg": "Път на разработчика: venv + пълна самотест",
    "tr": "Geliştirici yolu: venv + tam öz-sınama",
    "hu": "Fejlesztői út: venv + teljes önellenőrzés",
  } satisfies L,
  mVenvC: {
    en: "The README's own words: 3.11 is the interpreter this suite is built and typed against, named in the first lines of requirements.txt, and both blocks start from the repository root. The README treats the last line the command itself prints as the authoritative count, so this page quotes no check total: a green run on a full install is 22 groups with no SKIPPED, and the exact number of checks is whatever --self-test prints on your own machine. A stdlib-only interpreter names exactly three groups SKIPPED — crypto_self_test, opaque_invite_self_test and http_self_test — and prints those paths are NOT verified here: those three ran zero checks, rather than ran and went uncounted, while the other nineteen still go green. What the README says about interpreters is the opposite of an “only 3.9” caveat: it measured 22 green groups on the 3.9.6 in the repository's own .venv and again on a fresh Homebrew 3.11.18 venv, both exit 0 with 2776 checks, and it took the second reading because requirements.txt pins ranges instead of exact versions, so the newer fastapi/starlette in that venv nested include_router() routes and the first HTTP sweep read 30 plugin routes as never mounted until the check learned to walk nested routers.",
    "ru": "Слова README: 3.11 — целевой интерпретатор этого набора, названный в первых строках requirements.txt, и оба блока запускаются из корня репозитория. README считает авторитетным счётом последнюю строку, которую печатает сама команда, поэтому эта страница не приводит итогового числа проверок: зелёный прогон полной установки — 22 группы без SKIPPED, а точное число проверок — то, что --self-test напечатает на вашей собственной машине. У интерпретатора только со stdlib ровно три группы помечаются SKIPPED — crypto_self_test, opaque_invite_self_test и http_self_test — плюс строка those paths are NOT verified here: эти три не выполнили ни одной проверки, а не «выполнились и не засчитались», остальные девятнадцать при этом зелёные. Про интерпретаторы README говорит обратное оговорке «только на 3.9»: 22 зелёные группы получены и на 3.9.6 из собственного .venv репозитория, и на свежем venv с Homebrew 3.11.18 — оба раза exit 0 и 2776 проверок; второе измерение потребовалось потому, что requirements.txt задаёт диапазоны, а не точные версии, и новый fastapi/starlette в том venv вложил маршруты include_router(), так что первый HTTP-обход счёл 30 маршрутов плагинов не смонтированными, пока проверка не научилась обходить вложенные роутеры.",
    "de": "Des READMEs eigene Worte: 3.11 ist der Zielinterpreter dieser Suite, genannt in den ersten Zeilen von requirements.txt, und beide Blöcke starten in der Repository-Wurzel. Das README erklärt die letzte Zeile, die der Befehl selbst ausdruckt, zur maßgeblichen Zahl; deshalb nennt diese Seite keine Check-Summe: ein grüner Lauf einer vollen Installation sind 22 Gruppen ohne SKIPPED, und die genaue Zahl der Checks ist das, was --self-test auf der eigenen Maschine ausdruckt. Ein reiner stdlib-Interpreter bekommt genau drei Gruppen als SKIPPED benannt — crypto_self_test, opaque_invite_self_test und http_self_test — plus die Zeile those paths are NOT verified here: diese drei führten null Checks aus, statt zu laufen und ungezählt zu bleiben, die übrigen neunzehn werden trotzdem grün. Was das README zu Interpretern sagt, ist das Gegenteil des Vorbehalts „nur auf 3.9“: 22 grüne Gruppen maß es sowohl auf dem 3.9.6 im eigenen .venv des Repository als auch in einem frischen Homebrew-3.11.18-venv, beide mit exit 0 und 2776 Checks, und die zweite Messung war nötig, weil requirements.txt Bereiche statt exakter Pins festlegt und das neuere fastapi/starlette in jenem venv include_router()-Routen verschachtelte, sodass der erste HTTP-Durchlauf 30 Plugin-Routen als nie gemountet las, bis die Prüfung lernte, verschachtelte Router zu durchlaufen.",
    "fr": "Les mots mêmes du README : 3.11 est l'interpréteur cible de cette suite, nommé dans les premières lignes de requirements.txt, et les deux blocs partent de la racine du dépôt. Le README fait de la dernière ligne imprimée par la commande elle-même le compte faisant autorité ; cette page ne cite donc aucun total de vérifications : un passage vert d'une installation complète, c'est 22 groupes sans SKIPPED, et le nombre exact de vérifications est celui que --self-test imprime sur votre propre machine. Un interpréteur limité à la stdlib se voit nommer exactement trois groupes SKIPPED — crypto_self_test, opaque_invite_self_test et http_self_test — plus la ligne those paths are NOT verified here : ces trois-là n'ont exécuté aucune vérification, au lieu d'avoir tourné sans être comptés, et les dix-neuf autres passent quand même au vert. Ce que le README dit des interpréteurs est l'inverse de la réserve « 3.9 seulement » : il a mesuré 22 groupes verts aussi bien sur le 3.9.6 du .venv du dépôt que dans un venv Homebrew 3.11.18 tout neuf, les deux avec exit 0 et 2776 vérifications, et cette seconde mesure était nécessaire parce que requirements.txt pose des plages et non des versions exactes, si bien que le fastapi/starlette plus récent de ce venv a imbriqué les routes include_router(), et la première passe HTTP a lu 30 routes de plugin comme jamais montées jusqu'à ce que la vérification apprenne à parcourir les routeurs imbriqués.",
    "it": "Le parole del README: 3.11 è l'interprete target di questa suite, nominato nelle prime righe di requirements.txt, e entrambi i blocchi partono dalla radice del repository. Il README considera conteggio autorevole l'ultima riga stampata dal comando stesso, quindi questa pagina non cita nessun totale di verifiche: un giro verde di un'installazione completa sono 22 gruppi senza SKIPPED, e il numero esatto di verifiche è quello che --self-test stampa sulla tua macchina. Un interprete con sola stdlib si vede intestare esattamente tre gruppi SKIPPED — crypto_self_test, opaque_invite_self_test e http_self_test — più la riga those paths are NOT verified here: quei tre non hanno eseguito alcuna verifica, invece di girare e restare non contati, mentre gli altri diciannove diventano comunque verdi. Ciò che il README dice sugli interpreti è l'opposto della nota «solo 3.9»: ha misurato 22 gruppi verdi sia sul 3.9.6 del .venv del repository sia su un venv Homebrew 3.11.18 appena creato, entrambi con exit 0 e 2776 verifiche, e la seconda misura serviva perché requirements.txt fissa intervalli e non versioni esatte, quindi il fastapi/starlette più recente in quel venv ha annidato le route include_router(), e la prima passata HTTP ha letto 30 route di plugin come mai montate finché la verifica non ha imparato a percorrere i router annidati.",
    "nl": "De README's eigen woorden: 3.11 is de interpreter waar deze suite op gebouwd en getypt is, genoemd in de eerste regels van requirements.txt, en beide blokken starten vanaf de repository-root. De README beschouwt de laatste regel die het commando zelf print als het gezaghebbende aantal, dus deze pagina citeert geen totaal aan checks: een groene run van een volledige installatie is 22 groepen zonder SKIPPED, en het exacte aantal checks is wat --self-test op je eigen machine print. Een stdlib-only interpreter krijgt precies drie groepen als SKIPPED benoemd — crypto_self_test, opaque_invite_self_test en http_self_test — plus de regel those paths are NOT verified here: die drie voerden nul checks uit, in plaats van draaiden en niet geteld werden, en de andere negentien worden alsnog groen. Wat de README over interpreters zegt is het tegenovergestelde van een „alleen 3.9”-kanttekening: hij mat 22 groene groepen zowel op het 3.9.6 in de eigen .venv van de repository als in een verse Homebrew 3.11.18-venv, beide met exit 0 en 2776 checks, en die tweede meting was nodig omdat requirements.txt bereiken vastlegt in plaats van exacte pinnen, zodat de nieuwere fastapi/starlette in die venv include_router()-routes nestte en de eerste HTTP-ronde 30 pluginroutes als nooit gemount las tot de controle geneste routers leerde lopen.",
    "cs": "Vlastní slova README: 3.11 je cílový interpret této sady, uvedený v prvních řádcích requirements.txt, a obě bloky startují z kořene repozitáře. README považuje za autoritativní počet poslední řádek, který příkaz sám vytiskne, takže tahle stránka žádný součet kontrol neuvádí: zelený běh plné instalace je 22 skupin bez SKIPPED a přesný počet kontrol je to, co --self-test vytiskne na vašem vlastním stroji. Interpret jen se stdlib dostane přesně tři skupiny pojmenované SKIPPED — crypto_self_test, opaque_invite_self_test a http_self_test — plus řádek those paths are NOT verified here: ty tři nespustily žádnou kontrolu, místo aby běžely a zůstaly nezapočítány, a zbylých devatenáct se zezelená taky. To, co README říká o interpretech, je opak výhrady „jen na 3.9“: 22 zelených skupin naměřilo jak na 3.9.6 ve vlastním .venv repozitáře, tak v čerstvém venv s Homebrew 3.11.18, obojí s exit 0 a 2776 kontrolami; druhé měření bylo potřeba, protože requirements.txt zadává rozsahy místo přesných verzí a novější fastapi/starlette v tom venv vnořily route z include_router(), takže první HTTP průchod přečetl 30 rout pluginů jako nikdy nenamontované, dokud se kontrola nenaučila procházet vnořené routery.",
    "zh-Hans": "README 的原话：3.11 是这套件的目标解释器，requirements.txt 头几行写着；两个代码块都从仓库根目录起跑。README 把那条命令自己打印的最后一行当作权威计数，所以本页不引用任何检查总数：完整安装全绿是 22 组、无 SKIPPED，具体多少条断言，以你自己机器上 --self-test 打印的那行为准。只有标准库的解释器会被运行器点名 SKIPPED 三组——crypto_self_test、opaque_invite_self_test 与 http_self_test——并打印 those paths are NOT verified here：这三组一条断言都没跑过，不是跑过了没记上，其余十九组照样全绿。README 关于解释器说的是「只在 3.9 上测过」的反面：它在本仓库 .venv 的 3.9.6 上、以及新建的 Homebrew 3.11.18 venv 上都量到 22 组全绿，两次都是 exit 0、2776 条检查；之所以要补第二次测量，是因为 requirements.txt 钉的是版本区间而非精确版本，那个新 venv 里的 fastapi/starlette 更新，把 include_router() 的路由嵌套起来，第一次 HTTP 遍历把 30 条插件路由读成从未挂载，直到检查学会走进嵌套路由为止。",
    "zh-Hant": "README 的原話：3.11 是這套件的目標直譯器，requirements.txt 頭幾行寫著；兩個程式碼塊都從倉庫根目錄起跑。README 把那條命令自己列印的最後一行當作權威計數，所以本頁不引用任何檢查總數：完整安裝全綠是 22 組、無 SKIPPED，確切有多少條斷言，以你自己機器上 --self-test 列印的那行為準。只有標準函式庫的直譯器會被執行器點名 SKIPPED 三組——crypto_self_test、opaque_invite_self_test 與 http_self_test——並列印 those paths are NOT verified here：這三組一條斷言都沒跑過，不是跑過了沒記上，其餘十九組照樣全綠。README 關於直譯器說的是「只在 3.9 上測過」的反面：它在本倉庫 .venv 的 3.9.6 上、以及新建立的 Homebrew 3.11.18 venv 上都量到 22 組全綠，兩次都是 exit 0、2776 條檢查；之所以要補第二次量測，是因為 requirements.txt 釘的是版本區間而非確切版本，那個新 venv 裡的 fastapi/starlette 較新，把 include_router() 的路由嵌套起來，第一次 HTTP 巡覽把 30 條外掛路由讀成從未掛載，直到檢查學會走進嵌套路由為止。",
    "es": "Las palabras del propio README: 3.11 es el intérprete objetivo de este conjunto, nombrado en las primeras líneas de requirements.txt, y ambos bloques arrancan desde la raíz del repositorio. El README toma como recuento con autoridad la última línea que imprime el propio comando, así que esta página no cita ningún total de comprobaciones: una pasada verde de una instalación completa son 22 grupos sin SKIPPED, y el número exacto de comprobaciones es lo que --self-test imprima en tu propia máquina. Un intérprete solo con la stdlib recibe exactamente tres grupos nombrados SKIPPED — crypto_self_test, opaque_invite_self_test y http_self_test — más la línea those paths are NOT verified here: esos tres no ejecutaron ninguna comprobación, en vez de correr y quedar sin contar, y los otros diecinueve salen verdes igualmente. Lo que el README dice de los intérpretes es lo contrario de la salvedad «solo 3.9»: midió 22 grupos verdes tanto en el 3.9.6 del .venv propio del repositorio como en un venv nuevo de Homebrew 3.11.18, ambos con exit 0 y 2776 comprobaciones, y la segunda medida hizo falta porque requirements.txt fija rangos y no versiones exactas, así que el fastapi/starlette más reciente de ese venv anidó las rutas de include_router() y la primera pasada HTTP leyó 30 rutas de complemento como nunca montadas hasta que la comprobación aprendió a recorrer routers anidados.",
    "pl": "Słowa samego README: 3.11 to interpreter docelowy tego zestawu, wskazany w pierwszych liniach requirements.txt, a oba bloki startują z głównego katalogu repozytorium. README uznaje za miarodajny licznik ostatnią linię, którą drukuje samo polecenie, więc ta strona nie podaje żadnej sumy sprawdzeń: zielone przejście pełnej instalacji to 22 grupy bez SKIPPED, a dokładna liczba sprawdzeń to to, co --self-test wydrukuje na własnej maszynie. Interpretator mający tylko bibliotekę standardową dostaje dokładnie trzy grupy wskazane jako SKIPPED — crypto_self_test, opaque_invite_self_test i http_self_test — plus linię those paths are NOT verified here: te trzy nie wykonały ani jednego sprawdzenia, zamiast pójść i nie zostać policzone, a pozostałe dziewiętnaście i tak wychodzą zielone. To, co README mówi o interpreterach, jest przeciwieństwem zastrzeżenia «tylko na 3.9»: 22 zielone grupy zmierzono zarówno na 3.9.6 z własnego .venv repozytorium, jak i w świeżym venv z Homebrew 3.11.18, oba z exit 0 i 2776 sprawdzeniami, a drugi pomiar był potrzebny, bo requirements.txt podaje zakresy, a nie dokładne wersje, więc nowszy fastapi/starlette w tym venv zagnieździł trasy include_router(), a pierwszy przebieg HTTP odczytał 30 tras wtyczek jako nigdy niezamontowane, dopóki sprawdzenie nie nauczyło się chodzić po zagnieżdżonych routerach.",
    "ja": "README 自身の表現では、3.11 はこの一式の対象インタープリターで、requirements.txt の冒頭数行に名前が書かれており、両方のコードブロックはリポジトリのルートから実行します。README は、権威ある計数とはコマンド自身が打ち出す最後の一行だとしており、だからこそこのページはチェックの総数を引用しません。完全なインストールでの緑は 22 組で SKIPPED が無いことであり、チェック件数の正確な値は、あなたの機械で --self-test が出す行に従います。標準ライブラリだけのインタープリターでは crypto_self_test、opaque_invite_self_test、http_self_test のちょうど 3 組が SKIPPED として名指しされ、those paths are NOT verified here という行も出ます。これは「その 3 組は 1 件も実行していない」という意味で、「実行されたのに数えられていない」ではありません。残り十九組はそのまま緑になります。インタープリターについて README が語るのは「3.9 でしか測っていない」とは逆のことです。リポジトリ自身の .venv の 3.9.6 でも、Homebrew の 3.11.18 で新しく作った venv でも、22 組すべて緑を実測し、どちらも exit 0・2776 チェックでした。二回目の実測が必要だった理由は、requirements.txt が範囲を指定していて正確なバージョンを固定しないからで、あの新しい venv では fastapi/starlette が include_router() のルートを入れ子にし、最初の HTTP 走査は 30 本のプラグインルートを未マウントと読みました。チェックが入れ子ルーターをたどれるようになって、それは直りました。",
    "th": "คำของ README เอง: 3.11 คือ interpreter เป้าหมายของชุดนี้ ซึ่งระบุไว้ในบรรทัดแรกของ requirements.txt และโค้ดทั้งสองก้อนเริ่มจากรากของรีโป README ถือว่าตัวเลขที่มีสิทธิ์อ้างอิงคือบรรทัดสุดท้ายที่คำสั่งพิมพ์ออกมาเอง หน้านี้จึงไม่ยกยอดรวมจำนวนการตรวจสอบใด ๆ: การติดตั้งเต็มที่เขียวคือ 22 กลุ่มโดยไม่มี SKIPPED ส่วนจำนวนการตรวจสอบที่แน่ชัดให้เป็นตามที่ --self-test พิมพ์บนเครื่องของคุณเอง ส่วน interpreter ที่มีแต่ stdlib จะถูกเรียกชื่อเป็น SKIPPED พอดีสามกลุ่ม — crypto_self_test, opaque_invite_self_test และ http_self_test — พร้อมบรรทัด those paths are NOT verified here ซึ่งแปลว่าสามกลุ่มนั้นไม่ได้รันการตรวจสอบเลย ไม่ใช่รันแล้วไม่นับ และอีกสิบเก้ากลุ่มก็ยังเขียวอยู่ สิ่งที่ README บอกเรื่อง interpreter นั้นกลับด้านกับข้อแม้ว่า «วัดแต่บน 3.9»: มันวัดได้ 22 กลุ่มเขียวทั้งบน 3.9.6 ใน .venv ของตัวรีโปเอง และบน venv ที่เพิ่งสร้างด้วย Homebrew 3.11.18 ทั้งคู่ exit 0 และ 2776 การตรวจสอบ โดยต้องวัดรอบที่สองเพราะ requirements.txt ระบุเป็นช่วงเวอร์ชัน ไม่ใช่เวอร์ชันแน่นอน ทำให้ fastapi/starlette ที่ใหม่กว่าใน venv นั้นซ้อน route ของ include_router() ไว้ และการไล่ HTTP รอบแรกอ่าน 30 route ของปลั๊กอินว่าไม่เคยถูกเมานต์ จนกว่าการตรวจจะเรียนรู้ที่จะเดินผ่าน router ที่ซ้อนกัน",
    "fi": "README:n omat sanat: 3.11 on tämän paketin tulkki, nimettynä requirements.txt:n ensimmäisillä riveillä, ja molemmat lohkot lähtevät repositorion juuresta. README pitää auktoriteettina sitä viimeistä riviä, jonka komento itse tulostaa, joten tämä sivu ei lainaa mitään tarkistusmäärää: täyden asennuksen vihreä suoritus on 22 ryhmää ilman SKIPPED-merkintöjä, ja tarkistusten täsmäluku on se, mitä --self-test tulostaa omalla koneellasi. Pelkän stdlibin tulkki saa täsmälleen kolme ryhmää SKIPPED-nimikkeellä — crypto_self_test, opaque_invite_self_test ja http_self_test — sekä rivin those paths are NOT verified here: ne kolme eivät ajaneet yhtään tarkistusta, ei niin että olisivat ajaneet ja jääneet laskematta, ja loput yhdeksäntoista ryhmää silti vihertävät. Mitä README kertoo tulkeista on päinvastoin kuin varaus »vain 3.9»: se mittasi 22 vihreää ryhmää sekä repositorion oman .venvin 3.9.6:lla että juuri perustetulla Homebrew'n 3.11.18-venvillä, molemmat exit 0 ja 2776 tarkistusta, ja toinen mittaus tarvittiin, koska requirements.txt ilmoittaa haarukat eikä tiukkoja siteitä, joten kyseisen venvin uudempi fastapi/starlette sisäkkäisti include_router()-reitit ja ensimmäinen HTTP-kierros luki 30 lisäosareittiä koskaan asentamattomina, kunnes tarkistus oppi kulkemaan sisäkkäiset reitittimet.",
    "uk": "Слова самого README: 3.11 — цільовий інтерпретатор цього набору, названий у перших рядках requirements.txt, і обидва блоки запускаються з кореня репозиторію. README вважає авторитетним лічильником останній рядок, який надрукує сама команда, тому ця сторінка не наводить жодної суми перевірок: зелений прохід повної інсталяції — це 22 групи без SKIPPED, а точна кількість перевірок — те, що --self-test надрукує на вашій власній машині. В інтерпретатора лише зі stdlib рівно три групи позначаються SKIPPED — crypto_self_test, opaque_invite_self_test і http_self_test — плюс рядок those paths are NOT verified here: ці три не виконали жодної перевірки, а не «виконалися й не зарахувалися», і решта девʼятнадцять теж зелені. Про інтерпретатори README каже протилежне застереги «лише на 3.9»: 22 зелених групи він виміряв і на 3.9.6 з власного .venv репозиторію, і у свіжому venv із Homebrew 3.11.18, обидва рази exit 0 і 2776 перевірок; друге вимірювання знадобилося, бо requirements.txt задає діапазони, а не точні версії, тож новіший fastapi/starlette в тому venv вклав маршрути include_router() у вкладені роутери, і перший HTTP-обхід прочитав 30 маршрутів плагінів як ніколи не змонтовані, доки перевірка не навчилася обходити вкладені роутери.",
    "bg": "Собствените думи на README: 3.11 е целевият интерпретатор на този комплект, посочен в първите редове на requirements.txt, и двата блока тръгват от корена на хранилището. README приема за авторитетен брой последния ред, който самата команда отпечатва, затова тази страница не цитира никаква сума проверки: зелен резултат при пълна инсталация са 22 групи без SKIPPED, а точният брой проверки е каквото --self-test отпечата на собствената ви машина. Интерпретатор само със stdlib получава точно три групи с името SKIPPED — crypto_self_test, opaque_invite_self_test и http_self_test — плюс реда those paths are NOT verified here: онези три не изпълниха нито една проверка, а не са изпълнявани и останали неизброени, а останалите деветнадесет пак светват зелено. Това, което README казва за интерпретаторите, е обратното на уговорката «само на 3.9»: то измери 22 зелени групи както на 3.9.6 в собствения .venv на хранилището, така и в новосъздаден venv с Homebrew 3.11.18, и двата с exit 0 и 2776 проверки, а второто измерване се наложи, защото requirements.txt описва диапазони, не точни версии, та по-новият fastapi/starlette в онзи venv вложи маршрутите на include_router(), и първият HTTP обход прочете 30 плъгинни маршрута като никога не монтирани, докато проверката не се научи да минава през вложени рутери.",
    "tr": "README'nin kendi sözleri: 3.11 bu takımın hedef yorumlayıcısıdır, requirements.txt'in ilk satırlarında adı geçer, ve iki blok de depo kökünden çalıştırılır. README, komutun kendisinin bastığı son satırı yetkili sayı olduğu kabul eder; bu yüzden bu sayfa hiçbir kontrol toplamı alıntılamaz: tam bir kurulumda yeşil çalıştırma 22 grup ve SKIPPED yok demektir, kesin kontrol sayısı ise --self-test'in kendi makinenizde bastığı satırdır. Yalnızca stdlib içeren yorumlayıcıda tam üç grup SKIPPED olarak adlandırılır — crypto_self_test, opaque_invite_self_test ve http_self_test — üstelik those paths are NOT verified here satırıyla: o üçü hiç kontrol çalıştırmadı, çalışıp da sayılmadı demek değil, kalan on dokuz grup yine de yeşile döner. README'nin yorumlayıcılar hakkında söylediği, «yalnızca 3.9» çekincesinin tam tersi: hem deponun kendi .venv'indeki 3.9.6 üzerinde hem de yeni kurulan bir Homebrew 3.11.18 venv üzerinde 22 yeşil grup ölçtü, ikisi de exit 0 ve 2776 kontrol; ikinci ölçüm gerekti, çünkü requirements.txt tam sürümleri değil aralıkları bağlıyor ve o venv'deki daha yeni fastapi/starlette include_router() rotalarını iç içe yerleştirdi, ilk HTTP turu da 30 eklenti rotasını hiç bağlanmamış okudu; ta ki kontrol iç içe yönlendiricilerde yürümeyi öğrenene kadar.",
    "hu": "A README saját szavai: a 3.11 ennek a csomagnak a célinterpretere, amelyet a requirements.txt első sorai nevesítenek, és mindkét blokk a repó gyökeréből indul. A README a parancs által utoljára nyomtatott sort tekinti mérvadó számnak, ezért ez az oldal nem idéz semmilyen ellenőrzés-összesítést: egy teljes telepítés zöld futása 22 csoport SKIPPED nélkül, a pontos ellenőrzésszám pedig az, amit a --self-test a saját gépeden nyomtat ki. Csak stdlib-es interpreterre pontosan három csoport kap SKIPPED nevet — crypto_self_test, opaque_invite_self_test és http_self_test — plusz a those paths are NOT verified here sor: az a három egyetlen ellenőrzést sem futtatott, nem úgy, hogy lefutottak és számolatlanul maradtak, a maradék tizenkilenc csoport viszont zöld lesz. Amit a README az interpreterekről mond, az a „csak 3.9-en mért” fenntartás ellenkezője: 22 zöld csoportot mért mind a repó saját .venv-jének 3.9.6-án, mind egy frissen létrehozott Homebrew 3.11.18 venv-en, mindkettő exit 0 és 2776 ellenőrzés; azért kellett a második mérés, mert a requirements.txt tartományokat ad meg nem rögzített verziókat, így abban a venv-ben az újabb fastapi/starlette beágyazta az include_router() útvonalait, és az első HTTP kör 30 bővítményútvonalat olvasott sosem csatoltként, amíg az ellenőrzés meg nem tanult bejárni a beágyazott routereket.",
  } satisfies L,

  verifyTitle: {
    en: "Proof it is up",
    "ru": "Доказательство, что оно поднялось",
    "de": "Nachweis, dass es läuft",
    "fr": "La preuve que c'est levé",
    "it": "La prova che è in piedi",
    "nl": "Bewijs dat het opstaat",
    "cs": "Důkaz, že to běží",
    "zh-Hans": "验证起来了",
    "zh-Hant": "驗證起來了",
    "es": "Prueba de que está arriba",
    "pl": "Dowód, że działa",
    "ja": "起動している証拠",
    "th": "หลักฐานว่าระบบขึ้นมาแล้ว",
    "fi": "Näyttö että se on pystyssä",
    "uk": "Доказ, що воно підведене",
    "bg": "Доказателство, че е горе",
    "tr": "Ayağa kalktığına dair kanıt",
    "hu": "Bizonyíték, hogy felkelt",
  } satisfies L,
  verifyBody: {
    en: "/healthz is a public route: no token, no database write and no call to the node. It answers three fields — ok, node_connected and service_id.",
    "ru": "/healthz — публичный маршрут: без токена, без записи в базу и без обращения к узлу. Он отвечает тремя полями — ok, node_connected и service_id.",
    "de": "/healthz ist eine öffentliche Route: ohne Token, ohne Datenbank-Schreibvorgang und ohne Anruf des Knoten. Sie beantwortet drei Felder — ok, node_connected und service_id.",
    "fr": "/healthz est une route publique : pas de jeton, pas d'écriture en base, pas d'appel au nœud. Elle répond par trois champs — ok, node_connected et service_id.",
    "it": "/healthz è una rotta pubblica: niente token, nessuna scrittura sul database e nessuna chiamata al nodo. Risponde con tre campi — ok, node_connected e service_id.",
    "nl": "/healthz is een publieke route: geen token, geen schrijfactie op de database en geen aanroep van de node. Ze antwoordt met drie velden — ok, node_connected en service_id.",
    "cs": "/healthz je veřejná route: bez tokenu, bez zápisu do databáze a bez volání uzlu. Odpovídá třemi poli — ok, node_connected a service_id.",
    "zh-Hans": "/healthz 是公开路由：不要令牌、不写数据库、也不去问节点。它回 ok、node_connected 和 service_id 三个字段。",
    "zh-Hant": "/healthz 是公開路由：不要權杖、不寫資料庫、也不去問節點。它回 ok、node_connected 和 service_id 三個欄位。",
    "es": "/healthz es una ruta pública: sin token, sin escritura en la base de datos y sin llamada al nodo. Responde con tres campos — ok, node_connected y service_id.",
    "pl": "/healthz jest trasą publiczną: bez tokenu, bez zapisu do bazy i bez wołania węzła. Odpowiada trzema polami — ok, node_connected i service_id.",
    "ja": "/healthz は公開ルートです。トークンは不要で、データベースへの書き込みもノードへの問い合わせも行いません。返すのは ok、node_connected、service_id の3つのフィールドだけです。",
    "th": "/healthz เป็นเส้นทางสาธารณะ: ไม่ต้องใช้โทเคน ไม่เขียนฐานข้อมูล และไม่เรียกไปถามโหนด มันตอบกลับมาสามฟิลด์คือ ok, node_connected และ service_id",
    "fi": "/healthz on julkinen reitti: ei tokenia, ei tietokantakirjoitusta eikä solmulle soittoa. Se vastaa kolmella kentällä — ok, node_connected ja service_id.",
    "uk": "/healthz — це відкритий маршрут: без токена, без запису до бази й без звернення до вузла. Він відповідає трьома полями — ok, node_connected і service_id.",
    "bg": "/healthz е публичен маршрут: без токен, без запис в базата и без извикване на възела. Отговаря с три полета — ok, node_connected и service_id.",
    "tr": "/healthz açık bir rotadır: token istemez, veri tabanına yazmaz, düğüme de sormaz. Üç alanla yanıt verir — ok, node_connected ve service_id.",
    "hu": "A /healthz nyilvános útvonal: token nélkül, adatbázis-írás nélkül és a csomópont megszólítása nélkül. Mindössze három mezővel felel — ok, node_connected és service_id.",
  } satisfies L,
  verifyFalse: {
    en: "node_connected: false is not fatal. The gateway keeps serving while the bridge reconnects forever with a capped backoff — it starts from POPOPX_NODE_RECONNECT_SECONDS (3 by default) and doubles up to a 60-second ceiling — and the node attaches itself once it is up. Callers that want fail-fast pass strict=True themselves. The installer puts it this way: /healthz reports node state, it does not gate readiness on it.",
    "ru": "node_connected: false — не приговор. Шлюз продолжает обслуживать, а мост вечно переподключается с ограниченным backoff — от POPOPX_NODE_RECONNECT_SECONDS (по умолчанию 3 секунды) с удвоением до потолка в 60 секунд — и узел присоединяется сам, когда поднимется. Тем, кому нужен fail-fast, передают strict=True сами. Установщик формулирует это так: /healthz сообщает состояние узла и не является признаком готовности.",
    "de": "node_connected: false ist nicht tödlich. Das Gateway liefert weiter, während die Brücke sich ewig mit gedeckeltem Backoff neu verbindet — sie setzt bei POPOPX_NODE_RECONNECT_SECONDS an (Standard 3 Sekunden) und verdoppelt bis an eine 60-Sekunden-Obergrenze — und der Node hängt sich selbst an, sobald er läuft. Wer fail-fast will, übergibt selbst strict=True. Der Installierer sagt es so: /healthz meldet den Knotenzustand, er macht ihn nicht zur Bereitschaft.",
    "fr": "node_connected: false n'est pas rédhibitoire. La passerelle continue de servir pendant que le pont se reconnecte sans fin avec un backoff plafonné — il part de POPOPX_NODE_RECONNECT_SECONDS (3 secondes par défaut) et double jusqu'à un plafond de 60 secondes — et le nœud se rattache de lui-même une fois levé. Les appelants qui veulent du fail-fast passent eux-mêmes strict=True. L'installeur le formule ainsi : /healthz rend l'état du nœud, il n'en fait pas un critère de préparation.",
    "it": "node_connected: false non è fatale. Il gateway continua a servire mentre il bridge si riconnette per sempre con un backoff limitato — parte da POPOPX_NODE_RECONNECT_SECONDS (3 di default) e raddoppia fino a un tetto di 60 secondi — e il nodo si attacca da solo appena è su. Chi vuole fail-fast passa strict=True di suo. L'installatore lo mette così: /healthz riporta lo stato del nodo, non lo usa come gate di prontezza.",
    "nl": "node_connected: false is niet dodelijk. De gateway blijft dienen terwijl de bridge oneindig reconnect met een afgetopte backoff — het vertrekt vanaf POPOPX_NODE_RECONNECT_SECONDS (3 standaard) en verdubbelt tot een plafond van 60 seconden — en de node haakt zelf aan zodra hij er is. Wie fail-fast wil, geeft zelf strict=True mee. De installateur zegt het zo: /healthz meldt de nodestatus, het poort er niet op af.",
    "cs": "node_connected: false není rozsudek. Brána dál obsluhuje, zatímco se bridge donekonečna reconnectuje s oříznutým backoffem — začíná na POPOPX_NODE_RECONNECT_SECONDS (výchozí 3 sekundy) a zdvojnásobuje až ke stropu 60 sekund — a uzel se napojí sám, až vstane. Kdo chce fail-fast, pošle strict=True sám. Instalátor to říká takto: /healthz hlásí stav uzlu, nedělá z něj kriterium připravenosti.",
    "zh-Hans": "node_connected: false 不是致命错误。网关照常开始服务，桥接层按封顶的退避一直重试——从 POPOPX_NODE_RECONNECT_SECONDS（默认 3 秒）起指数退避、封顶 60 秒——节点起来后自己接上；需要 fail-fast 的调用方自己传 strict=True。安装脚本对这点的说法是：/healthz 报的是节点状态，不就以此为就绪门禁。",
    "zh-Hant": "node_connected: false 不是致命錯誤。閘道照常開始服務，橋接層按封頂的退避一直重試——從 POPOPX_NODE_RECONNECT_SECONDS（預設 3 秒）起指數退避、封頂 60 秒——節點起來後自己接上；需要 fail-fast 的呼叫端自己傳 strict=True。安裝腳本對這點的說法是：/healthz 報的是節點狀態，不就以此為就緒閘門。",
    "es": "node_connected: false no es una sentencia. La pasarela sigue dando servicio mientras el puente se reconecta para siempre con un backoff acotado — arranca en POPOPX_NODE_RECONNECT_SECONDS (3 por defecto) y duplica hasta un tope de 60 segundos — y el nodo se engancha solo cuando está arriba. Quien quiera fail-fast pasa strict=True él mismo. El instalador lo dice así: /healthz informa del estado del nodo, no lo toma como puerta de disponibilidad.",
    "pl": "node_connected: false to nie wyrok. Brama nadal obsługuje, a most w nieskończoność łączy się ponownie z ograniczonym backoffem — startuje od POPOPX_NODE_RECONNECT_SECONDS (domyślnie 3 sekundy) i podwaja aż do pułapu 60 sekund — a węzeł podłącza się sam, kiedy wstanie. Kto chce fail-fast, ten sam podaje strict=True. Instalator ujmuje to tak: /healthz raportuje stan węzła, nie czyni z niego progu gotowości.",
    "ja": "node_connected: false は致命的な障害ではありません。ゲートウェイは応答を続け、ブリッジは上限付きの backoff で再接続し続けます。POPOPX_NODE_RECONNECT_SECONDS（既定は3秒）から指数関数的に間隔を倍やし、60秒で頭打ちになります。ノードが上がれば接続はノード自身が行います。fail-fast が欲しい呼び出し側は strict=True を自分で渡してください。インストーラーの説明はこうです。/healthz はノードの状態を報告するだけで、準備完了の判定には使わない。",
    "th": "node_connected: false ไม่ใช่ความผิดพลาดร้ายแรง gateway ยังให้บริการต่อ โดยชั้นบริดจ์จะเชื่อมต่อใหม่ไม่มีที่สิ้นสุด แบบ backoff ที่มีเพดาน — เริ่มจาก POPOPX_NODE_RECONNECT_SECONDS (ปกติ 3 วินาที) แล้วเพิ่มเป็นสองเท่าจนถึงเพดาน 60 วินาที — ส่วนโหนดจะต่อเข้ามาเองเมื่อมันขึ้นมา สำหรับ caller ที่อยากได้ fail-fast ก็ส่ง strict=True เอง ตัวติดตั้งพูดไว้แบบนี้: /healthz รายงานสถานะของโหนด ไม่ได้ใช้เป็นด่านความพร้อม",
    "fi": "node_connected: false ei ole kohtalokasta. Gateway palvelee edelleen, kun taas silta yhdistää ikuisesti katkaistulla backoffilla — se lähtee POPOPX_NODE_RECONNECT_SECONDSista (oletus 3 sekuntia) ja kaksinkertaistuu 60 sekunnin kattoon asti — ja solmu kiinnittää itsensä kun se on ylhäällä. Fail-fastin haluavat lähettävät strict=True itse. Asennusohjelma sanoo asian näin: /healthz kertoo solmun tilan, ei tee siitä valmiuskynnystä.",
    "uk": "node_connected: false — не вирок. Шлюз продовжує обслуговувати, а міст нескінченно перепідключається з обмеженим backoff — від POPOPX_NODE_RECONNECT_SECONDS (типово 3 секунди) з подвоєнням до стелі в 60 секунд — і вузол приєднається сам, щойно підніметься. Тим, кому потрібен fail-fast, передають strict=True самостійно. Інсталятор формулює це так: /healthz повідомляє стан вузла й не слугує ознакою готовності.",
    "bg": "node_connected: false не е присъда. Шлюзът продължава да обслужва, докато мостът се прекъсва безкрайно с ограничен backoff — тръгва от POPOPX_NODE_RECONNECT_SECONDS (по подразбиране 3 секунди) и удвоява до таван от 60 секунди — и възелът се закача сам, когато стане. Който иска fail-fast, подава strict=True сам. Инсталаторът го казва така: /healthz съобщава състоянието на възела, не го прави праг на готовност.",
    "tr": "node_connected: false ölümcül değil. Ağ geçidi hizmet vermeye devam ederken köprü, üst sınırı olan bir backoff ile sonsuza dek yeniden bağlanır — POPOPX_NODE_RECONNECT_SECONDS değerinden (varsayılan 3 saniye) başlar ve 60 saniye tavanına kadar katlar — düğüm ayağa kalkınca kendisi bağlanır. Fail-fast isteyen çağıran strict=True'ı kendi geçirir. Kurulum programı bunu şöyle ifade eder: /healthz düğüm durumunu bildirir, hazır olma kapısı yapmaz.",
    "hu": "A node_connected: false nem halálos hiba. Az átjáró tovább kiszolgál, miközben a híd végtelenül újrakapcsol egy fedéllezelátott backoffal — a POPOPX_NODE_RECONNECT_SECONDS értékből indul ki (alapértelmezésben 3 másodperc) és 60 másodperces plafonig duplázik — a csomópont pedig magától csatlakozik, felkelvén. Aki fail-fast-ot akar, az maga adja át a strict=True paramétert. A telepítő így fogalmaz: a /healthz a csomópont állapotát jelenti, nem a készenlét mércéje.",
  } satisfies L,
  verifyNext: {
    en: "The version and the service identity are not in that response — they are in GET /api/v1/status: version, service (service_id, display name, public base URL, contact address), node, billing, outbox, counts and plugins. The two chips in the console's top bar read exactly that.",
    "ru": "Версия и идентификация сервиса в этом ответе не живут — они в GET /api/v1/status: version, service (service_id, отображаемое имя, публичный базовый URL, адрес контакта), node, billing, outbox, counts и plugins. Обе чип-плашки в верхней панели консоли читают именно его.",
    "de": "Die Version und die Dienstsidentität wohnen nicht in dieser Antwort — sie sind in GET /api/v1/status: version, service (service_id, Anzeigename, öffentliche Basis-URL, Kontaktadresse), node, billing, outbox, counts und plugins. Genau den lesen die zwei Chips in der oberen Leiste der Konsole.",
    "fr": "La version et l'identité du service ne vivent pas dans cette réponse — elles sont dans GET /api/v1/status : version, service (service_id, nom affiché, URL de base publique, adresse de contact), node, billing, outbox, counts et plugins. Ce sont exactement ces champs que lisent les deux pastilles de la barre supérieure de la console.",
    "it": "La versione e l'identità del servizio non stanno in quella risposta — sono in GET /api/v1/status: version, service (service_id, nome visualizzato, URL pubblico, indirizzo di contatto), node, billing, outbox, counts e plugins. Sono esattamente quelli che leggono le due chip nella barra superiore della console.",
    "nl": "De versie en de service-identiteit zitten niet in dat antwoord — ze staan in GET /api/v1/status: version, service (service_id, weergavenaam, publiek basis-URL, contactadres), node, billing, outbox, counts en plugins. De twee chips in de balk bovenaan de console lezen precies dat.",
    "cs": "Verze a identita služby v té odpovědi nesídlí — jsou v GET /api/v1/status: version, service (service_id, zobrazovaný název, veřejná URL, kontakt), node, billing, outbox, counts a plugins. Přesně tu čtou dva štítky v horní liště konzole.",
    "zh-Hans": "版本和服务号身份不在这条响应里，它们在 GET /api/v1/status：version、service（service_id、显示名、对外地址、联系人地址）、node、billing、outbox、counts、plugins。后台顶栏那两枚 chip 读的就是这一条。",
    "zh-Hant": "版本與服務號身分不在這條回應裡，它們在 GET /api/v1/status：version、service（service_id、顯示名、對外位址、聯絡人位址）、node、billing、outbox、counts、plugins。後臺頂欄那兩枚 chip 讀的就是這一條。",
    "es": "La versión y la identidad del servicio no viven en esa respuesta — están en GET /api/v1/status: version, service (service_id, nombre visible, URL pública, dirección de contacto), node, billing, outbox, counts y plugins. Eso es exactamente lo que leen las dos etiquetas de la barra superior de la consola.",
    "pl": "Wersja i tożsamość usługi nie mieszkają w tej odpowiedzi — są w GET /api/v1/status: version, service (service_id, nazwa wyświetlana, publiczny adres URL, adres kontaktowy), node, billing, outbox, counts i plugins. Dokładnie to czytają dwie plakietki na górnym pasku konsoli.",
    "ja": "バージョンとサービス番号の識別情報はあの応答には含まれていません。それらは GET /api/v1/status にあります。version、service（service_id、表示名、公開ベース URL、コンタクトアドレス）、node、billing、outbox、counts、plugins。コンソールの上部バーにある2つのチップが読んでいるのは、まさにこの行です。",
    "th": "เวอร์ชันกับข้อมูลระบุตัวตนของบริการไม่ได้อยู่ในคำตอบนั้น — มันอยู่ใน GET /api/v1/status: version, service (service_id, ชื่อที่แสดง, URL สาธารณะ, address ของ contact), node, billing, outbox, counts และ plugins สอง chip บนแถบบนของหน้าคอนโซลอ่านจากบรรทัดนี้แหละ",
    "fi": "Versio ja palvelun identiteetti eivät asu tuessa vastauksessa — ne ovat GET /api/v1/status: version, service (service_id, näyttönimi, julkinen perus-URL, contact-osoite), node, billing, outbox, counts ja plugins. Juuri tätä lukevat konsolin yläpalkin kaksi merkkiä.",
    "uk": "Версія та ідентифікація сервісу в цій відповіді не живуть — вони в GET /api/v1/status: version, service (service_id, відображуване ім'я, публічний базовий URL, адреса контакту), node, billing, outbox, counts і plugins. Обидві плашки у верхній панелі консолі читають саме його.",
    "bg": "Версията и идентичността на услугата не живе в отговора — те са в GET /api/v1/status: version, service (service_id, име за показване, публичен базов URL, адрес на контакт), node, billing, outbox, counts и plugins. Точно това четат двете етикети в горната лента на конзолата.",
    "tr": "Sürüm ve hizmet kimliği o yanıtta barınmaz — GET /api/v1/status içindedir: version, service (service_id, görünen ad, genel taban URL'si, kişi adresi), node, billing, outbox, counts ve plugins. Konsolun üst çubuğundaki iki etiket tam olarak onu okur.",
    "hu": "A verzió és a szolgáltatás-azonosság nem abban a válaszban lakik — a GET /api/v1/status tartalmazza: version, service (service_id, megjelenített név, nyilvános alap URL, contact cím), node, billing, outbox, counts és plugins. Pontosabban ezt olvassa a konzol felső sávjának két jelzője.",
  } satisfies L,

  /* Part 2 */
  p2Eyebrow: {
    en: "Step 2 · STEP 02",
    "ru": "Шаг 2 · STEP 02",
    "de": "Schritt 2 · STEP 02",
    "fr": "Étape 2 · STEP 02",
    "it": "Passo 2 · STEP 02",
    "nl": "Stap 2 · STEP 02",
    "cs": "Krok 2 · STEP 02",
    "zh-Hans": "第二步 · STEP 02",
    "zh-Hant": "第二步 · STEP 02",
    "es": "Paso 2 · STEP 02",
    "pl": "Krok 2 · STEP 02",
    "ja": "ステップ2 · STEP 02",
    "th": "ขั้นที่ 2 · STEP 02",
    "fi": "Vaihe 2 · STEP 02",
    "uk": "Крок 2 · STEP 02",
    "bg": "Стъпка 2 · STEP 02",
    "tr": "Adım 2 · STEP 02",
    "hu": "2. lépés · STEP 02",
  } satisfies L,
  p2Title: {
    en: "Initialise the admin console and set the quota",
    "ru": "Инициализировать консоль администратора и задать квоту",
    "de": "Die Administrationskonsole initialisieren und das Kontingent setzen",
    "fr": "Initialiser la console d'administration et fixer le quota",
    "it": "Inizializzare la console di amministrazione e impostare la quota",
    "nl": "De beheerconsole initialiseren en het quotum instellen",
    "cs": "Inicializovat konzoli správce a nastavit kvótu",
    "zh-Hans": "管理后台初始化与配额设置",
    "zh-Hant": "管理後臺初始化與配額設定",
    "es": "Inicializar la consola de administración y fijar la cuota",
    "pl": "Zainicjuj konsolę administratora i ustaw limit",
    "ja": "管理コンソールの初期化とクォータの設定",
    "th": "ตั้งต้นคอนโซลผู้ดูแลและกำหนดโควตา",
    "fi": "Alusta ylläpitokonsoli ja aseta kiintiö",
    "uk": "Ініціалізувати консоль адміністратора та задати квоту",
    "bg": "Инициализирай административната конзола и задай квота",
    "tr": "Yönetici konsolunu hazırlayın ve kotayı ayarlayın",
    "hu": "Állítsa be az adminisztrációs konzolt és a kvótát",
  } satisfies L,
  p2Sub: {
    en: `The console is one page served on that same socket: ${ADMIN_CONSOLE_URL}. Past the token gate come nine plugin panels; the quota is decided by twelve meter keys and one admission switch in .env.`,
    "ru": `Консоль — одна страница на том же сокете: ${ADMIN_CONSOLE_URL}. За привратником с токеном стоят девять панелей плагинов; квоту задают двенадцать измерительных ключей и один ключ допуска в .env.`,
    "de": `Die Konsole ist eine Seite auf demselben Socket: ${ADMIN_CONSOLE_URL}. Hinter dem Token-Tor sitzen neun Plugin-Panels; das Kontingent bestimmt sich aus zwölf Messschlüsseln und einem Einlassschalter in .env.`,
    "fr": `La console tient sur une page servie par ce même socket : ${ADMIN_CONSOLE_URL}. Passé le portail à jeton viennent neuf volets des extensions ; le quota se règle par douze clés de comptage et un interrupteur d'admission dans .env.`,
    "it": `La console è una sola pagina servita su quello stesso socket: ${ADMIN_CONSOLE_URL}. Oltre la porta col token arrivano nove pannelli dei plugin; la quota la decidono dodici chiavi di misura e un interruttore di ammissione nel .env.`,
    "nl": `De console is één pagina op dezelfde socket: ${ADMIN_CONSOLE_URL}. Voorbij de tokenpoort komen negen pluginpanelen; de quota wordt bepaald door twaalf meetkeys en één toelatingsschakelaar in .env.`,
    "cs": `Konzole je jedna stránka na stejném soketu: ${ADMIN_CONSOLE_URL}. Za tokenovou bránou je devět panelů pluginů; kvótu určuje dvanáct měřicích klíčů a jeden přepínač vstupu v .env.`,
    "zh-Hans": `后台就是一个页面，起在同一只套接字上：${ADMIN_CONSOLE_URL}。先过令牌这一关，再看九个插件面板；配额只由 .env 里的十二个计量键和一个准入开关决定。`,
    "zh-Hant": `後臺就是一頁，起在同一個連線埠上：${ADMIN_CONSOLE_URL}。先過權杖這關，再看九個插件面板；配額只由 .env 裡的十二個計量鍵與一個放行開關決定。`,
    "es": `La consola es una página servida en ese mismo socket: ${ADMIN_CONSOLE_URL}. Tras la puerta del token vienen nueve paneles de complementos; la cuota la deciden doce claves de medición y un interruptor de admisión en .env.`,
    "pl": `Konsola to jedna strona obsługiwana na tym samym gnieździe: ${ADMIN_CONSOLE_URL}. Za bramą z tokenem stoją dziewięć paneli wtyczek; o kwocie decyduje dwanaście kluczy pomiarowych i jeden przełącznik dopuszczenia w .env.`,
    "ja": `管理コンソールは同じソケットが返す 1 ページです：${ADMIN_CONSOLE_URL}。トークンの門をくぐるとプラグインのパネルが九つ並び、割り当ては .env の 12 個の計測キーと 1 個の受付スイッチで決まります。`,
    "th": `คอนโซลคือหน้าเดียวที่ให้บริการบนซ็อกเก็ตเดียวกัน: ${ADMIN_CONSOLE_URL} ผ่านประตูโทเคนไปแล้วคือแผงของปลั๊กอินเก้าแผง ส่วนโควตากำหนดด้วยสิบสองคีย์การวัดกับสวิตช์อนุญาตหนึ่งตัวใน .env`,
    "fi": `Konsoli on yksi samassa socketissa palveleva sivu: ${ADMIN_CONSOLE_URL}. Tokenin portin takana ovat yhdeksän liitännäispaneelia; kiintiön ratkaisevat kaksitoista mittausavainta ja yksi päästyskytkin .env-tiedostossa.`,
    "uk": `Консоль — це одна сторінка на тому самому сокеті: ${ADMIN_CONSOLE_URL}. За брамою з токеном стоять дев'ять панелей плагінів; квоту визначають дванадцять вимірювальних ключів і один ключ допуску в .env.`,
    "bg": `Конзолата е една страница, обслужвана на същия сокет: ${ADMIN_CONSOLE_URL}. След портата с токена идват девет панела на приставките; квотата се определя от дванадесет измервателни ключа и един ключ за допускане в .env.`,
    "tr": `Konsol, aynı soket üzerinde sunulan tek bir sayfa: ${ADMIN_CONSOLE_URL}. Jeton kapısından sonra dokuz eklenti paneli gelir; kota, .env içindeki on iki ölçüm anahtarı ve bir giriş anahtarıyla belirlenir.`,
    "hu": `A konzol egyetlen oldal, ugyanazon a socketen kínálva: ${ADMIN_CONSOLE_URL}. A token-kapun túl kilenc bővítménypanel jönnek; a keretet tizenkét mérési kulcs és egy beléptetős kapcsoló dönti el a .env-ben.`,
  } satisfies L,
  gateTitle: {
    en: "Getting in: how the token is presented",
    "ru": "Как войти: токен передаётся вот так",
    "de": "Reinkommen: so wird das Token übergeben",
    "fr": "Entrer : comment le jeton est présenté",
    "it": "Entrare: come viene presentato il token",
    "nl": "Binnenkomen: zo wordt het token aangereikt",
    "cs": "Jak dovnitř: jak se token předává",
    "zh-Hans": "进门：令牌怎么给",
    "zh-Hant": "進門：權杖怎麼給",
    "es": "Entrar: cómo se presenta el token",
    "pl": "Wejście: tak podaje się token",
    "ja": "入り方：トークンの渡し方",
    "th": "การเข้าระบบ: วิธีส่งโทเคน",
    "fi": "Miten sisään: tokenin esittämistapa",
    "uk": "Як увійти: як подається токен",
    "bg": "Как се влиза: как се представя токенът",
    "tr": "Giriş: jeton nasıl sunulur",
    "hu": "Bemenet: így adják meg a tokent",
  } satisfies L,
  gateBody: {
    en: "The console opens on a gate with a single input. There is one rule: everything under /api/v1/ needs a credential, and a missing or wrong one is always a 401. admin_required accepts four spellings of that credential — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer and ?token= — and the root POPOPX_ADMIN_TOKEN still works everywhere. Beyond it, scoped pxa_… tokens narrow what a caller may do: a scope is * or core:<resource>:ro|rw or plugin:<id>:ro|rw, GET and HEAD need only ro while everything else needs rw, core:admin can never be granted, expiry runs from 1 to 3650 days, and a token can be revoked. The console keeps a token audit of the last 5000 rows, and the four token routes — list, mint, audit, revoke — stay root-only.",
    "ru": "Консоль открывается привратником с одним полем ввода. Правило одно: всё под /api/v1/ требует учётных данных, а отсутствующие или неверные — всегда 401. admin_required принимает четыре написания этих данных — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer и ?token= — и корневой POPOPX_ADMIN_TOKEN по-прежнему работает везде. Дальше ограниченные токены pxa_… сужают права вызывающего: область — это * либо core:<resource>:ro|rw, либо plugin:<id>:ro|rw, для GET и HEAD достаточно ro, для всего остального нужен rw, core:admin выдать нельзя, срок действия — от 1 до 3650 дней, а токен можно отозвать. Консоль ведёт аудит токенов на последние 5000 строк, а четыре маршрута токенов — список, выпуск, аудит и отзыв — остаются только для корневого.",
    "de": "Die Konsole öffnet mit einem Tor, das nur ein Eingabefeld hat. Es gibt eine Regel: alles unter /api/v1/ braucht einen Ausweis, und ein fehlender oder falscher ist immer ein 401. admin_required akzeptiert vier Schreibweisen dieses Ausweises — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer und ?token= —, und das Stamm-POPOPX_ADMIN_TOKEN gilt weiterhin überall. Dahinter schränken begrenzte pxa_…-Tokens ein, was ein Aufrufer darf: ein Scope ist * oder core:<resource>:ro|rw oder plugin:<id>:ro|rw, GET und HEAD brauchen nur ro, alles andere braucht rw, core:admin lässt sich nie vergeben, die Laufzeit reicht von 1 bis 3650 Tagen, und ein Token lässt sich widerrufen. Die Konsole führt ein Token-Audit über die letzten 5000 Zeilen, und die vier Token-Routen — Liste, Ausgabe, Audit, Widerruf — bleiben dem Stammtoken vorbehalten.",
    "fr": "La console s'ouvre sur un portail à un seul champ. Une règle : tout ce qui est sous /api/v1/ exige un justificatif, et un justificatif absent ou faux donne toujours un 401. admin_required accepte quatre écritures de ce justificatif — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer et ?token= — et le POPOPX_ADMIN_TOKEN racine fonctionne toujours partout. Au-delà, des jetons pxa_… à portée réduite limitent ce qu'un appelant peut faire : une portée vaut * ou core:<resource>:ro|rw ou plugin:<id>:ro|rw, GET et HEAD ne demandent que ro, tout le reste exige rw, core:admin n'est jamais accordable, l'expiration va de 1 à 3650 jours, et un jeton peut être révoqué. La console tient un audit des jetons sur les 5000 dernières lignes, et les quatre routes de jetons — liste, émission, audit, révocation — restent réservées au jeton racine.",
    "it": "La console si apre su un portone con una sola casella. C'è una regola: tutto ciò che sta sotto /api/v1/ richiede una credenziale, e una credenziale mancante o errata è sempre un 401. admin_required accetta quattro grafie di quella credenziale — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer e ?token= — e il POPOPX_ADMIN_TOKEN radice funziona ancora ovunque. Oltre a esso, i token pxa_… con ambito limitano ciò che un chiamante può fare: un ambito è * oppure core:<resource>:ro|rw oppure plugin:<id>:ro|rw, GET e HEAD richiedono solo ro, tutto il resto richiede rw, core:admin non è mai concedibile, la scadenza va da 1 a 3650 giorni e un token può essere revocato. La console tiene un audit dei token sulle ultime 5000 righe, e le quattro rotte dei token — elenco, emissione, audit, revoca — restano riservate al token radice.",
    "nl": "De console opent met een poort met één invoerveld. Er is één regel: alles onder /api/v1/ heeft een credential nodig, en een ontbrekende of verkeerde is altijd een 401. admin_required accepteert vier schrijfwijzen van die credential — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer en ?token= — en het root-POPOPX_ADMIN_TOKEN werkt nog overal. Daarnaast beperken gescopete pxa_…-tokens wat een aanroeper mag: een scope is * of core:<resource>:ro|rw of plugin:<id>:ro|rw, GET en HEAD vragen alleen ro, al het andere vraagt rw, core:admin is nooit toe te kennen, de looptijd is 1 tot 3650 dagen, en een token kan worden ingetrokken. De console houdt een tokenaudit bij over de laatste 5000 regels, en de vier tokenroutes — lijst, uitgifte, audit, intrekking — blijven alleen voor het root-token.",
    "cs": "Konzole se otevírá branou s jediným vstupním polem. Pravidlo je jediné: všechno pod /api/v1/ chce přihlašovací údaj, a chybějící nebo špatný je vždy 401. admin_required přijímá čtyři podoby tohoto údaje — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer a ?token= — a kořenový POPOPX_ADMIN_TOKEN stále platí všude. Za ním omezují rozsahové tokeny pxa_… to, co volající smí: rozsah je * nebo core:<resource>:ro|rw nebo plugin:<id>:ro|rw, GET a HEAD potřebují jen ro, vše ostatní vyžaduje rw, core:admin nelze nikdy udělit, platnost je 1 až 3650 dní a token lze odvolat. Konzole vede audit tokenů za posledních 5000 řádků a čtyři tokenové cesty — seznam, vydání, audit, odvolání — zůstávají jen pro kořenový token.",
    "zh-Hans": "打开后台先看到一扇只有输入框的门。规则只有一条：/api/v1/* 全都要凭据，缺失或不对一律 401。admin_required 收四种写法——X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer 和 ?token=；根令牌 POPOPX_ADMIN_TOKEN 仍然哪儿都认。再往后，带作用域的 pxa_… 令牌限制调用方能做什么：作用域写法是 *、core:<resource>:ro|rw 或 plugin:<id>:ro|rw，GET 与 HEAD 只需 ro，其余方法要 rw，core:admin 永不可授予，有效期 1 到 3650 天，令牌可吊销。后台保留最近 5000 行的令牌审计；令牌的四条路由——列表、签发、审计、吊销——只有根令牌能走。",
    "zh-Hant": "打開後臺先看到一扇只有輸入框的門。規則只有一條：/api/v1/* 全都要憑證，遺失或不對一律 401。admin_required 收四種寫法——X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer 和 ?token=；根權杖 POPOPX_ADMIN_TOKEN 仍然哪裡都認。再往後，帶作用域的 pxa_… 權杖限制呼叫端能做什麼：作用域寫法是 *、core:<resource>:ro|rw 或 plugin:<id>:ro|rw，GET 與 HEAD 只需 ro，其餘方法要 rw，core:admin 永不可授予，有效期 1 到 3650 天，權杖可撤銷。後臺保留最近 5000 列的權杖稽核；權杖的四條路由——清單、簽發、稽核、撤銷——只有根權杖能走。",
    "es": "La consola se abre con una puerta que tiene un solo campo. Hay una regla: todo lo que está bajo /api/v1/ necesita una credencial, y una ausente o incorrecta siempre es un 401. admin_required acepta cuatro grafías de esa credencial — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer y ?token= —, y el POPOPX_ADMIN_TOKEN raíz sigue funcionando en todas partes. Más allá, los tokens pxa_… con ámbito limitan lo que un llamante puede hacer: un ámbito es * o core:<resource>:ro|rw o plugin:<id>:ro|rw, GET y HEAD solo necesitan ro, todo lo demás exige rw, core:admin nunca se puede conceder, la caducidad va de 1 a 3650 días y un token se puede revocar. La consola guarda una auditoría de tokens de las últimas 5000 filas, y las cuatro rutas de tokens — lista, emisión, auditoría, revocación — siguen siendo solo para el token raíz.",
    "pl": "Konsola otwiera się bramką z jednym polem wejściowym. Zasada jest jedna: wszystko pod /api/v1/ wymaga poświadczenia, a brakujące lub błędne to zawsze 401. admin_required przyjmuje cztery zapisy tego poświadczenia — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer i ?token= — a główny POPOPX_ADMIN_TOKEN nadal działa wszędzie. Poza nim tokeny pxa_… z zakresem ograniczają, co wolno wywołującemu: zakres to * albo core:<resource>:ro|rw, albo plugin:<id>:ro|rw, GET i HEAD potrzebują tylko ro, wszystko inne wymaga rw, core:admin nigdy nie da się przyznać, ważność wynosi od 1 do 3650 dni, a token można odwołać. Konsola prowadzi audyt tokenów z ostatnich 5000 wierszy, a cztery trasy tokenów — lista, wydanie, audyt, odwołanie — pozostają tylko dla tokenu głównego.",
    "ja": "コンソールを開くと、入力欄が1つだけの門があります。規則はただ1つ。/api/v1/ の下はすべて資格情報を要求し、無いか値が違うなら常に 401 です。admin_required はその資格情報を4通りで受け付けます — X-Popopx-Admin-Token、X-Admin-Token、Authorization: Bearer、?token= —。ルートの POPOPX_ADMIN_TOKEN は今もどこでも通ります。その先では、スコープ付きの pxa_… トークンが呼び出し側のできることを狭めます。スコープは *、core:<resource>:ro|rw、plugin:<id>:ro|rw のいずれかで、GET と HEAD は ro だけで足り、それ以外は rw が必要です。core:admin は決して付与できず、有効期間は1日から3650日、トークンは失効できます。コンソールは直近5000行のトークン監査を保ち、4つのトークンルート — 一覧、発行、監査、失効 — はルートトークン専用のままです。",
    "th": "หน้าคอนโซลเปิดด้วยประตูที่มีช่องกรอกเดียว กติกามีข้อเดียว: ทุกอย่างใต้ /api/v1/ ต้องมี credential ถ้าไม่มีหรือผิดคือ 401 เสมอ admin_required รับ credential ได้สี่แบบ — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer และ ?token= — และ POPOPX_ADMIN_TOKEN ระดับ root ยังใช้ได้ทุกที่ ถัดจากนั้น token pxa_… แบบมี scope จะจำกัดสิ่งที่ผู้เรียกทำได้: scope คือ * หรือ core:<resource>:ro|rw หรือ plugin:<id>:ro|rw โดย GET กับ HEAD ต้องการแค่ ro ส่วนวิธีอื่นต้องใช้ rw, core:admin ให้ไม่ได้เด็ดขาด อายุใช้งาน 1 ถึง 3650 วัน และ token ถูกเพิกถอนได้ คอนโซลเก็บ audit token ไว้ 5000 แถวล่าสุด และเส้นทาง token ทั้งสี่ — list, mint, audit, revoke — ยังเป็นของ root เท่านั้น",
    "fi": "Konsoli aukeaa portilla, jossa on yksi syöttökenttä. Sääntö on yksi: kaikki polun /api/v1/ alla vaativat tunnisteen, ja puuttuva tai väärä on aina 401. admin_required hyväksyy tunnisteesta neljä kirjoitusasua — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer ja ?token= — ja juuri-POPOPX_ADMIN_TOKEN toimii edelleen kaikkialla. Sen jälkeen rajatuilla pxa_…-tokeneilla kavennetaan sitä, mitä kutsuja saa tehdä: laajuus on * tai core:<resource>:ro|rw tai plugin:<id>:ro|rw, GET ja HEAD tarvitsevat vain ron, kaikki muu vaatii rwn, core:adminia ei voi koskaan myöntää, voimassaolo on 1–3650 päivää ja tokenin voi peruuttaa. Konsoli pitää token-tarkastuslokirjaa viimeisistä 5000 rivistä, ja neljä tokenreittiä — lista, myöntö, auditointi, peruutus — pysyvät vain juuritokenilla.",
    "uk": "Консоль відкривається брамою з одним полем введення. Правило одне: усе під /api/v1/ потребує облікових даних, а відсутні або хибні — це завжди 401. admin_required приймає чотири написання цих даних — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer і ?token= — і кореневий POPOPX_ADMIN_TOKEN, як і раніше, працює всюди. Далі обмежені токени pxa_… звужують те, що може робити викликач: область — це * або core:<resource>:ro|rw, або plugin:<id>:ro|rw, для GET і HEAD достатньо ro, для всього іншого потрібен rw, core:admin видати неможливо, термін дії — від 1 до 3650 днів, а токен можна відкликати. Консоль веде аудит токенів на останні 5000 рядків, а чотири маршрути токенів — список, випуск, аудит і відкликання — лишаються тільки для кореневого.",
    "bg": "Конзолата се отваря с порта, която има само едно входно поле. Правилото е едно: всичко под /api/v1/ изисква идентификационни данни, а липсващи или грешни са винаги 401. admin_required приема четири изписвания на тези данни — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer и ?token= — и коренният POPOPX_ADMIN_TOKEN продължава да работи навсякъде. След него токените pxa_… с обхват стесняват какво може да прави извикващият: обхватът е * или core:<resource>:ro|rw, или plugin:<id>:ro|rw, за GET и HEAD е достатъчно ro, всичко останало изисква rw, core:admin никога не може да бъде даден, срокът е от 1 до 3650 дни, а токенът може да бъде оттеглен. Конзолата води одит на токените за последните 5000 реда, а четирите маршрута за токени — списък, издаване, одит и отнемане — остават само за кореновия токен.",
    "tr": "Konsol, tek giriş alanlı bir kapıyla açılır. Tek kural şu: /api/v1/ altındaki her şey bir kimlik bilgisi ister; eksik ya da yanlışsa yanıt hep 401'dir. admin_required bu kimlik bilgisini dört yazımla kabul eder — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer ve ?token= — ve kök POPOPX_ADMIN_TOKEN her yerde çalışmaya devam eder. Onun ötesinde kapsamlı pxa_… jetonları, çağıranın neler yapabileceğini daraltır: kapsam * ya da core:<resource>:ro|rw ya da plugin:<id>:ro|rw olur, GET ve HEAD yalnızca ro ister, diğer her şey rw gerektirir, core:admin asla verilemez, süre 1 ile 3650 gün arasındadır ve bir jeton iptal edilebilir. Konsol son 5000 satır için jeton denetimi tutar ve dört jeton rotası — liste, üretim, denetim, iptal — yalnızca kök jetonla çalışır.",
    "hu": "A konzol egy kapuval nyílik, amelyen egyetlen beviteli mező van. Egy szabály létezik: minden, a /api/v1/ alatt lévő végpont hitelesítő adatot kér, és a hiányzó vagy hibás mindig 401. Az admin_required négy írásmódot fogad el erre az adatra — X-Popopx-Admin-Token, X-Admin-Token, Authorization: Bearer és ?token= —, a gyökér POPOPX_ADMIN_TOKEN pedig továbbra is mindenhol működik. Ezen túl a hatókörrel bíró pxa_… tokenek szűkítik, mit tehet a hívó: a hatókör * vagy core:<resource>:ro|rw vagy plugin:<id>:ro|rw, a GET és a HEAD csak ro-t igényel, minden más rw-t kér, a core:admin soha nem adható ki, a lejárat 1 és 3650 nap között van, és egy token visszavonható. A konzol az utolsó 5000 sor tokennaplóját őrzi, és a négy tokenútvonal — lista, kiadás, napló, visszavonás — továbbra is csak a gyökértokené.",
  } satisfies L,
  gateField: {
    en: "The field is the admin token; the two buttons are Enter console and Check connectivity. The token lives only in browser memory and this session.",
    "ru": "Поле — админ-токен, а две кнопки называются «Enter console» и «Check connectivity»; токен живёт только в памяти браузера и в текущей сессии.",
    "de": "Das Feld ist das Admin-Token, die zwei Knöpfe heißen Enter console und Check connectivity; das Token lebt nur im Browser-Speicher und in dieser Sitzung.",
    "fr": "Le champ est le jeton d'administration, les deux boutons s'appellent Enter console et Check connectivity ; le jeton ne vit que dans la mémoire du navigateur et cette session.",
    "it": "Il campo è il token di amministrazione, i due pulsanti si chiamano Enter console e Check connectivity; il token vive solo nella memoria del browser e in questa sessione.",
    "nl": "Het veld is het admin-token, de twee knoppen heten Enter console en Check connectivity; het token leeft alleen in browsergeheugen en deze sessie.",
    "cs": "Pole je admin token, dvě tlačítka se jmenují Enter console a Check connectivity; token žije jen v paměti prohlížeče a v této relaci.",
    "zh-Hans": "输入框是「管理令牌」，两个按钮分别是「进入控制台」和「检查连通」；令牌只存在浏览器内存与本次会话里。",
    "zh-Hant": "輸入框是「管理權杖」，兩個按鈕分別是「進入後臺」和「檢查連通」；權杖只存在瀏覽器記憶體與這次工作階段裡。",
    "es": "El campo es el token de administración y los dos botones se llaman Enter console y Check connectivity; el token solo vive en la memoria del navegador y en esta sesión.",
    "pl": "Pole to token administratora, a dwa przyciski nazywają się Enter console i Check connectivity; token żyje wyłącznie w pamięci przeglądarki i w tej sesji.",
    "ja": "入力欄は管理トークンで、2つのボタンは Enter console と Check connectivity です。トークンはブラウザーのメモリと今回のセッションにだけ保持されます。",
    "th": "ช่องกรอกคือโทเคนผู้ดูแล ส่วนปุ่มสองปุ่มชื่อ Enter console กับ Check connectivity โทเคนจะถูกเก็บไว้ในหน่วยความจำของเบราว์เซอร์และในเซสชันนี้เท่านั้น",
    "fi": "Kenttä on ylläpilotunnus, ja kaksi painiketta ovat Enter console ja Check connectivity; token elää vain selaimen muistissa ja tässä istunnossa.",
    "uk": "Поле — це адмін-токен, а дві кнопки називаються «Enter console» і «Check connectivity»; токен живе лише в пам'яті браузера й у цій сесії.",
    "bg": "Полето е административният токен, а двете бутона се казват Enter console и Check connectivity; токенът съществува само в паметта на браузъра и в тази сесия.",
    "tr": "Alan yönetici jetonudur, iki düğmenin adı Enter console ve Check connectivity'dir; jeton yalnızca tarayıcı belleğinde ve bu oturumda bulunur.",
    "hu": "A mező az adminisztrátori token, a két gomb felirata Enter console és Check connectivity; a token csak a böngésző memóriájában és ebben a munkamenetben létezik.",
  } satisfies L,
  unauthorized: `401 {"ok": false, "error": "unauthorized"}`,
  unauthorizedCap: {
    en: "That is the middleware's 401 verbatim; the one admin_required raises inside a route adds the detail provide an admin token, which the console then rewords as a missing or incorrect admin token. All five exceptions are deliberate: /, /healthz and /h5/{article_id} are public, and POST /api/v1/verifyH5Auth authenticates itself with the phone-side HMAC signature; POST /api/v1/workflows/trigger is public at this middleware but authenticates with its own X-PPX-Workflow-Token per subscription, which can expire and be revoked; plugin paths ending in /webhook, /verify or /callback ask for no admin token because each has its own per-source token or a back-to-back caller; and GET /api/v1/plugins/sso/sessions/{session_id} is exempted by an exact verb-plus-route-template match, because a scan page has to poll it before any login exists.",
    "ru": "Это дословный 401 промежуточного слоя; тот, что admin_required поднимает внутри маршрута, добавляет detail provide an admin token, и консоль переписывает его как отсутствующий или неверный админ-токен. Все пять исключений намеренны: /, /healthz и /h5/{article_id} публичны, а POST /api/v1/verifyH5Auth удостоверяется телефонной HMAC-подписью; POST /api/v1/workflows/trigger публичен для этого слоя, но удостоверяется собственным X-PPX-Workflow-Token для каждой подписки, который может истекать и отзываться; плагинные пути на /webhook, /verify и /callback админ-токена не спрашивают, потому что у каждого есть свой per-source токен или вызывающий напрямую; и GET /api/v1/plugins/sso/sessions/{session_id} освобождён точным совпадением «глагол + шаблон маршрута», ведь страница сканирования должна опрашивать его до всякого логина.",
    "de": "Das ist der 401 der Middleware im Wortlaut; der von admin_required innerhalb einer Route ergänzt das Detail provide an admin token, das die Konsole als fehlendes oder falsches Admin-Token umformuliert. Alle fünf Ausnahmen sind Absicht: /, /healthz und /h5/{article_id} sind öffentlich, und POST /api/v1/verifyH5Auth weist sich mit der telefonseitigen HMAC-Signatur aus; POST /api/v1/workflows/trigger ist für diese Middleware öffentlich, authentifiziert sich aber mit einem eigenen X-PPX-Workflow-Token je Abonnement, das ablaufen und widerrufen werden kann; Plugin-Pfade auf /webhook, /verify und /callback fragen kein Admin-Token ab, weil jeder ein eigenes per-source-Token oder einen direkten Anrufer hat; und GET /api/v1/plugins/sso/sessions/{session_id} ist durch exakte Übereinstimmung von Verb plus Routenvorlage ausgenommen, weil eine Scan-Seite es vor jedem Login abfragen muss.",
    "fr": "C'est le 401 du middleware mot pour mot ; celui qu'admin_required lève dans une route ajoute le détail provide an admin token, que la console reformule en jeton d'administration absent ou incorrect. Les cinq exceptions sont voulues : /, /healthz et /h5/{article_id} sont publics, et POST /api/v1/verifyH5Auth s'authentifie par la signature HMAC côté téléphone ; POST /api/v1/workflows/trigger est public pour ce middleware mais s'authentifie avec son propre X-PPX-Workflow-Token par abonnement, qui peut expirer et être révoqué ; les chemins de plugins sur /webhook, /verify et /callback ne demandent aucun jeton d'administration, car chacun a son propre jeton par source ou un appelant direct ; et GET /api/v1/plugins/sso/sessions/{session_id} est exempté par une correspondance exacte verbe plus modèle de route, parce qu'une page de scan doit l'interroger avant toute connexion.",
    "it": "È il 401 del middleware alla lettera; quello che admin_required solleva dentro una rotta aggiunge il dettaglio provide an admin token, che la console riformula come token di amministrazione mancante o errato. Tutte e cinque le eccezioni sono volute: /, /healthz e /h5/{article_id} sono pubblici, e POST /api/v1/verifyH5Auth si autentica con la firma HMAC lato telefono; POST /api/v1/workflows/trigger è pubblico per questo middleware ma si autentica con il proprio X-PPX-Workflow-Token per abbonamento, che può scadere ed essere revocato; i percorsi dei plugin su /webhook, /verify e /callback non chiedono token di amministrazione perché ciascuno ha il proprio token per fonte o un chiamante diretto; e GET /api/v1/plugins/sso/sessions/{session_id} è esentato da una corrispondenza esatta verbo più modello di rotta, dato che una pagina di scansione deve interrogarlo prima che esista un login.",
    "nl": "Dat is de 401 van de middleware letterlijk; die admin_required binnen een route opwerpt voegt het detail provide an admin token toe, dat de console herformuleert als een ontbrekend of verkeerd admin-token. Alle vijf uitzonderingen zijn opzettelijk: /, /healthz en /h5/{article_id} zijn publiek, en POST /api/v1/verifyH5Auth bewijst zichzelf met de telefoonzijde HMAC-handtekening; POST /api/v1/workflows/trigger is publiek voor deze middleware maar authenticeert met zijn eigen X-PPX-Workflow-Token per abonnement, dat kan verlopen en worden ingetrokken; pluginpaden op /webhook, /verify en /callback vragen geen admin-token omdat elk een eigen per-source token of een directe aanroeper heeft; en GET /api/v1/plugins/sso/sessions/{session_id} is vrijgesteld door een exacte overeenkomst van werkwoord plus routemal, omdat een scanpagina het vóór elke login moet polleren.",
    "cs": "To je doslovný 401 middleware; ten, který admin_required vyhazuje uvnitř cesty, přidává detail provide an admin token, jejž konzole přeformuluje jako chybějící nebo špatný admin token. Všech pět výjimek je záměrných: /, /healthz a /h5/{article_id} jsou veřejné a POST /api/v1/verifyH5Auth se prokazuje telefonním HMAC podpisem; POST /api/v1/workflows/trigger je pro tento middleware veřejný, ale autentizuje se vlastním X-PPX-Workflow-Token na odběr, který může vypršet a být odvolán; cesty pluginů na /webhook, /verify a /callback admin token nechtějí, protože každá má vlastní per-source token nebo přímého volajícího; a GET /api/v1/plugins/sso/sessions/{session_id} je vyňat přesnou shodou slovesa a šablony cesty, protože skenovací stránka jej musí dotazovat dřív, než existuje přihlášení.",
    "zh-Hans": "中间件那条 401 就是这一句；路由内 admin_required 抛的那条会多带 detail「provide an admin token」，后台再把它换成「管理令牌缺失或不正确」。五类例外都是有意为之：/、/healthz、/h5/{article_id} 公开，POST /api/v1/verifyH5Auth 靠手机侧的 HMAC 签名证明调用者；POST /api/v1/workflows/trigger 在这一层公开，但每次订阅用自己的 X-PPX-Workflow-Token 认证，可过期、可吊销；以 /webhook、/verify、/callback 结尾的插件路径不问管理令牌，它们各有 per-source token 或背靠背调用方；扫码页要能在拿到登录态之前轮询，所以 GET /api/v1/plugins/sso/sessions/{session_id} 是按「动词 + 路由模板」精确豁免的一条。",
    "zh-Hant": "中間件那條 401 就是這一句；路由內 admin_required 拋的那條會多帶 detail「provide an admin token」，後臺再把它換成「管理權杖遺失或不正確」。五類例外都是有意為之：/、/healthz、/h5/{article_id} 公開，POST /api/v1/verifyH5Auth 靠手機側的 HMAC 簽名證明呼叫者；POST /api/v1/workflows/trigger 在這一層公開，但每次訂閱用自己的 X-PPX-Workflow-Token 認證，可過期、可撤銷；以 /webhook、/verify、/callback 結尾的插件路徑不問管理權杖，它們各有 per-source token 或背靠背呼叫端；掃碼頁要能在取得登入態之前輪詢，所以 GET /api/v1/plugins/sso/sessions/{session_id} 是按「動詞 + 路由範本」精確豁免的一條。",
    "es": "Ese es el 401 del middleware literal; el que admin_required lanza dentro de una ruta añade el detalle provide an admin token, que la consola reformula como token de administración ausente o incorrecto. Las cinco excepciones son deliberadas: /, /healthz y /h5/{article_id} son públicos, y POST /api/v1/verifyH5Auth se autentica con la firma HMAC del lado del teléfono; POST /api/v1/workflows/trigger es público para este middleware pero se autentica con su propio X-PPX-Workflow-Token por suscripción, que puede caducar y revocarse; las rutas de plugins en /webhook, /verify y /callback no piden token de administración porque cada una tiene su propio token por origen o un llamante directo; y GET /api/v1/plugins/sso/sessions/{session_id} queda exento por coincidencia exacta de verbo más plantilla de ruta, porque una página de escaneo tiene que sondearlo antes de que exista login alguno.",
    "pl": "To dosłowny 401 middleware; ten, który admin_required rzuca wewnątrz trasy, dodaje szczegół provide an admin token, a konsola przeformułowuje go jako brakujący lub błędny token administratora. Wszystkie pięć wyjątków jest celowych: /, /healthz i /h5/{article_id} są publiczne, a POST /api/v1/verifyH5Auth uwierzytelnia się podpisem HMAC ze strony telefonu; POST /api/v1/workflows/trigger jest publiczny dla tego middleware, ale uwierzytelnia się własnym X-PPX-Workflow-Token na subskrypcję, który może wygasnąć i zostać odwołany; ścieżki wtyczek na /webhook, /verify i /callback nie żądają tokenu administratora, bo każda ma własny token per źródło albo bezpośredniego wywołującego; a GET /api/v1/plugins/sso/sessions/{session_id} jest wyjęty przez dokładne dopasowanie czasownika i szablonu trasy, ponieważ strona skanowania musi go odpytywać, zanim powstanie jakikolwiek login.",
    "ja": "これはミドルウェアの 401 をそのまま示したものです。ルート内で admin_required が投げる 401 は detail「provide an admin token」を伴い、コンソールはそれを「管理トークンが無いか正しくない」と言い換えます。5つの例外はいずれも意図されたものです。/, /healthz, /h5/{article_id} は公開で、POST /api/v1/verifyH5Auth はスマホ側の HMAC 署名で呼び出し元を証明します。POST /api/v1/workflows/trigger はこのミドルウェアには公開ですが、購読ごとの X-PPX-Workflow-Token で認証し、そのトークンは期限切れと失効がありえます。/webhook、/verify、/callback で終わるプラグインのパスは管理トークンを要求しません。それぞれに per-source トークンか直接呼び出し側があるからです。GET /api/v1/plugins/sso/sessions/{session_id} は動詞とルートテンプレートの完全一致で除外されています。スキャンページはログインが成立する前にこれをポーリングしなければなりません。",
    "th": "นี่คือ 401 ของ middleware ตามต้นฉบับ ส่วนอันที่ admin_required โยนภายในเส้นทางจะเพิ่ม detail「provide an admin token」และคอนโซลจะเรียบเรียงใหม่เป็นโทเคนผู้ดูแลที่หายไปหรือไม่ถูกต้อง ข้อยกเว้นทั้งห้าตั้งไว้โดยเจตนา: /, /healthz และ /h5/{article_id} เป็นสาธารณะ และ POST /api/v1/verifyH5Auth ยืนยันตัวด้วยลายเซ็น HMAC จากฝั่งมือถือ; POST /api/v1/workflows/trigger เป็นสาธารณะต่อ middleware นี้ แต่ยืนยันตัวด้วย X-PPX-Workflow-Token ของแต่ละ subscription ซึ่งหมดอายุและถูกเพิกถอนได้; เส้นทางปลั๊กอินที่ลงท้าย /webhook, /verify และ /callback ไม่ถามโทเคนผู้ดูแล เพราะแต่ละตัวมี per-source token ของตัวเองหรือมีผู้เรียกตรง ๆ; และ GET /api/v1/plugins/sso/sessions/{session_id} ได้รับยกเว้นด้วยการจับคู่คำกริยากับแม่แบบเส้นทางแบบตรงตัว เพราะหน้าสแกนต้องโพลล์มันก่อนที่จะมีล็อกอินใด ๆ",
    "fi": "Tuo on middlewaren 401 sellaisenaan; se, jonka admin_required nostaa reitin sisällä, lisää detailin provide an admin token, jonka konsoli muotoilee uudelleen puuttuvaksi tai vääräksi ylläpilotunnukseksi. Kaikki viisi poikkeusta ovat tarkoituksellisia: /, /healthz ja /h5/{article_id} ovat julkisia, ja POST /api/v1/verifyH5Auth todistaa itsensä puhelimen HMAC-signatuurilla; POST /api/v1/workflows/trigger on tälle middlewarelle julkinen mutta tunnistautuu omalla X-PPX-Workflow-Tokenillaan tilausta kohti, ja se voi vanheta ja tulla peruutetuksi; lisäosien polut /webhook, /verify ja /callback eivät kysy ylläpilotunnusta, koska jokaisella on oma sourcekohtainen tokeninsa tai suora kutsuja; ja GET /api/v1/plugins/sso/sessions/{session_id} on vapautettu tarkalla verbin ja reittimallin täsmäytyksellä, koska skenaussivun pitää kysellä sitä ennen kuin kirjautumista on olemassa.",
    "uk": "Це дослівний 401 проміжного шару; той, що admin_required піднімає всередині маршруту, додає detail provide an admin token, і консоль переписує його як відсутній або хибний адмін-токен. Усі п'ять винятків навмисні: /, /healthz і /h5/{article_id} публічні, а POST /api/v1/verifyH5Auth засвідчується телефонним HMAC-підписом; POST /api/v1/workflows/trigger публічний для цього шару, але удостоверяється власним X-PPX-Workflow-Token на кожну підписку, який може спливати й відкликатися; шляхи плагінів на /webhook, /verify та /callback не питають адмін-токена, бо кожен має власний per-source токен або викликача напряму; і GET /api/v1/plugins/sso/sessions/{session_id} звільнено точним збігом «дієслово + шаблон маршруту», адже сторінка сканування мусить опитувати його до будь-якого входу.",
    "bg": "Това е 401 на middleware дословно; онова, което admin_required хвърля вътре в маршрут, добавя detail provide an admin token, а конзолата го преформулира като липсващ или грешен административен токен. И петте изключения са умишлени: /, /healthz и /h5/{article_id} са публични, а POST /api/v1/verifyH5Auth се удостоверява с HMAC подписа от страната на телефона; POST /api/v1/workflows/trigger е публичен за този middleware, но се удостоверява със своя X-PPX-Workflow-Token за всеки абонамент, който може да изтече и да бъде оттеглен; пътеките на приставките /webhook, /verify и /callback не искат административен токен, защото всяка има собствен per-source токен или директен обадящ; и GET /api/v1/plugins/sso/sessions/{session_id} е изключен чрез точно съвпадение на глагол и шаблон на маршрут, понеже сканираща страница трябва да го анкетира преди да съществува какъвто и да е вход.",
    "tr": "Bu, middleware'in 401'idir, aynen; admin_required'ın bir rota içinde fırlattığı 401 ise provide an admin token ayrıntısını ekler ve konsol bunu eksik ya da yanlış yönetici jetonu olarak yeniden yazar. Beş istisnanın hepsi bilinçli: /, /healthz ve /h5/{article_id} açıktır ve POST /api/v1/verifyH5Auth kimliğini telefon tarafındaki HMAC imzasıyla kanıtlar; POST /api/v1/workflows/trigger bu middleware için açıktır ama her abonelik için kendi X-PPX-Workflow-Token'ıyla kimlik doğrular ve bu jeton süresi dolabilir, iptal edilebilir; /webhook, /verify ve /callback ile biten eklenti yolları yönetici jetonu sormaz, çünkü her birinin kendi kaynak-özel jetonu ya da doğrudan çağıranı vardır; ve GET /api/v1/plugins/sso/sessions/{session_id} tam fiil-artı-rota-şablonu eşleşmesiyle muaf tutulur, çünkü bir tarama sayfası herhangi bir oturum açmadan önce onu yoklamak zorundadır.",
    "hu": "Ez a middleware 401-je szó szerint; amelyet az admin_required egy útvonalon belül dob, az hozzáteszi a provide an admin token részletet, amit a konzol hiányzó vagy hibás adminisztrátori tokenként fogalmaz újra. Mind az öt kivétel szándékos: a /, a /healthz és a /h5/{article_id} nyilvános, a POST /api/v1/verifyH5Auth pedig a telefon oldali HMAC-alírásával igazolja magát; a POST /api/v1/workflows/trigger e middleware felé nyilvános, de előfizetésenként saját X-PPX-Workflow-Tokennal hitelesít, amely lejárhat és visszavonható; a /webhook, /verify és /callback végű bővítmény-útvonalak nem kérnek adminisztrátori tokent, mert mindegyiknek megvan a maga forrásfüggő tokenje vagy közvetlen hívója; a GET /api/v1/plugins/sso/sessions/{session_id} pedig pontos ige-plusz-útvonalsablon egyezéssel mentesül, mert egy szkennelő oldalnak minden bejelentkezés előtt le kell kérdeznie.",
  } satisfies L,
  apiTitle: {
    en: "The five actions operators run most (verbatim from the README)",
    "ru": "Пять операций, которые администраторы запускают чаще всего (дословно из README)",
    "de": "Die fünf Aktionen, die Betreiber am häufigsten ausführen (wörtlich aus dem README)",
    "fr": "Les cinq actions que les opérateurs lancent le plus (mot pour mot depuis le README)",
    "it": "Le cinque azioni che gli operatori eseguono più spesso (testualmente dal README)",
    "nl": "De vijf acties die operators het vaakst uitvoeren (letterlijk uit de README)",
    "cs": "Pět akcí, které operatéři spouštějí nejčastěji (přesně z README)",
    "zh-Hans": "最常做的五个动作（README 里的原样）",
    "zh-Hant": "最常做的五個動作（README 裡的原樣）",
    "es": "Las cinco acciones que los operadores ejecutan más (tal cual del README)",
    "pl": "Pięć akcji, które operatorzy uruchamiają najczęściej (dosłownie z README)",
    "ja": "運用者が最も頻繁に打つ5つの操作（README のそのまま）",
    "th": "ห้าการกระทำที่ผู้ดูแลระบบใช้บ่อยที่สุด (ถ้อยคำตรงกับ README)",
    "fi": "Viisi operaattorien useimmin ajamaa toimea (sanasta sanaan README:stä)",
    "uk": "П'ять операцій, які адміністратори запускають найчастіше (дослівно з README)",
    "bg": "Петте действия, които операторите пускат най-често (дума по дума от README)",
    "tr": "Operatörlerin en sık çalıştırdığı beş eylem (README'den olduğu gibi)",
    "hu": "Az öt leggyakrabban futtatott művelet (szó szerint a README-ből)",
  } satisfies L,
  apiSetupCap: {
    en: "Run all three assignments from the repository root: the first reads the token out of .env, the second points $API at the local gateway, and the third sets CHANNEL_ID — ops-demo is only a placeholder, so put a real channel id there, the one GET /api/v1/channels lists, before you run the channel commands. Everything below reuses these three.",
    "ru": "Все три присваивания выполняются из корня репозитория: первое вычитывает токен из .env, второе направляет $API на локальный шлюз, а третье задаёт CHANNEL_ID — ops-demo это всего лишь заполнитель, подставьте настоящий id канала, тот самый, что перечисляет GET /api/v1/channels, прежде чем запускать команды канала. Каждая команда ниже переиспользует их.",
    "de": "Alle drei Zuweisungen laufen aus der Repository-Wurzel: die erste liest das Token aus .env, die zweite zeigt mit $API auf das lokale Gateway, und die dritte setzt CHANNEL_ID — ops-demo ist nur ein Platzhalter, tragen Sie dort eine echte Kanal-id ein, diejenige, die GET /api/v1/channels auflistet, bevor die Kanalbefehle laufen. Jeder Befehl darunter nutzt diese drei weiter.",
    "fr": "Les trois affectations se lancent depuis la racine du dépôt : la première lit le jeton dans .env, la deuxième pointe $API sur la passerelle locale, et la troisième définit CHANNEL_ID — ops-demo n'est qu'un espace réservé ; mettez-y un vrai id de canal, celui que GET /api/v1/channels liste, avant de lancer les commandes du canal. Chaque commande ci-dessous les réutilise.",
    "it": "Tutti e tre gli assegnamenti partono dalla radice del repository: il primo legge il token da .env, il secondo punta $API sul gateway locale, e il terzo imposta CHANNEL_ID — ops-demo è solo un segnaposto; mettete un id di canale reale, quello che GET /api/v1/channels elenca, prima di lanciare i comandi del canale. Ogni comando qui sotto li riutilizza.",
    "nl": "Alle drie toekenningen draaien vanuit de repository-root: de eerste leest het token uit .env, de tweede richt $API op de lokale gateway, en de derde zet CHANNEL_ID — ops-demo is maar een placeholder; zet er een echte kanaal-id neer, die van GET /api/v1/channels, voor u de kanaalcommando's draait. Elk commando hieronder hergebruikt ze.",
    "cs": "Všechna tři přiřazení se spouštějí z kořene repozitáře: první načte token z .env, druhý namíří $API na lokální bránu a třetí nastaví CHANNEL_ID — ops-demo je jen zástupný údaj; před příkazy kanálu tam zadejte skutečné id kanálu, které vypíše GET /api/v1/channels. Každý příkaz níže je znovu používá.",
    "zh-Hans": "三条赋值都在仓库根目录执行：第一条从 .env 里读令牌，第二条把 $API 指向本机网关，第三条设 CHANNEL_ID——ops-demo 只是占位值，跑频道命令前先换成 GET /api/v1/channels 列出的那个真实 id。下面每条命令都复用这三个变量。",
    "zh-Hant": "三條賦值都在倉庫根目錄執行：第一條從 .env 讀權杖，第二條把 $API 指向本機閘道，第三條設 CHANNEL_ID——ops-demo 只是佔位值，跑頻道命令前先換成 GET /api/v1/channels 列出的那個真實 id。下面每條指令都沿用這三個變數。",
    "es": "Las tres asignaciones se ejecutan desde la raíz del repositorio: la primera lee el token de .env, la segunda apunta $API a la pasarela local, y la tercera fija CHANNEL_ID — ops-demo es solo un marcador de posición; ponga ahí un id de canal real, el que lista GET /api/v1/channels, antes de los comandos de canal. Cada comando de abajo las reutiliza.",
    "pl": "Wszystkie trzy przypisania wykonuje się z głównego katalogu repozytorium: pierwsze czyta token z .env, drugie kieruje $API na lokalną bramę, a trzecie ustawia CHANNEL_ID — to tylko zastępnik ops-demo; przed poleceniami kanału wstaw tam prawdziwe id kanału, które wylicza GET /api/v1/channels. Każde polecenie poniżej ich używa.",
    "ja": "3つの代入はいずれもリポジトリのルートから実行します。1つ目は .env からトークンを読み、2つ目は $API をローカルのゲートウェイに向けます。3つ目は CHANNEL_ID を設定しますが、ops-demo はただのプレースホルダーなので、チャンネル系の命令を走らせる前に、GET /api/v1/channels が一覧する本物のチャンネル id に置き換えてください。下の命令はすべてこの3つの変数を使い回します。",
    "th": "การกำหนดค่าทั้งสามบรรทัดให้รันจาก root ของรีโป: บรรทัดแรกอ่านโทเคนจาก .env บรรทัดที่สองชี้ $API ไปยัง gateway ในเครื่อง บรรทัดที่สามตั้ง CHANNEL_ID ซึ่ง ops-demo เป็นแค่ค่าสำรอง — ก่อนจะรันคำสั่งของช่อง ให้เปลี่ยนเป็น id ช่องจริงที่ GET /api/v1/channels แสดงไว้ คำสั่งทั้งหมวดข้างล่างใช้ตัวแปรสามตัวนี้ต่อ",
    "fi": "Kaikki kolme kytkennää ajetaan repositorion juuresta: ensimmäinen lukee tokenin .env:stä, toinen osoittaa $API:n paikalliseen gatewayhin ja kolmas asettaa CHANNEL_ID:n — ops-demo on vain paikkamerkki, joten korvaa se aidolla kanavan id:llä, jonka GET /api/v1/channels listaa, ennen kanankomentoja. Alla olevat komennot hyödyntävät niitä.",
    "uk": "Усі три присвоювання виконуються з кореня репозиторію: перше вичитує токен із .env, друге спрямовує $API на локальний шлюз, а третє задає CHANNEL_ID — ops-demo це лише заповнювач, підставте справжній id каналу, той, що його перелічує GET /api/v1/channels, перед командами каналу. Кожна команда нижче перевикористовує їх.",
    "bg": "И трите присвоявания се изпълняват от корена на хранилището: първото прочита токена от .env, второто насочва $API към локалния шлюз, а третото задава CHANNEL_ID — ops-demo е само заместител; заменете го с реален id на канала, който GET /api/v1/channels изброява, преди заповедите за канала. Всяка команда по-долу ги преизползва.",
    "tr": "Üç atama da depo kökünden çalıştırılır: ilki tokenı .env içinden okur, ikincisi $API'yi yerel ağ geçidine yönlendirir, üçüncüsü ise CHANNEL_ID'yi ayarlar — ops-demo yalnızca bir yer tutucudur; kanal komutlarını çalıştırmadan önce onu GET /api/v1/channels'in sıraladığı gerçek bir kanal id'si ile değiştirin. Aşağıdaki her komut bu üçünü yeniden kullanır.",
    "hu": "Mind a három hozzárendelést a repó gyökeréből futtatjuk: az első kiolvassa a tokent a .env-ből, a második az $API-t a helyi átjáróra irányítja, a harmadik pedig beállítja a CHANNEL_ID-t — az ops-demo csak egy helyőrző, a csatorna-parancsok előtt cserélje le a GET /api/v1/channels által felsorolt valódi csatorna-id-re. Az alábbi minden parancs őket használja újra.",
  } satisfies L,
  statusCap: {
    en: "First make sure the console and the command line are looking at the same account and the same node state.",
    "ru": "Сначала убедитесь, что консоль и командная строка смотрят на один и тот же аккаунт и в одно и то же состояние узла.",
    "de": "Stellen Sie zuerst sicher, dass Konsole und Kommandozeile auf denselben Account und denselben Knotenzustand schauen.",
    "fr": "D'abord, vérifiez que la console et la ligne de commande regardent le même compte et le même état de nœud.",
    "it": "Prima assicurati che console e riga di comando stiano guardando lo stesso account e lo stesso stato del nodo.",
    "nl": "Zorg er eerst voor dat console en commandoregel naar hetzelfde account en dezelfde nodestatus kijken.",
    "cs": "Nejprve si ověřte, že konzola i příkazový řádek se dívají na stejný účet a stejný stav uzlu.",
    "zh-Hans": "先确认后台和命令行看到的是同一个账户、同一个节点状态。",
    "zh-Hant": "先確認後臺和命令列看到的是同一個帳戶、同一個節點狀態。",
    "es": "Primero asegúrate de que la consola y la línea de comandos miran la misma cuenta y el mismo estado del nodo.",
    "pl": "Najpierw upewnij się, że konsola i wiersz poleceń patrzą na to samo konto i ten sam stan węzła.",
    "ja": "まず、コンソールとコマンドラインが同じアカウントと同じノード状態を見ていることを確認してください。",
    "th": "ก่อนอื่นทำให้แน่ใจว่าหน้าคอนโซลกับแถวคำสั่งมองเห็นบัญชีเดียวกันและสถานะโหนดเดียวกัน",
    "fi": "Varmista ensin, että konsoli ja komentorivi katsovat samaa tiliä ja samaa solmun tilaa.",
    "uk": "Спершу переконайтеся, що консоль і командний рядок дивляться на той самий акаунт і той самий стан вузла.",
    "bg": "Първо се уверете, че конзолата и командният ред гледат един и същ акаунт и едно и също състояние на възела.",
    "tr": "Önce konsol ile komut satırının aynı hesabı ve aynı düğüm durumunu gördüğünden emin olun.",
    "hu": "Először győződjön meg róla, hogy a konzol és a parancssor ugyanarra a fiókra és ugyanarra a csomópont-állapotra néz.",
  } satisfies L,
  tokenQueryCap: {
    en: "Both spellings, so you can check from a browser whether a route really is covered by the token.",
    "ru": "Оба написания, чтобы вы могли проверить из браузера, действительно ли маршрут закрыт токеном.",
    "de": "Beide Schreibweisen, damit Sie im Browser prüfen können, ob eine Route wirklich vom Token gedeckt ist.",
    "fr": "Les deux orthographes, afin que vous puissiez vérifier depuis un navigateur qu'une route est bien couverte par le jeton.",
    "it": "Entrambe le scritture, così puoi verificare da un browser che una rotta sia davvero coperta dal token.",
    "nl": "Beide schrijfwijzen, zodat u vanuit een browser kunt controleren of een route echt door het token gedekt is.",
    "cs": "Obě varianty zápisu, ať si v prohlížeči ověříte, jestli je route skutečně pokrytá tokenem.",
    "zh-Hans": "两种给法各演示一次，方便你在浏览器里手工验证一条路由是不是真的被令牌盖住了。",
    "zh-Hant": "兩種給法各示範一次，方便你在瀏覽器裡手工驗證一條路由是不是真的被權杖蓋住了。",
    "es": "Las dos escrituras, para que puedas comprobar desde un navegador si una ruta está realmente cubierta por el token.",
    "pl": "Oba sposoby zapisu, żebyś mógł w przeglądarce sprawdzić, czy trasa jest naprawdę objęta tokenem.",
    "ja": "両方の書き方を載せています。ブラウザーから、そのルートが本当にトークンで守られているか確認できます。",
    "th": "ใส่มาให้ทั้งสองรูปแบบ เพื่อให้คุณเช็คจากเบราว์เซอร์ได้ว่าเส้นทางนั้นถูกคุมด้วยโทเคนจริงไหม",
    "fi": "Molemmat kirjoitustavat, jotta voit selaimessa tarkistaa, onko reitti todella tokenin alla.",
    "uk": "Обидва написання, щоб ви могли з браузера перевірити, чи маршрут справді накритий токеном.",
    "bg": "И двата начина на запис, за да можете от браузър да проверите дали даден маршрут наистина е покрит от токена.",
    "tr": "Her iki yazım biçimi de var; böylece bir tarayıcıdan bir rotanın gerçekten jetonla korunduğunu denetleyebilirsiniz.",
    "hu": "Mindkét írásmód szerepel, hogy böngészőből ellenőrizni tudja, egy útvonal tényleg a token védte-e.",
  } satisfies L,
  redeemCap: {
    en: "Redeem a compute code: the handler reads code and redeemed_by (a missing code is 400 code_required) and returns the account alongside the result. The console's voucher panel verifies the signature offline before it even offers the redemption; re-submitting a code that already went through is not an idempotent replay — the gateway refuses it with 409 voucher_used, and the refusal names the voucher's redeemed_at_ms and redeemed_by, so a double paste surfaces as an error instead of passing for success.",
    "ru": "Погашение вычислительного кода: handler читает code и redeemed_by (нет code — 400 code_required) и возвращает аккаунт вместе с результатом. Панель кодов в консоли сначала офлайн проверяет подпись и только потом предлагает погасить; повторная отправка уже погашенного кода — не идемпотентный повтор: шлюз отказывает с 409 voucher_used, и в отказе названы redeemed_at_ms и redeemed_by ваучера, так что двойная вставка видна как ошибка, а не выдаёт себя за успех.",
    "de": "Einen Compute-Code einlösen: der Handler liest code und redeemed_by (fehlt code, ist das 400 code_required) und gibt das Konto zusammen mit dem Ergebnis zurück. Das Voucher-Panel der Konsole prüft die Signatur erst offline, bevor es die Einlösung überhaupt anbietet; dasselbe Code erneut zu senden ist kein idempotenter Durchlauf — das Gateway weist es mit 409 voucher_used zurück, und die Absage nennt redeemed_at_ms und redeemed_by des Vouchers, sodass ein doppeltes Einfügen als Fehler sichtbar wird, statt als Erfolg durchzugehen.",
    "fr": "Échanger un code de calcul : le handler lit code et redeemed_by (un code manquant donne 400 code_required) et renvoie le compte avec le résultat. Le panneau vouchers de la console vérifie d'abord la signature hors ligne avant même de proposer l'échange ; renvoyer le même code n'est pas un rejouement idempotent — la passerelle le refuse avec 409 voucher_used, et le refus nomme les redeemed_at_ms et redeemed_by du voucher, si bien qu'un double collage remonte en erreur au lieu de passer pour un succès.",
    "it": "Riscattare un codice di calcolo: l'handler legge code e redeemed_by (se code manca è 400 code_required) e restituisce l'account insieme al risultato. Il pannello voucher della console verifica la firma offline prima ancora di offrire il riscatto; reinviare lo stesso codice non è un replay idempotente — il gateway lo rifiuta con 409 voucher_used, e il rifiuto nomina redeemed_at_ms e redeemed_by del voucher, quindi un doppio incolla emerge come errore invece di passare per successo.",
    "nl": "Een compute-code inwisselen: de handler leest code en redeemed_by (een ontbrekende code geeft 400 code_required) en geeft het account samen met het resultaat terug. Het voucher-paneel van de console controleert de handtekening eerst offline voor het de inwisseling überhaupt aanbiedt; dezelfde code opnieuw indienen is geen idempotente replay — de gateway weigert met 409 voucher_used, en de weigering noemt de redeemed_at_ms en redeemed_by van de voucher, zodat een dubbel plakken als fout zichtbaar wordt in plaats van als succes.",
    "cs": "Výměna výpočetního kódu: handler čte code a redeemed_by (chybějící code je 400 code_required) a vrací účet spolu s výsledkem. Panel voucherů v konzoli nejdřív offline ověří podpis a teprve pak výměbu vůbec nabídne; opětovné poslání stejného kódu není idempotentní replay — brána to odmítne se 409 voucher_used a v odmítnutí pojmenuje redeemed_at_ms a redeemed_by voucheru, takže dvojité vložení se ukáže jako chyba, ne jako úspěch.",
    "zh-Hans": "兑算力码：handler 读 code 和 redeemed_by（缺 code 是 400 code_required），入账后账户状态随响应一起回来。后台「算力激活码」面板会先离线验签再提交兑换，重复提交已经兑过的码不是幂等重放——后台会以 409 voucher_used 拒绝，拒绝信息里点名这张券的 redeemed_at_ms 和 redeemed_by，所以粘第二次会报错，不会假装成功。",
    "zh-Hant": "兌算力碼：handler 讀 code 和 redeemed_by（缺 code 是 400 code_required），入帳後帳戶狀態隨回應一起回來。後臺「算力激活碼」面板會先離線驗簽再提交兌換，重複送已經兌過的碼不是冪等重放——後臺會以 409 voucher_used 拒絕，拒絕訊息裡點名這張券的 redeemed_at_ms 和 redeemed_by，所以貼第二次會報錯，不會假裝成功。",
    "es": "Canjear un código de cómputo: el handler lee code y redeemed_by (un code ausente es 400 code_required) y devuelve la cuenta junto con el resultado. El panel de vouchers de la consola verifica la firma sin conexión antes siquiera de ofrecer el canje; reenviar el mismo código no es una repetición idempotente — la pasarela lo rechaza con 409 voucher_used, y el rechazo nombra el redeemed_at_ms y el redeemed_by del voucher, así que un doble pegado aparece como error en vez de pasar por éxito.",
    "pl": "Wymiana kodu obliczeniowego: handler czyta code i redeemed_by (brak code to 400 code_required) i zwraca konto razem z wynikiem. Panel voucherów konsoli najpierw offline sprawdza podpis, zanim w ogóle zaproponuje wymianę; ponowne wysłanie tego samego kodu to nie idempotentne odtworzenie — brama odmawia z 409 voucher_used, a w odmowie wskazuje redeemed_at_ms i redeemed_by vouchera, więc podwójne wklejenie wychodzi jako błąd, a nie udaje sukces.",
    "ja": "クレジットコードの引き換えです。handler は code と redeemed_by を読み（code が無いと 400 code_required）、結果とともにアカウントを返します。コンソールの計算コードパネルは、引き換えを提案する前にまず署名をオフラインで検証します。すでに引き換え済みのコードをもう一度送るのは冪等な再送ではありません。ゲートウェイは 409 voucher_used で拒否し、その応答で voucher の redeemed_at_ms と redeemed_by を名指しします。つまり二重貼り付けは成功のふりをして通るのではなく、エラーとして現れます。",
    "th": "การแลกโค้ดเครดิต: handler อ่าน code กับ redeemed_by (ถ้าไม่มี code คือ 400 code_required) และคืนบัญชีกลับมาพร้อมผลลัพธ์ หน้าต่าง voucher ของคอนโซลตรวจลายเซ็นแบบออฟไลน์ก่อนจะเสนอให้แลก และการส่งโค้ดที่แลกไปแล้วซ้ำอีกครั้งไม่ใช่ idempotent replay — gateway จะปฏิเสธด้วย 409 voucher_used ในคำปฏิเสธจะระบุ redeemed_at_ms กับ redeemed_by ของ voucher ไว้ด้วย ดังนั้นที่วางซ้ำสองครั้งจะขึ้นเป็น error ไม่ใช่ปล่อยให้ผ่านเหมือนสำเร็จ",
    "fi": "Laskuravun lunastaminen: handler lukee code- ja redeemed_by-kentät (puuttuva code on 400 code_required) ja palauttaa tilin tuloksen kanssa. Konsolin voucher-paneeli varmistaa allekirjoituksen offline ennen kuin edes tarjoaa lunastusta; saman koodin lähettäminen uudelleen ei ole idempotentti toisto — gateway hylkää sen 409 voucher_used -virheellä, ja hylkäyksessä nimetään voucherin redeemed_at_ms ja redeemed_by, joten kaksoistahma ilmenee virheenä eikä pääse läpi menestyksenä.",
    "uk": "Погашення облікового коду: обробник читає code і redeemed_by (відсутній code — це 400 code_required) і повертає акаунт разом з результатом. Панель кодів у консолі спершу офлайн перевіряє підпис і лише потім пропонує погашення; повторна надсилка вже погашеного кода — це не ідемпотентне відтворення: шлюз відмовляє з 409 voucher_used, і в відмові названо redeemed_at_ms та redeemed_by ваучера, тож подвійна вставка виглядає як помилка, а не видає себе за успіх.",
    "bg": "Удостоверяване на изчислителен код: handler-ът чете code и redeemed_by (липсващ code е 400 code_required) и връща акаунта заедно с резултата. Панелът с ваучери на конзолата проверява подписа офлайн, преди изобщо да предложи удостоявяване; повторно изпратен код, който вече е използван, не е идемпотентно възпроизвеждане — шлюзът го отказва с 409 voucher_used, а отказът назовава redeemed_at_ms и redeemed_by на ваучера, така че двойното поставяне се вижда като грешка, не минава за успех.",
    "tr": "Hesaplama kodunu kullanma: handler code ile redeemed_by alanlarını okur (eksik code 400 code_required döner) ve hesabı sonuçla birlikte geri verir. Konsolun kupon paneli, kullanmayı teklif etmeden önce imzayı çevrimdışı doğrular; aynı kodu tekrar göndermek idempotent bir tekrar değildir — ağ geçidi bunu 409 voucher_used ile reddeder ve red, kuponun redeemed_at_ms ile redeemed_by alanlarını adlandırır; böylece çift yapıştırma başarı gibi geçmez, hata olarak görünür.",
    "hu": "Számítási kód beváltása: a handler beolvassa a code és redeemed_by mezőket (hiányzó code esetén 400 code_required), és a fiókot a eredménnyel együtt adja vissza. A konzol voucher-panelja először offline ellenőrzi az aláírást, mielőtt egyáltalán felajánlaná a beváltást; ugyanannak a kódnak ismételt beküldése nem idempotens lejátszás — az átjáró 409 voucher_useddel utasítja el, és az elutasítás megnevezi a voucher redeemed_at_ms és redeemed_by mezőit, így a dupla beillesztés hibaként jelenik meg, nem sikerként átmenve.",
  } satisfies L,
  menuCap: {
    en: "Menu push: an empty body is treated as {}, and with no contact_ids it goes to every follower — the response says recipients: all. Pass contact_ids to target specific followers. Menu frames only reach contacts holding an active session.",
    "ru": "Push меню: пустое тело трактуется как {}, и без contact_ids уходит всем подписчикам — в ответе стоит recipients: all. contact_ids нужны, чтобы адресовать конкретных. Меню-фреймы доходят только до контактов с активной сессией.",
    "de": "Menü-Push: ein leerer Body wird als {} behandelt, und ohne contact_ids geht er an alle Anhänger — die Antwort sagt recipients: all. Mit contact_ids treffen Sie bestimmte Anhänger. Menü-Frames erreichen nur Kontakte mit aktiver Sitzung.",
    "fr": "Push du menu : un corps vide est traité comme {}, et sans contact_ids il part à tous les abonnés — la réponse indique recipients: all. Passez des contact_ids pour cibler certains abonnés. Les trames de menu ne touchent que les contacts tenant une session active.",
    "it": "Spinta del menu: un body vuoto è trattato come {}, e senza contact_ids va a tutti i follower — la risposta dice recipients: all. Passa contact_ids per colpire follower specifici. I frame di menu raggiungono solo i contatti con una sessione attiva.",
    "nl": "Menu-push: een lege body wordt als {} behandeld, en zonder contact_ids gaat het naar elke volger — het antwoord zegt recipients: all. Geef contact_ids op om specifieke volgers te raken. Menu-frames bereiken alleen contacten met een actieve sessie.",
    "cs": "Push menu: prázdné tělo se bere jako {}, a bez contact_ids jde všem odběratelům — odpověď říká recipients: all. contact_ids vložte, abyste zasáhli konkrétní. Menu rámce dorazí jen kontaktům s aktivní relací.",
    "zh-Hans": "菜单推送：空 body 一律按 {} 处理，不传 contact_ids 就推给全部粉丝（响应里 recipients 是 all）；传了就只推指定粉丝。菜单帧只发给有活动会话的联系人。",
    "zh-Hant": "選單推送：空 body 一律按 {} 處理，不傳 contact_ids 就推給全部粉絲（回應裡 recipients 是 all）；傳了就只推指定粉絲。選單幀只發給有活動工作階段的聯絡人。",
    "es": "Envío de menú: un body vacío se trata como {}, y sin contact_ids va a todos los seguidores — la respuesta dice recipients: all. Pasa contact_ids para dirigirte a seguidores concretos. Las tramas de menú solo llegan a contactos con sesión activa.",
    "pl": "Wysłanie menu: pusta treść jest traktowana jak {}, a bez contact_ids leci do wszystkich odbiorców — odpowiedź mówi recipients: all. Podaj contact_ids, żeby trafić do wybranych. Ramki menu docierają tylko do kontaktów z aktywną sesją.",
    "ja": "メニューのプッシュです。空の body は {} として扱われ、contact_ids を省略すると全フォロワーに届きます（応答には recipients: all と出ます）。特定のフォロワーを狙うなら contact_ids を渡してください。メニューのフレームはアクティブなセッションを持つ連絡先にしか送られません。",
    "th": "การดันเมนู: body ว่างจะถือเป็นเรื่อง {} และถ้าไม่ส่ง contact_ids ไปจะหาผู้ติดตามทุกคน — ในคำตอบจะเขียนว่า recipients: all ใส่ contact_ids เพื่อระบุเป้าหมายเฉพาะ เฟรมเมนูจะไปไม่ถึงผู้ติดต่อที่ไม่มีเซสชันใช้งานอยู่",
    "fi": "Valikon lähetys: tyhjä body tulkitaan {}-ksi, ja ilman contact_ids-kenttää se menee kaikille seuraajille — vastaus sanoo recipients: all. Anna contact_ids, jos haluat tavoittaa tietyt seuraajat. Valikon kehykset kulkevat vain yhteydenpito, jolla on aktiivinen istunto.",
    "uk": "Пуш меню: порожнє тіло трактується як {}, і без contact_ids іде всім підписникам — у відповіді стоїть recipients: all. contact_ids треба передати, щоб адресувати конкретних. Меню-фрейми доходять лише до контактів з активною сесією.",
    "bg": "Публикуване на менюто: празно тяло се тълкува като {}, и без contact_ids отива до всеки последовател — отговорът казва recipients: all. Подайте contact_ids, за да насочите към конкретни. Кадрите на менюто стигат само до контакти с активна сесия.",
    "tr": "Menü gönderimi: boş gövde {} olarak ele alınır ve contact_ids verilmezse tüm takipçilere gider — yanıt recipients: all der. Belirli takipçileri hedeflemek için contact_ids geçin. Menü kareleri yalnızca etkin oturumu olan kişilere ulaşır.",
    "hu": "Menü-küldés: egy üres body-t {} -ként kezelnek, és contact_ids nélkül minden követőnek megy — a válasz azt mondja, recipients: all. Adja meg a contact_ids-t konkrét követők célzásához. A menü-keretek csak aktív munkamenettel rendelkező kontaktokhoz jutnak el.",
  } satisfies L,
  textCap: {
    en: "Send one follower an uncharged plain-text message: the escape hatch for when a plugin is fused but a human still has to be told something. It is deliberately unmetered — none of the twelve meters is named text, and asking for one answers unknown_meter.",
    "ru": "Отправить одному подписчику обычный текст без списания: запасной выход, когда плагин выгорел, но человеку всё равно нужно что-то сообщить. Он намеренно не тарифицируется — ни один из двенадцати счётчиков не называется text, и запрос к нему отвечает unknown_meter.",
    "de": "Einem einzelnen Anhänger eine nicht abgerechnete Klartext-Nachricht senden: der Notausgang, wenn ein Plugin durchgebrannt ist, aber ein Mensch noch etwas erfahren muss. Sie ist bewusst nicht gemessen — keiner der zwölf Zähler heißt text, und danach zu fragen antwortet unknown_meter.",
    "fr": "Envoyer à un seul abonné un message texte simple non facturé : la porte de sortie quand un plugin est grillé mais qu'un humain doit quand même être prévenu. Il est volontairement non mesuré — aucun des douze compteurs ne s'appelle text, et en demander un répond unknown_meter.",
    "it": "Mandare a un singolo follower un messaggio di testo plain non addebitato: l'uscita di sicurezza quando un plugin è bruciato ma un umano deve comunque essere informato. È deliberatamente non misurato — nessuno dei dodici contatori si chiama text, e chiederlo risponde unknown_meter.",
    "nl": "Eén volger een niet-doordeelde platte-tekstbericht sturen: de nooduitgang wanneer een plugin doorgebrand is maar een mens nog iets verteld moet worden. Hij is bewust ongemeten — geen van de twaalf meters heet text, en daarom vragen antwoordt unknown_meter.",
    "cs": "Poslat jednomu odběrateli prostý text bez zúčtování: nouzový východ, když je plugin odpálený, ale člověka ještě musíte informovat. Je záměrně neměřený — žádný z dvanácti měričů se nejmenuje text, a zeptat se na něj znamená unknown_meter.",
    "zh-Hans": "给单个粉丝发一条不计费的纯文本：插件被熔断、但真人还是得被告知时的后门。它刻意不计量——十二个计量键里没有叫 text 的那一个，问它就是 unknown_meter。",
    "zh-Hant": "給單個粉絲發一條不計機的純文字：插件被斷線、但真人還是得被告知時的後門。它刻意不計量——十二個計量鍵裡沒有叫 text 的那一個，問它就是 unknown_meter。",
    "es": "Enviar a un seguidor un mensaje de texto plano sin cargo: la salida de emergencia cuando un plugin está fundido pero a una persona todavía hay que avisarle algo. Está deliberadamente sin medir — ninguno de los doce medidores se llama text, y pedirlo responde unknown_meter.",
    "pl": "Wysłać jednemu odbiorcy zwykły tekst bez naliczania: wyjście awaryjne, gdy wtyczka jest przepalona, ale człowiek nadal musi się o czymś dowiedzieć. Celowo nie jest rozliczane — żaden z dwunastu liczników nie nazywa się text, a zapytanie o niego odpowiada unknown_meter.",
    "ja": "一人のフォロワーに、課金しない平文メッセージを送るための退路です。プラグインが停止してしまったが人に何か伝えなければならない、というときに使います。これは意図的に課金されていません。12個の課金キーに text という名前は無く、それを要求すると unknown_meter が返ります。",
    "th": "ส่งข้อความข้อความล้วนที่ไม่คิดเครดิตให้ follower คนเดียว: เป็นทางออกฉุกเฉินตอนปลั๊กอินถูกตัดแต่ยังต้องบอกมนุษย์บางคนอยู่ โดยเจตนามันไม่ถูกคิดเครดิต — ไม่มี meter ใดในสิบสองตัวชื่อ text และถ้าขอไปจะได้ unknown_meter",
    "fi": "Lähettää yhdelle seuraajalle veloitukseton plain-tekstiviesti: varauloskäynti, kun plugin on palanut mutta ihminen pitää silti saada tietoon. Se on tietoisesti mittaamatta — yksikään kahdestatoista metarista ei nimetty text, ja sen kysyminen vastaa unknown_meter.",
    "uk": "Надіслати одному підписнику звичайний текст без списання: запасний вихід, коли плагин вигорів, але людині все одно треба щось повідомити. Він навмисно не облікований — жоден із дванадцяти лічильників не називається text, а запит до нього відповідає unknown_meter.",
    "bg": "Изпрати на един последовател обикновен текст без таксуване: аварийният изход, когато приставката е изгоряла, но на човек пак трябва да се съобщи нещо. Напълно безмерено е — нито един от дванадесетте метра не се казва text, и запитването за такъв отговаря unknown_meter.",
    "tr": "Bir takipçiye ücretlendirilmeyen sade metin mesajı göndermek: bir eklenti patlamış ama bir insanın hâlâ bir şey öğrenmesi gerekiyorsa kullanılan kaçış yolu. Bilinçli olarak ölçüme kapalıdır — on iki sayaçtan hiçbirinin adı text değildir, isteyen de unknown_meter alır.",
    "hu": "Küldeni egyetlen követőnek egy nem terhel szöveges üzenetet: a menekülő út, amikor egy bővítmény kiolvadt, de egy embert még tájékoztatni kell. Tudatosan nem kerül mérésre — a tizenkét meter egyike sem hívódik text-nak, és aki kéri, az unknown_meter választ kapja.",
  } satisfies L,
  rotateCap: {
    en: "Rotate a paid channel's key: the epoch increments and the envelope is signed with the channel's Ed25519 private key. No body is fine — the three switches are expires_at_ms, revoke_previous (default true) and notify_members (default true). The command interpolates $CHANNEL_ID, which the block above sets to the placeholder ops-demo; put a real channel id there, readable from GET /api/v1/channels or from the console's channel panel.",
    "ru": "Ротация ключа платного канала: epoch увеличивается, а конверт подписывается приватным Ed25519-ключом канала. Тело можно не слать — три переключателя это expires_at_ms, revoke_previous (по умолчанию true) и notify_members (по умолчанию true). Команда подставляет $CHANNEL_ID, который блок выше задаёт как заполнитель ops-demo; подставьте туда реальный id канала: он виден в GET /api/v1/channels и в панели каналов консоли.",
    "de": "Den Schlüssel eines bezahlten Kanals rotieren: die Epoch zählt hoch, und der Umschlag wird mit dem privaten Ed25519-Schlüssel des Kanals signiert. Ohne Body geht es — die drei Schalter sind expires_at_ms, revoke_previous (Standard true) und notify_members (Standard true). Der Befehl setzt $CHANNEL_ID ein, was der Block oben auf den Platzhalter ops-demo stellt; tragen Sie dort eine echte id ein, abzulesen in GET /api/v1/channels oder im Kanalpanel der Konsole.",
    "fr": "Faire tourner la clé d'un canal payant : l'epoch s'incrémente et l'enveloppe est signée avec la clé privée Ed25519 du canal. Un corps vide suffit — les trois interrupteurs sont expires_at_ms, revoke_previous (vrai par défaut) et notify_members (vrai par défaut). La commande interpole $CHANNEL_ID, que le bloc du dessus pose sur l'espace réservé ops-demo ; mettez-y un vrai id, lisible dans GET /api/v1/channels ou dans le panneau canaux de la console.",
    "it": "Ruotare la chiave di un canale a pagamento: l'epoch incrementa e la busta è firmata con la chiave privata Ed25519 del canale. Body vuoto va bene — i tre interruttori sono expires_at_ms, revoke_previous (default true) e notify_members (default true). Il comando interpola $CHANNEL_ID, che il blocco sopra imposta sul segnaposto ops-demo; metti un id reale, leggibile in GET /api/v1/channels o nel pannello canali della console.",
    "nl": "De sleutel van een betaald kanaal roteren: de epoch loopt op en de envelop wordt met de privé Ed25519-sleutel van het kanaal gesigneerd. Een lege body kan — de drie schakelaars zijn expires_at_ms, revoke_previous (standaard true) en notify_members (standaard true). Het commando voegt $CHANNEL_ID in, dat het blok hierboven op de placeholder ops-demo zet; zet daar een echte id neer, afleesbaar uit GET /api/v1/channels of uit het kanaalpaneel van de console.",
    "cs": "Rotace klíče placeného kanálu: epoch se zvýší a obálka je podepsaná soukromým Ed25519 klíčem kanálu. Tělo nemusíte posílat – tři přepínače jsou expires_at_ms, revoke_previous (výchozí true) a notify_members (výchozí true). Příkaz dosazuje $CHANNEL_ID, který blok výše nastaví na zástupnou hodnotu ops-demo; tam zadejte skutečné id, které najdete v GET /api/v1/channels nebo v panelu kanálů konzole.",
    "zh-Hans": "轮换付费频道密钥：epoch 自增，信封用频道 Ed25519 私钥签名。可以不发 body——三个开关是 expires_at_ms、revoke_previous（默认 true）、notify_members（默认 true）。命令插值的是 $CHANNEL_ID，上面那块把它设成占位值 ops-demo；请换成真实 id，它在 GET /api/v1/channels 或后台「频道与密钥轮换」里读得到。",
    "zh-Hant": "輪換付費頻道金鑰：epoch 自增，信封用頻道 Ed25519 私密金鑰簽名。可以不發 body——三個開關是 expires_at_ms、revoke_previous（預設 true）、notify_members（預設 true）。命令插值的是 $CHANNEL_ID，上面那塊把它設成佔位值 ops-demo；請換成真實 id，它在 GET /api/v1/channels 或後臺「頻道與金鑰輪換」裡讀得到。",
    "es": "Rotar la clave de un canal de pago: el epoch se incrementa y el sobre se firma con la clave privada Ed25519 del canal. Sin body también vale — los tres interruptores son expires_at_ms, revoke_previous (por defecto true) y notify_members (por defecto true). El comando interpola $CHANNEL_ID, que el bloque de arriba fija en el marcador ops-demo; ponga ahí un id real, legible en GET /api/v1/channels o en el panel de canales de la consola.",
    "pl": "Rotacja klucza płatnego kanału: epoch rośnie, a koperta jest podpisana prywatnym kluczem Ed25519 kanału. Ciało można pominąć — trzy przełączniki to expires_at_ms, revoke_previous (domyślnie true) i notify_members (domyślnie true). Polecenie wstawia $CHANNEL_ID, który powyższy blok ustawia na zastępnik ops-demo; podaj tam prawdziwe id, które odczytasz z GET /api/v1/channels albo z panelu kanałów konsoli.",
    "ja": "有料チャンネルの鍵をローテーションします。epoch が1増え、エンベロープはそのチャンネルの Ed25519 秘密鍵で署名されます。body は無くても構いません。スイッチは3つ、expires_at_ms、revoke_previous（既定 true）、notify_members（既定 true）です。コマンドは $CHANNEL_ID を展開します。上のブロックがこれをプレースホルダーの ops-demo に設定しているので、GET /api/v1/channels かコンソールのチャンネルパネルで読める実際の id に置き換えてください。",
    "th": "หมุนเวียนคีย์ของช่องแบบเสียเงิน: epoch จะเพิ่มขึ้น และซองจะถูกเซ็นด้วยคีย์ส่วนตัว Ed25519 ของช่อง จะไม่ส่ง body ก็ได้ — สวิตช์สามตัวคือ expires_at_ms, revoke_previous (ค่าเริ่มต้น true) และ notify_members (ค่าเริ่มต้น true) คำสั่งจะเติม $CHANNEL_ID ให้ ซึ่งบล็อกข้างบนตั้งไว้เป็นค่าสำรอง ops-demo เปลี่ยนเป็น id จริงที่อ่านได้จาก GET /api/v1/channels หรือจากแผงช่องในคอนโซล",
    "fi": "Maksetun kanavan avaimen kierrättäminen: epoch kasvaa ja kirje signeerataan kanavan yksityisellä Ed25519-avaimella. Ilman bodytäkin käy — kolme kytkintä ovat expires_at_ms, revoke_previous (oletus true) ja notify_members (oletus true). Komento sijoittaa $CHANNEL_ID:n, jonka yllä oleva lohko asettaa paikkamerkiksi ops-demo; korvaa se oikealla id:llä, jonka näet GET /api/v1/channelsista tai konsolin kanavapaneelista.",
    "uk": "Ротація ключа платного каналу: epoch збільшується, а конверт підписується приватним Ed25519-ключем каналу. Тіло можна не надсилати — три перемикачі це expires_at_ms, revoke_previous (типово true) та notify_members (типово true). Команда підставляє $CHANNEL_ID, який блок вище задає як заповнювач ops-demo; підставте справжній id: його видно в GET /api/v1/channels і на панелі каналів консолі.",
    "bg": "Ротация на ключа на платен канал: епохата се увеличава, а пликът се подписва с частния Ed25519 ключ на канала. Без тяло също става — трите превключвателя са expires_at_ms, revoke_previous (по подразбиране true) и notify_members (по подразбиране true). Командата замества $CHANNEL_ID, който блокът горе слага като заместител ops-demo; заменете го с реално id, което се вижда в GET /api/v1/channels или в панела на конзолата.",
    "tr": "Ücretli bir kanalın anahtarını döndürme: epoch artar ve zarf, kanalın özel Ed25519 anahtarıyla imzalanır. Gövde göndermeseniz de olur — üç anahtar expires_at_ms, revoke_previous (varsayılan true) ve notify_members (varsayılan true). Komut $CHANNEL_ID değerini araya koyar; yukarıdaki blok onu ops-demo yer tutucusu olarak ayarladığı için, GET /api/v1/channels içinde ya da konsolun kanal panelinde okunan gerçek bir id ile değiştirin.",
    "hu": "Fizetős csatorna kulcsának rotálása: az epoch nő, és a borítékot a csatorna privát Ed25519 kulcsával írják alá. Body nélkül is jó — a három kapcsoló expires_at_ms, revoke_previous (alapértelmezés true) és notify_members (alapértelmezés true). A parancs a $CHANNEL_ID-t helyettesíti be, amit a fenti blokk ops-demo helyőrzőre állít; cserélje valódi id-re, amely a GET /api/v1/channels válaszaiból vagy a konzol csatornapaneljából olvasható.",
  } satisfies L,
  pluginsCap: {
    en: "Plugin status: one list route, plus each plugin answering GET <prefix>/status under its own mount prefix — that single route is what the nine console panels read.",
    "ru": "Статус плагинов: один список-маршрут, плюс каждый плагин отвечает GET <prefix>/status под собственным префиксом — именно этот единственный маршрут читают девять панелей консоли.",
    "de": "Plugin-Status: eine Listen-Route, plus jeder Plugin beantwortet GET <prefix>/status unter seinem eigenen Mount-Präfix — genau diese eine Route lesen die neun Konsolenpaneele.",
    "fr": "État des plugins : une route de liste, plus chaque plugin répondant GET <prefix>/status sous son propre préfixe de montage — c'est cette route unique que lisent les neuf panneaux de la console.",
    "it": "Stato dei plugin: una rotta di elenco, più ogni plugin che risponde GET <prefix>/status sotto il proprio prefisso di mount — è proprio questa rotta che leggono i nove pannelli della console.",
    "nl": "Pluginstatus: één lijst-route, plus elke plugin die GET <prefix>/status beantwoordt onder zijn eigen mount-voorvoegsel — die ene route is wat de negen consolepanelen lezen.",
    "cs": "Stav pluginů: jedna list route, plus každý plugin odpovídá GET <prefix>/status pod vlastním mount prefixem – přesně tu čte devět panelů konzole.",
    "zh-Hans": "插件状态：总表一条，每个插件再在自己的挂载前缀下答一条 GET <prefix>/status——后台九个面板读的就是这一条。",
    "zh-Hant": "插件狀態：總表一條，每個插件再在自己的掛載前綴下答一條 GET <prefix>/status——後臺九個面板讀的就是這一條。",
    "es": "Estado de los plugins: una ruta de listado, y cada plugin responde GET <prefix>/status bajo su propio prefijo de montaje — esa única ruta es la que leen los nueve paneles de la consola.",
    "pl": "Stan wtyczek: jedna trasa listy, plus każda wtyczka odpowiada GET <prefix>/status pod własnym przedrostkiem montażu — właśnie tej jednej trasy słucha dziewięć paneli konsoli.",
    "ja": "プラグインの状態です。一覧ルートが1本、そして各プラグインは自分のマウント接頭辞の下で GET <prefix>/status に答えます。コンソールの9つのパネルが読むのは、まさにこの1本です。",
    "th": "สถานะของปลั๊กอิน: มีเส้นทางรายการหนึ่งสาย แล้วแต่ละปลั๊กอินยังตอบ GET <prefix>/status ใต้ prefix ของตัวเอง — เส้นทางเดียวสายนี้แหละที่แผงทั้งเก้าของคอนโซลอ่าน",
    "fi": "Plugin-tila: yksi listausreitti, ja jokainen plugin vastaa GET <prefix>/status omalla mount-etuliitteellään — juuri tätä yhtä reittiä konsolin yhdeksän paneelia lukevat.",
    "uk": "Статус плагінів: один маршрут-список, плюс кожен плагин відповідає GET <prefix>/status під власним префіксом монтування — саме цей один маршрут читають дев'ять панелей консолі.",
    "bg": "Състояние на приставките: един списъчен маршрут, плюс всяка приставка отговаря GET <prefix>/status под собствения си mount префикс — точно този единствен маршрут четат деветте панела на конзолата.",
    "tr": "Eklenti durumu: bir liste rotası, üstelik her eklenti kendi bağlama ön eki altında GET <prefix>/status ile yanıtlar — konsolun dokuz paneli tam olarak bu tek rotayı okur.",
    "hu": "Bővítmények állapota: egy lista útvonal, plusz minden bővítmény a saját mount előtagja alatt válaszol a GET <prefix>/status-ra — ezt az egyetlen útvonalat olvassa a konzol kilenc panelje.",
  } satisfies L,

  quotaTitle: {
    en: "Quota: the admission switch",
    "ru": "Квота: переключатель допуска",
    "de": "Kontingent: der Einlassschalter",
    "fr": "Quota : l'interrupteur d'admission",
    "it": "Quota: l'interruttore di ammissione",
    "nl": "Quotum: de toelatingschakelaar",
    "cs": "Kvóta: přepínač přístupu",
    "zh-Hans": "配额：准入开关",
    "zh-Hant": "配額：准入開關",
    "es": "Cuota: el interruptor de admisión",
    "pl": "Limit: przełącznik dopuszczenia",
    "ja": "クォータ：受け入れのスイッチ",
    "th": "โควตา: สวิตช์การรับเข้าใช้",
    "fi": "Kiintiö: päästön kytkin",
    "uk": "Квота: перемикач допуску",
    "bg": "Квота: превключвателят за допускане",
    "tr": "Kota: katılım anahtarı",
    "hu": "Kvóta: a beléptetés kapcsolója",
  } satisfies L,
  quotaOff: {
    en: "At the default 0 a new account is created ONLINE and four of the nine plugins work out of the box — ai_agent, alert_ops, privacy_sso and polls — so nobody has to redeem an activation code. The other five are off by default and each has its own switch: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 and POPOPX_PLUGIN_SLACK_DISCORD=1. Metering is still recorded, the ledger still balances and the console still shows it, so the quota data is real.",
    "ru": "При значении 0 по умолчанию новая строка аккаунта создаётся ONLINE, и четыре из девяти плагинов работают сразу — ai_agent, alert_ops, privacy_sso и polls — никому не нужно активировать код. Остальные пять по умолчанию выключены, и у каждого свой переключатель: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 и POPOPX_PLUGIN_SLACK_DISCORD=1. Учёт расхода пишется, реестр сходится и консоль это показывает, поэтому данные квоты настоящие.",
    "de": "Bei der 0 als Standard wird ein neues Konto ONLINE angelegt, und vier der neun Plugins funktionieren ab Werk — ai_agent, alert_ops, privacy_sso und polls — niemand muss einen Aktivierungscode einlösen. Die anderen fünf sind standardmäßig aus und haben je ihren eigenen Schalter: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 und POPOPX_PLUGIN_SLACK_DISCORD=1. Die Messung wird weiter geschrieben, das Hauptbuch bleibt in Balance und die Konsole zeigt es, die Kontingentdaten sind also echt.",
    "fr": "À la valeur 0 par défaut, un nouveau compte est créé ONLINE et quatre des neuf plugins fonctionnent d'emblée — ai_agent, alert_ops, privacy_sso et polls — personne n'a besoin d'échanger un code d'activation. Les cinq autres sont éteints par défaut et chacun a son propre interrupteur : POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 et POPOPX_PLUGIN_SLACK_DISCORD=1. Le comptage reste enregistré, le grand-livre reste équilibré et la console l'affiche, donc les données de quota sont réelles.",
    "it": "Con lo 0 di default un nuovo account viene creato ONLINE e quattro dei nove plugin funzionano subito — ai_agent, alert_ops, privacy_sso e polls — nessuno deve riscattare un codice di attivazione. Gli altri cinque sono spenti di default e ciascuno ha il proprio interruttore: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 e POPOPX_PLUGIN_SLACK_DISCORD=1. La misurazione viene comunque registrata, il mastro torna e la console lo mostra, quindi i dati della quota sono veri.",
    "nl": "Bij de standaard 0 wordt een nieuw account ONLINE aangemaakt en werken vier van de negen plugins out of the box — ai_agent, alert_ops, privacy_sso en polls — niemand hoeft een activeringscode in te wisselen. De andere vijf staan standaard uit en elk heeft zijn eigen schakelaar: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 en POPOPX_PLUGIN_SLACK_DISCORD=1. Metering wordt nog steeds geschreven, het grootboek blijft in balans en de console toont het, dus de quotumdata is echt.",
    "cs": "Při výchozí 0 se nový účet vytvoří jako ONLINE a čtyři z devíti pluginů fungují hned — ai_agent, alert_ops, privacy_sso a polls — nikdo nemusí měnit aktivační kód. Zbylých pět je ve výchozím stavu vypnutých a každý má vlastní přepínač: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 a POPOPX_PLUGIN_SLACK_DISCORD=1. Měření se dál zapisuje, kniha souhlasí a konzole to ukazuje, takže data kvóty jsou reálná.",
    "zh-Hans": "默认 0：账户一行建出来就是 ONLINE，九个插件里四个开箱可用——ai_agent、alert_ops、privacy_sso、polls——不需要向任何一方兑换激活码。其余五个默认关着，各有自己的开关：POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1。计量照记、流水照平、后台照看，所以配额数据是真的。",
    "zh-Hant": "預設 0：帳戶一行建出來就是 ONLINE，九個插件裡四個開箱可用——ai_agent、alert_ops、privacy_sso、polls——不需要向任何一方兌換啟動碼。其餘五個預設關著，各有自己的開關：POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1。計量照記、流水照平、後臺照看，所以配額資料是真的。",
    "es": "Con el 0 por defecto una cuenta nueva se crea ONLINE y cuatro de los nueve plugins funcionan de fábrica — ai_agent, alert_ops, privacy_sso y polls — nadie tiene que canjear un código de activación. Los otros cinco vienen apagados por defecto y cada uno tiene su propio interruptor: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 y POPOPX_PLUGIN_SLACK_DISCORD=1. El medido se sigue registrando, el libro sigue cuadrando y la consola lo muestra, así que los datos de la cuota son reales.",
    "pl": "Przy domyślnym 0 nowe konto jest tworzone jako ONLINE i cztery z dziewięciu wtyczek działają od razu — ai_agent, alert_ops, privacy_sso i polls — nikt nie musi wymieniać kodu aktywacyjnego. Pozostałe pięć jest domyślnie wyłączonych i każda ma własny przełącznik: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 i POPOPX_PLUGIN_SLACK_DISCORD=1. Metering nadal jest zapisywany, księga się zgadza i konsola to pokazuje, więc dane limitu są prawdziwe.",
    "ja": "既定の 0 では、新しいアカウントは ONLINE で作られ、9つのプラグインのうち4つ（ai_agent、alert_ops、privacy_sso、polls）は箱出しで動きます。アクティベーションコードの引き換えを必要とする人は一人もいません。残り5つは既定ではオフで、それぞれに専用スイッチがあります: POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1。課金はそのまま記録され、台帳は釣り合い、コンソールにも表示されるので、クォータのデータは実データです。",
    "th": "ที่ค่าเริ่มต้น 0 บัญชีใหม่จะถูกสร้างเป็น ONLINE และปลั๊กอินสี่ในเก้าตัวใช้ได้ทันทีโดยไม่ต้องแลกโค้ดเปิดใช้ใด ๆ — ai_agent, alert_ops, privacy_sso, polls — ส่วนอีกห้าตัวปิดอยู่โดยค่าเริ่มต้นและมีสวิตช์ของตัวเอง: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 และ POPOPX_PLUGIN_SLACK_DISCORD=1 การคิดเครดิตยังถูกบันทึก บัญชียังลงตัว และหน้าคอนโซลยังแสดงอยู่ ข้อมูลโควตาจึงเป็นข้อมูลจริง",
    "fi": "Oletusarvolla 0 uusi tili luodaan ONLINE-tilaan, ja neljä yhdeksästä pluginista toimivat suoraan – ai_agent, alert_ops, privacy_sso ja polls – kenenkään ei tarvitse lunastaa aktivointikoodia. Loput viisi ovat oletuksena pois päältä ja jokaisella on oma kytkimensä: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 ja POPOPX_PLUGIN_SLACK_DISCORD=1. Mittaus kirjataan edelleen, pääkirja täsmää ja konsoli näyttää sen, joten kiintiön data on aitoa.",
    "uk": "За типового 0 новий рядок акаунта створюється ONLINE, і чотири з дев'яти плагінів працюють одразу — ai_agent, alert_ops, privacy_sso та polls — нікому не треба активувати код. Решта п'ять типово вимкнені, і кожен має власний перемикач: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 і POPOPX_PLUGIN_SLACK_DISCORD=1. Лічильники пишуться, реєстр сходиться й консоль це показує, тож дані квоти справжні.",
    "bg": "При нулата по подразбиране нов акаунт се създава като ONLINE и четири от деветте приставки работят веднага — ai_agent, alert_ops, privacy_sso и polls — никой не трябва да удостоявява активационен код. Останалите пет са изключени по подразбиране и всяка има собствен превключвател: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 и POPOPX_PLUGIN_SLACK_DISCORD=1. Меренето се записва, книгата се изравнява и конзолата го показва, затова данните за квотата са истински.",
    "tr": "Varsayılan 0 değerinde yeni bir hesap ONLINE olarak oluşturulur ve dokuz eklentinin dördü kutudan çıkar gibi çalışır — ai_agent, alert_ops, privacy_sso ve polls — kimsenin bir etkinleştirme kodu kullanması gerekmez. Diğer beşi varsayılan olarak kapalıdır ve her birinin kendi anahtarı vardır: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 ve POPOPX_PLUGIN_SLACK_DISCORD=1. Ölçüm kaydedilmeye devam eder, defter denk düşer ve konsol bunu gösterir; yani kota verileri gerçektir.",
    "hu": "Az alapértelmezett 0 esetén új fiók ONLINE állapott jön létre, és a kilenc bővítmény közül négy azonnal működik — ai_agent, alert_ops, privacy_sso és polls — senkinek nem kell aktiváló kódot beváltania. A másik öt alapértelmezés szerint ki van kapcsolva, és mindegyiknek saját kapcsolója van: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 és POPOPX_PLUGIN_SLACK_DISCORD=1. A mérés tovább rögzül, a főkönyv egyezik, a konzol pedig mutatja, tehát a kvótaadatai valósak.",
  } satisfies L,
  quotaOn: {
    en: "Set it to 1 and you are back in admission mode: the account starts DRAFT and every metered action is refused with 409 account_draft until a signed code is redeemed. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY then becomes a startup requirement — a value that does not decode to 32 bytes refuses to boot, and both the 44-character base64 and the 64-character hex spelling are accepted. The private half stays on the minting box and the gateway verifies offline with the public half only, so a gateway cannot mint a code.",
    "ru": "Единица возвращает режим допуска: аккаунт стартует DRAFT, и любое учитываемое действие отбивается 409 account_draft, пока не будет активирован подписанный код. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY становится обязательным для запуска — значение, которое не раскладывается в 32 байта, отказывает в старте, и принимаются оба написания: 44 символа base64 и 64 символа hex. Приватная половина остаётся на машине-минтере, а шлюз проверяет офлайн только публичной половиной, поэтому шлюз не может выпустить код.",
    "de": "Auf 1 gesetzt sind Sie wieder im Einlassmodus: Das Konto startet DRAFT, und jede gemessene Aktion wird mit 409 account_draft abgewiesen, bis ein signierter Code eingelöst ist. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY wird zur Startvoraussetzung — ein Wert, der sich nicht auf 32 Bytes dekodiert, verweigert den Boot, und sowohl die 44-Zeichen-base64- als auch die 64-Zeichen-hex-Schreibweise werden akzeptiert. Die private Hälfte bleibt auf der Münzmaschine, das Gateway prüft offline nur mit der öffentlichen Hälfte, ein Gateway kann also keinen Code prägen.",
    "fr": "Mis à 1, vous voilà en mode admission : le compte démarre DRAFT et toute action mesurée est refusée par 409 account_draft tant qu'un code signé n'a pas été échangé. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY devient une exigence de démarrage — une valeur qui ne se décode pas en 32 octets refuse de booter, et les deux écritures, 44 caractères base64 et 64 caractères hex, sont acceptées. La moitié privée reste sur la machine à fabriquer, la passerelle vérifie hors ligne uniquement avec la moitié publique, donc elle ne peut pas créer un code.",
    "it": "Messo a 1 si torna in modalità di ammissione: l'account parte DRAFT e ogni azione misurata è rifiutata con 409 account_draft finché un codice firmato non viene riscattato. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY diventa un requisito di avvio — un valore che non si decodifica in 32 byte rifiuta il boot, e sia la scrittura base64 a 44 caratteri sia quella hex a 64 sono accettate. La metà privata resta sulla macchina di mint, il gateway verifica offline solo con la metà pubblica, quindi un gateway non può coniare un codice.",
    "nl": "Op 1 gezet bent u terug in toelatingsmodus: het account start DRAFT en elke gemeten actie wordt geweigerd met 409 account_draft tot een ondertekende code is ingewisseld. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY wordt een startvereiste — een waarde die niet naar 32 bytes decodeert weigert te booten, en zowel de 44-tekens base64 als de 64-tekens hex spellings worden aanvaard. De private helft blijft op de mint-machine, de gateway verifieert offline met alleen de publieke helft, dus een gateway kan geen code slaan.",
    "cs": "Nastavením na 1 se vracíte do režimu přístupu: účet startuje jako DRAFT a jakákoli měřená akce je odmítnuta 409 account_draft, dokud není podpisem opatřený kód vyměněn. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY se stává podmínkou startu — hodnota, která se nedekóduje na 32 bajtů, start odmítne, a obě zápisy, 44 znaků base64 i 64 znaků hex, jsou přijaty. Soukromá polovina zůstává na mint stroji, brána ověřuje offline jen veřejnou polovinou, takže brána kód nevydá.",
    "zh-Hans": "设成 1 就回到准入模式：账户起始 DRAFT，任何被计量的动作一律 409 account_draft，直到有一张签过名的码被兑掉。这时 POPOPX_OFFICIAL_ED25519_PUBLIC_KEY 变成启动必需项——解不出 32 字节就拒绝启动，base64 的 44 字符与 hex 的 64 字符两种写法都收。私钥只在铸造机上，网关只用公钥离线验签，因此它无法造码。",
    "zh-Hant": "設成 1 就回到准入模式：帳戶起始 DRAFT，任何被計量的動作一律 409 account_draft，直到有一張簽過名的碼被兌掉。這時 POPOPX_OFFICIAL_ED25519_PUBLIC_KEY 變成啟動必需項——解不出 32 位元組就拒絕啟動，base64 的 44 字元與 hex 的 64 字元兩種寫法都收。私密金鑰只在鑄造機上，閘道只用公開金鑰離線驗簽，因此它無法造碼。",
    "es": "Puesto a 1 se vuelve al modo de admisión: la cuenta arranca DRAFT y toda acción medida se rechaza con 409 account_draft hasta que se canjea un código firmado. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY pasa a ser requisito de arranque — un valor que no decodifica a 32 bytes rechaza el arranque, y se aceptan tanto las 44 caracteres base64 como las 64 caracteres hex. La mitad privada se queda en la máquina de acuñación y la pasarela verifica sin conexión solo con la mitad pública, así que una pasarela no puede acuñar un código.",
    "pl": "Ustawione na 1 przywraca tryb dopuszczenia: konto startuje jako DRAFT i każda rozliczana akcja jest odrzucana przez 409 account_draft, aż nie zostanie wymieniony podpisany kod. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY staje się warunkiem startu — wartość, która nie dekoduje się do 32 bajtów, odmawia bootowania, i obie pisownie, 44-znakowa base64 oraz 64-znakowa hex, są przyjmowane. Prywatna połowa zostaje na maszynie minciarskiej, a brama weryfikuje offline wyłącznie połową publiczną, więc brama nie może wybić kodu.",
    "ja": "1 にすると受け入れモードに戻ります。アカウントは DRAFT で始まり、署名されたコードが引き換えられるまで課金される操作はすべて 409 account_draft で断られます。このとき POPOPX_OFFICIAL_ED25519_PUBLIC_KEY は起動の必須項目になります。32バイトにデコードできない値は起動を拒否しますが、base64 の44文字でも hex の64文字でも受け付けられます。秘密側は鋳造用の機械にだけ置かれ、ゲートウェイは公開側だけでオフライン検証するため、ゲートウェイがコードを作ることはできません。",
    "th": "ตั้งเป็น 1 จะกลับเข้าโหมดการรับเข้าใช้: บัญชีเริ่มที่ DRAFT และการกระทำที่ถูกคิดเครดิตทุกอย่างจะถูกปฏิเสธด้วย 409 account_draft จนกว่าโค้ดที่เซ็นแล้วจะถูกแลก POPOPX_OFFICIAL_ED25519_PUBLIC_KEY กลายเป็นเงื่อนไขบังคับตอนเริ่ม — ค่าที่ถอดไม่ได้อย่างน้อย 32 ไบต์จะไม่ยอมให้บูต และยอมรับทั้งแบบ base64 44 ตัวอักษรกับแบบ hex 64 ตัวอักษร ส่วนคีย์ส่วนตัวอยู่บนเครื่องพิมพ์โค้ดเท่านั้น gateway ตรวจแบบออฟไลน์ด้วยคีย์สาธารณะ ดังนั้น gateway ไม่สามารถสร้างโค้ดเองได้",
    "fi": "Asetettuna 1 palutaan päästötilaan: tili alkaa DRAFTina ja jokainen mitattu toiminto hylätään 409 account_draft -vastauksella, kunnes allekirjoitettu koodi lunastetaan. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY:sta tulee käynnistysvaatimus — arvo, joka ei puredu 32 tavuksi, kieltäytyy käynnistymästä, ja sekä 44-merkkinen base64 että 64-merkkinen hex hyväksytään. Yksityinen puoli jää mintauskoneelle, ja gateway varmistaa offline julkisella puoliskolla, joten gateway ei voi lyödä koodia.",
    "uk": "Одиниця повертає режим допуску: акаунт стартує DRAFT, і будь-яка облікова дія відбивається 409 account_draft, доки підписаний код не буде активовано. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY стає обов'язковим для запуску — значення, що не розкладається в 32 байти, відмовляє у старті, і приймаються оба написання: 44 символи base64 і 64 символи hex. Приватна половина лишається на машині-мінтері, а шлюз перевіряє офлайн лише публічною половиною, тому шлюз не може випустити код.",
    "bg": "Зададено на 1 се връщате в режим на допускане: акаунтът стартира като DRAFT и всяко мерено действие се отказва с 409 account_draft, докато не се удостовери подписан код. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY става изискване за стартиране — стойност, която не се разкодира до 32 байта, отказва бутирането, и се приемат и двата записа: base64 с 44 символа и hex со 64. Частната половина остава на минтовата машина, а шлюзът проверява офлайн само с публичната половина, следователно шлюз не може да сече код.",
    "tr": "1 yapınca katılım moduna geri dönersiniz: hesap DRAFT olarak başlar ve imzalı bir kod kullanılmadıkça ölçülen her eylem 409 account_draft ile reddedilir. POPOPX_OFFICIAL_ED25519_PUBLIC_KEY o zaman açılış zorunluluğu olur — 32 bayrağa çözülmeyen değer açılmayı reddeder; hem 44 karakterlik base64 hem 64 karakterlik hex yazımı kabul edilir. Özel yarı yalnızca darphane makinesinde kalır, ağ geçidi çevrimdışı doğrulamayı sadece genel yarıyla yapar; dolayısıyla bir ağ geçidi kod üretemez.",
    "hu": "1-re állítva vissza lép a beléptetési módba: a fiók DRAFT állapott indul, és minden mérhető műveletet 409 account_draft hibával elutasítanak, amíg egy aláírt kódu be nem váltanak. Ezután a POPOPX_OFFICIAL_ED25519_PUBLIC_KEY indítási követelménnyé válik — egy olyan érték, amely nem dekódol 32 bájtra, megtagadja az indulást, és mind a 44 karakteres base64, mind a 64 karakteres hex írásmódot elfogadják. A privát fél a pénverdén marad, és az átjáró offline csak a publikus féllel ellenőriz, ezért egy átjáró nem tud veretni.",
  } satisfies L,
  mintTitle: {
    en: "Minting your own code, on an offline box",
    "ru": "Выпуск собственного кода — на офлайн-машине",
    "de": "Einen eigenen Code prägen, auf einer Offline-Maschine",
    "fr": "Fabriquer votre propre code, sur une machine hors ligne",
    "it": "Coniare il tuo codice, su una macchina offline",
    "nl": "Een eigen code slaan, op een offline machine",
    "cs": "Vydat vlastní kód – na stroji bez připojení",
    "zh-Hans": "自托管要铸一张码：在离线机器上跑",
    "zh-Hant": "自託管要鑄一張碼：在離線機器上跑",
    "es": "Acuñar tu propio código, en una máquina sin conexión",
    "pl": "Wybić własny kod — na maszynie offline",
    "ja": "自分のコードを鋳造するならオフラインの機械で",
    "th": "พิมพ์โค้ดของคุณเอง บนเครื่องออฟไลน์",
    "fi": "Lyö oman koodin offline-laitteella",
    "uk": "Випуск власного коду — на офлайн-машині",
    "bg": "Отсечете собствен код, на офлайн машина",
    "tr": "Kendi kodunuzu basmak, çevrimdışı bir makinede",
    "hu": "Saját kód verése offline gépen",
  } satisfies L,
  mintCap: {
    en: "These lines are picked from the five-line usage block at the top of gen_voucher.py, which also lists --verify, and every flag named here exists in its argparse: --gen-keyring builds a keyring and refuses to overwrite one, --show-pubkey prints the public key in every spelling the gateway accepts, --mint issues codes and --self-test asserts the frozen test vector. Three packages ship — startup 500, commercial 2500, flagship 10000 — and --credits overrides them; --ttl-days, --note, --out and --voucher-id also exist. A code is POPX-CP-1.<base64url(payload)>.<base64url(signature)>, pure Ed25519 (RFC 8032, not Ed25519ph), the same curve the iOS side's CryptoKit and the gateway's cryptography use. Run --verify on the codes --mint just printed.",
    "ru": "Эти строки взяты из блока использования в начале gen_voucher.py, где их пять, включая --verify, и каждый упомянутый здесь флаг есть в его argparse: --gen-keyring собирает keyring и отказывается перезаписывать существующий, --show-pubkey печатает публичный ключ во всех написаниях, которые принимает шлюз, --mint выпускает коды, --self-test проверяет замороженный тестовый вектор. Комплектуются три тарифа — startup 500, commercial 2500, flagship 10000 — а --credits перебивает их; есть также --ttl-days, --note, --out и --voucher-id. Код выглядит как POPX-CP-1.<base64url(payload)>.<base64url(signature)>, чистый Ed25519 (RFC 8032, не Ed25519ph), та же кривая, что у CryptoKit на iOS и у cryptography на стороне шлюза. --verify запускают на тех кодах, которые только что напечатал --mint.",
    "de": "Diese Zeilen sind dem fünf Zeilen langen Nutzungsblock oben in gen_voucher.py entnommen, der auch --verify aufführt, und jeder hier genannte Schalter existiert in seinem argparse: --gen-keyring baut eine keyring und weigert sie zu überschreiben, --show-pubkey printet den öffentlichen Schlüssel in jeder Schreibweise, die das Gateway akzeptiert, --mint gibt Codes aus und --self-test prüft den eingefrorenen Testvektor. Drei Pakete sind im Angebot — startup 500, commercial 2500, flagship 10000 — und --credits übersteuert sie; --ttl-days, --note, --out und --voucher-id gibt es ebenfalls. Ein Code ist POPX-CP-1.<base64url(payload)>.<base64url(signature)>, reines Ed25519 (RFC 8032, nicht Ed25519ph), dieselbe Kurve wie CryptoKit auf iOS und cryptography am Gateway. Führen Sie --verify auf den Codes aus, die --mint gerade printete.",
    "fr": "Ces lignes sont tirées du bloc d'utilisation en tête de gen_voucher.py, qui en compte cinq, --verify comprise, et chaque option citée ici existe dans son argparse : --gen-keyring construit un keyring et refuse d'écraser le sien, --show-pubkey affiche la clé publique dans chaque écriture acceptée par la passerelle, --mint émet des codes et --self-test vérifie le vecteur de test gelé. Trois forfaits sont livrés — startup 500, commercial 2500, flagship 10000 — et --credits les remplace ; --ttl-days, --note, --out et --voucher-id existent aussi. Un code est POPX-CP-1.<base64url(payload)>.<base64url(signature)>, Ed25519 pur (RFC 8032, pas Ed25519ph), la même courbe que CryptoKit côté iOS et cryptography côté passerelle. Lancez --verify sur les codes que --mint vient d'afficher.",
    "it": "Queste righe sono tratte dal blocco d'uso in testa a gen_voucher.py, che ne conta cinque, --verify inclusa, e ogni opzione qui citata esiste nel suo argparse: --gen-keyring crea un keyring e rifiuta di sovrascriverlo, --show-pubkey stampa la chiave pubblica in ogni scrittura accettata dal gateway, --mint emette codici e --self-test asserisce il vettore di test congelato. Tre piani ship — startup 500, commercial 2500, flagship 10000 — e --credits li sovrascrive; esistono anche --ttl-days, --note, --out e --voucher-id. Un codice è POPX-CP-1.<base64url(payload)>.<base64url(signature)>, Ed25519 puro (RFC 8032, non Ed25519ph), la stessa curva di CryptoKit su iOS e cryptography sul gateway. Esegui --verify sui codici appena stampati da --mint.",
    "nl": "Deze regels komen uit het usage-blok bovenaan gen_voucher.py, dat er vijf noemt, --verify inbegrepen, en elke vlag die hier genoemd wordt bestaat in zijn argparse: --gen-keyring bouwt een keyring en weigert een bestaande te overschrijven, --show-pubkey print de publieke sleutel in elke spelling die de gateway aanvaardt, --mint geeft codes uit en --self-test toetst de bevroren testvector. Drie pakketten worden meegeleverd — startup 500, commercial 2500, flagship 10000 — en --credits overschrijft ze; --ttl-days, --note, --out en --voucher-id bestaan ook. Een code is POPX-CP-1.<base64url(payload)>.<base64url(signature)>, puur Ed25519 (RFC 8032, niet Ed25519ph), dezelfde kromme als CryptoKit op iOS en cryptography bij de gateway. Draai --verify op de codes die --mint net printte.",
    "cs": "Tyto řádky jsou vybrané z usage bloku v hlavičce gen_voucher.py, který jich má pět včetně --verify, a každý tady zmíněný přepínač v jeho argparse existuje: --gen-keyring sestaví keyring a odmítne přepsat existující, --show-pubkey vytiskne veřejný klíč ve všech zápisech, které brána přijímá, --mint vydává kódy a --self-test kontroluje zmrazený testovací vektor. Balí se tři tarify — startup 500, commercial 2500, flagship 10000 — a --credits je přebije; existují i --ttl-days, --note, --out a --voucher-id. Kód vypadá jako POPX-CP-1.<base64url(payload)>.<base64url(signature)>, čistý Ed25519 (RFC 8032, ne Ed25519ph), stejná krivka jako CryptoKit na iOS a cryptography na straně brány. --verify spusťte na kódách, které právě vytiskl --mint.",
    "zh-Hans": "这几行摘自 gen_voucher.py 文件头的用法块，那里一共列了五行，含 --verify；这里点到的开关都在它自己的 argparse 里：--gen-keyring 建钥匙环（拒绝覆盖已有的）、--show-pubkey 把公钥按网关接受的每种写法打一遍、--mint 出码、--self-test 断言那张冻结的测试向量。三档套餐 startup 500 / commercial 2500 / flagship 10000，给了 --credits 就用你的数；另外还有 --ttl-days、--note、--out、--voucher-id。码的形是 POPX-CP-1.<base64url(payload)>.<base64url(signature)>，纯 Ed25519（RFC 8032，不是 Ed25519ph），与 iOS 端 CryptoKit、网关端 cryptography 同一套。最后一行的 --verify 在 --mint 之后拿输出的码跑。",
    "zh-Hant": "這幾行擷取自 gen_voucher.py 檔頭的用法塊，那裡一共列了五行，含 --verify；這裡點到的開關都在它自己的 argparse 裡：--gen-keyring 建鑰匙環（拒絕覆蓋既有的）、--show-pubkey 把公開金鑰按閘道接受的每種寫法打一遍、--mint 出碼、--self-test 斷言那張凍結的測試向量。三檔套餐 startup 500 / commercial 2500 / flagship 10000，給了 --credits 就用你的數；另外還有 --ttl-days、--note、--out、--voucher-id。碼的形是 POPX-CP-1.<base64url(payload)>.<base64url(signature)>，純 Ed25519（RFC 8032，不是 Ed25519ph），與 iOS 端 CryptoKit、閘道端 cryptography 同一套。最後一行的 --verify 在 --mint 之後拿它輸出的碼跑。",
    "es": "Estas líneas salen del bloque de uso en la cabecera de gen_voucher.py, que enumera cinco, --verify incluido, y cada flag citado aquí existe en su argparse: --gen-keyring construye un keyring y se niega a sobrescribir uno existente, --show-pubkey imprime la clave pública en cada escritura que la pasarela acepta, --mint emite códigos y --self-test afirma el vector de prueba congelado. Se incluyen tres paquetes — startup 500, commercial 2500, flagship 10000 — y --credits los anula; también existen --ttl-days, --note, --out y --voucher-id. Un código es POPX-CP-1.<base64url(payload)>.<base64url(signature)>, Ed25519 puro (RFC 8032, no Ed25519ph), la misma curva que usan CryptoKit en iOS y cryptography en la pasarela. Ejecuta --verify sobre los códigos que --mint acaba de imprimir.",
    "pl": "Te linie są wybrane z bloku użycia na początku gen_voucher.py, który wymienia pięć z --verify, i każdy przywołany tu przełącznik istnieje w jego argparse: --gen-keyring buduje keyring i odmawia nadpisania istniejącego, --show-pubkey drukuje klucz publiczny we wszystkich pisowniach akceptowanych przez bramę, --mint wystawia kody, a --self-test sprawdza zamrożony wektor testowy. Dostępne są trzy pakiety — startup 500, commercial 2500, flagship 10000 — a --credits je nadpisuje; istnieją też --ttl-days, --note, --out i --voucher-id. Kod ma postać POPX-CP-1.<base64url(payload)>.<base64url(signature)>, czysty Ed25519 (RFC 8032, nie Ed25519ph), ta sama krzywa co CryptoKit po stronie iOS i cryptography po stronie bramy. Uruchom --verify na kodach, które właśnie wydrukował --mint.",
    "ja": "ここに表示しているのは gen_voucher.py の先頭にある usage ブロックからの抜き出しです。あのブロックは --verify を含めて 5 行で、ここで触れているオプションはいずれもその argparse に実在します。--gen-keyring は keyring を作り、既存の overwrite は拒否します。--show-pubkey はゲートウェイが受け付ける全ての表記で公開鍵を表示し、--mint はコードを発行、--self-test は凍結されたテストベクトルを検証します。同梱されているのは3プラン、startup 500 / commercial 2500 / flagship 10000 で、--credits を渡せばそちらが優先されます。--ttl-days、--note、--out、--voucher-id も使えます。コードの形は POPX-CP-1.<base64url(payload)>.<base64url(signature)> で、純粋な Ed25519（RFC 8032、Ed25519ph ではない）です。iOS 側の CryptoKit とゲートウェイ側の cryptography が使うのと同じ曲線です。--verify は --mint が出力したコードに対して実行してください。",
    "th": "บรรทัดเหล่านี้คัดมาจากบล็อกการใช้งานที่หัวไฟล์ gen_voucher.py ซึ่งจริง ๆ มีห้าบรรทัดรวม --verify ด้วย และ option ทุกตัวที่กล่าวถึงที่นี่มีอยู่ใน argparse ของมันจริง: --gen-keyring สร้าง keyring และปฏิเสธการเขียนทับของเดิม --show-pubkey พิมพ์ public key ออกมาทุกแบบที่ gateway รับ --mint ผลิตโค้ด ส่วน --self-test ตรวจ test vector ที่ถูก freeze ไว้ มีสามแผนมาให้ — startup 500, commercial 2500, flagship 10000 — และ --credits จะoverride ค่าพวกนั้น มี --ttl-days, --note, --out และ --voucher-id ด้วย รูปแบบโค้ดคือ POPX-CP-1.<base64url(payload)>.<base64url(signature)> เป็น Ed25519 ล้วน (RFC 8032 ไม่ใช่ Ed25519ph) ใช้ curveเดียวกับ CryptoKit ฝั่ง iOS และ cryptography ฝั่ง gateway รัน --verify กับโค้ดที่ --mint พิมพ์ออกมาเมื่อครู่",
    "fi": "Nämä rivit on poimittu gen_voucher.py:n alussa olevasta käyttölohkosta, jossa on viisi riviä --verify mukaan lukien, ja jokainen tässä mainittu lippu löytyy sen argparsesta: --gen-keyring rakentaa keyringin ja kieltäytyy ylikirjoittamasta olemassa olevaa, --show-pubkey tulostaa julkisen avaimen jokaisessa gatewayn hyväksymässä muodossa, --mint tuottaa koodeja ja --self-test testaa jäädytetyn testivektorin. Kolme pakettia toimitetaan — startup 500, commercial 2500, flagship 10000 — ja --credits ylittää ne; --ttl-days, --note, --out ja --voucher-id ovat myös olemassa. Koodi on POPX-CP-1.<base64url(payload)>.<base64url(signature)>, puhdas Ed25519 (RFC 8032, ei Ed25519ph), sama käyrä kuin iOS:n CryptoKit ja gatewayn cryptography. Aja --verify niillä koodeilla, jotka --mint juuri tulosti.",
    "uk": "Це рядки, взяті з блоку використання на початку gen_voucher.py, де їх п'ять, включно з --verify, і кожен згаданий тут прапорець існує в його argparse: --gen-keyring збирає keyring і відмовляється перезаписувати наявний, --show-pubkey друкує відкритий ключ в усіх написаннях, які приймає шлюз, --mint випускає коди, а --self-test перевіряє заморожений тестовий вектор. Передбачено три тарифи — startup 500, commercial 2500, flagship 10000 — а --credits перезаписує їх; також є --ttl-days, --note, --out і --voucher-id. Код має форму POPX-CP-1.<base64url(payload)>.<base64url(signature)>, чистий Ed25519 (RFC 8032, не Ed25519ph), та сама крива, що в CryptoKit на iOS і в cryptography на боці шлюза. --verify запускайте на тих кодах, щойно надрукованих --mint.",
    "bg": "Тези редове са подбрани от usage блока в началото на gen_voucher.py, който има пет реда, включително --verify, и всеки споменат тук флаг съществува в argparse: --gen-keyring изгражда keyring и отказва да презапише съществуващ, --show-pubkey печата публичния ключ във всеки запис, който шлюзът приема, --mint издава кодове, а --self-test проверява замръзналия тестов вектор. Идват с три пакета — startup 500, commercial 2500, flagship 10000 — и --credits ги замества; съществуват и --ttl-days, --note, --out и --voucher-id. Кодът е POPX-CP-1.<base64url(payload)>.<base64url(signature)>, чист Ed25519 (RFC 8032, не Ed25519ph), същата крива като CryptoKit от страната на iOS и cryptography от страната на шлюза. Пуснете --verify върху кодовете, които --mint току-що отпечата.",
    "tr": "Bu satırlar gen_voucher.py dosyasının başındaki kullanım bloğundan alınmıştır; o blok --verify dahil beş satırdır ve burada anılan her bayrak kendi argparse içinde mevcuttur: --gen-keyring bir keyring kurar ve var olanı üzerine yazmayı reddeder, --show-pubkey ağ geçidinin kabul ettiği her yazımda genel anahtarı yazdırır, --mint kod üretir, --self-test ise dondurulmuş test vektörünü doğrular. Üç paket gelir — startup 500, commercial 2500, flagship 10000 — ve --credits bunları geçersiz kılar; --ttl-days, --note, --out ve --voucher-id de mevcuttur. Bir kod POPX-CP-1.<base64url(payload)>.<base64url(signature)> biçimindedir, salt Ed25519 (RFC 8032, Ed25519ph değil); iOS tarafındaki CryptoKit ile ağ geçidindeki cryptography'nin kullandığı aynı eğri. --verify'yi, --mint'in az önce yazdırdığı kodlar üzerinde çalıştırın.",
    "hu": "Ezek a sorok a gen_voucher.py tetején lévő használati blokkból valók, amely összesen öt sort sorol fel a --verify-jel együtt, és minden itt említett kapcsoló létezik a saját argparse-ében: a --gen-keyring keyring-et épít és megtagadja egy meglévő felülírását, a --show-pubkey az átjáró által elfogadott minden írásmódban kinyomtatja a publikus kulcsot, a --mint kódokat állít elő, a --self-test pedig a befagyasztott tesztvektort ellenőrzi. Három csomag tartozik hozzá — startup 500, commercial 2500, flagship 10000 — és a --credits felülírja őket; létezik még --ttl-days, --note, --out és --voucher-id is. Egy kód alakja POPX-CP-1.<base64url(payload)>.<base64url(signature)>, tiszta Ed25519 (RFC 8032, nem Ed25519ph), ugyanaz a görbe, mint az iOS oldali CryptoKit és az átjáró cryptography-je. Futtassa a --verify-t a --mint által épp most kiirtott kódokon.",
  } satisfies L,
  mintHelpCap: {
    en: "This is the exact line the README's voucher section prints, run from the gateway directory.",
    "ru": "Это ровно та строка, которую печатает раздел README о вычислительных кодах, запущенная из каталога gateway.",
    "de": "Genau diese Zeile druckt der Voucher-Abschnitt des README, ausgeführt aus dem gateway-Verzeichnis.",
    "fr": "C'est exactement la ligne qu'affiche la section vouchers du README, lancée depuis le répertoire gateway.",
    "it": "Questa è esattamente la riga che stampa la sezione voucher del README, eseguita dalla directory gateway.",
    "nl": "Dit is precies de regel die de voucher-sectie van de README print, uitgevoerd vanuit de gateway-map.",
    "cs": "Přesně tento řádek tiskne sekce README o vaccích, spuštěná z adresáře gateway.",
    "zh-Hans": "README「算力码」一节给的就是这一条：从 gateway 目录起，读它的 --help。",
    "zh-Hant": "README「算力碼」一節給的就是這條：從 gateway 目錄起，讀它的 --help。",
    "es": "Es exactamente la línea que imprime la sección de vouchers del README, ejecutada desde el directorio gateway.",
    "pl": "To dokładnie ta linia, którą wypisuje sekcja voucherów w README, uruchomiona z katalogu gateway.",
    "ja": "README のクレジットコードの節が表示しているのがこの行で、gateway ディレクトリから実行します。",
    "th": "นี่คือบรรทัดที่หัวข้อ voucher ใน README พิมพ์ออกมาพอดี โดยรันจากโฟลเดอร์ gateway",
    "fi": "Tämä on täsmälleen se rivi, jonka README:n voucher-osa tulostaa, ajettuna gateway-hakemistosta.",
    "uk": "Це рівно той рядок, який друкує розділ README про облікові коди, запущений з каталогу gateway.",
    "bg": "Това е точно редът, който печата разделът за ваучери в README, изпълнен от директория gateway.",
    "tr": "Bu, README'nin kupon bölümünün yazdırdığı satırın ta kendisi; gateway dizininden çalıştırılır.",
    "hu": "Ez pontosan az a sor, amelyet a README voucher-szakasza nyomtat, a gateway könyvtárból futtatva.",
  } satisfies L,
  meterTitle: {
    en: "What each action costs (the twelve numbers in .env.example)",
    "ru": "Сколько стоит каждое действие (двенадцать чисел из .env.example)",
    "de": "Was jede Aktion kostet (die zwölf Zahlen aus .env.example)",
    "fr": "Ce que coûte chaque action (les douze nombres de .env.example)",
    "it": "Quanto costa ogni azione (i dodici numeri in .env.example)",
    "nl": "Wat elke actie kost (de twaalf getallen in .env.example)",
    "cs": "Kolik která akce stojí (dvanáct čísel z .env.example)",
    "zh-Hans": "每个动作扣多少（.env.example 里的十二个数）",
    "zh-Hant": "每個動作扣多少（.env.example 裡的十二個數）",
    "es": "Cuánto cuesta cada acción (los doce números de .env.example)",
    "pl": "Ile kosztuje każda akcja (dwanaście liczb z .env.example)",
    "ja": "各操作の消費量（.env.example の12個の数）",
    "th": "แต่ละการกระทำใช้เครดิตเท่าไร (สิบสองตัวเลขใน .env.example)",
    "fi": "Maksaako jokainen toiminto (kaksitoista lukua .env.example:ssä)",
    "uk": "Скільки коштує кожна дія (дванадцять чисел з .env.example)",
    "bg": "Колко струва всяко действие (дванадесетте числа в .env.example)",
    "tr": "Her eylemin bedeli (.env.example içindeki on iki sayı)",
    "hu": "Mibe kerül egy-egy művelet (a tizenkét szám a .env.example-ben)",
  } satisfies L,
  meterHeadKey: {
    en: "Environment key",
    "ru": "Ключ окружения",
    "de": "Umgebungsschlüssel",
    "fr": "Clé d'environnement",
    "it": "Chiave d'ambiente",
    "nl": "Omgevingsvariabele",
    "cs": "Proměnná prostředí",
    "zh-Hans": "环境变量",
    "zh-Hant": "環境變數",
    "es": "Clave de entorno",
    "pl": "Zmienna środowiskowa",
    "ja": "環境変数",
    "th": "คีย์สภาพแวดล้อม",
    "fi": "Ympäristöavain",
    "uk": "Змінна середовища",
    "bg": "Променлива на обкръжаването",
    "tr": "Ortam anahtarı",
    "hu": "Környezeti kulcs",
  } satisfies L,
  meterHeadUnit: {
    en: "POPX-CP",
    "ru": "POPX-CP",
    "de": "POPX-CP",
    "fr": "POPX-CP",
    "it": "POPX-CP",
    "nl": "POPX-CP",
    "cs": "POPX-CP",
    "zh-Hans": "POPX-CP",
    "zh-Hant": "POPX-CP",
    "es": "POPX-CP",
    "pl": "POPX-CP",
    "ja": "POPX-CP",
    "th": "POPX-CP",
    "fi": "POPX-CP",
    "uk": "POPX-CP",
    "bg": "POPX-CP",
    "tr": "POPX-CP",
    "hu": "POPX-CP",
  } satisfies L,
  meterHeadWhat: {
    en: "What it meters",
    "ru": "Что считается",
    "de": "Was gezählt wird",
    "fr": "Ce qui est compté",
    "it": "Cosa viene misurato",
    "nl": "Wat wordt gemeten",
    "cs": "Co se měří",
    "zh-Hans": "计的是什么",
    "zh-Hant": "計的是什麼",
    "es": "Qué se mide",
    "pl": "Co jest liczone",
    "ja": "課金対象になるもの",
    "th": "อะไรถูกคิดเครดิต",
    "fi": "Mitä mitataan",
    "uk": "Що враховується",
    "bg": "Какво се брои",
    "tr": "Neyin ölçüldüğü",
    "hu": "Mit számol",
  } satisfies L,
  meterFoot: {
    en: "All twelve metered actions come from one table in billing_service.py (METER_ACTIONS), and each environment name is derived as POPOPX_CP_ plus the upper-cased attribute, so this table cannot drift from the code. A meter set to 0 is free, and the console renders it as free.",
    "ru": "Все двенадцать учитываемых действий берутся из одной таблицы в billing_service.py (METER_ACTIONS), а каждое имя переменной выводится как POPOPX_CP_ плюс атрибут в верхнем регистре, поэтому таблица не может разойтись с кодом. Счётчик со значением 0 бесплатен, и консоль показывает его как бесплатный.",
    "de": "Alle zwölf gemessenen Aktionen stammen aus einer Tabelle in billing_service.py (METER_ACTIONS), und jeder Umgebungsname wird aus POPOPX_CP_ plus dem Attribut in Großbuchstaben gebildet, kann diese Tabelle also nicht vom Code abweichen. Ein Zähler auf 0 ist kostenlos, und die Konsole stellt ihn als kostenlos dar.",
    "fr": "Les douze actions facturées viennent d'un seul tableau dans billing_service.py (METER_ACTIONS), et chaque nom d'environnement se dérive de POPOPX_CP_ plus l'attribut en majuscules, ce qui empêche ce tableau de diverger du code. Un compteur à 0 est gratuit, et la console l'affiche comme gratuit.",
    "it": "Tutte le dodici azioni misurate vengono da una sola tabella in billing_service.py (METER_ACTIONS), e ogni nome d'ambiente è derivato da POPOPX_CP_ più l'attributo in maiuscolo, quindi questa tabella non può divergere dal codice. Un contatore a 0 è gratuito, e la console lo renderizza come gratuito.",
    "nl": "Alle twaalf gemeten acties komen uit één tabel in billing_service.py (METER_ACTIONS), en elke omgevingsnaam wordt afgeleid als POPOPX_CP_ plus het attribuut in hoofdletters, zodat deze tabel niet van de code kan afdwalen. Een meter op 0 is gratis, en de console toont hem als gratis.",
    "cs": "Všech dvanáct měřených akcí vychází z jedné tabulky v billing_service.py (METER_ACTIONS) a každé jméno proměnné se odvozuje jako POPOPX_CP_ plus atribut velkými písmeny, takže se tabulka nemůže rozjet s kódem. Nula ve měrici je zdarma a konzole to tak vykreslí.",
    "zh-Hans": "十二条计量动作在 billing_service.py 里是同一张表 METER_ACTIONS，键名由 POPOPX_CP_ 加属性大写推出来，所以这张表不会和代码漂移。设成 0 就是免费，后台会把它显示成 free。",
    "zh-Hant": "十二條計量動作在 billing_service.py 裡是同一張表 METER_ACTIONS，鍵名由 POPOPX_CP_ 加屬性大寫推出來，所以這張表不會和程式碼漂移。設成 0 就是免費，後臺會把它顯示成 free。",
    "es": "Las doce acciones medidas salen de una sola tabla en billing_service.py (METER_ACTIONS), y cada nombre de entorno se deriva como POPOPX_CP_ más el atributo en mayúsculas, así que esta tabla no puede separarse del código. Un medidor en 0 es gratuito, y la consola lo muestra como gratuito.",
    "pl": "Wszystkich dwunastu rozliczanych akcji bierze się z jednej tabeli w billing_service.py (METER_ACTIONS), a każda nazwa zmiennej jest wyprowadzana jako POPOPX_CP_ plus atrybut wielkimi literami, więc ta tabela nie może rozjechać się z kodem. Licznik ustawiony na 0 jest darmowy i konsola tak go właśnie renderuje.",
    "ja": "課金される12の操作はすべて billing_service.py の1つのテーブル（METER_ACTIONS）から来ており、環境変数名は POPOPX_CP_ に属性の大文字表記を足して作られています。ですからこのテーブルがコードとズレることはありません。0 に設定された計量は無料であり、コンソールも無料として表示します。",
    "th": "การกระทำที่ถูกคิดเครดิตทั้งสิบสองมาจากตารางเดียวใน billing_service.py (METER_ACTIONS) และชื่อตัวแปรแวดล้อมแต่ละตัวเกิดจาก POPOPX_CP_ ต่อด้วยชื่อ attribute ตัวพิมพ์ใหญ่ ดังนั้นตารางนี้จะไม่เพี้ยนไปจากโค้ด ส่วน meter ที่ตั้งเป็น 0 จะฟรี และหน้าคอนโซลก็แสดงว่าเป็นฟรี",
    "fi": "Kaikki kaksitoista mitattua toimintoa tulevat yhdestä taulukosta billing_service.py:ssä (METER_ACTIONS), ja jokainen ympäristönimi johdetaan muodossa POPOPX_CP_ plus attribuutti isoilla kirjaimilla, joten tämä taulukko ei voi erota koodista. Nollaksi asetettu metari on ilmainen, ja konsoli piirtää sen ilmaiseksi.",
    "uk": "Усі дванадцять облікових дій беруться з однієї таблиці в billing_service.py (METER_ACTIONS), а кожне ім'я змінної виводиться як POPOPX_CP_ плюс атрибут у верхньому регістрі, тому таблиця не може розійтися з кодом. Лічильник зі значенням 0 безкоштовний, і консоль показує його як безкоштовний.",
    "bg": "И дванадесетте мерени действия идват от една таблица в billing_service.py (METER_ACTIONS), а всяко име на променлива се извежда като POPOPX_CP_ плюс атрибутът с главни букви, така че таблицата не може да се размини с кода. Метър на нула е безплатен и конзолата го изобразява като безплатен.",
    "tr": "Ölçülen on iki eylemin tamamı billing_service.py içindeki tek bir tablodan gelir (METER_ACTIONS) ve her ortam adı POPOPX_CP_ üstüne büyük harfli nitelik olarak türetilir; bu yüzden tablo koddan sapamaz. Sıfıra ayarlı sayaç ücretsizdir ve konsol da onu ücretsiz olarak gösterir.",
    "hu": "Mind a tizenkét mért művelet a billing_service.py egy táblájából jön (METER_ACTIONS), és minden környezeti név POPOPX_CP_ plus a attribútum nagybetűs alakjaként képződik, így a tábla nem térhet el a kódtól. A 0-ra állított számláló ingyenes, és a konzol is ingyenesként rajzolja.",
  } satisfies L,
  fuseTitle: {
    en: "The balance-exhaustion circuit breaker",
    "ru": "Аварийное отключение при исчерпании баланса",
    "de": "Der Sicherungsautomat bei leerem Guthaben",
    "fr": "Le disjoncteur en cas de solde épuisé",
    "it": "L'interruttore a scatto a esaurimento saldo",
    "nl": "De zekeringautomaat bij uitgeput saldo",
    "cs": "Jistič při vyčerpání zůstatku",
    "zh-Hans": "余额耗尽的熔断",
    "zh-Hant": "餘額耗盡的斷線",
    "es": "El interruptor de saldo agotado",
    "pl": "Zabezpieczenie przy wyczerpanym saldzie",
    "ja": "クレジット枯渇時のサーキットブレーカー",
    "th": "คัตเอาต์ตอนเครดิตหมด",
    "fi": "Sulake, kun saldo loppuu",
    "uk": "Аварійне відключення при вичерпаному балансі",
    "bg": "Предпазител при изчерпан баланс",
    "tr": "Bakiye tükendiğinde devreye giren sigorta",
    "hu": "Biztosíték a kreditek elfogyásakor",
  } satisfies L,
  fuseBody: {
    en: "There is exactly one implementation of the decision. When the balance falls to or below POPOPX_BILLING_SUSPEND_THRESHOLD (default 0) the account becomes SUSPENDED with reason credits and every metered plugin is fused at the same moment — the comparison is balance <= threshold, so the default fuses at exactly zero, not one credit later. Metered actions then answer 402 insufficient_credits or account_suspended, and the gateway-decision chip on the console's plugin panel reads the very same verdict. The AI plugin adds one more knob, exhausted_message, the fixed reply followers get while the balance is gone; the README states that this decision and the one the console shows come from the same code.",
    "ru": "Реализация решения — ровно одна. Когда баланс падает до POPOPX_BILLING_SUSPEND_THRESHOLD (по умолчанию 0) или ниже, аккаунт становится SUSPENDED с причиной credits, и все учитываемые плагины выгорают в тот же момент: сравнение balance <= threshold, поэтому по умолчанию порог срабатывает ровно на нуле, а не на один кредит позже. После этого учитываемые действия отвечают 402 insufficient_credits или account_suspended, и чип gateway-decision на панели плагинов консоли читает ровно тот же вердикт. Плагин AI добавляет ещё одну ручку, exhausted_message, — фиксированный ответ, который получают подписчики, пока баланс нулевой; в README прямо сказано, что это решение и то, что показывает консоль, берутся из одного и того же кода.",
    "de": "Die Entscheidung hat genau eine Implementierung. Fällt das Guthaben auf POPOPX_BILLING_SUSPEND_THRESHOLD (Standard 0) oder darunter, wird das Konto SUSPENDED mit dem Grund credits, und jedes gemessene Plugin durchbrennt im selben Moment — verglichen wird balance <= threshold, also brennt der Standard bei exakt null durch, nicht eine credit später. Gemessene Aktionen antworten danach mit 402 insufficient_credits oder account_suspended, und der gateway-decision-Chip im Plugin-Panel der Konsole liest genau denselben Befund. Das AI-Plugin dreht noch eine weitere Schraube, exhausted_message, die feste Antwort, die Anhänger bekommen, solange das Guthaben weg ist; das README sagt, dass diese Entscheidung und die der Konsole aus demselben Code kommen.",
    "fr": "La décision n'a qu'une seule implémentation. Quand le solde atteint ou descend sous POPOPX_BILLING_SUSPEND_THRESHOLD (0 par défaut), le compte passe SUSPENDED avec la raison credits et chaque plugin mesuré grille au même instant — la comparaison est balance <= threshold, donc à zéro exact, pas une crédit plus tard. Les actions facturées répondent alors 402 insufficient_credits ou account_suspended, et la pastille gateway-decision du panneau plugins de la console lit exactement le même verdict. Le plugin AI ajoute une molette de plus, exhausted_message, la réponse fixe envoyée aux abonnés tant que le solde est vide ; le README indique que cette décision et celle affichée par la console viennent du même code.",
    "it": "L'implementazione della decisione è una sola. Quando il saldo scende a POPOPX_BILLING_SUSPEND_THRESHOLD (default 0) o sotto, l'account diventa SUSPENDED con motivo credits e ogni plugin misurato si brucia nello stesso istante — il confronto è balance <= threshold, quindi di default brucia a zero esatto, non un credito dopo. Le azioni misurate rispondono allora 402 insufficient_credits o account_suspended, e il chip gateway-decision nel pannello plugin della console legge esattamente lo stesso verdetto. Il plugin AI aggiunge una manopola in più, exhausted_message, la risposta fissa che i follower ricevono finché il saldo è esaurito; il README afferma che questa decisione e quella che la console mostra vengono dallo stesso codice.",
    "nl": "De beslissing heeft precies één implementatie. Zakt de balans tot POPOPX_BILLING_SUSPEND_THRESHOLD (standaard 0) of lager, dan wordt het account SUSPENDED met reden credits en brandt elke gemeten plugin op hetzelfde moment door — vergeleken wordt balance <= threshold, dus de standaard brandt op precies nul door, niet één credit later. Gemeten acties antwoorden dan 402 insufficient_credits of account_suspended, en de gateway-decision-chip op het pluginpaneel van de console leest precies hetzelfde oordeel. De AI-plugin draait er nog een knop bij, exhausted_message, het vaste antwoord dat volgers krijgen zolang de balans weg is; het README stelt dat dit oordeel en dat van de console uit dezelfde code komen.",
    "cs": "Rozhodnutí má přesně jednu implementaci. Když zůstatek klesne na POPOPX_BILLING_SUSPEND_THRESHOLD (výchozí 0) nebo níž, účet se stane SUSPENDED s důvodem credits a každý měřený plugin odpálí ve stejnou chvíli — srovnává se balance <= threshold, takže default odpálí přesně na nule, ne o kredit později. Měřené akce pak odpovídají 402 insufficient_credits nebo account_suspended a štítek gateway-decision na panelu pluginů konzole čte úplně stejný rozsudek. AI plugin přidává ještě jednu ručičku, exhausted_message, pevnou odpověď, kterou odběratelé dostávají, zatímco zůstatek je pryč; README říká, že tohle rozhodnutí i to, co ukazuje konzole, pocházejí ze stejného kódu.",
    "zh-Hans": "判定只有一份代码：余额落到或低于 POPOPX_BILLING_SUSPEND_THRESHOLD（默认 0）时账户转成 SUSPENDED、原因写 credits，每个被计量的插件同时熔断——比较是 balance <= threshold，所以默认值就是在恰好为零那一刻断。之后被计量的动作是 402 insufficient_credits 或 account_suspended，而后台插件面板上那枚「网关判定」chip 读到的就是同一个决定。AI 客服另有一个 exhausted_message 字段，是算力耗尽时回给粉丝的固定话术；README 说这条判定与控制台里读到的结果是同一份代码。",
    "zh-Hant": "判定只有一份程式碼：餘額落到或低於 POPOPX_BILLING_SUSPEND_THRESHOLD（預設 0）時帳戶轉成 SUSPENDED、原因寫 credits，每個被計量的插件同時斷線——比較是 balance <= threshold，所以預設值就是在恰好為零那一刻斷。之後被計量的動作是 402 insufficient_credits 或 account_suspended，而後臺插件面板上那枚「閘道判定」chip 讀到的就是同一個決定。AI 客服另有一個 exhausted_message 欄位，是算力耗盡時回給粉絲的固定話術；README 說這條判定與後臺讀到的結果是同一份程式碼。",
    "es": "La decisión tiene exactamente una implementación. Cuando el saldo baja a POPOPX_BILLING_SUSPEND_THRESHOLD (0 por defecto) o menos, la cuenta pasa a SUSPENDED con motivo credits y cada plugin medido se funde en el mismo instante — la comparación es balance <= threshold, así que por defecto se funde en cero exacto, no un crédito después. Las acciones medidas responden entonces 402 insufficient_credits o account_suspended, y el chip gateway-decision del panel de plugins de la consola lee exactamente el mismo veredicto. El plugin de IA añade una perilla más, exhausted_message, la respuesta fija que reciben los seguidores mientras el saldo esté agotado; el README afirma que esta decisión y la que muestra la consola salen del mismo código.",
    "pl": "Decyzja ma dokładnie jedną implementację. Gdy saldo spadnie do POPOPX_BILLING_SUSPEND_THRESHOLD (domyślnie 0) albo niżej, konto staje się SUSPENDED z powodem credits i każda rozliczana wtyczka przepala się w tej samej chwili — porównanie to balance <= threshold, więc domyślnie przepala się dokładnie na zerze, a nie kredyt później. Rozliczane akcje odpowiadają wtedy 402 insufficient_credits albo account_suspended, a chip gateway-decision w panelu wtyczek konsoli czyta dokładnie ten sam wyrok. Wtyczka AI dokręca jeszcze jedno pokrętło, exhausted_message, stałą odpowiedź, którą odbiorcy dostają, dopóki saldo zniknęło; README mówi wprost, że ta decyzja i ta pokazywana w konsoli pochodzą z tego samego kodu.",
    "ja": "判定の実装はただ1つです。残高が POPOPX_BILLING_SUSPEND_THRESHOLD（既定は 0）以下になると、アカウントは reason=credits で SUSPENDED になり、課金されるプラグインはすべて同時に停止します。比較は balance <= threshold なので、既定ではクレジットが1個残った時点ではなくちょうど0の場で止まります。以降、課金対象の操作は 402 insufficient_credits か account_suspended を返し、コンソールのプラグインパネルにある gateway-decision チップもまったく同じ判定を読みます。AI プラグインはこれにもう1つつまみを足します。exhausted_message で、残高が枯れている間にフォロワーが受け取る固定の返信です。README は、この判定とコンソールが見せる判定が同じコード由来だと明記しています。",
    "th": "การตัดสินนี้มีโค้ดเพียงชุดเดียว เมื่อเครดิตคงเหลือลดถึง POPOPX_BILLING_SUSPEND_THRESHOLD (ค่าเริ่มต้น 0) หรือต่ำกว่า บัญชีจะกลายเป็น SUSPENDED พร้อม reason=credits และปลั๊กอินที่ถูกคิดเครดิตทุกตัวจะถูกตัดพร้อมกันในวินาทีนั้น — เพราะเทียบแบบ balance <= threshold ค่าเริ่มต้นจึงตัดที่ศูนย์พอดี ไม่ใช่ช้าไปกว่าหนึ่งเครดิต จากนั้นการกระทำที่คิดเครดิตจะตอบ 402 insufficient_credits หรือ account_suspended และชิป gateway-decision บนแผงปลั๊กอินในคอนโซลก็อ่านคำตัดสินเดียวกันเป๊ะ ปลั๊กอิน AI เพิ่มจุกปรับอีกอันคือ exhausted_message ข้อความตายตัวที่ follower ได้รับตอนเครดิตหมด ซึ่ง README ระบุเองว่าคำตัดสินนี้กับที่คอนโซลแสดงมาจากโค้ดชุดเดียวกัน",
    "fi": "Päätöksellä on tasan yksi toteutus. Kun saldo laskee POPOPX_BILLING_SUSPEND_THRESHOLD:iin (oletus 0) tai alle, tilistä tulee SUSPENDED syyllä credits ja jokainen mitattu plugin poltetaan samalla hetkellä — vertailu on balance <= threshold, joten oletus polttaa tasan nollassa, ei yhtä creditiä myöhemmin. Mitatut toiminnot vastaavat sitten 402 insufficient_credits tai account_suspended, ja konsolin plugin-paneelin gateway-decision-merkki lukee täsmälleen saman tuomion. AI-plugin vääntää vielä yhden säätimen, exhausted_message, kiinteän vastauksen jonka seuraajat saavat niin kauan kuin saldo on loppu; README sanoo tämän päätöksen ja konsolin näyttämän tulevan samasta koodista.",
    "uk": "Реалізація рішення рівно одна. Коли баланс падає до POPOPX_BILLING_SUSPEND_THRESHOLD (типово 0) чи нижче, акаунт стає SUSPENDED з причиною credits, і кожен обліковий плагин вигорає в той самий момент: порівняння balance <= threshold, тому типово поріг спрацьовує рівно на нулі, а не на один кредит пізніше. Після цього облікові дії відповідають 402 insufficient_credits або account_suspended, і чіп gateway-decision на панелі плагінів консолі читає саме той самий вердикт. Плагин AI додає ще одну ручку, exhausted_message, — фіксовану відповідь, яку отримують підписники, доки баланс нульовий; у README сказано, що це рішення і те, що показує консоль, беруться з того самого коду.",
    "bg": "Решението има точно една имплементация. Когато балансът падне до POPOPX_BILLING_SUSPEND_THRESHOLD (по подразбиране 0) или под него, акаунтът става SUSPENDED с причина credits и всяка мерена приставка се изгаря в същия миг — сравнението е balance <= threshold, затова по подразбиране се изгаря точно на нула, не един кредит по-късно. Мерените действия след това отговарят 402 insufficient_credits или account_suspended, и чипът gateway-decision в панела на приставките в конзолата чете точно същата присъда. AI приставката добавя още едно гевре, exhausted_message, фиксираният отговор, който последователите получават докато балансът е изчерпан; README твърди, че това решение и показаното в конзолата идват от един и същи код.",
    "tr": "Kararın tam olarak bir implementation'ı var. Bakiye POPOPX_BILLING_SUSPEND_THRESHOLD değerine (varsayılan 0) veya altına düşünce hesap reason=credits ile SUSPENDED olur ve ölçülen her eklenti aynı anda yakılır — karşılaştırma balance <= threshold olduğundan varsayılan tam sıfırda, bir kredi geç değil yakar. Ölçülen eylemler bundan sonra 402 insufficient_credits ya da account_suspended döner; konsolun eklenti panelindeki gateway-decision çipi de birebir aynı kararı okur. AI eklentisi bir düğme daha ekler, exhausted_message; bakiye tükenmişken takipçilerin aldığı sabit yanıt. README, bu karar ile konsolun gösterdiği kararın aynı koddan geldiğini açıkça yazar.",
    "hu": "A döntésnek pontosan egy megvalósítása van. Amikor az egyenleg POPOPX_BILLING_SUSPEND_THRESHOLD alá (alapértelmezés 0) esik, a fiók SUSPENDED lesz credits okkal, és minden mért bővítmény ugyanabban a pillanatban kiég — az összevetés balance <= threshold, ezért alapértelmezésben pontosan nullánál ég ki, nem egy kredittel később. A mért műveletek ezután 402 insufficient_credits vagy account_suspended választ adnak, és a konzol bővítménypaneljének gateway-decision jelölője ugyanazt az ítéletet olvassa. Az AI bővítmény még egy gombot teker fel, exhausted_message, az a rögzített válasz, amit a követők kapnak amíg az egyenleg elmúlt; a README szerint ez a döntés és a konzol által mutatott is ugyanabból a kódból jön.",
  } satisfies L,

  /* Part 3 */
  p3Eyebrow: {
    en: "Step 3 · STEP 03",
    "ru": "Шаг 3 · STEP 03",
    "de": "Schritt 3 · STEP 03",
    "fr": "Étape 3 · STEP 03",
    "it": "Passaggio 3 · STEP 03",
    "nl": "Stap 3 · STEP 03",
    "cs": "Krok 3 · STEP 03",
    "zh-Hans": "第三步 · STEP 03",
    "zh-Hant": "第三步 · STEP 03",
    "es": "Paso 3 · STEP 03",
    "pl": "Krok 3 · STEP 03",
    "ja": "ステップ3 · STEP 03",
    "th": "ขั้นที่ 3 · STEP 03",
    "fi": "Vaihe 3 · STEP 03",
    "uk": "Крок 3 · STEP 03",
    "bg": "Стъпка 3 · STEP 03",
    "tr": "Adım 3 · STEP 03",
    "hu": "3. lépés · STEP 03",
  } satisfies L,
  p3Title: {
    en: "Scan, follow and interact on the iPhone, end to end",
    "ru": "Сканирование, подписка и взаимодействие на iPhone — от начала до конца",
    "de": "Scannen, folgen und interagieren auf dem iPhone, Ende zu Ende",
    "fr": "Scanner, suivre et interagir sur l'iPhone, de bout en bout",
    "it": "Scansiona, segui e interagisci sull'iPhone, end to end",
    "nl": "Scannen, volgen en interageren op de iPhone, van begin tot eind",
    "cs": "Naskenovat, sledovat a odpovídat na iPhone — od začátku až po konec",
    "zh-Hans": "iPhone 端扫码关注与交互操作全流程",
    "zh-Hant": "iPhone 端掃碼關注與互動操作全流程",
    "es": "Escanear, seguir e interaccionar en el iPhone, de extremo a extremo",
    "pl": "Zeskanuj, obserwuj i odpowiadaj na iPhonie — od początku do końca",
    "ja": "iPhoneでスキャン→フォロー→やり取りを最初から最後まで通す",
    "th": "สแกน ติดตาม และโต้ตอบบน iPhone ครบทั้งเส้น",
    "fi": "Skannaa, seuraa ja vuorovaikuta iPhonessa, laidasta laitaan",
    "uk": "Скануй, підписуйся і взаємодій на iPhone — від початку до кінця",
    "bg": "Сканирай, последвай и взаимодействай на iPhone, от край до край",
    "tr": "iPhone'da tara, takibe al ve etkileşime geç, baştan sona",
    "hu": "Beolvasás, követés és interakció iPhonon, a kezdettől a végéig",
  } satisfies L,
  p3Sub: {
    en: "The panel names are the ones that actually exist: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, then the nine plugin panels AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar and Slack / Discord outbound, and the operations group API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "ru": "Панели названы так, как они реально называются: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, затем девять панелей плагинов AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar и Slack / Discord outbound и группа операций API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "de": "Die Panelnamen sind die tatsächlich existierenden: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, dann die neun Plugin-Panels AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar und Slack / Discord outbound sowie die Operationsgruppe API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "fr": "Les noms de panneaux sont ceux qui existent réellement : Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, puis les neuf panneaux de plugins AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar et Slack / Discord outbound, et le groupe opérations API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "it": "I nomi dei pannelli sono quelli che esistono davvero: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, poi i nove pannelli plugin AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar e Slack / Discord outbound, e il gruppo operazioni API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "nl": "De paneelnamen zijn degene die echt bestaan: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, dan de negen pluginpanelen AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar en Slack / Discord outbound, en de operationsgroep API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "cs": "Názvy panelů jsou ty, které skutečně existují: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, pak devět panelů pluginů AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar a Slack / Discord outbound a skupina operací API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "zh-Hans": "面板名一律用后台里真正的那几个：总览、服务号与节点、联系人、菜单编排、卡片下发、图文与 H5、频道与密钥轮换、账户与流水、算力激活码，加上「插件控制台」里的 AI 客服、告警运营、免密登录、投票、Web3 桥、开放工作流、CardDAV 通讯录、CalDAV 日历、Slack / Discord 出站桥，以及运维那组 API 令牌、出站队列、回调、设置、诊断。",
    "zh-Hant": "面板名一概用後臺裡真正的那幾個：總覽、服務號與節點、聯絡人、選單編排、卡片下發、圖文與 H5、頻道與金鑰輪換、帳戶與流水、算力激活碼，加上「插件後臺」裡的 AI 客服、告警運營、免密登入、投票、Web3 橋、開放工作流、CardDAV 通訊錄、CalDAV 日曆、Slack / Discord 出站橋，以及維運那組 API 權杖、出站佇列、回調、設定、診斷。",
    "es": "Los nombres de los paneles son los que realmente existen: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, luego los nueve paneles de plugins AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar y Slack / Discord outbound, y el grupo de operaciones API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "pl": "Nazwy paneli to te, które faktycznie istnieją: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, potem dziewięć paneli wtyczek AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar i Slack / Discord outbound oraz grupa operacji API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "ja": "パネル名は実際に存在するそのままです。Overview、Service account & node、Contacts、Menu orchestration、Card delivery、Articles & H5、Channels & key rotation、Account & ledger、Vouchers、続けてプラグイン9パネルの AI agent、Alert ops、Passwordless SSO、Polls、Web3 bridge、Workflow bridge、CardDAV contacts、CalDAV calendar、Slack / Discord outbound、そして運用グループの API tokens、Outbox、Callbacks、Settings、Diagnostics です。",
    "th": "ชื่อแผงทั้งหมดคือชื่อที่มีอยู่จริง: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers ตามด้วยแผงปลั๊กอินเก้าแผง AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar และ Slack / Discord outbound แล้วกลุ่ม operations API tokens, Outbox, Callbacks, Settings, Diagnostics",
    "fi": "Paneelien nimet ovat ne, jotka todella ovat olemassa: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, sitten yhdeksän plugin-paneelia AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar ja Slack / Discord outbound sekä operaatioryhmä API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "uk": "Назви панелей саме ті, що реально існують: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, потім дев'ять панелей плагінів AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar і Slack / Discord outbound та група операцій API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "bg": "Имената на панелите са тези, които наистина съществуват: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, после деветте панела на приставки AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar и Slack / Discord outbound и групата операции API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "tr": "Panel adları gerçekte var olanlardır: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, ardından dokuz eklenti paneli AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar ve Slack / Discord outbound ile operasyon grubu API tokens, Outbox, Callbacks, Settings, Diagnostics.",
    "hu": "A panelnevek pontosan a létezők: Overview, Service account & node, Contacts, Menu orchestration, Card delivery, Articles & H5, Channels & key rotation, Account & ledger, Vouchers, aztán a kilenc bővítménypanel AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar és Slack / Discord outbound, végül az operations csoport API tokens, Outbox, Callbacks, Settings, Diagnostics.",
  } satisfies L,
  consoleLabel: {
    en: "Where you click",
    "ru": "Где нажимать",
    "de": "Wo Sie klicken",
    "fr": "Où cliquer",
    "it": "Dove cliccare",
    "nl": "Waar je klikt",
    "cs": "Kde kliknout",
    "zh-Hans": "后台点这里",
    "zh-Hant": "後臺點這裡",
    "es": "Dónde hacer clic",
    "pl": "Gdzie klikać",
    "ja": "どこを押すか",
    "th": "กดที่ไหน",
    "fi": "Missä klikkaat",
    "uk": "Де натискати",
    "bg": "Къде се кликва",
    "tr": "Nereye tıklıyorsunuz",
    "hu": "Hová kattintson",
  } satisfies L,
  phoneLabel: {
    en: "On the phone",
    "ru": "На телефоне",
    "de": "Auf dem Telefon",
    "fr": "Sur le téléphone",
    "it": "Sul telefono",
    "nl": "Op de telefoon",
    "cs": "Na telefonu",
    "zh-Hans": "手机上",
    "zh-Hant": "手機上",
    "es": "En el teléfono",
    "pl": "Na telefonie",
    "ja": "スマホ側では",
    "th": "บนมือถือ",
    "fi": "Puhelimessa",
    "uk": "На телефоні",
    "bg": "На телефона",
    "tr": "Telefonda",
    "hu": "A telefonon",
  } satisfies L,
  framesCaption: {
    en: "This block is an abbreviated schematic, not a pasteable payload: it names the frame types and the fields the wire always carries, while the card object and the leaf values are left out. sc always travels with card next to m; mc carries rev only when a menu revision was passed. The gateway appends the frame after the visible text when it sends; the client's parser drops anything whose prefix it does not recognise, silently, which is why these bytes are validated before sending rather than discussed afterwards.",
    "ru": "Этот блок — сокращённая схема, а не готовый к вставке payload: в нём названы типы кадров и поля, которые линия всегда несёт, а объект card и конечные значения опущены. sc всегда идёт вместе с card рядом с m; mc несёт rev, только если передана ревизия меню. Шлюз дописывает кадр после видимого текста при отправке; парсер клиента молча отбрасывает всё, чего префикс не распознает — поэтому эти байты проверяются до отправки, а не обсуждаются после.",
    "de": "Dieser Block ist eine verkürzte Skizze, kein einfügbarer Payload: er nennt die Frame-Typen und die Felder, die die Leitung immer trägt, während das card-Objekt und die Blattwerte fehlen. sc läuft immer mit card neben m; mc trägt rev nur, wenn eine Menü-Revision übergeben wurde. Das Gateway hängt den Frame beim Senden hinter den sichtbaren Text; der Parser des Clients verwirft still alles, deren Präfix er nicht kennt — deshalb werden diese Bytes vor dem Senden geprüft und nicht hinterher besprochen.",
    "fr": "Ce bloc est un schéma abrégé, pas une charge utile à coller : il nomme les types de trame et les champs que le fil porte toujours, l'objet card et les valeurs de feuille étant omis. sc voyage toujours avec card à côté de m ; mc porte rev seulement quand une révision de menu est passée. La passerelle ajoute la trame après le texte visible à l'envoi ; le parseur du client rejette en silence tout préfixe qu'il ne reconnaît pas — d'où ces octets validés avant l'envoi plutôt que discutés après.",
    "it": "Questo blocco è uno schema abbreviato, non un payload da incollare: nomina i tipi di frame e i campi che il filo porta sempre, mentre l'oggetto card e i valori foglia sono omessi. sc viaggia sempre con card accanto a m; mc porta rev solo quando è stata passata una revisione del menu. Il gateway aggiunge il frame dopo il testo visibile quando invia; il parser del client scarta in silenzio tutto ciò il cui prefisso non riconosce — quindi questi byte vengono validati prima dell'invio anziché discussi dopo.",
    "nl": "Dit blok is een beknopte schets, geen inkleefbare payload: het noemt de frametypes en de velden die de lijn altijd draagt, terwijl het card-object en de bladwaarden ontbreken. sc gaat altijd met card naast m; mc draagt rev alleen zodra een menurevisie werd meegegeven. De gateway plakt het frame bij het verzenden achter de zichtbare tekst; de parser van de client dumpt zwijgend alles met een onbekend voorvoegsel — daarom worden deze bytes vóór het verzenden gevalideerd in plaats van achteraf besproken.",
    "cs": "Tenhle blok je zkrácený náčrt, ne vložitelný payload: pojmenovává typy rámce a pole, která linka nese vždycky, zatímco objekt card a hodnoty listů jsou vynechány. sc vždy jede s card vedle m; mc nese rev jen tehdy, když se předala revize menu. Brána při odeslání přidá frame za viditelný text; parser klienta tiše zahodí všechno, čí prefix nepozná — proto se tyhle bajty ověřují před odesláním, a neřeší se až potom.",
    "zh-Hans": "这一块是缩略示意图，不是能直接粘贴的 payload：它只列出帧类型和线上一律会带的字段，card 对象本身与叶子值都省掉了。sc 永远带着 card 和 m 一起走；mc 只有在传了菜单版本号时才带 rev。后台在卡片下发时把对应帧拼在可见文本之后一起发出；客户端的解析器认不出前缀就整条静默丢掉，所以这些字节是发送前校验的，不是发出去再谈。",
    "zh-Hant": "這一塊是縮略示意圖，不是能直接貼上的 payload：它只列出幀類型和線上一律會帶的欄位，card 物件本身與葉子值都省掉了。sc 永遠帶著 card 和 m 一起走；mc 只有在傳了選單版本號時才帶 rev。後臺在卡片下發時把對應幀拼在可見文字之後一起發出；用戶端的解析器認不出前綴就整條靜默丟掉，所以這些位元組是發送前驗證的，不是發出去再談。",
    "es": "Este bloque es un esquema abreviado, no un payload listo para pegar: nombra los tipos de trama y los campos que la línea siempre lleva, mientras el objeto card y los valores hoja quedan fuera. sc viaja siempre con card junto a m; mc lleva rev solo cuando se pasó una revisión de menú. La pasarela añade el frame detrás del texto visible al enviar; el parser del cliente descarta en silencio todo cuyo prefijo no reconoce — de ahí que estos bytes se validen antes de enviar en vez de discutirse después.",
    "pl": "Ten blok to skrótowy szkic, nie payload do wklejenia: wymienia typy ramek i pola, które linia zawsze niesie, pomijając obiekt card oraz wartości liści. sc zawsze jedzie z card obok m; mc niesie rev tylko wtedy, gdy przekazano rewizję menu. Brama dorzuca ramkę po widocznym tekście przy wysyłaniu; parser klienta po cichu odrzuca wszystko z nierozpoznanym przedrostkiem — dlatego te bajty są sprawdzane przed wysłaniem, a nie omawiane po.",
    "ja": "このブロックは省略した模式的な書き方で、そのまま貼れる payload ではありません。フレームの種類と、ラインが必ず運ぶフィールドだけを名乗り、card オブジェクトと末端の値は落としてあります。sc は m の隣に card を必ず連れて行き、mc はメニューのリビジョンを渡したときだけ rev を持ちます。ゲートウェイは送信時にフレームを見えやすい文の後ろに付け足します。クライアント側のパーサは、知らない接頭辞を持つものを黙って捨てます。だからこそ、このバイト列は送信前に検証し、送信後に議論しません。",
    "th": "ก้อนนี้เป็นภาพร่างย่อ ไม่ใช่ payload ที่ก๊อปไปวางได้: มันระบุแค่ชนิดเฟรมกับฟิลด์ที่สายข้อมูลแบกไปด้วยเสมอ ส่วนอ็อบเจกต์ card กับค่าปลายทางถูกตัดทิ้ง sc จะมากับ card ข้าง m เสมอ ส่วน mc จะมี rev มาด้วยเมื่อมีการส่ง revision ของเมนูเท่านั้น ตอนส่ง gateway จะต่อ frame ไว้หลังข้อความที่เห็นได้ และ parser ของฝั่ง client จะทิ้งเงียบ ๆ ทุกอย่างที่ไม่รู้จัก prefix ดังนั้นไบต์พวกนี้จึงถูกตรวจก่อนส่ง ไม่ใช่มาเถียงกันทีหลัง",
    "fi": "Tämä lohko on lyhennetty luonnos, ei liimattava payload: se nimeää kehytyypit ja kentät, jotka linja aina kuljettaa, kun taas card-objekti ja lehtiarvot on jätetty pois. sc kulkee aina cardin kanssa m:n vieressä; mc kuljettaa rev vain, kun valikkorevisio on annettu. Gateway liimaa kehyksen näkyvän tekstin perään lähettäessään; asiakkaan jäsennin hylkää äänettömästi kaiken, jonka etuliitettä se ei tunnista — siksi nämä tavut varmistetaan ennen lähetystä eikä jälkikäteen puida.",
    "uk": "Цей блок — скорочена схема, а не готовий до вставки payload: у ньому названо типи кадрів і поля, які лінія завжди несе, тоді як об’єкт card і кінцеві значення пропущено. sc завжди йде разом з card поруч з m; mc несе rev лише тоді, коли передано ревізію меню. Шлюз дописує кадр після видимого тексту надсилання; парсер клієнта мовчки відкидає все з нерозпізнаним префіксом — через те ці байти перевіряються до надсилання, а не обговорюються після.",
    "bg": "Този блок е съкратена схема, не payload за поставяне: той именува типовете кадри и полетата, които линията винаги носи, а обектът card и крайните стойности са пропуснати. sc винаги върви с card до m; mc носи rev, когато е подадена ревизия на менюто. Шлюзът добавя кадъра след видимия текст при изпращане; parser-ът на клиента мълчаливо изхвърля всичко с неразпознат префикс — затова тези байтове се валидират преди изпращане, а не се обсъждат след това.",
    "tr": "Bu blok kısaltılmış bir şemadır, yapıştırılabilir bir yük değil: çerçeve türlerini ve hattın her zaman taşıdığı alanları adlandırır, card nesnesi ile uç değerler düşürülmüştür. sc her zaman m'nin yanında card ile gider; mc yalnızca bir menü revizyonu geçirildiğinde rev taşır. Ağ geçidi gönderirken kareyi görünür metnin sonuna ekler; istemcinin ayracı tanımadığı ön ekli her şeyi sessizce düşürür — bu yüzden bu baytlar göndermeden önce doğrulanır, sonra tartışılmaz.",
    "hu": "Ez a blokk rövidített vázlat, nem beilleszthető payload: a kerettípusokat és azokat a mezőket sorolja fel, amelyeket a vonal mindig visz; a card objektum és a levélértékek ki vannak hagyva. Az sc mindig az m mellé tett card-dal együtt indul; az mc akkor visz rev-t, ha a menü revízióját átadták. Az átjáró elküadáskor a látható szöveg mögé fűzi a keretet; az ügyfél elemzője hallgatóan dob el mindent, amelynek előtagját nem ismeri fel — ezért ezeket a bájtokat elküldés előtt ellenőrizzük, nem utólag vitatjuk.",
  } satisfies L,

  checkTitle: {
    en: "Five-minute start: the checklist",
    "ru": "Старт за пять минут: чек-лист",
    "de": "Fünf-Minuten-Start: die Checkliste",
    "fr": "Démarrage en cinq minutes : la check-list",
    "it": "Avvio in cinque minuti: la checklist",
    "nl": "Start in vijf minuten: de checklist",
    "cs": "Start za pět minut: checklist",
    "zh-Hans": "5 分钟上手：核对清单",
    "zh-Hant": "5 分鐘上手：核對清單",
    "es": "Arranque en cinco minutos: la lista",
    "pl": "Start w pięć minut: lista kontrolna",
    "ja": "5分で立ち上げる：チェックリスト",
    "th": "เริ่มในห้านาที: เช็กลิสต์",
    "fi": "Viiden minuutin käynnistys: muistilista",
    "uk": "Старт за п'ять хвилин: чек-лист",
    "bg": "Старт за пет минути: чек-листът",
    "tr": "Beş dakikada kurulum: kontrol listesi",
    "hu": "Öt perces indítás: a lista",
  } satisfies L,
  checkHint: {
    en: "Tap to tick; the state lives only in this page's memory and a language switch leaves it alone.",
    "ru": "Нажатие ставит галочку; состояние живёт только в памяти этой страницы, а переключение языка его не трогает.",
    "de": "Ein Tipp setzt das Häkchen; der Zustand lebt nur im Speicher dieser Seite, und ein Sprachwechsel lässt ihn in Ruhe.",
    "fr": "Un tap coche la case ; l'état n'existe que dans la mémoire de cette page, et changer de langue ne le touche pas.",
    "it": "Un tocco mette la spunta; lo stato vive solo nella memoria di questa pagina e un cambio di lingua non lo tocca.",
    "nl": "Tikken zet het vinkje; de staat leeft alleen in het geheugen van deze pagina en een taalwisseling laat het met rust.",
    "cs": "Ťuknutí zaškrtne; stav žije jen v paměti této stránky a přepnutí jazyka ho nechává na pokoji.",
    "zh-Hans": "点一下打勾，状态只存在这一页的内存里；换语言不影响勾选。",
    "zh-Hant": "點一下打勾，狀態只存在這一頁的記憶體裡；換語言不影響勾選。",
    "es": "Un toque marca la casilla; el estado solo vive en la memoria de esta página y cambiar de idioma no lo toca.",
    "pl": "Stuknięcie zaznacza; stan żyje wyłącznie w pamięci tej strony, a zmiana języka go nie rusza.",
    "ja": "タップするとチェックが入ります。状態はこのページのメモリにしか無く、言語を切り替えてもそのまま残ります。",
    "th": "แตะเพื่อติ๊ก สถานะเก็บอยู่ใน memory ของหน้านี้เท่านั้น และการสลับภาษาจะไม่แตะมัน",
    "fi": "Napautus ruksaa; tila elää vain tämän sivun muistissa, eikä kielen vaihto koske siihen.",
    "uk": "Натискання ставить галочку; стан живе лише в пам'яті цієї сторінки, а перемикання мови його не чіпає.",
    "bg": "Докването слага отметка; състоянието живее само в паметта на тази страница, а смяната на език не го докосва.",
    "tr": "Dokunmak işareti koyar; durum yalnızca bu sayfanın belleğinde yaşar, dil değiştirmek ona dokunmaz.",
    "hu": "Koppintással pipa kerül be; az állapot csak az oldal memóriájában él, és a nyelvváltás sem bántja.",
  } satisfies L,
  checkProgress: {
    en: "Done",
    "ru": "Готово",
    "de": "Fertig",
    "fr": "Terminé",
    "it": "Fatto",
    "nl": "Klaar",
    "cs": "Hotovo",
    "zh-Hans": "已完成",
    "zh-Hant": "已完成",
    "es": "Hecho",
    "pl": "Gotowe",
    "ja": "完了",
    "th": "เสร็จแล้ว",
    "fi": "Valmis",
    "uk": "Готово",
    "bg": "Готово",
    "tr": "Tamam",
    "hu": "Kész",
  } satisfies L,
  checkAll: {
    en: "Tick all",
    "ru": "Отметить всё",
    "de": "Alle abhaken",
    "fr": "Tout cocher",
    "it": "Spunta tutto",
    "nl": "Alles afvinken",
    "cs": "Zaškrtnout vše",
    "zh-Hans": "全部勾上",
    "zh-Hant": "全部勾上",
    "es": "Marcar todo",
    "pl": "Zaznacz wszystko",
    "ja": "すべてチェック",
    "th": "ติ๊กทั้งหมด",
    "fi": "Ruksi kaikki",
    "uk": "Позначити все",
    "bg": "Отбележи всичко",
    "tr": "Hepsini işaretle",
    "hu": "Mindet bepipálja",
  } satisfies L,
  checkReset: {
    en: "Clear ticks",
    "ru": "Сбросить галочки",
    "de": "Häkchen löschen",
    "fr": "Effacer les cases",
    "it": "Azzera le spunte",
    "nl": "Vinkjes wissen",
    "cs": "Zrušit zaškrtnutí",
    "zh-Hans": "清空勾选",
    "zh-Hant": "清空勾選",
    "es": "Quitar las marcas",
    "pl": "Wyczyść zaznaczenia",
    "ja": "チェックを外す",
    "th": "ล้างติ๊ก",
    "fi": "Tyhjennä ruksit",
    "uk": "Скинути галочки",
    "bg": "Изчисти отметките",
    "tr": "İşaretleri temizle",
    "hu": "Pipeák törlése",
  } satisfies L,
  checkDone: {
    en: "All checked",
    "ru": "Всё отмечено",
    "de": "Alles abgehakt",
    "fr": "Tout est coché",
    "it": "Tutto spuntato",
    "nl": "Alles afgevinkt",
    "cs": "Vše zaškrtnuto",
    "zh-Hans": "都打勾了",
    "zh-Hant": "都打勾了",
    "es": "Todo marcado",
    "pl": "Wszystko zaznaczone",
    "ja": "すべてチェック済み",
    "th": "ติ๊กครบแล้ว",
    "fi": "Kaikki ruksattu",
    "uk": "Усе позначено",
    "bg": "Всичко е отметнато",
    "tr": "Hepsi işaretli",
    "hu": "Minden bepipálva",
  } satisfies L,
  outroSandbox: {
    en: "Not ready to install? #sandbox walks the plugin calls and their receipts right here in the page.",
    "ru": "Ещё не готовы ставить? #sandbox пройдёт по вызовам плагинов и их квитанциям прямо здесь, на странице.",
    "de": "Noch nicht bereit zu installieren? #sandbox geht die Plugin-Aufrufe und ihre Belege genau hier auf der Seite durch.",
    "fr": "Pas encore prêt à installer ? #sandbox parcourt les appels des plugins et leurs reçus, ici même dans la page.",
    "it": "Non sei ancora pronto a installare? #sandbox scorre le chiamate dei plugin e le relative ricevute qui, nella pagina.",
    "nl": "Nog niet klaar om te installeren? #sandbox loopt de plugin-aanroepen en hun kwitanties hier, op de pagina, door.",
    "cs": "Ještě nejste připraveni instalovat? #sandbox projde volání pluginů a jejich účtenky přímo tady na stránce.",
    "zh-Hans": "先不想装：#sandbox 里能直接点一遍各插件的调用与回执。",
    "zh-Hant": "先不想裝：#sandbox 裡能直接點一遍各插件的呼叫與回執。",
    "es": "¿Todavía no listo para instalar? #sandbox recorre las llamadas de los plugins y sus recibos aquí mismo, en la página.",
    "pl": "Jeszcze nie gotowy do instalacji? #sandbox przechodzi po wywołaniach wtyczek i ich potwierdzeniach tutaj, na stronie.",
    "ja": "まだインストールする準備ができていないなら、#sandbox がプラグインの呼び出しとその領収書をこのページ上でそのまま辿ります。",
    "th": "ยังไม่ได้เตรียมติดตั้งหรือ? #sandbox จะไล่เรียกปลั๊กอินพร้อมใบเสร็จของมันให้ดูบนหน้านี้เอง",
    "fi": "Eikö asennusta olla vielä valmiina? #sandbox käy plugin-kutsut ja niiden kuiteet tässä samalla sivulla.",
    "uk": "Ще не готові встановлювати? #sandbox пройде по викликах плагінів та їхніх квитанціях просто тут, на сторінці.",
    "bg": "Все още не сте готови за инсталация? #sandbox преминава през извикванията на приставките и техните разписки точно тук, в страницата.",
    "tr": "Henüz kurmaya hazır değilseniz? #sandbox, eklenti çağrılarını ve makbuzlarını tam burada, sayfada gezdirir.",
    "hu": "Még nem áll készen a telepítésre? A #sandbox itt, az oldalon vezeti végig a bővítményhívásokat és a bizonylataikat.",
  } satisfies L,
  outroDirectory: {
    en: "For byte-exact frame samples, the frame table and the route census, the #directory section keeps them.",
    "ru": "Байт-в-байт образцы кадров, таблица кадров и перепись маршрутов остались в разделе #directory.",
    "de": "Bytegenaue Frame-Muster, die Frame-Tabelle und die Route-Zählung hält der Abschnitt #directory bereit.",
    "fr": "Pour des échantillons de trames au bit près, le tableau des trames et le recensement des routes, la section #directory les garde.",
    "it": "Per campioni di frame byte-exact, la tabella dei frame e il censimento delle rotte, ci pensa la sezione #directory.",
    "nl": "Voor byte-exacte frame-monsters, de frametabel en de roetentelling houdt de sectie #directory ze voor u.",
    "cs": "Vzorky frameů bajt od bajtu, tabulku frameů a soupis routů máte v sekci #directory.",
    "zh-Hans": "要逐字节的协议样本、帧表与接口清单：#directory 那一节。",
    "zh-Hant": "要逐位元組的協議樣本、幀表與介面清單：#directory 那一節。",
    "es": "Para muestras de frames byte a byte, la tabla de frames y el censo de rutas, la sección #directory los mantiene.",
    "pl": "Próbk ramek co do bajta, tabelę ramek oraz spis tras zostawia sekcja #directory.",
    "ja": "バイト単位で正確なフレーム見本、フレーム表、ルートの全数調査は #directory の節に置いてあります。",
    "th": "ตัวอย่าง frame ตรงทุกไบต์ ตาราง frame และบัญชีเส้นทาง ทั้งหมดอยู่ในหัวข้อ #directory",
    "fi": "Tavun tarkat kehysnäytteet, kehystaulukko ja reittiluettelo ovat #directory-osiossa.",
    "uk": "Зразки кадрів байт-у-байт, таблицю кадрів і перепис маршрутів лишив розділ #directory.",
    "bg": "За образец на кадрове байт по байт, таблицата с кадри и преброяването на маршрутите — раздел #directory ги пази.",
    "tr": "Birebir bayt eşleşen kare örnekleri, kare tablosu ve rota sayımı için #directory bölümüne bakın.",
    "hu": "Bajt-pontos keretmintákhoz, a kerettáblához és az útvonalnévsorhoz a #directory szakasz szolgál.",
  } satisfies L,
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * 3. Tables
 * ──────────────────────────────────────────────────────────────────────────── */

const CP_ROWS: { key: string; value: string; what: L }[] = [
  {
    key: "POPOPX_CP_PER_CARD",
    value: "1",
    what: {
      en: "delivering one card",
      "ru": "Доставка одной карточки",
      "de": "Eine Karte zustellen",
      "fr": "Livrer une carte",
      "it": "Consegnare una card",
      "nl": "Eén kaart bezorgen",
      "cs": "Doručení jedné karty",
      "zh-Hans": "下发一张卡片",
      "zh-Hant": "下發一張卡片",
      "es": "Entregar una tarjeta",
      "pl": "Dostarczenie jednej karty",
      "ja": "カードを1通配信",
      "th": "ส่งการ์ดหนึ่งใบ",
      "fi": "Yhden kortin toimittaminen",
      "uk": "Доставка однієї картки",
      "bg": "Доставяне на една карта",
      "tr": "Bir kart teslimi",
      "hu": "Egy kártya kiszállítása",
    },
  },
  {
    key: "POPOPX_CP_PER_MENU_PUSH",
    value: "1",
    what: {
      en: "pushing the bottom menu once",
      "ru": "Одна публикация нижнего меню",
      "de": "Das untere Menü einmal hochladen",
      "fr": "Pousser le menu bas une fois",
      "it": "Spingere il menu in basso una volta",
      "nl": "Het ondermenu één keer pushen",
      "cs": "Jedna publikace spodního menu",
      "zh-Hans": "推送一次底部菜单",
      "zh-Hant": "推送一次底部選單",
      "es": "Publicar una vez el menú inferior",
      "pl": "Jedno opublikowanie menu na dole",
      "ja": "下部メニューを1回プッシュ",
      "th": "ดันเมนูแถบล่างหนึ่งครั้ง",
      "fi": "Alavalikon työntäminen kerran",
      "uk": "Одне публікування нижнього меню",
      "bg": "Едно публикуване на долното меню",
      "tr": "Alt menüyü bir kez yayımlama",
      "hu": "Az alsó menu egyszeri feltöltése",
    },
  },
  {
    key: "POPOPX_CP_PER_KEY_ROTATION",
    value: "2",
    what: {
      en: "channel key rotation, charged per member",
      "ru": "Ротация ключа канала, по участнику",
      "de": "Kanalschlüssel-Rotation, pro Mitglied abgerechnet",
      "fr": "Rotation de clé de canal, facturée par membre",
      "it": "Rotazione della chiave del canale, addebitata per membro",
      "nl": "Kanaalsleutelrotatie, per lid gefactureerd",
      "cs": "Rotace klíče kanálu, účtováno za člena",
      "zh-Hans": "频道密钥轮换，按每位成员计",
      "zh-Hant": "頻道金鑰輪換，按每位成員計",
      "es": "Rotación de clave de canal, cobrado por miembro",
      "pl": "Rotacja klucza kanału, naliczanie od uczestnika",
      "ja": "チャンネル鍵のローテーション（参加者1人ごとに課金）",
      "th": "หมุนเวียนคีย์ช่อง คิดเป็นรายสมาชิก",
      "fi": "Kanava-avaimen kierrätys, jäsentä kohti veloitetaan",
      "uk": "Ротація ключа каналу, списування за учасника",
      "bg": "Ротация на ключа на канала, таксуване на участник",
      "tr": "Kanal anahtarı döndürme, üye başına ücret",
      "hu": "Csatornakulcs-rotáció, tagságonként számolva",
    },
  },
  {
    key: "POPOPX_CP_PER_AI_MESSAGE",
    value: "5",
    what: {
      en: "one AI agent reply",
      "ru": "Один ответ AI-агента",
      "de": "Eine AI-Agent-Antwort",
      "fr": "Une réponse de l'agent IA",
      "it": "Una risposta dell'agente AI",
      "nl": "Eén AI-agent-antwoord",
      "cs": "Jedna odpověď AI agenta",
      "zh-Hans": "AI 客服每条回复",
      "zh-Hant": "AI 客服每則回覆",
      "es": "Una respuesta del agente de IA",
      "pl": "Jedna odpowiedź agenta AI",
      "ja": "AIエージェントの返信1通",
      "th": "คำตอบจาก AI agent หนึ่งครั้ง",
      "fi": "Yksi tekoälyagentin vastaus",
      "uk": "Одна відповідь AI-агента",
      "bg": "Един отговор на AI агента",
      "tr": "Bir AI ajanı yanıtı",
      "hu": "Egy AI-ügynök válasza",
    },
  },
  {
    key: "POPOPX_CP_PER_ALERT",
    value: "2",
    what: {
      en: "one alert action (ack and resolve charge separately)",
      "ru": "Одно алерт-действие (ack и resolve списываются раздельно)",
      "de": "Eine Alarmaktion (ack und resolve werden getrennt berechnet)",
      "fr": "Une action d'alerte (ack et resolve sont facturés séparément)",
      "it": "Una azione di alert (ack e resolve vengono addebitati separatamente)",
      "nl": "Eén alertactie (ack en resolve worden apart gefactureerd)",
      "cs": "Jedna alert akce (ack a resolve se účtují zvlášť)",
      "zh-Hans": "一条告警动作（确认与解决各计一次）",
      "zh-Hant": "一條告警動作（確認與解決各計一次）",
      "es": "Una acción de alerta (ack y resolve se cobran por separado)",
      "pl": "Jedna akcja alertu (ack i resolve naliczane osobno)",
      "ja": "アラート操作1件（ack と resolve は別々に課金）",
      "th": "การกระทำ alert หนึ่งครั้ง (ack กับ resolve คิดคนละครั้ง)",
      "fi": "Yksi hälytystoiminto (ack ja resolve laskutetaan erikseen)",
      "uk": "Одна дія з алертом (ack і resolve списуються окремо)",
      "bg": "Едно alert действие (ack и resolve се таксуват поотделно)",
      "tr": "Bir uyarı eylemi (ack ve resolve ayrı ücretlendirilir)",
      "hu": "Egy riasztási művelet (az ack és a resolve külön számít)",
    },
  },
  {
    key: "POPOPX_CP_PER_SSO_LOGIN",
    value: "1",
    what: {
      en: "one passwordless SSO login",
      "ru": "Один вход без пароля",
      "de": "Ein Login ohne Passwort",
      "fr": "Une connexion sans mot de passe",
      "it": "Un login senza password",
      "nl": "Eén inlog zonder wachtwoord",
      "cs": "Jedno přihlášení bez hesla",
      "zh-Hans": "一次免密登录签发",
      "zh-Hant": "一次免密登入簽發",
      "es": "Un inicio de sesión sin contraseña",
      "pl": "Jedno logowanie bez hasła",
      "ja": "パスワードレスのログイン1回",
      "th": "ล็อกอินแบบไม่มีรหัสผ่านหนึ่งครั้ง",
      "fi": "Yksi kirjautuminen salasanatta",
      "uk": "Один вхід без пароля",
      "bg": "Един вход без парола",
      "tr": "Bir parolasız giriş",
      "hu": "Egy belépés jelszó nélkül",
    },
  },
  {
    key: "POPOPX_CP_PER_POLL",
    value: "1",
    what: {
      en: "one poll",
      "ru": "Один опрос",
      "de": "Eine Umfrage",
      "fr": "Un sondage",
      "it": "Un sondaggio",
      "nl": "Eén poll",
      "cs": "Jedna anketa",
      "zh-Hans": "一次投票",
      "zh-Hant": "一次投票",
      "es": "Una encuesta",
      "pl": "Jedna ankieta",
      "ja": "投票1件",
      "th": "โพลหนึ่งอัน",
      "fi": "Yksi kysely",
      "uk": "Одне опитування",
      "bg": "Една анкета",
      "tr": "Bir anket",
      "hu": "Egy szavazás",
    },
  },
  {
    key: "POPOPX_CP_PER_WEB3_EVENT",
    value: "1",
    what: {
      en: "one on-chain event (this plugin is off by default)",
      "ru": "Одно on-chain событие (этот плагин по умолчанию выключен)",
      "de": "Ein On-Chain-Ereignis (dieses Plugin ist standardmäßig aus)",
      "fr": "Un événement on-chain (ce plugin est désactivé par défaut)",
      "it": "Un evento on-chain (questo plugin è spento di default)",
      "nl": "Eén on-chain event (deze plugin staat standaard uit)",
      "cs": "Jedna on-chain událost (tento plugin je ve výchozím stavu vypnutý)",
      "zh-Hans": "一个链上事件（该插件默认关闭）",
      "zh-Hant": "一個鏈上事件（該插件預設關閉）",
      "es": "Un evento on-chain (este plugin está apagado por defecto)",
      "pl": "Jedno zdarzenie on-chain (ta wtyczka jest domyślnie wyłączona)",
      "ja": "オンチェーンイベント1件（このプラグインは既定でオフ）",
      "th": "เหตุการณ์ on-chain หนึ่งครั้ง (ปลั๊กอินนี้ปิดอยู่โดยค่าเริ่มต้น)",
      "fi": "Yksi on-chain-tapahtuma (tämä plugin on oletuksena pois päältä)",
      "uk": "Одна подія в ланцюзі (цей плагин типово вимкнено)",
      "bg": "Едно on-chain събитие (тази приставка е изключена по подразбиране)",
      "tr": "Bir zincir üstü olay (bu eklenti varsayılan olarak kapalı)",
      "hu": "Egy on-chain esemény (ez a bővítmény alapból ki van kapcsolva)",
    },
  },
  {
    key: "POPOPX_CP_PER_WORKFLOW_EVENT",
    value: "1",
    what: {
      en: "one workflow trigger delivery (this plugin is off by default)",
      "ru": "Одна доставка триггера workflow (этот плагин по умолчанию выключен)",
      "de": "Eine Workflow-Trigger-Zustellung (dieses Plugin ist standardmäßig aus)",
      "fr": "Une livraison de déclencheur workflow (ce plugin est désactivé par défaut)",
      "it": "Una consegna di trigger workflow (questo plugin è spento di default)",
      "nl": "Eén workflow-triggerbezorging (deze plugin staat standaard uit)",
      "cs": "Jedno doručení workflow triggeru (tento plugin je ve výchozím stavu vypnutý)",
      "zh-Hans": "一次工作流触发下发（该插件默认关闭）",
      "zh-Hant": "一次工作流觸發下發（該插件預設關閉）",
      "es": "Una entrega de disparador de workflow (este plugin está apagado por defecto)",
      "pl": "Jedno dostarczenie wyzwalacza workflow (ta wtyczka jest domyślnie wyłączona)",
      "ja": "ワークフロートリガーの配信1回（このプラグインは既定でオフ）",
      "th": "การส่ง trigger ของ workflow หนึ่งครั้ง (ปลั๊กอินนี้ปิดอยู่โดยค่าเริ่มต้น)",
      "fi": "Yhden workflow-liipaisimen toimitus (tämä plugin on oletuksena pois päältä)",
      "uk": "Одна доставка тригера workflow (цей плагін типово вимкнено)",
      "bg": "Едно доставяне на workflow trigger (тази приставка е изключена по подразбиране)",
      "tr": "Bir workflow tetikleyici teslimi (bu eklenti varsayılan olarak kapalı)",
      "hu": "Egy workflow-trigger kiszállítása (ez a bővítmény alapból ki van kapcsolva)",
    },
  },
  {
    key: "POPOPX_CP_PER_CARDDAV_QUERY",
    value: "1",
    what: {
      en: "one CardDAV contact search (this plugin is off by default)",
      "ru": "Один поиск контактов CardDAV (этот плагин по умолчанию выключен)",
      "de": "Eine CardDAV-Kontaktsuche (dieses Plugin ist standardmäßig aus)",
      "fr": "Une recherche de contacts CardDAV (ce plugin est désactivé par défaut)",
      "it": "Una ricerca contatti CardDAV (questo plugin è spento di default)",
      "nl": "Eén CardDAV-contactzoekopdracht (deze plugin staat standaard uit)",
      "cs": "Jedno hledání kontaktů v CardDAV (tento plugin je ve výchozím stavu vypnutý)",
      "zh-Hans": "一次 CardDAV 通讯录检索（该插件默认关闭）",
      "zh-Hant": "一次 CardDAV 通訊錄檢索（該插件預設關閉）",
      "es": "Una búsqueda de contactos en CardDAV (este plugin está apagado por defecto)",
      "pl": "Jedno wyszukiwanie kontaktów CardDAV (ta wtyczka jest domyślnie wyłączona)",
      "ja": "CardDAV の連絡先検索1回（このプラグインは既定でオフ）",
      "th": "การค้นหาผู้ติดต่อ CardDAV หนึ่งครั้ง (ปลั๊กอินนี้ปิดอยู่โดยค่าเริ่มต้น)",
      "fi": "Yksi CardDAV-yhteystietohaku (tämä plugin on oletuksena pois päältä)",
      "uk": "Один пошук контактів CardDAV (цей плагін типово вимкнено)",
      "bg": "Едно търсене на контакти в CardDAV (тази приставка е изключена по подразбиране)",
      "tr": "Bir CardDAV kişi araması (bu eklenti varsayılan olarak kapalı)",
      "hu": "Egy CardDAV-névjegykeresés (ez a bővítmény alapból ki van kapcsolva)",
    },
  },
  {
    key: "POPOPX_CP_PER_CALDAV_QUERY",
    value: "1",
    what: {
      en: "one CalDAV free/busy query (this plugin is off by default)",
      "ru": "Один запрос занятости CalDAV (этот плагин по умолчанию выключен)",
      "de": "Eine CalDAV-Free/Busy-Abfrage (dieses Plugin ist standardmäßig aus)",
      "fr": "Une requête de disponibilité CalDAV (ce plugin est désactivé par défaut)",
      "it": "Una query di disponibilità CalDAV (questo plugin è spento di default)",
      "nl": "Eén CalDAV-free/busy-query (deze plugin staat standaard uit)",
      "cs": "Jeden dotaz na volnost v CalDAV (tento plugin je ve výchozím stavu vypnutý)",
      "zh-Hans": "一次 CalDAV 空闲查询（该插件默认关闭）",
      "zh-Hant": "一次 CalDAV 空閒查詢（該插件預設關閉）",
      "es": "Una consulta de disponibilidad en CalDAV (este plugin está apagado por defecto)",
      "pl": "Jedno zapytanie o dostępność w CalDAV (ta wtyczka jest domyślnie wyłączona)",
      "ja": "CalDAV の空き時間照会1回（このプラグインは既定でオフ）",
      "th": "การสอบถามเวลาว่าง CalDAV หนึ่งครั้ง (ปลั๊กอินนี้ปิดอยู่โดยค่าเริ่มต้น)",
      "fi": "Yksi CalDAV-vapaa/varattu-kysely (tämä plugin on oletuksena pois päältä)",
      "uk": "Один запит зайнятості CalDAV (цей плагін типово вимкнено)",
      "bg": "Една CalDAV заявка за свободно/заето (тази приставка е изключена по подразбиране)",
      "tr": "Bir CalDAV boş/dolu sorgusu (bu eklenti varsayılan olarak kapalı)",
      "hu": "Egy CalDAV szabad/foglalt lekérdezés (ez a bővítmény alapból ki van kapcsolva)",
    },
  },
  {
    key: "POPOPX_CP_PER_SLACK_DISCORD_EVENT",
    value: "1",
    what: {
      en: "one outbound Slack or Discord delivery (this plugin is off by default)",
      "ru": "Одна исходящая доставка в Slack или Discord (этот плагин по умолчанию выключен)",
      "de": "Eine ausgehende Slack- oder Discord-Zustellung (dieses Plugin ist standardmäßig aus)",
      "fr": "Une livraison sortante vers Slack ou Discord (ce plugin est désactivé par défaut)",
      "it": "Una consegna in uscita verso Slack o Discord (questo plugin è spento di default)",
      "nl": "Eén uitgaande Slack- of Discord-bezorging (deze plugin staat standaard uit)",
      "cs": "Jedno odchozí doručení do Slacku nebo Discordu (tento plugin je ve výchozím stavu vypnutý)",
      "zh-Hans": "一次 Slack / Discord 出站下发（该插件默认关闭）",
      "zh-Hant": "一次 Slack / Discord 出站下發（該插件預設關閉）",
      "es": "Una entrega saliente a Slack o Discord (este plugin está apagado por defecto)",
      "pl": "Jedno dostarczenie wychodzące do Slacka lub Discorda (ta wtyczka jest domyślnie wyłączona)",
      "ja": "Slack / Discord への外向き配信1回（このプラグインは既定でオフ）",
      "th": "การส่งออกไป Slack หรือ Discord หนึ่งครั้ง (ปลั๊กอินนี้ปิดอยู่โดยค่าเริ่มต้น)",
      "fi": "Yksi lähtevä Slack- tai Discord-toimitus (tämä plugin on oletuksena pois päältä)",
      "uk": "Одна вихідна доставка в Slack або Discord (цей плагін типово вимкнено)",
      "bg": "Едно изходящо доставяне към Slack или Discord (тази приставка е изключена по подразбиране)",
      "tr": "Bir giden Slack veya Discord teslimi (bu eklenti varsayılan olarak kapalı)",
      "hu": "Egy kimenő Slack- vagy Discord-kiszállítás (ez a bővítmény alapból ki van kapcsolva)",
    },
  },
];

type TimelineStep = {
  no: string;
  title: L;
  body: L;
  console: L;
  phone: L;
  snippet?: { code: string; caption: L };
  warn: L;
};

const TIMELINE: TimelineStep[] = [
  {
    no: "1",
    title: {
      en: "Mint the address, scan it, follow",
      "ru": "Выпустить адрес, отсканировать, подписаться",
      "de": "Adresse prägen, scannen, folgen",
      "fr": "Émettre l'adresse, scanner, suivre",
      "it": "Emetti l'indirizzo, scansiona, segui",
      "nl": "Adres slaan, scannen, volgen",
      "cs": "Vygenerovat adresu, naskenovat, sledovat",
      "zh-Hans": "生成与扫码关注",
      "zh-Hant": "產生與掃碼關注",
      "es": "Emitir la dirección, escanear, seguir",
      "pl": "Wygeneruj adres, zeskanuj, obserwuj",
      "ja": "アドレスを発行し、スキャンしてフォロー",
      "th": "สร้างแอด्रेस สแกน แล้วติดตาม",
      "fi": "Lyö osoite, skannaa, seuraa",
      "uk": "Випустити адресу, сканувати, підписатися",
      "bg": "Отсечете адрес, сканирайте, последвайте",
      "tr": "Adresi üret, tara, takibe al",
      "hu": "Kibocsátja a címet, beolvassa, követi",
    },
    body: {
      en: "The identity block of the Service account & node panel mints an opaque invite link: POST /api/v1/invite-links returns https://popopx.chat/i/v1/<code> plus a qr_svg, and the console shows the link with a copy button and a 生成二维码 button that renders the QR image in place. The raw protocol address — the popopx:/… URI that carries the relay domain — is not on the card; it sits under 高级诊断 for operator debugging, and the console says so. On iOS the add-contact screen routes the scanner, the clipboard and the paste field through one address classifier, so the link can be scanned or pasted.",
      "ru": "Блок идентификации панели Service account & node выпускает непрозрачную ссылку-приглашение: POST /api/v1/invite-links возвращает https://popopx.chat/i/v1/<code> и qr_svg, а консоль показывает ссылку с кнопкой копирования и кнопкой 生成二维码, которая рисует QR прямо на месте. Сырой протокольный адрес — URI popopx:/…, несущий домен релея, — на карточке не показывается; он лежит под 高级诊断 для отладки оператором, и консоль так и пишет. В iOS на экране добавления контакта сканер, буфер обмена и поле вставки проходят через один классификатор адресов, поэтому ссылку можно и отсканировать, и вставить.",
      "de": "Der Identitätsblock des Panels Service account & node prägt einen undurchsichtigen Einladungslink: POST /api/v1/invite-links liefert https://popopx.chat/i/v1/<code> plus ein qr_svg, und die Konsole zeigt den Link mit einer Kopieren-Schaltfläche und einer 生成二维码-Schaltfläche, die das QR-Bild direkt an Ort und Stelle zeichnet. Die rohe Protokolladresse — die popopx:/…-URI, die die Relay-Domain trägt — steht nicht auf der Karte; sie liegt unter 高级诊断 für die Fehlersuche des Betreibers, und die Konsole sagt das auch. Auf iOS leitet der Kontakt-Hinzufügen-Bildschirm Scanner, Zwischenablage und Einfügefeld durch dieselbe Adressklassifizierung, sodass sich der Link scannen oder einfügen lässt.",
      "fr": "Le bloc d'identité du panneau Service account & node frappe un lien d'invitation opaque : POST /api/v1/invite-links renvoie https://popopx.chat/i/v1/<code> et un qr_svg, et la console affiche le lien avec un bouton copier et un bouton 生成二维码 qui dessine l'image QR sur place. L'adresse de protocole brute — l'URI popopx:/… qui porte le domaine du relais — n'est pas sur la carte ; elle se trouve sous 高级诊断 pour le débogage de l'opérateur, et la console le dit. Sur iOS, l'écran d'ajout de contact fait passer le scanner, le presse-papiers et le champ de collage par un seul classifieur d'adresses, donc le lien peut être scanné ou collé.",
      "it": "Il blocco identità del pannello Service account & node conia un link d'invito opaco: POST /api/v1/invite-links restituisce https://popopx.chat/i/v1/<code> più un qr_svg, e la console mostra il link con un pulsante copia e un pulsante 生成二维码 che disegna l'immagine QR sul posto. L'indirizzo di protocollo grezzo — l'URI popopx:/… che porta il dominio del relay — non è sulla scheda; sta sotto 高级诊断 per il debug dell'operatore, e la console lo dice. Su iOS la schermata di aggiunta contatto fa passare scanner, appunti e campo di incolla attraverso un unico classificatore di indirizzi, quindi il link si può scansionare o incollare.",
      "nl": "Het identiteitsblok van het paneel Service account & node slaat een ondoorzichtige uitnodigingslink: POST /api/v1/invite-links retourneert https://popopx.chat/i/v1/<code> plus een qr_svg, en de console toont de link met een kopieerknop en een 生成二维码-knop die het QR-beeld ter plaatse tekent. Het ruwe protocoladres — de popopx:/…-URI die het relatiedomein draagt — staat niet op de kaart; het zit onder 高级诊断 voor foutopsporing door de operator, en de console zegt dat ook. Op iOS stuurt het scherm contact toevoegen de scanner, het klembord en het plakveld door dezelfde addressclassifier, dus de link kan gescand of geplakt worden.",
      "cs": "Identitní blok panelu Service account & node razí neprůhledný zvací odkaz: POST /api/v1/invite-links vrací https://popopx.chat/i/v1/<code> a qr_svg, a konzole ukazuje odkaz s tlačítkem kopírovat a tlačítkem 生成二维码, které QR obrázek vykreslí přímo na místě. Surová protokolová adresa — URI popopx:/… nesoucí doménu relaye — na kartě není; leží pod 高级诊断 pro ladění operátorem, a konzole to říká. Na iOS vede obrazovka přidání kontaktu skener, schránku i pole pro vložení přes jednu klasifikaci adres, takže odkaz jde naskenovat nebo vložit.",
      "zh-Hans": "后台「服务号与节点」的身份区会签发不透明邀请链接：POST /api/v1/invite-links 返回 https://popopx.chat/i/v1/<code> 以及 qr_svg，后台把链接连同复制按钮、以及当场渲染二维码的「生成二维码」按钮一起展示。原始协议地址——带中继域名的 popopx:/… URI——不在卡片上；它收在「高级诊断」里供运维排查，后台也明说了这一点。iOS 客户端的添加联系人页里，扫码框、剪贴板和粘贴输入框走同一套地址分类，所以这串链接可以直接扫，也可以直接粘。",
      "zh-Hant": "後臺「服務號與節點」的身分區會簽發不透明邀請連結：POST /api/v1/invite-links 回傳 https://popopx.chat/i/v1/<code> 以及 qr_svg，後臺把連結連同複製按鈕、以及當場繪製二維碼的「生成二維碼」按鈕一起展示。原始協議位址——帶中繼域名的 popopx:/… URI——不在卡片上；它收在「高級診斷」裡供維運排查，後臺也明說了這一點。iOS 用戶端的新增聯絡人頁裡，掃描框、剪貼簿和貼上輸入框走同一套位址分類，所以這串連結可以直接掃，也可以直接貼。",
      "es": "El bloque de identidad del panel Service account & node acuña un enlace de invitación opaco: POST /api/v1/invite-links devuelve https://popopx.chat/i/v1/<code> más un qr_svg, y la consola muestra el enlace con un botón copiar y un botón 生成二维码 que dibuja la imagen QR en el sitio. La dirección de protocolo cruda — la URI popopx:/… que lleva el dominio del relay — no está en la tarjeta; vive bajo 高级诊断 para la depuración del operador, y la consola lo dice. En iOS la pantalla de añadir contacto pasa el escáner, el portapapeles y el campo de pegado por un mismo clasificador de direcciones, así que el enlace se puede escanear o pegar.",
      "pl": "Blok tożsamości panelu Service account & node wybija nieprzejrzysty link zaproszenia: POST /api/v1/invite-links zwraca https://popopx.chat/i/v1/<code> oraz qr_svg, a konsola pokazuje link z przyciskiem kopiowania i przyciskiem 生成二维码, który rysuje obraz QR na miejscu. Surowy adres protokołu — URI popopx:/… niosący domenę relay — nie jest na karcie; leży pod 高级诊断 do diagnostyki operatora, i konsola to mówi. W iOS ekran dodawania kontaktu prowadzi skaner, schowek i pole wklejania przez tę samą klasyfikację adresów, więc link można zeskanować albo wkleić.",
      "ja": "Service account & node パネルのアイデンティティブロックは、中身を隠した招待リンクを発行します。POST /api/v1/invite-links は https://popopx.chat/i/v1/<code> と qr_svg を返し、コンソールはリンクをコピーボタンと、その場で QR 画像を描く 生成二维码 ボタンと一緒に表示します。生のプロトコルアドレス — リレーのドメインを含む popopx:/… URI — はカードには出ません。運用者の切り分け用に 高级诊断 の下に置かれ、コンソールもそう明記しています。iOS 側の追加連絡先画面では、スキャナもクリップボードも貼り付け入力も同じアドレス判定を通るため、このリンクはスキャンしても貼り付けても使えます。",
      "th": "บล็อก identity ในแผง Service account & node จะออกลิงก์เชิญแบบ opaque: POST /api/v1/invite-links คืน https://popopx.chat/i/v1/<code> พร้อม qr_svg และคอนโซลแสดงลิงก์พร้อมปุ่ม copy และปุ่ม 生成二维码 ที่วาดรูป QR ตรงนั้นเลย ที่อยู่โปรโตคอลดิบ — URI popopx:/… ที่มีโดเมนรีเลย์อยู่ — ไม่ได้อยู่บนการ์ด แต่ซ่อนไว้ใต้ 高级诊断 สำหรับให้ผู้ดูแลตรวจสอบ และคอนโซลก็บอกไว้อย่างนั้น บน iOS หน้า add contact ให้ สแกนเนอร์,คลิปบอร์ด และช่องวาง ผ่านตัวจำแนก แอดเดรส ตัวเดียวกัน จึงสแกนหรือวางลิงก์นี้ก็ได้",
      "fi": "Service account & node -paneelin identiteettilohko lyö läpinäkymättömän kutsulinkin: POST /api/v1/invite-links palauttaa https://popopx.chat/i/v1/<code> sekä qr_svg:n, ja konsoli näyttää linkin kopiointipainin ja 生成二维码-painin kanssa, joka piirtää QR-kuvan paikan päälle. Raaka protokollaosoite — popopx:/…-URI, joka kantaa relayn verkkotunnuksen — ei ole kortissa; se on 高级诊断-osion alla ylläpitäjän vianetsintää varten, ja konsoli kertoo sen. iOS:n lisäysnäyttö ohjaa skannerin, leikepöydän ja liittämiskentän saman osoiteluokittelijan läpi, joten linkin voi skannata tai liimata.",
      "uk": "Блок ідентичності панелі Service account & node карбує непрозоре посилання-запрошення: POST /api/v1/invite-links повертає https://popopx.chat/i/v1/<code> і qr_svg, а консоль показує посилання з кнопкою копіювання та кнопкою 生成二维码, яка малює QR-зображення одразу на місці. Сира протокольна адреса — URI popopx:/…, що несе домен релея, — на картці не показується; вона лежить під 高级诊断 для діагностики оператором, і консоль це прямо каже. В iOS екран додавання контакту веде сканер, буфер обміну та поле вставки через один класифікатор адрес, тому посилання можна і сканувати, і вставити.",
      "bg": "Идентификационният блок в панела Service account & node издава непрозрачна връзка за покана: POST /api/v1/invite-links връща https://popopx.chat/i/v1/<code> плюс qr_svg, а конзолата показва връзката с бутон за копиране и бутон 生成二维码, който рисува QR изображението направо там. Суровият протоколен адрес — URI popopx:/…, който носи домейна на релея — не е на картата; той стои под 高级诊断 за диагностика от оператора, и конзолата го казва. При iOS екранът за добавяне на контакт минава скенера, клипборда и полето за поставяне през един класификатор на адреси, така че връзката може да се сканира или постави.",
      "tr": "Service account & node panelinin kimlik bloğu opak bir davet bağlantısı üretir: POST /api/v1/invite-links, https://popopx.chat/i/v1/<code> ve bir qr_svg döndürür; konsol bağlantıyı kopyalama düğmesi ve QR görüntüsünü yerinde çizen 生成二维码 düğmesiyle gösterir. Ham protokol adresi — relay alan adını taşıyan popopx:/… URI'si — kartta değildir; operatör teşhisi için 高级诊断 altında durur ve konsol bunu açıkça söyler. iOS'ta kişi ekleme ekranı tarayıcıyı, panoyu ve yapıştırma alanını aynı adres sınıflandırıcısından geçirir; bu yüzden bağlantı taranabilir ya da yapıştırılabilir.",
      "hu": "A Service account & node panel azonosítási blokkja átlátszatlan meghívólinket bocsát ki: a POST /api/v1/invite-links https://popopx.chat/i/v1/<code> és egy qr_svg választ ad, a konzol pedig a linket másolás gombbal és a QR képet helyben kirajzoló 生成二维码 gombbal mutatja. A nyers protokollcím — a relay domaint hordozó popopx:/… URI — nincs a kártyán; a 高级诊断 alatt van az üzemeltetői hibakereséshez, és a konzol ezt ki is mondja. iOS-en a névjegy-hozzáadás képernyője a beolvasót, a vágólapot és a beillesztés mezőt ugyanazon a címosztályozón vezeti át, ezért a link beolvasható vagy bemásolható.",
    },
    console: {
      en: "Service account & node → Service identity → Request/reuse address. The same block rotates it: existing contacts are kept, new users can no longer add the old address.",
      "ru": "Service account & node → Service identity → Request/reuse address. Тот же блок может его ротировать: существующие контакты сохраняются, а новые пользователи больше не смогут добавить старый адрес.",
      "de": "Service account & node → Service identity → Request/reuse address. Derselbe Block rotiert sie: bestehende Kontakte bleiben, neue Nutzer können die alte Adresse nicht mehr hinzufügen.",
      "fr": "Service account & node → Service identity → Request/reuse address. Le même bloc la fait tourner : les contacts existants restent, les nouveaux utilisateurs ne peuvent plus ajouter l'ancienne adresse.",
      "it": "Service account & node → Service identity → Request/reuse address. Lo stesso blocco lo ruota: i contatti esistenti restano, i nuovi utenti non possono più aggiungere il vecchio indirizzo.",
      "nl": "Service account & node → Service identity → Request/reuse address. Hetzelfde blok roteert hem: bestaande contacten blijven, nieuwe gebruikers kunnen het oude adres niet meer toevoegen.",
      "cs": "Service account & node → Service identity → Request/reuse address. Ten sam blok ji rotuje: stávající kontakty zůstanou, noví uživatelé už starou adresu nepřidají.",
      "zh-Hans": "服务号与节点 → 服务号身份 → 申请/复用地址；要换新地址，同处还有「轮换地址」（旧联系人保留，新用户不能再按旧地址添加）。",
      "zh-Hant": "服務號與節點 → 服務號身分 → 申請/復用位址；要換新位址，同處還有「輪換位址」（舊聯絡人保留，新用戶不能再按舊位址新增）。",
      "es": "Service account & node → Service identity → Request/reuse address. El mismo bloque lo rota: los contactos existentes se conservan, los usuarios nuevos ya no pueden añadir la dirección vieja.",
      "pl": "Service account & node → Service identity → Request/reuse address. Ten sam blok go rotuje: istniejące kontakty zostają, a nowi użytkownicy nie dodadzą już starego adresu.",
      "ja": "Service account & node → Service identity → Request/reuse address。同じブロックでローテーションできます。既存の連絡先は残り、新規ユーザーは古いアドレスを追加できなくなります。",
      "th": "Service account & node → Service identity → Request/reuse address บล็อกเดียวกันนี้หมุนเวียนมันได้ ผู้ติดต่อดเดิมยังคงอยู่ แต่ผู้ใช้ใหม่จะเพิ่ม แอดเดรส เก่าไม่ได้อีก",
      "fi": "Service account & node → Service identity → Request/reuse address. Sama lohko kierrättää sen: olemassa olevat yhteystiedot säilyvät, uudet käyttäjät eivät voi enää lisätä vanhaa osoitetta.",
      "uk": "Service account & node → Service identity → Request/reuse address. Той самий блок може його повернути: наявні контакти зберігаються, а нові користувачі вже не зможуть додати стару адресу.",
      "bg": "Service account & node → Service identity → Request/reuse address. Същият блок го ротира: съществуващите контакти се запазват, а нови потребители вече не могат да добавят стария адрес.",
      "tr": "Service account & node → Service identity → Request/reuse address. Aynı blok onu döndürür: var olan kişiler kalır, yeni kullanıcılar eski adresi artık ekleyemez.",
      "hu": "Service account & node → Service identity → Request/reuse address. Ugyanaz a blokk rotálja: a meglévő néjegyek megmaradnak, új felhasználók a régi címet már nem adhatják hozzá.",
    },
    phone: {
      en: "Scan it, or paste the invite link into add-contact; the string is an opaque https://popopx.chat/i/v1/<code> link that unwraps to the contact address on the phone — which is why it is copied rather than typed.",
      "ru": "Отсканируйте его или вставьте ссылку-приглашение в добавление контакта; это непрозрачная ссылка https://popopx.chat/i/v1/<code>, которая на телефоне разворачивается в контактный адрес — поэтому её копируют, а не печатают.",
      "de": "Scannen Sie ihn oder fügen Sie den Einladungslink in Kontakt hinzufügen ein; die Kette ist ein undurchsichtiger Link https://popopx.chat/i/v1/<code>, der auf dem Telefon zur Kontaktadresse entpackt wird — deshalb kopiert man ihn, statt ihn zu tippen.",
      "fr": "Scannez-le ou collez le lien d'invitation dans l'ajout de contact ; la chaîne est un lien opaque https://popopx.chat/i/v1/<code> qui se déplie sur le téléphone en l'adresse du contact — c'est pourquoi on le copie plutôt qu'on le recopie.",
      "it": "Scansionatelo o incollate il link d'invito nella schermata aggiungi contatto; la stringa è un link opaco https://popopx.chat/i/v1/<code> che sul telefono si apre nell'indirizzo del contatto — per questo lo si copia invece di digitarlo.",
      "nl": "Scan hem of plak de uitnodigingslink in contact toevoegen; de tekenreeks is een ondoorzichtige link https://popopx.chat/i/v1/<code> die op de telefoon uiteenvalt tot het contactadres — daarom kopieer je hem in plaats van te typen.",
      "cs": "Naskenujte ho nebo vložte zvací odkaz do přidání kontaktu; řádek je neprůhledný odkaz https://popopx.chat/i/v1/<code>, který se na telefonu rozbalí na adresu kontaktu — proto se kopíruje, místo aby se přepisoval.",
      "zh-Hans": "扫一扫，或把邀请链接粘进添加联系人；那一串是形如 https://popopx.chat/i/v1/<code> 的不透明链接，在手机上会解封成联系人地址——所以它靠复制，而不是手打。",
      "zh-Hant": "掃一掃，或把邀請連結貼進新增聯絡人；那一串是形如 https://popopx.chat/i/v1/<code> 的不透明連結，在手機上會解封成聯絡人位址——所以它靠複製，而不是手打。",
      "es": "Escanéelo o pegue el enlace de invitación en añadir contacto; la cadena es un enlace opaco https://popopx.chat/i/v1/<code> que en el teléfono se despliega en la dirección del contacto — por eso se copia en lugar de teclearse.",
      "pl": "Zeskanuj go albo wklej link zaproszenia w dodawaniu kontaktu; ciąg to nieprzejrzysty link https://popopx.chat/i/v1/<code>, który na telefonie rozwija się w adres kontaktu — dlatego się go kopiuje, a nie przepisuje.",
      "ja": "スキャンするか、招待リンクを追加連絡先画面に貼り付けてください。この文字列は https://popopx.chat/i/v1/<code> という中身を隠したリンクで、スマートフォン上で連絡先アドレスに展開されます。だからこそ手入力ではなくコピーで扱います。",
      "th": "สแกนมัน หรือวางลิงก์เชิญลงในหน้า add contact ก็ได้ — string นี้คือลิงก์ opaque รูปแบบ https://popopx.chat/i/v1/<code> ที่จะคลี่ออกเป็นที่อยู่ contact บนมือถือ จึงต้องใช้ copy ไม่ใช่พิมพ์เอง",
      "fi": "Skannaa se tai liimaa kutsulinkki lisäysruutuun; merkkijono on läpinäkymätön linkki https://popopx.chat/i/v1/<code>, joka avautuu puhelimessa yhteystiedon osoitteeksi — siksi se kopioidaan eikä kirjoiteta.",
      "uk": "Відскануйте його або вставте посилання-запрошення в додаванні контакту; рядок — це непрозоре посилання https://popopx.chat/i/v1/<code>, яке на телефоні розгортається в контактну адресу — тому його копіюють, а не переписують.",
      "bg": "Сканирайте го или поставете връзката за покана в добавяне на контакт; низът е непрозрачна връзка https://popopx.chat/i/v1/<code>, която на телефона се разгъва до адреса на контакта — затова се копира, а не се надписва.",
      "tr": "Tarayın ya da davet bağlantısını kişi eklemeye yapıştırın; dizi, telefonda kontakt adresine açılan opak bir https://popopx.chat/i/v1/<code> bağlantısıdır — bu yüzden elle yazmak yerine kopyalanır.",
      "hu": "Olvassa be, vagy illessze be a meghívólinket a névjegy-hozzáadás képernyőn; a karakterlánc egy átlátszatlan https://popopx.chat/i/v1/<code> link, amely a telefonon a névjegy címévé bomlik ki — ezért másolják, nem írják le.",
    },
    snippet: {
      code: CMD.frames,
      caption: {
        en: "The moment the request is accepted the gateway mints this follower's session and pushes session_handshake: the pairwise uid, a 64-hex-character session secret and the service id, all three inside the frame. The handshake is not metered — no meter covers it — and the order is forced by the protocol: the frame is a message to a contact, and until the request is accepted there is no contact.",
        "ru": "Как только запрос принят, шлюз тут же выпускает сессию этого подписчика и пушит session_handshake: pairwise uid, 64-символьный hex секрет сессии и service id — все три поля внутри кадра. Сам handshake не тарифицируется — ни один счётчик его не покрывает, — а порядок навязан протоколом: кадр есть сообщение контакту, а до принятия запроса контакта ещё нет.",
        "de": "In dem Augenblick, in dem die Anfrage angenommen wird, prägt das Gateway die Sitzung dieses Anhängers und schiebt session_handshake: die pairwise uid, ein 64-Zeichen-hex-Sitzungsgeheimnis und die service id, alle drei im Frame. Der Handshake selbst ist nicht gemessen — kein Zähler deckt ihn ab —, und die Reihenfolge erzwingt das Protokoll: der Frame ist eine Nachricht an einen Kontakt, und vor der Annahme gibt es noch keinen Kontakt.",
        "fr": "Dès que la requête est acceptée, la passerelle fabrique la session de cet abonné et pousse session_handshake : le pairwise uid, un secret de session en hex à 64 caractères et le service id, les trois champs dans la trame. Le handshake n'est pas facturé — aucun compteur ne le couvre — et l'ordre est imposé par le protocole : la trame est un message à un contact, et tant que la requête n'est pas acceptée il n'y a pas de contact.",
        "it": "Nell'istante in cui la richiesta viene accettata, il gateway conia la sessione di questo follower e spinge session_handshake: il pairwise uid, un segreto di sessione hex a 64 caratteri e il service id, tutti e tre dentro il frame. L'handshake non è misurato — nessun contatore lo copre — e l'ordine è imposto dal protocollo: il frame è un messaggio a un contatto, e finché la richiesta non è accettata un contatto non esiste.",
        "nl": "Op het moment dat het verzoek wordt geaccepteerd, slaat de gateway de sessie van deze volger uit en pusht session_handshake: de pairwise uid, een 64-tekens hex sessiegeheim en de service id, alle drie in het frame. De handshake zelf wordt niet gemeten — geen meter dekt hem af — en de volgorde wordt door het protocol afgedwongen: het frame is een bericht aan een contact, en vóór de acceptatie is er nog geen contact.",
        "cs": "V okamžiku, kdy je požadavek přijat, brána vygeneruje relaci tohoto odběratele a pošle session_handshake: pairwise uid, 64místný hex sekret relace a service id, vše uvnitř frame. Handshake se neměří — žádný měrič ho nepokrývá — a pořadí vynutí protokol: frame je zpráva kontaktovi, a dokud není požadavek přijat, žádný kontakt neexistuje.",
        "zh-Hans": "申请一被接受，网关紧接着就替这个粉丝建会话并推 session_handshake：pairwise uid、64 个十六进制字符的会话密钥、服务号 id，三个字段都在帧里。这一步不计量——计量表里没有 handshake 这一项；顺序也是协议定的：帧是给联系人的消息，接受之前根本没有联系人。",
        "zh-Hant": "申請一被接受，閘道緊接著就替這個粉絲建工作階段並推 session_handshake：pairwise uid、64 個十六進位字元的工作階段金鑰、服務號 id，三個欄位都在幀裡。這一步不計量——計量表裡沒有 handshake 這一項；順序也是協議定的：幀是給聯絡人的訊息，接受之前根本沒有聯絡人。",
        "es": "En el momento en que la solicitud se acepta, la pasarela acuña la sesión de este seguidor y envía session_handshake: el pairwise uid, un secreto de sesión hex de 64 caracteres y el service id, los tres dentro del frame. El handshake no está medido — ningún medidor lo cubre — y el orden lo impone el protocolo: el frame es un mensaje a un contacto, y hasta que la solicitud se acepta no hay contacto.",
        "pl": "W chwili przyjęcia prośby brama wybija sesję tego odbiorcy i wypycha session_handshake: pairwise uid, 64-znakowy hex sekret sesji i service id, wszystkie trzy w ramce. Sam handshake nie jest naliczany — żaden licznik go nie obejmuje — a kolejność narzuca protokół: ramka to wiadomość do kontaktu, a dopóki prośba nie jest przyjęta, kontaktu jeszcze nie ma.",
        "ja": "リクエストが承認された瞬間に、ゲートウェイはこのフォロワーのセッションを発行し、session_handshake をプッシュします。frame の中には pairwise uid、16進64文字のセッションシークレット、service id の3つのフィールドがすべて入っています。handshake 自体は課金対象ではありません。どの計量キーも handshake をカバーしていないからです。そして順序もプロトコルに決められています。frame は連絡先へのメッセージであり、承認が終わるまで連絡先そのものが存在しません。",
        "th": "ทันทีที่คำขอถูกยอมรับ gateway จะออก session ของ follower คนนี้แล้ว push session_handshake ไปเลย ใน frame มีครบสาม field คือ pairwise uid, session secret แบบ hex ยาว 64 ตัวอักษร และ service id ขั้นตอนนี้ไม่ถูกคิดเครดิต เพราะไม่มี meter ใดครอบคลุม และลำดับก็ถูกบังคับโดย protocol ด้วย: frame คือข้อความหา contact ซึ่งก่อนจะยอมรับยังไม่มี contact ให้ส่งเลย",
        "fi": "Sillä hetkellä kun pyyntö hyväksytään, gateway luo tämän seuraajan session ja työntää session_handshake: pairwise uid, 64-merkkinen hex-sessiosalaisuus ja service id, kaikki kolme kehyksen sisällä. Handshakea ei mitata — yksikään metari ei kata sitä — ja järjestyksen pakottaa protokolla: kehys on viesti yhteystiedolle, ja ennen hyväksyntää yhteystietoa ei vielä ole.",
        "uk": "Щойно запит прийнято, шлюз одразу випускає сесію цього підписника й надсилає session_handshake: pairwise uid, 64-символьний hex секрет сесії та service id — усі три поля в межах кадра. Сам handshake не тарифікується — жоден лічильник його не покриває, — а порядок нав'язаний протоколом: кадр є повідомленням контакту, а до прийняття запиту контакту ще немає.",
        "bg": "В мига, в който заявката се приеме, шлюзът издава сесията на този последовател и изпраща session_handshake: pairwise uid, 64-символен hex сесиен секрет и service id, и трите полета в кадъра. Handshake-ът не се мери — нито един метър не го покрива — и редът се налага от протокола: кадърът е съобщение към контакт, а преди приемането на заявката контакт още няма.",
        "tr": "İstek kabul edildiği anda ağ geçidi bu takipçinin oturumunu üretir ve session_handshake gönderir: pairwise uid, 64 karakterlik hex oturum sırrı ve service id — üçü de karenin içindedir. Handshake ücretlendirilmez; hiçbir sayaç onu kapsamaz. Sıra da protokol tarafından dayatılır: kare bir kişiye mesajdır ve istek kabul edilene kadar ortada kişi yoktur.",
        "hu": "Abban a pillanatban, ahogy a kérelmet elfogadják, az átjáró kiadja ennek a követőnek a munkamenetét, és elküldi a session_handshake-et: pairwise uid, egy 64 karakteres hex munkamenet-titok és a service id, mind a három a keretben. Maga a handshake nem meterelt — egyetlen meter sem fedi le —, a sorrendet pedig a protokoll kényszeríti ki: a keret üzenet egy névjegynek, és az elfogadás előtt még nincs is névjegy.",
      },
    },
    warn: {
      en: "Turn gateway.auto_accept off in Settings and each new request waits in the Accept contact requests block of Service account & node, whose own subtitle reads that a service account does not auto-approve, while the settings block adds that requests must then be accepted one by one there. Nothing reaches the phone until one is approved.",
      "ru": "Если в Settings выключен gateway.auto_accept, каждый новый запрос по одному ждёт одобрения в панели Service account & node, а сам блок так и озаглавлен: сервисный аккаунт не одобряет автоматически. Пока не одобрено — телефон не получает ничего.",
      "de": "Ist gateway.auto_accept in Settings ausgeschaltet, wartet jede neue Anfrage einzeln auf die Freigabe im Panel Service account & node, dessen Blocküberschrift es selbst sagt: ein Service-Account genehmigt nicht automatisch. Solange nichts freigegeben ist, bekommt das Telefon nichts.",
      "fr": "Avec gateway.auto_accept désactivé dans Settings, chaque nouvelle requête attend d'être approuvée une par une dans le panneau Service account & node, dont le bloc est intitulé de façon à dire : un compte-service n'approuve pas tout seul. Tant que ce n'est pas approuvé, le téléphone ne reçoit rien.",
      "it": "Con gateway.auto_accept spento in Settings, ogni nuova richiesta aspetta di essere approvata una per una nel pannello Service account & node, il cui blocco è intitolato in modo che dica: un account servizio non approva automaticamente. Finché non è approvato, il telefono non riceve nulla.",
      "nl": "Met gateway.auto_accept uit in Settings wacht elk nieuw verzoek één voor één op goedkeuring in het paneel Service account & node, waarvan het blok zo getiteld is dat het zegt: een serviceaccount keurt niet automatisch goed. Zolang er niets goedgekeurd is, krijgt de telefoon niets.",
      "cs": "S vypnutým gateway.auto_accept v Settings si každý nový požadavek počká na schválení jeden po druhém v panelu Service account & node, jehož blok je nadepsaný tak, aby to řeklo: service účet neschvaluje automaticky. Dokud není schváleno, telefon nedostane nic.",
      "zh-Hans": "「设置」里的 gateway.auto_accept 关掉时，新申请要在「服务号与节点」的「接受联系人申请」区逐条通过，那一区的副标题就写着「服务号不会自动通过；打开自动接受可省去这一步」，设置区那边补了一句「关闭后新申请需要在「服务号与节点」里逐条接受」；没通过之前手机什么都收不到。",
      "zh-Hant": "「設定」裡的 gateway.auto_accept 關掉時，新申請要在「服務號與節點」的「接受聯絡人申請」區逐條通過，那一區的副標題就寫著「服務號不會自動通過；打開自動接受可省去這一步」，設定區那邊補了一句「關閉後新申請需要在「服務號與節點」裡逐條接受」；沒通過之前手機什麼都收不到。",
      "es": "Con gateway.auto_accept apagado en Settings, cada nueva solicitud espera a ser aprobada una a una en el panel Service account & node, cuyo bloque está titulado de forma que dice: una cuenta de servicio no aprueba automáticamente. Mientras no se apruebe, el teléfono no recibe nada.",
      "pl": "Przy wyłączonym gateway.auto_accept w Settings każda nowa prośba czeka na zatwierdzenie pojedynczo w panelu Service account & node, a sam blok ma tytuł mówiący wprost: konto serwisowe nie zatwierdza automatycznie. Dopóki nic nie zatwierdzono, telefon nic nie dostaje.",
      "ja": "Settings で gateway.auto_accept をオフにすると、新しいリクエストは Service account & node パネルで1件ずつ承認待ちになります。あのブロックのタイトル自体が「サービスアカウントは自動承認しない」と書いてあり、設定側の説明も「オフにすると新しい申請は Service account & node で1件ずつ承認が必要です」と補足しています。承認されるまで、スマホには何も届きません。",
      "th": "ถ้าปิด gateway.auto_accept ใน Settings ทุกคำขอใหม่จะรอให้กดอนุมัติทีละรายการในแผง Service account & node ซึ่งชื่อบล็อกก็เขียนไว้ตรงตัวว่าบัญชีบริการไม่อนุมัติเอง และฝั่ง settings ยังบอกเพิ่มว่าปิดแล้วต้องไปอนุมัติทีละรายการในที่นั้น ก่อนอนุมัติ โทรศัพท์จะไม่มีทางได้รับอะไรเลย",
      "fi": "Kun gateway.auto_accept on pois päältä asetuksissa, jokainen uusi pyyntö odottaa hyväksyntää yksitellen Service account & node -paneelissa, jonka lohko on nimetty niin että se sanoo: palvelutili ei hyväksy automaattisesti. Ellei mitään ole hyväksytty, puhelin ei saa mitään.",
      "uk": "Якщо в Settings вимкнено gateway.auto_accept, кожен новий запит чекає на схвалення по одному на панелі Service account & node, а сам блок озаглавлений так, що й каже: сервісний акаунт не схвалює автоматично. Докі нічого не схвалено, телефон нічого не отримує.",
      "bg": "Като gateway.auto_accept е изключен в Settings, всяка нова заявка чака да бъде одобрена по една в панела Service account & node, чийто блок е озаглавен точно така: сервисен акаунт не одобрява автоматично. Докато нищо не е одобрено, телефонът не получава нищо.",
      "tr": "Ayarlar içinde gateway.auto_accept kapalıysa her yeni istek, Service account & node panelinde tek tek onay bekler; o blokta zaten yazar: hizmet hesabı otomatik onaylamaz. Onay gelene kadar telefona hiçbir şey ulaşmaz.",
      "hu": "Ha a Settingsben a gateway.auto_accept ki van kapcsolva, minden új kérelem egyenként jóváhagyásra vár a Service account & node panelen, amelynek blokkja úgy van feliratozva, hogy mondja: a szolgáltatási fiók nem hagyja jóvá magától. Amíg nincs jóváhagyva, a telefon semmit nem kap.",
    },
  },
  {
    no: "2",
    title: {
      en: "Build the bottom menu, deliver a card",
      "ru": "Собрать нижнее меню и доставить карточку",
      "de": "Unteres Menü bauen und eine Karte zustellen",
      "fr": "Construire le menu bas et livrer une carte",
      "it": "Costruisci il menu in basso e consegna una card",
      "nl": "Het ondermenu bouwen en een kaart bezorgen",
      "cs": "Sestavit spodní menu a dodat kartu",
      "zh-Hans": "配置底部菜单与下发卡片",
      "zh-Hant": "設定底部選單與下發卡片",
      "es": "Montar el menú inferior y entregar una tarjeta",
      "pl": "Zbuduj menu na dole i dostarcz kartę",
      "ja": "下部メニューを作り、カードを配信する",
      "th": "สร้างเมนูแถบล่างและส่งการ์ด",
      "fi": "Rakenna alavalikko ja toimita kortti",
      "uk": "Зібрати нижнє меню та доставити картку",
      "bg": "Сглобете долното меню и достави карта",
      "tr": "Alt menüyü kurun ve bir kart teslim edin",
      "hu": "Építse fel az alsó menüt, és küldjön egy kártyát",
    },
    body: {
      en: "The Menu orchestration editor holds up to 3 top-level items with 5 sub-items each; edits stay in the page until you save, and saving writes to the gateway as a new revision. The panel's client-rule check is built from the same rules as the server's build_menu, so a frame that would be rejected never leaves. In Card delivery pick the style first — standard, receipt for bills, security for alerts — with up to 8 fields and 4 buttons, preview the request body, then send.",
      "ru": "Редактор Menu orchestration держит до 3 пунктов верхнего уровня по 5 подпунктов; правки живут на странице до сохранения, а сохранение уходит в шлюз новой ревизией. Проверка клиентских правил в этом панели собрана из тех же правил, что и серверный build_menu, поэтому кадр, который был бы отвергнут, никогда не уходит. В Card delivery сначала выбирайте стиль — standard, receipt для счетов, security для алертов — до 8 полей и 4 кнопок, затем просмотрите тело запроса и отправьте.",
      "de": "Der Editor von Menu orchestration hält bis zu 3 Top-Level-Punkte mit je 5 Unterpunkten; Änderungen bleiben auf der Seite, bis Sie speichern, und Speichern schreibt als neue Revision ins Gateway. Die Client-Regelprüfung in diesem Panel baut auf denselben Regeln wie serverseitig build_menu, darum verlässt ein Frame, der abgewiesen würde, nie das Haus. Wählen Sie in Card delivery zuerst den Stil — standard, receipt für Rechnungen, security für Alarme — mit bis zu 8 Feldern und 4 Buttons, prüfen Sie den Request-Body und senden Sie dann.",
      "fr": "L'éditeur de Menu orchestration tient jusqu'à 3 entrées de premier niveau avec 5 sous-entrées chacune ; les modifications restent dans la page tant que vous n'avez pas sauvegardé, et sauvegarder écrit dans la passerelle comme une nouvelle révision. Le contrôle des règles client du panneau se construit sur les mêmes règles que le build_menu du serveur, donc une trame qui serait rejetée ne part jamais. Dans Card delivery, choisissez d'abord le style — standard, receipt pour les factures, security pour les alertes — avec jusqu'à 8 champs et 4 boutons, prévisualisez le corps de la requête, puis envoyez.",
      "it": "L'editor di Menu orchestration tiene fino a 3 voci di primo livello con 5 sottovoci ciascuna; le modifiche restano nella pagina finché non salvi, e salvare scrive nel gateway come una nuova revisione. Il controllo delle regole client del pannello è costruito sulle stesse regole del build_menu del server, quindi un frame che verrebbe rifiutato non parte mai. In Card delivery scegli prima lo stile — standard, receipt per le bollette, security per gli alert — con fino a 8 campi e 4 pulsanti, previsualizza il body della richiesta, poi invia.",
      "nl": "De editor van Menu orchestration bewaart tot 3 top-level items met elk 5 sub-items; bewerkingen blijven op de pagina tot u opslaat, en opslaat schrijft naar de gateway als een nieuwe revisie. De clientregelcontrole van dit paneel is opgebouwd uit dezelfde regels als de build_menu van de server, dus een frame dat afgewezen zou worden vertrekt nooit. Kies in Card delivery eerst de stijl — standard, receipt voor facturen, security voor alerts — met tot 8 velden en 4 knoppen, preview de request-body en verstuur dan.",
      "cs": "Editor Menu orchestration drží až 3 položky nejvyšší úrovně s 5 podpoložkami; úpravy zůstávají na stránce, dokud neuložíte, a uložení zapíše do brány jako nová revize. Kontrola klientských pravidel v tom panelu je postavená ze stejných pravidel jako serverový build_menu, takže frame, který by byl zamítnut, nikdy neodjde. V Card delivery nejdřív vyberte styl — standard, receipt na faktury, security na alerty — s až 8 poli a 4 tlačítky, zobrazte náhled těla požadavku a pak pošlete.",
      "zh-Hans": "「菜单编排」的编排区最多放 3 个顶级项，每项再挂 5 个子项；改动只留在你这一页，按下保存才写进网关并生成新的 revision。同一面板的「客户端规则自检」与服务端 build_menu 同源，命中任何一条都不会发出。「卡片下发」里先选 style：standard、receipt（账单）、security（安全提醒），字段上限 8 个、按钮上限 4 个，再「预览请求体」，最后「下发卡片」。",
      "zh-Hant": "「選單編排」的編排區最多放 3 個頂層項目，每項再掛 5 個子項；改動只留在你這一頁，按下儲存才寫進閘道並產生新的 revision。同一面板的「用戶端規則自檢」與服務端 build_menu 同源，命中任何一條都不會發出。「卡片下發」裡先選 style：standard、receipt（帳單）、security（安全提醒），欄位上限 8 個、按鈕上限 4 個，再「預覽請求本」，最後「下發卡片」。",
      "es": "El editor de Menu orchestration guarda hasta 3 ítems de primer nivel con 5 subítems cada uno; las ediciones viven en la página hasta que guarda, y guardar escribe en la pasarela como una nueva revisión. La comprobación de reglas de cliente de ese panel se construye con las mismas reglas que el build_menu del servidor, así que un frame que sería rechazado nunca sale. En Card delivery elija primero el estilo — standard, receipt para facturas, security para alertas — con hasta 8 campos y 4 botones, previsualice el body de la solicitud y luego envíe.",
      "pl": "Edytor Menu orchestration trzyma do 3 pozycji najwyższego poziomu po 5 podpozycji; zmiany żyją na stronie, dopóki nie zapiszesz, a zapisuje się do bramy jako nowa rewizja. Sprawdzanie reguł klienta w tym panelu jest zbudowane z tych samych reguł co serwerowy build_menu, więc ramka, która zostałaby odrzucona, nigdy nie wychodzi. W Card delivery najpierw wybierz styl — standard, receipt na rachunki, security na alerty — z maksymalnie 8 polami i 4 przyciskami, zajrzyj w podgląd do ciała prośby, potem wyślij.",
      "ja": "Menu orchestration のエディタは、トップレベルを最大3項目、各項目の子項目を最大5つ保持できます。編集内容は保存するまでページ内に残り、保存すると新しいリビジョンとしてゲートウェイに書き込まれます。このパネルのクライアント側ルール検査は、サーバー側の build_menu と同じルールで作られているため、却下されるはずのフレームが外へ出ることはありません。Card delivery では最初にスタイルを選びます。standard、請求書用の receipt、アラート用の security で、フィールドは最大8、ボタンは最大4。リクエスト body をプレビューしてから送信してください。",
      "th": "editor ของ Menu orchestration เก็บ menu ชั้นบนได้ถึง 3 ชั้นละ 5 ชั้นรอง การแก้จะอยู่แค่ในหน้าจนกว่าจะกด save และ save จะเขียนเข้า gateway เป็น revision ใหม่ ตัวตรวจ rule ฝั่ง client ของแผงนี้สร้างจาก rule ชุดเดียวกับ build_menu ฝั่ง server frame ที่จะถูกตัดจึงไม่เคยหลุดออกไป ส่วนใน Card delivery ให้เลือกสไตล์ก่อน — standard, receipt สำหรับบิล, security สำหรับ alert — มีได้สูงสุด 8 field กับ 4 ปุ่ม แล้ว preview body ของ request ค่อยส่ง",
      "fi": "Menu orchestration -editori pitää jopa 3 huipputason kohtaa, joissa kussakin 5 alakohtaa; muutokset elävät sivulla kunnes tallennat, ja tallennus kirjoittaa gatewayhin uutena versiona. Tämän paneelin client-sääntöjen tarkistus on rakennettu samoista säännöistä kuin palvelimen build_menu, joten kehys, joka hylättäisiin, ei koskaan lähde. Valitse Card deliveryssä ensin tyyli — standard, receipt laskuille, security hälytyksille — enintään 8 kenttää ja 4 painiketta, esikatsele pyynnön body ja lähetä sitten.",
      "uk": "Редактор Menu orchestration тримає до 3 пунктів верхнього рівня по 5 підпунктів; зміни живуть на сторінці, доки ви не збережете, а збереження пише в шлюз як нова ревізія. Перевірка клієнтських правил на цій панелі зібрана з тих самих правил, що й серверний build_menu, тому кадр, який було б відхилено, ніколи не виходить. У Card delivery спершу обирайте стиль — standard, receipt для рахунків, security для алертів — до 8 полів і 4 кнопок, перегляньте тіло запиту й надішліть.",
      "bg": "Редакторът на Menu orchestration държи до 3 елемента от горно ниво по 5 поделемента; промените живеят в страницата, докато не запазите, а записването пише в шлюза като нова ревизия. Проверката на клиентските правила в този панел е съградена от същите правила като сървърния build_menu, следователно кадър, който би бил отхвърлен, никога не тръгва. В Card delivery първо изберете стил — standard, receipt за сметки, security за тревоги — с до 8 полета и 4 бутона, прегледайте тялото на заявката и после изпратете.",
      "tr": "Menu orchestration editörü en fazla 3 üst düzey madde ve her birinde 5 alt madde tutar; düzenlemeler siz kaydedene kadar sayfada kalır, kayıt ise ağ geçidine yeni bir revizyon olarak yazılır. Bu panelin istemci kural denetimi, sunucudaki build_menu ile aynı kurallardan kuruludur; dolayısıyla reddedilecek bir kare hiç yola çıkmaz. Card delivery içinde önce stili seçin — standard, faturalar için receipt, uyarılar için security — en fazla 8 alan ve 4 düğme; istek gövdesini önizleyip sonra gönderin.",
      "hu": "A Menu orchestration szerkesztője akár 3 felső szintű elemet tart, elemenként 5 aleggyel; a módosítások az oldalon élnek, amíg nem ment, a mentés pedig új revízióként ír az átjáróba. A panel kliensszabály-ellenőrzése ugyanazokból a szabályokból épül, mint a szerver oldali build_menu, ezért egy keret, amelyet elutasítanának, sosem indul el. A Card deliveryben előbb válassza ki a stílt — standard, receipt számlákhoz, security riasztásokhoz — legfeljebb 8 mezővel és 4 gombbal, nézze meg a kérés body-ját, aztán küldje el.",
    },
    console: {
      en: "Menu orchestration → Add top-level item / + sub-item → Save and push (or Push saved menu only); Card delivery → style → Preview request body → Send card.",
      "ru": "Menu orchestration → Add top-level item / + sub-item → Save and push (или Push saved menu only); Card delivery → стиль → Preview request body → Send card.",
      "de": "Menu orchestration → Add top-level item / + sub-item → Save and push (oder Push saved menu only); Card delivery → Stil → Preview request body → Send card.",
      "fr": "Menu orchestration → Add top-level item / + sub-item → Save and push (ou Push saved menu only) ; Card delivery → style → Preview request body → Send card.",
      "it": "Menu orchestration → Add top-level item / + sub-item → Save and push (o Push saved menu only); Card delivery → stile → Preview request body → Send card.",
      "nl": "Menu orchestration → Add top-level item / + sub-item → Save and push (of Push saved menu only); Card delivery → stijl → Preview request body → Send card.",
      "cs": "Menu orchestration → Add top-level item / + sub-item → Save and push (nebo Push saved menu only); Card delivery → styl → Preview request body → Send card.",
      "zh-Hans": "菜单编排 → 添加顶级项 / + 子项 → 保存并推送（或「仅推送已保存菜单」）；卡片下发 → style → 预览请求体 → 下发卡片。",
      "zh-Hant": "選單編排 → 新增頂層項目 / + 子項 → 儲存並推送（或「僅推送已儲存選單」）；卡片下發 → style → 預覽請求本 → 下發卡片。",
      "es": "Menu orchestration → Add top-level item / + sub-item → Save and push (o Push saved menu only); Card delivery → estilo → Preview request body → Send card.",
      "pl": "Menu orchestration → Add top-level item / + sub-item → Save and push (albo Push saved menu only); Card delivery → styl → Preview request body → Send card.",
      "ja": "Menu orchestration → Add top-level item / + sub-item → Save and push（または Push saved menu only）。Card delivery → スタイル → Preview request body → Send card。",
      "th": "Menu orchestration → Add top-level item / + sub-item → Save and push (หรือ Push saved menu only); Card delivery →สไตล์ → Preview request body → Send card",
      "fi": "Menu orchestration → Add top-level item / + sub-item → Save and push (tai Push saved menu only); Card delivery → tyyli → Preview request body → Send card.",
      "uk": "Menu orchestration → Add top-level item / + sub-item → Save and push (або Push saved menu only); Card delivery → стиль → Preview request body → Send card.",
      "bg": "Menu orchestration → Add top-level item / + sub-item → Save and push (или Push saved menu only); Card delivery → стил → Preview request body → Send card.",
      "tr": "Menu orchestration → Add top-level item / + sub-item → Save and push (ya da Push saved menu only); Card delivery → stil → Preview request body → Send card.",
      "hu": "Menu orchestration → Add top-level item / + sub-item → Save and push (vagy Push saved menu only); Card delivery → stílus → Preview request body → Send card.",
    },
    phone: {
      en: "The bottom bar becomes the three items you configured and opens as a card; later updates refresh in place instead of arriving as another message.",
      "ru": "Нижняя панель превращается в три настроенных вами пункта и открывается карточкой; последующие обновления обновляют её на месте, а не приходят ещё одним сообщением.",
      "de": "Die untere Leiste wird zu den drei von Ihnen konfigurierten Punkten und öffnet sich als Karte; spätere Aktualisierungen erneuern sie an Ort und Stelle, statt als eine weitere Nachricht anzukommen.",
      "fr": "La barre du bas devient les trois éléments que vous avez configurés et s'ouvre en carte ; les mises à jour suivantes se rafraîchissent sur place au lieu d'arriver comme un message de plus.",
      "it": "La barra in basso diventa i tre elementi che hai configurato e si apre come card; gli aggiornamenti successivi si aggiornano sul posto invece di arrivare come un altro messaggio.",
      "nl": "De balk onderaan wordt de drie items die u configureerde en opent als kaart; latere updates verversen terplaatse in plaats van als nóg een bericht aan te komen.",
      "cs": "Spodní lišta se stane těmi třemi položkami, které jste nastavili, a otevírá se jako karta; další aktualizace se obnoví na místě, místo aby přišly jako další zpráva.",
      "zh-Hans": "底部栏换成你配的那 3 项，点开就是一张卡片；之后的更新是原地刷新，不是又冒一条新消息。",
      "zh-Hant": "底部欄換成你配的那 3 項，點開就是一張卡片；之後的更新是原地重新整理，不是又冒一則新訊息。",
      "es": "La barra inferior pasa a ser los tres ítems que usted configuró y se abre como tarjeta; las actualizaciones siguientes se refrescan en el sitio en vez de llegar como otro mensaje.",
      "pl": "Dolny pasek staje się tymi trzema pozycjami, które skonfigurowali Państwo, i otwiera się jako karta; kolejne aktualizacje odświeżają się na miejscu, zamiast przychodzić jako następna wiadomość.",
      "ja": "下のバーは、あなたが設定した3つの項目そのものになり、カードとして開きます。その後の更新は別のメッセージとして届くのではなく、その場で更新されます。",
      "th": "แถบล่างจะกลายเป็นสามรายการที่คุณตั้งค่าไว้ และเปิดเป็นการ์ด ส่วนอัปเดตรอบหลังจะแก้ไขที่ของเดิม ไม่ได้ส่งเป็นข้อความใหม่เพิ่ม",
      "fi": "Alapalkista tulee ne kolme kohtaa, jotka määritit, ja se avautuu korttina; myöhemmät päivitykset virkistyvät paikan päällä sen sijaan että tulisivat uutena viestinä.",
      "uk": "Нижня панель стає тими тьома пунктами, які ви налаштували, і відкривається карткою; наступні оновлення оновлюють її на місці, а не приходять ще одним повідомленням.",
      "bg": "Долната лента става онези три елемента, които конфигурирахте, и се отваря като карта; последващите обновявания се презареждат на място, вместо да идват като още едно съобщение.",
      "tr": "Alt çubuk, sizin yapılandırdığınız üç maddeye dönüşür ve kart olarak açılır; sonraki güncellemeler yeni bir mesaj olarak gelmek yerine yerinde yenilenir.",
      "hu": "Az alsó sáv aza három elem lesz, amelyet beállított, és kártyaként nyílik meg; a későbbi frissítések a helyükön frissülnek, ahelyett, hogy új üzenetként érkeznének.",
    },
    warn: {
      en: "In-place updates are keyed by cardId: re-sending the same card with m=u mutates it on the phone, so a progress bar moves without another message appearing. That is why card_id has to be stable — left blank it is generated, and a broadcast derives a suffix per recipient. The menu cannot carry pay_credits at all; a payment has to ride a readable card.",
      "ru": "Обновления на месте привязаны к cardId: повторная отправка той же карточки с m=u меняет её на телефоне, поэтому прогресс-бар двигается без нового сообщения. Поэтому card_id обязан быть стабильным — если оставить его пустым, он генерируется, а при рассылке на каждого получателя навешивается свой суффикс. Меню вовсе не может нести pay_credits: платёж должен ехать на читаемой карточке.",
      "de": "Aktualisierungen an Ort und Stelle hängen an cardId: dieselbe Karte nochmal mit m=u zu senden verändert sie auf dem Telefon, deshalb bewegt sich ein Fortschrittsbalken ohne weitere Nachricht. Darum muss card_id stabil sein — leer gelassen wird er erzeugt, und ein Broadcast leitet pro Empfänger ein Suffix ab. Das Menü kann gar kein pay_credits tragen; eine Zahlung muss auf einer lesbaren Karte reiten.",
      "fr": "Les mises à jour sur place sont indexées par cardId : renvoyer la même carte avec m=u la mute sur le téléphone, donc une barre de progression avance sans qu'un message de plus arrive. C'est pour cela que card_id doit être stable — laissé vide il est généré, et une diffusion dérive un suffixe par destinataire. Le menu ne peut pas porter pay_credits du tout ; un paiement doit monter sur une carte lisible.",
      "it": "Gli aggiornamenti sul posto sono indicizzati da cardId: rimandare la stessa card con m=u la muta sul telefono, quindi una progress bar si muove senza che arrivi un altro messaggio. Per questo card_id deve essere stabile — se lasciato vuoto viene generato, e un broadcast deriva un suffisso per destinatario. Il menu non può portare pay_credits affatto; un pagamento deve cavalcare una card leggibile.",
      "nl": "In-place updates zijn aan cardId geknoopt: dezelfde kaart nogmaals met m=u sturen veranderd ze op de telefoon, dus een voortgangsbalk beweegt zonder dat er nóg een bericht aankomt. Daarom moet card_id stabiel zijn — blanco gelaten wordt hij gegenereerd, en een broadcast leidt per ontvanger een achtervoegsel af. Het menu kan überhaupt geen pay_credits dragen; een betaling moet op een leesbare kaart meeliften.",
      "cs": "Místní aktualizace jsou navázané na cardId: znovu poslat stejnou kartu s m=u změní ji na telefonu, takže se progress bar posune bez další zprávy. Proto musí být card_id stabilní — když ho necháte prázdný, vygeneruje se, a u broadcastu se odvozuje přípona pro každého příjemce. Menu vůbec nemůže nést pay_credits; platba musí jet na čitelné kartě.",
      "zh-Hans": "原地更新认的是 cardId：同一张卡再用 m=u 发一次，手机就把它改掉——进度条会动而不新冒一条消息。所以 card_id 要留得住：留空是自动生成，广播时按人派生后缀。菜单不支持 pay_credits，付款必须走可读的卡片。",
      "zh-Hant": "原地更新認的是 cardId：同一張卡再用 m=u 發一次，手機就把它改掉——進度條會動而不新冒一則訊息。所以 card_id 要留得住：留空是自動產生，廣播時按人派生後綴。選單不支援 pay_credits，付款必須走可讀的卡片。",
      "es": "Las actualizaciones en el sitio están atadas a cardId: reenviar la misma tarjeta con m=u la muta en el teléfono, así que una barra de progreso se mueve sin que llegue otro mensaje. Por eso card_id tiene que ser estable — si lo deja vacío se genera, y un broadcast deriva un sufijo por destinatario. El menú no puede llevar pay_credits en absoluto; un pago tiene que viajar en una tarjeta legible.",
      "pl": "Aktualizacje na miejscu są spięte z cardId: ponowne wysłanie tej samej karty z m=u mutuje ją na telefonie, więc pasek postępu rusza się bez kolejnej wiadomości. Dlatego card_id musi być stabilne — zostawione puste zostanie wygenerowane, a przy broadcastzie dla każdego odbiorcy liczona jest osobna przyrostkowa końcówka. Menu w ogóle nie może nieść pay_credits; płatność musi jechać na czytelnej karcie.",
      "ja": "その場での更新は cardId を鍵にしています。同じカードを m=u で送り直すと iPhone 側でそのカードが変化するので、新しいメッセージを増やさずにプログレスバーを動かせます。だからこそ card_id は安定していなければなりません。空欄だと生成され、ブロードキャストでは受信者ごとに接尾辞が導かれます。メニューは pay_credits を一切載せられません。支払いは読めるカードの上に乗せる必要があります。",
      "th": "การอัปเดตที่ของเดิมผูกกับ cardId: ส่งใบเดิมซ้ำพร้อม m=uจะไป muter การ์ดบนเครื่อง iPhone ดังนั้น progress bar จึงขยับได้โดยไม่ต้องส่งข้อความใหม่ นั่นคือเหตุที่ card_id ต้องคงที่ — ถ้าปล่อยว่างระบบจะสุ่มสร้างให้ และการ broadcast จะสร้าง suffix ต่อผู้รับหนึ่งคน ส่วน menu นั้นใส่ pay_credits ไม่ได้เลย การชำระเงินต้องไปกับการ์ดที่อ่านได้",
      "fi": "Paikanpäälliset päivitykset on sidottu cardId:hen: saman kortin lähetys uudelleen arvolla m=u muuttaa sen puhelimessa, joten progress-palkki liikkuu ilman uutta viestiä. Siksi card_id:n on oltava vakaa — jos se jätetään tyhjäksi, se generoidaan, ja broadcast johtaa postfixin jokaista vastaanottajaa kohti. Valikko ei voi kantaa pay_credits ollenkaan; maksun pitää ratsastaa luettavalla kortilla.",
      "uk": "Оновлення на місці прив'язані до cardId: повторна надсилка тієї ж картки з m=u змінює її на телефоні, тож прогрес-бар рухається без нового повідомлення. Тому card_id мусить бути стабільним — якщо залишити його порожнім, він генерується, а при розсилці на кожного отримувача навішується власний суфікс. Меню взагалі не може нести pay_credits: платіж має їхати на читабельній картці.",
      "bg": "Освежаването на място е обвързано с cardId: изпращането отново на същата карта с m=u я мутира по телефона, затова един progress bar се движи без ново съобщение. Ето защо card_id трябва да е стабилен — оставен празно се генерира, а при broadcast се извежда наставка за всеки получач. Менюто изобщо не може да носи pay_credits; плащането трябва да възложи четима карта.",
      "tr": "Yerinde güncellemeler cardId üzerinden bağlanır: aynı kartı m=u ile yeniden göndermek onu telefonda değiştirir, böylece yeni bir mesaj gelmeden ilerleme çubuğu hareket eder. Bu yüzden card_id sabit olmalıdır — boş bırakılırsa üretilir ve toplu gönderimde alıcı başına bir son ek türetilir. Menü pay_credits taşıyamaz; ödeme okunabilir bir kartın üzerinde gitmek zorundadır.",
      "hu": "A helyben frissítések cardId-höz vanak kötve: ugyanazon kártya m=u-val történő újraküldése megváltoztatja a telefonon, ezért egy progress bar új üzenet nélkül mozog. Ezért a card_id-nak stabilnak kell lennie — üresen hagyva generálódik, és egy broadcast esetén minden címzetthez külön utótag tartozik. A menu egyáltalán nem hordozhat pay_credits-t; egy fizetésnek egy olvasható kártyán kell utaznia.",
    },
  },
  {
    no: "3",
    title: {
      en: "Turn the five opt-in plugins on",
      "ru": "Включить пять опциональных плагинов",
      "de": "Die fünf optionalen Plugins einschalten",
      "fr": "Activer les cinq plugins optionnels",
      "it": "Accendi i cinque plugin opzionali",
      "nl": "De vijf optionele plugins aanzetten",
      "cs": "Zapnout pět volitelných pluginů",
      "zh-Hans": "启用五个可选插件",
      "zh-Hant": "啟用五個可選插件",
      "es": "Encender los cinco plugins opcionales",
      "pl": "Włącz pięć opcjonalnych wtyczek",
      "ja": "5つのオプトインプラグインをオンにする",
      "th": "เปิดปลั๊กอินแบบเลือกใช้ทั้งห้า",
      "fi": "Laita viisi valinnaista pluginia päälle",
      "uk": "Увімкнути п'ять опційних плагінів",
      "bg": "Включи петте опционални приставки",
      "tr": "Beş isteğe bağlı eklentiyi aç",
      "hu": "Kapcsold be az öt opcionális bővítményt",
    },
    body: {
      en: "The plugin console is nine panels: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar and Slack / Discord outbound. Four are on by default; the other five wait for their own POPOPX_PLUGIN_* switch. Each header carries two chips — module mounted, and gateway verdict — both read from that <prefix>/status. The AI panel hot-edits exactly six keys: system_prompt, model, history_size, temperature, max_tokens and exhausted_message. The API key and endpoint are environment values, and the status row says so verbatim: missing means set POPOPX_AI_API_KEY in .env, then restart.",
      "ru": "Консоль плагинов — это девять панелей: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar и Slack / Discord outbound. Четыре включены по умолчанию; остальные пять ждут собственного переключателя POPOPX_PLUGIN_*. В каждом заголовке два чипа — module mounted и вердикт шлюза, — и оба читаются из того самого <prefix>/status. Панель AI горячо правит ровно шесть ключей: system_prompt, model, history_size, temperature, max_tokens и exhausted_message. API-ключ и endpoint задаются окружением, и строка статуса говорит это дословно: если ключ отсутствует, поставьте POPOPX_AI_API_KEY в .env, затем перезапустите.",
      "de": "Die Plugin-Konsole ist neun Panels: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar und Slack / Discord outbound. Vier sind standardmäßig an; die anderen fünf warten auf ihren eigenen POPOPX_PLUGIN_*-Schalter. Jeder Kopf trägt zwei Chips — module mounted und Gateway-Befund —, und beide werden aus genau diesem <prefix>/status gelesen. Das AI-Panel hot-editiert exakt sechs Schlüssel: system_prompt, model, history_size, temperature, max_tokens und exhausted_message. API-Key und Endpoint sind Umgebungswerte, und die Statuszeile sagt das wörtlich: fehlt er, setzen Sie POPOPX_AI_API_KEY in .env und starten neu.",
      "fr": "La console des plugins, c'est neuf panneaux : AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar et Slack / Discord outbound. Quatre sont actifs par défaut ; les cinq autres attendent leur propre interrupteur POPOPX_PLUGIN_*. Chaque en-tête porte deux pastilles — module mounted et le verdict de la passerelle —, toutes deux lues depuis ce même <prefix>/status. Le panneau IA modifie à chaud exactement six clés : system_prompt, model, history_size, temperature, max_tokens et exhausted_message. La clé d'API et l'endpoint sont des valeurs d'environnement, et la ligne d'état le dit mot pour mot : absente, mettez POPOPX_AI_API_KEY dans .env puis redémarrez.",
      "it": "La console dei plugin è nove pannelli: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar e Slack / Discord outbound. Quattro sono attivi di default; gli altri cinque aspettano il proprio interruttore POPOPX_PLUGIN_*. Ogni intestazione porta due chip — module mounted e il verdetto del gateway — e entrambi si leggono da quel <prefix>/status. Il pannello AI hot-edita esattamente sei chiavi: system_prompt, model, history_size, temperature, max_tokens ed exhausted_message. API key ed endpoint sono valori d'ambiente, e la riga di stato lo dice alla lettera: mancante significa impostare POPOPX_AI_API_KEY in .env, poi riavviare.",
      "nl": "De pluginconsole is negen panelen: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar en Slack / Discord outbound. Vier staan standaard aan; de andere vijf wachten op hun eigen POPOPX_PLUGIN_*-schakelaar. Elke koptekst draagt twee chips — module mounted en het gateway-oordeel — en beide lezen uit precies die <prefix>/status. Het AI-paneel hot-edit exact zes sleutels: system_prompt, model, history_size, temperature, max_tokens en exhausted_message. De API-sleutel en endpoint zijn omgevingswaarden, en de statusregel zegt dat letterlijk: ontbreekt ze, zet POPOPX_AI_API_KEY in .env en start her.",
      "cs": "Konzole pluginů je devět panelů: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar a Slack / Discord outbound. Čtyři jsou ve výchozím stavu zapnuté; zbylých pět čeká na vlastní přepínač POPOPX_PLUGIN_*. Každé záhlaví nese dva štítky — module mounted a verdikt brány — a oba se čtou z toho samého <prefix>/status. Panel AI horkě edituje přesně šest klíčů: system_prompt, model, history_size, temperature, max_tokens a exhausted_message. API klíč a endpoint jsou hodnoty prostředí, a řádek stavu to říká slovo od slova: chybí, nastavte POPOPX_AI_API_KEY v .env a restartujte.",
      "zh-Hans": "「插件控制台」九块面板：AI 客服、告警运营、免密登录、投票、Web3 桥、开放工作流、CardDAV 通讯录、CalDAV 日历、Slack / Discord 出站桥。其中四块默认开启，其余五块等各自的 POPOPX_PLUGIN_* 开关。每块头部两枚 chip 是「模块已装载」与「网关判定」，读的就是那条 <prefix>/status。AI 客服的配置区只有 6 个键能热改：system_prompt、model、history_size、temperature、max_tokens、exhausted_message；api_key 与 endpoint 属环境变量——状态行直接写「缺失（在 .env 里设置 POPOPX_AI_API_KEY）」，改它要重启。",
      "zh-Hant": "「插件後臺」九塊面板：AI 客服、告警運營、免密登入、投票、Web3 橋、開放工作流、CardDAV 通訊錄、CalDAV 日曆、Slack / Discord 出站橋。其中四塊預設開啟，其餘五塊等各自的 POPOPX_PLUGIN_* 開關。每塊頭部兩枚 chip 是「模組已裝載」與「閘道判定」，讀的就是那條 <prefix>/status。AI 客服的設定區只有 6 個鍵能熱改：system_prompt、model、history_size、temperature、max_tokens、exhausted_message；api_key 與 endpoint 屬環境變數——狀態列直接寫「遺失（在 .env 裡設定 POPOPX_AI_API_KEY）」，改它要重啟。",
      "es": "La consola de plugins son nueve paneles: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar y Slack / Discord outbound. Cuatro vienen activos por defecto; los otros cinco esperan su propio interruptor POPOPX_PLUGIN_*. Cada encabezado lleva dos chips — module mounted y el veredicto de la pasarela — y ambos se leen de ese mismo <prefix>/status. El panel de IA edita en caliente exactamente seis claves: system_prompt, model, history_size, temperature, max_tokens y exhausted_message. La API key y el endpoint son valores de entorno, y la línea de estado lo dice literalmente: si falta, ponga POPOPX_AI_API_KEY en .env y reinicie.",
      "pl": "Konsola wtyczek to dziewięć paneli: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar i Slack / Discord outbound. Cztery są domyślnie włączone; pozostałe pięć czeka na własny przełącznik POPOPX_PLUGIN_*. Każdy nagłówek niesie dwa chipy — module mounted oraz werdykt bramy — i oba czytają z tego samego <prefix>/status. Panel AI edytuje na gorąco dokładnie sześć kluczy: system_prompt, model, history_size, temperature, max_tokens i exhausted_message. Klucz API i endpoint to wartości środowiskowe, a linia statusu mówi to dosłownie: brak oznacza wpisać POPOPX_AI_API_KEY do .env i zrestartować.",
      "ja": "プラグイン用コンソールは9つのパネル、AI agent、Alert ops、Passwordless SSO、Polls、Web3 bridge、Workflow bridge、CardDAV contacts、CalDAV calendar、Slack / Discord outbound です。4つは既定でオン、残り5つはそれぞれの POPOPX_PLUGIN_* スイッチを待ちます。各ヘッダーには2つのチップ、module mounted とゲートウェイ判定が載り、どちらもその <prefix>/status から読まれます。AI パネルが hot-edit するのは system_prompt、model、history_size、temperature、max_tokens、exhausted_message の6キーだけ。APIキーとエンドポイントは環境値で、その旨はステータス行にそのまま書かれています。無いなら .env に POPOPX_AI_API_KEY を設定して再起動してください。",
      "th": "คอนโซลของปลั๊กอินมีเก้าแผง: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar และ Slack / Discord outbound โดยสี่แผงเปิดอยู่โดยค่าเริ่มต้น ส่วนอีกห้าแผงรอสวิตช์ POPOPX_PLUGIN_* ของตัวเอง หัวข้อของแต่ละแผงมีชิปสองตัว คือ module mounted กับคำตัดสินของ gateway ซึ่งต่างอ่านจาก <prefix>/status เดียวกัน แผง AI แก้ไขแบบร้อน ๆ ได้หกคีย์พอดี คือ system_prompt, model, history_size, temperature, max_tokens และ exhausted_message ส่วน API key กับ endpoint เป็นค่าจากสภาพแวดล้อม และบรรทัดสถานะก็พูดไว้ตรงตัวว่า ถ้าหายก็ไปตั้ง POPOPX_AI_API_KEY ใน .env แล้วรีสตาร์ท",
      "fi": "Plugin-konsoli on yhdeksän paneelia: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar ja Slack / Discord outbound. Neljä on oletuksena päällä; loput viisi odottavat omaa POPOPX_PLUGIN_*-kytkintään. Jokaisessa otsikossa on kaksi merkkia — module mounted ja gatewayn tuomio — ja molemmat luetaan juuri tuosta <prefix>/statusista. AI-paneeli muokkaa kuumana täsmälleen kuutta avainta: system_prompt, model, history_size, temperature, max_tokens ja exhausted_message. API-avain ja endpoint ovat ympäristöarvoja, ja statusrivi sanoo sen sananomaisesti: puuttuu aseta POPOPX_AI_API_KEY .env:oon ja käynnistä uudelleen.",
      "uk": "Консоль плагінів — це дев'ять панелей: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar і Slack / Discord outbound. Чотири увімкнені типово; решта п'ять чекають на власний перемикач POPOPX_PLUGIN_*. У кожному заголовку два чіпи — module mounted і вердикт шлюзу, — і обидва читаються з того самого <prefix>/status. Панель AI гаряче править рівно шість ключів: system_prompt, model, history_size, temperature, max_tokens та exhausted_message. API-ключ і endpoint задаються середовищем, і рядок статусу каже це дослівно: якщо бракує, поставте POPOPX_AI_API_KEY у .env, потім перезапустіть.",
      "bg": "Конзолата на приставките са девет панела: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar и Slack / Discord outbound. Четири са включени по подразбиране; останалите пет чакат собствения си превключвател POPOPX_PLUGIN_*. Всяка заглавка носи два чипа — module mounted и присъдата на шлюза, и двата се четат от онзи <prefix>/status. AI панелът горещо редактира точно шест ключа: system_prompt, model, history_size, temperature, max_tokens и exhausted_message. API ключът и endpoint са стойности на обкръжаването, и редът за състояние го казва буквално: липсва – сложете POPOPX_AI_API_KEY в .env и рестартирайте.",
      "tr": "Eklenti konsolu dokuz panelden oluşur: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar ve Slack / Discord outbound. Dördü varsayılan olarak açıktır; diğer beşi kendi POPOPX_PLUGIN_* anahtarını bekler. Her başlıkta iki çip var — module mounted ve ağ geçidi kararı — ve ikisi de o <prefix>/status rotasından okunur. AI paneli hot olarak tam altı anahtarı düzenler: system_prompt, model, history_size, temperature, max_tokens ve exhausted_message. API anahtarı ve uç nokta ortam değerleridir; durum satırı bunu aynen yazar: eksikse .env içinde POPOPX_AI_API_KEY değerini verin, sonra yeniden başlatın.",
      "hu": "A bővítmény-konzol kilenc panel: AI agent, Alert ops, Passwordless SSO, Polls, Web3 bridge, Workflow bridge, CardDAV contacts, CalDAV calendar és Slack / Discord outbound. Négy alapból be van kapcsolva; a másik öt a saját POPOPX_PLUGIN_* kapcsolójára vár. Minden fejléken két chip ül — module mounted és az átjáró ítélete —, s mindkettő éppen abból a <prefix>/status-ból olvastatik. Az AI panel melegen pontosan hat kulcsot szerkeszt: system_prompt, model, history_size, temperature, max_tokens és exhausted_message. Az API-kulcs és az endpoint környezeti érték, és a status-sor ezt szó szerint ki is mondja: ha hiányzik, állítsa be POPOPX_AI_API_KEY-t a .env-ben, majd indítsa újra.",
    },
    console: {
      en: "Alert ops builds the curl for you: point Alertmanager or Grafana at /api/v1/plugins/alerts/webhook with X-Popopx-Alert-Token set to POPOPX_ALERT_WEBHOOK_TOKEN — an Authorization: Bearer is accepted there too. If you also set POPOPX_ALERT_WEBHOOK_SECRET, every request must add X-Popopx-Timestamp (integer seconds, ±300 s of gateway time) and X-Popopx-Signature: v1=<hex> with an HMAC-SHA256 over <timestamp>.<raw body>, and each signature is accepted once; leave the secret unset and the token alone is enough. The severity comparison is >=, so POPOPX_ALERT_MIN_SEVERITY=warning means warning and above, and only an alert that clears the line becomes a card in the security style. In Polls set mode to anonymous, the other value being signed, give it 2 to 4 options, and list the recipients explicitly.",
      "ru": "Alert ops сам собирает curl: направьте Alertmanager или Grafana на /api/v1/plugins/alerts/webhook с X-Popopx-Alert-Token равным POPOPX_ALERT_WEBHOOK_TOKEN — Authorization: Bearer там тоже принимается. Если задан ещё POPOPX_ALERT_WEBHOOK_SECRET, каждый запрос обязан добавить X-Popopx-Timestamp (целые секунды, ±300 с от времени шлюза) и X-Popopx-Signature: v1=<hex> с HMAC-SHA256 от <timestamp>.<raw body>, и каждая подпись принимается один раз; без секрета достаточно одного токена. Сравнение severity идёт по >=, поэтому POPOPX_ALERT_MIN_SEVERITY=warning означает warning и выше, и только алерт, прошедший порог, становится red security-карточкой. В Polls поставьте mode в anonymous, дайте от 2 до 4 вариантов и перечислите получателей явно.",
      "de": "Alert ops baut den curl für Sie: richten Sie Alertmanager oder Grafana auf /api/v1/plugins/alerts/webhook mit X-Popopx-Alert-Token gleich POPOPX_ALERT_WEBHOOK_TOKEN — ein Authorization: Bearer wird dort ebenfalls akzeptiert. Ist zusätzlich POPOPX_ALERT_WEBHOOK_SECRET gesetzt, muss jede Anfrage X-Popopx-Timestamp (ganze Sekunden, ±300 s zur Gateway-Zeit) und X-Popopx-Signature: v1=<hex> mit HMAC-SHA256 über <timestamp>.<raw body> mitschicken, und jede Signatur wird nur einmal akzeptiert; ohne Secret genügt das Token. Der Severity-Vergleich ist >=, POPOPX_ALERT_MIN_SEVERITY=warning heißt also warning und höher, und nur ein Alarm über der Linie erzeugt die rote security-Karte. In Polls setzen Sie mode auf anonymous, geben 2 bis 4 Optionen und listen die Empfänger explizit.",
      "fr": "Alert ops construit le curl pour vous : pointez Alertmanager ou Grafana sur /api/v1/plugins/alerts/webhook avec X-Popopx-Alert-Token égal à POPOPX_ALERT_WEBHOOK_TOKEN — un Authorization: Bearer y est aussi accepté. Si POPOPX_ALERT_WEBHOOK_SECRET est en plus défini, chaque requête doit ajouter X-Popopx-Timestamp (secondes entières, ±300 s de l'heure du gateway) et X-Popopx-Signature : v1=<hex> avec un HMAC-SHA256 sur <timestamp>.<raw body>, et chaque signature n'est acceptée qu'une fois ; sans secret, le token suffit. La comparaison de sévérité est >=, donc POPOPX_ALERT_MIN_SEVERITY=warning signifie warning et au-dessus, et seule une alerte au-dessus de la ligne produit la carte security rouge. Dans Polls, mettez mode sur anonymous, donnez de 2 à 4 options et listez explicitement les destinataires.",
      "it": "Alert ops costruisce il curl per te: punta Alertmanager o Grafana su /api/v1/plugins/alerts/webhook con X-Popopx-Alert-Token uguale a POPOPX_ALERT_WEBHOOK_TOKEN — anche un Authorization: Bearer è accettato. Se è impostato anche POPOPX_ALERT_WEBHOOK_SECRET, ogni richiesta deve aggiungere X-Popopx-Timestamp (secondi interi, ±300 s dall'ora del gateway) e X-Popopx-Signature: v1=<hex> con HMAC-SHA256 su <timestamp>.<raw body>, e ogni firma è accettata una sola volta; senza secret basta il token. Il confronto delle severità è >=, quindi POPOPX_ALERT_MIN_SEVERITY=warning significa warning e superiori, e solo un alert sopra la soglia produce la card security rossa. In Polls metti mode su anonymous, dai da 2 a 4 opzioni ed elenca i destinatari esplicitamente.",
      "nl": "Alert ops bouwt de curl voor u: richt Alertmanager of Grafana op /api/v1/plugins/alerts/webhook met X-Popopx-Alert-Token gelijk aan POPOPX_ALERT_WEBHOOK_TOKEN — een Authorization: Bearer wordt daar ook geaccepteerd. Is daarnaast POPOPX_ALERT_WEBHOOK_SECRET gezet, dan moet elk verzoek X-Popopx-Timestamp (hele seconden, ±300 s van de gatewayklok) en X-Popopx-Signature: v1=<hex> met een HMAC-SHA256 over <timestamp>.<raw body> meesturen, en elke handtekening wordt maar één keer geaccepteerd; zonder secret volstaat het token. De severity-vergelijking is >=, dus POPOPX_ALERT_MIN_SEVERITY=warning betekent warning en hoger, en alleen een alert boven de lijn levert de rode security-kaart op. Zet in Polls mode op anonymous, geef 2 tot 4 opties en som de ontvangers expliciet op.",
      "cs": "Alert ops sbalí curl za vás: namířte Alertmanager nebo Grafanu na /api/v1/plugins/alerts/webhook s X-Popopx-Alert-Token rovným POPOPX_ALERT_WEBHOOK_TOKEN — Authorization: Bearer je tam také přijímán. Je-li navíc nastaven POPOPX_ALERT_WEBHOOK_SECRET, musí každý požadavek přidat X-Popopx-Timestamp (celé sekundy, ±300 s od času brány) a X-Popopx-Signature: v1=<hex> s HMAC-SHA256 nad <timestamp>.<raw body>, a každý podpis je přijat jen jednou; bez secretu stačí token. Porovnání severity je >=, takže POPOPX_ALERT_MIN_SEVERITY=warning znamená warning a výš a jen alert nad hranicí vytvoří červenou security kartu. V Polls dejte mode na anonymous, nabídněte 2 až 4 možnosti a příjemce vypište výslovně.",
      "zh-Hans": "告警运营的「接入告警」区替你拼好那条 curl：让 Alertmanager 或 Grafana 往 /api/v1/plugins/alerts/webhook POST，带 X-Popopx-Alert-Token 等于 POPOPX_ALERT_WEBHOOK_TOKEN（Authorization: Bearer 也收）；若再设了 POPOPX_ALERT_WEBHOOK_SECRET，每个请求还必须带 X-Popopx-Timestamp（整秒，与网关时间相差 ±300 秒以内）和 X-Popopx-Signature: v1=<hex>，签名是对 <timestamp>.<raw body> 做 HMAC-SHA256，且每个签名只能用一次；不设 secret 就只靠 token。级别比较用 >=，所以 POPOPX_ALERT_MIN_SEVERITY=warning 是「warning 及以上」，够线的才出一张 style 为 security 的卡。投票区把 mode 选 anonymous（另一个取值是 signed），2 到 4 个选项，收件人必须明确列出。",
      "zh-Hant": "告警運營的「接入告警」區替你拼好那條 curl：讓 Alertmanager 或 Grafana 往 /api/v1/plugins/alerts/webhook POST，帶 X-Popopx-Alert-Token 等於 POPOPX_ALERT_WEBHOOK_TOKEN（Authorization: Bearer 也收）；若再設了 POPOPX_ALERT_WEBHOOK_SECRET，每個請求還必須帶 X-Popopx-Timestamp（整秒，與閘道時間相差 ±300 秒以內）和 X-Popopx-Signature: v1=<hex>，簽章是對 <timestamp>.<raw body> 做 HMAC-SHA256，且每個簽章只能用一次；不設 secret 就只靠 token。級別比較用 >=，所以 POPOPX_ALERT_MIN_SEVERITY=warning 是「warning 及以上」，夠線的才出一張 style 為 security 的卡。投票區把 mode 選 anonymous（另一個取值是 signed），2 到 4 個選項，收件人必須明確列出。",
      "es": "Alert ops le arma el curl: apunte Alertmanager o Grafana a /api/v1/plugins/alerts/webhook con X-Popopx-Alert-Token igual a POPOPX_ALERT_WEBHOOK_TOKEN — un Authorization: Bearer también se acepta ahí. Si además define POPOPX_ALERT_WEBHOOK_SECRET, cada petición debe añadir X-Popopx-Timestamp (segundos enteros, ±300 s del reloj del gateway) y X-Popopx-Signature: v1=<hex> con HMAC-SHA256 sobre <timestamp>.<raw body>, y cada firma se acepta una sola vez; sin el secreto basta el token. La comparación de severidad es >=, así que POPOPX_ALERT_MIN_SEVERITY=warning significa warning y superiores, y solo una alerta que cruza la línea produce la tarjeta security roja. En Polls ponga mode en anonymous, dé entre 2 y 4 opciones y enumere los destinatarios explícitamente.",
      "pl": "Alert ops buduje curl za was: skieruj Alertmanager lub Grafanę na /api/v1/plugins/alerts/webhook z X-Popopx-Alert-Token równym POPOPX_ALERT_WEBHOOK_TOKEN — Authorization: Bearer też jest tam akceptowany. Jeśli dodatkowo ustawisz POPOPX_ALERT_WEBHOOK_SECRET, każde żądanie musi dodać X-Popopx-Timestamp (całe sekundy, ±300 s od czasu bramy) i X-Popopx-Signature: v1=<hex> z HMAC-SHA256 po <timestamp>.<raw body>, a każdy podpis jest przyjmowany tylko raz; bez sekretu wystarcza token. Porównanie severity to >=, więc POPOPX_ALERT_MIN_SEVERITY=warning znaczy warning i wyżej, i tylko alert ponad progiem tworzy czerwoną kartę security. W Polls ustaw mode na anonymous, podaj od 2 do 4 opcji i wypisz odbiorców wprost.",
      "ja": "Alert ops は curl を代わりに組み立ててくれます。Alertmanager や Grafana を /api/v1/plugins/alerts/webhook に向け、X-Popopx-Alert-Token に POPOPX_ALERT_WEBHOOK_TOKEN をセットしてください（Authorization: Bearer も受け付けます）。さらに POPOPX_ALERT_WEBHOOK_SECRET を設定した場合、各リクエストには X-Popopx-Timestamp（整数秒、ゲートウェイ時刻との差 ±300 秒以内）と X-Popopx-Signature: v1=<hex> が必要で、署名は <timestamp>.<raw body> に対する HMAC-SHA256、同じ署名は一度しか使えません。secret を設定しなければトークンだけで足ります。severity の比較は >= なので、POPOPX_ALERT_MIN_SEVERITY=warning は warning 以上を意味し、基準を超えたアラートだけが赤い security カードになります。Polls では mode を anonymous にし、選択肢を2から4まで与え、受信者を明示的に並べてください。",
      "th": "Alert ops ประกอบ curl ให้เอง: ชี้ Alertmanager หรือ Grafana ไปที่ /api/v1/plugins/alerts/webhook พร้อมตั้ง X-Popopx-Alert-Token ให้เท่ากับ POPOPX_ALERT_WEBHOOK_TOKEN (รับ Authorization: Bearer ด้วย) ถ้าตั้ง POPOPX_ALERT_WEBHOOK_SECRET เพิ่ม ทุกคำขอต้องแนบ X-Popopx-Timestamp (จำนวนเต็มวินาที ห่างจากเวลา gateway ไม่เกิน ±300 วินาที) และ X-Popopx-Signature: v1=<hex> ซึ่งเป็น HMAC-SHA256 ของ <timestamp>.<raw body> และแต่ละลายเซ็นใช้ได้ครั้งเดียว ถ้าไม่ตั้ง secret ก็ใช้แค่ token พอ การเทียบ severity ใช้ >= ดังนั้น POPOPX_ALERT_MIN_SEVERITY=warning หมายถึง warning ขึ้นไป และมีเฉพาะแจ้งเตือนที่ผ่านเส้นนี้เท่านั้นที่สร้างการ์ด security สีแดง ส่วนใน Polls ให้ตั้ง mode เป็น anonymous กำหนดตัวเลือก 2 ถึง 4 ข้อ และระบุรายชื่อผู้รับอย่างชัดเจน",
      "fi": "Alert ops rakentaa curlin puolestasi: osoita Alertmanager tai Grafana reittiin /api/v1/plugins/alerts/webhook siten että X-Popopx-Alert-Token on POPOPX_ALERT_WEBHOOK_TOKEN — myös Authorization: Bearer kelpaa siellä. Jos lisäksi asetat POPOPX_ALERT_WEBHOOK_SECRETin, jokaisen pyynnön on lisättävä X-Popopx-Timestamp (kokonaisia sekunteja, ±300 s yhdyskäytävän ajasta) ja X-Popopx-Signature: v1=<hex>, joka on HMAC-SHA256 arvosta <timestamp>.<raw body>, ja kukin allekirjoitus hyväksytään vain kerran; ilman secretiä token riittää. Severity-vertailu on >=, joten POPOPX_ALERT_MIN_SEVERITY=warning tarkoittaa warningia ja sitä ylempiä, ja vain rajan ylittävä hälytys tuottaa punaisen security-kortin. Aseta Pollsissa mode arvoon anonymous, anna 2–4 vaihtoehtoa ja listaa vastaanottajat eksplisiittisesti.",
      "uk": "Alert ops сам збирає curl: спрямуйте Alertmanager чи Grafana на /api/v1/plugins/alerts/webhook з X-Popopx-Alert-Token рівним POPOPX_ALERT_WEBHOOK_TOKEN — Authorization: Bearer там теж приймається. Якщо додатково задано POPOPX_ALERT_WEBHOOK_SECRET, кожен запит має додати X-Popopx-Timestamp (цілі секунди, ±300 с від часу шлюзу) і X-Popopx-Signature: v1=<hex> з HMAC-SHA256 від <timestamp>.<raw body>, і кожен підпис приймається лише раз; без секрету достатньо токена. Порівняння severity — >=, тож POPOPX_ALERT_MIN_SEVERITY=warning означає warning і вище, і лише алерт понад поріг стає червоною security-карткою. У Polls поставте mode в anonymous, дайте від 2 до 4 варіантів і перелічіть отримувачів явно.",
      "bg": "Alert ops сглобява curl вместо вас: насочете Alertmanager или Grafana към /api/v1/plugins/alerts/webhook с X-Popopx-Alert-Token равен на POPOPX_ALERT_WEBHOOK_TOKEN — Authorization: Bearer също се приема там. Ако допълнително зададете POPOPX_ALERT_WEBHOOK_SECRET, всяка заявка трябва да добави X-Popopx-Timestamp (цели секунди, ±300 s от времето на шлюза) и X-Popopx-Signature: v1=<hex> с HMAC-SHA256 върху <timestamp>.<raw body>, и всеки подпис се приема само веднъж; без secret стига токенът. Сравнението на severity е >=, така че POPOPX_ALERT_MIN_SEVERITY=warning значи warning и нагоре, и само тревога над прага дава червената security карта. В Polls поставете mode на anonymous, дайте от 2 до 4 опции и избройте получателите изрично.",
      "tr": "Alert ops curl'ü sizin için kurar: Alertmanager ya da Grafana'yı X-Popopx-Alert-Token = POPOPX_ALERT_WEBHOOK_TOKEN ile /api/v1/plugins/alerts/webhook adresine yöneltin — Authorization: Bearer da orada kabul edilir. Ayrıca POPOPX_ALERT_WEBHOOK_SECRET ayarlarsanız her istek X-Popopx-Timestamp (tam saniye, ağ geçidi saatinden ±300 s) ve X-Popopx-Signature: v1=<hex> eklemelidir; imza <timestamp>.<raw body> üzerinde HMAC-SHA256'dır ve her imza yalnızca bir kez kabul edilir; secret yoksa token yeterlidir. Severity karşılaştırması >= olduğundan POPOPX_ALERT_MIN_SEVERITY=warning, warning ve üzeri demektir ve yalnızca çizgiyi geçen alarm kırmızı security kartını üretir. Polls içinde mode'u anonymous yapın, 2 ile 4 seçenek verin ve alıcıları açıkça sayın.",
      "hu": "Az Alert ops megépíti önért a curlt: irányítsa az Alertmanager-t vagy a Grafanát a /api/v1/plugins/alerts/webhook címre, ahol X-Popopx-Alert-Token = POPOPX_ALERT_WEBHOOK_TOKEN — az Authorization: Bearer is elfogadott ott. Ha emellett POPOPX_ALERT_WEBHOOK_SECRET is be van állítva, minden kérésnek mellékelnie kell X-Popopx-Timestamp (egész másodperc, ±300 s a gateway idejéhez képest) és X-Popopx-Signature: v1=<hex> fejlécet, amely HMAC-SHA256 a <timestamp>.<raw body> felett, és minden aláírás csak egyszer fogadható el; secret nélkül elég a token. A severity-összehasonlítás >=, tehát a POPOPX_ALERT_MIN_SEVERITY=warning a warningot és az afelettieket jelenti, és csak a küszöböt átlépő riasztásból lesz piros security-kártya. A Pollsban állítsa a mode-ot anonymous-re, adjon meg 2–4 opciót, és sorolja fel a címzetteket kifejezetten.",
    },
    phone: {
      en: "A follower asks and the agent answers, charged as ai_message; an alert arrives as a red card, with ack and resolve each charged as alert; a poll renders one button per option, and an anonymous result contains no contact identifier at all.",
      "ru": "Подписчик спрашивает, агент отвечает — списывается ai_message; алерт приходит красной карточкой, причём ack и resolve списываются каждый как alert; опрос рисует по кнопке на вариант, а анонимный результат не содержит идентификатора контакта вообще.",
      "de": "Ein Anhänger fragt und der Agent antwortet, abgerechnet als ai_message; ein Alarm kommt als rote Karte, wobei ack und resolve je als alert abgerechnet werden; eine Umfrage zeichnet pro Option einen Knopf, und ein anonymes Ergebnis enthält keinerlei Kontakt-Identifier.",
      "fr": "Un abonné demande et l'agent répond, facturé en ai_message ; une alerte arrive en carte rouge, avec ack et resolve facturés chacun comme alert ; un sondage dessine un bouton par option, et un résultat anonyme ne contient aucun identifiant de contact.",
      "it": "Un follower chiede e l'agente risponde, addebitato come ai_message; un alert arriva come card rossa, con ack e resolve addebitati ciascuno come alert; un sondaggio disegna un pulsante per opzione, e un risultato anonimo non contiene alcun identificatore di contatto.",
      "nl": "Een volger vraagt en de agent antwoordt, gefactureerd als ai_message; een alert komt als rode kaart, met ack en resolve elk als alert gefactureerd; een poll tekent één knop per optie, en een anoniem resultaat bevat geen contactidentifier in het geheel.",
      "cs": "Odběratel se zeptá a agent odpoví, účtováno jako ai_message; alert přijde jako červená karta, přičemž ack i resolve se účtují každý jako alert; anketa vykreslí jedno tlačítko na možnost, a anonymní výsledek neobsahuje vůbec žádný identifikátor kontaktu.",
      "zh-Hans": "粉丝问一句，AI 回一则并扣 ai_message；告警到手机上是一张红卡，确认与解决各计一次 alert；投票卡每个选项一个按钮，匿名模式的结果里不出现任何联系人标识。",
      "zh-Hant": "粉絲問一句，AI 回一則並扣 ai_message；告警到手機上是一張紅卡，確認與解決各計一次 alert；投票卡每個選項一個按鈕，匿名模式的結果裡不出現任何聯絡人識別。",
      "es": "Un seguidor pregunta y el agente responde, cobrado como ai_message; una alerta llega como tarjeta roja, con ack y resolve cobrados cada uno como alerta; una encuesta dibuja un botón por opción, y un resultado anónimo no contiene identificador de contacto alguno.",
      "pl": "Odbiorca pyta, a agent odpowiada — naliczane jako ai_message; alert przychodzi jako czerwona karta, przy czym ack i resolve naliczane są każdy jako alert; ankieta rysuje jeden przycisk na opcję, a wynik anonimowy w ogóle nie zawiera identyfikatora kontaktu.",
      "ja": "フォロワーが尋ねればエージェントが答えますが、これは ai_message として課金されます。アラートは赤いカードとして届き、ack と resolve はそれぞれ alert として課金されます。投票は選択肢ぶんだけボタンを描き、匿名モードの結果には連絡先識別子が一切含まれません。",
      "th": "follower ถามแล้ว agent ตอบ จะถูกคิดเป็น ai_message; alert เข้ามาเป็นการ์ดสีแดง โดย ack กับ resolve คิดแยกกันเป็น alert แต่ละครั้ง; poll จะวาดปุ่มตามจำนวนตัวเลือก และผลแบบนิรนามจะไม่มี contact identifier ปนอยู่เลย",
      "fi": "Seuraaja kysyy ja agentti vastaa, veloitetaan ai_messagena; hälytys saapuu punaisena korttina, ja ack sekä resolve veloitetaan kumpikin alertina; kysely piirtää yhden painikkeen per vaihtoehto, ja anonyymi tulos ei sisällä contact-tunnistetta ollenkaan.",
      "uk": "Підписник питає, агент відповідає — списується як ai_message; алерт приходить червоною карткою, причому ack і resolve списуються кожен як alert; опитування малює по кнопці на варіант, а анонімний результат узагалі не містить ідентифікатора контакту.",
      "bg": "Последовател пита и агентът отговаря, таксува се като ai_message; тревога идва като червена карта, като ack и resolve се таксуват поотделно като alert; анкетата начертава един бутон на опция, а анонимният результат изобщо не съдържа контакт идентификатор.",
      "tr": "Takipçi sorar, ajan yanıtlar; bu ai_message olarak ücretlendirilir. Uyarı kırmızı kart olarak gelir ve ack ile resolve ayrı ayrı alert olarak ücretlendirilir. Anket her seçenek için bir düğme çizer; anonim sonuçta kontakt tanımlayıcısı hiç bulunmaz.",
      "hu": "A követő kérdez, az ügynök felel — ez ai_message-ként számítódik; a riasztás piros kártyaként érkezik, miközben az ack és a resolve külön-külön riasztásként számítódik; egy szavazás opçõesanként egy gombot rajzol, és egy névtelen eredmény egyáltalán nem tartalmaz kontakt-azonosítót.",
    },
    warn: {
      en: "Four plugins are on by default — ai_agent, alert_ops, privacy_sso and polls. The other five are opt-in and each has its own switch: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 and POPOPX_PLUGIN_SLACK_DISCORD=1; the connectors also need their CalDAV/CardDAV settings before a query stops answering 409 not_configured. A disabled or unmounted plugin answers 404 and the panel spells that reason out underneath. A poll created with an empty target list is created but delivered to nobody. Slack and Discord delivery is offline-tested only, not live-verified.",
      "ru": "Четыре плагина включены по умолчанию — ai_agent, alert_ops, privacy_sso и polls. Остальные пять опциональны, и у каждого свой переключатель: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 и POPOPX_PLUGIN_SLACK_DISCORD=1; коннекторам вдобавок нужны свои настройки CardDAV/CalDAV, иначе запрос отвечает 409 not_configured. Выключенный или не смонтированный плагин отвечает 404, и панель прописывает эту причину ниже. Опрос с пустым списком получателей создаётся, но не доставляется никому. Доставка в Slack и Discord проверена только офлайн, не на живых сервисах.",
      "de": "Vier Plugins sind standardmäßig an — ai_agent, alert_ops, privacy_sso und polls. Die anderen fünf sind optional und haben je ihren eigenen Schalter: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 und POPOPX_PLUGIN_SLACK_DISCORD=1; die Konnektoren brauchen außerdem ihre CardDAV-/CalDAV-Einstellungen, sonst antwortet eine Abfrage mit 409 not_configured. Ein deaktiviertes oder nicht gemountetes Plugin antwortet 404, und das Panel schreibt den Grund darunter. Eine Umfrage mit leerer Empfängerliste wird angelegt, aber an niemanden zugestellt. Die Zustellung an Slack und Discord ist nur offline getestet, nicht live verifiziert.",
      "fr": "Quatre plugins sont actifs par défaut — ai_agent, alert_ops, privacy_sso et polls. Les cinq autres sont optionnels et chacun a son propre interrupteur : POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 et POPOPX_PLUGIN_SLACK_DISCORD=1 ; les connecteurs ont en plus besoin de leurs réglages CardDAV/CalDAV, sinon une requête répond 409 not_configured. Un plugin désactivé ou non monté répond 404, et le panneau inscrit cette raison en dessous. Un sondage créé avec une liste de destinataires vide est créé mais délivré à personne. La livraison vers Slack et Discord n'est testée qu'hors ligne, pas vérifiée en conditions réelles.",
      "it": "Quattro plugin sono attivi di default — ai_agent, alert_ops, privacy_sso e polls. Gli altri cinque sono opzionali e ognuno ha il proprio interruttore: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 e POPOPX_PLUGIN_SLACK_DISCORD=1; i connettori hanno inoltre bisogno delle proprie impostazioni CardDAV/CalDAV, altrimenti una query risponde 409 not_configured. Un plugin spento o non montato risponde 404, e il pannello scrive quella ragione sotto. Un sondaggio creato con una lista di destinatari vuota viene creato ma non consegnato a nessuno. La consegna verso Slack e Discord è testata solo offline, non verificata dal vivo.",
      "nl": "Vier plugins staan standaard aan — ai_agent, alert_ops, privacy_sso en polls. De andere vijf zijn optioneel en hebben elk hun eigen schakelaar: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 en POPOPX_PLUGIN_SLACK_DISCORD=1; de connectors hebben daarnaast hun eigen CardDAV/CalDAV-instellingen nodig, anders antwoordt een query met 409 not_configured. Een uitgeschakelde of niet-gemounte plugin antwoordt 404 en het paneel schrijft die reden eronder. Een poll die met een lege ontvangerslijst wordt aangemaakt, wordt aangemaakt maar aan niemand bezorgd. Levering aan Slack en Discord is alleen offline getest, niet live geverifieerd.",
      "cs": "Čtyři pluginy jsou ve výchozím stavu zapnuté — ai_agent, alert_ops, privacy_sso a polls. Zbylých pět je volitelných a každý má vlastní přepínač: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 a POPOPX_PLUGIN_SLACK_DISCORD=1; konektory navíc potřebují své nastavení CardDAV/CalDAV, jinak dotaz odpovídá 409 not_configured. Vypnutý nebo nenamontovaný plugin odpoví 404 a panel ten důvod vypíše pod to. Anketa vytvořená s prázdným seznamem příjemců je vytvořena, ale nikomu nedoručena. Doručování do Slacku a Discordu je testováno jen offline, neověřeno naživo.",
      "zh-Hans": "四个插件默认开启：ai_agent、alert_ops、privacy_sso、polls。其余五个是可选插件，各有自己的开关：POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1；两个通讯录插件还需填好各自的 CardDAV/CalDAV 配置，否则查询会回 409 not_configured。插件被关闭或未装载时后台读到的是一条 404，面板把这层原因写在下面；空 targets 的投票会被创建但不发给任何人。Slack 与 Discord 的投递只做过离线测试，未做真实服务验证。",
      "zh-Hant": "四個插件預設開啟：ai_agent、alert_ops、privacy_sso、polls。其餘五個是選用插件，各有自己的開關：POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1；兩個通訊錄插件還需填好各自的 CardDAV/CalDAV 設定，否則查詢會回 409 not_configured。插件被關閉或未裝載時後臺讀到的是一條 404，面板把這層原因寫在下面；空 targets 的投票會被建立但不發給任何人。Slack 與 Discord 的投遞只做過離線測試，未做真實服務驗證。",
      "es": "Cuatro plugins vienen activos por defecto — ai_agent, alert_ops, privacy_sso y polls. Los otros cinco son opcionales y cada uno tiene su propio interruptor: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 y POPOPX_PLUGIN_SLACK_DISCORD=1; los conectores además necesitan sus ajustes de CardDAV/CalDAV, o una consulta responde 409 not_configured. Un plugin apagado o no montado responde 404, y el panel escribe esa razón debajo. Una encuesta creada con una lista de destinatarios vacía se crea pero no se entrega a nadie. La entrega a Slack y Discord solo se ha probado sin conexión, no verificada en vivo.",
      "pl": "Cztery wtyczki są domyślnie włączone — ai_agent, alert_ops, privacy_sso i polls. Pozostałe pięć jest opcjonalnych i każda ma własny przełącznik: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 i POPOPX_PLUGIN_SLACK_DISCORD=1; konektory potrzebują jeszcze swoich ustawień CardDAV/CalDAV, inaczej zapytanie odpowiada 409 not_configured. Wyłączona lub niezamontowana wtyczka odpowiada 404, a panel wypisuje tę przyczynę pod spodem. Ankieta utworzona z pustą listą odbiorców zostaje utworzona, ale do nikogo nie trafia. Dostarczanie do Slacka i Discorda jest testowane tylko offline, niezweryfikowane na żywo.",
      "ja": "既定でオンのプラグインは4つ — ai_agent、alert_ops、privacy_sso、polls です。残り5つはオプトインで、それぞれ専用のスイッチがあります: POPOPX_PLUGIN_WEB3_BRIDGE=1、POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1、POPOPX_PLUGIN_CARDDAV_CONNECTOR=1、POPOPX_PLUGIN_CALDAV_CONNECTOR=1、POPOPX_PLUGIN_SLACK_DISCORD=1。コネクタはさらに CardDAV/CalDAV の設定が必要で、未設定ならクエリは 409 not_configured を返します。オフまたはマウントされていないプラグインは 404 を返し、パネルはその理由を下に書いておきます。宛先リストが空の投票は作成されるだけで、誰にも配信されません。Slack と Discord への配信はオフラインテストのみで、実サービスでの検証はしていません。",
      "th": "ปลั๊กอินที่เปิดอยู่โดยค่าเริ่มต้นมีสี่ตัว คือ ai_agent, alert_ops, privacy_sso และ polls ส่วนอีกห้าเป็นแบบเลือกใช้และมีสวิตช์ของตัวเอง: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 และ POPOPX_PLUGIN_SLACK_DISCORD=1 ตัวคอนเนกเตอร์ยังต้องตั้งค่า CardDAV/CalDAV ของตัวเองก่อน ไม่งั้นคำค้นจะตอบ 409 not_configured ปลั๊กอินที่ปิดหรือไม่ได้ mount จะตอบ 404 และแผงจะเขียนเหตุผลไว้ข้างใต้ ส่วนโพลที่สร้างด้วยรายการผู้รับว่างเปล่าจะถูกสร้างจริง แต่ไม่ส่งให้ใครเลย การส่งออกไป Slack และ Discord ผ่านการทดสอบแบบออฟไลน์เท่านั้น ยังไม่ได้ตรวจกับบริการจริง",
      "fi": "Neljä pluginia on oletuksena päällä — ai_agent, alert_ops, privacy_sso ja polls. Loput viisi ovat valinnaisia, ja jokaisella on oma kytkimensä: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 ja POPOPX_PLUGIN_SLACK_DISCORD=1; liittimet tarvitsevat lisäksi omat CardDAV/CalDAV-asetuksensa, muuten kysely vastaa 409 not_configured. Poissa oleva tai mountaamaton plugin vastaa 404, ja paneeli kirjoittaa sen syyn alle. Tyhjällä vastaanottajalistalla luotu kysely luodaan, mutta ei toimiteta kenellekään. Slack- ja Discord-toimitus on testattu vain offline, ei livessä.",
      "uk": "Чотири плагіни увімкнені типово — ai_agent, alert_ops, privacy_sso і polls. Решта п'ять опційні, і кожен має власний перемикач: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 і POPOPX_PLUGIN_SLACK_DISCORD=1; конекторам ще потрібні власні налаштування CardDAV/CalDAV, інакше запит відповідає 409 not_configured. Вимкнений або незмонтований плагин відповідає 404, і панель виписує цю причину нижче. Опитування, створене з порожнім списком отримувачів, створюється, але нікому не доставляється. Доставка в Slack і Discord перевірена лише офлайн, не на живих сервісах.",
      "bg": "Четири приставки са включени по подразбиране — ai_agent, alert_ops, privacy_sso и polls. Останалите пет са опционални и всяка има свой превключвател: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 и POPOPX_PLUGIN_SLACK_DISCORD=1; конекторите освен това се нуждаят от своите CardDAV/CalDAV настройки, иначе заявката отговаря 409 not_configured. Изключена или немонтирана приставка отговаря 404, и панелът изписва причината под нея. Анкета, създадена с празен списък на получателите, се създава, но не се доставя на никого. Доставката към Slack и Discord е тествана само офлайн, не е проверена на живо.",
      "tr": "Dört eklenti varsayılan olarak açıktır — ai_agent, alert_ops, privacy_sso ve polls. Diğer beşi isteğe bağlıdır ve her birinin kendi anahtarı vardır: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 ve POPOPX_PLUGIN_SLACK_DISCORD=1; bağlayıcılar ayrıca kendi CardDAV/CalDAV ayarlarına ihtiyaç duyar, yoksa sorgu 409 not_configured döner. Kapalı ya da bağlanmamış bir eklenti 404 döner ve panel bu nedeni alta yazar. Alıcı listesi boşken oluşturulan anket oluşturulur ama kimseye teslim edilmez. Slack ve Discord'a teslimat yalnızca çevrimdışı test edilmiştir, canlı doğrulanmamıştır.",
      "hu": "Négy bővítmény alapból be van kapcsolva — ai_agent, alert_ops, privacy_sso és polls. A másik öt opcionális, és mindegyiknek saját kapcsolója van: POPOPX_PLUGIN_WEB3_BRIDGE=1, POPOPX_PLUGIN_WORKFLOW_WEBHOOK=1, POPOPX_PLUGIN_CARDDAV_CONNECTOR=1, POPOPX_PLUGIN_CALDAV_CONNECTOR=1 és POPOPX_PLUGIN_SLACK_DISCORD=1; a konnektoroknak emellett saját CardDAV/CalDAV beállításuk is kell, különben a lekérdezés 409 not_configured választ ad. Egy kikapcsolt vagy fel nem szerelt bővítmény 404-gel válaszol, és a panel alája írja az okot. Egy üres címzettlistával készült szavazás létrejön, de senkihez sem érkezik meg. A Slack és Discord felé történő kézbesítés csak offline tesztelt, élesben nem ellenőrzött.",
    },
  },
  {
    no: "4",
    title: {
      en: "Zero-knowledge channels and key rotation",
      "ru": "Каналы с нулевым разглашением и ротация ключей",
      "de": "Kanäle mit Zero-Knowledge und Schlüsselrotation",
      "fr": "Canaux à connaissance nulle et rotation de clés",
      "it": "Canali a conoscenza zero e rotazione delle chiavi",
      "nl": "Zero-knowledge-kanalen en sleutelrotatie",
      "cs": "Kanály s nulovou znalostí a rotace klíčů",
      "zh-Hans": "加密频道联动与轮换密钥",
      "zh-Hant": "加密頻道聯動與輪換金鑰",
      "es": "Canales de conocimiento cero y rotación de claves",
      "pl": "Kanały zero-knowledge i rotacja kluczy",
      "ja": "ゼロ知識のチャンネルと鍵のローテーション",
      "th": "ช่องแบบ zero-knowledge และการหมุนเวียนคีย์",
      "fi": "Nollatiedon kanavat ja avainten kierrätys",
      "uk": "Канали з нульовим розголошенням і ротація ключів",
      "bg": "Канали с нулево разкриване и ротация на ключове",
      "tr": "Sıfır bilgi kanalları ve anahtar döndürme",
      "hu": "Nulla tudású csatornák és kulcsrotáció",
    },
    body: {
      en: "Creating a channel in Channels & key rotation takes a title and a relay hostname — the server hosting the node group. The channel identity private key never leaves the gateway; the only outward value is public_uri, which is a new member's single way in: importing it creates epoch 1, and every later epoch arrives by a key frame. The members block grants and revokes.",
      "ru": "Создание канала в Channels & key rotation берёт заголовок и hostname ретранслятора — сервера, который держит группу узлов. Приватный ключ идентификации канала не покидает шлюз; наружу выходит только public_uri, и для нового участника это единственная дверь: импорт создаёт epoch 1, а каждая следующая эпоха приходит key-кадром. Блок members раздаёт и отзывает доступ.",
      "de": "Das Anlegen eines Kanals in Channels & key rotation braucht einen Titel und einen Relay-Hostnamen — den Rechner, der die Knotengruppe hostet. Der private Schlüssel der Kanalidentität verlässt das Gateway nie; nach außen geht nur public_uri, und für ein neues Mitglied ist das der einzige Weg hinein: Importieren erzeugt epoch 1, und jede spätere Epoche kommt per key-frame. Der members-Block gewährt und entzieht.",
      "fr": "Créer un canal dans Channels & key rotation demande un titre et un hostname de relais — le serveur qui héberge le groupe de nœuds. La clé privée d'identité du canal ne quitte jamais la passerelle ; la seule valeur sortante est public_uri, et c'est l'unique entrée d'un nouveau membre : l'importer crée l'epoch 1, et chaque epoch suivante arrive par une trame de clé. Le bloc members accorde et révoque.",
      "it": "Creare un canale in Channels & key rotation prende un titolo e un hostname di relay — il server che ospita il gruppo di nodi. La chiave privata dell'identità del canale non lascia mai il gateway; verso l'esterno esce solo public_uri, ed è l'unica via d'ingresso per un nuovo membro: importarla crea l'epoch 1, e ogni epoch successiva arriva con un key-frame. Il blocco members concede e revoca.",
      "nl": "Een kanaal aanmaken in Channels & key rotation vraagt om een titel en een relay-hostname — de server die de knoopgroep host. De privésleutel van de kanaalidentiteit verlaat het gateway nooit; naar buiten gaat alleen public_uri, en dat is voor een nieuw lid de enige weg naar binnen: importeren creëert epoch 1, en elke latere epoch komt via een key-frame. Het members-blok verleent en ontneemt.",
      "cs": "Vytvoření kanálu v Channels & key rotation chce titulek a hostname relaye — serveru, který hostuje skupinu uzlů. Soukromý klíč identity kanálu nikdy neopustí bránu; ven jde jen public_uri, a pro nového člena je to jediná cesta dovnitř: import vytvoří epoch 1, a každá další epocha přijde key frame. Blok members povoluje a ruší.",
      "zh-Hans": "「频道与密钥轮换」新建频道要 title 和一个 relay 主机名，也就是节点群组所在的那台服务器；identity 私密钥永不离开网关，对外只给 public_uri——那是新成员唯一的导入入口，导入只创建 epoch 1，之后的每个 epoch 由密钥帧送达。成员区负责授权与收回。",
      "zh-Hant": "「頻道與金鑰輪換」新增頻道要 title 和一個 relay 主機名，也就是節點群組所在的那臺伺服器；identity 私密金鑰永不離開閘道，對外只給 public_uri——那是新成員唯一的匯入入口，匯入只建立 epoch 1，之後的每個 epoch 由金鑰幀送達。成員區負責授權與收回。",
      "es": "Crear un canal en Channels & key rotation pide un título y un hostname del relay — el servidor que aloja el grupo de nodos. La clave privada de la identidad del canal nunca sale de la pasarela; hacia fuera sólo va public_uri, y es la única entrada de un miembro nuevo: importarlo crea epoch 1, y cada epoch posterior llega en un key-frame. El bloque members concede y revoca.",
      "pl": "Utworzenie kanału w Channels & key rotation wymaga tytułu i hostname'u przekaźnika — serwera, który gości grupę węzłów. Prywatny klucz tożsamości kanału nigdy nie wychodzi z bramy; na zewnątrz idzie tylko public_uri i dla nowego uczestnika to jedyne wejście: zaimportowanie tworzy epoch 1, a każda późniejsza epoka przychodzi ramką klucza. Blok members przyznaje i cofa dostęp.",
      "ja": "Channels & key rotation でチャンネルを作るには、タイトルと、ノード群をホストしているリレーの hostname を入れます。チャンネル身元の秘密鍵はゲートウェイから外に出ません。外向きの値は public_uri だけで、新しいメンバーにとってはそれが唯一の入りのドアです。これを読み込むと epoch 1 が作られ、それ以降の epoch は key フレームで届きます。members ブロックが付与と剥奪を行います。",
      "th": "การสร้างช่องใน Channels & key rotation ต้องใส่ชื่อเรื่องกับ hostname ของ relay — คือเซิร์ฟเวอร์ที่โฮสต์โหนดกลุ่มนั้น private key ของ identity ช่องจะไม่ออกจาก gateway เลย ค่าเดียวที่ออกไปข้างนอกคือ public_uri และเป็นทางเข้าทางเดียวสำหรับสมาชิกใหม่: import เข้าไปจะได้ epoch 1 แล้ว epoch ถัดไปจะมาก่อนเป็น key-frame ส่วนบล็อก members จะเป็นตัวให้สิทธิ์กับเรียกสิทธิ์คืน",
      "fi": "Kanavan luominen Channels & key rotationissa vaatii otsikon ja relay-n isäntänimen — palvelimen, joka isännöi node-ryhmää. Kanavan identiteetin yksityinen avain ei koskaan poistu gatewaysta; ulos menee vain public_uri, ja se on uudelle jäsenelle ainoa tapa sisään: tuonti luo epoch 1, ja jokainen myöhempi epoch saapuu key-kehyksellä. members-lohko antaa ja peruuttaa.",
      "uk": "Створення каналу в Channels & key rotation бере заголовок і hostname релея — сервера, що тримає групу вузлів. Приватний ключ ідентичності каналу не полишає шлюз; назовні виходить лише public_uri, і для нового учасника це єдині входи: імпорт створює epoch 1, а кожна наступна епоха приходить key-кадром. Блок members надає та відкликає доступ.",
      "bg": "Създаването на канал в Channels & key rotation изисква заглавие и hostname на релето — сървърът, който хоства възел групата. Частният ключ на идентичността на канала никога не напуска шлюза; навън излиза само public_uri, и за нов член това е единственият път навътре: импортирането създава epoch 1, а всяка следваща епоха идва чрез key-кадър. Блокът members отстъпва и отнема.",
      "tr": "Channels & key rotation içinde kanal oluşturmak bir başlık ve bir relay hostname'i ister — düğüm kümesini barındıran sunucunun adını. Kanal kimliğinin özel anahtarı ağ geçidini asla terk etmez; dışarıya yalnızca public_uri çıkar ve yeni bir üye için tek giriş kapısı odur: içe almak epoch 1'i yaratır, sonraki her epoch bir key karesiyle gelir. members bloğu yetki verir ve geri alır.",
      "hu": "Csatorna létrehozása a Channels & key rotation panelen egy címet és egy relay hostname-t kér — annak a szervernek a nevét, amely a csomópont-csoportot látja el. A csatorna-azonosság privát kulcsa sosem hagyja el az átjárót; kifelé csak a public_uri megy, és egy új tag számára ez az egyetlen belépési út: a behívás epoch 1-et hoz létre, és minden későbbi epoch egy key-kerettel érkezik. A members blokk ad és von meg jogot.",
    },
    console: {
      en: "To put a price on the door, add a pay_credits button to a card with an amount in POPX-CP (1 to 100000) — the phone asks for a second confirmation before it charges, and no such button can live in the menu. A menu entry that opens the channel uses open_channel, and its payload is the public_uri you copied from this panel.",
      "ru": "Чтобы поставить цену на дверь, добавьте в карточку кнопку pay_credits с суммой в POPX-CP (от 1 до 100000) — телефон попросит второе подтверждение до списания, и такую кнопку нельзя разместить в меню. Пункт меню, открывающий канал, использует open_channel, и его payload — это public_uri, скопированный из этой панели.",
      "de": "Um die Tür zu bepreisen, hängen Sie in eine Karte einen pay_credits-Button mit einem Betrag in POPX-CP (1 bis 100000) — das Telefon verlangt vor der Abbuchung eine zweite Bestätigung, und ein solcher Button kann im Menü gar nicht leben. Ein Menüeintrag, der den Kanal öffnet, benutzt open_channel, und sein payload ist der public_uri, den Sie aus diesem Panel kopiert haben.",
      "fr": "Pour mettre un prix sur la porte, ajoutez à une carte un bouton pay_credits avec un montant en POPX-CP (1 à 100000) — le téléphone demande une seconde confirmation avant de débiter, et un tel bouton ne peut pas vivre dans le menu. Une entrée de menu qui ouvre le canal utilise open_channel, et son payload est le public_uri copié depuis ce panneau.",
      "it": "Per mettere un prezzo alla porta, aggiungi a una card un pulsante pay_credits con un importo in POPX-CP (da 1 a 100000) — il telefono chiede una seconda conferma prima di addebitare, e un pulsante del genere non può stare nel menu. Una voce di menu che apre il canale usa open_channel, e il suo payload è il public_uri che hai copiato da questo pannello.",
      "nl": "Om een prijs op de deur te zetten, voeg je aan een kaart een pay_credits-knop toe met een bedrag in POPX-CP (1 tot 100000) — de telefoon vraagt vóór het afboeken om een tweede bevestiging, en zo'n knop kan het menu helemaal niet in. Een menu-item dat het kanaal opent gebruikt open_channel, en zijn payload is de public_uri die u uit dit paneel kopieerde.",
      "cs": "Abyste ke dveřím dali cenu, přidejte do karty tlačítko pay_credits s částkou v POPX-CP (1 až 100000) — telefon před odečtením vyžádá druhé potvrzení, a takové tlačítko v menu být nemůže. Položka menu, která kanál otevírá, používá open_channel, a její payload je public_uri, které jste z tohoto panelu zkopírovali.",
      "zh-Hans": "要收费地开门，就在卡片上放一个 pay_credits 按钮并给 amount（POPX-CP，1 到 100000），客户端扣费前二次确认；这种按钮进不了菜单。频道入口在菜单里用 open_channel，payload 就是这一页复制走的 public_uri。",
      "zh-Hant": "要收費地開門，就在卡片上放一個 pay_credits 按鈕並給 amount（POPX-CP，1 到 100000），用戶端扣費前二次確認；這種按鈕進不了選單。頻道入口在選單裡用 open_channel，payload 就是這一頁複製走的 public_uri。",
      "es": "Para ponerle precio a la puerta, añada a una tarjeta un botón pay_credits con un importe en POPX-CP (de 1 a 100000) — el teléfono pide una segunda confirmación antes de cobrar, y un botón así no puede vivir en el menú. Un ítem de menú que abre el canal usa open_channel, y su payload es el public_uri que copió de este panel.",
      "pl": "Żeby wycenić drzwi, dodaj do karty przycisk pay_credits z kwotą w POPX-CP (od 1 do 100000) — telefon przed naliczeniem poprosi o drugie potwierdzenie, a taki przycisk w menu w ogóle nie może żyć. Pozycja menu, która otwiera kanał, używa open_channel, a jej payload to public_uri skopiowany z tego panelu.",
      "ja": "ドアに値段を付けるには、カードに pay_credits ボタンを置き、金額を POPX-CP で 1 から 100000 の範囲で指定します。スマホは課金前に2回目の確認を求めます。このボタンはメニューに置くことはできません。チャンネルを開くメニュー項目は open_channel を使い、その payload にはこのパネルからコピーした public_uri が入ります。",
      "th": "ถ้าจะตั้งราคาตรงประตู ให้ใส่ปุ่ม pay_credits ลงในการ์ดพร้อมจำนวนเป็น POPX-CP (1 ถึง 100000) — มือถือจะขอยืนยันครั้งที่สองก่อนตัดเครดิต และปุ่มแบบนี้เอามาไว้ใน menu ไม่ได้ ส่วนรายการ menu ที่เปิดช่องจะใช้ open_channel โดย payloadของมันคือ public_uri ที่ copy มาจากแผงนี้",
      "fi": "Asettaaksesi oven hintaan, lisää korttiin pay_credits-painike summalla POPX-CP (1 - 100000) — puhelin pyytää toista vahvistusta ennen veloitusta, ja tällainen painike ei voi asua valikossa ollenkaan. Valikkokohta, joka avaa kanavan, käyttää open_channelia, ja sen payload on public_uri, kopioit tästä paneelista.",
      "uk": "Щоб поставити ціну на двері, додайте в картку кнопку pay_credits із сумою в POPX-CP (від 1 до 100000) — телефон попросить друге підтвердження перед списанням, і таку кнопку не можна розмістити в меню. Пункт меню, що відкриває канал, використовує open_channel, а його payload — це public_uri, скопійований з цієї панелі.",
      "bg": "За да сложите цена на вратата, добавете в картата бутон pay_credits със сума в POPX-CP (от 1 до 100000) — телефонът иска второ потвърждение преди таксуването, и такъв бутон не може да живее в менюто. Елемент от менюто, който отваря канала, използва open_channel, а payload-ът му е public_uri, копиран от този панел.",
      "tr": "Kapıya fiyat koymak için bir karta, POPX-CP cinsinden bir tutarla (1-100000) pay_credits düğmesi ekleyin — telefon ücret almadan önce ikinci bir onay ister; böyle bir düğme menüde bulunamaz. Kanalı açan menü maddesi open_channel kullanır ve payload'ı bu panelden kopyaladığınız public_uri'dir.",
      "hu": "Hogy árat tegyen az ajtóra, tegyen egy kártyára pay_credits gombot, POPX-CP-ben megadott összeggel (1 és 100000 közt) — a telefon a terhelés előtt második megerősítést kér, és egy ilyen gomb a menüben egyáltalán nem kaphat helyet. Egy csatornát megnyitó menüpont open_channel-t használ, és a payload-a erről a panelről kimásolt public_uri.",
    },
    phone: {
      en: "The phone decrypts channel content with the epoch published after the rotation, having first verified the envelope signature and the epoch's self-consistency — a frame that fails is dropped whole. Revoking a member only stops future epochs; a key already on that phone stays on that phone.",
      "ru": "Телефон расшифровывает содержимое канала ключом эпохи, опубликованной после ротации, предварительно проверив подпись конверта и внутреннюю согласованность эпохи — не прошедший кадр выбрасывается целиком. Отзыв участника останавливает только будущие эпохи: ключ, уже попавший на телефон, на нём и останется.",
      "de": "Das Telefon entschüsselt den Kanalinhalt mit der nach der Rotation veröffentlichten Epoche, vorher prüft es die Umschlag-Signatur und die In-Sich-Stimmigkeit der Epoche — ein Frame, der durchfällt, wird komplett verworfen. Ein Mitglied zu widerrufen stoppt nur künftige Epochen; ein Schlüssel, der schon auf dem Telefon liegt, bleibt auf dem Telefon.",
      "fr": "Le téléphone déchiffre le contenu du canal avec l'epoch publiée après la rotation, après avoir vérifié la signature de l'enveloppe et la cohérence interne de l'epoch ; une trame qui échoue est jetée en entier. Révoquer un membre n'arrête que les epochs futures : une clé déjà sur le téléphone y reste.",
      "it": "Il telefono decifra il contenuto del canale con l'epoch pubblicata dopo la rotazione, avendo prima verificato la firma della busta e l'autoconsistenza dell'epoch; un frame che fallisce viene scartato per intero. Revocare un membro ferma solo le epoch future: una chiave già sul telefono resta sul telefono.",
      "nl": "De telefoon ontsleutelt kanaalinhoud met de epoch die na de rotatie gepubliceerd werd, nadat hij de handtekening van de envelop en de zelfconsistentie van de epoch heeft geverifieerd — een frame dat faalt wordt in zijn geheel gedumpt. Een lid intrekken stopt alleen toekomstige epochs; een sleutel die al op de telefoon staat, blijft op de telefoon.",
      "cs": "Telefon dešifruje obsah kanálu epochou vydanou po rotaci, přičemž nejdřív ověří podpis obálky a vnitřní konzistenci epochy — frame, který nep projde, zahodí celý. Odebrání člena zastaví jen budoucí epochy; klíč, který už je na telefonu, na telefonu zůstane.",
      "zh-Hans": "手机用轮换后的新密钥解密频道内容；客户端先验信封签名与 epoch 是否自洽，不成立就整帧丢掉。收回某位成员只是让他不再收后续 epoch，手机里已有的旧密钥不会被撤销。",
      "zh-Hant": "手機用輪換後的新金鑰解密頻道內容；用戶端先驗信封簽名與 epoch 是否自洽，不成立就整幀丟掉。收回某位成員只是讓他不再收後續 epoch，手機裡已有的舊金鑰不會被撤銷。",
      "es": "El teléfono descifra el contenido del canal con la epoch publicada después de la rotación, tras verificar la firma del sobre y la autoconsistencia de la epoch; un frame que falla se descarta entero. Revocar a un miembro sólo detiene las epochs futuras: una clave que ya está en el teléfono se queda en el teléfono.",
      "pl": "Telefon deszyfruje treść kanału kluczem epoki opublikowanym po rotacji, wcześniej weryfikując podpis koperty i samospójność epoki — ramka, która nie przechodzi, jest wyrzucana w całości. Cofnięcie uczestnika zatrzymuje tylko przyszłe epoki; klucz, który już jest na telefonie, na telefonie zostaje.",
      "ja": "スマホは、チャンネルの内容をローテーション後に公開された epoch の鍵で復号します。その前にエンベロープの署名と epoch の自己整合性を検証しており、失敗したフレームは丸ごと破棄されます。メンバーを取り消しても止まるのは今後の epoch だけで、すでにスマホにある鍵はそのままスマホに残ります。",
      "th": "มือถือจะถอดรหัสเนื้อหาของช่องด้วยคีย์ของ epoch ที่ประกาศหลังจากการหมุนเวียน โดยตรวจลายเซ็นของซองกับความสอดคล้องในตัวเองของ epoch ก่อน — frame ที่ไม่ผ่านจะถูกทิ้งทั้งอัน การเรียกคืนสมาชิกหยุดได้แค่ epoch ในอนาคตเท่านั้น ส่วนคีย์ที่อยู่ในมือถือไปแล้วก็จะอยู่ในเครื่องนั้นต่อไป",
      "fi": "Puhelin purkaa kanavan sisällön kierrättämisen jälkeen julkaistulla epoch-avaimella, kun se ensin on varmistanut kirjeen signatuurin ja epochan itseensä täsmäävyyden — kehys, joka ei läpäise, heitetään pois kokonaan. Jäsenen peruuttaminen pysäyttää vain tulevat epochit; puhelimessa oleva avain jää puhetimeen.",
      "uk": "Телефон розшифровує вміст каналу ключем епохи, опублікованої після ротації, попередньо перевіривши підпис конверта та внутрішню узгодженість епохи — кадр, що не проходить, викидається цілком. Відкликання учасника зупиняє лише майбутні епохи: ключ, який уже на телефоні, на ньому й лишиться.",
      "bg": "Телефонът разшифрова съдържанието на канала с епохата, публикувана след ротацията, като първо е проверил подписа на плика и вътрешната съгласуваност на епохата — кадър, който се провали, се изхвърля цял. Отмяната на член спира само бъдещите епохи; ключ, който вече е на телефона, си остава на телефона.",
      "tr": "Telefon, kanal içeriğini döndürmeden sonra yayınlanan epoch anahtarıyla çözer; önce zarf imzasını ve epoch'un kendi içinde tutarlılığını doğrular — başarısız bir kare bütün olarak düşürülür. Bir üyeyi geri almak yalnızca gelecek epoch'ları durdurur; telefona zaten inmiş bir anahtar telefonda kalır.",
      "hu": "A telefon a csatorna tartalmát a rotáció után közzétett epoch kulcsával fejti vissza, méghozzá azelőtt, hogy ellenőrizte a boríték aláírását és az epoch összeférhetőségét — egy bukjó keretet egészen eldob. Egy tag visszavonása csak a jövőbeli epochokat állítja meg; a telefonon már ott lévő kulcs a telefonon marad.",
    },
    warn: {
      en: "Rotation is metered per member as key_rotation, 2 POPX-CP each by default. The console puts that price in front of you before you click — the estimate is active members times the unit price — and the README's own advice is to rehearse on a small group rather than try it on a channel of 4000. Leave notify_members off and only this channel's epoch record advances, so members never get the new key; the number of members a delivery failed for comes back in errors.",
      "ru": "Ротация тарифицируется key_rotation по числу участников, по умолчанию 2 POPX-CP за каждого. Консоль показывает эту цену до нажатия — оценка равна числу активных участников, умноженному на цену за единицу, — а README сам советует сначала репетировать на маленькой группе, а не пробовать на канале в 4000. Снятый notify_members продвигает только запись эпохи этого канала, поэтому участники новый ключ не получат; число участников, для которых доставка не удалась, приходит в errors.",
      "de": "Rotation wird über key_rotation pro Mitglied gemessen, standardmäßig 2 POPX-CP für jedes. Die Konsole stellt Ihnen diesen Preis vor dem Klick entgegen — die Schätzung ist aktive Mitglieder mal Stückpreis —, und das README rät selbst, erst an einer kleinen Gruppe zu proben statt an einem Kanal mit 4000. Lassen Sie notify_members aus, rückt nur die Epochen-Aufzeichnung dieses Kanals vor, die Mitglieder bekommen den neuen Schlüssel nie; wie viele Zustellungen fehlgeschlagen sind, kommt in errors zurück.",
      "fr": "La rotation est facturée via key_rotation par membre, 2 POPX-CP chacun par défaut. La console affiche ce prix avant le clic — l'estimation, c'est le nombre de membres actifs multiplié par le prix unitaire — et le README conseille lui-même de répéter sur un petit groupe plutôt que d'essayer sur un canal de 4000. Laissez notify_members éteint et seule l'enregistrement d'epoch de ce canal avance, les membres ne reçoivent jamais la nouvelle clé ; le nombre de membres dont la livraison a échoué revient dans errors.",
      "it": "La rotazione è misurata tramite key_rotation per membro, 2 POPX-CP ciascuno di default. La console ti mette quel prezzo davanti prima del click — la stima è membri attivi per il prezzo unitario — e il README stesso consiglia di fare le prove su un gruppo piccolo invece che su un canale da 4000. Lascia spento notify_members e solo il record dell'epoch di questo canale avanza, i membri non ricevono mai la nuova chiave; il numero di membri per cui la consegna è fallita torna in errors.",
      "nl": "Rotatie wordt via key_rotation per lid gemeten, standaard 2 POPX-CP per stuk. De console legt u die prijs voor met een klik — de raming is actieve leden maal de stukprijs — en het README raadt zelf aan om eerst op een kleine groep te oefenen in plaats van op een kanaal van 4000. Laat notify_members uit en alleen het epoch-record van dit kanaal schuift door, de leden krijgen de nieuwe sleutel nooit; het aantal leden waarvan de bezorging mislukte komt terug in errors.",
      "cs": "Rotace se měří přes key_rotation na člena, ve výchozím stavu 2 POPX-CP za kus. Konzole vám tu cenu ukáže před kliknutím — odhad = aktivní členové krát jednotková cena — a README samo radí nejdřív si to vyzkoušet na malé skupině, ne na kanálu s 4000. Nechte notify_members vypnutý a posune se jen záznam epochy tohoto kanálu, členové nový klíč nikdy nedostanou; počet členů, kterým doručení selhalo, se vrací v errors.",
      "zh-Hans": "轮换按每位成员计 key_rotation，默认每人 2 POPX-CP。后台在你点下去之前就把价钱摆出来：预估等于有效成员数乘以单价，README 的原话是先在小组上排练、别拿 4000 人的频道试手。notify_members 不勾就只前进本频道的 epoch 记录，成员拿不到新密钥；未送达的成员数在响应的 errors 里。",
      "zh-Hant": "輪換按每位成員計 key_rotation，預設每人 2 POPX-CP。後臺在你點下去之前就把價錢擺出來：預估等於有效成員數乘以單價，README 的原話是先在小組上排練、別拿 4000 人的頻道試手。notify_members 不勾就只前進本頻道的 epoch 記錄，成員拿不到新金鑰；未送達的成員數在回應的 errors 裡。",
      "es": "La rotación se mide con key_rotation por miembro, por defecto 2 POPX-CP cada uno. La consola le pone ese precio delante antes del clic — la estimación es miembros activos por precio unitario — y el README mismo aconseja ensayar en un grupo pequeño en vez de probarlo en un canal de 4000. Deje notify_members apagado y solo el registro de epoch de ese canal avanza, los miembros nunca reciben la clave nueva; el número de miembros cuya entrega falló regresa en errors.",
      "pl": "Rotacja jest naliczana przez key_rotation od uczestnika, domyślnie po 2 POPX-CP. Konsola pokazuje tę cenę, zanim klikniesz — szacunek to aktywni uczestnicy razy cena jednostkowa — a samo README radzi przećwiczyć to na małej grupie, zamiast próbować na kanale z 4000 osobami. Zostaw notify_members wyłączone, a tylko zapis epoki tego kanału posunie się naprzód, uczestnicy nigdy nie dostaną nowego klucza; liczba uczestników, do których dostawa nie dotarła, wraca w errors.",
      "ja": "ローテーションは key_rotation として参加者1人ごとに課金され、既定では1人あたり 2 POPX-CP です。コンソールはクリックする前にその金額を表示します。見積もりはアクティブな参加者数×単価です。README 自体が、4000人のチャンネルで試す前に小さなグループで練習しておくことを勧めています。notify_members をオフにすると進むのはそのチャンネルの epoch レコードだけで、メンバーに新しい鍵は届きません。配信に失敗したメンバー数は errors で返ってきます。",
      "th": "การหมุนเวียนจะคิดเป็น key_rotation ต่อสมาชิก โดย default อยู่ที่ 2 POPX-CP ต่อคน คอนโซลแสดงราคานี้ให้ดูก่อนกด — ค่าประมาณคือจำนวนสมาชิกที่ active คูณด้วยราคาต่อหน่วย — และ README ยังแนะนำเองว่าให้ไปซ้อมกับกลุ่มเล็กๆ ก่อน ไม่ใช่ไปลองกับช่องที่มี 4000 คน ถ้าไม่เปิด notify_members จะมีแค่ record epoch ของช่องนี้ที่เดินต่อ สมาชิกจะไม่ได้คีย์ใหม่เลย ส่วนจำนวนสมาชิกที่ส่งไม่สำเร็จจะกลับมาใน errors",
      "fi": "Kierrätys mitataan key_rotationilla jäsentä kohti, oletuksena 2 POPX-CP kpl. Konsoli näyttää hinnan sinulle ennen klikkausta — arvio on aktiiviset jäsenet kertaa yksikköhinta — ja README itse neuvoo harjoittelemaan ensin pienessä ryhmässä eikä 4000 hengen kanavalla. Jätä notify_members pois päältä, niin vain tämän kanavan epoch-tietue etenee eivätkä jäsenet koskaan saa uutta avainta; niiden jäsenten määrä, joille toimitus epäonnistui, tulee takaisin errors-kentässä.",
      "uk": "Ротація тарифікується через key_rotation за учасника, типово по 2 POPX-CP на кожного. Консоль показує цю ціну ще до натискання — оцінка це активні учасники, помножені на ціну за одиницю, — а сам README радить спершу репетирувати на невеликій групі, а не пробувати на каналі з 4000. Зніміть notify_members, і рухатиметься лише запис епохи цього каналу, учасники нового ключа не отримають; кількість учасників, для яких доставка не вдалася, повертається в errors.",
      "bg": "Ротацията се мери чрез key_rotation на участник, по подразбиране 2 POPX-CP за човек. Конзолата ви показва тази цена преди клика — оценката е активни членове по единична цена — и README сам съветва да репетирате на малка група, вместо да пробвате на канал с 4000. Оставете notify_members изключен и само записът на епохата на този канал мърда, членовете никога не получават новия ключ; броят на членовете, за които доставката се провали, се връща в errors.",
      "tr": "Döndürme key_rotation ile üye başına ölçülür; varsayılan üye başına 2 POPX-CP. Konsol tıklamadan önce bu fiyatı önünüze koyar — tahmin, etkin üye sayısı çarpı birim fiyattır — ve README'nin kendi tavsiyesi, 4000 kişilik kanalda denemek yerine önce küçük bir grup üzerinde provayı yapmaktır. notify_members kapalı bırakılırsa yalnızca bu kanalın epoch kaydı ilerler, üyeler yeni anahtarı asla almaz; teslimin başarısız olduğu üye sayısı errors içinde geri döner.",
      "hu": "A rotációt a key_rotation számolja tagságonként, alapértelmezés szerint darabonként 2 POPX-CP. A konzol az árat a kattintás előtt eléd tárja — a becslés az aktív tagok szorozva az egységár —, és a README maga tanácsolja, hogy előbb egy kis csoporton gyakorolj, ne egy 4000 fős csatornán próbáld ki. Ha a notify_members-t kikapcsolva hagyod, csak ennek a csatornának az epoch-bejegyzése lépi előre, és a tagok sosem kapják meg az új kulcsot; a sikertelen kiszállítások száma az errors mezőben jön vissza.",
    },
  },
];

const CHECKLIST: L[] = [
  {
    en: "POPOPX_ADMIN_TOKEN in .env is one you generated, not the example value: missing, shorter than 24 characters, or still an example all refuse to boot.",
    "ru": "POPOPX_ADMIN_TOKEN в .env — тот, который вы сгенерировали, а не примерный: отсутствие, длина меньше 24 символов или всё ещё примерное значение — всё это отказывает запуску.",
    "de": "POPOPX_ADMIN_TOKEN in .env ist ein von Ihnen erzeugter, nicht der Beispielwert: fehlt er, ist er kürzer als 24 Zeichen oder noch ein Beispiel — all das verweigert den Start.",
    "fr": "POPOPX_ADMIN_TOKEN dans .env est une valeur que vous avez générée, pas la valeur d'exemple : absente, plus courte que 24 caractères ou encore un exemple, tout refuse le démarrage.",
    "it": "POPOPX_ADMIN_TOKEN in .env è uno che hai generato tu, non il valore d'esempio: assente, più corto di 24 caratteri o ancora un esempio, tutti rifiutano l'avvio.",
    "nl": "POPOPX_ADMIN_TOKEN in .env is een die u zelf genereerde, niet de voorbeeldwaarde: ontbreekt hij, is hij korter dan 24 tekens of nog een voorbeeld, dan weigert alles de start.",
    "cs": "POPOPX_ADMIN_TOKEN v .env je takový, který jste vygenerovali, ne ukázková hodnota: chybí, je kratší než 24 znaků, nebo je stále ukázkový — to vše odmítne start.",
    "zh-Hans": ".env 里的 POPOPX_ADMIN_TOKEN 是自己生成的，不是示例值——缺失、短于 24 字符、仍是示例值都会拒绝启动。",
    "zh-Hant": ".env 裡的 POPOPX_ADMIN_TOKEN 是自己產生的，不是示例值——遺失、短於 24 字元、仍是示例值都會拒絕啟動。",
    "es": "POPOPX_ADMIN_TOKEN en .env es uno que usted generó, no el valor de ejemplo: ausente, más corto de 24 caracteres o todavía un ejemplo, todo ello rechaza el arranque.",
    "pl": "POPOPX_ADMIN_TOKEN w .env to taki, który sami wygenerowaliście, nie wartość przykładowa: brak, długość mniejsza niż 24 znaki albo nadal przykład — wszystko to odmawia startu.",
    "ja": ".env の POPOPX_ADMIN_TOKEN は自分で生成した値であり、サンプルの値ではありません。無い、24文字より短い、まだサンプルのまま、いずれでも起動が拒否されます。",
    "th": "POPOPX_ADMIN_TOKEN ใน .env ต้องเป็นค่าที่คุณสร้างเอง ไม่ใช่ค่าตัวอย่าง — ถ้าหาย สั้นกว่า 24 ตัวอักษร หรือยังเป็นค่าตัวอย่าง อยู่ ระบบจะไม่ยอมบูต",
    "fi": "POPOPX_ADMIN_TOKEN .env:ssä on itse generoimasi, ei esimerkkiarvo: puuttuva, lyhyempi kuin 24 merkkiä tai yhä esimerkki — kaikki ne kieltäytyvät käynnistymästä.",
    "uk": "POPOPX_ADMIN_TOKEN у .env — той, що ви згенерували самі, а не прикладний: відсутність, довжина менша за 24 символи чи досі приклад — усе це відмовляє запуску.",
    "bg": "POPOPX_ADMIN_TOKEN в .env е генерираният от вас, не примерната стойност: липсващ, по-къс от 24 символа или все още пример — всичко това отказва старта.",
    "tr": ".env içindeki POPOPX_ADMIN_TOKEN sizin ürettiğiniz olmalı, örnek değer değil: eksikse, 24 karakterden kısaysa ya da hâlâ örnek değerse açılış reddedilir.",
    "hu": "A .env-ben lévő POPOPX_ADMIN_TOKEN az Ön által generált, nem a példaérték: hiányzó, 24 karakternél rövidebb vagy még mindig példaérték — mindegyik megtagadja az indulást.",
  },
  {
    en: "One command brings it up: ./start_macos.sh for development, sudo ./install_ubuntu22.sh or sudo ./install_macos.sh for production.",
    "ru": "Одна команда всё поднимает: ./start_macos.sh для разработки, sudo ./install_ubuntu22.sh или sudo ./install_macos.sh для продакшена.",
    "de": "Ein Befehl bringt alles hoch: ./start_macos.sh für die Entwicklung, sudo ./install_ubuntu22.sh oder sudo ./install_macos.sh für die Produktion.",
    "fr": "Une commande suffit pour tout lancer : ./start_macos.sh pour le développement, sudo ./install_ubuntu22.sh ou sudo ./install_macos.sh pour la production.",
    "it": "Un comando e parte tutto: ./start_macos.sh per lo sviluppo, sudo ./install_ubuntu22.sh oppure sudo ./install_macos.sh per la produzione.",
    "nl": "Eén commando brengt alles omhoog: ./start_macos.sh voor ontwikkeling, sudo ./install_ubuntu22.sh of sudo ./install_macos.sh voor productie.",
    "cs": "Jeden příkaz alles postaví: ./start_macos.sh pro vývoj, sudo ./install_ubuntu22.sh nebo sudo ./install_macos.sh pro produkci.",
    "zh-Hans": "一条命令起服务：开发用 ./start_macos.sh，生产用 sudo ./install_ubuntu22.sh 或 sudo ./install_macos.sh。",
    "zh-Hant": "一行指令起服務：開發用 ./start_macos.sh，生產用 sudo ./install_ubuntu22.sh 或 sudo ./install_macos.sh。",
    "es": "Un comando levanta todo: ./start_macos.sh para desarrollo, sudo ./install_ubuntu22.sh o sudo ./install_macos.sh para producción.",
    "pl": "Jedno polecenie wszystko podnosi: ./start_macos.sh do rozwoju, sudo ./install_ubuntu22.sh albo sudo ./install_macos.sh do produkcji.",
    "ja": "コマンド1つで起動します。開発なら ./start_macos.sh、本番なら sudo ./install_ubuntu22.sh または sudo ./install_macos.sh。",
    "th": "คำสั่งเดียวก็ตั้งทุกอย่างขึ้นมาได้: ฝั่งพัฒนาใช้ ./start_macos.sh ส่วนงานจริงใช้ sudo ./install_ubuntu22.sh หรือ sudo ./install_macos.sh",
    "fi": "Yksi komento pystyttää kaiken: ./start_macos.sh kehitykseen, sudo ./install_ubuntu22.sh tai sudo ./install_macos.sh tuotantoon.",
    "uk": "Одна команда все піднімає: ./start_macos.sh для розробки, sudo ./install_ubuntu22.sh або sudo ./install_macos.sh для продакшну.",
    "bg": "Една команда вдига всичко: ./start_macos.sh за разработка, sudo ./install_ubuntu22.sh или sudo ./install_macos.sh за продукция.",
    "tr": "Tek komut her şeyi ayağa kaldırır: geliştirme için ./start_macos.sh, üretim için sudo ./install_ubuntu22.sh ya da sudo ./install_macos.sh.",
    "hu": "Egy parancs felhúzza az egészet: fejlesztéshez ./start_macos.sh, éles környezethez sudo ./install_ubuntu22.sh vagy sudo ./install_macos.sh.",
  },
  {
    en: "curl -s http://127.0.0.1:8080/healthz answers — and node_connected: false is not a panic, the gateway is serving.",
    "ru": "curl -s http://127.0.0.1:8080/healthz отвечает — и node_connected: false это не паника, шлюз раздаёт.",
    "de": "curl -s http://127.0.0.1:8080/healthz antwortet — und node_connected: false ist keine Panik, das Gateway bedient.",
    "fr": "curl -s http://127.0.0.1:8080/healthz répond — et node_connected: false n'est pas une panique, la passerelle sert.",
    "it": "curl -s http://127.0.0.1:8080/healthz risponde — e node_connected: false non è un panico, il gateway sta servendo.",
    "nl": "curl -s http://127.0.0.1:8080/healthz antwoordt — en node_connected: false is geen paniek, de gateway bedient.",
    "cs": "curl -s http://127.0.0.1:8080/healthz odpovídá — a node_connected: false není panika, brána obsluhuje.",
    "zh-Hans": "curl -s http://127.0.0.1:8080/healthz 有响应；node_connected 是 false 也先别慌，网关在服务。",
    "zh-Hant": "curl -s http://127.0.0.1:8080/healthz 有回應；node_connected 是 false 也先別慌，閘道在服務。",
    "es": "curl -s http://127.0.0.1:8080/healthz responde — y node_connected: false no es pánico, la pasarela está sirviendo.",
    "pl": "curl -s http://127.0.0.1:8080/healthz odpowiada — a node_connected: false to nie panika, brama obsługuje.",
    "ja": "curl -s http://127.0.0.1:8080/healthz が応答します。node_connected: false はパニックではありません。ゲートウェイは普通にサービスを返しています。",
    "th": "curl -s http://127.0.0.1:8080/healthz ตอบกลับมา — และ node_connected: false ไม่ใช่เรื่องแตกตื่น gateway ยังให้บริการอยู่",
    "fi": "curl -s http://127.0.0.1:8080/healthz vastaa — ja node_connected: false ei ole paniikkia, gateway palvelee.",
    "uk": "curl -s http://127.0.0.1:8080/healthz відповідає — і node_connected: false це не паніка, шлюз обслуговує.",
    "bg": "curl -s http://127.0.0.1:8080/healthz отговаря — и node_connected: false не е паника, шлюзът обслужва.",
    "tr": "curl -s http://127.0.0.1:8080/healthz yanıt veriyor — node_connected: false panik değil, ağ geçidi hizmet veriyor.",
    "hu": "A curl -s http://127.0.0.1:8080/healthz válaszol — és a node_connected: false nem pánik, az átjáró szolgáltat.",
  },
  {
    en: "Open http://127.0.0.1:8080, paste the token, and read the billing and node chips in the top bar.",
    "ru": "Откройте http://127.0.0.1:8080, вставьте токен и прочитайте в верхней панели чипы billing и node.",
    "de": "Öffnen Sie http://127.0.0.1:8080, fügen Sie das Token ein und lesen Sie in der oberen Leiste die billing- und node-Chips.",
    "fr": "Ouvrez http://127.0.0.1:8080, collez le token et lisez dans la barre du haut les pastilles billing et node.",
    "it": "Apri http://127.0.0.1:8080, incolla il token e leggi nella barra in alto i chip billing e node.",
    "nl": "Open http://127.0.0.1:8080, plak de token en lees in de balk bovenaan de billing- en node-chips af.",
    "cs": "Otevřete http://127.0.0.1:8080, vložte token a přečtěte si v horní liště štítky billing a node.",
    "zh-Hans": "浏览器打开 http://127.0.0.1:8080，粘进令牌进后台，读顶栏的计费与节点两枚 chip。",
    "zh-Hant": "瀏覽器開 http://127.0.0.1:8080，貼進權杖進後臺，讀頂欄的計費與節點兩枚 chip。",
    "es": "Abra http://127.0.0.1:8080, pegue el token y lea en la barra superior los chips de billing y node.",
    "pl": "Otwórz http://127.0.0.1:8080, wklej token i odczytaj na górnym pasku chipy billing i node.",
    "ja": "http://127.0.0.1:8080 を開いてトークンを貼り付け、上部バーの billing と node のチップを確認してください。",
    "th": "เปิด http://127.0.0.1:8080 วาง token แล้วดูชิป billing กับ node บนแถบบน",
    "fi": "Avaa http://127.0.0.1:8080, liimaa token ja lue ylätungin billing- ja node-merkeiltä.",
    "uk": "Відкрийте http://127.0.0.1:8080, вставте токен і прочитайте на верхній панелі чіпи billing та node.",
    "bg": "Отворете http://127.0.0.1:8080, поставете токена и прочетете в горната лента чиповете billing и node.",
    "tr": "http://127.0.0.1:8080 adresini açın, jetonu yapıştırın ve üst çubukta billing ile node çiplerini okuyun.",
    "hu": "Nyissa meg a http://127.0.0.1:8080 címet, illessze be a tokent, és olvassa el a felső sávon a billing és node chipeket.",
  },
  {
    en: "Request/reuse the address in Service account & node, hand that string to the iPhone to scan or paste, then confirm the follower has a pairwise uid in Contacts.",
    "ru": "Запросите или переиспользуйте адрес в Service account & node, передайте эту строку на iPhone для сканирования или вставки и убедитесь, что у подписчика в Contacts появился pairwise uid.",
    "de": "Fordern Sie in Service account & node eine Adresse an oder wiederverwenden Sie eine, geben Sie die Kette auf dem iPhone zum Scannen oder Einfügen weiter und prüfen Sie, ob der Anhänger in Contacts eine pairwise uid hat.",
    "fr": "Demandez ou réutilisez l'adresse dans Service account & node, donnez cette chaîne à l'iPhone pour scanner ou coller, puis vérifiez que l'abonné a un pairwise uid dans Contacts.",
    "it": "Richiedi o riutilizza l'indirizzo in Service account & node, dai quella stringa all'iPhone perché la scansioni o la incolli, poi verifica che il follower abbia un pairwise uid in Contacts.",
    "nl": "Vraag het adres aan of hergebruik er een in Service account & node, geef die tekenreeks aan de iPhone om te scannen of plakken, en controleer of de volger in Contacts een pairwise uid heeft.",
    "cs": "Vyžádejte nebo znovu použijte adresu v Service account & node, předejte ten řádek iPhone ke skenování nebo vložení a ujistěte se, že má odběratel v Contacts pairwise uid.",
    "zh-Hans": "「服务号与节点」申请/复用地址，把这串文本交给 iPhone 扫码或粘贴；「联系人」里这个人已经有 pairwise uid。",
    "zh-Hant": "「服務號與節點」申請/復用位址，把這串文字交給 iPhone 掃碼或貼上；「聯絡人」裡這個人已經有 pairwise uid。",
    "es": "Solicite o reutilice la dirección en Service account & node, entregue esa cadena al iPhone para escanear o pegar, y compruebe que el seguidor tiene un pairwise uid en Contacts.",
    "pl": "Zażądaj albo ponownie wykorzystaj adres w Service account & node, przekaż ten ciąg na iPhone’a do zeskanowania lub wklejenia i upewnij się, że odbiorca ma pairwise uid w Contacts.",
    "ja": "Service account & node でアドレスを申請または再利用し、その文字列を iPhone に渡してスキャンか貼り付けを行い、Contacts にそのフォロワーの pairwise uid が現れたか確認してください。",
    "th": "ขอหรือใช้ ที่อยู่ เดิมใน Service account & node แล้วส่งสตริงนี้ให้ iPhone สแกนหรือวาง จากนั้นตรวจว่า follower มี pairwise uid อยู่ใน Contacts แล้ว",
    "fi": "Pyydä tai käytä osoite uudelleen Service account & node -paneelissa, anna merkkijono iPhonelle skannattavaksi tai liimattavaksi, ja varmista, että seuraajalla on pairwise uid kohdassa Contacts.",
    "uk": "Запитайте або перевикористайте адресу в Service account & node, передайте цей рядок на iPhone для сканування чи вставлення й переконайтеся, що в Contacts у підписника з'явився pairwise uid.",
    "bg": "Заявете или преизползвайте адреса в Service account & node, предайте този низ на iPhone за сканиране или поставяне, и се убедете, че последователят има pairwise uid в Contacts.",
    "tr": "Service account & node içinde adresi isteyin ya da yeniden kullanın, bu diziyi iPhone'a taranmak veya yapıştırılmak üzere verin, sonra takipçinin Contacts içinde bir pairwise uid'si olduğundan emin olun.",
    "hu": "Kérjen ki vagy használjon újra egy címet a Service account & node panelen, adja át a karakterláncot az iPhone-nak beolvasásra vagy bemásolásra, majd győződjön meg róla, hogy a követőnek van pairwise uid-ja a Contacts ban.",
  },
  {
    en: "Save and push the three top-level items in Menu orchestration; send one card with a chosen style in Card delivery, passing contact_ids when it should be targeted.",
    "ru": "Сохраните и отправьте три пункта верхнего уровня в Menu orchestration; отправьте одну карточку в выбранном стиле в Card delivery, передав contact_ids, когда адресная рассылка нужна.",
    "de": "Speichern und senden Sie die drei Top-Level-Punkte in Menu orchestration; senden Sie in Card delivery eine Karte im gewählten Stil und übergeben Sie contact_ids, wenn sie gezielt zustellen wollen.",
    "fr": "Sauvegardez et poussez les trois entrées de premier niveau dans Menu orchestration ; envoyez une carte dans le style choisi depuis Card delivery, en passant contact_ids quand le ciblage est nécessaire.",
    "it": "Salva e spingi le tre voci di primo livello in Menu orchestration; invia una card nello stile scelto da Card delivery, passando contact_ids quando serve un invio mirato.",
    "nl": "Sla de drie top-level items op en push ze in Menu orchestration; stuur in Card delivery één kaart in de gekozen stijl, en geef contact_ids mee als je gericht moet bezorgen.",
    "cs": "Uložte a pošlete ty tři položky nejvyšší úrovně v Menu orchestration; v Card delivery pošlete jednu kartu ve zvoleném stylu a předejte contact_ids, když má být cílená.",
    "zh-Hans": "「菜单编排」保存并推送 3 个顶级项；「卡片下发」选一个 style 发一张卡，要定向就带 contact_ids。",
    "zh-Hant": "「選單編排」儲存並推送 3 個頂層項目；「卡片下發」選一個 style 發一張卡，要定向就帶 contact_ids。",
    "es": "Guarde y envíe los tres ítems de primer nivel en Menu orchestration; envíe una tarjeta en el estilo elegido desde Card delivery, pasando contact_ids cuando deba ser dirigida.",
    "pl": "Zapisz i wyślij te trzy pozycje najwyższego poziomu w Menu orchestration; w Card delivery wyślij jedną kartę w wybranym stylu, podając contact_ids, gdy ma być adresowana.",
    "ja": "Menu orchestration で3つのトップレベル項目を保存してプッシュしてください。Card delivery ではスタイルを選んでカードを1通送信し、宛先を絞るなら contact_ids を渡します。",
    "th": "บันทึกแล้ว push รายการชั้นบนสามรายการใน Menu orchestration; ส่วนใน Card delivery ให้ส่งการ์ดหนึ่งใบด้วยสไตล์ที่เลือก โดยส่ง contact_ids ไปด้วยเมื่อต้องการเลือกผู้รับ",
    "fi": "Tallenna ja työnnä kolme huipputason kohtaa Menu orchestrationissa; lähetä Card deliveryssä yksi kortti valitulla tyylillä, ja anna contact_ids kun kohdennus tarvitaan.",
    "uk": "Збережіть і надішліть три пункти верхнього рівня в Menu orchestration; надішліть одну картку в обраному стилі з Card delivery, передавши contact_ids, коли потрібна адресна доставка.",
    "bg": "Запазете и изпратете трите елемента от горно ниво в Menu orchestration; изпратете една карта в избран стил от Card delivery, подавайки contact_ids когато трябва да е насочено.",
    "tr": "Menu orchestration içindeki üç üst düzey maddeyi kaydedin ve gönderin; Card delivery içinden seçtiğiniz tarzda bir kart gönderin ve hedefli gönderim gerekiyorsa contact_ids verin.",
    "hu": "Mentse el és tolja fel a három felső szintű elemet a Menu orchestrationben; a Card deliveryben küldjön egy kártyát a választott stílusban, és adja meg a contact_ids-t, ha célzottan kell kiszállítani.",
  },
  {
    en: "Read each of the nine plugin panels once; only a switch to admission mode needs POPOPX_BILLING_REQUIRE_VOUCHER=1, the official public key and a minted code.",
    "ru": "Прочитайте каждый из девяти панелей плагинов хотя бы раз; лишь переключение в режим допуска требует POPOPX_BILLING_REQUIRE_VOUCHER=1, официального публичного ключа и выпущенного кода.",
    "de": "Lesen Sie jedes der neun Plugin-Panels mindestens einmal; nur der Wechsel in den Einlassmodus verlangt POPOPX_BILLING_REQUIRE_VOUCHER=1, den offiziellen öffentlichen Schlüssel und einen geprägten Code.",
    "fr": "Lisez chacun des neuf panneaux de plugins au moins une fois ; seul le passage en mode admission exige POPOPX_BILLING_REQUIRE_VOUCHER=1, la clé publique officielle et un code fabriqué.",
    "it": "Leggi ognuno dei nove pannelli plugin almeno una volta; solo il passaggio in modalità ammissione richiede POPOPX_BILLING_REQUIRE_VOUCHER=1, la chiave pubblica ufficiale e un codice coniato.",
    "nl": "Lees elk van de negen pluginpanelen minstens één keer; alleen de wissel naar toelatingsmodus vraagt POPOPX_BILLING_REQUIRE_VOUCHER=1, de officiële publieke sleutel en een geslagen code.",
    "cs": "Přečtěte si každý z devíti panelů pluginů alespoň jednou; jen přepnutí do režimu přístupu vyžaduje POPOPX_BILLING_REQUIRE_VOUCHER=1, oficiální veřejný klíč a vydaný kód.",
    "zh-Hans": "九个插件面板各读一次 status；只有把账户切成准入模式，才需要 POPOPX_BILLING_REQUIRE_VOUCHER=1、官方公钥和一张铸出来的码。",
    "zh-Hant": "九個插件面板各讀一次 status；只有把帳戶切成准入模式，才需要 POPOPX_BILLING_REQUIRE_VOUCHER=1、官方公開金鑰和一張鑄出來的碼。",
    "es": "Lea cada uno de los nueve paneles de plugins al menos una vez; sólo el cambio a modo de admisión exige POPOPX_BILLING_REQUIRE_VOUCHER=1, la clave pública oficial y un código acuñado.",
    "pl": "Odczytaj każdy z dziewięciu paneli wtyczek przynajmniej raz; tylko przejście w tryb dopuszczenia wymaga POPOPX_BILLING_REQUIRE_VOUCHER=1, oficjalnego klucza publicznego i wybitego kodu.",
    "ja": "9つのプラグインパネルは少なくとも1回それぞれ読んでください。受け入れモードへの切り替えだけをしようとするには、POPOPX_BILLING_REQUIRE_VOUCHER=1、公式の公開鍵、そして発行済みのコードが必要になります。",
    "th": "อ่านแผงปลั๊กอินทั้งเก้าอย่างน้อยครั้งเดียว มีแค่การสลับไปโหมดรับเข้าใช้ที่ต้องการ POPOPX_BILLING_REQUIRE_VOUCHER=1, คีย์สาธารณะอย่างเป็นทางการ และโค้ดที่พิมพ์แล้ว",
    "fi": "Lue jokainen yhdeksästä plugin-paneelista ainakin kerran; vain vaihto päästötilaan vaatii POPOPX_BILLING_REQUIRE_VOUCHER=1, virallisen julkisen avaimen ja lyödyn koodin.",
    "uk": "Прочитайте кожну з дев'яти панелей плагінів хоча б раз; лише перемикання в режим допуску вимагає POPOPX_BILLING_REQUIRE_VOUCHER=1, офіційного публічного ключа та випущеного коду.",
    "bg": "Прочетете всеки от деветте панела на приставките поне веднъж; само превключването в режим на допускане изисква POPOPX_BILLING_REQUIRE_VOUCHER=1, официалния публичен ключ и отсечен код.",
    "tr": "Dokuz eklenti panelinin her birini en az bir kez okuyun; yalnızca katılım moduna geçiş POPOPX_BILLING_REQUIRE_VOUCHER=1, resmi genel anahtar ve basılmış bir kod ister.",
    "hu": "Olvassa el mind a kilenc bővítménypanelt legalább egyszer; csak a beléptetési módra váltás igényli a POPOPX_BILLING_REQUIRE_VOUCHER=1-et, a hivatalos publikus kulcsot és egy levert kódot.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
 * 4. Local presentation helpers
 * ──────────────────────────────────────────────────────────────────────────── */

function PartHeading({ eyebrow, title, subtitle }: { eyebrow: L; title: L; subtitle: L }): ReactElement {
  return (
    <div className="hairline-top mt-14 pt-10">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />
    </div>
  );
}

function StepRow({ index, title, caption, code }: { index: number; title: L; caption: L; code: string }): ReactElement {
  const t = useCopy(title);
  const c = useCopy(caption);
  return (
    <li className="grid gap-3 sm:grid-cols-[2rem_minmax(0,1fr)]">
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-brand/45 bg-brand/15 font-mono text-[12px] font-semibold text-brand-soft"
      >
        {index}
      </span>
      <div className="min-w-0">
        <h5 className="text-[15px] font-medium text-white">{t}</h5>
        <div className="mt-2">
          <CodeBlock code={code} />
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-faint">{c}</p>
      </div>
    </li>
  );
}

function Note({ tone, title, children }: { tone: "brand" | "mesh" | "warn" | "alert"; title: L; children: ReactNode }): ReactElement {
  const t = useCopy(title);
  return (
    <div className="glass-inset min-w-0 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <StatusDot tone={tone} />
        <h5 className="text-[13px] font-semibold tracking-wide text-white">{t}</h5>
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function Prose({ label, text }: { label: L; text: L }): ReactElement {
  const l = useCopy(label);
  const s = useCopy(text);
  return (
    <p className="text-[12.5px] leading-relaxed">
      <span className="mr-1.5 font-semibold text-brand-soft">{l}</span>
      <span className="text-mute">{s}</span>
    </p>
  );
}

function VerificationBlock({ intro }: { intro: L }): ReactElement {
  const title = useCopy(T.verifyTitle);
  return (
    <div>
      <h4 className="text-[13px] font-semibold tracking-wide text-white">{title}</h4>
      <div className="mt-3">
        <CodeBlock code={CMD.healthz} />
      </div>
      <div className="mt-3 space-y-2.5">
        <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(intro)}</p>
        <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.verifyBody)}</p>
        <p className="text-[12.5px] leading-relaxed text-mute">
          <span className="mr-1.5 inline-flex items-center gap-1.5 font-semibold text-warn">
            <StatusDot tone="warn" />
            node_connected: false
          </span>
          {useCopy(T.verifyFalse)}
        </p>
        <p className="text-[12.5px] leading-relaxed text-faint">{useCopy(T.verifyNext)}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 5. The section
 * ──────────────────────────────────────────────────────────────────────────── */

export function InstallAndUsageGuideSection(): ReactElement {
  const { locale } = useLocale();
  const [platform, setPlatform] = useState<Platform>("ubuntu");
  const [ticked, setTicked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const ubuntuRef = useRef<HTMLButtonElement>(null);
  const macRef = useRef<HTMLButtonElement>(null);

  const ubuntuLabel = useCopy(T.tabUbuntu);
  const macLabel = useCopy(T.tabMacos);
  const p1Title = useCopy(T.p1Title);
  const doneCount = ticked.reduce((acc: number, isOn: boolean) => (isOn ? acc + 1 : acc), 0);
  const allOn = doneCount === CHECKLIST.length;

  function moveTo(event: KeyboardEvent<HTMLButtonElement>, next: Platform): void {
    event.preventDefault();
    setPlatform(next);
    (next === "ubuntu" ? ubuntuRef : macRef).current?.focus();
  }

  const TABS: { key: Platform; label: string; hint: string; ref: typeof ubuntuRef }[] = [
    { key: "ubuntu", label: ubuntuLabel, hint: CMD.install, ref: ubuntuRef },
    { key: "macos", label: macLabel, hint: CMD.macStart, ref: macRef },
  ];

  return (
    <section id="install" className="grain relative py-20 sm:py-28">
      <div className="section-wrap">
        <SectionHeading eyebrow={T.eyebrow} title={T.title} subtitle={T.subtitle} />

        {/* ── Part 1 ─────────────────────────────────────────── */}
        <div className="hairline-top mt-14 pt-10">
          <SectionHeading eyebrow={T.p1Eyebrow} title={T.p1Title} subtitle={T.p1Sub} />

          <div role="tablist" aria-label={p1Title} className="mt-6 grid gap-2 sm:grid-cols-2">
            {TABS.map((tab) => {
              const selected = platform === tab.key;
              const other: Platform = tab.key === "ubuntu" ? "macos" : "ubuntu";
              return (
                <button
                  key={tab.key}
                  ref={tab.ref}
                  type="button"
                  role="tab"
                  id={`install-tab-${tab.key}`}
                  aria-selected={selected}
                  aria-controls={`install-panel-${tab.key}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setPlatform(tab.key)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                      moveTo(event, other);
                    } else if (event.key === "Home") {
                      moveTo(event, "ubuntu");
                    } else if (event.key === "End") {
                      moveTo(event, "macos");
                    }
                  }}
                  className={`glass glass-hover flex flex-col items-start gap-1 px-4 py-3 text-left ${
                    selected ? "!border-brand/70 !bg-brand/15" : ""
                  }`}
                >
                  <span className="flex w-full items-center gap-2">
                    <StatusDot tone={selected ? "brand" : "mesh"} pulse={selected} />
                    <span className={`text-[13.5px] font-semibold ${selected ? "text-white" : "text-mute"}`}>{tab.label}</span>
                  </span>
                  <code className="mt-0.5 block font-mono text-[11.5px] text-brand-soft">{tab.hint}</code>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11.5px] text-faint">{useCopy(T.tabsLegend)}</p>

          {/* Tab A — Ubuntu */}
          <div
            role="tabpanel"
            id="install-panel-ubuntu"
            aria-labelledby="install-tab-ubuntu"
            tabIndex={0}
            hidden={platform !== "ubuntu"}
            className={`glass mt-4 p-4 sm:p-6 ${platform === "ubuntu" ? "" : "hidden"}`}
          >
            <ol className="space-y-6">
              <StepRow index={1} title={T.uCloneT} code={CMD.clone} caption={T.uCloneC} />
              <StepRow index={2} title={T.uEnvT} code={CMD.env} caption={T.uEnvC} />
              <StepRow index={3} title={T.uTokenT} code={CMD.token} caption={T.uTokenC} />
              <StepRow index={4} title={T.uReadT} code={CMD.readToken} caption={T.uReadC} />
              <StepRow index={5} title={T.uInstallT} code={CMD.install} caption={T.uInstallC} />
              <StepRow index={6} title={T.uModesT} code={CMD.installModes} caption={T.uModesC} />
              <StepRow index={7} title={T.uComposeT} code={CMD.compose} caption={T.uComposeC} />
              <StepRow index={8} title={T.uUfwT} code={CMD.ufw} caption={T.uUfwC} />
              <StepRow index={9} title={T.uGatesT} code={CMD.gates} caption={T.uGatesC} />
            </ol>

            <div className="mt-7">
              <Note tone="warn" title={T.secTitle}>
                <Prose label={T.secPortL} text={T.secPort} />
                <Prose label={T.secNodeL} text={T.secNode} />
                <Prose label={T.secLaunchL} text={T.secCompose} />
                <Prose label={T.secBackupL} text={T.secBackup} />
              </Note>
            </div>

            <div className="mt-7">
              <VerificationBlock intro={T.ubuntuIntro} />
            </div>
          </div>

          {/* Tab B — macOS */}
          <div
            role="tabpanel"
            id="install-panel-macos"
            aria-labelledby="install-tab-macos"
            tabIndex={0}
            hidden={platform !== "macos"}
            className={`glass mt-4 space-y-7 p-4 sm:p-6 ${platform === "macos" ? "" : "hidden"}`}
          >
            <div className="glass-inset p-4 sm:p-5">
              <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.mWhyVenv)}</p>
            </div>

            {/* Tab B.1 — macOS production: install_macos.sh (launchd) */}
            <div>
              <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.mProdHeading)}</h4>
              <ol className="mt-3 space-y-6">
                <StepRow index={1} title={T.mProdInstallT} code={CMD.macInstall} caption={T.mProdInstallC} />
                <StepRow index={2} title={T.mProdCheckT} code={CMD.macPreflight} caption={T.mProdCheckC} />
                <StepRow index={3} title={T.mProdFlagsT} code={CMD.macInstallFlags} caption={T.mProdFlagsC} />
                <StepRow index={4} title={T.mProdCtlT} code={CMD.macCtl} caption={T.mProdCtlC} />
                <StepRow index={5} title={T.mProdUninstallT} code={CMD.macUninstall} caption={T.mProdUninstallC} />
              </ol>

              <div className="mt-7">
                <Note tone="warn" title={T.mProdNoteTitle}>
                  <Prose label={T.mProdBindL} text={T.mProdBind} />
                  <Prose label={T.mProdLogL} text={T.mProdLog} />
                  <Prose label={T.mProdExitL} text={T.mProdExit} />
                </Note>
              </div>
            </div>

            {/* Tab B.2 — macOS development: start_macos.sh */}
            <div>
              <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.mDevHeading)}</h4>
              <ol className="mt-3 space-y-6">
                <StepRow index={1} title={T.mStartT} code={CMD.macStart} caption={T.mStartC} />
                <StepRow index={2} title={T.mCheckT} code={CMD.macCheck} caption={T.mCheckC} />
                <StepRow index={3} title={T.mTokenT} code={CMD.macToken} caption={T.mTokenC} />
                <StepRow index={4} title={T.mNodeT} code={CMD.macNode} caption={T.mNodeC} />
                <StepRow index={5} title={T.mVenvT} code={CMD.venv} caption={T.mVenvC} />
              </ol>

              <div className="mt-7">
                <Note tone="mesh" title={T.pairTitle}>
                  <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.pairBody)}</p>
                  <CodeBlock code={CMD.firewallState} showCopy={false} />
                  <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.pairTrouble)}</p>
                </Note>
              </div>
            </div>

            <VerificationBlock intro={T.macosIntro} />
          </div>
        </div>

        {/* ── Part 2 ─────────────────────────────────────────── */}
        <PartHeading eyebrow={T.p2Eyebrow} title={T.p2Title} subtitle={T.p2Sub} />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Note tone="brand" title={T.gateTitle}>
            <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.gateBody)}</p>
            <p className="text-[12.5px] leading-relaxed text-faint">{useCopy(T.gateField)}</p>
            <CodeBlock code={T.unauthorized} showCopy={false} caption={pick(T.unauthorizedCap, locale)} />
          </Note>

          <div className="glass min-w-0 p-4 sm:p-5">
            <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.apiTitle)}</h4>
            <div className="mt-3 space-y-3">
              <CodeBlock code={CMD.apiSetup} caption={useCopy(T.apiSetupCap)} />
              <CodeBlock code={CMD.status} caption={useCopy(T.statusCap)} />
              <CodeBlock code={CMD.tokenQuery} caption={useCopy(T.tokenQueryCap)} />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="glass min-w-0 p-4 sm:p-5">
            <CodeBlock code={CMD.redeem} caption={useCopy(T.redeemCap)} />
          </div>
          <div className="glass min-w-0 p-4 sm:p-5">
            <CodeBlock code={CMD.menu} caption={useCopy(T.menuCap)} />
          </div>
          <div className="glass min-w-0 p-4 sm:p-5">
            <CodeBlock code={CMD.sendText} caption={useCopy(T.textCap)} />
          </div>
          <div className="glass min-w-0 p-4 sm:p-5">
            <CodeBlock code={CMD.rotate} caption={useCopy(T.rotateCap)} />
          </div>
          <div className="glass min-w-0 p-4 sm:p-5 lg:col-span-2">
            <CodeBlock code={CMD.plugins} caption={useCopy(T.pluginsCap)} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="glass min-w-0 p-4 sm:p-5">
            <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.quotaTitle)}</h4>
            <div className="mt-3 space-y-3">
              <div className="glass-inset p-3.5 [overflow-wrap:anywhere]">
                <p className="flex items-center gap-2 font-mono text-[11.5px] text-mesh-soft">
                  <StatusDot tone="mesh" />
                  POPOPX_BILLING_REQUIRE_VOUCHER=0
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-mute">{useCopy(T.quotaOff)}</p>
              </div>
              <div className="glass-inset p-3.5 [overflow-wrap:anywhere]">
                <p className="flex items-center gap-2 font-mono text-[11.5px] text-warn">
                  <StatusDot tone="warn" />
                  POPOPX_BILLING_REQUIRE_VOUCHER=1
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-mute">{useCopy(T.quotaOn)}</p>
              </div>
            </div>
          </div>

          <div className="glass min-w-0 p-4 sm:p-5">
            <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.mintTitle)}</h4>
            <div className="mt-3 space-y-3">
              <CodeBlock code={CMD.voucher} caption={useCopy(T.mintCap)} />
              <CodeBlock code={CMD.voucherHelp} showCopy={false} caption={useCopy(T.mintHelpCap)} />
            </div>
          </div>
        </div>

        <div className="glass mt-4 p-4 sm:p-6">
          <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.meterTitle)}</h4>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-b border-hair text-[11px] uppercase tracking-[0.14em] text-faint">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    {useCopy(T.meterHeadKey)}
                  </th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">
                    {useCopy(T.meterHeadUnit)}
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    {useCopy(T.meterHeadWhat)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {CP_ROWS.map((row) => (
                  <tr key={row.key} className="border-b border-hair/60 last:border-0">
                    <td className="py-2.5 pr-4 font-mono text-[12px] text-brand-soft">{row.key}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-[12.5px] text-white">{row.value}</td>
                    <td className="py-2.5 text-[12.5px] text-mute">{pick(row.what, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-[12.5px] leading-relaxed text-faint">{useCopy(T.meterFoot)}</p>
        </div>

        <div className="mt-4">
          <Note tone="alert" title={T.fuseTitle}>
            <p className="text-[12.5px] leading-relaxed text-mute">{useCopy(T.fuseBody)}</p>
          </Note>
        </div>

        {/* ── Part 3 ─────────────────────────────────────────── */}
        <PartHeading eyebrow={T.p3Eyebrow} title={T.p3Title} subtitle={T.p3Sub} />

        <ol className="mt-8">
          {TIMELINE.map((step, i) => (
            <li key={step.no} className="relative grid gap-4 pb-9 sm:grid-cols-[2.5rem_minmax(0,1fr)]">
              {i < TIMELINE.length - 1 ? <span aria-hidden className="absolute bottom-0 left-[15px] top-9 w-px bg-hair-strong" /> : null}
              <span
                aria-hidden
                className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-brand/55 bg-brand/20 font-mono text-[13px] font-semibold text-white"
              >
                {step.no}
              </span>
              <div className="min-w-0">
                <h4 className="text-[16px] font-semibold tracking-tight text-white">{pick(step.title, locale)}</h4>
                <p className="mt-2 text-[13px] leading-relaxed text-mute">{pick(step.body, locale)}</p>
                <div className="mt-3 space-y-2">
                  <Prose label={T.consoleLabel} text={step.console} />
                  <Prose label={T.phoneLabel} text={step.phone} />
                </div>
                {step.snippet ? (
                  <div className="mt-3">
                    <CodeBlock
                      code={step.snippet.code}
                      showCopy={false}
                      maxHeightClass="max-h-56 overflow-y-auto"
                      caption={pick(step.snippet.caption, locale)}
                    />
                  </div>
                ) : null}
                <p className="mt-3 border-l-2 border-warn/60 pl-3 text-[12.5px] leading-relaxed text-warn/90">{pick(step.warn, locale)}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Five-minute checklist */}
        <div className="glass mt-6 p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="text-[13px] font-semibold tracking-wide text-white">{useCopy(T.checkTitle)}</h4>
            <span className="pill">
              {useCopy(T.checkProgress)}
              <span className="font-mono text-mesh-soft">
                {doneCount}/{CHECKLIST.length}
              </span>
            </span>
            <span className="grow" />
            <button type="button" className="btn-ghost !px-3.5 !py-1.5 !text-[12px]" onClick={() => setTicked(CHECKLIST.map(() => true))}>
              {allOn ? useCopy(T.checkDone) : useCopy(T.checkAll)}
            </button>
            <button type="button" className="btn-ghost !px-3.5 !py-1.5 !text-[12px]" onClick={() => setTicked(CHECKLIST.map(() => false))}>
              {useCopy(T.checkReset)}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-faint">{useCopy(T.checkHint)}</p>

          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item, i) => {
              const on = ticked[i];
              return (
                <li key={`check-${i}`}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setTicked((prev) => {
                        const copy = prev.slice();
                        copy[i] = !copy[i];
                        return copy;
                      })
                    }
                    className={`glass-hover flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left ${
                      on ? "!border-mesh/55 !bg-mesh/10" : "border-hair bg-white/[0.03]"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-[3px] inline-flex h-[16px] w-[16px] flex-none items-center justify-center rounded border text-[10px] font-bold leading-none ${
                        on ? "border-mesh-soft bg-mesh/30 text-white" : "border-hair-strong text-transparent"
                      }`}
                    >
                      {"✓"}
                    </span>
                    <span
                      className={`min-w-0 text-[12.5px] leading-relaxed [overflow-wrap:anywhere] ${
                        on ? "text-mute line-through" : "text-white"
                      }`}
                    >
                      {pick(item, locale)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="hairline-top mt-5 flex flex-wrap gap-2 pt-4">
            <a href="#sandbox" className="pill glass-hover max-w-full">
              {useCopy(T.outroSandbox)}
            </a>
            <a href="#directory" className="pill glass-hover max-w-full">
              {useCopy(T.outroDirectory)}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
