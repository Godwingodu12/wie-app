export const getImageUrl = (imagePath, service = 'auth') => {
  if (!imagePath) return null;
  
  // If it's already a full URL (Cloudinary or any external URL), return as is
  if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }
  
  // If it's a cloudinary URL without protocol (shouldn't happen, but just in case)
  if (typeof imagePath === 'string' && imagePath.includes('cloudinary.com')) {
    return `https://${imagePath}`;
  }
  
  const baseUrls = {
    auth: import.meta.env.VITE_AUTH_API_BASE_URL,
    ticket: import.meta.env.VITE_TICKET_API_BASE_URL
  };
  
  const baseUrl = baseUrls[service] || baseUrls.auth;
  
  // Clean the path
  let cleanPath = imagePath.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/^src\//, '');
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // If path doesn't start with 'uploads/', add it
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  
  return `${baseUrl}/${cleanPath}`;
};

// New function specifically for ticket/event images with better error handling
export const getTicketImageUrl = (imagePath, fallbackUrl = null) => {
  if (!imagePath) return fallbackUrl;
  
  // If it's already a full URL (Cloudinary or external), return as is
  if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    return imagePath;
  }
  
  // If it's a cloudinary URL without protocol
  if (typeof imagePath === 'string' && imagePath.includes('cloudinary.com')) {
    return `https://${imagePath}`;
  }
  
  // For local server images
  const baseUrl = import.meta.env.VITE_TICKET_API_BASE_URL;
  
  if (!baseUrl) {
    console.error('VITE_TICKET_API_BASE_URL is not defined');
    return fallbackUrl;
  }
  
  // Clean the path
  let cleanPath = imagePath.replace(/\\/g, '/');
  cleanPath = cleanPath.replace(/^src\//, '');
  cleanPath = cleanPath.replace(/^\/+/, '');
  
  // If path doesn't start with 'uploads/', add it
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/${cleanPath}`;
  }
  
  return `${baseUrl}/${cleanPath}`;
};
export const isCloudinaryUrl = (imageUrl) => {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com');
};
export const getOptimizedImageUrl = (imageUrl, options = {}) => {
  if (!isCloudinaryUrl(imageUrl)) return imageUrl;
  
  const {
    width = null,
    height = null,
    quality = 'auto:good',
    format = 'auto',
    crop = 'limit'
  } = options;
  
  try {
    // Parse the Cloudinary URL
    const urlParts = imageUrl.split('/upload/');
    if (urlParts.length !== 2) return imageUrl;
    
    // Build transformation string
    const transformations = [];
    
    if (width || height) {
      let transform = '';
      if (width) transform += `w_${width}`;
      if (height) transform += `,h_${height}`;
      if (crop) transform += `,c_${crop}`;
      transformations.push(transform);
    }
    
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);
    
    const transformString = transformations.join(',');
    
    // Reconstruct URL with transformations
    return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return imageUrl;
  }
};

export const getImageUrlWithFallback = (imagePath, defaultImage = '/default-avatar.png', service = 'auth') => {
  const imageUrl = getImageUrl(imagePath, service);
  return imageUrl || defaultImage;
};
export const isImageValid = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};
