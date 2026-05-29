const CATEGORY_RULES = {
  education: ["educacao", "educativo", "aprender", "ensino", "curso", "ingles", "alfabetizacao", "matematica"],
  game: ["jogo", "game", "gamificado", "missao", "fase"],
  business: ["negocio", "empresa", "vendas", "operacao", "lead", "cliente"],
  crm: ["crm", "pipeline", "vendas", "contatos", "deals"],
  scheduling: ["agendamento", "agenda", "booking", "horario", "consulta", "barbearia"],
  healthcare: ["clinica", "clinic", "paciente", "medico", "consulta", "saude"],
  coaching: ["coach", "mentoria", "treino", "habito", "acompanhamento"],
  ecommerce: ["ecommerce", "loja", "checkout", "produto", "carrinho"],
  marketplace: ["marketplace", "oferta", "fornecedor", "lead", "campanha"]
};

class ProductClassifier {
  classify(parsedRequest) {
    const text = parsedRequest.normalizedText || "";
    const scores = Object.entries(CATEGORY_RULES).map(([category, keywords]) => ({
      category,
      score: keywords.filter((keyword) => text.includes(keyword)).length,
      evidence: keywords.filter((keyword) => text.includes(keyword))
    }));
    const categories = scores
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((item) => item.category);
    const primaryCategory = this.primaryCategoryFor(text, categories);

    return {
      classificationId: `product_classification_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      primaryCategory,
      categories: [...new Set([primaryCategory, ...categories])],
      scores,
      confidence: categories.length ? "medium" : "low",
      readonly: true,
      fallback: categories.length ? null : { safeMode: true, reason: "category-inferred-from-generic-business-template" },
      safetyMode: "readonly-safe-product-classifier"
    };
  }

  primaryCategoryFor(text, categories) {
    if (text.includes("jogo") || text.includes("game")) return "game";
    if (text.includes("crm")) return "crm";
    if (text.includes("clinica") || text.includes("clinic")) return "healthcare";
    if (text.includes("agendamento") || text.includes("agenda") || text.includes("booking")) return "scheduling";
    return categories[0] || "business";
  }
}

module.exports = {
  ProductClassifier,
  CATEGORY_RULES
};
