export const osmdHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
    <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.8/build/opensheetmusicdisplay.min.js"></script>
    <style>
      html, body { margin: 0; padding: 0; padding-top: 80px; background-color: white; width: 100%; height: 100%; overflow: auto; }
      #score-container { width: 100%; min-height: 100%; padding-bottom: 200px; transform-origin: 0 0; }
      svg { overflow: visible !important; }
      #score-container { overflow: visible !important; padding-top: 40px !important; }
    </style>
  </head>
  <body>
    <div id="score-container" style="padding-top: 30px; overflow: visible;"></div>
    <script>
      var osmd;
      function send(type, data) { 
        var payload = JSON.stringify({ type: type, data: data });
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
        if (window.parent) window.parent.postMessage(payload, '*');
      }
      window.onload = function() {
        try {
          osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("score-container", {
            autoResize: true,
            backend: "svg",
            drawingParameters: "compacttight",
            drawTitle: false,
            drawSubtitle: false,
            drawComposer: false
          });
          osmd.rules.PageTopMargin = 8.0;
          osmd.rules.PageBottomMargin = 5.0;
          osmd.rules.RenderMultipleRestMeasures = false;
          osmd.rules.AutoBeamNotes = true;
          osmd.rules.DrawPartNames = false;
          osmd.rules.DrawPartAbbreviations = false;
          send('WV_READY', 'Ready');
        } catch (e) { send('ERROR', 'Init: ' + e.message); }
      };
      window.addEventListener('message', function(event) {
        try {
          var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg.type === 'LOAD_FILE') {
            document.getElementById('score-container').innerHTML = '';
            var data = msg.data;
            var finalContent;
            if (msg.isBinary) {
              var binary = atob(data);
              var len = binary.length;
              var bytes = new Uint8Array(len);
              for (var i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
              finalContent = bytes;
            } else {
              if (data.trim().startsWith('<?xml')) { finalContent = data; }
              else { finalContent = decodeURIComponent(escape(atob(data))); }
            }
            osmd.load(finalContent).then(function() {
              osmd.render();
              send('LOAD_COMPLETE', 'Done');
            }).catch(function(err) { send('ERROR', 'Load: ' + err); });
          } else if (msg.type === 'SET_ZOOM') {
            osmd.Zoom = msg.zoom;
            osmd.render();
          }
        } catch (e) { send('ERROR', 'Runtime: ' + e.message); }
      });
      document.addEventListener('message', function(e){ window.dispatchEvent(new MessageEvent('message', {data: e.data})); });
    </script>
  </body>
