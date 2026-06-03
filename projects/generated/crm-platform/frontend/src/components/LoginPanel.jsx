export function LoginPanel() {
  return (
    <form className="login-panel">
      <label>Email<input type="email" name="email" /></label>
      <label>Password<input type="password" name="password" /></label>
      <button type="button">Enter prototype</button>
    </form>
  );
}
