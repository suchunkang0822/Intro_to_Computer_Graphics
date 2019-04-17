
/*    
   quatGUI_03.js   Jack Tumblin, jet861, 2019.02.06 
  
  Exploring Quaternions with the aid of interactive GUI features & 'lib1.js'
  
    Version control:
  quatGUI_01 -- simplified and 'cleaned up' copy of the 'tetraGUI_10' program 
        from 2019.01.25.ProjA_Help03.  Added 'depth reversal' fix and
        --REMOVED 'myKeyPress()' fcn (deprecated on Firefox); 
          put all keyboard-response contents into myKeyDown().
        --append_Wedge(), drawWedge() to replace 'halfTetra' shape with simpler
          less awkward geometry: (mimics old 5.04jt.ControlMulti starter code). 
        --Add 'append_Axes(), drawAxes() to depict current drawing axes on-screen.
        
  quatGUI_03 -- add fixed perspective camera matrices to 'drawAll()', as done in
        starter code 2019.02.11.Cameras -> ch07_class -> BasicShapesCam_DONE
        (~line585)
  
*/

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.

//------------For WebGL-----------------------------------------------
var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
var g_myMatrix = new Matrix4();   
                  // 4x4 matrix we send to the GPU where it transforms vertices
var g_tmpMatrix = new Matrix4();  // used in drawAll() fcn for mouse-drag..

var g_digits = 5; // # of digits printed on-screen (e.g. x.toFixed(g_digits);

//------------For mouse click-and-drag: -------------------------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  


//------------For Camera GUI--------------------
var g_theta;          //x,y orientation for camera in world-space.
g_theta = 0;

perspective_angle = 35.0

z_move = -.3;
var g_phi = 0;       
var g_eyeX = -30.7;//5.0;     // current eye-point position(x,y,z)
var g_eyeY = -2.9; //5.0;
var g_eyeZ = 9.9;//3.0;
var z_near = 1.0
var z_far = 100.0


//------------For Animation---------------------------------------------
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_lastMS = Date.now();    			// Timestamp for most-recently-drawn image; 
                                    // in milliseconds; used by 'animate()' fcn 
                                    // (now called 'timerAll()' ) to find time
                                    // elapsed since last on-screen image.
var g_angle01 = 0;                  // initial rot. angle for left tetrahedron.
var g_angle01Rate = 45.0;           // spin speed, in degrees/second.
var g_angle02 = 0;                  // initial rot. angle for right tetrahedron
var g_angle02Rate = 20.0;          // spin speed, in degrees/second.
var g_angle02_MaxRock =  50.0;      // keep g_angle02 BELOW this max. angle  
var g_angle02_MinRock = -20.0;      // keep g_angle02 ABOVE this min. angle

function main() {
//=============================================================================
  gl = init();    // from Bommier's 'lib1.js' library: 
                  // do all setup needed to enable us to draw colored vertices
                  // using your browser's WebGL implemention.  Returns the
                  // WebGL 'rendering context', a giant JavaScript object that:
                  //  -- has member variables for all WebGL 'state' data (e.g. 
                  // what's enabled, what's disabled, all modes, all settings)
                  //  -- has member functions (or 'methods') for all the
                  // webGL functions. For example, we call 'gl.drawArrays()'
                  // (NOTE: 'gl' declared above as global var)

  // Additional setup:
  gl.disable(gl.CULL_FACE);       // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.25, 1);	  // set new screen-clear color, RGBA
                                        // (for WebGL framebuffer, not canvas)

  // EVERYTHING webGL draws on-screen fits within the +/-1 'cube' called
  // the 'Canonical View Volume' or CVV.  This axis-aligned cube is easy to
  // imagine because its corners are located at (x,y,z)==(+/-1, +/-1, +/-1).
  // WebGL fills the HTML-5 canvas object (the black square in our web-page)
  // with the CVV, with horizontal x-axis, vertical y-axis, and z-axis set
  // perpendicular to the screen.  
/*
  //----------------SOLVE THE 'REVERSED DEPTH' PROBLEM:------------------------
  // IF the GPU doesn't transform our vertices by a 3D Camera Projection Matrix
  // (and it doesn't -- not until Project B) then the GPU will compute reversed 
  // depth values:  depth==0 for vertex z == -1;   (but depth = 0 means 'near') 
  //		    depth==1 for vertex z == +1.   (and depth = 1 means 'far').
  //
  // To correct for this historical quirk of OpenGL/WebGL, we could either:
  //  a) reverse the sign of z before we render it (scale(1,1,-1); ?! Ugh. No.)
  //  b) reverse the usage of the depth-buffer's stored values, like this:
  gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
  gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
                            // pixel depths to 0.0  (1.0 is DEFAULT)
  gl.depthFunc(gl.GREATER); // draw a pixel only if its depth value is GREATER
                            // than the depth buffer's stored value.
                            // (gl.LESS is DEFAULT; reverse it!)L 
*/
	// Register the Keyboard & Mouse Event-handlers------------------------------
	// When users move, click or drag the mouse and when they press a key on the 
	// keyboard the operating system create a simple text-based 'event' message.
	// Your Javascript program can respond to 'events' if you:
	// a) tell JavaScript to 'listen' for each event that should trigger an
	//   action within your program: call the 'addEventListener()' function, and 
	// b) write your own 'event-handler' function for each of the user-triggered 
	//    actions; Javascript's 'event-listener' will call your 'event-handler'
	//		function each time it 'hears' the triggering event from users.
	//
  // KEYBOARD:
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function.  The 'false' 
	// arg (default) ensures myKeyDown() call in 'bubbling', not 'capture' stage)
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
	// Called when user RELEASES the key.  Now rarely used...

	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	window.addEventListener("click", myMouseClick);				
	window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);
  //
	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs!   How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments
	// END Keyboard & Mouse Event-Handlers---------------------------------------

  append_Wedge();                 // create 1st 3D part in the GPU (v0-v5)
  append_Axes();                  // create 2nd 3D part in the GPU (v6-v11)

  append_GroundGrid();            // create 3rd 3D part in the GPU (v12-v212)
  append_diamond03();
  append_trigonal_cylinder();
  append_rectangle();
  tick(); // start animation.
}

// 
function tick() {
//-----------------------------------------------------------------------------
// if global var g_isRun==true, repeatedly adjust-and-draw the on-screen image;
// otherwise do nothing.
  if(g_isRun == false)  return;
  timerAll();              // Update all animation timing parameters.
  drawAll();               // Draw it all on-screen.
  requestAnimationFrame(tick, g_canvas);    // 'at the next opportunity' call
  // the 'tick()' function again (HTML-5 function for g_canvas element).
};
  
