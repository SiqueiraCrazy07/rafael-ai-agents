import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { ProgressPage } from "../pages/ProgressPage.jsx";
import { ContentPage } from "../pages/ContentPage.jsx";
import { MissionsPage } from "../pages/MissionsPage.jsx";

export const routes = [
  { path: "/", label: "Dashboard", component: DashboardPage },
  { path: "/login", label: "Login", component: LoginPage },
  { path: "/progress", label: "Progress", component: ProgressPage },
  { path: "/content", label: "Content", component: ContentPage },
  { path: "/missions", label: "Missions", component: MissionsPage }
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));
