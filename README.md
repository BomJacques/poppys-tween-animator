# Poppy's Tween Tweening Animator

A local-first SVG animation editor for touch, Pencil and mouse. Projects and audio stay in your browser; no account or backend is needed.

## Run locally

With Node.js installed, run this in the project folder:

```sh
npm start
```

Open http://127.0.0.1:5173. The dist/ folder is ready for static HTTPS hosting; its vendored dependencies need no installation to run. Microphone and WebCodecs access require localhost or HTTPS.

For GitHub Pages, choose **GitHub Actions** in the repository's Settings → Pages. The included .github/workflows/pages.yml checks and deploys dist/ when main changes. Relative application URLs support project sites. Saved projects are not uploaded with the site.

## Make an animation

1. Every launch starts blank. **File → Project → Open local project** restores saved work; **Open test composition** loads the demo explicitly.
2. Open **Shapes**, choose a shape, then drag to draw it. Double-tap empty canvas for a standard shape. Pencil follows a stroke; Path places anchors with taps and curves with drags. Choose **Finish path** when done.
3. Use **Select** to move, resize and rotate artwork. **Uniform size** makes squares/circles while drawing and keeps the existing aspect ratio while resizing. Its blue highlight appears only while enabled. Shift does the same. Two fingers pan, pinch to zoom and twist to rotate the canvas view. Fit returns the canvas upright. Adding a second finger during a visible drawing keeps that drawing and begins canvas navigation. Hold two fingers still for 300 ms, then drag to pan at fixed zoom and angle; a quick two-finger tap undoes.
4. Turn on **Auto Key**, or add a keyframe at the starting time. Choose **Next pose +1s**, or advance the playhead yourself, then change the artwork. Repeated edits at the same frame update its existing key. Existing animated properties still record with Auto Key off.
5. Return to frame 0 and press **Play**. Choose **Graph** to refine value, timing and easing. Add audio through File → Import → Audio, or record through Options → Audio.
6. **File → Export → Animation** exports video with audio or transparent PNG frames. **File → Export → Project backup** saves a portable .poppy file with embedded assets.

Local saves use IndexedDB. Refresh starts blank; saved projects remain available under File → Open local project. Keep portable backups because browser or operating-system cleanup can remove local storage.

## Record motion or build poses

**Auto Key** builds poses at the playhead. A normal canvas touch pauses playback; it does not record a continuous drag.

**Record motion** captures movement over elapsed time. Arm it, use Select, then drag artwork. Recording starts when movement begins and captures positions at the project's frame rate. Release finishes a take as one undo step. It remains armed for another drag until switched off. A second touch, pointer cancellation or Escape cancels the take. Rotation, scaling and other pose changes use Auto Key or property key buttons. Audio recording is a separate control.

**Sequence** and **Keys** tabs share one 44 px control row, saving the space formerly used by a second toolbar while keeping Playback visible. Previous/Next key navigates selected layers or tracks. Next pose +1s advances one second and extends the duration if needed, up to ten minutes. Timeline **Fit** shows the whole sequence; **Keyframe options → Timeline view → Focus block** frames the selected animation or audio block. Hide sequence beside Canvas options gives the canvas more room without hiding Playback.

## Menus, Layers and Properties

**File** separates Project, Import, Export and Help. **Edit** separates History, Clipboard, Selection and Shape construction. **Options** separates Workspace, Canvas, Animation and Audio.

**Options → Workspace settings** contains Scaffold and the Properties-panel preference. Scaffold on places editing choices in Object options (Shape & style, Animate and Arrange); Scaffold off keeps detailed editing controls in a compact row. Both modes retain the tools and editing handles. **File → Project → Composition settings** changes composition size, duration, frame rate and background. Workspace/theme preferences are remembered on this device.

**Layers** opens a dedicated panel for selecting overlapping artwork, expanding groups, renaming, reordering, visibility and locking. Multi-select supports grouping and selection of several layers. Object options → Arrange or the object/layer hold menu offers Bring to front, Bring forward, Send backward and Send to back. Stacking stays within the current group and preserves selected layers’ relative order. Direct select reaches children inside a group.

Properties beside the canvas opens or collapses the inspector. Drag its left divider to resize it; focus the divider for ArrowLeft/Right (16 px), Shift+Arrow (64 px), Home/End (minimum/maximum). The preferred width is remembered and clamped to the current screen size. Cancelled gestures restore the previous width.

The inspector groups controls in tabs:

- **Transform:** position, size, rotation, scale, pivot and resizing.
- **Style:** Opacity for shapes, groups and images; fill/stroke, line styles/profiles, Mesh shading and Effects.
- **Shape:** text, path points and geometry.
- **Animate:** property tracks and round key buttons.

**Style → Effects** and **Object options → Appearance** contain Drop shadow and Motion blur. Shadow controls preview offsets, blur, opacity and colour; Apply commits one undo step, Cancel discards the preview, and Animate shadow enables effect tracks. Motion blur has shutter angle and sample-count controls. Reference and group launchers show their appropriate options. Effects are included in SVG, video and PNG exports.

