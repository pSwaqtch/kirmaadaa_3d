import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "stats.js";

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("canvas"),
  antialias: true,
});

// Orbit controls
let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 5;
controls.maxDistance = 15;
controls.maxPolarAngle = Math.PI / 2;

// Responsive canvas
function resizeCanvas() {
  const container = document.querySelector(".canvas-container");
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// LED board setup
const boardGeometry = new THREE.BoxGeometry(4.1, 4.1, 0.001);
const boardMaterial = new THREE.MeshPhongMaterial({
  color: 0x44444,
});
const board = new THREE.Mesh(boardGeometry, boardMaterial);
scene.add(board);

// Create LED grids
let frontLEDs, backLEDs;

function createLEDGrid(rows, cols, depth) {
  const group = new THREE.Group();
  const size = 4; // Adjust to fit the board
  const spacing = size / rows;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const ledGeometry = new THREE.BoxGeometry(
        spacing * 0.9,
        spacing * 0.9,
        0.001,
      );
      const ledMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
      });
      const led = new THREE.Mesh(ledGeometry, ledMaterial);

      led.position.set(
        -size / 2 + spacing / 2 + j * spacing,
        size / 2 - spacing / 2 - i * spacing,
        depth,
      );
      group.add(led);
    }
  }
  return group;
}

function recreateGrids(gridSize) {
  if (frontLEDs) board.remove(frontLEDs);
  if (backLEDs) board.remove(backLEDs);

  frontLEDs = createLEDGrid(gridSize, gridSize, 0.001);
  backLEDs = createLEDGrid(gridSize, gridSize, -0.001);

  board.add(frontLEDs);
  board.add(backLEDs);
}

recreateGrids(10); // Initial grid size

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

camera.position.z = 15;

// Animation controls
let rotationSpeed = 5;
let isClockwise = true;
let isPlaying = false;

// UI Elements
const speedControl = document.getElementById("speed-control");
const speedValue = document.getElementById("speed-value");
const gridSizeControl = document.getElementById("grid-size-control");
const gridSizeValue = document.getElementById("grid-size-value");
const btnCW = document.getElementById("btn-cw");
const btnCCW = document.getElementById("btn-ccw");
const btnToggle = document.getElementById("btn-toggle");
const ledFront = document.getElementById("led-front");
const ledBack = document.getElementById("led-back");

// Initial LED colors
let previousGridSize = parseInt(gridSizeControl.value); // Initial grid size
const initialGridSize = previousGridSize;
recreateGrids(initialGridSize); // Create the initial LED grid
initializeColors(initialGridSize); // Generate initial colors

// Event listeners
speedControl.addEventListener("input", (e) => {
  rotationSpeed = parseFloat(e.target.value);
  speedValue.textContent = rotationSpeed.toFixed(1);
});

// Update colors only if grid size changes
gridSizeControl.addEventListener("input", (e) => {
  const gridSize = parseInt(e.target.value);
  gridSizeValue.textContent = gridSize;

  if (gridSize !== previousGridSize) {
    previousGridSize = gridSize;

    // Recreate grids and generate new colors
    recreateGrids(gridSize);
    initializeColors(gridSize);
  }
});

btnCW.addEventListener("click", () => {
  isClockwise = true;
  btnCW.classList.add("active");
  btnCCW.classList.remove("active");
});

btnCCW.addEventListener("click", () => {
  isClockwise = false;
  btnCCW.classList.add("active");
  btnCW.classList.remove("active");
});

btnToggle.addEventListener("click", () => {
  isPlaying = !isPlaying;
  btnToggle.textContent = isPlaying ? "Pause" : "Play";
});

window.addEventListener("resize", () => {
  resizeCanvas(); // Ensure canvas resizes correctly
  const container = document.querySelector(".canvas-container");
  stats.dom.style.top = "10px"; // Keep stats panel within the canvas area
  stats.dom.style.left = "10px"; // Adjust position if needed
});

// Generate random color matrix
function getRandomColorMatrix(rows = 4, cols = 4) {
  const matrix = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(
        `#${Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0")}`,
      );
    }
    matrix.push(row);
  }
  // console log matrix but in a more readable way
  console.log(matrix.map((row) => row.join(" ")).join("\n"));
  return matrix;
}

function setLEDColors(group, matrix) {
  group.children.forEach((led, index) => {
    const row = Math.floor(index / matrix[0].length);
    const col = index % matrix[0].length;
    // led.material.color.set(matrix[row][col]);
  });
  group.children[0].material.emissive = new THREE.Color("gold");
  group.children[9].material.emissive = new THREE.Color("gold");
  group.children[90].material.emissive = new THREE.Color("gold");
  group.children[99].material.emissive = new THREE.Color("gold");
}

function initializeColors(gridSize) {
  // Generate initial color matrices
  const frontColorMatrix = getRandomColorMatrix(gridSize, gridSize);
  const backColorMatrix = getRandomColorMatrix(gridSize, gridSize);

  // Apply the colors to the LED grids
  setLEDColors(frontLEDs, frontColorMatrix);
  setLEDColors(
    backLEDs,
    backColorMatrix.map((row) => row.reverse()),
  );
  backColorMatrix.map((row) => row.reverse());

  // Update the preview panels
  updatePreview(ledFront, frontColorMatrix);
  updatePreview(ledBack, backColorMatrix);
}

function updatePreview(panel, matrix) {
  // Clear the existing SVG content
  panel.innerHTML = "";

  const rows = matrix.length;
  const cols = matrix[0].length;
  const svgNS = "http://www.w3.org/2000/svg";

  // Create the SVG element
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${cols} ${rows}`);
  panel.appendChild(svg);

  // Draw each rectangle (LED)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", j);
      rect.setAttribute("y", i);
      rect.setAttribute("width", 1);
      rect.setAttribute("height", 1);
      rect.setAttribute("fill", matrix[i][j]);
      svg.appendChild(rect);
    }
  }
}

// Initialize & Style the stats panel
const stats = new Stats();
stats.showPanel(0); // 0: FPS, 1: MS, 2: Memory
stats.dom.style.position = "absolute";
stats.dom.style.top = "25px";
stats.dom.style.left = "25px";
stats.dom.style.zIndex = "100";
document.querySelector(".canvas-container").appendChild(stats.dom);

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Begin tracking the frame
  stats.begin();

  if (isPlaying) {
    board.rotation.y += (isClockwise ? 1 : -1) * rotationSpeed * 0.02;
  }

  // controls.update(); // OrbitControls animation step
  renderer.render(scene, camera);

  // End tracking the frame and update stats
  stats.end();
}

animate();
