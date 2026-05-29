const DESTRUCTIVE_TERMS = ["delete", "destroy", "drop table", "rm -rf", "deploy now", "publish now"];

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

class ProductRequestParser {
  parse(input = {}) {
    const rawRequest = typeof input === "string" ? input : input.request || "";
    const normalizedText = normalizeText(rawRequest);
    const tokens = normalizedText.split(" ").filter(Boolean);
    const destructiveTerms = DESTRUCTIVE_TERMS.filter((term) => normalizedText.includes(term));
    const requestType = tokens.includes("criar") || tokens.includes("create") || tokens.includes("gerar")
      ? "create-product"
      : "product-discovery";

    return {
      requestId: input.requestId || `product_request_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      rawRequest,
      normalizedText,
      language: /[a-z]/.test(normalizedText) ? "pt-or-en" : "unknown",
      requestType,
      tokens,
      constraints: {
        readonly: true,
        destructiveActions: false,
        destructiveTerms,
        blocked: destructiveTerms.length > 0
      },
      extractedIntent: {
        verb: requestType,
        productHint: tokens.filter((token) => !["criar", "create", "gerar", "sistema", "plataforma", "de", "um", "uma"].includes(token)).join(" "),
        needsPrototype: true,
        needsBlueprint: true
      },
      fallback: rawRequest
        ? null
        : { safeMode: true, reason: "empty-product-request" },
      safetyMode: "readonly-safe-product-request-parser"
    };
  }
}

module.exports = {
  ProductRequestParser,
  normalizeText
};
