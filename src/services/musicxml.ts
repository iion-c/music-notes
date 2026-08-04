export type NoteDuration = '1' | '2' | '4' | '8' | '16';
export type ClefType = 'treble' | 'bass' | 'alto' | 'tenor';

export interface ScoreNote {
  id: string;
  pitch: string;
  type: 'note' | 'rest';
  duration: number; // en semicorcheas (1 = 16th, 2 = 8th, 4 = quarter, etc.)
  xmlType?: string; // quarter, eighth, half, etc.
  dotted?: boolean;
  ties?: { type: 'start' | 'stop' | 'continue', number: number }[];
  slurs?: { type: 'start' | 'stop' | 'continue', number: number }[];
  dynamic?: 'p' | 'mp' | 'mf' | 'f' | 'ff';
  wedges?: ('crescendo' | 'diminuendo' | 'stop')[];
  isChord?: boolean;
  beam1?: 'begin' | 'continue' | 'end';
  beam2?: 'begin' | 'continue' | 'end' | 'forward hook' | 'backward hook';
}

export interface ScoreMeasure {
  number: number;
  notes: ScoreNote[];
  clef?: ClefType;
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
  timeSignature?: { beats: number, beatType: number };
}

export const INITIAL_SCORE: ScoreData = {
  title: "Nueva Partitura",
  composer: "ArmonIA",
  divisions: 4,
  parts: [
    {
      id: 'P1',
      name: 'Piano',
      clef: 'treble',
      measures: [
        { number: 1, notes: [{ id: 'm1-rest', pitch: 'R', type: 'rest', duration: 16, xmlType: 'whole', wedges: [] }] }
      ]
    }
  ],
  keySignature: 0,
  timeSignature: { beats: 4, beatType: 4 },
};

