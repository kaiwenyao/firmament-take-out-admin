pipeline {
    agent any
    
    tools {
        nodejs 'nodejs-24.11.1' // 使用 Jenkins 中配置的 Node.js 工具
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
                echo '正在运行代码检查...'
                sh 'npm ci'
                sh 'npm run lint'
            }
        }
        
        stage('3. 构建项目') {
            steps {
                echo '构建前端项目...'
                sh 'npm run build'
            }
        }
        
        stage('4. 构建并推送 Docker 镜像') {
            when {
                // 只有非 PR 请求时才构建和推送镜像
                not { changeRequest() }
            }
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh '''
                            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                            docker build -t ${DOCKER_USER}/firmament-admin:latest -f Dockerfile .
                            docker push ${DOCKER_USER}/firmament-admin:latest
                        '''
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
