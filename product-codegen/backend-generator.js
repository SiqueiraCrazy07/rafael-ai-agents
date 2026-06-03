const path = require("node:path");
const { writeFile } = require("./project-bootstrapper");

function controllerName(endpoint) {
  return endpoint.controller;
}

class BackendGenerator {
  generate({ project, api }) {
    const files = [];
    const srcRoot = path.join(project.projectRoot, "backend", "src");
    files.push(writeFile(path.join(project.projectRoot, "backend", "package.json"), JSON.stringify({
      name: `${project.projectSlug}-backend`,
      private: true,
      type: "commonjs",
      scripts: {
        start: "node src/server.js",
        dev: "node src/server.js"
      },
      dependencies: {
        express: "latest"
      }
    }, null, 2)));
    files.push(writeFile(path.join(srcRoot, "server.js"), `const express = require("express");
const { router } = require("./routes/index");

const app = express();
app.use(express.json());
app.use("/api", router);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, "127.0.0.1", () => console.log(JSON.stringify({ status: "prototype-api-ready", port })));
}

module.exports = { app };`));
    files.push(writeFile(path.join(srcRoot, "middleware", "readonlyGuard.js"), `function readonlyGuard(request, response, next) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return response.status(405).json({ ok: false, readonly: true, reason: "mutation-denied" });
  }
  return next();
}

module.exports = { readonlyGuard };`));
    files.push(writeFile(path.join(srcRoot, "validators", "requestValidator.js"), `function validateReadRequest(request) {
  return { ok: true, path: request.path, readonly: true };
}

module.exports = { validateReadRequest };`));
    files.push(writeFile(path.join(srcRoot, "services", "prototypeService.js"), `const prototype = ${JSON.stringify({
      productName: project.productName,
      category: project.category,
      features: project.mvpFeatures
    }, null, 2)};

function readPrototype() {
  return { ok: true, readonly: true, prototype };
}

module.exports = { readPrototype };`));
    files.push(writeFile(path.join(srcRoot, "repositories", "jsonRepository.js"), `function list(collection) {
  return { collection, items: [], readonly: true, fallback: { safeMode: true, reason: "json-repository-placeholder" } };
}

module.exports = { list };`));
    const controllers = new Set(api.endpoints.map(controllerName));
    for (const controller of controllers) {
      files.push(writeFile(path.join(srcRoot, "controllers", `${controller}.js`), this.controllerCode(controller)));
    }
    files.push(writeFile(path.join(srcRoot, "routes", "index.js"), this.routesCode(api.endpoints)));
    return {
      files,
      controllers: [...controllers],
      services: ["prototypeService"],
      repositories: ["jsonRepository"],
      middleware: ["readonlyGuard"],
      validators: ["requestValidator"],
      routes: api.endpoints,
      readonly: true,
      dependenciesInstalled: false,
      safetyMode: "readonly-safe-product-backend-generator"
    };
  }

  controllerCode(controller) {
    return `const { readPrototype } = require("../services/prototypeService");

function handle(request, response) {
  return response.json({ controller: "${controller}", ...readPrototype() });
}

module.exports = {
  session: handle,
  list: handle,
  summary: handle
};`;
  }

  routesCode(endpoints) {
    const imports = [...new Set(endpoints.map((endpoint) => endpoint.controller))]
      .map((controller) => `const ${controller} = require("../controllers/${controller}");`)
      .join("\n");
    const routes = endpoints
      .map((endpoint) => `router.get("${endpoint.path}", ${endpoint.controller}.${endpoint.action});`)
      .join("\n");
    return `const express = require("express");
const { readonlyGuard } = require("../middleware/readonlyGuard");
${imports}

const router = express.Router();
router.use(readonlyGuard);
${routes}

module.exports = { router };`;
  }
}

module.exports = {
  BackendGenerator
};
