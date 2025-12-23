import { uploadToCloudinary, getCloudinaryFolder, getResourceType } from '../middlewares/upload.js';
import cloudinary from '../cloudinary/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import axios from 'axios';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const processGroupFileUploads = async (files) => {
  const uploadedFiles = {};
  try {
    const groupFileFields = [
      'id_proof',
      'bank_check',
      'company_certificate',
      'company_logo'
    ];

    for (const fieldName of groupFileFields) {
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        const folder = getCloudinaryFolder(fieldName);
        
        // Determine resource type based on field name and mimetype
        let resourceType;
        if (fieldName === 'company_logo') {
          resourceType = 'image';
        } else {
          // For id_proof, bank_check, company_certificate
          resourceType = getResourceType(fieldName, file.mimetype);
        }

        console.log(`Uploading ${fieldName} to Cloudinary (type: ${resourceType})...`);
        
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles[fieldName] = result.url;
        console.log(` ${fieldName} uploaded:`, result.url);
      }
    }

    return uploadedFiles;
  } catch (error) {
    console.error('Error processing group file uploads:', error);
    throw new Error(`Group file upload failed: ${error.message}`);
  }
};
export const processFileUploads = async (files) => {
  const uploadedFiles = {};
  const uploadPromises = []; // Collect all promises for parallel execution

  try {
    const singleFileFields = [
      'event_logo',
      'event_banner',
      'event_rules',
      'event_portrait', // Already added
      'college_authorisation'
    ];

    // Helper to push upload tasks into the promise array
    const addUploadTask = (file, fieldName, isMultiple = false) => {
      if (!file.buffer || file.buffer.length === 0) return;
      
      const folder = getCloudinaryFolder(fieldName);
      const resourceType = getResourceType(fieldName, file.mimetype);

      const task = uploadToCloudinary(file.buffer, { folder, resourceType })
        .then((result) => {
          if (isMultiple) {
            if (!uploadedFiles[fieldName]) uploadedFiles[fieldName] = [];
            uploadedFiles[fieldName].push({
              path: result.url,
              originalName: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
              public_id: result.public_id,
              resource_type: result.resource_type
            });
          } else {
            uploadedFiles[fieldName] = result.url;
          }
        });
      uploadPromises.push(task);
    };

    // 1. Process Single File Fields
    for (const fieldName of singleFileFields) {
      if (files[fieldName] && files[fieldName][0]) {
        addUploadTask(files[fieldName][0], fieldName, false);
      }
    }

    // 2. Process Ticket Layout (Kept sequential due to your temp file logic)
    if (files.ticket_layout && files.ticket_layout[0]) {
      const file = files.ticket_layout[0];
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      const tempFilePath = path.join(tempDir, `layout_${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tempFilePath, file.buffer);

      const folder = getCloudinaryFolder('ticket_layout');
      const resourceType = getResourceType('ticket_layout', file.mimetype);
      const result = await uploadToCloudinary(file.buffer, { folder, resourceType });
      
      uploadedFiles.ticket_layout = {
        cloudinaryUrl: result.url,
        localPath: tempFilePath,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        public_id: result.public_id,
        resource_type: result.resource_type
      };
    }

    // 3. Process Multiple Event Images
    if (files.event_images && files.event_images.length > 0) {
      files.event_images.forEach(file => addUploadTask(file, 'event_images', true));
    }

    // 4. Process Multiple Event Videos (NEWLY ADDED)
    if (files.event_videos && files.event_videos.length > 0) {
      files.event_videos.forEach(file => addUploadTask(file, 'event_videos', true));
    }

    // 5. Process Dynamic Fields (Guest Profiles, Ticket Photos, etc.)
    for (let i = 0; i < 30; i++) {
      if (i < 10 && files[`guest_profile_${i}`]?.[0]) addUploadTask(files[`guest_profile_${i}`][0], `guest_profile_${i}`, true);
      if (i < 20 && files[`ticket_photo_${i}`]?.[0]) addUploadTask(files[`ticket_photo_${i}`][0], `ticket_photo_${i}`, true);
      if (files[`video_file_${i}`]?.[0]) addUploadTask(files[`video_file_${i}`][0], `video_file_${i}`, true);
      if (files[`preview_image_${i}`]?.[0]) addUploadTask(files[`preview_image_${i}`][0], `preview_image_${i}`, true);
    }

    // 🚀 EXECUTE ALL UPLOADS IN PARALLEL
    await Promise.all(uploadPromises);

    return uploadedFiles;
  } catch (error) {
    console.error('❌ Error processing file uploads:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};
export const downloadFileFromCloudinary = async (cloudinaryUrl, fileName = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      // Generate filename if not provided
      const finalFileName = fileName || `temp_${Date.now()}_${path.basename(cloudinaryUrl)}`;
      const localPath = path.join(tempDir, finalFileName);
      // Determine protocol
      const protocol = cloudinaryUrl.startsWith('https') ? https : http;
      // Download file
      const file = fs.createWriteStream(localPath);
      protocol.get(cloudinaryUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download file: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`Downloaded file to: ${localPath}`);
          resolve(localPath);
        });
      }).on('error', (error) => {
        fs.unlink(localPath, () => {}); 
        reject(error);
      });

      file.on('error', (error) => {
        fs.unlink(localPath, () => {}); // Delete incomplete file
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};
export const cleanupTempFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
};
export const cleanupOldTempFiles = async (hoursOld = 24) => {
  try {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) return;

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = hoursOld * 60 * 60 * 1000; // Convert hours to milliseconds

    let deletedCount = 0;
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    });
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old temp files`);
    }
  } catch (error) {
    console.error('Error cleaning up old temp files:', error);
  }
};
export const uploadGeneratedLayoutToCloudinary = async (layoutObject, ticketId) => {
  try {
    if (!layoutObject || !layoutObject.seats) {
      throw new Error('Invalid layout object');
    }

    // Convert layout object to JSON string
    const jsonContent = JSON.stringify(layoutObject, null, 2);
    const buffer = Buffer.from(jsonContent, 'utf-8');

    // Upload as raw file to Cloudinary
    const folder = `ticket_layouts/generated`;
    const result = await cloudinary.uploader.upload(`data:text/plain;base64,${buffer.toString('base64')}`, {
      folder: folder,
      resource_type: 'raw',
      public_id: `generated_layout_${ticketId}_${Date.now()}`,
      format: 'json'
    });
    console.log(`✅ Generated layout uploaded to Cloudinary: ${result.url}`);
    return {
      url: result.url,
      public_id: result.public_id,
      resource_type: result.resource_type
    };
  } catch (error) {
    console.error('❌ Error uploading generated layout:', error);
    throw error;
  }
};
export const deleteFromCloudinary = async (publicIds, resourceType = 'image') => {
  try {
    const idsArray = Array.isArray(publicIds) ? publicIds : [publicIds];
    
    const deletePromises = idsArray.map(async (publicId) => {
      if (!publicId) return null;
      
      // Extract public_id from URL if full URL is provided
      let extractedId = publicId;
      if (publicId.includes('cloudinary.com')) {
        const urlParts = publicId.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          // Get everything after 'upload' and version
          const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension
          extractedId = pathAfterUpload.replace(/\.[^/.]+$/, '');
        }
      }

      console.log(`Deleting from Cloudinary: ${extractedId}`);
      const result = await cloudinary.uploader.destroy(extractedId, {
        resource_type: resourceType
      });
      console.log(`✅ Deleted: ${extractedId}`, result);
      return result;
    });

    const results = await Promise.all(deletePromises);
    return results;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

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
setInterval(() => {
  cleanupOldTempFiles(24); 
}, 6 * 60 * 60 * 1000); 
cleanupOldTempFiles(24);
export default {
  processFileUploads,
  processGroupFileUploads,
  deleteFromCloudinary,
  extractPublicId,
  downloadFileFromCloudinary,
  cleanupTempFile,
  cleanupOldTempFiles,
  uploadGeneratedLayoutToCloudinary  
};
