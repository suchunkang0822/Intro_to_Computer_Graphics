
/*    
   tetraGUI_10.js   Jack Tumblin, jet861, 1/24/2019.
  
  Adding GUI features to interact with a half-tetrahedron.
  
    Version control:
  TetraGUI_01 -- 'cleaned up' copy of last week's 'diamond2Tetra06' code 
    (in the folder: 2019.01.18.FirstMath-SOLN ).
    
  TetraGUI_02 -- organize tasks into separate functions:
    --append_halfTetra():  CREATE a 3D part -- makes 4 vertices that form our
       'folded diamond' shape, and stores them in the GPU.
    --drawTetra(): DRAW tetrahedron by drawing our'halfTetra' 3D part twice,
      but using different ModelMatrix values in the GPU for each drawing.
      
  TetraGUI_03 -- revise 'drawTetra()' to use drawing axes supplied by myMatrix,
      HOW? don't use any 'set' functions (setTranslate(), setRotate(), etc.)
          because they DISCARD current matrix contents.
          INSTEAD: preserve contents using a push-down stack to hold Matrix4 
          objects:'pushMatrix()' and 'popMatrix()' (from cuon-matrix-quat03.js).
          Now we can drawTetra() anywhere on-screen.
          
  TetraGUI_04 -- make global variables explicit; and add basic animation fcns:
      animate(): make all changes needed for the next on-screen image:
      drawAll(): draw the complete on-screen image.
      tick(): repeatedly re-draw screen (defined inside the end of main())
              as soon as web-browser can allow it.
  
  TetraGUI_05 -- rotate the left tetrahedron; move all drawing from main() to
      drawAll(); why the white background? need gl.clear(gl.COLOR_BUFFER_BIT);
      to clear the screen before we draw a new picture.

  TetraGUI_06 -- Simplify with Global vars: change main()-local 'myMatrix' into 
      global 'g_myMatrix', and use 'g_currentAngle' to end their over-use as 
      arguments & return values. 
      
  TetraGUI_07 -- Add another animated angle: RENAME 'g_currentAngle' to 
    'g_angle01', CREATE 'g_angle02', and apply it in drawAll() function
      to shift & rock the RIGHT tetrahedron around one of its corners.  
      (using an approximate corner position--you can calculate a better one)
      
  TetraGUI_08 -- hinge-like attachement: attach a corner of the rocking tetra 
      to a corner of the spinning tetra, as if they were connected by a hinge.
      (HOW? a) shift drawing axes to a spinning-tetra corner, 
            b) 'rock' those drawing axes using g_angle02,
            c) (optional) shrink the drawing axes to 60% of original size,
            d) move the shrunken tetra along its (rocking) axes to put one of
              its corners at the origin of the current drawing axes.
      (Again, using an approximate corner positions on both tetrahedra -- 
      you can calculate better ones).
      
  TetraGUI_09 -- attach a second shrunken, rocking tetra to another corner of
      the spinning tetra, as we did in class 1/25/2019.  This REQUIRES you
      to use a pushdown stack (pushMatrix(), popMatrix()) to save/retrieve
      some intermediate values of g_myMatrix; be SURE you understand this.

  TetraGUI_10 -- Animation: move 'tick()' function definition outside of main()
      (as tick() no longer needs any of main()'s local variables), add run/stop
      button for animation control.
      --Add keyboard, mouse functions with reporting visible on webpage;
        make mouse-drag translate our spinning, rocking 3D shape on-screen.
     
//=============================================================================    
You should be able to extend this easily;
      a) attach a 3rd shrunken, rocking tetra to a 3rd corner of the spinning 
          tetra,
      b) Make the ENTIRE assembly of tetrahedra move in a circle; translate in
          the x,y plane orbiting the center of the screen, but without rotating
          (e.g. the top vertices stay on top).  
          HOW? start by rotating drawing axes around origin (around +z axis);
          then translate drawing axes, then rotate them again around +z axis,
          but in the OPPOSITE direction.
      c)replace all the awkward 'half-tetra' 3D part-making with your own 
          3D part, or with a simpler, more elegant tetrahedron(see note below), 
          and re-write drawTetra() to apply it.
      d) add more sequential joints & parts to make a more interesting object;
      e) add other animation angles for more interesting movements
 
//-----------------------------------------------------------------------------
    HOW TO MAKE A SIMPLER, MORE ELEGANT TETRAHEDRON:
    --if we draw an axis-aligned cube centered at the origin, then 
      --the cube's 8 corners are located at (x,y,z) == (+/-H, +/-H, +/-H) and 
      --all 12 cube edges have length 2H.  
    THEN -- any set of cube corners that share no cube edges 
    CAN be connected by a diagonal edge across each cube face (6 edges), and
    those 4 corner locations and 6 edges form an inscribed tetrahedron, and
    every edge has length 2*H*sqrt(2).
//-----------------------------------------------------------------------------

*/

