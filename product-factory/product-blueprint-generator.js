class ProductBlueprintGenerator {
  generate({ parsedRequest, classification, template, learningFramework }) {
    const productName = this.productNameFor(template, parsedRequest);
    const isEducation = classification.categories.includes("education");
    const isHealthcare = classification.categories.includes("healthcare");

    return {
      blueprintId: `product_blueprint_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      productName,
      templateId: template.templateId,
      objective: this.objectiveFor(classification.primaryCategory, productName),
      targetAudience: template.targetAudience,
      personas: this.personasFor(classification.categories),
      requirements: [
        "readonly-safe prototype planning",
        "clear onboarding flow",
        "role-aware dashboard",
        "audit-friendly data model",
        "fallback JSON compatible reporting",
        isHealthcare ? "sensitive health data isolation metadata" : null,
        isEducation ? "learning outcomes and progress tracking" : null
      ].filter(Boolean),
      features: template.coreFeatures,
      mvp: {
        scope: "first usable prototype",
        features: template.mvpFeatures,
        nonGoals: ["real payments", "production deployment", "destructive automation", "external public API"]
      },
      ux: {
        primaryJourney: this.primaryJourneyFor(classification.primaryCategory),
        screens: this.screensFor(classification.categories),
        contentSystem: ["empty states", "success states", "guided onboarding", "admin copy", "analytics labels"]
      },
      roadmap: [],
      learningFramework,
      readonly: true,
      destructiveActions: false,
      safetyMode: "readonly-safe-product-blueprint"
    };
  }

  productNameFor(template, parsedRequest) {
    if (template.templateId === "english-learning-platform") return "English Learning Platform";
    if (template.templateId === "clinic-platform") return "Clinic Operations Platform";
    return template.templateId.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join(" ");
  }

  objectiveFor(category, productName) {
    const objectives = {
      education: `Help users learn through structured practice, feedback and measurable progress in ${productName}.`,
      game: `Create an engaging learning game with clear goals, progression and feedback loops.`,
      crm: "Organize leads, customers, pipeline activity and operational follow-up in one workspace.",
      scheduling: "Let users book, manage and monitor appointments with safe operational visibility.",
      healthcare: "Support clinic workflows with patient, appointment and care metadata in a governed system.",
      business: "Turn a high-level business request into a usable product workflow and operating dashboard."
    };
    return objectives[category] || objectives.business;
  }

  personasFor(categories) {
    const personas = [
      { name: "Owner", goal: "understand product value and operational metrics" },
      { name: "Operator", goal: "run daily workflows with minimal friction" },
      { name: "End User", goal: "complete the core task quickly and confidently" }
    ];
    if (categories.includes("education")) {
      personas.push({ name: "Learner", goal: "practice, receive feedback and improve over time" });
      personas.push({ name: "Instructor", goal: "track progress and identify learning gaps" });
    }
    if (categories.includes("healthcare")) {
      personas.push({ name: "Clinic Admin", goal: "manage schedule and patient flow" });
    }
    return personas;
  }

  primaryJourneyFor(category) {
    const journeys = {
      education: "diagnose skill level -> assign path -> practice -> review -> track mastery",
      game: "start mission -> learn mechanic -> solve challenge -> receive feedback -> unlock next level",
      crm: "capture lead -> qualify -> move through pipeline -> schedule follow-up -> review outcome",
      scheduling: "choose service -> select availability -> confirm booking -> receive reminder -> manage changes",
      healthcare: "register patient -> schedule visit -> record notes -> review dashboard",
      business: "configure workspace -> capture data -> execute workflow -> inspect dashboard"
    };
    return journeys[category] || journeys.business;
  }

  screensFor(categories) {
    const screens = ["onboarding", "home dashboard", "detail view", "settings", "analytics"];
    if (categories.includes("education")) screens.push("lesson player", "practice review", "mastery map");
    if (categories.includes("scheduling")) screens.push("calendar", "booking flow");
    if (categories.includes("crm")) screens.push("pipeline board", "contact profile");
    if (categories.includes("healthcare")) screens.push("patient profile", "visit notes");
    return [...new Set(screens)];
  }
}

module.exports = {
  ProductBlueprintGenerator
};
