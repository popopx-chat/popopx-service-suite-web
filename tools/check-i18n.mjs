#!/usr/bin/env node
/**
 * i18n completeness checker — the oracle behind "the portal speaks the same 18
 * languages as the iOS client".
 *
 * TypeScript already proves a `Localized<T>` object lists all 18 locales (it is
 * a total `Record`), so `npm run typecheck` catches a missing key. This script
 * catches the two things the compiler cannot see:
 *
 *  1. a copy object that mixes locale tags with *stale* ones (`zh-CN`, `zh-TW`)
 *     or omits keys while still compiling because it is typed loosely;
 *  2. a locale slot that is not actually translated — i.e. the English (or
 *     Chinese) string pasted into every language, which compiles fine and reads
 *     like a broken site.
 *
 * It parses the real AST with the `typescript` devDependency, so it does not
 * depend on formatting.
 *
 * Usage:
 *   node tools/check-i18n.mjs            # report; exit 1 on a hard error
 *   node tools/check-i18n.mjs --quiet    # only print the summary line
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

/** The 18 tags from `CFBundleLocalizations` in apps/ios/POPOPX--iOS--Info.plist. */
const LOCALES = [
  "en", "ru", "de", "fr", "it", "nl", "cs", "zh-Hans", "zh-Hant", "es",
  "pl", "ja", "th", "fi", "uk", "bg", "tr", "hu",
];

/** Tags that must never appear in copy objects (old tri-lingual scheme). */
const STALE = ["zh-CN", "zh-TW"];

const LOCALE_SET = new Set(LOCALES);
const QUIET = process.argv.includes("--quiet");

/**
 * A value is "technical" — and therefore legitimately identical in every
 * language — when it carries no translatable words: brand and protocol tokens,
 * commands, URLs, numbers, code-ish strings.
 */
