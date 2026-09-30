# History of Philosophy — Specyfikacja aplikacji

Dokument opisuje **zachowanie, wygląd i logikę** aplikacji `chronology_presenter` na poziomie niezależnym od technologii renderowania. Służy do odwzorowania identycznego produktu w innym stacku (np. PixiJS zamiast SVG).

Żywa wersja referencyjna: https://wit3k.github.io/history_of_philosophy/

---

## 1. Cel produktu

Interaktywna, pełnoekranowa **oś czasu historii filozofii**. Oś X = lata, oś Y = wiersze osób / wydarzeń. Użytkownik:

- przesuwa i zoomuje diagram,
- włącza/wyłącza warstwy (autorzy, publikacje, relacje, wydarzenia),
- filtruje dane po kolekcjach tematycznych,
- klika elementy, aby otworzyć modale ze szczegółami (osoba, publikacja, lokalizacja, wydarzenie osobiste).

UI tekstowy jest po **polsku**.

---

## 2. Architektura wysokopoziomowa

```
┌─────────────────────────────────────────────────────────────┐
│  Viewport (pełne okno, overflow:hidden)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  WARSTWA DIAGRAMU (dziś: <svg>, docelowo: PixiJS canvas)││
│  │  - tło roku / linie skali                                ││
│  │  - wydarzenia historyczne, osoby, publikacje, relacje    ││
│  │  - etykiety lat na dole                                  ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌──────────────┐  ┌───────────────────────────────────────┐│
│  │ Menu (HTML)  │  │ Modale szczegółów (HTML overlay)      ││
│  │ ustawienia + │  │ Person / Publication / Location /     ││
│  │ filtry       │  │ PersonHistoryEvent                    ││
│  └──────────────┘  └───────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Ważne:** diagram i overlay HTML są rozdzielone. Menu i modale pozostają w DOM (React/HTML/CSS). Tylko **render osi czasu** zmienia się z SVG na PixiJS.

Dane są **statycznie wbudowane** w bundel (pliki `*ListRaw.tsx`). Brak API w runtime. Importer (`bun run import`) pobiera dane z NocoDB i generuje te pliki + assety obrazków — importer nie jest częścią UX aplikacji.

---

## 3. Modele danych

### 3.1 Person (osoba / autor)

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | ID |
| `name` | string | Imię i nazwisko |
| `born` | number | Rok urodzenia |
| `died` | number | Rok śmierci (jeśli żyje → bieżący rok) |
| `stillAlive` | boolean | Czy żyje |
| `bornLocation` | string | ID lokalizacji urodzenia |
| `diedLocation` | string | ID lokalizacji śmierci |
| `nationality` | string \| null | Narodowość (klucz koloru akcentu) |
| `rowNumber` | number | Wiersz Y (wyliczany layoutem) |
| `thumbnail` | string \| null | Plik miniatury |
| `category` | string \| null | Kategoria (obecnie nieużywana w layoutie) |

### 3.2 Publication

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | |
| `title` | string | |
| `publicationDate` | number | Rok publikacji (= pozycja X) |
| `publicationLocation` | number | ID lokalizacji |
| `authorId` | string | ID autora |
| `isbn?` | string | |
| `description?` | string | |
| `thumbnail?` | string | Okładka |

### 3.3 HistoryEvent (wydarzenie historyczne „światowe”)

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | |
| `name` | string | Nazwa (rysowana pionowo) |
| `yearFrom` / `yearTo` | number | Zakres lat |
| `rowNumber` | number | Wiersz (wyliczany: packing bez nakładania się w czasie) |

### 3.4 PersonHistoryEvent (wydarzenie w życiu osoby)

| Pole | Typ | Opis |
|------|-----|------|
| `id` | string | |
| `name` | string | |
| `type` | string | Typ (np. studia) |
| `personId` | string | Autor |
| `locationId` | number \| null | |
| `yearFrom` / `yearTo` | number \| null | Instant gdy `yearTo == null` lub równe `yearFrom` |

### 3.5 PersonReference (relacja między osobami — „sympatie”)

| Pole | Typ | Opis |
|------|-----|------|
| `id`, `name` | string | |
| `attitude` | Positive \| Neutral \| Negative | Kolor linii |
| `from`, `to` | string | ID osób |

### 3.6 PublicationReference (odniesienie między publikacjami)

| Pole | Typ | Opis |
|------|-----|------|
| `id`, `name` | string | |
| `from`, `to` | number | ID publikacji |

### 3.7 Location

| Pole | Typ | Opis |
|------|-----|------|
| `id`, `name` | string | |
| `coordinates` | {x, y} | lat/lon (OpenStreetMap) |
| `picture` | string \| null | |

### 3.8 Collection (filtr tematyczny)

| Pole | Typ | Opis |
|------|-----|------|
| `id`, `name` | string | |
| `includedPeople/Locations/Events/Publications/References/PeopleRelations` | number[] | ID elementów w kolekcji |
| `isActive` | boolean | Czy filtr włączony |

Specjalna kolekcja `id: "0"`, nazwa `:: Nieprzypisane ::`: gdy aktywna, działa jak white-list — pokazuje też elementy **nieprzypisane do żadnej kolekcji**.

---

## 4. Layout i układ wierszy

### 4.1 Osoby (`PeopleListService.withRowNumbers`)

1. Sortuj osoby rosnąco po długości życia (`died - born`).
2. Grupuj po `nationality` (kolejność flatMap z mapy grup).
3. Packing do wierszy w jednym bloku: osoba trafia do istniejącego wiersza, jeśli jej zakres lat **nie nachodzi** na zakresy osób już w wierszu; inaczej nowy wiersz.
4. `rowNumber` = indeks wiersza + offset bloku (start od 1).

### 4.2 Wydarzenia historyczne

Greedy packing: pierwsza wolna „półka”, na której `rowEnds[i] < yearFrom`; inaczej nowy wiersz. `rowNumber` od 0 w górę.

---

## 5. Układ współrzędnych diagramu

Stałe:

| Stała | Wartość |
|-------|---------|
| `rowHeight` (osoby) | 45 |
| `yearLabelWidth` | 100 |
| `yearSelection.from` | -1200 |
| `yearSelection.to` | 2101 |
| początkowy `viewPosition` | `{ x: 1588, y: 0 }` |
| początkowy `zoom` | 10 |

Transformacje:

```
positionByYear(year) = (year - viewPosition.x) * zoom

