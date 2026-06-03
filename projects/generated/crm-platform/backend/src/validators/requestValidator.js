function validateReadRequest(request) {
  return { ok: true, path: request.path, readonly: true };
}

module.exports = { validateReadRequest };
