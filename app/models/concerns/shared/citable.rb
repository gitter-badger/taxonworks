module Shared::Citable
  extend ActiveSupport::Concern

  included do
    has_many :citations, as: :citation_object
  end 

  def cited?
    self.citations.count > 0
  end

end