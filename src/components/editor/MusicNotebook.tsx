import React from 'react';
import { Plus, Music, FileText, Image as ImageIcon, Trash2, Tag, Star, Download } from 'lucide-react';
import { NotePage, StaveBlock, ContentBlock, TextBlock, ImageBlock } from '../../types/music';
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
      title: 'Nuevo Ejercicio de Pentagrama',
      description: 'Haz clic en el engranaje para cambiar clave o métrica',
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
      content: '<p>Escribe aquí tus observaciones teóricas, definiciones de armonía o reglas de clase...</p>'
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Cabecera de la Nota Musical */}
      <div className="mb-6 pb-4 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800">
              {page.category || 'Armonía'}
            </span>
            <button
              onClick={() => onUpdatePage({ ...page, isFavorite: !page.isFavorite })}
              className={`p-1 rounded transition-colors ${page.isFavorite ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
              title="Marcar como favorita"
            >
              <Star size={18} fill={page.isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {onDeletePage && (
            <button
              onClick={onDeletePage}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
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
          className="w-full text-2xl sm:text-3xl font-extrabold text-white bg-transparent focus:outline-none focus:border-b-2 focus:border-cyan-500 py-1"
          placeholder="Título de la nota musical..."
        />

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
          <Tag size={13} className="text-slate-500" />
          {page.tags.map((tag, tIdx) => (
            <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/50">
              #{tag}
            </span>
          ))}
          <span className="ml-auto text-slate-500 text-[11px]">
            Última actualización: {new Date(page.updatedAt).toLocaleDateString()}
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
                  className="prose prose-invert max-w-none p-3 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-transparent hover:border-slate-700/60 focus:outline-none text-slate-200 text-sm sm:text-base leading-relaxed transition-all"
                />
                <button
                  onClick={() => handleDeleteBlock(index)}
                  className="absolute top-2 right-2 p-1 rounded bg-slate-800 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Eliminar bloque de texto"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          }

          if (block.type === 'image') {
            return (
              <div key={block.id} className="my-4 rounded-xl border border-slate-700/60 bg-slate-900 p-3 relative group">
                <img src={block.src} alt={block.caption} className="w-full rounded-lg border border-slate-800" />
                <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                  <span>📸 {block.caption}</span>
                  <button
                    onClick={() => handleDeleteBlock(index)}
                    className="text-rose-400 hover:text-rose-300"
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

      {/* Botones Flotantes de Acción para añadir contenido */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleAddStaveBlock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5"
        >
          <Music size={16} />
          <span>+ Insertar Pentagrama Editable</span>
        </button>

        <button
          onClick={handleAddTextBlock}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition-all"
        >
          <FileText size={16} />
          <span>+ Bloque de Apuntes Teóricos</span>
        </button>
      </div>
    </div>
  );
};
