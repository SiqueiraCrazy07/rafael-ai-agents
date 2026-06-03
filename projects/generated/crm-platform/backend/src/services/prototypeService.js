const prototype = {
  "productName": "Crm Platform",
  "category": "crm",
  "features": [
    "contact list",
    "deal stages",
    "activity log",
    "basic dashboard"
  ]
};

function readPrototype() {
  return { ok: true, readonly: true, prototype };
}

module.exports = { readPrototype };
