const prototype = {
  "productName": "Chatbot Platform",
  "category": "business",
  "features": [
    "FAQ bot",
    "conversation history",
    "admin prompts"
  ]
};

function readPrototype() {
  return { ok: true, readonly: true, prototype };
}

module.exports = { readPrototype };
