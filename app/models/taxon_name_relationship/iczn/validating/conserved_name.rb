class TaxonNameRelationship::Iczn::Validating::ConservedName < TaxonNameRelationship::Iczn::Validating

  NOMEN_URI='http://purl.obolibrary.org/obo/NOMEN_0000268'

  def self.disjoint_taxon_name_relationships
    self.parent.disjoint_taxon_name_relationships +
        self.collect_to_s(TaxonNameRelationship::Iczn::Validating::UncertainPlacement,
            TaxonNameRelationship::Iczn::Validating::ConservedWork)
  end

  def self.disjoint_subject_classes
    self.parent.disjoint_subject_classes + self.collect_to_s(
        TaxonNameClassification::Iczn::Available::Valid::NomenDubium)
  end

  def self.disjoint_object_classes
    self.parent.disjoint_object_classes +
        self.collect_to_s(TaxonNameClassification::Iczn::Available::Invalid)
  end

  def self.assignable
    true
  end

  def self.nomenclatural_priority
    :reverse
  end

  def subject_relationship_name
    'suppressed'
  end

  def object_relationship_name
    'conserved'
  end

  def self.gbif_status_of_subject
    'conservandum'
  end

  def self.gbif_status_of_object
    'rejiciendum'
  end

  # as.
  def self.assignment_method
    # bus.set_as_conserved_name_of(aus)
    :iczn_set_as_conserved_name_of
  end

  def self.inverse_assignment_method
    # aus.iczn_conserved_name = bus
    :iczn_conserved_name
  end

end
