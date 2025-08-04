# 🚀 AI Fine-tuning & Workflow Platform

> **Enterprise-grade AI platform for local deployment with privacy-first architecture**

A comprehensive, open-source platform that enables developers and enterprises to fine-tune large language models locally, create intelligent workflows, and deploy AI solutions without compromising data privacy.

## 🌟 Key Features

- **🔒 Privacy-First**: Complete local deployment - your data never leaves your infrastructure
- **⚡ Apple Silicon Optimized**: Native MLX integration for blazing-fast performance on Apple Silicon
- **🎯 Advanced Fine-tuning**: Support for LLaMA, Mistral, and custom models with intelligent optimization
- **🔄 Intelligent Workflows**: YAML-based workflow engine with agent orchestration
- **📊 Real-time Monitoring**: Comprehensive progress tracking and performance metrics
- **🚀 Fast Downloads**: Integrated hf_transfer for 3-5x faster model downloads
- **🔧 Production Ready**: Microservices architecture with Docker containerization

---

## 📋 Table of Contents

- [🏠 Project Overview](#-project-overview)
- [🚀 Quick Start Guide](#-quick-start-guide)
- [🏗️ System Architecture](#️-system-architecture)
- [🔧 Installation & Setup](#-installation--setup)
- [📚 Core Components](#-core-components)
- [🎯 User Guides](#-user-guides)
- [🔌 API Documentation](#-api-documentation)
- [🛠️ Developer Guide](#️-developer-guide)
- [🔒 Security & Privacy](#-security--privacy)
- [⚡ Performance & Optimization](#-performance--optimization)
- [🔧 Configuration Reference](#-configuration-reference)
- [📊 Monitoring & Observability](#-monitoring--observability)
- [🚨 Troubleshooting](#-troubleshooting)
- [🔄 Migration & Upgrades](#-migration--upgrades)
- [🤝 Community & Support](#-community--support)
- [📄 Appendices](#-appendices)

---

## 🏠 Project Overview

### What is this platform?

This platform is a comprehensive AI solution designed for developers and enterprises who need to:
- Fine-tune large language models on their own data
- Create intelligent workflows and automation
- Deploy AI solutions locally without data privacy concerns
- Leverage Apple Silicon hardware for optimal performance

### Key Capabilities

- **Local LLM Fine-tuning**: Train models on your proprietary data
- **Workflow Automation**: Create complex AI-powered workflows
- **Model Management**: Deploy and manage multiple AI models
- **Data Processing**: Handle various data formats and sources
- **Real-time Monitoring**: Track training progress and system performance

### Architecture Philosophy

- **Private Data**: All processing happens locally - no data leaves your environment
- **Local LLMs**: Run and fine-tune models entirely on your hardware
- **End-to-end AI**: Complete pipeline from data ingestion to model deployment
- **Apple Silicon First**: Optimized for M1/M2/M3 chips with MLX framework

### Target Audience

- **Developers**: Building AI-powered applications with custom models
- **Enterprises**: Organizations requiring data privacy and local AI deployment
- **Researchers**: Teams needing flexible fine-tuning and experimentation platforms
- **Data Scientists**: Professionals working with proprietary datasets

---

## 🚀 Quick Start Guide

### Prerequisites

- **Hardware**: Apple Silicon Mac (M1/M2/M3) recommended for optimal performance
- **Software**:
  - [Ollama](https://ollama.ai/download)
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - [Miniconda](https://docs.conda.io/projects/conda/en/latest/user-guide/install/macos.html)
  - [Node.js and npm](https://nodejs.org/en/download/package-manager)
- **Memory**: 16GB RAM minimum, 32GB+ recommended for large models
- **Storage**: 50GB+ free space for models and data

### Installation

```bash
# Clone the repository
git clone https://github.com/daniel-manickam/product-platform_0.0.1.git
cd product-platform_0.0.1

# Configure environment
cp .env.example .env
# Edit .env file with your configuration
# Required: Set HUGGINGFACE_API_TOKEN and database passwords

# Start all services
./start.sh

# Access the platform
open http://localhost:3000
```

### First Fine-tuning Job

1. **Upload Dataset**: Navigate to the fine-tuning section and upload your JSONL dataset
2. **Select Model**: Choose from pre-configured models or specify a custom one
3. **Configure Training**: Set parameters like learning rate, batch size, and iterations
4. **Monitor Progress**: Watch real-time training metrics and progress
5. **Deploy Model**: Use the fine-tuned model in workflows or via API

### Management Commands

- **Check Status**: `./status.sh`
- **Stop Fine-tuning**: `./stop_fine_tune.sh`
- **Stop All Services**: `docker compose down`

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Product API   │    │ Workflow Engine │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Fine-tune       │    │   PostgreSQL    │    │     Redis       │
│ Service         │    │   Database      │    │    Cache        │
│ (MLX + Celery)  │    └─────────────────┘    └─────────────────┘
└─────────────────┘              │                       │
         │                       ▼                       ▼
         ▼              ┌─────────────────┐    ┌─────────────────┐
┌─────────────────┐    │     Ollama      │    │   File Storage  │
│      MLX        │    │  Model Server   │    │   (Local/S3)    │
│   Framework     │    └─────────────────┘    └─────────────────┘
└─────────────────┘
```

### Component Overview

- **Frontend**: React-based UI for model management and workflow creation
- **Product API**: Central FastAPI service handling requests and orchestration
- **Fine-tune Service**: Specialized service for MLX-based model fine-tuning
- **Workflow Engine**: YAML-based workflow execution with agent support
- **Databases**: PostgreSQL for persistent data, Redis for caching and queues
- **Model Server**: Ollama for model serving and inference

### Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, SQLAlchemy
- **ML Framework**: MLX (Apple Silicon), Transformers, PyTorch
- **Databases**: PostgreSQL, Redis
- **Queue System**: Celery
- **Containerization**: Docker, Docker Compose
- **Model Serving**: Ollama
- **File Transfer**: hf_transfer for optimized downloads

### Data Flow

1. **User uploads dataset** → Frontend → Product API → Database
2. **Fine-tuning initiated** → Celery queue → Fine-tune Service → MLX
3. **Model training** → Progress updates → WebSocket → Frontend
4. **Model deployment** → Ollama → Available for inference
5. **Workflow execution** → Workflow Engine → Model inference → Results

---

## 🔧 Installation & Setup

### System Requirements

#### Minimum Requirements
- **OS**: macOS 12.0+ (Apple Silicon recommended)
- **RAM**: 16GB
- **Storage**: 50GB free space
- **CPU**: Apple M1/M2/M3 (Intel supported but slower)

#### Recommended Requirements
- **OS**: macOS 13.0+ with Apple Silicon
- **RAM**: 32GB+
- **Storage**: 100GB+ SSD
- **CPU**: Apple M2 Pro/Max or M3

### Detailed Installation

#### 1. Install Prerequisites

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install required tools
brew install node
brew install --cask docker
brew install --cask miniconda

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2. Clone and Setup

```bash
# Clone repository
git clone https://github.com/daniel-manickam/product-platform_0.0.1.git
cd product-platform_0.0.1

# Make scripts executable
chmod +x *.sh

# Setup environment
cp .env.example .env
```

#### 3. Configure Environment Variables

Edit `.env` file with your settings:

```bash
# Database Configuration
POSTGRES_DB=product_platform
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_secure_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Hugging Face Token (required for model downloads)
HUGGINGFACE_API_TOKEN=HUGGINGFACE_API_TOKEN_PLACEHOLDER

# Fine-tuning Service
FINE_TUNE_SERVICE_URL=http://localhost:8400

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
```

#### 4. Start Services

```bash
# Start all services
./start.sh

# Or start manually
docker compose up -d --build
cd fine_tune_service && ./start_fine_tune.sh
```

#### 5. Verify Installation

```bash
# Check service status
./status.sh

# Access the platform
open http://localhost:3000
```

### Manual Setup (Advanced)

For development or custom configurations:

#### Backend Services

```bash
# Start databases
docker compose up -d postgres redis

# Setup Python environment
conda create -n platform python=3.11
conda activate platform
pip install -r requirements.txt

# Start Product API
cd product-api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Fine-tuning Service

```bash
cd fine_tune_service

# Create virtual environment
python3 -m venv fine_tune_env
source fine_tune_env/bin/activate
pip install -r requirements.txt

# Start API service
uvicorn app.main:app --host 0.0.0.0 --port 8400

# Start Celery worker (in another terminal)
celery -A app.celery_app.celery_app worker --loglevel=INFO
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

### Troubleshooting Installation

#### Common Issues

1. **Docker not starting**: Ensure Docker Desktop is running
2. **Port conflicts**: Check if ports 3000, 8000, 8400, 5432, 6379, 11434 are available
3. **MLX installation fails**: Ensure you're on Apple Silicon with macOS 12.0+
4. **Permission denied**: Run `chmod +x *.sh` to make scripts executable

#### Verification Commands

```bash
# Check Docker services
docker ps

# Check Ollama
ollama list

# Check Python environment
python --version
pip list | grep mlx

# Check ports
lsof -i :3000,:8000,:8400,:5432,:6379,:11434
```

---

## 📚 Core Components

### 5.1 Fine-tuning Service

The fine-tuning service is the heart of the platform, providing enterprise-grade model training capabilities with Apple Silicon optimization.

#### Key Features

- **MLX Integration**: Native Apple Silicon acceleration for 3-5x faster training
- **Model Support**: LLaMA 3.2, LLaMA 3.1, Mistral 7B, and custom models
- **Intelligent Fallbacks**: Automatic MLX model conversion and compatibility checking
- **Fast Downloads**: hf_transfer integration for rapid model downloads
- **Progress Tracking**: Real-time training metrics and progress monitoring
- **Error Recovery**: Robust error handling with detailed diagnostics

#### Supported Models

| Model Family | MLX Model | Size | Recommended Use |
|--------------|-----------|------|-----------------|
| LLaMA 3.2 | `mlx-community/Llama-3.2-1B-Instruct-4bit` | 1B | Fast training, testing |
| LLaMA 3.2 | `mlx-community/Llama-3.2-3B-Instruct-4bit` | 3B | Balanced performance |
| LLaMA 3.1 | `mlx-community/Llama-3.1-8B-Instruct-4bit` | 8B | High quality results |
| Mistral | `mlx-community/Mistral-7B-Instruct-v0.3-4bit` | 7B | Efficient inference |

#### Training Configuration

```python
{
    "model_type": "llama3.2",
    "base_model": "mlx-community/Llama-3.2-1B-Instruct-4bit",
    "batch_size": 1,
    "learning_rate": 1e-5,
    "num_iterations": 100,
    "steps_per_eval": 10,
    "num_layers": 16,
    "adapter_path": "/path/to/adapters"
}
```

#### Performance Optimizations

- **Automatic Batch Size**: Intelligent batch size selection based on available memory
- **Memory Management**: Efficient memory usage with gradient checkpointing
- **Caching**: Model and tokenizer caching for faster subsequent runs
- **Parallel Processing**: Multi-core utilization for data preprocessing

### 5.2 Workflow Engine

YAML-based workflow system for creating complex AI-powered automation.

#### Features

- **YAML Configuration**: Human-readable workflow definitions
- **Agent Orchestration**: Multiple AI agents working together
- **Task Management**: Sequential and parallel task execution
- **Error Handling**: Robust error recovery and retry mechanisms
- **State Management**: Persistent workflow state and checkpointing

#### Example Workflow

```yaml
name: "Document Analysis Workflow"
description: "Analyze documents and extract insights"

agents:
  - name: "document_analyzer"
    model: "llama3.2-finetuned"
    role: "Document analysis specialist"

  - name: "summarizer"
    model: "mistral-7b"
    role: "Content summarization expert"

tasks:
  - name: "extract_content"
    agent: "document_analyzer"
    input: "{{ document_path }}"
    output: "extracted_content"

  - name: "generate_summary"
    agent: "summarizer"
    input: "{{ extracted_content }}"
    output: "summary"
    depends_on: ["extract_content"]

outputs:
  - name: "final_report"
    template: "analysis_report.md"
    data:
      content: "{{ extracted_content }}"
      summary: "{{ summary }}"
```

### 5.3 Model Management

Comprehensive model lifecycle management with Ollama integration.

#### Features

- **Model Registry**: Centralized model storage and versioning
- **Dynamic Loading**: On-demand model loading and unloading
- **Health Monitoring**: Model performance and availability tracking
- **Version Control**: Model versioning and rollback capabilities
- **Template Support**: Pre-configured model templates

#### Model Templates

```python
# LLaMA 3.2 Template
LLAMA_32_TEMPLATE = """
<|begin_of_text|><|start_header_id|>system<|end_header_id|>
{system_prompt}<|eot_id|>
<|start_header_id|>user<|end_header_id|>
{question}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
{answer}<|eot_id|>
"""

# Mistral Template
MISTRAL_TEMPLATE = """
<s>[INST] Question: {question} [/INST] {answer}</s>
"""
```

### 5.4 Data Management

Secure and efficient data handling with privacy-first design.

#### Features

- **Local Storage**: All data remains on your infrastructure
- **Format Support**: JSONL, CSV, TXT, and custom formats
- **Data Validation**: Automatic format checking and validation
- **Preprocessing**: Data cleaning and transformation pipelines
- **Splitting**: Automatic train/validation/test splits

#### Data Pipeline

```python
# Data processing pipeline
1. Upload → 2. Validate → 3. Transform → 4. Split → 5. Cache
```

#### Supported Formats

- **JSONL**: `{"text": "training example"}`
- **CSV**: Structured data with text columns
- **TXT**: Plain text files
- **Custom**: User-defined formats with preprocessing

---

## 🎯 User Guides

### 6.1 Fine-tuning Guide

#### Preparing Your Dataset

1. **Format Requirements**
   ```jsonl
   {"text": "Question: What is AI? Answer: Artificial Intelligence is..."}
   {"text": "Question: How does ML work? Answer: Machine Learning works by..."}
   ```

2. **Quality Guidelines**
   - Minimum 10 examples, recommended 100+
   - Consistent formatting across examples
   - Balanced representation of use cases
   - Clear question-answer pairs

3. **Data Splitting**
   - Training: 70-80% of data
   - Validation: 10-15% of data
   - Test: 10-15% of data

#### Choosing Models

| Use Case | Recommended Model | Reasoning |
|----------|------------------|-----------|
| Quick prototyping | Llama-3.2-1B | Fast training, good for testing |
| Production deployment | Llama-3.2-3B | Balanced speed and quality |
| High-quality results | Llama-3.1-8B | Best performance, slower training |
| Efficient inference | Mistral-7B | Good performance/speed ratio |

#### Configuration Best Practices

```python
# For small datasets (< 100 examples)
{
    "batch_size": 1,
    "learning_rate": 1e-4,
    "num_iterations": 50,
    "num_layers": 8
}

# For medium datasets (100-1000 examples)
{
    "batch_size": 2,
    "learning_rate": 1e-5,
    "num_iterations": 100,
    "num_layers": 16
}

# For large datasets (1000+ examples)
{
    "batch_size": 4,
    "learning_rate": 5e-6,
    "num_iterations": 200,
    "num_layers": 32
}
```

#### Monitoring Training

- **Loss Curves**: Watch for decreasing training loss
- **Validation Metrics**: Monitor validation performance
- **Overfitting Signs**: Training loss decreases but validation loss increases
- **Early Stopping**: Stop training when validation loss plateaus

### 6.2 Workflow Creation

#### Workflow Design Principles

1. **Modularity**: Break complex tasks into smaller, reusable components
2. **Error Handling**: Plan for failures and implement recovery strategies
3. **Scalability**: Design workflows that can handle varying data volumes
4. **Monitoring**: Include logging and progress tracking

#### YAML Configuration Guide

```yaml
# Basic workflow structure
name: "workflow_name"
description: "Brief description"
version: "1.0"

# Define agents
agents:
  - name: "agent_id"
    model: "model_name"
    role: "agent_description"
    parameters:
      temperature: 0.7
      max_tokens: 1000

# Define tasks
tasks:
  - name: "task_id"
    agent: "agent_id"
    input: "input_specification"
    output: "output_variable"
    depends_on: ["prerequisite_tasks"]
    retry_count: 3
    timeout: 300

# Define outputs
outputs:
  - name: "output_name"
    format: "json|text|file"
    destination: "output_path"
```

#### Advanced Features

- **Conditional Execution**: Tasks that run based on conditions
- **Parallel Processing**: Tasks that run simultaneously
- **Dynamic Inputs**: Runtime input generation
- **Custom Functions**: User-defined processing functions

### 6.3 Model Deployment

#### Local Deployment

1. **Ollama Integration**
   ```bash
   # Deploy fine-tuned model
   ollama create my-model -f Modelfile
   ollama run my-model
   ```

2. **API Access**
   ```python
   import requests

   response = requests.post("http://localhost:11434/api/generate", {
       "model": "my-model",
       "prompt": "Your question here"
   })
   ```

#### Integration Options

- **REST API**: Direct HTTP API access
- **Python SDK**: Native Python integration
- **WebSocket**: Real-time streaming responses
- **CLI Tools**: Command-line interface

#### Performance Tuning

- **Model Quantization**: Reduce model size for faster inference
- **Batch Processing**: Process multiple requests together
- **Caching**: Cache frequent responses
- **Load Balancing**: Distribute requests across multiple instances

---

## 🔌 API Documentation

### REST API Endpoints

#### Fine-tuning API

```http
POST /api/v1/finetune
Content-Type: application/json

{
  "model_type": "llama3.2",
  "dataset_path": "/path/to/dataset.jsonl",
  "config": {
    "batch_size": 1,
    "learning_rate": 1e-5,
    "num_iterations": 100
  }
}
```

#### Model Management API

```http
# List available models
GET /api/v1/models

# Get model details
GET /api/v1/models/{model_id}

# Deploy model
POST /api/v1/models/{model_id}/deploy

# Delete model
DELETE /api/v1/models/{model_id}
```

#### Workflow API

```http
# Create workflow
POST /api/v1/workflows
Content-Type: application/yaml

# Execute workflow
POST /api/v1/workflows/{workflow_id}/execute

# Get workflow status
GET /api/v1/workflows/{workflow_id}/status
```

### WebSocket API

```javascript
// Connect to progress updates
const ws = new WebSocket('ws://localhost:8000/ws/finetune/{job_id}');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Progress:', data.progress);
    console.log('Status:', data.status);
};
```

### Python SDK

```python
from platform_sdk import PlatformClient

# Initialize client
client = PlatformClient(base_url="http://localhost:8000")

# Start fine-tuning
job = client.finetune.create(
    model_type="llama3.2",
    dataset_path="./data/training.jsonl",
    config={
        "batch_size": 1,
        "learning_rate": 1e-5,
        "num_iterations": 100
    }
)

# Monitor progress
for update in client.finetune.stream_progress(job.id):
    print(f"Progress: {update.progress}%")
```

---

## 🛠️ Developer Guide

### Development Environment Setup

```bash
# Clone repository
git clone <repo-url>
cd product-platform_0.0.1

# Setup development environment
python -m venv dev-env
source dev-env/bin/activate
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests
pytest tests/
```

### Code Structure

```
product-platform_0.0.1/
├── frontend/                 # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── product-api/             # Main API service
│   ├── app/
│   ├── models/
│   └── requirements.txt
├── fine_tune_service/       # Fine-tuning service
│   ├── app/
│   ├── services/
│   └── requirements.txt
├── workflow_engine/         # Workflow execution
│   ├── engine/
│   ├── agents/
│   └── templates/
├── docker-compose.yml       # Service orchestration
├── .env.example            # Environment template
└── README.md               # This file
```

### Contributing Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Run the test suite**: `pytest`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Testing Framework

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_finetune.py

# Run with coverage
pytest --cov=app tests/

# Run integration tests
pytest tests/integration/
```

### Code Style

- **Python**: Follow PEP 8, use Black formatter
- **JavaScript**: Use ESLint and Prettier
- **Documentation**: Use docstrings and type hints
- **Commits**: Follow conventional commit format

---

## 🔒 Security & Privacy

### Data Privacy Guarantees

- **Local Processing**: All data remains on your infrastructure
- **No External Calls**: Models and training happen entirely locally
- **Encrypted Storage**: Data at rest encryption options
- **Access Controls**: Role-based access control (RBAC)
- **Audit Logging**: Comprehensive activity logging

### Security Best Practices

1. **Environment Variables**: Store sensitive data in environment variables
2. **Network Security**: Use HTTPS and secure network configurations
3. **Database Security**: Enable database encryption and access controls
4. **Container Security**: Regular security updates and vulnerability scanning
5. **Backup Strategy**: Regular encrypted backups of critical data

### Compliance Considerations

- **GDPR**: Data processing transparency and user rights
- **HIPAA**: Healthcare data protection (when applicable)
- **SOC 2**: Security and availability controls
- **ISO 27001**: Information security management

---

## ⚡ Performance & Optimization

### Hardware Recommendations

#### Development Environment
- **CPU**: Apple M1/M2/M3 (8-core minimum)
- **RAM**: 16GB (32GB recommended)
- **Storage**: 256GB SSD (512GB+ recommended)
- **Network**: Stable internet for model downloads

#### Production Environment
- **CPU**: Apple M2 Pro/Max or M3 (10+ cores)
- **RAM**: 32GB+ (64GB for large models)
- **Storage**: 1TB+ NVMe SSD
- **Network**: High-bandwidth connection for initial setup

### Apple Silicon Optimizations

- **MLX Framework**: Native Apple Silicon acceleration
- **Metal Performance**: GPU acceleration for training
- **Unified Memory**: Efficient memory usage across CPU/GPU
- **Neural Engine**: Specialized AI processing unit utilization

### Performance Tuning

```python
# Memory optimization
export MLX_METAL_DEBUG=0
export PYTORCH_MPS_HIGH_WATERMARK_RATIO=0.0

# Training optimization
{
    "gradient_checkpointing": True,
    "mixed_precision": True,
    "dataloader_num_workers": 4,
    "pin_memory": True
}
```

### Monitoring & Metrics

- **System Metrics**: CPU, memory, disk usage
- **Training Metrics**: Loss curves, learning rates, throughput
- **Model Metrics**: Inference latency, accuracy, resource usage
- **Business Metrics**: Job completion rates, user satisfaction

---

## 🚨 Troubleshooting

### Common Issues

#### Installation Problems

**Issue**: MLX installation fails
```bash
# Solution: Ensure Apple Silicon and macOS 12.0+
system_profiler SPHardwareDataType | grep "Chip"
sw_vers
```

**Issue**: Docker services won't start
```bash
# Solution: Check Docker Desktop and port availability
docker ps
lsof -i :5432,:6379
```

#### Training Issues

**Issue**: Out of memory errors
```bash
# Solution: Reduce batch size or model size
{
    "batch_size": 1,
    "gradient_checkpointing": True
}
```

**Issue**: Model download fails
```bash
# Solution: Check internet connection and HF token
export HUGGINGFACE_API_TOKEN=your_token
huggingface-cli login
```

### Diagnostic Tools

```bash
# System diagnostics
./scripts/diagnose.sh

# Service health check
./status.sh

# Log analysis
docker logs product-api
tail -f fine_tune_service/logs/celery.log
```

### Support Resources

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Comprehensive guides and API reference
- **Community Forum**: Ask questions and share experiences
- **Discord**: Real-time community support

---

## 🤝 Community & Support

### Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

### Support Channels

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and community support
- **Discord**: Real-time chat and community
- **Email**: security@platform.ai for security issues

### Roadmap

- **Q1 2024**: Enhanced workflow engine with visual editor
- **Q2 2024**: Multi-GPU training support
- **Q3 2024**: Cloud deployment options
- **Q4 2024**: Advanced monitoring and analytics

---

## 📄 Appendices

### Glossary

- **MLX**: Apple's machine learning framework for Apple Silicon
- **LoRA**: Low-Rank Adaptation for efficient fine-tuning
- **Quantization**: Model compression technique
- **Adapter**: Lightweight model modification for fine-tuning

### Model Compatibility Matrix

| Model | MLX Support | Size | Training Time | Inference Speed |
|-------|-------------|------|---------------|-----------------|
| Llama-3.2-1B | ✅ | 1GB | Fast | Very Fast |
| Llama-3.2-3B | ✅ | 3GB | Medium | Fast |
| Llama-3.1-8B | ✅ | 8GB | Slow | Medium |
| Mistral-7B | ✅ | 7GB | Medium | Fast |

### Hardware Compatibility

| Hardware | Support Level | Performance | Notes |
|----------|---------------|-------------|-------|
| Apple M1 | Full | Good | Recommended minimum |
| Apple M2 | Full | Better | Optimal performance |
| Apple M3 | Full | Best | Latest optimizations |
| Intel Mac | Limited | Slower | CPU-only training |

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Apple MLX Team**: For the excellent machine learning framework
- **Hugging Face**: For model hosting and transformers library
- **Ollama Team**: For local model serving capabilities
- **Open Source Community**: For various dependencies and tools
- **Contributors**: Everyone who has contributed to this project

---

*Built with ❤️ for the AI community*

