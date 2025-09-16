# KutiraAI Installation Guide

## Overview
KutiraAI is a modern web-based dashboard application built with React, Vite, and Material-UI components. It provides a comprehensive interface for managing AI models, datasets, and workflows.

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (comes with Node.js)
- **Git**: For version control (optional)

### System Requirements
- **Operating System**: macOS, Linux, or Windows
- **RAM**: Minimum 4GB, recommended 8GB+
- **Disk Space**: At least 1GB free space

## Installation Steps

### 1. Clone or Copy the Repository

If you have the source files, ensure they're in your desired location:
```bash
# The KutiraAI project is located at:
cd /Volumes/FILES/code/kutiraai
```

### 2. Install Dependencies

Navigate to the project directory and install the required packages:
```bash
cd /Volumes/FILES/code/kutiraai
npm install
```

This will install all dependencies listed in `package.json`.

### 3. Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory if it doesn't exist:

```bash
# Create .env file
touch .env

# Add the following configuration (adjust as needed):
echo "VITE_API_URL=http://localhost:3001" >> .env
echo "VITE_APP_NAME=KutiraAI" >> .env
```

## Running the Application

### Development Mode

To run the application in development mode with hot-reload:

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API Server: http://localhost:3001

### Production Build

To create an optimized production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality
- `npm run api-server` - Start the API backend server
- `npm run start-dev` - Start both frontend and backend concurrently

## Project Structure

```
kutiraai/
├── src/                    # Source code
│   ├── components/        # React components
│   ├── contexts/         # React contexts
│   ├── data/            # Data files and utilities
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API and service integrations
│   ├── styles/          # CSS and styling files
│   ├── utils/           # Utility functions
│   └── main.jsx         # Application entry point
├── public/              # Static assets
├── node_modules/        # Dependencies (generated)
├── dist/               # Production build (generated)
├── package.json        # Project configuration
├── vite.config.mjs     # Vite configuration
├── api-server.js       # Backend API server
└── backend-mock.js     # Mock backend for testing
```

## Features

### Dashboard Components
- **Model Management**: View and manage AI models
- **Dataset Browser**: Browse and manage datasets
- **Workflow Editor**: Create and edit workflows
- **Metrics Dashboard**: Monitor system performance
- **Settings Panel**: Configure application settings

### API Integration
The application includes a full REST API backend (`api-server.js`) that provides:
- Authentication and authorization
- Model management endpoints
- Dataset operations
- Workflow execution
- Real-time metrics

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 5173 (frontend)
   lsof -ti:5173 | xargs kill -9

   # Kill process on port 3001 (backend)
   lsof -ti:3001 | xargs kill -9
   ```

2. **Node Modules Issues**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Permission Errors**
   ```bash
   # Fix permissions
   sudo chown -R $(whoami) /Volumes/FILES/code/kutiraai
   ```

4. **Build Errors**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite
   npm run build
   ```

## Testing

### Run Test Suite
```bash
# Run the full test suite
node full-test-suite.js

# Verify dashboard functionality
node verify-dashboard.js
```

## Docker Deployment

A Dockerfile is included for containerized deployment:

```bash
# Build Docker image
docker build -t kutiraai .

# Run container
docker run -p 5173:5173 -p 3001:3001 kutiraai
```

## Development Tools

### ESLint Configuration
The project uses ESLint for code quality. Configuration is in `.eslintrc.js`.

### Vite Configuration
Vite configuration is in `vite.config.mjs` with optimized settings for React development.

## Support and Documentation

### Additional Documentation
- `DASHBOARD_IMPLEMENTATION_SUMMARY.md` - Dashboard implementation details
- `REAL_FUNCTIONALITY_IMPLEMENTATION_COMPLETE.md` - Feature implementation guide
- `HARDCODED_ELEMENTS_AUDIT.md` - Configuration elements audit

### Getting Help
For issues or questions:
1. Check the troubleshooting section above
2. Review the additional documentation files
3. Check the console for error messages
4. Verify all dependencies are properly installed

## License

This project is licensed under the terms specified in the LICENSE file.

## Version Information

- **Current Version**: 1.0.0
- **Last Updated**: September 2024
- **Node Version**: 18+
- **React Version**: 18.2.0
- **Vite Version**: 4.4.5