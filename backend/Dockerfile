# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────
# STAGE 1: Builder
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install dependencies (including devDependencies for build + Prisma CLI)
COPY package.json package-lock.json ./
RUN npm ci --omit=optional

# Copy source files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client and build TypeScript
RUN npm run prisma:generate
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# STAGE 2: Runtime
# ─────────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Create non-root user for better security
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Copy only what is needed for runtime
COPY --from=builder /build/package.json ./package.json
COPY --from=builder /build/package-lock.json ./package-lock.json
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/prisma ./prisma

# Ensure proper ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 4000

# Health check for /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => { if (r.statusCode !== 200) throw new Error(r.statusCode); })"

# Run migrations then start the server
CMD ["sh", "-c", "npm run prisma:migrate && node dist/index.js"]
