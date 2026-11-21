# popopx-service-suite-web
<!--
  Copyright (c) 2026 POPOPX (popopx.chat)
  SPDX-License-Identifier: AGPL-3.0-only
-->

中文 · English：[`README.en.md`](README.en.md)

POPOPX 服务号与零知识加密频道的官方门户网站：一个 Next.js 静态导出工程，把功能说明、
macOS 与 Ubuntu 两条安装路径、后台操作指引和开放协议速查全部装进同一个单页。`npm run build`
产出的 `out/` 就是一堆纯 HTML/CSS/JS/SVG，任何静态服务器都能直接把它跑起来。生产主机是
`mp.popopx.chat`（`SITE_HOST`），SEO 与 canonical 用的站点源是 `https://popopx.chat`
（`SITE_ORIGIN`），两个值都写在 `src/lib/site.ts`，并由 `next.config.mjs` 以
`NEXT_PUBLIC_SITE_ORIGIN` / `NEXT_PUBLIC_SITE_HOST` 再导出一次。后端套件在同级仓库
`popopx-service-suite`，iOS 客户端在 `popopx-chat`；本工程不链接、不修改、也不重新分发它们的
任何代码。

## 协议与商标

代码以 **AGPL-3.0-only** 授权，全文见 [`LICENSE`](LICENSE)，与 `popopx-service-suite` 的
`LICENSE` 是同一份文件（逐字节相同），`package.json` 里的 `"license": "AGPL-3.0-only"` 是同一个
声明；文件顶部的 `Copyright` + `SPDX-License-Identifier: AGPL-3.0-only` 两行就是这份许可的入口。
你可以自由使用、修改、再分发；AGPL-3.0 第 13 条的条件一句话就能说完：改了这个门户又通过网络给
别人用，修改版源码要一并提供。

**商标不在这份授权里。** `POPOPX` 名称、logo 标识与 `popopx.chat` 域名归 POPOPX 所有——分发修改版
请改名，不要以 POPOPX 的名义提供部署、服务或背书。`src/lib/site.ts` 导出的 `TRADEMARK_URL` 指向
**iOS 客户端仓库** `popopx-chat`（`master` 分支）里的 `TRADEMARK-POPOPX.md`——后端套件仓库没有这份
文件，指过去会 404；站内的商标文案就是对着这份说明写的。

`public/` 下的 logo 资产同理受商标声明约束，而不是受 AGPL 覆盖：`public/logo-popopx.png` 是官方
POPOPX 标识，取自 iOS 客户端 `apps/ios/Shared/Assets.xcassets/AppIcon.appiconset/1024.png`，
逐字节复制、未经重绘（两边 SHA-256 相同）；`apple-touch-icon.png` 与该资源目录里的 `180.png`
同样逐字节一致，`favicon.png`、`logo-popopx-512.png` 由同一原图缩放而来。换品牌请一并换掉这些
文件与文案里的名称。

## 目录结构

