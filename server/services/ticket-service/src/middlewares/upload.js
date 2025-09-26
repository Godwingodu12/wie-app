import multer from 'multer';
import path from 'path';
import fs from 'fs';

const createDirectories = () => {
  const dirs = [
    'uploads/guest_profiles',
    'uploads/event_rules',
    'uploads/college_authorisations',
    'uploads/event_images',
    'uploads/event_logos',
    'uploads/event_banners',
    'uploads/ticket_photos',
    'uploads/ticket_layouts'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createDirectories();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith('guest_profile')) {
      cb(null, 'uploads/guest_profiles/');
    } else if (file.fieldname === 'event_rules') {
      cb(null, 'uploads/event_rules/');
    } else if (file.fieldname === 'college_authorisation') {
      cb(null, 'uploads/college_authorisations/');
    } else if (file.fieldname === 'event_logo') {
      cb(null, 'uploads/event_logos/');
    } else if (file.fieldname === 'event_banner') {
      cb(null, 'uploads/event_banners/');
    } else if (file.fieldname.startsWith('event_image')) {
      cb(null, 'uploads/event_images/');
    } else if (file.fieldname === 'event_images') {
      cb(null, 'uploads/event_images/');
    } else if (file.fieldname.startsWith('ticket_photo')) {
      cb(null, 'uploads/ticket_photos/');
    } else if (file.fieldname === 'ticket_layout') {
      cb(null, 'uploads/ticket_layouts/');
    } else {
      cb(null, 'uploads/');
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// General file filter (your original) - for PDF, doc, and images
const generalFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Enhanced validation for different field types
  if (file.fieldname.startsWith('guest_profile')) {
    // Guest profiles must be images only
    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!imageTypes.includes(ext)) {
      return cb(new Error('Guest profile must be an image file (JPG, JPEG, PNG, GIF, WEBP)'));
    }
  } else if (file.fieldname === 'event_rules') {
    // Event rules must be documents only
    const docTypes = ['.pdf', '.doc', '.docx'];
    if (!docTypes.includes(ext)) {
      return cb(new Error('Event rules file must be a document (PDF, DOC, DOCX)'));
    }
  } else if (!allowed.includes(ext)) {
    return cb(new Error('Only PDF, DOC, DOCX, and image files are allowed'));
  }
  
  cb(null, true);
};

// General upload middleware
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: generalFileFilter,
});

// FIXED: Enhanced Ticket Media specific file filter - for images, videos and documents
const ticketMediaFileFilter = (req, file, cb) => {
  try {
    // Log the file being processed for debugging
    console.log('Processing file:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype
    });

    const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
    const docTypes = ['.pdf', '.doc', '.docx'];
    
    // Get file extension - handle cases where there might be no extension
    let ext = path.extname(file.originalname).toLowerCase();
    
    // If no extension, try to determine from MIME type
    if (!ext && file.mimetype) {
      const mimeTypeMap = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
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
      console.log('Extension determined from MIME type:', file.mimetype, '->', ext);
    }
    
    if (!ext) {
      return cb(new Error(`File must have a valid extension or MIME type. Received: ${file.originalname} with MIME type: ${file.mimetype}`), false);
    }
    
    // Define allowed types for each field
    const fieldTypeMap = {
      // Documents only
      college_authorisation: {
        allowed: docTypes,
        errorMsg: 'College authorization file must be a document (PDF, DOC, DOCX)'
      },
      event_rules: {
        allowed: docTypes,
        errorMsg: 'Event rules file must be a document (PDF, DOC, DOCX)'
      },
      
      // Images only
      event_logo: {
        allowed: imageTypes,
        errorMsg: 'Event logo must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
      },
      event_banner: {
        allowed: imageTypes,
        errorMsg: 'Event banner must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
      },
      ticket_layout: {
        allowed: imageTypes,
        errorMsg: 'Ticket layout must be an image file (JPG, JPEG, PNG, GIF, WEBP)'
      },
      
      // Images and videos
      event_images: {
        allowed: [...imageTypes, ...videoTypes],
        errorMsg: 'Event images must be image or video files (JPG, JPEG, PNG, GIF, WEBP, MP4, AVI, MOV, WMV, FLV, WEBM)'
      }
    };
    
    // Handle guest profile fields (guest_profile_0, guest_profile_1, etc.)
    if (file.fieldname.startsWith('guest_profile')) {
      if (imageTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Guest profile must be an image file (JPG, JPEG, PNG, GIF, WEBP)'), false);
      }
    }
    
    // Handle ticket photo fields (ticket_photo_0, ticket_photo_1, etc.)
    if (file.fieldname.startsWith('ticket_photo')) {
      if (imageTypes.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error('Ticket photo must be an image file (JPG, JPEG, PNG, GIF, WEBP)'), false);
      }
    }
    
    // Handle defined field types
    const fieldConfig = fieldTypeMap[file.fieldname];
    if (fieldConfig) {
      if (fieldConfig.allowed.includes(ext)) {
        return cb(null, true);
      } else {
        return cb(new Error(fieldConfig.errorMsg), false);
      }
    }
    
    // Default: check if it's any allowed file type
    const allAllowedTypes = [...imageTypes, ...videoTypes, ...docTypes];
    if (allAllowedTypes.includes(ext)) {
      return cb(null, true);
    }
    
    // If we reach here, the file type is not allowed
    return cb(new Error(`Only images (${imageTypes.join(', ')}), videos (${videoTypes.join(', ')}), and documents (${docTypes.join(', ')}) are allowed`), false);
    
  } catch (error) {
    console.error('Error in ticketMediaFileFilter:', error);
    return cb(new Error('File validation error'), false);
  }
};

