pipeline {
    agent any
    stages {
        stage('Checkout git') {
            steps {
               git branch: 'main', url: 'https://github.com/sivanarayana530/DevSecOps-project.git'
            }
        }
        
        stage('Gitleaks Secrets Scan') {
            steps {
                sh 'docker run --rm -v ${WORKSPACE}:/path zricethezav/gitleaks:latest detect --source="/path" -v --report-format json --report-path /path/gitleaks-report.json || true'
            }
        }
        
        stage ('Build & JUnit Test') {
            steps {
                sh 'mvn install' 
            }
            post {
                success {
                    junit 'target/surefire-reports/**/*.xml'
                }   
            }
        }
        
        stage('SonarQube Analysis'){
            steps{
                withSonarQubeEnv('SonarQube-server') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        sh 'mvn clean verify sonar:sonar -Dsonar.projectKey=devsecops-project-key -Dsonar.token=$SONAR_TOKEN'
                    }
                }
            }
        }

        stage("Quality Gate") {
            steps {
              timeout(time: 1, unit: 'HOURS') {
                waitForQualityGate abortPipeline: true
              }
            }
        }
        
        stage('Semgrep SAST Scan') {
            steps {
                sh 'docker run --rm -v "${WORKSPACE}:/src" returntocorp/semgrep semgrep scan --config auto --json -o /src/semgrep-report.json || true'
            }
        }
        
        stage('Docker Build') {
            steps {
                sh "docker build -t praveensirvi/sprint-boot-app:v1.${env.BUILD_ID} ."
            }
        }

        stage('Image Scan') {
            steps {
                sh "docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image --format table praveensirvi/sprint-boot-app:v1.${env.BUILD_ID} > report.txt || true"
            }
        }

        stage('Store Scan report locally') {
             steps {
                 sh 'mkdir -p reports && cp report.txt reports/'
             }
         }

        stage('AI Vulnerability Analysis with Gemini') {
            steps {
                withCredentials([string(credentialsId: 'gemini-api-key', variable: 'GEMINI_API_KEY')]) {
                    sh 'docker run --rm -v "${WORKSPACE}:/app" -w /app -e GEMINI_API_KEY="${GEMINI_API_KEY}" python:3.9 bash -c "pip install google-generativeai && python ai_reviewer.py || true"'
                }
            }
        }

        stage('Docker Push') {
            steps {
                sh 'echo "Skipping Docker push to avoid needing credentials"'
            }
        }

        stage('Deploy to k8s') {
            steps {
                script {
                    // 1. Create cluster if not exists
                    sh 'kind create cluster --name devsecops-cluster --config kind-config.yaml || true'
                    
                    // 2. Load the image directly into Kind
                    sh "kind load docker-image praveensirvi/sprint-boot-app:v1.${env.BUILD_ID} --name devsecops-cluster"
                    
                    // 3. Get the internal IP and create a temporary config for this build
                    sh '''
                        KIND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' devsecops-cluster-control-plane)
                        kind get kubeconfig --name devsecops-cluster > build-kubeconfig
                        sed -i "s/127.0.0.1.*/$KIND_IP:6443/g" build-kubeconfig
                    '''
                    
                    // 4. Use the specific config for deployment
                    sh "sed -i 's/latest/v1.${env.BUILD_ID}/g' spring-boot-deployment.yaml"
                    sh 'KUBECONFIG=./build-kubeconfig kubectl apply -f spring-boot-deployment.yaml'
                    sh 'KUBECONFIG=./build-kubeconfig kubectl rollout status deployment/spring-app-deployment'
                }
            }
        }
    } // Closes 'stages'

    post {
        always {
            echo "Pipeline completed"
        }
    }
}
