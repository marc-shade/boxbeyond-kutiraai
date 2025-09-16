const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

// Proxy WebSocket connections
app.use('/ws', createProxyMiddleware({
  target: 'ws://localhost:8000',
  changeOrigin: true,
  ws: true
}));

// Serve static files from src directory (development mode)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'src')));

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`
  🚀 KutiraAI Frontend Server Started!
  
  > Local:    http://localhost:${PORT}
  > Backend:  http://localhost:8000
  > WebSocket: ws://localhost:8000/ws/mcp
  
  Press Ctrl+C to stop
  `);
});