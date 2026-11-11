import { supabase, isSupabaseConfigured } from './supabase';

const BUCKET_NAME = 'learnhub-media';

export const storageService = {
  /**
   * Validate image file size and MIME type
   */
  validateImage(file, maxSizeMB = 5) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid image type (${file.type}). Allowed formats: JPG, PNG, WebP.`);
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds limit of ${maxSizeMB}MB.`);
    }

    return true;
  },

  /**
   * Upload an image to Supabase Storage with unique filename
   */
  async uploadImage(file, folder = 'general') {
    this.validateImage(file);

    if (isSupabaseConfigured && supabase) {
      const ext = file.name.split('.').pop() || 'png';
      const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uniqueName = `${cleanFolder}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(uniqueName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(data.path);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
        name: file.name,
      };
    }

    // Standalone mock mode: convert file to persistent Data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result,
          path: `mock/${Date.now()}-${file.name}`,
          name: file.name,
        });
      };
      reader.onerror = (err) => reject(new Error('Failed to read local file: ' + err));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Check if URL syntax is valid
   */
  isValidUrl(urlString) {
    try {
      const url = new URL(urlString);
      return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
    } catch {
      return false;
    }
  },
};
