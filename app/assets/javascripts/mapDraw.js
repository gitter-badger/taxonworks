var _init_georeference_google_map;      //DISPLAY/SHOW google map of georeference

_init_georeference_google_map = function init_georeference_google_map()        // initialization function for georeference google map
{
  if ($('#georeference_google_map_canvas').length) {    //preempt omni-listener affecting wrong canvas
    if ($('#feature_collection').length) {
      var newfcdata = $("#feature_collection");
      var fcdata = newfcdata.data('feature-collection');

      initializeMap("georeference_google_map_canvas", fcdata);
    }
  }
}

$(document).ready(_init_georeference_google_map);
$(document).on("page:load", _init_georeference_google_map);


function buildFeatureCollectionFromShape(shape, shape_type) {

    //  var featureCollection = [];
    var feature = [];
    var coordinates = [];
    var coordList = [];
    var geometry = [];
    var overlayType = shape_type[0].toUpperCase() + shape_type.slice(1);
    var radius = undefined;

    switch (overlayType) {
        case 'Polyline':
            overlayType = 'LineString';
            break;
        case 'Marker':
            overlayType = 'Point';
            coordinates.push(shape.position);
            break;
        case 'Circle':
            overlayType = 'Point';

            coordinates.push(shape.center);
            radius = shape.radius;
            break;
    }

    if (coordinates.length == 0) {      // 0 if not a point or circle, coordinates is empty
        coordinates = shape.getPath().getArray();     // so get the array from the path

        for (var i = 0; i < coordinates.length; i++) {      // for LineString or Polygon
            geometry.push([coordinates[i].lng(), coordinates[i].lat()]);
        }

        if (overlayType == 'Polygon') {
            geometry.push([coordinates[0].lng(), coordinates[0].lat()]);
            coordList.push(geometry);
        }
        else {
            coordList = geometry;
        }

    }
    else {          // it is a circle or point
        geometry = [coordinates[0].lng(), coordinates[0].lat()];
        coordList = geometry;
    }

    feature.push({
        "type": "Feature",
        "geometry": {
            "type": overlayType,
            "coordinates": coordList
        },
        "properties": {}
    });

    // if it is a circle, the radius will be defined, so set the property
    if (radius != undefined) {
        feature[0]['properties'] = {"radius": radius};
    }

    return feature
}

function removeItemFromMap(item) {
    item.setMap(null);
}

// widget name is a css selector for an id'ed div, like "#my_widget"
function initializeGoogleMapWithDrawManager(widget_name) {
    var widget = $(widget_name);

    // a legal feature collection and map-center value in the widget is required, or the code fails
    var fcdata = widget.data('feature-collection');

    var map_center = widget.data('map-center');
    var map_canvas = widget.data('map-canvas');
    var map = initializeGoogleMap(map_canvas, fcdata, map_center);
    var drawingManager = initializeDrawingManager(map);

    return [map, drawingManager];
}


