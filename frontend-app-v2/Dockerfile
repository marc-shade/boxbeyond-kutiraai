# Build stage
FROM node:20 AS builder

# Define build arguments
ARG VITE_APP_VERSION
ARG GENERATE_SOURCEMAP
ARG PUBLIC_URL
ARG VITE_APP_BASE_NAME

# Set environment variables for build
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV GENERATE_SOURCEMAP=$GENERATE_SOURCEMAP
ENV PUBLIC_URL=$PUBLIC_URL
ENV VITE_APP_BASE_NAME=$VITE_APP_BASE_NAME

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install
COPY . ./
RUN yarn build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Install express and dependencies
RUN npm init -y && \
    npm install express compression

# Copy built files
COPY --from=builder /app/dist ./dist

# Create server.js
RUN echo 'const express = require("express");' > server.js && \
    echo 'const path = require("path");' >> server.js && \
    echo 'const compression = require("compression");' >> server.js && \
    echo 'const app = express();' >> server.js && \
    echo 'app.use(compression());' >> server.js && \
    echo 'app.use((req, res, next) => {' >> server.js && \
    echo '  if (req.path.endsWith(".js")) {' >> server.js && \
    echo '    res.set("Content-Type", "application/javascript; charset=utf-8");' >> server.js && \
    echo '  } else if (req.path.endsWith(".mjs")) {' >> server.js && \
    echo '    res.set("Content-Type", "application/javascript; charset=utf-8");' >> server.js && \
    echo '  } else if (req.path.endsWith(".css")) {' >> server.js && \
    echo '    res.set("Content-Type", "text/css; charset=utf-8");' >> server.js && \
    echo '  }' >> server.js && \
    echo '  next();' >> server.js && \
    echo '});' >> server.js && \
    echo 'app.use("/free", express.static("dist"));' >> server.js && \
    echo 'app.get("/free/*", (req, res) => {' >> server.js && \
    echo '  res.sendFile(path.join(__dirname, "dist/index.html"));' >> server.js && \
    echo '});' >> server.js && \
    echo 'app.listen(3000, "0.0.0.0", () => console.log("Server running on port 3000"));' >> server.js

EXPOSE 3000

CMD ["node", "server.js"]
