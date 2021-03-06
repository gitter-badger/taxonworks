class TaxonNameRelationship::Icn::Accepting::AlternativeFamilyName < TaxonNameRelationship::Icn::Accepting

  NOMEN_URI='http://purl.obolibrary.org/obo/NOMEN_0000371'

  #left_side
  def self.valid_subject_ranks
    FAMILY_RANK_NAMES_ICN
  end

  # right_side
  def self.valid_object_ranks
    FAMILY_RANK_NAMES_ICN
  end

  def subject_relationship_name
    'as alternative family name'
  end

  def object_relationship_name
    'alternative family name'
  end

  def self.assignable
    true
  end

  def self.assignment_method
    # bus.set_as_icn_alternative_family_name_of(aus)
    :icn_as_alternative_family_name_of
  end

  def self.inverse_assignment_method
    # aus.icn_alternative_family_name = bus
    :icn_alternative_family_name
  end

end