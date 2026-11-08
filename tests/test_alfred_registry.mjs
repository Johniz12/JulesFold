import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAllModules,
  getModuleById,
  validateModuleContract,
  MODULE_REGISTRY,
} from '../src/modules/registry.js';

test('ALFRED Module Registry - initial registry contents', () => {
  const modules = getAllModules();
  assert.ok(Array.isArray(modules), 'Modules must be an array');
  assert.ok(modules.length >= 1, 'Registry should have at least 1 module');

  const demoClock = getModuleById('demo-clock');
  assert.ok(demoClock, 'demo-clock module must be found');
  assert.strictEqual(demoClock.id, 'demo-clock');
  assert.strictEqual(demoClock.name, 'Precision Chrono');
  assert.strictEqual(demoClock.componentPath, './demo-clock/DemoClock.jsx');
  assert.strictEqual(demoClock.defaultActive, true);
  assert.strictEqual(demoClock.canBeWidget, true);
});

test('ALFRED Module Registry - contract validator checks', () => {
  // Valid module
  const valid = validateModuleContract({
    id: 'test-widget',
    name: 'Test Widget',
    description: 'A mock module',
    component: () => {},
  });
  assert.strictEqual(valid.valid, true);

  // Missing id
  const missingId = validateModuleContract({
    name: 'Test',
    description: 'Missing id',
    component: () => {},
  });
  assert.strictEqual(missingId.valid, false);
  assert.match(missingId.error, /Missing required module field: "id"/);

  // Invalid id characters
  const invalidId = validateModuleContract({
    id: 'INVALID ID!',
    name: 'Test',
    description: 'Bad ID',
    component: () => {},
  });
  assert.strictEqual(invalidId.valid, false);
  assert.match(invalidId.error, /Module id must be lowercase alphanumeric/);

  // Validate all existing registered modules
  for (const mod of MODULE_REGISTRY) {
    const res = validateModuleContract(mod);
    assert.strictEqual(res.valid, true, `Module ${mod.id} failed contract validation`);
  }
});