rowPosition(rowNumber) = rowHeight * rowNumber + viewPosition.y
                       // osoby, publikacje, relacje, wydarzenia osobiste

historyEventRowPosition(rowNumber) =
  -historyEventRowHeight * rowNumber + viewPosition.y
  // historyEventRowHeight = 15; wiersze rosną W GÓRĘ od y=viewPosition.y
```

Widoczność:

```
isVisible(year) =
  positionByYear(year) + rowHeight > 0
  && positionByYear(year) - rowHeight < windowWidth

isVisibleRange(from, to) =
  positionByYear(to) + rowHeight > 0
  && positionByYear(from) - rowHeight < windowWidth
```

Skala lat (`yearsOnScale`): od `from` do `to` co `stepSize`.

`stepSize` zależy od zoomu:

| Zoom (przybliżenie) | stepSize |
|---------------------|----------|
| ≤ ~10–11 | 100 |
| ≤ ~20–22 | 10 |
| wyżej | 5 |

---

## 6. Nawigacja (pan / zoom)

### 6.1 Pan (mysz / 1 palec)

- LPM `mousedown` / touch start → zapis pozycji startowej i `viewPosition`.
- Move → aktualizacja:
  - `x = clamp(startView.x - (pageX - startX) / zoom, from - yearLabelWidth, to + yearLabelWidth)`
  - `y = startView.y + (pageY - startY)` (bez clamp)
- Cursor: `grab` / `grabbing`.

### 6.2 Zoom kółkiem

```
if zoom after delta ≤ 11:   stepSize=100; zoom = max(1, zoom - deltaY/100)
else if ≤ 22:               stepSize=10;  zoom = zoom - deltaY/200
else:                       stepSize=5;   zoom = zoom - deltaY/300

