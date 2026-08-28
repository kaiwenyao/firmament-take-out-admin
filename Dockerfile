FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines import.meta.env into the bundle at build time, so the
# user-app URL must be passed as a build arg. If empty, the app falls
# back to http://localhost:5173 (dev default).
ARG VITE_USER_CLIENT_URL=""
ENV VITE_USER_CLIENT_URL=$VITE_USER_CLIENT_URL
RUN npm run build

FROM nginx:1.25-alpine

RUN apk add --no-cache gettext

COPY deploy/nginx/admin.conf.tpl /etc/nginx/templates/default.conf.template
COPY deploy/nginx/docker-entrypoint.d/99-envsubst.sh /docker-entrypoint.d/99-envsubst.sh
COPY --from=build /app/dist /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.d/99-envsubst.sh
