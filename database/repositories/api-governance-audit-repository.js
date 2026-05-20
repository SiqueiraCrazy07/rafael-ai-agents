const { BaseRepository } = require('./base-repository');

function normalizeApiGovernanceAudit(item) {
  const audit = item.data || {};

  return {
    auditId: audit.auditId || audit.requestId || item.fileName,
    requestId: audit.requestId || null,
    clientId: audit.clientId || null,
    route: audit.route || null,
    method: audit.method || null,
    timestamp: audit.timestamp || item.updatedAt,
    status: audit.status || null,
    correlationId: audit.correlationId || null,
    auth: audit.auth || null,
    governance: audit.governance || null,
    rateLimit: audit.rateLimit || null,
    safety: audit.safety || null,
    sourcePath: item.sourcePath,
    fileName: item.fileName
  };
}

class ApiGovernanceAuditRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'api_governance_audit',
      sourceDirs: ['memory/api-governance', 'runtime-data/api-governance'],
      normalizer: normalizeApiGovernanceAudit
    });
  }
}

module.exports = {
  ApiGovernanceAuditRepository,
  normalizeApiGovernanceAudit
};
