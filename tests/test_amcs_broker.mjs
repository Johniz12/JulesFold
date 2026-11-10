import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { HostEventBroker } = require('../electron/eventBroker.cjs');

test('Host Event Broker - publish, subscribe, and multi-subscriber delivery', () => {
  const broker = new HostEventBroker();
  const receivedA = [];
  const receivedB = [];

  const subIdA = broker.subscribe('demo-a', 101, 'timer.tick', (data) => {
    receivedA.push(data);
  });

  const subIdB = broker.subscribe('demo-b', 102, 'timer.tick', (data) => {
    receivedB.push(data);
  });

  assert.strictEqual(broker.getTopicSubscriberCount('timer.tick'), 2);

  const res = broker.publish('tempoflow', 'timer.tick', { seconds: 25 });
  assert.strictEqual(res.deliveredCount, 2);
  assert.strictEqual(res.errorCount, 0);

  assert.strictEqual(receivedA.length, 1);
  assert.strictEqual(receivedA[0].sourceModuleId, 'tempoflow');
  assert.strictEqual(receivedA[0].payload.seconds, 25);

  assert.strictEqual(receivedB.length, 1);
  assert.strictEqual(receivedB[0].payload.seconds, 25);

  broker.unsubscribe(subIdA);
  assert.strictEqual(broker.getTopicSubscriberCount('timer.tick'), 1);

  broker.publish('tempoflow', 'timer.tick', { seconds: 24 });
  assert.strictEqual(receivedA.length, 1);
  assert.strictEqual(receivedB.length, 2);

  broker.removeSubscriber(102);
  assert.strictEqual(broker.getTopicSubscriberCount('timer.tick'), 0);
});

test('Host Event Broker - delivery error isolation does not crash host', () => {
  const broker = new HostEventBroker();
  const receivedGood = [];

  broker.subscribe('demo-broken', 201, 'demo.error-test', () => {
    throw new Error('WebContents destroyed!');
  });

  broker.subscribe('demo-good', 202, 'demo.error-test', (env) => {
    receivedGood.push(env.payload);
  });

  const res = broker.publish('publisher', 'demo.error-test', { msg: 'safe' });
  assert.strictEqual(res.deliveredCount, 1);
  assert.strictEqual(res.errorCount, 1);
  assert.strictEqual(receivedGood.length, 1);
  assert.strictEqual(receivedGood[0].msg, 'safe');

  assert.strictEqual(broker.getTopicSubscriberCount('demo.error-test'), 1);
});
