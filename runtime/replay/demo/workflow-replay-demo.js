const { runExecutionPersistenceDemo } = require("../../execution-persistence/demo/execution-persistence-demo");
const { WorkflowReplayEngine } = require("../workflow-replay-engine");

function runWorkflowReplayDemo() {
  const seed = runExecutionPersistenceDemo();
  const filters = seed.replayMetadata.filters;
  const engine = new WorkflowReplayEngine({ rootDir: process.cwd() });
  const byExecution = engine.replay({ executionId: filters.executionId });
  const byWorkflow = engine.replay({ workflowId: filters.workflowId });
  const byCorrelation = engine.replay({ correlationId: filters.correlationId });

  const report = {
    workflowReplayDemoId: `workflow_replay_demo_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    status:
      byExecution.validation.valid && byExecution.timeline.total > 0
        ? "workflow_replay_demo_passed"
        : "workflow_replay_demo_attention",
    readonly: true,
    destructiveActions: false,
    seededExecution: {
      executionId: filters.executionId,
      workflowId: filters.workflowId,
      correlationId: filters.correlationId
    },
    replayPlan: byExecution.plan,
    timeline: {
      total: byExecution.timeline.total,
      stages: byExecution.timeline.stages
    },
    loaded: byExecution.loaded,
    eventsLoaded: byExecution.events,
    checkpointsLoaded: byExecution.checkpoints,
    validation: byExecution.validation,
    audits: {
      byExecution: byExecution.audit,
      byWorkflow: byWorkflow.audit,
      byCorrelation: byCorrelation.audit
    },
    replayModes: {
      byExecution: {
        status: byExecution.status,
        timelineItems: byExecution.timeline.total
      },
      byWorkflow: {
        status: byWorkflow.status,
        timelineItems: byWorkflow.timeline.total
      },
      byCorrelation: {
        status: byCorrelation.status,
        timelineItems: byCorrelation.timeline.total
      }
    },
    integrations: byExecution.integrations,
    fallback: byExecution.fallback,
    risks: [
      "replay is reconstruction-only and does not execute workflow handlers",
      "database remains additive; JSON fallback is the replay source of record",
      "cross-process ordering depends on persisted event metadata quality"
    ]
  };

  return report;
}

if (require.main === module) {
  console.log(JSON.stringify(runWorkflowReplayDemo(), null, 2));
}

module.exports = {
  runWorkflowReplayDemo
};
