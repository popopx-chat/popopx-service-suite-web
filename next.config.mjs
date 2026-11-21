/**
 * POPOPX Service Suite portal — Next.js static export.
 *
 * `output: "export"` means `next build` writes a plain, dependency-free `out/`
 * directory that Nginx (or any static host) can serve with no Node runtime and
 * no server-side rendering. `images.unoptimized` is required for export and is
 * also the privacy-correct choice here: no remote image loader, no third-party
 * image proxy, every asset is served from this origin.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  assetPrefix: undefined,
  // No `env` block on purpose: the published host lives in exactly one place,
  // `src/lib/site.ts` (`SITE_HOST` / `SITE_ORIGIN` = https://mp.popopx.chat),
  // which is also the Nginx `server_name`. A second copy in build config is how
  // a domain drifts.
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
