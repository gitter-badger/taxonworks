FactoryGirl.define do
  factory :collection_object, traits: [:housekeeping] do
    factory :valid_collection_object do
      type 'Specimen'
      total 1
    end
  end
end
