const network = require("../data/osm_wroclaw_roads.json");
const fs = require("fs");

/**
 * Konstrukcja grafu
 * @typedef {Object} Node
 * @property {number[]} node - [lat, lon]
 * @property {Array.<number[]>} edges - [[lat, lon, weight], ...]
 *
 * Przykład:
 * [
 *   {
 *     node: [lat, lon],
 *     edges: [
 *       [lat, lon, weight],
 *       // ...
 *     ]
 *   },
 *   // ...
 * ]
 */

let allowedFclass = new Map();
allowedFclass.set("car", [
    "motorway",
    "motorway_link",
    "trunk",
    "primary",
    "primary_link",
    "secondary",
    "secondary_link",
    "tertiary",
    "tertiary_link",
    "residential",
    "service",
    "living_street",
    "unclassified",
]);

allowedFclass.set("bikeFoot", [
    "footway",
    "pedestrian",
    "path",
    "cycleway",
    "steps",
    "service",
    "living_street",
    "track",
    "bridleway",
]);

const getUniqueNodes = (network, graphType) => {
    const nodes = new Map();
    network.features.forEach((feature) => {
        if (
            graphType &&
            allowedFclass.get(graphType).includes(feature.properties.fclass)
        ) {
            const coords = feature.geometry.coordinates;

            flatCoords(coords);
            function flatCoords(arr) {
                arr.forEach((item) => {
                    if (Array.isArray(item[0])) {
                        flatCoords(item);
                    } else {
                        nodes.set(item.join(","), item);
                    }
                });
            }
        }
    });
    return nodes;
};

const createGraph = (network, graphType) => {
    const uniqueNodes = getUniqueNodes(network, graphType);
    /** @type {Node[]} */
    let graph = [];
    // Użyj mapy do szybkiego dostępu do węzłów
    const nodeMap = new Map();
    uniqueNodes.forEach((node) => {
        const nodeObj = {
            node: node,
            oneway: false,
            edges: [],
        };
        graph.push(nodeObj);
        nodeMap.set(node.join(","), nodeObj);
    });

    network.features.forEach((feature) => {
        if (
            !graphType ||
            !allowedFclass.get(graphType)?.includes(feature.properties.fclass)
        ) {
            return;
        }
        let lines = [];
        if (feature.geometry.type === "LineString") {
            lines = [feature.geometry.coordinates];
        } else if (feature.geometry.type === "MultiLineString") {
            lines = feature.geometry.coordinates;
        }
        lines.forEach((line) => {
            for (let i = 0; i < line.length - 1; i++) {
                const from = line[i];
                const to = line[i + 1];
                const weight = Math.sqrt(
                    Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2)
                );
                const fromKey = from.join(",");
                const toKey = to.join(",");
                if (feature.properties.oneway === "F") {
                    // Jednokierunkowa: tylko from -> to
                    const fromNode = nodeMap.get(fromKey);
                    if (fromNode) {
                        fromNode.edges.push([to[0], to[1], weight]);
                        fromNode.oneway = true;
                    }
                } else if (feature.properties.oneway === "B") {
                    // Dwukierunkowa: obie strony
                    const fromNode = nodeMap.get(fromKey);
                    const toNode = nodeMap.get(toKey);
                    if (fromNode) {
                        fromNode.edges.push([to[0], to[1], weight]);
                        fromNode.oneway = false;
                    }
                    if (toNode) {
                        toNode.edges.push([from[0], from[1], weight]);
                        toNode.oneway = false;
                    }
                }
            }
        });
    });
    return graph;
};

const graphCar = createGraph(network, "car");
const graphBikeFoot = createGraph(network, "bikeFoot");

//Saving graph

fs.writeFileSync(
    "output/graphs/graphCar.json",
    JSON.stringify(graphCar, null, 2)
);
fs.writeFileSync(
    "output/graphs/graphBikeFoot.json",
    JSON.stringify(graphBikeFoot, null, 2)
);
