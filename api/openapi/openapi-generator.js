const fs = require('fs');
const path = require('path');
const { buildOpenApiSpec, EXPORTED_ENDPOINTS } = require('./openapi-spec-builder');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function toIsoFileStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function yamlScalar(value) {
  if (value === null) {
    return 'null';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'string') {
    if (value === '' || /[:#{}\[\],&*?|\-<>=!%@`]/.test(value) || /\s/.test(value)) {
      return JSON.stringify(value);
    }
    return value;
  }

  return JSON.stringify(value);
}

function toYaml(value, indent = 0) {
  const space = ' '.repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }

    return value.map((item) => {
      if (item && typeof item === 'object') {
        return `${space}- ${toYaml(item, indent + 2).trimStart()}`;
      }

      return `${space}- ${yamlScalar(item)}`;
    }).join('\n');
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return '{}';
    }

    return entries.map(([key, item]) => {
      const safeKey = /^[a-zA-Z0-9_.\/:-]+$/.test(key) ? key : JSON.stringify(key);

      if (item && typeof item === 'object') {
        const nested = toYaml(item, indent + 2);
        return `${space}${safeKey}:\n${nested}`;
      }

      return `${space}${safeKey}: ${yamlScalar(item)}`;
    }).join('\n');
  }

  return `${space}${yamlScalar(value)}`;
}

function validateOpenApiSpec(spec) {
  const errors = [];
  const requiredPaths = EXPORTED_ENDPOINTS.map(([, endpointPath]) => endpointPath);

  if (!spec || spec.openapi !== '3.1.0') {
    errors.push('openapi must be 3.1.0');
  }

  if (!spec.info || spec.info.version !== 'v1') {
    errors.push('info.version must be v1');
  }

  if (!spec.components || !spec.components.securitySchemes || !spec.components.securitySchemes.ApiKeyAuth) {
    errors.push('ApiKeyAuth security scheme is required');
  }

  requiredPaths
    .filter((endpointPath) => !spec.paths || !spec.paths[endpointPath] || !spec.paths[endpointPath].get)
    .forEach((endpointPath) => errors.push(`Missing GET path: ${endpointPath}`));

  ['ResponseEnvelope', 'ErrorEnvelope', 'RuntimeFlags', 'Fallback'].forEach((schemaName) => {
    if (!spec.components || !spec.components.schemas || !spec.components.schemas[schemaName]) {
      errors.push(`Missing schema: ${schemaName}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

function writeOpenApiArtifacts(spec, validation) {
  const runtimeDir = path.join(ROOT_DIR, 'runtime-data', 'openapi');
  const memoryDir = path.join(ROOT_DIR, 'memory', 'openapi');
  ensureDir(runtimeDir);
  ensureDir(memoryDir);

  const jsonPath = path.join(runtimeDir, 'openapi-v1.json');
  const yamlPath = path.join(runtimeDir, 'openapi-v1.yaml');
  const metadataPath = path.join(memoryDir, `openapi-v1-metadata-${toIsoFileStamp()}.json`);
  const metadata = {
    metadataId: `openapi_metadata_${Date.now()}`,
    generatedAt: spec['x-rafael-ai-agents'].generatedAt,
    openapi: spec.openapi,
    version: spec.info.version,
    endpoints: Object.keys(spec.paths),
    schemas: Object.keys(spec.components.schemas),
    securitySchemes: Object.keys(spec.components.securitySchemes),
    validation,
    artifacts: {
      jsonPath,
      yamlPath
    },
    fallback: {
      safeMode: true,
      destructiveRoutesExported: false
    }
  };

  fs.writeFileSync(jsonPath, JSON.stringify(spec, null, 2));
  fs.writeFileSync(yamlPath, `${toYaml(spec)}\n`);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return {
    jsonPath,
    yamlPath,
    metadataPath,
    metadata
  };
}

function runOpenApiGenerator() {
  const spec = buildOpenApiSpec();
  const validation = validateOpenApiSpec(spec);
  const artifacts = writeOpenApiArtifacts(spec, validation);
  const report = {
    openapiDemoId: `openapi_demo_${Date.now()}`,
    status: validation.valid ? 'passed' : 'failed',
    openapi: spec.openapi,
    version: spec.info.version,
    endpointsExported: Object.keys(spec.paths),
    schemasExported: Object.keys(spec.components.schemas),
    auth: {
      header: 'x-api-key',
      scheme: 'ApiKeyAuth',
      documented: Boolean(spec.components.securitySchemes.ApiKeyAuth)
    },
    readonly: true,
    destructiveRoutesExported: false,
    fallbackDocumented: Boolean(spec.components.schemas.Fallback),
    runtimeFlagsDocumented: Boolean(spec.components.schemas.RuntimeFlags),
    validation,
    persistence: {
      jsonPath: artifacts.jsonPath,
      yamlPath: artifacts.yamlPath,
      metadataPath: artifacts.metadataPath
    }
  };

  console.log(JSON.stringify(report, null, 2));

  if (report.status !== 'passed') {
    process.exitCode = 1;
  }

  return report;
}

if (require.main === module) {
  runOpenApiGenerator();
}

module.exports = {
  runOpenApiGenerator,
  toYaml,
  validateOpenApiSpec,
  writeOpenApiArtifacts
};
