class HostEventBroker {
  constructor() {
    this.topics = new Map();
    this.subIdCounter = 1;
  }

  subscribe(moduleId, webContentsId, eventName, deliverFn) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('Event name must be a non-empty string');
    }
    if (typeof deliverFn !== 'function') {
      throw new Error('Deliver function must be provided');
    }

    const subId = `sub_${this.subIdCounter++}_${moduleId}`;
    if (!this.topics.has(eventName)) {
      this.topics.set(eventName, new Map());
    }

    this.topics.get(eventName).set(subId, {
      subId,
      moduleId,
      webContentsId,
      deliverFn,
    });

    return subId;
  }

  unsubscribe(subscriptionId) {
    for (const [eventName, subs] of this.topics.entries()) {
      if (subs.has(subscriptionId)) {
        subs.delete(subscriptionId);
        if (subs.size === 0) {
          this.topics.delete(eventName);
        }
        return true;
      }
    }
    return false;
  }

  removeSubscriber(webContentsId) {
    for (const [eventName, subs] of this.topics.entries()) {
      for (const [subId, sub] of subs.entries()) {
        if (sub.webContentsId === webContentsId) {
          subs.delete(subId);
        }
      }
      if (subs.size === 0) {
        this.topics.delete(eventName);
      }
    }
  }

  publish(originatingModuleId, eventName, payload) {
    if (!eventName || typeof eventName !== 'string') {
      throw new Error('Event name must be a non-empty string');
    }

    const subs = this.topics.get(eventName);
    if (!subs || subs.size === 0) {
      return { deliveredCount: 0, errorCount: 0 };
    }

    let deliveredCount = 0;
    let errorCount = 0;

    const eventEnvelope = {
      event: eventName,
      sourceModuleId: originatingModuleId,
      timestamp: Date.now(),
      payload,
    };

    for (const [subId, sub] of Array.from(subs.entries())) {
      try {
        sub.deliverFn(eventEnvelope);
        deliveredCount++;
      } catch (err) {
        errorCount++;
        subs.delete(subId);
      }
    }

    if (subs.size === 0) {
      this.topics.delete(eventName);
    }

    return { deliveredCount, errorCount };
  }

  getTopicSubscriberCount(eventName) {
    return this.topics.has(eventName) ? this.topics.get(eventName).size : 0;
  }
}

module.exports = {
  HostEventBroker,
};
