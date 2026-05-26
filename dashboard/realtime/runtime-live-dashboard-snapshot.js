window.RUNTIME_LIVE_DASHBOARD_SNAPSHOT = {
  "generatedAt": "2026-05-26T02:32:17.751Z",
  "streamingDemoId": "runtime_streaming_demo_1779762737751",
  "websocket": {
    "started": true,
    "host": "127.0.0.1",
    "port": 51359,
    "url": "ws://127.0.0.1:51359/runtime-stream",
    "localOnly": true,
    "readonly": true,
    "safetyMode": "readonly-safe-local-websocket"
  },
  "channels": [
    "runtime.events",
    "runtime.telemetry",
    "runtime.replay",
    "runtime.recovery",
    "runtime.dashboard",
    "runtime.brokers",
    "runtime.transport",
    "runtime.replication",
    "runtime.queue"
  ],
  "liveTelemetry": {
    "liveTelemetryId": "live_telemetry_1779762737751_37c781",
    "generatedAt": "2026-05-26T02:32:17.751Z",
    "channel": "runtime.telemetry",
    "throughput": {
      "events": 200,
      "decisions": 14,
      "workflows": 113
    },
    "queuePressure": "backpressure-detected",
    "workerHealth": {
      "count": 5,
      "workerIds": [
        "worker-runtime-stale-1",
        "worker-runtime-unhealthy-demo",
        "worker-health-flaky",
        "worker-health-disabled",
        "orchestrator-unhealthy-1"
      ]
    },
    "unhealthyNodes": [
      "runtime-node-c"
    ],
    "replayPressure": "unknown",
    "replicationLag": {
      "staleNodes": [
        "runtime-node-c"
      ],
      "maxLagMs": 72271
    },
    "transportDeliveryStatus": {
      "status": "runtime_transport_messaging_layer_ready",
      "deliveryCount": 3,
      "nackCount": 2
    },
    "brokerHealth": "healthy",
    "saturation": {
      "queue": true,
      "stream": false,
      "workers": 5
    },
    "readonly": true,
    "safetyMode": "readonly-safe-live-telemetry"
  },
  "dashboardRealtime": {
    "dashboardStreamId": "dashboard_stream_1779762737751_a4c6c7",
    "generatedAt": "2026-05-26T02:32:17.751Z",
    "readonly": true,
    "liveRuntimeUpdates": [
      {
        "eventId": "stream_event_workers_1779762737751_421e93",
        "type": "runtime.workers.snapshot",
        "channel": "runtime.workers",
        "status": "workers-readable-via-telemetry",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_queue_1779762737751_ac5701",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "status": "queue-readable-via-distributed-queue",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_distributedQueue_1779762737751_a5735e",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "status": "distributed_queue_backpressure_runtime_ready",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_brokers_1779762737751_31b826",
        "type": "runtime.brokers.snapshot",
        "channel": "runtime.brokers",
        "status": "broker_adapter_layer_ready",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_transport_1779762737751_4ec1d3",
        "type": "runtime.transport.snapshot",
        "channel": "runtime.transport",
        "status": "runtime_transport_messaging_layer_ready",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_replication_1779762737751_29f236",
        "type": "runtime.replication.snapshot",
        "channel": "runtime.replication",
        "status": "runtime_state_replication_consensus_ready",
        "correlationId": "stream_correlation_1779762737751"
      },
      {
        "eventId": "stream_event_replay_1779762737751_e4f66f",
        "type": "runtime.replay.snapshot",
        "channel": "runtime.replay",
        "status": "workflow_replay_demo_passed",
        "correlationId": "execution_persistence_correlation_1779762725500"
      },
      {
        "eventId": "stream_event_selfHealing_1779762737751_274873",
        "type": "runtime.recovery.snapshot",
        "channel": "runtime.recovery",
        "status": "runtime_recovery_self_healing_ready",
        "correlationId": "execution_persistence_correlation_1779762728860"
      }
    ],
    "topologyUpdates": {
      "unhealthyNodes": [
        "runtime-node-c"
      ],
      "brokerHealth": "healthy",
      "transportDeliveryStatus": {
        "status": "runtime_transport_messaging_layer_ready",
        "deliveryCount": 3,
        "nackCount": 2
      }
    },
    "realtimeTimelineMetadata": {
      "channelCount": 10,
      "eventCount": 11,
      "subscriberCount": 2
    },
    "streamHealthCards": [
      {
        "label": "stream",
        "status": "attention-required",
        "value": "throttled"
      },
      {
        "label": "queue-pressure",
        "status": "observable",
        "value": "backpressure-detected"
      },
      {
        "label": "broker-health",
        "status": "healthy",
        "value": "healthy"
      }
    ],
    "safetyMode": "readonly-safe-dashboard-stream-adapter"
  },
  "fallbackSnapshot": {
    "mode": "snapshot",
    "reason": "stream-backpressure-throttled",
    "eventCount": 11,
    "events": [
      {
        "streamEventId": "stream_event_workers_1779762737751_421e93",
        "type": "runtime.workers.snapshot",
        "channel": "runtime.workers",
        "source": "workers",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "workers-readable-via-telemetry",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_queue_1779762737751_ac5701",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "source": "queue",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "queue-readable-via-distributed-queue",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_distributedQueue_1779762737751_a5735e",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "source": "distributedQueue",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\rafael-ai-agents\\memory\\distributed-queue\\distributed-queue-20260526T023141-distributed_queue_1779762701063.json",
          "status": "distributed_queue_backpressure_runtime_ready",
          "reportId": "distributed_queue_1779762701063"
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_brokers_1779762737751_31b826",
        "type": "runtime.brokers.snapshot",
        "channel": "runtime.brokers",
        "source": "brokers",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\rafael-ai-agents\\memory\\brokers\\broker-adapter-20260526T023028-broker_demo_1779762628187.json",
          "status": "broker_adapter_layer_ready",
          "reportId": "broker_demo_1779762628187"
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_transport_1779762737751_4ec1d3",
        "type": "runtime.transport.snapshot",
        "channel": "runtime.transport",
        "source": "transport",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\rafael-ai-agents\\memory\\transport\\runtime-transport-20260526T023116-runtime_transport_1779762676664.json",
          "status": "runtime_transport_messaging_layer_ready",
          "reportId": "runtime_transport_1779762676664"
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_replication_1779762737751_29f236",
        "type": "runtime.replication.snapshot",
        "channel": "runtime.replication",
        "source": "replication",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\rafael-ai-agents\\memory\\replication\\runtime-replication-20260526T023205-runtime_replication_1779762725497.json",
          "status": "runtime_state_replication_consensus_ready",
          "reportId": "runtime_replication_1779762725497"
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_replay_1779762737751_e4f66f",
        "type": "runtime.replay.snapshot",
        "channel": "runtime.replay",
        "source": "replay",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "execution-persistence-demo-workflow",
        "correlationId": "execution_persistence_correlation_1779762725500",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "workflow_replay_demo_passed",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_selfHealing_1779762737751_274873",
        "type": "runtime.recovery.snapshot",
        "channel": "runtime.recovery",
        "source": "selfHealing",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "execution-persistence-demo-workflow",
        "correlationId": "execution_persistence_correlation_1779762728860",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "runtime_recovery_self_healing_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_telemetry_1779762737751_67fa87",
        "type": "runtime.telemetry.snapshot",
        "channel": "runtime.telemetry",
        "source": "telemetry",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\rafael-ai-agents\\memory\\telemetry\\telemetry-20260526T023217673Z.json",
          "status": "attention-required",
          "reportId": "telemetry-20260526T023217673Z"
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_dashboard_1779762737751_8ee485",
        "type": "runtime.dashboard.snapshot",
        "channel": "runtime.dashboard",
        "source": "dashboard",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "dashboard-stream-ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_eventBus_1779762737751_1ec193",
        "type": "runtime.events.snapshot",
        "channel": "runtime.events",
        "source": "eventBus",
        "timestamp": "2026-05-26T02:32:17.751Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1779762737751",
        "payload": {
          "available": true,
          "sourcePath": null,
          "status": "published",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      }
    ],
    "readonly": true,
    "safetyMode": "readonly-safe-stream-snapshot"
  }
};
