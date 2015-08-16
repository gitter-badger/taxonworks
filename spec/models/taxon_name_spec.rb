require 'rails_helper'

describe TaxonName, type: :model, group: [:nomenclature] do

  let(:taxon_name) { TaxonName.new }

  context 'using before :all' do
    before(:all) do
      @subspecies = FactoryGirl.create(:iczn_subspecies)
      @species    = @subspecies.ancestor_at_rank('species')
      @subgenus   = @subspecies.ancestor_at_rank('subgenus')
      @genus      = @subspecies.ancestor_at_rank('genus')
      @tribe      = @subspecies.ancestor_at_rank('tribe')
      @family     = @subspecies.ancestor_at_rank('family')
      @root       = @subspecies.root
    end

    after(:all) do
      TaxonNameRelationship.delete_all
      TaxonName.delete_all 
      # TODO: find out why this exists and resolve - presently leaving sources in the models
      Source.delete_all 
    end

    context 'double checking FactoryGirl' do
      specify 'is building all related names for respective models' do
        expect(@subspecies.ancestors.length).to be >= 10
        (@subspecies.ancestors + [@subspecies]).each do |i|
          if i.name != 'Root'
            expect(i.valid?).to be_truthy, "#{i.name} is not valid [#{i.errors.messages}], and is expected to be so- was your test db reset properly?"
          end
        end
      end

      specify 'ICN' do
        variety = FactoryGirl.create(:icn_variety)
        expect(variety.ancestors.length).to be >= 17
        (variety.ancestors + [variety]).each do |i|
          if i.name != 'Root'
            expect(i.valid?).to be_truthy, "#{i.name} is not valid [#{i.errors.messages}], and is expected to be so- was your test db reset properly?"
          end
        end
        expect(variety.root.id).to eq(@species.root.id)
        expect(variety.cached_higher_classification).to eq('Plantae:Aphyta:Aphytina:Aopsida:Aidae:Aales:Aineae:Aaceae:Aoideae:Aeae:Ainae')
        expect(variety.cached_author_year).to eq('McAtee (1900)')
        expect(variety.cached_html).to eq('<em>Aus</em> (<em>Aus</em> sect. <em>Aus</em> ser. <em>Aus</em>) <em>aaa bbb</em> var. <em>ccc</em>')

        basionym = FactoryGirl.create(:icn_variety, name: 'basionym', parent_id: variety.ancestor_at_rank('species').id, source_id: nil, verbatim_author: 'Linnaeus')
        r  = FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: basionym, object_taxon_name: variety, type: 'TaxonNameRelationship::Icn::Unaccepting::Usage::Basionym')
        variety.reload
        expect(variety.save).to be_truthy
        expect(variety.cached_author_year).to eq('(Linnaeus) McAtee (1900)')
      end
    end

    context 'associations' do
      specify 'responses to source' do
        expect(taxon_name).to respond_to(:source)
      end

      context 'taxon_name_relationships' do
        before(:all) do
          @type_of_genus  = FactoryGirl.create(:iczn_genus, name: 'Bus', parent: @family)
          @original_genus = FactoryGirl.create(:iczn_genus, name: 'Cus', parent: @family)
          @taxon_name     = FactoryGirl.create(:iczn_species, name: 'aus', parent: @type_of_genus)
          @relationship1  = FactoryGirl.create(:type_species_relationship, subject_taxon_name: @taxon_name, object_taxon_name: @type_of_genus)
          @relationship2  = FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: @original_genus, object_taxon_name: @taxon_name, type: 'TaxonNameRelationship::OriginalCombination::OriginalGenus')
        end

        specify 'respond to taxon_name_relationships' do
          expect(taxon_name.taxon_name_relationships << TaxonNameRelationship.new()).to be_truthy
        end

        context 'methods related to taxon_name_relationship associations (returning Array)' do
          # TaxonNameRelationships in which the taxon name is the subject
          specify 'respond to taxon_name_relationships' do
            expect(@taxon_name).to respond_to (:taxon_name_relationships)
            expect(@taxon_name.taxon_name_relationships.map { |i| i.type_name }).to eq([@relationship1.type_name])
          end

          # TaxonNameRelationships in which the taxon name is the subject OR object
          specify 'respond to all_taxon_name_relationships' do
            expect(@taxon_name).to respond_to (:all_taxon_name_relationships)
            expect(@taxon_name.all_taxon_name_relationships.map{ |i| i.type_name }).to contain_exactly(@relationship1.type_name, @relationship2.type_name)
          end

          # TaxonNames related by all_taxon_name_relationships
          specify 'respond to related_taxon_names' do
            expect(@taxon_name.related_taxon_names.sort).to eq([@type_of_genus, @original_genus].sort)
          end

          specify 'respond to unavailable_or_invalid' do
            relationship = FactoryGirl.build(:taxon_name_relationship, subject_taxon_name: @original_genus, object_taxon_name: @type_of_genus, type: 'TaxonNameRelationship::Iczn::Invalidating::Synonym')
            expect(relationship.save).to be_truthy
            expect(@type_of_genus.unavailable_or_invalid?).to be_falsey
            expect(@original_genus.unavailable_or_invalid?).to be_truthy
          end
        end
      end
    end

    context 'gbif_status' do
      let(:t1) { FactoryGirl.create(:iczn_species, name: 'aus', parent: @genus) }
      let(:t2) { FactoryGirl.create(:iczn_species, name: 'bus', parent: @genus) } 
      let!(:r2) { FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: t2, object_taxon_name: t1, type: 'TaxonNameRelationship::Iczn::Invalidating::Synonym::Subjective') } # Note the bang (!)

      specify 'valid species' do
        expect(t1.gbif_status_array).to eq(['valid'])
      end

      specify 'synonym' do
        expect(t2.gbif_status_array).to eq(['invalidum'])
      end

      specify 'nomen nudum' do
        c = FactoryGirl.create(:taxon_name_classification, taxon_name: t2, type: 'TaxonNameClassification::Iczn::Unavailable::NomenNudum::ConditionallyProposedAfter1960')
        t2.reload
        expect(t2.gbif_status_array).to eq(['nudum'])
      end
    end

    context 'instance methods' do
      context 'verbatim_author' do
        specify 'parens are allowed' do
          taxon_name.verbatim_author = '(Smith)'
          taxon_name.valid?
          expect(taxon_name.errors.include?(:verbatim_author)).to be_falsey
        end
      end

      context 'author_string' do
        specify 'verbatim_author absent; source with a single author' do
          source = FactoryGirl.create(:src_dmitriev)
          taxon_name.source = source
          expect(taxon_name.year_integer).to eq(1940)
          expect(taxon_name.author_string).to eq('Dmitriev')
          source.destroy
        end
        specify 'verbatim_author absent; source with a multiple authors' do
          source = FactoryGirl.create(:src_mult_authors)
          taxon_name.source = source
          expect(taxon_name.author_string).to eq('Thomas, Fowler & Hunt')
          source.destroy
        end
        specify 'verbatim_author present' do
          taxon_name.verbatim_author = 'Linnaeus'
          taxon_name.year_of_publication = 1999
          expect(taxon_name.year_integer).to eq(1999)
          expect(taxon_name.author_string).to eq('Linnaeus')
        end
      end

      context 'rank_class' do
        specify 'returns the passed value when not yet validated and not a NomenclaturalRank' do
          taxon_name.rank_class = 'foo'
          expect(taxon_name.rank_class).to eq('foo')
        end
        specify 'returns a NomenclaturalRank when available' do
          taxon_name.rank_class = Ranks.lookup(:iczn, 'order')
          expect(taxon_name.rank_class).to eq(NomenclaturalRank::Iczn::HigherClassificationGroup::Order)
          taxon_name.rank_class = Ranks.lookup(:icn, 'family')
          expect(taxon_name.rank_class).to eq(NomenclaturalRank::Icn::FamilyGroup::Family)
        end
      end

      context 'rank' do
        specify 'returns nil when not a NomenclaturalRank (i.e. invalidly_published)' do
          taxon_name.rank_class = 'foo'
          expect(taxon_name.rank).to be_nil
        end
        specify 'returns vernacular when rank_class is a NomenclaturalRank (i.e. validly_published)' do
          taxon_name.rank_class = Ranks.lookup(:iczn, 'order')
          expect(taxon_name.rank).to eq('order')
          taxon_name.rank_class = Ranks.lookup(:icn, 'family')
          expect(taxon_name.rank).to eq('family')
        end
      end

      context 'nomenclature_date' do
        let(:f1) {FactoryGirl.create(:relationship_family, year_of_publication: 1900)}
        let(:f2) {FactoryGirl.create(:relationship_family, year_of_publication: 1950)} 
        specify 'simple case' do
          expect(f2.nomenclature_date.year).to eq(1950)
        end
        specify 'family replacement before 1961' do
          r = FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: f2, object_taxon_name: f1, type: 'TaxonNameRelationship::Iczn::PotentiallyValidating::FamilyBefore1961')
          expect(f2.nomenclature_date.year).to eq(1900)
        end
      end
    end

    context 'hierarchy' do
      context 'rank related' do
        context 'ancestor_at_rank' do
          specify 'returns an ancestor at given rank' do
            expect(@genus.ancestor_at_rank('family').name).to eq('Cicadellidae')
          end
          specify "returns nil when given rank and name's rank are the same" do
            expect(@genus.ancestor_at_rank('genus')).to be_nil
          end
          specify "returns nil when given rank is lower than name's rank" do
            expect(@genus.ancestor_at_rank('species')).to be_nil
          end
          specify 'returns nil when given rank is not present in the parent chain' do
            expect(@genus.ancestor_at_rank('epifamily')).to be_nil
          end
        end
      end
    end

    context 'soft validation' do
      specify 'run all soft validations without error' do
        expect(taxon_name.soft_validate).to be_truthy
      end
    end

    context 'validation' do
      before(:each) do
        taxon_name.valid?
      end

      context 'required fields' do

        specify 'type' do
          expect(taxon_name.type).to eq('Protonym')
        end
      end

      context 'proper taxon rank' do
        specify 'parent rank is higher' do
          taxon_name.update(rank_class: Ranks.lookup(:iczn, 'Genus'), name: 'Aus')
          taxon_name.parent = @species
          taxon_name.valid?
          expect(taxon_name.errors.include?(:parent_id)).to be_truthy
        end
        specify 'child rank is lower' do
          phylum             = FactoryGirl.create(:iczn_phylum)
          kingdom            = phylum.ancestor_at_rank('kingdom')
          kingdom.rank_class = Ranks.lookup(:iczn, 'subphylum')
          kingdom.valid?
          expect(kingdom.errors.include?(:rank_class)).to be_truthy
        end

        specify 'a new taxon rank in the same group' do
          t            = FactoryGirl.create(:iczn_kingdom)
          t.rank_class = Ranks.lookup(:iczn, 'genus')
          t.valid?
          expect(t.errors.include?(:rank_class)).to be_truthy
        end
      end

      context 'source' do
        specify 'when provided, is type Source::Bibtex' do
          h                 = FactoryGirl.build(:source_human)
          taxon_name.source = h
          taxon_name.valid?
          expect(taxon_name.errors.include?(:source_id)).to be_truthy
          b                 = FactoryGirl.build(:source_bibtex)
          taxon_name.source = b
          taxon_name.valid?
          expect(taxon_name.errors.include?(:source_id)).to be_falsey
        end
      end

     context 'name' do
        context 'validate cached values' do
          specify 'ICZN ' do
            expect(@subspecies.cached_higher_classification).to eq('Animalia:Arthropoda:Insecta:Hemiptera:Cicadellidae:Typhlocybinae:Erythroneurini:Erythroneurina')
            expect(@subspecies.cached_author_year).to eq('McAtee, 1900')
            expect(@subspecies.cached_html).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>) <em>vitis vitata</em>')
          end

          specify 'fossil' do
            sp = FactoryGirl.create(:relationship_species, parent: @genus)
            c = FactoryGirl.create(:taxon_name_classification, taxon_name: sp, type: 'TaxonNameClassification::Iczn::Fossil')
            sp.reload
            expect(sp.get_full_name_html).to eq('&#8224; <em>Erythroneura vitis</em>')
            expect(sp.cached_html).to eq('&#8224; <em>Erythroneura vitis</em>')
            expect(sp.cached).to eq('Erythroneura vitis')
          end

          specify 'hybrid' do
            sp = FactoryGirl.create(:relationship_species, parent: @genus)
            c = FactoryGirl.create(:taxon_name_classification, taxon_name: sp, type: 'TaxonNameClassification::Icn::Hybrid')
            sp.reload
            expect(sp.cached_html).to eq('&#215; <em>Erythroneura vitis</em>')
            expect(sp.cached).to eq('Erythroneura vitis')
          end

          specify 'ICZN subspecies' do
            expect(@subspecies.cached_higher_classification).to eq('Animalia:Arthropoda:Insecta:Hemiptera:Cicadellidae:Typhlocybinae:Erythroneurini:Erythroneurina')
            expect(@subspecies.cached_author_year).to eq('McAtee, 1900')
            expect(@subspecies.cached_html).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>) <em>vitis vitata</em>')
          end

          specify 'ICZN species misspelling' do
            sp = FactoryGirl.create(:iczn_species, verbatim_author: 'Smith', year_of_publication: 2000, parent: @genus)
            sp.iczn_set_as_misapplication_of = @species
            expect(sp.save).to be_truthy
            expect(sp.cached_author_year).to eq('Smith, 2000 nec McAtee, 1830')
          end

          context 'ICZN family (behaviour for names above genus group)' do
            specify 'cached_higher_classification' do
              expect(@family.cached_higher_classification).to eq('Animalia:Arthropoda:Insecta:Hemiptera:Cicadellidae')
            end

            specify 'cached_author_year' do
              expect(@family.cached_author_year).to eq('Say, 1800')
            end

            specify 'cached_html' do
              expect(@family.cached_html).to eq(@family.name)
            end
          end

          specify 'nil author and year - cached value should be empty' do
            t = @subspecies.ancestor_at_rank('kingdom')
            expect(t.cached_author_year).to eq('')
          end

          specify 'parent with parentheses' do
            c = FactoryGirl.build(:relationship_species, parent: nil, verbatim_author: '(Dmitriev)', year_of_publication: 2000)
            expect(c.get_author_and_year).to eq('(Dmitriev, 2000)')
          end

          specify 'parent without parentheses' do
            c = FactoryGirl.build(:relationship_species, parent: nil, verbatim_author: 'Dmitriev', year_of_publication: 2000)
            expect(c.get_author_and_year).to eq('Dmitriev, 2000')
          end

          specify 'no original combination relationships' do
            ssp = FactoryGirl.build(:iczn_subspecies, parent: @species)
            expect(ssp.get_original_combination.nil?).to be_truthy
            expect(ssp.get_genus_species(:original, :self).nil?).to be_truthy
            expect(ssp.get_genus_species(:original, :alternative).nil?).to be_truthy
