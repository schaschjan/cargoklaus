ARG NODE_VERSION

# Alpine image
FROM node:${NODE_VERSION}-alpine AS alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# This will automatically install the exact pnpm version specified in package.json's packageManager field
RUN corepack enable && apk update && apk add --no-cache libc6-compat

FROM alpine AS deps
WORKDIR /app

ENV CI=true
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# First install the dependencies (as they change less often)
# Use Docker secret for NPM_TOKEN to avoid exposure in image history
RUN --mount=type=secret,id=npm_token \
    --mount=type=cache,id=pnpm,target=/pnpm/store \
    if [ -f /run/secrets/npm_token ]; then \
      NPM_TOKEN=$(cat /run/secrets/npm_token) && \
      echo "//npm.pkg.github.com/:_authToken=$NPM_TOKEN" > .npmrc && \
      echo "@atelierdisko:registry=https://npm.pkg.github.com/" >> .npmrc; \
    fi && \
    pnpm install --frozen-lockfile && \
    rm -f .npmrc

# Build stage
FROM alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN pnpm build

# Final image
FROM alpine AS runner

WORKDIR /app

ARG PORT
ENV PORT=${PORT}

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nodejs

USER nodejs

# Copy necessary files
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static .next/static
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

EXPOSE ${PORT}
CMD PORT=$PORT HOSTNAME=0.0.0.0 node server.js