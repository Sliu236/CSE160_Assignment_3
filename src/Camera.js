// Camera.js
// 采用数组形式存储摄像机参数，并使用 yaw/pitch 控制视角

class Camera {
  constructor() {
    // 摄像机初始位置（模拟人的视角高度为 1.5）
    this.eye = [0, 1.5, 5];
    // 初始目标点
    this.at = [0, 1.5, 0];
    // 上方向
    this.up = [0, 1, 0];

    // 视野参数
    this.fov = 60;
    this.aspect = 1;
    this.near = 0.1;
    this.far = 100;

    // 移动和旋转速度
    this.moveSpeed = 0.2;
    this.rotateSpeed = 2; // 单位：度

    // 用于鼠标控制（以弧度为单位）
    this.yaw = 0;    // 水平旋转角（yaw）
    this.pitch = 0;  // 垂直旋转角（pitch）

    // 初始化视图矩阵和投影矩阵（使用 cuon-matrix-cse160.js 中的 Matrix4）
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    // 更新投影矩阵（注意：aspect 由画布尺寸确定）
    this.updateProjectionMatrix();
    // 根据 eye/at 初始化 yaw 和 pitch（这里默认 eye-at 对应初始朝向 -Z）
    // 可直接设置 yaw/pitch 为 0
    this.yaw = 0;
    this.pitch = 0;
    this.updateDirection();
    this.updateViewMatrix();
  }

  // 根据当前 yaw 和 pitch 更新目标点 at（相对于 eye）
  updateDirection() {
    let cosPitch = Math.cos(this.pitch);
    let sinPitch = Math.sin(this.pitch);
    let sinYaw = Math.sin(this.yaw);
    let cosYaw = Math.cos(this.yaw);
    // 计算朝向，初始朝向为 -Z
    let dir = [
      cosPitch * sinYaw,
      sinPitch,
      -cosPitch * cosYaw
    ];
    this.at = [
      this.eye[0] + dir[0],
      this.eye[1] + dir[1],
      this.eye[2] + dir[2]
    ];
  }

  // 更新视图矩阵并上传到 GLSL
  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye[0], this.eye[1], this.eye[2],
      this.at[0], this.at[1], this.at[2],
      this.up[0], this.up[1], this.up[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, this.viewMatrix.elements);
  }

  // 更新投影矩阵并上传到 GLSL
  updateProjectionMatrix() {
    this.aspect = canvas.width / canvas.height;
    this.projectionMatrix.setPerspective(this.fov, this.aspect, this.near, this.far);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, this.projectionMatrix.elements);
  }

  // 键盘控制——仅处理水平平移和旋转（不涉及鼠标旋转）
  moveForward() {
    // 计算水平方向 (at - eye)，忽略 Y 分量
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    forward[0] /= len; forward[2] /= len;
    this.eye[0] += forward[0] * this.moveSpeed;
    this.eye[2] += forward[2] * this.moveSpeed;
    this.at[0] += forward[0] * this.moveSpeed;
    this.at[2] += forward[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  moveBackward() {
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    forward[0] /= len; forward[2] /= len;
    this.eye[0] -= forward[0] * this.moveSpeed;
    this.eye[2] -= forward[2] * this.moveSpeed;
    this.at[0] -= forward[0] * this.moveSpeed;
    this.at[2] -= forward[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  moveLeft() {
    // 计算左方向向量：left = [-forwardZ, 0, forwardX]
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    forward[0] /= len; forward[2] /= len;
    let left = [-forward[2], 0, forward[0]];
    this.eye[0] += left[0] * this.moveSpeed;
    this.eye[2] += left[2] * this.moveSpeed;
    this.at[0] += left[0] * this.moveSpeed;
    this.at[2] += left[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  moveRight() {
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    forward[0] /= len; forward[2] /= len;
    // right = [forward[2], 0, -forward[0]]
    let right = [forward[2], 0, -forward[0]];
    this.eye[0] += right[0] * this.moveSpeed;
    this.eye[2] += right[2] * this.moveSpeed;
    this.at[0] += right[0] * this.moveSpeed;
    this.at[2] += right[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  // 键盘控制的旋转：绕 up 轴旋转 rotateSpeed（单位：度）
  panLeft() {
    const alpha = this.rotateSpeed * Math.PI/180; // 转换为弧度
    let rotationMatrix = new Matrix4().setRotate(alpha, this.up[0], this.up[1], this.up[2]);
    // 当前前向向量
    let f = [
      this.at[0] - this.eye[0],
      this.at[1] - this.eye[1],
      this.at[2] - this.eye[2]
    ];
    let fRot = rotationMatrix.multiplyVector3(new Vector3(f));
    this.at = [
      this.eye[0] + fRot.elements[0],
      this.eye[1] + fRot.elements[1],
      this.eye[2] + fRot.elements[2]
    ];
    // 同时更新 yaw
    this.yaw += alpha;
    this.updateViewMatrix();
  }

  panRight() {
    const alpha = -this.rotateSpeed * Math.PI/180;
    let rotationMatrix = new Matrix4().setRotate(alpha, this.up[0], this.up[1], this.up[2]);
    let f = [
      this.at[0] - this.eye[0],
      this.at[1] - this.eye[1],
      this.at[2] - this.eye[2]
    ];
    let fRot = rotationMatrix.multiplyVector3(new Vector3(f));
    this.at = [
      this.eye[0] + fRot.elements[0],
      this.eye[1] + fRot.elements[1],
      this.eye[2] + fRot.elements[2]
    ];
    this.yaw += alpha;
    this.updateViewMatrix();
  }

  // 处理键盘输入（返回 true 表示已处理）
  handleKeyDown(key) {
    switch (key.toLowerCase()) {
      case 'w': this.moveForward(); return true;
      case 's': this.moveBackward(); return true;
      case 'd': this.moveLeft(); return true;
      case 'a': this.moveRight(); return true;
      case 'q': this.panLeft(); return true;
      case 'e': this.panRight(); return true;
      default: return false;
    }
  }
}


