const { execSync } = require("child_process");
const fs = require("fs");

const results = [];

function runScript(script) {
    try {
        const startTime = new Date().getTime();
        console.log(`\n--- Uruchamiam: ${script} ---`);
        execSync(`node ${script}`, { stdio: "inherit" });
        const endTime = new Date().getTime();
        results.push({ script, duration: endTime - startTime });
    } catch (err) {
        console.error(`Błąd podczas uruchamiania ${script}:`, err.message);
        process.exit(1);
    }
}

runScript("graph/createGraph.js");
runScript("half-edge/createHalfEdges.js");
runScript("dijkstra/dijkstraGraph.js");
runScript("dijkstra/dijkstraHalfEdge.js");
runScript("a-star/A-StarGraph.js");
runScript("a-star/A-StarHalfEdges.js");

fs.writeFileSync(
    "output/mainWorkflowResults.json",
    JSON.stringify(results, null, 2)
);
