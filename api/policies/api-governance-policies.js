const READONLY_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function readonlyOnlyPolicy(req) {
  return {
    allowed: READONLY_METHODS.includes(req.method),
    policy: 'readonly-only',
    reason: READONLY_METHODS.includes(req.method) ? null : 'method-not-readonly'
  };
}

function denyDestructiveActionsPolicy(req) {
  const destructiveMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  return {
    allowed: !destructiveMethods.includes(req.method),
    policy: 'deny-destructive-actions',
    reason: destructiveMethods.includes(req.method) ? 'destructive-method-denied' : null
  };
}

function safeRequestPolicy(req) {
  const contentLength = Number.parseInt(req.headers && req.headers['content-length'], 10);
  const oversized = Number.isFinite(contentLength) && contentLength > 0;

  return {
    allowed: !oversized,
    policy: 'safe-request-policy',
    reason: oversized ? 'readonly-request-body-denied' : null
  };
}

function requestTracingPolicy(req) {
  return {
    allowed: Boolean(req.requestId),
    policy: 'request-tracing-policy',
    reason: req.requestId ? null : 'missing-request-id'
  };
}

function evaluateGovernancePolicies(req) {
  const evaluations = [
    readonlyOnlyPolicy(req),
    denyDestructiveActionsPolicy(req),
    safeRequestPolicy(req),
    requestTracingPolicy(req)
  ];

  return {
    allowed: evaluations.every((evaluation) => evaluation.allowed),
    evaluations,
    denied: evaluations.filter((evaluation) => !evaluation.allowed)
  };
}

function governancePolicyMiddleware(req, res, next) {
  const apiConfig = req.app && req.app.locals && req.app.locals.api;
  const flags = apiConfig && apiConfig.runtimeFlags
    ? apiConfig.runtimeFlags
    : { readonlyMode: true, safeMode: true };

  if (!flags.readonlyMode && !flags.safeMode) {
    return next();
  }

  const evaluation = evaluateGovernancePolicies(req);
  req.governance = req.governance || {};
  req.governance.policies = evaluation;

  if (evaluation.allowed) {
    return next();
  }

  return res.safe({
    governance: {
      allowed: false,
      denied: evaluation.denied
    }
  }, {
    status: 'error',
    statusCode: 403,
    fallback: {
      safeMode: true,
      reason: 'api-governance-policy-denied',
      readonlyDeny: true
    },
    skipResponseValidation: true
  });
}

module.exports = {
  denyDestructiveActionsPolicy,
  evaluateGovernancePolicies,
  governancePolicyMiddleware,
  readonlyOnlyPolicy,
  requestTracingPolicy,
  safeRequestPolicy
};
