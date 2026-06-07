import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { randomUUID } from 'crypto';
import streamifier from 'streamifier';

// Memory storage — accept ALL file types for media service
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB max for videos
});

export type MediaType = 'image' | 'video' | 'raw';

interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: MediaType;
}

interface CloudinaryResult {
  public_id: string;
  url: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
  duration?: number;
  resource_type: string;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<CloudinaryResult> => {
  return new Promise((resolve, reject) => {
    const {
      folder = 'WIE_MEDIA/flux',
      publicId = randomUUID(),
      resourceType = 'auto' as any,
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType === 'raw' ? 'raw' : 'auto',
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        if (result) {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            duration: (result as any).duration,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed: No result'));
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (
  publicIdOrUrl: string,
  resourceType: string = 'image'
): Promise<any> => {
  try {
    if (!publicIdOrUrl) return null;

    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const urlParts = publicIdOrUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      }
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType as any,
    });
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
      return urlParts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
    }
  } catch {}
  return null;
};

export const detectMediaType = (mimetype: string): MediaType => {
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('image/')) return 'image';
  return 'raw';
};