/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/

/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
This version of Cube renders a cube with UV coordinates for each face.
*/

class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();      
    }

    render() {
        var rgba = this.color;
        // 将当前的模型矩阵传递到着色器
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
        // 设置颜色
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        // --- 前面 (Front face, z = 0) ---  
        // 顶点: A(0,0,0), B(1,0,0), C(1,1,0), D(0,1,0)
        // UV: A(0,0), B(1,0), C(1,1), D(0,1)
        // 三角形1: A, B, C
        drawTriangle3DUV(
            [0, 0, 0,   1, 0, 0,   1, 1, 0],
            [0, 0,      1, 0,      1, 1]
        );
        // 三角形2: A, C, D
        drawTriangle3DUV(
            [0, 0, 0,   1, 1, 0,   0, 1, 0],
            [0, 0,      1, 1,      0, 1]
        );

        // --- 后面 (Back face, z = 1) ---  
        // 顶点: A'(0,0,1), B'(1,0,1), C'(1,1,1), D'(0,1,1)
        // 注意：为使法向一致，这里我们反向定义顶点顺序
        // 三角形1: B', A', D'
        drawTriangle3DUV(
            [1, 0, 1,   0, 0, 1,   0, 1, 1],
            [1, 0,      0, 0,      0, 1]
        );
        // 三角形2: B', D', C'
        drawTriangle3DUV(
            [1, 0, 1,   0, 1, 1,   1, 1, 1],
            [1, 0,      0, 1,      1, 1]
        );

        // --- 左面 (Left face, x = 0) ---  
        // 顶点: A(0,0,0), D(0,1,0), D'(0,1,1), A'(0,0,1)
        // 三角形1: A, D, D'
        drawTriangle3DUV(
            [0, 0, 0,   0, 1, 0,   0, 1, 1],
            [0, 0,      1, 0,      1, 1]
        );
        // 三角形2: A, D', A'
        drawTriangle3DUV(
            [0, 0, 0,   0, 1, 1,   0, 0, 1],
            [0, 0,      1, 1,      0, 1]
        );

        // --- 右面 (Right face, x = 1) ---  
        // 顶点: B(1,0,0), B'(1,0,1), C'(1,1,1), C(1,1,0)
        // 三角形1: B, C, C'
        drawTriangle3DUV(
            [1, 0, 0,   1, 1, 0,   1, 1, 1],
            [0, 0,      1, 0,      1, 1]
        );
        // 三角形2: B, C', B'
        drawTriangle3DUV(
            [1, 0, 0,   1, 1, 1,   1, 0, 1],
            [0, 0,      1, 1,      0, 1]
        );

        // --- 顶面 (Top face, y = 1) ---  
        // 顶点: D(0,1,0), C(1,1,0), C'(1,1,1), D'(0,1,1)
        // 三角形1: D, C, C'
        drawTriangle3DUV(
            [0, 1, 0,   1, 1, 0,   1, 1, 1],
            [0, 0,      1, 0,      1, 1]
        );
        // 三角形2: D, C', D'
        drawTriangle3DUV(
            [0, 1, 0,   1, 1, 1,   0, 1, 1],
            [0, 0,      1, 1,      0, 1]
        );

        // --- 底面 (Bottom face, y = 0) ---  
        // 顶点: A(0,0,0), B(1,0,0), B'(1,0,1), A'(0,0,1)
        // 三角形1: A, B', B
        drawTriangle3DUV(
            [0, 0, 0,   1, 0, 1,   1, 0, 0],
            [0, 0,      1, 1,      1, 0]
        );
        // 三角形2: A, A', B'
        drawTriangle3DUV(
            [0, 0, 0,   0, 0, 1,   1, 0, 1],
            [0, 0,      0, 1,      1, 1]
        );
    }
}
