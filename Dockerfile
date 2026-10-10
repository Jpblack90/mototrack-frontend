# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# Declara el build arg ANTES de copiar código para que Vite lo capture en build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Instala dependencias primero (cache layer)
COPY package*.json ./
RUN npm ci

# Copia el resto del código y construye
COPY . .
RUN npm run build

# ─── Serve stage ─────────────────────────────────────────────────────────────
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