export function convertJsonToMusicXML(data: ScoreData): string {
  const { title, composer, divisions, parts, keySignature, timeSignature } = data;

  const partListXml = parts.map(p => `
    <score-part id="${p.id}">
      <part-name print-object="no">${p.name || ''}</part-name>
    </score-part>`).join('');

  const partsXml = parts.map(part => {
    const measuresXml = part.measures.map((measure, mIndex) => {
      const beats = timeSignature?.beats ?? 4;
      const beatType = timeSignature?.beatType ?? 4;

      const getBeam1Index = (offset: number) => {
        if (beats === 4 && beatType === 4) return Math.floor(offset / 8);
        if (beats === 2 && beatType === 4) return 0;
        if (beats === 6 && beatType === 8) return Math.floor(offset / 6);
        return Math.floor(offset / 4);
      };

      const getBeam2Index = (offset: number) => {
        if (beats === 6 && beatType === 8) return Math.floor(offset / 3);
        return Math.floor(offset / 4);
      };

      let currentOffset = 0;
      const notesWithBeams = measure.notes.map(note => {
        const beam1Index = getBeam1Index(currentOffset);
        const beam2Index = getBeam2Index(currentOffset);
        const isGroupable = note.type !== 'rest' && note.duration < 4;
        const res = { note, beam1Index, beam2Index, isGroupable, beam1: '', beam2: '' };
        if (!note.isChord) {
          currentOffset += note.duration;
        }
        return res;
      });

      let currentGroup1: number[] = [];
      let currentGroup2: number[] = [];

      const processGroup1 = () => {
        if (currentGroup1.length >= 2) {
          notesWithBeams[currentGroup1[0]].beam1 = 'begin';
          for (let i = 1; i < currentGroup1.length - 1; i++) notesWithBeams[currentGroup1[i]].beam1 = 'continue';
          notesWithBeams[currentGroup1[currentGroup1.length - 1]].beam1 = 'end';
        }
        currentGroup1 = [];
      };

      const processGroup2 = () => {
        if (currentGroup2.length >= 2) {
          notesWithBeams[currentGroup2[0]].beam2 = 'begin';
          for (let i = 1; i < currentGroup2.length - 1; i++) notesWithBeams[currentGroup2[i]].beam2 = 'continue';
          notesWithBeams[currentGroup2[currentGroup2.length - 1]].beam2 = 'end';
        } else if (currentGroup2.length === 1) {
          const idx = currentGroup2[0];
          const item = notesWithBeams[idx];
          const prev = idx > 0 ? notesWithBeams[idx - 1] : null;
          const next = idx < notesWithBeams.length - 1 ? notesWithBeams[idx + 1] : null;
          if (prev && prev.beam2Index === item.beam2Index && prev.isGroupable) item.beam2 = 'backward hook';
          else if (next && next.beam2Index === item.beam2Index && next.isGroupable) item.beam2 = 'forward hook';
        }
        currentGroup2 = [];
      };

      notesWithBeams.forEach((item, i) => {
        if (item.isGroupable) {
          if (currentGroup1.length === 0 || notesWithBeams[currentGroup1[0]].beam1Index === item.beam1Index) currentGroup1.push(i);
          else { processGroup1(); currentGroup1.push(i); }
          if (item.note.duration === 1) {
            if (currentGroup2.length === 0 || notesWithBeams[currentGroup2[0]].beam2Index === item.beam2Index) currentGroup2.push(i);
            else { processGroup2(); currentGroup2.push(i); }
          } else processGroup2();
        } else { processGroup1(); processGroup2(); }
      });
      processGroup1(); processGroup2();

      let notesXml = '';
      notesWithBeams.forEach(({ note, beam1, beam2 }) => {
        let directionXml = '';
        if (note.dynamic) directionXml += `<direction placement="below"><direction-type><dynamics><${note.dynamic}/></dynamics></direction-type></direction>\n`;
        if (note.wedges && note.wedges.length > 0) {
          [...note.wedges].sort((a,b) => a === 'stop' ? -1 : 1).forEach(w => {
            directionXml += `<direction placement="below"><direction-type><wedge type="${w}"/></direction-type></direction>\n`;
          });
        }

        if (note.type === 'rest') {
          notesXml += `
          ${directionXml}
          <note><rest/><duration>${note.duration}</duration><type>${note.xmlType || 'quarter'}</type>${note.dotted ? '<dot/>' : ''}</note>`;
        } else {
          const step = note.pitch.charAt(0);
          const alterChar = note.pitch.length === 3 ? note.pitch.charAt(1) : '';
          const octave = note.pitch.charAt(note.pitch.length - 1);
          const alterVal = alterChar === '#' ? '1' : alterChar === 'b' ? '-1' : '0';
          let tieXml = '';
          let notationsXml = '';
          const notationTags: string[] = [];
          
          if (note.ties && note.ties.length > 0) {
            note.ties.forEach(t => {
              tieXml += `<tie type="${t.type}"/>`;
              notationTags.push(`<tied type="${t.type}" ${t.number ? `number="${t.number}"` : ''}/>`);
            });
          }

          if (note.slurs && note.slurs.length > 0) {
            note.slurs.forEach(s => {
              notationTags.push(`<slur type="${s.type}" number="${s.number || 1}" placement="above"/>`);
            });
          }

          if (notationTags.length > 0) {
            notationsXml = `<notations>${notationTags.join('')}</notations>`;
          }
          
          notesXml += `
          ${directionXml}
          <note>
            ${note.isChord ? '<chord/>' : ''}
            <pitch><step>${step}</step>${alterChar ? `<alter>${alterVal}</alter>` : ''}<octave>${octave}</octave></pitch>
            <duration>${note.duration}</duration><type>${note.xmlType || 'quarter'}</type>${note.dotted ? '<dot/>' : ''}
            ${tieXml}${notationsXml}
            ${note.beam1 ? `<beam number="1">${note.beam1}</beam>` : ''}
            ${note.beam2 ? `<beam number="2">${note.beam2}</beam>` : ''}
          </note>`;
        }
      });

      let attributesXml = '';
      if (measure.number === 1) {
        const cSign = part.clef === 'bass' ? 'F' : (part.clef === 'alto' || part.clef === 'tenor') ? 'C' : 'G';
        const cLine = part.clef === 'bass' ? '4' : part.clef === 'alto' ? '3' : part.clef === 'tenor' ? '4' : '2';
        attributesXml = `
          <attributes>
            <divisions>${divisions}</divisions>
            <key><fifths>${data.keySignature || 0}</fifths></key>
            <time><beats>${data.timeSignature?.beats || 4}</beats><beat-type>${data.timeSignature?.beatType || 4}</beat-type></time>
            <clef><sign>${cSign}</sign><line>${cLine}</line></clef>
          </attributes>`;
      } else if (measure.clef) {
        const cSign = measure.clef === 'bass' ? 'F' : (measure.clef === 'alto' || measure.clef === 'tenor') ? 'C' : 'G';
        const cLine = measure.clef === 'bass' ? '4' : measure.clef === 'alto' ? '3' : measure.clef === 'tenor' ? '4' : '2';
        attributesXml = `<attributes><clef><sign>${cSign}</sign><line>${cLine}</line></clef></attributes>`;
      }

      let barlineXml = '';
      if (mIndex === part.measures.length - 1) {
        barlineXml = '\n          <barline location="right"><bar-style>light-heavy</bar-style></barline>';
      }

      return `<measure number="${measure.number}">${attributesXml}${notesXml}${barlineXml}</measure>`;
    }).join('');

    return `<part id="${part.id}">${measuresXml}</part>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work><work-title>${title}</work-title></work>
  <identification><creator type="composer">${composer}</creator></identification>
  <part-list>${partListXml}</part-list>
  ${partsXml}
</score-partwise>`;
}
