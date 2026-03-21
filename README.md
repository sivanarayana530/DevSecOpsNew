# Next-Gen DevSecOps Project

This project implements an end-to-end continuous integration and continuous deployment (CI/CD) pipeline with a strong emphasis on **Security Best Practices** and **DevSecOps principles**. 

The pipeline handles building a Spring Boot application, performing multiple layers of security analysis (Secrets, SAST, SCA, Container vulnerabilities), using AI to review vulnerabilities, rendering a modern React Dashboard for the reports, and seamlessly deploying the application to a local Kubernetes cluster using `kind`.

## 🚀 Architecture Highlights

The pipeline utilizes the following tools:
- **Git & GitHub**: Source code management.
- **Jenkins**: CI/CD Orchestration.
- **Maven & JUnit**: Application build and unit testing.
- **Gitleaks**: Secrets scanning.
- **Semgrep**: Static Application Security Testing (SAST).
- **OWASP Dependency-Check**: Software Composition Analysis (SCA) for vulnerable libraries.
- **SonarQube**: Code quality and static analysis.
- **Trivy**: Container image vulnerability scanning.
- **Gemini AI**: AI-driven vulnerability analysis and review.
- **React & Vite**: Interactive DevSecOps Dashboard.
- **Docker**: Containerization.
- **Kubernetes (kind)**: Local container orchestration and deployment.

---

## 💻 Prerequisites

Ensure your local machine has the following installed:
1. **Docker Desktop / Docker Engine**
2. **Docker Compose**
3. **Git**

---

## 🛠️ Infrastructure Setup (Docker Compose)

You can spin up the entire backend infrastructure (Jenkins, SonarQube, PostgreSQL) using Docker Compose.

1. Clone the repository and navigate into the directory:
   ```bash
   git clone <your-repository-url>
   cd DevSecOpsNew
   ```
2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. The following services will be available:
   - **Jenkins**: `http://localhost:8080` (or the port mapped in your `docker-compose.yml`)
   - **SonarQube**: `http://localhost:9000`

---

## 🔐 Credentials Preparation

To run the pipeline successfully, you need three pieces of information to store securely in Jenkins.

1. **SonarQube Token (`sonar-token`)**:  
   - Open SonarQube at `http://localhost:9000`. Log in with `admin / admin` (it will prompt you to change the password).
   - Go to **My Account > Security** and generate a new token (User Token).
2. **NVD API Key (`nvd-api-key`)**:  
   - (Optional but highly recommended) Get a free API key from the [NIST NVD](https://nvd.nist.gov/developers/request-an-api-key) to avoid aggressive rate limits during the OWASP Dependency check.
3. **Gemini API Key (`gemini-api-key`)**:  
   - Get your API key from [Google AI Studio](https://aistudio.google.com/) for the AI Vulnerability Analysis stage.

---

## ⚙️ Jenkins Configuration

### 1. Unlock and Install Plugins
1. Retrieve the initial admin password from the Jenkins container:
   ```bash
   docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
   ```
2. Open Jenkins in your browser, paste the password, and install the **suggested plugins**.
3. Go to **Manage Jenkins > Plugins > Available Plugins** and install:
   - **SonarQube Scanner**

### 2. Add Credentials to Jenkins
Go to **Manage Jenkins > Credentials > System > Global credentials (unrestricted)**. Add the following **Secret Text** credentials:
- **ID**: `sonar-token` | **Secret**: `<Your SonarQube Token>`
- **ID**: `nvd-api-key` | **Secret**: `<Your NVD API Key>`
- **ID**: `gemini-api-key` | **Secret**: `<Your Gemini API Key>`

### 3. Add SonarQube Server
1. Go to **Manage Jenkins > System**.
2. Scroll to the **SonarQube servers** section and click **Add SonarQube**.
3. Configure it as follows:
   - **Name**: `SonarQube-server` (Must exactly match the name in the `Jenkinsfile`!)
   - **Server URL**: `http://sonarqube:9000`

### 4. Enable Jenkins CSP for the React Dashboard
Because the pipeline builds a React Dashboard and serves it as a Jenkins Artifact, you must relax Jenkins's default Content-Security-Policy to allow the JavaScript to execute.

Run the following command in your terminal to create an initialization script inside the Jenkins container:
```bash
docker exec -u root jenkins bash -c 'mkdir -p /var/jenkins_home/init.groovy.d && echo "System.setProperty(\"hudson.model.DirectoryBrowserSupport.CSP\", \"sandbox allow-scripts allow-same-origin; default-src \\'self\\' \\'unsafe-inline\\' \\'unsafe-eval\\' data:;\")" > /var/jenkins_home/init.groovy.d/csp.groovy'
```
Restart Jenkins to apply the change:
```bash
docker restart jenkins
```

---

## ▶️ Running the Pipeline

1. In Jenkins, click **New Item**.
2. Enter a name (e.g., `DevSecOps-Pipeline`), select **Pipeline**, and click **OK**.
3. Scroll down to the **Pipeline** section.
4. Set **Definition** to `Pipeline script from SCM`.
5. Set **SCM** to `Git` and provide your repository URL.
6. Make sure the **Branch Specifier** is `*/main` and the **Script Path** is `Jenkinsfile`.
7. Save the job and click **Build Now**.

---

## 📊 Viewing the Results

### 1. The DevSecOps Dashboard
Once the pipeline finishes building the `Build React Dashboard` stage, Jenkins will archive the results.
- Go to the successful build run in Jenkins.
- Click on **Build Artifacts**.
- Navigate to `reports/dashboard/index.html`. 
- You will be presented with a beautifully structured, interactive dashboard showing the aggregated results from Gitleaks, Semgrep, OWASP Dependency-Check, and Trivy, completely styled in Tailwind CSS!

### 2. SonarQube Quality Gate
You can view code smells, coverage, and duplication issues by navigating directly to `http://localhost:9000`.

### 3. Deployed Application
The final stage of the pipeline automatically provisions a local Kubernetes cluster using `kind`, loads the built Docker image (`team/sprint-boot-app`), and deplhes it.
- To interact with the cluster on your machine:
  ```bash
  kind get clusters
  kubectl get pods
  ```
- The application will be deployed and running locally.
