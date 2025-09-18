// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    contact_no: {
      type: String,
      required: true,
    },
    organisation_type: {
      type: String,
      required: function() {
        return this.role === 'organisation';
      },
      enum: ['Private', 'Government', 'NGO', 'Educational', 'Healthcare', 'Non-profit', 'Other']
    },
    status: {
      type: String,
      enum: ['unverified', 'active', 'blocked'],
      default: 'unverified'
    },
    address: {
      type: String,
      required: function() {
        return this.role === 'organisation';
      },
      trim: true
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['organisation', 'admin'],
      default: 'admin',
    },
    website: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    gender: { 
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other'
    },
    lastLogout: {
      type: Date
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);
// Create partial unique indexes - only enforce uniqueness for 'active' users
userSchema.index(
  { email: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' },
    name: 'email_unique_active'
  }
);

userSchema.index(
  { contact_no: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active' },
    name: 'contact_no_unique_active'
  }
);
const User = mongoose.model('User', userSchema);
export default User;
