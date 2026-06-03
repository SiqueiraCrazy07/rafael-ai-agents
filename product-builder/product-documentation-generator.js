const fs = require("node:fs");
const path = require("node:path");

function writeText(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
  return filePath;
}

function list(items = []) {
  return items.map((item) => `- ${typeof item === "string" ? item : item.name || item.title || JSON.stringify(item)}`).join("\n");
}

class ProductDocumentationGenerator {
  generate({ project, folder, productPlan, ux, curriculum, backlog, assets }) {
    const docsDir = path.join(folder.projectRoot, "docs");
    const roadmapDir = path.join(folder.projectRoot, "roadmap");
    const uxDir = path.join(folder.projectRoot, "ux");
    const curriculumDir = path.join(folder.projectRoot, "curriculum");
    const assetsDir = path.join(folder.projectRoot, "assets");
    const testsDir = path.join(folder.projectRoot, "tests");
    const written = [];

    written.push(writeText(path.join(folder.projectRoot, "README.md"), `
# ${project.projectName}

Generated prototype from Product Builder Execution Runtime V1.

## Objective

${productPlan.blueprint.objective}

## MVP

${list(productPlan.blueprint.mvp.features)}

## Safety

- readonly-safe: true
- deploy executed: false
- destructive actions: false
- JSON fallback preserved
`));

    written.push(writeText(path.join(docsDir, "architecture.md"), `
# Architecture

## Frontend
${productPlan.architecture.frontend.appType}

## Backend
${productPlan.architecture.backend.style}

## Database
${productPlan.architecture.database.primary}

## APIs
${list(productPlan.architecture.apis)}

## Dashboards
${list(productPlan.architecture.dashboards)}
`));

    written.push(writeText(path.join(docsDir, "roadmap.md"), this.roadmapMarkdown(productPlan.roadmap.phases)));
    written.push(writeText(path.join(roadmapDir, "roadmap.md"), this.roadmapMarkdown(productPlan.roadmap.phases)));
    written.push(writeText(path.join(docsDir, "backlog.md"), this.backlogMarkdown(backlog)));
    written.push(writeText(path.join(docsDir, "implementation-plan.md"), `
# Implementation Plan

${list(productPlan.roadmap.implementationPlan)}

## Human Gates

- production deployment
- real payment or external API integration
- regulated healthcare review
`));
    written.push(writeText(path.join(uxDir, "ux-spec.md"), this.uxMarkdown(ux)));
    written.push(writeText(path.join(curriculumDir, "curriculum.md"), this.curriculumMarkdown(curriculum)));
    written.push(writeText(path.join(assetsDir, "assets-plan.md"), this.assetsMarkdown(assets)));
    written.push(writeText(path.join(testsDir, "readiness-checklist.md"), `
# Readiness Checklist

- Documentation present
- Architecture present
- UX present
- Curriculum evaluated
- Backlog present
- Implementation plan present
- Deploy not executed
`));

    return {
      documentationId: `product_docs_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      files: written,
      readonly: true,
      safetyMode: "readonly-safe-product-documentation-generator"
    };
  }

  roadmapMarkdown(phases) {
    return `# Roadmap\n\n${phases.map((phase) => `## ${phase.phase}\n\nDuration: ${phase.duration}\n\n${list(phase.outcomes)}`).join("\n\n")}`;
  }

  backlogMarkdown(backlog) {
    return `# Backlog\n\n${backlog.epics.map((epic) => `## P${epic.priority} ${epic.epic}\n\n${list(epic.features)}`).join("\n\n")}`;
  }

  uxMarkdown(ux) {
    return `# UX Specification\n\n## Personas\n${list(ux.personas.map((persona) => `${persona.name}: ${persona.goal}`))}\n\n## Screens\n${list(ux.screens)}\n\n## Wireframes\n${ux.wireframes.map((wireframe) => `- ${wireframe.screen}: ${wireframe.layout}`).join("\n")}`;
  }

  curriculumMarkdown(curriculum) {
    if (!curriculum.generated) {
      return `# Curriculum\n\nCurriculum not required for this product.\n\nReason: ${curriculum.reason}`;
    }
    return `# Curriculum\n\n## Objectives\n${list(curriculum.pedagogicalObjectives)}\n\n## Levels\n${curriculum.levels.map((level) => `- ${level.level}: ${level.goal} (${level.masteryThreshold})`).join("\n")}\n\n## Modules\n${curriculum.modules.map((module) => `- ${module.title}: ${module.progression.join(" -> ")}`).join("\n")}`;
  }

  assetsMarkdown(assets) {
    return `# Assets Plan\n\n## Images\n${list(assets.images)}\n\n## Illustrations\n${list(assets.illustrations)}\n\n## Icons\n${list(assets.icons)}\n\n## Characters\n${list(assets.characters)}\n\n## Audio\n${list(assets.audio)}\n\n## Animations\n${list(assets.animations)}`;
  }
}

module.exports = {
  ProductDocumentationGenerator,
  writeText
};
