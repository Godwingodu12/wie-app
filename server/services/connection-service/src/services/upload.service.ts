import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { Request } from 'express';
import sharp from 'sharp';


// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request, // Add underscore prefix for unused parameter
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

export class UploadService {
  // Upload single photo
  async uploadPhoto(
      file: Express.Multer.File,
      userId: string
    ): Promise<{ url: string; publicId: string }> {
      try {
        // Optimize image with sharp
        let optimizedBuffer: Buffer;
        try {
          optimizedBuffer = await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toBuffer();
        } catch (sharpErr: any) {
          throw new Error(
            `Image processing failed for "${file.originalname}": ${sharpErr?.message ?? String(sharpErr)}`
          );
        }
  
        // Upload to Cloudinary
        return await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder:          `wie/connections/${userId}`,
              resource_type:   'image',
              transformation:  [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:good' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                // Cloudinary error objects have .message but guard anyway
                reject(new Error(
                  `Cloudinary upload failed for "${file.originalname}": ${error?.message ?? JSON.stringify(error)}`
                ));
              } else if (result) {
                resolve({ url: result.secure_url, publicId: result.public_id });
              } else {
                reject(new Error(`Cloudinary returned no result for "${file.originalname}"`));
              }
            }
          );
          uploadStream.end(optimizedBuffer);
        });
  
      } catch (error: any) {
        // Re-throw with a guaranteed string message
        const msg = error?.message ?? String(error) ?? 'Unknown upload error';
        throw new Error(msg);
      }
  }

  // Upload multiple photos
  async uploadMultiplePhotos(
      files: Express.Multer.File[],
      userId: string
    ): Promise<Array<{ url: string; publicId: string }>> {
      const results: Array<{ url: string; publicId: string }> = [];
  
      for (const file of files) {
        try {
          const uploaded = await this.uploadPhoto(file, userId);
          results.push(uploaded);
        } catch (error: any) {
          // Surface the exact per-file error — don't wrap it
          const msg = error?.message ?? String(error) ?? `Upload failed for "${file.originalname}"`;
          throw new Error(msg);
        }
      }
      return results;
  }

  // Delete photo from Cloudinary
  async deletePhoto(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error: any) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  // Check if image is AI-generated (placeholder - integrate with actual AI detection service)
  async detectAIImage(_imageUrl: string): Promise<boolean> {
    // Add underscore prefix for unused parameter
    try {
      // TODO: Integrate with AI detection service
      // For now, return false
      return false;
    } catch (error) {
      return false;
    }
  }

  // Get optimized URL with transformations
  getOptimizedUrl(publicId: string, width: number = 400, height: number = 400): string {
    return cloudinary.url(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto:good',
      fetch_format: 'auto',
    });
  }

  // Generate thumbnail
  getThumbnailUrl(publicId: string): string {
    return this.getOptimizedUrl(publicId, 150, 150);
  }

  // Helper method to extract public ID from Cloudinary URL
  extractPublicId(imageUrl: string): string | null {
    try {
      if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
        return null;
      }

      // Extract public_id from URL
      // Example: https://res.cloudinary.com/cloud_name/image/upload/v123456/folder/image.jpg
      const matches = imageUrl.match(/\/([^\/]+)\.[^\.]+$/);
      if (matches && matches[1]) {
        // Get the path after 'upload/' and before the file extension
        const uploadIndex = imageUrl.indexOf('/upload/');
        if (uploadIndex !== -1) {
          const afterUpload = imageUrl.substring(uploadIndex + 8);
          const publicId = afterUpload.substring(0, afterUpload.lastIndexOf('.'));
          return publicId;
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  // Upload from buffer (for cloudinaryHelper compatibility)
  async uploadToCloudinary(
    buffer: Buffer,
    options: { folder: string; publicId?: string }
  ): Promise<{ url: string; publicId: string }> {
    try {
      const optimizedBuffer = await sharp(buffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: options.folder,
            public_id: options.publicId,
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 1200, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              reject(new Error(`Cloudinary upload failed: ${error?.message ?? JSON.stringify(error)}`))
            } else if (result) {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          }
        );

        uploadStream.end(optimizedBuffer);
      });
    } catch (error: any) {
      throw new Error(`Photo upload failed: ${error.message}`);
    }
  }

  // Delete from Cloudinary (for cloudinaryHelper compatibility)
  async deleteFromCloudinary(imageUrl: string): Promise<any> {
    try {
      const publicId = this.extractPublicId(imageUrl);
      if (!publicId) {
        throw new Error('Could not extract public ID from URL');
      }
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error: any) {
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }
}

// Export singleton instance and helper functions
const uploadServiceInstance = new UploadService();

export const uploadToCloudinary = uploadServiceInstance.uploadToCloudinary.bind(
  uploadServiceInstance
);
export const deleteFromCloudinary = uploadServiceInstance.deleteFromCloudinary.bind(
  uploadServiceInstance
);
export const extractPublicId = uploadServiceInstance.extractPublicId.bind(uploadServiceInstance);