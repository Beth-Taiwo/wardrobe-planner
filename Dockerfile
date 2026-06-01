FROM node:22.18.0-bookworm-slim AS base

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./
# Work around npm hoisting edge-cases with platform binaries (esbuild/@esbuild/*).
# Also guard against CI environments that inject ESBUILD_BINARY_PATH (which can make
# esbuild's postinstall validate the wrong binary version).
RUN ESBUILD_BINARY_PATH= \
  npm_config_ignore_scripts=false \
  npm ci --include=optional --install-strategy=nested

FROM deps AS build

ENV NODE_ENV=development

COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM base AS runner

ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
