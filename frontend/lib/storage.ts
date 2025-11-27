import { supabase } from './supabase';

const BUCKET_NAME = 'deal-attachments';

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param dealId - The deal ID to organize files
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, dealId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${dealId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  console.log('📤 Uploading file:', { fileName, fileSize: file.size, fileType: file.type });
  console.log('🔧 Supabase storage URL:', supabase?.storageUrl?.toString());
  console.log('🪣 Bucket name:', BUCKET_NAME);

  try {
    console.log('⏳ Calling supabase.storage.from().upload()...');
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    console.log('📦 Upload response received');
    console.log('Data:', data);
    console.log('Error:', error);

    if (error) {
      console.error('❌ Error uploading file to storage:', error);
      console.error('Error details:', { 
        message: error.message, 
        statusCode: error.statusCode,
        error: error.error,
        cause: error.cause 
      });
      throw error;
    }

    console.log('✅ Upload successful, data:', data);

    // Get the public URL
    console.log('🔗 Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('✅ File uploaded successfully! Public URL:', publicUrl);
    return publicUrl;
  } catch (err) {
    console.error('💥 EXCEPTION in uploadFile:', err);
    throw err;
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of files to upload
 * @param dealId - The deal ID to organize files
 * @returns Array of attachment objects with URLs and metadata
 */
export async function uploadFiles(
  files: File[], 
  dealId: string
): Promise<Array<{ name: string; url: string; size: number; type: string }>> {
  const uploads = files.map(async (file) => {
    const url = await uploadFile(file, dealId);
    return {
      name: file.name,
      url,
      size: file.size,
      type: file.type,
    };
  });

  return Promise.all(uploads);
}

/**
 * Delete a file from Supabase Storage
 * @param url - The public URL of the file to delete
 */
export async function deleteFile(url: string): Promise<void> {
  // Extract the file path from the URL
  const urlParts = url.split(`/${BUCKET_NAME}/`);
  if (urlParts.length !== 2) {
    throw new Error('Invalid file URL');
  }
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }

  console.log('File deleted successfully:', filePath);
}

/**
 * Get the file extension from a filename
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if a file is an image based on its extension
 */
export function isImageFile(filename: string): boolean {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(filename: string): boolean {
  return getFileExtension(filename) === 'pdf';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
