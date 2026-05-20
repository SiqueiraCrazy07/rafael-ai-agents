const { persistApiReport } = require('../server/file-store');

function getCorrelationId(req) {
  return (
    (req.query && req.query.correlationId)
    || (req.validatedQuery && req.validatedQuery.correlationId)
    || (req.headers && (req.headers['x-correlation-id'] || req.headers['X-Correlation-Id']))
    || null
  );
}

function buildAuditRecord(req, res) {
  const client = req.auth && req.auth.client;

  return {
    requestId: req.requestId,
    clientId: client ? client.clientId : null,
    route: req.originalUrl || req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    status: res.statusCode,
    correlationId: getCorrelationId(req),
    auth: {
      authenticated: Boolean(req.auth && req.auth.authenticated),
      reason: req.auth && req.auth.reason ? req.auth.reason : null
    },
    governance: req.governance && req.governance.policies
      ? {
          allowed: req.governance.policies.allowed,
          denied: req.governance.policies.denied
        }
      : null,
    rateLimit: req.rateLimit || null,
    safety: {
      readonly: true,
      destructiveActions: false
    }
  };
}

function persistAuditRecord(record) {
  return persistApiReport(`audit-${record.requestId || Date.now()}`, record, {
    directoryName: 'api-governance'
  });
}

function auditTrailMiddleware(req, res, next) {
  res.on('finish', () => {
    try {
      const record = buildAuditRecord(req, res);
      const persistence = persistAuditRecord(record);
      req.auditTrail = {
        record,
        persistence
      };
    } catch (error) {
      req.auditTrail = {
        record: null,
        persistence: null,
        error: error.message
      };
    }
  });

  next();
}

module.exports = {
  auditTrailMiddleware,
  buildAuditRecord,
  persistAuditRecord
};
