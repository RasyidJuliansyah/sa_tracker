# Frontend produksi: dibangun menjadi file statis, disajikan Nginx non-root.
# Konteks build = ROOT repo (token tema ada di docs/): docker build -f frontend/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY docs/design-system/skolla-lms/tokens.json /repo/docs/design-system/skolla-lms/tokens.json
COPY frontend/ ./
# Nginx host meneruskan /api ke backend pada origin yang sama, jadi basis API relatif.
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/ || exit 1
