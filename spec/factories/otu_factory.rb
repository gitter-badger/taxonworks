FactoryGirl.define do
  factory :otu, traits: [:housekeeping] do
    factory :valid_otu do
      name 'my concept'
    end
  end
end