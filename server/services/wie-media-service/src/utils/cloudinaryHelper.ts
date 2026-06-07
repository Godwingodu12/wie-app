import { uploadToCloudinary, deleteFromCloudinary, detectMediaType } from '../middlewares/upload';

export interface MediaUploadResult {
  url: string;
  publicId: string;
  mediaType: 'image' | 'video' | 'raw';
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
}

export const uploadFluxMedia = async (
  buffer: Buffer,
  mimetype: string,
  folder: string = 'WIE_MEDIA/flux'
): Promise<MediaUploadResult> => {
  const mediaType = detectMediaType(mimetype);

  const result = await uploadToCloudinary(buffer, {
    folder,
    resourceType: mediaType,
  });

  return {
    url: result.url,
    publicId: result.public_id,
    mediaType,
    format: result.format,
    bytes: result.bytes,
    width: result.width,
    height: result.height,
    duration: result.duration,
  };
};

export const uploadDiaryCover = async (
  buffer: Buffer,
  mimetype: string
): Promise<MediaUploadResult> => {
  return uploadFluxMedia(buffer, mimetype, 'WIE_MEDIA/diary_covers');
};

export const deleteFluxMedia = async (
  url: string,
  mediaType: string = 'image'
): Promise<any> => {
  if (!url || !url.includes('cloudinary.com')) return null;
  return deleteFromCloudinary(url, mediaType);
};

export const batchDeleteMedia = async (
  items: { url: string; mediaType: string }[]
): Promise<void> => {
  await Promise.allSettled(
    items.map(({ url, mediaType }) => deleteFluxMedia(url, mediaType))
  );
};