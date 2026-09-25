import React, { useEffect, useMemo, useState } from 'react';
import {
  CircleAlert,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Lightbulb,
  ListChecks,
  MessageCircleQuestionMark,
  Music2,
  PenLine,
  Ruler,
  SeparatorHorizontal,
  Star,
  Table2,
  TriangleAlert,
  Type,
  BookOpen,
} from 'lucide-react';
import { BLOCK_MENU, type BlockTypeInfo } from '../../lib/pageModel';
import { Popover } from '../ui/primitives';

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  text: Type,
  heading: Heading2,
  'heading:h1': Heading1,
  'heading:h3': Heading3,
  stave: Music2,
  sketch: PenLine,
  'callout:definicion': BookOpen,
  'callout:regla': Ruler,
  'callout:ejemplo': Lightbulb,
  'callout:importante': Star,
  'callout:pregunta': MessageCircleQuestionMark,
  'callout:excepcion': TriangleAlert,
  checklist: ListChecks,
  table: Table2,
  image: ImageIcon,
  divider: SeparatorHorizontal,
};

export function blockIcon(type: string) {
  return ICONS[type] || CircleAlert;
}

interface Props {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onPick: (type: BlockTypeInfo['type']) => void;
}

export function InsertMenu({ anchor, open, onClose, onPick }: Props) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const items = useMemo(() => {
    const s = q.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (!s) return BLOCK_MENU;
    return BLOCK_MENU.filter((b) => `${b.name} ${b.keywords}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(s));
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      setIdx(0);
    }
  }, [open]);
  useEffect(() => setIdx(0), [q]);

  const pick = (t: BlockTypeInfo['type']) => {
    onPick(t);
    onClose();
  };

  return (
    <Popover anchor={anchor} open={open} onClose={onClose} width={290}>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIdx((i) => Math.min(items.length - 1, i + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIdx((i) => Math.max(0, i - 1));
          } else if (e.key === 'Enter' && items[idx]) {
            e.preventDefault();
            pick(items[idx].type);
          }
        }}
        placeholder="Buscar bloque… (pentagrama, tabla, regla)"
        className="field mb-1 !min-h-[34px]"
        aria-label="Buscar tipo de bloque"
      />
      {items.length === 0 && <div className="px-2 py-3 text-sm text-muted">Nada con ese nombre</div>}
      {items.map((b, i) => {
        const Icon = blockIcon(b.type);
        return (
          <button key={b.type} className="menu-item !items-start py-1.5" data-active={i === idx} onMouseEnter={() => setIdx(i)} onClick={() => pick(b.type)} role="menuitem">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted">
              <Icon size={15} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{b.name}</span>
              <span className="block truncate text-xs text-muted">{b.hint}</span>
            </span>
          </button>
        );
      })}
    </Popover>
  );
}
