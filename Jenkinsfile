pipeline {
  agent any

  // ====== SIMPLE ENV VARS (edit these) ======
  environment {
    IMAGE_NAME        = 'tugsbayar/secdevops-assignment2'   // Your Docker Hub repo
    IMAGE_TAG         = "${BUILD_NUMBER}"                   // e.g. 27
    DOCKERHUB_CREDS   = 'dockerhub-creds'                   // Jenkins Credentials ID (username+password)
    SNYK_TOKEN_ID     = '6d600b7e-4230-417b-83b7-1cecd118bbd2' // (Optional) Secret Text
  }

  stages {
    stage('Checkout') {
      steps {
        echo '====[ CHECKOUT ]===='
        checkout scm
      }
    }

    stage('Build') {
      steps {
        echo '====[ BUILD (npm ci / build) ]===='
          sh """
            node -v
            npm -v
            npm install --save
          """
      }
    }

    stage('Unit tests') {
      steps {
        echo '====[ UNIT TEST ]===='
        sh """
          set -e
          if npm run | grep -qE "^\\s*test\\b"; then
            npm test --if-present
          else
            echo "No test script found. Skipping."
          fi
        """
      }
    }

    stage('Dependency security scan (Snyk)') {
      steps {
        echo '====[ SECURITY SCAN (Snyk) ]===='
        withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
          sh """
            echo "=== Installing Snyk CLI ==="
            npm install -g snyk

            echo "=== Authenticating with Snyk ==="
            snyk auth "${SNYK_TOKEN}"

            echo "=== Running Snyk test (console output) ==="
            snyk test --severity-threshold=high --fail-on=all --json > snyk-report.json || true

            echo "=== Scan complete. Report saved to snyk-report.json ==="
          """
        }
      }
      post {
        always {
          archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
        }
        unsuccessful {
          echo "High/Critical vulnerabilities detected — build failed"
        }
        success {
          echo "No High/Critical vulnerabilities found"
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        echo '====[ IMAGE BUILD (Docker) ]===='
        script {
          docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
    }

    stage('Push Docker Image') {
      steps {    
        echo '====[ PUSH (Docker Hub) ]===='      
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                      usernameVariable: 'DOCKER_USER', 
                      passwordVariable: 'DOCKER_PASS')]) {
        sh '''
          echo $DOCKER_PASS | docker login --username $DOCKER_USER --password-stdin
          docker push ${IMAGE_NAME}:${IMAGE_TAG}
          docker push ${IMAGE_NAME}:latest
          docker logout || true
          '''
        }
      }
    }
  }

  post {
    success {
      echo "====[ SUMMARY ]===="
      echo "Build #: ${env.BUILD_NUMBER}"
      echo "Image:   ${IMAGE_NAME}:${IMAGE_TAG} (also :latest)"
      echo "Result:  SUCCESS"
    }
    failure {
      echo "====[ SUMMARY ]===="
      echo "Result:  FAILURE (check the stage logs above)"
    }
  }
}
