# Runtime Recovery

Camada de recuperacao automatica do runtime distribuido.

Responsabilidades:

- detectar workers travados;
- detectar heartbeat expirado;
- recuperar leases expirados;
- liberar locks presos;
- recolocar itens na fila;
- reexecutar workflows;
- registrar metricas e memoria de healing.
