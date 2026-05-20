class TransactionManager {
  constructor(adapter, options = {}) {
    this.adapter = adapter;
    this.timeoutMs = options.timeoutMs || 2000;
    this.maxRetries = options.maxRetries || 1;
  }

  beginTransaction(transactionId = `tx_${Date.now()}`) {
    return this.adapter.beginTransaction(transactionId);
  }

  commit(transactionId, reason) {
    return this.adapter.commit(transactionId, reason);
  }

  rollback(transactionId, reason) {
    return this.adapter.rollback(transactionId, reason);
  }

  async runInTransaction(work, options = {}) {
    const transactionId = options.transactionId || `tx_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    const timeoutMs = options.timeoutMs || this.timeoutMs;
    const started = this.beginTransaction(transactionId);
    if (!started.ok) {
      return {
        ok: false,
        transactionId,
        status: "not-started",
        fallback: started.fallback
      };
    }

    let timeoutHandle = null;
    const timeout = new Promise((resolve) => {
      timeoutHandle = setTimeout(() => resolve({
        timedOut: true,
        error: new Error(`transaction timed out after ${timeoutMs}ms`)
      }), timeoutMs);
    });

    try {
      const result = await Promise.race([
        Promise.resolve().then(() => work({ transactionId })),
        timeout
      ]);
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (result && result.timedOut) {
        const rollback = this.rollback(transactionId, "transaction-timeout");
        return {
          ok: false,
          transactionId,
          status: "timeout-rolled-back",
          rollback,
          fallback: {
            safeMode: true,
            reason: result.error.message
          }
        };
      }
      const commit = this.commit(transactionId, options.reason || "transaction-completed");
      return {
        ok: true,
        transactionId,
        status: "committed",
        result,
        commit
      };
    } catch (error) {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      const rollback = this.rollback(transactionId, error.message);
      return {
        ok: false,
        transactionId,
        status: "rolled-back",
        error: error.message,
        rollback,
        fallback: {
          safeMode: true,
          reason: "transaction-error-rolled-back"
        }
      };
    }
  }
}

module.exports = {
  TransactionManager
};
