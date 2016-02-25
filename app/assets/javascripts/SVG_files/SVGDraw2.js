// contruct svgLayer from container's attributes and data-attributes
//////////
//  Previous version pssed svgLayer as argument, not container
//  therefore we must "step in" one level to bind handlers to the correct object
//////////
/*
 Discussion/tradeoff issues with SVGDraw as of 17FEB2016:

Priorities (JRF):
 1. BUG text broken after integration of Mousetrap (just discovered in testing)
 2. BUG need encapsulated listener for image load complete, otherwise scaling faults, etc.
 3. (a) below
 4. (e) below in progress but currently suspended
 5. (f) below, f.v implemented; f.i/ii, f.vi
 6. (l) below
 7. (g) below

Features/Issues:
a. Scale and normalize image to container (only partially correct now)
 (aspect ratio compensation source to target svg)
b. Explicit edit mode versus auto mouseenter
c. Specific style parameters per svg element type
d. DONE "Semantic" zoom applied to bubbles on creation (vis a vis real-time)
e. Tableau of function mode buttons/indicators
  (auto-build controls on invocation from div data- element)
f. HOT-KEYS for: abort last individual point (e.g., escape)
 i. return cursor to previous point (what key/combination?)
 ii. escape at initial point aborts element? combine with (i)?
 iii. on edit of poly-element, only allow one reversion of currently edited point
 (use same mechanism?  i.e., stash reversion point on creation - no, this is a sequenced element)
 iv. abort last/current element (e.g., delete)
 v. finish current element (e.g., enter)
 vi. ^B to move current element to bottom
   (or Move [element] to the top function - harder to make sure it works)
 vii. enter/inhibit mouse"over" editing
 viii. SPACE held down to drag-pan
g. Export svg markup (currently elements are partially corrupted - i.e., incomplete end tag)
 Packaging:
 verbatim
 style vs element segregation

h. "Stacking" issues - tokenize elements for selection outside the image.
i. After the fact grouping
j. Eliminate jQuery? - DONE
k. Color picker
l. Measurement specifier and tool (caliper)
m. +/- 90 degree text orientation
n. ARROW super-element

 Libraryization:  data- elements to define configuration
 auto-generate html
 only require a div with data- elements
 JSON configuration? Is grabtag JSON? review again!

 // bounds check on move (in svgDraw.js) ?
 // capture svg data - DONE, then removed due to closing tag artifact in DOM
 // source image from http://

 */
var xC = 0;
var yC = 0;
var cursorMode = "MOVE";
var cursorColor = '#ff0000';
var zoom;         ///////////////////////////  = 0.2 should be set on initialization from baseZoom @ full image
var baseStrokeWidth = 1;
var baseBubbleRadius = 6;
// transform below to functions?
var strokeWidth = (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)
var bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)
var baseZoom;         ///////////////////////////// should be calculated from svg and image attributes
var maxZoom = 4;        // this is 4 pixels per source image pixel
var zoomDelta = 0.02;   // this can be altered to discriminate legacy firefox dommousescroll event
var svgImage;
var thisSvg = [];            // collect points as [x,y]
var svgOffset;              // set on document ready ////////// test against fully packaged code

var thisSvgText;            // pointer to svg text element currently being populated
var textHeight = 75;
var textFont = 'Verdana';

var waitElement = false;   // interlock flag to prevent mouseenter mode change after selecting a create mode

var thisGroup;              // should be the parent of the current element

var savedCursorMode = cursorMode;

var thisElement;              // should be the current element

var thisBubble;             // the bubble mousedown-ed in the currently edited element

var svgInProgress = false;

var lastMouseX;
var lastMouseY;

var logMouse = false;       // debug
var logStatus = false;      // flags
var logIndex = 0;           // limit counter for above

function SVGDraw(containerID) {     // container:<svgLayer>:<xlt>:<svgImage>
  //var svgDraw/* = null*/;
  //var xC = 0;
  //var yC = 0;
  //var cursorMode = "MOVE";
  //var cursorColor = '#ff0000'
  //var zoom;         ///////////////////////////  = 0.2 should be set on initialization from baseZoom @ full image
  //var baseStrokeWidth = 1;
  //var baseBubbleRadius = 6;
  //// transform below to functions?
  //strokeWidth = (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)
  //bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)
  //var baseZoom = 0.2;         ///////////////////////////// should be calculated from svg and image attributes
  //var maxZoom = 4;        // this is 4 pixels per source image pixel
  //var zoomDelta = 0.02;   // this can be altered to discriminate legacy firefox dommousescroll event
  svgImage = new Image();
  thisSvg = [];            // collect points as [x,y]
  //var svgOffset;              // set on document ready ////////// test against fully packaged code

  //thisSvgText;            // pointer to svg text element currently being populated
  textHeight = 75;
  textFont = 'Verdana';

  //waitElement = false;   // interlock flag to prevent mouseenter mode change after selecting a create mode

  //var thisGroup;              // should be the parent of the current element

  savedCursorMode = cursorMode;

  //var thisElement;              // should be the current element

  //var thisBubble;             // the bubble mousedown-ed in the currently edited element

  //svgInProgress = false;

  //var lastMouseX;
  //var lastMouseY;

  var cWidth = parseInt(containerID.attributes['data-width'].value);
  var cHeight = parseInt(containerID.attributes['data-height'].value);


  svgImage.src = containerID.attributes['data-image'].value;
  var self = this;
  svgImage.onload = function(event) {
    //svgDraw = new SVGDraw("svgLayer");
    //svgOffset = {
    //  top: document.getElementById(containerID).style.top.split('px')[0],
    //  left: document.getElementById(containerID).style.left.split('px')[0]
    //};

    svgOffset = {
      top: containerID.offsetTop,   // .split('px')[0],
      left: containerID.offsetLeft  // .split('px')[0]
    };
    //indicateMode(cursorMode);
    //document.getElementById("text4svg").onkeyup = updateSvgText;
    Mousetrap.bind('enter', self.doubleClickHandler());     // invokes handler vs handler's returned function
    //});
    //  svgImage.onload = function () {             ///////// how to transfer this into self-populating version?
//        $(svgImage).load(function () {
    xC = 0;
    yC = 0;
    var cAR = cWidth / cHeight;
    var iAR = svgImage.width / svgImage.height;

    var svgLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgLayer.setAttributeNS(null, 'id', 'svgLayer');
    svgLayer.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgLayer.setAttributeNS(null, 'version', '1.1');
    svgLayer.setAttributeNS(null, 'style', 'position: inherit;');
    svgLayer.setAttributeNS(null, 'width', cWidth);
    svgLayer.setAttributeNS(null, 'height', cHeight);
    containerID.appendChild(svgLayer);

    //baseZoom = document.getElementById('svgLayer').width.baseVal.value / svgImage.width;     // in general more complicated than this
    baseZoom = svgLayer.width.baseVal.value / svgImage.width;     // in general more complicated than this
    zoom = baseZoom;

    strokeWidth = (baseStrokeWidth / zoom).toString();    // dynamically recomputed with zoom (not this one)
    bubbleRadius = (baseBubbleRadius / zoom).toString(); // and transcoded from/to string (may not be required)

    lastMouseX = baseZoom * svgImage.width / 2;
    lastMouseY = baseZoom * svgImage.height / 2;
    // insert the svg base image into the transformable group <g id='xlt'>
    //var xlt = document.getElementById('xlt');
    var xlt = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    xlt.setAttributeNS(null, 'id', 'xlt');
    xlt.setAttributeNS(null, 'transform', 'translate(0,0)scale(' + parseFloat(zoom) + ')');
    svgLayer.appendChild((xlt));
    //xlt.setAttributeNS(null, '', '');
    //xlt.setAttributeNS(null, '', '');
    //xlt.setAttributeNS(null, '', '');
    var xltImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    xltImage.setAttributeNS(null, 'id', "xltImage");
    xltImage.setAttributeNS(null, 'x', "0");
    xltImage.setAttributeNS(null, 'y', "0");
    xltImage.setAttributeNS(null, 'width', svgImage.width.toString());
    xltImage.setAttributeNS(null, 'height', svgImage.height.toString());
    xltImage.setAttributeNS(null, 'preserveAspectRatio', "none");
    xltImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', svgImage.src);
    xlt.appendChild(xltImage);
    zoom_trans(0, 0, zoom);             //////////// IMPORTANT !!!!!!!!!!!

    setMove();
    //};

    self.renderFunction = self.updateSvgByElement;
    self.touchSupported = Modernizr.touch;
    self.containerID = containerID;
    self.lastMousePoint = {x: 0, y: 0};

    if (self.touchSupported) {
      self.mouseDownEvent = "touchstart";
      self.mouseMoveEvent = "touchmove";
      self.mouseUpEvent = "touchend";
    }
    else {
      self.mouseDownEvent = "mousedown";
      self.mouseMoveEvent = "mousemove";
      self.mouseUpEvent = "mouseup";

      //this.canvas.bind('dblclick', this.doubleClickHandler());
      //$("#" + canvasID).bind('dblclick', this.doubleClickHandler());
      //var objCanvas = document.getElementById(containerID);      // replace jquery references
      //var objCanvas = containerID;      // replace jquery references
      var objCanvas = svgLayer;      // replace jquery references
      objCanvas.ondblclick = self.doubleClickHandler();       // replace jquery reference

      //this.canvas.bind('DOMMouseScroll mousewheel', function (e)     // inline function vs cutout to prototype
      objCanvas.onwheel = self.mouseWheelScrollHandler();        // replace jquery reference
    }
    //this.canvas.bind(this.mouseDownEvent, this.onSvgMouseDown());
    //$("#" + containerID).on(this.mouseDownEvent, this.onSvgMouseDown());
    objCanvas.onmousedown = self.onSvgMouseDown();       // replace jquery reference
    self.mouseMoveHandler = self.onSvgMouseMove;
    self.mouseUpHandler = self.onSvgMouseUp;
    //$(document).on(this.mouseUpEvent, this.mouseUpHandler);
    objCanvas.onmouseup = self.mouseUpHandler();       // replace jquery reference
    //$(document).on(this.mouseMoveEvent, this.mouseMoveHandler);       // binding FOREVER not just on mouse OOWN
    objCanvas.onmousemove = self.mouseMoveHandler();       // replace jquery reference
  };
}

