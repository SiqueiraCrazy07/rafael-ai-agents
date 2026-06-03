class RouterGenerator {
  generate(project) {
    const baseRoutes = [
      { path: "/", page: "DashboardPage", label: "Dashboard" },
      { path: "/login", page: "LoginPage", label: "Login" },
      { path: "/progress", page: "ProgressPage", label: "Progress" },
      { path: "/content", page: "ContentPage", label: "Content" }
    ];
    const extraRoutes = [];
    if (project.category === "crm") {
      extraRoutes.push({ path: "/contacts", page: "ContactsPage", label: "Contacts" });
    }
    if (project.category === "game") {
      extraRoutes.push({ path: "/missions", page: "MissionsPage", label: "Missions" });
    }
    if (project.category === "business") {
      extraRoutes.push({ path: "/conversations", page: "ConversationsPage", label: "Conversations" });
    }
    return {
      routes: [...baseRoutes, ...extraRoutes],
      navigation: [...baseRoutes, ...extraRoutes].map((route) => ({ path: route.path, label: route.label })),
      readonly: true,
      safetyMode: "readonly-safe-product-router-generator"
    };
  }
}

module.exports = {
  RouterGenerator
};
