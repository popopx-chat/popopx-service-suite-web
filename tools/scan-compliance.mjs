#!/usr/bin/env node
/**
 * Build-output compliance scanner.
 *
 * The acceptance gates for this portal are four hard "0" claims, and each one
 * is checked here against the *shipped artefacts* — not against the source,
 * because the source is not what a visitor downloads:
 *
 *   1. 0 third-party analytics / tracking code
 *   2. 0 external CDN or remote-asset references (script/style/img/font/media)
 *   3. 0 leaked local development paths
 *   4. 0 forbidden sensitive words
 *
 * A navigation `<a href="https://github.com/...">` is not a loaded resource and
 * is therefore allowed; what must not exist is anything the browser would fetch
 * from another origin.
 *
 * Usage:
 *   npm run check:out                 # scan ./out
 *   node tools/scan-compliance.mjs dist
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const TARGET = process.argv[2] ?? "out";
const DIR = join(ROOT, TARGET);

if (!existsSync(DIR)) {
  console.error(`scan: ${TARGET}/ does not exist — run 'npm run build' first`);
  process.exit(1);
}

/** Substrings that would mean a visitor's browser phones home. */
const TRACKING = [
  "googletagmanager", "google-analytics", "gtag(", "dataLayer", "_gaq",
  "fbq(", "facebook.com/tr", "hotjar", "clarity.ms", "plausible.io",
  "useplausible", "umami", "matomo", "piwik", "mixpanel", "amplitude",
  "segment.io", "analytics.js", "posthog", "yandex.ru/metrika", "mc.yandex",
];

/** Origins that would mean an external asset is *loaded*. */
const REMOTE_ASSET_HOSTS = [
  "fonts.googleapis.com", "fonts.gstatic.com", "use.typekit.net",
  "cdn.jsdelivr.net", "unpkg.com", "cdnjs.cloudflare.com",
  "esm.sh", "pagecdn.io", "bootstrapcdn.com", "recaptcha.net",
  "googleapis.com", "gravatar.com", "doubleclick.net",
];

/** Attributes/constructs that actually load something. */
const RESOURCE_PATTERNS = [
  { re: /<script[^>]+\bsrc\s*=\s*["']?(https?:)?\/\//gi, why: "remote <script src>" },
  { re: /<link[^>]+\bhref\s*=\s*["']?(https?:)?\/\//gi, why: "remote <link href>", allowlist: /rel\s*=\s*["']?(canonical|alternate|prefetch|dns-prefetch|preconnect|author|me|publisher)/i },
  { re: /<img[^>]+\bsrc\s*=\s*["']?(https?:)?\/\//gi, why: "remote <img src>" },
  { re: /<(?:video|audio|source|iframe)[^>]+\bsrc\s*=\s*["']?(https?:)?\/\//gi, why: "remote media/iframe" },
  { re: /@import\s+(?:url\()?\s*["']?(https?:)?\/\//gi, why: "CSS @import of a remote sheet" },
  // `(?<!new\s)` keeps a JavaScript `new URL("https://…")` out of a *CSS* rule:
  // core-js in Next's polyfill chunk runs feature tests written exactly that way.
  { re: /(?<!\bnew\s)url\(\s*["']?(https?:)?\/\//gi, why: "CSS url() pointing off-origin" },
  { re: /\bfetch\(\s*["'](https?:)?\/\//gi, why: "fetch() to an absolute URL" },
  { re: /<img[^>]+\bsrcSet\s*=\s*["']?(https?:)?\/\//gi, why: "remote srcset" },
];

const LOCAL_PATH_PATTERNS = [
  /\/Users\/[^\s"'<>]*/,
  /\/home\/[a-z][^\s"'<>]*/,
  /\/private\/var\/folders\//,
  /C:\\Users\\/i,
];

/**
 * This site's own origin — `SITE_HOST` / `SITE_ORIGIN` in `src/lib/site.ts`.
 * An absolute URL pointing back here fetches nothing from a third party, and
 * the canonical link, the Open Graph URL and the JSON-LD block legitimately
 * spell the host out in full.
 */
const SELF_ORIGIN = /\/\/mp\.popopx\.chat/i;

const BANNED_WORDS = [
  { word: "SimpleX", note: "legacy project name" },
  { word: "VPN", note: "forbidden category term" },
  { word: "代理", note: "proxy wording" },
  { word: "专网", note: "private-network wording" },
  { word: "军工", note: "military-industrial wording" },
];

const SCANNABLE = new Set([".html", ".js", ".css", ".json", ".txt", ".xml", ".svg", ".webmanifest"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === ".DS_Store") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (SCANNABLE.has(extname(entry).toLowerCase())) {
      out.push(full);
    }
    // Anything else is a binary asset (png/ico/woff); it carries no code.
  }
  return out;
}

const files = walk(DIR);
const findings = [];

function push(kind, file, evidence) {
  findings.push({ kind, file: relative(ROOT, file), evidence: evidence.slice(0, 160) });
}

for (const file of files) {
  const text = readFileSync(file, "utf8");

  for (const needle of TRACKING) {
    if (text.includes(needle)) {
      push("tracking", file, needle);
    }
  }

  for (const host of REMOTE_ASSET_HOSTS) {
    if (text.includes(host)) {
      push("remote-asset-host", file, host);
    }
  }

  for (const { re, why, allowlist } of RESOURCE_PATTERNS) {
    const matches = text.match(re);
    if (!matches) continue;
    for (const match of matches) {
      if (allowlist && allowlist.test(match)) continue;
      if (SELF_ORIGIN.test(match)) continue;
      push("external-reference", file, `${why}: ${match.trim()}`);
    }
  }

  for (const re of LOCAL_PATH_PATTERNS) {
    const match = text.match(re);
    if (match) {
      push("local-path-leak", file, match[0]);
    }
  }

  for (const { word } of BANNED_WORDS) {
    if (text.includes(word)) {
      push("banned-word", file, word);
    }
  }
}

const byKind = {};
for (const f of findings) {
  byKind[f.kind] = (byKind[f.kind] ?? 0) + 1;
}

console.log(`scan: ${files.length} shipped files under ${TARGET}/`);
for (const f of findings) {
  console.log(`FAIL [${f.kind}] ${f.file} — ${f.evidence}`);
}
console.log(
  `scan: tracking=${byKind.tracking ?? 0} external-cdn=${(byKind["remote-asset-host"] ?? 0) + (byKind["external-reference"] ?? 0)} ` +
    `local-path=${byKind["local-path-leak"] ?? 0} banned-word=${byKind["banned-word"] ?? 0}`,
);

if (findings.length > 0) {
  console.error("scan: compliance gate FAILED");
  process.exit(1);
}
console.log("scan: 0 external trackers · 0 external CDN links · 0 local path leakage · 0 banned words");
