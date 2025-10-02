pipeline {
  agent any

  environment {
    DOCKER_REGISTRY      = 'docker.io'
    DOCKER_CREDENTIALS_ID  = 'dockerhub-creds'
    IMAGE_NAME        = 'tugsbayar/secdevops-assignment2'  

    IMAGE_TAG = "${BUILD_NUMBER}"

    NODE_IMAGE        = 'node:16'
    SNYK_TOKEN_ID     = 'snyk-token'
  }

  stages {
    stage('Checkout') {
      steps {
        echo '        ====[ CHECKOUT ]===='
        checkout scm
      }
    }

    stage('Install deps (Node 16)') {
      steps {
        echo '        ====[ BUILD (npm ci / build) ]===='
        script {
          docker.image(env.NODE_IMAGE).inside('-e CI=true') {
            sh """
              node -v
              npm -v
              npm install --save
            """
          }
        }
      }
      post {
        always {
          echo '        ====[ INSTALL DEPS DONE ]===='
          archiveArtifacts artifacts: 'package.json,package-lock.json', allowEmptyArchive: true
        }
        success {
          echo '[DEPS] Dependencies installed successfully'
        }
        unstable {
          echo '[DEPS] Marked UNSTABLE (warnings during install)'
        }
        failure {
          echo '[DEPS] Dependency installation failed'
        }
      }
    }

    stage('Unit tests') {
      steps {
        echo '        ====[ UNIT TEST ]===='
        script {
          docker.image(env.NODE_IMAGE).inside('-e CI=true') {
            sh """
              npm test
            """
          }
        }
      }
      post {
        always {
          echo '        ====[ UNIT TEST DONE ]===='
          archiveArtifacts artifacts: 'test-results/**/*.xml', allowEmptyArchive: true
        }
        success {
          echo '[UNIT TEST] All tests passed'
        }
        unstable {
          echo '[UNIT TEST] Some tests failed or warnings'
        }
        failure {
          echo '[UNIT TEST] Tests failed'
        }
      }
    }

    stage('Dependency security scan (Snyk)') {
      steps {
        echo '        ====[ SECURITY SCAN (Snyk) ]===='
        withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
          script {
            docker.image(env.NODE_IMAGE).inside('-e CI=true') {
              sh '''
                echo "[SNYK] installing CLI locally"
                npm install --no-save snyk@latest

                echo "[SNYK] version:"
                npx snyk --version

                echo "[SNYK] auth"
                npx snyk auth "$SNYK_TOKEN"

                echo "[SNYK] test (dependencies)"
                # Do not fail the whole build on vulns; mark UNSTABLE instead in Jenkins
                npx snyk test --severity-threshold=medium --json-file-output=.snyk/deps.json || true
              '''
              archiveArtifacts artifacts: '.snyk/*.json', allowEmptyArchive: true
            }
          }
        }
      }
      post {
        always {
          echo '        ====[ SNYK SCAN DONE ]===='
        }
        success {
          echo '[SNYK SCAN] No blocking issues found.'
        }
        unstable {
          echo '[SNYK SCAN] Vulnerabilities detected: check .snyk/*.json artifacts.'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        echo '        ====[ BUILD DOCKER IMAGE ]===='
        script {
          docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
      post {
        always {
          echo '        ====[ BUILD DOCKER IMAGE DONE ]===='
        }
        success {
          echo "[DOCKER] Image built successfully"
        }
        failure {
          echo "[DOCKER] Image build failed"
        }
      }
    }

    stage('Push Docker Image') {
      steps {          
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                      usernameVariable: 'DOCKER_USER', 
                      passwordVariable: 'DOCKER_PASS')]) {
        echo '        ====[ PUSH DOCKER IMAGE ]===='
        sh '''
          echo "[DOCKER] Logging into registry: ${DOCKER_REGISTRY}"
          echo $DOCKER_PASS | docker login --username $DOCKER_USER --password-stdin

          echo "[DOCKER] Pushing image: ${IMAGE_NAME}:${IMAGE_TAG}"
          docker push ${IMAGE_NAME}:${IMAGE_TAG}

          echo "[DOCKER] Tagging as latest"
          docker push ${IMAGE_NAME}:latest
          '''
        }
      }
      post {
        always {
          echo '        ====[ PUSH DOCKER IMAGE DONE ]===='
        }
        success {
          echo '[DOCKER] Image pushed successfully'
        }
        failure {
          echo '[DOCKER] Failed to push image'
        }
      }
    }
  }
}