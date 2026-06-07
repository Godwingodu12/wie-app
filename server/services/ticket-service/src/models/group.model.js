import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    grp_type: { type: String, required: true, enum: ['organisation', 'admin'], default: 'admin' },
    organisation_type: {
      type: String,
      required: function() {
        return this.grp_type === 'organisation';
      },
      enum: [
          'Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP', 'Sole Proprietorship','Hospital',
          'NGO', 'Educational', 'Healthcare', 'Non-profit', 'Trust', 'Society','Government', 'Other','Institute','Corporation','Association','Club'
      ]
    },
    email: { type: String, required: true },
    contact_no: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: function() {
        return this.grp_type === 'organisation';
      },
      trim: true
    },
    status: {
      type: String,
      enum: ['unverified', 'active', 'blocked'],
      default: 'unverified'
    },
    gst_no: { type: String, required: false },
    pan_no: { type: String, required: true },
    primary_bank_acc_type: { type: String },
    primary_bank_acc_no: { type: String },
    primary_bank_ifsc: { type: String },
    primary_bank_acc_holder: { type: String },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    id_proof: { type: String, required: true },
    bank_check: { type: String, required: false },
    company_certificate: { 
      type: String,
    },
    company_logo: {
      type: String,
    }
  },
  {
    timestamps: true, 
  }
);
const Group = mongoose.model('Group', groupSchema);
export default Group;
