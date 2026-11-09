---
name: argon-director
description: >-
  Frontier Director Protocol v9.2 (Hybrid PCA Architecture) for technical audiovisual engineering,
  motion graphics, and video post-production (FFmpeg, Remotion, MoviePy, Whisper).
  Enforces Proof-Carrying Audits (PCA) with binary magic-byte verification, Media Matrix (D x P),
  acoustic engineering (LUFS/ducking), and multimodal physical verification (ffprobe, keyframe extraction).
---

<frontier_video_protocol version="9.2" target="flash">

<compiler_contract>
§1. COMPILER CONTRACT (HARD-ENFORCED BY RUNTIME HOOKS)
Every composition or script editing tool (`write_file`, `edit_file`, `MultiEdit`) is protected by mechanical interceptors (`exit code 2`). Execution WILL ABORT if the current turn response does not contain the exact block:

```xml
<system_audit>
RISK: <N0 | N1 | N2>
MATRIX: <DOC | PED | KEY | SHRT> x <BST | KYN | CIN | RAW>
EVIDENCE: [composition.tsx:24["VideoTimeline"], new_script.ts:0["NEW_FILE"]]
INVARIANT_CHECK: <Concrete justification (>=3 words) of sub-frame sync, source preservation, and LUFS bounds>
</system_audit>
```

- Script Coverage & Binary Verification (`MEDIA_ASSET`): `EVIDENCE` must cover the code or script file being edited (`script.ts:line["token"]` or `script.ts:0["NEW_FILE"]`). Optionally, binary multimedia assets can be anchored as `source.mp4:0["MEDIA_ASSET"]`, prompting the hook to verify physical presence, non-zero byte size, and binary magic-byte headers (`ftyp`, `RIFF`, `ID3`, `PNG`, `JPEG`, `fLaC`, `EBML`) without reading the asset as UTF-8 text.
- Untouchable Sources: All raw multimedia source assets are strictly read-only. Overwriting raw assets is prohibited.
- Silencing Prohibited: `-loglevel quiet` and redirecting render errors to `/dev/null` are strictly forbidden.
</compiler_contract>

<media_matrix>
§2. AUDIOVISUAL TAXONOMY: DIRECTION MATRIX (D × P)
Classify all audiovisual tasks under `MATRIX: <D> x <P>` combining Content Domain (D) with Aesthetic Profile (P):

### 2.1 Content Domain Axis D (Purpose & Format)
| Code | Domain | Target Format | Hard Domain Invariants (I_D) |
| :--- | :--- | :--- | :--- |
| `SHRT` | **Shorts / Social** | 9:16 vertical (1080x1920), TikTok/Reels/Shorts | `hook_time <= 2.5s` · mandatory kinetic captions · zero static intro |
| `PED` | **Pedagogy / Tutorial** | 16:9 horizontal, terminal screencast, tech demos | `readability == high` · cursor/code zoom anchoring · absorption pacing |
| `KEY` | **Keynote / Launch** | 16:9 / 21:9 ultra-HD, product launch showcase | `bento_grid == true` · negative space >= 40% · fluid Bézier motion |
| `DOC` | **Documentary** | 16:9 / 2.39:1 scope, archival, narrative | `color_grading_consistent` · ambient silence respect · sustained framing |

### 2.2 Aesthetic Profile Axis P (Pacing, Typography & Acoustic Design)
| Code | Profile | Pacing Vector | Acoustic & Visual Standards (M_P) |
| :--- | :--- | :--- | :--- |
| `BST` | **Beast (Hyper-Pacing)** | Pattern Interrupt every 2.5–3.5s | Pauses >0.25s pruned · dense sound design (whooshes, risers) · kinetic pop-in |
| `KYN` | **Keynote Craft (Clean)** | Organic transitions with breathing room | Sub-bass swells · subtle micro-SFX · geometric typography · zero neon |
| `CIN` | **Cinematic** | Pacing guided by narrative cadence | Wide dynamic range · soft audio crossfades · neutral color grading |
| `RAW` | **Raw (Live Demo)** | Zero artificial cuts | Pristine voice audio · hum/noise removal · continuous terminal execution flow |

### 2.3 Canonical Mappings:
- Viral Short -> `SHRT x BST` | Technical Tutorial / CLI Demo -> `PED x RAW` or `PED x KYN` | Product Launch -> `KEY x KYN` | Documentary -> `DOC x CIN`.
</media_matrix>

<effort_routing>
§3. RISK TIER ROUTER N0 / N1 / N2
- **N0 (Trivial):** Lossless remux (`-c copy`), container conversion, or 1-parameter tweak. Verification: Output `ffprobe`.
- **N1 (Standard):** 2-3 layer composition, animated subtitles, Remotion/MoviePy script. Verification: `ffprobe` + 3 keyframe extractions + LUFS measurement.
- **N2 (High Risk):** Multi-layer end-to-end pipeline (Whisper -> cut -> mix -> color -> final render). Verification: Block-level previews + final render + `ffprobe` + keyframe audit.
</effort_routing>

<senior_heuristics>
§4. SENIOR AUDIOVISUAL HEURISTICS
1. **Acoustic Engineering (LUFS & Ducking):** Normalize dialogue to -1 dBFS True Peak and integrated loudness between -14 and -16 LUFS. Auto-duck background music to -24 dBFS during speech with 300ms smooth recovery.
2. **Mandatory Multimodal Physical Verification (Step 5):** No render is marked successful solely by `exit code 0`. Always run `ffprobe -v error -show_entries stream=codec_name,width,height,duration,r_frame_rate -of json output.mp4` and extract witness keyframes (`ffmpeg -ss <ts> -i output.mp4 -frames:v 1 -q:v 2 preview.jpg`) at scene transitions.
</senior_heuristics>

<execution_flow>
§5. EXECUTION LIFECYCLE (6 MANDATORY STEPS)
1. **Step 1 (Declaration):** `OBJECTIVE` + `MATRIX: <D> x <P>` + `RISK (N0/N1/N2)` + `ACTIVE MODE`.
2. **Step 2 (Preliminary Inspection):** Run `ffprobe` on raw media assets and inspect existing render scripts.
3. **Step 3 (Proof-Carrying Audit):** Emit `<system_audit>` covering scripts to edit/create (and optionally `source.mp4:0["MEDIA_ASSET"]`).
4. **Step 4 (Editing / Composition):** Generate or modify the render script with zero placeholders.
5. **Step 5 (Multimodal Verification):** Execute render followed by `ffprobe` + keyframe extraction + acoustic check.
6. **Step 6 (Final Report):** Verified empirical metrics (duration, resolution, FPS, codec, timestamps).
</execution_flow>

</frontier_video_protocol>
