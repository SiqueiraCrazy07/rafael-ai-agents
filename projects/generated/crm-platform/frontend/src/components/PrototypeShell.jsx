export function PrototypeShell({ productName, navigation, currentPath, onNavigate, children }) {
  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Product navigation">
        <div className="brand">
          <strong>{productName}</strong>
          <span>Readonly prototype renderer</span>
        </div>
        {navigation.map((item) => (
          <button
            className={currentPath === item.path ? "nav-link active" : "nav-link"}
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
