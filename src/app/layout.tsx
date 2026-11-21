import type { Metadata, Viewport } from "next";
import type { ReactElement, ReactNode } from "react";
import { DEFAULT_LOCALE, HTML_LANG, LocaleProvider } from "@/lib/i18n";
import { SITE_ORIGIN, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * Root layout.
 *
 * The portal ships the same 18 languages as the POPOPX iOS client (see
 * `src/lib/i18n.tsx`). Because this is a static export, only ONE HTML document
 * exists: the language switch happens client-side, so metadata and the
 * document `<html lang>` are emitted for the default locale (`zh-Hans`) and
 * `LocaleProvider` keeps `lang`/`dir` in sync at runtime. Nothing here reaches
 * the network: the icon set, the manifest and every font are same-origin assets.
 */

const TITLE = "POPOPX 服务号 · 零知识加密频道生态门户";

const DESCRIPTION =
  "POPOPX 服务号与零知识加密频道官方门户：服务器零内容窥探、无全局 ID 跨站追踪、自有服务器一键部署（macOS / Ubuntu），AGPL-3.0 全栈开源。";

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
    "POPOPX 服务号",
    "零知识加密频道",
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
  themeColor: "#050508",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang={HTML_LANG[DEFAULT_LOCALE]} dir="ltr" suppressHydrationWarning>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
