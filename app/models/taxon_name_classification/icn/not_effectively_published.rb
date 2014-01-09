class TaxonNameClassification::Icn::NotEffectivelyPublished < TaxonNameClassification::Icn

  def self.applicable_ranks
    ICN.collect{|t| t.to_s}
  end

  def self.disjoint_taxon_name_classes
    self.parent.disjoint_taxon_name_classes +
        TaxonNameClassification::Icn::EffectivelyPublished.descendants.collect{|t| t.to_s} +
        [TaxonNameClassification::Icn::EffectivelyPublished.to_s]
  end

end