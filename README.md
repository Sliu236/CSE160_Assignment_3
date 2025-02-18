# CSE160_Assignment_3
Author: Size Liu sliu236@ucsc.edu
This is assignment 3 for CSE160. This project contain two main folder: lib and src

lib contains: 
cuon-utils.js
webgl-debug.js
webgl-utils.js 
cuon-matrix-cse160.js
(These files are indispensable libraries)

src contains:
 World.html (The body of the page)
 World.js  (java scripts to support web pages)
 Point.js (A java script that implements drawing point)
 Triangle.js (A java script that implements drawing triangle)
 Tetrahedron.js  (A java script that implements drawing circles)
 Cube.js (A java script that implements drawing cube)
 Camera.js (A java script that implement camera movement)

 other resource(texture):
 brick.webp
 dirt.jpg
 grass.jpg
 grass2.jpg
 ground.png
 sky.jpg
 sky2.jpg


 Notes on buttons in web pages(World.html) :
    How to Controls 
    W A S D - Move camera (Forward, Backward, Left, Right)
    Mouse - Look around (You need to right click the canvas first, hit ESC to quit)
    Click - Lock/Unlock cursor
    Z - Add block in front (Some are not very sensitive, you may need to try a few more times)
    X - Remove block in front (Some are not very sensitive, you may need to try a few more times)
    ESC - Exit pointer lock mode


    Pac-Man
    A simple Pac-Man game is built in. On each page refresh, several yellow squares are randomly generated in the canvas, and when the coordinates of your control camera coincide with the yellow squares (“Pacman”), you get 1 point (see Console).(Some are not very sensitive, you may need to try a few more times)

 Other clarifications: The code contained in this assignment is derived in large part from the YouTube playlists(https://www.youtube.com/playlist?list=PLbyTU_tFIkcOs7XVopOy5Oti-HGiIZx0J) provided with the course. At the same time I accomplished this assignment with the help of artificial intelligence (Chatgpt, deepseek) especially in the area of object movement logic(camera), understanding and integrating code, attempted to import obj file (though ultimately failed) etc. If this inadvertently violates any of the terms regarding academic integrity, please contact me promptly!
