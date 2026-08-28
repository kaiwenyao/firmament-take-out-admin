pipeline {
    agent {
        kubernetes {
            // 指向你在 Jenkins 系统管理里配置的云名称，通常默认为 "kubernetes"
            cloud 'kubernetes' 
            
            // Pod Template 配置
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    # 对应 Jenkins 中配置的标签列表
    jenkins/label: firmament-build
spec:
  containers:
    # -------------------------------------------------------
    # 1. Node.js 容器配置 (用于前端构建)
    # -------------------------------------------------------
    - name: nodejs
      image: node:24-alpine
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent

    # -------------------------------------------------------
    # 2. Docker 容器配置 (用于构建和推送镜像)
    # -------------------------------------------------------
    - name: docker
      image: docker:latest
      command:
        - sleep
      args:
        - "9999999"
      tty: true
      workingDir: /home/jenkins/agent
      volumeMounts:
        # 挂载宿主机 Docker Socket
        - mountPath: /var/run/docker.sock
          name: docker-sock
          
  # -------------------------------------------------------
  # 3. 卷定义
  # -------------------------------------------------------
  volumes:
    # HostPath: 挂载宿主机 Docker Socket
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
'''
        }
    }
    
    environment {
        // 从 Jenkins Credentials 中读取
        DOCKER_USERNAME = credentials('docker-username')
        SERVER_HOST = credentials('server-host')
        CONTAINER_NAME = "firmament-admin"
        HOST_PORT = "80"
    }
    
    stages {
        stage('1. 拉取代码') {
            steps {
                checkout scm
            }
        }
        
        stage('2. 代码检查') {
            steps {
                container('nodejs') {
                    echo '正在运行代码检查...'
                    sh 'npm ci'
                    sh 'npm run lint'
                    // 运行单元测试并强制覆盖率阈值（不达标则构建失败）
                    echo '正在运行单元测试并检查覆盖率...'
                    sh 'npm run test:coverage'
                }
            }
        }
        
        stage('3. 构建项目') {
            steps {
                container('nodejs') {
                    echo '构建前端项目...'
                    sh 'npm run build'
                }
            }
        }
        
        stage('4. 构建并推送 Docker 镜像') {
            when {
                // 只有非 PR 请求时才构建和推送镜像
                not { changeRequest() }
            }
            steps {
                container('docker') {
                    script {
                        // 用户端 URL 存放在 secret file 凭证 'firmament-take-out-admin'
                        // 中，文件是 env 格式的键值对（VITE_USER_CLIENT_URL=<URL>）。
                        // 按 key 解析出 value 传给 --build-arg；key 不存在时为空，
                        // 应用内会回退到 http://localhost:5173。
                        withCredentials([
                            usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                            file(credentialsId: 'firmament-take-out-admin', variable: 'USER_CLIENT_URL_FILE')
                        ]) {
                            sh '''
                                echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                                VITE_USER_CLIENT_URL="$(sed -n 's/^VITE_USER_CLIENT_URL=//p' "${USER_CLIENT_URL_FILE}" | tail -n 1 | tr -d '\\r"')"
                                docker build \
                                    --build-arg VITE_USER_CLIENT_URL="${VITE_USER_CLIENT_URL}" \
                                    -t ${DOCKER_USER}/firmament-admin:latest -f Dockerfile .
                                docker push ${DOCKER_USER}/firmament-admin:latest
                            '''
                        }
                    }
                }
            }
        }
        
        stage('5. 部署到服务器') {
            when {
                // 只有同时满足：是 main 分支 且 不是 PR 请求
                allOf {
                    branch 'main'
                    not { changeRequest() }
                }
            }
            steps {
                container('nodejs') {
                    echo '🚀 生产环境部署启动...'
                    script {
                    withCredentials([
                        sshUserPrivateKey(
                            credentialsId: 'server-ssh-key',
                            keyFileVariable: 'SSH_KEY',
                            usernameVariable: 'SSH_USER'
                        ),
                        string(credentialsId: 'server-host', variable: 'SERVER_HOST'),
                        string(credentialsId: 'docker-username', variable: 'DOCKER_USERNAME'),
                        string(credentialsId: 'firmament-server-host', variable: 'FIRMAMENT_SERVER_HOST'),
                        string(credentialsId: 'firmament-server-port', variable: 'FIRMAMENT_SERVER_PORT'),
                        usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_HUB_USER', passwordVariable: 'DOCKER_HUB_PASS')
                    ]) {
                        def containerName = env.CONTAINER_NAME
                        // 生成部署脚本（直接在 Groovy 中替换变量）
                        def deployScript = """#!/bin/bash
                        set -e
                        
                        echo "正在登录 Docker Hub..."
                        echo "${DOCKER_HUB_PASS}" | docker login -u "${DOCKER_HUB_USER}" --password-stdin
                        
                        echo "正在拉取镜像..."
                        docker pull ${DOCKER_USERNAME}/firmament-admin:latest
                        
                        echo "清理旧容器..."
                        docker stop ${containerName} || true
                        docker rm ${containerName} || true
                        
                        echo "启动新容器..."
                        docker run -d \\
                            --name ${containerName} \\
                            --restart unless-stopped \\
                            --network firmament_app-network \\
                            -e FIRMAMENT_SERVER_HOST="${FIRMAMENT_SERVER_HOST}" \\
                            -e FIRMAMENT_SERVER_PORT="${FIRMAMENT_SERVER_PORT}" \\
                            ${DOCKER_USERNAME}/firmament-admin:latest
                        
                        # 连接到 nginx-proxy-manager 网络（如果存在）
                        docker network connect nginx-proxy-manager_default ${containerName} || true
                        
                        echo "部署完成！"
                        """
                        
                        writeFile file: 'deploy.sh', text: deployScript
                        
                        // 执行传输和运行
                        sh """
                            # 安装 SSH 客户端工具（Alpine Linux）
                            apk add --no-cache openssh-client
                            
                            mkdir -p ~/.ssh
                            cp "${SSH_KEY}" ~/.ssh/deploy_key
                            chmod 600 ~/.ssh/deploy_key
                            
                            echo "正在上传部署脚本到远程服务器..."
                            scp -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no deploy.sh ${SSH_USER}@${SERVER_HOST}:/tmp/deploy.sh
                            
                            echo "正在执行远程部署..."
                            ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no ${SSH_USER}@${SERVER_HOST} "chmod +x /tmp/deploy.sh && bash /tmp/deploy.sh"
                            
                            rm -f ~/.ssh/deploy_key deploy.sh
                        """
                    }
                    }
                }
            }
        }
    }
 
    post {
        success {
            echo "✅ 构建和部署成功！"
        }
        failure {
            echo "❌ 构建或部署失败，请检查日志"
        }
        always {
            cleanWs() // 清理工作空间
        }
    }
}
