var floatsPerVertex = 6;

var keydict = {};
var loop = false;

var g_EyeX = 0; 
var g_EyeY = 4;
var g_EyeZ = 2.5;

var g_cent_x = 0.0; 
var g_cent_y = 0.0; 
var g_cent_z = 0.5;

var theta = 0;
var flag = -1;

var lMode = 1;
var Mode_limit = 2;

var user_X = -2.0; 
var user_Y = 2.0; 
var user_Z = 5.0;

var userDiffuseR = 0.2;
var userDiffuseG = 0.6; 
var userDiffuseB = 0.7;

var userSpecularR = 1.0; 
var userSpecularG = 0.8; 
var userSpecularB = 1.0;

var userAmbientR = 0.5; 
var userAmbientG = 0.5; 
var userAmbientB = 0.5;

var viewMatrix = new Matrix4(); 
var projMatrix = new Matrix4();
var normalMatrix = new Matrix4(); 
var modelMatrix = new Matrix4();

var head_light = true; 
var world_light = true;
var hlOn; 
var wLOn;

var currentAngle;
var ANGLE_STEP = 40.0; 
var ANGLE_STEP_Worm = 90; 
var ANGLE_STEP_Worm2 = 60;

var VSHADER_SOURCE =
  "precision highp float;\n" +
  "precision highp int;\n" +

  "attribute vec4 a_Position;\n" +
  "attribute vec4 a_Color;\n" +
  "attribute vec4 a_Normal;\n" +

  "uniform vec3 u_HeadlightPosition;\n" +
  "uniform vec3 u_HeadlightDiffuse;\n" +
  "uniform vec3 u_HeadlightSpecular;\n" +

  "uniform vec3 u_LightDiffuse;\n" +
  "uniform vec3 u_AmbientLight;\n" +
  "uniform vec3 u_LightPosition;\n" +
  "uniform vec3 u_LightDirection;\n" +

  "uniform mat4 u_ModelMatrix;\n" +
  "uniform mat4 u_ViewMatrix;\n" +
  "uniform mat4 u_ProjMatrix;\n" +
  "uniform mat4 u_NormalMatrix;\n" +

  "uniform vec3 u_MatDiffuse; \n" +
  "uniform vec3 u_MatAmbience;\n" +
  "uniform vec3 u_MatSpecular;\n" +
  "uniform vec3 u_MatEmissive;\n" +
  "uniform int u_MatShiny;\n" +

  "varying vec3 v_Position;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec4 v_Color;\n" +
  "varying vec3 v_Kd;\n" +

  "void main() {\n" +
    "gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n" +
    "v_Position = vec3(u_ViewMatrix * a_Position);\n" +
    "v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n" +
    "v_Kd = u_MatDiffuse; \n" +
    "v_Color = a_Color;\n" +
  "}\n";

