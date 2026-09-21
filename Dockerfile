FROM node:22.19.0-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src ./src

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

ENV NGINX_ENVSUBST_FILTER=^(BACKEND_ORIGIN|PORT)$
ENV PORT=8080

COPY --chmod=755 nginx/15-validate-backend-origin.sh /docker-entrypoint.d/15-validate-backend-origin.sh
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
USER root
RUN rm -rf /usr/share/nginx/html/*
USER 101
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:${PORT}/healthz || exit 1
