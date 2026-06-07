import multer from 'multer';
import path from 'path';
import cloudinary from '../cloudinary/cloudinary.js';
import { randomUUID } from 'crypto';
import streamifier from 'streamifier';
import dotenv from 'dotenv';
dotenv.config();

const storage = multer.memoryStorage();

const IMAGE_EXTS        = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const IMAGE_MIMES       = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

const VIDEO_EXTS        = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.flv', '.wmv'];
const VIDEO_MIMES       = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
                           'video/webm', 'video/3gpp', 'video/x-flv', 'video/x-ms-wmv'];

const AUDIO_EXTS        = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.opus', '.webm','mpeg'];
const AUDIO_MIMES       = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac',
                           'audio/mp4', 'audio/opus', 'audio/webm'];

const DOCUMENT_EXTS     = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                           '.txt', '.csv', '.zip', '.rar', '.7z', '.tar', '.gz'];
const DOCUMENT_MIMES    = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/octet-stream'
];

// ─── Single upload (images only – backward compat) ────────────────────────────
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!IMAGE_EXTS.includes(ext) && !IMAGE_MIMES.includes(file.mimetype)) {
      return cb(new Error('Only images (JPG, JPEG, PNG, GIF, WEBP) are allowed'));
    }
    cb(null, true);
  },
});

export const mediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    const allowed =
      IMAGE_EXTS.includes(ext)  || IMAGE_MIMES.includes(mime)  ||
      VIDEO_EXTS.includes(ext)  || VIDEO_MIMES.includes(mime);
    if (!allowed) return cb(new Error('Only image/video files are allowed'));
    cb(null, true);
  },
});

// ─── Document / audio upload (up to 50 MB) ────────────────────────────────────
export const documentUpload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    const allowed =
      DOCUMENT_EXTS.includes(ext) || DOCUMENT_MIMES.includes(mime) ||
      AUDIO_EXTS.includes(ext)    || AUDIO_MIMES.includes(mime);
    if (!allowed) return cb(new Error('File type not supported'));
    cb(null, true);
  },
});

export const anyMediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    const allowed =
      IMAGE_EXTS.includes(ext)    || IMAGE_MIMES.includes(mime)    ||
      VIDEO_EXTS.includes(ext)    || VIDEO_MIMES.includes(mime)    ||
      AUDIO_EXTS.includes(ext)    || AUDIO_MIMES.includes(mime)    ||
      DOCUMENT_EXTS.includes(ext) || DOCUMENT_MIMES.includes(mime);
    if (!allowed) return cb(new Error('File type not supported'));
    cb(null, true);
  },
});

export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder       = 'WIE_CHAT/chat_images',
      publicId     = randomUUID(),
      resourceType = 'auto',           
      mimeType,
      originalName
    } = options;

    // Formats Cloudinary rejects — omit the format field and let Cloudinary auto-detect
    const SKIP_FORMAT = ['mpeg', 'x-wav', 'x-m4a', 'x-flac', 'ogg; codecs=opus'];

    const derivedFormat = mimeType
    ? mimeType.split('/')[1]?.split(';')[0]?.trim()   // strip codec suffix e.g. "webm;codecs=opus" → "webm"
    : null;

    const safeFormat = derivedFormat && !SKIP_FORMAT.includes(derivedFormat)
    ? derivedFormat
    : undefined;

    const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder,
            resource_type: resourceType,
            public_id:     publicId,
            ...(safeFormat && { format: safeFormat })
        },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          public_id:    result.public_id,
          url:          result.secure_url,
          width:        result.width,
          height:       result.height,
          format:       result.format,
          bytes:        result.bytes,
          duration:     result.duration,      // for video/audio
          resource_type: result.resource_type,
          original_name: originalName || result.original_filename
        });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

export const uploadLargeToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder       = 'WIE_CHAT/chat_images',
      publicId     = randomUUID(),
      resourceType = 'auto',
      originalName,
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id:     publicId,
        chunk_size:    6 * 1024 * 1024,  // 6 MB chunks — triggers chunked upload
        timeout:       600000,            // 10 min
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          public_id:     result.public_id,
          url:           result.secure_url,
          width:         result.width,
          height:        result.height,
          format:        result.format,
          bytes:         result.bytes,
          duration:      result.duration,
          resource_type: result.resource_type,
          original_name: originalName || result.original_filename,
        });
      }
    );
    // Pipe buffer through streamifier — same pattern as uploadToCloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
export const deleteFromCloudinary = async (publicIdOrUrl, resourceType = 'image') => {
  try {
    if (!publicIdOrUrl) return null;

    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const urlParts    = publicIdOrUrl.split('/');
      const uploadIndex = urlParts.indexOf('upload');
      if (uploadIndex !== -1) {
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      }
    }

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

export const extractPublicId = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const urlParts    = url.split('/');
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

/** Determine Cloudinary resource_type from mime / extension */
export const getResourceType = (mimeType = '', originalName = '') => {
  const ext = path.extname(originalName).toLowerCase();
  if (IMAGE_MIMES.includes(mimeType) || IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_MIMES.includes(mimeType) || VIDEO_EXTS.includes(ext)) return 'video';
  if (AUDIO_MIMES.includes(mimeType) || AUDIO_EXTS.includes(ext)) return 'video'; // Cloudinary uses 'video' for audio too
  return 'raw'; // documents / archives
};

export default upload;
