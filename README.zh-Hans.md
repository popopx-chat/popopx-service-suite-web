# popopx-service-suite-web
<!--
  Copyright (c) 2026 POPOPX (popopx.chat)
  SPDX-License-Identifier: AGPL-3.0-only
-->

简体中文 · English：[`README.md`](README.md)

POPOPX 服务号与零知识加密频道的官方门户网站：一个 Next.js 静态导出工程，把功能说明、三条安装路径
（Ubuntu 生产部署、macOS 生产部署、macOS 开发启动）、后台操作指引和开放协议速查全部
装进同一个单页。`npm run build` 产出的 `out/` 就是 HTML、CSS、打包后的 JavaScript、PNG 图标，
再加上一份 RSC flight payload，任何静态文件服务器都能直接把它发出去，线上不需要 Node 运行时。生产主机与
SEO / canonical 用的是同一个源：`SITE_HOST` 是 `mp.popopx.chat`，`SITE_ORIGIN` 是
`https://mp.popopx.chat`，两个值只写在 `src/lib/site.ts` 这一处——`next.config.mjs` 里没有 `env`
块，也不会把它们再导出一次；那份配置自己的注释说明，把域名在构建配置里再抄一份正是域名漂移的
起点。后端套件在同级仓库
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
├── README.md                     English（GitHub 仓库首页默认渲染的那份）
├── README.zh-Hans.md             本文档（简体中文），与英文版逐节对应
├── package.json                  next 15.5.4 / react 19 / qrcode.react 4.2.0 / tailwind 3.4.17 / ts 5.7.3
├── package-lock.json             锁定依赖版本
├── next.config.mjs               output: "export" → 产物 out/；images.unoptimized；trailingSlash
├── postcss.config.mjs            tailwindcss + autoprefixer
├── tailwind.config.ts            设计令牌与系统字体栈（无 webfont）
├── tsconfig.json                 strict 编译，路径别名 @/* → ./src/*
├── .gitignore / .dockerignore    忽略 node_modules / .next / out，收紧构建上下文
├── Dockerfile                    两段式：先导出 out/，运行阶段只有 Nginx
├── nginx.conf                    容器内用的站点配置（80 端口，不做 TLS 卸载）
├── deploy/centos/
│   ├── deploy_centos.sh          CentOS / RHEL / Rocky / Alma 一键部署
│   └── nginx-popopx-service.conf 裸机生产 vhost（TLS + 安全头）
├── tools/
│   ├── check-i18n.mjs            多语言文案完整性检查（error 拦构建，warning 只报告）
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
    │   ├── Navbar.tsx                           吸顶导航：锚点、语言胶囊、仓库入口、主 CTA
    │   ├── LanguageMenu.tsx                     18 语言菜单：完整列表与紧凑胶囊
    │   ├── HeroSection.tsx                      首屏舞台
    │   ├── BusinessScenarios.tsx                首屏下方的四张业务场景卡
    │   ├── PluginsShowcase.tsx                  后台开箱即用的五个插件
    │   ├── ArchitectureComparison.tsx           五大特点卡片与三方对比表
    │   ├── InteractiveSandbox.tsx               后台控制台模拟器与手机预览
    │   ├── SecurityGovernanceSection.tsx        凭证隔离、HMAC 鉴权、审计、限流
    │   ├── StatusChangelogSection.tsx           后端发布历史与门户状态
    │   ├── ProtocolReferenceSection.tsx         协议速查
    │   ├── InstallAndUsageGuideSection.tsx      安装标签区与 iPhone 四步图解
    │   ├── DirectoryAndDocsSection.tsx          二维码墙、目录 JSON、协议速查
    │   ├── Footer.tsx                           协议 / 商标 / 隐私 / 身份信息区
    │   └── ui.tsx                               CopyButton / SectionHeading / CodeBlock / StatusDot
    └── lib/
        ├── site.ts               域名、端口、锚点清单、剪贴板 helper
        └── i18n.tsx              多语言引擎：LocaleProvider / useLocale / useCopy / pick
```

`src/app/page.tsx` 一共引入十二个模块组件——`Navbar.tsx`、`HeroSection.tsx`、
`BusinessScenarios.tsx`、`PluginsShowcase.tsx`、`ArchitectureComparison.tsx`、`InteractiveSandbox.tsx`、
`SecurityGovernanceSection.tsx`、`StatusChangelogSection.tsx`、`ProtocolReferenceSection.tsx`、
`InstallAndUsageGuideSection.tsx`、`DirectoryAndDocsSection.tsx`、`Footer.tsx`；连同这十二个，
`src/components/` 里正好是十四个文件：第十三个是 `LanguageMenu.tsx`，即 `Navbar.tsx` 引入并渲染两次
（桌面胶囊与窄屏面板）的语言控件，第十四个是共享原语 `ui.tsx`。本文件只描述各模块在页面上的职责。

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

因为配置里开了 `trailingSlash: true`，路由会解析到服务器自己能认下的 `index.html`：`/` 对应
`out/index.html`，找不到页面对应 `out/404/index.html`（Next 另外留了一份扁平的 `out/404.html`，
vhost 的 `error_page` 指的就是它），带内容指纹的打包产物在 `out/_next/static/` 下，
`out/index.txt` 是跟预渲染 HTML 一起发布的 RSC flight payload，`public/` 里的东西原样拷进来。
矢量图是写在 HTML 里的内联 `<svg>`，因此产物目录本身没有 `.svg` 文件。这些仍然只是一个目录的
普通文件：最普通的文件服务器也能直接访问到，不需要任何重写规则，也不涉及 Node 运行时。

## 页面模块

整站是一页，模块就是锚点区。六个导航锚点的 id 以 `src/lib/site.ts` 的 `NAV_SECTIONS` 为准
（`overview`、`plugins`、`architecture`、`sandbox`、`security`、`changelog`），模块顺序以
`src/app/page.tsx` 为准，`<main>` 上的 `id="top"` 是回到顶部的落点。`Navbar.tsx` 把
`NAV_SECTIONS` 直接渲染成 `#id` 链接，锚点文案是 `Record<NavSectionId, Localized<string>>`，
少一个 id 的翻译就编译不过。页面上的锚点其实比导航条多——`features`、`protocol`、`install`、
`directory`，以及紧贴首屏的四张业务场景卡 `scenarios`。`scenarios` 故意不进导航条：七个标签在 `xl`
宽度下放不下（左边是 logo 与标题，右边还有生态入口、GitHub、语言菜单和部署按钮），而这块内容就在页面第二屏，
不需要跳转才能看到。

| 模块 | 组件 | 锚点 | 职责 |
| --- | --- | --- | --- |
| 一 顶部导航 | `Navbar.tsx` | 指向六个锚点 | 毛玻璃吸顶条：官方 logo 与 `POPOPX Service Suite` 标题、六个锚点链接、语言胶囊、GitHub 入口、部署主按钮（`#install`），窄屏收进一个面板 |
| 二 首屏舞台 | `HeroSection.tsx` | `#overview` | 双模拓扑背景与主标语，指标条把「0 全局用户 ID」「100% 端到端加密」「AGPL-3.0 全栈开源」这些事实一次说完，两个按钮分别指向 `#install` 与 `#sandbox` |
| 三 业务场景 | `BusinessScenarios.tsx` | `#scenarios` | 首屏下面的第一块：四张面向业务的卡片——AI 客服接待、加密频道发布、运维安全告警、匿名扫码登录——每张给三步流程、一行等宽的真实模块文件与接口、把「默认开启」和「网关核心能力」分开的状态标注，以及跳到对应章节的链接 |
| 四 插件矩阵 | `PluginsShowcase.tsx` | `#plugins` | 后台开箱即用的五个扩展插件：隐私 AI 客服、DevOps 告警、零追踪扫码登录、加密问卷与匿名投票、链上资产监控与白名单发卡；分类筛选、四步接入路径、第三方连接器路线图 |
| 五 特点与架构对比 | `ArchitectureComparison.tsx` | `#architecture` | 服务号五大技术特点称号卡片（本地 WebSocket 隔离、两级 3 × 5 底部菜单、三样式动态卡片、成对匿名 H5 签名、零知识频道与 Epoch 轮换），外加与传统社交公众号、中心化 Bot 的三方对比表 |
| 六 互动体验沙盒 | `InteractiveSandbox.tsx` | `#sandbox` | 左边后台控制台模拟器、右边 1:1 手机预览，可真实点击菜单与卡片，并一键切到「中继服务器视角」看密文与签名摘要 |
| 七 安全与权限治理 | `SecurityGovernanceSection.tsx` | `#security` | 凭证隔离、HMAC 鉴权、审计日志、限流策略、管理控制台部署指南；每个控制面板都标注已实现与规划中 |
| 八 状态与更新日志 | `StatusChangelogSection.tsx` | `#changelog` | 后端发布历史、门户状态、构建验证步骤；指标网格加复现构建的完整命令 |
| 九 协议速查 | `ProtocolReferenceSection.tsx` | `#protocol` | 频道信封、`::POPOPX_ECO::` 卡片协议、H5 验签接口 `POST /api/v1/verifyH5Auth`；线格式与字节级示例 |
| 十 安装与操作指南 | `InstallAndUsageGuideSection.tsx` | `#install` | Ubuntu 与 macOS 两个标签，装着后端仓库的三条安装路径：Ubuntu 生产部署（`install_ubuntu22.sh`）、macOS 生产部署（`install_macos.sh`，把网关挂到 launchd 标签 `com.popopx.gateway` 上）、macOS 开发启动（`start_macos.sh`）；再加后台初始化与配额设置、iPhone 扫码关注到插件启用的四步图解 |
| 十一 目录与开放协议 | `DirectoryAndDocsSection.tsx` | `#directory` | 示范二维码展示墙与目录 JSON 生成器，加上信封协议、`::POPOPX_ECO::` 卡片协议、H5 验签接口 `POST /api/v1/verifyH5Auth` 的速查 |
| 十二 页脚 | `Footer.tsx` | 自带区块 id | 协议、商标、隐私与身份信息四块，链接用 `src/lib/site.ts` 导出的 `LICENSE_URL` / `TRADEMARK_URL` / 三个仓库地址，页面上显示的就是 `SITE_HOST` 与 `SITE_ORIGIN` |

文案里出现的地址只有 `src/lib/site.ts` 给定的这几个：站点源 `https://mp.popopx.chat`、生产主机
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
- `npm run check:i18n`（`tools/check-i18n.mjs`）补的是编译器看不见的那部分，结论按严重级别分两类，
  只有第一类会拦住构建。**错误（error）** 让命令 exit 1：文案对象里混进陈旧标签（`zh-CN`、`zh-TW`）；
  用一个标注返回 `Localized<…>` 的函数**推导**出文案映射；对无类型映射做 `as Localized<…>` 断言；
  文案对象里用展开（spread）复制别的映射；文案对象缺了 18 种语言里的任意一个。**警告（warning）**
  不拦构建：某个非 `en` 槽位与英文原文逐字相同只会被告知——也就是说「把同一段字符串粘满 18 个槽」
  会被报出来、但不会被拦住。以当前代码树跑一遍的结果是 exit 0、0 error、10 warning。
  加 `--quiet` 就只打印最后两行汇总，不打印逐条明细。

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
- `deploy/centos/deploy_centos.sh`：CentOS / RHEL / Rocky / Alma 一键部署脚本。它的六个默认值
  （`SITE_HOST`、`SITE_ORIGIN`、`WEB_ROOT`、`SOURCE_DIR`、`CERT_EMAIL`、`NGINX_CONF_NAME`）都先取同名
  环境变量，并且各自有开关可用：`--host NAME`、`--source DIR`、`--web-root PATH`、`--email ADDRESS`、
  `--yes`（也接受 `-y`）、`--dry-run`、`--check`、`--no-certbot`，`-h`/`--help` 打印用法；认不出的参数
  直接终止。要注意 `SITE_ORIGIN` 只有默认值和环境变量两条路，没有对应开关。其中 `SITE_HOST` 与
  `WEB_ROOT` 的默认值就是上面那两个（`mp.popopx.chat`、`/var/www/mp.popopx.chat`），脚本会按你传进去的
  值改写它装上去的那份 vhost。

发布动作本身就是「构建 + 铺文件」：`npm run build` 之后把 `out/` 的内容放进站点根。

- vhost 的职责四条：把这些静态文件发出去、按 `trailingSlash` 的目录形式回退到 `index.html`、加上
  严格安全头与缓存策略（内容指纹化的 `/_next/static` 给一年 immutable，图标与 manifest 各自给较短的
  TTL）、不给任何第三方留出口。压缩只开 gzip；brotli 指令在配置里是以注释给出的可选项，需要另装
  nginx 的 brotli 模块才生效。
- 证书走 `certbot certonly --webroot`（80 端口因此保留 `/.well-known/acme-challenge/` 验证路径），
  只要不加 `--no-certbot`，`--email` 就是必填项。普通运行在 `Proceed with the steps above? [y/N]` 之前
  打印的是**预检事实**，不是改动清单：解析出来的域名、站点根与 canonical 源、找到的导出目录里有多少
  文件、nginx 版本、logo 资源在不在、SELinux 是否 enforcing。真正的变更计划只有 `--dry-run` 会打印——
  脚本把所有会动文件与服务的调用都收进 `run()`，dry-run 时只回显不执行；`--dry-run` 不问确认，
  `--check` 则在预检之后直接 exit 0、什么都不改——但它的检查顺序与真实运行一致：root、可读的 vhost
  模板、构建好的导出，再加 `--email` 与 `--no-certbot` 二选一，都是它开口报告的前提。
  非交互运行必须显式带 `--yes`，否则拒绝动这台机器。
  它还要求已经有构建好的导出：没给 `--source DIR` 时先找仓库根的 `out/`，再找 `dist/`，两处都没有
  `index.html` 就停下。脚本另外打印了备选写法 `certbot --nginx -d mp.popopx.chat` 与续期自检
  `certbot renew --dry-run`，日常续期交给 certbot 自带的 systemd timer。
- `--no-certbot` 不是一个安静的「只上 HTTP」模式：脚本会先警告 `/etc/letsencrypt/live/$SITE_HOST`
  不存在时 HTTPS 那块加载不了，然后照样把 vhost 装上去，`nginx -t` 随即因为缺私钥失败——这也正是正常
  路径先签证书再装 vhost 的原因（模板里的 `ssl_certificate` / `ssl_certificate_key` 就指向那个目录）。
  失败会被撤掉：原本有 vhost 就把上一份还原，原来没有就把新文件删掉，然后再跑一次 `nginx -t` 确认回滚
  干净，最后以非零状态退出——既不 reload，也不会留下一份把整台机器配置测试拖坏的文件。
- 三处只看开关容易漏掉的动作：只要机器上有 `restorecon`，脚本就会对站点根跑一次 `restorecon -Rv`，
  让 enforcing 模式的 SELinux 也允许 nginx 读这些文件；firewalld 处于活动状态时永久打开 `http` 与
  `https` 服务并 reload，没活动就提醒你自查云安全组或 iptables；还有一道 HTTP/2 版本闸门——模板用的
  是可移植的 `listen … 443 ssl http2;` 写法，一旦换成 1.25.1 才有的 `http2 on;` 而机器上的 nginx 更老，
  那就是会让整份配置测试失败的 `[emerg]`，脚本选择停下而不是装上去。脚本结尾的汇总给了四条自检命令
  （`curl -sI https://mp.popopx.chat/`、`curl -s https://mp.popopx.chat/ | grep -c 'POPOPX'`、
  `nginx -T | grep -E 'server_name|root'`、`certbot renew --dry-run`）以及重新部署的那一行命令。
- 换域名或换站点根：改 `src/lib/site.ts` 的 `SITE_ORIGIN` / `SITE_HOST` 并重新构建，然后带上 `--host`
  与 `--web-root`——脚本会把它装上去的那份 vhost 副本里的域名与 `/var/www/mp.popopx.chat` 站点根一起
  重写掉，`server_name` 不需要你手工对齐。脚本帮不上的两处：`SITE_ORIGIN` 没有对应开关，它只喂给脚本
  自己的预检与汇总输出，不改它、构建产物也不会跟着变；`public/robots.txt` 与 `public/sitemap.xml` 里
  写死的 canonical 地址仍然要手工过一遍。

## 构建与合规门禁

发布前跑这四条，各自证明的东西不同：

```bash
npm run typecheck    # tsc --noEmit：strict + noUnusedLocals/noUnusedParameters/noImplicitReturns
npm run build        # next build：类型检查 + 静态导出，产物写到 out/
npm run check:i18n   # 18 语言文案完整性（error 才 exit 1；--quiet 只出汇总）
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
4. **0 违规敏感词**：文案与产物都不含任务书禁用的那五个词（`tools/scan-compliance.mjs` 里的
   `BANNED_WORDS` 列表）。

这个仓库不带 ESLint 配置文件，也没有测试运行器，`next.config.mjs` 里 `eslint.ignoreDuringBuilds`
为 `true`；`package.json` 的 `lint` 与 `start` 两条在这个工程里没有可用配套（没有 eslint 配置，
而交付物 `out/` 是交给静态服务器的，不走 `next start`）。上面这四条命令就是全部的验收手段。

## 相关仓库

- 后端与协议：[`popopx-service-suite`](https://github.com/popopx-chat/popopx-service-suite)——
  网关、计费、频道信封加密、五个插件和浏览器管理后台，本门户的安装文案与端口都对着它。
- iOS 客户端：[`popopx-chat`](https://github.com/popopx-chat/popopx-chat)——官方紫色 logo 原图与
  18 种语言的语言集都来自这个仓库。
- 本门户：[`popopx-service-suite-web`](https://github.com/popopx-chat/popopx-service-suite-web)。
