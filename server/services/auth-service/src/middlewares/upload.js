import multer from 'multer';
import path from 'path';
import cloudinary from '../cloudinary/cloudinary.js';
import { randomUUID } from 'crypto';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Also check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowed.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only images (JPG, JPEG, PNG, GIF, WEBP) are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Upload image buffer to Cloudinary
 * @param {Buffer} buffer - File buffer from multer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = 'WIE_AUTH/profile_images',
      publicId = randomUUID(),
      transformation = [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: publicId,
        transformation
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicIdOrUrl - Public ID or full Cloudinary URL
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicIdOrUrl) => {
  try {
    if (!publicIdOrUrl) return null;
    
    // Extract public_id from URL if full URL is provided
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const urlParts = publicIdOrUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        // Get everything after 'upload' and version
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        // Remove file extension
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      }
    }

    console.log(`Deleting from Cloudinary: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    });
    
    console.log(`✅ Deleted: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract public_id from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null
 */
export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex !== -1) {
      const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
      return pathAfterUpload.replace(/\.[^/.]+$/, '');
    }
  } catch (error) {
    console.error('Error extracting public_id:', error);
  }
  
  return null;
};

export default upload;
