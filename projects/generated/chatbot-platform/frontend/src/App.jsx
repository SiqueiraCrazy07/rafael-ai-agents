import { AppLayout } from "./layouts/AppLayout.jsx";
import { routes, navigation } from "./routes/routes.js";

export default function App() {
  const Page = routes[0].component;
  return <AppLayout navigation={navigation}><Page /></AppLayout>;
}