SVGDraw.prototype.onSvgMouseDown = function () {    // in general, start or stop element generation on mouseDOWN (true?)
  // BUT for PATH, line and MOVE, stop on mouseUP
  var self = this;
  return function (event) {
    self.updateMousePosition(event);
    if (svgInProgress != false && svgInProgress != cursorMode) {    // terminate in progress svg before continuing
      if (svgInProgress == 'SHIFT') {
        return;                       //  ///////// should these be returning false?
      }
      else {
        svgInProgress = cursorMode;       //  ??
        return;                                                       // TODO: fix this to actualy do something
      }
    }
    if (cursorMode == 'polygon') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        thisGroup = group;
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('polyline');        //YES, I KNOW... polyline behavior mimics google maps better

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
          + thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y for both points initially
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        //self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisElement.attributes['points'].value;   // to trim or not to trim?  if so, multiple implications here
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'polyline') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('polyline');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'stroke-linecap', 'round');
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
          + thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y for both points initially
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        //self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisElement.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'rect') {     // mouseDown  // assuming first mouseDown starts creation, second mouseDown ends
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('rect');

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'width', 1);      // width x
        element.setAttributeNS(null, 'height', 1);      // height y
        svgInProgress = cursorMode;     // mark in progress
      }
// now using mouseUp event to terminate rect
      //else {      // this is the terminus of this instance, so dissociate mouse move handler
      //if (event.type == 'mousemove') {
      //  return;}
      //svgInProgress = false;
      //setMouseoverOut(thisRectangle);
      //unbindMouseHandlers(self);
      //}
    }
    if (cursorMode == 'line') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('line');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'x1', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'y1', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'x2', thisSvg[0][0]);      // end x
        element.setAttributeNS(null, 'y2', thisSvg[0][1]);      // end y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseoverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'circle') {     // mouseDown    // modified to use common element for handlers
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        if (thisGroup != null) {      //  ////////////// ???
          clearEditElement(thisGroup);    // this group is the one with bubbles, to be obviated
        }
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement(cursorMode);      // new generalized method

        group.appendChild(element);
        thisGroup = group;
        thisElement = group.children[0];     // this var is used to dynamically create the element
        element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'r', 1);      // width x
        svgInProgress = cursorMode;     // mark in progress
      }
      // now using mouseup event exclusively to terminate circle
      //else {      // this is the terminus of this instance, so dissociate mouse move handler
      //  svgInProgress = false;
      //  //setCircleMouseoverOut(thisCircle);    // replaced below by newer paradigm
      //  setElementMouseOverOut(thisGroup);    // new reference method 14NOV
      //  unbindMouseHandlers(self);    //  this function has been deactivated
      //}
    }
    if (cursorMode == 'ellipse') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('ellipse');

        group.appendChild(element);
        thisElement = group.children[0];
        element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
        element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
        element.setAttributeNS(null, 'rx', 1);      // radius x
        element.setAttributeNS(null, 'ry', 1);      // radius y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseOverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'draw') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('polyline');

        group.appendChild(element);
        thisDraw = group.children[0];
        element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisDraw);
        unbindMouseHandlers(self);
      }
    }
    if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {     // mouseDown
      // The cubic Bezier curve requires non-symbolic integer values for its path parameters.
      // This will necessitate the dynamic reconstruction of the "d" attribute using parseInt
      // on each value.  The edit sister group will have 4 bubbles, ids: p1, c1, c2, p2 to decode
      // the control points' mousemove action.  Make control points the same as the endpoints initially,
      // then annotate with bubbles to shape the curve.  This is an extra step more than other elements.
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        thisGroup = group;
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        var element = createElement('path');

        group.appendChild(element);
        thisElement = group.children[0];
        var thisX = thisSvg[0][0];
        var thisY = thisSvg[0][1];
        element.setAttributeNS(null, 'd', getCurvePath(thisX, thisY, thisX, thisY, thisX, thisY, thisX, thisY));
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setElementMouseoverOut(thisElement);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == "text") {     // mouseDown
      thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
      savedCursorMode = cursorMode;     // plant this to prevent immediate post-creation clearing
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
      group.setAttributeNS(null, 'id', newGroupID);
      document.getElementById("xlt").appendChild(group);
      //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
      var element;
      element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      //document.getElementById(group.id).appendChild(element);
      group.appendChild(element);
      thisSvgText = group.children[0];
      element.setAttributeNS(null, 'stroke', cursorColor);
      element.setAttributeNS(null, 'stroke-width', '1');
      element.setAttributeNS(null, 'stroke-opacity', '1.0');
      element.setAttributeNS(null, 'x', thisSvg[0][0]);      // start x
      element.setAttributeNS(null, 'y', thisSvg[0][1]);      // start y
      element.setAttributeNS(null, 'style', 'font-family: ' + textFont + '; fill: ' + cursorColor.toString() + ';');
      element.setAttributeNS(null, 'font-size', textHeight);
    }
    if (cursorMode == 'MOVE') {     // mouseDown
      if (svgInProgress == false) {
        svgInProgress = cursorMode;
        //showMouseStatus('onSvgMouseDown2', event);
      }
    }
    waitElement = false;      //    ///////////   new code to allow creation start within extant element
    return event.preventDefault() && false;
  }
};

function pathPoint(x, y) {
  return parseInt(x) + ", " + parseInt(y);
}

function curvePoint(x, y) {
  return pathPoint(x, y) + ", ";
}

function getCurvePath(x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
  if (cursorMode == 'cubic') {
    return "M " + pathPoint(x1, y1) + " C " + curvePoint(cx1, cy1)
      + curvePoint(cx2, cy2) + pathPoint(x2, y2);
  }
  else return "M " + pathPoint(x1, y1) + " Q " + curvePoint(cx1, cy1) + pathPoint(x2, y2);
}

function getCurveCoords(d) {
  var pieces = d.replace(/,/g, '').split(' ');
  var j = 0;
  var coords = [];
  for (var k = 0; k < pieces.length; k++) {
    if (isNumeric(pieces[k])) {   // bypass the curve type symbol
      coords[j] = pieces[k];
      j++;
    }
  }
  return coords;
}

