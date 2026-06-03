export function NavigationShell({ navigation = [], children }) {
  return (
    <div className="navigation-shell">
      <nav>{navigation.map((item) => <a key={item.path} href={item.path}>{item.label}</a>)}</nav>
      <main>{children}</main>
    </div>
  );
}