viewPosition.x -= deltaY / 100   // lekki shift lat przy zoomie
```

### 6.3 Pinch (2 palce)

- Delta dystansu między palcami / 100 zmienia `zoom`.
- Progi stepSize: zoom≤10 → 100; ≤20 → 10; else 5.
- Podczas pinch pan jest zatrzymywany.

### 6.4 Inne

- `html { touch-action: none; overscroll-behavior-y: contain }` — brak scrolla strony.
- Escape zamyka wszystkie modale.
- Dark mode: start z `prefers-color-scheme: dark`; listen na change; tło viewportu `rgb(43,44,45)` / `white`.

---

## 7. Kolejność warstw diagramu (od dołu)

1. **HistoryEvents** — pasy epok (jeśli włączone)
2. **ChronologyPad** — przezroczysty hit-area + pionowe linie lat (+ linia bieżącego roku)
3. **PersonReferences** — łuki relacji osób (jeśli autorzy + sympatie)
4. **People** — paski życia + thumbnails + nazwy (jeśli autorzy)
5. **PublicationReferences** — łuki między publikacjami
6. **Publications** — pionowe markery + tooltipy
7. **PersonHistoryEvents** — kropki / paski na wierszu osoby
8. **ChronologyScale** — etykiety lat na dole (najwyżej)

Klik/hover pustego tła (pad) resetuje highlight autora i publikacji do `'0'`.

---

## 8. Specyfikacja wizualna elementów diagramu

### 8.1 Linie lat (`ChronologyScaleLine`)

| Warunek | Stroke | Width | Dash |
|---------|--------|-------|------|
| Rok bieżący | `white` | 3 | `4 1 1 6 1 1` |
| Rok % 100 ≠ 0 | `rgba(61,224,224,0.2)` | 1 | — |
| Rok % 100 = 0 | `rgba(193,236,236,0.85)` | 1 | — |

Pełna wysokość viewportu.

### 8.2 Etykiety lat (`ChronologyScaleLabel`)

- Pozycja: `y = windowHeight - 30`, wycentrowane w X na roku.
- Rect: szer. 100, wys. 40, `rx/ry=5`.
- Fill: century (`year % 100 === 0`) → `rgba(193,236,236,0.85)` + tekst czarny; inaczej → `rgba(11,49,49,0.5)` + tekst biały.
- Font: mono, 15px, middle/hanging.

### 8.3 Osoba (`PersonNode`) — settings: `boxSize=35`

Kolor z narodowości (`ColorsService.getAccentColor`):

- Pasek życia (opcjonalny toggle „Życiorysy”): fill = pale(accent), stroke = accent; strokeWidth 3 gdy highlighted, inaczej 1.
- Thumbnail 35×35 na `positionByYear(born)`, ścieżka `/history_of_philosophy/assets/person/{thumbnail}`.
- Tekst nazwy: `x = start + boxSize + 8`, `y = row + 12`, font mono 14, fill = dark(accent), opacity 1 gdy highlight else 0.8.
- Truncate: jeśli `name.length * 8` nie mieści się w `(end-start - boxSize - 12)`, skróć i dodaj `...`.

Hover/click → highlight autora; click → modal osoby.

### 8.4 Relacje osób (`PersonReferenceNode`) — `boxSize=35`

Kolory attitude:

- Positive → `rgb(154, 231, 32)`
- Neutral → `rgba(0, 221, 255, 1)`
- Negative → `rgb(198, 18, 84)`

Ortokątna ścieżka z zaokrąglonymi narożnikami (`roundPathCorners`, radius **15**), strokeWidth 2.

Start przy urodzeniu `from`, koniec przy urodzeniu `to` (środek wysokości boxa).

Highlight:

- Gdy jakiś autor highlighted i ta relacja **nie** dotyczy jego: opacity **0.1**
- Gdy dotyczy highlighted: klasa animacji — strokeWidth 5, dash `1 5`, animacja `stroke-dashoffset` 2000→0 w 50s linear infinite

### 8.5 Publikacja (`PublicationNode`) — `boxSize=35`, `dotSize=30`, max 25 znaków/wiersz, max 3 wiersze tytułu

- Widoczny element: pionowa linia (strokeWidth 10) od `rowPosition` do `rowPosition+boxSize`, kolor `getFixedColor(publicationDate)`.
- Tooltip (domyślnie ukryty, widoczny na hover linii): zaokrąglony rect 220×(60+10*(n-1)), `rx=3`, fill tamed / stroke fixed wg daty; tytuł zawijany w tspany.
- Click → modal publikacji + ustaw current author/publication.
- Hover → highlight publication id.

### 8.6 Relacje publikacji (`PublicationReferenceNode`) — `boxSize=35`, `dotSize=15`

Ścieżka ortokątna z radius **5**, stroke = accent narodowości autora źródłowego, opacity 0.7.

Gdy highlighted (autor lub publikacja z/do): animowany dash `20 3`, offset 2000→0 / 50s.

Algorytm punktów używa `shrinkFactor`, `distanceFromFactor`, `distanceToFactor` zależnych od dat publikacji (pseudolosowe rozłożenie łuków) — **musi być przeniesiony 1:1** (implementacja: `src/pixi/relationPaths.ts`).

### 8.7 Wydarzenie historyczne (`HistoryEventNode`) — `boxSize=14`, `rowHeight=15`

Trzy prostokąty + tekst:

1. Górny „header” z nazwą: wysokość `name.length*8 + 20 + boxSize`, fill tamed(rowNumber), `rx=4`, od `y = row - name.length*8 - 20`.
2. Długi pas w dół (wysokość 20000): fill pale/gray zależnie od darkMode.
3. Cienki pasek na `rowPosition` wysokości `boxSize`, fill fixed(rowNumber).
4. Tekst nazwy: writing-mode `sideways-lr`, font mono 14, czarny.

Szerokość: `max(end-start+5, 20)`.

### 8.8 Wydarzenie osobiste (`PersonHistoryEventNode`)

- Instant (`yearTo` null lub = `yearFrom`): koło `r=5` w środku wiersza osoby, fill fixed(yearFrom), stroke tamed.
- Zakres: rect wysokości `barHeight=10` przy dolnej krawędzi boxa (`row + boxSize - barHeight - 2`), `rx=3`, fill fixed opacity 0.85.
- Tooltip 230px szer., typ + lata + nazwa (max 28 znaków/wiersz, 3 wiersze).
- Click (stopPropagation) → modal wydarzenia.

### 8.9 System kolorów (`ColorsService`)

Palety:

```
tamedPalette = [
  '#b1ecc6ff','#d7eaf0ff','#dec5e9ff','#cac5e5ff','#d0aca6ff',
  '#cde2c0ff','#bbe3d5ff','#e8d3c6ff','#d7c5bbff','#ead0e5ff'
]
palette = [
  '#2CAA58','#3f9db9ff','#b159ddff','#4f467cff','#8C3226',
  '#678A51','#16835bff','#E78140','#b15a24ff','#7d2e6fff'
]
```

- `getFixedColor(n)` / `getTamedColor(n)` → index `n % length`
- `getAccentColor(nationality)` — mapa stałych (Amerykanin, Francuz, Niemiec, …) albo hash stringa → palette
- `convertToPale(hex)` = blend white 0.3
- `convertToDark(hex)` = blend black 0.6
- `convertToGray(hex)` = blend #222 0.25

---

## 9. UI poza diagramem

### 9.1 Menu

Dwa przyciski (gradient `#ff4f7e → #fe27be`) w lewym górnym rogu:

