const path = require("node:path");
const { writeFile } = require("./project-bootstrapper");

function pageComponentName(screen) {
  return `${String(screen).replace(/[^a-z0-9]+/gi, " ").trim().split(/\s+/).map((part) => part[0].toUpperCase() + part.slice(1)).join("")}Page`;
}

class FrontendGenerator {
  generate({ project, router, components }) {
    const files = [];
    const srcRoot = path.join(project.projectRoot, "frontend", "src");
    files.push(writeFile(path.join(project.projectRoot, "frontend", "package.json"), JSON.stringify({
      name: `${project.projectSlug}-frontend`,
      private: true,
      type: "module",
      scripts: {
        dev: "vite --host 127.0.0.1",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "@vitejs/plugin-react": "latest",
        "vite": "latest",
        "react": "latest",
        "react-dom": "latest"
      },
      devDependencies: {}
    }, null, 2)));
    files.push(writeFile(path.join(srcRoot, "App.jsx"), `import { AppLayout } from "./layouts/AppLayout.jsx";
import { routes, navigation } from "./routes/routes.js";

export default function App() {
  const Page = routes[0].component;
  return <AppLayout navigation={navigation}><Page /></AppLayout>;
}`));
    files.push(writeFile(path.join(srcRoot, "main.jsx"), `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);`));
    files.push(writeFile(path.join(project.projectRoot, "frontend", "index.html"), `<div id="root"></div><script type="module" src="/src/main.jsx"></script>`));
    files.push(writeFile(path.join(srcRoot, "styles.css"), `.navigation-shell { font-family: Inter, Arial, sans-serif; display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
nav { display: flex; flex-direction: column; gap: 8px; padding: 24px; background: #f4f7f9; }
main { padding: 24px; }
.dashboard-card, .login-panel, .content-list article { border: 1px solid #d8e0e7; border-radius: 8px; padding: 16px; margin-bottom: 12px; }`));
    for (const component of components.components) {
      files.push(writeFile(path.join(srcRoot, "components", component.file), component.code));
    }
    files.push(writeFile(path.join(srcRoot, "layouts", "AppLayout.jsx"), `import { NavigationShell } from "../components/NavigationShell.jsx";

export function AppLayout({ navigation, children }) {
  return <NavigationShell navigation={navigation}>{children}</NavigationShell>;
}`));
    const pageNames = new Set(["DashboardPage", "LoginPage", "ProgressPage", "ContentPage", ...router.routes.map((route) => route.page)]);
    for (const pageName of pageNames) {
      files.push(writeFile(path.join(srcRoot, "pages", `${pageName}.jsx`), this.pageCode(pageName, project)));
    }
    files.push(writeFile(path.join(srcRoot, "routes", "routes.js"), this.routesCode(router.routes)));
    files.push(writeFile(path.join(srcRoot, "services", "apiClient.js"), `export async function apiGet(path) {
  return { path, readonly: true, data: null, fallback: { safeMode: true, reason: "prototype-api-client" } };
}`));
    files.push(writeFile(path.join(srcRoot, "hooks", "usePrototypeData.js"), `import { useMemo } from "react";

export function usePrototypeData() {
  return useMemo(() => ({
    productName: "${project.productName}",
    features: ${JSON.stringify(project.mvpFeatures)}
  }), []);
}`));
    return {
      files,
      pages: [...pageNames],
      components: components.components.map((component) => component.name),
      routes: router.routes,
      readonly: true,
      dependenciesInstalled: false,
      safetyMode: "readonly-safe-product-frontend-generator"
    };
  }

  pageCode(pageName, project) {
    return `import { DashboardCard } from "../components/DashboardCard.jsx";
import { ContentList } from "../components/ContentList.jsx";
import { ProgressTracker } from "../components/ProgressTracker.jsx";
import { usePrototypeData } from "../hooks/usePrototypeData.js";

export function ${pageName}() {
  const data = usePrototypeData();
  return (
    <section>
      <h1>${project.productName}</h1>
      <DashboardCard title="${pageName.replace("Page", "")}" value="Prototype" detail="Readonly generated screen" />
      <ProgressTracker items={data.features.map((label, index) => ({ id: index, label }))} />
      <ContentList content={data.features.map((title, index) => ({ id: index, title, summary: "Generated MVP feature" }))} />
    </section>
  );
}`;
  }

  routesCode(routes) {
    const imports = routes.map((route) => `import { ${route.page} } from "../pages/${route.page}.jsx";`).join("\n");
    const entries = routes.map((route) => `{ path: "${route.path}", label: "${route.label}", component: ${route.page} }`).join(",\n  ");
    return `${imports}

export const routes = [
  ${entries}
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));`;
  }
}

module.exports = {
  FrontendGenerator,
  pageComponentName
};