function getCurvePoints(coords) {   // special bounding poly for curve
  return curvePoint(coords[0], coords[1]) + ' ' + curvePoint(coords[2], coords[3]) + ' '
    + curvePoint(coords[4], coords[5]) + ' ' + curvePoint(coords[6], coords[7]);
}

function createElement(type) {
  var element = document.createElementNS('http://www.w3.org/2000/svg', type);
  element.setAttributeNS(null, 'stroke', cursorColor);
  element.setAttributeNS(null, 'stroke-width', strokeWidth);
  element.setAttributeNS(null, 'stroke-opacity', '0.9');
  element.setAttributeNS(null, 'fill', '');
  element.setAttributeNS(null, 'fill-opacity', '0.0');
  element.setAttributeNS(null, 'stroke-linecap', 'round');
  return element;
}

function setMouseoverOut(element) {
  element.setAttributeNS(null, 'onmouseover', "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "';");
  element.setAttributeNS(null, 'onmouseout', "this.attributes['stroke-width'].value = " + strokeWidth + ";");
  return element;
}

function setElementMouseOverOut(group) {     // this actually sets the parent group's listeners
  group.setAttributeNS(null, 'onmouseenter', "setEditElement(this);");               // new reference method 14NOV
  group.setAttributeNS(null, 'onmouseleave', "clearEditElement(this);");      // global var
  return group;
}

function setEditElement(group) {    // add bubble elements to the group containing this element
  if (checkElementConflict(group)) {
    showStatus('setEditElement0.5', group);
    return;
  }
  if (thisGroup == null) {    // no conflicts detected, so if thisGroup is null,
    thisGroup = group;        // there is probably no creation activity
  }
  //if (group.firstChild.tagName != cursorMode) {    // start editing an element not in the current mode
  showStatus('setEditElement1', group);
  savedCursorMode = cursorMode;   // don't wait for actual action on bubble
  if (group.firstChild.tagName != 'path') {
    cursorMode = group.firstChild.tagName;
  }
  else {                  // now that there are both cubic and quadratic curves, we must detect this one's type
    cursorMode = 'cubic';   // ///////// finesse path
    if (group.firstChild.attributes.d.value.indexOf('C ') == -1) {   // is the path a qudratic because it's not a cubic?
      cursorMode = 'quadratic';
    }
  }
  svgInProgress = false;      //  ////////// we have set bubbles but no action taken yet
  indicateMode(cursorMode);
  //}
  showStatus('setEditElement2', group);
  if (group.childNodes.length > 1) {   // do I have bubbles?
    group.lastChild.remove();         // this is the group of bubbles
  }
  showStatus('setEditElement3', group);
  var element = group.firstChild;
//    new method using createBubbleGroup
  var bubbleGroup = createBubbleGroup(group);      // since bubble groups are heterogeneous in structure
  group.appendChild(bubbleGroup);             // make the new bubble group in a no-id <g>
  showStatus('setEditElement4', group);
}

function clearEditElement(group) {     // given containing group
  if (checkElementConflict(group)) {
    showStatus('clearEditElement0', group);
    return;
  }
  //if (!svgInProgress) {
  //  return;
  //}
  cursorMode = savedCursorMode;   // on exit of edit mode, restore
  showStatus('clearEditElement1', group);
  if (group.childNodes.length > 1) {   // do I have bubbles? i.e., is there more than just the golden chile?
                                       //if (group.lastChild.childElementCount > 1) {    // if I have bubbles, how many?
    group.lastChild.remove();         // this is the group of bubbles if not just the SHIFT bubble
    thisBubble = null;
    //}
    //else {
    //  showStatus('clearEditElement0.5: SHIFT bubble not removed', group);
    //}
  }
  indicateMode(cursorMode);
  showStatus('clearEditElement2', group);
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  setElementMouseOverOut(group);
  svgInProgress = false;
  thisElement = null;
  thisGroup = null;
//  eliminated savedCursorMode = 'MOVE';
}

function checkElementConflict(group) {  // only invoked by mouseenter/leave listeners
  /* consider potential values of:
   svgInProgress, one of the svg modes, plus move, shift, and size
   cursorMode, the selected (if not always indicated) creation / editing mode
   thisElement, nominally the active element - conflict with bubbles
   thisGroup, nominally the group of the active element

   */
  if (waitElement) {
    return true;
  }
  if (!svgInProgress) {
    return false;     // if no active element
  }
  if (svgInProgress != group.firstChild.tagName) {
    return true;     //  if we crossed another element
  }
  if (thisGroup != group) {
    return true;
  }
}

function exitEditPoint(group) {    // services mouseUp from SIZE/point bubble
  // reset all bubbles for this element
  //clearEditElement(group);
  //setEditElement(group);
  // above introduce glitch where repositioned point is dissociated and ends up at last point
  // so just recalculate the points instead
  showStatus('exitEditPoint0', group);
  if (group.childElementCount > 1) {
    group.lastChild.remove();                        // eliminates all bubbles
    //group.appendChild(createBubbleGroup(group));    // reconstitutes new bubbles
  }
  thisBubble = null;
  cursorMode = savedCursorMode;   //  //////////////
  showStatus('exitEditPoint1', group);
  setElementMouseOverOut(group);
}

function setMoveElement(bubble) {    // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;          // set group for mousemove
  thisElement = group.firstChild;
  showStatus('setMoveElement0', group);
  thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  cursorMode = thisElement.tagName;
  thisGroup.attributes['onmouseenter'].value = ''; // disable mouseover on real circle's containing group
  var endK = group.lastChild.childElementCount;        // total bubbles, leave the first one
  showStatus('setMoveElement1', group);
  for (var k = endK; k > 1; k--) {
    group.lastChild.lastChild.remove();      // remove resize bubbles from the end
    showStatus('setMoveElement1-' + k, group);
  }
  group.attributes['onmouseenter'].value = '';    // turn off enter!
  //group.attributes['onmouseleave'].value = '';    // turn off leave!
  //group.setAttribute('onmouseout', 'clearEditElement(this);');      // as of right NOW
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'SHIFT';
  showStatus('setMoveElement2', group);
}

function setSizeElement(bubble) {       // this sets up the single point functions
  //thisParent = element;                           // group containing real element and the bubbles group
  //thisElement = group.firstChild;    // this is the real element
  //cursorMode = group.firstChild.tagName;  // extract its tag
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (!((cursorMode == 'cubic') || (cursorMode == 'quadratic'))) {      // tagName will be 'path'
    cursorMode = thisElement.tagName;
  }
  showStatus('setSizeElement0', group);
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleaver on real element's containing group
  if (!((cursorMode == 'cubic') || (cursorMode == 'quadratic'))) {      // tagName will be 'path'
    if (group.childElementCount > 1) {         // if more than one child, we have bubbles
      group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag radius
      showStatus('setSizeElement1', group);
    }
  }
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'SIZE';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setPointElement(bubble) {    // this performs the inline substitution of the selected bubble
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are changing
// breakpoint convenience point
  }
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {   // last point/bubble?
    thisBubble = bubble;
  }
  showStatus('setPointElement0', group);
  bubble.parentNode.lastChild.remove(); // /////////// this is the fight place: remove insert point bubbles
  cursorMode = thisElement.tagName;
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleave on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  //bubble.attributes['onmouseup'].value = '';  // calculate/populate insert point
  //if (group.childElementCount > 1) {         // if more than one child, we have bubbles
  //  group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag point
  //  showStatus('setSizeElement1', group);
  //}
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'POINT';                     // so we have an active element, and it has been marked in progress
  showStatus('setPointElement1', group);
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setNewPointElement(bubble) {     // this inserts the new point into the <poly.. element
  if (thisBubble == bubble) {   // this condition implies we mouseDowned on the point we are INSERTING
                                // /////////  VERY PRELIM
  }
  thisBubble = bubble;
  var group = bubble.parentNode.parentNode.parentNode;          // set group for mousemove handler
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  if (parseInt(bubble.id) == bubble.parentNode.childElementCount - 1) {
    thisBubble = bubble;
  }
  showStatus('setNewPointElement0', group);
  cursorMode = thisElement.tagName;
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleaver on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  thisElement.attributes['points'].value = insertNewPoint(thisElement, thisBubble);
  thisBubble.id = (parseInt(thisBubble.id) + 1).toString();   // ///////// seems to work, but...
  //group.lastChild.lastChild.removeChild();      // ///////// vaporize the intermediate newPointBubbles' group
// need mouseup on this bubble to reshfuffle bubbles -- now being handled by removing x.5 bubbles
//  bubble.attributes['onmouseup'].value = 'setEditElement(this.parentNode.parentNode);';
//  eliminated savedCursorMode = 'MOVE';
  svgInProgress = 'NEW';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
  showStatus('setNewPointElement1', group);
}                                       // use mouseup or mousedown to terminate radius drag

function insertNewPoint(element, bubble) {     //this bubble's ID truncated is the point to insert AFTER
  var splitPoints = element.attributes['points'].value.trim().split(' ');
  var thesePoints = '';
  var insertionPoint = parseInt(bubble.id);
  var thisPoint = bubble.attributes['cx'].value + ',' + bubble.attributes['cy'].value;
  for (var k = 0; k < splitPoints.length; k++) {
    thesePoints += splitPoints[k] + ' ';
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }
  return thesePoints;
}

function createBubbleGroup(group) {
  var svgAttrs = {};
  var thisX;
  var thisY;
  var splitPoints;
  var nextX;
  var nextY;
  var element = group.firstChild;
  svgAttrs = getModel(element.tagName);
  if (element.tagName != 'path') {    // /////// skip this step for path exception
    for (var key in svgAttrs) {     // collect basic (numeric) attributes for positioning and extent
      svgAttrs[key] = getAttributeValue(element, key);       // collect this numeric attribute
    }
  }
  var bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  var bubble;

  switch (element.tagName) {
    case 'circle':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var cr = svgAttrs['r'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(cr + cx, cy));    // this is the E resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cr + cy));    // this is the S resize point
      bubbleGroup.appendChild(createSizeBubble(cx - cr, cy));    // this is the W resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - cr));    // this is the N resize point
      return bubbleGroup;
    case 'ellipse':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var rx = svgAttrs['rx'];
      var ry = svgAttrs['ry'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(rx + cx, cy));    // this is the E resize point
      bubbleGroup.appendChild(createSizeBubble(cx, ry + cy));    // this is the S resize point
      bubbleGroup.appendChild(createSizeBubble(cx - rx, cy));    // this is the W resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - ry));    // this is the N resize point
      return bubbleGroup;
    case 'rect':
      var x = svgAttrs['x'];
      var y = svgAttrs['y'];
      var w = svgAttrs['width'];
      var h = svgAttrs['height'];
      bubbleGroup.appendChild(createShiftBubble(x, y));     // this is the rectangle origin, anomalous as it may be
      bubbleGroup.appendChild(createSizeBubble(x + w, y + h));    // this is the resize point
      return bubbleGroup;
    case 'line':
      var x1 = svgAttrs['x1'];
      var y1 = svgAttrs['y1'];
      var x2 = svgAttrs['x2'];
      var y2 = svgAttrs['y2'];
      bubbleGroup.appendChild(createPointBubble(x1, y1, 'x1-y1'));     // this is the 1st line coordinate
      bubbleGroup.appendChild(createPointBubble(x2, y2, 'x2-y2'));    // this is the 2nd (terminal) line point
      return bubbleGroup;
    case 'path':           // this is a major exception to the other cases, used for curve !! articulate for type !!
      var theseCurvePoints = element.attributes['d'].value;
      var thisCurveTypeQuadratic = theseCurvePoints.indexOf('Q ') > 0;
      var theseCoords = getCurveCoords(theseCurvePoints);       // stack control points after end points after helpers
      // fill out both control points in either case
      if (thisCurveTypeQuadratic) {          // if quadratic
        theseCoords[6] = theseCoords[4];  // replicate p2
        theseCoords[7] = theseCoords[5];  // into last coord set
        theseCoords[4] = theseCoords[2];          // for both control points
        theseCoords[5] = theseCoords[3];          // for control lines
      }
      //theseCoords[2] = ((parseInt(theseCoords[0]) + parseInt(theseCoords[6])) / 2).toFixed();   // set to
      //theseCoords[3] = ((parseInt(theseCoords[1]) + parseInt(theseCoords[7])) / 2).toFixed();   // mean point
      // create the lines between the control point(s) and the endpoints
      bubbleGroup.appendChild(createControlLine(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3], 'l1'));
      bubbleGroup.appendChild(createControlLine(theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7], 'l2'));
      // create the "bounding" polygon  'poly'
      bubbleGroup.appendChild(createCurvePoly(theseCoords, 'poly'));
      bubbleGroup.appendChild(createCurveBubble(theseCoords[0], theseCoords[1], 'p1'));   // first endpoint
      bubbleGroup.appendChild(createCurveBubble(theseCoords[6], theseCoords[7], 'p2'));   // second endpoint
      bubbleGroup.appendChild(createCurveBubble(theseCoords[2], theseCoords[3], 'c1'));   // first control point
      if (!thisCurveTypeQuadratic) {
        bubbleGroup.appendChild(createCurveBubble(theseCoords[4], theseCoords[5], 'c2'));   // second control point
      }
      return bubbleGroup;
    case 'polygon':
    case 'polyline':      // create a parallel structure to the point attr, using its coords
      var thesePoints = element.attributes['points'].value.trim();      // trim to eliminate extraneous empty string
      splitPoints = thesePoints.split(' ');
      var thisPoint = splitPoints[0].split(',');   // prime the pump for iteration
      thisX = parseFloat(thisPoint[0]);
      thisY = parseFloat(thisPoint[1]);
      var nextPoint;                      // nextX,nextY these are used to bound and calculate the intermediate
      // insert new point bubbles in separate parallel group
      var newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (var k = 0; k < splitPoints.length; k++) {    // append this point and an intermediary point
        //thisPoint  = splitPoints[k].split(',');
        bubbleGroup.appendChild(createPointBubble(thisX, thisY, k.toString()));   // add the vertex point
        if (k < splitPoints.length - 1) {     // since we are looking ahead one point
          nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), k.toString() + '.5'));
          // ///////// watch for hierarchicical misplacement
          thisX = nextX;
          thisY = nextY;
        }
      }
      if (element.tagName == 'polygon') {       // additional step for polygon, since there is an implicit closure
        thisPoint = splitPoints[0].split(',');   // get the first point again
        thisX = parseFloat(thisPoint[0]);
        thisY = parseFloat(thisPoint[1]);
        var thisID = (splitPoints.length - 1).toString() + '.5';
        newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), thisID));
      }
      bubbleGroup.appendChild(newBubbleGroup);   // add the new point insertion bubbles
      return bubbleGroup;
  }
}

