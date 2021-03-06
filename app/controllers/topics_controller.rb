class TopicsController < ApplicationController
  include DataControllerConfiguration::ProjectDataControllerConfiguration

# @todo This format very different, should it be made same as other autocompletes?
  def autocomplete
    predicates = Topic.find_for_autocomplete(params.merge(project_id: sessions_current_project_id))

    data = predicates.collect do |t|
      str = t.name + ": " + t.definition
      {id:              t.id,
       label:           str,
       response_values: {
         params[:method] => t.id},
       label_html:      str
      }
    end

    render :json => data
  end

  def lookup_topic
    @topics = Topic.find_for_autocomplete(params.merge(project_id: sessions_current_project_id))
    render(:json => @topics.collect { |t|
             {
               label:     t.name,
               object_id: t.id,
               definition: t.definition
             }
           })
  end

  def get_definition
    @topic = Topic.find(params[:id])
    render(:json => {definition: @topic.definition})
  end

end
