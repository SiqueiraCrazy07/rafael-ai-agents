class ConcurrencyController {
  constructor({ maxConcurrentExecutions = 2 } = {}) {
    this.maxConcurrentExecutions = maxConcurrentExecutions;
    this.running = 0;
  }

  canStart() {
    return this.running < this.maxConcurrentExecutions;
  }

  start() {
    if (!this.canStart()) {
      return false;
    }

    this.running += 1;
    return true;
  }

  finish() {
    this.running = Math.max(0, this.running - 1);
  }

  snapshot() {
    return {
      maxConcurrentExecutions: this.maxConcurrentExecutions,
      running: this.running,
      available: Math.max(0, this.maxConcurrentExecutions - this.running)
    };
  }
}

module.exports = {
  ConcurrencyController
};