var FSHADER_SOURCE =
  "precision highp int;\n" +
  "precision highp float;\n" +

  "uniform vec3 u_Specular;\n" +
  "uniform vec3 u_LightPosition;\n" +
  "uniform vec3 u_LightDiffuseColor;\n" +
  "uniform vec3 u_AmbientLight;\n" +

  "uniform int lightMode;\n" +
  "uniform int head_light;\n" +
  "uniform int world_light;\n" +

  "varying vec3 v_Position;\n" +
  "varying vec4 v_Color;\n" +
  "varying vec3 v_Normal;\n" +
  "varying vec3 v_Kd;\n" +
  "uniform vec3 u_eyePosition; \n" +

  "uniform vec3 u_HeadlightDiffuse;\n" +
  "uniform vec3 u_HeadlightPosition;\n" +
  "uniform vec3 u_HeadlightSpecular;\n" +

  "uniform vec3 u_MatDiffuse; \n" +
  "uniform vec3 u_MatAmbience;\n" +
  "uniform vec3 u_MatSpecular;\n" +
  "uniform vec3 u_MatEmissive;\n" +
  "uniform int u_MatShiny;\n" +

  "void main() { \n" +
    "vec3 normal = normalize(v_Normal); \n" +
    "vec3 eyeDirection = normalize(u_eyePosition.xyz - v_Position); \n" +
    "vec3 hLightDirection = normalize(u_HeadlightPosition - v_Position);\n" +
    "vec3 lightDirection = normalize(u_LightPosition - v_Position);\n" +

    "float nDotHl = max(dot(hLightDirection, normal),0.0);\n" +
    "float nDotL = max(dot(lightDirection, normal), 0.0); \n" +

    "vec3 H = normalize(lightDirection + eyeDirection); \n" +

    "float nDotH = max(dot(H, normal), 0.0); \n" +
    "float e02 = nDotH*nDotH; \n" +
    "float e04 = e02*e02; \n" +
    "float e08 = e04*e04; \n" +
    "float e16 = e08*e08; \n" +
    "float e32 = e16*e16; \n" +
    "float e64 = e32*e32; \n" +

    "vec3 hspec;\n" +
    "vec3 hdiff;\n" +
    "vec3 diffuse;\n" +
    "vec3 ambient;\n" +
    "vec3 emissive;\n" +
    "vec3 specular;\n" +

    "float shineF = float(u_MatShiny);\n" +
    "emissive = u_MatEmissive;\n" +
    "ambient = u_AmbientLight * u_MatAmbience;\n" +
    "specular = u_Specular * u_MatSpecular * e32;\n" +
    "diffuse = u_LightDiffuseColor * v_Kd * nDotL;\n" +
    "hdiff = u_HeadlightDiffuse * v_Kd * nDotHl;\n" +
    "hspec = u_HeadlightSpecular * u_MatSpecular * e32;\n" +
    "vec4 fragWorld = vec4(emissive + diffuse + ambient + specular,1.0);\n" +
    "vec4 fragHead = vec4(hdiff + hspec,1.0);\n" +
    "vec4 frag;\n" +

    // Blinn-Phong 
    "if (lightMode == 2){\n" +
      "vec3 halfDirection = normalize(lightDirection);\n" +
      "float ang = max(dot(halfDirection, normal),0.0);\n" +
      "float spec = pow(ang, shineF);\n" +
      "fragWorld = vec4((ambient + emissive + nDotL*diffuse+spec*specular),1.0);\n" +
      "halfDirection = normalize(hLightDirection);\n" +
      "ang = max(dot(halfDirection, normal),0.0);\n" +
      "spec = pow(ang, shineF);\n" +
      "fragHead = vec4((ambient + nDotHl*hdiff+spec*hspec),1.0);\n" +
    "}\n" +

    "if (lightMode == 3) {\n" +
      "hspec = u_HeadlightSpecular * u_MatSpecular * e02;\n" +
      "specular = u_Specular * u_MatSpecular * e02;\n" +
      "fragWorld = vec4((emissive + ambient + nDotL*diffuse + nDotH*specular),1.0);\n" +
      "fragHead = vec4((ambient + nDotHl*hdiff+specular*hspec),1.0);\n" +
    "}\n" +

    "if (lightMode == 4) {\n" +
      "vec3 reflectionDirection = reflect(-lightDirection, normal);\n" +
      "float temp = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 0.0);\n" +
      "vec3 spec = u_Specular * u_MatSpecular * temp;\n" +
      "fragWorld = vec4((ambient + spec + diffuse*nDotL + emissive), 1.0);\n" +
      "reflectionDirection = reflect(-hLightDirection, normal);\n" +
      "temp = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 0.0);\n" +
      "hspec = u_HeadlightSpecular * u_MatSpecular * temp;\n" +
      "fragHead = vec4((ambient + hspec + hdiff*nDotHl*e64), 1.0);\n" +
    "}\n" +

    // Handle head lights and world lights
    "if(head_light == 1 && world_light == 1) {\n" +
      "frag = fragHead + fragWorld;\n" +
    "}\n" +
    "else if(head_light == 1 && world_light == 0) {\n" +
      "frag = fragHead;\n" +
    "}\n" +
    "else\n" +
      "frag = fragWorld;\n" +
    "gl_FragColor = frag;\n" +
  "}";

