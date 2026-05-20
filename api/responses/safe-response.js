const { validateResponse } = require('../validators/response-validator');

function buildSafeResponse({ requestId, data, status = 'ok', meta = {}, fallback = null }) {
  const readonly = data
    && data.runtimeFlags
    && typeof data.runtimeFlags.API_READONLY_MODE === 'boolean'
    ? data.runtimeFlags.API_READONLY_MODE
    : true;
  const apiRuntimeFields = data && typeof data === 'object'
    ? {
        runtimeFlags: data.runtimeFlags || null,
        databaseReadEnabled: data.databaseReadEnabled,
        jsonFallbackEnabled: data.jsonFallbackEnabled,
        safeModeEnabled: data.safeModeEnabled
      }
    : {};

  return {
    ok: status === 'ok',
    status,
    requestId,
    timestamp: new Date().toISOString(),
    api: {
      version: 'v1',
      readonly,
      destructiveActions: false,
      ...apiRuntimeFields
    },
    data,
    meta,
    fallback
  };
}

function sendSafeResponse(res, payload, options = {}) {
  const statusCode = options.statusCode || 200;
  const responseSchema = res.locals && res.locals.responseSchema;
  const envelope = buildSafeResponse({
    requestId: res.locals && res.locals.requestId,
    data: payload,
    status: options.status || 'ok',
    meta: options.meta || {},
    fallback: options.fallback || null
  });

  if (responseSchema && !options.skipResponseValidation) {
    const validation = validateResponse(responseSchema, envelope);

    if (!validation.valid) {
      const invalidEnvelope = buildSafeResponse({
        requestId: res.locals && res.locals.requestId,
        data: {
          validation: {
            valid: false,
            schema: responseSchema,
            errors: validation.errors
          }
        },
        status: 'error',
        meta: {
          responseValidationFailed: true
        },
        fallback: {
          safeMode: true,
          reason: 'invalid-response-contract',
          readonly: true,
          destructiveActions: false
        }
      });

      return res.status(500).json(invalidEnvelope);
    }
  }

  return res.status(statusCode).json(envelope);
}

module.exports = {
  buildSafeResponse,
  sendSafeResponse
};
