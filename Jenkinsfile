pipeline {
  agent any

  environment {
    DOCKER_REGISTRY      = 'docker.io'
    DOCKER_CREDENTIALS_ID  = 'dockerhub-creds'
    IMAGE_NAME        = 'tugsbayar/secdevops-assignment2'  

    IMAGE_TAG = "${BUILD_NUMBER}"

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

    stage('Build Docker Image') {
      steps {
        script {
          dockerImage  = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
        }
      }
    }

    // stage('Dependency security scan (Snyk)') {
    //   steps {
    //     withCredentials([string(credentialsId: env.SNYK_TOKEN_ID, variable: 'SNYK_TOKEN')]) {
    //       script {
    //         docker.image(env.NODE_IMAGE).inside('-e CI=true') {
    //           sh """
    //             npm install -g snyk
    //             snyk auth "${SNYK_TOKEN}"
                
    //             snyk test --severity-threshold=high --fail-on=all || (echo "High/Critical issues found" && exit 1)
    //           """
    //         }
    //       }
    //     }
    //   }
    // }

    stage('Push Docker Image') {
      steps {          
          withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                        usernameVariable: 'DOCKER_USER', 
                        passwordVariable: 'DOCKER_PASS')]) {
            sh '''
              echo $DOCKER_PASS | docker login --username $DOCKER_USER --password-stdin
              docker push "${IMAGE_TAG}"
              docker push "${IMAGE_TAG_LATEST}"
            '''
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