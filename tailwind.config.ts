import type { Config } from "tailwindcss";

/**
 * Design tokens for the POPOPX Service Suite portal.
 *
 * Palette (taken from the main site, not invented here): `https://popopx.chat`
 * declares its own `:root` in `/_next/static/css/617b069a6f390d47.css` as
 * `--ink:#07080d; --brand:#6e3ff3; --brand-soft:#9b7bff; --mesh:#10b981;
 * --mesh-soft:#34e0b4`, and this file uses those four values plus the same
 * `hair` / `mute` / `faint` alphas, so a visitor who moves between the two sites
 * sees one brand rather than two. `deep` and `glow` are the only derived steps,
 * and `warn` / `alert` carry the billing and security signals the suite needs.
 *
 *  - `ink`        Dark OLED background, near-black with an indigo cast.
 *  - `brand*`     Violet = the "online / encrypted" accent.
 *  - `mesh*`      Green = the "no network / BLE mesh" secondary.
 *
 * Every colour here is used as a Tailwind utility (`bg-brand`, `text-mesh-soft`,
 * `border-hair`), so adding a token is enough — no CSS file to keep in sync.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#07080D",
          800: "#0A0A12",
          700: "#101019",
          600: "#16161F",
          500: "#1E1E2A",
        },
        brand: {
          DEFAULT: "#6E3FF3",
          soft: "#9B7BFF",
          deep: "#5832C2",
          glow: "rgba(155, 123, 255, 0.35)",
        },
        mesh: {
          DEFAULT: "#10B981",
          soft: "#34E0B4",
          deep: "#0C8B61",
          glow: "rgba(52, 224, 180, 0.30)",
        },
        warn: {
          DEFAULT: "#F5A524",
          soft: "#FFC960",
        },
        alert: {
          DEFAULT: "#FF453A",
          soft: "#FF6961",
        },
        hair: "rgba(255, 255, 255, 0.08)",
        "hair-strong": "rgba(255, 255, 255, 0.16)",
        mute: "rgba(233, 233, 245, 0.62)",
        faint: "rgba(233, 233, 245, 0.40)",
      },
      fontFamily: {
        // System stack only: no webfont, no external CDN, no cross-origin request.
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      backgroundImage: {
        "brand-halo":
          "radial-gradient(60% 60% at 50% 45%, rgba(110, 63, 243, 0.30) 0%, rgba(110, 63, 243, 0.11) 40%, transparent 75%)",
        "mesh-halo":
          "radial-gradient(50% 50% at 50% 50%, rgba(16, 185, 129, 0.20) 0%, transparent 72%)",
        "flow-brand":
          "linear-gradient(90deg, transparent 0%, rgba(155, 123, 255, 0.75) 45%, rgba(155, 123, 255, 0.75) 55%, transparent 100%)",
        "flow-mesh":
          "linear-gradient(90deg, transparent 0%, rgba(52, 224, 180, 0.70) 45%, rgba(52, 224, 180, 0.70) 55%, transparent 100%)",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -30px rgba(0,0,0,0.9)",
        "brand-ring": "0 0 0 1px rgba(155,123,255,0.45), 0 0 40px -12px rgba(110,63,243,0.65)",
        "mesh-ring": "0 0 0 1px rgba(52,224,180,0.40), 0 0 40px -12px rgba(16,185,129,0.55)",
      },
      animation: {
        "flow-x": "flowX 6s linear infinite",
        "pulse-soft": "pulseSoft 3.2s ease-in-out infinite",
        "spin-slow": "spin 18s linear infinite",
        "rise-in": "riseIn 0.45s ease-out both",
      },
      keyframes: {
        flowX: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "1" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
