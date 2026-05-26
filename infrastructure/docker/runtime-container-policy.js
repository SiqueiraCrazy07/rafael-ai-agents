const DESTRUCTIVE_MOUNTS = ["/", "/var/run/docker.sock", "/etc", "/root", "/host", "C:\\", "C:/"];

class RuntimeContainerPolicy {
  evaluate(container) {
    const mounts = container.mounts || [];
    const env = container.environment || {};
    const privileged = Boolean(container.privileged);
    const destructiveMounts = mounts.filter((mount) => {
      const target = mount.target || mount;
      return DESTRUCTIVE_MOUNTS.some((denied) => target === denied || target.startsWith(`${denied}/`));
    });
    const readonly = container.readonly === true && env.RUNTIME_READONLY_MODE === "true" && env.RUNTIME_SAFE_MODE === "true";
    const violations = [
      privileged ? "privileged-container-denied" : null,
      destructiveMounts.length ? "destructive-mount-denied" : null,
      readonly ? null : "readonly-safe-env-required",
      container.externalPublic === true ? "external-public-exposure-denied" : null
    ].filter(Boolean);

    return {
      containerId: container.containerId,
      service: container.service,
      allowed: violations.length === 0,
      readonly,
      violations,
      deniedMounts: destructiveMounts,
      environmentIsolation: {
        safeMode: env.RUNTIME_SAFE_MODE === "true",
        readonlyMode: env.RUNTIME_READONLY_MODE === "true",
        secretsPersisted: false,
        externalPublic: Boolean(container.externalPublic)
      },
      restrictedExecution: {
        privileged: false,
        destructiveCommands: false,
        kubernetesDeployment: false
      },
      safetyMode: "readonly-safe-container-policy"
    };
  }
}

module.exports = {
  RuntimeContainerPolicy
};
