# Shared code for...
#
module Shared::AlternateValues
  extend ActiveSupport::Concern

  included do
    has_many :alternate_values, as: :alternate_value_object, validate: false, dependent: :destroy
  end

  def alternate_valued?
    self.alternate_values.any?
  end


  #returns a sorted Array of associated values
  # @param attr [Symbol]
  def all_values_for(attr)
    # eg. returns self.name from otu.all_values_for(name)
    values = [self.send(attr)]
    if alternate_valued?
      alternate_values.each do |v|
        values.push(v.value) if v.alternate_value_object_attribute == attr.to_s
      end
    end
    return values.sort
  end

  module ClassMethods

    # @return [Scope]
    # @param [:symbol] the column name/attribute
    # @param [String, Integer, etc] the value to look for
    # Use
    #   Source.with_alternate_value_on(:title, 'f
    #   oo')
    def with_alternate_value_on(a, b)
      joins(:alternate_values).where(alternate_values: {alternate_value_object_attribute: a, value: b})
    end

    # @return [Scope]
    # @param [:symbol] the column name/attribute
    # @param [String, Integer, etc] the value to look for
    # Use
    #   Source.with_any_value_for(:title, 'foo')
    def with_any_value_for(attribute, value)
      self_table = self.arel_table
      alternate_value_table = AlternateValue.arel_table

      a = alternate_value_table[:value].eq(value).and(alternate_value_table[:alternate_value_object_attribute].eq(attribute))
      b = self_table[attribute].eq(value)

      self.includes(:alternate_values).where(a.or(b).to_sql).references(:alternate_values)
    end

  end

end
