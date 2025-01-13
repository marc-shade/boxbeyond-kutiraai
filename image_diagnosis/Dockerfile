FROM python:3.11-slim

WORKDIR /app

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install system packages and Python dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      bzip2 \
      g++ \
      git \
      graphviz \
      libgl1-mesa-glx \
      libglib2.0-0 \
      libhdf5-dev \
      wget \
      curl \
      ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    # Upgrade pip
    python3 -m pip install --no-cache-dir --upgrade pip && \
    # Install Python packages
    pip install --no-cache-dir -r requirements.txt && \
    # Install PyTorch CPU version using pip
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir ultralytics==8.0.208 --no-deps

# Copy application code
COPY home.py .
COPY classification/ classification/
COPY runs/ runs/

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create and switch to non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 5000/tcp

CMD ["python3.11", "-m", "flask" , "--app", "home.py", "run", "--host=0.0.0.0"]
