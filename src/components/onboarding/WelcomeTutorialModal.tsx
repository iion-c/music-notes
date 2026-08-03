import React, { useState } from 'react';
import { BookOpen, Music, PenTool, Camera, Play, ChevronRight, ChevronLeft, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomeTutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      title: '¡Bienvenido a Music Notes! 🎼',
      subtitle: 'Tu cuaderno académico inteligente para la teoría y composición musical.',
      icon: <BookOpen className="w-12 h-12 text-amber-600" />,
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p>
            Esta aplicación está diseñada como un <strong>cuaderno de partituras físico</strong> para tomar apuntes de <em>Armonía, Contrapunto, Solfeo y Composición</em>.
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-950 font-medium">
              Todo lo que escribas se guarda automáticamente en tu navegador sin necesidad de registro previo.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Pentagramas Editables & Desplegables 🎹',
      subtitle: 'Inserta pentagramas interactivos en cualquier lugar de tus apuntes.',
      icon: <Music className="w-12 h-12 text-amber-600" />,
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span><strong>Despliega u oculta</strong> pentagramas con un clic para mantener la página ordenada.</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span><strong>Selección de Compases:</strong> Elige qué compases mostrar (ej. 1-4, 5-8 o compás aislado).</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Personaliza <strong>Claves</strong> (Sol, Fa, Do 3ª/4ª), <strong>Métricas</strong> (4/4, 6/8, 4/2) y <strong>Armaduras</strong>.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Análisis Armónico y Cifrado ✏️',
      subtitle: 'Añade notas en tus ejercicios compás por compás.',
      icon: <PenTool className="w-12 h-12 text-amber-600" />,
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <p className="text-xs">
            Escribe anotaciones musicales directamente debajo de la partitura:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-800">Grados Romanos:</span>
              <p className="text-[11px] text-slate-600">I, IV, V7, ii6, vi</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
              <span className="font-bold text-amber-800">Bajo Cifrado:</span>
              <p className="text-[11px] text-slate-600">6, 6/4, 7, 6/5</p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Añade notas sobre conducción de voces, especies de contrapunto de Fux o comentarios teóricos.
          </p>
        </div>
      )
    },
    {
      title: 'Audio Synthesizer & Capturas PNG 📸',
      subtitle: 'Escucha tus ejercicios y exporta imágenes de partituras.',
      icon: <Camera className="w-12 h-12 text-amber-600" />,
      color: 'bg-amber-100 text-amber-900 border-amber-300',
      content: (
        <div className="space-y-3 text-slate-700 text-sm leading-relaxed">
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600" />
              <span><strong>Reproductor Synthesizer:</strong> Escucha tus notas en tiempo real con resalte activo y tempo BPM.</span>
            </li>
            <li className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-600" />
              <span><strong>Captura de Pantalla:</strong> Exporta pentagramas a imágenes PNG de alta resolución o cópialas al portapapeles.</span>
            </li>
          </ul>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-[#fdfbf7] border border-amber-200/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 bg-[#f8f5ee] border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Paso {currentSlide + 1} de {slides.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Slide Content */}
        <div className="p-6 flex-1 space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm shrink-0">
              {current.icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{current.title}</h3>
              <p className="text-xs text-amber-800 font-medium">{current.subtitle}</p>
            </div>
          </div>

          <div className="pt-2">
            {current.content}
          </div>
        </div>

        {/* Progress indicators & Footer actions */}
        <div className="p-4 bg-[#f8f5ee] border-t border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 rounded-full transition-all ${
                  idx === currentSlide ? 'w-6 bg-amber-600' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-200/60 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={15} />
                <span>Anterior</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all flex items-center gap-1"
            >
              <span>{currentSlide === slides.length - 1 ? '¡Comenzar!' : 'Siguiente'}</span>
              {currentSlide === slides.length - 1 ? <CheckCircle2 size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
