import React from 'react';
import { Plus, Music, FileText, Trash2, Tag, Star } from 'lucide-react';
import type { NotePage, StaveBlock, ContentBlock, ImageBlock } from '../../types/music';
import { StaveBlockComponent } from '../stave/StaveBlockComponent';

interface Props {
  page: NotePage;
  onUpdatePage: (updatedPage: NotePage) => void;
  onDeletePage?: () => void;
}

export const MusicNotebook: React.FC<Props> = ({ page, onUpdatePage, onDeletePage }) => {
  // Añadir un nuevo Pentagrama a la página de apuntes
  const handleAddStaveBlock = () => {
    const newStave: StaveBlock = {
      id: `stave-${Date.now()}`,
      title: 'Nuevo Pentagrama de Ejercicio',
      description: 'Haz clic en Clave & Compases para personalizar',
      isCollapsed: false,
      clef: 'treble',
      keySignature: 'C',
      timeSignature: '4/4',
      exerciseType: 'harmony',
      displayRange: { mode: 'all' },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      measures: [
        {
          id: `m-init-1`,
          measureNumber: 1,
          notes: [
            { id: `n-1`, keys: ['c/4'], duration: 'q', isRest: false },
            { id: `n-2`, keys: ['e/4'], duration: 'q', isRest: false },
            { id: `n-3`, keys: ['g/4'], duration: 'q', isRest: false },
            { id: `n-4`, keys: ['c/5'], duration: 'q', isRest: false }
          ],
          harmonicAnalysis: { measureNumber: 1, romanNumeral: 'I', figuredBass: '5/3' }
        }
      ]
    };

    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type: 'stave',
      data: newStave
    };

    onUpdatePage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now()
    });
  };

  // Añadir un bloque de texto explicativo/teórico
  const handleAddTextBlock = () => {
    const newBlock: ContentBlock = {
      id: `block-text-${Date.now()}`,
      type: 'text',
      content: '<p>Escribe aquí tus apuntes teóricos, definiciones de reglas o análisis de clase...</p>'
    };

    onUpdatePage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now()
    });
  };

  // Actualizar un bloque individual
  const handleUpdateBlock = (index: number, updatedBlock: ContentBlock) => {
    const blocks = [...page.blocks];
    blocks[index] = updatedBlock;
    onUpdatePage({ ...page, blocks, updatedAt: Date.now() });
  };

  // Eliminar un bloque
  const handleDeleteBlock = (index: number) => {
    const blocks = page.blocks.filter((_, i) => i !== index);
    onUpdatePage({ ...page, blocks, updatedAt: Date.now() });
  };

  // Insertar tarjeta de captura de pantalla
  const handleInsertSnapshotCard = (dataUrl: string) => {
    const newBlock: ImageBlock = {
      id: `img-${Date.now()}`,
      type: 'image',
      src: dataUrl,
      caption: `Captura de Pentagrama - ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now()
    };
    onUpdatePage({
      ...page,
      blocks: [...page.blocks, newBlock],
      updatedAt: Date.now()
    });
  };

  return (
    <div className="max-w-4xl mx-auto my-4 p-6 sm:p-10 rounded-2xl bg-[#fdfbf7] border border-amber-200/90 shadow-xl shadow-amber-950/5 notebook-margin pl-8 sm:pl-12 relative overflow-hidden">
      {/* Margen superior de hoja de cuaderno */}
      <div className="mb-6 pb-4 border-b-2 border-amber-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              {page.category || 'Apunte Musical'}
            </span>
            <button
              onClick={() => onUpdatePage({ ...page, isFavorite: !page.isFavorite })}
              className={`p-1 rounded-lg transition-colors ${page.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
              title="Marcar como favorita"
            >
              <Star size={18} fill={page.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {onDeletePage && (
            <button
              onClick={onDeletePage}
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
            >
              <Trash2 size={14} />
              <span>Eliminar Nota</span>
            </button>
          )}
        </div>

        <input
          type="text"
          value={page.title}
          onChange={(e) => onUpdatePage({ ...page, title: e.target.value, updatedAt: Date.now() })}
          className="w-full text-2xl sm:text-3xl font-extrabold text-slate-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-amber-500 py-1"
          placeholder="Título de la Nota de Música..."
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-500">
          <Tag size={13} className="text-amber-600" />
          {page.tags.map((tag, tIdx) => (
            <span key={tIdx} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-medium">
              #{tag}
            </span>
          ))}
          <span className="ml-auto text-slate-400 text-[11px]">
            Actualizado: {new Date(page.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Bloques de la Nota (Texto Enriquecido y Pentagramas) */}
      <div className="space-y-4">
        {page.blocks.map((block, index) => {
          if (block.type === 'stave') {
            return (
              <StaveBlockComponent
                key={block.id}
                staveBlock={block.data}
                onUpdate={(updatedStave) => handleUpdateBlock(index, { id: block.id, type: 'stave', data: updatedStave })}
                onDelete={() => handleDeleteBlock(index)}
                onInsertSnapshotCard={handleInsertSnapshotCard}
              />
            );
          }

          if (block.type === 'text') {
            return (
              <div key={block.id} className="relative group my-3">
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleUpdateBlock(index, { id: block.id, type: 'text', content: e.currentTarget.innerHTML })}
                  dangerouslySetInnerHTML={{ __html: block.content }}
                  className="prose max-w-none p-4 rounded-xl bg-[#fbf8f0] hover:bg-[#f6f2e6] border border-amber-200/60 focus:outline-none text-slate-800 text-sm sm:text-base leading-relaxed transition-all shadow-sm"
                />
                <button
                  onClick={() => handleDeleteBlock(index)}
                  className="absolute top-2 right-2 p-1 rounded bg-rose-100 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar bloque de texto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          }

          if (block.type === 'image') {
            return (
              <div key={block.id} className="my-4 rounded-2xl border border-amber-200 bg-[#f8f5ee] p-3 relative group shadow-sm">
                <img src={block.src} alt={block.caption} className="w-full rounded-xl border border-amber-200" />
                <div className="mt-2 text-xs text-slate-600 flex items-center justify-between">
                  <span>📸 {block.caption}</span>
                  <button
                    onClick={() => handleDeleteBlock(index)}
                    className="text-rose-600 hover:text-rose-700 font-semibold"
                  >
                    Eliminar Captura
                  </button>
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>

      {/* Botones de Acción para añadir contenido */}
      <div className="mt-8 pt-4 border-t border-amber-200/80 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleAddStaveBlock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition-all transform hover:-translate-y-0.5"
        >
          <Music size={16} />
          <span>+ Insertar Pentagrama Editable</span>
        </button>

        <button
          onClick={handleAddTextBlock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm border border-amber-300 transition-all"
        >
          <FileText size={16} />
          <span>+ Apunte Teórico</span>
        </button>
      </div>
    </div>
  );
};
