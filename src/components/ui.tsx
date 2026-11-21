"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useCopy, type Localized } from "@/lib/i18n";
import { copyText } from "@/lib/site";

/**
 * Shared presentation primitives.
 *
 * Components across the portal use these so that a heading, a code surface or a
 * copy button looks and behaves the same everywhere. They are deliberately
 * dumb: no data, no routing, no fetching.
 */

export const COPY_FEEDBACK: Localized<string> = {
  en: "Copied",
  ru: "Скопировано",
  de: "Kopiert",
  fr: "Copié",
  it: "Copiato",
  nl: "Gekopieerd",
  cs: "Zkopírováno",
  "zh-Hans": "已复制",
  "zh-Hant": "已複製",
  es: "Copiado",
  pl: "Skopiowano",
  ja: "コピーしました",
  th: "คัดลอกแล้ว",
  fi: "Kopioitu",
  uk: "Скопійовано",
  bg: "Копирано",
  tr: "Kopyalandı",
  hu: "Másolva",
};

export const COPY_LABEL: Localized<string> = {
  en: "Copy",
  ru: "Копировать",
  de: "Kopieren",
  fr: "Copier",
  it: "Copia",
  nl: "Kopiëren",
  cs: "Kopírovat",
  "zh-Hans": "复制",
  "zh-Hant": "複製",
  es: "Copiar",
  pl: "Kopiuj",
  ja: "コピー",
  th: "คัดลอก",
  fi: "Kopioi",
  uk: "Копіювати",
  bg: "Копиране",
  tr: "Kopyala",
  hu: "Másolás",
};

/** An all-empty slot, used when an optional string was not supplied. */
const EMPTY: Localized<string> = {
  en: "",
  ru: "",
  de: "",
  fr: "",
  it: "",
  nl: "",
  cs: "",
  "zh-Hans": "",
  "zh-Hant": "",
  es: "",
  pl: "",
  ja: "",
  th: "",
  fi: "",
  uk: "",
  bg: "",
  tr: "",
  hu: "",
};

/** Resets the "copied" tick after this many milliseconds. */
const COPIED_RESET_MS = 1800;

export function useCopied(): { copied: boolean; run: (value: string) => Promise<void> } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const run = useCallback(async (value: string) => {
    const ok = await copyText(value);
    if (!ok) {
      return;
    }
    setCopied(true);
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }, []);

  return { copied, run };
}

/** Small pill button that copies `value` and ticks to "Copied" for ~2s. */
export function CopyButton({
  value,
  label,
  copiedLabel,
  className,
}: {
  value: string;
  label?: Localized<string>;
  copiedLabel?: Localized<string>;
  className?: string;
}): ReactElement {
  const { copied, run } = useCopied();
  const idle = useCopy(label ?? COPY_LABEL);
  const done = useCopy(copiedLabel ?? COPY_FEEDBACK);

  return (
    <button
      type="button"
      onClick={() => void run(value)}
      aria-label={done}
      data-state={copied ? "copied" : "idle"}
      className={
        className ??
        "chip text-faint transition-colors hover:border-brand/50 hover:text-brand-soft"
      }
    >
      <span className={copied ? "text-mesh-soft" : ""}>{copied ? done : idle}</span>
    </button>
  );
}

/** Section header: eyebrow + title + optional one-line subtitle. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: Localized<string>;
  title: Localized<string>;
  subtitle?: Localized<string>;
  align?: "left" | "center";
}): ReactElement {
  const e = useCopy(eyebrow);
  const t = useCopy(title);
  const s = useCopy(subtitle ?? EMPTY);

  return (
    <header className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <p className="eyebrow">{e}</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-[32px] sm:leading-[1.25]">
        {t}
      </h2>
      {s.length > 0 ? <p className="mt-3 text-[15px] leading-relaxed text-mute">{s}</p> : null}
    </header>
  );
}

/**
 * Command / JSON surface with a copy affordance.
 *
 * `showCopy` is off for snippets meant to be read inline inside a narrow
 * column, on for anything an operator is expected to paste into a terminal.
 */
export function CodeBlock({
  code,
  caption,
  showCopy = true,
  maxHeightClass,
}: {
  code: string;
  caption?: ReactNode;
  showCopy?: boolean;
  maxHeightClass?: string;
}): ReactElement {
  return (
    <div className="glass-inset relative">
      <pre className={`code-surface border-0 bg-transparent ${maxHeightClass ?? ""}`} tabIndex={0}>
        <code>{code}</code>
      </pre>
      {showCopy ? (
        <div className="absolute right-2 top-2">
          <CopyButton value={code} />
        </div>
      ) : null}
      {caption ? (
        <div className="hairline-top px-4 py-2.5 text-[11.5px] leading-relaxed text-faint">
          {caption}
        </div>
      ) : null}
    </div>
  );
}

/** Tiny coloured dot used in legends and status rows. */
export function StatusDot({
  tone = "brand",
  pulse = false,
}: {
  tone?: "brand" | "mesh" | "warn" | "alert";
  pulse?: boolean;
}): ReactElement {
  const ring: Record<"brand" | "mesh" | "warn" | "alert", string> = {
    brand: "bg-brand-soft shadow-brand-ring",
    mesh: "bg-mesh-soft shadow-mesh-ring",
    warn: "bg-warn",
    alert: "bg-alert",
  };
  return (
    <span
      aria-hidden
      className={`inline-block h-2 w-2 rounded-full ${ring[tone]} ${pulse ? "animate-pulse-soft" : ""}`}
    />
  );
}
