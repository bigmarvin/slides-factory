#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { createServer } from 'http';
import { program } from 'commander';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);

program
  .name('preview')
  .description('Preview slides in browser')
  .option('-p, --port <number>', 'Server port', '3000')
  .option('-f, --file <path>', 'HTML file to serve', 'output/slides.html')
  .option('--no-open', 'Do not open browser automatically')
  .parse();

const opts = program.opts();
const port = parseInt(opts.port) || 3000;
const htmlFile = path.resolve(opts.file);

if (!fs.existsSync(htmlFile)) {
  console.error(`Error: File not found: ${htmlFile}`);
  console.error('Run "npm run build" first to generate HTML slides.');
  process.exit(1);
}

// Simple static file server
const server = createServer((req, res) => {
  let filePath = htmlFile;

  // Handle requests for assets relative to output folder
  if (req.url !== '/' && req.url !== '/slides.html') {
    const outputDir = path.dirname(htmlFile);
    filePath = path.join(outputDir, req.url);
  }

  // Security: prevent path traversal
  if (!filePath.startsWith(projectRoot)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading file');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Preview server running at ${url}`);
  console.log('Press Ctrl+C to stop\n');
  console.log('Keyboard shortcuts in presentation:');
  console.log('  Arrow keys / Space  - Navigate slides');
  console.log('  F                   - Fullscreen');
  console.log('  S                   - Speaker notes');
  console.log('  O                   - Overview mode');
  console.log('  Esc                 - Exit fullscreen/overview');

  // Open browser if requested
  if (opts.open !== false) {
    const platform = process.platform;
    let cmd;

    if (platform === 'darwin') {
      cmd = 'open';
    } else if (platform === 'win32') {
      cmd = 'start';
    } else {
      cmd = 'xdg-open';
    }

    exec(`${cmd} ${url}`, (err) => {
      if (err) {
        console.log(`\nOpen ${url} in your browser to view slides`);
      }
    });
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down preview server...');
  server.close();
  process.exit(0);
});
