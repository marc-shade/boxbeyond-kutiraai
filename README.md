# Instruction to setup the platform

Below document guides through the steps to setup the platform, since some of the service rely on the underlying OS resources
not all resources can be packaged to be installed

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Features](#features)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Prerequisites

Make sure you have the following installed on your machine:
- [Ollama](https://ollama.ai/download)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Miniconda](https://docs.conda.io/en/latest/miniconda.html)

### Steps

1. Clone the Repository
   ```bash
   git clone https://github.com/daniel-manickam/product-platform_0.0.1.git

2. Start the platform services
   ```bash
   cd platform_services
   docker compose up -d
   
3. Setup virtual environment for fine tune process
   ```bash
   cd fine_tune_package
   conda create -n doc_processor python=3.11
   conda activate doc_processor
   pip install -r requirements.txt
   python3 app.py
   
4. Start the celery process
   ```bash
   cd fine_tune_package
   celery -A celery_tasks worker --loglevel=info
   
5. Launch Frontend Application
   ```bash
   cd frontend-app
   npm start

