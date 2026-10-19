import { supabase } from './supabase';

const BUCKET = 'crm-files';

// Uploads a file to the crm-files bucket and returns its public URL.
export async function uploadFile(file, folder) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file);
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