function isTechnical(text) {
  if (text.length <= 3) return true;
  if (/^[A-Z0-9 .*:/#%&()+,;=_/\\[\]{}<>-]+$/.test(text)) return true; // ASCII caps/digits
  if (/^(https?:|ws?:|popopx:\/\/|\/|\.\/)/.test(text)) return true;
  if (/[${}<>|`]/.test(text)) return true;
  if (/^(POPOPX|AGPL|SPDX|ISO|EVM|Solana|macOS|Ubuntu|CentOS|Docker|Nginx|FastAPI|SQLite)/.test(text)) return true;
  if (/^[0-9.,:%\-–—\s]+$/.test(text)) return true;
  return false;
}

function hasNonLatinScript(text) {
  // Cyrillic / Greek / CJK / Thai / Arabic / Hebrew / Japanese kana ranges.
  return /[\u0301-\u0308\u0370-\u03FF\u0400-\u04FF\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\u0E00-\u0E7F\u0600-\u06FF\u0590-\u05FF\uAC00-\uD7AF]/.test(text);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.tsx?$/.test(full)) {
      out.push(full);
    }
  }
  return out;
}

const files = walk(SRC);
const errors = [];
const warnings = [];
const stats = { objects: 0, slots: 0, perLocale: Object.fromEntries(LOCALES.map((l) => [l, 0])) };

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const rel = relative(ROOT, file);

  // `type L = Localized<string>` hides the pattern from a plain text match, so
  // collect the aliases a file declares and resolve a cast through them.
  const mapAliases = new Set();
  const collectAliases = (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const body = node.type ? node.type.getText() : "";
      if ((body.includes("Localized<") || body.includes("Record<Locale")) && !body.includes("Partial<")) {
        mapAliases.add(node.name.getText());
      }
    }
    ts.forEachChild(node, collectAliases);
  };
  ts.forEachChild(source, collectAliases);

  const at = (node) => `:${source.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  const visit = (node) => {
    // A function returning a `Localized` map can only build it by *deriving*
    // slots, which is exactly how an 18-language claim is faked: the helper takes
    // three authored strings, fills the other fifteen from English, and TypeScript
    // still sees a total map. Copy must live in literal objects so this file can
    // read every language slot. `pick`/`useCopy` are exempt — they return `T`.
    if (
      (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
      node.type &&
      node.type.getText().includes("Localized<")
    ) {
      const name = ts.isFunctionDeclaration(node) && node.name ? ` ${node.name.getText()}` : "";
      errors.push(
        `${rel}${at(node)}: function${name} returns Localized<…> — a derived map hides unauthored languages from this oracle and from tsc. Author literal 18-key objects instead.`,
      );
    }

    // `x as Localized<string>` — or `as L` for such an alias — over a
    // `Record<string, string>` is the second way to fake the total map: the cast
    // erases the key check, so fifteen languages can be missing at runtime while
    // tsc stays quiet. `satisfies` is deliberately NOT flagged: it validates every
    // key, which is the point of the total map. A cast to
    // `Partial<Record<Locale, …>>` is exempt too — it claims nothing is present,
    // which is what `pick` needs in order to fall back honestly.
    if (ts.isAsExpression(node) && node.type) {
      const t = node.type.getText();
      const isMapType = t.includes("Localized<") || t.includes("Record<Locale") || mapAliases.has(t);
      if (isMapType && !t.includes("Partial<")) {
        errors.push(
          `${rel}${at(node)}: as ${t} casts an untyped map into the total locale type — 18 languages are not proven here; write the literal (or use \`satisfies\`, which checks)`,
        );
      }
    }

    if (ts.isObjectLiteralExpression(node)) {
      const keys = [];
      for (const prop of node.properties) {
        if (!prop.name) continue;
        const name = ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name) ? prop.name.text : null;
        if (name) keys.push({ name, prop });
      }
      const localeKeys = keys.filter((k) => LOCALE_SET.has(k.name));
      const staleKeys = keys.filter((k) => STALE.includes(k.name));

      if (staleKeys.length > 0) {
        errors.push(`${rel}${at(node)}: stale locale tag(s) ${staleKeys.map((k) => k.name).join(", ")} — use zh-Hans / zh-Hant`);
      }

      // A copy object is any literal carrying two or more locale-ish tags,
      // stale or not: an object written with `zh-CN` / `zh-TW` / `en` is exactly
      // the work the 18-language pass has to finish, so counting it only once
      // its keys were renamed would hide the backlog behind the rename errors.
      if (localeKeys.length + staleKeys.length >= 2) {
        stats.objects += 1;
        const present = new Set(localeKeys.map((k) => k.name));
        const missing = LOCALES.filter((l) => !present.has(l));
        // A spread inside a copy object re-imports the blind spot the derived-map
        // rule above closes: `{...enMap, fr: "…"}` type-checks while twelve
        // languages silently render as whoever they were cloned from.
        const spreads = node.properties.filter((prop) => ts.isSpreadAssignment(prop));
        if (spreads.length > 0) {
          errors.push(
            `${rel}${at(node)}: copy object spreads ${spreads.length} map(s) — every one of the 18 slots must be written literally or the oracle cannot see a missing language`,
          );
        }
        if (missing.length > 0) {
          errors.push(`${rel}${at(node)}: copy object missing ${missing.length} locale(s): ${missing.join(", ")}`);
        }
        const enValue = localeKeys.find((k) => k.name === "en");
        for (const { name, prop } of localeKeys) {
          stats.slots += 1;
          stats.perLocale[name] += 1;
          if (name === "en" || !prop.initializer) continue;
          if (!ts.isStringLiteral(prop.initializer)) continue;
          const value = prop.initializer.text;
          if (value.length === 0) continue;
          if (isTechnical(value)) continue;
          if (hasNonLatinScript(value)) continue;
          if (enValue && enValue.prop.initializer && ts.isStringLiteral(enValue.prop.initializer)) {
            if (value === enValue.prop.initializer.text) {
              warnings.push(`${rel}${at(prop.name)}: "${name}" slot repeats the English text verbatim: ${value.slice(0, 48)}`);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  ts.forEachChild(source, visit);
}

const coverage = LOCALES.map((l) => `${l}=${stats.perLocale[l]}`).join(" ");

if (!QUIET) {
  for (const line of errors) console.log(`ERROR  ${line}`);
  for (const line of warnings) console.log(`WARN   ${line}`);
}

console.log(
  `i18n: ${files.length} files, ${stats.objects} copy objects, ${stats.slots} slots, ` +
    `${LOCALES.length} locales required | coverage ${coverage}`,
);
console.log(`i18n: ${errors.length} error(s), ${warnings.length} untranslated-lookalike warning(s)`);

if (errors.length > 0) {
  process.exit(1);
}
