class GeographicItem < ActiveRecord::Base
  include Housekeeping::Users

  DATA_TYPES = [:point,
                :line_string,
                :polygon,
                :multi_point,
                :multi_line_string,
                :multi_polygon,
                :geometry_collection]

  column_factory = Georeference::FACTORY
  DATA_TYPES.each do |t|
    set_rgeo_factory_for_column(t, column_factory)
  end

  has_many :geographic_areas_geographic_items, dependent: :destroy, inverse_of: :geographic_item
  has_many :geographic_areas, through: :geographic_areas_geographic_items

  has_many :gadm_geographic_areas, class_name: 'GeographicArea', foreign_key: :gadm_geo_item_id
  has_many :ne_geographic_areas, class_name: 'GeographicArea', foreign_key: :ne_geo_item_id
  has_many :tdwg_geographic_areas, class_name: 'GeographicArea', foreign_key: :tdwg_geo_item_id

  has_many :georeferences

  # more explicity because we can also go through Geographic Area
  has_many :collecting_events_through_georeferences, through: :georeferences,  source: :collecting_event

  validate :proper_data_is_provided
  validate :chk_point_limit

  # GeographicItem.within_radius(x).excluding_self.with_collecting_event.include_collecting_event.collect{|a| a.collecting_event}

  # within_radius_of('polygon', @geographic_item, 100)
  # excluding_self
  # with_collecting_event
  # include_collecting_event


  # if I make some objects then

  #  GeographicItem.with_collecting_event
  #
  #  returns only those objects with a collecting event

  scope :with_collecting_event, -> {joins(:collecting_events_through_georeferences)}
  scope :include_collecting_event, -> {includes(:collecting_events_through_georeferences)}

  # A scope that includes an 'is_valid' attribute (True/False) for the passed geographic_item.  Uses St_IsValid.
  def self.with_is_valid_geometry_column(geographic_item)
    # where(id: geographic_item.id).select("ST_IsValid(ST_AsText('#{geographic_item.geo_object}')) is_valid").limit(1)
    # where(id: geographic_item.id).select("ST_IsValid(ST_AsEWKT('#{geographic_item.geo_object}')) is_valid").limit(1)
    where(id: geographic_item.id).select("ST_IsValid(#{geographic_item.st_as_binary}) is_valid")
  end

  # Returns True/False based on whether stored shape is ST_IsValid
  def is_valid_geometry?
    GeographicItem.with_is_valid_geometry_column(self).first['is_valid']
  end

  # Return the Integer number of points in the geometry
  def st_npoints
    GeographicItem.where(id: self.id).select("ST_NPoints(#{self.st_as_binary}) number_points").first['number_points'].to_i
  end

  def st_as_binary
    "ST_AsBinary(#{self.geo_object_type})"
    # "#{self.geo_object_type}"
  end

  def self.as_binary_string

  end

  def parent_geographic_areas
    self.geographic_areas.collect { |a| a.parent }
  end

  def parents_through_geographic_areas
    result = {}
    parent_geographic_areas.collect { |a|
      result.merge!(a => a.geographic_items)
    }
    result
  end

  def children_through_geographic_areas
    result = {}
    geographic_areas.collect { |a|
      a.children.collect { |c|
        result.merge!(c => c.geographic_items)
      }
    }
    result
  end

  # TODO: Test and refactor to use ST_StartPoint
  # Return an Array of [latitude, longitude] for the first point of GeoItem
  def st_start_point
    to_geo_json =~ /(-{0,1}\d+\.{0,1}\d*),(-{0,1}\d+\.{0,1}\d*)/
    [$1, $2]
  end

  # TODO: Find ST_Centroid(g1) method and
  # Return an Array of [latitude, longitude] for the centroid of GeoItem
  def center_coords
    to_geo_json =~ /(-{0,1}\d+\.{0,1}\d*),(-{0,1}\d+\.{0,1}\d*)/
    [$1, $2]
  end

