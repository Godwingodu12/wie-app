import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from '../middlewares/upload.js';

export const uploadProfileImage = async (buffer, options = {}) => {
  try {
    // Simple upload without transformations
    const result = await uploadToCloudinary(buffer, {
      folder: 'WIE_AUTH/profile_images',
      publicId: options.publicId || undefined
      // ❌ NO transformation here
    });
    
    return result.url;
  } catch (error) {
    console.error('Error uploading profile image:', error);
    throw new Error(`Failed to upload profile image: ${error.message}`);
  }
};

export const deleteProfileImage = async (imageUrl) => {
  try {
    if (!imageUrl) return null;
    
    // Only delete if it's a Cloudinary URL
    if (!imageUrl.includes('cloudinary.com')) {
      console.log('Not a Cloudinary URL, skipping deletion');
      return null;
    }
    
    const result = await deleteFromCloudinary(imageUrl);
    return result;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
};

export const replaceProfileImage = async (newImageBuffer, oldImageUrl, options = {}) => {
  try {
    // Upload new image first
    const newImageUrl = await uploadProfileImage(newImageBuffer, options);
    
    // Delete old image if it exists
    if (oldImageUrl && oldImageUrl.includes('cloudinary.com')) {
      try {
        await deleteProfileImage(oldImageUrl);
      } catch (deleteError) {
        console.warn('Failed to delete old image, but new image uploaded successfully:', deleteError.message);
      }
    }
    
    return newImageUrl;
  } catch (error) {
    console.error('Error replacing profile image:', error);
    throw error;
  }
};

export const batchDeleteImages = async (imageUrls) => {
  try {
    const deletePromises = imageUrls
      .filter(url => url && url.includes('cloudinary.com'))
      .map(url => deleteFromCloudinary(url).catch(err => {
        console.error(`Failed to delete ${url}:`, err.message);
        return null;
      }));
    
    const results = await Promise.all(deletePromises);
    return results.filter(result => result !== null);
  } catch (error) {
    console.error('Error in batch delete:', error);
    throw error;
  }
};
export { extractPublicId };
