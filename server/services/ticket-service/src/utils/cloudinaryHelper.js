import { uploadToCloudinary, getCloudinaryFolder, getResourceType } from '../middlewares/upload.js';
import cloudinary from '../cloudinary/cloudinary.js';
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
        console.log(`✅ ${fieldName} uploaded:`, result.url);
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

  try {
    const singleFileFields = [
      'event_logo',
      'event_banner',
      'event_rules',
      'college_authorisation'
    ];
    for (const fieldName of singleFileFields) {
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        // Enhanced validation
        console.log(`📋 Processing ${fieldName}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          bufferLength: file.buffer?.length || 0,
          hasBuffer: !!file.buffer
        });
        // Validate file exists and has content
        if (!file.buffer) {
          console.error(`❌ No buffer for ${fieldName}`);
          throw new Error(`File ${fieldName} has no buffer. Please ensure file is properly uploaded.`);
        }
        
        if (file.buffer.length === 0) {
          console.error(`❌ Empty buffer for ${fieldName}`);
          throw new Error(`File ${fieldName} is empty (0 bytes). Please upload a valid file.`);
        }
        if (file.size === 0) {
          console.error(`❌ Zero size for ${fieldName}`);
          throw new Error(`File ${fieldName} has zero size. Please upload a valid file.`);
        }
        const folder = getCloudinaryFolder(fieldName);
        const resourceType = getResourceType(fieldName, file.mimetype);  
        const result = await uploadToCloudinary(file.buffer, {
          folder,
          resourceType
        });
        // Store just the URL for all single file fields
        uploadedFiles[fieldName] = result.url;
      }
    }
    // Process ticket_layout
    if (files.ticket_layout && files.ticket_layout[0]) {
      const file = files.ticket_layout[0];
      if (!file.buffer || file.buffer.length === 0) {
        throw new Error('Ticket layout file is empty. Please upload a valid file.');
      }
      const folder = getCloudinaryFolder('ticket_layout');
      const resourceType = getResourceType('ticket_layout', file.mimetype);
      const result = await uploadToCloudinary(file.buffer, {
        folder,
        resourceType
      });

      uploadedFiles.ticket_layout = [{
        path: result.url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        public_id: result.public_id,
        resource_type: result.resource_type
      }];
    }
    // Process event_images (multiple files)
    if (files.event_images && files.event_images.length > 0) {
      console.log(`📸 Uploading ${files.event_images.length} event images/videos...`);
      uploadedFiles.event_images = [];
      for (const file of files.event_images) {
        if (!file.buffer || file.buffer.length === 0) {
          console.warn(`⚠️ Skipping empty event image: ${file.originalname}`);
          continue;
        }
        
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
      }
    }
    // Process guest profiles
    for (let i = 0; i < 10; i++) {
      const fieldName = `guest_profile_${i}`;
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        if (!file.buffer || file.buffer.length === 0) {
          console.warn(`⚠️ Skipping empty ${fieldName}`);
          continue;
        }
        const folder = getCloudinaryFolder('guest_profile');
        const resourceType = 'image';
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
      }
    }
    
    // Process ticket photos (ticket_photo_0, ticket_photo_1, etc.)
    for (let i = 0; i < 20; i++) {
      const fieldName = `ticket_photo_${i}`;
      if (files[fieldName] && files[fieldName][0]) {
        const file = files[fieldName][0];
        if (!file.buffer || file.buffer.length === 0) {
          console.warn(`⚠️ Skipping empty ${fieldName}`);
          continue;
        }
        const folder = getCloudinaryFolder('ticket_photo');
        const resourceType = 'image';
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
      }
    }

    // Process video files and preview images (for recorded events)
    for (let i = 0; i < 30; i++) {
      const videoFieldName = `video_file_${i}`;
      const previewFieldName = `preview_image_${i}`;
      if (files[videoFieldName] && files[videoFieldName][0]) {
        const file = files[videoFieldName][0];
        if (!file.buffer || file.buffer.length === 0) {
          console.warn(`⚠️ Skipping empty ${videoFieldName}`);
          continue;
        }
        const folder = getCloudinaryFolder('video_file');
        const resourceType = 'video';
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
      }
      if (files[previewFieldName] && files[previewFieldName][0]) {
        const file = files[previewFieldName][0];
        
        if (!file.buffer || file.buffer.length === 0) {
          continue;
        }
        
        const folder = getCloudinaryFolder('preview_image');
        const resourceType = 'image';
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
    console.error('❌ Error processing file uploads:', error);
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
