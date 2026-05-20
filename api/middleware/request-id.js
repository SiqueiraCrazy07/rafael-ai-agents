const crypto = require('crypto');

function createRequestId() {
  return `api_req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function requestIdMiddleware(req, res, next) {
  const incomingRequestId = req.headers && (req.headers['x-request-id'] || req.headers['X-Request-Id']);
  const requestId = incomingRequestId || createRequestId();

  req.requestId = requestId;
  res.locals = res.locals || {};
  res.locals.requestId = requestId;

  if (typeof res.setHeader === 'function') {
    res.setHeader('x-request-id', requestId);
  }

  next();
}

module.exports = {
  createRequestId,
  requestIdMiddleware
};
