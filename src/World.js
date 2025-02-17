// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

*/
// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
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
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
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
    } else {
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }`;


let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_whichTexture;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;

let g_globalAngle = 0.0;
let g_pitchAngle = 0.0; 
let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

function setupWebGL() {
    canvas = document.getElementById('webgl');

    gl = canvas.getContext('webgl', {preserveDrawingBuffer: true});
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
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

  let identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function convertCoordinatesEventToGL(ev) {
  let rect = canvas.getBoundingClientRect();
  let x = ev.clientX - rect.left;
  let y = ev.clientY - rect.top;
  x = (x - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - y) / (canvas.height / 2);
  return [x, y];
}

function addActionForHtmlUI() {
  // Yaw
  document.getElementById('angleSlide').addEventListener('input', function() { 
      g_globalAngle = parseFloat(this.value); 
      renderScene();
  });
  // Pitch
  document.getElementById('pitchSlide').addEventListener('input', function() { 
      g_pitchAngle = parseFloat(this.value);
      renderScene();
  });

  // Reset Camera
  document.getElementById('ResetCameraButton').addEventListener('click', resetCamera);

  // drag mouse to rotate camera
  canvas.addEventListener("mousedown", function (ev) {
      g_mouseDragging = true; 
      g_lastMouseX = ev.clientX; 
      g_lastMouseY = ev.clientY;
  });

  // camera rotate
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
      }
  });

  // stop camera rotate
  canvas.addEventListener("mouseup", function () { 
      g_mouseDragging = false; 
  });
}


function initTextures() {
  let image0 = new Image();
  let image1 = new Image();
  let image2 = new Image();

  if (!image0 || !image1 || !image2) {
      console.log('Failed to create image objects');
      return false;
  }

  image0.onload = function() { sendTextureToGLSL(image0, gl.TEXTURE0, u_Sampler0); };
  image1.onload = function() { sendTextureToGLSL(image1, gl.TEXTURE1, u_Sampler1); };
  image2.onload = function() { sendTextureToGLSL(image2, gl.TEXTURE2, u_Sampler2); };

  image0.src = 'sky.jpg';
  image1.src = 'dirt.jpg';
  image2.src = 'grass.jpg';

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



function main() {
  setupWebGL(); 
  connectVariablesToGLSL(); 
  addActionForHtmlUI();

  
  canvas.onmousedown = click;
  canvas.onmousemove  = function(ev) { if (ev.buttons === 1) click(ev); };

  document.onkeydown = keydown;

  initTextures();

  gl.clearColor(0, 0, 0, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderScene();
  requestAnimationFrame(tick);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);
  renderScene();
}

function keydown(ev) {
  let speed = 0.2;
  // W: 前进 (沿 -Z 方向)
  if (ev.keyCode === 87) {
    g_eye[2] -= speed;
    g_look[2] -= speed;
  }
  // S: 后退 (沿 +Z 方向)
  else if (ev.keyCode === 83) {
    g_eye[2] += speed;
    g_look[2] += speed;
  }
  // A: 向左 (沿 -X 方向)
  else if (ev.keyCode === 65) {
    g_eye[0] -= speed;
    g_look[0] -= speed;
  }
  // D: 向右 (沿 +X 方向)
  else if (ev.keyCode === 68) {
    g_eye[0] += speed;
    g_look[0] += speed;
  }
  // Q: 视角左转 (绕 up 轴旋转 +5°)
  else if (ev.keyCode === 81) {
    let f = new Vector3(g_look); 
    f.sub(new Vector3(g_eye));          // f = g_look - g_eye
    let rot = new Matrix4();
    rot.setRotate(5, g_up[0], g_up[1], g_up[2]);
    f = rot.multiplyVector3(f);
    // 更新 g_look = g_eye + f
    g_look = [
      g_eye[0] + f.elements[0],
      g_eye[1] + f.elements[1],
      g_eye[2] + f.elements[2]
    ];
  }
  // E: 视角右转 (绕 up 轴旋转 -5°)
  else if (ev.keyCode === 69) {
    let f = new Vector3(g_look);
    f.sub(new Vector3(g_eye));          // f = g_look - g_eye
    let rot = new Matrix4();
    rot.setRotate(-5, g_up[0], g_up[1], g_up[2]);
    f = rot.multiplyVector3(f);
    g_look = [
      g_eye[0] + f.elements[0],
      g_eye[1] + f.elements[1],
      g_eye[2] + f.elements[2]
    ];
  }

  renderScene();
  console.log(ev.keyCode);
}



var g_eye = [0, 0, 3];
var g_look = [0, 0, -100];
var g_up = [0, 1, 0];

function renderScene() {
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  let viewMatrix = new Matrix4();
  viewMatrix.setLookAt(g_eye[0], g_eye[1], g_eye[2], g_look[0], g_look[1], g_look[2], g_up[0], g_up[1], g_up[2]);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  let projMatrix = new Matrix4();
  projMatrix.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  let cube1 = new Cube();
  cube1.textureNum = 0;  // sky.jpg
  cube1.matrix.setTranslate(-0.5, 0, 0);
  cube1.matrix.scale(0.5, 0.5, 0.5);
  cube1.render();

  let cube2 = new Cube();
  cube2.textureNum = 1;  // dirt.jpg
  cube2.matrix.setTranslate(0.5, 0, 0);
  cube2.matrix.scale(0.5, 0.5, 0.5);
  cube2.render();

  let cube3 = new Cube();
  cube3.textureNum = 2;  // wall.jpg
  cube3.matrix.setTranslate(1.5, 0, 0);
  cube3.matrix.scale(0.5, 0.5, 0.5);
  cube3.render();
}

function sentTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get element ' + htmlID + ' from HTML');
    return;
  }
  htmlElm.innerHTML = text;
}

function resetCamera() {
  console.log("Resetting camera position.");
  g_globalAngle = 0.0;
  g_pitchAngle = 0.0;
  renderScene();
}

main();