#            expect(ssp.get_genus_species(:current, :self).nil?).to be_falsey
#            expect(ssp.get_genus_species(:current, :alternative).nil?).to be_falsey
            ssp.save
            expect(ssp.cached_original_combination.nil?).to be_truthy
            expect(ssp.cached_primary_homonym.nil?).to be_truthy
            expect(ssp.cached_primary_homonym_alternative_spelling.nil?).to be_truthy
            expect(ssp.cached_secondary_homonym).to eq('Erythroneura vitata')
            expect(ssp.cached_secondary_homonym_alternative_spelling).to eq('Erythroneura uitata')
          end

          specify 'original genus subgenus' do
            expect(@subspecies.get_original_combination.nil?).to be_truthy
            @subspecies.original_genus = @genus
            @subspecies.reload
            expect(@subspecies.get_original_combination).to eq('<em>Erythroneura vitata</em>')
            @subspecies.original_subgenus = @genus
            @subspecies.reload
            expect(@subspecies.get_original_combination).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>) <em>vitata</em>')
            @subspecies.original_species = @species
            @subspecies.reload
            expect(@subspecies.get_original_combination).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>) <em>vitis vitata</em>')
            @subspecies.original_variety = @subspecies
            @subspecies.reload
            expect(@subspecies.get_original_combination).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>) <em>vitis</em> var. <em>vitata</em>')

            expect(@subgenus.get_original_combination.nil?).to be_truthy
            @subgenus.original_genus = @genus
            @subgenus.reload
            expect(@subgenus.get_original_combination).to eq('<em>Erythroneura</em> (<em>Erythroneura</em>)')
          end

          specify 'different gender' do
            s = FactoryGirl.create(:iczn_species, parent: @genus)
            expect(s.save).to be_truthy
            expect(s.get_full_name_html).to eq('<em>Erythroneura vitis</em>')
            s.masculine_name = 'vitus'
            s.feminine_name  = 'vita'
            s.neuter_name    = 'vitum'
            expect(s.save).to be_truthy
            gender = FactoryGirl.create(:taxon_name_classification, taxon_name: @genus, type: 'TaxonNameClassification::Latinized::Gender::Masculine')
            expect(s.get_full_name_html).to eq('<em>Erythroneura vitus</em>')
            gender.type = 'TaxonNameClassification::Latinized::Gender::Feminine'
            expect(gender.save).to be_truthy
            expect(s.get_full_name_html).to eq('<em>Erythroneura vita</em>')
            gender.type = 'TaxonNameClassification::Latinized::Gender::Neuter'
            expect(gender.save).to be_truthy
            expect(s.get_full_name_html).to eq('<em>Erythroneura vitum</em>')
          end

          specify 'misspelled original combination' do
            g = FactoryGirl.create(:relationship_genus, name: 'Errorneura')
            g.iczn_set_as_misspelling_of = @genus
            expect(g.save).to be_truthy
            @subspecies.original_genus = g
            @subspecies.reload
            expect(g.get_full_name_html).to eq('<em>Errorneura</em> [sic]')
            expect(@subspecies.get_original_combination).to eq('<em>Errorneura</em> [sic] <em>vitata</em>')
            expect(@subspecies.get_author_and_year).to eq ('(McAtee, 1900)')
          end
         
          # What code is this supposed to catch? 
          specify 'moving nominotypical taxon' do
            sp           = FactoryGirl.create(:iczn_species, name: 'aaa', parent: @genus)
            subsp        = FactoryGirl.create(:iczn_subspecies, name: 'aaa', parent: sp)
            subsp.parent = @species
            subsp.valid?
            expect(subsp.errors.include?(:parent_id)).to be_truthy
          end

          context 'cached homonyms' do
            before(:each) do
              @g1 = FactoryGirl.create(:relationship_genus, name: 'Aus', parent: @tribe, year_of_publication: 1999)
              @g2 = FactoryGirl.create(:relationship_genus, name: 'Bus', parent: @tribe, year_of_publication: 2000)
              @s1 = FactoryGirl.create(:relationship_species, name: 'vitatus', parent: @g1, year_of_publication: 1999)
              @s2 = FactoryGirl.create(:relationship_species, name: 'vitatta', parent: @g2, year_of_publication: 2000)
              expect(@family.valid?).to be_truthy
              expect(@tribe.valid?).to be_truthy
              expect(@g1.valid?).to be_truthy
              expect(@g2.valid?).to be_truthy
              expect(@s1.valid?).to be_truthy
              expect(@s2.valid?).to be_truthy
            end

            specify 'primary homonym' do
              expect(@family.cached_primary_homonym).to eq('Cicadellidae')
              expect(@tribe.cached_primary_homonym).to eq('Erythroneurini')
              expect(@tribe.cached_primary_homonym_alternative_spelling).to eq('Erythroneuridae')
              expect(@g1.cached_primary_homonym).to eq('Aus')
              expect(@g2.cached_primary_homonym).to eq('Bus')
              expect(@s1.cached_primary_homonym.blank?).to be_truthy
              expect(@s2.cached_primary_homonym.blank?).to be_truthy
            end

            specify 'secondary homonym' do
              expect(@family.cached_secondary_homonym.blank?).to be_truthy
              expect(@g1.cached_secondary_homonym.blank?).to be_truthy
              expect(@g2.cached_secondary_homonym.blank?).to be_truthy
              expect(@s1.save).to be_truthy
              expect(@s1.cached_secondary_homonym).to eq('Aus vitatus')
              expect(@s2.save).to be_truthy
              expect(@s2.cached_secondary_homonym).to eq('Bus vitatta')
            end

            specify 'original genus' do
              @s1.original_genus = @g1
              @s2.original_genus = @g1
              expect(@s1.save).to be_truthy
              expect(@s2.save).to be_truthy
              @s1.reload
              @s2.reload
              expect(@s1.cached_primary_homonym).to eq('Aus vitatus')
              expect(@s2.cached_primary_homonym).to eq('Aus vitatta')
              @s1.save 
              expect(@s1.cached_secondary_homonym).to eq('Aus vitatus')
              @s2.save
              expect(@s2.cached_secondary_homonym).to eq('Bus vitatta')
              expect(@s1.cached_primary_homonym_alternative_spelling).to eq('Aus uitata')
              expect(@s2.cached_primary_homonym_alternative_spelling).to eq('Aus uitata')
              expect(@s1.cached_secondary_homonym_alternative_spelling).to eq('Aus uitata')
              expect(@s2.cached_secondary_homonym_alternative_spelling).to eq('Bus uitata')
            end
          end

          context 'mismatching cached values' do
            before(:all) do
              @g = FactoryGirl.create(:relationship_genus, name: 'Cus', parent: @family)
              @s = FactoryGirl.build(:relationship_species, name: 'dus', parent: @g)
            end
            specify 'missing cached values' do
              @s.save
              @s.update_column(:cached_original_combination, 'aaa')
              @s.soft_validate(:cached_names)
              expect(@s.soft_validations.messages_on(:base).count).to eq(1)
              @s.fix_soft_validations
              @s.soft_validate(:cached_names)
              expect(@s.soft_validations.messages_on(:base).empty?).to be_truthy
            end
          end

        end

        context 'when rank ICZN family' do
          specify "is validly_published when ending in '-idae'" do
            @family.valid?
            expect(@family.errors.include?(:name)).to be_falsey
          end

          specify "is invalidly_published when not ending in '-idae'" do
            taxon_name.name       = 'Aus'
            taxon_name.rank_class = Ranks.lookup(:iczn, 'family')
            taxon_name.valid?
            expect(taxon_name.errors.include?(:name)).to be_truthy
          end

          specify 'is invalidly_published when not capitalized' do
            taxon_name.name       = 'fooidae'
            taxon_name.rank_class = Ranks.lookup(:iczn, 'family')
            taxon_name.valid?
            expect(taxon_name.errors.include?(:name)).to be_truthy
          end

          specify 'species name starting with upper case' do
            taxon_name.name       = 'Aus'
            taxon_name.rank_class = Ranks.lookup(:iczn, 'species')
            taxon_name.valid?
            expect(taxon_name.errors.include?(:name)).to be_truthy
            #taxon_name.soft_validate(:validate_name)
            #expect(taxon_name.soft_validations.messages_on(:name).count).to eq(1)
          end
        end

        context 'when rank ICN family' do
          specify "is validly_published when ending in '-aceae'" do
            taxon_name.name       = 'Aaceae'
            taxon_name.rank_class = Ranks.lookup(:icn, 'family')
            taxon_name.valid?
            expect(taxon_name.errors.include?(:name)).to be_falsey
          end
          specify "is invalidly_published when not ending in '-aceae'" do
            taxon_name.name       = 'Aus'
            taxon_name.rank_class = Ranks.lookup(:icn, 'family')
            taxon_name.valid?
            expect(taxon_name.errors.include?(:name)).to be_truthy
          end
        end
      end

      context 'relationships' do
        specify 'invalid parent' do
          g  = FactoryGirl.create(:iczn_genus, parent: @family)
          s  = FactoryGirl.create(:iczn_species, parent: g)
          r1 = FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: g, object_taxon_name: @genus, type: 'TaxonNameRelationship::Iczn::Invalidating::Synonym')
          c1 = FactoryGirl.create(:taxon_name_classification, taxon_name: g, type: 'TaxonNameClassification::Iczn::Unavailable::NomenNudum')
          s.soft_validate(:parent_is_valid_name)
          g.soft_validate(:parent_is_valid_name)
          expect(s.soft_validations.messages_on(:parent_id).count).to eq(1)
          expect(g.soft_validations.messages_on(:base).count).to eq(1)
          s.fix_soft_validations
          s.soft_validate(:parent_is_valid_name)
          expect(s.soft_validations.messages_on(:parent_id).empty?).to be_truthy
        end
      end

      context 'misspellings' do
        specify 'valid iczn names' do
          s = FactoryGirl.build_stubbed(:relationship_species, parent: @genus, name: 'aus')
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_truthy
          s.name = 'a-aus'
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_truthy
          s.name = 'aus-aus'
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_falsey
        end

        xspecify 'valid icn names' do
          gen = FactoryGirl.create(:icn_genus)
          [ 'aus', 'a-aus', 'aus-aus', 'aus × bus', '× aus' ].each do |name|
            s = FactoryGirl.build_stubbed(:icn_species, parent: gen, name: name )
            expect(s.valid?).to be_truthy, "failed for #{name}"
            s.soft_validate(:validate_name)
            expect(s.soft_validations.messages_on(:name).empty?).to be_truthy, "failed for #{name}"
          end
          s = FactoryGirl.build_stubbed(:icn_species, parent: nil, name: 'aus aus')
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_falsey
        end

        xspecify 'unavailable' do
          s = FactoryGirl.create(:relationship_species, parent: @genus, name: 'aus a')
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).count).to eq(1)
          c1 = FactoryGirl.create(:taxon_name_classification, taxon_name: s, type: 'TaxonNameClassification::Iczn::Unavailable::LessThanTwoLetters')
          s.reload
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_truthy
        end

        xspecify 'misspelling' do
          s = FactoryGirl.create(:relationship_species, parent: @genus, name: 'a a')
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).count).to eq(1)
          r1 = FactoryGirl.create(:taxon_name_relationship, subject_taxon_name: s, object_taxon_name: @species, type: 'TaxonNameRelationship::Iczn::Invalidating::Usage::Misspelling')
          s.reload
          s.soft_validate(:validate_name)
          expect(s.soft_validations.messages_on(:name).empty?).to be_truthy
        end

      end

      context 'possible homonyms' do
        specify 'name_with_alternative_spelling' do
          s = FactoryGirl.build_stubbed(:relationship_species, parent: nil, name: 'rubbus')
          expect(s.name_with_alternative_spelling).to eq('ruba')
          s.name = 'aiorum'
          expect(s.name_with_alternative_spelling).to eq('aora')
          s.name = 'nigrocinctus'
          expect(s.name_with_alternative_spelling).to eq('nigricinta')
        end
        specify 'name_with_alternative_spelling and no family_group_base matches fails now' do
          s = FactoryGirl.build_stubbed(:relationship_family, parent: nil, name: 'Aini')
          expect(s.name_with_alternative_spelling).to eq('Aidae')
          s.name = 'Ayni'
          expect(s.name_with_alternative_spelling).to eq('Ayni')
        end
      end
    end
  end # END before(:all) spinups

  context 'after save' do
    context 'create_new_combination_if_absent' do
      specify 'new combination' do
        expect(TaxonName.with_cached_html('<em>Erythroneura vitis</em>').count).to eq(0)
        sp = FactoryGirl.build(:relationship_species)
        sp.save
        expect(sp.cached_html).to eq('<em>Erythroneura vitis</em>')
        expect(TaxonName.with_cached_html('<em>Erythroneura vitis</em>').count).to eq(1)
        sp.save
        expect(TaxonName.with_cached_html('<em>Erythroneura vitis</em>').count).to eq(1)
      end
    end

    context 'set_cached_names_for_dependants' do
      specify 'dependants' do
        family = FactoryGirl.create(:relationship_family)
        genus1 = FactoryGirl.create(:relationship_genus, name: 'Aus', parent: family)
        genus2 = FactoryGirl.create(:relationship_genus, name: 'Bus', parent: family)
        species = FactoryGirl.create(:relationship_species, name: 'aus', parent: genus1, verbatim_author: 'Linnaeus', year_of_publication: 1758)
        species.original_genus = genus2
        species.source_classified_as = family
        species.save
        species.reload

        t = species.created_at
        expect(species.cached).to eq('Aus aus')
        expect(species.cached_html).to eq('<em>Aus aus</em>')
        expect(species.cached_original_combination).to eq('<em>Bus aus</em>')
        expect(species.cached_author_year).to eq('(Linnaeus, 1758)')
        expect(species.cached_classified_as).to eq(' (as Erythroneuridae)')
        genus1.name = 'Cus'
        genus1.save
        species.reload
        expect(species.cached).to eq('Cus aus')
        expect(species.cached_html).to eq('<em>Cus aus</em>')
        expect(species.cached_original_combination).to eq('<em>Bus aus</em>')
        genus2.name = 'Dus'
        genus2.save
        species.reload
        expect(species.cached).to eq('Cus aus')
        expect(species.cached_html).to eq('<em>Cus aus</em>')
        expect(species.cached_original_combination).to eq('<em>Dus aus</em>')
        family.name = 'Cicadellidae'
        family.save
        species.reload
        expect(species.cached_classified_as).to eq(' (as Cicadellidae)')
        expect(species.created_at).to eq(t)
      end
      specify 'original_combination' do
      end
    end
  end

  # DO NOT USE before(:all) OR any factory that creates the full hierarchy here
  context 'clean slates' do
    context 'methods from awesome_nested_set' do
      let(:p) { Project.create(name: 'Taxon-name root test.', without_root_taxon_name: true) }
      let(:root1) { FactoryGirl.create(:root_taxon_name, project_id: 1) }
      let(:root2) { FactoryGirl.build(:root_taxon_name) }

      context 'root names' do
        specify 'a second root (parent is nul) in a given project is not allowed' do
          expect(root1.parent).to be_nil
          expect(root2.parent).to be_nil
          expect(root1.project_id).to eq(1)
          expect(root2.project_id).to eq(1)
          expect(root2.valid?).to be_falsey
          expect(root2.errors.include?(:parent_id)).to be_truthy
        end

        specify 'permit multiple roots in different projects' do
          root2.project_id = p.id
          expect(root2.parent).to be_nil
          expect(root2.valid?).to be_truthy
        end

        specify 'roots can be saved without raising' do
          root2.project_id = p.id
          expect(root2.save).to be_truthy
          expect(root1.save).to be_truthy
        end

        specify 'scope project_root' do
          root1.save
          expect(TaxonName.project_root(1).first).to eq(root1)
        end
      end

      # run through the awesome_nested_set methods: https://github.com/collectiveidea/awesome_nested_set/wiki/_pages
      context 'handle a simple hierarchy with awesome_nested_set' do
        let!(:new_root ) {  FactoryGirl.create(:root_taxon_name, project: p)}
        let!(:family1  ) { Protonym.create!(rank_class: Ranks.lookup(:iczn, 'family'),  name: 'Aidae', parent: new_root, project: p) }
        let!(:genus1   ) { Protonym.create!(rank_class: Ranks.lookup(:iczn, 'genus'),   name: 'Aus',   parent: family1,  project: p) }
        let!(:genus2   ) { Protonym.create!(rank_class: Ranks.lookup(:iczn, 'genus'),   name: 'Bus',   parent: family1,  project: p) }
        let!(:species1 ) { Protonym.create!(rank_class: Ranks.lookup(:iczn, 'species'), name: 'aus',   parent: genus1,   project: p) }
        let!(:species2 ) { Protonym.create!(rank_class: Ranks.lookup(:iczn, 'species'), name: 'bus',   parent: genus2,   project: p) }

        specify 'root' do
          expect(species1.root).to eq(new_root)
        end

        specify 'ancestors' do
          expect(new_root.ancestors.size).to eq(0)
          expect(family1.ancestors.size).to eq(1)
          expect(family1.ancestors).to eq([new_root])
          expect(species1.ancestors.size).to eq(3)
        end

        specify 'parent' do
          expect(new_root.parent).to eq(nil)
          expect(family1.parent).to eq(new_root)
        end

        specify 'leaves' do
          new_root.reload
          expect(new_root.leaves.to_a).to eq([species1, species2])
        end

        specify 'move_to_child_of' do
          species2.move_to_child_of(genus1)
          genus2.reload
          expect(genus2.children).to eq([])
          genus1.reload
          expect(genus1.children.to_a).to eq([species1, species2])
        end

        context 'housekeeping with ancestors and descendants' do
          xspecify 'updated_on is not touched for ancestors when a child moves' do
            g1_updated = genus1.updated_at
            g1_created = genus1.created_at
            g2_updated = genus2.updated_at
            g2_created = genus2.created_at
            species1.move_to_child_of(genus2)
            expect(genus1.updated_at).to eq(g1_updated)
            expect(genus1.created_at).to eq(g1_created)
            expect(genus2.updated_at).to eq(g2_updated)
            expect(genus2.created_at).to eq(g2_created)
          end
        end
      end
    end
  end

  context 'concerns' do
    it_behaves_like 'data_attributes'
    it_behaves_like 'identifiable'
    it_behaves_like 'notable'
    it_behaves_like 'is_data'
  end

end
