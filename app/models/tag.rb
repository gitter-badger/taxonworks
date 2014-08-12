class Tag < ActiveRecord::Base
  include Housekeeping
  
  acts_as_list scope: [:keyword_id]

  belongs_to :keyword
  belongs_to :tag_object, polymorphic: true

  validates :tag_object, presence: true
  validates :keyword, presence: true
  validate :keyword_is_allowed_on_object, :object_can_be_tagged_with_keyword

  validates_uniqueness_of :keyword_id, scope: [ :tag_object_id, :tag_object_type]

  def tag_object_class
    tag_object.class
  end

  def self.find_for_autocomplete(params)
    # todo: @mjy figure out how to reach through the table for a list of controlled_vocabulary_terms.names
    where('controlled_vocabulary_terms.name LIKE ?', "#{params[:term]}%")
  end

  protected

  def keyword_is_allowed_on_object
    return true if keyword.nil? || tag_object.nil? || !keyword.respond_to?(:can_tag) 
    if !keyword.can_tag.include?(tag_object.class.name)
      errors.add(:keyword, "this keyword class (#{tag_object.class}) can not be attached to a #{tag_object_type}")
    end
  end

  def object_can_be_tagged_with_keyword
    return true if keyword.nil? || tag_object.nil?  || !tag_object.respond_to?(:taggable_with) 
    if !tag_object.taggable_with.include?(keyword.class.name)
      errors.add(:tag_object, "this tag_object_type (#{tag_object.class}) can not be tagged with this keyword class (#{keyword.class})")
    end
  end

end
