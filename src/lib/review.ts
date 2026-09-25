/**
 * Repaso espaciado.
 * - Roediger & Karpicke (2006): recuperar de memoria (autoevaluarse) retiene más que releer.
 * - Cepeda et al. (2006): repasos distribuidos, con intervalos que crecen, superan al repaso masivo.
 * - Pauk (Cornell): repasar las notas poco después de la clase y luego de forma periódica.
 */
import type { NotePage, ReviewState } from '../types/notes';

const DAY = 24 * 60 * 60 * 1000;
/** Días hasta el siguiente repaso según cuántos se han completado. */
export const REVIEW_INTERVALS = [1, 3, 7, 16, 35, 90];

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function initialReview(createdAt: number): ReviewState {
  return { stage: 0, nextReview: startOfDay(createdAt) + DAY };
}

export function completeReview(page: NotePage, now = Date.now()): ReviewState {
  const stage = (page.review?.stage || 0) + 1;
  const days = REVIEW_INTERVALS[Math.min(stage, REVIEW_INTERVALS.length - 1)];
  return { stage, lastReviewed: now, nextReview: startOfDay(now) + days * DAY };
}

export function isDue(page: NotePage, now = Date.now()): boolean {
  const next = page.review?.nextReview;
  return next !== undefined && next <= now && pageHasContent(page);
}

export function pageHasContent(page: NotePage): boolean {
  return page.blocks.some((b) => {
    switch (b.type) {
      case 'text':
      case 'callout':
        return b.content.trim().length > 0;
      case 'heading':
        return b.text.trim().length > 0;
      case 'stave':
        return b.data.measures.some((m) => m.notes.some((n) => !n.auto));
      case 'sketch':
        return b.strokes.length > 0;
      case 'image':
        return !!b.src;
      default:
        return true;
    }
  });
}

export function reviewLabel(page: NotePage, now = Date.now()): string {
  const next = page.review?.nextReview;
  if (!next) return '';
  const diff = Math.round((startOfDay(next) - startOfDay(now)) / DAY);
  if (diff < 0) return `Repaso atrasado ${-diff} d`;
  if (diff === 0) return 'Repasar hoy';
  if (diff === 1) return 'Repasar mañana';
  return `Repaso en ${diff} días`;
}
