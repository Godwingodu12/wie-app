import mongoose from 'mongoose';
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
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
    country_code: {
      type: String,
      default: '+91',
    },
    country_iso2: {
      type: String,
      default: 'in',
    },
    organisation_type: {
      type: String,
      required: function() {
        return this.role === 'organisation';
      },
      enum: [
          'Private Limited', 'Public Limited', 'Partnership', 'Proprietorship', 'LLP', 'Sole Proprietorship','Hospital',
          'NGO', 'Educational', 'Healthcare', 'Non-profit', 'Trust', 'Society','Government', 'Other','Institute','Corporation','Association','Club'
      ]
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
    followers: {
      type: String,
      default: '0',
    },
    following: {
      type: String,
      default: '0',
    },
    social_links: {
      facebook: { type: String, default: '' },
      x: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      instagram: { type: String, default: '' },
      google: { type: String, default: '' },
      whatsapp: { type: String, default: '' }
    },
    social_profiles: {
      google: {
        profileId: String,
        displayName: String,
        email: String,
        photo: String,
        linkedAt: Date
      },
      facebook: {
        profileId: String,
        displayName: String,
        email: String,
        photo: String,
        linkedAt: Date
      },
      x: {
        profileId: String,
        displayName: String,
        username: String,
        photo: String,
        linkedAt: Date
      },
      instagram: {
        profileId: String,
        displayName: String,
        username: String,
        photo: String,
        linkedAt: Date
      },
      linkedin: {
        profileId: String,
        displayName: String,
        email: String,
        photo: String,
        linkedAt: Date
      }
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
    created_at: {
      type: Date,
      default: Date.now
    },
    updated_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true, 
  }
);

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
userSchema.index(
  { username: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { status: 'active', username: { $exists: true, $ne: '' } },
    name: 'username_unique_active'
  }
);
const User = mongoose.model('User', userSchema);
export default User;
