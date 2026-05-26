class RuntimeTokenManager {
  constructor({ ttlMs = 30 * 60 * 1000, clock = () => new Date() } = {}) {
    this.ttlMs = ttlMs;
    this.clock = clock;
    this.tokens = new Map();
  }

  issueToken({ identityId, role, tenantId = "default-runtime-tenant", scopes = [] }) {
    const issuedAt = this.clock();
    const expiresAt = new Date(issuedAt.getTime() + this.ttlMs);
    const token = `local_${role}_${identityId}_${issuedAt.getTime()}`;
    const metadata = {
      token,
      identityId,
      role,
      tenantId,
      scopes,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      readonly: true,
      tokenType: "local-simulated-token",
      externalProvider: false
    };
    this.tokens.set(token, metadata);
    return metadata;
  }

  validateToken(token) {
    const metadata = this.tokens.get(token);
    if (!metadata) {
      return {
        valid: false,
        reason: "token-not-found",
        readonly: true,
        externalProvider: false
      };
    }

    const expired = new Date(metadata.expiresAt).getTime() <= this.clock().getTime();
    return {
      valid: !expired,
      reason: expired ? "token-expired" : "local-token-valid",
      metadata,
      expiration: {
        issuedAt: metadata.issuedAt,
        expiresAt: metadata.expiresAt,
        expired
      },
      readonly: true,
      externalProvider: false
    };
  }
}

module.exports = {
  RuntimeTokenManager
};
