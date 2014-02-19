require 'spec_helper'

describe "taxon_name_relationships/edit" do
  before(:each) do
    @taxon_name_relationship = assign(:taxon_name_relationship, stub_model(TaxonNameRelationship,
      :subject_taxon_name_id => 1,
      :object_taxon_name_id => 1,
      :type => "",
      :created_by_id => 1,
      :updated_by_id => 1,
      :project_id => 1,
      :source_id => 1
    ))
  end

  it "renders the edit taxon_name_relationship form" do
    render

    # Run the generator again with the --webrat flag if you want to use webrat matchers
    assert_select "form[action=?][method=?]", taxon_name_relationship_path(@taxon_name_relationship), "post" do
      assert_select "input#taxon_name_relationship_subject_taxon_name_id[name=?]", "taxon_name_relationship[subject_taxon_name_id]"
      assert_select "input#taxon_name_relationship_object_taxon_name_id[name=?]", "taxon_name_relationship[object_taxon_name_id]"
      assert_select "input#taxon_name_relationship_type[name=?]", "taxon_name_relationship[type]"
      assert_select "input#taxon_name_relationship_created_by_id[name=?]", "taxon_name_relationship[created_by_id]"
      assert_select "input#taxon_name_relationship_updated_by_id[name=?]", "taxon_name_relationship[updated_by_id]"
      assert_select "input#taxon_name_relationship_project_id[name=?]", "taxon_name_relationship[project_id]"
      assert_select "input#taxon_name_relationship_source_id[name=?]", "taxon_name_relationship[source_id]"
    end
  end
end