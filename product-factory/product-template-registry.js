const TEMPLATES = [
  {
    templateId: "english-learning-platform",
    categories: ["education", "coaching"],
    keywords: ["ingles", "english", "idioma", "language"],
    targetAudience: ["adult beginners", "career learners", "students"],
    coreFeatures: ["placement test", "lesson path", "speaking practice", "progress dashboard"],
    mvpFeatures: ["diagnostic quiz", "daily micro-lessons", "vocabulary review", "learner dashboard"]
  },
  {
    templateId: "literacy-platform",
    categories: ["education"],
    keywords: ["alfabetizacao", "letramento", "literacy"],
    targetAudience: ["children", "early readers", "teachers"],
    coreFeatures: ["phonics path", "reading practice", "teacher dashboard", "family reports"],
    mvpFeatures: ["letter-sound activities", "reading levels", "progress cards"]
  },
  {
    templateId: "math-learning-platform",
    categories: ["education"],
    keywords: ["matematica", "math", "calculo"],
    targetAudience: ["students", "tutors", "schools"],
    coreFeatures: ["skill map", "practice sets", "worked examples", "mastery dashboard"],
    mvpFeatures: ["diagnostic test", "adaptive exercises", "hint system"]
  },
  {
    templateId: "educational-game",
    categories: ["education", "game"],
    keywords: ["jogo", "game", "educativo", "gamificado"],
    targetAudience: ["students", "families", "teachers"],
    coreFeatures: ["game loop", "levels", "missions", "learning objectives"],
    mvpFeatures: ["core mechanic", "3 levels", "score feedback", "learning summary"]
  },
  {
    templateId: "crm-platform",
    categories: ["business", "crm"],
    keywords: ["crm", "vendas", "pipeline", "cliente"],
    targetAudience: ["sales teams", "founders", "operations"],
    coreFeatures: ["contacts", "pipeline", "tasks", "reports"],
    mvpFeatures: ["contact list", "deal stages", "activity log", "basic dashboard"]
  },
  {
    templateId: "scheduling-platform",
    categories: ["scheduling", "business"],
    keywords: ["agendamento", "agenda", "booking", "horario"],
    targetAudience: ["service providers", "customers", "operators"],
    coreFeatures: ["calendar", "availability", "booking flow", "notifications"],
    mvpFeatures: ["service catalog", "time slots", "booking confirmation"]
  },
  {
    templateId: "chatbot-platform",
    categories: ["business", "coaching"],
    keywords: ["chatbot", "assistente", "bot", "conversa"],
    targetAudience: ["support teams", "customers", "operators"],
    coreFeatures: ["intent routing", "knowledge base", "handoff", "conversation analytics"],
    mvpFeatures: ["FAQ bot", "conversation history", "admin prompts"]
  },
  {
    templateId: "clinic-platform",
    categories: ["healthcare", "scheduling"],
    keywords: ["clinica", "clinic", "paciente", "consulta", "medico"],
    targetAudience: ["clinic admins", "patients", "health professionals"],
    coreFeatures: ["patient records", "appointments", "care notes", "clinic dashboard"],
    mvpFeatures: ["patient registry", "appointment calendar", "visit notes"]
  },
  {
    templateId: "barbershop-platform",
    categories: ["scheduling", "business"],
    keywords: ["barbearia", "barbershop", "cabeleireiro", "salao"],
    targetAudience: ["barbers", "clients", "shop owners"],
    coreFeatures: ["services", "barber calendar", "client history", "reminders"],
    mvpFeatures: ["service menu", "barber availability", "booking confirmation"]
  },
  {
    templateId: "lead-generation-platform",
    categories: ["business", "marketplace"],
    keywords: ["lead", "captacao", "landing", "funil"],
    targetAudience: ["marketing teams", "sales teams", "founders"],
    coreFeatures: ["landing pages", "lead forms", "scoring", "campaign dashboard"],
    mvpFeatures: ["lead form", "source tracking", "CSV export", "basic scoring"]
  }
];

class ProductTemplateRegistry {
  constructor(templates = TEMPLATES) {
    this.templates = templates;
  }

  listTemplates() {
    return this.templates.map((template) => ({ ...template }));
  }

  findBestMatch({ normalizedText = "", categories = [] } = {}) {
    const scored = this.templates.map((template) => {
      const keywordScore = template.keywords.filter((keyword) => normalizedText.includes(keyword)).length * 3;
      const categoryScore = template.categories.filter((category) => categories.includes(category)).length * 2;
      return { template, score: keywordScore + categoryScore };
    }).sort((left, right) => right.score - left.score);

    const best = scored[0];
    return best && best.score > 0
      ? { ...best.template, matchScore: best.score }
      : { ...this.templates.find((template) => template.templateId === "lead-generation-platform"), matchScore: 0 };
  }
}

module.exports = {
  ProductTemplateRegistry,
  TEMPLATES
};