```text
popopx-service-suite-web/
├── LICENSE                       AGPL-3.0-only 全文，与后端仓库同一份
├── README.md                     本文档（中文）
├── README.en.md                  英文版，与本文档逐节对应
├── package.json                  next 15.5.4 / react 19 / qrcode.react 4.2.0 / tailwind 3.4.17 / ts 5.7.3
├── package-lock.json             锁定依赖版本
├── next.config.mjs               output: "export" → 产物 out/；images.unoptimized；trailingSlash
├── postcss.config.mjs            tailwindcss + autoprefixer
├── tailwind.config.ts            设计令牌与系统字体栈（无 webfont）
├── tsconfig.json                 strict 编译，路径别名 @/* → ./src/*
├── .gitignore / .dockerignore    忽略 node_modules / .next / out，收紧构建上下文
├── Dockerfile                    两段式：先导出 out/，运行阶段只有 Nginx
├── nginx.conf                    容器内用的站点配置（80 端口，不做 TLS 卸载）
├── prompt.md                     建站任务书（中文需求原文）
├── deploy/centos/
│   ├── deploy_centos.sh          CentOS / RHEL / Rocky / Alma 一键部署
│   └── nginx-popopx-service.conf 裸机生产 vhost（TLS + 安全头）
├── tools/
│   ├── check-i18n.mjs            多语言文案完整性检查
│   └── scan-compliance.mjs       对产物跑四条「0」门禁
├── public/
│   ├── logo-popopx.png           官方标识 1024×1024
│   ├── logo-popopx-512.png       512×512
│   ├── favicon.png               64×64
│   ├── apple-touch-icon.png      180×180
│   ├── site.webmanifest          同源图标清单与主题色
│   ├── robots.txt                抓取策略，Sitemap 指向本站
│   └── sitemap.xml               只有一个可索引 URL：/
└── src/
    ├── app/
    │   ├── layout.tsx            元数据、viewport、`<LocaleProvider>` 挂载点
    │   ├── page.tsx              单页装配：各模块按锚点顺序串起来
    │   └── globals.css           Tailwind 层、玻璃卡片等 house 类、锚点偏移
    ├── components/
    │   ├── Navbar.tsx            吸顶导航：锚点、语言胶囊、仓库入口、主 CTA
    │   ├── HeroSection.tsx       首屏舞台
    │   ├── Footer.tsx            协议 / 商标 / 隐私 / 身份信息区
    │   └── ui.tsx                CopyButton / SectionHeading / CodeBlock / StatusDot
    └── lib/
        ├── site.ts               域名、端口、锚点清单、剪贴板 helper
        └── i18n.tsx              多语言引擎：LocaleProvider / useLocale / useCopy / pick
```

`src/app/page.tsx` 一共引入八个模块组件，全部与 `ui.tsx` 同放于 `src/components/`：
`Navbar.tsx`、`HeroSection.tsx`、`ArchitectureComparison.tsx`、`PluginsShowcase.tsx`、
`InteractiveSandbox.tsx`、`InstallAndUsageGuideSection.tsx`、`DirectoryAndDocsSection.tsx`、
`Footer.tsx`。本文件只描述各模块在页面上的职责。

## 快速开始

需要 Node.js 18.18 以上（`package.json` 的 `engines` 声明），没有别的运行时要求。

```bash
npm install          # next / react / react-dom / qrcode.react 加构建期依赖
npm run dev          # 本地开发服务，改代码即时刷新
npm run typecheck    # tsc --noEmit，strict 全量类型检查
npm run build        # next build：静态导出到 out/
```

`next.config.mjs` 设了 `output: "export"`，所以对外交付的产物是 `out/`，`.next/` 只是构建中间目录，
线上不需要 Node 进程常驻。预览产物只要把它当普通静态站起一个服务器，端口任选：

```bash
cd out && python3 -m http.server 4173     # 本机自测用
```

因为配置里开了 `trailingSlash: true`，`out/` 里每个路由都是「目录 + `index.html`」的形式，
最普通的文件服务器也能直接访问到，不需要任何重写规则。

## 页面模块

整站是一页，模块就是锚点区。六个导航锚点的 id 以 `src/lib/site.ts` 的 `NAV_SECTIONS` 为准
（`features`、`architecture`、`plugins`、`sandbox`、`install`、`directory`），模块顺序以
`src/app/page.tsx` 为准，`<main>` 上的 `id="top"` 是回到顶部的落点。`Navbar.tsx` 把
`NAV_SECTIONS` 直接渲染成 `#id` 链接，锚点文案是 `Record<NavSectionId, Localized<string>>`，
少一个 id 的翻译就编译不过。

