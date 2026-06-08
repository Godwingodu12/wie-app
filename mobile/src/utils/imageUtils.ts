import images from '@/constants/images';
import { LOCAL_IP } from '@/constants/config';

/**
 * Validates and formats an image source for expo-image or React Native Image.
 * Handles null, undefined, empty strings, and common invalid string values.
 * Automatically replaces 'localhost' with the development machine IP.
 */
export const getImageSource = (source: any, fallback: any = images.defaultAvatar) => {
  if (source === null || source === undefined) return fallback;

  // If it's already a number (local asset required via require())
  if (typeof source === 'number') return source;

  if (typeof source === 'string') {
    let trimmed = source.trim();
    
    if (
      trimmed === '' || 
      trimmed === 'null' || 
      trimmed === 'undefined' || 
      trimmed === 'https://via.placeholder.com/150' ||
      trimmed.startsWith('file://')
    ) {
      return fallback;
    }
    
    // Check for broken URLs containing literal 'undefined' or 'null' as path segments
    if (trimmed.includes('/undefined') || trimmed.includes('/null')) {
      return fallback;
    }
    
    // Automatic localhost replacement for local backend media
    if (trimmed.includes('localhost') || trimmed.includes('127.0.0.1')) {
      trimmed = trimmed.replace('localhost', LOCAL_IP).replace('127.0.0.1', LOCAL_IP);
    }
    
    // Ensure URL has a protocol
    if (trimmed.startsWith('//')) {
      trimmed = `https:${trimmed}`;
    }

    // Fix for migrated Cloudinary accounts
    if (trimmed.includes('res.cloudinary.com/dh3oqqhao')) {
      trimmed = trimmed.replace('res.cloudinary.com/dh3oqqhao', 'res.cloudinary.com/ddu1prt7s');
    }

    // If it's a relative path starting with /

    if (trimmed.startsWith('/')) {
        // Port mapping based on path heuristics:
        // - /api/user or /api/tickets -> 5005 (wie-user-service)
        // - /api/connection -> 5012 (connection-service)
        // - /api/flux, /api/post, /api/diary -> 5010 (wie-media-service)
        
        let port = '5010'; // default to media
        if (trimmed.includes('/api/user') || trimmed.includes('/api/tickets')) {
            port = '5005';
        } else if (trimmed.includes('/api/connection')) {
            port = '5012';
        }
        
        trimmed = `http://${LOCAL_IP}:${port}${trimmed}`;
    }
    
    // Ensure it looks like a valid URI for expo-image
    if (!trimmed.startsWith('http') && !trimmed.startsWith('data:') && !trimmed.startsWith('file:')) {
        // If it contains a dot and a slash, it's likely a path like "uploads/image.jpg"
        if (trimmed.includes('/') && trimmed.includes('.')) {
             // Default to media service for uploads
             trimmed = `http://${LOCAL_IP}:5010/${trimmed}`;
        } else {
             // Could be a Cloudinary public ID, but without cloud name we can't do much
             // Return as is and let expo-image try or fail
             return { uri: trimmed };
        }
    }
    
    return { uri: trimmed };
  }

  // If it's an object (e.g. { uri: '...' })
  if (typeof source === 'object' && source.uri) {
    if (!source.uri || source.uri === '' || source.uri.includes('undefined')) {
      return fallback;
    }

    let uri = source.uri;
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      uri = uri.replace('localhost', LOCAL_IP).replace('127.0.0.1', LOCAL_IP);
    }

    // Fix for migrated Cloudinary accounts
    if (uri.includes('res.cloudinary.com/dh3oqqhao')) {
      uri = uri.replace('res.cloudinary.com/dh3oqqhao', 'res.cloudinary.com/ddu1prt7s');
    }

    return { ...source, uri };
  }

  return fallback;
};

/**
 * Specifically for media content (posts, stories) where we might want a different
 * placeholder than a user avatar.
 */
export const getMediaSource = (source: any) => {
    return getImageSource(source, null);
};
