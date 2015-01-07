# Be sure to restart your server (or console) when you modify this file.

# Array of all Latinized TaxonNameClassification classes
LATINIZED_CLASSES = TaxonNameClassification::Latinized.descendants

# Array of all ICZN TaxonNameClassification classes
ICZN_TAXON_NAME_CLASSES = TaxonNameClassification::Iczn.descendants

# Array of all ICN TaxonNameClassification classes
ICN_TAXON_NAME_CLASSES = TaxonNameClassification::Icn.descendants

# Array of all ICZN and ICN TaxonNameClassification classes
TAXON_NAME_CLASSES = ICZN_TAXON_NAME_CLASSES + ICZN_TAXON_NAME_CLASSES + LATINIZED_CLASSES

# Array of all Latinized TaxonNameClassification classes, as Strings
LATINIZED_CLASS_NAMES = LATINIZED_CLASSES.collect{|d| d.to_s}

# Array of all ICZN TaxonNameClassification classes, as Strings
ICZN_TAXON_NAME_CLASS_NAMES = ICZN_TAXON_NAME_CLASSES.collect{|d| d.to_s}

# Array of all ICN TaxonNameClassifications classes, as Strings
ICN_TAXON_NAME_CLASS_NAMES = ICN_TAXON_NAME_CLASSES.collect{|d| d.to_s}

# Array of all TaxonNameClassifications classes, as Strings
TAXON_NAME_CLASS_NAMES = ICZN_TAXON_NAME_CLASS_NAMES + ICN_TAXON_NAME_CLASS_NAMES + LATINIZED_CLASS_NAMES

# Array of all Unavailable and Invalid TaxonNameClassifications classes, as Strings
TAXON_NAME_CLASS_NAMES_UNAVAILABLE_AND_INVALID = [TaxonNameClassification::Iczn::Unavailable.to_s] +
    TaxonNameClassification::Iczn::Unavailable.descendants.collect{|d| d.to_s} +
    [TaxonNameClassification::Iczn::Available::Invalid.to_s] +
    TaxonNameClassification::Iczn::Available::Invalid.descendants.collect{|d| d.to_s} +
    [TaxonNameClassification::Icn::NotEffectivelyPublished.to_s] +
    TaxonNameClassification::Icn::NotEffectivelyPublished.descendants.collect{|d| d.to_s} +
    [TaxonNameClassification::Icn::EffectivelyPublished::InvalidlyPublished.to_s] +
    TaxonNameClassification::Icn::EffectivelyPublished::InvalidlyPublished.descendants.collect{|d| d.to_s} +
    [TaxonNameClassification::Icn::EffectivelyPublished::ValidlyPublished::Illegitimate.to_s] +
    TaxonNameClassification::Icn::EffectivelyPublished::ValidlyPublished::Illegitimate.descendants.collect{|d| d.to_s}