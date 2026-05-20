const { sendSafeResponse } = require('../responses/safe-response');

function safeResponseMiddleware(req, res, next) {
  res.safe = (payload, options = {}) => sendSafeResponse(res, payload, options);
  next();
}

module.exports = {
  safeResponseMiddleware
};
