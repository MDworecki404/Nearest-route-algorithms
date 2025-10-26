const halfEdgeCar = require("../output/halfEdges/halfEdges_car.json");
const halfEdgeBikeFoot = require("../output/halfEdges/halfEdges_bikeFoot.json");
const fs = require("fs");

const heuristic = (nodeA, nodeB) => {
    return Math.sqrt(
        Math.pow(nodeA[0] - nodeB[0], 2) + Math.pow(nodeA[1] - nodeB[1], 2)
    );
};

const aStar = (startNode, endNode, halfEdges) => {
    const valid = halfEdges.filter(
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

    const openSet = new Map();
    const closedSet = new Map();

    valid.forEach((he) => {
        const key = he.V.join(",");
        if (!openSet.has(key)) {
            openSet.set(key, {
                g: Infinity,
                h: heuristic(he.V, endNode),
                f: Infinity,
                prev: null,
                halfEdges: vertexToHalfEdges.get(key) || [],
            });
        }
    });

    const startKey = startNode.join(",");
    const endKey = endNode.join(",");

    openSet.get(startKey).g = 0;
    openSet.get(startKey).f = openSet.get(startKey).h;

    while (openSet.size > 0) {
        let lowestFKey = null;
        let lowestFValue = Infinity;

        openSet.forEach((value, key) => {
            if (value.f < lowestFValue) {
                lowestFValue = value.f;
                lowestFKey = key;
            }
        });

        if (lowestFKey === null || lowestFValue === Infinity) {
            return null;
        }

        if (lowestFKey === endNode.join(",")) {
            let path = [];
            let currentKey = lowestFKey;
            while (currentKey) {
                path.unshift(currentKey.split(",").map(Number));
                const node =
                    closedSet.get(currentKey) || openSet.get(currentKey);
                if (!node || !node.prevKey) break;
                currentKey = node.prevKey;
            }
            path.unshift(startNode);
            return path;
        }

        const currentNode = openSet.get(lowestFKey);
        openSet.delete(lowestFKey);
        closedSet.set(lowestFKey, {
            ...currentNode,
            prevKey: currentNode.prevKey,
        });
        currentNode.halfEdges.forEach((he) => {
            const neighbor = halfEdgeMap.get(he.siblingId);
            if (!neighbor) return;
            const neighborKey = neighbor.V.join(",");
            if (he.twoDirectional !== true) {
                if (!(he.from === he.id && he.to === neighbor.id)) {
                    return;
                }
            }
            const neighborNode = openSet.get(neighborKey);
            if (!neighborNode) return;
            if (closedSet.has(neighborKey)) return;
            let tentativeGScore = currentNode.g + he.distanceToSibling;
            if (tentativeGScore < neighborNode.g) {
                neighborNode.g = tentativeGScore;
                neighborNode.f = neighborNode.g + neighborNode.h;
                neighborNode.prevKey = lowestFKey;
            }
        });
    }
};

const pathBikeFoot = aStar(
    [17.054784, 51.1091578],
    [17.0525718, 51.1109826],
    halfEdgeBikeFoot
);
const pathCar = aStar(
    [17.0537461, 51.1097778],
    [17.0704743, 51.1129139],
    halfEdgeCar
);

const pathTextBikeFoot = pathBikeFoot
    .map(([lon, lat]) => `${lon} ${lat}`)
    .join("\n");
fs.writeFileSync(
    "output/paths/A-Star/aStarHalfEdgePathBikeFoot.txt",
    pathTextBikeFoot
);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync("output/paths/A-Star/aStarHalfEdgePathCar.txt", pathTextCar);
