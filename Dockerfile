# 1. Build da aplicação
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# 2. Servir com NGINX
FROM nginx:stable-alpine

# Copia os arquivos buildados do Vite (dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Remove a config default e adiciona uma para SPAs
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
