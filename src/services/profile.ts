import { SupabaseClient } from '@supabase/supabase-js';

// ... (existing Profile and ProfileUpdate types) ...

/**
 * Uploads a file (e.g., avatar) to Supabase Storage from an ArrayBuffer.
 *
 * @param {SupabaseClient} client - The Supabase client instance.
 * @param {string} userId - The Clerk user ID (e.g., 'user_abc...').
 * @param {ArrayBuffer} fileBuffer - The ArrayBuffer of the file.
 * @param {string} contentType - The MIME type of the file (e.g., 'image/png').
 * @returns {Promise<string>} The public URL of the uploaded file.
 */

export const uploadAvatar = async (
  client: SupabaseClient,
  userId: string,
  fileBuffer: ArrayBuffer,
  contentType: string
): Promise<string> => {
  const fileExt = contentType.split("/")[1] || "jpeg";
  const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`; // This creates the folder structure

  const { data, error } = await client.storage
    .from("avatars")
    .upload(filePath, fileBuffer, {
      contentType: contentType,
      upsert: true,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = client.storage
    .from("avatars")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};