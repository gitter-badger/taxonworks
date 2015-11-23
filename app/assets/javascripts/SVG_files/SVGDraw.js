function SVGDraw(canvasID) {
  this.renderFunction = this.updateSvgByElement;
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
    $("#" + canvasID).bind('DOMMouseScroll mousewheel', function (event)     // inline function vs cutout to prototype
    {
      event.stopImmediatePropagation();
      event.stopPropagation();
      var deltaDiv = 1000;                              // default for non-FireFox
      if (event.type == "DOMMouseScroll") {
        deltaDiv = 100
      }   // adjust for FireFox
      var delta = parseInt(event.originalEvent.wheelDelta || -event.originalEvent.detail);
      lastMouseX = (event.originalEvent.clientX - svgOffset.left);      // fixed reference for mouse offset
      lastMouseY = (event.originalEvent.clientY - svgOffset.top);
      var zoomDelta = delta / deltaDiv;
      //showMouseStatus('Mousescroll', event);
      if (zoomDelta > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
      return event.preventDefault() && false;
    });
  }
  //this.canvas.bind(this.mouseDownEvent, this.onSvgMouseDown());
  $("#" + canvasID).on(this.mouseDownEvent, this.onSvgMouseDown());
  this.mouseMoveHandler = this.onSvgMouseMove();
  this.mouseUpHandler = this.onSvgMouseUp();
  $(document).on(this.mouseUpEvent, this.mouseUpHandler);
  $(document).on(this.mouseMoveEvent, this.mouseMoveHandler);       // binding FOREVER not just on mouse OOWN

}

SVGDraw.prototype.onSvgMouseDown = function () {    // in general, start or stop element generation on mouseDOWN
  // BUT for PATH, line and MOVE, stop on mouseUP
  var self = this;
  return function (event) {
    //self.context.save();
    //self.mouseMoveHandler = self.onSvgMouseMove();
    //self.mouseUpHandler = self.onSvgMouseUp();
    //$(document).bind(self.mouseUpEvent, self.mouseUpHandler);
    //$(document).bind(self.mouseMoveEvent, self.mouseMoveHandler);       // binding on mouse OOWN

    self.updateMousePosition(event);
    //self.renderFunction(event);            // ??
    //showMouseStatus('onSvgMouseDown0', event);
    if (svgInProgress != false && svgInProgress != cursorMode) {    // terminate in progress svg before continuing
      if (svgInProgress == 'SHIFT') {
        return;
      }
      else {
        svgInProgress = cursorMode;       //  ??
        return;                                                       // TODO: fix this to actualy do something
      }
    }
    if (cursorMode == 'polygon') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
        thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
        var group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        var newGroupID = 'g' + (document.getElementById("xlt").childElementCount + 1).toString();
        group.setAttributeNS(null, 'id', newGroupID);
        thisGroup = group;
        document.getElementById("xlt").appendChild(group);
        //for (j = 0; j < thisSvg.length; j++) {              // for text mode there is only one
        var element = createElement('polyline');        //YES, I KNOW

        group.appendChild(element);
        thisElement = group.children[0];
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
        var thesePoints = thisElement.attributes['points'].value;
        var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
          + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString() + ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
    }
    if (cursorMode == 'polyline') {     // mouseDown
      if (svgInProgress == false) {       // this is a new instance of this svg type (currently by definition)
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
          + ',' + thisSvg[0][1].toFixed(2).toString() + ' ');      // start x,y
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
        if (thisGroup != null) {
          clearEditElement(thisGroup);    // this group is the one with bubbles, to be obviated
        }
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
    if (cursorMode == "text") {     // mouseDown
      thisSvg[0] = [(self.lastMousePoint.x - xC) / zoom, (self.lastMousePoint.y - yC) / zoom];
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
    savedCursorMode = cursorMode;   //    ///////////   make sure this is right
    return event.preventDefault() && false;
  }
};

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
    return;
  }
  savedCursorMode = cursorMode;   // don't wait for actual action on bubble
  if (thisGroup == null) {    // no conflicts detected, so if thisGroup is null,
    thisGroup = group;        // there is probably no creation activity
  }
  indicateMode(group.firstChild.tagName);
  showStatus('setEditElement0', group);
  if (group.childNodes.length > 1) {   // do I have bubbles?
    group.lastChild.remove();         // this is the group of bubbles
  }
  showStatus('setEditElement1', group);
  var element = group.firstChild;
