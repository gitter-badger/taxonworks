require 'rails_helper'

# This spec was generated by rspec-rails when you ran the scaffold generator.
# It demonstrates how one might use RSpec to specify the controller code that
# was generated by Rails when you ran the scaffold generator.
#
# It assumes that the implementation code is generated by the rails scaffold
# generator.  If you are using any extension libraries to generate different
# controller code, this generated spec may or may not pass.
#
# It only uses APIs available in rails and/or rspec-rails.  There are a number
# of tools you can use to make these specs even more expressive, but we're
# sticking to rails and rspec-rails APIs to keep things simple and stable.
#
# Compared to earlier versions of this generator, there is very limited use of
# stubs and message expectations in this spec.  Stubs are only used when there
# is no simpler way to get a handle on the object needed for the example.
# Message expectations are only used when there is no simpler way to specify
# that an instance is receiving a specific message.

describe SerialsController, :type => :controller do
  before(:each) {
    sign_in
  }


  # This should return the minimal set of attributes required to create a valid
  # Serial. As you add validations to Serial, be sure to
  # adjust the attributes here as well.
  let(:valid_attributes) { FactoryGirl.build(:valid_serial).attributes }

  # This should return the minimal set of values that should be in the session
  # in order to pass any filters (e.g. authentication) defined in
  # SerialsController. Be sure to keep this updated too.
  let(:valid_session) { {} }

  describe "GET index" do
    it "assigns recent serials as @recent_objects" do
      serial = Serial.create! valid_attributes
      get :index, {}, valid_session
      expect(assigns(:recent_objects)).to eq([serial])
    end
  end

  describe "GET show" do
    it "assigns the requested serial as @serial" do
      serial = Serial.create! valid_attributes
      get :show, {:id => serial.to_param}, valid_session
      expect(assigns(:serial)).to eq(serial)
    end
  end

  describe "GET new" do
    it "assigns a new serial as @serial" do
      get :new, {}, valid_session
      expect(assigns(:serial)).to be_a_new(Serial)
    end
  end

  describe "GET edit" do
    it "assigns the requested serial as @serial" do
      serial = Serial.create! valid_attributes
      get :edit, {:id => serial.to_param}, valid_session
      expect(assigns(:serial)).to eq(serial)
    end
  end

  describe "POST create" do
    describe "with valid params" do
      it "creates a new Serial" do
        expect {
          post :create, {:serial => valid_attributes}, valid_session
        }.to change(Serial, :count).by(1)
      end

      it "assigns a newly created serial as @serial" do
        post :create, {:serial => valid_attributes}, valid_session
        expect(assigns(:serial)).to be_a(Serial)
        expect(assigns(:serial)).to be_persisted
      end

      it "redirects to the created serial" do
        post :create, {:serial => valid_attributes}, valid_session
        expect(response).to redirect_to(Serial.last)
      end
    end

    describe "with invalid params" do
      it "assigns a newly created but unsaved serial as @serial" do
        # Trigger the behavior that occurs when invalid params are submitted
        allow_any_instance_of(Serial).to receive(:save).and_return(false)
        post :create, {:serial => { "name" => "invalid value" }}, valid_session
        expect(assigns(:serial)).to be_a_new(Serial)
      end

      it "re-renders the 'new' template" do
        # Trigger the behavior that occurs when invalid params are submitted
        allow_any_instance_of(Serial).to receive(:save).and_return(false)
        post :create, {:serial => { "name" => "invalid value" }}, valid_session
        expect(response).to render_template("new")
      end
    end
  end

  describe "PUT update" do
    describe "with valid params" do
      it "updates the requested serial" do
        serial = Serial.create! valid_attributes
        # Assuming there are no other serials in the database, this
        # specifies that the Serial created on the previous line
        # receives the :update_attributes message with whatever params are
        # submitted in the request.
        expect_any_instance_of(Serial).to receive(:update).with({ "name" => "MyString" })
        put :update, {:id => serial.to_param, :serial => { "name" => "MyString" }}, valid_session
      end

      it "assigns the requested serial as @serial" do
        serial = Serial.create! valid_attributes
        put :update, {:id => serial.to_param, :serial => valid_attributes}, valid_session
        expect(assigns(:serial)).to eq(serial)
      end

      it "redirects to the serial" do
        serial = Serial.create! valid_attributes
        put :update, {:id => serial.to_param, :serial => valid_attributes}, valid_session
        expect(response).to redirect_to(serial)
      end
    end

    describe "with invalid params" do
      it "assigns the serial as @serial" do
        serial = Serial.create! valid_attributes
        # Trigger the behavior that occurs when invalid params are submitted
        allow_any_instance_of(Serial).to receive(:save).and_return(false)
        put :update, {:id => serial.to_param, :serial => { "name" => "invalid value" }}, valid_session
        expect(assigns(:serial)).to eq(serial)
      end

      it "re-renders the 'edit' template" do
        serial = Serial.create! valid_attributes
        # Trigger the behavior that occurs when invalid params are submitted
        allow_any_instance_of(Serial).to receive(:save).and_return(false)
        put :update, {:id => serial.to_param, :serial => { "name" => "invalid value" }}, valid_session
        expect(response).to render_template("edit")
      end
    end
  end

  describe "DELETE destroy" do
    it "destroys the requested serial" do
      serial = Serial.create! valid_attributes
      expect {
        delete :destroy, {:id => serial.to_param}, valid_session
      }.to change(Serial, :count).by(-1)
    end

    it "redirects to the serials list" do
      serial = Serial.create! valid_attributes
      delete :destroy, {:id => serial.to_param}, valid_session
      expect(response).to redirect_to(serials_url)
    end
  end

end