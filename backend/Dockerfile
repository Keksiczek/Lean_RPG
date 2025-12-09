# syntax=docker/dockerfile:1

FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npm run build
RUN npx prisma generate
RUN npm prune --production

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
