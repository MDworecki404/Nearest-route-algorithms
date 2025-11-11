const halfEdgeCar = require("../output/halfEdges/halfEdges_car.json");
const halfEdgeBikeFoot = require("../output/halfEdges/halfEdges_bikeFoot.json");
const fs = require("fs");

const heuristic = (nodeA, nodeB) => {
    return Math.sqrt(
        Math.pow(nodeA[0] - nodeB[0], 2) + Math.pow(nodeA[1] - nodeB[1], 2)
    );
};

const prepareOpenSet = (graph, endNode) => {
    const Q = new Map();
    graph.forEach((he) => {
        Q.set(he.id, {
            ...he,
            g: Infinity,
            h: heuristic(he.V, endNode),
            f: Infinity,
            prev: null,
        });
    });
    return Q;
};

const aStar = (startNode, endNode, halfEdges) => {
    const openSet = prepareOpenSet(halfEdges, endNode);
    const closedSet = new Map();

    const startHes = Array.from(openSet.values()).filter(
        (he) => he.V[0] === startNode[0] && he.V[1] === startNode[1]
    );

    if (startHes.length === 0) {
        return [];
    }

    startHes.forEach((he) => {
        openSet.get(he.id).g = 0;
        openSet.get(he.id).f = openSet.get(he.id).h;
    });

    while (openSet.size > 0) {
        let lowestFHe = null

        for (const he of openSet.values()) {
            if (!closedSet.has(he.id)) {
                if (!lowestFHe || he.f < lowestFHe.f) {
                    lowestFHe = he;
                }
            }
        }
        if (!lowestFHe) break;

        if (lowestFHe.V[0] === endNode[0] && lowestFHe.V[1] === endNode[1]) {
            let path = [];
            let currentHe = lowestFHe;
            while (currentHe) {
                path.unshift(currentHe.V);
                if (!currentHe.prev) break;
                currentHe =
                    closedSet.get(currentHe.prev) ||
                    openSet.get(currentHe.prev);
            }
            return path;
        }

        closedSet.set(lowestFHe.id, {
            ...lowestFHe,
            prev: lowestFHe.prev,
        });

        const sibling = openSet.get(lowestFHe.attributes.siblingID);

        if (!sibling) continue;

        let nxt = sibling

        while (true) {
            let tentativeGScore = lowestFHe.g + nxt.attributes.distance;
            if (tentativeGScore < nxt.g) {
                nxt.g = tentativeGScore;
                nxt.f = nxt.g + nxt.h;
                nxt.prev = lowestFHe.id;
            }
            if (nxt.N === sibling.id) break;
            nxt = openSet.get(nxt.N);
        }

    }
};

//const pathBikeFoot = aStar(
//    [17.054784, 51.1091578],
//    [17.0525718, 51.1109826],
//    halfEdgeBikeFoot
//);
const pathCar = aStar(
    [17.0537461, 51.1097778],
    [17.0704743, 51.1129139],
    halfEdgeCar
);

//const pathTextBikeFoot = pathBikeFoot
//    .map(([lon, lat]) => `${lon} ${lat}`)
//    .join("\n");
//fs.writeFileSync(
//    "output/paths/A-Star/aStarHalfEdgePathBikeFoot.txt",
//    pathTextBikeFoot
//);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync("output/paths/A-Star/aStarHalfEdgePathCar.txt", pathTextCar);
