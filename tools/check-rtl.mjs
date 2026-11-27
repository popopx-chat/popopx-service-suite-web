#!/usr/bin/env node
/**
 * RTL + LTR-isolation gate.
 *
 * The portal ships Arabic, a right-to-left locale. Three things have to be true
 * in the source for that to work, and none of them is visible to `tsc`:
 *
 *  1. the 21-locale registry agrees with the checker and with the shipped
 *     locales (adding a locale in one place only silently renders English);
 *  2. switching to `ar` sets `dir="rtl"` on `<html>`, while the static export
 *     still emits the default locale as `dir="ltr"` for the first paint;
 *  3. technical surfaces (code blocks, HTTP paths, webhook URLs, fingerprints)
 *     are force-isolated LTR, and layout uses logical utilities so tables,
 *     forms and badges mirror — with a short allowlist for the deliberately
 *     physical hero diagram.
 *
 * Usage:
 *   node tools/check-rtl.mjs             # scan the real sources
 *   node tools/check-rtl.mjs --self-test # prove the predicates reject bad input
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EXPECTED = [
  "en", "ru", "de", "fr", "it", "nl", "cs", "zh-Hans", "zh-Hant", "es",
  "pl", "ja", "th", "fi", "uk", "bg", "tr", "hu", "pt-BR", "ko", "ar",
];

const errors = [];
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const squash = (s) => s.replace(/\s+/g, " ");

function quotedList(text) {
  return [...text.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

function registryList(source) {
  const m = source.match(/export const LOCALES = \[([\s\S]*?)\] as const;/);
  return m ? quotedList(m[1]) : [];
}

function physicalClasses(text) {
  // Direction-sensitive utilities that must never appear outside the allowlist:
  // physical text alignment and physical inline margins/paddings.
  return [
    ...text.matchAll(/\btext-(?:left|right)\b/g),
    ...text.matchAll(/\b(?:ml|mr|pl|pr)-(?:\[[^\]]+\]|[0-9][\w./-]*)/g),
  ].map((m) => m[0]);
}

function anchoredClasses(text) {
  // `left-*` / `right-*` placement is legitimate inside a physically fixed
  // diagram; elsewhere it must be `start-*` / `end-*`.
  return [...text.matchAll(/\b(?:left|right)-(?:\[[^\]]+\]|[0-9][\w./%-]*)/g)].map((m) => m[0]);
}

function codeIsolation(text) {
  return /<pre[^>]*\bdir="ltr"/.test(text);
}

function cssIsolation(css) {
  const block = css.match(/code,\s*pre,\s*kbd,\s*samp\s*\{([^}]*)\}/);
  return Boolean(block && /direction:\s*ltr/.test(block[1]) && /unicode-bidi:\s*isolate/.test(block[1]));
}

function rtlLocales(source) {
  const m = source.match(/export function isRightToLeft[\s\S]*?includes\(locale\)/);
  return m ? quotedList(m[0]) : [];
}

function ssrTag(html) {
  // Comments in layout.tsx quote `<html lang>`; only a tag that actually
  // carries a lang attribute is the document element.
  for (const m of html.matchAll(/<html\b([^>]*)>/g)) {
    if (/\blang="/.test(m[1])) {
      const lang = (m[1].match(/\blang="([^"]*)"/) || [])[1];
      const dir = (m[1].match(/\bdir="([^"]*)"/) || [])[1];
      return { lang, dir };
    }
  }
  return null;
}

function selfTest() {
  const cases = [
    ["physical text-left", physicalClasses("text-left").length > 0, true],
    ["physical ms-1.5 is logical", physicalClasses("ms-1.5").length === 0, true],
    ["logical text-start passes", physicalClasses("text-start").length === 0, true],
    ["anchored right-0", anchoredClasses("right-0").length > 0, true],
    ["logical end-0", anchoredClasses("end-0").length === 0, true],
    ["pre dir=ltr", codeIsolation('<pre dir="ltr" className="x">'), true],
    ["pre without dir", codeIsolation("<pre>"), false],
    [
      "css isolation",
      cssIsolation("code, pre, kbd, samp { direction: ltr; unicode-bidi: isolate; }"),
      true,
    ],
    ["css without direction", cssIsolation("code, pre { color: red; }"), false],
    ["ssr tag keeps lang", ssrTag('<html lang="zh-Hans" dir="ltr">')?.lang === "zh-Hans", true],
    ["ssr tag skips a comment mention", ssrTag('`<html lang>` then <html lang="zh-Hans" dir="ltr">')?.lang === "zh-Hans", true],
    ["ssr tag without lang", ssrTag('<html dir="ltr">') === null, true],
  ];
  let failed = 0;
  for (const [name, got, want] of cases) {
    if (got !== want) {
      failed += 1;
      console.log(`SELFTEST FAIL  ${name}: ${got}, wanted ${want}`);
    }
  }
  console.log(`rtl self-test: ${cases.length - failed}/${cases.length} predicates behave`);
  process.exitCode = failed > 0 ? 1 : 0;
}

if (process.argv.includes("--self-test")) {
  selfTest();
} else {
  const i18n = read("src/lib/i18n.tsx");
  const locales = registryList(i18n);
  if (JSON.stringify(locales) !== JSON.stringify(EXPECTED)) {
    errors.push(`src/lib/i18n.tsx: LOCALES is ${locales.join(",")}; expected ${EXPECTED.join(",")}`);
  }
  if (!locales.includes("ar")) errors.push("src/lib/i18n.tsx: `ar` is missing from LOCALES");
  if (!/HTML_LANG[\s\S]*?\bar:\s*"ar"/.test(i18n)) {
    errors.push("src/lib/i18n.tsx: HTML_LANG has no `ar: \"ar\"` entry");
  }
  if (!rtlLocales(i18n).includes("ar")) {
    errors.push("src/lib/i18n.tsx: isRightToLeft does not list `ar`");
  }
  if (!/tag === "pt" \|\| tag\.startsWith\("pt-"\)/.test(i18n)) {
    errors.push('src/lib/i18n.tsx: detectLocale has no pt/pt-* → pt-BR branch');
  }
  if (!squash(i18n).includes('root.dir = isRightToLeft(locale) ? "rtl" : "ltr";')) {
    errors.push("src/lib/i18n.tsx: LocaleProvider does not write root.dir from isRightToLeft");
  }
  if (!squash(i18n).includes("root.lang = HTML_LANG[locale];")) {
    errors.push("src/lib/i18n.tsx: LocaleProvider does not write root.lang");
  }

  const layout = read("src/app/layout.tsx");
  const defaultLocale = (i18n.match(/export const DEFAULT_LOCALE: Locale = "([^"]+)"/) || [])[1];
  const htmlLangBlock = (i18n.match(/export const HTML_LANG[\s\S]*?\};/) || [])[0] || "";
  const defaultHtmlLang = defaultLocale
    ? [...htmlLangBlock.matchAll(/"([^"]+)": "([^"]+)"/g)].find((m) => m[1] === defaultLocale)?.[2]
    : undefined;
  if (!defaultHtmlLang) {
    errors.push("src/lib/i18n.tsx: HTML_LANG has no entry for DEFAULT_LOCALE");
  }
  const ssr = ssrTag(layout);
  if (!ssr || ssr.dir !== "ltr") {
    errors.push('src/app/layout.tsx: the SSR document must stay dir="ltr" until LocaleProvider runs');
  }
  if (!ssr || ssr.lang !== defaultHtmlLang) {
    errors.push(
      `src/app/layout.tsx: the SSR <html lang> must be the literal "${defaultHtmlLang}" (HTML_LANG[DEFAULT_LOCALE]); ` +
        "a client-module lookup is dropped from the export",
    );
  }

  if (!codeIsolation(read("src/components/ui.tsx"))) {
    errors.push('src/components/ui.tsx: CodeBlock <pre> is missing dir="ltr"');
  }
  if (!cssIsolation(read("src/app/globals.css"))) {
    errors.push("src/app/globals.css: code/pre/kbd/samp are not isolated LTR");
  }

  const menu = read("src/components/LanguageMenu.tsx");
  if (!menu.includes('align === "right" ? "end-0" : "start-0"')) {
    errors.push("src/components/LanguageMenu.tsx: the dropdown is not anchored with logical end/start");
  }

  const directory = read("src/components/DirectoryAndDocsSection.tsx");
  if (!/dir="ltr"[\s\S]{0,160}<select|id=\{field\.id\}\s+dir="ltr"/.test(directory)) {
    errors.push("src/components/DirectoryAndDocsSection.tsx: the category select is not isolated LTR");
  }
  if (!directory.includes('dir={technical ? "ltr" : undefined}')) {
    errors.push("src/components/DirectoryAndDocsSection.tsx: technical inputs are not isolated LTR");
  }

  if (!read("src/components/InteractiveSandbox.tsx").includes('bdi dir={mono ? "ltr" : undefined}')) {
    errors.push("src/components/InteractiveSandbox.tsx: mono field values (fingerprints, ids) are not isolated");
  }
  for (const rel of ["src/components/InstallAndUsageGuideSection.tsx", "src/components/StatusChangelogSection.tsx"]) {
    if (!/<bdi dir="ltr">/.test(read(rel))) {
      errors.push(`${rel}: technical values are not isolated with <bdi dir="ltr">`);
    }
  }

  const checker = read("tools/check-i18n.mjs");
  const checkerLocales = quotedList((checker.match(/const LOCALES = \[([\s\S]*?)\];/) || [])[1] || "");
  if (JSON.stringify(checkerLocales) !== JSON.stringify(EXPECTED)) {
    errors.push(`tools/check-i18n.mjs: LOCALES is ${checkerLocales.join(",")}; expected ${EXPECTED.join(",")}`);
  }

  // Physical placement stays only where a decorative diagram is explicitly
  // drawn; the code-copy button rides on an LTR code surface.
  const PHYSICAL_ALLOW = {
    "src/components/HeroSection.tsx": [
      "left-0", "right-0", "origin-left", "origin-right", "left-1/2", "left-3.5", "-translate-x-1/2",
    ],
    "src/components/ui.tsx": ["right-2"],
    "src/components/BusinessScenarios.tsx": ["translate-x-0.5"],
  };

  const walk = (dir, out = []) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.tsx?$/.test(full)) out.push(full);
    }
    return out;
  };

  for (const file of walk(join(ROOT, "src"))) {
    const rel = relative(ROOT, file);
    const text = readFileSync(file, "utf8");
    const allow = PHYSICAL_ALLOW[rel] || [];
    for (const token of physicalClasses(text)) {
      errors.push(`${rel}: physical direction utility \`${token}\` — use a logical (start/end) class`);
    }
    for (const token of anchoredClasses(text)) {
      if (!allow.some((a) => token.startsWith(a))) {
        errors.push(`${rel}: physical placement \`${token}\` — use start-*/end-*`);
      }
    }
  }

  for (const line of errors) console.log(`ERROR  ${line}`);
  console.log(
    `rtl: ${locales.length} locales, ${EXPECTED.length - new Set(locales).size === 0 ? "registry in sync" : "registry drift"}, ` +
      `${errors.length} error(s)`,
  );
  process.exitCode = errors.length > 0 ? 1 : 0;
}