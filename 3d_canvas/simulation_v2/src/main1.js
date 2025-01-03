import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// Global variables
let camera, scene, renderer, controls, ambientLight, canvas;
let frameData = [];
const spacing = 1; // Spacing between balls
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sliceGroups = new Map(); // Store slice groups for toggle functionality
let sliceStates = new Map(); // Track which slices are visible

// Initialize the scene and other Three.js components
function init() {
  canvas = document.getElementById("canvas");
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;

  ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);
  
  setupBasicSceneElements();
}

function setupBasicSceneElements() {
  const axesHelper = new THREE.AxesHelper(5);
  const axesHelperNeg = new THREE.AxesHelper(-5);
  scene.add(axesHelper, axesHelperNeg);

  addLabel("X+", { x: 6, y: 0, z: 0 });
  addLabel("Y+", { x: 0, y: 6, z: 0 });
  addLabel("Z+", { x: 0, y: 0, z: 6 });
}

function renderBalls(scene, matrixData, sliceIndex) {
  const ballRadius = 0.1;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  
  const group = new THREE.Group();
  const rows = matrixData.length;
  const cols = matrixData[0].length;
  group.rotation.y = THREE.MathUtils.degToRad(
    (sliceIndex + 1) * (360 / (frameData[0].length * 2)),
  );

  // Create group for this slice
  
  group.userData.sliceIndex = sliceIndex;
  
  

  // Create balls based on matrix data
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (matrixData[row][col] === 0) {
        const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone());
        ball.position.x = (col - (cols - 1) / 2) * spacing;
        ball.position.y = -(row - (rows - 1) / 2) * spacing;
        group.add(ball);
      }
    }
  }

  // Add interaction plane
  const planeGeometry = new THREE.PlaneGeometry(8, 8);
  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.01,
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  group.add(plane);
  
  // Store the group reference
  sliceGroups.set(sliceIndex, group);
  sliceStates.set(sliceIndex, true);
  
  scene.add(group);
  return group;
}

function addLabel(text, position) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "20px Arial";
  context.fillStyle = "white";
  context.fillText(text, 0, 20);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.position.set(position.x, position.y, position.z);
  scene.add(sprite);
}

function setupMouseInteraction() {
  document.addEventListener("mousemove", (event) => {
    const canvasRect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
    mouse.y = -((event.clientY - canvasRect.top) / canvasRect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Reset all visible groups to default state
    sliceGroups.forEach(group => {
      if (group.visible) {
        group.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry.type === "SphereGeometry") {
              child.material.color.set(0xff0000);
            } else if (child.geometry.type === "PlaneGeometry") {
              child.material.opacity = 0.01;
            }
          }
        });
      }
    });

    // Check for intersections with all visible planes
    const planes = Array.from(sliceGroups.values())
      .filter(group => group.visible)
      .map(group => group.children.find(child => child.geometry.type === "PlaneGeometry"));
    
    const intersects = raycaster.intersectObjects(planes);
    
    if (intersects.length > 0 ) {
      const intersectedPlane = intersects[0].object;
      const group = intersectedPlane.parent;
      
      // Highlight the intersected group
      intersectedPlane.material.opacity = 0.5;
      group.children.forEach(child => {
        if (child.geometry.type === "SphereGeometry") {
          child.material.color.set(0x00ff00);
        }
      });

      // Update tooltip
      const tooltip = document.getElementById("tooltip");
      const tooltipText = document.getElementById("tooltip-slice");
      tooltipText.textContent = group.userData.sliceIndex + 1;
      tooltip.style.left = `${event.clientX}px`;
      tooltip.style.top = `${event.clientY}px`;
      tooltip.style.display = "block";
    } else {
      document.getElementById("tooltip").style.display = "none";
    }
  });
}

function clearScene() {
  // Remove all slice groups
  sliceGroups.forEach(group => {
    scene.remove(group);
  });
  sliceGroups.clear();
  sliceStates.clear();
}

function createFrameElements(frames, resolution) {
  const frameButtonsContainer = document.getElementById("frameButtons");
  frameButtonsContainer.innerHTML = "";

  frames.forEach((frame, frameIndex) => {
    const frameButton = document.createElement("button");
    frameButton.textContent = `Frame ${frameIndex + 1}`;
    frameButton.className = "frame-button";
    
    frameButton.onclick = () => {
      document.querySelectorAll('.frame-button').forEach(btn => 
        btn.classList.remove('highlighted-button')
      );
      frameButton.classList.add('highlighted-button');
      
      const existingContainer = document.querySelector('.slice-data-container');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      createSliceElements(frame, frameIndex, resolution);
    };
    
    frameButtonsContainer.appendChild(frameButton);
  });
}

