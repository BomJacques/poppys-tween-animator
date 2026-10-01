# Poppy's Tween Tweening Animator

A local-first SVG animation editor for touch, Pencil, and mouse. No backend or accounts are needed to run the saved application.

## Run locally

With Node.js installed, open a terminal in this folder and run:

```sh
npm start
```

Open `http://127.0.0.1:5173`. The `dist/` folder is also ready for any static HTTPS host. Microphone and WebCodecs access require HTTPS or localhost. The vendored muxers are already included; dependency installation is unnecessary for running the app.

## GitHub Pages

The included `.github/workflows/pages.yml` runs the checks and deploys `dist/` whenever `main` changes. In the repository’s Settings → Pages, choose **GitHub Actions** as the source. All application URLs are relative, so a project site such as `https://ACCOUNT.github.io/REPOSITORY/` works without rewriting asset paths. Only static application files are deployed; animation projects and audio remain in each user’s browser.

## Make an animation

1. Use Project → New project, or start with the test composition.
2. Choose a drawing tool and draw on the stage. For paths, tap to place a node and drag to give it Bézier handles; tap **Finish path** when done.
3. Choose Select to move artwork. Selection handles resize, rotate, and adjust its pivot. Two fingers pan and zoom the viewport.
4. Toggle Multi-select, select two sibling layers, and tap Group. Use the layer list to select individual children of a group.
5. Tap a property’s diamond to enable its animation. Scrub to a new time and change that property to create another key. Add Keyframe inserts the existing animated properties, or the basic transforms when none are enabled.
6. Select keys and choose a tween. Multi-select also enables selection of several keys; drag them together. Copy and paste places copied keys relative to the current playhead.
7. Record audio or import a file. Trim & volume changes its source trim, timeline offset, volume, and mute state. Drag its waveform to reposition it.
8. Preview, then Export video. Download the completed video. Export Project file creates a portable `.poppy` backup with embedded audio.

Local saves and debounced autosaves use IndexedDB. Refresh recovers the last project. Audio blobs remain available for undo and saved projects. Browser storage can be cleared by the browser or OS, so keep portable backups for important work.

## Export behavior

The preferred exporter evaluates the same SVG document as preview at exact frame timestamps, encodes with WebCodecs, and muxes MP4 (H.264/AAC) or WebM (VP9/VP8/Opus) according to the device’s supported codecs. Audio is mixed offline at 48 kHz with trim, offset, mute, and volume applied. Output size changes preserve the composition’s aspect ratio with its background filling unused space.

Browsers without supported WebCodecs combinations use a clearly labeled real-time MediaRecorder compatibility export. That fallback can vary in frame timing on a busy device and must remain visible. Cancellation discards partial output. Frame progress is visible for both paths.

## Checks and current limits

Run `npm test` for the model, grouping, tweening, path morph, import validation, input ownership, and audio clock tests. Thirteen tests passed at delivery, including serialization and evaluation of 100 additional objects with 600 keyframes. All four requested code audits were run and their actionable findings addressed.

Browser checks covered drawing, property edits, key creation, scrubbing, grouping/ungrouping, audio import and trim, autosave recovery, and MP4 export. The independently inspected sample contains 144 H.264 frames at 24 FPS, 1280 × 720, with a six-second AAC audio track. Its sound is a generated test tone, not a microphone recording.

Physical iPad/Pencil gestures, Safari-specific codecs, actual microphone permission/recording, and several-minute audio performance remain device validation work; they are not claimed as tested. The compatibility exporter was implemented but not exercised on a browser without WebCodecs.

SVG import supports basic geometry, text, groups, colors, and matrix transforms. Images, filters, masks, gradients, external assets, scripts, and full SVG fidelity are outside this version. Imported raw SVG paths preserve their geometry but do not expose their nodes for editing. Native paths support matching-node-and-handle morphs; incompatible morphs hold their earlier shape.

Ungrouping an animated group or a group with opacity below 100% is blocked, with an explanation, to preserve descendant motion and compositing. Set opacity to 100% and remove group tracks first. Nested child transforms are preserved through matrix prefixes. Large timelines scroll; changing project structure still rebuilds their rows, while key drags and playhead movement update positions directly. Long/high-resolution exports hold the output in memory.

## Structure

`document/` holds the serializable model and history; `scene/` handles hierarchical transforms; `animation/` evaluates tracks; `renderer/` draws SVG; `input/` owns stage gestures; `timeline/` manages layer/key gestures; `audio/` handles recording and clocks; `export/` renders and encodes; `persistence/` stores projects and imports SVG; `ui/` contains the inspector and demo.

The only third-party runtime code is vendored `mp4-muxer` and `webm-muxer`, with licenses in `dist/vendor/`. These pinned small muxers are isolated behind the export module so they can be replaced independently.