// This references nothing in the DOM!
// TODO: make more forgiving by allowing null fcdata or map_center_parts (stub blank legal values)
// in these cases draw a default map
function initializeGoogleMap(map_canvas, fcdata, map_center) {

    // does this need to be set?  would it alter fcdata if not set?
    var mapData = fcdata;

    //
    // find a bounding box for the map (and a map center?)
    //
    var bounds = {};    //xminp: xmaxp: xminm: xmaxm: ymin: ymax: -90.0, center_long: center_lat: gzoom:

/////////// previously omitted update to maps.js //////////////
// bounds for calculating center point
  var width;
  var height;
  var canvas_ratio = 1.0;     // default value
  var style = document.getElementById(map_canvas).style;

  if (style != null) {      // null short for undefined in js
    if (style.width != undefined && style.height != undefined) {
      width = style.width.toString().split('px')[0];
      height = style.height.toString().split('px')[0];
      canvas_ratio = width / height;
    }
  }
///////////////////////////////////////////////////////////////
   // a map center looks like  'POINT (0.0 0.0 0.0)' as (x, y, z)

    var map_center_parts  = map_center.split("(");
    var map_center_coords = map_center_parts[1].split(' ');
    var lat = map_center_coords[1]; // y
    var lng = map_center_coords[0]; // x

    // TODO: what does this actually do, should it be calculateCenter()?  If it is
    // setting a value for bounds then it should be assinging bounds to a function
    // that returns bounds
    getData(mapData, bounds);  // scan var data as feature collection with homebrew traverser, collecting bounds
/////////// previously omitted update to maps.js //////////////
  bounds.canvas_ratio = canvas_ratio;
  bounds.canvas_width = width;
  bounds.canvas_height = height;
///////////////////////////////////////////////////////////////
    var center_lat_long = get_window_center(bounds);      // compute center_lat_long from bounds and compute zoom level as gzoom

  //// override computed center with verbatim center
  //if (bounds.center_lat == 0 && bounds.center_long == 0) {
  //    center_lat_long = new google.maps.LatLng(lat, lng)
  //}
  // override computed center with verbatim center
  if ((lat != undefined && lat != '0.0') && (lng != undefined && lng != '0.0')) {   // if nonzero center supplied
      center_lat_long = new google.maps.LatLng(lat, lng);
      if (bounds.gzoom > 1) {bounds.gzoom -= 1;}
  }

    var mapOptions = {
        center: center_lat_long,
        zoom: bounds.gzoom
    };

    var map = new google.maps.Map(document.getElementById(map_canvas), mapOptions);

    map.data.setStyle({
        icon: '/assets/mapicons/mm_20_gray.png',
        fillColor: '#222222',
        strokeOpacity: 0.5,
        strokeColor: "black",
        strokeWeight: 1,
        fillOpacity: 0.2
    });

    map.data.addGeoJson(mapData);
  if(document.getElementById("map_coords") != undefined) {
    document.getElementById("map_coords").textContent = 'LAT: ' + center_lat_long['lat']() + ' - LNG: ' + center_lat_long['lng']() + ' - ZOOM: ' + bounds.gzoom;
  }
  var sw = bounds.sw;
  var ne = bounds.ne;
  var coordList = [ [
    [sw['lng'](), sw['lat']()],
    [sw['lng'](), ne['lat']()],
    [ne['lng'](), ne['lat']()],
    [ne['lng'](), sw['lat']()],
    [sw['lng'](), sw['lat']()]
  ] ];
  var bounds_box = {
    "type": "Feature",
    "geometry": {
      "type": "multilinestring",
      "coordinates": coordList
    },
    "properties": {}
  };
  map.data.addGeoJson(bounds_box);
    return map;
}


function initializeDrawingManager(map) {
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.CIRCLE,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
                google.maps.drawing.OverlayType.MARKER,
                google.maps.drawing.OverlayType.CIRCLE,
                google.maps.drawing.OverlayType.POLYGON,
                google.maps.drawing.OverlayType.POLYLINE//,
                //   google.maps.drawing.OverlayType.RECTANGLE
            ]
        },
        markerOptions: {
            icon: '/assets/mapicons/mm_20_red.png',
            editable: true
        },
        circleOptions: {
            fillColor: '#66cc00',
            fillOpacity: 0.3,
            strokeWeight: 1,
            clickable: false,
            editable: true,
            zIndex: 1
        },
        polygonOptions: {
            fillColor: '#880000',
            fillOpacity: 0.3,
            editable: true,
            strokeWeight: 1,
            strokeColor: 'black'
        },
        polylineOptions: {
            fillColor: '#880000',
            fillOpacity: 0.3,
            editable: true,
            strokeWeight: 1,
            strokeColor: 'black'
        }
    });

    drawingManager.setMap(map);
    return drawingManager;
}

function addDrawingListeners(map, event) {
    return true;
}
