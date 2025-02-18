// ===================================
// Vertex Shader Source Code
// ===================================
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

// ===================================
// Fragment Shader Source Code
// ===================================
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

// ===================================
// 全局变量与 GLSL uniform 变量
// ===================================
let canvas;
let gl;
let a_Position, a_UV;
let u_FragColor, u_ModelMatrix, u_ProjectionMatrix, u_GlobalRotateMatrix, u_ViewMatrix;
let u_whichTexture;
let u_Sampler0, u_Sampler1, u_Sampler2, u_Sampler3, u_Sampler4;
let camera;  // Camera 对象用于管理视角

// 用于非 pointer lock 拖拽旋转（可选）
let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// 用于 FPS 鼠标控制时的灵敏度
const MOUSE_SENSITIVITY = 0.002;

// ===================================
// WebGL 初始化与 GLSL 变量连接
// ===================================
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

// ===================================
// HTML UI 事件处理（例如滑块、按钮等）
// ===================================
function addActionForHtmlUI() {
  // 假设 HTML 中有 id="angleSlide" 和 id="ResetCameraButton"
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
  // 可选：非 pointer lock 模式下的鼠标拖拽旋转
  canvas.addEventListener("mousedown", function (ev) {
    g_mouseDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;
  });
  canvas.addEventListener("mousemove", function (ev) {
    if (g_mouseDragging) {
      let dx = ev.clientX - g_lastMouseX;
      // 这里只处理水平旋转
      camera.panLeft(dx * 0.05);
      g_lastMouseX = ev.clientX;
      renderScene();
    }
  });
  canvas.addEventListener("mouseup", function () {
    g_mouseDragging = false;
  });
}

// ===================================
// Pointer Lock 设置（FPS 风格鼠标旋转）
// ===================================
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
    // 限制 pitch 在 [-π/2, π/2] 内
    camera.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.pitch));
    camera.updateDirection();
    camera.updateViewMatrix();
    renderScene();
  });
}

// ===================================
// 纹理加载函数
// ===================================
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

// ===================================
// 键盘事件处理（调用 Camera.handleKeyDown）
// ===================================
function keydown(ev) {
  if (camera.handleKeyDown(ev.key)) {
    renderScene();
  }
}

// ===================================
// 示例：绘制地图（你可以在此处加入其他绘制调用）
// ===================================
function drawMap() {
  // 定义 32×32 的地图数据，边界为墙（值为 1），内部为空（值为 0）
  let mapSize = 32;
  let g_map = [];
  for (let i = 0; i < mapSize; i++) {
    let row = [];
    for (let j = 0; j < mapSize; j++) {
      // 如果是边界位置，则设为墙（1），否则设为 0
      if (i === 0 || i === mapSize - 1 || j === 0 || j === mapSize - 1) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    g_map.push(row);
  }

  // 根据地图大小计算每个 tile 的尺寸（假设地板总尺寸为32）
  let tileSize = 32 / mapSize;

  // 遍历地图数组，绘制墙壁（值大于0的单元格）
  for (let x = 0; x < mapSize; x++) {
    for (let y = 0; y < mapSize; y++) {
      if (g_map[x][y] > 0) {
        let wall = new Cube();
        wall.color = [1, 1, 1, 1];
        wall.textureNum = 2;  // 绑定 wall.jpg 纹理

        let height = g_map[x][y]; // 此处高度为1

        // 缩放 cube 以适应单元格尺寸
        wall.matrix.scale(tileSize, height * tileSize, tileSize);
        // 将立方体放置到对应位置，注意根据地图中心调整位置
        wall.matrix.translate(x - mapSize / 2, (height * tileSize) / 2 - 1.5, y - mapSize / 2);
        wall.renderfast();
      }
    }
  }
}


// ===================================
// 绘制场景：上传摄像机矩阵，然后调用绘制函数
// ===================================
function renderScene() {
  // 使用单位矩阵传给 u_GlobalRotateMatrix（无额外全局旋转）
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identity.elements);
  // 上传摄像机的视图与投影矩阵
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


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
  
  // 调用你的绘制函数，例如 drawMap()
  drawMap();
}

// ===================================
// 主循环与入口
// ===================================
function tick() {
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
  document.onkeydown = keydown;
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons === 1) click(ev); };
  initTextures();
  gl.clearColor(0, 0, 0, 1.0);
  requestAnimationFrame(tick);
}

main();


  







