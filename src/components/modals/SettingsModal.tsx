import React from 'react';
import { Download, Monitor, Moon, Sun, Upload } from 'lucide-react';
import { useStore } from '../../store';
import { PAGE_WIDTHS } from '../../lib/paper';
import { downloadBlob } from '../../lib/image';
import { Modal, Segmented } from '../ui/primitives';
import type { AppSettings, PageWidth } from '../../types/notes';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings, updateSettings, notebooks, pages, importData, toast } = useStore();

  const exportAll = () => {
    const data = { notebooks, pages, version: '3', exportDate: new Date().toISOString() };
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `music-notes-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    file
      .text()
      .then((txt) => {
        const parsed = JSON.parse(txt);
        if (!Array.isArray(parsed.pages) || !Array.isArray(parsed.notebooks)) throw new Error('formato');
        importData(parsed);
      })
      .catch(() => toast('Ese archivo no es una copia válida de Music Notes', 'error'));
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajustes" width={520}>
      <div className="space-y-6 p-5">
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Apariencia</h3>
          <Row label="Tema de la interfaz">
            <Segmented
              value={settings.theme}
              onChange={(theme: AppSettings['theme']) => updateSettings({ theme })}
              options={[
                { value: 'system', label: <Monitor size={14} />, title: 'Como el sistema' },
                { value: 'light', label: <Sun size={14} />, title: 'Claro' },
                { value: 'dark', label: <Moon size={14} />, title: 'Oscuro' },
              ]}
            />
          </Row>
          <Row label="Tamaño de la hoja">
            <Segmented
              value={settings.pageWidth}
              onChange={(pageWidth: PageWidth) => updateSettings({ pageWidth })}
              options={(Object.keys(PAGE_WIDTHS) as PageWidth[]).map((k) => ({ value: k, label: PAGE_WIDTHS[k].name }))}
            />
          </Row>
          <Row label="Preguntas guía del método" hint="Sugerencias en la columna de claves y el resumen">
            <input type="checkbox" className="h-5 w-5" style={{ accentColor: 'var(--accent)' }} checked={settings.methodHints} onChange={(e) => updateSettings({ methodHints: e.target.checked })} />
          </Row>
          <p className="text-xs text-muted">El papel, la letra y la tinta se personalizan desde cada hoja (botón de ajustes arriba a la derecha).</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Sonido de los pentagramas</h3>
          <Row label="Instrumento">
            <select className="field !w-40" value={settings.instrument} onChange={(e) => updateSettings({ instrument: e.target.value as AppSettings['instrument'] })}>
              <option value="piano">Piano</option>
              <option value="organ">Órgano</option>
              <option value="flute">Flauta</option>
              <option value="synth">Sintetizador</option>
            </select>
          </Row>
          <Row label={`Tempo: ${settings.bpm} BPM`}>
            <input type="range" min={40} max={200} value={settings.bpm} onChange={(e) => updateSettings({ bpm: parseInt(e.target.value, 10) })} className="w-40" style={{ accentColor: 'var(--accent)' }} />
          </Row>
          <Row label="Sonar la nota al escribirla">
            <input type="checkbox" className="h-5 w-5" style={{ accentColor: 'var(--accent)' }} checked={settings.previewSound} onChange={(e) => updateSettings({ previewSound: e.target.checked })} />
          </Row>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Copia de seguridad</h3>
          <p className="text-xs text-muted">
            {pages.length} hojas en {notebooks.length} cuadernos. Exporta un archivo para guardarlo donde quieras o pasarlo a otro dispositivo.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-outline" onClick={exportAll}>
              <Download size={15} /> Exportar todo
            </button>
            <label className="btn btn-outline cursor-pointer">
              <Upload size={15} /> Importar
              <input type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            </label>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
