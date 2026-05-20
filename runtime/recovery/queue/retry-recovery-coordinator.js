class RetryRecoveryCoordinator {
  coordinate({ requeueResults, executionResults }) {
    return {
      coordinatedAt: new Date().toISOString(),
      requeued: requeueResults.length,
      reexecuted: executionResults.filter(Boolean).length,
      completed: executionResults.filter((result) => result?.status === "completed").length,
      failed: executionResults.filter((result) => result?.status === "failed").length,
      duplicateBlocked: executionResults.filter((result) => result?.duplicateBlocked).length
    };
  }
}

module.exports = {
  RetryRecoveryCoordinator
};
