const prototype = {
  "productName": "Educational Game",
  "category": "game",
  "features": [
    "core mechanic",
    "3 levels",
    "score feedback",
    "learning summary"
  ]
};

function readPrototype() {
  return { ok: true, readonly: true, prototype };
}

module.exports = { readPrototype };
