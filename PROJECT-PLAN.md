# Poppy's project coordinator

Updated: 4 October 2026. Phase 18 is implemented, published and verified. Phase 17 is implemented, published and verified.

This plan records what is going into the release and why. The coordinator takes incoming ideas, checks the current implementation and chooses their place in the work. The user does not need to schedule each idea.

## How incoming ideas are handled

- **Fix now:** broken editing, gestures, saving, animation or export; regressions; and controls whose advertised action does not work. Reproduce the problem, fix it and verify the actual workflow.
- **Include when coherent:** small improvements directly related to the current work, with a clear result and manageable verification. They must not delay a needed repair or destabilise a working feature.
- **Queue for the next release:** substantial new tools, new workflows or ideas that need design and dependencies. Record the intended outcome and an acceptance check before implementation.
- **Keep working:** a status update or correction changes the relevant item; it does not silently cancel the rest of the release. Confirmed working behaviour leaves the repair queue.

Decisions should be explained briefly. Ask only when a choice affects the user's intended behaviour or requires missing information; do not ask the user to prioritise routine implementation work.

## Phase 19: UI and usability audit

Published and verified at commit 92afaccca5616eade047643eb139f533618e2155 (GitHub Actions run 37163950826 succeeded). Scope is workspace clarity, useful density and the reported keyframe-circle alignment; new animation tools remain outside this audit.

- Removed nonfunctional header/property spacing and popup-card stretching. Retained 44 px editing targets and meaningful section separation.
- Added Audio beside Sequence and Keys, removing the permanent audio footer. Audio recording reveals its Stop controls, including when the sequencer was hidden.
- Established consistent artwork, animation and audio accents with labels and selected states, so colour is not the only cue. Scaffold and detailed editing retain their capabilities.
- Docked Properties beside the preview on tablets, clamping its width to keep canvas space. The graph curve fits its initial popup height.
- Fixed circles beside Rotation and Scale X: the turns readout had displaced them by 20.39 px. All seven Transform circles now measure a 0 px centre difference from their inputs.
- Validation: 480 tests; syntax/import/offline coverage for 113 static files, 86 JavaScript modules and 107 offline entries. Browser checks at 1280 × 720, 1024 × 768 and 768 × 1024, in guided/detailed and dark/light layouts. Physical iPad/Pencil checks remain queued.

GitHub Actions records deployment of this release. The README records measured space savings and official interface references.

## Completed release: phase 18

The user reports that playback slows significantly after adding an image as a texture. This is accepted as a current core-performance repair because it impairs the existing animation workflow. The coordinator has prioritised it without asking the user to schedule it. Related appearance and animation improvements are included: immediate colour and effect editing, access to Delete while using Shapes, clearer graph-point editing, playback controls in the graph popup and easing profiles reached by tapping a sequencer keyframe. A reported shadow-clipping problem also receives a core rendering repair. No substantial new tool is included.

