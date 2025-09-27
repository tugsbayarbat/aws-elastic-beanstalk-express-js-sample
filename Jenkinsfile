pipeline {
  agent any

  environment {
    REGISTRY          = 'docker.io'
    REGISTRY_NAMESPACE= 'tugsbayar' 
    REGISTRY_CRED_ID  = 'dockerhub-creds' 

    APP_NAME          = 'secdevops-assignment2'         
    IMAGE_TAG         = "${REGISTRY}/${REGISTRY_NAMESPACE}/${APP_NAME}:${env.BUILD_NUMBER}"
    IMAGE_TAG_LATEST  = "${REGISTRY}/${REGISTRY_NAMESPACE}/${APP_NAME}:latest"

    NODE_IMAGE        = 'node:16'
    ENABLE_SNYK       = 'true'
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
            sh '''
              node -v
              npm -v
              npm install --save
            '''
          }
        }
      }
    }

    stage('Unit tests') {
      steps {
        script {
          docker.image(env.NODE_IMAGE).inside('-e CI=true') {
            sh '''
              npm test
            '''
          }
        }
      }
    }

    stage('Build Docker image') {
      steps {
        sh '''
          docker build -t "${IMAGE_TAG}" -t "${IMAGE_TAG_LATEST}" .
        '''
      }
    }

    stage('Dependency security scan (Snyk)') {
      when { expression { return env.ENABLE_SNYK.toBoolean() } }
      steps {
        withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
          script {
            docker.image(env.NODE_IMAGE).inside('-e CI=true') {
              sh '''
                npm install -g snyk
                snyk auth "${SNYK_TOKEN}"
                
                snyk test --severity-threshold=high --fail-on=all || (echo "High/Critical issues found" && exit 1)
              '''
            }
          }
        }
      }
    }

    stage('Login & Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: env.REGISTRY_CRED_ID, usernameVariable: 'REG_USER', passwordVariable: 'REG_PASS')]) {
          sh '''
            echo "${REG_PASS}" | docker login "${REGISTRY}" -u "${REG_USER}" --password-stdin
            docker push "${IMAGE_TAG}"
            docker push "${IMAGE_TAG_LATEST}"
          '''
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