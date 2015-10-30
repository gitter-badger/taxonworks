function Sketcher( canvasID, brushImage ) {
  this.renderFunction = (brushImage == null || brushImage == undefined) ? this.updateCanvasByLine : this.updateCanvasByBrush;
  this.brush = brushImage;
  this.touchSupported = Modernizr.touch;
  this.canvasID = canvasID;
  this.canvas = $("#"+canvasID);
  this.context = this.canvas.get(0).getContext("2d");
  this.context.strokeStyle = "#000000";
  this.context.lineWidth = 3;
  this.lastMousePoint = {x:0, y:0};

  if (this.touchSupported) {
    this.mouseDownEvent = "touchstart";
    this.mouseMoveEvent = "touchmove";
    this.mouseUpEvent = "touchend";
  }
  else {
    this.mouseDownEvent = "mousedown";
    this.mouseMoveEvent = "mousemove";
    this.mouseUpEvent = "mouseup";

    this.canvas.bind('DOMMouseScroll mousewheel', function(e)     // inline function vs cutout to prototype
    {
      e.stopImmediatePropagation();
      e.stopPropagation();
      var deltaDiv = 1000;                              // default for non-FireFox
     if (e.type == "DOMMouseScroll") {deltaDiv = 100}   // adjust for FireFox
      var delta = parseInt(e.originalEvent.wheelDelta || -e.originalEvent.detail);
      zoom += delta / deltaDiv;
      var zoomX = e.originalEvent.clientX - this.offsetLeft;
      var zoomY = e.originalEvent.clientY - this.offsetTop;
      //zoom_trans(zoomX, zoomY, zoom);
      zoom_trans(null, null, zoom);
      setMove();
      return e.preventDefault() && false;
    });
  }

  this.canvas.bind( this.mouseDownEvent, this.onCanvasMouseDown() );
}

Sketcher.prototype.onCanvasMouseDown = function () {
  var self = this;
  return function(event) {
    //self.context.save();

    self.mouseMoveHandler = self.onCanvasMouseMove();
    self.mouseUpHandler = self.onCanvasMouseUp();

    $(document).bind( self.mouseMoveEvent, self.mouseMoveHandler );
    $(document).bind( self.mouseUpEvent, self.mouseUpHandler );

    self.updateMousePosition( event );
    self.renderFunction( event );
    if (cursorMode == "TEXT") {
      thisSvg.push([(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom]);
      var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttributeNS(null, 'id', 'g' + svg.length.toString());
      svg.push(group);    // insert container group
      document.getElementById("xlt").appendChild(group);
      var element;
      for (j = 0; j < thisSvg.length; j++) {
        element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        //document.getElementById(group.id).appendChild(element);
        group.appendChild(element);
        thisSvgText = group.children[0];
        element.setAttributeNS(null, 'stroke', cursorColor);
        element.setAttributeNS(null, 'stroke-width', '1');
        element.setAttributeNS(null, 'stroke-opacity', '1.0');
        element.setAttributeNS(null, 'x', thisSvg[j][0]);      // start x
        element.setAttributeNS(null, 'y', thisSvg[j][1]);      // start y
        element.setAttributeNS(null, 'style', 'font-family: Verdana; fill: ' + cursorColor.toString() + ';');
        element.setAttributeNS(null, 'font-size', 100);
        document.getElementById('text4svg').focus();
      }
      }
    }
};

Sketcher.prototype.onCanvasMouseMove = function () {
  var self = this;
  return function(event) {

    self.renderFunction( event );
    event.preventDefault();
    return false;
  }
};

var Trig = {
  distanceBetween2Points: function ( point1, point2 ) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );
  },

  angleBetween2Points: function ( point1, point2 ) {

    var dx = point2.x - point1.x;
    var dy = point2.y - point1.y;
    return Math.atan2( dx, dy );
  }
};

