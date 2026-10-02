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
4. Toggle Multi-select, select two sibling layers, and choose Group in Object options (or the visible selection controls with Scaffold off). Use the layer list or Direct select to reach individual children of a group.
5. Turn on **Auto Key** above the canvas to record changed animatable parameters at the playhead, or tap a property's round key button to enable it manually. Scrub to a new time and change that property to create another key. Add Keyframe enables the basic transforms and, in Direct mode, the path-point track. Later point edits automatically add shape keys. Round timeline markers represent keys; select one and choose Edit key to change its time, value and tween.
6. Select keys and choose a tween. Multi-select also enables selection of several keys; drag them together. Copy and paste places copied keys relative to the current playhead.
7. Record audio or import a file. Trim & volume changes its source trim, timeline offset, volume, and mute state. Drag its waveform to reposition it.
8. Preview, then Export video. Download the completed video. Export Project file creates a portable `.poppy` backup with embedded audio.

Local saves and autosaves use IndexedDB. Refresh starts blank; saved projects remain under Project → Open local project. Audio blobs remain available for undo and saved projects. Browser storage can be cleared by the browser or OS, so keep portable backups for important work.

## Workspace modes and Settings

**Settings** in the top bar contains **Scaffold** and the Properties panel preference. Scaffold **on** gives a guided workspace: Shapes opens a chooser, Object options contains the selected artwork's editing actions, and Canvas options, Sequencer options and Keyframe options expose their respective controls. Scaffold **off** keeps detailed controls visible in compact rows; Shapes opens an inline strip. Both modes provide every tool, animation feature, selection outline and editing handle. Switching modes changes the presentation, not the artwork.

Properties beside the canvas opens or collapses the inspector; its ‹ button also collapses it. Its **Transform, Style, Shape and Animate** tabs separate position/size/pivot, appearance, geometry and animation tracks, with bold section headings. Style includes an exact stroke-width field and a slider; increase width above zero to show an outline. The Animate tab's round property buttons show animation state and whether a key exists at the playhead. Reference layers retain their dedicated opacity/export controls. Properties can be collapsed on desktop, iPad landscape or portrait. Workspace preferences are remembered on this device. **Settings → Composition settings** changes project size, duration, frame rate and background; the same command is in Project.

Compact top controls include **Auto Key** and **Hide sequence / Show sequence**. Hiding sequence editing gives the canvas more room while leaving Playback available. Auto Key enables a track only for a changed animatable parameter; a first edit at a later time preserves its starting pose at the composition or active block start. With Auto Key off, manually enabled tracks still record edits at the playhead. Auto Key applies to transforms, supported colours, stroke width, path/mesh and shadow parameters; static settings such as font choice remain static.

## Shape editing, shading, and clear controls

The canvas dock identifies the current mode. Open Object options with Scaffold on, or use the visible editing actions with Scaffold off. Select taps the frontmost shape at the pointer; overlapping shapes behind it remain reachable through the layer list. Direct select reaches shapes inside groups and exposes editable path points. Edit points converts rectangles and ellipses to paths, including rounded corners and cubic ellipse curves. Tap a square point to select it and reveal its curve handles. Zoom in for dense paths, or navigate with the previous/next point controls. Midpoint insertion preserves the curve; Smooth, Corner, and Delete point edit the selected point. Text stays editable through Properties.

Multi-select two or more closed sibling shapes to use Unite, Subtract front, Keep overlap, or Exclude overlap. Subtract front cuts the shapes in front out of the back shape. Compound path retains outlines with even-odd filling. Join paths connects the nearest ends of two simple open paths. Combining evaluates the current frame, approximates curves with editable polygon points, replaces the source shapes, and uses the front shape's appearance (the back shape for Subtract). Undo restores the originals. Individual source animation tracks are not transferred.

Mesh shading uses a saved colour grid clipped to a closed, filled shape. Select the shape and choose Mesh: the default is a sparse **3 × 3** grid fitted to the full contour, with curved grid lines and contrasting outlines/point markers. Drag points to bend the shading. **Add mesh point** accepts taps inside the shape, away from holes, adding the corresponding grid row/column while preserving existing points and colours. Rows and columns can grow independently, so grids need not remain square; tap-defined spacing is retained. **Set mesh bounds** is optional: tap one side/corner inside the fill, then the opposite side/corner to restrict shading to that area. Such manual bounds use a bilinear grid. Tap a point to select it, or hold it for 550 ms to open swatches, RGB sliders and hex entry. Point colour offers the same panel. Moving more than 8 screen pixels cancels the colour hold.

Choose **Animate mesh** at the first time, move the playhead, then change point colours or positions to create Mesh shading keys. Point insertion and subdivision update the base grid and all mesh keys together so their topology stays compatible. More rows/columns and Subdivide cell also refine the grid. The practical limit is **17 × 17 grid points**, rather than unlimited independent colour nodes; start with a small grid and add only the points needed. Highly concave or disjoint artwork is often easier as separate shaded shapes. New contour meshes follow the outline; Fit to shape refits them while preserving colours. Manually bounded grids keep their chosen bounds. Curves derive from point positions; independent Illustrator-style mesh Bézier handles are unavailable. Explicit mesh keys retain their own geometry during path animation; unkeyed contour meshes refit automatically. Shading exports to video and SVG as a derived PNG capped at 640 pixels on its longer edge. This is Poppy's mesh format; Illustrator mesh-file import is unsupported.

