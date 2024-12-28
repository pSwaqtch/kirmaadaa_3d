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


// JavaScript remains the same as in the previous version
const jsonFileInput = document.getElementById('jsonFile');
const frameButtonsContainer = document.getElementById('frameButtons');
const frameDataContainer = document.getElementById('canvas');
const popup = document.getElementById('popup');

let frames = [];
let frameStates = new Map();

function showPopup(message) {
    popup.textContent = message;
    popup.style.display = 'block';
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

function toggleFrameData(index, button) {
    const frameDiv = document.getElementById(`frameData-${index}`);
    const isVisible = frameStates.get(index);
    
    if (isVisible) {
        frameDiv.classList.remove('visible');
        button.classList.remove('highlighted-button');
        frameStates.set(index, false);
        showPopup(`Frame ${index + 1} hidden`);
    } else {
        frameDiv.classList.add('visible');
        button.classList.add('highlighted-button');
        frameStates.set(index, true);
        showPopup(`Frame ${index + 1} shown`);
    }
}

function createFrameElements(frames) {
    frameButtonsContainer.innerHTML = '';
    frameDataContainer.innerHTML = '';
    frameStates.clear();

    frames.forEach((frameData, index) => {
        // Create button
        const button = document.createElement('button');
        button.textContent = `Frame ${index + 1}`;
        button.className = 'frame-button';
        button.onclick = () => toggleFrameData(index, button);
        frameButtonsContainer.appendChild(button);

        // Create frame data container
        const frameDiv = document.createElement('div');
        frameDiv.id = `frameData-${index}`;
        frameDiv.className = 'frame-data';
        frameDiv.innerHTML = `<strong>Frame ${index + 1} Data:</strong><pre>${JSON.stringify(frameData, null, 2)}</pre>`;
        frameDataContainer.appendChild(frameDiv);
        frameStates.set(index, false);
    });
}

jsonFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        frameButtonsContainer.innerHTML = '<div class="initial-message">No frames available yet.</div>';
        frameDataContainer.innerHTML = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const jsonContent = JSON.parse(e.target.result);
            
            frames = jsonContent.sort((a, b) => a.index - b.index).map(frame => 
                frame.map(value => {
                    if (typeof value === 'string' && /^[0-9A-Fa-f]+$/.test(value)) {
                        return parseInt(value, 16);
                    }
                    return value;
                })
            );

            createFrameElements(frames);
            showPopup('JSON file loaded successfully!');
        } catch (error) {
            frameDataContainer.innerHTML = 'Error: Invalid JSON file.';
            showPopup('Error: Invalid JSON file');
        }
    };

    reader.readAsText(file);
});



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

export { loadSliceData, loadSliceDataFromJSON, exportToCSV };
