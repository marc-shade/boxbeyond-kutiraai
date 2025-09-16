#!/usr/bin/env node

import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  try {
    const server = await createServer({
      configFile: join(__dirname, 'vite.config.mjs'),
      root: __dirname,
      server: {
        port: 3001,
        host: true,
        open: true
      }
    });
    
    await server.listen();
    
    console.log('\n  KutiraAI Frontend Server Started!\n');
    console.log(`  > Local:    http://localhost:3001`);
    console.log(`  > Network:  http://localhost:3001`);
    console.log('\n  Press Ctrl+C to stop\n');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();