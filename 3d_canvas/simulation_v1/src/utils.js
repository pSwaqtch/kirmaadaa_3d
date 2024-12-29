import { init, animate, scene } from "./scene";

// File Input Setup Function
function setupFileInput(frames, frameStates, frameGroups) {
  const jsonFileInput = document.getElementById("jsonFile");

  jsonFileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) {
      const frameButtonsContainer = document.getElementById("frameButtons");
      frameButtonsContainer.innerHTML =
        '<div class="initial-message">No frames available yet.</div>';
      document.getElementById("canvas").innerHTML = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonContent = JSON.parse(e.target.result);

        frames = jsonContent.map((frame) =>
          frame.map((value) => {
            if (typeof value === "string" && /^[0-9A-Fa-f]+$/.test(value)) {
              return parseInt(value, 16);
            }
            return value;
          }),
        );

        // Create frame buttons
        createFrameElements(frames, frameStates, frameGroups);
        // console.log("frames");
        // console.log(frames);
        showPopup("JSON file loaded successfully!");

        // Process the frame data for visualization
        const processedData = frames.map((frame) => hexToMatrix(frame));

        // Clean up existing scene if any
        if (scene) {
          while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }
        }

        // Initialize or reinitialize the visualization
        init(processedData, frameStates, frameGroups);
        animate();
      } catch (error) {
        console.error("Error processing file:", error);
        document.getElementById("canvas").innerHTML =
          "Error: Invalid JSON file.";
        showPopup("Error: Invalid JSON file");
      }
    };

    reader.readAsText(file);
  });
}

// Frame control functions
function createFrameElements(frames, frameStates, frameGroups) {
  const frameButtonsContainer = document.getElementById("frameButtons");
  const frameDataContainer = document.getElementById("canvas");
  frameStates.clear();

  frameButtonsContainer.innerHTML = "";

  // Add Show All and Hide All buttons
  const showAllButton = document.createElement("button");
  showAllButton.textContent = "Show All";
  showAllButton.className = "control-button";
  showAllButton.onclick = () => {
    const frameButtons = document.querySelectorAll(".frame-button");
    frames.forEach((_, index) => {
      if (!frameStates.get(index)) {
        toggleFrameData(index, frameButtons[index], frameStates, frameGroups);
      }
    });
  };
  frameButtonsContainer.appendChild(showAllButton);

  const hideAllButton = document.createElement("button");
  hideAllButton.textContent = "Hide All";
  hideAllButton.className = "control-button";
  hideAllButton.onclick = () => {
    const frameButtons = document.querySelectorAll(".frame-button");
    frames.forEach((_, index) => {
      if (frameStates.get(index)) {
        toggleFrameData(index, frameButtons[index], frameStates, frameGroups);
      }
    });
  };
  frameButtonsContainer.appendChild(hideAllButton);

  // Create individual frame buttons
  frames.forEach((frame, index) => {
    const button = document.createElement("button");
    button.textContent = `Frame ${index + 1}`;
    button.className = "frame-button";
    button.onclick = () =>
      toggleFrameData(index, button, frameStates, frameGroups);
    frameButtonsContainer.appendChild(button);

    const frameDiv = document.createElement("div");
    frameDiv.id = `frameData-${index}`;
    frameDiv.className = "frame-data";
    frameDiv.innerHTML = `<strong>Frame ${index + 1} Data:</strong><pre>${JSON.stringify(frame, null, 2)}</pre>`;
    frameDataContainer.appendChild(frameDiv);
    frameStates.set(index, false);
  });
}

// Utility Functions
function showPopup(message) {
  const popup = document.getElementById("popup");
  popup.textContent = message;
  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
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
      const bit = (word >> (y + 8)) & 1; // Correct bit-shifting for each bit in the column
      matrix[y][x] = bit; // Fill matrix from bottom to top
    }
  });
  // console.log(matrix);
  return matrix;
}

function toggleFrameData(index, button, frameStates, frameGroups) {
  const frameDiv = document.getElementById(`frameData-${index}`);
  const isVisible = frameStates.get(index);
  const group = frameGroups.get(index);

  if (isVisible) {
    frameDiv.classList.remove("visible");
    button.classList.remove("highlighted-button");
    frameStates.set(index, false);
    if (group) {
      group.visible = false;
    }
    showPopup(`Frame ${index + 1} hidden`);
  } else {
    frameDiv.classList.add("visible");
    button.classList.add("highlighted-button");
    frameStates.set(index, true);
    if (group) {
      group.visible = true;
    }
    showPopup(`Frame ${index + 1} shown`);
  }
}

export { setupFileInput };
