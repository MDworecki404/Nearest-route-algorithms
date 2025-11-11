const graphCar = require("../output/graphs/graphCar.json");
const graphBikeFoot = require("../output/graphs/graphBikeFoot.json");
const fs = require("fs");

const Qset = (graph) => {
    let Q = new Map();
    graph.forEach((node) => {
        Q.set(node.node.join(","), {
            dist: Infinity,
            edges: node.edges,
            prev: null,
        });
    });
    return Q;
};

const dijkstra = (startNode, endNode, graph) => {
    const Q = Qset(graph);
    const S = new Map();

    Q.get(startNode.join(",")).dist = 0;

    while (Q.size > 0) {
        let uKey = null;
        let uDist = Infinity;

        Q.forEach((value, key) => {
            if (value.dist < uDist) {
                uDist = value.dist;
                uKey = key;
            }
        });

        if (uKey === null || uDist === Infinity) {
            break;
        }

        const uNode = Q.get(uKey);

        const uCoords = uKey.split(",").map(Number);
        if (uCoords[0] === endNode[0] && uCoords[1] === endNode[1]) {
            S.set(uKey, uNode);
            break;
        }

        S.set(uKey, uNode);
        Q.delete(uKey);

        uNode.edges.forEach((edge) => {
            const neighborKey = [edge[0], edge[1]].join(",");
            const neighbor = Q.get(neighborKey);
            const neighborDist = edge[2];
            if (neighbor) {
                const alt = uDist + neighborDist;
                if (alt < neighbor.dist) {
                    neighbor.dist = alt;
                    neighbor.prev = uKey;
                }
            }
        });
    }

    let path = [];
    let currentKey = endNode.join(",");
    while (currentKey) {
        path.unshift(currentKey.split(",").map(Number));
        currentKey = S.get(currentKey)?.prev || null;
    }
    path.unshift(startNode);
    return path;
};

//const pathBikeFoot = dijkstra(
//    [17.054784, 51.1091578],
//    [17.0525718, 51.1109826],
//    graphBikeFoot
//);
const pathCar = dijkstra(
    [17.0537461, 51.1097778],
    [17.0704743, 51.1129139],
    graphCar
);

//const pathTextBikeFoot = pathBikeFoot
//    .map(([lon, lat]) => `${lon} ${lat}`)
//    .join("\n");
//fs.writeFileSync(
//    "output/paths/dijkstra/dijkstraPathBikeFoot.txt",
//    pathTextBikeFoot
//);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync("output/paths/dijkstra/dijkstraPathCar.txt", pathTextCar);
