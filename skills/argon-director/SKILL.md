---
name: argon-director
description: >-
  Frontier Director Protocol v9.0 (Hybrid PCA Architecture) for technical audiovisual engineering,
  motion graphics, and video post-production (FFmpeg, Remotion, MoviePy, Whisper).
  Enforces Proof-Carrying Audits (PCA), Media Tensor (D x P), acoustic engineering (LUFS/ducking),
  and multimodal physical verification (ffprobe, keyframe extraction).
---

<frontier_video_protocol version="9.0" target="flash">

<compiler_contract>
§1. COMPILER CONTRACT (HARD-ENFORCED BY RUNTIME HOOKS)
Every mutation or rendering tool is guarded by mechanical interceptors (`exit code 2`). Execution WILL ABORT if the preceding response does not contain the exact block:

```xml
<system_audit>
RISK: <N0 | N1 | N2>
MATRIX: <DOC | PED | KEY | SHRT> x <BST | KYN | CIN | RAW>
EVIDENCE: [source.mp4:1["ffprobe_streams"], script.ts:0["NEW_FILE"]]
INVARIANT_CHECK: <1 line proving sub-frame sync, source preservation, and audio profile>
</system_audit>
```

- Untouchable Sources: All source assets are strictly read-only. Overwriting raw media files is strictly prohibited.
- Multimodal Physical Verification: `exit code 0` proves nothing. Declaring render completion without executing `ffprobe` and extracting verification keyframes at transition points is strictly forbidden.
- Silencing Prohibited: Using `-loglevel quiet` or redirecting errors to `/dev/null` is forbidden. Every FFmpeg warning and error must remain auditable.
</compiler_contract>

<media_tensor>
§2. AUDIOVISUAL TAXONOMY: DIRECTION TENSOR (D × P)
Classify every media task into `MATRIX: <D> x <P>` by evaluating Content Domain by Aesthetic Profile:

### 2.1 Content Domain Axis D (Purpose & Target Format)
| Code | Domain | Target Format | Domain Invariants ($\mathcal{I}_D$) |
| :--- | :--- | :--- | :--- |
| `SHRT` | **Shorts / Social** | 9:16 vertical (1080x1920), TikTok/Reels/Shorts | `hook_time <= 2.5s` · mandatory kinetic captions · zero static intros |
| `PED` | **Pedagogy / Tutorial** | 16:9 widescreen, terminal screencasts, tech demos | `readability == high` · cursor/code focused zoom · cognitive absorption pauses |
| `KEY` | **Keynote / Launch** | 16:9 / 21:9 ultra-HD, institutional showcase | `bento_grid == true` · negative space ≥40% · fluid Bézier curves |
| `DOC` | **Documentary / Narrative** | 16:9 / 2.39:1 anamorphic, archival, interviews | `color_grading_consistent` · respect ambient room tone · sustained takes |

### 2.2 Aesthetic Profile Axis P (Pacing, Typography & Acoustic Standard)
| Code | Profile | Pacing Vector | Visual & Acoustic Standard ($\mathcal{M}_P$) |
| :--- | :--- | :--- | :--- |
| `BST` | **Beast (Hyper-Pacing)** | Pattern interrupt every 2.5-3.5s | Cuts silences >0.25s · dense sound design (whooshes, risers) · kinetic pop-in |
| `KYN` | **Keynote (Apple Clean)** | Organic transitions with deliberate pauses | Sub-bass swells · subtle micro-SFX · pure geometric typography · zero neon |
| `CIN` | **Cinematic** | Cadence-driven emotional pacing | Wide dynamic range · soft audio crossfades · neutral film color grade |
| `RAW` | **Raw (Live Screencast)** | Zero artificial cuts | Pristine voice audio · strict noise floor and hum removal · zero cursor jumps |

### 2.3 Canonical Mappings:
- Viral Social Short $ightarrow$ `SHRT x BST` | Developer Tutorial / CLI Demo $ightarrow$ `PED x RAW` or `PED x KYN`
- SaaS Launch Video $ightarrow$ `KEY x KYN` | Corporate Mini-Doc $ightarrow$ `DOC x CIN`
</media_tensor>

<effort_routing>
§3. N0 / N1 / N2 RISK TIER ROUTER
- **N0 (Atomic / Transcode):** Container remuxing, stream copy without re-encoding (`-c copy`), audio extraction, loudness normalization. Verification: single-line output `ffprobe`.
- **N1 (Composite Composition):** Multi-layer composition (2-3 tracks), animated subtitle overlays, intro/outro bumpers, Remotion/MoviePy scripts. Verification: `ffprobe` + extraction of 3 keyframes + integrated loudness test.
- **N2 (End-to-End Pipeline):** Full multi-track video render, end-to-end automated pipeline (Whisper -> transcript -> cutlist -> audio mix -> color grading -> render). Verification: block-by-block preview renders + final render inspection + source asset hash check.
</effort_routing>

<senior_heuristics>
§4. SENIOR AUDIOVISUAL HEURISTICS

1. ACOUSTIC ENGINEERING (LUFS & DUCKING)
- Dialogue & Primary Voice: Peak normalized to -1 dBFS, integrated loudness between -14 and -16 LUFS (YouTube/Spotify standard).
- Automatic Audio Ducking: Background music must attenuate to **-24 dBFS** during speech, with a smooth 300ms release curve after dialogue ends.
- Zero Digital Clipping: Peak levels above 0 dBFS are strictly forbidden.

2. MANDATORY MULTIMODAL PHYSICAL VERIFICATION
Before delivering any completed video:
- Run `ffprobe -v error -show_entries stream=codec_name,width,height,duration,r_frame_rate -of json output.mp4` and verify exact compliance with delivery specifications.
- Extract verification keyframes (`ffmpeg -ss <timestamp> -i output.mp4 -frames:v 1 -q:v 2 preview.jpg`) at cut points or key transitions to physically audit visual synchronization.
</senior_heuristics>

<execution_flow>
§5. MANDATORY EXECUTION FLOW
1. Initial Declaration: `OBJECTIVE` + `MATRIX: <D> x <P>` + `RISK (N0/N1/N2)` + `ACTIVE MODE`.
2. Preliminary Inspection: Run `ffprobe` on source media to validate resolution, frame rate, and audio channel configuration.
3. Emit `<system_audit>` containing verified lexical anchors.
4. Script/Composition Generation or Atomic Media Editing.
5. Chained Physical Verification (`ffprobe` + keyframe extraction + loudness audit).
6. Final Report with empirical render metrics (exact duration, bitrate, video/audio codecs, and timestamp verification).
</execution_flow>

</frontier_video_protocol>
