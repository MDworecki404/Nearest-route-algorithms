const halfEdgeCar = require("../output/halfEdges/halfEdges_car.json");
const halfEdgeBikeFoot = require("../output/halfEdges/halfEdges_bikeFoot.json");
const fs = require("fs");

const prepareQ = (graph) => {
    const Q = new Map();
    graph.forEach((he) => {
        Q.set(he.id, {
            ...he,
            dist: Infinity,
            prev: null,
        });
    });
    return Q;
};

const dijkstra = (startNode, endNode, graph) => {
    const Q = prepareQ(graph);
    const S = new Map();

    const startHes = Array.from(Q.values()).filter(
        (he) => he.V[0] === startNode[0] && he.V[1] === startNode[1]
    );

    if (startHes.length === 0) {
        console.error("Brak half-edge zaczynających w startNode!");
        return [];
    }

    startHes.forEach((he) => {
        Q.get(he.id).dist = 0;
    });

    while (Q.size > 0) {
        let u = null;
        let minDist = Infinity;

        for (const he of Q.values()) {
            if (he.dist < minDist) {
                minDist = he.dist;
                u = he;
            }
        }

        if (!u || u.dist === Infinity) break;

        if (u.V[0] === endNode[0] && u.V[1] === endNode[1]) {
            S.set(u.id, u);
            break;
        }

        S.set(u.id, u);
        Q.delete(u.id);

        const sibling = Q.get(u.attributes.siblingID) || S.get(u.attributes.siblingID);
        if (!sibling) continue;

        let nxt = Q.get(sibling.id) || S.get(sibling.id);
        if (!nxt) nxt = sibling;

        while (true) {
            if (!nxt || S.has(nxt.id)) break;

            const alt = u.dist + nxt.attributes.distance;
            if (alt < nxt.dist) {
                nxt.dist = alt;
                nxt.prev = u.id;
            }
            if (nxt.N === sibling.id) break;
            nxt = Q.get(nxt.N) || S.get(nxt.N);
        }
    }
    let bestEnd = null;
    for (const he of S.values()) {
        if (he.S[0] === endNode[0] && he.S[1] === endNode[1]) {
            if (!bestEnd || he.dist < bestEnd.dist) bestEnd = he;
        }
    }

    if (!bestEnd) {
        console.log("Brak ścieżki");
        return [];
    }

    const path = [];
    let cur = bestEnd;
    path.push(endNode)
    while (cur) {
        path.push(cur.S);
        cur = Q.get(cur.prev) || S.get(cur.prev);
    }
    path.push(startNode);
    return path.reverse();
};

//const pathBikeFoot = dijkstra(
//    [17.054784, 51.1091578],
//    [17.0525718, 51.1109826],
//    halfEdgeBikeFoot
//);
const pathCar = dijkstra(
    [17.0537461, 51.1097778],
    [17.0704743, 51.1129139],
    halfEdgeCar
);

//const pathTextBikeFoot = pathBikeFoot
//    .map(([lon, lat]) => `${lon} ${lat}`)
//    .join("\n");
//fs.writeFileSync(
//    "output/paths/dijkstra/dijkstraHalfEdgePathBikeFoot.txt",
//    pathTextBikeFoot
//);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync(
    "output/paths/dijkstra/dijkstraHalfEdgePathCar.txt",
    pathTextCar
);