=begin
  scope :intersecting_boxes, -> (column_name, geographic_item) {
    select("ST_Contains(geographic_items.#{column_name}, #{geographic_item.geo_object})",
    ) }

  def self.same(geo_object_a, geo_object_b)
    # http://postgis.refractions.net/documentation/manual-1.4/ST_Geometry_Same.html
    # boolean ~=( geometry A , geometry B );
    # TODO: not sure how to specify '~=', syntactically substituting 'same'
    where(st_geometry_same(geo_object_a, geo_object_b))
    # returns true if the two objects are, vertex-by-vertex, the same
  end

  def self.area(geo_polygon) # or multi_polygon
    # http://postgis.refractions.net/documentation/manual-1.4/ST_Area.html
    # float ST_Area(geometry g1);
    where(st_area(geo_polygon))
    # returns the area area of the geometry as a float
  end

  def self.azimuth(geo_point_a, geo_point_b)
    # http://postgis.refractions.net/documentation/manual-1.4/ST_Azimuth.html
    # float ST_Azimuth(geometry pointA, geometry pointB);
    where(st_azimuth(geo_point_a, geo_point_b))
  end

  def self.centroid(geo_object)
    # http://postgis.refractions.net/documentation/manual-1.4/ST_Centroid.html
    # geometry ST_Centroid(geometry g1);
    where(st_centroid(geo_object))
    # returns a point
  end

  def self.find_containing(column_name, geo_object)
    # ST_Contains(geometry, geometry) or
    # ST_Contains(geography, geography)
    where{st_contains(st_geomfromewkb(column_name), geo_object)}
  end
=end

  # See comments https://groups.google.com/forum/#!topic/postgis-users/0nzm2SRUZVU on why this might not work
  # For the record: the problem was caused by incorrect escaping of strings.
  # I solved it by setting standard_conforming_strings = off in postgresql.conf
  # TODO: @mjy: Do you think this is a permanent change in PG configuration?
  def self.contains?(geo_object_a, geo_object_b)
    # ST_Contains(geometry, geometry) or
    # ST_Contains(geography, geography)
    where { st_contains(st_geomfromewkb(geo_object_a), st_geomfromewkb(geo_object_b)) }
  end

  def self.intersecting(column_name, *geographic_items)
    q = geographic_items.flatten.collect { |geographic_item|
      "ST_Intersects(#{column_name}, 'srid=4326;#{geographic_item.geo_object}')"
    }.join(' and ')
    where (q)
=begin
    geographic_items.each { |geographic_item|
      # where("st_contains(geographic_items.#{column_name}, ST_GeomFromText('#{geographic_item.to_s}'))")
      # TODO: see if st_intersects, instead of st_contains makes a difference
      where {"st_intersects(#{column_name}, #{geographic_item.geo_object})"}
      #where { st_intersects(st_geomfromewkb("geographic_items.#{column_name}"), geographic_item.geo_object.as_binary) }
      # where("st_contains(geographic_items.#{column_name}, ST_GeomFromText('#{geographic_item.to_s}'))")
    }
