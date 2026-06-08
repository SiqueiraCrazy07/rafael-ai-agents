import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { ProgressPage } from "../pages/ProgressPage.jsx";
import { ContentPage } from "../pages/ContentPage.jsx";
import { ConversationsPage } from "../pages/ConversationsPage.jsx";

export const routes = [
  { path: "/", label: "Dashboard", component: DashboardPage },
  { path: "/login", label: "Login", component: LoginPage },
  { path: "/progress", label: "Progress", component: ProgressPage },
  { path: "/content", label: "Content", component: ContentPage },
  { path: "/conversations", label: "Conversations", component: ConversationsPage }
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));

export function findRoute(path) {
  return routes.find((route) => route.path === path) || routes[0];
}
