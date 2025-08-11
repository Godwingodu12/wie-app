import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Common storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

// General upload middleware (your original one) - for PDF, doc, and images
const generalFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) return cb(new Error('Only PDF, doc, and image files are allowed'));
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: generalFileFilter,
});

// Ticket Media specific upload middleware - for images and videos only
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

const ticketMediaUpload = multer({
  storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max for videos
    files: 12 // Maximum 12 files total
  },
  fileFilter: ticketMediaFileFilter,
});

// Export general upload (your original)
export default upload;
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
