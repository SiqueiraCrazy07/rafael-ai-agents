const { readJsonHistory } = require('./json-source-reader');

function mirrorRepository(repository, options = {}) {
  const limit = options.limit || 50;
  const mirrored = [];
  const readErrors = [];
  const insertErrors = [];
  const sources = [];
  const idempotency = {
    enabled: true,
    insertedRecords: 0,
    updatedRecords: 0,
    skippedDuplicates: 0,
    appendOnlyRecords: 0
  };

  for (const sourceDir of repository.sourceDirs) {
    const history = readJsonHistory(sourceDir, limit);
    sources.push({
      sourceDir: history.sourceDir,
      available: history.available,
      totalFiles: history.totalFiles || 0,
      fallback: history.fallback || null
    });
    readErrors.push(...history.readErrors);

    for (const item of history.items || []) {
      try {
        const normalized = repository.normalizer(item);
        const inserted = typeof repository.upsert === 'function'
          ? repository.upsert(normalized)
          : repository.insert(normalized);

        if (inserted.ok) {
          if (inserted.operation === 'skipped-duplicate') {
            idempotency.skippedDuplicates += 1;
          } else if (inserted.operation === 'updated') {
            idempotency.updatedRecords += 1;
          } else if (inserted.idempotent === false) {
            idempotency.appendOnlyRecords += 1;
          } else {
            idempotency.insertedRecords += 1;
          }

          mirrored.push({
            collection: repository.collection,
            id: normalized.eventId
              || normalized.decisionReportId
              || normalized.transitionReportId
              || normalized.validationId
              || normalized.auditId
              || normalized.machineId
              || normalized.queueReportId
              || item.fileName,
            operation: inserted.operation || 'inserted',
            idempotencyKey: inserted.idempotencyKey || null,
            dedupeKey: inserted.dedupeKey || null,
            recordHash: inserted.recordHash || null,
            sourcePath: item.sourcePath
          });
        } else {
          insertErrors.push({
            collection: repository.collection,
            sourcePath: item.sourcePath,
            fallback: inserted.fallback
          });
        }
      } catch (error) {
        insertErrors.push({
          collection: repository.collection,
          sourcePath: item.sourcePath,
          error: error.message
        });
      }
    }
  }

  return {
    collection: repository.collection,
    mirroredCount: mirrored.length,
    mirrored,
    sources,
    readErrors,
    insertErrors,
    idempotency
  };
}

function mirrorAll(repositories, options = {}) {
  const results = Object.entries(repositories).map(([name, repository]) => ({
    name,
    ...mirrorRepository(repository, options)
  }));

  return {
    status: results.every((result) => result.insertErrors.length === 0) ? 'mirrored' : 'mirrored-with-errors',
    mirrorMode: true,
    destructiveActions: false,
    idempotency: results.reduce((totals, result) => ({
      enabled: totals.enabled && result.idempotency.enabled,
      insertedRecords: totals.insertedRecords + result.idempotency.insertedRecords,
      updatedRecords: totals.updatedRecords + result.idempotency.updatedRecords,
      skippedDuplicates: totals.skippedDuplicates + result.idempotency.skippedDuplicates,
      appendOnlyRecords: totals.appendOnlyRecords + result.idempotency.appendOnlyRecords
    }), {
      enabled: true,
      insertedRecords: 0,
      updatedRecords: 0,
      skippedDuplicates: 0,
      appendOnlyRecords: 0
    }),
    collections: results
  };
}

module.exports = {
  mirrorAll,
  mirrorRepository
};
