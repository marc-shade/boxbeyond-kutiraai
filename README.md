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

1. Clone the repository:
   
   ```bash
   git clone https://github.com/yourusername/ai-document-processor.git
   cd ai-document-processor

Navigate into the project directory:
cd project-name
Install dependencies:
npm install
If you need to set up environment variables, create a .env file based on .env.example:
cp .env.example .env
Usage

To run the project locally:

Start the development server:
npm start
Open your browser and go to http://localhost:3000 to see the app in action.