function buttonRunStop() {
//-----------------------------------------------------------------------------
// called when user presses HTML 'Run/Stop' button on webpage.
  if(g_isRun==true) g_isRun = false;  // STOP animation.
  else {
    g_isRun = true;   // RESTART animation.
    tick();
  }
}

function timerAll() {
//-----------------------------------------------------------------------------
// Re-compute ALL parameters that may change in the next on-screen image.

  // Find the elapsed time in milliseconds:
  var now = Date.now();     
  var elapsed = now - g_lastMS; // current time - previous-frame timestamp.
  g_lastMS = now;               // set new timestamp.
  // console.log("elapsed in milliseconds:",elapsed);
  if(elapsed > 500) elapsed = 20;   // ignore long pauses (caused by hiding 
                                    // browser window or g_isRun set false)
  
  // Update the current rotation angle (adjusted by the elapsed time)
  g_angle01 = g_angle01 + (g_angle01Rate/1000.0) * elapsed;
  g_angle01 %= 360;        // keep angle between 0 and 360 degrees.
//  console.log("angle01:", g_angle01);
  
  // MORE TIME_DEPENDENT VALUES:
  g_angle02 = g_angle02 + (g_angle02Rate/1000.0) * elapsed; // advance;
  if( g_angle02 < g_angle02_MinRock ) { // did we go past lower limit?
    g_angle02 = g_angle02_MinRock;      // yes. Stop at limit, and
    if(g_angle02Rate < 0) g_angle02Rate = -g_angle02Rate; // go FORWARDS
    }
  if( g_angle02 > g_angle02_MaxRock ) { // did we go past upper limit?
   g_angle02 = g_angle02_MaxRock;       // yes. Stop at limit, and
   if(g_angle02Rate > 0) g_angle02Rate = -g_angle02Rate; // go BACKWARDS
  }
//  console.log("angle02:", g_angle02);
}

