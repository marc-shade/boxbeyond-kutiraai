import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import fs from 'fs/promises';

export default defineConfig({
  plugins: [react({
    // Disable full page reload on HMR updates
    fastRefresh: true,
    // Only update changed components, not the whole page
    include: '**/*.{jsx,tsx}',
  }), jsconfigPaths()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  define: {
    global: 'window'
  },
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: path.join(process.cwd(), 'node_modules/$1')
      },
      {
        find: /^src(.+)/,
        replacement: path.join(process.cwd(), 'src/$1')
      }
    ]
  },
  server: {
    open: false,
    port: 3101,
    host: true,
    fs: {
      allow: ['/Users/marc/Projects/', '/Volumes/FILES/code/', '/Users/marc/Desktop/']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    },
    hmr: {
      // Configure HMR to only update modules, not reload the page
      overlay: true,
      protocol: 'ws',
      // Prevent full page reloads
      timeout: 30000
    }
  },
  preview: {
    open: false,
    port: 3100,
    host: true
  }
});
