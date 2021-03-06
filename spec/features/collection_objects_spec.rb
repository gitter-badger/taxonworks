require 'rails_helper'

describe 'CollectionObjects', :type => :feature do
  let(:index_path) { collection_objects_path }
  let(:page_index_name) { 'collection objects' }

  it_behaves_like 'a_login_required_and_project_selected_controller'

  context 'signed in as a user, with some records created' do
    before {
      sign_in_user_and_select_project
      10.times { factory_girl_create_for_user_and_project(:valid_specimen, @user, @project) }
    }

    describe 'GET /collection_objects' do
      before {
        visit collection_objects_path }

      it_behaves_like 'a_data_model_with_standard_index'

      # specify 'an index name is present' do
      #   expect(page).to have_content(page_index_name)
      # end
    end

    describe 'GET /collection_objects/list' do
      before { visit list_collection_objects_path }

      it_behaves_like 'a_data_model_with_standard_list'

      # specify 'that it renders without error' do
      #   expect(page).to have_content 'Listing Collection Objects'
      # end
    end

    describe 'GET /collection_objects/n' do
      before {
        visit collection_object_path(CollectionObject.second) 
      }

      it_behaves_like 'a_data_model_with_standard_show'
    end

    # TODO: Refactor this test.
    describe 'GET /api/v1/collection_objects/{id}' do
      before do
        @user.generate_api_access_token
        @user.save!
      end
      let(:valid_attributes) {
        FactoryGirl.build(:valid_collection_object).attributes.merge({ creator: @user, updater: @user, project: @project })
      }
      let(:collection_object) do 
        CollectionObject.create! valid_attributes.merge({ depictions_attributes: [
          { creator: @user, updater: @user, project: @project, image_attributes: { 
            creator: @user, updater: @user, project: @project, image_file: fixture_file_upload((Rails.root + 'spec/files/images/tiny.png'), 'image/png') } }]
          })
      end

      it 'Returns a response including URLs to images API endpoint' do
        visit "/api/v1/collection_objects/#{collection_object.to_param}?include[]=images&project_id=#{collection_object.project.to_param}&token=#{@user.api_access_token}"
        visit JSON.parse(page.body)['result']['images'].first['url'] + "?project_id=#{collection_object.project.to_param}&token=#{@user.api_access_token}"
        expect(JSON.parse(page.body)['result']['id']).to eq(collection_object.images.first.id)
      end
    end

    describe 'GET /api/v1/collection_objects/by_identifier/{identifier}' do
      before do
        @user.generate_api_access_token
        @user.save!
      end
      let(:valid_attributes) {
        FactoryGirl.build(:valid_collection_object).attributes.merge({ creator: @user, updater: @user, project: @project })
      }
      let(:namespace) { FactoryGirl.create(:valid_namespace, short_name: 'ABCD', by: @user) }
      let(:collection_object) do 
        CollectionObject.create! valid_attributes.merge( 
          { identifiers_attributes: [ { identifier: '123', type: 'Identifier::Local::CatalogNumber', namespace: namespace, by: @user, project: @project } ] })
      end

      it 'Returns a response including URLs to collection objects API endpoint' do
        visit "/api/v1/collection_objects/by_identifier/ABCD%20123?project_id=#{collection_object.project.to_param}&token=#{@user.api_access_token}"
        visit JSON.parse(page.body)['result']['collection_objects'].first['url'] + "?project_id=#{collection_object.project.to_param}&token=#{@user.api_access_token}"
        expect(JSON.parse(page.body)['result']['id']).to eq(collection_object.id)
      end
    end

  end

  context 'creating a new collection object' do
    before {
      sign_in_user_and_select_project # logged in and project selected
      visit collection_objects_path # when I visit the collection_objects_path
    }

    specify 'it has a new link' do
      expect(page).to have_link('new')
    end

    specify 'follow the new link & create a new collection object' do
      click_link('new') # when I click the new link
      fill_in 'Total', with: '1' # fill out the total field with 1
      fill_in 'Buffered collecting event', with: 'This is a label.\nAnd another line.' # fill in Buffered collecting event
      click_button 'Create Collection object' # when I click the 'Create Collection object' button
      # then I get the message "Collecting objection was successfully created"
      expect(page).to have_content('Collection object was successfully created.')
    end

  end
end