1. **Ustawienia** (ikona suwaków) — panel:
   - Autorzy
   - Życiorysy (disabled bez Autorów)
   - Sympatie (disabled bez Autorów)
   - Publikacje
   - Odniesienia (disabled bez Publikacji)
   - Wydarzenia historyczne
   - Wydarzenia osobiste (disabled bez Autorów)
   - Tryb ciemny

2. **Filtry** (ikona lupki) — lista toggle kolekcji „Widoczne kolekcje”.

Panel: `bg-gray-900/50`, backdrop blur, border-right różowy (`border-pink-700`), szer. 300px na md+.

Toggle: neumorphism switch z gradientem różowym gdy ON.

### 9.2 Modale

Wspólny `Modal`:

- Overlay: `bg-gray-900/50` + blur; click overlay zamyka.
- Karta: szer. 500px, tło `rgba(8,8,11,1)`, border-right różowy, rounded, drop-shadow cyan.
- Przycisk X absolute.

**PersonDetails:** tytuł italic; duże zdjęcie `assets/person_big/`; urodzony/zmarł + linki lokalizacji; narodowość; timeline publikacji i wydarzeń osobistych (ikony, klikalne).

**PublicationDetails:** tytuł w cudzysłowach; autor + data + lokalizacja + ISBN; okładka `assets/publication/`.

