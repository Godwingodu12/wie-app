import { uploadToCloudinary, uploadLargeToCloudinary, deleteFromCloudinary, extractPublicId, getResourceType } from '../middleware/upload.js';
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10 MB

export const uploadChatImage = async (buffer, options = {}) => {
  try {
    const uploadFn = buffer.length > LARGE_FILE_THRESHOLD
      ? uploadLargeToCloudinary
      : uploadToCloudinary;

    const result = await uploadFn(buffer, {
      folder:       'WIE_CHAT/chat_images',
      resourceType: 'image',
      ...options,
    });
    return result.url;
  } catch (error) {
    console.error('Error uploading chat image:', error);
    throw new Error(`Failed to upload chat image: ${error.message}`);
  }
};

export const deleteChatImage = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    if (!imageUrl.includes('cloudinary.com')) return null;
    return await deleteFromCloudinary(imageUrl, 'image');
  } catch (error) {
    console.error('Error deleting chat image:', error);
    throw error;
  }
};

export const replaceChatImage = async (newImageBuffer, oldImageUrl, options = {}) => {
  try {
    const newImageUrl = await uploadChatImage(newImageBuffer, options);
    if (oldImageUrl?.includes('cloudinary.com')) {
      try { await deleteChatImage(oldImageUrl); } catch { /* non-fatal */ }
    }
    return newImageUrl;
  } catch (error) {
    console.error('Error replacing chat image:', error);
    throw error;
  }
};

export const uploadChatVideo = async (buffer, options = {}) => {
  try {
    const uploadFn = buffer.length > LARGE_FILE_THRESHOLD
      ? uploadLargeToCloudinary
      : uploadToCloudinary;

    const result = await uploadFn(buffer, {
      folder:       'WIE_CHAT/chat_videos',
      resourceType: 'video',
      ...options,
    });
    return {
      url:      result.url,
      duration: result.duration || 0,
      bytes:    result.bytes,
      format:   result.format,
      width:    result.width,
      height:   result.height
    };
  } catch (error) {
    console.error('Error uploading chat video:', error);
    throw new Error(`Failed to upload chat video: ${error.message}`);
  }
};

export const deleteChatVideo = async (videoUrl) => {
  try {
    if (!videoUrl?.includes('cloudinary.com')) return null;
    return await deleteFromCloudinary(videoUrl, 'video');
  } catch (error) {
    console.error('Error deleting chat video:', error);
    throw error;
  }
};

// Map mime types that Cloudinary rejects to their accepted format equivalents
const AUDIO_FORMAT_MAP = {
  'audio/mpeg':  'mp3',
  'audio/mp3':   'mp3',
  'audio/mp4':   'm4a',
  'audio/x-m4a': 'm4a',
  'audio/ogg':   'ogg',
  'audio/opus':  'opus',
  'audio/wav':   'wav',
  'audio/x-wav': 'wav',
  'audio/webm':  'webm',
  'audio/aac':   'aac',
  'audio/flac':  'flac',
};

export const uploadChatAudio = async (buffer, options = {}) => {
  try {
    const mimeType     = options.mimeType || '';
    const mappedFormat = AUDIO_FORMAT_MAP[mimeType] || null;

    const result = await uploadToCloudinary(buffer, {
      folder:       'WIE_CHAT/chat_audio',
      resourceType: 'video',   
      ...options,
      mimeType: mappedFormat ? `audio/${mappedFormat}` : undefined,
    });

    return {
      url:      result.url,
      duration: result.duration || 0,
      bytes:    result.bytes,
      format:   result.format,
    };
  } catch (error) {
    console.error('Error uploading chat audio:', error);
    throw new Error(`Failed to upload chat audio: ${error.message}`);
  }
};

// ─── Documents 
export const uploadChatDocument = async (buffer, options = {}) => {
  try {
    const result = await uploadToCloudinary(buffer, {
      folder:       'WIE_CHAT/chat_documents',
      resourceType: 'raw',
      ...options
    });
    return {
      url:           result.url,
      bytes:         result.bytes,
      format:        result.format,
      original_name: options.originalName || result.original_name
    };
  } catch (error) {
    console.error('Error uploading chat document:', error);
    throw new Error(`Failed to upload chat document: ${error.message}`);
  }
};

export const deleteChatDocument = async (docUrl) => {
  try {
    if (!docUrl?.includes('cloudinary.com')) return null;
    return await deleteFromCloudinary(docUrl, 'raw');
  } catch (error) {
    console.error('Error deleting chat document:', error);
    throw error;
  }
};

// ─── Generic uploader (detects type automatically) 
export const uploadChatMedia = async (buffer, mimeType, originalName, options = {}) => {
  const resourceType = getResourceType(mimeType, originalName);
  const folderMap = {
    image: 'WIE_CHAT/chat_images',
    video: 'WIE_CHAT/chat_videos',
    raw:   'WIE_CHAT/chat_documents'
  };
  // Special folder for audio (stored as 'video' resource_type in Cloudinary)
  const isAudio = mimeType?.startsWith('audio/') || ['.mp3','.wav','.ogg','.aac','.flac','.m4a','.opus'].some(e => originalName?.endsWith(e));
  const folder  = isAudio ? 'WIE_CHAT/chat_audio' : (folderMap[resourceType] || 'WIE_CHAT/chat_files');

  const result = await uploadToCloudinary(buffer, {
    folder,
    resourceType,
    originalName,
    ...options
  });
  return result;
};

// ─── Batch delete 
export const batchDeleteImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls
      .filter(url => url?.includes('cloudinary.com'))
      .map(url => deleteChatImage(url).catch(() => null));
    const results = await Promise.all(deletePromises);
    return results.filter(Boolean);
  } catch (error) {
    console.error('Error in batch delete:', error);
    throw error;
  }
};

export { extractPublicId };