=end
  end

  # TODO: Document, what units are distance in?
  def self.within_radius_of(column_name, geographic_item, distance)
    if check_geo_params(column_name, geographic_item)
      where ("st_distance(#{column_name}, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}')) < #{distance}")
    else
      where ('false')
    end
  end

  def self.disjoint_from(column_name, *geographic_items)
    q = geographic_items.flatten.collect { |geographic_item|
      "st_disjoint(#{column_name}::geometry, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}'))"
    }.join(' and ')
    where (q)
  end

  # If this scope is given an Array of GeographicItems as a second parameter,
  # it will return the 'or' of each of the objects against the table.
  # SELECT COUNT(*) FROM "geographic_items"  WHERE (ST_Contains(polygon::geometry, GeomFromEWKT('srid=4326;POINT (0.0 0.0 0.0)')) or ST_Contains(polygon::geometry, GeomFromEWKT('srid=4326;POINT (-9.8 5.0 0.0)')))
  def self.containing(column_name, *geographic_items)
    q = geographic_items.flatten.collect { |geographic_item| GeographicItem.containing_sql(column_name, geographic_item) }.join(' or ')
    where(q)
  end

  def self.ordered_by_shortest_distance_from(column_name, geographic_item)
    if check_geo_params(column_name, geographic_item)
      q = select_distance_with_geo_object(column_name, geographic_item).where_distance_greater_than_zero(column_name, geographic_item).order('distance')
      q
    else
      where ('false')
    end

  end

  def self.ordered_by_longest_distance_from(column_name, geographic_item)
    if check_geo_params(column_name, geographic_item)
      q = select_distance_with_geo_object(column_name, geographic_item).
        where_distance_greater_than_zero(column_name, geographic_item).
        order('distance desc')
      q
    else
      where ('false')
    end
  end

  def self.containing_sql(column_name, geographic_item)
    check_geo_params(column_name, geographic_item) ?
      "ST_Contains(#{column_name}::geometry, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}'))" :
      'false'
  end

  def self.select_distance(column_name, geographic_item)
    # select { "ST_Distance(#{column_name}, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}')) as distance" }
    select(" ST_Distance(#{column_name}, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}')) as distance")
  end

  def self.select_distance_with_geo_object(column_name, geographic_item)
    # q = select_distance(column_name, geographic_item)
    # select { '*' }.select_distance(column_name, geographic_item)
    select("*, ST_Distance(#{column_name}, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}')) as distance")
  end

  def self.where_distance_greater_than_zero(column_name, geographic_item)
    where ("#{column_name} is not null and ST_Distance(#{column_name}, GeomFromEWKT('srid=4326;#{geographic_item.geo_object}')) > 0")
  end

  def self.excluding(geographic_items)
    # where{ geographic_items.flatten.collect { |geographic_item| "id != #{geographic_item.id}" }.join(' and ')}
    where.not(id: geographic_items)
  end

  # return the first-found object, according to the list of DATA_TYPES, or nil
  def geo_object_type
    DATA_TYPES.each do |t|
      return t if !self.send(t).nil?
    end
    nil
  end

  def geo_object
    if r = geo_object_type
      self.send(r)
    else
      false
    end
  end

  # Methods mapping RGeo methods

  def contains?(geo_object)
    self.geo_object.contains?(geo_object)
  end

  def within?(geo_object)
    self.geo_object.within?(geo_object)
  end

  # TODO: doesn't work?
  def distance?(geo_object)
    self.geo_object.distance?(geo_object)
  end

  def near(geo_object, distance)
    self.geo_object.buffer(distance).contains?(geo_object)
  end

  def far(geo_object, distance)
    !self.near(geo_object, distance)
  end


  def data_type?
    DATA_TYPES.each { |item| return item if !self.send(item).nil? }
  end

  # Return the geo_object as a set of points with object type as key like:
  # {
  #  points:  [],
  #  lines:   [],
  #  polygons: []
  #  }
  def rendering_hash
    data = {}
    if self.geo_object
      case self.data_type?
        when :point
          data = point_to_hash(self.point)
        when :line_string
          data = line_string_to_hash(self.line_string)
        when :polygon
          data = polygon_to_hash(self.polygon)
        when :multi_point
          data = multi_point_to_hash(self.multi_point)
        when :multi_line_string
          data = multi_line_string_to_hash(self.multi_line_string)
        when :multi_polygon
          data = multi_polygon_to_hash(self.multi_polygon)
        when :geometry_collection
          data = self.geometry_collection_to_hash(self.geometry_collection)
        else
          # do nothing
      end
    end

    data.delete_if { |key, value| value == [] } # remove any keys with empty arrays
    data
  end

  def to_geo_json
    RGeo::GeoJSON.encode(self.geo_object).to_json
  end

  def to_a
    # get our object and return the set of points as an array
    we_are = self.geo_object

    if we_are
      data = []
      case self.data_type?
        when :point
          data = point_to_a(self.point)
        when :line_string
          data = line_string_to_a(self.line_string)
        when :polygon
          data = polygon_to_a(self.polygon)
        when :multi_point
          data = multi_point_to_a(self.multi_point)
        when :multi_line_string
          data = multi_line_string_to_a(self.multi_line_string)
        when :multi_polygon
          data = multi_polygon_to_a(self.multi_polygon)
        #when :geometry_collection
        #  data = geometry_collection_to_a(self.geometry_collection)
        else
          # do nothing
      end
      data
    else
      []
    end
  end

  protected

  def point_to_a(point)
    data = []
    data.push(point.x, point.y)
    data
  end

  def point_to_hash(point)
    {points: [point_to_a(point)]}
  end

  def line_string_to_a(line_string)
    data = []
    line_string.points.each { |point|
      data.push([point.x, point.y]) }
    data
  end

  def line_string_to_hash(line_string)
    {lines: [line_string_to_a(line_string)]}
  end

  def polygon_to_a(polygon)
    # todo: handle other parts of the polygon; i.e., the interior_rings (if they exist)
    data = []
    polygon.exterior_ring.points.each { |point|
      data.push([point.x, point.y]) }
    data
  end

  def polygon_to_hash(polygon)
    {polygons: [polygon_to_a(polygon)]}
  end

  def multi_point_to_a(multi_point)
    data = []
    multi_point.each { |point|
      data.push([point.x, point.y]) }
    data
  end

  def multi_point_to_hash(multi_point)
    # when we encounter a multi_point type, we only stick the points into the array, NOT the
    # it's identity as a group
    {points: self.to_a}
  end

  def multi_line_string_to_a(multi_line_string)
    data = []
    multi_line_string.each { |line_string|
      line_data = []
      line_string.points.each { |point|
        line_data.push([point.x, point.y]) }
      data.push(line_data)
    }
    data
  end

  def multi_line_string_to_hash(multi_line_string)
    {lines: self.to_a}
  end

  def multi_polygon_to_a(multi_polygon)
    data = []
    multi_polygon.each { |polygon|
      polygon_data = []
      polygon.exterior_ring.points.each { |point|
        polygon_data.push([point.x, point.y]) }
      data.push(polygon_data)
    }
    data
  end

  def multi_polygon_to_hash(multi_polygon)
    {polygons: self.to_a}
  end

  def geometry_collection_to_hash(geometry_collection)
    # TODO: this method does *not* use the object_to_hash method, expect for the recursive geometry_collection.
    data = {
      points:   [],
      lines:    [],
      polygons: []
    }
    geometry_collection.each { |it|
      case it.geometry_type.type_name
        when 'Point'
          # POINT (-88.241421 40.091565 757.0)
          point = point_to_hash(it)[:points]
          # TODO: would it really be better to use object_to_hash here?  Structure-wise, perhaps, but it really is faster to do it here directly, I think...
          data[:points].push(point_to_a(it))
        when /^Line[S]*/ #when 'Line' or 'LineString'
          # LINESTRING (-32.0 21.0 0.0, -25.0 21.0 0.0, -25.0 16.0 0.0, -21.0 20.0 0.0)
          data[:lines].push(line_string_to_a(it))
        when 'Polygon'
          # POLYGON ((-14.0 23.0 0.0, -14.0 11.0 0.0, -2.0 11.0 0.0, -2.0 23.0 0.0, -8.0 21.0 0.0, -14.0 23.0 0.0), (-11.0 18.0 0.0, -8.0 17.0 0.0, -6.0 20.0 0.0, -4.0 16.0 0.0, -7.0 13.0 0.0, -11.0 14.0 0.0, -11.0 18.0 0.0))
          # note: only the exterior_ring is processed
          data[:polygons].push(polygon_to_a(it))
        # in the cases of the multi-objects, break each down to its constituent parts (i.e., remove its identity as a multi-whatever), and record those parts
        when 'MultiPoint'
          # MULTIPOINT ((3.0 -14.0 0.0), (6.0 -12.9 0.0), (5.0 -16.0 0.0), (4.0 -17.9 0.0), (7.0 -17.9 0.0))
          multi_point_to_a(it).each { |point|
            data[:points].push(point)
          }
        when 'MultiLineString'
          # MULTILINESTRING ((23.0 21.0 0.0, 16.0 21.0 0.0, 16.0 16.0 0.0, 11.0 20.0 0.0), (4.0 12.6 0.0, 16.0 12.6 0.0, 16.0 7.6 0.0), (21.0 12.6 0.0, 26.0 12.6 0.0, 22.0 17.6 0.0))
          multi_line_string_to_a(it).each { |line_string|
            data[:lines].push(line_string)
          }
        when 'MultiPolygon'
          # MULTIPOLYGON (((28.0 2.3 0.0, 23.0 -1.7 0.0, 26.0 -4.8 0.0, 28.0 2.3 0.0))
          it.each { |polygon|
            polygon_data = []
            polygon.exterior_ring.points.each { |point|
              polygon_data.push([point.x, point.y]) }
            data[:polygons].push(polygon_data)
          }
        when 'GeometryCollection'
          # GEOMETRYCOLLECTION (LINESTRING (-32.0 21.0 0.0, -25.0 21.0 0.0, -25.0 16.0 0.0, -21.0 20.0 0.0), POLYGON ((-14.0 23.0 0.0, -14.0 11.0 0.0, -2.0 11.0 0.0, -2.0 23.0 0.0, -8.0 21.0 0.0, -14.0 23.0 0.0), (-11.0 18.0 0.0, -8.0 17.0 0.0, -6.0 20.0 0.0, -4.0 16.0 0.0, -7.0 13.0 0.0, -11.0 14.0 0.0, -11.0 18.0 0.0)), MULTILINESTRING ((23.0 21.0 0.0, 16.0 21.0 0.0, 16.0 16.0 0.0, 11.0 20.0 0.0), (4.0 12.6 0.0, 16.0 12.6 0.0, 16.0 7.6 0.0), (21.0 12.6 0.0, 26.0 12.6 0.0, 22.0 17.6 0.0)), LINESTRING (-33.0 11.0 0.0, -24.0 4.0 0.0, -26.0 13.0 0.0, -31.0 4.0 0.0, -33.0 11.0 0.0), GEOMETRYCOLLECTION (POLYGON ((-19.0 9.0 0.0, -9.0 9.0 0.0, -9.0 2.0 0.0, -19.0 2.0 0.0, -19.0 9.0 0.0)), POLYGON ((5.0 -1.0 0.0, -14.0 -1.0 0.0, -14.0 6.0 0.0, 5.0 6.0 0.0, 5.0 -1.0 0.0)), POLYGON ((-11.0 -1.0 0.0, -11.0 -5.0 0.0, -7.0 -5.0 0.0, -7.0 -1.0 0.0, -11.0 -1.0 0.0)), POLYGON ((-3.0 -9.0 0.0, -3.0 -1.0 0.0, -7.0 -1.0 0.0, -7.0 -9.0 0.0, -3.0 -9.0 0.0)), POLYGON ((-7.0 -9.0 0.0, -7.0 -5.0 0.0, -11.0 -5.0 0.0, -11.0 -9.0 0.0, -7.0 -9.0 0.0))), MULTILINESTRING ((-20.0 -1.0 0.0, -26.0 -6.0 0.0), (-21.0 -4.0 0.0, -31.0 -4.0 0.0)), MULTIPOLYGON (((28.0 2.3 0.0, 23.0 -1.7 0.0, 26.0 -4.8 0.0, 28.0 2.3 0.0)), ((22.0 -6.8 0.0, 22.0 -9.8 0.0, 16.0 -6.8 0.0, 22.0 -6.8 0.0)), ((16.0 2.3 0.0, 14.0 -2.8 0.0, 18.0 -2.8 0.0, 16.0 2.3 0.0))), MULTIPOINT ((3.0 -14.0 0.0), (6.0 -12.9 0.0), (5.0 -16.0 0.0), (4.0 -17.9 0.0), (7.0 -17.9 0.0)), LINESTRING (27.0 -14.0 0.0, 18.0 -21.0 0.0, 20.0 -12.0 0.0, 25.0 -23.0 0.0), GEOMETRYCOLLECTION (MULTIPOLYGON (((28.0 2.3 0.0, 23.0 -1.7 0.0, 26.0 -4.8 0.0, 28.0 2.3 0.0)), ((22.0 -6.8 0.0, 22.0 -9.8 0.0, 16.0 -6.8 0.0, 22.0 -6.8 0.0)), ((16.0 2.3 0.0, 14.0 -2.8 0.0, 18.0 -2.8 0.0, 16.0 2.3 0.0))), MULTIPOINT ((3.0 -14.0 0.0), (6.0 -12.9 0.0), (5.0 -16.0 0.0), (4.0 -17.9 0.0), (7.0 -17.9 0.0)), LINESTRING (27.0 -14.0 0.0, 18.0 -21.0 0.0, 20.0 -12.0 0.0, 25.0 -23.0 0.0)), POLYGON ((-33.0 -11.0 0.0, -33.0 -23.0 0.0, -21.0 -23.0 0.0, -21.0 -11.0 0.0, -27.0 -13.0 0.0, -33.0 -11.0 0.0)), LINESTRING (-16.0 -15.5 0.0, -22.0 -20.5 0.0), MULTIPOINT ((-88.241421 40.091565 757.0), (-88.241417 40.09161 757.0), (-88.241413 40.091655 757.0)), POINT (0.0 0.0 0.0), POINT (-29.0 -16.0 0.0), POINT (-25.0 -18.0 0.0), POINT (-28.0 -21.0 0.0), POINT (-19.0 -18.0 0.0), POINT (3.0 -14.0 0.0), POINT (6.0 -12.9 0.0), POINT (5.0 -16.0 0.0), POINT (4.0 -17.9 0.0), POINT (7.0 -17.9 0.0), POINT (32.2 22.0 0.0), POINT (-17.0 7.0 0.0), POINT (-9.8 5.0 0.0), POINT (-10.7 0.0 0.0), POINT (-30.0 21.0 0.0), POINT (-25.0 18.3 0.0), POINT (-23.0 18.0 0.0), POINT (-19.6 -13.0 0.0), POINT (-7.6 14.2 0.0), POINT (-4.6 11.9 0.0), POINT (-8.0 -4.0 0.0), POINT (-4.0 -3.0 0.0), POINT (-10.0 -6.0 0.0))
          collection_hash = geometry_collection_to_hash(it)
          collection_hash.each_key { |key|
            collection_hash[key].each { |item|
              data[key].push(item) }
            #case key
            #  when :points
            #    collection_hash[:points].each { |point|
            #      data[:points].push(point)
            #    }
            #  when :lines
            #    collection_hash[:lines].each { |line|
            #      data[:lines].push(line)
            #    }
            #  when :polygons
            #    collection_hash[:polygons].each { |polygon|
            #      data[:polygons].push(polygon)
            #    }
            #  else
            #  leave everything as it is
            #end
          }
        else
          # leave everything as it is...
      end
    }
    # remove any keys with empty arrays
    data.delete_if { |key, value| value == [] }
    data
  end

  def chk_point_limit
    unless point.nil?
      errors.add(:point_limit, 'Longitude exceeds limits: 180.0 to -180.0.') if point.x > 180.0 || point.x < -180.0
    end
  end

  def proper_data_is_provided
    data = []
    DATA_TYPES.each do |item|
      data.push(item) unless self.send(item).blank?
    end

    errors.add(:point, 'Must contain at least one of [point, line_string, etc.].') if data.count == 0
    if data.length > 1
      data.each do |object|
        errors.add(object, 'Only one of [point, line_string, etc.] can be provided.')
      end
    end
    true
  end

  def self.check_geo_params(column_name, geographic_item)
    (DATA_TYPES.include?(column_name.to_sym) && geographic_item.class.name == 'GeographicItem')
  end

end
