# Protocolos Argon 10.0

[English](README.md) · [MIT](LICENSE)

Tres skills para mejorar la fiabilidad del trabajo de Gemini Flash mediante inspección del proyecto, decisiones según riesgo y verificación ejecutable. La versión 10 unifica las copias v9.2/v9.3 y corrige la integración con Antigravity.

No modifica pesos del modelo, amplía permisos ni acredita que supere a Argon, Carbon, Opus, Fable u otro modelo. Ese objetivo necesita evaluación comparativa. Los hooks son controles concretos y diagnósticos, no un compilador de razonamiento.

## Selección y funcionamiento

| Skill | Uso |
| --- | --- |
| [argon-core](skills/argon-core/SKILL.md) | Bugs, mantenimiento, arquitectura y refactor con contratos preservados |
| [argon-builder](skills/argon-builder/SKILL.md) | Producto nuevo y flujos completos verificables |
| [argon-director](skills/argon-director/SKILL.md) | Audiovisual por invocación explícita, preservación de fuentes y verificación del medio |

El [contrato compartido](docs/PROTOCOL.md) define N0/N1/N2, matrices orientativas, módulos M1–M11 y formato de evidencia. Cada skill incluye una copia generada de ese contrato para instalarse por separado. `node scripts/sync.mjs` sincroniza referencias, agents y plantillas; `node scripts/validate.mjs` detecta divergencias.

Las instrucciones evitan reescrituras automáticas tras dos fallos, porcentajes inventados de ambigüedad, dependencias globales obligatorias y presupuestos visuales/de rendimiento sin medición. Los cartuchos existentes siguen siendo opcionales; no se modifican herramientas ajenas a este paquete.

## Requisitos y comprobación local

- Node 22.18+ para scripts y pruebas; Bun para los comandos de hooks predeterminados. Esta entrega se verifica con las versiones locales registradas en el informe.
- Parser fijado en TypeScript 5.9.3, instalado con `bun install --frozen-lockfile --ignore-scripts`. Se usa su API de análisis, no el compilador del proyecto del usuario. Actualizarlo requiere probar compatibilidad.
- Antigravity App/CLI/IDE con hooks compatibles. La selección `model: flash` es un nivel del anfitrión; no fija por sí sola el identificador Gemini 3.8.

Desde la raíz del paquete:

```text
bun install --frozen-lockfile --ignore-scripts
node scripts/validate.mjs
node --test tests/*.test.mjs
node scripts/install.mjs --config-root C:/Users/gamer/.gemini/config
```

La última orden solo muestra un plan. Para aplicarlo:

```text
node scripts/install.mjs --config-root C:/Users/gamer/.gemini/config --apply --backup C:/ruta/nueva/argon-backup
node scripts/doctor.mjs --config-root C:/Users/gamer/.gemini/config
```

La instalación conserva otros grupos de hooks, crea copia de cada archivo reemplazado y rechaza objetivos cambiados desde la planificación. Copia las tres skills, referencias, agents y el recibo. Registra `~/.gemini/config/hooks.json` apuntando a esta raíz del paquete, que debe permanecer disponible con sus dependencias. No basta con guardar la configuración en `config/hooks/hooks.json`.

El registro global aplica el pre-hook a las herramientas de edición y terminal indicadas en su matcher. Esto afecta todas las sesiones que carguen ese grupo, incluso cuando una skill aún no se haya activado. Para alcance por proyecto usa la definición generada con rutas absolutas en `.agents/hooks.json`; evita registrar ambas copias simultáneamente. En una instalación como plugin, `hooks.json` usa rutas relativas a la raíz del paquete: el anfitrión ejecuta allí los hooks. La variable antigua `{{PLUGIN_DIR}}` se eliminó porque no forma parte de ese contrato.

Abre una sesión nueva o recarga personalizaciones y comprueba `/hooks` en la CLI o Customizations > Hooks en la app. `doctor` revisa disco y configuración; no puede certificar por sí solo que una sesión abierta haya recargado los hooks. Conserva la regla local de activar director solo por petición explícita.

Restauración: `node scripts/install.mjs --restore C:/ruta/argon-backup`. Si un objetivo cambió tras instalar, se detiene para no perder trabajo. El backup del repositorio y los archivos instalados son conjuntos distintos: conserva ambos al actualizar.