// Global Variables
// =========================
// Use globals to avoid needlessly complex & tiresome function argument lists,
// and for user-adjustable controls.
// For example, the WebGL rendering context 'gl' gets used in almost every fcn;
// requiring 'gl' as an argument won't give us any added 'encapsulation'; make
// it global.  Later, if the # of global vars grows too large, we can put them 
// into one (or just a few) sensible global objects for better modularity.

var gl;           // webGL Rendering Context. Set in main(), used everywhere.
var g_canvas = document.getElementById('webgl');     
                  // our HTML-5 canvas object that uses 'gl' for drawing.
var g_myMatrix = new Matrix4();   
                  // 4x4 matrix we send to the GPU where it transforms vertices

//------------For keyboard, for mouse-click-and-drag: -----------------
var g_isDrag=false;		// mouse-drag: true when user holds down mouse button
var g_xMclik=0.0;			// last mouse button-down position (in CVV coords)
var g_yMclik=0.0;   
var g_xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var g_yMdragTot=0.0;  

var x_key  = 0;
var y_key  = 0; 


//------------Animation-------------------
var g_lastMS = Date.now();			// Timestamp for most-recently-drawn image; 
                                // in milliseconds; used by 'animate()' fcn 
                                // (now called 'timerAll()' ) to find time
                                // elapsed since last on-screen image.
var g_isRun = true;                 // run/stop for animation; used in tick().
var g_angle01 = 0;                  // initial rot. angle for left tetrahedron.
var g_angle01Rate = 45.0;           // spin speed, in degrees/second.
var g_angle02 = 0;                  // initial rot. angle for right tetrahedron
var g_angle02Rate = 20.0;           // spin speed, in degrees/second.

