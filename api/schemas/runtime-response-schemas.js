const BASE_ENVELOPE_REQUIRED = [
  'ok',
  'status',
  'requestId',
  'timestamp',
  'api',
  'data',
  'meta',
  'fallback'
];

function envelopeSchema(dataRequired) {
  return {
    type: 'object',
    required: BASE_ENVELOPE_REQUIRED,
    dataRequired
  };
}

const RUNTIME_RESPONSE_SCHEMAS = {
  health: envelopeSchema(['service', 'status', 'phase', 'contract', 'safety']),
  runtimeStatus: envelopeSchema(['phase', 'apiReadiness', 'runtimeReadiness', 'sources', 'safety']),
  queueStatus: envelopeSchema([
    'available',
    'sourcePath',
    'fileName',
    'updatedAt',
    'metrics',
    'queue',
    'retryQueue',
    'enforcementIntegration',
    'readErrors'
  ]),
  events: envelopeSchema(['available', 'sourceDir', 'totalFiles', 'returned', 'events', 'readErrors']),
  decisions: envelopeSchema(['available', 'sourceDir', 'totalFiles', 'returned', 'reports', 'readErrors']),
  validation: envelopeSchema(['available', 'sourcePath', 'fileName', 'updatedAt', 'validation', 'readErrors'])
};

module.exports = {
  BASE_ENVELOPE_REQUIRED,
  envelopeSchema,
  RUNTIME_RESPONSE_SCHEMAS
};
