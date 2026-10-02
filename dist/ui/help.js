const pages=[
 [
  "Animate in five steps",
  "1. Draw or select artwork.\n2. Turn on Auto Key, or add a keyframe at the starting time.\n3. Choose Next pose +1s, or move the playhead to a later frame.\n4. Move, resize, rotate or recolour the artwork.\n5. Return to frame 0 and press Play. Changing the same frame again updates its key; moving the playhead makes the next pose."
 ],
 [
  "Record a moving drag",
  "Record motion captures a drag over time. Arm Record motion, use Select, then drag the artwork. Recording begins when movement starts; elapsed project frames capture its position. Release finishes one undoable take. It stays armed for another drag until you turn it off. A second touch, pointer cancellation or Escape cancels the take. Auto Key records poses at the playhead instead: an ordinary canvas touch pauses playback."
 ],
 [
  "File, Edit and Options",
  "File groups Project, Import and Export. Open local project restores saved work; Project backup makes a portable .poppy file. Edit groups History, Clipboard, Selection and Shape construction. Options groups Workspace, Canvas, Animation, Audio and Help. Options → Workspace settings contains Scaffold and the Properties-panel preference; File → Composition settings changes size, duration, frame rate and background."
 ],
 [
  "Workspace and Layers",
  "Scaffold on keeps the canvas simple and places editing choices in Object options. Scaffold off shows the detailed editing row. Properties opens or collapses the inspector. Layers opens the layer list: select artwork behind other shapes, expand groups, rename, reorder, hide or lock layers. Multi-select chooses several layers. Preferences are remembered on this device."
 ],
 [
  "Properties and effects",
  "Transform holds position, size, scale, rotation and pivot. Style holds Opacity, fill, stroke, line profiles and Mesh shading. Style → Effects opens texture, Drop shadow and Motion blur. Shape holds text and point geometry; Animate holds property tracks. Round key buttons enable animation or add a key at the current frame. Opacity is in Style for groups and images too."
 ],
 [
  "Select, hold and clipboard",
  "Select taps the frontmost artwork. Drag to move it. Hold an object still for 550 ms to open Copy/Paste, Colour, pivot and selection actions; moving more than 8 screen pixels cancels the hold. Edit → Clipboard also offers Cut. In Select, a quick empty-canvas touch drag pans. Hold empty canvas for 350 ms until Marquee ready, then drag to select several objects. Two fingers pan/zoom; a quick two-finger tap undoes."
 ],
 [
  "Colour and Last 10 colours",
  "Fill and Stroke beside the selected name open the colour panel. Choose a colour or enter its hex value, preview it on the canvas, then Apply colour. Cancel discards the preview. Last 10 colours contains recently applied colours. New artwork uses the last applied colour. Hold a mesh point, or choose Point colour, to colour that shading point."
 ],
 [
  "Set a pivot without moving artwork",
  "Choose Pivot beside the selected name to reveal its large drag target. Drag it, or choose Centre pivot; Done pivot returns to normal editing. The artwork stays in place while the pivot changes. Animated pivot edits preserve frame 0, so Return to start restores the original pose. Select keeps object resize/rotation handles; point-editing modes show path points instead."
 ],
 [
  "Draw and resize",
  "Shapes offers Rectangle, Ellipse, Triangle, Polygon, Star and Line. Drag from your finger position; double-tap empty canvas for a standard shape. Uniform size makes squares/circles while drawing and preserves an existing aspect ratio while resizing. Shift does the same with a keyboard. Precision slows movement to 35%; Snap aligns artwork. Canvas Fit resets the view. Zoom enlarges the vector artwork."
 ],
 [
  "Path, Pencil and rubber hose",
  "Pencil follows your stroke and enables point editing when you finish. Path places anchors with taps and curves with drags; choose Finish path. Tap a square point, then Convert to curve, Smooth or Corner, and drag the round handles. Switch to Select for whole-object transforms. Edit → Shape construction → Add rubber hose limb creates a curved limb: drag its end or middle points, and change its stroke width in Style."
 ],
 [
  "Combine and group",
  "Select closed sibling shapes and choose Unite, Subtract front, Keep overlap, Exclude overlap or Compound path. The result uses its current outline and full new bounds, so expanded artwork is not clipped to an old box. Combining replaces the sources at this frame; Undo restores them. Join paths connects two open paths. Group keeps selected shapes together; Direct or Select contents reaches a child."
 ],
 [
  "Shade with a mesh",
  "Select a closed filled shape and choose Mesh. Its sparse 3 × 3 colour grid replaces the flat fill with continuous shading. Boundary points stay on the existing outline; drag internal points to change the colour flow. Add mesh point inserts rows/columns while preserving colours; the maximum is 17 × 17 points. Optional Set mesh bounds uses two taps inside the shape. Hold a point for colour."
 ],
 [
  "Animate mesh and shading limits",
  "Use Auto Key or Animate mesh, advance the playhead, then change point colours or positions. Insertion and subdivision update all mesh keys together. Fit to shape refits the grid. Shading resolution adapts for preview/export up to 2048 pixels on the longer edge. The outline stays vector; the shaded fill is an embedded PNG. Independent Adobe-style mesh Bézier handles and Illustrator mesh-file import are unavailable."
 ],
 [
  "Timeline tabs and navigation",
  "Sequence and Keys share one compact, finger-sized control row; switch tabs for block or key editing. Playback stays visible. Previous/Next key steps through selected layers or tracks. Next pose +1s advances one second and extends the composition if needed; edit artwork at that new time. Timeline Fit shows the full sequence. Keyframe options → Timeline view → Focus block zooms the selected animation or audio block."
 ],
 [
  "Blocks, trimming and loops",
  "Sequence selects, moves, splits, copies and pastes animation/audio blocks. Trim range shortens the selected block while retaining saved keys or the source recording. Removed animation holds its last retained pose; editing that held range records a new pose without changing the earlier hold. Double-tap an animation block, or choose Edit tracks, for its parameter graphs. Sequence / + time sets the loop or adds time; tempo changes measurement without stretching existing keys or audio."
 ],
 [
  "Value and Speed graphs",
  "Graph opens a dock while the canvas and Playback stay accessible. Value graph drags round keys horizontally for time and vertically for value; its incoming/outgoing handles change easing. Speed graph shows signed change per second and permits time-only key drags. Change values in Value graph or exact numeric fields. Easy Ease uses zero speed at the selected key with 33.33% influence; Linear and Hold affect adjacent segments."
 ],
 [
  "Exact graph controls",
  "Numeric fields use pixels, degrees, percentages or scale factors. Expand Tween to the next key for precise curve influence controls. Flat equal-value segments stay flat: their value handles adjust time influence only. Path, mesh and colour tracks show progress; edit their artwork on the canvas. Block graph changes stay inside the selected block. Collapse tracks folds the dock; Resize changes its size."
 ],
 [
  "Shadows and motion blur",
  "Use Style → Effects or Object options → Appearance. Drop shadow previews offset, blur, opacity and colour; Apply keeps one edit, Cancel discards it, and Animate shadow enables tracks. Motion blur softens animated movement; adjust its shutter angle and sample count. Reference and group launchers show their relevant options. Effects are included in exports."
 ],
 [
  "Presets and more time",
  "Motion presets offers Bounce, Ramp speed and fades for selected artwork. Preview reports replaced keys and any extra time before Apply. A selected animation block limits the affected range. Existing incoming interpolation can change; inspect Graph or Undo if needed. Sequence / + time repeats animation on the same layers or adds seconds. Audio is copied separately as blocks."
 ],
 [
  "Onion skin and reference poses",
  "Onion skin shows one to three nearby frames with adjustable opacity; ghosts hide during playback and exports. Movement reference offers basic original Walk, Run, Sprint, Hop and Slide puppet poses for tracing. Rotate it, set the cycle and bake a locked reference layer below your artwork. References are excluded from export by default."
 ],
 [
  "Import a local video reference",
  "File → Import → Video reference extracts pictures from a local clip supported by this browser. Choose up to 10 seconds; embedded pictures are limited to 40 MB. The pictures are saved in the project as a locked tracing layer, excluded from export by default. Reference options changes opacity/export inclusion. For optional CC0 source animation, see <a href=\"https://quaternius.com/packs/universalanimationlibrary.html\" target=\"_blank\" rel=\"noopener\">Quaternius Universal Animation Library</a>: render a video clip in a 3D tool, then import that clip here."
 ],
 [
  "Save and export",
  "Changes save on this device. File → Open local project restores saved work after a blank launch. File → Export → Project backup includes embedded audio and reference pictures in a portable .poppy file. Export animation offers video with audio or transparent PNG frames. Keep backups: browser storage can be cleared. Microphone access needs localhost or HTTPS and browser permission."
 ]
];
export function showHelp(a){const d=a.dialog('Help · Draw it. Tween it.',`<div class="help-intro">Your quick guide to Poppy’s Animator</div><div class="help-pages">${pages.map(([title,body])=>`<details ${title==='Animate in five steps'?'open':''}><summary>${title}</summary><p>${body.replaceAll('\n','<br>')}</p></details>`).join('')}</div><div class="help-shortcuts">Transparent frames: File → Export → Animation → Transparent PNG frames (ZIP). Keyboard: V Select · A Direct select · M Mesh · R Rectangle · E Ellipse · B Path · Space Play · Ctrl/⌘Z Undo · F9 Easy Ease in Graph · Escape cancels a recording take.</div>`);d.classList.add('help-dialog');}
