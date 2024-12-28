import "./style.css";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { init, animate, onWindowResize } from "./scene";
import { loadSliceDataFromJSON } from "./utils";

const cubeData = await loadSliceDataFromJSON("framedata.json");

window.addEventListener("resize", onWindowResize);

async function main() {
  init(cubeData);
  animate();
  // export both the cubeData and cubeDataJSON to a csv
  // exportToCSV(cubeData, "cubeData.csv");
  // exportToCSV(cubeData, "cubeDataJSON.csv");
}
main().catch(console.error);
