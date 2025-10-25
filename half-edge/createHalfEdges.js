const network = require("../data/osm_wroclaw_roads_cliped.json");
const fs = require("fs");

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

let halfEdgeIdCounter = 0;

class HalfEdge {
    constructor(V, oneway) {
        this.id = halfEdgeIdCounter++;
        this.N = this;
        this.S = null;
        this.V = V;
        this.oneway = oneway;
    }
}

const makeEdge = (v1, v2, oneway) => {
    const he1 = new HalfEdge(v1, oneway);
    const he2 = new HalfEdge(v2, oneway);
    he1.S = he2;
    he2.S = he1;
    return he1;
};

const splice = (he1, he2) => {
    let temp = he1.N;
    he1.N = he2.N;
    he2.N = temp;
};

let halfEdges = [];
let vertexToHalfEdges = new Map();

const createHalfEdges = (network, type) => {
    network.features.forEach((feature) => {
        if (!allowedFclass.get(type).includes(feature.properties.fclass)) {
            return;
        }
        const coords = feature.geometry.coordinates.flat();

        for (let i = 0; i < coords.length - 1; i++) {
            const he = makeEdge(
                coords[i],
                coords[i + 1],
                feature.properties.oneway
            );
            halfEdges.push(he);
            halfEdges.push(he.S);

            const key1 = coords[i].join(",");
            const key2 = coords[i + 1].join(",");

            if (!vertexToHalfEdges.has(key1)) {
                vertexToHalfEdges.set(key1, []);
            }
            if (!vertexToHalfEdges.has(key2)) {
                vertexToHalfEdges.set(key2, []);
            }

            vertexToHalfEdges.get(key1).push(he);
            vertexToHalfEdges.get(key2).push(he.S);
        }
    });
    vertexToHalfEdges.forEach((edges, vertex) => {
        if (edges.length > 1) {
            for (let i = 0; i < edges.length; i++) {
                const current = edges[i];
                const next = edges[(i + 1) % edges.length];
                splice(current, next);
            }
        }
    });
};

createHalfEdges(network, "car");

const serializeHalfEdges = (halfEdges) => {
    return halfEdges.map((he) => {
        if (he.oneway === "F" && he.id < he.S.id) {
            return {
                id: he.id,
                V: he.V,
                siblingId: he.S ? he.S.id : null,
                distanceToSibling: he.S
                    ? Math.sqrt(
                          Math.pow(he.V[0] - he.S.V[0], 2) +
                              Math.pow(he.V[1] - he.S.V[1], 2)
                      )
                    : null,
                twoDirectional: false,
                from: he.id,
                to: he.S.id,
            };
        } else if (he.oneway === "F" && he.id > he.S.id) {
            return {
                id: he.id,
                V: he.V,
                siblingId: he.S ? he.S.id : null,
                distanceToSibling: he.S
                    ? Math.sqrt(
                          Math.pow(he.V[0] - he.S.V[0], 2) +
                              Math.pow(he.V[1] - he.S.V[1], 2)
                      )
                    : null,
                twoDirectional: false,
                from: he.S.id,
                to: he.id,
            };
        } else if (he.oneway === "B") {
            return {
                id: he.id,
                V: he.V,
                siblingId: he.S ? he.S.id : null,
                distanceToSibling: he.S
                    ? Math.sqrt(
                          Math.pow(he.V[0] - he.S.V[0], 2) +
                              Math.pow(he.V[1] - he.S.V[1], 2)
                      )
                    : null,
                twoDirectional: true,
            };
        }
    });
};

const serializedHalfEdges = serializeHalfEdges(halfEdges);

console.log(serializedHalfEdges);