**LocationDetails:** nazwa + link OSM; zdjęcie `assets/location/`; timeline publikacji / urodzeń / zgonów w tej lokalizacji.

**PersonHistoryEventDetails:** nazwa, typ, lata, osoba, lokalizacja.

Linki między modalami: klik nazw zamyka bieżący i otwiera docelowy (tylko jeden modal naraz).

Akcent interakcji w treściach: `text-pink-700 underline hover`.

---

## 10. Filtrowanie kolekcji

Przy toggle kolekcji:

```
isWhiteList = kolekcja "0" (Nieprzypisane) jest aktywna
includedIds = flatMap aktywnych kolekcji → ich included*

filter:
  if whiteList:  !allCollectionIds.includes(id) || includedIds.includes(id)
  else:          includedIds.includes(id)
```

Po filtrze osób: przelicz `withRowNumbers`. Wydarzenia osobiste filtruj po `personId` ∈ widocznych osób.

---

## 11. Assety

| Ścieżka | Użycie |
|---------|--------|
| `/history_of_philosophy/assets/person/{file}` | miniatury na osi (35×35) |
| `/history_of_philosophy/assets/person_big/{file}` | modal osoby |
| `/history_of_philosophy/assets/publication/{file}` | okładki |
| `/history_of_philosophy/assets/location/{file}` | lokalizacje |

Base path aplikacji: `/history_of_philosophy` (GitHub Pages).

---

## 12. Stany UI do zreplikowania

| Stan | Domyślnie |
|------|-----------|
| displayAuthors | true |
| displayAuthorsTimeline | true |
| displayAuthorRelations | true |
| displayPublications | true |
| displayPublicationRelations | true |
| displayHistoryEvents | true |
| displayPersonHistoryEvents | true |
| darkMode | prefers-color-scheme |
| highlightedAuthor | `'0'` |
| highlightedPublication | `'0'` |
| zoom | 10 |
| viewPosition | {1588, 0} |
| wszystkie kolekcje | isActive: true |

---

## 13. Obecny stack (referencja, nie wymóg rebuildu)

- React 19 + TypeScript
- Rsbuild + Sass + Tailwind 4
- Render diagramu: **SVG w React**
- Dane: wygenerowane TS modules
- Deploy: `docs/` → GitHub Pages

---

## 14. Kryteria akceptacji „identycznego wyglądu”

1. Ten sam układ wierszy osób i wydarzeń historycznych (ten sam packing).
2. Te same kolory, grubości, dash-patterny, zaokrąglenia ścieżek.
3. Te same tooltipy (rozmiar, zawijanie tekstu, pokazanie na hover).
4. Identyczna nawigacja pan/zoom/pinch i progi skali lat.
5. Identyczna kolejność warstw i highlight relacji.
6. Identyczne modale i menu (mogą zostać HTML).
7. Te same assety i base path.
8. Dark mode jak wyżej.

---

## 15. Szczegóły krytyczne dla parity (łatwo przeoczyć)

Te punkty najczęściej powodują, że rebuild „działa”, ale **nie wygląda tak samo**.

### 15.1 Heurystyki tekstu (nie mierzyć glyphów)

Oryginał **nie** używa `getBBox` / Canvas `measureText`. Szerokości są estymowane stałą:

| Miejsce | Heurystyka |
|---------|------------|
| Truncate nazwy osoby | mieści się, gdy `name.length * 8 < (end-start - boxSize - 12)`; inaczej `slice(0, max((end-start-boxSize-12)/8 - 4, 0)) + '...'` |
| Wysokość headera HistoryEvent | `name.length * 8 + 20 + boxSize` |
| Pozycja Y tekstu HistoryEvent | `rowPosition - name.length * 8 - 4` |
| Zawijanie tytułu publikacji / event osobisty | reduce po słowach względem `maxLettersColumns` (znaki, nie px) |