function drawAll()
//-----------------------------------------------------------------------------
 // Draw a new on-screen image.
 {
  // Be sure to clear the screen before re-drawing ...
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);




    // gl.viewport(0,                              // Viewport lower-left corner
    //           0,                              // (x,y) location(in pixels)
    //           gl.drawingBufferWidth/2,        // viewport width, height.
    //           gl.drawingBufferHeight);

    gl.viewport(0,  
              0,      
              innerWidth*97.5/100/2, 
              innerHeight*4/5);

  
  g_myMatrix.setIdentity();         // set drawing axes to CVV:

  //-----------------Set up 3D camera matrices here.
  g_myMatrix.perspective(perspective_angle,   // FOVY: top-to-bottom vertical image angle, in degrees
                           2.0,   // Image Aspect Ratio: camera lens width/height
                           // aspect_ratio,
                           z_near,   // camera z-near distance (always positive; frustum begins at z = -znear)
                        z_far);  // camera z-far distance (always positive; frustum ends at z = -zfar)


  g_myMatrix.lookAt( g_eyeX, g_eyeY, g_eyeZ,//5.0,  5.0,  3.0,      // center of projection
                        // 0,0,0,
                      g_eyeX + Math.cos(g_theta*Math.PI/180), 
                      g_eyeY + Math.sin(g_theta*Math.PI/180), 
                      g_eyeZ + z_move, //-1.0, -2.0, -0.5,      // look-at point 
                      0.0,  0.0,  1.0);     // 'up' vector
  //---------------------

  // console.log("this is x ")
  // console.log(g_eyeX)
  //   console.log("this is y ")
  // console.log(g_eyeY)
  //   console.log("this is z ")
  // console.log(g_eyeZ)


  // Now we're in WORLD coord system.
  updateModelMatrix(g_myMatrix);    // set GPU's ModelMatrix to identity, and

  //---------------------------------------------
  drawAxes();
  drawGroundGrid();


  pushMatrix(g_myMatrix);
  drawFourth();
  g_myMatrix = popMatrix(); 


  //---------------------------Draw big spinning tetra
  pushMatrix(g_myMatrix);           // SAVE current drawing axes:
      g_myMatrix.translate(-1,-2,0); // move drawing axes downwards,
      // g_myMatrix.scale(0.6,0.6,0.6);  // shrink drawing axes uniformly,
      // spinning BASE tetra;
      // g_myMatrix.rotate(g_angle01,0,1,0);      // spin the drawing axes,
      // drawAxes();
      // // drawFullWedge();
      // drawDiamond();
      drawDiamondMonster();
  g_myMatrix = popMatrix();         // RESTORE saved drawing axes.
  pushMatrix(g_myMatrix);

  g_myMatrix.translate(-1.5,0,0);
  g_myMatrix.rotate(90,0,0,1);
  drawTCM();
  g_myMatrix = popMatrix(); 



  //--------------------------Draw small half-tetra that mouse can spin  
  pushMatrix(g_myMatrix);           // SAVE current drawing axes:
  g_myMatrix.translate(0.4,0.4,0.0);  // move to upper right, and
  g_myMatrix.scale(0.5, 0.5, 0.5);    // shrink drawing axes
              
  // Mouse-Dragging for Rotation:
	//-----------------------------

	// Attempt 1:  X-axis, then Y-axis rotation:---------------------------------
  						// First, rotate around x-axis by the amount of -y-axis dragging:
  g_myMatrix.rotate(-g_yMdragTot*120.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
  						// Then rotate around y-axis by the amount of x-axis dragging
	g_myMatrix.rotate(g_xMdragTot*120.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
				// Acts SENSIBLY if I drag mouse horizontally first, then vertically. (Try ~90 deg)
				// Acts WEIRDLY if I drag mouse vertically first, then horizontally.
				// ? Why is it 'backwards'? Could this be related to 'matrix duality'?
// */		
/*
	// Attempt 2: dragged-axis rotation:----------------------------------------
							// rotate on axis perpendicular to the mouse-drag direction:
							// find the dragging distance,
	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
							// Use dragging-distance to set rotation amount, and
							// set rot. axis in x-y plane, perpendicular to drag direction:
	g_myMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
							// why add 0.0001? ensures non-zero rotation axes even if the
							// mouse-drag distance is zero). 
	// RESULT: Acts weirdly as rotation amounts get large; try 90deg horiz. drag
	      // followed by vertical drag. ? Why does our intuition fail here?
	
	// *** !AHA! ***
	//  DON'T accumulate 2D mouse-dragging to set our current 3D rotation!
	// Instead, accumulate 3D rotations caused by each mouse-drag event:
	//  --create g_mouseSpin a(global) Matrix4 object for mouse-drag rotation
	//  --in the myMouseMove() callback fcn, rotate g_mouseSpin for every 
	//    mouse-dragging event.
        
				// Then consider this carefully: 
				// how does rotate() fcn make new matrix contents?
				// Is it by Method 1?     [NEW] = [ROT][OLD];
				//                  (changes coord. numbers & keeps drawing axes fixed)
				//    or by Method 2?     [NEW] = [OLD][ROT];
				//                  (changes drawing axes & keeps coord. numbers fixed)
				//
				// ? Which matrix gets applied first? 
				// ? Which SHOULD be applied first?
				// ? How can we reverse the order using our vector/matrix library?

	      // Examine Attempt 2a closely:
	      // The 'rotate()' function takes the existing [OLD] contents of our 
	      // Matrix4  object and combines it with a new rotation matrix [ROT] 
	      // like this:    [NEW] = [OLD][ROT] 
	      // to rotate our 'drawing axes'.  As always with our  'Method 2' 
	      // geometric interpretation, this means we copied our current (and 
	      // already rotated) drawing axe to make new ones, and then rotate the 
	      // new drawing axes by measuring angles from our current drawing axes.
	      //    THAT'S NOT WHAT USERS EXPECTED!
	      // When users drag the mouse, they expect rotations measured against 
	      // the fixed CVV/Screen coordinates, not current drawing axes!
	      //  For example, any time we drag the mouse horizontally, we want to
	      // see on-screen contents 
	      // (drawn with already-rotated 'current' drawing axes)
	      //  to spin around the on-screen vertical axis.
	      // In other words, we want to apply the [ROT] matrix **BEFORE** we
	      // apply the [OLD] matrix to create the 'current' drawing axes!  
	      // Mathematically, we want:  [NEW] = [ROT][OLD].
	      // but 'rotate()' gives us:  [NEW] = [OLD][ROT].
	      //
	      //  One way to solve the problem is to use use a temporary Matrix4:
	      // (you'll need to declare it).
	      
//  g_tmpMatrix.set(g_myMatrix);  // SAVE [OLD] matrix(e.g. current drawing axes)
//                                // REPLACE g_myMatrix contents with [ROT]:
//	var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
//	g_myMatrix.setRotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
//	g_myMatrix.multiply(g_tmpMatrix); // Multiply: [NEW] = [ROT][OLD] 

//*/
	//-------------------------------
	// Attempt 4: accumulating all those rotation matrices is risky -- you're
	// also accumulating numerical errors that aren't rotations!
	// Quaternions? What will work better?

	//-------------------------------
  // g_myMatrix.translate(3,5,0);
  drawAxes();                       // draw our small, mouse-spun wedge & axes.

  // g_myMatrix.translate(3,5,0);
  drawRecMon();
       
  g_mMatrix = popMatrix();          // RESTORE saved drawing axes.


  // 2nd viewport
  ///////////////////
  ///////////////////
  ///////////////////
  //////////////////


    // gl.viewport(gl.drawingBufferWidth/2,                              // Viewport lower-left corner
    //           0,                              // (x,y) location(in pixels)
    //           gl.drawingBufferWidth/2,        // viewport width, height.
    //           gl.drawingBufferHeight);

    gl.viewport(innerWidth*97.5/100/2,  
              0,  
              innerWidth*97.5/100/2,    
              innerHeight*4/5);

  
  g_myMatrix.setIdentity();         // set drawing axes to CVV:

  //-----------------Set up 3D camera matrices here.




  var a = (z_far-z_near)/3 *Math.tan((perspective_angle/2)*Math.PI/180);



  // g_myMatrix.ortho(-a+g_eyeX,   // FOVY: top-to-bottom vertical image angle, in degrees
  //                          a+g_eyeX,   // Image Aspect Ratio: camera lens width/height
  //                          -a+g_eyeY,
  //                          a+g_eyeY,   // camera z-near distance (always positive; frustum begins at z = -znear)
  //                       1+g_eyeZ,100+g_eyeZ);  // camera z-far distance (always positive; frustum ends at z = -zfar)
    g_myMatrix.ortho(-a,//+g_eyeX,   // FOVY: top-to-bottom vertical image angle, in degrees
                      a,//+g_eyeX,   // Image Aspect Ratio: camera lens width/height
                     -a,//+g_eyeY,
                      a,//+g_eyeY,   // camera z-near distance (always positive; frustum begins at z = -znear)
                    z_near,// +g_eyeZ, 
                   z_far // +g_eyeZ    camera z-far distance (always positive; frustum ends at z = -zfar)
                  );



// console.log("this is G_theta")
// console.log(g_theta);
  g_myMatrix.lookAt( g_eyeX, g_eyeY, g_eyeZ,//5.0,  5.0,  3.0,      // center of projection
                       //0,0,0,
                      g_eyeX + Math.cos(g_theta*Math.PI/180), 
                      g_eyeY + Math.sin(g_theta*Math.PI/180), 
                      g_eyeZ + z_move, //-1.0, -2.0, -0.5,      // look-at point 
                      0.0,  0.0,  1.0);     // 'up' vector
  //---------------------
  // Now we're in WORLD coord system.
  updateModelMatrix(g_myMatrix);    // set GPU's ModelMatrix to identity, and

  //---------------------------------------------
  drawAxes();
  drawGroundGrid();


  pushMatrix(g_myMatrix);
  drawFourth();
  g_myMatrix = popMatrix(); 

  //---------------------------Draw big spinning tetra
  pushMatrix(g_myMatrix);           // SAVE current drawing axes:
      g_myMatrix.translate(-1,-2,0); // move drawing axes downwards,
      // g_myMatrix.scale(0.6,0.6,0.6);  // shrink drawing axes uniformly,
      // // spinning BASE tetra;
      // g_myMatrix.rotate(g_angle01,0,1,0);      // spin the drawing axes,
      // drawAxes();
      // // drawFullWedge();
      // drawDiamond();
      drawDiamondMonster();
  g_myMatrix = popMatrix();         // RESTORE saved drawing axes.
  pushMatrix(g_myMatrix);

  g_myMatrix.translate(-1.5,0,0);
  g_myMatrix.rotate(90,0,0,1);
  drawTCM();


  g_myMatrix = popMatrix(); 
  //--------------------------Draw small half-tetra that mouse can spin  
  pushMatrix(g_myMatrix);           // SAVE current drawing axes:
  g_myMatrix.translate(0.4,0.4,0.0);  // move to upper right, and
  g_myMatrix.scale(0.5, 0.5, 0.5);    // shrink drawing axes
              
  // Mouse-Dragging for Rotation:
  //-----------------------------

  // Attempt 1:  X-axis, then Y-axis rotation:---------------------------------
              // First, rotate around x-axis by the amount of -y-axis dragging:
  g_myMatrix.rotate(-g_yMdragTot*120.0, 1, 0, 0); // drag +/-1 to spin -/+120 deg.
              // Then rotate around y-axis by the amount of x-axis dragging
  g_myMatrix.rotate( g_xMdragTot*120.0, 0, 1, 0); // drag +/-1 to spin +/-120 deg.
        // Acts SENSIBLY if I drag mouse horizontally first, then vertically. (Try ~90 deg)
        // Acts WEIRDLY if I drag mouse vertically first, then horizontally.
        // ? Why is it 'backwards'? Could this be related to 'matrix duality'?
// */   
/*
  // Attempt 2: dragged-axis rotation:----------------------------------------
              // rotate on axis perpendicular to the mouse-drag direction:
              // find the dragging distance,
  var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
              // Use dragging-distance to set rotation amount, and
              // set rot. axis in x-y plane, perpendicular to drag direction:
  g_myMatrix.rotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
              // why add 0.0001? ensures non-zero rotation axes even if the
              // mouse-drag distance is zero). 
  // RESULT: Acts weirdly as rotation amounts get large; try 90deg horiz. drag
        // followed by vertical drag. ? Why does our intuition fail here?
  
  // *** !AHA! ***
  //  DON'T accumulate 2D mouse-dragging to set our current 3D rotation!
  // Instead, accumulate 3D rotations caused by each mouse-drag event:
  //  --create g_mouseSpin a(global) Matrix4 object for mouse-drag rotation
  //  --in the myMouseMove() callback fcn, rotate g_mouseSpin for every 
  //    mouse-dragging event.
        
        // Then consider this carefully: 
        // how does rotate() fcn make new matrix contents?
        // Is it by Method 1?     [NEW] = [ROT][OLD];
        //                  (changes coord. numbers & keeps drawing axes fixed)
        //    or by Method 2?     [NEW] = [OLD][ROT];
        //                  (changes drawing axes & keeps coord. numbers fixed)
        //
        // ? Which matrix gets applied first? 
        // ? Which SHOULD be applied first?
        // ? How can we reverse the order using our vector/matrix library?

        // Examine Attempt 2a closely:
        // The 'rotate()' function takes the existing [OLD] contents of our 
        // Matrix4  object and combines it with a new rotation matrix [ROT] 
        // like this:    [NEW] = [OLD][ROT] 
        // to rotate our 'drawing axes'.  As always with our  'Method 2' 
        // geometric interpretation, this means we copied our current (and 
        // already rotated) drawing axe to make new ones, and then rotate the 
        // new drawing axes by measuring angles from our current drawing axes.
        //    THAT'S NOT WHAT USERS EXPECTED!
        // When users drag the mouse, they expect rotations measured against 
        // the fixed CVV/Screen coordinates, not current drawing axes!
        //  For example, any time we drag the mouse horizontally, we want to
        // see on-screen contents 
        // (drawn with already-rotated 'current' drawing axes)
        //  to spin around the on-screen vertical axis.
        // In other words, we want to apply the [ROT] matrix **BEFORE** we
        // apply the [OLD] matrix to create the 'current' drawing axes!  
        // Mathematically, we want:  [NEW] = [ROT][OLD].
        // but 'rotate()' gives us:  [NEW] = [OLD][ROT].
        //
        //  One way to solve the problem is to use use a temporary Matrix4:
        // (you'll need to declare it).
        
//  g_tmpMatrix.set(g_myMatrix);  // SAVE [OLD] matrix(e.g. current drawing axes)
//                                // REPLACE g_myMatrix contents with [ROT]:
//  var dist = Math.sqrt(g_xMdragTot*g_xMdragTot + g_yMdragTot*g_yMdragTot);
//  g_myMatrix.setRotate(dist*120.0, -g_yMdragTot+0.0001, g_xMdragTot+0.0001, 0.0);
//  g_myMatrix.multiply(g_tmpMatrix); // Multiply: [NEW] = [ROT][OLD] 

//*/
  //-------------------------------
  // Attempt 4: accumulating all those rotation matrices is risky -- you're
  // also accumulating numerical errors that aren't rotations!
  // Quaternions? What will work better?

  //-------------------------------
  drawAxes();                       // draw our small, mouse-spun wedge & axes.
  g_myMatrix.translate(1,2,0);
  drawRecMon();  
  g_mMatrix = popMatrix();          // RESTORE saved drawing axes.
  





  /////////////////




  
    // Report mouse-drag totals on-screen for every animation frame.
		document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + g_xMdragTot.toFixed(g_digits)+
			                             ', \t' + g_yMdragTot.toFixed(g_digits);	

}

function append_Wedge() {
//------------------------------------------------------------------------------
// Create & store a 2-triangle wedge-like 3D part.
// (from old 5.04.ControlMulti starter code).
	var c30 = Math.sqrt(0.75);					// == cos(30deg) == sqrt(3) / 2
	var sq2	= Math.sqrt(2.0);						

/*
  // Coordinates(x,y,z,w) and colors (R,G,B,A) for a tetrahedron:
	// Apex on +z axis; equilateral triangle base at z=0 centered at origin.
	Nodes:
		 0.0,	 0.0, sq2, 1.0,		// n0 (apex, +z axis;  white)
     c30, -0.5, 0.0, 1.0, 	// n1 (base: lower rt; blue)
     0.0,  1.0, 0.0, 1.0,  	// n2 (base: +y axis;  red)
    -c30, -0.5, 0.0, 1.0, 	// n3 (base:lower lft; grn)
			// Face 0: (right side);  Node 0,1,2
			// Face 1: (left side);   Node 0,2,3
    	// Face 2: (lower side);  Node 0,3,1    // Use these last 2 faces...
		  // Face 3: (base side);   Node 3,2,1.  
*/
  appendPositions([  0.0,  0.0, sq2, 1.0,  // node 0     // triangle-strip.  
                    -c30, -0.5, 0.0, 1.0,  // node 3     // Draw 1st 4 verts only.
                     c30, -0.5, 0.0, 1.0,  // node 1
                     0.0,  1.0, 0.0, 1.0,  // node 2
                     0.0,	 0.0, sq2, 1.0,  // node 0
                    -c30, -0.5, 0.0, 1.0,  // node 3
  ]);
  appendColors([  1.0, 1.0, 1.0, 1.0, // n0 white
                  0.0, 1.0, 0.0, 1.0, // n3 green
                  0.0, 0.0, 1.0, 1.0, // n1 blue
                  1.0, 0.0, 0.0, 1.0, // n2 red
                  1.0, 1.0, 1.0, 1.0, //n0 white
                  0.0, 1.0, 0.0, 1.0, // n3 green
              ]);

}

function drawHalfWedge() {
//------------------------------------------------------------------------------
// Draw only the first 2 triangles of tetrahedron 
// base is in z=0 plane centered at origin: apex on z axis.

  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    updateModelMatrix(g_myMatrix);        // send it to GPU
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); // DRAW 2 triangles.
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function drawFullWedge() {
//-----------------------------------------------------------------------------
// Draw all 4 triangles of our tetrahedron
// base is in z=0 plane centered at origin; apex on z axis.
  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    updateModelMatrix(g_myMatrix);        // send it to GPU
    gl.drawArrays(gl.TRIANGLE_STRIP,0,6); // DRAW 4 triangles.
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents.
}

function append_Axes() {
//-----------------------------------------------------------------------------
// Create & store 'Axes' 3D part that uses gl.LINES primitives to draw 
// the +x,+y,+z axes as unit-length red,green,blue lines outwards from origin,
// using the CURRENT DRAWING AXES (as defined my ModelMatrix on GPU).
  appendPositions([0.0, 0.0, 0.0, 1.0,      // x axis
                   1.0, 0.0, 0.0, 1.0,
                   0.0, 0.0, 0.0, 1.0,      // y axis
                   0.0, 1.0, 0.0, 1.0,
                   0.0, 0.0, 0.0, 1.0,      // z axis
                   0.0, 0.0, 1.0, 1.0, ]);
  appendColors([1.0, 0.2, 0.2, 1.0,   // bright red
                1.0, 0.2, 0.2, 1.0,
                0.2, 1.0, 0.2, 1.0,   // bright green
                0.2, 1.0, 0.2, 1.0,
                0.2, 0.2, 1.0, 1.0,   // bright blue.
                0.2, 0.2, 1.0, 1.0,]);
}

function drawAxes() {
//-----------------------------------------------------------------------------
// using current drawing axes
  pushMatrix(g_myMatrix);
  g_myMatrix.scale(5,5,5);
  updateModelMatrix(g_myMatrix);
  
  gl.drawArrays(gl.LINES,6,6);   // 2nd set of 6 verts in GPU.

  g_myMatrix = popMatrix();
}


function drawDiamond() {
//------------------------------------------------------------------------------
// Draw a tetrahedron by transforming & drawing two half-tetra parts already
// stored in the GPU.  Draw the tetrahedron in the drawing axes specified by
// the 'myMatrix' argument (a Matrix4 object).

  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    //------------LEFT 3D part------
    // Using the GIVEN drawing axes, do more transformations & drawing:
    // CAREFUL! DON'T USE 'setTranslate()!!!'
    // g_myMatrix.translate(-0.3, 0.0, 0.0); // translate drawing axes,
    // g_myMatrix.scale(.5,.5,.5);
    // g_myMatrix.rotate( 45.0, 0,0,1);      // rotate to mesh with other half
    updateModelMatrix(g_myMatrix);        // copy myMatrix to ModelMatrix in GPU
    // draw the vertices we sent to the GPU using current ModelMatrix values:
    gl.drawArrays(gl.TRIANGLES,412,18);
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents, then:


}

function drawDiamondMonster(){

  pushMatrix(g_myMatrix);
  g_myMatrix.translate(-6,3,0);
  g_myMatrix.scale(3,3,3);
  g_myMatrix.rotate(90,1,0,0);
  // g_myMatrix.translate(3,-1.5,-1);

  // g_myMatrix.rotate(-45,1,0,0);

  // g_myMatrix.translate(x_key,y_key,0);
  g_myMatrix.rotate( g_angle01, 0,1,0);      // and rotate to 'cup' inwards
  g_myMatrix.scale(.5,.5,.5);

  pushMatrix(g_myMatrix);
  g_myMatrix.rotate(60, 0,1,0); 
  drawAxes();
  g_myMatrix = popMatrix();


  drawDiamond();



  pushMatrix(g_myMatrix);
  g_myMatrix.translate(0,0,0.75);
  g_myMatrix.rotate(g_angle02,0,0,1);
  g_myMatrix.translate(0,0,0.25);
  g_myMatrix.rotate(180,0,1,0);
  drawDiamond();
  g_myMatrix = popMatrix();

  pushMatrix(g_myMatrix);
  g_myMatrix.rotate(120,0,-1,0);
  g_myMatrix.translate(0,0,1.6);
  g_myMatrix.rotate(90,1,0,0);
  g_myMatrix.rotate(-12,0,0,1);
  g_myMatrix.rotate(-g_angle02,0,1,0);
  g_myMatrix.rotate(180,0,1,0);
  drawDiamond();
  g_myMatrix = popMatrix();
  pushMatrix(g_myMatrix);
  g_myMatrix.translate(0,-2,0);
  g_myMatrix.rotate(100+g_angle01,0,1,0);
  drawDiamond();


  g_myMatrix = popMatrix();
  g_myMatrix = popMatrix();

}

function drawTrigonalCylinder(){

  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    //------------LEFT 3D part------
    // Using the GIVEN drawing axes, do more transformations & drawing:
    // CAREFUL! DON'T USE 'setTranslate()!!!'
    // g_myMatrix.translate(-0.3, 0.0, 0.0); // translate drawing axes,
    g_myMatrix.scale(.5,.5,.5);
    g_myMatrix.rotate(30,1,0,0);
    // g_myMatrix.rotate( 45.0, 0,0,1);      // rotate to mesh with other half
    updateModelMatrix(g_myMatrix);        // copy myMatrix to ModelMatrix in GPU
    // draw the vertices we sent to the GPU using current ModelMatrix values:
    gl.drawArrays(gl.TRIANGLES,430,24);
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents, then:

}

function drawTCM(){

  pushMatrix(g_myMatrix);

   g_myMatrix.translate(-10,12,0);
  // g_myMatrix.translate(g_xMdragTot,g_yMdragTot,0);
  g_myMatrix.scale(4,4,4);

  for (i=0; i < 10;i++){
    if (i%2 == 0){
      g_myMatrix.rotate(g_angle02-60,1,0,0);  
    }{
      g_myMatrix.rotate((g_angle02)-80,1,0,0);  
    }
    g_myMatrix.translate(.1,0,0);
    drawTrigonalCylinder();

  }

  g_myMatrix = popMatrix();
}





function append_GroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	xcount = 100;			// # of lines to draw in x,y to make the grid.
	ycount = 100;		
	var xymax	= 50.0;			// grid size; extends to cover +/-xymax in x and y.
 	var floatsPerVertex = 4;  // x,y,z,w or r,g,b,z
	// Create arrays to hold this ground-plane's vertices:
	// 4 floating-point values per vertex (x,y,z,w) * 2 vertices per line *
	// (# of horiz. lines (xcount) + # of vert. lines (ycount).
	gndVerts = new Float32Array(4*2*(xcount+ycount));   // x,y,z,w 
	gndColors = new Float32Array(4*2*(xcount+ycount));  // r,g,b,a
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(line number/2))
	// line colors:
 	var xColr = new Float32Array([1.0, 1.0, 0.3]);	// bright yellow
 	var yColr = new Float32Array([0.5, 1.0, 0.5]);	// bright green.
 	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndColors[j  ] = xColr[0];
		gndColors[j+1] = xColr[1];
		gndColors[j+2] = xColr[2];
		gndColors[j+3] = 1.0;
	}
	// Second, step thru y values as we make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
			gndVerts[j+3] = 1.0;									// w.
		}
		gndColors[j  ] = yColr[0];
		gndColors[j+1] = yColr[1];
		gndColors[j+2] = yColr[2];
		gndColors[j+3] = 1.0;
	}
	appendPositions(gndVerts);     // SEND to GPU (via lib1.js functions)
	appendColors(gndColors);
}

