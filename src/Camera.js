// Camera.js
class Camera {
  constructor() {
    // 摄像机参数
    // 初始位置：模拟人视角的高度
    this.eye = [0, 1.5, 5];  
    this.at  = [0, 1.5, 0];
    this.up  = [0, 1, 0];

    // 视野参数
    this.fov = 60;
    this.aspect = 1; // 之后在 updateProjectionMatrix 中设置
    this.near = 0.1;
    this.far  = 100;

    // 速度参数
    this.moveSpeed = 0.2;
    this.rotateSpeed = 2; // 旋转角速度（单位：度）

    // 初始化视图矩阵和投影矩阵
    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();
    this.updateViewMatrix();
    this.updateProjectionMatrix();
  }

  // 更新视图矩阵：调用 setLookAt 并上传到 GLSL
  updateViewMatrix() {
    let viewMatrix = new Matrix4();
    viewMatrix.setLookAt(
      this.eye[0], this.eye[1], this.eye[2],
      this.at[0],  this.at[1],  this.at[2],
      this.up[0],  this.up[1],  this.up[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
    this.viewMatrix = viewMatrix;
  }

  // 更新投影矩阵
  updateProjectionMatrix() {
    this.aspect = canvas.width / canvas.height;
    let projMatrix = new Matrix4();
    projMatrix.setPerspective(this.fov, this.aspect, this.near, this.far);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMatrix.elements);
    this.projectionMatrix = projMatrix;
  }

  // 向前移动：在水平面上移动（忽略 Y 方向）
  moveForward() {
    // 计算水平前向向量 = at - eye（忽略 Y 分量）
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    if (len > 0) {
      forward[0] /= len;
      forward[2] /= len;
    }
    this.eye[0] += forward[0] * this.moveSpeed;
    this.eye[2] += forward[2] * this.moveSpeed;
    this.at[0]  += forward[0] * this.moveSpeed;
    this.at[2]  += forward[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  // 向后移动
  moveBackward() {
    let forward = [
      this.at[0] - this.eye[0],
      0,
      this.at[2] - this.eye[2]
    ];
    let len = Math.hypot(forward[0], forward[2]);
    if (len > 0) {
      forward[0] /= len;
      forward[2] /= len;
    }
    // 后退即沿前向的反方向
    this.eye[0] -= forward[0] * this.moveSpeed;
    this.eye[2] -= forward[2] * this.moveSpeed;
    this.at[0]  -= forward[0] * this.moveSpeed;
    this.at[2]  -= forward[2] * this.moveSpeed;
    this.updateViewMatrix();
  }

  // 向左移动：这里简化为直接将 x 坐标减小
  moveLeft() {
    this.eye[0] -= this.moveSpeed;
    this.at[0]  -= this.moveSpeed;
    this.updateViewMatrix();
  }

  // 向右移动
  moveRight() {
    this.eye[0] += this.moveSpeed;
    this.at[0]  += this.moveSpeed;
    this.updateViewMatrix();
  }

  // 向左旋转（偏航）：绕 up 轴旋转 rotateSpeed 度
  panLeft() {
    const alpha = this.rotateSpeed;
    // 计算前向向量 f = at - eye
    let f = [
      this.at[0] - this.eye[0],
      this.at[1] - this.eye[1],
      this.at[2] - this.eye[2]
    ];
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up[0], this.up[1], this.up[2]);
    // 计算旋转后的 f'
    let f_prime = rotationMatrix.multiplyVector3(new Vector3(f));
    // 更新 at = eye + f'
    this.at[0] = this.eye[0] + f_prime.elements[0];
    this.at[1] = this.eye[1] + f_prime.elements[1];
    this.at[2] = this.eye[2] + f_prime.elements[2];
    this.updateViewMatrix();
  }

  // 向右旋转
  panRight() {
    const alpha = -this.rotateSpeed;
    let f = [
      this.at[0] - this.eye[0],
      this.at[1] - this.eye[1],
      this.at[2] - this.eye[2]
    ];
    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(alpha, this.up[0], this.up[1], this.up[2]);
    let f_prime = rotationMatrix.multiplyVector3(new Vector3(f));
    this.at[0] = this.eye[0] + f_prime.elements[0];
    this.at[1] = this.eye[1] + f_prime.elements[1];
    this.at[2] = this.eye[2] + f_prime.elements[2];
    this.updateViewMatrix();
  }

  // 处理键盘输入
  handleKeyDown(key) {
    switch (key.toLowerCase()) {
      case 'w': this.moveForward(); return true;
      case 's': this.moveBackward(); return true;
      case 'a': this.moveLeft(); return true;
      case 'd': this.moveRight(); return true;
      case 'q': this.panLeft(); return true;
      case 'e': this.panRight(); return true;
      default: return false;
    }
  }
}



