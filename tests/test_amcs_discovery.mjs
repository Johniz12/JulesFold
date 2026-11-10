import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ModuleDiscoveryEngine } = require('../electron/moduleDiscovery.cjs');

test('Module Discovery Engine - discovers valid modules, ignores invalid ones safely', () => {
  const rootTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amcs-disc-test-'));

  const mod1Dir = path.join(rootTmp, 'mod-one');
  fs.mkdirSync(mod1Dir);
  fs.writeFileSync(path.join(mod1Dir, 'index.html'), '<html>One</html>');
  fs.writeFileSync(
    path.join(mod1Dir, 'alfred.module.json'),
    JSON.stringify({
      id: 'mod-one',
      name: 'Module One',
      version: '1.0.0',
      amcsVersion: '1.0',
      description: 'First test module',
      entry: 'index.html',
      runtime: 'web',
      window: { width: 600, height: 400 },
      capabilities: ['events'],
      lifecycle: { close: 'keep-alive', hide: 'keep-alive' },
    })
  );

  const mod2Dir = path.join(rootTmp, 'mod-corrupt');
  fs.mkdirSync(mod2Dir);
  fs.writeFileSync(path.join(mod2Dir, 'alfred.module.json'), '{ broken json ...');

  const mod3Dir = path.join(rootTmp, 'mod-dup');
  fs.mkdirSync(mod3Dir);
  fs.writeFileSync(path.join(mod3Dir, 'index.html'), '<html>Duplicate</html>');
  fs.writeFileSync(
    path.join(mod3Dir, 'alfred.module.json'),
    JSON.stringify({
      id: 'mod-one',
      name: 'Module Duplicate',
      version: '1.0.0',
      amcsVersion: '1.0',
      description: 'Duplicate ID test',
      entry: 'index.html',
      runtime: 'web',
      window: { width: 600, height: 400 },
      capabilities: ['events'],
      lifecycle: { close: 'terminate', hide: 'keep-alive' },
    })
  );

  const engine = new ModuleDiscoveryEngine(rootTmp);
  const discovered = engine.discoverModules();

  assert.strictEqual(discovered.length, 1);
  assert.strictEqual(discovered[0].id, 'mod-one');
  assert.ok(discovered[0].name === 'Module One' || discovered[0].name === 'Module Duplicate');

  const errors = engine.getDiscoveryErrors();
  assert.strictEqual(errors.length, 2);
  assert.ok(errors.some((e) => e.dir === 'mod-corrupt'));
  assert.ok(errors.some((e) => e.error.includes('Duplicate module ID "mod-one"')));

  fs.rmSync(rootTmp, { recursive: true, force: true });
});
