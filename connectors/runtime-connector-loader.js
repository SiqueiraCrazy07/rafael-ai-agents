const fs = require("node:fs");
const path = require("node:path");
const { RuntimeConnectorRegistry } = require("./runtime-connector-registry");

function listConnectorFiles(directory) {
  if (!fs.existsSync(directory)) {
    return {
      available: false,
      files: [],
      readErrors: [],
      fallback: {
        safeMode: true,
        reason: "connector-directory-unavailable"
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
      reason: "connector-directory-empty"
    }
  };
}

class RuntimeConnectorLoader {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.connectorDir = options.connectorDir || path.join(this.rootDir, "connectors", "examples");
    this.registry = options.registry || new RuntimeConnectorRegistry();
  }

  loadAll() {
    const listing = listConnectorFiles(this.connectorDir);
    const loaded = [];
    const readErrors = [...listing.readErrors];

    for (const filePath of listing.files) {
      try {
        const connectorModule = require(filePath);
        const connector = connectorModule.connector || connectorModule;
        const registration = this.registry.register(connector, filePath);
        loaded.push({
          sourcePath: filePath,
          connectorId: connector && connector.connectorId ? connector.connectorId : "unknown-connector",
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
      connectorDir: this.connectorDir,
      loaded,
      registeredConnectors: this.registry.list(),
      rejectedConnectors: this.registry.rejectedConnectors(),
      unhealthyConnectors: this.registry.unhealthyConnectors(),
      readErrors,
      fallback: readErrors.length > 0 || this.registry.rejectedConnectors().length > 0 || this.registry.unhealthyConnectors().length > 0
        ? {
            safeMode: true,
            reason: "some-connectors-rejected-unreadable-or-unhealthy"
          }
        : listing.fallback
    };
  }
}

module.exports = {
  RuntimeConnectorLoader,
  listConnectorFiles
};
