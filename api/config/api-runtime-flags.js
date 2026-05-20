function parseBoolean(value, defaultValue) {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return String(value).toLowerCase() === 'true';
}

function resolveRuntimeFlags(env = process.env, overrides = {}) {
  return {
    useDatabaseRead: parseBoolean(overrides.API_USE_DATABASE_READ ?? env.API_USE_DATABASE_READ, true),
    allowJsonFallback: parseBoolean(overrides.API_ALLOW_JSON_FALLBACK ?? env.API_ALLOW_JSON_FALLBACK, true),
    readonlyMode: parseBoolean(overrides.API_READONLY_MODE ?? env.API_READONLY_MODE, true),
    requireAuth: parseBoolean(overrides.API_REQUIRE_AUTH ?? env.API_REQUIRE_AUTH, true),
    safeMode: parseBoolean(overrides.API_SAFE_MODE ?? env.API_SAFE_MODE, true)
  };
}

function publicRuntimeFlags(flags) {
  return {
    API_USE_DATABASE_READ: flags.useDatabaseRead,
    API_ALLOW_JSON_FALLBACK: flags.allowJsonFallback,
    API_READONLY_MODE: flags.readonlyMode,
    API_REQUIRE_AUTH: flags.requireAuth,
    API_SAFE_MODE: flags.safeMode
  };
}

module.exports = {
  parseBoolean,
  publicRuntimeFlags,
  resolveRuntimeFlags
};