function drawGroundGrid() {
//==============================================================================
// using current drawing axes.
// using current drawing axes
//  updateModelMatrix(g_myMatrix);
  gl.drawArrays(gl.LINES, 12, 2*200); // 2 verts/line; 200 lines 
  
}

function append_halfTetra() {
//------------------------------------------------------------------------------
// Create & store the 'half-tetra' 3D part in the GPU:
// Start with 4 vertices that make a triangle-strip of 2 equilateral triangles
// that share an edge along the x axis, with their lower and upper vertices
// (originally at x,y,z == 0,+/-0.8, 0) 'folded' inwards in the +z direction
// by 'ANGL' degrees to form a half-tetrahedron.

console.log("append_halfTetra()");

var ANGL = 90.0 - 35.264; //how far to fold each triangle inwwards in +z

// Intial positions for v0 and v3:
var V0 = new Vector4([0.0,-0.8, 0.0, 1.0]);
var V3 = new Vector4([0.0, 0.8, 0.0, 1.0]);
//  V0.printMe("V0:");
//  V3.printMe("V3:");

// We want to 'rotate' these vertices on x axis; do it with 'foldM' matrix
var foldM = new Matrix4();  // create.
  foldM.setRotate(-ANGL,1,0,0);   // Spin V0 +x-axis by -35.264 degrees,
//  foldM.printMe("Rot matrix");  // show in console. (be sure it's valid).
  V0 = foldM.multiplyVector4(V0); // Matrix multiply; V0 = [foldM]*V0
        // (over-writes old V0).
//  V0.printMe("Folded V0:"); // show in console.
// We want to rotate v3 in OPPOSITE direction, so
  foldM.setRotate( ANGL,1,0,0); // setRotate() DISCARDS current contents &
                                // makes all-new matrix contents:
                                // rotate around +x-axis by +35.264 degrees,
V3 = foldM.multiplyVector4(V3); // Matrix multiply: V3 = [foldM]*V3;
//V3.printMe("Folded V3:"); // show in console. 
// Now use V0 and V3 in the 'appendPositions()' function below and

  var hEdge = 0.4/Math.sin(Math.PI/3);   // find equilateral edge half-length
//  console.log("width +/-hEdge:", hEdge);

  // Send vertices to the GPU---------------------------------------------------
  appendPositions([V0.elements[0],
                   V0.elements[1],
                   V0.elements[2], 
                   1.0, // vertex 0 (x,y,z,w)
                    hEdge, 0.0, 0.0, 1.0, // vertex 1
                   -hEdge, 0.0, 0.0, 1.0, // vertex 2
                   V3.elements[0],
                   V3.elements[1],
                   V3.elements[2],
                   1.0, // vertex 3
                  ]);
  appendColors([1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
                1.0, 1.0, 1.0, 1.0,     // Vertex 3 (white!)
              ]); 
}

