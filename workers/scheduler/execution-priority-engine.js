const PRIORITY_WEIGHT = Object.freeze({
  critical: 100,
  p0: 95,
  gated: 85,
  high: 70,
  p1: 70,
  retry: 65,
  protected: 60,
  p2: 55,
  normal: 40,
  p3: 35,
  low: 20
});

class ExecutionPriorityEngine {
  scoreJob(job = {}) {
    const basePriority = job.priority || "normal";
    let score = PRIORITY_WEIGHT[basePriority] || PRIORITY_WEIGHT.normal;
    const reasons = [`priority:${basePriority}`];

    if (job.critical === true || job.workflowType === "critical") {
      score += 30;
      reasons.push("critical-workflow");
    }

    if (job.retry === true || Number(job.attempt || 1) > 1) {
      score += 20;
      reasons.push("retry-workflow");
    }

    if (job.protected === true || job.priority === "gated") {
      score += 15;
      reasons.push("protected-queue-release-candidate");
    }

    if (job.requiredCapability) {
      score += 5;
      reasons.push(`capability:${job.requiredCapability}`);
    }

    return {
      workflowId: job.workflowId || job.workflow || job.jobId,
      score,
      priority: basePriority,
      reasons
    };
  }

  rankJobs(jobs = []) {
    return jobs
      .map((job) => ({
        ...job,
        priorityScore: this.scoreJob(job)
      }))
      .sort((left, right) => {
        if (right.priorityScore.score !== left.priorityScore.score) {
          return right.priorityScore.score - left.priorityScore.score;
        }
        return String(left.workflowId || left.jobId).localeCompare(String(right.workflowId || right.jobId));
      });
  }
}

module.exports = {
  ExecutionPriorityEngine,
  PRIORITY_WEIGHT
};
