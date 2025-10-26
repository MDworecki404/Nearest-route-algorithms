const halfEdgeCar = require("../output/halfEdges/halfEdges_car.json");
const halfEdgeBikeFoot = require("../output/halfEdges/halfEdges_bikeFoot.json");
const fs = require("fs");

const dijkstra = (startNode, endNode, graph) => {
    const valid = graph.filter(
        (he) =>
            he &&
            he.id != null &&
            Array.isArray(he.V) &&
            he.V.length === 2 &&
            he.siblingId != null
    );

    const halfEdgeMap = new Map();
    valid.forEach((he) => halfEdgeMap.set(he.id, he));

    const vertexToHalfEdges = new Map();
    valid.forEach((he) => {
        const key = he.V.join(",");
        if (!vertexToHalfEdges.has(key)) vertexToHalfEdges.set(key, []);
        vertexToHalfEdges.get(key).push(he);
    });

    const Q = new Map();
    valid.forEach((he) => {
        const key = he.V.join(",");
        if (!Q.has(key)) {
            Q.set(key, { dist: Infinity, prev: null });
        }
    });

    const S = new Map();
    const startKey = startNode.join(",");
    const endKey = endNode.join(",");
    Q.get(startKey).dist = 0;

    while (Q.size > 0) {
        let uKey = null;
        let uDist = Infinity;
        Q.forEach((value, key) => {
            if (value.dist < uDist) {
                uDist = value.dist;
                uKey = key;
            }
        });
        if (uKey === null || uDist === Infinity) break;

        const outgoingHalfEdges = vertexToHalfEdges.get(uKey) || [];
        for (const he of outgoingHalfEdges) {
            const neighbor = halfEdgeMap.get(he.siblingId);
            if (!neighbor) continue;
            const neighborKey = neighbor.V.join(",");
            if (!Q.has(neighborKey)) continue;

            if (he.twoDirectional !== true) {
                if (!(he.from === he.id && he.to === neighbor.id)) {
                    continue;
                }
            }

            const weight =
                typeof he.distanceToSibling === "number"
                    ? he.distanceToSibling
                    : 1;
            const alt = uDist + weight;
            if (alt < Q.get(neighborKey).dist) {
                Q.get(neighborKey).dist = alt;
                Q.get(neighborKey).prev = uKey;
            }
        }
        S.set(uKey, Q.get(uKey));
        Q.delete(uKey);
        if (uKey === endKey) break;
    }

    let path = [];
    let currentKey = endKey;
    while (currentKey && S.has(currentKey)) {
        path.unshift(currentKey.split(",").map(Number));
        currentKey = S.get(currentKey).prev;
    }
    if (path.length === 0 || path[0].join(",") !== startKey) {
        return [];
    }
    path.unshift(startNode);
    return path;
};

const pathBikeFoot = dijkstra(
    [17.054784, 51.1091578],
    [17.0525718, 51.1109826],
    halfEdgeBikeFoot
);
const pathCar = dijkstra(
    [17.0537461, 51.1097778],
    [17.0704743, 51.1129139],
    halfEdgeCar
);

const pathTextBikeFoot = pathBikeFoot
    .map(([lon, lat]) => `${lon} ${lat}`)
    .join("\n");
fs.writeFileSync(
    "output/paths/dijkstra/dijkstraHalfEdgePathBikeFoot.txt",
    pathTextBikeFoot
);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync(
    "output/paths/dijkstra/dijkstraHalfEdgePathCar.txt",
    pathTextCar
);
