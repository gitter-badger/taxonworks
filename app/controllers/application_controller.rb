class ApplicationController < ActionController::Base
  include Workbench::SessionsHelper
  include ProjectsHelper

  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found

  # In use
  attr_writer :is_data_controller, :is_task_controller 

  # Potentially used
  attr_writer   :meta_title, :meta_data, :site_name
  attr_accessor :meta_description, :meta_keywords, :page_title

  # In use 
  helper_method :is_data_controller?, :is_task_controller?

  # Potentially used.
  helper_method :meta_title, :meta_data, :site_name, :page_title

  before_filter :set_project_and_user_variables
  after_filter :log_user_recent_route
  after_filter :clear_project_and_user_variables

  # TODO: Make RecenRoutes modules that handles exceptions, only etc.
  def log_user_recent_route
    @sessions_current_user.add_recently_visited_to_footprint(request.fullpath, @recent_object) if @sessions_current_user
  end

  def set_project_and_user_variables
    $project_id = sessions_current_project_id  # This also sets @sessions_current_project_id
    $user_id = sessions_current_user_id 
  end

  def clear_project_and_user_variables
    $project_id = nil 
    $user_id = nil 
  end

  # Returns true if the controller is that of data class. See controllers/concerns/data_controller_configuration/ concern.
  # Data controllers can not be task controllers.
  def is_data_controller?
    @is_data_controller
  end

  # Returns true if the controller is a task controller. See controllers/concerns/task_controller_configuration/ concern.
  # Task controllers can not be data controllers.
  def is_task_controller?
    @is_task_controller
  end

  def meta_title
    @meta_title ||= [@meta_title.presence || @page_title.presence, site_name].
                    compact.join(' | ')
  end

  def meta_data
    @meta_data ||= {
      description: @meta_description,
      keywords: @meta_keywords
    }.delete_if{ |k, v| v.nil? }
  end

  def site_name
    @site_name ||= 'TaxonWorks'
  end

  def digest_cookie(file, key)
    sha256 = Digest::SHA256.file(file)
    cookies[key] = sha256.hexdigest
  end

  def digested_cookie_exists?(file, key)
    sha256 = Digest::SHA256.file(file)
    cookies[key] == sha256.hexdigest
  end

  private
 
   def record_not_found
     render plain: "404 Not Found", status: 404
   end

  def disable_turbolinks
    @no_turbolinks = true
  end



end
