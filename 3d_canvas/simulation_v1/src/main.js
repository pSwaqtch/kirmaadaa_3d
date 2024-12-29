import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";

// Variables for Three.js
let camera, scene, renderer, controls, ambientLight, canvas;
let frames = [];
let frameStates = new Map();
let frameGroups = new Map();

// Main Execution
async function main() {
  setupFileInput(); // Setup file input listener
  init([]); // Initialize the scene and rendering
  animate(); // Start animation loop
}

window.addEventListener("resize", onWindowResize); // Handle window resizing

main().catch(console.error);

// File Input Setup Function
function setupFileInput() {
  const jsonFileInput = document.getElementById('jsonFile');
  
  jsonFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) {
      const frameButtonsContainer = document.getElementById('frameButtons');
      frameButtonsContainer.innerHTML = '<div class="initial-message">No frames available yet.</div>';
      document.getElementById('canvas').innerHTML = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result);
        
        frames = jsonContent.map(frame => 
          frame.map(value => {
            if (typeof value === 'string' && /^[0-9A-Fa-f]+$/.test(value)) {
              return parseInt(value, 16);
            }
            return value;
          })
        );

        // Create frame buttons
        createFrameElements(frames);
        console.log("frames");
        console.log(frames);
        showPopup('JSON file loaded successfully!');

        // Process the frame data for visualization
        const processedData = frames.map(frame => hexToMatrix(frame));
        
        // Clean up existing scene if any
        if (scene) {
          while(scene.children.length > 0) { 
            scene.remove(scene.children[0]); 
          }
        }

        // Initialize or reinitialize the visualization
        init(processedData);
        animate();

      } catch (error) {
        console.error('Error processing file:', error);
        document.getElementById('canvas').innerHTML = 'Error: Invalid JSON file.';
        showPopup('Error: Invalid JSON file');
      }
    };

    reader.readAsText(file);
  });
}

// Frame control functions
function createFrameElements(frames) {
  const frameButtonsContainer = document.getElementById('frameButtons');
  const frameDataContainer = document.getElementById('canvas');
  frameStates.clear();

  frameButtonsContainer.innerHTML = '';
  
  // Add Show All and Hide All buttons
  const showAllButton = document.createElement('button');
  showAllButton.textContent = 'Show All';
  showAllButton.className = 'control-button';
  showAllButton.onclick = () => {
    const frameButtons = document.querySelectorAll('.frame-button');
    frames.forEach((_, index) => {
      if (!frameStates.get(index)) {
        toggleFrameData(index, frameButtons[index]);
      }
    });
  };
  frameButtonsContainer.appendChild(showAllButton);

  const hideAllButton = document.createElement('button');
  hideAllButton.textContent = 'Hide All';
  hideAllButton.className = 'control-button';
  hideAllButton.onclick = () => {
    const frameButtons = document.querySelectorAll('.frame-button');
    frames.forEach((_, index) => {
      if (frameStates.get(index)) {
        toggleFrameData(index, frameButtons[index]);
      }
    });
  };
  frameButtonsContainer.appendChild(hideAllButton);
  
  // Create individual frame buttons
  frames.forEach((frame, index) => {
    const button = document.createElement('button');
    button.textContent = `Frame ${index + 1}`;
    button.className = 'frame-button';
    button.onclick = () => toggleFrameData(index, button);
    frameButtonsContainer.appendChild(button);

    const frameDiv = document.createElement('div');
    frameDiv.id = `frameData-${index}`;
    frameDiv.className = 'frame-data';
    frameDiv.innerHTML = `<strong>Frame ${index + 1} Data:</strong><pre>${JSON.stringify(frame, null, 2)}</pre>`;
    frameDataContainer.appendChild(frameDiv);
    frameStates.set(index, false);
  });
}

// Utility Functions
function showPopup(message) {
  const popup = document.getElementById('popup');
  popup.textContent = message;
  popup.style.display = 'block';
  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000);
}

