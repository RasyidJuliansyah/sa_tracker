# Backend produksi: multi-stage dari node:24-alpine, berjalan sebagai user non-root.
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json ./
# Prisma Client dihasilkan saat build; URL ini hanya agar `generate` berjalan, bukan koneksi nyata.
RUN DATABASE_URL="mysql://build:build@localhost:3306/build" npx prisma generate
COPY src ./src
RUN npm run build

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Folder foto: volume yang di-mount dari server (PHOTO_STORAGE_DIR)
RUN mkdir -p /data/photos && chown -R node:node /data /app
USER node
ENV PORT=3011 PHOTO_STORAGE_DIR=/data/photos
EXPOSE 3011
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:3011/api/health || exit 1
CMD ["node", "dist/index.js"]