function main() {
//=============================================================================
  gl = init();    // from Bommier's 'lib1' library: 
                  // do all setup needed to enable us to draw colored vertices
                  // using your browser's WebGL implemention.  Returns the
                  // WebGL 'rendering context', a giant JavaScript object that:
                  //  -- has member variables for all WebGL 'state' data (e.g. 
                  // what's enabled, what's disabled, all modes, all settings)
                  //  -- has member functions (or 'methods') for all the
                  // webGL functions. For example, we call 'gl.drawArrays()'
                  // (NOTE: 'gl' is a global variable, 
                  // because we declared it WITHOUT the 'var' keyword.
                  // Keep it global so that you can use it in EVERY function)

  // Additional setup:
  gl.disable(gl.CULL_FACE);       // SHOW BOTH SIDES of all triangles
  gl.clearColor(0.25, 0.25, 0.25, 1);	  // set new screen-clear color, RGBA
                                        // (for WebGL framebuffer, not canvas)
  // THE 'REVERSED DEPTH' PROBLEM:--------------------------------------------
  // IF we don't transform our vertices by a 3D Camera Projection Matrix
  // (and we don't -- not until Project B) then the GPU will compute reversed 
  // depth values:  depth==0 for vertex z == -1; depth==1 for vertex z==-1.
  //
  // To correct the 'REVERSED DEPTH' problem, we could:
  //  a) reverse the sign of z before we render it (e.g. scale(1,1,-1);
  //  b) reverse the depth-buffer's usage of computed depth values, like this:
  gl.enable(gl.DEPTH_TEST); // enabled by default, but let's be SURE.
  gl.clearDepth(0.0);       // each time we 'clear' our depth buffer, set all
                            // pixel depths to 0.0  (1.0 is DEFAULT)
  gl.depthFunc(gl.GREATER); // (gl.LESS is DEFAULT; reverse it!)
                            // draw a pixel only if its depth value is GREATER
                            // than the depth buffer's stored value.
                           // (gl.LESS is DEFAULT; reverse it!)

  // EVERYTHING webGL draws on-screen fits within the +/-1 'cube' called
  // the 'Canonical View Volume' or CVV.  This axis-aligned cube is easy to
  // imagine because its corners are located at (x,y,z)==(+/-1, +/-1, +/-1).
  // WebGL fills the HTML-5 canvas object (the black square in our web-page)
  // with the CVV, with horizontal x-axis, vertical y-axis, and z-axis set
  // perpendicular to the screen.  
  
  // Vincent Bommier's 'lib1' library controls the GPU.  The GPU runs a 'Vertex
  // Shader' program for each vertex we draw, and that program can CHANGE the
  // on-screen position where it draws the vertex.  
  // Specifically, the (x,y,z,w) position for that vertex (stored in the GPU)
  // gets MULTIPLIED by a 4x4 matrix named 'ModelMatrix' in the Vertex Shader.
  // The GPU then uses the (x,y,z,w) result as the vertex on-screen position. 
  
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
	window.addEventListener("keydown", myKeyDown, false);
	// After each 'keydown' event, call the 'myKeyDown()' function; 'false'
	// (default) means event handler executed in  'bubbling', not 'capture')
	// ( https://www.w3schools.com/jsref/met_document_addeventlistener.asp )
	window.addEventListener("keyup", myKeyUp, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  //      including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
  //		  I use them for the arrow keys; insert/delete; home/end, etc.
	window.addEventListener("keypress", myKeyPress, false);
  // The 'keyPress' events respond ONLY to alpha-numeric keys, and sense any 
  //  		modifiers such as shift, alt, or ctrl.  I use these for single-
  //      number and single-letter inputs that include SHIFT,CTRL,ALT.
	// (SEE:  https://www.w3schools.com/jsref/met_document_addeventlistener.asp)
	//
	// MOUSE:
	// Create 'event listeners' for a few vital mouse events 
	// (others events are available too... google it!).  
	window.addEventListener("mousedown", myMouseDown); 
	// (After each 'mousedown' event, browser calls the myMouseDown() fcn.)
  	window.addEventListener("mousemove", myMouseMove); 
	window.addEventListener("mouseup", myMouseUp);	
	// window.addEventListener("click", myMouseClick);				
	// window.addEventListener("dblclick", myMouseDblClick); 
	// Note that these 'event listeners' will respond to mouse click/drag 
	// ANYWHERE, as long as you begin in the browser window 'client area'.  
	// You can also make 'event listeners' that respond ONLY within an HTML-5 
	// element or division. For example, to 'listen' for 'mouse click' only
	// within the HTML-5 canvas where we draw our WebGL results, try:
	// g_canvasID.addEventListener("click", myCanvasClick);

	// Wait wait wait -- these 'mouse listeners' just NAME the function called 
	// when the event occurs! How do the functions get data about the event?
	//  ANSWER1:----- Look it up:
	//    All mouse-event handlers receive one unified 'mouse event' object:
	//	  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
	//  ANSWER2:----- Investigate:
	// 		All Javascript functions have a built-in local variable/object named 
	//    'argument'.  It holds an array of all values (if any) found in within
	//	   the parintheses used in the function call.
  //     DETAILS:  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments.
  // SEE: 'myMouseClick()' function body below for an example
	// END Keyboard & Mouse Event-Handlers---------------------------------------

  // append_halfTetra();               // create our 3D part in the GPU.
  append_diamond03();
  append_trigonal_cylinder();
  tick(); // start animation.
}

// 
function tick() {
//-----------------------------------------------------------------------------
// if global var g_isRun==true, repeatedly adjust-and-draw the on-screen image;
// otherwise do nothing.
    if(g_isRun == false)  return;
    gl.clearColor(g_angle02/360,0,0,1);
    
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
  if( g_angle02 < 70.0 ) { // did we go past lower limit?
    g_angle02 = 70.0;                 // yes. Stop at limit, and
    if(g_angle02Rate < 0) g_angle02Rate = -g_angle02Rate; // go FORWARDS
    }
  if( g_angle02 > 150.0 ) { // did we go past upper limit?
   g_angle02 = 150.0;                 // yes. Stop at limit, and
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

  // pushMatrix(g_myMatrix);
  // g_myMatrix.rotate(g_angle01,0,1,0);
  // drawTrigonalCylinder();
  // g_myMatrix = popMatrix();
  

  pushMatrix(g_myMatrix);
  g_myMatrix.setTranslate(-.3,-.5,0);
  g_myMatrix.translate(g_xMdragTot,g_yMdragTot,0);
  g_myMatrix.scale(.5,.5,.5);

  for (i=0; i < 10;i++){
  	if (i%2 == 0){
  		g_myMatrix.rotate(g_angle02-60,1,0,0);	
  	}else{
  		g_myMatrix.rotate((g_angle02)-80,1,0,0);	
  	}
  	g_myMatrix.translate(.1,0,0);
  	drawTrigonalCylinder();

  }

  g_myMatrix = popMatrix();

  // pushMatrix(g_myMatrix);
  // g_myMatrix.translate(-.5,0,0);
  // // g_myMatrix.rotate(-45,1,0,0);
  // g_myMatrix.rotate( g_angle01, 0,1,0);      // and rotate to 'cup' inwards
  // drawTrigonalCylinder(); 
  // g_myMatrix.translate(0,0,0.5);
  // g_myMatrix.rotate(g_angle02-90,1,0,0);
  // // g_myMatrix.translate(0,0,0.25);
  // g_myMatrix.rotate(180,0,1,0);
  // drawTrigonalCylinder();   
  // g_myMatrix = popMatrix();





  // pushMatrix(g_myMatrix);
  // g_myMatrix.translate(.5,0,0);
  // g_myMatrix.rotate(-45,1,0,0);
  // g_myMatrix.rotate( g_angle01, 0,1,0);      // and rotate to 'cup' inwards
  // drawDiamond();		
  // g_myMatrix = popMatrix();


  pushMatrix(g_myMatrix);
  g_myMatrix.translate(-.2,.2,0);
  // g_myMatrix.rotate(-45,1,0,0);
  g_myMatrix.translate(x_key,y_key,0);
  g_myMatrix.rotate( g_angle01, 0,1,0);      // and rotate to 'cup' inwards
  drawDiamond(); 
  g_myMatrix.translate(0,0,0.25);
  g_myMatrix.rotate(g_angle02-90,0,1,0);
  g_myMatrix.translate(0,0,0.25);
  g_myMatrix.rotate(180,0,1,0);
  drawDiamond();   
  g_myMatrix = popMatrix();





  
  // // Let mouse-drag move the drawing axes before we do any other drawing:
  // g_myMatrix.setTranslate(g_xMdragTot, g_yMdragTot, 0.0); 
  
  // // spinning BASE tetra;
  // g_myMatrix.translate(0.0, -0.4, 0.0);  // SET drawing axes low but centered
  // g_myMatrix.rotate(g_angle01, 0,1,0);      // spin the drawing axes,
  // drawTetra();
  
  // pushMatrix(g_myMatrix);   // ***SAVE*** the matrix (so we can return to it later)
  //     // Rocking 2nd tetra:-----------------------------------
  //      g_myMatrix.translate(0.31, 0.31, 0.31);  // move drawing axes to base tetra's 
  //                             // corner: use this as the base tetra's 'hinge point'
  //                             // and make 'rocking' drawing axes pivot around it.
  //     g_myMatrix.rotate(g_angle02, -1,0,1);     // 'rock' the drawing axes,
  //     g_myMatrix.scale(0.6,0.6,0.6);            // SHRINK axes by 60% for 2nd tetra,
  //     g_myMatrix.translate(0.31, -0.31, 0.31);  // slide tetra along its rocking
  //                                               // axes to put corner at origin.
  //     drawTetra();
  //     // END of Rocking 2nd tetra:---------------------------- 
  // g_myMatrix = popMatrix();   // ***RESTORE*** the matrix we saved.
   
  // // Now we can draw our 3rd rocking tetra at another corner of the BASE tetra;
  // pushMatrix(g_myMatrix);   // ***SAVE*** the matrix (so we can return to it later)
  //     // Rocking 3rd tetra------------------------------------
  //       g_myMatrix.translate(-0.31, 0.31, -0.31);   // move drawing axes to base tetra's 
  //                             // OTHER corner: use this as the base tetra's 'hinge point'
  //                             // and make 'rocking' drawing axes pivot around it.
  //     g_myMatrix.rotate(150.0 + 70- g_angle02, -1,0,1);     // 'rock' the drawing axes,
  //     g_myMatrix.scale(0.6,0.6,0.6);            // SHRINK axes by 60% for 2nd tetra,
  //     g_myMatrix.translate(0.31, -0.31, 0.31);  // slide tetra along its rocking
  //                                               // axes to put corner at origin.
  //     drawTetra();
  //     // END of Rocking 3rd tetra:----------------------------
  // g_myMatrix = popMatrix();   // ***RESTORE*** the matrix we saved.


  //   pushMatrix(g_myMatrix);   // ***SAVE*** the matrix (so we can return to it later)
  //     // Rocking 3rd tetra------------------------------------
  //       g_myMatrix.translate(0.7, -0.4, 0.7);   // move drawing axes to base tetra's 
  //                             // OTHER corner: use this as the base tetra's 'hinge point'
  //                             // and make 'rocking' drawing axes pivot around it.
  //     g_myMatrix.rotate(150.0 + 70- g_angle02, -1,0,1);     // 'rock' the drawing axes,
  //     g_myMatrix.scale(0.5,0.5,0.5);            // SHRINK axes by 60% for 2nd tetra,
  //     g_myMatrix.translate(0.1, -0.2, 0.2);  // slide tetra along its rocking
  //                                               // axes to put corner at origin.
  //     drawTetra();
  //     // END of Rocking 3rd tetra:----------------------------
  // g_myMatrix = popMatrix();   // ***RESTORE*** the matrix we saved.



    // Report mouse-drag totals on-screen:
		document.getElementById('MouseDragResult').innerHTML=
			'Mouse Drag totals (CVV coords):\t' + g_xMdragTot+', \t' + g_yMdragTot;	
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
var foldM = new Matrix4();	// create.
  foldM.setRotate(-ANGL,1,0,0);	  // Spin V0 +x-axis by -35.264 degrees,
//  foldM.printMe("Rot matrix");	// show in console. (be sure it's valid).
  V0 = foldM.multiplyVector4(V0);	// Matrix multiply; V0 = [foldM]*V0
				// (over-writes old V0).
//  V0.printMe("Folded V0:");	// show in console.
// We want to rotate v3 in OPPOSITE direction, so
  foldM.setRotate( ANGL,1,0,0);	// setRotate() DISCARDS current contents &
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
    gl.drawArrays(gl.TRIANGLES,18,24);
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents, then:

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
    g_myMatrix.scale(.5,.5,.5);
    // g_myMatrix.rotate( 45.0, 0,0,1);      // rotate to mesh with other half
    updateModelMatrix(g_myMatrix);        // copy myMatrix to ModelMatrix in GPU
    // draw the vertices we sent to the GPU using current ModelMatrix values:
    gl.drawArrays(gl.TRIANGLES,0,18);
  g_myMatrix = popMatrix();   // RESTORE the original myMatrix contents, then:


  

}



//=================================
//================================
//
//    KEYBOARD & MOUSE FUNCTIONS
//
//================================
//=================================

function myKeyPress(kev) {
//============================================================================
// Responds to most common alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  
// To respond to non-alphanumeric keys (e.g. arrow keys, PageUp, PageDn, etc.)
// please use the myKeyDown(), myKeyUp() functions instead. 

	myChar = String.fromCharCode(kev.keyCode);//convert code to character-string
	switch(myChar) {
		case 'p':	
		case 'P':
			console.log("Pause/unPause!\n");    // print on console,
			document.getElementById('KeyPressResult').innerHTML =  
			'myKeyPress() found p/P key. Pause/unPause!';   // print on webpage
			if(isRun==true) {
			  isRun = false;    // STOP animation
			  }
			else {
			  isRun = true;     // RESTART animation
			  tick();
			  }
			break;

		//------------------WASD navigation-----------------
		case 'a':
		case 'A':
			console.log("a/A key: Strafe LEFT!\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'myKeyPress() found a/A key. Strafe LEFT!';
			break;
		case 'd':
		case 'D':
			console.log("d/D key: Strafe RIGHT!\n");
			document.getElementById('KeyPressResult').innerHTML = 
			'myKeyPress() found d/D key. Strafe RIGHT!';
			break;
		case 's':
		case 'S':
			console.log("s/S key: Move BACK!\n");
			document.getElementById('KeyPressResult').innerHTML = 
			'myKeyPress() found s/Sa key. Move BACK.';
			break;
		case 'w':
		case 'W':
			console.log("w/W key: Move FWD!\n");
			document.getElementById('KeyPressResult').innerHTML =  
			'myKeyPress() found w/W key. Move FWD!';
			break;		
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			// Report EVERYTHING about this pressed key in the webpage 
			// in the <div> element with id='KeyPressResult': 
  		document.getElementById('KeyPressResult').innerHTML = 
    'myKeyPress(): UNUSED char= '+ myChar 		 + ', keyCode= '+ kev.keyCode 	+ 
   			    ', charCode= '+ kev.charCode + ', shift= '	 + kev.shiftKey 	+ 
   			    ', ctrl= '		+ kev.shiftKey + ', altKey= ' + kev.altKey 		+ 
   			    ', metaKey= '	+ kev.metaKey;
			break;
	}
}

function myKeyDown(kev) {
//============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode (varies for different countries & alphabets).
//
//  **NOTE**: if you DON'T need to sense non-ASCII keys (arrow keys, fcn keys, 
// pageUp, pageDn, Ins, Del, etc) then just use the 'myKeyPress()' fcn instead.
// The 'keypress' event captures the combined effects of alphanumeric keys and
// the SHIFT, ALT, and CTRL modifiers. It translates pressed keys into ordinary
// ASCII codes; you'll get uppercase 'S' if you hold shift & press the 's' key.
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of a mess of JavaScript keyboard event handling,
// see:    http://javascript.info/tutorial/keyboard-events
//
	document.getElementById('KeyPressResult').innerHTML = ''; // clear old result
			
	switch(kev.keyCode) {			
	// keycodes !=ASCII, but are very consistent for nearly all non-alphanumeric
	// keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
		    x_key -= .1;
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Left Arrow:keyCode='+kev.keyCode;
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
			y_key += .1;
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():   Up Arrow:keyCode='+kev.keyCode;
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
			x_key += .1;
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown():Right Arrow:keyCode='+kev.keyCode;
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
			y_key -= .1;
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown(): Down Arrow:keyCode='+kev.keyCode;
  		break;
		default:
			console.log('myKeyDown()--keycode=', kev.keyCode, ', charCode=', kev.charCode);
  		document.getElementById('KeyDownResult').innerHTML =
  			'myKeyDown()--UNUSED keyCode='+kev.keyCode;
			break;
	}
}

function myKeyUp(kev) {
//=============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// You probably don't want to use this ('myKeyDown()' explains why). Instead, /
// you'll find myKeyPress() handles most or all keyboard-interface needs.
/*
	console.log('myKeyUp()--keyCode='+kev.keyCode+' released.');
*/
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
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = true;										// set our mouse-dragging flag
	g_xMclik = x;												// record where mouse-dragging began
	g_yMclik = y;                       // using global vars (above main())
	// 	document.getElementById('MouseAtResult').innerHTML = 
	// 'myMouseDown() at CVV coords x,y = '+x+', '+y;

	g_angle02Rate += 100;
  console.log("you clicked me");
};


function myMouseMove(ev) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(g_isDrag==false) return;			// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									  // x==0 at canvas left edge
	var yp = g_canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

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
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - g_canvas.width/2)  / 		// move origin to center of canvas and
  						 (g_canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - g_canvas.height/2) /		//										 -1 <= y < +1.
							 (g_canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	g_isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	g_xMdragTot += (x - g_xMclik);
	g_yMdragTot += (y - g_yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',g_xMdragTot,',\t', g_yMdragTot);
	// Put it on our webpage too...
	// document.getElementById('MouseAtResult').innerHTML = 
	// 'myMouseUp(       ) at CVV coords x,y = '+x+', '+y;
};

function buttonClearDragTot() {
//=============================================================================
// on-screen button: clears global mouse-drag totals.
  g_xMdragTot = 0.0;
  g_yMdragTot = 0.0;
}