</html>`;

export const editorOsmdHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
    <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.8/build/opensheetmusicdisplay.min.js"></script>
    <style>
      html, body {
        margin: 0; padding: 0;
        background-color: white;
        width: 100%; height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
      }
      #score-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: auto;
        box-sizing: border-box;
        padding: 10px 0 !important;
      }
      #score-container > svg {
        margin: auto !important;
        display: block !important;
        max-width: 98% !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      .selected-note, .selected-note * { fill: #d97706 !important; stroke: #d97706 !important; }
      .selected-note path, .selected-note ellipse { fill: #d97706 !important; stroke: #d97706 !important; }
      #pencil-ghost {
        position: fixed;
        pointer-events: none;
        display: none;
        z-index: 9999;
      }
      #pencil-ghost .cross {
        position: absolute;
        left: 0; top: 0;
        width: 26px; height: 26px;
        transform: translate(-50%, -50%);
      }
      #pencil-ghost .cross::before, #pencil-ghost .cross::after {
        content: '';
        position: absolute;
        background: #d97706;
      }
      #pencil-ghost .cross::before { left: 50%; top: 0; width: 2px; height: 100%; transform: translateX(-50%); }
      #pencil-ghost .cross::after { top: 50%; left: 0; width: 100%; height: 2px; transform: translateY(-50%); }
      #pencil-ghost .label {
        position: absolute;
        left: 0; top: -34px;
        transform: translateX(-50%);
        background: #d97706;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        padding: 3px 7px;
        border-radius: 6px;
        white-space: nowrap;
      }
      #pencil-ghost .connector {
        position: absolute;
        left: 0; top: 0;
        width: 2px;
        background: #d97706CC;
        transform: translateX(-50%);
      }
      #pencil-ghost .touch-dot {
        position: absolute;
        left: 0; top: 0;
        width: 10px; height: 10px;
        border-radius: 50%;
        background: #d97706;
        border: 2px solid #fff;
        transform: translate(-50%, -50%);
      }
      #pencil-minimap {
        position: fixed;
        left: 10px; bottom: 10px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 10px;
        padding: 6px 8px 4px;
        display: none;
        pointer-events: none;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        text-align: center;
      }
      #minimap-label {
        font-size: 12px;
        font-weight: 800;
        color: #333;
        margin-top: 2px;
      }
    </style>
  </head>
  <body>
    <div id="score-container"></div>
    <div id="pencil-ghost">
      <div class="connector" id="pencil-ghost-connector"></div>
      <div class="cross"></div>
      <div class="label" id="pencil-ghost-label"></div>
      <div class="touch-dot" id="pencil-ghost-dot"></div>
    </div>
    <div id="pencil-minimap">
      <svg id="minimap-svg" viewBox="0 0 100 120" width="86" height="103">
        <line x1="20" y1="30" x2="80" y2="30" stroke="#333" stroke-width="1.5"/>
        <line x1="20" y1="42" x2="80" y2="42" stroke="#333" stroke-width="1.5"/>
        <line x1="20" y1="54" x2="80" y2="54" stroke="#333" stroke-width="1.5"/>
        <line x1="20" y1="66" x2="80" y2="66" stroke="#333" stroke-width="1.5"/>
        <line x1="20" y1="78" x2="80" y2="78" stroke="#333" stroke-width="1.5"/>
        <ellipse id="minimap-note" cx="50" cy="30" rx="7.5" ry="5.5" fill="#d97706" style="display:none"/>
      </svg>
      <div id="minimap-label"></div>
    </div>
    <script>
      window.oncontextmenu = function(e) { e.preventDefault(); return false; };
      var osmd;
      window.currentSelection = null;
      window.isProcessingNote = false;
      window.editMode = 'pencil';
      window.isLoadingScore = false;

      function send(type, data) {
        var payload = JSON.stringify({ type: type, data: data });
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
        if (window.parent) window.parent.postMessage(payload, '*');
      }

      function clearHighlights() {
        const selected = document.querySelectorAll('.selected-note');
        for (let i = 0; i < selected.length; i++) {
          const el = selected[i];
          el.classList.remove('selected-note');
          const children = el.querySelectorAll('*');
          for (let j = 0; j < children.length; j++) {
            children[j].style.fill = "";
            children[j].style.stroke = "";
          }
        }
      }

      function highlightNote(targetLocalIdx, targetPartIdx) {
        if (!osmd || !osmd.GraphicSheet) return;
        const pIdxToHighlight = (targetPartIdx !== undefined) ? targetPartIdx : (window.activePartIndexFromRN || 0);
        let attempts = 0;
        const maxAttempts = 20;

        const interval = setInterval(() => {
          attempts++;
          let found = false;
          try {
            const containers = osmd.GraphicSheet.VerticalGraphicalStaffEntryContainers;
            let partCounters = {};

            for (let i = 0; i < containers.length; i++) {
              const container = containers[i];
              for (let j = 0; j < container.StaffEntries.length; j++) {
                const se = container.StaffEntries[j];
                if (!se) continue;

                const pIdx = j;
                if (partCounters[pIdx] === undefined) partCounters[pIdx] = 0;

                for (let k = 0; k < se.graphicalVoiceEntries.length; k++) {
                  const gve = se.graphicalVoiceEntries[k];
                  for (let l = 0; l < gve.notes.length; l++) {
                    if (pIdx === pIdxToHighlight && partCounters[pIdx] === targetLocalIdx) {
                      const gn = gve.notes[l];
                      const el = (gn && gn.getSVGGElement) ? gn.getSVGGElement() : (gve && gve.getSVGGElement ? gve.getSVGGElement() : null);
                      if (el) {
                        clearHighlights();
                        el.classList.add('selected-note');
                        try { el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); } catch(e){}
                        const targetsToColor = [el].concat(Array.from(el.querySelectorAll('*')));
                        for (let m = 0; m < targetsToColor.length; m++) {
                          targetsToColor[m].style.fill = "#d97706";
                          targetsToColor[m].style.stroke = "#d97706";
                        }
                        found = true;
                      }
                      break;
                    }
                    partCounters[pIdx]++;
                  }
                  if (found) break;
                }
                if (found) break;
              }
              if (found) break;
            }
          } catch (e) {}

          if (found || attempts >= maxAttempts) {
            clearInterval(interval);
          }
        }, 25);
      }

      var DIATONIC_STEPS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

      function getStaffTopLineUnitY(partIndex, refUnitY) {
        try {
          const pages = osmd.GraphicSheet.MusicPages;
          let best = null, bestDist = Infinity;
          for (let p = 0; p < pages.length; p++) {
            const systems = pages[p].MusicSystems;
            for (let s = 0; s < systems.length; s++) {
              const sl = systems[s].StaffLines[partIndex];
              if (!sl) continue;
              const y = sl.PositionAndShape.AbsolutePosition.y;
              const dist = Math.abs(y - refUnitY);
              if (dist < bestDist) { bestDist = dist; best = y; }
            }
          }
          return best;
        } catch (e) { return null; }
      }

      function pitchFromUnitY(partIndex, unitY) {
        const topLineUnitY = getStaffTopLineUnitY(partIndex, unitY);
        if (topLineUnitY === null) return null;
        const topRef = partIndex === 0 ? { step: 'F', octave: 5 } : { step: 'A', octave: 3 };
        const stepsFromTop = Math.round((topLineUnitY - unitY) / 0.5);
        const letterIdx = DIATONIC_STEPS.indexOf(topRef.step);
        const totalIdx = letterIdx + stepsFromTop;
        const octave = topRef.octave + Math.floor(totalIdx / 7);
        const stepIdx = ((totalIdx % 7) + 7) % 7;
        return { step: DIATONIC_STEPS[stepIdx], octave: octave, stepsFromTop: stepsFromTop };
      }

      function collectAllGraphicalTargets() {
        const containers = osmd.GraphicSheet.VerticalGraphicalStaffEntryContainers;
        let partCounters = {};
        let list = [];
        for (let i = 0; i < containers.length; i++) {
          const container = containers[i];
          for (let j = 0; j < container.StaffEntries.length; j++) {
            const se = container.StaffEntries[j];
            if (!se) continue;
            const pIdx = j;
            if (partCounters[pIdx] === undefined) partCounters[pIdx] = 0;
            for (let k = 0; k < se.graphicalVoiceEntries.length; k++) {
              const gve = se.graphicalVoiceEntries[k];
              for (let l = 0; l < gve.notes.length; l++) {
                const gn = gve.notes[l];
                const el = gn.getSVGGElement ? gn.getSVGGElement() : null;
                if (el) {
                  const r = el.getBoundingClientRect();
                  list.push({
                    partIndex: pIdx,
                    globalIdx: partCounters[pIdx],
                    unitY: gn.PositionAndShape.AbsolutePosition.y,
                    cx: r.left + r.width / 2,
                    cy: r.top + r.height / 2,
                  });
                }
                partCounters[pIdx]++;
              }
            }
          }
        }
        return list;
      }

      function getSvgPxPerUnit() {
        const svg = document.querySelector('#score-container svg');
        const zoom = (osmd && osmd.zoom) || 1;
        if (!svg || !svg.viewBox || !svg.viewBox.baseVal || !svg.viewBox.baseVal.width) return 10 * zoom;
        const cssScale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        return 10 * zoom * cssScale;
      }

      function collectAllStaffLines() {
        const list = [];
        try {
          const pages = osmd.GraphicSheet.MusicPages;
          for (let p = 0; p < pages.length; p++) {
            const systems = pages[p].MusicSystems;
            for (let s = 0; s < systems.length; s++) {
              const lines = systems[s].StaffLines;
              for (let li = 0; li < lines.length; li++) {
                const sl = lines[li];
                if (!sl) continue;
                list.push({ partIndex: li, unitY: sl.PositionAndShape.AbsolutePosition.y });
              }
            }
          }
        } catch (e) {}
        return list;
      }

      var PENCIL_STAFF_HYSTERESIS_UNITS = 7;

      function findStaveTargetFromPoint(clientX, clientY, preferredPartIndex) {
        if (!osmd || !osmd.GraphicSheet) return null;
        try {
          const all = collectAllGraphicalTargets();
          if (all.length === 0) return null;
          const anchor = all[0];
          const pxPerUnit = getSvgPxPerUnit();

          const staffLines = collectAllStaffLines();
          let bestLine = null, bestLineDist = Infinity;
          for (let i = 0; i < staffLines.length; i++) {
            const predictedY = anchor.cy + (staffLines[i].unitY - anchor.unitY) * pxPerUnit;
            let d = Math.abs(predictedY - clientY);
            if (preferredPartIndex !== undefined && preferredPartIndex !== null && staffLines[i].partIndex === preferredPartIndex) {
              d -= pxPerUnit * PENCIL_STAFF_HYSTERESIS_UNITS;
            }
            if (d < bestLineDist) { bestLineDist = d; bestLine = { partIndex: staffLines[i].partIndex, unitY: staffLines[i].unitY, predictedY: predictedY }; }
          }
          if (!bestLine) return null;
          const partIndex = bestLine.partIndex;

          let best = null, bestDist = Infinity;
          for (let i = 0; i < all.length; i++) {
            if (all[i].partIndex !== partIndex) continue;
            const noteLineDist = Math.abs(all[i].cy - bestLine.predictedY);
            if (noteLineDist > pxPerUnit * 6) continue;
            const d = Math.abs(all[i].cx - clientX);
            if (d < bestDist) { bestDist = d; best = all[i]; }
          }
          if (!best) return null;

          const unitY = best.unitY + (clientY - best.cy) / pxPerUnit;
          return { globalIdx: best.globalIdx, partIndex: partIndex, unitY: unitY };
        } catch (e) { return null; }
      }

      var PENCIL_GHOST_OFFSET = 70;

      function showGhost(clientX, clientY, label) {
        const g = document.getElementById('pencil-ghost');
        g.style.left = clientX + 'px';
        g.style.top = (clientY - PENCIL_GHOST_OFFSET) + 'px';
        g.style.display = 'block';
        document.getElementById('pencil-ghost-label').textContent = label;
        const connector = document.getElementById('pencil-ghost-connector');
        connector.style.height = PENCIL_GHOST_OFFSET + 'px';
        const dot = document.getElementById('pencil-ghost-dot');
        dot.style.top = PENCIL_GHOST_OFFSET + 'px';
      }
      function hideGhost() {
        document.getElementById('pencil-ghost').style.display = 'none';
      }

      var MINIMAP_TOP_LINE_Y = 30;
      var MINIMAP_STEP_PX = 6;

      function hideMinimap() {
        document.getElementById('pencil-minimap').style.display = 'none';
      }

      var MINIMAP_ZONE_W = 110;
      var MINIMAP_ZONE_H = 150;

      function positionMinimap(clientX, clientY) {
        const minimap = document.getElementById('pencil-minimap');
        const vv = window.visualViewport;
        const viewportH = vv ? vv.height : window.innerHeight;
        const overlaps = clientX < MINIMAP_ZONE_W && clientY > (viewportH - MINIMAP_ZONE_H);
        if (overlaps) {
          minimap.style.left = 'auto';
          minimap.style.right = '10px';
          minimap.style.top = '10px';
          minimap.style.bottom = 'auto';
        } else {
          minimap.style.left = '10px';
          minimap.style.right = 'auto';
          minimap.style.top = 'auto';
          minimap.style.bottom = '10px';
        }
      }

      function updateMinimap(stepsFromTop, label, clientX, clientY) {
        const minimap = document.getElementById('pencil-minimap');
        const svg = document.getElementById('minimap-svg');
        const note = document.getElementById('minimap-note');

        positionMinimap(clientX, clientY);

        const noteY = MINIMAP_TOP_LINE_Y - stepsFromTop * MINIMAP_STEP_PX;
        note.setAttribute('cy', String(noteY));
        note.style.display = 'block';

        const existingLedgers = svg.querySelectorAll('.minimap-ledger');
        existingLedgers.forEach(function (el) { el.remove(); });

        function addLedger(y) {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', '37'); line.setAttribute('x2', '63');
          line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y));
          line.setAttribute('stroke', '#333'); line.setAttribute('stroke-width', '1.5');
          line.setAttribute('class', 'minimap-ledger');
          svg.appendChild(line);
        }

        if (stepsFromTop > 0) {
          for (let s = 2; s <= stepsFromTop; s += 2) addLedger(MINIMAP_TOP_LINE_Y - s * MINIMAP_STEP_PX);
        } else if (stepsFromTop < -8) {
          for (let s = -10; s >= stepsFromTop; s -= 2) addLedger(MINIMAP_TOP_LINE_Y - s * MINIMAP_STEP_PX);
        }

        document.getElementById('minimap-label').textContent = label;
        minimap.style.display = 'block';
      }

      var pencilGesturePartIndex = null;

      function handlePencilMove(clientX, clientY, commit) {
        if (window.isLoadingScore) { hideGhost(); hideMinimap(); return; }
        const target = findStaveTargetFromPoint(clientX, clientY, pencilGesturePartIndex);
        if (!target) { hideGhost(); hideMinimap(); return; }
        pencilGesturePartIndex = target.partIndex;
        const pitch = pitchFromUnitY(target.partIndex, target.unitY);
        if (!pitch) { hideGhost(); hideMinimap(); return; }

        const label = pitch.step + pitch.octave;
        showGhost(clientX, clientY, label);
        updateMinimap(pitch.stepsFromTop, label, clientX, clientY);

        if (commit) {
          hideGhost();
          hideMinimap();
          pencilGesturePartIndex = null;
          send('PENCIL_COMMIT', { globalIdx: target.globalIdx, partIndex: target.partIndex, step: pitch.step, octave: pitch.octave });
        }
      }

      function attachPencilHandlers() {
        const container = document.getElementById('score-container');
        let touchGesture = null;

        container.addEventListener('touchstart', function(e) {
          if (window.editMode !== 'pencil') return;
          if (e.touches.length > 1) {
            touchGesture = 'pinch';
            hideGhost();
            hideMinimap();
            return;
          }
          touchGesture = 'pencil';
          pencilGesturePartIndex = null;
          const t = e.touches[0];
          handlePencilMove(t.clientX, t.clientY, false);
        }, { passive: true });

        container.addEventListener('touchmove', function(e) {
          if (window.editMode !== 'pencil') return;
          if (e.touches.length > 1) { touchGesture = 'pinch'; hideGhost(); hideMinimap(); return; }
          if (touchGesture === 'pinch') return;
          e.preventDefault(); e.stopPropagation();
          const t = e.touches[0];
          handlePencilMove(t.clientX, t.clientY, false);
        }, { passive: false });

        container.addEventListener('touchend', function(e) {
          if (window.editMode !== 'pencil') return;
          if (e.touches.length > 0) return;
          const wasPinch = touchGesture === 'pinch';
          touchGesture = null;
          if (wasPinch) { hideGhost(); return; }
          e.preventDefault(); e.stopPropagation();
          const t = e.changedTouches[0];
          handlePencilMove(t.clientX, t.clientY, true);
        }, { passive: false });

        let mouseDown = false;
        container.addEventListener('mousedown', function(e) {
          if (window.editMode !== 'pencil') return;
          e.preventDefault();
          mouseDown = true;
          pencilGesturePartIndex = null;
          handlePencilMove(e.clientX, e.clientY, false);
        });
        container.addEventListener('mousemove', function(e) {
          if (window.editMode !== 'pencil' || !mouseDown) return;
          handlePencilMove(e.clientX, e.clientY, false);
        });
        window.addEventListener('mouseup', function(e) {
          if (window.editMode !== 'pencil' || !mouseDown) return;
          mouseDown = false;
          handlePencilMove(e.clientX, e.clientY, true);
        });
      }

      function setupSoplon() {
        const targets = document.querySelectorAll('.vf-stavenote, .vf-notehead, .vf-rest, g.vf-rest path, path.vf-rest, svg path');
        targets.forEach(nh => {
          nh.style.cursor = 'pointer';
          nh.onclick = null;
          let pressTimer = null;
          let isLongPress = false;

          const handleInteraction = (e, isLong) => {
            if (window.editMode === 'pencil') return;
            if (window.isLoadingScore) return;
            const containers = osmd.GraphicSheet.VerticalGraphicalStaffEntryContainers;
            let partCounters = {};

            for (let i = 0; i < containers.length; i++) {
              const container = containers[i];
              for (let j = 0; j < container.StaffEntries.length; j++) {
                const se = container.StaffEntries[j];
                if (!se) continue;
                const pIdx = j;
                if (partCounters[pIdx] === undefined) partCounters[pIdx] = 0;

                for (let k = 0; k < se.graphicalVoiceEntries.length; k++) {
                  const gve = se.graphicalVoiceEntries[k];
                  for (let l = 0; l < gve.notes.length; l++) {
                    const gn = gve.notes[l];
                    const el = gn.getSVGGElement ? gn.getSVGGElement() : null;
                    if (el && (el === nh || el.contains(nh) || nh.contains(el))) {
                      const selection = { globalIdx: partCounters[pIdx], partIndex: pIdx };
                      if (isLong) send('DELETE_NOTE', selection);
                      else {
                        window.currentSelection = selection;
                        highlightNote(selection.globalIdx, selection.partIndex);
                        send('NOTE_SELECTED', selection);
                      }
                      return;
                    }
                    partCounters[pIdx]++;
                  }
                }
              }
            }
          };

          nh.addEventListener('click', (e) => {
            if (window.editMode === 'pencil') return;
            handleInteraction(e, false);
          });
        });
      }

      window.onload = function() {
        try {
          osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("score-container", {
            autoResize: true,
            backend: "svg",
            drawingParameters: "compact"
          });

          osmd.rules.PageTopMargin = 5.0;
          osmd.rules.PageBottomMargin = 5.0;
          osmd.rules.PageLeftMargin = 2.0;
          osmd.rules.PageRightMargin = 2.0;
          osmd.rules.RenderMultipleRestMeasures = false;
          osmd.rules.AutoBeamNotes = false;
          osmd.rules.DrawPartNames = false;

          attachPencilHandlers();
          send('WV_READY', 'Ready');
        } catch (e) { send('ERROR', 'Init: ' + e.message); }
      };

      window.addEventListener('message', function(event) {
        try {
          var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg.type === 'LOAD_FILE') {
            window.isLoadingScore = true;
            document.getElementById('score-container').innerHTML = '';
            var data = msg.data;
            var finalContent;
            if (data.trim().startsWith('<?xml')) { finalContent = data; }
            else { finalContent = decodeURIComponent(escape(atob(data))); }

            if (osmd) {
              osmd.load(finalContent).then(function() {
                osmd.render();
                setupSoplon();
                window.isLoadingScore = false;
                send('LOAD_COMPLETE', 'Done');
              }).catch(function(err) { window.isLoadingScore = false; send('ERROR', 'Load: ' + err); });
            }
          } else if (msg.type === 'SET_EDIT_MODE') {
            window.editMode = msg.mode;
            if (msg.mode !== 'pencil') { hideGhost(); hideMinimap(); }
          }
        } catch (e) { send('ERROR', 'Runtime: ' + e.message); }
      });
    </script>
  </body>
</html>`;
