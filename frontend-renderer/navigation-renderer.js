class NavigationRenderer {
  routesFor(project) {
    const baseRoutes = [
      { path: "/", label: "Dashboard", component: "DashboardPage" },
      { path: "/login", label: "Login", component: "LoginPage" },
      { path: "/progress", label: "Progress", component: "ProgressPage" },
      { path: "/content", label: "Content", component: "ContentPage" }
    ];

    if (project.category === "education" || project.curriculumGenerated || project.category === "game") {
      baseRoutes.push(
        { path: "/lessons", label: "Lessons", component: "LessonPage" },
        { path: "/review", label: "Review", component: "ReviewPage" },
        { path: "/quiz", label: "Quiz", component: "QuizPage" },
        { path: "/tutor", label: "Tutor", component: "TutorPage" },
        { path: "/adaptive-progress", label: "Adaptive", component: "AdaptiveProgressPage" }
      );
    }

    if (project.category === "game") {
      baseRoutes.push({ path: "/missions", label: "Missions", component: "MissionsPage" });
    }

    if (project.projectSlug.includes("crm") || project.category === "crm") {
      baseRoutes.push({ path: "/contacts", label: "Contacts", component: "ContactsPage" });
    }

    if (project.projectSlug.includes("chatbot")) {
      baseRoutes.push({ path: "/conversations", label: "Conversations", component: "ConversationsPage" });
    }

    return baseRoutes;
  }

  file(routes) {
    const imports = routes
      .map((route) => `import { ${route.component} } from "../pages/${route.component}.jsx";`)
      .join("\n");
    const routeItems = routes
      .map((route) => `  { path: "${route.path}", label: "${route.label}", component: ${route.component} }`)
      .join(",\n");

    return `${imports}

export const routes = [
${routeItems}
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));

export function findRoute(path) {
  return routes.find((route) => route.path === path) || routes[0];
}
`;
  }
}

module.exports = { NavigationRenderer };