## Spin, line noise and sequencer shortcuts

Rotation retains signed full turns across handle drags, numeric fields, keyframes, graphs and exports: 720° interpolates through two complete spins. Transform shows full turns plus the remaining angle. Snap constrains the result without losing accumulated turns. Ungroup refuses animated group transforms, including block-owned tracks, rather than discarding them.

**Style → Line style → Line noise** gives open stroked paths a deterministic vector wobble. Scaffold exposes the same controls under **Object options → Appearance**. Strength sets displacement in pixels, Size sets spacing in pixels, Speed sets cycles/second (0 freezes; negative reverses), and Seed changes the pattern. These four parameters can be keyframed and edited in Graph. Original path anchors, handles and fill are preserved; line profiles, stroke patterns, shadows and motion blur use the evaluated stroke. Preview, SVG, PNG and video share project-clock rendering.

**Sequence → Razor** cuts an animation/audio block at the tapped frame, independent of the playhead. Endpoint taps do nothing. A stationary **550 ms hold** on a block or empty lane opens a modeless **Copy/Paste** menu near your finger; movement, a second touch or cancellation clears the hold. A hold in Razor mode opens the menu without cutting. Paste starts at the held frame, does not seek, and preserves an animation block’s source layer. Audio uses its matching lane/clipboard. Explicit Scrub mode retains immediate blank-lane scrubbing. Commands keep visible labels beside consistent line icons.

## Colour, pivots and shape editing

Fill/Stroke beside the selected name opens live colour preview with hex entry and **Last 10 colours**. Apply commits the chosen colour; Cancel restores the previous appearance. The last applied colour is remembered for new artwork. Hold selected artwork still for 550 ms for the grouped clipboard, Colour, pivot and selection menu; moving more than 8 screen pixels cancels the hold. Edit → Clipboard also provides Cut.

**Pivot** explicitly reveals a finger-sized target. Drag it or use **Centre pivot**, then choose **Done pivot**. Artwork stays in place while its pivot changes, and animated pivot edits preserve the original frame-zero pose. Ordinary object editing keeps the pivot target hidden. Zoom enlarges the vector artwork instead of scaling a flattened canvas picture.

Pencil, Path and Direct point editing show square anchors and round curve handles without the object transform box. Finished Pencil strokes are ready for point editing. Select a point and choose Convert to curve, Smooth or Corner; drag the tangents to shape it. Midpoint insertion preserves the curve. Switch to Select for whole-object resizing/rotation.

In Direct, drag an empty area to marquee individual anchors, including shapes inside nested groups. Drag a selected anchor to move the selected point set together. The group stays intact; locked or hidden contents are excluded. Auto Key preserves earlier poses, and Undo restores the edit in one step. Select mode retains its hold-then-drag object marquee.

In Direct, eligible corners have their own round radius widget. Drag a widget toward the corner to reduce rounding, or away to increase it. **Selected corner radius (px)** gives an exact value. Each corner keeps its own radius; neighbouring edge lengths limit it. Dense Pencil paths reveal more widgets as you zoom in. Smooth points and open endpoints use their Bézier handles instead. Auto Key records radius changes with the path while preserving earlier poses.

**Edit → Shape construction → Add rubber hose limb** creates a basic IK limb rendered as a curved vector stroke. Direct select moves the start/end controls and solves the middle bend from two segment lengths. Drag the middle control across the limb to flip its bend. **Properties → Shape → Limb rig** exposes upper/lower length, bend side and optional stretch. Unreachable targets clamp unless stretch is enabled. Rest lengths and bend side travel with keyed path poses, so seeking does not re-solve old frames. **Style** controls thickness. **Convert to free path** enables ordinary path editing. Existing saved hoses retain their free-curve behavior. This is a two-segment solver with independent limbs, not a connected skeleton or a full commercial rig.

Multi-select closed sibling shapes to Unite, Subtract front, Keep overlap, Exclude overlap or create a Compound path. The result uses the current outline and full new bounds, rather than clipping expanded artwork to an old shape's box. Combining replaces the source shapes at the current frame; Undo restores them. Join paths connects two open paths. Individual source animation tracks are not transferred.

**Move sequence…** in Object options → Animate, object/layer menus, or a held sequence lane shifts the layer’s whole saved animation. Set its new start in seconds or frames. Keys, blocks and cuts move together; groups include animated descendants, and references move their visibility window. Timing differences and sequence length stay intact; audio and other layers keep their timing. Apply makes one undo step and extends the composition when needed, up to ten minutes. Keyframes continue holding their first pose before the shifted start.

Popups share neutral surfaces, clear grouped headings and muted category colours. Object options uses **Shape & style**, **Animate** and **Arrange** tabs; Canvas options uses compact cards and explicit On/Off states. Labels and selected states remain visible alongside colour.

## Continuous mesh shading

Mesh replaces a closed shape's flat fill with continuous colour shading. Its initial 3 × 3 grid follows the existing outline. Boundary points remain on that outline; internal points adjust the colour flow. Add mesh point inserts grid rows/columns while preserving colours, and optional Set mesh bounds uses two taps inside the shape. Hold a point for colour, or use Point colour.

