# Protocolos Argon (v9.2 Híbrido)

[![Versión](https://img.shields.io/badge/Versi%C3%B3n-9.2.0-blue.svg?style=for-the-badge)](https://github.com/ShionBanned/argon-protocols)
[![Licencia: MIT](https://img.shields.io/badge/Licencia-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Arquitectura](https://img.shields.io/badge/Arquitectura-Proof--Carrying%20Audit%20%28PCA%29-purple?style=for-the-badge)](#1-auditoría-portadora-de-prueba-pca-con-anclaje-léxico)
[![Compatibilidad](https://img.shields.io/badge/Compatibilidad-Antigravity%20|%20Claude%20Code-success?style=for-the-badge)](#instalación-e-integración)
[![Video de Lanzamiento](https://img.shields.io/badge/Ver-Video%20de%20Presentaci%C3%B3n%20(90s)-E62117?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/ShionBanned/argon-protocols/releases/download/v9.2.0/Argon_Protocols_v9_Launch_Video.mp4)

**[English](README.md)** · **[Español](README_ES.md)**

> **Auditoría Portadora de Prueba (PCA) y Gobernanza en Tiempo de Ejecución Acotada por Diff para Agentes Autónomos de IA.**  
> *Diseñado para combinar especificaciones semánticas compactas con interceptores deterministas previos y posteriores a la mutación en Google Antigravity y Claude Code.*

---

## 🎬 Video Oficial de Presentación

https://github.com/user-attachments/assets/083ab72b-3096-4468-88e8-8e1c9b637a7b

---

## Declaración del Problema y Arquitectura Central

En los marcos basados únicamente en prompts (**Argon v8.0**), las restricciones del agente dependían exclusivamente de instrucciones textuales (*"soft-steering"*). En ventanas de contexto extensas, los modelos rápidos (como **Gemini Flash** o **Claude Haiku**) sufren frecuentemente de *Teatro de Cumplimiento*: emiten bloques de auditoría superficiales, adivinan números de línea sin leer los archivos o dejan comentarios `// TODO` truncados para ahorrar tokens de salida.

**Argon v9.2 Híbrido** separa la guía semántica de la imposición mecánica:

1. **El Prompt (`SKILL.md` ~90 líneas por skill):** Funciona como una **Especificación Semántica e Invariante** compacta, mitigando la degradación de atención en contextos largos.
2. **El Runtime (`hooks/` en TypeScript/Bun):** Funciona como un **Guardián Léxico Determinista, Validador de Medios por Magic-Bytes y Escáner de Patrones Acotado por Diff LCS**.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               TOPOLOGÍA HÍBRIDA DE ARGON v9.2                          │
│                                                                                        │
│   Modelo de Agente Rápido (ej. Gemini Flash / Claude Haiku)                            │
│   [ Alto Throughput · Baja Latencia · Contexto Semántico Compacto ]                    │
│                                      │                                                 │
│                                      ▼                                                 │
│   ESPECIFICACIÓN DE SKILL (~90 líneas por skill)                                       │
│   ├─ Enrutamiento por Riesgo N0 / N1 / N2 y Ciclo de Vida de 6 Pasos                   │
│   ├─ Matriz de Ejecución Ortogonal (Dominio D x Perfil P)                              │
│   └─ Auditoría Portadora de Prueba: <system_audit> en el turno actual                  │
│                                      │                                                 │
│                                      ▼ (El anfitrión pasa JSON vía STDIN)              │
│   INTERCEPTORES DE RUNTIME ({{PLUGIN_DIR}}/hooks/...)                                  │
│   ├─ PreToolUse (`pre-edit-audit.ts`):                                                 │
│   │   • Lee los últimos 128KB del transcript (3 reintentos de 50ms, fail-closed)       │
│   │   • Valida RISK, MATRIX bloqueada por dominio, MODULE (N2) y multi-target          │
│   │   • Archivos de texto: verifica token (+-8 líneas) con auto-reconciliación         │
│   │   • Binarios: verifica presencia en disco y magic bytes de cabecera de 64B         │
│   │   • Bloquea escrituras por shell (> file.ts, sed -i); permite tests/lecturas       │
│   │   • Guarda snapshots de línea base en `os.tmpdir()/argon-staging/<session>/`       │
│   └─ PostToolUse (`post-edit-slop.ts`):                                                │
│       • Calcula líneas añadidas mediante diff LCS contra la línea base de tmpdir       │
│       • Enmascara literales de string ("...", '...', `...`) y comentarios              │
│       • Emite diagnósticos de línea no destructivos sin desincronizar el IDE           │
│                                      │                                                 │
│                                      ▼                                                 │
│   Árbol de Trabajo Verificado (Ediciones Auditadas · Cero Polución en Git)             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Metas y No-Metas

### Metas
* **Verificación Obligatoria de Anclajes Léxicos Antes de Mutar:** Comprobar mecánicamente que el agente inspeccionó cada archivo objetivo (mediante tokens identificadores de alta entropía) antes de permitir ediciones individuales o por lotes (`MultiEdit`).
* **Compatibilidad con Código Heredado (Brownfield) vía Diff LCS:** Restringir el escaneo de calidad estrictamente a las líneas nuevas o modificadas para permitir parches quirúrgicos en archivos heredados sin obligar a refactorizaciones no solicitadas.
* **Prevenir Desincronización del IDE:** Almacenar snapshots temporales en `os.tmpdir()/argon-staging/` (sin ensuciar `git status`) y devolver errores explícitos a nivel de línea sin sobreescribir búferes de memoria del editor.
* **Eliminar Falsos Positivos de Expresiones Regulares en Strings:** Enmascarar literales de texto y comentarios antes de verificar reglas como `: any` o bloques `catch {}` vacíos.

### No-Metas
* **Compilación AST Completa dentro de los Hooks:** Los hooks ejecutan comprobaciones ultrarrápidas (<15ms). La compilación estática completa (`tsc`, `cargo check`) y pruebas unitarias ocurren en el Paso 5 del ciclo de vida.

---

## Los 4 Pilares de Argon v9.2

### 1. Auditoría Portadora de Prueba (PCA) con Anclaje Léxico
Antes de invocar cualquier herramienta de mutación (`edit_file`, `write_file`, `MultiEdit`, `multi_replace_file_content`), el agente debe emitir un bloque `<system_audit>` en su respuesta conversacional:

```xml
<system_audit>
RISK: N1
MATRIX: SYS x MIN
MODULE: NONE
EVIDENCE: [src/core/auth.ts:42["validateSessionToken"], src/new/route.ts:0["NEW_FILE"]]
INVARIANT_CHECK: Preserves POSIX exit codes and idempotent session lookup
</system_audit>
```

El entorno pasa el evento vía `STDIN`. El hook `pre-edit-audit.ts` lee el transcript activo y valida:
* **Literales Reservados (`NEW_FILE` y `MEDIA_ASSET`):** Archivos nuevos deben declararse en la línea `0` con el token `"NEW_FILE"` (`nuevo.ts:0["NEW_FILE"]`). Insumos binarios usan `"MEDIA_ASSET"`, disparando una verificación de cabecera de 64 bytes (`ftyp`, `RIFF`, `ID3`, `PNG`, `JPEG`, `fLaC`, `EBML`).
* **Entropía Léxica y Auto-Reconciliación de Deriva:** Para archivos existentes, el token debe ser un identificador real (≥ 4 caracteres). Si ediciones previas desplazaron la línea más allá de `+-8` líneas, el hook localiza la coincidencia más cercana (hasta 150 líneas) y **auto-reconcilia la coordenada sin bloquear la ejecución**.
* **Comandos de Terminal Permitidos:** Comandos de lectura y test (`npm test`, `git status`, `ffprobe`) corren libremente. Solo se bloquean comandos que intenten redirigir salidas de texto hacia archivos fuente (`> app.ts`, `sed -i`).

### 2. Matrices de Ejecución Ortogonales (D x P)
Las tareas en `N1` y `N2` se clasifican combinando **Dominio (D)** con **Perfil (P)**:

* **Ingeniería de Software (`argon-core` y `argon-builder`):**
  * **Dominio D:**
    * `ENG` (**Engine**): Loops interactivos, Canvas/WebGL, DSP. Invariantes: Loop Zero-GC, `dt` acotado a `<= 0.1s`.
    * `SRF` (**Surface**): UI web/móvil y sistemas de diseño. Invariantes: `CLS == 0`, `WCAG_AA` y los 5 Estados Explícitos (`Empty`, `Loading`, `Success`, `Error`, `Overflow`).
    * `SYS` (**System**): CLIs, demonios, APIs REST/RPC. Invariantes: códigos de salida POSIX, captura de `SIGINT`/`SIGTERM`, I/O idempotente.
    * `PIP` (**Pipeline**): ETL, flujos continuos, colas, migraciones. Invariantes: contrapresión acotada, DLQ, checkpoints atómicos.
  * **Perfil P:** `JCE` (Juice / Resortes) | `CRF` (Craft / Retícula Suiza) | `DNS` (Dense / Alta Densidad de Datos) | `MIN` (Minimal / Cero Dependencias).
* **Ingeniería Audiovisual (`argon-director`):**
  * **Dominio D:** `SHRT` (Shorts 9:16) | `PED` (Tutorial 16:9) | `KEY` (Keynote Lanzamiento) | `DOC` (Documental).
  * **Perfil P:** `BST` (Beast / Ritmo Acelerado) | `KYN` (Keynote Craft) | `CIN` (Cinemático) | `RAW` (Demo en Vivo sin Cortes).

### 3. Enrutamiento por Riesgo (N0 / N1 / N2), Módulos (M1–M11) y Ciclo de 6 Pasos
* **N0 (Trivial):** <=5 líneas en 1 archivo.
* **N1 (Estándar):** 1–3 archivos, cambios acotados.
* **N2 (Alto Riesgo):** >3 archivos, esquemas compartidos, autenticación o concurrencia (requiere al menos un módulo `M1..M11`).

### 4. Escáner de Patrones Acotado por Diff LCS
`post-edit-slop.ts` compara el archivo editado contra la línea base mediante LCS, inspeccionando **únicamente las líneas añadidas**:
* Bloquea comentarios de pereza (`// TODO`, `// rest of code`, `# implement here`) y bloques `catch {}` vacíos.
* Restringe verificaciones de tipo (`: any`, `as any`, `@ts-ignore`) a archivos JS/TS.

---

## Estructura del Repositorio

```text
argon-protocols/
├── plugin.json                      # Manifiesto de plugin de Antigravity (v9.2.0)
├── hooks.json                       # Configuración de interceptores de runtime
├── README.md                        # Especificación de arquitectura (Inglés)
├── README_ES.md                     # Especificación de arquitectura (Español)
├── assets/
│   └── thumbnail.png                # Banner oficial y miniatura del video
├── hooks/
│   ├── pre-edit-audit.ts            # Guardián de pre-edición PCA y deriva léxica
│   └── post-edit-slop.ts            # Escáner anti-slop acotado por diff LCS
├── skills/
│   ├── argon-core/
│   │   └── SKILL.md                 # Protocolo de sistemas y módulos M1-M11
│   ├── argon-builder/
│   │   └── SKILL.md                 # Protocolo greenfield y matriz D x P
│   └── argon-director/
│       └── SKILL.md                 # Protocolo audiovisual, LUFS y ffprobe
└── agents/
    ├── argon-core.md                # Subagente autónomo de sistemas y refactor
    ├── argon-builder.md             # Subagente autónomo de construcción greenfield
    └── argon-director.md            # Subagente autónomo de ingeniería audiovisual
```

---

## Instalación e Integración

### Requisitos Previos
* **Bun** (`>= 1.0`) o **Node.js** (`>= 22.6`) en el `PATH`.
* **Google Antigravity** o **Claude Code**.

### Opción A: Configuración en Google Antigravity
Copia las carpetas `skills/`, `agents/`, `hooks/` y `hooks.json` en `~/.gemini/config/`:

```powershell
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\agents"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.gemini\config\hooks"
Copy-Item -Recurse -Force skills\* "$env:USERPROFILE\.gemini\config\skills\"
Copy-Item -Recurse -Force agents\* "$env:USERPROFILE\.gemini\config\agents\"
Copy-Item -Recurse -Force hooks\* "$env:USERPROFILE\.gemini\config\hooks\"
Copy-Item -Force hooks.json "$env:USERPROFILE\.gemini\config\hooks.json"
```

```bash
# Linux / macOS
mkdir -p ~/.gemini/config/skills ~/.gemini/config/agents ~/.gemini/config/hooks
cp -r skills/* ~/.gemini/config/skills/
cp -r agents/* ~/.gemini/config/agents/
cp -r hooks/* ~/.gemini/config/hooks/
cp hooks.json ~/.gemini/config/hooks.json
```

Al instalarse como plugin de Antigravity, `{{PLUGIN_DIR}}` en `hooks.json` se resuelve dinámicamente. Para instalación global en usuario (`~/.gemini/config/hooks.json`), reemplaza `{{PLUGIN_DIR}}` por la ruta absoluta de `~/.gemini/config`.

---

## Autor y Licencia

* **Arquitecto y Autor:** **Shion** ([@ShionBanned](https://github.com/ShionBanned))
* **Licencia:** [Licencia MIT](LICENSE)
