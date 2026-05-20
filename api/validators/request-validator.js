const { RUNTIME_QUERY_SCHEMAS } = require('../schemas/runtime-query-schemas');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeInteger(value, rule, key, errors) {
  if (value === undefined || value === null || value === '') {
    return rule.default;
  }

  if (Array.isArray(value)) {
    errors.push(`${key} must be a single value`);
    return rule.default;
  }

  if (!/^-?\d+$/.test(String(value))) {
    errors.push(`${key} must be an integer`);
    return rule.default;
  }

  const parsed = Number.parseInt(value, 10);
  if (parsed < rule.min || parsed > rule.max) {
    errors.push(`${key} must be between ${rule.min} and ${rule.max}`);
    return rule.default;
  }

  return parsed;
}

function normalizeString(value, rule, key, errors) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (Array.isArray(value)) {
    errors.push(`${key} must be a single value`);
    return undefined;
  }

  const normalized = String(value).trim();
  if (rule.maxLength && normalized.length > rule.maxLength) {
    errors.push(`${key} exceeds max length ${rule.maxLength}`);
    return undefined;
  }

  if (rule.pattern && !(new RegExp(rule.pattern).test(normalized))) {
    errors.push(`${key} contains unsupported characters`);
    return undefined;
  }

  if (rule.enum && !rule.enum.includes(normalized)) {
    errors.push(`${key} must be one of: ${rule.enum.join(', ')}`);
    return undefined;
  }

  return normalized;
}

function validateQuery(schemaName, query = {}) {
  const schema = RUNTIME_QUERY_SCHEMAS[schemaName];
  const errors = [];
  const normalized = {};

  if (!schema) {
    return {
      valid: false,
      normalized,
      errors: [`Unknown query schema: ${schemaName}`]
    };
  }

  if (!isPlainObject(query)) {
    return {
      valid: false,
      normalized,
      errors: ['Query must be an object']
    };
  }

  const allowedKeys = Object.keys(schema.properties || {});
  const receivedKeys = Object.keys(query);

  if (schema.additionalProperties === false) {
    receivedKeys
      .filter((key) => !allowedKeys.includes(key))
      .forEach((key) => errors.push(`${key} is not an allowed query parameter`));
  }

  for (const key of allowedKeys) {
    const rule = schema.properties[key];
    if (rule.type === 'integer') {
      normalized[key] = normalizeInteger(query[key], rule, key, errors);
    }

    if (rule.type === 'string') {
      const value = normalizeString(query[key], rule, key, errors);
      if (value !== undefined) {
        normalized[key] = value;
      }
    }
  }

  return {
    valid: errors.length === 0,
    normalized,
    errors
  };
}

function requestValidationMiddleware(schemaName) {
  return (req, res, next) => {
    const validation = validateQuery(schemaName, req.query || {});
    req.validation = req.validation || {};
    req.validation.query = validation;
    req.validatedQuery = validation.normalized;

    if (validation.valid) {
      return next();
    }

    return res.safe({
      validation: {
        valid: false,
        schema: schemaName,
        errors: validation.errors
      }
    }, {
      status: 'error',
      statusCode: 400,
      fallback: {
        safeMode: true,
        reason: 'invalid-query-params',
        readonly: true,
        destructiveActions: false
      },
      skipResponseValidation: true
    });
  };
}

function safeQueryParserMiddleware(req, res, next) {
  req.query = req.query || {};
  req.validatedQuery = req.validatedQuery || {};
  next();
}

module.exports = {
  requestValidationMiddleware,
  safeQueryParserMiddleware,
  validateQuery
};
