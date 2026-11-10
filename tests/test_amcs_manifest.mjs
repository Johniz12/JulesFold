import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateManifest } = require('../electron/manifestValidator.cjs');

test('AMCS Manifest Validator - valid manifest passes', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amcs-val-test-'));
  const entryFile = path.join(tmpDir, 'index.html');
  fs.writeFileSync(entryFile, '<h1>Hello</h1>');

  const validManifest = {
    id: 'demo-test',
    name: 'Demo Test',
    version: '1.0.0',
    amcsVersion: '1.0',
    description: 'A test module',
    entry: 'index.html',
    runtime: 'web',
    window: {
      width: 800,
      height: 600,
      minWidth: 400,
      minHeight: 300,
      resizable: true,
    },
    capabilities: ['notifications', 'events'],
    lifecycle: {
      close: 'keep-alive',
      hide: 'keep-alive',
    },
  };

  const result = validateManifest(validManifest, tmpDir);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('AMCS Manifest Validator - rejects missing required fields', () => {
  const incomplete = {
    id: 'demo-test',
    name: 'Demo Test',
  };
  const result = validateManifest(incomplete);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Missing required field: "version"')));
  assert.ok(result.errors.some((e) => e.includes('Missing required field: "entry"')));
});

test('AMCS Manifest Validator - rejects path traversal escaping module directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amcs-sec-test-'));
  const traversalManifest = {
    id: 'exploit-test',
    name: 'Exploit Test',
    version: '1.0.0',
    amcsVersion: '1.0',
    description: 'Path traversal test',
    entry: '../../etc/passwd',
    runtime: 'web',
    window: { width: 800, height: 600 },
    capabilities: ['events'],
    lifecycle: { close: 'terminate', hide: 'keep-alive' },
  };

  const result = validateManifest(traversalManifest, tmpDir);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Security violation: entry path')));

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('AMCS Manifest Validator - rejects unsupported AMCS versions and capabilities', () => {
  const badVersions = {
    id: 'bad-mod',
    name: 'Bad Mod',
    version: '1.0.0',
    amcsVersion: '99.0',
    description: 'Bad version',
    entry: 'index.html',
    runtime: 'web',
    window: { width: 800, height: 600 },
    capabilities: ['root-filesystem', 'events'],
    lifecycle: { close: 'keep-alive', hide: 'keep-alive' },
  };

  const result = validateManifest(badVersions);
  assert.strictEqual(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Unsupported amcsVersion')));
  assert.ok(result.errors.some((e) => e.includes('Unsupported capability requested: "root-filesystem"')));
});
