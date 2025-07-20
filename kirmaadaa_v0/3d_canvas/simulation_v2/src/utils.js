import { init, animate, scene } from "./scene";

let frames = [];
let frameStates = new Map();
let frameGroups = new Map();

function setupFileInput(frames, frameStates, frameGroups) {
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

        frames = rawFrames.map(frame => 
          frame.map(slice => 
            slice.map(value => 
              typeof value === "string" && /^[0-9A-Fa-f]+$/.test(value) ? parseInt(value, 16) : value
            )
          )
        );

        createFrameElements(frames, frameStates, frameGroups, resolution);
        showPopup("JSON file loaded successfully!");

        const processedData = frames.map(frame => 
          frame.map(slice => hexToMatrix(slice, resolution))
        );

        if (scene) {
          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }
        }

        init(processedData, frameStates, frameGroups);
        animate();
      } catch (error) {
        console.error("Error processing file:", error);
        document.getElementById("canvas").innerHTML = "Error: Invalid JSON file.";
        showPopup("Error: Invalid JSON file");
      }
    };

    reader.readAsText(file);
  });
}

function createFrameElements(frames, frameStates, frameGroups, resolution) {
  const frameButtonsContainer = document.getElementById("frameButtons");
  frameButtonsContainer.innerHTML = "";
  frameStates.clear();

  frames.forEach((frame, frameIndex) => {
    const frameButton = document.createElement("button");
    frameButton.textContent = `Frame ${frameIndex + 1}`;
    frameButton.className = "frame-button";
    
    frameButton.onclick = () => {
      // Remove highlight from other frame buttons
      document.querySelectorAll('.frame-button').forEach(btn => 
        btn.classList.remove('highlighted-button')
      );
      frameButton.classList.add('highlighted-button');
      
      // Clear previous slice data container
      const existingContainer = document.querySelector('.slice-data-container');
      if (existingContainer) {
        existingContainer.remove();
      }
      
      createSliceElements(frame, frameIndex, frameGroups, resolution);
    };
    
    frameButtonsContainer.appendChild(frameButton);
    frameStates.set(frameIndex, false);
  });
}

function createSliceElements(frame, frameIndex, frameGroups, resolution) {
  const sliceButtonsContainer = document.getElementById("sliceButtons");
  sliceButtonsContainer.innerHTML = "";
  
  // Create slice data container
  const sliceDataContainer = document.createElement("div");
  sliceDataContainer.className = "slice-data-container";
  document.body.appendChild(sliceDataContainer);

  frame.forEach((slice, sliceIndex) => {
    const sliceButton = document.createElement("button");
    sliceButton.textContent = `Slice ${sliceIndex + 1}`;
    sliceButton.className = "slice-button";
    
    const sliceDiv = document.createElement("div");
    sliceDiv.id = `sliceData-${frameIndex}-${sliceIndex}`;
    sliceDiv.className = "slice-data";
    sliceDiv.style.display = "none";
    sliceDiv.innerHTML = `
      <h3>Slice ${sliceIndex + 1}</h3>
      <pre>${JSON.stringify(slice, null, 2)}</pre>
    `;
    sliceDataContainer.appendChild(sliceDiv);

    sliceButton.onclick = () => {
      const group = frameGroups.get(sliceIndex);
      const isVisible = sliceDiv.style.display === "block";

      if (isVisible) {
        sliceDiv.style.display = "none";
        sliceButton.classList.remove("highlighted-button");
        if (group) group.visible = false;
      } else {
        sliceDiv.style.display = "block";
        sliceButton.classList.add("highlighted-button");
        if (group) group.visible = true;
      }

      const hasVisibleSlices = [...sliceDataContainer.children]
        .some(div => div.style.display === "block");
      sliceDataContainer.style.display = hasVisibleSlices ? "block" : "none";
      
      showPopup(`Slice ${sliceIndex + 1} ${isVisible ? 'hidden' : 'shown'}`);
    };

    sliceButtonsContainer.appendChild(sliceButton);
  });
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.display = "block";
  setTimeout(() => popup.style.display = "none", 3000);
}

function hexToMatrix(hexData, resolution) {
  const { columns, rows } = resolution;
  const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));

  hexData.forEach((word, x) => {
    for (let y = 0; y < rows; y++) {
      matrix[y][x] = (word >> y) & 1;
    }
  });

  return matrix;
}

export { setupFileInput };