A quick two-finger canvas tap undoes the last edit; movement changes the gesture to pinch/pan. In Select, Direct or Mesh, a touch drag on empty canvas pans. For marquee selection, hold empty canvas for **350 ms** until “Marquee ready”, then drag a selection box. Moving before the hold finishes pans instead; Multi-select keeps prior selections when adding the box's hits. Mouse/pen can drag empty canvas directly to marquee. Normal object dragging follows the pointer one-to-one. A small movement threshold avoids accidental moves on a tap. Snapping starts off; Precision reduces movement to 35% for fine adjustment. Grab offsets are retained for path, mesh and resize handles. The editing dock keeps canvas coordinates stable when selection changes.

Dark mode is the default, with a persistent light/dark toggle. Help includes the five animation steps and guidance for each editing mode. A GUI accessibility review prompted visible contextual actions, plain mode labels, fewer overlapping handles, accurate toggle states, and 44px touch controls. These are general usability improvements; physical-user accessibility validation remains to be done.

Last-used fill, stroke or mesh-point colour is remembered on the device for new artwork. A single empty-canvas tap deselects without creating artwork; a double tap places a shape, while dragging draws it. Line controls provide solid, dashed and dotted styles; uniform, tapered and brush width profiles; and round, flat or square ends with round, sharp or bevel corners. Width remains independently keyframeable. Shape-combiner actions use icon buttons with visible labels.

## Export behavior

The preferred exporter evaluates the same SVG document as preview at exact frame timestamps, encodes with WebCodecs, and muxes MP4 (H.264/AAC) or WebM (VP9/VP8/Opus) according to the device’s supported codecs. Audio is mixed offline at 48 kHz with trim, offset, mute, and volume applied. Output size changes preserve the composition’s aspect ratio with its background filling unused space.

Browsers without supported WebCodecs combinations use a clearly labeled real-time MediaRecorder compatibility export. That fallback can vary in frame timing on a busy device and must remain visible. Cancellation discards partial output. Frame progress is visible for both paths.

Transparent PNG frames are rendered at the composition's frame rate and bundled as frame-00001.png, frame-00002.png, etc. in a ZIP with sequence.json. The canvas paper and letterbox background are omitted; object opacity is retained. The first frame is previewed over a checkerboard. PNG sequences have no audio. Cancellation discards partial output; the ZIP has a 512 MB size limit. Browser validation produced 48 frames and an RGBA sample with 894,122 fully transparent pixels and 26,249 opaque artwork pixels.

## Checks and current limits

Run `npm test` for the model, grouping, tweening, path morph, import validation, input ownership, audio clock, mesh, shape combiner, workspace, movement-reference and pointer-coordinate tests. Performance checks include serialization and evaluation of 100 additional objects with 600 keyframes. The original four code audits and the requested GUI review were completed, with actionable findings addressed.

Browser checks covered drawing, property edits, key creation, scrubbing, grouping/ungrouping, audio import and trim, autosave recovery, and MP4 export. The independently inspected sample contains 144 H.264 frames at 24 FPS, 1280 × 720, with a six-second AAC audio track. Its sound is a generated test tone, not a microphone recording.

Physical iPad/Pencil gestures, Safari-specific codecs, actual microphone permission/recording, and several-minute audio performance remain device validation work; they are not claimed as tested. The compatibility exporter was implemented but not exercised on a browser without WebCodecs.

SVG import supports basic geometry, text, groups, colors, and matrix transforms. Images, filters, masks, gradients, external assets, scripts, and full SVG fidelity are outside this version. Direct select converts raw SVG commands, including arcs, to editable cubic points while retaining compound subpaths. Native paths support matching-node-and-handle morphs; incompatible morphs hold their earlier shape.

Ungrouping an animated group or a group with opacity below 100% is blocked, with an explanation, to preserve descendant motion and compositing. Set opacity to 100% and remove group tracks first. Nested child transforms are preserved through matrix prefixes. Large timelines scroll; changing project structure still rebuilds their rows, while key drags and playhead movement update positions directly. Long/high-resolution exports hold the output in memory.

## Structure

`document/` holds the serializable model and history; `scene/` handles hierarchical transforms; `animation/` evaluates tracks; `renderer/` draws SVG; `input/` owns stage gestures; `timeline/` manages layer/key gestures; `audio/` handles recording and clocks; `export/` renders and encodes; `persistence/` stores projects and imports SVG; `ui/` contains the inspector and demo.

