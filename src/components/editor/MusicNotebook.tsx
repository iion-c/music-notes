import React, { useState } from 'react';
import { 
  Plus, Trash2, ChevronUp, ChevronDown, Music, Type, 
  Tag, Star, Camera, Heading, Palette, Edit3
} from 'lucide-react';
import type { NotePage, ContentBlock, StaveBlock, TextBlock, ImageBlock, HeadingBlock } from '../../types/music';
import { StaveBlockComponent } from '../stave/StaveBlockComponent';
import { ArmoniaScoreEditorModal } from '../stave/ArmoniaScoreEditorModal';

interface Props {
  page: NotePage;
  onUpdatePage: (updatedPage: NotePage) => void;
  onDeletePage: () => void;
}

export const MusicNotebook: React.FC<Props> = ({ page, onUpdatePage, onDeletePage }) => {
  const [tagInput, setTagInput] = useState('');
  const [editingStaveBlock, setEditingStaveBlock] = useState<StaveBlock | null>(null);
  const [isStaveModalOpen, setIsStaveModalOpen] = useState<boolean>(false);

  // Reordenar bloques (Subir / Bajar)
  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...page.blocks];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBlocks.length) return;

    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[targetIdx];
    newBlocks[targetIdx] = temp;

    onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
  };

  // Eliminar un bloque con confirmación
  const deleteBlock = (blockId: string) => {
    if (window.confirm('¿Deseas eliminar este bloque de la hoja?')) {
      const newBlocks = page.blocks.filter(b => b.id !== blockId);
      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
    }
  };

  // Confirmación al eliminar hoja
  const handleDeletePageClick = () => {
    if (window.confirm(`¿Seguro que deseas eliminar la hoja "${page.title}"?`)) {
      onDeletePage();
    }
  };

  // Abrir Modal Editor de ArmonIA-App
  const handleOpenStaveModal = (existingStave?: StaveBlock) => {
    if (existingStave) {
      setEditingStaveBlock(existingStave);
    } else {
      const newStave: StaveBlock = {
        id: `stave-${Date.now()}`,
        title: 'Ejercicio de Armonía',
        isCollapsed: false,
        clef: 'treble',
        keySignature: 'C',
        timeSignature: '4/4',
        displayRange: { mode: 'all' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        measures: [
          {
            id: `m-${Date.now()}-1`,
            measureNumber: 1,
            notes: [
              { id: `n-1`, keys: ['c/4'], duration: 'q', isRest: false },
              { id: `n-2`, keys: ['e/4'], duration: 'q', isRest: false },
              { id: `n-3`, keys: ['g/4'], duration: 'q', isRest: false },
              { id: `n-4`, keys: ['c/5'], duration: 'q', isRest: false }
            ],
            harmonicAnalysis: { measureNumber: 1, romanNumeral: 'I' }
          }
        ]
      };
      setEditingStaveBlock(newStave);
    }
    setIsStaveModalOpen(true);
  };

  // Guardar Pentagrama desde Modal ArmonIA
  const handleSaveStaveFromModal = (finalStave: StaveBlock) => {
    const existingIndex = page.blocks.findIndex(b => b.id === finalStave.id);
    let updatedBlocks: ContentBlock[];

    if (existingIndex !== -1) {
      updatedBlocks = [...page.blocks];
      updatedBlocks[existingIndex] = { id: finalStave.id, type: 'stave', data: finalStave };
    } else {
      updatedBlocks = [...page.blocks, { id: finalStave.id, type: 'stave', data: finalStave }];
    }

    onUpdatePage({ ...page, blocks: updatedBlocks, updatedAt: Date.now() });
  };

  // Añadir Título
  const addHeadingBlock = () => {
    const newHeading: HeadingBlock = {
      id: `h-${Date.now()}`,
      type: 'heading',
      text: '',
      level: 'h2',
      color: '#92400e'
    };
    onUpdatePage({ ...page, blocks: [...page.blocks, newHeading], updatedAt: Date.now() });
  };

  // Añadir Bloque de Texto / Callout
  const addTextBlock = (variant: 'normal' | 'callout-yellow' | 'callout-blue' | 'callout-green' = 'normal') => {
    const newText: TextBlock = {
      id: `tb-${Date.now()}`,
      type: 'text',
      content: '',
      styleVariant: variant
    };
    onUpdatePage({ ...page, blocks: [...page.blocks, newText], updatedAt: Date.now() });
  };

  // Añadir Imagen
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      const newImg: ImageBlock = {
        id: `img-${Date.now()}`,
        type: 'image',
        src,
        caption: '',
        alignment: 'center',
        timestamp: Date.now()
      };
      onUpdatePage({ ...page, blocks: [...page.blocks, newImg], updatedAt: Date.now() });
    };
    reader.readAsDataURL(file);
  };

  // Añadir Tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!page.tags.includes(tagInput.trim())) {
        onUpdatePage({ ...page, tags: [...page.tags, tagInput.trim()], updatedAt: Date.now() });
      }
      setTagInput('');
    }
  };

  // Eliminar Tag
  const handleRemoveTag = (tagToRemove: string) => {
    onUpdatePage({ ...page, tags: page.tags.filter(t => t !== tagToRemove), updatedAt: Date.now() });
  };

  const DEFAULT_PLACEHOLDERS = [
    'Empieza a escribir tus observaciones musicales o añade un pentagrama...',
    'Escribe aquí tus apuntes teóricos o reglas de conducción de voces...',
    '💡 <strong>Regla de Armonía:</strong> Evitar quintas y octavas paralelas...',
    'Nuevo Título de Tema'
  ];

  return (
    <div className="max-w-4xl mx-auto my-3 sm:my-6">
      {/* Modal Editor ArmonIA App */}
      {editingStaveBlock && (
        <ArmoniaScoreEditorModal
          isOpen={isStaveModalOpen}
          initialBlock={editingStaveBlock}
          onClose={() => setIsStaveModalOpen(false)}
          onSave={handleSaveStaveFromModal}
        />
      )}

      {/* Cuaderno Estilo Libreta Académica */}
      <div className="bg-[#fdfbf7] border border-amber-200/90 rounded-3xl shadow-xl shadow-amber-950/5 overflow-hidden relative transition-all">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-rose-300/60 pointer-events-none hidden sm:block" />

        {/* Encabezado de la Hoja */}
        <div className="p-5 sm:p-8 bg-[#f9f6ee] border-b border-amber-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-300">
                {page.category}
              </span>
              <button
                onClick={() => onUpdatePage({ ...page, isFavorite: !page.isFavorite, updatedAt: Date.now() })}
                className="p-1 rounded-lg text-amber-500 hover:bg-amber-100/60 transition-colors"
                title={page.isFavorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
              >
                <Star size={18} className={page.isFavorite ? 'fill-amber-500' : ''} />
              </button>
            </div>

            <button
              onClick={handleDeletePageClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition-colors"
            >
              <Trash2 size={14} />
              <span>Eliminar Hoja</span>
            </button>
          </div>

          {/* Título de la Hoja */}
          <input
            type="text"
            value={page.title}
            onFocus={(e) => {
              if (e.target.value === 'Nueva Nota Musical') {
                onUpdatePage({ ...page, title: '', updatedAt: Date.now() });
              }
            }}
            onChange={(e) => onUpdatePage({ ...page, title: e.target.value, updatedAt: Date.now() })}
            className="w-full text-2xl sm:text-3xl font-extrabold text-slate-900 bg-transparent border-b-2 border-transparent hover:border-amber-300 focus:border-amber-500 focus:outline-none transition-all placeholder-slate-400"
            placeholder="Escribe el título de esta hoja..."
          />

          {/* Etiquetas / Tags */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <Tag size={14} className="text-amber-700" />
            {page.tags.map(tag => (
              <span key={tag} className="px-2.5 py-0.5 rounded-full bg-white text-slate-800 font-bold border border-amber-200 flex items-center gap-1">
                <span>#{tag}</span>
                <button onClick={() => handleRemoveTag(tag)} className="text-slate-400 hover:text-rose-600 font-bold">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="+ Añadir tag (Enter)"
              className="bg-transparent text-xs text-slate-700 placeholder-slate-400 focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Cuerpo del Apunte: Bloques Personalizables */}
        <div className="p-4 sm:p-8 space-y-6 min-h-[350px]">
          {page.blocks.map((block, idx) => (
            <div key={block.id} className="relative group/block border border-transparent hover:border-amber-200 rounded-2xl p-2 transition-all">
              
              {/* Controles de Reordenamiento (`▲ Subir`, `▼ Bajar`) */}
              <div className="absolute top-2 right-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1 bg-[#fdfbf7] p-1 rounded-xl border border-amber-200 shadow-md z-10">
                <button
                  onClick={() => moveBlock(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-amber-100 text-slate-600 disabled:opacity-30"
                  title="Subir Bloque"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  onClick={() => moveBlock(idx, 'down')}
                  disabled={idx === page.blocks.length - 1}
                  className="p-1 rounded hover:bg-amber-100 text-slate-600 disabled:opacity-30"
                  title="Bajar Bloque"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="p-1 rounded hover:bg-rose-100 text-rose-600"
                  title="Eliminar Bloque"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* RENDER SEGÚN TIPO DE BLOQUE */}
              {block.type === 'heading' && (
                <div className="py-2">
                  <input
                    type="text"
                    value={block.text}
                    onFocus={(e) => {
                      if (DEFAULT_PLACEHOLDERS.includes(e.target.value)) {
                        const newBlocks = [...page.blocks];
                        (newBlocks[idx] as HeadingBlock).text = '';
                        onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                      }
                    }}
                    onChange={(e) => {
                      const newBlocks = [...page.blocks];
                      (newBlocks[idx] as HeadingBlock).text = e.target.value;
                      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                    }}
                    className="w-full font-extrabold bg-transparent focus:outline-none focus:border-b-2 border-amber-500"
                    style={{ 
                      fontSize: block.level === 'h1' ? '1.75rem' : block.level === 'h2' ? '1.35rem' : '1.1rem',
                      color: block.color || '#92400e'
                    }}
                    placeholder="Escribe el título de la sección..."
                  />
                </div>
              )}

              {block.type === 'text' && (
                <div className={`p-4 rounded-2xl transition-all ${
                  block.styleVariant === 'callout-yellow' ? 'bg-amber-50 border border-amber-200 text-amber-950 shadow-sm' :
                  block.styleVariant === 'callout-blue' ? 'bg-sky-50 border border-sky-200 text-sky-950 shadow-sm' :
                  block.styleVariant === 'callout-green' ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-sm' :
                  'bg-white border border-amber-100 text-slate-800'
                }`}>
                  <textarea
                    value={block.content}
                    onFocus={(e) => {
                      if (DEFAULT_PLACEHOLDERS.includes(e.target.value)) {
                        const newBlocks = [...page.blocks];
                        (newBlocks[idx] as TextBlock).content = '';
                        onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                      }
                    }}
                    onChange={(e) => {
                      const newBlocks = [...page.blocks];
                      (newBlocks[idx] as TextBlock).content = e.target.value;
                      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                    }}
                    rows={3}
                    className="w-full bg-transparent resize-y focus:outline-none font-serif text-sm sm:text-base leading-relaxed"
                    placeholder="Escribe tus notas teóricas aquí..."
                  />
                </div>
              )}

              {block.type === 'image' && (
                <div className="space-y-2 flex flex-col items-center">
                  <img
                    src={block.src}
                    alt={block.caption}
                    className="rounded-2xl border border-amber-200 shadow-md max-h-[400px] object-contain bg-white"
                  />
                  <input
                    type="text"
                    value={block.caption}
                    onChange={(e) => {
                      const newBlocks = [...page.blocks];
                      (newBlocks[idx] as ImageBlock).caption = e.target.value;
                      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                    }}
                    className="text-center text-xs font-semibold text-slate-500 bg-transparent focus:outline-none"
                    placeholder="Escribe la leyenda de esta foto..."
                  />
                </div>
              )}

              {block.type === 'stave' && (
                <div className="relative group/stave">
                  <button
                    onClick={() => handleOpenStaveModal(block.data)}
                    className="absolute top-3 right-16 z-20 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1"
                  >
                    <Edit3 size={13} />
                    <span>Abrir Editor ArmonIA</span>
                  </button>

                  <StaveBlockComponent
                    staveBlock={block.data}
                    onUpdate={(updatedStave) => {
                      const newBlocks = [...page.blocks];
                      newBlocks[idx] = { id: block.id, type: 'stave', data: updatedStave };
                      onUpdatePage({ ...page, blocks: newBlocks, updatedAt: Date.now() });
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botones Flotantes Inferiores para Añadir Bloques */}
        <div className="p-4 bg-[#f8f5ee] border-t border-amber-200/80 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => handleOpenStaveModal()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs shadow-lg shadow-amber-600/25 transition-all"
          >
            <Music size={16} />
            <span>+ Pentagrama Interactivo (Editor ArmonIA)</span>
          </button>

          <button
            onClick={addHeadingBlock}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 shadow-sm transition-all"
          >
            <Heading size={16} />
            <span>+ Título</span>
          </button>

          <button
            onClick={() => addTextBlock('normal')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 shadow-sm transition-all"
          >
            <Type size={16} />
            <span>+ Texto</span>
          </button>

          <button
            onClick={() => addTextBlock('callout-yellow')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs border border-amber-300 shadow-sm transition-all"
          >
            <Palette size={16} />
            <span>+ Nota Destacada</span>
          </button>

          <label className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 shadow-sm transition-all cursor-pointer">
            <Camera size={16} />
            <span>+ Foto / Imagen</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
