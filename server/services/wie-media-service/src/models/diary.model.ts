import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDiaryFlux {
  fluxId:          string;
  mediaUrl:        string;
  mediaType:       'image' | 'video';
  caption?:        string;
  addedAt:         Date;
  // Music fields
  musicTitle?:     string;
  musicArtist?:    string;
  musicPreviewUrl?: string;
  musicAlbumArt?:  string;
  musicStartAt?:   number;
  // Location fields
  locationLabel?:       string;
  locationStickerX?:    number;
  locationStickerY?:    number;
  locationStickerTheme?: number;
  isCloseFriends?: boolean;
}
export interface IDiary extends Document {
  userId: string;
  title: string;
  coverImage?: string;
  coverCloudinaryPublicId?: string;
  fluxes: IDiaryFlux[];
  visibility: 'public' | 'followers' | 'close_friends' | 'only_me';
  isCloseFriends: boolean;  
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DiaryFluxSchema = new Schema<IDiaryFlux>(
  {
    fluxId:    { type: String, required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    caption:   { type: String },
    addedAt:   { type: Date, default: Date.now },
    // Music
    musicTitle:      { type: String },
    musicArtist:     { type: String },
    musicPreviewUrl: { type: String },
    musicAlbumArt:   { type: String },
    musicStartAt:    { type: Number },
    // Location
    locationLabel:        { type: String },
    locationStickerX:     { type: Number },
    locationStickerY:     { type: Number },
    locationStickerTheme: { type: Number },
    isCloseFriends:       { type: Boolean, default: false },
  },
  { _id: false }
);

const DiarySchema = new Schema<IDiary>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 50 },
    coverImage: { type: String },
    coverCloudinaryPublicId: { type: String },
    fluxes: { type: [DiaryFluxSchema], default: [] },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'close_friends', 'only_me'],
      default: 'followers',
    },
    isDeleted: { type: Boolean, default: false },
    isCloseFriends: { type: Boolean, default: false },
    isPinned:       { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

DiarySchema.index({ userId: 1, createdAt: -1 });

DiarySchema.virtual('fluxCount').get(function () {
  return this.fluxes.length;
});

const DiaryModel: Model<IDiary> = mongoose.model<IDiary>('Diary', DiarySchema);

export default DiaryModel;