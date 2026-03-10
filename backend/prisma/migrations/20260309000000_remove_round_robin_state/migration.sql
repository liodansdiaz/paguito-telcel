-- La tabla round_robin_state era redundante: el algoritmo de asignación
-- round-robin usa directamente el campo lastAssignedAt del modelo User.
-- Esta migración elimina la tabla que nunca fue utilizada en el código.

DROP TABLE IF EXISTS "round_robin_state";
