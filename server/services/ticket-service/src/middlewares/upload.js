import multer from 'multer';
import path from 'path';
import cloudinary from '../cloudinary/cloudinary.js';
import { randomUUID } from 'crypto';
import streamifier from 'streamifier';

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File type validation
const generalFileFilter = (req, file, cb) => {
  const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp','.jfif','.avif'];
  const videoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const docTypes = ['.pdf', '.doc', '.docx'];
  const allowed = [...imageTypes, ...videoTypes, ...docTypes];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname.startsWith('guest_profile')) {
    if (!imageTypes.includes(ext)) {
      return cb(new Error('Guest profile must be an image file (JPG, JPEG, PNG, GIF, WEBP)'));
    }
  } else if (file.fieldname === 'event_rules') {
    if (!docTypes.includes(ext)) {
      return cb(new Error('Event rules file must be a document (PDF, DOC, DOCX)'));
    }
  } else if (file.fieldname.startsWith('video_file')) {
    if (!videoTypes.includes(ext)) {
      return cb(new Error('Video file must be a valid video format (MP4, AVI, MOV, WMV, FLV, WEBM, MKV)'));
    }
  } else if (file.fieldname.startsWith('preview_image')) {
    if (!imageTypes.includes(ext)) {
      return cb(new Error('Preview image must be an image file (JPG, JPEG, PNG, GIF, WEBP)'));
    }
  } else if (!allowed.includes(ext)) {
    return cb(new Error('Only PDF, DOC, DOCX, image, and video files are allowed'));
  }
  
  cb(null, true);
};
const ticketMediaFileFilter = (req, file, cb) => {
  try {
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp','.jfif','.avif'];
    const videoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const docTypes = ['.pdf', '.doc', '.docx'];
    
    let ext = path.extname(file.originalname).toLowerCase();
    
    if (!ext && file.mimetype) {
      const mimeTypeMap = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'image/jfif': '.jfif',
        'image/avif': '.avif',
        'video/mp4': '.mp4',
        'video/avi': '.avi',
        'video/mov': '.mov',
        'video/wmv': '.wmv',
        'video/flv': '.flv',
        'video/webm': '.webm',
        'application/pdf': '.pdf',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
      };
      ext = mimeTypeMap[file.mimetype] || '';
    }
    
    if (!ext) {
      return cb(new Error(`File must have a valid extension or MIME type. Received: ${file.originalname}`), false);
    }
    
    const fieldTypeMap = {
      college_authorisation: {
        allowed: docTypes,
        errorMsg: 'College authorization file must be a document (PDF, DOC, DOCX)'
      },
      event_rules: {
        allowed: docTypes,
        errorMsg: 'Event rules file must be a document (PDF, DOC, DOCX)'
      },
      event_logo: {
        allowed: imageTypes,
        errorMsg: 'Event logo must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
      },
      event_banner: {
        allowed: imageTypes,
        errorMsg: 'Event banner must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
      },
      ticket_layout: {  
        allowed: [...imageTypes, ...docTypes], 
        errorMsg: 'Ticket layout must be an image file (JPG, JPEG, PNG, GIF, WEBP) or PDF'
      },
      event_portrait: {
    allowed: imageTypes,
    errorMsg: 'Portrait image must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
  },
  event_videos: {
    allowed: videoTypes,
    errorMsg: 'Event videos must be valid video files (MP4, AVI, MOV, etc.)'
  },
      event_images: {
        allowed: imageTypes,
        errorMsg: 'Event images must be image or video files'
      },
      video_file: {
        allowed: videoTypes,
        errorMsg: 'Attached video must be a valid video file'
      },
      preview_image: {
        allowed: imageTypes,
        errorMsg: 'Video preview image must be a valid image file'
      }
    };
    
    // ✅ Handle guest_profile fields
    if (file.fieldname.startsWith('guest_profile')) {
      if (imageTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Guest profile must be an image file'), false);
      }
    }
    
    // ✅ Handle ticket_photo fields
    if (file.fieldname.startsWith('ticket_photo')) {
      if (imageTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Ticket photo must be an image file'), false);
      }
    }
    
    // ✅ Handle video_file fields
    if (file.fieldname.startsWith('video_file')) {
      if (videoTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Video file must be a valid video format'), false);
      }
    }
    
    // ✅ Handle preview_image fields
    if (file.fieldname.startsWith('preview_image')) {
      if (imageTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Preview image must be an image file'), false);
      }
    }
    
    // Check specific field configurations
    const fieldConfig = fieldTypeMap[file.fieldname];
    if (fieldConfig) {
      if (fieldConfig.allowed.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error(fieldConfig.errorMsg), false);
      }
    }
    
    // Default: allow all valid types
    const allAllowedTypes = [...imageTypes, ...videoTypes, ...docTypes];
    if (allAllowedTypes.includes(ext)) {
      return cb(null, true);
    }
    
    return cb(new Error(`File type not allowed: ${ext}`), false);
    
  } catch (error) {
    console.error('Error in ticketMediaFileFilter:', error);
    return cb(new Error('File validation error'), false);
  }
};
// Helper function to upload to Cloudinary
export const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      folder = 'WIE_EVENTS',
      resourceType = 'auto',
      publicId = randomUUID()
    } = options;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        transformation: resourceType === 'video' ? [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ] : [
          { quality: 'auto:good' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            resource_type: result.resource_type,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Helper function to determine folder based on fieldname
export const getCloudinaryFolder = (fieldname) => {
  const folderMap = {
    id_proof: 'WIE_EVENTS/group_documents/id_proofs',
    bank_check: 'WIE_EVENTS/group_documents/bank_checks',
    company_certificate: 'WIE_EVENTS/group_documents/certificates',
    company_logo: 'WIE_EVENTS/group_documents/logos',
    guest_profile: 'WIE_EVENTS/guest_profiles',
    event_rules: 'WIE_EVENTS/event_rules',
    college_authorisation: 'WIE_EVENTS/college_authorisations',
    event_logo: 'WIE_EVENTS/event_logos',
    event_banner: 'WIE_EVENTS/event_banners',
    event_images: 'WIE_EVENTS/event_images',
    event_portrait: 'WIE_EVENTS/event_portraits',
    event_videos: 'WIE_EVENTS/event_videos',
    ticket_photo: 'WIE_EVENTS/ticket_photos',
    ticket_layout: 'WIE_EVENTS/ticket_layouts',
    video_file: 'WIE_EVENTS/event_videos',
    preview_image: 'WIE_EVENTS/event_previews',
    event_video: 'WIE_EVENTS/event_videos',
    event_preview: 'WIE_EVENTS/event_previews'
  };

  // Handle dynamic field names (e.g., guest_profile_0, ticket_photo_1)
  for (const [key, folder] of Object.entries(folderMap)) {
    if (fieldname.startsWith(key)) {
      return folder;
    }
  }
  return 'WIE_EVENTS/misc';
};
export const getResourceType = (fieldname, mimetype) => {
  if (
    fieldname.startsWith('video_file') || 
    fieldname === 'event_videos' || // Add this
    mimetype?.startsWith('video/')
  ) {
    return 'video';
  }
  
  // ✅ Handle ticket_layout - can be image or PDF
  if (fieldname === 'ticket_layout' || fieldname.startsWith('ticket_layout')) {
    if (mimetype?.includes('pdf')) {
      return 'raw';
    }
    return 'image';
  }
  
  // Handle group document fields that can be images or PDFs
  if (fieldname === 'id_proof' || 
      fieldname === 'bank_check' || 
      fieldname === 'company_certificate') {
    if (mimetype?.startsWith('image/')) {
      return 'image';
    }
    if (mimetype?.includes('pdf') || 
        mimetype?.includes('document') || 
        mimetype?.includes('msword')) {
      return 'raw';
    }
    return 'auto';
  }
  
  if (fieldname === 'event_rules' || 
      fieldname === 'college_authorisation' || 
      mimetype?.includes('pdf') || 
      mimetype?.includes('document')) {
    return 'raw';
  }
  
  if (fieldname === 'company_logo') {
    return 'image';
  }
  
  return 'image';
};
// Multer upload instances
const upload = multer({
  storage,
  limits: { 
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 100
  },
  fileFilter: generalFileFilter,
});

const ticketMediaUpload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 50
  },
  fileFilter: ticketMediaFileFilter,
});

