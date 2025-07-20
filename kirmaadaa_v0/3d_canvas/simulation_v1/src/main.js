import "./style.css";

import { init, animate, onWindowResize } from "./scene";
import { setupFileInput } from "./utils";

// Variables for Three.js
const frameData = [];
let frameStates = new Map();
let frameGroups = new Map();
// frames = await loadSliceDataFromJSON("framedata.json");

window.addEventListener("resize", onWindowResize);

async function main() {
  setupFileInput(frameData, frameStates, frameGroups); // Setup file input listener
  init(frameData, frameStates, frameGroups);
  animate();

  // export both the cubeData and cubeDataJSON to a csv
  // exportToCSV(cubeData, "cubeData.csv");
  // exportToCSV(cubeData, "cubeDataJSON.csv");
}
main().catch(console.error);
