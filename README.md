# OnPremAI

![OnPremAI Logo](onpremai_logo.jpg)

> **Enterprise-grade AI platform for complete local deployment with privacy-first architecture**

OnPremAI is a comprehensive, open-source platform that enables developers and enterprises to run AI workloads entirely on-premises. From dataset generation and LLM fine-tuning to enterprise process integration - all while keeping your data completely private and secure.

---

## 🌟 Introduction

OnPremAI was designed with a core philosophy: **your data should never leave your infrastructure**. In an era where data privacy and security are paramount, OnPremAI provides a complete AI platform that runs entirely on your local infrastructure.

### Key Principles

- **🔒 Complete Local Deployment**: Every component runs on your infrastructure - no external dependencies for core functionality
- **📊 End-to-End AI Pipeline**: From raw documents to fine-tuned models to enterprise workflows
- **🚀 Easy Installation**: Single command deployment with containerized, modular architecture
- **🔧 Modular Design**: Each service is independently deployable and scalable
- **🏢 Enterprise Ready**: Built for production workloads with monitoring, logging, and security

### What Makes OnPremAI Different

- **Dataset Generation**: Automatically generate training datasets from your documents (Google Drive, local files)
- **Local Fine-tuning**: Train LLMs on your proprietary data using Apple Silicon optimization (MLX)
- **Agentic Workflows**: Create intelligent multi-agent workflows powered by CrewAI
- **Process Integration**: Seamlessly integrate AI into enterprise processes with n8n workflows
- **Vector Store**: Built-in Qdrant vector database for RAG and semantic search

---

## 🏗️ Architecture

### High-Level Architecture

![OnPremAI Architecture](OnPremAI-Arch.png)

### Service Architecture

#### **Frontend Layer**
- **Technology**: React 18 + Vite + Material-UI
- **Port**: 3000
- **Features**: Fine-tuning UI, dataset management, workflow builder, real-time monitoring

#### **API Services Layer**

**1. Product API (Port: 8200)**
- **Technology**: FastAPI + SQLAlchemy + PostgreSQL
- **Purpose**: Core platform data management
- **Features**: Dataset CRUD, fine-tuning configs, model metadata, HuggingFace proxy

**2. Fine-tune Service (Port: 8400)**
- **Technology**: FastAPI + Celery + Redis + MLX
- **Purpose**: AI model fine-tuning pipeline
- **Features**: MLX fine-tuning, async processing, progress tracking, Ollama integration

**3. Workflow Engine (Port: 8100)**
- **Technology**: FastAPI + CrewAI + LangChain
- **Purpose**: Agentic AI workflow orchestration
- **Features**: Multi-agent teams, dynamic workflows, LLM integration, WebSocket updates

**4. n8n Workflow (Port: 5678)**
- **Technology**: n8n + Node.js
- **Purpose**: Process automation and integration
- **Features**: Visual workflow builder, 200+ integrations, data processing pipelines

#### **Data Storage Layer**
- **Product Database**: PostgreSQL (Port: 5434) - Core platform data
- **Workflow Database**: PostgreSQL (Port: 5435) - Agent workflow data
- **n8n Database**: PostgreSQL (Port: 5432) - Process automation data
- **Redis**: (Port: 6379) - Task queue and caching
- **Qdrant**: (Port: 6333) - Vector database for embeddings

#### **AI/ML Services**
- **Ollama**: (Port: 11434) - Local LLM server
- **MLX Framework**: Apple Silicon ML optimization
- **Hugging Face Integration**: Model hub access

### Technology Stack

#### **Backend Technologies**
- **Python 3.12**: Core backend language
- **FastAPI**: High-performance API framework
- **SQLAlchemy**: Database ORM
- **Celery**: Distributed task queue
- **CrewAI**: Multi-agent AI framework
- **MLX**: Apple Silicon ML framework

#### **Frontend Technologies**
- **React 18**: Modern UI framework
- **Vite**: Fast build tool
- **Material-UI**: Component library
- **WebSocket**: Real-time communication

#### **Infrastructure**
- **Docker**: Containerization
- **PostgreSQL**: Primary database
- **Redis**: Caching and task queue
- **Qdrant**: Vector database
- **Ollama**: Local LLM server

#### **AI/ML Stack**
- **Ollama**: Local LLM server
- **Hugging Face**: Model hub and API
- **MLX**: Apple Silicon optimization
- **LangChain**: LLM application framework
- **LoRA**: Efficient fine-tuning technique

