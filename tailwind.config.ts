import type { Config } from "tailwindcss";

/**
 * Design tokens for the POPOPX Service Suite portal.
 *
 * Palette (aligned with the iOS client's system colours):
 *  - `ink`        Dark OLED background, near-black with an indigo cast.
 *  - `brand*`     Deep indigo-purple = the "online / encrypted" accent
 *                 (#5856D6 is iOS systemIndigo, #7D7AFF its light variant).
 *  - `mesh*`      Radar teal-green = the "no network / BLE mesh" secondary
 *                 (#00A896 / #00D2B8).
 *  - `warn`       Amber for quota / billing signals, `alert` red for the
 *                 `security` card style.
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
          DEFAULT: "#050508",
          800: "#0A0A12",
          700: "#101019",
          600: "#16161F",
          500: "#1E1E2A",
        },
        brand: {
          DEFAULT: "#5856D6",
          soft: "#7D7AFF",
          deep: "#3F3DA8",
          glow: "rgba(125, 122, 255, 0.35)",
        },
        mesh: {
          DEFAULT: "#00A896",
          soft: "#00D2B8",
          deep: "#00756A",
          glow: "rgba(0, 210, 184, 0.30)",
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
          "radial-gradient(60% 60% at 50% 45%, rgba(88, 86, 214, 0.28) 0%, rgba(88, 86, 214, 0.10) 40%, transparent 75%)",
        "mesh-halo":
          "radial-gradient(50% 50% at 50% 50%, rgba(0, 168, 150, 0.22) 0%, transparent 72%)",
        "flow-brand":
          "linear-gradient(90deg, transparent 0%, rgba(125, 122, 255, 0.75) 45%, rgba(125, 122, 255, 0.75) 55%, transparent 100%)",
        "flow-mesh":
          "linear-gradient(90deg, transparent 0%, rgba(0, 210, 184, 0.70) 45%, rgba(0, 210, 184, 0.70) 55%, transparent 100%)",
      },
      boxShadow: {
        glass: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 60px -30px rgba(0,0,0,0.9)",
        "brand-ring": "0 0 0 1px rgba(125,122,255,0.45), 0 0 40px -12px rgba(88,86,214,0.65)",
        "mesh-ring": "0 0 0 1px rgba(0,210,184,0.40), 0 0 40px -12px rgba(0,168,150,0.55)",
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
