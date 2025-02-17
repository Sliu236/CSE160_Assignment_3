// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
    v_UV = a_UV;
  }`


// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
    gl_FragColor = vec4(v_UV, 1.0, 1.0);
  }
`;
  


let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;


let g_globalAngle = 0.0;
let g_fishMoving = false;


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    //gl = getWebGLContext(canvas);
    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() { 
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
      console.log('Failed to get the storage location of u_FragColor');
      return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
      console.log('Failed to get the storage location of u_ModelMatrix');
      return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
      console.log('Failed to get the storage location of u_GlobalRotateMatrix');
      return;
    }

    var identitiyM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identitiyM.elements);
}

function convertCoordinatesEventToGL(ev) {
  let rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;

  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);

  return [x, y];
}

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables
let g_selectedColor = [1.0, 1.0, 1.0, 1.0]; // White
let g_selectedSize = 5; // Default point size
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_yellowAngle = 0.0;
let g_magentaAngle = 0;
let g_fishAnimation = false;
let g_bodyBendAngle = 0.0;
let g_headSwing = 0.0;
let g_tailSwing = 0.0;
let g_pitchAngle = 0.0;
let g_fishPosX = 0.0;
let g_fishPosY = 0.0;

function addActionForHtmlUI() {
  // Button Event
  document.getElementById('AnimationYellowOnButton').addEventListener('click', function() { g_fishAnimation=true;});
  document.getElementById('AnimationYellowOffButton').addEventListener('click', function() {g_fishAnimation = false; g_headSwing = 0; g_tailSwing = 0; renderScene();});

  document.getElementById('bodyBendSlide').addEventListener('mousemove', function() { g_bodyBendAngle = this.value * 0.1; renderScene();});
  document.getElementById('headSwingSlider').addEventListener('input', function() {g_headSwing = parseFloat(this.value);renderScene();});
  document.getElementById('tailSwingSlider').addEventListener('input', function() {g_tailSwing = parseFloat(this.value);renderScene();});

  
  document.getElementById('angleSlide').addEventListener('input', function() { g_globalAngle = parseFloat(this.value); renderScene();});
  document.getElementById('pitchSlide').addEventListener('input', function() {g_pitchAngle = parseFloat(this.value);renderScene();});

  document.getElementById('ResetFishButton').addEventListener('click', resetFish);
  document.getElementById('ResetCameraButton').addEventListener('click', resetCamera);

  canvas.addEventListener("mousedown", function (ev) {g_mouseDragging = true; g_lastMouseX = ev.clientX; g_lastMouseY = ev.clientY;});

  canvas.addEventListener("mousemove", function (ev) {
    if (g_mouseDragging) {
          let dx = ev.clientX - g_lastMouseX;
          let dy = ev.clientY - g_lastMouseY;
          g_globalAngle += dx * 0.5;  
          g_pitchAngle -= dy * 0.5;
          g_pitchAngle = Math.max(-90, Math.min(90, g_pitchAngle));
          g_lastMouseX = ev.clientX;
          g_lastMouseY = ev.clientY;
          
          renderScene();
      }});
}

function main() {

  setupWebGL(); // WebGL Initialization

  connectVariablesToGLSL(); // GLSL Variables Connection

  addActionForHtmlUI(); // HTML UI Event Handling

  // Register function (event handler) to be called on a mouse press
  //canvas.onmousedown = click;
  canvas.onmousedown = click;
  canvas.onmousemove  = function(ev) { if (ev.buttons == 1) click(ev); }; // click and drag

  // Specify the color for clearing <canvas>
  gl.clearColor(0.678, 0.847, 1, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  console.log(performance.now());

  g_seconds = performance.now()/1000.0 - g_startTime;

  updateAnimationAngles();

  renderScene();

  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_fishAnimation) {
      g_headSwing = 15 * Math.sin(g_seconds * 2);  // Fish head
      g_tailSwing = 20 * Math.sin(g_seconds * 2 + Math.PI);  // Fish Tail
  }

  if (g_fishMoving) {
      let speed = 0.002;
      let angle = Math.sin(g_seconds) * Math.PI * 2;

      let newX = g_fishPosX + speed * Math.cos(angle);
      let newY = g_fishPosY + speed * Math.sin(angle);

      g_fishPosX = Math.max(-0.5, Math.min(0.5, newX));
      g_fishPosY = Math.max(-0.5, Math.min(0.5, newY));
  }
}


function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  if (ev.shiftKey) {
      console.log("Shift + Click detected, triggering continuous movement!");

      g_fishAnimation = true; 
      g_fishMoving = !g_fishMoving; 
  }

  renderScene();
}


