export const editorOsmdHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
    <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.8/build/opensheetmusicdisplay.min.js"></script>
    <style>
      html, body {
        margin: 0; padding: 0;
        background-color: #fdfbf7;
        width: 100%; height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        user-select: none;
        -webkit-user-select: none;
      }
      #score-container {
        width: 100%;
        min-height: 220px;
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
      }
      .selected-note, .selected-note * { fill: #d97706 !important; stroke: #d97706 !important; }

      /* Cruceta de Lápiz Limpia a Pantalla Completa */
      #full-crosshair-h {
        position: fixed;
        left: 0; right: 0;
        height: 1.5px;
        background: rgba(217, 119, 6, 0.7);
        pointer-events: none;
        display: none;
        z-index: 9999;
      }
      #full-crosshair-v {
        position: fixed;
        top: 0; bottom: 0;
        width: 1.5px;
        background: rgba(217, 119, 6, 0.7);
        pointer-events: none;
        display: none;
        z-index: 9999;
      }
      #crosshair-badge {
        position: fixed;
        pointer-events: none;
        display: none;
        z-index: 10000;
        background: #d97706;
        color: #ffffff;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        transform: translate(-50%, -140%);
        white-space: nowrap;
      }
      #crosshair-dot {
        position: fixed;
        pointer-events: none;
        display: none;
        z-index: 10000;
        width: 12px; height: 12px;
        border-radius: 50%;
        background: #d97706;
        border: 2px solid #ffffff;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 6px rgba(217, 119, 6, 0.6);
      }
    </style>
  </head>
  <body>
    <div id="score-container"></div>

    <!-- Cruceta Completa -->
    <div id="full-crosshair-h"></div>
    <div id="full-crosshair-v"></div>
    <div id="crosshair-badge"></div>
    <div id="crosshair-dot"></div>

    <script>
      window.oncontextmenu = function(e) { e.preventDefault(); return false; };
      var osmd;
      window.editMode = 'pencil';

      function send(type, data) {
        var payload = JSON.stringify({ type: type, data: data });
        if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
        if (window.parent) window.parent.postMessage(payload, '*');
      }

      function updateCrosshair(clientX, clientY, pitchText) {
        var h = document.getElementById('full-crosshair-h');
        var v = document.getElementById('full-crosshair-v');
        var badge = document.getElementById('crosshair-badge');
        var dot = document.getElementById('crosshair-dot');

        h.style.top = clientY + 'px';
        h.style.display = 'block';

        v.style.left = clientX + 'px';
        v.style.display = 'block';

        dot.style.left = clientX + 'px';
        dot.style.top = clientY + 'px';
        dot.style.display = 'block';

        badge.style.left = clientX + 'px';
        badge.style.top = clientY + 'px';
        badge.textContent = pitchText;
        badge.style.display = 'block';
      }

      function hideCrosshair() {
        document.getElementById('full-crosshair-h').style.display = 'none';
        document.getElementById('full-crosshair-v').style.display = 'none';
        document.getElementById('crosshair-badge').style.display = 'none';
        document.getElementById('crosshair-dot').style.display = 'none';
      }

      function calculatePitchFromY(y) {
        var pitchScale = ['G5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'];
        var idx = Math.max(0, Math.min(pitchScale.length - 1, Math.floor(y / 14)));
        return pitchScale[idx];
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
          osmd.rules.RenderMultipleRestMeasures = false;
          osmd.rules.AutoBeamNotes = false;
          osmd.rules.DrawPartNames = false;
          send('WV_READY', 'Ready');
        } catch (e) { send('ERROR', 'Init: ' + e.message); }

        var container = document.body;

        function handlePointerMove(e) {
          if (window.editMode !== 'pencil') return;
          var x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
          var y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
          if (!x && !y) return;

          var pitch = calculatePitchFromY(y);
          updateCrosshair(x, y, pitch);
        }

        container.addEventListener('mousemove', handlePointerMove);
        container.addEventListener('touchmove', function(e) {
          if (window.editMode === 'pencil') {
            e.preventDefault();
            handlePointerMove(e);
          }
        }, { passive: false });

        container.addEventListener('mouseleave', hideCrosshair);
        container.addEventListener('touchend', function() {
          hideCrosshair();
        });
      };

      window.addEventListener('message', function(event) {
        try {
          var msg = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (msg.type === 'LOAD_FILE') {
            document.getElementById('score-container').innerHTML = '';
            var data = msg.data;
            var finalContent;
            if (data.trim().startsWith('<?xml')) { finalContent = data; }
            else { finalContent = decodeURIComponent(escape(atob(data))); }

            if (osmd) {
              osmd.load(finalContent).then(function() {
                osmd.render();
                send('LOAD_COMPLETE', 'Done');
              }).catch(function(err) { send('ERROR', 'Load: ' + err); });
            }
          } else if (msg.type === 'SET_EDIT_MODE') {
            window.editMode = msg.mode;
            if (msg.mode !== 'pencil') hideCrosshair();
          }
        } catch (e) { send('ERROR', 'Runtime: ' + e.message); }
      });
    </script>
  </body>
</html>`;
