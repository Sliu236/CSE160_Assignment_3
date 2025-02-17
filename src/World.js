// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
Removed fish and underwater mountain rendering functions.
*/
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
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// 全局变量声明
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;

let g_globalAngle = 0.0;
let g_pitchAngle = 0.0; 
let g_mouseDragging = false;
let g_lastMouseX = 0;
let g_lastMouseY = 0;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
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
  
    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
  
    // Get the storage location of a_UV
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
      console.log('Failed to get the storage location of a_UV');
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

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
      console.log('Failed to get the storage location of u_ViewMatrix');
      return;
    }
    
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
      console.log('Failed to get the storage location of u_ProjectionMatrix');
      return;
    }
    
    // 初始化模型矩阵为单位矩阵
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
  // 控制全局旋转角度（yaw）
  document.getElementById('angleSlide').addEventListener('input', function() { 
      g_globalAngle = parseFloat(this.value); 
      renderScene();
  });
  // 控制俯仰角（pitch）
  document.getElementById('pitchSlide').addEventListener('input', function() { 
      g_pitchAngle = parseFloat(this.value);
      renderScene();
  });

  // 重置摄像机按钮
  document.getElementById('ResetCameraButton').addEventListener('click', resetCamera);

  // 鼠标拖动事件：按下鼠标时记录位置
  canvas.addEventListener("mousedown", function (ev) {
      g_mouseDragging = true; 
      g_lastMouseX = ev.clientX; 
      g_lastMouseY = ev.clientY;
  });

  // 鼠标移动时更新摄像机角度
  canvas.addEventListener("mousemove", function (ev) {
      if (g_mouseDragging) {
          let dx = ev.clientX - g_lastMouseX;
          let dy = ev.clientY - g_lastMouseY;
          g_globalAngle += dx * 0.5;
          g_pitchAngle -= dy * 0.5;
          // 限制俯仰角范围
          g_pitchAngle = Math.max(-90, Math.min(90, g_pitchAngle));
          g_lastMouseX = ev.clientX;
          g_lastMouseY = ev.clientY;
          renderScene();
      }
  });

  // 鼠标抬起时停止拖动
  canvas.addEventListener("mouseup", function () { 
      g_mouseDragging = false; 
  });
}

function main() {
  setupWebGL(); // WebGL 初始化
  connectVariablesToGLSL(); // 连接 GLSL 变量
  addActionForHtmlUI(); // 添加 HTML UI 事件处理

  // 鼠标点击事件（本例中没有额外逻辑，只调用 renderScene()）
  canvas.onmousedown = click;
  canvas.onmousemove  = function(ev) { if (ev.buttons === 1) click(ev); };

  // 设置 canvas 清屏颜色（例如天蓝色）
  gl.clearColor(0, 0, 0, 1.0);

  requestAnimationFrame(tick);
}

var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  // 动画更新逻辑
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderScene();
  requestAnimationFrame(tick);
}

function click(ev) {
  // 本示例中点击只触发重新渲染
  let [x, y] = convertCoordinatesEventToGL(ev);
  renderScene();
}

function renderScene() {
  var startTime = performance.now();

  // 构建全局旋转矩阵（先绕 Y 轴旋转，再绕 X 轴旋转）
  var globalRotMat = new Matrix4()
      .rotate(g_globalAngle, 0, 1, 0)   // yaw
      .rotate(g_pitchAngle, 1, 0, 0);     // pitch

  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // 设置视图和投影矩阵
  let viewMatrix = new Matrix4().setLookAt(0, 0, 3, 0, 0, 0, 0, 1, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  let projMatrix = new Matrix4().setPerspective(60, canvas.width/canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


  // 创建并渲染立方体对象
  let cube = new Cube();
  cube.color = [1.0, 0.0, 0.0, 1.0]; // 红色
  cube.matrix.setTranslate(0, 0, 0); // 设置位置为原点
  cube.matrix.scale(0.5, 0.5, 0.5); // 设置缩放为 1
  cube.render();

  var duration = performance.now() - startTime;
  sentTextToHTML("ms: " + Math.floor(duration) + " fps: " + (1000/duration).toFixed(1), "numdot");
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

// 开始执行 main() 函数
main();






