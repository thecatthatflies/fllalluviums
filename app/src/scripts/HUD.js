import { camera, cameraForward, body } from "./Scene.js";
import { time } from "./Time.js";

let hudPanel;
let hudToggle;
let hudVisible = true;

let startX = 0, startY = 0, startZ = 0;
let startRecorded = false;

let depthValue, directionValue, tetherValue, lightValue, tempValue, timeValue;

export function Start() {
     // Container
     const hudContainer = document.createElement("div");
     hudContainer.className = "hud-container";

     // Toggle button
     hudToggle = document.createElement("button");
     hudToggle.className = "hud-toggle";
     hudToggle.textContent = "▾ Dive Info";
     hudToggle.onclick = function (e) {
          e.stopPropagation();
          hudVisible = !hudVisible;
          hudPanel.style.display = hudVisible ? "block" : "none";
          hudToggle.textContent = hudVisible ? "▾ Dive Info" : "▸ Dive Info";
     };
     hudContainer.appendChild(hudToggle);

     // Panel
     hudPanel = document.createElement("div");
     hudPanel.className = "hud-panel";

     depthValue = createRow("Depth", hudPanel);
     directionValue = createRow("Heading", hudPanel);
     tetherValue = createRow("Tether", hudPanel);
     lightValue = createRow("Light", hudPanel);
     tempValue = createRow("Temp", hudPanel);
     timeValue = createRow("Dive Time", hudPanel);

     hudContainer.appendChild(hudPanel);
     body.appendChild(hudContainer);
}

function createRow(label, parent) {
     const row = document.createElement("div");
     row.className = "hud-row";

     const labelSpan = document.createElement("span");
     labelSpan.className = "hud-label";
     labelSpan.textContent = label;
     row.appendChild(labelSpan);

     const valueSpan = document.createElement("span");
     valueSpan.className = "hud-value";
     row.appendChild(valueSpan);

     parent.appendChild(row);
     return valueSpan;
}

function getCardinalDirection() {
     const fx = cameraForward.x;
     const fz = cameraForward.z;
     // atan2 of the horizontal forward projection; -Z = North
     const angle = Math.atan2(fx, -fz);
     const deg = ((angle * 180 / Math.PI) + 360) % 360;
     const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
     const index = Math.round(deg / 45) % 8;
     return dirs[index] + " (" + Math.round(deg) + "°)";
}

function getDistanceFromStart() {
     const dx = camera.position.x - startX;
     const dy = camera.position.y - startY;
     const dz = camera.position.z - startZ;
     return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getTetherQuality(dist) {
     if (dist < 20) return "Excellent";
     if (dist < 80) return "Good";
     if (dist < 200) return "Fair";
     if (dist < 400) return "Weak";
     if (dist < 700) return "Poor";
     return "Critical";
}

function getTetherColor(dist) {
     if (dist < 20) return "#4ade80";
     if (dist < 80) return "#a3e635";
     if (dist < 200) return "#facc15";
     if (dist < 400) return "#fb923c";
     if (dist < 700) return "#f87171";
     return "#ef4444";
}

function getLightLevel(depth) {
     // Exponential light falloff underwater
     const light = Math.max(0, 100 * Math.exp(-depth / 80));
     return Math.round(light * 10) / 10;
}

function getTemperature(depth) {
     // Thermocline model: warm surface, cold deep
     const surfaceTemp = 24;
     const deepTemp = 2;
     const thermoclineRate = 100;
     const temp = deepTemp + (surfaceTemp - deepTemp) * Math.exp(-depth / thermoclineRate);
     return Math.round(temp * 10) / 10;
}

function formatTime(seconds) {
     const hrs = Math.floor(seconds / 3600);
     const mins = Math.floor((seconds % 3600) / 60);
     const secs = Math.floor(seconds % 60);
     if (hrs > 0) return hrs + "h " + mins + "m " + secs + "s";
     if (mins > 0) return mins + "m " + secs + "s";
     return secs + "s";
}

export function Update() {
     if (!hudVisible) return;

     if (!startRecorded) {
          startX = camera.position.x;
          startY = camera.position.y;
          startZ = camera.position.z;
          startRecorded = true;
     }

     const depth = Math.max(0, -camera.position.y);
     const dist = getDistanceFromStart();

     depthValue.textContent = (Math.round(depth * 10) / 10) + " m";
     directionValue.textContent = getCardinalDirection();

     const tetherText = getTetherQuality(dist);
     tetherValue.textContent = tetherText;
     tetherValue.style.color = getTetherColor(dist);

     const light = getLightLevel(depth);
     lightValue.textContent = light + "%";
     // Dim text as light decreases
     const lum = Math.round(80 + light * 1.4);
     lightValue.style.color = "rgb(" + lum + "," + Math.min(255, lum + 15) + "," + Math.min(255, lum + 30) + ")";

     tempValue.textContent = getTemperature(depth) + "°C";
     timeValue.textContent = formatTime(time);
}
