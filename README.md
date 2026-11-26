# popopx-service-suite-web
<!--
  Copyright (c) 2026 POPOPX (popopx.chat)
  SPDX-License-Identifier: AGPL-3.0-only
-->

English · 简体中文：[`README.zh-Hans.md`](README.zh-Hans.md)

The official portal for POPOPX service accounts and zero-knowledge encrypted channels. It is a
Next.js static export: one page carrying the feature tour, the three installation paths it documents
(Ubuntu production, macOS production, macOS development), the operator walkthrough and the
open-protocol quick reference. `npm run build` leaves you with `out/` — HTML, CSS, bundled JavaScript,
the PNG marks and one RSC flight payload, handed out by any static file server, no Node runtime
required. One origin serves everything: the production host is `mp.popopx.chat` (`SITE_HOST`), and the
site origin behind the SEO metadata, the canonical link, the Open Graph URL and the sitemap is
`https://mp.popopx.chat` (`SITE_ORIGIN`). Both values live in `src/lib/site.ts` and only there:
`next.config.mjs` has no `env` block and re-exports neither of them, because its own comment says a
second copy of the domain in build config is exactly how a domain drifts. The backend suite lives in the
sibling `popopx-service-suite` repository and the iOS client in `popopx-chat`. This portal links
against, patches and redistributes none of their code.

## Licence and trademarks

The code is under **AGPL-3.0-only**; the full text is [`LICENSE`](LICENSE), byte-for-byte the same
file as the one in `popopx-service-suite`, and `package.json` carries the matching
`"license": "AGPL-3.0-only"`. The `Copyright` plus `SPDX-License-Identifier: AGPL-3.0-only` pair at the
top of this document is the entry point to that licence. You may use, modify and redistribute it
freely; section 13 of AGPL-3.0 asks exactly one thing: if you run a modified version of this portal
for other people over a network, ship them the modified source too.

**The trademarks are not part of that grant.** The POPOPX name, the logo and the popopx.chat domain
belong to POPOPX — rename a modified distribution, and do not offer deployments, services or
endorsements under the POPOPX name. `src/lib/site.ts` exports a `TRADEMARK_URL` pointing at
`TRADEMARK-POPOPX.md` in the **iOS client** repository `popopx-chat` (branch `master`) — the backend
suite repository does not carry that file, so a link to it there would 404. That notice is what the
portal's trademark copy is aligned with.

The assets under `public/` sit under the trademark notice rather than under AGPL.
`public/logo-popopx.png` is the official POPOPX mark, taken byte-for-byte from the iOS client at
`apps/ios/Shared/Assets.xcassets/AppIcon.appiconset/1024.png` — one SHA-256 for both files, nothing
redrawn. `apple-touch-icon.png` is likewise byte-identical to `180.png` in that same asset catalogue,
and `favicon.png` plus `logo-popopx-512.png` are scaled from the same original. Rebrand, and replace
those files along with the name in the copy.

## Repository layout