function append_diamond03() {
//------------------------------------------------------------------------------
// Create & store the 3d diamonds aligned at the origin to create trigonal bypyramid
// draw this shape using gl.TRIANGLES


console.log("append_diamond03");


  // Send vertices to the GPU---------------------------------------------------
  // node positions 
  // n0: 0.0,-1.0, 0.0, 1.0,
  // n1:-0.5, 0.0,-0.5, 1.0,
  // n2: 0.0, 0.0, 0.5, 1.0,
  // n3: 0.5, 0.0,-0.5, 1.0,
  // n4: 0.0, 1.0, 0.0, 1.0,

  appendPositions([ 
                     //n0,n3,n2
                    0.0,-1.0, 0.0, 1.0,        
                    0.5, 0.0,-0.5, 1.0,       
                    0.0, 0.0, 0.5, 1.0,         
                            //n0,n2,n1
                    0.0,-1.0, 0.0, 1.0, 
                    0.0, 0.0, 0.5, 1.0,
                   -0.5, 0.0,-0.5, 1.0,
                            //n0,n1,n3
                    0.0,-1.0, 0.0, 1.0,                 
                   -0.5, 0.0,-0.5, 1.0,
                    0.5, 0.0,-0.5, 1.0,

                                      //n3,n4,n2
                    0.5, 0.0,-0.5, 1.0,
                    0.0, 1.0, 0.0, 1.0,
                    0.0, 0.0, 0.5, 1.0,
                                      //n2,n4,n1
                    0.0, 0.0, 0.5, 1.0,
                    0.0, 1.0, 0.0, 1.0,
                   -0.5, 0.0,-0.5, 1.0,
                                      //n1,n4,n3
                   -0.5, 0.0,-0.5, 1.0,
                    0.0, 1.0, 0.0, 1.0,
                    0.5, 0.0,-0.5, 1.0,




                  ]);
  appendColors([1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
                // 1.0, 1.0, 1.0, 1.0,     // Vertex 3 (white!)
                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
              ]); 
}


