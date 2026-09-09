import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building ROUTE-IQ Vanilla Web Application...');

const distDir = path.join(__dirname, 'dist');
const frontendDir = path.join(__dirname, 'frontend');

if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all frontend assets to dist/
fs.cpSync(frontendDir, distDir, { recursive: true });

// Also provide frontend directory alias inside dist
fs.cpSync(frontendDir, path.join(distDir, 'frontend'), { recursive: true });

// Copy server file to dist for standalone Node deployment
fs.copyFileSync(path.join(__dirname, 'server.js'), path.join(distDir, 'server.cjs'));

console.log('Build completed successfully: Pure Vanilla HTML/CSS/JS deployed to dist/.');