// Upload fields configuration
const uploadFields = upload.fields([
  { name: 'guest_profile_0', maxCount: 1 },
  { name: 'guest_profile_1', maxCount: 1 },
  { name: 'guest_profile_2', maxCount: 1 },
  { name: 'guest_profile_3', maxCount: 1 },
  { name: 'guest_profile_4', maxCount: 1 },
  { name: 'guest_profile_5', maxCount: 1 },
  { name: 'guest_profile_6', maxCount: 1 },
  { name: 'guest_profile_7', maxCount: 1 },
  { name: 'guest_profile_8', maxCount: 1 },
  { name: 'guest_profile_9', maxCount: 1 },
  { name: 'video_file_0', maxCount: 1 },
  { name: 'video_file_1', maxCount: 1 },
  { name: 'video_file_2', maxCount: 1 },
  { name: 'video_file_3', maxCount: 1 },
  { name: 'video_file_4', maxCount: 1 },
  { name: 'video_file_5', maxCount: 1 },
  { name: 'video_file_6', maxCount: 1 },
  { name: 'video_file_7', maxCount: 1 },
  { name: 'video_file_8', maxCount: 1 },
  { name: 'video_file_9', maxCount: 1 },
  { name: 'video_file_10', maxCount: 1 },
  { name: 'video_file_11', maxCount: 1 },
  { name: 'video_file_12', maxCount: 1 },
  { name: 'video_file_13', maxCount: 1 },
  { name: 'video_file_14', maxCount: 1 },
  { name: 'video_file_15', maxCount: 1 },
  { name: 'video_file_16', maxCount: 1 },
  { name: 'video_file_17', maxCount: 1 },
  { name: 'video_file_18', maxCount: 1 },
  { name: 'video_file_19', maxCount: 1 },
  { name: 'video_file_20', maxCount: 1 },
  { name: 'video_file_21', maxCount: 1 },
  { name: 'video_file_22', maxCount: 1 },
  { name: 'video_file_23', maxCount: 1 },
  { name: 'video_file_24', maxCount: 1 },
  { name: 'video_file_25', maxCount: 1 },
  { name: 'video_file_26', maxCount: 1 },
  { name: 'video_file_27', maxCount: 1 },
  { name: 'video_file_28', maxCount: 1 },
  { name: 'video_file_29', maxCount: 1 },
  { name: 'preview_image_0', maxCount: 1 },
  { name: 'preview_image_1', maxCount: 1 },
  { name: 'preview_image_2', maxCount: 1 },
  { name: 'preview_image_3', maxCount: 1 },
  { name: 'preview_image_4', maxCount: 1 },
  { name: 'preview_image_5', maxCount: 1 },
  { name: 'preview_image_6', maxCount: 1 },
  { name: 'preview_image_7', maxCount: 1 },
  { name: 'preview_image_8', maxCount: 1 },
  { name: 'preview_image_9', maxCount: 1 },
  { name: 'preview_image_10', maxCount: 1 },
  { name: 'preview_image_11', maxCount: 1 },
  { name: 'preview_image_12', maxCount: 1 },
  { name: 'preview_image_13', maxCount: 1 },
  { name: 'preview_image_14', maxCount: 1 },
  { name: 'preview_image_15', maxCount: 1 },
  { name: 'preview_image_16', maxCount: 1 },
  { name: 'preview_image_17', maxCount: 1 },
  { name: 'preview_image_18', maxCount: 1 },
  { name: 'preview_image_19', maxCount: 1 },
  { name: 'preview_image_20', maxCount: 1 },
  { name: 'preview_image_21', maxCount: 1 },
  { name: 'preview_image_22', maxCount: 1 },
  { name: 'preview_image_23', maxCount: 1 },
  { name: 'preview_image_24', maxCount: 1 },
  { name: 'preview_image_25', maxCount: 1 },
  { name: 'preview_image_26', maxCount: 1 },
  { name: 'preview_image_27', maxCount: 1 },
  { name: 'preview_image_28', maxCount: 1 },
  { name: 'preview_image_29', maxCount: 1 },
  { name: 'event_rules', maxCount: 1 },
  { name: 'guest_profile', maxCount: 1 }
]);

