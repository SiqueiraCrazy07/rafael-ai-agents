import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { ProgressPage } from "../pages/ProgressPage.jsx";
import { ContentPage } from "../pages/ContentPage.jsx";
import { ContactsPage } from "../pages/ContactsPage.jsx";

export const routes = [
  { path: "/", label: "Dashboard", component: DashboardPage },
  { path: "/login", label: "Login", component: LoginPage },
  { path: "/progress", label: "Progress", component: ProgressPage },
  { path: "/content", label: "Content", component: ContentPage },
  { path: "/contacts", label: "Contacts", component: ContactsPage }
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));
