import { supabase } from "@/integrations/supabase/client";

export const PHOTO_BUCKET = "profile-photos";

/** Upload a photo for the signed-in user; returns the storage path. */
export const uploadProfilePhoto = async (userId: string, file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  return path;
};

/** Turn storage paths into temporary viewable URLs. */
export const signPhotoPaths = async (paths: string[]): Promise<Record<string, string>> => {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  data.forEach((entry) => {
    if (entry.signedUrl && entry.path) map[entry.path] = entry.signedUrl;
  });
  return map;
};

export const signPhotoPath = async (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const map = await signPhotoPaths([path]);
  return map[path] ?? null;
};