function createShiftBubble(cx, cy) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.8');         // SHIFT bubble is slightly more opaque
  bubble.setAttributeNS(null, 'onmousedown', "setMoveElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', "setElementMouseOverOut(this);");
  bubble.setAttributeNS(null, 'style', 'cursor:move;');
  return bubble;
}

function createSizeBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setSizeElement(this);");
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
  return bubble;
}

function createPointBubble(cx, cy, id) {    // used for <poly...> vertices
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', "exitEditPoint(thisGroup);");   // questionable reference
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'x1-y1', 'x2-y2' for <line>,
                                            // will take the form: '0', '13' for <poly-...>
  return bubble;
}

function createNewPointBubble(cx, cy, id) {    // used for <poly...> inter-vertex insert new point
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 0.8);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#555555');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.4');         // SIZE/POINT bubble is even less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setNewPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', 'exitEditPoint(thisGroup);');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: '0.5', '23.5' for <poly-...>
  return bubble;
}

function createCurveBubble(cx, cy, id) {    // used for <path...> inter-vertex control point
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', bubbleRadius * 1.25);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#333333');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.8');         // make these stand out
  bubble.setAttributeNS(null, 'onmousedown', "setSizeElement(this);");    //  ///////////  change?
  bubble.setAttributeNS(null, 'onmouseup', 'exitEditPoint(thisGroup);');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'c1', 'c2' for <path-...>
  return bubble;
}