function main() {

  canvas = document.getElementById("webgl");

  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);

  var n = initVertexBuffers(gl);

  if (n < 0) {
    console.log("Failed to specify the vertex information");
    return;
  }

  window.addEventListener("keydown", keydown, false);
  window.addEventListener("keyup", keyup, false);

  // Uniform matrices
  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjMatrix = gl.getUniformLocation(gl.program, "u_ProjMatrix");
  u_NormalMatrix = gl.getUniformLocation(gl.program, "u_NormalMatrix");
  u_eyePosition = gl.getUniformLocation(gl.program, "u_eyePosition");

  u_LightMode = gl.getUniformLocation(gl.program, "lightMode");

  u_HeadlightDiffuse = gl.getUniformLocation(gl.program, "u_HeadlightDiffuse");
  u_HeadlightPosition = gl.getUniformLocation(gl.program, "u_HeadlightPosition");
  u_HeadlightSpecular = gl.getUniformLocation(gl.program, "u_HeadlightSpecular");

  u_LightDiffuseColor = gl.getUniformLocation(gl.program, "u_LightDiffuseColor");
  u_LightPosition = gl.getUniformLocation(gl.program, "u_LightPosition");

  u_AmbientLight = gl.getUniformLocation(gl.program, "u_AmbientLight");
  u_Specular = gl.getUniformLocation(gl.program, "u_Specular");
  wLOn = gl.getUniformLocation(gl.program, "world_light");
  hlOn = gl.getUniformLocation(gl.program, "head_light");

  u_MatEmissive = gl.getUniformLocation(gl.program, "u_MatEmissive");
  u_MatSpecular = gl.getUniformLocation(gl.program, "u_MatSpecular");
  u_MatAmbience = gl.getUniformLocation(gl.program, "u_MatAmbience");
  u_MatDiffuse = gl.getUniformLocation(gl.program, "u_MatDiffuse");
  u_MatShiny = gl.getUniformLocation(gl.program, "u_MatShiny");

  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatSpecular, 1.0, 1.0, 1.0);
  gl.uniform3f(u_MatAmbience, 0.6, 0.3, 0.3);
  gl.uniform3f(u_MatDiffuse, 0.3, 0.3, 0.3);

  gl.uniform3f(u_HeadlightDiffuse, 1.0, 1.0, 1.0);
  gl.uniform3f(u_HeadlightSpecular, 1.0, 1.0, 1.0);
  gl.uniform1i(wLOn, 1);
  gl.uniform1i(hlOn, 1);
  gl.uniform1i(u_LightMode, lMode);

  currentAngleWorm = 0, currentAngleWorm2 = 0, currentAngle = 0;

  var tick = function() {
    canvas.width = innerWidth-25;
    canvas.height = innerHeight * 0.75;
    gl.uniform1i(u_LightMode, lMode);
    userValues();
    gl.uniform3f(u_eyePosition, g_EyeX, g_EyeY, g_EyeZ);

    if (Object.keys(keydict) != 0) {
      checkKeys();
    }

    animate();
    animateWorm();
    animateWorm2();
    draw();
    requestAnimationFrame(tick, canvas);
  };
  tick();
}