//    new method using createBubbleGroup
  var bubbleGroup = createBubbleGroup(group);      // since bubble groups are heterogeneous in structure
  group.appendChild(bubbleGroup);             // make the new bubble group in a no-id <g>
  showStatus('setEditElement2', group);
}

function clearEditElement(group) {     // given containing group
  if (checkElementConflict(group)) {
    return;
  }
  cursorMode = savedCursorMode;   // on exit of edit mode, restore
  showStatus('clearEditElement0', group);
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
  showStatus('clearEditElement1', group);
  //group./*firstChild.*/attributes['onmouseenter'].value = "this.firstChild.attributes['stroke-width'].value = '" + 1.5 * strokeWidth + "'; setEditElement(this.firstChild);"    // replant the listener in the real element
  setElementMouseOverOut(group);
  thisGroup = null;
}

function checkElementConflict(group) {  // only invoked by mouseover listener - verify
  /* consider potential values of:
   svgInProgress, one of the svg modes, plus move, shift, and size
   cursorMode, the selected (if not always indicated) creation / editing mode
   thisElement, nominally the active element - conflict with bubbles
   thisGroup, nominally the group of the active element

   */
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

function exitEditPoint(group) {    // services mouseUp from SIZE bubble
  // reset all bubbles for this element
  //clearEditElement(group);
  //setEditElement(group);
  // above introduce glitch where repositioned point is dissociated and ends up at last point
  // so just recalculate the points instead
  group.lastChild.remove();                        // eliminates all bubbles
  group.appendChild(createBubbleGroup(group));    // reconstitutes new bubbles
}

function setMoveElement(bubble) {    // end of SHIFT leaves single bubble; should be removed on mouseleave of group
  //thisParent = element;                           // group containing real element and the bubbles group
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;          // set group for mousemove
  thisElement = group.firstChild;
  showStatus('setMoveElement0', group);
  thisBubble = group.lastChild.firstChild;      // this is the center/first bubble
  //cursorMode = 'bubble';      // hard code this because it is a bubble
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
  showStatus('setMoveElement2', group);
  svgInProgress = 'SHIFT';
}

function setSizeElement(bubble) {       // this sets up the single point functions
  //thisParent = element;                           // group containing real element and the bubbles group
  //thisElement = group.firstChild;    // this is the real element
  //cursorMode = group.firstChild.tagName;  // extract its tag
  var group = bubble.parentNode.parentNode;          // set group for mousemove
  thisGroup = group;
  thisElement = group.firstChild;    // this is the real element
  cursorMode = thisElement.tagName;
  showStatus('setSizeElement0', group);
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  if (group.childElementCount > 1) {         // if more than one child, we have bubbles
    group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag radius
    showStatus('setSizeElement1', group);
  }
  svgInProgress = 'SIZE';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function setPointElement(bubble) {    // this performs the inline substitution of the selected bubbed
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
  bubble.parentNode.lastChild.remove(); // /////////// this is the fight place: remove insert point bubbles
  cursorMode = thisElement.tagName;
  showStatus('setPointElement0', group);
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleave on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  //bubble.attributes['onmouseup'].value = '';  // calculate/populate insert point
  //if (group.childElementCount > 1) {         // if more than one child, we have bubbles
  //  group.lastChild.remove();      // remove ALL bubbles, since we are going to drop into drag point
  //  showStatus('setSizeElement1', group);
  //}
  svgInProgress = 'SIZE';                     // so we have an active element, and it has been marked in progress
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
  cursorMode = thisElement.tagName;
  showStatus('setNewPointElement0', group);
  group.attributes['onmouseenter'].value = ''; // disable mouseover on real element's containing group
  group.attributes['onmouseleave'].value = ''; // disable mouseleaver on real element's containing group
  bubble.attributes['onmousedown'].value = '';  // cascade to onSvgMouseDown
  thisElement.attributes['points'].value = insertNewPoint(thisElement, thisBubble);
  thisBubble.id = (parseInt(thisBubble.id) + 1).toString();   // ///////// seems to work, but...
  //group.lastChild.lastChild.removeChild();      // ///////// vaporize the intermediate newPointBubbles' group
// need mouseup on this bubble to reshfuffle bubbles -- now being handled by removing x.5 bubbles
//  bubble.attributes['onmouseup'].value = 'setEditElement(this.parentNode.parentNode);';
  svgInProgress = 'SIZE';                     // so we have an active element, and it has been marked in progress
  // look for mousedown in handler for circle to transition to rubber band mode
}                                       // use mouseup or mousedown to terminate radius drag

function insertNewPoint(element, bubble) {     //this bubble's ID truncated is the point to insert AFTER
  var splitPoints = element.attributes['points'].value.split(' ');
  var thesePoints = '';
  var insertionPoint = parseInt(bubble.id);
  var thisPoint = bubble.attributes['cx'].value + ',' + bubble.attributes['cy'].value;
  for (var k = 0; k < splitPoints.length -1; k++)  {
    thesePoints += splitPoints[k] + ' ';
    if (k == insertionPoint) {
      thesePoints += thisPoint + ' ';
    }
  }
  return thesePoints;
}

function createBubbleGroup(group) {
  var svgAttrs = {};
  var element = group.firstChild;
  svgAttrs = getModel(element.tagName);
  for (var key in svgAttrs) {     // collect basic (numeric) attributes for positioning and extent
    svgAttrs[key] = getAttributeValue(element, key);       // collect this numeric attribute
  }
  var bubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  var bubble;

  switch (element.tagName) {
    case 'circle':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var cr = svgAttrs['r'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(cr + cx, cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cr + cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx - cr, cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - cr));    // this is the resize point
      return bubbleGroup;
    case 'ellipse':    // 1 relocation bubble, 4 compass-point resize bubbles (flagged SHIFT and SIZE respecively)
      var cx = svgAttrs['cx'];
      var cy = svgAttrs['cy'];
      var rx = svgAttrs['rx'];
      var ry = svgAttrs['ry'];
      bubbleGroup.appendChild(createShiftBubble(cx, cy));    // this is the center point of both bubble and circle
      bubbleGroup.appendChild(createSizeBubble(rx + cx, cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx, ry + cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx - rx, cy));    // this is the resize point
      bubbleGroup.appendChild(createSizeBubble(cx, cy - ry));    // this is the resize point
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
    case 'polygon':           // polygon needs additional point insertion bubble after last point pair
      var thesePoints = element.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      for (var k = 0; k < splitPoints.length - 1; k++) {
        var thisPoint = splitPoints[k].split(',');
        bubbleGroup.appendChild(createPointBubble(parseFloat(thisPoint[0]), parseFloat(thisPoint[1]), k.toString()));
      }
      return bubbleGroup;
    case 'polyline':      // create a parallel structure to the point attr, using its coords
      var thesePoints = element.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      var thisPoint  = splitPoints[0].split(',');   // prime the pump for iteration
      var thisX = parseFloat(thisPoint[0]);
      var thisY = parseFloat(thisPoint[1]);
      var nextPoint;                          // these are used to bound
      var nextX;                             // and calculate the intermediate
      var nextY;                            // insert new point bubbles in separate parallel group
      var newBubbleGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      for (var k = 0; k < splitPoints.length - 1; k++) {    // append this point and an intermediary point
        //thisPoint  = splitPoints[k].split(',');
        bubbleGroup.appendChild(createPointBubble(thisX, thisY, k.toString()));   // add the vertex point
        if (k < splitPoints.length - 2) {
          nextPoint = splitPoints[k + 1].split(',');     // only add intermediate point if we are not at the last point
          nextX = parseFloat(nextPoint[0]);
          nextY = parseFloat(nextPoint[1]);
          newBubbleGroup.appendChild(createNewPointBubble(0.5 * (thisX + nextX), 0.5 * (thisY + nextY), k.toString() + '.5'));
          // ///////// watch for hierarchicical misplacement
          thisX = nextX;
          thisY = nextY;
        }
      }
      bubbleGroup.appendChild(newBubbleGroup);   // add the new point insertion bebbles
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

function createSizeBubble(cx, cy) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setSizeElement(this);");
  return bubble;
}
function createPointBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'fill-opacity', '0.6');         // SIZE/POINT bubble is slightly less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', "exitEditPoint(thisGroup);");   // questionable reference
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'x1-y1', 'x2-y2' for <line>,
                                            // will take the form: '36', '23.5' for <poly-...>
  return bubble;
}
function createNewPointBubble(cx, cy, id) {
  var bubble = createBubbleStub(cx, cy);
  bubble.setAttributeNS(null, 'r', 12);      // radius override for insertion point
  bubble.setAttributeNS(null, 'stroke', '#555555');     // not that great, use below
  bubble.setAttributeNS(null, 'stroke-opacity', '0.6');     // not that great, use below
  bubble.setAttributeNS(null, 'fill-opacity', '0.4');         // SIZE/POINT bubble is even less opaque
  bubble.setAttributeNS(null, 'onmousedown', "setNewPointElement(this);");
  bubble.setAttributeNS(null, 'onmouseup', 'setEditElement(thisGroup);');
  bubble.setAttributeNS(null, 'id', id);    // use this identifier to attach cursor in onSvgMouseMove
                                            // will take the form: 'x1-y1', 'x2-y2' for <line>,
                                            // will take the form: '36', '23.5' for <poly-...>
  return bubble;
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
  bubble.setAttributeNS(null, 'r', 15);      // radius
  bubble.setAttributeNS(null, 'fill', '#FFFFFF');
  bubble.setAttributeNS(null, 'stroke', '#222222');   // set scaffold attrs
  bubble.setAttributeNS(null, 'stroke-width', '3');
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
  }                   // end switch
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}


