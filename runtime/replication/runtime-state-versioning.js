const crypto = require("node:crypto");

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

class RuntimeStateVersioning {
  createVersion(payload, prefix = "state") {
    const serialized = stableStringify(payload || {});
    const recordHash = crypto.createHash("sha256").update(serialized).digest("hex");
    return {
      versionId: `${prefix}_${Date.now()}_${recordHash.slice(0, 12)}`,
      recordHash,
      byteSize: Buffer.byteLength(serialized, "utf8"),
      generatedAt: new Date().toISOString(),
      algorithm: "sha256-stable-json",
      safetyMode: "readonly-safe-state-versioning"
    };
  }

  compare(left, right) {
    return {
      sameHash: left?.recordHash === right?.recordHash,
      leftVersionId: left?.versionId || null,
      rightVersionId: right?.versionId || null,
      reason: left?.recordHash === right?.recordHash ? "versions-match" : "versions-differ"
    };
  }
}

module.exports = {
  RuntimeStateVersioning,
  stableStringify
};
