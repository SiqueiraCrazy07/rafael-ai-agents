const { BaseRepository } = require('./base-repository');

function normalizeDecisionReport(item) {
  const report = item.data || {};

  return {
    decisionReportId: report.decisionReportId || report.reportId || report.id || item.fileName,
    status: report.status || null,
    source: report.source || 'runtime-decision-engine',
    decisions: report.decisions || [],
    coordination: report.coordination || null,
    fallback: report.fallback || null,
    readErrors: report.readErrors || [],
    sourcePath: item.sourcePath,
    fileName: item.fileName,
    timestamp: report.timestamp || item.updatedAt
  };
}

class DecisionsRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'decisions',
      sourceDirs: ['memory/decisions', 'runtime-data/decisions'],
      normalizer: normalizeDecisionReport
    });
  }
}

module.exports = {
  DecisionsRepository,
  normalizeDecisionReport
};