function createControlLine(x1, y1, x2, y2, id) {
  var line = createElement('line');
  line.setAttributeNS(null, 'x1', x1);
  line.setAttributeNS(null, 'y1', y1);
  line.setAttributeNS(null, 'x2', x2);
  line.setAttributeNS(null, 'y2', y2);
  line.setAttributeNS(null, 'id', id);
  line.setAttributeNS(null, 'stroke-width', '1');
  return line;
}

function createCurvePoly(coords) {        // used by createBubbleGroup.path
  var poly = createElement('polyline');
  poly.setAttributeNS(null, 'id', 'poly');
  poly.setAttributeNS(null, 'points', getCurvePoints(coords));
  poly.setAttributeNS(null, 'stroke-opacity', '0.0');
  return poly;
}

function createBubbleStub(offsetX, offsetY) {   // create same-size bubble
  var bubble = createElement('circle');      // this is constant, since it is a bubble
  //bubbleGroup.appendChild(bubble);    // delegate this to caller
  if (isNaN(offsetX)) {
    alert(offsetX);
  }
  if (isNaN(offsetY)) {
    alert(offsetY);
  }
  //thisCircle = group.children[0];     // this var is used to dynamically create the element
  bubble.setAttributeNS(null, 'cx', offsetX);      // start x
  bubble.setAttributeNS(null, 'cy', offsetY);      // start y
  bubble.setAttributeNS(null, 'r', bubbleRadius);      // radius
  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  bubble.setAttributeNS(null, 'stroke', '#222222');   // set scaffold attrs
  bubble.setAttributeNS(null, 'stroke-width', bubbleRadius * 0.25);
  //attrs.forEach
  return bubble;
}

function getAttributeValue(element, attr) {     // convert string numeric and truncate to one place after decimal
  return parseFloat(parseFloat(element.attributes[attr].value).toFixed(1));
}

function getModel(element) {            // by svg element type, return its salient model attributes for bubbles
  var ox = 0;
  var oy = 0;
  var p1 = 1;
  var p2 = 1;
  switch (element) {
    case 'polyline':
      return {
        'points': p1
      };
    case 'polygon':
      return {
        'points': p1
      };
    case 'rect':
      return {
        'x': ox, 'y': oy, 'width': p1, 'height': p2
      };
    case 'line':
      return {
        'x1': ox, 'y1': oy, 'x2': p1, 'y2': p2
      };
    case 'circle':
      return {
        'cx': ox, 'cy': oy, 'r': p1
      };
    case 'ellipse':
      return {
        'cx': ox, 'cy': oy, 'rx': p1, 'ry': p2
      };
    case 'path':    //  //////// only for curve !!!
      return {
        'x1': ox, 'y1': oy, 'xc1': p1, 'yc1': p2, 'xc2': p1, 'yc2': p2, 'x2': ox, 'y2': oy
      };
  }                   // end switch
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


function unbindMouseHandlers(self) {    //   /////////////  this routine and its usages should be excised
  if (self.event != 'mouseup') {
    return false;                 // ////// this is always happening
  }
  //$(document).unbind(self.mouseMoveEvent, self.mouseMoveHandler);   // unbinding on mouse UP
  //$(document).unbind(self.mouseUpEvent, self.mouseUpHandler);
// kill the linkage to the handler
//  self.mouseMoveHandler = null;
//  self.mouseUpHandler = null;
}

function showMouseStatus(where, event) {
  if (logMouse) {
    var span = document.getElementById('mouseStatus');
    if (span.innerHTML.length > 32768) {
      //if ($('#mouseStatus').html().length > 8192) {
      span.innerHTML = span.innerHTML.substr(0, 24000);   // clip periodically
    }
    document.getElementById('coords').innerHTML = 'xC: ' + xC.toFixed(1) + ' lastX: ' + lastMouseX.toFixed(3)
      + ' yC: ' + yC.toFixed(1) + ' lastY: ' + lastMouseY.toFixed(3);
    span.innerHTML = '<br />' + event.timeStamp + ': ' + where + ' Mode: ' + cursorMode + '; svgInProgress: ' + svgInProgress.toString()
      + '. Event: ' + event.type + '. button: ' + event.button + '. which: ' + event.which + span.innerHTML;
  }
}

function showStatus(where, element) {
  if (logStatus) {
    var span = document.getElementById('mouseStatus');
    if (span.innerHTML.length > 32768) {
      span.innerHTML = span.innerHTML.substr(0, 24000);   // clip periodically
    }
    logIndex += 1;
    var thisGroupTagNameAndID = ' thisGroup: NULL';
    if (thisGroup != null) {
      thisGroupTagNameAndID = ' thisGroup:' + thisGroup.tagName + '#' + thisGroup.id
        + ' firstChild:' + thisGroup.firstChild.tagName;
    }
    var thisElementTagName = ' thisElement: NULL';
    if (thisElement != null) {
      thisElementTagName = ' thisElement:' + thisElement.tagName;
    }
    var thisBubbleID = ' thisBubble: NULL';
    if (thisBubble != null) thisBubbleID = ' thisBubbleID:' + thisBubble.id;
    var nowStatus = "<br>" + logIndex + ' ' + where + "; " /*+ element.outerHTML.replace(/[<]+/g, '&lt;').replace(/[>]+/g, '&gt;') + '<br>'*/
      + thisGroupTagNameAndID + thisElementTagName
    /*+ '<br>'*/
    nowStatus = nowStatus + ' cursorMode:' + cursorMode + ' saved:' + savedCursorMode + ' svgIP:' + svgInProgress.toString() + thisBubbleID;
    span.innerHTML = nowStatus.toString() + ' ' + span.innerHTML;
  }
}

SVGDraw.prototype.onSvgMouseMove = function () {
  var self = this;
  return function (event) {

    self.renderFunction(event);
    event.preventDefault();
    return false;
  }
};

function length2points(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + (Math.pow((y1 - y2), 2)));
}

var Trig = {
  distanceBetween2Points: function (point1, point2) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
  },

  angleBetween2Points: function (point1, point2) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.atan2(dx, dy);
  }
};

SVGDraw.prototype.updateMousePosition = function (event) {
  var target;
  if (this.touchSupported) {
    target = event.originalEvent.touches[0]
  }
  else {
    target = event;
  }
  //showMouseStatus('updateMousePosition', event);
  var offset = svgOffset;    //  was this.canvas.offset();
  this.lastMousePoint.x = target.pageX - offset.left;
  this.lastMousePoint.y = target.pageY - offset.top;
  lastMouseX = this.lastMousePoint.x;
  lastMouseY = this.lastMousePoint.y;
};

