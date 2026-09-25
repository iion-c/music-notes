# Music Notes

Cuaderno digital para tomar apuntes de música en la universidad. Cada hoja se ve y se comporta como papel real —renglones, margen, letra manuscrita, tinta— y admite pentagramas que se escriben con el lápiz del motor **ArmonIA**.

El diseño se basa en investigación sobre toma de apuntes y aprendizaje (método Cornell de Walter Pauk, Mueller & Oppenheimer 2014, Kiewra 1989, Roediger & Karpicke 2006, Cepeda et al. 2006, Dunlosky et al. 2013, Mayer). Las fuentes y cómo se aplican están en [docs/INVESTIGACION.md](docs/INVESTIGACION.md).

## Qué incluye

**Organización**
- Cuadernos por asignatura (profesor, semestre, horario, color de tapa).
- Hojas agrupadas por *unidad*, como los separadores de una carpeta.
- Búsqueda en todo el contenido (Ctrl+K), favoritas, duplicar hojas.

**La hoja**
- Diseños **Cornell** (claves, notas y resumen), **Esquema** (sangrías) y **Libre**.
- Plantillas: clase Cornell, ejercicio de armonía (sistema de piano), dictado/solfeo (papel pautado), análisis de obra, esquema, tabla comparativa, bitácora de estudio y hoja libre.
- Bloques: texto, títulos, recuadros (definición, regla, ejemplo, importante, pregunta, excepción), lista de tareas, tabla, imagen (pegar o foto de la pizarra), dibujo a mano y pentagrama. Escribe `/` en una línea vacía para insertar cualquiera.
- Texto con formato ligero: `**negrita**`, `*cursiva*`, `==resaltado==`, viñetas `- `, listas `1. `, y atajos musicales `(#)` → ♯, `(b)` → ♭, `(n)` → ♮, `->` → →.
- Marcatextos por bloque, sangría (Tab / Shift+Tab), mover, duplicar.

**Personalización** (por hoja, por cuaderno o global)
- Papel: rayado, cuadriculado, punteado, pautado o liso; blanco, marfil, reciclado o nocturno.
- Letra: manuscrita, script legible, libro (serif) o moderna; seis tintas.
- Tamaño de letra, interlineado, ancho de la columna de claves, línea de margen.
- Tema claro/oscuro de la interfaz, tamaño de hoja (Carta, A4, ancha).

**Pentagramas (motor ArmonIA)**
- Pentagrama simple (Sol, Fa, Do en 3ª o 4ª) o **sistema de piano** para armonía a 4 voces.
- Lápiz: arrastra sobre el pentagrama y suelta para escribir la nota (algoritmo `pitchFromUnitY` de ArmonIA, con lupa y guía).
- Teclado Do–Si, figuras, puntillo, alteraciones, octava, **acordes** y silencios. Relleno secuencial de compases con silencios automáticos.
- La armadura se aplica sola (en Sol M, Fa suena Fa♯); ♮ la anula.
- Modo seleccionar: cambia la figura, borra o escribe el **grado / cifrado bajo la nota** (V7, I6/4…).
- Deshacer/rehacer, zoom, reproducción de audio, exportar PNG/SVG, mostrar un rango de compases en la hoja.

**Estudio**
- Modo **Repasar**: tapa las notas para responder las claves de memoria.
- Repaso espaciado automático (1, 3, 7, 16, 35 y 90 días) con la sección *Para repasar hoy*.

**Datos**
- Sin sesión: se guarda en el navegador. Con cuenta (correo, Google o invitado): Firestore con caché sin conexión.
- Exportar/importar copia completa (JSON) e imprimir o guardar como PDF solo el papel.

### Atajos del editor de pentagramas

| Tecla | Acción |
| --- | --- |
| 1 – 5 | Semicorchea, corchea, negra, blanca, redonda |
| . | Puntillo |
| # / B / N | Sostenido / bemol / becuadro |
| A | Modo acorde |
| R | Silencio |
| ↑ ↓ | Octava |
| Retroceso | Borrar nota (seleccionada o la última) |
| Ctrl+Z / Ctrl+Y | Deshacer / rehacer |
| P / S | Lápiz / seleccionar |

## Desarrollo

```bash
npm install
npm run dev        # servidor local
npm run typecheck  # comprobación de tipos
npm run build      # compilación de producción en dist/
```

Stack: React 19, TypeScript, Vite, Tailwind CSS, Firebase (Auth + Firestore), OpenSheetMusicDisplay (en un iframe), Web Audio.

```
src/
  App.tsx                 estructura general y diálogos
  store.tsx               estado, guardado local y sincronización con la nube
  lib/                    papel, plantillas, repaso, markdown, motor musical (score.ts)
  services/               Firebase, MusicXML, audio, plantillas del iframe OSMD
  components/
    page/                 la hoja de papel, bloques y personalización
    stave/                editor ArmonIA y vista previa de partituras
    library/              inicio, cuadernos y miniaturas
    shell/ modals/ auth/ onboarding/ ui/
docs/INVESTIGACION.md     fuentes y decisiones de diseño
```

Despliegue: el proyecto incluye `vercel.json` para servir la SPA.
