window.RUNTIME_LIVE_DASHBOARD_SNAPSHOT = {
  "generatedAt": "2026-05-29T01:56:01.416Z",
  "streamingDemoId": "runtime_streaming_demo_1780019761416",
  "websocket": {
    "started": true,
    "host": "127.0.0.1",
    "port": 53707,
    "url": "ws://127.0.0.1:53707/runtime-stream",
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
    "liveTelemetryId": "live_telemetry_1780019761416_c230b0",
    "generatedAt": "2026-05-29T01:56:01.416Z",
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
        "runtime-node-a",
        "runtime-node-b",
        "runtime-node-c"
      ],
      "maxLagMs": 101761
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
    "dashboardStreamId": "dashboard_stream_1780019761416_9a362c",
    "generatedAt": "2026-05-29T01:56:01.416Z",
    "readonly": true,
    "liveRuntimeUpdates": [
      {
        "eventId": "stream_event_workers_1780019761326_ede6c3",
        "type": "runtime.workers.snapshot",
        "channel": "runtime.workers",
        "status": "multiprocess_worker_runtime_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_queue_1780019761326_59d292",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "status": "distributed_queue_backpressure_runtime_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_distributedQueue_1780019761326_a32896",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "status": "distributed_queue_backpressure_runtime_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_brokers_1780019761326_ae69f0",
        "type": "runtime.brokers.snapshot",
        "channel": "runtime.brokers",
        "status": "broker_adapter_layer_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_transport_1780019761326_e03789",
        "type": "runtime.transport.snapshot",
        "channel": "runtime.transport",
        "status": "runtime_transport_messaging_layer_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_replication_1780019761326_2ae156",
        "type": "runtime.replication.snapshot",
        "channel": "runtime.replication",
        "status": "runtime_state_replication_consensus_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_replay_1780019761326_6c082d",
        "type": "runtime.replay.snapshot",
        "channel": "runtime.replay",
        "status": "workflow_replay_ready",
        "correlationId": "stream_correlation_1780019761326"
      },
      {
        "eventId": "stream_event_selfHealing_1780019761326_4302f8",
        "type": "runtime.recovery.snapshot",
        "channel": "runtime.recovery",
        "status": "runtime_recovery_plan_ready",
        "correlationId": "stream_correlation_1780019761326"
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
        "streamEventId": "stream_event_workers_1780019761326_ede6c3",
        "type": "runtime.workers.snapshot",
        "channel": "runtime.workers",
        "source": "workers",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\multiprocess-workers\\multiprocess-workers-20260527T143014-multiprocess_workers_demo_1779892214488.json",
          "status": "multiprocess_worker_runtime_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_queue_1780019761326_59d292",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "source": "queue",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\distributed-queue\\distributed-queue-20260527T142835-distributed_queue_1779892115049.json",
          "status": "distributed_queue_backpressure_runtime_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_distributedQueue_1780019761326_a32896",
        "type": "runtime.queue.snapshot",
        "channel": "runtime.queue",
        "source": "distributedQueue",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\distributed-queue\\distributed-queue-20260527T142835-distributed_queue_1779892115049.json",
          "status": "distributed_queue_backpressure_runtime_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_brokers_1780019761326_ae69f0",
        "type": "runtime.brokers.snapshot",
        "channel": "runtime.brokers",
        "source": "brokers",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\brokers\\broker-adapter-20260527T141719-broker_demo_1779891439915.json",
          "status": "broker_adapter_layer_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_transport_1780019761326_e03789",
        "type": "runtime.transport.snapshot",
        "channel": "runtime.transport",
        "source": "transport",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\transport\\runtime-transport-20260527T141658-runtime_transport_1779891418873.json",
          "status": "runtime_transport_messaging_layer_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_replication_1780019761326_2ae156",
        "type": "runtime.replication.snapshot",
        "channel": "runtime.replication",
        "source": "replication",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\replication\\runtime-replication-20260527T141906-runtime_replication_1779891546306.json",
          "status": "runtime_state_replication_consensus_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_replay_1780019761326_6c082d",
        "type": "runtime.replay.snapshot",
        "channel": "runtime.replay",
        "source": "replay",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\replay\\workflow-replay-20260527T142900-workflow_replay_1779892140100_8d5e8c.json",
          "status": "workflow_replay_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_selfHealing_1780019761326_4302f8",
        "type": "runtime.recovery.snapshot",
        "channel": "runtime.recovery",
        "source": "selfHealing",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\self-healing\\runtime-recovery-20260527T142834-runtime_recovery_session_1779892114837_1f36ad.json",
          "status": "runtime_recovery_plan_ready",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_telemetry_1780019761326_509d9e",
        "type": "runtime.telemetry.snapshot",
        "channel": "runtime.telemetry",
        "source": "telemetry",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\telemetry\\telemetry-20260529T014319201Z.json",
          "status": "attention-required",
          "reportId": null
        },
        "readonly": true,
        "safetyMode": "readonly-safe-runtime-stream-event"
      },
      {
        "streamEventId": "stream_event_dashboard_1780019761326_e0d7ab",
        "type": "runtime.dashboard.snapshot",
        "channel": "runtime.dashboard",
        "source": "dashboard",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
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
        "streamEventId": "stream_event_eventBus_1780019761326_697881",
        "type": "runtime.events.snapshot",
        "channel": "runtime.events",
        "source": "eventBus",
        "timestamp": "2026-05-29T01:56:01.326Z",
        "workflowId": "runtime-streaming",
        "correlationId": "stream_correlation_1780019761326",
        "payload": {
          "available": true,
          "sourcePath": "C:\\Users\\rafae\\OneDrive\\Área de Trabalho\\Rafael_IA\\rafael-ai-agents\\memory\\event-bus\\eventbus-demo-20260520T180711.json",
          "status": "distributed_event_bus_ready",
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
