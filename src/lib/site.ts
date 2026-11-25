/**
 * Single source of truth for the URLs, hosts and section anchors the portal
 * publishes. Change a domain here and every component follows.
 *
 * One host everywhere: `https://mp.popopx.chat` is simultaneously the SEO
 * `metadataBase`, the canonical link, the Open Graph URL, the sitemap location
 * and the Nginx `server_name` (see `deploy/centos/nginx-popopx-service.conf`),
 * so a crawler, a link unfolder and the web server all agree.
 */

export const SITE_HOST = "mp.popopx.chat";

export const SITE_ORIGIN = "https://mp.popopx.chat";

export const SITE_URL = SITE_ORIGIN;

export const REPO_URL = "https://github.com/popopx-chat/popopx-service-suite";

export const WEB_REPO_URL = "https://github.com/popopx-chat/popopx-service-suite-web";

export const IOS_REPO_URL = "https://github.com/popopx-chat/popopx-chat";

/** Backend suite default branch is `main`; the client repo's is `master`. */
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;

/**
 * The trademark notice is not carried by the backend repo — `TRADEMARK-POPOPX.md`
 * lives in the client repository (`popopx-chat`, branch `master`), which is also
 * where the logo in `public/` is taken from. Pointing this at the backend repo
 * would 404.
 */
export const TRADEMARK_URL = `${IOS_REPO_URL}/blob/master/TRADEMARK-POPOPX.md`;

/** Local gateway console, as `start_macos.sh`, `install_ubuntu22.sh` and `install_macos.sh` print it. */
export const ADMIN_CONSOLE_URL = "http://127.0.0.1:8080";

/** The open-sourced node only accepts a loopback WebSocket. */
export const NODE_WS_URL = "ws://127.0.0.1:5225";

/**
 * Ecosystem entry points. Every one of these is a navigation link, not a loaded
 * resource, so the 0-third-party-asset promise survives them. Each host was
 * probed `200` on 2026-11-25; the live main site links back to `mp.popopx.chat`,
 * so the traffic corridor is two-way. Re-probe before adding one — a dead
 * ecosystem link is a broken promise on an official page.
 */
export const MAIN_SITE_URL = "https://popopx.chat";

export const BOT_STUDIO_URL = "https://bot.popopx.chat";

export const NODE_PORTAL_URL = "https://node.popopx.chat";

/**
 * The product-portal information architecture, in page order. Each entry is the
 * entry point of one bucket, and the bucket may hold more sections than the nav
 * names: `plugins` is the services catalog, `architecture` is the 工作原理 bucket
 * (the `features` block above it and the `protocol` quick reference below it
 * belong to the same bucket), `sandbox` is the developer bucket (with
 * `directory` right behind it), and `security` is the governance bucket (with the
 * full `install` guide behind it).
 *
 * The ids are deliberately the ones the shipped page already uses. Several
 * 18-language copy strings inside `InstallAndUsageGuideSection.tsx` name
 * `#sandbox` and `#directory` in their prose, so renaming an anchor is a
 * translation change in eighteen places, not a one-line edit.
 *
 * `overview` is the hero plus `#scenarios`, the six business cards directly
 * below it. The scenario block gets no entry of its own here on purpose: seven
 * labels do not fit the centred desktop row at `xl` next to the logo, the
 * ecosystem link, the GitHub pill, the language menu and the install CTA, and a
 * nav item that only survives at `2xl` is worse than none. The block is the
 * second thing on the page, so nobody has to jump to reach it — and every card
 * links into the deep section that documents it.
 */
export const NAV_SECTIONS = [
  { id: "overview" },
  { id: "plugins" },
  { id: "architecture" },
  { id: "sandbox" },
  { id: "security" },
  { id: "changelog" },
] as const;

export type NavSectionId = (typeof NAV_SECTIONS)[number]["id"];

/**
 * Clipboard helper shared by every "copy" button.
 *
 * `navigator.clipboard` only exists on secure contexts, so a self-hosted
 * deployment over plain http (common on a LAN during bring-up) still has to be
 * able to copy a command: the textarea fallback is the reason the copy buttons
 * work from `http://127.0.0.1:8080` too.
 */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path; a rejected promise is not fatal.
  }
  try {
    const area = document.createElement("textarea");
    area.value = value;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
