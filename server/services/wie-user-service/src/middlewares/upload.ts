import multer from 'multer';
import path from 'path';
import cloudinary from '../config/cloudinary';
import { randomUUID } from 'crypto';
import streamifier from 'streamifier';
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowed.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
      return cb(new Error('Only images (JPG, JPEG, PNG, GIF, WEBP) are allowed'));
    }
    cb(null, true);
  },
});

interface UploadOptions {
  folder?: string;
  publicId?: string;
}

interface CloudinaryResult {
  public_id: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const {
      folder = 'WIE_USER/profile_images',
      publicId = randomUUID()
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: publicId
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    );
    
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (publicIdOrUrl: string): Promise<any> => {
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

export const extractPublicId = (url: string): string | null => {
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