```text
popopx-service-suite-web/
├── LICENSE                       AGPL-3.0-only, the same file as in the backend repo
├── README.md                     this document (English; the one GitHub renders by default)
├── README.zh-Hans.md             Simplified Chinese, the source this file is kept in step with
├── package.json                  next 15.5.4 / react 19 / qrcode.react 4.2.0 / tailwind 3.4.17 / ts 5.7.3
├── package-lock.json             pinned dependency resolution
├── next.config.mjs               output: "export" → out/; images.unoptimized; trailingSlash
├── postcss.config.mjs            tailwindcss + autoprefixer
├── tailwind.config.ts            design tokens and the system font stack (no webfont)
├── tsconfig.json                 strict compilation, path alias @/* → ./src/*
├── .gitignore / .dockerignore    ignore node_modules / .next / out, tighten the build context
├── Dockerfile                    two stages: export out/, then serve it with Nginx only
├── nginx.conf                    the in-container site config (port 80, no TLS termination)
├── deploy/centos/
│   ├── deploy_centos.sh          one-shot deploy for CentOS / RHEL / Rocky / Alma
│   └── nginx-popopx-service.conf bare-metal production vhost (TLS + security headers)
├── tools/
│   ├── check-i18n.mjs            18-language copy completeness; errors gate, warnings report
│   └── scan-compliance.mjs       the four "0" gates, run against the build output
├── public/
│   ├── logo-popopx.png           official mark, 1024×1024
│   ├── logo-popopx-512.png       512×512
│   ├── favicon.png               64×64
│   ├── apple-touch-icon.png      180×180
│   ├── site.webmanifest          same-origin icon list and theme colours
│   ├── robots.txt                crawl policy, sitemap declared on this origin
│   └── sitemap.xml               exactly one indexable URL: /
└── src/
    ├── app/
    │   ├── layout.tsx            metadata, viewport, the `<LocaleProvider>` mount point
    │   ├── page.tsx              single-page composition: one module after another
    │   └── globals.css           Tailwind layers, the glass surface classes, anchor offsets
    ├── components/
    │   ├── Navbar.tsx                           sticky nav: anchors, language capsule, repo links, CTA
    │   ├── LanguageMenu.tsx                     the 18-language menu: list plus compact capsule
    │   ├── HeroSection.tsx                      the hero stage
    │   ├── BusinessScenarios.tsx                six plain-language use-case cards under the hero
    │   ├── PluginsShowcase.tsx                  the nine plugin modules that ship in the admin back end
    │   ├── ArchitectureComparison.tsx           the five capability cards and the three-way table
    │   ├── InteractiveSandbox.tsx               admin console simulator beside a phone preview
    │   ├── SecurityGovernanceSection.tsx        credential isolation, HMAC, audit, rate limits
    │   ├── StatusChangelogSection.tsx           backend release history and portal status
    │   ├── ProtocolReferenceSection.tsx         wire-format quick reference
    │   ├── InstallAndUsageGuideSection.tsx      the install tabs and the iPhone walkthrough
    │   ├── DirectoryAndDocsSection.tsx          QR wall, directory JSON, protocol quick reference
    │   ├── Footer.tsx                           licence / trademark / privacy / identity blocks
    │   └── ui.tsx                               CopyButton / SectionHeading / CodeBlock / StatusDot
    └── lib/
        ├── site.ts               hosts, ports, the anchor list, the clipboard helper
        └── i18n.tsx              language engine: LocaleProvider / useLocale / useCopy / pick
```

`src/app/page.tsx` pulls in twelve module components — `Navbar.tsx`, `HeroSection.tsx`,
`BusinessScenarios.tsx`, `PluginsShowcase.tsx`, `ArchitectureComparison.tsx`, `InteractiveSandbox.tsx`,
`SecurityGovernanceSection.tsx`, `StatusChangelogSection.tsx`, `ProtocolReferenceSection.tsx`,
`InstallAndUsageGuideSection.tsx`, `DirectoryAndDocsSection.tsx` and `Footer.tsx` — and together with
those, `src/components/` holds exactly fourteen files: the thirteenth is `LanguageMenu.tsx`, the language control
`Navbar.tsx` imports and renders twice (the desktop capsule and the narrow-screen panel), and the fourteenth
is the shared `ui.tsx`. This document describes what each module is for on the page.

## Quick start

Node.js 18.18 or newer (`engines` in `package.json`) is the only requirement.

```bash
npm install          # next / react / react-dom / qrcode.react plus the build-time packages
npm run dev          # development server with fast refresh
npm run typecheck    # tsc --noEmit, the full strict pass
npm run build        # next build: static export into out/
```

Because `next.config.mjs` sets `output: "export"`, what you ship is the `out/` directory — `.next/` is
only the intermediate build output, and no Node process has to stay up. To look at the artefact, serve
it like any other static site; the port is yours to pick:

