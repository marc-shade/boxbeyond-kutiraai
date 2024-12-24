#!/bin/bash

# Set AWS region and account ID
export AWS_REGION="us-east-1"
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Array of images
#IMAGES=("workflow-engine" "product-api" "frontend-app")
IMAGES=("frontend-app")
# Build images using docker compose
echo "Building images using docker compose..."
docker compose build

# Login to ECR
echo "Logging into ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Create repositories and push images
for IMAGE in "${IMAGES[@]}"; do
    echo "Processing ${IMAGE}..."
    
    # Create ECR repository if it doesn't exist
    aws ecr describe-repositories --repository-names ${IMAGE} || \
    aws ecr create-repository --repository-name ${IMAGE}

    # Tag for ECR
    docker tag ${IMAGE}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${IMAGE}:latest
    
    # Push the image
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${IMAGE}:latest
    
    echo "Successfully pushed ${IMAGE} to ECR"
done
