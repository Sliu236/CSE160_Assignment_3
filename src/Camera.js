class Vector {
    constructor(arr) {
      // 保存为数组形式
      this.elements = arr.slice(); // 深拷贝
    }
    // 返回 this - b（不改变 this 和 b）
    subtract(b) {
      return new Vector([
        this.elements[0] - b.elements[0],
        this.elements[1] - b.elements[1],
        this.elements[2] - b.elements[2]
      ]);
    }
    // 返回 this + b
    add(b) {
      return new Vector([
        this.elements[0] + b.elements[0],
        this.elements[1] + b.elements[1],
        this.elements[2] + b.elements[2]
      ]);
    }
    // 返回 this 除以标量 scalar
    divide(scalar) {
      return new Vector([
        this.elements[0] / scalar,
        this.elements[1] / scalar,
        this.elements[2] / scalar
      ]);
    }
    // 返回 this 乘以标量 scalar
    multiply(scalar) {
      return new Vector([
        this.elements[0] * scalar,
        this.elements[1] * scalar,
        this.elements[2] * scalar
      ]);
    }
    // 返回 this · b
    dot(b) {
      return this.elements[0]*b.elements[0] +
             this.elements[1]*b.elements[1] +
             this.elements[2]*b.elements[2];
    }
    // 返回 this x b
    cross(b) {
      return new Vector([
        this.elements[1]*b.elements[2] - this.elements[2]*b.elements[1],
        this.elements[2]*b.elements[0] - this.elements[0]*b.elements[2],
        this.elements[0]*b.elements[1] - this.elements[1]*b.elements[0]
      ]);
    }
    // 返回向量长度
    length() {
      return Math.sqrt(this.dot(this));
    }
  }


class Camera {
    constructor() {
        this.eye = new Vector([0, 0, 3]);
        this.at = new Vector([0, 0, -100]);
        this.up = new Vector([0, 1, 0]);
    }

    // 前进：f = at - eye
    forward() {
        var f = this.at.subtract(this.eye);
        f = f.divide(f.length());
        this.at = this.at.add(f);
        this.eye = this.eye.add(f);
    }

    // 后退
    back() {
        // 这里疑似有个小笔误，应该是：
        // var f = this.at.subtract(this.eye);
        var f = this.at.subtract(this.eye);
        f = f.divide(f.length());
        this.at = this.at.subtract(f);
        this.eye = this.eye.subtract(f);
    }

    // 向左平移（left）：基于现有写法
    left() {
        var f = this.eye.subtract(this.at);  // 计算前向向量
        f = f.divide(f.length());
        var s = f.cross(this.up);            // s = f x up（或 up x f，取决于你想要的方向）
        s = s.divide(s.length());
        this.at = this.at.add(s);
        this.eye = this.eye.add(s);
    }

    // 向右平移（right）：与 left 相反
    right() {
        var f = this.eye.subtract(this.at);
        f = f.divide(f.length());
        // 如果 left 用的是 s = f.cross(up)，那么 right 可以用 s = up.cross(f)
        // 或者直接在最终加/减 s 时反向操作
        var s = this.up.cross(f);  
        s = s.divide(s.length());
        // 这里与 left 相反，所以我们做 subtract
        this.at = this.at.subtract(s);
        this.eye = this.eye.subtract(s);
    }

    // 视角左转（Q 键）：绕 up 向量做小角度旋转
    panLeft(angleDeg) {
        // 计算前向向量 f = at - eye
        let f = this.at.subtract(this.eye);
        // 将角度转换成弧度
        let rad = angleDeg * Math.PI / 180.0;

        // 这里假设你没有 Matrix4，可以用简单的 Rodrigues' rotation formula，
        // 或自己定义一个 rotateAroundAxis() 方法。
        // 为简洁，下面演示一个“近似”写法，用 cross + dot 进行旋转：
        
        // 1) 先归一化 up
        let u = this.up.divide(this.up.length());
        // 2) f 平行于 up 的分量 & 垂直于 up 的分量
        let parallel = u.multiply(f.dot(u));          // f 在 up 方向上的分量
        let perp    = f.subtract(parallel);           // 垂直于 up 的分量
        // 3) 对 perp 分量进行平面内旋转
        // perp 旋转 angleDeg => perp*cos(rad) + (u x perp)*sin(rad)
        let w = u.cross(perp);                        // 垂直于 perp 的向量
        // perp'
        let perpPrime = perp.multiply(Math.cos(rad)).add(w.multiply(Math.sin(rad)));
        // 新的 f = parallel + perp'
        let fPrime = parallel.add(perpPrime);

        // 更新 at = eye + fPrime
        this.at = this.eye.add(fPrime);
    }

    // 视角右转（E 键）：绕 up 反向旋转
    panRight(angleDeg) {
        let f = this.at.subtract(this.eye);
        let rad = angleDeg * Math.PI / 180.0;
        
        let u = this.up.divide(this.up.length());
        let parallel = u.multiply(f.dot(u));
        let perp = f.subtract(parallel);
        let w = u.cross(perp);
        // 这里旋转 -angleDeg => cos(-θ)=cos(θ), sin(-θ)=-sin(θ)
        let perpPrime = perp.multiply(Math.cos(-rad)).add(w.multiply(Math.sin(-rad)));
        let fPrime = parallel.add(perpPrime);
        this.at = this.eye.add(fPrime);
    }
}
