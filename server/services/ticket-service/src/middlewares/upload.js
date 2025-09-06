import multer from 'multer';
import path from 'path';
import fs from 'fs';

const createDirectories = () => {
  const dirs = [
    'uploads/guest_profiles',
    'uploads/event_rules',
    'uploads/event_images',
    'uploads/event_logos',
    'uploads/event_banners'
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
    } else if (file.fieldname === 'event_logo') {
      cb(null, 'uploads/event_logos/');
    } else if (file.fieldname === 'event_banner') {
      cb(null, 'uploads/event_banners/');
    } else if (file.fieldname.startsWith('event_image')) {
      cb(null, 'uploads/event_images/');
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

// Ticket Media specific file filter - for images and videos only
const ticketMediaFileFilter = (req, file, cb) => {
  const imageTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const videoTypes = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (imageTypes.includes(ext) || videoTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Only images (${imageTypes.join(', ')}) and videos (${videoTypes.join(', ')}) are allowed`), false);
  }
};

// Ticket media upload middleware
const ticketMediaUpload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
    files: 12 // Maximum 12 files total
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

// Export ticket media specific upload middleware
export const uploadTicketMedia = ticketMediaUpload.fields([
  { name: 'event_logo', maxCount: 1 },
  { name: 'event_banner', maxCount: 1 },
  { name: 'event_images', maxCount: 10 }
]);

// Alternative: Single file upload for ticket media (if needed)
export const uploadSingleTicketMedia = ticketMediaUpload.single('file');

// Alternative: Multiple files with same field name (if needed)
export const uploadMultipleTicketMedia = ticketMediaUpload.array('files', 10);
