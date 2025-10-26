# Nearest-route-algorithms (OSM) — Dijkstra i A*

Projekt buduje grafy drogowe z danych OSM, tworzy strukturę półkrawędzi (Half-Edge) i uruchamia algorytmy najkrótszej ścieżki (Dijkstra oraz A*) dla dwóch profili ruchu: samochód (car) oraz pieszy/rower (bikeFoot).

## Wymagania

- Node.js 16+ (zalecane 18+)
- System Windows (skrypty/testowane pod cmd.exe)
- Brak dodatkowych zależności npm (używany tylko wbudowany `fs`)

## Struktura katalogów

- `a-Star/`
	- `A-StarGraph.js` — implementacja algorytmu A* na grafie sąsiedztwa (lista krawędzi).
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
			- `dijkstraPathBikeFoot.txt`, `dijkstraPathCar.txt` — ścieżki z Dijkstry (lista współrzędnych).
		- `A-Star/`
			- `aStarPathBikeFoot.txt`, `aStarPathCar.txt` — ścieżki z A* (lista współrzędnych).
- `mainWorkflow.js` — skrypt orkiestrujący: buduje grafy, półkrawędzie i uruchamia algorytmy.

## Przepływ pracy (pipeline)

1. Wejście: `data/osm_wroclaw_roads_cliped.json` (GeoJSON/OSM, atrybuty m.in. `fclass`, `oneway`).
2. `graph/createGraph.js` generuje grafy sąsiedztwa do `output/graphs/graph{Car,BikeFoot}.json`.
3. `half-edge/createHalfEdges.js` generuje półkrawędzie do `output/halfEdges/halfEdges_{car,bikeFoot}.json`.
4. Algorytmy:
	 - `dijkstra/dijkstraGraph.js` — wyznacza najkrótsze trasy i zapisuje do `output/paths/dijkstra/`.
	 - `dijkstra/dijkstraHalfEdge.js` — alternatywnie liczy ścieżkę po półkrawędziach.
	 - (opcjonalnie) `a-Star/A-StarGraph.js` — A* po grafie sąsiedztwa, zapis do `output/paths/A-Star/`.

Całość uruchamia wygodnie `mainWorkflow.js` (patrz sekcja Jak uruchomić).

## Profile i filtrowanie dróg

W `createHalfEdges.js` zdefiniowane są listy dozwolonych klas dróg (`fclass`) dla:

- `car`: motorway, trunk, primary, secondary, tertiary, residential, service, living_street, unclassified, itd.
- `bikeFoot`: footway, pedestrian, path, cycleway, steps, service, living_street, track, bridleway.

W atrybucie `oneway` rozróżniane są drogi jednokierunkowe (`F`) i dwukierunkowe (`B`).

## Format wyjściowy grafów (graphs/*.json)

Każdy wierzchołek ma postać:

- `node`: `[lon, lat]`
- `edges`: lista krawędzi do sąsiadów, każda jako `[neighborLon, neighborLat, distance]`

Ten format jest używany przez `dijkstraGraph.js` i `A-StarGraph.js`.

## Format wyjściowy półkrawędzi (halfEdges/*.json)

Każdy element reprezentuje pojedynczą półkrawędź:

- `id`: unikalny identyfikator półkrawędzi.
- `halfEdgeId`: para identyfikatorów półkrawędzi w jednej krawędzi (np. "12,13").
- `V`: `[lon, lat]` — wierzchołek początkowy tej półkrawędzi.
- `siblingId`: `id` półkrawędzi bliźniaczej (prowadzi do wierzchołka docelowego).
- `nextId`: `id` następnej półkrawędzi wychodzącej z tego samego wierzchołka (cykliczna lista).
- `distanceToSibling`: waga krawędzi (Euklides od `V` do `sibling.V`).
- `twoDirectional`: `true` dla dróg dwukierunkowych (B), `false` dla jednokierunkowych (F).
- `from`, `to` (tylko gdy `oneway === "F"`): porządek pary id w krawędzi jednokierunkowej.

Ten format jest używany przez `dijkstraHalfEdge.js`.

## Algorytmy

- `dijkstraGraph.js`
	- Działa na liście sąsiedztwa (`node` + `edges`).
	- Inicjuje mapę odległości `Q`, wybiera minimalny `u`, relaksuje krawędzie `u -> v` o koszcie `edge[2]`.
	- Odtwarza ścieżkę wstecz po polu `prev` i zapisuje do `output/paths/dijkstra/` jako listę współrzędnych.

- `dijkstraHalfEdge.js`
	- Buduje mapy pomocnicze: `id -> halfEdge` i `V -> [halfEdges...]`.
	- Dla wierzchołka `u` iteruje po wszystkich półkrawędziach wychodzących z `u` i relaksuje do sąsiada wskazanego przez `siblingId` o koszcie `distanceToSibling`.
	- `nextId` pozwala przechodzić cyklicznie po wszystkich półkrawędziach z tego samego wierzchołka.

- `A-StarGraph.js` (opcjonalnie)
	- Wersja A* na grafie sąsiedztwa (heurystyka zwykle odległość geodezyjna/Euclides).

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

Uruchamianie poszczególnych kroków ręcznie:

```cmd
node graph/createGraph.js
node half-edge/createHalfEdges.js
node dijkstra/dijkstraGraph.js
node dijkstra/dijkstraHalfEdge.js
```

Wyniki znajdziesz w `output/graphs/`, `output/halfEdges/` oraz `output/paths/`.

## Uwaga na dane wejściowe i wydajność

- Pliki OSM/GeoJSON mogą być duże — upewnij się, że masz wystarczająco pamięci i miejsca na dysku.
- Ścieżki zawierają spacje (OneDrive/Polskie znaki) — Node radzi sobie, ale jeśli używasz innych narzędzi, pamiętaj o cudzysłowach.
- Jeśli zmienisz strukturę pól w JSON-ach, zaktualizuj odpowiednie algorytmy (Dijkstra/A*), które te pola czytają.

## Rozszerzenia i pomysły

- Obsługa kosztów czasowych (prędkości po `fclass`) zamiast samej odległości.
- Filtry ograniczeń (zakazy skrętu, krawędzie zamknięte, profile pojazdów).
- Heurystyka geodezyjna w A* (Haversine) i porównanie z Dijkstrą.

---

Autor: Marek Dworecki