function append_trigonal_cylinder(){
//------------------------------------------------------------------------------
// Create & store the 3d triangles to create trigonal cylinder draw this shape using 
// gl.TRIANGLES

// Send vertices to the GPU---------------------------------------------------
// node positions 
// n0: 0.0,-0.5, 0.3, 1.0,
// n1:0.23,-0.5, 0.23, 1.0,
// n2: 0.0,-0.5, 0.0, 1.0,
// n3: 0.0, 0.5, 0.3, 1.0,
// n4: 0.23, 0.5, 0.23, 1.0,
// n5: 0.0, 0.5, 0.0, 1.0,
  
  appendPositions([
    // n0,n2,n3
    0.0,-0.5, 0.3, 1.0,
    0.0,-0.5, 0.0, 1.0,
    0.0, 0.5, 0.3, 1.0,
    // n3,n2,n5
    0.0, 0.5, 0.3, 1.0,
    0.0,-0.5, 0.0, 1.0,
    0.0, 0.5, 0.0, 1.0,
    // n5,n2,n4
    0.0, 0.5, 0.0, 1.0,
    0.0,-0.5, 0.0, 1.0,
    0.23, 0.5, 0.23, 1.0,
    // n4,n2,n1
    0.23, 0.5, 0.23, 1.0,
    0.0,-0.5, 0.0, 1.0,
    0.23,-0.5, 0.23, 1.0,
    // n1,n0,n2
    0.23,-0.5, 0.23, 1.0,
    0.0,-0.5, 0.3, 1.0,
    0.0,-0.5, 0.0, 1.0,
    // n3,n4,n5
    0.0, 0.5, 0.3, 1.0,
    0.23, 0.5, 0.23, 1.0,
    0.0, 0.5, 0.0, 1.0,
    // n1,n4,n3
    0.23,-0.5, 0.23, 1.0,
    0.23, 0.5, 0.23, 1.0,
    0.0, 0.5, 0.3, 1.0,
    // n3,n1,n0
    0.0, 0.5, 0.3, 1.0,
    0.23,-0.5, 0.23, 1.0,
    0.0,-0.5, 0.3, 1.0,
    ]);


    appendColors([1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
                // 1.0, 1.0, 1.0, 1.0,     // Vertex 3 (white!)
                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                0.0, 1.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                0.0, 0.0, 1.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
              ]); 



}

