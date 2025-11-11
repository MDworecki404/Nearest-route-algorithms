# Nearest-route-algorithms (OSM) — Dijkstra i A*

Projekt buduje grafy drogowe z danych OSM, tworzy strukturę półkrawędzi (Half-Edge) i uruchamia algorytmy najkrótszej ścieżki (Dijkstra oraz A*) dla dwóch profili ruchu: samochód (car) oraz pieszy/rower (bikeFoot). Pipeline generuje wyniki zarówno na grafie sąsiedztwa, jak i na strukturze półkrawędzi.

## Wymagania

- Node.js 16+ (zalecane 18+)
- System Windows (skrypty/testowane pod cmd.exe)
- Brak dodatkowych zależności npm (używany tylko wbudowany `fs`)

## Struktura katalogów

- `a-Star/`
	- `A-StarGraph.js` — A* na grafie sąsiedztwa (lista krawędzi).
	- `A-StarHalfEdges.js` — A* na strukturze półkrawędzi.
- `dijkstra/`
	- `dijkstraGraph.js` — Dijkstra na grafie zbudowanym jako lista sąsiedztwa (nodes+edges).
	- `dijkstraHalfEdge.js` — Dijkstra na strukturze półkrawędzi.
- `graph/`
	- `createGraph.js` — generuje grafy dla profili (car, bikeFoot) na podstawie danych OSM.
- `half-edge/`
	- `createHalfEdges.js` — buduje strukturę półkrawędzi (Half-Edge) i zapisuje do JSON.
- `data/`
	- `osm_wroclaw_roads.json` — dane wejściowe OSM (pełne).
	- `osm_wroclaw_roads_cliped.json` — dane wejściowe OSM przycięte do obszaru analizy.
- `output/`
	- `graphs/`
		- `graphCar.json`, `graphBikeFoot.json` — grafy sąsiedztwa dla profili.
	- `halfEdges/`
		- `halfEdges_car.json`, `halfEdges_bikeFoot.json` — półkrawędzie dla profili.
	- `paths/`
		- `dijkstra/`
			- `dijkstraPathBikeFoot.txt`, `dijkstraPathCar.txt` — ścieżki z Dijkstry na grafie.
			- `dijkstraHalfEdgePathBikeFoot.txt`, `dijkstraHalfEdgePathCar.txt` — ścieżki z Dijkstry na półkrawędziach.
		- `A-Star/`
			- `aStarPathBikeFoot.txt`, `aStarPathCar.txt` — ścieżki z A* na grafie.
			- `aStarHalfEdgePathBikeFoot.txt`, `aStarHalfEdgePathCar.txt` — ścieżki z A* na półkrawędziach.
	- `mainWorkflowResults.json` — czasy wykonania poszczególnych kroków pipeline’u.
- `mainWorkflow.js` — skrypt orkiestrujący: buduje grafy, półkrawędzie i uruchamia algorytmy.

## Przepływ pracy (pipeline)

1. Wejście: `data/osm_wroclaw_roads_cliped.json` (GeoJSON/OSM, atrybuty m.in. `fclass`, `oneway`).
2. `graph/createGraph.js` generuje grafy sąsiedztwa do `output/graphs/graph{Car,BikeFoot}.json`.
3. `half-edge/createHalfEdges.js` generuje półkrawędzie do `output/halfEdges/halfEdges_{car,bikeFoot}.json`.
4. Algorytmy (oba profile: car, bikeFoot):
	- `dijkstra/dijkstraGraph.js` — Dijkstra na grafie sąsiedztwa → `output/paths/dijkstra/`.
	- `dijkstra/dijkstraHalfEdge.js` — Dijkstra na półkrawędziach → `output/paths/dijkstra/`.
	- `a-Star/A-StarGraph.js` — A* na grafie sąsiedztwa → `output/paths/A-Star/`.
	- `a-Star/A-StarHalfEdges.js` — A* na półkrawędziach → `output/paths/A-Star/`.

