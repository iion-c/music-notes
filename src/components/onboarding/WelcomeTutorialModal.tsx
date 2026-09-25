import React, { useEffect, useState } from 'react';
import { Brain, Library, Music2, SlidersHorizontal } from 'lucide-react';
import { Modal } from '../ui/primitives';

const STEPS = [
  {
    icon: Library,
    title: 'Un cuaderno por asignatura',
    text: 'Crea cuadernos como Armonía I o Historia de la música, con su profesor y horario. Dentro, una hoja por clase, organizada por unidades como los separadores de tu carpeta.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Hojas que se sienten como papel',
    text: 'Escribe directamente sobre los renglones. Elige papel rayado, cuadriculado, punteado o pautado, letra manuscrita o de libro, color de tinta e interlineado. Escribe / para insertar cualquier cosa.',
  },
  {
    icon: Music2,
    title: 'Pentagramas con el lápiz de ArmonIA',
    text: 'Añade un pentagrama (simple o sistema de piano para 4 voces) y escribe notas arrastrando el lápiz sobre las líneas, o con el teclado: 1–5 para la figura, # y B para alteraciones. Anota grados bajo cada nota.',
  },
  {
    icon: Brain,
    title: 'Cornell y repaso espaciado',
    text: 'Escribe preguntas en la columna izquierda y un resumen abajo. Luego usa "Repasar": se tapan las notas y respondes de memoria. La app te avisa cuándo volver a repasar cada hoja.',
  },
];

export function WelcomeTutorialModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (isOpen) setStep(0);
  }, [isOpen]);
  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      width={460}
      footer={
        <>
          <div className="mr-auto flex gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === step ? 18 : 6, background: i === step ? 'var(--accent)' : 'var(--border-strong)' }} />
            ))}
          </div>
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              Atrás
            </button>
          )}
          <button className="btn btn-primary" onClick={() => (last ? onClose() : setStep(step + 1))}>
            {last ? 'Empezar' : 'Siguiente'}
          </button>
        </>
      }
    >
      <div className="p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          <Icon size={26} />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">
          Paso {step + 1} de {STEPS.length}
        </p>
        <h2 className="mt-1 text-lg font-semibold">{s.title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{s.text}</p>
      </div>
    </Modal>
  );
}
