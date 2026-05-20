const CRITICIDADE_WEIGHT = Object.freeze({
  low: 1,
  medium: 2,
  high: 3,
  critical: 4
});

function normalize(value) {
  return String(value || "").toLowerCase();
}

function tokenize(values) {
  const stopwords = new Set(["de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o"]);
  return values
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .filter((token) => token && !stopwords.has(token));
}

class CapabilityMatcher {
  scoreAgent(agent, request) {
    const reasons = [];
    let score = 0;

    const project = normalize(request.project);
    if (agent.projetosCompativeis.includes(project)) {
      score += 30;
      reasons.push("project-compatible");
    } else {
      return { agent, score: 0, reasons: ["project-incompatible"], compatible: false };
    }

    const requiredPermissions = request.requiredPermissions || [];
    const missingPermissions = requiredPermissions.filter(
      (permission) => !agent.permissoes.includes(permission)
    );
    if (missingPermissions.length > 0) {
      return {
        agent,
        score: 0,
        reasons: [`missing-permissions:${missingPermissions.join(",")}`],
        compatible: false
      };
    }

    score += requiredPermissions.length * 8;
    if (requiredPermissions.length > 0) {
      reasons.push("permissions-match");
    }

    const requestTokens = tokenize([
      request.workflow,
      request.taskType,
      request.objective,
      ...(request.capabilities || [])
    ]);
    const agentTokens = tokenize([
      agent.nome,
      agent.missao,
      agent.escopo,
      ...(agent.entradas || []),
      ...(agent.saidas || []),
      ...(agent.playbooks || [])
    ]);
    const tokenMatches = requestTokens.filter((token) => agentTokens.includes(token));
    score += Math.min(tokenMatches.length * 6, 36);
    if (tokenMatches.length > 0) {
      reasons.push(`capability-match:${[...new Set(tokenMatches)].slice(0, 5).join(",")}`);
    }

    const explicitCapabilityMatches = tokenize(request.capabilities || []).filter((capability) =>
      agentTokens.includes(capability)
    );
    score += explicitCapabilityMatches.length * 10;
    if (explicitCapabilityMatches.length > 0) {
      reasons.push(`explicit-capability:${[...new Set(explicitCapabilityMatches)].join(",")}`);
    }

    const requestCriticality = CRITICIDADE_WEIGHT[request.criticidade || "medium"] || 2;
    const agentCriticality = CRITICIDADE_WEIGHT[agent.criticidade] || 1;
    if (agentCriticality >= requestCriticality) {
      score += 15;
      reasons.push("criticality-covered");
    } else {
      score -= 10;
      reasons.push("criticality-lower-than-request");
    }

    return {
      agent,
      score,
      reasons,
      compatible: score > 0
    };
  }

  rankAgents(agents, request, healthScores = {}) {
    return agents
      .map((agent) => {
        const match = this.scoreAgent(agent, request);
        const healthScore = healthScores[agent.id] ?? 100;
        let healthPenalty = 0;
        if (healthScore < 40) {
          healthPenalty = 100;
        } else if (healthScore < 60) {
          healthPenalty = 50;
        }
        const healthAdjustedScore = match.compatible
          ? match.score + Math.round((healthScore - 80) / 4) - healthPenalty
          : match.score;

        return {
          ...match,
          healthScore,
          healthAdjustedScore,
          reasons: [
            ...match.reasons,
            `health:${healthScore}`,
            ...(healthPenalty > 0 ? [`health-penalty:${healthPenalty}`] : [])
          ]
        };
      })
      .filter((match) => match.compatible)
      .sort((a, b) => b.healthAdjustedScore - a.healthAdjustedScore);
  }
}

module.exports = {
  CapabilityMatcher
};
