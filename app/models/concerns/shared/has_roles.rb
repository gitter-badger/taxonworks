# Shared code for...
#
module Shared::HasRoles

  extend ActiveSupport::Concern
  included do
    has_many :roles, -> { order(:position) }, as: :role_object, dependent: :destroy
    has_many :people, through: :roles

    accepts_nested_attributes_for :roles, allow_destroy: true, reject_if: :all_blank
  end

  def has_roles?
    self.roles.size > 0
  end

end
