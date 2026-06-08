import { useEffect, useMemo, useState } from "react";
import { PrototypeShell } from "./components/PrototypeShell.jsx";
import { findRoute, navigation } from "./routes/routes.js";

function currentHashPath() {
  const hash = window.location.hash.replace("#", "");
  return hash || "/";
}

export default function App() {
  const [path, setPath] = useState(currentHashPath());
  useEffect(() => {
    const onHashChange = () => setPath(currentHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);
  const route = useMemo(() => findRoute(path), [path]);
  const Page = route.component;
  const onNavigate = (nextPath) => {
    window.location.hash = nextPath;
    setPath(nextPath);
  };
  return (
    <PrototypeShell productName="Chatbot Platform" navigation={navigation} currentPath={route.path} onNavigate={onNavigate}>
      <Page />
    </PrototypeShell>
  );
}
