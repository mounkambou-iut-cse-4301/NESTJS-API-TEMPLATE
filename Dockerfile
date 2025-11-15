# ---- Build stage ----
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Générer le Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Build Nest
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm i -g prisma@latest

# Copie client Prisma + build
COPY --from=builder /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder /app/dist /app/dist
COPY prisma ./prisma

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/main.js"]
