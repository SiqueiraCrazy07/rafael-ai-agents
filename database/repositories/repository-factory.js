const { ApiGovernanceAuditRepository } = require('./api-governance-audit-repository');
const { DecisionsRepository } = require('./decisions-repository');
const { EventsRepository } = require('./events-repository');
const { RuntimeValidationRepository } = require('./runtime-validation-repository');
const { QueueRepository } = require('./queue-repository');
const { TransitionsRepository } = require('./transitions-repository');
const { WorkflowStateRepository } = require('./workflow-state-repository');

function createRepositories(adapter) {
  return {
    events: new EventsRepository(adapter),
    decisions: new DecisionsRepository(adapter),
    transitions: new TransitionsRepository(adapter),
    runtimeValidation: new RuntimeValidationRepository(adapter),
    queue: new QueueRepository(adapter),
    apiGovernanceAudit: new ApiGovernanceAuditRepository(adapter),
    workflowState: new WorkflowStateRepository(adapter)
  };
}

module.exports = {
  createRepositories
};
