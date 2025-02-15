const electron = require("electron");
const ipc = electron.ipcRenderer;

const containerDiv = document.getElementById("container");

const displayCanvas = document.createElement('canvas'); // For Display
document.body.appendChild(displayCanvas);
displayCanvas.setAttribute('class', `display-canvas`)
const displayCtx = displayCanvas.getContext('2d');

const fullCanvas = document.createElement('canvas'); // For Full-Resolution Cropping
const fullCtx = fullCanvas.getContext('2d');

displayCanvas.width = window.innerWidth;
displayCanvas.height = window.innerHeight;

const img = new Image();
ipc.on('screenshot-data', (event, imgData)=>{
    img.src = imgData;
})

img.onload = () => {
  // Draw Full-Resolution Image Off-Screen
  fullCanvas.width = img.width;
  fullCanvas.height = img.height;
  fullCtx.drawImage(img, 0, 0);

  // Draw Scaled Image for Display
  const scaleX = displayCanvas.width / img.width;
  const scaleY = displayCanvas.height / img.height;
  const scale = Math.min(scaleX, scaleY);
  const scaledWidth = img.width * scaleX;
  const scaledHeight = img.height * scaleY;
  const offsetX = (displayCanvas.width - scaledWidth) / 2;
  const offsetY = (displayCanvas.height - scaledHeight) / 2;

  displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
  displayCtx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
};

// Capture Clicks for Cropping
let points = [];
displayCanvas.addEventListener('click', (e) => {
  const rect = displayCanvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (displayCanvas.width / rect.width);
  const y = (e.clientY - rect.top) * (displayCanvas.height / rect.height);

  points.push({ x, y });

  displayCtx.fillStyle = 'red';
  displayCtx.beginPath();
  displayCtx.arc(x, y, 5, 0, Math.PI * 2);
  displayCtx.fill();

  if (points.length === 2) {
    cropFromFullResolution(points);
    points = [];
  }
});

// Crop from Full-Resolution Image
function cropFromFullResolution([start, end]) {
  const scaleX = fullCanvas.width / displayCanvas.width;
  const scaleY = fullCanvas.height / displayCanvas.height;

  const cropX = Math.min(start.x, end.x) * scaleX;
  const cropY = Math.min(start.y, end.y) * scaleY;
  const cropWidth = Math.abs(end.x - start.x) * scaleX;
  const cropHeight = Math.abs(end.y - start.y) * scaleY;

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  // Crop from Full-Resolution Canvas
  croppedCtx.drawImage(
    fullCanvas,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  document.body.appendChild(croppedCanvas); // Show the cropped image
  const croppedDataURL = croppedCanvas.toDataURL('image/png');
  ipc.send('cropped-screenshot', croppedDataURL);
  console.log('Cropped Image URL:', croppedDataURL);
}


document.addEventListener("DOMContentLoaded", () => {
  ipc.send("child-ready");
});
