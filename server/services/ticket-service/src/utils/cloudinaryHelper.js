import { uploadToCloudinary, getCloudinaryFolder, getResourceType } from '../middlewares/upload.js';
import cloudinary from '../cloudinary/cloudinary.js';
export const processFileUploads = async (files) => {
  const uploadedFiles = {};

  try {
    // Process single file fields (event_logo, event_banner, etc.)
    const singleFileFields = [
      'event_logo',
      'event_banner',
      'event_rules',
      'college_authorisation',
      'ticket_layout'
    ];

    for (const fieldName of singleFileFields) {
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        const folder = getCloudinaryFolder(fieldName);
        const resourceType = getResourceType(fieldName, file.mimetype);

        console.log(`Uploading ${fieldName} to Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles[fieldName] = result.url;
        console.log(`✅ ${fieldName} uploaded:`, result.url);
      }
    }

    // Process event_images (multiple files)
    if (files.event_images && files.event_images.length > 0) {
      console.log(`Uploading ${files.event_images.length} event images/videos...`);
      uploadedFiles.event_images = [];

      for (const file of files.event_images) {
        const folder = getCloudinaryFolder('event_images');
        const resourceType = getResourceType('event_images', file.mimetype);

        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles.event_images.push({
          path: result.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          public_id: result.public_id,
          resource_type: result.resource_type
        });

        console.log(`✅ Event image uploaded:`, result.url);
      }
    }
    for (let i = 0; i < 10; i++) {
      const fieldName = `guest_profile_${i}`;
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        const folder = getCloudinaryFolder('guest_profile');
        const resourceType = 'image';
        console.log(`Uploading ${fieldName} to Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });
        uploadedFiles[fieldName] = [{
          path: result.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          public_id: result.public_id,
          resource_type: result.resource_type
        }];
        console.log(`✅ ${fieldName} uploaded:`, result.url);
      }
    }
    // Process ticket photos (ticket_photo_0, ticket_photo_1, etc.)
    for (let i = 0; i < 20; i++) {
      const fieldName = `ticket_photo_${i}`;
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        const folder = getCloudinaryFolder('ticket_photo');
        const resourceType = 'image';

        console.log(`Uploading ${fieldName} to Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles[fieldName] = [{
          path: result.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          public_id: result.public_id,
          resource_type: result.resource_type
        }];
        
        console.log(`✅ ${fieldName} uploaded:`, result.url);
      }
    }

    // Process video files and preview images (for recorded events)
    for (let i = 0; i < 30; i++) {
      const videoFieldName = `video_file_${i}`;
      const previewFieldName = `preview_image_${i}`;

      if (files[videoFieldName] && files[videoFieldName][0]) {
        const file = files[videoFieldName][0];
        const folder = getCloudinaryFolder('video_file');
        const resourceType = 'video';

        console.log(`Uploading ${videoFieldName} to Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles[videoFieldName] = [{
          path: result.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          public_id: result.public_id,
          resource_type: result.resource_type
        }];
        
        console.log(`✅ ${videoFieldName} uploaded:`, result.url);
      }

      if (files[previewFieldName] && files[previewFieldName][0]) {
        const file = files[previewFieldName][0];
        const folder = getCloudinaryFolder('preview_image');
        const resourceType = 'image';

        console.log(`Uploading ${previewFieldName} to Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });

        uploadedFiles[previewFieldName] = [{
          path: result.url,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          public_id: result.public_id,
          resource_type: result.resource_type
        }];
        
        console.log(`✅ ${previewFieldName} uploaded:`, result.url);
      }
    }

    return uploadedFiles;
  } catch (error) {
    console.error('Error processing file uploads:', error);
    throw new Error(`File upload failed: ${error.message}`);
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
