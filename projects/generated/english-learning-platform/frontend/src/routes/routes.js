import { DashboardPage } from "../pages/DashboardPage.jsx";
import { LoginPage } from "../pages/LoginPage.jsx";
import { ProgressPage } from "../pages/ProgressPage.jsx";
import { ContentPage } from "../pages/ContentPage.jsx";
import { LessonPage } from "../pages/LessonPage.jsx";
import { ReviewPage } from "../pages/ReviewPage.jsx";
import { QuizPage } from "../pages/QuizPage.jsx";
import { TutorPage } from "../pages/TutorPage.jsx";
import { AdaptiveProgressPage } from "../pages/AdaptiveProgressPage.jsx";

export const routes = [
  { path: "/", label: "Dashboard", component: DashboardPage },
  { path: "/login", label: "Login", component: LoginPage },
  { path: "/progress", label: "Progress", component: ProgressPage },
  { path: "/content", label: "Content", component: ContentPage },
  { path: "/lessons", label: "Lessons", component: LessonPage },
  { path: "/review", label: "Review", component: ReviewPage },
  { path: "/quiz", label: "Quiz", component: QuizPage },
  { path: "/tutor", label: "Tutor", component: TutorPage },
  { path: "/adaptive-progress", label: "Adaptive", component: AdaptiveProgressPage }
];

export const navigation = routes.map(({ path, label }) => ({ path, label }));

export function findRoute(path) {
  return routes.find((route) => route.path === path) || routes[0];
}