| 模块 | 组件 | 锚点 | 职责 |
| --- | --- | --- | --- |
| 一 顶部导航 | `Navbar.tsx` | 指向六个锚点 | 毛玻璃吸顶条：官方 logo 与 `POPOPX Service Suite` 标题、六个锚点链接、语言胶囊、GitHub 入口、部署主按钮（`#install`），窄屏收进一个面板 |
| 二 首屏舞台 | `HeroSection.tsx` | `#top`（挂在 `<main>` 上） | 双模拓扑背景与主标语，指标条把「0 全局用户 ID」「100% 端到端加密」「AGPL-3.0 全栈开源」这些事实一次说完，两个按钮分别指向 `#install` 与 `#sandbox` |
| 三 特点与架构对比 | `ArchitectureComparison.tsx` | `#features`、`#architecture` | 服务号五大技术特点卡片（本地 WebSocket 隔离、三级底部菜单、三样式动态卡片、成对匿名 H5 签名、零知识频道与 Epoch 轮换），外加与传统社交公众号、中心化 Bot 的三方对比表 |
| 四 插件矩阵 | `PluginsShowcase.tsx` | `#plugins` | 后台开箱即用的五个扩展插件：隐私 AI 客服、DevOps 告警、零追踪扫码登录、加密问卷与匿名投票、链上资产监控与白名单发卡 |
| 五 互动体验沙盒 | `InteractiveSandbox.tsx` | `#sandbox` | 左边后台控制台模拟器、右边 1:1 手机预览，可真实点击菜单与卡片，并一键切到「中继服务器视角」看密文与签名摘要 |
| 六 安装与操作指南 | `InstallAndUsageGuideSection.tsx` | `#install` | Ubuntu 与 macOS 双标签命令区（对应后端仓库的 `install_ubuntu22.sh` / `start_macos.sh`）、后台初始化与配额设置、iPhone 扫码关注到插件启用的四步图解 |
| 七 目录与开放协议 | `DirectoryAndDocsSection.tsx` | `#directory` | 示范二维码展示墙与目录 JSON 生成器，加上信封协议、`::POPOPX_ECO::` 卡片协议、H5 验签接口 `POST /api/v1/verifyH5Auth` 的速查 |
| 八 页脚 | `Footer.tsx` | 自带区块 id | 协议、商标、隐私与身份信息四块，链接用 `src/lib/site.ts` 导出的 `LICENSE_URL` / `TRADEMARK_URL` / 三个仓库地址，页面上显示的就是 `SITE_HOST` 与 `SITE_ORIGIN` |

文案里出现的地址只有 `src/lib/site.ts` 给定的这几个：站点源 `https://popopx.chat`、生产主机
`mp.popopx.chat`、本机网关控制台 `http://127.0.0.1:8080`、开源节点的 loopback WebSocket
`ws://127.0.0.1:5225`。

## 多语言切换

语言集不再是三语，而是与 iOS 客户端完全对齐的 18 种。引擎在 `src/lib/i18n.tsx`，挂载点是
`layout.tsx` 里包住整棵树的 `<LocaleProvider>`。

- `LOCALES` 的 18 个标签与顺序照搬 iOS 客户端声明的本地化：`en`、`ru`、`de`、`fr`、`it`、`nl`、`cs`、`zh-Hans`、`zh-Hant`、`es`、`pl`、`ja`、`th`、`fi`、`uk`、`bg`、`tr`、`hu`（`LOCALE_COUNT` 就是 18）。`Localized<T>` 是对这 18 个 key 的**全量** `Record`：少写任何一种语言的文案，`npm run typecheck` 直接编译不过——「某语言漏翻」不是等上线才发现的坑。
- 默认 `zh-Hans`（简体中文），`layout.tsx` 首屏就按它输出 `<html lang>`。
- 文案内联在各组件里，`useCopy()` 按当前语言取一份。切换是一次纯 re-render：不刷新、不路由跳转、
  不发请求，也没有远端语言包；URL 不随语言变，所以 `public/sitemap.xml` 里只有一个可索引地址 `/`。
- 访客的选择写进浏览器自己的 `localStorage`，键名 `popopx.locale`（常量 `STORAGE_KEY`），
  下次访问优先于浏览器探测。
- 探测只发生在 `useEffect` 里：`detectLocale()` 依次看 `navigator.language` 与
  `navigator.languages`，按主语言子标签命中 18 个标签之一就用；`zh-HK`/`zh-MO`/`zh-TW`/带 `hant`
  的归 `zh-Hant`，其余 `zh-*` 归 `zh-Hans`；全都识别不出就保持默认 `zh-Hans`——那也正是服务端与
  首帧画出来的内容，因为渲染期读 `navigator` 会造成 hydration 不一致。
- 切换时同步 `document.documentElement.lang`（`HTML_LANG` 给每个标签的 BCP 47 写法）与 `dir`；
  18 种语言里没有右到左书写，`isRightToLeft()` 目前一律返回 `false`，`dir` 保持 `ltr`——这个函数
  存在的意义是让「将来加 RTL 语言」必须是一次有意识的改动。
