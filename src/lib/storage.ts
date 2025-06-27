import { supabase } from './supabase';

export const STORAGE_BUCKETS = {
  partners: 'partners',
  events: 'events',
  media: 'media'
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];

/**
 * Initialize storage buckets if they don't exist
 */
export const initializeStorageBuckets = async () => {
  const results = [];
  
  for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
    try {
      // Check if bucket exists by trying to list files (this will fail if bucket doesn't exist)
      const { error: listError } = await supabase.storage.from(bucketName).list('', { limit: 1 });
      
      if (listError && listError.message.includes('Bucket not found')) {
        // Try to create the bucket
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 1024 * 1024 * 5 // 5MB
        });
        
        if (createError) {
          console.warn(`Failed to create bucket ${bucketName}:`, createError);
          results.push({ bucket: bucketName, status: 'failed', error: createError });
        } else {
          console.log(`Successfully created bucket: ${bucketName}`);
          results.push({ bucket: bucketName, status: 'created' });
        }
      } else if (listError) {
        console.warn(`Error checking bucket ${bucketName}:`, listError);
        results.push({ bucket: bucketName, status: 'error', error: listError });
      } else {
        results.push({ bucket: bucketName, status: 'exists' });
      }
    } catch (error) {
      console.warn(`Failed to initialize bucket ${bucketName}:`, error);
      results.push({ bucket: bucketName, status: 'failed', error });
    }
  }
  
  return results;
};

/**
 * Check if a specific bucket exists
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucketName).list('', { limit: 1 });
    return !error || !error.message.includes('Bucket not found');
  } catch (error) {
    return false;
  }
};

/**
 * Upload file to storage bucket with error handling
 */
export const uploadFile = async (
  bucketName: string, 
  fileName: string, 
  file: File
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    // Check if bucket exists first
    const bucketExists = await checkBucketExists(bucketName);
    if (!bucketExists) {
      // Try to initialize the bucket
      await initializeStorageBuckets();
    }

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, { upsert: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: data.path };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown upload error' 
    };
  }
};