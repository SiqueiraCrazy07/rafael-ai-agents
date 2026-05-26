class RuntimeSessionManager {
  constructor({ sessionTtlMs = 30 * 60 * 1000, staleAfterMs = 10 * 60 * 1000, clock = () => new Date() } = {}) {
    this.sessionTtlMs = sessionTtlMs;
    this.staleAfterMs = staleAfterMs;
    this.clock = clock;
    this.sessions = new Map();
  }

  createSession({ identityId, role, token, tenantId }) {
    const now = this.clock();
    const session = {
      sessionId: `runtime_session_${now.getTime()}_${Math.random().toString(16).slice(2, 8)}`,
      identityId,
      role,
      token,
      tenantId,
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.sessionTtlMs).toISOString(),
      readonly: true,
      status: "active"
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  touchSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { ok: false, reason: "session-not-found" };
    }
    session.lastSeenAt = this.clock().toISOString();
    return { ok: true, session };
  }

  evaluateSessions() {
    const now = this.clock().getTime();
    return [...this.sessions.values()].map((session) => {
      const expired = new Date(session.expiresAt).getTime() <= now;
      const stale = now - new Date(session.lastSeenAt).getTime() > this.staleAfterMs;
      return {
        ...session,
        expired,
        stale,
        status: expired ? "expired" : stale ? "stale" : "active",
        auditRecommendation: expired || stale ? "require-local-reauthentication-before-sensitive-read" : "session-valid"
      };
    });
  }
}

module.exports = {
  RuntimeSessionManager
};