function checkKeys() {
  var xd = g_EyeX - g_cent_x;
  var yd = g_EyeY - g_cent_y;
  var zd = g_EyeZ - g_cent_z;
  var lxy = Math.sqrt(xd * xd + yd * yd);
  var l = Math.sqrt(xd * xd + yd * yd + zd * zd);

  for (var keyCode in keydict) {
    loop = true;
    switch (keyCode) {
      case "37": // rotate left
        if (flag == -1) theta = -Math.acos(xd / lxy) + 0.1;
        else theta = theta + 0.1;
        g_cent_x = g_EyeX + lxy * Math.cos(theta);
        g_cent_y = g_EyeY + lxy * Math.sin(theta);
        flag = 1;
        break;
      case "38": // rotate up
        g_cent_z = g_cent_z + 0.1;
        break;
      case "39": // rotate right
        if (flag == -1) theta = -Math.acos(xd / lxy) - 0.1;
        else theta = theta - 0.1;
        g_cent_x = g_EyeX + lxy * Math.cos(theta);
        g_cent_y = g_EyeY + lxy * Math.sin(theta);
        flag = 1;
        break;
      case "40": // rotate down
        g_cent_z = g_cent_z - 0.1;
        break;

      case "87": // go forward
        g_cent_x = g_cent_x - 0.1 * (xd / l);
        g_cent_y = g_cent_y - 0.1 * (yd / l);
        g_cent_z = g_cent_z - 0.1 * (zd / l);

        g_EyeX = g_EyeX - 0.1 * (xd / l);
        g_EyeY = g_EyeY - 0.1 * (yd / l);
        g_EyeZ = g_EyeZ - 0.1 * (zd / l);
        break;

      case "83": // go back
        g_cent_x = g_cent_x + 0.1 * (xd / l);
        g_cent_y = g_cent_y + 0.1 * (yd / l);
        g_cent_z = g_cent_z + 0.1 * (zd / l);

        g_EyeX = g_EyeX + 0.1 * (xd / l);
        g_EyeY = g_EyeY + 0.1 * (yd / l);
        g_EyeZ = g_EyeZ + 0.1 * (zd / l);

        break;

      case "68": // strafe left
        g_EyeX = g_EyeX - 0.1 * yd / lxy;
        g_EyeY = g_EyeY + 0.1 * xd / lxy;
        g_cent_x -= 0.1 * yd / lxy;
        g_cent_y += 0.1 * xd / lxy;

        break;
      case "65": // strafe right
        g_EyeX = g_EyeX + 0.1 * yd / lxy;
        g_EyeY = g_EyeY - 0.1 * xd / lxy;
        g_cent_x += 0.1 * yd / lxy;
        g_cent_y -= 0.1 * xd / lxy;

        break;
      default:
        return;
    }
  }
  loop = false;
}

function initVertexBuffers(gl) {

  makeGroundGrid();
  makeSphere();

  mySize = gndVerts.length + sphVerts.length;

  var nn = mySize / floatsPerVertex;

  var vertices = new Float32Array(mySize);

  gndStart = 0;
  for (i = 0, j = 0; j < gndVerts.length; i++, j++) {
    vertices[i] = gndVerts[j];
  }
  sphereStart = i;
  for (j = 0; j < sphVerts.length; i++, j++) {
    vertices[i] = sphVerts[j];
  }


  // Create a vertex buffer object (VBO)
  var vertexColorbuffer = gl.createBuffer();
  if (!vertexColorbuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  var FSIZE = vertices.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  gl.vertexAttribPointer(
    a_Position,
    3,
    gl.FLOAT,
    false,
    FSIZE * floatsPerVertex,
    0
  );
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment

  var a_Normal = gl.getAttribLocation(gl.program, "a_Normal");
  if (a_Normal < 0) {
    console.log("Failed to get the storage location of a_Normal");
    return -1;
  }
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Normal);

  return mySize / floatsPerVertex; // return # of vertices
}

