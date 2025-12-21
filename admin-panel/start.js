#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

// Detect platform
const isWindows = os.platform() === 'win32';

// Set environment variables
const env = {
  ...process.env,
  PORT: '3001'
};

// Start the React app
const child = spawn(
  isWindows ? 'npm.cmd' : 'npm',
  ['start'],
  {
    env,
    stdio: 'inherit',
    shell: true
  }
);

child.on('error', (error) => {
  console.error('Failed to start admin panel:', error);
});

child.on('close', (code) => {
  console.log(`Admin panel process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
