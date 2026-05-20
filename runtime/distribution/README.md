# Runtime Distribution

Simulador de execucao distribuida do runtime.

Responsabilidades:

- consumir fila priorizada;
- selecionar workers compativeis;
- respeitar concorrencia e capacidade;
- aplicar sinais de policies;
- mover falhas para retry queue;
- gerar telemetria e metricas.