function createSliceElements(frame, frameIndex, resolution) {
  const sliceButtonsContainer = document.getElementById("sliceButtons");
  sliceButtonsContainer.innerHTML = "";

  // Clear existing scene except basic elements
  clearScene();
  setupBasicSceneElements();

  // Add Show All and Hide All buttons
  const showAllButton = document.createElement("button");
  showAllButton.textContent = "Show All";
  showAllButton.className = "control-button";
  showAllButton.onclick = () => {
    frame.forEach((slice, sliceIndex) => {
      if (!sliceGroups.has(sliceIndex)) {
        const matrix = hexToMatrix(slice, resolution);
        renderBalls(scene, matrix, sliceIndex);
      }
      const group = sliceGroups.get(sliceIndex);
      group.visible = true;
      sliceStates.set(sliceIndex, true);
    });
    updateSliceButtonsActiveState();
  };

  const hideAllButton = document.createElement("button");
  hideAllButton.textContent = "Hide All";
  hideAllButton.className = "control-button";
  hideAllButton.onclick = () => {
    frame.forEach((_, sliceIndex) => {
      if (sliceGroups.has(sliceIndex)) {
        const group = sliceGroups.get(sliceIndex);
        group.visible = false;
        sliceStates.set(sliceIndex, false);
      }
    });
    updateSliceButtonsActiveState();
  };

  sliceButtonsContainer.appendChild(showAllButton);
  sliceButtonsContainer.appendChild(hideAllButton);

  frame.forEach((slice, sliceIndex) => {
    const sliceButton = document.createElement("button");
    sliceButton.textContent = `Slice ${sliceIndex + 1}`;
    sliceButton.className = "slice-button";

    // Add active class if slice is visible
    if (sliceStates.get(sliceIndex)) {
      sliceButton.classList.add("active");
    }

    sliceButton.onclick = () => {
      const matrix = hexToMatrix(slice, resolution);

      // Toggle slice visibility
      if (sliceGroups.has(sliceIndex)) {
        const group = sliceGroups.get(sliceIndex);
        group.visible = !group.visible;
        sliceStates.set(sliceIndex, group.visible);
        sliceButton.classList.toggle("active");
      } else {
        // Create new slice if it doesn't exist
        const group = renderBalls(scene, matrix, sliceIndex);
        sliceButton.classList.add("active");
      }

      showPopup(`Slice ${sliceIndex + 1} toggled`);
    };

    sliceButtonsContainer.appendChild(sliceButton);
  });

  // Setup mouse interaction for all planes
  setupMouseInteraction();
}

function updateSliceButtonsActiveState() {
  const sliceButtons = document.querySelectorAll(".slice-button");
  sliceButtons.forEach((button, index) => {
    if (sliceStates.get(index)) {
      button.classList.add("active");
    } else {
      button.classList.remove("active");
    }
  });
}

function setupFileInput() {
  const jsonFileInput = document.getElementById("jsonFile");

  jsonFileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      document.getElementById("frameButtons").innerHTML = '<div class="initial-message">No frames available yet.</div>';
      document.getElementById("canvas").innerHTML = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result);
        const resolution = jsonContent.resolution;
        const rawFrames = jsonContent.data;

        frameData = rawFrames.map(frame => 
          frame.map(slice => 
            slice.map(value => 
              typeof value === "string" && /^[0-9A-Fa-f]+$/.test(value) ? parseInt(value, 16) : value
            )
          )
        );

        createFrameElements(frameData, resolution);
        showPopup("JSON file loaded successfully!");

      } catch (error) {
        console.error("Error processing file:", error);
        document.getElementById("canvas").innerHTML = "Error: Invalid JSON file.";
        showPopup("Error: Invalid JSON file");
      }
    };

    reader.readAsText(file);
  });
}

function hexToMatrix(hexData, resolution) {
  const { columns, rows } = resolution;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));

  hexData.forEach((word, x) => {
    for (let y = 0; y < rows; y++) {
      matrix[y][x] = (word >> (y+8)) & 1;
    }
  });

  return matrix;
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.display = "block";
  setTimeout(() => popup.style.display = "none", 3000);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add styles for button states
const style = document.createElement('style');
style.textContent = `
  .slice-button.active {
    background-color: #4DA1A9;
    color: white;
  }
`;
document.head.appendChild(style);

// Initialize application
function main() {
  init();
  setupFileInput();
  animate();
  window.addEventListener("resize", onWindowResize);
}

main();