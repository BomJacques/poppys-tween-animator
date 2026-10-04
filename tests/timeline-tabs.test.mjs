import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineToolMode,nextTimelineToolMode} from '../dist/ui/timeline-workspace.js';

test('saved timeline preferences accept Audio and recover an obsolete mode to Keys',()=>{
 assert.equal(timelineToolMode('audio'),'audio');
 assert.equal(timelineToolMode('sequence'),'sequence');
 assert.equal(timelineToolMode('keys'),'keys');
 assert.equal(timelineToolMode('removed-panel'),'keys');
 assert.equal(timelineToolMode(null),'keys');
});
test('keyboard navigation can reach Audio in both directions and wraps at the ends',()=>{
 assert.equal(nextTimelineToolMode('keys','ArrowRight'),'audio');
 assert.equal(nextTimelineToolMode('audio','ArrowRight'),'sequence');
 assert.equal(nextTimelineToolMode('sequence','ArrowLeft'),'audio');
 assert.equal(nextTimelineToolMode('audio','ArrowLeft'),'keys');
 assert.equal(nextTimelineToolMode('keys','Home'),'sequence');
 assert.equal(nextTimelineToolMode('keys','End'),'audio');
});