Przy Pixi **skopiuj te wzory**, zamiast liczyć prawdziwą szerokość fontu — inaczej truncate i boxe wydarzeń się rozjadą.

### 15.2 Font diagramu

Klasy `font-mono` (Tailwind) → stack w stylu:

`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`

Rozmiary: etykiety lat **15**, nazwy osób / wydarzenia **14**, tooltip publikacji **14 bold**, tooltip event osobisty **12 bold**.  
Baseline: SVG `dominantBaseline="hanging"` (osoby, tooltipy) lub `"central"` (HistoryEvent).

### 15.3 Miniatury osób: asset ≠ display size

- Pliki w `assets/person/` są **30×30** PNG (RGBA), bez zaokrągleń (`roundedCorners: 0` w importerze).
- Na diagramie rysowane jako **35×35** → lekkie rozciągnięcie; trzeba to powtórzyć (`Sprite` 35×35 z tekstury 30×30), nie skalować „contain” do 30.

`person_big` = 200×300, rx 10; `publication` = 500×700; `location` = 480×200 — tylko modale HTML.

### 15.4 Asymetria cullingu (co jest rysowane poza ekranem)

| Warstwa | Filtr widoczności |
|---------|-------------------|
| People | **brak** (zakomentowany) — wszystkie osoby zawsze w scenie |
| PersonReferences | **brak** — wszystkie relacje zawsze |
| Publications | `isVisible(publicationDate)` |
| PublicationReferences | `isVisibleRange(minDate, maxDate)` |
| HistoryEvents | `isVisibleRange(yearFrom, yearTo)` |
| PersonHistoryEvents | `isVisibleRange(yearFrom, yearTo)` |
| Year lines / labels | `isVisible(year)` |
| Linia roku bieżącego | **zawsze** (nawet gdy rok nie należy do `yearsOnScale`) |

Dla identycznego overlappingu / kolejności rysowania: przy rebuildzie albo zachowaj tę asymetrię, albo culluj tylko z gwarancją tego samego z-order wśród widocznych.

### 15.5 Kolejność wewnątrz warstwy = kolejność tablic

Overlapy (np. dwie publikacje blisko siebie) zależą od kolejności w serwisach:

- publikacje: sort po `publicationDate` rosnąco,
- osoby po `withRowNumbers`,
- eventy historyczne: sort `yearFrom`, potem packing `rowNumber`,
- relacje: kolejność z raw.

Późniejszy element = wyżej (jak SVG painter’s algorithm).

### 15.6 Highlight to głównie hover, nie „sticky selection”

- `onMouseMove` na osobie → `highlightedAuthor = id`
- `onMouseMove` / `onClick` na przezroczystym padzie → reset `'0'` / `'0'`
- publikacja: `onMouseMove` / `onTouchStart` na markerze → `highlightedPublication`
- Click osoby też ustawia highlight i otwiera modal; highlight zostaje, aż kursor wróci nad pad

Animacja dash na relacjach działa tylko przy `isHighlighted`; pozostałe relacje osób przy aktywnym highlightcie mają opacity **0.1**.

### 15.7 Zoom: kółko ≠ pinch (różne krzywe)

- **Wheel:** trzy progi z dzielnikami `deltaY/100`, `/200`, `/300`; w najniższym zakresie `zoom = max(1, …)`; dodatkowo `viewPosition.x -= deltaY/100`.
- **Pinch:** zawsze `zoom -= (pinchDelta - pinchSize) / 100`; **brak** `Math.max(1, …)`; **bez** shiftu `viewPosition.x`; progi stepSize przy 10 / 20 (nie 11 / 22).

Nie ujednolicaj gestów „dla czytelności” — rozjazd skali lat będzie widoczny.

### 15.8 Kolory: 8-cyfrowy hex i `rgba()`

Paleta zawiera wartości jak `#3f9db9ff`. `getAccentColor(null)` zwraca `'rgba(27, 100, 27, 1)'`.  
Parser kolorów w Pixi musi akceptować `#RRGGBB`, `#RRGGBBAA` i `rgba(...)`.  
`hexToRgb` w `ColorsService` bierze tylko znaki 1..6 (ignoruje alpha w hex) — przy blendach zachowaj to samo zachowanie.

Hash narodowości (gdy brak fixed map):