### Port Configuration

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 3000 | HTTP | React development server |
| Product API | 8200 | HTTP | Core API services |
| Fine-tune Service | 8400 | HTTP | Fine-tuning operations |
| Workflow Engine | 8100 | HTTP/WS | Agent workflows |
| n8n | 5678 | HTTP | Process automation |
| Ollama | 11434 | HTTP | Local LLM inference |
| Product DB | 5434 | TCP | PostgreSQL database |
| Workflow DB | 5435 | TCP | PostgreSQL database |
| n8n DB | 5432 | TCP | PostgreSQL database |
| Redis | 6379 | TCP | Task queue |
| Qdrant | 6333 | HTTP | Vector database |

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

#### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/your-org/OnPremAI.git
cd OnPremAI

# Configure environment
cp .env.example .env
# Edit .env file with your configuration
# Required: Set HUGGINGFACE_API_TOKEN and database passwords

# Start the entire platform
./start.sh
```

The `start.sh` script will:
- Start all Docker services (databases, APIs, frontend)
- Set up the fine-tuning service with MLX
- Import pre-built n8n workflows
- Verify all services are running
- Provide access URLs

#### N8N Credentials Setup

After the platform is running, you need to create the following credentials in n8n (http://localhost:5678):

1. **Google Drive API** - For document access from Google Drive
2. **OnPremAI Product API** - For dataset management integration
3. **OnPremAI Workflow Engine** - For agentic workflow integration
4. **Local File System** - For local document processing

#### Pre-built Workflows

OnPremAI includes 6 pre-configured n8n workflows:

| Workflow Name | Purpose | Description |
|---------------|---------|-------------|
| **Dataset Generator - Google Drive** | Document Processing | Extracts documents from Google Drive, chunks them, and generates Q&A pairs |
| **Dataset Generator - Local Drive** | Document Processing | Processes local documents and creates training datasets |
| **Dataset Generator Sub Process** | Data Processing | Handles document chunking and Q&A generation logic |
| **Agentic Workflow** | AI Orchestration | Executes CrewAI-based multi-agent workflows |
| **RAG Workflow** | Knowledge Retrieval | Implements Retrieval-Augmented Generation workflows |
| **Update Knowledge Base** | Vector Store Management | Updates and manages Qdrant vector embeddings |

---

## 🎯 Key Capabilities

### 4.1 Dataset Generation

OnPremAI provides comprehensive dataset generation capabilities for fine-tuning:

- **Multi-Source Support**: Read documents from Google Drive or local file systems via n8n workflows
- **Intelligent Chunking**: Automatically split documents into optimal chunks for training
- **Q&A Generation**: Generate question-answer pairs from document chunks using LLMs
- **Format Optimization**: Format datasets specifically for target LLM architectures (LLaMA, Mistral, etc.)
- **Quality Control**: Review and edit generated Q&A pairs before training
- **Batch Processing**: Handle large document collections efficiently

**Supported Formats**: PDF, DOCX, TXT, MD, HTML
**Output Formats**: JSONL optimized for LLaMA 3.2, Mistral, and custom model templates

### 4.2 Fine-tuning LLM

Enterprise-grade model fine-tuning with Apple Silicon optimization:

- **MLX Integration**: Native Apple Silicon acceleration for 3-5x faster training
- **Model Support**: LLaMA 3.2, LLaMA 3.1, Mistral 7B, and custom models
- **LoRA Fine-tuning**: Efficient parameter-efficient training
- **Real-time Monitoring**: Track training progress, loss curves, and metrics
- **Automatic Deployment**: Deploy fine-tuned models directly to Ollama
- **Adapter Management**: Save and version model adapters

**Process Flow**:
1. Upload dataset (JSONL format)
2. Select base model and configure parameters
3. Start training with real-time progress tracking
4. Automatic model deployment to Ollama
5. Test and validate fine-tuned model

### 4.3 Agentic Workflows

Powered by CrewAI for intelligent multi-agent orchestration:

- **Agent Configuration**: Define specialized AI agents with specific roles and capabilities
- **Team Coordination**: Orchestrate multiple agents working together on complex tasks
- **Dynamic Workflows**: Create workflows that adapt based on intermediate results
- **LLM Integration**: Use your fine-tuned models within agent workflows
- **API Integration**: Invoke agentic workflows via REST API
- **n8n Integration**: Seamlessly integrate with enterprise processes using HTTP nodes

**Example Use Cases**:
- Document analysis and summarization teams
- Multi-step research and fact-checking workflows
- Content generation with review and editing agents
- Data processing and validation pipelines

### 4.4 Process Flows

Powered by n8n for enterprise process automation:

- **Visual Workflow Builder**: Drag-and-drop interface for creating complex processes
- **200+ Integrations**: Pre-built connectors for popular enterprise systems
- **Fine-tuned LLM Integration**: Use your custom models within process flows
- **Agentic Workflow Invocation**: Call CrewAI workflows from n8n processes
- **Event-driven Automation**: Trigger workflows based on external events
- **Data Transformation**: ETL capabilities for data processing

**Integration Capabilities**:
- CRM systems (Salesforce, HubSpot)
- Communication platforms (Slack, Teams, Email)
- File storage (Google Drive, SharePoint, S3)
- Databases and APIs
- Custom HTTP endpoints

### 4.5 Vector Store

Built-in Qdrant vector database for semantic search and RAG:

- **Qdrant Dashboard**: Web interface for managing vector collections
- **Embedding Management**: Store and query document embeddings
- **Semantic Search**: Find similar documents and content
- **RAG Implementation**: Retrieval-Augmented Generation workflows
- **Collection Management**: Organize embeddings by project or domain
- **Performance Monitoring**: Track query performance and storage metrics

**Features**:
- High-performance vector similarity search
- Metadata filtering and hybrid search
- Scalable storage for large document collections
- Integration with fine-tuning and workflow services

---

## 🏛️ Architecture Philosophy

OnPremAI is built on four core architectural principles:

- **Private Data**: All processing happens locally - no data leaves your environment
- **Local LLMs**: Run and fine-tune models entirely on your hardware
- **End-to-end AI**: Complete pipeline from data ingestion to model deployment
- **Apple Silicon First**: Optimized for M1/M2/M3 chips with MLX framework

This ensures complete data sovereignty while providing enterprise-grade AI capabilities.

---

## 📚 API Documentation

### Core API Endpoints

#### Product API (Port: 8200)
```bash
# Dataset Management
GET    /api/v1/datasets              # List datasets
POST   /api/v1/datasets              # Create dataset
GET    /api/v1/datasets/{id}         # Get dataset details
PUT    /api/v1/datasets/{id}         # Update dataset
DELETE /api/v1/datasets/{id}         # Delete dataset