function append_rectangle(){
  console.log("append_rectangle");
  // Send vertices to the GPU---------------------------------------------------
  // node positions 
  // n0: 0.0, 0.0, 0.0, 1.0,
  // n1: 0.0, 0.0, 0.2, 1.0,
  // n2: 0.2, 0.0, 0.2, 1.0,
  // n3: 0.2, 0.0, 0.0, 1.0,
  // n4: 0.2, 0.6, 0.0, 1.0,
  // n5: 0.2, 0.6, 0.2, 1.0,
  // n6: 0.0, 0.6, 0.2, 1.0,
  // n7: 0.0, 0.6, 0.0, 1.0,
  appendPositions([   0.0, 0.0, 0.0, 1.0, //n0
                      0.0, 0.0, 0.2, 1.0, //n1
                      0.2, 0.0, 0.2, 1.0, //n2

                      0.2, 0.0, 0.2, 1.0, //n2
                      0.0, 0.0, 0.0, 1.0, //n0
                      0.2, 0.0, 0.0, 1.0, //n3

                      0.2, 0.0, 0.0, 1.0, //n3
                      0.2, 0.6, 0.0, 1.0, //n4
                      0.2, 0.6, 0.2, 1.0, //n5

                      0.2, 0.0, 0.0, 1.0, //n3
                      0.2, 0.6, 0.2, 1.0, //n5
                      0.2, 0.0, 0.2, 1.0, //n2

                      0.2, 0.0, 0.2, 1.0, //n2
                      0.0, 0.0, 0.2, 1.0, //n1
                      0.2, 0.6, 0.2, 1.0, //n5

                      0.2, 0.6, 0.2, 1.0, //n5
                      0.0, 0.0, 0.2, 1.0, //n1
                      0.0, 0.6, 0.2, 1.0, //n6

                      0.0, 0.6, 0.2, 1.0, //n6
                      0.0, 0.0, 0.2, 1.0, //n1
                      0.0, 0.0, 0.0, 1.0, //n0

                      0.0, 0.0, 0.0, 1.0, //n0
                      0.0, 0.6, 0.2, 1.0, //n6
                      0.0, 0.6, 0.0, 1.0, //n7

                      0.0, 0.6, 0.0, 1.0, //n7
                      0.0, 0.0, 0.0, 1.0, //n0
                      0.2, 0.0, 0.0, 1.0, //n3

                      0.2, 0.0, 0.0, 1.0, //n3
                      0.0, 0.6, 0.0, 1.0, //n7
                      0.2, 0.6, 0.0, 1.0, //n4

                      0.2, 0.6, 0.0, 1.0, //n4
                      0.2, 0.6, 0.2, 1.0, //n5
                      0.0, 0.6, 0.0, 1.0, //n7

                      0.0, 0.6, 0.0, 1.0, //n7
                      0.0, 0.6, 0.2, 1.0, //n6
                      0.2, 0.6, 0.2, 1.0, //n5
    ]); 

  appendColors([1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
                // 1.0, 1.0, 1.0, 1.0,     // Vertex 3 (white!)
                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 

                1.0, 0.0, 0.0, 1.0,     // Vertex 0 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 1.0, 0.0, 1.0,     // Vertex 1 color 0.0 <= (R,G,B,A) < 1.0 
                0.0, 0.0, 1.0, 1.0,     // Vertex 2 color 0.0 <= (R,G,B,A) < 1.0 
              ]); 


}

function drawRec() {
//------------------------------------------------------------------------------
// Draw a cube in the drawing axes specified by
// the 'myMatrix' argument (a Matrix4 object).

  pushMatrix(g_myMatrix);  // SAVE the given myMatrix contents, then:
    //------------LEFT 3D part------
    // Using the GIVEN drawing axes, do more transformations & drawing:
    // CAREFUL! DON'T USE 'setTranslate()!!!'
    // g_myMatrix.translate(-0.3, 0.0, 0.0); // translate drawing axes,
    g_myMatrix.scale(3,9,3);
    // g_myMatrix.rotate( 45.0, 0,0,1);      // rotate to mesh with other half
    updateModelMatrix(g_myMatrix);        // copy myMatrix to ModelMatrix in GPU
    // draw the vertices we sent to the GPU using current ModelMatrix values:
    gl.drawArrays(gl.TRIANGLES,454,36);
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents, then:


}

function drawRecMon(){
  pushMatrix(g_myMatrix);
  g_myMatrix.scale(3,3,3)
  g_myMatrix.rotate(90,1,0,0);
  g_myMatrix.rotate(-90,0,1,0);
  drawRec();
  pushMatrix(g_myMatrix);
  g_myMatrix.translate(2.6,4.9,.4);
  g_myMatrix.rotate(90,0,0,1);
  g_myMatrix.scale(2,2,2);
  drawDiamond();
  g_myMatrix = popMatrix();
  pushMatrix(g_myMatrix);
  g_myMatrix.translate(-2,4.9,.4);
  g_myMatrix.rotate(90,0,0,1);
  g_myMatrix.scale(2,2,2);
  drawDiamond();
  g_myMatrix = popMatrix();

  g_myMatrix = popMatrix();

}

function drawFourth(){
  pushMatrix(g_myMatrix);
  g_myMatrix.translate(0,4,0);

  g_myMatrix.scale(1,2,1);
  g_myMatrix.rotate(90,1,0,0);
  g_myMatrix.translate(-4,0,4);
  drawRec();
  pushMatrix(g_myMatrix);
  g_myMatrix.rotate(30,1,0,0);
  g_myMatrix.translate(0,.3,.4);
  g_myMatrix.rotate(g_angle02+15,1,0,0);
  drawRec();
  g_myMatrix.translate(0,4.5,0);
  g_myMatrix.rotate(90,1,0,0);
  g_myMatrix.translate(.5,-1,0);
  drawDiamond();
  g_myMatrix = popMatrix();

  g_myMatrix = popMatrix();


}


