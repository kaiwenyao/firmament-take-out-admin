#!/bin/sh
set -eu

# 检查必需的环境变量
if [ -z "${FIRMAMENT_SERVER_HOST:-}" ]; then
    echo "错误: FIRMAMENT_SERVER_HOST 环境变量未设置" >&2
    exit 1
fi

if [ -z "${FIRMAMENT_SERVER_PORT:-}" ]; then
    echo "错误: FIRMAMENT_SERVER_PORT 环境变量未设置" >&2
    exit 1
fi

# 使用 envsubst 替换环境变量
envsubst '${FIRMAMENT_SERVER_HOST} ${FIRMAMENT_SERVER_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
