const fs = require("node:fs");
const path = require("node:path");

const { MemoryLoader } = require("../../learning/analytics/memory-loader");
const { IncidentPatternAnalyzer } = require("../../learning/patterns/incident-pattern-analyzer");
const { WorkflowFailurePatternDetector } = require("../../learning/patterns/workflow-failure-pattern-detector");
const { RoutingDecisionAnalyzer } = require("../../learning/analytics/routing-decision-analyzer");
const { RecoveryEffectivenessAnalyzer } = require("../../learning/analytics/recovery-effectiveness-analyzer");
const { AgentReliabilityScorer } = require("../../learning/scoring/agent-reliability-scorer");
const { WorkflowRiskScorer } = require("../../learning/scoring/workflow-risk-scorer");
const { HistoricalStabilityAnalyzer } = require("../../learning/scoring/historical-stability-analyzer");
const { RecommendationEngine } = require("../../learning/recommendations/recommendation-engine");

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function timestampForFile(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+/, "");
}

function readJsonFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(directory, file);
      return {
        path: fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs,
        data: JSON.parse(fs.readFileSync(fullPath, "utf8"))
      };
    });
}

function readLatestJson(directory) {
  const files = readJsonFiles(directory).sort((left, right) => right.mtimeMs - left.mtimeMs);
  return files[0] || null;
}

function buildLearningOutput(rootDir) {
  const memory = new MemoryLoader(path.join(rootDir, "memory")).load();
  const incidentPatterns = new IncidentPatternAnalyzer().analyze(memory);
  const workflowFailures = new WorkflowFailurePatternDetector().detect(memory);
  const routingAnalysis = new RoutingDecisionAnalyzer().analyze(memory);
  const recoveryEffectiveness = new RecoveryEffectivenessAnalyzer().analyze(memory);
  const agentReliability = new AgentReliabilityScorer().score(memory);
  const workflowRisks = new WorkflowRiskScorer().score({
    incidentPatterns,
    workflowFailures
  });
  const historicalStability = new HistoricalStabilityAnalyzer().analyze(memory);
  const recommendations = new RecommendationEngine().generate({
    agentReliability,
    workflowRisks,
    recoveryEffectiveness,
    historicalStability
  });

  return {
    memoryLoaded: {
      incidents: memory.incidents.length,
      healthReports: memory.healthReports.length,
      workflowReports: memory.workflowReports.length,
      recoveryRecommendations: memory.recoveryRecommendations.length,
      routingDecisions: memory.routingDecisions.length,
      executions: memory.executions.length
    },
    incidentPatterns,
    workflowFailures,
    routingAnalysis,
    recoveryEffectiveness,
    agentReliability,
    workflowRisks,
    historicalStability,
    recommendations
  };
}