function hexToMatrix(hexData) {
  const width = 8;
  const height = 8;

  // Initialize a matrix with zeros
  const matrix = Array.from({ length: height }, () => Array(width).fill(0));

  // Convert each word in the hexData to binary and map it to the matrix
  hexData.forEach((word, x) => {
    for (let y = 0; y < height; y++) {
      const bit = (word >> (y+8)) & 1; // Correct bit-shifting for each bit in the column
      matrix[y][x] = bit; // Fill matrix from bottom to top
    }
  });
  console.log(matrix);
  return matrix;
}

function toggleFrameData(index, button) {
  const frameDiv = document.getElementById(`frameData-${index}`);
  const isVisible = frameStates.get(index);
  const group = frameGroups.get(index);

  if (isVisible) {
    frameDiv.classList.remove('visible');
    button.classList.remove('highlighted-button');
    frameStates.set(index, false);
    if (group) {
      group.visible = false;
    }
    showPopup(`Frame ${index + 1} hidden`);
  } else {
    frameDiv.classList.add('visible');
    button.classList.add('highlighted-button');
    frameStates.set(index, true);
    if (group) {
      group.visible = true;
    }
    showPopup(`Frame ${index + 1} shown`);
  }
}

// Three.js Functions
function init(frameData) {
  canvas = document.getElementById("canvas");
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 20;

  ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  controls = new OrbitControls(camera, renderer.domElement);

  const axesHelper = new THREE.AxesHelper(5);
  const axesHelperNeg = new THREE.AxesHelper(-5);
  scene.add(axesHelper, axesHelperNeg);

  addLabel("X+", { x: 6, y: 0, z: 0 });
  addLabel("Y+", { x: 0, y: 6, z: 0 });
  addLabel("Z+", { x: 0, y: 0, z: 6 });

  if (frameData && frameData.length > 0) {
    renderBalls(scene, frameData);
  }
}

function renderBalls(scene, frameData) {
  const ballRadius = 0.1;
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const planes = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let cols = frameData[0][0].length;
  let rows = frameData[0].length;
  const spacing = 1;

  for (let i = 0; i < frameData.length; i++) {
    const group = new THREE.Group();
    group.rotation.y = THREE.MathUtils.degToRad(i * (360/(frameData.length*2)));
    group.visible = false;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (frameData[i][row][col] === 1) continue;
        const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone());
        ball.position.x = (col - (cols - 1) / 2) * spacing;
        ball.position.y = -(row - (rows - 1) / 2) * spacing;
        group.add(ball);
      }
    }

    const planeGeometry = new THREE.PlaneGeometry(8, 8);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.01,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    group.add(plane);
    planes.push({ plane, group, sliceNumber: i });
    scene.add(group);
    frameGroups.set(i, group);
  }

  document.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    planes.forEach(({ plane, group }) => {
      if (group.visible) {
        plane.material.opacity = 0.01;
        group.children.forEach((child) => {
          if (child.geometry.type === "SphereGeometry") {
            child.material.color.set(0xff0000);
          }
        });
      }
    });

    const visiblePlanes = planes.filter(({ group }) => group.visible);
    const intersects = raycaster.intersectObjects(
      visiblePlanes.map(({ plane }) => plane)
    );
    
    const tooltip = document.getElementById("tooltip");
    const tooltipText = document.getElementById("tooltip-slice");

    if (intersects.length > 0) {
      const intersectedPlane = intersects[0].object;
      intersectedPlane.material.opacity = 0.5;

      const { group, sliceNumber } = planes.find(
        ({ plane }) => plane === intersectedPlane
      );

      group.children.forEach((child) => {
        if (child.geometry.type === "SphereGeometry") {
          child.material.color.set(0x00ff00);
        }
      });

      tooltipText.textContent = sliceNumber + 1;
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }
  });
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

// Animation and Rendering Functions
function render() {
  renderer.render(scene, camera);
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
  render();
}
