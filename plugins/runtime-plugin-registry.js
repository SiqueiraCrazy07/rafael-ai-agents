const SUPPORTED_HOOKS = [
  "beforeWorkflow",
  "afterWorkflow",
  "beforeDecision",
  "afterDecision",
  "beforeExecution",
  "afterExecution",
  "beforeTelemetry",
  "afterTelemetry"
];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function validatePlugin(plugin) {
  const errors = [];

  if (!plugin || typeof plugin !== "object") {
    return {
      valid: false,
      errors: ["plugin must be an object"]
    };
  }

  if (!plugin.pluginId || typeof plugin.pluginId !== "string") {
    errors.push("pluginId is required");
  }

  if (!plugin.type || typeof plugin.type !== "string") {
    errors.push("type is required");
  }

  if (plugin.readonly !== true) {
    errors.push("plugin must be readonly=true");
  }

  if (typeof plugin.enabled !== "boolean") {
    errors.push("enabled boolean is required");
  }

  if (!plugin.version || typeof plugin.version !== "string") {
    errors.push("version is required");
  }

  const hooks = asArray(plugin.hooks);
  if (hooks.length === 0) {
    errors.push("at least one hook is required");
  }

  hooks
    .filter((hook) => !SUPPORTED_HOOKS.includes(hook))
    .forEach((hook) => errors.push(`unsupported hook: ${hook}`));

  if (plugin.handlers && typeof plugin.handlers !== "object") {
    errors.push("handlers must be an object when provided");
  }

  if (plugin.destructiveActions === true) {
    errors.push("destructive plugin actions are not allowed");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

class RuntimePluginRegistry {
  constructor() {
    this.plugins = new Map();
    this.rejected = [];
  }

  register(plugin, sourcePath = null) {
    const validation = validatePlugin(plugin);
    if (!validation.valid) {
      const rejected = {
        pluginId: plugin && plugin.pluginId ? plugin.pluginId : "unknown-plugin",
        sourcePath,
        errors: validation.errors,
        fallback: {
          safeMode: true,
          reason: "plugin-validation-failed"
        }
      };
      this.rejected.push(rejected);
      return {
        registered: false,
        plugin: null,
        validation,
        rejected
      };
    }

    const normalized = {
      dependencies: [],
      metadata: {},
      ...plugin,
      sourcePath,
      loadedAt: new Date().toISOString()
    };
    this.plugins.set(normalized.pluginId, normalized);

    return {
      registered: true,
      plugin: normalized,
      validation
    };
  }

  list(options = {}) {
    const plugins = [...this.plugins.values()];
    if (options.enabledOnly) {
      return plugins.filter((plugin) => plugin.enabled === true);
    }
    return plugins;
  }

  listForHook(hook) {
    return this.list({ enabledOnly: true })
      .filter((plugin) => plugin.readonly === true && asArray(plugin.hooks).includes(hook));
  }

  rejectedPlugins() {
    return this.rejected;
  }
}

module.exports = {
  RuntimePluginRegistry,
  SUPPORTED_HOOKS,
  validatePlugin
};