```
random = name.split('').map(c => c.charCodeAt(0)).reduce((cur, prev) => Math.min(prev, 1000) + cur)
color = palette[floor(((random % 1000) / 1000) * palette.length)]
```

(Fixed map: Amerykanin, Austryjak, Brytyjczyk, Chińczyk, Holender, Francuz, Niemiec, Norweg, Węgier — dokładne hex w `Colors.ts`.)

### 15.9 Stroke caps / joins / dash

SVG default: `stroke-linecap=butt`, `stroke-linejoin=miter`.  
Pixi często domyślnie round — ustaw **butt/miter**, inaczej końce markerów publikacji (strokeWidth 10) i łuki relacji będą „grubsze” wizualnie.

Dash do zreplikowania:

| Stan | dasharray | dashoffset anim | strokeWidth |
|------|-----------|-----------------|-------------|
| Rok bieżący | `4 1 1 6 1 1` | — | 3 |
| Person ref highlighted | `1 5` | 2000 → 0 / 50s linear infinite | 5 (override) |
| Publication ref highlighted | `20 3` | 2000 → 0 / 50s | 2 |

**Pixi v8 Graphics nie ma pełnego CSS `stroke-dasharray`.** Trzeba: własny dashed stroke, tekstura, lub biblioteka path-dash — inaczej highlight relacji nie będzie wyglądał jak oryginał.

### 15.10 `roundPathCorners` — kopiuj 1:1

Nie zamieniaj na proste `arcTo` „na oko”. Portuj `src/pixi/roundPathCorners.ts` i rysuj wynikowe komendy `M/L/C`. Radius: osoby **15**, publikacje **5**, `useFractionalRadius=false`.

### 15.11 Geometria PublicationReference — stałe magiczne

Portuj bez uproszczeń:

- `cos05 = 0.877`
- `extraSpacing = boxSize * 2`
- `shrinkFactor` gdy `(mostRight-mostLeft) < extraSpacing`
- `distanceFromFactor = 0.7 + 0.7 * ((dateTo+dateFrom) % 15) / 15`
- `distanceToFactor = 1.4 + 0.7 * ((dateTo+dateFrom) % 5) / 5`
- przypadek `positionEnd === positionStart` → degeneracja do prawie-punktu `(end+0.1, end+0.1)`

### 15.12 HistoryEvent: pas wysokości 20000

Drugi rect ma `height={20000}` — celowo „nieskończony” pas w dół pod epokę. W Pixi narysuj bardzo wysoki rect (lub do dołu world-bounds), nie przycinaj do viewportu wysokością boxa.

Tekst: `writing-mode: sideways-lr` + `text-orientation: sideways` — w Pixi `rotation = ±π/2` + ręczny pivot; **wymaga porównania screenshotem** z live page.

### 15.13 Quirk historyczny (pominięty w Pixi)

W starej wersji SVG `PersonNode` miały przypadkowe znaki `(` `)` w JSX. W porcie Pixi nie są renderowane.

### 15.14 `stillAlive` i rok śmierci

Przy starcie modułu: `died = stillAlive ? new Date().getFullYear() : …`. Wartość jest **zamrożona** do przeładowania strony (nie tyka się co frame).

### 15.15 Stacking HTML vs canvas

Menu (`position: fixed`, lewy górny róg) i modale muszą być **nad** canvasem (`z-index`), z własnymi pointer events. Canvas pod spodem: `touch-action: none` na `html`.  
Przyciski menu nie mogą „przepuszczać” dragów do Pixi.

### 15.16 DPR / antialiasing

Oryginał SVG jest niezależny od DPR. W Pixi: `resolution: devicePixelRatio`, `autoDensity: true`, `antialias: true` — bez tego na retina linie siatki i tekst będą miękkie/grube inaczej niż SVG.

### 15.17 Weryfikacja wizualna (zalecane w prompcie)

Przed „done”: screenshot side-by-side z https://wit3k.github.io/history_of_philosophy/ przy:

1. domyślnej kamerze (`viewPosition.x=1588`, `zoom=10`),
2. hover na osobie z relacjami (animowane + przygaszone łuki),
3. hover na publikacji (tooltip),
4. zoom ≈ 25 (stepSize 5, gęste etykiety),
5. dark mode + widoczne HistoryEvents.

