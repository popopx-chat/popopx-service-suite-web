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

export const NAV_SECTIONS = [
  { id: "features" },
  { id: "architecture" },
  { id: "plugins" },
  { id: "sandbox" },
  { id: "install" },
  { id: "directory" },
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
