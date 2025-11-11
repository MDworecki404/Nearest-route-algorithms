const network = require("../data/osm_wroclaw_roads.json");
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

class HalfEdge {
    constructor(id, V, oneway) {
        this.id = id;
        this.N = this;
        this.S = null;
        this.V = V;
        this.attributes = {
            oneway: oneway,
        };
    }
}

function makeEdge(v1, v2, oneway, azimuth) {
    const he1 = new HalfEdge(crypto.randomUUID(), v1, oneway);
    const he2 = new HalfEdge(crypto.randomUUID(), v2, oneway);
    he1.S = he2;
    he2.S = he1;
    he1.attributes.azimuth = azimuth;
    he2.attributes.azimuth = (azimuth + 180) % 360;
    return [he1, he2];
}

const halfEdges = [];

function calculateAzimuth(v1, v2) {
    function toRadians(degress) {
        return degress * (Math.PI / 180);
    }

    function toDegrees(radians) {
        return radians * (180 / Math.PI);
    }

    const lat1 = toRadians(v1[1]);
    const lat2 = toRadians(v2[1]);
    const deltaLon = toRadians(v2[0] - v1[0]);

    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);
    const bearing = Math.atan2(y, x);
    return (toDegrees(bearing) + 360) % 360;
}

function createHalfEdges(network, type) {
    network.features.forEach((feature) => {
        if (
            type &&
            !allowedFclass.get(type).includes(feature.properties.fclass)
        ) {
            return;
        }
        const coords = feature.geometry.coordinates.flat();
        for (let i = 0; i < coords.length - 1; i++) {
            const v1 = coords[i];
            const v2 = coords[i + 1];
            const azimuth = calculateAzimuth(v1, v2);
            const [he1, he2] = makeEdge(v1, v2, feature.properties.oneway, azimuth);

            if (feature.properties.oneway === "B") {
                he1.attributes.from = true
                he2.attributes.from = true
                halfEdges.push(he1, he2);
            } else if (feature.properties.oneway === "F") {
                he1.attributes.from = true
                he2.attributes.from = false
                halfEdges.push(he1, he2);
            }
        }
    });
}

const serializeHalfEdges = () => {
    const serialized = halfEdges.map((he) => ({
        id: he.id,
        V: he.V,
        S: he.S.V,
        attributes: {
            siblingID: he.S.id,
            oneway: he.attributes.oneway,
            azimuth: he.attributes.azimuth,
            distance: he.attributes.from === true ? Math.sqrt(
                Math.pow(he.S.V[0] - he.V[0], 2) + Math.pow(he.S.V[1] - he.V[1], 2)
            ) : 1e9
        },
    }));

    const vertexMap = new Map();
    serialized.forEach((he) => {
        const key = he.V.join(",");
        if (!vertexMap.has(key)) {
            vertexMap.set(key, []);
        }
        vertexMap.get(key).push(he);
    });

    const serializedWithNext = [];

    vertexMap.forEach((edges, v) => {

        edges.sort((a, b) => b.attributes.azimuth - a.attributes.azimuth);

        if (edges.length > 1) {
            for (let i = 0; i < edges.length; i++) {
                const current = edges[i];
                const next = edges[(i + 1) % edges.length];
                current.N = next.id;
                serializedWithNext.push(current);
            }
        } else {
            edges[0].N = edges[0].id;
            serializedWithNext.push(edges[0]);
        }
    });

    return serializedWithNext;
};

const carHalfEdgeWorkflow = () => {
    createHalfEdges(network, "car");
    const output = serializeHalfEdges();
    fs.writeFileSync(
        "output/halfEdges/halfEdges_car.json",
        JSON.stringify(output, null, 2)
    );
    halfEdges.length = 0;
};

const bikeFootHalfEdgeWorkflow = () => {
    createHalfEdges(network, "bikeFoot");
    const output = serializeHalfEdges();
    fs.writeFileSync(
        "output/halfEdges/halfEdges_bikeFoot.json",
        JSON.stringify(output, null, 2)
    );
    halfEdges.length = 0;
};

carHalfEdgeWorkflow();
bikeFootHalfEdgeWorkflow();
