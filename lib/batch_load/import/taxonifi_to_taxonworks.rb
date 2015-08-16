module BatchLoad

  # Batch loading of CSV formatted taxon names via Taxonifi 
  class Import::TaxonifiToTaxonworks < BatchLoad::Import

    # The Taxonifi Name collection
    attr_accessor :name_collection

    # The parent for the top level names 
    attr_accessor :parent_taxon_name

    # The code (Rank Class) that new names will use
    attr_accessor :nomenclature_code

    # Whether to create an OTU as well 
    attr_accessor :also_create_otu

    def initialize( nomenclature_code: nil, parent_taxon_name_id: nil, also_create_otu: false, **args)

      begin
        @parent_taxon_name = TaxonName.find(parent_taxon_name_id)
      rescue ActiveRecord::RecordNotFound
        @errors = [ 'Parent taxon not provided.' ]
      end

      @nomenclature_code = nomenclature_code
      @nomenclature_code ||= @parent_taxon_name.rank_class.nomenclatural_code
      @nomenclature_code = @nomenclature_code.to_sym

      @also_create_otu = also_create_otu

      super(args)     
    end

    def build
      if valid?
        build_name_collection
        build_protonyms
        @processed = true
      end
    end

    protected

    def build_name_collection
      begin
        @name_collection ||= ::Taxonifi::Lumper.create_name_collection(csv: csv)
      rescue Taxonifi::Assessor::RowAssessor::RowAssessorError
        @file_errors.push "Error assessing a row of data in the inputfile."
      end
    end

    def build_protonyms
      if name_collection.nil? 
        @file_errors.push "No names were readable in the file."
        return
      end

      parents = {}

      total_lines = 0

      name_collection.collection.each do |n|
        i = n.row_number + 1
        rp = nil

        if @processed_rows[i]
          rp = @processed_rows[i]
        else
          rp = BatchLoad::RowParse.new
          @processed_rows.merge!(i => rp)
        end 

        p = Protonym.new(
          name: n.name,
          year_of_publication: n.year.to_s,
          rank_class: Ranks.lookup(@nomenclature_code, n.rank),
          by: @user,
          also_create_otu: also_create_otu,
          project: @project,
          taxon_name_authors_attributes: taxon_name_authors_hash(n)
        )

        p.parent = (n.parent.nil? ? parent_taxon_name : parents[n.parent.id] )

        rp.objects[:protonyms] ||= []
        rp.objects[:protonyms].push(p)

        parents.merge!(n.id => p)

        total_lines = i if total_lines < i
      end

      @total_data_lines = total_lines

      true 
    end

    def taxon_name_authors_hash(taxonifi_name)
      author_attributes = [] 
      taxonifi_name.authors.each do |a| 
        suffix = a.suffix.join(' ') if !a.suffix.nil?
        author_attributes.push({
          last_name: a.last_name,
          first_name: [a.first_name, a.initials_string].compact.join(' '),
          suffix: suffix, # this might not be right, have to 2x check
        })
      end
      author_attributes
    end
  end
end
