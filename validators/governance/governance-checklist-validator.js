const fs = require("node:fs");
const path = require("node:path");

const REQUIRED_DOCUMENTS = [
  {
    file: "governance/platform-architecture-principles.md",
    sections: [
      "Enterprise Vision",
      "Mandatory Principles",
      "Forbidden Anti-Patterns",
      "Architecture Criteria",
      "Runtime Criteria",
      "Persistence Criteria",
      "Observability Criteria",
      "Fallback Criteria",
      "Project Isolation Criteria",
      "Backward Compatibility Criteria",
      "Operational Security Criteria"
    ]
  },
  {
    file: "governance/enterprise-review-checklist.md",
    sections: [
      "Architecture",
      "Modularity",
      "Persistence",
      "Observability",
      "Fallback",
      "Validation",
      "Runtime Impact",
      "Memory Impact",
      "Runtime-Data Impact",
      "Project Impact",
      "Coupling Risk",
      "Rollback"
    ]
  },
  {
    file: "governance/runtime-quality-gates.md",
    sections: [
      "Architecture Gate",
      "Runtime Gate",
      "Persistence Gate",
      "Observability Gate",
      "Fallback Gate",
      "Project Isolation Gate",
      "Backward Compatibility Gate",
      "Operational Security Gate",
      "Validation Gate"
    ]
  },
  {
    file: "governance/roadmap-governance.md",
    sections: [
      "Roadmap Principles",
      "Feature Intake Criteria",
      "Architecture Review Criteria",
      "Runtime Review Criteria",
      "Persistence Review Criteria",
      "Observability Review Criteria",
      "Security Review Criteria",
      "Release Criteria",
      "Roadmap Decision Records"
    ]
  },
  {
    file: "governance/change-approval-policy.md",
    sections: [
      "Change Classes",
      "Approval Criteria",
      "Mandatory Human Approval",
      "Compatibility Policy",
      "Rollback Policy",
      "Operational Security Policy"
    ]
  },
  {
    file: "docs/platform/enterprise-architecture-governance-v1.md",
    sections: [
      "Objetivo",
      "Arquivos",
      "Visao Enterprise",
      "Principios Obrigatorios",
      "Anti-Patterns Proibidos",
      "Checklist de Feature",
      "Quality Gates",
      "Validacao",
      "Fallback Seguro",
      "Proximos Passos"
    ]
  }
];

function hasHeading(content, section) {
  const headingPattern = new RegExp(`^#{1,6}\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
  return headingPattern.test(content);
}

function validateGovernance(rootDir = process.cwd()) {
  const errors = [];
  const checked = [];

  for (const document of REQUIRED_DOCUMENTS) {
    const fullPath = path.join(rootDir, document.file);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Missing required governance file: ${document.file}`);
      checked.push({
        file: document.file,
        exists: false,
        missingSections: document.sections
      });
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const missingSections = document.sections.filter((section) => !hasHeading(content, section));
    if (missingSections.length > 0) {
      errors.push(`Missing sections in ${document.file}: ${missingSections.join(", ")}`);
    }

    checked.push({
      file: document.file,
      exists: true,
      requiredSections: document.sections.length,
      missingSections
    });
  }

  return {
    valid: errors.length === 0,
    checked,
    errors
  };
}

if (require.main === module) {
  const result = validateGovernance();
  console.log(JSON.stringify(result, null, 2));

  if (!result.valid) {
    process.exitCode = 1;
  }
}

module.exports = {
  validateGovernance
};
