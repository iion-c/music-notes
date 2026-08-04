export const editorOsmdHtml = `
<!DOCTYPE html>
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
      window.editMode = 'pencil'; // Modo Lápiz activado por defecto

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
            drawingParameters: "compact"
          });
          osmd.rules.PageTopMargin = 5.0;
          osmd.rules.PageBottomMargin = 5.0;
          osmd.rules.RenderMultipleRestMeasures = false;
          osmd.rules.AutoBeamNotes = false;
          osmd.rules.DrawPartNames = false;
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
            if (data.trim().startsWith('<?xml')) { finalContent = data; }
            else { finalContent = decodeURIComponent(escape(atob(data))); }

            osmd.load(finalContent).then(function() {
              osmd.render();
              send('LOAD_COMPLETE', 'Done');
            }).catch(function(err) { send('ERROR', 'Load: ' + err); });
          } else if (msg.type === 'SET_EDIT_MODE') {
            window.editMode = msg.mode;
          }
        } catch (e) { send('ERROR', 'Runtime: ' + e.message); }
      });
    </script>
  </body>
</html>
`;
