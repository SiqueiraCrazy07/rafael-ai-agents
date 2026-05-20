const { RUNTIME_API_CONTRACTS } = require('../contracts/runtime-api-contracts');
const { EVENT_TYPES, RUNTIME_QUERY_SCHEMAS } = require('../schemas/runtime-query-schemas');

const EXPORTED_ENDPOINTS = [
  ['health', '/api/v1/health'],
  ['runtimeStatus', '/api/v1/runtime/status'],
  ['queueStatus', '/api/v1/runtime/queue'],
  ['events', '/api/v1/runtime/events'],
  ['decisions', '/api/v1/runtime/decisions'],
  ['validation', '/api/v1/runtime/validation'],
  ['dashboardSummary', '/api/v1/dashboard/summary'],
  ['dashboardMetrics', '/api/v1/dashboard/metrics'],
  ['dashboardTimelines', '/api/v1/dashboard/timelines'],
  ['dashboardTraces', '/api/v1/dashboard/traces'],
  ['dashboardProblematicWorkflows', '/api/v1/dashboard/workflows/problematic'],
  ['dashboardWorkerHealth', '/api/v1/dashboard/workers/health']
];

function nullableRef(ref) {
  return {
    anyOf: [
      { $ref: ref },
      { type: 'null' }
    ]
  };
}

function queryParameters(schemaName) {
  const schema = RUNTIME_QUERY_SCHEMAS[schemaName] || RUNTIME_QUERY_SCHEMAS.empty;

  return Object.entries(schema.properties || {}).map(([name, definition]) => ({
    name,
    in: 'query',
    required: false,
    schema: {
      type: definition.type === 'integer' ? 'integer' : 'string',
      minimum: definition.min,
      maximum: definition.max,
      maxLength: definition.maxLength,
      pattern: definition.pattern,
      enum: definition.enum,
      default: definition.default
    }
  }));
}

function responseEnvelope(schemaRef) {
  return {
    allOf: [
      { $ref: '#/components/schemas/ResponseEnvelope' },
      {
        type: 'object',
        properties: {
          data: { $ref: schemaRef }
        }
      }
    ]
  };
}

function successResponse(schemaRef, description) {
  return {
    description,
    content: {
      'application/json': {
        schema: responseEnvelope(schemaRef)
      }
    }
  };
}

function errorResponse(description) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/ErrorEnvelope' }
      }
    }
  };
}

function operationFor(endpointName, path) {
  const contract = RUNTIME_API_CONTRACTS.endpoints[endpointName];
  const schemaName = contract.responseSchema;
  const schemaRef = `#/components/schemas/${schemaName[0].toUpperCase()}${schemaName.slice(1)}Data`;

  return {
    get: {
      operationId: endpointName,
      summary: `${endpointName} readonly endpoint`,
      description: 'Readonly API V1 endpoint. Does not mutate runtime, workflows, memory, or database state.',
      tags: endpointName === 'health' ? ['Health'] : endpointName.startsWith('dashboard') ? ['Dashboard'] : ['Runtime'],
      security: [{ ApiKeyAuth: [] }],
      parameters: [
        {
          name: 'x-request-id',
          in: 'header',
          required: false,
          schema: { type: 'string', maxLength: 160 },
          description: 'Optional request tracing id. The API creates one when omitted.'
        },
        ...queryParameters(contract.querySchema)
      ],
      responses: {
        200: successResponse(schemaRef, `${path} response envelope`),
        400: errorResponse('Invalid query params envelope'),
        401: errorResponse('Missing or invalid x-api-key envelope'),
        403: errorResponse('Readonly or safe mode policy denied envelope'),
        429: errorResponse('Rate limit exceeded envelope'),
        500: errorResponse('Safe error envelope')
      },
      'x-runtime-contract': {
        readonly: true,
        destructiveActions: false,
        responseSchema: contract.responseSchema,
        querySchema: contract.querySchema
      }
    }
  };
}

function buildOpenApiSpec(options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const paths = EXPORTED_ENDPOINTS.reduce((acc, [endpointName, path]) => ({
    ...acc,
    [path]: operationFor(endpointName, path)
  }), {});

  return {
    openapi: '3.1.0',
    info: {
      title: 'Rafael AI Agents Runtime API',
      version: RUNTIME_API_CONTRACTS.version,
      summary: 'Readonly runtime API contracts for Rafael AI Agents.',
      description: 'OpenAPI export for API V1. All listed operations are readonly and governed by x-api-key, safe response envelopes, runtime flags, and fallback metadata.'
    },
    jsonSchemaDialect: 'https://json-schema.org/draft/2020-12/schema',
    servers: [
      {
        url: '/api/v1',
        description: 'Versioned API base path'
      }
    ],
    tags: [
      { name: 'Health', description: 'API health and contract metadata' },
      { name: 'Runtime', description: 'Readonly runtime intelligence views' },
      { name: 'Dashboard', description: 'Readonly telemetry, metrics, timelines, traces, and worker health views' }
    ],
    security: [{ ApiKeyAuth: [] }],
    paths,
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Readonly API key. Required by default through API_REQUIRE_AUTH=true.'
        }
      },
      schemas: buildSchemas()
    },
    'x-rafael-ai-agents': {
      contractVersion: 'api-openapi-contract-export-v1',
      generatedAt,
      readonlyMode: true,
      destructiveRoutesExported: false,
      runtimeFlags: {
        API_USE_DATABASE_READ: true,
        API_ALLOW_JSON_FALLBACK: true,
        API_READONLY_MODE: true,
        API_REQUIRE_AUTH: true,
        API_SAFE_MODE: true
      },
      fallback: {
        jsonFallbackDocumented: true,
        safeUnavailableDocumented: true
      }
    }
  };
}

