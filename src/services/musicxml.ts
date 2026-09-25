export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';

export interface ScoreNote {
  id: string;
  pitch: string;
  type: 'note' | 'rest';
  duration: number; // en semicorcheas (1 = 16th, 2 = 8th, 4 = quarter, etc.)
  xmlType?: string; // quarter, eighth, half, etc.
  dotted?: boolean;
  ties?: { type: 'start' | 'stop' | 'continue'; number: number }[];
  slurs?: { type: 'start' | 'stop' | 'continue'; number: number }[];
  dynamic?: 'p' | 'mp' | 'mf' | 'f' | 'ff';
  wedges?: ('crescendo' | 'diminuendo' | 'stop')[];
  isChord?: boolean;
  beam1?: 'begin' | 'continue' | 'end';
  beam2?: 'begin' | 'continue' | 'end' | 'forward hook' | 'backward hook';
  /** Texto bajo la nota (grado / cifrado). */
  lyric?: string;
  /** Silencio de compás completo. */
  measureRest?: boolean;
}

export interface ScoreMeasure {
  number: number;
  notes: ScoreNote[];
  clef?: ClefType;
  /** Texto sobre el compás (cifrado americano, p. ej. "Cmaj7"). */
  words?: string;
}

export interface ScorePart {
  id: string;
  name: string;
  clef: ClefType;
  measures: ScoreMeasure[];
}

