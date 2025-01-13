#!/bin/bash

# Set AWS region and account ID
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Define service names, their corresponding Docker image names, and ECR repository names
SERVICES=("product-api" "workflow-engine" "frontend" "image-diagnosis")
DOCKER_IMAGES=("product-product-api" "product-workflow-engine" "product-frontend" "product-image-diagnosis")
REPOS=("product-api" "workflow-engine" "frontend-app" "image-diagnosis")

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Process each service
for i in "${!SERVICES[@]}"; do
    SERVICE_NAME="${SERVICES[$i]}"
    DOCKER_IMAGE="${DOCKER_IMAGES[$i]}"
    REPO_NAME="${REPOS[$i]}"
    
    echo "Processing ${SERVICE_NAME} (Docker image: ${DOCKER_IMAGE}, ECR repo: ${REPO_NAME})..."
    
    # Check if the image exists locally
    if ! docker images ${DOCKER_IMAGE}:latest >/dev/null 2>&1; then
        echo "Warning: Image ${DOCKER_IMAGE}:latest not found locally. Make sure you've run docker-compose up first."
        continue
    fi

    # Remove existing ECR tagged image if it exists
    echo "Removing existing ECR tagged image for ${REPO_NAME}..."
    docker rmi ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:latest 2>/dev/null || true
    
    # Tag the existing image
    echo "Tagging ${DOCKER_IMAGE}..."
    docker tag ${DOCKER_IMAGE}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:latest
    
    # Push to ECR
    echo "Pushing ${REPO_NAME} to ECR..."
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}:latest
    
    echo "Successfully pushed ${REPO_NAME} to ECR"
done

# Clean up
echo "Cleaning up local images..."
docker system prune -f

echo "All done!"
