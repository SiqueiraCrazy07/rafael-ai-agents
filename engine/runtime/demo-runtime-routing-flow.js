const { RuntimeEngine } = require("./runtime-engine");
const { STATES } = require("../state/state-machine");
const { WorkflowExecutionGraph } = require("../../orchestrator/execution-graphs/workflow-execution-graph");
const { HandoffEngine } = require("../../orchestrator/handoffs/handoff-engine");
const { ExecutionPlanBuilder } = require("../../orchestrator/planner/execution-plan-builder");
const { QueueManager } = require("../../orchestrator/queues/queue-manager");
const { RuntimeRouter } = require("../../orchestrator/runtime-router/runtime-router");
const { RoutingValidator } = require("../../orchestrator/runtime-router/routing-validator");
const { RouterTelemetry } = require("../../orchestrator/runtime-router/router-telemetry");
const { SupervisorHealthScoreProvider } = require("../../orchestrator/runtime-router/supervisor-health-score-provider");
const { writeEnforcementIntegrationReport } = require("../../runtime/optimization/enforcement/enforcement-integration-writer");
const { OptimizationEnforcementReader } = require("../../runtime/optimization/enforcement/optimization-enforcement-reader");
const { writeMemoryJson } = require("../memory/execution-memory-writer");

function applyOptimizationEnforcementToRouting(routingDecision, optimizationEnforcement) {
  if (!optimizationEnforcement.available) {
    return {
      decision: routingDecision,
      applied: false,
      fallback: "no-optimization-enforcement-report",
      avoidedAgents: []
    };
  }

  const avoidedAgents = new Set(optimizationEnforcement.agentIdsToAvoid || []);
  const availableCandidates = routingDecision.candidates.filter(
    (candidate) => !avoidedAgents.has(candidate.agentId)
  );

  if (availableCandidates.length === 0) {
    return {
      decision: {
        ...routingDecision,
        optimizationEnforcement: {
          applied: false,
          fallback: "all-candidates-avoided",
          avoidedAgents: [...avoidedAgents]
        }
      },
      applied: false,
      fallback: "all-candidates-avoided",
      avoidedAgents: [...avoidedAgents]
    };
  }

  const selected = availableCandidates[0];
  return {
    decision: {
      ...routingDecision,
      selectedAgent: selected.agentId,
      selectedAgentName: selected.name,
      score: selected.score,
      candidates: availableCandidates,
      reason: `${selected.reasons.join("; ")}; optimization-enforcement:avoided=${[...avoidedAgents].join(",")}`,
      optimizationEnforcement: {
        applied: true,
        enforcementId: optimizationEnforcement.enforcementId,
        avoidedAgents: [...avoidedAgents],
        avoidedWorkers: optimizationEnforcement.workersToAvoid
      }
    },
    applied: true,
    fallback: null,
    avoidedAgents: [...avoidedAgents]
  };
}

