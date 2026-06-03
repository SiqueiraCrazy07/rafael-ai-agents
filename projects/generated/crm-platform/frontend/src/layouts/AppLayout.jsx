import { NavigationShell } from "../components/NavigationShell.jsx";

export function AppLayout({ navigation, children }) {
  return <NavigationShell navigation={navigation}>{children}</NavigationShell>;
}