### 15.18 Co wolno zmienić bez łamania „identycznego diagramu”

- Stack UI (React/Vue/Svelte) dla menu/modali
- Bundler
- Implementacja dashed stroke (byle wygląd)
- Culling wydajnościowy **jeśli** z-order i brak „znikających” elementów na krawędziach są zachowane

### 15.19 Czego nie wolno „poprawiać”

- Formuł kamery i różnych krzywych wheel vs pinch
- Heurystyki `* 8` przy tekście
- Packingu wierszy
- Magicznych stałych ścieżek relacji
- Kolejności warstw
- Rozmiaru display thumbnail 35 przy asset 30

---

## 16. Rekomendowany stack rebuildu (PixiJS)

Decyzje pod **parity wizualną** i szybkość portu z obecnego React/SVG. Menu i modale zostają w HTML.

### 16.1 Obowiązkowe / domyślne

| Narzędzie | Cel |
|-----------|-----|
| **`pixi.js` v8** | Renderer diagramu (canvas), tekstury miniaturek, hit-test, ticker |
| **`@pixi/react`** (v8 / React 19) | Deklaratywny scene graph — port struktury `*List` / `*Node` bez ręcznego `addChild` / teardown |
| **Istniejący `roundPathCorners`** (`src/pixi/roundPathCorners.ts`) | Zaokrąglenia łuków relacji — bez przepisywania algorytmu |
| **Istniejący `ColorsService` + serwisy danych** | Kolory, packing wierszy, filtry kolekcji |
| **Mały util dashed stroke** | Linia roku bieżącego + animowany highlight relacji (Pixi v8 nie ma CSS `stroke-dasharray`) |
| **Bridge komend path → Pixi Graphics** | Wynik `roundPathCorners` to ciąg komend `M`/`L`/`C` (historyczny format path data, **nie** DOM SVG). Potrzebny translator do `moveTo` / `lineTo` / `bezierCurveTo` (własny kod albo lekki parser path-data, np. `svg-pathdata` / `svg-path-commander`). Nazwa „SVG” dotyczy tylko składni komend |

Tooltipy publikacji / wydarzeń osobistych: **preferowane HTML overlay** nad canvasem (łatwiejszy tekst, ten sam React) — albo Pixi `Text`/`Graphics`, byle wymiary ze SPEC §8.

### 16.2 Dozwolone opcjonalnie

| Narzędzie | Kiedy |
|-----------|--------|
| **`@use-gesture/react`** | Tylko jeśli eventy pointer/touch z Pixi okażą się uciążliwe; **delty muszą iść w formuły kamery ze SPEC §6 / §15.7**, bez „ulepszania” gestów |
| **`rbush` / cull** | Dopiero po parity wizualnej — optymalizacja hit-test / update; na start zachowaj asymetrię cullingu ze SPEC §15.4 |
| **Wbudowany `Color` z Pixi** | Parsowanie `#RRGGBB(AA)` / `rgba()` przy rysowaniu; źródłem prawdy blendów nadal `ColorsService` |

### 16.3 Zakazane na starcie (psują parity albo dublują silnik)

| Narzędzie | Powód |
|-----------|--------|
| **`pixi-viewport`** jako kamera | Własny model lat (`viewPosition` + osobne krzywe wheel/pinch); viewport walczy z bit-exact nawigacją |
| **`pixi-dashed-line` (stare Pixi)** | Nie targetuje v8 out-of-the-box — nie polegać na nim |
| **vis.js / Timeline.js / D3 timeline** | Inny model UI — nie da się „identycznie” |
| **Konva / Fabric / paper.js jako drugi renderer** | Dublowanie Pixi |
| **`@pixi/ui` / Pixi-modale** | Menu i modale zostają w DOM |
| **GSAP (tylko pod dashoffset)** | Overkill — wystarczy ticker Pixi |

### 16.4 Instalacja wyjściowa

```bash
bun add pixi.js @pixi/react
# opcjonalnie, jeśli nie piszesz własnego bridge path→Graphics:
# bun add svg-pathdata
```

React 19, Rsbuild, Tailwind (menu/modale), Biome — bez zmian wymagań.
)