| Work | Status | Acceptance check |
| --- | --- | --- |
| Image-texture playback slowdown | Complete; published | A repeatable 60-frame benchmark used a real 1024 × 1024 PNG (2,742,099 bytes), an animated ellipse, shadow and seven blur samples. Embedded SVG generation averaged 53.373 ms/frame and 25,606,384 bytes; preview SVG generation averaged 0.248 ms/frame and 13,656 bytes. These measure JavaScript SVG generation, not end-to-end playback or physical iPad FPS. |
| Texture fidelity and persistence | Complete; published | Cover, fit, stretch and tile behaviour, image fidelity, clipping, save/restore and export are covered by release checks. Browser import and playback reused one shared Blob image URL across seven blur samples. Reload restored the three-layer project and its image. |
| Immediate object and mesh colour changes | Complete; published | Both pickers have no Apply or Cancel button. Colour changes update the render immediately; Done keeps the change and Undo restores it. Auto Key at one second preserved the frame-zero object colour and mesh. Colour memory and invalid/incomplete hex handling are covered by regressions. |
| Hold artwork for Delete while using Shapes | Complete; published | A stationary hold on existing artwork while using a Shapes tool opens its context menu with Delete. Production gesture regressions cover all seven Shapes tools, topmost hits, small finger jitter, dragging, cancellation and second touches. A physical iPad hold check remains in the device pass. |
| Add and delete animation graph points | Complete; published | Browser Add at one second changed six keys to seven; Delete returned seven to six; Undo restored the deleted key. Preserve surrounding keys and the visible canvas. |
| Playback inside the graph popup | Complete; published | Browser Play, Pause and Stop kept the graph and canvas visible. Transport controls remained visible with the graph collapsed and stayed synchronised with playback. |
| Tap a sequencer keyframe for easing profiles | Complete; published | A keyframe tap opened the modeless profile picker; Bounce out updated the selected key's outgoing-easing title. Segment isolation, genuine bounce interpolation, persistence and graph display are covered by regressions. The final fixed-position popup stays above the workspace; Bounce out survived saving and reopening the project. |
| Immediate motion blur and drop shadow editing | Complete; published | Enable and parameter changes persist immediately. Done, X and Escape keep changes; Undo restores them. Slider and pad gestures are coalesced, and Auto Key preserves earlier shadow poses through effect tracks. The shared immediate-effect session module is included in the offline cache. Browser blur remained active after X and normal playback; its enabled state and 300° angle survived project reload. Shadow offset changed immediately and stayed after Done; Undo restored 24 px from the changed 80 px. |
| Group shadows around child motion-blur trails | Complete; published | Shadow bounds include child motion-blur samples evaluated at the project's frame rate, preventing an invisible box from cutting off the trails or shadow. Preserve group transforms and export rendering. |

### Phase 18 release gates