Pencil and Path drawings can use the same shading. An open drawing with area offers **Close drawing & add mesh**, explicitly joining its endpoints and shading the same object in one undo step. Closed hand-drawn and imported SVG contours work directly. Straight open lines remain strokes; compound drawings require every contour to be closed.

Auto Key or Animate mesh records colour/point changes at later times. Insertion and subdivision update existing mesh keys together; Fit to shape refits the grid. The maximum is **17 × 17 points**. Start small, especially for concave or disjoint artwork.

Preview/export shading resolution adapts up to **2048 pixels on the longer edge**. The silhouette remains vector, while the colour fill is an embedded PNG. Independent Adobe-style Bézier mesh handles and Illustrator mesh-file import are unsupported.

## Value and Speed graphs

Graph opens a **modeless dock**, leaving the canvas and Playback accessible. Parameter lanes select the active property; Collapse tracks folds the dock and Resize changes its size.

**Value graph** moves round keys in time and value and exposes the selected key's incoming/outgoing handles. Precise numeric fields use pixels, degrees, percentages or scale factors. **Speed graph** shows signed change per second and permits time-only key drags; edit values in Value graph or its numeric fields. Hold jumps are omitted from the speed curve.

**Easy Ease** sets zero speed at the selected key with 33.33% influence on its incoming/outgoing sides, matching the familiar [Adobe Graph Editor workflow](https://helpx.adobe.com/after-effects/desktop/animate-in-after-effects/speed-between-keyframes/speed.html). Linear and Hold apply to adjacent segments. Expand Tween to the next key for exact curve controls. Equal-value segments remain flat: their value handles adjust time influence only. Colour, path and mesh tracks show progress; edit their artwork on the canvas. Keys snap to frames and cannot cross neighbouring keys. Graph and canvas edits within a block preserve surrounding animation.

## Sequence, presets and reference

Sequence supports block selection, movement, split, trim, copy/paste and deletion. Trim range retains saved keys or source recordings. Removed animation holds its last retained pose; editing the held range records a new bounded pose without changing its earlier hold. Double-tap an animation block or choose Edit tracks for its parameter graph.

Record motion updates the displayed sequence range while the take grows. Saved blocks retain their edited boundaries; later base keys outside those blocks appear as **Base automation** ranges. Editing one of these ranges turns it into an editable block without changing the surrounding animation.

Sequence / + time sets loops, repeats animation on the same layers or adds time. Tempo and beats per bar change measurement without stretching existing keys/audio. Motion presets provides Bounce, Bounce in, Bounce out, Ramp speed and fades, with a replacement/duration preview before Apply. Bounce in settles at the current pose with diminishing overshoot; Bounce out anticipates then exits in the selected direction. Selected blocks constrain preset ranges; inspect the incoming interpolation when replacing existing animation. Audio is repeated separately through blocks.

**Hold object → Animation → Stretch animation** (also in the layer effects panel) retimes all parameter tracks, blocks and held cuts on that layer. Groups include descendants. Its earliest animated time stays fixed; 200% plays twice as slowly and 50% twice as fast. References keep their pictures and change playback speed. Other layers and audio stay in place. The preview reports the new range and any composition extension; Apply creates one undo step. Subframe offsets are retained without merging keys.

Movement reference remains a **basic original puppet** with Walk, Run, Sprint, Hop and Slide poses. Rotate it, set a cycle and bake a locked tracing layer below artwork. Onion skin shows nearby artwork frames; ghosts hide during playback and export.

**File → Import → Video reference** extracts pictures from a local video supported by the browser's codecs. Choose up to ten seconds; extracted pictures are limited to **40 MB** and embedded in the project. The tracing layer is excluded from export by default; Reference options controls opacity/export inclusion. Optional source animation is available from the primary [Quaternius Universal Animation Library page (CC0)](https://quaternius.com/packs/universalanimationlibrary.html). Render a clip in a 3D tool, then import that video here; Poppy does not import its 3D rigs directly.

## Export, checks and limits

Video export prefers WebCodecs with MP4 or WebM according to supported codecs. Audio trim, offset, mute and volume are mixed into the result. The labelled MediaRecorder compatibility export runs in real time and can vary in frame timing on busy devices. Cancellation discards partial output.

Transparent PNG export creates numbered frames and sequence.json in a ZIP, without canvas paper or audio. The composition limit is 4096 px per side, ten minutes, and supported frame rates of 12/24/25/30/60 FPS. Browser microphone permission and codec support vary. Physical iPad/Pencil multi-touch testing remains unverified.

Run npm test for document/history, animation, graph, mesh, gesture ownership, timeline, audio, import and export regressions. Local browser checks complement these tests; they do not establish physical iPad usability parity.

The document/, scene/, animation/, renderer/, input/, timeline/, audio/, export/, persistence/ and ui/ folders separate the editor's responsibilities. Third-party runtime code is vendored mp4-muxer, webm-muxer and [polygon-clipping](https://github.com/mfogel/polygon-clipping), with licenses in dist/vendor/.