function buildSchemas() {
  const anyObject = {
    type: 'object',
    additionalProperties: true
  };

  return {
    RuntimeFlags: {
      type: 'object',
      required: [
        'API_USE_DATABASE_READ',
        'API_ALLOW_JSON_FALLBACK',
        'API_READONLY_MODE',
        'API_REQUIRE_AUTH',
        'API_SAFE_MODE'
      ],
      properties: {
        API_USE_DATABASE_READ: { type: 'boolean' },
        API_ALLOW_JSON_FALLBACK: { type: 'boolean' },
        API_READONLY_MODE: { type: 'boolean' },
        API_REQUIRE_AUTH: { type: 'boolean' },
        API_SAFE_MODE: { type: 'boolean' }
      },
      additionalProperties: false
    },
    ApiMetadata: {
      type: 'object',
      required: ['version', 'readonly', 'destructiveActions'],
      properties: {
        version: { type: 'string', const: 'v1' },
        readonly: { type: 'boolean', default: true },
        destructiveActions: { type: 'boolean', const: false },
        runtimeFlags: nullableRef('#/components/schemas/RuntimeFlags'),
        databaseReadEnabled: { type: ['boolean', 'null'] },
        jsonFallbackEnabled: { type: ['boolean', 'null'] },
        safeModeEnabled: { type: ['boolean', 'null'] }
      },
      additionalProperties: true
    },
    Fallback: {
      type: ['object', 'null'],
      properties: {
        safeMode: { type: 'boolean' },
        reason: { type: 'string' },
        readonlyDeny: { type: 'boolean' },
        runtimeInternalUnaffected: { type: 'boolean' },
        databaseFallback: {},
        jsonFallback: {}
      },
      additionalProperties: true
    },
    ResponseEnvelope: {
      type: 'object',
      required: ['ok', 'status', 'requestId', 'timestamp', 'api', 'data', 'meta', 'fallback'],
      properties: {
        ok: { type: 'boolean' },
        status: { type: 'string', enum: ['ok', 'error'] },
        requestId: { type: 'string' },
        timestamp: { type: 'string', format: 'date-time' },
        api: { $ref: '#/components/schemas/ApiMetadata' },
        data: {},
        meta: anyObject,
        fallback: { $ref: '#/components/schemas/Fallback' }
      },
      additionalProperties: false
    },
    ErrorEnvelope: {
      allOf: [
        { $ref: '#/components/schemas/ResponseEnvelope' },
        {
          type: 'object',
          properties: {
            ok: { const: false },
            status: { const: 'error' },
            fallback: { $ref: '#/components/schemas/Fallback' }
          }
        }
      ]
    },
    RuntimeSourceData: {
      type: 'object',
      required: ['source', 'fallbackUsed', 'readErrors'],
      properties: {
        source: { type: 'string', enum: ['database', 'json-fallback', 'unavailable'] },
        fallbackUsed: { type: 'boolean' },
        readErrors: { type: 'array', items: anyObject },
        runtimeFlags: { $ref: '#/components/schemas/RuntimeFlags' },
        databaseReadEnabled: { type: 'boolean' },
        jsonFallbackEnabled: { type: 'boolean' },
        safeModeEnabled: { type: 'boolean' },
        fallback: { $ref: '#/components/schemas/Fallback' }
      },
      additionalProperties: true
    },
    HealthData: {
      type: 'object',
      required: ['service', 'status', 'phase', 'contract', 'safety'],
      properties: {
        service: { type: 'string' },
        status: { type: 'string' },
        phase: { type: 'string' },
        contract: anyObject,
        runtimeFlags: { $ref: '#/components/schemas/RuntimeFlags' },
        databaseReadEnabled: { type: 'boolean' },
        jsonFallbackEnabled: { type: 'boolean' },
        safeModeEnabled: { type: 'boolean' },
        safety: anyObject
      },
      additionalProperties: true
    },
    RuntimeStatusData: {
      allOf: [
        { $ref: '#/components/schemas/RuntimeSourceData' },
        {
          type: 'object',
          required: ['phase', 'apiReadiness', 'runtimeReadiness', 'sources', 'safety'],
          properties: {
            phase: { type: 'string' },
            apiReadiness: { type: 'string' },
            runtimeReadiness: { type: 'string' },
            sources: anyObject,
            safety: anyObject
          }
        }
      ]
    },
    QueueStatusData: {
      allOf: [
        { $ref: '#/components/schemas/RuntimeSourceData' },
        {
          type: 'object',
          required: ['available', 'sourcePath', 'fileName', 'updatedAt', 'metrics', 'queue', 'retryQueue', 'enforcementIntegration', 'readErrors'],
          properties: {
            available: { type: 'boolean' },
            sourcePath: { type: ['string', 'null'] },
            fileName: { type: ['string', 'null'] },
            updatedAt: { type: ['string', 'null'] },
            metrics: {},
            queue: { type: 'array', items: anyObject },
            queueItems: { type: 'array', items: anyObject },
            retryQueue: { type: 'array', items: anyObject },
            retryItems: { type: 'array', items: anyObject },
            protectedQueue: { type: 'array', items: anyObject },
            enforcementIntegration: {},
            throttling: {},
            workers: { type: 'array', items: anyObject },
            totalQueueItems: { type: 'integer' },
            totalRetryItems: { type: 'integer' },
            protectedQueueCount: { type: 'integer' }
          }
        }
      ]
    },
    EventsData: {
      allOf: [
        { $ref: '#/components/schemas/RuntimeSourceData' },
        {
          type: 'object',
          required: ['available', 'sourceDir', 'totalFiles', 'returned', 'events', 'readErrors'],
          properties: {
            available: { type: 'boolean' },
            sourceDir: { type: ['string', 'null'] },
            totalFiles: { type: 'integer' },
            returned: { type: 'integer' },
            events: { type: 'array', items: anyObject }
          }
        }
      ]
    },
    DecisionsData: {
      allOf: [
        { $ref: '#/components/schemas/RuntimeSourceData' },
        {
          type: 'object',
          required: ['available', 'sourceDir', 'totalFiles', 'returned', 'reports', 'readErrors'],
          properties: {
            available: { type: 'boolean' },
            sourceDir: { type: ['string', 'null'] },
            totalFiles: { type: 'integer' },
            returned: { type: 'integer' },
            reports: { type: 'array', items: anyObject }
          }
        }
      ]
    },
    ValidationData: {
      allOf: [
        { $ref: '#/components/schemas/RuntimeSourceData' },
        {
          type: 'object',
          required: ['available', 'sourcePath', 'fileName', 'updatedAt', 'validation', 'readErrors'],
          properties: {
            available: { type: 'boolean' },
            sourcePath: { type: ['string', 'null'] },
            fileName: { type: ['string', 'null'] },
            updatedAt: { type: ['string', 'null'] },
            validation: {}
          }
        }
      ]
    },
    EventType: {
      type: 'string',
      enum: EVENT_TYPES
    },
    DashboardSourceData: {
      type: 'object',
      required: ['source', 'fallbackUsed', 'readErrors', 'runtimeFlags', 'generatedAt'],
      properties: {
        source: { type: 'string', enum: ['database', 'json-fallback', 'unavailable'] },
        fallbackUsed: { type: 'boolean' },
        readErrors: { type: 'array', items: anyObject },
        runtimeFlags: { $ref: '#/components/schemas/RuntimeFlags' },
        databaseReadEnabled: { type: 'boolean' },
        jsonFallbackEnabled: { type: 'boolean' },
        safeModeEnabled: { type: 'boolean' },
        generatedAt: { type: 'string', format: 'date-time' },
        telemetryReportId: { type: ['string', 'null'] },
        correlationId: { type: ['string', 'null'] }
      },
      additionalProperties: true
    },
    DashboardSummaryData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['summary'],
          properties: {
            summary: anyObject
          }
        }
      ]
    },
    DashboardMetricsData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['metrics'],
          properties: {
            metrics: anyObject,
            problemDetection: anyObject,
            correlation: anyObject
          }
        }
      ]
    },
    DashboardTimelinesData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['returned', 'timelines'],
          properties: {
            total: { type: 'integer' },
            returned: { type: 'integer' },
            timelines: { type: 'array', items: anyObject }
          }
        }
      ]
    },
    DashboardTracesData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['returned', 'traces'],
          properties: {
            total: { type: 'integer' },
            returned: { type: 'integer' },
            traces: { type: 'array', items: anyObject }
          }
        }
      ]
    },
    DashboardProblematicWorkflowsData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['problematicWorkflows'],
          properties: {
            total: { type: 'integer' },
            returned: { type: 'integer' },
            problematicWorkflows: { type: 'array', items: anyObject }
          }
        }
      ]
    },
    DashboardWorkerHealthData: {
      allOf: [
        { $ref: '#/components/schemas/DashboardSourceData' },
        {
          type: 'object',
          required: ['workers'],
          properties: {
            workers: anyObject
          }
        }
      ]
    }
  };
}

module.exports = {
  EXPORTED_ENDPOINTS,
  buildOpenApiSpec
};
