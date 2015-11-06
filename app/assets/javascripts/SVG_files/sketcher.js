function Sketcher(canvasID, brushImage) {
  this.renderFunction = (brushImage == null || brushImage == undefined) ? this.updateCanvasByLine : this.updateCanvasByBrush;
  this.brush = brushImage;
  this.touchSupported = Modernizr.touch;
  this.canvasID = canvasID;
  this.canvas = $("#" + canvasID);
  this.context = this.canvas.get(0).getContext("2d");
  this.context.strokeStyle = "#000000";
  this.context.lineWidth = 3;
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

    this.canvas.bind('dblclick', this.doubleClickHandler());

    this.canvas.bind('DOMMouseScroll mousewheel', function (e)     // inline function vs cutout to prototype
    {
      e.stopImmediatePropagation();
      e.stopPropagation();
      var deltaDiv = 1000;                              // default for non-FireFox
      if (e.type == "DOMMouseScroll") {
        deltaDiv = 100
      }   // adjust for FireFox
      var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);
      lastMouseX = (e.originalEvent.clientX - 50);      /////////////// TODO: fix reference for mouse offset
      lastMouseY = (e.originalEvent.clientY - 175);
      var zoomDelta = delta / deltaDiv;
      if (zoomDelta > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
      return e.preventDefault() && false;
    });
  }
  //this.canvas.bind(this.click, function () {
  //  if (cursorMode == "TEXT") {
  //    thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
  //    var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  //    group.setAttributeNS(null, 'id', 'g' + svg.length.toString());
  //    svg.push(group);    // insert container group
  //    document.getElementById("xlt").appendChild(group);
  //    var element;
  //    for (j = 0; j < thisSvg.length; j++) {
  //      element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  //      //document.getElementById(group.id).appendChild(element);
  //      group.appendChild(element);
  //      thisSvgText = group.children[0];
  //      element.setAttributeNS(null, 'stroke', cursorColor);
  //      element.setAttributeNS(null, 'stroke-width', '1');
  //      element.setAttributeNS(null, 'stroke-opacity', '1.0');
  //      element.setAttributeNS(null, 'x', thisSvg[j][0]);      // start x
  //      element.setAttributeNS(null, 'y', thisSvg[j][1]);      // start y
  //      element.setAttributeNS(null, 'style', 'font-family: Verdana; fill: ' + cursorColor.toString() + ';');
  //      element.setAttributeNS(null, 'font-size', 100);
  //      document.getElementById('text4svg').focus();
  //    }
  //  }
  //});

  this.canvas.bind(this.mouseDownEvent, this.onCanvasMouseDown());
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
      thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
      group.setAttributeNS(null, 'id', nextGroupID);
      document.getElementById("xlt").appendChild(group);
      for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
        var element;
        element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        //document.getElementById(group.id).appendChild(element);
        group.appendChild(element);
        thisSvgText = group.children[0];
        element.setAttributeNS(null, 'stroke', cursorColor);
        element.setAttributeNS(null, 'stroke-width', '1');
        element.setAttributeNS(null, 'stroke-opacity', '1.0');
        element.setAttributeNS(null, 'x', thisSvg[j][0]);      // start x
        element.setAttributeNS(null, 'y', thisSvg[j][1]);      // start y
        element.setAttributeNS(null, 'style', 'font-family: ' + textFont + '; fill: ' + cursorColor.toString() + ';');
        element.setAttributeNS(null, 'font-size', textHeight);
      }
    }
    if (cursorMode == 'RECT') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisRect = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'fill', '');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'x', thisSvg[j][0]);      // start x
          element.setAttributeNS(null, 'y', thisSvg[j][1]);      // start y
          element.setAttributeNS(null, 'width', 1);      // width x
          element.setAttributeNS(null, 'height', 1);      // height y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'CIRCLE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisCirc = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'fill', '');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'cx', thisSvg[j][0]);      // start x
          element.setAttributeNS(null, 'cy', thisSvg[j][1]);      // start y
          element.setAttributeNS(null, 'r', 1);      // width x
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'ELLIPSE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisEllipse = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'fill', '');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'cx', thisSvg[j][0]);      // start x
          element.setAttributeNS(null, 'cy', thisSvg[j][1]);      // start y
          element.setAttributeNS(null, 'rx', 1);      // radius x
          element.setAttributeNS(null, 'ry', 1);      // radius y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'LINE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisLine = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'stroke-linecap', 'round');
          element.setAttributeNS(null, 'x1', thisSvg[j][0]);      // start x
          element.setAttributeNS(null, 'y1', thisSvg[j][1]);      // start y
          element.setAttributeNS(null, 'x2', thisSvg[j][0]);      // end x
          element.setAttributeNS(null, 'y2', thisSvg[j][1]);      // end y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'DRAW') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisDraw = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'stroke-linecap', 'round');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'points', thisSvg[j][0].toFixed(2).toString()
            + ',' + thisSvg[j][1].toFixed(2).toString() + ' ');      // start x,y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the terminus of this instance, so dissociate mouse move handler
        svgInProgress = false;
        unbindMouseHandlers(self);
      }
    }
    if (cursorMode == 'POLYLINE') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisPolyline = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'stroke-linecap', 'round');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'points', thisSvg[j][0].toFixed(2).toString()
            + ',' + thisSvg[j][1].toFixed(2).toString() + ' '
            + thisSvg[j][0].toFixed(2).toString()
            + ',' + thisSvg[j][1].toFixed(2).toString() + ' ');      // start x,y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisPolyline.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' '
        thisPolyline.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'POLYGON') {
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', nextGroupID);
        document.getElementById("xlt").appendChild(group);
        for (j = 0; j < thisSvg.length; j++) {              // for TEXT mode there is only one
          var element;
          element = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          //document.getElementById(group.id).appendChild(element);
          group.appendChild(element);
          thisPolygon = group.children[0];
          element.setAttributeNS(null, 'stroke', cursorColor);
          element.setAttributeNS(null, 'stroke-width', '10');
          element.setAttributeNS(null, 'stroke-opacity', '0.9');
          element.setAttributeNS(null, 'stroke-linecap', 'round');
          element.setAttributeNS(null, 'fill-opacity', '0.0');
          element.setAttributeNS(null, 'points', thisSvg[j][0].toFixed(2).toString()
            + ',' + thisSvg[j][1].toFixed(2).toString() + ' '
            + thisSvg[j][0].toFixed(2).toString()
            + ',' + thisSvg[j][1].toFixed(2).toString() + ' ');      // start x,y
        }
        svgInProgress = cursorMode;     // mark in progress
      }
      else {      // this is the fixation of this last point, so DON'T dissociate mouse move handler
        self.context.moveTo(lastMouseX, lastMouseY);
        self.updateMousePosition(event);
        //lastMouseX = this.lastMousePoint.x;
        //lastMouseY = this.lastMousePoint.y;
        var thesePoints = thisPolygon.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' '
        thisPolygon.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
  }
};

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

  var offset = this.canvas.offset();
  this.lastMousePoint.x = target.pageX - offset.left;
  this.lastMousePoint.y = target.pageY - offset.top;
  lastMouseX = this.lastMousePoint.x;
  lastMouseY = this.lastMousePoint.y;
};