function renderFishBody() {
  let fishMatrix = new Matrix4();
  fishMatrix.setTranslate(g_fishPosX, g_fishPosY, 0); 

  let fishHeights = [1, 2, 2.5, 3.5, 5.2, 4.3, 3.5, 2.5, 4.0, 5];
  let fishColors = [
      [1.0, 0.5, 0.0, 1.0], [1.0, 0.5, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0],
      [1.0, 0.5, 0.0, 1.0], [0.0, 0.0, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0],
      [1.0, 0.5, 0.0, 1.0], [1.0, 1.0, 1.0, 1.0], [1.0, 0.5, 0.0, 1.0],
      [0.0, 0.0, 0.0, 1.0]
  ];

  let baseWidth = 0.08, baseDepth = 0.1, heightFactor = 0.1;
  let eyeSize = 0.05, eyeOffsetZ = baseDepth / 2;
  let gap = 0.01, totalWidth = fishHeights.length * (baseWidth + gap);
  let startX = -totalWidth / 2;
  let yOffsets = [0, -0.1, -0.15, -0.25, -0.38, -0.30, -0.25, -0.15, -0.3, -0.4];
  let centerX = startX + 4 * (baseWidth + gap) + baseWidth / 2;

  let decayFactor = 0.6;  

  for (let i = 0; i < fishHeights.length; i++) {
      let part = new Cube();
      part.color = fishColors[i] || [0.0, 0.5, 1.0, 1.0];

      let currentHeight = fishHeights[i] * heightFactor;
      let xPos = startX + i * (baseWidth + gap) + baseWidth / 2;
      
      let yPos = (g_bodyBendAngle > 0) ? yOffsets[4] + fishHeights[4] * heightFactor - currentHeight + 0.3 :
                 (g_bodyBendAngle < 0) ? yOffsets[4] + 0.2 :
                 yOffsets[i] + currentHeight / 2;

      part.matrix = new Matrix4(fishMatrix);
      part.matrix.translate(xPos, yPos, 0);
      
      // Head Swing
      if (i < 5) {
          let swingAngle = g_headSwing * Math.pow(decayFactor, i);
          part.matrix.translate(centerX - xPos, 0, 0);
          part.matrix.rotate(swingAngle, 0, 1, 0);
          part.matrix.translate(-(centerX - xPos), 0, 0);
      }

      // Tail Swing
      if (i > 4) {
          let swingAngle = -g_tailSwing * Math.pow(decayFactor, 9 - i);
          part.matrix.translate(centerX - xPos, 0, 0);
          part.matrix.rotate(swingAngle, 0, 1, 0);
          part.matrix.translate(-(centerX - xPos), 0, 0);
      }
    
      part.matrix.scale(baseWidth, currentHeight, baseDepth);
      part.render();


      // eyes of fish
      if (i === 1) {
          let leftEye = new Cube(), rightEye = new Cube();
          leftEye.color = [0.0, 0.0, 0.0, 1.0];  
          rightEye.color = [0.0, 0.0, 0.0, 1.0]; 

          let eyeX = xPos, eyeY = yPos + 0.07;
          let eyeZFront = eyeOffsetZ + 0.04, eyeZBack = -eyeOffsetZ + 0.03;

          let swingAngle = g_headSwing * Math.pow(decayFactor, 1);

          leftEye.matrix = new Matrix4(fishMatrix);
          leftEye.matrix.translate(eyeX, eyeY, eyeZFront);
          leftEye.matrix.translate(centerX - eyeX, 0, 0);
          leftEye.matrix.rotate(swingAngle, 0, 1, 0);
          leftEye.matrix.translate(-(centerX - eyeX), 0, 0);
          leftEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.5);
          leftEye.render();

          rightEye.matrix = new Matrix4(fishMatrix);
          rightEye.matrix.translate(eyeX, eyeY, eyeZBack);
          rightEye.matrix.translate(centerX - eyeX, 0, 0);
          rightEye.matrix.rotate(swingAngle, 0, 1, 0);
          rightEye.matrix.translate(-(centerX - eyeX), 0, 0);
          rightEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.5);
          rightEye.render();
      }
  }
}

function renderUnderwaterMountains() {
  // Tetrahed Position
  let tetrahedronPositions = [
      { x: -0.8, y: -0.7, scale: 0.3, color: [0.6, 0.3, 0.1, 1.0] }, 
      { x: -0.6, y: -0.75, scale: 0.2, color: [0.5, 0.3, 0.2, 1.0] }, 
      { x: -0.4, y: -0.65, scale: 0.35, color: [0.7, 0.4, 0.2, 1.0] }, 
      { x: -0.7, y: -0.6, scale: 0.25, color: [0.6, 0.2, 0.1, 1.0] }, 
      { x: -0.5, y: -0.8, scale: 0.3, color: [0.7, 0.5, 0.3, 1.0] }  
  ];

  // Render muti tetrahedron
  for (let i = 0; i < tetrahedronPositions.length; i++) {
      let data = tetrahedronPositions[i];
      let tetrahedron = new Tetrahedron();
      tetrahedron.color = data.color;
      tetrahedron.matrix.translate(data.x, data.y, 0.0); 
      tetrahedron.matrix.scale(data.scale, data.scale, data.scale); 
      tetrahedron.render();
  }
}


function renderScene() {
  var startTime = performance.now();

  var globalRotMat = new Matrix4()
      .rotate(g_globalAngle, 0, 1, 0)   //yaw
      .rotate(g_pitchAngle, 1, 0, 0);  // pitch
  
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Fish body
  renderUnderwaterMountains();
  renderFishBody();

  var duration = performance.now() - startTime;
  sentTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}


function sentTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if(!htmlElm) {
    console.log('Failed to get' + htmlElm + 'from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}

function resetFish() {
  console.log("Resetting fish position and stopping animation.");

  g_fishMoving = false;  
  g_fishAnimation = false; 

  g_fishPosX = 0.0; 
  g_fishPosY = 0.0; 

  g_headSwing = 0.0;
  g_tailSwing = 0.0; 

  renderScene(); 
}

function resetCamera() {
  console.log("Resetting camera position.");

  g_globalAngle = 0.0; 
  g_pitchAngle = 0.0; 

  renderScene();
}







