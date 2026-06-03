function readonlyGuard(request, response, next) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return response.status(405).json({ ok: false, readonly: true, reason: "mutation-denied" });
  }
  return next();
}

module.exports = { readonlyGuard };
