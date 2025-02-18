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
let camera;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
  
let g_globalAngle = 0.0;
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
  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');

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
  document.getElementById('angleSlide').addEventListener('input', function () {
      g_globalAngle = parseFloat(this.value);
      renderScene();
  });

  document.getElementById('ResetCameraButton').addEventListener('click', resetCamera);

  canvas.addEventListener("mousedown", function (ev) {
      g_mouseDragging = true;
      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
  });

  canvas.addEventListener("mousemove", function (ev) {
      if (g_mouseDragging) {
          let dx = ev.clientX - g_lastMouseX;
          let dy = ev.clientY - g_lastMouseY;
          g_globalAngle += dx * 0.5;
          g_lastMouseX = ev.clientX;
          g_lastMouseY = ev.clientY;
          renderScene();
      }
  });

  canvas.addEventListener("mouseup", function () {
      g_mouseDragging = false;
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

  image0.src = 'sky.jpg';
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



function main() {
  setupWebGL(); 
  connectVariablesToGLSL(); 
  addActionForHtmlUI();

  camera = new Camera();
  
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
  if (camera.handleKeyDown(ev.key)) {
    renderScene();
  }
}



var g_map= [
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0.7, 0.8, 0.5, 0, 0, 0, 0, 1],
  [1, 0.6, 0.7, 0.4, 0, 0, 0, 0, 1],
  [1, 0.6, 0.5, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1]
];

function drawMap() {
  let mapSize = g_map.length;    // 地图大小 (32x32)
  let tileSize = 32 / mapSize;   // 计算每个单元格的大小，使其适应 32x32 的地板

  for (let x = 0; x < g_map.length; x++) {
    for (let y = 0; y < g_map[x].length; y++) {
      if (g_map[x][y] > 0) {  // 只绘制墙壁
        let wall = new Cube();
        wall.color = [1, 1, 1, 1];
        wall.textureNum = 2;  // 绑定 wall.jpg 纹理

        let height = g_map[x][y]; // 获取墙的高度 (1 或 2)
        
        // 适应地板大小
        wall.matrix.scale(tileSize, height * tileSize, tileSize); // Y 轴缩放成 height 倍
        
        // 计算 X、Y、Z 位置
        wall.matrix.translate(x - mapSize / 2, (height * tileSize) / 2 - 2.16, y - mapSize / 2);

        
        wall.renderfast();
      }
    }
  }
}




function renderScene() {
  let globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // 直接使用 camera 内部的视图和投影矩阵
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

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

  // Draw the floor
  let floor = new Cube();
  floor.textureNum = 4;  // dirt.jpg
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();

  // Draw the sky
  let sky = new Cube();
  sky.color = [1, 0, 0, 1];
  sky.textureNum = 3; 
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render(); 

  drawMap();
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
  camera = new Camera(); // 重新初始化相机
  renderScene();
}

main();




