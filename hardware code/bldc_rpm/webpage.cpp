// webpage.cpp
#include "include/webpage.h"

const char* WEBPAGE = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESC Speed & RPM</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        #speedValue, #rpmValue { font-size: 1.5em; margin: 10px; }
        #slider { width: 80%; max-width: 300px; }
    </style>
</head>
<body>
    <h1>ESC Speed Control & RPM</h1>
    <p>Use the slider below to control the motor speed:</p>
    <input type="range" id="slider" min="1000" max="2000" value="1000">
    <p>Current Speed: <span id="speedValue">1000</span> µs</p>
    <p>Current RPM: <span id="rpmValue">0</span></p>
    <script>
        const slider = document.getElementById('slider');
        const speedValue = document.getElementById('speedValue');
        const rpmValue = document.getElementById('rpmValue');
        const ws = new WebSocket('ws://' + location.host + ':81');

        slider.addEventListener('input', () => {
            speedValue.textContent = slider.value;
            ws.send(slider.value);
        });

        ws.onopen = () => console.log('WebSocket connected');
        ws.onclose = () => console.log('WebSocket disconnected');
        ws.onerror = error => console.error('WebSocket error:', error);

        setInterval(() => {
            fetch('/rpm')
                .then(response => response.text())
                .then(data => rpmValue.textContent = data);
        }, 1000);
    </script>
</body>
</html>
)rawliteral";