## Qué comprueba el runtime

1. **Antes de editar:** solo evidencia del texto del asistente después del último mensaje real del usuario. Reconoce `USER_EXPLICIT/USER_INPUT`; no usa outputs de herramientas ni razonamiento privado. Lectura acotada a 2 MiB; si falta la frontera o el JSON está incompleto, rechaza en vez de aceptar una auditoría vieja.
2. **Contrato:** formato estricto, cobertura de todos los objetivos, rutas normalizadas y enlaces resueltos dentro de workspaces, archivo nuevo/vacío y lectura de tokens con deriva máxima de ocho líneas. N2 exige un módulo desarrollado. No puede verificar automáticamente que el riesgo declarado sea semánticamente correcto.
3. **Antes/después:** snapshots privados por sesión y llamada; serialización del mismo archivo dentro de la sesión. Sin snapshot no hay validación. No hay rollback automático ni modo permisivo que finja aprobación. Límite de 4 MiB por archivo de texto y diez minutos para emparejar un evento.
4. **Después de editar:** análisis sintáctico JS/TS y diferencia de diagnósticos. Detecta interpolaciones y cambios solo por borrado; no confunde strings, regex ni JSX con anotaciones de tipo. Los errores heredados no se reportan otra vez; una duplicación añadida sí. La comparación por huella no atribuye movimientos de un mismo patrón a una línea histórica exacta.
5. **Feedback en Antigravity:** PostToolUse devuelve `{}` y registra hallazgos; PreInvocation los entrega como mensaje efímero en la próxima invocación. Es revisión asistida, no bloqueo de entrega ni reversión. Hallazgos resueltos desaparecen; los pendientes persisten durante la sesión hasta 24 horas.

Python, Go, Rust y otros lenguajes requieren sus linters/tests; aquí no se simula análisis semántico. Las firmas binarias comprueban cabeceras, no integridad audiovisual. La heurística de shell detecta escrituras comunes, pero ejecutar scripts arbitrarios puede escribir archivos: los permisos y sandbox del anfitrión siguen siendo necesarios. El auditor no es una frontera de seguridad contra un agente malicioso.

Los adaptadores `--host generic`, `--host claude` y `--host gemini` tienen pruebas de payload/output locales; no se instala configuración para otros productos ni se afirma integración de extremo a extremo en ellos. Gemini CLI usa eventos distintos de Antigravity. No copies la plantilla Antigravity a otro anfitrión.

## Recibos y pruebas de comportamiento

```text
node scripts/receipt.mjs verify --task regression --claim "Los contratos comprobados se conservan" --out receipt.json -- node --test tests/hooks.test.mjs
```

Ejecuta un programa y argumentos explícitos sin shell implícito. Captura stdout/stderr concurrentemente, limita salida retenida y tiempo, conserva código de salida y distingue fallo, timeout y error de ejecución. `--artifact archivo` añade tamaño y SHA-256. No sobrescribe un recibo anterior. El wrapper global `argon-receipt` usa esta misma interfaz; `--cmd` antiguo se rechaza con explicación.

`CHECK_PASSED` significa únicamente que pasó ese comando. Ya no hay fallback a `git status` ni un `ACCEPTED` que confunda salida cero con validación de toda una afirmación.

[La suite piloto](evals/README.md) permite preparar y calificar cuatro tareas iguales con/sin Argon. No llama a modelos ni presenta resultados inventados. Una comparación seria registra identidad real, versión del paquete, herramientas, coste, tokens, tiempos, varias repeticiones y tareas finales independientes.

## Compatibilidad y fuentes

Los contratos se contrastaron con [hooks de Antigravity](https://antigravity.google/docs/hooks), [skills](https://antigravity.google/docs/skills), [agentes](https://antigravity.google/docs/subagents) y [paquetes de plugins](https://antigravity.google/docs/build-plugins/). El manifiesto usa descubrimiento de directorios estándar; se eliminaron claves no admitidas. Revalida contra la versión del anfitrión antes de distribuir una actualización. La lista de herramientas de los agentes contiene nombres Antigravity documentados.

Autor original: Shion. Se preservan licencia, recursos y contenido audiovisual del proyecto.
