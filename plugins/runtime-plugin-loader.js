const fs = require("node:fs");
const path = require("node:path");
const { RuntimePluginRegistry } = require("./runtime-plugin-registry");

function listPluginFiles(directory) {
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      files: [],
      readErrors: [],
      fallback: {
        safeMode: true,
        reason: "plugin-directory-unavailable"
      }
    };
  }

  const files = fs.readdirSync(directory)
    .filter((file) => file.endsWith(".js"))
    .map((file) => path.join(directory, file));

  return {
    available: files.length > 0,
    files,
    readErrors: [],
    fallback: files.length > 0 ? null : {
      safeMode: true,
      reason: "plugin-directory-empty"
    }
  };
}

class RuntimePluginLoader {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.pluginDir = options.pluginDir || path.join(this.rootDir, "plugins", "examples");
    this.registry = options.registry || new RuntimePluginRegistry();
  }

  loadAll() {
    const listing = listPluginFiles(this.pluginDir);
    const loaded = [];
    const readErrors = [...listing.readErrors];

    for (const filePath of listing.files) {
      try {
        const pluginModule = require(filePath);
        const plugin = pluginModule.plugin || pluginModule;
        const registration = this.registry.register(plugin, filePath);
        loaded.push({
          sourcePath: filePath,
          pluginId: plugin && plugin.pluginId ? plugin.pluginId : "unknown-plugin",
          registered: registration.registered,
          validation: registration.validation
        });
      } catch (error) {
        readErrors.push({
          sourcePath: filePath,
          error: error.message
        });
      }
    }

    return {
      available: listing.available,
      pluginDir: this.pluginDir,
      loaded,
      registeredPlugins: this.registry.list(),
      rejectedPlugins: this.registry.rejectedPlugins(),
      readErrors,
      fallback: readErrors.length > 0 || this.registry.rejectedPlugins().length > 0
        ? {
            safeMode: true,
            reason: "some-plugins-rejected-or-unreadable"
          }
        : listing.fallback
    };
  }
}

module.exports = {
  RuntimePluginLoader,
  listPluginFiles
};
