class ApiGenerator {
  generate(project) {
    const endpoints = [
      { method: "GET", path: "/auth/session", controller: "authController", action: "session" },
      { method: "GET", path: "/users", controller: "usersController", action: "list" },
      { method: "GET", path: "/progress", controller: "progressController", action: "summary" },
      { method: "GET", path: "/content", controller: "contentController", action: "list" },
      { method: "GET", path: "/dashboard", controller: "dashboardController", action: "summary" }
    ];
    if (project.category === "crm") {
      endpoints.push({ method: "GET", path: "/contacts", controller: "contactsController", action: "list" });
    }
    if (project.category === "game") {
      endpoints.push({ method: "GET", path: "/missions", controller: "missionsController", action: "list" });
    }
    return {
      endpoints,
      readonly: true,
      safetyMode: "readonly-safe-product-api-generator"
    };
  }
}

module.exports = {
  ApiGenerator
};