Sketcher.prototype.updateCanvasByLine = function (event) {
  if (cursorMode != "MOVE") {          // modified for move/draw mode JRF
    ////////////////////
    //
    //  DRAW mode needs to be expanded to Circle, Rectangle, Text, Line, PolyLine, Marker(?)
    //  mouseDown/Up will need to articulate for above shapes also
    //
    ////////////////////
    if (cursorMode == "PATH") {
      this.context.beginPath();        // interdigitate canvas draw and record svg
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      this.context.moveTo(lastMouseX, lastMouseY);
      thisSvg.push([(lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom]);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      this.context.lineTo(lastMouseX, lastMouseY);
      thisSvg.push([(lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom]);
      this.context.strokeStyle = "#0066FF";
      this.context.stroke();
    }
    else if (cursorMode == "DRAW") {
      this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisDraw.attributes['points'].value;
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' '
      thisDraw.attributes['points'].value = thesePoints.concat(thisPoint);
    }
    else if (cursorMode == "POLYLINE") {
      if (svgInProgress == false) {return;}
      this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisPolyline.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      thesePoints = '';
      for (k=0; k<splitPoints.length - 2; k++) {thesePoints += splitPoints[k] + ' ';}
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' '
      thisPolyline.attributes['points'].value = thesePoints.concat(thisPoint);
      thisPolyline.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "POLYGON") {
      if (svgInProgress == false) {return;}
      this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var thesePoints = thisPolygon.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      thesePoints = '';
      for (k=0; k<splitPoints.length - 2; k++) {thesePoints += splitPoints[k] + ' ';}
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' '
      thisPolygon.attributes['points'].value = thesePoints.concat(thisPoint);
      thisPolygon.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "CIRCLE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if (event.type == 'mousedown') {
        return;
      }
      var thisCircX = thisCirc.attributes['cx'].value;
      var thisCircY = thisCirc.attributes['cy'].value;

      //this.context.moveTo(lastMouseX + thisCircX * zoom, lastMouseY + thisCircY * zoom);
      this.context.moveTo(lastMouseX, lastMouseY);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      var radius = length2points(thisCircX, thisCircY, (lastMouseX - xC) / zoom, (lastMouseY - yC) / zoom);
      thisCirc.attributes['r'].value = radius;
      thisCirc.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "ELLIPSE") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if (event.type == 'mousedown') {
        return;
      }
      var thisEllipseX = thisEllipse.attributes['cx'].value;
      var thisEllipseY = thisEllipse.attributes['cy'].value;

      //this.context.moveTo(lastMouseX + thisCircX * zoom, lastMouseY + thisCircY * zoom);
      this.context.moveTo(lastMouseX, lastMouseY);
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
      if (event.type == 'mousedown') {
        return;
      }
      var thisLineX1 = thisLine.attributes['x1'].value;
      var thisLineY1 = thisLine.attributes['y1'].value;

      this.context.moveTo(lastMouseX /*+ thisLineX2 * zoom*/, lastMouseY/* + thisLineY2 * zoom*/);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      thisLine.attributes['x2'].value = (lastMouseX - xC) / zoom;  //;
      thisLine.attributes['y2'].value = (lastMouseY - yC) / zoom;  //- thisLineY2;
    }
    else if (cursorMode == "TEXT") {

    }
    else if (cursorMode == "RECT") {
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      if (event.type == 'mousedown') {
        return;
      }
      var thisRectX = thisRect.attributes['x'].value;
      var thisRectY = thisRect.attributes['y'].value;
      var thisRectW = thisRect.attributes['width'].value;
      var thisRectH = thisRect.attributes['height'].value;

      this.context.moveTo(lastMouseX + thisRectH * zoom, lastMouseY + thisRectW * zoom);
      this.updateMousePosition(event);
      lastMouseX = this.lastMousePoint.x;
      lastMouseY = this.lastMousePoint.y;
      thisRect.attributes['width'].value = (lastMouseX - xC) / zoom - thisRectX;
      thisRect.attributes['height'].value = (lastMouseY - yC) / zoom - thisRectY;
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

Sketcher.prototype.updateCanvasByBrush = function (event) {
  var halfBrushW = this.brush.width / 2;
  var halfBrushH = this.brush.height / 2;

  var start = {x: this.lastMousePoint.x, y: this.lastMousePoint.y};
  this.updateMousePosition(event);
  var end = {x: this.lastMousePoint.x, y: this.lastMousePoint.y};

  var distance = parseInt(Trig.distanceBetween2Points(start, end));
  var angle = Trig.angleBetween2Points(start, end);

  var x, y;

  for (var z = 0; (z <= distance || z == 0); z++) {
    x = start.x + (Math.sin(angle) * z) - halfBrushW;
    y = start.y + (Math.cos(angle) * z) - halfBrushH;
    //console.log( x, y, angle, z );
    this.context.drawImage(this.brush, x, y);
  }
};

Sketcher.prototype.onCanvasMouseUp = function (event) {
  var self = this;
  return function (event) {
////// unbind mouse handlers for move and up
//    if ( svgInProgress == false || cursorMode == 'MOVE') {
//      $(document).unbind(self.mouseMoveEvent, self.mouseMoveHandler);   // unbinding on mouse UP
//      $(document).unbind(self.mouseUpEvent, self.mouseUpHandler);
////// kill the linkage to the handler
//      self.mouseMoveHandler = null;
//      self.mouseUpHandler = null;
//    }
    //self.context.restore();
    if ((cursorMode == "MOVE") || (svgInProgress == false)) {unbindMouseHandlers(self);}
    if (cursorMode == "PATH") {
      if (thisSvg != undefined) {
        unbindMouseHandlers(self);
        if (thisSvg.length > 0) {   // thisSvg was collected through updateCanvasByLine
          var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          var nextGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
          group.setAttributeNS(null, 'id', nextGroupID);
          //svg.push(group);    // insert container group
          document.getElementById("xlt").appendChild(group);
          var element;                              //
          for (j = 0; j < thisSvg.length; j++) {    // make "orthodox" line entroes for this group

            element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            document.getElementById(group.id).appendChild(element);
            element.setAttributeNS(null, 'stroke', cursorColor);
            element.setAttributeNS(null, 'stroke-width', '10');
            element.setAttributeNS(null, 'stroke-opacity', '1.0');
            element.setAttributeNS(null, 'stroke-linecap', 'round');
            element.setAttributeNS(null, 'x1', thisSvg[j][0]);      // start x
            element.setAttributeNS(null, 'y1', thisSvg[j][1]);      // start y
            j += 1;
            element.setAttributeNS(null, 'x2', thisSvg[j][0]);      // end x
            element.setAttributeNS(null, 'y2', thisSvg[j][1]);      // end y
          }
          sketcher.clear();       // do not change any cursor-related values
        }
        ;
      }
    }
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
      unbindMouseHandlers(self);
    }
  }
}

Sketcher.prototype.clear = function () {

  var c = this.canvas[0];
  this.context.clearRect(0, 0, c.width, c.height);
};