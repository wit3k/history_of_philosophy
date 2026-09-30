# Migracja SVG → PixiJS — przewodnik techniczny

Uzupełnienie do `SPEC.md` i `PIXI_REBUILD_PROMPT.md`. Opisuje konkretne mapowanie obecnego renderu SVG na PixiJS oraz pułapki.

---

## 1. Co zostaje, co się zmienia

| Warstwa | Dziś | Po migracji |
|---------|------|-------------|
| Diagram osi czasu | React → SVG DOM | PixiJS canvas (`Application`) |
| Menu / toggles / filtry | React + Tailwind + Sass | **bez zmian** (HTML overlay) |
| Modale szczegółów | React HTML | **bez zmian** |
| Dane + packing wierszy | TS services | **bez zmian** |
| Kolory | `ColorsService` | **bez zmian** |
| Importer NocoDB | `bun run import` | **bez zmian** |

---

## 2. Mapowanie prymitywów SVG → PixiJS

| SVG | PixiJS v8 |
|-----|-----------|
| `<g>` | `Container` |
| `<rect>` | `Graphics.rect(...).fill().stroke()` (lub `roundRect`) |
| `<circle>` | `Graphics.circle(...).fill().stroke()` |
| `<line>` | `Graphics.moveTo/lineTo.stroke()` |
| `<path d="...">` | `Graphics` + komendy path / `GraphicsPath`, albo parsuje wynik `roundPathCorners` |
| `<text>` / `<tspan>` | `Text` / `BitmapText` (mono); wieloliniowe = kilka `Text` lub `\n` |
| `<image href>` | `Sprite` z `Assets.load(url)` |
| CSS `:hover` + `.tooltip` | ręczne `pointerover` / `pointerout` + `visible` |
| CSS `@keyframes` dash | ticker: aktualizuj `strokeDashOffset` / rysuj dashed stroke ręcznie |
| `writing-mode: sideways-lr` | `Text` z `angle = -90` lub `Math.PI/2` + pivot (dostroić do oryginału) |

### Hit testing

SVG polega na DOM events na elementach. W Pixi:

- `eventMode = 'static'` na interaktywnych obiektach,
- `cursor = 'pointer'`,
- na tle pada: pełnoekranowy przezroczysty `Graphics` z `eventMode='static'` → czyści highlighty,
- `on('pointerdown'|'pointermove'|'pointerup'|'pointerupoutside')` na stage dla pan,
- wheel na `canvas` / `window`.

Uwaga: publikacje i wydarzenia osobiste używają `stopPropagation` przy mousedown/click, żeby nie startować panu — w Pixi: `e.stopPropagation()` w handlerze markera.

---

## 3. Kamera: dwa poprawne podejścia

### A) Świat w „roku × wierszu”, transform na kontenerze

```
world.scale.set(zoom, 1)
world.x = -viewPosition.x * zoom
world.y = viewPosition.y
```

Dzieci mają lokalne `x = year`, `y = row * 45`.  
**Uwaga:** linie roku i etykiety też muszą być w tym układzie; stroke widths skalują się z `scale.x` — zwykle **niepożądane** (grubość linii rośnie przy zoomie). SVG w oryginale liczy piksele ekranowe (`positionByYear`), więc strokeWidth jest stały w px ekranu.

### B) (zalecane) Przeliczanie do przestrzeni ekranu jak w SVG

Przy każdej zmianie `viewPosition`/`zoom` ustaw:

```
node.x = (year - viewPosition.x) * zoom
```

Stroke widths, font sizes, boxSize=35 pozostają stałe w px — **1:1 z obecnym SVG**.

Dla wydajności: aktualizuj tylko widoczne obiekty / dirty flag; nie niszcz i twórz sceny od zera przy każdym frame.

---

## 4. Ścieżki relacji (najtrudniejszy fragment)

### PersonReference

1. Zbuduj 4 punkty jak w `PersonReferenceNode.tsx` (`hdir`/`vdir`, offsety od `boxSize`).
2. Zrób SVG path string `M ... L ... L ...`.
3. Przepuść przez `roundPathCorners(path, 15, false)`.
4. W Pixi: narysuj wynikowy path przez **bridge komend** `M`/`L`/`C` → `moveTo` / `lineTo` / `bezierCurveTo` (własny kod lub lekki parser path-data). To nadal nie jest DOM SVG — tylko format pośredni z `roundPathCorners`.

Highlight:

- highlighted → grubszy stroke (5), dash array ~`[1,5]`, animuj offset,
- inny highlight aktywny → opacity 0.1,
- brak highlightu → opacity 1, bez animacji.

### PublicationReference

Analogicznie, radius **5**, opacity bazowa **0.7**, dash highlight `[20,3]`.  
Skopiuj dokładnie formuły `shrinkFactor`, `distanceFromFactor`, `distanceToFactor`, `cos05=0.877`.

Funkcję `roundPathCorners` można zostawić jako wspólny util (już jest w `src/geometry/PathRounding.tsx`).

### Dashed strokes w Pixi (blocker wizualny)

Pixi `Graphics` nie implementuje CSS `stroke-dasharray` 1:1. Opcje:

1. Własne rysowanie segmentów dash wzdłuż spłaszczonej krzywej,
2. `pixi-dashed-line` / podobny helper,
3. Shader / maska.

