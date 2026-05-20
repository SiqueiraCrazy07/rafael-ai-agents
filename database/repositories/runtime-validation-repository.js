const { BaseRepository } = require('./base-repository');

function normalizeRuntimeValidation(item) {
  const report = item.data || {};

  return {
    validationId: report.validationId || item.fileName,
    status: report.status || null,
    readiness: report.readiness || null,
    summary: report.summary || null,
    modulesValidated: report.modulesValidated || null,
    failedChecks: report.failedChecks || [],
    validatedChecks: report.validatedChecks || [],
    risks: report.risks || [],
    fallback: report.fallback || null,
    sourcePath: item.sourcePath,
    fileName: item.fileName,
    timestamp: report.timestamp || item.updatedAt
  };
}

class RuntimeValidationRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'runtime_validation',
      sourceDirs: ['memory/runtime-validation', 'runtime-data/runtime-validation'],
      normalizer: normalizeRuntimeValidation
    });
  }
}

module.exports = {
  RuntimeValidationRepository,
  normalizeRuntimeValidation
};
