import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import { LocaleProvider } from "@/lib/i18n";
import { SITE_ORIGIN, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Root layout.
 *
 * The portal ships 21 languages: the POPOPX iOS client's 18 (see
 * `src/lib/i18n.tsx`) plus pt-BR, ko and ar, where ar is the first
 * right-to-left locale. Because this is a static export, only ONE HTML
 * document exists: the language switch happens client-side, so metadata and
 * the document `<html lang>`/`dir` are emitted for the default locale
 * (`zh-Hans`, ltr) and `LocaleProvider` keeps `lang`/`dir` in sync at runtime
 * (`ar` flips `dir` to `rtl`). Nothing here reaches the network: the icon set,
 * the manifest and every font are same-origin assets.
 */

const TITLE = "POPOPX Service Suite · 生态工具、服务号与零知识频道连接控制面";

const DESCRIPTION =
  "POPOPX Service Suite 为 POPOPX Chat 服务号与 AI Agent 提供统一的连接控制面：可筛选的插件目录与按服务开关、零知识频道信封加密（Ed25519 + ChaCha20-Poly1305）、每次调用的 CP 计量与调用留痕。自有服务器部署（macOS / Ubuntu），纯静态同源、零第三方追踪，后端以 AGPL-3.0 开源。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: TITLE,
    template: "%s · POPOPX",
  },
  description: DESCRIPTION,
  applicationName: "POPOPX Service Suite",
  authors: [{ name: "POPOPX", url: SITE_URL }],
  creator: "POPOPX",
  publisher: "POPOPX",
  keywords: [
    "POPOPX",
    "POPOPX Service Suite",
    "POPOPX 服务号",
    "连接控制面",
    "AI Agent",
    "插件目录",
    "零知识加密频道",
    "信封加密",
    "端到端加密",
    "自托管",
    "AGPL-3.0",
    "Service Account",
    "E2EE",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "POPOPX Service Suite",
    locale: "zh_CN",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/logo-popopx.png",
        width: 1024,
        height: 1024,
        alt: "POPOPX",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo-popopx.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "64x64", type: "image/png" },
      { url: "/logo-popopx-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
  },
  other: {
    // Local-only guarantees a privacy-minded visitor may actually check.
    "referrer": "no-referrer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#07080D",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    // `lang`/`dir` for the first paint are literals on purpose: importing
    // HTML_LANG here compiles to a client reference on the server, so the
    // attribute was silently dropped from the exported document. The literal
    // must stay equal to HTML_LANG[DEFAULT_LOCALE] (zh-Hans); `check:rtl`
    // enforces that, and LocaleProvider re-syncs both at runtime.
    <html lang="zh-Hans" dir="ltr" suppressHydrationWarning>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
