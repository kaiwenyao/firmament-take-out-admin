server {
    listen 80;
    server_name localhost;

    # 1. 静态资源
    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ws/ {
        proxy_pass http://${FIRMAMENT_SERVER_HOST}:${FIRMAMENT_SERVER_PORT};

        # A. 开启 WebSocket 支持的核心头
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # B. 这里的 Rewrite 逻辑：
        # 将 /api/ws/xxx 替换为 /ws/xxx
        # 也就是说：去掉了 /api，但【保留】了 /ws，且【不加】/admin
        rewrite ^/api/(.*)$ /$1 break;

        # C. 标准头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 2. 接口转发
    location /api/ {
        # 【关键】实现你 React 配置里的 rewrite 逻辑：
        # 将 /api/xxx 替换为 /user/xxx
        rewrite ^/api/(.*)$ /admin/$1 break;

        # 转发给后端
        proxy_pass http://${FIRMAMENT_SERVER_HOST}:${FIRMAMENT_SERVER_PORT};

        # 标准头部配置
        # test github actions
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
