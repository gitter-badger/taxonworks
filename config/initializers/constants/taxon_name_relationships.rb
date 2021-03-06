# Be sure to restart your server (or console) when you modify this file.

# All TaxonNameRelationship Classes
# TODO: scope to assignable
TAXON_NAME_RELATIONSHIPS = TaxonNameRelationship.descendants

# Array of all ICZN TaxonNameRelationship classes, as Strings 
ICZN_TAXON_NAME_RELATIONSHIP_NAMES = TaxonNameRelationship::Iczn.descendants.collect{|d| d.to_s} 

# Array of all ICN TaxonNameRelationship classes, as Strings 
ICN_TAXON_NAME_RELATIONSHIP_NAMES = TaxonNameRelationship::Icn.descendants.collect{|d| d.to_s}

# Array of all ICZN + ICN TaxonNameRelationship classes, as Strings
STATUS_TAXON_NAME_RELATIONSHIP_NAMES = ICZN_TAXON_NAME_RELATIONSHIP_NAMES + ICN_TAXON_NAME_RELATIONSHIP_NAMES

# Array of all assignable TaxonNameRelationship classes, as Strings
TAXON_NAME_RELATIONSHIP_NAMES = TAXON_NAME_RELATIONSHIPS.select{|i| i.assignable}.collect{|d| d.to_s}

# Array of all invalid TaxonNameRelationship classes, as Strings
TAXON_NAME_RELATIONSHIP_NAMES_INVALID = TaxonNameRelationship.
  collect_descendants_and_itself_to_s(TaxonNameRelationship::Iczn::Invalidating::Synonym,
                                      TaxonNameRelationship::Iczn::Invalidating::Usage,
                                      TaxonNameRelationship::Icn::Unaccepting)


  # TODO: check .assignable property prior to building

  object_select, subject_select = [], []
  TaxonNameRelationship.descendants.each do |r|
    if r.respond_to?(:assignment_method)
      subject_select.push([r.assignment_method.to_s.humanize, r.to_s]) 
    end
    if r.respond_to?(:inverse_assignment_method)
      object_select.push([r.inverse_assignment_method.to_s.humanize, r.to_s]) 
    end
  end

TAXON_NAME_RELATIONSHIPS_SUBJECT_SELECT = subject_select 
TAXON_NAME_RELATIONSHIPS_OBJECT_SELECT = object_select 