function unbindMouseHandlers(self) {
  if (self.event != 'mouseup') {
    return false;                 // ////// this is always happening
  }
  $(document).unbind(self.mouseMoveEvent, self.mouseMoveHandler);   // unbinding on mouse UP
  $(document).unbind(self.mouseUpEvent, self.mouseUpHandler);
// kill the linkage to the handler
  self.mouseMoveHandler = null;
  self.mouseUpHandler = null;
}

function showMouseStatus(where, event) {
  if (logMouse) {
    if ($('#mouseStatus').html().length > 8192) {
      var span = document.getElementById('mouseStatus');
      span.innerHTML = span.innerHTML.substr(0, 6144);   // clip periodically
    }
    $("#coords").html('xC: ' + xC.toFixed(1) + ' lastX: ' + lastMouseX.toFixed(3)
      + ' yC: ' + yC.toFixed(1) + ' lastY: ' + lastMouseY.toFixed(3));
    $('#mouseStatus').html('<br />' + event.timeStamp + ': ' + where + ' Mode: ' + cursorMode + '; svgInProgress: ' + svgInProgress.toString()
      + '. Event: ' + event.type + '. button: ' + event.button + '. which: ' + event.which + $('#mouseStatus').html());
  }
}

function showStatus(where, element) {
  if (logStatus) {
    if ($('#mouseStatus').html().length > 32768) {
      var span = document.getElementById('mouseStatus');
      span.innerHTML = span.innerHTML.substr(0, 24000);   // clip periodically
    }
    $("#coords").html('xC: ' + xC.toFixed(1) + ' lastX: ' + lastMouseX.toFixed(3)
      + ' yC: ' + yC.toFixed(1) + ' lastY: ' + lastMouseY.toFixed(3));
    //var nowStatus = "<br />"+ where + "; " + (element.innerHTML.replace(/['"]+/g, '')).toString();
    var thisGroupTagNameAndID = ' thisGroup: NULL';
    if (thisGroup != null) {
      thisGroupTagNameAndID = ' thisGroup:' + thisGroup.tagName + '#' + thisGroup.id;
    }
    var thisElementTagName = ' thisElement: NULL';
    if (thisElement != null) {
      thisElementTagName = ' thisElement:' + thisElement.tagName;
    }
    var nowStatus = "<br /><br />" + where + "; " + element.outerHTML.replace(/[<]+/g, '&lt;').replace(/[>]+/g, '&gt;') + '<br>'
      + 'thisElement: ' + thisElementTagName + thisGroupTagNameAndID + '<br>'
      + (element.innerHTML.replace(/[<]+/g, '&lt;').replace(/[>]+/g, '&gt;')).toString();
    nowStatus = nowStatus;
    //$('#mouseStatus').html('<br />' + '' + ': ' + where + ' Mode: ' + cursorMode + '; svgInProgress: ' + svgInProgress.toString()
    //  + '. Element: ' + element.innerHTML.toString() + element.attributes['id'].value
    //  + '.mouseover ' + element.attributes['onmouseenter'].value + '. which: ' + element.attributes['onmouseleave'].value + $('#mouseStatus').html());
    $('#mouseStatus').html(nowStatus.toString() + ' ' + $('#mouseStatus').html());
  }
}