# Model Management
GET    /api/v1/models                # List models
POST   /api/v1/models                # Register model
GET    /api/v1/models/{id}           # Get model details

# Fine-tuning Configuration
POST   /api/v1/finetune/configs      # Create fine-tune config
GET    /api/v1/finetune/configs      # List configurations
GET    /api/v1/finetune/configs/{id} # Get configuration details

# Dashboard & Analytics
GET    /api/v1/dashboard/stats       # Platform statistics
GET    /api/v1/dashboard/chart-data  # Chart data for UI

# Image Generation
POST   /api/v1/image/generate        # Generate images with FLUX.1-dev
```

#### Fine-tune Service (Port: 8400)
```bash
# Fine-tuning Operations
POST   /finetune/start               # Start fine-tuning job
GET    /finetune/status/{task_id}    # Get training status
POST   /finetune/stop/{task_id}      # Stop training job
GET    /finetune/models              # List fine-tuned models
GET    /finetune/logs/{task_id}      # Get training logs

# Model Management
POST   /finetune/deploy/{model_id}   # Deploy model to Ollama
GET    /finetune/adapters            # List model adapters
DELETE /finetune/adapters/{id}       # Delete adapter
```

#### Workflow Engine (Port: 8100)
```bash
# Workflow Management
POST   /workflows                    # Create workflow
GET    /workflows                    # List workflows
GET    /workflows/{id}               # Get workflow details
PUT    /workflows/{id}               # Update workflow
DELETE /workflows/{id}               # Delete workflow

# Execution
POST   /workflows/{id}/execute       # Execute workflow
GET    /workflows/{id}/executions    # List executions
GET    /executions/{id}              # Get execution details
POST   /executions/{id}/stop         # Stop execution

# Real-time Updates
WebSocket /ws/workflows/{id}         # Real-time workflow updates
WebSocket /ws/executions/{id}        # Real-time execution updates

