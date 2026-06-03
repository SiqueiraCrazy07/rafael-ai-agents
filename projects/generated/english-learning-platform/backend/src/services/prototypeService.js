const prototype = {
  "productName": "English Learning Platform",
  "category": "education",
  "features": [
    "diagnostic quiz",
    "daily micro-lessons",
    "vocabulary review",
    "learner dashboard"
  ]
};

function readPrototype() {
  return { ok: true, readonly: true, prototype };
}

module.exports = { readPrototype };
