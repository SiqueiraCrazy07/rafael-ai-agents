const { readPrototype } = require("../services/prototypeService");

function handle(request, response) {
  return response.json({ controller: "dashboardController", ...readPrototype() });
}

module.exports = {
  session: handle,
  list: handle,
  summary: handle
};
