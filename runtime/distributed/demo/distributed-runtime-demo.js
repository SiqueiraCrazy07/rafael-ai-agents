const { DistributedRuntimeCoordinator } = require("../distributed-runtime-coordinator");

function runDistributedRuntimeDemo() {
  const coordinator = new DistributedRuntimeCoordinator({ rootDir: process.cwd() });
  return coordinator.runDemo();
}

if (require.main === module) {
  console.log(JSON.stringify(runDistributedRuntimeDemo(), null, 2));
}

module.exports = {
  runDistributedRuntimeDemo
};
