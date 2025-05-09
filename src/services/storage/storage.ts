import { supabase } from '../supabase/client';

export const storageService = {
  async uploadAvatar(userId: string, file: { uri: string; type: string; name: string }) {
    try {
      const fileExt = file.uri.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Convert URI to Blob
      const response = await fetch(file.uri);
      const blob = await response.blob();

      // Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: publicUrl, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Error uploading avatar',
        },
      };
    }
  },

  async deleteAvatar(filePath: string) {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: {
          message: error.message || 'Error deleting avatar',
        },
      };
    }
  },
}; 