# Agent Management
POST   /agents                       # Create agent
GET    /agents                       # List agents
PUT    /agents/{id}                  # Update agent
DELETE /agents/{id}                  # Delete agent
```

#### n8n Workflow Service (Port: 5678)
```bash
# Standard n8n API endpoints
GET    /api/v1/workflows             # List workflows
POST   /api/v1/workflows             # Create workflow
GET    /api/v1/workflows/{id}        # Get workflow
PUT    /api/v1/workflows/{id}        # Update workflow
DELETE /api/v1/workflows/{id}        # Delete workflow

# Execution
POST   /api/v1/workflows/{id}/activate    # Activate workflow
POST   /api/v1/workflows/{id}/deactivate  # Deactivate workflow
GET    /api/v1/executions                 # List executions
GET    /api/v1/executions/{id}            # Get execution details
```

### Authentication

Most API endpoints require authentication. Set up API keys in your environment:

```bash
# Environment variables
PRODUCT_API_KEY=your_product_api_key
WORKFLOW_API_KEY=your_workflow_api_key
N8N_API_KEY=your_n8n_api_key
```

### WebSocket Connections

Real-time updates are available via WebSocket connections:

```javascript
// Connect to workflow execution updates
const ws = new WebSocket('ws://localhost:8100/ws/executions/execution-id');
ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    console.log('Execution update:', update);
};
```

---

## 🤝 Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Setup

```bash
# Clone and setup
git clone https://github.com/your-org/OnPremAI.git
cd OnPremAI

# Start databases only
docker compose up -d postgres-product postgres-workflow postgres-n8n redis qdrant

# Setup Python environment
conda create -n onpremai python=3.12
conda activate onpremai
pip install -r requirements.txt

# Setup frontend
cd frontend && npm install && npm run dev

# Run individual services for development
cd product_api && uvicorn app.main:app --reload --port 8200
cd workflow_engine && uvicorn src.main:app --reload --port 8100
cd fine_tune_service && uvicorn app.main:app --reload --port 8400
```

### Testing

```bash
# Backend tests
pytest tests/

# Frontend tests
cd frontend && npm test

# Integration tests
pytest integration_tests/

# End-to-end tests
pytest e2e_tests/
```

### Code Quality

- **Python**: Follow PEP 8, use Black for formatting, type hints required
- **JavaScript/React**: Follow ESLint configuration, use Prettier for formatting
- **Documentation**: Update README and API docs for any new features
- **Tests**: Maintain >80% test coverage for new code

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 🙏 Acknowledgments

OnPremAI is built on the shoulders of giants. We thank the following projects and communities:

- **[Apple MLX Team](https://github.com/ml-explore/mlx)**: For the excellent machine learning framework optimized for Apple Silicon
- **[Hugging Face](https://huggingface.co/)**: For model hosting, transformers library, and democratizing AI
- **[Ollama Team](https://ollama.ai/)**: For making local model serving accessible and efficient
- **[CrewAI](https://github.com/joaomdmoura/crewAI)**: For multi-agent workflow capabilities and intelligent orchestration
- **[n8n](https://n8n.io/)**: For the powerful workflow automation platform
- **[Qdrant](https://qdrant.tech/)**: For the high-performance vector database
- **[FastAPI](https://fastapi.tiangolo.com/)**: For the modern, fast web framework
- **[React Team](https://react.dev/)**: For the excellent frontend framework
- **[Docker](https://www.docker.com/)**: For containerization technology
- **[PostgreSQL](https://www.postgresql.org/)**: For the robust database system
- **[Redis](https://redis.io/)**: For caching and task queue capabilities
- **[Material-UI](https://mui.com/)**: For the beautiful React component library
- **[Open Source Community](https://opensource.org/)**: For various dependencies, tools, and inspiration

### Special Thanks

- **Enterprise AI Community**: For feedback and real-world use case validation
- **Privacy Advocates**: For emphasizing the importance of local AI deployment
- **Apple Silicon Developers**: For pushing the boundaries of on-device AI performance
- **Contributors**: Everyone who has contributed code, documentation, bug reports, and feature requests

---

## 📞 Support & Community

- **Documentation**: [Full documentation](https://docs.onpremai.com) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/your-org/OnPremAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/OnPremAI/discussions)
- **Discord**: [OnPremAI Community](https://discord.gg/onpremai) (coming soon)

---

*Built with ❤️ for enterprises who value data privacy and AI innovation*