SVGDraw.prototype.onSvgMouseMove = function () {
  var self = this;
  return function (event) {
    //showMouseStatus('onSvgMouseMove', event);
    //self.mouseUpHandler = self.onSvgMouseUp();
    //$(document).bind(self.mouseUpEvent, self.mouseUpHandler);   // binding on mouse MOVE

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
      }
      this.updateMousePosition(event);
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;
          thesePoints = '';
          for (var k = 0; k < splitPoints.length - 1; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {
        thesePoints = '';                               // clear thecollector
        for (k = 0; k < splitPoints.length - 2; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      thisElement.attributes['stroke'].value = cursorColor;
    }
    else if (cursorMode == "polyline") {
      if (svgInProgress == false) {
        return;
      }
      this.updateMousePosition(event);
      var thisPoint = ((lastMouseX - xC) / zoom).toFixed(2).toString()
        + ',' + ((lastMouseY - yC) / zoom).toFixed(2).toString();
      var thesePoints = thisElement.attributes['points'].value;
      var splitPoints = thesePoints.split(' ');
      if (thisBubble != null) {       // look for bubble to denote just move THIS point only
        // currently, no distinction is made between existing vertex and new point
        // however, this may change in the future JRF 23NOV15
        thisBubble.attributes['cx'].value = (lastMouseX - xC) / zoom;     // translate the bubble
        thisBubble.attributes['cy'].value = (lastMouseY - yC) / zoom;
        if (isNumeric(thisBubble.id)) {       // presume integer for now
          splitPoints[parseInt(thisBubble.id)] = thisPoint;   // replace this point
          thesePoints = '';
          for (var k = 0; k < splitPoints.length - 1; k++) {
            thesePoints += splitPoints[k] + ' ';
          }
          thisElement.attributes['points'].value = thesePoints
        }
      }
      else {
        thesePoints = '';                               // clear the collector
        for (k = 0; k < splitPoints.length - 2; k++) {  // reconstruct except for the last point
          thesePoints += splitPoints[k] + ' ';          // space delimiter at the end of each coordinate
        }
        thisPoint += ' ';
        thisElement.attributes['points'].value = thesePoints.concat(thisPoint);
      }
      thisElement.attributes['stroke'].value = cursorColor;
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
        thisElement.attributes['stroke'] = cursorColor;
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
      thisElement.attributes['stroke'] = cursorColor;
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
        showStatus('updateSvgByElementC0', thisElement.parentElement);
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
        thisElement.attributes['stroke'].value = cursorColor;
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
      thisElement.attributes['stroke'].value = cursorColor;
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
      //  return false;    // if no mvement, don't change (?)
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
    else if ((cursorMode == "MOVE") /*&& (svgInProgress == cursorMode)*/) {
      svgInProgress = false;
      unbindMouseHandlers(self);
    }
    else if (cursorMode == 'rect') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'line') {
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      unbindMouseHandlers(self);
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
        thisElement = null;
        thisGroup = null;
      }
    }
    else if (cursorMode == 'circle') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
      thisElement = null;
      thisGroup = null;
    }
    else if (cursorMode == 'ellipse') {
      //thisCircle = thisElement;   // patch/hack to have routine below happy
      checkLeftoverElement();
      svgInProgress = false;
      setElementMouseOverOut(thisGroup);
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
  return function (event) {
    if ((cursorMode == 'polygon') || (cursorMode == 'polyline')) {
      svgInProgress = false;
      switch (cursorMode) {
        case 'polygon':
          checkLeftoverElement();     // ///////// temp patch, since double-click induces extra
          checkLeftoverElement();     // ///////// identical points.  TODO: look for this condition and truncate points:
          thisGroup.innerHTML = thisGroup.innerHTML.replace('polyline', 'polygon').replace('polyline', 'polygon')
          setElementMouseOverOut(thisGroup);
          break;
        case 'polyline':
          checkLeftoverElement();     // ///////// temp patch
          checkLeftoverElement();
          setElementMouseOverOut(thisGroup);
          break;
      }
      unbindMouseHandlers(self);
    }
  }
}

SVGDraw.prototype.clear = function () {

  var c = this.canvas[0];
  //this.context.clearRect(0, 0, c.width, c.height);
};