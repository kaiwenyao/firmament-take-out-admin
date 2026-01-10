FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

RUN apk add --no-cache gettext

COPY deploy/nginx/admin.conf.tpl /etc/nginx/templates/default.conf.template
COPY deploy/nginx/docker-entrypoint.d/99-envsubst.sh /docker-entrypoint.d/99-envsubst.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/99-envsubst.sh
