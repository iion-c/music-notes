import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Modal } from '../ui/primitives';

interface Principle {
  title: string;
  idea: string;
  inApp: string;
  source: string;
  url: string;
}

/** Principios con respaldo empírico que guían el diseño de la app (resumidos con palabras propias). */
export const PRINCIPLES: Principle[] = [
  {
    title: 'Divide la hoja en tres zonas (Cornell)',
    idea: 'Notas de clase a la derecha, una columna estrecha a la izquierda para preguntas o palabras clave que escribes después de clase, y una franja inferior para resumir la hoja. El proceso es: registrar, reducir, recitar, reflexionar y repasar.',
    inApp: 'Diseño "Cornell" con columna de claves alineada a cada bloque y resumen al pie. El modo Repasar tapa las notas para que respondas las claves de memoria.',
    source: 'Pauk, W. & Owens, R. — How to Study in College (Cornell University)',
    url: 'https://lsc.cornell.edu/how-to-study/taking-notes/cornell-note-taking-system/',
  },
  {
    title: 'Escribe con tus palabras, no al dictado',
    idea: 'En tres experimentos, quienes tomaron notas en portátil transcribían más literalmente y rindieron peor en preguntas conceptuales que quienes escribían a mano. Réplicas posteriores encontraron un efecto menor, pero el mensaje práctico se mantiene: procesar y reformular ayuda más que copiar.',
    inApp: 'Papel rayado y letra manuscrita para que se sienta como escribir en un cuaderno, dibujo a mano con stylus, y preguntas guía que invitan a resumir en vez de transcribir.',
    source: 'Mueller, P. A. & Oppenheimer, D. M. (2014). Psychological Science, 25(6)',
    url: 'https://journals.sagepub.com/doi/abs/10.1177/0956797614524581',
  },
  {
    title: 'Tomar notas y además repasarlas',
    idea: 'Tomar apuntes ayuda (función de codificación), pero la combinación de tomarlos y revisarlos después es superior para recordar y sintetizar. Organizar la información en matrices o cuadros mejora el recuerdo frente a notas lineales.',
    inApp: 'Recordatorios de repaso por hoja y la plantilla "Tabla comparativa" (método de cuadros) para comparar periodos, cadencias o formas.',
    source: 'Kiewra, K. A. (1989). Educational Psychology Review, 1 · Kiewra et al. (1991). Journal of Educational Psychology',
    url: 'https://link.springer.com/article/10.1007/BF01326640',
  },
  {
    title: 'Ponte a prueba: recuperar de memoria',
    idea: 'Intentar recordar (autoevaluarse) produce más retención a largo plazo que volver a estudiar el mismo tiempo, aunque a los 5 minutos parezca lo contrario.',
    inApp: 'El modo Repasar convierte cada clave de Cornell en una pregunta: la respondes y luego destapas para comprobar.',
    source: 'Roediger, H. L. & Karpicke, J. D. (2006). Psychological Science, 17(3)',
    url: 'https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01693.x',
  },
  {
    title: 'Repasa espaciado, no todo la noche anterior',
    idea: 'Un metaanálisis de 317 experimentos muestra que distribuir el estudio en sesiones separadas supera al estudio concentrado, y que el mejor intervalo crece cuanto más lejos está el examen.',
    inApp: 'Cada hoja programa repasos a 1, 3, 7, 16, 35 y 90 días. En Inicio aparece "Para repasar hoy".',
    source: 'Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T. & Rohrer, D. (2006). Psychological Bulletin, 132(3)',
    url: 'https://www.yorku.ca/ncepeda/publications/CPVWR2006.html',
  },
  {
    title: 'Subrayar y releer ayudan poco por sí solos',
    idea: 'Al evaluar diez técnicas de estudio, la autoevaluación y la práctica distribuida obtuvieron utilidad alta; subrayar y releer, utilidad baja.',
    inApp: 'El marcatextos existe, pero la app empuja hacia claves, resumen y repaso activo en lugar de solo resaltar.',
    source: 'Dunlosky, J. et al. (2013). Psychological Science in the Public Interest, 14(1)',
    url: 'https://journals.sagepub.com/doi/abs/10.1177/1529100612453266',
  },
  {
    title: 'Pon juntas la palabra y la imagen',
    idea: 'Se aprende mejor cuando el texto está cerca del gráfico al que se refiere (contigüidad espacial) y cuando hay señales que marcan la organización (señalización).',
    inApp: 'Los pentagramas viven dentro de la hoja junto a tu explicación, con los grados/cifrados escritos bajo cada nota; títulos y recuadros (Definición, Regla, Ejemplo) señalan la estructura.',
    source: 'Mayer, R. E. (ed.) — The Cambridge Handbook of Multimedia Learning, caps. 12–13',
    url: 'https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-reducing-extraneous-processing-in-multimedia-learning-coherence-signaling-redundancy-spatial-contiguity-and-temporal-contiguity-principles/CD5B7AE1279A9AB81F8EEBB53DBEC86E',
  },
];

export function MethodGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Cómo tomar apuntes que funcionan" subtitle="Lo que dice la investigación y cómo lo aplica tu cuaderno" width={680}>
      <div className="space-y-4 p-5">
        <div className="rounded-lg bg-accent-soft p-4 text-sm leading-relaxed">
          <b>Rutina recomendada para cada clase:</b>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>
              <b>Durante la clase</b>, escribe en la columna de notas con frases cortas y tus palabras. Usa pentagramas para los ejemplos musicales.
            </li>
            <li>
              <b>El mismo día</b>, rellena la columna de claves con preguntas y escribe el resumen al pie.
            </li>
            <li>
              <b>En los días siguientes</b>, abre "Para repasar hoy", tapa las notas y responde las claves de memoria.
            </li>
          </ol>
        </div>

        {PRINCIPLES.map((p, i) => (
          <article key={p.title} className="rounded-lg border border-line p-4">
            <h3 className="font-semibold">
              {i + 1}. {p.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed">{p.idea}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              <b className="font-medium text-ink">En la app: </b>
              {p.inApp}
            </p>
            <a href={p.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
              {p.source} <ExternalLink size={11} />
            </a>
          </article>
        ))}

        <p className="text-xs text-muted">
          No hay un método único para todo: Cornell va bien en clases teóricas, el esquema en exposiciones muy ordenadas, las tablas para comparar y el papel pautado para dictados. Cambia el diseño de cada hoja cuando quieras.
        </p>
      </div>
    </Modal>
  );
}
