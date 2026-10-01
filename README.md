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

1. Every launch starts on a blank project. Use Project → Open local project to reopen saved work, or load the test composition explicitly.
2. Open Shapes to choose a rectangle, ellipse, triangle, polygon, star, or line. Drag from your finger position, or double-tap empty canvas to place a standard shape. For paths, tap to place a node and drag to give it Bézier handles; tap **Finish path** when done.
3. Choose Select to move artwork. Selection handles resize, rotate, and adjust its pivot. Two fingers pan and zoom the viewport.
4. Toggle Multi-select, select two sibling layers, and tap Group. Use the layer list to select individual children of a group.
5. Tap a property’s diamond to enable its animation. Scrub to a new time and change that property to create another key. Add Keyframe enables the basic transforms and, in Direct mode, the path-point track. Later point edits automatically add shape keys. Each active track has its own diamond button; select a key and choose Edit key to change just its time, value and tween.
6. Select keys and choose a tween. Multi-select also enables selection of several keys; drag them together. Copy and paste places copied keys relative to the current playhead.
7. Record audio or import a file. Trim & volume changes its source trim, timeline offset, volume, and mute state. Drag its waveform to reposition it.
8. Preview, then Export video. Download the completed video. Export Project file creates a portable `.poppy` backup with embedded audio.

Local saves and autosaves use IndexedDB. Refresh starts blank; saved projects remain under Project → Open local project. Audio blobs remain available for undo and saved projects. Browser storage can be cleared by the browser or OS, so keep portable backups for important work.

## Shape editing, shading, and clear controls

The canvas dock shows the current mode and the available editing actions. Direct select reaches shapes inside groups and exposes editable path points. Edit points converts rectangles and ellipses to paths, including rounded corners and cubic ellipse curves. Tap a square point to select it and reveal its curve handles. Zoom in for dense paths, or navigate with the previous/next point controls. Midpoint insertion preserves the curve; Smooth, Corner, and Delete point edit the selected point. Text stays editable through its text controls.

Multi-select two or more closed sibling shapes to use Unite, Subtract front, Keep overlap, or Exclude overlap. Subtract front cuts the shapes in front out of the back shape. Compound path retains outlines with even-odd filling. Join paths connects the nearest ends of two simple open paths. Combining evaluates the current frame, approximates curves with editable polygon points, replaces the source shapes, and uses the front shape's appearance (the back shape for Subtract). Undo restores the originals. Individual source animation tracks are not transferred.

Mesh shading uses a saved colour grid clipped to the shape. Select Mesh and hold a point for 550 ms to open its in-app colour panel (swatches, RGB sliders, and hex entry; no delayed native-picker permission required), or tap a point and use Point colour in the canvas dock. Moving more than 8 screen pixels cancels the hold. More rows/columns refine the grid. Subdivide cell splits the cell beside the selected point; Tap to subdivide inserts a row and column through the cell at your tap, preserving existing points and colours. The limit is 17 × 17 points. New meshes contour the object's outer outline, using curved grid lines for curved shapes. Fit to shape preserves colours while resetting point positions to the outline. Holes are clipped; highly concave or disjoint shapes can require manual positioning or separate meshes. Choose Animate mesh at the first frame, move the playhead, then edit colours or drag points to create keys on the Mesh shading track. Subdivision updates the base grid and every mesh key together. Explicit mesh keys retain their geometry when path points animate; Fit to shape can refit at the current key. Unkeyed contour meshes refit while path points animate; it is included in video and SVG export as a derived PNG fill. This is Poppy's mesh format, with no Illustrator mesh-file import. Its shading image is capped at 640 pixels on its longer edge.

A quick two-finger canvas tap undoes the last edit; finger movement keeps pinch and pan gestures separate. Normal dragging follows the pointer one-to-one. A small movement threshold avoids accidental moves on a tap. Snapping starts off; Precision deliberately reduces movement to 35% for fine adjustment. Grab offsets are retained for path, mesh, and resize handles. The fixed-height editing dock keeps canvas coordinates stable when selection changes.

Dark mode is the default, with a persistent light/dark toggle. Help includes the five animation steps and guidance for each editing mode. A GUI accessibility review prompted visible contextual actions, plain mode labels, fewer overlapping handles, accurate toggle states, and 44px touch controls. These are general usability improvements; physical-user accessibility validation remains to be done.

Last-used fill, stroke or mesh-point colour is remembered on the device for new artwork. A single empty-canvas tap deselects without creating artwork; a double tap places a shape, while dragging draws it. Line controls provide solid, dashed and dotted styles; uniform, tapered and brush width profiles; and round, flat or square ends with round, sharp or bevel corners. Width remains independently keyframeable. Shape-combiner actions use icon buttons with visible labels.

## Export behavior

The preferred exporter evaluates the same SVG document as preview at exact frame timestamps, encodes with WebCodecs, and muxes MP4 (H.264/AAC) or WebM (VP9/VP8/Opus) according to the device’s supported codecs. Audio is mixed offline at 48 kHz with trim, offset, mute, and volume applied. Output size changes preserve the composition’s aspect ratio with its background filling unused space.

