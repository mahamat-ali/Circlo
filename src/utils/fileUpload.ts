import { SupabaseClient } from '@supabase/supabase-js';

export type FileUploadType = 'avatar' | 'product' | 'video';

export interface FileUploadOptions {
  userId: string;
  fileBuffer: ArrayBuffer;
  contentType: string;
  uploadType: FileUploadType;
  customFileName?: string;
}

/**
 * Convert blob to ArrayBuffer for React Native compatibility
 * @param {Blob} blob - The blob to convert
 * @returns {Promise<ArrayBuffer>} The ArrayBuffer
 */
const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
};

/**
 * Generic file upload utility for Supabase Storage
 * Supports uploading avatars, product images, and videos
 *
 * @param {SupabaseClient} client - The Supabase client instance
 * @param {FileUploadOptions} options - Upload configuration options
 * @returns {Promise<string>} The public URL of the uploaded file
 */
export const uploadFile = async (
  client: SupabaseClient,
  options: FileUploadOptions
): Promise<string> => {
  const { userId, fileBuffer, contentType, uploadType, customFileName } = options;
  
  const fileExt = contentType.split('/')[1] || 'jpeg';
  const timestamp = Date.now();
  
  // Generate filename based on upload type
  let fileName: string;
  if (customFileName) {
    fileName = `${customFileName}.${fileExt}`;
  } else {
    switch (uploadType) {
      case 'avatar':
        fileName = `avatar-${userId}-${timestamp}.${fileExt}`;
        break;
      case 'product':
        fileName = `product-${userId}-${timestamp}.${fileExt}`;
        break;
      case 'video':
        fileName = `video-${userId}-${timestamp}.${fileExt}`;
        break;
      default:
        fileName = `file-${userId}-${timestamp}.${fileExt}`;
    }
  }
  
  // Create folder structure: userId/fileName
  const filePath = `${userId}/${fileName}`;
  
  // Determine storage bucket based on upload type
  const bucket = getBucketName(uploadType);
  
  const { data, error } = await client.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = client.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

/**
 * Get the appropriate storage bucket name based on file type
 * @param {FileUploadType} uploadType - The type of file being uploaded
 * @returns {string} The bucket name
 */
const getBucketName = (uploadType: FileUploadType): string => {
  switch (uploadType) {
    case 'avatar':
      return 'avatars';
    case 'product':
      return 'products';
    case 'video':
      return 'products'; // Use products bucket for videos as well
    default:
      return 'products';
  }
};

/**
 * Upload avatar image (backward compatibility)
 * @param {SupabaseClient} client - The Supabase client instance
 * @param {string} userId - The user ID
 * @param {ArrayBuffer | Blob} fileData - The file data (ArrayBuffer or Blob)
 * @param {string} contentType - The MIME type
 * @returns {Promise<string>} The public URL
 */
export const uploadAvatar = async (
  client: SupabaseClient,
  userId: string,
  fileData: ArrayBuffer | Blob,
  contentType: string
): Promise<string> => {
  let fileBuffer: ArrayBuffer;
  
  if (fileData instanceof ArrayBuffer) {
    fileBuffer = fileData;
  } else {
    // Convert Blob to ArrayBuffer for React Native compatibility
    fileBuffer = await blobToArrayBuffer(fileData);
  }
  
  return uploadFile(client, {
    userId,
    fileBuffer,
    contentType,
    uploadType: 'avatar'
  });
};

/**
 * Upload product image
 * @param {SupabaseClient} client - The Supabase client instance
 * @param {string} userId - The user ID
 * @param {ArrayBuffer | Blob} fileData - The file data (ArrayBuffer or Blob)
 * @param {string} contentType - The MIME type
 * @param {string} customFileName - Optional custom filename
 * @returns {Promise<string>} The public URL
 */
export const uploadProductImage = async (
  client: SupabaseClient,
  userId: string,
  fileData: ArrayBuffer | Blob,
  contentType: string,
  customFileName?: string
): Promise<string> => {
  let fileBuffer: ArrayBuffer;
  
  if (fileData instanceof ArrayBuffer) {
    fileBuffer = fileData;
  } else {
    // Convert Blob to ArrayBuffer for React Native compatibility
    fileBuffer = await blobToArrayBuffer(fileData);
  }
  
  return uploadFile(client, {
    userId,
    fileBuffer,
    contentType,
    uploadType: 'product',
    customFileName
  });
};

/**
 * Upload video file
 * @param {SupabaseClient} client - The Supabase client instance
 * @param {string} userId - The user ID
 * @param {ArrayBuffer | Blob} fileData - The file data (ArrayBuffer or Blob)
 * @param {string} contentType - The MIME type
 * @param {string} customFileName - Optional custom filename
 * @returns {Promise<string>} The public URL
 */
export const uploadVideo = async (
  client: SupabaseClient,
  userId: string,
  fileData: ArrayBuffer | Blob,
  contentType: string,
  customFileName?: string
): Promise<string> => {
  let fileBuffer: ArrayBuffer;
  
  if (fileData instanceof ArrayBuffer) {
    fileBuffer = fileData;
  } else {
    // Convert Blob to ArrayBuffer for React Native compatibility
    fileBuffer = await blobToArrayBuffer(fileData);
  }
  
  return uploadFile(client, {
    userId,
    fileBuffer,
    contentType,
    uploadType: 'video',
    customFileName
  });
};