function draw() {
  // Clear <canvas> color AND DEPTH buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //Set the lights
  if (head_light) {
    //Set the position of headlight and uniform
    gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);
    gl.uniform1i(hlOn, 1);
  } else {
    gl.uniform1i(hlOn, 0);
  }

  if (world_light) {
    gl.uniform1i(wLOn, 1);
    gl.uniform3f(u_LightPosition, user_X, user_Y, user_Z);
    gl.uniform3f(u_AmbientLight, userAmbientR, userAmbientG, userAmbientB);
    gl.uniform3f(u_LightDiffuseColor, userDiffuseR, userDiffuseG, userDiffuseB);
    gl.uniform3f(u_Specular, userSpecularR, userSpecularG, userSpecularB);
  } else {
    gl.uniform3f(u_LightDiffuseColor, 0, 0, 0);
    gl.uniform3f(u_AmbientLight, 0, 0, 0);
    gl.uniform3f(u_LightPosition, 0, 0, 0);
    gl.uniform3f(u_Specular, 0, 0, 0);
    gl.uniform1i(wLOn, 0);
  }


  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);


  gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
  );

  var vpAspect = canvas.width / canvas.height;

  projMatrix.setPerspective(
    35,
    vpAspect,
    1,
    100
  );

  viewMatrix.setLookAt(
    g_EyeX,
    g_EyeY,
    g_EyeZ, // eye position
    g_cent_x,
    g_cent_y,
    g_cent_z, // look-at point
    0,
    0,
    1
  ); // up vector

  // Pass the view projection matrix to our shaders:
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniform3f(u_HeadlightPosition, g_EyeX, g_EyeY, g_EyeZ);

  drawAll();
}

