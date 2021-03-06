class OtusController < ApplicationController
  include DataControllerConfiguration::ProjectDataControllerConfiguration

  before_action :set_otu, only: [:show, :edit, :update, :destroy]

  # GET /otus
  # GET /otus.json
  def index
    @recent_objects = Otu.recent_from_project_id(sessions_current_project_id).order(updated_at: :desc).limit(10)
    render '/shared/data/all/index' 
  end

  # GET /otus/1
  # GET /otus/1.json
  def show
  end

  # GET /otus/new
  def new
    @otu = Otu.new
  end

  # GET /otus/1/edit
  def edit
  end

  def list
    @otus = Otu.with_project_id(sessions_current_project_id).page(params[:page]) 
  end

  # POST /otus
  # POST /otus.json
  def create
    @otu = Otu.new(otu_params)

    respond_to do |format|
      if @otu.save
        format.html { redirect_to @otu,
                     notice: "Otu '#{@otu.name}' was successfully created." }
        format.json { render action: 'show', status: :created, location: @otu }
      else
        format.html { render action: 'new' }
        format.json { render json: @otu.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /otus/1
  # PATCH/PUT /otus/1.json
  def update
    respond_to do |format|
      if @otu.update(otu_params)
        format.html { redirect_to @otu, notice: 'Otu was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: 'edit' }
        format.json { render json: @otu.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /otus/1
  # DELETE /otus/1.json
  def destroy
    @otu.destroy
    respond_to do |format|
      format.html { redirect_to otus_url }
      format.json { head :no_content }
    end
  end

  def search
    if params[:id].blank?
      redirect_to otus_path, notice: 'You must select an item from the list with a click or tab press before clicking show.'
    else
      redirect_to otu_path(params[:id])
    end
  end

  def autocomplete
    @otus = Otu.find_for_autocomplete(params.merge(project_id: sessions_current_project_id)).includes(:taxon_name)
    data = @otus.collect do |t|
      {id: t.id,
       label: ApplicationController.helpers.otu_tag(t),
       response_values: {
         params[:method] => t.id
       },
       label_html: ApplicationController.helpers.otu_autocomplete_selected_tag(t) 
      }
    end

    render :json => data
  end

  def batch_load
  end

  def preview_simple_batch_load
    @otus = Otu.batch_preview(file: params[:file].tempfile)
    @file = params[:file].read
    render 'otus/batch_load/batch_preview'
  end

  def create_simple_batch_load
    if @otus = Otu.batch_create(params.symbolize_keys.to_h)
      flash[:notice] = "Successfully batch created #{@otus.count} OTUs."
    else
      # TODO: more response
      flash[:notice] = 'Failed to create the Otus.'
    end
    redirect_to otus_path
  end

  # GET /otus/download
  # def download
  #   send_data Otu.generate_download(project_id: $project_id), type: 'text', filename: "otus_#{DateTime.now.to_s}.csv"
  # end
  def download
    send_data Otu.generate_download( Otu.where(project_id: sessions_current_project_id) ), type: 'text', filename: "otus_#{DateTime.now.to_s}.csv"
  end

  private

  def set_otu
    @otu = Otu.with_project_id(sessions_current_project_id).find(params[:id])
    @recent_object = @otu
  end

  def otu_params
    params.require(:otu).permit(:name, :taxon_name_id)
  end
end
