export async function apiGet(path) {
  return { path, readonly: true, data: null, fallback: { safeMode: true, reason: "prototype-api-client" } };
}
