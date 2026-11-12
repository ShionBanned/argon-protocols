---
name: argon-director
description: Dirige composiciones audiovisuales, edición programática y posproducción con FFmpeg, Remotion o MoviePy cuando el usuario pide argon-director expresamente. Comprueba medios, sincronización y resultados; no se activa por solicitar el conjunto de skills Remotion.
---

# Argon Director 10.0

Respeta el encargo creativo, conserva originales y verifica el medio final. Mantén la preferencia local de activación explícita de esta skill.

## Preparación

- Identifica destino, duración o rango, orientación, fuentes y tratamiento de audio. Usa valores reversibles razonables si faltan detalles; pregunta antes de un render costoso cuando una decisión esencial cambiaría todo el resultado.
- Comprueba herramientas/versiones disponibles y permisos de los recursos. Lee solo las referencias de la herramienta elegida; no actives toda una suite por usar un componente.
- Inspecciona entradas con `ffprobe`: streams, duración de formato/streams, resolución, rotación, sample rate, time base y FPS racional. Distingue VFR de CFR. La firma de cabecera solo identifica formato; no prueba integridad.
- Lee [el contrato operativo](references/protocol.md) antes de editar scripts. Usa N0 para un remux sencillo; N1 para composición acotada; N2 para pipeline completo o cambios de sincronización complejos. N2 también requiere MODULE con una acción concreta.

## Dirección y realización

Dominios: `SHRT` social, `PED` educativo, `KEY` presentación y `DOC` documental. Perfiles: `BST` dinámico, `KYN` limpio, `CIN` cinematográfico y `RAW` continuo. Son orientaciones adaptables: no impongas cortes, subtítulos cinéticos, un layout o una proporción contra el encargo.

- Mantén fuentes en rutas de solo lectura; renderiza a otra ruta y rechaza que entrada y salida resuelvan al mismo archivo, incluso por enlaces. No uses sobreescritura automática sobre fuentes ni borres originales.
- Construye el timeline con unidades explícitas, FPS racional y origen común. Distingue fotogramas de muestras de audio. Si hay deriva, revisa time base y remuestreo antes de acumular offsets.
- `-c copy` no garantiza cortes exactos ni compatibilidad entre códecs/contenedores; verifica keyframes y streams. Recodifica cuando el contrato exija precisión que el remux no ofrece.
- Reserva tiempo para preview de un fragmento representativo antes del render largo. Mantén stderr observable y comprueba la finalización real de trabajos asíncronos.
- Mezcla según el destino: mide LUFS integrados y true peak en dBTP. Sin una especificación, -16 a -14 LUFS y un techo de -1 dBTP pueden ser un punto de partida para voz web, no una obligación universal. Si normalizas a un objetivo, mide de nuevo la salida codificada.
- Ajusta ducking a inteligibilidad y material, no a un valor fijo de dBFS. En audio silencioso o sin stream, la medición LUFS puede ser no aplicable; no inventes un número.

## Validación de entrega

Inspecciona el archivo final con `ffprobe -v error -show_format -show_streams -of json`. Comprueba existencia, tamaño, streams esperados, duración y formato contra el contrato.

Para vídeo, extrae e inspecciona fotogramas representativos: principio, cambios de escena, texto, punto medio y final según la duración. Para audio, escucha muestras si hay herramienta disponible y verifica loudness/picos cuando sea parte del encargo. Para una pieza solo sonora no extraigas fotogramas; para vídeo mudo no exijas LUFS.

En trabajos relevantes, realiza además una decodificación de comprobación (`ffmpeg -v error -i output.mp4 -f null -`) y revisa sus errores. La calidad visual y la sincronía no se prueban solo con exit code 0.

Entrega ruta, métricas observadas, previews y comprobaciones realizadas. Distingue inspección técnica de escucha/visionado. Un recibo no sustituye esa revisión.
