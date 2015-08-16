require 'rgeo'

# RGeo::Geos.preferred_native_interface = :ffi

module Gis

  SPHEROID = 'SPHEROID["WGS-84", 6378137, 298.257223563]'

  FACTORY = RGeo::Geographic.projected_factory(srid:                    4326,
                                               projection_srid:         4326,
                                               projection_proj4:        '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
                                               uses_lenient_assertions: true,
                                               has_z_coordinate:        true,
                                               wkb_parser:              {support_ewkb: true},
                                               wkb_generator:           {hex_format: true, emit_ewkb_srid: true})
end

# RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)

