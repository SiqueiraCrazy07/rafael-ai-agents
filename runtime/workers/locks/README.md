# Queue Locks

Impede processamento duplicado de itens de fila.

Um lock ativo bloqueia outra tentativa de executar a mesma chave operacional.

Na V1, a chave do lock usa projeto, workflow e `queueId`.
