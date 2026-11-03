# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/gonzai-frontend/browser /usr/share/nginx/html
EXPOSE 80
# 127.0.0.1, no "localhost": dentro del contenedor "localhost" resuelve primero a ::1 (IPv6),
# y nginx aquí solo escucha en IPv4 (0.0.0.0:80) — con "localhost" el check fallaba siempre
# con "Connection refused" aunque nginx respondiera perfectamente por IPv4.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