async function runRoutingDemo() {
  const queue = new QueueManager();
  const router = new RuntimeRouter({
    healthScoreProvider: new SupervisorHealthScoreProvider()
  });
  const routingValidator = new RoutingValidator();
  const planner = new ExecutionPlanBuilder();
  const graphBuilder = new WorkflowExecutionGraph();
  const handoffEngine = new HandoffEngine();
  const routerTelemetry = new RouterTelemetry();
  const runtime = new RuntimeEngine();
  const optimizationEnforcement = new OptimizationEnforcementReader().readLatest();

  const queueItem = queue.enqueue({
    project: "promoclub007",
    workflow: "offers-publish",
    objective: "Gerar cache validado de ofertas para futura publicacao.",
    priority: "p1",
    criticidade: "high",
    payload: {
      taskType: "backend automation publish",
      capabilities: ["backend", "cache", "ofertas", "qa"],
      requiredPermissions: ["read", "run-local-validation"]
    }
  });

  const dequeued = queue.dequeue();
  const request = {
    project: dequeued.project,
    workflow: dequeued.workflow,
    objective: dequeued.objective,
    criticidade: dequeued.criticidade,
    taskType: dequeued.payload.taskType,
    capabilities: dequeued.payload.capabilities,
    requiredPermissions: dequeued.payload.requiredPermissions
  };

  const originalRoutingDecision = router.route(request);
  const routingEnforcement = applyOptimizationEnforcementToRouting(
    originalRoutingDecision,
    optimizationEnforcement
  );
  const routingDecision = routingEnforcement.decision;
  const routingValidation = routingValidator.validateDecision(routingDecision);
  if (!routingValidation.valid) {
    throw new Error(`Invalid routing decision: ${routingValidation.errors.join(", ")}`);
  }

  const supportAgent =
    ["site-qa-agent", "site-backend-agent", "site-ofertas-agent"].find(
      (agentId) =>
        !optimizationEnforcement.agentIdsToAvoid?.includes(agentId) &&
        agentId !== routingDecision.selectedAgent
    ) || routingDecision.selectedAgent;
  const plan = planner.buildPlan({
    request,
    routingDecision,
    supportingAgents: [supportAgent]
  });
  const graph = graphBuilder.build(plan);
  const telemetry = routerTelemetry.summarize({
    queueItem: dequeued,
    routingDecision,
    plan,
    graph
  });

  let execution = await runtime.startExecution({
    workflow: request.workflow,
    project: request.project,
    agents: plan.agents,
    priority: dequeued.priority,
    criticidade: dequeued.criticidade,
    metadata: {
      queueId: dequeued.queueId,
      routingDecisionId: routingDecision.decisionId,
      planId: plan.planId,
      graphId: graph.graphId
    },
    risks: [
      {
        level: "high",
        description: "Publish workflow requires QA before real deployment.",
        mitigation: "Demo only creates runtime routing artifacts."
      }
    ]
  });

  await runtime.transition(execution, STATES.ROUTED, {
    selectedAgent: routingDecision.selectedAgent,
    routingDecisionId: routingDecision.decisionId
  });
  await runtime.transition(execution, STATES.RUNNING, {
    planId: plan.planId
  });
  await runtime.createCheckpoint(execution, {
    summary: "Routing plan created before handoff.",
    artifacts: ["orchestrator/runtime-router", "orchestrator/planner"],
    data: { routingDecision, plan, graph, telemetry }
  });

  const handoff = handoffEngine.createHandoff({
    executionId: execution.executionId,
    fromAgent: routingDecision.selectedAgent,
    toAgent: supportAgent,
    context: {
      project: request.project,
      workflow: request.workflow,
      objective: request.objective,
      summary: "Backend publish planning complete; QA validation required.",
      risks: execution.risks,
      nextAction: "Validate generated cache before publish."
    }
  });

  await runtime.createCheckpoint(execution, {
    summary: "Runtime handoff object created.",
    artifacts: ["orchestrator/handoffs"],
    data: { handoff }
  });
  await runtime.transition(execution, STATES.VALIDATED, {
    validation: "routing-and-handoff-validation"
  });
  const completed = await runtime.completeExecution(execution, [
    {
      name: "routing-decision",
      type: "object",
      path: `runtime-data/executions/${execution.executionId}.json`,
      summary: "Runtime-aware routing demo persisted."
    }
  ]);
  const routingMemoryPath = writeMemoryJson("memory/routing-decisions", "routing-decision", {
    createdAt: new Date().toISOString(),
    queueItem: dequeued,
    request,
    routingDecision,
    plan,
    graph,
    handoff,
    optimizationEnforcement: {
      available: optimizationEnforcement.available,
      enforcementId: optimizationEnforcement.enforcementId,
      applied: routingEnforcement.applied,
      fallback: routingEnforcement.fallback,
      avoidedAgents: routingEnforcement.avoidedAgents,
      avoidedWorkers: optimizationEnforcement.workersToAvoid || []
    },
    runtime: {
      executionId: completed.execution.executionId,
      status: completed.execution.status,
      telemetry: completed.telemetry
    }
  });
  const executionMemoryPath = writeMemoryJson("memory/executions", "execution-summary", {
    createdAt: new Date().toISOString(),
    executionId: completed.execution.executionId,
    workflow: completed.execution.workflow,
    project: completed.execution.project,
    agents: completed.execution.agents,
    status: completed.execution.status,
    checkpoints: completed.execution.checkpoints.length,
    telemetry: completed.telemetry
  });
  const integrationPaths = writeEnforcementIntegrationReport("router", {
    integrationId: `router_enforcement_integration_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    optimizationEnforcement: {
      available: optimizationEnforcement.available,
      enforcementId: optimizationEnforcement.enforcementId,
      sourcePath: optimizationEnforcement.sourcePath,
      avoidedAgents: routingEnforcement.avoidedAgents,
      avoidedWorkers: optimizationEnforcement.workersToAvoid || [],
      fallback: routingEnforcement.fallback
    },
    originalRoutingDecision: {
      selectedAgent: originalRoutingDecision.selectedAgent,
      candidates: originalRoutingDecision.candidates
    },
    finalRoutingDecision: {
      selectedAgent: routingDecision.selectedAgent,
      candidates: routingDecision.candidates
    }
  });

  console.log(
    JSON.stringify(
      {
        queueItem: {
          queueId: queueItem.queueId,
          priority: queueItem.priority,
          status: dequeued.status
        },
        routingDecision: {
          status: routingDecision.status,
          selectedAgent: routingDecision.selectedAgent,
          selectedAgentHealthScore: routingDecision.candidates.find(
            (candidate) => candidate.agentId === routingDecision.selectedAgent
          )?.healthScore,
          reason: routingDecision.reason,
          candidates: routingDecision.candidates.slice(0, 3)
        },
        optimizationEnforcement: {
          available: optimizationEnforcement.available,
          enforcementId: optimizationEnforcement.enforcementId,
          applied: routingEnforcement.applied,
          fallback: routingEnforcement.fallback,
          avoidedAgents: routingEnforcement.avoidedAgents,
          avoidedWorkers: optimizationEnforcement.workersToAvoid || []
        },
        plan: {
          planId: plan.planId,
          agents: plan.agents,
          gates: plan.gates
        },
        graph: {
          graphId: graph.graphId,
          nodes: graph.nodes,
          edges: graph.edges
        },
        handoff: {
          handoffId: handoff.handoffId,
          fromAgent: handoff.fromAgent,
          toAgent: handoff.toAgent
        },
        runtime: {
          executionId: completed.execution.executionId,
          status: completed.execution.status,
          checkpoints: completed.execution.checkpoints.length,
          telemetry: completed.telemetry
        },
        memory: {
          routingDecision: routingMemoryPath,
          executionSummary: executionMemoryPath,
          enforcementIntegration: integrationPaths
        }
      },
      null,
      2
    )
  );
}

runRoutingDemo().catch((error) => {
  console.error(`Runtime routing demo failed: ${error.message}`);
  process.exitCode = 1;
});