export default upload;
export { uploadFields };
export const uploadTicketMedia = (req, res, next) => {
  const upload = ticketMediaUpload.fields([
    // ✅ CRITICAL: Single file fields - ticket_layout MUST be here
    { name: 'event_logo', maxCount: 1 },
    { name: 'event_banner', maxCount: 1 },
    { name: 'ticket_layout', maxCount: 1 },
    { name: 'event_rules', maxCount: 1 },
    { name: 'event_portrait', maxCount: 1 },
    { name: 'college_authorisation', maxCount: 1 },
    
    // Multiple files
    { name: 'event_images', maxCount: 10 },
  { name: 'event_videos', maxCount: 5 },
    
    // Guest profiles (0-9)
    { name: 'guest_profile_0', maxCount: 1 },
    { name: 'guest_profile_1', maxCount: 1 },
    { name: 'guest_profile_2', maxCount: 1 },
    { name: 'guest_profile_3', maxCount: 1 },
    { name: 'guest_profile_4', maxCount: 1 },
    { name: 'guest_profile_5', maxCount: 1 },
    { name: 'guest_profile_6', maxCount: 1 },
    { name: 'guest_profile_7', maxCount: 1 },
    { name: 'guest_profile_8', maxCount: 1 },
    { name: 'guest_profile_9', maxCount: 1 },
    
    // Ticket photos (0-19)
    { name: 'ticket_photo_0', maxCount: 1 },
    { name: 'ticket_photo_1', maxCount: 1 },
    { name: 'ticket_photo_2', maxCount: 1 },
    { name: 'ticket_photo_3', maxCount: 1 },
    { name: 'ticket_photo_4', maxCount: 1 },
    { name: 'ticket_photo_5', maxCount: 1 },
    { name: 'ticket_photo_6', maxCount: 1 },
    { name: 'ticket_photo_7', maxCount: 1 },
    { name: 'ticket_photo_8', maxCount: 1 },
    { name: 'ticket_photo_9', maxCount: 1 },
    { name: 'ticket_photo_10', maxCount: 1 },
    { name: 'ticket_photo_11', maxCount: 1 },
    { name: 'ticket_photo_12', maxCount: 1 },
    { name: 'ticket_photo_13', maxCount: 1 },
    { name: 'ticket_photo_14', maxCount: 1 },
    { name: 'ticket_photo_15', maxCount: 1 },
    { name: 'ticket_photo_16', maxCount: 1 },
    { name: 'ticket_photo_17', maxCount: 1 },
    { name: 'ticket_photo_18', maxCount: 1 },
    { name: 'ticket_photo_19', maxCount: 1 },
    
    // Video files (0-29)
    { name: 'video_file_0', maxCount: 1 },
    { name: 'video_file_1', maxCount: 1 },
    { name: 'video_file_2', maxCount: 1 },
    { name: 'video_file_3', maxCount: 1 },
    { name: 'video_file_4', maxCount: 1 },
    { name: 'video_file_5', maxCount: 1 },
    { name: 'video_file_6', maxCount: 1 },
    { name: 'video_file_7', maxCount: 1 },
    { name: 'video_file_8', maxCount: 1 },
    { name: 'video_file_9', maxCount: 1 },
    { name: 'video_file_10', maxCount: 1 },
    { name: 'video_file_11', maxCount: 1 },
    { name: 'video_file_12', maxCount: 1 },
    { name: 'video_file_13', maxCount: 1 },
    { name: 'video_file_14', maxCount: 1 },
    { name: 'video_file_15', maxCount: 1 },
    { name: 'video_file_16', maxCount: 1 },
    { name: 'video_file_17', maxCount: 1 },
    { name: 'video_file_18', maxCount: 1 },
    { name: 'video_file_19', maxCount: 1 },
    { name: 'video_file_20', maxCount: 1 },
    { name: 'video_file_21', maxCount: 1 },
    { name: 'video_file_22', maxCount: 1 },
    { name: 'video_file_23', maxCount: 1 },
    { name: 'video_file_24', maxCount: 1 },
    { name: 'video_file_25', maxCount: 1 },
    { name: 'video_file_26', maxCount: 1 },
    { name: 'video_file_27', maxCount: 1 },
    { name: 'video_file_28', maxCount: 1 },
    { name: 'video_file_29', maxCount: 1 },
    
    // Preview images (0-29)
    { name: 'preview_image_0', maxCount: 1 },
    { name: 'preview_image_1', maxCount: 1 },
    { name: 'preview_image_2', maxCount: 1 },
    { name: 'preview_image_3', maxCount: 1 },
    { name: 'preview_image_4', maxCount: 1 },
    { name: 'preview_image_5', maxCount: 1 },
    { name: 'preview_image_6', maxCount: 1 },
    { name: 'preview_image_7', maxCount: 1 },
    { name: 'preview_image_8', maxCount: 1 },
    { name: 'preview_image_9', maxCount: 1 },
    { name: 'preview_image_10', maxCount: 1 },
    { name: 'preview_image_11', maxCount: 1 },
    { name: 'preview_image_12', maxCount: 1 },
    { name: 'preview_image_13', maxCount: 1 },
    { name: 'preview_image_14', maxCount: 1 },
    { name: 'preview_image_15', maxCount: 1 },
    { name: 'preview_image_16', maxCount: 1 },
    { name: 'preview_image_17', maxCount: 1 },
    { name: 'preview_image_18', maxCount: 1 },
    { name: 'preview_image_19', maxCount: 1 },
    { name: 'preview_image_20', maxCount: 1 },
    { name: 'preview_image_21', maxCount: 1 },
    { name: 'preview_image_22', maxCount: 1 },
    { name: 'preview_image_23', maxCount: 1 },
    { name: 'preview_image_24', maxCount: 1 },
    { name: 'preview_image_25', maxCount: 1 },
    { name: 'preview_image_26', maxCount: 1 },
    { name: 'preview_image_27', maxCount: 1 },
    { name: 'preview_image_28', maxCount: 1 },
    { name: 'preview_image_29', maxCount: 1 }
  ]);

  upload(req, res, (err) => {
    if (err) {
      console.error('❌ Multer upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large',
          error: err.message
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          message: 'Too many files',
          error: err.message
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          message: 'Unexpected file field',
          field: err.field,
          error: err.message
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    
    if (req.files) {
      Object.entries(req.files).forEach(([fieldname, files]) => {
        files.forEach(file => {
          console.log(`  - ${fieldname}: ${file.originalname} (${file.size} bytes, buffer: ${file.buffer?.length || 0} bytes)`);
        });
      });
    }
    
    next();
  });
};
export const uploadSingleTicketMedia = ticketMediaUpload.single('file');
export const uploadMultipleTicketMedia = ticketMediaUpload.array('files', 10);

export const createDynamicTicketUpload = (maxTicketTypes = 20) => {
  const dynamicFields = [
    { name: 'event_logo', maxCount: 1 },
    { name: 'event_banner', maxCount: 1 },
    { name: 'event_images', maxCount: 10 },
    ...Array.from({ length: 10 }, (_, i) => ({ name: `guest_profile_${i}`, maxCount: 1 })),
    ...Array.from({ length: maxTicketTypes }, (_, i) => ({ name: `ticket_photo_${i}`, maxCount: 1 })),
    { name: 'ticket_layout', maxCount: 1 },
    { name: 'event_rules', maxCount: 1 },
    { name: 'college_authorisation', maxCount: 1 }
  ];
  return ticketMediaUpload.fields(dynamicFields);
};
export const uploadGroupFiles = (req, res, next) => {
  const upload = multer({
    storage,
    limits: { 
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 4
    },
    fileFilter: (req, file, cb) => {
      const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const docTypes = ['.pdf', '.doc', '.docx'];
      const allowedTypes = [...imageTypes, ...docTypes];
      
      let ext = path.extname(file.originalname).toLowerCase();
      
      // Handle missing extension by checking mimetype
      if (!ext && file.mimetype) {
        const mimeTypeMap = {
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
        };
        ext = mimeTypeMap[file.mimetype] || '';
      }
      
      // Validation based on field name
      if (file.fieldname === 'company_logo') {
        if (!imageTypes.includes(ext)) {
          return cb(new Error('Company logo must be an image file (JPG, JPEG, PNG, GIF, WEBP)'), false);
        }
      } else if (file.fieldname === 'id_proof' || 
                 file.fieldname === 'bank_check' || 
                 file.fieldname === 'company_certificate') {
        // These fields accept both images and documents
        if (!allowedTypes.includes(ext)) {
          return cb(new Error(`${file.fieldname} must be an image (JPG, JPEG, PNG, GIF, WEBP) or document (PDF, DOC, DOCX)`), false);
        }
      } else {
        // Other fields default to accepting all allowed types
        if (!allowedTypes.includes(ext)) {
          return cb(new Error('Only image (JPG, JPEG, PNG, GIF, WEBP) and document (PDF, DOC, DOCX) files are allowed'), false);
        }
      }
      
      cb(null, true);
    }
  }).fields([
    { name: 'id_proof', maxCount: 1 },
    { name: 'bank_check', maxCount: 1 },
    { name: 'company_certificate', maxCount: 1 },
    { name: 'company_logo', maxCount: 1 }
  ]);

  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'File too large. Maximum 10MB allowed.',
          error: err.message
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          message: 'Too many files. Maximum 4 files allowed.',
          error: err.message
        });
      }
      return res.status(400).json({
        message: 'File upload error',
        error: err.message
      });
    }
    next();
  });
};
