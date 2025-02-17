/*[student's name: Size Liu]
[sliu236@ucsc.edu 1852375]

Notes to Grader:
[N/A]*/

class Tetrahedron {
    constructor() {
        this.type = 'tetrahedron';
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        let v0 = [0.0, 1.0, 0.0];  
        let v1 = [-0.5, 0.0, -0.5];  
        let v2 = [0.5, 0.0, -0.5];  
        let v3 = [0.0, 0.0, 0.5];   

        drawTriangle3D([...v0, ...v1, ...v2]);
        drawTriangle3D([...v0, ...v2, ...v3]); 
        drawTriangle3D([...v0, ...v3, ...v1]); 
        drawTriangle3D([...v1, ...v2, ...v3]); 

        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);
        drawTriangle3D([...v0, ...v1, ...v2]);

        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);
        drawTriangle3D([...v0, ...v2, ...v3]);

        gl.uniform4f(u_FragColor, rgba[0] * 0.7, rgba[1] * 0.7, rgba[2] * 0.7, rgba[3]);
        drawTriangle3D([...v0, ...v3, ...v1]);

        gl.uniform4f(u_FragColor, rgba[0] * 0.6, rgba[1] * 0.6, rgba[2] * 0.6, rgba[3]);
        drawTriangle3D([...v1, ...v2, ...v3]);
    }
}



