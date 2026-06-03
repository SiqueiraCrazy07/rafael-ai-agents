const { readPrototype } = require("../services/prototypeService");

function handle(request, response) {
  return response.json({ controller: "authController", ...readPrototype() });
}

module.exports = {
  session: handle,
  list: handle,
  summary: handle
};
