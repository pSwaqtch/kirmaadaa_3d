import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

let camera, scene, renderer, controls, ambientLight, canvas;
let cubeData = [];

function init(cubeData) {
  // Select the canvas from the DOM
  canvas = document.getElementById("canvas");

  // Create the renderer using the existing canvas
  renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Create the scene
  scene = new THREE.Scene();

  // Create a camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 20;

  // Add a light for better visualization
  ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Add orbit controls
  controls = new OrbitControls(camera, renderer.domElement);

  const axesHelper = new THREE.AxesHelper(5);
  const axesHelperNeg = new THREE.AxesHelper(-5);
  scene.add(axesHelper, axesHelperNeg);

  addLabel("X+", { x: 6, y: 0, z: 0 });
  addLabel("Y+", { x: 0, y: 6, z: 0 });
  addLabel("Z+", { x: 0, y: 0, z: 6 });

  // Render the balls based on the data
  renderBalls(scene, cubeData);
}

// Function to render balls based on the cube data
function renderBalls(scene, frameData) {
  const ballRadius = 0.1; // Adjust the radius of the balls as needed
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
  const planes = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const rows = 8; // Number of rows
  const cols = 8; // Number of columns
  const spacing = 1; // Spacing between balls

  // Create 24 grids of balls with corresponding planes
  for (let i = 0; i < 24; i++) {
    const group = new THREE.Group(); // Group to hold balls and plane
    group.rotation.y = THREE.MathUtils.degToRad(i * 7.5);

    // Add balls in a grid pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (frameData[i][row][col] === 1) continue; // Skip if the value is 1
        const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone()); // Use a unique material
        ball.position.x = (col - (cols - 1) / 2) * spacing;
        ball.position.y = -(row - (rows - 1) / 2) * spacing;
        group.add(ball);
      }
    }

    // Create the plane
    const planeGeometry = new THREE.PlaneGeometry(8, 8);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.01, // Set transparency
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position and add the plane to the group
    group.add(plane);
    planes.push({ plane, group, sliceNumber: i }); // Store plane, group, and slice number

    // Add the group to the scene
    scene.add(group);
  }

  // Add event listener for mouse movement
  document.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Reset all planes and balls
    planes.forEach(({ plane, group }) => {
      plane.material.opacity = 0.01; // Reset plane opacity
      group.children.forEach((child) => {
        if (child.geometry.type === "SphereGeometry") {
          child.material.color.set(0xff0000); // Reset ball color to red
        }
      });
    });

    // Check for intersections
    const intersects = raycaster.intersectObjects(
      planes.map(({ plane }) => plane),
    );
    const tooltip = document.getElementById("tooltip");
    const tooltipText = document.getElementById("tooltip-slice");

    if (intersects.length > 0) {
      const intersectedPlane = intersects[0].object;
      intersectedPlane.material.opacity = 0.5; // Highlight the plane

      // Find the group associated with the intersected plane
      const { group, sliceNumber } = planes.find(
        ({ plane }) => plane === intersectedPlane,
      );

      // Set balls in the group to green
      group.children.forEach((child) => {
        if (child.geometry.type === "SphereGeometry") {
          child.material.color.set(0x00ff00); // Change ball color to green
        }
      });

      // Display the tooltip
      tooltipText.textContent = sliceNumber + 1;
      tooltip.style.left = `${event.clientX + 10}px`; // Position tooltip near the mouse
      tooltip.style.top = `${event.clientY + 10}px`;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none"; // Hide tooltip if not over a plane
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

function render() {
  renderer.render(scene, camera);
}

// Animation loop
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

export { init, animate, render, onWindowResize, camera, cubeData, scene };
