pipeline {
  agent any

  environment {
    REGISTRY_URL      = 'https://hub.docker.io'
    IMAGE_NAME        = 'tugsbayar/secdevops-assignment2'
    REGISTRY_CRED_ID  = 'dockerhub-creds'        

    NODE_IMAGE        = 'node:16'
    SNYK_TOKEN_ID     = '6d600b7e-4230-417b-83b7-1cecd118bbd2'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install deps (Node 16)') {
      steps {
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
        script {
          docker.image(env.NODE_IMAGE).inside('-e CI=true') {
            sh """
              npm test
            """
          }
        }
      }
    }

    stage('Build Docker image') {
      steps {
        sh """
          docker build -t "${IMAGE_NAME}:${env.GIT_COMMIT.take(7)}" .
        """
      }
    }

    stage('Dependency security scan (Snyk)') {
      steps {
        withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
          script {
            docker.image(env.NODE_IMAGE).inside('-e CI=true') {
              sh """
                npm install -g snyk
                snyk auth "${SNYK_TOKEN}"
                
                snyk test --severity-threshold=high --fail-on=all || (echo "High/Critical issues found" && exit 1)
              """
            }
          }
        }
      }
    }

    stage('Push to Docker Hub') {
      steps {
        script {
          docker.withRegistry("${REGISTRY_URL}", "${REGISTRY_CRED_ID}") {
            // Push both tags
            sh """
              docker push ${IMAGE_NAME}:${env.GIT_COMMIT.take(7)}
              docker push ${IMAGE_NAME}:latest
            """
          }
        }
      }
    }
  }

  // post {
  //   success {
  //     echo "Build ${env.BUILD_NUMBER} pushed as ${IMAGE_TAG}"
  //   }
  //   always {
  //     archiveArtifacts allowEmptyArchive: true, artifacts: 'npm-debug.log, **/snyk*.json, **/dependency-check-report.*'
  //   }
  // }
}