export const osmdHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
      <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.8/build/opensheetmusicdisplay.min.js"></script>
      <style>
        html, body { margin: 0; padding: 0; padding-top: 20px; background-color: #fdfbf7; width: 100%; height: 100%; overflow: auto; }
        #score-container { width: 100%; min-height: 100%; padding-bottom: 50px; }
        svg { overflow: visible !important; }
        .selected-note * { fill: #d97706 !important; stroke: #d97706 !important; }
      </style>
    </head>
    <body>
      <div id="score-container"></div>
      <script>
        var osmd;
        window.onload = function() {
          try {
            osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay("score-container", {
              autoResize: true,
              backend: "svg",
              drawingParameters: "compacttight",
              drawTitle: false
            });
          } catch (e) {}
        };
      </script>
    </body>
  </html>
`;

export const pencilModeStyles = `
  #pencil-ghost {
    position: fixed;
    pointer-events: none;
    display: none;
    z-index: 9999;
  }
  #pencil-ghost .cross {
    position: absolute;
    left: 0; top: 0;
    width: 24px; height: 24px;
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
    left: 0; top: -32px;
    transform: translateX(-50%);
    background: #d97706;
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    padding: 3px 6px;
    border-radius: 6px;
    white-space: nowrap;
  }
`;
