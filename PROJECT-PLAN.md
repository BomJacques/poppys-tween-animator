# Poppy's project coordinator

Updated: 3 October 2026. Phase 17: implemented, published and verified.

This plan records what is going into the release and why. The coordinator takes incoming ideas, checks the current implementation and chooses their place in the work. The user does not need to schedule each idea.

## How incoming ideas are handled

- **Fix now:** broken editing, gestures, saving, animation or export; regressions; and controls whose advertised action does not work. Reproduce the problem, fix it and verify the actual workflow.
- **Include when coherent:** small improvements directly related to the current work, with a clear result and manageable verification. They must not delay a needed repair or destabilise a working feature.
- **Queue for the next release:** substantial new tools, new workflows or ideas that need design and dependencies. Record the intended outcome and an acceptance check before implementation.
- **Keep working:** a status update or correction changes the relevant item; it does not silently cancel the rest of the release. Confirmed working behaviour leaves the repair queue.

Decisions should be explained briefly. Ask only when a choice affects the user's intended behaviour or requires missing information; do not ask the user to prioritise routine implementation work.

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
