import { checkBucketExists } from './storage';

export const resolveImageUrl = (path: string, bucket: string, supabase: any): string => {
  if (!path) return '';
  
  // Return external URLs as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Handle local images
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? `https://p2enjoy.studio${path}` : `https://p2enjoy.studio/${path}`;
  }
  
  // For Supabase storage, return the public URL (this will handle bucket not found gracefully)
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.warn(`Failed to get public URL for ${path} in bucket ${bucket}:`, error);
    return '';
  }
};

/**
 * Resolve image URL with error handling and fallback
 */
export const resolveImageUrlSafe = async (
  path: string, 
  bucket: string, 
  supabase: any,
  fallbackUrl: string = ''
): Promise<string> => {
  if (!path) return fallbackUrl;
  
  // Return external URLs as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Handle local images
  if (path.startsWith('/images/') || path.startsWith('images/')) {
    return path.startsWith('/') ? `https://p2enjoy.studio${path}` : `https://p2enjoy.studio/${path}`;
  }
  
  // Check if bucket exists before trying to get URL
  try {
    const bucketExists = await checkBucketExists(bucket);
    if (!bucketExists) {
      console.warn(`Storage bucket '${bucket}' not found. Using fallback.`);
      return fallbackUrl;
    }
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.warn(`Failed to resolve image URL for ${path} in bucket ${bucket}:`, error);
    return fallbackUrl;
  }
};