// Enhanced Ticket media upload middleware with dynamic field support
const ticketMediaUpload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
    files: 50 // Maximum 50 files total
  },
  fileFilter: ticketMediaFileFilter,
});

// FIXED: Updated uploadFields to support multiple guest profiles (0-9)
const uploadFields = upload.fields([
  // Guest profile images - supports up to 10 guests
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
  
  // Event rules document
  { name: 'event_rules', maxCount: 1 },
  
  // Backward compatibility - keep original guest_profile for older endpoints
  { name: 'guest_profile', maxCount: 1 }
]);

// Export general upload (your original)
export default upload;

// Export the FIXED uploadFields for createTicketBasicInfo API
export { uploadFields };

// FIXED: Enhanced ticket media upload middleware with ALL required fields
export const uploadTicketMedia = ticketMediaUpload.fields([
  // Event media files
  { name: 'event_logo', maxCount: 1 },
  { name: 'event_banner', maxCount: 1 },
  { name: 'event_images', maxCount: 10 },
  
  // Guest profile images - supports up to 10 guests
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
  
  // Ticket photos for different ticket types
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
  
  // Additional fields for offline events
  { name: 'ticket_layout', maxCount: 1 },
  
  // Event rules document
  { name: 'event_rules', maxCount: 1 },
  
  // College authorization document
  { name: 'college_authorisation', maxCount: 1 }
]);

// Alternative: Single file upload for ticket media (if needed)
export const uploadSingleTicketMedia = ticketMediaUpload.single('file');

// Alternative: Multiple files with same field name (if needed)
export const uploadMultipleTicketMedia = ticketMediaUpload.array('files', 10);

// Enhanced: Dynamic field support for any number of ticket photos
export const createDynamicTicketUpload = (maxTicketTypes = 20) => {
  const dynamicFields = [
    // Fixed event media fields
    { name: 'event_logo', maxCount: 1 },
    { name: 'event_banner', maxCount: 1 },
    { name: 'event_images', maxCount: 10 },
    
    // Guest profiles
    ...Array.from({ length: 10 }, (_, i) => ({ name: `guest_profile_${i}`, maxCount: 1 })),
    
    // Dynamic ticket photos based on maxTicketTypes
    ...Array.from({ length: maxTicketTypes }, (_, i) => ({ name: `ticket_photo_${i}`, maxCount: 1 })),
    
    // Other fields
    { name: 'ticket_layout', maxCount: 1 },
    { name: 'event_rules', maxCount: 1 },
    { name: 'college_authorisation', maxCount: 1 }
  ];
  return ticketMediaUpload.fields(dynamicFields);
};