Third-party runtime code is vendored `mp4-muxer`, `webm-muxer`, and [polygon-clipping](https://github.com/mfogel/polygon-clipping), with licenses in `dist/vendor/`. The pinned muxers are isolated behind the export module. Polygon-clipping supplies local Boolean geometry operations; its upstream bundled factory is adapted to an ES module.

## Layer effects, graphs and sequences

Layer in the editing dock (or ⋯ beside a layer) opens drop shadow controls: enable, horizontal/vertical offset in pixels, blur, opacity, and colour. Sliders and exact values preview the effect; Apply commits one undo step and Cancel restores the original. Animate shadow enables independent effect tracks. SVG, video, and transparent PNG exports use the same alpha-based shadow renderer.

Graph opens a **modeless track dock** for the selected layer: the canvas and Playback remain accessible while it is open. Collapse tracks folds its contents; Resize changes its size. Numeric tracks have time/value graphs and draggable round keys; colour, path and mesh tracks show outgoing tween progress. Drag easing handles or enter exact Bézier control points. Keys stay frame-aligned and cannot cross neighbouring keys. Custom curves survive save, copy/paste, sequence repetition and export. This is a value/progress graph editor, not a separate After Effects speed graph.

Sequence / + time copies enabled tracks of selected layers (including grouped children) or all layers for the full composition duration. Paste repeats them on their original layers at the end or at the playhead, extends time when necessary, and shows overlapping-key replacements before pasting. Audio and static layer styling are not copied. + Add seconds extends duration without stretching keys or audio. Seconds/Frames changes timeline and graph measurements. Maximum duration remains 600 seconds.

The requested iPad-app comparison and ASD/ND efficiency audits informed finger-sized graph targets, horizontally scrollable small-screen graphs, readable layer identity, visible unit labels, live reversible adjustment, familiar easing labels and explicit paste consequences. There are no adaptive/personalized modes. Physical iPad/Pencil task testing is still needed to evaluate usability parity.

## Sequencer and studio update

Playback, sequencer editing, and keyframe actions have separate compact rows. Hide sequence folds sequence editing while retaining Playback. Select/move blocks keeps selection separate from scrubbing; empty lanes pan, and two-finger pinch zooms around the fingers' midpoint. A visible block selector reaches very short clips. Animation and recording blocks support split, trim, move, copy/paste and delete. Audio splits retain their source offsets. References support trimming and duplication.

Select a block and choose **Trim range…** to open its Start/End form in the current seconds/frames/bars measurement. Apply trim shortens its active range and keeps at least one frame; it preserves saved keys and the original recording. Removed animation at the start holds its preceding pose, while the removed tail holds the last retained pose. Removed audio stops playing and removed reference frames are hidden. Other blocks keep their timing. Use Split at playhead to make two separate pieces; Undo restores the previous range.

Double-tap an animation block, or choose Edit tracks, to open its parameter sublanes and graph. Block tracks are sparse bounded overrides: graph and canvas edits affect that block while surrounding animation is preserved. Path and mesh tracks use tween-progress graphs. Mesh subdivision updates base, block and cut keys together. Changes remain undoable.

Sequence / + time defines a bounded playback loop in seconds, frames or optional bars. Editable tempo and beats per bar define bar measurement without retiming existing keys. Frame steps, snap feedback and the saved/export-ready status share the playback row. The duration limit is 600 seconds.

Movement reference provides a basic rotatable jointed puppet for Walk, Run, Sprint, Hop and Slide. Walk separates contact, impact/down, passing and up/push-off, with heel-to-toe support and a curved recovery. Arms oppose the legs, hips/chest counter-rotate, and hands/head overlap the primary motion. Run and Sprint shorten support and add flight; Hop crouches before takeoff and compresses after landing; Slide keeps both feet grounded. The live pose label helps identify each phase. The in-place cycle moves support feet backward at steady speed, matching a virtual moving floor. Limb lengths stay fixed and cycles join continuously. These original procedural poses are guided by [Adobe's walk-cycle drawings](https://www.adobe.com/creativecloud/animation/discover/animation-walk-cycle.html) and [Animation Mentor's body-mechanics tutorial](https://www.animationmentor.com/blog/tutorial-animating-human-walk-cycle/).

Set loop length and bake transparent 400 × 400 PNG frames into a locked reference layer below artwork. Reference opacity and export inclusion are in Properties; references are excluded from exports by default. Baking is limited to 10 seconds and 600 frames. This is a simple tracing aid, not motion capture.

Onion skin shows one to three preceding/following artwork frames with adjustable opacity. Ghosts disappear during playback and are excluded from all exports. Neutral charcoal and grey controls, reduced padding, stable mode labels and 44px touch targets keep editing actions visible.

Direct-edit points have independent round/bevel radii. Shape textures import PNG/JPEG/WebP/GIF raster images and offer Cover, Fit, Stretch, Tile, scale and X/Y offset. Imports are embedded as PNG images up to 2048 pixels; texture and bevel output is shared by SVG, PNG and video. Texture previews are reversible and Apply commits one undo step.

The regression suite includes bounded graph edits, frame-identical splits, sparse long-composition trims, block pastes, audio schedules, rotating periodic puppet poses, PNG reference serialization, and sequencer pinch anchoring. Local browser checks cover block graphs, loop-unit conversion, reference baking, and transparent PNG export. Physical iPad multi-touch remains unverified.
