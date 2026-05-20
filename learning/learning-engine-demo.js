const { MemoryLoader } = require("./analytics/memory-loader");
const { IncidentPatternAnalyzer } = require("./patterns/incident-pattern-analyzer");
const { WorkflowFailurePatternDetector } = require("./patterns/workflow-failure-pattern-detector");
const { RoutingDecisionAnalyzer } = require("./analytics/routing-decision-analyzer");
const { RecoveryEffectivenessAnalyzer } = require("./analytics/recovery-effectiveness-analyzer");
const { AgentReliabilityScorer } = require("./scoring/agent-reliability-scorer");
const { WorkflowRiskScorer } = require("./scoring/workflow-risk-scorer");
const { HistoricalStabilityAnalyzer } = require("./scoring/historical-stability-analyzer");
const { RecommendationEngine } = require("./recommendations/recommendation-engine");

function runLearningDemo() {
  const memory = new MemoryLoader().load();
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

  console.log(
    JSON.stringify(
      {
        memoryLoaded: {
          incidents: memory.incidents.length,
          healthReports: memory.healthReports.length,
          workflowReports: memory.workflowReports.length,
          recoveryRecommendations: memory.recoveryRecommendations.length,
          runtimeRecoveries: memory.runtimeRecoveries.length,
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
      },
      null,
      2
    )
  );
}

runLearningDemo();