- 语言菜单用自己的文字称呼自己（`LOCALE_NATIVE`：English、Deutsch、日本語、简体中文、繁體中文等），
  紧凑胶囊用 `LOCALE_SHORT`（`简` / `繁` / `EN` / `DE` 这种最多三字符的写法）。
- `pick()` 的运行时兜底顺序是：当前语言 → `en` → `zh-Hans` → 把原值当字符串用。`POPOPX`、
  `AGPL-3.0-only`、命令行这类本来不需要翻译的值就直接放进去。
- `npm run check:i18n` 补编译器看不见的两件事：混进陈旧标签（`zh-CN`/`zh-TW` 这类），以及把同一段
  字符串粘满所有语言槽的「假翻译」。

## 隐私与自托管保证

只列这个脚手架真正做到的事，每条都能对着文件查，`npm run check:out` 还会对产物再验一遍：

- **没有第三方统计与追踪脚本。** `package.json` 的运行时依赖只有 `next`、`react`、`react-dom`、
  `qrcode.react`，没有分析 SDK，源码里也没有任何外链脚本标签。
- **没有外部字体与图片链接。** `tailwind.config.ts` 用的是系统字体栈（`-apple-system`、
  `PingFang SC`、`Microsoft YaHei` 等），没有 `@font-face`；`globals.css` 不 `@import` 远端样式、
  没有指向站外的 `url()`；`next.config.mjs` 的 `images.unoptimized` 既是静态导出的硬性要求，也是
  隐私上的正确选择——没有远端取图服务，所有资源都来自本站同源。
- **二维码本地生成。** `qrcode.react` 的 `QRCodeSVG` 在浏览器里现画矢量图，断网也清晰可扫，
  不经过任何出图服务。
- **没有 cookie。** 源码里不写 `document.cookie`；访客唯一被持久化的偏好是 `localStorage` 里的
  `popopx.locale`，数据全在自己浏览器内。
- **不发 referrer。** `layout.tsx` 的元数据里带 `referrer: no-referrer`，与生产 vhost 的
  `Referrer-Policy` 一致。
- **静态产物，随便放。** `output: "export"` 出来的 `out/` 不需要 Node 运行时、也不需要服务端渲染，
  丢给 Nginx、Caddy、对象存储或者一台只装了 Python 的机器都跑得起来，整个网站可以完全待在你自己
  的网段里。

一点必要的坦白：这是一个 React 静态导出站点，构建产物会下发它自己打包的 JS（同源，在
`/_next/static` 下）；语言切换与互动沙盒本身就靠这些脚本工作。承诺的是「没有别人的脚本」，
不是「没有脚本」。

## 部署

部署这一层是四个已就位的文件，各管一件事：

- `Dockerfile`：两段式构建。第一段跑 `npm run build` 产出 `out/`，第二段只有 Nginx 发静态文件——
  运行镜像里没有 Node、没有 API、也没有第三方资源，`docker history` 一眼能审。构建与运行的示例
  命令写在文件头部注释里。
- `nginx.conf`：容器里用的那份站点配置，监听 80、不做 TLS 卸载（容器部署一般把证书交给前面的
  负载均衡）。裸机 CentOS 不要用这份，用下面那份。
- `deploy/centos/nginx-popopx-service.conf`：裸机生产 vhost，`server_name` 是 `mp.popopx.chat`，
  站点根是 `/var/www/mp.popopx.chat`，带证书路径、HTTP→HTTPS 跳转与整套安全头。
- `deploy/centos/deploy_centos.sh`：CentOS / RHEL / Rocky / Alma 一键部署脚本，默认值就是上面那两个
  （`SITE_HOST=mp.popopx.chat`、`WEB_ROOT=/var/www/mp.popopx.chat`），`--web-root` 可以覆盖，脚本会
  按新的站点根改写它装上去的 vhost。

发布动作本身就是「构建 + 铺文件」：`npm run build` 之后把 `out/` 的内容放进站点根。