function drawAll() {


  viewMatrix.scale(0.2, 0.2, 0.2);

  // Store separate view matrices for each group of objects - 4 objects
  pushMatrix(viewMatrix);
  pushMatrix(viewMatrix);
  pushMatrix(viewMatrix);
  pushMatrix(viewMatrix);


  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.19225, 0.19225, 0.19225);
  gl.uniform3f(u_MatDiffuse, 0.50754, 0.50754, 0.507543);
  gl.uniform3f(u_MatSpecular, 0.508273, 0.508273, 0.508273);


  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  // Ground plane:
  gl.drawArrays(
    gl.LINES, 
    gndStart / floatsPerVertex, // start at this vertex number, and
    gndVerts.length / floatsPerVertex
  ); // draw this many vertices

  // ==================== object - Worm ====================

  // First sphere
  viewMatrix.translate(8,3,5);
  viewMatrix.scale(3,3,3); 
  viewMatrix.rotate(90,1,1,0);
  viewMatrix.rotate(currentAngleWorm, 1, 1, 1);

  viewMatrix.scale(.3,.3,.3);

  pushMatrix(viewMatrix);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);


  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.25,     0.20725,  0.20725);
  gl.uniform3f(u_MatDiffuse, 1.0,      0.829,    0.829);
  gl.uniform3f(u_MatSpecular, 0.296648, 0.296648, 0.296648);
  gl.uniform1i(u_MatShiny, 11.264);

  gl.drawArrays(gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex);

  viewMatrix = popMatrix();

  // Second sphere
  viewMatrix.translate(1,0.5,-1);
  viewMatrix.scale(0.6,0.6,0.6); 
  viewMatrix.rotate(currentAngleWorm*0.8,0,1,0);

  pushMatrix(viewMatrix);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.1,     0.1,    0.1);
  gl.uniform3f(u_MatDiffuse, 0.6,     0.0,    0.0);
  gl.uniform3f(u_MatSpecular, 0.6,     0.6,    0.6);
  gl.uniform1i(u_MatShiny, 100.0);

  gl.drawArrays(gl.TRIANGLE_STRIP,
  sphereStart / floatsPerVertex,
  sphVerts.length / floatsPerVertex);

  viewMatrix = popMatrix();

  // Third sphere
  viewMatrix.translate(1,0.5,-1);
  viewMatrix.scale(0.5,0.5,0.5); // scale relative to parent
  viewMatrix.rotate(currentAngleWorm*0.8,0,1,0);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);


  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.05, 0.05, 0.05);
  gl.uniform3f(u_MatDiffuse, 0.0, 0.2, 0.6);
  gl.uniform3f(u_MatSpecular, 0.1, 0.2, 0.3);
  gl.drawArrays(gl.TRIANGLE_STRIP,
  sphereStart / floatsPerVertex,
  sphVerts.length / floatsPerVertex);

  viewMatrix = popMatrix();


  // ==================== object 2 - Worm2 ====================
  // Sphere
  viewMatrix = popMatrix();
  viewMatrix.translate(-4, 2, 3);
  viewMatrix.rotate(currentAngle, 0, 0, 1);
  pushMatrix(viewMatrix);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.1,     0.1,    0.1);
  gl.uniform3f(u_MatDiffuse, 0.6,     0.0,    0.0);
  gl.uniform3f(u_MatSpecular, 0.6,     0.6,    0.6);
  gl.uniform1i(u_MatShiny, 100.0);

  gl.drawArrays(gl.TRIANGLE_STRIP,
  sphereStart / floatsPerVertex,
  sphVerts.length / floatsPerVertex);
  viewMatrix = popMatrix();

  // Smaller Sphere
  viewMatrix.translate(0, 0, 1.6);
  viewMatrix.rotate(currentAngleWorm2, 1, 1, 0);
  viewMatrix.scale(0.6,0.6,0.6);
  pushMatrix(viewMatrix);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.25,     0.148,    0.06475);
  gl.uniform3f(u_MatDiffuse, 0.4,      0.2368,   0.1036);
  gl.uniform3f(u_MatSpecular, 0.774597, 0.458561, 0.200621);
  gl.uniform1i(u_MatShiny, 76.8);

  gl.drawArrays(gl.TRIANGLE_STRIP,
  sphereStart / floatsPerVertex,
  sphVerts.length / floatsPerVertex);
  viewMatrix = popMatrix();


  viewMatrix.translate(0, 0, 1.5);
  viewMatrix.rotate(currentAngleWorm2, 1, 0, 0);
  viewMatrix.scale(0.6,0.6,0.6);
  pushMatrix(viewMatrix);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.25,     0.25,     0.25);
  gl.uniform3f(u_MatDiffuse, 0.4,      0.4,      0.4);
  gl.uniform3f(u_MatSpecular, 0.774597, 0.774597, 0.774597);
  gl.uniform1i(u_MatShiny, 76.8);

    gl.drawArrays(
    gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex
  );
  viewMatrix = popMatrix();

  // =========================== Copper sphere ===========================
  viewMatrix = popMatrix();
  viewMatrix.translate(4, -3, 4);
  viewMatrix.rotate(currentAngle , 0, 1, 0);
  viewMatrix.scale(3, 3, 3);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);



  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.2295,   0.08825,  0.0275);
  gl.uniform3f(u_MatDiffuse, 0.5508,   0.2118,   0.066);
  gl.uniform3f(u_MatSpecular, 0.580594, 0.223257, 0.0695701);
  gl.uniform1i(u_MatShiny, 51.2);

  gl.drawArrays(
    gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex
  );

  // ============================== Mickey ==============================
  // Face
  viewMatrix = popMatrix();
  viewMatrix.translate(4, 7, 2.5);
  viewMatrix.rotate(currentAngle * 2, 0, 0, 1);
  pushMatrix(viewMatrix);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);

  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  // Materials
  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.19225,  0.19225,  0.19225);
  gl.uniform3f(u_MatDiffuse, 0.50754,  0.50754,  0.50754);
  gl.uniform3f(u_MatSpecular, 0.508273, 0.508273, 0.508273);
  gl.uniform1i(u_MatShiny, 51.2);


    gl.drawArrays(
    gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex
  );


  // Ears

  //Ear1
  viewMatrix = popMatrix();
  viewMatrix.translate(1, 0, 1);
  viewMatrix.scale(.5, .5, .5);

  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.02,    0.02,   0.02);
  gl.uniform3f(u_MatDiffuse, 0.01,    0.01,   0.01);
  gl.uniform3f(u_MatSpecular, 0.4,     0.4,    0.4);
  gl.uniform1i(u_MatShiny, 10.0);

    gl.drawArrays(
    gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex
  );

  //Ear2
  viewMatrix.translate(-4, 0, 0);
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  normalMatrix.setInverseOf(viewMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

  gl.uniform3f(u_MatEmissive, 0.0, 0.0, 0.0);
  gl.uniform3f(u_MatAmbience, 0.02,    0.02,   0.02);
  gl.uniform3f(u_MatDiffuse, 0.01,    0.01,   0.01);
  gl.uniform3f(u_MatSpecular, 0.4,     0.4,    0.4);
  gl.uniform1i(u_MatShiny, 10.0);

    gl.drawArrays(
    gl.TRIANGLE_STRIP,
    sphereStart / floatsPerVertex,
    sphVerts.length / floatsPerVertex
  );


}

