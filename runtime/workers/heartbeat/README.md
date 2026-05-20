# Worker Heartbeat

Registra sinais de vida dos workers do runtime distribuido.

Campos registrados:

- `workerId`
- `status`
- `lastSeenAt`
- `running`
- `capacity`
- `capabilities`

Na V1, os heartbeats sao locais e persistidos em JSON.
