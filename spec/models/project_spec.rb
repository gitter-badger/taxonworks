require 'spec_helper'

# Projects are extended by various related concerns.  When 
# we get to testing them we will have to do this here:
#   Rails.application.eager_load!

describe Project do

  let(:project) {FactoryGirl.build(:project)}

  context 'associations' do
    context 'has_many' do
      specify 'project_members' do
        expect(project).to respond_to(:project_members)
      end

      specify 'users' do
        expect(project).to respond_to(:users)
      end
    end
  end

  context 'validation' do
    before(:each) do
      project.valid?
    end

    context 'requires' do
      specify 'name' do
        expect(project.errors.include?(:name)).to be_true
      end

      specify 'valid with name' do
        project.name = 'Project!'
        expect(project.valid?).to be_true
      end
    end
  end


  specify 'valid_project factory if valid' do
    pr = FactoryGirl.build(:valid_project)
    expect(pr.valid?).to be_true
    pr.save!
  end

end
