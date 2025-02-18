var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ProjectionMatrix;
  uniform mat4 u_ViewMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position; 
    v_UV = a_UV;
  }
`;


var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else if (u_whichTexture == 3) {
      gl_FragColor = texture2D(u_Sampler3, v_UV);
    } else if (u_whichTexture == 4) {
      gl_FragColor = texture2D(u_Sampler4, v_UV);
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }
`;

let canvas;
let gl;
let a_Position, a_UV;
let u_FragColor, u_ModelMatrix, u_ProjectionMatrix, u_GlobalRotateMatrix, u_ViewMatrix;
let u_whichTexture;
let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4;
let camera;  

let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

let g_fishMoving = false;
let g_fishPosX = 0.0;
let g_fishPosY = 0.0;
let g_bodyBendAngle = 0.0;
let g_headSwing = 0.0;
let g_tailSwing = 0.0;
let g_fishAnimation = false;


let lastFrameTime = performance.now();

// mouse sensitivity
const MOUSE_SENSITIVITY = 0.002;

// map size
let mapSize = 32;
let g_map = [];
for (let i = 0; i < mapSize; i++) {
  let row = [];
  for (let j = 0; j < mapSize; j++) {
    if (i === 0 || i === mapSize - 1 || j === 0 || j === mapSize - 1) {
      row.push(1);
    } else {
      row.push(0);
    }
  }
  g_map.push(row);
}

let collectibles = [];  
let collectibleCount = 8;  // generate 8 collectibles
let score = 0;

// initialize collectibles
function initCollectibles() {
  collectibles = [];
  for (let i = 0; i < collectibleCount; i++) {
    let r = Math.floor(Math.random() * (mapSize - 2)) + 1;
    let c = Math.floor(Math.random() * (mapSize - 2)) + 1;
    let tileSize = 32 / mapSize;
    let x = r - mapSize / 2 + tileSize/2;
    let z = c - mapSize / 2 + tileSize/2;
    let y = 0.5;
    collectibles.push({ pos: [x, y, z], collected: false });
  }
}

// draw collectibles
function drawCollectibles() {
  let tileSize = 32 / mapSize;
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let cube = new Cube();
      cube.color = [1, 1, 0, 1];  // yellow
      cube.textureNum = -2;
      cube.matrix.scale(tileSize * 0.5, tileSize * 0.5, tileSize * 0.5);
      cube.matrix.translate(col.pos[0], col.pos[1], col.pos[2]);
      cube.renderfast();
    }
  }
}

function checkCollectibles() {
  let threshold = 0.5;
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let dx = camera.eye[0] - col.pos[0];
      let dz = camera.eye[2] - col.pos[2];
      let dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < threshold) {
        col.collected = true;
        score++;
        console.log("Score: " + score);
      }
    }
  }
}


function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get WebGL context');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}


function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  
  let identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


function addActionForHtmlUI() {
  let angleSlide = document.getElementById('angleSlide');
  if (angleSlide) {
    angleSlide.addEventListener('input', function () {
      renderScene();
    });
  }
  let resetBtn = document.getElementById('ResetCameraButton');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetCamera);
  }

  canvas.addEventListener("mousedown", function (ev) {
    g_mouseDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
  canvas.addEventListener("mousemove", function (ev) {
    if (g_mouseDragging) {
      let dx = ev.clientX - g_lastMouseX;
      camera.panLeft(dx * 0.05);
      g_lastMouseX = ev.clientX;
      renderScene();
    }
  });
  canvas.addEventListener("mouseup", function () {
    g_mouseDragging = false;
  });
}



function setupPointerLock() {
  canvas.addEventListener("click", function () {
    canvas.requestPointerLock();
  });
  document.addEventListener("pointerlockchange", function () {
    if (document.pointerLockElement === canvas) {
      console.log("Pointer locked");
    } else {
      console.log("Pointer unlocked");
    }
  });
  document.addEventListener("mousemove", function (ev) {
    if (document.pointerLockElement !== canvas) return;
    camera.yaw += ev.movementX * MOUSE_SENSITIVITY;
    camera.pitch -= ev.movementY * MOUSE_SENSITIVITY;
    camera.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.pitch));
    camera.updateDirection();
    camera.updateViewMatrix();
    renderScene();
  });
}


function initTextures() {
  let image0 = new Image();
  let image1 = new Image();
  let image2 = new Image();
  let image3 = new Image();
  let image4 = new Image();
  if (!image0 || !image1 || !image2 || !image3 || !image4) {
    console.log('Failed to create image objects');
    return false;
  }
  image0.onload = function() { sendTextureToGLSL(image0, gl.TEXTURE0, u_Sampler0); };
  image1.onload = function() { sendTextureToGLSL(image1, gl.TEXTURE1, u_Sampler1); };
  image2.onload = function() { sendTextureToGLSL(image2, gl.TEXTURE2, u_Sampler2); };
  image3.onload = function() { sendTextureToGLSL(image3, gl.TEXTURE3, u_Sampler3); };
  image4.onload = function() { sendTextureToGLSL(image4, gl.TEXTURE4, u_Sampler4); };
  image0.src = 'brick.webp';
  image1.src = 'dirt.jpg';
  image2.src = 'grass.jpg';
  image3.src = 'sky2.jpg';
  image4.src = 'grass2.jpg';
  return true;
}