Bez tego **highlight relacji i linia bieżącego roku** nie będą wyglądać jak oryginał. Traktuj to jako wymaganie MVP, nie polish.

Ustaw też `cap = 'butt'`, `join = 'miter'` — defaulty Pixi (często round) pogrubiają końce markerów publikacji (`strokeWidth: 10`).

---

## 5. Tooltipy

Oryginał: CSS `g:has(.tooltipHover:hover) .tooltip { display: inline }`.

W Pixi:

1. Kontener tooltipa `visible=false` domyślnie.
2. Na markerze `pointerover` → `tooltip.visible=true`, `pointerout` → false.
3. Pozycjonowanie jak w SVG (np. publikacja: rect `x = position-100`, `y = row + boxSize/2`, width 220).

Alternatywa HTML: absolutnie pozycjonowany div nad canvas — łatwiejszy wrap tekstu, ale trzeba sync pozycji z kamerą.

Zawijanie tytułu publikacji — ten sam reduce po słowach (`maxLettersColumns=25`, `maxLettersRows=3`).

---

## 6. Tekst pionowy (HistoryEvent)

Oryginał: `writingMode: 'sideways-lr'`, `textOrientation: 'sideways'`.

W Pixi najbliższy efekt:

```ts
const label = new Text({ text: name, style: { fontFamily: 'monospace', fontSize: 14, fill: 0x000000 } })
label.rotation = -Math.PI / 2
// ustaw pivot/pozycję tak, by tekst leżał w „header” rect jak w SVG
```

Zweryfikuj wizualnie względem live page — drobne różnice pivotu są typowe; dociągnij offsety.

---

## 7. Integracja z React

Szkic:

```tsx
function PixiTimelineStage(props: TimelineProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    let destroyed = false
    ;(async () => {
      const app = new Application()
      await app.init({
        resizeTo: hostRef.current!,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      if (destroyed) { app.destroy(true); return }
      hostRef.current!.appendChild(app.canvas)
      appRef.current = app
      // build scene, bind events...
    })()
    return () => {
      destroyed = true
      appRef.current?.destroy(true)
      appRef.current = null
    }
  }, [])

  // sync props (people, zoom, highlights, darkMode...) → scene via imperative API / store
  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
}
```

Stan aplikacji (filtry, modale) zostaje w `Chronology` jak dziś; Pixi dostaje props / callbacki (`onPersonClick`, `onPublicationClick`, …).

Tło dark/light trzymaj na **HTML wrapperze** (jak teraz), canvas z `backgroundAlpha: 0`.

---

## 8. Zależności i decyzje stacku

Pełna tabela: **SPEC.md §16**.

```bash
bun add pixi.js @pixi/react
# opcjonalnie: bun add svg-pathdata   # bridge M/L/C → Graphics
```

| Decyzja | |
|---------|--|
| Integracja React | **`@pixi/react`** — deklaratywny port węzłów |
| Kamera | **własna** (formuły z `Chronology.tsx`); **nie** `pixi-viewport` |
| Dash | **własny util** (segmenty / gist v8); nie polegać na `pixi-dashed-line` |
| Path po `roundPathCorners` | bridge komend path data → `Graphics` (parser path-data OK; to nie jest render SVG) |
| Tooltipy | **HTML overlay** preferowane |
| Menu / modale | React + Tailwind jak dziś |
| Perf (rbush/cull) | dopiero po parity |

React 19 + Rsbuild mogą zostać. CSS `.tooltip` / `.animated-dash` odpada na rzecz logiki Pixi (+ HTML tooltipów).

---

## 9. Checklist implementacyjna (kolejność prac)

1. Pusty Pixi stage (`resolution: dpr`, `autoDensity`) + pan/zoom/pinch (**osobne** formuły) + year lines/labels + current-year dash.
2. HistoryEvents (recty + pas 20000 + pionowy tekst; heurystyka `name.length*8`).
3. People (paski + sprite **35×35 z assetu 30×30** + truncate `*8`) + hover highlight + click → modal.
4. PersonReferences + `roundPathCorners` + highlight/dim/animacja dash.
5. Publications + tooltips (letter-wrap) + modal; stroke cap butt.
6. PublicationReferences + magic constants + highlight dash.
7. PersonHistoryEvents + tooltips + modal.
8. Podpięcie toggle’ów Menu (show/hide kontenerów); z-index HTML nad canvas.
9. Filtry kolekcji (rebuild list + rowNumbers → odśwież scenę).
10. Dark mode na history-event bands.
11. Porównanie screenshotów z live (SPEC §15.17).

Pełna lista pułapek: **SPEC.md §15**.

---

## 10. Pliki źródłowe „must-read” przed kodowaniem

```
src/components/chronology/Chronology.tsx
src/components/person/PersonNode.tsx
src/components/personReference/PersonReferenceNode.tsx
src/components/publication/PublicationNode.tsx
src/components/publicationReference/PublicationReferenceNode.tsx
src/components/historyEvents/HistoryEventNode.tsx
src/components/personHistoryEvents/PersonHistoryEventNode.tsx
src/geometry/PathRounding.tsx
src/services/Colors.ts
src/data/db/PeopleListService.tsx
SPEC.md
```
)
