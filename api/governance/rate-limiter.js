const buckets = new Map();

function getRateConfig(req) {
  const apiConfig = req.app && req.app.locals && req.app.locals.api;

  return {
    windowMs: (apiConfig && apiConfig.rateLimit && apiConfig.rateLimit.windowMs) || 60000,
    maxRequests: (apiConfig && apiConfig.rateLimit && apiConfig.rateLimit.maxRequests) || 60
  };
}

function getBucketKey(req) {
  const clientId = req.auth && req.auth.client && req.auth.client.clientId;
  return clientId || 'anonymous';
}

function rateLimitMiddleware(req, res, next) {
  const now = Date.now();
  const config = getRateConfig(req);
  const bucketKey = getBucketKey(req);
  const existing = buckets.get(bucketKey);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + config.windowMs };

  bucket.count += 1;
  buckets.set(bucketKey, bucket);

  req.rateLimit = {
    clientId: bucketKey,
    limit: config.maxRequests,
    remaining: Math.max(config.maxRequests - bucket.count, 0),
    resetAt: new Date(bucket.resetAt).toISOString()
  };

  res.setHeader('x-ratelimit-limit', String(config.maxRequests));
  res.setHeader('x-ratelimit-remaining', String(req.rateLimit.remaining));
  res.setHeader('x-ratelimit-reset', req.rateLimit.resetAt);

  if (bucket.count <= config.maxRequests) {
    return next();
  }

  return res.safe({
    rateLimit: req.rateLimit
  }, {
    status: 'error',
    statusCode: 429,
    fallback: {
      safeMode: true,
      reason: 'rate-limit-exceeded',
      runtimeInternalUnaffected: true
    },
    skipResponseValidation: true
  });
}

function resetRateLimiter() {
  buckets.clear();
}

module.exports = {
  rateLimitMiddleware,
  resetRateLimiter
};