function drawResize() {
//==============================================================================
  var nuCanvas = document.getElementById('webgl'); 
  var nuGL = getWebGLContext(nuCanvas);         

 console.log('nuCanvas width,height=', nuCanvas.width, nuCanvas.height);   
 console.log('Browser window: innerWidth,innerHeight=', 
                                innerWidth, innerHeight);

  // nuCanvas.width = innerWidth*97.5/100;
  // nuCanvas.height = innerHeight*4/5;

  nuCanvas.width = gl.drawingBufferWidth*97.5/100;
  nuCanvas.height = gl.drawingBufferHeight*4/5;
  drawAll(nuGL);
}


//=================================
//================================
//
//    KEYBOARD & MOUSE FUNCTIONS
//
//================================
//=================================

function myKeyDown(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard;
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
// NOTE: Mozilla deprecated the 'keypress' event entirely, and in the
//        'keydown' event deprecated several read-only properties I used
//        previously, including kev.charCode, kev.keyCode. 
//        Revised 2/2019:  use kev.key and kev.code instead.
//
	document.getElementById('KeyDownResult').innerHTML = ''; // clear old result
  document.getElementById('KeyModResult' ).innerHTML = ''; 
  console.log(  "--kev.code:",    kev.code,   "\t\t--kev.key:",     kev.key, 
              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
  document.getElementById('KeyModResult' ).innerHTML = 
        "   --kev.code:"+kev.code   +"      --kev.key:"+kev.key+
    "<br>--kev.ctrlKey:"+kev.ctrlKey+" --kev.shiftKey:"+kev.shiftKey+
    "<br> --kev.altKey:"+kev.altKey +"  --kev.metaKey:"+kev.metaKey;
  
              //"--kev.code:"+kev.code+"--kev.key:"+kev.key; 
/*              "\n--kev.ctrlKey:", kev.ctrlKey,  "\t--kev.shiftKey:",kev.shiftKey,
              "\n--kev.altKey:",  kev.altKey,   "\t--kev.metaKey:", kev.metaKey);
*/
  switch(kev.code) {
		case "KeyP":
			console.log("Pause/unPause!\n");                // print on console,
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found p/P key. Pause/unPause!';   // print on webpage
			if(g_isRun==true) {
			  g_isRun = false;    // STOP animation
			  }
			else {
			  g_isRun = true;     // RESTART animation
			  tick();
			  }
			break;
		//------------------WASD navigation-----------------
		case "KeyA":
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found a/A key. Strafe LEFT!';
      g_eyeX += .4*Math.cos((90+g_theta)*Math.PI/180);
      g_eyeY += .4*Math.sin((90+g_theta)*Math.PI/180);

			break;
    case "KeyD":
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found d/D key. Strafe RIGHT!';
      g_eyeX -= .4*Math.cos((90+g_theta)*Math.PI/180);
      g_eyeY -= .4*Math.sin((90+g_theta)*Math.PI/180);
			break;
		case "KeyS":
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyDownResult').innerHTML = 
			'myKeyDown() found s/Sa key. Move BACK.';
      g_eyeX -= .4*Math.cos(g_theta*Math.PI/180)
      g_eyeY -= .4*Math.sin(g_theta*Math.PI/180)
      g_eyeZ -= .4*Math.atan(z_move)
			break;
		case "KeyW":
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyDownResult').innerHTML =  
			'myKeyDown() found w/W key. Move FWD!';
      g_eyeX += .4*Math.cos(g_theta*Math.PI/180)
      g_eyeY += .4*Math.sin(g_theta*Math.PI/180)
      g_eyeZ += .4*Math.atan(z_move)
			break;
		//----------------Arrow keys------------------------
		case "ArrowLeft": 	
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow='+kev.keyCode;
        g_theta += 2.0; // turn left.
console.log("g_theta:",g_theta)
			break;
		case "ArrowRight":
			console.log('right-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
        g_theta -= 2.0; // turn right,
console.log("g_theta:",g_theta)
  		break;
		case "ArrowUp":		
			console.log('   up-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
        z_move += .02;
			break;
		case "ArrowDown":
			console.log(' down-arrow.');
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
        z_move -=.02;
  		break;	
    default:
      console.log("UNUSED!");
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): UNUSED!';
      break;
  }
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard.
// Rarely needed -- most code needs only myKeyDown().

	console.log("myKeyUp():\n--kev.code:",kev.code,"\t\t--kev.key:", kev.key);
}

function myMouseDown(ev) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
  var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));
	
	g_isDrag = true;										// set our mouse-dragging flag
	g_xMclik = x;												// record where mouse-dragging began
	g_yMclik = y;                       // using global vars (above main())
		document.getElementById('MouseAtResult').innerHTML = 
	'myMouseDown() at CVV coords x,y = '+x.toFixed(g_digits)+
	                                ', '+y.toFixed(g_digits);
};


function myMouseMove(ev) {
//==============================================================================
// Called whpriceen user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;			// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));

	// find how far we dragged the mouse:
	g_xMdragTot += (x - g_xMclik);      // Accumulate change-in-mouse-position,&
	g_yMdragTot += (y - g_yMclik);
	g_xMclik = x;									      // Make next drag-measurement from here.
	g_yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'tick()' function instead)
};

function myMouseUp(ev) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp.toFixed(g_digits),',\t',yp.toFixed(g_digits));
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x.toFixed(g_digits),',\t',y.toFixed(g_digits));
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',g_xMdragTot.toFixed(g_digits),',\t', g_yMdragTot.toFixed(g_digits));
	// Put it on our webpage too...
	document.getElementById('MouseAtResult').innerHTML = 
	'myMouseUp(       ) at CVV coords x,y = ' +x.toFixed(g_digits)+
	                                      ', '+y.toFixed(g_digits);
};

function myMouseClick(ev) {
//=============================================================================
// Called when user completes a mouse-button single-click event 
// (e.g. mouse-button pressed down, then released)
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouseClick() on button: ", ev.button); 
}	

function myMouseDblClick(ev) {
//=============================================================================
// Called when user completes a mouse-button double-click event 
// 									   
//    WHICH button? try:  console.log('ev.button='+ev.button); 
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!) 
//    See myMouseUp(), myMouseDown() for conversions to  CVV coordinates.

  // STUB
	console.log("myMouse-DOUBLE-Click() on button: ", ev.button); 
}	


function buttonClearDragTot() {
//=============================================================================
// on-screen button: clears global mouse-drag totals.
  g_xMdragTot = 0.0;
  g_yMdragTot = 0.0;
}