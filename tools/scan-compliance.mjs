#!/usr/bin/env node
/**
 * Build-output compliance scanner.
 *
 * The acceptance gates for this portal are seven hard "0" claims, and each one
 * is checked here against the *shipped artefacts* — not against the source,
 * because the source is not what a visitor downloads:
 *
 *   1. 0 third-party analytics / tracking code
 *   2. 0 external CDN or remote-asset references (script/style/img/font/media)
 *   3. 0 leaked local development paths
 *   4. 0 forbidden sensitive words
 *   5. 0 credential-shaped secrets pasted into a sample
 *   6. 0 dead in-page anchors — every `href="#x"` needs its `id="x"`
 *   7. 0 unlisted outbound hosts — a link to a host nobody verified is a
 *      dead link on an official page
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
import { join, relative, resolve, extname } from "node:path";

const ROOT = process.cwd();
const TARGET = process.argv[2] ?? "out";
const DIR = resolve(ROOT, TARGET);

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

/**
 * Hosts a published link may point at. The portal is allowed to *link* out, so
 * the question is only ever "is this a destination we actually own or name" —
 * an unlisted host means somebody wrote a URL that was never verified, which is
 * a dead link on an official page. Kept in sync with `src/lib/site.ts`.
 */
const ALLOWED_LINK_HOSTS = [
  /^mp\.popopx\.chat$/i,
  /^popopx\.chat$/i,
  /^bot\.popopx\.chat$/i,
  /^node\.popopx\.chat$/i,
  /^github\.com$/i,
  /^127\.0\.0\.1$/i,
  /^localhost$/i,
];

/** Anchors: every `href="#x"` in a shipped HTML document needs its `id="x"`. */
const ANCHOR_HREF_RE = /\bhref\s*=\s*["']#([^"'?#]+)["']/g;
const ID_RE = /(?<![-\w])id\s*=\s*["']([A-Za-z0-9_:.-]+)["']/g;
const ABS_LINK_RE = /\b(?:href|src|content)\s*=\s*["'](https?:)?\/\/([^"'/\s?#]+)/g;

/**
 * Credential shapes that must never appear anywhere in the output, not even
 * inside a code sample. A sample key is always a placeholder (`<...>`, `Your...`,
 * `sk-xxxx`, or a sequential test vector), so a hit here is a real secret that
 * got pasted into prose.
 */
const SECRET_PATTERNS = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, why: "private key block" },
  { re: /\bAKIA[0-9A-Z]{16}\b/g, why: "AWS access key id" },
  { re: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g, why: "GitHub token" },
  { re: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/g, why: "GitHub fine-grained token" },
  { re: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g, why: "Slack token" },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/g, why: "Google API key" },
  { re: /\bsk-[A-Za-z0-9]{32,}\b/g, why: "OpenAI-style secret key" },
  { re: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, why: "JWT" },
];

/**
 * Values that *look* like a credential but are not one of the shapes above.
 * These are reported, not failed: the portal deliberately prints sample keys,
 * and only a human can say "this one is a documented demo vector". Every hit is
 * listed so the count can be reconciled against the backend source, and so a
 * placeholder-shaped value (`<...>`, `$VAR`, `your-key`) is recognised as such
 * instead of being counted as a sample.
 */
const CREDENTIAL_PARAM_RE =
  /((?:api[_-]?|client[_-]?|access[_-]?|secret[_-]?|auth)?(?:key|secret|token|authorization|signature|sig|password|passwd|credential))(?:[_-]\w+)?\s*(?:=|:|%3D)\s*(?:bearer\s+|basic\s+)?["']?([A-Za-z0-9+/_=-]{24,})["']?/gi;

const PLACEHOLDER_SHAPE =
  /(<|\$\{|%s|\.\\.\\.|your[-_]|yours|example|placeholder|changeme|change-me|replace|dummy|sample|demo|xxx)/i;

/** Sequential ASCII/bytes — the shape a self-respecting test vector always has. */
const SYNTHETIC_VECTOR = /^(?:[A-Za-z0-9+/=_-]*)(?:AQIDBAUG|0123456789|abcdefgh|ISIjJCUm|YWJjZG)/;

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
/** Not failures: things a human has to adjudicate, printed so the count is on the record. */
const notes = [];
const linkHosts = new Set();
let anchorCount = 0;
let idCount = 0;

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

  for (const { re, why } of SECRET_PATTERNS) {
    for (const match of text.match(re) ?? []) {
      push("secret", file, `${why}: ${match.slice(0, 48)}`);
    }
  }

  for (const m of text.matchAll(CREDENTIAL_PARAM_RE)) {
    const value = m[2];
    if (PLACEHOLDER_SHAPE.test(value) || SYNTHETIC_VECTOR.test(value)) continue;
    notes.push(`${relative(ROOT, file)} — ${m[1]}=${value.slice(0, 56)}`);
  }

  if (extname(file).toLowerCase() === ".html") {
    const ids = new Set([...text.matchAll(ID_RE)].map((m) => m[1]));
    idCount += ids.size;
    for (const m of text.matchAll(ANCHOR_HREF_RE)) {
      anchorCount += 1;
      if (!ids.has(m[1])) push("dead-anchor", file, `#${m[1]}`);
    }
    for (const m of text.matchAll(ABS_LINK_RE)) {
      const host = m[2].replace(/:\d+$/, "");
      linkHosts.add(host);
      if (!ALLOWED_LINK_HOSTS.some((re) => re.test(host))) {
        push("unlisted-host", file, host);
      }
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
    `local-path=${byKind["local-path-leak"] ?? 0} banned-word=${byKind["banned-word"] ?? 0} ` +
    `secret=${byKind.secret ?? 0} dead-anchor=${byKind["dead-anchor"] ?? 0} unlisted-host=${byKind["unlisted-host"] ?? 0}`,
);
console.log(
  `scan: ${anchorCount} in-page anchor jumps over ${idCount} document ids · outbound hosts: ` +
    [...linkHosts].sort().join(", "),
);
if (notes.length > 0) {
  console.log(`NOTE credential-shaped samples (adjudicated by hand, ${notes.length}):`);
  for (const n of notes.slice(0, 12)) console.log(`  ${n}`);
  if (notes.length > 12) console.log(`  … ${notes.length - 12} more`);
}

if (findings.length > 0) {
  console.error("scan: compliance gate FAILED");
  process.exit(1);
}
console.log(
  "scan: 0 external trackers · 0 external CDN links · 0 local path leakage · 0 banned words · " +
    "0 secrets · 0 dead anchors · 0 unlisted hosts",
);
