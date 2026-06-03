const fs = require("node:fs");
const path = require("node:path");

class ProductDemoGenerator {
  generate({ folder, productPlan, ux, backlog, curriculum }) {
    const demo = {
      demoId: `product_demo_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      productName: productPlan.blueprint.productName,
      category: productPlan.classification.primaryCategory,
      screens: ux.screens,
      sampleData: {
        mvpFeatures: productPlan.blueprint.mvp.features,
        firstBacklogItems: backlog.tasks.slice(0, 5),
        curriculumGenerated: curriculum.generated
      },
      prototypeMode: "documentation-and-json-only",
      readonly: true,
      deployExecuted: false,
      safetyMode: "readonly-safe-product-demo-generator"
    };
    const demoPath = path.join(folder.projectRoot, "frontend", "prototype-demo.json");
    fs.mkdirSync(path.dirname(demoPath), { recursive: true });
    fs.writeFileSync(demoPath, `${JSON.stringify(demo, null, 2)}\n`, "utf8");
    return {
      ...demo,
      demoPath
    };
  }
}

module.exports = {
  ProductDemoGenerator
};