Browsers without supported WebCodecs combinations use a clearly labeled real-time MediaRecorder compatibility export. That fallback can vary in frame timing on a busy device and must remain visible. Cancellation discards partial output. Frame progress is visible for both paths.

Transparent PNG frames are rendered at the composition's frame rate and bundled as frame-00001.png, frame-00002.png, etc. in a ZIP with sequence.json. The canvas paper and letterbox background are omitted; object opacity is retained. The first frame is previewed over a checkerboard. PNG sequences have no audio. Cancellation discards partial output; the ZIP has a 512 MB size limit. Browser validation produced 48 frames and an RGBA sample with 894,122 fully transparent pixels and 26,249 opaque artwork pixels.

## Checks and current limits

Run `npm test` for the model, grouping, tweening, path morph, import validation, input ownership, audio clock, mesh, shape combiner, and pointer-coordinate tests. Forty-six tests pass, including serialization and evaluation of 100 additional objects with 600 keyframes. The original four code audits and the requested GUI review were completed, with actionable findings addressed.

Browser checks covered drawing, property edits, key creation, scrubbing, grouping/ungrouping, audio import and trim, autosave recovery, and MP4 export. The independently inspected sample contains 144 H.264 frames at 24 FPS, 1280 × 720, with a six-second AAC audio track. Its sound is a generated test tone, not a microphone recording.

Physical iPad/Pencil gestures, Safari-specific codecs, actual microphone permission/recording, and several-minute audio performance remain device validation work; they are not claimed as tested. The compatibility exporter was implemented but not exercised on a browser without WebCodecs.

SVG import supports basic geometry, text, groups, colors, and matrix transforms. Images, filters, masks, gradients, external assets, scripts, and full SVG fidelity are outside this version. Direct select converts raw SVG commands, including arcs, to editable cubic points while retaining compound subpaths. Native paths support matching-node-and-handle morphs; incompatible morphs hold their earlier shape.

Ungrouping an animated group or a group with opacity below 100% is blocked, with an explanation, to preserve descendant motion and compositing. Set opacity to 100% and remove group tracks first. Nested child transforms are preserved through matrix prefixes. Large timelines scroll; changing project structure still rebuilds their rows, while key drags and playhead movement update positions directly. Long/high-resolution exports hold the output in memory.

## Structure

`document/` holds the serializable model and history; `scene/` handles hierarchical transforms; `animation/` evaluates tracks; `renderer/` draws SVG; `input/` owns stage gestures; `timeline/` manages layer/key gestures; `audio/` handles recording and clocks; `export/` renders and encodes; `persistence/` stores projects and imports SVG; `ui/` contains the inspector and demo.

Third-party runtime code is vendored `mp4-muxer`, `webm-muxer`, and [polygon-clipping](https://github.com/mfogel/polygon-clipping), with licenses in `dist/vendor/`. The pinned muxers are isolated behind the export module. Polygon-clipping supplies local Boolean geometry operations; its upstream bundled factory is adapted to an ES module.

## Layer effects, graphs and sequences

Layer in the editing dock (or ⋯ beside a layer) opens drop shadow controls: enable, horizontal/vertical offset in pixels, blur, opacity, and colour. Sliders and exact values preview the effect; Apply commits one undo step and Cancel restores the original. Animate shadow enables independent effect tracks. SVG, video, and transparent PNG exports use the same alpha-based shadow renderer.

Graph opens an editor for the selected layer. Numeric tracks have time/value graphs and draggable keys; colour, path and mesh tracks show outgoing tween progress. Drag the easing handles or enter exact Bézier control points. Keys stay frame-aligned and cannot cross neighbouring keys. Custom curves survive save, copy/paste, sequence repetition and export. This is a value/progress graph editor, not a separate After Effects speed graph.

Sequence / + time copies enabled tracks of selected layers (including grouped children) or all layers for the full composition duration. Paste repeats them on their original layers at the end or at the playhead, extends time when necessary, and shows overlapping-key replacements before pasting. Audio and static layer styling are not copied. + Add seconds extends duration without stretching keys or audio. Seconds/Frames changes timeline and graph measurements. Maximum duration remains 600 seconds.

The requested iPad-app comparison and ASD/ND efficiency audits informed finger-sized graph targets, horizontally scrollable small-screen graphs, readable layer identity, visible unit labels, live reversible adjustment, familiar easing labels and explicit paste consequences. There are no adaptive/personalized modes. Physical iPad/Pencil task testing is still needed to evaluate usability parity.

## Next phase

- Add an option to turn off scaffold mode without introducing another popup.
- Replace the separate shape-picker dialog with Illustrator-style shape selection in the existing tool area or editing dock.
- Add bevel controls for individual shape/path points, with an adjustable bevel amount per point.
- Allow an imported image to be used as a shape texture, with selectable cover/fit behaviour and controls for its scale and position within the shape.
