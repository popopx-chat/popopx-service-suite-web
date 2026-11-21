# syntax=docker/dockerfile:1
#
# POPOPX Service Suite portal — build a self-contained static site image.
#
# Stage 1 compiles the Next.js *static export* (`output: "export"` in
# next.config.mjs, so `npm run build` produces a plain `out/` directory).
# Stage 2 serves it with nginx and nothing else: no Node runtime, no API, no
# third-party asset, no remote font. The image can therefore be inspected with
# `docker history` and audited against the compliance checklist in README.md.
#
# Build:
#   docker build -t popopx-service-suite-web:local .
# Run:
#   docker run --rm -p 8081:80 popopx-service-suite-web:local
#   curl -sI http://127.0.0.1:8081/
#
# Copyright (c) 2026 POPOPX (popopx.chat)
# SPDX-License-Identifier: AGPL-3.0-only

# ---------------------------------------------------------------------------
# Stage 1 · build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Lockfile-driven install first, so a source-only change reuses this layer.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY next.config.mjs postcss.config.mjs tailwind.config.ts tsconfig.json ./
COPY public ./public
COPY src ./src

# `npm run build` runs `next build`; a TypeScript error fails the image, which
# is the gate we want.
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 · serve
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Container config: static serving + strict same-origin headers, no TLS (put an
# edge or a load balancer in front, or use deploy/centos/ on bare metal).
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

# busybox wget ships in nginx:alpine, so the health check needs no extra tool.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
