const { publicRuntimeFlags, resolveRuntimeFlags } = require('./api-runtime-flags');

function createApiEnvironmentConfig(options = {}) {
  const runtimeFlags = resolveRuntimeFlags(process.env, options.flags || options.env || {});

  return {
    runtimeFlags,
    responseFields: {
      runtimeFlags: publicRuntimeFlags(runtimeFlags),
      databaseReadEnabled: runtimeFlags.useDatabaseRead,
      jsonFallbackEnabled: runtimeFlags.allowJsonFallback,
      safeModeEnabled: runtimeFlags.safeMode
    },
    safety: {
      readonlyDefault: true,
      authRequiredDefault: true,
      databaseReadOptional: true,
      jsonFallbackDefaultAllowed: true,
      safeModeBlocksFutureWrites: runtimeFlags.safeMode
    }
  };
}

module.exports = {
  createApiEnvironmentConfig
};
