/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/


class Cube {
    constructor() {
        this.type = 'cube';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();     
        this.textureNum = -1; 
    }

    render() {
        var rgba = this.color;
        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0])
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1])

        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1])
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0])

        drawTriangle3DUV([0,0,0, 0,1,1, 0,0,1], [1,0, 0,1, 0,0])
        drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [1,0, 1,1, 0,1])

        drawTriangle3DUV([0,0,1, 1,1,1, 1,0,1], [1,0, 0,1, 0,0])
        drawTriangle3DUV([0,0,1, 0,1,1, 1,1,1], [1,0, 1,1, 0,1])

        drawTriangle3DUV([0,0,0, 0,0,1, 1,0,1], [0,1, 0,0, 1,0])
        drawTriangle3DUV([0,0,0, 1,0,1, 1,0,0], [0,1, 1,0, 1,1])

        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0])
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1])

    }

    renderfast() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        drawTriangle3DUV([0,0,0, 1,1,0, 1,0,0], [0,0, 1,1, 1,0])
        drawTriangle3DUV([0,0,0, 0,1,0, 1,1,0], [0,0, 0,1, 1,1])

        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1])
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0])

        drawTriangle3DUV([0,0,0, 0,1,1, 0,0,1], [1,0, 0,1, 0,0])
        drawTriangle3DUV([0,0,0, 0,1,0, 0,1,1], [1,0, 1,1, 0,1])

        drawTriangle3DUV([0,0,1, 1,1,1, 1,0,1], [1,0, 0,1, 0,0])
        drawTriangle3DUV([0,0,1, 0,1,1, 1,1,1], [1,0, 1,1, 0,1])

        drawTriangle3DUV([0,0,0, 0,0,1, 1,0,1], [0,1, 0,0, 1,0])
        drawTriangle3DUV([0,0,0, 1,0,1, 1,0,0], [0,1, 1,0, 1,1])

        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 1,0])
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 0,1, 1,1])

    }
}