function sendTextureToGLSL(image, texUnit, samplerUniform) {
  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.activeTexture(texUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.uniform1i(samplerUniform, texUnit - gl.TEXTURE0);
  console.log("Texture loaded into unit " + (texUnit - gl.TEXTURE0));
}



function keydown(ev) {
  if (camera.handleKeyDown(ev.key)) {
      renderScene();
      return;
  }

  let key = ev.key.toLowerCase();
  if (key === 'z') {
      addBlockInFront();
  } else if (key === 'x') {
      removeBlockInFront();
  }
  
  renderScene();
}

document.onkeydown = keydown;


function drawMap() {
  let tileSize = 32 / mapSize;
  for (let x = 0; x < mapSize; x++) {
    for (let z = 0; z < mapSize; z++) {
      let height = g_map[x][z];
      if (height > 0) {
        for (let y = 0; y < height; y++) {
          let wall = new Cube();
          wall.color = [1, 1, 1, 1];
          wall.textureNum = 2;  
          wall.matrix.scale(tileSize, tileSize, tileSize);
          wall.matrix.translate(
            x - mapSize / 2,
            y - 0.8, 
            z - mapSize / 2
          );
          wall.renderfast();
        }
      }
    }
  }
}


function drawMountain() {
  for (let i = 20; i < 25; i++) {
    for (let j = 14; j < 18; j++) {
      for (let k = 0; k < 2; k++) { 
        let cube = new Cube();
        cube.color = [1, 1, 1, 1];
        cube.textureNum = 0; 
        let tileSize = 32 / mapSize; 
        cube.matrix.scale(tileSize, tileSize, tileSize);
        cube.matrix.translate(i - mapSize/2, k - 1, j - mapSize/2);
        cube.renderfast();
      }
    }
  }
}


function renderFishBody() {
  let tileSize = 32 / mapSize;

  // position of the mountain
  let mountainCenterX = (20 + 24) / 2 - mapSize / 2; // 6
  let mountainCenterZ = (14 + 18) / 2 - mapSize / 2; // 0
  let mountainHeight = 2; // height of the mountain

  let fishMatrix = new Matrix4();
  fishMatrix.setTranslate(mountainCenterX, mountainHeight + 0.5, mountainCenterZ);

  fishMatrix.scale(8, 8, 8);
  

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
      part.textureNum = -2;
  
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
  
      // eyes
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
          leftEye.textureNum = -2;
          leftEye.render();
  
          rightEye.matrix = new Matrix4(fishMatrix);
          rightEye.matrix.translate(eyeX, eyeY, eyeZBack);
          rightEye.matrix.translate(centerX - eyeX, 0, 0);
          rightEye.matrix.rotate(swingAngle, 0, 1, 0);
          rightEye.matrix.translate(-(centerX - eyeX), 0, 0);
          rightEye.matrix.scale(eyeSize, eyeSize, eyeSize * 0.5);
          rightEye.textureNum = -2;
          rightEye.render();
      }
  }
}



function drawCollectibles() {
  let tileSize = 32 / mapSize; // size of each tile
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let cube = new Cube();
      cube.color = [1, 1, 0, 1];  
      cube.textureNum = -2;       
      cube.matrix.scale(tileSize, tileSize, tileSize);
      cube.matrix.translate(col.pos[0], col.pos[1], col.pos[2]);
      cube.renderfast();
    }
  }
}

// fatch front cell
function getFrontCell() {
  let cellX = Math.floor(camera.eye[0] + mapSize / 2);
  let cellZ = Math.floor(camera.eye[2] + mapSize / 2);

  let dirX = camera.at[0] - camera.eye[0];
  let dirZ = camera.at[2] - camera.eye[2];

  let len = Math.sqrt(dirX * dirX + dirZ * dirZ);
  if (len === 0) return null;
  
  dirX /= len;
  dirZ /= len;

  let frontX = Math.floor(camera.eye[0] + dirX + mapSize / 2);
  let frontZ = Math.floor(camera.eye[2] + dirZ + mapSize / 2);

  if (frontX < 0 || frontX >= mapSize || frontZ < 0 || frontZ >= mapSize) {
      return null;
  }

  return { x: frontX, z: frontZ };
}


// add block in front of the camera
function addBlockInFront() {
  let cell = getFrontCell();
  if (cell) {
    g_map[cell.x][cell.z] += 1;
    console.log("Added a block：(" + cell.x + ", " + cell.z + ") New height：" + g_map[cell.x][cell.z]);
    renderScene();
  }
}

// delete block in front of the camera
function removeBlockInFront() {
  let cell = getFrontCell();
  if (cell && g_map[cell.x][cell.z] > 1) { // do not delete the ground
      g_map[cell.x][cell.z] -= 1;
      console.log("deleted a block：(" + cell.x + ", " + cell.z + ") New height：" + g_map[cell.x][cell.z]);
      renderScene();
  }
}



function checkCollectibles() {
  let threshold = 0.5; 
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let dx = camera.eye[0] - col.pos[0];
      let dz = camera.eye[2] - col.pos[2];
      let dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < threshold) {
        col.collected = true;
        score++;
        console.log("Score: " + score);
      }
    }
  }
}


function renderScene() {
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identity.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  let floor = new Cube();
  floor.textureNum = 4;  // dirt.jpg
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();
  
  let sky = new Cube();
  sky.color = [1, 0, 0, 1];
  sky.textureNum = 3;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();
  
  drawMap();
  drawMountain();
  drawCollectibles();
  checkCollectibles();
  renderFishBody();
}


function tick() {
  let now = performance.now();
  let dt = now - lastFrameTime;
  lastFrameTime = now;
  let fps = 1000 / dt; 


  document.getElementById("numdot").innerText = "FPS: " + fps.toFixed(1);

  renderScene();
  requestAnimationFrame(tick);
}


function click(ev) {
  renderScene();
}


function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionForHtmlUI();
  setupPointerLock();
  
  camera = new Camera();
  
  initCollectibles();
  score = 0;
  
  document.onkeydown = keydown;
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons === 1) click(ev); };
  
  initTextures();
  
  gl.clearColor(0, 0, 0, 1.0);
  requestAnimationFrame(tick);
}

main();


  







