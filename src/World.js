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
let camera;  // 使用 Camera 对象管理视角

// 用于非 pointer lock 拖拽旋转（可选）
let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

// FPS 鼠标旋转灵敏度
const MOUSE_SENSITIVITY = 0.002;

// 关于地图的全局变量（32x32的世界）
let mapSize = 32;
let g_map = [];
// 初始化地图：边界为墙（1），内部为空（0）
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

// ================================
// “Collectibles”（黄色方块）相关全局变量
// ================================
let collectibles = [];  // 每个元素是 { pos: [x,y,z], collected: false }
let collectibleCount = 5;  // 随机生成 5 个
let score = 0;

// 初始化 collectibles：在地图内部（不在边界）随机生成 collectibleCount 个
function initCollectibles() {
  collectibles = [];
  for (let i = 0; i < collectibleCount; i++) {
    // 随机选择行、列（避免边界：从1到mapSize-2）
    let r = Math.floor(Math.random() * (mapSize - 2)) + 1;
    let c = Math.floor(Math.random() * (mapSize - 2)) + 1;
    // 将地图坐标转换为世界坐标：
    // 假设每个tile尺寸为：tileSize = 32 / mapSize
    let tileSize = 32 / mapSize;
    // 计算中心位置（与 drawMap 中的平移类似）：
    let x = r - mapSize / 2 + tileSize/2;
    let z = c - mapSize / 2 + tileSize/2;
    // 固定 y 坐标（例如设置在地面上方0.5）
    let y = 0.5;
    collectibles.push({ pos: [x, y, z], collected: false });
  }
}

// 绘制 collectibles（黄色立方体）
// 使用 Cube 类绘制，但强制使用黄色颜色和无纹理
function drawCollectibles() {
  let tileSize = 32 / mapSize;
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let cube = new Cube();
      cube.color = [1, 1, 0, 1];  // 黄色
      // 设置 textureNum 为 -2 以使用 u_FragColor（或直接不绑定纹理）
      cube.textureNum = -2;
      // 将 Cube 缩放到合适尺寸（例如 tileSize 的一半）
      cube.matrix.scale(tileSize * 0.5, tileSize * 0.5, tileSize * 0.5);
      // 平移到 collectible 的位置
      cube.matrix.translate(col.pos[0], col.pos[1], col.pos[2]);
      cube.renderfast();
    }
  }
}

// 检测摄像机是否收集到某个 collectible
function checkCollectibles() {
  // 使用摄像机位置（camera.eye）与 collectible 位置比较，使用距离阈值
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
  // 非 pointer lock 模式下的鼠标拖拽旋转（可选）
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

// ===================================
// 键盘事件处理（调用 Camera.handleKeyDown）
// ===================================
function keydown(ev) {
  if (camera.handleKeyDown(ev.key)) {
    renderScene();
  }
}

// ===================================
// 绘制地图（保持原有逻辑）
// ===================================
function drawMap() {
  let tileSize = 32 / mapSize; // 整个世界尺寸为 32
  for (let x = 0; x < mapSize; x++) {
    for (let z = 0; z < mapSize; z++) {
      let height = g_map[x][z];
      if (height > 0) {
        // 对于每个格子，根据高度绘制多个 Cube
        for (let y = 0; y < height; y++) {
          let wall = new Cube();
          wall.color = [1, 1, 1, 1];
          wall.textureNum = 2;  // 绑定 wall.jpg 纹理
          wall.matrix.scale(tileSize, tileSize, tileSize);
          // 这里将地图索引转换为世界坐标：以地图中心为 (0,0)
          wall.matrix.translate(
            x - mapSize / 2,
            y - 0.8,  // 可根据需要调整垂直偏移
            z - mapSize / 2
          );
          wall.renderfast();
        }
      }
    }
  }
}

// ===================================
// 绘制小山（在地图中某一区域生成一座小山）
// ===================================
function drawMountain() {
  // 在地图中选择一块区域（例如：索引 20~24行，14~17列）生成小山
  for (let i = 20; i < 25; i++) {
    for (let j = 14; j < 18; j++) {
      for (let k = 0; k < 2; k++) { // 高度为 2
        let cube = new Cube();
        cube.color = [1, 1, 1, 1];
        cube.textureNum = 0; // 例如使用墙面纹理
        let tileSize = 32 / mapSize; // 每个 tile 的尺寸
        cube.matrix.scale(tileSize, tileSize, tileSize);
        // 将 i,j 转换为世界坐标：以地图中心为 (0,0)
        cube.matrix.translate(i - mapSize/2, k - 1, j - mapSize/2);
        cube.renderfast();
      }
    }
  }
}

function drawCollectibles() {
  // 用 tileSize 作为缩放比例，使其和小山一致
  let tileSize = 32 / mapSize; // 例如整个世界尺寸为 32
  for (let i = 0; i < collectibles.length; i++) {
    let col = collectibles[i];
    if (!col.collected) {
      let cube = new Cube();
      cube.color = [1, 1, 0, 1];  // 黄色
      cube.textureNum = -2;       // 直接使用颜色（不绑定纹理）
      cube.matrix.scale(tileSize, tileSize, tileSize);
      cube.matrix.translate(col.pos[0], col.pos[1], col.pos[2]);
      cube.renderfast();
    }
  }
}


// ===================================
// 检测摄像机与 Collectibles 碰撞（简单距离检测）
// ===================================
function checkCollectibles() {
  let threshold = 0.5; // 距离阈值
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

// ===================================
// 绘制场景：上传摄像机矩阵，然后调用绘制函数
// ===================================
function renderScene() {
  // 使用单位矩阵上传给 u_GlobalRotateMatrix（无额外全局旋转）
  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identity.elements);
  // 上传摄像机的视图与投影矩阵
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // 绘制地板
  let floor = new Cube();
  floor.textureNum = 4;  // dirt.jpg
  floor.matrix.translate(0, -0.75, 0);
  floor.matrix.scale(32, 0, 32);
  floor.matrix.translate(-0.5, 0, -0.5);
  floor.render();
  
  // 绘制天空
  let sky = new Cube();
  sky.color = [1, 0, 0, 1];
  sky.textureNum = 3;
  sky.matrix.scale(50, 50, 50);
  sky.matrix.translate(-0.5, -0.5, -0.5);
  sky.render();
  
  // 绘制地图
  drawMap();
  // 绘制小山
  drawMountain();
  // 绘制 Collectibles（可收集的黄色方块）
  drawCollectibles();
  // 检查是否有收集到（碰撞检测）
  checkCollectibles();
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

function keydown(ev) {
  if (camera.handleKeyDown(ev.key)) {
    renderScene();
  }
}

// ===================================
// 主函数入口
// ===================================
function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionForHtmlUI();
  setupPointerLock();
  
  camera = new Camera();
  
  // 初始化 collectibles 并重置得分
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


  







