import "./style.css";

import { init, animate, onWindowResize } from "./scene";
import { setupFileInput } from "./utils";

// Variables for Three.js
const frameData = [];
let frameStates = new Map();
let frameGroups = new Map();

window.addEventListener("resize", onWindowResize);

async function main() {
  setupFileInput(frameData, frameStates, frameGroups); 
  init(frameData, frameStates, frameGroups);
  animate();
}
main().catch(console.error);
