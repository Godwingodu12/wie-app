import { Request, Response } from 'express';
import { UploadService } from './upload.service';
import ConnectionProfile from '../models/ConnectionProfile';
import mongoose from 'mongoose';

const uploadService = new UploadService();

// Upload profile photos
export const uploadProfilePhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
      return;
    }

    // Validate file count
    if (files.length > 8) {
      res.status(400).json({
        success: false,
        message: 'Maximum 8 photos allowed',
      });
      return;
    }

    // Upload photos
    const uploadedPhotos = await uploadService.uploadMultiplePhotos(files, userId);

    // Check for AI-generated images
    const photosWithAICheck = await Promise.all(
      uploadedPhotos.map(async (photo) => {
        const isAI = await uploadService.detectAIImage(photo.url);
        return {
          ...photo,
          isAIGenerated: isAI,
        };
      })
    );

    // Check if any AI images detected
    const hasAIImages = photosWithAICheck.some((p) => p.isAIGenerated);

    if (hasAIImages) {
      // Delete uploaded images
      await Promise.all(photosWithAICheck.map((p) => uploadService.deletePhoto(p.publicId)));

      res.status(400).json({
        success: false,
        message: 'AI-generated images detected. Please use real photos.',
      });
      return;
    }

    // Get profile and add photos
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!profile) {
      // Clean up uploaded photos
      await Promise.all(uploadedPhotos.map((p) => uploadService.deletePhoto(p.publicId)));
      
      res.status(404).json({
        success: false,
        message: 'Connection profile not found',
      });
      return;
    }

    // Check photo limit
    if (profile.photos.length + uploadedPhotos.length > 8) {
      // Clean up uploaded photos
      await Promise.all(uploadedPhotos.map((p) => uploadService.deletePhoto(p.publicId)));
      
      res.status(400).json({
        success: false,
        message: 'Maximum 8 photos allowed',
      });
      return;
    }

    // Set first photo as primary if no primary exists
    const hasPrimary = profile.photos.some((p) => p.isPrimary);

    uploadedPhotos.forEach((photo, index) => {
      profile.photos.push({
        url: photo.url,
        publicId: photo.publicId,
        isPrimary: !hasPrimary && index === 0,
        isVerified: false,
        isAIGenerated: false,
        uploadedAt: new Date(),
        status: 'pending',
      } as any);
    });

    // Recalculate completeness
    profile.profileCompleteness = profile.calculateCompleteness();

    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        photos: uploadedPhotos,
        profileCompleteness: profile.profileCompleteness,
      },
      message: 'Photos uploaded successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete profile photo
export const deleteProfilePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { publicId } = req.params;

    // Get profile
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
      return;
    }

    // Find photo
    const photoIndex = profile.photos.findIndex((p) => p.publicId === publicId);
    if (photoIndex === -1) {
      res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
      return;
    }

    // Delete from Cloudinary
    await uploadService.deletePhoto(publicId);

    // Remove from profile
    profile.photos.splice(photoIndex, 1);

    // If deleted photo was primary, set another as primary
    if (profile.photos.length > 0 && !profile.photos.some((p) => p.isPrimary)) {
      profile.photos[0].isPrimary = true;
    }

    // Recalculate completeness
    profile.profileCompleteness = profile.calculateCompleteness();

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      data: {
        profileCompleteness: profile.profileCompleteness,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Set primary photo
export const setPrimaryPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { publicId } = req.body;

    // Get profile
    const profile = await ConnectionProfile.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    
    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
      return;
    }

    // Find photo
    const photo = profile.photos.find((p) => p.publicId === publicId);
    if (!photo) {
      res.status(404).json({
        success: false,
        message: 'Photo not found',
      });
      return;
    }

    // Set all photos as non-primary
    profile.photos.forEach((p) => (p.isPrimary = false));

    // Set selected photo as primary
    photo.isPrimary = true;

    await profile.save();

    res.status(200).json({
      success: true,
      message: 'Primary photo set successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};