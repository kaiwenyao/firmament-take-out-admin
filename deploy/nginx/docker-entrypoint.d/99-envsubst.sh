#!/bin/sh
set -eu

envsubst '${FIRMAMENT_SERVER_HOST} ${FIRMAMENT_SERVER_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
