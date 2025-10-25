const graphCar = require("../output/graphs/graphCar.json");
const graphBikeFoot = require("../output/graphs/graphBikeFoot.json");
const fs = require("fs");

const heuristic = (nodeA, nodeB) => {
  return Math.sqrt(
    Math.pow(nodeA[0] - nodeB[0], 2) + Math.pow(nodeA[1] - nodeB[1], 2)
  );
};

const aStar = (startNode, endNode, graph) => {
  const openSet = new Map();
  const closedSet = new Map();

  graph.forEach((node) => {
    openSet.set(node.node.join(","), {
      g: Infinity,
      h: heuristic(node.node, endNode),
      f: Infinity,
      prev: null,
      edges: node.edges,
    });
  });

  openSet.get(startNode.join(",")).g = 0;
  openSet.get(startNode.join(",")).f = openSet.get(startNode.join(",")).h;

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
      console.log("No valid path found");
      return null;
    }
    if (lowestFKey === endNode.join(",")) {
      let path = [];
      let currentKey = lowestFKey;
      while (currentKey) {
        path.unshift(currentKey.split(",").map(Number));
        const node = closedSet.get(currentKey) || openSet.get(currentKey);
        if (!node || !node.prevKey) break;
        currentKey = node.prevKey;
      }
      path.unshift(startNode);
      console.log("Path found!");
      return path;
    }

    const currentNode = openSet.get(lowestFKey);
    openSet.delete(lowestFKey);
    closedSet.set(lowestFKey, {...currentNode, prevKey: currentNode.prevKey});
    currentNode.edges.forEach((edge) => {
      const neighborKey = [edge[0], edge[1]].join(",");
      const neighborNode = openSet.get(neighborKey);
      if (!neighborNode) return;
      if (closedSet.has(neighborKey)) return;
      let tentativeGScore = currentNode.g + edge[2];
      if (tentativeGScore < neighborNode.g) {
        neighborNode.g = tentativeGScore;
        neighborNode.f = neighborNode.g + neighborNode.h;
        neighborNode.prevKey = lowestFKey;
      }
    });
  }
  console.log("No valid path found");
  return null;
};

const pathBikeFoot = aStar(
  [17.054784, 51.1091578],
  [17.0525718, 51.1109826],
  graphBikeFoot
);
const pathCar = aStar(
  [17.0537461, 51.1097778],
  [17.0704743, 51.1129139],
  graphCar
);

const pathTextBikeFoot = pathBikeFoot
  .map(([lon, lat]) => `${lon} ${lat}`)
  .join("\n");
fs.writeFileSync("output/paths/A-Star/aStarPathBikeFoot.txt", pathTextBikeFoot);

const pathTextCar = pathCar.map(([lon, lat]) => `${lon} ${lat}`).join("\n");
fs.writeFileSync("output/paths/A-Star/aStarPathCar.txt", pathTextCar);

