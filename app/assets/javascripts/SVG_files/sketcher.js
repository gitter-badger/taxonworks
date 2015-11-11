function Sketcher(canvasID, brushImage) {
  this.renderFunction = this.updateCanvasByLine;
  this.brush = brushImage;
  this.touchSupported = Modernizr.touch;
  this.canvasID = canvasID;
  //this.canvas = $("#" + canvasID);

  //this.context = this.canvas.get(0).getContext("2d");
  //this.context.strokeStyle = "#000000";
  //this.context.lineWidth = 3;
  this.lastMousePoint = {x: 0, y: 0};

  if (this.touchSupported) {
    this.mouseDownEvent = "touchstart";
    this.mouseMoveEvent = "touchmove";
    this.mouseUpEvent = "touchend";
  }
  else {
    this.mouseDownEvent = "mousedown";
    this.mouseMoveEvent = "mousemove";
    this.mouseUpEvent = "mouseup";

    //this.canvas.bind('dblclick', this.doubleClickHandler());
    $("#" + canvasID).bind('dblclick', this.doubleClickHandler());

    //this.canvas.bind('DOMMouseScroll mousewheel', function (e)     // inline function vs cutout to prototype
    $("#" + canvasID).bind('DOMMouseScroll mousewheel', function (e)     // inline function vs cutout to prototype
    {
      e.stopImmediatePropagation();
      e.stopPropagation();
      var deltaDiv = 1000;                              // default for non-FireFox
      if (e.type == "DOMMouseScroll") {
        deltaDiv = 100
      }   // adjust for FireFox
      var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);
      lastMouseX = (e.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
      lastMouseY = (e.originalEvent.clientY - svgOffset.top);
      var zoomDelta = delta / deltaDiv;
      if (zoomDelta > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
      return e.preventDefault() && false;
    });
  }
  //this.canvas.bind(this.mouseDownEvent, this.onCanvasMouseDown());
  $("#" + canvasID).bind(this.mouseDownEvent, this.onCanvasMouseDown());
}

Sketcher.prototype.onCanvasMouseDown = function () {    // in general, start or stop element generation on mouseDOWN
  // BUT for PATH, LINE and MOVE, stop on mouseUP
  var self = this;
  return function (event) {
    //self.context.save();
    self.mouseMoveHandler = self.onCanvasMouseMove();
    self.mouseUpHandler = self.onCanvasMouseUp();
    $(document).bind(self.mouseMoveEvent, self.mouseMoveHandler);       // binding on mouse OOWN
    $(document).bind(self.mouseUpEvent, self.mouseUpHandler);

    self.updateMousePosition(event);
    //self.renderFunction(event);            // ??
    if (svgInProgress != false && svgInProgress != cursorMode) {    // terminate in progress svg before continuing
      svgInProgress = cursorMode;       //  ??
      return;                                                       // TODO: fix this to actualy do something
    }
    if (cursorMode == "TEXT") {
      thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
      group.setAttributeNS(null, 'id', newGroupID);
      document.getElementById("xlt").appendChild(group);
      //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
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
    if (cursorMode == 'RECTANGLE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element = createElement('rect');

          group.appendChild(element);
          thisRectangle = group.children[0];
          element.setAttributeNS(null, 'x', thisSvg[0][0]);      // start x
          element.setAttributeNS(null, 'y', thisSvg[0][1]);      // start y
          element.setAttributeNS(null, 'width', 1);      // width x
          element.setAttributeNS(null, 'height', 1);      // height y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisRectangle);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'CIRCLE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element = createElement('circle');

          group.appendChild(element);
          thisCircle = group.children[0];     // this var is used to dynamically create the element
          element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
          element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
          element.setAttributeNS(null, 'r', 1);      // width x
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setCircleMouseoverOut(thisCircle);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'ELLIPSE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
          var element = createElement('ellipse');

          group.appendChild(element);
          thisEllipse = group.children[0];
          element.setAttributeNS(null, 'cx', thisSvg[0][0]);      // start x
          element.setAttributeNS(null, 'cy', thisSvg[0][1]);      // start y
          element.setAttributeNS(null, 'rx', 1);      // radius x
          element.setAttributeNS(null, 'ry', 1);      // radius y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisEllipse);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'LINE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
          var element = createElement('line');

          group.appendChild(element);
          thisLine = group.children[0];
          element.setAttributeNS(null, 'x1', thisSvg[0][0]);      // start x
          element.setAttributeNS(null, 'y1', thisSvg[0][1]);      // start y
          element.setAttributeNS(null, 'x2', thisSvg[0][0]);      // end x
          element.setAttributeNS(null, 'y2', thisSvg[0][1]);      // end y
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        setMouseoverOut(thisLine);
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'DRAW') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
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
    if (cursorMode == 'POLYLINE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element = createElement('polyline');

          group.appendChild(element);
          thisPolyline = group.children[0];
          element.setAttributeNS(null, 'stroke-linecap', 'round');
          element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
            + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
            + thisSvg[0][0].toFixed(2).toString()
            + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        //self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisPolyline.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisPolyline.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'POLYGON') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element = createElement('polygon');

          group.appendChild(element);
          thisPolygon = group.children[0];
          element.setAttributeNS(null, 'points', thisSvg[0][0].toFixed(2).toString()
            + ',' + thisSvg[0][1].toFixed(2).toString() + ' '
            + thisSvg[0][0].toFixed(2).toString()
            + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y
        //}
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        //self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisPolygon.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisPolygon.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
  }
};

function createElementWithMO(type) {
  var element = createElement(type);
  element = setMouseoverOut(element);
  return element;
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

function setCircleMouseoverOut(element) {
  element.setAttributeNS(null, 'onmouseover', "this.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this);");
  element.setAttributeNS(null, 'onmouseout', "this.attributes['stroke-width'].value = " + strokeWidth + ";");

  return element;
}

function setEditElement(element) {    // add bubble elements to the group containing this element
  var group = element.parentNode;
  if (element.tagName == 'circle') {
    createBubble(element, group, 'BLOCK');
    createBubble(element, group, 'POINT');
  }
  //element.parentNode
}

function createBubble(element, group, type) {    // element is the co-habitant of the group; type is block or point drag
  var cX = element.attributes['cx'].value;
  var cY = element.attributes['cy'].value;
  var cR = element.attributes['r'].value;
  var bubble = createBubbleStub(cX, cY, element, group);
  if (type == 'BLOCK') {    // get appropriate point to translate entire element
    bubble.setAttributeNS(null, 'fill-opacity', '0.7');
  }
  if (type == 'POINT') {    // generate indexed points for this element
    bubble = createBubbleStub(cR + cX, cY, element, group);
    bubble.setAttributeNS(null, 'fill-opacity', '0.4');
    bubble = createBubbleStub(cX, cR + cY, element, group);
    bubble.setAttributeNS(null, 'fill-opacity', '0.4');
    bubble = createBubbleStub(cX-cR, cY, element, group);
    bubble.setAttributeNS(null, 'fill-opacity', '0.4');
    bubble = createBubbleStub(cX, cY-cR, element, group);
    bubble.setAttributeNS(null, 'fill-opacity', '0.4');
  }
}

function createBubbleStub(offsetX, offsetY, element, group) {   // create same-size bubble
  var bubble = createElement('CIRCLE')
  group.appendChild(bubble);
 //thisCircle = group.children[0];     // this var is used to dynamically create the element
  bubble.setAttributeNS(null, 'cx', offsetX);      // start x
  bubble.setAttributeNS(null, 'cy', offsetY);      // start y
  bubble.setAttributeNS(null, 'r', 10);      // width x
  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  return bubble;
}
function unbindMouseHandlers(self) {
  $(document).unbind(self.mouseMoveEvent, self.mouseMoveHandler);   // unbinding on mouse UP
  $(document).unbind(self.mouseUpEvent, self.mouseUpHandler);
// kill the linkage to the handler
  self.mouseMoveHandler = null;
  self.mouseUpHandler = null;
}


Sketcher.prototype.onCanvasMouseMove = function () {
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

Sketcher.prototype.updateMousePosition = function (event) {
  var target;
  if (this.touchSupported) {
    target = event.originalEvent.touches[0]
  }
  else {
    target = event;
  }

  var offset = svgOffset;    //  was this.canvas.offset();
  this.lastMousePoint.x = target.pageX - offset.left;
  this.lastMousePoint.y = target.pageY - offset.top;
  lastMouseX = this.lastMousePoint.x;
  lastMouseY = this.lastMousePoint.y;
};

Sketcher.prototype.updateCanvasByLine = function (event) {
  if (cursorMode != "MOVE") {          // modified for move/draw mode JRF
    if (cursorMode == "DRAW") {
      //this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisDraw.attributes['points'].value;
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
      thisDraw.attributes['points'].value = thesePoints.concat(thisPoint);
    }
    else if (cursorMode == "POLYLINE") {
      if (svgInProgress == false) {return;}
      //this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisPolyline.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      thesePoints = '';
      for (k=0; k<splitPoints.length - 2; k++) {thesePoints += splitPoints[k] + ' ';}
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
      thisPolyline.attributes['points'].value = thesePoints.concat(thisPoint);
      thisPolyline.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "POLYGON") {
      if (svgInProgress == false) {return;}
      //this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisPolygon.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      thesePoints = '';
      for (k=0; k<splitPoints.length - 2; k++) {thesePoints += splitPoints[k] + ' ';}
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
      thisPolygon.attributes['points'].value = thesePoints.concat(thisPoint);
      thisPolygon.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "CIRCLE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      var thisCircX = thisCircle.attributes['cx'].value;
      var thisCircY = thisCircle.attributes['cy'].value;

      //this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
      thisCircle.attributes['r'].value = radius;
      thisCircle.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "ELLIPSE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      var thisEllipseX = thisEllipse.attributes['cx'].value;
      var thisEllipseY = thisEllipse.attributes['cy'].value;

      //this.context.moveTo(lastMouseX + thisCircX * zoom, lastMouseY + thisCircY * zoom);
      //this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      //var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
      thisEllipse.attributes['rx'].value = Math.abs(thisEllipseX - (lastMouseX - xC) / zoom);
      thisEllipse.attributes['ry'].value = Math.abs(thisEllipseY - (lastMouseY - yC) / zoom);
      thisEllipse.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "LINE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {    // extra condition for LINE
        return;
      }
      var thisLineX1 = thisLine.attributes['x1'].value;
      var thisLineY1 = thisLine.attributes['y1'].value;

      //this.context.moveTo(lastMouseX /*+ thisLineX2 * zoom*/, lastMouseY/* + thisLineY2 * zoom*/);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      thisLine.attributes['x2'].value = (lastMouseX - xC) / zoom;  //;
      thisLine.attributes['y2'].value = (lastMouseY - yC) / zoom;  //- thisLineY2;
      thisLine.attributes['stroke'] = cursorColor;
    }
    else if (cursorMode == "TEXT") {

    }
    else if (cursorMode == "RECTANGLE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if ((event.type == 'mousedown') || (svgInProgress == false)) {
        return;
      }
      var thisRectX = thisRectangle.attributes['x'].value;
      var thisRectY = thisRectangle.attributes['y'].value;
      var thisRectW = thisRectangle.attributes['width'].value;
      var thisRectH = thisRectangle.attributes['height'].value;

      //this.context.moveTo(lastMouseX + thisRectH * zoom, lastMouseY + thisRectW * zoom);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      thisRectangle.attributes['width'].value = (lastMouseX - xC) / zoom - thisRectX;
      thisRectangle.attributes['height'].value = (lastMouseY - yC) / zoom - thisRectY;
      thisRectangle.attributes['stroke'] = cursorColor;
    }
  }
  else {    // Revert to MOVE: this version assumes manipulating the left and top attributes of the canvas (?)
    var oldX = this.lastMousePoint.x;
    var oldY = this.lastMousePoint.y;
    this.updateMousePosition(event);
    lastMouseX = this.lastMousePoint.x;
    lastMouseY = this.lastMousePoint.y;
    xC = xC - (oldX - lastMouseX);
    yC = yC - (oldY - lastMouseY);
    if (oldX == lastMouseX && oldY == lastMouseY) {
      return false;    // if no mvement, don't change (?)
    }
    zoom_trans(lastMouseX, lastMouseY, zoom);                   // effects the translation to xC, yC
  }
};

Sketcher.prototype.onCanvasMouseUp = function (event) {
  var self = this;
  return function (event) {
    if ((cursorMode == "MOVE") || (svgInProgress == false)) {unbindMouseHandlers(self);}
    else if (cursorMode == 'DRAW') {
      svgInProgress = false;
      unbindMouseHandlers(self);
    }
    else if (cursorMode == 'POLYLINE') {

      //svgInProgress = false;
      //unbindMouseHandlers(self);
    }
    else if (cursorMode == "TEXT") {    // focus on the text entry input since this fails in mouseDown
      document.getElementById('text4svg').focus();
    }
    thisSvg = [];      // and clear the collector
    //setMove();      // AFTER checking cursorMode, revert to MOVE // now leave cursor mode until MOVE set
  }
};

Sketcher.prototype.doubleClickHandler = function () {
  var self = this;
  return function(event) {
    if ((cursorMode ==  'POLYGON') || (cursorMode ==  'POLYLINE')) {
      svgInProgress = false;
      switch (cursorMode) {
        case 'POLYGON':
          setMouseoverOut(thisPolygon);
          break;
        case 'POLYLINE':
          setMouseoverOut(thisPolyline);
          break;
      }
      unbindMouseHandlers(self);
    }
  }
}

Sketcher.prototype.clear = function () {

  var c = this.canvas[0];
  //this.context.clearRect(0, 0, c.width, c.height);
};