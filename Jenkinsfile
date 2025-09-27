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
          docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}")
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

    stage('Snyk Security Scan') {
      steps {
        script {
          // Snyk container scan for vulnerabilities
          withCredentials([string(credentialsId: 'snyk-token', variable: 'SNYK_TOKEN')]) {
            sh '''
              # Install Snyk CLI if not available
              if ! command -v snyk &> /dev/null; then
                  npm install -g snyk
              fi
              
              # Authenticate with Snyk
              snyk auth $SNYK_TOKEN
              
              # Test for vulnerabilities in the Docker image
              snyk container test ${DOCKER_HUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG} \
                  --severity-threshold=high \
                  --file=Dockerfile \
                  --json > snyk-results.json || true
              
              # Monitor the image in Snyk dashboard
              snyk container monitor ${DOCKER_HUB_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG} \
                  --file=Dockerfile \
                  --project-name="${IMAGE_NAME}" || true
            '''
          }
          
          // Parse results and fail if high/critical vulnerabilities found
          script {
            def snykResults = readJSON file: 'snyk-results.json'
            def vulnerabilities = snykResults.vulnerabilities ?: []
            def highCriticalVulns = vulnerabilities.findAll { 
                it.severity == 'high' || it.severity == 'critical' 
            }
            
            if (highCriticalVulns.size() > 0) {
                echo "❌ Found ${highCriticalVulns.size()} high/critical vulnerabilities!"
                currentBuild.result = 'UNSTABLE'
                
                // Optionally fail the build
                // error("Security scan failed: High/Critical vulnerabilities found")
            } else {
                echo "✅ No high/critical vulnerabilities found"
            }
          }
        }
      }
      post {
          always {
              // Archive Snyk results
              archiveArtifacts artifacts: 'snyk-results.json', allowEmptyArchive: true
              
              // Publish results (requires Snyk Security Plugin)
              publishHTML([
                  allowMissing: false,
                  alwaysLinkToLastBuild: true,
                  keepAll: true,
                  reportDir: '.',
                  reportFiles: 'snyk-results.json',
                  reportName: 'Snyk Security Report'
              ])
          }
      }
    }

    stage('Push Docker Image') {
      steps {          
        withCredentials([usernamePassword(credentialsId: "${DOCKER_CREDENTIALS_ID}", 
                      usernameVariable: 'DOCKER_USER', 
                      passwordVariable: 'DOCKER_PASS')]) {
        sh '''
          echo $DOCKER_PASS | docker login --username $DOCKER_USER --password-stdin
          docker push ${IMAGE_NAME}:${IMAGE_TAG}
          docker push ${IMAGE_NAME}:latest
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