Całość uruchamia wygodnie `mainWorkflow.js` (patrz sekcja Jak uruchomić). Na końcu zapisywany jest plik `output/mainWorkflowResults.json` z czasami poszczególnych kroków.

## Profile i filtrowanie dróg

W `createHalfEdges.js` zdefiniowane są listy dozwolonych klas dróg (`fclass`) dla:

- `car`: motorway, trunk, primary, secondary, tertiary, residential, service, living_street, unclassified, itd.
- `bikeFoot`: footway, pedestrian, path, cycleway, steps, service, living_street, track, bridleway.

W atrybucie `oneway` rozróżniane są drogi jednokierunkowe (`F`) i dwukierunkowe (`B`).

## Struktury danych

### Graf sąsiedztwa (graphs/*.json)

Format używany przez `dijkstraGraph.js` i `A-StarGraph.js`.

Struktura: tablica obiektów reprezentujących węzły grafu.

**Przykład węzła:**
```json
{
  "node": [17.054784, 51.1091578],
  "oneway": false,
  "edges": [
    [17.0549123, 51.1092456, 0.00018234],
    [17.0546712, 51.1090123, 0.00015678]
  ]
}
```

**Pola:**
- `node`: `[lon, lat]` — współrzędne węzła
- `oneway`: `boolean` — czy węzeł jest częścią drogi jednokierunkowej
- `edges`: tablica krawędzi wychodzących, każda jako `[neighborLon, neighborLat, distance]`
  - `neighborLon`, `neighborLat` — współrzędne węzła docelowego
  - `distance` — waga krawędzi (odległość euklidesowa)

**Obsługa kierunkowości:**
- `oneway === "F"` (Forward): krawędź tylko from → to
- `oneway === "B"` (Both): krawędzie w obu kierunkach (from → to i to → from)

### Struktura półkrawędzi (halfEdges/*.json)

Format używany przez `dijkstraHalfEdge.js` i `A-StarHalfEdges.js`.

Struktura: tablica półkrawędzi (half-edges), gdzie każda krawędź grafu składa się z dwóch półkrawędzi skierowanych w przeciwnych kierunkach.

