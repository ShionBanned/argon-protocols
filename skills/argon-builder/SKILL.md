---
name: argon-builder
description: Construye aplicaciones, componentes nuevos, motores interactivos, CLIs y pipelines completos con criterios de aceptación y pruebas de uso. Úsala en desarrollo nuevo; para investigar fallos y refactorizar sistemas existentes usa argon-core.
---

# Argon Builder 10.0

Construye la solución que pidió el usuario y comprueba su flujo principal. La selección del modelo y sus herramientas pertenece al anfitrión; no inventes capacidades ni rendimiento.

## Contrato y alcance

- Extrae objetivo, usuario, entradas/salidas, restricciones conocidas y criterios de aceptación observables. Reutiliza stack, estilos, convenciones y dependencias del proyecto.
- Pregunta únicamente por decisiones que alteran de forma material el producto o causan una acción irreversible. Para decisiones reversibles, explicita supuestos y avanza. No calcules porcentajes ficticios de ambigüedad.
- Define una primera sección funcional de extremo a extremo. Divide proyectos grandes en entregas verificables sin convertir una petición completa en un prototipo incompleto.
- Lee [el contrato operativo](references/protocol.md) antes de mutar archivos. Usa N2 para una aplicación completa, contratos compartidos o más de tres archivos; el riesgo prevalece sobre el tamaño del diff.

## Dominio y perfil

Elige `ENG`, `SRF`, `SYS` o `PIP`. Los perfiles `JCE` (expresivo), `CRF` (sobrio), `DNS` (información densa) y `MIN` (simple) orientan decisiones; las preferencias del usuario y la accesibilidad tienen prioridad. `MIN` no prohíbe dependencias útiles.

| Dominio | Comprobaciones relevantes |
| --- | --- |
| ENG | Tiempo independiente de FPS; pausa/reanudación; entradas y recursos liberados; presupuesto de rendimiento medido en el dispositivo objetivo. Para física, considera timestep fijo y límite de recuperación; evita asignaciones del bucle solo cuando el perfilado lo justifique. |
| SRF | Flujo principal funcional; teclado, foco, nombres accesibles y contraste; tamaños móviles y contenido largo. Comprueba vacío, carga, éxito y error si existen operaciones asíncronas. Overflow es una condición de layout, no un estado obligatorio de cada componente. |
| SYS | Validación de entradas, mensajes útiles, stdout/stderr y códigos según la interfaz; señales/cancelación para procesos persistentes según el SO; prueba invocación real. |
| PIP | Recursos acotados, contrapresión si hay streaming, tratamiento de fallos parciales, reintentos limitados y deduplicación/checkpoints cuando la entrega lo requiera. No añadas una DLQ a un script simple sin necesidad. |

## Construcción y prueba

1. Inspecciona puntos de integración; define contratos mínimos y una comprobación de aceptación.
2. Implementa y conecta el recorrido completo. No entregues controles sin acción, funciones truncadas ni datos simulados presentados como reales. Los mocks de pruebas o datos de demostración claramente identificados son válidos.
3. Usa actualización optimista solo cuando puedas revertir y reconciliar errores. No impongas animación, audio o densidad visual si el usuario no los pidió.
4. Ejecuta comprobaciones del proyecto y prueba la superficie real cuando esté disponible: navegador para UI, llamada HTTP para API, ejecución y salida para CLI. Una captura no prueba interacción; un build no prueba usabilidad.
5. Si falta una capacidad, conserva la implementación verificable y señala qué recorrido no se comprobó. Nunca simules una validación.

Entrega archivos, instrucciones mínimas de ejecución, pruebas realizadas y limitaciones específicas. No prometas producción, accesibilidad o tiempos de respuesta sin la comprobación correspondiente.
