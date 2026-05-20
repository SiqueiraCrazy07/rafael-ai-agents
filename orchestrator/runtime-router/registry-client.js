const fs = require("node:fs");
const path = require("node:path");

class RegistryClient {
  constructor(registryPath = path.resolve(process.cwd(), "registry", "agents-registry.json")) {
    this.registryPath = registryPath;
  }

  loadRegistry() {
    return JSON.parse(fs.readFileSync(this.registryPath, "utf8"));
  }

  listAgents() {
    return this.loadRegistry().agents || [];
  }

  getAgent(agentId) {
    return this.listAgents().find((agent) => agent.id === agentId) || null;
  }

  listActiveAgents() {
    return this.listAgents().filter((agent) => agent.status === "active");
  }
}

module.exports = {
  RegistryClient
};