export interface ScoreData {
  title: string;
  composer: string;
  divisions: number;
  parts: ScorePart[];
  keySignature?: number;
  timeSignature?: { beats: number; beatType: number };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function clefXml(clef: ClefType): string {
  const sign = clef === 'bass' ? 'F' : clef === 'alto' || clef === 'tenor' ? 'C' : 'G';
  const line = clef === 'bass' ? '4' : clef === 'alto' ? '3' : clef === 'tenor' ? '4' : '2';
  return `<clef><sign>${sign}</sign><line>${line}</line></clef>`;
}

export function convertJsonToMusicXML(data: ScoreData): string {
  const { title, composer, divisions, parts, timeSignature } = data;
  const beats = timeSignature?.beats ?? 4;
  const beatType = timeSignature?.beatType ?? 4;

  const scoreParts = parts
    .map((p) => `<score-part id="${p.id}"><part-name print-object="no">${esc(p.name || '')}</part-name></score-part>`)
    .join('');
  const partListXml =
    parts.length > 1
      ? `<part-group type="start" number="1"><group-symbol>brace</group-symbol><group-barline>yes</group-barline></part-group>${scoreParts}<part-group type="stop" number="1"/>`
      : scoreParts;

  const partsXml = parts
    .map((part) => {
      const measuresXml = part.measures
        .map((measure, mIndex) => {
          // ── Agrupación de barras (motor de ArmonIA) ──
          const getBeam1Index = (offset: number) => {
            if (beats === 4 && beatType === 4) return Math.floor(offset / 8);
            if (beats === 2 && beatType === 4) return 0;
            if (beatType === 8 && beats % 3 === 0) return Math.floor(offset / 6);
            return Math.floor(offset / 4);
          };
          const getBeam2Index = (offset: number) => {
            if (beatType === 8 && beats % 3 === 0) return Math.floor(offset / 3);
            return Math.floor(offset / 4);
          };

          let currentOffset = 0;
          const items = measure.notes.map((note) => {
            const res = {
              note,
              beam1Index: getBeam1Index(currentOffset),
              beam2Index: getBeam2Index(currentOffset),
              isGroupable: note.type !== 'rest' && !note.isChord && note.duration < 4,
              beam1: '' as string,
              beam2: '' as string,
            };
            if (!note.isChord) currentOffset += note.duration;
            return res;
          });

          // Las barras se calculan sobre la nota principal de cada acorde.
          const main = items.map((it, i) => ({ it, i })).filter(({ it }) => !it.note.isChord);
          let group1: number[] = [];
          let group2: number[] = [];
          const processGroup1 = () => {
            if (group1.length >= 2) {
              items[group1[0]].beam1 = 'begin';
              for (let k = 1; k < group1.length - 1; k++) items[group1[k]].beam1 = 'continue';
              items[group1[group1.length - 1]].beam1 = 'end';
            }
            group1 = [];
          };
          const processGroup2 = () => {
            if (group2.length >= 2) {
              items[group2[0]].beam2 = 'begin';
              for (let k = 1; k < group2.length - 1; k++) items[group2[k]].beam2 = 'continue';
              items[group2[group2.length - 1]].beam2 = 'end';
            } else if (group2.length === 1) {
              const idx = group2[0];
              const pos = main.findIndex((x) => x.i === idx);
              const prev = pos > 0 ? items[main[pos - 1].i] : null;
              const next = pos < main.length - 1 ? items[main[pos + 1].i] : null;
              const item = items[idx];
              if (item.beam1) {
                if (prev && prev.beam2Index === item.beam2Index && prev.isGroupable) item.beam2 = 'backward hook';
                else if (next && next.beam2Index === item.beam2Index && next.isGroupable) item.beam2 = 'forward hook';
              }
            }
            group2 = [];
          };
          main.forEach(({ it, i }) => {
            if (it.isGroupable) {
              if (group1.length === 0 || items[group1[0]].beam1Index === it.beam1Index) group1.push(i);
              else {
                processGroup1();
                group1.push(i);
              }
              if (it.note.duration <= 1.5) {
                if (group2.length === 0 || items[group2[0]].beam2Index === it.beam2Index) group2.push(i);
                else {
                  processGroup2();
                  group2.push(i);
                }
              } else processGroup2();
            } else {
              processGroup1();
              processGroup2();
            }
          });
          processGroup1();
          processGroup2();
          // Copiar las barras a los miembros del acorde
          items.forEach((it, i) => {
            if (!it.note.isChord) return;
            for (let k = i - 1; k >= 0; k--) {
              if (!items[k].note.isChord) {
                it.beam1 = items[k].beam1;
                it.beam2 = items[k].beam2;
                break;
              }
            }
          });

          let notesXml = measure.words
            ? `<direction placement="above"><direction-type><words font-weight="bold">${esc(measure.words)}</words></direction-type></direction>`
            : '';

          items.forEach(({ note, beam1, beam2 }) => {
            let directionXml = '';
            if (note.dynamic)
              directionXml += `<direction placement="below"><direction-type><dynamics><${note.dynamic}/></dynamics></direction-type></direction>`;
            if (note.wedges && note.wedges.length > 0) {
              [...note.wedges]
                .sort((a) => (a === 'stop' ? -1 : 1))
                .forEach((w) => {
                  directionXml += `<direction placement="below"><direction-type><wedge type="${w}"/></direction-type></direction>`;
                });
            }
            const lyricXml = note.lyric
              ? `<lyric number="1" placement="below"><syllabic>single</syllabic><text>${esc(note.lyric)}</text></lyric>`
              : '';

            if (note.type === 'rest') {
              if (note.measureRest) {
                notesXml += `<note><rest measure="yes"/><duration>${note.duration}</duration></note>`;
              } else {
                notesXml += `${directionXml}<note><rest/><duration>${note.duration}</duration><type>${note.xmlType || 'quarter'}</type>${note.dotted ? '<dot/>' : ''}${lyricXml}</note>`;
              }
              return;
            }

            const step = note.pitch.charAt(0);
            const alterChar = note.pitch.length === 3 ? note.pitch.charAt(1) : '';
            const octave = note.pitch.charAt(note.pitch.length - 1);
            const alterVal = alterChar === '#' ? '1' : alterChar === 'b' ? '-1' : '';
            const notationTags: string[] = [];
            let tieXml = '';
            note.ties?.forEach((t) => {
              tieXml += `<tie type="${t.type}"/>`;
              notationTags.push(`<tied type="${t.type}"${t.number ? ` number="${t.number}"` : ''}/>`);
            });
            note.slurs?.forEach((s) => notationTags.push(`<slur type="${s.type}" number="${s.number || 1}" placement="above"/>`));
            const notationsXml = notationTags.length ? `<notations>${notationTags.join('')}</notations>` : '';

            notesXml += `${directionXml}<note>${note.isChord ? '<chord/>' : ''}<pitch><step>${step}</step>${alterVal ? `<alter>${alterVal}</alter>` : ''}<octave>${octave}</octave></pitch><duration>${note.duration}</duration>${tieXml}<type>${note.xmlType || 'quarter'}</type>${note.dotted ? '<dot/>' : ''}${beam1 ? `<beam number="1">${beam1}</beam>` : ''}${beam2 ? `<beam number="2">${beam2}</beam>` : ''}${notationsXml}${lyricXml}</note>`;
          });

          let attributesXml = '';
          if (mIndex === 0) {
            attributesXml = `<attributes><divisions>${divisions}</divisions><key><fifths>${data.keySignature || 0}</fifths></key><time><beats>${beats}</beats><beat-type>${beatType}</beat-type></time>${clefXml(part.clef)}</attributes>`;
          } else if (measure.clef) {
            attributesXml = `<attributes>${clefXml(measure.clef)}</attributes>`;
          }

          const barlineXml =
            mIndex === part.measures.length - 1 ? '<barline location="right"><bar-style>light-heavy</bar-style></barline>' : '';

          return `<measure number="${measure.number}">${attributesXml}${notesXml}${barlineXml}</measure>`;
        })
        .join('');
      return `<part id="${part.id}">${measuresXml}</part>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${esc(title)}</work-title></work>
  <identification><creator type="composer">${esc(composer)}</creator></identification>
  <part-list>${partListXml}</part-list>
  ${partsXml}
</score-partwise>`;
}