```bash
cd out && python3 -m http.server 4173     # local smoke test only
```

`trailingSlash: true` means a route resolves to an `index.html` a server picks up by itself: `/` is
`out/index.html`, the not-found page is `out/404/index.html` (and Next additionally leaves the flat
`out/404.html` that the vhost's `error_page` points at), the content-hashed bundle lives under
`out/_next/static/`, `out/index.txt` is the RSC flight payload shipped beside the prerendered HTML, and
everything from `public/` is copied in verbatim. The vectors are inline `<svg>` in the markup, so the
export holds no `.svg` file of its own. It is still one directory of ordinary files: the plainest file
server on earth resolves it without a single rewrite rule, and no Node runtime is involved.

## Portal sections

There is one page, and the modules are anchored sections of it. The six navigation anchor ids come
from `NAV_SECTIONS` in `src/lib/site.ts` — `overview`, `plugins`, `architecture`, `sandbox`, `security`,
`changelog` — the module order comes from `src/app/page.tsx`, and `id="top"` on the `<main>` element is
the back-to-top landing point. `Navbar.tsx` renders `NAV_SECTIONS` straight into `#id` links, and its
labels are a `Record<NavSectionId, Localized<string>>`, so a missing translation for any anchor fails
the build. The page carries more anchors than the bar lists — `features`, `protocol`, `install`,
`directory`, and `scenarios`, the six business cards sitting directly under the hero. `scenarios`
stays out of the bar on purpose: seven labels do not fit the centred row at `xl` next to the logo, the
ecosystem link, the GitHub pill, the language menu and the CTA, and the block is the second thing on the
page, so nobody has to jump to reach it.

| Module | Component | Anchor | What it does |
| --- | --- | --- | --- |
| 1 · Top navigation | `Navbar.tsx` | links to all six | Sticky glass bar: official mark with the `POPOPX Service Suite` title, the six anchor links, the language capsule, the GitHub entry, the deploy primary button (to `#install`); collapses into a panel on narrow screens |
| 2 · Hero stage | `HeroSection.tsx` | `#overview` | Dual-mode topology behind the headline, with the metric strip stating the facts outright — 0 global user IDs, 100% end-to-end encryption, AGPL-3.0 across the stack; the two buttons point at `#install` and `#sandbox` |
| 3 · Business scenarios | `BusinessScenarios.tsx` | `#scenarios` | The first block below the hero: six plain-language cards — AI customer support, automated enquiry handling, encrypted channel publishing, ops and security alerting, anonymous scan-to-login, connecting your own local agent — each with a three-step flow, the real module file, route or environment switch on one monospaced line, a state word that keeps "on by factory default" apart from "core gateway behaviour" and "an environment switch, no extra plugin", and a jump into the section that documents it |
| 4 · Plugin matrix | `PluginsShowcase.tsx` | `#plugins` | The nine plugin modules that ship ready in the admin back end — on by default: private AI agent, DevOps alert ops, zero-tracking QR sign-in, encrypted polls; off by default: on-chain monitoring with whitelist drops, workflow webhooks, the CardDAV and CalDAV connectors, and the Slack/Discord bridge; category filter, four-step integration path, and a roadmap of planned third-party connectors that now records three credential-dependent integrations still planned and two explicitly declined |
| 5 · Features and architecture | `ArchitectureComparison.tsx` | `#architecture` | The five service-account capabilities (loopback WebSocket isolation, two-level custom menus (3 × 5), three dynamic card styles, pairwise-anonymous HMAC-signed H5, zero-knowledge channels with epoch key rotation), plus a three-way table against classic social accounts and centralised bots |
| 6 · Interactive sandbox | `InteractiveSandbox.tsx` | `#sandbox` | An admin console simulator beside a 1:1 phone preview; visitors really click menus and cards, and a switch flips the view to the relay's point of view — ciphertext and signature digests only |
| 7 · Security and permission governance | `SecurityGovernanceSection.tsx` | `#security` | Credential isolation, the credential vault, scoped admin tokens, signed alert intake, audit logs, rate limiting, and the admin console deployment guide; every control panel cites the shipped code behind it and states remaining boundaries — such as the process-local replay cache — as boundaries, not roadmap items |
| 8 · Status and changelog | `StatusChangelogSection.tsx` | `#changelog` | Backend release history, portal status, and the build verification recipe; stats grid plus the exact commands to reproduce the build |
| 9 · Protocol quick reference | `ProtocolReferenceSection.tsx` | `#protocol` | The channel envelope, the `::POPOPX_ECO::` card protocol, and the H5 verification endpoint `POST /api/v1/verifyH5Auth`; wire formats and byte-level examples |
| 10 · Install and usage guide | `InstallAndUsageGuideSection.tsx` | `#install` | The Ubuntu and macOS tabs, carrying the three install paths of the backend repo: Ubuntu production (`install_ubuntu22.sh`), macOS production (`install_macos.sh`, which puts the gateway behind the launchd label `com.popopx.gateway`) and macOS development (`start_macos.sh`); then console initialisation and quota setup, and the four-step iPhone scan-and-operate walkthrough |
| 11 · Directory and open protocol | `DirectoryAndDocsSection.tsx` | `#directory` | The sample QR display wall with a directory-JSON generator, and the quick reference for the channel envelope, the `::POPOPX_ECO::` card protocol and the H5 verification endpoint `POST /api/v1/verifyH5Auth` |
| 12 · Footer | `Footer.tsx` | its own block ids | Licence, trademark, privacy and identity blocks; the links are the `LICENSE_URL`, `TRADEMARK_URL` and repository constants exported by `src/lib/site.ts`, and what the page prints as its address is `SITE_HOST` with `SITE_ORIGIN` |

Every address the copy uses comes from `src/lib/site.ts` and nowhere else: site origin
`https://mp.popopx.chat`, production host `mp.popopx.chat`, the local gateway console
`http://127.0.0.1:8080`, and the open-source node's loopback WebSocket `ws://127.0.0.1:5225`.

## Language switch

This is no longer a three-language switch: the portal offers the same 18 languages as the iOS client.
The engine is `src/lib/i18n.tsx`, mounted as the `<LocaleProvider>` that wraps the whole tree in
`layout.tsx`.

- `LOCALES` carries the 18 tags in the order the iOS client declares its localizations: `en`, `ru`,
  `de`, `fr`, `it`, `nl`, `cs`, `zh-Hans`, `zh-Hant`, `es`, `pl`, `ja`, `th`, `fi`, `uk`, `bg`, `tr`,
  `hu` (`LOCALE_COUNT` is 18). `Localized<T>` is a **total** `Record` over those 18 keys. Write copy
  in 17 languages and `npm run typecheck` refuses to compile, so a missing translation is caught at
  build time rather than discovered by a visitor.
- `zh-Hans` (Simplified Chinese) is the default, and `layout.tsx` emits `<html lang>` for it up front.
- Copy lives inline inside each component and `useCopy()` resolves it against the active locale.
  Switching is a pure re-render: no reload, no route change, no request, no remote language pack. The
  URL never changes with language, which is why `public/sitemap.xml` declares exactly one indexable
  location, `/`.
- The visitor's choice is written to that visitor's own `localStorage` under `popopx.locale`
  (`STORAGE_KEY`) and beats browser detection on the next visit.
- Detection runs inside `useEffect` only. `detectLocale()` walks `navigator.language` and
  `navigator.languages`, matching the primary subtag against the 18 tags; `zh-HK`, `zh-MO`, `zh-TW`
  and anything marked `hant` resolve to `zh-Hant`, every other `zh-*` to `zh-Hans`, and a language
  none of the tags cover keeps the default `zh-Hans` — which is also exactly what the server pass and
  the first client pass paint, because reading `navigator` during render would be a hydration
  mismatch.
- Switching keeps `document.documentElement.lang` (BCP 47 forms from `HTML_LANG`) and `dir` in sync.
  None of the 18 writes right-to-left, so `isRightToLeft()` currently always answers `false` and `dir`
  stays `ltr`; the helper exists so that adding an RTL language has to be a deliberate change.
- The language menu calls each language by its own name (`LOCALE_NATIVE`: English, Deutsch, 日本語,
  简体中文, 繁體中文 and so on); the compact capsule uses `LOCALE_SHORT`, at most three characters per
  tag (`简`, `繁`, `EN`, `DE` and the like).
- `pick()` falls back in this order at runtime: active locale → `en` → `zh-Hans` → the raw value as a
  string. That is how `POPOPX`, `AGPL-3.0-only` and shell commands can be written once and used
  everywhere.
- `npm run check:i18n` (`tools/check-i18n.mjs`) is the oracle for what the compiler cannot see, and it
  splits its findings by severity — only the first group stops a build. **Errors** are what make the
  command exit 1: a stale locale tag (`zh-CN`, `zh-TW`) mixed into a copy object; a copy map *derived*
  by a function annotated to return `Localized<…>`; an `as Localized<…>` cast over an untyped map; a
  spread inside a copy object; a copy object that omits any of the 18 locales. **Warnings** do not: a
  non-`en` slot repeating the English string verbatim is reported, so the "same string pasted into every
  one of the 18 slots" case is surfaced, not gated. On the current tree the command exits 0 with 0 errors
  and 10 warnings. `--quiet` prints only the two summary lines.

## Privacy and self-host guarantees

Only what this scaffold actually enforces, each one checkable against a file — and re-checked against
the shipped artefacts by `npm run check:out`:

- **No third-party analytics or tracking scripts.** The runtime dependency list in `package.json` is
  `next`, `react`, `react-dom` and `qrcode.react` — no analytics SDK, and no externally hosted script
  tag anywhere in the source.
- **No external font or image hosts.** `tailwind.config.ts` defines a system font stack
  (`-apple-system`, `PingFang SC`, `Microsoft YaHei` and friends) with no `@font-face`; `globals.css`
  imports no remote stylesheet and has no off-origin `url()`; `images.unoptimized` in
  `next.config.mjs` is both a hard requirement of export mode and the privacy-correct choice — there is
  no remote image service, every asset comes from this origin.
- **QR codes are rendered locally.** `qrcode.react` draws them as `QRCodeSVG` vectors in the browser,
  so they stay sharp with the network unplugged and never pass through an image endpoint.
- **No cookies.** Nothing in the source touches `document.cookie`; the only preference ever persisted
  is `popopx.locale` in the visitor's own `localStorage`, and it never leaves the browser.
- **No referrer leakage.** `layout.tsx` emits `referrer: no-referrer`, matching the `Referrer-Policy`
  the production vhost sets.
- **A static artefact you can put anywhere.** `out/` needs no Node runtime and no server-side
  rendering, so Nginx, Caddy, object storage or a machine that only has Python installed will all do —
  and the whole site can stay inside your own network.

One honest caveat: this is a React static export, so the build does ship JavaScript — its own, bundled
under `/_next/static` on the same origin. The language switch and the interactive sandbox run on it.
What is promised here is "nobody else's scripts", not "no scripts".

## Deployment

Four files cover the deployment layer, each with its own job:

- `Dockerfile`: a two-stage build. Stage one runs `npm run build` and produces `out/`; stage two is
  Nginx serving those files and nothing else — no Node runtime, no API, no third-party asset in the
  running image, which is what makes `docker history` a usable audit. The build and run examples are
  in the comment block at the top of the file.
- `nginx.conf`: the in-container site config. It listens on port 80 and does no TLS termination,
  because a container deployment normally keeps certificates at the load balancer in front. For bare
  metal on CentOS, use the next file instead.
- `deploy/centos/nginx-popopx-service.conf`: the bare-metal production vhost — `server_name
  mp.popopx.chat`, document root `/var/www/mp.popopx.chat`, certificate paths, the HTTP to HTTPS
  redirect and the full header set.
- `deploy/centos/deploy_centos.sh`: the one-shot deploy script for CentOS, RHEL, Rocky and Alma. Its six
  defaults — `SITE_HOST`, `SITE_ORIGIN`, `WEB_ROOT`, `SOURCE_DIR`, `CERT_EMAIL`, `NGINX_CONF_NAME` — are
  each taken from an environment variable of the same name and each has a flag: `--host NAME`,
  `--source DIR`, `--web-root PATH`, `--email ADDRESS`, `--yes` (also `-y`), `--dry-run`, `--check`,
  `--no-certbot`, and `-h`/`--help` prints the usage block; an unrecognised option is a hard stop. Note
  that `SITE_ORIGIN` has a default and an environment override but no flag. The two headline defaults are
  those same values (`SITE_HOST=mp.popopx.chat`, `WEB_ROOT=/var/www/mp.popopx.chat`), and the script
  rewrites the vhost it installs to match whatever you pass.

Publishing itself is build and copy: run `npm run build`, then lay the contents of `out/` into the
document root.

- The vhost has four jobs: serve those static files, fall back to the directory-style `index.html`
  that `trailingSlash` produces, apply strict security headers plus a cache policy (content-hashed
  `/_next/static` for a year as `immutable`, icons and the manifest on shorter lifetimes), and leave no
  door open to a third party. Compression is gzip only in the shipped config; the brotli directives are
  documented there as an option that needs the external nginx brotli module installed.
- Certificates come from `certbot certonly --webroot`, which is why port 80 keeps
  `/.well-known/acme-challenge/` reachable, and `--email` is mandatory unless you pass `--no-certbot`.
  What a plain run prints before its `Proceed with the steps above? [y/N]` prompt is **preflight
  evidence**, not a change plan: the host, document root and origin it resolved, which export it found
  and how many files it holds, the nginx version, whether the logo assets are there, whether SELinux is
  enforcing. The mutation plan is only printed by `--dry-run`, which pushes every filesystem and service
  call through the script's `run()` helper so it is echoed instead of executed — and `--dry-run` skips
  the prompt, while `--check` stops after the preflight and exits 0 having changed nothing (its gate
  order is the same as a real run: root, a readable vhost template, a finished export and either
  `--email` or `--no-certbot` are all required before it reports). A non-interactive run has to say
  `--yes` explicitly or it refuses to touch the machine. It also insists on a finished export: absent
  `--source DIR` it looks for `out/` in the repository root and then `dist/`, and stops if neither holds
  an `index.html`. Both the alternative issuance form `certbot --nginx -d mp.popopx.chat` and the renewal
  check `certbot renew --dry-run` are printed for you; day-to-day renewal is the certbot systemd timer's
  job.
- `--no-certbot` is not a quiet HTTP-only mode. The script warns that the HTTPS block will not load until
  `/etc/letsencrypt/live/$SITE_HOST` exists, installs the vhost anyway, and `nginx -t` then fails on the
  missing key — which is exactly why the normal path asks for the certificate before installing the
  vhost. The rejection is undone before the script stops: the previous vhost is restored when one
  existed, the new file is removed when it did not, `nginx -t` is re-checked to prove the rollback
  worked, and the run exits non-zero with nothing reloaded and nothing left installed.
- Three parts of the run are easy to miss if you only read the flags: `restorecon -Rv` over the document
  root whenever `restorecon` is available, so nginx may read the files under enforcing SELinux; permanent
  firewalld openings for `http` and `https` plus a reload, with a warning to check your cloud security
  group when firewalld is not active; and an HTTP/2 version guard — the shipped template uses the
  portable `listen … 443 ssl http2;` spelling, and if it is ever switched to the 1.25.1-era `http2 on;`
  directive against an older nginx, that is an `[emerg]` which fails the whole config test, so the script
  stops rather than installing it. The summary it ends with prints the verification commands —
  `curl -sI https://mp.popopx.chat/`, `curl -s https://mp.popopx.chat/ | grep -c 'POPOPX'`,
  `nginx -T | grep -E 'server_name|root'` and `certbot renew --dry-run` — plus the redeploy one-liner.
- Changing domain or document root: edit `SITE_ORIGIN` and `SITE_HOST` in `src/lib/site.ts` and rebuild,
  then pass `--host` and `--web-root` — the script rewrites the host and the `/var/www/mp.popopx.chat`
  document root inside the copy of the vhost it installs, so `server_name` follows without a hand edit.
  What the script will not do: `SITE_ORIGIN` has no flag, it only feeds the script's own preflight and
  summary output, and nothing in the export changes until you rebuild. The canonical addresses written
  into `public/robots.txt` and `public/sitemap.xml` still need that manual pass.

## Build and compliance gates

Run all four before a release; each proves something different.

```bash
npm run typecheck    # tsc --noEmit: strict plus noUnusedLocals, noUnusedParameters, noImplicitReturns
npm run build        # next build: type checking and static export into out/
npm run check:i18n   # 18-language copy completeness; exits 1 on errors, --quiet = summary only
npm run check:out    # the four "0" gates against out/ (takes an alternative directory argument)
```

A green `npm run build` means every module compiles and the static export really produced `out/`, so
you cannot hit the "fine in dev, collapses at export" class of failure. The four gates are enforced by
`tools/scan-compliance.mjs`, and it scans what a visitor actually downloads — the artefacts, not the
source. Text-like outputs (`.html`, `.js`, `.css`, `.json`, `.txt`, `.xml`, `.svg`, `.webmanifest`) are
read; image binaries are skipped because they carry no code.

1. **0 external trackers** — no signature from any known analytics, session-replay or
   product-telemetry service may appear in the output.
2. **0 external CDN or remote asset references** — only things the browser would actually fetch count:
   remote `<script src>`, `<link href>` (apart from `canonical`, `alternate`, `preconnect` and friends,
   which load nothing), `<img src>` and `srcset`, media and iframes, CSS `@import`, `url()`, and
   `fetch()` against an absolute URL. The navbar's `<a>` pointing at
   `https://github.com/popopx-chat/popopx-service-suite` is a link, not a loaded resource, so it is
   allowed.
3. **0 local path leakage** — no absolute paths into a developer's home directory, in any of the four
   shapes the scanner knows (macOS, Linux, a macOS temporary build tree, Windows).
4. **0 banned words** — none of the five terms the build brief disallows (the `BANNED_WORDS` list in
   `tools/scan-compliance.mjs`), in the copy or in the output.

This repository ships no ESLint configuration and no test runner, and `eslint.ignoreDuringBuilds` is
`true` in `next.config.mjs`. The `lint` and `start` entries in `package.json` have no working counterpart
here — there is no ESLint config to run, and the deliverable `out/` is handed to a static server rather
than to `next start`. Those four commands above are the entire acceptance suite.

## Related repos

- Backend and protocol: [`popopx-service-suite`](https://github.com/popopx-chat/popopx-service-suite)
  — the gateway, billing, channel envelope encryption, the nine plugin modules (including the
  workflow bridge, the CardDAV and CalDAV connectors and the Slack/Discord bridge) and the browser
  admin console; every command and port in the portal's install copy is aligned with it.
- iOS client: [`popopx-chat`](https://github.com/popopx-chat/popopx-chat) — the official purple mark and
  the set of 18 languages both come from this repository.
- This portal: [`popopx-service-suite-web`](https://github.com/popopx-chat/popopx-service-suite-web).
