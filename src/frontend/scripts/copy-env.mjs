import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const source = path.join(projectRoot, 'env.json');
const destination = path.join(projectRoot, 'dist', 'env.json');

mkdirSync(path.dirname(destination), { recursive: true });
copyFileSync(source, destination);