SVGDraw.prototype.updateSvgByElement = function (event) {
  /*
   This section services updating of svg element thisElement from onSvgMouseMove

   The initial scheme prior to editing of elements was to dynamically update the current point
   of the currently being created thisElement. This point has been the latest or final point
   in the element, where <circle>, <ellipse>, <rect>angle, and <line> have only the initial
   point (set during onSvgMouseDown) and a final point/datum.

   The general scheme up to implementation of editing <line>/<polyline>/<polygon> element types
   has been to articulate thisElement through the svgInProgress state (SHIFT, SIZE, cursorMode)
   where SHIFT moves the entire element, typically through the initial point set during
   onSvgMouseDown.For what had been effectively a resizing operation, sleight of hand set up the
   modes and states to resume processing of thisElement AS IF it had just been created and was
   as usual dynamically defining the second point/datum.

   On implementation of <line> editing, the initial decision was to make both endpoints (x1, y1)
   (x2, y2) repositionable rather than have the initial point move the line (which would entail
   adjusting both points in concert - no big deal, but not clearly preferable to individually
   moving each endpoint). This implementation surfaced the issue of point identification for the
   onSvgMouseMove handler. Clearly implications are paramount for <polyline>/<polygon> editing,
   and so a perversion of the SHIFT mode was temporarily used for <line> while development of a
   proper technique for <poly-...> proceeds.
   */
//if (escKey) {}    //      ///////////   insert key over-ride functionality here

  if (cursorMode != "MOVE") {          // if we are not moving(dragging) the SVG check the known tags
    if ((cursorMode == "polygon") || ((cursorMode == 'polyline') && (svgInProgress == 'polygon'))) {
      if (svgInProgress == false) {
        return;
      }     // could be POINT or NEW or polygon
      this.updateMousePosition(event);
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value.trim();
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;
          thesePoints = '';
          for (var k = 0; k < splitPoints.length; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {        // svgInProgress = 'polygon', so normal creation of element adding new point to end
        thesePoints = '';                               // clear thecollector
        for (k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if (cursorMode == "polyline") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value.trim();
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;   // replace this point
          thesePoints = '';
          for (var k = 0; k < splitPoints.length; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {
        thesePoints = '';                               // clear the collector
        for (k = 0; k < splitPoints.length - 1; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if ((cursorMode == "rect") /*|| (cursorMode == 'bubble')*/) {
      //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;
      if (/*(event.type == 'mousedown') || */(svgInProgress == false)) {
        return;
      }
      if (svgInProgress == 'SHIFT') {
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['x'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['y'].value = (lastMouseY - yC) / zoom;
      }
      else {
        var thisRectX = thisElement.attributes['x'].value;
        var thisRectY = thisElement.attributes['y'].value;
        var thisRectW = thisElement.attributes['width'].value;
        var thisRectH = thisElement.attributes['height'].value;

        this.updateMousePosition(event);
        thisElement.attributes['width'].value = (lastMouseX - xC) / zoom - thisRectX;
        thisElement.attributes['height'].value = (lastMouseY - yC) / zoom - thisRectY;
        //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects
      }
    }
    else if (cursorMode == "line") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      var linePoints = ['x2', 'y2'];          // preset for normal post-creation mode
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (!isNumeric(thisBubble.id)) {       // presume either 'x1-y1' or 'x2-y2'
          linePoints = (thisBubble.id).split('-');
        }
      }
      thisElement.attributes[linePoints[0]].value = (lastMouseX - xC) / zoom;
      thisElement.attributes[linePoints[1]].value = (lastMouseY - yC) / zoom;
      //thisElement.attributes['stroke'] = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if ((cursorMode == "circle") /*|| (cursorMode == 'bubble')*/) {
      //thisCircle = thisElement;             // first step toward generalizing SHIFT/SIZE handlers
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;         // //// this has been verified to actually occur
      }
      showMouseStatus('updateSvgByElementC0', event);
      showStatus('updateSvgByElementC0', thisElement.parentElement);
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        showMouseStatus('updateSvgByElementC1', event);
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
        //var realCircle = thisGroup.firstChild;              // new reference method 14NOV
        //realCircle.attributes['cx'].value = (lastMouseX - xC) / zoom;
        //realCircle.attributes['cy'].value = (lastMouseY - yC) / zoom;
        showStatus('updateSvgByElementC1', thisElement.parentElement);
        showMouseStatus('updateSvgByElementC2', event);
      }
      else {                                // either resizing or originally sizing
        showMouseStatus('updateSvgByElementC3', event);
        //this.context.moveTo(lastMouseX, lastMouseY);
        var thisCircX = thisElement.attributes['cx'].value;
        var thisCircY = thisElement.attributes['cy'].value;
        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
        thisElement.attributes['r'].value = radius;
        //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
        showStatus('updateSvgByElementC3', thisElement.parentElement);
      }
    }
    else if (cursorMode == "ellipse") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      if (svgInProgress == 'SHIFT') {             // changing position of this element
        showMouseStatus('updateSvgByElementC1', event);
        this.updateMousePosition(event);
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        thisElement.attributes['cx'].value = (lastMouseX - xC) / zoom;    // correspondingly translate thisElement
        thisElement.attributes['cy'].value = (lastMouseY - yC) / zoom;
      }
      else {
        var thisEllipseX = thisElement.attributes['cx'].value;
        var thisEllipseY = thisElement.attributes['cy'].value;

        //this.context.moveTo(lastMouseX + thisCircX * zoom, lastMouseY + thisCircY * zoom);
        //this.context.moveTo(lastMouseX, lastMouseY);
        this.updateMousePosition(event);
        lastMouseX = this.lastMousePoint.x;
        lastMouseY = this.lastMousePoint.y;
        //var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
        thisElement.attributes['rx'].value = Math.abs(thisEllipseX - (lastMouseX - xC) / zoom);
        thisElement.attributes['ry'].value = Math.abs(thisEllipseY - (lastMouseY - yC) / zoom);
      }
      //thisElement.attributes['stroke'].value = cursorColor;   ///// disabled due to unwanted side effects
    }
    else if (cursorMode == "draw") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisDraw.attributes['points'].value;
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
      thisDraw.attributes['points'].value = thesePoints.concat(thisPoint);
    }
    else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for line
        return;
      }
      this.updateMousePosition(event);
      var thisDvalue = thisElement.attributes['d'].value;
      var thisCurveQuadratic = thisDvalue.indexOf('Q ') > 0;
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
                                      // currently, no distinction is made between existing vertex and new point
                                      // however, this may change in the future JRF 23NOV15
        var thisX = (lastMouseX - xC) / zoom;
        var thisY = (lastMouseY - yC) / zoom;
        thisBubble.attributes['cx'].value = thisX;     // translate the bubble
        thisBubble.attributes['cy'].value = thisY;
        var theseCoords = getCurveCoords(thisDvalue);
        if (thisCurveQuadratic) {
          theseCoords[6] = theseCoords[4];    // populate cubic curve p2
          theseCoords[7] = theseCoords[5];    // coordinates from quadratic values
        }
        switch (thisBubble.id) {
          case 'p1':
            theseCoords[0] = thisX.toFixed();
            theseCoords[1] = thisY.toFixed();
            break;
          case 'p2':
            theseCoords[6] = thisX.toFixed();
            theseCoords[7] = thisY.toFixed();
            break;
          case 'c1':
            theseCoords[2] = thisX.toFixed();
            theseCoords[3] = thisY.toFixed();
            break;
          case 'c2':
            theseCoords[4] = thisX.toFixed();
            theseCoords[5] = thisY.toFixed();
            break;
        }
        if (thisCurveQuadratic) {    // populate cubic curve control points from quadratic values
          theseCoords[4] = theseCoords[2];
          theseCoords[5] = theseCoords[3];
        }
        // 'd' is the string containing the path parameters; set it to the updated values
        thisElement.attributes['d'].value = getCurvePath(theseCoords[0], theseCoords[1], theseCoords[2], theseCoords[3],
          theseCoords[4], theseCoords[5], theseCoords[6], theseCoords[7]);    // responds to both C and Q curves
        // now set the lines for the control points; two lines (l1 and l2) whether cubic or quadratic
        thisElement.parentElement.lastChild.children['l1'].attributes['x1'].value = theseCoords[0];
        thisElement.parentElement.lastChild.children['l1'].attributes['y1'].value = theseCoords[1];
        thisElement.parentElement.lastChild.children['l1'].attributes['x2'].value = theseCoords[2];
        thisElement.parentElement.lastChild.children['l1'].attributes['y2'].value = theseCoords[3];

        thisElement.parentElement.lastChild.children['l2'].attributes['x1'].value = theseCoords[4];
        thisElement.parentElement.lastChild.children['l2'].attributes['y1'].value = theseCoords[5];
        thisElement.parentElement.lastChild.children['l2'].attributes['x2'].value = theseCoords[6];
        thisElement.parentElement.lastChild.children['l2'].attributes['y2'].value = theseCoords[7];

        thisElement.parentElement.lastChild.children['poly'].attributes['points'].value = getCurvePoints(theseCoords)
          + theseCoords[0] + ', ' + theseCoords[1];     // 'poly' is bounding polygon of endpoints and control points
      }
      else {    // defining initial curve as straight line, i.e., rubber-banding p2 until mouseup
        var thisX2 = (lastMouseX - xC) / zoom;
        var thisY2 = (lastMouseY - yC) / zoom;
        var thisPathType = ' C ';              // set quadratic control point at midpoint, cubic's at p1 and p2
        if (cursorMode == 'quadratic')  thisPathType = ' Q ';
        var theseCurvePoints = thisDvalue.split(thisPathType);      // isolate control point(s) and p2
        var thisP1 = theseCurvePoints[0].split('M ');               // isolate p1
        thisP1 = thisP1[1].split(', ');
        var theseControlPoints = theseCurvePoints[1].split(', ');              // get array of x,y,x,y(,x,y)
        if (thisPathType == ' Q ') {
          theseControlPoints[0] = ((parseInt(thisP1[0]) + thisX2) / 2).toFixed();
          theseControlPoints[1] = ((parseInt(thisP1[1]) + thisY2) / 2).toFixed();
        }
        //theseCoords[2] = ((parseInt(theseCoords[0]) + parseInt(theseCoords[6])) / 2).toFixed();   // set to
        //theseCoords[3] = ((parseInt(theseCoords[1]) + parseInt(theseCoords[7])) / 2).toFixed();   // mean point
        var thisD = theseCurvePoints[0] + thisPathType + curvePoint(theseControlPoints[0], theseControlPoints[1]);
        if (cursorMode == 'cubic') {
          thisD += curvePoint(thisX2, thisY2);
        }
        thisD += pathPoint(thisX2, thisY2);
        thisElement.attributes['d'].value = thisD;
      }
    }
    else if (cursorMode == "text") {

    }
  }
  else if (cursorMode == 'MOVE') {    // Revert to MOVE: this version assumes manipulating the transform <xlt> of the SVG via xC, yC
    /*  if((event.buttons == 1) && (event.button == 0))*/
    //showMouseStatus('updateSvgByElement2', event);

    if (svgInProgress == 'MOVE') {
      //showMouseStatus('updateSvgByElement3', event);
      //event.trigger('onSvgMousUp');

      var oldX = this.lastMousePoint.x;
      var oldY = this.lastMousePoint.y;
      this.updateMousePosition(event);
      //lastMouseX = this.lastMousePoint.x;
      //lastMouseY = this.lastMousePoint.y;
      xC = xC - (oldX - lastMouseX);
      yC = yC - (oldY - lastMouseY);
      //if (oldX == lastMouseX && oldY == lastMouseY) {
      //  return false;    // if no movement, don't change (?)
      //}
      zoom_trans(lastMouseX, lastMouseY, zoom);                   // effects the translation to xC, yC
    }
  }
  return event.preventDefault() && false;
};

