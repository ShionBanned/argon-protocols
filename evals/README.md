# Evaluación reproducible del protocolo

Los tests del runtime prueban software, no el rendimiento de Gemini. Esta suite piloto separa cuatro casos ejecutables de las afirmaciones sobre modelos.

1. Crea un directorio nuevo: `node scripts/evaluate.mjs init --candidate /ruta/run-01`.
2. En una sesión nueva del modelo exacto, entrega las tareas de TASKS.md. Para baseline no cargues Argon; para argon carga la skill correspondiente. Igual herramienta, presupuesto y condiciones en ambas variantes. No reutilices soluciones, historial o contexto entre ejecuciones.
3. Ejecuta el candidato local con `node scripts/evaluate.mjs score --candidate /ruta/run-01 --model ID_REAL --variant baseline --run-id 01 --out baseline-01.json`.
4. Repite con `--variant argon`, varios intentos independientes, y modelos rivales con idénticas condiciones. Registra por separado tokens, coste, tiempo de la sesión, intervención humana y bloqueos falsos del hook.

El runner ejecuta los archivos del candidato como código local; úsalo sobre trabajos preparados en un entorno de pruebas. No invoca APIs de modelos ni consume créditos por sí mismo. El campo model es declarado por el operador, no detectado.

Cuenta fallos y tareas incompletas en el denominador. Compara por tarea y por repetición; reporta todos los resultados, muestra y dispersión. No concluyas superioridad general a partir de cuatro casos públicos. Añade tareas privadas de proyectos reales, navegador/UI y render audiovisual con revisión humana antes de decisiones de calidad. Mantén tareas finales separadas de las usadas para ajustar prompts.

La suite es deliberadamente pequeña y auditable. Sus comprobaciones detectan bugs concretos de límites, contratos, concurrencia y FPS racional; no miden inteligencia general ni producción audiovisual completa.