Sketcher.prototype.onCanvasMouseUp = function (event) {
  var self = this;
  return function(event) {

    $(document).unbind( self.mouseMoveEvent, self.mouseMoveHandler );
    $(document).unbind( self.mouseUpEvent, self.mouseUpHandler );

    self.mouseMoveHandler = null;
    self.mouseUpHandler = null;
    //self.context.restore();
    if (cursorMode == "PATH") {
      if (thisSvg != undefined) {
        if (thisSvg.length > 0) {
          var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          group.setAttributeNS(null, 'id', 'g' + svg.length.toString());
        svg.push(group);    // insert container group
          document.getElementById("xlt").appendChild(group);
          var element;
          for (j = 0; j < thisSvg.length; j++) {

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
        };
      }
    } else if (cursorMode == "TEXT") {
      //var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      //group.setAttributeNS(null, 'id', 'g' + svg.length.toString());
      //svg.push(group);    // insert container group
      //document.getElementById("xlt").appendChild(group);
      //var element;
      //for (j = 0; j < thisSvg.length; j++) {
      //
      //  element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      //  //document.getElementById(group.id).appendChild(element);
      //  group.appendChild(element);
      //  thisSvgText = group.children[0];
      //  element.setAttributeNS(null, 'stroke', cursorColor);
      //  element.setAttributeNS(null, 'stroke-width', '1');
      //  element.setAttributeNS(null, 'stroke-opacity', '1.0');
      //  element.setAttributeNS(null, 'x', thisSvg[j][0]);      // start x
      //  element.setAttributeNS(null, 'y', thisSvg[j][1]);      // start y
      //  element.setAttributeNS(null, 'style', 'font-family: Verdana; fill: ' + cursorColor.toString() + ';');
      //  element.setAttributeNS(null, 'font-size', 100);
        document.getElementById('text4svg').focus();
      //}
      //
    }
    thisSvg = [];      // and clear the collector
    //setMove();      // AFTER checking cursorMode, revert to MOVE // now leave cursor mode until MOVE set
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

};

Sketcher.prototype.updateCanvasByLine = function (event) {
  if(cursorMode != "MOVE") {          // modified for move/draw mode JRF
    ////////////////////
    //
    //  DRAW mode needs to be expanded to Circle, Rectangle, Text, Line, PolyLine, Marker(?)
    //  mouseDown/Up will need to articulate for above shapes also
    //
    ////////////////////
    if (cursorMode == "PATH") {
      this.context.beginPath();        // interdigitate canvas draw and record svg
      var thisX = this.lastMousePoint.x;
      var thisY = this.lastMousePoint.y;
      this.context.moveTo(thisX, thisY);
//  this still needs scaling to original image extent
      thisSvg.push([(thisX - xC) / zoom, (thisY - yC) / zoom]);
      this.updateMousePosition(event);
      var thisX = this.lastMousePoint.x;
      var thisY = this.lastMousePoint.y;
      this.context.lineTo(thisX, thisY);
      thisSvg.push([(thisX - xC) / zoom, (thisY - yC) / zoom]);
      this.context.strokeStyle = "#0066FF";
      this.context.stroke();
    } else if (cursorMode == "POLYGON") {
      //need aditional articulation of mouseDown/Up/Click to begin/end each segment of polygon
    } else if (cursorMode == "CIRCLE") {

    } else if (cursorMode == "LINE") {

    } else if (cursorMode == "TEXT") {

    }
  }
  else {    // this version assumes manipulating the left and top attributes of the canvas (?)
    var oldX = this.lastMousePoint.x;
    var oldY = this.lastMousePoint.y;
    this.updateMousePosition(event);
    xC = xC - (oldX - this.lastMousePoint.x);
    yC = yC - (oldY - this.lastMousePoint.y);
    var newX = this.lastMousePoint.x;
    var newY = this.lastMousePoint.y;
    if (oldX == newX && oldY == newY) return false;
    zoom_trans(null, null, zoom);
  }
};

Sketcher.prototype.updateCanvasByBrush = function (event) {
  var halfBrushW = this.brush.width/2;
  var halfBrushH = this.brush.height/2;

  var start = { x:this.lastMousePoint.x, y: this.lastMousePoint.y };
  this.updateMousePosition( event );
  var end = { x:this.lastMousePoint.x, y: this.lastMousePoint.y };

  var distance = parseInt( Trig.distanceBetween2Points( start, end ) );
  var angle = Trig.angleBetween2Points( start, end );

  var x,y;

  for ( var z=0; (z<=distance || z==0); z++ )
  {
    x = start.x + (Math.sin(angle) * z) - halfBrushW;
    y = start.y + (Math.cos(angle) * z) - halfBrushH;
    //console.log( x, y, angle, z );
    this.context.drawImage(this.brush, x, y);
  }
};

//Sketcher.prototype.toString = function () {
//
//  var dataString = this.canvas.get(0).toDataURL("image/png");
//  var index = dataString.indexOf( "," )+1;
//  dataString = dataString.substring( index );
//
//  return dataString;
//};
//
//Sketcher.prototype.toDataURL = function () {
//
//  var dataString = this.canvas.get(0).toDataURL("image/png");
//  return dataString;
//};

Sketcher.prototype.clear = function () {

  var c = this.canvas[0];
  this.context.clearRect( 0, 0, c.width, c.height );
};