SVGDraw.prototype.onSvgMouseUp = function (event) {
  var self = this;
  return function (event) {
    showMouseStatus('onSvgMouseUp0', event);
    showStatus('onSvgMouseUp0', thisElement);
    if (!svgInProgress) {                       // i.e., if svgInProgress is not false
      return event.preventDefault() && false;
    }
    if (svgInProgress == 'SHIFT') {       // this is also catching mouseUp from bubbles!!!
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      //setElementMouseOverOut(thisElement.parentNode);   // this element is a SHIFT bubble
      clearEditElement(thisGroup);
      //unbindMouseHandlers(self);
    }
    else if (svgInProgress == 'SIZE') {
      // mouseup implies end of position shift or resize
      svgInProgress = false;
      setElementMouseOverOut(thisElement.parentNode);   // this element is a SHIFT bubble
      //clearEditElement(thisElement.parentNode);   // ////////// patch since thisGroup is null
      //unbindMouseHandlers(self);
    }
    else if (cursorMode == 'bubble') {      // /////// all assignments of cursorMode to bubble have been disabled

      svgInProgress = false;
    }
    else if (cursorMode == 'draw') {
      svgInProgress = false;
      unbindMouseHandlers(self);
    }
    else if ((cursorMode == 'cubic') || (cursorMode == 'quadratic')) {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
    }
    else if ((cursorMode == "MOVE") /*&& (svgInProgress == cursorMode)*/) {
      svgInProgress = false;
      unbindMouseHandlers(self);
    }
    else if (cursorMode == 'rect') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'line') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'polygon') {
      if (thisBubble == null) {

      }
      else {
        svgInProgress = false;
        setElementMouseOverOut(thisGroup);
        unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    }
    else if (cursorMode == 'polyline') {
      if (thisBubble == null) {

      }
      else {
        svgInProgress = false;
        setElementMouseOverOut(thisGroup);
        unbindMouseHandlers(self);
        thisBubble = null;
        thisElement = null;
        thisGroup = null;
      }
    }
    else if (cursorMode == 'circle') {
      showStatus('clearEditElement0', thisGroup);
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'ellipse') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      //checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      thisBubble = null;
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == "text") {    // focus on the text entry input since this fails in mouseDown
      document.getElementById('text4svg').focus();
    }
    thisSvg = [];      // and clear the collector
    showMouseStatus('onSvgMouseUp1', event);
    //return event.preventDefault() && false;
    return false;
  };
  //return event.preventDefault() && false;
};

SVGDraw.prototype.doubleClickHandler = function () {
  var self = this;
  //return function () {
  //  if ((cursorMode == 'polygon') || (cursorMode == 'polyline')) {
  //    svgInProgress = false;
  //    switch (cursorMode) {
  //      case 'polygon':
  //        deleteDuplicatePoints(thisElement);
  //        thisGroup.innerHTML = thisGroup.innerHTML.replace('polyline', 'polygon').replace('polyline', 'polygon');
  //        setElementMouseOverOut(thisGroup);
  //        break;
  //      case 'polyline':
  //        deleteDuplicatePoints(thisElement);
  //        setElementMouseOverOut(thisGroup);
  //        break;
  //    }
  //    thisElement = null;
  //    thisGroup = null;
  //    unbindMouseHandlers(self);
  //  }
  //}
  return function () {
    dblClick()
  }
};

function dblClick() {
  if ((cursorMode == 'polygon') || (cursorMode == 'polyline')) {
    svgInProgress = false;
    switch (cursorMode) {
      case 'polygon':
        deleteDuplicatePoints(thisElement);
        thisGroup.innerHTML = thisGroup.innerHTML.replace('polyline', 'polygon').replace('polyline', 'polygon');
        setElementMouseOverOut(thisGroup);
        break;
      case 'polyline':
        deleteDuplicatePoints(thisElement);
        setElementMouseOverOut(thisGroup);
        break;
    }
    thisElement = null;
    thisGroup = null;
    unbindMouseHandlers(self);
  }
}

SVGDraw.prototype.mouseWheelScrollHandler = function () {
  var self = this;
  return function (event) {
    event.stopImmediatePropagation();
    event.stopPropagation();
    var deltaDiv = 1000;                              // default for non-FireFox
    if (event.type == "DOMMouseScroll") {
      deltaDiv = 100
    }   // adjust for FireFox
    //var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
    //lastMouseX = (event.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
    //lastMouseY = (event.originalEvent.clientY - svgOffset.top);
    var delta = -parseInt(event.deltaY || -event.detail);
    lastMouseX = (event.clientX - svgOffset.left);      // fixed reference for mouse offset
    lastMouseY = (event.clientY - svgOffset.top);
    var zoomDelta = delta / deltaDiv;
    //showMouseStatus('Mousescroll', event);
    if (zoomDelta > 0) {
      zoomIn();
    } else {
      zoomOut();
    }
    return event.preventDefault() && false;
  }
}

function deleteDuplicatePoints(element) {
  var thesePoints = element.attributes['points'].value.trim();
  var splitPoints = thesePoints.split(' ');
  thesePoints = splitPoints[0] + ' ';
  for (k = 1; k < splitPoints.length; k++) {
    if (splitPoints[k] != splitPoints[k - 1]) {   // only keep this point
      thesePoints += splitPoints[k] + ' ';        // if it is "new"
    }
  }
  thisElement.attributes['points'].value = thesePoints;
}

SVGDraw.prototype.clear = function () {

  var c = this.canvas[0];
  //this.context.clearRect(0, 0, c.width, c.height);
};

