const { BaseRepository } = require('./base-repository');

function normalizeTransitionReport(item) {
  const report = item.data || {};

  return {
    transitionReportId: report.transitionReportId || report.reportId || item.fileName,
    status: report.status || null,
    consumedDecisions: report.consumedDecisions || [],
    appliedTransitions: report.appliedTransitions || [],
    blockedTransitions: report.blockedTransitions || [],
    ignoredDecisions: report.ignoredDecisions || [],
    fallback: report.fallback || null,
    sourcePath: item.sourcePath,
    fileName: item.fileName,
    timestamp: report.timestamp || item.updatedAt
  };
}

class TransitionsRepository extends BaseRepository {
  constructor(adapter) {
    super({
      adapter,
      collection: 'transitions',
      sourceDirs: ['memory/state-transitions', 'runtime-data/state-transitions'],
      normalizer: normalizeTransitionReport
    });
  }
}

module.exports = {
  TransitionsRepository,
  normalizeTransitionReport
};
