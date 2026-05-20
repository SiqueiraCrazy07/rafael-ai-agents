const { RUNTIME_RESPONSE_SCHEMAS } = require('../schemas/runtime-response-schemas');
const { DASHBOARD_RESPONSE_SCHEMAS } = require('../schemas/dashboard-response-schemas');

const RESPONSE_SCHEMAS = {
  ...RUNTIME_RESPONSE_SCHEMAS,
  ...DASHBOARD_RESPONSE_SCHEMAS
};

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function validateEnvelopeBasics(envelope, errors) {
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) {
    errors.push('Response envelope must be an object');
    return;
  }

  const required = ['ok', 'status', 'requestId', 'timestamp', 'api', 'data', 'meta', 'fallback'];
  required
    .filter((key) => !hasOwn(envelope, key))
    .forEach((key) => errors.push(`Missing envelope field: ${key}`));

  if (typeof envelope.ok !== 'boolean') {
    errors.push('ok must be boolean');
  }

  if (typeof envelope.status !== 'string') {
    errors.push('status must be string');
  }

  if (typeof envelope.requestId !== 'string') {
    errors.push('requestId must be string');
  }

  if (!envelope.api || envelope.api.version !== 'v1' || envelope.api.readonly !== true || envelope.api.destructiveActions !== false) {
    errors.push('api metadata must declare v1 readonly non-destructive contract');
  }
}

function validateResponse(schemaName, envelope) {
  const schema = RESPONSE_SCHEMAS[schemaName];
  const errors = [];

  if (!schema) {
    return {
      valid: false,
      errors: [`Unknown response schema: ${schemaName}`]
    };
  }

  validateEnvelopeBasics(envelope, errors);

  if (envelope && typeof envelope === 'object') {
    if (!envelope.data || typeof envelope.data !== 'object') {
      errors.push('data must be an object');
    } else {
      schema.dataRequired
        .filter((key) => !hasOwn(envelope.data, key))
        .forEach((key) => errors.push(`Missing data field: ${key}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function responseSchemaMiddleware(schemaName) {
  return (req, res, next) => {
    res.locals = res.locals || {};
    res.locals.responseSchema = schemaName;
    next();
  };
}

module.exports = {
  responseSchemaMiddleware,
  validateResponse
};
