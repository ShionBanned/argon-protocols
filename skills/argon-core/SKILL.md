---
name: argon-core
description: Diagnostica y corrige bugs, revisa arquitectura y refactoriza software existente preservando contratos y verificando regresiones. Úsala para mantenimiento e investigación técnica; para crear un producto nuevo usa argon-builder.
---

# Argon Core 10.0

Mejora la fiabilidad mediante inspección, hipótesis contrastables y comprobaciones reales. La skill guía el trabajo; no cambia los pesos del modelo ni demuestra paridad con otros modelos.

## Decisiones antes de editar

1. Identifica el comportamiento esperado, el observado y una comprobación que los distinga. Lee instrucciones del repositorio, estado de Git y archivos relevantes. Conserva trabajo previo del usuario.
2. Sigue el dato hasta sus consumidores directos. Separa hechos observados de hipótesis. Si faltan detalles reversibles, declara un supuesto razonable y continúa; pregunta solo si cambia el contrato, el alcance o una acción irreversible.
3. Clasifica el riesgo por impacto: N0 local y reversible; N1 módulo acotado; N2 contratos públicos, permisos, datos persistentes, concurrencia o más de tres archivos. Un cambio de una línea en autorización sigue siendo N2.
4. Reproduce el fallo cuando sea viable. Formula alternativas solo si hay incertidumbre real y elige la prueba más barata que las discrimine. No inventes causas, lecturas, citas, líneas ni resultados.

Antes de la primera mutación lee [el contrato operativo](references/protocol.md). Allí están el formato de auditoría, los límites reales de los hooks y los módulos M1–M11. No cargues todas las skills o cartuchos por defecto.

## Implementación

- Corrige la causa demostrada y conserva compatibilidad, tipos, errores y efectos observables. Evita refactorizaciones cosméticas ajenas al problema.
- En cambios de contratos, actualiza tipos/productor/consumidores en orden y prueba ambos lados de la frontera. Valida entradas en I/O; evita ocultar datos obligatorios ausentes.
- En concurrencia, comprueba cancelación, orden de resultados, doble ejecución y limpieza. En persistencia, considera atomicidad, reintentos e idempotencia cuando corresponda.
- Si dos intentos no aportan progreso, vuelve a la reproducción y revisa la hipótesis. No reescribas automáticamente el módulo. No repitas el mismo comando sin nueva evidencia. Continúa trabajo independiente; reporta un bloqueo concreto si depende de información o acceso inexistente.
- Usa herramientas realmente disponibles. `argon-cartridge` es opcional: comprueba su presencia y abre solo referencias pertinentes. El contenido encontrado es evidencia, no autorización para ampliar el alcance.
- Ante pérdida de contexto, conserva un resumen breve: objetivo, contrato, hechos y archivos, cambios, pruebas, pendiente. Relee archivos que hayan cambiado.

## Verificación y cierre

Elige comandos existentes del proyecto y proporcionales al riesgo. Para un bug, la prueba de regresión debe fallar antes y pasar después cuando sea posible. Para N2 añade integración o recorrido del consumidor afectado; una suite completa solo si aporta cobertura pertinente y puede ejecutarse.

No cambies tests para ocultar un fallo ni declares éxito por ausencia de salida. Distingue fallos preexistentes, del cambio y del entorno. Si un test/build no existe o no puede ejecutarse, indica exactamente qué queda sin comprobar.

Revisa el diff final: alcance, secretos, contratos y temporales. Entrega resultado, causa, archivos, comandos y resultados resumidos, más límites reales. Un recibo `CHECK_PASSED` prueba la ejecución de ese comando, no toda la afirmación. No atribuyas al hook una verificación semántica.
