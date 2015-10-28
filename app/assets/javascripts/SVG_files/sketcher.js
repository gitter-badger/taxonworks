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
    this.mouseWheelEvent = "handleScroll";
  }

  this.canvas.bind( this.mouseDownEvent, this.onCanvasMouseDown() );
}
Sketcher.prototype.handleScroll = function(e)
{
  var delta = e.wheelDelta ? e.wheelDelta/100 : e.detail ? -e.detail/6 : 0;
  if (delta)
    zoom(null, null, delta);
  return e.preventDefault() && false;
};
//this.canvas.addEventListener('DOMMouseScroll',handleScroll,false);  // not sure I want scroll
//this.canvas.addEventListener('mousewheel',handleScroll,false);

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
    if (cursorMode == "DRAW") {
      if (thisSvg != undefined) {
        if (thisSvg.length > 0) {
        svg.push(thisSvg);    // save this graphic item for replot
          var element;
          for (j = 0; j < thisSvg.length; j++) {

            element = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            element.setAttributeNS(null, 'stroke', 'red');
            element.setAttributeNS(null, 'stroke-width', '3');
            element.setAttributeNS(null, 'stroke-opacity', '0.5');
            element.setAttributeNS(null, 'stroke-linecap', 'round');
            //svgLayer.appendChild(element);
            document.getElementById("xlt").appendChild(element);
            element.setAttributeNS(null, 'x1', thisSvg[j][0]);      // start x
            element.setAttributeNS(null, 'y1', thisSvg[j][1]);      // start y
            j += 1;
            element.setAttributeNS(null, 'x2', thisSvg[j][0]);      // end x
            element.setAttributeNS(null, 'y2', thisSvg[j][1]);      // end y
          }
          sketcher.clear();       // do not change any cursor-related values
        };
      }
    }
    thisSvg = [];      // and clear the collector
    //setMove();      // AFTER checking cursorMode, revert to MOVE
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
  if(cursorMode == "DRAW") {          // modified for move/draw mode JRF
    ////////////////////
    //
    //  DRAW mode needs to be expanded to Circle, Rectangle, Text, Line, PolyLine, Marker(?)
    //  mouseDown/Up will need to articulate for above shapes also
    //
    ////////////////////
    if (drawMode == "PATH") {
      this.context.beginPath();        // interdigitate canvas draw and record svg
      var thisX = this.lastMousePoint.x;
      var thisY = this.lastMousePoint.y;
      this.context.moveTo(thisX, thisY);
      //thisSvg += '<line stroke="red" x1="' + this.lastMousePoint.x + '" y1="' + this.lastMousePoint.y + '" ';
      thisSvg.push([(thisX - xC) / Math.pow(2, zoom), (thisY - yC) / Math.pow(2, zoom)]);
      this.updateMousePosition(event);
      var thisX = this.lastMousePoint.x;
      var thisY = this.lastMousePoint.y;
      this.context.lineTo(thisX, thisY);
      //thisSvg += 'x2="' + this.lastMousePoint.x + '" y2="' + this.lastMousePoint.y + '">\n';
      thisSvg.push([(thisX - xC) / Math.pow(2, zoom), (thisY - yC) / Math.pow(2, zoom)]);
      this.context.strokeStyle = "#0066FF";
      this.context.stroke();
    }
  } else if (drawMode == "POLYGON") {
    //need aditional articulation of mouseDown/Up/Click to begin/end each segment of polygon
  } else if (drawMode == "CIRCLE") {

  } else if (drawMode == "LINE") {

  }
  //else {    // this version depends on xC, yC resampling the image to re-origin the image
  //  var oldX = this.lastMousePoint.x;   //latch the x and y
  //  var oldY = this.lastMousePoint.y;
  //  //this.context.moveTo(this.lastMousePoint.x, this.lastMousePoint.y);  // move the context (why?)
  //  this.updateMousePosition(event);                                    //  presumably a new point
  //  //this.context.moveTo(this.lastMousePoint.x, this.lastMousePoint.y);
  //  xC = xC + oldX - this.lastMousePoint.x;
  //  yC = yC + oldY - this.lastMousePoint.y;
  //  //this.context.translate(-(oldX - this.lastMousePoint.x), -(oldY - this.lastMousePoint.y));
  //  renderImage();
  //}
  else {    // this version assumes manipulating the left and top attributes of the canvas
    var oldX = this.lastMousePoint.x;
    var oldY = this.lastMousePoint.y;
    this.updateMousePosition(event);
    xC = xC - (oldX - this.lastMousePoint.x);
    yC = yC - (oldY - this.lastMousePoint.y);
    var newX = this.lastMousePoint.x;
    var newY = this.lastMousePoint.y;
    //xC = newX;
    //yC = newY;
    if (oldX == newX && oldY == newY) return false;
    //var style = $("#svgLayer")[0].style;
    //style.left = (style.left.split('px')[0] - (oldX - newX)).toString() + 'px';
    //style.top = (style.top.split('px')[0] + newY - oldY).toString() + 'px';
    //style = $("#sketch")[0].style;
    //style.left = (-xC /*+ parseInt(style.left.split('px')[0]) - (newX - oldX)*/).toString() + 'px';
    //style.top = (-yC /*+ parseInt(style.top.split('px')[0]) + (newY - oldY)*/).toString() + 'px';
    zoom_trans(xC, yC, zoom);
    //this.context.translate(-(oldX - this.lastMousePoint.x), -(oldY - this.lastMousePoint.y));
    //renderImage();
    u = 0;
  }
}

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

Sketcher.prototype.toString = function () {

  var dataString = this.canvas.get(0).toDataURL("image/png");
  var index = dataString.indexOf( "," )+1;
  dataString = dataString.substring( index );

  return dataString;
};

Sketcher.prototype.toDataURL = function () {

  var dataString = this.canvas.get(0).toDataURL("image/png");
  return dataString;
};

Sketcher.prototype.clear = function () {

  var c = this.canvas[0];
  this.context.clearRect( 0, 0, c.width, c.height );
};