1. **Complete:** reproduce and benchmark the image-texture rendering cost. The benchmark records SVG-generation improvement and does not establish an end-to-end frame rate.
2. **Complete:** the integrated suite passed **478/478 tests**. Static/offline checks passed for 112 files, 86 JavaScript modules and 106 cache entries, including the shared colour and immediate-effect modules. The final source passed all checks before publication.
3. **Complete:** textured playback, image reuse, save/reload, object/mesh colours, graph point editing/transport, easing popup layout/persistence and immediate effects passed browser checks with zero console warnings or errors. Shapes holds pass production gesture regressions; physical touch verification remains in the next release.
4. **Complete:** published source [843dee6](https://github.com/BomJacques/poppys-tween-animator/commit/843dee6f81a60d97c7c1e41038bf6628b451d768); [Test and publish Poppy](https://github.com/BomJacques/poppys-tween-animator/actions/runs/37116954380) succeeded. Live checks confirmed all 19 stylesheets use v18, immediate colour editing has no Apply, sequencer taps open easing profiles, and graph Play/Stop retains the popup and seven blur samples. No console warnings or errors.

Phase 18 is delivered. All 189 source, test and deployment files matched their staged GitHub blob hashes. Live app: [Poppy’s Tween Animator](https://bomjacques.github.io/poppys-tween-animator/). Physical iPad/Pencil verification remains in the next-phase queue.

## Completed release: phase 17

The release combines touch editing, clearer controls and dependable animation timing. All local checks are complete, and the deployed site has been verified. There are no remaining phase 17 code blockers.

Published source: [91a445c](https://github.com/BomJacques/poppys-tween-animator/commit/91a445c35b3822ae268046d0dbd8ae65f2a2cb6b). [Test and publish Poppy](https://github.com/BomJacques/poppys-tween-animator/actions/runs/37113457896) completed successfully. Live app: [Poppy's Tween Animator](https://bomjacques.github.io/poppys-tween-animator/).

| Work | Status | Acceptance check |
| --- | --- | --- |
| Direct marquee inside groups | Complete; published | Browser marquee selected five anchors across two grouped children. Dragging the rectangle anchor by 12 px moved the selected rectangle and custom-path anchors together, without changing another corner. Parent transforms and Undo are covered by regressions. |
| Mesh on hand-drawn artwork | Complete; published | Mesh tool and Object options reach the same drawing. Browser checks changed a point colour and added a row to make a 4 × 3 grid. Closed, filled drawings support mesh shading. Open strokes have a route to closing their outline before shading. Saving and animation are covered by release regressions. |
| Per-point round-corner handles | Complete; published | Dragging produced a rounded outline at the later keyed pose while frame zero remained square. Cross-object anchor priority is repaired: a nearby corner widget no longer intercepts the grouped anchor drag. Other corners and earlier keyed poses remain intact, with Undo covered by regressions. |
| Menu state synchronisation | Complete; published | File/Edit/Options menus reflect current source-control states in the same render. Browser checks confirmed Group no longer waits for another render to become available. |
| Full-turn rotation, vector line noise and identifiable Properties tabs | Complete; published | Signed turns survive keyframes and seeking. Line-noise controls visibly affect open strokes and expose animation tracks. Tab labels and active states remain clear. |
| Razor, sequence clipboard, whole-layer movement and layer stacking | Complete; published | Razor cuts at the tapped frame. A stationary hold exposes Copy/Paste without an accidental cut. Moving a whole sequence preserves its timing relationships. Stacking commands work within the current parent without changing animation. |
| Two-finger canvas navigation and drawing preservation | Complete; published; physical iPad check queued | Two fingers pan, zoom and rotate the view. Adding a second finger preserves a visible drawing. Fit restores an upright view. Physical iPad behaviour remains a separate device check. |
| Calmer popups, grouped options and accurate toggle states | Complete; published | Object options has distinct Shape & style, Animate and Arrange tabs. Canvas and other popups have readable groups, visible labels and clear selected states. Uniform size loses its blue state when off. Existing actions remain reachable. |
| Recorded sequence extent | Complete; published | The user reported the behaviour working. Live recording range and uncovered base-key ranges are covered by release regression tests. |

### Release gates

1. **Complete:** core editing repairs, including cross-object corner-widget touch-target priority, passed local browser checks.
2. **Complete:** the final full test suite passed **437/437 tests** after the touch and menu-state repairs. Static/offline asset checks and the deployment workflow passed.
3. **Complete:** representative local browser workflows and popup layouts checked; the final grouped-point workflow produced **zero console warnings or errors**. Retain a screenshot of the result.
4. **Complete:** the tested files were published to the authorised GitHub repository, the deployment succeeded and the live site was verified. All 18 stylesheets use version 17; Razor is visible; Canvas options has grouped headings and the correct Uniform size Off state. Live checks produced zero console warnings or errors.

Phase 17 is delivered. Apply the intake rules to new work; keep physical iPad/Pencil verification in the next phase.

Automated and desktop browser checks do not establish Procreate, Illustrator or Affinity usability parity on a physical iPad. Record that limit rather than claiming it has been tested.

## Next release queue

| Item | Why it follows this release | Acceptance check |
| --- | --- | --- |
| Physical iPad/Pencil interaction pass | Multi-touch timing, precision and browser behaviour need a real device | Check drawing-to-navigation handoff, point dragging, grouped marquee, popup dismissal, sequencer holds and gesture cancellation on the intended iPad. Record reproducible problems and fix them before adding gesture complexity. |

New substantial ideas enter this queue with their intended outcome and dependencies. No additional feature is promised merely because it was mentioned.

## Maintenance

Update this document at each meaningful intake decision and release completion. Move verified work out of the current release, keep unresolved items explicit and record what was actually published. The README describes the implemented product; this file coordinates upcoming work.

The left tool rail uses consistent vector icons with labels. Property key circles are 20 px visually, with centred 5 px vector dots and unchanged 44 px touch targets.

## Phase 20: follow a spline

Implemented and verified: shapes and grouped characters attach to Path or Pencil guides. Path, Noise and Timing tabs control progress, orientation, reverse/wrap, normal offset, coherent noise and travel duration. Changes apply immediately and use Auto Key and Undo. Progress is an editable animation track; fresh travel holds its endpoint. Detaching preserves the current pose.

Release checks: 505 automated tests pass, including saved document validation, transformed groups, cycle prevention, shared preview/export transforms, copy references and timing ownership. All 118 static files pass syntax, module and offline checks. Browser verification covers shape/group attachment, noise edits, Play/Pause/Stop, endpoint holding, detach/Undo and portrait tablet layout with no console warnings or errors. Physical iPad gestures remain the next verification item.
