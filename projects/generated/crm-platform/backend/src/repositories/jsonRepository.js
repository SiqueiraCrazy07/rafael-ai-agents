function list(collection) {
  return { collection, items: [], readonly: true, fallback: { safeMode: true, reason: "json-repository-placeholder" } };
}

module.exports = { list };
