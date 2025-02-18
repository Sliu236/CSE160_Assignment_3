class Camera {
  constructor() {
    this.eye = [0, 1.5, 5];
    this.at = [0, 1.5, 0];
    this.up = [0, 1, 0];


    this.fov = 60;
    this.aspect = 1;
    this.near = 0.1;
    this.far = 100;


    this.moveSpeed = 0.2;
    this.rotateSpeed = 2; 

    this.yaw = 0;   
    this.pitch = 0;  

    this.viewMatrix = new Matrix4();
    this.projectionMatrix = new Matrix4();

    this.updateProjectionMatrix();
    this.yaw = 0;
    this.pitch = 0;
    this.updateDirection();
    this.updateViewMatrix();
  }

  updateDirection() {
    let cosPitch = Math.cos(this.pitch);
    let sinPitch = Math.sin(this.pitch);
    let sinYaw = Math.sin(this.yaw);
    let cosYaw = Math.cos(this.yaw);
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

  updateViewMatrix() {
    this.viewMatrix.setLookAt(
      this.eye[0], this.eye[1], this.eye[2],
      this.at[0], this.at[1], this.at[2],
      this.up[0], this.up[1], this.up[2]
    );
    gl.uniformMatrix4fv(u_ViewMatrix, false, this.viewMatrix.elements);
  }

  updateProjectionMatrix() {
    this.aspect = canvas.width / canvas.height;
    this.projectionMatrix.setPerspective(this.fov, this.aspect, this.near, this.far);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, this.projectionMatrix.elements);
  }

  moveForward() {
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

  panLeft() {
    const alpha = this.rotateSpeed * Math.PI/180; 
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


