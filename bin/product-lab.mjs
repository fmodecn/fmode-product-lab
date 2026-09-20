#!/usr/bin/env node
// fmode-product-lab CLI 入口
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = resolve(__dirname, '..', 'scripts', 'product-lab.mjs');
const args = process.argv.slice(2);

const r = spawnSync(process.execPath, [script, ...args], { stdio: 'inherit' });
process.exit(r.status ?? 0);