**Przykład półkrawędzi:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "V": [17.054784, 51.1091578],
  "S": [17.0549123, 51.1092456],
  "N": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "attributes": {
    "siblingID": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "oneway": "B",
    "azimuth": 45.7,
    "distance": 0.00018234
  }
}
```

**Pola:**
- `id`: unikalny UUID półkrawędzi
- `V`: `[lon, lat]` — współrzędne wierzchołka początkowego (Vertex)
- `S`: `[lon, lat]` — współrzędne wierzchołka końcowego (Sibling vertex)
- `N`: `id` następnej półkrawędzi wychodzącego z tego samego wierzchołka `V` (Next)
  - Tworzy cykliczną listę wszystkich półkrawędzi wychodzących z `V`
  - Sortowane według azymutu (kąta) malejąco
  - Jeśli tylko jedna półkrawędź z `V`, to `N` wskazuje na samą siebie

**Atrybuty:**
- `siblingID`: UUID półkrawędzi bliźniaczej (prowadzi w przeciwnym kierunku: S → V)
- `oneway`: `"F"` (Forward) lub `"B"` (Both directions)
- `azimuth`: kąt azymutalny w stopniach (0-360°) od `V` do `S`
- `distance`: waga krawędzi (odległość euklidesowa między `V` i `S`)

**Właściwości struktury:**
- Każda krawędź dwukierunkowa (`oneway === "B"`) generuje DWE półkrawędzie (he1: V→S, he2: S→V)
- Krawędź jednokierunkowa (`oneway === "F"`) generuje JEDNĄ półkrawędź (tylko V→S)
- Cykliczna lista `N` umożliwia iterację po wszystkich półkrawędziach wychodzących z danego wierzchołka
- Azymut pozwala na nawigację topologiczną (np. skręt w lewo/prawo)

## Algorytmy

- `dijkstraGraph.js`
	- Działa na liście sąsiedztwa (`node` + `edges`).
	- Inicjuje mapę odległości `Q`, wybiera minimalny `u`, relaksuje krawędzie `u -> v` o koszcie `edge[2]`.
	- Odtwarza ścieżkę wstecz po polu `prev` i zapisuje do `output/paths/dijkstra/` jako listę współrzędnych.

- `dijkstraHalfEdge.js`
	- Buduje mapy pomocnicze: `id -> halfEdge` i `V -> [halfEdges...]`.
	- Dla wierzchołka `u` iteruje po wszystkich półkrawędziach wychodzących z `u` i relaksuje do sąsiada wskazanego przez `siblingId` o koszcie `distanceToSibling`.
	- `nextId` pozwala przechodzić cyklicznie po wszystkich półkrawędziach z tego samego wierzchołka.

- `A-StarGraph.js`
	- A* na grafie sąsiedztwa (heurystyka: odległość euklidesowa między węzłami).

- `A-StarHalfEdges.js`
	- A* na półkrawędziach. Dla bieżącego wierzchołka rozpatruje wszystkie wychodzące półkrawędzie, przejście do `siblingId` o koszcie `distanceToSibling`, z uwzględnieniem kierunkowości (`twoDirectional`, `from`/`to`).

## Jak uruchomić

Najprościej uruchomić cały pipeline jednym poleceniem:

```cmd
node mainWorkflow.js
```

To wykona kolejno:

1) `graph/createGraph.js`
2) `half-edge/createHalfEdges.js`
3) `dijkstra/dijkstraGraph.js`
4) `dijkstra/dijkstraHalfEdge.js`
5) `a-Star/A-StarGraph.js`
6) `a-Star/A-StarHalfEdges.js`

Na końcu zostanie zapisany raport z czasami do `output/mainWorkflowResults.json`.

Uruchamianie poszczególnych kroków ręcznie:

```cmd
node graph/createGraph.js
node half-edge/createHalfEdges.js
node dijkstra/dijkstraGraph.js
node dijkstra/dijkstraHalfEdge.js
node a-Star/A-StarGraph.js
node a-Star/A-StarHalfEdges.js
```

Wyniki znajdziesz w `output/graphs/`, `output/halfEdges/` oraz `output/paths/`.

## Uwaga na dane wejściowe i wydajność

- Pliki OSM/GeoJSON mogą być duże — upewnij się, że masz wystarczająco pamięci i miejsca na dysku.
- Ścieżki zawierają spacje (OneDrive/Polskie znaki) — Node radzi sobie, ale jeśli używasz innych narzędzi, pamiętaj o cudzysłowach.
- Jeśli zmienisz strukturę pól w JSON-ach, zaktualizuj odpowiednie algorytmy (Dijkstra/A*), które te pola czytają.

## Zmiana punktów startu i mety

Aktualne współrzędne startu/końca są wpisane bezpośrednio w plikach algorytmów:

- `dijkstra/dijkstraGraph.js`
- `dijkstra/dijkstraHalfEdge.js`
- `a-Star/A-StarGraph.js`
- `a-Star/A-StarHalfEdges.js`

W każdym pliku znajdziesz dwie pary wywołań (dla `bikeFoot` i `car`). Zmień tablice `[lon, lat]` w argumentach funkcji, np. `aStar([lonStart, latStart], [lonEnd, latEnd], graph)`.

## Rozszerzenia i pomysły

- Obsługa kosztów czasowych (prędkości po `fclass`) zamiast samej odległości.
- Filtry ograniczeń (zakazy skrętu, krawędzie zamknięte, profile pojazdów).
- Heurystyka geodezyjna w A* (Haversine) i porównanie z Dijkstrą.

---

Autor: Marek Dworecki