- vhost 的职责四条：把这些静态文件发出去、按 `trailingSlash` 的目录形式回退到 `index.html`、加上
  严格安全头与缓存策略（内容指纹化的 `/_next/static` 给一年 immutable，图标与 manifest 各自给较短的
  TTL）、不给任何第三方留出口。压缩只开 gzip；brotli 指令在配置里是以注释给出的可选项，需要另装
  nginx 的 brotli 模块才生效。
- 证书走 `certbot certonly --webroot`（80 端口因此保留 `/.well-known/acme-challenge/` 验证路径）。
  不加 `--no-certbot` 就必须给 `--email`；加了 `--no-certbot`，证书目录还不存在时 HTTPS 那块也加载不了。脚本会先打印它将做的改动并要求确认，非交互运行必须显式带
  `--yes`，否则拒绝动这台机器。它还要求站点根里已经有构建好的导出（`out/`，或用 `--source DIR`
  指过去），少了 `index.html` 就停下。脚本另外打印了备选写法 `certbot --nginx -d mp.popopx.chat` 与
  续期自检 `certbot renew --dry-run`，日常续期交给 certbot 自带的 systemd timer。
- 换域名或换站点根：改 `src/lib/site.ts` 的 `SITE_ORIGIN` / `SITE_HOST` 重新构建，再用 `--web-root`
  和 vhost 里的 `server_name` 对齐；`public/robots.txt` 与 `public/sitemap.xml` 里的 canonical 地址
  也要一起过一遍。

## 构建与合规门禁

发布前跑这四条，各自证明的东西不同：

```bash
npm run typecheck    # tsc --noEmit：strict + noUnusedLocals/noUnusedParameters/noImplicitReturns
npm run build        # next build：类型检查 + 静态导出，产物写到 out/
npm run check:i18n   # 18 语言文案完整性（陈旧标签、假翻译）
npm run check:out    # 对 out/ 跑四条「0」门禁（可传别的目录名）
```

`npm run build` 通过，说明所有模块都能编译、静态导出确实产出了 `out/`，不会出现「开发模式跑得好、
导出环节才崩」这一类问题。四条门禁由 `tools/scan-compliance.mjs` 执行，扫的是**发出去的产物**而不是
源码——访客下载的是产物。它读的是文本类产物（`.html`、`.js`、`.css`、`.json`、`.txt`、`.xml`、
`.svg`、`.webmanifest`），图片这类二进制不参与扫描，因为里面没有代码：

1. **0 外部统计追踪**：产物里不出现任何已知分析、会话回放或产品遥测服务的特征码。
2. **0 外部 CDN 与远端资源**：只判浏览器真会去取的东西——外链 `<script src>`、`<link href>`
   （`canonical`/`alternate`/`preconnect` 这类不发请求的除外）、`<img src>` 与 `srcset`、
   媒体与 iframe、CSS `@import`、`url()`、指向绝对 URL 的 `fetch()`。导航栏那种指向
   `https://github.com/popopx-chat/popopx-service-suite` 的 `<a>` 只是链接、不加载资源，因此是允许的。
3. **0 本地路径泄露**：产物里不残留开发机主目录那种绝对路径，macOS、Linux、macOS 临时构建树、
   Windows 四种形态都算。
4. **0 违规敏感词**：文案与产物都不含任务书禁用的那几个词。

这个仓库不带 ESLint 配置文件，也没有测试运行器，`next.config.mjs` 里 `eslint.ignoreDuringBuilds`
为 `true`；`package.json` 的 `lint` 与 `start` 两条在这个工程里没有可用配套（没有 eslint 配置，
而交付物 `out/` 是交给静态服务器的，不走 `next start`）。上面这四条命令就是全部的验收手段。

## 相关仓库

- 后端与协议：[`popopx-service-suite`](https://github.com/popopx-chat/popopx-service-suite)——
  网关、计费、频道信封加密、五个插件和浏览器管理后台，本门户的安装文案与端口都对着它。
- iOS 客户端：[`popopx-chat`](https://github.com/popopx-chat/popopx-chat)——官方紫色 logo 原图与
  18 种语言的语言集都来自这个仓库。
- 本门户：[`popopx-service-suite-web`](https://github.com/popopx-chat/popopx-service-suite-web)。
