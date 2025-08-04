# Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the source code
COPY src/ /app/src/

# Set Python path
ENV PYTHONPATH=/app/src

# Create directory for workflow configs
RUN mkdir -p /app/workflows

# Default port for the API
EXPOSE 8100

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8100/health || exit 1

# Start the application
CMD ["uvicorn", "workflow_engine.api:app", "--host", "0.0.0.0", "--port", "8100", "--reload"]