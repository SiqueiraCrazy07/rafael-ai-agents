const { envelopeSchema } = require('./runtime-response-schemas');

const DASHBOARD_RESPONSE_SCHEMAS = {
  dashboardSummary: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'summary'
  ]),
  dashboardMetrics: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'metrics'
  ]),
  dashboardTimelines: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'returned',
    'timelines'
  ]),
  dashboardTraces: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'returned',
    'traces'
  ]),
  dashboardProblematicWorkflows: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'problematicWorkflows'
  ]),
  dashboardWorkerHealth: envelopeSchema([
    'source',
    'fallbackUsed',
    'readErrors',
    'runtimeFlags',
    'generatedAt',
    'workers'
  ])
};

module.exports = {
  DASHBOARD_RESPONSE_SCHEMAS
};