var g_last = Date.now();
function animate() {
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;

  currentAngle = currentAngle + ANGLE_STEP * elapsed / 1000.0;
  currentAngle %= 360;
}

var g_last2 = Date.now();
function animateWorm() {
  var now = Date.now();
  var elapsed = now - g_last2;
  g_last2 = now;

  if(currentAngleWorm >   30.0 && ANGLE_STEP_Worm > 0) ANGLE_STEP_Worm = -ANGLE_STEP_Worm;
  if(currentAngleWorm <  -100.0 && ANGLE_STEP_Worm < 0) ANGLE_STEP_Worm = -ANGLE_STEP_Worm;

  var newAngle = currentAngleWorm + (ANGLE_STEP_Worm * elapsed) / 1000.0;
  currentAngleWorm = newAngle %= 360;
}

var g_last3 = Date.now();
function animateWorm2() {
  var now = Date.now();
  var elapsed = now - g_last3;
  g_last3 = now;

  if(currentAngleWorm2 >   50.0 && ANGLE_STEP_Worm2 > 0) ANGLE_STEP_Worm2 = -ANGLE_STEP_Worm2;
  if(currentAngleWorm2 <  -50.0 && ANGLE_STEP_Worm2 < 0) ANGLE_STEP_Worm2 = -ANGLE_STEP_Worm2;

  var newAngle = currentAngleWorm2 + (ANGLE_STEP_Worm2 * elapsed) / 1000.0;
  currentAngleWorm2 = newAngle %= 360;
}

function keydown(ev) {
  keydict[ev.keyCode] = true;
}
function keyup(ev) {
  switch(ev.keyCode) {
    case 77:
      switchModes();
      break;
    case 72: // h
      head_light = !head_light;
      break;
    case 32: // spacebar
      world_light = !world_light;
      break;
    default:
      break;
  }
  if (keydict.hasOwnProperty(ev.keyCode)) delete keydict[ev.keyCode];
}

function switchModes() {
  if (lMode == Mode_limit) lMode = 1;
  else lMode++;

  var value = "";
  switch(lMode) {
    case 1:
      value = "Phong"
      break;
    case 2:
      value = "Blinn-Phong"
      break;
    default:
      return;
  }

    document.getElementById("lMode").innerHTML = "Lighting "+"Mode"+ ": " + value;
}

function userValues() {
  var ar, ag, ab, dr, dg, db, sr, sg, sb, px, py, px;

  px = document.getElementById("PX").value;
  if (isNaN(px)) px = user_X;
  py = document.getElementById("PY").value;
  if (isNaN(py)) py = user_Y;
  pz = document.getElementById("PZ").value;
  if (isNaN(pz)) pz = user_Z;

  sr = document.getElementById("SR").value;
  if (isNaN(sr)) sr = userSpecularR;
  sg = document.getElementById("SG").value;
  if (isNaN(sg)) sg = userSpecularG;
  sb = document.getElementById("SB").value;
  if (isNaN(sb)) sb = userSpecularB;

  dr = document.getElementById("DR").value;
  if (isNaN(dr)) dr = userDiffuseR;
  dg = document.getElementById("DG").value;
  if (isNaN(dg)) dg = userDiffuseG;
  db = document.getElementById("DB").value;
  if (isNaN(db)) db = userDiffuseB;

  ar = document.getElementById("AR").value;
  if (isNaN(ar)) ar = userAmbientR;
  ag = document.getElementById("AG").value;
  if (isNaN(ag)) ag = userAmbientG;
  ab = document.getElementById("AB").value;
  if (isNaN(ab)) ab = userAmbientB;


  userDiffuseR = dr;
  userDiffuseG = dg;
  userDiffuseB = db;
  user_X = px;
  user_Y = py;
  user_Z = pz;
  userAmbientR = ar;
  userAmbientG = ag;
  userAmbientB = ab;
  userSpecularR = sr;
  userSpecularG = sg;
  userSpecularB = sb;
}



