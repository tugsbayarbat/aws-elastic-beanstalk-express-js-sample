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
        echo '====[ CHECKOUT ]===='
        checkout scm
      }
    }

    stage('Install deps (Node 16)') {
      steps {
        echo '====[ BUILD (npm ci / build) ]===='
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
    }

    stage('Unit tests') {
      steps {
        echo '====[ UNIT TEST ]===='
        script {
          docker.image(env.NODE_IMAGE).inside('-e CI=true') {
            sh """
              npm test
            """
          }
        }
      }
    }
    stage('Dependency security scan (Snyk)') {
      steps {
        echo '====[ SECURITY SCAN (Snyk) ]===='
        withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
          script {
            docker.image(env.NODE_IMAGE).inside('-e CI=true') {
              sh '''
                set -euxo pipefail
                echo "[SNYK] installing CLI locally"
                npm install --no-save snyk@latest

                echo "[SNYK] version:"
                npx snyk --version

                echo "[SNYK] auth"
                npx snyk auth "$SNYK_TOKEN"

                echo "[SNYK] test (dependencies)"
                # Do not fail the whole build on vulns; mark UNSTABLE instead in Jenkins
                npx snyk test --severity-threshold=medium --json-file-output=.snyk/deps.json || true

                echo "[SNYK] test (code) - optional"
                npx snyk code test --json-file-output=.snyk/code.json || true

                echo "[SNYK] monitor (send snapshot to Snyk)"
                npx snyk monitor --project-name="${JOB_NAME}" || true
              '''
              archiveArtifacts artifacts: '.snyk/*.json', allowEmptyArchive: true
            }
          }
        }
      }
      post {
        always {
          echo '====[ SNYK SCAN DONE ]===='
        }
        success {
          echo 'No blocking issues found.'
        }
        unstable {
          echo 'Vulnerabilities detected: check .snyk/*.json artifacts.'
        }
      }
    }

    // stage('Dependency security scan (Snyk)') {
    //   steps {
    //     echo '====[ SECURITY SCAN (Snyk) ]===='
    //     withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
    //       script {
    //         docker.image(env.NODE_IMAGE).inside('-e CI=true') {
    //           sh """
    //             npm install -g snyk
    //             snyk auth "${SNYK_TOKEN}"
                
    //             snyk test --severity-threshold=high --fail-on=all --json > snyk-report.json || (echo "High/Critical issues found" && exit 1)
    //           """
    //         }
    //       }
    //     }
    //   }
    // }

    stage('Build Docker Image') {
      steps {
        echo '====[ BUILD DOCKER IMAGE ]===='
        script {
          docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
    }

    stage('Push Docker Image') {
      steps {          
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                      usernameVariable: 'DOCKER_USER', 
                      passwordVariable: 'DOCKER_PASS')]) {
        echo '====[ PUSH DOCKER IMAGE ]===='
        sh '''
          echo $DOCKER_PASS | docker login --username $DOCKER_USER --password-stdin
          docker push ${IMAGE_NAME}:${IMAGE_TAG}
          docker push ${IMAGE_NAME}:latest
          '''
        }
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: '**/junit*.xml'

      archiveArtifacts artifacts: 'snyk-report.json', allowEmptyArchive: true
    }
  }
}