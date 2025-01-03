import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Select the canvas from the DOM
const canvas = document.getElementById("myCanvas");

// Create the renderer using the existing canvas
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create the scene
const scene = new THREE.Scene();

// Create a camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.z = 20;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);

// Function to load the slice data from a file
async function loadSliceData(url) {
  const response = await fetch(url);
  const text = await response.text();

  // Split the text into lines
  const lines = text.split("\n");

  // Initialize the 3D array
  const slices = [];

  // Start from line 2 (index 1) and take groups of 8 lines, skipping 3 lines after each group
  for (let i = 1; i < lines.length; i += 10) {
    const slice = [];
    for (let j = 0; j < 8; j++) {
      const line = lines[i + j];
      if (!line) continue;

      // Split the line into numbers and parse them
      const row = line.trim().split(/\s+/).map(Number);
      slice.push(row);
    }
    slices.push(slice);
  }

  console.log(slices);
  return slices;
}

// Function to load slice data from a json file
async function loadSliceDataFromJSON(url) {
  // console.log(url);
  // print the data in json file, the url is the path to the json file
  const response = await fetch(url);
  const framedata = await response.json();
  // console.log(framedata);

  framedata.forEach((row, index) => {
    console.log(`Matrix ${index + 1}:`);
    // console.log(row);
    const matrix = hexToMatrix(row);
    console.log(matrix);
    framedata[index] = matrix;
  });

  return framedata;
}

function hexToMatrix(hexData) {
  // Convert a set of hexadecimal rows into an 8x8 binary matrix.
  // console.log(hexData);
  const width = 8;
  const height = 8;

  // Initialize a matrix with zeros
  const matrix = Array.from({ length: height }, () => Array(width).fill(0));

  // Convert each word in the hexData to binary and map it to the matrix
  hexData.forEach((word, x) => {
    // convert th estingc to hex
    //
    word = parseInt(word, 16);

    for (let y = 0; y < height; y++) {
      // Extract the bit corresponding to the position
      const bit = (word >> (y + 8)) & 1; // Shift right by (y + 8) to get the correct bit
      matrix[y][x] = bit;
    }
  });

  return matrix;
}

// Function to render balls based on the cube data
// Function to render balls based on the cube data
function renderBalls(scene, slices) {
  const ballRadius = 0.1; // Adjust the radius of the balls as needed
  const ballGeometry = new THREE.SphereGeometry(ballRadius, 16, 16);
  const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
  const planes = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const rows = 8; // Number of rows
  const cols = 8; // Number of columns
  const spacing = 1; // Spacing between balls
  const offset = (spacing * Math.sqrt(3)) / 2; // Vertical offset for hexagonal grid

  // Create 24 grids of balls with corresponding planes
  for (let i = 0; i < 24; i++) {
    const group = new THREE.Group(); // Group to hold balls and plane
    group.rotation.y = THREE.MathUtils.degToRad((i + 1) * 7.5);

    // Add balls in a hexagonal grid pattern
    // for (let row = 0; row < rows; row++) {
    //   for (let col = 0; col < cols - (row % 2); col++) {
    //     if (slices[i][row][col] === 8) continue; // Skip if the value is 1

    //     const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone()); // Use a unique material

    //     // Adjust positions for hexagonal pattern
    //     ball.position.x =
    //       (col - (cols - 1) / 2) * spacing + (row % 2 === 0 ? 0 : spacing / 2); // Alternate offset for rows
    //     ball.position.y = -(row - (rows - 1) / 2) * offset;

    //     group.add(ball);
    //   }
    // }

    // Add balls in a grid pattern
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (slices[i][row][col] === 1) continue; // Skip if the value is 1
        const ball = new THREE.Mesh(ballGeometry, ballMaterial.clone()); // Use a unique material
        ball.position.x = (col - (cols - 1) / 2) * spacing;
        ball.position.y = -(row - (rows - 1) / 2) * spacing;
        group.add(ball);
      }
    }

    // Create the plane
    const planeGeometry = new THREE.PlaneGeometry(rows, cols);
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

function exportToCSV(data, filename) {
  // Helper function to flatten an n-dimensional array
  function flattenArray(arr) {
    const result = [];
    function recursiveFlatten(subArray) {
      if (Array.isArray(subArray)) {
        subArray.forEach((item) => recursiveFlatten(item));
      } else {
        result.push(subArray);
      }
    }
    recursiveFlatten(arr);
    return result;
  }

  // Flatten the n-dimensional array into a 1D array
  const flattenedData = flattenArray(data);

  // Create CSV content
  const csvContent = flattenedData.join(",\n");

  // Create a Blob for the CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link to trigger the download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename || "data.csv");
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Main function to initialize the scene and load the data
async function main() {
  // Load the slice data
  // const cubeData = await loadSliceData("wireframe_plus_180_mtx.txt");

  const cubeData = await loadSliceDataFromJSON("framedata_plus.json");

  // create a 3d array of size [24][11][11] all 0 s
  // const cubeData = Array.from({ length: 24 }, () =>
  //   Array.from({ length: 8 }, () => Array(8).fill(0)),
  // );

  // Render the balls based on the data
  renderBalls(scene, cubeData);

  // export both the cubeData and cubeDataJSON to a csv
  // exportToCSV(cubeData, "cubeData.csv");
  // exportToCSV(cubeDataJSON, "cubeDataJSON.csv");

  // Add a light for better visualization
  const ambientLight = new THREE.AmbientLight(0xffffff, 1);
  scene.add(ambientLight);

  // Handle resizing
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // add xyz axes both for positive and negative directions
  const axesHelper = new THREE.AxesHelper(5);
  const axesHelperI = new THREE.AxesHelper(-5);
  scene.add(axesHelper, axesHelperI);

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

  addLabel("X+", { x: 6, y: 0, z: 0 });
  addLabel("Y+", { x: 0, y: 6, z: 0 });
  addLabel("Z+", { x: 0, y: 0, z: 6 });

  animate();
}

main().catch(console.error);
