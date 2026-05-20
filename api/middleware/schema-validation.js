const { requestValidationMiddleware, safeQueryParserMiddleware } = require('../validators/request-validator');
const { responseSchemaMiddleware } = require('../validators/response-validator');

function schemaValidationMiddleware({ querySchema = 'empty', responseSchema }) {
  const validateRequest = requestValidationMiddleware(querySchema);
  const setResponseSchema = responseSchemaMiddleware(responseSchema);

  return (req, res, next) => {
    setResponseSchema(req, res, (responseSchemaError) => {
      if (responseSchemaError) {
        return next(responseSchemaError);
      }

      return validateRequest(req, res, next);
    });
  };
}

module.exports = {
  safeQueryParserMiddleware,
  schemaValidationMiddleware
};