// ========================== Shapes ============================

function makeGroundGrid() {
  var xcount = 500;
  var ycount = 500;
  var xymax = 1000.0;

  gndVerts = new Float32Array(floatsPerVertex * 2 * (xcount + ycount));

  var xgap = xymax / (xcount - 1);
  var ygap = xymax / (ycount - 1);

  for (v = 0, j = 0; v < 2 * xcount; v++, j += floatsPerVertex) {
    if (v % 2 == 0) {
      gndVerts[j] = -xymax + v * xgap;
      gndVerts[j + 1] = -xymax;
      gndVerts[j + 2] = 0.0;
    } else {
      gndVerts[j] = -xymax + (v - 1) * xgap;
      gndVerts[j + 1] = xymax;
      gndVerts[j + 2] = 0.0;
    }
    gndVerts[j + 3] = 1;
    gndVerts[j + 4] = 1;
    gndVerts[j + 5] = 1;
  }
  for (v = 0; v < 2 * ycount; v++, j += floatsPerVertex) {
    if (v % 2 == 0) {
      gndVerts[j] = -xymax;
      gndVerts[j + 1] = -xymax + v * ygap;
      gndVerts[j + 2] = 0.0;
    } else {
      gndVerts[j] = xymax;
      gndVerts[j + 1] = -xymax + (v - 1) * ygap;
      gndVerts[j + 2] = 0.0;
    }
    gndVerts[j + 3] = 1;
    gndVerts[j + 4] = 1;
    gndVerts[j + 5] = 1;
  }
}

function makeSphere() {

  var slices = 41; 

  var sliceVerts = 41; 

  var topColr = new Float32Array([0.5, 0.5, 0.5]); 
  var equColr = new Float32Array([0.3, 0.3, 0.3]); 
  var botColr = new Float32Array([1, 1, 1]); 
  var sliceAngle = Math.PI / slices; 

  sphVerts = new Float32Array((slices * 2 * sliceVerts - 2) * floatsPerVertex);

  var cos0 = 0.0; 
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0;
  var j = 0; 
  var isLast = 0;
  var isFirst = 1;
  for (s = 0; s < slices; s++) {

    if (s == 0) {
      isFirst = 1; 
      cos0 = 1.0; 
      sin0 = 0.0;
    } else {
      isFirst = 0;
      cos0 = cos1;
      sin0 = sin1;
    } 
    cos1 = Math.cos((s + 1) * sliceAngle);
    sin1 = Math.sin((s + 1) * sliceAngle);

    if (s == slices - 1) isLast = 1; 
    for (v = isFirst; v < 2 * sliceVerts - isLast; v++, j += floatsPerVertex) {
      if (v % 2 == 0) {
        sphVerts[j] = sin0 * Math.cos(Math.PI * v / sliceVerts);
        sphVerts[j + 1] = sin0 * Math.sin(Math.PI * v / sliceVerts);
        sphVerts[j + 2] = cos0;
      } else {
        sphVerts[j] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts); 
        sphVerts[j + 1] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts); 
        sphVerts[j + 2] = cos1;
      }
      if (s == 0) {
        sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 5] = cos1;
      } else if (s == slices - 1) {
        sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 5] = cos1;
      } else {
        sphVerts[j + 3] = sin1 * Math.cos(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 4] = sin1 * Math.sin(Math.PI * (v - 1) / sliceVerts);
        sphVerts[j + 5] = cos1;
      }
    }
  }
}






