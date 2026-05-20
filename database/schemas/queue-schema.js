const QUEUE_SCHEMA = {
  collection: 'queue',
  idField: 'queueReportId',
  required: [
    'queueReportId',
    'queueItems',
    'retryItems',
    'protectedQueue',
    'metrics',
    'sourcePath'
  ],
  counters: [
    'totalQueueItems',
    'totalRetryItems',
    'protectedQueueCount'
  ]
};

module.exports = {
  QUEUE_SCHEMA
};