class RuntimePolicyEngine {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.runtimePolicyDir = options.runtimePolicyDir || path.join(this.rootDir, "runtime-data", "policies");
    this.memoryPolicyDir = options.memoryPolicyDir || path.join(this.rootDir, "memory", "policies");
    this.supervisorReportsDir =
      options.supervisorReportsDir || path.join(this.rootDir, "supervisor", "reports", "generated");
  }

  evaluate() {
    const generatedAt = new Date().toISOString();
    const learning = buildLearningOutput(this.rootDir);
    const latestSupervisorReport = readLatestJson(this.supervisorReportsDir);
    const supervisor = latestSupervisorReport ? latestSupervisorReport.data : null;

    const decisions = [
      ...this.applyUnstableAgentRoutingBlock(learning, supervisor),
      ...this.applyCriticalWorkflowHumanGate(learning, supervisor),
      ...this.applyAutomaticRollbackRecommendation(learning, supervisor),
      ...this.applyAdaptiveThrottling(learning, supervisor),
      ...this.applyRetryLimitProtection(learning, supervisor)
    ];

    const decision = {
      decisionId: `policy_${Date.now()}`,
      generatedAt,
      source: {
        learningMemoryLoaded: learning.memoryLoaded,
        supervisorReport: latestSupervisorReport ? latestSupervisorReport.path : null
      },
      status: decisions.length > 0 ? "policies_triggered" : "no_policy_triggered",
      policiesTriggered: [...new Set(decisions.map((item) => item.policy))],
      blockedWorkflows: decisions
        .filter((item) => item.effect === "block_workflow")
        .map((item) => item.target),
      penalizedAgents: decisions
        .filter((item) => item.effect === "penalize_agent" || item.effect === "block_agent")
        .map((item) => ({
          agentId: item.target,
          action: item.effect,
          penalty: item.penalty || null,
          reason: item.reason
        })),
      throttlingApplied: decisions
        .filter((item) => item.effect === "throttle")
        .map((item) => ({
          target: item.target,
          throttle: item.throttle,
          reason: item.reason
        })),
      rollbackRecommended: decisions
        .filter((item) => item.effect === "recommend_rollback")
        .map((item) => ({
          workflow: item.target,
          reason: item.reason,
          humanRequired: item.humanRequired
        })),
      humanGatesRequired: decisions
        .filter((item) => item.effect === "require_human_gate")
        .map((item) => ({
          workflow: item.target,
          reason: item.reason,
          gate: item.gate
        })),
      decisions,
      learningSnapshot: {
        agentReliability: learning.agentReliability,
        workflowRisks: learning.workflowRisks,
        recommendations: learning.recommendations
      },
      supervisorSnapshot: supervisor
        ? {
            platformHealthScore: supervisor.healthReport?.platformHealthScore,
            platformStatus: supervisor.healthReport?.status || supervisor.telemetry?.platformStatus,
            unstableAgents: (supervisor.agentHealth || []).filter((agent) => agent.unstable),
            riskyWorkflows: (supervisor.workflowStability || []).filter((workflow) => workflow.status !== "stable")
          }
        : null
    };

    return decision;
  }

  persist(decision) {
    ensureDirectory(this.runtimePolicyDir);
    ensureDirectory(this.memoryPolicyDir);

    const filename = `policy-decision-${timestampForFile()}.json`;
    const runtimePath = path.join(this.runtimePolicyDir, filename);
    const memoryPath = path.join(this.memoryPolicyDir, filename);

    fs.writeFileSync(runtimePath, JSON.stringify(decision, null, 2));
    fs.writeFileSync(memoryPath, JSON.stringify(decision, null, 2));

    return {
      runtimePath,
      memoryPath
    };
  }

  run() {
    const decision = this.evaluate();
    const persistence = this.persist(decision);

    return {
      ...decision,
      persistence
    };
  }

  applyUnstableAgentRoutingBlock(learning, supervisor) {
    const byAgent = new Map();

    for (const agent of learning.agentReliability || []) {
      byAgent.set(agent.agentId, {
        agentId: agent.agentId,
        reliabilityScore: agent.reliabilityScore,
        healthScore: null,
        unstable: agent.status !== "reliable",
        reasons: agent.reasons || []
      });
    }

    for (const agent of supervisor?.agentHealth || []) {
      const current = byAgent.get(agent.agentId) || {
        agentId: agent.agentId,
        reliabilityScore: 100,
        healthScore: null,
        unstable: false,
        reasons: []
      };
      current.healthScore = agent.healthScore;
      current.unstable = current.unstable || agent.unstable;
      current.reasons = [...new Set([...current.reasons, ...(agent.reasons || [])])];
      byAgent.set(agent.agentId, current);
    }

    return [...byAgent.values()]
      .filter((agent) => agent.unstable || agent.reliabilityScore < 80 || agent.healthScore < 80)
      .map((agent) => {
        const effectiveScore = Math.min(agent.reliabilityScore ?? 100, agent.healthScore ?? 100);
        const shouldBlock = effectiveScore < 60;

        return {
          policy: "unstable-agent-routing-block",
          effect: shouldBlock ? "block_agent" : "penalize_agent",
          target: agent.agentId,
          severity: shouldBlock ? "high" : "medium",
          penalty: shouldBlock ? 100 : 35,
          reason: `agentScore=${effectiveScore}; signals=${agent.reasons.join(",") || "unstable"}`
        };
      });
  }

  applyCriticalWorkflowHumanGate(learning, supervisor) {
    const risky = new Map();

    for (const workflow of learning.workflowRisks || []) {
      if (workflow.riskScore >= 80 || workflow.status === "critical") {
        risky.set(workflow.workflow, {
          workflow: workflow.workflow,
          riskScore: workflow.riskScore,
          status: workflow.status,
          reason: `riskScore=${workflow.riskScore}`
        });
      }
    }

    for (const workflow of supervisor?.workflowStability || []) {
      if (workflow.status !== "stable" || workflow.stabilityScore < 60) {
        risky.set(workflow.workflow, {
          workflow: workflow.workflow,
          riskScore: risky.get(workflow.workflow)?.riskScore || null,
          status: workflow.status,
          reason: `stabilityScore=${workflow.stabilityScore}; status=${workflow.status}`
        });
      }
    }

    return [...risky.values()].map((workflow) => ({
      policy: "critical-workflow-human-gate",
      effect: "require_human_gate",
      target: workflow.workflow,
      severity: "high",
      gate: "human-validation-before-runtime-execution",
      reason: workflow.reason
    }));
  }

  applyAutomaticRollbackRecommendation(learning, supervisor) {
    const recommendations = [];

    for (const recommendation of supervisor?.recoveryRecommendations || []) {
      if (recommendation.rollbackRecommended) {
        recommendations.push({
          policy: "automatic-rollback-recommendation",
          effect: "recommend_rollback",
          target: recommendation.workflow,
          severity: recommendation.severity || "high",
          humanRequired: recommendation.action === "human_review_required",
          reason: recommendation.summary || "Supervisor recommended rollback"
        });
      }
    }

    for (const workflow of learning.workflowRisks || []) {
      if (workflow.riskScore >= 90 || workflow.status === "critical") {
        recommendations.push({
          policy: "automatic-rollback-recommendation",
          effect: "recommend_rollback",
          target: workflow.workflow,
          severity: "high",
          humanRequired: true,
          reason: `Learning risk threshold reached: riskScore=${workflow.riskScore}`
        });
      }
    }

    return this.dedupeByPolicyEffectTarget(recommendations);
  }

  applyAdaptiveThrottling(learning, supervisor) {
    const platformHealth =
      supervisor?.healthReport?.platformHealthScore ?? supervisor?.telemetry?.platformHealthScore ?? 100;
    const throttles = [];

    if (platformHealth < 60) {
      throttles.push({
        policy: "adaptive-throttling",
        effect: "throttle",
        target: "platform",
        severity: "high",
        throttle: {
          mode: "conservative",
          maxConcurrentExecutions: 1,
          requireCheckpointBeforeHandoff: true
        },
        reason: `platformHealthScore=${platformHealth}`
      });
    }

    for (const workflow of learning.workflowRisks || []) {
      if (workflow.riskScore >= 70) {
        throttles.push({
          policy: "adaptive-throttling",
          effect: "throttle",
          target: workflow.workflow,
          severity: workflow.riskScore >= 85 ? "high" : "medium",
          throttle: {
            mode: "workflow-limited",
            maxConcurrentExecutions: 1,
            requireCheckpointBeforeHandoff: workflow.riskScore >= 85
          },
          reason: `workflowRiskScore=${workflow.riskScore}`
        });
      }
    }

    return throttles;
  }

  applyRetryLimitProtection(learning, supervisor) {
    const decisions = [];

    for (const pattern of supervisor?.retryPatterns || []) {
      if (pattern.exhausted || pattern.risky) {
        decisions.push({
          policy: "retry-limit-protection",
          effect: pattern.exhausted ? "block_workflow" : "require_human_gate",
          target: pattern.workflow,
          severity: pattern.exhausted ? "high" : "medium",
          gate: "retry-validation",
          reason: `retries=${pattern.retries}; maxRetries=${pattern.maxRetries}; exhausted=${pattern.exhausted}`
        });
      }
    }

    for (const recommendation of learning.recommendations || []) {
      if (recommendation.type === "workflow-risk" && recommendation.priority === "high") {
        decisions.push({
          policy: "retry-limit-protection",
          effect: "block_workflow",
          target: recommendation.target,
          severity: "high",
          reason: recommendation.evidence
        });
      }
    }

    return this.dedupeByPolicyEffectTarget(decisions);
  }

  dedupeByPolicyEffectTarget(decisions) {
    const seen = new Set();

    return decisions.filter((decision) => {
      const key = `${decision.policy}:${decision.effect}:${decision.target}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

module.exports = {
  RuntimePolicyEngine,
  buildLearningOutput
};
