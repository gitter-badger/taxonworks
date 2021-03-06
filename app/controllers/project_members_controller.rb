class ProjectMembersController < ApplicationController
  before_action :require_superuser_sign_in 
  before_action :set_project_member, only: [:edit, :update, :destroy]

  # GET /project_members/new
  def new
    @project_member = ProjectMember.new(project_member_params)
    @available_users = User.not_in_project(@project_member.project_id) 
    redirect_to project_path(@project_member.project), alert: 'There are no additional users available to add to this project.' if !@available_users.any?
  end

  # GET /project_members/1/edit
  def edit
  end

  # POST /project_members
  # POST /project_members.json
  def create
    @project_member = ProjectMember.new(project_member_params)

    respond_to do |format|
      if @project_member.save
        format.html { redirect_to project_path(@project_member.project), notice: "#{@project_member.user.name} was successfully added to #{@project_member.project.name}" }
        format.json { render :show, status: :created, location: @project_member }
      else
        format.html { render :new }
        format.json { render json: @project_member.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /project_members/1
  # PATCH/PUT /project_members/1.json
  def update
    respond_to do |format|
      if @project_member.update(project_member_params)
        format.html { redirect_to  project_path(@project_member.project), notice: 'Project member was successfully updated.' }
        format.json { render :show, status: :ok, location: @project_member }
      else
        format.html { render :edit }
        format.json { render json: @project_member.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /project_members/1
  # DELETE /project_members/1.json
  def destroy
    @project_member.destroy
    respond_to do |format|
      format.html { redirect_to project_path(@project_member.project), notice: 'Project member was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_project_member
      @project_member = ProjectMember.where(project_id: $project_id).find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def project_member_params
      params.require(:project_member).permit(:project_id, :user_id, :is_project_administrator)
    end
end