function setCursorMode(mode) {      // detect current mode not completed prior to mode switch
  if (true/*(cursorMode != mode) && (svgInProgress == cursorMode)*/) {        // iff switched mode while in progress
    svgInProgress = false;                                      // //////// does this ^ matter?
    if (thisElement != null) {
      showStatus('setCursorMode0', thisGroup);
      checkLeftoverElement();     // look for dangling element, most likely off of svg image element ( - Y coord)
      clearEditElement(thisGroup);        //  TODO: make sure all cases complete
    }
  }
  if (mode.toUpperCase() == 'MOVE') {
    cursorMode = mode;
  }
  else {
    cursorMode = mode.toLowerCase();
  }
//  eliminated savedCursorMode = 'MOVE';
  waitElement = true;
  indicateMode(mode);
  showStatus('setCursorMode1', thisGroup);
}

function setTextMode() {
  setCursorMode('text');
  document.getElementById("text4svg").removeAttribute('disabled');
  document.getElementById("text4svg").focus();
}

function checkLeftoverElement() {       // this function is only called when svgInProgress is false (?)
  switch (cursorMode) {
    case 'polyline':
    case 'polygon':
      // this seems to ONLY delete the last point, so disabled pending better treatment
//                    var thesePoints = thisElement.attributes['points'].value.trim();
//                    var splitPoints = thesePoints.split(' ');
//                    thesePoints = '';
//                    for (k = 0; k < splitPoints.length - 2; k++) {
//                        thesePoints += splitPoints[k] + ' ';
//                    }
//                    thisElement.attributes['points'].value = thesePoints;
      break;
//                    var thesePoints = thisElement.attributes['points'].value;
//                    var splitPoints = thesePoints.split(' ');
//                    thesePoints = '';
//                    for (k = 0; k < splitPoints.length - 2; k++) {
//                        thesePoints += splitPoints[k] + ' ';
//                    }
//                    thisElement.attributes['points'].value = thesePoints;
//                    break;
    case 'circle':
      if (thisElement == null) return;
      if (((thisElement.attributes['cy'].value - thisElement.attributes['r'].value) < 0)     // off canvas
        || (thisElement.attributes['r'].value < 2))                                  // single click
      {
        clearGroup();       // this was a leftover
      }
      break;
    case 'ellipse':
      if (thisElement == null) return;
      if ((thisElement.attributes['cy'].value - thisElement.attributes['ry'].value) < 0) {
        clearGroup();       // this was a leftover
      }
      break;
    case 'rect':
      if (thisElement == null) return;
      if ((thisElement.attributes['height'].value) < 0) {
        clearGroup();       // this was a leftover
      }
      break;
    case 'line':
      if ((thisElement.attributes['y2'].value) < 0) {
        clearGroup();       // this was a leftover
      }
      break;
  }
}

function clearGroup() {
  var xlt = document.getElementById("xlt");
  if (xlt.childElementCount > 1) {
    xlt.lastChild.remove();
  }
}

function inverseColor(color) {          // color is required to be string as #RRGGBB hexadecimal
  var red = makeHex8(color.slice(1, 3));
  var grn = makeHex8(color.slice(3, 5));
  var blu = makeHex8(color.slice(5, 7));
  return '#' + red + grn + blu;
}

function makeHex8(colorSegment) {       // colorSegment is 8 bit hex encoded string
  var izit = ((parseInt('0X' + colorSegment)) ^ 0xFF).toString(16)
  if (izit.length == 2) {
    return izit;
  }
  return '0' + izit;
}

function zoomIn() {
//            var zoomDelta = 0.05;
  if (zoom < maxZoom) {           // zoom of 1 iz pixel-per-pixel on canvas/svg
    var newZoom = zoom * ( 1.0 + zoomDelta);
    if (newZoom > maxZoom) {
      newZoom = maxZoom;
    }
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(0, 0, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
//                $("#zoom").html("Zoom:" + zoom.toFixed(3));
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoomOut() {
//            var zoomDelta = 0.05;
  if (zoom > baseZoom / 3) {
    var newZoom = zoom / (1.0 + zoomDelta);
    xC = lastMouseX - (lastMouseX - xC) * newZoom / zoom;
    yC = lastMouseY - (lastMouseY - yC) * newZoom / zoom;
    zoom_trans(0, 0, newZoom);
    zoom = newZoom;
    bubbleRadius = (baseBubbleRadius / zoom).toString();
//                $("#zoom").html("Zoom:" + zoom.toFixed(3));
    document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  }
}

function zoom_trans(x, y, factor) {
  var xlt = document.getElementById('xlt');         // DOM svg element g xlt
  var transform = 'translate(' + ((xC)).toString() + ', ' + ((yC)).toString() + ')scale(' + factor.toString() + ')';
  xlt.attributes['transform'].value = transform;
//            $("#zoom").html("Zoom:" + zoom.toFixed(3));
  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
  document.getElementById('coords').innerHTML = 'xC: ' + xC.toFixed(1) + ' xM: ' + x + ' lastX: ' + lastMouseX.toFixed(3)
    + ' yC: ' + yC.toFixed(1) + ' y: ' + y + ' lastY: ' + lastMouseY.toFixed(3);
}

function updateSvgText(event) {
  var text4svg = document.getElementById("text4svg");
  if (thisSvgText == null) {
    return false
  }
  if (event.keyCode == 27) {      // terminate this text block on ESC
    if (thisSvgText.parentElement.lastChild.innerHTML.length == 0) {
      thisSvgText.parentElement.lastChild.remove();
    }
    closeSvgText();
    checkLeftoverElement();
    return false;
  }
  thisSvgText.innerHTML = text4svg.value;
  thisSvgText.attributes['stroke'].value = cursorColor;       // allow in-line whole line color/font/size over-ride
  thisSvgText.attributes['style'].value = 'font-family: ' + textFont + '; fill: ' + cursorColor + ';';    //  including fill
  thisSvgText.attributes['font-size'].value = textHeight;
  var nextX = thisSvgText.attributes['x'].value;
  var nextY = parseInt(thisSvgText.attributes['y'].value) + parseInt(textHeight);
  var nextLine = thisSvgText.cloneNode();
  if (event.keyCode == 13) {      // line feed on ENTER/CR
    var thisInverse = inverseColor(cursorColor);
//                thisSvgText.attributes['onmouseover'] = 'this.attributes["stroke"].value = ' + thisInverse + ';';
    nextLine.attributes['x'].value = nextX;
    nextLine.attributes['y'].value = nextY;
    thisSvgText.parentElement.appendChild(nextLine);
    thisSvgText = nextLine;
    text4svg.value = '';
  }
}

function closeSvgText() {
  var text4svg = document.getElementById("text4svg");
  text4svg.value = '';
  text4svg.setAttribute('disabled', 'true');
  text4svg.blur();
//            thisSvgText.attributes['onmouseover'].value = "this.attributes['stroke'].value = '" + inverseColor(cursorColor)
//                    + "'; this.attributes['fill'].value = '" + inverseColor(cursorColor) + "';";
//            thisSvgText.attributes['onmouseover'].value = "this.attributes['stroke'].value = " + inverseColor(cursorColor) + ";";
//            thisSvgText.attributes['onmouseout'].value = "this.attributes['stroke'].value = " + cursorColor
//                    + "; this.attributes['stroke-width'].value = " + strokeWidth + ";";

  thisSvgText = null;         // remove the target
  thisSvg = [];               // clear the container
  setCursorMode('MOVE');
}

function setCursorColor(color) {
  cursorColor = color;
  document.getElementById('cursorColor').attributes['style'].value = 'background-color: ' + cursorColor;
}

function setUserColor(color) {          // only sets up the color for later selection
  document.getElementById('setUserColor').attributes['style'].value = 'background-color: ' + color;
}

function getUserColor() {
  return document.getElementById('userColor').value;

}

function setMove() {
  cursorMode = "MOVE";
  indicateMode(cursorMode);
}

function indicateMode(mode) {
  var coverRect = mode;
  if (mode == 'rect') {
    coverRect = 'rectangle';        // replace anomalous rect with rectangle
  }
  document.getElementById("mode").textContent = coverRect.toUpperCase();
//            $("#zoom").html("Zoom:" + zoom.toFixed(3));
  document.getElementById('zoom').innerHTML = "Zoom:" + zoom.toFixed(3);
}

